# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "httpx",
#   "beautifulsoup4",
#   "lxml",
# ]
# ///
"""Scraper for the Matos Soares 1956 Portuguese Catholic Bible.

Source: https://www.liriocatolico.com.br/biblia_online/biblia_matos_soares/
Server-rendered HTML, plain HTTP. No sitemap; the book list is enumerated
from the index page. Always fetches whole-book "completo" pages (never the
per-chapter pages, which use a different wrapper-less DOM) to minimize
request count; --sample mode fetches the same completo pages and simply
keeps only chapter 1 of São João in the output.

Usage:
    uv run pipeline/scrapers/bible/matos_soares.py --sample   # small slice, for review
    uv run pipeline/scrapers/bible/matos_soares.py            # full 73-book crawl

Re-runs are offline-capable: every fetched page is cached under
corpus/raw/matos-soares/ and reused without hitting the network.

Sample-first protocol (docs/corpus-schema.md): the full crawl only runs
after --sample output has been reviewed and approved.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

# `common` is a package one directory up. Python puts a script's own directory
# on sys.path at startup -- which is what made a bare `import common` work while
# these files sat beside it -- and since the move into bible/ and ccc/ that
# directory is no longer the one holding it. Hence this, and hence the imports
# below it being the only ones not at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import matos_soares_apparatus as ms_apparatus
from common import (
    CorrectionDriftError,
    Fetcher,
    FetchPolicy,
    apply_verse_corrections,
    build_root,
    captured_at,
    chapter_opening_letter,
    corrections_receipt,
    httpx_transport,
    load_corrections,
    raw_root,
    require_corpus,
    sample_run_writes_nothing,
    write_stamped_json,
)
from matos_soares_apparatus import anchor_notes

BASE_URL = "https://www.liriocatolico.com.br/biblia_online/biblia_matos_soares/"
USER_AGENT = "Glossa Catholica corpus builder"
MIN_REQUEST_INTERVAL = (
    2.0  # seconds, politeness floor (source has no robots.txt Crawl-delay)
)

RAW_SUBDIR = "matos-soares"


def raw_dir() -> Path:
    """This scraper's fetch cache inside the corpus checkout.

    A function, not a module constant: `common.corpus_dir()` raises when the
    corpus is missing, and doing that at import time would break `--help` and
    any tooling that merely imports this module.
    """
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    """This scraper's output directory inside the corpus checkout."""
    return build_root() / WORK_ID


def books_dir() -> Path:
    """Where the per-book JSON files go."""
    return work_dir() / "books"


WORK_ID = "bible.matos-soares.pt"

# ---------------------------------------------------------------------------
# Slug -> OSIS mapping
#
# Verified against the site's own book-card categories (Pentateuco, Livros
# Históricos, Livros Sapienciais [Deuterocanônicos], Profetas Maiores/Menores,
# Evangelhos, Cartas de São Paulo, Epístolas Católicas) and cross-checked by
# chapter count for the books the research doc flagged as potentially
# Vulgate-named (i-samuel/ii-samuel are distinct book-cards from i-reis/
# ii-reis on this site -- no "1-4 Reis" collapsing of Samuel+Kings here, so
# the mapping below is by position/slug, not guesswork). Order matches the
# order books are listed on the index page, which already follows the
# standard OT/NT canonical grouping.
# ---------------------------------------------------------------------------

# (slug, osis, expected_chapters_or_None)
# expected_chapters is filled in only for the schema's sanity-check set
# (Gen 50, Ps 150, Matt 28, Rev 22, John 21); None means "not cross-checked
# here, trust the scrape."
BOOK_MAP: list[tuple[str, str, int | None]] = [
    ("genesis", "gen", 50),
    ("exodo", "exod", None),
    ("levitico", "lev", None),
    ("numeros", "num", None),
    ("deuteronomio", "deut", None),
    ("josue", "josh", None),
    ("juizes", "judg", None),
    ("rute", "ruth", None),
    ("i-samuel", "1sam", None),
    ("ii-samuel", "2sam", None),
    ("i-reis", "1kgs", None),
    ("ii-reis", "2kgs", None),
    ("i-cronicas", "1chr", None),
    ("ii-cronicas", "2chr", None),
    ("esdras", "ezra", None),
    ("neemias", "neh", None),
    ("ester", "esth", None),
    ("tobias", "tob", None),
    ("judite", "jdt", None),
    ("i-macabeus", "1macc", None),
    ("ii-macabeus", "2macc", None),
    ("jo", "job", None),
    ("salmos", "ps", 150),
    ("proverbios", "prov", None),
    ("eclesiastes", "eccl", None),
    ("cantico-dos-canticos", "song", None),
    ("sabedoria", "wis", None),
    ("eclesiastico", "sir", None),
    ("isaias", "isa", None),
    ("jeremias", "jer", None),
    ("lamentacoes", "lam", None),
    ("baruc", "bar", None),
    ("ezequiel", "ezek", None),
    ("daniel", "dan", None),
    ("oseias", "hos", None),
    ("joel", "joel", None),
    ("amos", "amos", None),
    ("abdias", "obad", None),
    ("jonas", "jonah", None),
    ("miqueias", "mic", None),
    ("naum", "nah", None),
    ("habacuc", "hab", None),
    ("sofonias", "zeph", None),
    ("ageu", "hag", None),
    ("zacarias", "zech", None),
    ("malaquias", "mal", None),
    ("sao-mateus", "matt", 28),
    ("sao-marcos", "mark", None),
    ("sao-lucas", "luke", None),
    ("sao-joao", "john", 21),
    ("atos-dos-apostolos", "acts", None),
    ("romanos", "rom", None),
    ("i-corintios", "1cor", None),
    ("ii-corintios", "2cor", None),
    ("galatas", "gal", None),
    ("efesios", "eph", None),
    ("filipenses", "phil", None),
    ("colossenses", "col", None),
    ("i-tessalonicenses", "1thess", None),
    ("ii-tessalonicenses", "2thess", None),
    ("i-timoteo", "1tim", None),
    ("ii-timoteo", "2tim", None),
    ("tito", "titus", None),
    ("filemon", "phlm", None),
    ("hebreus", "heb", None),
    ("sao-tiago", "jas", None),
    ("i-sao-pedro", "1pet", None),
    ("ii-sao-pedro", "2pet", None),
    ("i-sao-joao", "1john", None),
    ("ii-sao-joao", "2john", None),
    ("iii-sao-joao", "3john", None),
    ("sao-judas", "jude", None),
    ("apocalipse", "rev", 22),
]
SLUG_TO_OSIS = {slug: osis for slug, osis, _ in BOOK_MAP}
EXPECTED_CHAPTERS = {osis: n for _, osis, n in BOOK_MAP if n is not None}

SAMPLE_SLUGS = ["filemon", "sao-joao"]

# ---------------------------------------------------------------------------
# Text cleaning
# ---------------------------------------------------------------------------

# Footnote markers: lowercase roman numerals in brackets, e.g. [i] [ii] [iii].
FOOTNOTE_RE = re.compile(r"\s*\[[ivxlcdm]{1,7}\]", re.IGNORECASE)
WHITESPACE_RE = re.compile(r"[ \t]+")

# Unambiguous OCR fixes: whole tokens (word-boundary delimited) where capital
# "I" (U+0049) stands in for lowercase "l" -- these exact tokens are never
# valid Portuguese words, so the fix is safe to apply automatically.
SAFE_OCR_FIXES = {"Ihe": "lhe", "Ihes": "lhes"}
SAFE_OCR_RE = re.compile(r"\b(" + "|".join(SAFE_OCR_FIXES) + r")\b")

# Broader detector (report-only): a capital "I" immediately preceded by a
# letter or hyphen (i.e. NOT at the start of a word) is never legitimate
# Portuguese capitalization -- but unlike Ihe/Ihes we don't auto-correct
# these since the "known-good word" context varies (Iá, Ies, and any other
# such class per docs/research/bible-texts.md). Word-initial capital I
# (Isto, Israel, Imagem, ...) is excluded on purpose: those are genuinely
# ambiguous with real words and must not be touched.
SUSPICIOUS_I_RE = re.compile(r"(?<=[a-zà-ÿ\-])I(?=[a-zà-ÿ])")
WORD_RE = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿ]+")

# Split-word artifact (report-only, never auto-fixed): a common contraction
# or short function word rendered as two whitespace-separated fragments, e.g.
# Filémon 22 "A o mesmo tempo" for "Ao mesmo tempo". Detected as two adjacent
# tokens -- a bare 1-letter fragment plus a short (<=3 letter) fragment --
# whose concatenation (lowercased) is one of these common short PT words.
# Policy is source-faithful either way (per docs/decisions.md), so this is
# never auto-corrected; it's reported so an editor can judge digitization
# artifact vs. genuine period spacing on a case-by-case basis.
SPLIT_WORD_TARGETS = {
    "ao",
    "aos",
    "de",
    "do",
    "da",
    "dos",
    "das",
    "no",
    "na",
    "nos",
    "nas",
    "em",
}
SPLIT_WORD_RE = re.compile(r"\b([A-Za-zà-ÿ])\s+([a-zà-ÿ]{1,3})\b")


@dataclass
class OcrFix:
    osis: str
    chapter: int
    verse: int
    before: str
    after: str


@dataclass
class OcrAmbiguous:
    osis: str
    chapter: int
    verse: int
    word: str
    context: str


@dataclass
class SplitWordAnomaly:
    osis: str
    chapter: int
    verse: int
    fragment: str
    reconstructed: str
    context: str


@dataclass
class BookResult:
    slug: str
    osis: str
    name: str
    abbrevs: list[str]
    order: int
    chapters: list[dict] = field(default_factory=list)
    source_url: str = ""


def slugify_cache_name(slug: str, part: str) -> str:
    return f"{slug}__{part}.html"


#: How this scraper conducts itself toward liriocatolico.com.br. The source
#: publishes no robots.txt and so states no Crawl-delay; 2.0s is a floor we
#: chose, and it is declared here rather than shared so that it cannot drift
#: into meaning the same thing as vatican.va's, which is a commitment.
#: No retry: one book per request, and a failed book is a reason to stop.
SOURCE_POLICY = FetchPolicy(user_agent=USER_AGENT, delay=MIN_REQUEST_INTERVAL)


def make_fetcher(client: httpx.Client) -> Fetcher:
    """This scraper's fetcher: the shared skeleton, SOURCE_POLICY's conduct.

    The cache holds this source's pages as UTF-8 text, which the shared
    fetcher stores as the bytes it received -- the same bytes, since `decode`
    below is where they become a string. What used to be a module-level
    `_last_request_at` is now the fetcher's own clock, so the politeness floor
    travels with the thing that does the requesting instead of with the
    module."""
    return Fetcher(
        raw_dir(),
        SOURCE_POLICY,
        transport=httpx_transport(client),
        decode=lambda data: data.decode("utf-8"),
    )


# ---------------------------------------------------------------------------
# Corrections layer (docs/corpus-schema.md #Corrections, docs/decisions.md
# #Corrections and overrides)
#
# Verified source defects (OCR artifacts, split words) are corrected here via
# an auditable data file rather than by hand-editing output. Entries live in
# pipeline/corrections/bible.matos-soares.pt.json (committed to the repo);
# each carries a locator, exact before/after text, reason, and evidence. This
# scraper applies them post-parse (after clean_text has already run its own
# safe/ambiguous/split-word detection), verifying the "from" text still
# matches exactly -- a mismatch means the source has drifted since the entry
# was authored, and the run fails loudly rather than silently applying a
# stale fix. Entries carrying a "resolution" field (e.g. "not-a-defect",
# "unresolved") are documented but never applied; they're carried through to
# the receipt's "unresolved" list instead.
# ---------------------------------------------------------------------------


def parse_index(html: str) -> list[dict]:
    """Enumerate books from the index page's book-card blocks."""
    soup = BeautifulSoup(html, "lxml")
    books = []
    for card in soup.select("div.book-card"):
        h3 = card.find("h3")
        if h3 is None:
            continue
        sup = h3.find("sup")
        abbrev = sup.get_text(strip=True) if sup else ""
        # name is h3 text minus the <sup> abbrev suffix
        h3_copy = BeautifulSoup(str(h3), "lxml").h3
        if h3_copy.find("sup"):
            h3_copy.find("sup").extract()
        name = h3_copy.get_text(strip=True)

        completo_a = card.select_one('a[href*="/completo/"]')
        if completo_a is None:
            continue
        href = completo_a["href"]
        slug = href.rstrip("/").split("/")[-2]
        books.append({"slug": slug, "name": name, "abbrev": abbrev})
    return books


@dataclass
class ChapterParse:
    verses: list[tuple[int, str]] = field(default_factory=list)
    # (before_verse, text) -- section headings the source prints inside a
    # chapter, ahead of a given verse. None of the books sampled so far
    # (Filémon, João, Gênesis, Salmos) print any -- every direct child of
    # chapter-box is either the h2 chapter title or a numbered verse <p> --
    # but this is checked structurally per book rather than assumed, since
    # the full 73-book crawl may hit a book that does.
    headings: list[tuple[int | None, str]] = field(default_factory=list)


def parse_chapters(html: str) -> dict[int, ChapterParse]:
    """Parse chapter-box blocks into {chapter_n: ChapterParse}."""
    soup = BeautifulSoup(html, "lxml")
    chapters: dict[int, ChapterParse] = {}
    for cb in soup.select("div.chapter-box"):
        h2 = cb.select_one('h2[id^="cap-"]')
        if h2 is None:
            continue
        chap_n = int(h2["id"].removeprefix("cap-"))
        result = ChapterParse()
        pending_heading: list[str] = []
        for child in cb.find_all(recursive=False):
            if child is h2:
                continue
            if child.name == "p":
                strong = child.find("strong")
                small = strong.find("small") if strong else None
                verse_text_num = small.get_text(strip=True) if small else ""
                if strong is not None and verse_text_num.isdigit():
                    verse_n = int(verse_text_num)
                    strong.extract()
                    for a in child.find_all("a"):
                        a.extract()
                    text = child.get_text(" ", strip=True)
                    if pending_heading:
                        result.headings.append((verse_n, " ".join(pending_heading)))
                        pending_heading = []
                    result.verses.append((verse_n, text))
                    continue
            # Not a recognized verse paragraph -- candidate section heading.
            text = child.get_text(" ", strip=True)
            if text:
                pending_heading.append(text)
        if pending_heading:
            # Heading text with no following verse in this chapter (e.g. a
            # trailing note) -- still record it, unattached.
            result.headings.append((None, " ".join(pending_heading)))
        if result.verses or result.headings:
            chapters[chap_n] = result
    return chapters


def clean_text(
    raw: str,
    osis: str,
    chapter: int,
    verse: int,
    fixes: list[OcrFix],
    ambiguous: list[OcrAmbiguous],
    split_words: list[SplitWordAnomaly],
) -> str:
    text = FOOTNOTE_RE.sub("", raw)
    text = WHITESPACE_RE.sub(" ", text).strip()

    def apply_safe_fix(m: re.Match) -> str:
        before = m.group(0)
        after = SAFE_OCR_FIXES[before]
        fixes.append(
            OcrFix(osis=osis, chapter=chapter, verse=verse, before=before, after=after)
        )
        return after

    text = SAFE_OCR_RE.sub(apply_safe_fix, text)

    # Report (don't fix) any other mid-word/after-hyphen capital I.
    for m in SUSPICIOUS_I_RE.finditer(text):
        idx = m.start()
        # find enclosing word for context
        word_match = None
        for wm in WORD_RE.finditer(text):
            if wm.start() <= idx < wm.end():
                word_match = wm
                break
        word = word_match.group(0) if word_match else text[max(0, idx - 5) : idx + 5]
        ambiguous.append(
            OcrAmbiguous(
                osis=osis, chapter=chapter, verse=verse, word=word, context=text
            )
        )

    # Report (don't fix) split-word artifacts, e.g. "a o" for "ao".
    for m in SPLIT_WORD_RE.finditer(text):
        first, second = m.group(1), m.group(2)
        joined = (first + second).lower()
        if joined in SPLIT_WORD_TARGETS:
            split_words.append(
                SplitWordAnomaly(
                    osis=osis,
                    chapter=chapter,
                    verse=verse,
                    fragment=m.group(0),
                    reconstructed=joined,
                    context=text,
                )
            )

    return text


def build_book(
    fetcher: Fetcher,
    slug: str,
    name: str,
    site_abbrev: str,
    order: int,
    fixes: list[OcrFix],
    ambiguous: list[OcrAmbiguous],
    split_words: list[SplitWordAnomaly],
    only_chapter: int | None = None,
) -> BookResult:
    """Fetch and parse one book. `only_chapter`, when set, keeps only that
    chapter number in the output (used by --sample to limit São João to
    chapter 1) -- the fetch itself always uses the whole-book "completo"
    page, the same one the full crawl uses, so the sample exercises the
    real parsing path rather than a page layout the full crawl never hits.
    (Per-chapter pages like /{slug}/1/ use a different, wrapper-less DOM --
    no div.chapter-box/h2#cap-N -- so they are not used here at all.)
    """
    osis = SLUG_TO_OSIS[slug]
    url = urljoin(BASE_URL, f"{slug}/completo/")
    cache_name = slugify_cache_name(slug, "completo")

    html = fetcher.fetch_str(url, cache_name)
    parsed = parse_chapters(html)

    chapters_out = []
    for chap_n in sorted(parsed):
        if only_chapter is not None and chap_n != only_chapter:
            continue
        chap_parse = parsed[chap_n]
        verses_out = []
        for verse_n, raw_text in chap_parse.verses:
            text = clean_text(
                raw_text, osis, chap_n, verse_n, fixes, ambiguous, split_words
            )
            if not text:
                continue  # empty text is invalid per schema; omit rather than emit
            verses_out.append({"n": verse_n, "text": text})
        if not verses_out:
            continue
        chapter_dict = {"n": chap_n, "verses": verses_out}
        if chap_parse.headings:
            chapter_dict["headings"] = [
                {
                    "before_verse": before_verse,
                    "text": FOOTNOTE_RE.sub("", text).strip(),
                }
                for before_verse, text in chap_parse.headings
            ]
        chapters_out.append(chapter_dict)

    abbrevs = sorted({site_abbrev.lower()})
    return BookResult(
        slug=slug,
        osis=osis,
        name=name,
        abbrevs=abbrevs,
        order=order,
        chapters=chapters_out,
        source_url=url,
    )


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

BAD_CONTENT_RE = re.compile(r"\[[ivxlcdm]{1,7}\]|<|�|  ", re.IGNORECASE)


def validate_books(books: list[BookResult], full_run: bool) -> tuple[bool, list[str]]:
    problems: list[str] = []

    if full_run and len(books) != 73:
        problems.append(f"expected 73 books, got {len(books)}")

    for b in books:
        expected = EXPECTED_CHAPTERS.get(b.osis)
        # Chapter-count sanity only applies to a full crawl -- --sample
        # deliberately truncates some books to a single chapter.
        if full_run and expected is not None and len(b.chapters) != expected:
            problems.append(
                f"{b.osis}: expected {expected} chapters, got {len(b.chapters)}"
            )

        for chap in b.chapters:
            if not chap["verses"]:
                problems.append(f"{b.osis} ch.{chap['n']}: has zero verses")
            else:
                # A chapter's first verse begins a sentence, so its first letter
                # must be capitalized. This is a genuine oracle rather than a
                # style preference: across all 73 books there are 1,300-odd
                # chapter openings and, once the entries below were authored,
                # exactly zero exceptions -- so a lowercase opening is always a
                # defect, never a legitimate reading.
                #
                # It found five, all lost capitals in the source HTML rather
                # than parser damage: exod 14:1, exod 25:1, num 18:1, num 34:1
                # ("o Senhor...") and sir 41:1 ("ó morte"). Each is corrected via
                # pipeline/corrections/ and evidenced there.
                #
                # This runs AFTER apply_corrections, which is what makes it
                # useful: the five above pass, and a newly-scraped sixth fails
                # the run until someone adjudicates it into the corrections file.
                # Digits are exempt (isalnum but never cased), as are chapters
                # opening on punctuation, which chapter_opening_letter skips.
                opening = chapter_opening_letter(chap["verses"][0]["text"])
                if opening is not None and opening.islower():
                    problems.append(
                        f"{b.osis} {chap['n']}:{chap['verses'][0]['n']}: chapter opens on "
                        f"lowercase {opening!r} -- likely a lost capital in the source; "
                        "adjudicate into pipeline/corrections/ rather than editing text"
                    )

            for v in chap["verses"]:
                if BAD_CONTENT_RE.search(v["text"]):
                    problems.append(
                        f"{b.osis} {chap['n']}:{v['n']}: leftover markup/marker/mojibake in text"
                    )

    return (len(problems) == 0, problems)


def print_summary_table(books: list[BookResult]) -> None:
    print(f"\n{'osis':<8}{'name':<24}{'chapters':>10}{'verses':>10}")
    print("-" * 52)
    total_chapters = 0
    total_verses = 0
    for b in books:
        n_chapters = len(b.chapters)
        n_verses = sum(len(c["verses"]) for c in b.chapters)
        total_chapters += n_chapters
        total_verses += n_verses
        print(f"{b.osis:<8}{b.name:<24}{n_chapters:>10}{n_verses:>10}")
    print("-" * 52)
    print(f"{'TOTAL':<8}{'':<24}{total_chapters:>10}{total_verses:>10}\n")


# ---------------------------------------------------------------------------
# Manifest / output
# ---------------------------------------------------------------------------


def book_payloads(books: list[BookResult]) -> dict[str, dict]:
    """`books/{osis}.json -> payload`, keyed relative to the work directory so
    common.write_stamped_json can judge the books and the manifest together."""
    return {
        f"books/{b.osis}.json": {
            "osis": b.osis,
            "name": b.name,
            "abbrevs": b.abbrevs,
            "order": b.order,
            "chapters": b.chapters,
        }
        for b in books
    }


#: The transcription this edition's VERSES come from; the apparatus is a
#: second source, listed separately in the manifest.
TEXT_SOURCE_URL = "https://www.liriocatolico.com.br/biblia_online/biblia_matos_soares/"


def fetched_on() -> str:
    """The date the TEXT was fetched, which a re-run does not change.

    Same rule and the same reason as `retrieved_at` in douay_rheims.py: a run
    that reads the cache rewrites the manifest without touching the network,
    and stamping today would claim a retrieval that did not happen.
    `generated_at` already says when the parse ran.
    """
    recorded = captured_at(raw_dir() / "index.html")
    if recorded:
        return recorded
    existing = work_dir() / "manifest.json"
    if existing.exists():
        try:
            prior = json.loads(existing.read_text(encoding="utf-8"))
            for source in prior.get("sources") or []:
                if "liriocatolico" in (source.get("url") or ""):
                    stamp = source.get("retrieved_at")
                    if isinstance(stamp, str) and stamp:
                        return stamp
        except (json.JSONDecodeError, OSError):
            pass
    return datetime.now(UTC).date().isoformat()


def write_manifest(
    books: list[BookResult],
    books_json: dict[str, dict],
    receipt: dict,
    sample: bool,
    fix_count: int,
    ambiguous_count: int,
    split_word_count: int,
    corrections_applied: int,
    apparatus: dict[str, int],
    generated_at: str,
) -> None:
    if sample_run_writes_nothing(sample):
        return
    retrieved_at = fetched_on()
    note_count = apparatus["notes"]
    anchored_count = apparatus["anchored"]
    summary_count = apparatus["summaries"]
    heading_count = apparatus["headings"]

    notes = (
        "1956 edition (revised from the original languages with L. G. da Fonseca SJ, "
        "Pontifical Biblical Institute), not the 1932 Vulgate-only translation. "
        'Diagnostics confirmed against this scrape: John 1:42 reads "filho de João" '
        '(not "filho de Jonas"); Luke 1:28 omits "bendita és tu entre as mulheres". '
        'Psalter follows the Pius XII "Pian Psalter" line. Pre-1990-Agreement Portuguese '
        "orthography (baptizar, Unigénito, rectas, etc.) is preserved as printed -- not "
        "modernized. TWO SOURCES: the verses are liriocatolico's, which prints the "
        "edition's footnote markers ([i], [ii], ...) and not their text -- those markers "
        "are stripped -- and the apparatus is vulgata.online's transcription of the same "
        f"1956 printing (edition code MS), joined on (book, chapter, verse): {note_count} "
        f"footnotes, {summary_count} chapter arguments and {heading_count} headings. The "
        "text was NOT re-sourced from it, and deliberately: 98.01% of verses agree, but "
        "247 are missing from that transcription -- Job 32 stops at 14 of 22 and Esdras "
        "6:9-13 is overwritten by a duplicate of Esdras 4:9-13 (docs/research/"
        "matos-soares-re-sourcing.md). Each note is anchored where its own lemma ends in "
        f"OUR verse rather than at a transplanted offset, which places {anchored_count} of "
        "them; the rest quote nothing to anchor to, or quote words this transcription "
        "does not have, and sit on the verse without a token as the schema allows. "
        f'OCR artifact class (capital I for lowercase l, e.g. "Ihe"/"Ihes"): '
        f"{fix_count} unambiguous instance(s) auto-corrected in code (widespread, "
        f"never-a-valid-word tokens), plus {ambiguous_count} other mid-word-capital-I "
        "instance(s) detected per verse -- most now fixed via the auditable "
        "pipeline/corrections/bible.matos-soares.pt.json corrections layer (see "
        "corrections-applied.json for the exact list, incl. the automatic Ihe/Ihes "
        "fixes flagged rule=auto-Ihe), with any remaining false positives documented "
        "there as resolution=not-a-defect rather than corrected. Split-word artifact "
        "class (a common short word rendered as two whitespace-separated fragments, "
        f'e.g. Filémon 22 "A o mesmo tempo" for "Ao mesmo tempo"): {split_word_count} '
        "instance(s) detected per verse, individually adjudicated in the corrections "
        "file (genuine contractions corrected; verified legitimate word sequences, "
        "e.g. clitic-pronoun + subject inversions like Gen 16:7 'Tendo-a o anjo...', "
        "documented as resolution=not-a-defect). See corrections-applied.json for the "
        "full receipt. Copyright status: see docs/research/copyright.md -- accepted "
        "as a knowingly self-resolving exposure until the work enters the public "
        "domain on 1 Jan 2028."
    )
    manifest = {
        "id": "bible.matos-soares.pt",
        "type": "bible",
        "title": "Bíblia Sagrada (Matos Soares)",
        "short_title": "Matos Soares",
        "language": "pt",
        "edition": "1956 (revised from the original languages)",
        "sources": [
            {"url": TEXT_SOURCE_URL, "retrieved_at": retrieved_at},
            # The apparatus. Listed as a source because it is one: a reader
            # following provenance for a footnote must arrive here and not at
            # liriocatolico, which does not carry it.
            {
                "url": "https://vulgata.online/bible/Gn.1?ed=MS",
                "retrieved_at": "2026-08-25",
            },
        ],
        "copyright": {
            "status": "copyrighted",
            # The TRANSLATOR, not a current rights holder, because we do not
            # know who the current rights holder is. This said "Herdeiros de
            # Pe. Manuel de Matos Soares" until 2026-08-24, which was a
            # composed inference and not a transcription: liriocatolico prints
            # no rights statement at all (hence `notice: None`), and
            # docs/research/copyright.md §4 records reprint rights as
            # commercially active, which points at least as plausibly to a
            # publisher holding an assignment as to the estate. Naming the
            # author is the convention for a protected work whose current
            # holder is unknown, and it is the person the term is measured
            # from either way — an assignment does not move the life+70 clock.
            #
            # The public-domain date is documented in `notes` above and in
            # docs/research/copyright.md, not smuggled into the holder name —
            # `holder` is a plain attribution string, not a status summary.
            "holder": "Manuel de Matos Soares",
            "notice": None,
        },
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b.osis for b in books],
        "corrections_applied": corrections_applied,
    }
    write_stamped_json(
        work_dir(),
        {"manifest.json": manifest, "corrections-applied.json": receipt, **books_json},
        generated_at,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def attach_apparatus(
    books: list[BookResult], *, sample: bool
) -> tuple[list[str], dict[str, int]]:
    """Fasten the edition's own apparatus onto the verses just parsed.

    WHY THE APPARATUS COMES FROM ANOTHER SOURCE. liriocatolico prints this
    edition's footnote MARKERS and not their text -- `[i]`, `[ii]`, stripped
    here at ingestion since 2026-08-16 with the manifest recording the gap.
    vulgata.online transcribes the same 1956 printing WITH the notes. What it
    does not have is a complete text: 247 verses are missing from it, Job 32
    stops at 14 of 22, and Esdras 6:9-13 is overwritten by a duplicate of
    Esdras 4:9-13. So the text stays ours and only the apparatus travels
    (`docs/research/matos-soares-re-sourcing.md`).

    JOINED ON THE ADDRESS, ANCHORED BY THE LEMMA. `(osis, chapter, verse)` is
    what the two transcriptions agree about; the marker positions are not,
    since ours were discarded. Each note instead names the words it glosses,
    and `anchor_notes` finds that phrase in OUR verse and puts the token where
    it ends -- so the anchor is derived from the text that ships rather than
    transplanted from text that does not.

    NOTHING IS PLACED BY GUESS. A note whose lemma is not in our verse gets no
    token and is still attached to the verse, which the schema allows outright
    ("every token must have a note; a note need not have a token"). A note
    naming a verse we do not have is DROPPED and counted -- there is no
    address to hang it from, and the count is the check that the two sources
    have not drifted apart.

    Returns `(report lines, counts)`. The counts go into the manifest, because
    "how much apparatus does this work carry, and how much of it is anchored"
    is a property of the work rather than of the run that built it.
    """
    apparatus = ms_apparatus.apparatus(offline=True)

    attached = anchored = no_lemma = not_found = 0
    orphan_notes: list[str] = []
    orphan_headings = 0
    summaries = headings_kept = 0
    for book in books:
        per_chapter = apparatus.get(book.osis, {})
        for chapter in book.chapters:
            entry = per_chapter.get(chapter["n"])
            if not entry:
                continue
            if entry.get("summary"):
                chapter["summary"] = entry["summary"]
                summaries += 1

            by_n = {v["n"]: v for v in chapter["verses"]}
            for vn, notes in (entry.get("notes") or {}).items():
                verse = by_n.get(vn)
                if verse is None:
                    orphan_notes.append(f"{book.osis} {chapter['n']}:{vn}")
                    continue
                marked, bare, missed = anchor_notes(verse["text"], notes)
                verse["notes"] = notes
                if marked:
                    verse["text_marked"] = marked
                attached += len(notes)
                no_lemma += len(bare)
                not_found += len(missed)
                anchored += len(notes) - len(bare) - len(missed)

            # A heading names the verse it precedes, so one naming a verse we
            # do not have has nowhere to sit. Dropped rather than moved: its
            # position is the only thing it asserts.
            kept = [
                h for h in (entry.get("headings") or []) if h["before_verse"] in by_n
            ]
            orphan_headings += len(entry.get("headings") or []) - len(kept)
            if kept:
                chapter["headings"] = kept
                headings_kept += len(kept)

    scope = "sample" if sample else "full run"
    report = [
        f"Apparatus ({scope}) from vulgata.online, joined by address:",
        (
            f"  {attached} note(s) attached, {anchored} of them anchored in the text "
            f"by their lemma"
        ),
        (
            f"  {no_lemma} note(s) quote nothing to anchor to and {not_found} quote "
            "words this transcription does not have; both keep the verse and lose "
            "only the token"
        ),
        f"  {summaries} chapter argument(s), {headings_kept} heading(s)",
    ]
    if orphan_notes:
        report.append(
            f"  {len(orphan_notes)} note(s) named a verse this edition does not have "
            f"and were dropped: {', '.join(orphan_notes[:12])}"
            + (f" (+{len(orphan_notes) - 12} more)" if len(orphan_notes) > 12 else "")
        )
    if orphan_headings:
        report.append(
            f"  {orphan_headings} heading(s) named a verse this edition does not have "
            "and were dropped"
        )
    counts = {
        "notes": attached,
        "anchored": anchored,
        "summaries": summaries,
        "headings": headings_kept,
    }
    return report, counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Process only Filémon (full) and São João chapter 1. For review before the full crawl.",
    )
    args = parser.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    fixes: list[OcrFix] = []
    ambiguous: list[OcrAmbiguous] = []
    split_words: list[SplitWordAnomaly] = []
    with httpx.Client(follow_redirects=True) as client:
        fetcher = make_fetcher(client)
        index_html = fetcher.fetch_str(BASE_URL, "index.html")
        index_books = parse_index(index_html)
        index_by_slug = {b["slug"]: b for b in index_books}

        missing = [slug for slug, _, _ in BOOK_MAP if slug not in index_by_slug]
        if missing:
            print(
                f"WARNING: slugs in BOOK_MAP not found on index page: {missing}",
                file=sys.stderr,
            )

        if args.sample:
            selected = [
                (slug, osis, i + 1)
                for i, (slug, osis, _) in enumerate(BOOK_MAP)
                if slug in SAMPLE_SLUGS
            ]
        else:
            selected = [
                (slug, osis, i + 1) for i, (slug, osis, _) in enumerate(BOOK_MAP)
            ]

        books: list[BookResult] = []
        for slug, osis, order in selected:
            info = index_by_slug.get(slug, {"name": slug, "abbrev": osis})
            only_chapter = 1 if (args.sample and slug == "sao-joao") else None
            book = build_book(
                fetcher,
                slug,
                info["name"],
                info["abbrev"],
                order,
                fixes,
                ambiguous,
                split_words,
                only_chapter=only_chapter,
            )
            books.append(book)
            print(f"fetched {slug} -> {osis}: {len(book.chapters)} chapter(s)")

    # ONE FILE, TWO LAYERS. `pipeline/corrections/bible.matos-soares.pt.json`
    # holds corrections against BOTH sources this work is built from, and they
    # are told apart by the shape of their locator rather than by living in
    # separate files: a `{osis, chapter, verse}` locator corrects the verse
    # text this scraper produces, and a `{osis, chapter, record}` one corrects
    # a record of the vulgata.online apparatus before it is parsed
    # (`matos_soares_apparatus.py`, which filters for exactly the complement of
    # this). Splitting them by file would have meant a second work id for
    # something that is not a second work.
    corrections = load_corrections(WORK_ID)
    verse_corrections = [c for c in corrections if "record" not in c["locator"]]
    try:
        file_applied, _seen = apply_verse_corrections(
            ((b.osis, b.chapters) for b in books),
            verse_corrections,
            full_run=not args.sample,
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1

    generated_at = (
        datetime.now(UTC).isoformat(timespec="seconds").replace("+00:00", "Z")
    )
    # The Ihe/Ihes auto-fix (SAFE_OCR_FIXES, applied inside clean_text during
    # parsing) is unambiguous and widespread enough to run automatically --
    # but it's still a source-defect correction and belongs in the same
    # auditable receipt as the file-sourced ones, flagged by rule so the two
    # provenances stay distinguishable.
    auto_ihe_applied = [
        {
            "id": f"matos.pt-auto-ihe-{f.osis}.{f.chapter}.{f.verse}",
            "rule": "auto-Ihe",
            "locator": {"osis": f.osis, "chapter": f.chapter, "verse": f.verse},
            "field": "verse_text",
            "from": f.before,
            "to": f.after,
            "reason": "capital I for lowercase l in 'Ihe'/'Ihes' -- never a valid Portuguese "
            "token, auto-corrected unconditionally.",
        }
        for f in fixes
    ]
    all_applied = auto_ihe_applied + file_applied
    receipt = corrections_receipt(WORK_ID, all_applied, verse_corrections, generated_at)
    corrections_count = receipt["count"]

    apparatus_report, apparatus_counts = attach_apparatus(books, sample=args.sample)
    print()
    for line in apparatus_report:
        print(line)

    write_manifest(
        books,
        book_payloads(books),
        receipt,
        sample=args.sample,
        fix_count=len(fixes),
        ambiguous_count=len(ambiguous),
        split_word_count=len(split_words),
        corrections_applied=corrections_count,
        apparatus=apparatus_counts,
        generated_at=generated_at,
    )

    ok, problems = validate_books(books, full_run=not args.sample)

    print_summary_table(books)

    print(
        f"Network requests: {fetcher.network_fetches}, cache hits: {fetcher.cache_hits}"
    )

    print(f"\nOCR auto-fixes applied ({len(fixes)}):")
    for f in fixes:
        print(f"  {f.osis} {f.chapter}:{f.verse}  {f.before!r} -> {f.after!r}")

    print(
        f"\nAmbiguous OCR-suspect occurrences detected at parse time ({len(ambiguous)}) "
        "-- most now resolved via pipeline/corrections/, see corrections-applied.json:"
    )
    for a in ambiguous[:200]:
        print(f"  {a.osis} {a.chapter}:{a.verse}  word={a.word!r}")
    if len(ambiguous) > 200:
        print(f"  ... and {len(ambiguous) - 200} more")

    print(
        f"\nSplit-word artifact occurrences detected at parse time ({len(split_words)}) "
        "-- individually adjudicated via pipeline/corrections/, see corrections-applied.json:"
    )
    for s in split_words[:200]:
        print(
            f"  {s.osis} {s.chapter}:{s.verse}  {s.fragment!r} -> {s.reconstructed!r}"
        )
    if len(split_words) > 200:
        print(f"  ... and {len(split_words) - 200} more")

    print(
        f"\nCorrections layer: {len(all_applied)} applied "
        f"({len(auto_ihe_applied)} auto-Ihe + {len(file_applied)} from corrections file), "
        f"{len([c for c in corrections if c.get('resolution')])} documented unresolved/"
        "not-a-defect (see corrections-applied.json)"
    )

    books_with_headings = [
        b.osis for b in books if any(c.get("headings") for c in b.chapters)
    ]
    print(f"\nBooks with in-chapter section headings: {books_with_headings or 'none'}")

    if problems:
        print(f"\nVALIDATION FAILED ({len(problems)} problem(s)):")
        for p in problems:
            print(f"  - {p}")
    else:
        print("\nVALIDATION PASSED")

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
