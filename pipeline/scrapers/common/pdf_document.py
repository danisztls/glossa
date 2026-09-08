"""A document PDF, rendered as the markup this project's document parser reads.

WHY MARKUP AND NOT A SECOND PARSER. `vatican_docs.parse_document` is where a
numbered document becomes a work: it finds the paragraph numbers, resolves
the footnote markers against the note list, levels the headings into a
structure tree, applies the corrections and overrides, and hands
`validate_document` something to judge. None of that is about HTML. What IS
about HTML is its input -- a block stream with `<sup>` markers and a note
list -- so a PDF that can be turned into that stream gets the whole of it for
free, and an edition read from a PDF comes out shaped exactly like an edition
read from the mirror. A second parser would be a second place for a document
rule to live, and the two would disagree within a month.

WHAT THIS MODULE IS RESPONSIBLE FOR is therefore only what a PDF has and a
web page does not: the typography. Which rows are body and which are the
notes at the foot; which small digits are footnote markers and which are a
page number; where one paragraph ends and the next begins when nothing in the
file says so. Every one of those is decided from measurements of the file in
hand -- the type sizes, the margins, the line pitch -- and never from a
constant, because these editions were made over twenty years by four
different producers and share no house style.

WHAT IT DOES NOT DO. Nothing here reads right-to-left text correctly:
MuPDF fragments an RTL line into pieces that arrive in visual order, which
`docs/research/pdf-editions.md` measured on the Arabic Catechism. The Arabic,
Hebrew and Chinese editions want the reader poppler gives and a normalisation
pass of their own; this module declares its backend so that work can supply a
different one rather than fight this one.
"""

from __future__ import annotations

import collections
import html as html_module
import itertools
import re
import statistics
from dataclasses import dataclass, field
from pathlib import Path

from .pdf import Line, page_boxes, read_lines

#: How much smaller than its own row a digit has to be set to be a footnote
#: marker rather than a number the author wrote. Markers measure 38-55% of
#: their row across these editions (5.0 against 13.0 in `amoris-laetitia.en`,
#: 6.0 against 11.0 in `verbum-domini.la`), and no edition sets a marker
#: above 60%, so three-quarters is a wide margin on a real gap.
#:
#: THERE IS NO SUCH GAP BENEATH THE BODY SIZE, which a ratio here first
#: assumed and the Latin edition refuted: it sets its notes at 11.0pt against
#: a 13.0pt body, 85%, where `amoris-laetitia.en` sets its own at 54-77%. A
#: threshold anywhere in that range is right for one edition and wrong for
#: the other, and being wrong costs the whole note apparatus silently -- the
#: walk up from the foot of the page meets a row it calls body and stops. So
#: the note block is separated by being SMALLER THAN THE BODY AT ALL, with
#: the marker below carrying the weight of the judgment.
MARKER_RATIO = 0.75

#: Float noise on a size read out of a PDF, in points.
SIZE_EPSILON = 0.5

#: How far off a row's baseline a raised fragment may sit and still belong to
#: it, as a fraction of the type size. A superscript marker's baseline is
#: above its line's by about a third of the type size (4.0pt at 13.0pt in
#: `amoris-laetitia.en`); the next line down is a whole line pitch away,
#: which is never less than the type size itself. Measured rather than
#: assumed because `pdf._rows` uses a FIXED 2.0pt tolerance, which is right
#: for its own callers -- two-up Compendium pages, where nothing is raised --
#: and puts every marker in this corpus on a row of its own.
RAISED_RATIO = 0.45

#: A digit run set small: a footnote marker in the body, or the number
#: opening an entry in the note list. `*` and `†` are here because the
#: Vatican II documents carry a second, starred series alongside the numeric
#: one (`vatican_docs.build_chapter_scoped_star_table`).
_MARKER_RE = re.compile(r"^\s*([0-9]{1,3}|[*†]{1,3})\s*$")

#: The soft hyphen these producers write at a line break they made
#: themselves. It is not punctuation the author typed: it exists only
#: because the line ended there, so it comes out and the halves are joined.
#: `verbum-domini.la` and `amoris-laetitia.en` both mark hyphenation this
#: way; an edition that instead breaks on a real `-` is handled by
#: `_join_rows`, which keeps that character and still closes the line.
SOFT_HYPHEN = "­"


@dataclass(frozen=True)
class Layout:
    """What one file's typography measured, and what it was measured from."""

    body_size: float
    #: Every distinct type size in the file, by how many characters are set
    #: in it. Carried so a caller can print the evidence for the split
    #: rather than trust it -- see this module's docstring on the gap.
    sizes: tuple[tuple[float, int], ...]
    left: float
    line_pitch: float
    page_height: float

    def is_small(self, size: float) -> bool:
        """Set smaller than the body: a note, an epigraph, a marker."""
        return size < self.body_size - SIZE_EPSILON

    @classmethod
    def measure(cls, fragments: list[Line], heights: list[float]) -> Layout:
        by_size: collections.Counter = collections.Counter()
        for frag in fragments:
            by_size[round(frag.size, 1)] += len(frag.text.strip())
        body_size = by_size.most_common(1)[0][0] if by_size else 10.0
        body = [f for f in fragments if abs(f.size - body_size) < 0.05]
        # The left margin is where MOST body rows begin, not the leftmost
        # thing on the page: a paragraph number set in the margin, a folio
        # and a note's own number all sit further left than the measure.
        left = statistics.mode([round(f.x0) for f in body]) if body else 0.0
        baselines = sorted({(f.page, round(f.baseline, 1)) for f in body})
        gaps = [
            b - a
            for (p1, a), (p2, b) in itertools.pairwise(baselines)
            if p1 == p2 and 0 < b - a < body_size * 4
        ]
        return cls(
            body_size=body_size,
            sizes=tuple(sorted(by_size.items())),
            left=float(left),
            line_pitch=statistics.median(gaps) if gaps else body_size * 1.2,
            page_height=statistics.median(heights) if heights else 792.0,
        )


@dataclass
class Row:
    """One printed line: the fragments the reader put on a single baseline."""

    page: int
    baseline: float
    fragments: list[Line]

    @property
    def x0(self) -> float:
        return min(f.x0 for f in self.fragments)

    @property
    def x1(self) -> float:
        return max(f.x1 for f in self.fragments)

    @property
    def lead(self) -> Line:
        """The fragment that characterises the row: its widest."""
        return max(self.fragments, key=lambda f: f.x1 - f.x0)

    @property
    def size(self) -> float:
        return self.lead.size

    def text(self, layout: Layout | None = None) -> str:
        return _join_fragments(self.fragments, layout)


def _join_fragments(fragments: list[Line], layout: Layout | None) -> str:
    """The row's text, with the spaces the reader dropped at its own
    fragment boundaries restored, and any raised digit marked as a footnote.

    The space rule is `pdf._join`'s, for the reason given there: a gap wider
    than a quarter of the type size was a space in the file. What is added
    here is the marker, which has to happen at this level because it is
    exactly the information that disappears once the row is a string --
    `.1` and `.1` read the same whether the 1 was raised or typed.

    THE TYPE SIZE THE THRESHOLD SCALES BY IS THE SMALLER OF THE TWO, which
    `pdf._join` had no reason to decide: its fragments are the same size. A
    line set in small capitals is not -- the capitals are the body face and
    everything else is four points smaller -- and the space between them is
    set in the smaller face. Taking the larger read `Synod of Bishops` as
    `Synod ofBishops` in every note this edition prints."""
    parts: list[str] = []
    # The row's own type, which is what a marker is small RELATIVE TO. Taken
    # from the widest fragment for `_fuse`'s reason: it is the one that
    # characterises the row.
    lead = max((f.x1 - f.x0, f.size) for f in fragments)[1] if fragments else 0.0
    for prev, frag in itertools.pairwise([None, *fragments]):
        text = frag.text
        if (
            layout is not None
            and frag.size < lead * MARKER_RATIO
            and _MARKER_RE.match(text)
        ):
            text = f"<sup>{html_module.escape(text.strip())}</sup>"
        else:
            text = html_module.escape(text)
        if prev is not None:
            gap = 0.25 * (min(frag.size, prev.size) or frag.size or prev.size or 10.0)
            if (
                frag.x0 - prev.x1 > gap
                and parts
                and not parts[-1].endswith(" ")
                and not text.startswith(" ")
                and not text.startswith("<sup>")
            ):
                parts.append(" ")
        parts.append(text)
    return "".join(parts)


def rows_of(fragments: list[Line], layout: Layout) -> list[Row]:
    """Fragments grouped into printed lines, in reading order.

    Grouped at `RAISED_RATIO` of the type size rather than `pdf.merge_runs`'s
    fixed 2.0pt so that a raised footnote marker stays on the line it marks.
    See that constant."""
    tol = max(layout.body_size * RAISED_RATIO, 2.0)
    rows: list[Row] = []
    for page in sorted({f.page for f in fragments}):
        on_page = sorted(
            (f for f in fragments if f.page == page), key=lambda f: (f.baseline, f.x0)
        )
        run: list[Line] = []
        for frag in on_page:
            # Against the run's LOWEST baseline, which is the body's: a
            # marker sits above it, and comparing against the first fragment
            # seen would let a marker at the head of a row pull the row's
            # datum up with it.
            if run and frag.baseline - max(f.baseline for f in run) > tol:
                rows.append(
                    Row(
                        page,
                        max(f.baseline for f in run),
                        sorted(run, key=lambda f: f.x0),
                    )
                )
                run = []
            run.append(frag)
        if run:
            rows.append(
                Row(page, max(f.baseline for f in run), sorted(run, key=lambda f: f.x0))
            )
    return rows


#: What a folio can be made of: arabic or roman, with the rules and brackets
#: some editions set around it.
_FOLIO_RE = re.compile(r"^[\[\(\-–—\s]*[0-9ivxlcIVXLC]{1,6}[\]\)\-–—.\s]*$")

#: A contents line, by the leader of dots that carries the eye to the page
#: number. Three groups rather than one because a wrapped entry's first line
#: has no leader at all and a stray ellipsis in prose has exactly one.
_LEADER_RE = re.compile(r"(\.\s*){5,}")


def drop_furniture(rows: list[Row], layout: Layout) -> tuple[list[Row], list[str]]:
    """Take the folios, running heads and printed contents off each page.

    A FOLIO IS NOT FOUND BY BEING SMALL OR BY BEING NEAR THE EDGE.
    `amoris-laetitia.en` sets its page numbers in the body face at the body
    size and 29pt below the last note -- inside the bottom eighth of the page
    but well outside the bottom twelfth, which is what a fixed fraction of the
    page had made of it, and which cost every note on 88 of its 264 pages: the
    folio stayed, the walk up from the foot met a body-sized row immediately,
    and the note block above it read as text.

    What identifies it is the page's own setting: a row of nothing but a
    number, first or last on its page, and separated from the text by more
    than a line. Both halves are needed -- a numbered paragraph can be a bare
    number on its own row mid-page, and a folio can sit anywhere in the
    margin an edition chooses.

    A running head is recognised by repetition instead: the same text, with
    its numbers folded away, at the same height on eight pages or more.

    A PRINTED CONTENTS IS A PAGE, NOT A BLOCK. `parse_document` already drops
    an outline it can recognise, and cannot recognise this one: these entries
    are not headings, carry no links, and are told from the document's prose
    only by the leader of dots running to a page number. A page carrying
    three of those is the volume's own table of contents, and none of it is
    the document."""
    notes: list[str] = []
    dropped: collections.Counter = collections.Counter()
    pages = [list(g) for _p, g in itertools.groupby(rows, key=lambda r: r.page)]
    # Counted over the FIRST row of each page and nowhere else. A running
    # head is at the head; counting every row instead made the test a
    # frequency test over the whole book, and this document's note list is
    # full of short repeated entries -- `260 Ibid., 50.` normalises to
    # `# Ibid., #.`, which recurs on more than eight pages, so a real
    # footnote was dropped as furniture and its citation resolved to nothing.
    heads: collections.Counter = collections.Counter(
        (round(p[0].baseline / 4), re.sub(r"\d+", "#", p[0].text().strip()))
        for p in pages
        if p
    )
    kept: list[Row] = []
    for page_rows in pages:
        contents = sum(bool(_LEADER_RE.search(r.text())) for r in page_rows)
        if contents >= 3:
            dropped["contents pages"] += 1
            continue
        first, last = 0, len(page_rows) - 1
        for i, row in enumerate(page_rows):
            text = row.text().strip()
            neighbour = (
                page_rows[i - 1]
                if i == last
                else (page_rows[i + 1] if i == first and len(page_rows) > 1 else None)
            )
            apart = (
                neighbour is None
                or abs(row.baseline - neighbour.baseline) > layout.line_pitch * 1.5
            )
            if i in (first, last) and apart and _FOLIO_RE.match(text):
                dropped["folios"] += 1
                continue
            # A head has to say something: a row of nothing but numbers is
            # the folio's business above, and `#` alone would match it.
            if (
                i == first
                and re.search(r"[^\W\d_]", text)
                and heads[(round(row.baseline / 4), re.sub(r"\d+", "#", text))] >= 8
            ):
                dropped["running heads"] += 1
                continue
            kept.append(row)
    for what, n in sorted(dropped.items()):
        notes.append(f"{what} dropped: {n}")
    return kept, notes


def split_notes(
    rows: list[Row], layout: Layout
) -> tuple[list[Row], list[Row], list[str]]:
    """Separate each page's body from the note block at its foot.

    THE NOTES ARE FOUND FROM THE BOTTOM UP, and the rule is one fact about
    the page rather than a threshold: the note block is the run of small-set
    rows that reaches the foot of the page, and it opens at the highest of
    those rows whose first fragment is a small digit. Reading downward
    instead -- "the first small row is where the notes start" -- puts an
    epigraph set in small caps at the head of a chapter into the note list,
    which is where `amoris-laetitia.en`'s twelve chapter epigraphs went the
    first time this was written.

    A page with no small rows at its foot has no notes, which is the common
    case: 174 of this document's 264 pages."""
    body: list[Row] = []
    notes: list[Row] = []
    pages_with_notes = 0
    for _page, page_rows in itertools.groupby(rows, key=lambda r: r.page):
        page_rows = list(page_rows)
        cut = len(page_rows)
        for i in range(len(page_rows) - 1, -1, -1):
            row = page_rows[i]
            if not layout.is_small(row.size):
                break
            first = row.fragments[0]
            if first.size < row.size * MARKER_RATIO and _MARKER_RE.match(first.text):
                cut = i
        body.extend(page_rows[:cut])
        notes.extend(page_rows[cut:])
        pages_with_notes += cut < len(page_rows)
    return body, notes, [f"pages carrying notes: {pages_with_notes}"]


def _join_rows(rows: list[Row], layout: Layout) -> str:
    """One block's rows as running text, closing the breaks the setting made.

    A row ending in a soft hyphen was broken by the typesetter and is closed
    up with nothing between; a row ending in a real hyphen keeps it and is
    closed up too, because a hyphen at a line end is either the word's own or
    the break's and either way no space belongs there. Everything else joins
    with a space."""
    out: list[str] = []
    for row in rows:
        text = row.text(layout).rstrip()
        if text.endswith(SOFT_HYPHEN):
            out.append(text[: -len(SOFT_HYPHEN)])
        elif text.endswith("-"):
            out.append(text)
        else:
            out.append(text + " ")
    return "".join(out).strip()


#: A paragraph opening with its own number: `13.` at the head of the row.
#: The number may be followed by a period or a right parenthesis; both are
#: printed in this corpus.
_PARA_OPEN_RE = re.compile(r"^\s*(\d{1,4})\s*[.)]\s")


@dataclass
class Block:
    """One block of the document, as the markup will carry it."""

    kind: str  # "prose" | "heading" | "quote"
    rows: list[Row] = field(default_factory=list)
    #: An ornamental first letter, which is not in `rows` because it is not
    #: on any of their baselines. See `take_initials`.
    initial: str = ""


#: How much larger than the body an ornamental initial is set. `§1` of
#: `amoris-laetitia.en` is the only one in that edition and is 37.0pt against
#: a 13.0pt body -- but a two-line initial can be as little as double, so the
#: test is deliberately loose and carries two other conditions: one character,
#: and a paragraph beginning beside it.
INITIAL_RATIO = 1.6


def take_initials(rows: list[Row], layout: Layout) -> tuple[list[Row], list[Line]]:
    """Lift ornamental initials out of the rows before anything reads them.

    A DROP CAP HAS NO LINE OF ITS OWN, and that is the whole problem. It
    stands three lines deep in the margin, so the reader gives it whichever
    baseline it happens to overlap and `_join_fragments` then places it by x
    within that line: `amoris-laetitia.en`'s opening paragraph came out
    `1. he Joy of Love experienced by families Tis also the joy`, which reads
    as prose and passes every check the corpus has. Taken out here, it is put
    back where the printer put it -- at the head of the paragraph -- by
    `blocks_of`."""
    initials = [
        f
        for row in rows
        for f in row.fragments
        if f.size >= layout.body_size * INITIAL_RATIO and len(f.text.strip()) == 1
    ]
    if not initials:
        return rows, []
    drop = {id(f) for f in initials}
    kept = [
        Row(r.page, r.baseline, [f for f in r.fragments if id(f) not in drop])
        for r in rows
    ]
    return [r for r in kept if r.fragments], initials


def front_matter_pages(body: list[Row]) -> set[int]:
    """The leading pages printed before the document's own text begins.

    A TITLE PAGE IS NOT FOUND BY ITS TYPE. Five of these editions set their
    masthead in display sizes and five set it in the body size, so the size
    says nothing; what says everything is that the text has not started yet.
    The leading run of pages carrying no numbered paragraph is front matter,
    and it stops at the first page that carries one -- which is the same
    boundary the printer used."""
    front: set[int] = set()
    for page, page_iter in itertools.groupby(body, key=lambda r: r.page):
        if any(_PARA_OPEN_RE.match(r.text().strip()) for r in page_iter):
            break
        front.add(page)
    return front


def blocks_of(
    body: list[Row], layout: Layout, initials: list[Line] | None = None
) -> tuple[list[Block], list[str]]:
    """Group body rows into the blocks a document is made of.

    THE PARAGRAPH NUMBER IS THE BOUNDARY, and it is the only one that can be
    trusted across these editions. Indentation is not: `amoris-laetitia.en`
    sets its first line flush and hangs the number in the margin, while
    `verbum-domini.la` indents. A short last line is not either, because the
    measure is narrow enough that a full line often falls short.

    What that leaves is everything printed BETWEEN two numbered paragraphs --
    headings, epigraphs, verse -- and those are split on the two signals a
    page really carries: a change of type size, and a vertical gap wider than
    the line pitch."""
    blocks: list[Block] = []
    notes: list[str] = []
    numbered = 0
    front = front_matter_pages(body)
    for prev, row in itertools.pairwise([None, *body]):
        text = row.text().strip()
        if not text:
            continue
        if row.page in front:
            # One block per front-matter page, which is what the masthead is
            # on the mirror: `extract_document_header` reads a leading block
            # and asks whether it names the document or its author, and the
            # HTML editions give it all of that in ONE block divided by
            # `<br/>`. Printed, the same masthead is eight separate lines,
            # and the scan stopped at the first that named neither -- so
            # `amoris-laetitia.en` opened §1 with `TO BISHOPS, PRIESTS AND
            # DEACONS ... ON LOVE IN THE FAMILY`, six lines of address
            # clause, where its Italian sibling has them in the masthead.
            if (
                blocks
                and blocks[-1].kind == "front"
                and blocks[-1].rows[0].page == row.page
            ):
                blocks[-1].rows.append(row)
            else:
                blocks.append(Block("front", [row]))
            continue
        small = layout.is_small(row.size)
        opens = _PARA_OPEN_RE.match(text) and not small
        broke = (
            prev is None
            or prev.page != row.page
            or layout.is_small(prev.size) != small
            or row.baseline - prev.baseline > layout.line_pitch * 1.6
        )
        if opens:
            numbered += 1
            blocks.append(Block("prose", [row]))
        elif broke or not blocks:
            blocks.append(Block("quote" if small else "prose", [row]))
        else:
            blocks[-1].rows.append(row)
    notes.append(f"numbered paragraphs found: {numbered}")

    # An initial belongs to the block that opens beside it: same page, first
    # row within the letter's own depth, and set to its right. Matched here
    # rather than in `take_initials` because "the block that opens beside it"
    # does not exist until the blocks do.
    placed = 0
    for letter in initials or []:
        for block in blocks:
            head = block.rows[0]
            # Vertical overlap only. An x test looks obvious and is wrong:
            # this edition hangs the paragraph NUMBER to the left of the
            # initial, so the block's own x0 is left of the letter and
            # `head.x0 >= letter.x1` matched nothing at all.
            if (
                head.page == letter.page
                and letter.y0 - layout.line_pitch
                <= head.baseline
                <= letter.y1 + layout.line_pitch
            ):
                block.initial = letter.text.strip()
                placed += 1
                break
    if initials:
        notes.append(f"ornamental initials: {len(initials)}, placed {placed}")
    return blocks, notes


def note_entries(notes_rows: list[Row], layout: Layout) -> list[tuple[str, list[Row]]]:
    """The note block's rows grouped into entries, keyed by printed number.

    An entry opens where a row's first fragment is a small digit, which is
    how the list prints its own numbers; every row after it belongs to it
    until the next one opens. A note that runs over a page break therefore
    continues correctly, because the continuation carries no number and the
    open entry is still the last one seen."""
    entries: list[tuple[str, list[Row]]] = []
    for row in notes_rows:
        first = row.fragments[0]
        m = _MARKER_RE.match(first.text)
        if m and first.size < row.size * MARKER_RATIO:
            entries.append(
                (m.group(1).strip(), [Row(row.page, row.baseline, row.fragments[1:])])
            )
        elif entries:
            entries[-1][1].append(row)
    return entries


@dataclass(frozen=True)
class Rendered:
    """The markup, and everything measured on the way to it."""

    html: str
    #: Offset into `html` at which the note list begins, for
    #: `parse_document(footnote_start=...)` -- which is exact where every
    #: signal that reads the page in isolation is inference.
    footnote_start: int
    layout: Layout
    notes: tuple[str, ...]


def render(path: Path, *, backend: str = "mupdf") -> Rendered:
    """Read `path` and return the markup for `vatican_docs.parse_document`."""
    fragments = [f for f in read_lines(path, backend) if f.text.strip()]
    heights = [b.height for b in page_boxes(path)]
    layout = Layout.measure(fragments, heights)
    rows = rows_of(fragments, layout)
    rows, furniture_notes = drop_furniture(rows, layout)
    rows, initials = take_initials(rows, layout)
    body_rows, notes_rows, note_notes = split_notes(rows, layout)
    blocks, block_notes = blocks_of(body_rows, layout, initials)

    parts: list[str] = []
    for block in blocks:
        if block.kind == "front":
            # Line for line as printed, which is how the mirror serves a
            # masthead and what `extract_document_header` reads.
            lines = "<br/>".join(r.text(layout).strip() for r in block.rows)
            parts.append(f"<p>{lines}</p>")
            continue
        text = _join_rows(block.rows, layout)
        if block.initial:
            # After the paragraph's own number, which the printer set in the
            # margin and the initial follows: `1. The Joy of Love`, never
            # `T1. he Joy of Love`.
            opening = _PARA_OPEN_RE.match(text)
            at = opening.end() if opening else 0
            text = text[:at] + block.initial + text[at:]
        if not text.strip():
            continue
        parts.append(f"<p>{text}</p>")
    body_html = "\n".join(parts)

    foot_parts: list[str] = []
    for marker, rows_ in note_entries(notes_rows, layout):
        text = _join_rows(rows_, layout)
        # The bare `N text` shape `build_footnote_table` falls through to,
        # one entry per block, which is what the Vatican II pages print and
        # what this list is: a number and its note, with no anchor to key on.
        foot_parts.append(f"<p>{marker} {text}</p>")

    region = body_html + ("\n" if foot_parts else "") + "\n".join(foot_parts)
    head = '<div class="testo">\n'
    html = head + region + "\n<!-- /TESTO -->\n</div>"
    return Rendered(
        html=html,
        footnote_start=len(body_html) + (1 if foot_parts else 0),
        layout=layout,
        notes=(
            f"type sizes (size, characters): {list(layout.sizes)}",
            (
                f"body {layout.body_size}pt, left margin {layout.left}, "
                f"line pitch {layout.line_pitch}"
            ),
            *furniture_notes,
            *note_notes,
            *block_notes,
            f"note entries: {len(foot_parts)}",
        ),
    )
