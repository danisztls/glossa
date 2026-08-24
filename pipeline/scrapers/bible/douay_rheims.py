#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""The Douay-Rheims (Challoner), with his notes, as `bible.douay-rheims.en`.

Source: https://vulgata.online, edition `DR2`, through the same undocumented
JSON API `introductions.py` already reads -- one request per chapter:

    GET /api/text/readings2/?ed=DR2&bk={abbr}&cn={n}

Where that scraper takes the `bd` record and leaves the rest, this one takes
the rest: `vs` (the verses), `fn` (Challoner's notes), `cd` (his chapter
arguments) and `ln`/`h1`/`h2` (lines and headings printed inside a chapter).
The API format, the book mapping and the cache layout are shared between
them in `vulgata_online.py`.

WHY THIS EDITION, beyond being one more English Bible. `docs/decisions.md`
(2026-08-16) named the site after the *Glossa Ordinaria* on the strength of an
apparatus that did not exist yet, and recorded the debt outright: "it names an
apparatus of commentary that does not exist yet... Until Challoner ships, the
name is a promise." It also settled, in advance, that the apparatus could not
be bolted onto the CPDV -- Challoner's notes are anchored to Douay-Rheims
wording, so attaching them to a different translation would be an editorial
act. Annotation means this edition, and only this edition.

WHAT IS INGESTED HERE AND WHAT IS NOT. Everything the source carries is
captured -- verses, notes, arguments, headings. Nothing is RENDERED by the
site yet: `PLAN.md` #3 (footnotes as sidenotes) is a stated prerequisite for
showing a gloss at all, because "a gloss must never be confusable with its
source, visually or structurally" (docs/decisions.md). Capturing now and
rendering later costs one crawl instead of two, which is the whole of
docs/link-surface.md's "re-parse, never re-crawl".

THE ORACLE THIS EDITION HAS AND THE OTHER THREE DID NOT. `bible.clementina.la`
is the Clementine Vulgate -- the text Challoner revised the Douay against, in
the arrangement he printed. So its chapter counts and verse-number sets are
not a second opinion but the expected shape, and `validate` checks every
chapter of every book against it rather than against a handful of declared
constants. Book lengths are still DISCOVERED rather than read from it (the API
answers `[]` past the end of a book), so the two are genuinely independent and
a disagreement means something.

Usage:
    uv run pipeline/scrapers/bible/douay_rheims.py            # full 73-book run
    uv run pipeline/scrapers/bible/douay_rheims.py --sample   # Philemon + John 1-3
    uv run pipeline/scrapers/bible/douay_rheims.py --offline  # cache-only
    uv run pipeline/scrapers/bible/douay_rheims.py --refresh  # bypass the cache

Caches every raw API response under corpus/raw/vulgata-online/ and is fully
offline-capable from that cache on re-runs. Ends with a validation pass that
prints a summary table and exits non-zero on failure.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line is
# above the imports rather than the imports being at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    CorrectionDriftError,
    Fetcher,
    FetchPolicy,
    apply_verse_corrections,
    chapter_opening_letter,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    works_root,
    write_stamped_json,
)

# The API format itself lives in vulgata_online.py, shared with
# introductions.py. See that module's docblock for the record taxonomy, and
# in particular for why `ln` is not merely a decorative title.
from vulgata_online import (
    ANCHOR_RE,
    BASE_URL,
    BOOK_MAP,
    cache_name,
    chapter_url,
    of_type,
    records,
    strip_brackets,
    strip_emphasis,
)

SOURCE_EDITION = "DR2"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
# vulgata.online's robots.txt is `Disallow:` with no Crawl-delay, so this
# floor is ours rather than theirs. Unlike the 73 requests introductions.py
# makes, this is a chapter at a time -- 1,334 of them, about 22 minutes.
RATE_LIMIT_SECONDS = 1.0

RAW_SUBDIR = "vulgata-online"
WORK_ID = "bible.douay-rheims.en"

#: The edition whose shape this one is checked against; see the docblock.
ORACLE_WORK_ID = "bible.clementina.la"

#: A footnote's inline token in `text_marked`, the same `⟦marker⟧` vocabulary
#: docs/corpus-schema.md already defines for the CCC, the Compendium and the
#: prayers. Deliberately NOT the source's own `{rn:...}` form: that one is a
#: RANGE (it wraps the glossed words) and this one is a POINT, placed where a
#: printed edition puts the marker -- immediately after the words it refers
#: to. Nothing is lost by the conversion, because the note keeps the glossed
#: words verbatim in its `lemma`, so a renderer that wants to underline the
#: span walks back from the token by exactly that string.
TOKEN = "⟦{}⟧"

#: `_The judgment:_` -- the lemma every note opens with, set in italics by the
#: source. The trailing colon is the apparatus's separator between the words
#: glossed and the gloss, not part of either, so it is dropped.
LEMMA_RE = re.compile(r"^_([^_]*)_\s*")

#: Signatures of a bad decode. The API answers JSON, which `json.loads`
#: decodes as UTF-8 by contract, so unlike the cp1252 pages at sacredbible.org
#: this should be unreachable -- which is the reason to assert it rather than
#: assume it.
MOJIBAKE_MARKERS = ["\N{REPLACEMENT CHARACTER}", "Ã©", "â€™", "â€œ"]

SAMPLE_BOOKS = {"phlm", "john"}
SAMPLE_JOHN_CHAPTERS = {1, 2, 3}

#: Books whose chapter 1 the sample keeps whole; see `--sample`.
KNOWN_CHAPTER_COUNTS = {"gen": 50, "ps": 150, "esth": 16, "matt": 28, "john": 21}


@dataclass
class Anomaly:
    """Something the source did that the run should report.

    `fatal` marks the ones that must stop the run rather than be noted in
    passing. The distinction earned itself: an un-adjudicated duplicate
    segment used to be reported and the text DROPPED, which is a silent
    corpus-wide data loss wearing the costume of a warning."""

    osis: str
    chapter: int
    detail: str
    fatal: bool = False


def raw_dir() -> Path:
    """This scraper's fetch cache. A function, not a constant -- see cpdv.py."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return works_root() / WORK_ID


# --------------------------------------------------------------------------
# Parsing one chapter
# --------------------------------------------------------------------------


def collapse(text: str) -> str:
    """Line breaks and runs of whitespace to single spaces, ends trimmed."""
    return re.sub(r"\s+", " ", text.replace("\r\n", "\n").replace("\r", "\n")).strip()


def split_note(raw: str) -> tuple[str | None, str]:
    """One `fn` string -> `(lemma, gloss)`, the lemma being `None` when absent.

    THE LEADING ITALIC IS STRUCTURE, NOT DECORATION, and this is the one place
    the corpus's standing "inline emphasis is a v1 loss" rule would destroy
    meaning rather than merely flatten it. Challoner's apparatus opens each
    note by quoting the words it glosses; the source sets exactly those words
    in italics and nothing else does. Dropping the markers would leave
    `The judgment: That is, the cause of his condemnation.` -- a sentence in
    which the reader has to guess where the quotation stops. Promoting them to
    a field keeps the boundary without inventing a markup the schema would
    then have to define. Emphasis ANYWHERE ELSE in a note is still dropped,
    unchanged v1 loss, recoverable from raw/.
    """
    match = LEMMA_RE.match(raw)
    if not match:
        return None, collapse(strip_brackets(strip_emphasis(raw)))
    lemma = collapse(match.group(1)).rstrip(":").strip()
    gloss = collapse(strip_brackets(strip_emphasis(raw[match.end() :])))
    return (lemma or None), gloss


def render(raw: str, known_markers: set[str]) -> tuple[str, str | None, set[str]]:
    """One `cnt` string -> `(text, text_marked, markers used)`.

    `text_marked` is `None` when the string carries no anchor at all, which is
    the overwhelming majority of verses -- the schema's "omitted when absent"
    rule, so that a stored `text_marked` always marks a verse that really has
    apparatus on it.

    An anchor naming a note this chapter does not carry keeps its words and
    loses its token: the alternative is emitting a token with no entry, which
    is the one thing `validate` refuses. The caller reports it.
    """
    used: set[str] = set()

    def to_plain(match: re.Match) -> str:
        return match.group(2)

    def to_marked(match: re.Match) -> str:
        marker, words = match.group(1), match.group(2)
        if marker not in known_markers:
            return words
        used.add(marker)
        return words + TOKEN.format(marker)

    text = collapse(ANCHOR_RE.sub(to_plain, raw))
    marked = collapse(ANCHOR_RE.sub(to_marked, raw))
    return text, (marked if used else None), used


def apply_segment_corrections(
    chapter: list[dict], corrections: list[dict], osis: str, cn: int
) -> list[dict]:
    """Re-file mis-numbered source segments, in place, before parsing.

    THE ONLY CORRECTION LAYER THAT RUNS ON THE FETCHED RECORDS RATHER THAN ON
    PARSED OUTPUT, and that is what makes it a correction rather than an
    override (`pipeline/overrides/README.md`): the claim is that the SOURCE
    assigned a segment the wrong verse number, not that our derivation slipped.
    Editing the record before parsing is the JSON equivalent of the HTML
    corrections the vatican.va scrapers apply to a fetched page.

    The locator is the source's own `_id`, an opaque identifier it already
    mints per record -- the only stable handle a segment has, since the very
    thing being corrected is its number. `from`/`to` are objects rather than
    strings because what changes is a set of fields (`vn`, sometimes `tp`,
    plus the `seq` that orders a join); `anchor` carries a distinctive piece
    of the segment's text so the drift guard still fails loudly if the source
    silently rewrites the words under a stable id.
    """
    applied: list[dict] = []
    by_id = {r.get("_id"): r for r in chapter}
    for c in corrections:
        if c.get("resolution"):
            continue
        loc = c["locator"]
        if loc["osis"] != osis or loc["chapter"] != cn:
            continue
        record = by_id.get(loc["record"])
        if record is None:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: no record {loc['record']!r} in {osis} {cn} "
                "(source drift -- re-verify against corpus/raw/)"
            )
        anchor = c.get("anchor")
        if anchor and anchor not in (record.get("cnt") or ""):
            raise CorrectionDriftError(
                f"correction {c['id']!r}: record {loc['record']!r} no longer contains "
                f"{anchor!r} (the source rewrote the segment under a stable id)"
            )
        for key, expected in c["from"].items():
            if record.get(key) != expected:
                raise CorrectionDriftError(
                    f"correction {c['id']!r}: expected {key}={expected!r} on record "
                    f"{loc['record']!r}, found {record.get(key)!r}"
                )
        record.update(c["to"])
        applied.append(dict(c))
    return applied


def grouped(
    chapter: list[dict],
    types: tuple[str, ...],
    osis: str,
    cn: int,
    anomalies: list[Anomaly],
) -> list[tuple[int, str]]:
    """`(vn, joined text)` per unit, joining segments the source split.

    THE SOURCE FILES TWO SEGMENTS UNDER ONE NUMBER SEVEN TIMES, and every one
    of them is a segment whose `vn` is simply wrong -- the text belongs to a
    neighbouring verse (Josue 5:5, 3 Kings 17:19, Proverbs 30:29, Wisdom 6:5),
    to the tail of the verse before it (Proverbs 12:11), or to the prologue
    Challoner prints ahead of the chapter (Lamentations 1, twice). All seven
    are verified against `bible.clementina.la`'s verse-number sets and against
    drbo.org's independent transcription of the same edition.

    So a duplicate is never resolved by guessing. Either a segment correction
    has already told this record where it belongs -- in which case `seq`
    orders the pieces and they are joined -- or the run FAILS naming the
    chapter. The previous behaviour, reporting the collision and keeping the
    first segment, discarded real verse text while printing a line that read
    like a warning about formatting.
    """
    buckets: dict[int, list[dict]] = {}
    for record in chapter:
        if record.get("tp") not in types:
            continue
        buckets.setdefault(record.get("vn") or 0, []).append(record)

    out: list[tuple[int, str]] = []
    for vn in sorted(buckets):
        segments = buckets[vn]
        order = [r.get("seq") or 0 for r in segments]
        if len(segments) > 1 and len(set(order)) != len(order):
            anomalies.append(
                Anomaly(
                    osis,
                    cn,
                    f"{len(segments)} {'/'.join(types)} segments filed under {vn} "
                    "with no order between them -- one of them belongs elsewhere; "
                    "file a segment correction in pipeline/corrections/ rather than "
                    "letting the run choose",
                    True,
                )
            )
            continue
        segments.sort(key=lambda r: (r.get("seq") or 0, r.get("rn") or 0))
        out.append((vn, " ".join((r.get("cnt") or "").strip() for r in segments)))
    return out


def parse_chapter(
    osis: str, cn: int, chapter: list[dict]
) -> tuple[dict, list[Anomaly]]:
    """One chapter's records -> the schema's chapter object, plus anomalies.

    A MARKER IS SCOPED TO ITS VERSE, NOT TO THE CHAPTER, and reading it the
    other way is the trap this parser was written wrong for once. The source's
    `rn` restarts at 1 on every verse that carries a note: John 3 has four
    notes and all four are `rn: 1`, on verses 5, 18, 19 and 21. Keying them by
    `rn` alone silently keeps the first and drops the other three, with nothing
    about the output looking damaged. The pair `(vn, rn)` is the identity; `rn`
    alone is the marker, which is exactly what the schema wants, since
    docs/corpus-schema.md scopes a marker's uniqueness to the unit it is
    printed in.

    A note is filed against the unit whose text actually turned out to hold its
    token -- a heading's, when the anchor is in a heading (Lamentations 1, where
    Jeremias's prologue arrives as an `ln` and carries one) -- and against the
    verse of its own number when nothing anchors it.
    """
    anomalies: list[Anomaly] = []

    #: `vn -> {marker: entry}`. See the docblock for why the outer key exists.
    notes: dict[int, dict[str, dict]] = {}
    for record in of_type(chapter, "fn"):
        vn = record.get("vn")
        marker = str(record.get("rn") or "")
        raw = record.get("cnt") or ""
        if not isinstance(vn, int) or not marker or not raw.strip():
            anomalies.append(
                Anomaly(osis, cn, f"unusable fn record {record.get('_id')}")
            )
            continue
        if marker in notes.get(vn, {}):
            anomalies.append(
                Anomaly(
                    osis,
                    cn,
                    f"verse {vn} has two notes numbered {marker!r}; the second is dropped",
                )
            )
            continue
        lemma, gloss = split_note(raw)
        entry: dict = {"marker": marker}
        if lemma:
            entry["lemma"] = lemma
        entry["text"] = gloss
        notes.setdefault(vn, {})[marker] = entry

    claimed: set[tuple[int, str]] = set()

    def build(vn: int, raw: str) -> tuple[str, str | None, list[dict]]:
        """Render one unit's text, claiming the notes it anchors.

        Only markers not already claimed are offered, so that a heading and a
        verse sharing a `vn` -- which is how the source files a line printed
        before verse 1 -- cannot both take the same note."""
        available = {m for m in notes.get(vn, {}) if (vn, m) not in claimed}
        text, marked, used = render(raw, available)
        claimed.update((vn, m) for m in used)
        mine = [notes[vn][m] for m in sorted(used, key=int)]
        return text, marked, mine

    headings: list[dict] = []
    for group in grouped(chapter, ("ln", "h1", "h2"), osis, cn, anomalies):
        vn, raw = group
        if not raw.strip():
            continue
        record = {"vn": vn}
        vn = record.get("vn") if isinstance(record.get("vn"), int) else 1
        text, marked, mine = build(vn, raw)
        entry = {"before_verse": vn, "text": text}
        if marked:
            entry["text_marked"] = marked
        if mine:
            entry["notes"] = mine
        headings.append(entry)
    headings.sort(key=lambda h: h["before_verse"])

    verses: list[dict] = []
    for n, raw in grouped(chapter, ("vs",), osis, cn, anomalies):
        if not isinstance(n, int) or n < 1:
            anomalies.append(
                Anomaly(osis, cn, f"verse with unusable number {n!r}", True)
            )
            continue
        text, marked, mine = build(n, raw)
        if not text:
            # docs/corpus-schema.md: "A verse present with empty text is
            # invalid -- omit it instead."
            anomalies.append(Anomaly(osis, cn, f"verse {n} has empty text; omitted"))
            continue
        verse: dict = {"n": n, "text": text}
        if marked:
            verse["text_marked"] = marked
        if mine:
            verse["notes"] = mine
        verses.append(verse)

    # Notes the source carries but never anchors. A property of THIS
    # transcription and not of Challoner: 9 of the 148 notes in the 73 chapters
    # cached before this scraper existed have no `{n:...}` in the verse they
    # name, and drbo.org -- an independent transcription of the same apparatus
    # -- marks the lemma in the verse for at least one of them (Jonas 1:2).
    # They are filed against that verse and will render as a note on it, which
    # is what a printed edition does anyway; losing them to keep a 1:1 token
    # invariant would be discarding Challoner to satisfy a schema.
    by_n = {v["n"]: v for v in verses}
    heading_by_vn = {h["before_verse"]: h for h in headings}
    for vn in sorted(notes):
        for marker in sorted(notes[vn], key=int):
            if (vn, marker) in claimed:
                continue
            host = by_n.get(vn) or heading_by_vn.get(vn)
            if host is None:
                anomalies.append(
                    Anomaly(
                        osis, cn, f"note {marker} names verse {vn}, which is absent"
                    )
                )
                continue
            anomalies.append(
                Anomaly(
                    osis, cn, f"note {marker} on verse {vn} has no anchor in the text"
                )
            )
            host.setdefault("notes", []).append(notes[vn][marker])
            host["notes"].sort(key=lambda note: int(note["marker"]))

    out: dict = {"n": cn}
    arguments = of_type(chapter, "cd")
    if arguments:
        summary = collapse(
            strip_brackets(strip_emphasis(arguments[0].get("cnt") or ""))
        )
        if summary:
            out["summary"] = summary
        if len(arguments) > 1:
            anomalies.append(
                Anomaly(
                    osis, cn, f"{len(arguments)} chapter arguments; the first is kept"
                )
            )
    if headings:
        out["headings"] = headings
    out["verses"] = verses
    return out, anomalies


# --------------------------------------------------------------------------
# Crawling
# --------------------------------------------------------------------------


def oracle_books() -> dict[str, dict[int, list[int]]]:
    """`osis -> {chapter number: verse numbers}` from `bible.clementina.la`.

    Empty when that edition is not in the corpus, which `validate` reports as
    a skipped check rather than a pass -- an oracle that quietly is not there
    is worse than no oracle, since the run still says PASS.
    """
    books_dir = works_root() / ORACLE_WORK_ID / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, dict[int, list[int]]] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = {
            chap["n"]: [v["n"] for v in chap["verses"]]
            for chap in book.get("chapters") or []
        }
    return out


def run_scrape(
    *, sample: bool, offline: bool, refresh: bool, segment_corrections: list[dict]
) -> tuple[list[dict], list[Anomaly], list[dict]]:
    """Fetch every book, discovering each one's length as it goes.

    A book ends where the API answers `[]`, which it does with HTTP 200 for
    any chapter past the last. So each book costs one request more than it has
    chapters, and that request is the proof there is nothing beyond -- cheaper
    and stronger than trusting a hand-copied table of chapter counts, which is
    a thing that can be wrong in exactly the direction nobody notices.
    """
    fetcher = Fetcher(
        cache_dir=raw_dir(),
        policy=FetchPolicy(
            user_agent=USER_AGENT,
            delay=RATE_LIMIT_SECONDS,
            attempts=3,
            backoff=(2.0, 5.0),
        ),
        offline=offline,
        refresh=refresh,
    )

    anomalies: list[Anomaly] = []
    seg_applied: list[dict] = []
    book_docs: list[dict] = []
    for order, (abbr, (osis, name)) in enumerate(BOOK_MAP.items(), start=1):
        if sample and osis not in SAMPLE_BOOKS:
            continue
        chapters: list[dict] = []
        cn = 1
        while True:
            if sample and osis == "john" and cn not in SAMPLE_JOHN_CHAPTERS:
                break
            payload = fetcher.fetch_bytes(
                chapter_url(SOURCE_EDITION, abbr, cn),
                cache_name(SOURCE_EDITION, abbr, cn),
            )
            chapter = records(payload, where=f"{abbr} {cn} ({name})")
            if not chapter:
                break
            # Before anything reads the records: see this function's docblock.
            seg_applied += apply_segment_corrections(
                chapter, segment_corrections, osis, cn
            )
            parsed, found = parse_chapter(osis, cn, chapter)
            anomalies.extend(found)
            chapters.append(parsed)
            cn += 1

        book_docs.append(
            {
                "osis": osis,
                "name": name,
                "abbrevs": abbrevs_for(osis, name),
                "order": order,
                "chapters": chapters,
            }
        )
        notes = sum(len(v.get("notes") or []) for c in chapters for v in c["verses"])
        print(
            f"  {abbr:<5} {osis:<7} {name:<24} {len(chapters):>3} ch  "
            f"{sum(len(c['verses']) for c in chapters):>5} vv  {notes:>4} notes"
        )

    # Canonical order, per docs/corpus-schema.md. BOOK_MAP is in the SOURCE's
    # order (Machabees after Malachias); ours puts them after Esther, so
    # `order` is re-derived here rather than taken from the loop above.
    canonical = canonical_order()
    for book in book_docs:
        book["order"] = canonical.get(book["osis"], book["order"])
    book_docs.sort(key=lambda b: b["order"])
    return book_docs, anomalies, seg_applied


def canonical_order() -> dict[str, int]:
    """`osis -> order`, borrowed from an edition already in the corpus.

    Not restated here for the reason introductions.py gives: the 73-book order
    is settled in docs/corpus-schema.md and recorded per book file, and a
    second copy is one more thing that can drift."""
    books_dir = works_root() / ORACLE_WORK_ID / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, int] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = book["order"]
    return out


#: Curated jump-box abbreviations. DOUAY NOMENCLATURE, which is the point of
#: having them: `apoc` for the Apocalypse and `eccli` for Ecclesiasticus are
#: how the older encyclicals in this corpus actually cite, and they are how a
#: reader of this edition will type. The four Kings are deliberately absent --
#: `1kgs` here would mean 1 Samuel while the same string in the CPDV means
#: 1 Kings, and `book-token.ts` resolves an ambiguous token by the reader's
#: own edition, so adding them would make the answer depend on which Bible
#: happened to be open. Left to the OSIS code, which is unambiguous.
_CURATED_ABBREVS: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lv"],
    "num": ["nm"],
    "deut": ["dt"],
    "josh": ["jos", "josue"],
    "judg": ["jdg"],
    "1chr": ["1par", "1paral"],
    "2chr": ["2par", "2paral"],
    "ezra": ["1esd", "esdras"],
    "neh": ["2esd", "nehemias"],
    "tob": ["tb", "tobias"],
    "jdt": ["judith"],
    "ps": ["psa", "psalm", "psalms"],
    "prov": ["pr", "prv"],
    "eccl": ["ecc", "eccles"],
    "song": ["cant", "canticles", "canticleofcanticles"],
    "wis": ["wisd"],
    "sir": ["eccli", "ecclus", "ecclesiasticus"],
    "isa": ["is", "isaias"],
    "jer": ["jr", "jeremias"],
    "ezek": ["ez", "ezechiel"],
    "dan": ["dn"],
    "hos": ["os", "osee"],
    "obad": ["abd", "abdias"],
    "jonah": ["jon", "jonas"],
    "mic": ["mich", "micheas"],
    "hab": ["habacuc"],
    "zeph": ["soph", "sophonias"],
    "hag": ["agg", "aggeus"],
    "zech": ["zach", "zacharias"],
    "mal": ["malachias"],
    "1macc": ["1mac", "1mach", "1machabees"],
    "2macc": ["2mac", "2mach", "2machabees"],
    "matt": ["mt"],
    "mark": ["mk"],
    "luke": ["lk"],
    "john": ["jn", "joh"],
    "acts": ["ac"],
    "rom": ["ro"],
    "1cor": ["1co"],
    "2cor": ["2co"],
    "gal": ["ga"],
    "eph": ["ep"],
    "phil": ["php"],
    "col": ["co"],
    "phlm": ["phm"],
    "heb": ["he"],
    "jas": ["jm"],
    "1pet": ["1pt"],
    "2pet": ["2pt"],
    "1john": ["1jn"],
    "2john": ["2jn"],
    "3john": ["3jn"],
    "jude": ["jud"],
    "rev": ["apoc", "apocalypse", "ap"],
}


def abbrevs_for(osis: str, name: str) -> list[str]:
    """`[osis, the name run together, curated forms]`, deduplicated.

    The parenthesised gloss in the four Kings' display names is dropped before
    the name is folded, so `1 Kings (1 Samuel)` contributes `1kings` and not
    `1kings(1samuel)`."""
    bare = re.sub(r"\s*\([^)]*\)", "", name)
    base = [osis, bare.lower().replace(" ", "")]
    seen: list[str] = []
    for candidate in base + _CURATED_ABBREVS.get(osis, []):
        if candidate not in seen:
            seen.append(candidate)
    return seen


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def fold_for_match(text: str) -> str:
    """Case and punctuation folded away, for comparing a lemma to its verse.

    A lemma is the same WORDS as the verse, not the same characters: the
    apparatus routinely re-points the quotation it opens with, and the source
    sometimes carries a Latin gloss into it (`Of slime. Bituminis`). Comparing
    raw strings reported 103 of 1,910 lemmas as absent, nearly all of them
    punctuation. Folding leaves the check aimed at what it was built for --
    a lemma whose WORDS are not in the verse, which is what `Nineve` for
    `Ninive` is."""
    return re.sub(r"[^a-z0-9 ]+", "", text.lower()).strip()


def strip_tokens(text: str) -> str:
    return re.sub(r"⟦[^⟧]*⟧", "", text)


def unit_faults(unit: dict) -> list[str]:
    """Schema-level defects in one verse or heading, as phrases for a report."""
    faults: list[str] = []
    text = unit["text"]
    if "{" in text or "}" in text:
        faults.append("leftover anchor braces in text")
    if "_" in text:
        faults.append("leftover emphasis marker in text")
    if "⟦" in text or "⟧" in text:
        faults.append("citation token in `text` (belongs only in `text_marked`)")
    if "  " in text or text != text.strip():
        faults.append("un-normalized whitespace in text")
    for marker in MOJIBAKE_MARKERS:
        if marker in text:
            faults.append(f"mojibake marker {marker!r} in text")

    notes = unit.get("notes") or []
    markers = [note["marker"] for note in notes]
    if len(markers) != len(set(markers)):
        faults.append("duplicate note markers")
    for note in notes:
        if not note.get("text"):
            faults.append(f"note {note['marker']} has no text")

    marked = unit.get("text_marked")
    if marked is None:
        if "⟦" in text:
            faults.append("token present without `text_marked`")
        return faults

    if strip_tokens(marked) != text:
        faults.append("`text` is not `text_marked` with its tokens stripped")
    tokens = re.findall(r"⟦([^⟧]*)⟧", marked)
    if len(tokens) != len(set(tokens)):
        faults.append("a marker is tokenized twice")
    orphans = [t for t in tokens if t not in markers]
    if orphans:
        faults.append(f"token(s) with no note entry: {orphans}")
    return faults


def validate(book_docs: list[dict], sample: bool) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    def fail(msg: str):
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    if not sample:
        if len(book_docs) != 73:
            fail(f"expected 73 books, got {len(book_docs)}")
        missing = {osis for osis, _ in BOOK_MAP.values()} - {
            b["osis"] for b in book_docs
        }
        if missing:
            fail(f"missing books: {sorted(missing)}")

    truncated = {"john"} if sample else set()
    for book in book_docs:
        osis = book["osis"]
        if osis in KNOWN_CHAPTER_COUNTS and osis not in truncated:
            expected = KNOWN_CHAPTER_COUNTS[osis]
            if len(book["chapters"]) != expected:
                fail(
                    f"{osis}: expected {expected} chapters, got {len(book['chapters'])}"
                )
        for chap in book["chapters"]:
            if not chap["verses"]:
                fail(f"{osis} {chap['n']}: no verses")
            else:
                # A chapter's first verse begins a sentence. The same check
                # found five lost capitals in the Portuguese source; it is
                # cheap, and its value is catching the sixth.
                opening = chapter_opening_letter(chap["verses"][0]["text"])
                if opening is not None and opening.islower():
                    fail(
                        f"{osis} {chap['n']}:{chap['verses'][0]['n']}: chapter opens on "
                        f"lowercase {opening!r} -- likely a lost capital in the source; "
                        "adjudicate into pipeline/corrections/ rather than editing text"
                    )
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                where = unit.get("n") or f"before v{unit.get('before_verse')}"
                for fault in unit_faults(unit):
                    fail(f"{osis} {chap['n']}:{where}: {fault}")

    # The lemma oracle, and the cheapest check an annotated edition affords.
    # A lemma is a QUOTATION: the source printed those words twice, once in the
    # verse and once at the head of the note that glosses them. So a lemma
    # absent from its own unit's text means one of the two is mistranscribed,
    # and neither spellcheck nor the token check can see it -- the token check
    # because an unanchored note has no token to disagree with, spellcheck
    # because the words are usually plausible either way. It found `Nineve`
    # for `Ninive` at Jonas 1:2, which is now filed in pipeline/corrections/.
    #
    # Reported, never fatal: a source may normalize a lemma's capitalization
    # (`_Satan also, etc.:_` for `Satan also`) or elide it, and calling that a
    # defect would train whoever reads this report to ignore it.
    stray_lemmas: list[str] = []
    lemma_total = 0
    for book in book_docs:
        for chap in book["chapters"]:
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                where = unit.get("n") or f"before v{unit.get('before_verse')}"
                for note in unit.get("notes") or []:
                    lemma = note.get("lemma")
                    if not lemma:
                        continue
                    # `_Thou shalt not take, etc.:_` -- the apparatus's own
                    # elision marker. The quotation is deliberately partial, so
                    # its absence says nothing about either transcription.
                    if re.search(r"\bete?c\.?$", lemma.strip()):
                        continue
                    lemma_total += 1
                    if fold_for_match(lemma) not in fold_for_match(unit["text"]):
                        stray_lemmas.append(
                            f"{book['osis']} {chap['n']}:{where} ({lemma!r})"
                        )

    if stray_lemmas:
        shown = ", ".join(stray_lemmas[:10])
        more = f" (+{len(stray_lemmas) - 10} more)" if len(stray_lemmas) > 10 else ""
        report.append(
            f"NOTE: {len(stray_lemmas)}/{lemma_total} note lemmas quote words their own "
            f"verse does not contain -- candidates for adjudication, not all defects: a "
            f"lemma may carry the Latin it renders ('Of slime. Bituminis') or re-point "
            f"the quotation. Read before believing: {shown}{more}"
        )
    elif lemma_total:
        report.append(
            f"OK: all {lemma_total} note lemmas appear in the text they gloss"
        )

    # The Clementine oracle. See this module's docblock for why a disagreement
    # here is evidence rather than a second opinion.
    oracle = oracle_books()
    if not oracle:
        report.append(f"SKIP: {ORACLE_WORK_ID} not in the corpus; shape oracle not run")
        return ok, report

    chapter_diffs: list[str] = []
    verse_diffs: list[str] = []
    checked = 0
    for book in book_docs:
        theirs = oracle.get(book["osis"])
        if theirs is None:
            fail(f"{book['osis']}: not present in {ORACLE_WORK_ID}")
            continue
        if not sample and len(book["chapters"]) != len(theirs):
            chapter_diffs.append(
                f"{book['osis']} (DR {len(book['chapters'])}, LA {len(theirs)})"
            )
        for chap in book["chapters"]:
            expected = theirs.get(chap["n"])
            if expected is None:
                verse_diffs.append(f"{book['osis']} {chap['n']} (absent in LA)")
                continue
            checked += 1
            if [v["n"] for v in chap["verses"]] != expected:
                verse_diffs.append(f"{book['osis']} {chap['n']}")

    if chapter_diffs:
        fail(
            f"{len(chapter_diffs)} book(s) disagree with {ORACLE_WORK_ID} on chapter "
            f"count -- suspect a mis-mapped book or a short crawl: {', '.join(chapter_diffs)}"
        )
    else:
        report.append(
            f"OK: chapter counts match {ORACLE_WORK_ID} for all {len(book_docs)} books"
        )

    if verse_diffs:
        # Reported, never fatal: two editions of one tradition may still
        # divide a verse differently, and docs/research/bible-edition-
        # divergence.md is explicit that calling that a defect invites
        # someone to "fix" a faithful text.
        shown = ", ".join(verse_diffs[:12])
        more = f" (+{len(verse_diffs) - 12} more)" if len(verse_diffs) > 12 else ""
        report.append(
            f"NOTE: {len(verse_diffs)}/{checked} chapters differ from {ORACLE_WORK_ID} in "
            f"their verse-number set -- edition divergence, to be read before it is "
            f"believed: {shown}{more}"
        )
    else:
        report.append(
            f"OK: verse-number sets match {ORACLE_WORK_ID} in all {checked} chapters"
        )

    return ok, report


# --------------------------------------------------------------------------
# Corrections
#
# The shared layer edits `verse["text"]` and knows the `{osis, chapter, verse}`
# locator docs/corpus-schema.md defines. This edition needs two things it does
# not do, and both stay here, where cpdv.py's comment already says the APPLYING
# of a correction belongs -- "what a correction means is per-source".
#
#   - A corrected verse must have `text_marked` corrected with it, or the two
#     stop agreeing and `unit_faults` fails the run. That is the intended
#     safety net, not a nuisance: a `from` string that straddles a token cannot
#     be applied to both and should stop the build.
#   - A defect can be in a NOTE, which has no locator at all. Challoner's
#     apparatus is a second body of text, and the transcription of it has its
#     own typos (`comdemnation` at John 3:19). A locator naming a note is
#     scoped by adding `"note": "1"`; those entries are held back from the
#     shared function, which would read them as drift.
# --------------------------------------------------------------------------


def apply_note_corrections(
    book_docs: list[dict], corrections: list[dict], full_run: bool
):
    """Apply the `note`-scoped corrections. Same three outcomes as the verse
    layer: out of scope, drift, or applied."""
    index: dict[tuple, dict] = {}
    scope: set[tuple[str, int]] = set()
    for book in book_docs:
        for chap in book["chapters"]:
            scope.add((book["osis"], chap["n"]))
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                for note in unit.get("notes") or []:
                    index[(book["osis"], chap["n"], unit.get("n"), note["marker"])] = (
                        note
                    )

    applied: list[dict] = []
    for c in corrections:
        if c.get("resolution"):
            continue
        loc = c["locator"]
        if (loc["osis"], loc["chapter"]) not in scope:
            continue
        note = index.get(
            (loc["osis"], loc["chapter"], loc.get("verse"), str(loc["note"]))
        )
        field = c.get("field", "text")
        if note is None or c["from"] not in (note.get(field) or ""):
            raise CorrectionDriftError(
                f"correction {c['id']!r}: expected {field} {c['from']!r} not found on note "
                f"{loc['note']} at {loc['osis']} {loc['chapter']}:{loc.get('verse')} "
                "(source drift -- re-verify against corpus/raw/ and update or remove it)"
            )
        note[field] = note[field].replace(c["from"], c["to"], 1)
        applied.append(dict(c))

    if full_run:
        missing = [
            c["id"]
            for c in corrections
            if not c.get("resolution") and c["id"] not in {a["id"] for a in applied}
        ]
        if missing:
            raise CorrectionDriftError(
                f"note corrections never matched during full run: {missing}"
            )
    return applied


def mirror_into_marked(book_docs: list[dict], applied: list[dict]) -> None:
    """Re-apply each verse correction to that verse's `text_marked`.

    A verse with no apparatus has no `text_marked` and needs nothing. When it
    has one and the replacement does not land -- because the `from` string
    straddles a `⟦n⟧` token -- this leaves the two disagreeing on purpose, and
    `unit_faults` turns that into a failed run naming the verse. Silently
    re-deriving `text_marked` from the corrected `text` would be the wrong
    repair: it would drop the apparatus to save the sentence."""
    index = {
        (book["osis"], chap["n"], verse["n"]): verse
        for book in book_docs
        for chap in book["chapters"]
        for verse in chap["verses"]
    }
    for c in applied:
        loc = c["locator"]
        verse = index.get((loc["osis"], loc["chapter"], loc["verse"]))
        if verse is None or "text_marked" not in verse:
            continue
        verse["text_marked"] = verse["text_marked"].replace(c["from"], c["to"], 1)


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def census(book_docs: list[dict]) -> dict[str, int]:
    verses = notes = summaries = headings = lemmas = marked = 0
    for book in book_docs:
        for chap in book["chapters"]:
            summaries += 1 if chap.get("summary") else 0
            headings += len(chap.get("headings") or [])
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                for note in unit.get("notes") or []:
                    notes += 1
                    lemmas += 1 if note.get("lemma") else 0
            for verse in chap["verses"]:
                verses += 1
                marked += 1 if verse.get("text_marked") else 0
    return {
        "books": len(book_docs),
        "chapters": sum(len(b["chapters"]) for b in book_docs),
        "verses": verses,
        "notes": notes,
        "notes_with_lemma": lemmas,
        "verses_with_apparatus": marked,
        "chapter_summaries": summaries,
        "headings": headings,
    }


def print_summary(counts: dict[str, int]) -> None:
    print()
    for key, value in counts.items():
        print(f"  {key.replace('_', ' '):<22} {value:>7}")


def write_output(
    book_docs: list[dict],
    *,
    sample: bool,
    counts: dict[str, int],
    receipt: dict,
    generated_at: str,
) -> None:
    today = datetime.now(UTC).date().isoformat()

    notes = (
        "Bishop Richard Challoner's revision (1749-52) of the Douay-Rheims, "
        "transcribed by vulgata.online as edition code DR2 and taken from its "
        "JSON API. Public domain in text and apparatus alike. Ingested with "
        f"Challoner's own notes ({counts['notes']}), his chapter arguments "
        f"({counts['chapter_summaries']}) and the lines and headings the source "
        f"prints inside a chapter ({counts['headings']}); his book prefaces are "
        "a separate work, bible-intro.en, because a preface describes the book "
        "rather than the translation. A note quotes the words it glosses before "
        "glossing them, and the source sets exactly those words in italics: they "
        "are kept as the note's `lemma`, and the point in the verse where they "
        "end carries the same U+27E6/U+27E7 token the CCC uses. Emphasis "
        "elsewhere is dropped, the v1 loss docs/corpus-schema.md records; "
        "corpus/raw/ holds every response verbatim. Not every note is anchored "
        f"({counts['notes'] - counts['verses_with_apparatus']} is an upper bound "
        "on the unanchored, since a verse may carry several) -- where the source "
        "prints no anchor the note is filed against its own verse. Challoner's "
        "notes are a dated apparatus of eighteenth-century controversy, not "
        "neutral commentary; see docs/decisions.md, 2026-08-16."
    )
    if sample:
        notes = (
            "SAMPLE RUN for review only -- Philemon (complete) and John "
            "(chapters 1-3 only). Not the full 73-book corpus. " + notes
        )

    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Douay-Rheims Bible",
        "short_title": "Douay-Rheims",
        "language": "en",
        "edition": "Challoner revision, 1749-52",
        "sources": [{"url": BASE_URL + "/bible/Gn.1?ed=DR2", "retrieved_at": today}],
        "copyright": {"status": "public-domain", "holder": None, "notice": None},
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
        "corrections_applied": receipt["count"],
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
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Only scrape Philemon (complete) and John (chapters 1-3) for review.",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Never touch the network; fail if a required response isn't cached.",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Bypass the cache and re-fetch every response from the network.",
    )
    args = parser.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    # CORRECTIONS RUN BEFORE VALIDATION, as in matos_soares.py and unlike
    # cpdv.py. The two siblings differ because only one of them has anything
    # to correct: a validator that runs first reports faults the corrections
    # layer is about to repair, and then fails the run over them. The receipt
    # keeps the audit trail of what was changed, so nothing is hidden by
    # validating the corrected text -- which is the text that ships.
    corrections = load_corrections(WORK_ID)

    def scope(c: dict) -> str:
        loc = c["locator"]
        return "record" if "record" in loc else "note" if "note" in loc else "verse"

    by_scope = {
        s: [c for c in corrections if scope(c) == s]
        for s in ("record", "note", "verse")
    }

    print(f"Fetching {SOURCE_EDITION} from {BASE_URL}, one request per chapter\n")
    try:
        book_docs, anomalies, seg_applied = run_scrape(
            sample=args.sample,
            offline=args.offline,
            refresh=args.refresh,
            segment_corrections=by_scope["record"],
        )
        applied, _seen = apply_verse_corrections(
            ((b["osis"], b["chapters"]) for b in book_docs),
            by_scope["verse"],
            full_run=not args.sample,
        )
        mirror_into_marked(book_docs, applied)
        applied = (
            seg_applied
            + applied
            + apply_note_corrections(
                book_docs, by_scope["note"], full_run=not args.sample
            )
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1

    counts = census(book_docs)
    print_summary(counts)

    fatal = [a for a in anomalies if a.fatal]
    if anomalies:
        print(
            f"\n{len(anomalies)} source anomalies noted during parsing"
            f"{f', {len(fatal)} of them fatal' if fatal else ''}:"
        )
        for a in [*fatal, *[a for a in anomalies if not a.fatal]][:40]:
            print(f"  [{a.osis} {a.chapter}]{' FATAL:' if a.fatal else ''} {a.detail}")
        if len(anomalies) > 40:
            print(f"  ... and {len(anomalies) - 40} more")

    ok, report = validate(book_docs, sample=args.sample)
    if fatal:
        ok = False
        report.append(
            f"FAIL: {len(fatal)} fatal source anomal{'y' if len(fatal) == 1 else 'ies'} "
            "above -- text would be lost; adjudicate each into pipeline/corrections/"
        )
    print()
    for line in report:
        print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    if not ok:
        print("\nRefusing to write a work that failed validation.", file=sys.stderr)
        return 1

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = corrections_receipt(WORK_ID, applied, corrections, generated_at)
    print(
        f"\nCorrections layer: {receipt['count']} applied, "
        f"{len(receipt['unresolved'])} documented unresolved/not-a-defect "
        "(see corrections-applied.json)"
    )

    write_output(
        book_docs,
        sample=args.sample,
        counts=counts,
        receipt=receipt,
        generated_at=generated_at,
    )
    print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
