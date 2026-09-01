"""Reading text, with coordinates, out of a born-digital PDF.

WHAT THIS IS FOR. Six editions vatican.va publishes are PDF and nothing here
read one until now: the Compendium in Byelorussian, Indonesian, Lithuanian
and Russian, and the Catechism in Arabic and Traditional Chinese. All six
carry a real text layer -- measured, not assumed -- so **none of this is
OCR**, and that distinction is the whole reason this module is allowed to
exist at all. OCR is not a pure function of a file: a different engine build
reads a digit differently, which is why the Doré plate anchors were retired
into a committed table (CLAUDE.md). Text extraction IS a function of the
file, near enough that the remaining drift is a version of a reader binary,
and `rebuild.py`'s `readers` fingerprint is what makes that drift visible.

WHY THERE ARE TWO BACKENDS, which is the fact to understand before editing
anything here. No single tool reads all six, and the two failures are exact
opposites:

  - **MuPDF sees only what is painted.** The Indonesian Compendium carries a
    residual Italian layer -- the original text, invisible, still in the
    content stream -- which poppler emits and MuPDF does not. Extracted with
    poppler, page 19 reads `1. Qual è il disegno di Dio per l'uomo?` woven
    through `Apa rencana Allah untuk manusia?`. There is no optional-content
    group in the file, so nothing declares the layer hidden; MuPDF simply
    honours the render mode. That edition is MuPDF-only.
  - **poppler guesses where MuPDF refuses.** The Russian Compendium's fonts
    carry no `ToUnicode` map. MuPDF answers U+FFFD for every glyph; poppler
    passes the underlying byte through, and the custom encoding turns out to
    be cp1251, so the text is recoverable by re-decoding. That edition is
    poppler-only.

So the backend is a per-edition DECLARED value, which is what lets this
module stay in `common/` at all: it knows how to run two readers and hand
back one shape, and nothing about any edition. Everything that is a claim
about a particular source -- which reader, which re-decode, which glyph is
unmapped, which margin holds the cross-references -- belongs beside that
source's scraper.

WHAT A CALLER GETS is a flat list of `Line`, sorted in page-then-reading
order, each carrying its bounding box and (from MuPDF only) its font. Line
granularity rather than word or character is deliberate: it is the coarsest
unit that still answers every question these editions actually pose -- which
column is this in, is this a heading, where does this hyphen fall -- and both
readers report it natively, so neither has to be re-grouped into the other's
idea of a line.

FONT METADATA IS MUPDF-ONLY, and callers must not require it. poppler's
`-bbox-layout` reports geometry and nothing else, so `weight`, `style` and
`size` come back empty from that backend. This is not a gap to fill later: the
editions that need a typographic heading signal are the three MuPDF reads, and
inventing a bold-detector for poppler to keep the shapes symmetrical would be
writing code for no caller.
"""

from __future__ import annotations

import itertools
import json
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import Path

from .binaries import run_binary

#: poppler emits its bbox output as XHTML, so every tag is namespaced.
_XHTML = "{http://www.w3.org/1999/xhtml}"

#: C0 controls other than tab/newline/carriage-return. `pdftotext
#: -bbox-layout` writes extracted bytes into its XML without re-escaping
#: them, so a file whose fonts have no `ToUnicode` -- the Russian Compendium
#: -- produces a document no XML parser will accept. Removing exactly these
#: is safe for the recovery that file needs: they are control positions in
#: cp1251 as well as in Latin-1, so none of them is a letter that the
#: re-decode would otherwise have turned into Cyrillic.
_C0 = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


@dataclass(frozen=True)
class Line:
    """One row of text as a reader reported it.

    Coordinates are PDF points with the origin at the top left, y growing
    downward -- which is what both readers already emit, and is worth stating
    because PDF's own coordinate space has y growing upward. Nothing here
    flips it; the readers do.
    """

    page: int
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    #: MuPDF only. Empty string / 0.0 from poppler -- see the module note.
    font: str = ""
    weight: str = ""
    style: str = ""
    size: float = 0.0
    #: The text's BASELINE, which is what says two fragments are on the same
    #: visual line. `y0` is the top of the bounding box and cannot: in a
    #: display heading the box around `šk` starts 3pt above the box around
    #: `oj`, so grouping by `y0` splits one line into three and then
    #: interleaves them by x -- "Krikščioniškojo slėpinio šventimas" came out
    #: as "kščionišk ėp Kri ojo sl inio šventimas". MuPDF reports the baseline
    #: as its own field; poppler does not, so this falls back to the box
    #: bottom, which varies far less than the top because descenders are
    #: rarer than ascenders and diacritics.
    baseline: float = 0.0

    @property
    def bold(self) -> bool:
        return self.weight == "bold"

    @property
    def italic(self) -> bool:
        return self.style == "italic"

    def with_text(self, text: str) -> Line:
        return Line(
            self.page,
            self.x0,
            self.y0,
            self.x1,
            self.y1,
            text,
            self.font,
            self.weight,
            self.style,
            self.size,
            self.baseline,
        )


@dataclass(frozen=True)
class PageBox:
    page: int
    width: float
    height: float


def mupdf_lines(path: Path) -> list[Line]:
    """`mutool draw -F stext.json`.

    JSON rather than the `stext` XML for one reason worth recording: the XML
    escapes every non-ASCII character as a numeric entity, so any predicate
    applied to its raw text -- "is this token all digits and dashes?" -- sees
    `75&#x2013;79` and answers no. That silently drops exactly the tokens
    carrying a range, which in this corpus means the first cross-reference of
    every margin group. JSON arrives already decoded and cannot pose the
    question.
    """
    raw = run_binary(["mutool", "draw", "-F", "stext.json", "-o", "-", str(path)])
    doc = json.loads(raw.decode("utf-8", errors="replace"))
    lines: list[Line] = []
    for n, page in enumerate(doc.get("pages", [])):
        for block in page.get("blocks", []):
            if block.get("type") != "text":
                continue
            for line in block.get("lines", []):
                box = line.get("bbox") or {}
                font = line.get("font") or {}
                text = line.get("text", "")
                if not text.strip():
                    continue
                x, y = float(box.get("x", 0.0)), float(box.get("y", 0.0))
                lines.append(
                    Line(
                        page=n,
                        x0=x,
                        y0=y,
                        x1=x + float(box.get("w", 0.0)),
                        y1=y + float(box.get("h", 0.0)),
                        text=text,
                        font=str(font.get("name", "")),
                        weight=str(font.get("weight", "")),
                        style=str(font.get("style", "")),
                        size=float(font.get("size", 0.0)),
                        baseline=float(line.get("y", y)),
                    )
                )
    return sorted(lines, key=_reading_order)


def poppler_lines(path: Path) -> list[Line]:
    """`pdftotext -bbox-layout`, sanitized then parsed properly.

    The sanitizer is narrow on purpose. Hand-rolling a regex scraper over
    arbitrary XML would be the worse failure -- it is how the entity trap
    above got written the first time -- so the illegal bytes are removed and
    a real parser does the rest, which also means entities are unescaped for
    free.
    """
    raw = run_binary(["pdftotext", "-bbox-layout", str(path), "-"])
    text = _C0.sub("", raw.decode("utf-8", errors="replace"))
    root = ET.fromstring(text)
    lines: list[Line] = []
    for n, page in enumerate(root.iter(f"{_XHTML}page")):
        for line in page.iter(f"{_XHTML}line"):
            words = [w.text or "" for w in line.iter(f"{_XHTML}word")]
            joined = " ".join(w for w in words if w)
            if not joined.strip():
                continue
            lines.append(
                Line(
                    page=n,
                    x0=float(line.get("xMin", 0.0)),
                    y0=float(line.get("yMin", 0.0)),
                    x1=float(line.get("xMax", 0.0)),
                    y1=float(line.get("yMax", 0.0)),
                    text=joined,
                    baseline=float(line.get("yMax", 0.0)),
                )
            )
    return sorted(lines, key=_reading_order)


#: The two readers, by the name an edition declares.
BACKENDS = {"mupdf": mupdf_lines, "poppler": poppler_lines}


def read_lines(path: Path, backend: str) -> list[Line]:
    try:
        reader = BACKENDS[backend]
    except KeyError:
        raise ValueError(
            f"unknown pdf backend {backend!r}; known: {sorted(BACKENDS)}"
        ) from None
    return reader(path)


def page_boxes(path: Path) -> list[PageBox]:
    """Page dimensions, which `stext.json` does not carry.

    Read from `mutool pages` for both backends rather than from whichever one
    the edition uses, so an imposition split cannot silently depend on the two
    readers agreeing about a page box. Only callers that need a page-relative
    threshold have to ask; `body_column` infers its band from the text and
    needs none.
    """
    raw = run_binary(["mutool", "pages", str(path)])
    text = _C0.sub("", raw.decode("utf-8", errors="replace"))
    boxes: list[PageBox] = []
    for n, m in enumerate(
        re.finditer(
            r'<CropBox l="([\d.-]+)" b="([\d.-]+)" r="([\d.-]+)" t="([\d.-]+)"', text
        )
    ):
        left, bottom, right, top = (float(g) for g in m.groups())
        boxes.append(PageBox(n, abs(right - left), abs(top - bottom)))
    return boxes


def _reading_order(line: Line) -> tuple[int, float, float]:
    return (line.page, round(line.y0, 1), line.x0)


def merge_runs(
    lines: list[Line], *, y_tol: float = 2.0, gap_ratio: float = 1.8
) -> list[Line]:
    """Rejoin fragments MuPDF split at a font change.

    `stext` starts a new line every time the face changes, so a heading whose
    drop-letter is set separately arrives as `Dieviškojo `, `A`,
    `preiškimo perdavimas` -- three lines for one row, and 16,155 fragments
    against poppler's 7,816 lines for the same Lithuanian file. Any predicate
    that reads a whole line (does this row start with a question number? is
    this row a heading?) is wrong on the fragments.

    Two fragments join when they sit on the same baseline within `y_tol` and
    are separated by less than `gap_ratio` times the type size. Proportional
    because the gap that has to be crossed is a typographic distance: the
    Indonesian sets its questions with a HANGING INDENT, the number at the
    margin and the text 14pt further in at 12pt type, so a fixed 12pt gap left
    every question number stranded on its own and the question was never
    recognised at all. 1.8em clears that and stays far below the hundreds of
    points that separate a folio from a running head.

    **SPLIT THE COLUMNS BEFORE CALLING THIS, never after.** The gap test
    cannot be trusted to keep a margin note out of a body line: in the
    Lithuanian Compendium the cross-reference column ends 4.1pt from where the
    body begins, which is closer than the spaces inside the body line itself,
    so any `gap` wide enough to rejoin a real line is also wide enough to
    swallow the margin. Merging first silently glued the second line of every
    two-line reference group onto the running text and cost 118 of 288
    questions their refs -- and it does not look like damage, because the
    result is a plausible sentence with a number in front of it. Use
    `body_columns` and `in_margin` on the reader's own output, then merge
    within each column, where nothing foreign is in reach.

    The merged line keeps the font of its WIDEST fragment, which is the one
    that characterizes the row -- a heading interrupted by one roman-set
    character is still a heading.
    """
    out: list[Line] = []
    for _, row in _rows(lines, y_tol):
        row = sorted(row, key=lambda ln: ln.x0)
        run = [row[0]]
        for line in row[1:]:
            allowed = gap_ratio * (line.size or run[-1].size or 10.0)
            if line.x0 - run[-1].x1 <= allowed:
                run.append(line)
            else:
                out.append(_fuse(run))
                run = [line]
        out.append(_fuse(run))
    return sorted(out, key=_reading_order)


def _rows(lines: list[Line], y_tol: float):
    """Group lines into baselines, page by page."""
    for page in sorted({line.page for line in lines}):
        on_page = sorted(
            (ln for ln in lines if ln.page == page),
            key=lambda ln: (ln.baseline, ln.x0),
        )
        row: list[Line] = []
        for line in on_page:
            if row and abs(line.baseline - row[0].baseline) > y_tol:
                yield page, row
                row = []
            row.append(line)
        if row:
            yield page, row


def _join(run: list[Line], *, space_ratio: float = 0.25) -> str:
    """Concatenate fragments, restoring a space the reader did not emit.

    Most word spaces survive inside a fragment's own text, so the default is
    to join with nothing. But a fragment boundary that falls exactly ON a
    space loses it -- MuPDF ends one run after `TIKEJIMO` and starts the next
    at `ISPAZINIMAS`, with the space represented only by the gap between the
    boxes. Joining blind gave `TIKEJIMOISPAZINIMAS` for two of the work's
    four part titles.

    THE THRESHOLD IS A FRACTION OF THE TYPE SIZE, not a fixed distance. These
    editions set a decorative initial as its own run, and the kerning gap
    after it runs to 2pt at a 10pt body -- wider than the 1.5pt an absolute
    threshold allowed, so "Pirmas poskyris" became "P irmas poskyris", the
    heading stopped matching the division table, and the work lost a chapter
    while the question before it absorbed the one after.
    """
    parts = [run[0].text]
    for prev, line in itertools.pairwise(run):
        gap = space_ratio * (line.size or prev.size or 10.0)
        if (
            line.x0 - prev.x1 > gap
            and not parts[-1].endswith(" ")
            and not line.text.startswith(" ")
        ):
            parts.append(" ")
        parts.append(line.text)
    return "".join(parts)


def _fuse(run: list[Line]) -> Line:
    if len(run) == 1:
        return run[0]
    lead = max(run, key=lambda ln: ln.x1 - ln.x0)
    return Line(
        page=run[0].page,
        x0=min(ln.x0 for ln in run),
        y0=min(ln.y0 for ln in run),
        x1=max(ln.x1 for ln in run),
        y1=max(ln.y1 for ln in run),
        text=_join(run),
        font=lead.font,
        weight=lead.weight,
        style=lead.style,
        size=lead.size,
        baseline=run[0].baseline,
    )


def remap(lines: list[Line], table: dict[str, str]) -> list[Line]:
    """Substitute characters a reader could not map.

    The Byelorussian Compendium is the case this exists for: one glyph in its
    embedded Type1C faces has no usable mapping, and the two readers disagree
    about how to say so -- poppler writes U+0018 in the body face and `%` in
    the italic, MuPDF writes U+FFFD in both. The replacement is not a guess:
    the font program's own charset names the glyph `hyphenminus`, so it is
    U+002D. Pass that table in from the edition; this function only applies it.
    """
    if not table:
        return lines
    out = []
    for line in lines:
        text = line.text
        for bad, good in table.items():
            text = text.replace(bad, good)
        out.append(line.with_text(text) if text != line.text else line)
    return out


def split_pages(lines: list[Line], at: dict[int, float]) -> list[Line]:
    """Cut imposed pages into book pages at a per-page x.

    The Russian Compendium is printed two-up: each A4 sheet carries two book
    pages side by side, so its 109 PDF pages are 218 book pages, and read as
    sheets its running heads come out as `26 … 27` on one line and half its
    questions go missing. Lines left of the cut become page `2n`, lines right
    of it page `2n+1`, with x re-based so a later column test means the same
    thing on both halves.

    A page absent from `at` is passed through unsplit, renumbered to stay in
    sequence -- an edition may impose only its body.
    """
    out: list[Line] = []
    for line in lines:
        cut = at.get(line.page)
        if cut is None:
            out.append(
                Line(
                    line.page * 2,
                    line.x0,
                    line.y0,
                    line.x1,
                    line.y1,
                    line.text,
                    line.font,
                    line.weight,
                    line.style,
                    line.size,
                )
            )
            continue
        right = line.x0 >= cut
        shift = cut if right else 0.0
        out.append(
            Line(
                line.page * 2 + (1 if right else 0),
                line.x0 - shift,
                line.y0,
                line.x1 - shift,
                line.y1,
                line.text,
                line.font,
                line.weight,
                line.style,
                line.size,
            )
        )
    return sorted(out, key=_reading_order)


def body_column(lines: list[Line], *, quantile: float = 0.5) -> tuple[float, float]:
    """The x-band the running text occupies, inferred from the text itself.

    Preferred over a fraction of the page width, which is what a first
    attempt reaches for: the body is by a wide margin the most common thing
    on the page, so its left edge is the modal `x0` of the long lines and its
    right edge the modal `x1`. That holds whichever margin the cross-reference
    column is in on a given page, which matters because these books put it in
    the OUTER margin -- so the side alternates with page parity and a fixed
    threshold is wrong on half the book.

    `quantile` picks which lines count as "long": the default takes the
    upper half by width, which excludes margin notes, folios and running
    heads without needing to know what any of them are.
    """
    if not lines:
        return (0.0, 0.0)
    widths = sorted(line.x1 - line.x0 for line in lines)
    floor = widths[int(len(widths) * quantile)]
    long_lines = [line for line in lines if (line.x1 - line.x0) >= floor] or lines
    return (
        _mode(line.x0 for line in long_lines),
        _mode(line.x1 for line in long_lines),
    )


def body_columns(lines: list[Line]) -> dict[int, tuple[float, float]]:
    """The body band per page parity, because a printed book mirrors.

    These editions set a wider OUTER margin, so the text block itself shifts
    between recto and verso -- measured on the Lithuanian Compendium, the body
    runs 51->319 on odd pages and 31->299 on even ones, a 20pt swing. Taking
    one band for the whole book therefore describes neither half, and taking
    it per page is noisy on a page with few lines.

    This is also what makes the cross-reference column self-locating: the
    margin is whatever lies outside the band, so nothing has to declare which
    side it is on, and an edition that mirrors the other way needs no entry.
    """
    return {
        parity: body_column([ln for ln in lines if ln.page % 2 == parity])
        for parity in (0, 1)
    }


def in_margin(
    line: Line, bands: dict[int, tuple[float, float]], *, tol: float = 4.0
) -> bool:
    """Whether a line sits outside its page's body band, i.e. in the margin."""
    left, right = bands[line.page % 2]
    return line.x1 <= left - tol or line.x0 >= right + tol


def _mode(values, *, bucket: float = 1.0) -> float:
    """The commonest value, to the nearest `bucket`.

    Mode rather than min/max, which is the obvious reading of "the band the
    body occupies" and is wrong: one long line reaching into the margin --
    a full-measure heading, a table rule, a merged run that caught a folio --
    moves an extremum and leaves the band describing that one line instead of
    the page. The body is the most REPEATED thing on the page, never merely
    the widest.
    """
    counts: dict[float, int] = {}
    for value in values:
        key = round(value / bucket) * bucket
        counts[key] = counts.get(key, 0) + 1
    return max(counts.items(), key=lambda kv: (kv[1], -kv[0]))[0]


def dehyphenate(text: str, *, marks: str = "-­‐") -> str:
    """Rejoin words a line break split, and drop the break's hyphen.

    Only a hyphen that ENDS a line is removed. A hyphen inside a line is the
    author's, and the two cannot be told apart once the lines are joined --
    which is why this runs over the text while the newlines are still in it.
    """
    return re.sub(rf"[{re.escape(marks)}]\n(\s*)", "", text)
