#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""CPDV (Catholic Public Domain Version) scraper.

Source: https://sacredbible.org/catholic/ — one HTML file per book. Verses
are marked inline as ``{chapter:verse}``; chapters are marked by an anchor
like ``[<A NAME=1><A HREF=#top class=chapter>John 1</A></A>]``.

Pages are served as cp1252 ("Windows-1252") without a reliable charset
declaration in the HTTP headers, so decoding is forced to cp1252
unconditionally — trusting the transport would produce mojibake on curly
quotes/apostrophes.

Usage:
    uv run pipeline/scrapers/bible/cpdv.py              # full 73-book run
    uv run pipeline/scrapers/bible/cpdv.py --sample      # Philemon + John 1-3 only
    uv run pipeline/scrapers/bible/cpdv.py --offline     # cache-only, no network
    uv run pipeline/scrapers/bible/cpdv.py --refresh     # bypass cache, re-fetch

Caches every raw fetched page under corpus/raw/cpdv/ and is fully
offline-capable from that cache on re-runs. Ends with a validation pass
that prints a summary table and exits non-zero on failure.
"""

from __future__ import annotations

import argparse
import sys
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
    apply_verse_corrections,
    chapter_opening_letter,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    works_root,
    write_stamped_json,
)

# The page format itself lives in sacredbible.py, shared with vulgate.py --
# same operator, same hand-built template. See that module's docblock for
# where the boundary between "the template" and "this edition" is drawn.
from sacredbible import Anomaly, Fetcher, parse_book, verse_text_faults

BASE_URL = "https://sacredbible.org/catholic/"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
RATE_LIMIT_SECONDS = 1.0

RAW_SUBDIR = "cpdv"
WORK_ID = "bible.cpdv.en"


def raw_dir() -> Path:
    """This scraper's fetch cache inside the corpus checkout.

    A function, not a module constant: `common.corpus_dir()` raises when the
    corpus is missing, and doing that at import time would break `--help` and
    any tooling that merely imports this module.
    """
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    """This scraper's output directory inside the corpus checkout."""
    return works_root() / WORK_ID


WORK_ID = "bible.cpdv.en"

# (osis, filename, display name) in the schema's canonical 73-book order.
# docs/corpus-schema.md §"Canonical book order".
BOOKS: list[tuple[str, str, str]] = [
    # OT (46)
    ("gen", "OT-01_Genesis.htm", "Genesis"),
    ("exod", "OT-02_Exodus.htm", "Exodus"),
    ("lev", "OT-03_Leviticus.htm", "Leviticus"),
    ("num", "OT-04_Numbers.htm", "Numbers"),
    ("deut", "OT-05_Deuteronomy.htm", "Deuteronomy"),
    ("josh", "OT-06_Joshua.htm", "Joshua"),
    ("judg", "OT-07_Judges.htm", "Judges"),
    ("ruth", "OT-08_Ruth.htm", "Ruth"),
    ("1sam", "OT-09_1-Samuel.htm", "1 Samuel"),
    ("2sam", "OT-10_2-Samuel.htm", "2 Samuel"),
    ("1kgs", "OT-11_1-Kings.htm", "1 Kings"),
    ("2kgs", "OT-12_2-Kings.htm", "2 Kings"),
    ("1chr", "OT-13_1-Chronicles.htm", "1 Chronicles"),
    ("2chr", "OT-14_2-Chronicles.htm", "2 Chronicles"),
    ("ezra", "OT-15_Ezra.htm", "Ezra"),
    ("neh", "OT-16_Nehemiah.htm", "Nehemiah"),
    ("tob", "OT-17_Tobit.htm", "Tobit"),
    ("jdt", "OT-18_Judith.htm", "Judith"),
    ("esth", "OT-19_Esther.htm", "Esther"),
    ("1macc", "OT-45_1-Maccabees.htm", "1 Maccabees"),
    ("2macc", "OT-46_2-Maccabees.htm", "2 Maccabees"),
    ("job", "OT-20_Job.htm", "Job"),
    ("ps", "OT-21_Psalms.htm", "Psalms"),
    ("prov", "OT-22_Proverbs.htm", "Proverbs"),
    ("eccl", "OT-23_Ecclesiastes.htm", "Ecclesiastes"),
    # OT-24_Song2.htm is the plain-text primary link ("Song of Songs" on the
    # index page); OT-24_Song.htm is an alternate "in color" variant with
    # speaker names inlined via <FONT COLOR> instead of <I> — not used here.
    ("song", "OT-24_Song2.htm", "Song of Songs"),
    ("wis", "OT-25_Wisdom.htm", "Wisdom"),
    ("sir", "OT-26_Sirach.htm", "Sirach"),
    ("isa", "OT-27_Isaiah.htm", "Isaiah"),
    ("jer", "OT-28_Jeremiah.htm", "Jeremiah"),
    ("lam", "OT-29_Lamentations.htm", "Lamentations"),
    ("bar", "OT-30_Baruch.htm", "Baruch"),
    ("ezek", "OT-31_Ezekiel.htm", "Ezekiel"),
    ("dan", "OT-32_Daniel.htm", "Daniel"),
    ("hos", "OT-33_Hosea.htm", "Hosea"),
    ("joel", "OT-34_Joel.htm", "Joel"),
    ("amos", "OT-35_Amos.htm", "Amos"),
    ("obad", "OT-36_Obadiah.htm", "Obadiah"),
    ("jonah", "OT-37_Jonah.htm", "Jonah"),
    ("mic", "OT-38_Micah.htm", "Micah"),
    ("nah", "OT-39_Nahum.htm", "Nahum"),
    ("hab", "OT-40_Habakkuk.htm", "Habakkuk"),
    ("zeph", "OT-41_Zephaniah.htm", "Zephaniah"),
    ("hag", "OT-42_Haggai.htm", "Haggai"),
    ("zech", "OT-43_Zechariah.htm", "Zechariah"),
    ("mal", "OT-44_Malachi.htm", "Malachi"),
    # NT (27)
    ("matt", "NT-01_Matthew.htm", "Matthew"),
    ("mark", "NT-02_Mark.htm", "Mark"),
    ("luke", "NT-03_Luke.htm", "Luke"),
    ("john", "NT-04_John.htm", "John"),
    ("acts", "NT-05_Acts.htm", "Acts of the Apostles"),
    ("rom", "NT-06_Romans.htm", "Romans"),
    ("1cor", "NT-07_1-Corinthians.htm", "1 Corinthians"),
    ("2cor", "NT-08_2-Corinthians.htm", "2 Corinthians"),
    ("gal", "NT-09_Galatians.htm", "Galatians"),
    ("eph", "NT-10_Ephesians.htm", "Ephesians"),
    ("phil", "NT-11_Philippians.htm", "Philippians"),
    ("col", "NT-12_Colossians.htm", "Colossians"),
    ("1thess", "NT-13_1-Thessalonians.htm", "1 Thessalonians"),
    ("2thess", "NT-14_2-Thessalonians.htm", "2 Thessalonians"),
    ("1tim", "NT-15_1-Timothy.htm", "1 Timothy"),
    ("2tim", "NT-16_2-Timothy.htm", "2 Timothy"),
    ("titus", "NT-17_Titus.htm", "Titus"),
    ("phlm", "NT-18_Philemon.htm", "Philemon"),
    ("heb", "NT-19_Hebrews.htm", "Hebrews"),
    ("jas", "NT-20_James.htm", "James"),
    ("1pet", "NT-21_1-Peter.htm", "1 Peter"),
    ("2pet", "NT-22_2-Peter.htm", "2 Peter"),
    ("1john", "NT-23_1-John.htm", "1 John"),
    ("2john", "NT-24_2-John.htm", "2 John"),
    ("3john", "NT-25_3-John.htm", "3 John"),
    ("jude", "NT-26_Jude.htm", "Jude"),
    ("rev", "NT-27_Revelation.htm", "Revelation"),
]

assert len(BOOKS) == 73, f"expected 73 books in BOOKS table, got {len(BOOKS)}"

# Curated jump-box abbreviations for well-known books; anything not listed
# here falls back to [osis, name-without-spaces-lowercased].
_CURATED_ABBREVS: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lv"],
    "num": ["nm"],
    "deut": ["dt"],
    "josh": ["jos"],
    "judg": ["jdg"],
    "1sam": ["1sm"],
    "2sam": ["2sm"],
    "1kgs": ["1kg", "1ki"],
    "2kgs": ["2kg", "2ki"],
    "1chr": ["1ch"],
    "2chr": ["2ch"],
    "ps": ["psa", "psalm", "psalms"],
    "prov": ["pr"],
    "eccl": ["ecc", "qoh"],
    "song": ["sos", "canticles", "cant"],
    "isa": ["is"],
    "jer": ["jr"],
    "ezek": ["eze", "ezk"],
    "dan": ["dn"],
    "matt": ["mt"],
    "mark": ["mk", "mrk"],
    "luke": ["lk"],
    "john": ["jn", "joh"],
    "acts": ["ac"],
    "rom": ["ro"],
    "1cor": ["1co"],
    "2cor": ["2co"],
    "gal": ["ga"],
    "eph": ["ep"],
    "phil": ["php"],
    "col": ["co"],
    "phlm": ["phm"],
    "heb": ["he"],
    "jas": ["jm"],
    "1pet": ["1pt"],
    "2pet": ["2pt"],
    "1john": ["1jn"],
    "2john": ["2jn"],
    "3john": ["3jn"],
    "jude": ["jud"],
    "rev": ["re", "apoc"],
}

# Known chapter counts for sanity-checking a full (untruncated) run.
KNOWN_CHAPTER_COUNTS = {"gen": 50, "ps": 150, "matt": 28, "rev": 22, "john": 21}

SAMPLE_BOOKS = {"phlm", "john"}
SAMPLE_JOHN_CHAPTERS = {1, 2, 3}


def abbrevs_for(osis: str, name: str) -> list[str]:
    base = [osis, name.lower().replace(" ", "")]
    extra = _CURATED_ABBREVS.get(osis, [])
    seen: list[str] = []
    for a in base + extra:
        if a not in seen:
            seen.append(a)
    return seen


ANOMALIES: list[Anomaly] = []


# --------------------------------------------------------------------------
# Corrections layer (docs/corpus-schema.md #Corrections, docs/decisions.md
# #Source-defect corrections policy)
#
# Verified source defects are corrected via an auditable data file rather
# than by hand-editing output. Entries live in
# pipeline/corrections/bible.cpdv.en.json (committed to the repo, if/when
# any defect is documented for this source -- CPDV is a clean, modern
# public-domain translation with no known mechanical/typographic defects as
# of this writing, so the file is typically absent and this layer applies
# zero corrections). Loading comes from common.py; APPLYING it stays here,
# because what a correction means is per-source -- this scraper's own
# non-zero-exit drift guard is below.
# --------------------------------------------------------------------------


def run_scrape(
    sample: bool, offline: bool, refresh: bool
) -> tuple[list[dict], list[str]]:
    fetcher = Fetcher(
        base_url=BASE_URL,
        raw_dir=raw_dir(),
        user_agent=USER_AGENT,
        rate_limit_seconds=RATE_LIMIT_SECONDS,
        offline=offline,
        refresh=refresh,
    )
    book_docs: list[dict] = []
    fetched_files: list[str] = []
    try:
        for order, (osis, filename, name) in enumerate(BOOKS, start=1):
            if sample and osis not in SAMPLE_BOOKS:
                continue
            raw_html = fetcher.fetch(filename)
            fetched_files.append(filename)
            chapters, anomalies = parse_book(osis, raw_html)
            ANOMALIES.extend(anomalies)
            if sample and osis == "john":
                chapters = [c for c in chapters if c["n"] in SAMPLE_JOHN_CHAPTERS]
            book_docs.append(
                {
                    "osis": osis,
                    "name": name,
                    "abbrevs": abbrevs_for(osis, name),
                    "order": order,
                    "chapters": chapters,
                }
            )
    finally:
        fetcher.close()
    return book_docs, fetched_files


def validate(book_docs: list[dict], sample: bool) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    def fail(msg: str):
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    if not sample:
        if len(book_docs) != 73:
            fail(f"expected 73 books, got {len(book_docs)}")
        present = {b["osis"] for b in book_docs}
        expected = {b[0] for b in BOOKS}
        missing = expected - present
        if missing:
            fail(f"missing books: {sorted(missing)}")

    truncated = {"john"} if sample else set()
    for b in book_docs:
        osis = b["osis"]
        if osis in KNOWN_CHAPTER_COUNTS and osis not in truncated:
            expected_n = KNOWN_CHAPTER_COUNTS[osis]
            got_n = len(b["chapters"])
            if got_n != expected_n:
                fail(f"{osis}: expected {expected_n} chapters, got {got_n}")

        for ch in b["chapters"]:
            if not ch["verses"]:
                fail(f"{osis} chapter {ch['n']}: no verses")
            else:
                # A chapter's first verse begins a sentence, so its first letter
                # must be capitalized. The same check on the Portuguese edition
                # found five lost capitals in that source (see
                # pipeline/corrections/bible.matos-soares.pt.json); this edition
                # currently has none, which is exactly why it belongs here --
                # the check is cheap and its value is catching the sixth.
                opening = chapter_opening_letter(ch["verses"][0]["text"])
                if opening is not None and opening.islower():
                    fail(
                        f"{osis} {ch['n']}:{ch['verses'][0]['n']}: chapter opens on "
                        f"lowercase {opening!r} -- likely a lost capital in the source; "
                        "adjudicate into pipeline/corrections/ rather than editing text"
                    )

            for v in ch["verses"]:
                for fault in verse_text_faults(v["text"]):
                    fail(f"{osis} {ch['n']}:{v['n']}: {fault}")

    return ok, report


def print_summary(book_docs: list[dict]) -> int:
    total_verses = 0
    print(f"{'book':<8} {'chapters':>8} {'verses':>8}")
    print("-" * 26)
    for b in book_docs:
        n_chapters = len(b["chapters"])
        n_verses = sum(len(c["verses"]) for c in b["chapters"])
        total_verses += n_verses
        print(f"{b['osis']:<8} {n_chapters:>8} {n_verses:>8}")
    print("-" * 26)
    print(f"{'TOTAL':<8} {'':>8} {total_verses:>8}")
    return total_verses


def write_output(
    book_docs: list[dict],
    sample: bool,
    total_verses: int,
    corrections_applied: int,
    generated_at: str,
    receipt: dict,
) -> None:

    today = datetime.now(UTC).date().isoformat()

    notes = (
        "Ronald L. Conte Jr. translation, 2004-2009, from the Clementine "
        "Vulgate with Challoner Douay-Rheims as English guide; no imprimatur, "
        "not submitted for ecclesiastical review (translator's own choice). "
        "Latest known errata: 2025-02-26. See docs/research/bible-texts.md "
        "for the doctrinal-fidelity assessment and known translation "
        "eccentricities (e.g. John 1:1 Latin word order; Matt 1:25 'yet' for "
        "donec)."
    )
    if sample:
        notes = (
            "SAMPLE RUN for review only — contains Philemon (complete) and "
            "John (chapters 1-3 only). Not the full 73-book corpus. " + notes
        )

    manifest = {
        "id": "bible.cpdv.en",
        "type": "bible",
        "title": "Catholic Public Domain Version",
        "short_title": "CPDV",
        "language": "en",
        "edition": "2009, per errata of 2025-02-26 where stated",
        "sources": [
            {"url": BASE_URL + "index.htm", "retrieved_at": today},
        ],
        "copyright": {
            "status": "public-domain",
            "holder": None,
            "notice": "Entire text, including all html and css code, is in the public domain. No copyright.",
        },
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
        "corrections_applied": corrections_applied,
    }
    write_stamped_json(
        work_dir(),
        {
            "manifest.json": manifest,
            "corrections-applied.json": receipt,
            **{f"books/{b['osis']}.json": b for b in book_docs},
        },
        generated_at,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Only scrape Philemon (complete) and John (chapters 1-3) for review.",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Never touch the network; fail if a required page isn't cached.",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Bypass the cache and re-fetch every page from the network.",
    )
    args = parser.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    book_docs, _ = run_scrape(
        sample=args.sample, offline=args.offline, refresh=args.refresh
    )

    total_verses = print_summary(book_docs)

    if ANOMALIES:
        print(f"\n{len(ANOMALIES)} source anomalies noted during parsing:")
        for a in ANOMALIES:
            print(f"  [{a.osis}] {a.detail}")

    ok, report = validate(book_docs, sample=args.sample)
    print()
    if report:
        for line in report:
            print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    corrections = load_corrections(WORK_ID)
    try:
        applied, _seen = apply_verse_corrections(
            ((b["osis"], b["chapters"]) for b in book_docs),
            corrections,
            full_run=not args.sample,
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1
    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = corrections_receipt(WORK_ID, applied, corrections, generated_at)
    corrections_count = receipt["count"]
    print(
        f"\nCorrections layer: {corrections_count} applied, "
        f"{len([c for c in corrections if c.get('resolution')])} documented unresolved/"
        "not-a-defect (see corrections-applied.json)"
    )

    write_output(
        book_docs,
        sample=args.sample,
        total_verses=total_verses,
        corrections_applied=corrections_count,
        generated_at=generated_at,
        receipt=receipt,
    )
    print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
