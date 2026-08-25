"""The JSON API shared by the two works taken from vulgata.online.

WHY THIS IS ITS OWN MODULE AND NOT `common.py`, and the answer is the one
`sacredbible.py` gives for the same shape one host over: everything here is
intensely per-source -- the `readings2` endpoint, the `tp` record taxonomy,
the site's own book codes -- and it is shared for exactly one reason, that
`introductions.py` (`bible-intro.en`, the `bd` records) and
`douay_rheims.py` (`bible.douay-rheims.en`, the `vs`/`fn`/`cd` records) read
the same responses from the same host for different halves of them.

So the boundary is "one host's API", not "generic fetching". A scraper
against a different site must not import this; it would be importing a
coincidence.

WHAT STAYS IN THE SCRAPERS, in the spirit of `common.py`'s own list:

  - **The rate limit and the user agent.** `FetchPolicy` has no default for
    either precisely so a new scraper cannot inherit another source's floor
    by forgetting to state one. Same host, same number today, still declared
    twice -- because when both run, their politeness budgets add up, and that
    is a fact each file should show.
  - **Validation and the per-edition oracles.** `bible-intro.en` checks its
    book mapping against CPDV's chapter-1 verse counts; the Douay-Rheims
    checks its verse SETS against `bible.clementina.la`, the edition it
    translates. Different claims about different works.
  - **What to do with `_..._` emphasis.** The primitive is here because the
    markup is the host's; the POLICY is not. A preface drops it as the v1
    loss docs/corpus-schema.md records, while a footnote's leading italic is
    the lemma the note glosses and becomes a field. Same characters, opposite
    decisions, and neither belongs to the transport.

THE RECORD TAXONOMY, as observed across all 73 books' chapter 1 plus the
full Douay-Rheims crawl. One request returns one chapter as a flat, UNORDERED
list of typed records, each carrying `bk`, `cn`, `vn`:

    vs   the verse text
    fn   a footnote; `rn` is its ordinal within the chapter, and the verse's
         own text carries a matching `{rn:...}` anchor around the words it
         glosses
    cd   the chapter argument -- Challoner's summary of what the chapter
         contains, printed under its heading
    bd   the book description, i.e. the preface printed before chapter 1
    ln   a line the source prints BEFORE the chapter's verses, at `vn`
    h1   a section heading
    h2   a section subheading

`ln` is not one thing, and reading it as one is the trap. In the Psalms it is
the Latin incipit the psalm is known by (`Beatus vir.`); in Lamentations it is
Jeremias's prologue, several lines of prose that Challoner prints before 1:1 --
AND it carries a footnote anchor of its own (`{1:And it came to pass}`, whose
note says the preface was not written by Jeremias). So a consumer that treats
`ln` as a decorative title will silently drop both a paragraph of text and the
note attached to it.

A chapter past the end of a book answers HTTP 200 with `[]`, which is what
makes `walk` below able to discover a book's length rather than be told it.
"""

from __future__ import annotations

import json
import re
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

# Same reason every scraper in this directory carries these two lines: `common`
# is a package one level up, and Python only puts THIS file's directory on
# `sys.path`. Unlike those, this module is always imported rather than run, so
# the path is normally already set by the scraper importing it -- the insert is
# what keeps that from being a load-order dependency nobody wrote down.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import CorrectionDriftError

BASE_URL = "https://vulgata.online"

#: Their book code -> (our lowercase OSIS code, their book name).
#:
#: BY IDENTITY, NEVER BY POSITION. Their canon orders the Machabees after
#: Malachias; ours puts them after Esther (docs/corpus-schema.md), so the two
#: `order` fields disagree for 27 books and zipping the lists would silently
#: mis-file every one of them.
#:
#: Their names are kept beside the codes because two pairs are live traps in
#: Douay nomenclature: `Jn` is Jonas and `Jo` is John, and their "1 Kings" is
#: our 1 Samuel while their "3 Kings" is our 1 Kings. Both importers re-check
#: this mapping against a work already in the corpus rather than trusting it.
#:
#: THE NAMES ARE ALSO THE DOUAY-RHEIMS EDITION'S DISPLAY NAMES, which is why
#: the four Kings and the two Esdras carry a modern gloss in parentheses. A
#: reader of that edition should meet Challoner's nomenclature -- it is the
#: nomenclature its own cross-references, and the older encyclicals quoting
#: it, actually use -- but a book picker showing "1 Kings" at position 9 and
#: "3 Kings" at position 11 with nothing to distinguish them is a puzzle, not
#: a faithful reproduction.
BOOK_MAP: dict[str, tuple[str, str]] = {
    "Gn": ("gen", "Genesis"),
    "Ex": ("exod", "Exodus"),
    "Lv": ("lev", "Leviticus"),
    "Nm": ("num", "Numbers"),
    "Dt": ("deut", "Deuteronomy"),
    "Js": ("josh", "Josue"),
    "Ju": ("judg", "Judges"),
    "Rt": ("ruth", "Ruth"),
    "1Sm": ("1sam", "1 Kings (1 Samuel)"),
    "2Sm": ("2sam", "2 Kings (2 Samuel)"),
    "1Rs": ("1kgs", "3 Kings (1 Kings)"),
    "2Rs": ("2kgs", "4 Kings"),
    "1Pa": ("1chr", "1 Paralipomenon"),
    "2Pa": ("2chr", "2 Paralipomenon"),
    "Esd": ("ezra", "1 Esdras"),
    "Ne": ("neh", "2 Esdras (Nehemias)"),
    "Tob": ("tob", "Tobias"),
    "Jdi": ("jdt", "Judith"),
    "Est": ("esth", "Esther"),
    "Job": ("job", "Job"),
    "Ps": ("ps", "Psalms"),
    "Pv": ("prov", "Proverbs (Sentences)"),
    "Ees": ("eccl", "Ecclesiastes"),
    "Cc": ("song", "Canticle of Canticles"),
    "Sa": ("wis", "Wisdom"),
    "Eus": ("sir", "Ecclesiasticus"),
    "Is": ("isa", "Isaias"),
    "Je": ("jer", "Jeremias"),
    "Lm": ("lam", "Lamentations"),
    "Ba": ("bar", "Baruch"),
    "Ez": ("ezek", "Ezechiel"),
    "Dn": ("dan", "Daniel"),
    "Os": ("hos", "Osee"),
    "Jl": ("joel", "Joel"),
    "Am": ("amos", "Amos"),
    "Ab": ("obad", "Abdias"),
    "Jn": ("jonah", "Jonas"),
    "Mic": ("mic", "Micheas"),
    "Na": ("nah", "Nahum"),
    "Hc": ("hab", "Habacuc"),
    "So": ("zeph", "Sophonias"),
    "Ag": ("hag", "Aggæus"),
    "Zc": ("zech", "Zacharias"),
    "Ml": ("mal", "Malachias"),
    "1Ma": ("1macc", "1 Machabees"),
    "2Ma": ("2macc", "2 Machabees"),
    "Mt": ("matt", "Matthew"),
    "Mc": ("mark", "Mark"),
    "Lc": ("luke", "Luke"),
    "Jo": ("john", "John"),
    "Act": ("acts", "Acts"),
    "Rm": ("rom", "Romans"),
    "1Co": ("1cor", "1 Corinthians"),
    "2Co": ("2cor", "2 Corinthians"),
    "Gl": ("gal", "Galatians"),
    "Ef": ("eph", "Ephesians"),
    "Fp": ("phil", "Philippians"),
    "Cl": ("col", "Colossians"),
    "1Ts": ("1thess", "1 Thessalonians"),
    "2Ts": ("2thess", "2 Thessalonians"),
    "1Tm": ("1tim", "1 Timothy"),
    "2Tm": ("2tim", "2 Timothy"),
    "Tt": ("titus", "Titus"),
    "Fm": ("phlm", "Philemon"),
    "Hb": ("heb", "Hebrews"),
    "Tg": ("jas", "James"),
    "1Pe": ("1pet", "1 Peter"),
    "2Pe": ("2pet", "2 Peter"),
    "1Jo": ("1john", "1 John"),
    "2Jo": ("2john", "2 John"),
    "3Jo": ("3john", "3 John"),
    "Jda": ("jude", "Jude"),
    "Ap": ("rev", "Apocalypse"),
}

#: `_italic_`, the host's emphasis markup. Non-greedy and single-line: the
#: source never spans a paragraph break with one pair.
EMPHASIS_RE = re.compile(r"_([^_]*)_")

#: `{1:the words the note glosses}` -- a footnote's inline anchor, carrying
#: the `rn` of the `fn` record that explains it. See the taxonomy above.
ANCHOR_RE = re.compile(r"\{(\d+):([^}]*)\}")

#: The source's own bracketed scripture locators (`[Ps. 118, 142]`).
BRACKET_RE = re.compile(r"\[([^\[\]]*)\]")


def chapter_url(edition: str, abbr: str, chapter: int) -> str:
    return f"{BASE_URL}/api/text/readings2/?ed={edition}&bk={abbr}&cn={chapter}"


def cache_name(edition: str, abbr: str, chapter: int) -> str:
    """Where one chapter's response is cached under this source's raw dir.

    CHAPTER 1 KEEPS THE FLAT NAME, and that is a concession to `raw/` being
    write-once (CLAUDE.md, docs/link-surface.md) rather than a taste. The
    2026-08-23 `bible-intro.en` run wrote 73 files named `DR2/{abbr}.json`,
    one per book, each holding chapter 1 -- because at the time chapter 1 was
    the only chapter anyone wanted. Numbering them now would orphan all 73
    and cost a re-crawl to recover exactly the bytes already on disk. So the
    numbered form starts at 2, the existing files stay the record of the
    fetch that made them, and both scrapers read chapter 1 from the same
    place."""
    return (
        f"{edition}/{abbr}.json" if chapter == 1 else f"{edition}/{abbr}.{chapter}.json"
    )


def records(payload: bytes, *, where: str) -> list[dict]:
    """One response's records, or a hard failure naming what was asked for.

    Typed rather than trusted: the endpoint is undocumented and answers 200
    for a chapter that does not exist, so "not a list of objects" is the only
    shape check available and it is worth making loudly."""
    parsed = json.loads(payload)
    if not isinstance(parsed, list):
        raise SystemExit(f"{where}: API returned {type(parsed).__name__}, not a list")
    for record in parsed:
        if not isinstance(record, dict):
            raise SystemExit(
                f"{where}: record is {type(record).__name__}, not an object"
            )
    return parsed


def of_type(records_: list[dict], tp: str) -> list[dict]:
    """This chapter's records of one `tp`, in the source's own `vn`/`rn` order.

    The endpoint returns them unordered -- verse 35 arrives before verse 19 in
    John 3 -- so every caller sorts, and sorting in one place is what keeps a
    caller from forgetting."""
    return sorted(
        (r for r in records_ if r.get("tp") == tp),
        key=lambda r: (r.get("vn") or 0, r.get("rn") or 0),
    )


#: What a scraper does to the host's inline markup before the parser reads a
#: unit's text. Deliberately an argument rather than a default: the two
#: editions here disagree, and neither should inherit the other's answer by
#: forgetting to state one. The Douay-Rheims prints no emphasis in a verse and
#: only wants the brackets off two Psalm titles; the Matos Soares edition sets
#: whole quoted clauses in `_..._` and carries a bracketed locator in running
#: prose. Same characters, different decisions -- which is the module
#: docblock's standing rule about what belongs to the transport and what does
#: not.
Normalizer = Callable[[str], str]


def strip_emphasis(text: str) -> str:
    """`_foo_` -> `foo`. The policy question of whether to is the caller's."""
    return EMPHASIS_RE.sub(r"\1", text)


def strip_brackets(text: str) -> str:
    """`[Ps. 118, 142]` -> `Ps. 118, 142`.

    Both importers do this, for the reason `introductions.py` first gave: the
    brackets are the transcriber's apparatus rather than Challoner's text, and
    dropping them hands the site's citation parser a locator in running prose,
    which is the shape it already reads everywhere else."""
    return BRACKET_RE.sub(r"\1", text)


# --------------------------------------------------------------------------
# Parsing one chapter into the schema's shape
#
# SHARED BECAUSE THE RECORD TAXONOMY IS, not because two scrapers happened to
# want the same code. Everything below reads the `tp`/`vn`/`rn`/`seq`/`cnt`
# shape documented at the top of this file and nothing else; it is as
# per-source as `chapter_url` is. The module docblock's list of what stays in
# the SCRAPERS is unchanged and still excludes this -- the rate limit, the
# user agent, the validation and the per-edition oracles are the policy, and
# turning one chapter's records into verses and notes is not.
#
# It lived in `douay_rheims.py` until 2026-08-25, when the Matos Soares
# edition (`ed=MS`) turned out to want it byte for byte.
# --------------------------------------------------------------------------


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


def render(
    raw: str, known_markers: set[str], normalize: Normalizer
) -> tuple[str, str | None, set[str]]:
    """One `cnt` string -> `(text, text_marked, markers used)`.

    `normalize` is the caller's inline-markup POLICY, applied to the string
    before the anchors are read -- see `Normalizer`. It runs first because
    neither `_..._` nor `[...]` can contain an anchor, so nothing it removes
    could carry one away with it.

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

    raw = normalize(raw)
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
    osis: str, cn: int, chapter: list[dict], *, normalize: Normalizer
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
        text, marked, used = render(raw, available, normalize)
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
# What the parser owes its caller
#
# Not the per-edition oracles -- those stay in the scrapers, as the module
# docblock says, because they are claims about a particular edition. This is
# the other thing: whether `parse_chapter` above did its own job, which is the
# same question whichever edition it ran over.
# --------------------------------------------------------------------------


#: Signatures of a bad decode. The API answers JSON, which `json.loads`
#: decodes as UTF-8 by contract, so unlike the cp1252 pages at sacredbible.org
#: this should be unreachable -- which is the reason to assert it rather than
#: assume it.
MOJIBAKE_MARKERS = ["\N{REPLACEMENT CHARACTER}", "Ã©", "â€™", "â€œ"]


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
