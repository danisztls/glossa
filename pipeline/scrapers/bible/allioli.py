#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Allioli-Arndt German Bible -- parsed from an already-captured corpus.

Source: `raw/allioli/`, 1,405 MediaWiki `action=raw` pages captured from
vulgata.info by `pipeline/scrapers/bible/capture.py` (inventory
`bible/inventories/allioli.json`) on 2026-08-28. **This scraper does no
networking at all** -- it only reads what `capture.py` already wrote, so
`Fetcher`/`FetchPolicy` play no part here. See `capture.py`'s docblock and the
inventory's own `note` for how the pages were chosen.

THE PAGE FORMAT. Each chapter lives on its own wiki page, titled by a Latin
`=...=` line then a German `=...=` line, holding a single two-column
`{| ... |}` wikitable: the Clementine Latin first, the Allioli-Arndt German
second -- position is the only discriminator, there is no inline label. Only
the German column is this work's text; `bible.clementina.la` already holds a
Latin edition, and the two columns do not even share verse numbering (Ps 113
resets the Latin column's numbering mid-cell while the German runs
continuously -- see `docs/research`/CLAUDE.md). Verses are `N. text <br/>`,
sometimes wrapped across several `<br/>`-separated physical lines that belong
to one verse; footnotes are `<sup>N</sup>` markers **restarting at 1 per
CHAPTER, not per verse**, collected under a `===Fußnote===` heading at the
page foot as `('''N''') text - ('''N+1''') text - ...`. Cross-references print
as `[''[[:Kategorie:BIBLIA SACRA:AT:Ps32|Ps 32,6]]'']` -- the source's own
apparatus, kept as `[Ps 32,6]` (bracket and all) once the wiki-link syntax is
stripped to its display text, per docs/corpus-schema.md's "store raw, not a
refs structure the schema doesn't have" for prose citations.

THREE FILES CARRY TWO CHAPTER-BLOCKS EACH, not one, and are named below rather
than parsed generically -- there are only three of them in 1,405 pages, and
each means something different:

  * `AT/Ps09.wikitext` -- Vulgate Psalm 9 is what the Hebrew/Masoretic
    tradition splits into Psalms 9 and 10, and this source prints that split
    as two titled blocks on one page, the second headed "Psalmus X. secundum
    Hebrœos". `merge_psalm_9()` concatenates them into one 39-verse chapter 9,
    renumbering the second block starting after the first block's last verse
    (21 -> 22..39). A parser that read each `=...=` pair as its own chapter
    would silently mint a fake "chapter 10" between the real Ps. 9 and Ps. 10.
  * `AT/JSir01.wikitext` -- Sirach's translator's prologue ("Prologus" /
    "Vorrede", the grandson-of-Ben-Sira preface) shares a page with chapter 1
    proper. It carries no verse numbers at all.
  * `AT/Klagel01.wikitext` -- an editorial foreword to Lamentations ("Das
    Vorwort steht nicht im Hebräischen...", per its own footnote) shares a
    page with chapter 1. Also unnumbered.

  Neither prologue is scripture with its own address, so `special_preface()`
  folds each into a `headings` entry at `before_verse: 1, level: 4` of the
  chapter it shares a page with -- the same shape, and the same reasoning,
  `bible.douay-rheims.en` already uses for the *identical* Lamentations
  foreword (see `books/lam.json` there): named for what it is, not invented as
  a fake verse 0, and not dropped just because the schema has no bespoke slot
  for a book preface glued to a chapter page.

THREE MORE FILES ARE DUPLICATES, chosen deliberately (`BOOKS` below simply
never names the loser, so no runtime branch is needed):

  * Sirach 48: `AT/JSir48.wikitext` is used, `AT/Sirs48.wikitext` is not. The
    two are near-identical; `Sirs48` carries the extra transcription typos
    ("Nm nos" for "Nam nos", "IIsaias" for "Isaias", "relica" for "relicta",
    German "erhob sich" for "überhob sich") and `JSir48` is the 48th of an
    otherwise-complete `JSir01..JSir51` run -- `Sirs` names no other chapter.
  * 2 Thessalonians 3: `NT/2Thes03.wikitext` is used, `NT/Thes03.wikitext` is
    not, for the same reason -- `2Thes01`/`2Thes02` already exist and `Thes`
    names nothing else, and `Thes03` is the one with the missing "ut", "den"
    for "denn", and "haben" for "waren" (a wrong past tense).
  * Nehemiah 13: `AT/Neh13.wikitext` (6.7-14 KB, real content, completing
    `AT/Neh01..13`) is used. `NT/Neh13.wikitext` is a **separate, genuinely
    empty (0-byte)** page miscategorised under `NT:` by the source wiki, which
    is simply never named by `BOOKS` and so never read. (An earlier draft of
    this scraper's brief believed Nehemiah 13 was absent from the source on
    the strength of that empty NT-side duplicate; it is not -- the real page
    lives where the book actually belongs, under `AT:`.)

  A fourth near-duplicate PAIR was found that nothing upstream flagged:
  Nahum's three chapters are captured under *both* `AT/NahNN.wikitext` (the
  correctly-categorised pages) and `NT/NahNN.wikitext` (a stray duplicate,
  again miscategorised, with its own scattering of transcription typos --
  "exiccans" for "exsiccans", "desolate" for "desolati"). `BOOKS` points Nahum
  at `AT/`, exactly like every other rule in this list; `NT/NahNN.wikitext`
  is simply never read.

EVERYTHING ELSE IS THE GENERAL CASE, verified structurally across the whole
1,339-page corpus (excluding the empty `NT/Neh13.wikitext` and the three
double-block pages above) before this parser was written: every remaining
page's pre-footnote region has *exactly* one `{| ... |}` table, one `|-` row
marker and two pipe-alone cell-boundary lines in that order -- so the
Latin/German split needs no title parsing at all, only pipe-counting. A
handful of pages nest a small wikitable of their own (a genealogy, a feast-day
offering count) **inside a footnote**, never inside the verse cell itself
(verified the same way); `_flatten_tables` renders those as prose fragments
rather than dropping them.

ORPHAN FOOTNOTES. Four chapters carry one footnote marker with no `<sup>` in
any verse: it turns out each is anchored inside the chapter's own GERMAN
TITLE LINE ("Hebräisch: Sir Hasirim.<sup>1</sup>", "...nach Zählung der
Juden.<sup>1</sup>", "...nach Matthäus<sup>1</sup>"), which this parser never
reads as content. Rather than inventing a title-annotation field the Bible
schema does not have, such a note is filed unanchored against the chapter's
first verse -- the schema's own rule for a note the source prints with no
anchor at all (docs/corpus-schema.md "An annotated edition", and precedent in
`bible.douay-rheims.en`).

Usage:
    python3 pipeline/scrapers/bible/allioli.py              # full 73-book parse
    python3 pipeline/scrapers/bible/allioli.py --sample      # Philemon + John 1-3

No `--offline`/`--refresh` flags: there is nothing to fetch, so every run is
already offline and every run already re-reads `raw/` fresh.
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line sits
# above the imports rather than the imports being at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    CorrectionDriftError,
    apply_verse_corrections,
    build_root,
    captured_at,
    chapter_opening_letter,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    sample_run_writes_nothing,
    write_stamped_json,
)

RAW_SUBDIR = "allioli"
WORK_ID = "bible.allioli.de"
SOURCE_URL = (
    "https://vulgata.info/index.php?title=Kategorie:BIBLIA_SACRA:AT:1Mos01&action=raw"
)

FUSSNOTE = "===Fußnote==="

SAMPLE_BOOKS = {"phlm", "john"}
SAMPLE_JOHN_CHAPTERS = {1, 2, 3}


def raw_dir() -> Path:
    """This scraper's input directory inside the corpus checkout.

    A function, not a constant: `common.raw_root()` raises when the corpus is
    missing, and doing that at import time would break `--help`."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


# --------------------------------------------------------------------------
# The 73-book table, in docs/corpus-schema.md's canonical order.
#
# (osis, german display name, source directory, source file-stem prefix,
#  chapter count). The prefix + directory pair is also where each of the
#  four duplicate resolutions in the module docblock actually happens: this
#  table simply never names the loser, so `AT/Sirs48`, `NT/Thes03` and
#  `NT/NehNN`/`NT/NahNN` are never opened by anything below.
# --------------------------------------------------------------------------
BOOKS: list[tuple[str, str, str, str, int]] = [
    # Old Testament (46)
    ("gen", "Genesis", "AT", "1Mos", 50),
    ("exod", "Exodus", "AT", "2Mos", 40),
    ("lev", "Leviticus", "AT", "3Mos", 27),
    ("num", "Numeri", "AT", "4Mos", 36),
    ("deut", "Deuteronomium", "AT", "5Mos", 34),
    ("josh", "Josua", "AT", "Jos", 24),
    ("judg", "Richter", "AT", "Rich", 21),
    ("ruth", "Rut", "AT", "Rut", 4),
    ("1sam", "1. Samuel", "AT", "1Sam", 31),
    ("2sam", "2. Samuel", "AT", "2Sam", 24),
    ("1kgs", "1. Könige", "AT", "1Koe", 22),
    ("2kgs", "2. Könige", "AT", "2Koe", 25),
    ("1chr", "1. Chronik", "AT", "1Chr", 29),
    ("2chr", "2. Chronik", "AT", "2Chr", 36),
    ("ezra", "Esra", "AT", "Esr", 10),
    ("neh", "Nehemia", "AT", "Neh", 13),
    ("tob", "Tobit", "AT", "Tob", 14),
    ("jdt", "Judit", "AT", "Ju", 16),
    ("esth", "Ester", "AT", "Est", 16),
    ("1macc", "1. Makkabäer", "AT", "1Mak", 16),
    ("2macc", "2. Makkabäer", "AT", "2Mak", 15),
    ("job", "Hijob", "AT", "Job", 42),
    ("ps", "Psalmen", "AT", "Ps", 150),
    ("prov", "Sprüche", "AT", "Spr", 31),
    ("eccl", "Prediger (Kohelet)", "AT", "Koh", 12),
    ("song", "Hohelied", "AT", "Hohel", 8),
    ("wis", "Weisheit", "AT", "Weish", 19),
    ("sir", "Jesus Sirach", "AT", "JSir", 51),
    ("isa", "Isaias", "AT", "Jes", 66),
    ("jer", "Jeremias", "AT", "Jer", 52),
    ("lam", "Klagelieder", "AT", "Klagel", 5),
    ("bar", "Baruch", "AT", "Baru", 6),
    ("ezek", "Ezechiel", "AT", "Ez", 48),
    ("dan", "Daniel", "AT", "Dan", 14),
    ("hos", "Hosea", "AT", "Hos", 14),
    ("joel", "Joel", "AT", "Joe", 3),
    ("amos", "Amos", "AT", "Amos", 9),
    ("obad", "Obadja", "AT", "Obadja", 1),
    ("jonah", "Jonas", "AT", "Jonas", 4),
    ("mic", "Micha", "AT", "Mic", 7),
    ("nah", "Nahum", "AT", "Nah", 3),
    ("hab", "Habakuk", "AT", "Hab", 3),
    ("zeph", "Zephanja", "AT", "Zeph", 3),
    ("hag", "Haggaj", "AT", "Hagg", 2),
    ("zech", "Sacharja", "AT", "Sach", 14),
    ("mal", "Maleachi", "AT", "Mal", 4),
    # New Testament (27)
    ("matt", "Matthäus", "NT", "Mt", 28),
    ("mark", "Markus", "NT", "Mk", 16),
    ("luke", "Lukas", "NT", "Lk", 24),
    ("john", "Johannes", "NT", "Joh", 21),
    ("acts", "Apostelgeschichte", "NT", "Apg", 28),
    ("rom", "Römer", "NT", "Roem", 16),
    ("1cor", "1. Korintherbrief", "NT", "1Kor", 16),
    ("2cor", "2. Korintherbrief", "NT", "2Kor", 13),
    ("gal", "Galaterbrief", "NT", "Gal", 6),
    ("eph", "Epheserbrief", "NT", "Eph", 6),
    ("phil", "Philipperbrief", "NT", "Phil", 4),
    ("col", "Kolosserbrief", "NT", "Kol", 4),
    ("1thess", "1. Thessalonicher", "NT", "1Thes", 5),
    ("2thess", "2. Thessalonicher", "NT", "2Thes", 3),
    ("1tim", "1. Timotheus", "NT", "1Tim", 6),
    ("2tim", "2. Timotheus", "NT", "2Tim", 4),
    ("titus", "Titusbrief", "NT", "Tit", 3),
    ("phlm", "Philemonbrief", "NT", "Philo", 1),
    ("heb", "Hebräerbrief", "NT", "Hebr", 13),
    ("jas", "Jakobusbrief", "NT", "Jak", 5),
    ("1pet", "1. Petrusbrief", "NT", "1Petr", 5),
    ("2pet", "2. Petrusbrief", "NT", "2Petr", 3),
    ("1john", "1. Johannesbrief", "NT", "1Joh", 5),
    ("2john", "2. Johannesbrief", "NT", "2Joh", 1),
    ("3john", "3. Johannesbrief", "NT", "3Joh", 1),
    ("jude", "Judasbrief", "NT", "Judas", 1),
    ("rev", "Offenbarung", "NT", "Offenb", 22),
]

assert len(BOOKS) == 73, f"expected 73 books, got {len(BOOKS)}"

# Curated jump-box abbreviations: the source's own internal cross-reference
# form (lowercased -- e.g. "1mos", "jsir", "offenb") is what a reader of THIS
# edition's own apparatus already knows to type, added in `abbrevs_for`
# below; this table adds the standard modern German short forms where they
# differ usefully, the same two-tier idea `cpdv.py`/`douay_rheims.py` use for
# English.
_CURATED_ABBREVS: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lev"],
    "num": ["num"],
    "deut": ["dtn"],
    "josh": ["jos"],
    "judg": ["ri"],
    "1sam": ["1sm"],
    "2sam": ["2sm"],
    "1kgs": ["1koen", "1kön"],
    "2kgs": ["2koen", "2kön"],
    "1chr": ["1chr"],
    "2chr": ["2chr"],
    "ezra": ["esr"],
    "neh": ["neh"],
    "tob": ["tob"],
    "jdt": ["jdt", "judith"],
    "esth": ["est", "esther"],
    "1macc": ["1makk"],
    "2macc": ["2makk"],
    "job": ["ijob", "hiob"],
    "ps": ["psalm", "psalmen"],
    "prov": ["spr"],
    "eccl": ["koh", "prediger", "ekklesiastes"],
    "song": ["hld", "hohesliedsalomos"],
    "wis": ["weish"],
    "sir": ["sir", "ekklesiastikus", "ecclesiasticus"],
    "isa": ["jes", "isaias"],
    "jer": ["jer", "jeremias"],
    "lam": ["klgl"],
    "bar": ["bar"],
    "ezek": ["ez", "ezechiel"],
    "dan": ["dan"],
    "hos": ["hos"],
    "joel": ["joe", "joel"],
    "amos": ["am"],
    "obad": ["obd", "obadja"],
    "jonah": ["jona", "jonas"],
    "mic": ["mi", "micha"],
    "nah": ["nah"],
    "hab": ["hab", "habakuk"],
    "zeph": ["zef", "zephanja"],
    "hag": ["hag", "haggaj"],
    "zech": ["sach", "sacharja"],
    "mal": ["mal", "maleachi"],
    "matt": ["mt"],
    "mark": ["mk"],
    "luke": ["lk"],
    "john": ["joh"],
    "acts": ["apg"],
    "rom": ["röm", "roem"],
    "1cor": ["1kor"],
    "2cor": ["2kor"],
    "gal": ["gal"],
    "eph": ["eph"],
    "phil": ["phil"],
    "col": ["kol"],
    "1thess": ["1thess"],
    "2thess": ["2thess"],
    "1tim": ["1tim"],
    "2tim": ["2tim"],
    "titus": ["tit"],
    "phlm": ["phlm", "philemon"],
    "heb": ["hebr"],
    "jas": ["jak"],
    "1pet": ["1petr"],
    "2pet": ["2petr"],
    "1john": ["1joh"],
    "2john": ["2joh"],
    "3john": ["3joh"],
    "jude": ["jud"],
    "rev": ["offb", "offenb"],
}


def abbrevs_for(osis: str, prefix: str) -> list[str]:
    """`[osis, this edition's own internal prefix, curated standard forms]`."""
    seen: list[str] = []
    for candidate in [osis, prefix.lower(), *_CURATED_ABBREVS.get(osis, [])]:
        if candidate not in seen:
            seen.append(candidate)
    return seen


# --------------------------------------------------------------------------
# Wikitext cleanup -- shared by verse text, headings and footnote bodies.
# --------------------------------------------------------------------------

#: `[[:Kategorie:BIBLIA SACRA:AT:Ps32|Ps 32,6]]` -> `Ps 32,6`. The colon right
#: after `[[` is what makes this an inline LINK rather than a page
#: categorisation tag (see `_TRAILING_CATEGORY` below); the middle segment
#: varies in spacing/underscoring across the corpus ("BIBLIA SACRA",
#: "BIBLIA_SACRA", "BIBLIA  SACRA" with a stray extra space), so it is matched
#: as "anything but a pipe or bracket" rather than pinned to one spelling.
_WIKILINK = re.compile(r"\[\[:Kategorie:[^|\]]+\|([^\]]+)\]\]")

#: `<sup>N</sup>` -- a footnote marker (numeric, or `*` for the two prefaces
#: that mark their sole note with an asterisk instead of a number).
_SUP = re.compile(r"<sup>([^<]+)</sup>")

#: `<br/>`, `<br />`, and one source typo, `<br//>` -- matched loosely rather
#: than pinned to a single well-formed spelling.
_BR = re.compile(r"<br\s*/{0,2}\s*>", re.IGNORECASE)

#: Any other inline HTML tag this source uses -- `<small>` (Jerome's own
#: editorial asides marking the Greek-only tail of Esther and Daniel),
#: stray `<b>` (one footnote spelling out a glyph, "eine von drei Formen: T
#: oder..."). Stripped like every other v1 markup loss; `<sup>` is carved out
#: because it still has to survive to the token-branching step below.
_OTHER_TAGS = re.compile(r"</?(?!sup\b)[a-zA-Z][^>]*>")

#: No footnote marker in this corpus is ever preceded by real whitespace in
#: the source (verified: zero of 24,958 `<sup>` tags). A wrapped verse line
#: (see `_split_verse_lines`) can start with `<sup>N</sup>` as its very first
#: token, and joining continuation lines with a space would then insert one
#: space that was never in the source and does not belong beside the marker.
_PRE_SUP_SPACE = re.compile(r"\s+(?=<sup>)")

#: `('''1''') text ... - ('''2''') text ...` -- a footnote entry. The exact
#: wording before the first marker varies ("Kap. N", "Psalm. N", "Vorrede.",
#: or nothing), so it is never matched; only the markers themselves are.
_NOTE_MARKER = re.compile(r"\('''([^']+)'''\)")

#: A nested wikitable, found only inside footnote text (verified: the outer
#: verse table always closes before `===Fußnote===` in every page this
#: scraper reads). `[^\n]*` eats the opening line's attributes.
_NESTED_TABLE = re.compile(r"\{\|[^\n]*\n(.*?)\n\|\}", re.DOTALL)

#: The final ~3 lines every page ends with, ONLY ever using the colon-less
#: `[[Kategorie:X]]` form -- unlike every inline cross-reference in the body,
#: which always carries the leading colon that turns it into a plain link. A
#: chapter's own "other chapters of this book" nav list sits just before it,
#: introduced by this exact heading (present on 1,334 of 1,339 chapters --
#: absent only for the handful of one-chapter books, where there is nothing
#: else to list, but the trailing category tags are still there).
_TRAILING_NAV_MARKERS = ("- Weitere Kapitel", "[[Kategorie:")


def _flatten_nested_table(match: re.Match[str]) -> str:
    """A small wikitable (a genealogy, a feast-day count) as flat prose.

    Seven chapters embed one of these inside a single footnote (never inside
    the verse text itself). `check_text` forbids markup/newlines in a note's
    `text`, so the table has to become a sentence rather than survive
    verbatim; nothing in it is dropped, only re-punctuated as
    "cell, cell; cell, cell"."""
    rows: list[list[str]] = [[]]
    for line in match.group(1).split("\n"):
        cell_line = line.strip()
        if not cell_line:
            continue
        if cell_line == "|-":
            rows.append([])
            continue
        if cell_line[0] in "!|":
            cell = cell_line[1:].strip()
            if cell:
                rows[-1].append(cell)
    return "; ".join(", ".join(row) for row in rows if row)


def _strip_trailing_nav(foot_text: str) -> str:
    """Cut a chapter's footnote text before the page-wide furniture that
    follows it -- the "other chapters" nav list and the trailing
    `[[Kategorie:...]]` tags -- neither of which is footnote content. Without
    this, whichever note happens to be last on the page absorbs the entire
    nav list into its `text` and fails every plain-text check at once."""
    cut_points = [
        idx
        for idx in (foot_text.find(marker) for marker in _TRAILING_NAV_MARKERS)
        if idx != -1
    ]
    return foot_text[: min(cut_points)] if cut_points else foot_text


def clean_and_mark(raw: str) -> tuple[str, str]:
    """`(text_marked, text)` from a raw wikitext fragment.

    Order matters: links are resolved to their display text first (so a
    cross-reference's `''...''` italics can be stripped along with every
    other bold/italic marker in one pass), then HTML entities are decoded,
    then `<br/>` becomes a plain space (verses already carry line breaks as
    physical newlines, handled by the caller; a `<br/>` that survives to here
    is always mid-sentence), and only then does `<sup>` branch into a
    `⟦marker⟧` token for the marked copy and nothing for the plain one."""
    s = _WIKILINK.sub(r"\1", raw)
    s = s.replace("'''", "").replace("''", "")
    s = html.unescape(s)
    s = _BR.sub(" ", s)
    s = _OTHER_TAGS.sub("", s)
    s = _PRE_SUP_SPACE.sub("", s)
    marked = _SUP.sub(lambda m: f"⟦{m.group(1)}⟧", s)
    plain = _SUP.sub("", s)
    marked = re.sub(r"\s+", " ", marked).strip()
    plain = re.sub(r"\s+", " ", plain).strip()
    return marked, plain


def split_footnotes(foot_text: str) -> dict[str, str]:
    """`{marker: raw note body}` for one chapter's `===Fußnote===` section."""
    foot_text = _strip_trailing_nav(foot_text)
    foot_text = _NESTED_TABLE.sub(_flatten_nested_table, foot_text)
    matches = list(_NOTE_MARKER.finditer(foot_text))
    notes: dict[str, str] = {}
    for i, m in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(foot_text)
        notes[m.group(1)] = foot_text[m.end() : end]
    return notes


# --------------------------------------------------------------------------
# The verse table: pipe-boundary parsing, no title regex required (see the
# module docblock -- verified structurally across the whole corpus).
# --------------------------------------------------------------------------


def _german_cell_and_intro(pre_footnote_text: str) -> tuple[str, str]:
    """`(intro, german cell)` from the text up to (not including) a chapter's
    `===Fußnote===`. `intro` is what precedes the `|-` row marker -- the
    `colspan="2"` cell that carries the chapter's summary, if any."""
    table_start = pre_footnote_text.index("{|")
    lines = pre_footnote_text[table_start:].split("\n")
    dash_idx = next(i for i, ln in enumerate(lines) if ln.strip() == "|-")
    pipe_idxs = [i for i, ln in enumerate(lines) if ln.strip() == "|" and i > dash_idx]
    close_idx = next(i for i, ln in enumerate(lines) if ln.strip() == "|}")
    german_start = pipe_idxs[1]  # pipe_idxs[0] opens the (unused) Latin cell
    intro = "\n".join(lines[:dash_idx])
    german = "\n".join(lines[german_start + 1 : close_idx])
    return intro, german


def _extract_summary(intro: str) -> str | None:
    """The chapter argument the source prints in its `<center>...</center>`
    intro cell, or None when it is blank (most `Psalm N secundum Hebrœos`
    sub-blocks) or absent.

    `NT/Hebr02.wikitext` opens a `<center>` for its summary and never closes
    it -- a genuine, isolated source defect (verified: the only one of 1,335
    single-block chapters missing its closing tag). The fallback below reads
    to the end of the intro cell instead of crashing or losing the text; no
    words are invented, only the boundary a well-formed page would have had
    is supplied where cutting off the read entirely, or letting the runaway
    tag swallow the tables that follow, would each lose or corrupt something
    real."""
    match = re.search(r"<center>(.*?)</center>", intro, re.DOTALL)
    if match is None:
        match = re.search(r"<center>(.*)", intro, re.DOTALL)
    if match is None:
        return None
    _, plain = clean_and_mark(match.group(1))
    return plain or None


_VERSE_LINE = re.compile(r"^(\d+)\.\s?(.*)$")

#: Bare wikitable syntax, for the one page where it leaks into a cell's own
#: content -- `AT/Klagel01.wikitext`'s one-row preface table prints a second,
#: empty `|-` row separator immediately before `|}` where every other block
#: in the corpus (verified across all of them) prints none. Filtering these
#: out wherever cell lines are read is cheaper and more robust than special-
#: casing that one page, and no genuine verse or preface line is ever just
#: one of these tokens.
_TABLE_SYNTAX_LINES = frozenset({"|-", "|", "|}", "{|"})


def _split_verse_lines(german_cell: str) -> list[tuple[int, str]]:
    """`[(verse number, raw joined text)]`. A verse may wrap across several
    `<br/>`-terminated physical lines (poetic stanzas); only a line that
    OPENS on a bare `N.` starts a new verse, so a continuation line -- however
    many of them -- is folded into the verse it follows with a single space,
    per docs/corpus-schema.md's line-break rule."""
    verses: list[tuple[int, str]] = []
    current_n: int | None = None
    current_parts: list[str] = []
    for raw_line in german_cell.split("\n"):
        line = _BR.sub(" ", raw_line).strip()
        if not line or line in _TABLE_SYNTAX_LINES:
            continue
        m = _VERSE_LINE.match(line)
        if m:
            if current_n is not None:
                verses.append((current_n, " ".join(current_parts)))
            current_n = int(m.group(1))
            current_parts = [m.group(2)]
        elif current_n is not None:
            current_parts.append(line)
        # else: stray text before the chapter's first verse -- none observed.
    if current_n is not None:
        verses.append((current_n, " ".join(current_parts)))
    return verses


def _build_verses(
    raw_verses: list[tuple[int, str]], notes_by_marker: dict[str, str]
) -> list[dict]:
    """Attach each verse's footnotes by matching its `<sup>` markers against
    the chapter's marker->text map, then fold in whatever markers no verse
    ever anchored -- see the module docblock, "Orphan footnotes"."""
    used_markers: set[str] = set()
    out: list[dict] = []
    for n, raw in raw_verses:
        markers_here = list(dict.fromkeys(_SUP.findall(raw)))
        marked, plain = clean_and_mark(raw)
        entry: dict = {"n": n, "text": plain}
        notes = []
        for marker in markers_here:
            body = notes_by_marker.get(marker)
            if body is None:
                continue
            used_markers.add(marker)
            _, note_text = clean_and_mark(body)
            notes.append({"marker": marker, "text": note_text})
        if notes:
            entry["text_marked"] = marked
            entry["notes"] = notes
        out.append(entry)

    orphans = [m for m in notes_by_marker if m not in used_markers]
    if orphans and out:
        first = out[0]
        first_notes = first.setdefault("notes", [])
        for marker in orphans:
            _, note_text = clean_and_mark(notes_by_marker[marker])
            first_notes.append({"marker": marker, "text": note_text})
        first.setdefault("text_marked", first["text"])
    return out


def parse_single_block(text: str) -> dict:
    """One title+table+footnote block: `{"verses": [...], "summary": str?}`.

    Used for every ordinary chapter page, and for each half of the three
    special multi-block pages (`merge_psalm_9`, `special_preface`)."""
    fussnote_idx = text.index(FUSSNOTE)
    pre, foot = text[:fussnote_idx], text[fussnote_idx + len(FUSSNOTE) :]
    intro, german_cell = _german_cell_and_intro(pre)
    summary = _extract_summary(intro)
    raw_verses = _split_verse_lines(german_cell)
    notes_by_marker = split_footnotes(foot)
    verses = _build_verses(raw_verses, notes_by_marker)
    result: dict = {"verses": verses}
    if summary:
        result["summary"] = summary
    return result


def read_page(rel_path: str) -> str:
    return (raw_dir() / rel_path).read_text(encoding="utf-8")


# --------------------------------------------------------------------------
# The three double-block pages -- see the module docblock.
# --------------------------------------------------------------------------


def merge_psalm_9() -> dict:
    """`AT/Ps09.wikitext`'s two titled blocks (Vulgate Ps. 9, then "Ps. X
    secundum Hebrœos") as one 39-verse chapter 9."""
    text = read_page("AT/Ps09.wikitext")
    marker = "=Liber Psalmorum. Psalmus X. secundum Hebrœos="
    block1_text, rest = text.split(marker)
    block2_text = marker + rest
    block1 = parse_single_block(block1_text)
    block2 = parse_single_block(block2_text)
    offset = max(v["n"] for v in block1["verses"])
    renumbered = [{**v, "n": v["n"] + offset} for v in block2["verses"]]
    chapter: dict = {"n": 9, "verses": block1["verses"] + renumbered}
    # block2's own <center> is blank on this page; block1's carries the
    # combined argument for both halves of the Vulgate's Psalm 9.
    if block1.get("summary"):
        chapter["summary"] = block1["summary"]
    return chapter


def _preface_heading(prose_block_text: str) -> dict:
    """An unnumbered preface block (no verse numbers at all) as a `headings`
    entry anchored `before_verse: 1` -- see the module docblock."""
    fussnote_idx = prose_block_text.index(FUSSNOTE)
    pre, foot = (
        prose_block_text[:fussnote_idx],
        prose_block_text[fussnote_idx + len(FUSSNOTE) :],
    )
    _, german_cell = _german_cell_and_intro(pre)
    lines = [
        cleaned
        for raw_line in german_cell.split("\n")
        if (cleaned := _BR.sub(" ", raw_line).strip())
        and cleaned not in _TABLE_SYNTAX_LINES
    ]
    raw_prose = " ".join(lines)
    notes_by_marker = split_footnotes(foot)
    markers_here = list(dict.fromkeys(_SUP.findall(raw_prose)))
    marked, plain = clean_and_mark(raw_prose)
    heading: dict = {"before_verse": 1, "level": 4, "text": plain}
    notes = []
    for marker in markers_here:
        body = notes_by_marker.get(marker)
        if body is None:
            continue
        _, note_text = clean_and_mark(body)
        notes.append({"marker": marker, "text": note_text})
    if notes:
        heading["text_marked"] = marked
        heading["notes"] = notes
    return heading


def special_preface(rel_path: str, split_marker: str, chapter_n: int) -> dict:
    """A page whose first block is an unnumbered book/translator's preface and
    whose second is the chapter proper -- `AT/JSir01.wikitext` (Sirach's
    prologue) and `AT/Klagel01.wikitext` (Lamentations' editorial foreword)."""
    text = read_page(rel_path)
    preface_text, rest = text.split(split_marker)
    chapter_text = split_marker + rest
    heading = _preface_heading(preface_text)
    result = parse_single_block(chapter_text)
    chapter: dict = {"n": chapter_n, "verses": result["verses"], "headings": [heading]}
    if result.get("summary"):
        chapter["summary"] = result["summary"]
    return chapter


#: (osis, chapter n) -> a 0-argument builder, for the pages that cannot go
#: through the ordinary one-block-per-file path.
_SPECIAL_CHAPTERS = {
    ("sir", 1): lambda: special_preface(
        "AT/JSir01.wikitext", "=Ecclesiasticus. Caput I.=", 1
    ),
    ("lam", 1): lambda: special_preface(
        "AT/Klagel01.wikitext",
        "=Threni, id est lamentationes Jeremiæ prophetæ. Caput I.=",
        1,
    ),
    ("ps", 9): merge_psalm_9,
}


# --------------------------------------------------------------------------
# Book assembly
# --------------------------------------------------------------------------


def build_book(
    osis: str, name: str, source_dir: str, prefix: str, n_chapters: int, order: int
) -> dict:
    chapters = []
    for n in range(1, n_chapters + 1):
        special = _SPECIAL_CHAPTERS.get((osis, n))
        if special is not None:
            chapter = special()
        else:
            text = read_page(f"{source_dir}/{prefix}{n:02d}.wikitext")
            result = parse_single_block(text)
            chapter = {"n": n, "verses": result["verses"]}
            if result.get("summary"):
                chapter["summary"] = result["summary"]
        chapters.append(chapter)
    return {
        "osis": osis,
        "name": name,
        "abbrevs": abbrevs_for(osis, prefix),
        "order": order,
        "chapters": chapters,
    }


def run_scrape(sample: bool) -> list[dict]:
    book_docs = []
    for order, (osis, name, source_dir, prefix, n_chapters) in enumerate(BOOKS, 1):
        if sample and osis not in SAMPLE_BOOKS:
            continue
        book = build_book(osis, name, source_dir, prefix, n_chapters, order)
        if sample and osis == "john":
            book["chapters"] = [
                c for c in book["chapters"] if c["n"] in SAMPLE_JOHN_CHAPTERS
            ]
        book_docs.append(book)
    return book_docs


# --------------------------------------------------------------------------
# Validation -- this scraper's own claims about ITS source, on top of what
# `edition_check.py` already asserts about every Bible edition.
# --------------------------------------------------------------------------


def validate(book_docs: list[dict], sample: bool) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    def fail(msg: str) -> None:
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    if not sample:
        if len(book_docs) != 73:
            fail(f"expected 73 books, got {len(book_docs)}")
        expected_n = {osis: n for osis, _, _, _, n in BOOKS}
        for book in book_docs:
            want = expected_n[book["osis"]]
            got = len(book["chapters"])
            if got != want:
                fail(f"{book['osis']}: expected {want} chapters, got {got}")

    ps9 = next(
        (b for b in book_docs if b["osis"] == "ps"),
        None,
    )
    if ps9 is not None:
        ch9 = next((c for c in ps9["chapters"] if c["n"] == 9), None)
        if ch9 is not None and len(ch9["verses"]) != 39:
            fail(
                f"ps 9: expected 39 verses (the merged Vulgate Ps. 9 + "
                f"'secundum Hebrœos' block), got {len(ch9['verses'])}"
            )

    for book in book_docs:
        osis = book["osis"]
        for chap in book["chapters"]:
            if not chap["verses"]:
                fail(f"{osis} {chap['n']}: no verses")
                continue
            opening = chapter_opening_letter(chap["verses"][0]["text"])
            if opening is not None and opening.islower():
                fail(
                    f"{osis} {chap['n']}:{chap['verses'][0]['n']}: chapter opens on "
                    f"lowercase {opening!r} -- likely a lost capital in the source; "
                    "adjudicate into pipeline/corrections/ rather than editing text"
                )

    return ok, report


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def census(book_docs: list[dict]) -> dict[str, int]:
    verses = notes = summaries = headings = marked = 0
    for book in book_docs:
        for chap in book["chapters"]:
            summaries += 1 if chap.get("summary") else 0
            headings += len(chap.get("headings") or [])
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                notes += len(unit.get("notes") or [])
                marked += 1 if unit.get("text_marked") else 0
            verses += len(chap["verses"])
    return {
        "books": len(book_docs),
        "chapters": sum(len(b["chapters"]) for b in book_docs),
        "verses": verses,
        "notes": notes,
        "units_with_apparatus": marked,
        "chapter_summaries": summaries,
        "headings": headings,
    }


def print_summary(counts: dict[str, int]) -> None:
    print()
    for key, value in counts.items():
        print(f"  {key.replace('_', ' '):<22} {value:>7}")


def retrieved_at() -> str:
    """The day `raw/allioli/` was actually captured, from the fetcher's own
    ledger -- never today, since a re-parse touches no network at all."""
    return (
        captured_at(raw_dir() / "AT/1Mos01.wikitext")
        or datetime.now(UTC).date().isoformat()
    )


def write_output(
    book_docs: list[dict],
    *,
    sample: bool,
    receipt: dict,
    generated_at: str,
) -> None:
    if sample_run_writes_nothing(sample):
        return
    notes = (
        "Allioli-Arndt: Joseph Franz von Allioli's German Vulgate translation "
        "(1830-34), revised with Augustin Arndt's new annotations (Leo XIII's "
        "permission 1894, new notes approved 1897 for the New Testament and "
        "subsequently the Old), further revised 1914. Public domain since "
        "1988 (Arndt died 1917). Source: vulgata.info, a MediaWiki mirror "
        "presenting the Clementine Latin beside the Allioli-Arndt German in "
        "one two-column table per chapter; only the German column is this "
        "work's text. Footnote markers restart at 1 per CHAPTER rather than "
        "per verse, unlike bible.douay-rheims.en. Two chapters share their "
        "page with an unnumbered preface with no verse of its own -- Sirach's "
        "translator's prologue and an editorial foreword to Lamentations -- "
        "captured as a `headings` entry at before_verse 1 rather than "
        "invented as a fake verse 0 (see this scraper's module docblock). "
        "Vulgate Psalm 9 is printed across two titled blocks on one page "
        "(the Hebrew/Masoretic Psalms 9 and 10); they are concatenated into "
        "one 39-verse chapter 9, the second block renumbered 22-39. Four "
        "footnote markers across the whole edition anchor inside a chapter's "
        "own German title line rather than any verse (a Hebrew-title gloss, "
        "a 'Hebrew numbering' aside, a Gospel superscription); since no "
        "content field stores chapter titles, each is filed unanchored "
        "against the chapter's first verse, per the schema's own rule for a "
        "note the source prints with no anchor. book-intro.de (59 per-book "
        "introduction essays, in raw/allioli/front/book-intro/) is not built "
        "here -- book introductions are a separate work, keyed by language, "
        "not edition."
    )
    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Biblia Sacra (Allioli-Arndt)",
        "short_title": "Allioli-Arndt",
        "language": "de",
        "edition": "Allioli-Arndt revision, 1830-34, revised 1914",
        "sources": [{"url": SOURCE_URL, "retrieved_at": retrieved_at()}],
        "copyright": {"status": "public-domain", "holder": None, "notice": None},
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
        "corrections_applied": receipt["count"],
    }

    write_stamped_json(
        work_dir(),
        {
            "manifest.json": manifest,
            "corrections-applied.json": receipt,
            **{f"books/{b['osis']}.json": b for b in book_docs},
        },
        generated_at,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Only parse Philemon (complete) and John (chapters 1-3) for review.",
    )
    args = parser.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    book_docs = run_scrape(sample=args.sample)
    counts = census(book_docs)
    print_summary(counts)

    ok, report = validate(book_docs, sample=args.sample)
    print()
    for line in report:
        print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    if not ok:
        print("\nRefusing to write a work that failed validation.", file=sys.stderr)
        return 1

    # No filed corrections yet -- this layer is exercised for its drift guard
    # and its receipt file, same as cpdv.py with a clean source.
    corrections = load_corrections(WORK_ID)
    try:
        applied, _seen = apply_verse_corrections(
            ((b["osis"], b["chapters"]) for b in book_docs),
            corrections,
            full_run=not args.sample,
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = corrections_receipt(WORK_ID, applied, corrections, generated_at)
    print(
        f"\nCorrections layer: {receipt['count']} applied, "
        f"{len(receipt['unresolved'])} documented unresolved/not-a-defect "
        "(see corrections-applied.json)"
    )

    write_output(
        book_docs, sample=args.sample, receipt=receipt, generated_at=generated_at
    )
    if not args.sample:
        print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
