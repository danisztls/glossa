#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""The apparatus of the Matos Soares edition, from vulgata.online.

Source: https://vulgata.online, edition `MS`, through the same undocumented
JSON API `douay_rheims.py` and `introductions.py` read:

    GET /api/text/readings2/?ed=MS&bk={abbr}&cn={n}

THIS SUPPLIES APPARATUS AND NOT TEXT, and the distinction is the whole point
of the file. `matos_soares.py` scrapes liriocatolico.com.br for the verses and
owns `bible.matos-soares.pt`; that source prints the edition's footnote
MARKERS and not their content, which is the gap this closes. Nothing here
writes a work.

IT WAS GOING TO BE A RE-SOURCING, AND THE MEASUREMENT SAID NO. This host
carries text and apparatus together, already anchored, in the format the
Douay-Rheims parser reads, so re-taking the whole edition from it looked
strictly better than joining two halves. Then the comparison ran: 98.01% of
verses agree with the transcription already in the corpus, and **247 verses
are missing from this one**. Job 32 stops at 14 of 22. Esdras 6:9-13 is
silently overwritten by a duplicate of Esdras 4:9-13, so a reader would find
Artaxerxes's letter inside the dedication of the Temple with nothing looking
wrong. Around 215 more are scattered single holes -- Genesis 15 arrives with
verses 1-3 and 5-21. Full measurement in
`docs/research/matos-soares-re-sourcing.md`; `--report` below regenerates it.

So the text stays where it is and only the apparatus travels: 3,013 footnotes,
1,279 chapter arguments and 5,733 headings in the four-level hierarchy
`ChapterHeading.level` now models.

HOW A NOTE FINDS ITS PLACE IN A DIFFERENT TRANSCRIPTION. Not by the marker
offsets, which liriocatolico stripped at ingestion and never recorded -- by
the note's own `lemma`. Every note in this apparatus opens by quoting the
words it glosses, so `anchor_notes` folds both transcriptions to letters and
digits, finds the lemma in OUR verse, and puts the token where it ends. That
is the same lemma-to-token relation `douay_rheims.py` builds within one
source, and it is self-checking: a note whose lemma is not in our verse gets
no token and is reported, rather than being placed by guess.

The book prefaces (`bd`) belong to `bible-intro.pt` and are not taken here,
the same split `douay_rheims.py` makes with `bible-intro.en`.

Usage:
    uv run pipeline/scrapers/bible/matos_soares_apparatus.py --report
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

# See the note above the same two lines in douay_rheims.py.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    Fetcher,
    FetchPolicy,
    load_corrections,
    raw_root,
    require_corpus,
    works_root,
)
from vulgata_online import (
    BASE_URL,
    BOOK_MAP,
    TOKEN,
    Anomaly,
    apply_segment_corrections,
    cache_name,
    chapter_url,
    parse_chapter,
    records,
    strip_brackets,
    strip_emphasis,
    unit_faults,
)

SOURCE_EDITION = "MS"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
# Stated here rather than inherited: when two scrapers against this host run,
# their politeness budgets add up, which is a fact each file should show.
RATE_LIMIT_SECONDS = 1.0

RAW_SUBDIR = "vulgata-online"
WORK_ID = "bible.matos-soares.pt"

#: The edition whose SHAPE this one is checked against. The Clementine rather
#: than the Douay-Rheims, and a weaker claim than the one the Douay-Rheims
#: makes against it: this is a translation from the original languages (1956,
#: with L. G. da Fonseca SJ) and not from the Vulgate, so a disagreement with
#: the Latin is edition divergence rather than evidence. See
#: docs/research/bible-edition-divergence.md.
ORACLE_WORK_ID = "bible.clementina.la"

SAMPLE_BOOKS = {"phlm", "john"}
SAMPLE_JOHN_CHAPTERS = {1, 2, 3}

#: Their book code -> (the Portuguese name this edition prints, its curated
#: abbreviations).
#:
#: BOTH COLUMNS COME FROM THE WORK AS liriocatolico BUILT IT, deliberately.
#: The names are what the printed edition calls its books, which this source's
#: API does not carry -- its records name a book only by their own code -- and
#: the abbreviations are the ones already in the corpus, so a bookmark, a
#: citation and the jump box all keep resolving across the change of source.
#: Re-deriving either from this source would silently rename 73 books to
#: nobody's benefit.
BOOKS: dict[str, tuple[str, list[str]]] = {
    "Gn": ("Gênesis", ["gn"]),
    "Ex": ("Êxodo", ["ex"]),
    "Lv": ("Levítico", ["lv"]),
    "Nm": ("Números", ["nm"]),
    "Dt": ("Deuteronômio", ["dt"]),
    "Js": ("Josué", ["js"]),
    "Ju": ("Juízes", ["jz"]),
    "Rt": ("Rute", ["rt"]),
    "1Sm": ("I Samuel", ["1sm"]),
    "2Sm": ("II Samuel", ["2sm"]),
    "1Rs": ("I Reis", ["1rs"]),
    "2Rs": ("II Reis", ["2rs"]),
    "1Pa": ("I Crônicas", ["1cr"]),
    "2Pa": ("II Crônicas", ["2cr"]),
    "Esd": ("Esdras", ["esd"]),
    "Ne": ("Neemias", ["ne"]),
    "Tob": ("Tobias", ["tb"]),
    "Jdi": ("Judite", ["jt"]),
    "Est": ("Ester", ["est"]),
    "Job": ("Jó", ["jó"]),
    "Ps": ("Salmos", ["sl"]),
    "Pv": ("Provérbios", ["pr"]),
    "Ees": ("Eclesiastes", ["ecl"]),
    "Cc": ("Cântico dos Cânticos", ["ct"]),
    "Sa": ("Sabedoria", ["sb"]),
    "Eus": ("Eclesiástico", ["eclo"]),
    "Is": ("Isaías", ["is"]),
    "Je": ("Jeremias", ["jr"]),
    "Lm": ("Lamentações", ["lm"]),
    "Ba": ("Baruc", ["br"]),
    "Ez": ("Ezequiel", ["ez"]),
    "Dn": ("Daniel", ["dn"]),
    "Os": ("Oséias", ["os"]),
    "Jl": ("Joel", ["jl"]),
    "Am": ("Amós", ["am"]),
    "Ab": ("Abdias", ["ab"]),
    "Jn": ("Jonas", ["jn"]),
    "Mic": ("Miquéias", ["mq"]),
    "Na": ("Naum", ["na"]),
    "Hc": ("Habacuc", ["hab"]),
    "So": ("Sofonias", ["sf"]),
    "Ag": ("Ageu", ["ag"]),
    "Zc": ("Zacarias", ["zc"]),
    "Ml": ("Malaquias", ["ml"]),
    "1Ma": ("I Macabeus", ["1mc"]),
    "2Ma": ("II Macabeus", ["2mc"]),
    "Mt": ("São Mateus", ["mt"]),
    "Mc": ("São Marcos", ["mc"]),
    "Lc": ("São Lucas", ["lc"]),
    "Jo": ("São João", ["jo"]),
    "Act": ("Atos dos Apóstolos", ["at"]),
    "Rm": ("Romanos", ["rm"]),
    "1Co": ("I Coríntios", ["1cor"]),
    "2Co": ("II Coríntios", ["2cor"]),
    "Gl": ("Gálatas", ["gl"]),
    "Ef": ("Efésios", ["ef"]),
    "Fp": ("Filipenses", ["fl"]),
    "Cl": ("Colossenses", ["cl"]),
    "1Ts": ("I Tessalonicenses", ["1ts"]),
    "2Ts": ("II Tessalonicenses", ["2ts"]),
    "1Tm": ("I Timóteo", ["1tm"]),
    "2Tm": ("II Timóteo", ["2tm"]),
    "Tt": ("Tito", ["tt"]),
    "Fm": ("Filêmon", ["fm"]),
    "Hb": ("Hebreus", ["hb"]),
    "Tg": ("São Tiago", ["tg"]),
    "1Pe": ("I São Pedro", ["1pd"]),
    "2Pe": ("II São Pedro", ["2pd"]),
    "1Jo": ("I São João", ["1jo"]),
    "2Jo": ("II São João", ["2jo"]),
    "3Jo": ("III São João", ["3jo"]),
    "Jda": ("São Judas", ["jd"]),
    "Ap": ("Apocalipse", ["ap"]),
}


def normalize(text: str) -> str:
    """This edition's inline-markup policy (`Normalizer` in vulgata_online).

    EMPHASIS AND BRACKETS BOTH OFF, which is the opposite of what the
    Douay-Rheims asks for and the reason the policy is an argument rather than
    a default. This edition really does set clauses in italics inside a verse
    -- an Old Testament quotation carried into the New, for instance -- and
    flattening them is the standing v1 emphasis loss, recoverable from `raw/`.
    That is NOT the Douay-Rheims's case, where the only italics in a source
    string are a note's lemma and dropping them would destroy a boundary;
    `split_note` has already lifted the lemma out before this runs, so nothing
    structural is lost here either.
    """
    return strip_brackets(strip_emphasis(text))


def raw_dir() -> Path:
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return works_root() / WORK_ID


# --------------------------------------------------------------------------
# Crawling
# --------------------------------------------------------------------------


def run_scrape(
    *, sample: bool, offline: bool, refresh: bool, segment_corrections: list[dict]
) -> tuple[list[dict], list[Anomaly], list[dict]]:
    """Fetch every book, discovering each one's length as it goes.

    A book ends where the API answers `[]`, which it does with HTTP 200 for
    any chapter past the last -- so each book costs one request more than it
    has chapters, and that request is the proof there is nothing beyond.
    Cheaper and stronger than a hand-copied table of chapter counts, and here
    it is also the check that this edition covers the same 73 books the
    liriocatolico scrape found.
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
    for order, (abbr, (osis, _english)) in enumerate(BOOK_MAP.items(), start=1):
        if sample and osis not in SAMPLE_BOOKS:
            continue
        name, curated = BOOKS[abbr]
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
            # empty response. The two are the same answer almost everywhere,
            # and 2 John is where they part: this source answers chapter 2
            # with a lone `cd` record -- a chapter argument for a chapter that
            # does not exist, left over from the transcriber splitting what
            # Matos Soares printed as one epistle into two. Stopping only at
            # `[]` walked past it and produced a chapter with a summary and no
            # verses, which docs/corpus-schema.md has no shape for.
            if not any(r.get("tp") == "vs" for r in chapter):
                break
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
                "abbrevs": abbrevs_for(osis, name, curated),
                "order": order,
                "chapters": chapters,
            }
        )
        notes = sum(len(v.get("notes") or []) for c in chapters for v in c["verses"])
        print(
            f"  {abbr:<5} {osis:<7} {name:<24} {len(chapters):>3} ch  "
            f"{sum(len(c['verses']) for c in chapters):>5} vv  {notes:>4} notes",
            flush=True,
        )

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
    books_dir = works_root() / ORACLE_WORK_ID / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, int] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = book["order"]
    return out


def abbrevs_for(osis: str, name: str, curated: list[str]) -> list[str]:
    """`[osis, the name run together, whatever the corpus already had]`.

    The curated forms come last but are never dropped: they are the strings
    this work has been resolvable by since 2026-08-16, and a citation or a
    reader's bookmark that used one must keep working across the change of
    source. `osis` and the folded name are added because `book-token.ts`
    matches them anyway, so listing them costs nothing and makes the file
    say what it can be reached by.
    """
    seen: list[str] = []
    for candidate in [osis, name.lower().replace(" ", ""), *curated]:
        if candidate not in seen:
            seen.append(candidate)
    return seen


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def oracle_books() -> dict[str, dict[int, list[int]]]:
    """`osis -> {chapter: [verse numbers]}` for the shape oracle."""
    books_dir = works_root() / ORACLE_WORK_ID / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, dict[int, list[int]]] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = {
            chap["n"]: [v["n"] for v in chap["verses"]] for chap in book["chapters"]
        }
    return out


def previous_edition() -> dict[str, dict[tuple[int, int], str]]:
    """This work as it currently stands on disk, for the re-sourcing check.

    Empty when the work is absent, which is the honest answer for a first run
    and not a failure: there is simply nothing to compare against yet.
    """
    books_dir = work_dir() / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, dict[tuple[int, int], str]] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = {
            (chap["n"], v["n"]): v["text"]
            for chap in book["chapters"]
            for v in chap["verses"]
        }
    return out


def compare_key(text: str) -> str:
    """Text folded to what the two transcriptions should agree ABOUT.

    Whitespace and the characters the two sources punctuate differently are
    removed before comparing, because they are exactly what this check must
    not fire on. liriocatolico prints `( Is 40, 3 )` where this source prints
    `([Is. 40,3])`; both are the same locator, the spacing is the transcriber's
    and neither is wrong. What the check IS for is a different WORD.
    """
    return re.sub(r"[^0-9a-zà-ÿ]+", "", text.lower())


def validate(book_docs: list[dict], sample: bool) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    faults: list[str] = []
    units = 0
    for book in book_docs:
        for chap in book["chapters"]:
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                units += 1
                where = unit.get("n") or f"before v{unit.get('before_verse')}"
                for fault in unit_faults(unit):
                    faults.append(f"{book['osis']} {chap['n']}:{where} -- {fault}")
    if faults:
        ok = False
        report.append(f"FAIL: {len(faults)} schema fault(s) in {units} unit(s):")
        report += [f"  {f}" for f in faults[:20]]
        if len(faults) > 20:
            report.append(f"  (+{len(faults) - 20} more)")
    else:
        report.append(f"OK: {units} units carry no schema faults")

    if sample:
        report.append(
            "SKIP: sample run; the shape and re-sourcing oracles need the whole edition"
        )
        return ok, report

    if len(book_docs) != 73:
        ok = False
        report.append(f"FAIL: {len(book_docs)} books, expected 73")

    # --- the shape oracle -------------------------------------------------
    oracle = oracle_books()
    if not oracle:
        report.append(f"SKIP: {ORACLE_WORK_ID} not in the corpus; shape oracle not run")
    else:
        chapter_diffs: list[str] = []
        verse_diffs: list[str] = []
        for book in book_docs:
            theirs = oracle.get(book["osis"])
            if theirs is None:
                continue
            if len(book["chapters"]) != len(theirs):
                chapter_diffs.append(
                    f"{book['osis']}: {len(book['chapters'])} vs {len(theirs)}"
                )
            for chap in book["chapters"]:
                mine = [v["n"] for v in chap["verses"]]
                other = theirs.get(chap["n"])
                if other is not None and set(mine) != set(other):
                    verse_diffs.append(f"{book['osis']} {chap['n']}")
        if chapter_diffs:
            report.append(
                f"NOTE: {len(chapter_diffs)} book(s) differ from {ORACLE_WORK_ID} in "
                f"chapter count: {', '.join(chapter_diffs[:10])}"
            )
        # Divergence, not defect -- this edition translates the original
        # languages and the oracle is the Vulgate. Reported so the number is
        # visible and can be compared with the liriocatolico scrape's.
        report.append(
            f"NOTE: {len(verse_diffs)} chapter(s) differ from {ORACLE_WORK_ID} in verse "
            f"set -- edition divergence (docs/research/bible-edition-divergence.md), not "
            f"a defect: {', '.join(verse_diffs[:12])}"
            + (f" (+{len(verse_diffs) - 12} more)" if len(verse_diffs) > 12 else "")
        )

    # --- the re-sourcing oracle -------------------------------------------
    prior = previous_edition()
    if not prior:
        report.append(
            "SKIP: no existing bible.matos-soares.pt on disk; re-sourcing check not run"
        )
        return ok, report

    same = differ = only_mine = only_theirs = 0
    examples: list[str] = []
    missing: list[str] = []
    for book in book_docs:
        theirs = prior.get(book["osis"], {})
        mine = {
            (chap["n"], v["n"]): v["text"]
            for chap in book["chapters"]
            for v in chap["verses"]
        }
        for key, text in mine.items():
            other = theirs.get(key)
            if other is None:
                only_mine += 1
            elif compare_key(text) == compare_key(other):
                same += 1
            else:
                differ += 1
                if len(examples) < 12:
                    examples.append(
                        f"{book['osis']} {key[0]}:{key[1]}\n"
                        f"      was: {other[:110]}\n"
                        f"      now: {text[:110]}"
                    )
        for key in sorted(theirs):
            if key in mine:
                continue
            only_theirs += 1
            missing.append(f"{book['osis']} {key[0]}:{key[1]}")

    total = same + differ
    rate = (same / total * 100) if total else 0.0
    report.append(
        f"RE-SOURCING: {same}/{total} verses ({rate:.2f}%) agree with the edition "
        f"already on disk, folding whitespace and punctuation away; {differ} differ, "
        f"{only_mine} are new here, {only_theirs} are only in the old scrape"
    )
    if missing:
        # THE NUMBER THAT DECIDES THE RE-SOURCING. A verse the old scrape has
        # and this one does not is Scripture that would disappear from the
        # corpus, which no amount of new apparatus pays for. Listed rather
        # than counted because the answer depends entirely on whether they
        # cluster -- a contiguous run is one source defect, and scattered
        # singletons are versification.
        report.append(
            f"  {len(missing)} verse(s) in the old scrape and NOT here: "
            + ", ".join(missing[:40])
            + (f" (+{len(missing) - 40} more)" if len(missing) > 40 else "")
        )
    if examples:
        report.append("  Differences to read before accepting the change of source:")
        report += [f"    {e}" for e in examples]
        if differ > len(examples):
            report.append(f"    (+{differ - len(examples)} more)")
    return ok, report


# --------------------------------------------------------------------------
# The apparatus, keyed by address
# --------------------------------------------------------------------------


def apparatus(*, offline: bool = True) -> dict[str, dict[int, dict]]:
    """`osis -> chapter number -> {summary, headings, notes}`.

    `notes` is keyed by verse number, because that is the address the caller
    joins on -- the verse TEXT this source carries is discarded here, and
    everything below is what the caller cannot get from its own source.

    Offline by default: the crawl is committed under `raw/vulgata-online/MS/`
    and `matos_soares.py` must never reach the network on this host's behalf
    while it is being polite to another one.
    """
    corrections = load_corrections(WORK_ID)
    segment_corrections = [c for c in corrections if "record" in c["locator"]]
    book_docs, anomalies, _applied = run_scrape(
        sample=False,
        offline=offline,
        refresh=False,
        segment_corrections=segment_corrections,
    )
    fatal = [a for a in anomalies if a.fatal]
    if fatal:
        raise SystemExit(
            f"apparatus(): {len(fatal)} fatal anomaly/anomalies parsing the "
            f"{SOURCE_EDITION} cache; run --report and file segment corrections."
        )

    out: dict[str, dict[int, dict]] = {}
    for book in book_docs:
        for chap in book["chapters"]:
            entry: dict = {}
            if chap.get("summary"):
                entry["summary"] = chap["summary"]
            if chap.get("headings"):
                entry["headings"] = chap["headings"]
            notes = {v["n"]: v["notes"] for v in chap["verses"] if v.get("notes")}
            if notes:
                entry["notes"] = notes
            if entry:
                out.setdefault(book["osis"], {})[chap["n"]] = entry
    return out


#: Everything but letters and digits, for comparing two transcriptions of one
#: printing. Accents go too: the two disagree about them in places (`E tempo`
#: for `É tempo`), and a lemma is a phrase long enough that folding them
#: cannot plausibly match the wrong words.
def fold_with_map(text: str) -> tuple[str, list[int]]:
    """`(folded text, index in the original of each folded character)`.

    The map is what makes this usable for PLACING something rather than just
    comparing: fold both strings, find the lemma in the folded verse, then ask
    the map where that match ends in the verse the reader will actually see.
    """
    folded: list[str] = []
    positions: list[int] = []
    # DECOMPOSED PER CHARACTER, NOT OVER THE WHOLE STRING, so an index in the
    # map is an index into `text` as the caller holds it. Normalizing the
    # string first and enumerating THAT was the first version and it was
    # quietly wrong: NFD turns "ã" into two code points, so every accent
    # before a lemma pushed its token one place further left, and Portuguese
    # has an accent every few words. It put the marker inside the space in
    # John 3:5 -- "quem não renascer ⟦1⟧da água" -- which is exactly the kind
    # of off-by-one that looks like a formatting quirk instead of a bug.
    for index, char in enumerate(text):
        for part in unicodedata.normalize("NFD", char):
            if unicodedata.combining(part):
                continue
            lowered = part.lower()
            if lowered.isalnum():
                folded.append(lowered)
                positions.append(index)
    return "".join(folded), positions


def anchor_notes(
    text: str, notes: list[dict]
) -> tuple[str | None, list[str], list[str]]:
    """`(text_marked, notes with no lemma, notes whose lemma was not found)`.

    THE TWO FAILURE KINDS ARE REPORTED APART BECAUSE THEY MEAN DIFFERENT
    THINGS. A note with no lemma was never anchorable -- the source simply did
    not open it by quoting anything, and roughly two in five of this edition's
    notes are like that. A note whose lemma is not in our verse is the
    interesting one: the two transcriptions disagree about those words, which
    is the same signal the Douay-Rheims lemma oracle reports
    (`docs/research/douay-rheims-lemma-audit.md`). Collapsing them into one
    number would hide the second behind the first.

    A note is anchored where its `lemma` ENDS, which is where a printed
    edition sets the marker (docs/corpus-schema.md). Tokens are inserted from
    the last position backwards so that placing one cannot move the next.

    A LEMMA THAT MATCHES NOWHERE GETS NO TOKEN, and the note still ships. That
    is the schema's own asymmetry -- every token must have a note, a note need
    not have a token -- and here it has a second justification: the lemma was
    quoted from a different transcription of the same printing, so a miss
    means the two disagree about those words, which is exactly the case where
    guessing a position would put the marker in the wrong place.
    """
    folded, positions = fold_with_map(text)
    placements: list[tuple[int, str]] = []
    no_lemma: list[str] = []
    not_found: list[str] = []
    taken: set[int] = set()
    for note in notes:
        lemma = note.get("lemma")
        if not lemma:
            no_lemma.append(note["marker"])
            continue
        needle, _ = fold_with_map(lemma)
        if not needle:
            no_lemma.append(note["marker"])
            continue
        at = folded.find(needle)
        # A lemma repeated in one verse takes its next occurrence, so two
        # notes quoting the same words do not stack on one position.
        while at != -1 and at in taken:
            at = folded.find(needle, at + 1)
        if at == -1:
            not_found.append(note["marker"])
            continue
        taken.add(at)
        end = positions[at + len(needle) - 1] + 1
        placements.append((end, note["marker"]))

    if not placements:
        return None, no_lemma, not_found
    marked = text
    for end, marker in sorted(placements, reverse=True):
        marked = marked[:end] + TOKEN.format(marker) + marked[end:]
    return marked, no_lemma, not_found


def census(book_docs: list[dict]) -> dict[str, int]:
    """What the cached edition holds, for the report. Counts the verses too,
    which this module does not export -- they are what the comparison against
    the corpus's own transcription is made of."""
    chapters = [c for b in book_docs for c in b["chapters"]]
    verses = [v for c in chapters for v in c["verses"]]
    headings = [h for c in chapters for h in (c.get("headings") or [])]
    notes = [n for u in [*verses, *headings] for n in (u.get("notes") or [])]
    return {
        "books": len(book_docs),
        "chapters": len(chapters),
        "verses": len(verses),
        "notes": len(notes),
        "notes with lemma": sum(1 for n in notes if n.get("lemma")),
        "chapter arguments": sum(1 for c in chapters if c.get("summary")),
        "headings": len(headings),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--report",
        action="store_true",
        help="Parse the cached MS edition and print the comparison against the "
        "text already in the corpus. Writes nothing, ever.",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Bypass the cache and re-fetch every response from the network.",
    )
    args = parser.parse_args()
    require_corpus()

    corrections = load_corrections(WORK_ID)
    segment_corrections = [c for c in corrections if "record" in c["locator"]]
    print(f"Reading {SOURCE_EDITION} from {BASE_URL}\n")
    book_docs, anomalies, _applied = run_scrape(
        sample=False,
        offline=not args.refresh,
        refresh=args.refresh,
        segment_corrections=segment_corrections,
    )

    fatal = [a for a in anomalies if a.fatal]
    if anomalies:
        print(f"\n{len(anomalies)} anomaly/anomalies ({len(fatal)} fatal):")
        for a in [*fatal, *[a for a in anomalies if not a.fatal]][:40]:
            print(f"  {'FATAL ' if a.fatal else ''}{a.osis} {a.chapter}: {a.detail}")
        if len(anomalies) > 40:
            print(f"  (+{len(anomalies) - 40} more)")

    counts = census(book_docs)
    print()
    for key, value in counts.items():
        print(f"  {key:<24} {value:>6}")

    ok, report = validate(book_docs, False)
    print()
    for line in report:
        print(line)
    print(
        "\nREAD-ONLY: this module supplies apparatus to matos_soares.py and writes nothing."
    )
    return 0 if ok and not fatal else 1


if __name__ == "__main__":
    raise SystemExit(main())
