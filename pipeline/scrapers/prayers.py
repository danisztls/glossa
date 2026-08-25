#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Common Prayers scraper — Appendix A of the Compendium of the Catechism
of the Catholic Church (2005), three cached CCC prayers, and the Litany of
Loreto, English and Portuguese.

The Compendium pages and the three unnumbered prayers from the CCC are already
on disk. The Compendium pages were captured
whole (front matter, the 598-question body, and this appendix) by
compendium.py on 2026-08-14, when parsing the appendix itself was
deliberately deferred:

  EN: corpus/raw/compendium-en/archive_2005_compendium-ccc_en.html
  PT: corpus/raw/compendium-pt/archive_2005_compendium-ccc_po.html

The Apostles' Creed and Nicene Creed are a two-column table in the CCC's
already-cached ``The Credo`` page; the Our Father is the unnumbered prayer
quoted at CCC 2759. They are parsed from those raw pages, not reconstructed
or fetched anew.

The Litany raw pages were deliberately captured once with ``--fetch-litany``
on 2026-08-18, observing Vatican's two-second crawl delay:

  EN: corpus/raw/rosary-en/litanie-lauretane_en.html
  PT: corpus/raw/rosary-pt/litanie-lauretane_po.html

Normal parsing reads only those cached files. ``--fetch-litany`` writes only a
missing raw file and otherwise skips it; re-crawling is not this task's job
(see docs/research/prayers.md and CLAUDE.md's "re-parse, never re-crawl"
insurance policy).

**Layout differs sharply between the two language pages** (verified by
direct inspection of both raw files, not assumed from the research
proposal):

- EN prints the whole appendix as one HTML table: one <tr> per prayer, two
  <td> cells (vernacular | Latin), except the three Eastern-rite prayers
  (Coptic, Syro-Maronite, Byzantine), whose Latin cell is a bare "&nbsp;"
  -- vatican.va genuinely prints no Latin for these three, not a capture
  gap.
- PT prints the SAME 24 Appendix A prayers as a flat sequential stream of <p> blocks
  (vernacular text, title-then-body, no table at all), followed by a
  SECOND sequential pass through 21 of those same Appendix A prayers giving their
  Latin text -- same order, same wording (spot-checked byte-for-byte
  against EN's Latin column on several prayers), just typeset as a
  trailing block instead of a side-by-side column. This directly
  contradicts the note both compendium.{en,pt} manifests currently carry
  ("a Latin parallel column in EN only") -- see the corrected note this
  script writes into compendium.py's own manifest text, and re-run that
  scraper to regenerate compendium.{en,pt} with the fix.

**Latin is a field, not a work.** Per project direction (recorded in
docs/research/prayers.md §3, not re-litigated here): a genuine `lang=la`
edition would reopen PLAN.md's unresolved "UI language vs. content
language" question. Since the only source of Latin text here already
prints it as a bound companion to the vernacular, not as an independently
addressable text, it lives as an optional `latin: {title, blocks}` field
on each prayer instead.

**No numbers exist in the source to capture.** Unlike CCC paragraphs or
Compendium questions, this appendix prints no numbering at all. The
address the corpus and the site's URLs use is a stable, English-derived,
kebab-case `slug` (e.g. "sign-of-the-cross") -- SLUGS below, in the
appendix's own print order, verified identical in both languages by
direct row-by-row / chunk-by-chunk comparison of the raw HTML. `n` is
kept alongside purely as the print-order integer (ordering, not
addressing) -- see docs/corpus-schema.md's "Work IDs" / prayer schema
section for the reasoning against inventing a numeric address.

**What this appendix's own markup does and doesn't mark up structurally**
(see the parsing functions below for exactly how each is handled):

- Five prayers print two full alternate wordings under one title, each
  headed by a "UK VERSION" / "USA VERSION" marker paragraph (Regina Caeli,
  Hail Holy Queen, Magnificat, Benedictus, Te Deum) -- EN only; PT prints
  one wording throughout. Captured as an intermediate `variants` array that
  no edition carries: the split is resolved into `prayer.common.en` (the
  collection, USA wording) and `prayer.common.en-gb` (those five, UK
  wording) before anything is written -- see `BASE_VARIANT`.
- The Angelus (both languages) and the Regina Caeli / Rosary closing
  dialogue (PT only -- EN doesn't print these as dialogue at all) mark
  versicle/response lines with a leading "V."/"R." (EN, PT's Angelus) or
  "D."/"C." (PT's Regina Caeli and Rosary closing -- "Dirigente"/"Coro",
  the same leader/assembly roles under different printed initials).
  Captured as `versicle`/`response` blocks, a schema extension beyond the
  CCC's `prose`/`quote` pair (docs/corpus-schema.md is updated alongside
  this script).
- The Latin column/block is never dialogically labelled in either
  language (no "V."/"R." there even where the vernacular alongside it
  carries them) -- so Latin content is always captured as plain `prose`
  blocks, one per source <p> for EN, split on a doubled <br/><br/> (a
  real stanza-gap signal in the source) for PT, which prints each Latin
  prayer as a single <p> with no internal paragraph markup at all.
- The Rosary alone needs real structure beyond `blocks`: four named
  mystery groups, each with a weekday rubric and five full Scripture
  meditations, plus sourced directions for praying it. Captured as
  `groups` and `instructions`, present only on this one entry.

Usage:
  uv run pipeline/scrapers/prayers.py --lang en|pt|both

No --sample mode: 28 prayers total (24 Appendix A entries, three short CCC
texts, and the Litany), parsed instantly and entirely
offline; there is nothing here for a sample slice to save time on.
"""

from __future__ import annotations

import argparse
import html as ihtml
import re
import sys
import unicodedata
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from pathlib import Path

# Sibling package in this directory -- a script's own directory is on sys.path,
# so this resolves regardless of the working directory. See common/__init__.py's
# docblock for what does and does not belong there.
from common import (
    Fetcher,
    FetchError,
    FetchPolicy,
    load_corrections,
    raw_root,
    require_corpus,
    works_root,
    write_stamped_json,
)

# The corpus is a separate, private repository (docs/decisions.md,
# 2026-08-23); `common.corpus_dir()` resolves it, honouring $CORPUS_DIR.
RAW_ROOT = raw_root()
WORKS_ROOT = works_root()

EN_RAW = RAW_ROOT / "compendium-en" / "archive_2005_compendium-ccc_en.html"
PT_RAW = RAW_ROOT / "compendium-pt" / "archive_2005_compendium-ccc_po.html"
CCC_EN_CREDO_RAW = RAW_ROOT / "ccc-en" / "__P13.HTM"
CCC_PT_CREDO_RAW = RAW_ROOT / "ccc-pt" / "p1s1c3_142-184_po.html"
CCC_EN_OUR_FATHER_RAW = RAW_ROOT / "ccc-en" / "__P9V.HTM"
CCC_PT_OUR_FATHER_RAW = RAW_ROOT / "ccc-pt" / "p4s2_2759-2865_po.html"
LITANY_EN_RAW = RAW_ROOT / "rosary-en" / "litanie-lauretane_en.html"
LITANY_PT_RAW = RAW_ROOT / "rosary-pt" / "litanie-lauretane_po.html"
ROSARY_MYSTERY_FILES = (
    "misteri_gaudiosi",
    "misteri_luminosi",
    "misteri_dolorosi",
    "misteri_gloriosi",
)

EN_URL = "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_en.html"
PT_URL = "https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_po.html"
CCC_EN_CREDO_URL = "https://www.vatican.va/archive/ENG0015/__P13.HTM"
CCC_PT_CREDO_URL = (
    "https://www.vatican.va/archive/cathechism_po/index_new/p1s1c3_142-184_po.html"
)
CCC_EN_OUR_FATHER_URL = "https://www.vatican.va/archive/ENG0015/__P9V.HTM"
CCC_PT_OUR_FATHER_URL = (
    "https://www.vatican.va/archive/cathechism_po/index_new/p4s2_2759-2865_po.html"
)
LITANY_EN_URL = (
    "https://www.vatican.va/special/rosary/documents/litanie-lauretane_en.html"
)
LITANY_PT_URL = (
    "https://www.vatican.va/special/rosary/documents/litanie-lauretane_po.html"
)
ROSARY_MYSTERY_URLS = {
    lang: [
        f"https://www.vatican.va/special/rosary/documents/{name}_{lang}.html"
        for name in ROSARY_MYSTERY_FILES
    ]
    for lang in ("en", "po")
}

# Both raw files were fetched by compendium.py on this date; re-parsing
# them here is not a new retrieval event, so the manifest carries the
# original date rather than today's.
RETRIEVED_AT = "2026-08-14"
CCC_RETRIEVED_AT = "2026-08-15"
LITANY_RETRIEVED_AT = "2026-08-18"
ROSARY_MYSTERIES_RETRIEVED_AT = "2026-08-18"
USER_AGENT = "Glossa Catholica corpus builder"
CRAWL_DELAY = 2.0

COPYRIGHT_NOTICE = "© Copyright 2005 - Libreria Editrice Vaticana"
COPYRIGHT_HOLDER = "Libreria Editrice Vaticana"

# The appendix's own print order, English-derived kebab-case, verified
# identical in both languages by direct inspection of the raw HTML (see
# docs/research/prayers.md's table, independently re-confirmed while
# writing this script). This is the corpus's stable address for each
# prayer; `n` below is just this list's 1-based position.
CREED_AND_LORDS_PRAYER_SLUGS = [
    "apostles-creed",
    "nicene-creed",
    "our-father",
]
LITANY_SLUG = "litany-of-loreto"

APPENDIX_SLUGS = [
    "sign-of-the-cross",
    "glory-be",
    "hail-mary",
    "angel-of-god",
    "eternal-rest",
    "angelus",
    "regina-caeli",
    "hail-holy-queen",
    "magnificat",
    "sub-tuum-praesidium",
    "benedictus",
    "te-deum",
    "veni-creator-spiritus",
    "veni-sancte-spiritus",
    "anima-christi",
    "memorare",
    "rosary",
    "coptic-incense-prayer",
    "syro-maronite-farewell-to-the-altar",
    "byzantine-prayer-for-the-deceased",
    "act-of-faith",
    "act-of-hope",
    "act-of-love",
    "act-of-contrition",
]
SLUGS = CREED_AND_LORDS_PRAYER_SLUGS + APPENDIX_SLUGS + [LITANY_SLUG]

# Vatican's source pages print no Latin companion for the three CCC texts,
# the Litany, or the three Eastern-rite Appendix A prayers (the latter are
# explicit empty "&nbsp;" cells in EN) -- genuine source absences, not gaps.
NO_LATIN_SLUGS = {
    *CREED_AND_LORDS_PRAYER_SLUGS,
    LITANY_SLUG,
    "coptic-incense-prayer",
    "syro-maronite-farewell-to-the-altar",
    "byzantine-prayer-for-the-deceased",
}
LATIN_SLUGS = [s for s in SLUGS if s not in NO_LATIN_SLUGS]

assert len(APPENDIX_SLUGS) == 24
assert len(SLUGS) == 28
assert len(LATIN_SLUGS) == 21


# --------------------------------------------------------------------------
# Text utilities
# --------------------------------------------------------------------------

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
_DOUBLE_BR_RE = re.compile(r"(?:<br\s*/?>\s*){2,}", re.IGNORECASE)


def flatten(raw: str) -> str:
    """Drop all tags, decode entities, collapse whitespace to single
    spaces. <br/> becomes a space first (it always separates real printed
    content, same as compendium.py's strip_tags) -- every other tag is
    dropped with no replacement. For ordinary running prose, where the
    source's <br/>s are a fixed-column-width typesetting artifact, not
    meaningful structure -- same convention docs/corpus-schema.md states
    for CCC paragraph blocks ("line breaks inside a block collapse to
    single spaces")."""
    s = _BR_RE.sub(" ", raw)
    s = _TAG_RE.sub("", s)
    s = ihtml.unescape(s)
    return _WS_RE.sub(" ", s).strip()


def line_html(lines: list[str]) -> str | None:
    """The narrow markup for a block that prints on more than one line.

    THE SOURCE'S `<br/>` IS VERSE STRUCTURE HERE, NOT COLUMN WRAP, and this
    scraper used to throw it away on the opposite assumption -- `flatten`'s
    docstring still called it "a fixed-column-width typesetting artifact",
    borrowed from the convention `docs/corpus-schema.md` states for CCC
    paragraph blocks. That is true of the Catechism's running prose and false
    of a prayer: measured over the whole Appendix A region of the English
    page, its 895 `<br/>`-separated lines have a MEDIAN LENGTH OF 28
    CHARACTERS and 73% of them end on punctuation. Column wrap produces long
    lines of near-uniform width breaking mid-clause; these are short and
    clause-final, because the Salve Regina, the Te Deum and the Veni Creator
    are set as verse and the source sets them that way. Collapsing them gave
    every prayer on the site as one undifferentiated paragraph.

    Carried as `html` beside `text`, which is exactly how a document section
    carries the same thing (docs/corpus-schema.md §Documents): `<br>` is
    already in that allowlist, `inline-html.ts` already parses it, and every
    prose renderer on the site already emits it. A second convention -- a
    `lines` array, or newlines inside `text` -- would have been a new thing
    to teach five components about. `text` keeps the collapsed form, so
    search and every plain-text consumer are unaffected.

    `None` for a single-line block, so the field marks a real exception the
    way every other optional field in this corpus does rather than restating
    `text` with markup around it for the majority that has no lines to keep.
    """
    if len(lines) < 2:
        return None
    return "<br />".join(ihtml.escape(line, quote=False) for line in lines)


def br_segments(raw: str) -> list[str]:
    """Split raw HTML on <br/> into flattened text segments, dropping
    empty ones. Used only where <br/> is doing real structural work
    instead of merely wrapping running prose -- dialogic paragraphs
    (separating a versicle from its response, or a response from a
    refrain the source glues onto the same <p>) and the Rosary's mystery
    group headers (separating the group's name from its weekday rubric)."""
    return [flatten(seg) for seg in _BR_RE.split(raw) if flatten(seg)]


_P_RE = re.compile(r"<p[^>]*>((?:(?!</p>).)*?)</p>", re.DOTALL | re.IGNORECASE)


def top_paragraphs(body_html: str) -> list[str]:
    """Raw inner HTML of each top-level <p>...</p> in document order.
    Verified non-nested throughout this appendix in both languages (the
    same verification compendium.py already did for the Q&A stream --
    this is materially simpler markup, no blockquotes, no nested tables)."""
    return [m.group(1) for m in _P_RE.finditer(body_html)]


#: How this scraper conducts itself toward vatican.va. The 2.0s is that host's
#: robots.txt `Crawl-delay` and is a commitment (docs/decisions.md). No retry:
#: this captures a handful of named pages, and a failure means the prayer text
#: would be missing, which is a reason to stop rather than to carry on.
VATICAN_POLICY = FetchPolicy(user_agent=USER_AGENT, delay=2.0)


def capture_raw_pages(pages: list[tuple[str, Path]]) -> None:
    """Capture explicitly requested Vatican pages once.

    The raw cache is write-once: an existing file is reused, never refreshed
    or overwritten. Requests are deliberately sequential and respect the
    Vatican's two-second crawl delay.

    Paths are absolute and scattered across `raw/`, so each page is fetched
    through a `Fetcher` rooted at its own directory rather than one rooted at
    a shared cache -- the politeness clock is per-fetcher, which is why they
    are threaded through `state` below rather than made fresh per page."""
    fetcher = Fetcher(RAW_ROOT, VATICAN_POLICY)
    for url, path in pages:
        if path.exists():
            continue
        try:
            fetcher.fetch_bytes(url, str(path.relative_to(RAW_ROOT)))
        except FetchError as exc:
            raise RuntimeError(f"Vatican fetch failed: {exc}") from exc


def capture_litany_raw() -> None:
    """Capture the two explicitly requested Litany source pages once."""
    capture_raw_pages([(LITANY_EN_URL, LITANY_EN_RAW), (LITANY_PT_URL, LITANY_PT_RAW)])


def rosary_mystery_raw(lang: str) -> list[Path]:
    source_lang = "en" if lang == "en" else "po"
    return [
        RAW_ROOT / f"rosary-{lang}" / f"{name}_{source_lang}.html"
        for name in ROSARY_MYSTERY_FILES
    ]


def capture_rosary_mysteries_raw() -> None:
    """Capture the four full-mystery pages for each published language once."""
    pages = [
        (url, path)
        for lang in ("en", "pt")
        for url, path in zip(
            ROSARY_MYSTERY_URLS["en" if lang == "en" else "po"],
            rosary_mystery_raw(lang),
            strict=True,
        )
    ]
    capture_raw_pages(pages)


# A prayer cell/chunk opens with its title in one of two shapes, tried in
# this order: a bare <b>Title</b> immediately before the first <p> (most
# EN vernacular rows and every Latin cell/entry), or the title wrapped in
# its own paragraph, <p ...><b>Title</b></p> (EN's three Eastern-rite
# rows, and -- the general case, not just Eastern-rite -- every PT
# vernacular prayer, which prints title and body as separate paragraphs
# throughout).
_LEAD_B_RE = re.compile(r"^\s*<b[^>]*>(.*?)</b>\s*(.*)$", re.DOTALL | re.IGNORECASE)
_LEAD_P_B_RE = re.compile(
    r"^\s*<p[^>]*>\s*<b[^>]*>(.*?)</b>\s*</p>\s*(.*)$", re.DOTALL | re.IGNORECASE
)


def split_title(chunk_html: str) -> tuple[str, str]:
    stripped = chunk_html.strip()
    m = _LEAD_B_RE.match(stripped)
    if m and not stripped[: m.end(1)].count("<p"):
        return flatten(m.group(1)), m.group(2)
    m = _LEAD_P_B_RE.match(stripped)
    if m:
        return flatten(m.group(1)), m.group(2)
    raise ValueError(f"no recognizable title in chunk: {stripped[:120]!r}")


# --------------------------------------------------------------------------
# Data model
# --------------------------------------------------------------------------


@dataclass
class BlockOut:
    kind: str  # "prose" | "versicle" | "response"
    text: str
    label: str | None = None  # verbatim printed prefix: "V." | "R." | "D." | "C."
    #: The block's printed LINES, joined by `<br />`, when it has more than
    #: one -- see `line_html`. Absent otherwise, and `text` always carries the
    #: same words either way.
    html: str | None = None

    def to_dict(self) -> dict:
        # Omitted when "prose" -- see vatican_docs.py's BlockOut for why, and
        # docs/corpus-schema.md for the schema statement. Here the exceptions
        # are "versicle"/"response", which carry a `label` too.
        d: dict = {}
        if self.kind != "prose":
            d["kind"] = self.kind
        d["text"] = self.text
        if self.html:
            d["html"] = self.html
        if self.label:
            d["label"] = self.label
        return d


@dataclass
class PrayerCitation:
    """A source-printed Scripture locator attached to a Rosary meditation.
    The raw locator stays verbatim; the site resolves it to the Bible when
    rendering the inline footnote."""

    marker: str
    text: str

    def to_dict(self) -> dict:
        return {"marker": self.marker, "text": self.text}


@dataclass
class MysteryItem:
    """One Rosary mystery, with the title and Scripture meditation Vatican
    prints for it. The recurring decade prayer is documented once in the
    Rosary's instructions rather than copied twenty times."""

    title: str
    meditation: str
    citation: PrayerCitation | None = None

    def to_dict(self) -> dict:
        d = {"title": self.title, "meditation": self.meditation}
        if self.citation:
            d["citation"] = self.citation.to_dict()
        return d


@dataclass
class MysteryGroup:
    name: str
    rubric: str | None
    items: list[MysteryItem]

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "rubric": self.rubric,
            "items": [item.to_dict() for item in self.items],
        }


@dataclass
class LatinText:
    title: str
    blocks: list[BlockOut]

    def to_dict(self) -> dict:
        return {"title": self.title, "blocks": [b.to_dict() for b in self.blocks]}


@dataclass
class PrayerInstructions:
    title: str
    blocks: list[BlockOut]

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "blocks": [block.to_dict() for block in self.blocks],
        }


@dataclass
class Variant:
    label: str  # "UK" | "USA"
    blocks: list[BlockOut]

    def to_dict(self) -> dict:
        return {"label": self.label, "blocks": [b.to_dict() for b in self.blocks]}


@dataclass
class Prayer:
    n: int
    slug: str
    title: str
    blocks: list[BlockOut] = field(default_factory=list)
    variants: list[Variant] = field(default_factory=list)
    latin: LatinText | None = None
    rubric: str | None = None
    groups: list[MysteryGroup] = field(default_factory=list)
    instructions: PrayerInstructions | None = None

    @property
    def kind(self) -> str:
        # Data-driven, not hardcoded per slug: "group" whenever mystery
        # groups were captured (the Rosary, the only entry that has any),
        # "dialogic" whenever the parsed blocks carry a versicle/response
        # pair -- which differs by *language* for a couple of prayers
        # (PT's Regina Caeli labels a closing D./C. couplet EN doesn't
        # print at all), and that's a real difference in how each source
        # page typesets the same prayer, not something to paper over.
        if self.groups:
            return "group"
        if any(b.kind in ("versicle", "response") for b in self.blocks):
            return "dialogic"
        return "simple"

    def to_dict(self) -> dict:
        d = {
            "n": self.n,
            "slug": self.slug,
            "title": self.title,
            "kind": self.kind,
            "blocks": [b.to_dict() for b in self.blocks],
        }
        if self.variants:
            d["variants"] = [v.to_dict() for v in self.variants]
        if self.latin:
            d["latin"] = self.latin.to_dict()
        d["rubric"] = self.rubric
        if self.groups:
            d["groups"] = [g.to_dict() for g in self.groups]
        if self.instructions:
            d["instructions"] = self.instructions.to_dict()
        return d


# --------------------------------------------------------------------------
# Vernacular body parsing (shared by EN and PT)
# --------------------------------------------------------------------------

# "V."/"R." (EN, and PT's Angelus) or "D."/"C." (PT's Regina Caeli and
# Rosary closing dialogue -- printed as "D./"/"C./", with a slash the EN
# convention doesn't use, hence the optional "/" below) mark a versicle or
# response line. D/C stand for "Dirigente"/"Coro" (leader/choir), the same
# roles V/R name in Latin-derived form -- functionally identical, kept
# distinguishable via each block's verbatim `label`.
_DIALOGIC_PREFIX_RE = re.compile(r"^([VRDC])\.\s*/?\s*(.*)$", re.DOTALL)


def process_paragraph(raw: str, out: list[BlockOut]) -> None:
    """Turn one raw <p> into one or more blocks. The common case (no
    versicle/response marker anywhere in the paragraph) flattens the whole
    <p> to one prose block, collapsing its <br/>s to spaces same as CCC
    paragraph blocks do -- most <br/> in this source is just fixed-column
    typesetting, not structure.

    When a marker IS present, the paragraph is split on <br/> instead,
    because the source consistently glues a versicle to its response (and
    sometimes a further refrain reference) into the SAME <p> rather than
    giving each its own paragraph -- verified against every dialogic
    paragraph in this appendix, including one shape found only in PT: the
    Regina Caeli's closing "D./C." couplet is appended, via <br/>, onto
    the END of the antiphon's own paragraph, not given a paragraph of its
    own the way EN's Angelus always does. Runs of plain segments between
    (or around) markers are re-joined into a single prose block each,
    rather than shattering ordinary multi-line text into one block per
    printed line."""
    text = flatten(raw)
    if not text:
        return
    segments = br_segments(raw)
    if not any(_DIALOGIC_PREFIX_RE.match(seg) for seg in segments):
        out.append(BlockOut("prose", text, html=line_html(segments)))
        return
    prose_buf: list[str] = []

    def flush() -> None:
        if prose_buf:
            out.append(
                BlockOut("prose", " ".join(prose_buf), html=line_html(prose_buf))
            )
            prose_buf.clear()

    for seg in segments:
        m = _DIALOGIC_PREFIX_RE.match(seg)
        if m:
            flush()
            label, seg_text = m.group(1), m.group(2)
            kind = "versicle" if label in ("V", "D") else "response"
            out.append(BlockOut(kind, seg_text, label + "."))
        else:
            prose_buf.append(seg)
    flush()


_VARIANT_MARKERS = {"UK VERSION": "UK", "USA VERSION": "USA"}
_SHARED_MARKER = "THEN FOR BOTH VERSIONS"


def parse_simple_body(paragraphs: list[str]) -> tuple[list[BlockOut], list[Variant]]:
    """Walk a prayer's body paragraphs, splitting off UK/USA alternate
    wordings where the source marks them (five EN prayers only -- see
    module docstring). A marker paragraph is a state transition, not
    content: it never becomes a block itself."""
    blocks: list[BlockOut] = []
    variant_blocks: dict[str, list[BlockOut]] = {}
    current: str | None = None
    for raw in paragraphs:
        text = flatten(raw)
        if not text:
            continue
        upper = text.upper().rstrip(".:")
        if upper in _VARIANT_MARKERS:
            current = _VARIANT_MARKERS[upper]
            variant_blocks.setdefault(current, [])
            continue
        if upper == _SHARED_MARKER:
            current = None
            continue
        process_paragraph(raw, variant_blocks[current] if current else blocks)
    variants = [Variant(label, blks) for label, blks in variant_blocks.items()]
    return blocks, variants


# A Rosary mystery-group header is a short line wholly emphasized (bold
# and/or italic, either nesting order -- PT's fourth group reverses EN's
# <b><i> to <i><b>) followed by a <br/> and then its weekday rubric in
# the same paragraph. Nothing else in this appendix's paragraph stream
# opens with an emphasis tag AND carries an internal <br/> this early --
# verified against every non-group paragraph in the Rosary cell of both
# languages (the trailing "Let us pray."/"Oremus." markers are wholly
# emphasized but carry no <br/> at all, so they don't collide).
_GROUP_HEADER_RE = re.compile(r"^\s*<[bi][^>]*>.*?<br", re.IGNORECASE | re.DOTALL)


def parse_rosary_body(
    paragraphs: list[str],
) -> tuple[list[MysteryGroup], list[BlockOut]]:
    groups: list[MysteryGroup] = []
    i, n = 0, len(paragraphs)
    while i < n and len(groups) < 4:
        raw = paragraphs[i]
        if not flatten(raw):
            i += 1
            continue
        if not _GROUP_HEADER_RE.match(raw):
            break
        segs = br_segments(raw)
        name, rubric = segs[0], (segs[1] if len(segs) > 1 else None)
        i += 1
        while i < n and not flatten(paragraphs[i]):
            i += 1
        items = br_segments(paragraphs[i]) if i < n else []
        if i < n:
            i += 1
        # Each mystery group names exactly five mysteries -- a fixed,
        # doctrinally settled count (both languages' own text confirms it
        # for every group but one), not a parser assumption. PT's fourth
        # group wraps its fifth item's text across an extra <br/> (long
        # enough to need it where the other 19 items don't); merging any
        # segments past the fifth back together recovers the one logical
        # item without inventing or dropping any of its words.
        if len(items) > 5:
            items = [*items[:4], " ".join(items[4:])]
        groups.append(
            MysteryGroup(
                name,
                rubric,
                [MysteryItem(title=item, meditation="") for item in items],
            )
        )
    trailer: list[BlockOut] = []
    for raw in paragraphs[i:]:
        process_paragraph(raw, trailer)
    return groups, trailer


def parse_vernacular_chunk(
    title: str, body_html: str, slug: str
) -> tuple[list[BlockOut], list[Variant], list[MysteryGroup]]:
    paragraphs = top_paragraphs(body_html)
    if slug == "rosary":
        groups, trailer = parse_rosary_body(paragraphs)
        return trailer, [], groups
    blocks, variants = parse_simple_body(paragraphs)
    return blocks, variants, []


# --------------------------------------------------------------------------
# Latin parsing -- deliberately simpler than the vernacular path (see
# module docstring: Latin is never dialogically labelled in this source,
# and never carries UK/USA variants), so it gets its own small functions
# rather than reusing parse_simple_body/parse_rosary_body.
# --------------------------------------------------------------------------


def latin_blocks_en(body_html: str) -> list[BlockOut]:
    return [
        BlockOut("prose", flatten(p), html=line_html(br_segments(p)))
        for p in top_paragraphs(body_html)
        if flatten(p)
    ]


def latin_blocks_pt(body_html: str) -> list[BlockOut]:
    """PT prints each Latin prayer as a single <p> with no nested
    paragraph markup at all -- so there is no <p> boundary to split on.
    The one structural signal the source does use consistently is a
    doubled <br/><br/> at a stanza gap (seen in Veni Creator Spiritus,
    Veni Sancte Spiritus, the Rosary's mystery-group Latin names, ...);
    splitting on that and nowhere else is a real source signal, not an
    invented one -- a prayer with no doubled break yields exactly one
    block, which is the honest answer when the source marks no internal
    structure."""
    return [
        BlockOut("prose", flatten(part), html=line_html(br_segments(part)))
        for part in _DOUBLE_BR_RE.split(body_html)
        if flatten(part)
    ]


# --------------------------------------------------------------------------
# EN: table-row extraction
# --------------------------------------------------------------------------

_TR_RE = re.compile(r"<tr[^>]*>((?:(?!</tr>).)*?)</tr>", re.DOTALL | re.IGNORECASE)
_TD_RE = re.compile(r"<td[^>]*>((?:(?!</td>).)*?)</td>", re.DOTALL | re.IGNORECASE)

EN_START_ANCHOR = 'name="A) COMMON PRAYERS"'
EN_END_ANCHOR = 'name="B) FORMULAS OF CATHOLIC DOCTRINE"'


def extract_en_rows(html_text: str) -> list[tuple[str, str]]:
    start = html_text.find(EN_START_ANCHOR)
    end = html_text.find(EN_END_ANCHOR)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(
            f"could not locate EN appendix boundaries (start={start}, end={end}) "
            "-- source page structure may have changed"
        )
    region = html_text[start:end]
    rows: list[tuple[str, str]] = []
    for m in _TR_RE.finditer(region):
        cells = [c.group(1) for c in _TD_RE.finditer(m.group(1))]
        if len(cells) != 2:
            continue  # the header row: one <td colspan="2"> holding the "APPENDIX" / "A) COMMON PRAYERS" titles
        if not flatten(cells[0]) and not flatten(cells[1]):
            continue  # the trailing spacer row (both cells bare "&nbsp;")
        rows.append((cells[0], cells[1]))
    return rows


def build_prayers_en(html_text: str) -> list[Prayer]:
    rows = extract_en_rows(html_text)
    if len(rows) != 24:
        raise RuntimeError(f"EN: expected 24 prayer rows, found {len(rows)}")
    prayers = []
    for i, (vern_html, latin_html) in enumerate(rows):
        slug = APPENDIX_SLUGS[i]
        title, body_html = split_title(vern_html)
        blocks, variants, groups = parse_vernacular_chunk(title, body_html, slug)
        latin = None
        if flatten(latin_html):
            latin_title, latin_body = split_title(latin_html)
            latin = LatinText(latin_title, latin_blocks_en(latin_body))
        prayers.append(
            Prayer(
                n=i + 1,
                slug=slug,
                title=title,
                blocks=blocks,
                variants=variants,
                latin=latin,
                groups=groups,
            )
        )
    return prayers


# --------------------------------------------------------------------------
# PT: sequential-paragraph extraction (vernacular), then a second pass for
# the trailing Latin block
# --------------------------------------------------------------------------

PT_START_ANCHOR = 'name="A) ORA&Ccedil;&Otilde;ES COMUNS"'
PT_END_ANCHOR = 'name="B) F&Oacute;RMULAS DE DOUTRINA CAT&Oacute;LICA"'
# PT's Latin block has no section heading of its own (confirmed absent by
# grep -- no "LATIM"/"EM LATIM" anchor anywhere in the file); "Signum
# Crucis" is the first Latin entry's title (always -- see SLUGS[0]) and a
# unique string in the file, so it's used as the boundary between PT's
# vernacular prayers and its trailing Latin pass.
PT_LATIN_START_MARKER = "<p><b>Signum Crucis"

# A PT prayer title paragraph is <b>Title</b> alone, or <b>Title</b>
# followed by a parenthesized rubric on the same paragraph after a <br/>
# (e.g. "Rainha do Céu<br/>(no Tempo Pascal)", "Vem, Espírito Santo<br/>
# (Sequência de Pentecostes)", each of the three Eastern-rite prayers'
# "(Tradição ...)" line) -- verified against all 24 titles directly.
# This SAME shape is also what the Rosary's own internal mystery-group
# headings look like (a bold name, <br/>, a weekday rubric in parens), so
# this regex alone can't tell a real prayer title from one of those four
# internal headings -- and PT's own markup is inconsistent enough between
# them (the fourth mystery group reverses <b><i> to <i><b>, and the
# Rosary's closing-prayer heading is bold+italic with no rubric at all,
# i.e. shaped exactly like a normal title) that no single shape rule
# reliably tells them apart. See PT_ROSARY_NEXT_TITLE below for how the
# Rosary's internal content is bounded instead.
_TITLE_RE = re.compile(
    r"^\s*<b[^>]*>((?:(?!<br).)*?)</b>\s*"
    r"(?:<br\s*/?>\s*\(.*?\)\s*)?(?:&nbsp;)?\s*$",
    re.DOTALL | re.IGNORECASE,
)

# The text of the prayer that immediately follows the Rosary in print
# order (Coptic Incense Prayer's PT title) -- used only to bound where
# the Rosary's own chunk ends, since its internal shape can't be told
# apart from a real title by markup alone (see _TITLE_RE above).
PT_ROSARY_TITLE = "Rosário"
PT_ROSARY_NEXT_TITLE = "Oração do Incenso"


def split_pt_chunks(region_html: str) -> list[tuple[str, list[str]]]:
    paragraphs = top_paragraphs(region_html)
    chunks: list[tuple[str, list[str]]] = []
    title: str | None = None
    body: list[str] = []
    in_rosary = False
    for raw in paragraphs:
        text = flatten(raw)
        if not text:
            continue
        if in_rosary:
            if text.startswith(PT_ROSARY_NEXT_TITLE):
                in_rosary = False  # fall through: this paragraph starts the next chunk
            else:
                body.append(raw)
                continue
        m = _TITLE_RE.match(raw)
        if m:
            if title is not None:
                chunks.append((title, body))
            title = flatten(m.group(1))
            body = []
            if title == PT_ROSARY_TITLE:
                in_rosary = True
            continue
        if title is not None:
            body.append(raw)
    if title is not None:
        chunks.append((title, body))
    return chunks


def build_prayers_pt(html_text: str) -> list[Prayer]:
    start = html_text.find(PT_START_ANCHOR)
    end = html_text.find(PT_END_ANCHOR)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(
            f"could not locate PT appendix boundaries (start={start}, end={end}) "
            "-- source page structure may have changed"
        )
    latin_start = html_text.find(PT_LATIN_START_MARKER, start)
    if latin_start == -1 or latin_start >= end:
        raise RuntimeError(
            "could not locate PT's Latin block (no 'Signum Crucis' entry found "
            "-- source page structure may have changed)"
        )

    vern_chunks = split_pt_chunks(html_text[start:latin_start])
    if len(vern_chunks) != 24:
        raise RuntimeError(
            f"PT: expected 24 vernacular chunks, found {len(vern_chunks)}"
        )

    latin_paragraphs = [
        p for p in top_paragraphs(html_text[latin_start:end]) if flatten(p)
    ]
    if len(latin_paragraphs) != 21:
        raise RuntimeError(
            f"PT: expected 21 Latin entries, found {len(latin_paragraphs)}"
        )

    latin_by_slug: dict[str, LatinText] = {}
    for slug, raw in zip(
        [s for s in APPENDIX_SLUGS if s not in NO_LATIN_SLUGS],
        latin_paragraphs,
        strict=True,
    ):
        latin_title, latin_body = split_title(raw)
        latin_by_slug[slug] = LatinText(latin_title, latin_blocks_pt(latin_body))

    prayers = []
    for i, (title, body_paragraphs) in enumerate(vern_chunks):
        slug = APPENDIX_SLUGS[i]
        if slug == "rosary":
            groups, trailer = parse_rosary_body(body_paragraphs)
            blocks, variants = trailer, []
        else:
            blocks, variants = parse_simple_body(body_paragraphs)
            groups = []
        prayers.append(
            Prayer(
                n=i + 1,
                slug=slug,
                title=title,
                blocks=blocks,
                variants=variants,
                latin=latin_by_slug.get(slug),
                groups=groups,
            )
        )
    return prayers


# --------------------------------------------------------------------------
# CCC: Apostles' Creed, Nicene Creed, and the Our Father. These three
# unnumbered texts complement (rather than belong to) the Compendium's
# Appendix A, so their `n` values are assigned only after this and the
# appendix parser have each reproduced their own source order.
# --------------------------------------------------------------------------


def _only_paragraph_after(paragraphs: list[str], title: str) -> str:
    """Return the one non-empty source paragraph immediately following
    ``title``. The exact title match and one-next-paragraph rule make source
    drift a loud error rather than silently selecting a quotation elsewhere
    in the Catechism page."""
    matches = [i for i, raw in enumerate(paragraphs) if flatten(raw) == title]
    if len(matches) != 1:
        raise RuntimeError(
            f"expected exactly one CCC heading {title!r}, found {len(matches)}"
        )
    for raw in paragraphs[matches[0] + 1 :]:
        if flatten(raw):
            return raw
    raise RuntimeError(f"CCC heading {title!r} has no following text paragraph")


def build_creeds_en(html_text: str) -> list[Prayer]:
    paragraphs = top_paragraphs(html_text)
    apostles = _only_paragraph_after(paragraphs, "The Apostles Creed")
    nicene = _only_paragraph_after(paragraphs, "The Nicene Creed")
    return [
        Prayer(
            0,
            "apostles-creed",
            "The Apostles Creed",
            [
                BlockOut(
                    "prose", flatten(apostles), html=line_html(br_segments(apostles))
                )
            ],
        ),
        Prayer(
            0,
            "nicene-creed",
            "The Nicene Creed",
            [BlockOut("prose", flatten(nicene), html=line_html(br_segments(nicene)))],
        ),
    ]


def build_creeds_pt(html_text: str) -> list[Prayer]:
    table_match = re.search(
        r'<table\b[^>]*\bid=["\']table2["\'][^>]*>(.*?)</table>',
        html_text,
        re.IGNORECASE | re.DOTALL,
    )
    if not table_match:
        raise RuntimeError("could not locate Portuguese CCC credo table #table2")
    rows = []
    for row in _TR_RE.finditer(table_match.group(1)):
        cells = [cell.group(1) for cell in _TD_RE.finditer(row.group(1))]
        if len(cells) == 2:
            rows.append(cells)
    if len(rows) != 8:
        raise RuntimeError(f"PT: expected 8 Credo table rows, found {len(rows)}")
    titles = [flatten(cell) for cell in rows[0]]
    expected_titles = [
        "SÍMBOLO DOS APÓSTOLOS (58)",
        "CREDO DE NICEIA–CONSTANTINOPLA (59)",
    ]
    if titles != expected_titles:
        raise RuntimeError(f"PT: unexpected Credo table titles: {titles!r}")
    # Each table ROW is a printed line of the creed, and each column one of
    # the two creeds -- so the rows ARE the lines, and joining them with a
    # space is the same collapse `flatten` used to do to `<br/>` (line_html).
    column_lines = [
        [flatten(row[column]) for row in rows[1:] if flatten(row[column])]
        for column in range(2)
    ]
    columns = [" ".join(lines) for lines in column_lines]
    return [
        Prayer(
            0,
            "apostles-creed",
            "Símbolo dos Apóstolos",
            [BlockOut("prose", columns[0], html=line_html(column_lines[0]))],
        ),
        Prayer(
            0,
            "nicene-creed",
            "Credo de Niceia–Constantinopla",
            [BlockOut("prose", columns[1], html=line_html(column_lines[1]))],
        ),
    ]


def build_our_father_en(html_text: str) -> Prayer:
    paragraphs = top_paragraphs(html_text)
    matches = [
        raw
        for raw in paragraphs
        if flatten(raw).startswith("Our Father who art in heaven,")
    ]
    if len(matches) != 1:
        raise RuntimeError(
            f"EN: expected one Our Father text at CCC 2759, found {len(matches)}"
        )
    return Prayer(
        0,
        "our-father",
        "The Our Father",
        [
            BlockOut(
                "prose", flatten(matches[0]), html=line_html(br_segments(matches[0]))
            )
        ],
    )


def build_our_father_pt(html_text: str) -> Prayer:
    matches = re.findall(
        r"<blockquote[^>]*>\s*(<p[^>]*>.*?</p>)\s*</blockquote>",
        html_text,
        re.IGNORECASE | re.DOTALL,
    )
    prayers = [
        raw
        for raw in matches
        if flatten(raw).startswith("Pai Nosso que estais nos céus,")
    ]
    if len(prayers) != 1:
        raise RuntimeError(
            f"PT: expected one Our Father text at CCC 2759, found {len(prayers)}"
        )
    return Prayer(
        0,
        "our-father",
        "Pai Nosso",
        [
            BlockOut(
                "prose", flatten(prayers[0]), html=line_html(br_segments(prayers[0]))
            )
        ],
    )


def _litany_paragraphs(
    html_text: str, first: str, last: str, lang: str
) -> list[BlockOut]:
    paragraphs = top_paragraphs(html_text)
    starts = [i for i, raw in enumerate(paragraphs) if flatten(raw).startswith(first)]
    if len(starts) != 1:
        raise RuntimeError(
            f"{lang}: expected one Litany opening paragraph, found {len(starts)}"
        )
    blocks: list[BlockOut] = []
    for raw in paragraphs[starts[0] :]:
        text = flatten(raw)
        if text:
            blocks.append(BlockOut("prose", text, html=line_html(br_segments(raw))))
        if text.startswith(last):
            return blocks
    raise RuntimeError(f"{lang}: could not locate the Litany closing paragraph")


def build_litany_en(html_text: str) -> Prayer:
    return Prayer(
        0,
        LITANY_SLUG,
        "The Litany of Loreto",
        _litany_paragraphs(html_text, "Lord have mercy.", "Let us pray.", "EN"),
    )


def build_litany_pt(html_text: str) -> Prayer:
    return Prayer(
        0,
        LITANY_SLUG,
        "Ladainha de Nossa Senhora",
        _litany_paragraphs(
            html_text,
            "Senhor, tende piedade de nós",
            "Para que sejamos dignos das promessas de Cristo.",
            "PT",
        ),
    )


# The four Vatican mystery pages have a deliberately regular layout: five
# ``<td width="584">`` cells, each headed by a bold ordinal/title and followed
# by a Scripture meditation paragraph plus the recurring decade-prayer line.
# The latter is captured once as the Rosary's instructions, rather than being
# needlessly repeated in each of twenty items.
_ROSARY_MYSTERY_CELL_RE = re.compile(
    r'<td\s+width="584">(.*?)</td>', re.IGNORECASE | re.DOTALL
)
_ROSARY_MYSTERY_TITLE_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.IGNORECASE | re.DOTALL)
_ROSARY_SCRIPTURE_CITATION_RE = re.compile(r"\s*\(([^()]*)\)([.!])?\s*$")


def split_rosary_meditation_citation(
    text: str, lang: str, filename: str
) -> tuple[str, PrayerCitation]:
    """Split the terminal parenthetical Scripture locator from a Vatican
    meditation. It is a citation, not prose: retaining it in the quotation
    would duplicate it once the reader renders the normal inline footnote.
    """
    match = _ROSARY_SCRIPTURE_CITATION_RE.search(text)
    if match is None or not match.group(1).strip():
        raise RuntimeError(
            f"{lang} {filename}: mystery has no terminal Scripture citation"
        )
    meditation = text[: match.start()].rstrip()
    if match.group(2):
        meditation += match.group(2)
    if not meditation:
        raise RuntimeError(f"{lang} {filename}: empty mystery meditation")
    return meditation, PrayerCitation("1", match.group(1).strip())


def parse_rosary_mystery_page(
    html_text: str, lang: str, expected_filename: str
) -> list[MysteryItem]:
    cells = _ROSARY_MYSTERY_CELL_RE.findall(html_text)
    if len(cells) != 5:
        raise RuntimeError(
            f"{lang} {expected_filename}: expected 5 Rosary mystery cells, found {len(cells)}"
        )
    items: list[MysteryItem] = []
    for cell in cells:
        title_match = _ROSARY_MYSTERY_TITLE_RE.search(cell)
        paragraphs = [flatten(raw) for raw in top_paragraphs(cell) if flatten(raw)]
        if title_match is None or len(paragraphs) < 2:
            raise RuntimeError(
                f"{lang} {expected_filename}: incomplete Rosary mystery cell"
            )
        meditation, citation = split_rosary_meditation_citation(
            paragraphs[0], lang, expected_filename
        )
        items.append(MysteryItem(flatten(title_match.group(1)), meditation, citation))
    return items


def parse_rosary_instructions(html_text: str, lang: str) -> PrayerInstructions:
    heading = "How to pray the Rosary?" if lang == "en" else "Como recitar o Rosário"
    paragraphs = top_paragraphs(html_text)
    matches = [i for i, raw in enumerate(paragraphs) if flatten(raw) == heading]
    if len(matches) != 1:
        raise RuntimeError(
            f"{lang}: expected one Rosary instructions heading, found {len(matches)}"
        )
    # Invocation, then four numbered-source prose paragraphs. The later
    # Our Father/Hail Mary/Glory Be/Hail Holy Queen texts are already
    # independently present in this work, so retain the actual instructions
    # without duplicating those prayer texts on the same page.
    blocks = [
        BlockOut("prose", flatten(raw), html=line_html(br_segments(raw)))
        for raw in paragraphs[matches[0] + 1 :]
        if flatten(raw)
    ]
    if len(blocks) < 5:
        raise RuntimeError(f"{lang}: expected invocation and four Rosary instructions")
    return PrayerInstructions(heading, blocks[:5])


def enrich_rosary_with_full_mysteries(rosary: Prayer, lang: str) -> None:
    paths = rosary_mystery_raw(lang)
    if len(rosary.groups) != 4:
        raise RuntimeError(
            f"{lang}: expected 4 existing Rosary groups, found {len(rosary.groups)}"
        )
    for group, path in zip(rosary.groups, paths, strict=True):
        if not path.exists():
            raise RuntimeError(
                f"{lang}: full Rosary-mystery raw source not found at {path}; "
                "capture it with --fetch-rosary-mysteries before parsing"
            )
        group.items = parse_rosary_mystery_page(
            path.read_text(encoding="cp1252", errors="replace"), lang, path.name
        )
    rosary.instructions = parse_rosary_instructions(
        paths[0].read_text(encoding="cp1252", errors="replace"), lang
    )


# --------------------------------------------------------------------------
# Corrections (docs/decisions.md §Corrections and overrides)
# --------------------------------------------------------------------------


def _block_lines(block: BlockOut) -> list[str]:
    """A block as its printed lines -- one entry when it prints on one."""
    return ihtml.unescape(block.html).split("<br />") if block.html else [block.text]


def _correct_lines(lines: list[str], frm: str, to: str) -> list[str] | None:
    """Apply one correction across a block's printed LINES.

    Corrections are written against the prayer as it reads, so two of the ten
    on file name a phrase the source prints across a line break ("ad
    faciéndam misericórdiam eum / pátribus nostris"). A plain per-line
    replace would silently miss exactly those, which is how the `html` field
    came to disagree with `text` the first time this was written.

    So the match is whitespace-flexible and the REPLACEMENT REUSES THE
    SEPARATORS IT MATCHED: word i of `to` is joined to word i+1 by whatever
    stood between words i and i+1 of `from`, line break included. The
    correction therefore cannot move, add or remove a line break -- it can
    only change the words. That requires the two phrases to have the same
    word count, which every correction on file does (they are single-word
    OCR repairs quoted with enough context to be unambiguous); `None` for
    anything else, so the caller fails loudly rather than guessing.
    """
    words_from, words_to = frm.split(), to.split()
    if len(words_from) != len(words_to):
        return None
    joined = "\n".join(lines)
    pattern = re.compile(r"[ \n]+".join(re.escape(w) for w in words_from))

    def swap(m: re.Match[str]) -> str:
        seps = re.findall(r"[ \n]+", m.group(0))
        out = words_to[0]
        for sep, word in zip(seps, words_to[1:], strict=True):
            out += sep + word
        return out

    fixed, n = pattern.subn(swap, joined)
    return fixed.split("\n") if n else None


def apply_corrections(prayers: list[Prayer], corrections: list[dict]) -> list[dict]:
    """Apply each correction to the single Latin block of the named prayer
    that contains its `from` text verbatim. Fails loudly (drift guard) if
    the text isn't found in exactly one block -- either it was already
    fixed, the source changed, or the locator is wrong; silently doing
    nothing in any of those cases would be worse than crashing."""
    by_slug = {p.slug: p for p in prayers}
    applied = []
    for c in corrections:
        slug = c["locator"]["prayer"]
        prayer = by_slug.get(slug)
        if prayer is None or prayer.latin is None:
            raise RuntimeError(
                f"correction {c['id']}: prayer {slug!r} has no Latin text"
            )
        matches = [b for b in prayer.latin.blocks if c["from"] in b.text]
        if len(matches) != 1:
            raise RuntimeError(
                f"correction {c['id']}: expected exactly 1 block containing "
                f"{c['from']!r} in {slug}'s Latin text, found {len(matches)} "
                "(drift guard -- source text no longer matches the correction)"
            )
        block = matches[0]
        block.text = block.text.replace(c["from"], c["to"])
        # `html` carries the same words with the source's line breaks kept
        # (`line_html`), so it needs the same fix -- and needs it to land, or
        # the two fields disagree about what the prayer says. Silently
        # correcting one of them is worse than not correcting either.
        if block.html:
            fixed = _correct_lines(_block_lines(block), c["from"], c["to"])
            if fixed is None:
                raise RuntimeError(
                    f"correction {c['id']}: applied to {slug}'s text but not to "
                    "its line markup (drift guard -- see _correct_lines)"
                )
            block.html = line_html(fixed)
        applied.append(c)
    return applied


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------

_MOJIBAKE_PATTERNS = ["Ã©", "Ã§", "â€™", "â€", "Ã³", "Â"]


def collect_texts(p: Prayer) -> list[str]:
    texts = [p.title]
    for b in p.blocks:
        texts.append(b.text)
    for v in p.variants:
        for b in v.blocks:
            texts.append(b.text)
    if p.latin:
        texts.append(p.latin.title)
        for b in p.latin.blocks:
            texts.append(b.text)
    for g in p.groups:
        texts.append(g.name)
        if g.rubric:
            texts.append(g.rubric)
        for item in g.items:
            texts.extend((item.title, item.meditation))
    if p.instructions:
        texts.append(p.instructions.title)
        texts.extend(block.text for block in p.instructions.blocks)
    return texts


def validate(en: list[Prayer], pt: list[Prayer]) -> tuple[bool, list[str]]:
    problems: list[str] = []

    if len(en) != len(SLUGS):
        problems.append(f"EN: expected {len(SLUGS)} prayers, got {len(en)}")
    if len(pt) != len(SLUGS):
        problems.append(f"PT: expected {len(SLUGS)} prayers, got {len(pt)}")

    en_slugs = [p.slug for p in en]
    pt_slugs = [p.slug for p in pt]
    if set(en_slugs) != set(SLUGS):
        problems.append(f"EN slug set mismatch: {set(en_slugs) ^ set(SLUGS)}")
    if set(pt_slugs) != set(SLUGS):
        problems.append(f"PT slug set mismatch: {set(pt_slugs) ^ set(SLUGS)}")
    # The free QA oracle (CLAUDE.md): a work published in two languages
    # must expose the same address space in both. Slugs are assigned
    # positionally from one shared list, so this is a real check on
    # whether both languages actually produced 24 rows/chunks each, not
    # a tautology -- a parser bug that silently dropped or duplicated a
    # row would desync the two lists' lengths/order and be caught here.
    if en_slugs != pt_slugs:
        problems.append(
            "EN and PT slug ORDER differs (should be identical by construction)"
        )

    en_by_slug = {p.slug: p for p in en}
    pt_by_slug = {p.slug: p for p in pt}

    en_latin_missing = {s for s, p in en_by_slug.items() if p.latin is None}
    pt_latin_missing = {s for s, p in pt_by_slug.items() if p.latin is None}
    if en_latin_missing != NO_LATIN_SLUGS:
        problems.append(f"EN: Latin missing for unexpected slugs: {en_latin_missing}")
    if pt_latin_missing != NO_LATIN_SLUGS:
        problems.append(f"PT: Latin missing for unexpected slugs: {pt_latin_missing}")

    for lang, prayers in (("EN", en), ("PT", pt)):
        for p in prayers:
            if not p.title.strip():
                problems.append(f"{lang} {p.slug}: empty title")
            if not p.blocks and not p.groups and not p.variants:
                problems.append(
                    f"{lang} {p.slug}: no content blocks, groups, or variants"
                )
            if p.slug == "rosary" and len(p.groups) != 4:
                problems.append(
                    f"{lang} rosary: expected 4 mystery groups, got {len(p.groups)}"
                )
            if p.slug == "rosary" and p.instructions is None:
                problems.append(f"{lang} rosary: missing sourced instructions")
            for g in p.groups:
                if len(g.items) != 5:
                    problems.append(
                        f"{lang} {p.slug}: mystery group {g.name!r} has {len(g.items)} items, expected 5"
                    )
                for item in g.items:
                    if not item.title or not item.meditation or item.citation is None:
                        problems.append(
                            f"{lang} {p.slug}: incomplete mystery in {g.name!r}"
                        )
            for text in collect_texts(p):
                if "<" in text or ">" in text:
                    problems.append(
                        f"{lang} {p.slug}: leftover markup in {text[:60]!r}"
                    )
                if "�" in text:
                    problems.append(f"{lang} {p.slug}: replacement character present")
                for pat in _MOJIBAKE_PATTERNS:
                    if pat in text:
                        problems.append(f"{lang} {p.slug}: mojibake pattern {pat!r}")
                if "  " in text:
                    problems.append(f"{lang} {p.slug}: double space in {text[:60]!r}")

    return (len(problems) == 0), problems


# --------------------------------------------------------------------------
# structure.json -- generic node schema, used purely for grouping (per
# docs/corpus-schema.md: `paragraphs: [null, null]` throughout, since this
# appendix has no numbered units to span).
# --------------------------------------------------------------------------

# The grouping itself is EDITORIAL, not from the source. The Compendium's
# appendix has exactly two parts ("A. Common Prayers", "B. Formulas of
# Catholic Doctrine") and prints no thematic headings within Part A; these
# seven are ours, chosen so 28 prayers read as a browsable list instead of a
# flat run. Kept here, in the generator, so a re-parse reproduces them and
# nothing hand-written has to survive one.
#
# Titles are therefore OURS TO TRANSLATE — there is no source wording to be
# faithful to. Each group carries one title per language; a language missing
# from the mapping falls back to the English so a new language never renders
# an empty heading.
STRUCTURE_GROUPS = [
    (
        {
            "en": "Creeds and the Lord's Prayer",
            "pt": "Credos e o Pai-Nosso",
            "la": "Symbola et Oratio Dominica",
        },
        ["apostles-creed", "nicene-creed", "our-father"],
    ),
    (
        {
            "en": "Basic Prayers",
            "pt": "Ora\u00e7\u00f5es fundamentais",
            "la": "Orationes fundamentales",
        },
        ["sign-of-the-cross", "glory-be", "hail-mary", "angel-of-god", "eternal-rest"],
    ),
    (
        {
            "en": "Marian and Devotional Prayers",
            "pt": "Ora\u00e7\u00f5es marianas e devocionais",
            "la": "Orationes marianae et devotionales",
        },
        [
            "angelus",
            "regina-caeli",
            "hail-holy-queen",
            "magnificat",
            "sub-tuum-praesidium",
            "benedictus",
            "te-deum",
            "veni-creator-spiritus",
            "veni-sancte-spiritus",
            "anima-christi",
            "memorare",
        ],
    ),
    (
        {"en": "The Rosary", "pt": "O Ros\u00e1rio", "la": "Rosarium"},
        ["rosary"],
    ),
    (
        {
            "en": "Prayers of the Eastern Churches",
            "pt": "Ora\u00e7\u00f5es das Igrejas orientais",
            "la": "Orationes Ecclesiarum Orientalium",
        },
        [
            "coptic-incense-prayer",
            "syro-maronite-farewell-to-the-altar",
            "byzantine-prayer-for-the-deceased",
        ],
    ),
    (
        {
            "en": "Acts of Faith, Hope, Love and Contrition",
            "pt": "Atos de f\u00e9, esperan\u00e7a, caridade e contri\u00e7\u00e3o",
            "la": "Actus fidei, spei, caritatis et contritionis",
        },
        ["act-of-faith", "act-of-hope", "act-of-love", "act-of-contrition"],
    ),
    (
        {"en": "Litanies", "pt": "Ladainhas", "la": "Litaniae"},
        [LITANY_SLUG],
    ),
]


def build_structure(prayers: list[Prayer], lang: str) -> list[dict]:
    """The work's lightweight table of contents -- grouping only, never an
    address (`paragraphs` is `[null, null]` throughout, docs/corpus-schema.md).

    A GROUP LISTS ONLY THE PRAYERS THIS EDITION ACTUALLY HAS, and an edition
    that has none of a group's prayers does not get an empty heading for it.
    That is `prayer.common.la`: the two Creeds, the Our Father, the three
    Eastern prayers and the Litany of Loreto are printed with no Latin
    companion anywhere in the source, so the Latin edition genuinely has
    nothing under "Symbola et Oratio Dominica" and says so by not printing
    the heading. The vernacular editions carry every slug and so are
    unaffected -- this is not a filter they pass through, it is a filter that
    never fires for them.
    """
    by_slug = {p.slug: p for p in prayers}
    nodes = []
    for titles, slugs in STRUCTURE_GROUPS:
        children = [
            {
                "kind": "sub",
                "title": by_slug[s].title,
                "paragraphs": [None, None],
                "children": [],
            }
            for s in slugs
            if s in by_slug
        ]
        if not children:
            continue
        nodes.append(
            {
                "kind": "section",
                "title": titles.get(lang, titles["en"]),
                "paragraphs": [None, None],
                "children": children,
            }
        )
    return nodes


# --------------------------------------------------------------------------
# The English collection and its regional edition -- `prayer.common.en` and
# `prayer.common.en-gb`
# --------------------------------------------------------------------------
#
# THE UK/USA SPLIT IS AN EDITION BOUNDARY, NOT A FIELD ON A PRAYER. The source
# prints one English appendix in which five prayers appear twice, under the
# headings "UK VERSION" and "USA VERSION". That was captured as a `variants`
# array -- a concept used by those five prayers, in that one language, and by
# nothing else in this corpus -- and it made the reader choose between two
# boxed, equally-labelled wordings before they could read a word, on five
# pages, every time. Expressed as editions the reader picks once, the choice
# persists through the same stored preference every other work uses, compare
# mode can put the two side by side, and `variants` leaves the schema rather
# than being carried for five entries.
#
# THE TWO EDITIONS ARE NOT PEERS. `prayer.common.en` is the collection: all 28
# prayers, printing the USA wording of the five. `prayer.common.en-gb` is
# those five and nothing else. A reader who prefers English (UK) therefore
# reads five prayers from it and twenty-three from `prayer.common.en`,
# resolved per address the way a citation to the Summa's Supplementum reaches
# English for a Latin-preferring reader (docs/decisions.md, 2026-08-23).
#
# THAT IS A REVERSAL of the shape this file shipped with hours earlier, and
# the reasoning it reverses is worth keeping because it was not wrong so much
# as aimed at the wrong object. Both editions briefly carried all 28
# (`prayer.common.en-us` alongside `prayer.common.en-gb`), on the grounds that
# a reader choosing an edition is choosing a book rather than a patch, and
# that the content-language fallback exists for content that is ABSENT rather
# than content that exists and happens to match. What that misses is that the
# 23 shared prayers are not two editions agreeing -- they are ONE text,
# printed once, under one heading, which the source does not regionalize at
# all. Duplicating it put two rows reading "English" in the picker that differ
# in five of twenty-eight entries, and made every reader choose between them
# to read the Our Father. A sparse edition says what the source says: there is
# an English collection, and there is a UK wording of five of its prayers.
#
# WHICH WORDING IS UNMARKED IS AN EDITORIAL CHOICE, and it is USA. The source
# heads the two as equals; the collection has to print one of them, because
# there is one `prayer.common.en` and it is what every reader who has not
# asked for otherwise gets. It is stated here rather than falling out of
# `_VARIANT_MARKERS` order, which is where it would otherwise have been
# decided.
#
# THE LATIN EDITION IS DERIVED FROM THE UNSPLIT PARSE, not from either of
# these. Latin is a field on the same array entry regardless of region --
# there is one Latin column on the page -- so deriving it from a resolved
# edition would imply a distinction the source does not make.

#: The wording `prayer.common.en` prints where the source prints two. The
#: label is the source's own printed heading (`_VARIANT_MARKERS`), so this is
#: a choice between two things the source states, not a naming of our own.
BASE_VARIANT = "USA"

#: The regional edition: the other wording, and only the prayers that have one.
REGIONAL_WORK_ID = "prayer.common.en-gb"
REGIONAL_VARIANT = "UK"
REGIONAL_LANGUAGE = "en-GB"
REGIONAL_TITLE = "Common Prayers (UK)"


def resolve_variant(prayer: Prayer, label: str) -> Prayer:
    """One prayer as an edition prints it: the named wording, then whatever
    the source prints after every wording.

    A variant-bearing prayer's own `blocks` is either empty -- the whole
    prayer differs by region (Hail Holy Queen, the Magnificat, the Benedictus,
    the Te Deum) -- or a shared tail the source prints once after both
    (Regina Caeli's closing collect, "Let us pray; ..."). Either way the
    edition's text is "this region's wording, then the shared remainder", in
    that order, which is the order the page itself reads in.

    A prayer with no variants passes through untouched, which is 23 of the 28.
    """
    if not prayer.variants:
        return prayer
    chosen = next((v for v in prayer.variants if v.label == label), None)
    if chosen is None:
        raise RuntimeError(
            f"{prayer.slug}: no {label!r} wording among "
            f"{[v.label for v in prayer.variants]!r} (drift guard)"
        )
    return replace(prayer, blocks=[*chosen.blocks, *prayer.blocks], variants=[])


def build_base_edition(prayers: list[Prayer]) -> list[Prayer]:
    """`prayer.common.en`: every prayer, the USA wording where there are two."""
    return [resolve_variant(p, BASE_VARIANT) for p in prayers]


def build_regional_edition(prayers: list[Prayer]) -> list[Prayer]:
    """`prayer.common.en-gb`: the prayers the source gives a UK wording, and no
    others.

    RENUMBERED FROM 1, like `prayer.common.la`. `n` is print order WITHIN an
    edition, and carrying 10, 11, 12, 14, 15 over from the collection would
    present this as an edition with gaps in it rather than a five-entry one.
    Nothing addresses through `n` -- what identifies a prayer across editions
    is the slug (docs/corpus-schema.md "Prayers") -- so renumbering costs no
    reference.
    """
    chosen = [resolve_variant(p, REGIONAL_VARIANT) for p in prayers if p.variants]
    return [replace(p, n=n) for n, p in enumerate(chosen, start=1)]


def build_regional_manifest(
    prayers: list[Prayer], applied_corrections: list[dict]
) -> dict:
    """The regional edition's manifest.

    Every field but the identifying five and the notes is `prayer.common.en`'s,
    and that is the point rather than an economy: the two works are one parse
    of one page, so their sources, copyright and corrections cannot honestly
    differ. The notes are rewritten rather than appended to, because the base
    manifest's own notes count prayers against the whole collection and would
    read as "5/28 carry Latin" here.
    """
    base = build_manifest("en", prayers, applied_corrections, [p.slug for p in prayers])
    slugs = ", ".join(p.slug for p in prayers)
    return {
        **base,
        "id": REGIONAL_WORK_ID,
        "title": REGIONAL_TITLE,
        "short_title": REGIONAL_TITLE,
        "language": REGIONAL_LANGUAGE,
        "edition": f"{base['edition']} -- {REGIONAL_VARIANT} wording",
        "notes": (
            f"A REGIONAL EDITION, NOT A SECOND COLLECTION. The English source "
            f"prints one appendix in which {len(prayers)} prayers ({slugs}) appear "
            f'twice, headed "UK VERSION" and "USA VERSION". prayer.common.en is '
            f"the collection and prints the {BASE_VARIANT} wording of those "
            f"{len(prayers)}; this work is the {REGIONAL_VARIANT} wording of the "
            f"same {len(prayers)} and nothing else. A reader who prefers it reads "
            f"these here and the other {len(SLUGS) - len(prayers)} from "
            "prayer.common.en, resolved per address. Sources, copyright and "
            "corrections are identical to prayer.common.en's because the two are "
            "one parse of one page. See docs/decisions.md, 2026-08-25, for why "
            "this is sparse rather than a second whole book."
        ),
    }


# --------------------------------------------------------------------------
# The Latin edition -- `prayer.common.la`
# --------------------------------------------------------------------------
#
# LATIN IS AN EDITION, NOT A FIELD, AND THIS IS WHERE THE EDITION IS BUILT.
# It supersedes the schema's original "Latin is a field, not an edition"
# ruling (docs/corpus-schema.md §Prayers, reversed in docs/decisions.md):
# every other work in this corpus reaches a Latin-preferring reader as a work
# -- `bible.clementina.la`, `summa.la` -- and prayers were the one place where
# setting Latin as the content language silently returned English instead,
# because there was no `prayer.common.la` for `CONTENT_LANG_FALLBACK` to
# resolve to. The per-prayer `latin` field STAYS exactly as it is: it is what
# the source prints, it is what this edition is derived from, and it is what
# a reader comparing a prayer with its bound Latin companion is looking at.
#
# THERE ARE TWO WITNESSES TO THIS TEXT AND THEY ARE NOT IDENTICAL. The Latin
# is printed twice on vatican.va -- once in the English Compendium appendix
# and once in the Portuguese -- and the two transcriptions differ. Measured
# over all 21 prayers that carry Latin in both:
#
#   * 20 of 21 are WORD-IDENTICAL once ligatures, stress accents and
#     punctuation are folded away. The Rosary is the sole exception.
#   * The EN witness carries exactly ONE malformed character in the whole
#     edition (`sæ´cula`, an `&aelig;&acute;` that never composed); the PT
#     witness carries 14 grave-for-acute letters (13 `ò`, 1 `À`) across
#     benedictus, te-deum, veni-creator-spiritus and magnificat.
#   * Where they differ in LETTERS -- the Rosary alone -- EN is both fuller
#     and better spelled: PT drops the "Mystéria luminósa" heading entirely
#     and prints `Tempio` for `Templo`, `Dorninica` for `Dominica` (an rn/m
#     slip) and `coniúcta` for `coniúncta`.
#   * But the PT witness SEGMENTS BETTER in two prayers: it breaks Veni
#     Creator Spiritus into its 7 stanzas and Veni Sancte Spiritus into its
#     9, where EN runs each into a single undivided block. EN segments
#     better in three (angelus 11/1, regina-caeli 5/1, rosary 12/9).
#
# So the edition takes EN'S TEXT AND THE FINER OF THE TWO SEGMENTATIONS. That
# is the whole rule, and it is deliberately mechanical rather than a reading:
# every character of the output comes from one witness, chosen once and
# stated, while the other witness contributes only WHERE THE BREAKS FALL --
# information EN does not carry and cannot be wrong about. Nothing is
# reconciled character by character, nothing is re-accented to taste, and no
# word is emitted that neither page printed. `_resegment` asserts that the
# re-cut pieces rejoin to exactly the EN text they were cut from, so a
# transplant that does not fit is refused rather than approximated.
#
# THE ONE EN DEFECT IS A CORRECTION, NOT A MERGE. `sæ´cula` is fixed in
# pipeline/corrections/prayer.common.en.json, against the source HTML, with
# the PT witness cited as the evidence for what was meant -- the ordinary
# path for a source defect with a known correct value (docs/decisions.md
# §Corrections and overrides). Fixing it there rather than here keeps
# this function a pure selection over already-parsed text, and fixes the EN
# edition's own `latin` field at the same time.

LATIN_WORK_ID = "prayer.common.la"
LATIN_TITLE = "Orationes Communes"

# The witness whose TEXT the edition prints. See the section docblock.
LATIN_BASE_LANG = "en"
LATIN_SEGMENTATION_LANG = "pt"


def _fold_stream(text: str) -> list[tuple[int, str]]:
    """Every significant character of `text` as `(offset, folded)` pairs.

    Significant means letters and digits; accents, ligature spelling,
    punctuation, case and whitespace are all folded away, because those are
    exactly the axes the two witnesses disagree on and none of them moves a
    block boundary. A ligature folds to two entries sharing one offset, so
    `æ` in one witness still lines up with `ae` in the other.
    """
    out: list[tuple[int, str]] = []
    for i, ch in enumerate(text):
        for folded in unicodedata.normalize("NFKD", ch.lower()):
            if unicodedata.combining(folded):
                continue
            if folded in ("æ", "œ"):
                folded = "ae" if folded == "æ" else "oe"
            for c in folded:
                if c.isalnum():
                    out.append((i, c))
    return out


def _resegment(base: list[BlockOut], donor: list[BlockOut]) -> list[BlockOut] | None:
    """Regroup `base`'s printed LINES into `donor`'s blocks, or `None`.

    Works at line granularity rather than by cutting strings, because a line
    is the finest thing either witness actually prints and a stanza break can
    only ever fall between two of them. A donor boundary that would land
    mid-line is a boundary the base witness does not have, and it returns
    `None` rather than approximating -- the caller then keeps the base
    witness's own segmentation.

    Every line of the output is a line of the input, so no character is
    rewritten, reordered or dropped; the assert below states exactly that.
    """
    lines = [line for block in base for line in _block_lines(block)]
    wanted = [[c for _, c in _fold_stream(line)] for line in lines]

    out: list[BlockOut] = []
    i = 0
    for group in donor:
        target = [c for _, c in _fold_stream(" ".join(_block_lines(group)))]
        taken: list[str] = []
        folded: list[str] = []
        while i < len(lines) and len(folded) < len(target):
            folded += wanted[i]
            taken.append(lines[i])
            i += 1
        if folded != target:
            return None
        out.append(BlockOut("prose", " ".join(taken).strip(), html=line_html(taken)))
    if i != len(lines):
        return None

    assert [line for block in out for line in _block_lines(block)] == lines, (
        "resegmentation lost or duplicated a line"
    )
    return out


def build_latin_edition(
    en: list[Prayer], pt: list[Prayer]
) -> tuple[list[Prayer], list[dict]]:
    """`prayer.common.la`, derived from both witnesses -- see the docblock.

    The report returned alongside is the audit trail: one row per prayer
    saying which witness supplied the text, which supplied the breaks, and
    whether the two disagreed about anything but orthography. It is written
    into the work as `witnesses.json` so the choice is inspectable without
    re-running this.
    """
    by_slug_pt = {p.slug: p for p in pt}
    out: list[Prayer] = []
    report: list[dict] = []

    for source in en:
        latin = source.latin
        if latin is None:
            continue
        other = by_slug_pt.get(source.slug)
        donor = other.latin if other else None

        blocks = list(latin.blocks)
        segmentation = LATIN_BASE_LANG
        divergence: str | None = None

        if donor is not None:
            base_chars = [
                c for _, c in _fold_stream(" ".join(b.text for b in latin.blocks))
            ]
            donor_chars = [
                c for _, c in _fold_stream(" ".join(b.text for b in donor.blocks))
            ]
            if base_chars != donor_chars:
                # Recorded, never reconciled: the witnesses disagree about
                # the words themselves, and the base witness is the edition.
                divergence = "witnesses differ in letters, not only in orthography"
            elif len(donor.blocks) > len(blocks):
                recut = _resegment(latin.blocks, donor.blocks)
                if recut is not None:
                    blocks = recut
                    segmentation = LATIN_SEGMENTATION_LANG

        out.append(
            Prayer(
                n=len(out) + 1,
                slug=source.slug,
                title=latin.title,
                blocks=blocks,
            )
        )
        report.append(
            {
                "slug": source.slug,
                "text_from": LATIN_BASE_LANG,
                "segmentation_from": segmentation,
                "blocks": len(blocks),
                "blocks_en": len(latin.blocks),
                "blocks_pt": len(donor.blocks) if donor else None,
                "divergence": divergence,
            }
        )
    return out, report


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------

LANG_CONFIG = {
    "en": {
        "raw_path": EN_RAW,
        "url": EN_URL,
        "work_id": "prayer.common.en",
        "title": "Common Prayers",
        "short_title": "Common Prayers",
        "builder": build_prayers_en,
    },
    "pt": {
        "raw_path": PT_RAW,
        "url": PT_URL,
        "work_id": "prayer.common.pt",
        "title": "Orações Comuns",
        "short_title": "Orações Comuns",
        "builder": build_prayers_pt,
    },
}


def build_manifest(
    lang: str,
    prayers: list[Prayer],
    applied_corrections: list[dict],
    varied: list[str] | None = None,
) -> dict:
    """`varied` is the slugs the source prints in two regional wordings, which
    only the English page does. It is passed in rather than recovered from
    `prayers` because by the time a manifest is written the wording has already
    been resolved into one edition or the other and no `variants` array
    survives -- see `build_base_edition`."""
    cfg = LANG_CONFIG[lang]
    n_with_latin = sum(1 for p in prayers if p.latin)
    varied = varied or []
    notes = [
        (
            'The 24 Appendix A ("Common Prayers") entries are sourced from the '
            "same Compendium of the CCC (2005) page already parsed into compendium."
            f"{lang}; the Apostles' Creed, Nicene Creed, and Our Father are "
            "re-parsed from the already-cached Catechism HTML with zero new "
            'network fetches. Appendix B ("Formulas of Catholic Doctrine") is '
            "adjacent in the same source but is not prayers (short catechetical "
            "enumerations -- virtues, precepts, capital sins, ...); deliberately "
            "out of scope here, same as it remains for compendium." + lang + "."
        ),
        (
            "The Litany of Loreto is sourced from the English and Portuguese "
            "Vatican Holy Rosary micro-site pages, captured sequentially with "
            "the two-second crawl delay. Those pages show no visible copyright "
            "notice; their HTML metadata names the Dicastery for Communication "
            "as publisher, so the project's existing Vatican/LEV copyright "
            "posture applies rather than treating the absent notice as a licence."
        ),
        (
            f"{n_with_latin}/{len(SLUGS)} prayers carry an optional `latin` field. "
            "The three CCC prayers (the Apostles' Creed, Nicene Creed, and Our "
            "Father) are sourced from pages that do not print a Latin companion; "
            "the Coptic, Syro-Maronite, and Byzantine prayers likewise have none "
            "in either Compendium language. Latin is a per-prayer field AND, "
            "since 2026-08-25, an edition: `prayer.common.la` is derived from "
            "these fields and does not replace them -- the field is what the "
            "source prints (a companion bound to the vernacular text, same "
            "page, same cell), the edition is what a Latin-preferring reader "
            "resolves to. See docs/decisions.md for the reversal of the "
            "original field-not-edition ruling."
        ),
        (
            (
                f"{len(varied)} prayers ({', '.join(varied)}) are printed twice "
                'in the English source, headed "UK VERSION" and "USA VERSION". '
                f"This edition prints the {BASE_VARIANT} wording of each; the "
                f"{REGIONAL_VARIANT} wording of the same {len(varied)} is "
                f"{REGIONAL_WORK_ID}, a regional edition of those prayers alone. "
                "There is no `variants` field: the split is an edition boundary "
                "(docs/decisions.md, 2026-08-25)."
            )
            if lang == "en"
            else (
                "The Portuguese source prints one wording throughout, so the "
                "regional split the English appendix carries -- a UK and a USA "
                f"wording of five prayers, separated as {REGIONAL_WORK_ID} -- has "
                "no counterpart here."
            )
        ),
        (
            "The Angelus (both languages), and PT's Regina Caeli and Rosary "
            "closing dialogue (EN prints these without versicle/response "
            "markup at all -- a real difference in how each source page "
            "typesets the same prayer, not an asymmetry to paper over), use "
            "`versicle`/`response` block kinds -- a schema extension beyond "
            "the CCC's `prose`/`quote` pair, documented in "
            'docs/corpus-schema.md. PT labels these lines "D."/"C." where '
            'EN and PT\'s own Angelus use "V."/"R."; the verbatim printed '
            "prefix is kept on each block's `label` field rather than "
            "normalized away."
        ),
        (
            "The Rosary is the one entry with a `groups` array and "
            "`instructions`: its four named mystery groups retain the "
            "Compendium's weekday rubrics, while each of the twenty items "
            "carries the full Scripture meditation printed in Vatican's "
            "Holy Rosary mystery pages. Those pages also supply the opening "
            "invocation and decade-by-decade directions."
        ),
    ]
    if lang == "pt":
        notes.append(
            "PT's Latin block (the trailing sequential pass -- see module "
            "docstring) is a materially rougher transcription than EN's "
            "Latin column of the same universal texts: beyond the 9 "
            "corrected word-level defects (see below), a much larger "
            "number of words differ from EN's parallel by stress-accent "
            "mark alone (missing entirely, e.g. 'Dominus' for 'Dóminus'; "
            "or grave for acute, e.g. 'Dòminus'/'sǽcula' for 'Dóminus'/"
            "'sæcula') -- diffed word-by-word against EN's Latin for every "
            "prayer while writing this scraper. These are captured "
            "verbatim, not silently re-accented to match EN: unlike the "
            "9 corrected defects, an absent or swapped accent mark "
            "doesn't produce a wrong or nonexistent word, so there's no "
            "single unambiguous corrected form to assert without drifting "
            "from the store-raw principle into modernizing PT's own "
            "orthographic choices. A known, deliberate v1 loss -- the "
            "same posture docs/corpus-schema.md already takes for CCC "
            "inline emphasis -- recorded here rather than fixed."
        )
    if applied_corrections:
        notes.append(
            f"{len(applied_corrections)} correction(s) applied from "
            f"pipeline/corrections/{cfg['work_id']}.json -- see "
            "corrections-applied.json for the receipt."
        )
    return {
        "id": cfg["work_id"],
        "type": "prayer",
        "title": cfg["title"],
        "short_title": cfg["short_title"],
        "language": lang,
        "edition": "Compendium of the CCC (2005) Appendix A + Catechism texts and Vatican Rosary pages",
        "sources": [
            {"url": cfg["url"], "retrieved_at": RETRIEVED_AT},
            {
                "url": CCC_EN_CREDO_URL if lang == "en" else CCC_PT_CREDO_URL,
                "retrieved_at": CCC_RETRIEVED_AT,
            },
            {
                "url": CCC_EN_OUR_FATHER_URL if lang == "en" else CCC_PT_OUR_FATHER_URL,
                "retrieved_at": CCC_RETRIEVED_AT,
            },
            {
                "url": LITANY_EN_URL if lang == "en" else LITANY_PT_URL,
                "retrieved_at": LITANY_RETRIEVED_AT,
            },
            *[
                {"url": url, "retrieved_at": ROSARY_MYSTERIES_RETRIEVED_AT}
                for url in ROSARY_MYSTERY_URLS["en" if lang == "en" else "po"]
            ],
        ],
        "copyright": {
            "status": "copyrighted",
            "holder": COPYRIGHT_HOLDER,
            "notice": COPYRIGHT_NOTICE,
        },
        "notes": " ".join(notes),
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "corrections_applied": len(applied_corrections),
    }


def write_outputs(
    lang: str,
    prayers: list[Prayer],
    applied_corrections: list[dict],
    varied: list[str] | None = None,
) -> None:
    cfg = LANG_CONFIG[lang]
    out_dir = WORKS_ROOT / cfg["work_id"]
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest = build_manifest(lang, prayers, applied_corrections, varied)
    structure = build_structure(prayers, lang)
    prayers_json = [p.to_dict() for p in prayers]

    files: dict[str, object] = {
        "manifest.json": manifest,
        "structure.json": structure,
        "prayers.json": prayers_json,
    }
    # Written only when there are corrections, so its absence means "nothing
    # needed fixing" rather than "the receipt was not produced".
    if applied_corrections:
        files["corrections-applied.json"] = applied_corrections
    write_stamped_json(
        out_dir,
        files,
        manifest["generated_at"],
        remove=() if applied_corrections else ("corrections-applied.json",),
    )


def build_latin_manifest(prayers: list[Prayer], report: list[dict]) -> dict:
    """`prayer.common.la`'s manifest.

    ITS `sources` ARE BOTH COMPENDIUM PAGES, and that is the honest listing
    rather than a tidy one. The Latin printed here was transcribed from the
    English page; the Portuguese page is what says where five of these
    prayers break into stanzas. Both pages are load-bearing for what this
    file contains, so both are cited -- provenance is a URL a reader can
    check, and citing only one of them would make the other's contribution
    unattributable.
    """
    resegmented = [
        r["slug"] for r in report if r["segmentation_from"] != LATIN_BASE_LANG
    ]
    diverged = [r["slug"] for r in report if r["divergence"]]
    return {
        "id": LATIN_WORK_ID,
        "type": "prayer",
        "title": LATIN_TITLE,
        "short_title": LATIN_TITLE,
        "language": "la",
        "edition": "Compendium of the CCC (2005) Appendix A, Latin columns",
        "sources": [
            {"url": EN_URL, "retrieved_at": RETRIEVED_AT},
            {"url": PT_URL, "retrieved_at": RETRIEVED_AT},
        ],
        "copyright": {
            "status": "copyrighted",
            "holder": COPYRIGHT_HOLDER,
            "notice": COPYRIGHT_NOTICE,
        },
        "notes": " ".join(
            [
                (
                    f"Derived, not separately scraped: the {len(prayers)} prayers the "
                    "Compendium of the CCC prints with a Latin companion, lifted out "
                    "of the `latin` field the two vernacular editions already carry. "
                    "The other 7 entries of those editions (the Apostles' and Nicene "
                    "Creeds, the Our Father, the three Eastern prayers and the Litany "
                    "of Loreto) are printed with no Latin anywhere in the source and "
                    "so are absent here -- a property of the source, not a gap to "
                    "fill. The per-prayer `latin` field remains in both vernacular "
                    "editions: it is what the source prints and what this edition is "
                    "derived from."
                ),
                (
                    "TWO WITNESSES, ONE TEXT. The Latin appears twice on vatican.va, "
                    "once in each vernacular Compendium page, and the two "
                    "transcriptions differ. The text here is the ENGLISH page's "
                    "throughout: it carries one malformed character in the whole "
                    "edition against the Portuguese page's 14 grave-for-acute "
                    "letters, and where the two disagree in letters rather than "
                    "orthography -- the Rosary alone -- it is both fuller (the "
                    "Portuguese drops the Myst\u00e9ria lumin\u00f3sa heading) and "
                    "better spelled. Every other character-level difference between "
                    "the two is an accent or a ligature, and 20 of the 21 prayers are "
                    "word-identical once those are folded away."
                ),
                (
                    "WHAT THE PORTUGUESE WITNESS CONTRIBUTES IS WHERE THE BREAKS "
                    f"FALL. {len(resegmented)} prayers ({', '.join(resegmented)}) are "
                    "printed there as separate stanzas and in the English page as one "
                    "undivided block; the English text is re-cut at those boundaries, "
                    "checked to rejoin exactly. No character of this edition comes "
                    "from the Portuguese page."
                    + (
                        f" {len(diverged)} prayer(s) ({', '.join(diverged)}) where the "
                        "witnesses disagree about the words themselves keep the "
                        "English reading and the English segmentation."
                        if diverged
                        else ""
                    )
                ),
                (
                    "See witnesses.json for the per-prayer audit trail, and "
                    "docs/decisions.md for the reversal of the schema's original "
                    '"Latin is a field, not an edition" ruling.'
                ),
            ]
        ),
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "corrections_applied": 0,
    }


def write_latin_outputs(prayers: list[Prayer], report: list[dict]) -> None:
    out_dir = WORKS_ROOT / LATIN_WORK_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = build_latin_manifest(prayers, report)
    write_stamped_json(
        out_dir,
        {
            "manifest.json": manifest,
            "structure.json": build_structure(prayers, "la"),
            "prayers.json": [p.to_dict() for p in prayers],
            "witnesses.json": report,
        },
        manifest["generated_at"],
    )


def validate_latin(
    latin: list[Prayer], en: list[Prayer], pt: list[Prayer]
) -> tuple[bool, list[str]]:
    """Per-edition invariants for the derived work.

    The cross-language oracle CLAUDE.md describes does not apply as written:
    this edition covers a strict subset of the vernacular slug set by
    construction, so equal slug sets would be the wrong thing to assert. What
    IS assertable, and is what these checks are, is that the derivation lost
    nothing -- every prayer with a Latin companion reached the edition, and
    every character of it still folds to what the English witness printed.
    """
    problems: list[str] = []
    expected = [p.slug for p in en if p.latin]
    got = [p.slug for p in latin]
    if got != expected:
        problems.append(f"slug set/order drifted: {got} != {expected}")

    en_by_slug = {p.slug: p for p in en}
    for prayer in latin:
        source = en_by_slug[prayer.slug].latin
        assert source is not None
        want = [c for _, c in _fold_stream(" ".join(b.text for b in source.blocks))]
        have = [c for _, c in _fold_stream(" ".join(b.text for b in prayer.blocks))]
        if want != have:
            problems.append(f"{prayer.slug}: text differs from the EN witness")
        if any(not b.text.strip() for b in prayer.blocks):
            problems.append(f"{prayer.slug}: empty block")

    pt_slugs = {p.slug for p in pt if p.latin}
    missing = [s for s in got if s not in pt_slugs]
    if missing:
        # Not a failure: a prayer only one page prints Latin for is legitimate.
        # Reported so it is never a silent asymmetry.
        problems.append(f"note: Latin printed only in EN for {missing}")
    return not [p for p in problems if not p.startswith("note:")], problems


def print_summary(
    lang: str, prayers: list[Prayer], ok: bool, problems: list[str]
) -> None:
    n_with_latin = sum(1 for p in prayers if p.latin)
    n_varied = sum(1 for p in prayers if p.variants)
    n_dialogic = sum(1 for p in prayers if p.kind == "dialogic")
    n_group = sum(1 for p in prayers if p.kind == "group")
    print(f"\n=== {lang.upper()} summary ===")
    print(f"prayers captured: {len(prayers)}")
    print(f"prayers with Latin: {n_with_latin}/{len(prayers)}")
    print(f"prayers the source prints twice (UK/USA): {n_varied}")
    print(
        f"kind counts: simple={len(prayers) - n_dialogic - n_group} dialogic={n_dialogic} group={n_group}"
    )
    print(
        f"slug range (n): {prayers[0].slug} (1) .. {prayers[-1].slug} ({len(prayers)})"
    )
    print(f"VALIDATION: {'PASS' if ok else 'FAIL'}")
    for p in problems:
        print(f"  - {p}")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def run(lang: str) -> tuple[list[Prayer], list[dict]]:
    cfg = LANG_CONFIG[lang]
    if not cfg["raw_path"].exists():
        raise RuntimeError(
            f"{lang}: raw file not found at {cfg['raw_path']} -- this script never "
            "fetches over the network (see module docstring); if this file is "
            "genuinely missing, that's a decision for whoever runs compendium.py, "
            "not for this script to work around."
        )
    html_text = cfg["raw_path"].read_text(encoding="cp1252", errors="replace")
    appendix_prayers = cfg["builder"](html_text)
    credo_path = CCC_EN_CREDO_RAW if lang == "en" else CCC_PT_CREDO_RAW
    our_father_path = CCC_EN_OUR_FATHER_RAW if lang == "en" else CCC_PT_OUR_FATHER_RAW
    litany_path = LITANY_EN_RAW if lang == "en" else LITANY_PT_RAW
    for path in (credo_path, our_father_path, litany_path):
        if not path.exists():
            raise RuntimeError(
                f"{lang}: raw CCC source not found at {path} -- this script never fetches over the network"
            )
    credo_html = credo_path.read_text(encoding="cp1252", errors="replace")
    our_father_html = our_father_path.read_text(encoding="cp1252", errors="replace")
    litany_html = litany_path.read_text(encoding="cp1252", errors="replace")
    creeds = (
        build_creeds_en(credo_html) if lang == "en" else build_creeds_pt(credo_html)
    )
    our_father = (
        build_our_father_en(our_father_html)
        if lang == "en"
        else build_our_father_pt(our_father_html)
    )
    litany = (
        build_litany_en(litany_html) if lang == "en" else build_litany_pt(litany_html)
    )
    rosary = next(
        (prayer for prayer in appendix_prayers if prayer.slug == "rosary"), None
    )
    if rosary is None:
        raise RuntimeError(f"{lang}: Appendix A parser produced no Rosary entry")
    enrich_rosary_with_full_mysteries(rosary, lang)
    prayers = [*creeds, our_father, *appendix_prayers, litany]
    for n, prayer in enumerate(prayers, start=1):
        prayer.n = n
    corrections = load_corrections(cfg["work_id"])
    applied = apply_corrections(prayers, corrections) if corrections else []
    return prayers, applied


def write_regional_outputs(
    prayers: list[Prayer], applied_corrections: list[dict]
) -> None:
    out_dir = WORKS_ROOT / REGIONAL_WORK_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = build_regional_manifest(prayers, applied_corrections)
    files: dict[str, object] = {
        "manifest.json": manifest,
        "structure.json": build_structure(prayers, "en"),
        "prayers.json": [p.to_dict() for p in prayers],
    }
    if applied_corrections:
        files["corrections-applied.json"] = applied_corrections
    write_stamped_json(
        out_dir,
        files,
        manifest["generated_at"],
        remove=() if applied_corrections else ("corrections-applied.json",),
    )


def validate_regional(
    base: list[Prayer], regional: list[Prayer], varied: list[str]
) -> tuple[bool, list[str]]:
    """The collection is whole, and the regional edition is exactly the
    difference between the two wordings.

    Three assertions, each guarding a way the split can go wrong quietly. The
    base edition still carries every slug -- a resolver that dropped a prayer
    while choosing its wording would otherwise be invisible, since the reader
    would simply never see it. The regional edition carries exactly the slugs
    the source marked: no more, which would mean it touched a prayer the
    source does not regionalize, and no fewer, which would mean a wording was
    lost. And every prayer it carries actually READS differently from the
    collection's -- a UK entry identical to the USA one is a wording that
    failed to resolve, and would put a row in the reader's picker that changes
    nothing on the page.
    """
    problems: list[str] = []
    if [p.slug for p in base] != SLUGS:
        problems.append("prayer.common.en: slug set/order is not the collection's")
    if any(p.variants for p in base) or any(p.variants for p in regional):
        problems.append("a variant survived into an edition")

    expected = [s for s in SLUGS if s in set(varied)]
    got = [p.slug for p in regional]
    if got != expected:
        problems.append(
            f"{REGIONAL_WORK_ID} carries {got}, but the source marked {expected}"
        )

    by_slug = {p.slug: p for p in base}
    same = [
        p.slug
        for p in regional
        if p.slug in by_slug
        and [b.to_dict() for b in p.blocks]
        == [b.to_dict() for b in by_slug[p.slug].blocks]
    ]
    if same:
        problems.append(
            f"{REGIONAL_WORK_ID}: {same} read identically to prayer.common.en"
        )
    return not problems, problems


def print_regional_summary(base: list[Prayer], regional: list[Prayer]) -> None:
    print("\n=== EN editions ===")
    print(
        f"prayer.common.en: {len(base)} prayers, {BASE_VARIANT} wording where the "
        "source prints two"
    )
    print(
        f"{REGIONAL_WORK_ID}: {len(regional)} prayers, {REGIONAL_VARIANT} wording "
        f"({', '.join(p.slug for p in regional)})"
    )


def print_latin_summary(prayers: list[Prayer], report: list[dict]) -> None:
    resegmented = [r for r in report if r["segmentation_from"] != LATIN_BASE_LANG]
    diverged = [r for r in report if r["divergence"]]
    print("\n=== LA summary (derived) ===")
    print(f"prayers with a Latin companion: {len(prayers)}")
    print(f"text witness: {LATIN_BASE_LANG} (every character)")
    print(
        f"re-segmented from {LATIN_SEGMENTATION_LANG}: {len(resegmented)}"
        + (f" ({', '.join(r['slug'] for r in resegmented)})" if resegmented else "")
    )
    print(
        f"witnesses disagree in letters: {len(diverged)}"
        + (f" ({', '.join(r['slug'] for r in diverged)})" if diverged else "")
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--lang", choices=["en", "pt", "both"], default="both")
    ap.add_argument(
        "--fetch-litany",
        action="store_true",
        help="capture the requested Vatican Litany of Loreto EN/PT pages into the write-once raw cache",
    )
    ap.add_argument(
        "--fetch-rosary-mysteries",
        action="store_true",
        help="capture the full Vatican Rosary-mystery pages EN/PT into the write-once raw cache",
    )
    args = ap.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()
    if args.fetch_litany:
        capture_litany_raw()
    if args.fetch_rosary_mysteries:
        capture_rosary_mysteries_raw()
    langs = ["en", "pt"] if args.lang == "both" else [args.lang]

    results: dict[str, list[Prayer]] = {}
    applied_by_lang: dict[str, list[dict]] = {}
    en_base: list[Prayer] = []
    varied: list[str] = []
    overall_ok = True
    for lang in langs:
        prayers, applied = run(lang)
        results[lang] = prayers
        applied_by_lang[lang] = applied
        # ENGLISH SPLITS HERE, on the parsed prayers, so the collection and its
        # regional edition come from one reading of one page and cannot drift.
        # `prayer.common.en` prints the USA wording of the five the source
        # prints twice; the UK wording becomes `prayer.common.en-gb` below.
        if lang == "en":
            varied = [p.slug for p in prayers if p.variants]
            en_base = build_base_edition(prayers)
            write_outputs(lang, en_base, applied, varied)
        else:
            write_outputs(lang, prayers, applied)

    en = results.get("en", [])
    pt = results.get("pt", [])
    if en:
        regional = build_regional_edition(en)
        write_regional_outputs(regional, applied_by_lang["en"])
        regional_ok, regional_problems = validate_regional(en_base, regional, varied)
        print_regional_summary(en_base, regional)
    else:
        regional_ok, regional_problems = True, []

    if "en" in results and "pt" in results:
        ok, problems = validate(en, pt)
        # `en` here is the UNSPLIT parse -- the cross-language oracle is about
        # the address space the source publishes, which is one English
        # appendix against one Portuguese one, not about the collection and
        # regional edition we cut the former into.
        # The Latin edition needs BOTH witnesses -- the English for its text,
        # the Portuguese for where five prayers break into stanzas -- so it is
        # built only on a full run, never on `--lang en` alone. Writing it
        # from one witness would silently produce a differently-segmented
        # edition under the same work id.
        latin, witnesses = build_latin_edition(en, pt)
        write_latin_outputs(latin, witnesses)
        latin_ok, latin_problems = validate_latin(latin, en, pt)
        ok = ok and latin_ok
        problems = problems + latin_problems
        print_latin_summary(latin, witnesses)
    else:
        # single-language run: validate what we have against itself, with
        # the other side's slug set standing in (only the per-language
        # checks that don't need a cross-language peer actually run
        # meaningfully; the slug-order-match check is trivially true).
        only = en or pt
        ok, problems = validate(only, only)
    ok = ok and regional_ok
    problems = problems + regional_problems
    overall_ok = ok

    for lang in langs:
        print_summary(lang, results[lang], ok, problems if lang == langs[-1] else [])

    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
