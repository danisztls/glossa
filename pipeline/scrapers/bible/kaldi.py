#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The Kaldi-Tarkanyi Hungarian Catholic Bible, parsed from an already-captured
source -- `bible.kaldi.hu`.

NO NETWORKING HAPPENS HERE. `pipeline/scrapers/bible/capture.py` already
fetched every page biblia.kapisztran.info serves (`inventories/kaldi.json`,
225 pages, 2026-08-28) into `raw/kaldi/`, which is write-once: this file only
reads it. Re-parsing costs nothing and touches nobody's server
(docs/link-surface.md's "re-parse, never re-crawl").

THE SOURCE. biblia.kapisztran.info is a GitLab Pages mirror of the Kaldi
Gyorgy translation (1626) as revised a third time by Tarkanyi Bela for the
Eger edition (1865, "Az Apostoli Szek jovahagyasaval") -- the Hungarian
Catholic Bible in general use until the 1973 translation. Public domain. Each
of the 73 canonical books has three sibling pages under `/{slug}/`:
`szoveg.html` (the whole book's text -- this is the only one this scraper
reads), `jegyzet.html` (concise per-verse notes) and `jegyzet2.html` (extended
verse-by-verse commentary, "kommentarjai"). See "The apparatus decision"
below for why the latter two are not ingested yet.

THE MARKUP is Word-exported HTML (the same idiom `ccc.py`'s `pt` reader
meets): a chapter is a bordered `<div>` around `<p class=fejezet>` (its
title), verses are `<p class=vers>` (a printed locator, e.g. "1 Móz. 1,1")
paired with `<p class=MsoNormal>` (the text). All three sibling pages share
one anchor scheme -- `<a name="{bb}:{ccc}.{vvv}">` at verse level,
`<a name="{bb}:{ccc}">` at chapter level -- where `bb` is a POSITIONAL book
number 01-73 in Vulgate order (Genesis=01, Tobit=17, Esther=19, Baruch=32,
Matthew=47, Revelation=73), not the URL slug. Chapter/verse identity is taken
from these anchors, never from document order or the printed locator text
(see "Verse numbers as printed, not as positioned" below for why).

BOOK NAMES are read out of `tartalom.html` (the site's own index page) rather
than retyped, because they are Douay-style and easy to mistranscribe --
"Királyok (Sámuel) I. könyve", "Királyok III. (I.) könyve", "Mózes I. könyve.
Genezis". `BOOKS` below supplies only what the source cannot: the OSIS code
and the slug, in docs/corpus-schema.md's canonical order.

THE APPARATUS DECISION. `jegyzet.html` and `jegyzet2.html` are NOT ingested
by this run -- carried as an explicit, documented deferral rather than
silently dropped. The schema has one `notes` field per verse and this source
prints TWO registers of note (concise vs. "kommentárjai", materially longer
and more discursive) -- the same shape of question the Latin Catechism's two
sigla tables posed, which CLAUDE.md records was settled by what the sources
actually are, not by argument in the abstract. `jegyzet.html` alone is not a
one-line follow-up either: a verse may carry SEVERAL note paragraphs before
the one that finally carries the shared verse anchor (anchoring is N:1,
opposite of the CCC's 1:1 rule), which wants its own design pass. RECOMMENDED
SHAPE for that follow-up: carry `jegyzet` (concise) as this edition's
`notes`, and treat `jegyzet2` (commentary-length) as a separate enrichment
rather than folding it into the same field -- but that is a recommendation
for the next scraper to implement, not something this run does. Both pages
are already captured in `raw/kaldi/` and cost nothing to revisit.

VERSE NUMBERS AS PRINTED, NOT AS POSITIONED. Verses are collected into a
`{n: text}` mapping per chapter, keyed by each verse's own anchor number, and
only sorted into the final array at the end -- document order is NOT trusted.
Ten verses across the corpus print/anchor a locator that puts them out of
sequence (e.g. `1 Sám 30,4` appearing physically after `1 Sám 30,13`); in
every one of the ten, the verse's own words match the Clementine Vulgate
verse its own printed number names, so the fix is to stop assuming document
order is verse order, not to touch the text. Four of those ten also have the
NUMBER itself wrong (`1 Sám 15,43` for content that is verse 34; `3 Móz.
18,35` for verse 25; `Lk 23,61` for verse 6; `Zsolt 99,46` for verse 4) --
plausible transcription digit-transpositions/insertions, each verified
against `bible.clementina.la` and corrected per
`pipeline/corrections/bible.kaldi.hu.json`.

THE PSALM 9/10 LANDMINE. After the 21 anchored verses of `Zsolt 9`, the
source inserts an unanchored sub-heading, "Zsolt 10. A ZSIDÓK SZERINT."
("Psalm 10, according to the Hebrews") -- a supplementary translation of the
separately-numbered Hebrew Psalm 10, which the Vulgate/Septuagint count as
the back half of Psalm 9. It prints 18 verses; the first 8 carry NO anchor at
all, and the other 10 are anchored `23:010.009`-`.018`, IN THE FILE BEFORE
the real "Zsolt 10" chapter div's own verses, which are anchored
`23:010.001`-`.008`. This is a one-off site artifact (it happens exactly once
in the whole Psalter) and is EXCLUDED from `books/ps.json` entirely: it is a
real Hungarian translation of real Hebrew-numbering Psalm 10, but it is not
Vulgate scripture, it has no address that does not either invent a chapter
(9.5) or collide with the real "Zsolt 10", and the schema's `headings` field
is a label, not a home for an 18-verse block. `raw/kaldi/` keeps every byte,
so nothing is lost -- only unaddressed for now. Vulgate Psalm 9 in this
edition is therefore the 21 anchored verses of `Zsolt 9`, not 39.

SIRACH'S PROLOGUE, anchored `28:000.001`-`.011` ("Sír ELŐBESZÉD."), is
dropped the same way and for a related reason: chapter 0 is schema-reserved
for `bible-intro.{lang}/intros.json` (docs/corpus-schema.md), and no other
book in this source prints one. Folding an 11-verse foreword into `sir.json`
under a borrowed chapter number would make it indistinguishable from
scripture to every consumer that reads chapter numbers off that file.

Usage:
    python3 pipeline/scrapers/bible/kaldi.py              # full 73-book run
    python3 pipeline/scrapers/bible/kaldi.py --sample     # Genesis + Philemon only

No `--offline`/`--refresh`: there is no network path in this file at all.
"""

from __future__ import annotations

import argparse
import html as ihtml
import re
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line sits
# above the imports rather than the imports being at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    FIELD_VERSE_DUPLICATE,
    FIELD_VERSE_NUMBER,
    CorrectionDriftError,
    build_root,
    captured_at,
    filed,
    load_corrections,
    raw_root,
    require_all_applied,
    require_corpus,
    write_stamped_json,
)

RAW_SUBDIR = "kaldi"
WORK_ID = "bible.kaldi.hu"
BASE_URL = "https://biblia.kapisztran.info/"


def raw_dir() -> Path:
    """This source's captured pages. A function, not a constant -- see cpdv.py."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


# (osis, slug) in docs/corpus-schema.md's canonical 73-book order. Display
# names are NOT retyped here -- they come out of tartalom.html at parse time
# (see `book_names_from_index`), because they are Douay-style and easy to get
# wrong by hand ("Királyok (Sámuel) I. könyve", "Királyok III. (I.) könyve").
BOOKS: list[tuple[str, str]] = [
    # OT (46)
    ("gen", "1moz"),
    ("exod", "2moz"),
    ("lev", "3moz"),
    ("num", "4moz"),
    ("deut", "5moz"),
    ("josh", "jozs"),
    ("judg", "bir"),
    ("ruth", "rut"),
    ("1sam", "1sam"),
    ("2sam", "2sam"),
    ("1kgs", "1kir"),
    ("2kgs", "2kir"),
    ("1chr", "1kron"),
    ("2chr", "2kron"),
    ("ezra", "ezd"),
    ("neh", "neh"),
    ("tob", "tob"),
    ("jdt", "jud"),
    ("esth", "eszt"),
    ("1macc", "1mak"),
    ("2macc", "2mak"),
    ("job", "job"),
    ("ps", "zsolt"),
    ("prov", "peld"),
    ("eccl", "pred"),
    ("song", "en"),
    ("wis", "bolcs"),
    ("sir", "sir"),
    ("isa", "iz"),
    ("jer", "jer"),
    ("lam", "siral"),
    ("bar", "bar"),
    ("ezek", "ez"),
    ("dan", "dan"),
    ("hos", "oz"),
    ("joel", "jo"),
    ("amos", "am"),
    ("obad", "abd"),
    ("jonah", "jon"),
    ("mic", "mik"),
    ("nah", "nah"),
    ("hab", "hab"),
    ("zeph", "szof"),
    ("hag", "ag"),
    ("zech", "zak"),
    ("mal", "mal"),
    # NT (27)
    ("matt", "mt"),
    ("mark", "mk"),
    ("luke", "lk"),
    ("john", "jn"),
    ("acts", "apcsel"),
    ("rom", "rom"),
    ("1cor", "1kor"),
    ("2cor", "2kor"),
    ("gal", "gal"),
    ("eph", "ef"),
    ("phil", "fil"),
    ("col", "kol"),
    ("1thess", "1tessz"),
    ("2thess", "2tessz"),
    ("1tim", "1tim"),
    ("2tim", "2tim"),
    ("titus", "tit"),
    ("phlm", "filem"),
    ("heb", "zsid"),
    ("jas", "jak"),
    ("1pet", "1pet"),
    ("2pet", "2pet"),
    ("1john", "1jn"),
    ("2john", "2jn"),
    ("3john", "3jn"),
    ("jude", "ju"),
    ("rev", "jel"),
]

assert len(BOOKS) == 73, f"expected 73 books in BOOKS table, got {len(BOOKS)}"

#: Known chapter counts, for sanity-checking a full (untruncated) run. The
#: first five are this task's own litmus checks; `gen`/`phlm` cover `--sample`.
KNOWN_CHAPTER_COUNTS = {
    "esth": 16,
    "bar": 6,
    "tob": 14,
    "sir": 51,
    "ps": 150,
    "gen": 50,
    "phlm": 1,
}

SAMPLE_OSIS = {"gen", "phlm"}


@dataclass
class Anomaly:
    osis: str
    detail: str
    fatal: bool = False


# --------------------------------------------------------------------------
# Reading the source
# --------------------------------------------------------------------------


def read_page(slug: str, name: str) -> str:
    return (raw_dir() / slug / name).read_text(encoding="utf-8")


_INDEX_LINK_RE = re.compile(
    r'<a href="(?P<slug>[a-z0-9]+)/szoveg\.html"[^>]*>(?P<name>[^<]+)</a>'
)


def book_names_from_index(html_text: str) -> dict[str, str]:
    """`slug -> display name`, read verbatim off `tartalom.html`.

    Read rather than retyped: the printed names are Douay-style and the
    surest way to introduce a defect here would be a hand-copied table
    disagreeing with the source by one word.
    """
    out: dict[str, str] = {}
    for m in _INDEX_LINK_RE.finditer(html_text):
        out[m.group("slug")] = ihtml.unescape(m.group("name")).strip()
    return out


# --------------------------------------------------------------------------
# Parsing one book's szoveg.html
# --------------------------------------------------------------------------

#: One `<p class=TAG ...>...</p>` at a time, in document order. `TAG` is
#: captured so the walk below can dispatch on it; `attrs` so it can tell the
#: "Jegyzet"/"Jegyzet 2" link paragraphs (`align=center`) apart from a real
#: chapter title, which shares the same class.
_BLOCK_RE = re.compile(r"<p class=(fejezet|vers|MsoNormal)([^>]*)>(.*?)</p>", re.DOTALL)
_CHAP_ANCHOR_RE = re.compile(r'^\s*<a name="(\d+):(\d+)"></a>')
_VERSE_ANCHOR_RE = re.compile(r'^\s*<a name="(\d+):(\d+)\.(\d+)"></a>')
#: The trailing ", N" a printed locator always ends in (e.g. "1 Sám 30,4"),
#: used only as a fallback when a `<p class=vers>` carries no anchor at all.
_LOCATOR_VERSE_RE = re.compile(r",\s*(\d+)\s*$")

#: A cross-reference bracket: `[Zsolt. 32,6. Sirák 18,1.]`, almost always
#: built from `<span class=biblink>` fragments but occasionally (3 verses)
#: plain text ("[Lásd 13. v.]", "see verse 13"). The schema has no
#: cross-reference field (docs/corpus-schema.md, "Bible book files"), so
#: these are stripped rather than stored; the running total this scraper
#: prints is so a later schema decision has a real number to work from.
#: Verified corpus-wide that "[" and "]" are balanced except for two verses
#: in Mark (handled below), so non-nested `[^\[\]]*` is safe.
_BRACKET_RE = re.compile(r"\[[^\[\]]*\]")

#: A cross-reference the source prints with NO enclosing brackets at all
#: (one verse in the whole corpus -- a bare "Zsolt. 104,27." at a sentence's
#: end). Recognised by the same `class=biblink` markup, and only when it runs
#: to the end of the paragraph: a `biblink` span embedded mid-sentence is a
#: different, uncorrected defect (mistagged proper names -- see this
#: scraper's docstring companion report and `ANOMALIES`).
_TRAILING_BIBLINK_RE = re.compile(r"(?:<span class=biblink>[^<]*</span>[.,;\s]*)+$")


def _strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = ihtml.unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean_block_text(inner_html: str) -> tuple[str, int]:
    """A `<p class=vers|MsoNormal>`'s inner HTML, reduced to schema-legal
    plain text, and the number of cross-references stripped out of it.

    Order matters: cross-references are recognised and removed while the
    markup is still present (a bracket group's own `biblink` spans are how a
    bracket with no citation prose in it -- "[11. v.]" -- is still counted as
    one reference rather than zero), and only THEN are the remaining tags
    dropped.
    """
    xrefs = 0

    def _bracket_repl(m: re.Match[str]) -> str:
        nonlocal xrefs
        xrefs += max(m.group(0).count("class=biblink"), 1)
        return ""

    html_text = _BRACKET_RE.sub(_bracket_repl, inner_html)

    # The two Mark verses whose bracket is never closed with "]" (one closes
    # with ")" instead, one is not closed at all -- both are genuine
    # cross-references sitting at the very end of their sentence, so
    # truncating from the stray "[" onward drops only the malformed
    # apparatus, not any of the verse's own words). Flagged for correction
    # filing by the caller via the returned count, not fixed at the byte level.
    if "[" in html_text:
        idx = html_text.index("[")
        xrefs += max(html_text[idx:].count("class=biblink"), 1)
        html_text = html_text[:idx]

    def _trailing_repl(m: re.Match[str]) -> str:
        nonlocal xrefs
        xrefs += m.group(0).count("class=biblink")
        return ""

    html_text = _TRAILING_BIBLINK_RE.sub(_trailing_repl, html_text)

    return _strip_html(html_text), xrefs


@dataclass
class ParsedChapter:
    n: int
    summary: str | None = None
    headings: list[dict] = field(default_factory=list)
    verses: dict[int, str] = field(default_factory=dict)
    #: Text from a SECOND `<p class=vers>` anchored/printed to a number this
    #: chapter already has (docstring, "Verse numbers as printed"). Kept
    #: rather than discarded so a filed `verse_duplicate` correction can
    #: promote it to the verse it actually belongs to; anything left here
    #: after corrections run is a duplicate paragraph with no verified home
    #: and is reported, not written.
    duplicate_verses: dict[int, list[str]] = field(default_factory=dict)


@dataclass
class ParsedBook:
    osis: str
    slug: str
    chapters: dict[int, ParsedChapter] = field(default_factory=dict)
    xrefs_stripped: int = 0
    dropped_prologue_verses: int = 0  # Sirach's chapter-0 foreword
    dropped_appendix_verses: int = 0  # the Psalm 9/10 seam, zsolt only


def parse_book(osis: str, html_text: str, anomalies: list[Anomaly]) -> ParsedBook:
    body = html_text.split("<div class=Section1>", 1)[-1]
    book = ParsedBook(osis=osis, slug=osis)

    cur: ParsedChapter | None = None
    seen_first_chapter_title = False
    skipping = False  # inside the excluded Psalm-9/10 appendix
    dropping_zero = False  # inside Sirach's dropped chapter-0 prologue
    expect_verse: tuple[int, int] | None = None  # (chapter, verse) awaiting its text
    pending_orphans: list[str] = []  # heading/summary candidates awaiting a verse

    def flush_orphans(before_verse: int) -> None:
        nonlocal pending_orphans
        if not pending_orphans or cur is None:
            return
        if before_verse == 1 and cur.summary is None and not cur.verses:
            cur.summary = pending_orphans[0]
            rest = pending_orphans[1:]
        else:
            rest = pending_orphans
        for text in rest:
            cur.headings.append({"before_verse": before_verse, "text": text})
        pending_orphans = []

    for m in _BLOCK_RE.finditer(body):
        cls, attrs, inner = m.group(1), m.group(2), m.group(3)

        if cls == "fejezet":
            if "align=center" in attrs:
                continue  # the "Jegyzet"/"Jegyzet 2" links -- not a chapter
            has_anchor = bool(_CHAP_ANCHOR_RE.match(inner))
            if not has_anchor and seen_first_chapter_title:
                # The one-off Psalm 9/10 appendix landmine -- see docstring.
                # Verified unique to zsolt across all 73 books.
                skipping = True
                anomalies.append(
                    Anomaly(
                        osis,
                        "excluded an anchorless sub-heading beyond the book's "
                        "own first chapter title (the Psalm 9/10 'A ZSIDOK "
                        "SZERINT' appendix) -- see manifest notes",
                    )
                )
                continue
            skipping = False
            if pending_orphans and seen_first_chapter_title:
                # Genuinely stranded: text collected since the PREVIOUS
                # chapter's last verse, with no verse of its own chapter left
                # to attach to. Left alone (not dropped here) when this is
                # the book's FIRST chapter division: pending_orphans in that
                # case is book-level front matter printed before chapter 1
                # even starts (Lamentations' "And it came to pass...Jeremiah
                # sat weeping" preface, between the Jegyzet links and "Siralm
                # 1") and belongs to chapter 1 as its summary, not to nothing.
                anomalies.append(
                    Anomaly(
                        osis,
                        f"{len(pending_orphans)} trailing heading candidate(s) "
                        f"at the end of chapter {cur.n if cur else '?'} had no "
                        "following verse to attach to -- dropped",
                    )
                )
                pending_orphans = []
            seen_first_chapter_title = True
            if cur is not None:
                book.chapters[cur.n] = cur
            cur = None  # created once the first verse anchor names the chapter
            dropping_zero = False
            expect_verse = None
            continue

        if skipping:
            if cls == "MsoNormal":
                book.dropped_appendix_verses += 1
            continue

        if cls == "vers":
            vm = _VERSE_ANCHOR_RE.match(inner)
            if vm is not None:
                ccc, vvv = int(vm.group(2)), int(vm.group(3))
            else:
                # No anchor at all -- a handful of verses (each one half of a
                # pair the Word export duplicated; see this scraper's report)
                # print a bare locator with none. The chapter is whatever
                # chapter is already open (a chapter boundary is always
                # marked by its own fejezet div, anchored or not), and the
                # verse number is read off the printed locator text itself,
                # e.g. "1 Sám 30,4" -> 4.
                text = _strip_html(inner)
                lm = _LOCATOR_VERSE_RE.search(text)
                if cur is None or lm is None:
                    anomalies.append(
                        Anomaly(
                            osis,
                            "a <p class=vers> has no anchor and no chapter "
                            f"context/parseable locator: {inner[:60]!r}",
                            fatal=True,
                        )
                    )
                    expect_verse = None
                    continue
                ccc, vvv = cur.n, int(lm.group(1))
            if ccc == 0:
                # Sirach's dropped prologue (docstring) -- chapter 0 is
                # schema-reserved for bible-intro.
                dropping_zero = True
                expect_verse = None
                continue
            dropping_zero = False
            if cur is None:
                cur = ParsedChapter(n=ccc)
            elif cur.n != ccc:
                anomalies.append(
                    Anomaly(
                        osis,
                        f"chapter title started {cur.n} but a verse anchors to "
                        f"{ccc} -- dropping this verse rather than guessing "
                        "which chapter owns it",
                        fatal=True,
                    )
                )
                expect_verse = None
                continue
            flush_orphans(vvv)
            expect_verse = (ccc, vvv)
            continue

        if cls == "MsoNormal":
            text, xrefs = clean_block_text(inner)
            book.xrefs_stripped += xrefs
            if dropping_zero:
                if text:
                    book.dropped_prologue_verses += 1
                continue
            if not text:
                continue
            if expect_verse is not None:
                chap_n, verse_n = expect_verse
                if cur is None or cur.n != chap_n:
                    anomalies.append(
                        Anomaly(
                            osis,
                            f"lost track of chapter {chap_n} verse {verse_n}'s text",
                            fatal=True,
                        )
                    )
                elif verse_n in cur.verses:
                    cur.duplicate_verses.setdefault(verse_n, []).append(text)
                    anomalies.append(
                        Anomaly(
                            osis,
                            f"{chap_n}:{verse_n} anchored/printed twice -- "
                            "keeping the first occurrence; the second is held "
                            "for a possible verse_duplicate correction",
                        )
                    )
                else:
                    cur.verses[verse_n] = text
                expect_verse = None
            else:
                # A chapter-summary/heading candidate. `cur` may still be
                # None here (the fejezet div just started a new chapter, but
                # the chapter object itself isn't created until the first
                # `vers` tag names it -- see the `vers` arm above), so this
                # is buffered regardless and only resolved once `cur` exists,
                # by `flush_orphans` at that first `vers` tag.
                pending_orphans.append(text)
            continue

    if pending_orphans and cur is not None:
        anomalies.append(
            Anomaly(
                osis,
                f"{len(pending_orphans)} trailing heading candidate(s) at the "
                f"end of chapter {cur.n} had no following verse -- dropped",
            )
        )
    if cur is not None:
        book.chapters[cur.n] = cur

    return book


# --------------------------------------------------------------------------
# Verse-number corrections (docs/decisions.md "Corrections and overrides")
#
# These fix the printed/anchored VERSE NUMBER, not verse text, so they do not
# fit `common.apply_verse_corrections` (which only ever edits `text`) and get
# their own small applier here -- the same reasoning `douay_rheims.py` gives
# for its note-scoped and segment-scoped corrections living beside it rather
# than in `common`.
# --------------------------------------------------------------------------


def apply_verse_number_corrections(
    books: dict[str, ParsedBook], corrections: list[dict], full_run: bool
) -> list[dict]:
    applied: list[dict] = []
    seen_ids: set[str] = set()
    for c in filed(corrections, FIELD_VERSE_NUMBER):
        loc = c["locator"]
        book = books.get(loc["osis"])
        if book is None:
            continue  # this book is out of scope for this run (e.g. --sample)
        chapter = book.chapters.get(loc["chapter"])
        frm, to = int(c["from"]), int(c["to"])
        if chapter is None or frm not in chapter.verses:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: expected verse {frm} not found at "
                f"{loc['osis']} {loc['chapter']} (source drift -- re-verify "
                "against raw/kaldi/ and update or remove it)"
            )
        if to in chapter.verses:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: target verse {to} already exists at "
                f"{loc['osis']} {loc['chapter']} -- would overwrite a real verse"
            )
        chapter.verses[to] = chapter.verses.pop(frm)
        applied.append(dict(c))
        seen_ids.add(c["id"])

    if full_run:
        require_all_applied(
            corrections, seen_ids, field=FIELD_VERSE_NUMBER, source="raw/kaldi/"
        )
    return applied


def apply_verse_duplicate_corrections(
    books: dict[str, ParsedBook], corrections: list[dict], full_run: bool
) -> list[dict]:
    """Promote a held-back SECOND occurrence of a colliding verse number
    (`ParsedChapter.duplicate_verses`) to the verse it actually belongs to.

    Distinct from `apply_verse_number_corrections`: that one relabels a
    verse's ONLY occurrence; this one recovers the loser of a collision the
    parser already logged as an anomaly and would otherwise discard for
    good. `from` is the printed/anchored number both occurrences shared,
    `to` is where the second one belongs.
    """
    applied: list[dict] = []
    seen_ids: set[str] = set()
    for c in filed(corrections, FIELD_VERSE_DUPLICATE):
        loc = c["locator"]
        book = books.get(loc["osis"])
        if book is None:
            continue  # out of scope for this run (e.g. --sample)
        chapter = book.chapters.get(loc["chapter"])
        frm, to = int(c["from"]), int(c["to"])
        held = chapter.duplicate_verses.get(frm) if chapter else None
        if not held:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: no held duplicate at verse {frm} in "
                f"{loc['osis']} {loc['chapter']} (source drift -- re-verify "
                "against raw/kaldi/ and update or remove it)"
            )
        if to in chapter.verses:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: target verse {to} already exists at "
                f"{loc['osis']} {loc['chapter']} -- would overwrite a real verse"
            )
        chapter.verses[to] = held.pop(0)
        applied.append(dict(c))
        seen_ids.add(c["id"])

    if full_run:
        require_all_applied(
            corrections, seen_ids, field=FIELD_VERSE_DUPLICATE, source="raw/kaldi/"
        )
    return applied


# --------------------------------------------------------------------------
# Abbreviations
# --------------------------------------------------------------------------

_TITLE_TAIL_RE = re.compile(r"\s*(?:\d+|EGY RÉSZ\.?|ELŐBESZÉD\.?)\s*$")


def source_abbrev(title_text: str) -> str | None:
    """The book's own locator prefix, e.g. 'Zsolt' from 'Zsolt 2', '1 Sám'
    from '1 Sám 15'. Best-effort: a title with neither a trailing number nor
    one of the two known non-numbered tails yields None, which is fine --
    edition_check.py treats a book with no abbrevs as a note, not an error;
    the jump box degrades to the full name."""
    if not title_text or not _TITLE_TAIL_RE.search(title_text):
        return None
    stripped = _TITLE_TAIL_RE.sub("", title_text).strip()
    return stripped or None


def abbrev_hint_for(html_text: str) -> str | None:
    """A source-printed abbreviation, read from whichever chapter's own
    fejezet title parses as a plain "<name> <number>" -- almost always
    chapter 1, but a single-chapter book's chapter 1 title reads "EGY RÉSZ."
    instead of a number, so later chapters (if any) are tried too."""
    for m in re.finditer(
        r"<p class=fejezet(?: align=center[^>]*)?>(.*?)</p>", html_text, re.DOTALL
    ):
        text = _strip_html(m.group(1))
        candidate = source_abbrev(text)
        if candidate:
            return candidate
    return None


def abbrevs_for(osis: str, name: str, abbrev_hint: str | None) -> list[str]:
    bare = re.sub(r"\s*\([^)]*\)", "", name)
    seen: list[str] = []
    for candidate in (
        osis,
        bare.lower().replace(" ", "").replace(".", ""),
        (abbrev_hint or "").lower().replace(" ", "").replace(".", ""),
    ):
        if candidate and candidate not in seen:
            seen.append(candidate)
    return seen


# --------------------------------------------------------------------------
# Assembly and validation
# --------------------------------------------------------------------------


def finalize_book(
    book: ParsedBook, name: str, order: int, abbrev_hint: str | None
) -> dict:
    chapters_out = []
    for n in sorted(book.chapters):
        ch = book.chapters[n]
        entry: dict = {
            "n": n,
            "verses": [{"n": v, "text": t} for v, t in sorted(ch.verses.items())],
        }
        if ch.summary:
            entry["summary"] = ch.summary
        if ch.headings:
            entry["headings"] = ch.headings
        chapters_out.append(entry)
    return {
        "osis": book.osis,
        "name": name,
        "abbrevs": abbrevs_for(book.osis, name, abbrev_hint),
        "order": order,
        "chapters": chapters_out,
    }


def validate(books_out: list[dict], sample: bool) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    def fail(msg: str) -> None:
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    if not sample:
        if len(books_out) != 73:
            fail(f"expected 73 books, got {len(books_out)}")
        present = {b["osis"] for b in books_out}
        expected = {osis for osis, _ in BOOKS}
        missing = expected - present
        if missing:
            fail(f"missing books: {sorted(missing)}")

    by_osis = {b["osis"]: b for b in books_out}
    for osis, expected_n in KNOWN_CHAPTER_COUNTS.items():
        b = by_osis.get(osis)
        if b is None:
            continue
        got = len(b["chapters"])
        if got != expected_n:
            fail(f"{osis}: expected {expected_n} chapters, got {got}")

    for b in books_out:
        for ch in b["chapters"]:
            if not ch["verses"]:
                fail(f"{b['osis']} chapter {ch['n']}: no verses")

    return ok, report


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def build_notes(
    xrefs_stripped: int, ps9_10_dropped: int, sir_prologue_dropped: int
) -> str:
    return (
        "Káldi György (1626), harmadik, Tárkányi Béla-féle javított kiadás "
        "(Eger, 1865, „Az Apostoli Szék jóváhagyásával”) -- a magyar "
        "katolikus Biblia az 1973-as fordításig. Public domain. Parsed from "
        "biblia.kapisztran.info, captured offline into raw/kaldi/ by "
        "capture.py (2026-08-28); this scraper does no networking. "
        f"{xrefs_stripped} inline cross-reference bracket(s)/citation(s) were "
        "stripped from verse text (the schema has no cross-reference field) "
        "and are not otherwise recorded. "
        "Only szoveg.html (the running text) is ingested; jegyzet.html "
        "(concise per-verse notes) and jegyzet2.html (extended verse "
        "commentary, a distinctly longer register) are captured in raw/ but "
        "not yet parsed -- the source's two note layers do not fit the "
        "schema's single `notes` field without a design decision (concise "
        "notes as `notes` in a follow-up pass, extended commentary as a "
        "separate enrichment), and a verse in jegyzet.html can anchor after "
        "several unanchored note paragraphs (N:1, not the CCC's 1:1), which "
        "needs its own read of the anchoring rule rather than a rushed one. "
        "An unaddressed appendix at the Psalm 9/10 seam -- 'Zsolt 10. A "
        "ZSIDÓK SZERINT.', a supplementary Hungarian translation of the "
        "separately-numbered Hebrew Psalm 10 that the Vulgate counts as the "
        "back half of Psalm 9 -- is present in the source with no usable "
        f"address and is excluded from books/ps.json ({ps9_10_dropped} "
        "verses; Psalm 9 here is the Vulgate's own 21 anchored verses, not "
        "39). Sirach's prologue ('Sír ELŐBESZÉD.', anchored as chapter 0, "
        f"{sir_prologue_dropped} verses) is likewise excluded: chapter 0 is "
        "schema-reserved for a future bible-intro.hu work, not for scripture "
        "under a borrowed number. Four verses had a mistranscribed number "
        "(digit transposition/insertion), corrected per "
        "pipeline/corrections/bible.kaldi.hu.json and each verified against "
        "bible.clementina.la; six more were printed/anchored out of their "
        "chapter's document order with a correct number and needed no "
        "correction, only not trusting document order for verse placement. "
        "Isaiah 7:14 prints 'Emmánnelnek' for 'Emmánuelnek' (Matthew 1:23 "
        "quotes the same verse spelled correctly) -- an observed source "
        "defect, not corrected here pending a filed pipeline/corrections/ "
        "entry."
    )


def write_output(
    books_out: list[dict],
    *,
    sample: bool,
    generated_at: str,
    receipt: dict,
    xrefs_stripped: int,
    ps9_10_dropped: int,
    sir_prologue_dropped: int,
) -> None:
    today = (
        captured_at(raw_dir() / "tartalom.html") or datetime.now(UTC).date().isoformat()
    )

    notes = build_notes(xrefs_stripped, ps9_10_dropped, sir_prologue_dropped)
    if sample:
        notes = (
            "SAMPLE RUN for review only -- Genesis and Philemon. Not the "
            "full 73-book corpus. " + notes
        )

    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Káldi-Tárkányi Biblia",
        "short_title": "Káldi",
        "language": "hu",
        "edition": "Tárkányi Béla revíziója, Eger, 1865",
        "sources": [{"url": BASE_URL + "tartalom.html", "retrieved_at": today}],
        "copyright": {
            "status": "public-domain",
            "holder": None,
            "notice": None,
        },
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in books_out],
        "corrections_applied": receipt["count"],
    }

    write_stamped_json(
        work_dir(),
        {
            "manifest.json": manifest,
            "corrections-applied.json": receipt,
            **{f"books/{b['osis']}.json": b for b in books_out},
        },
        generated_at,
    )


def print_summary(books_out: list[dict]) -> int:
    total_verses = 0
    print(f"{'osis':<8} {'chapters':>8} {'verses':>8}")
    print("-" * 26)
    for b in books_out:
        n_chapters = len(b["chapters"])
        n_verses = sum(len(c["verses"]) for c in b["chapters"])
        total_verses += n_verses
        print(f"{b['osis']:<8} {n_chapters:>8} {n_verses:>8}")
    print("-" * 26)
    print(f"{'TOTAL':<8} {'':>8} {total_verses:>8}")
    return total_verses


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument(
        "--sample",
        action="store_true",
        help="Only parse Genesis and Philemon, for review.",
    )
    args = ap.parse_args()
    require_corpus()

    tartalom = (raw_dir() / "tartalom.html").read_text(encoding="utf-8")
    names = book_names_from_index(tartalom)

    anomalies: list[Anomaly] = []
    parsed: dict[str, ParsedBook] = {}
    abbrev_hints: dict[str, str | None] = {}

    for osis, slug in BOOKS:
        if args.sample and osis not in SAMPLE_OSIS:
            continue
        name = names.get(slug)
        if not name:
            anomalies.append(
                Anomaly(
                    osis,
                    f"no display name found for slug {slug!r} in tartalom.html",
                    fatal=True,
                )
            )
            continue
        html_text = read_page(slug, "szoveg.html")
        parsed[osis] = parse_book(osis, html_text, anomalies)
        abbrev_hints[osis] = abbrev_hint_for(html_text)

    fatal = [a for a in anomalies if a.fatal]
    if anomalies:
        print(
            f"{len(anomalies)} source anomalies noted during parsing"
            f"{f', {len(fatal)} fatal' if fatal else ''}:"
        )
        for a in anomalies[:60]:
            marker = " FATAL:" if a.fatal else ""
            print(f"  [{a.osis}]{marker} {a.detail}")
        if len(anomalies) > 60:
            print(f"  ... and {len(anomalies) - 60} more")
        print()

    corrections = load_corrections(WORK_ID)
    try:
        applied = apply_verse_number_corrections(
            parsed, corrections, full_run=not args.sample
        )
        applied += apply_verse_duplicate_corrections(
            parsed, corrections, full_run=not args.sample
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1

    books_out = []
    for order, (osis, slug) in enumerate(BOOKS, start=1):
        if osis not in parsed:
            continue
        book = parsed[osis]
        books_out.append(
            finalize_book(book, names[slug], order, abbrev_hints.get(osis))
        )

    total_verses = print_summary(books_out)
    print()

    ok, report = validate(books_out, sample=args.sample)
    if fatal:
        ok = False
        report.append(
            f"FAIL: {len(fatal)} fatal source anomal{'y' if len(fatal) == 1 else 'ies'} "
            "above -- adjudicate into pipeline/corrections/"
        )
    for line in report:
        print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))
    if not ok:
        print("\nRefusing to write a work that failed validation.", file=sys.stderr)
        return 1

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = {
        "work_id": WORK_ID,
        "generated_at": generated_at,
        "applied": applied,
        "unresolved": [c for c in corrections if c.get("resolution")],
        "count": len(applied),
    }
    print(f"\nCorrections layer: {receipt['count']} applied")

    xrefs_stripped = sum(b.xrefs_stripped for b in parsed.values())
    ps9_10_dropped = sum(b.dropped_appendix_verses for b in parsed.values())
    sir_prologue_dropped = sum(b.dropped_prologue_verses for b in parsed.values())

    write_output(
        books_out,
        sample=args.sample,
        generated_at=generated_at,
        receipt=receipt,
        xrefs_stripped=xrefs_stripped,
        ps9_10_dropped=ps9_10_dropped,
        sir_prologue_dropped=sir_prologue_dropped,
    )
    print(
        f"\nWrote {len(books_out)} book file(s) to {work_dir()}, {total_verses} verses total"
    )

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
