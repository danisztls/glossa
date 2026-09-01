"""The Compendium's PDF editions: what is true of these books, not of PDFs.

`common/pdf.py` is the half that knows how to run two readers and hand back
one coordinate-bearing shape. This is the half that knows what a printed
Compendium looks like, and every claim about a particular edition -- which
reader, which re-decode, which glyph the fonts fail to map, how the
cross-reference margin is set -- is a field in `PDF_EDITIONS` rather than a
branch anyone has to go looking for.

WHY THESE FOUR ARE PDF AT ALL. vatican.va publishes the Compendium in
fourteen languages and serves ten of them as HTML. The other four --
Byelorussian, Indonesian, Lithuanian, Russian -- it publishes only as a PDF
produced by the national bishops' conference that made the translation, which
is also why each of them carries a second rights holder that the ten do not
(see `pdf_copyright`).

WHAT THE PAGE LOOKS LIKE, and it is the same book in all four:

    +--------------------------------------------------+
    |  20        Pirma dalis. Pirmas skyrius.          |  <- folio + running head
    |                                                  |
    |         Dieviskojo Apreiskimo perdavimas         |  <- division title
    |                                                  |
    |  11. Kodel ir kaip perduodamas ...?              |  <- question, bold
    |  74   Dievas "troksta, kad visi zmones ...       |  <- CCC refs in the
    |       pazinima" (1 Tim 2, 4), t. y. pazintu ...  |     OUTER margin,
    |                                                  |     beside the answer
    +--------------------------------------------------+

The margin numbers are the same apparatus the ten HTML editions print inline
and store as `ccc_refs`, so nothing about the output schema moves for these.
Getting them out of the running text is the whole of the extra work, and it
is geometry: they are the text outside the body's x-band, and the band
mirrors between recto and verso because the outer margin is the wide one.

THE ORDER OF OPERATIONS IS LOAD-BEARING. Split the columns on the reader's
own line fragments, THEN merge fragments within each column. Merging first
glues the margin onto the body -- in the Lithuanian the two are 4.1pt apart,
closer than the spaces inside a line -- and the damage is invisible, because
what comes out is a sensible sentence with a number in front of it. It cost
118 of 288 questions their references before the cross-edition check below
caught it. `common/pdf.merge_runs` carries the same warning at the point of
use.

HOW THIS IS CHECKED, and it is the reason to trust any of it: question N is
the same question in every edition, so the margin column extracted here must
agree digit for digit with what the ten HTML editions already store. Compare
`ccc_refs` against `compendium.it` after a run -- the Lithuanian agrees on
582 of 598, and of the sixteen that differ, five are questions the Italian
itself has no reference line for (Q361 and Q563-Q566, a known defect of that
edition recorded in its own LANG_CONFIG notes) and four are misprints in the
ITALIAN: `1198-1999` for 1198-1199 at Q245, `2617; 2018` for 2617-2618 at
Q546, `2050-2051` for 2650-2651 at Q557, `2658` for 2758 at Q577.

That comparison found every bug this module has had, and each looked like
plausible output rather than damage: the margin merged into the body, a
group's last run assigned to the following question, a folio read as a
reference, the epigraph's reference attached to the question above it. None
would have been visible by reading the Lithuanian alone. `audit.py balance`
is the other half -- it is what caught the art plates being absorbed into the
last question of each part, and it reports the Lithuanian inside the same
skew band as every other edition pair now.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

from common.pdf import (
    Line,
    body_columns,
    dehyphenate,
    in_margin,
    merge_runs,
    page_boxes,
    read_lines,
    remap,
    split_pages,
)


def _cp1251(text: str) -> str:
    """Recover Cyrillic a reader could only hand back as raw bytes.

    The Russian edition's fonts carry no `ToUnicode` map, so MuPDF refuses
    every glyph and poppler passes the underlying byte through as though it
    were Latin-1 -- `Ïî÷åìó` for `Почему`. The custom encoding is cp1251, so
    re-interpreting the bytes recovers the text exactly, en-dashes included.
    """
    return text.encode("latin-1", "replace").decode("cp1251", "replace")


@dataclass(frozen=True)
class PdfEdition:
    """One printed Compendium, and everything its file does differently."""

    #: "mupdf" or "poppler". NOT a preference: each of these two files is
    #: unreadable by the other tool. See `common/pdf.py`.
    backend: str
    #: Applied to every line's text after extraction. Russian only.
    decode: Callable[[str], str] | None = None
    #: Characters the reader could not map, and what the font's own charset
    #: says they are. Byelorussian only.
    glyphs: dict[str, str] = field(default_factory=dict)
    #: Whether each PDF page carries two book pages side by side. Russian
    #: only -- its 109 sheets are 218 pages, and read as sheets its running
    #: heads come out as `26 ... 27` and half its questions vanish.
    two_up: bool = False
    #: Fraction of the page height at the head and the foot that holds
    #: furniture rather than text: the folio, and the running head, which in
    #: these books REPEATS THE DIVISION NAMES and so matches the heading table
    #: on every single page if it is not excluded.
    #:
    #: Position rather than font size, though size looks like the better
    #: signal and was tried first: the Lithuanian sets its running head at 9pt
    #: against a 10pt body, but it also sets four ordinary questions (Q360 to
    #: Q363, on one crowded page) at 9pt, and a size test silently dropped
    #: them. Where a thing is printed is a fact about the page; how big it is
    #: happens to correlate.
    furniture_strip: float = 0.09


#: The four, in the order they were brought in. Only Lithuanian is wired up
#: today; the other three are declared so that the shape of what each needs
#: is written down where the next person will look for it.
PDF_EDITIONS: dict[str, PdfEdition] = {
    "lt": PdfEdition(backend="mupdf"),
}


#: A question opens with its number and a period. Shared by all four; the
#: editions differ in how far the number is indented, never in its shape.
QUESTION_RE = re.compile(r"^\s*(\d{1,3})\.\s+(\S.*)$", re.DOTALL)

#: A cross-reference run is digits and the punctuation that joins or ranges
#: them, and must START with a digit -- which is what keeps a line-break
#: hyphen, stranded in the margin band by the reader, from being stored as a
#: reference. It looked like a harmless empty match and put a bare "-" in
#: `ccc_refs` for five questions.
MARGIN_REF_RE = re.compile(r"^\d[\d,;:.‐‑–—\s-]*$")


@dataclass
class PdfPage:
    n: int
    body: list[Line]
    margin: list[Line]


#: The work is questions 1 to 598 in every edition, by construction.
LAST_QUESTION = 598


def read_edition(path: Path, ed: PdfEdition) -> list[PdfPage]:
    """From a file on disk to body and margin lines, page by page."""
    lines = read_lines(path, ed.backend)
    if ed.decode is not None:
        lines = [ln.with_text(ed.decode(ln.text)) for ln in lines]
    lines = remap(lines, ed.glyphs)
    if ed.two_up:
        boxes = {b.page: b.width / 2 for b in page_boxes(path)}
        lines = split_pages(lines, boxes)
    bands = body_columns(lines)
    height = page_boxes(path)[0].height
    pages: list[PdfPage] = []
    for n in sorted({ln.page for ln in lines}):
        on_page = [ln for ln in lines if ln.page == n]
        body = merge_runs([ln for ln in on_page if not in_margin(ln, bands)])
        body = [ln for ln in body if not _in_furniture(ln, height, ed)]
        margin = merge_runs([ln for ln in on_page if in_margin(ln, bands)])
        pages.append(PdfPage(n, body, _refs_only(margin, height, ed)))
    return pages


def _numbered_range(pages: list[PdfPage], match_label) -> list[PdfPage]:
    """Only the pages from the first question to the last.

    A PDF has no anchors for `region()` to cut on, so the book bounds itself
    -- but NOT by looking for question 1, which is the obvious rule and is
    wrong. The preface numbers its own six paragraphs `1.` to `6.`, so the
    first `1.` in the file is fifty pages before the work begins; taken as the
    start it swallowed the front matter, and then the monotonic gate below
    rejected the REAL questions 1 to 6 as going backwards and the work opened
    at question 7.

    The start is therefore the first PART heading, which is the same anchor
    the four HTML editions with no named anchors already cut on ("ERSTER
    TEIL"). The end is the page carrying question 598, found under the same
    monotonic rule so that a contents page listing it cannot move it -- and
    everything after it is the Appendix and then the table of contents, which
    is the one that matters, because a contents page lists every division
    heading in the work and pushes a second, spurious copy of the whole
    structure tree.
    """
    first = None
    for i, page in enumerate(pages):
        for line in page.body:
            if QUESTION_RE.match(line.text):
                continue
            label = match_label(line.text.strip())
            if label is not None and label == ("part", 1):
                first = i
                break
        if first is not None:
            break
    if first is None:
        return pages
    rest = pages[first:]
    last, seen = None, 0
    for i, page in enumerate(rest):
        for line in page.body:
            m = QUESTION_RE.match(line.text)
            if not m:
                continue
            n = int(m.group(1))
            if n <= seen:
                continue
            seen = n
            if n == LAST_QUESTION:
                last = i
    return rest if last is None else rest[: last + 1]


def _in_furniture(line: Line, height: float, ed: PdfEdition) -> bool:
    lo, hi = height * ed.furniture_strip, height * (1 - ed.furniture_strip)
    return not (lo < line.baseline < hi)


def _refs_only(margin: list[Line], height: float, ed: PdfEdition) -> list[Line]:
    """Margin lines that are actually cross-references.

    Two exclusions, both measured rather than assumed: a token in the head or
    foot strip is the folio (the Lithuanian sets its page number in the outer
    margin, so it lands in this column and read as a reference it prefixed
    Q1's with the number 30), and a token with no digit is reader debris.
    """
    return [
        ln
        for ln in margin
        if not _in_furniture(ln, height, ed)
        and MARGIN_REF_RE.fullmatch(ln.text.strip())
    ]


def process_pdf_body(pages: list[PdfPage], cfg: dict, state) -> None:
    """Walk the pages and drive `ScrapeState`, exactly as `process_body` does.

    Deliberately NOT built by synthesizing `Block`s for `process_body` to
    consume. That function decides what a line is from MARKUP -- `<b>` for a
    question, `align="center"` for a sub-heading, `<blockquote>` for a
    quotation -- and a PDF has none of those. The analogous facts here are
    typographic (weight, size) and positional, so faking HTML around them
    would hide the real seam. The real seam is `ScrapeState`, which is a state
    machine over `(kind, n, title)` and `(n, text)` and has never cared where
    those came from; everything below reuses it unchanged.
    """
    match_label = cfg["match_label"]
    pages = _numbered_range(pages, match_label)
    starts = _question_starts(pages)
    #: Lines of the answer being read, flushed as one block when it closes.
    #: They cannot be handed to `add_prose` one at a time: that joins with a
    #: space, and these editions hyphenate at every line break -- 1,426 of
    #: them in the Lithuanian -- so a word split across two lines would be
    #: stored as "sir- dyje" for "sirdyje". The break is only recoverable
    #: while the line boundary is still there, which is why the join happens
    #: here and not in `common/pdf.py`.
    buffer: list[str] = []

    def flush() -> None:
        if buffer and state.current is not None:
            state.add_prose(_join_prose(buffer))
        buffer.clear()

    for page in pages:
        lines = page.body
        questions = [ln for ln in lines if id(ln) in starts]
        headings = [
            ln
            for ln in lines
            if id(ln) not in starts and match_label(ln.text.strip()) is not None
        ]
        # A PAGE WITH NEITHER A QUESTION NOR A HEADING IS A PLATE, not the
        # continuation of the answer above it. The Compendium interleaves
        # full-page reproductions of sacred art, each with a commentary and a
        # caption, and they are out of scope for this corpus exactly as they
        # are for the ten HTML editions. Absorbed into the running answer they
        # went to the LAST question of each part -- Q217, Q356 and Q533 came
        # out six to eight times longer than the same answer in every other
        # edition, which `audit.py balance` reports and nothing else would.
        # Flush rather than merely skip: the answer before the plate is
        # finished, and its text must not be joined to whatever follows.
        if not questions and not headings:
            flush()
            continue
        i = 0
        while i < len(lines):
            line = lines[i]
            label = match_label(line.text.strip())
            if label is not None and not QUESTION_RE.match(line.text):
                kind, n = label
                flush()
                title, i = _heading_title(lines, i)
                state.push_heading(kind, n, title)
                continue
            m = QUESTION_RE.match(line.text) if id(line) in starts else None
            if m:
                flush()
                state.start_question(int(m.group(1)), m.group(2).strip())
                refs = _refs_for(page, line, questions, headings)
                if refs:
                    state.set_refs(refs)
                i += 1
                continue
            if state.current is not None:
                buffer.append(line.text.rstrip())
            i += 1
    flush()


def _join_prose(lines: list[str]) -> str:
    """One answer's lines as one paragraph, with the typesetter's hyphens gone.

    Only a hyphen that ENDS a line is a break to close up; one inside a line
    is the author's, and after the lines are joined the two are
    indistinguishable, which is why this runs while the boundaries survive.
    """
    return re.sub(r"\s+", " ", dehyphenate("\n".join(lines))).strip()


def _question_starts(pages: list[PdfPage]) -> set[int]:
    """Which number-and-period lines actually open a question.

    THE WORK'S NUMBERS ONLY EVER GO UP, and that is the whole test. The
    Compendium prints the Decalogue as a numbered list on the page facing
    Part Three -- "1. Neturek kitu die-" -- and read as a question it opens a
    second Q1 after Q357, which `validate` reports as a top-level gap and
    which, unchecked, would have filed the first commandment as the answer to
    question 1. This is the same shape as the stray numbered lists that defeat
    fifteen document parses elsewhere in the corpus (CLAUDE.md); here the
    remedy is cheap because the work's own numbering is dense and ordered.

    Identity rather than value: two lines can carry the same text, and the
    caller needs to know which OCCURRENCE was accepted.
    """
    starts: set[int] = set()
    last = 0
    for page in pages:
        for line in page.body:
            m = QUESTION_RE.match(line.text)
            if not m:
                continue
            n = int(m.group(1))
            if n <= last:
                continue
            starts.add(id(line))
            last = n
    return starts


def _heading_title(lines: list[Line], i: int) -> tuple[str, int]:
    """A division's label and the title printed under it, as one string.

    The ten HTML editions store the two together ("PARTE SECONDA LA
    CELEBRAZIONE DEL MISTERO CRISTIANO") because their markup runs them into
    one block; the PDF sets them as separate lines, so they are rejoined here
    to keep `structure.json` the same shape across all fourteen.
    """
    parts = [lines[i].text.strip()]
    size = lines[i].size
    j = i + 1
    while j < len(lines):
        nxt = lines[j]
        if QUESTION_RE.match(nxt.text):
            break
        # The title is set at or above the label's size; the body beneath it
        # is smaller. Without a font (poppler) nothing is consumed, which is
        # the safe direction -- a division keeps its label and loses its name.
        if not nxt.size or nxt.size < size:
            break
        parts.append(nxt.text.strip())
        j += 1
    return " ".join(parts), j


def _refs_for(
    page: PdfPage, question: Line, questions: list[Line], headings: list[Line]
) -> str:
    """The margin runs belonging to one question, joined as printed.

    ASSIGNED BY THE LAST QUESTION AT OR ABOVE THE RUN, not by the midpoint
    between two questions. The reference block for a question is set beside
    its ANSWER, so its lower lines routinely fall past the midpoint into the
    next question's half; a midpoint window moved the last run of a group to
    the following question for 42 of 598, which reads as two plausible
    reference lists rather than as damage. A small tolerance covers a first
    run that shares the question's own baseline.
    """
    tol = 4.0
    later = [q.baseline for q in questions if q.baseline > question.baseline]
    # A HEADING CLOSES THE WINDOW as firmly as the next question does. Each
    # chapter opens with an epigraph -- Augustine's "you have made us for
    # yourself" under Part One's first chapter -- and the book prints that
    # quotation's own CCC reference in the margin beside it. It belongs to no
    # question: the ten HTML editions drop the epigraph as an orphan block and
    # store no reference for it, and without this bound it was appended to the
    # preceding question, giving Q1 "1-25 30" where every other edition reads
    # "1-25".
    later += [h.baseline for h in headings if h.baseline > question.baseline]
    hi = min(later) - tol if later else float("inf")
    lo = question.baseline - tol
    runs = [ln.text.strip() for ln in page.margin if lo <= ln.baseline < hi]
    return " ".join(runs)


#: Every one of the four is published by a national bishops' conference or its
#: press, under licence from the Libreria Editrice Vaticana, and prints BOTH
#: notices with its own ISBN and year. The ten HTML editions print only the
#: Vaticana's. `holder` stays the Vaticana -- it is the rights holder the
#: whole corpus attributes to, and `static/works.json` and the JSON-LD
#: `copyrightHolder` carry exactly one -- and the translator's notice goes
#: verbatim into `notice`, which is free text. Nothing is dropped and no
#: schema moves.
PDF_COPYRIGHT: dict[str, str] = {
    "lt": (
        "© Copyright 2005 - Libreria Editrice Vaticana; "
        "© Lietuvos Vyskupų Konferencija, 2007"
    ),
}


def pdf_copyright(lang: str, default: str) -> str:
    return PDF_COPYRIGHT.get(lang, default)
