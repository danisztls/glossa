#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""Clementine Vulgate (Hetzenauer 1914) scraper.

Source: https://sacredbible.org/vulgate1914/ -- one HTML file per book, in
the same hand-built template as the CPDV pages `cpdv.py` reads from the same
operator. The template itself lives in `sacredbible.py`; this file is the
73-book table, the manifest, and the checks that are about *this edition*
rather than about the page format. See `docs/research/vulgate-edition-choice.md`
for why this edition and not the Nova Vulgata or IntraText's `Vulgata`.

Two things about the text are deliberate and must not be "fixed":

  - **It prints `i` where later conventions print `j`** -- `Iesus`,
    `iudicium`, `adiutor`; there is not one `j` in the body text. The book
    TITLES on the index page do use `J` (`Josue`, `Judices`, `Joannes`),
    which is the source's own inconsistency, not ours. Both spellings are
    emitted as jump-box abbreviations (see `abbrevs_for`) so a reader can
    type either; the text keeps what was printed.
  - **It uses the ae/oe ligatures** -- `caelum` is printed `cælum`, 1,073
    times in the Psalms alone. Same treatment: preserved in the text,
    folded in the lookup keys.

Corpus fidelity says the stored text is what the page prints
(docs/decisions.md, Source-defect corrections policy). Normalising
orthography on the way in would make the Latin edition a silent modernisation
of a 1914 critical printing, and would do it in the one place -- the corpus --
where it could not be undone without re-parsing.

Usage:
    uv run pipeline/scrapers/vulgate.py              # full 73-book run
    uv run pipeline/scrapers/vulgate.py --sample     # Philemon + Joannes 1-3
    uv run pipeline/scrapers/vulgate.py --offline    # cache-only, no network
    uv run pipeline/scrapers/vulgate.py --refresh    # bypass cache, re-fetch

Caches every raw fetched page under corpus/raw/vulgate1914/ and is fully
offline-capable from that cache on re-runs. Ends with a validation pass that
prints a summary table and exits non-zero on failure.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# Sibling modules in this directory -- a script's own directory is on
# sys.path, so this resolves regardless of the working directory.
from common import CorrectionDriftError, chapter_opening_letter, load_corrections
from sacredbible import Anomaly, Fetcher, parse_book, verse_text_faults

BASE_URL = "https://sacredbible.org/vulgate1914/"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
# sacredbible.org's robots.txt sets no Crawl-delay and disallows only the
# page-scan directories (/hetzenauer1914/scans/ and friends), not the text.
# 1.0s is this project's self-chosen floor for that host, matching cpdv.py --
# stated here rather than shared, per common.py's note on rate limits.
RATE_LIMIT_SECONDS = 1.0

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = REPO_ROOT / "corpus" / "raw" / "vulgate1914"
WORK_DIR = REPO_ROOT / "corpus" / "works" / "bible.clementina.la"
WORK_ID = "bible.clementina.la"

# (osis, filename, display name) in the schema's canonical 73-book order.
# docs/corpus-schema.md §"Canonical book order".
#
# NOTE THE FILENAME NUMBERING IS NOT THE ORDER. The source numbers its files
# in the Vulgate's own arrangement, which closes the Old Testament with
# Maccabees (VT-44 Malachias, VT-45/46 Machabaeus); the corpus's canonical
# order places them after Esther, as the existing two editions do. The
# corpus order wins here so that all three editions sort alike -- corpus.ts
# merges books across editions into one canonical list keyed by OSIS, so a
# per-edition order is not a thing that can exist. Adopting the Vulgate
# arrangement corpus-wide was considered and declined
# (docs/research/vulgate-edition-choice.md §6).
#
# Display names are the source's own, ligatures included (Michæas, Aggæus,
# Matthæus) -- see the module docstring.
BOOKS: list[tuple[str, str, str]] = [
    # OT (46)
    ("gen", "VT-01_Genesis.htm", "Genesis"),
    ("exod", "VT-02_Exodus.htm", "Exodus"),
    ("lev", "VT-03_Leviticus.htm", "Leviticus"),
    ("num", "VT-04_Numeri.htm", "Numeri"),
    ("deut", "VT-05_Deuteronomium.htm", "Deuteronomium"),
    ("josh", "VT-06_Josue.htm", "Josue"),
    ("judg", "VT-07_Judices.htm", "Judices"),
    ("ruth", "VT-08_Ruth.htm", "Ruth"),
    ("1sam", "VT-09_1-Samuel.htm", "I Samuel"),
    ("2sam", "VT-10_2-Samuel.htm", "II Samuel"),
    ("1kgs", "VT-11_1-Reges.htm", "I Reges"),
    ("2kgs", "VT-12_2-Reges.htm", "II Reges"),
    ("1chr", "VT-13_1-Paralipomenon.htm", "I Paralipomenon"),
    ("2chr", "VT-14_2-Paralipomenon.htm", "II Paralipomenon"),
    ("ezra", "VT-15_Esdras.htm", "Esdras"),
    ("neh", "VT-16_Nehemias.htm", "Nehemias"),
    ("tob", "VT-17_Tobias.htm", "Tobias"),
    ("jdt", "VT-18_Judith.htm", "Judith"),
    ("esth", "VT-19_Esther.htm", "Esther"),
    ("1macc", "VT-45_1-Machabaeus.htm", "I Machabæus"),
    ("2macc", "VT-46_2-Machabaeus.htm", "II Machabæus"),
    ("job", "VT-20_Job.htm", "Job"),
    ("ps", "VT-21_Psalmi.htm", "Psalmi"),
    ("prov", "VT-22_Proverbia.htm", "Proverbia"),
    ("eccl", "VT-23_Ecclesiastes.htm", "Ecclesiastes"),
    ("song", "VT-24_Canticum.htm", "Canticum Canticorum"),
    ("wis", "VT-25_Sapientia.htm", "Sapientia"),
    ("sir", "VT-26_Ecclesiasticus.htm", "Ecclesiasticus"),
    ("isa", "VT-27_Isaias.htm", "Isaias"),
    ("jer", "VT-28_Jeremias.htm", "Jeremias"),
    ("lam", "VT-29_Lamentationes.htm", "Lamentationes"),
    ("bar", "VT-30_Baruch.htm", "Baruch"),
    ("ezek", "VT-31_Ezechiel.htm", "Ezechiel"),
    ("dan", "VT-32_Daniel.htm", "Daniel"),
    ("hos", "VT-33_Osee.htm", "Osee"),
    ("joel", "VT-34_Joel.htm", "Joel"),
    ("amos", "VT-35_Amos.htm", "Amos"),
    ("obad", "VT-36_Abdias.htm", "Abdias"),
    ("jonah", "VT-37_Jonas.htm", "Jonas"),
    ("mic", "VT-38_Michaeas.htm", "Michæas"),
    ("nah", "VT-39_Nahum.htm", "Nahum"),
    ("hab", "VT-40_Habacuc.htm", "Habacuc"),
    ("zeph", "VT-41_Sophonias.htm", "Sophonias"),
    ("hag", "VT-42_Aggaeus.htm", "Aggæus"),
    ("zech", "VT-43_Zacharias.htm", "Zacharias"),
    ("mal", "VT-44_Malachias.htm", "Malachias"),
    # NT (27)
    ("matt", "NT-01_Matthaeus.htm", "Matthæus"),
    ("mark", "NT-02_Marcus.htm", "Marcus"),
    ("luke", "NT-03_Lucas.htm", "Lucas"),
    ("john", "NT-04_Joannes.htm", "Joannes"),
    ("acts", "NT-05_Actus.htm", "Actus Apostolorum"),
    ("rom", "NT-06_Romani.htm", "Romani"),
    ("1cor", "NT-07_1-Corinthii.htm", "I Corinthii"),
    ("2cor", "NT-08_2-Corinthii.htm", "II Corinthii"),
    ("gal", "NT-09_Galatae.htm", "Galatæ"),
    ("eph", "NT-10_Ephesii.htm", "Ephesii"),
    ("phil", "NT-11_Philippenses.htm", "Philippenses"),
    ("col", "NT-12_Colossenses.htm", "Colossenses"),
    ("1thess", "NT-13_1-Thessalonicenses.htm", "I Thessalonicenses"),
    ("2thess", "NT-14_2-Thessalonicenses.htm", "II Thessalonicenses"),
    ("1tim", "NT-15_1-Timotheus.htm", "I Timotheus"),
    ("2tim", "NT-16_2-Timotheus.htm", "II Timotheus"),
    ("titus", "NT-17_Titus.htm", "Titus"),
    ("phlm", "NT-18_Philemon.htm", "Philemon"),
    ("heb", "NT-19_Hebraei.htm", "Hebræi"),
    ("jas", "NT-20_Jacobus.htm", "Jacobus"),
    ("1pet", "NT-21_1-Petrus.htm", "I Petrus"),
    ("2pet", "NT-22_2-Petrus.htm", "II Petrus"),
    ("1john", "NT-23_1-Joannes.htm", "I Joannes"),
    ("2john", "NT-24_2-Joannes.htm", "II Joannes"),
    ("3john", "NT-25_3-Joannes.htm", "III Joannes"),
    ("jude", "NT-26_Judas.htm", "Judas"),
    ("rev", "NT-27_Apocalypsis.htm", "Apocalypsis"),
]

assert len(BOOKS) == 73, f"expected 73 books in BOOKS table, got {len(BOOKS)}"

# Classic Vulgate sigla, on top of the automatic ones `abbrevs_for` derives
# from each book's own name. Deliberately conservative where a siglum is
# ambiguous: the Vulgate calls Samuel and Kings I-IV Regum, so "1rg" could
# name 1 Samuel or 1 Kings depending on which convention a reader learned.
# Those are left out rather than guessed -- an abbreviation that opens the
# wrong book is worse than one that opens nothing.
_CURATED_ABBREVS: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lv"],
    "num": ["nm"],
    "deut": ["dt"],
    "josh": ["ios", "jos"],
    "judg": ["idc", "jdc"],
    "ruth": ["rt"],
    "1sam": ["1sm"],
    "2sam": ["2sm"],
    "1chr": ["1par"],
    "2chr": ["2par"],
    "ezra": ["esd"],
    "tob": ["tb"],
    "jdt": ["idt", "jdt"],
    "esth": ["est"],
    "1macc": ["1mac", "1mach"],
    "2macc": ["2mac", "2mach"],
    "job": ["iob", "job"],
    "ps": ["psa", "psalmus"],
    "prov": ["prv", "pr"],
    "eccl": ["qo"],
    "song": ["ct", "cant"],
    "wis": ["sap"],
    "sir": ["eccli"],
    "isa": ["is"],
    "jer": ["ier", "jer"],
    "lam": ["thr"],
    "ezek": ["ez"],
    "dan": ["dn"],
    "hos": ["os"],
    "joel": ["ioel", "jl"],
    "amos": ["am"],
    "obad": ["abd"],
    "jonah": ["ion", "jon"],
    "mic": ["mich", "mi"],
    "nah": ["na"],
    "zeph": ["soph"],
    "hag": ["agg"],
    "zech": ["zach"],
    "mal": ["mal"],
    "matt": ["mt"],
    "mark": ["mc"],
    "luke": ["lc"],
    "john": ["io", "jo", "ioan", "joan"],
    "acts": ["act"],
    "rom": ["rm"],
    "1cor": ["1co"],
    "2cor": ["2co"],
    "gal": ["gal"],
    "eph": ["eph"],
    "phil": ["phil"],
    "col": ["col"],
    "phlm": ["phlm", "philem"],
    "heb": ["hbr"],
    "jas": ["iac", "jac"],
    "1pet": ["1pt"],
    "2pet": ["2pt"],
    "1john": ["1io", "1jo"],
    "2john": ["2io", "2jo"],
    "3john": ["3io", "3jo"],
    "jude": ["iud", "jud"],
    "rev": ["ap", "apoc"],
}

# Known chapter counts for sanity-checking a full (untruncated) run. Same
# five books the other two editions check, and for the same reason: they are
# the ones whose counts everybody knows by heart. The Vulgate agrees with
# both existing editions on all five.
KNOWN_CHAPTER_COUNTS = {"gen": 50, "ps": 150, "matt": 28, "rev": 22, "john": 21}

SAMPLE_BOOKS = {"phlm", "john"}
SAMPLE_JOHN_CHAPTERS = {1, 2, 3}

# ae/oe ligature -> the two-letter spelling, for lookup keys only.
_LIGATURES = str.maketrans({"æ": "ae", "Æ": "ae", "œ": "oe", "Œ": "oe"})


def _spelling_variants(s: str) -> list[str]:
    """Lookup spellings for one Latin name: ligatures folded, i-/j- both ways.

    The edition prints `Iesus` in the text and `Joannes` in its own index, so
    a reader has no way to know which spelling the jump box wants. It wants
    either. Only the FIRST letter is swapped -- folding every `i` to `j`
    would turn `iudicium` into `judjcjum` and match nothing.
    """
    base = s.lower().translate(_LIGATURES).replace(" ", "")
    out = [base]
    if base.startswith("i"):
        out.append("j" + base[1:])
    elif base.startswith("j"):
        out.append("i" + base[1:])
    return out


def abbrevs_for(osis: str, name: str) -> list[str]:
    """OSIS code, alternative SPELLINGS of the name, and the curated sigla.

    The book's own name is deliberately NOT included, even though `cpdv.py`
    includes it. `site/src/lib/book-token.ts` resolves a typed token in
    tiers -- an OSIS code or a real abbreviation outranks a display name,
    and any exact reading outranks an accent-folded one -- and it already
    matches `name` in its own tier. Repeating the name here as an
    abbreviation promotes it a tier, so `genesis` would resolve to the Latin
    edition ahead of the English edition whose book is called exactly that.
    Caught by book-token.test.ts when this edition was added.

    The VARIANT spellings do belong here, because tier 2 matches the printed
    name exactly and the printed name is only ever one of the two spellings
    a reader might type: the text prints `Iesus` and the index prints
    `Joannes`, and `Matthæus` is not what anyone types on a keyboard.
    """
    plain = name.lower().replace(" ", "")
    variants = [v for v in _spelling_variants(name) if v != plain]
    base = [osis, *variants]
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
# than by hand-editing output. Entries would live in
# pipeline/corrections/bible.clementina.la.json; none is filed today, so
# this layer applies zero corrections and still proves it ran.
#
# A NOTE ON WHAT COUNTS AS A DEFECT HERE, since this is the corpus's first
# Latin text: `i` for `j` and the ae/oe ligatures are the 1914 printing's
# orthography, not typos. They are never corrections. See the module
# docstring.
# --------------------------------------------------------------------------


def apply_corrections(
    book_docs: list[dict], corrections: list[dict], full_run: bool
) -> tuple[list[dict], set[str]]:
    # Scope is tracked at (osis, chapter) granularity, not just osis:
    # --sample keeps Philemon whole but truncates Joannes to chapters 1-3, so
    # a correction targeting a chapter the sample run never touched must be
    # skipped as out-of-scope, not treated as source drift.
    present_chapters = {
        (b["osis"], chap["n"]) for b in book_docs for chap in b["chapters"]
    }
    verse_index: dict[tuple[str, int, int], dict] = {}
    for b in book_docs:
        for chap in b["chapters"]:
            for v in chap["verses"]:
                verse_index[(b["osis"], chap["n"], v["n"])] = v

    applied: list[dict] = []
    seen: set[str] = set()
    for c in corrections:
        if c.get("resolution"):
            continue  # documented non-defect / unresolved -- never applied
        loc = c["locator"]
        key = (loc["osis"], loc["chapter"], loc["verse"])
        if (loc["osis"], loc["chapter"]) not in present_chapters:
            continue  # out of scope for this run (e.g. --sample)
        verse = verse_index.get(key)
        if verse is None or c["from"] not in verse["text"]:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: expected text {c['from']!r} not found "
                f"at {loc['osis']} {loc['chapter']}:{loc['verse']} (source drift -- "
                "re-verify against corpus/raw/ and update or remove the entry)"
            )
        verse["text"] = verse["text"].replace(c["from"], c["to"], 1)
        applied.append(dict(c))
        seen.add(c["id"])

    if full_run:
        missing = [
            c["id"]
            for c in corrections
            if not c.get("resolution") and c["id"] not in seen
        ]
        if missing:
            raise CorrectionDriftError(
                f"correction entries never matched during full run: {missing}"
            )
    return applied, seen


def write_corrections_receipt(
    work_dir: Path, applied: list[dict], corrections: list[dict], generated_at: str
) -> int:
    unresolved = [c for c in corrections if c.get("resolution")]
    receipt = {
        "work_id": WORK_ID,
        "generated_at": generated_at,
        "applied": applied,
        "unresolved": unresolved,
        "count": len(applied),
    }
    work_dir.mkdir(parents=True, exist_ok=True)
    (work_dir / "corrections-applied.json").write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return len(applied)


def run_scrape(
    sample: bool, offline: bool, refresh: bool
) -> tuple[list[dict], list[str]]:
    fetcher = Fetcher(
        base_url=BASE_URL,
        raw_dir=RAW_DIR,
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
                # A chapter's first verse begins a sentence, so its first
                # letter must be capitalized. This is the same check both
                # other editions run; it is worth running on a printed
                # critical edition too, where a lost capital would be a
                # transcription slip rather than an OCR one.
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
    corrections_applied: int,
    generated_at: str,
) -> None:
    books_dir = WORK_DIR / "books"
    books_dir.mkdir(parents=True, exist_ok=True)
    for b in book_docs:
        out_path = books_dir / f"{b['osis']}.json"
        write_json(out_path, b)

    today = datetime.now(timezone.utc).date().isoformat()

    notes = (
        "Clementine Vulgate (Sixtus V / Clement VIII) as printed in the 1914 "
        "critical edition of P. Michael Hetzenauer, Ord. Min. Cap. This is the "
        "Latin base bible.cpdv.en was translated from, which makes the two a "
        "matched pair rather than two unrelated texts -- and makes this "
        "edition usable as a third witness where the English and Portuguese "
        "editions disagree about verse shape (docs/research/"
        "bible-edition-divergence.md). Orthography is preserved as printed: "
        "the text uses i for j throughout (Iesus, iudicium) and the ae/oe "
        "ligatures (cælum, cœlum); both are folded into each book's abbrevs "
        "for lookup, never in the text. Psalter follows the traditional "
        "Vulgate/Septuagint numbering (Psalms 9 and 10 merged), matching the "
        "rest of the corpus. See docs/research/vulgate-edition-choice.md for "
        "why this edition rather than the Nova Vulgata or IntraText."
    )
    if sample:
        notes = (
            "SAMPLE RUN for review only — contains Philemon (complete) and "
            "Joannes (chapters 1-3 only). Not the full 73-book corpus. " + notes
        )

    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Biblia Sacra Vulgatæ Editionis",
        "short_title": "Vulgata Clementina",
        "language": "la",
        "edition": "Clementine recension, Hetzenauer's 1914 printing",
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
    write_json(WORK_DIR / "manifest.json", manifest)


def write_json(path: Path, obj) -> None:
    path.write_text(
        json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Only scrape Philemon (complete) and Joannes (chapters 1-3) for review.",
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

    book_docs, _ = run_scrape(
        sample=args.sample, offline=args.offline, refresh=args.refresh
    )

    print_summary(book_docs)

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
        applied, _seen = apply_corrections(
            book_docs, corrections, full_run=not args.sample
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    corrections_count = write_corrections_receipt(
        WORK_DIR, applied, corrections, generated_at
    )
    print(
        f"\nCorrections layer: {corrections_count} applied, "
        f"{len([c for c in corrections if c.get('resolution')])} documented unresolved/"
        "not-a-defect (see corrections-applied.json)"
    )

    write_output(
        book_docs,
        sample=args.sample,
        corrections_applied=corrections_count,
        generated_at=generated_at,
    )
    print(f"\nWrote {len(book_docs)} book file(s) to {WORK_DIR}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
