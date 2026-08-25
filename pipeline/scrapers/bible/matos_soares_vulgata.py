#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""The Matos Soares Bible with its apparatus, as `bible.matos-soares.pt`.

Source: https://vulgata.online, edition `MS`, through the same undocumented
JSON API `douay_rheims.py` and `introductions.py` read:

    GET /api/text/readings2/?ed=MS&bk={abbr}&cn={n}

THIS WORK ALREADY EXISTED, FROM A DIFFERENT SOURCE, and that is the thing to
understand before touching this file. `matos_soares.py` (still present, still
the record of how the work was first built) scrapes liriocatolico.com.br,
whose pages print the SAME 1956 translation but print the footnote MARKERS
only -- `[i]`, `[ii]` -- with no note text anywhere on the page. Its manifest
has said so since 2026-08-16, and said what to do about it: "Possible future
enrichment: vulgata.online carries Matos Soares footnotes and could backfill
notes[] by marker position in a later pass."

Backfilling by marker position turned out to be the wrong shape. The markers
were stripped at ingestion and their offsets never recorded, so there is
nothing left in the corpus to align a note against; recovering the positions
means re-parsing liriocatolico anyway and then reconciling two transcriptions
character by character to place each anchor. This source carries the text AND
the apparatus together, already anchored, in the format the Douay-Rheims
parser reads -- so re-taking the edition from it is both less work and less
invention than joining two halves the source never joined.

WHY THAT IS SAFE, measured rather than assumed: the two transcriptions agree.
`validate` re-checks it every run against whatever edition of this work is
already on disk, and REPORTS the per-verse agreement rate rather than
asserting one. A re-sourcing that silently changed the text would be a worse
outcome than a missing apparatus, so the check is the point of the run and not
a formality.

WHAT THIS SOURCE ADDS over liriocatolico: the notes themselves, the chapter
arguments (`cd`), the section headings the edition prints inside a chapter
(`h1`/`h2`/`h3`/`ln`), and the book prefaces (`bd`, which belong to
`bible-intro.pt` and are NOT taken here -- the same split the Douay-Rheims
makes with `bible-intro.en`, because a preface describes the book rather than
the translation).

WHAT IT ALSO ADDS, and the reason this file needs its own `normalize`: this
edition sets quoted clauses in `_..._` and prints scripture locators in
brackets inside running prose (`([Is. 40,3])`). The Douay-Rheims does neither
in a verse. Both are flattened here -- emphasis is the v1 loss
docs/corpus-schema.md records, and the brackets come off so the site's
citation parser meets a locator in running prose, the shape it reads
everywhere else. `raw/` keeps both verbatim.

Usage:
    uv run pipeline/scrapers/bible/matos_soares_vulgata.py --sample
    uv run pipeline/scrapers/bible/matos_soares_vulgata.py
    uv run pipeline/scrapers/bible/matos_soares_vulgata.py --offline
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

# See the note above the same two lines in douay_rheims.py.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    Fetcher,
    FetchPolicy,
    raw_root,
    require_corpus,
    works_root,
    write_stamped_json,
)
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
        only_theirs += sum(1 for key in theirs if key not in mine)

    total = same + differ
    rate = (same / total * 100) if total else 0.0
    report.append(
        f"RE-SOURCING: {same}/{total} verses ({rate:.2f}%) agree with the edition "
        f"already on disk, folding whitespace and punctuation away; {differ} differ, "
        f"{only_mine} are new here, {only_theirs} are only in the old scrape"
    )
    if examples:
        report.append("  Differences to read before accepting the change of source:")
        report += [f"    {e}" for e in examples]
        if differ > len(examples):
            report.append(f"    (+{differ - len(examples)} more)")
    return ok, report


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def census(book_docs: list[dict]) -> dict[str, int]:
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
        "verses with apparatus": sum(1 for v in verses if v.get("text_marked")),
        "chapter arguments": sum(1 for c in chapters if c.get("summary")),
        "headings": len(headings),
    }


def write_output(
    book_docs: list[dict], *, sample: bool, counts: dict[str, int], generated_at: str
) -> None:
    notes = (
        "1956 edition (revised from the original languages with L. G. da Fonseca "
        "SJ, Pontifical Biblical Institute), not the 1932 Vulgate-only "
        "translation. Taken from vulgata.online's transcription (edition code "
        "MS) through its JSON API, which carries the apparatus liriocatolico.com.br "
        "prints only the markers of -- see docs/decisions.md, 2026-08-25, for the "
        "change of source and the agreement measured between the two. Ingested "
        f"with the edition's footnotes ({counts['notes']}), its chapter arguments "
        f"({counts['chapter arguments']}) and the headings and lines it prints "
        f"inside a chapter ({counts['headings']}); the book prefaces are a separate "
        "work, bible-intro.pt, because a preface describes the book rather than "
        "the translation. A note quotes the words it glosses before glossing them "
        "and the source sets exactly those words in italics: they are kept as the "
        "note's `lemma`, and the point in the verse where they end carries the same "
        "U+27E6/U+27E7 token the CCC uses. Emphasis elsewhere in a verse is "
        "flattened and the source's bracketed locators lose their brackets -- both "
        "the v1 losses docs/corpus-schema.md records, both recoverable from "
        "corpus/raw/. Pre-1990-Agreement Portuguese orthography (baptizar, "
        "Unigénito, rectas) is preserved as printed. Psalter follows the Pius XII "
        '"Pian Psalter" line. Copyright status: see docs/research/copyright.md -- '
        "accepted as a knowingly self-resolving exposure until the work enters the "
        "public domain on 1 Jan 2028; the notes are under the same clock as the "
        "translation."
    )
    if sample:
        notes = (
            "SAMPLE RUN for review only -- Philemon (complete) and John "
            "(chapters 1-3 only). Not the full 73-book corpus. " + notes
        )

    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Bíblia Sagrada (Matos Soares)",
        "short_title": "Matos Soares",
        "language": "pt",
        "edition": "1956 (revised from the original languages)",
        "sources": [
            {"url": BASE_URL + "/bible/Gn.1?ed=MS", "retrieved_at": retrieved_at()}
        ],
        "copyright": {
            "status": "copyrighted",
            "holder": "Manuel de Matos Soares",
            "notice": None,
        },
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
    }

    write_stamped_json(
        work_dir(),
        {
            "manifest.json": manifest,
            **{f"books/{b['osis']}.json": b for b in book_docs},
        },
        generated_at,
    )


def retrieved_at() -> str:
    """The date this edition was actually FETCHED -- see douay_rheims.py.

    Note this deliberately reads the manifest of whatever is on disk, which on
    the first run of this scraper is the LIRIOCATOLICO scrape's manifest, whose
    retrieval date belongs to a different source. So the first run must be the
    one that stamps today, and it is: the value is only preserved when the
    manifest already names this source.
    """
    existing = work_dir() / "manifest.json"
    if existing.exists():
        try:
            prior = json.loads(existing.read_text(encoding="utf-8"))
            source = (prior.get("sources") or [{}])[0]
            if BASE_URL in (source.get("url") or ""):
                stamp = source.get("retrieved_at")
                if isinstance(stamp, str) and stamp:
                    return stamp
        except (json.JSONDecodeError, OSError, IndexError):
            pass
    return datetime.now(UTC).date().isoformat()


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
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and validate, but write nothing. The re-sourcing check needs "
        "the edition already on disk, so this is how to read it before deciding.",
    )
    args = parser.parse_args()
    require_corpus()

    # NO CORRECTIONS ARE LOADED HERE, and that is deliberate rather than an
    # omission. `pipeline/corrections/bible.matos-soares.pt.json` holds 39
    # entries, and every one of them describes a defect in the LIRIOCATOLICO
    # scan -- capital I read for lowercase l ("Ihe" for "lhe"), words split
    # across whitespace, and the adjudications that decided which of those were
    # real. This transcription is a different one and does not have those
    # defects; applying the file here would fail its own drift guard on the
    # first entry, which is the layer working correctly.
    #
    # So a collision in THIS source has no correction to resolve it and is
    # fatal, exactly as it should be: `apply_segment_corrections` is called
    # with an empty list, and if the run stops naming a chapter, that chapter
    # needs a filed correction before this edition can ship. The Douay-Rheims
    # needed eleven; how many this one needs is not yet known.
    segment_corrections: list[dict] = []

    print(f"Fetching {SOURCE_EDITION} from {BASE_URL}, one request per chapter\n")
    book_docs, anomalies, _applied = run_scrape(
        sample=args.sample,
        offline=args.offline,
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

    ok, report = validate(book_docs, args.sample)
    ok = ok and not fatal
    print()
    for line in report:
        print(line)
    print(f"\nVALIDATION: {'PASS' if ok else 'FAIL'}")

    if not ok:
        print("\nRefusing to write a work that failed validation.", file=sys.stderr)
        return 1
    if args.dry_run:
        print("\n--dry-run: nothing written.")
        return 0

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_output(
        book_docs, sample=args.sample, counts=counts, generated_at=generated_at
    )
    print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
