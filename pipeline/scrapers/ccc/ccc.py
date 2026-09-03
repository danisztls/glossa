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
  - Six of the eight mirrors start directly at the Prologue and print no
    abbreviations table, so their `abbreviations.json` is an empty array.
    French and Latin print one each, and they are not the same table --
    see "The abbreviations table" below.
  - Inline italics (titles, Latin terms) are not captured — a deliberate v1
    loss, recoverable later from corpus/raw/ without re-crawling.
"""

from __future__ import annotations

import argparse
import html as ihtml
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
    book_form_pattern,
    build_root,
    captured_at,
    corrections_receipt,
    download_resumable,
    fold,
    load_corrections,
    looks_like_number_typo,
    raw_root,
    require_corpus,
    roman_to_int,
    sample_run_writes_nothing,
    write_stamped_json,
)

USER_AGENT = "Glossa Catholica corpus builder"
CRAWL_DELAY = 2.0  # seconds; robots.txt on vatican.va says Crawl-delay: 2

# The corpus is a separate, private repository (docs/decisions.md
# §The corpus); `common.corpus_dir()` resolves it, honouring $CORPUS_DIR.
RAW_ROOT = raw_root()
BUILD_ROOT = build_root()

EN_BASE = "https://www.vatican.va/archive/ENG0015/"
EN_TOC_HREF = "_INDEX.HTM"
PT_BASE = "https://www.vatican.va/archive/cathechism_po/index_new/"
PT_TOC_HREF = "prima-pagina-cic_po.html"

FIRST_PARAGRAPH = 1
LAST_PARAGRAPH = 2865

#: Part One opens at §26; §§1-25 are the Prologue. A fact about the work, the
#: same in all ten editions -- see `push_heading`, which needs it to tell the
#: Prologue's own account of the four Parts from the Parts themselves.
FIRST_PART_PARAGRAPH = 26


# --------------------------------------------------------------------------
# The editions vatican.va publishes
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class Edition:
    """One language's mirror of the CCC on vatican.va.

    `family` is the only thing that decides how the pages are read, and there
    are three of them rather than ten -- see `PAGE_FAMILIES`.
    """

    base: str
    toc: str
    family: str
    #: Which hrefs on the table of contents are body pages. Matched against a
    #: bare filename: every real content href on all ten mirrors is a sibling
    #: in the TOC's own directory, and the ones carrying a path separator are
    #: front matter linked from elsewhere on the site.
    page_re: str
    #: Pages the TOC links and `page_re` matches, but which are front matter
    #: rather than the numbered text. Only the German mirror has any: it opens
    #: with six pages of the apostolic constitution *Fidei Depositum*, which
    #: the English and French mirrors of the same IntraText shell do not
    #: carry. They are still captured -- `page_re` matches them, so
    #: `--capture` takes them -- and simply not parsed, which is what every
    #: other edition does with its own front matter (see `extra`). Parsing
    #: them would put six paragraph-less divisions above Part One in one
    #: edition of eight, and the eight editions addressing the same space is
    #: the precondition for every cross-language check there is.
    front: tuple[str, ...] = ()
    #: Pages linked from the same TOC that are NOT the numbered text -- the
    #: two apostolic documents that preface every edition, and (Latin only)
    #: the abbreviations table. Captured into `raw/`, parsed by nothing. They
    #: are here rather than merely unmatched by `page_re` so that `--capture`
    #: takes them: they cost one request each and `raw/` is where the answer
    #: to "could we have?" lives (docs/link-surface.md).
    extra: tuple[str, ...] = ()
    #: The page carrying this edition's abbreviations table, if it prints one.
    #: Two of the eight do, and it is front matter in both -- so it is named
    #: here rather than reached through `page_re`, and it is read by
    #: `SIGLA_READERS[family]` rather than by the body parser. See the
    #: "abbreviations table" section for why the two tables are not one.
    sigla: str | None = None


#: EVERY edition of the 1997 Catechism vatican.va publishes, keyed by OUR
#: language tag, taken from the language list printed on
#: https://www.vatican.va/archive/ccc/index.htm rather than guessed at.
#:
#: Four things about this table are worth stating rather than inferring:
#:
#:   - **`catechism_lt` IS LATIN, NOT LITHUANIAN.** The site's own link text
#:     says "Latin", the pages say PARS PRIMA, and the slug is `lt` for
#:     *latine*. The Compendium's Lithuanian PDF two directories away is
#:     `compendium_catech_lit.pdf`, with the other slug. Reading this one as
#:     `lt`/Lithuanian would file the editio typica latina under a language
#:     it is not in, which no later check would catch -- both are plausible
#:     expansions and nothing else in the corpus disambiguates them.
#:   - The stem carries the VATICAN's language slug, which is not ours and
#:     not ISO: `ge`-style abbreviations elsewhere, `sp` for Spanish, `po`
#:     for Portuguese, `lt` for Latin. The mapping is the point of this table.
#:   - Portuguese is NOT in that language list -- its link sits elsewhere on
#:     the page, under a directory the site spells `cathechism_po`, with the
#:     typo. It has been ingested since the beginning anyway.
#:   - Two editions exist only as PDF, and unlike the Compendium's four they
#:     are not one file but a set: Arabic is six part-PDFs, Chinese
#:     forty-three. `--capture` takes them; nothing parses them.
EDITIONS = {
    "ar": Edition(
        base="https://www.vatican.va/archive/catechism_ar/",
        toc="index_ar.htm",
        family="pdf",
        page_re=r".*\.pdf$",
    ),
    "de": Edition(
        base="https://www.vatican.va/archive/DEU0035/",
        toc=EN_TOC_HREF,
        family="intratext",
        page_re=r"^__P\w+\.HTM$",
        front=("__P1.HTM", "__P2.HTM", "__P3.HTM", "__P4.HTM", "__P5.HTM", "__P6.HTM"),
    ),
    "en": Edition(
        base=EN_BASE,
        toc=EN_TOC_HREF,
        family="intratext",
        page_re=r"^__P\w+\.HTM$",
    ),
    "es": Edition(
        base="https://www.vatican.va/archive/catechism_sp/",
        toc="index_sp.html",
        family="cms",
        page_re=r"^(prologue|p\d[a-z0-9]*)_sp\.html$",
        extra=("lettera-apost_sp.html", "aposcons_sp.html"),
    ),
    "fr": Edition(
        base="https://www.vatican.va/archive/FRA0013/",
        toc=EN_TOC_HREF,
        family="intratext",
        page_re=r"^__P\w+\.HTM$",
        # "LISTE DES SIGLES" -- the abbreviations table, and one of the two
        # this crawl turned up (Latin serves the other as `abbrev_lt.htm`).
        # `front` keeps it out of the numbered text; `sigla` is what reads it.
        front=("__P1.HTM",),
        sigla="__P1.HTM",
    ),
    "it": Edition(
        base="https://www.vatican.va/archive/catechism_it/",
        toc="index_it.htm",
        family="cms",
        page_re=r"^(prologue|p\d[a-z0-9]*)_it\.htm$",
        extra=("lettera-apost_it.htm", "aposcons_it.htm"),
    ),
    "la": Edition(
        base="https://www.vatican.va/archive/catechism_lt/",
        toc="index_lt.htm",
        family="cms",
        page_re=r"^(prologue|p\d[a-z0-9]*)_lt\.htm$",
        # `abbrev_lt.htm` is the abbreviations table -- the fuller of the two
        # the corpus has (the French one is documents only; this one adds the
        # bibliographic sigla and all 73 Scripture books). `extra` is what
        # captures it, `sigla` what reads it.
        extra=("lettera-apost_lt.htm", "aposcons_lt.htm", "abbrev_lt.htm"),
        sigla="abbrev_lt.htm",
    ),
    "mg": Edition(
        base="https://www.vatican.va/archive/ccc_madagascar/documents/",
        toc="ccc_index_mg.html",
        family="cms",
        # Malagasy names its pages by the paragraph range they carry, which
        # is also the only edition whose TOC states its own coverage.
        page_re=r"^\d+-\d+_mg\.html$",
        extra=("fidei-depositum_mg.html", "catechism_mg.pdf"),
    ),
    "pt": Edition(
        base=PT_BASE,
        toc=PT_TOC_HREF,
        family="pt",
        page_re=r"^(?!index-)(?!indice_po\.html$).*_po\.html$",
    ),
    "zh": Edition(
        base="https://www.vatican.va/chinese/",
        toc="ccc_zh.htm",
        family="pdf",
        page_re=r".*\.pdf$",
    ),
}

#: How each family's pages are read. Populated below the parsers, which is
#: also where each family's shape is documented.
PAGE_FAMILIES: dict[str, dict] = {}


def raw_dir(lang: str) -> str:
    return f"ccc-{lang}"


#: `href=__P8.HTM` (IntraText, unquoted) and `href="p1s1c1_it.htm"` (the
#: modern CMS mirrors) are both attested, so the quoting cannot be assumed.
_HREF_RE = re.compile(
    r"""href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))""", re.IGNORECASE
)


def discover_pages(fetcher: Fetcher, lang: str) -> list[tuple[str, str]]:
    """The edition's body pages, in the order its own table of contents links
    them -- which is document order on all ten mirrors, and is the only
    ordering any of them declares.

    Bare filenames only. Every real content href is a sibling of the TOC in
    its own directory; the ones carrying a path separator are links away from
    the edition (front matter hosted elsewhere, the site's own navigation,
    and -- on the Portuguese mirror -- an apostolic letter whose filename
    happens to end in `_po.html` too).
    """
    ed = EDITIONS[lang]
    text = fetcher.fetch_str(ed.base + ed.toc, ed.toc)
    keep = re.compile(ed.page_re)
    seen: set[str] = set()
    ordered: list[str] = []
    # The Chinese mirror is the one exception to "sibling of the TOC": its
    # forty-three part-PDFs sit in a `ccc/` subdirectory beneath it. Nothing
    # parses them, so they are allowed a path segment and cached under the
    # basename; every family that IS parsed keeps the stricter rule.
    nested_ok = ed.family == "pdf"
    for m in _HREF_RE.finditer(text):
        href = (m.group(1) or m.group(2) or m.group(3) or "").split("#")[0]
        if not href or href in seen:
            continue
        if "/" in href and not (nested_ok and not href.startswith(("/", "http"))):
            continue
        if not keep.match(href.rsplit("/", 1)[-1] if nested_ok else href):
            continue
        seen.add(href)
        ordered.append(href)
    return [(ed.base + h, h.rsplit("/", 1)[-1]) for h in ordered if h not in ed.front]


def capture_raw(langs: list[str]) -> int:
    """Fetch every page of each named edition into `raw/ccc-{lang}/`, and
    parse nothing.

    This is "re-parse, never re-crawl" being paid forward
    (docs/link-surface.md). It is also the only way the Arabic and Chinese
    editions enter the corpus at all: they are PDF-only, six and forty-three
    part-files respectively, and nothing here reads a PDF.

    ONE fetcher across the whole run, not one per language, and that is
    load-bearing: the 2s floor lives in `Fetcher._last_request`, so a fetcher
    per language would reset it and issue ten requests back to back. Hence
    the cache name carrying the language rather than the cache root.

    `fetch_bytes`, never `fetch_str`: this fetcher's `decode` is a claim
    about the HTML mirrors' charset that a PDF would not survive, and bytes
    are what `raw/` is for.
    """
    fetcher = Fetcher(RAW_ROOT, VATICAN_POLICY, decode=decode_cp1252)
    ok = True
    print(f"capturing {len(langs)} edition(s) into {RAW_ROOT}")
    for lang in langs:
        ed = EDITIONS[lang]
        toc_name = f"{raw_dir(lang)}/{ed.toc}"
        try:
            fetcher.fetch_bytes(ed.base + ed.toc, toc_name)
        except RuntimeError as exc:
            print(f"  {lang:3s} FAILED toc  {exc}")
            ok = False
            continue
        # `discover_pages` needs a fetcher rooted at the edition's own cache
        # directory; it reads the TOC just captured, so this costs no request.
        pages = discover_pages(make_fetcher(RAW_ROOT / raw_dir(lang)), lang)
        wanted = [(url, name) for url, name in pages]
        wanted += [(ed.base + e, e) for e in ed.extra]
        fetched = cached = failed = 0
        for url, name in wanted:
            cache_name = f"{raw_dir(lang)}/{name}"
            was_cached = fetcher.cached(cache_name) is not None
            data, err = fetcher.try_fetch(url, cache_name)
            if data is not None:
                cached += was_cached
                fetched += not was_cached
                continue
            # A PDF that vatican.va's edge drops mid-transfer cannot be
            # fixed by retrying (each retry starts over) but can be resumed;
            # the server advertises `Accept-Ranges: bytes`. Second choice
            # rather than the default because the HTML pages arrive whole.
            if name.lower().endswith(".pdf"):
                size, rerr = download_resumable(
                    url, RAW_ROOT / cache_name, policy=VATICAN_POLICY
                )
                if rerr is None:
                    print(f"  {lang:3s} resumed  {size:>10,d} B  {name}")
                    fetched += 1
                    continue
                err = rerr
            print(f"  {lang:3s} FAILED   {name}: {err}")
            failed += 1
            ok = False
        print(
            f"  {lang:3s} {len(wanted):>4d} page(s): "
            f"{fetched} fetched, {cached} cached, {failed} failed"
        )
    print(f"(network fetches this run: {fetcher.network_fetches})")
    return 0 if ok else 1


#: How a paragraph announces its own number, in all eight editions.
#:
#: ONE PATTERN, AND THAT WAS WORTH CHECKING RATHER THAN ASSUMING. There were
#: three -- English's bare "26 ", Portuguese's "1216. ", Malagasy's
#: "81.\u201cTenin\u2019Andriamanitra" with no space at all after the period --
#: and each was written for the edition in front of whoever wrote it. Read as
#: one pattern, English and Portuguese come out byte-identical to what the
#: three produced, so the differences were never differences.
#:
#: WHAT EACH PIECE IS FOR, since none of it is decoration:
#:
#:   - `\s*` BEFORE the period: the Portuguese mirror marks up a leading
#:     number as both "<b>1663. </b>" and "<b>1662<i>. </i></b>", the period
#:     living inside a nested tag. `strip_tags` used to turn every tag
#:     boundary into a space, so the second shape arrived as "1662 . Text";
#:     without this the match ended after "1662 " and 126 Portuguese
#:     paragraphs opened with a lone period, against zero in English. That
#:     asymmetry is what identified it -- both editions number the same 2,865
#:     paragraphs, so a defect in one alone is a parser defect (CLAUDE.md,
#:     "Work that spans languages"). `strip_tags` no longer inserts that space
#:     (see `_INLINE_TAGS`), so this is now defence in depth, kept because the
#:     source decides where its spaces go, not this parser.
#:   - `(?!\d)` after the period: "50.000 fi\u00e9is" is fifty thousand
#:     faithful, not paragraph 50. The thousands separator is the one place a
#:     digit run followed by a period is not a paragraph opening, and it is
#:     Portuguese and Spanish prose, not an edge case.
#:   - The period OR whitespace, never neither: Malagasy prints the period and
#:     often nothing after it, so requiring trailing whitespace walked past
#:     400-odd of its paragraphs and folded each into the one before. A bare
#:     digit run with neither is a numeral in prose.
NUMBER_RE = re.compile(r"^(\d{1,4})(?:\s*\.(?!\d)\s*|\s+)")

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
    """`text` reduced to the characters a bold-span comparison can rely on.

    WHITESPACE, BECAUSE THE TWO SIDES CANNOT AGREE ON IT -- see `is_full_bold`.
    PUNCTUATION, because these are Word exports and Word closes a bold run
    one character early: the Spanish mirror prints Article 8's heading as
    `<b>ARTÍCULO 8<br />“CREO EN EL ESPÍRITU SANTO</b>”`, with the closing
    quotation mark outside the bold and nothing else. One character of
    punctuation is not the source saying "this is not a heading", and read
    strictly it cost that edition its whole Article 8 and one of its
    paragraph markers.

    A heading is still distinguished from a bolded paragraph number by this,
    which is the distinction that matters: "<b>1216.</b> Este banho é
    chamado" has letters outside the bold and always will."""
    return "".join(ch for ch in text if ch.isalnum())


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


#: A source reference the mirror sets after a heading, outside its bold —
#: "(2 Tm 1, 12)", "(LG 43)". Anchored to the end because that is where a
#: heading's reference goes; a parenthesis anywhere else is prose.
_TRAILING_REFERENCE_RE = re.compile(r"\(\s*[^()]{1,60}\)\s*$")


def is_bold_heading_with_reference(inner_html: str) -> bool:
    """True when the block is a bold heading followed by an unbolded source
    reference in parentheses.

    THE FRENCH EDITION SOURCES ITS HEADINGS INLINE, and it is the only one
    that does. Where English prints `II. "I Know Whom I Have Believed"` and
    footnotes the reference, French prints `<b>II. " Je sais en qui j'ai mis
    ma foi " </b>(2 Tm 1, 12)` — the citation outside the bold, because it is
    not part of the title. `is_full_bold` correctly says no, and the heading
    was then dropped entirely.

    Distinguished from a bolded paragraph number ("<b>1216.</b> Este banho é
    chamado", which must never read as a heading) by two things together: the
    bold has to come first, and everything after it has to be a parenthesis
    and nothing else. A paragraph's text is not a parenthesis."""
    full_text = strip_tags(inner_html).strip()
    bold_spans = _BOLD_SPAN_RE.findall(inner_html)
    if not full_text or not bold_spans:
        return False
    bold_text = strip_tags(" ".join(bold_spans)).strip()
    if not bold_text or not full_text.startswith(bold_text[: len(bold_text)]):
        return False
    rest = full_text[len(bold_text) :].strip()
    return bool(rest) and _TRAILING_REFERENCE_RE.fullmatch(rest) is not None


def test_a_heading_keeps_the_reference_the_source_sets_outside_its_bold() -> None:
    # __PX.HTM, verbatim. The reference is the source's, not the title's.
    inner = (
        "<b style='mso-bidi-font-weight:normal'>II. &quot;&nbsp;Je sais en qui "
        "j&rsquo;ai mis ma foi&nbsp;&quot; </b>(2 Tm 1, 12)"
    )
    assert not is_full_bold(inner)
    assert is_bold_heading_with_reference(inner)
    # The case it must never claim: a bolded paragraph number.
    assert not is_bold_heading_with_reference(
        "<b>1216.</b> Este banho &eacute; chamado"
    )


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
# #Corrections and overrides)
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
#:
#: `paragraph_html` is for body prose the mirror gets wrong, and exists
#: because §2436 drops its opening sentence -- "It is unjust not to pay the
#: social security contributions required by legitimate authority" is simply
#: not in raw/ccc-en/ under any spelling. It behaves like `citation_text`
#: (its `from` is distinctive prose) and files a `page` anyway, because one
#: is known and a locator that can be checked should be.
#: `abbreviation_html` is the same mechanism aimed at the front matter: the
#: two editions that print an abbreviations table print misprints in it, and
#: the page it lives on is not one the body loop ever visits, so its
#: corrections are applied where `run_scrape` reads it.
_PRE_PARSE_CORRECTION_FIELDS = frozenset(
    {"citation_text", "heading_html", "paragraph_html", "abbreviation_html"}
)


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
# The book forms are the SITE'S, read from `common/book_forms.json`, which is
# generated from `site/src/lib/refs-grammar.ts` (see `common/book_forms.py`).
# That table already carries every numbered-book spelling the mirror prints
# ("1 Jo", "I Jo", "1Jo", "l Cor"), so no number prefix is added here. Matched
# CASE-SENSITIVELY, as the site matches them: the short Portuguese forms
# ("Na", "At", "Os", "Am", "Is") are ordinary words in lowercase, and the
# earlier case-insensitive regex was safe only because its own list was
# shorter.
_PT_INLINE_BOOK = book_form_pattern("pt")
_PT_INLINE_CF = r"(?:(?:[Cc]f|[Cc]fr)\.?\s*)?"
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
        #: The mini-header a display run is currently under, or None. Cleared
        #: by the next numbered paragraph and by any real heading -- both of
        #: which end the run the header opened. See `process_page`.
        self.open_display_header: str | None = None
        #: (header, block text) for every block dropped as matter under a
        #: mini-header rather than kept as the previous paragraph's
        #: continuation.
        self.display_matter: list[tuple[str, str]] = []
        self.false_starts: list[str] = []
        self.anomalies: list[str] = []
        self.orphan_content: list[str] = []
        self.fetch_failures: list[str] = []
        #: This edition's abbreviations table, in source order. Empty for the
        #: six mirrors that print none -- see the "abbreviations table"
        #: section.
        self.abbreviations: list[dict] = []
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
        # THE PROLOGUE NAMES THE FOUR PARTS, AND ONE EDITION SETS THAT LIST IN
        # BOLD. §13 announces the Catechism's plan and §§14-17 describe each
        # Part in turn, each introduced by a display line carrying that Part's
        # own title. English prints those lines plain and Portuguese bolds
        # only the subtitle half, so both fall through to `is_mini_header` and
        # are dropped; Malagasy centres and fully bolds them, which is exactly
        # what a real heading looks like. Reading them as headings opened four
        # more Parts in a four-part work, took §§14-25 out of the Prologue,
        # and left `part` nodes numbered 1,2,3,4,1,2,3,4.
        #
        # The discriminator is not typography, which is the edition's to
        # choose, but position: a Part cannot begin before §26, so a Part
        # heading arriving while the numbering is still inside the Prologue is
        # the Prologue talking ABOUT the work. Restated running banners are
        # unaffected -- those arrive at §25 or later, and `same_heading` below
        # is what merges them.
        if (
            kind == "part"
            and self.last_n is not None
            and self.last_n < FIRST_PART_PARAGRAPH - 1
        ):
            self.dropped.append(title)
            return
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
        # WHITESPACE ON BOTH SIDES OF THE NUMBER. The trailing `\s+` used to
        # be `\b\s*`, which allows none at all -- so a citation that names a
        # psalm and a verse satisfied it. The German edition prints
        # Augustine inline as "(Augustinus, Psal. 103,4, 1)" inside the quote
        # closing §102, and the "103" there, sitting after a period and
        # before a comma, was read as the opening of §103: the real §103
        # then arrived as an out-of-sequence number and was folded away,
        # leaving the paragraph stored as the four characters ",4, 1)." The
        # French edition printed the same citation the same way and lost the
        # same paragraph; English and the rest footnote it instead, so
        # nothing was ever wrong there. A paragraph number is followed by the
        # paragraph, which begins with a space.
        m = re.search(rf"(?<={_EMBEDDED_START_PUNCT_RE})\s+({expected})\s+", remaining)
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
    cfg: dict,
    state: ScrapeState,
) -> None:
    match_label, number_re, lang = cfg["match_label"], cfg["number_re"], cfg["lang"]
    state.current_footnote_table = footnote_table
    i, n = 0, len(blocks)
    while i < n:
        b = blocks[i]
        if b.is_heading:
            # A real heading ends whatever a mini-header opened, the same way
            # the next numbered paragraph does.
            state.open_display_header = None
            matched = match_label(b.text)
            if matched is not None:
                kind, num = matched
                # AT MOST ONE continuation block, AND ONLY WHEN THE LABEL IS
                # ALONE. The label line and the title it introduces are printed
                # as two blocks ("CHAPTER TWO", then "GOD COMES TO MEET MAN") on
                # all but a handful of pages, and this used to absorb every
                # unlabelled heading block that followed. The EN mirror never
                # prints more than one, so the bug was invisible there; the PT
                # mirror prints a further sub-heading in the same style on four
                # pages, and each came out glued onto the title AND missing from
                # the tree -- "CAPITULO PRIMEIRO A REVELACAO DA ORACAO O apelo
                # universal a oracao" against EN's single-block "CHAPTER ONE THE
                # REVELATION OF PRAYER - THE UNIVERSAL CALL TO PRAYER".
                #
                # The `is_bare_structural_label` guard is the French edition's
                # doing. Where a heading already carries its own title in the
                # same block -- "II. Les étapes de la Révélation" -- there is
                # nothing to continue, and absorbing the next bold block ate the
                # genuine sub-heading after it ("Dès l'origine, Dieu se fait
                # connaître"), which then appeared neither as a node nor
                # anywhere a reader could see it. A label that consumes its
                # whole block is a label looking for its title; a label with a
                # title attached is finished.
                title = b.text
                j = i + 1
                if (
                    j < n
                    and blocks[j].is_heading
                    and is_bare_structural_label(b.text, lang)
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
            state.open_display_header = None
        elif state.open_paragraph is None:
            if b.kind == "prose" and is_mini_header(first_text):
                state.dropped.append(first_text)
                state.open_display_header = first_text
            else:
                where = state.stack[-1].title if state.stack else "?"
                state.orphan_content.append(f"[{where}] {first_text[:90]}")
        elif b.kind == "prose" and is_mini_header(first_text):
            state.dropped.append(first_text)
            state.open_display_header = first_text
        elif (
            b.kind == "prose"
            and state.open_display_header is not None
            and state.stack
            and state.stack[-1].kind == "in_brief"
        ):
            # DISPLAY MATTER UNDER A MINI-HEADER, INSIDE AN IN-BRIEF. The
            # parser dropped such a header and then kept the matter under it
            # as the previous paragraph's continuation -- two incoherent
            # decisions about one run. It cost §2051: the EN mirror prints
            # the three-column Ten Commandments table between §2051 and
            # §2052, its columns headed "Exodus 20 2-17", "Deuteronomy
            # 5:6-21" and "A Traditional Catechetical Formula" under "The
            # Ten Commandments" -- all four already recognized by
            # `is_mini_header` and discarded -- and the 43 blocks of
            # Decalogue beneath them, 2,562 characters, were stored as
            # though an in-brief on the infallibility of the Magisterium had
            # said them, taking §2051 from its own 208 characters to 2,813.
            # The PT mirror prints no such table, and the 14.9x
            # cross-language length skew is what found this (`audit.py
            # balance`).
            #
            # BOTH CONDITIONS ARE LOAD-BEARING, and each was established by
            # running the wider rule over both editions:
            #
            #   - "matter under a mini-header" alone truncates §1471 in BOTH
            #     editions by 554 characters. Its mini-header is the run-in
            #     question "What is an indulgence?" and the definition
            #     answering it is the paragraph. Four more EN paragraphs
            #     (§§327, 812, 963, 2071) lost text the same way.
            #   - "unnumbered prose after an in-brief paragraph" alone
            #     truncates §§2077-2081, whose sentences the source simply
            #     breaks across print lines.
            #
            # Together they change exactly one paragraph in either edition,
            # which is stated here rather than hidden: the rule is narrow
            # because the thing it describes is rare, not because it was cut
            # to fit. An in-brief is a summary box closing a division (see
            # `push_heading`), so a HEADED run inside one is a display block
            # printed after the summary, never a question the summary asks.
            #
            # Unnumbered display matter has nowhere to go in `paragraphs.json`
            # and is dropped with its header, the same treatment the
            # Compendium already gives this same table in its appendix. It is
            # counted in the run summary and named in the manifest, and
            # `raw/` keeps every word.
            state.display_matter.append((state.open_display_header, first_text))
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


_EN_STRAY_BOLD_RE = re.compile(r"<b([^>]*)>\s*<p([^>]*)>", re.IGNORECASE)

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
    # A heading is sometimes preceded by a stray <b> that opens *before* the
    # <p> tag and closes partway through its content (e.g. "<hr...><b><p
    # class=MsoNormal>CHAPTER ONE</b><b...></b></p>"). Reorder so the <b> ends
    # up properly nested inside the <p>, matching every other heading on the
    # page -- otherwise the heading is invisible to the bold-heading detector.
    #
    # ANYWHERE ON THE PAGE, not just at its head. This was anchored to the
    # start of the body for as long as English was the only edition read
    # through this shell, which is where English does it. German does it to
    # article headings in mid-page ("<b ...><p ...><A NAME=SL_4.1.3.1
    # IXT=SL>ARTIKEL 7</b></p>"), and with the anchor in place every one of
    # its sixty-odd articles was missing from the tree -- caught by
    # `check_declared_structure`, which reads the breadcrumb this mirror
    # prints and had never had a second edition to check.
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


def parse_page_intratext(
    html_text: str, cfg: dict
) -> tuple[list[Block], dict[str, str]]:
    """One IntraText page is one subsection, and its headings are an unbroken
    run at the top: across all 375 EN pages, no heading of any kind — labelled
    or not — follows body text. (The PT mirror is a page per *chapter*, so
    headings genuinely do appear mid-page there; this rule is a property of
    this family's granularity and must not be lifted into `process_page`.)

    So once body text has begun, a fully-bold <p> is the source setting a
    passage apart, not a heading. Exactly one block in the EN CCC is of that
    shape — the text of the Our Father in §2759, which vatican.va bolds where
    the PT mirror indents it with <blockquote>. It was coming out as a
    heading of its own with a 285-character title, which both dropped the
    prayer from the body of §2759 and put it in the structure tree. It is
    marked as a quote here, matching the PT edition and the schema's reading
    of that kind ("indented quotation ... liturgy, prayer").

    The `match_label` guard is not redundant: no labelled heading follows
    body text today, but "IN BRIEF" and the article markers are the blocks
    that would if a page's boundaries ever moved, and they must keep winning.

    THREE EDITIONS SHARE THIS SHELL AND ONLY ONE HAS FOOTNOTES. English keys
    its apparatus to anchors and prints it under a rule at the foot of each
    page; French and German print no apparatus at all, having folded every
    reference into the running text — French in parentheses ("(cf. CT 20-22 ;
    25)"), German in square brackets ("[Vgl. DV 5.]"). That is what those
    editions are, not something lost in transit: `cfg["footnotes"]` says so
    per edition and `_en_footnote_table` is simply never reached for the two
    that have none. See `LANG_CONFIG` for what it means for `citations`."""
    match_label = cfg["match_label"]
    body, foot_html = _en_body_and_footnotes(html_text)
    footnote_table = _en_footnote_table(foot_html) if cfg["footnotes"] else {}
    blocks: list[Block] = []
    seen_body = False
    for attrs_m, inner in ((m.group(1), m.group(2)) for m in _EN_P_RE.finditer(body)):
        is_quote = "margin-left" in attrs_m.lower()
        is_heading = is_full_bold(inner) or is_bold_heading_with_reference(inner)
        marked = _EN_SUP_RE.sub(lambda m: f"{MARK_OPEN}{m.group(2)}{MARK_CLOSE}", inner)
        text = strip_tags(marked)
        if not text:
            continue
        if not is_heading and is_plain_roman_heading(text, cfg["lang"]):
            # A ROMAN-NUMERAL SUBDIVISION THE MIRROR DID NOT BOLD. See that
            # predicate for the measurement; the short version is that the
            # exclusion below was written for Portuguese, which loses nothing
            # by it, and cost English 60 subdivisions and German 57.
            #
            # The seventh petition of the Our Father is the one that found it.
            # vatican.va sets `VII "BUT DELIVER US FROM EVIL"` as a plain <p>
            # inside __PAC.HTM -- the page its own index and breadcrumb file
            # under `VI. "And Lead Us not into Temptation"` -- so English ran
            # petition VI from 2846 to 2854 and had no seventh at all, while
            # pt, la and fr all carry VII as a proper heading.
            is_heading = True
        if not is_heading and is_bare_structural_label(text, cfg["lang"]):
            # A LABELLED HEADING THE MIRROR DID NOT BOLD. Whole pages of the
            # English edition set every heading in plain type -- __P16.HTM
            # prints "Article 1", "II. GOD REVEALS HIS NAME" and "IN BRIEF"
            # with no <b> anywhere -- and reading only bold blocks lost all
            # of them: the in-brief fell under the word cap for a run-in
            # sub-header and was dropped. It cost 22 of the work's 81
            # in-brief divisions in English alone, against Portuguese,
            # German and Malagasy, which all print 81 and agree on which.
            # A one-sided gap of that shape is a parser defect by the
            # project's own rule (CLAUDE.md, "Work that spans languages"),
            # and the same guard Portuguese has needed since the beginning
            # closes it. Roman-numeral subheadings stay excluded there and
            # so stay lost here -- "I." is too easily ordinary prose without
            # the bold signal, which is a documented ceiling, not this bug.
            is_heading = True
        if is_heading and seen_body and match_label(text) is None:
            is_heading, is_quote = False, True
        seen_body = seen_body or not is_heading
        blocks.append(Block(is_heading, "quote" if is_quote else "prose", text))
    return merge_quote_blocks(blocks), footnote_table


def parse_page_en(html_text: str) -> tuple[list[Block], dict[str, str]]:
    """The English edition's reading of the shell above. Kept as a name of its
    own because the tests below pin English pages specifically."""
    return parse_page_intratext(
        html_text, {"match_label": MATCH_LABEL["en"], "footnotes": True, "lang": "en"}
    )


def test_en_bold_block_after_body_is_a_quote_not_a_heading() -> None:
    # __P9V.HTM, abridged: the section heading, §2759, the Our Father, §2760.
    page = (
        "<hr size=1 noshade>"
        "<p class=MsoNormal><b>SECTION TWO</b></p>"
        "<p class=MsoNormal><b>THE LORD'S PRAYER</b></p>"
        "<p class=MsoNormal>2759 ... has retained St. Matthew's text:</p>"
        "<p class=MsoNormal><b>Our Father who art in heaven, hallowed be thy "
        "name.</b></p>"
        "<p class=MsoNormal>2760 Very early on, liturgical usage ...</p>"
    )
    blocks, _ = parse_page_en(page)
    assert [(b.is_heading, b.kind) for b in blocks] == [
        (True, "prose"),
        (True, "prose"),
        (False, "prose"),
        (False, "quote"),
        (False, "prose"),
    ]
    assert blocks[3].text.startswith("Our Father who art in heaven")


# --------------------------------------------------------------------------
# PT: labels, page parsing
# --------------------------------------------------------------------------


def is_bare_structural_label(text: str, lang: str = "pt") -> bool:
    """True when `text` is *just* a structural label (e.g. "CAPÍTULO
    PRIMEIRO") with no trailing subtitle or other content glued on in the
    same block. Used to decide whether a non-bold block can still count as
    a heading: some chapter markers are printed plain, with only their
    separate subtitle block bold (see parse_page_pt); but the Prologue also
    *describes* the four Parts by name in ordinary running prose (e.g.
    "PRIMEIRA PARTE: A Profissão da Fé ..."), which must not be mistaken for
    the real heading. A bare label consumes (almost) the whole block;
    prose mentioning a part name goes on for a full sentence afterwards.

    Written for Portuguese and needed again, unchanged, by Malagasy, which
    prints its summary heading ("FAMINTINANA") in plain text where every
    other edition bolds it -- so `is_full_bold` alone loses every one of that
    edition's in-brief divisions."""
    folded = fold(text)
    for kind, pat in _COMPILED_LABELS[lang]:
        if kind == "roman":
            continue
        m = pat.match(folded)
        if m and len(folded) - m.end() <= 3:
            return True
    return False


#: The longest roman-numeral subdivision heading any IntraText edition prints,
#: measured 2026-09-03 over every unbolded candidate in en/fr/de: 64 characters
#: ("I ,,Im Namen des Vaters und des Sohnes und des Heiligen Geistes\""). The
#: cap is what separates a heading from prose, and 90 leaves room without
#: reaching the length of any body paragraph on these pages.
_PLAIN_ROMAN_MAX = 90


#: How a subdivision title may open when its first character is not a capital:
#: a quotation mark, or the ellipsis with which an edition continues the
#: previous heading's sentence ("II ... geboren von der Jungfrau Maria").
#:
#: THE GUARD IS FRENCH'S DOING and it is the whole reason it exists. That
#: edition's `roman` pattern is period-optional, so without it the two cells of
#: the Creed comparison table on __P14.HTM -- "II ressuscita le troisième
#: jour," and "II a parlé par les prophètes." -- promote to subdivisions of
#: Article 2, which is text read as structure. A heading's first word is
#: capitalised or the source opens it with a mark; a lower-case first word is a
#: clause continuing a sentence. Measured 2026-09-03 over every unbolded
#: candidate: it admits 60 in English, 64 in German and 11 in French, and
#: rejects exactly those two.
_TITLE_OPENER_RE = re.compile('^["\u201c\u201d\u201e\u00ab\u00bb\u2018\u2019,.\u2026]')


def is_plain_roman_heading(text: str, lang: str) -> bool:
    """True for a roman-numeral subdivision heading the mirror did not bold.

    `is_bare_structural_label` deliberately will not say this, and said so:
    "roman-numeral subheadings are excluded since 'I.' et al. are too easily
    mistaken for ordinary prose without the bold signal". That was written for
    Portuguese, where it costs nothing, and inherited by the IntraText shell,
    where it cost 60 subdivisions in English and 57 in German.

    THE COUNT IS WHAT MAKES IT A DEFECT RATHER THAN A CEILING. Counting nodes
    whose title opens on a roman numeral, 2026-09-03: es 272, fr 273, la 272,
    pt 272, mg 276, it 291 -- against en 214 and de 213. A one-sided gap of
    that shape is a parser defect by this project's own rule (CLAUDE.md, "Work
    that spans languages"), and it is the same rule that closed the in-brief
    gap in `parse_page_en` a few lines below. After the fix: en 274, de 270.

    WHAT REPLACES THE BOLD SIGNAL IS LENGTH, and the fear the ceiling was
    guarding against turns out not to happen in these editions. Measured over
    every unbolded block in en/fr/de matching that edition's own `roman`
    pattern and passing the two guards below: 60 in English, 64 in German and 11
    in French, and every one of them is a heading. The reason the length cap can
    carry this at all is structural rather than lucky:
    IntraText numbers every body paragraph, so a body block opens on a DIGIT
    ("2807 The term..."), and a short block opening on a roman numeral is not
    prose here. English's own pattern still requires the period and German's
    still narrows the numeral class to I/V/X, so nothing about which strings
    are numerals is loosened -- see `_LABEL_PATTERNS`.
    """
    folded = fold(text)
    for kind, pat in _COMPILED_LABELS[lang]:
        if kind != "roman":
            continue
        m = pat.match(folded)
        if m is None:
            return False
        rest = text[m.end() :].strip()
        if not 2 <= len(rest) <= _PLAIN_ROMAN_MAX:
            return False
        return rest[0].isupper() or bool(_TITLE_OPENER_RE.match(rest))
    return False


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
        m = NUMBER_RE.match(text)
        assert m is not None, html
        assert not text[m.end() :].startswith("."), html


def test_pt_paragraph_number_does_not_run_past_the_number_it_matched() -> None:
    # The `\s*\.?` must not let the match wander into body text that merely
    # starts with a period-shaped token.
    assert NUMBER_RE.match("33 . O homem").end() == len("33 . ")
    assert NUMBER_RE.match("1216. Este banho").end() == len("1216. ")
    assert NUMBER_RE.match("2117 Comparar") is not None
    assert NUMBER_RE.match("50.000 fi&eacute;is") is None


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


# --------------------------------------------------------------------------
# CMS: the modern vatican.va mirrors (es, it, la, mg)
# --------------------------------------------------------------------------

#: Four editions are served by vatican.va's own CMS rather than by IntraText,
#: and they are one format: the text sits in a single table cell as a flat run
#: of `<p align="left">` blocks with `<blockquote>` for set-off quotation, a
#: paragraph's number bold at the head of its first block, and headings marked
#: either fully bold or by an `<a name="...">` naming the heading itself.
#:
#: THEY DISAGREE ABOUT THE APPARATUS, AND THAT IS AN EDITORIAL FACT, NOT A
#: PARSING ONE. Italian and Latin print `<sup>N</sup>` in the text and the
#: notes as a `(N) ...` run at the foot of the page. Malagasy uses Word's
#: footnote export -- `<a name="_ftnrefN">[N]</a>` against `<div id="ftnN">`
#: -- which is the least ambiguous of any edition in the corpus. Spanish
#: prints no apparatus at all: it folds every reference into the running text
#: in parentheses, hyperlinked where the referent is on vatican.va. See
#: `LANG_CONFIG` for what that means downstream.
_CMS_BLOCK_RE = re.compile(
    r"<blockquote[^>]*>(.*?)</blockquote>|<p([^>]*)>(.*?)</p>",
    re.DOTALL | re.IGNORECASE,
)
_CMS_INNER_P_RE = re.compile(r"<p[^>]*>(.*?)</p>", re.DOTALL | re.IGNORECASE)

#: `<sup>1</sup>`, and nothing else: these mirrors use <sup> for footnote
#: markers only, never for ordinals or exponents (checked across every page).
_CMS_SUP_RE = re.compile(r"<sup[^>]*>\s*\(?(\d{1,3})\)?\s*</sup>", re.IGNORECASE)

#: A superscript that is NOT a footnote number, content and all. There is
#: exactly one in each of the two mirrors that use this style -- 3,706 numeric
#: against one `[n]` in Latin, 3,695 against one empty in Italian -- and the
#: Latin one is the mirror's own editorial marker on §2267, flagging the text
#: revised in 2018. Its note sits below the page's footnote rule, is written
#: in Italian, and reads "Indica che il testo corrisponde alla nuova
#: versione": furniture about the edition, not apparatus belonging to the
#: Catechism. Left in place it sat between the paragraph's number and its
#: text, so §2267 was not recognised as a paragraph at all and its whole text
#: was folded into §2266.
_CMS_STRAY_SUP_RE = re.compile(r"<sup[^>]*>.*?</sup>", re.DOTALL | re.IGNORECASE)

#: Word's footnote export, as Malagasy serves it.
_CMS_FTNREF_RE = re.compile(
    r"<a\s[^>]*name=[\"\']?_ftnref(\d{1,4})[\"\']?[^>]*>.*?</a>",
    re.DOTALL | re.IGNORECASE,
)
_CMS_FTN_RE = re.compile(
    r"<div[^>]*\bid=[\"\']?ftn(\d{1,4})[\"\']?[^>]*>(.*?)</div>",
    re.DOTALL | re.IGNORECASE,
)

#: Everything between two blocks is whitespace, Word's conditional comments
#: and stray markup on all but the Malagasy mirror, so a recovered gap has
#: to carry at least one letter or digit before it is worth a block.
_CMS_GAP_KEEP_RE = re.compile(r"[^\W_]")

#: The number a note reprints at its own head, in either edition's style.
_CMS_LEADING_MARKER_RE = re.compile(r"^\s*[\[(]\d{1,4}[\])]\s*")

#: A note in the `(N) text` run at the foot of an Italian or Latin page.
_CMS_NOTE_RE = re.compile(r"^\((\d{1,3})\)\s*")

#: The heading sizes. Body prose is unsized or size 3; only a division title
#: is set at 4 or 5, and Latin's chapter titles are the one heading shape
#: that is NOT bold, so this is the only thing that catches them.
_CMS_HEADING_FONT_RE = re.compile(r"<font[^>]*\bsize=[\"\']?[45]\b", re.IGNORECASE)

_CMS_LINK_SPAN_RE = re.compile(
    r"<a\s[^>]*\bhref=[^>]*>(.*?)</a>", re.DOTALL | re.IGNORECASE
)

_CMS_ANCHOR_SPAN_RE = re.compile(
    r"<a\s[^>]*\bname=(?![\"\']?_ftn)[^>]*>(.*?)</a>", re.DOTALL | re.IGNORECASE
)


def is_full_anchor(inner_html: str) -> bool:
    """True when the block's entire visible text sits inside a named anchor.

    The CMS mirrors put `<a name="CAPUT PRIMUM HOMO EST DEI « CAPAX »">`
    around the heading it names -- the anchor's own name is the heading text
    -- and Latin does that WITHOUT bolding the result, which is why
    `is_full_bold` alone loses every Latin chapter title. Footnote anchors
    (`_ftnref...`) are excluded by the pattern: those sit inside running
    prose and would otherwise make a one-word paragraph look like a heading.

    Same whitespace-insensitive comparison as `is_full_bold`, for the same
    reason."""
    full_text = strip_tags(inner_html)
    if not full_text:
        return False
    inside = strip_tags(" ".join(_CMS_ANCHOR_SPAN_RE.findall(inner_html)))
    return bool(inside) and _visible(inside) == _visible(full_text)


def is_full_link(inner_html: str) -> bool:
    """True when the block is nothing but a hyperlink -- navigation, not text.

    One block on every Italian page is of this shape: the running banner
    "CATECHISMO DELLA CHIESA CATTOLICA", set in bold size-5 type and linking
    back to that edition's own table of contents. It satisfies every test for
    a heading, and read as one it opened a stray structure node above Part
    One on each of the 108 pages.

    A LINK INSIDE PROSE IS NOT THIS. Spanish hyperlinks the referent of a
    citation where vatican.va hosts it ("(<a ...>GS</a> 19,1)"), which is
    part of the sentence and stays; the whole-block test is what separates
    them."""
    full_text = strip_tags(inner_html)
    if not full_text:
        return False
    inside = strip_tags(" ".join(_CMS_LINK_SPAN_RE.findall(inner_html)))
    return bool(inside) and _visible(inside) == _visible(full_text)


def _note_n(block: Block) -> int:
    return int(_CMS_NOTE_RE.match(block.text).group(1))


def _cms_note_run(blocks: list[Block]) -> tuple[list[Block], dict[str, str]]:
    """Split an Italian/Latin page's `(N) ...` note run off its body.

    FOUND BY ITS SHAPE, NOT BY A MARKER IN THE HTML, because there is none:
    the notes are ordinary `<p align="left">` blocks in the same cell as the
    text, distinguished only by opening with their own number in parentheses.
    So this looks for runs of consecutive blocks whose numbers ascend by one,
    and accepts the longest that answers every `⟦N⟧` marker on the page --
    which is the property that actually matters, and what stops a body
    paragraph that happens to open "(3) " from being mistaken for one.

    THE RUN IS NOT ALWAYS LAST, which is what this used to assume. On
    `p3s2c2a5_lt.htm` the Latin mirror prints the notes and then keeps going:
    an editorial marker saying §2267 was revised, the 2018 rescript that
    revised it, the words "Versione precedente:", and the superseded pre-2018
    text of §2267 itself. Walking back from the end of the page hit that
    instead of the notes, found none, and left all 49 of them as ordinary
    blocks -- so the page's whole apparatus was appended to §2330, a
    Beatitude one line long. It measured 45x its own length in every pairing,
    the widest reading `audit.py balance` has produced.

    EVERYTHING AFTER THE RUN GOES WITH IT. The notes close the page's body;
    what follows them is the mirror talking about the edition rather than the
    Catechism. Only that one page has anything there at all, and what it has
    is a text the Church has replaced -- storing it as §2330's continuation,
    or as a second §2267, would both be worse than dropping it. `raw/` keeps
    it, as it keeps everything.

    Returns the body blocks and the note table. An empty table is normal:
    plenty of pages carry no notes."""
    runs: list[list[int]] = []
    for i, b in enumerate(blocks):
        if b.is_heading or not _CMS_NOTE_RE.match(b.text):
            continue
        n = _note_n(b)
        # A note the source split across two blocks repeats its own number,
        # so the same number twice continues a run rather than ending it.
        if (
            runs
            and runs[-1][-1] == i - 1
            and n in (n0 := _note_n(blocks[runs[-1][-1]]), n0 + 1)
        ):
            runs[-1].append(i)
            continue
        runs.append([i])
    markers = {tok for b in blocks for tok in _MARKER_TOKEN_RE.findall(b.text)}
    if not markers:
        return blocks, {}
    for run in sorted(runs, key=len, reverse=True):
        table: dict[str, str] = {}
        for i in run:
            m = _CMS_NOTE_RE.match(blocks[i].text)
            key, text = m.group(1), blocks[i].text[m.end() :]
            table[key] = f"{table[key]} {text}".strip() if key in table else text
        if markers <= set(table):
            return blocks[: run[0]], table
    return blocks, {}


#: The page's own furniture: the head (whose <title> and inline script are not
#: in any <p> and so arrive as recovered gap text), and any script or style
#: that follows it.
_CMS_CHROME_RE = re.compile(
    r"\A.*?</head\s*>|<script\b.*?</script\s*>|<style\b.*?</style\s*>",
    re.DOTALL | re.IGNORECASE,
)


def _cms_body(html_text: str) -> str:
    """The page with its chrome removed, which is all the bounding these
    mirrors admit of.

    NOT A CONTAINER, AND THAT WAS THE FIRST ATTEMPT. The obvious reading is
    that the text lives in one table cell -- Italian and Latin serve it from
    `<td align="left" height="50" valign="top" width="99%">` and Spanish from
    `<td width="609" valign="top">` -- and taking the largest leaf cell got
    every page of three editions right. It gets `p1s1c3a2_sp.html` completely
    wrong: that page's text sits in no cell at all, only the two-column Creed
    at its foot does, and the rule returned a 312-character table cell and
    dropped §§166-184 entirely. A container the source uses on most pages is
    not a container the source guarantees.

    So nothing is selected and only what is certainly not text is removed.
    What that leaves out is handled where it is recognisable as itself: the
    running banner Italian prints above every page is dropped by
    `is_full_link` (it is a link to that edition's own contents), and
    navigation images strip to nothing and are dropped for being empty."""
    return _CMS_CHROME_RE.sub("", html_text)


def parse_page_cms(html_text: str, cfg: dict) -> tuple[list[Block], dict[str, str]]:
    """One CMS page as a flat block stream, plus its footnote table.

    Unlike the IntraText family, these pages are one *article* (or, in
    Malagasy, one paragraph range) rather than one subsection, so headings do
    appear after body text and the "a bold block after prose is a quote" rule
    of `parse_page_intratext` must not be applied here. What distinguishes a
    heading is the source's own marking -- bold, a named anchor, or a
    size-4/5 font -- in every case set on the whole block."""
    style = cfg["notes"]
    html_text = _cms_body(html_text)
    footnote_table: dict[str, str] = {}
    if style == "ftn":
        # READ THE NOTES, THEN CUT THEM OUT. They sit in `<div id="ftnN">`
        # rather than in a `<p>`, so the block walk never matches them -- and
        # the gap recovery below, which exists because the Malagasy mirror
        # emits whole paragraphs outside any `<p>`, swept up every one of
        # them and appended the page's entire apparatus to its last
        # paragraph. §975 was stored at 13,680 characters against the
        # Portuguese edition's 197, and the same happened at the foot of all
        # 27 pages -- which is exactly the shape `audit.py balance` is for:
        # the five worst ratios in the whole corpus were this, at 31x to 69x.
        # The note's own text, with the back-link that opens it removed. That
        # link is `<a name="_ftnN" href="#_ftnrefN">[N]</a>` -- the printed
        # "[N]" is the marker, not part of the note -- and it is a DIFFERENT
        # anchor name from the one in the body, so stripping it by name would
        # need a second pattern. Dropping a leading bracketed number after
        # flattening covers it, and also covers the pages that print the
        # number without wrapping it in a link at all.
        footnote_table = {
            m.group(1): _CMS_LEADING_MARKER_RE.sub("", strip_tags(m.group(2)), count=1)
            for m in _CMS_FTN_RE.finditer(html_text)
        }
        html_text = _CMS_FTN_RE.sub("", html_text)

    if style == "sup":
        # ONCE, OVER THE WHOLE PAGE, AND IN THIS ORDER. The numeric
        # superscripts become markers first; whatever `<sup>` is left is
        # furniture and goes, content and all. Doing it here rather than
        # per-block is what puts it ahead of the heading tests, which matters
        # for the one stray superscript in the corpus: the Latin mirror sets
        # its editorial "[n]" on §2267 in a size-4 font, and
        # `_CMS_HEADING_FONT_RE` reads a size-4 font as a heading -- so
        # cleaning only the text left that paragraph correctly numbered and
        # wrongly filed as a division title. Doing it in the other order eats
        # all 3,706 real markers with it.
        html_text = _CMS_SUP_RE.sub(f"{MARK_OPEN}\\1{MARK_CLOSE}", html_text)
        html_text = _CMS_STRAY_SUP_RE.sub("", html_text)

    def mark(inner: str) -> str:
        if style == "sup":
            return inner
        if style == "ftn":
            return _CMS_FTNREF_RE.sub(
                lambda m: f"{MARK_OPEN}{m.group(1)}{MARK_CLOSE}", inner
            )
        return inner

    lang = cfg.get("lang", "pt")
    blocks: list[Block] = []
    last_end = 0
    for m in _CMS_BLOCK_RE.finditer(html_text):
        # CONTENT WRAPPED IN NOTHING AT ALL, which the Malagasy mirror does
        # 500-odd times: a paragraph that follows a </blockquote> is simply
        # emitted as bare text in the cell, with only a Word conditional
        # comment ("<!--[if !mso]-->") between. Without this the whole
        # paragraph vanishes -- §§27-29, 32-33, 35-36 and on through the work.
        # parse_page_pt recovers the same defect the same way.
        gap = strip_tags(mark(html_text[last_end : m.start()]))
        if gap and _CMS_GAP_KEEP_RE.search(gap):
            blocks.append(Block(is_full_bold(gap), "prose", gap))
        last_end = m.end()

        bq, _attrs, p_inner = m.group(1), m.group(2), m.group(3)
        if bq is not None:
            # One block per inner <p>, for the same reason parse_page_pt does
            # it: a numbered paragraph can start inside a <blockquote>, and
            # merge_quote_blocks re-joins genuine multi-line quotations after.
            pieces = _CMS_INNER_P_RE.findall(bq) or [bq]
            for piece in pieces:
                text = strip_tags(mark(piece))
                if text:
                    blocks.append(Block(False, "quote", text))
            continue
        if is_full_link(p_inner):
            continue
        is_heading = (
            is_full_bold(p_inner)
            or is_full_anchor(p_inner)
            or bool(_CMS_HEADING_FONT_RE.search(p_inner))
        )
        if not is_heading and is_bare_structural_label(strip_tags(p_inner), lang):
            is_heading = True
        text = strip_tags(mark(p_inner))
        if not text:
            continue
        blocks.append(Block(is_heading, "prose", text))
    blocks = merge_quote_blocks(blocks)
    if style == "sup":
        blocks, footnote_table = _cms_note_run(blocks)
    return blocks, footnote_table


def test_cms_latin_chapter_title_is_a_heading_though_it_is_not_bold() -> None:
    # p1s1c1_lt.htm, verbatim: Latin marks a chapter title with a named
    # anchor and a size-4 font, and does not bold it.
    page = (
        '<p align="left"><font size="4"><a name="CAPUT PRIMUM HOMO EST DEI">'
        " CAPUT PRIMUM<br />HOMO EST DEI « CAPAX »</a></font></p>"
        '<p align="left"><b>27</b> Dei desiderium in corde hominis est'
        " inscriptum<sup>1</sup>.</p>"
        '<p align="left"><font size="2">(1) Cf Act 17,26-28.</font></p>'
    )
    blocks, notes = parse_page_cms(page, {"notes": "sup"})
    assert [b.is_heading for b in blocks] == [True, False]
    assert blocks[0].text.startswith("CAPUT PRIMUM")
    assert blocks[1].text.endswith(f"inscriptum{MARK_OPEN}1{MARK_CLOSE}.")
    assert notes == {"1": "Cf Act 17,26-28."}


def test_cms_malagasy_reads_words_footnote_export() -> None:
    # 26-184_mg.html, abridged: the marker sits tight against the word it
    # follows, and the note text lives in a <div id="ftnN"> after the body.
    page = (
        '<p>26. Ny olombelona<a name="_ftnref1" href="#_ftn1">[1]</a>.</p>'
        '<div id="ftn1"><a name="_ftn1" href="#_ftnref1">[1]</a>&nbsp;DS 30.</div>'
    )
    blocks, notes = parse_page_cms(page, {"notes": "ftn"})
    assert blocks[0].text == f"26. Ny olombelona{MARK_OPEN}1{MARK_CLOSE}."
    assert notes == {"1": "DS 30."}


def test_cms_note_run_is_answerable_to_the_page_markers() -> None:
    # Italian numbers its footnotes continuously across a chapter, so an
    # article page's notes start wherever the previous page left off -- (29)
    # here, never (1). What makes the run a run is that it answers the
    # page's own markers.
    page = (
        '<p align="left"><b>27</b> Prose.<sup>29</sup></p>'
        '<p align="left"><font size="2">(29) Cf Act 17,26-28.</font></p>'
    )
    blocks, notes = parse_page_cms(page, {"notes": "sup"})
    assert notes == {"29": "Cf Act 17,26-28."}
    assert len(blocks) == 1

    # And a page that refers to nothing has no notes, whatever its last
    # block happens to open with.
    page = (
        '<p align="left"><b>27</b> Prose.</p>'
        '<p align="left">(3) Not a note; nothing on this page cites one.</p>'
    )
    blocks, notes = parse_page_cms(page, {"notes": "sup"})
    assert notes == {}
    assert len(blocks) == 2


# --------------------------------------------------------------------------
# The abbreviations table
# --------------------------------------------------------------------------

#: TWO EDITIONS PRINT ONE, AND THEY ARE NOT THE SAME TABLE.
#:
#: `abbreviations.json` shipped as `[]` from the first ingestion because
#: neither the English nor the Portuguese mirror carries the Catechism's
#: front matter -- both open at the Prologue. Two of the six editions added
#: on 2026-08-26 do carry it, and reading them settled the schema question
#: `docs/corpus-schema.md` had left open ("one shared table with per-language
#: expansions, or one per edition?") in favour of per-edition, on stronger
#: evidence than the one that question anticipated:
#:
#:   - **French** (`__P1.HTM`, "LISTE DES SIGLES") lists 58 magisterial
#:     documents and liturgical books -- LG, GS, DV, MR, OICA.
#:   - **Latin** (`abbrev_lt.htm`) lists 46 bibliographic series and editorial
#:     abbreviations -- PL, PG, CSEL, `q` for *quaestio* -- and then 73
#:     Scripture books under its own two testament headings.
#:
#: Their overlap is eight abbreviations, and on two of those eight the
#: editions disagree about what the letters mean: `SC` is *Sacrosanctum
#: concilium* in the French table and *Sources chrétiennes* in the Latin one,
#: `CA` is *Centesimus annus* against *Corpus apologetarum*. Both readings are
#: right for their own edition's references -- the Latin text's 118 `SC`
#: citations are volume-and-page ("SC 211, 392 (PG 7, 944)"), not conciliar
#: sections. A single shared table could not be built without overruling one
#: edition about its own apparatus, which is the same reason
#: `site/src/lib/refs-grammar.ts` keeps EN and PT sigla apart. So each edition
#: gets the table its own source prints, and the six that print none keep the
#: empty array, which is what their mirrors say.
#:
#: `abbr` is not unique within an edition either: the Latin table gives `Act`
#: twice, as *Actio* among the sigla and as *Actus Apostolorum* among the New
#: Testament books. Hence a list in source order rather than a mapping, and
#: hence `kind`.

#: `kind` is the distinction the SOURCE draws, and it draws only one: Latin
#: separates Scripture from everything else with a heading, French has a
#: single list. `docs/corpus-schema.md` originally proposed "scripture" |
#: "document" for this; "document" would be a false claim about most of the
#: Latin general list, where `q` is *quaestio* and `PL` is a Migne series.
#: `section` keeps the source's own heading verbatim, so a consumer that
#: wants a finer grouping can regroup without this file having guessed one.
_SIGLA_SCRIPTURE_MARKER = "ABBREVIATIONES PRO SACRA SCRIPTURA"

#: The Latin page sets its headings, and only its headings, in `size="4"` or
#: `size="5"`; every table cell is `size="3"` or unstyled. Section membership
#: is then "the last heading before this row", which is also how the page
#: reads.
_LA_SIGLA_HEADING_RE = re.compile(
    r'<font[^>]*\bsize="[45]"[^>]*>(.*?)</font>', re.DOTALL | re.IGNORECASE
)
#: INNERMOST rows and cells: the content may hold no further opening tag of
#: its own kind. The three real tables are nested inside the CMS shell's
#: layout table, and a plain non-greedy `<tr>(.*?)</tr>` matches the LAYOUT
#: row first, running from its opening tag to the first inner `</tr>` -- so
#: the outer cell and the first real cell read as one two-cell row ("SIGLA
#: AAS" | "Acta Apostolicae Sedis"), and `finditer` then resumes past the
#: real row it swallowed. The cell count alone does not catch that, because
#: the misread row has two cells.
_TR_RE = re.compile(r"<tr[^>]*>((?:(?!<tr[^>]*>).)*?)</tr>", re.DOTALL | re.IGNORECASE)
_TD_RE = re.compile(r"<td[^>]*>((?:(?!<td[^>]*>).)*?)</td>", re.DOTALL | re.IGNORECASE)


def parse_sigla_cms(html_text: str) -> list[dict]:
    """The Latin mirror's `abbrev_lt.htm`: three tables under three headings.

    Innermost two-cell rows only. The page nests its three real tables inside
    the CMS shell's layout table, whose own rows carry one cell or six -- so
    the cell count discriminates once the nesting does, and no assumption is
    made about tag balance that this old markup would have to honour.
    """
    headings = [
        (m.start(), strip_tags(m.group(1)))
        for m in _LA_SIGLA_HEADING_RE.finditer(html_text)
    ]
    headings = [(pos, title) for pos, title in headings if title]
    out: list[dict] = []
    for row in _TR_RE.finditer(html_text):
        cells = _TD_RE.findall(row.group(1))
        if len(cells) != 2:
            continue
        abbr, expansion = strip_tags(cells[0]), strip_tags(cells[1])
        if not abbr or not expansion:
            continue
        before = [t for pos, t in headings if pos < row.start()]
        section = before[-1] if before else ""
        scripture = _SIGLA_SCRIPTURE_MARKER in before
        out.append(
            {
                "abbr": abbr,
                "expansion": expansion,
                "kind": "scripture" if scripture else "general",
                "section": section,
            }
        )
    return out


_P_BLOCK_RE = re.compile(r"<p[^>]*>(.*?)</p>", re.DOTALL | re.IGNORECASE)
_BR_RE = re.compile(r"<br[^>]*>", re.IGNORECASE)


def parse_sigla_intratext(html_text: str) -> list[dict]:
    """The French mirror's `__P1.HTM`: one paragraph of `<br>`-separated rows.

    The abbreviation and its expansion are separated by nothing but a space,
    so where one ends is read the way the page itself reads: an abbreviation
    is the run of leading dot-terminated tokens ("Catech. R.", "off. lect."),
    or the first token alone when none of them is dotted ("AA", "DeV"). All
    58 rows split correctly under that rule; the failure it could have is an
    expansion whose first word is abbreviated, which this page has none of.
    """
    blocks = _P_BLOCK_RE.findall(html_text)
    if not blocks:
        return []
    # The list is one <p> and the page's other paragraphs are the heading and
    # an empty one, so "the block with the most rows" needs no French in it.
    body = max(blocks, key=lambda b: len(_BR_RE.findall(b)))
    out: list[dict] = []
    for row in _BR_RE.split(body):
        text = strip_tags(row)
        if not text:
            continue
        tokens = text.split(" ")
        n = 0
        while n < len(tokens) - 1 and tokens[n].endswith("."):
            n += 1
        if n == 0:
            n = 1
        abbr, expansion = " ".join(tokens[:n]), " ".join(tokens[n:])
        if not expansion:
            continue
        out.append(
            {
                "abbr": abbr,
                "expansion": expansion,
                "kind": "general",
                "section": "LISTE DES SIGLES",
            }
        )
    return out


SIGLA_READERS = {"intratext": parse_sigla_intratext, "cms": parse_sigla_cms}


def test_sigla_cms_reads_a_two_cell_row_and_its_section() -> None:
    # The layout table WRAPS the heading and the real table, which is the
    # shape that made a plain non-greedy row match read "layout SIGLA q" as
    # one row and drop the real one. See `_TR_RE`.
    page = (
        '<table><tr><td colspan="6">layout'
        '<p><b><font size="5">SIGLA</font></b></p>'
        '<table><tr><td width="18%">q</td><td width="82%">quaestio</td></tr></table>'
        "</td></tr></table>"
        f'<p><b><font size="5">{_SIGLA_SCRIPTURE_MARKER}</font></b></p>'
        '<p><font size="4">VETUS TESTAMENTUM</font></p>'
        '<table><tr><td width="18%">Gn</td>'
        '<td width="82%"><i>Liber Genesis</i> </td></tr></table>'
    )
    assert parse_sigla_cms(page) == [
        {"abbr": "q", "expansion": "quaestio", "kind": "general", "section": "SIGLA"},
        {
            "abbr": "Gn",
            "expansion": "Liber Genesis",
            "kind": "scripture",
            "section": "VETUS TESTAMENTUM",
        },
    ]


def test_sigla_intratext_splits_a_dotted_abbreviation_from_its_expansion() -> None:
    page = (
        "<p><b>LISTE DES SIGLES</b></p>"
        "<p>AA\nApostolicam actuositatem<br>"
        "Catech. R. Catechismus Romanus<br>"
        "off. lect. office des lectures</p>"
    )
    assert [(e["abbr"], e["expansion"]) for e in parse_sigla_intratext(page)] == [
        ("AA", "Apostolicam actuositatem"),
        ("Catech. R.", "Catechismus Romanus"),
        ("off. lect.", "office des lectures"),
    ]


# --------------------------------------------------------------------------
# Structural labels, per edition
# --------------------------------------------------------------------------

#: The ordinal each edition counts its parts, sections and chapters with,
#: folded (uppercase, accents stripped) exactly as `match_label` will see it.
#: Both genders and both declensions where the language has them: German heads
#: a part ERSTER TEIL and a chapter ERSTES KAPITEL, Latin PARS PRIMA and CAPUT
#: PRIMUM, and the ordinal is the only thing carrying the number.
_ORDINALS = {
    "de": {
        "ERSTER": 1,
        "ERSTES": 1,
        "ZWEITER": 2,
        "ZWEITES": 2,
        "DRITTER": 3,
        "DRITTES": 3,
        "VIERTER": 4,
        "VIERTES": 4,
        "FUNFTER": 5,
        "FUNFTES": 5,
    },
    "en": {
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
    },
    "es": {
        "PRIMERA": 1,
        "PRIMERO": 1,
        "SEGUNDA": 2,
        "SEGUNDO": 2,
        "TERCERA": 3,
        "TERCERO": 3,
        "CUARTA": 4,
        "CUARTO": 4,
        "QUINTA": 5,
        "QUINTO": 5,
    },
    "fr": {
        "PREMIERE": 1,
        "PREMIER": 1,
        "DEUXIEME": 2,
        "SECONDE": 2,
        "SECOND": 2,
        "TROISIEME": 3,
        "QUATRIEME": 4,
        "CINQUIEME": 5,
    },
    "it": {
        "PRIMA": 1,
        "PRIMO": 1,
        "SECONDA": 2,
        "SECONDO": 2,
        "TERZA": 3,
        "TERZO": 3,
        "QUARTA": 4,
        "QUARTO": 4,
        "QUINTA": 5,
        "QUINTO": 5,
    },
    "la": {
        "PRIMA": 1,
        "PRIMUM": 1,
        "SECUNDA": 2,
        "SECUNDUM": 2,
        "TERTIA": 3,
        "TERTIUM": 3,
        "QUARTA": 4,
        "QUARTUM": 4,
        "QUINTA": 5,
        "QUINTUM": 5,
    },
    "mg": {
        "VOALOHANY": 1,
        "FAHAROA": 2,
        "FAHATELO": 3,
        "FAHEFATRA": 4,
        "FAHADIMY": 5,
    },
    "pt": {
        "PRIMEIRA": 1,
        "PRIMEIRO": 1,
        "SEGUNDA": 2,
        "SEGUNDO": 2,
        "TERCEIRA": 3,
        "TERCEIRO": 3,
        "QUARTA": 4,
        "QUARTO": 4,
        "QUINTA": 5,
        "QUINTO": 5,
    },
}

#: What each edition prints above each kind of division, in the order the
#: kinds are tried. Matched against `fold(text)`, so patterns are written
#: uppercase and unaccented and need no IGNORECASE.
#:
#: `roman` LAST, ALWAYS: it is the loosest pattern here and would otherwise
#: swallow a labelled heading that happens to open with a numeral.
#:
#: THE COLON IS NOT PART OF THE LABEL. The Italian, Latin and Spanish tables
#: of contents print "Articolo 1:", and the pages themselves print
#: "ART\u00cdCULO 2 \u201cY EN JESUCRISTO...\u201d" with no colon at all.
#: Matching the colon cost all 65 articles in each of those three editions.
#:
#: THE ARTICLE AND PARAGRAPH NUMBER IS NOT ALWAYS A DIGIT. Italian, Latin and
#: Spanish print "Articolo l:", "Paragrafo l:" -- a lowercase letter L where
#: the digit 1 belongs, a Word-era typesetting artifact that appears in all
#: three at the same six headings. `_label_number` reads a lone L as 1, which
#: is the only thing it can mean: these editions number articles 1-12 and
#: paragraphs 1-7, and there is no fiftieth of either.
_LABEL_PATTERNS = {
    "de": [
        ("prologue", r"^PROLOG$"),
        ("part", r"^(ERSTER|ZWEITER|DRITTER|VIERTER|FUNFTER)\s+TEIL\b"),
        ("section", r"^(ERSTER|ZWEITER|DRITTER)\s+ABSCHNITT\b"),
        ("chapter", r"^(ERSTES|ZWEITES|DRITTES|VIERTES)\s+KAPITEL\b"),
        ("article", r"^ARTIKEL\s+(\d+)\b"),
        ("paragraph_marker", r"^ABSATZ\s+(\d+)\b"),
        ("in_brief", r"^KURZTEXTE?$"),
        # THE ONE EDITION THAT PRINTS ITS ROMAN NUMERALS WITHOUT A PERIOD
        # ("III Armut im Herzen", against English's "III. Poverty of heart").
        # Optional-period costs a guard elsewhere: the numeral class is cut to
        # I/V/X here, because D, C, L and M all begin ordinary German words
        # ("Die", "Christus", "Liebe", "Man") and without the period there is
        # nothing else to stop one matching.
        ("roman", r"^([IVX]{1,5})\.?\s"),
    ],
    "en": [
        ("prologue", r"^PROLOGUE$"),
        ("part", r"^PART\s+(ONE|TWO|THREE|FOUR|FIVE)\b"),
        ("section", r"^SECTION\s+(ONE|TWO|THREE|FOUR|FIVE)\b"),
        ("chapter", r"^CHAPTER\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN)\b"),
        ("article", r"^ARTICLE\s+(\d+)\b"),
        ("paragraph_marker", r"^PARAGRAPH\s+(\d+)\."),
        ("in_brief", r"^IN BRIEF$"),
        # THE PERIOD IS REQUIRED FOR `I` AND OPTIONAL FOR EVERYTHING LONGER,
        # and the asymmetry is English rather than fussiness: `I` is the
        # first-person pronoun and this book opens on it. Making the period
        # optional outright matches 16 blocks, 8 of them ordinary prose or
        # quotation — `I BELIEVE`, `I am the LORD your God, who brought you
        # out of the land of Egypt`, `I want to spend my heaven in doing good
        # on earth`. No English word is two roman digits long, so requiring
        # two characters leaves exactly two blocks, and both are subdivisions
        # the tree was missing: `II THE CHURCH IS HOLY` (__P29.HTM) and
        # `VII "BUT DELIVER US FROM EVIL"` (__PAC.HTM). Measured 2026-09-03.
        #
        # The lookbehind is what says "two or more": it is checked at the
        # position after the numeral, so it succeeds only when the numeral
        # itself supplied those two characters. German and Spanish reach the
        # same place from the other side — they drop the period for every
        # numeral and narrow the class instead — and French must have neither,
        # because its Creed table on __P14.HTM prints `II ressuscita le
        # troisième jour,` as a cell.
        ("roman", r"^([IVXLCDM]+)(?:\.|(?<=[IVX]{2}))\s"),
    ],
    "es": [
        ("prologue", r"^PROLOGO$"),
        ("part", r"^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA)\s+PARTE\b"),
        ("section", r"^(PRIMERA|SEGUNDA|TERCERA)\s+SECCION\b"),
        ("chapter", r"^CAPITULO\s+(PRIMERO|SEGUNDO|TERCERO|CUARTO)\b"),
        ("article", r"^ARTICULO\s+([IVXL\d]+)\b"),
        ("paragraph_marker", r"^PARRAFO\s+([IVXL\d]+)\b"),
        ("in_brief", r"^RESUMEN$"),
        # Spanish is inconsistent about the period after a roman numeral --
        # "I. El deseo de Dios" on most pages, "II Las vías de acceso al
        # conocimiento de Dios" on others -- so it takes German's shape here,
        # and for the same reason takes German's narrower numeral class. See
        # the German entry: without the period, D/C/L/M begin ordinary words.
        ("roman", r"^([IVX]{1,5})\.?\s"),
    ],
    "fr": [
        ("prologue", r"^PROLOGUE$"),
        ("part", r"^(PREMIERE|DEUXIEME|TROISIEME|QUATRIEME|CINQUIEME)\s+PARTIE\b"),
        ("section", r"^(PREMIERE|DEUXIEME|TROISIEME)\s+SECTION\b"),
        ("chapter", r"^CHAPITRE\s+(PREMIER|DEUXIEME|TROISIEME|QUATRIEME)\b"),
        ("article", r"^ARTICLE\s+(\d+)\b"),
        ("paragraph_marker", r"^PARAGRAPHE\s+(\d+)\b"),
        ("in_brief", r"^EN BREF$"),
        # Period-optional, and so the narrower numeral class -- see the German
        # entry. French prints "III Le Christ Jésus" alongside "II. Les étapes
        # de la Révélation", and the unperiodded ones were reaching the tree
        # as unnumbered sub-headings.
        ("roman", r"^([IVX]{1,5})\.?\s"),
    ],
    "it": [
        # PREFAZIONE, not PROLOGO. The Italian edition is the only one that
        # calls the Prologue a preface, and reading only the cognate left its
        # §§1-25 under a paragraph-less top-level node.
        ("prologue", r"^PREFAZIONE$"),
        ("part", r"^PARTE\s+(PRIMA|SECONDA|TERZA|QUARTA|QUINTA)\b"),
        ("section", r"^SEZIONE\s+(PRIMA|SECONDA|TERZA)\b"),
        ("chapter", r"^CAPITOLO\s+(PRIMO|SECONDO|TERZO|QUARTO)\b"),
        ("article", r"^ARTICOLO\s+([IVXL\d]+)\b"),
        ("paragraph_marker", r"^PARAGRAFO\s+([IVXL\d]+)\b"),
        ("in_brief", r"^IN SINTESI$"),
        ("roman", r"^([IVXLCDM]+)\.\s"),
    ],
    "la": [
        # PROOEMIUM, not PROLOGUS -- the word the Latin edition actually
        # prints. Same trap as Italian's PREFAZIONE.
        ("prologue", r"^PROOEMIUM$"),
        ("part", r"^PARS\s+(PRIMA|SECUNDA|TERTIA|QUARTA|QUINTA)\b"),
        ("section", r"^SECTIO\s+(PRIMA|SECUNDA|TERTIA)\b"),
        ("chapter", r"^CAPUT\s+(PRIMUM|SECUNDUM|TERTIUM|QUARTUM)\b"),
        ("article", r"^ARTICULUS\s+([IVXL\d]+)\b"),
        ("paragraph_marker", r"^PARAGRAPHUS\s+([IVXL\d]+)\b"),
        # The Latin edition heads its summaries "Compendium", which is also
        # the name of a different work in this corpus. Nothing here is keyed
        # on the word, so the collision is only a reader's.
        ("in_brief", r"^COMPENDIUM$"),
        ("roman", r"^([IVXLCDM]+)\.\s"),
    ],
    "mg": [
        ("prologue", r"^TENY MIALOHA$"),
        ("part", r"^FIZARANA\s+(VOALOHANY|FAHAROA|FAHATELO|FAHEFATRA)\b"),
        ("section", r"^SAMPANA\s+(VOALOHANY|FAHAROA|FAHATELO)\b"),
        ("chapter", r"^TOKO\s+(VOALOHANY|FAHAROA|FAHATELO|FAHEFATRA)\b"),
        ("article", r"^ANDALANA\s+(\d+)\b"),
        ("paragraph_marker", r"^PARAGRAFY\s+(\d+)\b"),
        # PRINTED, BUT NOT BOLDED. Every other edition sets its in-brief
        # heading in bold; Malagasy sets "FAMINTINANA" in the same plain type
        # as the summary paragraphs under it, which is why it needs
        # `is_bare_structural_label` and why reading only bold blocks as
        # headings would lose every one of this edition's in-brief divisions.
        ("in_brief", r"^FAMINTINANA:?$"),
        ("roman", r"^([IVXLCDM]+)\.\s"),
    ],
    "pt": [
        ("prologue", r"^PROLOGO$"),
        ("part", r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+PARTE\b"),
        ("section", r"^(PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA)\s+SECCAO\b"),
        ("chapter", r"^CAPI?TULO\s+(PRIMEIRO|SEGUNDO|TERCEIRO|QUARTO|QUINTO)\b"),
        ("article", r"^ARTIGO\s+([IVXL\d]+)\b"),
        ("paragraph_marker", r"^PARAGRAFO\s+(\d+)\b"),
        ("in_brief", r"^RESUMINDO:?$"),
        ("roman", r"^([IVXLCDM]+)\.?\s"),
    ],
}

_COMPILED_LABELS = {
    lang: [(kind, re.compile(pat)) for kind, pat in patterns]
    for lang, patterns in _LABEL_PATTERNS.items()
}

_ORDINAL_KINDS = ("part", "section", "chapter")


def _label_number(kind: str, raw: str, ordinals: dict[str, int]) -> int | None:
    if kind in _ORDINAL_KINDS:
        return ordinals.get(raw)
    if kind == "roman":
        return roman_to_int(raw)
    if raw.isdigit():
        return int(raw)
    # See `_LABEL_PATTERNS`: a lone L in an article or paragraph number is the
    # source's letter for the digit 1, not the numeral fifty.
    if raw == "L":
        return 1
    return roman_to_int(raw) or 1


def make_match_label(lang: str):
    """The edition's heading recognizer: folded text in, `(kind, number)` out.

    One factory for all eight parsed editions, because the differences
    between them are entirely in `_LABEL_PATTERNS` and `_ORDINALS` -- the
    matching itself never varied."""
    labels = _COMPILED_LABELS[lang]
    ordinals = _ORDINALS[lang]

    def match_label(text: str) -> tuple[str, int | None] | None:
        folded = fold(text)
        for kind, pat in labels:
            m = pat.match(folded)
            if not m:
                continue
            return kind, (
                _label_number(kind, m.group(1), ordinals) if m.groups() else None
            )
        return None

    return match_label


MATCH_LABEL = {lang: make_match_label(lang) for lang in _LABEL_PATTERNS}


def test_match_label_reads_each_edition_in_its_own_words() -> None:
    # One heading of each kind, verbatim from the mirrors.
    assert MATCH_LABEL["la"]("PARS PRIMA") == ("part", 1)
    assert MATCH_LABEL["la"]("CAPUT SECUNDUM") == ("chapter", 2)
    assert MATCH_LABEL["la"]("Compendium") == ("in_brief", None)
    assert MATCH_LABEL["de"]("DRITTER TEIL") == ("part", 3)
    assert MATCH_LABEL["de"]("ZWEITES KAPITEL") == ("chapter", 2)
    assert MATCH_LABEL["de"]("KURZTEXTE") == ("in_brief", None)
    # German prints its roman numerals bare, and must not read an ordinary
    # word that opens with a numeral letter as one.
    assert MATCH_LABEL["de"]("III Armut im Herzen") == ("roman", 3)
    assert MATCH_LABEL["de"]("Die Zehn Gebote") is None
    assert MATCH_LABEL["fr"]("QUATRIEME PARTIE") == ("part", 4)
    assert MATCH_LABEL["fr"]("Chapitre premier") == ("chapter", 1)
    assert MATCH_LABEL["it"]("PARTE TERZA") == ("part", 3)
    assert MATCH_LABEL["es"]("SEGUNDA SECCION") == ("section", 2)
    assert MATCH_LABEL["mg"]("FIZARANA FAHEFATRA") == ("part", 4)
    assert MATCH_LABEL["mg"]("ANDALANA 7") == ("article", 7)
    # The lowercase-L-for-1 artifact, present in all three CMS editions.
    assert MATCH_LABEL["it"]("Articolo l: Il sacramento del Battesimo") == (
        "article",
        1,
    )
    assert MATCH_LABEL["es"]("Parrafo l: Jesus e Israel") == ("paragraph_marker", 1)


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


def sample_chunks_head(pages: list[tuple[str, str]]) -> list[list[tuple[str, str]]]:
    """The first few pages, for the six editions added after the two above.

    The named slices are better -- they were chosen so the sample exercises
    both the front of the work and a deep, quotation-heavy article -- but they
    name pages, and page names are per-mirror. Nothing here needs a
    representative slice the way the first ingestion did: those two editions
    established what the schema is, and `--sample` on the rest is a smoke test
    that the mirror still answers and its headings still parse. The full run is
    offline after `--capture` anyway."""
    return [pages[:8]]


# --------------------------------------------------------------------------
# Orchestration
# --------------------------------------------------------------------------

#: The eight editions this scraper PARSES, keyed by our language tag. The two
#: it only captures (Arabic, Chinese -- PDF, see `EDITIONS`) are absent by
#: construction: a language here is a language that gets a work directory.
#:
#: `family` picks the page reader, `notes` the apparatus within it, and the two
#: are not the same axis -- Italian and Latin share both, Spanish shares the
#: family and has no apparatus at all.
#:
#: WHAT AN EMPTY APPARATUS MEANS FOR `citations`. Three of the eight editions
#: print no footnotes: French folds every reference into the running text in
#: parentheses, German in square brackets, Spanish in parentheses with a
#: hyperlink where the referent is on vatican.va. Their paragraphs therefore
#: carry `citations: []` while the same paragraph in English, Latin, Italian,
#: Malagasy or Portuguese carries the reference as a citation. That is a
#: difference between the editions, not between the parsers, and it is left
#: as the source has it: lifting a parenthesis out of French prose would be
#: this project inventing an apparatus its source does not have, and the text
#: those editions print would then be missing words they do print. It is the
#: one place `audit.py balance` must be read with the editions in mind -- see
#: the manifest note each of the three carries.
LANG_CONFIG = {
    "de": {
        "family": "intratext",
        "footnotes": False,
        "number_re": NUMBER_RE,
        "work_id": "ccc.de",
        "title": "Katechismus der Katholischen Kirche",
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
    "en": {
        "family": "intratext",
        "footnotes": True,
        "number_re": NUMBER_RE,
        "sample_chunks": sample_chunks_en,
        "work_id": "ccc.en",
        "title": "Catechism of the Catholic Church",
        "copyright_holder": "Libreria Editrice Vaticana / United States Catholic Conference",
        # What the source prints, and nothing else. This used to carry USCCB's
        # stipulated notice ("CATECHISM OF THE CATHOLIC CHURCH, SECOND
        # EDITION, Copyright (c) 2000, ... Inc."), which does not appear
        # anywhere in the 375 raw pages under vatican.va/archive/ENG0015/ --
        # those print only the line below, plus "copyright (c) Libreria
        # Editrice Vaticana, Citta del Vaticano 1993" on the index. It was
        # composed from USCCB's permissions policy (docs/research/copyright.md
        # §2), a condition of licensing pathways this project deliberately is
        # not on: §5's posture is to host without prior permission and comply
        # if asked. So `notice` is now the only thing it claims to be -- a
        # transcription of the fetched page -- and USCCB keeps its place in
        # `holder`, which is our own attribution and does not claim to be
        # quoting anyone. Corrected 2026-08-24.
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
    "es": {
        "family": "cms",
        "notes": "none",
        "number_re": NUMBER_RE,
        "work_id": "ccc.es",
        "title": "Catecismo de la Iglesia Católica",
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
    "fr": {
        "family": "intratext",
        "footnotes": False,
        "number_re": NUMBER_RE,
        "work_id": "ccc.fr",
        "title": "Catéchisme de l'Église Catholique",
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
    "it": {
        "family": "cms",
        "notes": "sup",
        "number_re": NUMBER_RE,
        "work_id": "ccc.it",
        "title": "Catechismo della Chiesa Cattolica",
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
    "la": {
        "family": "cms",
        "notes": "sup",
        "number_re": NUMBER_RE,
        "work_id": "ccc.la",
        "title": "Catechismus Catholicae Ecclesiae",
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
    "mg": {
        "family": "cms",
        "notes": "ftn",
        "number_re": NUMBER_RE,
        "work_id": "ccc.mg",
        "title": "Katesizin'ny Fiangonana Katôlika",
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
    "pt": {
        "family": "pt",
        "number_re": NUMBER_RE,
        "sample_chunks": sample_chunks_pt,
        "work_id": "ccc.pt",
        "title": "Catecismo da Igreja Católica",
        "copyright_holder": "Libreria Editrice Vaticana",
        "copyright_notice": "Copyright © Libreria Editrice Vaticana",
    },
}

#: Filled in from the tables above rather than repeated in each entry, so an
#: edition cannot end up reading one mirror and citing another.
for _lang, _cfg in LANG_CONFIG.items():
    _cfg["lang"] = _lang
    _cfg["match_label"] = MATCH_LABEL[_lang]
    _cfg["raw_dir"] = raw_dir(_lang)
    _cfg["base_url"] = EDITIONS[_lang].base
    _cfg["toc_href"] = EDITIONS[_lang].toc
    _cfg.setdefault("sample_chunks", sample_chunks_head)

PAGE_FAMILIES.update(
    {
        "intratext": parse_page_intratext,
        "cms": parse_page_cms,
        "pt": lambda html_text, _cfg: parse_page_pt(html_text),
    }
)


def run_scrape(
    lang: str, sample: bool, corrections: list[dict] | None = None
) -> tuple[ScrapeState, list[tuple[str, str]], Fetcher]:
    cfg = LANG_CONFIG[lang]
    fetcher = make_fetcher(RAW_ROOT / cfg["raw_dir"])
    all_pages = discover_pages(fetcher, lang)
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
            blocks, footnote_table = PAGE_FAMILIES[cfg["family"]](html_text, cfg)
            process_page(blocks, footnote_table, cfg, state)
        state.finalize_open_paragraph()
        # close remaining open structure nodes at end of chunk
        state.stack = []

    sigla_page = EDITIONS[lang].sigla
    if sigla_page is not None:
        # Front matter, on a page the loop above never visits (French keeps it
        # in `front`, Latin in `extra`), so it is fetched and corrected here.
        # Read on sampled runs too: it is one cached page, and leaving it out
        # would make `--sample` report every correction filed against it as
        # drift.
        try:
            page_html = fetcher.fetch_str(EDITIONS[lang].base + sigla_page, sigla_page)
        except RuntimeError as exc:
            state.fetch_failures.append(f"{sigla_page}: {exc}")
        else:
            page_html = apply_raw_text_corrections(
                page_html,
                sigla_page,
                state.corrections,
                state.corrections_applied,
                state.corrections_seen,
            )
            state.abbreviations = SIGLA_READERS[cfg["family"]](page_html)
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
    # Correction ccc.fr-p2s1-missing-chapter-one, the French mirror's copy of
    # the same omission. Its breadcrumb prints the chapter title with the
    # definite article eaten by its own entity-escaping ("DE ÉGLISE"); the
    # correction supplies the grammatical form, so the two differ by exactly
    # that word.
    "CHAPITRE PREMIER LE MYSTERE PASCAL DANS LE TEMPS DE ÉGLISE": (
        "CHAPITRE PREMIER LE MYSTÈRE PASCAL DANS LE TEMPS DE L’ÉGLISE"
    ),
    # NOT A CORRECTION -- a breadcrumb that reflects how IntraText BUILDS a
    # breadcrumb rather than how the page is divided. It joins consecutive
    # bold blocks at one index level, and the French mirror bolds a run-in
    # sub-header ("REVELATION PROGRESSIVE DE LA RESURRECTION") that the
    # English mirror sets plain -- so English declares the heading alone and
    # French declares the two glued together, off the same page of the same
    # work. The tree keeps them as the two headings they are; this tells the
    # check to expect that.
    "I. La résurrection du Christ et la nôtre REVELATION PROGRESSIVE DE LA RESURRECTION": (
        "I. La résurrection du Christ et la nôtre"
    ),
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

    # An edition that prints an abbreviations table must still be producing
    # one. Nothing else would notice it stopping: the file is optional by
    # design (six editions ship it empty), so a reader that quietly matched
    # nothing after a markup change would read as one more mirror without
    # front matter.
    if EDITIONS[lang].sigla is not None and not state.abbreviations:
        problems.append(
            f"{EDITIONS[lang].sigla} parsed to no abbreviations, but this edition "
            "prints a table"
        )
    for entry in state.abbreviations:
        if not entry["abbr"] or not entry["expansion"]:
            problems.append(f"abbreviation entry with an empty side: {entry}")
        if "<" in entry["expansion"] or ">" in entry["expansion"]:
            problems.append(f"leftover markup in abbreviation {entry['abbr']!r}")

    return (len(problems) == 0), problems


def build_manifest(
    lang: str,
    state: ScrapeState,
    fetched_pages: list[tuple[str, str]],
    generated_at: str,
) -> dict:
    cfg = LANG_CONFIG[lang]
    # A cache-only reparse is not a new retrieval. Preserve each source's
    # original capture date when an existing manifest knows it; otherwise a
    # harmless parser change would falsely claim every raw page was fetched
    # again today, undermining the raw/works distinction.
    # Each page's own capture date, read off the page (common/captured.py).
    # `fetched_pages` already pairs every URL with the file it was cached as,
    # so this is a lookup and not a reconstruction. Until 2026-08-28 it came
    # from the previous manifest instead, which meant a rebuild into an empty
    # directory stamped every page as fetched today -- and, because the
    # manifest carried one date for the whole work, that date was the last
    # crawl session's rather than the page's.
    cache_dir = RAW_ROOT / cfg["raw_dir"]
    previous_dates: dict[str, str] = {
        url: date
        for url, name in fetched_pages
        if (date := captured_at(cache_dir / name)) is not None
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
            f"abbreviations.json holds {len(state.abbreviations)} entries: this edition's "
            "own front-matter table, verbatim and in source order, or nothing where the "
            "mirror prints none. Six of the eight do print none -- they open at the "
            "Prologue -- and the two that print one print DIFFERENT tables, so this file "
            "is deliberately per-edition rather than one shared table: French lists 58 "
            "magisterial documents and liturgical books, Latin 46 bibliographic and "
            "editorial sigla plus 73 Scripture books, and where they overlap they "
            "disagree ('SC' is Sacrosanctum concilium in French and Sources chretiennes "
            "in Latin, which is what this edition's own references mean by it). `abbr` is "
            "therefore not unique within an edition either (Latin gives 'Act' as both "
            "Actio and Actus Apostolorum), and `kind` is the only division either source "
            "itself draws: scripture, or general."
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
    if state.display_matter:
        headers = ", ".join(
            repr(h) for h in dict.fromkeys(h for h, _t in state.display_matter)
        )
        notes.append(
            f"{len(state.display_matter)} block(s), "
            f"{sum(len(t) for _h, t in state.display_matter):,} characters, are display "
            f"matter printed under a mini-header inside an in-brief ({headers}) and are "
            "dropped with that header rather than stored as the preceding paragraph's "
            "continuation, which is where they used to go. In this edition that is the "
            "three-column Ten Commandments table the mirror prints between paragraph "
            "2051 and 2052; unnumbered display matter has no address in paragraphs.json, "
            "the Portuguese mirror prints no such table, and the Compendium already "
            "declines the same table in its own appendix. raw/ keeps every word, so a "
            "later schema for unnumbered matter recovers it by re-parsing."
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
    if sample_run_writes_nothing(sample):
        return
    out_dir = BUILD_ROOT / LANG_CONFIG[lang]["work_id"]
    out_dir.mkdir(parents=True, exist_ok=True)
    for node in state.root_children:
        node.compute_span()
    structure = [n.to_dict() for n in state.root_children]
    paragraphs = [state.paragraphs[n].to_dict() for n in sorted(state.paragraphs)]
    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    manifest = build_manifest(lang, state, fetched_pages, generated_at)

    write_stamped_json(
        out_dir,
        {
            "manifest.json": manifest,
            "structure.json": structure,
            "paragraphs.json": paragraphs,
            "abbreviations.json": state.abbreviations,
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
    if state.abbreviations:
        by_kind: dict[str, int] = {}
        for entry in state.abbreviations:
            by_kind[entry["kind"]] = by_kind.get(entry["kind"], 0) + 1
        print(f"abbreviations table: {len(state.abbreviations)} entries {by_kind}")
    else:
        print("abbreviations table: none (this mirror prints no front matter)")
    print(f"source gaps recorded: {state.gaps}")
    print(f"dropped mini-headers: {len(state.dropped)}")
    if state.display_matter:
        by_header: dict[str, int] = {}
        for header, _text in state.display_matter:
            by_header[header] = by_header.get(header, 0) + 1
        chars = sum(len(text) for _header, text in state.display_matter)
        print(
            f"display matter dropped with its mini-header: "
            f"{len(state.display_matter)} block(s), {chars:,} chars, under "
            f"{len(by_header)} header(s)"
        )
        for header, count in by_header.items():
            print(f"  - {header!r}: {count}")
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
    ap.add_argument(
        "--lang",
        default="all",
        help=(
            "'all' (the default, every parsed edition), 'both' (en,pt -- what "
            "this flag meant while those were the only two), or a "
            "comma-separated list of " + ",".join(LANG_CONFIG)
        ),
    )
    ap.add_argument(
        "--sample",
        action="store_true",
        help="process only the Prologue + Baptism article slices",
    )
    ap.add_argument(
        "--capture",
        nargs="?",
        const="all",
        metavar="LANGS",
        help=(
            "fetch raw pages only, parsing nothing: 'all' (the default) or a "
            "comma-separated list of " + ",".join(EDITIONS)
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
            print(f"unknown edition(s): {', '.join(unknown)}", file=sys.stderr)
            return 2
        return capture_raw(wanted)

    if args.lang == "all":
        langs = list(LANG_CONFIG)
    elif args.lang == "both":
        langs = ["en", "pt"]
    else:
        langs = [x.strip() for x in args.lang.split(",") if x.strip()]
    unknown = [x for x in langs if x not in LANG_CONFIG]
    if unknown:
        print(f"unknown language(s): {', '.join(unknown)}", file=sys.stderr)
        return 2
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
