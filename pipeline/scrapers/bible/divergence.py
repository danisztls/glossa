#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Where the Bible editions disagree about verse shape, and whether anyone has
said why yet.

A tool over already-written output, like `audit.py` and `census.py`: it makes
no requests and writes no work. It reads the four editions out of `build/` and
answers one question -- which addresses name different amounts of text in
different editions -- in the one form that is useful, which is a list a person
has classified.

WHY A CLASSIFICATION LIVES IN THIS FILE. `docs/research/bible-edition-
divergence.md` asked for a table "generated like `xrefs/`, but with the
CLASSIFICATION reviewed by a person -- a script can detect that two editions
disagree; it cannot diagnose why". `KINDS` below is that review, and keeping
it here rather than in the prose is what turns the document from a snapshot
into a check: the script compares what it measures against what is classified
and fails on either half being stale. A chapter that starts diverging and
nobody has read is an UNCLASSIFIED line; a classified chapter that stops
diverging is a STALE line. Both are the same failure -- a table that no longer
describes the corpus -- and neither is visible from the prose alone.

WHY THE LATIN IS A COLUMN AND NOT AN ARBITER. `bible.clementina.la` is the
text `bible.cpdv.en` and `bible.douay-rheims.en` were translated from and the
one `bible.matos-soares.pt` follows, so where the vernaculars disagree it is
evidence rather than a third opinion (pipeline/docs/oracles.md). But it
is evidence about ONE question -- how the base divides its verses -- and Psalm
13 is the standing proof that this is not the same question as which reading
is right: there the Latin's verse COUNT sides with the Portuguese while its
TEXT sides with the English. So the `LA` column is reported and never resolves
a row on its own.

    ./divergence.py                 # the table, and the staleness check
    ./divergence.py --verbose       # + every verse-number set in full

THE SILENT CASE IS FOUND ELSEWHERE NOW, and `SILENT` below is the record of
what has been read rather than the output of a search. Comparing verse-number
SETS finds only the chapters that are loud about disagreeing; the dangerous
shape is a chapter whose numbers match while its text has moved under them,
because nothing then marks that a citation resolves to the wrong sentences.
This file used to hunt for those with `--shifted`, a length-ratio outlier
against the Latin inside chapters whose sets agree. `audit.py balance` is the
same signal with the two things this file cannot give it: all nine editions
instead of one Latin, and a vote to say which edition is the odd one out. It
found `acts 14` and `1cor 9` below, so `--shifted` was deleted rather than
kept in parallel.

WHAT THE NINTH EDITION SAID ABOUT `ps 77`, which is why the vote was worth
having: `--shifted` saw Matos Soares alone against the Latin and it was
classified a local re-partition. Straubinger divides it identically, and two
editions translated from the Hebrew agreeing against the Vulgate is that
division, not two parsers slipping the same way -- the same rule `audit.py
refs` states as two editions agreeing on a value being one witness. The entry
stands with its second witness recorded; what changed is what it means.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line is
# here and why the import below it is not at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import build_root, require_corpus

# The vernacular pair whose disagreement defines a row, then the two witnesses
# reported beside it. EN and PT are what the reader actually chooses between
# (`CONTENT_LANG_FALLBACK`, site/src/lib/corpus.ts); LA is their base; DR is a
# second English edition of that base, and it earns its column by disagreeing
# with CPDV twice -- at ps 125 and ps 135 it divides the Latin's last verse in
# two, exactly as CPDV does, which is what shows those rows to be a habit of
# the English tradition rather than an accident of one translator.
PAIR = ("en", "pt")
EDITIONS = {
    "en": "bible.cpdv.en",
    "pt": "bible.matos-soares.pt",
    "la": "bible.clementina.la",
    "dr": "bible.douay-rheims.en",
}

# --------------------------------------------------------------------------
# The review. Measured 2026-08-16 over two editions, re-measured and
# classified 2026-08-25 over four -- see docs/research/bible-edition-
# divergence.md, which this table is the machine-readable half of.
#
# The four kinds are not four severities of one thing. They differ in what a
# reader is owed and in what, if anything, could ever be mapped:
#
#   arrangement     The book's material is ordered differently by tradition.
#                   Nothing maps chapter-to-chapter; the whole book is a
#                   different shape. Esther, and only Esther.
#   re-division     One edition divides the same words into more verses by a
#                   principle it applies throughout the passage. Mappable in
#                   bulk, but only by reading the passage as a whole.
#   merge-split     One incidental boundary, one edition dividing where the
#                   other joins. Mappable exactly, and `MAPPINGS` does.
#   textual-variant One edition carries words the other does not. Not a
#                   numbering question at all.
# --------------------------------------------------------------------------
KINDS: dict[tuple[str, int], tuple[str, str]] = {
    **{
        ("esth", n): (
            "arrangement",
            (
                "CPDV prefixes the Greek additions and renumbers the whole book "
                "around them; the Vulgate, and every edition following it, appends "
                "them as 10:4-16:24. So CPDV 1 is Mardochai's dream (Vulgate 11), "
                "CPDV 2 the eunuchs' plot (Vulgate 12), and the Hebrew Esther "
                "starts at CPDV 3. Every chapter of the book names different text "
                "in the two editions; the 16 rows here are only the chapters loud "
                "enough about it to differ in verse COUNT as well."
            ),
        )
        for n in range(1, 17)
    },
    ("gen", 37): (
        "merge-split",
        (
            "The Latin's v35 ends 'Et illo perseverante in fletu,'; Matos Soares "
            "sets those words as its own v36 and every other edition keeps them "
            "with v35."
        ),
    ),
    ("judg", 21): (
        "merge-split",
        (
            "Latin v24 carries both the return to the tents and 'In diebus illis "
            "non erat rex in Israel'; Matos Soares divides them."
        ),
    ),
    ("2sam", 13): (
        "merge-split",
        (
            "Latin v38 carries Absalom's flight to Gessur and David's ceasing to "
            "pursue him; Matos Soares divides them."
        ),
    ),
    ("ps", 13): (
        "textual-variant",
        (
            "Matos Soares omits the catena quoted at Romans 3:13-18 entirely. The "
            "Clementine carries it, folded into its v3, and so does the "
            "Douay-Rheims; CPDV carries it too and numbers it as vv. 4-6. So the "
            "Latin's verse COUNT (7) agrees with the Portuguese while its TEXT "
            "agrees with the English -- the one row where the two oracles point "
            "opposite ways, and the reason no row is decided by count alone."
        ),
    ),
    ("ps", 43): (
        "merge-split",
        (
            "Latin v22 carries both 'Nonne Deus requiret ista' and 'Quoniam propter "
            "te mortificamur tota die'; Matos Soares divides them."
        ),
    ),
    ("ps", 92): (
        "re-division",
        (
            "Two causes at once. The Clementine prints no title for this psalm; "
            "CPDV and Matos Soares both carry one, and CPDV alone numbers it as a "
            "verse rather than folding it into the first -- which it does fold "
            "everywhere else, ps 13:1 included. CPDV then also divides the Latin's "
            "v1 into two."
        ),
    ),
    ("ps", 125): (
        "merge-split",
        (
            "Latin v6 carries both the going out weeping and the coming back "
            "rejoicing; CPDV and the Douay-Rheims both divide them, which is what "
            "makes this the tradition's habit rather than one translator's."
        ),
    ),
    ("ps", 135): (
        "merge-split",
        (
            "Latin v26 carries both 'Confitemini Deo caeli' and 'Confitemini "
            "Domino dominorum'; CPDV and the Douay-Rheims both divide them."
        ),
    ),
    ("sir", 29): (
        "merge-split",
        (
            "Latin v33 carries both the guest being sent away and the reason for "
            "it; Matos Soares divides them."
        ),
    ),
    **{
        ("song", n): (
            "re-division",
            (
                "CPDV re-divides the Song by SPEAKER, printing the attribution in "
                "the verse text ('Bride:', 'Groom to Bride:', 'Chorus to Bride:') "
                "and numbering each speech as its own verse. Latin 1:1-3 is CPDV "
                "1:1-7. This is an editorial reading of the poem imposed on the "
                "verse numbers, applied throughout the book -- not an incidental "
                "boundary, and mappable only by reading the passage whole."
            ),
        )
        for n in (1, 2, 5, 7, 8)
    },
    ("2thess", 2): (
        "merge-split",
        (
            "Latin v10 carries both the seduction of iniquity and 'Ideo mittet "
            "illis Deus operationem erroris'; Matos Soares divides them, so from "
            "v11 to the end of the chapter every number is one apart -- EN 16 is "
            "PT 17."
        ),
    ),
}

# Only `merge-split` rows appear here, and that is the point of the kinds: an
# `arrangement` row has no chapter-level correspondence to record, a
# `re-division` row has one only for the passage as a whole, and a
# `textual-variant` row is not a numbering question. Read `en 22 <-> pt 22+23`
# as "what CPDV numbers 22, Matos Soares numbers 22 and 23"; verses before the
# split correspond one-to-one and are not listed.
SILENT: dict[tuple[str, int], tuple[str, str]] = {
    ("acts", 14): (
        "span-shift",
        (
            "Matos Soares divides the Latin's v6 in two ('Ai pregavam o Evangelho' "
            "= 'et ibi evangelizantes erant') and then rejoins the Latin's v26 and "
            "v27 at the end, so the chapter still runs 1-27 in both editions and "
            "the number sets match exactly. Between them, for TWENTY VERSES, the "
            "same number names different text: en 6 <-> pt 6+7, then en 7-25 "
            "<-> pt 8-26, then en 26+27 <-> pt 27. This is the failure the "
            "research note said number-set comparison could not see, and it is the "
            "worst instance in the corpus."
        ),
    ),
    ("1cor", 9): (
        "local-repartition",
        (
            "Matos Soares pulls 'Non alligabis os bovi trituranti' up into v8 and "
            "restores the boundary by v10, so its v9 is only 'Porventura Deus tem "
            "cuidado dos bois?'. A citation to 1 Corinthians 9:9 -- which is how "
            "the Deuteronomy quotation is usually cited -- lands on the wrong "
            "sentence in Portuguese."
        ),
    ),
    ("ps", 77): (
        "local-repartition",
        (
            "Matos Soares moves 'Et eiecit a facie eorum Gentes' out of the "
            "Latin's v54 and into its v55, restoring the boundary at v56. "
            "Straubinger divides it at the same word, which is the Hebrew "
            "division of the psalm and not either translator's slip -- found "
            "by `audit.py balance` declining to call it a lead, the two "
            "editions standing together against the other seven."
        ),
    ),
}

# Verse-for-verse correspondences, hand-checked, for the chapters where one
# exists. Proposal §4 of the research note: record a mapping only where a
# person has confirmed it, so that citations and compare mode can be RIGHT in
# those chapters rather than merely cautious.
MAPPINGS: dict[tuple[str, int], str] = {
    ("gen", 37): "en 35 <-> pt 35+36; en 36 <-> pt 37",
    ("judg", 21): "en 24 <-> pt 24+25",
    ("2sam", 13): "en 38 <-> pt 38+39",
    ("ps", 43): "en 22 <-> pt 22+23; en 23-26 <-> pt 24-27",
    ("ps", 125): "en 6+7 <-> pt 6",
    ("ps", 135): "en 26+27 <-> pt 26",
    ("sir", 29): "en 33 <-> pt 33+34; en 34 <-> pt 35",
    ("2thess", 2): "en 10 <-> pt 10+11; en 11-16 <-> pt 12-17",
}


def load(work_id: str) -> dict[tuple[str, int], dict[int, str]]:
    """Every chapter of one edition as `{(osis, n): {verse: text}}`."""
    books = build_root() / work_id / "books"
    out: dict[tuple[str, int], dict[int, str]] = {}
    for path in sorted(books.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        for chapter in book["chapters"]:
            out[(book["osis"], chapter["n"])] = {
                v["n"]: v["text"] for v in chapter["verses"]
            }
    return out


def order(key: tuple[str, int], books: list[str]) -> tuple[int, int]:
    """Canonical order, so the table reads down the Bible rather than
    alphabetically -- `esth` before `ps` before `2thess`."""
    return (books.index(key[0]) if key[0] in books else len(books), key[1])


def summarize(verses: dict[int, str] | None) -> str:
    """A verse-number set as a person reads it: the span, the count, and any
    hole in the middle. A hole is worth printing even though nothing here has
    one today -- a chapter missing an interior verse is a defect and not a
    divergence, and the two must not look alike in the output."""
    if verses is None:
        return "absent"
    lo, hi = min(verses), max(verses)
    gaps = sorted(set(range(lo, hi + 1)) - set(verses))
    return f"{lo}-{hi} ({len(verses)})" + (f" missing {gaps}" if gaps else "")


def side(en: set[int], pt: set[int], la: set[int] | None) -> str:
    """Which vernacular the Latin's verse division agrees with. Says nothing
    about which reading is right -- see the docblock, and ps 13."""
    if la is None:
        return "-"
    if la == en == pt:
        return "both"
    if la == en:
        return "EN"
    if la == pt:
        return "PT"
    return "neither"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--verbose", action="store_true", help="Print every verse-number set."
    )
    args = parser.parse_args()
    require_corpus()

    eds = {tag: load(work) for tag, work in EDITIONS.items()}
    en, pt, la, dr = eds["en"], eds["pt"], eds["la"], eds["dr"]
    # Canonical order comes from a manifest, not from sorting: `2thess` after
    # `sir` after `ps` is the Bible's order and no string comparison finds it.
    books = json.loads(
        (build_root() / EDITIONS["pt"] / "manifest.json").read_text(encoding="utf-8")
    )["books"]

    differing = {k for k in set(en) & set(pt) if en[k].keys() != pt[k].keys()} | (
        set(en) ^ set(pt)
    )
    found = sorted(differing, key=lambda k: order(k, books))

    print(
        f"{len(found)} chapters where {EDITIONS['en']} and {EDITIONS['pt']} "
        f"divide the text differently\n"
    )
    width = max((len(f"{k[0]} {k[1]}") for k in found), default=10)
    counts: dict[str, int] = {}
    for key in found:
        kind, why = KINDS.get(key, ("UNCLASSIFIED", "nobody has read this one yet"))
        counts[kind] = counts.get(kind, 0) + 1
        taken = side(
            set(en.get(key) or ()),
            set(pt.get(key) or ()),
            set(la[key]) if key in la else None,
        )
        print(f"{f'{key[0]} {key[1]}':<{width}}  {kind:<16} LA agrees with {taken}")
        if args.verbose:
            for tag, ed in (("EN", en), ("PT", pt), ("LA", la), ("DR", dr)):
                print(f"{'':<{width}}    {tag} {summarize(ed.get(key))}")
            print(f"{'':<{width}}    {why}")
            if key in MAPPINGS:
                print(f"{'':<{width}}    mapping: {MAPPINGS[key]}")

    print("\n" + "  ".join(f"{k}: {v}" for k, v in sorted(counts.items())))

    print("\nSilent divergence -- verse-number sets AGREE, text has moved:")
    for key, (kind, why) in sorted(SILENT.items(), key=lambda kv: order(kv[0], books)):
        print(f"  {f'{key[0]} {key[1]}':<{width}}  {kind}")
        if args.verbose:
            print(f"{'':<{width + 4}}  {why}")
    print(
        f"  {len(SILENT)} confirmed and read; `audit.py balance` is what looks for more"
    )

    unclassified = [k for k in found if k not in KINDS]
    stale = [k for k in KINDS if k not in set(found)]
    for keys, label, fix in (
        (unclassified, "UNCLASSIFIED", "read the chapter and add it to KINDS"),
        (stale, "STALE", "the chapter no longer diverges; drop it from KINDS"),
    ):
        if keys:
            print(
                f"\n{label}: {', '.join(f'{o} {n}' for o, n in sorted(keys))}\n"
                f"  -- {fix}, and update docs/research/bible-edition-divergence.md"
            )
    if unclassified or stale:
        return 1

    print(
        f"\nOK: all {len(found)} diverging chapters are classified, and every "
        "classified chapter still diverges"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
