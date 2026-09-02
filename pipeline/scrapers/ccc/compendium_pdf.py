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

from common import CorrectionDriftError
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
    #: Fraction of the page height at the HEAD that holds furniture rather
    #: than text: the folio, and the running head, which in these books
    #: REPEATS THE DIVISION NAMES and so matches the heading table on every
    #: single page if it is not excluded.
    #:
    #: Position rather than font size, though size looks like the better
    #: signal and was tried first: the Lithuanian sets its running head at 9pt
    #: against a 10pt body, but it also sets four ordinary questions (Q360 to
    #: Q363, on one crowded page) at 9pt, and a size test silently dropped
    #: them. Where a thing is printed is a fact about the page; how big it is
    #: happens to correlate.
    furniture_strip: float = 0.09
    #: How this edition marks a quotation. The Compendium closes many answers
    #: with a patristic or scriptural epigraph, and the ten HTML editions
    #: store it as a `quote` block with its attribution split off; without
    #: this it is folded into the answer's prose and the block is lost.
    #:
    #: "italic" is the signal in all three MuPDF editions -- measured, and the
    #: only one available: the quote's indent is the SAME as the paragraph
    #: first-line indent in every one of them, so geometry cannot tell them
    #: apart. Empty means the edition's quotes are not detectable, which is
    #: the Russian's case and is explained at its entry.
    quote_style: str = ""
    #: Rejoin an initial the reader split off. poppler tokenises by spacing,
    #: and this edition sets its chapter headings with a large capital
    #: followed by small capitals, so the gap after the initial reads as a
    #: word break: "ГЛАВА ПЕРВАЯ" arrives as "Г ЛАВА ПЕРВАЯ" and stops
    #: matching the division table. Applied only to a line that is entirely
    #: uppercase -- a heading -- so ordinary prose, where a one-letter Russian
    #: preposition really does precede a word, is untouched.
    repair_small_caps: bool = False
    #: The same at the FOOT, and zero by default because both editions read so
    #: far put every piece of furniture at the top. It was symmetric with the
    #: head for one revision, and the cost was silent: the Indonesian runs its
    #: text to within a tenth of the page bottom, so a 0.10 foot strip cut the
    #: last line off any answer that reached it -- Q44 ended mid-phrase, at
    #: "misteri Tritunggal yang Amat" with "Kudus" on the discarded line. An
    #: edition that prints its folio at the foot sets this; none does yet.
    foot_strip: float = 0.0


#: The four, in the order they were brought in. Only Lithuanian is wired up
#: today; the other three are declared so that the shape of what each needs
#: is written down where the next person will look for it.
PDF_EDITIONS: dict[str, PdfEdition] = {
    "lt": PdfEdition(backend="mupdf", quote_style="italic"),
    # MuPDF is not a preference here, it is the only reader that gives the
    # Indonesian text at all. This file still carries the ITALIAN original as
    # invisible text, and poppler emits it: page 19 comes out as "1. Qual e il
    # disegno di Dio per l'uomo?" woven through "Apa rencana Allah untuk
    # manusia?". Nothing in the file declares that layer hidden -- there is no
    # optional-content group -- so a reader either honours the render mode or
    # it does not.
    #
    # Its running head sits at 9.2% of the page against Lithuanian's 6.8%, and
    # it reads "Bagian Satu", which is exactly what the part pattern matches;
    # left in, every page opened Part One again.
    "id": PdfEdition(backend="mupdf", furniture_strip=0.10, quote_style="italic"),
    # ONE GLYPH IN ITS FONTS HAS NO USABLE MAPPING, and the two readers
    # disagree about how to say so: poppler writes U+0018 in the body face and
    # `%` in the italic, MuPDF writes U+FFFD in both -- 2,818 of them, 1,422
    # ending a line and 1,396 inside one. The replacement is not a guess. The
    # embedded Type1C charset names the glyph `hyphenminus`, so it is U+002D,
    # and once it is that the line-final ones are ordinary soft hyphens that
    # `dehyphenate` closes up and the rest are ordinary dashes.
    "be": PdfEdition(
        backend="mupdf",
        furniture_strip=0.085,
        glyphs={"\ufffd": "-"},
        quote_style="italic",
    ),
    # THE ONLY POPPLER EDITION, and the only two-up one. Its fonts carry no
    # `ToUnicode` map: MuPDF refuses every glyph and answers U+FFFD, while
    # poppler passes the underlying byte through, and the custom encoding is
    # cp1251 -- so the text is recovered by re-decoding rather than lost.
    # poppler reports no font metadata, which is why nothing here may require
    # `weight` or `size`.
    #
    # It is also imposed two pages to a sheet, so its 109 sheets are 218 book
    # pages; read as sheets its running heads come out as "24 ... 25" on one
    # line and half its questions disappear.
    "ru": PdfEdition(
        backend="poppler",
        decode=_cp1251,
        two_up=True,
        furniture_strip=0.17,
        repair_small_caps=True,
        # NO QUOTE STYLE, and it is a limit of the reader rather than of the
        # edition. This book sets its epigraphs in italic like the other
        # three, in `BPCABA+MSTT31c666` against the body's
        # `BPCBHO+MSTT31c658` -- but `pdftotext -bbox-layout` reports no font
        # at all, and the quote's indent is identical to the paragraph
        # first-line indent (137.5 against a 123.3 measure), so nothing left
        # in the stream distinguishes them. Its ~24 epigraphs are therefore
        # stored as prose, which loses the block kind and the attribution but
        # no text. The fix is a backend that reports a face: `pdftohtml -xml`
        # gives a font id per run and its own page dimensions, and would
        # replace `-bbox-layout` here rather than supplement it.
    ),
}


#: A question opens with its number and a period. Shared by all four; the
#: editions differ in how far the number is indented, never in its shape.
#:
#: THE SPACE AFTER THE PERIOD IS OPTIONAL, and that is not laxity. The
#: Indonesian sets the number and the text as separate runs a couple of points
#: apart -- narrower than the space threshold in `common/pdf._join`, so they
#: are concatenated as `100.Dalam` -- and requiring whitespace lost 34
#: questions. The Spanish HTML edition prints four the same way (Q523, Q530),
#: so this is the source's habit rather than this reader's artefact. What
#: replaces the space as a guard is the class of the following character: it
#: must not be a digit, or "2.5" would open question 2.
QUESTION_RE = re.compile(r"^\s*(\d{1,3})\.\s*([^\d\s].*)$", re.DOTALL)

#: A cross-reference run is digits and the punctuation that joins or ranges
#: them, and must START with a digit -- which is what keeps a line-break
#: hyphen, stranded in the margin band by the reader, from being stored as a
#: reference. It looked like a harmless empty match and put a bare "-" in
#: `ccc_refs` for five questions.
MARGIN_REF_RE = re.compile(r"^\d[\d,;:.‐‑–—\s-]*$")


#: A division heading is its label and nothing else -- the division's name is
#: printed on the line beneath it, which `_heading_title` collects. The bound
#: exists because `match_label` is anchored at the start of the line and so
#: matches a SENTENCE that opens with the same words: the Indonesian preface
#: introduces the work part by part ("Bagian Satu berjudul 'Pengakuan Iman',
#: berisi sintesis dari lex credendi..."), and each of those paragraphs opened
#: a fresh Part One, which put the whole preface inside the work and cost it
#: its first three questions. Four words clears every label in the fourteen
#: editions -- Romanian's "PARTEA A DOUA" is the longest at three.
MAX_HEADING_WORDS = 4


#: A single letter standing alone before a word, in a line that is all
#: capitals -- the signature of a small-capped initial the reader split off.
_SMALL_CAP_SPLIT = re.compile(r"\b(\w) (\w{2,})")


def _rejoin_initial(text: str) -> str:
    stripped = text.strip()
    if not stripped or stripped != stripped.upper():
        return text
    return _SMALL_CAP_SPLIT.sub(r"\1\2", text)


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
    if ed.repair_small_caps:
        lines = [ln.with_text(_rejoin_initial(ln.text)) for ln in lines]
    lines = remap(lines, ed.glyphs)
    boxes = page_boxes(path)
    height = boxes[0].height
    if ed.two_up:
        lines = split_pages(lines, {b.page: b.width / 2 for b in boxes})
    bands = body_columns(lines)
    pages: list[PdfPage] = []
    for n in sorted({ln.page for ln in lines}):
        on_page = [ln for ln in lines if ln.page == n]
        body = merge_runs([ln for ln in on_page if not in_margin(ln, bands)])
        body = [ln for ln in body if not _in_furniture(ln, height, ed)]
        margin = merge_runs([ln for ln in on_page if in_margin(ln, bands)])
        pages.append(PdfPage(n, body, _refs_only(margin, height, ed)))
    return pages


def apply_pdf_corrections(
    pages: list[PdfPage], corrections: list[dict], lang: str
) -> list[dict]:
    """Pre-parse corrections against reconstructed lines.

    The same contract the HTML path holds itself to -- exact substring, and
    drift is fatal -- moved to the only string a PDF edition has: a line, once
    the reader has run and the columns are split. An entry carrying a
    `resolution` is documented rather than applied.
    """
    applied: list[dict] = []
    for c in corrections:
        if c.get("resolution"):
            continue
        if c.get("field") != "extracted_text":
            continue
        hits = 0
        for page in pages:
            for i, line in enumerate(page.body):
                if c["from"] in line.text:
                    page.body[i] = line.with_text(line.text.replace(c["from"], c["to"]))
                    hits += 1
        if not hits:
            raise CorrectionDriftError(
                f"{lang}: correction {c['id']}: `from` text not found in the "
                "extracted page -- the reader changed, or the correction is wrong"
            )
        applied.append(c)
    return applied


def margin_corrections(corrections: list[dict], lang: str) -> dict[int, dict]:
    """`question number -> correction`, for the margin reference apparatus.

    Keyed by the question because that is the only unique address a margin
    number has -- see the note on `_CORRECTION_FIELDS` in `compendium.py`. A
    second entry for the same question is a filing mistake and is refused
    here rather than silently losing one of them.
    """
    out: dict[int, dict] = {}
    for c in corrections:
        if c.get("resolution") or c.get("field") != "margin_refs":
            continue
        n = (c.get("locator") or {}).get("question")
        if not isinstance(n, int):
            raise ValueError(
                f"{lang}: correction {c['id']}: a margin_refs correction needs "
                "an integer `locator.question`"
            )
        if n in out:
            raise ValueError(
                f"{lang}: corrections {out[n]['id']} and {c['id']} both claim "
                f"question {n}"
            )
        out[n] = c
    return out


def correct_refs(
    n: int, refs: str, pending: dict[int, dict], applied: list[dict], lang: str
) -> str:
    """One question's assembled reference string, corrected if one is filed.

    EQUALITY, not substring: the whole apparatus for the question is what the
    correction quotes, so a run that reads differently for any reason -- a
    column boundary moved, a run reassigned to its neighbour -- is drift, and
    drift is fatal exactly as it is on the HTML path."""
    c = pending.pop(n, None)
    if c is None:
        return refs
    if refs != c["from"]:
        raise CorrectionDriftError(
            f"{lang}: correction {c['id']}: question {n} reads {refs!r}, not "
            f"{c['from']!r} -- the reader changed, or the correction is wrong"
        )
    applied.append(c)
    return c["to"]


def _label_of(line: Line, match_label) -> tuple[str, int | None] | None:
    """The division this line heads, or None if it merely mentions one."""
    stripped = line.text.strip()
    if QUESTION_RE.match(line.text):
        return None
    if len(stripped.split()) > MAX_HEADING_WORDS:
        return None
    return match_label(stripped)


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
            label = _label_of(line, match_label)
            if label == ("part", 1):
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
    lo = height * ed.furniture_strip
    hi = height * (1 - ed.foot_strip) if ed.foot_strip else float("inf")
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
    lang = cfg["lang"]
    match_label = cfg["match_label"]
    # Corrections to the margin apparatus, consumed as their questions are
    # reached and asserted empty at the end: a correction naming a question
    # the walk never visits has silently done nothing, which is the one
    # failure this layer must not have.
    pending_refs = margin_corrections(state.corrections, lang)
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
    #: True while `buffer` holds a quotation rather than running prose.
    quoting = [False]
    #: The current answer's blocks, held back until it closes.
    parts: list[tuple[str, str]] = []

    def flush() -> None:
        """Close the run of lines in hand, as one block."""
        if buffer:
            parts.append(("quote" if quoting[0] else "prose", _join_prose(buffer)))
        buffer.clear()

    def emit() -> None:
        """Hand the finished answer to `ScrapeState`.

        ONLY A CLOSING QUOTATION IS A QUOTE BLOCK. Italic marks more than an
        epigraph in these editions -- a Latin phrase inside a sentence
        (`Fiat mihi secundum Verbum tuum`), a liturgical incipit, an
        italic run-in sub-heading -- and taking every italic run gave the
        Lithuanian 59 quote blocks against the Italian's 24. What separates
        them is not the typography but the position: an epigraph CLOSES its
        answer, and all 24 of the Italian's are the last block of theirs. An
        italic run anywhere else is emphasis inside the prose, and goes back
        into it -- `add_prose` merges consecutive prose blocks, so it rejoins
        the sentence it came from.
        """
        flush()
        # TRAILING HEADINGS COME OFF FIRST. What sits at the foot of an
        # answer is often not part of it: the work's run-in SUB-HEADINGS
        # ("Dangus ir žemė", "KAMI PERCAYA") introduce the questions that
        # follow, and the HTML editions read them from `align="center"` and
        # store them as `sub` nodes -- the Italian has 82. They also sit
        # AFTER an epigraph where a chapter has both, so leaving them in
        # demoted the epigraph out of last place and lost it: nine of the
        # Indonesian's thirteen went that way.
        subs: list[str] = []
        while parts and _looks_like_sub(*parts[-1]):
            subs.insert(0, parts.pop()[1])
        for i, (kind, text) in enumerate(parts):
            if state.current is None:
                break
            if kind != "quote" or i != len(parts) - 1 or not _starts_cleanly(text):
                state.add_prose(text)
            else:
                state.add_quote(text)
        parts.clear()
        quoting[0] = False
        for title in subs:
            state.push_heading("sub", None, title)

    for page in pages:
        lines = page.body
        questions = [ln for ln in lines if id(ln) in starts]
        headings = [
            ln
            for ln in lines
            if id(ln) not in starts and _label_of(ln, match_label) is not None
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
            emit()
            continue
        i = 0
        while i < len(lines):
            line = lines[i]
            label = _label_of(line, match_label)
            if label is not None:
                kind, n = label
                emit()
                title, i = _heading_title(lines, i)
                state.push_heading(kind, n, title)
                continue
            m = QUESTION_RE.match(line.text) if id(line) in starts else None
            if m:
                emit()
                # Collapse internal whitespace the same way the HTML path
                # gets it for free: a run of spaces between two fragments is
                # typography, not text, and `validate` rejects a stored
                # double space.
                state.start_question(
                    int(m.group(1)), re.sub(r"\s+", " ", m.group(2)).strip()
                )
                refs = correct_refs(
                    int(m.group(1)),
                    _refs_for(page, line, questions, headings),
                    pending_refs,
                    state.corrections_applied,
                    lang,
                )
                if refs:
                    state.set_refs(refs)
                i += 1
                continue
            if state.current is not None:
                quote = _is_quote(line, cfg["pdf"], buffer, quoting[0])
                if quote != quoting[0]:
                    flush()
                    quoting[0] = quote
                buffer.append(line.text.rstrip())
            i += 1
    emit()
    if pending_refs:
        raise CorrectionDriftError(
            f"{lang}: correction(s) "
            + ", ".join(c["id"] for c in pending_refs.values())
            + " name questions this parse never reached"
        )


#: A line that is nothing but a parenthesised phrase -- "(Santo Agustinus)",
#: "(sv. Augustinas)". The editions set the epigraph in italic and its
#: attribution in roman on the line after, so the attribution has to be pulled
#: into the quote or `split_attribution` never sees it.
_BARE_ATTRIBUTION = re.compile(r"^\s*[(\[][^()\[\]]{2,60}[)\]][.,;]?\s*$")

#: What tells an epigraph from a run-in sub-heading, both of which these
#: editions set in italic at the end of an answer: an epigraph is a QUOTATION
#: and carries the marks to prove it. All 24 of the Italian edition's quote
#: blocks contain one; none of its 82 sub-headings does.
_QUOTE_MARKS = "«»„“”\u201c\u201d\u201e\u2039\u203a\"'"


def _is_quotation(text: str) -> bool:
    return any(c in text for c in _QUOTE_MARKS)


#: A heading names a thing; an epigraph says something. LENGTH is what
#: separates them, and the floor is the Italian edition's own: the shortest of
#: its 24 quote blocks is 40 characters, and every run-in heading in this work
#: is shorter than that.
#:
#: Quotation marks do NOT separate them, which is the trap: the Creed's
#: article headings quote the Creed, so `„Amen“` and `Tikiu „šventųjų
#: bendravimą“` carry marks and are headings all the same. Nor does final
#: punctuation -- three of this work's sub-headings are questions ("Kaip ją
#: švęsti?", "Kada ją švęsti?", "Kur ją švęsti?").
_SUB_MAX_CHARS = 39


def _looks_like_sub(kind: str, text: str) -> bool:
    """Whether a block at the foot of an answer is really a run-in heading.

    Two shapes, both the source's own typography: a short ITALIC run, or a
    short line set entirely in CAPITALS. See `_SUB_MAX_CHARS` for why the
    length is the discriminator and the two more obvious signals are not.
    """
    stripped = text.strip()
    if not stripped:
        return False
    if kind == "quote":
        # An italic run is an epigraph only if it is BOTH long enough and
        # actually a quotation. Either test alone lets a heading through: the
        # Creed's article headings carry marks ("Amen", "Tikiu „šventųjų
        # bendravimą“") and three of the work's headings are longer than the
        # floor ("Bažnyčia yra viena, šventa, visuotinė ir apaštališka").
        return len(stripped) <= _SUB_MAX_CHARS or not _is_quotation(stripped)
    if len(stripped) > _SUB_MAX_CHARS:
        return False
    return stripped == stripped.upper() and any(c.isalpha() for c in stripped)


def _starts_cleanly(text: str) -> bool:
    """Whether a run begins where a quotation or heading could begin.

    `merge_runs` gives a line ONE style, taken from its widest fragment, so a
    line that is half roman and half italic reads as whichever half is longer.
    Where a quotation opens mid-line that is right; where it merely continues
    one, the boundary falls inside a word and the block opens on a fragment --
    Lithuanian Q435 came out as "šus į jį: Mylėk savo artimą...", the tail of
    a hyphenated word. A real quotation or heading opens with an opening mark
    or a capital.
    """
    head = text.lstrip()[:1]
    return bool(head) and (head in _QUOTE_MARKS or head.isupper() or head.isdigit())


def _is_quote(line: Line, ed: PdfEdition, buffer: list[str], quoting: bool) -> bool:
    """Whether this line belongs to a quotation rather than to running prose.

    Italic is the whole test where a font is reported, because the indent is
    not available: these editions indent a quotation exactly as far as they
    indent a paragraph's first line, so the two are geometrically identical.

    THE ROMAN TAIL IS THE PART THAT NEEDS A RULE. A quotation's last line
    carries the attribution and the editions set that line upright -- the
    Byelorussian breaks a word across the boundary ("...знойдзе спа-" then
    "кой у Табе» (св. Аўгустын)."), the Indonesian puts the attribution on a
    line of its own. So a non-italic line continues an open quotation when the
    quotation is unfinished (the previous line broke mid-word) or when the
    line is nothing but a parenthesised name. Anything else ends it.
    """
    if not ed.quote_style:
        return False
    if line.italic:
        return True
    if not quoting or not buffer:
        return False
    return buffer[-1].rstrip().endswith("-") or bool(_BARE_ATTRIBUTION.match(line.text))


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
    "ru": (
        "© Copyright 2005 — Libreria Editrice Vaticana; "
        "© Культурный центр «Духовная библиотека», 2007"
    ),
    "be": (
        "© Copyright 2005 — Libreria Editrice Vaticana; "
        "© Канферэнцыя Каталіцкіх Біскупаў у Беларусі, 2010"
    ),
    "id": (
        "© Copyright 2005 - Libreria Editrice Vaticana; "
        "© 2009 Konferensi Waligereja Indonesia dan Penerbit Kanisius"
    ),
    "lt": (
        "© Copyright 2005 - Libreria Editrice Vaticana; "
        "© Lietuvos Vyskupų Konferencija, 2007"
    ),
}


def pdf_copyright(lang: str, default: str) -> str:
    return PDF_COPYRIGHT.get(lang, default)
