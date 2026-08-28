"""Hebrew/Masoretic verse numbers to the Vulgate numbering the corpus uses.

`versification.json` beside this module is GENERATED from the site's
`site/src/lib/versification.ts` by `site/scripts/export-versification.mjs`,
and `site/src/lib/versification.test.ts` fails whenever the two differ. Edit
the TypeScript, run the export, commit both; never edit the JSON.

ONLY THE TABLES CROSS OVER, and that asymmetry is deliberate. Three books --
Psalms, Malachi, Joel -- diverge wholesale: chapter boundaries move, so every
reference into them needs converting by a FUNCTION, and those functions stay
in TypeScript. A Python twin of exactly this logic existed until 2026-08-21
and went with `pipeline/build/`; writing another is the drift the export
exists to prevent. So `to_vulgate` REFUSES a reference into one of those three
rather than guessing, and a caller that needs them must go through the site.

WHY THE NARROW TABLE MATTERS MORE THAN IT LOOKS. `late_merge` covers a handful
of chapters whose tail runs one or two verses ahead of the Vulgate because the
Vulgate joins two verses modern editions print apart. Those were found because
a citation pointed PAST the end of a chapter -- Acts 7:60 in a 59-verse Acts 7
-- which fails loudly and is easy to catch. The verses just before it do not:
they resolve to real, existing, wrong text, and nothing complains. That is why
conversion is applied unconditionally rather than only when a lookup fails.
"""

from __future__ import annotations

import json
from functools import cache
from pathlib import Path

VERSIFICATION_PATH = Path(__file__).with_name("versification.json")


class WholesaleDivergence(Exception):
    """Raised for a book whose conversion is an algorithm, not a table.

    Carries the osis so a caller can report which reference it could not take,
    rather than silently leaving a Hebrew number in a Vulgate corpus.
    """

    def __init__(self, osis: str):
        self.osis = osis
        super().__init__(
            f"{osis!r} diverges wholesale between Hebrew and Vulgate numbering; "
            "its mapper lives in site/src/lib/versification.ts and is deliberately "
            "not duplicated here (see this module's docstring)"
        )


@cache
def _table() -> dict:
    return json.loads(VERSIFICATION_PATH.read_text(encoding="utf-8"))


def is_wholesale_divergent(osis: str) -> bool:
    """True for Psalms, Malachi and Joel -- the books with a mapper, not a table."""
    return osis in _table()["wholesale_divergent"]


def to_vulgate(osis: str, chapter: int, verse: int | None) -> tuple[int, int | None]:
    """`(chapter, verse)` in Vulgate numbering, from a Hebrew-numbered address.

    A no-op for every address the tables say nothing about, which is nearly all
    of them -- so this is safe to call on every reference rather than only on
    ones already suspected of being Hebrew-numbered. Applying a no-op cannot
    turn a correct address into a wrong one; skipping a needed conversion
    silently can, and does.

    Raises `WholesaleDivergence` for Psalms, Malachi and Joel.
    """
    if is_wholesale_divergent(osis):
        raise WholesaleDivergence(osis)
    if verse is None:
        return chapter, None
    moved = _table()["late_merge"].get(f"{osis}:{chapter}:{verse}")
    if moved is None:
        return chapter, verse
    return moved["chapter"], moved["verse"]
