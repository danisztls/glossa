#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Catechism of the Catholic Church scraper — English and Portuguese, from vatican.va.

Sources (both are "archive" mirrors on vatican.va, an old frameset-style site):
  EN: https://www.vatican.va/archive/ENG0015/_INDEX.HTM
      IntraText Digital Library mirror. One HTML page (__P<code>.HTM) per
      subsection; heading hierarchy is embedded as bold <p> blocks at the top
      of each page. Footnote markers are <sup><a name=-CODE href=#$CODE>N</a></sup>;
      footnote content lives at the bottom of the same page, keyed by CODE.
  PT: https://www.vatican.va/archive/cathechism_po/index_new/prima-pagina-cic_po.html
      A different, coarser-grained mirror (one HTML page per *chapter*, not
      subsection). Quotations are marked with <blockquote>; footnote markers
      are plain "(N)" in running text; footnote content lives under a
      "Notas" heading at the bottom of the page, keyed by the printed number.

Both are old, sloppy HTML (unclosed tags, inconsistent capitalization,
Word-export artifacts). This scraper parses defensively: it never assumes
well-formed nesting, only that <p>...</p> and <blockquote>...</blockquote>
pairs close correctly (verified true across every page inspected).

Structure is *not* read from any declarative table of contents. Both mirrors
print every heading (Part/Section/Chapter/Article/Paragraph-marker/roman
numeral/"IN BRIEF") as a bold block directly in the content stream, in
document order, immediately before the material it introduces. This script
walks that stream once, using a small stack keyed by heading "level" to
build the structure tree, and attaches each numbered paragraph to whichever
node is deepest-open at the moment it starts.

Usage:
  uv run pipeline/scrapers/ccc.py --lang en|pt|both [--sample]

--sample restricts the crawl to two small, representative slices (the
Prologue, and the Baptism article) instead of the full 1-2865 run, per the
project's sample-first protocol. Re-runs are offline-capable: every fetched
page is cached under corpus/raw/ccc-{lang}/ and reused without a network
call.

Known source limitations (see manifest notes / final report):
  - The CCC's marginal cross-reference apparatus ("related" paragraphs,
    e.g. the print edition's small margin numbers) is described in the
    Catechism's own front matter (§18) but is NOT present anywhere in
    either archive mirror's HTML — verified by inspecting the raw markup
    around a dozen+ paragraphs in both languages. `related` is emitted as
    an empty array for every paragraph; this is a source gap, not a parser
    bug.
  - Neither mirror includes the CCC's own front-matter abbreviations table
    (LG, GS, DS, CIC, ...). Both mirrors start directly at the Prologue.
    `abbreviations.json` is emitted as an empty array pending a decision on
    sourcing it (see final report).
  - Inline italics (titles, Latin terms) are not captured — a deliberate v1
    loss, recoverable later from corpus/raw/ without re-crawling.
"""

from __future__ import annotations

import argparse
import html as ihtml
import json
import re
import sys
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

USER_AGENT = "Depositum corpus builder"
CRAWL_DELAY = 2.0  # seconds; robots.txt on vatican.va says Crawl-delay: 2

ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = ROOT / "corpus" / "raw"
WORKS_ROOT = ROOT / "corpus" / "works"

EN_BASE = "https://www.vatican.va/archive/ENG0015/"
EN_TOC_HREF = "_INDEX.HTM"
PT_BASE = "https://www.vatican.va/archive/cathechism_po/index_new/"
PT_TOC_HREF = "prima-pagina-cic_po.html"

FIRST_PARAGRAPH = 1
LAST_PARAGRAPH = 2865

MARK_OPEN, MARK_CLOSE = "⟦", "⟧"  # ⟦ ⟧


# --------------------------------------------------------------------------
# Fetching (cached, rate-limited)
# --------------------------------------------------------------------------


class Fetcher:
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._last_request = 0.0
        self.network_fetches = 0

    def fetch(self, url: str, cache_name: str) -> str:
        cache_path = self.cache_dir / cache_name
        if cache_path.exists():
            data = cache_path.read_bytes()
        else:
            elapsed = time.monotonic() - self._last_request
            if elapsed < CRAWL_DELAY:
                time.sleep(CRAWL_DELAY - elapsed)
            req = Request(url, headers={"User-Agent": USER_AGENT})
            try:
                with urlopen(req, timeout=30) as resp:
                    data = resp.read()
            except (HTTPError, URLError) as exc:
                raise RuntimeError(f"fetch failed: {url}: {exc}") from exc
            self._last_request = time.monotonic()
            self.network_fetches += 1
            cache_path.write_bytes(data)
        return data.decode("cp1252", errors="replace")


# --------------------------------------------------------------------------
# Text utilities
# --------------------------------------------------------------------------


def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = ihtml.unescape(s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


_BOLD_SPAN_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.DOTALL)


def is_full_bold(inner_html: str) -> bool:
    """True when the block's entire visible text sits inside <b>...</b> —
    the CCC's heading style. Not just "starts with <b": both mirrors also
    bold a short *prefix* of ordinary paragraphs (PT bolds just the
    paragraph number, e.g. "<b>1216.</b> Este banho..."), which must NOT
    be treated as a heading."""
    full_text = strip_tags(inner_html)
    if not full_text:
        return False
    bold_text = strip_tags(" ".join(_BOLD_SPAN_RE.findall(inner_html)))
    return bool(bold_text) and bold_text == full_text


def fold(s: str) -> str:
    """Uppercase + strip accents, for robust (typo/accent-insensitive) label matching."""
    s = unicodedata.normalize("NFKD", s.upper())
    return "".join(c for c in s if not unicodedata.combining(c))


_ROMAN_VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s: str) -> int | None:
    s = s.upper()
    if not s or any(c not in _ROMAN_VALUES for c in s):
        return None
    total, prev = 0, 0
    for ch in reversed(s):
        v = _ROMAN_VALUES[ch]
        total += -v if v < prev else v
        prev = max(prev, v)
    return total or None


def looks_like_attribution(text: str) -> bool:
    t = text.strip()
    if MARK_OPEN in t or not (t.startswith("(") and t.endswith(")")):
        return False
    words = t.strip("()").split()
    return 0 < len(words) <= 12


def is_mini_header(text: str) -> bool:
    """Heuristic for the CCC's unnumbered run-in sub-headers, e.g. EN's
    "Why the liturgy?" print in Part Two: short, no footnote, no terminal
    sentence punctuation. See module docstring / final report for caveats."""
    t = text.strip()
    if MARK_OPEN in t:
        return False
    if len(t.split()) > 8:
        return False
    return not t.endswith((".", "!", ";", ":", '"', "”", "’"))


# --------------------------------------------------------------------------
# Structure tree
# --------------------------------------------------------------------------

LEVELS = {
    "prologue": 0,
    "part": 0,
    "section": 1,
    "chapter": 2,
    "article": 3,
    "paragraph_marker": 4,
    "roman": 5,
    "bare_sub": 5,
}

KIND_MAP = {
    "prologue": "prologue",
    "part": "part",
    "section": "section",
    "chapter": "chapter",
    "article": "article",
    "paragraph_marker": "sub",
    "roman": "sub",
    "bare_sub": "sub",
    "in_brief": "in-brief",
}


class Node:
    def __init__(self, kind: str, n: int | None, title: str, level: int):
        self.kind = kind
        self.n = n
        self.title = title
        self.level = level
        self.children: list[Node] = []
        self.own: set[int] = set()
        self.span: tuple[int | None, int | None] = (None, None)

    def compute_span(self) -> tuple[int | None, int | None]:
        lo, hi = (min(self.own), max(self.own)) if self.own else (None, None)
        for child in self.children:
            clo, chi = child.compute_span()
            if clo is not None:
                lo = clo if lo is None else min(lo, clo)
                hi = chi if hi is None else max(hi, chi)
        self.span = (lo, hi)
        return self.span

    def to_dict(self) -> dict:
        d = {
            "kind": KIND_MAP[self.kind],
            "title": self.title,
            "paragraphs": [self.span[0], self.span[1]],
            "children": [c.to_dict() for c in self.children],
        }
        if self.n is not None:
            d["n"] = self.n
        return d


# --------------------------------------------------------------------------
# Paragraph assembly
# --------------------------------------------------------------------------


@dataclass
class BlockOut:
    kind: str  # "prose" | "quote"
    text: str  # text_marked (tokens still embedded)
    attribution: str | None = None

    def to_dict(self) -> dict:
        d = {"kind": self.kind, "text_marked": self.text}
        if self.attribution:
            d["attribution"] = self.attribution
        return d


@dataclass
class Paragraph:
    n: int
    in_brief: bool
    blocks: list[BlockOut] = field(default_factory=list)
    text: str = ""
    citations: list[dict] = field(default_factory=list)

    def resolve(self, footnote_table: dict[str, str], anomalies: list[str]) -> None:
        all_marked = " ".join(b.text for b in self.blocks)
        tokens = re.findall(rf"{MARK_OPEN}([0-9A-Za-z]+){MARK_CLOSE}", all_marked)
        seen: set[str] = set()
        citations = []
        for tok in tokens:
            if tok in seen:
                anomalies.append(f"paragraph {self.n}: duplicate footnote marker {tok}")
                continue
            seen.add(tok)
            if tok not in footnote_table:
                anomalies.append(
                    f"paragraph {self.n}: marker {tok} has no footnote text"
                )
            citations.append({"marker": tok, "text": footnote_table.get(tok, "")})
        self.citations = citations
        flat = re.sub(rf"{MARK_OPEN}[0-9A-Za-z]+{MARK_CLOSE}", "", all_marked)
        self.text = re.sub(r"\s+", " ", flat).strip()

    def to_dict(self) -> dict:
        return {
            "n": self.n,
            "blocks": [b.to_dict() for b in self.blocks],
            "text": self.text,
            "in_brief": self.in_brief,
            "citations": self.citations,
            "related": [],
            "notes": [],
        }


class ScrapeState:
    def __init__(self):
        self.stack: list[Node] = []
        self.root_children: list[Node] = []
        self.paragraphs: dict[int, Paragraph] = {}
        self.open_paragraph: Paragraph | None = None
        self.last_n: int | None = None
        self.gaps: list[tuple[int, int]] = []
        self.dropped: list[str] = []
        self.false_starts: list[str] = []
        self.anomalies: list[str] = []
        self.orphan_content: list[str] = []
        # The footnote table for whichever page is currently being processed.
        # A paragraph never spans two pages (verified across every mirror
        # inspected), so it's always safe to resolve citations against
        # whatever table is current at finalize time -- including when a
        # heading on the *same* page finalizes the paragraph that precedes it.
        self.current_footnote_table: dict[str, str] = {}

    # -- structure -----------------------------------------------------
    def push_heading(self, kind: str, n: int | None, title: str) -> None:
        self.finalize_open_paragraph()
        if kind == "in_brief":
            while self.stack and self.stack[-1].level >= 4:
                self.stack.pop()
            level = (self.stack[-1].level + 1) if self.stack else 4
        else:
            level = LEVELS[kind]
            while self.stack and self.stack[-1].level >= level:
                self.stack.pop()
        node = Node(kind, n, title, level)
        (self.stack[-1].children if self.stack else self.root_children).append(node)
        self.stack.append(node)

    # -- paragraphs ------------------------------------------------------
    def start_paragraph(self, n: int, kind: str, text: str) -> None:
        in_brief = bool(self.stack) and self.stack[-1].kind == "in_brief"
        para = Paragraph(n=n, in_brief=in_brief)
        para.blocks.append(BlockOut(kind, text))
        self.open_paragraph = para
        if self.stack:
            self.stack[-1].own.add(n)
        else:
            self.orphan_content.append(
                f"paragraph {n} started with no open structure node"
            )

    def add_continuation(self, kind: str, text: str) -> None:
        para = self.open_paragraph
        assert para is not None
        last = para.blocks[-1]
        if kind == "prose" and last.kind == "quote" and looks_like_attribution(text):
            last.attribution = text.strip().strip("()").strip()
            return
        if last.kind == kind:
            last.text = last.text + " " + text
        else:
            para.blocks.append(BlockOut(kind, text))

    def finalize_open_paragraph(self) -> None:
        if self.open_paragraph is None:
            return
        self.open_paragraph.resolve(self.current_footnote_table, self.anomalies)
        self.paragraphs[self.open_paragraph.n] = self.open_paragraph
        self.open_paragraph = None

    def record_gap(self, prev: int, cand: int) -> None:
        self.gaps.append((prev + 1, cand - 1))


# --------------------------------------------------------------------------
# Page block model + generic page processor
# --------------------------------------------------------------------------


@dataclass
class Block:
    is_heading: bool
    kind: str  # "prose" | "quote" (meaningless when is_heading)
    text: str


def process_page(
    blocks: list[Block],
    footnote_table: dict[str, str],
    match_label,
    number_re: re.Pattern,
    state: ScrapeState,
) -> None:
    state.current_footnote_table = footnote_table
    i, n = 0, len(blocks)
    while i < n:
        b = blocks[i]
        if b.is_heading:
            matched = match_label(b.text)
            if matched is not None:
                kind, num = matched
                title = b.text
                j = i + 1
                while (
                    j < n
                    and blocks[j].is_heading
                    and match_label(blocks[j].text) is None
                ):
                    title = title + " " + blocks[j].text
                    j += 1
                state.push_heading(kind, num, title)
                i = j
                continue
            state.push_heading("bare_sub", None, b.text)
            i += 1
            continue

        m = number_re.match(b.text)
        cand = int(m.group(1)) if m else None
        is_new = False
        rest_text = b.text
        if cand is not None:
            if state.last_n is None or cand == state.last_n + 1:
                is_new = True
                rest_text = b.text[m.end() :]
            elif cand > state.last_n + 1:
                is_new = True
                state.record_gap(state.last_n, cand)
                rest_text = b.text[m.end() :]
            # else: cand <= last_n -> false positive; fall through as continuation

        if is_new:
            state.finalize_open_paragraph()
            state.start_paragraph(cand, b.kind, rest_text)
            state.last_n = cand
        elif state.open_paragraph is None:
            if b.kind == "prose" and is_mini_header(b.text):
                state.dropped.append(b.text)
            else:
                state.orphan_content.append(b.text[:80])
        elif b.kind == "prose" and is_mini_header(b.text):
            state.dropped.append(b.text)
        else:
            state.add_continuation(b.kind, b.text)
        i += 1
    state.finalize_open_paragraph()


_LOOKS_LIKE_PARA_START_RE = re.compile(r"^\d{1,4}\s*\.?\s")


def merge_quote_blocks(blocks: list[Block]) -> list[Block]:
    out: list[Block] = []
    for blk in blocks:
        if (
            not blk.is_heading
            and blk.kind == "quote"
            and out
            and not out[-1].is_heading
            and out[-1].kind == "quote"
            and not _LOOKS_LIKE_PARA_START_RE.match(blk.text)
        ):
            out[-1] = Block(False, "quote", out[-1].text + " " + blk.text)
        else:
            out.append(blk)
    return out


# --------------------------------------------------------------------------
# EN: labels, page parsing
# --------------------------------------------------------------------------

_EN_WORD_NUM = {
    "ONE": 1,
    "TWO": 2,
    "THREE": 3,
    "FOUR": 4,
    "FIVE": 5,
    "SIX": 6,
    "SEVEN": 7,
    "EIGHT": 8,
    "NINE": 9,
    "TEN": 10,
}

_EN_LABELS = [
    ("prologue", re.compile(r"^PROLOGUE$")),
    ("part", re.compile(r"^PART\s+(ONE|TWO|THREE|FOUR|FIVE)\b")),
    ("section", re.compile(r"^SECTION\s+(ONE|TWO|THREE|FOUR|FIVE)\b")),
    ("chapter", re.compile(r"^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN)\b")),
    ("article", re.compile(r"^ARTICLE\s+(\d+)\b", re.IGNORECASE)),
    ("paragraph_marker", re.compile(r"^Paragraph\s+(\d+)\.", re.IGNORECASE)),
    ("in_brief", re.compile(r"^IN BRIEF$")),
    ("roman", re.compile(r"^([IVXLCDM]+)\.\s")),
]


def match_label_en(text: str) -> tuple[str, int | None] | None:
    for kind, pat in _EN_LABELS:
        m = pat.match(text)
        if not m:
            continue
        if kind in ("part", "section", "chapter"):
            return kind, _EN_WORD_NUM.get(m.group(1))
        if kind == "article" or kind == "paragraph_marker":
            return kind, int(m.group(1))
        if kind == "roman":
            return kind, roman_to_int(m.group(1))
        return kind, None
    return None


EN_NUMBER_RE = re.compile(r"^(\d{1,4})\s")

_EN_SUP_RE = re.compile(
    r"<sup>.*?<a\s+name=-([0-9A-Za-z]+)[^>]*>(\d+)</a>.*?</sup>", re.DOTALL
)


_EN_STRAY_BOLD_RE = re.compile(r"^\s*<b([^>]*)>\s*<p([^>]*)>")


def _en_body_and_footnotes(html_text: str) -> tuple[str, str]:
    hr_idx = html_text.find("<hr size=1 noshade>")
    rest = (
        html_text[hr_idx + len("<hr size=1 noshade>") :] if hr_idx != -1 else html_text
    )
    # The page's first heading is sometimes preceded by a stray <b> that opens
    # *before* the <p> tag and closes partway through its content (e.g.
    # "<hr...><b><p class=MsoNormal>CHAPTER ONE</b><b...></b></p>"). Reorder
    # so the <b> ends up properly nested inside the <p>, matching every other
    # heading on the page -- otherwise these pages' first heading is invisible
    # to the bold-heading detector.
    rest = _EN_STRAY_BOLD_RE.sub(lambda m: f"<p{m.group(2)}><b{m.group(1)}>", rest)
    foot_idx = rest.find("<hr size=1 width=30%")
    if foot_idx == -1:
        end_idx = rest.find("<center><br><br><hr size=1 width=70%")
        return (rest[:end_idx] if end_idx != -1 else rest), ""
    body = rest[:foot_idx]
    tail_idx = rest.find("<center><br><br><hr size=1 width=70%", foot_idx)
    foot = rest[foot_idx : tail_idx if tail_idx != -1 else None]
    return body, foot


_EN_FOOT_SPLIT_RE = re.compile(
    r"<font size=3><b><a name=\$([0-9A-Za-z]+) href=#-\1>(\d+)</a></b></font>"
    r"<font face=Verdana size=1>"
)


def _en_footnote_table(foot_html: str) -> dict[str, str]:
    parts = _EN_FOOT_SPLIT_RE.split(foot_html)
    table: dict[str, str] = {}
    for i in range(1, len(parts), 3):
        _code, num, text = parts[i], parts[i + 1], parts[i + 2]
        table[num] = strip_tags(text)
    return table


_EN_P_RE = re.compile(r"<p([^>]*)>(.*?)</p>", re.DOTALL)


def parse_page_en(html_text: str) -> tuple[list[Block], dict[str, str]]:
    body, foot_html = _en_body_and_footnotes(html_text)
    footnote_table = _en_footnote_table(foot_html)
    blocks: list[Block] = []
    for attrs_m, inner in ((m.group(1), m.group(2)) for m in _EN_P_RE.finditer(body)):
        is_quote = "margin-left" in attrs_m
        is_heading = is_full_bold(inner)
        marked = _EN_SUP_RE.sub(lambda m: f"{MARK_OPEN}{m.group(2)}{MARK_CLOSE}", inner)
        text = strip_tags(marked)
        if not text:
            continue
        blocks.append(Block(is_heading, "quote" if is_quote else "prose", text))
    return merge_quote_blocks(blocks), footnote_table


def discover_pages_en(fetcher: Fetcher) -> list[tuple[str, str]]:
    text = fetcher.fetch(EN_BASE + EN_TOC_HREF, EN_TOC_HREF)
    hrefs = re.findall(r"href=(__P\w+\.HTM)", text)
    seen: set[str] = set()
    ordered = [h for h in hrefs if not (h in seen or seen.add(h))]
    return [(EN_BASE + h, h) for h in ordered]


# --------------------------------------------------------------------------
# PT: labels, page parsing
# --------------------------------------------------------------------------

_PT_WORD_NUM = {
    "PRIMEIRA": 1,
    "SEGUNDA": 2,
    "TERCEIRA": 3,
    "QUARTA": 4,
    "QUINTA": 5,
    "PRIMEIRO": 1,
    "SEGUNDO": 2,
    "TERCEIRO": 3,
    "QUARTO": 4,
    "QUINTO": 5,
}

_PT_LABELS = [
    ("prologue", re.compile(r"^PROLOGO$")),
    ("part", re.compile(r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+PARTE\b")),
    ("section", re.compile(r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+SECCAO\b")),
    (
        "chapter",
        re.compile(r"^CAPI?TULO\s+(PRIMEIRO|SEGUNDO|TERCEIRO|QUARTO|QUINTO)\b"),
    ),
    ("article", re.compile(r"^ARTIGO\s+([IVXL\d]+)\b")),
    ("paragraph_marker", re.compile(r"^PARAGRAFO\s+(\d+)\b")),
    ("in_brief", re.compile(r"^RESUMINDO:?$")),
    ("roman", re.compile(r"^([IVXLCDM]+)\.?\s")),
]


def match_label_pt(original_text: str) -> tuple[str, int | None] | None:
    folded = fold(original_text)
    for kind, pat in _PT_LABELS:
        m = pat.match(folded)
        if not m:
            continue
        if kind in ("part", "section", "chapter"):
            return kind, _PT_WORD_NUM.get(m.group(1))
        if kind == "article":
            g = m.group(1)
            return kind, int(g) if g.isdigit() else (roman_to_int(g) or 1)
        if kind == "paragraph_marker":
            return kind, int(m.group(1))
        if kind == "roman":
            return kind, roman_to_int(m.group(1))
        return kind, None
    return None


PT_NUMBER_RE = re.compile(r"^(\d{1,4})\.?\s+")
_PT_MARKER_RE = re.compile(r"\((\d{1,3})\)")


def _pt_body(html_text: str) -> tuple[str, str]:
    starts = [m.start() for m in re.finditer(r'<td[^>]*valign="top">', html_text)]
    if not starts:
        return html_text, ""
    ends = [
        m.start()
        for m in re.finditer(
            r'</td>\s*</tr>\s*<tr>\s*<td align="center" valign="middle">', html_text
        )
    ]
    body = html_text[starts[0] : (ends[-1] if ends else len(html_text))]
    # The footnote list starts right after the page's one <hr/>. Small
    # front-matter pages (e.g. the Prologue) label it "<p><b>Notas</b></p>"
    # first; most chapter pages have no label at all and go straight into
    # "<p>1. ...</p>". Split on the <hr/> itself so both forms work, then
    # drop the label if present.
    hr_m = re.search(r"<hr\s*/?>", body)
    if not hr_m:
        return body, ""
    content, foot = body[: hr_m.start()], body[hr_m.end() :]
    foot = re.sub(
        r"^\s*<p>\s*<b>\s*Notas\s*</b>\s*</p>", "", foot, count=1, flags=re.IGNORECASE
    )
    return content, foot


_PT_FOOTNOTE_NUM_RE = re.compile(r"^(\d{1,3})\s*\.?\s*(.*)$", re.DOTALL)


def _pt_footnote_table(foot_html: str) -> dict[str, str]:
    table: dict[str, str] = {}
    for m in _PT_INNER_P_RE.finditer(foot_html):
        text = strip_tags(m.group(1))
        num_m = _PT_FOOTNOTE_NUM_RE.match(text)
        if num_m:
            table[num_m.group(1)] = num_m.group(2).strip()
    return table


_PT_BLOCK_RE = re.compile(
    r"<blockquote>(.*?)</blockquote>|<p([^>]*)>(.*?)</p>", re.DOTALL
)
_PT_INNER_P_RE = re.compile(r"<p[^>]*>(.*?)</p>", re.DOTALL)


def _pt_mark(text: str) -> str:
    return _PT_MARKER_RE.sub(lambda mm: f"{MARK_OPEN}{mm.group(1)}{MARK_CLOSE}", text)


def parse_page_pt(html_text: str) -> tuple[list[Block], dict[str, str]]:
    body, foot_html = _pt_body(html_text)
    footnote_table = _pt_footnote_table(foot_html)
    blocks: list[Block] = []
    last_end = 0
    for m in _PT_BLOCK_RE.finditer(body):
        # Content that isn't wrapped in <p> or <blockquote> at all -- seen at
        # least once (a bare "<b>17. </b>text..." run sitting directly in the
        # cell, no enclosing <p>). Recover it as its own prose block rather
        # than silently dropping a whole paragraph.
        gap = body[last_end : m.start()]
        gap_text = strip_tags(gap)
        if gap_text:
            blocks.append(Block(is_full_bold(gap), "prose", _pt_mark(gap_text)))
        last_end = m.end()

        bq, _attrs, p_inner = m.group(1), m.group(2), m.group(3)
        if bq is not None:
            # A <blockquote> is usually one continuous set-off quotation, but
            # this mirror also wraps ordinary small-print *numbered*
            # paragraphs in <blockquote> (e.g. CCC §§20-22, which describe
            # the small-print convention itself). Emit one block per inner
            # <p> rather than pre-joining them, so a numbered paragraph
            # starting mid-blockquote is still recognized as a new
            # paragraph; merge_quote_blocks re-joins genuine multi-line
            # quotations afterwards.
            for pm in _PT_INNER_P_RE.finditer(bq):
                piece = strip_tags(pm.group(1))
                if piece:
                    blocks.append(Block(False, "quote", _pt_mark(piece)))
            continue
        is_heading = is_full_bold(p_inner)
        text = strip_tags(p_inner)
        if not text:
            continue
        blocks.append(Block(is_heading, "prose", _pt_mark(text)))
    return merge_quote_blocks(blocks), footnote_table


def discover_pages_pt(fetcher: Fetcher) -> list[tuple[str, str]]:
    text = fetcher.fetch(PT_BASE + PT_TOC_HREF, PT_TOC_HREF)
    hrefs = re.findall(r'href="([^"]+)"', text)
    ordered: list[str] = []
    seen: set[str] = set()
    for h in hrefs:
        if not h.endswith("_po.html"):
            continue
        if h.startswith("index-") or h == "indice_po.html":
            continue
        if h in seen:
            continue
        seen.add(h)
        ordered.append(h)
    return [(PT_BASE + h, h) for h in ordered]


# --------------------------------------------------------------------------
# Sample-mode chunk selection
# --------------------------------------------------------------------------

EN_SAMPLE_PROLOGUE_END = "__P7.HTM"
EN_SAMPLE_BAPTISM_START = "__P3G.HTM"
EN_SAMPLE_BAPTISM_END = "__P3O.HTM"

PT_SAMPLE_PROLOGUE = "prologo%201-25_po.html"
PT_SAMPLE_BAPTISM = "p2s2cap1_1210-1419_po.html"


def sample_chunks_en(pages: list[tuple[str, str]]) -> list[list[tuple[str, str]]]:
    names = [n for _, n in pages]
    prologue_end = names.index(EN_SAMPLE_PROLOGUE_END)
    bap_start = names.index(EN_SAMPLE_BAPTISM_START)
    bap_end = names.index(EN_SAMPLE_BAPTISM_END)
    return [pages[: prologue_end + 1], pages[bap_start : bap_end + 1]]


def sample_chunks_pt(pages: list[tuple[str, str]]) -> list[list[tuple[str, str]]]:
    by_name = {n: (u, n) for u, n in pages}
    return [[by_name[PT_SAMPLE_PROLOGUE]], [by_name[PT_SAMPLE_BAPTISM]]]


# --------------------------------------------------------------------------
# Orchestration
# --------------------------------------------------------------------------

LANG_CONFIG = {
    "en": {
        "discover": discover_pages_en,
        "parse": parse_page_en,
        "match_label": match_label_en,
        "number_re": EN_NUMBER_RE,
        "sample_chunks": sample_chunks_en,
        "raw_dir": "ccc-en",
        "work_id": "ccc.en",
        "title": "Catechism of the Catholic Church",
        "base_url": EN_BASE,
        "copyright_holder": "Libreria Editrice Vaticana / United States Catholic Conference",
        "copyright_notice": (
            '"CATECHISM OF THE CATHOLIC CHURCH, SECOND EDITION, Copyright © 2000, '
            'Libreria Editrice Vaticana - United States Catholic Conference, Inc."'
        ),
    },
    "pt": {
        "discover": discover_pages_pt,
        "parse": parse_page_pt,
        "match_label": match_label_pt,
        "number_re": PT_NUMBER_RE,
        "sample_chunks": sample_chunks_pt,
        "raw_dir": "ccc-pt",
        "work_id": "ccc.pt",
        "title": "Catecismo da Igreja Católica",
        "base_url": PT_BASE,
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
}


def run_scrape(
    lang: str, sample: bool
) -> tuple[ScrapeState, list[tuple[str, str]], Fetcher]:
    cfg = LANG_CONFIG[lang]
    fetcher = Fetcher(RAW_ROOT / cfg["raw_dir"])
    all_pages = cfg["discover"](fetcher)
    chunks = cfg["sample_chunks"](all_pages) if sample else [all_pages]

    state = ScrapeState()
    fetched_pages: list[tuple[str, str]] = []
    for chunk in chunks:
        state.last_n = None  # each sample chunk is validated independently
        state.stack = []
        for url, name in chunk:
            html_text = fetcher.fetch(url, name)
            fetched_pages.append((url, name))
            blocks, footnote_table = cfg["parse"](html_text)
            process_page(
                blocks, footnote_table, cfg["match_label"], cfg["number_re"], state
            )
        state.finalize_open_paragraph()
        # close remaining open structure nodes at end of chunk
        state.stack = []
    return state, fetched_pages, fetcher


# --------------------------------------------------------------------------
# Output + validation
# --------------------------------------------------------------------------

_MOJIBAKE_PATTERNS = ["Ã©", "Ã§", "â€™", "â€", "Ã³"]


def validate(lang: str, state: ScrapeState, sample: bool) -> tuple[bool, list[str]]:
    problems: list[str] = []
    paragraphs = state.paragraphs

    if not sample:
        missing = [
            n for n in range(FIRST_PARAGRAPH, LAST_PARAGRAPH + 1) if n not in paragraphs
        ]
        if missing:
            problems.append(
                f"missing paragraphs: {missing[:20]}{'...' if len(missing) > 20 else ''}"
            )
        spans = []
        for node in state.root_children:
            node.compute_span()
            spans.append((node.title, node.span))
        prev_hi = FIRST_PARAGRAPH - 1
        for title, (lo, hi) in spans:
            if lo is None:
                problems.append(f"top-level node {title!r} has no paragraphs")
                continue
            if lo != prev_hi + 1:
                problems.append(
                    f"top-level gap before {title!r}: expected {prev_hi + 1}, got {lo}"
                )
            prev_hi = hi
        if prev_hi != LAST_PARAGRAPH:
            problems.append(
                f"top-level coverage ends at {prev_hi}, expected {LAST_PARAGRAPH}"
            )
    else:
        for node in state.root_children:
            node.compute_span()

    for n, para in sorted(paragraphs.items()):
        for block in para.blocks:
            if "<" in block.text or ">" in block.text:
                problems.append(f"paragraph {n}: leftover markup in block text")
            if "�" in block.text:
                problems.append(f"paragraph {n}: replacement character present")
            for pat in _MOJIBAKE_PATTERNS:
                if pat in block.text:
                    problems.append(f"paragraph {n}: mojibake pattern {pat!r}")
            if "  " in block.text:
                problems.append(f"paragraph {n}: double space in block text")
        if "  " in para.text:
            problems.append(f"paragraph {n}: double space in flat text")
        tokens = re.findall(
            rf"{MARK_OPEN}([0-9A-Za-z]+){MARK_CLOSE}",
            " ".join(b.text for b in para.blocks),
        )
        markers = [c["marker"] for c in para.citations]
        if sorted(tokens) != sorted(markers):
            problems.append(
                f"paragraph {n}: token/citation mismatch {tokens} vs {markers}"
            )
        recombined = re.sub(
            rf"{MARK_OPEN}[0-9A-Za-z]+{MARK_CLOSE}",
            "",
            " ".join(b.text for b in para.blocks),
        )
        recombined = re.sub(r"\s+", " ", recombined).strip()
        if recombined != para.text:
            problems.append(f"paragraph {n}: text != text_marked minus tokens")
        for rel in para.to_dict()["related"]:
            if not (FIRST_PARAGRAPH <= rel <= LAST_PARAGRAPH):
                problems.append(f"paragraph {n}: related value {rel} out of range")

    def check_titles(node: Node):
        if not node.title.strip():
            problems.append(f"node kind={node.kind} n={node.n} has empty title")
        for c in node.children:
            check_titles(c)

    for node in state.root_children:
        check_titles(node)

    return (len(problems) == 0), problems


def build_manifest(
    lang: str, state: ScrapeState, fetched_pages: list[tuple[str, str]], sample: bool
) -> dict:
    cfg = LANG_CONFIG[lang]
    notes = [
        (
            "Marginal cross-reference apparatus ('related' field) is absent from this "
            "vatican.va archive mirror's HTML in every paragraph inspected (checked EN/PT "
            "paragraphs 1, 4, 23-25, 1066-1075, 1213-1228, plus the front matter passage "
            "describing the apparatus, §18/PROLOGUE§V for EN); emitted as [] for all "
            "paragraphs pending a better source."
        ),
        (
            "The CCC's own front-matter abbreviations table (LG, GS, DS, CIC, ...) was not "
            "found in either archive mirror (both start directly at the Prologue); "
            "abbreviations.json is empty pending a decision on sourcing it (candidate: the "
            "separate Compendium document, a different LEV publication, not yet in scope)."
        ),
        (
            "Inline italics (titles, Latin terms) are not captured in v1 -- recoverable "
            "later from corpus/raw/ without re-crawling."
        ),
    ]
    if state.gaps:
        notes.append(f"source paragraph-number gaps detected: {state.gaps}")
    if sample:
        notes.insert(
            0,
            "SAMPLE RUN -- partial corpus, for review only. Not the full 1-2865 crawl.",
        )
    manifest = {
        "id": cfg["work_id"],
        "type": "catechism",
        "title": cfg["title"],
        "short_title": "CCC",
        "language": lang,
        "edition": "vatican.va archive mirror, 1993/1997 second typical edition text",
        "sources": [
            {
                "url": url,
                "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            }
            for url, _ in fetched_pages
        ],
        "copyright": {
            "status": "copyrighted",
            "holder": cfg["copyright_holder"],
            "notice": cfg["copyright_notice"],
        },
        "notes": " ".join(notes),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    return manifest


def write_outputs(
    lang: str, state: ScrapeState, fetched_pages: list[tuple[str, str]], sample: bool
) -> None:
    out_dir = WORKS_ROOT / LANG_CONFIG[lang]["work_id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    for node in state.root_children:
        node.compute_span()
    structure = [n.to_dict() for n in state.root_children]
    paragraphs = [state.paragraphs[n].to_dict() for n in sorted(state.paragraphs)]
    manifest = build_manifest(lang, state, fetched_pages, sample)

    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    )
    (out_dir / "structure.json").write_text(
        json.dumps(structure, indent=2, ensure_ascii=False) + "\n"
    )
    (out_dir / "paragraphs.json").write_text(
        json.dumps(paragraphs, indent=2, ensure_ascii=False) + "\n"
    )
    (out_dir / "abbreviations.json").write_text(
        json.dumps([], indent=2, ensure_ascii=False) + "\n"
    )


def print_summary(lang: str, state: ScrapeState, ok: bool, problems: list[str]) -> None:
    paragraphs = state.paragraphs
    kind_counts: dict[str, int] = {}

    def walk(node: Node):
        kind_counts[node.kind] = kind_counts.get(node.kind, 0) + 1
        for c in node.children:
            walk(c)

    for n in state.root_children:
        walk(n)
    n_citations = sum(len(p.citations) for p in paragraphs.values())
    n_quote_blocks = sum(
        1 for p in paragraphs.values() for b in p.blocks if b.kind == "quote"
    )

    print(f"\n=== {lang.upper()} summary ===")
    print(f"paragraphs captured: {len(paragraphs)}")
    print(f"structure node counts by kind: {kind_counts}")
    print(f"total citations: {n_citations}")
    print(f"quote blocks: {n_quote_blocks}")
    print(
        "paragraphs with marginal 'related' refs: 0 (apparatus absent from source; see manifest notes)"
    )
    print(f"source gaps recorded: {state.gaps}")
    print(f"dropped mini-headers: {len(state.dropped)} -> {state.dropped}")
    if state.false_starts:
        print(f"false paragraph-number starts: {state.false_starts}")
    if state.orphan_content:
        print(f"orphan content (no open structure/paragraph): {state.orphan_content}")
    if state.anomalies:
        print(f"anomalies: {state.anomalies}")
    print(f"VALIDATION: {'PASS' if ok else 'FAIL'}")
    for p in problems:
        print(f"  - {p}")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--lang", choices=["en", "pt", "both"], default="both")
    ap.add_argument(
        "--sample",
        action="store_true",
        help="process only the Prologue + Baptism article slices",
    )
    args = ap.parse_args()

    langs = ["en", "pt"] if args.lang == "both" else [args.lang]
    overall_ok = True
    for lang in langs:
        state, fetched_pages, fetcher = run_scrape(lang, args.sample)
        write_outputs(lang, state, fetched_pages, args.sample)
        ok, problems = validate(lang, state, args.sample)
        print_summary(lang, state, ok, problems)
        print(f"(network fetches this run: {fetcher.network_fetches})")
        overall_ok = overall_ok and ok

    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
