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

**Fourteen editions, in three source shapes.** The module opened on English
and Portuguese and the paragraphs above still describe those two, because
what they say about the two page layouts is still true of them. What has been
added since is stated where it is done rather than restated here:

  - the Compendium's OWN BODY as a source for the two Creeds and the Our
    Father, which every edition prints at the head of Part One Section Two
    and of Part Four Section Two and which nothing had ever read (see "The
    Compendium's OWN BODY" below);
  - the four editions vatican.va publishes only as a PDF -- Byelorussian,
    Indonesian, Lithuanian and Russian -- whose appendix is the same book set
    in two parallel columns on a page (see "The four PDF editions" below).

`LANG_CONFIG` is the table that says which of the three each edition is, and
`--lang` derives its choices from it.

Usage:
  uv run pipeline/scrapers/prayers.py --lang all|en|pt|...

No --sample mode: at most 28 prayers per edition (24 Appendix A entries,
three short CCC texts, and the Litany), parsed instantly and entirely
offline; there is nothing here for a sample slice to save time on.
"""

from __future__ import annotations

import argparse
import html as ihtml
import itertools
import json
import re
import statistics
import sys
import unicodedata
from collections import Counter
from collections.abc import Callable
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime
from functools import cache, lru_cache
from pathlib import Path

# `ccc/compendium_pdf.py` is a LIBRARY, not a `uv run --script` program -- it
# has no main and `ccc/compendium.py` imports it the same way. So unlike
# `COMPENDIUM_FILES` below, which mirrors a table in a sibling script, the four
# PDF editions' declarations are imported: which reader each file needs, which
# re-decode, which glyph its fonts fail to map and where its furniture ends are
# facts about those four files, and they are as true of the appendix as of the
# body. A second copy of them is a second thing to keep true.
#
# QUALIFIED WITH ITS DIRECTORY, and that is not style. `ccc/` has no
# `__init__.py` and does not need one -- it resolves as a namespace package off
# the `pipeline/scrapers` entry Python already puts on `sys.path` for this
# script. A bare `from compendium_pdf import ...` behind a `sys.path` insert
# would import the same file and work, and `rebuild.py`'s `resolve_import`
# would answer None for it: the code fingerprint would then not carry this
# module, and `--changed-only` would skip the prayers stage after an edit to
# it. An import the fingerprint cannot follow is a stale parse waiting to
# happen (pipeline/CLAUDE.md, "the standing failure mode is the silent stale
# answer").
from ccc.compendium_pdf import PDF_EDITIONS, PdfEdition, pdf_copyright

# Sibling package in this directory -- a script's own directory is on sys.path,
# so this resolves regardless of the working directory. See common/__init__.py's
# docblock for what does and does not belong there.
from common import (
    Fetcher,
    FetchError,
    FetchPolicy,
    build_root,
    load_corrections,
    raw_root,
    require_corpus,
    write_stamped_json,
)
from common.pdf import (
    Line,
    merge_runs,
    page_boxes,
    read_lines,
    remap,
    split_pages,
)

# The corpus is a separate, private repository (docs/decisions.md
# §The corpus); `common.corpus_dir()` resolves it, honouring $CORPUS_DIR.
RAW_ROOT = raw_root()
BUILD_ROOT = build_root()

EN_RAW = RAW_ROOT / "compendium-en" / "archive_2005_compendium-ccc_en.html"
PT_RAW = RAW_ROOT / "compendium-pt" / "archive_2005_compendium-ccc_po.html"
CCC_EN_CREDO_RAW = RAW_ROOT / "ccc-en" / "__P13.HTM"
CCC_PT_CREDO_RAW = RAW_ROOT / "ccc-pt" / "p1s1c3_142-184_po.html"
CCC_EN_OUR_FATHER_RAW = RAW_ROOT / "ccc-en" / "__P9V.HTM"
CCC_PT_OUR_FATHER_RAW = RAW_ROOT / "ccc-pt" / "p4s2_2759-2865_po.html"
# vatican.va SPELLS LATIN `lt` IN THE CATECHISM'S URLS -- `catechism_lt` is
# *latine*, not Lithuanian (CLAUDE.md, and `ccc.py`'s own EDITIONS docblock).
# Latin has no IntraText mirror, so there is no counterpart to English's
# standalone "The Credo" page: the two Creeds sit in a SYMBOLUM FIDEI table
# inside the ordinary body page for Part One, Section One, Chapter Three,
# Article Two, and the Our Father is the blockquote at 2759.
CCC_LA_CREDO_RAW = RAW_ROOT / "ccc-la" / "p1s1c3a2_lt.htm"
CCC_LA_OUR_FATHER_RAW = RAW_ROOT / "ccc-la" / "p4s2_lt.htm"
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

CCC_LA_BASE_URL = "https://www.vatican.va/archive/catechism_lt/"
CCC_LA_CREDO_URL = CCC_LA_BASE_URL + "p1s1c3a2_lt.htm"
CCC_LA_OUR_FATHER_URL = CCC_LA_BASE_URL + "p4s2_lt.htm"

LITANY_EN_URL = (
    "https://www.vatican.va/special/rosary/documents/litanie-lauretane_en.html"
)
LITANY_PT_URL = (
    "https://www.vatican.va/special/rosary/documents/litanie-lauretane_po.html"
)
ROSARY_BASE = "https://www.vatican.va/special/rosary/documents/"

#: The Holy Rosary micro-site's filename suffix per language, keyed by the
#: mirror's OWN code. Read off the micro-site's own language switcher, never
#: guessed -- the switcher on the cached English pages names exactly six
#: languages and no more, which is why `LangSpec.rosary_mysteries` is `None`
#: for every other one.
#:
#: TWO TRAPS, BOTH THE MIRROR'S. The codes are the archive mirror's rather
#: than ISO -- German is `ge`, Spanish `sp`, Portuguese `po`, the same family
#: of trap as `catechism_lt` being Latin. And ITALIAN IS THE MIRROR'S UNMARKED
#: DEFAULT on the mystery pages: the switcher lists `misteri_en`, `_fr`, `_ge`,
#: `_po`, `_sp` and then a bare `misteri.html`, which is the Italian one. It is
#: NOT consistent even within the micro-site -- the Litany is spelled
#: `litanie-lauretane_it.html`, suffix and all -- so Italian gets candidates
#: tried in order rather than one guess, and `capture_raw_pages` records which
#: answered.
ROSARY_MYSTERY_SUFFIXES = {
    "en": ("_en",),
    "po": ("_po",),
    "ge": ("_ge",),
    "sp": ("_sp",),
    "fr": ("_fr",),
    # Bare first: that is what the switcher points at. The suffixed form is a
    # fallback in case the four detail pages follow the Litany's convention
    # instead of the index's.
    "it": ("", "_it"),
}

#: The Litany's suffix is simply the mirror code, Italian included.
LITANY_SUFFIXES = {code: (f"_{code}",) for code in ROSARY_MYSTERY_SUFFIXES}


def rosary_mystery_urls(code: str, name: str) -> list[str]:
    """Candidate URLs for one mystery page, best first. See
    `ROSARY_MYSTERY_SUFFIXES` for why Italian has two."""
    return [f"{ROSARY_BASE}{name}{sfx}.html" for sfx in ROSARY_MYSTERY_SUFFIXES[code]]


def litany_urls(code: str) -> list[str]:
    return [
        f"{ROSARY_BASE}litanie-lauretane{sfx}.html" for sfx in LITANY_SUFFIXES[code]
    ]


# Both raw files were fetched by compendium.py on this date; re-parsing
# them here is not a new retrieval event, so the manifest carries the
# original date rather than today's.
RETRIEVED_AT = "2026-08-14"


def captured_at(path: Path, fallback: str) -> str:
    """The day `path` was actually fetched, from its directory's
    `captured-at.json`.

    THAT FILE IS THE AUTHORITY AND A CONSTANT HERE IS NOT. `Fetcher` writes it
    at the moment it writes the page -- the only point where the answer is
    certain, since a cache hit never reaches it -- and CLAUDE.md records that
    the manifests' own dates were coarser and wrong for 354 works, carrying
    one date per work where the real fetches were spread over days.

    This scraper had the same defect in miniature: `CCC_RETRIEVED_AT` claimed
    2026-08-15 for the Catechism's Credo and Lord's Prayer pages, which
    `raw/ccc-en/captured-at.json` records as fetched on 2026-08-14. Reading
    the ledger fixes that by construction rather than by anyone noticing.

    `fallback` covers a raw directory captured before `Fetcher` began writing
    the ledger, so a missing entry degrades to the date the constant asserted
    rather than to nothing."""
    ledger = path.parent / "captured-at.json"
    if not ledger.exists():
        return fallback
    try:
        return json.loads(ledger.read_text()).get(path.name, fallback)
    except (OSError, ValueError):
        return fallback


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

#: Spanish prints a 25th entry the other mirrors leave to the Catechism's own
#: page: the Our Father, between the Glory be and the Hail Mary. So its
#: appendix IS the collection's Our Father, and `LangSpec.our_father` is
#: `None` for Spanish -- not because the text is missing but because it is
#: already here. Derived by position rather than retyped, so reordering
#: `APPENDIX_SLUGS` cannot silently move it.
ES_APPENDIX_SLUGS = [
    *APPENDIX_SLUGS[: APPENDIX_SLUGS.index("hail-mary")],
    "our-father",
    *APPENDIX_SLUGS[APPENDIX_SLUGS.index("hail-mary") :],
]
assert len(ES_APPENDIX_SLUGS) == 25

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

#: The three the Compendium prints no Latin for and the LATIN CATECHISM does.
#: They are not part of `LATIN_SLUGS`, which is about the appendix's own Latin
#: column, and they never gain a `latin` FIELD on a vernacular prayer -- they
#: reach `prayer.common.la` as whole prayers read off a Latin page. Which is
#: why the Latin edition is 24 of 28 while every vernacular edition still
#: reports 21 Latin companions.
LATIN_FROM_CATECHISM_SLUGS = ["apostles-creed", "nicene-creed", "our-father"]

assert len(APPENDIX_SLUGS) == 24
assert len(SLUGS) == 28
assert len(LATIN_SLUGS) == 21
assert len(LATIN_SLUGS) + len(LATIN_FROM_CATECHISM_SLUGS) == 24


# --------------------------------------------------------------------------
# Text utilities
# --------------------------------------------------------------------------

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")
_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
_DOUBLE_BR_RE = re.compile(r"(?:<br\s*/?>\s*){2,}", re.IGNORECASE)

# A DOUBLE-ENCODING ARTIFACT OF THE MIRROR, removed in the decoder rather than
# filed as a correction -- the same call `martini.py` makes for `<em<`, and for
# the same reason: it changes nothing the source SAID, only whether a stray
# character survives into the text. `Â` here is not a letter the page prints;
# it is the first byte of a UTF-8 sequence that was read as Latin-1 and then
# entity-encoded, so the mirror emits `&Acirc;&#x2013;` where it means an en
# dash. Measured across all ten Compendium pages: en 24, es 40, pt 68, ro 1228,
# fr 203, and none in de/hu/it/sl/sv.
#
# THE GUARD IS THAT THE NEXT CHARACTER IS PUNCTUATION, AND IT IS LOAD-BEARING.
# French's 203 and most of Romanian's are `Â` followed by a LETTER, and every
# one of those is real text the page means -- "LA GRÂCE", "DE TOUTE TON ÂME",
# "avec son Âme et sa divinité". Stripping `Â` wherever it appeared would
# silently mutilate French. So only the punctuation-glued form goes, which is
# never a word in any of the ten languages: en/es lose it before quotes, dashes
# and an ellipsis, ro before its own `„`/`”` quotation marks.
_STRAY_ACIRC_RE = re.compile(
    "\u00c2(?=[\u2013\u2014\u2018\u2019\u201c\u201d\u201e\u2026])"
)


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
    s = _STRAY_ACIRC_RE.sub("", s)
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


def capture_first_available(candidates: list[str], out_dir: Path) -> Path | None:
    """Fetch the first of `candidates` that answers, into `out_dir` under the
    URL's own basename. Returns the path written or already present.

    CANDIDATES EXIST FOR ONE REASON AND IT IS ITALIAN -- see
    `ROSARY_MYSTERY_SUFFIXES`. Everything else has exactly one, so this
    degenerates to "fetch it" for five of the six languages.

    A candidate already on disk wins without a request, which is what keeps
    the cache write-once. Exhausting the list is not an error here: the caller
    is a capture, and a language the micro-site does not publish is a fact to
    report rather than a run to fail."""
    paths = [out_dir / url.rsplit("/", 1)[-1] for url in candidates]
    for path in paths:
        if path.exists():
            return path
    fetcher = Fetcher(RAW_ROOT, VATICAN_POLICY)
    for url, path in zip(candidates, paths, strict=True):
        try:
            fetcher.fetch_bytes(url, str(path.relative_to(RAW_ROOT)))
            return path
        except FetchError:
            continue
    return None


def rosary_mystery_raw(lang: str) -> list[Path]:
    """The four mystery pages for `lang`, preferring whichever candidate a
    capture actually landed. Falls back to the preferred name so an error
    message can say what is missing."""
    code = LANG_CONFIG[lang].rosary_mysteries
    if code is None:
        return []
    out: list[Path] = []
    for name in ROSARY_MYSTERY_FILES:
        cands = [
            RAW_ROOT / f"rosary-{lang}" / url.rsplit("/", 1)[-1]
            for url in rosary_mystery_urls(code, name)
        ]
        out.append(next((p for p in cands if p.exists()), cands[0]))
    return out


def capture_companions(langs: list[str]) -> None:
    """Capture the Holy Rosary micro-site pages -- the Litany and the four
    mystery pages -- for every requested language that the micro-site
    publishes.

    THIS IS AN ACQUISITION, NOT A PUBLISHING DECISION, which is the whole
    reason it is a flag rather than part of a parse. It is the same posture
    `--fetch-only` records for vatican_docs.py: a page captured today can be
    re-parsed for years, and the value of having captured it usually shows up
    later. Five pages per language, sequential, at the host's own two-second
    crawl delay.

    A language whose page does not answer is REPORTED and skipped, not fatal:
    the micro-site's switcher is evidence, not a promise, and a collection
    without a Litany is a shorter collection (see `LangSpec`)."""
    for lang in langs:
        code = LANG_CONFIG[lang].rosary_mysteries
        if code is None:
            continue
        out_dir = RAW_ROOT / f"rosary-{lang}"
        wanted: list[tuple[str, list[str]]] = [
            ("litany", litany_urls(code)),
            *((name, rosary_mystery_urls(code, name)) for name in ROSARY_MYSTERY_FILES),
        ]
        for label, candidates in wanted:
            got = capture_first_available(candidates, out_dir)
            if got is None:
                print(
                    f"  {lang}: no page answered for {label} ({', '.join(candidates)})",
                    file=sys.stderr,
                )


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
class Invocation:
    """One line of a litany, under the response its block holds.

    `response_printed` marks the ONE the source printed the response after --
    every other invocation carries it by implication, which is exactly what a
    litany is. Storing the flag rather than repeating the response is what
    keeps the corpus saying what the page says: the Litany of Loreto prints
    "pray for us." once and fifty-two invocations under it."""

    text: str
    response_printed: bool = False

    def to_dict(self) -> dict:
        d: dict = {"text": self.text}
        if self.response_printed:
            d["response_printed"] = True
        return d


@dataclass
class BlockOut:
    kind: str  # "prose" | "versicle" | "response" | "petitions"
    text: str
    label: str | None = None  # verbatim printed prefix: "V." | "R." | "D." | "C."
    #: The block's printed LINES, joined by `<br />`, when it has more than
    #: one -- see `line_html`. Absent otherwise, and `text` always carries the
    #: same words either way.
    html: str | None = None
    #: `petitions` only: the response held over `invocations`, stored ONCE.
    response: str | None = None
    invocations: list[Invocation] = field(default_factory=list)

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
        # `text` and `html` stay alongside for a petitions block, so every
        # consumer that predates the kind -- search, plain text, the existing
        # renderers -- reads it as the lines the source printed and is
        # unaffected. The structure is additive.
        if self.kind == "petitions":
            d["response"] = self.response
            d["invocations"] = [i.to_dict() for i in self.invocations]
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


#: ISO weekday numbers (1 = Monday .. 7 = Sunday) each mystery set is prayed
#: on, in the source's own print order -- Joyful, Luminous, Sorrowful,
#: Glorious. NOT the data: it is the ORACLE. Each group's `days` is parsed out
#: of the rubric the source actually prints ("(recited Monday and Saturday)",
#: "(Segundas e Sábados)") and then asserted against this, so the corpus
#: carries what the page says and this catches the page saying something else
#: -- or a parser mis-zipping four rubrics onto four groups, which is the
#: failure that would otherwise be invisible: every rubric would still be
#: present, just attached to the wrong set.
#:
#: Thursday belongs to the Luminous mysteries because John Paul II gave it to
#: them in Rosarium Virginis Mariae (2002), moving the Joyful set off it; the
#: other three are the older rotation. Both sources print the post-2002 one.
CANONICAL_MYSTERY_DAYS = ({1, 6}, {4}, {2, 5}, {3, 7})

#: Weekday name stems, accent-folded and lowercased, in ISO order. Portuguese
#: prints the plural ("Segundas e Sábados") and sometimes the full form
#: ("Quintas Feiras"), so these are STEMS matched as substrings rather than
#: whole words.
_WEEKDAY_STEMS = {
    "en": (
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ),
    "pt": ("segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"),
    "es": ("lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"),
    "it": (
        "lunedi",
        "martedi",
        "mercoledi",
        "giovedi",
        "venerdi",
        "sabato",
        "domenica",
    ),
    "de": (
        "montag",
        "dienstag",
        "mittwoch",
        "donnerstag",
        "freitag",
        "samstag",
        "sonntag",
    ),
    # The Latin appendix heads its mystery groups "in feria secunda et
    # sabbato" and the like -- the Church's own ferial numbering, in which
    # feria secunda is MONDAY, not Tuesday. Present so that the trailing Latin
    # block's four group headings can be told from the prayer titles around
    # them (`mystery_heading_indexes`); nothing reads `days` off a Latin
    # rubric, because the Latin edition carries no mystery groups.
    "fr": (
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
    ),
    "la": ("secunda", "tertia", "quarta", "quinta", "sexta", "sabbato", "dominica"),
    "hu": (
        "hetfo",
        "kedd",
        "szerda",
        "csutortok",
        "pentek",
        "szombat",
        "vasarnap",
    ),
}


def parse_rubric_days(rubric: str | None, lang: str) -> list[int]:
    """The ISO weekday numbers a mystery set's printed rubric names.

    Accent- and case-folded substring matching on stems, because the two
    sources phrase this differently and neither phrases it consistently:
    English writes "(recited Monday and Saturday)" and "(recited Thursday)",
    Portuguese writes "(Segundas e Sábados)", "(Quintas Feiras)" and
    "(Quartas e Domingo )" -- singular, plural and a stray trailing space in
    one line. Returned sorted, so the assertion against
    `CANONICAL_MYSTERY_DAYS` compares sets and not word order."""
    if not rubric:
        return []
    folded = "".join(
        ch
        for ch in unicodedata.normalize("NFD", rubric.lower())
        if not unicodedata.combining(ch)
    )
    return sorted(
        n for n, stem in enumerate(_WEEKDAY_STEMS[lang], start=1) if stem in folded
    )


@dataclass
class MysteryGroup:
    name: str
    rubric: str | None
    items: list[MysteryItem]
    #: ISO weekday numbers this set is prayed on, read out of `rubric` -- see
    #: `parse_rubric_days`. The rubric stays verbatim; this is the form a
    #: reader's own weekday can be compared against without a consumer having
    #: to parse prose in fourteen interface languages.
    days: list[int] = field(default_factory=list)
    #: The page THIS GROUP's five mysteries were parsed from -- one of the
    #: four Holy Rosary micro-site pages, not the Compendium appendix the
    #: surrounding Rosary entry comes from. See `prayer_sources`.
    source: str | None = None

    def to_dict(self) -> dict:
        d: dict = {
            "name": self.name,
            "rubric": self.rubric,
            "items": [item.to_dict() for item in self.items],
        }
        if self.days:
            d["days"] = self.days
        if self.source:
            d["source"] = self.source
        return d


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
    #: The page these directions were parsed from -- see `MysteryGroup.source`.
    source: str | None = None

    def to_dict(self) -> dict:
        d: dict = {
            "title": self.title,
            "blocks": [block.to_dict() for block in self.blocks],
        }
        if self.source:
            d["source"] = self.source
        return d


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
    #: Where THIS prayer's own text came from, as `{url, retrieved_at}` --
    #: filled by `attach_sources` just before writing. See `prayer_sources`
    #: for why a work-level source list was not enough.
    sources: list[dict] = field(default_factory=list)

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
        if self.sources:
            d["sources"] = self.sources
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
# The Latin Catechism -- the three prayers the Compendium prints no Latin for
# --------------------------------------------------------------------------
#
# `prayer.common.la` held 21 of 28 because the Compendium's appendix prints a
# Latin companion for 21 of its 24 entries and none at all for the two Creeds,
# the Our Father or the Litany. Four of those seven are genuinely absent
# everywhere. THE OTHER THREE ARE NOT: the Latin Catechism prints all of them,
# on pages already in `raw/`, and nothing had ever read them -- the same
# re-parse-never-re-crawl move `build_creeds_en` already makes against the
# English Catechism, one language further along.
#
# THIS IS A THIRD KIND OF PROVENANCE and `witnesses.json` had no word for it.
# The other 21 are DERIVED -- English's Latin column for the text, Portuguese's
# for where the stanzas break. These three are not derived from anything: they
# are Latin read off a Latin page. `text_from` says `ccc-la` for them, and the
# reconciliation machinery is not run over them at all, because there is only
# one witness to reconcile.

_SUP_RE = re.compile(r"<sup[^>]*>.*?</sup>", re.IGNORECASE | re.DOTALL)
_SYMBOLUM_TABLE_RE = re.compile(
    r'name="SYMBOLUM FIDEI".*?<table[^>]*>(.*?)</table>', re.IGNORECASE | re.DOTALL
)
_LA_OUR_FATHER_RE = re.compile(
    r"<blockquote>\s*<p[^>]*>(.*?)</p>\s*</blockquote>", re.IGNORECASE | re.DOTALL
)


def build_creeds_la(html_text: str) -> list[Prayer]:
    """The Apostles' and Nicene Creeds, from the Latin Catechism's own
    SYMBOLUM FIDEI table -- two columns, one Creed each, twelve rows of which
    the first is the pair of headings."""
    m = _SYMBOLUM_TABLE_RE.search(html_text)
    if m is None:
        raise RuntimeError("LA: could not locate the SYMBOLUM FIDEI table")
    rows = [
        [c.group(1) for c in _TD_RE.finditer(r.group(1))]
        for r in _TR_RE.finditer(m.group(1))
    ]
    rows = [r for r in rows if len(r) == 2]
    if len(rows) != 12:
        raise RuntimeError(f"LA: expected 12 Creed rows, found {len(rows)}")
    # The heading cells carry the Catechism's own footnote references
    # (`<sup>198</sup>`), which are apparatus for the CCC's notes and not part
    # of either Creed's name.
    header = [_SUP_RE.sub("", c) for c in rows[0]]
    body = rows[1:]
    prayers: list[Prayer] = []
    for column, slug in enumerate(("apostles-creed", "nicene-creed")):
        lines = [line for row in body for line in br_segments(row[column])]
        if not lines:
            raise RuntimeError(f"LA: {slug} column is empty")
        prayers.append(
            Prayer(
                n=column + 1,
                slug=slug,
                title=flatten(header[column]),
                blocks=[BlockOut("prose", " ".join(lines), html=line_html(lines))],
            )
        )
    return prayers


def build_our_father_la(html_text: str) -> Prayer:
    """The Our Father, from the blockquote the Latin Catechism prints at 2759.

    The first blockquote on that page IS the prayer -- the section opens by
    saying the liturgy kept Matthew's text and then prints it. Every other
    occurrence of "Pater noster" in the Latin Catechism is commentary quoting
    a phrase, which is why this matches the blockquote rather than the words.
    """
    m = _LA_OUR_FATHER_RE.search(html_text)
    if m is None or "Pater noster" not in flatten(m.group(1)):
        raise RuntimeError("LA: could not locate the Our Father blockquote at 2759")
    lines = br_segments(m.group(1))
    return Prayer(
        n=1,
        slug="our-father",
        title="Pater Noster",
        blocks=[BlockOut("prose", " ".join(lines), html=line_html(lines))],
    )


# --------------------------------------------------------------------------
# The other table families -- Spanish and Swedish
# --------------------------------------------------------------------------
#
# ENGLISH IS NOT THE ONLY TABLE, AND THE OTHER TWO DIFFER IN WAYS THAT ARE
# FACTS ABOUT THE SOURCE. Spanish prints a 25-row table; Swedish prints a
# three-cell one. Neither is a variation on `extract_en_rows` worth
# parameterizing, because what differs is not the cell count but WHICH
# PRAYERS ARE THERE -- and that is the part a shared reader would have had to
# assert away.
#
# WHY THE TITLE IS READ POSITIONALLY HERE AND NOT BY `split_title`. Both
# mirrors wrap a title in emphasis AND colour, in either nesting order
# (`<b><font>` and `<font><b>` both occur, sometimes within one row), and
# Spanish splits one Latin title across two separate wrappers to typeset its
# ligature (`Ave, Marí` + `æ`). `split_title`'s regexes match a specific tag
# order and fail on 22 of Spanish's 25 rows. The structural fact both mirrors
# DO respect is simpler and needs no tag vocabulary: the title, and a rubric
# where there is one, sit before the cell's first `<p>`.

_FIRST_P_RE = re.compile(r"<p[\s>]", re.IGNORECASE)


def split_cell_head(cell_html: str) -> tuple[str, str | None, str]:
    """A table cell as `(title, rubric, body_html)`.

    The head is everything before the first `<p>`; its `<br/>`-separated
    segments are the title and, where the source prints one, the rubric --
    which is how the three Eastern-rite prayers name their tradition
    ("(Tradición copta)") on their own line under the title.

    A PARENTHETICAL ON THE TITLE'S OWN LINE STAYS IN THE TITLE. Spanish
    prints "Regina Caeli (en tiempo pascual)" as one line and
    "Oración del incienso" / "(Tradición copta)" as two; splitting the first
    would be reading a rubric the source did not set apart, so the `<br/>` is
    taken as the whole of the signal."""
    m = _FIRST_P_RE.search(cell_html)
    head, body = (
        (cell_html[: m.start()], cell_html[m.start() :]) if m else (cell_html, "")
    )
    segs = br_segments(head)
    if not segs:
        raise ValueError(f"no title before the body in cell: {cell_html[:120]!r}")
    return segs[0], (segs[1] if len(segs) > 1 else None), body


def extract_table_rows(
    html_text: str, start_anchor: str, end_anchor: str, cells_per_row: int, lang: str
) -> list[list[str]]:
    """The appendix's prayer rows, for a mirror that typesets it as a table.

    `cells_per_row` is 2 for Spanish (vernacular | Latin) and 3 for Swedish,
    which puts an empty spacer column between the two. Rows with any other
    cell count are the heading rows."""
    start, end = html_text.find(start_anchor), html_text.find(end_anchor)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(
            f"{lang}: could not locate appendix boundaries (start={start}, "
            f"end={end}) -- source page structure may have changed"
        )
    rows: list[list[str]] = []
    for m in _TR_RE.finditer(html_text[start:end]):
        cells = [c.group(1) for c in _TD_RE.finditer(m.group(1))]
        if len(cells) != cells_per_row:
            continue
        if not any(flatten(c) for c in cells):
            continue  # the trailing spacer row
        rows.append(cells)
    return rows


# A mystery group, for the mirrors whose Rosary cell `parse_rosary_body`
# cannot read. That function keys on "wholly emphasized AND carrying a `<br/>`",
# which is a statement about MARKUP, and the markup is what varies:
#
#   - Spanish emphasizes the whole heading but prints one of its four rubrics
#     on the same line, with no `<br/>` -- "Misterios luminosos (jueves)" --
#     so three groups match and the fourth silently does not.
#   - Swedish emphasizes only the RUBRIC, leaving the name outside the tag
#     ("Gl&auml;djens mysterier<i><br />(m&aring;ndag och l&ouml;rdag)</i>"),
#     so none of its four match at all.
#   - Spanish numbers its five mysteries "1." to "5."; Swedish numbers none.
#
# THE RULE HERE IS STRUCTURAL AND SURVIVES ALL OF THAT: a mystery group is a
# short heading whose NEXT paragraph is the list of five mysteries, one per
# printed line. Five is the doctrinally settled count, which is what makes it
# safe to key on -- and it is also what rejects the two paragraphs that keep
# fooling markup rules, the "Oremos"/"L&aring;t oss bedja" heading over the
# concluding prayer and the "Oraci&oacute;n tras el rosario" title above it:
# both are short and emphasized, and neither is followed by five lines.
_TRAILING_PAREN_RE = re.compile(r"^(.*?)\s*(\([^()]*\))\s*$", re.DOTALL)

#: A heading is short. Guards against a long prose paragraph that happens to
#: precede a five-line prayer being read as a mystery group.
_GROUP_HEADING_MAX = 100


def split_group_heading(raw: str) -> tuple[str, str | None]:
    """A mystery group's printed name and its weekday rubric.

    The source sets them apart with a `<br/>` where it can and with nothing
    but a parenthesis where it cannot, so both are read -- the `<br/>` first,
    because that is the explicit signal, and a trailing parenthesis only when
    there is no `<br/>` to go on."""
    segs = br_segments(raw)
    if len(segs) > 1:
        return segs[0], segs[1]
    m = _TRAILING_PAREN_RE.match(segs[0]) if segs else None
    return (m.group(1).strip(), m.group(2)) if m else (segs[0], None)


def parse_rosary_body_marked(
    paragraphs: list[str],
) -> tuple[list[MysteryGroup], list[BlockOut]]:
    """`parse_rosary_body` for the mirrors whose group headings vary. See the
    comment above for why the discriminator is the FOLLOWING paragraph's shape
    rather than this one's markup."""
    live = [raw for raw in paragraphs if flatten(raw)]
    groups: list[MysteryGroup] = []
    consumed = 0
    i = 0
    while i < len(live) - 1 and len(groups) < 4:
        heading, following = live[i], live[i + 1]
        items = br_segments(following)
        # Five mysteries per group -- see `parse_rosary_body` on why a sixth
        # segment is a wrapped fifth item rather than a sixth mystery.
        if len(flatten(heading)) > _GROUP_HEADING_MAX or not 5 <= len(items) <= 6:
            i += 1
            continue
        if len(items) > 5:
            items = [*items[:4], " ".join(items[4:])]
        name, rubric = split_group_heading(heading)
        groups.append(
            MysteryGroup(
                name, rubric, [MysteryItem(title=item, meditation="") for item in items]
            )
        )
        i += 2
        consumed = i
    trailer: list[BlockOut] = []
    for raw in live[consumed:]:
        process_paragraph(raw, trailer)
    return groups, trailer


ES_START_ANCHOR = 'name="ORACIONES COMUNES"'
# The double space between FORMULAS and DE is the source's, and it is what
# makes this string unique in the file -- verified by count, not assumed.
ES_END_ANCHOR = 'name="F&Oacute;RMULAS  DE DOCTRINA CAT&Oacute;LICA"'


def build_prayers_table(
    html_text: str,
    *,
    lang: str,
    start_anchor: str,
    end_anchor: str,
    slugs: list[str],
    cells_per_row: int = 2,
) -> list[Prayer]:
    """Appendix A from a mirror that typesets it as a table.

    `slugs` IS THE WHOLE PER-LANGUAGE STATEMENT and is checked against the row
    count: Spanish's is 25 entries because it prints an Our Father the others
    leave to the Catechism, Swedish's is 22 because it prints neither the
    Syro-Maronite nor the Byzantine prayer. Both are facts about those pages,
    so a count that stops matching means the parse moved, not the source.

    Swedish sets an empty spacer column between the vernacular and the Latin,
    so the Latin is the LAST cell rather than the second."""
    rows = extract_table_rows(html_text, start_anchor, end_anchor, cells_per_row, lang)
    if len(rows) != len(slugs):
        raise RuntimeError(
            f"{lang}: expected {len(slugs)} prayer rows, found {len(rows)}"
        )
    prayers: list[Prayer] = []
    for i, cells in enumerate(rows):
        slug = slugs[i]
        vern_html, latin_html = cells[0], cells[-1]
        title, rubric, body = split_cell_head(vern_html)
        if slug == "rosary":
            groups, blocks = parse_rosary_body_marked(top_paragraphs(body))
        else:
            blocks, _ = parse_simple_body(top_paragraphs(body))
            groups = []
        latin = None
        if flatten(latin_html):
            latin_title, _, latin_body = split_cell_head(latin_html)
            latin = LatinText(latin_title, latin_blocks_en(latin_body))
        prayers.append(
            Prayer(
                n=i + 1,
                slug=slug,
                title=title,
                rubric=rubric,
                blocks=blocks,
                latin=latin,
                groups=groups,
            )
        )
    return prayers


def build_prayers_es(html_text: str) -> list[Prayer]:
    """Spanish: a two-cell table like English, 25 rows -- the extra one is the
    Our Father (`ES_APPENDIX_SLUGS`), which also gives this edition a Latin
    *Pater Noster* the English and Portuguese appendices do not print."""
    return build_prayers_table(
        html_text,
        lang="es",
        start_anchor=ES_START_ANCHOR,
        end_anchor=ES_END_ANCHOR,
        slugs=ES_APPENDIX_SLUGS,
    )


# Swedish carries no `name=` anchors at all, so the appendix is bounded on its
# printed headings. Both strings are matched WITH their surrounding markup,
# which is what makes them unique: the bare heading text also appears in the
# table of contents near the top of the file.
SV_START_ANCHOR = (
    '<p align="center"><b><font color="#663300">A) VANLIGA B&Ouml;NER</font></b></p>'
)
SV_END_ANCHOR = '<font color="#663300"><b>B) KATOLSKA L&Auml;ROFORMULERINGAR</b></fon'

#: Swedish prints neither the Syro-Maronite farewell nor the Byzantine prayer
#: for the deceased -- it keeps the Coptic one and goes straight from it to the
#: Acts. Measured against the page, not inferred from a short row count.
SV_ABSENT = frozenset(
    {"syro-maronite-farewell-to-the-altar", "byzantine-prayer-for-the-deceased"}
)
SV_APPENDIX_SLUGS = [s for s in APPENDIX_SLUGS if s not in SV_ABSENT]


def build_prayers_sv(html_text: str) -> list[Prayer]:
    """Swedish: a THREE-cell table -- vernacular, an empty spacer, Latin."""
    return build_prayers_table(
        html_text,
        lang="sv",
        start_anchor=SV_START_ANCHOR,
        end_anchor=SV_END_ANCHOR,
        slugs=SV_APPENDIX_SLUGS,
        cells_per_row=3,
    )


# --------------------------------------------------------------------------
# The paragraph-stream mirrors -- German and Hungarian
# --------------------------------------------------------------------------
#
# These lay the appendix out the way Portuguese does -- a flat run of `<p>`,
# the vernacular prayers first and then a trailing block of Latin ones -- but
# neither can use `split_pt_chunks`, whose `_TITLE_RE` demands that a
# paragraph OPEN with `<b`. German wraps its titles `<font><b>` about as often
# as `<b><font>`, and matching a tag order finds a minority of them.
#
# A TITLE IS A PARAGRAPH THAT IS NOTHING BUT ITS EMPHASIS. That rule needs no
# tag vocabulary and no ordering: flatten the paragraph, flatten everything
# inside its `<b>`/`<i>` spans, and a title is where the two are equal. A body
# line that merely contains bold does not qualify, which is what separates a
# real heading from an emphasized phrase inside a prayer.
#
# THAT LEAVES SEVEN FALSE POSITIVES IN GERMAN AND THEY ARE OF TWO KINDS.
# Four are the Rosary's own mystery-group headings, which are titles in every
# sense except that they head a section of one prayer rather than a prayer;
# those are recognized structurally, by being followed by their five
# mysteries, exactly as `parse_rosary_body_marked` recognizes them. The other
# three are liturgical directions and a cross-reference that this mirror
# happens to emphasize in one place and not in another -- "Lasset uns beten."
# is emphasized inside the Angelus and plain inside the Regina caeli and the
# Rosary; "Ehre sei dem Vater ..." with a trailing ellipsis is a POINTER to
# the prayer whose real title, without the ellipsis, sits eleven paragraphs
# earlier. No markup tells those apart from a heading, because in this mirror
# there is no difference in the markup; they are listed, with that evidence,
# the way `INDEX_DUPLICATE_SLUGS` lists the encyclical vatican.va indexes
# twice.

_EMPHASIS_SPAN_RE = re.compile(r"<(b|i)[^>]*>(.*?)</\1>", re.IGNORECASE | re.DOTALL)


def is_title_paragraph(raw: str) -> bool:
    """Whether this paragraph is nothing but its own emphasis."""
    text = flatten(raw)
    if not text:
        return False
    spans = [flatten(m.group(2)) for m in _EMPHASIS_SPAN_RE.finditer(raw)]
    return bool(spans) and flatten(" ".join(spans)) == text


def mystery_heading_indexes(paragraphs: list[str], lang: str) -> set[int]:
    """Indexes of the paragraphs that head a Rosary mystery group.

    TWO CONDITIONS, AND THE SECOND IS WHAT MAKES IT SAFE. A heading is
    followed by its five mysteries on five printed lines -- and it NAMES THE
    WEEKDAYS the set is prayed on, which is the part that tells it from a
    prayer title. "Five following lines" alone is not enough and quietly ate
    two German prayers: the Gloria Patri and the prayer to one's guardian
    angel are each five printed lines long, so their titles looked like
    mystery headings and their prayers vanished from the collection.

    The weekday vocabulary is `_WEEKDAY_STEMS`, which the Rosary's own
    `days` field already depends on, so this adds no table that was not
    already being maintained -- only a Latin entry, for the trailing Latin
    block's "in feria secunda et sabbato"."""
    stems = _WEEKDAY_STEMS.get(lang)
    if stems is None:
        return set()
    out: set[int] = set()
    for i in range(len(paragraphs) - 1):
        if not is_title_paragraph(paragraphs[i]):
            continue
        if not 5 <= len(br_segments(paragraphs[i + 1])) <= 6:
            continue
        if parse_rubric_days(flatten(paragraphs[i]), lang):
            out.add(i)
    return out


def _has_leading_title(raw: str) -> bool:
    """Whether this paragraph OPENS with a title, body following in the same
    paragraph -- the Portuguese/Hungarian Latin shape."""
    try:
        split_title(raw)
    except ValueError:
        return False
    return True


def build_prayers_stream(
    html_text: str,
    *,
    lang: str,
    start_anchor: str,
    end_anchor: str,
    slugs: list[str],
    not_titles: frozenset[str] = frozenset(),
    latin_slugs: list[str] | None = None,
    latin_shape: str = "block",
) -> list[Prayer]:
    """Appendix A from a mirror that prints it as a paragraph stream."""
    start, end = html_text.find(start_anchor), html_text.find(end_anchor)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(
            f"{lang}: could not locate appendix boundaries (start={start}, end={end})"
        )
    region = [q for q in top_paragraphs(html_text[start:end]) if flatten(q)]
    latin_at = next(
        (k for k, q in enumerate(region) if flatten(q).startswith("Signum Crucis")),
        None,
    )
    if latin_at is None:
        raise RuntimeError(f"{lang}: could not locate the trailing Latin block")
    vern, latin_paras = region[:latin_at], region[latin_at:]

    # THE LATIN BLOCK'S SHAPE IS ITS OWN AND THE TWO MIRRORS DIFFER. German
    # gives each Latin prayer a title paragraph and then its body in further
    # paragraphs -- 87 paragraphs for 21 entries. Hungarian prints the
    # Portuguese way, title and body together in ONE paragraph, with only the
    # Rosary's mystery groups and the Acts spilling into extra ones -- 52
    # paragraphs for the same 21. Reading either with the other's rule
    # miscounts by a factor and reports a boundary problem.
    #
    # `inline` therefore chunks on "this paragraph opens with a title", which
    # `split_title` already answers and which lands on exactly 21 of
    # Hungarian's 52; `block` chunks on "this paragraph IS a title".
    expected_latin = latin_slugs if latin_slugs is not None else LATIN_SLUGS
    if latin_shape == "inline":
        latin_title_at = [k for k, q in enumerate(latin_paras) if _has_leading_title(q)]
    else:
        latin_mysteries = mystery_heading_indexes(latin_paras, "la")
        latin_title_at = [
            k
            for k, q in enumerate(latin_paras)
            if is_title_paragraph(q)
            and k not in latin_mysteries
            and flatten(q) not in LATIN_NOT_TITLES
        ]
    if len(latin_title_at) != len(expected_latin):
        found = [flatten(latin_paras[k])[:40] for k in latin_title_at]
        raise RuntimeError(
            f"{lang}: expected {len(expected_latin)} Latin entries, "
            f"found {len(latin_title_at)}: {found}"
        )
    latin_by_slug: dict[str, LatinText] = {}
    for i, k in enumerate(latin_title_at):
        stop = (
            latin_title_at[i + 1] if i + 1 < len(latin_title_at) else len(latin_paras)
        )
        if latin_shape == "inline":
            title, first_body = split_title(latin_paras[k])
            rest = [first_body, *latin_paras[k + 1 : stop]]
        else:
            title, rest = flatten(latin_paras[k]), list(latin_paras[k + 1 : stop])
        latin_by_slug[expected_latin[i]] = LatinText(
            title,
            [
                BlockOut("prose", flatten(q), html=line_html(br_segments(q)))
                for q in rest
                if flatten(q)
            ],
        )

    mysteries = mystery_heading_indexes(vern, lang)
    title_at = [
        k
        for k, q in enumerate(vern)
        if is_title_paragraph(q) and k not in mysteries and flatten(q) not in not_titles
    ]
    if len(title_at) != len(slugs):
        found = [flatten(vern[k])[:40] for k in title_at]
        raise RuntimeError(
            f"{lang}: expected {len(slugs)} prayer titles, found {len(title_at)}: {found}"
        )

    prayers: list[Prayer] = []
    for i, k in enumerate(title_at):
        slug = slugs[i]
        stop = title_at[i + 1] if i + 1 < len(title_at) else len(vern)
        title = flatten(vern[k])
        body = vern[k + 1 : stop]
        if slug == "rosary":
            groups, blocks = parse_rosary_body_marked(body)
        else:
            blocks, _ = parse_simple_body(body)
            groups = []
        prayers.append(
            Prayer(
                n=i + 1,
                slug=slug,
                title=title,
                blocks=blocks,
                latin=latin_by_slug.get(slug),
                groups=groups,
            )
        )
    return prayers


#: Emphasized paragraphs in the trailing LATIN block that are not prayer
#: titles. Shared rather than per-language: every mirror prints the same Latin
#: appendix, so these are the same three strings wherever it appears --
#: "Oremus." heads a collect inside the Angelus, the Regina caeli and the
#: Rosary, and "Oratio ad finem Rosarii dicenda" heads the Rosary's own
#: concluding prayer. The four "Mysteria ..." group headings are excluded
#: structurally instead, by naming their ferial weekdays.
LATIN_NOT_TITLES = frozenset({"Oremus.", "Oratio ad finem Rosarii dicenda"})


DE_START_ANCHOR = '<font color="#663300"><b> A) ALLGEMEINE GEBETE</b></font>'
DE_END_ANCHOR = (
    '<p align="center"><font color="#663300"><b>B) FORMELN DER KATHOLISCHEN LEHRE</b>'
    "</font>"
)

#: Emphasized paragraphs in the German appendix that are not prayer titles.
#: See the section comment above for the evidence on each.
DE_NOT_TITLES = frozenset(
    {
        "Lasset uns beten.",  # a direction, inside the Angelus
        "Ehre sei dem Vater \u2026",  # a pointer to the prayer at index 2
        "Schlussgebet",  # the Rosary's own concluding-prayer heading
    }
)


def build_prayers_de(html_text: str) -> list[Prayer]:
    return build_prayers_stream(
        html_text,
        lang="de",
        start_anchor=DE_START_ANCHOR,
        end_anchor=DE_END_ANCHOR,
        slugs=APPENDIX_SLUGS,
        not_titles=DE_NOT_TITLES,
    )


HU_START_ANCHOR = '<p align="center">A) ALAPVET&#x150; IM&Aacute;DS&Aacute;GOK</p>'
HU_END_ANCHOR = (
    '<font color="#663300" size="4">B) A KATOLIKUS TAN&Iacute;T&Aacute;S '
    "FORMUL&Aacute;I</font>"
)


def build_prayers_hu(html_text: str) -> list[Prayer]:
    return build_prayers_stream(
        html_text,
        lang="hu",
        start_anchor=HU_START_ANCHOR,
        end_anchor=HU_END_ANCHOR,
        slugs=APPENDIX_SLUGS,
        latin_shape="inline",
    )


# --------------------------------------------------------------------------
# FR: alternating vernacular and Latin blocks
# --------------------------------------------------------------------------
#
# THE START ANCHOR IS `APPENDICE` AND NOT `A) PRIERES COMMUNES`, which is the
# trap this mirror sets. Both anchors exist and both are unique, but the one
# that names the section sits about 34 KB INTO it -- after the first five
# prayers and their Latin, in front of the Angelus. Anchoring on it the way
# English and Italian do silently drops the Sign of the Cross, the Doxology,
# the Hail Mary, the prayer to one's guardian angel and the Eternal Rest, and
# the parse still succeeds, just nineteen prayers long.
#
# THE LAYOUT IS NEITHER A TABLE NOR ONE VERNACULAR RUN FOLLOWED BY ONE LATIN
# RUN. French alternates: a few prayers in French, the same few in Latin, a
# few more in French, and so on. The block sizes are irregular and are a
# property of this page, so they are stated here and asserted rather than
# inferred -- 24 vernacular prayers in ten blocks, and the same blocks again
# in Latin except the Eastern-rite three, for which no mirror prints any.
#
# POSITION IS THE ONLY THING THAT DISAMBIGUATES, which is why the walk cannot
# be replaced by matching title text. Six French titles are printed in
# untranslated Latin -- MAGNIFICAT, BENEDICTUS, TE DEUM, REGINA CAELI, SALVE
# REGINA, SUB TUUM -- and are byte-identical to the Latin entries' own titles
# a few paragraphs later. Only which block they fall in tells them apart.
FR_START_ANCHOR = 'name="APPENDICE"'
FR_END_ANCHOR = 'name="B) FORMULES DE LA DOCTRINE CATHOLIQUE"'

#: Prayers per alternating block, in print order. The Latin side repeats these
#: except for the Eastern-rite block, which has no Latin at all.
FR_BLOCKS = (5, 2, 2, 2, 1, 1, 2, 2, 3, 4)
FR_EASTERN_BLOCK = 8

#: Emphasized paragraphs that are not prayer titles but ARE the prayer's text:
#: the two ellipsis forms are POINTERS to prayers printed in full earlier
#: ("Gloire au Pere..." inside the Angelus), and "Prions." / "Oremus." head the
#: collect that closes the Rosary in each language.
FR_NOT_TITLES = frozenset(
    {
        "Gloire au Père...",
        "Glória Patri...",
        "Prions.",
        "Orémus.",
    }
)

#: ...and the one that is not text at all. "A) PRIERES COMMUNES" is the
#: misplaced section heading described above, emphasized like a title 34 KB
#: into the section it names. IT HAS TO BE DROPPED AND NOT MERELY DENIED
#: TITLEHOOD: everything that is not a title joins the entry above it, and the
#: entry above this one is the LATIN Requiem aeternam -- so the French edition
#: shipped "A) PRIÈRES COMMUNES" as a second Latin block of the Eternal Rest,
#: the only Latin companion in fourteen editions to carry a line no other
#: edition has. Found by folding the fourteen Latin witnesses to one prayer
#: against each other (2026-09-03); nothing per-edition could see it, because
#: within French alone a stray block is indistinguishable from a short one.
FR_PAGE_FURNITURE = frozenset({"A) PRIÈRES COMMUNES"})


def build_prayers_fr(html_text: str) -> list[Prayer]:
    start, end = html_text.find(FR_START_ANCHOR), html_text.find(FR_END_ANCHOR)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(
            f"FR: could not locate appendix boundaries (start={start}, end={end})"
        )
    paras = [q for q in top_paragraphs(html_text[start:end]) if flatten(q)]

    # Collect entries as (title, rubric, body paragraphs). A title paragraph
    # that merely opens a parenthesis is the previous title's RUBRIC -- the
    # three Eastern-rite prayers name their tradition on a line of their own,
    # emphasized exactly like a heading.
    entries: list[tuple[str, str | None, list[str]]] = []
    for raw in paras:
        text = flatten(raw)
        if text in FR_PAGE_FURNITURE:
            continue
        if not is_title_paragraph(raw) or text in FR_NOT_TITLES:
            if entries:
                entries[-1][2].append(raw)
            continue
        if text.startswith("(") and entries and entries[-1][1] is None:
            entries[-1] = (entries[-1][0], text, entries[-1][2])
            continue
        entries.append((text, None, []))

    wanted = len(APPENDIX_SLUGS) + len(LATIN_SLUGS)
    if len(entries) != wanted:
        raise RuntimeError(
            f"FR: expected {wanted} entries (24 French + 21 Latin), "
            f"found {len(entries)}: {[e[0][:28] for e in entries]}"
        )

    # Walk the alternating blocks, handing each entry to the vernacular or the
    # Latin side. Both sides consume their slugs in the appendix's own order.
    vern: list[tuple[str, str | None, list[str]]] = []
    latin: list[tuple[str, str | None, list[str]]] = []
    at = 0
    for i, size in enumerate(FR_BLOCKS):
        vern += entries[at : at + size]
        at += size
        if i == FR_EASTERN_BLOCK:
            continue  # no Latin for the Eastern-rite prayers
        latin += entries[at : at + size]
        at += size
    if at != len(entries):
        raise RuntimeError(f"FR: block sizes consumed {at} of {len(entries)} entries")

    # BOTH COLUMNS OF ONE PAGE GO THROUGH ONE READER. This built the Latin as
    # a flat run of `prose` until 2026-09-03, while the vernacular beside it
    # went through `parse_simple_body` -- so the French Angelus came out as
    # fourteen versicle/response blocks in French and ONE block in Latin, with
    # the `D.` and `C.` the page prints in both columns surviving as labels on
    # one side and as literal text on the other. The same page, the same
    # prayer, the same markers, read two ways. Nothing per-edition could see
    # it: within French alone each column is self-consistent.
    #
    # `parse_simple_body` adds only the UK/USA variant markers over
    # `process_paragraph`, and those are English-only, so the Latin cannot
    # reach them.
    latin_by_slug = {
        slug: LatinText(title, parse_simple_body(body)[0])
        for slug, (title, _, body) in zip(LATIN_SLUGS, latin, strict=True)
    }

    prayers: list[Prayer] = []
    for i, (slug, (title, rubric, body)) in enumerate(
        zip(APPENDIX_SLUGS, vern, strict=True)
    ):
        if slug == "rosary":
            groups, blocks = parse_rosary_grouped_paragraphs(body)
        else:
            blocks, _ = parse_simple_body(body)
            groups = []
        prayers.append(
            Prayer(
                n=i + 1,
                slug=slug,
                title=title,
                rubric=rubric,
                blocks=blocks,
                latin=latin_by_slug.get(slug),
                groups=groups,
            )
        )
    return prayers


# --------------------------------------------------------------------------
# The interleaved mirrors -- Slovenian and Romanian
# --------------------------------------------------------------------------
#
# These alternate one prayer at a time rather than in blocks: the vernacular
# entry, then the same prayer in Latin, then the next. That is French's shape
# with every block size 1, and it would need no table of its own -- except
# that neither page is regular, and the irregularities are content:
#
#   - Slovenian prints NO Eastern-rite prayers at all, and prints the Acts of
#     Faith, Hope and Love in LATIN ONLY, with a blank cell where the
#     Slovenian would be. Only the Act of Contrition has both.
#   - Romanian prints two wordings for each Act, one "(din Catehismul mic)"
#     and one "(Din cartile de rugaciuni)", separated by a printed `/*/`.
#
# So the sequence is stated per language as (slug, has vernacular, has Latin)
# and walked. A prayer with no vernacular is not carried by the vernacular
# edition at all -- `prayer.common.la` already holds that Latin, and an
# edition of Slovenian prayers whose Act of Faith is in Latin would be
# offering a reader something they did not ask for.
_SEPARATOR_RE = re.compile(r"^[\s/*]+$")


def parse_rosary_any(
    paragraphs: list[str],
) -> tuple[list[MysteryGroup], list[BlockOut]]:
    """The Rosary, whichever of the two paragraph shapes this mirror uses.

    Slovenian gives a mystery group's heading its own paragraph and its five
    mysteries the next one; Romanian puts the heading and all five into one.
    Both readers are structural and neither matches the other's shape, so
    whichever finds the four groups is the right one -- and if neither does,
    the marked reader's answer stands, which is the Rosary as flowing text."""
    groups, trailer = parse_rosary_grouped_paragraphs(paragraphs)
    if len(groups) == 4:
        return groups, trailer
    return parse_rosary_body_marked(paragraphs)


def build_prayers_interleaved(
    html_text: str,
    *,
    lang: str,
    start_anchor: str,
    end_anchor: str,
    sequence: list[tuple[str, bool, bool]],
    not_titles: frozenset[str] = frozenset(),
) -> list[Prayer]:
    start, end = html_text.find(start_anchor), html_text.find(end_anchor)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(
            f"{lang}: could not locate appendix boundaries (start={start}, end={end})"
        )
    paras = [q for q in top_paragraphs(html_text[start:end]) if flatten(q)]
    skip = not_titles | LATIN_NOT_TITLES
    entries: list[tuple[str, list[str]]] = []
    rubrics: dict[int, str] = {}
    for raw in paras:
        text = flatten(raw)
        if is_title_paragraph(raw) and text not in skip:
            # A "title" that merely opens a parenthesis is the previous
            # title's RUBRIC -- the three Eastern-rite prayers name their
            # tradition on a line of their own, emphasized like a heading.
            if text.startswith("(") and entries:
                rubrics.setdefault(len(entries) - 1, text)
                continue
            entries.append((text, []))
        elif entries:
            entries[-1][1].append(raw)

    wanted = sum(bool(v) + bool(la) for _, v, la in sequence)
    if len(entries) != wanted:
        raise RuntimeError(
            f"{lang}: expected {wanted} entries, found {len(entries)}: "
            f"{[e[0][:26] for e in entries]}"
        )

    prayers: list[Prayer] = []
    at = 0
    n = 0
    for slug, has_vern, has_latin in sequence:
        vern = entries[at] if has_vern else None
        at += 1 if has_vern else 0
        latin_entry = entries[at] if has_latin else None
        at += 1 if has_latin else 0
        if vern is None:
            continue  # Latin-only here; `prayer.common.la` carries it
        title, body = vern
        rubric = rubrics.get(entries.index(vern))
        # The printed `/*/` between Romanian's two wordings is a separator,
        # not text. The rubric paragraphs around it stay, because they are
        # what say which wording is which.
        body = [q for q in body if not _SEPARATOR_RE.match(flatten(q))]
        if slug == "rosary":
            groups, blocks = parse_rosary_any(body)
        else:
            blocks, _ = parse_simple_body(body)
            groups = []
        latin = None
        if latin_entry is not None:
            latin = LatinText(
                latin_entry[0],
                [
                    BlockOut("prose", flatten(q), html=line_html(br_segments(q)))
                    for q in latin_entry[1]
                    if flatten(q)
                ],
            )
        n += 1
        prayers.append(
            Prayer(
                n=n,
                slug=slug,
                title=title,
                rubric=rubric,
                blocks=blocks,
                latin=latin,
                groups=groups,
            )
        )
    return prayers


SL_START_ANCHOR = (
    '<p align="center"><b><font color="#663300" size="4">A) SPLO&#x160;NE MOLITVE'
    "</font></b></p>"
)
SL_END_ANCHOR = (
    '<p align="center"><font color="#663300" size="4"><b>B) OBRAZCI '
    "KATOLI&#x160;KEGA NAUKA</b></font></p>"
)

#: Slovenian prints no Eastern-rite prayers, and prints the first three Acts
#: in Latin only.
SL_ABSENT = frozenset(
    {
        "coptic-incense-prayer",
        "syro-maronite-farewell-to-the-altar",
        "byzantine-prayer-for-the-deceased",
    }
)
SL_LATIN_ONLY = frozenset({"act-of-faith", "act-of-hope", "act-of-love"})
SL_SEQUENCE = [
    (slug, slug not in SL_LATIN_ONLY, True)
    for slug in APPENDIX_SLUGS
    if slug not in SL_ABSENT
]
SL_NOT_TITLES = frozenset(
    {
        "A) SPLOŠNE MOLITVE",
        "Prosi za nas sveta božja Porodnica.",
        "Ora pro nobis, sancta Dei génetrix.",
    }
)


def build_prayers_sl(html_text: str) -> list[Prayer]:
    return build_prayers_interleaved(
        html_text,
        lang="sl",
        start_anchor=SL_START_ANCHOR,
        end_anchor=SL_END_ANCHOR,
        sequence=SL_SEQUENCE,
        not_titles=SL_NOT_TITLES,
    )


RO_START_ANCHOR = "<p>A) Rug&#x103;ciuni obi&#x15f;nuite</p>"
RO_END_ANCHOR = (
    "<p>B) Formule de &icirc;nv&#x103;&#x163;&#x103;tur&#x103; catolic&#x103;</p>"
)
RO_SEQUENCE = [(slug, True, slug not in NO_LATIN_SLUGS) for slug in APPENDIX_SLUGS]
#: The Rosary's own concluding-prayer heading, which sits between the Rosary
#: and its Latin counterpart and is emphasized exactly like a prayer title --
#: the Romanian counterpart of `LATIN_NOT_TITLES`' "Oratio ad finem Rosarii
#: dicenda".
RO_NOT_TITLES = frozenset({"Rugăciune la sfârşitul sfântului Rozariu"})


def build_prayers_ro(html_text: str) -> list[Prayer]:
    return build_prayers_interleaved(
        html_text,
        lang="ro",
        start_anchor=RO_START_ANCHOR,
        end_anchor=RO_END_ANCHOR,
        sequence=RO_SEQUENCE,
        not_titles=RO_NOT_TITLES,
    )


IT_START_ANCHOR = 'name="A) PREGHIERE COMUNI"'
IT_END_ANCHOR = 'name="B) FORMULE DI DOTTRINA CATTOLICA"'

#: Italian prints all three Eastern-rite prayers inside ONE `<p>`, separated
#: by a doubled `<br/>` and each headed by its own `<b>` title and `<i>`
#: rubric -- where every other mirror gives each its own paragraph. So the
#: Italian appendix is 22 top-level paragraphs holding 24 prayers, and a
#: paragraph walk alone reads the three as one entry with a fourteen-hundred
#: character body under the Coptic title.
#: The rubric each of the three names its tradition with. THE LANDMARK IS THE
#: RUBRIC AND NOT THE `<b>` TITLE, because Italian's bold tags in this
#: paragraph are unbalanced -- three `<b>` opens whose closes land after the
#: body, so splitting on them yields thirteen pieces rather than three. The
#: rubric is a plain parenthesis in running text and appears exactly three
#: times, once per prayer.
_IT_TRADITION_RE = re.compile(r"\(Tradizione[^)]*\)", re.IGNORECASE)


def split_italian_eastern(raw: str) -> list[tuple[str, str | None, str]]:
    """The merged Eastern-rite paragraph as its three prayers.

    Each prayer is a title, a `(Tradizione ...)` rubric and a body. The title
    runs from the preceding stanza gap -- a doubled `<br/>`, which is what
    separates the three -- up to the rubric, and the body runs from the rubric
    to the next prayer's title."""
    rubrics = list(_IT_TRADITION_RE.finditer(raw))
    if len(rubrics) != 3:
        raise RuntimeError(
            f"IT: expected 3 Eastern-rite tradition rubrics, found {len(rubrics)}"
        )
    gaps = [m.end() for m in _DOUBLE_BR_RE.finditer(raw)]
    starts = [max([g for g in gaps if g < m.start()], default=0) for m in rubrics]
    out: list[tuple[str, str | None, str]] = []
    for k, m in enumerate(rubrics):
        title = flatten(raw[starts[k] : m.start()])
        body_end = starts[k + 1] if k + 1 < len(starts) else len(raw)
        out.append((title, m.group(0), raw[m.end() : body_end]))
    return out


#: A group heading's rubric line, which is what marks a heading in a Rosary
#: printed as ONE paragraph: a line whose next line opens a parenthesis.
_RUBRIC_LINE_RE = re.compile(r"^\s*\(")


def parse_rosary_grouped_paragraphs(
    paragraphs: list[str],
) -> tuple[list[MysteryGroup], list[BlockOut]]:
    """The Rosary for a mirror that gives each mystery group ONE paragraph.

    French prints a group's name, its weekday rubric and all five mysteries as
    a single run of seven `<br/>`-separated lines, where German and Spanish
    give the heading its own paragraph and Italian gives the whole Rosary one.
    The signal is the same in every case -- a name, then a parenthesized
    rubric, then the five mysteries -- so what varies is only where the
    paragraph breaks fall.

    The closing prayer's own paragraph is what this must not match, and does
    not: it opens "Priere a la fin du Rosaire" and its second line is the
    versicle, not a parenthesis."""
    groups: list[MysteryGroup] = []
    trailer: list[BlockOut] = []
    for raw in paragraphs:
        segs = br_segments(raw)
        if (
            len(groups) < 4
            and len(segs) >= 3
            and _RUBRIC_LINE_RE.match(segs[1])
            and 5 <= len(segs) - 2 <= 6
        ):
            items = segs[2:]
            if len(items) > 5:
                items = [*items[:4], " ".join(items[4:])]
            groups.append(
                MysteryGroup(
                    segs[0],
                    segs[1],
                    [MysteryItem(title=item, meditation="") for item in items],
                )
            )
            continue
        process_paragraph(raw, trailer)
    return groups, trailer


def parse_rosary_lines(body_html: str) -> tuple[list[MysteryGroup], list[BlockOut]]:
    """The Rosary for a mirror that prints the whole entry as one `<p>`.

    Italian gives its Rosary no internal paragraphs at all -- name, rubric,
    the twenty mysteries and the concluding prayer are one run of `<br/>`
    lines -- so there is nothing for a paragraph walk to walk. The heading is
    a line whose FOLLOWING line opens a parenthesis, which is the weekday
    rubric.

    ITEMS ARE MERGED UNTIL THEY END ON A FULL STOP. The Luminous mysteries
    wrap three of their five titles across two printed lines each
    ("L'auto-rivelazione di Gesu" / "alle nozze di Cana."), so counting lines
    gives eight items where the source names five. Every mystery title ends on
    a period; a continuation line does not."""
    lines = br_segments(body_html)
    groups: list[MysteryGroup] = []
    i = 0
    while i < len(lines) - 1 and len(groups) < 4:
        if not _RUBRIC_LINE_RE.match(lines[i + 1]):
            i += 1
            continue
        name, rubric = lines[i], lines[i + 1]
        items: list[str] = []
        buf: list[str] = []
        k = i + 2
        while k < len(lines) and len(items) < 5:
            buf.append(lines[k])
            if lines[k].endswith("."):
                items.append(" ".join(buf))
                buf = []
            k += 1
        groups.append(
            MysteryGroup(
                name, rubric, [MysteryItem(title=item, meditation="") for item in items]
            )
        )
        i = k
    trailer: list[BlockOut] = []
    tail = lines[i:]
    if tail:
        trailer.append(BlockOut("prose", " ".join(tail), html=line_html(tail)))
    return groups, trailer


def build_prayers_it(html_text: str) -> list[Prayer]:
    """Italian: a paragraph stream in which each prayer is ONE `<p>` holding
    its title and its body, then a trailing block of 21 Latin entries in the
    same shape -- the Portuguese layout with the title not split off into its
    own paragraph."""
    start, end = html_text.find(IT_START_ANCHOR), html_text.find(IT_END_ANCHOR)
    if start == -1 or end == -1 or end <= start:
        raise RuntimeError(
            f"IT: could not locate appendix boundaries (start={start}, end={end})"
        )
    region = [q for q in top_paragraphs(html_text[start:end]) if flatten(q)]
    latin_at = next(
        (k for k, q in enumerate(region) if flatten(q).startswith("Signum Crucis")),
        None,
    )
    if latin_at is None:
        raise RuntimeError("IT: could not locate the trailing Latin block")
    vern, latin_paras = region[:latin_at], region[latin_at:]
    if len(latin_paras) != len(LATIN_SLUGS):
        raise RuntimeError(
            f"IT: expected {len(LATIN_SLUGS)} Latin entries, found {len(latin_paras)}"
        )
    latin_by_slug: dict[str, LatinText] = {}
    for slug, raw in zip(LATIN_SLUGS, latin_paras, strict=True):
        latin_title, latin_body = split_title(raw)
        latin_by_slug[slug] = LatinText(latin_title, latin_blocks_pt(latin_body))

    # Expand the merged Eastern-rite paragraph in place, so what follows walks
    # one entry per prayer exactly as every other mirror does.
    expanded: list[tuple[str, str | None, str]] = []
    for raw in vern:
        title, body = split_title(raw)
        if _IT_TRADITION_RE.search(raw):
            expanded += split_italian_eastern(raw)
        else:
            expanded.append((title, None, body))
    if len(expanded) != len(APPENDIX_SLUGS):
        raise RuntimeError(
            f"IT: expected {len(APPENDIX_SLUGS)} prayers, found {len(expanded)}"
        )

    prayers: list[Prayer] = []
    for i, (title, rubric, body) in enumerate(expanded):
        slug = APPENDIX_SLUGS[i]
        paragraphs = top_paragraphs(body) or [body]
        if slug == "rosary":
            groups, blocks = parse_rosary_lines(body)
        else:
            blocks, _ = parse_simple_body(paragraphs)
            groups = []
        prayers.append(
            Prayer(
                n=i + 1,
                slug=slug,
                title=title,
                rubric=rubric,
                blocks=blocks,
                latin=latin_by_slug.get(slug),
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


#: A paragraph boundary inside one table cell, read as the line break it
#: prints. Only `build_creeds_pt` needs it -- see the comment there.
_P_BREAK_RE = re.compile(r"</p\s*>\s*<p\b[^>]*>", re.IGNORECASE)


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
    # A TABLE ROW IS NOT A LINE; the `<br/>`s INSIDE each cell are the lines.
    #
    # This read `flatten(row[column])` until 2026-09-03, on the stated ground
    # that "each table ROW is a printed line of the creed". It is not. The rows
    # pair the two Creeds SECTION for section so that each stands level beside
    # its counterpart, and a section is several lines: the Apostles' Creed is
    # seven rows here and twenty-two printed lines. The Latin Catechism sets
    # the identical pair in eleven rows, which settles it -- the row count is a
    # fact about how a page laid its two columns out, not about either text.
    #
    # WHAT THE COLLAPSE PRODUCED WAS THE `;` RUN. One line came out reading
    # "padeceu sob Pontio Pilatos, foi crucificado, morto e sepultado; desceu a
    # mansao dos mortos; ressuscitou ao terceiro dia; subiu aos Ceus; ..." --
    # six clauses of the Creed run together, the semicolons the only surviving
    # trace of breaks the page prints. Eight of the Apostles' Creed's
    # semicolons and five of the Nicene's sat mid-line for that reason.
    #
    # `line_html`'s own test decides which kind of `<br/>` these are, and the
    # cells pass it more clearly than the Latin ones that ALREADY ship as
    # lines: median 25 characters and 82% clause-final for the Apostles' Creed,
    # 28 and 89% for the Nicene, against 22/80% and 23/71% for `ccc-la`'s
    # SYMBOLUM FIDEI table. So this is `build_creeds_la`'s reading, which was
    # right about the same shape one language over.
    #
    # A `</p><p>` INSIDE A CELL IS A LINE BREAK TOO, and one cell needs it: the
    # Nicene Creed's fourth section is the only cell in either the Portuguese
    # or the Latin table set as two paragraphs rather than one. Without this,
    # `br_segments` runs its halves together as "padeceu e foi sepultado.
    # Ressuscitou ao terceiro dia," -- a full stop mid-line, which is the same
    # defect one tag over.
    column_lines = [
        [
            line
            for row in rows[1:]
            for line in br_segments(_P_BREAK_RE.sub("<br />", row[column]))
        ]
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


# --------------------------------------------------------------------------
# The Compendium's OWN BODY: the two Creeds and the Our Father
# --------------------------------------------------------------------------
#
# EIGHT EDITIONS HELD NEITHER CREED, AND THE TEXT WAS IN THE FILE ALL ALONG.
# This scraper reads Appendix A, which opens at the Sign of the Cross and
# carries the Hail Mary but neither Creed nor the Our Father -- while every
# Compendium ALSO prints all three at the head of Part One Section Two and of
# Part Four Section Two, vernacular beside Latin. Reading that region takes
# `de fr hu it ro sl sv` from one of the four prayers a Catholic is expected to
# know by heart to four, and `es` (whose appendix prints its own Our Father)
# from two to four, at the cost of no fetch at all: it is the same file
# `compendium_source` already hands to the appendix reader. All eleven language
# editions of this work now carry all four.
#
# THE LATIN IS THE ANCHOR, THE CLASSIFIER AND THE CHECK, in that order -- and
# not one of those three steps reads a word of the vernacular, which is what
# makes this safe in seven languages nobody here is required to know.
#
#   - ANCHOR. `Symbolum` and `Pater noster` are set in Latin script in every
#     edition. A vernacular heading would need a table of seven spellings, and
#     would still miss Spanish, which heads its Apostles' Creed with nothing.
#   - CLASSIFIER. THE FOUR BLOCKS ARE NOT IN ONE ORDER. German, Italian,
#     Romanian and Slovenian INTERLEAVE -- vernacular Creed, its Latin, the
#     other Creed, its Latin. English, French and Hungarian GROUP -- both
#     vernaculars, then both Latins. So "the vernacular is the run before the
#     Latin heading" is right in half the editions and wrong in the other half,
#     and wrong INVISIBLY: it files the Nicene vernacular under `apostles-creed`
#     and yields a real creed under the wrong slug. Every block is therefore
#     scored against the Latin Catechism's own prayers and called Latin or not;
#     the blocks that are not are the vernacular, in printed order, because the
#     Apostles' Creed precedes the Nicene in every edition and every rite.
#   - CHECK. `report_body_latin` folds each printed Latin against `ccc-la`'s
#     own. Measured on the German, the two agree word for word once the ligature
#     is opened -- so this is quiet on a sound edition, which is what makes a
#     report worth reading.
#
# SCORING RATHER THAN TESTING AN INCIPIT is what makes the classifier survive
# the one edition that is wrong. Hungarian heads a block `Symbolum Apostolicum`
# and then prints `Credo in unum Deum, Patrem omnipotentem, Creatorem coeli et
# terrae` -- the NICENE incipit on the Apostles' Creed's body. An incipit test
# files that under the wrong slug and reports nothing. A whole-text score puts
# it where it belongs (0.92 against the Apostles', where a sound edition scores
# 0.99) and leaves the divergence for the check to report.
#
# THE LATIN IS USED AND NOT STORED. `prayer.common.la` already publishes all
# three of these prayers from the Catechism, and what the Compendium prints
# beside the vernacular is a SECOND transcription of the same text carrying its
# own misprints -- `caeeli`, `Víirgine`, `proper`, `sedit`, a lost space in
# `MaríaVírgine`. Storing seven more copies of the Latin Creed whose only
# differences from one another are the Vatican's typographical slips would be
# publishing noise in the shape of a variant. `NO_LATIN_SLUGS` does not move.
#
# ENGLISH AND PORTUGUESE ARE NOT READ HERE and neither changes: both already
# take these three prayers from their own Catechism, and the Portuguese
# Compendium prints no Latin Creed at all. They are still CHECKED here, which is
# why `report_body_latin` runs over all ten editions and not the eight this
# supplies.

#: Orthography that varies between two faithful printings of the same Latin, and
#: nothing else: the ligature, and the older `coel-` spelling some of these
#: editions use where others write `cael-`. Folding past this would start hiding
#: real divergence, which is the whole point of the fold.
_LATIN_LIGATURES = (("æ", "ae"), ("Æ", "Ae"), ("œ", "oe"), ("Œ", "Oe"))
#: Unicode categories for a diacritic printed as a character of its own --
#: modifier symbol and modifier letter. See `fold_latin`.
_ACCENT_MARKS = frozenset({"Sk", "Lm"})
_LATIN_OE_RE = re.compile(r"\bco(?=el)")
_LATIN_WORD_RE = re.compile(r"[a-z]+")


def fold_latin(text: str) -> list[str]:
    """A Latin text as comparable words: ligatures opened, accents dropped,
    `coel-` spelled `cael-`, everything that is not a letter discarded.

    The Compendium accents its Latin for chant (`omnipoténtem`) where the
    Catechism does not, so an unfolded comparison of two identical Creeds
    disagrees on a third of their words.

    A SPACING ACCENT IS DROPPED FIRST, BEFORE NORMALISING, and both halves of
    that matter. The English Compendium page writes `sǽcula` as `æ` followed
    by U+00B4 ACUTE ACCENT -- a letter and a separate punctuation mark, not
    one composed character -- and the Belarusian PDF sets every one of its
    accents the same way. `unicodedata.combining` answers 0 for U+00B4, so it
    survived the strip; and NFKD is no help either, because its compatibility
    decomposition is a SPACE plus a combining acute, which splits the word
    where the mark stood. So `saecula` folded to `sae` and `cula`, and every
    edition spelling the word normally read as departing from the English."""
    s = "".join(c for c in text if unicodedata.category(c) not in _ACCENT_MARKS)
    s = unicodedata.normalize("NFKD", s)
    for ligature, opened in _LATIN_LIGATURES:
        s = s.replace(ligature, opened)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return _LATIN_WORD_RE.findall(_LATIN_OE_RE.sub("cae", s))


@lru_cache(maxsize=1)
def latin_reference() -> dict[str, frozenset[str]]:
    """The Latin Catechism's own three prayers, as word sets to score against.

    Read through `read_latin_catechism_prayers`, so this is the same text
    `prayer.common.la` publishes rather than a second transcription of it."""
    return {
        prayer.slug: frozenset(
            fold_latin(" ".join(block.text for block in prayer.blocks))
        )
        for prayer in read_latin_catechism_prayers()
    }


#: A block is Latin when this share of its words are in one of the Catechism's
#: Latin prayers. Measured over every unit of both regions in all ten editions:
#: the Latin blocks score 0.92 to 1.00 and the vernacular ones 0.00 to 0.22, so
#: anything between about 0.3 and 0.9 separates them and the midpoint is not a
#: tuned number. The Romance vernaculars are the near miss and they are not
#: near -- Italian's `Credo in Dio, Padre onnipotente` shares `credo` and `in`
#: with the Latin and then stops.
LATIN_SCORE_MIN = 0.6

#: A Creed is long, and short Latin-scoring blocks exist -- `Amen.` alone scores
#: 1.00. Seeding a region on one of those would find the appendix's Latin
#: column, hundreds of units further on, rather than this region's.
LATIN_SEED_CHARS = 200

#: Below this, a block gets no vote on whether it is Latin and simply joins the
#: block above it. Slovenian closes each of its four Creeds with a bare `Amen.`,
#: which scores 1.00 as Latin inside the vernacular ones too and would otherwise
#: cut both Slovenian Creeds in half.
LATIN_CLASS_MIN_CHARS = 40

#: A chunk shorter than this is a heading the source set in a paragraph of its
#: own rather than a prayer -- German prints `DAS GEBET DES HERRN` that way. The
#: shortest text either region holds anywhere is an Our Father at 285 characters.
BODY_PRAYER_MIN_CHARS = 120

#: The two slugs the Creed region supplies. The Our Father region supplies the
#: third and is read by the same machinery under `("our-father",)`.
BODY_CREED_SLUGS = ("apostles-creed", "nicene-creed")


def latin_likeness(text: str) -> tuple[str | None, float]:
    """Which of the Catechism's Latin prayers this text is, and how much of it
    agrees. `(None, 0.0)` for a text with no words at all."""
    words = fold_latin(text)
    if not words:
        return None, 0.0
    best_slug, best_score = None, 0.0
    for slug, reference in latin_reference().items():
        score = sum(1 for word in words if word in reference) / len(words)
        if score > best_score:
            best_slug, best_score = slug, score
    return best_slug, best_score


def is_latin_block(text: str) -> bool:
    return latin_likeness(text)[1] >= LATIN_SCORE_MIN


@dataclass
class BodyChunk:
    """One printed block of the Creed or Our Father region: the heading the
    source set over it, where it set one, and the raw HTML under it."""

    title: str | None
    parts: list[str] = field(default_factory=list)

    @property
    def text(self) -> str:
        return " ".join(t for t in (flatten(part) for part in self.parts) if t)


#: A heading here is bold, and the bold may sit under a `<font>` (most
#: editions), a `<span lang="fr">` (French alone) or neither (Romanian,
#: Slovenian). Splitting AT the `<b>` and letting the wrappers fall away as
#: empty segments covers all three without naming any of them.
_BOLD_SPLIT_RE = re.compile(r"(?i)(?=<b\b)")
_BOLD_HEAD_RE = re.compile(r"(?is)^\s*<b\b[^>]*>(.*?)</b>(.*)$")
#: A question opens with its number; a reference line is nothing but numbers and
#: separators. Both are language-invariant, which is why a region is bounded on
#: them rather than on any printed heading.
_BODY_QUESTION_RE = re.compile(r"^\d+\.")
_BODY_REFERENCE_RE = re.compile(r"^[\d\s,;.‐-―-]+$")
#: Where the Latin heading falls inside a table, this is what finds the table.
_BODY_TABLE_ANCHOR = {
    "creeds": re.compile(r"(?i)\bSymbolum\b"),
    "our-father": re.compile(r"(?i)\bPater\s+noster\b"),
}


def bold_units(paragraph_html: str) -> list[str]:
    """A paragraph as the units its own headings divide it into.

    ITALIAN SETS THE WHOLE CREED REGION IN ONE `<p>` -- both vernaculars and
    both Latins, divided by nothing but four bold headings -- so splitting every
    paragraph on its bold runs is what lets one reader serve it and the six
    editions that use a paragraph per block. For those six it is very nearly a
    no-op: a paragraph with one leading heading yields itself."""
    return [unit for unit in _BOLD_SPLIT_RE.split(paragraph_html) if flatten(unit)]


def head_and_body(unit_html: str) -> tuple[str | None, str]:
    """A unit as `(heading, the rest)`, or `(None, all of it)`."""
    match = _BOLD_HEAD_RE.match(unit_html.strip())
    if match is None:
        return None, unit_html
    return flatten(match.group(1)), match.group(2)


def body_chunks(units: list[str]) -> list[BodyChunk]:
    """Units as chunks, split where the source sets a heading and again wherever
    Latin gives way to vernacular or back.

    THE SECOND SPLIT IS THE ONE THAT MATTERS, and English is what needs it:
    it heads its Latin Apostles' Creed `Symbolum Apostolicum` and then prints
    ten unheaded paragraphs of the Nicene Creed in English under no heading at
    all. A chunker reading headings alone returns one block that is a Latin
    creed followed by an English one."""
    chunks: list[BodyChunk] = []
    latin_now: bool | None = None
    for unit in units:
        title, body = head_and_body(unit)
        if title is not None:
            chunks.append(BodyChunk(title))
            latin_now = None
        body_text = flatten(body)
        if not body_text:
            continue
        if len(body_text) >= LATIN_CLASS_MIN_CHARS:
            latin_here = is_latin_block(body_text)
            if latin_now is not None and latin_here != latin_now:
                chunks.append(BodyChunk(None))
            latin_now = latin_here
        if not chunks:
            chunks.append(BodyChunk(None))
        chunks[-1].parts.append(body)
    return [
        chunk
        for chunk in chunks
        if chunk.parts and len(chunk.text) >= BODY_PRAYER_MIN_CHARS
    ]


def stream_body_chunks(
    html_text: str, lang: str, slugs: tuple[str, ...]
) -> list[BodyChunk]:
    """The chunks of one region, for the editions that set it as paragraphs.

    THE END IS THE LATIN AND THE START IS THE SECTION HEADING. Every edition
    closes each region with its Latin, so the end is found by scoring; the start
    is the first heading after the last numbered question before it, because the
    answer to that question is ordinary prose and the heading that follows it
    (`SEGUNDA SECCIÓN`, `MÁSODIK SZAKASZ`, `Andra delen`) is the only thing
    between the two that the source sets bold."""
    units = [
        unit
        for paragraph in top_paragraphs(html_text)
        for unit in bold_units(paragraph)
    ]
    seeds = [
        i
        for i, unit in enumerate(units)
        if len(flatten(unit)) >= LATIN_SEED_CHARS
        and latin_likeness(flatten(unit))[0] in slugs
        and is_latin_block(flatten(unit))
    ]
    if not seeds:
        raise RuntimeError(
            f"{lang}: found no Latin {slugs[0]} in the Compendium's body"
        )
    seed = seeds[0]
    # The appendix prints Latin too, hundreds of units later; this region is the
    # FIRST cluster. 40 is far wider than any edition's region (Spanish's, the
    # longest, is 19 units) and far narrower than the gap to the appendix.
    end = max(i for i in seeds if i - seed < 40)
    while end + 1 < len(units):
        following = flatten(units[end + 1])
        if following and not is_latin_block(following):
            break
        end += 1
    question = max(
        (
            i
            for i in range(seed)
            if _BODY_QUESTION_RE.match(flatten(units[i]))
            or _BODY_REFERENCE_RE.match(flatten(units[i]) or "x")
        ),
        default=-1,
    )
    start = next(
        (
            i
            for i in range(question + 1, seed)
            if head_and_body(units[i])[0] is not None
        ),
        None,
    )
    if start is None:
        raise RuntimeError(
            f"{lang}: no heading between question {question} and the Latin at "
            f"{seed} -- the region cannot be bounded"
        )
    return body_chunks(units[start : end + 1])


def _enclosing_tables(html_text: str, region: str) -> list[str]:
    """Every distinct table holding a Latin heading for `region`.

    Found by walking out from the heading rather than by matching `<table>`,
    because the page is itself one big layout table and these are nested inside
    it -- a non-recursive `<table>...</table>` match returns the outer one and
    its cells are the whole document."""
    spans: list[tuple[int, int]] = []
    for match in _BODY_TABLE_ANCHOR[region].finditer(html_text):
        start = html_text.rfind("<table", 0, match.start())
        end = html_text.find("</table>", match.start())
        if start != -1 and end != -1 and (start, end) not in spans:
            spans.append((start, end))
    return [html_text[start : end + 8] for start, end in spans]


def _table_rows(table_html: str) -> list[list[str]]:
    return [
        [cell.group(1) for cell in _TD_RE.finditer(row.group(1))]
        for row in _TR_RE.finditer(table_html)
    ]


def paired_cell_chunks(
    html_text: str, lang: str, region: str, slugs: tuple[str, ...]
) -> list[BodyChunk]:
    """German's shape: one table, one row per Creed, and each cell holding its
    own heading and then its text."""
    chunks: list[BodyChunk] = []
    for table in _enclosing_tables(html_text, region):
        for row in _table_rows(table):
            for cell in row:
                chunks.extend(body_chunks(bold_units(cell)))
    if not chunks:
        raise RuntimeError(f"{lang}: no {region} found in a paired-cell table")
    return chunks


def headed_column_chunks(
    html_text: str, lang: str, region: str, slugs: tuple[str, ...]
) -> list[BodyChunk]:
    """Swedish's shape: a table per prayer, its first row the two headings and
    every row after it one printed line, with an empty spacer column between the
    vernacular and the Latin.

    Read by COLUMN, which is the whole reason this is not the paired-cell
    reader: taken row by row the vernacular and the Latin alternate every line,
    and the classifier would cut each Creed into as many chunks as it has
    lines."""
    chunks: list[BodyChunk] = []
    for table in _enclosing_tables(html_text, region):
        rows = [row for row in _table_rows(table) if row]
        width = max(len(row) for row in rows)
        for column in range(width):
            cells = [row[column] for row in rows if column < len(row)]
            if not any(flatten(cell) for cell in cells):
                continue  # the spacer column
            title = flatten(cells[0]) or None
            parts = [cell for cell in cells[1:] if flatten(cell)]
            if not parts:
                continue
            chunk = BodyChunk(title, parts)
            if len(chunk.text) >= BODY_PRAYER_MIN_CHARS:
                chunks.append(chunk)
    if not chunks:
        raise RuntimeError(f"{lang}: no {region} found in a headed-column table")
    return chunks


#: How each edition sets the two regions. `stream` is the default and the
#: majority; German sets its Creeds in a two-column table and its Our Father as
#: paragraphs, which is why this is per region rather than per edition.
COMPENDIUM_BODY_SHAPE: dict[str, dict[str, str]] = {
    "de": {"creeds": "paired-cells"},
    "es": {"creeds": "paired-cells"},
    "sv": {"creeds": "headed-columns", "our-father": "headed-columns"},
}
_BODY_READERS = {
    "stream": lambda html, lang, region, slugs: stream_body_chunks(html, lang, slugs),
    "paired-cells": paired_cell_chunks,
    "headed-columns": headed_column_chunks,
}


def region_chunks(
    html_text: str, lang: str, region: str, slugs: tuple[str, ...]
) -> list[BodyChunk]:
    shape = COMPENDIUM_BODY_SHAPE.get(lang, {}).get(region, "stream")
    return _BODY_READERS[shape](html_text, lang, region, slugs)


def _pair_by_language(
    chunks: list[BodyChunk], lang: str, region: str, slugs: tuple[str, ...]
) -> list[tuple[BodyChunk, BodyChunk]]:
    """The region's chunks as `(vernacular, Latin)` pairs, one per slug.

    Pairing is by ORDER within each language rather than by adjacency, which is
    what makes it indifferent to whether the edition interleaves or groups."""
    latin = [chunk for chunk in chunks if is_latin_block(chunk.text)]
    vernacular = [chunk for chunk in chunks if not is_latin_block(chunk.text)]
    if len(latin) != len(slugs) or len(vernacular) != len(slugs):
        raise RuntimeError(
            f"{lang}: expected {len(slugs)} vernacular and {len(slugs)} Latin "
            f"{region} blocks, found {len(vernacular)} and {len(latin)}"
        )
    found = [latin_likeness(chunk.text)[0] for chunk in latin]
    if found != list(slugs):
        raise RuntimeError(
            f"{lang}: the Latin {region} blocks read as {found}, not {list(slugs)}"
        )
    return list(zip(vernacular, latin, strict=True))


def _prayer_from_chunk(vernacular: BodyChunk, slug: str, lang: str) -> Prayer:
    if not vernacular.title:
        raise RuntimeError(f"{lang}: the {slug} is printed under no heading")
    return Prayer(
        0,
        slug,
        vernacular.title,
        [
            BlockOut("prose", flatten(part), html=line_html(br_segments(part)))
            for part in vernacular.parts
            if flatten(part)
        ],
    )


def build_creeds_body(lang: str) -> Callable[[str], list[Prayer]]:
    """The two Creeds, read from this edition's own Compendium body."""

    def read(html_text: str) -> list[Prayer]:
        chunks = region_chunks(html_text, lang, "creeds", BODY_CREED_SLUGS)
        pairs = _pair_by_language(chunks, lang, "creeds", BODY_CREED_SLUGS)
        return [
            _prayer_from_chunk(vernacular, slug, lang)
            for (vernacular, _), slug in zip(pairs, BODY_CREED_SLUGS, strict=True)
        ]

    return read


def build_our_father_body(lang: str) -> Callable[[str], list[Prayer]]:
    """The Our Father, read from this edition's own Compendium body."""

    def read(html_text: str) -> list[Prayer]:
        chunks = region_chunks(html_text, lang, "our-father", ("our-father",))
        pairs = _pair_by_language(chunks, lang, "our-father", ("our-father",))
        return [_prayer_from_chunk(pairs[0][0], "our-father", lang)]

    return read


def report_body_latin(lang: str, html_text: str) -> list[str]:
    """Every place this edition's printed Latin departs from the Catechism's.

    A REPORT AND NOT A GATE, for the same reason the cross-language symmetry
    check is one: a departure may be the Compendium and the Catechism printing
    two received readings, and five of these editions agree on `sedet ad
    dexteram Dei Patris` where `ccc-la` prints no `Dei`, with `quotidianum`
    against `cotidianum` older still. What it is FOR is the other kind, which
    nothing else in this scraper can see -- one misprinted character inside a
    Latin prayer nobody here is required to be able to read."""
    reports: list[str] = []
    catechism = {
        prayer.slug: fold_latin(" ".join(block.text for block in prayer.blocks))
        for prayer in read_latin_catechism_prayers()
    }
    for region, slugs in (
        ("creeds", BODY_CREED_SLUGS),
        ("our-father", ("our-father",)),
    ):
        try:
            chunks = region_chunks(html_text, lang, region, slugs)
        except RuntimeError as exc:
            reports.append(str(exc))
            continue
        for chunk in chunks:
            if not is_latin_block(chunk.text):
                continue
            slug = latin_likeness(chunk.text)[0]
            printed, received = fold_latin(chunk.text), catechism[slug]
            if printed == received:
                continue
            at = next(
                (
                    i
                    for i, (a, b) in enumerate(zip(printed, received, strict=False))
                    if a != b
                ),
                min(len(printed), len(received)),
            )
            reports.append(
                f"{lang}/{slug}: Latin departs from ccc-la at word {at} -- "
                f"{' '.join(printed[max(0, at - 2) : at + 4])!r} against "
                f"{' '.join(received[max(0, at - 2) : at + 4])!r}"
            )
    return reports


# --------------------------------------------------------------------------
# The four PDF editions: the same appendix, printed in two parallel columns
#
# vatican.va publishes the Compendium in fourteen languages and serves ten as
# HTML. The other four -- Byelorussian, Indonesian, Lithuanian and Russian --
# it publishes only as a PDF made by the national bishops' conference that
# translated it, and `ccc/compendium_pdf.py` already reads the 598-question
# body out of all four. It stops where this starts: everything after Q598 is
# Appendix A, which that scraper leaves alone exactly as it does in the ten.
#
# THE PAGE IS THE SAME BOOK IN ALL FOUR, and it is not the page the body is on:
#
#     +----------------------------------------------------+
#     |  Kryžiaus ženklas        Signum Crucis             |  <- heading pair
#     |  Vardan Dievo -- Tėvo    In nómine Patris et Filii  |
#     |  ir Sūnaus, ir Šven-     et Spíritus Sancti. Amen.  |
#     |  tosios Dvasios. Amen.                              |
#     +----------------------------------------------------+
#
# -- the vernacular in the left column, the Latin in the right, each prayer
# opening with a heading on one baseline in both. So none of what follows is
# the body reader reused: that one separates a cross-reference MARGIN from a
# single column of text and would read this page as one column with a very
# wide margin. What is shared is `common/pdf.py` and `PDF_EDITIONS`, which is
# imported rather than mirrored because every claim it makes -- which reader,
# which re-decode, which glyph is unmapped, where the furniture ends -- is a
# fact about these four files and is as true here as there.
#
# THE PRINTED LATIN IS THE INSTRUMENT, the same way it is for the Compendium's
# own body above, and for the same reason: nothing here reads a word of
# Byelorussian, Indonesian, Lithuanian or Russian.
#
#   - It is the ANCHOR. `Signum Crucis`, `Ave, Maria`, `Actus contritionis`
#     are Latin script in all four, so the prayers are located by a table of
#     Latin titles taken off `prayer.common.en`'s own Latin column.
#   - It is the BOUND. The columns are set in parallel, so where the Latin of
#     a prayer stops the vernacular stops -- which is what cuts twenty-four
#     prayers apart without one vernacular string in the file.
#   - It is the CHECK. `report_pdf_latin` folds every extracted Latin word
#     against the English appendix's and prints the differences.
#
# WHAT THE FOUR EDITIONS DISAGREE ABOUT, all of it measured rather than
# assumed, and none of it needing a per-edition branch anywhere below:
#
#   - The Russian reports NO FONT AT ALL (poppler's `-bbox-layout` gives
#     geometry and nothing else), so a heading cannot be recognised by its
#     weight there and has to be recognised by its text. That is measured off
#     the region -- `Region.faced` -- rather than declared.
#   - The Indonesian MISPRINTS two of its Latin headings, `Egina Cæli` for
#     `Regina Cæli` and `Vine, Creator Spiritus` for `Veni, ...`, so no fold
#     of the expected title reaches them. They are found instead as the one
#     heading standing in the gap their neighbours leave, and stored as
#     printed.
#   - The Indonesian PRINTS NEITHER the Rosary's concluding prayer nor any of
#     the three Eastern-rite prayers -- `absent`, the same statement Swedish
#     and Slovenian already make about the same three.
#   - The Byelorussian's LATIN COLUMN IS NOT RECOVERABLE, and both readers
#     fail differently: it sets its accents as separate positioned glyphs over
#     base letters its fonts do not map, so MuPDF gives `et F<FFFD>´lii` for
#     `et Fílii` and sometimes floats the accent to the end of the line
#     (`peccatoribus,´`), while poppler combines it onto the wrong letter
#     (`Fĺii`, `Mará`) and drops others outright (`nostr.` for `nostræ`). Word
#     for word against the English appendix that column scores 84.9%, where
#     the other three score 99.5%, 99.2% and 95.1%. So this edition publishes
#     NO Latin companion -- `latin_unreadable`, which is a statement about the
#     file and not, like `no_latin`, about what the source prints.
# --------------------------------------------------------------------------

#: The file each PDF edition is published as. MIRRORS `EDITIONS` in
#: `ccc/compendium.py` for the same reason `COMPENDIUM_FILES` does, and fails
#: the same loud way at `read_source` if it drifts.
PDF_FILES = {
    "be": "archive_2005_compendium-ccc_be.pdf",
    "id": "archive_compendium-ccc_id.pdf",
    "lt": "compendium_catech_lit.pdf",
    "ru": "archive_compendium-ccc_ru.pdf",
}

#: How far apart, as a fraction of the page, the two columns' left edges must
#: be before they are two columns rather than one column and an indent.
COLUMN_MIN_GAP = 0.25
#: ...and how much of the first column's line count the second must carry.
COLUMN_MIN_SHARE = 0.4
#: Points to pull the split left of the Latin column's own edge, so a hyphen
#: the vernacular hangs past its measure stays with the vernacular. Without it
#: `išga-` at the end of a Lithuanian line is read as the first word of the
#: Latin line beside it.
COLUMN_TOL = 6.0
#: How many pages after its opening heading a region is looked for in. Both
#: are generous: the bounds come from the text, and `Region.refit` re-measures
#: the columns over what the prayers actually claimed.
APPENDIX_SPAN = 17
CREED_SPAN = 3
#: A printed line ending this far short of the measure was broken there on
#: purpose; one reaching it ran out of room and runs on into the next.
MEASURE_TOL = 12.0
#: A vertical gap this many times the column's own line spacing opens a block.
BLOCK_GAP = 1.4
#: How much further than its Latin a prayer's vernacular may run, in lines. A
#: translation is usually the longer of the two.
TAIL_ROOM = 2.5
#: How many lines in a row may share no word with the expected Latin before
#: the prayer is taken to have ended. More than one, because a Latin line a
#: reader mangled shares nothing either.
END_MISS_RUN = 3

#: The three Appendix A prayers no edition prints Latin beside -- and so the
#: three with no anchor. Derived rather than retyped: they are exactly the
#: appendix entries in `NO_LATIN_SLUGS`.
EASTERN_SLUGS = [slug for slug in APPENDIX_SLUGS if slug in NO_LATIN_SLUGS]
assert len(EASTERN_SLUGS) == 3

#: The Compendium's own Latin headings for the three prayers it prints in its
#: body. Spelled here in the fullest form any edition uses, since the match is
#: by prefix: `Symbolum Nicænum` on one line and `Constantinopolitanum` on the
#: next is one heading.
PDF_CREED_TITLES = {
    "apostles-creed": "Symbolum Apostolicum",
    "nicene-creed": "Symbolum Nicaenum Constantinopolitanum",
    "our-father": "Pater noster",
}

#: A numbered paragraph: the question-and-answer body resuming after the
#: Creeds, and the enumerated formulas of Appendix B after the last prayer.
_NUMBERED_RE = re.compile(r"^\s*\d{1,3}[.)]\s*\D")
#: A line that is nothing but a parenthesis -- the tradition an Eastern-rite
#: prayer belongs to, and the Belarusian's `(паэтычная форма)`.
_PDF_RUBRIC_RE = re.compile(r"^\s*\(.*\)\s*$")
#: A soft hyphen, and any space the reader put after it. These editions set
#: discretionary breaks as U+00AD and `merge_runs` restores a word space at
#: the fragment boundary one falls on, so `Curah<AD> kanlah` is one word.
_SOFT_BREAK_RE = re.compile("­\\s*")
_LINE_HYPHEN = ("-", "‐", "‑")


def fold_word(text: str) -> str:
    """One folded string, letters only, for comparing a printed heading."""
    return "".join(fold_latin(text))


def fold_ligature_blind(text: str) -> str:
    """As `fold_word`, but blind to the ligature an edition may not have
    mapped -- the Belarusian prints `Regina Cæli` with `æ` unmapped, so its
    heading folds to `reginacli` and no tolerance of spelling reaches it."""
    return fold_word(text).replace("ae", "").replace("oe", "")


def _pdf_y(line: Line) -> float:
    return line.baseline or line.y0


def _pdf_at(line: Line) -> tuple[int, float]:
    """A line's place in the book, so two columns on two pages still order."""
    return (line.page, _pdf_y(line))


def _pdf_mode(values, bucket: float = 1.0) -> float:
    counts: dict[float, int] = {}
    for value in values:
        key = round(value / bucket) * bucket
        counts[key] = counts.get(key, 0) + 1
    return max(counts.items(), key=lambda kv: (kv[1], -kv[0]))[0]


def pdf_path(lang: str) -> Path:
    return RAW_ROOT / f"compendium-{lang}" / PDF_FILES[lang]


@cache
def pdf_lines(lang: str) -> tuple[tuple[Line, ...], float]:
    """One edition's lines and its page width, furniture stripped.

    NOT `compendium_pdf.read_edition`, which also separates the body from the
    cross-reference margin and merges within each -- both wrong here, where
    the second column is the Latin and not a margin. What is reused is every
    per-file repair that scraper declares.

    THE RE-DECODE IS DELIBERATELY NOT APPLIED HERE. The Russian's fonts carry
    no `ToUnicode`, and re-reading poppler's bytes as cp1251 recovers its
    Cyrillic -- but the Latin column is not Cyrillic, and re-reading it turns
    `In Nómine Patris` into `In Nуmine Patris`. It is applied per column, in
    `pdf_region`, which is the first place the two are told apart."""
    ed = PDF_EDITIONS[lang]
    path = pdf_path(lang)
    lines = read_lines(path, ed.backend)
    lines = remap(lines, ed.glyphs)
    boxes = page_boxes(path)
    width, height = boxes[0].width, boxes[0].height
    if ed.two_up:
        lines = split_pages(lines, {b.page: b.width / 2 for b in boxes})
        width /= 2
    return (
        tuple(ln for ln in lines if not _in_pdf_furniture(ln, height, ed)),
        width,
    )


def _in_pdf_furniture(line: Line, height: float, ed: PdfEdition) -> bool:
    return not (height * ed.furniture_strip < line.baseline)


@cache
def pdf_page_text(lang: str) -> dict[int, str]:
    """Each page's whole text, for finding the page a region opens on.

    Merged first, because a heading can arrive in pieces: MuPDF ends a run at
    a font change, so the Lithuanian's `Symbolum Apostolicum` is `S` and
    `ymbolum Apostolicum` until the fragments are rejoined."""
    lines, _ = pdf_lines(lang)
    pages: dict[int, list[str]] = {}
    for line in merge_runs(list(lines)):
        pages.setdefault(line.page, []).append(line.text)
    return {page: "\n".join(texts) for page, texts in pages.items()}


def pdf_column_edges(page_lines: list[Line], width: float):
    """A page's two column edges, by how many lines start at each.

    BY COUNT, not by the widest gap between distinct left edges, which is what
    this was first. The Belarusian's Latin column arrives in many short
    fragments at many x positions, several of them repeated often enough to
    look solid, so the widest gap lands on whichever of them sits furthest
    right and the split falls outside the text. The two real columns are by a
    wide margin the two commonest starts on any page that has two."""
    counts = Counter(round(line.x0) for line in page_lines)
    if not counts:
        return None, None
    ranked = [x for x, _ in counts.most_common()]
    first = ranked[0]
    second = next(
        (
            x
            for x in ranked[1:]
            if abs(x - first) >= COLUMN_MIN_GAP * width
            and counts[x] >= COLUMN_MIN_SHARE * counts[first]
        ),
        None,
    )
    if second is None:
        return float(first), None
    return float(min(first, second)), float(max(first, second))


@dataclass
class Region:
    """One run of parallel-text pages, split into its two columns."""

    lang: str
    left: list[Line]
    right: list[Line]
    #: Each page's vernacular column edge -- it mirrors between recto and
    #: verso, because the outer margin is the wide one.
    edges: dict[int, float]
    #: The distance from that edge to the Latin column's, constant per book.
    offset: float
    #: The median baseline-to-baseline step within a column.
    spacing: float
    #: How far past its own edge each column's longest lines reach.
    reach: tuple[float, float]

    def measure(self, line: Line, latin: bool) -> float:
        edge = self.edges[line.page] + (self.offset if latin else 0.0)
        return edge + self.reach[1 if latin else 0]

    @property
    def faced(self) -> bool:
        """Whether the reader reports a face at all -- see the Russian."""
        return any(line.bold for line in self.right)

    def refit(self, chunks: list[PdfChunk]) -> None:
        """Re-measure the columns over what the prayers actually claimed.

        A region is opened generously, by a page count rather than a boundary,
        so it reaches past the Creeds into the question-and-answer body, which
        is set to a WIDER measure across the whole page. Measured with those
        lines in, the parallel column looks half again as wide as it is and
        every one of its lines then reads as a deliberate break rather than a
        wrap -- which turns the Our Father's one paragraph into nine lines."""
        left = [ln for c in chunks for ln in c.title + c.body]
        right = [ln for c in chunks for ln in c.latin_title + c.latin_body]
        self.reach = (
            _pdf_reach(left, self.edges, 0.0) or self.reach[0],
            _pdf_reach(right, self.edges, self.offset) or self.reach[1],
        )


def _pdf_reach(lines: list[Line], edges: dict[int, float], shift: float) -> float:
    """How far past its own edge a column's longest lines run -- its measure.

    A HIGH PERCENTILE, not the mode, and the difference is the Belarusian. A
    justified column ends most of its lines at the measure, so there the mode
    IS the measure; but this appendix is set as verse in several editions, a
    clause to a line, and there the modal line-end is some middle-length
    clause. Every longer line then reads as though it had run out of room, and
    a prayer of ten printed lines comes out as one. The measure is where the
    longest lines reach, whatever the rest do."""
    if not lines:
        return 0.0
    ends = sorted(ln.x1 - edges[ln.page] - shift for ln in lines)
    return ends[min(len(ends) - 1, int(len(ends) * 0.95))]


def pdf_region(lang: str, pages: list[int]) -> Region:
    """The two columns over a run of pages, in reading order.

    SPLIT THE COLUMNS ON THE READER'S OWN FRAGMENTS, THEN MERGE WITHIN EACH --
    the warning `common/pdf.merge_runs` and `compendium_pdf` both carry, and it
    bites harder here than in the body: merged first, the vernacular's last
    word and the Latin's first become one line, and what comes out is a
    plausible sentence in neither language."""
    lines, width = pdf_lines(lang)
    on_page = {p: [ln for ln in lines if ln.page == p] for p in pages}
    measured = {p: pdf_column_edges(v, width) for p, v in on_page.items() if v}
    gaps = [round(hi - lo) for lo, hi in measured.values() if hi is not None]
    if not gaps:
        raise RuntimeError(
            f"{lang}: no two-column page in {pages[0]}..{pages[-1]} -- the "
            "parallel-text region was not found where it was looked for"
        )
    offset = float(Counter(gaps).most_common(1)[0][0])
    edges = {p: lo for p, (lo, _) in measured.items()}

    ed = PDF_EDITIONS[lang]
    left: list[Line] = []
    right: list[Line] = []
    for page, on in on_page.items():
        if page not in edges:
            continue
        at = edges[page] + offset - COLUMN_TOL
        vernacular = merge_runs([ln for ln in on if ln.x0 < at])
        latin = merge_runs([ln for ln in on if ln.x0 >= at])
        if ed.decode is not None:
            vernacular = [ln.with_text(ed.decode(ln.text)) for ln in vernacular]
        left += vernacular
        right += latin
    left.sort(key=_pdf_at)
    right.sort(key=_pdf_at)
    steps = [
        _pdf_y(b) - _pdf_y(a)
        for a, b in itertools.pairwise(left)
        if a.page == b.page and 0 < _pdf_y(b) - _pdf_y(a) < 40
    ]
    return Region(
        lang,
        left,
        right,
        edges,
        offset,
        statistics.median(steps),
        (_pdf_reach(left, edges, 0.0), _pdf_reach(right, edges, offset)),
    )


@lru_cache(maxsize=1)
def english_appendix() -> list[Prayer]:
    """The English appendix, parsed once and held.

    It is the reference the four PDF editions are anchored and checked
    against, so it is read here as well as by `run("en")` -- and reading the
    same cached page twice is cheap where reading it three times per PDF
    edition would not be."""
    return build_prayers_en(EN_RAW.read_text(encoding="cp1252", errors="replace"))


@lru_cache(maxsize=1)
def appendix_latin_titles() -> dict[str, str]:
    """The Latin title of every appendix prayer that has one, off the English
    edition's own Latin column -- so the anchors are read from the corpus
    rather than retyped into it."""
    return {
        prayer.slug: prayer.latin.title for prayer in english_appendix() if prayer.latin
    }


@lru_cache(maxsize=1)
def appendix_latin_words() -> dict[str, frozenset[str]]:
    """Every Latin word each appendix prayer can contain, from the same page,
    plus the three the Latin Catechism holds instead."""
    words = {
        prayer.slug: frozenset(
            fold_latin(" ".join(block.text for block in prayer.latin.blocks))
        )
        for prayer in english_appendix()
        if prayer.latin
    }
    words.update(
        {
            prayer.slug: frozenset(
                fold_latin(" ".join(block.text for block in prayer.blocks))
            )
            for prayer in read_latin_catechism_prayers()
        }
    )
    return words


def is_pdf_heading(line: Line) -> bool:
    return line.bold and not line.italic


def opens_next_pdf(line: Line) -> bool:
    """Whether this line is plainly the start of whatever follows a prayer."""
    return is_pdf_heading(line) or bool(_NUMBERED_RE.match(line.text))


@dataclass
class PdfChunk:
    """One prayer, as the printed lines of each column."""

    slug: str
    title: list[Line] = field(default_factory=list)
    body: list[Line] = field(default_factory=list)
    latin_title: list[Line] = field(default_factory=list)
    latin_body: list[Line] = field(default_factory=list)
    rubric: str | None = None


def anchor_latin_titles(
    region: Region, titles: dict[str, str], order: list[str]
) -> dict[str, int]:
    """Where each prayer opens, as an index into the Latin column.

    TWO PASSES, because two of the eighty-four printed Latin headings are the
    edition's own MISPRINTS -- the Indonesian's `Egina Cæli` and `Vine,
    Creator Spiritus` -- and no fold of the expected title reaches either. The
    first pass matches by text, tolerating the ligature (`Regina Cæli` against
    `Regina caeli`) and a title printed across two lines; the second fills a
    slug the first missed with the ONE heading standing in the gap its
    neighbours leave, and the misprint is then stored exactly as printed.

    The second pass needs a face to recognise a heading by and the Russian's
    reader reports none, so it is skipped there -- measured off the region
    rather than declared, so an edition that starts reporting a face needs no
    entry anywhere."""
    faced = region.faced
    wanted = [slug for slug in order if slug in titles]

    def eligible(i: int) -> bool:
        return is_pdf_heading(region.right[i]) if faced else True

    def matches(i: int, want: str, want_loose: str) -> bool:
        got = fold_word(region.right[i].text)
        return (
            got.startswith(want)
            or (want.startswith(got) and len(got) >= 6)
            or fold_ligature_blind(region.right[i].text) == want_loose
        )

    found: dict[str, int] = {}
    cursor = 0
    for slug in wanted:
        want = fold_word(titles[slug])
        want_loose = fold_ligature_blind(titles[slug])
        hit = next(
            (
                i
                for i in range(cursor, len(region.right))
                if eligible(i) and matches(i, want, want_loose)
            ),
            None,
        )
        if hit is not None:
            found[slug] = hit
            cursor = hit + 1
    if not faced:
        return found
    for k, slug in enumerate(wanted):
        if slug in found:
            continue
        lo = max((found[s] for s in wanted[:k] if s in found), default=-1)
        hi = min(
            (found[s] for s in wanted[k + 1 :] if s in found),
            default=len(region.right),
        )
        gap = [i for i in range(lo + 1, hi) if is_pdf_heading(region.right[i])]
        if len(gap) != 1:
            raise RuntimeError(
                f"{region.lang}: {slug}'s Latin title is not printed as expected "
                f"and {len(gap)} headings stand between its neighbours -- one was "
                "expected, so the misprint cannot be located by position either"
            )
        found[slug] = gap[0]
    return found


def latin_title_run(region: Region, start: int, expected: str) -> int:
    """How many lines of the Latin column the heading at `start` occupies.

    Only ever more than one where the printed title is still a PREFIX of the
    expected one, which is what keeps `Symbolum Nicænum` / `Constantinopolitanum`
    together without letting the Rosary's title swallow `Mystéria gaudiósa`
    beneath it."""
    want = fold_word(expected)
    got = fold_word(region.right[start].text)
    n = 1
    while (
        got != want
        and want.startswith(got)
        and start + n < len(region.right)
        and (not region.faced or is_pdf_heading(region.right[start + n]))
    ):
        got += fold_word(region.right[start + n].text)
        n += 1
    return n


def latin_body_end(region: Region, start: int, slug: str, limit: int) -> int:
    """Where the Latin of the last prayer in a region stops.

    Every other prayer stops at the next anchor; the last has none, so it is
    stopped by the text itself. The English appendix's Latin column and
    `prayer.common.la` between them hold every word it can contain, so the end
    is the LAST line that still shares one -- not the first that does not,
    which one mangled line would trigger."""
    vocabulary = appendix_latin_words().get(slug, frozenset())
    last, missed = start, 0
    for i in range(start, limit):
        line = region.right[i]
        if opens_next_pdf(line):
            break
        if vocabulary & frozenset(fold_latin(line.text)):
            last, missed = i, 0
        else:
            missed += 1
            if missed >= END_MISS_RUN:
                break
    return last + 1


def cut_vernacular(region: Region, chunks: list[PdfChunk]) -> None:
    """The vernacular column, cut wherever the Latin column is cut.

    The two are set in parallel, which is what lets none of this read a word
    of the vernacular: a prayer's heading band is everything above the first
    line of its Latin body, and its text is everything above the next prayer's
    Latin heading."""
    end = _pdf_tail_end(region, chunks)
    for k, chunk in enumerate(chunks):
        head = _pdf_at(chunk.latin_title[0])
        stop = _pdf_at(chunks[k + 1].latin_title[0]) if k + 1 < len(chunks) else end
        span = [
            line
            for line in region.left
            if (head[0], head[1] - 0.6 * region.spacing)
            <= _pdf_at(line)
            < (stop[0], stop[1] - 0.6 * region.spacing)
        ]
        if chunk.latin_body:
            first = _pdf_at(chunk.latin_body[0])
            cut = (first[0], first[1] - 0.5 * region.spacing)
        else:
            cut = (head[0], head[1] + 0.5 * region.spacing)
        title = [line for line in span if _pdf_at(line) < cut]
        body = [line for line in span if _pdf_at(line) >= cut]
        # A PARENTHESISED LINE UNDER THE HEADING IS A RUBRIC, never part of
        # the title: the Belarusian marks its rhymed settings `(паэтычная
        # форма)` and every edition names an Eastern-rite prayer's tradition
        # the same way, which is how the three that print no Latin at all are
        # found below.
        rubric = [line for line in title if _PDF_RUBRIC_RE.match(line.text)]
        title = [line for line in title if line not in rubric]
        if not rubric and body and _PDF_RUBRIC_RE.match(body[0].text):
            rubric, body = body[:1], body[1:]
        chunk.title, chunk.body = title, body
        if rubric:
            chunk.rubric = " ".join(line.text.strip() for line in rubric)


def _pdf_tail_end(region: Region, chunks: list[PdfChunk]) -> tuple[int, float]:
    tail = chunks[-1]
    last = (tail.latin_body or tail.latin_title)[-1]
    room = (last.page, _pdf_y(last) + TAIL_ROOM * region.spacing)
    floor = _pdf_at(tail.latin_body[0] if tail.latin_body else tail.latin_title[-1])
    hit = next(
        (
            _pdf_at(line)
            for line in region.left
            if _pdf_at(line) > floor and opens_next_pdf(line)
        ),
        None,
    )
    return min(hit, room) if hit else room


def eastern_rite_chunks(
    region: Region, lo: tuple[int, float], hi: tuple[int, float]
) -> list[tuple[list[Line], Line, list[Line]]]:
    """The Eastern-rite prayers, which no edition prints Latin beside.

    They are the one run with no anchor, and the signal that finds them is
    present in all four editions including the Russian, where the reader
    reports no face: each is headed and then names its tradition on a line of
    its own in parentheses. The heading is the tight run of lines above that;
    the gap to the prayer before it is what ends the walk backwards."""
    lines = [line for line in region.left if lo < _pdf_at(line) < hi]
    marks = [i for i, line in enumerate(lines) if _PDF_RUBRIC_RE.match(line.text)]
    found: list[list] = []
    for k, mark in enumerate(marks):
        head = mark
        while (
            head > 0
            and lines[head - 1].page == lines[head].page
            and _pdf_y(lines[head]) - _pdf_y(lines[head - 1])
            <= BLOCK_GAP * region.spacing
        ):
            head -= 1
        end = marks[k + 1] if k + 1 < len(marks) else len(lines)
        found.append([lines[head:mark], lines[mark], lines[mark + 1 : end]])
    for k in range(len(found) - 1):
        stop = _pdf_at(found[k + 1][0][0])
        found[k][2] = [line for line in found[k][2] if _pdf_at(line) < stop]
    return [(t, r, b) for t, r, b in found]


def pdf_appendix_chunks(lang: str, absent: frozenset[str]) -> tuple[Region, list]:
    text = pdf_page_text(lang)
    first = next(
        (p for p in sorted(text) if "Signum Crucis" in text[p]),
        None,
    )
    if first is None:
        raise RuntimeError(
            f"{lang}: Appendix A's opening Latin heading is not on any page"
        )
    pages = [p for p in sorted(text) if first <= p < first + APPENDIX_SPAN]
    region = pdf_region(lang, pages)
    titles = appendix_latin_titles()
    slugs = [s for s in APPENDIX_SLUGS if s not in absent]
    anchors = anchor_latin_titles(region, titles, slugs)
    missing = [s for s in slugs if s in titles and s not in anchors]
    if missing:
        raise RuntimeError(f"{lang}: no Latin anchor found for {missing}")

    ordered = sorted(anchors.items(), key=lambda kv: kv[1])
    chunks = [
        _pdf_chunk(region, slug, i, ordered, k, titles[slug])
        for k, (slug, i) in enumerate(ordered)
    ]
    cut_vernacular(region, chunks)

    eastern = [s for s in EASTERN_SLUGS if s not in absent]
    if eastern:
        rosary = next(c for c in chunks if c.slug == "rosary")
        acts = next(c for c in chunks if c.slug == "act-of-faith")
        found = eastern_rite_chunks(
            region,
            _pdf_at((rosary.latin_body or rosary.latin_title)[-1]),
            _pdf_at(acts.latin_title[0]),
        )
        if len(found) != len(eastern):
            raise RuntimeError(
                f"{lang}: {len(found)} parenthesised traditions stand between the "
                f"Rosary and the Acts, expected {len(eastern)}"
            )
        made = [
            PdfChunk(slug=slug, title=title, body=body, rubric=rubric.text.strip())
            for slug, (title, rubric, body) in zip(eastern, found, strict=True)
        ]
        rosary.body = [
            line for line in rosary.body if _pdf_at(line) < _pdf_at(found[0][0][0])
        ]
        at = [c.slug for c in chunks].index("act-of-faith")
        chunks[at:at] = made
    region.refit(chunks)
    return region, chunks


def _pdf_chunk(region, slug, i, ordered, k, title) -> PdfChunk:
    n = latin_title_run(region, i, title)
    limit = ordered[k + 1][1] if k + 1 < len(ordered) else len(region.right)
    stop = limit if k + 1 < len(ordered) else latin_body_end(region, i + n, slug, limit)
    return PdfChunk(
        slug=slug,
        latin_title=region.right[i : i + n],
        latin_body=region.right[i + n : stop],
    )


def pdf_creed_chunks(lang: str, slugs: list[str], anchor: str) -> tuple[Region, list]:
    """The Compendium's own Creeds and Our Father, set the same way.

    The same region as the eight HTML editions read in `build_creeds_body`,
    and easier here: a PDF page has no markup to disagree about, so the column
    the vernacular is in is the whole of what has to be known."""
    text = pdf_page_text(lang)
    first = next(
        (p for p in sorted(text) if re.search(anchor, text[p], re.IGNORECASE)), None
    )
    if first is None:
        raise RuntimeError(f"{lang}: no page carries the Latin heading {anchor!r}")
    pages = [p for p in sorted(text) if first <= p < first + CREED_SPAN]
    region = pdf_region(lang, pages)
    anchors = anchor_latin_titles(region, PDF_CREED_TITLES, slugs)
    missing = [slug for slug in slugs if slug not in anchors]
    if missing:
        raise RuntimeError(f"{lang}: no Latin anchor found for {missing}")
    ordered = sorted(anchors.items(), key=lambda kv: kv[1])
    chunks = [
        _pdf_chunk(region, slug, i, ordered, k, PDF_CREED_TITLES[slug])
        for k, (slug, i) in enumerate(ordered)
    ]
    cut_vernacular(region, chunks)
    region.refit(chunks)
    return region, chunks


def _mend_wrapped(head: str, tail: str) -> str:
    head = head.rstrip()
    if head.endswith(_LINE_HYPHEN):
        return head[:-1] + tail.lstrip()
    return f"{head} {tail.lstrip()}"


def pdf_title_text(lines: list[Line]) -> str:
    """A heading's lines as one string, always joined: a heading is one phrase
    however many lines it took, and the Belarusian breaks its Nicene Creed's
    across two with a hyphen."""
    parts = [_SOFT_BREAK_RE.sub("", line.text).strip() for line in lines]
    parts = [part for part in parts if part]
    if not parts:
        return ""
    out = parts[0]
    for part in parts[1:]:
        out = _mend_wrapped(out, part)
    return _WS_RE.sub(" ", out).strip()


def pdf_printed_lines(lines: list[Line], region: Region, latin: bool) -> list[str]:
    """The editor's own lines, not the reader's.

    A printed line that REACHES THE MEASURE ran out of room and continues into
    the next; one that stops short was broken there on purpose. It is the only
    signal a PDF carries for the difference, and the appendix depends on it in
    both directions: the Memorare is justified prose that must come back as
    one paragraph, and the Ave Maria is set a clause to a line and must keep
    every one of them."""
    out: list[str] = []
    carry = False
    for line in lines:
        text = _SOFT_BREAK_RE.sub("", line.text).strip()
        if not text:
            continue
        if carry and out:
            out[-1] = _mend_wrapped(out[-1], text)
        else:
            out.append(text)
        carry = line.x1 >= region.measure(line, latin) - MEASURE_TOL
    # `merge_runs` restores a space at a fragment boundary, and where the
    # fragment's own text already ended in one that leaves two.
    return [_WS_RE.sub(" ", row).strip() for row in out]


def pdf_paragraphs(lines: list[Line], region: Region, latin: bool) -> list[list[str]]:
    """Printed lines grouped into blocks at the gaps the editor opened."""
    if not lines:
        return []
    groups: list[list[Line]] = [[lines[0]]]
    for prev, line in itertools.pairwise(lines):
        if (
            prev.page != line.page
            or _pdf_y(line) - _pdf_y(prev) > BLOCK_GAP * region.spacing
        ):
            groups.append([line])
        else:
            groups[-1].append(line)
    return [
        rows for group in groups if (rows := pdf_printed_lines(group, region, latin))
    ]


def pdf_blocks(lines: list[Line], region: Region, latin: bool) -> list[BlockOut]:
    out: list[BlockOut] = []
    for rows in pdf_paragraphs(lines, region, latin):
        out.append(BlockOut(kind="prose", text=" ".join(rows), html=line_html(rows)))
    return out


def prayer_from_pdf_chunk(chunk: PdfChunk, region: Region, *, latin: bool) -> Prayer:
    prayer = Prayer(
        n=0,
        slug=chunk.slug,
        title=pdf_title_text(chunk.title),
        blocks=pdf_blocks(chunk.body, region, False),
        rubric=chunk.rubric,
    )
    if latin and chunk.latin_body:
        prayer.latin = LatinText(
            title=pdf_title_text(chunk.latin_title),
            blocks=pdf_blocks(chunk.latin_body, region, True),
        )
    return prayer


def read_pdf_appendix(lang: str) -> list[Prayer]:
    """Appendix A out of a PDF edition -- a `PdfSource.reader`."""
    spec = LANG_CONFIG[lang]
    region, chunks = pdf_appendix_chunks(lang, spec.absent)
    return [
        prayer_from_pdf_chunk(chunk, region, latin=not spec.latin_unreadable)
        for chunk in chunks
    ]


def read_pdf_creeds(lang: str) -> list[Prayer]:
    """The two Creeds out of the Compendium's own body. No `latin`, for the
    reason `NO_LATIN_SLUGS` gives: the Latin here is used and not stored."""
    region, chunks = pdf_creed_chunks(
        lang, list(BODY_CREED_SLUGS), r"Symbolum\s+Apostolicum"
    )
    return [prayer_from_pdf_chunk(chunk, region, latin=False) for chunk in chunks]


def read_pdf_our_father(lang: str) -> list[Prayer]:
    region, chunks = pdf_creed_chunks(lang, ["our-father"], r"Pater\s+[Nn]oster")
    return [prayer_from_pdf_chunk(chunk, region, latin=False) for chunk in chunks]


def report_pdf_latin(lang: str) -> list[str]:
    """Every difference between a PDF edition's printed Latin and the English
    appendix's, word for word.

    A REPORT AND NOT A GATE, the same as `report_body_latin`: a second printed
    transcription of the same universal texts carries its own variants, and
    nothing here can tell one from a misprint by itself. What it is for is
    reading -- the Lithuanian's seven departures in 1,359 words are all one
    letter (`quelli` for `quem`, `sieut` for `sicut`), which says the reader
    misread a glyph; the Russian's are whole words (`genitrix` for `genetrix`,
    `solatium` for `solacium`), which says the edition did."""
    spec = LANG_CONFIG[lang]
    if spec.latin_unreadable:
        return []
    region, chunks = pdf_appendix_chunks(lang, spec.absent)
    reference = appendix_latin_words()
    out: list[str] = []
    for chunk in chunks:
        want = reference.get(chunk.slug)
        if not want or not chunk.latin_body:
            continue
        got = fold_latin(
            " ".join(
                " ".join(rows)
                for rows in pdf_paragraphs(chunk.latin_body, region, True)
            )
        )
        strange = sorted({word for word in got if word not in want})
        if strange:
            out.append(f"{lang} {chunk.slug}: {', '.join(strange)}")
    return out


def print_pdf_latin_report(langs: list[str]) -> None:
    lines: list[str] = []
    for lang in langs:
        if lang in PDF_FILES:
            lines += report_pdf_latin(lang)
    print("\n=== PDF editions: printed Latin against the English appendix's ===")
    if not lines:
        print("  (no departures)")
        return
    for line in lines:
        print(f"  {line}")


# --------------------------------------------------------------------------
# The Litany of Loreto
# --------------------------------------------------------------------------
#
# A LITANY IS INVOCATIONS UNDER A HELD RESPONSE, AND THE SOURCE SAYS SO IN
# BOLD. Both mirrors mark the response with `<b>` and mark nothing else with
# it: English prints "<b>pray for us.</b>" once, on its own line, and then
# fifty-two more invocations under it; Portuguese bolds the response inline at
# the end of the line instead ("Cordeiro de Deus, ... <b>ouvi-nos, Senhor.</b>").
# The Kyrie and the closing collect carry no bold at all, and are prose.
#
# NONE OF THAT SURVIVED `flatten`, which strips every tag before anything sees
# it -- so the whole litany was stored as nine undifferentiated prose blocks,
# one of them a single paragraph holding all fifty-three Marian invocations
# with the response buried on its second line. Reading the bold RECOVERS what
# the source states; it does not impose a reading. What would be inventing
# text is printing "pray for us" fifty-three times, which the source
# deliberately does not do and which `Invocation.response_printed` exists to
# avoid.
#
# TWO THINGS THE MIRRORS DO NOT AGREE ON, both handled here:
#   - English glues the closing versicle and response into one paragraph;
#     Portuguese gives them two. So a paragraph that is nothing but a response
#     attaches to the invocation the previous paragraph ended on.
#   - English closes with a collect ("Let us pray. / Grant, we beseech
#     thee, ..."); the Portuguese page simply ends after the closing response
#     and prints no collect at all. That is the source, not a truncated parse
#     -- verified against the raw HTML, which closes its last `<p>` and then
#     its table. `LITANY_LAST` is therefore per language.

_BOLD_RUN_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.IGNORECASE | re.DOTALL)


def _split_bold_tail(segment_html: str) -> tuple[str, str | None]:
    """A printed line as `(plain part, bolded response)`.

    A BOLD RUN MUST HAVE TEXT IN IT. The English page contains
    `Mother of Mercy,<b><br /> </b>Mother of divine grace,` -- a bold wrapping
    nothing but a line break, one of the mirror's droppings. Read as a
    response it would cut the Marian run in half and invent a second held
    response of empty string."""
    bolds = [m for m in _BOLD_RUN_RE.finditer(segment_html) if flatten(m.group(1))]
    if not bolds:
        return flatten(segment_html), None
    last = bolds[-1]
    if segment_html[last.end() :].strip(" &nbsp;"):
        # Bold in the middle of a line is emphasis, not a response.
        return flatten(segment_html), None
    return flatten(segment_html[: last.start()]), flatten(last.group(1))


def _litany_blocks(paragraph_html: str) -> list[BlockOut]:
    """One litany paragraph as blocks.

    A run of invocations sharing one response becomes a `petitions` block; a
    lone invocation with its own response is an ordinary versicle/response
    pair, which is what the Kyrie's Agnus Dei lines and the closing couplet
    are; a paragraph with no bold at all stays prose."""
    segments = _BR_RE.split(paragraph_html)
    invocations: list[Invocation] = []
    response: str | None = None
    for seg in segments:
        plain, bold = _split_bold_tail(seg)
        if plain:
            invocations.append(Invocation(plain))
        if bold and response is None:
            response = bold
            if invocations:
                invocations[-1].response_printed = True
    lines = [i.text for i in invocations]
    if response is None:
        text = flatten(paragraph_html)
        return [BlockOut("prose", text, html=line_html(br_segments(paragraph_html)))]
    printed = [*lines]
    if not invocations:
        # A paragraph that is nothing but the response (Portuguese's closing).
        return [BlockOut("response", response)]
    if len(invocations) == 1:
        return [
            BlockOut("versicle", invocations[0].text),
            BlockOut("response", response),
        ]
    idx = next(
        (k for k, i in enumerate(invocations) if i.response_printed), len(printed)
    )
    printed = [*lines[: idx + 1], response, *lines[idx + 1 :]]
    return [
        BlockOut(
            "petitions",
            " ".join(printed),
            html=line_html(printed),
            response=response,
            invocations=invocations,
        )
    ]


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
    done = False
    for raw in paragraphs[starts[0] :]:
        text = flatten(raw)
        if text:
            blocks += _litany_blocks(raw)
        if text.startswith(last):
            done = True
            break
    if not done:
        raise RuntimeError(f"{lang}: could not locate the Litany closing paragraph")

    # A lone response paragraph belongs to the line before it -- see the
    # section comment on the two mirrors' paragraphing.
    merged: list[BlockOut] = []
    for block in blocks:
        if (
            block.kind == "response"
            and merged
            and merged[-1].kind == "prose"
            and "\n" not in merged[-1].text
            and merged[-1].html is None
        ):
            merged[-1] = BlockOut("versicle", merged[-1].text)
        merged.append(block)
    return merged


#: Each mirror's Litany page, as (title, first paragraph, last paragraph).
#: The two markers bound the prayer inside a page that also carries a language
#: bar and two headings; the title is the one the page prints over it, in that
#: page's own wording. English and Portuguese keep the titles they shipped
#: with, which are the pages' headings in ordinary case rather than the
#: all-caps they are set in.
LITANY_PAGES = {
    "en": ("The Litany of Loreto", "Lord have mercy.", "Let us pray."),
    "pt": (
        "Ladainha de Nossa Senhora",
        "Senhor, tende piedade de nós",
        "Para que sejamos dignos das promessas de Cristo.",
    ),
    "de": ("Lauretanische Litanei", "Herr, erbarme dich.", "Gütiger Gott"),
    "es": ("Letanías de la Virgen", "Señor, ten piedad", "ORACIÓN."),
    "fr": ("Litanies de Lorette", "Seigneur, prends pitié.", "Prions,"),
    "it": ("Litanie Lauretane", "Signore, pietà", "Concedi ai tuoi fedeli"),
}


def build_litany(lang: str) -> Callable[[str], list[Prayer]]:
    """A `Source.reader` for `lang`'s Litany page."""
    title, first, last = LITANY_PAGES[lang]

    def read(html_text: str) -> list[Prayer]:
        return [
            Prayer(
                0,
                LITANY_SLUG,
                title,
                _litany_paragraphs(html_text, first, last, lang.upper()),
            )
        ]

    return read


# The four Vatican mystery pages have a deliberately regular layout: five
# ``<td width="584">`` cells, each headed by a bold ordinal/title and followed
# by a Scripture meditation paragraph plus the recurring decade-prayer line.
# The latter is captured once as the Rosary's instructions, rather than being
# needlessly repeated in each of twenty items.
#: THE CELL WIDTH IS NOT A CONSTANT ACROSS THE MICRO-SITE. English and
#: Spanish set their five mystery cells at `width="584"`; Italian sets the
#: same five at `width="457"`. Hardcoding 584 finds zero cells on the Italian
#: pages and reports "expected 5, found 0", which reads like a missing capture
#: rather than a layout difference.
#:
#: So the width is DISCOVERED: of the widths this page uses, exactly one is
#: used five times, and that is the mystery cell. The outer container (769 on
#: every page seen) wraps them and is used once. Finding no such width, or
#: more than one, is a real failure and says so.
_ROSARY_TD_WIDTH_RE = re.compile(r'<td\s+width="(\d+)"', re.IGNORECASE)


def rosary_mystery_cells(html_text: str) -> list[str]:
    """The five mystery cells, at whatever width this page sets them."""
    counts: dict[str, int] = {}
    for m in _ROSARY_TD_WIDTH_RE.finditer(html_text):
        counts[m.group(1)] = counts.get(m.group(1), 0) + 1
    widths = [w for w, n in counts.items() if n == 5]
    if len(widths) != 1:
        return []
    return re.findall(
        rf'<td\s+width="{widths[0]}">(.*?)</td>', html_text, re.IGNORECASE | re.DOTALL
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
    cells = rosary_mystery_cells(html_text)
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
        title = flatten(title_match.group(1))
        # THE MEDITATION IS NOT ALWAYS THE FIRST PARAGRAPH. Spanish's Luminous
        # page prints the title TWICE in its opening cell -- once as the bold
        # heading and again as an ordinary paragraph beneath it -- where its
        # own four other pages, and every English and Portuguese page, print
        # the meditation there. Reading `paragraphs[0]` blindly gets the title,
        # which then fails for having no Scripture locator on the end of it.
        #
        # Dropping a paragraph that merely repeats the heading is narrow and
        # says exactly what the defect is; skipping to "the first paragraph
        # with a citation" would also swallow a genuinely uncited meditation,
        # which is a thing worth failing on rather than working around.
        body = [text for text in paragraphs if text != title]
        if not body:
            raise RuntimeError(
                f"{lang} {expected_filename}: mystery cell {title!r} has no meditation"
            )
        meditation, citation = split_rosary_meditation_citation(
            body[0], lang, expected_filename
        )
        items.append(MysteryItem(title, meditation, citation))
    return items


#: The micro-site's own heading over the "how to pray" directions, per
#: language. Matched EXACTLY (`flatten(raw) == heading`), so it is the page's
#: printed wording rather than a translation of ours -- a language whose page
#: heads the section differently gets a clear failure naming the count, not a
#: silently empty `instructions`.
ROSARY_INSTRUCTIONS_HEADING = {
    "en": "How to pray the Rosary?",
    "pt": "Como recitar o Rosário",
    "es": "¿Cómo se reza el Rosario?",
    "it": "Come si recita il Rosario?",
    "de": "Wie betet man den Rosenkranz?",
    "fr": "Comment se récite le chapelet?",
}


def parse_rosary_instructions(html_text: str, lang: str) -> PrayerInstructions:
    heading = ROSARY_INSTRUCTIONS_HEADING[lang]
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
    for index, (group, path) in enumerate(zip(rosary.groups, paths, strict=True)):
        if not path.exists():
            raise RuntimeError(
                f"{lang}: full Rosary-mystery raw source not found at {path}; "
                "capture it with --fetch-companions before parsing"
            )
        group.items = parse_rosary_mystery_page(
            path.read_text(encoding="cp1252", errors="replace"), lang, path.name
        )
        # Read out of the printed rubric, then checked against the rotation
        # both sources are known to print -- see `CANONICAL_MYSTERY_DAYS` for
        # why this direction (parse, then assert) rather than just assigning
        # the canonical answer, and for what a mis-zip would look like
        # without it.
        group.days = parse_rubric_days(group.rubric, lang)
        if set(group.days) != CANONICAL_MYSTERY_DAYS[index]:
            raise RuntimeError(
                f"{lang}: {group.name!r} rubric {group.rubric!r} names weekdays "
                f"{group.days}, expected {sorted(CANONICAL_MYSTERY_DAYS[index])}"
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
    only change the words.

    THAT REASONING ONLY BINDS A MATCH THAT SPANS A LINE BREAK, and the
    equal-word-count rule it implies was enforced over every match until
    2026-09-03. The French appendix needs the other case: it writes
    `qui a s&aelig;&acute; culo sunt`, leaving a SPACE inside a word after an
    accent that never composed, so the repair has to close two tokens into
    one (`sǽculo`) -- four times, and there is no way to say that while the
    word count is held fixed. A match containing no line break has none to
    preserve, so the separator argument does not apply to it and a plain
    substitution is exact. A match that DOES span one still has to keep the
    count, and still answers `None` when it cannot, so the caller fails
    loudly rather than guessing where the line should now break.
    """
    words_from, words_to = frm.split(), to.split()
    joined = "\n".join(lines)
    pattern = re.compile(r"[ \n]+".join(re.escape(w) for w in words_from))
    if len(words_from) != len(words_to):
        # permitted only where no match crosses a line break -- see above
        if any("\n" in m.group(0) for m in pattern.finditer(joined)):
            return None
        fixed, n = pattern.subn(lambda m: to, joined)
        return fixed.split("\n") if n else None

    def swap(m: re.Match[str]) -> str:
        seps = re.findall(r"[ \n]+", m.group(0))
        out = words_to[0]
        for sep, word in zip(seps, words_to[1:], strict=True):
            out += sep + word
        return out

    fixed, n = pattern.subn(swap, joined)
    return fixed.split("\n") if n else None


def correction_blocks(prayer: Prayer, c: dict) -> list[BlockOut]:
    """The blocks one correction is allowed to search.

    `field` USED TO BE DECORATIVE. Every correction on file said
    `"latin_text"` and this function did not exist: `apply_corrections` read
    `prayer.latin.blocks` unconditionally, so the key described what the code
    happened to do rather than directing it. That held for as long as every
    defect found here was in the Latin, which was not a property of the
    corpus so much as of which column had been read closely -- the first
    vernacular defect (a dropped letter in the UK Te Deum, 2026-08-26) could
    not be expressed at all.

    Three fields, because the English appendix has three texts per prayer and
    they are not interchangeable:

      - `latin_text`   the Latin companion the source prints alongside
      - `text`         the vernacular this edition prints
      - `variant_text` one REGIONAL wording, named by `locator.variant`

    The last is the reason this takes the whole correction and not just a
    field name. Corrections run before the UK/USA split is resolved (see
    `build_base_edition`), so at this point both wordings of the five
    regionalized prayers are still sitting in `variants` and neither is in
    `blocks`. A correction that named only `text` would find nothing there
    and, worse, a correction that searched `blocks` and `variants` together
    would silently repair whichever column happened to match -- the two
    wordings of the Te Deum share whole lines, so "whichever matched" is not
    a safe answer. The variant is named, and only that variant is searched.
    """
    field = c.get("field", "latin_text")
    if field == "latin_text":
        if prayer.latin is None:
            raise RuntimeError(
                f"correction {c['id']}: prayer {prayer.slug!r} has no Latin text"
            )
        return prayer.latin.blocks
    if field == "text":
        return prayer.blocks
    if field == "variant_text":
        label = c["locator"].get("variant")
        matches = [v for v in prayer.variants if v.label == label]
        if len(matches) != 1:
            raise RuntimeError(
                f"correction {c['id']}: expected exactly 1 {label!r} variant of "
                f"{prayer.slug!r}, found {len(matches)}"
            )
        return matches[0].blocks
    raise RuntimeError(f"correction {c['id']}: unknown field {field!r}")


def corrections_in_edition(
    applied: list[dict], prayers: list[Prayer], variant: str | None
) -> list[dict]:
    """Of the corrections applied to the parse, the ones whose text this
    EDITION actually carries.

    A receipt exists to be checked against the file it sits beside, so naming
    a change that is not in that file is the one thing it must not do -- and
    both English editions were doing it. The parse is corrected once and
    written three times, so `prayer.common.en-gb` (five prayers) shipped a
    receipt for a defect in `glory-be`, which it does not contain, and once
    the first vernacular correction landed (the UK Te Deum, 2026-08-26)
    `prayer.common.en` returned the favour with a receipt for a wording it
    does not print.

    Two tests, and the second is why `variant` is a parameter rather than
    something recoverable here: by write time the wordings are resolved and
    no `variants` array survives, so an edition cannot be asked which one it
    took. The caller knows -- `BASE_VARIANT` for the collection,
    `REGIONAL_VARIANT` for the regional edition, `None` for a language that
    has no regional split at all, where a `variant_text` correction belongs
    to nothing and is correctly dropped."""
    slugs = {p.slug for p in prayers}
    return [
        c
        for c in applied
        if c["locator"]["prayer"] in slugs
        and (
            c.get("field") != "variant_text"
            or (variant is not None and c["locator"].get("variant") == variant)
        )
    ]


def apply_corrections(prayers: list[Prayer], corrections: list[dict]) -> list[dict]:
    """Apply each correction to the single block of the named prayer's named
    text (`correction_blocks`) that contains its `from` verbatim. Fails
    loudly (drift guard) if the text isn't found in exactly one block --
    either it was already fixed, the source changed, or the locator is wrong;
    silently doing nothing in any of those cases would be worse than
    crashing."""
    by_slug = {p.slug: p for p in prayers}
    applied = []
    for c in corrections:
        slug = c["locator"]["prayer"]
        prayer = by_slug.get(slug)
        if prayer is None:
            raise RuntimeError(f"correction {c['id']}: no prayer {slug!r}")
        blocks = correction_blocks(prayer, c)
        matches = [b for b in blocks if c["from"] in b.text]
        if len(matches) != 1:
            raise RuntimeError(
                f"correction {c['id']}: expected exactly 1 block containing "
                f"{c['from']!r} in {slug}'s {c.get('field', 'latin_text')}, "
                f"found {len(matches)} (drift guard -- source text no longer "
                "matches the correction)"
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

_MOJIBAKE_PATTERNS = ["Ã©", "Ã§", "â€™", "â€", "Ã³"]

#: `Â` IS A REAL FRENCH LETTER AND WAS ON THE LIST ABOVE, which made the check
#: fire on "Âme du Christ" -- the Anima Christi's own French title. It is only
#: mojibake when it is not doing a letter's job, so what is flagged is a `Â`
#: NOT followed by a letter. The punctuation-glued form the mirror actually
#: emits is already removed in `flatten` (`_STRAY_ACIRC_RE`); this is the
#: check that would notice a new one, without condemning French.
_STRAY_ACIRC_CHECK_RE = re.compile("\u00c2(?![^\\W\\d_])")


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


def creed_source_note(spec: LangSpec) -> str:
    """Where THIS edition's two Creeds and Our Father were read from.

    One sentence and it was wrong for eleven of fourteen editions: it named
    the Catechism, which is true of English, Portuguese and Latin and of
    nothing else. Derived from the spec, so an edition whose source moves
    cannot go on describing the old one."""
    own, catechism = [], []
    for slug, source in (
        ("the two Creeds", spec.creeds),
        ("the Our Father", spec.our_father),
    ):
        if source is None:
            continue
        (own if source.url == spec.appendix.url else catechism).append(slug)
    parts = []
    if own:
        parts.append(
            f"{_and_list(own)} are read from the Compendium's OWN body, at the "
            "head of Part One Section Two and of Part Four Section Two, in this "
            "same file"
        )
    if catechism:
        parts.append(
            f"{_and_list(catechism)} are re-parsed from the already-cached "
            "Catechism HTML"
        )
    if not parts:
        return "This mirror prints neither Creed nor the Our Father anywhere."
    return f"{'; '.join(parts)} -- with zero new network fetches."


def _and_list(parts: list[str]) -> str:
    if len(parts) == 1:
        return parts[0]
    return f"{', '.join(parts[:-1])} and {parts[-1]}"


def edition_note(spec: LangSpec) -> str:
    """What this edition was assembled FROM, per edition rather than as one
    string for all of them.

    It was one string, and it named the Catechism for every edition -- true of
    English, Portuguese and Latin, and false of the eight that read their
    Creeds and their Our Father out of the Compendium's own body. The manifest
    is where a reader checks what a work is, so it may not describe three
    editions and be read by eleven."""
    parts = ["Compendium of the CCC (2005) Appendix A"]
    companions = [s for s in (spec.creeds, spec.our_father) if s]
    if any(s.url == spec.appendix.url for s in companions):
        parts.append("its own text of the Creeds and the Our Father")
    if any(s.url != spec.appendix.url for s in companions):
        parts.append("Catechism texts")
    if spec.litany or spec.rosary_mysteries:
        parts.append("Vatican Rosary pages")
    return _and_list(parts)


def check_source_coverage() -> list[str]:
    """Every per-prayer URL is one the manifest already lists, and every URL
    the manifest lists is claimed by some prayer.

    Both directions matter and they catch opposite mistakes. A per-prayer URL
    the manifest doesn't carry means the collection is attributing text to a
    page it never declared it read. A manifest URL nothing claims means a page
    was fetched and either isn't being used or is being used under someone
    else's attribution -- which is exactly the state `prayer_sources` was
    written to end, and the state a fifth Rosary page would silently recreate.

    Reads the constants, not parsed output, so it holds whether or not a
    parse ran."""
    problems: list[str] = []
    for lang in LANG_CONFIG:
        spec = LANG_CONFIG[lang]
        declared = {src["url"] for src in build_manifest(lang, [], [])["sources"]}
        claimed = {src["url"] for slug in SLUGS for src in prayer_sources(slug, lang)}
        if spec.rosary_mysteries:
            claimed |= {
                rosary_mystery_urls(spec.rosary_mysteries, name)[0]
                for name in ROSARY_MYSTERY_FILES
            }
        if claimed - declared:
            problems.append(
                f"{lang}: prayer sources not in the manifest: {sorted(claimed - declared)}"
            )
        if declared - claimed:
            problems.append(
                f"{lang}: manifest sources no prayer claims: {sorted(declared - claimed)}"
            )
    return problems


def validate_prayers(lang: str, prayers: list[Prayer]) -> list[str]:
    """One edition against what its own sources should have produced.

    PER LANGUAGE, NOT PER PAIR. This was `validate(en, pt)`, which asserted a
    28-slug collection twice and compared the two -- a shape that says nothing
    true about an edition whose mirror prints no Litany, and that FAILED
    outright the moment a third language existed, reporting the whole slug set
    as a mismatch against two empty lists. What survives is every check that
    was doing real work: the expected slug set and its ORDER (a parser that
    drops or duplicates a row desyncs it), the Latin companions, the Rosary's
    shape, and the text hygiene sweep."""
    spec = LANG_CONFIG[lang]
    problems: list[str] = []
    expected = spec.expected_slugs()
    got = [p.slug for p in prayers]
    if got != expected:
        missing, extra = set(expected) - set(got), set(got) - set(expected)
        if missing or extra:
            problems.append(
                f"{lang}: slug set mismatch -- missing {sorted(missing)}, "
                f"unexpected {sorted(extra)}"
            )
        else:
            problems.append(f"{lang}: slug ORDER differs from the source's print order")

    latin_missing = {p.slug for p in prayers if p.latin is None}
    if latin_missing != spec.expected_no_latin():
        problems.append(
            f"{lang}: Latin companions differ from the source -- unexpected gaps "
            f"{sorted(latin_missing - spec.expected_no_latin())}, unexpected Latin "
            f"{sorted(spec.expected_no_latin() - latin_missing)}"
        )

    for p in prayers:
        if not p.title.strip():
            problems.append(f"{lang} {p.slug}: empty title")
        if not p.blocks and not p.groups and not p.variants:
            problems.append(f"{lang} {p.slug}: no content blocks, groups, or variants")
        # Only an edition whose mirror publishes the mystery pages can have
        # groups and instructions; without them the Rosary is the bare
        # Appendix A entry, which is a shorter entry and not a broken one.
        if p.slug == "rosary" and spec.rosary_mysteries:
            if len(p.groups) != 4:
                problems.append(
                    f"{lang} rosary: expected 4 mystery groups, got {len(p.groups)}"
                )
            if p.instructions is None:
                problems.append(f"{lang} rosary: missing sourced instructions")
        for g in p.groups:
            if len(g.items) != 5:
                problems.append(
                    f"{lang} {p.slug}: mystery group {g.name!r} has "
                    f"{len(g.items)} items, expected 5"
                )
            for item in g.items:
                if not item.title:
                    problems.append(f"{lang} {p.slug}: untitled mystery in {g.name!r}")
                # A meditation and its citation come from the micro-site; the
                # bare Compendium entry names the five mysteries and no more.
                if spec.rosary_mysteries and (
                    not item.meditation or item.citation is None
                ):
                    problems.append(
                        f"{lang} {p.slug}: incomplete mystery in {g.name!r}"
                    )
        for text in collect_texts(p):
            if "<" in text or ">" in text:
                problems.append(f"{lang} {p.slug}: leftover markup in {text[:60]!r}")
            if "\ufffd" in text:
                problems.append(f"{lang} {p.slug}: replacement character present")
            for pat in _MOJIBAKE_PATTERNS:
                if pat in text:
                    problems.append(f"{lang} {p.slug}: mojibake pattern {pat!r}")
            if _STRAY_ACIRC_CHECK_RE.search(text):
                problems.append(f"{lang} {p.slug}: stray 'Â' outside a word")
            if "  " in text:
                problems.append(f"{lang} {p.slug}: double space in {text[:60]!r}")
    return problems


def validate(results: dict[str, list[Prayer]]) -> tuple[bool, list[str]]:
    """Every parsed edition, plus what only comparing them can show.

    THE CROSS-LANGUAGE ORACLE IS NARROWED, AND THIS IS THE NARROWING
    `docs/corpus-schema.md` NOW RECORDS. It used to read "the two vernacular
    collections' slug sets must match exactly", which was true while there
    were two and is false with ten: the collections are 28, 25, 24 and fewer
    entries long, for reasons that are all facts about the sources. What still
    holds -- and is still a real check rather than a tautology, because each
    mirror is parsed by its own reader -- is that where two editions BOTH
    print a prayer, both must have produced text for it."""
    problems = check_source_coverage()
    for lang in sorted(results):
        problems += validate_prayers(lang, results[lang])

    empty: dict[str, list[str]] = {}
    for lang, prayers in results.items():
        for p in prayers:
            if not collect_texts(p):
                empty.setdefault(p.slug, []).append(lang)
    for slug, langs in sorted(empty.items()):
        others = sorted(other for other in results if other not in langs)
        if others:
            problems.append(
                f"{slug}: empty in {sorted(langs)} but has text in {others}"
            )
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

    THE EXAMPLE THIS USED TO GIVE HAS EXPIRED, and usefully. It said the Latin
    edition prints no "Symbola et Oratio Dominica" heading because the two
    Creeds and the Our Father have no Latin anywhere in the source. That was
    true of the Compendium's appendix and false of the corpus: the Latin
    Catechism prints all three, and reading them (`LATIN_FROM_CATECHISM_SLUGS`)
    made the heading appear here with no change to this function at all --
    which is what being data-driven is for. The filter still fires: Latin
    prints no Eastern-rite prayers and no Litany, and Slovenian and Swedish
    each drop a different part of the Eastern-rite group.
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
# English for a Latin-preferring reader (docs/decisions.md §Addresses and editions).
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
            "one parse of one page. See docs/decisions.md §Addresses and editions "
            "for why "
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


#: `witnesses.json`'s third provenance value. The other two name a vernacular
#: edition whose Latin COLUMN was read; this one names a Latin page read
#: directly, so `text_from` and `segmentation_from` are both it and the
#: divergence column is empty by construction.
LATIN_CATECHISM_WITNESS = "ccc-la"


def read_latin_catechism_prayers() -> list[Prayer]:
    """The two Creeds and the Our Father, from the Latin Catechism."""
    out: list[Prayer] = []
    for path, reader in (
        (CCC_LA_CREDO_RAW, build_creeds_la),
        (CCC_LA_OUR_FATHER_RAW, lambda html: [build_our_father_la(html)]),
    ):
        if not path.exists():
            raise RuntimeError(
                f"la: raw Latin Catechism source not found at {path} -- this "
                "script never fetches during a parse; it belongs to ccc.py"
            )
        out += reader(path.read_text(encoding="cp1252", errors="replace"))
    return out


def build_latin_edition(
    en: list[Prayer], pt: list[Prayer]
) -> tuple[list[Prayer], list[dict]]:
    """`prayer.common.la`: three prayers read off the Latin Catechism, then
    twenty-one derived from both vernacular witnesses -- see the docblock.

    The report returned alongside is the audit trail: one row per prayer
    saying which witness supplied the text, which supplied the breaks, and
    whether the two disagreed about anything but orthography. It is written
    into the work as `witnesses.json` so the choice is inspectable without
    re-running this.
    """
    by_slug_pt = {p.slug: p for p in pt}
    out: list[Prayer] = []
    report: list[dict] = []

    # THE CATECHISM'S OWN THREE COME FIRST, in the collection's print order,
    # and take no part in the reconciliation below: there is one witness to
    # them, not two, so there is nothing to re-segment and nothing that could
    # diverge. See `LATIN_FROM_CATECHISM_SLUGS`.
    for prayer in read_latin_catechism_prayers():
        out.append(replace(prayer, n=len(out) + 1))
        report.append(
            {
                "slug": prayer.slug,
                "text_from": LATIN_CATECHISM_WITNESS,
                "segmentation_from": LATIN_CATECHISM_WITNESS,
                "blocks": len(prayer.blocks),
                "blocks_en": None,
                "blocks_pt": None,
                "divergence": None,
            }
        )

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


@dataclass(frozen=True)
class Source:
    """One page an edition draws on, with the reader that turns it into
    prayers.

    Every reader returns a LIST, including the two that can only ever produce
    one prayer. That is what lets `run` treat "this language has no Litany
    page" and "this language has one" as the same shape rather than as a
    branch -- an absent source contributes an empty list, and the collection
    is simply shorter. See `LANG_CONFIG` below for why that had to stop being
    a branch."""

    path: Path
    url: str
    retrieved_at: str
    reader: Callable[[str], list[Prayer]]


@dataclass(frozen=True)
class PdfSource:
    """A source that is a PDF, and so has no text to hand its reader.

    A `Source.reader` takes the page's HTML; there is no equivalent string
    here, and the reader needs the file's geometry rather than its characters.
    So it takes the LANGUAGE instead and resolves the file itself through the
    cache in `pdf_lines` -- a Compendium PDF is read once and its appendix, its
    Creeds and its Our Father all come out of that one read.

    A separate class rather than a flag on `Source`, so that `read_source`
    dispatches on the type and every one of the ten HTML readers keeps a
    signature that cannot be handed a language by mistake."""

    path: Path
    url: str
    retrieved_at: str
    reader: Callable[[str], list[Prayer]]


AnySource = Source | PdfSource


@dataclass(frozen=True)
class LangSpec:
    """What one language's collection is made of.

    THE COLLECTION IS ASSEMBLED FROM THREE UNRELATED SOURCE FAMILIES, and only
    the first is published in every language. The Compendium's Appendix A is
    on disk for all ten languages it was ever parsed in; the Catechism's own
    "Credo" and Lord's Prayer pages exist only where vatican.va publishes a
    CCC in that language; and the Holy Rosary micro-site -- which is where the
    Litany of Loreto and the twenty mysteries come from -- publishes six
    languages and no more.

    So a `None` here is a fact about the source, not a gap to fill later, and
    it is the same fact `prayer.common.la` has always expressed by carrying 21
    of 28 prayers: `build_structure` omits a group whose prayers an edition
    lacks, and `CONTENT_LANG_FALLBACK` reaches another edition for the rest.

    This replaced a chain of `if lang == "en" else <pt>` branches in `run`,
    which is the shape that cannot survive a third language -- each new one
    would have been another arm on six separate conditionals."""

    work_id: str
    title: str
    short_title: str
    #: The Compendium's Appendix A. The one source every edition has.
    appendix: AnySource
    #: The Catechism's own pages: both Creeds on one, the Our Father on the
    #: other. Absent where vatican.va publishes no CCC in this language --
    #: and absent for Spanish for a different reason, since the Spanish
    #: appendix prints its own Padre nuestro (see `build_prayers_es`).
    creeds: AnySource | None = None
    our_father: AnySource | None = None
    #: The Holy Rosary micro-site's Litany page.
    litany: Source | None = None
    #: That micro-site's own code for this language, naming the four
    #: mystery pages the Rosary entry is enriched from. `None` leaves the
    #: Rosary as the bare Appendix A entry the Compendium prints -- its
    #: title, rubric and concluding prayer, with no mysteries and no
    #: directions. NOT the corpus tag: the mirror spells German `ge`,
    #: Spanish `sp`, Portuguese `po`, and Italian not at all (see
    #: `rosary_mystery_raw`).
    rosary_mysteries: str | None = None
    #: This mirror's Appendix A print order. Spanish's is its own because it
    #: prints a 25th entry (`ES_APPENDIX_SLUGS`).
    appendix_slugs: list[str] = field(default_factory=lambda: APPENDIX_SLUGS)
    #: Appendix A entries this mirror does not print AT ALL -- a fact about
    #: the source, asserted so that a parser silently losing a row cannot be
    #: mistaken for one. Swedish omits two of the three Eastern-rite prayers
    #: and Slovenian all three.
    absent: frozenset[str] = frozenset()
    #: This edition's own copyright notice, where the page prints one that is
    #: not the shared LEV line. Only Romanian does: its Compendium is
    #: published in Romania by Editura Presa Buna under a LEV grant, and the
    #: page carries both that grant and the publisher's own imprint with an
    #: ISBN. Recording it is the whole point of `docs/research/copyright.md`'s
    #: posture -- the notice we print is the one the source prints.
    copyright_notice: str | None = None
    copyright_note: str | None = None
    #: Entries this mirror HEADS AND LEAVES BLANK -- it prints the title and
    #: then goes straight on to the next prayer. Distinct from `absent`, which
    #: is not printed at all: here the heading is real evidence the editors
    #: meant to include it, and only the words are missing. Dropped from the
    #: edition rather than shipped, because a prayer with a title and no text
    #: is not something a reader can use and `CONTENT_LANG_FALLBACK` will
    #: reach an edition that has it. Asserted to be genuinely empty, so that a
    #: mirror later filling one in fails here instead of staying dropped.
    headed_but_empty: frozenset[str] = frozenset()
    #: Entries whose Latin companion this mirror leaves empty. Defaults to the
    #: shared `NO_LATIN_SLUGS`; Spanish prints a Latin *Pater Noster* beside
    #: its own Our Father and so takes one fewer.
    no_latin: frozenset[str] | None = None
    #: This edition PRINTS a Latin column that no reader can recover, so none
    #: of it is published. A statement about the FILE, which is why it is not
    #: `no_latin`: that field says the source printed nothing, and saying so
    #: here would be false. Only the Belarusian PDF, whose accents are separate
    #: positioned glyphs over base letters its fonts do not map -- see the PDF
    #: section above for what each of the two readers makes of `et Fílii`.
    latin_unreadable: bool = False

    def expected_slugs(self) -> list[str]:
        """Exactly the prayers this edition's sources can produce, in the
        order `run` assembles them.

        THIS REPLACED A GLOBAL `SLUGS` COMPARISON, which asserted that every
        vernacular edition carries all 28 -- true of English and Portuguese
        and of nothing else. Four mirrors print no Litany because the Holy
        Rosary micro-site has no edition in their language, four print no
        Creeds because vatican.va publishes no Catechism in it, and two omit
        Eastern-rite prayers outright. Deriving the expectation from the same
        table the parse reads keeps the check sharp: it still fails on a
        dropped or duplicated row, which is what it was always for."""
        order: list[str] = []
        if self.creeds:
            order += [s for s in CREED_AND_LORDS_PRAYER_SLUGS if s != "our-father"]
        if self.our_father:
            order.append("our-father")
        order += [
            s
            for s in self.appendix_slugs
            if s not in self.absent and s not in self.headed_but_empty
        ]
        if self.litany:
            order.append(LITANY_SLUG)
        return order

    def expected_no_latin(self) -> frozenset[str]:
        if self.latin_unreadable:
            return frozenset(self.expected_slugs())
        base = NO_LATIN_SLUGS if self.no_latin is None else self.no_latin
        return frozenset(base) & set(self.expected_slugs())


def _one(reader: Callable[[str], Prayer]) -> Callable[[str], list[Prayer]]:
    """A single-prayer reader as a `Source.reader`. See `Source`."""
    return lambda html_text: [reader(html_text)]


COMPENDIUM_DOCUMENTS_URL = "https://www.vatican.va/archive/compendium_ccc/documents/"

#: The Compendium page each language's Appendix A is read from. MIRRORS
#: `EDITIONS` in `ccc/compendium.py`, which is the authority and the scraper
#: that captured every one of these -- the filenames are the archive mirror's
#: own codes, so German is `_ge`, Spanish `_sp` and Portuguese `_po`. Repeated
#: rather than imported because that file is a `uv run --script` program in a
#: sibling package, not a library; a name that drifts here fails loudly at
#: `read_source`, naming the path it looked for.
COMPENDIUM_FILES = {
    "de": "archive_2005_compendium-ccc_ge.html",
    "en": "archive_2005_compendium-ccc_en.html",
    "es": "archive_2005_compendium-ccc_sp.html",
    "fr": "archive_2005_compendium-ccc_fr.html",
    "hu": "archive_2005_compendium-ccc_hu.html",
    "it": "archive_2005_compendium-ccc_it.html",
    "pt": "archive_2005_compendium-ccc_po.html",
    "ro": "archive_2005_compendium-ccc_ro.html",
    "sl": "archive_2005_compendium-ccc_sl.html",
    "sv": "archive_2005_compendium-ccc_sv.html",
}


def litany_source(lang: str, code: str) -> Source:
    """The Holy Rosary micro-site's Litany page for `lang`."""
    url = litany_urls(code)[0]
    path = RAW_ROOT / f"rosary-{lang}" / url.rsplit("/", 1)[-1]
    return Source(path, url, captured_at(path, LITANY_RETRIEVED_AT), build_litany(lang))


def compendium_source(lang: str, reader: Callable[[str], list[Prayer]]) -> Source:
    """The Appendix A source for `lang`, dated from `raw/`'s own ledger."""
    name = COMPENDIUM_FILES[lang]
    path = RAW_ROOT / f"compendium-{lang}" / name
    return Source(
        path, COMPENDIUM_DOCUMENTS_URL + name, captured_at(path, RETRIEVED_AT), reader
    )


def pdf_source(lang: str, reader: Callable[[str], list[Prayer]]) -> PdfSource:
    """The same, for the four editions vatican.va publishes only as a PDF."""
    path = pdf_path(lang)
    return PdfSource(
        path,
        COMPENDIUM_DOCUMENTS_URL + PDF_FILES[lang],
        captured_at(path, RETRIEVED_AT),
        reader,
    )


LANG_CONFIG: dict[str, LangSpec] = {
    "en": LangSpec(
        work_id="prayer.common.en",
        title="Common Prayers",
        short_title="Common Prayers",
        appendix=compendium_source("en", build_prayers_en),
        creeds=Source(
            CCC_EN_CREDO_RAW,
            CCC_EN_CREDO_URL,
            captured_at(CCC_EN_CREDO_RAW, CCC_RETRIEVED_AT),
            build_creeds_en,
        ),
        our_father=Source(
            CCC_EN_OUR_FATHER_RAW,
            CCC_EN_OUR_FATHER_URL,
            captured_at(CCC_EN_OUR_FATHER_RAW, CCC_RETRIEVED_AT),
            _one(build_our_father_en),
        ),
        litany=Source(
            LITANY_EN_RAW,
            LITANY_EN_URL,
            captured_at(LITANY_EN_RAW, LITANY_RETRIEVED_AT),
            build_litany("en"),
        ),
        rosary_mysteries="en",
    ),
    "de": LangSpec(
        work_id="prayer.common.de",
        title="Allgemeine Gebete",
        short_title="Allgemeine Gebete",
        appendix=compendium_source("de", build_prayers_de),
        # The Creeds and the Our Father are the Compendium's OWN, from the
        # head of Part One Section Two and of Part Four Section Two -- the
        # same page the appendix above is read from, and no fetch.
        creeds=compendium_source("de", build_creeds_body("de")),
        our_father=compendium_source("de", build_our_father_body("de")),
        rosary_mysteries="ge",
        litany=litany_source("de", "ge"),
    ),
    "es": LangSpec(
        work_id="prayer.common.es",
        title="Oraciones Comunes",
        short_title="Oraciones Comunes",
        appendix=compendium_source("es", build_prayers_es),
        # The Creeds are the Compendium's own, from the head of Part One
        # Section Two -- a two-column table on the same page as the appendix.
        creeds=compendium_source("es", build_creeds_body("es")),
        # No `our_father`: the Spanish appendix prints its own, as its 25th
        # row (see `ES_APPENDIX_SLUGS`) -- with a Latin *Pater Noster* beside
        # it, which is why `no_latin` is one shorter than everyone else's.
        rosary_mysteries="sp",
        litany=litany_source("es", "sp"),
        appendix_slugs=ES_APPENDIX_SLUGS,
        no_latin=NO_LATIN_SLUGS - {"our-father"},
    ),
    "ro": LangSpec(
        work_id="prayer.common.ro",
        title="Rugăciuni obişnuite",
        short_title="Rugăciuni obişnuite",
        appendix=compendium_source("ro", build_prayers_ro),
        # The Creeds and the Our Father are the Compendium's OWN, from the
        # head of Part One Section Two and of Part Four Section Two -- the
        # same page the appendix above is read from, and no fetch.
        creeds=compendium_source("ro", build_creeds_body("ro")),
        our_father=compendium_source("ro", build_our_father_body("ro")),
        copyright_notice=(
            "Copyright © 2005 - Libreria Editrice Vaticana pentru folosirea în "
            "România a traducerii în limba română"
        ),
        copyright_note=(
            "The Romanian Compendium is published in Romania by Editura Presa "
            "Bună (Iaşi), under the Libreria Editrice Vaticana grant its own "
            "page prints; the page carries that grant, the publisher's imprint "
            "and an ISBN, where every other edition carries only the LEV line. "
            "Both are recorded rather than normalised away."
        ),
    ),
    "sl": LangSpec(
        work_id="prayer.common.sl",
        title="Splošne molitve",
        short_title="Splošne molitve",
        appendix=compendium_source("sl", build_prayers_sl),
        # The Creeds and the Our Father are the Compendium's OWN, from the
        # head of Part One Section Two and of Part Four Section Two -- the
        # same page the appendix above is read from, and no fetch.
        creeds=compendium_source("sl", build_creeds_body("sl")),
        our_father=compendium_source("sl", build_our_father_body("sl")),
        appendix_slugs=[s for s in APPENDIX_SLUGS if s not in SL_ABSENT],
        absent=SL_ABSENT | SL_LATIN_ONLY,
    ),
    "sv": LangSpec(
        work_id="prayer.common.sv",
        title="Vanliga böner",
        short_title="Vanliga böner",
        appendix=compendium_source("sv", build_prayers_sv),
        # The Creeds and the Our Father are the Compendium's OWN, from the
        # head of Part One Section Two and of Part Four Section Two -- the
        # same page the appendix above is read from, and no fetch.
        creeds=compendium_source("sv", build_creeds_body("sv")),
        our_father=compendium_source("sv", build_our_father_body("sv")),
        # The Holy Rosary micro-site publishes six languages and Swedish is
        # not one of them -- so no Litany, and a Rosary that is the bare
        # Appendix A entry. The Creeds and the Our Father do NOT depend on
        # vatican.va publishing a Swedish Catechism, which it does not: the
        # Compendium prints all three itself.
        appendix_slugs=SV_APPENDIX_SLUGS,
        absent=SV_ABSENT,
    ),
    "fr": LangSpec(
        work_id="prayer.common.fr",
        title="Prières Communes",
        short_title="Prières Communes",
        appendix=compendium_source("fr", build_prayers_fr),
        # The Creeds and the Our Father are the Compendium's OWN, from the
        # head of Part One Section Two and of Part Four Section Two -- the
        # same page the appendix above is read from, and no fetch.
        creeds=compendium_source("fr", build_creeds_body("fr")),
        our_father=compendium_source("fr", build_our_father_body("fr")),
        rosary_mysteries="fr",
        litany=litany_source("fr", "fr"),
    ),
    "hu": LangSpec(
        work_id="prayer.common.hu",
        title="Alapvető imádságok",
        short_title="Alapvető imádságok",
        appendix=compendium_source("hu", build_prayers_hu),
        # The Creeds and the Our Father are the Compendium's OWN, from the
        # head of Part One Section Two and of Part Four Section Two -- the
        # same page the appendix above is read from, and no fetch.
        creeds=compendium_source("hu", build_creeds_body("hu")),
        our_father=compendium_source("hu", build_our_father_body("hu")),
        # The Hungarian appendix prints "Jöjj, Szentlélek Istenünk" as a bold
        # heading and then moves straight to the next prayer -- the Veni
        # Sancte Spiritus has no text in this edition. It is the same kind of
        # gap as its Rosary, which prints two of the four mystery groups.
        headed_but_empty=frozenset({"veni-sancte-spiritus"}),
    ),
    "it": LangSpec(
        work_id="prayer.common.it",
        title="Preghiere Comuni",
        short_title="Preghiere Comuni",
        appendix=compendium_source("it", build_prayers_it),
        # The Creeds and the Our Father are the Compendium's OWN, from the
        # head of Part One Section Two and of Part Four Section Two -- the
        # same page the appendix above is read from, and no fetch.
        creeds=compendium_source("it", build_creeds_body("it")),
        our_father=compendium_source("it", build_our_father_body("it")),
        rosary_mysteries="it",
        litany=litany_source("it", "it"),
    ),
    "pt": LangSpec(
        work_id="prayer.common.pt",
        title="Orações Comuns",
        short_title="Orações Comuns",
        appendix=compendium_source("pt", build_prayers_pt),
        creeds=Source(
            CCC_PT_CREDO_RAW,
            CCC_PT_CREDO_URL,
            captured_at(CCC_PT_CREDO_RAW, CCC_RETRIEVED_AT),
            build_creeds_pt,
        ),
        our_father=Source(
            CCC_PT_OUR_FATHER_RAW,
            CCC_PT_OUR_FATHER_URL,
            captured_at(CCC_PT_OUR_FATHER_RAW, CCC_RETRIEVED_AT),
            _one(build_our_father_pt),
        ),
        litany=Source(
            LITANY_PT_RAW,
            LITANY_PT_URL,
            captured_at(LITANY_PT_RAW, LITANY_RETRIEVED_AT),
            build_litany("pt"),
        ),
        rosary_mysteries="po",
    ),
    # ---- the four PDF editions ------------------------------------------
    #
    # Every one of them is Appendix A entire, plus the two Creeds and the Our
    # Father out of the Compendium's own body -- the same three the eight HTML
    # editions above gained, from the same two places in the same book, read
    # out of a page rather than out of markup. No fetch: all four files have
    # been in `raw/` since compendium.py captured them, and their 598-question
    # bodies are already `compendium.{be,id,lt,ru}`.
    #
    # NONE OF THEM HAS A LITANY OR MYSTERY PAGES. The Holy Rosary micro-site
    # publishes six languages and none of these is among them, so the Rosary
    # here is the bare Appendix A entry the Compendium prints -- its title,
    # its four mystery lists and its concluding prayer -- which is a shorter
    # entry and not a broken one (see `LangSpec`).
    #
    # EACH CARRIES A SECOND RIGHTS HOLDER. These four translations were
    # published by the national bishops' conference rather than by LEV, and
    # each PDF prints both notices; `pdf_copyright` is the table
    # `ccc/compendium.py` already reads them from.
    "be": LangSpec(
        work_id="prayer.common.be",
        title="Агульныя малітвы",
        short_title="Агульныя малітвы",
        appendix=pdf_source("be", read_pdf_appendix),
        creeds=pdf_source("be", read_pdf_creeds),
        our_father=pdf_source("be", read_pdf_our_father),
        # ITS LATIN COLUMN IS PRINTED AND NOT PUBLISHED. The file sets every
        # accent as a separate positioned glyph over a base letter its fonts
        # do not map: MuPDF answers `et F<FFFD>´lii` for `et Fílii` and floats
        # some accents to the end of the line, poppler combines them onto the
        # wrong letter (`Fĺii`) and drops others outright. 84.9% of the
        # English appendix's Latin words survive, against 99.5%, 99.2% and
        # 95.1% in the other three. There is no reading of that column that is
        # not partly guesswork, and `prayer.common.la` publishes the same
        # texts whole.
        latin_unreadable=True,
        copyright_notice=pdf_copyright("be", COPYRIGHT_NOTICE),
        copyright_note=(
            "Published as a PDF by the Conference of Catholic Bishops in "
            "Belarus under a Libreria Editrice Vaticana grant; the file "
            "prints both notices and both are recorded."
        ),
    ),
    "id": LangSpec(
        work_id="prayer.common.id",
        title="Doa Bersama",
        short_title="Doa Bersama",
        appendix=pdf_source("id", read_pdf_appendix),
        creeds=pdf_source("id", read_pdf_creeds),
        our_father=pdf_source("id", read_pdf_our_father),
        # This edition ends the Rosary at the Glorious Mysteries and goes
        # straight to the Act of Faith: it prints neither the Rosary's
        # concluding prayer nor any of the three Eastern-rite prayers. The
        # same statement Swedish and Slovenian make about the same three.
        absent=frozenset(EASTERN_SLUGS),
        copyright_notice=pdf_copyright("id", COPYRIGHT_NOTICE),
        copyright_note=(
            "Published as a PDF by the Indonesian Bishops' Conference and "
            "Penerbit Kanisius under a Libreria Editrice Vaticana grant; the "
            "file prints both notices and both are recorded."
        ),
    ),
    "lt": LangSpec(
        work_id="prayer.common.lt",
        title="Bendrosios maldos",
        short_title="Bendrosios maldos",
        appendix=pdf_source("lt", read_pdf_appendix),
        creeds=pdf_source("lt", read_pdf_creeds),
        our_father=pdf_source("lt", read_pdf_our_father),
        copyright_notice=pdf_copyright("lt", COPYRIGHT_NOTICE),
        copyright_note=(
            "Published as a PDF by the Lithuanian Bishops' Conference under a "
            "Libreria Editrice Vaticana grant; the file prints both notices "
            "and both are recorded."
        ),
    ),
    "ru": LangSpec(
        work_id="prayer.common.ru",
        title="Основные молитвы",
        short_title="Основные молитвы",
        appendix=pdf_source("ru", read_pdf_appendix),
        creeds=pdf_source("ru", read_pdf_creeds),
        our_father=pdf_source("ru", read_pdf_our_father),
        copyright_notice=pdf_copyright("ru", COPYRIGHT_NOTICE),
        copyright_note=(
            "Published as a PDF by the Cultural Centre \u00abSpiritual "
            "Library\u00bb under a Libreria Editrice Vaticana grant; the file "
            "prints both notices and both are recorded."
        ),
    ),
}


# --------------------------------------------------------------------------
# Per-prayer provenance
# --------------------------------------------------------------------------
#
# THE WORK-LEVEL SOURCE LIST WAS NOT ENOUGH, and the Rosary is what made that
# visible. A manifest carries eight `sources` for the English collection and
# says nothing about which prayer came from which; the site's copyright
# notice, having no better rule available, linked `sources[0]` -- the
# Compendium appendix page -- under every one of the twenty-eight. That is
# right for twenty-four of them and wrong for four:
#
#   - the Apostles' Creed and the Nicene Creed are parsed from the
#     Catechism's own "The Credo" page,
#   - the Our Father from the unnumbered prayer at CCC 2759,
#   - the Litany of Loreto from the Holy Rosary micro-site,
#
# and PARTLY wrong for the Rosary, which is the case worth spelling out. Its
# `blocks` -- the title, the rubric, the concluding prayer -- genuinely are
# the Compendium's Appendix A entry. Its twenty mysteries and its directions
# for praying are not: those are `enrich_rosary_with_full_mysteries`, from
# four separate micro-site pages captured on 2026-08-18, and they are the
# overwhelming bulk of what a reader sees on that page. Attributing all of it
# to the Compendium told a reader to go check a page that does not contain
# the text they just read.
#
# So provenance is recorded where the text is, at three levels: the prayer's
# own `sources`, and -- for the Rosary alone, because it is the only entry
# assembled from more than one page -- a `source` on each mystery group and
# on the instructions. The site prints the first under the title and the
# others beside the sections they belong to, which is what makes the whole
# page checkable rather than just its top.
#
# Derived from the same constants the manifest's list is built from, so the
# two cannot drift: `validate_prayers` asserts every per-prayer URL appears
# in the manifest and that every manifest URL is claimed by some prayer.


def prayer_sources(slug: str, lang: str) -> list[dict]:
    """Where `slug`'s own text came from, as `{url, retrieved_at}`.

    Not the mysteries or the instructions -- those carry their own `source`,
    because they come from pages this entry's surrounding text does not."""
    if lang == "la" and slug in LATIN_FROM_CATECHISM_SLUGS:
        # Read off the Latin Catechism itself, not derived from either
        # vernacular witness -- so neither Compendium page is its provenance.
        url = CCC_LA_OUR_FATHER_URL if slug == "our-father" else CCC_LA_CREDO_URL
        path = CCC_LA_OUR_FATHER_RAW if slug == "our-father" else CCC_LA_CREDO_RAW
        return [{"url": url, "retrieved_at": captured_at(path, CCC_RETRIEVED_AT)}]
    if lang == "la":
        # A DERIVED edition (see `build_latin_edition`): its text is the
        # `latin` field of both vernacular witnesses, which are two cells on
        # two Compendium pages. Both are named because both were read -- the
        # English is where the wording is transcribed from and the
        # Portuguese is where five of these prayers break into stanzas.
        return [
            {"url": EN_URL, "retrieved_at": RETRIEVED_AT},
            {"url": PT_URL, "retrieved_at": RETRIEVED_AT},
        ]
    # READ OFF THE SAME TABLE THE PARSE READ, so the two cannot disagree.
    # This was three `if lang == "en" else <pt>` conditionals restating what
    # `LangSpec` now says once; with ten languages that is ten chances for a
    # prayer to claim a page it was not parsed from, and the only thing that
    # would catch it is `check_source_coverage` -- which compares this against
    # a manifest built from the same wrong constants.
    #
    # SPANISH IS WHY THIS MATTERS RATHER THAN BEING MERELY TIDIER. Its Our
    # Father is the appendix's own 25th row, not the Catechism's page, so the
    # slug-to-source answer genuinely differs per language and cannot be
    # written as one rule about slugs.
    spec = LANG_CONFIG[lang]
    if slug in ("apostles-creed", "nicene-creed") and spec.creeds:
        source = spec.creeds
    elif slug == "our-father" and spec.our_father:
        source = spec.our_father
    elif slug == LITANY_SLUG and spec.litany:
        source = spec.litany
    else:
        source = spec.appendix
    return [{"url": source.url, "retrieved_at": source.retrieved_at}]


def attach_sources(prayers: list[Prayer], lang: str) -> None:
    """Fill `Prayer.sources` and, on the Rosary, each group's and the
    instructions' own `source`.

    Called just before writing rather than during parsing because the same
    parsed prayers are written into three editions (`en`, `en-gb`, `la`) and
    the answer differs by edition -- the regional edition's five prayers are
    the English page's UK column, the Latin edition's text is neither page's
    vernacular. Idempotent: re-running it overwrites rather than appends."""
    code = LANG_CONFIG[lang].rosary_mysteries if lang in LANG_CONFIG else None
    mystery_urls = (
        [rosary_mystery_urls(code, name)[0] for name in ROSARY_MYSTERY_FILES]
        if code
        else []
    )
    for prayer in prayers:
        prayer.sources = prayer_sources(prayer.slug, lang)
        # An edition whose mirror publishes no mystery pages has a Rosary with
        # no `groups` to attribute -- the bare Appendix A entry (see `run`).
        if prayer.slug != "rosary" or lang == "la" or not mystery_urls:
            # The Latin Rosary has no mysteries and no instructions: the
            # Compendium prints Latin for the entry, and the micro-site
            # pages are vernacular only. Nothing to attribute.
            continue
        for group, url in zip(prayer.groups, mystery_urls, strict=True):
            group.source = url
        if prayer.instructions:
            # `parse_rosary_instructions` reads the FIRST mystery page --
            # the directions are printed once, on the Joyful Mysteries page,
            # and shared by all four.
            prayer.instructions.source = mystery_urls[0]


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
    spec = LANG_CONFIG[lang]
    n_with_latin = sum(1 for p in prayers if p.latin)
    varied = varied or []
    notes = [
        (
            f"The {len(spec.expected_slugs()) - len(CREED_AND_LORDS_PRAYER_SLUGS)}"
            ' Appendix A ("Common Prayers") '
            "entries are sourced from the same Compendium of the CCC (2005) "
            f"{'PDF' if isinstance(spec.appendix, PdfSource) else 'page'} "
            f"already parsed into compendium.{lang}; "
            + creed_source_note(spec)
            + ' Appendix B ("Formulas of Catholic Doctrine") is '
            "adjacent in the same source but is not prayers (short catechetical "
            "enumerations -- virtues, precepts, capital sins, ...); deliberately "
            "out of scope here, same as it remains for compendium." + lang + "."
        ),
        (
            f"{n_with_latin}/{len(prayers) or len(spec.expected_slugs())} prayers "
            "carry an optional `latin` field. "
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
                "(docs/decisions.md §Addresses and editions)."
            )
            if lang == "en"
            else (
                "This source prints one wording throughout, so the regional "
                "split the English appendix carries -- a UK and a USA wording "
                f"of five prayers, separated as {REGIONAL_WORK_ID} -- has no "
                "counterpart here."
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
    ]
    if spec.rosary_mysteries:
        notes.append(
            "The Rosary is the one entry with a `groups` array and "
            "`instructions`: its four named mystery groups retain the "
            "Compendium's weekday rubrics, while each of the twenty items "
            "carries the full Scripture meditation printed in Vatican's "
            "Holy Rosary mystery pages. Those pages also supply the opening "
            "invocation and decade-by-decade directions."
        )
    else:
        notes.append(
            "The Rosary here is the entry the Compendium's appendix prints and "
            "no more -- its title, its four mystery lists and its concluding "
            "prayer, with no `groups` and no directions for praying it. Those "
            "come from the Vatican Holy Rosary micro-site, which publishes six "
            "languages and not this one."
        )
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
    if spec.litany:
        notes.append(
            "The Litany of Loreto is sourced from the Vatican Holy Rosary "
            "micro-site page in this language, captured with the two-second "
            "crawl delay. Those pages show no visible copyright notice; their "
            "HTML metadata names the Dicastery for Communication as publisher, "
            "so the project's existing Vatican/LEV copyright posture applies "
            "rather than treating the absent notice as a licence."
        )
    if spec.latin_unreadable:
        notes.append(
            "This edition PRINTS a Latin column beside every prayer and none of "
            "it is published here. Its accents are set as separate positioned "
            "glyphs over base letters the embedded fonts do not map, and the two "
            "PDF readers fail differently and both irrecoverably: MuPDF answers "
            "`et F?\u00b4lii` for `et Fílii`, with the base letter unmapped, and "
            "floats some accents to the end of the line; poppler combines them "
            "onto the following letter "
            "(`Fĺii`) and drops others outright (`nostr.` for `nostræ`). Word "
            "for word against the English appendix's Latin column that text "
            "scores 84.9%, where the other three PDF editions score 99.5%, "
            "99.2% and 95.1%. The same Latin texts are published whole as "
            "prayer.common.la."
        )
    if spec.absent:
        notes.append(
            f"This edition does not print {len(spec.absent)} of Appendix A's "
            f"entries at all -- {', '.join(sorted(spec.absent))} -- so the "
            "collection is shorter here than in the editions that do. An "
            "absence in the source, asserted rather than inferred, so that a "
            "parser silently losing a row cannot be mistaken for it."
        )
    if spec.copyright_note:
        notes.append(spec.copyright_note)
    if applied_corrections:
        notes.append(
            f"{len(applied_corrections)} correction(s) applied from "
            f"pipeline/corrections/{spec.work_id}.json -- see "
            "corrections-applied.json for the receipt."
        )
    # DERIVED FROM THE SAME TABLE `prayer_sources` READS, which is what keeps
    # `check_source_coverage`'s two-way assertion meaningful: it checks that no
    # prayer claims a page the manifest does not declare and that no declared
    # page goes unclaimed, and that check is worth nothing if both sides are
    # built from the same hand-written pair of conditionals.
    # DEDUPED BY URL, in first-declared order. Eight editions read their Creeds
    # and their Our Father out of the Compendium page the appendix is on, so
    # three of a spec's four sources are one file and a manifest listing it
    # three times would claim three pages this work does not have.
    # `check_source_coverage` compares this list against `prayer_sources`, which
    # answers per prayer and so cannot see the repetition.
    sources: list[dict] = []
    for source in (spec.appendix, spec.creeds, spec.our_father, spec.litany):
        if source and not any(entry["url"] == source.url for entry in sources):
            sources.append({"url": source.url, "retrieved_at": source.retrieved_at})
    if spec.rosary_mysteries:
        sources += [
            {
                "url": rosary_mystery_urls(spec.rosary_mysteries, name)[0],
                "retrieved_at": ROSARY_MYSTERIES_RETRIEVED_AT,
            }
            for name in ROSARY_MYSTERY_FILES
        ]
    return {
        "id": spec.work_id,
        "type": "prayer",
        "title": spec.title,
        "short_title": spec.short_title,
        "language": lang,
        "edition": edition_note(spec),
        "sources": sources,
        "copyright": {
            "status": "copyrighted",
            "holder": COPYRIGHT_HOLDER,
            "notice": spec.copyright_notice or COPYRIGHT_NOTICE,
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
    spec = LANG_CONFIG[lang]
    out_dir = BUILD_ROOT / spec.work_id
    out_dir.mkdir(parents=True, exist_ok=True)

    attach_sources(prayers, lang)
    # The collection prints the base wording where the source prints two, so
    # a correction to the OTHER wording is not in this file -- see
    # `corrections_in_edition`. Portuguese has no regional split, hence the
    # `if`: its `None` drops any `variant_text` correction, and there are none
    # to drop.
    applied_corrections = corrections_in_edition(
        applied_corrections, prayers, BASE_VARIANT if lang == "en" else None
    )
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
        "edition": (
            "Compendium of the CCC (2005) Appendix A, Latin columns, with the "
            "Creeds and the Lord's Prayer from the Catechism's Latin edition"
        ),
        "sources": [
            {"url": EN_URL, "retrieved_at": RETRIEVED_AT},
            {"url": PT_URL, "retrieved_at": RETRIEVED_AT},
            {
                "url": CCC_LA_CREDO_URL,
                "retrieved_at": captured_at(CCC_LA_CREDO_RAW, CCC_RETRIEVED_AT),
            },
            {
                "url": CCC_LA_OUR_FATHER_URL,
                "retrieved_at": captured_at(CCC_LA_OUR_FATHER_RAW, CCC_RETRIEVED_AT),
            },
        ],
        "copyright": {
            "status": "copyrighted",
            "holder": COPYRIGHT_HOLDER,
            "notice": COPYRIGHT_NOTICE,
        },
        "notes": " ".join(
            [
                (
                    f"Assembled from two kinds of source, {len(prayers)} prayers in "
                    f"all. {len(LATIN_SLUGS)} are DERIVED, not separately scraped: "
                    "the prayers the Compendium of the CCC prints with a Latin "
                    "companion, lifted out of the `latin` field the vernacular "
                    f"editions already carry. {len(LATIN_FROM_CATECHISM_SLUGS)} are "
                    "read directly off the Catechism's own Latin edition -- the "
                    "Apostles' and Nicene Creeds from its SYMBOLUM FIDEI table and "
                    "the Our Father from the text it prints at 2759 -- because the "
                    "Compendium's appendix prints no Latin for them and the "
                    "Catechism does. `witnesses.json` marks those three `ccc-la`, "
                    "and they take no part in the two-witness reconciliation "
                    "described below, there being one witness to them. The four "
                    "still absent (the three Eastern prayers and the Litany of "
                    "Loreto) are printed with no Latin anywhere in the source -- a "
                    "property of the source, not a gap to fill. The per-prayer "
                    "`latin` field remains in both vernacular "
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
    out_dir = BUILD_ROOT / LATIN_WORK_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    attach_sources(prayers, "la")
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
    # THE EDITION IS NOW TWO DERIVATIONS, NOT ONE, and only the second has an
    # English witness to fold against. The three from the Latin Catechism are
    # read off a Latin page; there is no `en.latin` for them, and asserting
    # one is what this used to do -- it crashed rather than reporting, because
    # the assert ran before any check could describe the problem.
    expected = LATIN_FROM_CATECHISM_SLUGS + [p.slug for p in en if p.latin]
    got = [p.slug for p in latin]
    if got != expected:
        problems.append(f"slug set/order drifted: {got} != {expected}")

    en_by_slug = {p.slug: p for p in en}
    for prayer in latin:
        if prayer.slug in LATIN_FROM_CATECHISM_SLUGS:
            if not any(b.text.strip() for b in prayer.blocks):
                problems.append(f"{prayer.slug}: no Latin text from the Catechism")
            continue
        source = en_by_slug[prayer.slug].latin
        if source is None:
            problems.append(f"{prayer.slug}: no English witness to fold against")
            continue
        want = [c for _, c in _fold_stream(" ".join(b.text for b in source.blocks))]
        have = [c for _, c in _fold_stream(" ".join(b.text for b in prayer.blocks))]
        if want != have:
            problems.append(f"{prayer.slug}: text differs from the EN witness")
        if any(not b.text.strip() for b in prayer.blocks):
            problems.append(f"{prayer.slug}: empty block")

    pt_slugs = {p.slug for p in pt if p.latin}
    missing = [
        s for s in got if s not in pt_slugs and s not in LATIN_FROM_CATECHISM_SLUGS
    ]
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


def read_source(lang: str, source: AnySource) -> list[Prayer]:
    """One source's prayers, or a hard failure naming the file.

    A source NAMED in a `LangSpec` and missing from disk is an error, never a
    silent skip: the way a language contributes nothing is by having `None`
    there, which is a statement about the mirror. A missing file instead means
    somebody has to go and get it -- with `--fetch-companions` if it is a
    micro-site page, or by running the scraper that owns it."""
    if not source.path.exists():
        raise RuntimeError(
            f"{lang}: raw source not found at {source.path} -- this script never "
            "fetches during a parse (see module docstring). A micro-site page is "
            "captured with --fetch-companions; a Compendium or Catechism page "
            "belongs to compendium.py or ccc.py, not to a workaround here."
        )
    if isinstance(source, PdfSource):
        return source.reader(lang)
    return source.reader(source.path.read_text(encoding="cp1252", errors="replace"))


def run(lang: str) -> tuple[list[Prayer], list[dict]]:
    spec = LANG_CONFIG[lang]
    appendix_prayers = read_source(lang, spec.appendix)

    # THE ROSARY IS ENRICHED ONLY WHERE THE MICRO-SITE PUBLISHES IT. Without
    # those four pages the Appendix A entry stands as the Compendium prints
    # it -- a title, a rubric and the concluding prayer -- which is a shorter
    # entry, not a broken one.
    rosary = next(
        (prayer for prayer in appendix_prayers if prayer.slug == "rosary"), None
    )
    if rosary is None:
        raise RuntimeError(f"{lang}: Appendix A parser produced no Rosary entry")
    if spec.rosary_mysteries:
        enrich_rosary_with_full_mysteries(rosary, lang)

    # The order the collection is published in: the Catechism's three texts
    # first, then the appendix in its own print order, then the Litany. A
    # language missing any of them simply contributes nothing there -- and
    # Spanish prints its own Our Father INSIDE the appendix, so it arrives in
    # the middle rather than at the front. `n` is print order within one
    # language and the slug is the address, so that is a difference the schema
    # already allows for (docs/corpus-schema.md §Prayers).
    prayers = [
        *(read_source(lang, spec.creeds) if spec.creeds else []),
        *(read_source(lang, spec.our_father) if spec.our_father else []),
        *appendix_prayers,
        *(read_source(lang, spec.litany) if spec.litany else []),
    ]
    # Drop the prayers this mirror heads and leaves blank, checking first that
    # they really are blank -- see `LangSpec.headed_but_empty`.
    if spec.headed_but_empty:
        for prayer in prayers:
            has_body = prayer.blocks or prayer.groups or prayer.variants
            if prayer.slug in spec.headed_but_empty and has_body:
                raise RuntimeError(
                    f"{lang}: {prayer.slug} is listed as headed-but-empty and now "
                    "has text -- the source has changed, so remove it from the list"
                )
        prayers = [p for p in prayers if p.slug not in spec.headed_but_empty]

    for n, prayer in enumerate(prayers, start=1):
        prayer.n = n
    corrections = load_corrections(spec.work_id)
    applied = apply_corrections(prayers, corrections) if corrections else []
    return prayers, applied


def write_regional_outputs(
    prayers: list[Prayer], applied_corrections: list[dict]
) -> None:
    out_dir = BUILD_ROOT / REGIONAL_WORK_ID
    out_dir.mkdir(parents=True, exist_ok=True)
    # "en", not a tag of its own: the UK wording is the second column of the
    # SAME English Compendium page, so its provenance is the English one.
    attach_sources(prayers, "en")
    applied_corrections = corrections_in_edition(
        applied_corrections, prayers, REGIONAL_VARIANT
    )
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


def print_body_latin_report(langs: list[str]) -> None:
    """What every Compendium's printed Latin says against the Catechism's.

    Printed rather than gated, and printed for EVERY edition rather than the
    eight that are read here -- English and Portuguese take these prayers from
    their own Catechism, so a divergence in their Compendium costs the corpus
    nothing and is still the cheapest evidence there is for telling a received
    variant from a misprint. Five editions agreeing on `Dei Patris` is the
    first; one edition alone printing `caeeli` is the second."""
    reports: list[str] = []
    for lang in langs:
        # The four PDF editions print the same region and are read by
        # `report_pdf_latin` instead -- this one reads HTML.
        if lang not in COMPENDIUM_FILES:
            continue
        spec = LANG_CONFIG[lang]
        if not spec.appendix.path.exists():
            continue
        reports += report_body_latin(
            lang, spec.appendix.path.read_text(encoding="cp1252", errors="replace")
        )
    print("\n=== printed Latin against ccc-la ===")
    if not reports:
        print("no divergence")
        return
    for line in reports:
        print(f"  {line}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    # `all` IS THE DEFAULT AND THAT IS LOAD-BEARING, not a convenience. It was
    # `both`, meaning en+pt, and `pipeline/rebuild.py` invokes this script with
    # no arguments at all -- so a language added to `LANG_CONFIG` behind a
    # default that did not cover it would parse for whoever typed its name and
    # for nobody else, silently, exactly the way `--exhortations` left 33
    # documents unparsed for months (CLAUDE.md, "The Magisterium is ten
    # languages"). Derived from the table so a new entry needs no edit here.
    ap.add_argument("--lang", choices=[*sorted(LANG_CONFIG), "all"], default="all")
    ap.add_argument(
        "--fetch-companions",
        action="store_true",
        help=(
            "capture the Holy Rosary micro-site pages (the Litany of Loreto and "
            "the four mystery pages) for the requested languages into the "
            "write-once raw cache. An acquisition, not a parse -- see "
            "capture_companions()"
        ),
    )
    args = ap.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()
    langs = sorted(LANG_CONFIG) if args.lang == "all" else [args.lang]
    if args.fetch_companions:
        capture_companions(langs)

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

    # `results` here holds the UNSPLIT parses -- the cross-language oracle is
    # about the address space each source publishes, not about the collection
    # and regional edition we cut the English one into.
    ok, problems = validate(results)

    if "en" in results and "pt" in results:
        # The Latin edition needs BOTH witnesses -- the English for its text,
        # the Portuguese for where five prayers break into stanzas -- so it is
        # built only when both ran, never on `--lang en` alone. Writing it
        # from one witness would silently produce a differently-segmented
        # edition under the same work id.
        latin, witnesses = build_latin_edition(en, pt)
        write_latin_outputs(latin, witnesses)
        latin_ok, latin_problems = validate_latin(latin, en, pt)
        ok = ok and latin_ok
        problems = problems + latin_problems
        print_latin_summary(latin, witnesses)
    ok = ok and regional_ok
    problems = problems + regional_problems
    overall_ok = ok

    for lang in langs:
        print_summary(lang, results[lang], ok, problems if lang == langs[-1] else [])

    print_body_latin_report(langs)
    print_pdf_latin_report(langs)
    return 0 if overall_ok else 1


if __name__ == "__main__":
    sys.exit(main())
