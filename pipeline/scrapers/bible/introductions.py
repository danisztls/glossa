#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Book introductions -- Challoner's prefaces, as `bible-intro.en`.

Source: https://vulgata.online, edition `DR2` (Challoner Douay-Rheims). The
site is a client-rendered SPA, but its data comes from an unauthenticated
JSON API on the same origin, which is what this scraper talks to:

    GET /api/text/readings2/?ed=DR2&bk={abbr}&cn=1

One request returns chapter 1 as typed records. This scraper wants exactly
one of them, `tp == "bd"` -- the book description, i.e. the preface Challoner
prints before the book's first chapter. (The same response carries `cd`, the
chapter argument; `fn`, footnote text; and `ln`/`h1`/`h2`, section headings.
None of those are this work's business, but they are the reason the whole
response is cached verbatim rather than just the field taken.)

WHY THIS IS ITS OWN WORK RATHER THAN A FIELD ON THE THREE BIBLES. An
introduction describes the BOOK, not the translation, so keying it by edition
would mean writing the same prose three times and re-writing it whenever a
fourth edition arrives. `bible-intro.{lang}` is keyed by language only, and
the site addresses it as chapter 0 of the book -- see docs/corpus-schema.md.

WHY CHALLONER'S PREFACES SIT BESIDE CPDV'S VERSES. They are not an arbitrary
graft: the CPDV was translated from the Clementine Vulgate *using Challoner's
Douay-Rheims as its English guide text* (docs/research/bible-texts.md), so
the two are a matched pair. What is genuinely unmatched is Portuguese and
Latin, which have no intros at all yet; the site treats a language without
them exactly as it treats a chapter absent from one edition.

Usage:
    uv run pipeline/scrapers/bible/introductions.py             # all 73 books
    uv run pipeline/scrapers/bible/introductions.py --offline   # cache-only
    uv run pipeline/scrapers/bible/introductions.py --refresh   # re-fetch

Caches every raw API response under corpus/raw/vulgata-online/ and is fully
offline-capable from that cache on re-runs. Ends with a validation pass that
exits non-zero on failure.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line is
# above the imports rather than the imports being at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    Fetcher,
    FetchPolicy,
    build_root,
    captured_at,
    raw_root,
    require_corpus,
    write_stamped_json,
)

# The API format itself lives in vulgata_online.py, shared with
# douay_rheims.py -- same host, same responses, different halves of them.
# See that module's docblock for where the boundary between "the API" and
# "this work" is drawn, and for the `bd` record this scraper is here for.
from vulgata_online import (
    BASE_URL,
    BOOK_MAP,
    cache_name,
    chapter_url,
    records,
    strip_brackets,
    strip_emphasis,
)

SOURCE_EDITION = "DR2"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
# vulgata.online's robots.txt is `Disallow:` with no Crawl-delay, so this
# floor is ours rather than theirs. 73 requests is the whole run.
RATE_LIMIT_SECONDS = 1.0

RAW_SUBDIR = "vulgata-online"
WORK_ID = "bible-intro.en"


#: Books Challoner gives no preface of their own, because the preface printed
#: before their FIRST volume covers both. Its opening words say so outright:
#: "This and the following Book are called by the holy fathers the third and
#: fourth book of Kings". Recorded here so the validator can tell a source
#: fact from a fetch that silently came back empty.
SHARED_PREFACE_WITH: dict[str, str] = {"2kgs": "1kgs", "2chr": "1chr"}

#: `osis -> (their chapter-1 verse count, ours in bible.cpdv.en)` for the four
#: books where the two disagree. EDITION DIVERGENCE, NOT DEFECTS -- the four
#: are the same phenomena docs/research/bible-edition-divergence.md describes
#: and `site/src/lib/compare.ts` measured across all 1,333 shared chapters:
#: Esther's deuterocanonical material distributed differently (that module
#: calls it the single largest divergence in the corpus), the Canticle's
#: near-systematic verse splitting, and one-off single-verse splits in
#: Lamentations and 2 Corinthians.
#:
#: Declared rather than tolerated by threshold, because the point of the check
#: is to catch a MIS-MAPPED BOOK, and every such error is gross: Douay
#: nomenclature makes `Jn` Jonas and `Jo` John, so a swap shows up as 16
#: verses against 51, not as one. Anything not in this table fails the run.
CHAPTER1_VERSE_DIVERGENCE: dict[str, tuple[int, int]] = {
    "esth": (22, 11),
    "song": (16, 21),
    "lam": (24, 22),
    "2cor": (23, 24),
}


def raw_dir() -> Path:
    """This scraper's fetch cache. A function, not a constant -- see cpdv.py."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


def normalize(raw: str) -> list[str]:
    """One `bd` string -> its paragraphs, as plain text.

    INLINE EMPHASIS IS A DELIBERATE v1 LOSS, the same one docs/corpus-schema.md
    already records for the CCC: the source marks italics as `_..._` (book
    titles, Latin terms), and this drops the markers and keeps the words. The
    raw response is cached verbatim, so recovering emphasis later is a
    re-parse and never a re-crawl (docs/link-surface.md).

    Bracketed scripture locators (`[Gen. 1, 1]`) lose their brackets for the
    same reason and with the same recourse -- the site's own citation parser
    finds references in running prose, and the brackets are this source's
    apparatus rather than Challoner's text."""
    text = raw.replace("\r\n", "\n").replace("\r", "\n")
    text = strip_brackets(strip_emphasis(text))
    paragraphs = []
    for chunk in re.split(r"\n\s*\n", text):
        collapsed = re.sub(r"\s+", " ", chunk).strip()
        if collapsed:
            paragraphs.append(collapsed)
    return paragraphs


def book_intro(chapter: list[dict]) -> list[str]:
    """The `bd` record's paragraphs, or `[]` when the book has no preface."""
    for record in chapter:
        if record.get("tp") == "bd":
            return normalize(record.get("cnt") or "")
    return []


def run_scrape(
    *, offline: bool, refresh: bool
) -> tuple[dict[str, list[str]], dict[str, int]]:
    """Fetch every book's chapter 1, keeping its preface and its verse count.

    The verse count is not this work's content -- it is the mapping oracle's
    evidence, and it comes free in the same response the preface arrives in.
    See `validate`."""
    fetcher = Fetcher(
        cache_dir=raw_dir(),
        policy=FetchPolicy(
            user_agent=USER_AGENT,
            delay=RATE_LIMIT_SECONDS,
            attempts=3,
            backoff=(2.0, 5.0),
        ),
        offline=offline,
        refresh=refresh,
    )

    intros: dict[str, list[str]] = {}
    verses: dict[str, int] = {}
    for abbr, (osis, name) in BOOK_MAP.items():
        payload = fetcher.fetch_bytes(
            chapter_url(SOURCE_EDITION, abbr, 1),
            cache_name(SOURCE_EDITION, abbr, 1),
        )
        chapter = records(payload, where=f"{abbr} ({name})")
        paragraphs = book_intro(chapter)
        if paragraphs:
            intros[osis] = paragraphs
        verses[osis] = sum(1 for record in chapter if record.get("tp") == "vs")
        print(
            f"  {abbr:<5} {osis:<7} {name:<28} "
            f"{sum(len(p.split()) for p in paragraphs):>4} words"
            + ("" if paragraphs else "   (no preface)")
        )

    return intros, verses


def canonical_books() -> dict[str, dict]:
    """What `bible.cpdv.en` says about each book: its canonical `order`, and
    how many verses it prints in chapter 1.

    Both are borrowed rather than restated. The 73-book order is already
    settled in docs/corpus-schema.md and recorded per book file, and a second
    copy here would be one more thing that can drift; the verse count is the
    mapping oracle's evidence (see `validate`). Empty when the CPDV is not in
    the corpus, which both callers handle."""
    books_dir = build_root() / "bible.cpdv.en" / "books"
    out: dict[str, dict] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        chapters = book.get("chapters") or []
        if chapters:
            out[book["osis"]] = {
                "order": book["order"],
                "chapter1_verses": len(chapters[0]["verses"]),
            }
    return out


def validate(
    intros: dict[str, list[str]], verses: dict[str, int]
) -> tuple[bool, list[str]]:
    """Check the work, and check `BOOK_MAP` against the corpus we already hold.

    THE MAPPING IS THE THING THAT CAN GO WRONG SILENTLY. It is hand-written
    against Douay nomenclature, in which "1 Kings" means 1 Samuel and `Jn`
    means Jonas, and a mis-filed book produces a perfectly well-formed work
    with Jonas's preface sitting on the Gospel of John -- nothing about the
    output looks wrong. So the codes are checked against `bible.cpdv.en` twice
    over: that every one names a book we have, and that each book's first
    chapter is the same length on both sides."""
    report: list[str] = []
    ok = True

    mapped = {osis for osis, _ in BOOK_MAP.values()}
    if len(mapped) != len(BOOK_MAP):
        ok = False
        report.append(
            f"FAIL: BOOK_MAP has {len(BOOK_MAP)} codes but only {len(mapped)} distinct OSIS codes"
        )

    canonical = canonical_books()
    ours = {osis: meta["chapter1_verses"] for osis, meta in canonical.items()}
    if ours:
        missing = sorted(mapped - set(ours))
        extra = sorted(set(ours) - mapped)
        if missing or extra:
            ok = False
            report.append(
                f"FAIL: BOOK_MAP vs bible.cpdv.en -- unknown {missing}, unmapped {extra}"
            )
        else:
            report.append(
                f"OK: all {len(mapped)} mapped OSIS codes exist in bible.cpdv.en"
            )

        undeclared = []
        for osis, theirs in sorted(verses.items()):
            if osis not in ours or theirs == ours[osis]:
                continue
            if CHAPTER1_VERSE_DIVERGENCE.get(osis) == (theirs, ours[osis]):
                continue
            undeclared.append(f"{osis} (DR2 {theirs}, CPDV {ours[osis]})")
        if undeclared:
            ok = False
            report.append(
                f"FAIL: {len(undeclared)} book(s) disagree with bible.cpdv.en on the "
                f"length of chapter 1 and are not declared divergences -- suspect a "
                f"mis-mapped book: {', '.join(undeclared)}"
            )
        else:
            report.append(
                f"OK: chapter-1 verse counts match bible.cpdv.en for "
                f"{len(verses) - len(CHAPTER1_VERSE_DIVERGENCE)}/{len(verses)} books; "
                f"the {len(CHAPTER1_VERSE_DIVERGENCE)} that differ are the declared "
                f"edition divergences ({', '.join(sorted(CHAPTER1_VERSE_DIVERGENCE))})"
            )
    else:
        report.append("SKIP: bible.cpdv.en not in the corpus; mapping oracle not run")

    empty = [
        osis
        for osis, paragraphs in intros.items()
        if not any(p.strip() for p in paragraphs)
    ]
    if empty:
        ok = False
        report.append(f"FAIL: {len(empty)} intro(s) present but empty: {sorted(empty)}")

    absent = sorted(mapped - set(intros))
    expected_absent = sorted(SHARED_PREFACE_WITH)
    if absent == expected_absent:
        report.append(
            f"OK: {len(intros)}/{len(mapped)} books have a preface; the {len(absent)} without "
            f"({', '.join(absent)}) share their predecessor's, as the source prints it"
        )
    else:
        ok = False
        report.append(f"FAIL: expected no preface for {expected_absent}, got {absent}")

    return ok, report


def write_output(intros: dict[str, list[str]], *, generated_at: str) -> None:
    # The ledger records when this page was actually fetched; today only
    # for a source no capture is on file for. Before 2026-08-28 this stamped
    # today unconditionally, so every re-parse claimed a retrieval that did
    # not happen -- see common/captured.py.
    # From the page itself (common/captured.py): the fetcher stamped it when
    # it made the request, so a cache-only re-parse cannot move it.
    today = (
        captured_at(raw_dir() / cache_name(SOURCE_EDITION, "Gn", 1))
        or datetime.now(UTC).date().isoformat()
    )

    # Canonical order, per docs/corpus-schema.md's `books` field -- taken from
    # the CPDV's own book files rather than restated here. Alphabetical is the
    # fallback when the corpus has no CPDV to ask, and is wrong but harmless:
    # nothing downstream reads order from this file that cannot re-derive it.
    canonical = canonical_books()
    entries = []
    for _abbr, (osis, _name) in BOOK_MAP.items():
        paragraphs = intros.get(osis)
        if not paragraphs:
            continue
        entries.append({"osis": osis, "blocks": [{"text": p} for p in paragraphs]})
    entries.sort(
        key=lambda e: (canonical.get(e["osis"], {}).get("order", 0), e["osis"])
    )

    manifest = {
        "id": WORK_ID,
        "type": "bible-intro",
        "title": "Book Introductions",
        "short_title": "Introductions",
        "language": "en",
        "edition": "Challoner's prefaces, from the Douay-Rheims",
        "sources": [{"url": BASE_URL + "/bible/Gn.1?ed=DR2", "retrieved_at": today}],
        "copyright": {
            "status": "public-domain",
            "holder": None,
            "notice": None,
        },
        "notes": (
            "Bishop Richard Challoner's prefaces as printed before each book of "
            "his Douay-Rheims revision, transcribed by vulgata.online (edition "
            "code DR2) and taken from its JSON API's `bd` records. Not keyed to "
            "any one edition of the text: an introduction describes the book, "
            "not the translation. Challoner prints one preface covering both "
            "volumes of Kings and both of Paralipomenon, so 4 Kings (2kgs) and "
            "2 Paralipomenon (2chr) carry none of their own -- 71 prefaces for "
            "73 books, which is the source's shape and not a gap in the fetch. "
            "3 John is the one entry that is not a preface: the source files a "
            "chapter argument ('St. John praises Gaius...') under the book "
            "description and prints no chapter argument at all, which is "
            "recorded here rather than repaired. "
            "Inline emphasis and the source's bracketed scripture locators are "
            "dropped, the v1 loss docs/corpus-schema.md already records for the "
            "CCC; corpus/raw/ holds every response verbatim."
        ),
        "generated_at": generated_at,
        "books": [entry["osis"] for entry in entries],
        "shared_preface_with": SHARED_PREFACE_WITH,
    }

    write_stamped_json(
        work_dir(),
        {"manifest.json": manifest, "intros.json": entries},
        generated_at,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Never touch the network; fail if a required response isn't cached.",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Bypass the cache and re-fetch every response from the network.",
    )
    args = parser.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    print(
        f"Fetching {len(BOOK_MAP)} book prefaces from {BASE_URL} ({SOURCE_EDITION})\n"
    )
    intros, verses = run_scrape(offline=args.offline, refresh=args.refresh)

    total_words = sum(len(p.split()) for ps in intros.values() for p in ps)
    print(f"\n{len(intros)} prefaces, {total_words} words total")

    ok, report = validate(intros, verses)
    print()
    for line in report:
        print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_output(intros, generated_at=generated_at)
    print(f"\nWrote {len(intros)} intro(s) to {work_dir()}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
