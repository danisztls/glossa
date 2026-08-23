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
  uv run pipeline/scrapers/ccc/ccc.py --lang en|pt|both [--sample]

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
import unicodedata
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up. Python puts a script's own directory
# on sys.path at startup -- which is what made a bare `import common` work while
# these files sat beside it -- and since the move into bible/ and ccc/ that
# directory is no longer the one holding it. Hence this, and hence the imports
# below it being the only ones not at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    CorrectionDriftError,
    Fetcher,
    FetchPolicy,
    corrections_receipt,
    fold,
    load_corrections,
    looks_like_number_typo,
    raw_root,
    require_corpus,
    roman_to_int,
    works_root,
    write_stamped_json,
)

USER_AGENT = "Glossa Catholica corpus builder"
CRAWL_DELAY = 2.0  # seconds; robots.txt on vatican.va says Crawl-delay: 2

# The corpus is a separate, private repository (docs/decisions.md,
# 2026-08-23); `common.corpus_dir()` resolves it, honouring $CORPUS_DIR.
RAW_ROOT = raw_root()
WORKS_ROOT = works_root()

EN_BASE = "https://www.vatican.va/archive/ENG0015/"
EN_TOC_HREF = "_INDEX.HTM"
PT_BASE = "https://www.vatican.va/archive/cathechism_po/index_new/"
PT_TOC_HREF = "prima-pagina-cic_po.html"

FIRST_PARAGRAPH = 1
LAST_PARAGRAPH = 2865

MARK_OPEN, MARK_CLOSE = "⟦", "⟧"  # ⟦ ⟧

_MARKER_TOKEN_RE = re.compile(rf"{MARK_OPEN}([^ {MARK_CLOSE}]+){MARK_CLOSE}")


def resolve_markers(
    marked: str,
    footnote_table: dict[str, str],
    inline_citations: dict[str, tuple[str, str]] | None = None,
) -> tuple[str, list[dict], list[str]]:
    """Turn marked-up text into (plain text, citations, markers with no
    footnote text).

    Shared by paragraphs and by structure headings, which have the same
    apparatus: the source prints a `<sup>` reference, the parser leaves a
    `⟦N⟧` token where it stood, and the footnote's text has to be looked up
    and attached to whatever unit carried the token. A heading's footnote used
    to have nowhere to go, so the token stayed in `title` and the footnote
    text was simply dropped.

    `inline_citations` is the PT-only case where the SOURCE printed the
    citation in running text rather than as a numbered note: those keep their
    `label` and are restored into the plain text instead of removed, because
    the label is something the source actually prints. Headings pass none.

    Duplicate markers get one citation entry: the source sometimes cites the
    same footnote twice in one unit (verified, e.g. PT §460 quotes parallel
    Latin/vernacular texts both attributed to footnote 84)."""
    inline = inline_citations or {}
    seen: set[str] = set()
    citations: list[dict] = []
    missing: list[str] = []
    for tok in _MARKER_TOKEN_RE.findall(marked):
        if tok in seen:
            continue
        seen.add(tok)
        if tok in inline:
            text, label = inline[tok]
            citations.append({"marker": tok, "text": text, "label": label})
            continue
        if tok not in footnote_table:
            missing.append(tok)
        citations.append({"marker": tok, "text": footnote_table.get(tok, "")})
    plain = _MARKER_TOKEN_RE.sub(
        lambda m: inline[m.group(1)][1] if m.group(1) in inline else "", marked
    )
    return re.sub(r"\s+", " ", plain).strip(), citations, missing


# --------------------------------------------------------------------------
# Fetching (cached, rate-limited)
# --------------------------------------------------------------------------


#: How these scrapers conduct themselves toward vatican.va. The 2.0s is that
#: host's robots.txt `Crawl-delay` and is a commitment (docs/decisions.md).
#: No retry: this is a single-work crawl of a handful of pages, where a failed
#: page means the output would be wrong and stopping is the right answer --
#: unlike vatican_docs.py, which crawls hundreds and must survive one bad URL.
VATICAN_POLICY = FetchPolicy(
    user_agent=USER_AGENT,
    delay=2.0,
)


def decode_cp1252(data: bytes) -> str:
    """These pages are the old IntraText shell and declare iso-8859-1/cp1252;
    a claim about this source, which is why it is not in common."""
    return data.decode("cp1252", errors="replace")


def make_fetcher(cache_dir: Path) -> Fetcher:
    return Fetcher(cache_dir, VATICAN_POLICY, decode=decode_cp1252)


# --------------------------------------------------------------------------
# Text utilities
# --------------------------------------------------------------------------


#: Tags that never stand for whitespace, and so are dropped with no
#: replacement rather than replaced by a space.
#:
#: WHY THIS SET EXISTS. Every tag used to become a space. That is right for a
#: block boundary and wrong for an inline one, and both mirrors are Word
#: exports that open and close inline tags mid-word and mid-token -- a heading
#: reached us as "VII. T he Eucharist" (source: "<b>VII. T</b><b>he
#: Eucharist"), an accented name as "S. Nicolau de Fl ue" (the umlaut letter
#: in a <font> of its own), a footnote reference as "Ed. Leon. 4, 2 5.".
#:
#: It was not only cosmetic. The PT mirror marks a footnote reference as
#: "(N)" in running text and `_PT_MARKER_RE` looks for exactly that: where the
#: digits sat in their own tag, the injected spaces made it "( 219)", the
#: regex missed it, and the citation was lost -- 58 of them. The same spaces
#: broke `_pt_footnote_table`'s sequential-number scan ("279." arriving as
#: "2 79."), which left three footnotes empty and made two others swallow the
#: next footnote's text.
#:
#: The seven attested in these two mirrors are b/i/font/a/sup/sub/span
#: (counted over every string this function is called with: 25,822 <i>,
#: 19,724 <font>, 19,624 <b>, 7,952 <a>, 7,466 <sup>, 90 <span>, 8 <sub>).
#: The rest are inline by definition and listed so that a re-crawl which
#: starts using one does not silently reintroduce the defect. Everything not
#: named here -- br, p, td, tr, center, div, table, hr, blockquote, and
#: anything unforeseen -- still becomes a space, which several callers need:
#: `_pt_footnote_table` and `parse_page_pt`'s gap recovery flatten HTML
#: spanning MANY blocks, where the tag is the only thing separating one
#: block's last word from the next block's first.
_INLINE_TAGS = frozenset(
    {
        "a",
        "b",
        "big",
        "em",
        "font",
        "i",
        "nobr",
        "o:p",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "u",
    }
)

#: Group 1 is the tag name when there is one. The bare `<[^>]*>` alternative
#: catches comments and other non-element markup, which fall through to a
#: space -- the conservative direction, since it is what every tag did before.
_ANY_TAG_RE = re.compile(r"<\s*/?\s*([A-Za-z][-A-Za-z0-9:]*)[^>]*>|<[^>]*>")


def _tag_to_space_or_nothing(m: re.Match[str]) -> str:
    name = m.group(1)
    return "" if name is not None and name.lower() in _INLINE_TAGS else " "


def strip_tags(s: str) -> str:
    """Flatten HTML to plain text: inline tags vanish, everything else becomes
    a space. See `_INLINE_TAGS` for why the two are not treated alike."""
    s = _ANY_TAG_RE.sub(_tag_to_space_or_nothing, s)
    s = ihtml.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


_BOLD_SPAN_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.DOTALL | re.IGNORECASE)


def _visible(text: str) -> str:
    return re.sub(r"\s+", "", text)


def is_full_bold(inner_html: str) -> bool:
    """True when the block's entire visible text sits inside <b>...</b> —
    the CCC's heading style. Not just "starts with <b": both mirrors also
    bold a short *prefix* of ordinary paragraphs (PT bolds just the
    paragraph number, e.g. "<b>1216.</b> Este banho..."), which must NOT
    be treated as a heading.

    COMPARED WITH WHITESPACE REMOVED, because the two sides cannot agree on
    it. The bold spans are re-joined here with a space that the source did not
    print, and `strip_tags` (correctly) does not put one back at the inline
    boundary the source did print — so a heading split mid-word across two
    <b>s, "<b>VII. T</b><b>he Eucharist ...</b>", compared "VII. T he ..."
    against "VII. The ..." and stopped being recognised as a heading at all.
    Whether the whitespace between two bold spans is itself bold is not a
    question this predicate is asking; whether any VISIBLE character sits
    outside the bold is."""
    full_text = strip_tags(inner_html)
    if not full_text:
        return False
    bold_text = strip_tags(" ".join(_BOLD_SPAN_RE.findall(inner_html)))
    return bool(bold_text) and _visible(bold_text) == _visible(full_text)


def test_strip_tags_drops_inline_tags_and_spaces_block_ones() -> None:
    # All four left-hand strings are verbatim from the mirrors. The first
    # three are inline tags splitting a word or token; the fourth is a real
    # block boundary, where the tag is the only separator there is.
    assert strip_tags("<b>VII. T</b><b>he Eucharist</b>") == "VII. The Eucharist"
    assert strip_tags("Fl<font size=2>&uuml;</font>e") == "Flüe"
    assert strip_tags("Ed. Leon. 4, 2<i>5</i>.") == "Ed. Leon. 4, 25."
    assert strip_tags("<p>Cf. Lc 9, 58.</p><p>279. Cf. Mt 25, 31-46.</p>") == (
        "Cf. Lc 9, 58. 279. Cf. Mt 25, 31-46."
    )


def test_is_full_bold_accepts_a_heading_the_source_split_across_two_bolds() -> None:
    # Verbatim from __P43.HTM. The word "The" straddles the tag boundary.
    assert is_full_bold('<b>VII. T</b><b>he Eucharist - "Pledge of the Glory"</b>')
    # Still not fooled by a bolded paragraph number, which is the case this
    # predicate exists to reject.
    assert not is_full_bold("<b>1216.</b> Este banho &eacute; chamado")


def test_strip_tags_recovers_a_pt_footnote_marker_the_source_split() -> None:
    # "(219)" with the digits in their own tag used to flatten to "( 219)",
    # which _PT_MARKER_RE does not match -- so the citation was dropped.
    assert _PT_MARKER_RE.search(strip_tags("a verdade <font size=2>(219)</font>."))


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
# Corrections layer (docs/corpus-schema.md #Corrections, docs/decisions.md
# #Source-defect corrections policy)
#
# Verified source defects are corrected via an auditable data file
# (pipeline/corrections/ccc.{lang}.json, committed to the repo) rather than
# by hand-editing output or hardcoding silent fixes in the parser. Each
# entry carries a locator, exact before/after text, reason, and evidence;
# this scraper applies them post-parse and fails loudly (non-zero exit,
# naming the stale entry) if the "from" text no longer matches the source --
# a drift guard against a correction going stale as the raw HTML changes.
# Entries carrying a "resolution" field (e.g. "unresolved") are documented
# but never applied.
#
# Two correction "field" kinds are used, applied at two different points:
#   - "citation_text": a footnote's own printed number is wrong, or its text
#     is wrong. Also covers PT's inline Scripture locators, which are
#     citation text that happens to be printed in the body rather than in
#     the note list (locator marker "inline"). Applied as a RAW HTML
#     substring replacement on the page's fetched text, BEFORE parsing --
#     not post-parse. This class was tried
#     post-parse first (renaming/rewriting the parsed footnote_table entry
#     directly) but that's unsafe for footnote-*number* typos: the PT
#     footnote-list parser (_pt_footnote_table) segments entries by
#     scanning for the next sequential number, so a misprinted number (e.g.
#     "600." where "660." is meant) makes the parser's own boundary
#     detection scan right past the real footnote and glom adjacent
#     unrelated entries together -- corrupting neighbors that were never
#     part of the defect. Fixing the misprint in the raw source text before
#     that scan runs avoids the corruption entirely and is honest about
#     what's actually being corrected (the source's printed digits, not an
#     internal data structure). `from`/`to` are therefore exact raw HTML
#     substrings (verified unique across the whole raw/ccc-{lang}/ corpus
#     for the specific page in question), not the stripped/normalized text
#     that ends up in citations[].text.
#   - "marker": an inline footnote marker in the body text is a phantom/
#     wrong digit sequence. Applied post-parse, against the paragraph's
#     already-marked block text (⟦N⟧ tokens) at paragraph-finalize time --
#     safe post-parse because it doesn't interact with any sequential
#     boundary-detection scan, only a single isolated token.
#   - "paragraph_number": the paragraph's own printed leading number is
#     wrong. Consulted from inside the structural single-digit-typo
#     heuristic in process_page(), replacing what used to be a silent,
#     undocumented auto-correction.
# --------------------------------------------------------------------------


def find_paragraph_number_correction(
    corrections: list[dict], expected: int, cand: int
) -> dict | None:
    for c in corrections:
        if c.get("resolution") or c["field"] != "paragraph_number":
            continue
        loc = c["locator"]
        if loc.get("paragraph") == expected and c["from"] == str(cand):
            return c
    return None


#: Correction fields applied as raw-HTML substring replacements before the
#: page is parsed, rather than against already-parsed output.
#:
#: `heading_html` differs from `citation_text` in one way that matters: its
#: locator names a `page`, and it is only applied to that page. A citation's
#: `from` is a distinctive run of prose and is unique corpus-wide by
#: construction; a heading's is boilerplate Word markup ("<p
#: class=MsoNormal>SECTION TWO</b></p>" occurs on four different pages), so
#: "first page where the string appears" is not a safe address for one.
_PRE_PARSE_CORRECTION_FIELDS = frozenset({"citation_text", "heading_html"})


def apply_raw_text_corrections(
    html_text: str,
    page_name: str,
    corrections: list[dict],
    applied_log: list[dict],
    seen_ids: set[str],
) -> str:
    """Apply pre-parse corrections as raw-HTML substring replacements,
    before the page is parsed. Each correction's `from` is searched for in
    this page's raw fetched text; if found, replaced exactly once and
    recorded applied. A correction not found on this particular page is
    simply not-yet-applied here (it may belong to a different page, or --
    on a --sample run -- to a page outside the crawled slice); the caller
    checks after the full run that every non-unresolved entry was applied
    somewhere.

    Note this edits the FETCHED text in memory. corpus/raw/ on disk stays the
    record of what the mirror actually served (CLAUDE.md, corrections vs
    overrides)."""
    for c in corrections:
        if c.get("resolution") or c["field"] not in _PRE_PARSE_CORRECTION_FIELDS:
            continue
        if c["id"] in seen_ids:
            continue
        page = c["locator"].get("page")
        if page is not None and page != page_name:
            continue
        frm = c["from"]
        if frm in html_text:
            html_text = html_text.replace(frm, c["to"], 1)
            applied_log.append({**c, "page": page_name})
            seen_ids.add(c["id"])
    return html_text


def apply_paragraph_corrections(
    para: Paragraph,
    footnote_table: dict[str, str],
    corrections: list[dict],
    applied_log: list[dict],
    seen_ids: set[str],
) -> None:
    """Apply marker corrections targeting this paragraph's already-marked
    block text. Raises CorrectionDriftError if a correction's `from` no
    longer matches what's actually present. (citation_text corrections are
    applied earlier, pre-parse -- see apply_raw_text_corrections.)"""
    for c in corrections:
        if c.get("resolution"):
            continue
        loc = c["locator"]
        if loc.get("paragraph") != para.n:
            continue
        field = c["field"]
        if field in _PRE_PARSE_CORRECTION_FIELDS:
            continue  # applied pre-parse, see apply_raw_text_corrections()
        if field == "marker":
            token_from = f"{MARK_OPEN}{c['from'].strip('()')}{MARK_CLOSE}"
            token_to = f"{MARK_OPEN}{c['to'].strip('()')}{MARK_CLOSE}"
            found = False
            for block in para.blocks:
                if token_from in block.text:
                    block.text = block.text.replace(token_from, token_to)
                    found = True
            if not found:
                raise CorrectionDriftError(
                    f"correction {c['id']!r}: marker token {c['from']!r} not found "
                    f"in paragraph {para.n}"
                )
            applied_log.append(dict(c))
            seen_ids.add(c["id"])
        elif field == "paragraph_number":
            continue  # applied separately, inside process_page()
        else:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: unknown field {field!r}"
            )


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

#: `in_brief` is not in LEVELS -- push_heading places it by popping rather
#: than by level -- but it still needs a level deep enough that the next
#: heading of any kind closes it. See push_heading.
_DEEPEST_LEVEL = max(LEVELS.values())

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
    """A division of the work.

    `title` is the plain heading text and `title_marked` the same text with
    the source's footnote references left in place as `⟦N⟧`, exactly the
    `text`/`text_marked` pair a paragraph carries -- because a heading can
    carry the same apparatus a paragraph can. Two EN headings do: the mirror
    prints a <sup> reference on `III. Christ Jesus -- "Mediator and Fullness
    of All Revelation"` (footnote: "DV 2.") and on `II. "I Know Whom I Have
    Believed"` (footnote: "2 Tim 1:12"), in both cases sourcing the phrase the
    heading quotes. Before this, the token stayed in `title` -- rendering
    literally in the site's index -- and the footnote text reached no output
    field at all."""

    def __init__(
        self,
        kind: str,
        n: int | None,
        title: str,
        level: int,
        title_marked: str | None = None,
        citations: list[dict] | None = None,
    ):
        self.kind = kind
        self.n = n
        self.title = title
        #: None when the title carries no markers, i.e. almost always.
        self.title_marked = title_marked
        self.citations = citations or []
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
        # Both omitted on a heading with no apparatus -- which is 394 of the
        # CCC's 396 nodes and every node of every other work. Absence means
        # "`title` is the whole story", the same convention `kind`,
        # `attribution` and `label` already follow (docs/corpus-schema.md).
        if self.title_marked is not None:
            d["title_marked"] = self.title_marked
        if self.citations:
            d["citations"] = self.citations
        return d


# --------------------------------------------------------------------------
# Paragraph assembly
# --------------------------------------------------------------------------

# The Portuguese archive types many Scripture citations directly into the
# paragraph, while the English edition puts the equivalent references in
# numbered footnotes (CCC 147 is a representative paired example).  These
# parenthesized strings are still a citation apparatus, not ordinary prose.
# This deliberately narrow grammar accepts only a whole parenthesis that is
# Scripture-reference syntax: a PT book form + chapter, optional verse(s),
# and semicolon-separated continuations.  It therefore cannot turn an aside
# that merely mentions a biblical book into a synthetic citation.
# The book-number prefix accepts a Roman numeral as well as a digit: the
# mirror prints "(I Jo 4, 9)" and "(I Cor 15, 28)" beside its usual "(1 Jo ...)"
# form, the same typesetting artifact `refs.ts`'s `numberedVariants` already
# folds into both language tables. Without it those two parentheses stayed
# ordinary prose while every neighbouring one became a citation.
_PT_INLINE_BOOK = (
    r"(?:[1-3]\s*|I{1,3}\s+)?(?:Gn|Ex|Lv|Nm|Dt|Dr|Js|Jz|Rt|Tb|Jt|Est|Job|Jó|Sl|Pr|"
    r"Ecl|Ec|Ct|Sb|Sir|Is|Jr|Lm|Br|Ez|Esd|Ne|Dn|Os|Jl|Am|Ab|Jn|Mq|Na|Hab|"
    r"Sf|Ag|Zc|Ml|Mt|Mc|Mr|Lc|Jo|Act|At|Rm|Gl|Ef|Fl|Cl|Tt|Flm|Fm|Heb|Hb|Tg|Jd|Ap|"
    r"Cr|Cor|Rs|Mac|Pe|Sm|Ts|Tm)"
)
_PT_INLINE_CF = r"(?:(?:Cf|Cfr)\.?\s*)?"
# The PT mirror is inconsistent enough that a full parenthesis cannot always
# satisfy a tidy chapter/verse grammar: it has copied comments ("segundo a
# Vulgata"), a second reference after a colon, and several spacing/OCR
# defects. A parenthesis whose *opening* is unmistakably a book + numeric
# locus is still safely a citation apparatus. Capture the complete raw string
# for the footnote and let the later reference parser link every portion it
# understands; never discard the unparseable remainder.
_PT_INLINE_REF_START_SEPARATOR = r"(?:\s+|,\s*|\s*\.\s*|;\s*|(?=\d))"
# `tail` is a footnote marker the source printed INSIDE the same parenthesis:
# CCC 857 reads "(Ef 2, 20 (368))", one inline locator and one numbered note
# sharing a bracket. By the time this runs the note is already a ⟦368⟧ token,
# so excluding the token characters from `ref` and capturing the token
# separately keeps two distinct pieces of apparatus distinct -- the locator
# renders as itself and the note keeps its own marker, instead of the note
# being swallowed into the locator's label as literal "⟦368⟧" text.
_PT_INLINE_SCRIPTURE_RE = re.compile(
    rf"\((?P<leading>\s*)(?P<ref>{_PT_INLINE_CF}{_PT_INLINE_BOOK}"
    rf"{_PT_INLINE_REF_START_SEPARATOR}(?=\d)[^(){MARK_OPEN}{MARK_CLOSE}]*)"
    rf"(?P<tail>\s*{MARK_OPEN}[^{MARK_CLOSE}]*{MARK_CLOSE})?\)",
    re.IGNORECASE,
)


def mark_pt_inline_scripture_citations(
    text: str, start: int
) -> tuple[str, dict[str, tuple[str, str]]]:
    """Replace source-faithful PT inline Scripture locators with internal
    citation tokens, returning the token -> original locator map.

    The token marks WHERE the locator stands, not that it is a footnote: the
    renderer prints each ``label`` back at exactly this position, verbatim
    parentheses and all, and only weaves links through it. Tokenizing rather
    than leaving the parenthesis in the prose is what isolates the citation
    apparatus from the surrounding sentence, so the reference parser is handed
    a citation-shaped string instead of having to guess where one starts
    inside running text. Raw source remains untouched in ``corpus/raw``; this
    is a reversible parse.
    """

    citations: dict[str, tuple[str, str]] = {}
    next_marker = start

    def replace(match: re.Match[str]) -> str:
        nonlocal next_marker
        marker = f"inline{next_marker}"
        next_marker += 1
        # `text` is the parseable citation string; `label` restores every
        # source character, including the irregular leading space in
        # "( Rm 4, 18)", to the derived searchable text.
        tail = match.group("tail") or ""
        # With a footnote token pulled out of the parenthesis, the space that
        # separated the two goes with it -- otherwise the locator's label
        # would close on a space the source never printed before ")".
        ref = match.group("ref").rstrip() if tail else match.group("ref")
        citations[marker] = (ref, f"({match.group('leading')}{ref})")
        return f"{MARK_OPEN}{marker}{MARK_CLOSE}{tail.strip()}"

    return _PT_INLINE_SCRIPTURE_RE.sub(replace, text), citations


def test_pt_inline_scripture_citations_become_location_preserving_tokens() -> None:
    marked, citations = mark_pt_inline_scripture_citations(
        "A fé chega à perfeição (Heb 11, 40; 12, 2).", 1
    )
    assert marked == "A fé chega à perfeição ⟦inline1⟧."
    assert citations == {"inline1": ("Heb 11, 40; 12, 2", "(Heb 11, 40; 12, 2)")}


def test_pt_inline_scripture_accepts_source_spacing_and_post_book_commas() -> None:
    marked, citations = mark_pt_inline_scripture_citations(
        "( Rm 4, 18); (1 Cor, 13, 12); ( Lc 1, 45)", 1
    )
    assert marked == "⟦inline1⟧; ⟦inline2⟧; ⟦inline3⟧"
    assert citations == {
        "inline1": ("Rm 4, 18", "( Rm 4, 18)"),
        "inline2": ("1 Cor, 13, 12", "(1 Cor, 13, 12)"),
        "inline3": ("Lc 1, 45", "( Lc 1, 45)"),
    }


def test_pt_inline_scripture_keeps_source_comments_and_irregular_continuations() -> (
    None
):
    marked, citations = mark_pt_inline_scripture_citations(
        "(Gl 5, 22-23 segundo a Vulgata); (Ex 25, 16: 40, 1-2)", 1
    )
    assert marked == "⟦inline1⟧; ⟦inline2⟧"
    assert citations == {
        "inline1": ("Gl 5, 22-23 segundo a Vulgata", "(Gl 5, 22-23 segundo a Vulgata)"),
        "inline2": ("Ex 25, 16: 40, 1-2", "(Ex 25, 16: 40, 1-2)"),
    }


def test_pt_inline_scripture_accepts_the_source_flm_variant() -> None:
    marked, citations = mark_pt_inline_scripture_citations("(Flm 16)", 1)
    assert marked == "⟦inline1⟧"
    assert citations == {"inline1": ("Flm 16", "(Flm 16)")}


def test_pt_inline_scripture_accepts_a_roman_book_number() -> None:
    marked, citations = mark_pt_inline_scripture_citations("(I Jo 4, 9)", 1)
    assert marked == "⟦inline1⟧"
    assert citations == {"inline1": ("I Jo 4, 9", "(I Jo 4, 9)")}


def test_pt_inline_scripture_keeps_an_enclosed_footnote_marker_separate() -> None:
    marked, citations = mark_pt_inline_scripture_citations(
        "«alicerce» ( Ef 2, 20 ⟦368⟧),", 1
    )
    assert marked == "«alicerce» ⟦inline1⟧⟦368⟧,"
    assert citations == {"inline1": ("Ef 2, 20", "( Ef 2, 20)")}


def test_pt_inline_scripture_does_not_capture_an_ordinary_parenthetical_aside() -> None:
    marked, citations = mark_pt_inline_scripture_citations(
        "A autora comenta (ver Heb 11, 2) a fé.", 1
    )
    assert marked == "A autora comenta (ver Heb 11, 2) a fé."
    assert citations == {}


@dataclass
class BlockOut:
    kind: str  # "prose" | "quote"
    text: str  # text_marked (tokens still embedded)
    attribution: str | None = None

    def to_dict(self) -> dict:
        # Omitted when "prose" -- absence means the ordinary case, as with
        # `attribution` below. See docs/corpus-schema.md and the fuller note
        # in vatican_docs.py's BlockOut. Quotations are 11% of CCC blocks,
        # the highest share of any work type, so this is where the field
        # earns its place rather than where it is nearly always noise.
        d: dict = {}
        if self.kind != "prose":
            d["kind"] = self.kind
        d["text_marked"] = self.text
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

    def resolve(
        self,
        footnote_table: dict[str, str],
        anomalies: list[str],
        normalize_pt_inline_scripture: bool = False,
    ) -> None:
        inline_citations: dict[str, tuple[str, str]] = {}
        if normalize_pt_inline_scripture:
            for block in self.blocks:
                block.text, found = mark_pt_inline_scripture_citations(
                    block.text, len(inline_citations) + 1
                )
                inline_citations.update(found)

        all_marked = " ".join(b.text for b in self.blocks)
        self.text, self.citations, missing = resolve_markers(
            all_marked, footnote_table, inline_citations
        )
        for tok in missing:
            anomalies.append(f"paragraph {self.n}: marker {tok} has no footnote text")

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
    def __init__(
        self,
        corrections: list[dict] | None = None,
        normalize_pt_inline_scripture: bool = False,
    ):
        self.stack: list[Node] = []
        self.root_children: list[Node] = []
        self.paragraphs: dict[int, Paragraph] = {}
        self.open_paragraph: Paragraph | None = None
        self.last_n: int | None = None
        self.gaps: list[tuple[int, int]] = []
        #: (page name, heading chain) from each EN page's <meta name="part">.
        #: Empty for PT, whose mirror prints no such tag. See
        #: `check_declared_structure`.
        self.declared_chains: list[tuple[str, tuple[str, ...]]] = []
        self.dropped: list[str] = []
        self.false_starts: list[str] = []
        self.anomalies: list[str] = []
        self.orphan_content: list[str] = []
        self.fetch_failures: list[str] = []
        # The footnote table for whichever page is currently being processed.
        # A paragraph never spans two pages (verified across every mirror
        # inspected), so it's always safe to resolve citations against
        # whatever table is current at finalize time -- including when a
        # heading on the *same* page finalizes the paragraph that precedes it.
        self.current_footnote_table: dict[str, str] = {}
        # Corrections layer (see "Corrections layer" section above).
        self.corrections: list[dict] = corrections or []
        self.corrections_applied: list[dict] = []
        self.corrections_seen: set[str] = set()
        self.normalize_pt_inline_scripture = normalize_pt_inline_scripture

    # -- structure -----------------------------------------------------
    def push_heading(self, kind: str, n: int | None, marked_title: str) -> None:
        """`marked_title` is the heading block's text as parsed, footnote
        tokens included. They are resolved here, against the page currently
        being processed, because that is where the footnote table for this
        heading lives -- the same reason `finalize_open_paragraph` resolves a
        paragraph's citations against `current_footnote_table`."""
        self.finalize_open_paragraph()
        title, citations, missing = resolve_markers(
            marked_title, self.current_footnote_table
        )
        # Normalized the same way `resolve_markers` normalizes `title`, so the
        # two forms of one heading can never disagree about spacing.
        title_marked = re.sub(r"\s+", " ", marked_title).strip() if citations else None
        for tok in missing:
            self.anomalies.append(
                f"heading {title[:60]!r}: marker {tok} has no footnote text"
            )
        if kind == "in_brief":
            while self.stack and self.stack[-1].level >= 4:
                self.stack.pop()
            # Placed as a child of whatever survived that pop (article, or
            # chapter where the article level is unused), but given the
            # DEEPEST level so nothing can nest inside it. An "in brief" is a
            # summary box closing a division, not a division of its own: with
            # `parent.level + 1` it stayed open and adopted the next heading,
            # which put "The Credo" inside the in-brief of Article 2 WE
            # BELIEVE and "Amen" inside the in-brief of Article 12, where the
            # mirror's own breadcrumbs (see check_declared_structure) make
            # both siblings of the in-brief under the article.
            level = _DEEPEST_LEVEL
        else:
            level = LEVELS[kind]
            while self.stack and self.stack[-1].level >= level:
                self.stack.pop()
        parent_children = self.stack[-1].children if self.stack else self.root_children
        # PT's coarser per-chapter pages re-print the running Part/Section
        # banner verbatim at the top of every page within that part/section
        # (e.g. "PRIMEIRA PARTE A PROFISSÃO DA FÉ" appears atop all 7 pages
        # spanning §26-1065). Without this check each repeat would pop and
        # re-push a fresh sibling, fragmenting one Part into many. Only
        # merges into the immediately preceding sibling -- a coincidental
        # match elsewhere in the tree is not affected. Matched by (kind, n)
        # rather than exact title text: the running banner isn't always
        # printed identically page to page (seen: one page appends a
        # trailing "INTRODUÇÃO" that others omit), but the ordinal is
        # consistent whenever the source numbers the heading at all.
        prev = parent_children[-1] if parent_children else None
        same_heading = (
            prev is not None
            and prev.kind == kind
            and ((n is not None and prev.n == n) or (n is None and prev.title == title))
        )
        if same_heading:
            self.stack.append(prev)
            return
        node = Node(kind, n, title, level, title_marked, citations)
        parent_children.append(node)
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
        apply_paragraph_corrections(
            self.open_paragraph,
            self.current_footnote_table,
            self.corrections,
            self.corrections_applied,
            self.corrections_seen,
        )
        self.open_paragraph.resolve(
            self.current_footnote_table,
            self.anomalies,
            self.normalize_pt_inline_scripture,
        )
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


_EMBEDDED_START_PUNCT_RE = r'[.!?:;"”’]'


def split_embedded_paragraph_starts(
    text: str, base_n: int | None
) -> list[tuple[int | None, str]]:
    """Some pages drop the <p> boundary between two numbered paragraphs
    entirely -- the next paragraph's number just appears mid-sentence,
    e.g. "...validity of the Decalogue. 2077 The gift..." (no tag at all
    between "Decalogue." and "2077"), or "...common good. <br>\\n2436
    Unemployment..." (a <br> instead of a real break; by the time this
    function sees the text, <br> has already collapsed to a space so both
    cases look identical). Only splits on the exact next-expected number,
    preceded by sentence-ending punctuation, chained forward -- this keeps
    the false-positive rate on ordinary in-prose numerals effectively zero.

    Returns [(None, prefix), (n1, chunk1), (n2, chunk2), ...] where the
    first element always carries the original (no new paragraph) owner and
    subsequent elements mark where a new paragraph starts."""
    if base_n is None:
        return [(None, text)]
    result: list[tuple[int | None, str]] = []
    remaining = text
    expected = base_n + 1
    owner: int | None = None
    while True:
        m = re.search(
            rf"(?<={_EMBEDDED_START_PUNCT_RE})\s+({expected})\b\s*", remaining
        )
        if not m:
            result.append((owner, remaining))
            break
        result.append((owner, remaining[: m.start()]))
        remaining = remaining[m.end() :]
        owner = expected
        expected += 1
    return result


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
                # AT MOST ONE continuation block. The label line and the title
                # it introduces are printed as two blocks ("CHAPTER TWO", then
                # "GOD COMES TO MEET MAN") on all but a handful of pages, and
                # this used to absorb every unlabelled heading block that
                # followed. The EN mirror never prints more than one, so the
                # bug was invisible there; the PT mirror prints a further
                # sub-heading in the same style on four pages, and each came
                # out glued onto the title AND missing from the tree --
                # "CAPITULO PRIMEIRO A REVELACAO DA ORACAO O apelo universal a
                # oracao" against EN's single-block "CHAPTER ONE THE REVELATION
                # OF PRAYER - THE UNIVERSAL CALL TO PRAYER". Anything past the
                # first block falls through to `bare_sub` below, which is what
                # the EN equivalents already parse as.
                title = b.text
                j = i + 1
                if (
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
            expected = state.last_n + 1 if state.last_n is not None else cand
            if state.last_n is None or cand == expected:
                is_new = True
                rest_text = b.text[m.end() :]
            elif cand > expected:
                is_new = True
                state.record_gap(state.last_n, cand)
                rest_text = b.text[m.end() :]
            elif looks_like_number_typo(cand, expected):
                # A handful of pages misprint the paragraph number itself by
                # one digit (verified against raw HTML: e.g. PT prints
                # "2117." where content and position both make it §2217 --
                # single-digit substitution, immediately after §2216). The
                # printed digits are structural metadata, not body text, so
                # correcting the boundary here doesn't violate verbatim-text
                # capture. This heuristic is a generic safety net; each
                # *specific* instance it fires on should have a matching
                # pipeline/corrections/ccc.{lang}.json entry (field
                # "paragraph_number") so the fix is auditable data rather
                # than a hardcoded, silent parser behavior -- consulted here
                # instead of just logging an anomaly.
                is_new = True
                entry = find_paragraph_number_correction(
                    state.corrections, expected, cand
                )
                if entry is not None:
                    if entry["id"] not in state.corrections_seen:
                        state.corrections_applied.append(dict(entry))
                        state.corrections_seen.add(entry["id"])
                    state.anomalies.append(
                        f"paragraph {expected}: source printed {m.group(1)!r} "
                        f"(corrected via corrections entry {entry['id']!r})"
                    )
                else:
                    state.anomalies.append(
                        f"paragraph {expected}: source printed {m.group(1)!r} "
                        "(single-digit typo, corrected; UNDOCUMENTED -- add a "
                        "pipeline/corrections/ccc.{lang}.json paragraph_number entry)"
                    )
                cand = expected
                rest_text = b.text[m.end() :]
            # else: cand <= last_n and not a plausible typo -> false positive;
            # fall through as continuation

        base_n = cand if is_new else state.last_n
        segments = split_embedded_paragraph_starts(rest_text, base_n)
        first_text = segments[0][1]

        if is_new:
            state.finalize_open_paragraph()
            state.start_paragraph(cand, b.kind, first_text)
            state.last_n = cand
        elif state.open_paragraph is None:
            if b.kind == "prose" and is_mini_header(first_text):
                state.dropped.append(first_text)
            else:
                where = state.stack[-1].title if state.stack else "?"
                state.orphan_content.append(f"[{where}] {first_text[:90]}")
        elif b.kind == "prose" and is_mini_header(first_text):
            state.dropped.append(first_text)
        else:
            state.add_continuation(b.kind, first_text)

        for owner, chunk in segments[1:]:
            state.finalize_open_paragraph()
            state.start_paragraph(owner, b.kind, chunk)
            state.last_n = owner

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

_EN_IF = re.IGNORECASE | re.DOTALL

# A small minority of pages (found: __P85.HTM) were re-saved through Internet
# Explorer at some point on vatican.va's own end -- confirmed live on the
# server, not a cache artifact: they carry a literal "saved from url=..."
# comment and MSHTML generator meta tag. They differ from the standard pages
# in three ways, all handled below: (1) tag names are uppercase, (2)
# attributes are reordered (href before name, width before size, etc.), (3)
# hrefs are absolute URLs instead of bare "#-CODE" fragments. All EN regexes
# are therefore case-insensitive and attribute-order-independent; none rely
# on href *values*, only on the "name=" attribute, which is present and
# consistent in both variants.
_EN_SUP_RE = re.compile(
    r"<sup>.*?<a\s[^>]*?name=-([0-9A-Za-z]+)[^>]*>(\d+)</a>.*?</sup>", _EN_IF
)


_EN_STRAY_BOLD_RE = re.compile(r"^\s*<b([^>]*)>\s*<p([^>]*)>", re.IGNORECASE)

# <hr> boundary markers, matched by the attribute combination that's unique
# to that boundary regardless of tag-name case, attribute order, or
# quoting -- e.g. both "<hr size=1 noshade>" and "<HR noShade SIZE=1>".
_EN_HR_CONTENT_START_RE = re.compile(
    r"<hr\b(?=[^>]*\bnoshade\b)(?=[^>]*\bsize=[\"']?1\b)[^>]*>", re.IGNORECASE
)
_EN_HR_FOOTNOTE_START_RE = re.compile(
    r"<hr\b(?=[^>]*\bwidth=[\"']?30%)[^>]*>", re.IGNORECASE
)
_EN_HR_FOOTNOTE_END_RE = re.compile(
    r"<hr\b(?=[^>]*\bwidth=[\"']?70%)[^>]*>", re.IGNORECASE
)


def _en_body_and_footnotes(html_text: str) -> tuple[str, str]:
    start_m = _EN_HR_CONTENT_START_RE.search(html_text)
    rest = html_text[start_m.end() :] if start_m else html_text
    # The page's first heading is sometimes preceded by a stray <b> that opens
    # *before* the <p> tag and closes partway through its content (e.g.
    # "<hr...><b><p class=MsoNormal>CHAPTER ONE</b><b...></b></p>"). Reorder
    # so the <b> ends up properly nested inside the <p>, matching every other
    # heading on the page -- otherwise these pages' first heading is invisible
    # to the bold-heading detector.
    rest = _EN_STRAY_BOLD_RE.sub(lambda m: f"<p{m.group(2)}><b{m.group(1)}>", rest)
    foot_m = _EN_HR_FOOTNOTE_START_RE.search(rest)
    if foot_m is None:
        end_m = _EN_HR_FOOTNOTE_END_RE.search(rest)
        return (rest[: end_m.start()] if end_m else rest), ""
    body = rest[: foot_m.start()]
    end_m = _EN_HR_FOOTNOTE_END_RE.search(rest, foot_m.end())
    foot = rest[foot_m.end() : (end_m.start() if end_m else None)]
    return body, foot


_EN_FOOT_SPLIT_RE = re.compile(
    r"<font\s+size=[\"']?3[\"']?><b><a\s[^>]*?name=\$([0-9A-Za-z]+)[^>]*>(\d+)</a></b></font>"
    r"\s*<font\s+face=[\"']?Verdana[\"']?\s+size=[\"']?1[\"']?>",
    re.IGNORECASE,
)


def _en_footnote_table(foot_html: str) -> dict[str, str]:
    parts = _EN_FOOT_SPLIT_RE.split(foot_html)
    table: dict[str, str] = {}
    for i in range(1, len(parts), 3):
        _code, num, text = parts[i], parts[i + 1], parts[i + 2]
        table[num] = strip_tags(text)
    return table


_EN_P_RE = re.compile(r"<p([^>]*)>(.*?)</p>", _EN_IF)


def parse_page_en(html_text: str) -> tuple[list[Block], dict[str, str]]:
    body, foot_html = _en_body_and_footnotes(html_text)
    footnote_table = _en_footnote_table(foot_html)
    blocks: list[Block] = []
    for attrs_m, inner in ((m.group(1), m.group(2)) for m in _EN_P_RE.finditer(body)):
        is_quote = "margin-left" in attrs_m.lower()
        is_heading = is_full_bold(inner)
        marked = _EN_SUP_RE.sub(lambda m: f"{MARK_OPEN}{m.group(2)}{MARK_CLOSE}", inner)
        text = strip_tags(marked)
        if not text:
            continue
        blocks.append(Block(is_heading, "quote" if is_quote else "prose", text))
    return merge_quote_blocks(blocks), footnote_table


def discover_pages_en(fetcher: Fetcher) -> list[tuple[str, str]]:
    text = fetcher.fetch_str(EN_BASE + EN_TOC_HREF, EN_TOC_HREF)
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


def is_bare_structural_label(text: str) -> bool:
    """True when `text` is *just* a structural label (e.g. "CAPÍTULO
    PRIMEIRO") with no trailing subtitle or other content glued on in the
    same block. Used to decide whether a non-bold block can still count as
    a heading: some chapter markers are printed plain, with only their
    separate subtitle block bold (see parse_page_pt); but the Prologue also
    *describes* the four Parts by name in ordinary running prose (e.g.
    "PRIMEIRA PARTE: A Profissão da Fé ..."), which must not be mistaken for
    the real heading. A bare label consumes (almost) the whole block;
    prose mentioning a part name goes on for a full sentence afterwards."""
    folded = fold(text)
    for kind, pat in _PT_LABELS:
        if kind == "roman":
            continue
        m = pat.match(folded)
        if m and len(folded) - m.end() <= 3:
            return True
    return False


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


# The `\s*` before the period WAS load-bearing, and is now defence in depth.
# The PT mirror marks up a paragraph's leading number in two shapes --
# "<b>1663. </b>" and "<b>1662<i>. </i></b>", the period living inside a
# *nested* tag -- and `strip_tags` used to turn every tag boundary into a
# space, so the second shape reached here as "1662 . Text". Without the `\s*`
# the match ended after "1662 ", leaving a stray ". " at the head of the
# paragraph's body text: 126 PT paragraphs (33, 45, 46, 49, 96, ...) opened
# with a lone period, against zero in EN. The asymmetry is what identified
# it -- both editions number the same 2,865 paragraphs, so a defect present
# in one alone is a parser defect (CLAUDE.md, "Work that spans languages").
# `strip_tags` no longer inserts that space (see `_INLINE_TAGS`), so both
# shapes now arrive as "1662. Text" and the `\s*` matches nothing. Kept
# because the source, not this parser, is what decides where its spaces go,
# and the tests below pin both shapes either way.
PT_NUMBER_RE = re.compile(r"^(\d{1,4})\s*\.?\s+")
_PT_MARKER_RE = re.compile(r"\((\d{1,3})\)")


def test_pt_paragraph_number_strips_a_period_left_behind_by_a_nested_tag() -> None:
    # Both shapes are real, from the same mirror: §1663 prints the period
    # inside the <b>, §33 and §1662 print it inside an <i> nested in the <b>.
    # The nested shape used to arrive with the number and its period separated
    # by the space strip_tags put at every tag boundary; it no longer does
    # (see _INLINE_TAGS), and this pins the outcome under either rule.
    for html in (
        "<b>1663. </b>Uma vez que o Matrim&oacute;nio",
        "<b>1662<i>. </i></b>O Matrim&oacute;nio assenta",
        "<b>33<i>. </i></b>O<i> homem: </i>Com a sua abertura",
    ):
        text = strip_tags(html)
        m = PT_NUMBER_RE.match(text)
        assert m is not None, html
        assert not text[m.end() :].startswith("."), html


def test_pt_paragraph_number_does_not_run_past_the_number_it_matched() -> None:
    # The `\s*\.?` must not let the match wander into body text that merely
    # starts with a period-shaped token.
    assert PT_NUMBER_RE.match("33 . O homem").end() == len("33 . ")
    assert PT_NUMBER_RE.match("1216. Este banho").end() == len("1216. ")
    assert PT_NUMBER_RE.match("2117 Comparar") is not None
    assert PT_NUMBER_RE.match("50.000 fi&eacute;is") is None


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
    # The footnote list starts right after the page's *last* <hr/> -- most
    # pages have exactly one, but a couple (e.g. the pages embedding a
    # reference table for the Credo or the Ten Commandments) have an extra
    # <hr/> earlier, before that table; picking the first one would treat
    # the table's markup as the footnote list and silently produce an empty
    # footnote table. Some pages (e.g. the Prologue) label the real one
    # "Notas" first; _pt_footnote_table strips that label at the flattened-
    # text level rather than matching it as HTML here, since its wrapping
    # <p> tag isn't always attribute-free.
    hr_matches = list(re.finditer(r"<hr\s*/?>", body))
    if not hr_matches:
        return body, ""
    hr_m = hr_matches[-1]
    content, foot = body[: hr_m.start()], body[hr_m.end() :]
    return content, foot


_PT_FOOTNOTE_NUM_RE = re.compile(r"^\s*(\d{1,3})\.?\s+")
# Deliberately *not* requiring sentence-ending punctuation before the number
# (unlike split_embedded_paragraph_starts): footnote text itself sometimes
# ends on a bare citation with no terminal period (e.g. PT §226's footnote
# text is "Cf. Mt 16, 25-26; Jo 15. 13" -- no period after "13"). And the
# period after the number doesn't always get a following space either (seen:
# "...1, 27. 135.Cf. 1 Sm 1." -- "135." runs straight into "Cf" with no
# space). Whitespace before, and *either* a period or whitespace after, is
# enough to rule out matching inside a longer number (e.g. "27" inside
# "127") without over-constraining the punctuation.
_PT_FOOTNOTE_NEXT_RE = r"\s({n})(?:\.|\s)"
# This is a long sequential chain over the whole footnote list (up to ~600
# entries on the longest pages) built from some of the sloppiest markup in
# the corpus, so a bounded lookahead -- try n+1, then n+2, ... -- guards
# against any one boundary this scanner still can't recognize silently
# swallowing every subsequent footnote into the current one. Missed numbers
# in between are recorded as empty entries (visible in validation, not
# fabricated).
_PT_FOOTNOTE_LOOKAHEAD = 5


def _pt_footnote_table(foot_html: str) -> dict[str, str]:
    # Each footnote is usually its own "<p>N. text</p>", but the source
    # sometimes drops the <p> wrapper for a single entry (seen: PT §36's
    # footnote 12 -- "...819.<p>13. Pio XII...</p>" with nothing wrapping
    # "12." itself, so the per-<p> split silently skips it). Scanning the
    # fully flattened text for sequential "N." boundaries is robust either
    # way and doesn't depend on <p> tags being present at all.
    text = strip_tags(foot_html)
    text = re.sub(r"^\s*Notas\s*:?\s*", "", text, count=1, flags=re.IGNORECASE)
    table: dict[str, str] = {}
    start_m = _PT_FOOTNOTE_NUM_RE.match(text)
    if not start_m:
        return table
    expected = int(start_m.group(1))
    pos = start_m.end()
    while True:
        m = nxt = None
        for lookahead in range(1, _PT_FOOTNOTE_LOOKAHEAD + 1):
            candidate = expected + lookahead
            cm = re.search(_PT_FOOTNOTE_NEXT_RE.format(n=candidate), text[pos:])
            if cm is not None:
                m, nxt = cm, candidate
                break
        if m is None:
            table[str(expected)] = text[pos:].strip()
            break
        for skipped in range(expected + 1, nxt):
            table[str(skipped)] = ""
        table[str(expected)] = text[pos : pos + m.start()].strip()
        pos += m.end()
        expected = nxt
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
        text = strip_tags(p_inner)
        if not text:
            continue
        # Most headings are fully bold, but chapter markers are sometimes
        # printed plain with only their subtitle bold (seen: "<p
        # align="center">CAPÍTULO PRIMEIRO</p>" followed by a *separate*
        # bold "<p align="center"><b>O HOMEM É «CAPAZ» DE DEUS</b></p>" --
        # without this, "CAPÍTULO PRIMEIRO" reads as ordinary prose, gets
        # dropped as a mini-header, and the chapter itself never gets
        # created). Recognize a confident structural label even unbolded;
        # roman-numeral subheadings are excluded since "I." et al. are too
        # easily mistaken for ordinary prose without the bold signal.
        is_heading = is_full_bold(p_inner) or is_bare_structural_label(text)
        blocks.append(Block(is_heading, "prose", _pt_mark(text)))
    return merge_quote_blocks(blocks), footnote_table


def discover_pages_pt(fetcher: Fetcher) -> list[tuple[str, str]]:
    text = fetcher.fetch_str(PT_BASE + PT_TOC_HREF, PT_TOC_HREF)
    hrefs = re.findall(r'href="([^"]+)"', text)
    ordered: list[str] = []
    seen: set[str] = set()
    for h in hrefs:
        if not h.endswith("_po.html"):
            continue
        if h.startswith("index-") or h == "indice_po.html":
            continue
        # Front-matter links (e.g. the Laetamur Magnopere apostolic letter)
        # are absolute site paths and happen to also end in "_po.html";
        # every real CCC content page href is a bare filename in this same
        # directory, with no path separator.
        if "/" in h:
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
        "toc_href": EN_TOC_HREF,
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
        "toc_href": PT_TOC_HREF,
        "work_id": "ccc.pt",
        "title": "Catecismo da Igreja Católica",
        "base_url": PT_BASE,
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
}


def run_scrape(
    lang: str, sample: bool, corrections: list[dict] | None = None
) -> tuple[ScrapeState, list[tuple[str, str]], Fetcher]:
    cfg = LANG_CONFIG[lang]
    fetcher = make_fetcher(RAW_ROOT / cfg["raw_dir"])
    all_pages = cfg["discover"](fetcher)
    chunks = cfg["sample_chunks"](all_pages) if sample else [all_pages]

    state = ScrapeState(corrections, normalize_pt_inline_scripture=(lang == "pt"))
    fetched_pages: list[tuple[str, str]] = []
    for chunk in chunks:
        state.last_n = None  # each sample chunk is validated independently
        state.stack = []
        for url, name in chunk:
            try:
                html_text = fetcher.fetch_str(url, name)
            except RuntimeError as exc:
                # A single missing/broken page must not kill the whole crawl:
                # record it and let validation surface any paragraphs it
                # would have contributed as genuinely missing.
                state.fetch_failures.append(f"{name}: {exc}")
                continue
            fetched_pages.append((url, name))
            html_text = apply_raw_text_corrections(
                html_text,
                name,
                state.corrections,
                state.corrections_applied,
                state.corrections_seen,
            )
            chain = declared_chain(html_text)
            if chain is not None:
                state.declared_chains.append((name, chain))
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


# --------------------------------------------------------------------------
# The EN mirror's declared structure, as an oracle
# --------------------------------------------------------------------------

#: Every page of the EN mirror carries its own position in the document as a
#: `>`-separated chain of heading titles:
#:
#:   <meta name="part" content="PART TWO: ... &gt; SECTION ONE ... &gt;
#:    CHAPTER ONE ... &gt; Article 1 ... &gt; I. The Father-Source ..."/>
#:
#: That is the mirror stating its own structure, independently of the heading
#: blocks this scraper reads out of the body -- and the two can disagree. Two
#: divisions were missing from ccc.en for exactly that reason: Part Two's
#: CHAPTER ONE is declared on ten pages and printed as a heading block on
#: none, and Part One's SECTION TWO prints an identifier line with no title.
#: Both are now filed as `heading_html` corrections; this check is what keeps
#: the class from coming back silently, and what would have found them on day
#: one.
#:
#: IT IS AN AUDIT, NOT AN INPUT. Structure still comes from the body's heading
#: blocks in document order (see the module docstring): a chain carries no
#: paragraph numbers and no kinds, so it can say THAT a division is missing
#: but not where its content begins.
#:
#: EN only. The PT mirror prints no such tag -- checked on all 28 of its
#: pages -- so `declared_chains` stays empty there and this is a no-op.
_META_PART_RE = re.compile(
    r'<meta\s[^>]*\bname="part"[^>]*\bcontent="(.*?)"', re.DOTALL | re.IGNORECASE
)


def declared_chain(html_text: str) -> tuple[str, ...] | None:
    m = _META_PART_RE.search(html_text)
    if m is None:
        return None
    # Split on the raw `&gt;` separator BEFORE unescaping, or a heading
    # containing a literal ">" would split in two. Unescaped TWICE: the
    # attribute holds `&amp;quot;` for a quotation mark inside a heading, so
    # one pass leaves `&quot;` behind.
    parts = [
        re.sub(r"\s+", " ", ihtml.unescape(ihtml.unescape(part))).strip()
        for part in m.group(1).split("&gt;")
    ]
    return tuple(part for part in parts if part)


def _title_key(title: str) -> str:
    """A heading title reduced to its letters and digits, upper-cased.

    WHITESPACE-INSENSITIVE, which is now belt-and-braces rather than the
    workaround it started as: `strip_tags` used to put a space at every tag
    boundary, and this mirror's Word export splits words across tags, so one
    heading arrived as "VII. T he Eucharist ..." against the meta's
    "VII. The Eucharist ...". `_INLINE_TAGS` fixed that at the source. The
    tolerance stays because a heading's spacing is not what this check is
    about. Footnote markers need no special handling: `title` is the plain
    form and keeps them in `title_marked` instead (see `Node`), and the
    non-alphanumeric strip below would drop the brackets anyway."""
    folded = unicodedata.normalize("NFKD", title)
    return re.sub(r"[^A-Za-z0-9]+", "", folded).upper()


#: Declared headings our tree deliberately does NOT match, because a
#: `heading_html` correction changed the heading the mirror printed. Keyed by
#: the declared title, valued by the title we emit; both are compared through
#: `_title_key`, so spacing and punctuation here are cosmetic.
_DECLARED_TITLE_OVERRIDES = {
    # Correction ccc.en-p1s2-missing-section-title. The mirror prints no title
    # for Part One's Section Two, and builds this breadcrumb from the same
    # heading blocks this scraper reads -- so it glues the identifier line to
    # the first subdivision beneath it and declares the two as one heading.
    "SECTION TWO I. THE CREEDS": "SECTION TWO THE PROFESSION OF THE CHRISTIAN FAITH",
}

_DECLARED_KEY_OVERRIDES = {
    _title_key(k): _title_key(v) for k, v in _DECLARED_TITLE_OVERRIDES.items()
}


def check_declared_structure(state: ScrapeState) -> list[str]:
    """Every heading the mirror declares, checked against the tree we built:
    present at all, and under the same ancestors."""
    if not state.declared_chains:
        return []

    declared: dict[tuple[str, ...], str] = {}
    for page, chain in state.declared_chains:
        for depth in range(len(chain)):
            keys = tuple(
                _DECLARED_KEY_OVERRIDES.get(_title_key(x), _title_key(x))
                for x in chain[: depth + 1]
            )
            declared.setdefault(keys, page)

    ours: set[tuple[str, ...]] = set()
    titles: set[str] = set()

    def walk(nodes: list[Node], ancestry: tuple[str, ...]) -> None:
        for node in nodes:
            here = (*ancestry, _title_key(node.title))
            ours.add(here)
            titles.add(here[-1])
            walk(node.children, here)

    walk(state.root_children, ())

    problems = []
    for chain, page in declared.items():
        if chain in ours:
            continue
        under = " > ".join(chain[:-1])[-60:]
        kind = "missing from" if chain[-1] not in titles else "nested differently in"
        problems.append(
            f"{page}: heading declared by the source is {kind} the tree "
            f"({chain[-1][:60]!r}, declared under ...{under})"
        )
    return problems


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
            rf"{MARK_OPEN}([^ {MARK_CLOSE}]+){MARK_CLOSE}",
            " ".join(b.text for b in para.blocks),
        )
        markers = [c["marker"] for c in para.citations]
        # A marker may appear more than once in text_marked (the source
        # occasionally cites the same footnote twice in one paragraph) but
        # gets exactly one citations entry -- so this is a set-membership
        # check, not a multiset/count equality.
        if set(tokens) != set(markers) or len(markers) != len(set(markers)):
            problems.append(
                f"paragraph {n}: token/citation mismatch {tokens} vs {markers}"
            )
        citation_labels = {c["marker"]: c.get("label", "") for c in para.citations}
        recombined = re.sub(
            rf"{MARK_OPEN}([^ {MARK_CLOSE}]+){MARK_CLOSE}",
            lambda m, labels=citation_labels: labels.get(m.group(1), ""),
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
        # The same invariant paragraphs are held to: no token without a
        # citation, no citation without a token, and never a token left in the
        # plain form.
        if MARK_OPEN in node.title:
            problems.append(f"node {node.title[:60]!r}: marker token left in title")
        tokens = set(_MARKER_TOKEN_RE.findall(node.title_marked or ""))
        markers = {c["marker"] for c in node.citations}
        if tokens != markers:
            problems.append(
                f"node {node.title[:60]!r}: token/citation mismatch "
                f"{sorted(tokens)} vs {sorted(markers)}"
            )
        if node.title_marked is not None and not node.citations:
            problems.append(f"node {node.title[:60]!r}: title_marked with no citations")
        for c in node.children:
            check_titles(c)

    for node in state.root_children:
        check_titles(node)

    if not sample:
        # Full runs only: a sampled slice deliberately skips pages, and the
        # ancestors they declare would every one of them read as missing.
        problems.extend(check_declared_structure(state))

    return (len(problems) == 0), problems


def build_manifest(
    lang: str,
    state: ScrapeState,
    fetched_pages: list[tuple[str, str]],
    sample: bool,
    generated_at: str,
) -> dict:
    cfg = LANG_CONFIG[lang]
    # A cache-only reparse is not a new retrieval. Preserve each source's
    # original capture date when an existing manifest knows it; otherwise a
    # harmless parser change would falsely claim every raw page was fetched
    # again today, undermining the raw/works distinction.
    previous_dates: dict[str, str] = {}
    previous_manifest = WORKS_ROOT / cfg["work_id"] / "manifest.json"
    if previous_manifest.exists():
        old = json.loads(previous_manifest.read_text(encoding="utf-8"))
        previous_dates = {
            source["url"]: source["retrieved_at"]
            for source in old.get("sources", [])
            if "url" in source and "retrieved_at" in source
        }
    today = datetime.now(UTC).strftime("%Y-%m-%d")
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
        (
            "Structure is read from the heading blocks in the body, in document order. "
            "The EN mirror additionally DECLARES each page's full ancestor chain in a "
            '<meta name="part"> tag, and every heading it declares is checked against '
            "the tree that was built (see check_declared_structure); the PT mirror prints "
            "no such tag, so the check is EN-only. It found two divisions the EN mirror "
            "declares but never prints as a heading block, both now supplied by "
            "heading_html corrections: Part One's Section Two title ('THE PROFESSION OF "
            "THE CHRISTIAN FAITH' -- the mirror prints the identifier line alone, so its "
            "own breadcrumb falls through to the first subdivision, 'I. THE CREEDS'), and "
            "Part Two Section One's CHAPTER ONE ('THE PASCHAL MYSTERY IN THE AGE OF THE "
            "CHURCH'), whose two articles had attached straight to the section. Both are "
            "corroborated by the PT mirror, which prints both."
        ),
        (
            "Tag flattening distinguishes inline tags (b/i/font/a/sup/sub/span -- dropped) "
            "from everything else (dropped and replaced with a space). Every tag used to "
            "become a space, which is right at a block boundary and wrong at an inline one: "
            "both mirrors are Word exports that open and close inline tags mid-word, so a "
            "space appeared before some footnote markers and closing punctuation, one "
            "heading read 'VII. T he Eucharist' (source: '<b>VII. T</b><b>he Eucharist'), "
            "and an accented name read 'S. Nicolau de Fl ue'. It was not only cosmetic: in "
            "PT it hid 58 footnote references from the '(N)' marker regex ('( 219)'), which "
            "were simply lost, and broke the footnote table's sequential-number scan ('279.' "
            "arriving as '2 79.'), leaving three footnotes empty and making two others "
            "swallow the next one's text. Fixing it changed 2,150 EN and 568 PT blocks, all "
            "spacing; EN paragraph text is character-identical once spaces are ignored. One "
            "consequence worth naming: PT's unbolded sub-heading '<<FAZ TUDO QUANTO LHE "
            "APRAZ>> (Sl 115, 3)' now falls under the mini-header word cap and is dropped "
            "(logged) instead of being appended to the end of paragraph 268, where it did "
            "not belong."
        ),
        (
            "A structure node carries its own footnote apparatus where the source prints "
            "one: `title` is the plain heading, `title_marked` keeps the reference in "
            "place as a token, and `citations` holds the footnote text -- the same "
            "text/text_marked/citations triple a paragraph has, and omitted entirely on "
            "the 394 of 396 EN nodes that have no apparatus. Two EN headings do: "
            "'III. Christ Jesus -- \"Mediator and Fullness of All Revelation\"' (DV 2.) "
            "and 'II. \"I Know Whom I Have Believed\"' (2 Tim 1:12), each sourcing the "
            "phrase its heading quotes. Before this the token sat in `title` and rendered "
            "literally in the site's index, and the footnote text reached no output field "
            "at all. No PT heading and no node of any other work carries one."
        ),
    ]
    if state.gaps:
        notes.append(f"source paragraph-number gaps detected: {state.gaps}")
    if state.fetch_failures:
        notes.append(
            f"page fetch failures (skipped, non-fatal): {state.fetch_failures}"
        )
    if state.orphan_content:
        notes.append(
            f"{len(state.orphan_content)} unnumbered content blocks (epigraphs opening "
            "certain articles, e.g. the Decalogue commandment texts and creed texts) were "
            "not attached to any paragraph -- a known v1 capture gap, logged not fabricated; "
            "see scraper output for the per-article breakdown."
        )
    if sample:
        notes.insert(
            0,
            "SAMPLE RUN -- partial corpus, for review only. Not the full 1-2865 crawl.",
        )
    # THE MIRROR'S OWN TABLE OF CONTENTS GOES FIRST. `sources[0]` is what the
    # site links to as "the page this text came from" (site/src/lib/copyright.ts),
    # and the crawl's first CONTENT page is a poor answer: EN's is "__P1.HTM",
    # the Prologue, which tells a reader nothing about where the rest is. The
    # index is the page `discover_pages_*` actually starts from -- it is
    # genuinely a source of this work (it supplied the page list), it is
    # already cached in raw/, and it is the address a reader following the
    # link wants. Dated from the crawl that fetched the content pages, since
    # that is the same request run; `today` only for a first-ever build.
    toc_url = cfg["base_url"] + cfg["toc_href"]
    crawl_date = next(iter(previous_dates.values()), today)
    sources = [
        {
            "url": toc_url,
            "retrieved_at": previous_dates.get(toc_url, crawl_date),
        }
    ] + [
        {
            "url": url,
            "retrieved_at": previous_dates.get(url, today),
        }
        for url, _ in fetched_pages
        if url != toc_url
    ]
    return {
        "id": cfg["work_id"],
        "type": "catechism",
        "title": cfg["title"],
        "short_title": "CCC",
        "language": lang,
        "edition": "vatican.va archive mirror, 1993/1997 second typical edition text",
        "sources": sources,
        "copyright": {
            "status": "copyrighted",
            "holder": cfg["copyright_holder"],
            "notice": cfg["copyright_notice"],
        },
        "notes": " ".join(notes),
        "generated_at": generated_at,
        "corrections_applied": len(state.corrections_applied),
    }


def write_outputs(
    lang: str, state: ScrapeState, fetched_pages: list[tuple[str, str]], sample: bool
) -> None:
    out_dir = WORKS_ROOT / LANG_CONFIG[lang]["work_id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    for node in state.root_children:
        node.compute_span()
    structure = [n.to_dict() for n in state.root_children]
    paragraphs = [state.paragraphs[n].to_dict() for n in sorted(state.paragraphs)]
    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    manifest = build_manifest(lang, state, fetched_pages, sample, generated_at)

    write_stamped_json(
        out_dir,
        {
            "manifest.json": manifest,
            "structure.json": structure,
            "paragraphs.json": paragraphs,
            "abbreviations.json": [],
            "corrections-applied.json": corrections_receipt(
                LANG_CONFIG[lang]["work_id"],
                state.corrections_applied,
                state.corrections,
                generated_at,
            ),
        },
        generated_at,
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
    print(f"dropped mini-headers: {len(state.dropped)}")
    if state.false_starts:
        print(f"false paragraph-number starts: {state.false_starts}")
    if state.fetch_failures:
        print(f"fetch failures ({len(state.fetch_failures)}): {state.fetch_failures}")
    if state.orphan_content:
        by_article: dict[str, int] = {}
        for entry in state.orphan_content:
            where = entry.split("]", 1)[0].lstrip("[") if entry.startswith("[") else "?"
            by_article[where] = by_article.get(where, 0) + 1
        print(
            f"orphan content (no open structure/paragraph): {len(state.orphan_content)} "
            f"blocks across {len(by_article)} articles/sections"
        )
        for where, count in by_article.items():
            print(f"  - {where}: {count}")
        print("  sample:")
        for entry in state.orphan_content[:10]:
            print(f"    {entry}")
    if state.anomalies:
        print(f"anomalies ({len(state.anomalies)}): {state.anomalies}")
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
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    langs = ["en", "pt"] if args.lang == "both" else [args.lang]
    overall_ok = True
    for lang in langs:
        corrections = load_corrections(LANG_CONFIG[lang]["work_id"])
        try:
            state, fetched_pages, fetcher = run_scrape(lang, args.sample, corrections)
        except CorrectionDriftError as exc:
            print(f"\nCORRECTIONS DRIFT GUARD FAILED ({lang}): {exc}", file=sys.stderr)
            return 1

        if not args.sample:
            # Full run: every non-unresolved correction must have found and
            # fixed its target somewhere in the crawl, or the source has
            # drifted since the entry was authored -- fail loudly rather
            # than silently shipping a corpus with a stale, unapplied entry.
            missing = [
                c["id"]
                for c in corrections
                if not c.get("resolution") and c["id"] not in state.corrections_seen
            ]
            if missing:
                print(
                    f"\nCORRECTIONS DRIFT GUARD FAILED ({lang}): entries never matched "
                    f"during full run: {missing}",
                    file=sys.stderr,
                )
                return 1

        write_outputs(lang, state, fetched_pages, args.sample)
        ok, problems = validate(lang, state, args.sample)
        print_summary(lang, state, ok, problems)
        print(f"(network fetches this run: {fetcher.network_fetches})")
        print(
            f"corrections applied: {len(state.corrections_applied)}, "
            f"unresolved/documented: {len([c for c in corrections if c.get('resolution')])}"
        )
        overall_ok = overall_ok and ok

    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
