#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""The Douay-Rheims (Challoner), with his notes, as `bible.douay-rheims.en`.

Source: https://vulgata.online, edition `DR2`, through the same undocumented
JSON API `introductions.py` already reads -- one request per chapter:

    GET /api/text/readings2/?ed=DR2&bk={abbr}&cn={n}

Where that scraper takes the `bd` record and leaves the rest, this one takes
the rest: `vs` (the verses), `fn` (Challoner's notes), `cd` (his chapter
arguments) and `ln`/`h1`/`h2` (lines and headings printed inside a chapter).
The API format, the book mapping and the cache layout are shared between
them in `vulgata_online.py`.

WHY THIS EDITION, beyond being one more English Bible. `docs/decisions.md`
(2026-08-16) named the site after the *Glossa Ordinaria* on the strength of an
apparatus that did not exist yet, and recorded the debt outright: "it names an
apparatus of commentary that does not exist yet... Until Challoner ships, the
name is a promise." It also settled, in advance, that the apparatus could not
be bolted onto the CPDV -- Challoner's notes are anchored to Douay-Rheims
wording, so attaching them to a different translation would be an editorial
act. Annotation means this edition, and only this edition.

WHAT IS INGESTED HERE AND WHAT IS NOT. Everything the source carries is
captured -- verses, notes, arguments, headings. Nothing is RENDERED by the
site yet: `PLAN.md` #3 (footnotes as sidenotes) is a stated prerequisite for
showing a gloss at all, because "a gloss must never be confusable with its
source, visually or structurally" (docs/decisions.md). Capturing now and
rendering later costs one crawl instead of two, which is the whole of
docs/link-surface.md's "re-parse, never re-crawl".

THE ORACLE THIS EDITION HAS AND THE OTHER THREE DID NOT. `bible.clementina.la`
is the Clementine Vulgate -- the text Challoner revised the Douay against, in
the arrangement he printed. So its chapter counts and verse-number sets are
not a second opinion but the expected shape, and `validate` checks every
chapter of every book against it rather than against a handful of declared
constants. Book lengths are still DISCOVERED rather than read from it (the API
answers `[]` past the end of a book), so the two are genuinely independent and
a disagreement means something.

Usage:
    uv run pipeline/scrapers/bible/douay_rheims.py            # full 73-book run
    uv run pipeline/scrapers/bible/douay_rheims.py --sample   # Philemon + John 1-3
    uv run pipeline/scrapers/bible/douay_rheims.py --offline  # cache-only
    uv run pipeline/scrapers/bible/douay_rheims.py --refresh  # bypass the cache

Caches every raw API response under corpus/raw/vulgata-online/ and is fully
offline-capable from that cache on re-runs. Ends with a validation pass that
prints a summary table and exits non-zero on failure.
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
    CorrectionDriftError,
    Fetcher,
    FetchPolicy,
    apply_verse_corrections,
    build_root,
    chapter_opening_letter,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    write_stamped_json,
)

# The API format itself lives in vulgata_online.py, shared with
# introductions.py. See that module's docblock for the record taxonomy, and
# in particular for why `ln` is not merely a decorative title.
from vulgata_online import (
    BASE_URL,
    BOOK_MAP,
    Anomaly,
    apply_segment_corrections,
    cache_name,
    chapter_url,
    parse_chapter,
    records,
    strip_brackets,
    unit_faults,
)


def normalize(text: str) -> str:
    """This edition's inline-markup policy (`Normalizer` in vulgata_online).

    BRACKETS OFF, EMPHASIS LEFT ALONE. The bracketed form is the transcriber's
    apparatus rather than Challoner's text -- the reason `introductions.py`
    first gave -- and dropping the brackets hands the site's citation parser a
    locator in running prose. It reaches exactly two verses in the whole
    edition, the Psalm 50 and 53 titles, which name the episode each psalm
    belongs to (`([2Sm. 12, 13])`); every other bracketed locator here is
    inside a note or an argument, which strip them already.

    `_..._` is not touched because this edition never sets a verse in italics:
    the only italics `DR2` prints are the lemma opening a note, which
    `split_note` promotes to a field before this ever sees it. Running
    `strip_emphasis` anyway would be a no-op that quietly licensed the next
    edition to assume the same, and the Matos Soares edition is the
    counter-example.
    """
    return strip_brackets(text)


SOURCE_EDITION = "DR2"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
# vulgata.online's robots.txt is `Disallow:` with no Crawl-delay, so this
# floor is ours rather than theirs. Unlike the 73 requests introductions.py
# makes, this is a chapter at a time -- 1,334 of them, about 22 minutes.
RATE_LIMIT_SECONDS = 1.0

RAW_SUBDIR = "vulgata-online"
WORK_ID = "bible.douay-rheims.en"

#: The edition whose shape this one is checked against; see the docblock.
ORACLE_WORK_ID = "bible.clementina.la"

SAMPLE_BOOKS = {"phlm", "john"}
SAMPLE_JOHN_CHAPTERS = {1, 2, 3}

#: Books whose chapter 1 the sample keeps whole; see `--sample`.
KNOWN_CHAPTER_COUNTS = {"gen": 50, "ps": 150, "esth": 16, "matt": 28, "john": 21}


def raw_dir() -> Path:
    """This scraper's fetch cache. A function, not a constant -- see cpdv.py."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


# --------------------------------------------------------------------------
# Crawling
# --------------------------------------------------------------------------


def oracle_books() -> dict[str, dict[int, list[int]]]:
    """`osis -> {chapter number: verse numbers}` from `bible.clementina.la`.

    Empty when that edition is not in the corpus, which `validate` reports as
    a skipped check rather than a pass -- an oracle that quietly is not there
    is worse than no oracle, since the run still says PASS.
    """
    books_dir = build_root() / ORACLE_WORK_ID / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, dict[int, list[int]]] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = {
            chap["n"]: [v["n"] for v in chap["verses"]]
            for chap in book.get("chapters") or []
        }
    return out


def run_scrape(
    *, sample: bool, offline: bool, refresh: bool, segment_corrections: list[dict]
) -> tuple[list[dict], list[Anomaly], list[dict]]:
    """Fetch every book, discovering each one's length as it goes.

    A book ends where the API answers `[]`, which it does with HTTP 200 for
    any chapter past the last. So each book costs one request more than it has
    chapters, and that request is the proof there is nothing beyond -- cheaper
    and stronger than trusting a hand-copied table of chapter counts, which is
    a thing that can be wrong in exactly the direction nobody notices.
    """
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

    anomalies: list[Anomaly] = []
    seg_applied: list[dict] = []
    book_docs: list[dict] = []
    for order, (abbr, (osis, name)) in enumerate(BOOK_MAP.items(), start=1):
        if sample and osis not in SAMPLE_BOOKS:
            continue
        chapters: list[dict] = []
        cn = 1
        while True:
            if sample and osis == "john" and cn not in SAMPLE_JOHN_CHAPTERS:
                break
            payload = fetcher.fetch_bytes(
                chapter_url(SOURCE_EDITION, abbr, cn),
                cache_name(SOURCE_EDITION, abbr, cn),
            )
            chapter = records(payload, where=f"{abbr} {cn} ({name})")
            # A BOOK ENDS AT ITS FIRST VERSELESS CHAPTER, not at its first
            # empty response -- the same rule matos_soares_apparatus.py needs,
            # where this host answers 2 John chapter 2 with a lone chapter
            # argument and no verses. `DR2` has no such case; the rule is
            # here so the two scrapers agree about where a book stops rather
            # than one of them being accidentally stricter.
            if not any(r.get("tp") == "vs" for r in chapter):
                break
            # Before anything reads the records: see this function's docblock.
            seg_applied += apply_segment_corrections(
                chapter, segment_corrections, osis, cn
            )
            parsed, found = parse_chapter(osis, cn, chapter, normalize=normalize)
            anomalies.extend(found)
            chapters.append(parsed)
            cn += 1

        book_docs.append(
            {
                "osis": osis,
                "name": name,
                "abbrevs": abbrevs_for(osis, name),
                "order": order,
                "chapters": chapters,
            }
        )
        notes = sum(len(v.get("notes") or []) for c in chapters for v in c["verses"])
        print(
            f"  {abbr:<5} {osis:<7} {name:<24} {len(chapters):>3} ch  "
            f"{sum(len(c['verses']) for c in chapters):>5} vv  {notes:>4} notes"
        )

    # Canonical order, per docs/corpus-schema.md. BOOK_MAP is in the SOURCE's
    # order (Machabees after Malachias); ours puts them after Esther, so
    # `order` is re-derived here rather than taken from the loop above.
    canonical = canonical_order()
    for book in book_docs:
        book["order"] = canonical.get(book["osis"], book["order"])
    book_docs.sort(key=lambda b: b["order"])
    return book_docs, anomalies, seg_applied


def canonical_order() -> dict[str, int]:
    """`osis -> order`, borrowed from an edition already in the corpus.

    Not restated here for the reason introductions.py gives: the 73-book order
    is settled in docs/corpus-schema.md and recorded per book file, and a
    second copy is one more thing that can drift."""
    books_dir = build_root() / ORACLE_WORK_ID / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, int] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = book["order"]
    return out


#: Curated jump-box abbreviations. DOUAY NOMENCLATURE, which is the point of
#: having them: `apoc` for the Apocalypse and `eccli` for Ecclesiasticus are
#: how the older encyclicals in this corpus actually cite, and they are how a
#: reader of this edition will type. The four Kings are deliberately absent --
#: `1kgs` here would mean 1 Samuel while the same string in the CPDV means
#: 1 Kings, and `book-token.ts` resolves an ambiguous token by the reader's
#: own edition, so adding them would make the answer depend on which Bible
#: happened to be open. Left to the OSIS code, which is unambiguous.
_CURATED_ABBREVS: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lv"],
    "num": ["nm"],
    "deut": ["dt"],
    "josh": ["jos", "josue"],
    "judg": ["jdg"],
    "1chr": ["1par", "1paral"],
    "2chr": ["2par", "2paral"],
    "ezra": ["1esd", "esdras"],
    "neh": ["2esd", "nehemias"],
    "tob": ["tb", "tobias"],
    "jdt": ["judith"],
    "ps": ["psa", "psalm", "psalms"],
    "prov": ["pr", "prv"],
    "eccl": ["ecc", "eccles"],
    "song": ["cant", "canticles", "canticleofcanticles"],
    "wis": ["wisd"],
    "sir": ["eccli", "ecclus", "ecclesiasticus"],
    "isa": ["is", "isaias"],
    "jer": ["jr", "jeremias"],
    "ezek": ["ez", "ezechiel"],
    "dan": ["dn"],
    "hos": ["os", "osee"],
    "obad": ["abd", "abdias"],
    "jonah": ["jon", "jonas"],
    "mic": ["mich", "micheas"],
    "hab": ["habacuc"],
    "zeph": ["soph", "sophonias"],
    "hag": ["agg", "aggeus"],
    "zech": ["zach", "zacharias"],
    "mal": ["malachias"],
    "1macc": ["1mac", "1mach", "1machabees"],
    "2macc": ["2mac", "2mach", "2machabees"],
    "matt": ["mt"],
    "mark": ["mk"],
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
    "rev": ["apoc", "apocalypse", "ap"],
}


def abbrevs_for(osis: str, name: str) -> list[str]:
    """`[osis, the name run together, curated forms]`, deduplicated.

    The parenthesised gloss in the four Kings' display names is dropped before
    the name is folded, so `1 Kings (1 Samuel)` contributes `1kings` and not
    `1kings(1samuel)`."""
    bare = re.sub(r"\s*\([^)]*\)", "", name)
    base = [osis, bare.lower().replace(" ", "")]
    seen: list[str] = []
    for candidate in base + _CURATED_ABBREVS.get(osis, []):
        if candidate not in seen:
            seen.append(candidate)
    return seen


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def fold_for_match(text: str) -> str:
    """Case and punctuation folded away, for comparing a lemma to its verse.

    A lemma is the same WORDS as the verse, not the same characters: the
    apparatus routinely re-points the quotation it opens with, and the source
    sometimes carries a Latin gloss into it (`Of slime. Bituminis`). Comparing
    raw strings reported 103 of 1,910 lemmas as absent, nearly all of them
    punctuation. Folding leaves the check aimed at what it was built for --
    a lemma whose WORDS are not in the verse, which is what `Nineve` for
    `Ninive` is."""
    return re.sub(r"[^a-z0-9 ]+", "", text.lower()).strip()


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
        missing = {osis for osis, _ in BOOK_MAP.values()} - {
            b["osis"] for b in book_docs
        }
        if missing:
            fail(f"missing books: {sorted(missing)}")

    truncated = {"john"} if sample else set()
    for book in book_docs:
        osis = book["osis"]
        if osis in KNOWN_CHAPTER_COUNTS and osis not in truncated:
            expected = KNOWN_CHAPTER_COUNTS[osis]
            if len(book["chapters"]) != expected:
                fail(
                    f"{osis}: expected {expected} chapters, got {len(book['chapters'])}"
                )
        for chap in book["chapters"]:
            if not chap["verses"]:
                fail(f"{osis} {chap['n']}: no verses")
            else:
                # A chapter's first verse begins a sentence. The same check
                # found five lost capitals in the Portuguese source; it is
                # cheap, and its value is catching the sixth.
                opening = chapter_opening_letter(chap["verses"][0]["text"])
                if opening is not None and opening.islower():
                    fail(
                        f"{osis} {chap['n']}:{chap['verses'][0]['n']}: chapter opens on "
                        f"lowercase {opening!r} -- likely a lost capital in the source; "
                        "adjudicate into pipeline/corrections/ rather than editing text"
                    )
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                where = unit.get("n") or f"before v{unit.get('before_verse')}"
                for fault in unit_faults(unit):
                    fail(f"{osis} {chap['n']}:{where}: {fault}")

    # The lemma oracle, and the cheapest check an annotated edition affords.
    # A lemma is a QUOTATION: the source printed those words twice, once in the
    # verse and once at the head of the note that glosses them. So a lemma
    # absent from its own unit's text means one of the two is mistranscribed,
    # and neither spellcheck nor the token check can see it -- the token check
    # because an unanchored note has no token to disagree with, spellcheck
    # because the words are usually plausible either way. It found `Nineve`
    # for `Ninive` at Jonas 1:2, which is now filed in pipeline/corrections/.
    #
    # Reported, never fatal: a source may normalize a lemma's capitalization
    # (`_Satan also, etc.:_` for `Satan also`) or elide it, and calling that a
    # defect would train whoever reads this report to ignore it.
    stray_lemmas: list[str] = []
    lemma_total = 0
    for book in book_docs:
        for chap in book["chapters"]:
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                where = unit.get("n") or f"before v{unit.get('before_verse')}"
                for note in unit.get("notes") or []:
                    lemma = note.get("lemma")
                    if not lemma:
                        continue
                    # `_Thou shalt not take, etc.:_` -- the apparatus's own
                    # elision marker. The quotation is deliberately partial, so
                    # its absence says nothing about either transcription.
                    if re.search(r"\bete?c\.?$", lemma.strip()):
                        continue
                    lemma_total += 1
                    if fold_for_match(lemma) not in fold_for_match(unit["text"]):
                        stray_lemmas.append(
                            f"{book['osis']} {chap['n']}:{where} ({lemma!r})"
                        )

    if stray_lemmas:
        shown = ", ".join(stray_lemmas[:10])
        more = f" (+{len(stray_lemmas) - 10} more)" if len(stray_lemmas) > 10 else ""
        report.append(
            f"NOTE: {len(stray_lemmas)}/{lemma_total} note lemmas quote words their own "
            f"verse does not contain -- candidates for adjudication, not all defects: a "
            f"lemma may carry the Latin it renders ('Of slime. Bituminis') or re-point "
            f"the quotation. Read before believing: {shown}{more}"
        )
    elif lemma_total:
        report.append(
            f"OK: all {lemma_total} note lemmas appear in the text they gloss"
        )

    # The Clementine oracle. See this module's docblock for why a disagreement
    # here is evidence rather than a second opinion.
    oracle = oracle_books()
    if not oracle:
        report.append(f"SKIP: {ORACLE_WORK_ID} not in the corpus; shape oracle not run")
        return ok, report

    chapter_diffs: list[str] = []
    verse_diffs: list[str] = []
    checked = 0
    for book in book_docs:
        theirs = oracle.get(book["osis"])
        if theirs is None:
            fail(f"{book['osis']}: not present in {ORACLE_WORK_ID}")
            continue
        if not sample and len(book["chapters"]) != len(theirs):
            chapter_diffs.append(
                f"{book['osis']} (DR {len(book['chapters'])}, LA {len(theirs)})"
            )
        for chap in book["chapters"]:
            expected = theirs.get(chap["n"])
            if expected is None:
                verse_diffs.append(f"{book['osis']} {chap['n']} (absent in LA)")
                continue
            checked += 1
            if [v["n"] for v in chap["verses"]] != expected:
                verse_diffs.append(f"{book['osis']} {chap['n']}")

    if chapter_diffs:
        fail(
            f"{len(chapter_diffs)} book(s) disagree with {ORACLE_WORK_ID} on chapter "
            f"count -- suspect a mis-mapped book or a short crawl: {', '.join(chapter_diffs)}"
        )
    else:
        report.append(
            f"OK: chapter counts match {ORACLE_WORK_ID} for all {len(book_docs)} books"
        )

    if verse_diffs:
        # Reported, never fatal: two editions of one tradition may still
        # divide a verse differently, and docs/research/bible-edition-
        # divergence.md is explicit that calling that a defect invites
        # someone to "fix" a faithful text.
        shown = ", ".join(verse_diffs[:12])
        more = f" (+{len(verse_diffs) - 12} more)" if len(verse_diffs) > 12 else ""
        report.append(
            f"NOTE: {len(verse_diffs)}/{checked} chapters differ from {ORACLE_WORK_ID} in "
            f"their verse-number set -- edition divergence, to be read before it is "
            f"believed: {shown}{more}"
        )
    else:
        report.append(
            f"OK: verse-number sets match {ORACLE_WORK_ID} in all {checked} chapters"
        )

    return ok, report


# --------------------------------------------------------------------------
# Corrections
#
# The shared layer edits `verse["text"]` and knows the `{osis, chapter, verse}`
# locator docs/corpus-schema.md defines. This edition needs two things it does
# not do, and both stay here, where cpdv.py's comment already says the APPLYING
# of a correction belongs -- "what a correction means is per-source".
#
#   - A corrected verse must have `text_marked` corrected with it, or the two
#     stop agreeing and `unit_faults` fails the run. That is the intended
#     safety net, not a nuisance: a `from` string that straddles a token cannot
#     be applied to both and should stop the build.
#   - A defect can be in a NOTE, which has no locator at all. Challoner's
#     apparatus is a second body of text, and the transcription of it has its
#     own typos (`comdemnation` at John 3:19). A locator naming a note is
#     scoped by adding `"note": "1"`; those entries are held back from the
#     shared function, which would read them as drift.
# --------------------------------------------------------------------------


def apply_note_corrections(
    book_docs: list[dict], corrections: list[dict], full_run: bool
):
    """Apply the `note`-scoped corrections. Same three outcomes as the verse
    layer: out of scope, drift, or applied."""
    index: dict[tuple, dict] = {}
    scope: set[tuple[str, int]] = set()
    for book in book_docs:
        for chap in book["chapters"]:
            scope.add((book["osis"], chap["n"]))
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                for note in unit.get("notes") or []:
                    index[(book["osis"], chap["n"], unit.get("n"), note["marker"])] = (
                        note
                    )

    applied: list[dict] = []
    for c in corrections:
        if c.get("resolution"):
            continue
        loc = c["locator"]
        if (loc["osis"], loc["chapter"]) not in scope:
            continue
        note = index.get(
            (loc["osis"], loc["chapter"], loc.get("verse"), str(loc["note"]))
        )
        field = c.get("field", "text")
        if note is None or c["from"] not in (note.get(field) or ""):
            raise CorrectionDriftError(
                f"correction {c['id']!r}: expected {field} {c['from']!r} not found on note "
                f"{loc['note']} at {loc['osis']} {loc['chapter']}:{loc.get('verse')} "
                "(source drift -- re-verify against corpus/raw/ and update or remove it)"
            )
        note[field] = note[field].replace(c["from"], c["to"], 1)
        applied.append(dict(c))

    if full_run:
        missing = [
            c["id"]
            for c in corrections
            if not c.get("resolution") and c["id"] not in {a["id"] for a in applied}
        ]
        if missing:
            raise CorrectionDriftError(
                f"note corrections never matched during full run: {missing}"
            )
    return applied


def mirror_into_marked(book_docs: list[dict], applied: list[dict]) -> None:
    """Re-apply each verse correction to that verse's `text_marked`.

    A verse with no apparatus has no `text_marked` and needs nothing. When it
    has one and the replacement does not land -- because the `from` string
    straddles a `⟦n⟧` token -- this leaves the two disagreeing on purpose, and
    `unit_faults` turns that into a failed run naming the verse. Silently
    re-deriving `text_marked` from the corrected `text` would be the wrong
    repair: it would drop the apparatus to save the sentence."""
    index = {
        (book["osis"], chap["n"], verse["n"]): verse
        for book in book_docs
        for chap in book["chapters"]
        for verse in chap["verses"]
    }
    for c in applied:
        loc = c["locator"]
        verse = index.get((loc["osis"], loc["chapter"], loc["verse"]))
        if verse is None or "text_marked" not in verse:
            continue
        verse["text_marked"] = verse["text_marked"].replace(c["from"], c["to"], 1)


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def census(book_docs: list[dict]) -> dict[str, int]:
    verses = notes = summaries = headings = lemmas = marked = 0
    for book in book_docs:
        for chap in book["chapters"]:
            summaries += 1 if chap.get("summary") else 0
            headings += len(chap.get("headings") or [])
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                for note in unit.get("notes") or []:
                    notes += 1
                    lemmas += 1 if note.get("lemma") else 0
            for verse in chap["verses"]:
                verses += 1
                marked += 1 if verse.get("text_marked") else 0
    return {
        "books": len(book_docs),
        "chapters": sum(len(b["chapters"]) for b in book_docs),
        "verses": verses,
        "notes": notes,
        "notes_with_lemma": lemmas,
        "verses_with_apparatus": marked,
        "chapter_summaries": summaries,
        "headings": headings,
    }


def print_summary(counts: dict[str, int]) -> None:
    print()
    for key, value in counts.items():
        print(f"  {key.replace('_', ' '):<22} {value:>7}")


def retrieved_at() -> str:
    """The date this edition was actually FETCHED, which is not today.

    An offline re-parse rewrites the manifest without touching the network,
    and stamping it with the current date would claim a retrieval that did not
    happen -- provenance metadata is the one field in the file that is a claim
    about the outside world rather than about our own run. `generated_at`
    already records when the parse ran, so nothing is lost by keeping this
    honest: the existing value is preserved whenever there is one, and only a
    first run (or a corpus with no manifest yet) stamps today.

    A `--refresh` run genuinely re-fetches and so genuinely should move this;
    that it does not is a known limitation, and the safe direction to be wrong
    in -- an understated retrieval date is a citation that still resolves.
    """
    existing = work_dir() / "manifest.json"
    if existing.exists():
        try:
            prior = json.loads(existing.read_text(encoding="utf-8"))
            stamp = (prior.get("sources") or [{}])[0].get("retrieved_at")
            if isinstance(stamp, str) and stamp:
                return stamp
        except (json.JSONDecodeError, OSError, IndexError):
            pass
    return datetime.now(UTC).date().isoformat()


def write_output(
    book_docs: list[dict],
    *,
    sample: bool,
    counts: dict[str, int],
    receipt: dict,
    generated_at: str,
) -> None:
    retrieved = retrieved_at()

    notes = (
        "Bishop Richard Challoner's revision (1749-52) of the Douay-Rheims, "
        "transcribed by vulgata.online as edition code DR2 and taken from its "
        "JSON API. Public domain in text and apparatus alike. Ingested with "
        f"Challoner's own notes ({counts['notes']}), his chapter arguments "
        f"({counts['chapter_summaries']}) and the lines and headings the source "
        f"prints inside a chapter ({counts['headings']}); his book prefaces are "
        "a separate work, bible-intro.en, because a preface describes the book "
        "rather than the translation. A note quotes the words it glosses before "
        "glossing them, and the source sets exactly those words in italics: they "
        "are kept as the note's `lemma`, and the point in the verse where they "
        "end carries the same U+27E6/U+27E7 token the CCC uses. Emphasis "
        "elsewhere is dropped, the v1 loss docs/corpus-schema.md records; "
        "corpus/raw/ holds every response verbatim. Not every note is anchored "
        f"({counts['notes'] - counts['verses_with_apparatus']} is an upper bound "
        "on the unanchored, since a verse may carry several) -- where the source "
        "prints no anchor the note is filed against its own verse. Challoner's "
        "notes are a dated apparatus of eighteenth-century controversy, not "
        "neutral commentary; see docs/decisions.md §Posture."
    )
    if sample:
        notes = (
            "SAMPLE RUN for review only -- Philemon (complete) and John "
            "(chapters 1-3 only). Not the full 73-book corpus. " + notes
        )

    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Douay-Rheims Bible",
        "short_title": "Douay-Rheims",
        "language": "en",
        "edition": "Challoner revision, 1749-52",
        "sources": [
            {"url": BASE_URL + "/bible/Gn.1?ed=DR2", "retrieved_at": retrieved}
        ],
        "copyright": {"status": "public-domain", "holder": None, "notice": None},
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
        "corrections_applied": receipt["count"],
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

    # CORRECTIONS RUN BEFORE VALIDATION, as in matos_soares.py and unlike
    # cpdv.py. The two siblings differ because only one of them has anything
    # to correct: a validator that runs first reports faults the corrections
    # layer is about to repair, and then fails the run over them. The receipt
    # keeps the audit trail of what was changed, so nothing is hidden by
    # validating the corrected text -- which is the text that ships.
    corrections = load_corrections(WORK_ID)

    def scope(c: dict) -> str:
        loc = c["locator"]
        return "record" if "record" in loc else "note" if "note" in loc else "verse"

    by_scope = {
        s: [c for c in corrections if scope(c) == s]
        for s in ("record", "note", "verse")
    }

    print(f"Fetching {SOURCE_EDITION} from {BASE_URL}, one request per chapter\n")
    try:
        book_docs, anomalies, seg_applied = run_scrape(
            sample=args.sample,
            offline=args.offline,
            refresh=args.refresh,
            segment_corrections=by_scope["record"],
        )
        applied, _seen = apply_verse_corrections(
            ((b["osis"], b["chapters"]) for b in book_docs),
            by_scope["verse"],
            full_run=not args.sample,
        )
        mirror_into_marked(book_docs, applied)
        applied = (
            seg_applied
            + applied
            + apply_note_corrections(
                book_docs, by_scope["note"], full_run=not args.sample
            )
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1

    counts = census(book_docs)
    print_summary(counts)

    fatal = [a for a in anomalies if a.fatal]
    if anomalies:
        print(
            f"\n{len(anomalies)} source anomalies noted during parsing"
            f"{f', {len(fatal)} of them fatal' if fatal else ''}:"
        )
        for a in [*fatal, *[a for a in anomalies if not a.fatal]][:40]:
            print(f"  [{a.osis} {a.chapter}]{' FATAL:' if a.fatal else ''} {a.detail}")
        if len(anomalies) > 40:
            print(f"  ... and {len(anomalies) - 40} more")

    ok, report = validate(book_docs, sample=args.sample)
    if fatal:
        ok = False
        report.append(
            f"FAIL: {len(fatal)} fatal source anomal{'y' if len(fatal) == 1 else 'ies'} "
            "above -- text would be lost; adjudicate each into pipeline/corrections/"
        )
    print()
    for line in report:
        print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    if not ok:
        print("\nRefusing to write a work that failed validation.", file=sys.stderr)
        return 1

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = corrections_receipt(WORK_ID, applied, corrections, generated_at)
    print(
        f"\nCorrections layer: {receipt['count']} applied, "
        f"{len(receipt['unresolved'])} documented unresolved/not-a-defect "
        "(see corrections-applied.json)"
    )

    write_output(
        book_docs,
        sample=args.sample,
        counts=counts,
        receipt=receipt,
        generated_at=generated_at,
    )
    print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
