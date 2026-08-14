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
    uv run pipeline/scrapers/matos_soares.py --sample   # small slice, for review
    uv run pipeline/scrapers/matos_soares.py            # full 73-book crawl

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
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://www.liriocatolico.com.br/biblia_online/biblia_matos_soares/"
USER_AGENT = "Depositum corpus builder"
MIN_REQUEST_INTERVAL = (
    2.0  # seconds, politeness floor (source has no robots.txt Crawl-delay)
)

REPO_ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = REPO_ROOT / "corpus" / "raw" / "matos-soares"
WORK_DIR = REPO_ROOT / "corpus" / "works" / "bible.matos-soares.pt"
BOOKS_DIR = WORK_DIR / "books"

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
class FetchStats:
    network_requests: int = 0
    cache_hits: int = 0


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


def fetch(client: httpx.Client, url: str, cache_name: str, stats: FetchStats) -> str:
    """Fetch `url`, using and populating the on-disk cache. Politeness delay
    only applies to actual network fetches, never to cache hits."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = RAW_DIR / cache_name
    if cache_path.exists():
        stats.cache_hits += 1
        return cache_path.read_text(encoding="utf-8")

    global _last_request_at
    elapsed = time.monotonic() - _last_request_at
    if elapsed < MIN_REQUEST_INTERVAL:
        time.sleep(MIN_REQUEST_INTERVAL - elapsed)
    resp = client.get(url, headers={"User-Agent": USER_AGENT}, timeout=30.0)
    resp.raise_for_status()
    _last_request_at = time.monotonic()
    stats.network_requests += 1

    html = resp.text
    cache_path.write_text(html, encoding="utf-8")
    return html


_last_request_at: float = 0.0


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
    client: httpx.Client,
    stats: FetchStats,
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

    html = fetch(client, url, cache_name, stats)
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


def write_book_files(books: list[BookResult]) -> None:
    BOOKS_DIR.mkdir(parents=True, exist_ok=True)
    for b in books:
        payload = {
            "osis": b.osis,
            "name": b.name,
            "abbrevs": b.abbrevs,
            "order": b.order,
            "chapters": b.chapters,
        }
        out_path = BOOKS_DIR / f"{b.osis}.json"
        out_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )


def write_manifest(
    books: list[BookResult],
    sample: bool,
    fix_count: int,
    ambiguous_count: int,
    split_word_count: int,
) -> None:
    retrieved_at = datetime.now(timezone.utc).date().isoformat()
    generated_at = (
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    )

    notes = (
        "1956 edition (revised from the original languages with L. G. da Fonseca SJ, "
        "Pontifical Biblical Institute), not the 1932 Vulgate-only translation. "
        'Diagnostics confirmed against this scrape: John 1:42 reads "filho de João" '
        '(not "filho de Jonas"); Luke 1:28 omits "bendita és tu entre as mulheres". '
        'Psalter follows the Pius XII "Pian Psalter" line. Pre-1990-Agreement Portuguese '
        "orthography (baptizar, Unigénito, rectas, etc.) is preserved as printed -- not "
        "modernized. Footnote markers ([i], [ii], ...) stripped from verse text; footnote "
        "CONTENT is not available on this source (liriocatolico prints markers only, no "
        "note text) -- no notes[] are captured here. Possible future enrichment: "
        "vulgata.online carries Matos Soares footnotes and could backfill notes[] by "
        "marker position in a later pass. "
        f'OCR artifact class (capital I for lowercase l, e.g. "Ihe"/"Ihes"): '
        f"{fix_count} unambiguous instance(s) auto-corrected, {ambiguous_count} ambiguous "
        "instance(s) detected and left as scraped for manual review (see scraper stdout "
        "report). Split-word artifact class (a common short word rendered as two "
        'whitespace-separated fragments, e.g. Filémon 22 "A o mesmo tempo" for "Ao mesmo '
        f'tempo"): {split_word_count} instance(s) detected and left as scraped -- policy is '
        "source-faithful either way (digitization artifact vs. genuine period spacing is "
        "not adjudicated here), see scraper stdout report for the full list. Copyright "
        "status: see docs/research/copyright.md -- accepted as a knowingly self-resolving "
        "exposure until the work enters the public domain on 1 Jan 2028."
    )
    if sample:
        notes = (
            "SAMPLE RUN (--sample): partial corpus, not the full 73-book crawl. "
            + notes
        )

    manifest = {
        "id": "bible.matos-soares.pt",
        "type": "bible",
        "title": "Bíblia Sagrada (Matos Soares)",
        "short_title": "Matos Soares",
        "language": "pt",
        "edition": "1956 (revised from the original languages)",
        "sources": [
            {
                "url": "https://www.liriocatolico.com.br/biblia_online/biblia_matos_soares/",
                "retrieved_at": retrieved_at,
            }
        ],
        "copyright": {
            "status": "copyrighted",
            "holder": "Herdeiros de Pe. Manuel de Matos Soares (domínio público em 1 Jan 2028)",
            "notice": None,
        },
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b.osis for b in books],
    }
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    (WORK_DIR / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Process only Filémon (full) and São João chapter 1. For review before the full crawl.",
    )
    args = parser.parse_args()

    fixes: list[OcrFix] = []
    ambiguous: list[OcrAmbiguous] = []
    split_words: list[SplitWordAnomaly] = []
    stats = FetchStats()

    with httpx.Client(follow_redirects=True) as client:
        index_html = fetch(client, BASE_URL, "index.html", stats)
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
                client,
                stats,
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

    write_book_files(books)
    write_manifest(
        books,
        sample=args.sample,
        fix_count=len(fixes),
        ambiguous_count=len(ambiguous),
        split_word_count=len(split_words),
    )

    ok, problems = validate_books(books, full_run=not args.sample)

    print_summary_table(books)

    print(f"Network requests: {stats.network_requests}, cache hits: {stats.cache_hits}")

    print(f"\nOCR auto-fixes applied ({len(fixes)}):")
    for f in fixes:
        print(f"  {f.osis} {f.chapter}:{f.verse}  {f.before!r} -> {f.after!r}")

    print(
        f"\nAmbiguous OCR-suspect occurrences, reported not fixed ({len(ambiguous)}):"
    )
    for a in ambiguous[:200]:
        print(f"  {a.osis} {a.chapter}:{a.verse}  word={a.word!r}")
    if len(ambiguous) > 200:
        print(f"  ... and {len(ambiguous) - 200} more")

    print(
        f"\nSplit-word artifact occurrences, reported not fixed ({len(split_words)}):"
    )
    for s in split_words[:200]:
        print(
            f"  {s.osis} {s.chapter}:{s.verse}  {s.fragment!r} -> {s.reconstructed!r}"
        )
    if len(split_words) > 200:
        print(f"  ... and {len(split_words) - 200} more")

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

    if args.sample:
        print(
            "\nSample run complete. Full crawl NOT executed -- rerun without --sample after review."
        )

    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
