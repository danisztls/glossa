#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Compendium of the Catechism of the Catholic Church (2005) scraper —
English and Portuguese, from vatican.va.

Sources (each language is a single long HTML page, not a multi-page mirror):
  EN: https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_en.html
  PT: https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_po.html

Both pages carry the full document: front matter (Motu Proprio, Introduction
-- unnumbered, out of scope, see notes), the 598 numbered Q&A items grouped
under a Part/Section/Chapter hierarchy, and an Appendix (common prayers +
doctrinal formulas, deferred -- see notes). Old, sloppy Word-export HTML
(unclosed tags, inconsistent casing), but internally very regular for the
Q&A stream itself: every question is printed as

    <p><b>N. Question text?</b></p>
    <p>RAW CCC PARAGRAPH REFERENCE STRING</p>
    <p>answer prose...</p> [ <blockquote>quote (Attribution)</blockquote> ]

with the reference string always the paragraph immediately after the
question, and an optional set-off <blockquote> (with the attribution
inline, in trailing parentheses) as the last block of the answer.

This script parses each page as a flat stream of top-level <p> and
<blockquote> blocks (verified non-nested across every block inspected). A
small stack keyed by heading level builds the Part/Section/Chapter tree,
question numbers attach to whichever node is deepest-open, and content
between "<a name="INTRODUCTION">" and "<a name="APPENDIX">" (EN) / the
Portuguese equivalents is the only region walked -- this cleanly skips the
page's own table of contents (which repeats every heading as a same-text
"#anchor" link, and would otherwise be misparsed as duplicate headings) and
the unnumbered front matter.

Usage:
  uv run pipeline/scrapers/compendium.py --lang en|pt|both

No --sample mode: the source is one page per language (598 questions
total), small enough to run in full every time; re-runs are offline-capable
via corpus/raw/compendium-{lang}/.

Known source limitations (see manifest notes / final report):
  - The Appendix's Part A (common prayers) is now parsed separately by
    pipeline/scrapers/prayers.py into prayer.common.{en,pt} -- a re-parse
    of this same cached raw HTML, not a re-fetch. It was NOT captured here
    because it is materially more complex than a title/body table:
    multi-paragraph cells, dialogic (V./R.) prayers, regional variants
    (UK/USA wording of five prayers, EN only), and Latin text -- present
    in BOTH languages, contrary to what an earlier version of this note
    claimed ("a Latin parallel column in EN only"): EN prints Latin as a
    side-by-side table column, PT prints the same 21 Latin texts as a
    second sequential pass after its vernacular prayers, which is why an
    earlier reading of PT's raw HTML missed them. See
    docs/research/prayers.md for the survey that found this, and
    prayers.py's own docstring for the parsing details. PT alone also
    carries a bonus "Biblical Abbreviations" table that EN lacks
    entirely; still unparsed, still not prayers. Part B (formulas of
    Catholic doctrine) is also still unparsed -- simple title/body pairs
    in both languages, but not prayers, deliberately out of scope for
    prayers.py too. None of this is part of the 598-question schema;
    deferred per corpus-schema.md's explicit allowance ("if
    straightforward, else document and defer").
  - Sacred-art images and their commentary: out of scope per project spec,
    not investigated.
  - A single decorative epigraph (a set-off quotation attributed to Saint
    Augustine, CCC ¶30, "You are great, O Lord...") is printed between the
    Chapter One heading and Question 2 in both languages, attached to no
    question. Dropped; logged as an orphan block in the run summary.
  - Generic (unlabeled) bold sub-headings under a chapter -- e.g. "The
    Symbols of Faith", "Heaven and Earth", "Man" -- are emitted as `sub`
    nodes at a fixed depth (chapter + 1) rather than reconstructing their
    true relative nesting, which the source does not mark up explicitly.
    A simplification, not a data loss: the raw HTML is untouched in
    corpus/raw/.
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

USER_AGENT = "Glossa Catholica corpus builder"
CRAWL_DELAY = 2.0  # seconds; robots.txt on vatican.va says Crawl-delay: 2

ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = ROOT / "corpus" / "raw"
WORKS_ROOT = ROOT / "corpus" / "works"

EN_URL = "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_en.html"
PT_URL = "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_po.html"

FIRST_Q = 1
LAST_Q = 598

COPYRIGHT_NOTICE = "© Copyright 2005 - Libreria Editrice Vaticana"
COPYRIGHT_HOLDER = "Libreria Editrice Vaticana"


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

_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


def strip_tags(inner: str) -> str:
    """Flatten one block's inner HTML to plain text: a printed line break
    (<br/>) becomes a space (it always separates real content -- unlike
    every other tag here, which never carries source whitespace of its
    own), every other tag is dropped with no replacement (dropping tags
    outright, rather than replacing with a space, avoids inserting spurious
    spaces at tag boundaries the source never rendered with one -- verified
    against a bold-number/bold-question split, "<b>568</b>.<b> What...",
    where a space-for-tag substitution would wrongly separate "568" from
    its period)."""
    s = _BR_RE.sub(" ", inner)
    s = _TAG_RE.sub("", s)
    s = ihtml.unescape(s)
    return _WS_RE.sub(" ", s).strip()


_BOLD_SPAN_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.DOTALL)


def is_full_bold(inner: str) -> bool:
    """True when the block's entire visible text sits inside <b>...</b>
    spans -- the Compendium's heading style for titles (though not always
    for the bare Part/Section/Chapter number line -- see match_label,
    which does not require boldness)."""
    full_text = strip_tags(inner)
    if not full_text:
        return False
    bold_text = strip_tags(" ".join(_BOLD_SPAN_RE.findall(inner)))
    return bool(bold_text) and bold_text == full_text


def fold(s: str) -> str:
    """Uppercase + strip accents, for robust (case/diacritic-insensitive)
    label matching. Length-preserving for every character used in these
    labels (single precomposed accented Latin letters), so a match end
    offset in the folded string is safe to reuse against the original."""
    s = unicodedata.normalize("NFKD", s.upper())
    return "".join(c for c in s if not unicodedata.combining(c))


_QUESTION_START_RE = re.compile(r"^(\d{1,3})\.\s+(.*)$", re.DOTALL)

# What a printed CCC-paragraph reference string looks like: digits and the
# punctuation/whitespace used to join and range them (hyphen, en/em dash,
# comma, semicolon, colon, period -- all seen verbatim in one edition or
# the other, including apparent printer's-error separators, e.g. PT Q378's
# "1804; 1810-1811: 1834, 1839"). No letters. Used only to tell a genuine
# reference line apart from a question that has none printed at all
# (source omission, e.g. PT Q555) and whose answer prose would otherwise be
# mis-captured as ccc_refs.
_REFS_LIKE_RE = re.compile(r"^[0-9,;:.\-–—\s]*$")


def match_question_start(inner: str, stripped: str) -> tuple[int, str] | None:
    if "<b>" not in inner:
        return None
    m = _QUESTION_START_RE.match(stripped)
    if not m:
        return None
    return int(m.group(1)), m.group(2).strip()


_ATTRIBUTION_RE = re.compile(r"^(.*\S)\s*\(([^()]+)\)\.?\s*$", re.DOTALL)


def split_attribution(text: str) -> tuple[str, str | None]:
    """Compendium quotations set the attribution inline, in trailing
    parentheses, at the end of the same blockquote -- e.g.
    '"..." (Saint Augustine)'. Verified against every blockquote in both
    languages (51 total): all but one (a bare Creed line, no attribution)
    match this shape."""
    m = _ATTRIBUTION_RE.match(text)
    if not m:
        return text, None
    return m.group(1).strip(), m.group(2).strip()


# --------------------------------------------------------------------------
# Structure tree
# --------------------------------------------------------------------------

LEVELS = {"part": 0, "section": 1, "chapter": 2, "sub": 3}


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
            "kind": self.kind,
            "title": self.title,
            "paragraphs": [self.span[0], self.span[1]],
            "children": [c.to_dict() for c in self.children],
        }
        if self.n is not None:
            d["n"] = self.n
        return d


# --------------------------------------------------------------------------
# Question assembly
# --------------------------------------------------------------------------


@dataclass
class BlockOut:
    kind: str  # "prose" | "quote"
    text: str
    attribution: str | None = None

    def to_dict(self) -> dict:
        d = {"kind": self.kind, "text": self.text}
        if self.attribution:
            d["attribution"] = self.attribution
        return d


@dataclass
class Question:
    n: int
    question: str
    ccc_refs: str = ""
    blocks: list[BlockOut] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "n": self.n,
            "question": self.question,
            "answer_blocks": [b.to_dict() for b in self.blocks],
            "ccc_refs": self.ccc_refs,
        }


class ScrapeState:
    def __init__(self):
        self.stack: list[Node] = []
        self.root_children: list[Node] = []
        self.questions: dict[int, Question] = {}
        self.current: Question | None = None
        self.mode: str | None = None  # None | "awaiting_refs" | "in_answer"
        self.last_n: int | None = None
        self.gaps: list[tuple[int, int]] = []
        self.dropped_orphans: list[str] = []
        self.anomalies: list[str] = []

    def push_heading(self, kind: str, n: int | None, title: str) -> None:
        self.finalize_current()
        level = LEVELS[kind]
        while self.stack and self.stack[-1].level >= level:
            self.stack.pop()
        node = Node(kind, n, title, level)
        (self.stack[-1].children if self.stack else self.root_children).append(node)
        self.stack.append(node)

    def start_question(self, n: int, question_text: str) -> None:
        self.finalize_current()
        self.current = Question(n=n, question=question_text)
        self.mode = "awaiting_refs"
        if self.stack:
            self.stack[-1].own.add(n)
        else:
            self.anomalies.append(f"question {n} started with no open structure node")

    def set_refs(self, refs: str) -> None:
        assert self.current is not None
        self.current.ccc_refs = refs
        self.mode = "in_answer"

    def add_prose(self, text: str) -> None:
        assert self.current is not None
        blocks = self.current.blocks
        if blocks and blocks[-1].kind == "prose":
            blocks[-1].text = blocks[-1].text + " " + text
        else:
            blocks.append(BlockOut("prose", text))

    def add_quote(self, text: str) -> None:
        assert self.current is not None
        quote_text, attribution = split_attribution(text)
        self.current.blocks.append(BlockOut("quote", quote_text, attribution))

    def finalize_current(self) -> None:
        if self.current is None:
            return
        if self.mode == "awaiting_refs":
            self.anomalies.append(
                f"question {self.current.n}: no reference paragraph followed it"
            )
        self.questions[self.current.n] = self.current
        self.current = None
        self.mode = None


# --------------------------------------------------------------------------
# Block extraction + generic walk
# --------------------------------------------------------------------------


@dataclass
class Block:
    is_bq: bool
    inner: str
    stripped: str


_BLOCK_RE = re.compile(
    r"<p[^>]*>((?:(?!</p>).)*?)</p>|<blockquote>((?:(?!</blockquote>).)*?)</blockquote>",
    re.DOTALL,
)


def extract_blocks(body: str) -> list[Block]:
    blocks: list[Block] = []
    for m in _BLOCK_RE.finditer(body):
        if m.group(1) is not None:
            inner = m.group(1)
            is_bq = False
        else:
            inner = m.group(2)
            is_bq = True
        stripped = strip_tags(inner)
        if not stripped:
            continue
        blocks.append(Block(is_bq, inner, stripped))
    return blocks


def process_body(body: str, cfg: dict, state: ScrapeState) -> None:
    blocks = extract_blocks(body)
    match_label = cfg["match_label"]
    i, n = 0, len(blocks)
    while i < n:
        b = blocks[i]

        if b.is_bq:
            if state.current is not None and state.mode == "in_answer":
                state.add_quote(b.stripped)
            else:
                state.dropped_orphans.append(f"blockquote: {b.stripped[:80]!r}")
            i += 1
            continue

        qstart = match_question_start(b.inner, b.stripped)
        if qstart is not None:
            cand, qtext = qstart
            expected = FIRST_Q if state.last_n is None else state.last_n + 1
            if cand == expected:
                state.start_question(cand, qtext)
                state.last_n = cand
                i += 1
                continue
            if cand > expected:
                state.gaps.append((expected, cand - 1))
                state.start_question(cand, qtext)
                state.last_n = cand
                i += 1
                continue
            # cand <= last_n: false positive (e.g. an enumerated list item
            # inside an answer that happens to start "N. "); fall through
            # and treat as ordinary content below.

        if state.mode == "awaiting_refs":
            if _REFS_LIKE_RE.match(b.stripped):
                state.set_refs(b.stripped)
                i += 1
                continue
            # The block right after this question's opener doesn't look
            # like a reference string (it has letters in it) -- a real
            # source omission seen at least once (PT Q555, which goes
            # straight from question to answer prose with no reference
            # line at all). Leave ccc_refs empty and fall through to treat
            # this same block as the start of the answer instead of
            # silently mis-capturing prose as ccc_refs.
            state.set_refs("")
            state.anomalies.append(
                f"question {state.current.n}: no reference paragraph printed "
                "after the question (source omission)"
            )

        matched = match_label(b.stripped)
        is_heading = matched is not None or is_full_bold(b.inner)
        if is_heading:
            if matched is not None:
                kind, num = matched
                title = b.stripped
                j = i + 1
                while (
                    j < n
                    and not blocks[j].is_bq
                    and match_label(blocks[j].stripped) is None
                    and is_full_bold(blocks[j].inner)
                    and match_question_start(blocks[j].inner, blocks[j].stripped)
                    is None
                ):
                    title = title + " " + blocks[j].stripped
                    j += 1
                state.push_heading(kind, num, title)
                i = j
                continue
            state.push_heading("sub", None, b.stripped)
            i += 1
            continue

        if state.current is not None and state.mode == "in_answer":
            state.add_prose(b.stripped)
        else:
            state.dropped_orphans.append(f"paragraph: {b.stripped[:80]!r}")
        i += 1

    state.finalize_current()


# --------------------------------------------------------------------------
# EN / PT label config
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
    ("part", re.compile(r"^PART\s+(ONE|TWO|THREE|FOUR|FIVE)\b")),
    ("section", re.compile(r"^SECTION\s+(ONE|TWO|THREE|FOUR|FIVE)\b")),
    (
        "chapter",
        re.compile(r"^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\b"),
    ),
]


def match_label_en(stripped: str) -> tuple[str, int | None] | None:
    folded = fold(stripped)
    for kind, pat in _EN_LABELS:
        m = pat.match(folded)
        if m:
            return kind, _EN_WORD_NUM.get(m.group(1))
    return None


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
    ("part", re.compile(r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+PARTE\b")),
    ("section", re.compile(r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+SECCAO\b")),
    (
        "chapter",
        re.compile(r"^CAPI?TULO\s+(PRIMEIRO|SEGUNDO|TERCEIRO|QUARTO|QUINTO)\b"),
    ),
]


def match_label_pt(stripped: str) -> tuple[str, int | None] | None:
    folded = fold(stripped)
    for kind, pat in _PT_LABELS:
        m = pat.match(folded)
        if m:
            return kind, _PT_WORD_NUM.get(m.group(1))
    return None


LANG_CONFIG = {
    "en": {
        "url": EN_URL,
        "raw_dir": "compendium-en",
        "cache_name": "archive_2005_compendium-ccc_en.html",
        "start_anchor": 'name="INTRODUCTION"',
        "end_anchor": 'name="APPENDIX"',
        "match_label": match_label_en,
        "work_id": "compendium.en",
        "title": "Compendium of the Catechism of the Catholic Church",
        "short_title": "Compendium",
        "edition": "2005, vatican.va HTML mirror",
    },
    "pt": {
        "url": PT_URL,
        "raw_dir": "compendium-pt",
        "cache_name": "archive_2005_compendium-ccc_po.html",
        "start_anchor": 'name="INTRODU&Ccedil;&Atilde;O"',
        "end_anchor": 'name="AP&Ecirc;NDICE"',
        "match_label": match_label_pt,
        "work_id": "compendium.pt",
        "title": "Compêndio do Catecismo da Igreja Católica",
        "short_title": "Compêndio",
        "edition": "2005, vatican.va HTML mirror",
    },
}


def run_scrape(lang: str) -> tuple[ScrapeState, Fetcher]:
    cfg = LANG_CONFIG[lang]
    fetcher = Fetcher(RAW_ROOT / cfg["raw_dir"])
    html_text = fetcher.fetch(cfg["url"], cfg["cache_name"])

    start_idx = html_text.find(cfg["start_anchor"])
    end_idx = html_text.find(cfg["end_anchor"])
    if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
        raise RuntimeError(
            f"{lang}: could not locate content boundaries "
            f"(start={start_idx}, end={end_idx}) -- source page structure may have changed"
        )
    body = html_text[start_idx:end_idx]

    state = ScrapeState()
    process_body(body, cfg, state)
    return state, fetcher


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------

_MOJIBAKE_PATTERNS = ["Ã©", "Ã§", "â€™", "â€", "Ã³", "Â"]


def validate(state: ScrapeState) -> tuple[bool, list[str], int]:
    problems: list[str] = []
    questions = state.questions

    missing = [n for n in range(FIRST_Q, LAST_Q + 1) if n not in questions]
    if missing:
        problems.append(
            f"missing questions: {missing[:20]}{'...' if len(missing) > 20 else ''}"
        )
    extra = [n for n in questions if not (FIRST_Q <= n <= LAST_Q)]
    if extra:
        problems.append(f"question numbers out of range: {extra}")

    for node in state.root_children:
        node.compute_span()
    prev_hi = FIRST_Q - 1
    for node in state.root_children:
        lo, hi = node.span
        if lo is None:
            problems.append(f"top-level node {node.title!r} has no questions")
            continue
        if lo != prev_hi + 1:
            problems.append(
                f"top-level gap before {node.title!r}: expected {prev_hi + 1}, got {lo}"
            )
        prev_hi = hi
    if prev_hi != LAST_Q:
        problems.append(f"top-level coverage ends at {prev_hi}, expected {LAST_Q}")

    refs_present = 0
    for n, q in sorted(questions.items()):
        if not q.question.strip():
            problems.append(f"question {n}: empty question text")
        if not q.blocks:
            problems.append(f"question {n}: no answer blocks")
        if q.ccc_refs.strip():
            refs_present += 1
        texts = [q.question, q.ccc_refs] + [b.text for b in q.blocks]
        for b in q.blocks:
            if b.attribution:
                texts.append(b.attribution)
        for t in texts:
            if "<" in t or ">" in t:
                problems.append(f"question {n}: leftover markup")
            if "�" in t:
                problems.append(f"question {n}: replacement character present")
            for pat in _MOJIBAKE_PATTERNS:
                if pat in t:
                    problems.append(f"question {n}: mojibake pattern {pat!r}")
            if "  " in t:
                problems.append(f"question {n}: double space")

    ref_pct = (refs_present / len(questions) * 100) if questions else 0.0
    if len(questions) and ref_pct < 90.0:
        problems.append(
            f"only {refs_present}/{len(questions)} ({ref_pct:.1f}%) questions have "
            f"nonempty ccc_refs -- below the 90% floor; likely parsing the wrong element"
        )

    dup_check = list(questions.keys())
    if len(dup_check) != len(set(dup_check)):
        problems.append("duplicate question numbers present")

    return (len(problems) == 0), problems, refs_present


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def build_manifest(lang: str, state: ScrapeState, retrieved_at: str) -> dict:
    cfg = LANG_CONFIG[lang]
    notes = [
        (
            "The Appendix's Part A (common prayers) is now parsed separately, from this "
            "same cached raw HTML, into prayer.common." + lang + " (pipeline/scrapers/"
            "prayers.py) -- see that work's own manifest for its scope. It doesn't live "
            "here because it is materially more complex than a title/body table -- "
            "multi-paragraph cells, dialogic (versicle/response) prayers, regional "
            "wording variants (five prayers print separate UK and USA texts, EN only), "
            "and Latin text, which -- CORRECTING an earlier version of this note that "
            "claimed it was 'EN only' -- is present in BOTH languages: EN prints it as a "
            "side-by-side table column, PT prints the same 21 Latin texts as a second "
            "sequential pass after its vernacular prayers, easy to miss on a first read "
            "of the raw HTML (see docs/research/prayers.md). PT alone also carries a "
            "bonus 'Biblical Abbreviations' table with no EN equivalent, still unparsed. "
            "Part B (formulas of Catholic doctrine) is also still unparsed here -- a "
            "simple title/body list in both languages, but not prayers, so out of scope "
            "for prayer.common." + lang + " too. None of this is part of the "
            "598-question schema; deferred per corpus-schema.md's explicit allowance. "
            "Raw HTML is cached in full, so nothing was ever lost."
        ),
        (
            "Sacred-art images and their commentary (out of scope per project spec) were "
            "not investigated."
        ),
        (
            "A single decorative epigraph -- a quotation attributed to Saint Augustine "
            "(CCC ¶30, 'You are great, O Lord...') -- is printed between the Chapter One "
            "heading and Question 2 in both languages, attached to no question; dropped "
            "as an orphan block (see run summary)."
        ),
        (
            "ccc_refs is captured by flattening the reference paragraph's own <br/> line "
            "breaks to a single space (matching how the block model treats <br/> "
            "everywhere else) and stripping all other markup -- otherwise verbatim, "
            "including what appear to be printer's-error separators in a handful of PT "
            "entries (e.g. '96.98', '192. 197' -- periods where a hyphen or comma is "
            "presumably meant) and inconsistent en-dash/hyphen use across both editions. "
            "Per the store-raw principle, none of this is normalized or corrected."
        ),
        (
            "Generic (unlabeled) bold sub-headings under a chapter -- e.g. 'The Symbols "
            "of Faith', 'Heaven and Earth', 'Man' -- are emitted as `sub` structure nodes "
            "at a fixed depth (chapter + 1); the source does not mark up their true "
            "relative nesting (if any) explicitly, so none is inferred."
        ),
    ]
    if state.gaps:
        notes.append(f"source question-number gaps detected: {state.gaps}")
    if state.anomalies:
        notes.append(
            "Per-question anomalies (question opened but with no answer content, or "
            "no reference line, printed after it -- see run summary for full detail): "
            + "; ".join(state.anomalies)
        )
    return {
        "id": cfg["work_id"],
        "type": "compendium",
        "title": cfg["title"],
        "short_title": cfg["short_title"],
        "language": lang,
        "edition": cfg["edition"],
        "sources": [{"url": cfg["url"], "retrieved_at": retrieved_at}],
        "copyright": {
            "status": "copyrighted",
            "holder": COPYRIGHT_HOLDER,
            "notice": COPYRIGHT_NOTICE,
        },
        "notes": " ".join(notes),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def write_outputs(lang: str, state: ScrapeState, retrieved_at: str) -> None:
    out_dir = WORKS_ROOT / LANG_CONFIG[lang]["work_id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    for node in state.root_children:
        node.compute_span()
    structure = [n.to_dict() for n in state.root_children]
    questions = [state.questions[n].to_dict() for n in sorted(state.questions)]
    manifest = build_manifest(lang, state, retrieved_at)

    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    )
    (out_dir / "structure.json").write_text(
        json.dumps(structure, indent=2, ensure_ascii=False) + "\n"
    )
    (out_dir / "questions.json").write_text(
        json.dumps(questions, indent=2, ensure_ascii=False) + "\n"
    )


def print_summary(
    lang: str, state: ScrapeState, ok: bool, problems: list[str], refs_present: int
) -> None:
    questions = state.questions
    kind_counts: dict[str, int] = {}

    def walk(node: Node):
        kind_counts[node.kind] = kind_counts.get(node.kind, 0) + 1
        for c in node.children:
            walk(c)

    for n in state.root_children:
        walk(n)
    n_quote_blocks = sum(
        1 for q in questions.values() for b in q.blocks if b.kind == "quote"
    )
    n_with_attrib = sum(
        1
        for q in questions.values()
        for b in q.blocks
        if b.kind == "quote" and b.attribution
    )

    print(f"\n=== {lang.upper()} summary ===")
    print(f"questions captured: {len(questions)}")
    print(f"structure node counts by kind: {kind_counts}")
    print(f"questions with nonempty ccc_refs: {refs_present}/{len(questions)}")
    print(f"quote blocks: {n_quote_blocks} ({n_with_attrib} with attribution)")
    print(f"source gaps recorded: {state.gaps}")
    print(
        f"dropped orphan blocks: {len(state.dropped_orphans)} -> {state.dropped_orphans}"
    )
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
    args = ap.parse_args()

    langs = ["en", "pt"] if args.lang == "both" else [args.lang]
    overall_ok = True
    for lang in langs:
        state, fetcher = run_scrape(lang)
        retrieved_at = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        write_outputs(lang, state, retrieved_at)
        ok, problems, refs_present = validate(state)
        print_summary(lang, state, ok, problems, refs_present)
        print(f"(network fetches this run: {fetcher.network_fetches})")
        overall_ok = overall_ok and ok

    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
