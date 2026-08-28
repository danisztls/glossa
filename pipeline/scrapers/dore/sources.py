"""Reading the three statements of what each Doré plate depicts.

The 241 wood engravings Doré designed for `La Grande Bible de Tours` (Mame,
1866) are indexed in two places, and printed with a caption that indexes
itself. None of the three is authoritative alone:

  `parse_index`     catholic-resources.org's tables, which host the scans we
                    actually use. Gives book and CHAPTER, never a verse, and
                    titles rewritten into modern English.
  `parse_wikitable` the English Wikipedia article, independently transcribed.
                    Gives book, chapter and VERSE.
  `parse_caption`   the plate's own printed caption, read by OCR before the
                    cropper discards it. Gives the 1866 edition's title and
                    its own verse reference.

THEY MUST NOT BE JOINED BY POSITION. Both indexes number the plates 1 to 241
and the numbers do not correspond: catholic-resources follows the Vulgate
arrangement and Wikipedia a modern one, so plate 128 is `Isaiah 27` in the
first and `Ezekiel 1:3` in the second. Joining on the number agrees on 95 of
241 and mis-anchors the rest -- each one internally consistent, and a wrong
chapter resolves to real text rather than to an error, so nothing downstream
would notice.

Nor by title. catholic-resources rewrote them, so string similarity produces
confident nonsense: "Achan Is Stoned to Death" matches "The Vision of Death"
(Revelation 6) at 0.60.

The caption is the way out, because it is attached to the FILE rather than to
a position in a list. `reconcile` treats the other two as checks on it, which
is the same shape as the reference-grammar oracle: agreement is silent,
disagreement is a finding. It already earns that on the first plate -- the
caption of `The Creation of Light` prints `Genesis 1: 2`, Wikipedia says
`1:3`, and the pen correction in the scan's own margin says `1:3` too.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass

#: catholic-resources.org's abbreviations, as they appear in its "Bible Chap."
#: column, to OSIS ids. Its Kings are the MODERN books (it prints "1Sam" and
#: "1Kings" as distinct), so no Douay four-books-of-Kings reading applies --
#: see CLAUDE.md on why that distinction cannot be recovered from a citation
#: string alone.
INDEX_BOOKS = {
    "Gen": "gen",
    "Exod": "exod",
    "Lev": "lev",
    "Num": "num",
    "Deut": "deut",
    "Josh": "josh",
    "Judg": "judg",
    "Ruth": "ruth",
    "1Sam": "1sam",
    "2Sam": "2sam",
    "1Kings": "1kgs",
    "2Kings": "2kgs",
    "1Chron": "1chr",
    "2Chron": "2chr",
    "Ezra": "ezra",
    "Neh": "neh",
    "Tobit": "tob",
    "Judith": "jdt",
    "Esther": "esth",
    "Job": "job",
    "Ps": "ps",
    "Prov": "prov",
    "Isaiah": "isa",
    "Jer": "jer",
    "Lam": "lam",
    "Baruch": "bar",
    "Ezek": "ezek",
    "Dan": "dan",
    "Hos": "hos",
    "Joel": "joel",
    "Amos": "amos",
    "Jonah": "jonah",
    "Micah": "mic",
    "Zech": "zech",
    "Mal": "mal",
    "1Macc": "1macc",
    "2Macc": "2macc",
    "Matt": "matt",
    "Mark": "mark",
    "Luke": "luke",
    "John": "john",
    "Acts": "acts",
    "1Thess": "1thess",
    "Rev": "rev",
}

#: Wikipedia's book names, which are spelled out and use the modern order.
WIKI_BOOKS = {
    "Genesis": "gen",
    "Exodus": "exod",
    "Leviticus": "lev",
    "Numbers": "num",
    "Deuteronomy": "deut",
    "Joshua": "josh",
    "Judges": "judg",
    "Ruth": "ruth",
    "1 Samuel": "1sam",
    "2 Samuel": "2sam",
    "1 Kings": "1kgs",
    "2 Kings": "2kgs",
    "1 Chronicles": "1chr",
    "2 Chronicles": "2chr",
    "Ezra": "ezra",
    "Nehemiah": "neh",
    "Tobit": "tob",
    "Judith": "jdt",
    "Esther": "esth",
    "Job": "job",
    "Psalms": "ps",
    "Isaiah": "isa",
    "Jeremiah": "jer",
    "Lamentations": "lam",
    "Baruch": "bar",
    "Ezekiel": "ezek",
    "Daniel": "dan",
    "Amos": "amos",
    "Micah": "mic",
    "Jonah": "jonah",
    "Zechariah": "zech",
    "I Maccabees": "1macc",
    "II Maccabees": "2macc",
    "Matthew": "matt",
    "Mark": "mark",
    "Luke": "luke",
    "John": "john",
    "Acts": "acts",
    "1 Thessalonians": "1thess",
    "Revelation": "rev",
}

#: Wikipedia cites the two Greek additions to Daniel by their own names. The
#: Vulgate -- and so this corpus -- numbers them Daniel 13 and 14.
WIKI_DEUTERO = {
    "The History of Susanna": ("dan", 13),
    "Bel and the Dragon": ("dan", 14),
}


@dataclass(frozen=True)
class IndexPlate:
    """One row of a catholic-resources.org table."""

    plate_id: str  # "OT-001", "NT-241"
    number: int  # 1..241, its position in the 1866 series
    osis: str  # "gen"
    chapter: int
    title: str  # rewritten into modern English
    url: str  # the 2400x3200 master
    alternate: str | None  # "Matt 3", where the row offers a second locus
    #: That alternate resolved, when it names a book this table knows. Seven
    #: rows carry one, and they are not noise: an index row reading "Matt 27A
    #: (or John 19B)" is not disagreeing with a caption that says John, it is
    #: agreeing with it in second place. Left unresolved, those plates lose a
    #: vote they should have won.
    alternate_osis: str | None = None
    alternate_chapter: int | None = None


@dataclass(frozen=True)
class WikiPlate:
    """One row of the English Wikipedia table."""

    number: int
    osis: str
    chapter: int
    verse: int | None
    title: str


def _text(fragment: str) -> str:
    """Visible text of an HTML or wikitext fragment.

    `{{ill|...|lt=Judges 16:30}}` is an interlanguage-link template, used once
    in the table (the Samson plate, whose reference is a Hebrew phrase). Its
    `lt=` parameter is the displayed text and therefore the reference; without
    this the row parses to nothing and the plate silently loses its anchor.
    """
    label = re.search(r"\{\{ill\|.*?\blt\s*=\s*([^|}]+)", fragment, re.DOTALL)
    if label:
        fragment = label.group(1)
    fragment = re.sub(r"\{\{[^{}]*\}\}", " ", fragment)
    fragment = re.sub(r"\[\[(?:[^\]|]*\|)?", "", fragment).replace("]]", "")
    fragment = re.sub(r"<br\s*/?>", " ", fragment, flags=re.IGNORECASE)
    fragment = re.sub(r"<[^>]+>", "", fragment)
    fragment = re.sub(r"''+", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(fragment)).replace("\xa0", " ").strip()


def _split_alternate(ref: str) -> tuple[str, str | None]:
    """`"John 1 (or Matt 3)"` -> `("John 1", "Matt 3")`.

    Several plates illustrate an episode told in more than one gospel, and
    the index says so rather than choosing. We anchor on the primary and keep
    the alternate as provenance; picking silently would hide a real editorial
    judgement inside a parser.
    """
    match = re.match(r"^(.*?)\s*\(or\s+(.*?)\)\s*$", ref)
    return (
        (match.group(1).strip(), match.group(2).strip())
        if match
        else (ref.strip(), None)
    )


def _index_locus(ref: str) -> tuple[str, int] | None:
    """`"1Kings 5"` and `"Matt 27A"` -> `("1kgs", 5)`, `("matt", 27)`.

    The trailing letter distinguishes several plates sharing one chapter; it
    is a disambiguator within the index, not part of the address.
    """
    # "1 Thess 2" is the one row that spaces its numeral; everywhere else the
    # index writes "1Sam", "2Kings". Close that gap rather than carrying two
    # spellings of every numbered book in the table above.
    ref = re.sub(r"^([1-4])\s+", r"\1", ref)
    match = re.match(r"^([A-Za-z0-9]+)\s+(\d+)[A-Z]?$", ref)
    if not match:
        return None
    osis = INDEX_BOOKS.get(match.group(1))
    return (osis, int(match.group(2))) if osis else None


def parse_index(
    page: str, base: str = "https://catholic-resources.org"
) -> list[IndexPlate]:
    """Every plate row of `Dore-OT.htm` or `Dore-NT.htm`.

    A row is recognized by holding a link to a full-size `OT-nnn.jpg` or
    `NT-nnn.jpg`; the medium files sit in the previous cell and are the same
    picture at 450px, too small to read a caption from.
    """
    plates: list[IndexPlate] = []
    for row in re.findall(r"<tr>(.*?)</tr>", page, re.DOTALL | re.IGNORECASE):
        cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.DOTALL | re.IGNORECASE)
        if len(cells) < 4:
            continue
        link = re.search(r'href="([^"]*Images/((?:OT|NT)-\d+)\.jpg)"', cells[3])
        if not link:
            continue
        ref, alternate = _split_alternate(_text(cells[0]))
        locus = _index_locus(ref)
        if locus is None:
            continue
        second = _index_locus(alternate) if alternate else None
        plates.append(
            IndexPlate(
                plate_id=link.group(2),
                number=int(link.group(2).split("-")[1]),
                osis=locus[0],
                chapter=locus[1],
                title=_text(cells[1]),
                url=base + link.group(1).replace("..", ""),
                alternate=alternate,
                alternate_osis=second[0] if second else None,
                alternate_chapter=second[1] if second else None,
            )
        )
    return plates


def _wiki_locus(ref: str) -> tuple[str, int, int | None] | None:
    """`"Genesis 2:21-22"` -> `("gen", 2, 21)`; the first verse of a range.

    `"Daniel 3:28/3:95"` gives two numberings of one verse, Hebrew then
    Vulgate. This corpus canonicalizes on the Vulgate, so the reading after
    the slash is the one that survives -- and it is taken through
    `versification.ts`'s table downstream rather than trusted here.
    """
    # Susanna and Bel and the Dragon are cited by their own names, with the
    # Vulgate address given in the row's own parenthetical -- "(i.e., 13:1-26
    # of the Extended Book of Daniel)". Read that rather than hard-coding a
    # chapter: it is the source stating the mapping this corpus needs.
    for name, (osis, fallback) in WIKI_DEUTERO.items():
        if name in ref:
            vulgate = re.search(r"(\d+)\s*:\s*(\d+)", ref)
            if vulgate:
                return osis, int(vulgate.group(1)), int(vulgate.group(2))
            return osis, fallback, None
    match = re.match(
        r"^((?:[1-4]|I{1,3})?\s*[A-Za-z][A-Za-z\s]*?)\s+(\d+)(?::\s*([\d]+))?", ref
    )
    if not match:
        return None
    osis = WIKI_BOOKS.get(match.group(1).strip())
    if not osis:
        return None
    verse = int(match.group(3)) if match.group(3) else None
    return osis, int(match.group(2)), verse


def parse_wikitable(wikitext: str) -> list[WikiPlate]:
    """Every numbered row of the article's two illustration tables."""
    plates: list[WikiPlate] = []
    for row in re.split(r"\n\|-\s*\n", wikitext):
        if not re.search(r"\[\[[Ff]ile:", row):
            continue
        cells = [
            c.strip() for c in re.split(r"\n\|(?!\})", "\n" + row.strip()) if c.strip()
        ]
        if len(cells) < 4:
            continue
        number = _text(cells[0])
        if not number.isdigit():
            continue
        locus = _wiki_locus(_text(cells[3]))
        if locus is None:
            continue
        plates.append(
            WikiPlate(
                number=int(number),
                osis=locus[0],
                chapter=locus[1],
                verse=locus[2],
                title=_text(cells[1]),
            )
        )
    return plates


#: The reference a caption prints, as "(Joshua 5: 15)" or "(Matthew 27: 35)".
#: The book name is captured loosely -- OCR joins "1Thessalonians" and drops
#: letters -- and resolved by similarity rather than by exact lookup.
_CAPTION_REF = re.compile(
    r"\(\s*([IVX1-4]?\s?[A-Za-z][A-Za-z\s.]{2,24}?)\s*(\d{1,3})\s*[:;]\s*(\d{1,3})"
)

#: A bare chapter:verse pair, for captions whose book name OCR could not read.
_CAPTION_LOCUS = re.compile(r"(\d{1,3})\s*[:;]\s*(\d{1,3})")

#: Below this, an OCR'd book name is not trusted to name a book at all.
_BOOK_SIMILARITY = 0.72


def _match_book(name: str) -> str | None:
    """OSIS id for an OCR'd book name, by similarity, or None.

    The captions print modern full names -- "Joshua", "Lamentations",
    "1 Thessalonians" -- which is the vocabulary `WIKI_BOOKS` already holds, so
    the two tables are one. Similarity rather than lookup because this is OCR
    output: "Genesis" comes back as "Gesests", "Zechariah" as "Zecharisk", and
    a caption that reads perfectly at full resolution may not at any other.
    """
    from difflib import SequenceMatcher

    cleaned = re.sub(r"[^a-z0-9]", "", name.lower())
    if not cleaned:
        return None
    best, score = None, 0.0
    for label, osis in WIKI_BOOKS.items():
        ratio = SequenceMatcher(
            None, cleaned, re.sub(r"[^a-z0-9]", "", label.lower())
        ).ratio()
        if ratio > score:
            best, score = osis, ratio
    return best if score >= _BOOK_SIMILARITY else None


def parse_caption(text: str) -> tuple[str | None, int | None, int | None]:
    """`(osis, chapter, verse)` from an OCR'd caption; any part may be None.

    NOTHING IS FILTERED AGAINST WHAT THE INDEX EXPECTS, and an earlier version
    that did is why this docstring exists. It took the index's chapter and kept
    only OCR pairs matching it, on the reasoning that the book was already
    known and this made the numbers robust. What it actually did was discard
    every reading that DISAGREED with the index -- so the plate captioned
    "THE ANGEL APPEARING TO JOSHUA ... (Joshua 5: 15)", filed by the index under
    Judges 2, reported no reference at all. The evidence that the index was
    wrong was thrown away for looking wrong.

    The LAST reference on the line wins: a caption quotes its verse before
    citing it, so a number inside the excerpt would otherwise be mistaken for
    the locator.
    """
    flat = text.replace("\n", " ")
    matches = _CAPTION_REF.findall(flat)
    if matches:
        name, chapter, verse = matches[-1]
        return _match_book(name), int(chapter), int(verse)
    bare = _CAPTION_LOCUS.findall(flat)
    if bare:
        chapter, verse = bare[-1]
        return None, int(chapter), int(verse)
    return None, None, None
