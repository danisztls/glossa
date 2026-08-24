"""The JSON API shared by the two works taken from vulgata.online.

WHY THIS IS ITS OWN MODULE AND NOT `common.py`, and the answer is the one
`sacredbible.py` gives for the same shape one host over: everything here is
intensely per-source -- the `readings2` endpoint, the `tp` record taxonomy,
the site's own book codes -- and it is shared for exactly one reason, that
`introductions.py` (`bible-intro.en`, the `bd` records) and
`douay_rheims.py` (`bible.douay-rheims.en`, the `vs`/`fn`/`cd` records) read
the same responses from the same host for different halves of them.

So the boundary is "one host's API", not "generic fetching". A scraper
against a different site must not import this; it would be importing a
coincidence.

WHAT STAYS IN THE SCRAPERS, in the spirit of `common.py`'s own list:

  - **The rate limit and the user agent.** `FetchPolicy` has no default for
    either precisely so a new scraper cannot inherit another source's floor
    by forgetting to state one. Same host, same number today, still declared
    twice -- because when both run, their politeness budgets add up, and that
    is a fact each file should show.
  - **Validation and the per-edition oracles.** `bible-intro.en` checks its
    book mapping against CPDV's chapter-1 verse counts; the Douay-Rheims
    checks its verse SETS against `bible.clementina.la`, the edition it
    translates. Different claims about different works.
  - **What to do with `_..._` emphasis.** The primitive is here because the
    markup is the host's; the POLICY is not. A preface drops it as the v1
    loss docs/corpus-schema.md records, while a footnote's leading italic is
    the lemma the note glosses and becomes a field. Same characters, opposite
    decisions, and neither belongs to the transport.

THE RECORD TAXONOMY, as observed across all 73 books' chapter 1 plus the
full Douay-Rheims crawl. One request returns one chapter as a flat, UNORDERED
list of typed records, each carrying `bk`, `cn`, `vn`:

    vs   the verse text
    fn   a footnote; `rn` is its ordinal within the chapter, and the verse's
         own text carries a matching `{rn:...}` anchor around the words it
         glosses
    cd   the chapter argument -- Challoner's summary of what the chapter
         contains, printed under its heading
    bd   the book description, i.e. the preface printed before chapter 1
    ln   a line the source prints BEFORE the chapter's verses, at `vn`
    h1   a section heading
    h2   a section subheading

`ln` is not one thing, and reading it as one is the trap. In the Psalms it is
the Latin incipit the psalm is known by (`Beatus vir.`); in Lamentations it is
Jeremias's prologue, several lines of prose that Challoner prints before 1:1 --
AND it carries a footnote anchor of its own (`{1:And it came to pass}`, whose
note says the preface was not written by Jeremias). So a consumer that treats
`ln` as a decorative title will silently drop both a paragraph of text and the
note attached to it.

A chapter past the end of a book answers HTTP 200 with `[]`, which is what
makes `walk` below able to discover a book's length rather than be told it.
"""

from __future__ import annotations

import json
import re

BASE_URL = "https://vulgata.online"

#: Their book code -> (our lowercase OSIS code, their book name).
#:
#: BY IDENTITY, NEVER BY POSITION. Their canon orders the Machabees after
#: Malachias; ours puts them after Esther (docs/corpus-schema.md), so the two
#: `order` fields disagree for 27 books and zipping the lists would silently
#: mis-file every one of them.
#:
#: Their names are kept beside the codes because two pairs are live traps in
#: Douay nomenclature: `Jn` is Jonas and `Jo` is John, and their "1 Kings" is
#: our 1 Samuel while their "3 Kings" is our 1 Kings. Both importers re-check
#: this mapping against a work already in the corpus rather than trusting it.
#:
#: THE NAMES ARE ALSO THE DOUAY-RHEIMS EDITION'S DISPLAY NAMES, which is why
#: the four Kings and the two Esdras carry a modern gloss in parentheses. A
#: reader of that edition should meet Challoner's nomenclature -- it is the
#: nomenclature its own cross-references, and the older encyclicals quoting
#: it, actually use -- but a book picker showing "1 Kings" at position 9 and
#: "3 Kings" at position 11 with nothing to distinguish them is a puzzle, not
#: a faithful reproduction.
BOOK_MAP: dict[str, tuple[str, str]] = {
    "Gn": ("gen", "Genesis"),
    "Ex": ("exod", "Exodus"),
    "Lv": ("lev", "Leviticus"),
    "Nm": ("num", "Numbers"),
    "Dt": ("deut", "Deuteronomy"),
    "Js": ("josh", "Josue"),
    "Ju": ("judg", "Judges"),
    "Rt": ("ruth", "Ruth"),
    "1Sm": ("1sam", "1 Kings (1 Samuel)"),
    "2Sm": ("2sam", "2 Kings (2 Samuel)"),
    "1Rs": ("1kgs", "3 Kings (1 Kings)"),
    "2Rs": ("2kgs", "4 Kings"),
    "1Pa": ("1chr", "1 Paralipomenon"),
    "2Pa": ("2chr", "2 Paralipomenon"),
    "Esd": ("ezra", "1 Esdras"),
    "Ne": ("neh", "2 Esdras (Nehemias)"),
    "Tob": ("tob", "Tobias"),
    "Jdi": ("jdt", "Judith"),
    "Est": ("esth", "Esther"),
    "Job": ("job", "Job"),
    "Ps": ("ps", "Psalms"),
    "Pv": ("prov", "Proverbs (Sentences)"),
    "Ees": ("eccl", "Ecclesiastes"),
    "Cc": ("song", "Canticle of Canticles"),
    "Sa": ("wis", "Wisdom"),
    "Eus": ("sir", "Ecclesiasticus"),
    "Is": ("isa", "Isaias"),
    "Je": ("jer", "Jeremias"),
    "Lm": ("lam", "Lamentations"),
    "Ba": ("bar", "Baruch"),
    "Ez": ("ezek", "Ezechiel"),
    "Dn": ("dan", "Daniel"),
    "Os": ("hos", "Osee"),
    "Jl": ("joel", "Joel"),
    "Am": ("amos", "Amos"),
    "Ab": ("obad", "Abdias"),
    "Jn": ("jonah", "Jonas"),
    "Mic": ("mic", "Micheas"),
    "Na": ("nah", "Nahum"),
    "Hc": ("hab", "Habacuc"),
    "So": ("zeph", "Sophonias"),
    "Ag": ("hag", "Aggæus"),
    "Zc": ("zech", "Zacharias"),
    "Ml": ("mal", "Malachias"),
    "1Ma": ("1macc", "1 Machabees"),
    "2Ma": ("2macc", "2 Machabees"),
    "Mt": ("matt", "Matthew"),
    "Mc": ("mark", "Mark"),
    "Lc": ("luke", "Luke"),
    "Jo": ("john", "John"),
    "Act": ("acts", "Acts"),
    "Rm": ("rom", "Romans"),
    "1Co": ("1cor", "1 Corinthians"),
    "2Co": ("2cor", "2 Corinthians"),
    "Gl": ("gal", "Galatians"),
    "Ef": ("eph", "Ephesians"),
    "Fp": ("phil", "Philippians"),
    "Cl": ("col", "Colossians"),
    "1Ts": ("1thess", "1 Thessalonians"),
    "2Ts": ("2thess", "2 Thessalonians"),
    "1Tm": ("1tim", "1 Timothy"),
    "2Tm": ("2tim", "2 Timothy"),
    "Tt": ("titus", "Titus"),
    "Fm": ("phlm", "Philemon"),
    "Hb": ("heb", "Hebrews"),
    "Tg": ("jas", "James"),
    "1Pe": ("1pet", "1 Peter"),
    "2Pe": ("2pet", "2 Peter"),
    "1Jo": ("1john", "1 John"),
    "2Jo": ("2john", "2 John"),
    "3Jo": ("3john", "3 John"),
    "Jda": ("jude", "Jude"),
    "Ap": ("rev", "Apocalypse"),
}

#: `_italic_`, the host's emphasis markup. Non-greedy and single-line: the
#: source never spans a paragraph break with one pair.
EMPHASIS_RE = re.compile(r"_([^_]*)_")

#: `{1:the words the note glosses}` -- a footnote's inline anchor, carrying
#: the `rn` of the `fn` record that explains it. See the taxonomy above.
ANCHOR_RE = re.compile(r"\{(\d+):([^}]*)\}")

#: The source's own bracketed scripture locators (`[Ps. 118, 142]`).
BRACKET_RE = re.compile(r"\[([^\[\]]*)\]")


def chapter_url(edition: str, abbr: str, chapter: int) -> str:
    return f"{BASE_URL}/api/text/readings2/?ed={edition}&bk={abbr}&cn={chapter}"


def cache_name(edition: str, abbr: str, chapter: int) -> str:
    """Where one chapter's response is cached under this source's raw dir.

    CHAPTER 1 KEEPS THE FLAT NAME, and that is a concession to `raw/` being
    write-once (CLAUDE.md, docs/link-surface.md) rather than a taste. The
    2026-08-23 `bible-intro.en` run wrote 73 files named `DR2/{abbr}.json`,
    one per book, each holding chapter 1 -- because at the time chapter 1 was
    the only chapter anyone wanted. Numbering them now would orphan all 73
    and cost a re-crawl to recover exactly the bytes already on disk. So the
    numbered form starts at 2, the existing files stay the record of the
    fetch that made them, and both scrapers read chapter 1 from the same
    place."""
    return (
        f"{edition}/{abbr}.json" if chapter == 1 else f"{edition}/{abbr}.{chapter}.json"
    )


def records(payload: bytes, *, where: str) -> list[dict]:
    """One response's records, or a hard failure naming what was asked for.

    Typed rather than trusted: the endpoint is undocumented and answers 200
    for a chapter that does not exist, so "not a list of objects" is the only
    shape check available and it is worth making loudly."""
    parsed = json.loads(payload)
    if not isinstance(parsed, list):
        raise SystemExit(f"{where}: API returned {type(parsed).__name__}, not a list")
    for record in parsed:
        if not isinstance(record, dict):
            raise SystemExit(
                f"{where}: record is {type(record).__name__}, not an object"
            )
    return parsed


def of_type(records_: list[dict], tp: str) -> list[dict]:
    """This chapter's records of one `tp`, in the source's own `vn`/`rn` order.

    The endpoint returns them unordered -- verse 35 arrives before verse 19 in
    John 3 -- so every caller sorts, and sorting in one place is what keeps a
    caller from forgetting."""
    return sorted(
        (r for r in records_ if r.get("tp") == tp),
        key=lambda r: (r.get("vn") or 0, r.get("rn") or 0),
    )


def strip_emphasis(text: str) -> str:
    """`_foo_` -> `foo`. The policy question of whether to is the caller's."""
    return EMPHASIS_RE.sub(r"\1", text)


def strip_brackets(text: str) -> str:
    """`[Ps. 118, 142]` -> `Ps. 118, 142`.

    Both importers do this, for the reason `introductions.py` first gave: the
    brackets are the transcriber's apparatus rather than Challoner's text, and
    dropping them hands the site's citation parser a locator in running prose,
    which is the shape it already reads everywhere else."""
    return BRACKET_RE.sub(r"\1", text)
