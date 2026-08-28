#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The Crampon Bible (1923), from fr.wikisource, as `bible.crampon.fr`.

NO NETWORKING HAPPENS HERE. Every page this reads was already captured into
`raw/crampon/` by `capture.py` from `inventories/crampon.json` (2026-08-28).
This scraper only parses what is on disk -- see CLAUDE.md's "corrections and
overrides" section and `docs/link-surface.md`: `raw/` is write-once, and
re-parsing rather than re-crawling is the whole insurance policy.

SOURCE SHAPE. fr.wikisource serves this edition as one ProofreadPage
transclusion per book (`?action=render`, since `?action=raw` returns only the
`<pages>` directive with no text at all -- see the inventory's own note).
Verse anchors are already in the markup as `<span id="{chapter}-{verse}">`
wrapping a `<sup class="verset-num">` (the printed verse-number digit, which
is presentation and is stripped here, never carried into `text`). THERE ARE NO
CHAPTER HEADINGS TO WALK: a chapter boundary exists only where a verse
anchor's first component changes, so chapters are tracked purely from the
anchors, never from the `<span id="CHnn">`/`<a href="#Sommaire">N</a>` nav
markers scattered between them -- those are call-backs to the page's own
table of contents and are excluded on sight (see `is_skip_trigger`-shaped
logic in `VerseWalker.handle_starttag`).

WHY A WHITELIST, NOT A BLACKLIST, GATES VERSE TEXT. Every chapter/psalm in
this edition carries an editorial "argument" -- a paragraph or two of
Crampon's own analysis, printed between the verses and cross-referencing them
by roman numeral. It would be catastrophic to let that leak into `text`. The
obvious fix is to name its wrapper and skip it, but the wrapper has THREE
different, mutually inconsistent spellings across the corpus of 101 pages:
`<div class="alineanegatif">` (Genesis, Job, most of the Psalter), a bare
`<div class="alinea" style="...">` (Psalm 113 onward), and a bare
`<div style="text-align:center;clear:both;">` with NO CLASS AT ALL (Psalm
114's argument, and also -- confusingly -- the acrostic-letter labels in
Lamentations and the section-divider rule at the top of every book). Chasing
that enumeration is a losing game against a hand-typeset 1923 print edition
mirrored by volunteers over a century later. So the rule runs the other way:
verse text is captured ONLY from inside a `<p>` element (`content_depth`,
tracked by tag, below); every one of those argument blocks is a `<div>, never
a `<p>`, in all 101 pages actually captured, so all three spellings (and any
un-enumerated fourth one) are excluded for free, and nothing needs to be
special-cased by class name at all. `<span class="sc">` is NOT such a signal
-- it is small-caps typography used both for the editorial roman numerals
(already excluded structurally, since they sit in a `<div>`) and, twice in
running verse text (the word after a drop-cap, and a tribal name in the
Blessing of Jacob at Genesis 49), for the genuine text -- so it is left fully
transparent rather than stripped.

WHAT THIS COSTS: the acrostic Hebrew-letter labels in Lamentations 1-4
(`ALEPH.`, `BETH.`, ...) sit as a bare, classless `<div>` between two `<p>`
elements -- a real part of the printed page, attributable to no single verse
without guessing, since the label precedes the STANZA rather than sitting
inside any one verse's own paragraph. The `<p>`-only gate drops them rather
than mis-attaching them to whichever verse happens to be open at the time.
Documented here and in the manifest as a known v1 loss, recoverable from
`raw/` -- not invented, not guessed.

FOOTNOTES are the standard MediaWiki cite apparatus: `<sup id="cite_ref-N"
class="reference">` at the point of reference, resolving to `<li
id="cite_note-N">` in one `<ol class="references">` at the end of the page.
Numbering is per PAGE (i.e. per book -- continuous across every chapter of
that book, restarting only where the file does, which is why the Psalter's
five `Psaumes_N.html` files each restart at 1), never per verse or per
chapter, so a marker in the low hundreds is normal and not a defect. A named
ref (`cite_ref-p51_141-0` resolving to `cite_note-p51-141`, both meaning the
one printed as "[141]") is resolved by HREF, never by decoding the internal
name -- the visible bracketed number is read back out of the reference sup's
own text, which is the only representation guaranteed to match what a reader
of the 1923 page actually saw.

Litmus, matching the inventory's own note: Luke 1:28 renders "Je vous salue,
pleine de grâce ; le Seigneur est avec vous, vous êtes bénie entre les
femmes." Run:

    python3 pipeline/scrapers/bible/crampon.py
    python3 pipeline/scrapers/bible/edition_check.py bible.crampon.fr
"""

from __future__ import annotations

import re
import sys
from datetime import UTC, datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

# `common` is a package one directory up -- see CLAUDE.md, "the scrapers'
# layout", and cpdv.py's identical comment.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    CorrectionDriftError,
    build_root,
    captured_at,
    chapter_opening_letter,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    write_stamped_json,
)

RAW_SUBDIR = "crampon"
WORK_ID = "bible.crampon.fr"
SOURCE_URL = "https://fr.wikisource.org/wiki/Bible_Crampon_1923"


def raw_dir() -> Path:
    """This scraper's already-populated fetch cache. Never written to here."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


# (osis, filename stem in raw/crampon/, no extension) in the schema's
# canonical order (docs/corpus-schema.md #"Canonical book order") -- this
# edition's own French print order matches it exactly, so `order` below is
# simply the 1-based position here. `ps` is handled separately: five files,
# not one (see `parse_psalter`).
BOOKS: list[tuple[str, str | None]] = [
    ("gen", "Genèse"),
    ("exod", "Exode"),
    ("lev", "Lévitique"),
    ("num", "Nombres"),
    ("deut", "Deutéronome"),
    ("josh", "Josué"),
    ("judg", "Juges"),
    ("ruth", "Ruth"),
    ("1sam", "1_Samuel"),
    ("2sam", "2_Samuel"),
    ("1kgs", "1_Rois"),
    ("2kgs", "2_Rois"),
    ("1chr", "1_Chroniques"),
    ("2chr", "2_Chroniques"),
    ("ezra", "Esdras"),
    ("neh", "Néhémie"),
    ("tob", "Tobie"),
    ("jdt", "Judith"),
    ("esth", "Esther"),
    ("1macc", "1_Machabées"),
    ("2macc", "2_Machabées"),
    ("job", "Job"),
    ("ps", None),
    ("prov", "Proverbes"),
    ("eccl", "Ecclésiaste"),
    ("song", "Cantique"),
    ("wis", "Sagesse"),
    ("sir", "Ecclésiastique"),
    ("isa", "Isaïe"),
    ("jer", "Jérémie"),
    ("lam", "Lamentations"),
    ("bar", "Baruch"),
    ("ezek", "Ézéchiel"),
    ("dan", "Daniel"),
    ("hos", "Osée"),
    ("joel", "Joël"),
    ("amos", "Amos"),
    ("obad", "Abdias"),
    ("jonah", "Jonas"),
    ("mic", "Michée"),
    ("nah", "Nahum"),
    ("hab", "Habacuc"),
    ("zeph", "Sophonie"),
    ("hag", "Aggée"),
    ("zech", "Zacharie"),
    ("mal", "Malachie"),
    ("matt", "Matthieu"),
    ("mark", "Marc"),
    ("luke", "Luc"),
    ("john", "Jean"),
    ("acts", "Actes"),
    ("rom", "Romains"),
    ("1cor", "1_Corinthiens"),
    ("2cor", "2_Corinthiens"),
    ("gal", "Galates"),
    ("eph", "Éphésiens"),
    ("phil", "Philippiens"),
    ("col", "Colossiens"),
    ("1thess", "1_Thessaloniciens"),
    ("2thess", "2_Thessaloniciens"),
    ("1tim", "1_Timothée"),
    ("2tim", "2_Timothée"),
    ("titus", "Tite"),
    ("phlm", "Philémon"),
    ("heb", "Hébreux"),
    ("jas", "Jacques"),
    ("1pet", "1_Pierre"),
    ("2pet", "2_Pierre"),
    ("1john", "1_Jean"),
    ("2john", "2_Jean"),
    ("3john", "3_Jean"),
    ("jude", "Jude"),
    ("rev", "Apocalypse"),
]
assert len(BOOKS) == 73, f"expected 73 books in BOOKS, got {len(BOOKS)}"

#: The Psalter's own five-way split (docs, "the edition's own policy"),
#: behind `Psaumes.html`'s index. Chapter numbers are continuous across the
#: five files (1-41, 42-72, 73-89, 90-106, 107-150) -- verified against the
#: anchors themselves, not merely against the index page's claim -- so the
#: five parses are simply concatenated, never renumbered.
PSALM_FILES = ["Psaumes_1", "Psaumes_2", "Psaumes_3", "Psaumes_4", "Psaumes_5"]

#: Curated jump-box abbreviations, French. Unlike cpdv.py's English table,
#: no name-derived fallback is added: this edition's display names are
#: multi-word ("Saint Matthieu", "Épître aux Romains") and butchering them
#: into a single lowercase run is not a real abbreviation anyone would type.
#: Every osis code is included as its own fallback abbreviation regardless.
_CURATED_ABBREVS_FR: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lv"],
    "num": ["nb"],
    "deut": ["dt"],
    "josh": ["jos"],
    "judg": ["jg"],
    "ruth": ["rt"],
    "1sam": ["1s", "1sam"],
    "2sam": ["2s", "2sam"],
    "1kgs": ["1r"],
    "2kgs": ["2r"],
    "1chr": ["1ch"],
    "2chr": ["2ch"],
    "ezra": ["esd"],
    "neh": ["ne"],
    "tob": ["tb"],
    "jdt": ["jdt"],
    "esth": ["est"],
    "1macc": ["1m"],
    "2macc": ["2m"],
    "job": ["jb"],
    "ps": ["ps", "psaume", "psaumes"],
    "prov": ["pr"],
    "eccl": ["qo", "eccl"],
    "song": ["ct"],
    "wis": ["sg"],
    "sir": ["si"],
    "isa": ["is"],
    "jer": ["jr"],
    "lam": ["lm"],
    "bar": ["ba"],
    "ezek": ["ez"],
    "dan": ["dn"],
    "hos": ["os"],
    "joel": ["jl"],
    "amos": ["am"],
    "obad": ["ab"],
    "jonah": ["jon"],
    "mic": ["mi"],
    "nah": ["na"],
    "hab": ["ha"],
    "zeph": ["so"],
    "hag": ["ag"],
    "zech": ["za"],
    "mal": ["ml"],
    "matt": ["mt"],
    "mark": ["mc"],
    "luke": ["lc"],
    "john": ["jn"],
    "acts": ["ac"],
    "rom": ["rm"],
    "1cor": ["1co"],
    "2cor": ["2co"],
    "gal": ["ga"],
    "eph": ["ep"],
    "phil": ["ph"],
    "col": ["col"],
    "1thess": ["1th"],
    "2thess": ["2th"],
    "1tim": ["1tm"],
    "2tim": ["2tm"],
    "titus": ["tt"],
    "phlm": ["phm"],
    "heb": ["he"],
    "jas": ["jc"],
    "1pet": ["1p"],
    "2pet": ["2p"],
    "1john": ["1jn"],
    "2john": ["2jn"],
    "3john": ["3jn"],
    "jude": ["jude"],
    "rev": ["ap"],
}

KNOWN_CHAPTER_COUNTS = {
    "gen": 50,
    "matt": 28,
    "rev": 22,
    "john": 21,
    "ps": 150,
    # Deuterocanonical chapter counts follow the Vulgate, not the shorter
    # Hebrew/Greek forms (inventory note; landmine #3) -- only the Psalter's
    # NUMBERING diverges, not which chapters exist.
    "tob": 14,
    "esth": 16,
    "bar": 6,
    "sir": 51,
    "dan": 14,
}

VOID_TAGS = {
    "br",
    "hr",
    "img",
    "meta",
    "link",
    "input",
    "area",
    "base",
    "col",
    "embed",
    "source",
    "track",
    "wbr",
}

# nbsp, narrow nbsp and a few other Unicode spaces this source's French
# typesetting uses before punctuation (": ; ! ?") -- folded to a plain space
# before whitespace collapses, same idiom as vatican_docs.py's `\xa0`
# handling and sacredbible.py's.
_WS_CHARS = " \t\r\n      "
_WS_RE = re.compile(f"[{_WS_CHARS}]+")

VERSE_ID_RE = re.compile(r"^(\d+)-(\d+)$")
MARKER_DIGITS_RE = re.compile(r"\d+")
MARKER_TOKEN_RE = re.compile(r"⟦([^⟦⟧]+)⟧")

NAME_LINK_RE = re.compile(
    r'<a href="//fr\.wikisource\.org/wiki/Bible_Crampon_1923/([^"?]+)"[^>]*>([^<]+)</a>'
)


def normalize_text(s: str) -> str:
    return _WS_RE.sub(" ", s).strip()


def abbrevs_for(osis: str) -> list[str]:
    seen: list[str] = []
    for a in [osis, *_CURATED_ABBREVS_FR.get(osis, [])]:
        if a not in seen:
            seen.append(a)
    return seen


def parse_book_names(html: str) -> dict[str, str]:
    """filename stem -> display name, read off `Livres.html`'s own ToC.

    The href's path component is percent-encoded but otherwise IS the raw
    filename stem (`Gen%C3%A8se` -> `Genèse`, matching `Genèse.html`
    exactly; `1_Samuel` needs no decoding at all) -- so this needs no
    separate osis/filename table of its own, just the one already in
    `BOOKS`."""
    names: dict[str, str] = {}
    for m in NAME_LINK_RE.finditer(html):
        stem = unquote(m.group(1))
        names[stem] = normalize_text(m.group(2))
    return names


class FootnoteDefsParser(HTMLParser):
    """Pass 1 over one page: `cite_note-*` `<li>` definitions -> plain text.

    Keyed by the full id (`cite_note-9`, or a named ref's `cite_note-p51-141`)
    so the body parser can resolve a reference by its `href` verbatim, never
    by decoding the internal ref-name scheme -- see the module docstring."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.defs: dict[str, str] = {}
        self._li_id: str | None = None
        self._reftext_depth = 0
        self._buf: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        idv = a.get("id") or ""
        if tag == "li" and idv.startswith("cite_note-"):
            self._li_id = idv
            self._buf = []
            self._reftext_depth = 0
        elif self._li_id is not None and self._reftext_depth == 0:
            if tag == "span" and "reference-text" in classes:
                self._reftext_depth = 1
        elif self._reftext_depth > 0:
            if tag == "span":
                self._reftext_depth += 1
            elif tag == "br":
                self._buf.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if self._reftext_depth > 0 and tag == "span":
            self._reftext_depth -= 1
        elif tag == "li" and self._li_id is not None:
            text = normalize_text("".join(self._buf))
            if text:
                self.defs[self._li_id] = text
            self._li_id = None
            self._buf = []

    def handle_data(self, data: str) -> None:
        if self._reftext_depth > 0:
            self._buf.append(data)


class VerseWalker(HTMLParser):
    """Pass 2 over one page: verse anchors + running text -> chapters.

    See the module docstring for why the gate is "inside a `<p>`" rather
    than "outside a named editorial wrapper"."""

    def __init__(self, footnote_defs: dict[str, str]) -> None:
        super().__init__(convert_charrefs=True)
        self.footnote_defs = footnote_defs
        self.chapters: dict[int, dict[int, dict]] = {}
        self.anomalies: list[str] = []

        self.cur_ch: int | None = None
        self.cur_v: int | None = None
        self.buf_text: list[str] = []
        self.buf_marked: list[str] = []
        self.verse_notes: dict[str, str] = {}

        self.tag_stack: list[bool] = []  # True if this open tag is a skip
        self.skip_depth = 0
        self.content_depth = 0  # count of open <p> we're nested in

        self.ref_active = False
        self.ref_href: str | None = None
        self.ref_marker_buf: list[str] = []

        # A second, standalone verse-number template found in Psaumes_2.html
        # only (Ps 55:10-20, Ps 58:2 -- 12 verses in the whole corpus):
        # `<span class="sidenote-left"><small>N</small></span>` with no
        # wrapping `<span id="chapter-verse">` at all. Silently ignoring it
        # is not an option -- with no anchor of its own, the verse's text
        # and its inline verse-number digit both fall straight into
        # whichever verse came before, e.g. Ps 55:9 swallowing "10Réduis-les
        # à néant... 11Jour et nuit..." digits and all. `n` comes from the
        # `<small>` text; the chapter is whatever `cur_ch` already is.
        self.sidenote_active = False
        self.sidenote_buf: list[str] = []

    # -- buffering -----------------------------------------------------
    def _emit(self, s: str) -> None:
        if self.content_depth > 0 and self.skip_depth == 0:
            self.buf_text.append(s)
            self.buf_marked.append(s)

    def flush_verse(self) -> None:
        # Before the FIRST anchor of the page, any text captured (the
        # "Chapitres 1. 2. 3. ..." table-of-contents paragraph is itself a
        # <p>, so content_depth>0 for it too) belongs to no verse and must be
        # discarded here, not merely left for the next flush to inherit --
        # otherwise it prefixes whatever verse 1 turns out to be.
        if self.cur_ch is None or self.cur_v is None:
            self.buf_text = []
            self.buf_marked = []
            self.verse_notes = {}
            return
        text = normalize_text("".join(self.buf_text))
        marked = normalize_text("".join(self.buf_marked))
        if not text:
            self.anomalies.append(f"{self.cur_ch}:{self.cur_v}: no text, dropped")
        else:
            verse: dict = {"n": self.cur_v, "text": text}
            if marked != text:
                markers = list(dict.fromkeys(MARKER_TOKEN_RE.findall(marked)))
                verse["text_marked"] = marked
                verse["notes"] = [
                    {"marker": m, "text": self.verse_notes[m]}
                    for m in markers
                    if m in self.verse_notes
                ]
            self.chapters.setdefault(self.cur_ch, {})[self.cur_v] = verse
        self.buf_text = []
        self.buf_marked = []
        self.verse_notes = {}

    # -- HTMLParser overrides -------------------------------------------
    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        idv = a.get("id") or ""

        is_skip = False

        verse_m = VERSE_ID_RE.match(idv) if tag == "span" else None
        if verse_m:
            self.flush_verse()
            self.cur_ch, self.cur_v = int(verse_m.group(1)), int(verse_m.group(2))
            is_skip = True  # hides the printed verse-number digit itself
        elif (
            tag in ("h1", "h2", "h3", "h4", "h5", "h6")
            or (tag == "ol" and "references" in classes)
            or (tag == "span" and "pagenum" in classes)
        ):
            is_skip = True
        elif tag == "a" and a.get("href") == "#Sommaire":
            # The decorative "jump to table of contents" chapter-number
            # badge printed between chapters -- not part of the text.
            is_skip = True
        elif tag == "sup" and "reference" in classes and idv.startswith("cite_ref"):
            is_skip = True
            if self.skip_depth == 0:
                self.ref_active = True
                self.ref_href = None
                self.ref_marker_buf = []
        elif tag == "span" and "sidenote-left" in classes:
            is_skip = True
            if self.skip_depth == 0:
                self.sidenote_active = True
                self.sidenote_buf = []

        entering_skip = is_skip or self.skip_depth > 0
        # Void elements (`<br>` above all -- ubiquitous inside the editorial
        # headings) never get a matching `handle_endtag`, so `skip_depth`
        # must never be incremented for one: doing so left it permanently
        # wedged positive after the first heading, silently discarding every
        # verse for the rest of the page. Only tags that will actually be
        # popped may push.
        if tag not in VOID_TAGS:
            self.tag_stack.append(entering_skip)
            if entering_skip:
                self.skip_depth += 1

        if self.ref_active and tag == "a" and self.ref_href is None:
            href = a.get("href") or ""
            self.ref_href = href.removeprefix("#")

        if tag == "p":
            # Guard space: a verse's own text can legitimately span more than
            # one <p> (e.g. Gen 1:31's closing refrain is its own paragraph;
            # see the module docstring's chapter-boundary discussion), and
            # the source's pretty-printed whitespace usually separates them
            # anyway -- this makes that not load-bearing.
            if self.cur_ch is not None and self.skip_depth == 0:
                self.buf_text.append(" ")
                self.buf_marked.append(" ")
            self.content_depth += 1

        if tag == "br":
            self._emit(" ")

    def handle_endtag(self, tag: str) -> None:
        if tag == "p":
            self.content_depth = max(0, self.content_depth - 1)

        finalize_ref = tag == "sup" and self.ref_active
        finalize_sidenote = tag == "span" and self.sidenote_active

        popped = self.tag_stack.pop() if self.tag_stack else False
        if popped:
            self.skip_depth = max(0, self.skip_depth - 1)

        if finalize_ref:
            # Right-strip the gap before the (removed) sup on BOTH buffers,
            # win or lose. The source always sets a footnote sup after a
            # literal space (typesetting convention: word, space,
            # superscript digit); `text` alone would swallow that for free
            # since the sup contributes nothing between two spaces and the
            # run collapses, but the moment a token is inserted into
            # `text_marked` it sits BETWEEN the two spaces and blocks that
            # collapse -- so this strips the gap explicitly, on both sides,
            # per the schema's own convention that a marker "sits
            # immediately after the last word" with no space of its own.
            # Applied even when the ref fails to resolve (no token added):
            # otherwise the orphaned space survives into `text` alone, which
            # is a schema violation (`corpus-schema.md`'s "double space") of
            # its own, in the OTHER direction from the ones this exists to
            # fix.
            self.buf_text = ["".join(self.buf_text).rstrip(_WS_CHARS)]
            self.buf_marked = ["".join(self.buf_marked).rstrip(_WS_CHARS)]

            marker = "".join(MARKER_DIGITS_RE.findall("".join(self.ref_marker_buf)))
            where = f"{self.cur_ch}:{self.cur_v}"
            if marker and self.ref_href:
                note_text = self.footnote_defs.get(self.ref_href)
                if note_text:
                    self.buf_marked.append(f"⟦{marker}⟧")
                    if (
                        marker in self.verse_notes
                        and self.verse_notes[marker] != note_text
                    ):
                        self.anomalies.append(
                            f"{where}: marker {marker!r} reused for two different notes"
                        )
                    self.verse_notes.setdefault(marker, note_text)
                else:
                    self.anomalies.append(
                        f"{where}: ref -> {self.ref_href!r} has no definition"
                    )
            else:
                self.anomalies.append(
                    f"{where}: malformed footnote ref (marker={marker!r} "
                    f"href={self.ref_href!r})"
                )
            self.ref_active = False
            self.ref_href = None
            self.ref_marker_buf = []

        if finalize_sidenote:
            num_text = "".join(self.sidenote_buf).strip()
            if num_text.isdigit() and self.cur_ch is not None:
                self.flush_verse()
                self.cur_v = int(num_text)
            else:
                self.anomalies.append(
                    f"{self.cur_ch}:{self.cur_v}: malformed sidenote-left verse "
                    f"number {num_text!r}"
                )
            self.sidenote_active = False
            self.sidenote_buf = []

    def handle_data(self, data: str) -> None:
        if self.ref_active:
            self.ref_marker_buf.append(data)
        if self.sidenote_active:
            self.sidenote_buf.append(data)
        self._emit(data)


def apply_raw_text_corrections(
    html_text: str,
    osis: str,
    corrections: list[dict],
    applied_log: list[dict],
    seen_ids: set[str],
) -> str:
    """Pre-parse corrections, as raw-HTML substring replacements.

    Not shared with `common.apply_verse_corrections`, which edits already-
    parsed verse `text` in place -- these edit the fetched page BEFORE
    parsing (docs/corpus-schema.md #Corrections: "claims the source is wrong
    and edits the fetched HTML before parsing"), which is what a wrong verse
    ANCHOR needs: `apply_verse_corrections` can only fix the text of a verse
    that already exists at the right (osis, chapter, verse); it cannot move
    one from the chapter its own mistyped anchor filed it under. Scoped by
    `osis` rather than a `page` field (unlike ccc.py/vatican_docs.py's own
    copies) because a Bible correction's locator already names its book, and
    every book but the Psalter is exactly one page.

    A miss here is NOT raised immediately: the Psalter's `osis` is `ps` for
    all five of its pages, so a correction addressed at one specific psalm is
    "not found" on the other four as a matter of course, not drift -- exactly
    the shape ccc.py's own `apply_raw_text_corrections` docstring describes
    ("simply not-yet-applied here... may belong to a different page").
    `run_scrape` checks after every page of every book has been tried that
    every non-`resolution` entry was seen somewhere, which is where real
    drift is actually caught."""
    for c in corrections:
        if c.get("resolution") or c["locator"].get("osis") != osis:
            continue
        if c["id"] in seen_ids:
            continue
        frm = c["from"]
        if frm in html_text:
            html_text = html_text.replace(frm, c["to"], 1)
            applied_log.append(dict(c))
            seen_ids.add(c["id"])
    return html_text


def parse_page(html: str) -> tuple[dict[int, dict[int, dict]], list[str]]:
    defs_parser = FootnoteDefsParser()
    defs_parser.feed(html)
    defs_parser.close()

    walker = VerseWalker(defs_parser.defs)
    walker.feed(html)
    walker.close()
    walker.flush_verse()
    return walker.chapters, walker.anomalies


def chapters_to_list(chapters: dict[int, dict[int, dict]]) -> list[dict]:
    out = []
    for n in sorted(chapters):
        verses = [chapters[n][v] for v in sorted(chapters[n])]
        out.append({"n": n, "verses": verses})
    return out


def parse_book(
    osis: str,
    filename: str,
    corrections: list[dict],
    applied_log: list[dict],
    seen_ids: set[str],
) -> tuple[list[dict], list[str]]:
    html = (raw_dir() / f"{filename}.html").read_text(encoding="utf-8")
    html = apply_raw_text_corrections(html, osis, corrections, applied_log, seen_ids)
    chapters, anomalies = parse_page(html)
    return chapters_to_list(chapters), [f"[{osis}] {a}" for a in anomalies]


def parse_psalter(
    corrections: list[dict], applied_log: list[dict], seen_ids: set[str]
) -> tuple[list[dict], list[str]]:
    combined: dict[int, dict[int, dict]] = {}
    anomalies: list[str] = []
    for filename in PSALM_FILES:
        html = (raw_dir() / f"{filename}.html").read_text(encoding="utf-8")
        html = apply_raw_text_corrections(
            html, "ps", corrections, applied_log, seen_ids
        )
        chapters, page_anomalies = parse_page(html)
        overlap = set(combined) & set(chapters)
        if overlap:
            anomalies.append(f"[ps] {filename}: chapter(s) {sorted(overlap)} repeat")
        combined.update(chapters)
        anomalies.extend(f"[ps] {a}" for a in page_anomalies)
    return chapters_to_list(combined), anomalies


def run_scrape() -> tuple[list[dict], list[str], list[dict], list[dict]]:
    names = parse_book_names((raw_dir() / "Livres.html").read_text(encoding="utf-8"))
    corrections = load_corrections(WORK_ID)
    applied_log: list[dict] = []
    seen_ids: set[str] = set()
    book_docs: list[dict] = []
    anomalies: list[str] = []
    for order, (osis, filename) in enumerate(BOOKS, start=1):
        if osis == "ps":
            chapters, book_anomalies = parse_psalter(corrections, applied_log, seen_ids)
            name = names.get("Psaumes", "Psaumes")
        else:
            assert filename is not None
            chapters, book_anomalies = parse_book(
                osis, filename, corrections, applied_log, seen_ids
            )
            name = names.get(filename)
            if not name:
                anomalies.append(f"[{osis}] no display name found in Livres.html")
                name = filename.replace("_", " ")
        anomalies.extend(book_anomalies)
        book_docs.append(
            {
                "osis": osis,
                "name": name,
                "abbrevs": abbrevs_for(osis),
                "order": order,
                "chapters": chapters,
            }
        )

    missing = [
        c["id"]
        for c in corrections
        if not c.get("resolution") and c["id"] not in seen_ids
    ]
    if missing:
        raise CorrectionDriftError(
            f"correction entries never matched during the run: {missing}"
        )
    return book_docs, anomalies, corrections, applied_log


def validate(book_docs: list[dict]) -> tuple[bool, list[str]]:
    """Assertions about THIS source -- shared schema shape is
    `edition_check.py`'s job (CLAUDE.md, "the scrapers' layout")."""
    ok = True
    report: list[str] = []

    def fail(msg: str) -> None:
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    by_osis = {b["osis"]: b for b in book_docs}

    if len(book_docs) != 73:
        fail(f"expected 73 books, got {len(book_docs)}")
    missing = {o for o, _ in BOOKS} - set(by_osis)
    if missing:
        fail(f"missing books: {sorted(missing)}")

    for osis, expected_n in KNOWN_CHAPTER_COUNTS.items():
        got_n = len(by_osis[osis]["chapters"])
        if got_n != expected_n:
            fail(f"{osis}: expected {expected_n} chapters, got {got_n}")

    # Landmine #2: the Psalter is Hebrew-numbered. Ps 9 (Heb) is short (LXX/
    # Vulgate's Ps 9 absorbs what Hebrew numbers as a separate Ps 10), and
    # Ps 10 (Heb) opens with the verse that is Vulgate 9:22.
    ps = by_osis.get("ps")
    if ps:
        ch9 = next((c for c in ps["chapters"] if c["n"] == 9), None)
        ch10 = next((c for c in ps["chapters"] if c["n"] == 10), None)
        if ch9 is None or len(ch9["verses"]) != 21:
            fail(
                f"ps 9: expected 21 verses (Hebrew numbering), got "
                f"{len(ch9['verses']) if ch9 else 'MISSING'}"
            )
        if ch10 is None or not ch10["verses"][0]["text"].startswith(
            "Pourquoi, Yahweh, te tiens-tu éloigné"
        ):
            fail(
                "ps 10:1 does not open with the expected Hebrew-numbering "
                f"litmus text: {ch10['verses'][0]['text'][:60]!r}"
                if ch10 and ch10["verses"]
                else "ps 10: missing or empty"
            )

    # Litmus from the inventory itself -- a substring, not the whole verse:
    # the verse also carries Luke's own narrative lead-in ("L'ange étant
    # entré...") and the quotation marks the source sets around the angel's
    # words, neither of which the inventory's one-line litmus quotes.
    luke = by_osis.get("luke")
    if luke:
        ch1 = next((c for c in luke["chapters"] if c["n"] == 1), None)
        v28 = next((v for v in (ch1["verses"] if ch1 else []) if v["n"] == 28), None)
        expected = (
            "Je vous salue, pleine de grâce ; le Seigneur est avec vous, "
            "vous êtes bénie entre les femmes."
        )
        if v28 is None or expected not in v28["text"]:
            fail(f"luke 1:28 mismatch: {v28['text'] if v28 else 'MISSING'!r}")

    # Verified by hand against raw/ (not a defect): each is a sentence this
    # edition's own chapter division genuinely cuts mid-flow, so the next
    # chapter opens lowercase because it IS a continuation, not a lost
    # capital. Isa 64:1 continues 63:19's "si vous déchiriez les cieux...";
    # Sir 6:1 continues 5:15's "Ne sois en faute...". Anything else the check
    # below finds is not pre-cleared and should be verified the same way
    # before assuming it is another one of these.
    KNOWN_CONTINUATIONS = {("isa", 64), ("sir", 6)}

    for b in book_docs:
        osis = b["osis"]
        for ch in b["chapters"]:
            if not ch["verses"]:
                fail(f"{osis} chapter {ch['n']}: no verses")
                continue
            if (osis, ch["n"]) in KNOWN_CONTINUATIONS:
                continue
            opening = chapter_opening_letter(ch["verses"][0]["text"])
            if opening is not None and opening.islower():
                fail(
                    f"{osis} {ch['n']}:{ch['verses'][0]['n']}: chapter opens on "
                    f"lowercase {opening!r} -- check against raw/ before filing "
                    "a correction"
                )

    return ok, report


def print_summary(book_docs: list[dict]) -> int:
    total_verses = 0
    total_notes = 0
    print(f"{'book':<8} {'chapters':>8} {'verses':>8} {'notes':>8}")
    print("-" * 36)
    for b in book_docs:
        n_chapters = len(b["chapters"])
        n_verses = sum(len(c["verses"]) for c in b["chapters"])
        n_notes = sum(
            len(v.get("notes") or []) for c in b["chapters"] for v in c["verses"]
        )
        total_verses += n_verses
        total_notes += n_notes
        print(f"{b['osis']:<8} {n_chapters:>8} {n_verses:>8} {n_notes:>8}")
    print("-" * 36)
    print(f"{'TOTAL':<8} {'':>8} {total_verses:>8} {total_notes:>8}")
    return total_verses


NOTES = (
    "Augustin Crampon's French translation, revised and completed "
    "posthumously (Crampon died in 1894) for Desclée, 1923 edition -- "
    "fr.wikisource's ProofreadPage transcription. "
    "COPYRIGHT BASIS: not a life-plus-70 case. The 1923 text is a "
    "posthumous collective revision, so French law runs the term from "
    "publication (1923 + 70 = expired 1994), not from the translator's "
    "death; fr.wikisource hosts it as public domain on that basis, which "
    "this record inherits rather than re-deriving. "
    "PSALM NUMBERING IS HEBREW, NOT VULGATE -- the FIRST such edition in "
    "this corpus (see psalm_numbering below). The edition prints its own "
    "policy in a footnote at Ps 9/10: numbering runs one unit ahead of the "
    "LXX/Vulgate from Ps 10 (Heb) through Ps 147 (Heb), 'sauf quelques "
    "exceptions' -- Ps 9-10 (Heb) fold into Vulgate's single Ps 9 (so Ps 9 "
    "(Heb) has only 21 verses); Ps 114-115 (Heb) fold into Vulgate's single "
    "Ps 113; Ps 116 (Heb) SPLITS across Vulgate's 114 and 115; Ps 147 (Heb) "
    "SPLITS across Vulgate's 146 and 147; Ps 1-8 and 148-150 agree in both "
    "systems. Text is stored exactly as this edition prints and numbers "
    "it -- no renumbering, no conversion -- per docs/link-surface.md's "
    "re-parse-not-re-crawl policy; site/src/lib/versification.ts converts "
    "at read time. "
    "'Yahweh' is printed throughout the Old Testament (absent from Esther, "
    "Judith, Tobit, Ecclesiastes and Wisdom, this edition's own "
    "convention) -- preserved verbatim, not a defect. "
    "Deuterocanonical chapter counts follow the Vulgate (Tobit 14, Esther "
    "16, Baruch 6 incl. the Letter of Jeremiah as ch. 6, Sirach 51, Daniel "
    "14 incl. Susanna and Bel and the Dragon) -- BOOK and CHAPTER presence "
    "match the Vulgate throughout. VERSE-per-chapter counts do not: "
    "edition_check.py measures 294 of 1334 chapters (22%) diverging from "
    "bible.clementina.la, and only 138 of those are inside Psalms/Malachi/"
    "Joel (this corpus's three already-known wholesale-divergent books) -- "
    "156 lie OUTSIDE them, e.g. Genesis, Exodus, Leviticus. So `psalm_"
    "numbering: hebrew` names a narrower thing than what is actually true "
    "of this edition: Hebrew/Masoretic verse division runs throughout the "
    "Old Testament, not only in the Psalter, and the field predates that "
    "finding. Left as `hebrew` rather than invented a new value for this "
    "record -- the schema question of whether the field should say so "
    "belongs to whoever is directing the corpus, not to this scraper. "
    "Text is stored under this edition's own verse numbers regardless "
    "(never renumbered), so the divergence is visible in the data whether "
    "or not the field names it. "
    "KNOWN V1 LOSSES, recoverable from raw/crampon/: inline emphasis "
    "(italic Latin/Hebrew terms in running text and in notes); the acrostic "
    "Hebrew-letter labels (ALEPH., BETH., ...) printed between verses in "
    "Lamentations 1-4, which sit outside any single verse's own paragraph "
    "and are dropped rather than mis-attached; a footnote's opening "
    "italicised lemma is not split out as a separate `lemma` field (unlike "
    "bible.douay-rheims.en) -- notes carry marker + full text only. Six "
    "verses (Jdt 6:21, 10:20, 13:31; 1 Mac 10:89, 12:54; 2 Mac 10:38) sit "
    "outside any <p> element in the source markup -- a transcription "
    "irregularity, not a versification choice -- and are omitted per "
    "corpus-schema.md's own rule for a verse this parser cannot recover "
    "('omit rather than store empty'), not reconstructed by guessing where "
    "a paragraph should have been. "
    "CORRECTIONS: pipeline/corrections/bible.crampon.fr.json fixes 6 "
    "source defects, applied pre-parse against the raw HTML -- 5 verse "
    "anchors mistyped with the wrong chapter digit (Exod 4:25, Exod 16:36, "
    "Deut 32:49, Dan 13:65, Ezra 4:24, each verified against its own text "
    "and against bible.clementina.la), and one footnote whose opening "
    "<ref> was lost in the source's wikitext, leaking its whole body as "
    "prose into Ps 120:1 (see corrections-applied.json). "
    "NOT INGESTED: fr.wikisource also carries a Nouveau Testament "
    "dictionary/glossary (Dictionnaire_du_Nouveau_Testament, ~325 KB) "
    "alongside this edition, captured into raw/ but not parsed here -- it "
    "is not scripture and has no home in this work; it may be worth its "
    "own future work id if the corpus ever wants a Bible dictionary."
)


def write_output(
    book_docs: list[dict], generated_at: str, receipt: dict, corrections_applied: int
) -> None:
    today = (
        captured_at(raw_dir() / "Bible_Crampon_1923.html")
        or datetime.now(UTC).date().isoformat()
    )

    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "La Sainte Bible, traduction de l'abbé Crampon",
        "short_title": "Crampon",
        "language": "fr",
        "edition": "1923 (Desclée), posthumous revision",
        "sources": [{"url": SOURCE_URL, "retrieved_at": today}],
        "copyright": {
            "status": "public-domain",
            "holder": None,
            "notice": None,
        },
        "notes": NOTES,
        "generated_at": generated_at,
        "psalm_numbering": "hebrew",
        "books": [b["osis"] for b in book_docs],
        "corrections_applied": corrections_applied,
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
    require_corpus()

    try:
        book_docs, anomalies, corrections, applied = run_scrape()
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1
    total_verses = print_summary(book_docs)

    if anomalies:
        print(f"\n{len(anomalies)} parsing anomalies:")
        for a in anomalies[:50]:
            print(f"  {a}")
        if len(anomalies) > 50:
            print(f"  ... and {len(anomalies) - 50} more")

    ok, report = validate(book_docs)
    print()
    if report:
        for line in report:
            print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))
    print(f"\n{total_verses} verses across {len(book_docs)} books")

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = corrections_receipt(WORK_ID, applied, corrections, generated_at)
    print(
        f"\nCorrections layer: {receipt['count']} applied, "
        f"{len(receipt['unresolved'])} documented unresolved/not-a-defect "
        "(see corrections-applied.json)"
    )
    write_output(book_docs, generated_at, receipt, receipt["count"])
    print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
