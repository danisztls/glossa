#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Hebrew/Masoretic ("modern") <-> Vulgate versification mapping.

Python counterpart of ``site/src/lib/versification.ts`` — read that file's
module docblock for the full derivation (the corpus-wide measurement that
found these divergences, why there is no Psalm verse-title offset, and why
the mapping is applied unconditionally rather than only as a fallback after
an existence check fails, per the Joel discovery). This file exists so
``xrefs.py`` can convert Hebrew-numbered CCC citations into the Vulgate
address space *before* writing ``corpus/xrefs/ccc-bible.json`` — the site's
canonical address space — rather than shipping Hebrew-numbered xrefs that
`refs.ts`'s `refHref` would then have to re-convert at read time.

Pure and dependency-free, same design as the TypeScript module: no corpus
import, `to_vulgate_candidates` always returns at least one candidate
(identity passthrough for anything this module has no divergence data for),
and a chapter/verse combination outside a covered book's Hebrew numbering
range is treated as already-Vulgate (safe by construction: a no-op mapping
can never turn a correct address into a wrong one).
"""

from __future__ import annotations

from dataclasses import dataclass

# --------------------------------------------------------------------------
# Psalms — see versification.ts for the full derivation and corpus-verified
# boundary verse counts (Vulg 9 = 39, Vulg 113 = 26, Vulg 114 = 9,
# Vulg 115 = 10, Vulg 146 = 11, Vulg 147 = 9).
# --------------------------------------------------------------------------

_PS_MERGE_9_10_SPLIT = 21  # Heb 9's own verse count (title-inclusive)
_PS_MERGE_114_115_SPLIT = 8  # Heb 114's own verse count
_PS_SPLIT_116_AT = 9  # last verse of Heb 116 that lands in Vulg 114
_PS_SPLIT_147_AT = 11  # last verse of Heb 147 that lands in Vulg 146


def _map_psalm(chapter: int, verse: int | None) -> list[tuple[int, int | None]]:
    if 1 <= chapter <= 8:
        return [(chapter, verse)]
    if 148 <= chapter <= 150:
        return [(chapter, verse)]

    if chapter in (9, 10):
        if verse is None:
            return [(9, None)]
        v = verse if chapter == 9 else verse + _PS_MERGE_9_10_SPLIT
        return [(9, v)]

    if 11 <= chapter <= 113:
        return [(chapter - 1, verse)]

    if chapter in (114, 115):
        if verse is None:
            return [(113, None)]
        v = verse if chapter == 114 else verse + _PS_MERGE_114_115_SPLIT
        return [(113, v)]

    if chapter == 116:
        if verse is None:
            return [(114, None), (115, None)]  # ambiguous: whole psalm spans both
        return [(114, verse)] if verse <= _PS_SPLIT_116_AT else [(115, verse - _PS_SPLIT_116_AT)]

    if 117 <= chapter <= 146:
        return [(chapter - 1, verse)]

    if chapter == 147:
        if verse is None:
            return [(146, None), (147, None)]  # ambiguous: whole psalm spans both
        return [(146, verse)] if verse <= _PS_SPLIT_147_AT else [(147, verse - _PS_SPLIT_147_AT)]

    # Outside 1-150 entirely: not a valid Hebrew psalm number — pass through.
    return [(chapter, verse)]


# --------------------------------------------------------------------------
# Malachi — Heb 3:19-24 = Vulg 4:1-6 (confirmed live: CCC 678's "Mal 3: 19").
# Chapter 4 has no Hebrew equivalent; pass through (already-Vulgate input).
# --------------------------------------------------------------------------

_MAL_SPLIT_AT = 18  # last verse of Heb 3 that stays in Vulg 3


def _map_malachi(chapter: int, verse: int | None) -> list[tuple[int, int | None]]:
    if chapter in (1, 2):
        return [(chapter, verse)]
    if chapter == 3:
        if verse is None:
            return [(3, None), (4, None)]  # ambiguous: whole chapter spans both
        return [(3, verse)] if verse <= _MAL_SPLIT_AT else [(4, verse - _MAL_SPLIT_AT)]
    return [(chapter, verse)]  # chapter >= 4: no Hebrew equivalent


# --------------------------------------------------------------------------
# Joel — Heb 3:1-5 = Vulg 2:28-32; Heb 4 = Vulg 3 (confirmed live:
# "Joel 3:1-5", "Joel 3-4"). Verified: Vulg Joel 2 = 32 verses (27+5),
# Vulg Joel 3 = 21 (matching Heb 4's own length).
#
# NOTE: `xrefs.py`'s `MAX_CHAPTER["joel"]` (the implausible-chapter guard
# used during citation PARSING, before this module ever runs) is 3 — the
# Vulgate's own chapter count, not Hebrew's 4. A hypothetical future
# citation literally written "Joel 4:N" would therefore be dropped as an
# implausible chapter (indistinguishable from a dropped-colon typo) before
# reaching this mapping, rather than converted to Vulgate 3. Not fixed here:
# no real citation in the corpus does this (verified — see this module's
# docblock and xrefs.py's own measurement), and under-linking a case that
# doesn't exist yet is exactly the project's stated preference over
# widening a shared plausibility guard on spec. If a real "Joel 4:N"
# citation ever surfaces, raising that guard (not this file) is the fix.
# --------------------------------------------------------------------------

_JOEL_CH2_SPLIT = 27  # Heb 2's own verse count


def _map_joel(chapter: int, verse: int | None) -> list[tuple[int, int | None]]:
    if chapter == 1:
        return [(1, verse)]
    if chapter == 2:
        return [(2, verse)]  # Heb 2 always <= Vulg 2's first 27 verses
    if chapter == 3:
        if verse is None:
            return [(2, None)]  # unambiguous: wholly nested in Vulg 2's tail
        return [(2, verse + _JOEL_CH2_SPLIT)]
    if chapter == 4:
        return [(3, verse)]
    return [(chapter, verse)]  # outside 1-4: no Hebrew equivalent


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class VulgateAddress:
    osis: str
    chapter: int
    verse: int | None


_DIVERGENT_MAPPERS = {
    "ps": _map_psalm,
    "mal": _map_malachi,
    "joel": _map_joel,
}


# --------------------------------------------------------------------------
# Late-merge point mappings
# --------------------------------------------------------------------------
#
# The three books above diverge WHOLESALE: their chapter boundaries move, so
# every reference into them needs converting and each has a mapper that knows
# the shape of the shift. A second, much narrower kind of divergence exists
# too, and it does not deserve a mapper: a handful of individual chapters
# where the Vulgate MERGES two verses that modern editions print separately,
# so the tail of that one chapter is offset by one or two and the rest of the
# book agrees exactly.
#
# Those are recorded here as explicit point mappings rather than as
# per-chapter offset rules, because a point mapping cannot extrapolate. Every
# entry below was verified by reading BOTH shipped editions at the target
# address and confirming the text is the passage the modern number names --
# `bible.cpdv.en` and `bible.matos-soares.pt` agree on all of them, which is
# the cross-language check docs/decisions.md relies on elsewhere. Nothing is
# inferred from verse COUNTS: a chapter being two verses short tells you an
# offset exists somewhere, never where it starts.
#
# WHY THIS MATTERS MORE THAN THE OUT-OF-RANGE VERSES THAT EXPOSED IT. These
# were found because CCC citations pointed past the end of a chapter (Acts
# 7:60 in a 59-verse Acts 7), which fails loudly. But the same offset means
# the verses just BEFORE it resolve to real, existing, wrong text -- CCC's
# "Mt 17:24-27" was landing on Vulgate 17:24-26, one verse off for its whole
# length, and nothing anywhere would have complained. That is exactly the
# failure docs/decisions.md's versification entry describes for the Psalms,
# and it is why each cited verse gets its own verified entry rather than only
# the one that happened to overflow.
#
# Applied unconditionally, like the mappers above, precisely BECAUSE the
# literal address usually exists and is wrong. Restricting this to a fallback
# for missing verses would fix only the loud half.
_LATE_MERGE: dict[tuple[str, int, int], tuple[int, int]] = {
    # 2 Cor 13: the Vulgate joins the modern 13:12/13, so the Trinitarian
    # blessing that closes the letter is 13:13 here, not 13:14. Cited three
    # times by the CCC (249, 734, 2627).
    ("2cor", 13, 14): (13, 13),
    # Zechariah 2: modern editions move Hebrew 2:1-4 up into chapter 1, so
    # the whole chapter runs four verses ahead. "Sing praise and rejoice,
    # daughter of Zion" is 2:10 here.
    ("zech", 2, 14): (2, 10),
    # Exodus 40: offset by two across the chapter's tail. Verified across the
    # whole cited range and two verses beyond it in each direction.
    ("exod", 40, 34): (40, 32),
    ("exod", 40, 35): (40, 33),
    ("exod", 40, 36): (40, 34),
    ("exod", 40, 37): (40, 35),
    ("exod", 40, 38): (40, 36),
    # Matthew 17: offset by one from the temple-tax episode onward.
    ("matt", 17, 24): (17, 23),
    ("matt", 17, 25): (17, 24),
    ("matt", 17, 26): (17, 25),
    ("matt", 17, 27): (17, 26),
    # Acts 7: offset by one through the stoning of Stephen.
    ("acts", 7, 57): (7, 56),
    ("acts", 7, 58): (7, 57),
    ("acts", 7, 59): (7, 58),
    ("acts", 7, 60): (7, 59),
}


def is_divergent_book(osis: str) -> bool:
    """True for the OSIS codes this module has a real, corpus-verified divergence table for.

    Covers the wholesale-divergence books only. The late-merge chapters are
    deliberately excluded: Matthew and Acts agree with modern numbering
    everywhere except one chapter's tail, and calling the whole book
    "divergent" would invite callers to treat every reference into them as
    needing conversion.
    """
    return osis in _DIVERGENT_MAPPERS


def to_vulgate_candidates(osis: str, chapter: int, verse: int | None = None) -> list[VulgateAddress]:
    """Vulgate address candidates for a Hebrew/Masoretic-numbered
    ``(osis, chapter, verse)``, best guess first. Always returns at least
    one entry. More than one only happens when a whole-chapter reference
    (no verse given) names a Hebrew chapter that spans two Vulgate chapters
    (Ps 116, Ps 147, Malachi 3) — see versification.ts's docblock.
    """
    mapper = _DIVERGENT_MAPPERS.get(osis)
    pairs = mapper(chapter, verse) if mapper else [(chapter, verse)]
    # Late merges are applied AFTER the book mappers, and never to a
    # whole-chapter reference (no verse to move). No book has both, so the
    # ordering is a formality rather than a precedence rule -- stated here so
    # it stays one if a book ever acquires both.
    pairs = [
        _LATE_MERGE.get((osis, c, v), (c, v)) if v is not None else (c, v)
        for c, v in pairs
    ]
    return [VulgateAddress(osis=osis, chapter=c, verse=v) for c, v in pairs]


# --------------------------------------------------------------------------
# Tests (pytest): uv run --with pytest -m pytest pipeline/build/versification.py
#
# Ground truth pulled from the real corpus (`corpus/works/bible.cpdv.en`),
# not textbook numbers — same values used by the TypeScript counterpart's
# test file (`site/src/lib/versification.test.ts`), verified with `jq`
# against the actual shipped Bible files.
# --------------------------------------------------------------------------


def _addr(osis: str, chapter: int, verse: int | None) -> VulgateAddress:
    return VulgateAddress(osis=osis, chapter=chapter, verse=verse)


def test_psalms_1_to_8_and_148_to_150_agree() -> None:
    assert to_vulgate_candidates("ps", 3, 5) == [_addr("ps", 3, 5)]
    assert to_vulgate_candidates("ps", 150, 6) == [_addr("ps", 150, 6)]


def test_psalms_shift_ranges() -> None:
    assert to_vulgate_candidates("ps", 11, 1) == [_addr("ps", 10, 1)]
    assert to_vulgate_candidates("ps", 113, 1) == [_addr("ps", 112, 1)]
    assert to_vulgate_candidates("ps", 117, 1) == [_addr("ps", 116, 1)]
    assert to_vulgate_candidates("ps", 146, 1) == [_addr("ps", 145, 1)]


def test_psalms_merge_9_and_10() -> None:
    assert to_vulgate_candidates("ps", 9, 21) == [_addr("ps", 9, 21)]  # Heb 9's last verse
    assert to_vulgate_candidates("ps", 10, 1) == [_addr("ps", 9, 22)]  # Heb 10's first verse
    assert to_vulgate_candidates("ps", 10, 18) == [_addr("ps", 9, 39)]  # = Vulg 9's real last verse


def test_psalms_merge_114_and_115() -> None:
    assert to_vulgate_candidates("ps", 114, 8) == [_addr("ps", 113, 8)]
    assert to_vulgate_candidates("ps", 115, 1) == [_addr("ps", 113, 9)]
    assert to_vulgate_candidates("ps", 115, 18) == [_addr("ps", 113, 26)]  # = Vulg 113's real last verse


def test_psalms_split_116() -> None:
    assert to_vulgate_candidates("ps", 116, 9) == [_addr("ps", 114, 9)]
    assert to_vulgate_candidates("ps", 116, 10) == [_addr("ps", 115, 1)]
    assert to_vulgate_candidates("ps", 116) == [_addr("ps", 114, None), _addr("ps", 115, None)]


def test_psalms_split_147() -> None:
    assert to_vulgate_candidates("ps", 147, 11) == [_addr("ps", 146, 11)]
    assert to_vulgate_candidates("ps", 147, 12) == [_addr("ps", 147, 1)]
    assert to_vulgate_candidates("ps", 147) == [_addr("ps", 146, None), _addr("ps", 147, None)]


def test_psalms_real_ccc_citation_regressions() -> None:
    # ccc112 "Ps 22:14" -> Vulg 21:14 is verbatim "roaring lion" (confirmed
    # against real corpus text). ccc298 "Ps 51:12" -> Vulg 50:12 is verbatim
    # "Create a clean heart in me" (the Miserere).
    assert to_vulgate_candidates("ps", 22, 14) == [_addr("ps", 21, 14)]
    assert to_vulgate_candidates("ps", 51, 12) == [_addr("ps", 50, 12)]


def test_malachi_chapters_1_and_2_and_first_half_of_3_agree() -> None:
    assert to_vulgate_candidates("mal", 1, 11) == [_addr("mal", 1, 11)]
    assert to_vulgate_candidates("mal", 3, 18) == [_addr("mal", 3, 18)]


def test_malachi_3_19_to_24_maps_to_4_1_to_6() -> None:
    # The bug that triggered this whole task: CCC 678's "Mal 3: 19".
    assert to_vulgate_candidates("mal", 3, 19) == [_addr("mal", 4, 1)]
    assert to_vulgate_candidates("mal", 3, 24) == [_addr("mal", 4, 6)]


def test_malachi_whole_chapter_3_is_ambiguous() -> None:
    assert to_vulgate_candidates("mal", 3) == [_addr("mal", 3, None), _addr("mal", 4, None)]


def test_malachi_chapter_4_passes_through_unchanged() -> None:
    assert to_vulgate_candidates("mal", 4, 2) == [_addr("mal", 4, 2)]


def test_joel_chapter_1_and_2_first_27_verses_agree() -> None:
    assert to_vulgate_candidates("joel", 1, 1) == [_addr("joel", 1, 1)]
    assert to_vulgate_candidates("joel", 2, 27) == [_addr("joel", 2, 27)]


def test_joel_3_1_to_5_maps_to_2_28_to_32() -> None:
    assert to_vulgate_candidates("joel", 3, 1) == [_addr("joel", 2, 28)]
    assert to_vulgate_candidates("joel", 3, 5) == [_addr("joel", 2, 32)]


def test_joel_4_maps_to_3() -> None:
    assert to_vulgate_candidates("joel", 4, 1) == [_addr("joel", 3, 1)]
    assert to_vulgate_candidates("joel", 4, 21) == [_addr("joel", 3, 21)]


def test_non_divergent_books_are_identity() -> None:
    assert to_vulgate_candidates("gen", 9, 16) == [_addr("gen", 9, 16)]
    assert to_vulgate_candidates("john", 3, 16) == [_addr("john", 3, 16)]


def test_is_divergent_book() -> None:
    assert is_divergent_book("ps") is True
    assert is_divergent_book("mal") is True
    assert is_divergent_book("joel") is True
    assert is_divergent_book("gen") is False


# --- Late merges -----------------------------------------------------------
#
# Mirror of versification.test.ts's "late-merge chapters" suite; keep the two
# in step. Every expectation was verified by reading the passage at the target
# address in BOTH shipped editions, which agree on all of them.


def test_late_merge_2cor_trinitarian_blessing() -> None:
    # 2 Cor 13 has 13 verses in the Vulgate, 14 in modern editions.
    assert to_vulgate_candidates("2cor", 13, 14) == [_addr("2cor", 13, 13)]


def test_late_merge_zechariah_runs_four_ahead() -> None:
    assert to_vulgate_candidates("zech", 2, 14) == [_addr("zech", 2, 10)]


def test_late_merge_exodus_40_whole_cited_range() -> None:
    assert to_vulgate_candidates("exod", 40, 36) == [_addr("exod", 40, 34)]
    assert to_vulgate_candidates("exod", 40, 37) == [_addr("exod", 40, 35)]
    assert to_vulgate_candidates("exod", 40, 38) == [_addr("exod", 40, 36)]


def test_late_merge_covers_verses_that_exist_but_are_wrong() -> None:
    # The point of the table. Acts 7:60 overflows a 59-verse chapter and fails
    # loudly; 7:57-59 all exist and were silently resolving one verse early.
    assert to_vulgate_candidates("acts", 7, 57) == [_addr("acts", 7, 56)]
    assert to_vulgate_candidates("acts", 7, 60) == [_addr("acts", 7, 59)]
    assert to_vulgate_candidates("matt", 17, 24) == [_addr("matt", 17, 23)]
    assert to_vulgate_candidates("matt", 17, 27) == [_addr("matt", 17, 26)]


def test_late_merge_leaves_the_rest_of_those_books_alone() -> None:
    # The merge is confined to one chapter's tail; Matthew and Acts are not
    # divergent books and must not be treated as such.
    assert to_vulgate_candidates("matt", 5, 3) == [_addr("matt", 5, 3)]
    assert to_vulgate_candidates("matt", 17, 1) == [_addr("matt", 17, 1)]
    assert to_vulgate_candidates("acts", 2, 38) == [_addr("acts", 2, 38)]
    assert to_vulgate_candidates("2cor", 13, 13) == [_addr("2cor", 13, 13)]
    assert is_divergent_book("matt") is False
    assert is_divergent_book("acts") is False


def test_late_merge_leaves_whole_chapter_references_untouched() -> None:
    assert to_vulgate_candidates("acts", 7) == [_addr("acts", 7, None)]
