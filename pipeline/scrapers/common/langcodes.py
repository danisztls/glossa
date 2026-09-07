"""Reading a source's language code into the corpus's own tag, without guessing.

THE CORPUS TAGS ARE ISO 639-1. vatican.va's are not, and the two disagree on
the one code that matters most: **`lt` is LATIN there, where ISO 639-1 says
`la` is Latin and `lt` is Lithuanian.** So the obvious reading of a vatican.va
URL is not merely imprecise -- it is the exactly wrong language, and one that
the same host also publishes, so nothing downstream can catch it.

It has been sprung four times, on four different indexes, and each time by a
map that passed the code through unmapped:

  - `catechism_lt/` is the *editio typica latina* (`ccc.py`); the site's own
    link text says Latin and the pages say `PARS PRIMA`.
  - The Vatican II archive mirror writes `_lt.html` for Latin
    (`VATII_LANG_FROM_URL`), alongside `ge` German, `po` Portuguese, `sp`
    Spanish and `sw` Swahili -- none of them ISO either.
  - The doctrinal office's index writes `_lt` for Latin on 73 links and `_lit`
    for Lithuanian on five, **both live on one page** (`CDF_LANG_FROM_URL`),
    so a borrowed code map does not fail: it files 66 Latin editions as
    Lithuanian, silently.
  - `cic_index_lt.html` 404s where `cic_index_la.html` is the Latin Code --
    the exact inverse, and it cost a scope decision (`docs/decisions.md`).

The First Vatican Council's mirror spells Latin `la` on the same host, which
is why `VATI_LANG_FROM_URL` exists beside `VATII_LANG_FROM_URL`: there is no
site-wide convention to encode, only a per-index reading.

WHAT THIS MODULE ENFORCES is therefore not a table of translations -- each
index needs its own, read off its own link text -- but the rule that an
AMBIGUOUS code may never fall through a map unrecognised. `corpus_lang` maps
through the caller's table and raises on a code in `AMBIGUOUS_SOURCE_CODES`
that the table does not name. Fatal rather than skipped, on the precedent of
`liturgical_calendar.py`'s rank tokens: an unknown token there is fatal, and
that is how the Polish feed's `U Ś W w` was found rather than silently ranking
a solemnity as nothing.
"""

from __future__ import annotations

#: Source codes whose meaning on vatican.va differs from ISO 639-1, and what a
#: guess gets instead. A code is here because reading it wrongly yields a real
#: language the site also publishes, so the mistake survives every check: the
#: work parses, validates, and ships under a language it is not in.
#:
#: `zh` is here for a different reason and it is the same failure. The corpus
#: tags SCRIPT, not just language -- `zht` is Traditional (`ccc.zht`,
#: `prayer.common.zht`) and `zh` Simplified -- so a bare `zh` off a source is
#: an under-specified tag rather than a wrong one, and passing it through
#: asserts Simplified about a file the source named `zh-t`.
AMBIGUOUS_SOURCE_CODES: dict[str, str] = {
    "lt": "Latin on vatican.va; ISO 639-1 Lithuanian. `la` is Latin, `lit` is "
    "how the doctrinal office's index writes Lithuanian",
    "sw": "Swahili on the conciliar mirror; a guess reads it as Swedish (`sv`)",
    "ge": "German on the conciliar mirror; not an ISO code (`de`)",
    "po": "Portuguese on the conciliar mirror; not an ISO code (`pt`)",
    "sp": "Spanish on the conciliar mirror; not an ISO code (`es`)",
    "iw": "Hebrew, the retired ISO code the modern CMS still spells (`he`)",
    "zh": "Chinese with no script named; the corpus tags scripts (`zh` vs `zht`)",
}


#: The inverse direction, and a NARROWER question. Going corpus tag -> source
#: code, a missing row means a URL built from a guess; usually that guess is
#: right, because most of the site is ISO and a table naming every language
#: would be a second copy of the language list. This set is the tags where the
#: guess names a DIFFERENT language the same host publishes, so the request
#: succeeds and fetches the wrong text.
#:
#: It has one member and that is the finding, not an omission. `lt` spelled
#: into a vatican.va URL asks for Latin; the corpus means Lithuanian by it.
#: Every other divergence fails as a 404 (`ge`, `po`, `sp` are not ISO, so
#: nothing else answers to them) and a 404 is a report.
AMBIGUOUS_CORPUS_TAGS: dict[str, str] = {
    "lt": "Lithuanian in the corpus; a vatican.va URL spelled `lt` asks for "
    "LATIN and gets it. The family's own table has to name the spelling "
    "(`lit` on the doctrinal office's index)",
}


class AmbiguousLangCode(ValueError):
    """A language code this corpus must not read or write without a table."""


def corpus_lang(code: str, table: dict[str, str], *, source: str) -> str:
    """`code` as the corpus's own language tag, per the caller's `table`.

    An unlisted code passes through unchanged -- most of a source's codes ARE
    ISO 639-1 and a table that had to name all of them would be a second copy
    of the language list. What may not pass through is a code in
    `AMBIGUOUS_SOURCE_CODES`: that raises, naming the source, so a new index
    spelling Latin `lt` fails on its first run instead of on a reader's page.

    `source` is what the message says the code was read from -- the index or
    the URL shape, not the scraper -- since the fix is always a row in that
    index's own table.
    """
    if code in table:
        return table[code]
    if code in AMBIGUOUS_SOURCE_CODES:
        raise AmbiguousLangCode(
            f"{source}: language code {code!r} has no entry in this index's "
            f"table, and it must not be read as the corpus tag {code!r} -- "
            f"{AMBIGUOUS_SOURCE_CODES[code]}. Read the index's own link text "
            f"and add the row (common/langcodes.py)."
        )
    return code


def source_code(lang: str, table: dict[str, str], *, family: str) -> str:
    """`lang` as `family`'s own URL spelling, per the caller's `table`.

    The inverse of `corpus_lang`, and it refuses a narrower set --
    `AMBIGUOUS_CORPUS_TAGS`, which has one member. An unlisted tag passes
    through because a wrong guess there 404s, and a 404 is reported; `lt` is
    the one that would be answered, with the Latin edition.
    """
    if lang in table:
        return table[lang]
    if lang in AMBIGUOUS_CORPUS_TAGS:
        raise AmbiguousLangCode(
            f"{family}: no URL spelling for {lang!r} in this family's table, "
            f"and it must not be spelled {lang!r} into a vatican.va URL -- "
            f"{AMBIGUOUS_CORPUS_TAGS[lang]} (common/langcodes.py)."
        )
    return lang
