"""The Catechism's PDF editions: what is true of these books, not of PDFs.

`common/pdf.py` is the half that runs two readers and hands back one
coordinate-bearing shape. `ccc/compendium_pdf.py` is the half that knows what
a printed Compendium looks like. This is the third of that family, and it is
its own module rather than a branch of either because the page it reads has
nothing in common with theirs: no cross-reference margin, no two-up
imposition, no epigraph to tell from a run-in heading by italic -- and one
column of Chinese, set to a measure, in a book split across forty-three files.

WHY THE CHINESE CATECHISM IS FORTY-THREE FILES. vatican.va publishes the CCC
as HTML in eight languages and as PDF in two (`ccc.py` §EDITIONS). The Arabic
is five part-files mapping onto the Prologue and the four Parts; this one is
forty-three, and **each filename declares the paragraph range it carries**
(`22_1210-1284_ccc_zh.pdf`), which is a coverage assertion the edition makes
about itself and which nothing else in the corpus gets for free.

WHAT THE PAGE LOOKS LIKE, and every signal this module reads is in it:

    +--------------------------------------------------+
    |                  天主教教理                       |  <- the work's title,
    |                    卷一                           |     reprinted atop
    |                 信仰的宣認                        |     every part-file,
    |                                                  |     then the restated
    |                  第二章                           |     ancestor chain
    |               天主來與人相遇                      |
    |                                                  |
    |  50. 人藉著自然的理智，能從天主的工程確實地認識   |  <- the number HANGS
    |      天主。然而有另一種知識領域，人只憑己力是     |     into the margin
    |                                                  |
    |     聖依勒內‧里昂多次以天主與人彼此相互適應的     |  <- a citation, set
    |     圖象，來談論這神性教育法：「天主聖言在人間     |     two points smaller
    +--------------------------------------------------+

THREE MEASUREMENTS DO ALL THE WORK, and each is a fact about this book rather
than about PDFs (measured 2026-09-05 over all 43 files, 14,779 lines):

  - **The paragraph number hangs.** Every one of the 2,860 numbers the edition
    prints opens a line whose own left edge is at x≈90, against a text block
    that runs from 114 to 126 depending on the file. Not one line outside that
    band opens with a digit run a number pattern would accept. So "does this
    line begin a paragraph?" is geometry here, and never has to be guessed
    from the text.
  - **Leading is bimodal.** Between two lines of one block the baselines are
    18pt apart (7,951 pairs); between blocks, 36 (2,228). Nothing falls
    between 19 and 27. `PdfEdition.lead` cuts there, and that is what turns a
    flat list of lines into the blocks `process_page` consumes.
  - **There are two body sizes and they mean different things.** 12pt is the
    running text; 10pt is what the book's own §21 says it is -- "引証教父著作、
    禮儀、教會訓導或聖徒傳記時，都用較小字體印出", citations from the Fathers,
    the liturgy, the Magisterium and the saints. That is a `quote` block, and
    it is typographic information the eight HTML editions do not carry.

WHAT IS **NOT** HERE, and both absences are the source's. The edition prints
**no footnote apparatus**: no markers, no note list, no `PG`/`DV`/`LG`
anywhere, so `citations` is empty by construction rather than by omission. It
folds its Scripture references into the running text instead (`(創 10:5)`,
`(希 1:1-2)`), which is where the site's grammar has to find them. And it
prints no cross-reference margin, so `related` is empty for the same reason it
is empty in all eight HTML editions.

The one exception proves it: **the 2018 death-penalty revision brought a
footnote with it**, sourcing Francis's address of 11 October 2017, and it is
the only one in 2,865 paragraphs. It belongs to §2267, which this edition
cannot yield at all -- see `_collisions`.
"""

from __future__ import annotations

import itertools
import re
from dataclasses import dataclass
from pathlib import Path

from common.pdf import Line, merge_runs, read_lines


@dataclass(frozen=True)
class PdfEdition:
    """One printed Catechism, and everything its files do differently."""

    #: "mupdf" or "poppler". MuPDF here, and unlike the Compendium's four it
    #: is a preference rather than a necessity: both readers give this book's
    #: text. MuPDF is chosen because it reports a type SIZE, which is the
    #: whole of this edition's heading and quotation signal -- poppler's
    #: `-bbox-layout` reports no font at all (`common/pdf.py`), and read with
    #: it this book has no way to tell a citation from running text.
    backend: str
    #: x below which a line's own left edge means it opens a paragraph. The
    #: number hangs into the margin and the text block starts 24 to 36 points
    #: further in; the band between them is empty in all 43 files.
    hang: float = 105.0
    #: The largest baseline gap that still joins two lines into one block.
    #: See the module note: the gap is 18 within a block and 36 between, with
    #: nothing in between, so anything in the twenties will do and the value
    #: is not tuned.
    lead: float = 22.0
    #: The size of the running text. Anything larger is a heading, anything
    #: smaller and still in `text_sizes` is the citation type this book sets
    #: its quotations in.
    body_size: float = 12.0
    #: A line at neither text size and no larger than the body is apparatus,
    #: not text. Two things land here and both are meant to: the 9pt footnote
    #: markers left stranded in §160 and §1789 by an apparatus this edition
    #: does not otherwise print, and the 11pt note that came in with the 2018
    #: revision of §2267 (module note). Nothing else in the book is at any
    #: other size.
    #:
    #: Stated as the sizes that ARE text, so a new size is dropped and
    #: reported rather than silently read as prose.
    text_sizes: tuple[float, ...] = (10.0, 12.0)
    #: Lines to discard wherever they stand, matched against the WHOLE line:
    #: the work's own title, reprinted at the head of every part-file, and the
    #: carry-over marker each file closes with ("<續2401 條>", "continues at
    #: §2401"). Both are furniture this book puts in the text block rather
    #: than in a running head, so position cannot find them.
    furniture: tuple[str, ...] = ()
    #: What must never appear INSIDE stored text, matched anywhere in a
    #: block. The guard against `furniture` going stale, and it is a separate
    #: list because the two questions have different answers: the work's own
    #: title is furniture on a line of its own and ordinary prose inside a
    #: sentence -- §2514 reads 按照天主教教理的傳統, "according to the tradition
    #: of Catholic catechesis" -- so searching for it would fail a paragraph
    #: that is perfectly read. The carry-over marker has no such reading, and
    #: it is the one that could actually leak, since it is printed in the text
    #: block where a missed rule would fold it into the paragraph above.
    forbidden: tuple[str, ...] = ()
    #: How far a run-in sub-heading can run. This edition sets them in the
    #: body size at the body indent, so neither typography nor position
    #: separates them from a short paragraph -- length and final punctuation
    #: do, exactly as `is_mini_header` decides it for the HTML editions.
    sub_max_chars: int = 30
    #: What ends a sentence. NOT `？`, and not the closing bracket `」`:
    #: this book asks questions in its headings ("天使是誰？", "為甚麼有禮
    #: 儀？" -- the very heading `is_mini_header`'s docstring names) and
    #: quotes the Creed in them ("「教會之外沒有救恩」"), so either mark as a
    #: terminator loses real divisions. The English rule is the same shape and
    #: excludes `?` for the same reason.
    terminal: str = "。！；：.!;:，、"
    #: A heading line ending in one of these continues onto the next heading
    #: line. Five headings in the book are set over two lines, and all five
    #: break after one of these marks -- measured, and the reason the rule can
    #: be this narrow.
    heading_continues: str = "，、："
    #: How wide a gap inside one row means text the reader did not hand back.
    #: See `_holes`; measured, and there is nothing between the 5 to 7 points
    #: a kerned bracket leaves and the 108 points of the narrowest real hole.
    hole: float = 40.0
    #: How much two runs on one baseline may overlap before the row is two
    #: texts printed on top of each other. See `_collisions`.
    overlap: float = 20.0


#: The two, and only one is wired up. Arabic is declared where the next person
#: will look for it, with what is already known about its file, but nothing
#: reads it yet: its normalisation is a layer this module does not have and
#: must not grow by accident (`docs/research/pdf-editions.md` §9).
PDF_EDITIONS: dict[str, PdfEdition] = {
    "zht": PdfEdition(
        backend="mupdf",
        furniture=(r"^天主教教理$", r"^<\s*續\s*\d+\s*條\s*>$"),
        forbidden=(r"<\s*續\s*\d+\s*條\s*>",),
    ),
}


@dataclass(frozen=True)
class PdfBlock:
    """One run of lines the edition set as a unit.

    `kind` is what `Block` in `ccc.py` wants to be told and nothing more --
    "heading", "prose" or "quote" -- because the seam between a reader and the
    Catechism's state machine is a block's KIND, never its markup. The HTML
    parsers decide it from `<b>` and `<blockquote>`; this one decides it from
    type size and line length, and the machine downstream cannot tell.
    """

    kind: str
    text: str
    #: The paragraph this block belongs to, or None for a heading and for
    #: anything printed before the first number. Carried so a paragraph the
    #: file cannot yield can be dropped whole rather than in pieces.
    owner: int | None


#: A paragraph opens with its number. The period is OPTIONAL and that is the
#: source's doing, not laxity: this edition omits it at §1224 and §1478 and
#: prints the number alone. Both are read correctly here, which is why neither
#: is a `pipeline/corrections/` entry -- a missing period changes nothing a
#: reader reads, only whether the parser finds the number, which is the line
#: `pipeline/docs/corrections.md` draws for broken markup.
_NUMBER_RE = re.compile(r"^\s*(\d{1,4})\s*\.?\s*")


def read_part_file(
    path: Path, ed: PdfEdition, damaged: dict[int, list[str]], is_label
) -> list[PdfBlock]:
    """One part-file as blocks, recording what could not be read.

    ONE FILE AT A TIME rather than the whole edition at once, because the
    banner each file opens with has to be resolved against the structure the
    files before it built -- see `drop_restated_banner`.

    `damaged` is filled in rather than returned: it is `paragraph -> the rows
    the reader could not read whole`, and it accumulates across the
    forty-three so the caller can check the whole of it against what the
    edition DECLARES it cannot yield. A file that grew another such paragraph
    shows up as a declaration that no longer matches, which is the only thing
    keeping the declaration honest.

    TWO GEOMETRIES FIND THE SAME DAMAGE FROM OPPOSITE SIDES, and both are
    needed: `_collisions` reads the raw runs, because merging fuses two texts
    printed on one baseline into one plausible line; `_holes` reads the merged
    ones, because a gap only means "missing" once the fragments a reader
    splits at a font change have been rejoined.
    """
    raw = read_lines(path, ed.backend)
    lines = [ln for ln in merge_runs(raw) if _is_text(ln, ed)]
    unreadable = _collisions(raw, ed) | _holes(lines, ed)
    return _blocks(lines, ed, unreadable, path.name, damaged, is_label)


def _is_text(line: Line, ed: PdfEdition) -> bool:
    """Whether a line is the book's text rather than its furniture."""
    text = line.text.strip()
    if not text:
        return False
    if any(re.match(pat, text) for pat in ed.furniture):
        return False
    size = round(line.size, 2)
    return size in ed.text_sizes or size > ed.body_size


def _collisions(lines: list[Line], ed: PdfEdition) -> set[tuple[int, int]]:
    """Rows carrying two texts printed on top of each other.

    THE 2018 REVISION OF §2267 WAS PASTED OVER THE 1997 TEXT WITHOUT REMOVING
    IT. Both are in the content stream, on the same baselines, at the same x
    -- and one line of the revision has no text layer at all, so no reader
    recovers it: `長久以來，合法當局在完成了合法程序後便訴諸死刑` is on the
    rendered page and nowhere in `pdftotext` over the whole file. What comes
    out of an extractor is the two texts interleaved, and it reads as a
    plausible if disjointed paragraph rather than as damage -- which is
    exactly the failure mode `compendium_pdf` was built around.

    Geometry finds it and the measurement is what makes the threshold safe.
    Over all 43 files, 25 pairs of runs on one baseline overlap horizontally
    at all: **20 of them are in §2267 and overlap by 95 to 376 points**; the
    other five are a closing bracket kerned into the run after it and overlap
    by 5 to 7. `PdfEdition.overlap` falls in the empty band between.

    Reported by ROW rather than by paragraph because that is what geometry
    knows; `_blocks` is where a row becomes a paragraph number.
    """
    hit: set[tuple[int, int]] = set()
    ordered = sorted(lines, key=lambda ln: (ln.page, ln.baseline, ln.x0))
    row: list[Line] = []
    for line in [*ordered, None]:
        if row and (
            line is None
            or line.page != row[0].page
            or line.baseline - row[0].baseline > _ROW_TOL
        ):
            if any(
                min(a.x1, b.x1) - max(a.x0, b.x0) > ed.overlap
                for i, a in enumerate(row)
                for b in row[i + 1 :]
            ):
                hit.update((ln.page, round(ln.baseline)) for ln in row)
            row = []
        if line is not None:
            row.append(line)
    return hit


#: How far two baselines may differ and still be one printed row. The same
#: 2.0 `merge_runs` groups by, and it has to be: a row this splits and that
#: one fuses would be a row whose collision is never seen at the granularity
#: the collision is reported in.
_ROW_TOL = 2.0

#: How many rows on a page have to break at the same x before the break is a
#: COLUMN rather than a hole. Three, and the book prints exactly one thing
#: that needs it: the table between §184 and §185 setting the Apostles' Creed
#: against the Nicene, seventeen rows of which break at x=305. Every real hole
#: in the edition is alone on its page at its own x.
_COLUMN_ROWS = 3


def _holes(lines: list[Line], ed: PdfEdition) -> set[tuple[int, int]]:
    """Rows with a gap where the reader handed back no glyphs.

    THE SECOND HALF OF WHAT THE 2018 REVISION DID TO ITS FILE. §2267 is not
    the only paragraph in `38_2258-2400_ccc_zh.pdf` whose text is on the
    rendered page and missing from the layer -- §2268, §2396 and §2397 have
    runs missing too, and unlike §2267 nothing about them looks wrong. §2396
    stores `性戀行為，都是嚴重違反貞潔的罪。`, a grammatical sentence, where
    the page prints `手淫、行淫、色情產品及同性戀行為，都是嚴重違反貞潔的罪。`
    and the first eleven characters are simply not in the file. Read without
    this the edition would have shipped four mutilated paragraphs, three of
    them silently.

    Geometry finds it because the book is set to a measure in one column: a
    body line runs unbroken from the indent to wherever it stops, so a GAP
    inside a row is text that was printed and not handed back. Measured over
    all 43 files at a 40-point floor: twenty rows have one, seventeen of them
    the Creed table's two columns and three of them these paragraphs. Nothing
    else in the edition has a gap of any width worth the name.

    THE COLUMN GUARD IS WHAT MAKES IT USABLE. A table is a page-wide fact --
    its second column starts at the same x on every row -- while a hole is
    idiosyncratic, so counting how many rows on a page break at the same
    place separates them without anything having to declare where the table
    is. It is the same argument `common/pdf._mode` makes about the body band:
    the repeated thing is the layout, the unrepeated thing is the exception.
    """
    gaps: list[tuple[Line, Line]] = []
    ordered = sorted(lines, key=lambda ln: (ln.page, ln.baseline, ln.x0))
    row: list[Line] = []
    for line in [*ordered, None]:
        if row and (
            line is None
            or line.page != row[0].page
            or line.baseline - row[0].baseline > _ROW_TOL
        ):
            gaps += [
                (a, b) for a, b in itertools.pairwise(row) if b.x0 - a.x1 > ed.hole
            ]
            row = []
        if line is not None:
            row.append(line)
    columns: dict[tuple[int, int], int] = {}
    for _, b in gaps:
        key = (b.page, round(b.x0 / _COLUMN_TOL))
        columns[key] = columns.get(key, 0) + 1
    return {
        (a.page, round(a.baseline))
        for a, b in gaps
        if columns[(b.page, round(b.x0 / _COLUMN_TOL))] < _COLUMN_ROWS
    }


#: How near two rows' break points have to be to count as the same column.
#: The Creed table's right column is reported at 305 on some rows and 306 on
#: others, which is the reader rounding a glyph box, not the typesetter
#: moving the column.
_COLUMN_TOL = 4.0


def _blocks(
    lines: list[Line],
    ed: PdfEdition,
    unreadable: set[tuple[int, int]],
    source: str,
    damaged: dict[int, list[str]],
    is_label,
) -> list[PdfBlock]:
    """One file's lines, grouped and classified."""
    out: list[PdfBlock] = []
    owner: int | None = None
    runs = _runs(lines, ed, is_label)
    for i, run in enumerate(runs):
        head = run[0]
        size = round(head.size, 2)
        number = _NUMBER_RE.match(head.text) if head.x0 < ed.hang else None
        text = _join(run)
        if number is not None:
            owner = int(number.group(1))
            kind = "quote" if size < ed.body_size else "prose"
        elif size > ed.body_size or (
            len(run) == 1
            and is_run_in_heading(text, ed)
            # A LABEL NEEDS NO CORROBORATION; A BARE LINE DOES. `撮要` names
            # a division and can only be one, so it is a heading wherever it
            # stands. An unlabelled short line is a heading only if what
            # follows it is numbered -- see `_heads_a_paragraph`.
            and (is_label(text) or _heads_a_paragraph(runs, i, ed))
        ):
            kind = "heading"
        else:
            kind = "quote" if size < ed.body_size else "prose"
        if owner is not None:
            bad = [
                f"{source} p{ln.page + 1}"
                for ln in run
                if (ln.page, round(ln.baseline)) in unreadable
            ]
            if bad:
                damaged.setdefault(owner, []).extend(bad)
        out.append(PdfBlock(kind, text, None if kind == "heading" else owner))
    return out


def _is_division_line(line: Line, ed: PdfEdition, is_label) -> bool:
    """Whether one line, on its own, names a division.

    BOTH TESTS, AND THE SECOND IS THE ONE THAT WAS LEARNED. `is_label` alone
    reads the enumeration this book numbers its lists with: §117 sets out the
    three spiritual senses as `一、寓意。`, `二、倫理。`, `三、末世。` and §126
    the three stages of the Gospels' formation the same way, all of them in
    the small citation type inside a paragraph, and all of them matching the
    `roman` pattern that heads a real subdivision. Taking them as divisions
    left §126 as its own colon -- fourteen characters against the English
    §126's thousand -- and it looked like a heading with a short answer under
    it rather than like damage. A division heads a page; a numbered clause
    ends in a full stop and is set two points smaller.
    """
    text = line.text.strip()
    return (
        round(line.size, 2) >= ed.body_size
        and is_run_in_heading(text, ed)
        and is_label(text) is not None
    )


def _heads_a_paragraph(runs: list[list[Line]], i: int, ed: PdfEdition) -> bool:
    """Whether the short line at `runs[i]` introduces numbered text.

    A DIVISION HEADS PARAGRAPHS; A RUN-IN QUESTION HEADS AN ANSWER. Both are
    set the same way in this book -- a short line in the body size at the body
    indent -- and the eight HTML editions separate them by a signal a PDF does
    not carry, which is that one is bold and the other is not. What is left is
    what follows: 與諾厄的盟約 ("The covenant with Noah") stands above §56, and
    甚麼是大赦？ ("What is an indulgence?") stands above the definition that is
    the rest of §1471.

    Getting it wrong is not visible in the tree, which is why it is worth a
    function. The heading reads perfectly either way; what changes is that
    the matter under it is finalized out of its paragraph and lands in
    `orphan_content`, costing §1471 the 554 characters of the *Indulgentiarum
    doctrina* definition. `is_mini_header` in `ccc.py` carries the same
    measurement from the other side -- the HTML editions truncated the same
    paragraph by the same 554 characters until their rule was narrowed -- and
    demoting the line to prose here hands it to exactly that rule, which
    drops the header and keeps the answer.

    The last run of a part-file has nothing after it to read, and the answer
    there is yes: a division may be the last thing a file prints, its
    paragraphs beginning in the next one, and an edition that opened a file
    with unnumbered matter would have nowhere to put it either way.
    """
    nxt = runs[i + 1] if i + 1 < len(runs) else None
    if nxt is None:
        return True
    return round(nxt[0].size, 2) > ed.body_size or (
        nxt[0].x0 < ed.hang and _NUMBER_RE.match(nxt[0].text) is not None
    )


def _runs(lines: list[Line], ed: PdfEdition, is_label) -> list[list[Line]]:
    """Lines grouped into the blocks the page sets them in.

    FIVE THINGS START A NEW BLOCK, and the last three are the ones worth
    stating:

      - a hanging line, which is a paragraph opening;
      - a change of type size, which is prose becoming a citation or a
        heading;
      - **a gap wider than `lead`**, which is the leading measurement in the
        module note;
      - **a page break, unless the line before it REACHED THE MEASURE.** A
        paragraph that runs over a page ends the page justified to the right
        edge; a paragraph that ends on the page stops short. Without this
        test every page began by continuing whatever was above it, and what
        that cost is a run-in heading at the top of a page -- "天主簡選亞
        巴郎" opening page 3 of the file carrying §§50-141 -- glued to the
        tail of the paragraph before, where it is neither a division nor
        visible. It is the same signal `compendium_pdf` reads in the
        Compendium's prayer appendix, for the same reason: a printed line
        that stops short is a break the editor made.
      - **a line the edition LABELS, wherever the leading puts it.** The book
        sets 撮要 (IN BRIEF) at the body size with the ordinary 18 points of
        leading above it wherever the page is full, so on those pages the
        leading test alone folds the heading into the answer above -- which
        cost the in-brief closing Article 7 on marriage, and cost it as one
        node against the eight HTML editions' eighty-one. A line that carries
        the edition's own label for a division is a division whatever the
        page had room for, and it is the one break that can be taken on the
        text rather than on the geometry.
      - **a second run on the SAME baseline, which is a second column.** The
        book sets one column and prints exactly one table, between §184 and
        §185, comparing the Apostles' Creed with the Nicene: two columns, the
        headings on one baseline and every line of the two creeds paired on
        its own. `merge_runs` already declines to join them -- they are 200
        points apart -- so what arrives here is two runs at one baseline, and
        grouping them by leading alone read the two column HEADINGS as one
        division, "宗徒信經尼西亞、君士坦丁堡信經". Zero leading is not
        leading.
    """
    if not lines:
        return []
    measure = _measure(lines)
    # BY BASELINE, NOT BY BOX TOP. `common/pdf` sorts its output in
    # page-then-`y0` order, which is right for a page whose rows are all one
    # size and wrong for this one: the hanging number is set in Calibri and
    # its box starts two points BELOW the Chinese it introduces, so a number
    # whose text did not merge with it sorts after that text and the block it
    # opens is credited to the paragraph before. It cost one paragraph and
    # cost it invisibly -- §2396 is one of the three the reader refuses, and
    # under `y0` the refusal landed on §2395, which is read perfectly.
    lines = sorted(lines, key=lambda ln: (ln.page, ln.baseline, ln.x0))
    out: list[list[Line]] = []
    run: list[Line] = [lines[0]]
    for line in lines[1:]:
        prev = run[-1]
        if line.page != prev.page:
            same = prev.x1 >= measure and round(line.size, 2) == round(prev.size, 2)
        else:
            same = (
                round(line.size, 2) == round(prev.size, 2)
                and _ROW_TOL < line.baseline - prev.baseline <= ed.lead
                and not _is_division_line(line, ed, is_label)
            )
        if line.x0 < ed.hang or not same:
            out.append(run)
            run = [line]
        else:
            run.append(line)
    out.append(run)
    return _fuse_headings(out, ed)


#: How far short of the modal right edge a line may stop and still count as
#: having reached the measure. One character of the body size: this book
#: justifies to a full-width glyph, so the last box on a full line ends within
#: a glyph of the edge and never exactly on it.
_MEASURE_SLACK = 12.0


def _measure(lines: list[Line]) -> float:
    """The right edge the body justifies to.

    Read from the text rather than from the page box, the same way
    `common/pdf.body_column` reads it and for the same reason -- the files
    differ in their left indent by twelve points and there is no reason to
    believe they agree about anything else.
    """
    edges: dict[int, int] = {}
    for line in lines:
        edges[round(line.x1)] = edges.get(round(line.x1), 0) + 1
    return max(edges.items(), key=lambda kv: (kv[1], kv[0]))[0] - _MEASURE_SLACK


def _fuse_headings(runs: list[list[Line]], ed: PdfEdition) -> list[list[Line]]:
    """Rejoin a heading the page set over two lines.

    Five of them, and all five break after a comma, an enumeration comma or a
    colon -- `「耶穌基督在比拉多執政時蒙難，` / `被釘在十字架上，死而被安葬」`,
    which is Article 4 of the Creed. They are 36 points apart, exactly as far
    as two paragraphs, so leading cannot see it and the mark is the only
    signal. Narrow because the thing is rare, and measured rather than
    guessed: no other line above the body size ends in one of those marks.
    """
    out: list[list[Line]] = []
    for run in runs:
        prev = out[-1] if out else None
        if (
            prev is not None
            and round(prev[-1].size, 2) > ed.body_size
            and round(run[0].size, 2) == round(prev[-1].size, 2)
            and prev[-1].text.strip()[-1:] in ed.heading_continues
        ):
            prev.extend(run)
            continue
        out.append(run)
    return out


def is_run_in_heading(text: str, ed: PdfEdition) -> bool:
    """Whether a one-line block set in the body size is a run-in heading.

    Public because the walker needs the SAME rule: `process_page` asks
    `is_mini_header` of any unnumbered prose it meets, and an edition that
    answered that question one way here and another way there would drop as
    display matter what it had just called a division. The HTML editions
    count words and this one counts characters, which is the whole of the
    difference -- a Chinese line is one word.
    """
    stripped = text.strip()
    return bool(
        stripped
        and len(stripped) <= ed.sub_max_chars
        and stripped[-1] not in ed.terminal
    )


def _join(run: list[Line]) -> str:
    """One block's lines as one string, joined with NOTHING.

    Chinese is set without word spaces and broken without hyphens, so the
    line boundary carries no character of its own and inserting one would put
    a space inside every wrapped sentence -- which `validate` would not catch,
    because a single space is legal. `compendium_pdf._join_prose` joins with a
    space and closes up hyphens for exactly the opposite reason. The
    Latin-script words this edition sets inline (`(apostolic succession)`,
    `(Abram)`) are short enough that the source never breaks one across a
    line.
    """
    return "".join(line.text.strip() for line in run)


def drop_restated_banner(
    blocks: list[PdfBlock], match_label, is_bare_label, stack
) -> list[PdfBlock]:
    """The file's opening banner, minus every division already open.

    Stops at the first heading the file genuinely introduces: the banner is a
    chain from the outermost division inward, so once one of them is new,
    everything under it is.

    A LABEL PRINTED ALONE TAKES ITS TITLE WITH IT. The banner sets the label
    and the name on separate lines (`卷一`, then `信仰的宣認`), which is the
    same shape `process_page` rejoins for the HTML editions and which it would
    rejoin here too -- so dropping the label alone leaves the name behind as a
    subdivision of nothing. The test for "printed alone" is the editions'
    own, passed in rather than imported to keep this module ignorant of
    `ccc.py`.
    """
    i = 0
    while i < len(blocks) and blocks[i].kind == "heading":
        if not restated(blocks[i], match_label, stack):
            break
        bare = is_bare_label(blocks[i].text)
        i += 1
        if (
            bare
            and i < len(blocks)
            and blocks[i].kind == "heading"
            and match_label(blocks[i].text) is None
        ):
            i += 1
    return blocks[i:]


def restated(block: PdfBlock, match_label, stack) -> bool:
    """Whether a heading names a division that is already open.

    EVERY PART-FILE REPRINTS ITS ANCESTORS above its first paragraph -- the
    work's title, then the Part, the Section, the Chapter, the Article -- and
    read as headings they open a second copy of each. `push_heading` already
    merges a restated banner into the sibling before it, which is how the
    Portuguese mirror's per-chapter pages are handled, and that is not enough
    here for two reasons this book supplies:

      - **the banner is sometimes MISORDERED.** The file carrying §§355-421
        prints `第一條` (Article 1) above `第一章` (Chapter 1), so read in
        order the article is created first and the chapter then closes it.
      - **the banner is sometimes SHORT.** The file carrying §§484-511 names
        the Part and the Chapter and omits the Section between them, which
        read in order attaches the chapter to the Part.

    Both stop being questions once a restated heading is DROPPED instead of
    pushed: the divisions it names are open already, the stack is right
    without it, and the first heading the file actually introduces pops back
    to its own level in the ordinary way. Only a heading naming an open
    division qualifies, so a genuinely new one is untouched wherever it sits.
    """
    label = match_label(block.text)
    if label is None:
        return False
    kind, n = label
    return any(node.kind == kind and node.n == n for node in stack)
