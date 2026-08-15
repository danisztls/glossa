#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""CCC -> Bible citation parser. Phase-2 flagship cross-linking data.

Reads ``corpus/works/ccc.en/paragraphs.json`` (each paragraph's ``citations``
are verbatim footnote strings, e.g. "Acts 2:38.", "Cf. Acts 2:41; 8:12-13;
10:48; 16:15.", "Jn 3:16; cf. 1 Jn 4:9.", "LG 12.", "Cf. Council of Trent:
DS 1514.") and writes ``corpus/xrefs/ccc-bible.json`` per corpus-schema.md
sec.Cross-references: ``[{"ccc": n, "refs": [{"osis", "chapter", "verses",
"cf"?}]}]``.

Usage:
    uv run pipeline/build/xrefs.py              # build + write the xrefs file
    uv run pipeline/build/xrefs.py --report      # also print the QA report
    uv run pipeline/build/xrefs.py --report --no-write   # report only, no I/O
    uv run --with pytest -m pytest pipeline/build/xrefs.py   # unit tests

Grammar this parser understands, derived empirically from the sample corpus
(see the module-level report this script prints; re-run --report once the
full 2865-paragraph crawl lands and fold new patterns back in here):

  - A citation string is a ``;``-separated list of clauses. Each clause is
    independently either a *scripture* reference, a *non-scripture* document
    reference (councils, Fathers, liturgy, canon law, magisterium -- LG, AG,
    SC, GS, UR, CT, DS, CIC, CCEO, RCIA, RBC, CDF, PL, PG, SCh, AAS, and named
    persons/documents spelled out in prose), or a *continuation* of the
    previous clause's book ("Acts 2:41; 8:12-13" -- the second clause has no
    book name and inherits "Acts" from the first).
  - "Cf."/"cf." at the start of a clause marks the refs in *that* clause (and
    any bookless continuation clauses following it) as ``cf: true``. A clause
    that introduces its own book resets the cf state to whatever its own
    prefix says (present -> True, absent -> False); a continuation clause
    that repeats "cf." explicitly overrides the inherited state for itself.
    This is a judgment call: the source citations were never designed for
    machine parsing and "Cf." scope is genuinely ambiguous in a few cases
    (see the docstring of ``_split_clauses`` usage in ``parse_citation``).
  - Chapter:verse separators accepted: ``:`` (colon, the normal case), a
    bare space ("Mk 10 14" -- a real, repeated pattern in the source: the
    colon is dropped), or ``.`` (dotted style, "Jn 3.16"). Additional verses
    within the same chapter are separated by ``,`` or ``.`` ("16:15, 33",
    "3:16.21"). Ranges use ``-`` and are *expanded* into individual ints
    ("8:12-13" -> verses [12, 13]). A trailing single letter on a verse
    number ("Mt 5:3a") is a verse subdivision -- stripped, kept as int 3.
  - A book name with no verse component at all ("Ps 22") is a whole-chapter
    reference. Design choice (the brief left this open): whole-chapter refs
    are emitted with ``"verses": []`` -- the key is always present, an empty
    list is the "whole chapter" signal. Document this choice in
    corpus-schema.md when folding this parser's output back in.
  - Roman-numeral book-number prefixes ("I Cor", "I Pt") are recognized as
    aliases of the Arabic form -- observed in the sample, presumably a
    typesetting/OCR artifact of the vatican.va mirror rather than a real CCC
    convention.
  - A bare bookless clause with *no* chapter:verse structure of its own
    (just digits, e.g. a stray canon or section number) is never treated as
    a scripture continuation, even if a book is in scope -- none of the
    scripture continuations in the sample are bare verse numbers, they all
    restate "chapter:verse" or "chapter verse", so this is deliberately
    conservative. If the full corpus turns up a genuine bare-verse
    continuation ("Rom 8:14, 17" style split across clauses as "8:14" then
    just "17"), this will under-link it -- flagged here as a known gap
    rather than guessed at.
  - Known scraper artifact: at least one citation ("CE 1 Cor 6:11; 12:13.")
    has a stray "CE" token where every other instance in the corpus has
    "Cf.". The book-search is a substring search (not anchored to clause
    start) specifically so junk prefixes like this don't block matching the
    real book+chapter:verse that follows; the junk itself is silently
    dropped rather than guessed to mean "Cf." (i.e. this ref gets cf=False).
"""

from __future__ import annotations

import argparse
import json
import random
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
INPUT_PATH = REPO_ROOT / "corpus/works/ccc.en/paragraphs.json"
OUTPUT_PATH = REPO_ROOT / "corpus/xrefs/ccc-bible.json"

# --------------------------------------------------------------------------
# Canonical 73-book OSIS order (corpus-schema.md sec.Canonical book order).
# --------------------------------------------------------------------------

OT_ORDER = [
    "gen",
    "exod",
    "lev",
    "num",
    "deut",
    "josh",
    "judg",
    "ruth",
    "1sam",
    "2sam",
    "1kgs",
    "2kgs",
    "1chr",
    "2chr",
    "ezra",
    "neh",
    "tob",
    "jdt",
    "esth",
    "1macc",
    "2macc",
    "job",
    "ps",
    "prov",
    "eccl",
    "song",
    "wis",
    "sir",
    "isa",
    "jer",
    "lam",
    "bar",
    "ezek",
    "dan",
    "hos",
    "joel",
    "amos",
    "obad",
    "jonah",
    "mic",
    "nah",
    "hab",
    "zeph",
    "hag",
    "zech",
    "mal",
]
NT_ORDER = [
    "matt",
    "mark",
    "luke",
    "john",
    "acts",
    "rom",
    "1cor",
    "2cor",
    "gal",
    "eph",
    "phil",
    "col",
    "1thess",
    "2thess",
    "1tim",
    "2tim",
    "titus",
    "phlm",
    "heb",
    "jas",
    "1pet",
    "2pet",
    "1john",
    "2john",
    "3john",
    "jude",
    "rev",
]
CANONICAL_73 = OT_ORDER + NT_ORDER
assert len(CANONICAL_73) == 73
CANONICAL_73_SET = frozenset(CANONICAL_73)

# --------------------------------------------------------------------------
# Scripture abbreviation inventory. Keys are the exact (case-sensitive)
# strings as they appear in CCC footnotes; matching requires a leading
# capital letter (or a leading digit/roman-numeral for numbered books) so it
# never collides with ordinary lowercase English words ("is", "am", ...).
# Built from the brief's suggested inventory plus what the sample corpus
# actually contains (which sometimes differs -- e.g. the corpus spells out
# "Titus" and "Gen" in full rather than using "Ti"/"Gn"; both forms are kept
# so either convention parses).
# --------------------------------------------------------------------------


# osis -> list of exact surface forms recognized as that book.
BOOK_VARIANTS: dict[str, list[str]] = {
    "gen": ["Gn", "Gen", "Genesis"],
    "exod": ["Ex", "Exod", "Exodus"],
    "lev": ["Lv", "Lev", "Leviticus"],
    "num": ["Nm", "Num", "Numbers"],
    "deut": ["Dt", "Deut", "Deuteronomy"],
    "josh": ["Jos", "Josh", "Joshua"],
    "judg": ["Jdg", "Jgs", "Judg", "Judges"],
    "ruth": ["Ru", "Ruth"],
    "ezra": ["Ezr", "Ezra"],
    "neh": ["Neh", "Nehemiah"],
    "tob": ["Tb", "Tob", "Tobit"],
    "jdt": ["Jdt", "Judith"],
    "esth": ["Est", "Esth", "Esther"],
    "job": ["Job"],
    "ps": ["Ps", "Pss", "Psalm", "Psalms"],
    "prov": ["Prv", "Prov", "Proverbs"],
    "eccl": ["Eccl", "Qo", "Qoh", "Ecclesiastes"],
    "song": ["Song", "SS", "Ct", "Song of Songs", "Song of Solomon"],
    "wis": ["Wis", "Wisdom"],
    "sir": ["Sir", "Ecclus", "Sirach"],
    "isa": ["Is", "Isa", "Isaiah"],
    "jer": ["Jer", "Jeremiah"],
    "lam": ["Lam", "Lamentations"],
    "bar": ["Bar", "Baruch"],
    "ezek": ["Ez", "Ezek", "Ezekiel"],
    "dan": ["Dn", "Dan", "Daniel"],
    "hos": ["Hos", "Hosea"],
    "joel": ["Jl", "Joel"],
    "amos": ["Am", "Amos"],
    "obad": ["Ob", "Obad", "Obadiah"],
    "jonah": ["Jon", "Jonah"],
    "mic": ["Mi", "Mic", "Micah"],
    "nah": ["Na", "Nah", "Nahum"],
    "hab": ["Hab", "Habakkuk"],
    "zeph": ["Zep", "Zeph", "Zephaniah"],
    "hag": ["Hag", "Haggai"],
    "zech": ["Zec", "Zech", "Zechariah"],
    "mal": ["Mal", "Malachi"],
    "matt": ["Mt", "Matt", "Matthew"],
    "mark": ["Mk", "Mark"],
    "luke": ["Lk", "Luke"],
    "john": ["Jn", "John"],
    "acts": ["Acts"],
    "rom": ["Rom", "Romans"],
    "gal": ["Gal", "Galatians"],
    "eph": ["Eph", "Ephesians"],
    "phil": ["Phil", "Philippians"],
    "col": ["Col", "Colossians"],
    "titus": ["Ti", "Titus"],
    "phlm": ["Philem", "Phlm", "Philemon"],
    "heb": ["Heb", "Hebrews"],
    "jas": ["Jas", "James"],
    "jude": ["Jude"],
    "rev": ["Rev", "Rv", "Revelation", "Apoc"],
}
_NUMBERED_BASE: dict[str, list[str]] = {
    "1sam": ["Sam", "Samuel"],
    "2sam": ["Sam", "Samuel"],
    "1kgs": ["Kings", "Kgs"],
    "2kgs": ["Kings", "Kgs"],
    "1chr": ["Chr", "Chronicles"],
    "2chr": ["Chr", "Chronicles"],
    "1macc": ["Macc", "Maccabees"],
    "2macc": ["Macc", "Maccabees"],
    "1cor": ["Cor", "Corinthians"],
    "2cor": ["Cor", "Corinthians"],
    "1thess": ["Thess", "Thessalonians"],
    "2thess": ["Thess", "Thessalonians"],
    "1tim": ["Tim", "Timothy"],
    "2tim": ["Tim", "Timothy"],
    "1pet": ["Pet", "Pt", "Peter"],
    "2pet": ["Pet", "Pt", "Peter"],
    "1john": ["Jn", "John"],
    "2john": ["Jn", "John"],
    "3john": ["Jn", "John"],
}
for osis, base in _NUMBERED_BASE.items():
    n = int(osis[0])
    roman = {1: "I", 2: "II", 3: "III"}[n]
    BOOK_VARIANTS[osis] = [f"{n} {v}" for v in base] + [f"{roman} {v}" for v in base]

assert set(BOOK_VARIANTS) <= CANONICAL_73_SET, sorted(
    set(BOOK_VARIANTS) - CANONICAL_73_SET
)

# variant surface form -> osis. Longer forms win automatically at matching
# time via the trailing \b anchor (see _BOOK_RE), so insertion order here
# doesn't matter for correctness.
VARIANT_TO_OSIS: dict[str, str] = {}
for _osis, _variants in BOOK_VARIANTS.items():
    for _v in _variants:
        # A variant string must be unique across books to be unambiguous.
        # (Ps/Prov etc never collide in this inventory; assert to catch it
        # early if the full-corpus inventory later introduces one.)
        assert _v not in VARIANT_TO_OSIS, f"ambiguous abbreviation {_v!r}"
        VARIANT_TO_OSIS[_v] = _osis

_BOOK_RE = re.compile(
    r"\b(?:"
    + "|".join(re.escape(v) for v in sorted(VARIANT_TO_OSIS, key=len, reverse=True))
    + r")\b"
)

# Known non-scripture document abbreviations -- used only to keep the
# "unmapped abbreviation" heuristic in the report from firing on things we
# already know aren't scripture (Vatican II documents, canon law, patrology
# series). Not exhaustive; the report also lists non-scripture citations in
# their own bucket regardless of whether they hit this set.
NON_SCRIPTURE_ABBREVS = frozenset(
    [
        "LG",
        "AG",
        "SC",
        "GS",
        "UR",
        "CT",
        "DS",
        "CIC",
        "CCEO",
        "RCIA",
        "RBC",
        "CDF",
        "PL",
        "PG",
        "SCh",
        "AAS",
        "DV",
        "NA",
        "OT",
        "PO",
        "CD",
        "SD",
        "EP",
    ]
)


# --------------------------------------------------------------------------
# Data model
# --------------------------------------------------------------------------


@dataclass
class Ref:
    osis: str
    chapter: int
    verses: list[int]
    cf: bool = False

    def to_json(self) -> dict:
        d: dict = {"osis": self.osis, "chapter": self.chapter, "verses": self.verses}
        if self.cf:
            d["cf"] = True
        return d


@dataclass
class CitationResult:
    text: str
    refs: list[Ref] = field(default_factory=list)
    classification: str = (
        "non-scripture"  # "scripture" | "non-scripture" | "unparseable"
    )
    unmapped: list[str] = field(default_factory=list)


# --------------------------------------------------------------------------
# Parsing
# --------------------------------------------------------------------------

_CF_RE = re.compile(r"^cf\.?\s*", re.IGNORECASE)
_CHAPTER_RE = re.compile(r"^(\d+)")
_VERSE_RE = re.compile(r"^(\d+)([a-zA-Z]?)")
_UNMAPPED_RE = re.compile(r"\b([A-Z][A-Za-z]{0,9})\.?\s+(\d+)\s*:\s*\d+")


def _strip_cf(clause: str) -> tuple[str, bool]:
    m = _CF_RE.match(clause)
    if m:
        return clause[m.end() :].strip(), True
    return clause, False


def _parse_verse_list(s: str) -> tuple[list[int], int]:
    """Parse a verse list starting at position 0 of ``s`` (no leading separator).

    Handles ranges ("12-13"), comma/dot-separated additional verses
    ("15, 33", "16.21"), and verse-subdivision letters ("3a" -> 3).
    Returns (sorted deduplicated verses, chars consumed).
    """
    verses: list[int] = []
    pos = 0
    while True:
        m = _VERSE_RE.match(s[pos:])
        if not m:
            break
        start = int(m.group(1))
        pos += m.end()
        if pos < len(s) and s[pos] == "-":
            m2 = _VERSE_RE.match(s[pos + 1 :])
            if m2:
                end = int(m2.group(1))
                pos += 1 + m2.end()
                verses.extend(range(start, end + 1))
            else:
                verses.append(start)
        else:
            verses.append(start)
        if pos < len(s) and s[pos] in ",.":
            look = s[pos + 1 :]
            stripped = look.lstrip(" ")
            if stripped[:1].isdigit():
                pos += 1 + (len(look) - len(stripped))
                continue
        break
    return sorted(set(verses)), pos


def _parse_chapter_verses(s: str) -> tuple[int | None, list[int]]:
    """Parse "chapter[:. ]verselist" or a bare "chapter" (whole-chapter) from
    the start of ``s``. Returns (chapter, verses) -- verses is [] for a
    whole-chapter ref or when ``s`` doesn't start with a chapter number.
    """
    m = _CHAPTER_RE.match(s)
    if not m:
        return None, []
    chapter = int(m.group(1))
    rest = s[m.end() :]
    if rest[:1] == ":":
        verses, _ = _parse_verse_list(rest[1:])
        return chapter, verses
    if rest[:1] in (".", " ") and rest[1:2].isdigit():
        # dotted ("3.16") or space-separated ("10 14") chapter/verse split
        verses, _ = _parse_verse_list(rest[1:])
        return chapter, verses
    return chapter, []


def _find_book(clause: str) -> tuple[str, str] | None:
    """Search (not anchor) ``clause`` for a recognized scripture book name.

    Returns (osis, remainder-after-match-lstripped) or None. Search (rather
    than match-at-start) so junk prefixes like a stray "CE" (see module
    docstring) or "Cf." leftovers don't block a real match later in the
    clause.
    """
    m = _BOOK_RE.search(clause)
    if not m:
        return None
    return VARIANT_TO_OSIS[m.group(0)], clause[m.end() :].lstrip()


def _split_clauses(text: str) -> list[str]:
    return [c.strip() for c in text.split(";")]


def parse_citation(text: str) -> CitationResult:
    """Parse one raw CCC footnote string into scripture refs.

    See the module docstring for the full grammar and the judgment calls
    behind "Cf." scoping and whole-chapter representation.
    """
    text = text.strip()
    if not text:
        return CitationResult(text=text, classification="unparseable")

    result = CitationResult(text=text)
    current_book: str | None = None
    current_cf = False
    saw_any_clause = False

    try:
        for raw_clause in _split_clauses(text):
            clause = raw_clause.strip().rstrip(".").strip()
            if not clause:
                continue
            saw_any_clause = True
            clause, clause_cf = _strip_cf(clause)
            clause = clause.strip()
            if not clause:
                continue

            book_match = _find_book(clause)
            if book_match is not None:
                osis, rest = book_match
                chapter, verses = _parse_chapter_verses(rest)
                if chapter is not None:
                    result.refs.append(Ref(osis, chapter, verses, clause_cf))
                    current_book = osis
                    current_cf = clause_cf
                    continue
                # Book name present but no chapter number followed it --
                # not a real scripture ref (e.g. a book-like word inside
                # prose). Falls through to the unmapped/non-scripture check
                # below.

            elif current_book is not None and clause[:1].isdigit():
                chapter, verses = _parse_chapter_verses(clause)
                # Require an actual verse component: a bare number is too
                # ambiguous to attach to the running book (see docstring).
                if chapter is not None and verses:
                    # A continuation clause inherits the establishing
                    # clause's cf state unless it repeats "cf." itself.
                    ref_cf = clause_cf or current_cf
                    result.refs.append(Ref(current_book, chapter, verses, ref_cf))
                    continue

            for um in _UNMAPPED_RE.finditer(clause):
                token = um.group(1)
                if token not in NON_SCRIPTURE_ABBREVS and token not in VARIANT_TO_OSIS:
                    result.unmapped.append(token)
    except Exception as exc:  # noqa: BLE001 - defensive: never let one bad citation kill the build
        result.classification = "unparseable"
        result.unmapped.append(f"<exception: {exc}>")
        return result

    if result.refs:
        result.classification = "scripture"
    elif saw_any_clause:
        result.classification = "non-scripture"
    else:
        result.classification = "unparseable"
    return result


# --------------------------------------------------------------------------
# Build
# --------------------------------------------------------------------------


def build(paragraphs: list[dict]) -> tuple[list[dict], list[CitationResult]]:
    """Parse every paragraph's citations. Returns (xrefs, all citation results)."""
    xrefs: list[dict] = []
    all_results: list[CitationResult] = []
    for p in sorted(paragraphs, key=lambda p: p["n"]):
        n = p["n"]
        assert 1 <= n <= 2865, f"ccc paragraph number out of range: {n}"
        refs: list[Ref] = []
        for citation in p.get("citations", []):
            r = parse_citation(citation["text"])
            all_results.append(r)
            refs.extend(r.refs)
        if refs:
            for ref in refs:
                assert ref.osis in CANONICAL_73_SET, (
                    f"non-canonical osis {ref.osis!r} in ccc {n}"
                )
                assert ref.verses == sorted(ref.verses), f"unsorted verses in ccc {n}"
            xrefs.append({"ccc": n, "refs": [r.to_json() for r in refs]})
    return xrefs, all_results


def write_xrefs(xrefs: list[dict], path: Path = OUTPUT_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(xrefs, indent=2, ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8")


# --------------------------------------------------------------------------
# Report
# --------------------------------------------------------------------------


def print_report(results: list[CitationResult], seed: int = 42) -> None:
    total = len(results)
    by_class: dict[str, int] = {"scripture": 0, "non-scripture": 0, "unparseable": 0}
    for r in results:
        by_class[r.classification] += 1

    print("=" * 72)
    print("CCC -> Bible citation parser report")
    print("=" * 72)
    print(f"total citation strings: {total}")
    for cls in ("scripture", "non-scripture", "unparseable"):
        n = by_class[cls]
        pct = 100 * n / total if total else 0
        print(f"  {cls:14s} {n:5d}  ({pct:5.1f}%)")

    print()
    unparseable = [r.text for r in results if r.classification == "unparseable"]
    print(
        f"unparseable strings ({len(unparseable)}) -- parser TODOs, not discarded data:"
    )
    for t in unparseable:
        print(f"  - {t!r}")

    print()
    unmapped_counter: dict[str, int] = {}
    for r in results:
        for tok in r.unmapped:
            unmapped_counter[tok] = unmapped_counter.get(tok, 0) + 1
    top_unmapped = sorted(unmapped_counter.items(), key=lambda kv: -kv[1])[:20]
    print(f"top unmapped abbreviations ({len(unmapped_counter)} distinct):")
    for tok, n in top_unmapped:
        print(f"  {n:4d}  {tok}")

    print()
    scripture_results = [r for r in results if r.classification == "scripture"]
    sample_n = min(10, len(scripture_results))
    rng = random.Random(seed)
    spot = rng.sample(scripture_results, sample_n) if scripture_results else []
    print(f"spot check ({sample_n} random scripture citations, seed={seed}):")
    for r in spot:
        refs_repr = ", ".join(
            f"{ref.osis} {ref.chapter}:{ref.verses or '(whole)'}{'  [cf]' if ref.cf else ''}"
            for ref in r.refs
        )
        print(f"  {r.text!r}")
        print(f"    -> {refs_repr}")
    print("=" * 72)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--report", action="store_true", help="print the QA report")
    ap.add_argument(
        "--no-write", action="store_true", help="skip writing the output file"
    )
    ap.add_argument("--in", dest="in_path", type=Path, default=INPUT_PATH)
    ap.add_argument("--out", dest="out_path", type=Path, default=OUTPUT_PATH)
    ap.add_argument("--seed", type=int, default=42, help="spot-check sample seed")
    args = ap.parse_args(argv)

    paragraphs = json.loads(args.in_path.read_text(encoding="utf-8"))
    xrefs, results = build(paragraphs)

    if not args.no_write:
        write_xrefs(xrefs, args.out_path)
        print(
            f"wrote {len(xrefs)} paragraphs with scripture refs -> {args.out_path}",
            file=sys.stderr,
        )

    if args.report:
        print_report(results, seed=args.seed)

    return 0


# --------------------------------------------------------------------------
# Tests (pytest): uv run --with pytest -m pytest pipeline/build/xrefs.py
# --------------------------------------------------------------------------


def test_cf_prefix_and_multi_ref() -> None:
    r = parse_citation("Cf. Acts 2:41; 8:12-13; 10:48; 16:15.")
    assert r.classification == "scripture"
    assert [(ref.osis, ref.chapter, ref.verses) for ref in r.refs] == [
        ("acts", 2, [41]),
        ("acts", 8, [12, 13]),
        ("acts", 10, [48]),
        ("acts", 16, [15]),
    ]
    assert all(ref.cf for ref in r.refs)


def test_simple_ref_no_cf() -> None:
    r = parse_citation("Jn 3:16")
    assert r.classification == "scripture"
    assert len(r.refs) == 1
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses, ref.cf) == ("john", 3, [16], False)


def test_mixed_cf_only_second_ref() -> None:
    r = parse_citation("Jn 3:16; cf. 1 Jn 4:9.")
    assert [(ref.osis, ref.chapter, ref.verses, ref.cf) for ref in r.refs] == [
        ("john", 3, [16], False),
        ("1john", 4, [9], True),
    ]


def test_psalm_ref() -> None:
    r = parse_citation("Cf. Ps 22:1-2.")
    assert len(r.refs) == 1
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses, ref.cf) == ("ps", 22, [1, 2], True)


def test_whole_chapter_ref() -> None:
    r = parse_citation("Ps 22.")
    assert len(r.refs) == 1
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses) == ("ps", 22, [])


def test_mixed_scripture_and_ds() -> None:
    # Real sample citation: council/Denzinger reference plus a scripture ref.
    r = parse_citation("Cf. Council of Trent (1546): DS 1514; cf. Col 1:12-14.")
    assert r.classification == "scripture"
    assert len(r.refs) == 1
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses, ref.cf) == ("col", 1, [12, 13, 14], True)


def test_verse_letter_subdivision() -> None:
    r = parse_citation("Mt 5:3a.")
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses) == ("matt", 5, [3])


def test_dot_separated_verses() -> None:
    r = parse_citation("Jn 3:16.21.")
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses) == ("john", 3, [16, 21])


def test_space_separated_chapter_verse() -> None:
    # Real sample citation: "Mk 10 14." -- colon dropped.
    r = parse_citation("Mk 10 14.")
    assert len(r.refs) == 1
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses) == ("mark", 10, [14])


def test_roman_numeral_book_number() -> None:
    r = parse_citation("cf. I Cor 9:22; I Pt 2:2")
    assert [(ref.osis, ref.chapter, ref.verses) for ref in r.refs] == [
        ("1cor", 9, [22]),
        ("1pet", 2, [2]),
    ]


def test_non_scripture_only() -> None:
    r = parse_citation("LG 12.")
    assert r.classification == "non-scripture"
    assert r.refs == []


def test_empty_citation_is_unparseable() -> None:
    r = parse_citation("")
    assert r.classification == "unparseable"


def test_all_book_variants_map_to_canonical_osis() -> None:
    assert set(VARIANT_TO_OSIS.values()) <= CANONICAL_73_SET


def test_ref_to_json_omits_cf_when_false() -> None:
    ref = Ref("john", 3, [16], cf=False)
    assert "cf" not in ref.to_json()
    ref2 = Ref("john", 3, [16], cf=True)
    assert ref2.to_json()["cf"] is True


def test_deterministic_build(tmp_path=None) -> None:
    paragraphs = [
        {"n": 5, "citations": [{"marker": "1", "text": "Jn 3:16."}]},
        {"n": 3, "citations": [{"marker": "1", "text": "Mt 5:3a."}]},
    ]
    xrefs1, _ = build(paragraphs)
    xrefs2, _ = build(paragraphs)
    assert xrefs1 == xrefs2
    assert [x["ccc"] for x in xrefs1] == [3, 5]  # ascending by ccc n


if __name__ == "__main__":
    raise SystemExit(main())
