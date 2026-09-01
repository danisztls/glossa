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

vatican.va publishes fourteen editions in all, ten of them this same HTML and
four PDF-only -- see `EDITIONS`, and `--capture` for taking them all into
raw/. Only these two are parsed; the rest are held so that adding one later
is a re-parse rather than another crawl.

These pages are IntraText's export, but the Compendium is NOT in IntraText's
own library: its Catholica section carries the 1997 Catechism in nine
languages and stops before 2005, so vatican.va is the only source for this
work, in every language it has.

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
inline, in trailing parentheses) as the last block of the answer. Four
English answers interrupt that with a bulleted list -- one single-item
<ul><li> per bullet -- and nothing else in either edition does.

This script parses each page as a flat stream of top-level <p>,
<blockquote> and <li> blocks (verified non-nested across every block
inspected; the <ul> wrappers carry no text of their own). A
small stack keyed by heading level builds the Part/Section/Chapter tree,
question numbers attach to whichever node is deepest-open, and content
between "<a name="INTRODUCTION">" and "<a name="APPENDIX">" (EN) / the
Portuguese equivalents is the only region walked -- this cleanly skips the
page's own table of contents (which repeats every heading as a same-text
"#anchor" link, and would otherwise be misparsed as duplicate headings) and
the unnumbered front matter.

Usage:
  uv run pipeline/scrapers/ccc/compendium.py --lang en|pt|both
  uv run pipeline/scrapers/ccc/compendium.py --capture [all|de,fr,...]

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
    corpus/raw/. What the source DOES mark up explicitly is where a title
    ends -- see `heading_title`.
"""

from __future__ import annotations

import argparse
import html as ihtml
import re
import sys
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
    build_root,
    captured_at,
    corrections_receipt,
    download_resumable,
    fold,
    load_corrections,
    raw_root,
    require_corpus,
    write_stamped_json,
)
from compendium_pdf import (
    PDF_EDITIONS,
    apply_pdf_corrections,
    pdf_copyright,
    process_pdf_body,
    read_edition,
)

USER_AGENT = "Glossa Catholica corpus builder"
CRAWL_DELAY = 2.0  # seconds; robots.txt on vatican.va says Crawl-delay: 2

# The corpus is a separate, private repository (docs/decisions.md
# §The corpus); `common.corpus_dir()` resolves it, honouring $CORPUS_DIR.
RAW_ROOT = raw_root()
BUILD_ROOT = build_root()

DOCUMENTS_URL = "https://www.vatican.va/archive/compendium_ccc/documents/"

#: EVERY edition vatican.va publishes, keyed by OUR language tag; the value is
#: the file the mirror serves. Two things about it are worth stating rather
#: than inferring:
#:
#:   - The stem carries the VATICAN's language slug, which is not ours and not
#:     ISO: `ge` for German, `sp` for Spanish, `po` for Portuguese, `lit` for
#:     Lithuanian. The mapping is the point of this table.
#:   - Four editions exist only as PDF. That is the source's limit, not a
#:     choice here: there is no HTML for Belarusian, Indonesian, Lithuanian or
#:     Russian anywhere on the site. They are still captured, byte-exact, by
#:     `--capture` -- nothing parses them, and `raw/` is where the answer to
#:     "could we have?" lives (docs/link-surface.md).
#:
#: Taken from the language selector printed on the English page itself, not
#: from guessing at slugs. There is no Latin edition on vatican.va; the
#: *editio typica latina* exists in print and is not published here.
EDITIONS = {
    "be": "archive_2005_compendium-ccc_be.pdf",
    "de": "archive_2005_compendium-ccc_ge.html",
    "en": "archive_2005_compendium-ccc_en.html",
    "es": "archive_2005_compendium-ccc_sp.html",
    "fr": "archive_2005_compendium-ccc_fr.html",
    "hu": "archive_2005_compendium-ccc_hu.html",
    "id": "archive_compendium-ccc_id.pdf",
    "it": "archive_2005_compendium-ccc_it.html",
    "lt": "compendium_catech_lit.pdf",
    "pt": "archive_2005_compendium-ccc_po.html",
    "ro": "archive_2005_compendium-ccc_ro.html",
    "ru": "archive_compendium-ccc_ru.pdf",
    "sl": "archive_2005_compendium-ccc_sl.html",
    "sv": "archive_2005_compendium-ccc_sv.html",
}


#: One raw directory per language, named by OUR tag -- so the Portuguese file
#: `..._po.html` lands in `compendium-pt/`, which is what it has always done.
def raw_name(lang: str) -> str:
    return f"compendium-{lang}/{EDITIONS[lang]}"


def source_url(lang: str) -> str:
    return DOCUMENTS_URL + EDITIONS[lang]


EN_URL = source_url("en")
PT_URL = source_url("pt")

FIRST_Q = 1
LAST_Q = 598

COPYRIGHT_NOTICE = "© Copyright 2005 - Libreria Editrice Vaticana"
COPYRIGHT_HOLDER = "Libreria Editrice Vaticana"


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

#: Capture, unlike a parse run, DOES retry -- and the difference is not
#: inconsistency. The no-retry rule above is about a parse: a page that failed
#: would silently make the output wrong, so stopping is the correct answer.
#: A capture writes nothing anyone reads, reports each file by name, and is
#: pulling megabyte-scale PDFs across an edge that drops roughly one request in
#: six to eight (CLAUDE.md); one attempt there just means a hand-run retry.
CAPTURE_POLICY = FetchPolicy(
    user_agent=USER_AGENT,
    delay=2.0,
    attempts=3,
    backoff=(5.0, 15.0),
    timeout=180.0,
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

# `<br\b[^>]*>` rather than `<br\s*/?>`: the Word export writes
# `<br clear="all" />` at 26 places across the ten editions, and the narrow
# pattern left those to `_TAG_RE`, which drops a tag with no replacement --
# gluing the two printed lines into one word. Harmless where the source also
# printed a space, silent corruption where it did not.
_BR_RE = re.compile(r"<br\b[^>]*>", re.IGNORECASE)
_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


#: The Word export that made these pages double-encoded some of its
#: punctuation, leaving a U+00C2 in front of the mark itself: the entity run
#: `&Acirc;&#x2013;` where the page prints an en dash, and the same before
#: curly quotes and the ellipsis. 38 occurrences across four editions, 28 of
#: them Spanish.
#:
#: THIS IS DECODING, NOT A TEXT CORRECTION, which is why it is here rather
#: than in `pipeline/corrections/`. The stray character is not something the
#: source says and we disagree with -- it is the byte residue of encoding the
#: mark twice, in a file that is pure ASCII and expresses every non-ASCII
#: character as an entity. The same claim `decode_cp1252` makes about this
#: source's bytes, one level up.
#:
#: The follow-set is what keeps it safe and is checked rather than assumed:
#: only punctuation in the General Punctuation block, never a letter. French
#: prints a real Â in "GRÂCE" and "ton ÂME", and a rule reading Â alone would
#: silently eat it.
_DOUBLE_ENCODED_RE = re.compile("\u00c2([\u2010-\u2027])")


def strip_double_encoding(text: str) -> str:
    return _DOUBLE_ENCODED_RE.sub(r"\1", text)


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
    s = strip_double_encoding(ihtml.unescape(s))
    return _WS_RE.sub(" ", s).strip()


_BOLD_SPAN_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.DOTALL)
_ITALIC_SPAN_RE = re.compile(r"<i[^>]*>(.*?)</i>", re.DOTALL)


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


def is_full_italic(inner: str) -> bool:
    """True when the block is a quotation set in italics, attribution aside.

    ROMANIAN HAS NO `<blockquote>` AT ALL. Where the other nine editions set a
    quotation off as one, it prints an ordinary paragraph in italics with the
    attribution after the closing italic, in parentheses -- so a walk that
    knows only `<blockquote>` stored all 24 of its quotations as answer prose
    and reported "quote blocks: 0" without anything looking wrong.

    Wholly italic OR italic up to the attribution, because that is how the
    edition prints it: `<i>"Mare esti tu, Doamne..."</i> (Sfantul Augustin).`
    """
    full = strip_tags(inner)
    if not full:
        return False
    italic = strip_tags(" ".join(_ITALIC_SPAN_RE.findall(inner)))
    if not italic:
        return False
    body, _ = split_attribution(full)
    return italic in (full, body)


# WHERE A HEADING'S TITLE ENDS, and why it takes two rules to say.
#
# A labelled heading is printed as a label line ("CHAPTER TWO", "SEGUNDA
# PARTE") followed by its title, and the two arrive either as one block with a
# <br/> between them or as two consecutive blocks -- and the unlabelled
# sub-headings beneath a chapter are set in the SAME centred bold style, so
# typography cannot tell the title from what follows it. An earlier version
# swallowed every following full-bold block and produced chapter titles like
# "The Sacramental Celebration of the Paschal Mystery CELEBRATING THE LITURGY
# OF THE CHURCH Who celebrates?", losing the two sub-headings as structure
# nodes as well.
#
# THE NAMED ANCHOR IS THE SOURCE'S OWN ANSWER, where the mirror gives one. It
# is the target of the page's table of contents, so it wraps the title and
# nothing else: not the label line, not the sub-headings under it. EN and PT
# anchor every one of their 33 headings.
#
# WHERE IT DOES NOT, the printed line is the next best witness: the source
# breaks the line between label and title because they are separate lines.
# Four editions (de, ro, sl, sv) carry no named anchor at all, and Hungarian
# carries 21 for 33 headings -- worse than none, in that a rule reading only
# anchors would work silently for two thirds of them.
#
# The line rule is SECOND rather than only, because it cannot see a title that
# wraps: EN's "CHAPTER ONE 'You Shall Love the Lord Your God / With All Your
# Heart, With All Your Soul, / and With All Your Mind'" is one title printed
# on three lines, and reading lines alone turns the last two into sub-headings
# that no edition has. What catches that where no anchor exists is the
# cross-edition structure check in `validate` -- every edition of this work
# has the same tree.
# `[^>]*\bname=` rather than `\s+name=`: the attribute is not always first.
_ANCHOR_RE = re.compile(r"<a\b[^>]*\bname=[^>]*>(.*?)</a>", re.DOTALL | re.IGNORECASE)


def split_anchor(inner: str) -> tuple[str, str, str] | None:
    """`inner` split around its named anchor: (before, anchor text, the raw
    HTML after it), the first two flattened to plain text. None when the block
    carries no anchor. Slicing the raw HTML around the match can cut mid-tag,
    which is harmless -- `strip_tags` drops tag debris either way.

    The tail stays HTML rather than printed lines because it may hold a
    SECOND anchor, and only the anchor tells `fused_heading` where the next
    heading's title ends. Callers that just want the lines call
    `printed_lines` on it."""
    m = _ANCHOR_RE.search(inner)
    if m is None:
        return None
    return (
        strip_tags(inner[: m.start()]),
        strip_tags(m.group(1)),
        inner[m.end() :],
    )


def printed_lines(inner: str) -> list[str]:
    """One block's printed lines: its inner HTML split at `<br/>`, each
    flattened and the empty ones dropped."""
    return [t for t in (strip_tags(part) for part in _BR_RE.split(inner)) if t]


def _join(*parts: str) -> str:
    return " ".join(part for part in parts if part)


# A question opens with its number, and the three things that follow it vary:
# "1. What", "523.¿Que" (no space -- ES twice) and "210 ¿Que" (no period at
# all -- ES twice more). Requiring EITHER the period or the space, rather than
# both or neither, is what reads all three without also matching a bold
# reference range: "1210-1211" has neither after its first three digits.
_QUESTION_START_RE = re.compile(r"^(\d{1,3})(?:\.\s*|\s+)(.*)$", re.DOTALL)


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
        # Omitted when "prose" -- see vatican_docs.py's BlockOut for why, and
        # docs/corpus-schema.md for the schema statement.
        d: dict = {}
        if self.kind != "prose":
            d["kind"] = self.kind
        d["text"] = self.text
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
    def __init__(self, refs_after: bool = False, from_markup: bool = True):
        #: Whether this edition prints the reference line after the answer
        #: rather than after the question -- see LANG_CONFIG's `refs_after`.
        self.refs_after = refs_after
        #: False for the editions read from a PDF. The only thing that turns
        #: on it is the leftover-markup check in `validate`, which looks for
        #: an angle bracket in stored text as evidence that `strip_tags`
        #: missed a tag. A PDF has no tags to miss, so the bracket can only be
        #: the source's own punctuation -- the Byelorussian marks an elision
        #: inside a quotation as `<...>` where other editions print `[...]`,
        #: and that is text to keep, not markup to have removed.
        self.from_markup = from_markup
        self.corrections: list[dict] = []
        self.corrections_applied: list[dict] = []
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
        # A HEADING THE SOURCE PRINTS TWICE is one division, not two. Slovenian
        # sets "DRUGI ODDELEK / SEDEM ZAKRAMENTOV CERKVE" before the list of
        # the seven sacraments and then again, identically, before the first
        # question under it -- a running head reprinted after the interposed
        # matter. Read as two sections it gave the work ten, and the
        # subsequence check in `validate` rejected the whole tree.
        #
        # Matched on kind, number AND title, and only against a heading still
        # open: two chapters numbered 1 in different sections never collide,
        # because the earlier one has already been popped.
        for depth, node in enumerate(self.stack):
            if (node.kind, node.n, node.title) == (kind, n, title):
                del self.stack[depth + 1 :]
                return
        while self.stack and self.stack[-1].level >= level:
            self.stack.pop()
        node = Node(kind, n, title, level)
        (self.stack[-1].children if self.stack else self.root_children).append(node)
        self.stack.append(node)

    def start_question(self, n: int, question_text: str) -> None:
        self.finalize_current()
        self.current = Question(n=n, question=question_text)
        self.mode = "in_answer" if self.refs_after else "awaiting_refs"
        if self.stack:
            self.stack[-1].own.add(n)
        else:
            self.anomalies.append(f"question {n} started with no open structure node")

    def set_refs(self, refs: str) -> None:
        assert self.current is not None
        self.current.ccc_refs = refs
        # The answer stays open either way. Reading the reference line as the
        # end of the answer looked right and is not: Romanian prints
        # question, answer, references, THEN the quotation that closes the
        # answer, and closing at the references dropped 22 of its 23
        # quotations as orphans.
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
    #: The opening tag's attributes, verbatim. Kept because `align="center"`
    #: is the one heading signal every edition agrees on -- see `is_centred`.
    attrs: str = ""


# <li> is here for one reason and it is not tidiness: four English answers
# print their enumeration as a list rather than as prose, and a walk over
# <p> and <blockquote> alone silently dropped every item. Q523 was stored
# as "The eighth commandment forbids: A sin committed against truth demands
# reparation if it has caused harm to others." -- the lead-in and the
# closing sentence with the three things it forbids gone from between them.
# All 16 items in the edition sit inside the walked region, in questions
# 445, 470, 483 and 523; the Portuguese page has no <ul>/<li> at all and
# prints the same enumerations as run-on prose, which is why the loss was
# one-sided and why adding this alternative leaves PT byte-identical.
#
# The source wraps each item in its own single-item <ul> (Word export), so
# matching <li> rather than <ul> is both simpler and the thing that
# actually carries the text.
_BLOCK_RE = re.compile(
    r"<p(?P<attrs>[^>]*)>(?P<p>(?:(?!</p>|<p[\s>]).)*?)(?:</p>|(?=<p[\s>]))"
    r"|<blockquote>(?P<bq>(?:(?!</blockquote>).)*?)</blockquote>"
    r"|<li[^>]*>(?P<li>(?:(?!</li>).)*?)</li>",
    re.DOTALL,
)

# TEXT THAT SITS OUTSIDE ANY PARAGRAPH, read from the GAPS between block
# matches rather than by adding alternatives to `_BLOCK_RE`. Swedish needs it
# twice over: 21 of its 598 questions open in bold outside any paragraph
# (`</p><b>52. Vem har skapat varlden?</b><p>`), and 39 of its answers are
# bare text between a closing `</p>` and the next `<p>` -- Q386's whole answer
# on the virtue of faith sits there. Walking only <p>, <blockquote> and <li>
# lost all 21 questions, which the sequential-number guard reported as source
# gaps that are not in the source, and stored those 39 answers as nothing but
# their own reference line.
#
# WHY THE GAPS AND NOT AN ALTERNATIVE. An alternative matches wherever it can
# and CONSUMES what it spans, and this markup leaves bold open across table
# cells: one such run began inside the Latin Pater noster and closed after
# question 578, taking the question's whole paragraph with it. Reading only
# what the main scan did not claim cannot do that.
#
# The whole gap becomes one block, not the bold run alone, because Swedish
# also breaks a question across two bold runs (`<b>116. Har Jesus fornekat</b>
# <b>Israels tro pa Gud...</b>`) and the second half is not question-shaped on
# its own.
_CENTRED_RE = re.compile(r'align\s*=\s*"?center"?', re.IGNORECASE)


#: The longest heading printed in any of the ten editions is 118 characters;
#: the cap is above that and well below a sentence of catechesis.
SUB_HEADING_MAX = 140


def is_sub_heading(b: Block) -> bool:
    """Whether an unlabelled block is a sub-heading rather than text.

    Wholly bold is EN's and PT's own mark and is taken at face value. Centring
    is what the editions that do not embolden use -- but it is also how they
    set the Creed, the Decalogue and the catechetical formula, which are text.
    A full stop is what separates the two: a heading in this work does not end
    in one and a sentence does. Without that clause the Portuguese summary of
    the Ten Commandments ("Estes dez mandamentos resumem-se em dois...")
    became a structure node.
    """
    if is_full_bold(b.inner):
        return True
    return (
        is_centred(b.attrs)
        and len(b.stripped) <= SUB_HEADING_MAX
        and not b.stripped.endswith(".")
    )


def is_centred(attrs: str) -> bool:
    """Whether the block was printed centred.

    THE ONE TYPOGRAPHIC SIGNAL ALL TEN EDITIONS SHARE. Boldness does not:
    German, Romanian and Swedish set their unlabelled sub-headings in plain
    centred text, so `is_full_bold` finds 27 of German's 70 and the rest were
    silently dropped as orphans. Centring alone is not sufficient either --
    the Creed, the Decalogue and the epigraphs are centred and are text, not
    headings -- which is why `is_sub_heading` asks for both this and a shape
    no sentence has."""
    return bool(_CENTRED_RE.search(attrs))


def split_at_question(inner: str, refs_shape: re.Pattern) -> list[str]:
    """One `<p>`'s inner HTML, split where the paragraph holds more than one
    unit of the Q&A stream.

    Usually a question, its reference line and its answer each get a paragraph
    of their own. Two editions break that, in opposite directions:

      - Spanish ends an answer, prints two `<br/>`s and opens the NEXT
        question in the same paragraph (Q339 and three more). Read whole, the
        block starts with answer prose, so nothing matches and the question
        vanishes.
      - Italian prints a question, its references and its whole answer as one
        paragraph broken by `<br/>` (Q534, and six more that lost only their
        reference line). Read whole, the question's text becomes the question,
        the references and the answer along with it, and the question is
        stored with no answer at all.

    So the cuts are: before any later line that opens a question, and -- when
    the paragraph itself opens with one -- after that question and after the
    run of reference-shaped lines that follows it. Reference lines are joined
    rather than split, because an edition may print a range over two lines
    and both halves are one citation.

    A heading's block also carries `<br/>`s and `heading_title` needs it whole
    (see `printed_lines`). No heading opens with a question number and none
    contains one, so no heading is cut here.
    """
    parts = _BR_RE.split(inner)
    if len(parts) < 2:
        return [inner]

    def joined(lo: int, hi: int) -> str:
        return "<br/>".join(parts[lo:hi])

    cuts = [
        j
        for j, part in enumerate(parts)
        if j and match_question_start(part, strip_tags(part)) is not None
    ]
    opens = match_question_start(parts[0], strip_tags(parts[0])) is not None
    if not cuts and not opens:
        return [inner]

    out, prev = [], 0
    if opens:
        first_break = cuts[0] if cuts else len(parts)
        refs_end = 1
        while refs_end < first_break and refs_shape.match(strip_tags(parts[refs_end])):
            refs_end += 1
        for lo, hi in ((0, 1), (1, refs_end), (refs_end, first_break)):
            if lo < hi:
                out.append(joined(lo, hi))
        prev = first_break
    for j in [*cuts, len(parts)]:
        if j > prev:
            out.append(joined(prev, j))
            prev = j
    return out


def extract_blocks(
    body: str, refs_shape: re.Pattern, bare_bold: bool = False
) -> list[Block]:
    blocks: list[Block] = []

    def add(inner: str, is_bq: bool, attrs: str) -> None:
        for part in [inner] if is_bq else split_at_question(inner, refs_shape):
            stripped = strip_tags(part)
            if stripped:
                blocks.append(Block(is_bq, part, stripped, attrs))

    last_end = 0
    for m in _BLOCK_RE.finditer(body):
        if bare_bold:
            add(body[last_end : m.start()], False, "")
        last_end = m.end()
        if m.group("bq") is not None:
            add(m.group("bq"), True, "")
            continue
        # A <p> or a <li>. A list item is answer prose set off by a bullet, so
        # it enters as prose and `add_prose` joins it onto the run it belongs
        # to -- the lead-in, the items and the closing sentence come out as
        # the one block the answer already was. That is not a compromise
        # forced by the block vocabulary being prose/quote
        # (docs/corpus-schema.md): it is what the Portuguese edition, which
        # bullets nothing, produces for the same four answers. The bullets
        # themselves are presentation and are recorded in the manifest notes
        # rather than modelled.
        inner = m.group("p")
        add(m.group("li") if inner is None else inner, False, m.group("attrs") or "")
    if bare_bold:
        add(body[last_end:], False, "")
    return blocks


def heading_title(
    blocks: list[Block], i: int, match_label, state: ScrapeState
) -> tuple[str, list[str], int, str]:
    """The full title of the labelled heading starting at `blocks[i]`, the
    sub-headings printed with it (usually none), how many blocks the whole
    thing consumed, and the raw HTML left over after the title (empty unless
    the title came from an anchor -- see `fused_heading`, which is the only
    caller that needs it).

    The label line and its title arrive either as one block
    ("SEGUNDA PARTE<br/>A CELEBRACAO DO MISTERIO CRISTAO") or as two
    consecutive ones ("CHAPTER TWO", then "God Comes to Meet Man"). Both are
    the same shape either way once the block is read as an anchor plus what
    follows it, or as printed lines -- see the note above `split_anchor` for
    which rule applies when, and why there are two.

    The title KEEPS its label ("Part One The Profession of Faith"): the label
    is how the work refers to the division, and dropping it would leave the
    reader a title with no ordinal.
    """
    b = blocks[i]

    split = split_anchor(b.inner)
    if split is not None:
        pre, name, tail = split
        return _join(pre, name), printed_lines(tail), 1, tail

    nxt = blocks[i + 1] if i + 1 < len(blocks) else None
    followable = (
        nxt is not None
        and not nxt.is_bq
        and match_label(nxt.stripped) is None
        and match_question_start(nxt.inner, nxt.stripped) is None
    )
    if followable:
        split = split_anchor(nxt.inner)
        if split is not None:
            pre, name, tail = split
            return _join(b.stripped, pre, name), printed_lines(tail), 2, tail

    lines = printed_lines(b.inner)
    if len(lines) > 1:
        return _join(lines[0], lines[1]), lines[2:], 1, ""
    if followable:
        nlines = printed_lines(nxt.inner)
        if nlines:
            return _join(b.stripped, nlines[0]), nlines[1:], 2, ""

    # A label with nothing printed after it. Not seen in any of the ten
    # editions, so this is a "the mirror changed" path: emit the bare label as
    # the title rather than an empty one, and say so in the run summary.
    state.anomalies.append(
        f"heading {b.stripped[:60]!r}: no title line printed after the label"
    )
    return b.stripped, [], 1, ""


def fused_heading(
    tail: str, subs: list[str], match_label
) -> tuple[str, int | None, str, list[str]] | None:
    """The heading a mirror printed INSIDE another heading's paragraph:
    (kind, number, title, the sub-headings left after it). None when the
    leftover lines are what they usually are, plain sub-headings.

    A heading's block normally holds a label and its title, and anything
    printed after those is a sub-heading set with a `<br/>` rather than in a
    block of its own (PT's "OS SIMBOLOS DA FE"). The Spanish mirror breaks
    that assumption once, at Part Four: where the other nine editions print
    the part title and the section heading as separate paragraphs, it fuses
    them into one, using four `<br/>`s where the others use a blank
    paragraph --

        <p>CUARTA PARTE</p>
        <p><a name=...>LA ORACION CRISTIANA</a><br/><br/><br/><br/>
           PRIMERA SECCION <br/><a name=...>LA ORACION <br/>EN LA VIDA
           CRISTIANA</a></p>

    -- so "PRIMERA SECCION", "LA ORACION" and "EN LA VIDA CRISTIANA" arrive
    as three leftover lines. Read as sub-headings, section one of Part Four
    never opens and its three chapters hang off the part instead: seven
    sections against the eight every other edition has, and `validate`'s
    cross-edition structure check is what says so.

    THE SECOND ANCHOR IS WHAT SETTLES THE TITLE, the same rule the note above
    `split_anchor` states for the first: it wraps "LA ORACION <br/>EN LA VIDA
    CRISTIANA" and nothing else, so the two lines are one wrapped title
    rather than a title and a sub-heading. Without it the lines alone cannot
    tell those apart -- the same ambiguity that makes EN's three-line chapter
    title unreadable from lines.
    """
    if not subs:
        return None
    matched = match_label(subs[0])
    if matched is None:
        return None
    kind, num = matched
    if tail:
        split = split_anchor(tail)
        if split is not None:
            pre, name, rest = split
            return kind, num, _join(pre, name), printed_lines(rest)
    # No anchor: fall back to the printed-line rule `heading_title` uses in
    # the same position -- label, then title, then sub-headings.
    if len(subs) > 1:
        return kind, num, _join(subs[0], subs[1]), subs[2:]
    return kind, num, subs[0], []


def process_body(body: str, cfg: dict, state: ScrapeState) -> None:
    refs_shape = cfg["refs_shape"]
    blocks = extract_blocks(body, refs_shape, bare_bold=cfg["bare_bold"])
    match_label = cfg["match_label"]
    italic_quotes = cfg["italic_quotes"]
    i, n = 0, len(blocks)
    while i < n:
        b = blocks[i]

        if not state.stack and match_label(b.stripped) is None:
            # THE WORK BEGINS AT PART ONE. What precedes it is front matter --
            # the Motu Proprio's signature, the Introduction, a footnote block
            # -- and it is not addressable: `sections.json` hangs everything
            # off a part. EN and PT drop it here already because none of it is
            # emboldened; ES and HU print their signature line centred, which
            # made "Joseph Card. Ratzinger, Presidente de la Comision especial"
            # a top-level structure node.
            state.dropped_orphans.append(f"front matter: {b.stripped[:80]!r}")
            i += 1
            continue

        if b.is_bq:
            if state.current is not None and state.mode == "awaiting_refs":
                # A quotation where the reference line should be: this
                # question has none printed, and its whole answer IS the
                # quotation. Three of the ten editions end that way (DE and
                # ES at Q598, IT at Q534 and again at Q598), and reading it
                # any other way stored those questions with no answer at all.
                state.set_refs("")
                state.anomalies.append(
                    f"question {state.current.n}: no reference paragraph "
                    "printed; the answer opens with a quotation"
                )
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

        if (
            state.refs_after
            and state.mode == "in_answer"
            and state.current.blocks
            and not state.current.ccc_refs
        ):
            # The reference line follows the answer in these editions rather
            # than preceding it. Guarded on the answer having started, so a
            # question whose first block happens to be numeric cannot claim
            # to be its own citation, and on the citation not already being
            # set, so a numeric line later in the answer cannot replace it.
            m = refs_shape.match(b.stripped)
            if m:
                state.set_refs(m.group(1).strip() if m.groups() else b.stripped)
                i += 1
                continue

        if state.mode == "awaiting_refs":
            m = refs_shape.match(b.stripped)
            if m:
                state.set_refs(m.group(1) if m.groups() else b.stripped)
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
        is_heading = matched is not None or is_sub_heading(b)
        if is_heading:
            if matched is not None:
                kind, num = matched
                title, subs, consumed, tail = heading_title(
                    blocks, i, match_label, state
                )
                state.push_heading(kind, num, title)
                nested = fused_heading(tail, subs, match_label)
                if nested is not None:
                    # Two headings in one paragraph -- see `fused_heading`.
                    sub_kind, sub_num, sub_title, subs = nested
                    state.push_heading(sub_kind, sub_num, sub_title)
                for sub in subs:
                    # A third printed line in the heading's own block: a
                    # sub-heading the source set with a <br/> rather than in a
                    # block of its own. One case in PT ("OS SIMBOLOS DA FE"),
                    # whose EN counterpart prints the same heading separately
                    # and already parses as a `sub`.
                    state.push_heading("sub", None, sub)
                i += consumed
                continue
            state.push_heading("sub", None, b.stripped)
            i += 1
            continue

        if state.current is not None and state.mode == "in_answer":
            if italic_quotes and is_full_italic(b.inner):
                state.add_quote(b.stripped)
            else:
                state.add_prose(b.stripped)
        else:
            state.dropped_orphans.append(f"paragraph: {b.stripped[:80]!r}")
        i += 1

    state.finalize_current()


# --------------------------------------------------------------------------
# Label vocabulary, one entry per edition
# --------------------------------------------------------------------------
#
# Every edition prints the same four parts, eight sections and twenty-one
# chapters, and names them in its own language: "PART TWO", "SEGUNDA PARTE",
# "PARTE SECONDA", "ZWEITER TEIL", "Partea a doua". What varies is the word
# order (noun-first in Italian, Spanish and Romanian; ordinal-first in the
# rest), the ordinal's gender (German declines it: ERSTER TEIL but ERSTES
# KAPITEL) and, in French alone, the ordinal being a Roman numeral.
#
# Matching runs over `fold`ed text -- uppercased, accents stripped -- so the
# patterns are written without diacritics and match a mixed-case printing of
# the same label. That is not cosmetic: Romanian prints "Secţiunea a doua" in
# the body and Hungarian "Első fejezet" in its table of contents, and folding
# is what lets one pattern read both.
#
# The number is looked up rather than parsed, and a label whose ordinal is not
# in the table yields `n=None` -- a heading with no number, which `validate`
# reports -- instead of a wrong one.


def label_matcher(ordinals: dict[str, int], patterns: list[tuple[str, str]]):
    """A `match_label` for one edition: folded text in, `(kind, n)` or None
    out. `patterns` is tried in order, so a noun that prefixes another
    ("PARTE" before "PARTEA") must be listed the more specific way round."""
    compiled = [(kind, re.compile(pat)) for kind, pat in patterns]

    def match(stripped: str) -> tuple[str, int | None] | None:
        folded = fold(stripped)
        for kind, pat in compiled:
            m = pat.match(folded)
            if m:
                return kind, ordinals.get(m.group(1))
        return None

    return match


_EN_ORDINALS = {
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

_PT_ORDINALS = {
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

# Both genders, because German declines the ordinal to its noun: der Teil and
# der Abschnitt take ERSTER, das Kapitel takes ERSTES.
_DE_ORDINALS = {
    "ERSTER": 1,
    "ZWEITER": 2,
    "DRITTER": 3,
    "VIERTER": 4,
    "FUNFTER": 5,
    "ERSTES": 1,
    "ZWEITES": 2,
    "DRITTES": 3,
    "VIERTES": 4,
    "FUNFTES": 5,
}

_ES_ORDINALS = {
    "PRIMERA": 1,
    "SEGUNDA": 2,
    "TERCERA": 3,
    "CUARTA": 4,
    "QUINTA": 5,
    "PRIMERO": 1,
    "SEGUNDO": 2,
    "TERCERO": 3,
    "CUARTO": 4,
    "QUINTO": 5,
}

# French numbers its chapters in Roman numerals -- the only edition that does
# -- so the "ordinal" table here is numerals, and the part/section words are
# the ordinary ones.
_FR_ORDINALS = {
    "PREMIERE": 1,
    "DEUXIEME": 2,
    "TROISIEME": 3,
    "QUATRIEME": 4,
    "CINQUIEME": 5,
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4,
    "V": 5,
}

_HU_ORDINALS = {
    "ELSO": 1,
    "MASODIK": 2,
    "HARMADIK": 3,
    "NEGYEDIK": 4,
    "OTODIK": 5,
}

# The roman numerals are for ONE heading. This edition spells its chapter
# ordinals out nineteen times and prints the twentieth "CAPITOLO I" (Part One,
# section two, chapter one). One edition numbering one of its chapters in a
# different style is not a defect -- the heading says exactly which chapter it
# is -- so the vocabulary widens rather than the source being corrected.
_IT_ORDINALS = {
    "PRIMA": 1,
    "SECONDA": 2,
    "TERZA": 3,
    "QUARTA": 4,
    "QUINTA": 5,
    "PRIMO": 1,
    "SECONDO": 2,
    "TERZO": 3,
    "QUARTO": 4,
    "QUINTO": 5,
    "I": 1,
    "II": 2,
    "III": 3,
    "IV": 4,
    "V": 5,
}

# Romanian's ordinals past the first are two words ("a doua", "al doilea"),
# which is why these keys contain spaces: the pattern captures the whole
# ordinal phrase rather than a single word.
_RO_ORDINALS = {
    "INTAI": 1,
    "A DOUA": 2,
    "A TREIA": 3,
    "A PATRA": 4,
    "A CINCEA": 5,
    "AL DOILEA": 2,
    "AL TREILEA": 3,
    "AL PATRULEA": 4,
    "AL CINCILEA": 5,
}

_SL_ORDINALS = {
    "PRVI": 1,
    "DRUGI": 2,
    "TRETJI": 3,
    "CETRTI": 4,
    "PETI": 5,
    "PRVO": 1,
    "DRUGO": 2,
    "TRETJE": 3,
    "CETRTO": 4,
    "PETO": 5,
}

_SV_ORDINALS = {
    "FORSTA": 1,
    "ANDRA": 2,
    "TREDJE": 3,
    "FJARDE": 4,
    "FEMTE": 5,
}

#: Both genders in one table: the ordinal agrees with the division noun, and
#: `label_matcher` looks the captured word up without knowing which noun it
#: stood before.
_LT_ORDINALS = {
    "PIRMA": 1,
    "PIRMAS": 1,
    "ANTRA": 2,
    "ANTRAS": 2,
    "TRECIA": 3,
    "TRECIAS": 3,
    "KETVIRTA": 4,
    "KETVIRTAS": 4,
    "PENKTA": 5,
    "PENKTAS": 5,
}

#: Russian, like Byelorussian, declines the ordinal to its noun -- ЧАСТЬ and
#: ГЛАВА feminine, РАЗДЕЛ masculine -- and is the one edition of the fourteen
#: that puts the ordinal BEFORE the noun for its sections and after it for
#: its parts and chapters.
#:
#: WRITTEN IN THE FOLDED FORM, which for Russian removes two diacritics and
#: not one: `fold` strips the diaeresis from Ё (ЧЕТВЁРТАЯ -> ЧЕТВЕРТАЯ) and
#: also the breve from Й, so ПЕРВЫЙ compares as ПЕРВЫИ. Spelling the masculine
#: ordinals the way Russian actually writes them matched nothing at all, and
#: the failure was quiet: the parts and chapters still came out, and only the
#: eight sections were missing from the tree.
_RU_ORDINALS = {
    "ПЕРВАЯ": 1,
    "ПЕРВЫИ": 1,
    "ВТОРАЯ": 2,
    "ВТОРОИ": 2,
    "ТРЕТЬЯ": 3,
    "ТРЕТИИ": 3,
    "ЧЕТВЕРТАЯ": 4,
    "ЧЕТВЕРТЫИ": 4,
    "ПЯТАЯ": 5,
    "ПЯТЫИ": 5,
}

#: Byelorussian declines its ordinal to the division noun: ЧАСТКА and ГЛАВА
#: are feminine, РАЗДЗЕЛ masculine. Written in the folded form `label_matcher`
#: compares against, which is why ЧАЦВЁРТАЯ appears here as ЧАЦВЕРТАЯ -- `fold`
#: strips the diaeresis from Ё.
_BE_ORDINALS = {
    "ПЕРШАЯ": 1,
    "ПЕРШЫ": 1,
    "ДРУГАЯ": 2,
    "ДРУГІ": 2,
    "ТРЭЦЯЯ": 3,
    "ТРЭЦІ": 3,
    "ЧАЦВЕРТАЯ": 4,
    "ЧАЦВЕРТЫ": 4,
    "ПЯТАЯ": 5,
    "ПЯТЫ": 5,
}

#: Indonesian counts with cardinals rather than ordinals -- "Bagian Satu" is
#: "Part One", not "First Part" -- and the numeral does not decline, so one
#: list serves all three divisions.
_ID_ORDINALS = {"SATU": 1, "DUA": 2, "TIGA": 3, "EMPAT": 4, "LIMA": 5}

_ORDINAL_LABELS: dict[str, tuple[dict[str, int], list[tuple[str, str]]]] = {
    "en": (
        _EN_ORDINALS,
        [
            ("part", r"^PART\s+(ONE|TWO|THREE|FOUR|FIVE)\b"),
            ("section", r"^SECTION\s+(ONE|TWO|THREE|FOUR|FIVE)\b"),
            (
                "chapter",
                r"^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\b",
            ),
        ],
    ),
    "pt": (
        _PT_ORDINALS,
        [
            ("part", r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+PARTE\b"),
            ("section", r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+SECCAO\b"),
            ("chapter", r"^CAPITULO\s+(PRIMEIRO|SEGUNDO|TERCEIRO|QUARTO|QUINTO)\b"),
        ],
    ),
    "de": (
        _DE_ORDINALS,
        [
            ("part", r"^(ERSTER|ZWEITER|DRITTER|VIERTER|FUNFTER)\s+TEIL\b"),
            ("section", r"^(ERSTER|ZWEITER|DRITTER|VIERTER|FUNFTER)\s+ABSCHNITT\b"),
            ("chapter", r"^(ERSTES|ZWEITES|DRITTES|VIERTES|FUNFTES)\s+KAPITEL\b"),
        ],
    ),
    "es": (
        _ES_ORDINALS,
        [
            ("part", r"^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA)\s+PARTE\b"),
            ("section", r"^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA)\s+SECCION\b"),
            ("chapter", r"^CAPITULO\s+(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO)\b"),
        ],
    ),
    "fr": (
        _FR_ORDINALS,
        [
            (
                "part",
                r"^(PREMIERE|DEUXIEME|TROISIEME|QUATRIEME|CINQUIEME)\s+PARTIE\b",
            ),
            (
                "section",
                r"^(PREMIERE|DEUXIEME|TROISIEME|QUATRIEME|CINQUIEME)\s+SECTION\b",
            ),
            ("chapter", r"^CHAPITRE\s+(I|II|III|IV|V)\b"),
        ],
    ),
    "hu": (
        _HU_ORDINALS,
        [
            ("part", r"^(ELSO|MASODIK|HARMADIK|NEGYEDIK|OTODIK)\s+RESZ\b"),
            ("section", r"^(ELSO|MASODIK|HARMADIK|NEGYEDIK|OTODIK)\s+SZAKASZ\b"),
            ("chapter", r"^(ELSO|MASODIK|HARMADIK|NEGYEDIK|OTODIK)\s+FEJEZET\b"),
        ],
    ),
    "it": (
        _IT_ORDINALS,
        [
            ("part", r"^PARTE\s+(PRIMA|SECONDA|TERZA|QUARTA|QUINTA)\b"),
            ("section", r"^SEZIONE\s+(PRIMA|SECONDA|TERZA|QUARTA|QUINTA)\b"),
            (
                "chapter",
                r"^CAPITOLO\s+(PRIMO|SECONDO|TERZO|QUARTO|QUINTO|I|II|III|IV|V)\b",
            ),
        ],
    ),
    "ro": (
        _RO_ORDINALS,
        [
            ("part", r"^PARTEA\s+(INTAI|A DOUA|A TREIA|A PATRA|A CINCEA)\b"),
            ("section", r"^SECTIUNEA\s+(INTAI|A DOUA|A TREIA|A PATRA|A CINCEA)\b"),
            (
                "chapter",
                r"^CAPITOLUL\s+(INTAI|AL DOILEA|AL TREILEA|AL PATRULEA|AL CINCILEA)\b",
            ),
        ],
    ),
    "sl": (
        _SL_ORDINALS,
        [
            ("part", r"^(PRVI|DRUGI|TRETJI|CETRTI|PETI)\s+DEL\b"),
            ("section", r"^(PRVI|DRUGI|TRETJI|CETRTI|PETI)\s+ODDELEK\b"),
            ("chapter", r"^(PRVO|DRUGO|TRETJE|CETRTO|PETO)\s+POGLAVJE\b"),
        ],
    ),
    "be": (
        _BE_ORDINALS,
        [
            ("part", r"^ЧАСТКА\s+(ПЕРШАЯ|ДРУГАЯ|ТРЭЦЯЯ|ЧАЦВЕРТАЯ|ПЯТАЯ)\b"),
            ("section", r"^РАЗДЗЕЛ\s+(ПЕРШЫ|ДРУГІ|ТРЭЦІ|ЧАЦВЕРТЫ|ПЯТЫ)\b"),
            ("chapter", r"^ГЛАВА\s+(ПЕРШАЯ|ДРУГАЯ|ТРЭЦЯЯ|ЧАЦВЕРТАЯ|ПЯТАЯ)\b"),
        ],
    ),
    "id": (
        _ID_ORDINALS,
        [
            ("part", r"^BAGIAN\s+(SATU|DUA|TIGA|EMPAT|LIMA)\b"),
            ("section", r"^SEKSI\s+(SATU|DUA|TIGA|EMPAT|LIMA)\b"),
            ("chapter", r"^BAB\s+(SATU|DUA|TIGA|EMPAT|LIMA)\b"),
        ],
    ),
    # Lithuanian is the first PDF edition, and the first whose divisions are
    # NOT set in capitals -- `fold` uppercases, so the table reads the same as
    # the others and nothing here has to know that. Its ordinal precedes the
    # noun and agrees with it, which is why `dalis` (feminine) takes PIRMA
    # where `skyrius` and `poskyris` (masculine) take PIRMAS. The three-level
    # scheme maps straight onto the work's: dalis/skyrius/poskyris are its
    # part, section and chapter, confirmed against EXPECTED_SKELETON rather
    # than by translating the nouns.
    "lt": (
        _LT_ORDINALS,
        [
            ("part", r"^(PIRMA|ANTRA|TRECIA|KETVIRTA|PENKTA)\s+DALIS\b"),
            ("section", r"^(PIRMAS|ANTRAS|TRECIAS|KETVIRTAS|PENKTAS)\s+SKYRIUS\b"),
            ("chapter", r"^(PIRMAS|ANTRAS|TRECIAS|KETVIRTAS|PENKTAS)\s+POSKYRIS\b"),
        ],
    ),
    "ru": (
        _RU_ORDINALS,
        [
            ("part", r"^ЧАСТЬ\s+(ПЕРВАЯ|ВТОРАЯ|ТРЕТЬЯ|ЧЕТВЕРТАЯ|ПЯТАЯ)\b"),
            ("section", r"^(ПЕРВЫИ|ВТОРОИ|ТРЕТИИ|ЧЕТВЕРТЫИ|ПЯТЫИ)\s+РАЗДЕЛ\b"),
            ("chapter", r"^ГЛАВА\s+(ПЕРВАЯ|ВТОРАЯ|ТРЕТЬЯ|ЧЕТВЕРТАЯ|ПЯТАЯ)\b"),
        ],
    ),
    "sv": (
        _SV_ORDINALS,
        [
            ("part", r"^(FORSTA|ANDRA|TREDJE|FJARDE|FEMTE)\s+DELEN\b"),
            # Two nouns for one division: this edition heads six of its eight
            # sections AVDELNINGEN and the two in Part Two SEKTIONEN. Both are
            # ordinary Swedish for a section and both say what they mean, so
            # neither is a defect to correct -- reading them as printed loses
            # nothing, which is the test. Contrast Part One's second section,
            # printed "Andra delen": DELEN is this edition's word for a PART,
            # so reading THAT as printed opens a fifth part in a four-part
            # work, and it is corrected pre-parse.
            (
                "section",
                r"^(FORSTA|ANDRA|TREDJE|FJARDE|FEMTE)\s+(?:AVDELNINGEN|SEKTIONEN)\b",
            ),
            ("chapter", r"^(FORSTA|ANDRA|TREDJE|FJARDE|FEMTE)\s+KAPITLET\b"),
        ],
    ),
}

MATCH_LABEL = {
    lang: label_matcher(ordinals, patterns)
    for lang, (ordinals, patterns) in _ORDINAL_LABELS.items()
}


# --------------------------------------------------------------------------
# The ten parsed editions
# --------------------------------------------------------------------------
#
# `start` and `end` bound the region walked, and are found by a plain `find`
# in the raw HTML -- `end` searched from `start`, so a table of contents
# printed above the body cannot be mistaken for it.
#
# WHICH MARKER, and why it differs. EN, PT, ES, FR, HU and IT get the named
# anchor of the Introduction and of the Appendix: those cut the front matter
# and the prayers off cleanly and are the mirror's own statement of where each
# begins. The other four carry no anchors at all, so the marker is the text of
# the part-one heading and of the Appendix. `at_block` marks that second kind
# and does two things for it: it snaps the cut back to the `<p>` holding the
# marker, which is what keeps "ERSTER TEIL" in the region rather than losing
# the first part of the work, and it takes the LAST occurrence rather than the
# first, because a table of contents prints the same words above the body.
#
# `refs_after` says the reference line follows the ANSWER rather than the
# question -- true of Romanian and Swedish, false of the other eight. It is a
# property of the printed page, not a parser preference: reading Swedish the
# other way round would store its whole first answer as a citation.
#
# `refs_shape` is how a reference line is recognized and what of it is kept: a
# printed CCC-paragraph reference is digits and the punctuation used to join
# and range them, and no letters -- which is what tells a genuine reference
# line apart from a question that has none printed at all (PT Q555) and whose
# answer prose would otherwise be stored as its citation. Verbatim, including
# what look like printer's-error separators (PT Q378's "1804; 1810-1811: 1834,
# 1839").
# Everything but Swedish prints the bare numbers; Swedish encloses them in
# parentheses behind its own siglum for the Catechism ("(KKK 1-25)"). The
# siglum is dropped and the numbers kept, so `ccc_refs` means the same thing
# in every edition -- a locator normalization, and the one place any edition's
# reference line is not stored exactly as printed. Note the U+2011 in the
# class: Romanian ranges its numbers with a non-breaking hyphen.
_REFS_LIKE_RE = re.compile(r"^[0-9,;:.\-\u2011\u2013\u2014\s]*$")
_SV_REFS_RE = re.compile(r"^\(\s*KKK\s*([0-9,;:.\-\u2011\u2013\u2014\s]*)\)$")

LANG_CONFIG = {
    "en": {
        "start": 'name="INTRODUCTION"',
        "end": 'name="APPENDIX"',
        "title": "Compendium of the Catechism of the Catholic Church",
        "short_title": "Compendium",
    },
    "pt": {
        "start": 'name="INTRODU&Ccedil;&Atilde;O"',
        "end": 'name="AP&Ecirc;NDICE"',
        "title": "Compêndio do Catecismo da Igreja Católica",
        "short_title": "Compêndio",
    },
    "de": {
        "start": "ERSTER TEIL",
        "end": "ANHANG",
        "at_block": True,
        "notes": (
            (
                "The chapter label is set in plain centred text rather than bold, and the "
                "ordinal declines to its noun (ERSTER TEIL, ERSTES KAPITEL)."
            ),
        ),
        "title": "Kompendium des Katechismus der Katholischen Kirche",
        "short_title": "Kompendium",
    },
    "es": {
        "start": 'name="INTRODUCCI&Oacute;N"',
        "end": 'name="AP&Eacute;NDICE"',
        "notes": (
            (
                "Four questions are printed without a space after the number (Q523, Q530) "
                "or with no period at all (Q210, Q586), and Q339 shares its paragraph with "
                "the end of the previous answer, after two <br/>s."
            ),
        ),
        "title": "Compendio del Catecismo de la Iglesia Católica",
        "short_title": "Compendio",
    },
    "fr": {
        "start": 'name="INTRODUCTION"',
        "end": 'name="APPENDICE"',
        "notes": ("Chapters are numbered in Roman numerals, uniquely among the ten.",),
        "title": "Compendium du Catéchisme de l'Église catholique",
        "short_title": "Compendium",
    },
    "hu": {
        "start": 'name="BEVEZET&Eacute;S"',
        "end": 'name="F&Uuml;GGEL&Eacute;K"',
        "title": "A Katolikus Egyház Katekizmusának Kompendiuma",
        "short_title": "Kompendium",
    },
    "it": {
        "start": 'name="INTRODUZIONE"',
        "end": 'name="APPENDICE"',
        "notes": (
            (
                "Seven questions print the number, the reference line and the whole answer "
                "as one paragraph broken by <br/> (Q361, Q534, Q563-Q566)."
            ),
            (
                "Nineteen chapter headings spell their ordinal out ('CAPITOLO PRIMO'); "
                "the twentieth is printed 'CAPITOLO I'. Read as printed -- the heading "
                "says which chapter it is either way."
            ),
        ),
        "title": "Compendio del Catechismo della Chiesa Cattolica",
        "short_title": "Compendio",
    },
    "ro": {
        "start": "Partea &icirc;nt&acirc;i",
        "end": "Apendice",
        "at_block": True,
        "refs_after": True,
        "italic_quotes": True,
        "notes": (
            (
                "This edition sets no <blockquote> at all: its 27 quotations are ordinary "
                "paragraphs in italics with the attribution after the closing italic, in "
                "parentheses. Its reference line follows the answer rather than the "
                "question, and a quotation that closes an answer follows the reference "
                "line in turn."
            ),
            (
                "Numbers in the reference line are ranged with a non-breaking hyphen "
                "(U+2011), stored as printed."
            ),
        ),
        "title": "Catehismul Bisericii Catolice — Compendiu",
        "short_title": "Compendiu",
    },
    "sl": {
        "start": "PRVI DEL",
        "end": "DODATEK",
        "at_block": True,
        "notes": (
            (
                "The section heading of Part Two's second section and of Part Four's "
                "second section is printed twice -- once before the matter interposed "
                "under it (the list of the seven sacraments; the Our Father) and again "
                "before the first question. The repetition is one division, not two."
            ),
        ),
        "title": "Kompendij — Katekizem Katoliške Cerkve",
        "short_title": "Kompendij",
    },
    "sv": {
        "start": "F&Ouml;RSTA DELEN",
        "end": "APPENDIX",
        "at_block": True,
        "refs_after": True,
        "refs_shape": _SV_REFS_RE,
        "bare_bold": True,
        "notes": (
            (
                "The reference line follows the answer and is enclosed in parentheses "
                "behind this edition's own siglum for the Catechism, '(KKK 1-25)'. The "
                "siglum and the parentheses are dropped so that ccc_refs means the same "
                "thing in every edition; it is the one place any edition's reference line "
                "is not stored exactly as printed."
            ),
            (
                "21 questions open in bold that sits outside any paragraph, and one of "
                "those (Q116) is broken across two bold runs."
            ),
            (
                "The heading opening Part One's second section is printed 'Andra delen' "
                "(second PART) where the work has a section; corrected pre-parse, see "
                "corrections-applied.json. Both sections of Part Two are headed "
                "'sektionen' where the other six are headed 'avdelningen' -- two words "
                "for one division, both read as printed. 39 questions carry no reference "
                "line."
            ),
        ),
        "title": "Katolska Kyrkans lilla katekes",
        "short_title": "Lilla katekesen",
    },
    # ---- the PDF editions -------------------------------------------------
    "be": {
        "pdf": PDF_EDITIONS["be"],
        "notes": (
            (
                "Published as a PDF by the Conference of Catholic Bishops in Belarus, "
                "not as HTML on vatican.va. One glyph in its embedded fonts has no "
                "mapping and both readers report it as unknown; the font's own charset "
                "names it `hyphenminus`, so it is restored as U+002D rather than guessed."
            ),
        ),
        "title": "Кампендый Катэхізіса Каталіцкага Касцёла",
        "short_title": "Кампендый",
        "edition": "2010, Канферэнцыя Каталіцкіх Біскупаў у Беларусі (PDF)",
    },
    "ru": {
        "pdf": PDF_EDITIONS["ru"],
        "notes": (
            (
                "Published as a PDF by the Cultural Centre 'Spiritual Library', not as "
                "HTML on vatican.va. The only edition read with poppler and the only one "
                "imposed two pages to a sheet: its fonts carry no ToUnicode map, so MuPDF "
                "refuses every glyph while poppler passes the byte through, and the "
                "custom encoding is cp1251."
            ),
        ),
        "title": "Компендиум Катехизиса Католической Церкви",
        "short_title": "Компендиум",
        "edition": "2007, Культурный центр «Духовная библиотека» (PDF)",
    },
    "id": {
        "pdf": PDF_EDITIONS["id"],
        "notes": (
            (
                "Published as a PDF by the Indonesian Bishops' Conference and Penerbit "
                "Kanisius, not as HTML on vatican.va. Read with MuPDF, which is not a "
                "preference: the file still carries the Italian original as invisible "
                "text and poppler emits it interleaved with the Indonesian."
            ),
        ),
        "title": "Kompendium Katekismus Gereja Katolik",
        "short_title": "Kompendium",
        "edition": "2009, Konferensi Waligereja Indonesia (PDF)",
    },
    # No `start`/`end`: those bound a region of HTML, and a PDF has no
    # markup to find them in. The body is bounded instead by the question
    # numbers themselves -- everything before Q1 is front matter and
    # everything after Q598 is the Appendix, which these editions print the
    # same way the ten do and which is out of scope here as it is there.
    "lt": {
        "pdf": PDF_EDITIONS["lt"],
        "notes": (
            (
                "Published as a PDF by the Lithuanian Bishops' Conference, not as HTML "
                "on vatican.va, and read with MuPDF. The CCC cross-references are set "
                "in the outer margin rather than inline, so they are separated by "
                "x-coordinate and matched to a question by y; the extracted values "
                "agree with the Italian edition's on 584 of 598, and several of the "
                "rest are misprints in the Italian."
            ),
            (
                "Divisions are set in title case rather than capitals, and the running "
                "head repeats them on every page at 9pt against a 10pt body. The size "
                "is what tells a heading from the running head."
            ),
        ),
        "title": "Katalikų Bažnyčios katekizmo santrauka",
        "short_title": "Santrauka",
        "edition": "2007, Lietuvos Vyskupų Konferencija (PDF)",
    },
}

for _lang, _cfg in LANG_CONFIG.items():
    _cfg["url"] = source_url(_lang)
    _cfg["work_id"] = f"compendium.{_lang}"
    _cfg["match_label"] = MATCH_LABEL[_lang]
    _cfg.setdefault("pdf", None)
    _cfg.setdefault("at_block", False)
    _cfg.setdefault("refs_after", False)
    _cfg.setdefault("italic_quotes", False)
    _cfg.setdefault("bare_bold", False)
    _cfg.setdefault("notes", ())
    _cfg.setdefault("refs_shape", _REFS_LIKE_RE)
    _cfg.setdefault("edition", "2005, vatican.va HTML mirror")


#: The fields a Compendium correction may target. The layer edits the
#: FETCHED HTML before parsing, which is what keeps `raw/` the record of what
#: the mirror actually served (CLAUDE.md, corrections vs overrides); the field
#: names what kind of text the edit is against, so a correction cannot quietly
#: be applied somewhere its evidence does not cover.
#: `extracted_text` is the PDF path's analogue of the two HTML fields, and it
#: is applied at a later point than they are: an HTML edition is one fetched
#: string that can be edited before anything looks at it, while a PDF has no
#: such string until the reader has run and the columns are split. So a
#: correction's `from` is matched against a reconstructed LINE, which is
#: downstream of this scraper's own joining and dehyphenation -- keep those
#: rules stable, or a filed correction goes stale without the source moving.
_CORRECTION_FIELDS = frozenset({"heading_html", "refs_html", "extracted_text"})


def apply_corrections(
    html_text: str, corrections: list[dict], lang: str
) -> tuple[str, list[dict]]:
    """Pre-parse corrections, as raw-HTML substring replacements.

    Drift is fatal (`CorrectionDriftError`): a correction whose `from` no
    longer matches means either the mirror changed or the correction was
    wrong, and both are worse than a failed run. An entry carrying a
    `resolution` is documented rather than applied -- the policy for a defect
    with no known correct value (docs/decisions.md).
    """
    applied: list[dict] = []
    for c in corrections:
        if c.get("resolution"):
            continue
        field = c.get("field")
        if field not in _CORRECTION_FIELDS:
            raise ValueError(f"{lang}: correction {c['id']}: unknown field {field!r}")
        if c["from"] not in html_text:
            raise CorrectionDriftError(
                f"{lang}: correction {c['id']}: `from` text not found in the "
                "fetched page -- the source changed, or the correction is wrong"
            )
        html_text = html_text.replace(c["from"], c["to"])
        applied.append(c)
    return html_text, applied


def region(html_text: str, cfg: dict, lang: str) -> str:
    """The slice of the page the Q&A stream lives in."""
    # A named anchor is unique by construction, so the first hit is the only
    # hit. A TEXT marker is not: Romanian prints "Partea intai" in its table
    # of contents 24,000 characters above the heading it names, so the LAST
    # occurrence is the body's -- and the first would have made the region
    # four blocks long, which is how this was found.
    start = (
        html_text.rfind(cfg["start"])
        if cfg["at_block"]
        else html_text.find(cfg["start"])
    )
    if start == -1:
        raise RuntimeError(
            f"{lang}: start marker {cfg['start']!r} not found -- "
            "source page structure may have changed"
        )
    if cfg["at_block"]:
        start = html_text.rfind("<p", 0, start)
    end = html_text.find(cfg["end"], start + len(cfg["start"]))
    if end <= start:
        raise RuntimeError(
            f"{lang}: end marker {cfg['end']!r} not found after the start -- "
            "source page structure may have changed"
        )
    return html_text[start:end]


def run_scrape(lang: str) -> tuple[ScrapeState, Fetcher]:
    cfg = LANG_CONFIG[lang]
    fetcher = make_fetcher(RAW_ROOT)
    if cfg["pdf"] is not None:
        return run_scrape_pdf(lang, cfg, fetcher), fetcher
    html_text = fetcher.fetch_str(cfg["url"], raw_name(lang))
    state_corrections = load_corrections(cfg["work_id"])
    html_text, applied = apply_corrections(html_text, state_corrections, lang)
    body = region(html_text, cfg, lang)

    state = ScrapeState(refs_after=cfg["refs_after"])
    state.corrections = state_corrections
    state.corrections_applied = applied
    process_body(body, cfg, state)
    return state, fetcher


def run_scrape_pdf(lang: str, cfg: dict, fetcher: Fetcher) -> ScrapeState:
    """The PDF path: the same state machine, fed from a page geometry.

    The file is already in `raw/` -- `--capture` has taken all four since
    August -- so this reads it off disk rather than through the fetcher, and
    a missing one is an error rather than a fetch, the same way an offline
    parse behaves everywhere else.
    """
    path = RAW_ROOT / raw_name(lang)
    if not path.is_file():
        raise SystemExit(f"{path} is not in the corpus; run `--capture {lang}` first")
    pages = read_edition(path, cfg["pdf"])
    corrections = load_corrections(cfg["work_id"])
    applied = apply_pdf_corrections(pages, corrections, lang)
    state = ScrapeState(refs_after=cfg["refs_after"], from_markup=False)
    state.corrections = corrections
    state.corrections_applied = applied
    process_pdf_body(pages, cfg, state)
    state.finalize_current()
    return state


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------

#: A bare "Â" WAS in this list and cannot be: French prints it as a letter --
#: "GRÂCE", "de toute ton ÂME" -- six times in its own headings. What is
#: always wrong is Â immediately before a General Punctuation mark, which is
#: the residue `strip_double_encoding` removes; this keeps the check as the
#: guard against that removal failing, without failing French for its own
#: alphabet.
_MOJIBAKE_PATTERNS = ["Ã©", "Ã§", "â€™", "â€", "Ã³", "Â\u2013", "Â\u201c", "Â\u201d"]


#: The work's own division scheme, flat and in printed order: four parts,
#: eight sections, twenty chapters. It is written down rather than taken from
#: one edition's parse so that a regression in THAT edition is caught too.
#:
#: The check is a SUBSEQUENCE test, and the asymmetry is deliberate. An
#: edition may print fewer headings than the work has -- Spanish omits the
#: first section of Part Four, Italian the first chapter of Part One's second
#: section, Swedish both sections of Part Two -- and the parser has nothing to
#: invent from, so a missing heading is reported and not failed. Anything the
#: subsequence test rejects is ours: a heading matched that is not in the
#: work, or matched in the wrong order, or numbered wrongly.
EXPECTED_SKELETON: tuple[tuple[str, int], ...] = (
    ("part", 1),
    ("section", 1),
    ("chapter", 1),
    ("chapter", 2),
    ("chapter", 3),
    ("section", 2),
    ("chapter", 1),
    ("chapter", 2),
    ("chapter", 3),
    ("part", 2),
    ("section", 1),
    ("chapter", 1),
    ("chapter", 2),
    ("section", 2),
    ("chapter", 1),
    ("chapter", 2),
    ("chapter", 3),
    ("chapter", 4),
    ("part", 3),
    ("section", 1),
    ("chapter", 1),
    ("chapter", 2),
    ("chapter", 3),
    ("section", 2),
    ("chapter", 1),
    ("chapter", 2),
    ("part", 4),
    ("section", 1),
    ("chapter", 1),
    ("chapter", 2),
    ("chapter", 3),
    ("section", 2),
)


def observed_skeleton(state: ScrapeState) -> list[tuple[str, int | None]]:
    """The labelled headings this run found, flat and in printed order."""
    out: list[tuple[str, int | None]] = []

    def walk(nodes: list[Node]) -> None:
        for node in nodes:
            if node.kind != "sub":
                out.append((node.kind, node.n))
            walk(node.children)

    walk(state.root_children)
    return out


def skeleton_diff(
    observed: list[tuple[str, int | None]],
) -> tuple[list[tuple[str, int]], list[tuple[str, int | None]]]:
    """`(missing, unexpected)` against `EXPECTED_SKELETON`.

    Walks both in order: an expected entry the edition did not print is
    missing; an observed entry that does not match where the walk has got to
    is unexpected, and means the parse is wrong rather than the page.
    """
    missing: list[tuple[str, int]] = []
    unexpected: list[tuple[str, int | None]] = []
    i = 0
    for entry in observed:
        j = i
        while j < len(EXPECTED_SKELETON) and EXPECTED_SKELETON[j] != entry:
            j += 1
        if j == len(EXPECTED_SKELETON):
            unexpected.append(entry)
            continue
        missing.extend(EXPECTED_SKELETON[i:j])
        i = j + 1
    missing.extend(EXPECTED_SKELETON[i:])
    return missing, unexpected


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
            if state.from_markup and ("<" in t or ">" in t):
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

    missing_headings, unexpected_headings = skeleton_diff(observed_skeleton(state))
    if unexpected_headings:
        problems.append(
            f"headings not in the work's division scheme, or out of order: "
            f"{unexpected_headings}"
        )
    for kind, n in missing_headings:
        state.anomalies.append(f"{kind} {n}: no heading printed for it")

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
            "The Appendix (common prayers, then formulas of Catholic doctrine) is not "
            "part of the 598-question schema and is not parsed here; deferred per "
            "corpus-schema.md's explicit allowance. Raw HTML is cached in full, so "
            "nothing was lost. Sacred-art images and their commentary are out of scope "
            "per project spec and were not investigated."
        ),
        (
            "A single decorative epigraph -- a quotation attributed to Saint Augustine "
            "(CCC ¶30, 'You are great, O Lord...') -- is printed between the Chapter One "
            "heading and Question 2 in every edition, attached to no question; dropped "
            "as an orphan block (see run summary)."
        ),
        (
            "ccc_refs is captured by flattening the reference paragraph's own <br/> line "
            "breaks to a single space (matching how the block model treats <br/> "
            "everywhere else) and stripping all other markup -- otherwise verbatim, "
            "including what appear to be printer's-error separators (PT '96.98', "
            "'192. 197' -- periods where a hyphen or comma is presumably meant) and "
            "inconsistent en-dash/hyphen use. Per the store-raw principle none of that "
            "is normalized. Two separators are corrected rather than tolerated, and "
            "only because they stop the line being a reference list at all: a colon "
            "where a comma belongs (PT Q378) and one where a range hyphen belongs "
            "(SV Q5). See corrections-applied.json."
        ),
        (
            "Generic (unlabeled) sub-headings under a chapter are emitted as `sub` "
            "structure nodes at a fixed depth (chapter + 1); the source does not mark up "
            "their true relative nesting (if any), so none is inferred. How many an "
            "edition prints varies widely and is a property of that edition: 84 in "
            "English, 109 in Slovenian and Hungarian, 42 in Romanian."
        ),
        (
            "A labelled heading's title ends where the mirror's named anchor ends, or -- "
            "in the editions that carry no usable anchors (de, hu, ro, sl, sv) -- at the "
            "source's own line break between the label and the title. Boldness alone "
            "cannot say: an earlier parser consumed the sub-headings beneath a title "
            "into it ('The Sacramental Celebration of the Paschal Mystery CELEBRATING "
            "THE LITURGY OF THE CHURCH Who celebrates?'). See docs/decisions.md §Parsing."
        ),
        (
            "The work's division scheme -- four parts, eight sections, twenty chapters -- "
            "is asserted against every edition as a subsequence: a heading matched that "
            "the work does not have, or matched out of order, fails the run; a heading "
            "the edition does not print is reported here, because there is nothing to "
            "invent it from."
        ),
        (
            "A stray U+00C2 printed in front of an en dash, a curly quote or an ellipsis "
            "is removed as the double-encoding residue it is (38 occurrences, 28 of them "
            "Spanish); a U+00C2 before a letter is left alone, because French prints one "
            "in 'GRÂCE' and 'ton ÂME'."
        ),
    ]
    if lang in ("en", "pt"):
        notes.append(
            "The Appendix's Part A is separately parsed, from this same cached raw "
            "HTML, into prayer.common."
            + lang
            + " (pipeline/scrapers/prayers.py) -- see "
            "that work's own manifest for its scope. Part B (formulas of Catholic "
            "doctrine) remains unparsed: title/body pairs, but not prayers."
        )
        notes.append(
            "Four English answers (Q445, Q470, Q483, Q523) print their enumeration as a "
            "bulleted list -- 16 items, each in its own single-item <ul>. The items are "
            "read as answer prose and join the run they interrupt, so each of the four "
            "answers is the single prose block it already was. The Portuguese edition "
            "has no list markup anywhere and prints the same four enumerations as "
            "run-on prose, so both editions come out the same shape. Until 2026-08-25 "
            "the parser walked only <p> and <blockquote> and dropped all 16 items."
        )
    notes.extend(cfg["notes"])
    if state.gaps:
        notes.append(f"source question-number gaps detected: {state.gaps}")
    if state.anomalies:
        notes.append(
            "Anomalies observed in this edition (a question with no reference line or "
            "no answer content printed after it, a division of the work this edition "
            "prints no heading for -- see run summary for full detail): "
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
            # The holder stays the Libreria Editrice Vaticana, which is what
            # the whole corpus attributes to and what `static/works.json` and
            # the JSON-LD `copyrightHolder` each carry exactly one of. The
            # four PDF editions were made by a national bishops' conference
            # under licence and print BOTH notices with their own ISBN and
            # year, so the translator's notice goes verbatim into `notice`,
            # which is free text. Nothing is dropped and no schema moves.
            "holder": COPYRIGHT_HOLDER,
            "notice": pdf_copyright(lang, COPYRIGHT_NOTICE),
        },
        "notes": " ".join(notes),
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }


def write_outputs(lang: str, state: ScrapeState, retrieved_at: str) -> None:
    out_dir = BUILD_ROOT / LANG_CONFIG[lang]["work_id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    for node in state.root_children:
        node.compute_span()
    structure = [n.to_dict() for n in state.root_children]
    questions = [state.questions[n].to_dict() for n in sorted(state.questions)]
    manifest = build_manifest(lang, state, retrieved_at)

    write_stamped_json(
        out_dir,
        {
            "manifest.json": manifest,
            "structure.json": structure,
            "questions.json": questions,
            "corrections-applied.json": corrections_receipt(
                LANG_CONFIG[lang]["work_id"],
                state.corrections_applied,
                state.corrections,
                manifest["generated_at"],
            ),
        },
        manifest["generated_at"],
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
# Capture (raw only, every language)
# --------------------------------------------------------------------------


def capture_raw(langs: list[str]) -> int:
    """Fetch each edition's source file into `raw/compendium-{lang}/`, and
    parse nothing.

    This is the "re-parse, never re-crawl" policy being paid forward
    (docs/link-surface.md): the twelve editions nothing reads today cost
    twelve requests once, and having them means a future question about, say,
    the Italian wording of a question is answered offline instead of by
    another crawl of someone else's server.

    ONE fetcher over the whole run, not one per language, and that is
    load-bearing: the 2s floor lives in `Fetcher._last_request`, so a fetcher
    per language would reset it and issue fourteen requests back to back.
    Hence `raw_name` putting the language in the cache name rather than in the
    cache root.

    `fetch_bytes`, never `fetch_str`: four of these are PDFs, and this
    fetcher's `decode` is a claim about the HTML pages' cp1252 charset that a
    PDF would not survive. Bytes are what `raw/` is for anyway.
    """
    fetcher = Fetcher(RAW_ROOT, CAPTURE_POLICY, decode=decode_cp1252)
    ok = True
    print(f"capturing {len(langs)} edition(s) into {RAW_ROOT}")
    for lang in langs:
        name = raw_name(lang)
        kind = "PDF" if EDITIONS[lang].endswith(".pdf") else "HTML"
        url = source_url(lang)
        cached = fetcher.cached(name) is not None
        data, err = fetcher.try_fetch(url, name)
        if data is not None:
            where = "cached" if cached else "fetched"
            print(f"  {lang:3s} {where:7s} {kind:4s} {len(data):>9,d} B  {name}")
            continue
        # The Indonesian PDF is 51 MB, and vatican.va's edge has never once
        # delivered it whole down a single connection -- three attempts got
        # 8 MB, then 33 MB, then failed again. Retrying cannot fix that,
        # because each retry starts over; resuming can, and the server
        # advertises `Accept-Ranges: bytes`. Second-choice rather than the
        # default because the other thirteen arrive in one piece and their
        # bytes are wanted in memory for the size report.
        size, resume_err = download_resumable(
            url, RAW_ROOT / name, policy=CAPTURE_POLICY
        )
        if resume_err is not None:
            ok = False
            print(f"  {lang:3s} FAILED  {err}")
            print(f"      resume: {resume_err}")
            continue
        print(f"  {lang:3s} resumed {kind:4s} {size:>9,d} B  {name}")
    print(f"(network fetches this run: {fetcher.network_fetches})")
    return 0 if ok else 1


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--lang",
        default="all",
        help=(
            "'all' (the default), or a comma-separated list of " + ",".join(LANG_CONFIG)
        ),
    )
    ap.add_argument(
        "--capture",
        metavar="LANGS",
        nargs="?",
        const="all",
        help=(
            "Fetch source editions into raw/ and parse nothing. "
            "'all' (the default) or a comma-separated list of " + ",".join(EDITIONS)
        ),
    )
    args = ap.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    if args.capture:
        wanted = (
            list(EDITIONS)
            if args.capture == "all"
            else [x.strip() for x in args.capture.split(",") if x.strip()]
        )
        unknown = [x for x in wanted if x not in EDITIONS]
        if unknown:
            ap.error(f"no such edition: {', '.join(unknown)}")
        return capture_raw(wanted)

    langs = (
        list(LANG_CONFIG)
        if args.lang == "all"
        else [x.strip() for x in args.lang.split(",") if x.strip()]
    )
    unknown = [x for x in langs if x not in LANG_CONFIG]
    if unknown:
        ap.error(f"no such edition: {', '.join(unknown)}")
    overall_ok = True
    for lang in langs:
        state, fetcher = run_scrape(lang)
        # See common/captured.py: a cache-only re-parse is not a retrieval.
        retrieved_at = captured_at(RAW_ROOT / raw_name(lang)) or datetime.now(
            UTC
        ).strftime("%Y-%m-%d")
        write_outputs(lang, state, retrieved_at)
        ok, problems, refs_present = validate(state)
        print_summary(lang, state, ok, problems, refs_present)
        print(f"(network fetches this run: {fetcher.network_fetches})")
        overall_ok = overall_ok and ok

    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
