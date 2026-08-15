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
  - Other confirmed transcription typos, folded into the book-variant table
    after checking the raw citation string against the paragraph's actual
    prose (full 2865-paragraph corpus): "PS"/"EX" (all-caps Ps/Exod), "In"
    for "Jn"/"1 Jn" (J -> I), "Cal" for "Gal" (G -> C, confirmed against
    ccc476/478's Christology), "l" for the digit "1" before a book name
    ("l Cor", "l Pt", "l Tim").
  - Three citations have a missing/garbled book-number that a human can
    resolve from context but the parser deliberately does NOT guess (per
    link-surface.md's "never store interpretations" principle) -- flagged
    here for whoever next touches ccc.en's raw citations, not silently
    fixed: ccc104 footnote 67 ("Th 2:13") is almost certainly 1 Thess 2:13
    (the paragraph directly quotes it); ccc333 footnote 198 ("Macc
    10:29-30; 11:8") is almost certainly 2 Macc (the angel-warrior verses;
    1 Macc has no such narrative); ccc674 footnote 568 ("Rom I 1:20-26") is
    likely Rom 11:20-26 with the chapter number corrupted into "I" + "1"
    (paragraph discusses Israel's partial hardening/grafting-in, Rom 11's
    theme, not Rom 1). None of these are auto-linked.
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

# Chapter counts, standard versification -- used only to sanity-check parsed
# chapter numbers against a dropped-colon typo class found in the full
# corpus (e.g. "Eph 314" for "Eph 3:14", "Acts 913" for "Acts 9:13": the
# colon vanished and the two numbers ran together into one implausible
# "chapter"). A chapter above the book's real count is dropped rather than
# guessed at -- see MAX_CHAPTER usage in parse_citation and the "dropped
# implausible refs" report bucket.
MAX_CHAPTER: dict[str, int] = {
    "gen": 50, "exod": 40, "lev": 27, "num": 36, "deut": 34, "josh": 24, "judg": 21,
    "ruth": 4, "1sam": 31, "2sam": 24, "1kgs": 22, "2kgs": 25, "1chr": 29, "2chr": 36,
    "ezra": 10, "neh": 13, "tob": 14, "jdt": 16, "esth": 16, "1macc": 16, "2macc": 15,
    "job": 42, "ps": 150, "prov": 31, "eccl": 12, "song": 8, "wis": 19, "sir": 51,
    "isa": 66, "jer": 52, "lam": 5, "bar": 6, "ezek": 48, "dan": 14, "hos": 14,
    "joel": 3, "amos": 9, "obad": 1, "jonah": 4, "mic": 7, "nah": 3, "hab": 3,
    "zeph": 3, "hag": 2, "zech": 14, "mal": 4,
    "matt": 28, "mark": 16, "luke": 24, "john": 21, "acts": 28, "rom": 16,
    "1cor": 16, "2cor": 13, "gal": 6, "eph": 6, "phil": 4, "col": 4, "1thess": 5,
    "2thess": 3, "1tim": 6, "2tim": 4, "titus": 3, "phlm": 1, "heb": 13, "jas": 5,
    "1pet": 5, "2pet": 3, "1john": 5, "2john": 1, "3john": 1, "jude": 1, "rev": 22,
}  # fmt: skip
assert set(MAX_CHAPTER) == CANONICAL_73_SET

# The Bible's five one-chapter books. In practice the CCC (like most
# citation styles) cites these as "Jude 3", never "Jude 1:3" -- no chapter
# number at all, since there's only one. That means the bare number is a
# *verse*, not a chapter, even though it's shaped exactly like every other
# book's "whole chapter" reference. See _parse_single_chapter_ref.
SINGLE_CHAPTER_BOOKS = frozenset(osis for osis, mx in MAX_CHAPTER.items() if mx == 1)

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
    "exod": ["Ex", "Exod", "Exodus", "EX"],  # EX: observed all-caps variant
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
    "ps": ["Ps", "Pss", "Psalm", "Psalms", "PS"],  # PS: observed all-caps variant
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
    "john": [
        "Jn",
        "John",
        "In",
    ],  # In: observed typo (J -> I), only fires with a chapter:verse after it
    "acts": ["Acts"],
    "rom": ["Rom", "Romans"],
    "gal": [
        "Gal",
        "Galatians",
        "Cal",
    ],  # Cal: observed typo (G -> C), verified by content against ccc476/478
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
    "1thess": [
        "Thess",
        "Thessalonians",
        "Th",
    ],  # Th: observed abbreviation, verified numbered-only
    "2thess": ["Thess", "Thessalonians", "Th"],
    "1tim": ["Tim", "Timothy"],
    "2tim": ["Tim", "Timothy"],
    "1pet": ["Pet", "Pt", "Peter"],
    "2pet": ["Pet", "Pt", "Peter"],
    "1john": ["Jn", "John", "In"],  # In: same J -> I typo as the bare Gospel form
    "2john": ["Jn", "John", "In"],
    "3john": ["Jn", "John", "In"],
}
for osis, base in _NUMBERED_BASE.items():
    n = int(osis[0])
    roman = {1: "I", 2: "II", 3: "III"}[n]
    variants = [f"{n} {v}" for v in base] + [f"{roman} {v}" for v in base]
    if n == 1:
        # "l" (lowercase L) for "1" is a recurring transcription artifact in
        # this corpus (observed: "l Cor", "l Pt", "l Tim") -- visually
        # confusable with "1" in some renderings. Only added for n=1, since
        # that's the only digit "l" is ever mistaken for.
        variants += [f"l {v}" for v in base]
    BOOK_VARIANTS[osis] = variants

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
        # Titles/section-numbering tokens from patristic and other spiritual
        # writers, confirmed non-scripture by inspecting the full citation
        # (see pipeline/build/xrefs.py report triage, full-corpus pass):
        "Sermo",  # "St. Augustine, Sermo 241, 2" etc. -- a homily number
        "Psal",  # "St. Ambrose, Psal 118:14:30" -- Ambrose's own commentary
        # ON Psalm 118 (a work citation, not a Bible verse)
        "Smyrn",  # "St. Ignatius of Antioch, Ad Smyrn. 8:1" -- Ignatius's
        # Letter to the Smyrnaeans
        "Jud",  # "St. John Chrysostom, prod. Jud. 1:6" -- "De proditione
        # Judae" (On the Betrayal of Judas), a homily title -- not Jude/Judith
        "Excl",  # "St. Teresa of Avila, Excl. 15:3" -- her "Exclamaciones"
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
        "non-scripture"  # "scripture" | "non-scripture" | "unparseable" | "empty"
    )
    unmapped: list[str] = field(default_factory=list)
    dropped: list[str] = field(
        default_factory=list
    )  # implausible chapter numbers, see MAX_CHAPTER


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


def _parse_single_chapter_ref(rest: str) -> tuple[int | None, list[int]]:
    """Parse a reference into one of the Bible's five single-chapter books
    (SINGLE_CHAPTER_BOOKS). These are cited "Book <verse>" with no chapter
    number ("Jude 3", "Phlm 16") -- so unlike every other book, a bare
    leading number is a *verse*, not a chapter. Tolerates a redundant
    explicit "1:" prefix if the source gives one. Always returns chapter 1
    (or None if ``rest`` has no leading number at all).
    """
    if not rest[:1].isdigit():
        return None, []
    s = rest[2:] if rest[:2] == "1:" else rest
    verses, _ = _parse_verse_list(s)
    return (1, verses) if verses else (None, [])


def _find_book(clause: str, start: int = 0) -> tuple[str, str, int, int] | None:
    """Search (not anchor) ``clause`` for a recognized scripture book name.

    Returns (osis, remainder-after-match-lstripped, match-start-index,
    match-end-index) or None. Search (rather than match-at-start) so junk
    prefixes like a stray "CE" (see module docstring) or "Cf." leftovers
    don't block a real match later in the clause. ``start`` lets the caller
    retry past a match that turned out not to be followed by a chapter
    number.
    """
    m = _BOOK_RE.search(clause, start)
    if not m:
        return None
    return VARIANT_TO_OSIS[m.group(0)], clause[m.end() :].lstrip(), m.start(), m.end()


_LOCAL_CF_RE = re.compile(r"\bcf\.?\s*$", re.IGNORECASE)


def _preceded_by_cf(clause: str, match_start: int) -> bool:
    """True if a "cf."/"Cf." token sits directly before ``match_start``.

    Covers "cf." appearing *inside* a clause rather than at its very start
    -- e.g. a clause that opens with a non-scripture citation and only
    turns to "cf. <scripture ref>" partway through ("St. Ignatius..., Ad
    Eph. 19, 1: AF 11/2 76-80: cf. I Cor 2:8." -- the leading-clause cf
    strip only catches a "Cf." at position 0, so this is the fallback that
    finds it later in the same clause).
    """
    return bool(_LOCAL_CF_RE.search(clause[:match_start]))


def _split_clauses(text: str) -> list[str]:
    return [c.strip() for c in text.split(";")]


def parse_citation(text: str) -> CitationResult:
    """Parse one raw CCC footnote string into scripture refs.

    See the module docstring for the full grammar and the judgment calls
    behind "Cf." scoping and whole-chapter representation.
    """
    text = text.strip()
    if not text:
        # Known source defect: a handful of PT-mirror-derived footnotes
        # carry an empty citations[].text. Not a parser failure -- kept in
        # its own bucket so the report doesn't conflate "we couldn't read
        # this" with "the source gave us nothing to read".
        return CitationResult(text=text, classification="empty")

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

            # Try every book-shaped substring in the clause in turn, not
            # just the first: a clause can contain an unrelated book-like
            # word with no chapter after it before the real reference (e.g.
            # "St. Ignatius..., Ad Eph. 19, 1: AF 11/2 76-80: cf. I Cor 2:8."
            # -- "Eph." from "Ad Eph." matches first but has no chapter
            # number after it; the real ref, "I Cor 2:8", is later in the
            # same clause). Without this retry the whole clause would be
            # abandoned after the first false match.
            book_found_ref = False
            search_pos = 0
            while True:
                book_match = _find_book(clause, search_pos)
                if book_match is None:
                    break
                osis, rest, match_start, end_pos = book_match
                if osis in SINGLE_CHAPTER_BOOKS:
                    chapter, verses = _parse_single_chapter_ref(rest)
                else:
                    chapter, verses = _parse_chapter_verses(rest)
                if chapter is not None and chapter > MAX_CHAPTER[osis]:
                    # Almost always a dropped-colon typo running chapter and
                    # verse together ("Eph 314" for "Eph 3:14", "Acts 913"
                    # for "Acts 9:13") -- the digit split is ambiguous, so
                    # this ref is dropped rather than guessed at. Reported,
                    # not silently discarded.
                    result.dropped.append(f"{osis} {chapter} (from clause {clause!r})")
                    search_pos = end_pos
                    continue
                if chapter is not None:
                    ref_cf = clause_cf or _preceded_by_cf(clause, match_start)
                    result.refs.append(Ref(osis, chapter, verses, ref_cf))
                    current_book = osis
                    current_cf = ref_cf
                    book_found_ref = True
                    break
                search_pos = end_pos

            if book_found_ref:
                continue

            if current_book is not None and clause[:1].isdigit():
                chapter, verses = _parse_chapter_verses(clause)
                # Require an actual verse component: a bare number is too
                # ambiguous to attach to the running book (see docstring).
                if chapter is not None and verses:
                    if chapter > MAX_CHAPTER[current_book]:
                        result.dropped.append(
                            f"{current_book} {chapter} (from clause {clause!r})"
                        )
                    else:
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
                assert 1 <= ref.chapter <= MAX_CHAPTER[ref.osis], (
                    f"implausible chapter {ref.osis} {ref.chapter} in ccc {n}"
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
    by_class: dict[str, int] = {
        "scripture": 0,
        "non-scripture": 0,
        "unparseable": 0,
        "empty": 0,
    }
    for r in results:
        by_class[r.classification] += 1

    print("=" * 72)
    print("CCC -> Bible citation parser report")
    print("=" * 72)
    print(f"total citation strings: {total}")
    for cls in ("scripture", "non-scripture", "unparseable", "empty"):
        n = by_class[cls]
        pct = 100 * n / total if total else 0
        label = cls if cls != "empty" else "empty (known source defect)"
        print(f"  {label:28s} {n:5d}  ({pct:5.1f}%)")

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
    dropped = [d for r in results for d in r.dropped]
    print(
        f"dropped implausible refs ({len(dropped)}) -- chapter exceeds the "
        "book's real length, almost always a dropped-colon typo (e.g. "
        "'Eph 314' for 'Eph 3:14'); ambiguous to auto-split so dropped "
        "rather than guessed:"
    )
    for d in dropped:
        print(f"  - {d}")

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


def test_empty_citation_is_flagged_as_empty() -> None:
    # A handful of real footnotes in the full corpus have empty text (a
    # known PT-mirror source defect) -- distinct from an actual parse
    # failure, so it gets its own bucket rather than "unparseable".
    r = parse_citation("")
    assert r.classification == "empty"
    assert r.refs == []


def test_book_like_prefix_does_not_block_later_real_ref() -> None:
    # Real sample citation: "Ad Eph." (a patristic letter title) contains
    # "Eph" with no chapter after it; the real ref, "I Cor 2:8", follows
    # later in the same clause and must still be found.
    r = parse_citation(
        "St. Ignatius of Antioch, Ad Eph. 19, 1: AF 11/2 76-80: cf. I Cor 2:8."
    )
    assert r.classification == "scripture"
    assert len(r.refs) == 1
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses, ref.cf) == ("1cor", 2, [8], True)


def test_lowercase_l_as_one_prefix_typo() -> None:
    # Real sample citation: "l Cor 13:12." -- lowercase L standing in for "1".
    r = parse_citation("l Cor 13:12.")
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses) == ("1cor", 13, [12])


def test_in_typo_for_jn() -> None:
    # Real sample citation: "In 17:3." -- J misread/mistyped as I.
    r = parse_citation("In 17:3.")
    ref = r.refs[0]
    assert (ref.osis, ref.chapter, ref.verses) == ("john", 17, [3])


def test_all_caps_ps_and_ex() -> None:
    r = parse_citation("PS 118:22.")
    assert (r.refs[0].osis, r.refs[0].chapter, r.refs[0].verses) == ("ps", 118, [22])
    r2 = parse_citation("EX 3:6.")
    assert (r2.refs[0].osis, r2.refs[0].chapter, r2.refs[0].verses) == ("exod", 3, [6])


def test_patristic_titles_stay_non_scripture() -> None:
    # "Sermo", "Psal", "Smyrn" etc. look book-shaped but are patristic work
    # titles/section numbers, not scripture -- must not produce refs.
    for text in (
        "St. Augustine, Sermo 241, 2: PL 38, 1134,",
        "St. Ambrose, Psal 118:14:30: PL 15:1476.",
        "St. Ignatius of Antioch, Ad Smyrn. 8:1; SCh 10, 138.",
    ):
        r = parse_citation(text)
        assert r.refs == [], (text, r.refs)
        assert r.classification == "non-scripture"


def test_single_chapter_book_bare_number_is_a_verse() -> None:
    # Real sample citations: single-chapter books are cited "Book <verse>",
    # never "Book 1:<verse>" -- the bare number must land as chapter=1,
    # verse=N, not be mistaken for a (nonexistent) chapter N.
    cases = [
        ("LG 12; cf. Jude 3.", "jude", 1, [3]),
        ("I Tim 3:15; Jude 3.", "jude", 1, [3]),
        ("Cf. I Jn 4:2-3; 2 Jn 7.", "2john", 1, [7]),
        ("Cf. Jn 3:18; Acts 2:21; 5:41; 3 Jn 7; Rom 10:6-13.", "3john", 1, [7]),
        ("Philem 16.", "phlm", 1, [16]),
    ]
    for text, osis, chapter, verses in cases:
        r = parse_citation(text)
        matches = [ref for ref in r.refs if ref.osis == osis]
        assert len(matches) == 1, (text, r.refs)
        assert (matches[0].chapter, matches[0].verses) == (chapter, verses), (
            text,
            matches[0],
        )


def test_single_chapter_book_range() -> None:
    # "Jude 24-25" -- a verse range on a single-chapter book.
    r = parse_citation("Cf. Eph 1:3-14; Rom 16:25-27; Eph 3:20-21; Jude 24-25.")
    jude_refs = [ref for ref in r.refs if ref.osis == "jude"]
    assert len(jude_refs) == 1
    assert (jude_refs[0].chapter, jude_refs[0].verses) == (1, [24, 25])


def test_dropped_colon_produces_implausible_chapter_is_dropped() -> None:
    # Real sample citation: "Cf. Eph 314." -- "Eph 3:14" with the colon
    # dropped, producing a nonexistent "chapter 314" (Ephesians has 6
    # chapters). Ambiguous how to split "314" back into chapter:verse, so
    # this must be dropped, not guessed, and surfaced in the report.
    r = parse_citation("Cf. Eph 314.")
    assert r.refs == []
    assert r.classification == "non-scripture"
    assert any("eph 314" in d for d in r.dropped)


def test_max_chapter_covers_all_73_books() -> None:
    assert set(MAX_CHAPTER) == CANONICAL_73_SET


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
