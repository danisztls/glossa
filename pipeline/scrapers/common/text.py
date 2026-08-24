"""Text utilities that are about text, not about a source.

The bar `strip_tags` fails is the bar these clear -- see the package docstring
for why that distinction decides what may live here."""

from __future__ import annotations

import unicodedata

# --------------------------------------------------------------------------
# Fetching
#
# THIS MODULE'S DOCBLOCK USED TO SAY `Fetcher` WAS NOT SHARED, because the
# implementations "genuinely differ -- retry policy, raise-vs-return-status
# error handling, even the HTTP library -- and unifying them is a design
# decision about behavior, not a mechanical merge". The first half was true and
# stays true. The second half was a reason to WAIT for that decision, not a
# reason never to take it, and it has now been taken: unify the skeleton, keep
# every policy.
#
# What was duplicated six times was the shape, and it was the same shape every
# time: look in the cache; on a miss, wait out the politeness floor, make one
# request, store the bytes verbatim. What differed was never that sequence --
# it was a handful of knobs, open-coded, which is how vatican.va's `Crawl-delay`
# ended up asserted in four separate files where it reads like an
# implementation detail instead of the commitment docs/decisions.md says it is.
#
# A RATE LIMIT IS STILL NOT SHARED. It is DECLARED -- `FetchPolicy` has no
# default for `delay` or `user_agent`, so a new scraper cannot inherit another
# source's floor by forgetting to state one, and each declaration sits next to
# the reason for it. That is a stronger guarantee than four copies of the same
# literal, which is what the old arrangement actually provided.
#
# WHAT IS NOT HERE, deliberately: the HTTP library. `vatican_docs.py`, `ccc.py`
# and `compendium.py` are PEP 723 scripts with `dependencies = []`, so this
# module must stay stdlib-only; `transport` is a callable, `urllib_transport`
# is the default, and the two httpx-based scrapers pass their own. Decoding is
# also the caller's: cp1252-always and sniff-the-meta-charset are claims about
# a specific source, not about fetching.
# --------------------------------------------------------------------------

# --------------------------------------------------------------------------
# Text utilities that are about text, not about a source
#
# The bar `strip_tags` failed is the bar these clear. That one looks duplicated
# and is not: compendium.py's copy turns `<br/>` into a space and ccc.py's does
# not, and the difference is a claim about how one source marks up a line
# break. Nothing below makes a claim about any source -- roman numerals,
# Unicode combining marks and digit strings are the same everywhere -- so there
# is no divergence to preserve and no coupling created by sharing them.
# --------------------------------------------------------------------------


def fold(s: str) -> str:
    """Uppercase + strip accents, for robust (typo/accent-insensitive) label
    matching.

    Length-preserving for single precomposed accented LATIN letters, which is
    every character the labels this was written for use, so a match offset in
    the folded string is safe to reuse against the original -- compendium.py
    depends on that and it is worth keeping written down.

    It is NOT length-preserving in general, and Arabic is where that stops
    being theoretical: the vowel marks vatican.va's Arabic pages print
    (`الأوّل`) are combining characters, so folding removes them and every
    offset past one is short. Use `fold_index` wherever an offset has to make
    the trip back."""
    s = unicodedata.normalize("NFKD", s.upper())
    return "".join(c for c in s if not unicodedata.combining(c))


def fold_index(s: str) -> list[int]:
    """`fold(s)`'s offsets translated back to offsets in `s`.

    Entry `i` is where `fold(s)[i]` came from; the list carries one final
    entry for the end of the string, so `idx[len(fold(s))] == len(s)` and a
    match's `end()` can be looked up without a special case.

    Folding character by character agrees with folding the whole string:
    NFKD decomposes per character, canonical ordering only ever reorders a
    combining sequence within its own base character, and case mapping is
    per character too (`ß` -> `SS` expands, but it expands the same way
    either side of the split)."""
    idx: list[int] = []
    for i, ch in enumerate(s):
        idx.extend(i for _ in fold(ch))
    idx.append(len(s))
    return idx


_ROMAN_VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s: str) -> int | None:
    """The value of a roman numeral, or None if it is not one."""
    s = s.upper()
    if not s or any(c not in _ROMAN_VALUES for c in s):
        return None
    total, prev = 0, 0
    for ch in reversed(s):
        v = _ROMAN_VALUES[ch]
        total += -v if v < prev else v
        prev = max(prev, v)
    return total or None


def looks_like_number_typo(cand: int, expected: int) -> bool:
    """True when `cand` differs from `expected` by exactly one digit at the
    same string length (e.g. 2117 vs 2217, or 81 vs 87) -- a plausible
    single-keystroke misprint of a unit number, as opposed to an unrelated
    number that happens to start a block."""
    a, b = str(cand), str(expected)
    return len(a) == len(b) and sum(x != y for x, y in zip(a, b, strict=True)) == 1


# Punctuation that can legitimately stand before a chapter's first letter, so
# that a chapter opening on a quotation or a parenthesis is not mistaken for a
# lost capital. Kept in step with LEADING_PUNCT in site/src/lib/dropcap.ts,
# which makes the identical split to build the drop cap -- change one, change
# both.
CHAPTER_OPENING_PUNCT = "\"'“”‘’«»¿¡([{—–- \t"


def chapter_opening_letter(text: str) -> str | None:
    """The character a chapter's first verse actually opens on, skipping up to
    three units of leading punctuation. Returns None if the verse opens on
    something that is neither punctuation nor a letter/digit."""
    units = text.lstrip()
    taken = 0
    while taken < len(units) and taken < 3 and units[taken] in CHAPTER_OPENING_PUNCT:
        taken += 1
    if taken >= len(units) or not units[taken].isalnum():
        return None
    return units[taken]
