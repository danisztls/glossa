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
  one wording throughout. Captured as an optional `variants` array.
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
import json
import re
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# Sibling module in this directory -- a script's own directory is on sys.path,
# so this resolves regardless of the working directory. See common.py's
# docblock for what does and does not belong there.
from common import load_corrections, raw_root, require_corpus, works_root

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


def capture_raw_pages(pages: list[tuple[str, Path]]) -> None:
    """Capture explicitly requested Vatican pages once.

    The raw cache is write-once: an existing file is reused, never refreshed
    or overwritten. Requests are deliberately sequential and respect the
    Vatican's two-second crawl delay.
    """
    last_request = 0.0
    for url, path in pages:
        if path.exists():
            continue
        elapsed = time.monotonic() - last_request
        if elapsed < CRAWL_DELAY:
            time.sleep(CRAWL_DELAY - elapsed)
        path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with urlopen(
                Request(url, headers={"User-Agent": USER_AGENT}), timeout=30
            ) as response:
                data = response.read()
        except (HTTPError, URLError) as exc:
            raise RuntimeError(f"Vatican fetch failed: {url}: {exc}") from exc
        path.write_bytes(data)
        last_request = time.monotonic()


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

    def to_dict(self) -> dict:
        # Omitted when "prose" -- see vatican_docs.py's BlockOut for why, and
        # docs/corpus-schema.md for the schema statement. Here the exceptions
        # are "versicle"/"response", which carry a `label` too.
        d: dict = {}
        if self.kind != "prose":
            d["kind"] = self.kind
        d["text"] = self.text
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
        out.append(BlockOut("prose", text))
        return
    prose_buf: list[str] = []

    def flush() -> None:
        if prose_buf:
            out.append(BlockOut("prose", " ".join(prose_buf)))
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
            items = items[:4] + [" ".join(items[4:])]
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
        BlockOut("prose", flatten(p)) for p in top_paragraphs(body_html) if flatten(p)
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
        BlockOut("prose", flatten(part))
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
        [s for s in APPENDIX_SLUGS if s not in NO_LATIN_SLUGS], latin_paragraphs
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
            [BlockOut("prose", flatten(apostles))],
        ),
        Prayer(
            0, "nicene-creed", "The Nicene Creed", [BlockOut("prose", flatten(nicene))]
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
    columns = [
        " ".join(flatten(row[column]) for row in rows[1:]) for column in range(2)
    ]
    return [
        Prayer(
            0,
            "apostles-creed",
            "Símbolo dos Apóstolos",
            [BlockOut("prose", columns[0])],
        ),
        Prayer(
            0,
            "nicene-creed",
            "Credo de Niceia–Constantinopla",
            [BlockOut("prose", columns[1])],
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
        0, "our-father", "The Our Father", [BlockOut("prose", flatten(matches[0]))]
    )


def build_our_father_pt(html_text: str) -> Prayer:
    matches = re.findall(
        r"<blockquote[^>]*>\s*(<p[^>]*>.*?</p>)\s*</blockquote>", html_text, re.I | re.S
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
        0, "our-father", "Pai Nosso", [BlockOut("prose", flatten(prayers[0]))]
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
            blocks.append(BlockOut("prose", text))
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
        BlockOut("prose", flatten(raw))
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
# Corrections (docs/decisions.md §Source-defect corrections policy)
# --------------------------------------------------------------------------


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
        matches[0].text = matches[0].text.replace(c["from"], c["to"])
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
        {"en": "Creeds and the Lord's Prayer", "pt": "Credos e o Pai-Nosso"},
        ["apostles-creed", "nicene-creed", "our-father"],
    ),
    (
        {"en": "Basic Prayers", "pt": "Ora\u00e7\u00f5es fundamentais"},
        ["sign-of-the-cross", "glory-be", "hail-mary", "angel-of-god", "eternal-rest"],
    ),
    (
        {
            "en": "Marian and Devotional Prayers",
            "pt": "Ora\u00e7\u00f5es marianas e devocionais",
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
    ({"en": "The Rosary", "pt": "O Ros\u00e1rio"}, ["rosary"]),
    (
        {
            "en": "Prayers of the Eastern Churches",
            "pt": "Ora\u00e7\u00f5es das Igrejas orientais",
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
        },
        ["act-of-faith", "act-of-hope", "act-of-love", "act-of-contrition"],
    ),
    ({"en": "Litanies", "pt": "Ladainhas"}, [LITANY_SLUG]),
]


def build_structure(prayers: list[Prayer], lang: str) -> list[dict]:
    by_slug = {p.slug: p for p in prayers}
    nodes = []
    for titles, slugs in STRUCTURE_GROUPS:
        title = titles.get(lang, titles["en"])
        nodes.append(
            {
                "kind": "section",
                "title": title,
                "paragraphs": [None, None],
                "children": [
                    {
                        "kind": "sub",
                        "title": by_slug[s].title,
                        "paragraphs": [None, None],
                        "children": [],
                    }
                    for s in slugs
                ],
            }
        )
    return nodes


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
    lang: str, prayers: list[Prayer], applied_corrections: list[dict]
) -> dict:
    cfg = LANG_CONFIG[lang]
    n_with_latin = sum(1 for p in prayers if p.latin)
    n_with_variants = sum(1 for p in prayers if p.variants)
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
            "in either Compendium language. Latin is deliberately a per-prayer "
            "field, not a third work/edition: see docs/decisions.md and "
            "docs/research/prayers.md §3 for why (a real `lang=la` edition would "
            "reopen PLAN.md's unresolved UI-language-vs-content-language "
            "question; the source itself prints Latin as a bound companion to "
            "the vernacular, not as independently addressable text)."
        ),
        (
            f"{n_with_variants} prayers carry a `variants` array (Regina Caeli, "
            "Hail Holy Queen, Magnificat, Benedictus, Te Deum) -- EN prints two "
            'full alternate wordings under one title, headed "UK VERSION" / '
            '"USA VERSION" in the source; PT prints one wording throughout for '
            "every prayer, so `variants` is always absent in prayer.common.pt."
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
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "corrections_applied": len(applied_corrections),
    }


def write_outputs(
    lang: str, prayers: list[Prayer], applied_corrections: list[dict]
) -> None:
    cfg = LANG_CONFIG[lang]
    out_dir = WORKS_ROOT / cfg["work_id"]
    out_dir.mkdir(parents=True, exist_ok=True)

    manifest = build_manifest(lang, prayers, applied_corrections)
    structure = build_structure(prayers, lang)
    prayers_json = [p.to_dict() for p in prayers]

    (out_dir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n"
    )
    (out_dir / "structure.json").write_text(
        json.dumps(structure, indent=2, ensure_ascii=False) + "\n"
    )
    (out_dir / "prayers.json").write_text(
        json.dumps(prayers_json, indent=2, ensure_ascii=False) + "\n"
    )
    if applied_corrections:
        (out_dir / "corrections-applied.json").write_text(
            json.dumps(applied_corrections, indent=2, ensure_ascii=False) + "\n"
        )


def print_summary(
    lang: str, prayers: list[Prayer], ok: bool, problems: list[str]
) -> None:
    n_with_latin = sum(1 for p in prayers if p.latin)
    n_with_variants = sum(1 for p in prayers if p.variants)
    n_dialogic = sum(1 for p in prayers if p.kind == "dialogic")
    n_group = sum(1 for p in prayers if p.kind == "group")
    print(f"\n=== {lang.upper()} summary ===")
    print(f"prayers captured: {len(prayers)}")
    print(f"prayers with Latin: {n_with_latin}/{len(prayers)}")
    print(f"prayers with UK/USA variants: {n_with_variants}")
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
    overall_ok = True
    for lang in langs:
        prayers, applied = run(lang)
        results[lang] = prayers
        write_outputs(lang, prayers, applied)

    en = results.get("en", [])
    pt = results.get("pt", [])
    if "en" in results and "pt" in results:
        ok, problems = validate(en, pt)
    else:
        # single-language run: validate what we have against itself, with
        # the other side's slug set standing in (only the per-language
        # checks that don't need a cross-language peer actually run
        # meaningfully; the slug-order-match check is trivially true).
        only = en or pt
        ok, problems = validate(only, only)
    overall_ok = ok

    for lang in langs:
        print_summary(lang, results[lang], ok, problems if lang == langs[-1] else [])

    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
