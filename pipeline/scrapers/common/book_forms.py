"""The surface forms a citation may spell a Bible book with, per language.

`book_forms.json` beside this module is GENERATED from the site's reference
grammar (`site/src/lib/refs-grammar.ts`, `BOOK_VARIANTS_EN`/`_PT`) by
`site/scripts/export-book-forms.mjs`, and `site/src/lib/book-forms.test.ts`
fails whenever the two differ. Edit the TypeScript table, run the export,
commit both; never edit the JSON.

WHY THE PIPELINE READS THE SITE'S TABLE. Only one scraper needs to recognize
a book abbreviation at all: `ccc/ccc.py`, which tokenizes the Portuguese
Catechism's inline Scripture locators ("(Mt 28, 19-20)") so the site can hand
the reference parser a citation-shaped string instead of running prose
(docs/corpus-schema.md §CCC). Until 2026-08-25 it carried its own book list,
in Python, and the two drifted in the only direction they could: the site's
table grew with every measurement of the corpus, and the scraper's did not.
The rule that decides what is a citation and the rule that decides what
links should not disagree about what a book is called.
"""

from __future__ import annotations

import json
import re
from functools import cache
from pathlib import Path

BOOK_FORMS_PATH = Path(__file__).with_name("book_forms.json")


@cache
def book_forms(lang: str) -> dict[str, list[str]]:
    """OSIS id -> the surface forms citations in `lang` use for that book."""
    data = json.loads(BOOK_FORMS_PATH.read_text(encoding="utf-8"))
    try:
        return data[lang]
    except KeyError:
        raise KeyError(
            f"no book forms for {lang!r} in {BOOK_FORMS_PATH}; "
            f"the site's grammar knows {sorted(k for k in data if k != 'generated_by')}"
        ) from None


def book_form_pattern(lang: str) -> str:
    """A regex alternation of every form in `lang`, longest first so that
    "Jo" cannot pre-empt "Job", each form escaped, none bounded — the caller
    decides what may precede and follow a book name."""
    forms = sorted(
        {f for fs in book_forms(lang).values() for f in fs}, key=lambda f: (-len(f), f)
    )
    return "(?:" + "|".join(re.escape(f) for f in forms) + ")"
