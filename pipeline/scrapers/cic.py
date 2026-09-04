#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The *Code of Canon Law* (1983), from vatican.va -- 1,752 canons in the
seven languages the Holy See publishes it in as HTML.

WHY THIS IS ITS OWN SCRAPER. `csdc.py` could import `vatican_docs` almost
whole because its source IS a vatican.va document page; this one is not. The
Code lives in the `archive/` mirror under a template that predates the
document shell -- no footnotes anywhere, no `<meta>` the document parser
reads, and its text spread over as many as 253 separate pages per edition
whose addresses no rule derives. What is shared is the layer below:
`decode_page`, `narrow_html`, `raw_blocks` and the crawl policy come from
`vatican_docs`, because those are about what a vatican.va page IS.

WHAT IT IS ADDRESSED BY is the canon. "CIC can. 748 §2" names canon 748 the
way "CCC 1731" names a paragraph, so this is `type: "canon-law"`, work id
`cic.{lang}`, and each of the 1,752 canons is an address of its own -- the
same argument, and the same seam, `csdc.py` sets out at length.

THE PAGE FAMILIES ARE THREE, and the difference between them is only how
much of the Code arrives per request:

    chunked   en it es de fr   45 to 253 pages, one per title or chapter
    book      la               7 pages, one per LIBER
    single    ru               1 page of 4.7 MB, the whole Code

They are not three parsers. Every edition paints its divisions the same way
-- `<p align="center">` -- and every edition opens a canon with a marker at
the head of its own block, so the walk is one walk. What is declared per
edition is the marker's FORM (below) and nothing else.

THE INDEX PAGE IS THE CRAWL PLAN AND NOTHING IS DERIVED FROM IT BY RULE.
Each language's `cic_index_{code}.html` links every page of its own edition,
and the six conventions have no rule in common: `cic_lib1-cann7-22_en.html`,
`cic_libroI_7-22_it.html`, `cic_libro1_cann7-22_sp.html`, `cic_liberI_la.html`
-- different directory (`eng`, `ita`, `esp`, `deu`, `fra`, `latin`),
different separator, different numeral. So discovery READS the index; a page
this scraper cannot see linked is a page it does not fetch.

TWO THINGS THE 2026-08-15 SURVEY GOT WRONG, and both are why this work was
out of scope until today (`docs/decisions.md` §Scope):

  - **"not Latin (`cic_index_lt.html`, 404)"**. The Latin index is
    `cic_index_la.html`. `lt` 404s here, and the survey read that as the
    edition's absence -- the exact inverse of the trap `ccc.py` documents,
    where `catechism_lt` on the same host IS Latin. The mirror is not
    consistent with itself about this and neither guess can be trusted:
    `archive/cdc/index.htm` names every edition and links it, and that page
    is the only thing here that was asked.
  - **"no Portuguese edition on vatican.va at all"**. There is one, at
    `cod-iuris-canonici/portuguese/codex-iuris-canonici_po.pdf` -- 488 pages
    with a clean text layer. It is fetched by this scraper and parsed by
    nothing yet; see `UNPARSED_FORMATS`.

THE CODE ON THIS MIRROR IS KEPT CURRENT, AND THAT IS THE FACT TO CHECK
BEFORE READING ANY OF IT. Book VI was replaced whole by *Pascite Gregem Dei*
on 8 December 2021, and the pages here carry the REPLACEMENT: English canon
1311 has the §2 on pastoral charity the revision introduced, canon 1398 is
the new delict against the dignity of the person, and the 1983 canon on
abortion has moved to 1397 §2. The `cic_lib6_*.pdf` beside each edition is
the same revised book in another format, not a correction to an outdated
page. It was worth checking twice: the obvious reading of an index that
links a PDF called *Nova versio Libri VI* is that the HTML is the old one,
and that reading is wrong.

THE LATIN EDITION PRINTS AN AMENDMENT APPARATUS AND IT IS THE ONLY ONE THAT
DOES. A superscript `n` sits beside every canon a later act has changed --
its own legend says so, in Italian, at the foot of the page: `( n : Indica
che il testo corrisponde alla nuova versione o a un nuovo paragrafo)` -- and
below that, separated by `* * *` rules, the SUPERSEDED wording of each,
under a bracketed line naming the motu proprio that changed it. That matter
is real content and it is not an address: canon 579 must resolve to the law
in force, so the old wording rides on the canon as `superseded` rather than
in `sections.json`'s numbered flow. `split_apparatus` is where the page is
cut, and it is cut by reading the numbers -- a canon number cannot be
printed twice in one book, so the first repeat is where the Code stops and
the apparatus starts.
"""

from __future__ import annotations

import argparse
import html as ihtml
import re
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from urllib.parse import urljoin

import common
import vatican_docs as vd
from common import (
    Fetcher,
    build_root,
    captured_at,
    corpus_dir,
    corrections_receipt,
    load_corrections,
    require_all_applied,
    require_corpus,
    write_stamped_json,
)

DATA_ROOT = corpus_dir()
RAW_ROOT = DATA_ROOT / "raw" / "cic"
BUILD_ROOT = build_root()

#: The Apostolic Constitution *Sacrae disciplinae leges* promulgating the
#: Code. The Code came into force on the first Sunday of Advent, 27 November
#: 1983; the date recorded is the one the document itself carries, which is
#: what `promulgated` means everywhere else in this corpus.
PROMULGATED = "1983-01-25"

AUTHOR = "John Paul II"

TITLE = "Code of Canon Law"
SHORT_TITLE = "Code of Canon Law"

#: The number of canons the Code has, in every edition, by construction --
#: the editions are translations of one numbered text. Asserted rather than
#: reported, for `csdc.EXPECTED_SECTIONS`' reason: this work's whole address
#: space is these numbers, and an edition arriving with 1,747 of them has
#: five addresses naming the wrong canon and nothing else would say so.
EXPECTED_CANONS = 1752

#: Book VI, *Sanctiones in Ecclesia* -- the canons *Pascite Gregem Dei*
#: replaced on 8 December 2021. Used for one manifest sentence and nothing
#: else: what the mirror serves for these numbers is the law in force, so
#: they are ordinary addresses. The range is recorded because a citation to
#: a Book VI canon written before that date may name a different provision,
#: and a reader is owed the warning where the corpus can give it.
REVISED_BOOK_VI = range(1311, 1400)

#: The base every index page and every relative href on one resolves against.
_ARCHIVE_BASE = "https://www.vatican.va/archive/cod-iuris-canonici/"

#: The page naming every edition of the Code and every format it comes in.
#: Not fetched by this scraper -- it is a hand-read starting point, recorded
#: so that "which editions exist" has an address and not a memory.
EDITIONS_INDEX_URL = "https://www.vatican.va/archive/cdc/index.htm"


@dataclass(frozen=True)
class Edition:
    """One edition of the Code, as data.

    `index_code` is what the SOURCE spells the language in its index URL, and
    it is not the corpus tag: German is `ge`, Spanish `sp`, Latin `la`. The
    same rule `csdc.EDITIONS` and `VATII_LANG_FROM_URL` follow -- a language
    key is what the source calls the language, never what we call it.

    `marker` names the form the edition opens a canon with:

        "can"        `Can. 7 -- ...`, the delimiter varying by edition and
                     sometimes absent (English prints none at all)
        "bare-number"
                     `<b>8</b>  ...` and, as often, `196 § 1. ...` with no
                     emphasis at all. Spanish alone: it prints the canon
                     NUMBER and no word, so the ascending run is the whole
                     of the signal and the bold only a corroboration.
    """

    lang: str
    index_code: str | None
    family: str
    marker: str
    #: The word the edition prints before a canon number, folded for
    #: matching. Empty where the edition prints no word at all.
    canon_word: tuple[str, ...] = ()
    #: Only for `single`: the page's own address, since it has no index.
    page_url: str | None = None


EDITIONS: dict[str, Edition] = {
    "en": Edition("en", "en", "chunked", "can", ("CAN",)),
    # THE SPANISH EDITION IS TWO HOUSE STYLES IN ONE. Books I-V print a
    # bare number (`196 § 1. La privación...`); Books VI and VII, which the
    # mirror re-set later, print `Can. 1311 - § 1. La Iglesia...` like every
    # other edition. So it declares BOTH -- `bare-number` means "a marked
    # canon if there is one, otherwise the ascending run" -- and reading only
    # the bare form stopped it at canon 1310, 442 canons short.
    "es": Edition("es", "sp", "chunked", "bare-number", ("CAN",)),
    "de": Edition("de", "ge", "chunked", "can", ("CAN",)),
    "fr": Edition("fr", "fr", "chunked", "can", ("CAN",)),
    "it": Edition("it", "it", "chunked", "can", ("CAN",)),
    "la": Edition("la", "la", "book", "can", ("CAN",)),
    "ru": Edition(
        "ru",
        None,
        "single",
        "can",
        ("КАН",),
        page_url=_ARCHIVE_BASE + "russian/codex-iuris-canonici_ru.html",
    ),
}

#: What each edition calls itself, read off the title line its own pages
#: print above the text -- the `<p align="center">` that links back to the
#: index, which every page of every edition carries. Transcribed rather than
#: read at parse time because it is furniture the walk drops, and because
#: `<title>` cannot be used: the Russian page's is `Codice di Diritto
#: Canonico`, the Italian one, kept from the page it was exported from.
TITLES: dict[str, str] = {
    "en": "Code of Canon Law",
    "es": "Código de Derecho Canónico",
    "de": "Codex des kanonischen Rechtes",
    "fr": "Code de droit canonique",
    "it": "Codice di Diritto Canonico",
    "la": "Codex Iuris Canonici",
    "ru": "Кодекс канонического права",
}

#: Editions vatican.va publishes in a format nothing in this pipeline reads.
#: FETCHED ALL THE SAME, into `raw/`, so that the day one of them is parsed
#: is a re-parse (`docs/link-surface.md`). Each is recorded in every
#: manifest's `translations` so an absent language column is never bare
#: absence.
UNPARSED_FORMATS: dict[str, tuple[str, str]] = {
    "pt": (
        _ARCHIVE_BASE + "portuguese/codex-iuris-canonici_po.pdf",
        "vatican.va publishes this edition as PDF only (488 pages, text layer)",
    ),
    "be": (
        _ARCHIVE_BASE + "belarusian/codex-iuris-canonici_belarusian.pdf",
        "vatican.va publishes this edition as PDF only",
    ),
}

#: The replacement Book VI, per edition, published as PDF only. Fetched for
#: the same reason and parsed by nothing -- the HTML pages already carry
#: this book's text in force, so these fill no hole. Spanish prints no such
#: link on its index and so has no entry.
BOOK_VI_PDFS: dict[str, str] = {
    "en": _ARCHIVE_BASE + "eng/documents/cic_lib6_en.pdf",
    "la": _ARCHIVE_BASE + "latin/documents/cic_liberVI_la.pdf",
    "it": _ARCHIVE_BASE + "ita/documents/cic_libroVI_it.pdf",
    "de": _ARCHIVE_BASE + "deu/documents/cic_libro6_ge.pdf",
    "fr": _ARCHIVE_BASE + "fra/documents/cic_libro6_fr.pdf",
}


# --------------------------------------------------------------------------
# The Code's own division scheme
# --------------------------------------------------------------------------

#: The six divisions of the Code, outermost first. THIS IS A FACT ABOUT THE
#: WORK, not about any language: the Code is divided into books, a book into
#: parts, a part into sections, a section into titles, a title into chapters
#: and a chapter into articles, and every edition follows it because they are
#: translations of one text.
#:
#: It is declared here rather than added to `vatican_docs.DIVISIONS` because
#: that table serves 1,400 documents in 22 languages and knows nothing of
#: `book` or `title`; widening it for one work is the change CLAUDE.md says
#: to measure over all of them first, and this vocabulary would not survive
#: the measurement -- `TITLE` opening a centred line means something else
#: entirely in an encyclical.
DIVISION_ORDER = ("book", "part", "section", "title", "chapter", "article")

#: kind -> the nouns each edition prints for it, folded at match time. Read
#: off the editions' own pages, never translated: Spanish prints `TÍTULO`
#: and German `TITEL` for what Latin calls `TITULUS`, and Russian `ТИТУЛ`.
#:
#: `article` is the one that varies in shape rather than spelling -- Latin
#: and English print `Art. 1`, Italian `Articolo 1`, German `Artikel 1` --
#: so several spellings per kind is the normal case and not an exception.
DIVISION_NOUNS: dict[str, dict[str, tuple[str, ...]]] = {
    "en": {
        "book": ("BOOK",),
        "part": ("PART",),
        "section": ("SECTION",),
        "title": ("TITLE",),
        "chapter": ("CHAPTER",),
        "article": ("ART.", "ART", "ARTICLE"),
    },
    "la": {
        "book": ("LIBER",),
        "part": ("PARS",),
        "section": ("SECTIO",),
        "title": ("TITULUS",),
        "chapter": ("CAPUT",),
        "article": ("ART.", "ART", "ARTICULUS"),
    },
    "it": {
        "book": ("LIBRO",),
        "part": ("PARTE",),
        "section": ("SEZIONE",),
        "title": ("TITOLO",),
        "chapter": ("CAPITOLO",),
        "article": ("ARTICOLO", "ART.", "ART"),
    },
    "es": {
        "book": ("LIBRO",),
        "part": ("PARTE",),
        "section": ("SECCIÓN", "SECCION"),
        "title": ("TÍTULO", "TITULO"),
        "chapter": ("CAPÍTULO", "CAPITULO"),
        "article": ("ART.", "ART", "ARTÍCULO", "ARTICULO"),
    },
    "de": {
        "book": ("BUCH",),
        "part": ("TEIL",),
        # SEKTION, not the ABSCHNITT a dictionary gives for a section: the
        # German edition prints `SEKTION I / DIE HÖCHSTE AUTORITÄT DER KIRCHE`
        # over canon 330. Guessed the other way, the edition came out with
        # five division levels where every other edition has six, and all
        # eight of its sections were read as part of the title below them.
        "section": ("SEKTION",),
        "title": ("TITEL",),
        "chapter": ("KAPITEL",),
        "article": ("ARTIKEL", "ART.", "ART"),
    },
    "fr": {
        "book": ("LIVRE",),
        "part": ("PARTIE",),
        "section": ("SECTION",),
        "title": ("TITRE",),
        "chapter": ("CHAPITRE",),
        "article": ("ART.", "ART", "ARTICLE"),
    },
    "ru": {
        "book": ("КНИГА",),
        "part": ("ЧАСТЬ",),
        "section": ("РАЗДЕЛ",),
        "title": ("ТИТУЛ",),
        "chapter": ("ГЛАВА",),
        "article": ("СТ.", "СТАТЬЯ"),
    },
}


#: Ordinal words an edition may print INSTEAD of a numeral, before the noun.
#: French alone, and only for its parts: it sets `PREMIERE PARTIE LES
#: FIDÈLES DU CHRIST` where every other edition sets `PART I`. Both the
#: accented and unaccented spellings are here because the mirror uses both,
#: sometimes on facing pages.
#:
#: Listing `PREMIERE PARTIE` as a NOUN was the first attempt and it is worth
#: knowing why it failed: the pattern then wanted a numeral after the noun,
#: and found one in the title -- `PREMIÈRE PARTIE LES JUGEMENTS` was read as
#: part `L`, the Roman fifty, with `ES JUGEMENTS` for a title.
DIVISION_ORDINALS: dict[str, tuple[str, ...]] = {
    "fr": (
        "PREMIERE",
        "PREMIÈRE",
        "DEUXIEME",
        "DEUXIÈME",
        "TROISIEME",
        "TROISIÈME",
        "QUATRIEME",
        "QUATRIÈME",
        "CINQUIEME",
        "CINQUIÈME",
        "SIXIEME",
        "SIXIÈME",
        "SEPTIEME",
        "SEPTIÈME",
    ),
}


# --------------------------------------------------------------------------
# Discovery: the index page is the crawl plan
# --------------------------------------------------------------------------

_LINK_RE = re.compile(
    r'<a\s[^>]*?href="([^"]+)"[^>]*>(.*?)</a>', re.IGNORECASE | re.DOTALL
)
_TAG_RE = re.compile(r"<[^>]+>")


def _plain(inner_html: str) -> str:
    """Markup to plain text, entities decoded, whitespace collapsed.

    Deliberately NOT `vd.strip_tags`: this reads index rows and page
    furniture rather than stored prose, where the round-trip invariant that
    function protects has nothing to say. Every tag becomes a space here,
    which is the older and safer rule for text nobody stores."""
    return re.sub(r"\s+", " ", ihtml.unescape(_TAG_RE.sub(" ", inner_html))).strip()


def content_region(html: str) -> str:
    """The page's own content, past the archive template's chrome.

    Every page of every edition -- index and text alike -- wraps its content
    in `<div id="corpo">`, which is the archive mirror's whole template.
    `vd.find_content_start_old_shell` looks for the modern document shell's
    markers and finds none of them here."""
    i = html.find('id="corpo"')
    return html[i:] if i >= 0 else html


@dataclass(frozen=True)
class IndexEntry:
    """One row of an edition's index: where it points, and what it reads."""

    url: str
    fragment: str
    text: str


def index_entries(html: str) -> list[IndexEntry]:
    """Every link on an index page that points into the Code itself.

    The filter is the DIRECTORY, not the file name: an index also links the
    motu proprios that have amended the Code, the constitution promulgating
    it and vatican.va's own furniture, and those live elsewhere on the host.
    Everything under `cod-iuris-canonici/` is this work; nothing else is."""
    out: list[IndexEntry] = []
    for m in _LINK_RE.finditer(content_region(html)):
        url = urljoin(_ARCHIVE_BASE, m.group(1))
        if "/cod-iuris-canonici/" not in url:
            continue
        if "/documents/" not in url:
            continue  # the index links its own siblings; those are not text.
        base, _, fragment = url.partition("#")
        out.append(IndexEntry(base, fragment, _plain(m.group(2))))
    return out


def index_url_for(edition: Edition) -> str:
    return f"{_ARCHIVE_BASE}cic_index_{edition.index_code}.html"


def cache_name_for_index(edition: Edition) -> str:
    return f"{edition.lang}/index.html"


def cache_name_for_page(edition: Edition, url: str) -> str:
    """`{lang}/{basename}` -- the source's own file name, kept.

    The basenames already carry the language (`cic_libroI_7-22_it.html`), so
    the directory is redundant against them and kept anyway: it is what makes
    one edition's capture a directory somebody can look at, and it is the
    only thing that would keep two editions apart if the mirror ever stopped
    spelling the language into the name."""
    return f"{edition.lang}/{url.rsplit('/', 1)[-1]}"


# --------------------------------------------------------------------------
# Fetching
# --------------------------------------------------------------------------


def make_fetcher(offline: bool = False, refresh: bool = False) -> Fetcher:
    """vatican.va's conduct, from `vatican_docs.VATICAN_POLICY` -- the 2.0s
    floor is that host's `robots.txt` speaking (pipeline/docs/corpus.md) and
    belongs to the host, not to whichever scraper here is talking to it."""
    return Fetcher(
        RAW_ROOT,
        vd.VATICAN_POLICY,
        decode=vd.decode_page,
        offline=offline,
        refresh=refresh,
    )


@dataclass
class CrawlResult:
    lang: str
    pages: list[str] = field(default_factory=list)
    entries: list[IndexEntry] = field(default_factory=list)
    failures: list[str] = field(default_factory=list)


def crawl_edition(
    fetcher: Fetcher, edition: Edition, *, pdfs: bool = True
) -> CrawlResult:
    """Fetch one edition whole: its index, every page the index links, and
    the PDFs beside it that nothing here parses yet.

    Returns the page cache names in index order. A page that fails is
    reported and the crawl continues -- one dead URL out of 253 must not cost
    the other 252, which is `try_fetch`'s whole reason for existing."""
    res = CrawlResult(lang=edition.lang)

    if edition.family == "single":
        name = cache_name_for_page(edition, edition.page_url)
        _, err = fetcher.fetch_text(edition.page_url, name)
        if err:
            res.failures.append(err)
        else:
            res.pages.append(name)
    else:
        url = index_url_for(edition)
        html, err = fetcher.fetch_text(url, cache_name_for_index(edition))
        if err:
            res.failures.append(err)
            return res
        res.entries = index_entries(html)
        seen: set[str] = set()
        for entry in res.entries:
            if entry.url in seen or entry.url.endswith(".pdf"):
                continue
            seen.add(entry.url)
            name = cache_name_for_page(edition, entry.url)
            _, page_err = fetcher.fetch_text(entry.url, name)
            if page_err:
                res.failures.append(page_err)
            else:
                res.pages.append(name)

    if pdfs and edition.lang in BOOK_VI_PDFS:
        err = fetch_pdf(BOOK_VI_PDFS[edition.lang], edition.lang)
        if err:
            res.failures.append(err)
    return res


def fetch_pdf(url: str, lang: str) -> str | None:
    """One PDF into `raw/`, resumably. Returns an error or None.

    NOT `Fetcher.try_fetch`, and the difference is the file size.
    `download_resumable` exists for exactly these -- a 6 MB body over an edge
    that drops long transfers, where every plain retry starts from zero. The
    Portuguese Code is 6.2 MB and the crawl that first met it died on the
    French Book VI at 2.3 MB, so this is not a hypothetical."""
    dest = RAW_ROOT / lang / url.rsplit("/", 1)[-1]
    if dest.exists():
        return None
    _bytes, err = common.download_resumable(url, dest, policy=vd.VATICAN_POLICY)
    if err is None:
        common.record_capture(dest)
    return err


def fetch_unparsed_formats() -> list[str]:
    """The Portuguese and Belarusian PDFs: acquired, not published.

    `--fetch-only` is what lets a crawl be an acquisition rather than a
    publishing decision (`pipeline/CLAUDE.md`), and these two are the case
    it exists for -- the Portuguese edition is the one whose supposed absence
    kept this whole work out of scope."""
    return [
        err
        for lang, (url, _why) in UNPARSED_FORMATS.items()
        if (err := fetch_pdf(url, lang))
    ]


# --------------------------------------------------------------------------
# Blocks: what a page of the archive template is made of
# --------------------------------------------------------------------------

#: `<p>`, `<blockquote>` and `<center>`, WITH the outer attributes, which is
#: the one reason this is not `vd.raw_blocks`: `align="center"` is this page
#: family's entire heading signal and that function throws the attributes
#: away. The `<p(?=[\s>])` guard is kept verbatim from it, and for its
#: reason -- a naive `<p[^>]*>` matches `<path>`.
_PAGE_BLOCK_RE = re.compile(
    r"<p(?=[\s>])([^>]*)>((?:(?!</p>).)*?)</p>"
    r"|<blockquote([^>]*)>((?:(?!</blockquote>).)*?)</blockquote>"
    r"|<center([^>]*)>((?:(?!</center>).)*?)</center>",
    re.DOTALL | re.IGNORECASE,
)
#: `<p>` inside a `<blockquote>`, which the block regex above swallows whole.
_INNER_P_RE = re.compile(
    r"<p(?=[\s>])[^>]*>((?:(?!</p>).)*?)</p>", re.DOTALL | re.IGNORECASE
)
_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
#: `&nbsp;` in the three spellings this mirror uses, plus the character it
#: decodes to. Turned into an ordinary space BEFORE anything reads a block.
#:
#: NOT COSMETIC. `vd.strip_leading_text_html` walks a marker's characters
#: across tag boundaries and skips whitespace to do it -- but an entity is
#: not whitespace until something decodes it, so a cell that opens
#: `&nbsp;&nbsp;&nbsp; <b>Can. 1311 -</b>` fails on its first character and
#: the function returns the block untouched, marker and all. It costs
#: nothing downstream: `escape_text_run` already decodes these to U+00A0 and
#: `narrow_html` already collapses that to a space, so the stored text is
#: byte-identical either way.
_NBSP_RE = re.compile(r"&nbsp;|&#160;|&#[xX]0*[aA]0;|\xa0")
#: A canon number the source emboldened only part of: the Spanish edition
#: prints canon 371 as `<b>37</b>1`, which is not a number this scraper can
#: read and is not a word a reader can see -- the page renders `371` in bold
#: either way. Broken markup is the parser's business (pipeline/CLAUDE.md),
#: so it is repaired here, in balanced form, rather than filed as a
#: correction to what the source SAID.
_SPLIT_BOLD_NUM_RE = re.compile(r"<b([^>]*)>(\d+)</b>(\d+)", re.IGNORECASE)
_IMG_RE = re.compile(r"<img\b", re.IGNORECASE)
#: The three hrefs the template puts on every page and no author wrote: the
#: link home, the link back to this edition's own index, and the `[pdf]`
#: link the Russian page carries above its text.
_FURNITURE_HREF_RE = re.compile(
    r'href="[^"]*(?:cic_index_|/index\.htm|\.pdf)', re.IGNORECASE
)
_ANCHOR_RE = re.compile(r"<a\s[^>]*>.*?</a>", re.DOTALL | re.IGNORECASE)
#: The brown the archive template sets its division headings in. A colour
#: rather than a class because these pages have no classes -- the mirror
#: predates them, and `<font color="#663300">` is the only thing it says
#: about a heading that a `<p>` attribute does not.
_HEADING_COLOUR_RE = re.compile(r'color\s*=\s*"?#663300', re.IGNORECASE)


@dataclass
class Block:
    """One block of a page: its inner html, its plain text, and how it sits."""

    html: str
    text: str
    centered: bool
    coloured: bool
    #: The edition marked this block as amended. Read and removed once, in
    #: `page_blocks`, so that everything downstream sees the block as the
    #: page prints it minus an editorial mark -- a heading whose title ends
    #: `... ANTE EL OBISPO n` is shouted again, and six Spanish articles
    #: come back into the outline.
    amended: bool
    #: This block is the apparatus's own legend. Decided BEFORE the mark is
    #: stripped and carried, because the legend's subject IS the mark: `( n :
    #: indicates that the text corresponds to a new version)` reads `( :
    #: indicates ...)` once the `n` has gone, and the boundary between the
    #: Code and the apparatus stopped being findable at all.
    legend: bool
    source: str

    @property
    def is_heading_style(self) -> bool:
        """CENTRED OR IN THE MIRROR'S BROWN, and it takes both.

        Neither signal is enough alone and the editions disagree about
        which they use. `<p align="center">` carries every division of the
        French, German, Spanish, Italian and Russian editions and most of
        the Latin -- but English prints `BOOK I. GENERAL NORMS` flush left,
        in colour, and 45 pages of it lost their book headings to a
        centring test. The brown `#663300` catches those and the Latin
        `CAPUT` rows the centring already had; on its own it would catch
        nothing in the three editions that never use it.

        Safe against the colour appearing INSIDE a canon because a canon is
        recognised first: the Latin amendment mark is a brown superscript
        sitting in the middle of canon 111."""
        return self.centered or self.coloured


def _blank(text: str) -> bool:
    return not text.replace(" ", " ").strip()


_ENTITY_RE = re.compile(
    r"&(?:#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{1,31});"
)


#: What an edition may leave between a label and the name after it, or
#: between a canon's number and its text: an em or en dash, a hyphen, a full
#: stop, a semicolon, a colon.
_STRANDED_PUNCT = " .:;-—–\xa0"


def drop_leading_punct(html: str) -> str:
    """Whitespace and stray punctuation off the front of `html`, reading
    past tags to reach it.

    THE DELIMITER AFTER A LABEL DOES NOT ALWAYS SIT BESIDE IT. The English
    edition sets one title inside its own anchor and leaves the delimiter
    outside -- `<a name="TITLE_I">TITLE I</a>:` -- so once the label is gone
    the colon is behind a closing tag, where a plain `lstrip` cannot see it.
    Left there it becomes the title, and canon 1166 opened under `TITLE I :
    SACRAMENTALS`.

    Tags are copied through rather than dropped, because the emphasis the
    source put on the NAME is on the same tags as the punctuation before it;
    `vd._EMPTY_TAG_PAIR_RE` clears whichever of them end up holding
    nothing."""
    out: list[str] = []
    i = 0
    while i < len(html):
        if html[i] == "<":
            j = html.find(">", i)
            if j == -1:
                break
            out.append(html[i : j + 1])
            i = j + 1
            continue
        chunk, step = html[i], 1
        if html[i] == "&" and (m := _ENTITY_RE.match(html, i)):
            chunk, step = ihtml.unescape(m.group(0)), m.end() - i
        if chunk.strip(_STRANDED_PUNCT + "\t\n\r"):
            break
        i += step
    return "".join(out) + html[i:]


def strip_leading_text(html: str, prefix: str) -> str:
    """Drop `prefix` off the front of `html`, reading entities as characters.

    `vd.strip_leading_text_html` does the same walk and is the model for
    this one, down to returning `html` untouched when the visible text does
    not in fact start with `prefix`. What it cannot do is read an entity: it
    compares raw characters, so the Spanish edition's `T&Iacute;TULO I`
    fails on the ampersand and the label stays in the title -- which is how
    235 Spanish divisions came to read `TÍTULO I TÍTULO I DE LAS LEYES
    ECLESIÁSTICAS`.

    THE FIX BELONGS HERE AND NOT IN A BLANKET UNESCAPE OF THE PAGE. Decoding
    every entity before parsing would turn a source's `&lt;` into a real
    less-than sign and hand the block scanner a tag that the page does not
    have; decoding them one at a time, while looking for a prefix that is
    already known, cannot do that."""
    want = "".join(prefix.split()).upper()
    out: list[str] = []
    seen, i = 0, 0
    while i < len(html) and seen < len(want):
        if html[i] == "<":
            j = html.find(">", i)
            if j == -1:
                return html
            out.append(html[i : j + 1])
            i = j + 1
            continue
        chunk, step = html[i], 1
        if html[i] == "&" and (m := _ENTITY_RE.match(html, i)):
            chunk, step = ihtml.unescape(m.group(0)), m.end() - i
        for ch in chunk:
            if ch.isspace():
                continue
            if seen >= len(want) or ch.upper() != want[seen]:
                return html
            seen += 1
        i += step
    if seen < len(want):
        return html
    kept = "".join(out) + drop_leading_punct(html[i:])
    while (collapsed := vd._EMPTY_TAG_PAIR_RE.sub("", kept)) != kept:
        kept = collapsed
    return kept


def is_furniture(inner_html: str, text: str) -> bool:
    """Is this block the archive template rather than the Code?

    Three shapes, and the third is the one worth stating: a block is
    furniture when its links are the template's AND there is nothing OUTSIDE
    them. `LIBER VI` is a real heading on a page that also links the
    replacement PDF, so a bare href test would delete a division; what makes
    the title line furniture is that removing its anchor leaves an empty
    block behind."""
    if _blank(text):
        return True
    if _IMG_RE.search(inner_html):
        return True
    if _FURNITURE_HREF_RE.search(inner_html):
        return _blank(_plain(_ANCHOR_RE.sub("", inner_html)))
    return False


#: A table cell with no cell inside it. The negative lookahead is on `</?td`
#: rather than `</td`, so a cell holding a nested table does not match and
#: the scan walks into it -- the archive template wraps every page in one
#: such cell, and matching it would swallow the page.
_LEAF_CELL_RE = re.compile(
    r"<td\b[^>]*>((?:(?!</?td\b).)*?)</td>", re.DOTALL | re.IGNORECASE
)


_P_OPEN_RE = re.compile(r"<p\b[^>]*>", re.IGNORECASE)
_P_CLOSE_RE = re.compile(r"</p\s*>", re.IGNORECASE)
_P_ANY_RE = re.compile(r"</?p\b[^>]*>", re.IGNORECASE)


def unwrap_word_cells(html: str) -> str:
    """Repair a Word export's table cells into well-formed paragraphs.

    THE LATIN BOOK VI PAGE IS NOT LIKE THE OTHER PAGES OF ITS OWN EDITION.
    Where the rest of the mirror writes `<p>Can. 1311 ...</p>`, this one is
    a `MsoTableGrid` table with one canon per `<td>`, written three ways at
    once: text loose in the cell before any paragraph, closed paragraphs
    after it, and a trailing `<p>&nbsp;` that is never closed. Read as it
    stands, a canon's opening words are in no paragraph and so in no block,
    and the unclosed tag makes the block scan match a span that starts in
    one cell and ends in the next -- which is how canon 1312 disappeared
    while 1311 and 1313 came through, eleven times over.

    REPAIRING MARKUP IS THE PARSER'S BUSINESS AND NOT THE CORRECTIONS
    LAYER'S (pipeline/CLAUDE.md): nothing a reader reads changes here, only
    whether the text can be found at all.

    THE GUARD IS WHAT MAKES THIS SAFE TO RUN OVER EVERY PAGE. A cell is
    rewritten only where it is actually broken -- its `<p>` and `</p>` do
    not balance, or it has words before its first paragraph. The archive
    template's own content cell is a leaf cell too, holding every `<p
    align="center">` heading on the page, and rewriting THAT would flatten
    the attribute this scraper reads its whole outline from."""

    def rewrite(m: re.Match) -> str:
        inner = m.group(1)
        if _blank(_plain(inner)):
            return m.group(0)
        opens, closes = len(_P_OPEN_RE.findall(inner)), len(_P_CLOSE_RE.findall(inner))
        first = _P_OPEN_RE.search(inner)
        loose = _blank(_plain(inner[: first.start()])) if first else True
        if opens == closes and loose:
            return m.group(0)
        pieces = [p for p in _P_ANY_RE.split(inner) if not _blank(_plain(p))]
        return "".join(f"<p>{p}</p>" for p in pieces) or m.group(0)

    return _LEAF_CELL_RE.sub(rewrite, html)


def page_blocks(html: str, source: str) -> list[Block]:
    """A page's content blocks, furniture dropped, blockquotes expanded.

    A BLOCKQUOTE IS EXPANDED INTO THE PARAGRAPHS INSIDE IT rather than stored
    as one block, and the editions are what decide that. Latin and English
    print a canon's enumerated items (`1°`, `2°`, …) as `<p>`s inside a
    `<blockquote>`; German, Spanish, French and Russian print the same items
    as ordinary top-level `<p>`s. Kept whole, the indented editions would
    store an enumeration as a single run -- `narrow_html` drops `<p>`, so the
    items would be flush against each other -- and the six editions of one
    canon would disagree about how many blocks it has, which is the
    comparison this corpus judges an edition by."""
    out: list[Block] = []
    for m in _PAGE_BLOCK_RE.finditer(unwrap_word_cells(content_region(html))):
        if m.group(2) is not None:
            attrs, inner, quote = m.group(1), m.group(2), False
        elif m.group(4) is not None:
            attrs, inner, quote = m.group(3), m.group(4), True
        else:
            attrs, inner, quote = m.group(5), m.group(6), False
        centered = 'align="center"' in attrs.lower() or m.group(6) is not None
        pieces = (
            _INNER_P_RE.findall(inner)
            if quote and _INNER_P_RE.search(inner)
            else [inner]
        )
        for piece in pieces:
            piece = _SPLIT_BOLD_NUM_RE.sub(r"<b\1>\2\3</b>", _NBSP_RE.sub(" ", piece))
            legend = bool(_LEGEND_RE.match(_plain(piece)))
            piece, amended = strip_amendment_flag(piece)
            # THE BLOCK'S TEXT IS DERIVED THE WAY THE STORED TEXT IS, not by
            # `_plain`. The difference is what an emphasis tag leaves behind:
            # `_plain` turns every tag into a space, which is right for an
            # index row and wrong here, because the French edition prints
            # `C<b>an. 237</b>` with the first letter outside the bold. Read
            # with a space for the tag that is `C an. 237`, which is not a
            # canon marker in any language, and canon 237 was lost.
            text = vd.html_to_text(_narrow(piece))
            if is_furniture(piece, text):
                continue
            # THE AMENDMENT MARK IS BROWN AND SO IS A HEADING, so the
            # colour has to be read past it. The English edition sets its
            # `n` at the head of the amended paragraph, which put every
            # such paragraph -- canon 237 §2 and eleven others -- into the
            # outline as a heading and took the canon that followed it out
            # of the Code with it.
            out.append(
                Block(
                    piece,
                    text,
                    centered,
                    bool(_HEADING_COLOUR_RE.search(piece)),
                    amended,
                    legend,
                    source,
                )
            )
    return out


def order_pages(
    pages: list[tuple[str, list[Block]]], edition: Edition
) -> list[tuple[str, list[Block]]]:
    """An edition's pages in DOCUMENT order, which is not index order.

    The English index lists `PART II. THE HIERARCHICAL CONSTITUTION OF THE
    CHURCH` before the section it opens with, so the page holding canons
    368-430 is linked ahead of the one holding 330-367 -- and read in that
    order the walk saw canon 330 arrive after 430 a hundred times over.

    Sorted by the first canon each page prints, which is document order by
    construction: the Code's canons ascend and no two pages share one. A
    page with no canon at all -- the English edition's INTRODUCTION -- keeps
    the position its index gave it, carried on the last number seen, so
    front matter stays in front."""
    keys: list[int] = []
    seen = 0
    for _name, blocks in pages:
        # THE HIGHEST NUMBER ON THE PAGE, not the lowest, and the Spanish
        # edition is why. Its canon markers are bare numbers and so are the
        # enumerated items inside a canon, so the lowest leading number on
        # a page is routinely `1` -- an item, not a canon -- and every page
        # sorts to the front together. The highest cannot be an item: an
        # item is numbered from 1 within its own paragraph and a page's
        # canons are all larger than that from Book I's second page on.
        found = [n for n in (leading_number(b, edition) for b in blocks) if n]
        seen = max(found) if found else seen
        keys.append(seen)
    return [
        pair
        for _key, pair in sorted(zip(keys, pages, strict=True), key=lambda kp: kp[0])
    ]


# --------------------------------------------------------------------------
# Reading a canon marker
# --------------------------------------------------------------------------

#: `Can. 7`, `Kан. 7`, and the delimiter that may or may not follow it. The
#: WORD is per edition (`Edition.canon_word`) and the rest is not: every
#: edition prints the number as plain digits, and the delimiter is an em
#: dash in Latin and German, a hyphen in Italian and French, and NOTHING AT
#: ALL in English -- `<p>Can. 7 A law is established when it is promulgated.`
#: So the delimiter is optional and the boundary is the digits.
_CANON_TEXT_RE_CACHE: dict[tuple[str, ...], re.Pattern] = {}
#: Spanish prints the canon NUMBER and no word at all -- `<b>8</b>  § 1.
#: Las leyes...` -- and does not always embolden it: canon 196 opens `196 §
#: 1. La privación...` in plain text. So the bold is a hint and the
#: ASCENDING RUN is the signal. That is weaker than every other edition's
#: marker and it is what the source gives; what makes it safe is that the
#: Code's numbers are dense from 1 to 1,752, so a false positive shifts
#: every canon after it and the count check cannot miss it.
#:
#: The enumerated items inside a canon are bare numbers too (`1 a las leyes
#: particulares...`), and they are rejected by the same run: an item is
#: numbered from 1 within its own paragraph and only the next canon's number
#: follows the last one.
#: Read off the block's TEXT rather than its markup, so that neither the
#: emphasis around the number nor anything wrapped into it has to be
#: enumerated: `<b>111</b><font><sup>n</sup></font> § 1.` and `<b>37</b>1 §
#: 1.` and a plain `196 § 1.` are all the same string once the tags are out.
#:
#: The optional bracket is one canon's worth of source apparatus: the
#: Spanish edition hangs a footnote on canon 838 and prints its marker ahead
#: of the number, `[*] 838 § 1.`. The marker is taken with the number
#: because the note it points at is not on the page.
_BARE_NUM_RE = re.compile(r"^\s*(?:\[[^\]]{0,8}\]\s*)?(\d{1,4})\s*\.?(?=\s|$)")
_BOLD_NUM_RE = re.compile(r"^\s*<b[^>]*>\s*(\d{1,4})\s*\.?\s*</b>", re.IGNORECASE)


def canon_text_re(words: tuple[str, ...]) -> re.Pattern:
    if words not in _CANON_TEXT_RE_CACHE:
        alt = "|".join(
            re.escape(w.rstrip(".")) for w in sorted(words, key=len, reverse=True)
        )
        _CANON_TEXT_RE_CACHE[words] = re.compile(
            rf"^\s*(?:{alt})\.?\s*[—–-]?\s*(\d{{1,4}})\b{_NOT_A_CITATION}",
            re.IGNORECASE,
        )
    return _CANON_TEXT_RE_CACHE[words]


#: The `[—–-]?` between the word and the number is for two German canons and
#: nothing else: the source prints `Can. — 193` and `Can. — 605`, with the
#: dash that belongs after the number transposed in front of it. Tolerated
#: rather than corrected because it changes no word a reader reads -- and
#: the citation guard below is what keeps the tolerance from widening into
#: a licence, since a self-citation is lower-case in every edition.
#:
#: A canon's number is followed by its text, never by a comma or a semicolon.
#: A CITATION is: the English page for canons 1400-1500 prints a paragraph
#: that opens mid-sentence -- `Can. 1423, the conference of bishops must
#: establish a tribunal of second instance...` -- which is canon 1439 §2
#: quoting canon 1423 with the words before it lost in the export. Read as a
#: marker it made 1423 a second time and put the rest of the sentence under
#: it. Nothing else separates the two: the source capitalises this one.
_NOT_A_CITATION = r"(?!\s*[,;])"


#: `Can. N` where it is NOT at the head of its block. Two pages need it and
#: for the same reason -- the export's `<p>` boundaries do not line up with
#: the Code's canons. Latin's Book VI runs whole titles together (`§ 2. ...
#: Can. 1312 - § 1. ...`), and Latin's Book VII prints canons 1666 and 1667
#: in one paragraph.
#:
#: MATCHED CASE-SENSITIVELY, and that is half the guard: the Code cites
#: itself constantly (`ad normam can. 1452`, `cann. 617-633`) and every
#: edition writes a citation lower-case and a marker capitalised. The other
#: half is the caller's, which accepts a split only where the number is the
#: one that comes next -- so a canon that happens to cite its own successor
#: is the only shape that could fool this, and none does.
_INLINE_CANON_RE_CACHE: dict[tuple[str, ...], re.Pattern] = {}


def inline_canon_re(words: tuple[str, ...]) -> re.Pattern:
    """CASE-SENSITIVE, and both the cases a marker is ever printed in.

    `Can` and `CAN`, never `can` -- which is the whole guard. Every edition
    writes a marker with a capital and a self-citation without one, so
    matching case-insensitively here turns `ad normam can. 1452` into the
    start of canon 1452 wherever 1452 happens to be the next number."""
    if words not in _INLINE_CANON_RE_CACHE:
        forms = {
            form
            for w in words
            for form in (w.rstrip(".").capitalize(), w.rstrip(".").upper())
        }
        alt = "|".join(re.escape(f) for f in sorted(forms, key=len, reverse=True))
        _INLINE_CANON_RE_CACHE[words] = re.compile(
            rf"\b(?:{alt})\.?\s*(\d{{1,4}})\b{_NOT_A_CITATION}"
        )
    return _INLINE_CANON_RE_CACHE[words]


def split_inline_canon(
    html: str, edition: Edition, want: int
) -> tuple[str, str] | None:
    """`(before, from the marker on)` if canon `want` starts inside `html`.

    Searched in the MARKUP rather than in the text, because that is where
    the split has to land and because these markers are plain characters in
    it -- no edition puts a tag between `Can.` and its digits, which is the
    property `vd._MARKER_INLINE_TAG` exists because footnote markers do not
    have."""
    if edition.marker != "can":
        return None
    for m in inline_canon_re(edition.canon_word).finditer(html):
        if int(m.group(1)) != want:
            continue
        return html[: m.start()], html[m.start() :]
    return None


def match_canon(block: Block, edition: Edition, last: int) -> tuple[int, str] | None:
    """`(canon number, the visible text to strip off the front)`, or None.

    THE SECOND ELEMENT IS TEXT, NOT MARKUP, in both forms, because that is
    what `vd.strip_leading_text_html` takes -- it walks a prefix's
    characters across tag boundaries, so handing it `<b>8</b>` makes it look
    for a literal less-than sign and give up.

    `last` is the number of the canon before this one and is consulted for
    the bare-number form only. A `Can. 748` says what it is; a bold `748`
    could be a year in a citation, and what makes it a canon is that it
    carries on from the canon before it. The tolerance is ASCENDING rather
    than exactly one more: a single marker the edition forgot to embolden
    would otherwise break the chain for the whole rest of the Code, which is
    how the Spanish edition came out with 195 canons of 1,752."""
    marked = (
        canon_text_re(edition.canon_word).match(block.text)
        if edition.canon_word
        else None
    )
    if marked:
        return int(marked.group(1)), marked.group(0)
    if edition.marker != "bare-number":
        return None
    m = _BARE_NUM_RE.match(block.text)
    if not m:
        return None
    n = int(m.group(1))
    if n == last + 1:
        return n, m.group(1)
    # Further ahead than that, only a BOLD number will do -- the shape that
    # steps over a marker the edition forgot to embolden without letting an
    # enumerated item through.
    if _BOLD_NUM_RE.match(block.html) and last < n <= last + _BARE_NUM_LOOKAHEAD:
        return n, m.group(1)
    return None


#: How far ahead of the last canon a bold bare number may be and still be
#: read as the next canon. The Code's numbers only ever move forward by one,
#: so this is a tolerance for markers the source dropped, not a search.
_BARE_NUM_LOOKAHEAD = 8


def loose_canon_number(block: Block, edition: Edition) -> int | None:
    """The canon number a block opens with, where a wrong answer is costly.

    Used by `split_apparatus`, which decides where an edition's text STOPS,
    so it takes the strict reading: for the bare-number edition only a BOLD
    number counts, because an unbold `196` at the head of a paragraph is a
    canon or an enumerated item and nothing without the run can tell
    which."""
    m = (
        canon_text_re(edition.canon_word).match(block.text)
        if edition.canon_word
        else None
    )
    if m is None and edition.marker == "bare-number":
        m = _BOLD_NUM_RE.match(block.html)
    return int(m.group(1)) if m else None


def leading_number(block: Block, edition: Edition) -> int | None:
    """The number a block opens with, where a wrong answer is cheap.

    Used by `order_pages`, which only needs each page's largest -- so it
    takes the generous reading and lets an enumerated item through, since
    an item can never be the largest number on a page."""
    m = (
        canon_text_re(edition.canon_word).match(block.text)
        if edition.canon_word
        else None
    )
    if m is None and edition.marker == "bare-number":
        m = _BARE_NUM_RE.match(block.text)
    return int(m.group(1)) if m else None


# --------------------------------------------------------------------------
# The Latin edition's amendment apparatus
# --------------------------------------------------------------------------

#: The rule the apparatus separates its units with, and the two bracketed
#: shapes that introduce one: `[ Litterae Apostolicae ... ]` naming the act,
#: and the legend `( n : Indica che il testo corrisponde alla nuova
#: versione ...)` explaining the superscript.
_RULE_RE = re.compile(r"^[\s*·••–—_-]+$")
_BRACKETED_RE = re.compile(r"^\s*[\[(].*[\])]\s*$", re.DOTALL)
#: The editorial `n` marking an amended canon, with whatever emphasis the
#: export wrapped it in. Stripped because it is a mark on the number rather
#: than a word of the law -- left in, canon 111 opened `n : — §1. Ecclesiae
#: latinae ...`.
#:
#: THE TWO EDITIONS THAT PRINT IT DO NOT PRINT IT THE SAME WAY, and the
#: difference is not only markup. Latin sets a brown superscript against the
#: canon's own NUMBER (`<b>Can. 579</b><font color="#663300"><b><i><sup>n
#: </sup></i></b></font>`); English sets a brown italic bold `n` at the head
#: of the amended PARAGRAPH, which may be a §2 halfway down the canon
#: (`<i><b><font color="#663300">n </font></b></i>&#xa7;2. An interdiocesan
#: seminary...`). So the pattern anchors on emphasis rather than on `<sup>`,
#: and it has to be applied to continuation blocks and not only to a canon's
#: first one.
#:
#: What keeps it from eating a word is the requirement that the `n` be the
#: WHOLE text of an emphasis run that opens the block. A canon beginning
#: with an italicised word longer than one letter does not match, and no
#: canon of the Code begins with an italicised `n`.
_EMPH = r"(?:i|b|em|strong|sup|font)"
_AMEND_FLAG_RE = re.compile(
    rf"(?:<{_EMPH}\b[^>]*>\s*)+n\s*(?:</{_EMPH}\s*>\s*)+", re.IGNORECASE
)


def split_apparatus(
    blocks: list[Block], edition: Edition
) -> tuple[list[Block], list[Block]]:
    """One page's blocks split into the Code and the apparatus after it.

    CUT AT THE RULE THE SOURCE DRAWS, CONFIRMED BY READING THE NUMBERS.
    Both editions that print an apparatus separate it from the Code with a
    typographic rule -- `* * *` in Latin, a row of underscores in English --
    and after that rule they republish canons the page has already printed
    and introduce none. So the boundary is the first rule with a REPEAT
    after it and no canon that is new after it.

    Neither half is enough alone. The rule alone would cut at any ornament;
    the repeat alone cut 61 English canons out of the Code, because the
    Code cross-references itself in prose that sometimes opens a block --
    `Can. 1423, the conference of bishops must establish...`.

    THE NUMBERS ARE COUNTED ANYWHERE IN A BLOCK, not only at its head, and
    that is what made the English pages work. Their apparatus republishes
    canon 265, which the body prints in the middle of canon 264's paragraph
    -- so a scan that only reads block openings judged 265 to be new,
    concluded the region was not the apparatus, and let eight superseded
    wordings into the Code.

    From the rule the cut walks BACK over the blocks that can only be
    apparatus -- further rules, the bracketed lines naming an act, the
    legend -- and stops at the first block that is prose. Walking back over
    "not a canon" instead would take a canon's own §§ with it, since a `§ 3.`
    is not a canon marker either."""
    if edition.family == "single" or not edition.canon_word:
        return blocks, []
    start = _apparatus_start(blocks, edition)
    if start is None:
        return blocks, []
    while start > 0:
        text = blocks[start - 1].text
        if _RULE_RE.match(text) or _BRACKETED_RE.match(text):
            start -= 1
            continue
        break
    return blocks[:start], blocks[start:]


def _apparatus_start(blocks: list[Block], edition: Edition) -> int | None:
    """The block the apparatus opens at, by its legend or by its rule."""
    for i, block in enumerate(blocks):
        if block.legend:
            return i
    # NO LEGEND: fall back to the rule the source draws, confirmed by the
    # numbers. Kept because the legend is a sentence and a sentence can be
    # reworded, while the structure below is what the region IS.
    pattern = inline_canon_re(edition.canon_word)
    per_block = [{int(n) for n in pattern.findall(b.html)} for b in blocks]
    for i, block in enumerate(blocks):
        if not _RULE_RE.match(block.text):
            continue
        before: set[int] = set().union(*per_block[:i]) if i else set()
        after: set[int] = (
            set().union(*per_block[i + 1 :]) if i + 1 < len(blocks) else set()
        )
        if (after & before) and not (after - before):
            return i
    return None


@dataclass
class Amendment:
    """One unit of the apparatus: the act, and the wording it replaced."""

    canon: int | None
    title: str
    blocks: list[str] = field(default_factory=list)
    #: This unit is the apparatus's legend rather than a superseded wording.
    #: Carried from the block for `Block.legend`'s reason: by the time the
    #: title is a string, the `n` the sentence is about has been stripped out
    #: of it.
    is_legend: bool = False


def read_apparatus(blocks: list[Block], edition: Edition) -> list[Amendment]:
    """The apparatus's units, split at its own `* * *` rules.

    A unit's CANON is the first canon marker in it, and a unit with none is
    kept with `canon: None` -- the legend is one of those, and so is the
    opening `[Cf: ...]` reference. Neither is dropped: the apparatus is the
    edition speaking about its own text, and an editorial note is exactly as
    much of that as a superseded paragraph is."""
    units: list[Amendment] = []
    current: Amendment | None = None
    pending: list[str] = []
    preamble: list[str] = []
    inherited = ""
    high = 0
    for block in blocks:
        if _RULE_RE.match(block.text):
            current, pending = None, []
            continue
        hit = _apparatus_canon(block, edition, high)
        if hit:
            n, marker = hit
            high = max(high, n)
            title = " ".join(pending) or inherited
            inherited = title
            pending = []
            current = Amendment(n, title)
            units.append(current)
            # The delimiter after the number survives the marker here for
            # the same reason it does in the body: it is an entity until
            # `narrow_html` decodes it. See `append`.
            rest = _LEAD_PUNCT_RE.sub(
                "", _narrow(strip_leading_text(block.html, marker))
            )
            if rest:
                current.blocks.append(rest)
            continue
        text = vd.html_to_text(_narrow(block.html))
        if block.legend:
            preamble.append(text)
            continue
        if current is not None and not _BRACKETED_RE.match(text):
            # Not a new heading: a `§ 2.` continuing the superseded canon
            # above it, which is how Latin prints canon 295's second
            # paragraph and how the 2026 rescript on canon 699 arrives.
            narrowed = _narrow(block.html)
            if narrowed:
                current.blocks.append(narrowed)
            continue
        pending.append(text)
        current = None
    # Kept apart, not joined: the legend is dropped into the manifest by
    # `attach_amendments` and anything else in the preamble is content. Run
    # together, the Latin edition's reference to *Communis vita* began with
    # the legend's opening bracket and went into the manifest with it.
    for legend in preamble:
        units.append(Amendment(None, legend, is_legend=True))
    if pending:
        units.append(Amendment(None, " ".join(pending)))
    return [u for u in units if u.title or u.blocks]


#: The apparatus's own legend, which both editions print in the same shape:
#: `( n : indicates that the text corresponds to a new version...)`. Held
#: apart from the titles because it explains the marks on the whole page
#: rather than introducing any one superseded canon.
_LEGEND_RE = re.compile(r"^[\[(]\s*n\s*[:.]?\s+\S", re.IGNORECASE)


def _apparatus_canon(
    block: Block, edition: Edition, current: int
) -> tuple[int, str] | None:
    """The canon a block of the apparatus republishes, or None.

    THE APPARATUS FOLLOWS ITS EDITION'S OWN MARKER, and the Spanish edition
    is why this is not just `canon_text_re`: it republishes a superseded
    canon as a bare number, `111 § 1. El hijo cuyos padres...`, exactly as
    it prints the Code. Read with the marked form only, seventeen superseded
    wordings were mistaken for headings and stored as titles.

    The ascending run that disambiguates a bare number in the body works
    here too, one region smaller: an apparatus lists canons in order, so a
    number below the one already open is an enumerated item inside it -- `1
    quien obtenga una licencia...` under canon 112 -- and not a new one."""
    m = canon_text_re(edition.canon_word).match(block.text)
    if m:
        return int(m.group(1)), m.group(0)
    if edition.marker != "bare-number":
        return None
    m = _BARE_NUM_RE.match(block.text)
    if not m:
        return None
    n = int(m.group(1))
    if not current < n <= EXPECTED_CANONS:
        return None
    # A CANON OPENS WITH `§` OR A CAPITAL; AN ITEM DOES NOT. Canon 868's
    # superseded §1 lists `2 que haya esperanza fundada de que el niño va a
    # ser educado...`, and with nothing but the ascending rule that `2`
    # became canon 2 -- the first canon of the apparatus on its page, so
    # nothing had been seen to be above it.
    tail = block.text[m.end() :].lstrip()
    return (n, m.group(1)) if tail[:1] == "§" or tail[:1].isupper() else None


# --------------------------------------------------------------------------
# Reading a division label
# --------------------------------------------------------------------------

#: A division's number, Roman or Arabic. Both occur and neither is per
#: language: the Code numbers its books, parts, titles and chapters in Roman
#: numerals and its articles in Arabic ones, in every edition.
_DIVISION_NUM = r"(?:[IVXLCDM]{1,7}|\d{1,3})"
_LABEL_RE_CACHE: dict[str, list[tuple[str, re.Pattern]]] = {}


def label_patterns(lang: str) -> list[tuple[str, re.Pattern]]:
    """`(kind, pattern)` for one edition, deepest noun first.

    Deepest first so `ARTICOLO` is tried before nothing shadows it, and so a
    noun that is a prefix of another cannot win: `ART` would otherwise match
    the head of `ARTICLE` and leave `ICLE` as the title."""
    if lang not in _LABEL_RE_CACHE:
        ords = DIVISION_ORDINALS.get(lang, ())
        ord_alt = (
            "|".join(re.escape(o) for o in sorted(ords, key=len, reverse=True))
            if ords
            else None
        )
        pats = []
        for kind in reversed(DIVISION_ORDER):
            nouns = DIVISION_NOUNS[lang].get(kind, ())
            if not nouns:
                continue
            alt = "|".join(
                re.escape(n.rstrip(".")) for n in sorted(nouns, key=len, reverse=True)
            )
            lead = rf"(?P<ord>{ord_alt})\s+" if ord_alt else ""
            pats.append(
                (
                    kind,
                    re.compile(
                        rf"^\s*(?:{lead})?(?:{alt})\.?"
                        rf"(?:\s+(?P<num>{_DIVISION_NUM})\b)?\s*[.:–—-]*\s*"
                        if lead
                        else rf"^\s*(?:{alt})\.?(?:\s+(?P<num>{_DIVISION_NUM})\b)?"
                        rf"\s*[.:–—-]*\s*",
                        re.IGNORECASE,
                    ),
                )
            )
        _LABEL_RE_CACHE[lang] = pats
    return _LABEL_RE_CACHE[lang]


def split_label(text: str, lang: str) -> tuple[str, str, str] | None:
    """`(kind, the label as printed, whatever follows it)`, or None.

    The Code prints a division three ways and this reads all three as one:
    the label alone on its line (`TITLE I.`), the label and the name on one
    line (`BOOK I. GENERAL NORMS`), and the label with the name a `<br>`
    below (Latin's `LIBER I<br><br><i>DE NORMIS GENERALIBUS</i>`, which the
    caller has already split into lines)."""
    for kind, pat in label_patterns(lang):
        m = pat.match(text)
        if not m:
            continue
        # A noun with no number and no ordinal in front of it is a word, not
        # a label: French `PARTIE` opens ordinary prose and English `ART` is
        # a syllable.
        if m.group("num") is None and not m.groupdict().get("ord"):
            continue
        return (
            kind,
            text[m.start() : m.end()].strip().rstrip(".:–—- "),
            text[m.end() :].strip(),
        )
    return None


def heading_lines(block: Block) -> list[str]:
    """A centred block's `<br>`-separated lines, blank ones dropped.

    LATIN PUTS A DIVISION'S LABEL AND ITS NAME IN ONE BLOCK and German puts
    them in two, so lines rather than blocks is the unit that makes the two
    the same shape. `LIBER I<br><br><i>DE NORMIS GENERALIBUS</i>` is two
    lines here and `BUCH I` / `ALLGEMEINE NORMEN` is two blocks of one line
    each, and the heading assembler below sees the same four strings for
    both."""
    return [p for p in _BR_RE.split(block.html) if not _blank(_plain(p))]


#: A run of letters with no lower-case in it. Accents fold correctly under
#: `str.isupper`, so `DE LA PRIVACIÓN` passes and `De la privación` does not.
def _is_shouted(text: str) -> bool:
    letters = [c for c in text if c.isalpha()]
    return bool(letters) and all(c.isupper() for c in letters)


def is_unstyled_heading(block: Block, lang: str, heading_open: bool) -> bool:
    """A heading the source paints exactly like a paragraph of the Code.

    TWO EDITIONS PRINT DIVISIONS THIS WAY. Spanish sets its articles as
    plain left-aligned paragraphs -- `Art. 4 — DE LA PRIVACIÓN`, no colour,
    no centring, no emphasis -- and English does the same for every CHAPTER,
    in two paragraphs: `CHAPTER I.` and then `COMMON NORMS`. Read as prose
    they joined the previous canon's text, and the two editions lost most of
    their outline below the level of a title.

    The test is the capitals, qualified two ways. A block opening with a
    division LABEL and shouted throughout is a heading: a canon is a
    sentence, and no canon of the Code is set in capitals. A shouted block
    with no label is a heading only while one is already OPEN above it,
    which is what makes `COMMON NORMS` the name of the chapter declared
    one paragraph earlier rather than a stray line of prose."""
    if block.is_heading_style:
        return False
    split = split_label(block.text, lang)
    # A PARAGRAPH THAT IS NOTHING BUT A DIVISION LABEL is a heading whatever
    # its case, and English's articles are why: it prints `Art. 1.` on its
    # own line, which the capitals test refuses because two of its three
    # letters are lower-case. Sixty article headings went missing on that,
    # in every edition that titles an article the same way.
    if split is not None and (not split[2] or _is_shouted(split[2])):
        return True
    if not _is_shouted(block.text):
        return False
    return heading_open or split is not None


_LABEL_SCAN_CACHE: dict[str, re.Pattern] = {}


def is_contents_list(text: str, lang: str) -> bool:
    """Does this line name SEVERAL divisions rather than being one?

    THE ENGLISH EDITION PRINTS A MINIATURE TABLE OF CONTENTS at the head of
    every page, in the same brown as its headings and run together on one
    line: `CHAPTER I. COMMON NORMS CHAPTER II. SINGULAR DECREES AND PRECEPTS
    CHAPTER III. RESCRIPTS ...`. It is not a heading and it is painted like
    one, so the only thing that separates them is what they say -- a heading
    names one division and a contents list names the page's."""
    if lang not in _LABEL_SCAN_CACHE:
        nouns = sorted(
            (n.rstrip(".") for kinds in DIVISION_NOUNS[lang].values() for n in kinds),
            key=len,
            reverse=True,
        )
        alt = "|".join(re.escape(n) for n in nouns)
        _LABEL_SCAN_CACHE[lang] = re.compile(
            rf"\b(?:{alt})\.?\s+{_DIVISION_NUM}\b", re.IGNORECASE
        )
    return len(_LABEL_SCAN_CACHE[lang].findall(text)) > 1


# --------------------------------------------------------------------------
# The walk
# --------------------------------------------------------------------------


@dataclass
class Pending:
    """A heading being assembled out of consecutive centred lines."""

    kind: str | None
    label: str | None
    lines: list[str] = field(default_factory=list)


@dataclass
class Node:
    kind: str | None
    label: str | None
    title: str
    title_html: str
    before: int | None


@dataclass
class Canon:
    n: int
    blocks: list[str] = field(default_factory=list)
    #: True where the Latin edition flags the canon as amended.
    amended: bool = False
    superseded: list[dict] = field(default_factory=list)


@dataclass
class WalkState:
    nodes: list[Node] = field(default_factory=list)
    canons: dict[int, Canon] = field(default_factory=dict)
    order: list[int] = field(default_factory=list)
    #: `{title?, blocks}` in source order, everything printed before canon 1.
    front: list[dict] = field(default_factory=list)
    breadcrumbs: int = 0
    contents_lists: int = 0
    stray_headings: int = 0
    restated: int = 0
    #: The apparatus's own legend, deduplicated: one sentence per edition,
    #: printed once on every page that carries an amendment.
    legends: set[str] = field(default_factory=set)
    out_of_order: list[str] = field(default_factory=list)
    anomalies: list[str] = field(default_factory=list)
    dropped_tags: dict = field(default_factory=dict)


#: What an edition may put between a canon's number and its text: an em or
#: en dash, a hyphen, a full stop, a colon, or nothing at all.
_LEAD_PUNCT_RE = re.compile(r"^(?:\s|<br/>|[.:;–—-])+")


def _narrow(html: str) -> str:
    return vd.narrow_html(html)


def _title_parts(lines: list[str]) -> tuple[str, str]:
    """`(title, title_html)` from a heading's lines after its label.

    EVERY LINE JOINS THE TITLE, and this work is the reason the document
    schema's `subtitle` is not used here: a division of the Code has a label
    and a name and nothing else, so a second line is always the first one
    continuing. It is a line break where the source's measure ran out --
    Latin sets `TITULUS III` / `DE DECRETIS GENERALIBUS` / `ET DE
    INSTRUCTIONIBUS` over three lines of one heading, and taking the second
    as the title and the third as a subtitle truncates a title in Latin
    while doing nothing at all in English, where the same heading fits on
    one line. The same argument `vd.heading_inner_html` makes about the
    `<br>` it deletes, one level up."""
    narrowed = [n for n in (_narrow(line) for line in lines) if n]
    if not narrowed:
        return "", ""
    # The full stop after a label does not always travel with it: English
    # sets `CHAPTER II` and `. SINGULAR DECREES AND PRECEPTS` as two
    # paragraphs, so the stripping `split_label` does on its own line leaves
    # the punctuation stranded at the head of the next one.
    joined = _LEAD_PUNCT_RE.sub("", " ".join(narrowed))
    return vd.html_to_text(joined), vd.heading_inner_html(joined)


def walk(blocks: list[Block], edition: Edition) -> WalkState:
    """Blocks in source order to canons, divisions and front matter.

    THE FRONT MATTER IS EVERYTHING BEFORE CANON 1, and saying it that way is
    what keeps the constitution *Sacrae disciplinae leges* out of the outline.
    The Russian edition prints it whole above the Code and its lines are
    centred exactly as a division heading is; read as headings they would
    become six structure nodes all anchored to canon 1. There is no need to
    recognise them, because the Code's own first number says where it starts
    -- the same argument `csdc.find_numbered_body_start` makes at much
    greater length, and cheap here because the marker is explicit.

    BREADCRUMBS ARE THE OTHER HALF. A chunked edition reprints a canon's
    ancestor divisions at the head of every page it appears on -- `BUCH I`
    stands above all twenty pages of Book I -- so the same division arrives
    once per page. What makes the repeat recognisable is not that the text
    repeats but that the division is ALREADY OPEN: a heading is a breadcrumb
    when the division of its kind currently in scope carries the same label.
    Compared on the LABEL and not the title, because the editions vary the
    title between the division's own page and the breadcrumb (German prints
    `ALLGEMEINE NORMEN (Cann. 1 - 6)` in both places and Italian prints the
    range in neither), while `TITOLO I` is `TITOLO I` wherever it is
    printed."""
    state = WalkState()
    pending: list[Pending] = []
    open_labels: dict[str, str] = {}
    last = 0
    current: Canon | None = None
    front_unit: dict | None = None

    def flush(before: int | None) -> None:
        for p in pending:
            title, title_html = _title_parts(p.lines)
            # COMPARED FOLDED, because an edition may not spell its own
            # label the same way twice: the French pages print `DEUXIÈME
            # PARTIE` on the page the part opens and `DEUXIEME PARTIE` on
            # the breadcrumb above the next one, so an exact comparison
            # emitted every French part twice.
            key = common.fold(p.label) if p.label else ""
            if p.kind is not None and open_labels.get(p.kind) == key:
                state.breadcrumbs += 1
                continue
            # A HEADING THAT PRINTS ITS OWN RANGE AND IS NOT AT IT is a
            # pointer, not a heading in place. The English page for canons
            # 1166-1190 opens with `TITLE IV. THE VENERATION OF THE SAINTS
            # ... (Cann. 1186 - 1190)` above canon 1166 -- the page-top
            # contents list in its one-entry form, which `is_contents_list`
            # cannot see because it takes two labels to look like a list.
            # The source convicts it: the range it prints starts twenty
            # canons after the canon it would stand over.
            printed = printed_range(title)
            if printed is not None and before is not None and printed > before:
                state.contents_lists += 1
                continue
            if p.kind is not None:
                open_labels[p.kind] = key
                depth = DIVISION_ORDER.index(p.kind)
                for deeper in DIVISION_ORDER[depth + 1 :]:
                    open_labels.pop(deeper, None)
            state.nodes.append(Node(p.kind, p.label, title, title_html, before))
        pending.clear()

    def open_canon(n: int, amended: bool, source: str) -> None:
        """Start canon `n`, with no text in it yet."""
        nonlocal current, last
        flush(n)
        if current is not None and current.n == n:
            # THE MARKER RESTATED, NOT A SECOND CANON. The German edition
            # prints `Can. 861 — § 1.` and then `Can. 861 — § 2.`, repeating
            # the number on every paragraph of a canon; read as a new canon
            # each time, eight of them arrived twice and the second reading
            # replaced the first.
            state.restated += 1
            return
        if n in state.canons:
            state.anomalies.append(f"canon {n} printed twice ({source})")
            current = state.canons[n]
            last = max(last, n)
            return
        if n <= last:
            state.out_of_order.append(f"{n} after {last} ({source})")
        canon = Canon(n, amended=amended)
        state.canons[n] = canon
        state.order.append(n)
        current = canon
        last = max(last, n)

    def append(html: str, source: str) -> None:
        narrowed = _narrow(html)
        if current is not None and not current.blocks:
            # THE DELIMITER SURVIVES THE MARKER, because the two are not the
            # same shape: `Can. 579` is characters that `strip_leading_text_html`
            # can walk, and the dash after it is `&#x2014;` -- an entity, which
            # only becomes a character when `narrow_html` decodes it. So the
            # tidy-up has to happen on this side of the narrowing, or every
            # canon in five editions opens with a stray em dash.
            narrowed = _LEAD_PUNCT_RE.sub("", narrowed)
        if not narrowed:
            return
        if current is None:
            state.anomalies.append(f"prose before any canon ({source})")
            return
        current.blocks.append(narrowed)

    def add_prose(html: str, source: str) -> None:
        """Store `html` under the open canon, opening a new one wherever the
        next canon's marker turns up INSIDE it.

        Looped rather than done once: Latin's Book VI runs a whole title
        into a single paragraph, so one split reaches only the first of the
        canons buried in it."""
        while (piece := split_inline_canon(html, edition, last + 1)) is not None:
            head, tail = piece
            append(head, source)
            m = canon_text_re(edition.canon_word).match(_plain(tail))
            if m is None:  # the finditer just matched it; never guess a number
                state.anomalies.append(f"inline marker unreadable ({source})")
                return
            open_canon(int(m.group(1)), False, source)
            rest = strip_leading_text(tail, m.group(0))
            html = rest
        append(html, source)

    for block in blocks:
        hit = match_canon(block, edition, last)

        if hit is not None:
            open_canon(hit[0], block.amended, block.source)
            rest = strip_leading_text(block.html, hit[1])
            add_prose(rest, block.source)
            continue

        if block.is_heading_style or is_unstyled_heading(
            block, edition.lang, bool(pending)
        ):
            if is_contents_list(block.text, edition.lang):
                state.contents_lists += 1
                continue
            lines = heading_lines(block)
            labelled = any(
                split_label(_plain(line), edition.lang) is not None for line in lines
            )
            # THE FRONT MATTER ENDS AT THE FIRST DIVISION LABEL OR THE FIRST
            # CANON, whichever the page prints first. Before that a centred
            # line is furniture or front matter, not a heading: the Russian
            # edition sets the whole of `Sacrae disciplinae leges` centred
            # above canon 1, and read as headings its lines would become
            # structure nodes all anchored to canon 1. What distinguishes
            # `LIBER I` from `Sacrae disciplinae leges` is that one carries
            # a division label and the other does not, so that is the test
            # -- and once a label has opened, the lines after it belong to
            # it however they are painted.
            if last == 0 and not pending and not labelled:
                front_unit = {
                    "title": vd.html_to_text(_narrow(block.html)),
                    "blocks": [],
                }
                state.front.append(front_unit)
                continue
            unplaced: list[str] = []
            for line in lines:
                split = split_label(_plain(line), edition.lang)
                if split is not None:
                    _kind, label, _rest = split
                    tail = strip_leading_text(line, label)
                    pending.append(
                        Pending(
                            split[0], label, [tail] if not _blank(_plain(tail)) else []
                        )
                    )
                elif pending:
                    pending[-1].lines.append(line)
                else:
                    unplaced.append(line)
            # EVERY DIVISION OF THE CODE CARRIES A LABEL, so a centred line
            # with none above it is not one. Four such lines exist across the
            # seven editions and no two are the same thing: an editor's
            # instruction left in the Russian page (`ЭТОТ ПАРАГРАФ ПОМЕСТИТЬ
            # В ЛАТИНСКИЙ ТЕКСТ:`), a French division title reprinted without
            # its label, a Spanish `§ 2.` the source centred, and an English
            # fragment of a superseded canon. Read as headings they became
            # divisions -- the Russian one an eighth BOOK, where every
            # edition has seven.
            #
            # SHOUTED OR NOT is what separates the two kinds, and it has to,
            # because the two want opposite treatment: a shouted line is a
            # heading in the wrong place and is dropped with a count, while
            # an ordinary sentence is a paragraph in the wrong place and is
            # kept, on the canon that was open when it arrived. Dropping the
            # second would lose text; keeping the first would put a title in
            # the middle of a canon.
            for line in unplaced:
                if _is_shouted(_plain(line)):
                    state.stray_headings += 1
                else:
                    add_prose(line, block.source)
            continue

        if current is None:
            # PROSE BEFORE THE FIRST CANON IS FRONT MATTER, whatever else is
            # in flight. Testing `pending` here instead put the Spanish
            # edition's `Cánones 1-6` page label -- which follows two
            # division headings -- into no unit at all and reported it as an
            # orphan.
            if front_unit is None:
                front_unit = {"blocks": []}
                state.front.append(front_unit)
            narrowed = _narrow(block.html)
            if narrowed:
                front_unit["blocks"].append({"html": narrowed})
            continue

        # A continuation paragraph can carry the amendment mark too -- the
        # English edition puts it on the § that changed rather than on the
        # canon -- so it is stripped here as well as at a canon's head, and
        # the canon is flagged either way.
        if block.amended and current is not None:
            current.amended = True
        add_prose(block.html, block.source)

    flush(None)
    return state


#: `(Cann. 1186 - 1190)` at the end of a heading -- the extent five of the
#: seven editions print inside the title. Read only to CHECK the heading's
#: position (see `flush`); the site strips it for display and the corpus
#: keeps it, because it is what the edition printed.
_PRINTED_RANGE_RE = re.compile(
    r"\(\s*(?:can+|c[âa]n+|kan|кан)\.?\s*(\d{1,4})", re.IGNORECASE
)


def printed_range(title: str) -> int | None:
    """The first canon a heading's own printed range names, or None."""
    m = _PRINTED_RANGE_RE.search(title)
    return int(m.group(1)) if m else None


def strip_amendment_flag(html: str) -> tuple[str, bool]:
    """`(html with the amendment marks removed, whether there were any)`.

    REMOVED WHEREVER THEY SIT, not only at the head of a block. The three
    editions that print the mark put it in three places: Latin against the
    canon's number, English at the head of the amended paragraph, and
    Spanish INSIDE it, after the `§ 1.` and before the first word -- which
    is how canon 230 came to read `230 § 1. n Los laicos que tengan...`.

    A candidate is an emphasis run whose entire content is the letter `n`.
    That alone would take an italicised `n` out of someone's prose, so a
    match is kept only when the run is a superscript or is set in the
    mirror's heading brown -- which is what the mark always is and what an
    ordinary emphasised letter never is."""
    found = False

    def drop(m: re.Match) -> str:
        nonlocal found
        run = m.group(0).lower()
        if "<sup" not in run and "663300" not in run:
            return m.group(0)
        found = True
        # A SPACE, NOT NOTHING. The mark is a separate element and the source
        # often prints no space on either side of it, so removing it outright
        # welded the canon's number to its first paragraph -- `<b>111</b>` and
        # `&sect; 1.` became `111§ 1.`, which is not a number followed by
        # whitespace and so not a canon marker. `narrow_html` collapses the
        # run, so nothing downstream can tell this from the source's own space.
        return " "

    return _AMEND_FLAG_RE.sub(drop, html), found


# --------------------------------------------------------------------------
# Assembling the work
# --------------------------------------------------------------------------


def build_structure(state: WalkState) -> list[dict]:
    """`structure.json`: the flat `{level, kind?, title, before}` array.

    LEVELS COME FROM THE LABEL, which is the one place in this corpus that
    is true. Everywhere else a heading's depth is inferred from how it is
    painted (`vd.heading_style_rank`), because the sources do not reliably
    encode what a heading MEANS; the Code does encode it, in the word it
    prints -- a `CAPUT` is inside a `TITULUS` in every edition because the
    Code is divided that way. What is inferred here is nothing.

    Compacted to contiguous `1..N` afterwards, as the schema requires: an
    edition that never prints a `SECTIO` must not leave a hole at level 3.

    `kind` IS STORED, AND THIS IS THE WORK THE DOCUMENT SCHEMA DROPPED IT
    FOR. `structure.json` carried a `kind` until 2026-08-21 and lost it
    because it "forced the scraper to judge whether a heading _meant_
    chapter or section, which the sources do not reliably encode" -- a
    judgement that put chapters inside sections in Gaudium et Spes. Here
    there is no judgement: the edition prints `TITULUS` or `CAPUT`, and
    `DIVISION_NOUNS` is a table of what those words are in each language.
    The reason to keep it is the site's, and it is the same argument one
    layer on: a reader's page has to be a run of canons under one TITLE, and
    picking those by `level === 4` would be reading a compacted integer
    where the source printed a word."""
    ranks = sorted(
        {DIVISION_ORDER.index(n.kind) for n in state.nodes if n.kind is not None}
    )
    depth_of = {rank: i + 1 for i, rank in enumerate(ranks)}
    out: list[dict] = []
    last_level = 1
    for node in state.nodes:
        if node.kind is not None:
            level = depth_of[DIVISION_ORDER.index(node.kind)]
            last_level = level
        else:
            # An unlabelled centred line between two divisions is a further
            # line of the one above it, so it sits at that depth rather than
            # opening a division of its own.
            level = last_level
        entry: dict = {"level": level}
        if node.kind:
            entry["kind"] = node.kind
        if node.label:
            entry["label"] = node.label
        entry["title"] = node.title
        if node.title_html:
            entry["title_html"] = node.title_html
        entry["before"] = node.before
        out.append(entry)
    return out


def build_sections(state: WalkState) -> list[dict]:
    """`sections.json`: one entry per canon, ordered by number.

    `citations` is `[]` in every one of them and is written all the same.
    The Code prints no footnote apparatus anywhere -- not one marker in any
    of the seven editions -- so the field is an empty fact about this work
    rather than a missing one, and a consumer that branches on its presence
    should not have to branch on this work.

    `superseded` is present only where the edition prints a replaced
    wording, which today is the Latin one and nowhere else. It rides on the
    canon rather than in the numbered flow because it is not an address: a
    reader asking for canon 579 must be given the law in force, and the
    wording *Authenticum charismatis* replaced is what that canon USED to
    say -- adjacent to it, never instead of it."""
    out = []
    for n in sorted(state.canons):
        canon = state.canons[n]
        entry: dict = {
            "n": n,
            "blocks": [{"html": html} for html in canon.blocks],
            "citations": [],
        }
        if canon.superseded:
            entry["superseded"] = canon.superseded
        out.append(entry)
    return out


def attach_amendments(state: WalkState, amendments: list[Amendment]) -> None:
    """Put each superseded wording on the canon it belonged to.

    A unit naming no canon -- the legend, the opening `[Cf: ...]` reference
    -- has no canon to sit on and becomes trailing matter in the appendix.
    It is kept because it is what tells a reader what the superscript `n`
    beside a canon number MEANS, and dropping the legend while keeping the
    marks it explains would be the worse half of both choices."""
    for unit in amendments:
        if unit.canon is not None and unit.canon in state.canons:
            state.canons[unit.canon].superseded.append(
                {"title": unit.title, "blocks": [{"html": h} for h in unit.blocks]}
            )
            continue
        if unit.canon is not None:
            state.anomalies.append(
                f"apparatus names canon {unit.canon}, which the body never printed"
            )
            continue
        if unit.is_legend and not unit.blocks:
            # THE LEGEND IS PRINTED ONCE PER PAGE AND IS ONE SENTENCE. Eleven
            # copies of "( n : indicates that the text corresponds to a new
            # version)" in an edition's appendix is not front matter, it is
            # the same footnote eleven times. It says what `superseded` and
            # the amendment marks MEAN, so it is recorded once, in the
            # manifest, beside the sentence describing the field.
            state.legends.add(unit.title)
            continue
        state.front.append(
            {
                "title": unit.title,
                "blocks": [{"html": h} for h in unit.blocks],
                "trailing": True,
            }
        )


def build_appendix(state: WalkState) -> list[dict]:
    """`appendix.json`: the front matter, in source order.

    Written only where there is one, which is what makes the file's presence
    the answer to whether this edition prints anything before canon 1. Four
    do (the constitution promulgating the Code, an editor's preface) and
    three print the Code and nothing else."""
    out: list[dict] = []
    pending: list[str] = []
    for unit in state.front:
        title, blocks = unit.get("title", ""), unit["blocks"]
        if not blocks and not unit.get("trailing"):
            # A HEADING WITH NOTHING UNDER IT IS PART OF THE NEXT HEADING.
            # The English edition sets the constitution's masthead as four
            # centred paragraphs -- `APOSTOLIC CONSTITUTION`, the title, the
            # pope's name, the purpose -- and each became a unit of its own
            # with an empty `blocks`, which is a shape no consumer of this
            # schema has a use for.
            if title:
                pending.append(title)
            continue
        entry: dict = {}
        joined = " ".join(pending + ([title] if title else []))
        if joined:
            entry["title"] = joined
        pending = []
        entry["blocks"] = blocks
        entry["citations"] = []
        out.append(entry)
    if pending:
        out.append({"title": " ".join(pending), "blocks": [], "citations": []})
    return out


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def work_id_for(lang: str) -> str:
    return f"cic.{lang}"


#: Canons an edition's own pages do not print, with the evidence. A gap NOT
#: in this table fails the run.
#:
#: BOTH ARE THE SOURCE'S OMISSION AND NEITHER IS RECOVERABLE HERE. The
#: German page is named for canons 1321-1330 in its own URL, prints that
#: range in its own heading, and ends at 1329; the Spanish page runs 1481,
#: 1483, 1484 with nothing between the first two. Fixing either would mean
#: writing a canon of the Code from another edition, which is the one thing
#: `pipeline/corrections/` exists to forbid -- a defect with no known
#: correct value in its own edition gets documented, not invented
#: (pipeline/docs/corrections.md). A reader who asks for
#: `cic.de` canon 1330 falls back to another language, which is what the
#: site's content-language chain is for.
KNOWN_GAPS: dict[str, dict[int, str]] = {
    "de": {
        1330: "absent from cic_libro6_cann1321-1330_ge.html, which prints "
        "1321-1329 under a heading naming 1321-1330",
    },
    "es": {
        1482: "absent from cic_libro7_cann1481-1490_sp.html, which runs "
        "1481 straight into 1483",
    },
}


def expected_canons(lang: str = "") -> list[int]:
    gaps = KNOWN_GAPS.get(lang, {})
    return [n for n in range(1, EXPECTED_CANONS + 1) if n not in gaps]


def validate(
    edition: Edition, state: WalkState, sections: list[dict], structure: list[dict]
) -> list[str]:
    """What must be true of an edition before it is written.

    THE ADDRESS SPACE IS THE ASSERTION. The Code is canons 1 to 1,752 in
    every language by construction, so a missing number is not a shorter
    edition -- it is an address naming the wrong canon, and after the first
    one every address below it is wrong too. `csdc.EXPECTED_SECTIONS` is the
    same assertion for the same reason.

    THE STRUCTURE IS REPORTED, NOT ASSERTED, and the split is deliberate:
    `validate_document`'s floor in this pipeline has always been under a
    parse's ADDRESSES rather than its outline (pipeline/CLAUDE.md), because
    a heading lost to a misspelled label is invisible to every check that
    counts units. What sees that here is the index cross-check below, which
    is a different edition of the same claim."""
    problems: list[str] = []
    have = {s["n"] for s in sections}
    want = set(expected_canons(edition.lang))
    missing = sorted(want - have)
    extra = sorted(have - want)
    if missing:
        problems.append(
            f"{len(missing)} canons missing: {missing[:12]}"
            + (" ..." if len(missing) > 12 else "")
        )
    if extra:
        problems.append(f"canon numbers outside 1..{EXPECTED_CANONS}: {extra[:12]}")
    if state.out_of_order:
        problems.append(
            f"{len(state.out_of_order)} canons out of order: {state.out_of_order[:6]}"
        )
    empty = [s["n"] for s in sections if not s["blocks"]]
    if empty:
        problems.append(f"{len(empty)} canons with no text: {empty[:12]}")
    if not structure:
        problems.append("no divisions read; the whole outline is missing")
    levels = sorted({node["level"] for node in structure})
    if levels and levels != list(range(1, len(levels) + 1)):
        problems.append(f"levels are not contiguous: {levels}")
    return problems


def index_cross_check(
    state: WalkState, entries: list[IndexEntry], lang: str
) -> list[str]:
    """The index's outline against the body's, reported and never fatal.

    A FREE SECOND WITNESS, and the only one this work has. The index page
    states the Code's outline in prose the body states in markup, and the two
    were written by different hands -- so a division the body prints and the
    index does not is a division we may have invented, and one the index
    prints and the body does not is one we may have lost. Neither is
    necessarily a defect: the Latin index lists seven books and nothing
    below them, and several editions' indexes silently omit a chapter they
    do print.

    Compared on the LABEL, which is the part both sides spell the same way.
    The titles do not survive the comparison -- an index row reads `TITLE I.
    ECCLESIASTICAL LAWS (Cann. 7 - 22)` where the page prints `TITLE I.` and
    `ECCLESIASTICAL LAWS (Cann. 7 - 22)` as two paragraphs, and three
    editions punctuate the two differently.

    THE RUSSIAN EDITION HAS NO INDEX -- it is one page, linked from
    `archive/cdc/index.htm` and nowhere else -- so there is nothing to
    compare it against, and an empty witness must not be reported as one
    saying no. Without this it printed "44 divisions the pages print and the
    index does not", which is true of a book with no index and true of a
    parser that has invented forty-four."""
    if not entries:
        return []

    def labels(texts):
        out = []
        for text in texts:
            split = split_label(text, lang)
            if split is not None:
                out.append((split[0], common.fold(split[1])))
        return out

    from_index = labels(e.text for e in entries)
    from_body = labels(
        f"{n.label} {n.title}" for n in state.nodes if n.label is not None
    )
    only_index = [x for x in dict.fromkeys(from_index) if x not in set(from_body)]
    only_body = [x for x in dict.fromkeys(from_body) if x not in set(from_index)]
    notes = []
    if only_index:
        notes.append(
            f"{len(only_index)} divisions the index names and the pages do not: "
            + ", ".join(f"{k} {v}" for k, v in only_index[:8])
        )
    if only_body:
        notes.append(
            f"{len(only_body)} divisions the pages print and the index does not: "
            + ", ".join(f"{k} {v}" for k, v in only_body[:8])
        )
    return notes


# --------------------------------------------------------------------------
# Manifest and output
# --------------------------------------------------------------------------


@dataclass
class EditionResult:
    lang: str
    status: str = "parse-error"
    canons: int = 0
    divisions: int = 0
    appendix: int = 0
    breadcrumbs: int = 0
    #: Divisions per level, outermost first. Printed because it is this
    #: work's own cross-edition oracle: the editions are translations of one
    #: divided text, so their level counts must agree, and an edition alone
    #: in reading five levels where the others read six has lost a division
    #: noun -- which is exactly how the German `SEKTION` was found.
    by_level: list[int] = field(default_factory=list)
    problems: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    error: str = ""


def build_manifest(
    edition: Edition,
    sources: list[dict],
    state: WalkState,
    structure: list[dict],
    notes: list[str],
    corrections_applied: list[dict],
) -> dict:
    lines = [
        (
            "The Code is addressed by canon: each of its numbered canons is a unit, "
            "and the paragraphs a canon is divided into (§§1, 2, 3) and the "
            "items inside those are its blocks, in the order the source prints them."
        ),
        (
            "Inline markup is stored per block in `html`, restricted to the closed "
            "allowlist the documents use (i, b, br, sup, blockquote); tags outside it "
            "keep their text and lose their markup (pipeline/docs/corpus.md)."
        ),
        (
            "The Code prints no footnotes in any edition, so every unit's `citations` "
            "is empty by construction rather than by omission."
        ),
        (
            f"Canons {REVISED_BOOK_VI.start}–{REVISED_BOOK_VI.stop - 1} (Book VI, "
            "penal sanctions in the Church) are the text of the apostolic "
            "constitution Pascite Gregem Dei, which replaced that book whole with "
            "effect from 8 December 2021 and is what this mirror serves. A citation "
            "to a Book VI canon written before that date may name a different "
            "provision than the one stored here."
        ),
    ]
    for n, why in sorted(KNOWN_GAPS.get(edition.lang, {}).items()):
        lines.append(
            f"Canon {n} has no entry in this edition: {why}. The omission is "
            "the source's; no text has been supplied from another edition."
        )
    if any(c.superseded for c in state.canons.values()):
        amended = sum(1 for c in state.canons.values() if c.superseded)
        lines.append(
            f"{amended} canons carry a `superseded` array: this edition prints, "
            "after the text in force, the wording a later act replaced, under a "
            "line naming that act. The canon's own `blocks` are the law as it "
            "now stands."
        )
        for legend in sorted(state.legends):
            lines.append(f"The edition's own legend for the mark: {legend}")
    lines.extend(notes)
    if state.breadcrumbs:
        lines.append(
            f"{state.breadcrumbs} repeated division headings were read as the "
            "page furniture they are: a chunked edition reprints a canon's "
            "ancestor divisions at the head of every page."
        )
    if state.contents_lists:
        lines.append(
            f"{state.contents_lists} per-page contents lists were read as the "
            "furniture they are: this edition prints its page's chapters run "
            "together on one line, in the same colour as a heading."
        )
    if state.restated:
        lines.append(
            f"{state.restated} paragraphs restate their canon's number, which "
            "this edition prints on every paragraph rather than on the first."
        )
    if state.stray_headings:
        lines.append(
            f"{state.stray_headings} centred line(s) carrying no division label "
            "were left out of the outline: every division of the Code carries "
            "one, so a line without it is a heading in the wrong place, a title "
            "reprinted without its label, or an editorial note."
        )
    if state.anomalies:
        lines.append(f"{len(state.anomalies)} anomalies recorded; see the run log.")
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    translations = {
        lang: {"status": "pdf-only", "checked_at": today, "note": why}
        for lang, (_url, why) in UNPARSED_FORMATS.items()
    }
    return {
        "id": work_id_for(edition.lang),
        "type": "canon-law",
        "document_kind": "code-of-canon-law",
        "title": TITLES[edition.lang],
        "short_title": TITLES[edition.lang],
        "language": edition.lang,
        "edition": "vatican.va HTML mirror",
        "pontiff_or_council": AUTHOR,
        "promulgated": PROMULGATED,
        "sources": sources,
        "copyright": {
            "status": "copyrighted",
            "holder": vd.COPYRIGHT_HOLDER,
            "notice": "Copyright © Dicastery for Communication – Libreria Editrice Vaticana",
        },
        "notes": " ".join(lines),
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "corrections_applied": len(corrections_applied),
        "translations": translations,
    }


def write_outputs(
    edition: Edition,
    manifest: dict,
    structure: list[dict],
    sections: list[dict],
    appendix: list[dict],
    corrections: list[dict],
    applied: list[dict],
) -> bool:
    work_id = work_id_for(edition.lang)
    out_dir = BUILD_ROOT / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    files: dict[str, object] = {
        "manifest.json": manifest,
        "structure.json": structure,
        "sections.json": sections,
        "corrections-applied.json": corrections_receipt(
            work_id, applied, corrections, manifest["generated_at"]
        ),
    }
    remove: tuple[str, ...] = ()
    if appendix:
        files["appendix.json"] = appendix
    else:
        remove = ("appendix.json",)
    return write_stamped_json(out_dir, files, manifest["generated_at"], remove=remove)


def parse_edition(
    fetcher: Fetcher, edition: Edition, *, write: bool = True
) -> EditionResult:
    """Read one edition out of `raw/` and write its work."""
    res = EditionResult(lang=edition.lang)
    work_id = work_id_for(edition.lang)
    plan = crawl_edition(fetcher, edition, pdfs=False)
    if not plan.pages:
        # NO PAGES AT ALL is the only fetch failure that is fatal, and it
        # means the index itself did not arrive. A page that failed is
        # reported and the edition is parsed without it: the Italian index
        # links `cic_libroVI_1331-1340_it.html`, which 404s and always has,
        # and whose ten canons the three chapter pages beside it carry in
        # full. Treating one dead link as the edition's failure cost all 252
        # of its pages.
        res.error = plan.failures[0] if plan.failures else "no pages"
        res.status = "fetch-failed"
        return res
    res.notes.extend(f"page not fetched: {err}" for err in plan.failures)

    corrections = load_corrections(work_id)
    applied: list[dict] = []
    seen: set[str] = set()

    read: list[tuple[str, list[Block]]] = []
    for name in plan.pages:
        raw = (RAW_ROOT / name).read_bytes()
        html = vd.decode_page(raw)
        html = vd.apply_raw_text_corrections(html, corrections, applied, seen)
        read.append((name, page_blocks(html, name)))

    # EVERY PAGE OF THE EDITION HAS NOW BEEN READ, so an entry that matched
    # nothing matches nothing anywhere -- which is drift, and the whole
    # reason the ledger is checked rather than trusted. There is no partial
    # run to except: a language is parsed whole or not at all.
    require_all_applied(
        corrections, seen, source=str(RAW_ROOT / edition.lang), field="raw_text"
    )

    blocks: list[Block] = []
    amendments: list[Amendment] = []
    sources: list[dict] = []
    for name, page in order_pages(read, edition):
        body, apparatus = split_apparatus(page, edition)
        blocks.extend(body)
        amendments.extend(read_apparatus(apparatus, edition))
        sources.append(
            {
                "url": _page_url(plan, name, edition),
                "retrieved_at": captured_at(RAW_ROOT / name),
            }
        )

    state = walk(blocks, edition)
    attach_amendments(state, amendments)
    structure = build_structure(state)
    sections = build_sections(state)
    appendix = build_appendix(state)

    res.canons = len(sections)
    res.divisions = len(structure)
    res.appendix = len(appendix)
    res.breadcrumbs = state.breadcrumbs
    res.by_level = [
        sum(1 for node in structure if node["level"] == level)
        for level in range(1, len(DIVISION_ORDER) + 1)
    ]
    res.problems = validate(edition, state, sections, structure)
    res.notes.extend(index_cross_check(state, plan.entries, edition.lang))
    res.status = "ok" if not res.problems else "problems"

    if write and not res.problems:
        manifest = build_manifest(
            edition, _source_summary(sources), state, structure, res.notes, applied
        )
        write_outputs(
            edition, manifest, structure, sections, appendix, corrections, applied
        )
    return res


def _page_url(plan: CrawlResult, cache_name: str, edition: Edition) -> str:
    """The address a cached page came from, recovered from the crawl plan."""
    if edition.family == "single":
        return edition.page_url
    base = cache_name.split("/", 1)[1]
    for entry in plan.entries:
        if entry.url.endswith("/" + base):
            return entry.url
    return base


def _source_summary(sources: list[dict]) -> list[dict]:
    """One `sources` row per page would be 253 rows of the same crawl.

    The manifest records the FIRST page and the count, plus the span of
    capture dates, because that is what a reader of the manifest wants to
    know and the per-page dates are already in `raw/<source>/captured-at.json`
    where they belong (common/captured.py)."""
    dates = sorted({s["retrieved_at"] for s in sources if s["retrieved_at"]})
    row = dict(sources[0])
    if len(sources) > 1:
        row["pages"] = len(sources)
        if dates:
            row["retrieved_at"] = dates[0]
            if dates[-1] != dates[0]:
                row["retrieved_through"] = dates[-1]
    return [row]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--languages",
        default="",
        help="comma-separated subset of " + ",".join(EDITIONS),
    )
    parser.add_argument(
        "--fetch-only",
        action="store_true",
        help="crawl into raw/ and write no work; the acquisition step",
    )
    parser.add_argument("--offline", action="store_true", help="cache only")
    parser.add_argument("--refresh", action="store_true", help="ignore the cache")
    parser.add_argument(
        "--no-pdfs", action="store_true", help="skip the PDFs nothing parses yet"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="parse and report, writing nothing"
    )
    args = parser.parse_args()

    require_corpus()
    langs = (
        [s.strip() for s in args.languages.split(",") if s.strip()]
        if args.languages
        else list(EDITIONS)
    )
    unknown = [lang for lang in langs if lang not in EDITIONS]
    if unknown:
        raise SystemExit(f"unknown language(s): {', '.join(unknown)}")

    fetcher = make_fetcher(offline=args.offline, refresh=args.refresh)

    if args.fetch_only:
        total_failures = []
        for lang in langs:
            res = crawl_edition(fetcher, EDITIONS[lang], pdfs=not args.no_pdfs)
            print(
                f"{lang}: {len(res.pages)} pages, {len(res.entries)} index rows, "
                f"{len(res.failures)} failures"
            )
            total_failures.extend(res.failures)
        if not args.no_pdfs:
            total_failures.extend(fetch_unparsed_formats())
        print(
            f"\n{fetcher.network_fetches} requests, {fetcher.cache_hits} cache hits, "
            f"{len(total_failures)} failures"
        )
        for err in total_failures:
            print(f"  ! {err}")
        # THE LEDGER IS WRITTEN AT THE END OF A CRAWL AND NOWHERE ELSE, which
        # is what `vatican_docs.py` does and why: a 404 is knowledge derived
        # about a source with no file to sit beside (`common/absent.py`), and
        # the run that learned it is the run that has to write it down. This
        # crawl's one definitive absence is the Italian index's link to
        # `cic_libroVI_1331-1340_it.html`, and without this it would be
        # re-asked on every future crawl.
        if fetcher.absent.save():
            print(f"  [absent] ledger updated: {fetcher.absent.path}")
        return 1 if total_failures else 0

    results = [
        parse_edition(fetcher, EDITIONS[lang], write=not args.dry_run) for lang in langs
    ]
    levels = "/".join(k[:4] for k in DIVISION_ORDER)
    print(
        f"{'work':<10} {'status':<13} {'canons':>7} {'divs':>6} {'appx':>5} "
        f"{'crumbs':>7}  {levels}"
    )
    for res in results:
        by_level = " ".join(f"{n:>4}" for n in res.by_level) if res.by_level else ""
        print(
            f"cic.{res.lang:<6} {res.status:<13} {res.canons:>7} {res.divisions:>6} "
            f"{res.appendix:>5} {res.breadcrumbs:>7}  {by_level}"
        )
        for problem in res.problems:
            print(f"    ! {problem}")
        for note in res.notes:
            print(f"    . {note}")
        if res.error:
            print(f"    ! {res.error}")
    return 1 if any(r.problems or r.error for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
