#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The *Compendium of the Social Doctrine of the Church* (2004), from
vatican.va -- 583 numbered paragraphs, 1,232 footnotes, two printed sigla
tables, in every language the Holy See publishes it in as HTML.

WHY THIS IS ITS OWN SCRAPER AND NOT A FAMILY IN `vatican_docs.py`. The page
IS a vatican.va old-shell document page and `vatican_docs.parse_document`
reads it almost unaided; that machinery is imported here rather than
reimplemented, exactly as `bible/cpdv.py` imports `sacredbible`. What differs
is not how the page is READ but what the result IS. Every work
`vatican_docs.py` writes is `type: "document"`, addressed as one page at
`/documenta/{slug}` with its sections as fragments on it. This work is cited
the way the Catechism is -- "CSDC 160" names a paragraph, not a place inside
an encyclical -- so it is `type: "social-doctrine"`, work id `csdc.{lang}`,
and each of its 583 paragraphs is an address of its own. That is a decision
about the corpus, not about parsing, and it is why the seam is here: this
module owns the work's identity and its front and back matter, and
`vatican_docs` owns "what a vatican.va page says".

THE PAGE IS SIX REGIONS AND ONLY ONE OF THEM IS THE DOCUMENT. In source
order, separated by the page's own `<hr>` rules:

    1. the site chrome and the language bar          (dropped by
                                                      `find_content_start_old_shell`)
    2. a linked table of contents, ~47 KB            (kept: it states the
                                                      outline, see below)
    3. ABBREVIATIONS, BIBLICAL ABBREVIATIONS,        -> abbreviations.json,
       Cardinal Sodano's letter, the Presentation       appendix.json
    4. the masthead, INTRODUCTION, and 583           -> sections.json,
       numbered paragraphs                              structure.json
    5. INDEX OF REFERENCES, a back-of-book index     -> appendix.json
    6. the footnote list, 1,232 entries              -> each section's
                                                        `citations`

Region 3 is why this file exists at all, and the failure it caused is worth
knowing before touching `split_page`. **Cardinal Sodano's letter prints its
own paragraph numbers, 1 through 5**, in the same bare `N.` form the document
uses. Handed the whole page, the walker read them as sections 1-5, then
rejected the document's own 1-4 as backwards-running false positives and
merged them into 5, resynchronising only at the document's 10 -- so the first
nine addresses of the work named the wrong text and five paragraphs had no
address at all. Nothing reported it: the run had 583 sections, no gaps, and a
range of exactly 1..583.

So the split is made HERE and by reading the numbers rather than by counting
rules: the document is the region containing the longest ascending run of
printed paragraph numbers starting at 1 (`find_numbered_body_start`). Five is
not five hundred and eighty-three, in any language, and no anchor name or
`<hr>` count has to be right for that to hold.

WHAT IS HANDED TO `parse_document` is the page with region 3 excised and
everything else intact -- chrome, table of contents, body, index, notes. The
table of contents stays in deliberately: `extract_toc_outline` reads its
indentation and emphasis as the document's own statement of its outline,
which outranks anything the levelling walk can infer, and `parse_document`
then drops it from the block stream itself.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime

import common
import vatican_docs as vd
from common import (
    Fetcher,
    build_root,
    captured_at,
    corpus_dir,
    corrections_receipt,
    load_corrections,
    load_overrides,
    require_corpus,
    write_stamped_json,
)

DATA_ROOT = corpus_dir()
RAW_ROOT = DATA_ROOT / "raw" / "csdc"
BUILD_ROOT = build_root()

#: The document's own promulgation date, printed on the page's file name and
#: in its `<meta name="eventDate">`: 26 May 2006 is the date of the edition
#: vatican.va publishes; the text itself is dated 2 April 2004 and signed by
#: Cardinal Martino on the memorial of Saint Francis of Paola.
PROMULGATED = "2004-04-02"

#: Not a pontiff. The Compendium is a curial work, drawn up at John Paul II's
#: request and issued over the signatures of its Council's President and
#: Secretary; the field names the body that speaks, which everywhere else in
#: this corpus is a pope or a council.
AUTHOR = "Pontifical Council for Justice and Peace"

TITLE = "Compendium of the Social Doctrine of the Church"
SHORT_TITLE = "Compendium of the Social Doctrine"

#: What each edition calls itself, read off its own page's `<title>` and
#: transcribed here rather than derived at parse time, because two of the
#: twelve cannot be read that way and nothing in the page says which two.
#:
#: THE MIRROR SERVES THE ITALIAN TITLE ON THREE PAGES. `it`, `sw` and `vi`
#: all carry `<title>Compendio della Dottrina Sociale della Chiesa</title>`,
#: and only the first of them is Italian -- the Swahili and Vietnamese pages
#: are translated throughout and keep the Italian page's `<head>`. So they get
#: no entry, and `title` falls back to the work's English name, which is what
#: every manifest in this corpus does for an edition whose own name is not
#: known rather than printing someone else's.
TITLES: dict[str, str] = {
    "en": "Compendium of the Social Doctrine of the Church",
    "es": "Compendio de la Doctrina Social de la Iglesia",
    "fr": "Compendium de la doctrine sociale de l'Église",
    "hu": "Az Egyház társadalmi tanításának kompendiuma",
    "it": "Compendio della Dottrina Sociale della Chiesa",
    "pl": "Kompendium nauki społecznej Kościoła",
    "pt": "Compêndio da Doutrina Social da Igreja",
    "sq": "Përmbledhje e doktrinës shoqërore të Kishës",
}

_URL_BASE = (
    "https://www.vatican.va/roman_curia/pontifical_councils/justpeace/documents/"
    "rc_pc_justpeace_doc_20060526_compendio-dott-soc_"
)

#: The twelve languages vatican.va publishes this work in as HTML, keyed by
#: the tag the corpus stores and valued by the code the page's own language
#: bar puts in the URL. READ OFF THAT BAR, never guessed: this mirror uses
#: the same private codes the Vatican II archive does -- `po` Portuguese,
#: `sp` Spanish -- and adds `sq`, which is Albanian.
#:
#: Five more editions exist and are not here because vatican.va publishes
#: them as PDF, which nothing in this pipeline reads: `be` (Byelorussian),
#: `el` (Greek), `lv` (Latvian), `uk` (Ukrainian), `zh` (Chinese). They are
#: recorded as `pdf-only` rather than left to look like an oversight -- see
#: `PDF_ONLY`.
EDITIONS: dict[str, str] = {
    "en": "en",
    "es": "sp",
    "fr": "fr",
    "hr": "sq",  # placeholder, replaced below -- see ALBANIAN note
    "hu": "hu",
    "id": "id",
    "it": "it",
    "nl": "nl",
    "pl": "pl",
    "pt": "po",
    "sw": "sw",
    "vi": "vi",
}
# ALBANIAN. `sq` is a language this corpus has never held and the interface
# has no dictionary for; it is a real edition and it is kept, under its own
# tag. The line above is replaced rather than written inline so the mistake
# of filing it under a neighbouring tag cannot be made silently.
del EDITIONS["hr"]
EDITIONS["sq"] = "sq"

#: Editions vatican.va publishes only as PDF. Recorded in the manifest's
#: `translations` so an absent column reads as the source's format choice
#: rather than as something this scraper failed at -- the same posture
#: `docs/corpus-schema.md` §Documents describes for `pdf-only`.
PDF_ONLY = ("be", "el", "lv", "uk", "zh")

#: Editions this scraper fetches and does NOT write, with the measurement
#: that decided it. Both are recorded rather than silently absent, because a
#: missing language column is exactly the thing nothing else in this pipeline
#: can tell apart from an oversight.
#:
#: They are two different failures and only one of them is ours.
WITHHELD: dict[str, str] = {
    # THE SOURCE PUBLISHES NO INDONESIAN TEXT. The page is 54 KB against the
    # other editions' 1.2 MB and strips to 22,573 characters against English's
    # 846,980: it carries the title page, the letter, the presentation and the
    # complete table of contents, and then stops. Every heading of all twelve
    # chapters is there and not one of the 583 paragraphs is. Nothing to
    # parse, and nothing a re-crawl would find.
    "id": (
        "vatican.va publishes only this edition's table of contents and front "
        "matter -- 22,573 characters against the English edition's 846,980, "
        "with none of the 583 numbered paragraphs"
    ),
    # OURS. The Dutch page is a Word export that keeps its footnotes in
    # `<div id=\"ftnN\">` blocks INTERLEAVED through the document -- the first
    # after paragraph 22, the last at the very end -- and numbers them per
    # group rather than per document: `<div id=\"ftn1210\">` holds the anchor
    # `_ftn128`, and so do eleven other groups. So the body cannot be split
    # from the notes at one offset (which is what `parse_document` does, and
    # cutting at the first group leaves 19 of 583 sections), and the notes
    # cannot be gathered into one table either, because a marker `[128]`
    # in the text names a different note in every group. Moving them to the
    # end would resolve most citations to the WRONG note, which is worse than
    # resolving none: a reader cannot see that a footnote is the wrong
    # footnote. Left unwritten until the parser can read a per-group
    # apparatus.
    "nl": (
        "footnotes are interleaved through the page in per-group-numbered "
        '`<div id="ftnN">` blocks; splitting body from notes at one offset '
        "yields 19 of 583 sections, and pooling the notes would resolve "
        "citations to the wrong entries"
    ),
}

# --------------------------------------------------------------------------
# The page, in regions
# --------------------------------------------------------------------------


@dataclass
class Regions:
    """One page, cut into what it is made of. Offsets are into `html`, which
    is the decoded page after `strip_transparent_spans`."""

    html: str
    content_start: int
    toc: tuple[int, int] | None
    body_start: int
    #: The title page: the Council's name, the work's title, the dedication
    #: to John Paul II. Everything the page prints before its table of
    #: contents, which is the masthead by the same test `vatican_docs` uses
    #: -- matter above the first heading that names the work rather than
    #: saying anything. It becomes `manifest.header`.
    masthead: str = ""
    #: What the page prints between its table of contents and its first
    #: numbered paragraph: the two sigla tables, Cardinal Sodano's letter of
    #: transmittal, Cardinal Martino's presentation.
    front: str = ""
    #: The page with `masthead` and `front` cut out and everything else --
    #: chrome, the table of contents, the body, the index, the notes -- left
    #: exactly where it was.
    without_front: str = ""


#: Every `name` target in a slice, re-emitted as empty anchors.
_ANCHOR_NAME_RE = re.compile(r'<a[^>]*\bname="([^"]+)"', re.IGNORECASE)


def _anchors_of(slice_html: str) -> str:
    """The excised slice's link TARGETS, kept where its text was.

    The table of contents' first entries point at the front matter --
    `Abbreviations`, `Letter of Cardinal Angelo Sodano`, `Presentation` --
    and `toc_link_span` recognises a table of contents by its links pointing
    FORWARD to targets defined later in the page. Cut the front matter out
    and those four targets are gone, so those entries stop being forward
    links, the span starts after them, and the page's own contents list opens
    section 1. Keeping the anchors costs a few hundred bytes and keeps the
    page's internal link graph exactly as `parse_document` will read it.
    """
    return "".join(
        f'<a name="{name}"></a>' for name in _ANCHOR_NAME_RE.findall(slice_html)
    )


def split_page(html: str) -> Regions:
    html = vd.strip_transparent_spans(html)
    content_start = vd.find_content_start_old_shell(html)
    region = html[content_start:]
    toc = vd.toc_link_span(region)
    body_start, _last = find_numbered_body_start(region)
    toc_start, toc_end = toc or (0, 0)
    if not 0 <= toc_start <= toc_end <= body_start:
        raise ValueError(
            f"regions out of order: table of contents {toc}, numbered body "
            f"starts at {body_start} -- this page is not laid out as this "
            "scraper reads it"
        )
    # THE CUT STARTS AT THE FIRST BLOCK, not at the region's first character.
    # `find_content_start_old_shell` returns the position OF the `<hr>` it
    # walked back to, not the position after it, so the region opens with
    # that rule -- and slicing from zero took it out. The function then read
    # the doctored page again, found no rule before its first numbered
    # paragraph, returned 0, and handed the walker the `<head>`: section 1
    # opened with the page's `<title>` and the source of its print button.
    first_block = next(vd._BLOCK_RE.finditer(region), None)
    lead = first_block.start() if first_block else 0
    masthead, front = region[lead:toc_start], region[toc_end:body_start]
    return Regions(
        html=html,
        content_start=content_start,
        toc=toc,
        body_start=body_start,
        masthead=masthead,
        front=front,
        without_front=(
            html[:content_start]
            + region[:lead]
            + _anchors_of(masthead)
            + region[toc_start:toc_end]
            + _anchors_of(front)
            + region[body_start:]
        ),
    )


#: How many numbers a candidate start has to account for before it can be
#: the document's own numbering. Not a threshold to tune: the letter of
#: transmittal runs to 5 and the document to 583, so anything between the two
#: answers the same. It is a floor rather than a ranking so that a page whose
#: body numbering this parser cannot read fails loudly here instead of
#: quietly electing the letter.
_BODY_RUN_MIN = 40


def find_numbered_body_start(region_html: str) -> tuple[int, int]:
    """Where the document's own numbered flow begins, as an offset into
    `region_html`.

    Reads the page's printed paragraph numbers and asks, of every block
    numbered 1, how many numbers the walker would accept if it started
    there -- the walker's own rule, which takes a number greater than the
    last it accepted and reads anything else as a false positive. The best
    answer wins, and among equal answers the LAST one does. The offset
    returned is the `<hr>` rule before that block, so the masthead and the
    headings above it stay with the body where they belong.

    WHY THE LAST OF THE EQUALS IS THE DOCUMENT'S OWN. The letter of
    transmittal numbers its paragraphs 1 to 5 in the same shape the document
    numbers its 583, and starting at the letter accounts for exactly as many
    numbers as starting at the document does -- the letter's 1..5 stand in
    for the document's, and the walk then picks the document up at 6. So the
    two tie by construction, always, and the tie is the signal: front matter
    can only ever be read as a PREFIX of the numbering that follows it, never
    as a longer one. The later start is the one with no front matter in it.

    WHY IT COUNTS RATHER THAN MEASURING A RUN. It measured a run of
    consecutive numbers until it met the other eleven editions, and every one
    of them prints a paragraph the parser cannot number -- Polish loses 35,
    Hungarian 116, Albanian 254 -- so a rule that stops at the first gap
    stopped 34 paragraphs into a Polish document and elected the letter
    instead. A gap is ordinary (`ScrapeState.record_gap` exists for it); a
    RESET to 1 is not, and the count is what tells them apart.
    """
    numbered: list[tuple[int, int]] = []  # (offset, printed number)
    for m in vd._BLOCK_RE.finditer(region_html):
        inner, _ = vd.block_kind(m)
        hit = vd.match_para_num(inner)
        # PAST THE WORK'S OWN LAST PARAGRAPH IS NOT A PARAGRAPH. The
        # Vietnamese edition breaks a footnote onto a line reading `1913.`
        # -- a Catechism paragraph the note cites -- which is a numbered
        # paragraph by every rule that reads this work's own, and it opened a
        # section 1913 and dragged the end of the numbering into the notes.
        # This work is 583 paragraphs in every language it exists in, which
        # `validate` already asserts; here it is what bounds the walk.
        if hit and hit[0] <= EXPECTED_SECTIONS:
            numbered.append((m.start(), hit[0]))
    best: tuple[int, int, int] | None = None  # (count, start offset, last offset)
    for i, (offset, n) in enumerate(numbered):
        if n != 1:
            continue
        run, last, last_offset = 0, 0, offset
        for later_offset, later in numbered[i:]:
            if later > last:
                run, last, last_offset = run + 1, later, later_offset
        if best is None or run >= best[0]:
            best = (run, offset, last_offset)
    if best is None or best[0] < _BODY_RUN_MIN:
        raise ValueError(
            f"no block numbered 1 opens a sequence of at least {_BODY_RUN_MIN} "
            f"paragraph numbers (best found: {best[0] if best else 0}) -- this "
            "page's body numbering is not what this scraper reads"
        )
    _count, start, last_offset = best
    rule = list(vd._HR_RE.finditer(region_html[:start]))
    return (rule[-1].start() if rule else start), last_offset


#: How many definitions in a row make the footnote list, for THIS work. Two
#: orders of magnitude above `vatican_docs._FN_RUN_MIN`, and it can be:
#: every edition of the Compendium of the Social Doctrine prints the same
#: 1,232 notes, so a hundred in sequence is a fact about the work rather than
#: a threshold about pages in general. That is the whole reason this is
#: decided here instead of there.
_NOTES_RUN_MIN = 100


def find_notes_start(region_html: str, after: int) -> int | None:
    """Where this page's footnote list begins, as an offset into
    `region_html`, or None where nothing here reads as one.

    `after` is the offset of the work's last numbered paragraph, which is
    what makes this answerable at all: the notes follow the document, so
    everything before that offset is out of the question and the index of
    references between them cannot be mistaken for a list of notes, having no
    run of numbers counting from one.

    Four editions need this and each defeats `find_footnote_region_start` for
    its own reason -- Italian and French label a note `<sup>1</sup>`, which
    strips to `1Cfr.` and is unreadable as text; Hungarian labels it
    `1231&nbsp;` and its own paragraphs `1. `, which no rule over one line
    separates; Polish prints all 1,232 inside a handful of paragraphs
    separated by `<br>`, so there is no paragraph to label. Read together
    they are unmistakable, which is what a run of a hundred says and a run of
    three does not.
    """
    lines: list[tuple[int, int | None]] = []
    for block in vd._BLOCK_RE.finditer(region_html):
        if block.start() <= after:
            continue
        inner, _kind = vd.block_kind(block)
        # A NOTE IS NOT A NUMBERED PARAGRAPH. `_FN_BARE_RE` admits `1231 A
        # Katolikus...` and `1. Az Egyház...` alike, so without this the
        # Hungarian body would read as a footnote list of its own.
        numbered = vd.match_para_num(inner) is not None
        for j, line in enumerate(vd._BR_SPLIT_RE.split(inner)):
            if vd.strip_tags(line).strip():
                lines.append((block.start(), _note_label(line, numbered and j == 0)))
    labelled = [(offset, n) for offset, n in lines if n is not None]
    for k, (offset, n) in enumerate(labelled):
        if n != 1:
            continue
        run = 0
        for _later_offset, later in labelled[k:]:
            # Skips anything that is not the next number: a note wraps onto
            # `(1970), 837-838;` and onto `1913.`, and both read as labels.
            if later == run + 1:
                run += 1
        if run >= _NOTES_RUN_MIN:
            return offset
    return None


def _note_label(line_html: str, is_numbered_paragraph: bool) -> int | None:
    """The footnote number this printed line is labelled with, if any."""
    m = _SUP_LABEL_RE.match(line_html)
    if m:
        return int(m.group(1))
    text = vd.strip_tags(line_html)
    for label_re in (vd._FN_BRACKET_RE, vd._FN_PAREN_RE, vd._FN_TRAILING_PAREN_RE):
        m = label_re.match(text)
        if m and m.group(1).isdigit():
            return int(m.group(1))
    if is_numbered_paragraph:
        return None
    m = vd._FN_BARE_RE.match(text)
    return int(m.group(1)) if m else None


#: Read off the RAW markup, which is the only place this label exists:
#: `<p><sup>1</sup>Cfr. Giovanni Paolo II...` strips to `1Cfr.`.
_SUP_LABEL_RE = re.compile(r"^\s*<sup[^>]*>\s*(\d{1,4})\s*</sup>", re.IGNORECASE)


# --------------------------------------------------------------------------
# The two printed sigla tables
# --------------------------------------------------------------------------

#: A sigla table is one paragraph of `<br>`-separated rows, which is also
#: what `ccc.py`'s French Catechism table is -- and what an ordinary
#: paragraph of prose is not. The discriminator is the row count and the row
#: LENGTH: a table's rows are `AAS Acta Apostolicae Sedis`, a poem's or an
#: address block's are not many and a paragraph broken by `<br>` is not
#: short. Both numbers are deliberately generous; what keeps the test honest
#: is that the run is reported and read, never counted and believed.
_SIGLA_MIN_ROWS = 10
_SIGLA_MAX_MEDIAN_ROW = 70

#: How long the text before an italic boundary may be and still be an
#: abbreviation. Past this the italics are marking something INSIDE the
#: expansion instead -- `DS H. Denzinger - A. Schönmetzer, <i>Enchiridion
#: Symbolorum...</i>` sets the title and not the gloss -- and the dotted-token
#: rule reads the row correctly where the typography does not.
_SIGLA_ABBR_MAX_CHARS = 12

_ITALIC_BOUNDARY_RE = re.compile(r"</?\s*(?:i|em)\b[^>]*>", re.IGNORECASE)
_LEADING_ITALIC_CLOSE_RE = re.compile(r"^\s*</\s*(?:i|em)\s*>", re.IGNORECASE)
_LEADING_ITALIC_OPEN_RE = re.compile(r"^\s*<\s*(?:i|em)\b[^>]*>", re.IGNORECASE)


#: How many non-breaking spaces at the head of a line mean "this line starts
#: in the second column". The Vietnamese edition lays its table out with them
#: rather than with a table: an abbreviation, twenty-odd `&nbsp;`, then the
#: expansion -- and where an expansion runs onto a second line, that line
#: opens with the same run and no abbreviation. Read line for line it gave
#: `trở  đi.` and `definitionum  et declarationum...` as sigla of their own.
#: Four is `vatican_docs._TOC_INDENT_MIN`, which reads the same signal in a
#: table of contents.
_SIGLA_CONTINUATION_INDENT = 4

#: The longest a block may be and still be read as a table's heading. A
#: heading names a table; a paragraph of prose that happens to be centred
#: does not.
_SIGLA_HEADING_MAX_CHARS = 80

_LEADING_GAP_RE = re.compile(r"^(?:\s|&nbsp;|&#160;|&#[xX]0*[aA]0;|\xa0)*")


def _sigla_rows(inner_html: str) -> list[str]:
    """A sigla block's printed rows, with wrapped expansions folded back in.

    Splitting on `<br>` alone is what the page prints, and it is one row too
    many wherever an expansion wraps: the second line carries no
    abbreviation, only the column gap that stands where one would be. Joining
    it to the row above is what the page means.
    """
    rows: list[str] = []
    for line in vd._BR_SPLIT_RE.split(inner_html):
        if not vd.strip_tags(line).strip():
            continue
        gap = _LEADING_GAP_RE.match(line)
        indent = len(re.findall(r"&nbsp;|&#160;|\xa0", gap.group(0))) if gap else 0
        if rows and indent >= _SIGLA_CONTINUATION_INDENT:
            rows[-1] = f"{rows[-1]} {line}"
        else:
            rows.append(line)
    return rows


def split_siglum_row(row_html: str) -> tuple[str, str] | None:
    """One `<br>`-separated row -> (abbreviation, expansion), or None.

    TWO RULES, and the source's own typography is the first of them. Both
    tables set italics, and each uses them the other way round: the general
    table italicises the EXPANSION (`a. <i>in articulo</i>`), the biblical
    one the ABBREVIATION (`<i>Am </i>Amos`). Either way the first italic
    boundary in the row is where the abbreviation stops, which is why one
    rule reads both -- and why it reads `ad 1um in responsione ad 1
    argumentum` correctly, where a rule over the words alone cannot tell the
    two-token abbreviation from a two-word expansion.

    The fallback is `ccc.py`'s, plus one rule of its own. `ccc.py`'s: an
    abbreviation is the run of leading dot-terminated tokens (`Ap. Exhort.`),
    or the first token alone when none is dotted (`AAS`). It runs where the
    row sets no italics at all, and where what precedes the first boundary is
    too long to be an abbreviation.

    The rule of its own is what an ABBREVIATION IS: `Ap. Letter Apostolic
    Letter` shortens two words to two, and the dotted rule reads only the
    first of them because `Letter` carries no period. So the split is also
    tried against the expansion itself -- the longest point at which every
    abbreviation token is a prefix of the expansion token facing it. `Ap.` is
    a prefix of `Apostolic` and `Letter` of `Letter`, and no shorter split
    satisfies both. It fires on nine rows of the English table and changes
    two; on the rest it agrees with the dotted rule, and where it finds no
    such point at all (`AAS Acta Apostolicae Sedis`, whose siglum is initials
    rather than a truncation) it says nothing and the dotted rule stands.
    """
    row_html = _LEADING_ITALIC_CLOSE_RE.sub("", row_html)
    boundary = None
    open_m = _LEADING_ITALIC_OPEN_RE.match(row_html)
    if open_m:
        # The row OPENS its italics: the run itself is the abbreviation, so
        # the boundary that ends it is the closing tag, not the opening one.
        close = _ITALIC_BOUNDARY_RE.search(row_html, open_m.end())
        if close:
            boundary = (open_m.end(), close.start())
    else:
        m = _ITALIC_BOUNDARY_RE.search(row_html)
        if m:
            boundary = (0, m.start())
    if boundary is not None:
        abbr = vd.strip_tags(row_html[boundary[0] : boundary[1]]).strip()
        rest = vd.strip_tags(row_html[boundary[1] :]).strip()
        if abbr and rest and len(abbr) <= _SIGLA_ABBR_MAX_CHARS:
            return abbr, rest
    text = re.sub(r"\s+", " ", vd.strip_tags(row_html)).strip()
    if not text:
        return None
    tokens = text.split(" ")
    n = 0
    while n < len(tokens) - 1 and tokens[n].endswith("."):
        n += 1
    if n == 0:
        n = 1
    n = max(n, _truncation_split(tokens))
    abbr, expansion = " ".join(tokens[:n]), " ".join(tokens[n:])
    return (abbr, expansion) if expansion else None


def _truncation_split(tokens: list[str]) -> int:
    """The longest k such that each of `tokens[:k]` is a truncation of the
    token facing it in `tokens[k:]`, or 0 where there is none.

    Case-sensitive and period-stripped, which is what a truncation is: `Ap.`
    truncates `Apostolic`, `cf.` does not truncate `conferatur` (it contracts
    it) and correctly finds nothing here -- the dotted rule already reads
    that row. Never returns a k that would leave the expansion empty."""
    best = 0
    for k in range(1, len(tokens)):
        rest = tokens[k:]
        if len(rest) < k:
            break
        if all(
            rest[i].startswith(tokens[i].rstrip(".")) and tokens[i].rstrip(".")
            for i in range(k)
        ):
            best = k
    return best


def sigla_tables(front_html: str) -> list[tuple[str, list[dict]]]:
    """Every sigla table in the front matter, as `(heading, rows)`.

    The heading is the last full-bold block above the table, which is what
    the page prints over it, kept verbatim in each row's `section` so a
    consumer can regroup without this file having guessed a taxonomy -- the
    same contract `ccc.py` writes.
    """
    out: list[tuple[str, list[dict]]] = []
    heading = ""
    for m in vd._BLOCK_RE.finditer(front_html):
        inner, attrs = vd.block_kind(m)[0], m.group(0)
        text = vd.strip_tags(inner).strip()
        if _is_sigla_block(m):
            rows = _sigla_rows(inner)
        else:
            # A HEADING, OR NOTHING. Bold is what every edition but one sets
            # its two table headings in; the Vietnamese sets `BẢNG CHỮ VIẾT
            # TẮT` centred and unemphasised, and taking only bold left its
            # table filed under the copyright notice three blocks above it.
            # Short is what keeps a centred paragraph of prose out.
            if (
                text
                and len(text) <= _SIGLA_HEADING_MAX_CHARS
                and (vd.is_full_bold(inner) or vd._CENTERED_RE.search(attrs))
            ):
                heading = text
            continue
        parsed = []
        for row in rows:
            split = split_siglum_row(row)
            if split:
                parsed.append(
                    {
                        "abbr": split[0],
                        "expansion": split[1],
                        # The only division either table draws is the one its
                        # own headings draw, and this page draws it: a second
                        # table, under its own heading, holding the books of
                        # Scripture. Which of the two that is cannot be read
                        # off the heading's words in twelve languages, so it
                        # is read off the rows -- see `looks_scriptural`.
                        "kind": "general",
                        "section": heading,
                    }
                )
        if parsed:
            out.append((heading, parsed))
    return out


#: A table is the Scripture one when most of its expansions name books this
#: corpus already knows in this language. `common.book_forms` is the site's
#: own book table, exported (see CLAUDE.md); it answers for the eleven
#: languages `refs-grammar.ts` has a config for and answers nothing for the
#: rest, which is why a MISS falls back to position rather than to a guess.
_SCRIPTURE_MIN_SHARE = 0.5


def looks_scriptural(rows: list[dict], lang: str) -> bool:
    try:
        forms = common.book_forms(lang)
    except KeyError:
        # No config for this language in the site's grammar. Deliberately not
        # falling back to English: an English book table would answer for a
        # Vietnamese page by accident of shared Latin letters, and a wrong
        # `kind` on 73 rows is worse than the positional fallback the caller
        # already has.
        return False
    known = {vd.fold(f) for fs in forms.values() for f in fs}
    hits = sum(1 for r in rows if vd.fold(r["abbr"]) in known)
    return hits >= _SCRIPTURE_MIN_SHARE * len(rows)


def build_abbreviations(front_html: str, lang: str) -> tuple[list[dict], list[str]]:
    """`abbreviations.json`, and the notes a reader of the run should see."""
    tables = sigla_tables(front_html)
    notes = [
        f"sigla table {i + 1}: {heading!r}, {len(rows)} rows"
        for i, (heading, rows) in enumerate(tables)
    ]
    out: list[dict] = []
    for heading, rows in tables:
        # `kind` IS ASSERTED ONLY WHERE THE BOOK TABLE CORROBORATES IT. It
        # was position for a day -- the general table first, Scripture second,
        # which is how ten of the twelve editions print them -- and Hungarian
        # is why that is gone: it prints no general table at all and splits
        # Scripture into two, `Ószövetség` (45 rows) and `Újszövetség` (27),
        # so "the second of two" filed the Old Testament as general sigla and
        # the New as Scripture. Under-claiming is recoverable and a consumer
        # can regroup from `section`, which keeps the source's own heading;
        # a wrong `kind` on 45 rows is a claim about someone else's book.
        if looks_scriptural(rows, lang):
            for row in rows:
                row["kind"] = "scripture"
        else:
            notes.append(
                f"{heading!r}: every row left `general` -- "
                + (
                    "the book forms for this language recognise too few of its "
                    "abbreviations to call it Scripture"
                    if _has_book_forms(lang)
                    else f"no book forms exist for {lang!r} to corroborate one"
                )
            )
        out.extend(rows)
    return out, notes


def _has_book_forms(lang: str) -> bool:
    try:
        common.book_forms(lang)
    except KeyError:
        return False
    return True


# --------------------------------------------------------------------------
# Front matter, as unnumbered units
# --------------------------------------------------------------------------


def _front_cut(blocks: list[re.Match], skip: set[int]) -> int:
    """The last block index that is front-of-book apparatus rather than front
    MATTER, or -1 when the region has no such boundary to read.

    THE GUARD IS NOT A FUDGE. `csdc.vi` prints its one sigla table as the
    LAST block of the region -- nothing follows it there at all -- so cutting
    at it would delete that edition's whole front matter, which is a
    translator's copyright note and the only thing it prints. An edition
    whose tables end the region printed no letter after them, so there is
    nothing the cut could be protecting; it returns -1 and the region is read
    exactly as it was.
    """
    if not skip:
        return -1
    last = max(skip)
    for m in blocks[last + 1 :]:
        inner, _ = vd.block_kind(m)
        text = vd.strip_tags(inner).strip()
        if text and vd.has_words(text):
            return last
    return -1


def front_units(front_html: str, marker_template: str, skip: set[int]) -> list[dict]:
    """The letter of transmittal and the presentation, in `appendix.json`'s
    shape -- `{title?, blocks, citations}`, the same one `parse_document`
    gives the matter after a document's last numbered paragraph.

    THEIR PARAGRAPH NUMBERS ARE KEPT AS TEXT, deliberately. The letter prints
    `1.` through `5.` and the appendix has no `n` to put them in; stripping
    them would silently unpublish five numbers the edition shows, and
    promoting them to addresses is exactly the confusion this module exists
    to prevent. So they render as printed, inside the block.

    `skip` names the block indexes the sigla reader has already taken, so a
    table is not stored twice -- once decoded in `abbreviations.json` and
    once as a wall of `<br>`s here. A heading left with nothing under it
    BECAUSE of that goes with its table: `ABBREVIATIONS` is the name of a
    file now, not of an empty unit. A heading that had nothing under it on
    the page stays, which is the same rule `parse_document` applies to the
    matter after the last paragraph -- the dedication (`TO HIS HOLINESS POPE
    JOHN PAUL II, MASTER OF SOCIAL DOCTRINE...`) is a heading with no body
    and is the only thing on its page.

    AND THE TABLES ARE ALSO THE BOUNDARY, which is what `_front_cut` reads
    them as. `split_page` can only excise the table of contents where
    `toc_link_span` recognises one, and it recognises one by its links
    pointing forward -- so on the four editions whose contents list is plain
    text (`hu`, `pl`, `vi`, and any that joins them) it returns `None`,
    `toc_start`/`toc_end` collapse to `(0, 0)`, and this region opens at the
    language bar with the whole contents list inside it. Hungarian shipped 64
    units of its own outline ahead of the letter that way, 207 KB of it.

    The page family fixes the order (see this module's docblock, region 3):
    the sigla tables are the last thing printed before the letter. So a block
    at or before the last one the sigla reader took cannot be the letter or
    the presentation, whatever it is -- title page, contents list, or the
    tables themselves -- and the cut states that rather than trying to
    recognise a contents list a second way.
    """
    blocks = list(vd._BLOCK_RE.finditer(front_html))
    cut = _front_cut(blocks, skip)
    units: list[dict] = []
    open_unit: dict | None = None
    for i, m in enumerate(blocks):
        if i <= cut:
            continue
        inner, kind = vd.block_kind(m)
        text = vd.strip_tags(inner).strip()
        if i in skip:
            if open_unit is not None:
                open_unit["emptied"] = True
                # AND THE UNIT IS CLOSED, not merely marked. Marking alone
                # left it open, so the next block that was not itself a
                # heading joined the heading whose table had just been taken
                # -- which is how `csdc.fr` shipped Cardinal Sodano's letter
                # under the title `ABRÉVIATIONS BIBLIQUES` (its first block
                # reads `SECRÉTAIRERIE D'ÉTAT`). English never showed it
                # because its letter opens with a full-bold heading, which
                # starts a unit of its own either way; French's does not.
                open_unit = None
            continue
        if not text or not vd.has_words(text):
            # An ornament, not a block. The page sets `***` between the
            # sigla tables and the letter, centred and italic like a heading
            # -- `has_words` is the predicate `promote_plain_centered_run`
            # already uses to keep punctuation out of the outline.
            continue
        if vd.is_full_bold(inner):
            open_unit = {"title": text, "blocks": [], "citations": []}
            units.append(open_unit)
            continue
        if open_unit is None:
            open_unit = {"title": "", "blocks": [], "citations": []}
            units.append(open_unit)
        marked = vd.mark_footnotes(inner, marker_template)
        block: dict = {"html": vd.narrow_html(marked)}
        if kind == "blockquote":
            block = {"kind": "quote", **block}
        open_unit["blocks"].append(block)
    return [
        {k: v for k, v in u.items() if k != "emptied"}
        for u in units
        if u["blocks"] or (u["title"] and not u.get("emptied"))
    ]


def drop_repeated_masthead(structure: list[dict], header: str) -> list[dict]:
    """Drop the outline's opening rows where they only repeat the title page.

    The page prints its title TWICE -- once over the table of contents and
    once again immediately above INTRODUCTION -- and only the first is the
    masthead. The second sits inside the body region, so it becomes a
    structure node: an outline whose first row is the work's own name, above
    the introduction, saying nothing the page's heading does not.

    Only from the FRONT, and only against what `read_masthead` already
    stored, so a heading that merely quotes the title mid-document survives.
    """
    printed = _flat(vd.strip_tags(header))
    out = list(structure)
    # Matched as a RUN of words inside the title page rather than line for
    # line: the page breaks `COMPENDIUM / OF THE SOCIAL DOCTRINE / OF THE
    # CHURCH` across three `<br/>`s in the masthead and prints it as one
    # heading in the body, so neither side's line breaks are the other's.
    while out and printed and _flat(out[0]["title"]) in printed:
        out.pop(0)
    return out


def _flat(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().casefold()


def read_masthead(masthead_html: str) -> str:
    """The title page, as the narrowed html `manifest.header` carries.

    Three lines on this page and every translation of it: the Council that
    speaks, the work's title, and the dedication to John Paul II. Two blocks
    are dropped and each for a reason of its own -- the language bar, which
    is the mirror's furniture and not the edition's (`drop_page_furniture`
    removes it from the body for the same reason), and a heading standing
    last, which is the heading OF the table of contents that followed it and
    now titles nothing.
    """
    blocks: list[tuple[str, bool]] = []  # (narrowed html, is a heading)
    for m in vd._BLOCK_RE.finditer(masthead_html):
        inner, _kind = vd.block_kind(m)
        text = vd.strip_tags(inner).strip()
        if not text or not vd.has_words(text) or vd._LANG_BAR_RE.match(text):
            continue
        blocks.append((vd.narrow_html(inner).strip(), vd.is_full_bold(inner)))
    if blocks and blocks[-1][1]:
        blocks.pop()
    return "<br/>".join(html for html, _heading in blocks)


# --------------------------------------------------------------------------
# Fetching
# --------------------------------------------------------------------------


def cache_name_for(lang: str) -> str:
    return f"{lang}.html"


def url_for(lang: str) -> str:
    return f"{_URL_BASE}{EDITIONS[lang]}.html"


def make_fetcher(offline: bool = False, refresh: bool = False) -> Fetcher:
    """vatican.va's conduct, from `vatican_docs.VATICAN_POLICY` -- the 2.0s
    floor is that host's `robots.txt` speaking and belongs to the host, not
    to whichever of this pipeline's scrapers is talking to it."""
    return Fetcher(
        RAW_ROOT,
        vd.VATICAN_POLICY,
        decode=vd.decode_page,
        offline=offline,
        refresh=refresh,
    )


# --------------------------------------------------------------------------
# Parse, validate, write
# --------------------------------------------------------------------------


@dataclass
class EditionResult:
    lang: str
    status: str
    problems: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    sections: int = 0
    citations: int = 0
    abbreviations: int = 0
    appendix: int = 0
    epigraphs: int = 0
    error: str = ""


def work_id_for(lang: str) -> str:
    return f"csdc.{lang}"


#: The edition's own paragraph count, which every language of one edition
#: shares because they are translations of one numbered text. Asserted rather
#: than reported: this work's whole address space is these numbers, and a
#: language that comes out with 578 of them has five addresses naming the
#: wrong paragraph -- the exact failure the letter of transmittal caused, and
#: the one nothing but a count would catch.
EXPECTED_SECTIONS = 583


#: Paragraphs this scraper cannot give an address to, per language, with the
#: reason read off the page. A gap NOT in this table fails the run.
#:
#: EVERY ONE IS THE SAME SOURCE DEFECT, and it is worth knowing before adding
#: to the table: the edition never closes the previous paragraph, so two
#: numbered paragraphs share one `<p>` with a `<br>` between them. The
#: walker reads one block, takes the number at its head, and the second
#: paragraph's text is appended to the first -- so NOTHING IS LOST, and what
#: is missing is an address rather than a sentence. It is the class
#: `vatican_docs.KNOWN_SOURCE_DEFECTS` records for `dilexit-nos.pt` §206,
#: which is the same defect with the number omitted instead of misplaced.
KNOWN_GAPS: dict[str, dict[int, str]] = {
    "pl": {
        35: "shares §34's paragraph, after `37. <br /> <br /> 35.`",
        123: "shares §122's paragraph, after two `<br>`",
        227: "shares §226's paragraph, after two `<br>`",
        487: "shares §486's paragraph, after two `<br>`",
        579: "shares §578's paragraph, after two `<br>`",
    },
    "hu": {
        116: "shares §115's paragraph: `...átadásával.\u201d223<b>116.</b>`",
    },
    "pt": {
        553: "the only paragraph of 583 whose number the edition does not "
        "embolden -- `<p>553 A promoção` against `<p><b>552 </b>`",
    },
}


#: The paragraph each of the work's three parts opens at. A constant, and a
#: fact about the WORK rather than about any edition: the ten editions are
#: translations of one numbered text, so the parts fall at the same three
#: numbers in all of them (the same fact `socialDoctrineChapterStarts` rests
#: on, site-side).
#:
#: It is not read off `structure` because the editions disagree about whether
#: the part heading reaches their outline at all -- `csdc.fr` emits no part
#: rows, `csdc.es` one, and `csdc.sw` read two of the epigraphs below AS
#: headings. There is nothing to key on there that is true ten times.
PART_STARTS = (20, 209, 521)


def lift_part_epigraphs(sections: list[dict]) -> int:
    """Move each part's epigraph off the paragraph before it and onto the
    paragraph it stands over. Returns how many were moved.

    THE SOURCE PRINTS `PART TWO`, A QUOTATION FROM CENTESIMUS ANNUS, AND THEN
    `CHAPTER FIVE`. `parse_document` reads that quotation as prose buffered
    under a heading and hands it back to the section the heading interrupted
    (`reclaim_mid_body_prose`: "the heading interrupted a paragraph, and the
    prose beneath is the rest of that paragraph") -- which is right for an
    encyclical's mid-paragraph subheading and wrong here. So §19 ended with
    Part One's epigraph, §208 with Part Two's and §520 with Part Three's, and
    a reader finishing a part read the NEXT part's epigraph as its last
    sentence.

    A NUMBERED PARAGRAPH OF THIS WORK IS EXACTLY ONE BLOCK, which is what
    makes the trailing blocks readable as the epigraph rather than guessed
    at: across the ten editions, §19, §208 and §520 are the only sections in
    nine of them that carry more than one, and every extra block is one of
    these three quotations. So this moves what is trailing rather than trying
    to recognise the quotation, whose markup is different in every edition --
    `align="right"` on the whole quotation in English, on the attribution
    alone in Hungarian, on nothing at all in Polish.

    Where it lands is the section the part OPENS at, not a structure node,
    for `PART_STARTS`' reason: half the editions have no part row to hang it
    on. `docs/corpus-schema.md` carries the field.
    """
    by_n = {s["n"]: s for s in sections}
    moved = 0
    for start in PART_STARTS:
        opening = by_n.get(start)
        if opening is None:
            continue
        before = [n for n in by_n if n < start]
        if not before:
            continue
        previous = by_n[max(before)]
        # Everything after the paragraph's own first block. An edition that
        # lost its epigraph into a heading (`csdc.sw` at §19 and §520) has
        # one block here and nothing moves, which is the honest outcome:
        # there is no epigraph in that edition's text to place.
        epigraph = previous["blocks"][1:]
        if not epigraph:
            continue
        del previous["blocks"][1:]
        opening["epigraph"] = epigraph
        moved += 1
    return moved


def validate(lang: str, state, structure: list[dict]) -> tuple[bool, list[str]]:
    problems: list[str] = []
    nums = sorted(state.sections)
    if not nums:
        problems.append("no numbered sections")
        return False, problems
    known = KNOWN_GAPS.get(lang, {})
    missing = [n for n in range(1, EXPECTED_SECTIONS + 1) if n not in state.sections]
    unexplained = [n for n in missing if n not in known]
    if unexplained:
        problems.append(
            f"missing {len(unexplained)} of {EXPECTED_SECTIONS} sections, "
            f"none of them in KNOWN_GAPS: {unexplained[:12]}"
            f"{' ...' if len(unexplained) > 12 else ''}"
        )
    # A table entry that stopped being true is a problem of its own: it means
    # the parse improved or the page changed, and either way the table is now
    # describing something that is not there.
    stale = [n for n in known if n in state.sections]
    if stale:
        problems.append(f"KNOWN_GAPS entries that are no longer gaps: {stale}")
    extra = [n for n in nums if n > EXPECTED_SECTIONS]
    if extra:
        problems.append(f"sections past {EXPECTED_SECTIONS}: {extra[:12]}")
    if not any(row.get("before") is not None for row in structure):
        problems.append("structure tree anchors nothing")
    empty = [n for n in nums if not state.sections[n].blocks]
    if empty:
        problems.append(f"{len(empty)} empty section(s): {empty[:12]}")
    # A section that cites a marker the footnote list never defined is a
    # dangling reference; the round-trip and range checks cannot see it,
    # because both sides of each are derived from the same block.
    dangling = {
        n: sorted(
            c["marker"]
            for c in state.sections[n].to_dict().get("citations", [])
            if not c.get("text")
        )
        for n in nums
    }
    known = KNOWN_DANGLING.get(lang, {})
    unexplained = {
        n: markers
        for n, markers in dangling.items()
        if markers and known.get(n, {}).keys() != set(markers)
    }
    if unexplained:
        problems.append(
            "citation(s) resolving to no footnote text and not in "
            f"KNOWN_DANGLING: {dict(list(unexplained.items())[:6])}"
        )
    return not problems, problems


#: Markers whose note this scraper cannot resolve, per language and section,
#: with the reason read off the page. Nine in the whole work, across three
#: editions, and they are two different things:
#:
#:   - HUNGARIAN IS A FALSE POSITIVE OF THE MARKER DETECTOR, not a dangling
#:     reference. That edition prints its real markers as bare digits glued to
#:     the word before them (`...átadásával.223`), which nothing can read
#:     safely, so `detect_marker_template` finds none -- and then finds five
#:     parenthesised numbers in §401, which are the enumerated conditions of a
#:     quotation ("(1) hogy biztos tudomás szerint...") and not references at
#:     all. Its `citations` are five phantoms and no more; the edition has no
#:     readable apparatus, which its manifest says.
#:   - PORTUGUESE AND VIETNAMESE ARE THE ORDINARY KIND: the marker is printed,
#:     the note is not, in four places out of 2,464 across the two editions.
KNOWN_DANGLING: dict[str, dict[int, dict[str, str]]] = {
    "hu": {
        401: dict.fromkeys(
            ("1", "2", "3", "4", "5"),
            "the quotation's own enumerated conditions, read as markers by a "
            "paren template this edition does not actually use",
        )
    },
    "pt": {
        339: {"708": "marker printed, no matching definition on the page"},
        374: {
            "768": "marker printed, no matching definition on the page",
            "769": "marker printed, no matching definition on the page",
        },
    },
    "vi": {414: {"847": "marker printed, no matching definition on the page"}},
}


def build_manifest(
    lang: str,
    url: str,
    retrieved_at: str,
    state,
    parse,
    notes: list[str],
    header: str,
) -> dict:
    lines = [
        (
            f"page shell: {parse.shell}; footnote-marker template: "
            f"{parse.marker_template}; footnote-region boundary evidence: "
            f"{parse.footnote_evidence}."
        ),
        (
            "Inline markup is stored per block in `html`, restricted to a closed "
            "allowlist (i, b, br, sup, blockquote); tags outside it keep their text "
            "and lose their markup (pipeline/docs/corpus.md)."
        ),
        (
            "The front matter -- the two sigla tables, Cardinal Sodano's letter of "
            "transmittal and Cardinal Martino's presentation -- is not part of the "
            "numbered flow; the tables are decoded into abbreviations.json and the "
            "prose is stored in appendix.json ahead of the index of references."
        ),
    ]
    lines.extend(notes)
    if lang in KNOWN_DANGLING:
        lines.append(
            "Markers with no note behind them, each recorded in "
            "`csdc.KNOWN_DANGLING` with the reason: "
            + "; ".join(
                f"\u00a7{n} {sorted(markers)}"
                for n, markers in sorted(KNOWN_DANGLING[lang].items())
            )
            + "."
        )
    for n, why in sorted(KNOWN_GAPS.get(lang, {}).items()):
        lines.append(
            f"§{n} has no address in this edition: {why}. Its text is not "
            f"missing -- the source prints it inside §{n - 1}'s paragraph, and "
            "it is stored there."
        )
    if state.gaps:
        lines.append(f"source section-number gaps detected: {state.gaps}")
    if state.orphan_content:
        lines.append(
            f"{len(state.orphan_content)} unnumbered content blocks not attached "
            "to any section (logged, not fabricated)."
        )
    if state.anomalies:
        lines.append(f"{len(state.anomalies)} anomalies recorded; see the run log.")
    return {
        "id": work_id_for(lang),
        "type": "social-doctrine",
        "document_kind": "compendium-social-doctrine",
        "title": TITLES.get(lang, TITLE),
        "short_title": TITLES.get(lang, SHORT_TITLE),
        "language": lang,
        "edition": "vatican.va HTML mirror",
        "pontiff_or_council": AUTHOR,
        "promulgated": PROMULGATED,
        "sources": [{"url": url, "retrieved_at": retrieved_at}],
        "copyright": {
            "status": "copyrighted",
            "holder": vd.COPYRIGHT_HOLDER,
            "notice": "Copyright © Dicastery for Communication – Libreria Editrice Vaticana",
        },
        "notes": " ".join(lines),
        "header": header,
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "corrections_applied": len(state.corrections_applied),
        # Every language the page's own bar offers that this pipeline does not
        # read, with the reason. See `PDF_ONLY`.
        "translations": {
            tag: {
                "status": "pdf-only",
                "checked_at": datetime.now(UTC).strftime("%Y-%m-%d"),
                "note": "vatican.va publishes this edition as PDF only",
            }
            for tag in PDF_ONLY
        },
    }


def write_outputs(
    lang: str,
    manifest: dict,
    state,
    structure: list[dict],
    sections: list[dict],
    appendix: list[dict],
    abbreviations: list[dict],
    overrides_applied: list[dict],
) -> None:
    work_id = work_id_for(lang)
    out_dir = BUILD_ROOT / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    files: dict[str, object] = {
        "manifest.json": manifest,
        "structure.json": structure,
        "sections.json": sections,
        "abbreviations.json": abbreviations,
        "corrections-applied.json": corrections_receipt(
            work_id,
            state.corrections_applied,
            state.corrections,
            manifest["generated_at"],
        ),
    }
    appendix_path = out_dir / "appendix.json"
    if appendix:
        files["appendix.json"] = appendix
    elif appendix_path.exists():
        appendix_path.unlink()
    if overrides_applied:
        files["overrides-applied.json"] = {
            "work_id": work_id,
            "generated_at": manifest["generated_at"],
            "applied": overrides_applied,
            "count": len(overrides_applied),
        }
    write_stamped_json(
        out_dir,
        files,
        manifest["generated_at"],
        remove=() if overrides_applied else ("overrides-applied.json",),
    )


def parse_edition(lang: str, html: str, write: bool = True) -> EditionResult:
    work_id = work_id_for(lang)
    url = url_for(lang)
    res = EditionResult(lang=lang, status="parse-error")

    corrections = load_corrections(work_id)
    pre_applied: list[dict] = []
    pre_seen: set[str] = set()
    html = vd.apply_raw_text_corrections(html, corrections, pre_applied, pre_seen)
    try:
        regions = split_page(html)
    except ValueError as exc:
        res.error = f"page split failed: {exc}"
        return res
    # Computed on the string `parse_document` will itself read, not on the
    # page as fetched: `without_front` has the front matter cut out of it, so
    # every offset in it differs from the original's.
    body = regions.without_front[
        vd.find_content_start_old_shell(regions.without_front) :
    ]
    try:
        _start, last_numbered = find_numbered_body_start(body)
    except ValueError as exc:
        res.error = f"page split failed: {exc}"
        return res
    try:
        parse = vd.parse_document(
            regions.without_front,
            lang,
            corrections,
            url,
            "compendio-dott-soc",
            AUTHOR,
            footnote_start=find_notes_start(body, last_numbered),
        )
    except Exception as exc:
        res.error = f"{type(exc).__name__}: {exc}"
        return res
    parse.state.corrections_applied = pre_applied + parse.state.corrections_applied
    parse.state.corrections_seen |= pre_seen

    missing = [
        c["id"]
        for c in corrections
        if not c.get("resolution") and c["id"] not in parse.state.corrections_seen
    ]
    if missing:
        res.status = "corrections-drift"
        res.error = f"correction entries never matched during parse: {missing}"
        return res

    abbreviations, notes = build_abbreviations(regions.front, lang)
    taken = {
        i
        for i, m in enumerate(vd._BLOCK_RE.finditer(regions.front))
        if _is_sigla_block(m)
    }
    front = front_units(regions.front, parse.marker_template, taken)
    # THE PAGE'S OWN TITLE PAGE, not `parse_document`'s reading of what is
    # left after it is cut out. `extract_document_header` looks for a
    # masthead above the first heading of the region it is given, and the
    # region it is given here opens at the second printing of the title,
    # immediately above INTRODUCTION -- so it found none and 583 sections
    # shipped with an empty `header`.
    header = read_masthead(regions.masthead)
    # THE FRONT MATTER ONLY. `parse.state.appendix_out` is region 5 -- the
    # index of references -- and it stopped being appended here on 2026-09-02
    # for two reasons that point the same way. It is not PROSE: it is a
    # concordance keyed to this work's own paragraph numbers ("1:26-27 26,
    # 36, 428"), so rendering it as unnumbered text gives a reader a wall of
    # digits and gives the corpus nothing it can resolve. And what was
    # captured was a fraction of it anyway -- the English edition's runs to
    # ~195 KB of text in `raw/` and 19 KB reached `appendix.json`, stopping
    # mid-block after Revelation 21:3 and losing the Ecumenical Councils, the
    # Papal Documents and everything after them outright.
    #
    # So `appendix.json` is what the source prints BEFORE section 1 -- the
    # letter of transmittal and the presentation -- and the index of
    # references is to be parsed as references rather than stored as text.
    # Until that parser exists the index is not written anywhere, which is
    # the honest state: a truncated concordance nobody can query is not a
    # smaller version of the thing, it is a different and useless one.
    appendix = front

    structure = drop_repeated_masthead(vd.build_structure(parse.state, TITLE), header)
    sections_out = [
        parse.state.sections[n].to_dict() for n in sorted(parse.state.sections)
    ]
    overrides = load_overrides(work_id)
    try:
        overrides_applied = common.apply_overrides(
            work_id, structure, sections_out, overrides
        )
    except common.OverrideDriftError as exc:
        res.status = "overrides-drift"
        res.error = str(exc)
        return res

    # After the overrides, so an override that repairs a block still sees
    # the shape the parse produced.
    res.epigraphs = lift_part_epigraphs(sections_out)

    ok, problems = validate(lang, parse.state, structure)
    res.problems = problems
    res.notes = notes
    res.sections = len(parse.state.sections)
    res.citations = sum(len(s.get("citations", [])) for s in sections_out)
    res.abbreviations = len(abbreviations)
    res.appendix = len(appendix)
    res.status = "validated" if ok else "validation-failed"

    if write:
        retrieved = captured_at(RAW_ROOT / cache_name_for(lang)) or datetime.now(
            UTC
        ).strftime("%Y-%m-%d")
        manifest = build_manifest(
            lang, url, retrieved, parse.state, parse, notes, header
        )
        write_outputs(
            lang,
            manifest,
            parse.state,
            structure,
            sections_out,
            appendix,
            abbreviations,
            overrides_applied,
        )
    return res


def _is_sigla_block(m: re.Match) -> bool:
    """Whether `sigla_tables` would take this block. Kept as one predicate
    used by both callers rather than two lists that agree today."""
    inner, _ = vd.block_kind(m)
    if vd.is_full_bold(inner):
        return False
    rows = _sigla_rows(inner)
    if len(rows) < _SIGLA_MIN_ROWS:
        return False
    lengths = sorted(len(vd.strip_tags(r).strip()) for r in rows)
    return lengths[len(lengths) // 2] <= _SIGLA_MAX_MEDIAN_ROW


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument(
        "--langs",
        default="en",
        help=(
            "comma-separated content languages, or 'all' for every edition "
            f"vatican.va publishes as HTML ({', '.join(sorted(EDITIONS))})"
        ),
    )
    ap.add_argument(
        "--fetch-only",
        action="store_true",
        help="capture the pages into raw/ and parse nothing",
    )
    ap.add_argument("--offline", action="store_true", help="cache only; never fetch")
    ap.add_argument(
        "--refresh", action="store_true", help="refetch and overwrite the cache"
    )
    ap.add_argument(
        "--dry-run", action="store_true", help="parse and report, write nothing"
    )
    ap.add_argument(
        "--report-sigla",
        action="store_true",
        help="print the decoded abbreviations table and exit",
    )
    args = ap.parse_args()

    require_corpus()
    langs = (
        sorted(EDITIONS)
        if args.langs == "all"
        else [t.strip() for t in args.langs.split(",") if t.strip()]
    )
    unknown = [t for t in langs if t not in EDITIONS]
    if unknown:
        print(
            f"no edition for {unknown} -- vatican.va publishes this work as HTML "
            f"in {', '.join(sorted(EDITIONS))}; see PDF_ONLY for the rest",
            file=sys.stderr,
        )
        return 2

    fetcher = make_fetcher(offline=args.offline, refresh=args.refresh)
    results: list[EditionResult] = []
    for lang in langs:
        text, err = fetcher.fetch_text(url_for(lang), cache_name_for(lang))
        if text is None:
            results.append(EditionResult(lang=lang, status="fetch-failed", error=err))
            continue
        if args.fetch_only:
            results.append(EditionResult(lang=lang, status="fetched"))
            continue
        if lang in WITHHELD:
            results.append(
                EditionResult(lang=lang, status="withheld", notes=[WITHHELD[lang]])
            )
            continue
        if args.report_sigla:
            regions = split_page(text)
            rows, notes = build_abbreviations(regions.front, lang)
            for note in notes:
                print(f"  [{lang}] {note}")
            for row in rows:
                print(f"  {lang} {row['kind']:<9} {row['abbr']:<14} {row['expansion']}")
            continue
        results.append(parse_edition(lang, text, write=not args.dry_run))

    if args.report_sigla:
        return 0

    failed = 0
    for r in results:
        print(f"csdc.{r.lang}: {r.status}")
        if r.status in ("validated", "validation-failed"):
            print(
                f"  sections {r.sections}  citations {r.citations}  "
                f"abbreviations {r.abbreviations}  appendix units {r.appendix}  "
                f"part epigraphs {r.epigraphs}/{len(PART_STARTS)}"
            )
        for note in r.notes:
            print(f"  [note] {note}")
        for problem in r.problems:
            print(f"  [problem] {problem}")
        if r.error:
            print(f"  [error] {r.error}")
        if r.status in ("validated", "withheld") or (
            args.fetch_only and r.status == "fetched"
        ):
            continue
        failed += 1
    print(
        f"\n{len(results) - failed}/{len(results)} edition(s) validated; "
        f"{fetcher.network_fetches} request(s), {fetcher.cache_hits} cache hit(s)"
    )
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
