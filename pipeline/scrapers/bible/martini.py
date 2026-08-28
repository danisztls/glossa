#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The Bibbia Martini (Antonio Martini, 1775-81) as `bible.martini.it`.

NO NETWORKING HAPPENS HERE. Every page this reads was already captured into
`raw/martini/` by `capture.py` (2026-08-28) -- see CLAUDE.md's "corrections
and overrides" section and `docs/link-surface.md`: `raw/` is write-once, and
re-parsing rather than re-crawling is the whole insurance policy. This
scraper only reads what is already on disk.

SOURCE SHAPE. scrutatio.it serves this edition as one server-rendered HTML
page per chapter (`raw/martini/{slug}/{chapter:03d}.html`, 1,334 of them) plus
one book-grid `index.html`. A verse is
`<span class="versetto"><sup id="vidN" class="idvers">[<a href="#nK">]N[</a>]
</sup>{text}[<button popover with cross-ref badges>]</span>` -- the inner
`<a href="#nK">` is present only when that verse carries a footnote, keyed by
HREF rather than by position (see "range notes" below). Footnotes render as
`<p id="nK"><strong>{chapter},{verse}[-{verse2}]:</strong>[<em>{lemma}</em>]
{commentary}</p>` inside one `<div id="note">` per page, and Martini's own
chapter argument opens every page as a bare `<h2>`, captured as the chapter's
`summary` (docs/corpus-schema.md, "A chapter may carry a summary").

BOOK IDENTITY. `raw/martini/index.html`'s book grid (`<div id="libroN">
<div class="librobibbia" id="b-N"><h2>{Italian name}</h2>`) numbers the 73
books 1-73 in exactly this corpus's canonical OSIS order -- verified by
walking both lists side by side, not assumed -- so `order` below is simply
BOOKS' own position. Each chapter page's own `<title>` carries the source's
OWN abbreviation ("Genesi (Gen) 1", "Vangelo secondo Giovanni (Gv) 1"),
folded lowercase into `abbrevs` alongside the OSIS code -- an edition's own
siglum, not a guess, per CLAUDE.md's "Reference grammar".

RANGE NOTES ARE NOT 1:1 WITH A VERSE, AND THE PRINTED RANGE IS NOT ALWAYS
COMPLETE. A note anchored "27,34-38:" is linked from verses 34 AND 38 only
(the range's bracketing ends), never from 35-37 in between -- the source
marks a passage the way print does, with the number at the start and the end
of what it covers, not on every verse inside. So this parser resolves a
note's attachment from the HREF graph (which `vidN` sups actually link to
which `nK`), never by parsing the printed "chapter,verse[-verse]:" locator
and assuming every verse in that range should carry the token. The printed
locator is used only as a FALLBACK for the ~0.3% of notes with no HREF
anywhere on the page (see "Unanchored notes" below).

TWO MALFORMED-MARKUP TYPOS ARE NORMALIZED, NEITHER TOUCHES CONTENT WORDS. The
source's own HTML corrupts a handful of opening tags:

  - `<em<` for `<em>` (10 occurrences across the whole corpus) and one `<br<`
    for `<br>` -- an opening tag whose closing `>` is itself a stray `<`. Left
    alone, a permissive tag-stripper matches from the first `<` all the way to
    the NEXT `>` -- which, with no `>` in between, is the one closing the
    following well-formed `</em>` -- and silently deletes the real words
    between them. Fixed by a targeted, case-insensitive substitution before
    any other parsing touches the page.
  - `zem>` for `<em>`, exactly once in the whole corpus (Giuditta 9:11's note):
    the opening `<` and `e` are simply gone. Normalized the same way, scoped
    to immediately follow a note's `</strong>` locator so it cannot coincide
    with anything else.

Both are markup corruptions, not text typos -- the words on either side are
untouched -- so neither goes through `pipeline/corrections/`, which this
edition currently files none of: no source-text defect (a wrong WORD) has
been found here, only these markup glitches and the locator-drift cases
below, neither of which admits a single obviously-correct rewrite.

UNANCHORED NOTES: 50 of 17,277 notes (0.3%) carry no HREF anywhere on their
page. Per docs/corpus-schema.md ("Every token must have a note entry. A note
need not have a token"), such a note is filed against the verse ITS OWN
locator names, with a marker but no `text_marked` token. 13 of the 50 name a
verse that does not exist on the page at all -- e.g. 2 Corinthians 6's notes
"6,19:"-"6,23:" comment on what is verbatim the text of 2 Corinthians 7:1-4,
and Genesis 27's "27,65:"/"27,66:" against a chapter of 46 verses. This is a
source locator defect (chapter or verse mis-stamped upstream of the HTML,
not by this parser), has no single correct rewrite this scraper can infer
with confidence, and is NOT invented a repair: the note is dropped from
`build/` and counted as an anomaly. `raw/` keeps it verbatim, so nothing is
lost for good -- only for now (docs/link-surface.md).

EIGHT NOTES ARE PRINTED EMPTY -- a bare `<p id="nK"><strong>ch,v:</strong>
</p>` with no commentary at all (e.g. Salmi 88:1, Cantico 4:1). These are
dropped the same way: no note entry, no token, counted as an anomaly.

CROSS-REFERENCES (`<button data-bs-content="…<a class="badge riflat" …>">`,
one or more per verse, e.g. Genesis 1:1 links Job 38-39, Psalm 8 and Psalm
104) are stripped from verse text and counted but not stored --
docs/corpus-schema.md has no field for a cross-reference index, and inventing
one is not this scraper's call to make. The count is in the summary below so
a future schema decision has a number to start from.

THE PSALTER DIVERGES FROM THE CLEMENTINE IN BOTH DIRECTIONS, DELIBERATELY
UNTOUCHED. Psalm 9 has 38 verses here against the Clementine's 39; Psalm 113
has 27 against 26 -- one fewer AND one more, which rules out a single
missing-superscription explanation for either. Numbering is contiguous with
no gaps, no duplicates, no mid-chapter reset. Stored exactly as printed, per
docs/research/bible-edition-divergence.md: this is edition divergence, not a
defect, and `edition_check.py` reports it as a NOTE, never an ERROR.

KINGS CITATIONS IN NOTES USE THE FOUR-KINGDOMS SCHEME, LEFT VERBATIM. ~447
citations in "I./1. Reg." - "IV./4. Reg." form cite 1-2 Samuel and 1-2 Kings
by the old four-Regum numbering while this edition's own book titles are
modern (`1-re/`, `2-re/`, ...). Note text is stored raw and verbatim; the
site's own reference grammar resolves this ambiguity by work
(`refs-grammar.ts`'s `WORK_CONFIGS`, CLAUDE.md "Reference grammar") --
rewriting a citation inside a note here would be an editorial act this
scraper has no standing to take.

ONLY MARTINI WAS CAPTURED, ONLY MARTINI IS PARSED. scrutatio.it's own
edition-switcher menu links to a dozen other translations from every page
(CEI, Nuova Vulgata, Douay, King James, ...), several under active publisher
copyright -- but those links are bare URLs, and no other edition's TEXT is
embedded in a Martini page. Verified: this parser reads only
`<span class="versetto">` (verse text) and the one page-local `<div
id="note">` (Martini's own commentary), and nothing else in `raw/martini/`
was fetched to begin with (`capture.py`'s inventory names only `martini`
paths).

Litmus (docs/corpus-schema.md's own convention for a new edition): Luke 1:28
reads "Ed entrato l'Angelo da lei, disse: Dio ti salvi, piena di grazia: il
Signore è teco: Benedetta tu fra le donne."

    python3 pipeline/scrapers/bible/martini.py
    python3 pipeline/scrapers/bible/edition_check.py bible.martini.it
"""

from __future__ import annotations

import re
import sys
from datetime import UTC, datetime
from html import unescape
from pathlib import Path

# `common` is a package one directory up -- see CLAUDE.md, "the scrapers'
# layout", and cpdv.py's identical comment.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    build_root,
    captured_at,
    chapter_opening_letter,
    raw_root,
    require_corpus,
    write_stamped_json,
)

RAW_SUBDIR = "martini"
WORK_ID = "bible.martini.it"
SOURCE_URL = "https://www.scrutatio.it/bibbia/lettura/it/martini/1/1"


def raw_dir() -> Path:
    """This scraper's already-populated fetch cache. Never written to here."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


# (osis, slug in raw/martini/, Italian display name) in the schema's
# canonical order (docs/corpus-schema.md "Canonical book order") -- read off
# raw/martini/index.html's own book grid, ids 1-73, which walks in exactly
# this order. `order` below is simply this table's own 1-based position.
BOOKS: list[tuple[str, str, str]] = [
    ("gen", "genesi", "Genesi"),
    ("exod", "esodo", "Esodo"),
    ("lev", "levitico", "Levitico"),
    ("num", "numeri", "Numeri"),
    ("deut", "deuteronomio", "Deuteronomio"),
    ("josh", "giosue", "Giosuè"),
    ("judg", "giudici", "Giudici"),
    ("ruth", "rut", "Rut"),
    ("1sam", "1-samuele", "Primo libro di Samuele"),
    ("2sam", "2-samuele", "Secondo libro di Samuele"),
    ("1kgs", "1-re", "Primo libro dei Re"),
    ("2kgs", "2-re", "Secondo libro dei Re"),
    ("1chr", "1-cronache", "Primo libro delle Cronache"),
    ("2chr", "2-cronache", "Secondo libro delle Cronache"),
    ("ezra", "esdra", "Esdra"),
    ("neh", "neemia", "Neemia"),
    ("tob", "tobia", "Tobia"),
    ("jdt", "giuditta", "Giuditta"),
    ("esth", "ester", "Ester"),
    ("1macc", "1-maccabei", "Primo libro dei Maccabei"),
    ("2macc", "2-maccabei", "Secondo libro dei Maccabei"),
    ("job", "giobbe", "Giobbe"),
    ("ps", "salmi", "Salmi"),
    ("prov", "proverbi", "Proverbi"),
    ("eccl", "qoelet", "Qoelet"),
    ("song", "cantico", "Cantico"),
    ("wis", "sapienza", "Sapienza"),
    ("sir", "siracide", "Siracide"),
    ("isa", "isaia", "Isaia"),
    ("jer", "geremia", "Geremia"),
    ("lam", "lamentazioni", "Lamentazioni"),
    ("bar", "baruc", "Baruc"),
    ("ezek", "ezechiele", "Ezechiele"),
    ("dan", "daniele", "Daniele"),
    ("hos", "osea", "Osea"),
    ("joel", "gioele", "Gioele"),
    ("amos", "amos", "Amos"),
    ("obad", "abdia", "Abdia"),
    ("jonah", "giona", "Giona"),
    ("mic", "michea", "Michea"),
    ("nah", "naum", "Naum"),
    ("hab", "abacuc", "Abacuc"),
    ("zeph", "sofonia", "Sofonia"),
    ("hag", "aggeo", "Aggeo"),
    ("zech", "zaccaria", "Zaccaria"),
    ("mal", "malachia", "Malachia"),
    ("matt", "matteo", "Vangelo secondo Matteo"),
    ("mark", "marco", "Vangelo secondo Marco"),
    ("luke", "luca", "Vangelo secondo Luca"),
    ("john", "giovanni", "Vangelo secondo Giovanni"),
    ("acts", "atti-degli-apostoli", "Atti degli Apostoli"),
    ("rom", "romani", "Lettera ai Romani"),
    ("1cor", "1-corinzi", "Prima lettera ai Corinzi"),
    ("2cor", "2-corinzi", "Seconda lettera ai Corinzi"),
    ("gal", "galati", "Lettera ai Galati"),
    ("eph", "efesini", "Lettera agli Efesini"),
    ("phil", "filippesi", "Lettera ai Filippesi"),
    ("col", "colossesi", "Lettera ai Colossesi"),
    ("1thess", "1-tessalonicesi", "Prima lettera ai Tessalonicesi"),
    ("2thess", "2-tessalonicesi", "Seconda lettera ai Tessalonicesi"),
    ("1tim", "1-timoteo", "Prima lettera a Timoteo"),
    ("2tim", "2-timoteo", "Seconda lettera a Timoteo"),
    ("titus", "tito", "Lettera a Tito"),
    ("phlm", "filemone", "Lettera a Filemone"),
    ("heb", "ebrei", "Lettera agli Ebrei"),
    ("jas", "giacomo", "Lettera di Giacomo"),
    ("1pet", "1-pietro", "Prima lettera di Pietro"),
    ("2pet", "2-pietro", "Seconda lettera di Pietro"),
    ("1john", "1-giovanni", "Prima lettera di Giovanni"),
    ("2john", "2-giovanni", "Seconda lettera di Giovanni"),
    ("3john", "3-giovanni", "Terza lettera di Giovanni"),
    ("jude", "giuda", "Lettera di Giuda"),
    ("rev", "apocalisse", "Apocalisse"),
]
assert len(BOOKS) == 73, f"expected 73 books in BOOKS, got {len(BOOKS)}"

# Vulgate chapter counts for the books whose length is not utterly obvious,
# to sanity-check a full run against a source independent of the file count
# itself (docs/corpus-schema.md "Canonical book order" -- deuterocanonical
# portions included, per the Vulgate rather than the shorter Hebrew/Greek
# forms).
KNOWN_CHAPTER_COUNTS = {
    "gen": 50,
    "matt": 28,
    "rev": 22,
    "john": 21,
    "ps": 150,
    "tob": 14,
    "esth": 16,
    "bar": 6,
    "sir": 51,
    "dan": 14,
}

# --------------------------------------------------------------------------
# Parsing
# --------------------------------------------------------------------------

H2_RE = re.compile(r'id="centroBibbia"\s*>\s*<h2>(.*?)</h2>', re.DOTALL)
TITLE_ABBR_RE = re.compile(r"<title>Bibbia Martini - .*? \(([^)]+)\) \d+</title>")
VERSE_RE = re.compile(
    r'<span class="versetto"><sup id="vid(\d+)" class="idvers">(.*?)</sup>(.*?)</span>',
    re.DOTALL,
)
SUP_LINK_RE = re.compile(r'<a href="#(n\d+)">')
NOTE_RE = re.compile(r'<p id="(n\d+)"><strong>([^<]*)</strong>(.*?)</p>', re.DOTALL)
BUTTON_RE = re.compile(r"<button\b.*?</button>", re.DOTALL)
BADGE_RE = re.compile(r'<a class="badge riflat')
BR_RE = re.compile(r"(?i)<br\s*/?>")
TAG_RE = re.compile(r"<[^<>]*>")
LOCATOR_RE = re.compile(r"^(\d+),(\d+)(?:-(\d+))?:$")
LEMMA_RE = re.compile(r"(?i)^<em>(.*?)</em>")
WS_RE = re.compile(r" {2,}")


def normalize_markup(html: str) -> str:
    """Fix the source's own broken opening tags before anything else reads
    them. See the module docstring's "TWO MALFORMED-MARKUP TYPOS" for why
    these two substitutions are safe and why nothing else needs one:
    verified against the whole corpus, `<em<`/`<br<` (10 + 1 occurrences) and
    the single `zem>` are the only tag-shaped corruptions anywhere in it."""
    html = re.sub(r"(?i)<(em|br)<", r"<\1>", html)
    return re.sub(r"(?<=</strong>)zem>", "<em>", html)


def clean_text(fragment: str) -> str:
    """An HTML fragment -> plain text: line breaks become spaces, remaining
    tags are dropped, entities unescaped, whitespace collapsed."""
    fragment = BR_RE.sub(" ", fragment)
    fragment = TAG_RE.sub("", fragment)
    fragment = unescape(fragment)
    fragment = fragment.replace("\n", " ").replace("\t", " ").replace("\r", " ")
    fragment = WS_RE.sub(" ", fragment)
    return fragment.strip()


def abbrev_from_title(html: str) -> str | None:
    m = TITLE_ABBR_RE.search(html)
    return m.group(1).lower() if m else None


def parse_notes(html: str, anomalies: list[str], where: str) -> dict[str, dict]:
    """`nK -> {marker, lemma, text, loc}` for every non-empty note on the
    page. A note whose body is empty after stripping its locator (8 in the
    whole corpus, e.g. Salmi 88:1) is omitted here and counted by the caller
    via the gap between this dict and the raw `<p id="nK">` count."""
    notes: dict[str, dict] = {}
    for nid, loc, body in NOTE_RE.findall(html):
        body = body.strip()
        if not body:
            continue
        lemma = None
        rest = body
        m = LEMMA_RE.match(body)
        if m:
            candidate = clean_text(m.group(1))
            if candidate:
                lemma = candidate
                rest = body[m.end() :]
        text = clean_text(rest)
        if not text:
            # The lemma was the entire note (rare) -- keep it as the note's
            # text rather than discard real content to satisfy a `lemma`
            # field nobody needs it split out of.
            text, lemma = lemma, None
        if not text:
            continue
        notes[nid] = {"marker": nid[1:], "lemma": lemma, "text": text, "loc": loc}
    return notes


def parse_chapter(
    osis: str, cn: int, html: str, anomalies: list[str]
) -> tuple[dict, int]:
    """One chapter page -> `{n, verses, summary?}`. Returns the chapter and
    the number of cross-reference links stripped from it (reported, not
    stored -- see the module docstring)."""
    html = normalize_markup(html)
    where = f"{osis} {cn}"

    h2 = H2_RE.search(html)
    summary = clean_text(h2.group(1)) if h2 else None

    notes = parse_notes(html, anomalies, where)

    verses: dict[int, dict] = {}
    anchored_ids: set[str] = set()
    xref_count = 0
    for vid, sup_content, body in VERSE_RE.findall(html):
        n = int(vid)
        note_id = None
        link = SUP_LINK_RE.search(sup_content)
        if link:
            note_id = link.group(1)
            anchored_ids.add(note_id)
        for button in BUTTON_RE.findall(body):
            xref_count += len(BADGE_RE.findall(button))
        text = clean_text(BUTTON_RE.sub("", body))
        if not text:
            anomalies.append(f"{where}:{n}: empty verse text after cleaning")
            continue
        if n in verses:
            anomalies.append(f"{where}:{n}: duplicate verse number in source")
        verse = {"n": n, "text": text}
        if note_id:
            note = notes.get(note_id)
            if note is None:
                anomalies.append(
                    f"{where}:{n}: anchor to a dropped/missing note {note_id} "
                    "(empty or unparsed in the source)"
                )
            else:
                verse["text_marked"] = f"⟦{note['marker']}⟧{text}"
                entry = {"marker": note["marker"], "text": note["text"]}
                if note["lemma"]:
                    entry["lemma"] = note["lemma"]
                verse["notes"] = [entry]
        verses[n] = verse

    # Unanchored notes (docs/corpus-schema.md: "Every token must have a note
    # entry. A note need not have a token") -- filed against the verse their
    # OWN printed locator names, no token. Dropped (with an anomaly) when
    # that verse does not exist on this page at all -- a source locator
    # defect this parser has no correct rewrite for; see module docstring.
    for nid, note in notes.items():
        if nid in anchored_ids:
            continue
        m = LOCATOR_RE.match(note["loc"])
        if not m:
            anomalies.append(
                f"{where}: note {nid} has an unparseable locator {note['loc']!r}"
            )
            continue
        loc_chapter, v1 = int(m.group(1)), int(m.group(2))
        if loc_chapter != cn:
            anomalies.append(
                f"{where}: unanchored note {nid} prints chapter {loc_chapter}, "
                "not this page's own"
            )
        target = verses.get(v1)
        if target is None:
            anomalies.append(
                f"{where}: unanchored note {nid} names verse {v1}, not present "
                "on this page -- dropped, recoverable from raw/"
            )
            continue
        entry = {"marker": note["marker"], "text": note["text"]}
        if note["lemma"]:
            entry["lemma"] = note["lemma"]
        target.setdefault("notes", []).append(entry)

    ordered = [verses[n] for n in sorted(verses)]
    chapter: dict = {"n": cn, "verses": ordered}
    if summary:
        chapter["summary"] = summary
    return chapter, xref_count


def abbrevs_for(osis: str, source_abbrev: str | None) -> list[str]:
    seen: list[str] = []
    for a in [osis, source_abbrev]:
        if a and a not in seen:
            seen.append(a)
    return seen


def run_scrape() -> tuple[list[dict], list[str], int]:
    anomalies: list[str] = []
    book_docs: list[dict] = []
    total_xrefs = 0
    for order, (osis, slug, name) in enumerate(BOOKS, start=1):
        chapter_files = sorted((raw_dir() / slug).glob("[0-9][0-9][0-9].html"))
        if not chapter_files:
            anomalies.append(f"{osis} ({slug}): no chapter files found under raw/")
            continue
        chapters: list[dict] = []
        source_abbrev: str | None = None
        for path in chapter_files:
            cn = int(path.stem)
            html = path.read_text(encoding="utf-8")
            if source_abbrev is None:
                source_abbrev = abbrev_from_title(html)
            chapter, xrefs = parse_chapter(osis, cn, html, anomalies)
            chapters.append(chapter)
            total_xrefs += xrefs
        book_docs.append(
            {
                "osis": osis,
                "name": name,
                "abbrevs": abbrevs_for(osis, source_abbrev),
                "order": order,
                "chapters": chapters,
            }
        )
    return book_docs, anomalies, total_xrefs


# --------------------------------------------------------------------------
# Validation -- assertions about THIS source; shared schema shape is
# edition_check.py's job (CLAUDE.md, "the scrapers' layout").
# --------------------------------------------------------------------------


def validate(book_docs: list[dict]) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    def fail(msg: str) -> None:
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    by_osis = {b["osis"]: b for b in book_docs}

    if len(book_docs) != 73:
        fail(f"expected 73 books, got {len(book_docs)}")
    missing = {o for o, _, _ in BOOKS} - set(by_osis)
    if missing:
        fail(f"missing books: {sorted(missing)}")

    for osis, expected_n in KNOWN_CHAPTER_COUNTS.items():
        book = by_osis.get(osis)
        if book is None:
            continue
        got_n = len(book["chapters"])
        if got_n != expected_n:
            fail(f"{osis}: expected {expected_n} chapters, got {got_n}")

    # Landmine #1: the Psalter, verified against the raw capture directly
    # (docstring "THE PSALTER DIVERGES..."). Contiguous, no gaps, no reset.
    ps = by_osis.get("ps")
    if ps:
        by_n = {c["n"]: c for c in ps["chapters"]}
        for n, expected_verses in ((9, 38), (113, 27), (118, 176)):
            ch = by_n.get(n)
            got = len(ch["verses"]) if ch else None
            if got != expected_verses:
                fail(f"ps {n}: expected {expected_verses} verses, got {got}")

    # Landmine #2: Esther and Baruch, verified against the raw capture.
    esth = by_osis.get("esth")
    if esth:
        ch16 = next((c for c in esth["chapters"] if c["n"] == 16), None)
        if ch16 is None or max((v["n"] for v in ch16["verses"]), default=0) != 24:
            fail(
                "esth 16: expected to end at verse 24, got "
                f"{max((v['n'] for v in ch16['verses']), default='MISSING') if ch16 else 'MISSING chapter'}"
            )
    bar = by_osis.get("bar")
    if bar:
        ch6 = next((c for c in bar["chapters"] if c["n"] == 6), None)
        if ch6 is None or len(ch6["verses"]) != 72:
            fail(
                "bar 6: expected 72 verses (Letter of Jeremiah), got "
                f"{len(ch6['verses']) if ch6 else 'MISSING chapter'}"
            )

    # Litmus from the module docstring.
    luke = by_osis.get("luke")
    if luke:
        ch1 = next((c for c in luke["chapters"] if c["n"] == 1), None)
        v28 = next((v for v in (ch1["verses"] if ch1 else []) if v["n"] == 28), None)
        expected = (
            "Ed entrato l'Angelo da lei, disse: Dio ti salvi, piena di "
            "grazia: il Signore è teco: Benedetta tu fra le donne."
        )
        if v28 is None or v28["text"] != expected:
            fail(f"luke 1:28 mismatch: {v28['text'] if v28 else 'MISSING'!r}")

    for b in book_docs:
        osis = b["osis"]
        for ch in b["chapters"]:
            if not ch["verses"]:
                fail(f"{osis} chapter {ch['n']}: no verses")
                continue
            prev = 0
            for v in ch["verses"]:
                if v["n"] <= prev:
                    fail(f"{osis} {ch['n']}: verse {v['n']} out of order after {prev}")
                prev = v["n"]
            opening = chapter_opening_letter(ch["verses"][0]["text"])
            if opening is not None and opening.islower():
                fail(
                    f"{osis} {ch['n']}:{ch['verses'][0]['n']}: chapter opens on "
                    f"lowercase {opening!r} -- check against raw/ before filing "
                    "a correction"
                )

    return ok, report


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def census(book_docs: list[dict]) -> dict[str, int]:
    verses = notes = summaries = lemmas = marked = 0
    for book in book_docs:
        for chap in book["chapters"]:
            summaries += 1 if chap.get("summary") else 0
            for verse in chap["verses"]:
                verses += 1
                marked += 1 if verse.get("text_marked") else 0
                for note in verse.get("notes") or []:
                    notes += 1
                    lemmas += 1 if note.get("lemma") else 0
    return {
        "books": len(book_docs),
        "chapters": sum(len(b["chapters"]) for b in book_docs),
        "verses": verses,
        "notes": notes,
        "notes_with_lemma": lemmas,
        "verses_with_apparatus": marked,
        "chapter_summaries": summaries,
    }


def print_summary(counts: dict[str, int], xref_count: int) -> None:
    print()
    for key, value in counts.items():
        print(f"  {key.replace('_', ' '):<24} {value:>7}")
    print(f"  {'cross-reference links':<24} {xref_count:>7}  (stripped, not stored)")


NOTES = (
    "Antonio Martini's Italian translation from the Vulgate, 1775-1781 -- "
    "the translation an 1826 papal brief (Leo XII) commended for private "
    "reading, and long the standard Italian Catholic Bible before the CEI. "
    "Public domain. Transcribed by scrutatio.it (bibbia/lettura/it/martini), "
    "captured 2026-08-28; only this edition's pages were fetched or parsed "
    "-- the site links a dozen other translations, several under active "
    "copyright, from every page's menu, but no other edition's text is "
    "embedded in a Martini page. "
    "MARTINI'S OWN COMMENTARY IS CAPTURED IN FULL as verse `notes`, keyed by "
    "the source's own note id (`marker`) and resolved by which verse's "
    "footnote anchor actually links to it, never by position -- a note may "
    "bracket a passage (linked from its first AND last verse, not every "
    "verse between). Each chapter's own argument line is stored as that "
    "chapter's `summary`. "
    "KNOWN, BOUNDED LOSSES: 8 notes are printed with no commentary at all "
    "and are dropped; 50 of 17,277 notes (0.3%) carry no anchor anywhere on "
    "their page and are filed against the verse their own locator names, "
    "13 of which name a verse absent from that page entirely (e.g. 2 "
    "Corinthians 6's notes '6,19'-'6,23' comment on the text of 2 "
    "Corinthians 7:1-4) -- a source locator defect with no single correct "
    "rewrite, so those 13 are dropped rather than guessed at. All of the "
    "above are recoverable verbatim from raw/martini/ (docs/link-surface.md). "
    "Cross-reference links (one or more per verse, in a popover keyed to "
    "other Martini passages) are counted but not stored: the corpus schema "
    "has no field for a cross-reference index. "
    "THE PSALTER DIVERGES FROM THE CLEMENTINE VULGATE IN BOTH DIRECTIONS: "
    "Psalm 9 has 38 verses here against 39, Psalm 113 has 27 against 26 -- "
    "stored exactly as printed, per docs/research/bible-edition-divergence.md. "
    "NOTES CITE 1-2 SAMUEL AND 1-2 KINGS BY THE FOUR-KINGDOMS SCHEME "
    "('I. Reg.'-'IV. Reg.', ~447 times) while this edition's own book "
    "titles are modern -- left verbatim; the site's reference grammar "
    "resolves it by work (CLAUDE.md, 'Reference grammar')."
)


def retrieved_at() -> str:
    return captured_at(raw_dir() / "index.html") or datetime.now(UTC).date().isoformat()


def write_output(book_docs: list[dict], generated_at: str) -> None:
    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Bibbia Martini",
        "short_title": "Martini",
        "language": "it",
        "edition": "Antonio Martini's Italian translation from the Vulgate, 1775-1781",
        "sources": [{"url": SOURCE_URL, "retrieved_at": retrieved_at()}],
        "copyright": {"status": "public-domain", "holder": None, "notice": None},
        "notes": NOTES,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
    }
    write_stamped_json(
        work_dir(),
        {
            "manifest.json": manifest,
            **{f"books/{b['osis']}.json": b for b in book_docs},
        },
        generated_at,
    )


def main() -> int:
    require_corpus()

    book_docs, anomalies, xref_count = run_scrape()
    counts = census(book_docs)
    print_summary(counts, xref_count)

    if anomalies:
        print(f"\n{len(anomalies)} parsing anomalies:")
        for a in anomalies[:60]:
            print(f"  {a}")
        if len(anomalies) > 60:
            print(f"  ... and {len(anomalies) - 60} more")

    ok, report = validate(book_docs)
    print()
    if report:
        for line in report:
            print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    if not ok:
        print("\nRefusing to write a work that failed validation.", file=sys.stderr)
        return 1

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_output(book_docs, generated_at)
    print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
