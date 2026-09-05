#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""George Leo Haydock's catena on the Douay-Rheims, as `commentary.haydock.en`.

Source: https://vulgata.online, edition `HAY`, the same undocumented JSON API
`douay_rheims.py` and `introductions.py` read -- one request per chapter:

    GET /api/text/readings2/?ed=HAY&bk={abbr}&cn={n}

WHY THIS IS NOT A BIBLE EDITION, which is the whole reason the file exists.
A chapter of `HAY` answers with `fn` records and NOTHING else -- no `vs`, no
`cd`, no `bd`. Haydock (1811, revised 1859) did not produce a translation; he
produced an apparatus ON the Challoner text, which is already in the corpus as
`bible.douay-rheims.en`, and the host models that correctly by shipping the
notes alone. So this is a `commentary`: a work whose units ADDRESS Scripture
instead of containing it (docs/research/haydock.md, docs/corpus-schema.md
§Commentary). Ingesting it as `type: "bible"` would hand every consumer of
that type -- the edition menu, `compare.ts`'s alignment by verse number,
`PREFERRED_EDITION`, the versification oracle -- a work with zero verses.

WHAT IT IS WORTH. Haydock is a CATENA, not one man's commentary: about half
its paragraphs close with the authority they are drawn from, named. That is
the *Glossa Ordinaria* arrangement this project is named for -- the tradition's
own voices set around the sacred text, each attributed -- and it is why the
attribution is a FIELD here rather than a string left at the end of a
sentence.

FOUR THINGS ABOUT THE SOURCE FORMAT WILL BITE BEFORE THE SCHEMA WILL.

  - **One `fn` record is one VERSE, not one note, and `rn` is always 1.**
    Measured across every record of the sample: the chapter carries exactly one
    record per annotated verse, holding that verse's whole commentary as
    blank-line-separated paragraphs. Reading a record as a note stores a
    fourteen-thousand-character block with one attribution at the end of it.
    So the unit here is the PARAGRAPH, and each is one authority's remark.

  - **A BLANK LINE IS NOT ALWAYS A PARAGRAPH BREAK, because a lemma may span
    one.** Haydock quotes two phrases of a verse in a single italic run and
    the transcription prints the break inside it, so `_Give his only begotten
    Son \n\n God sent not his Son into the world._` (John 3:17) splits into
    two chunks with one underscore each. Neither is then a lemma -- the
    opening one is a paragraph consisting of nothing but an unterminated
    emphasis, which `strip_emphasis` leaves as a literal `_` in the reader's
    text, and the note it belonged to loses its lemma. `split_paragraphs`
    rejoins while the run is open. It is 20 records of 20,814, and the count
    that makes the rule safe is the other one: NOT ONE record's body has an
    odd number of underscores overall, so the merge always closes.

  - **`__Notes:__` blocks pair with `_(#1)_` anchors BY POSITION, never by
    number.** Every anchor in the body is `_(#1)_` and every trailing block
    defines `#1`; Apocalypse 20:2 carries sixteen of each. Reading the digit
    as a marker collapses sixteen distinct notes into one, which is a silent
    loss of fifteen. The n-th anchor belongs to the n-th block, `validate`
    asserts the two counts agree, and the markers are renumbered on the way
    out so the stored unit satisfies the schema's "unique within its unit".

  - **A book cannot be discovered by walking to the first empty chapter**, the
    rule `douay_rheims.py` uses. There, a chapter past the end is the only
    thing that answers `[]`; here a chapter Haydock simply did not annotate
    answers `[]` too, and stopping there would truncate the book at its first
    unannotated chapter with nothing to say it had. The chapter plan is
    therefore READ OFF `bible.douay-rheims.en` -- the work this one annotates,
    whose address space is by definition Haydock's -- and one chapter past
    each book's end is still probed, so the plan is checked rather than
    trusted.

  - **The lemma convention is Challoner's, and `split_note` already reads
    it.** A paragraph opens by quoting the words it glosses, in `_..._`, which
    is the one place the corpus's "emphasis is a v1 loss" rule would destroy
    meaning rather than flatten it (docs/corpus-schema.md §An annotated
    edition). Same primitive, same reasoning, one work over.

WHAT IS NOT DECIDED HERE. The attribution vocabulary is CLOSED and a tail that
does not match it stays in the paragraph's text with no `attribution` field --
the class-vs-instance discipline `pipeline/overrides/README.md` states. Run
`--attributions` after a full crawl to see what the vocabulary is still
missing: it prints every unmatched paragraph-final candidate with its count,
which is the same "propose, then READ" loop `book-forms-oracle.mjs --derive`
exists for. Counting a word proposes a name; reading the sentence decides it.

Usage:
    uv run pipeline/scrapers/bible/haydock.py                # full 73-book run
    uv run pipeline/scrapers/bible/haydock.py --fetch-only   # crawl, write nothing
    uv run pipeline/scrapers/bible/haydock.py --sample       # John + Apocalypse 20
    uv run pipeline/scrapers/bible/haydock.py --offline      # cache-only
    uv run pipeline/scrapers/bible/haydock.py --attributions # vocabulary residue
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line is
# above the imports rather than the imports being at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    Fetcher,
    FetchPolicy,
    build_root,
    captured_at,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    sample_run_writes_nothing,
    write_stamped_json,
)

# The API format itself lives in vulgata_online.py, shared with
# douay_rheims.py and introductions.py. See that module's docblock for the
# record taxonomy.
from vulgata_online import (
    BASE_URL,
    BOOK_MAP,
    Anomaly,
    cache_name,
    chapter_url,
    collapse,
    of_type,
    records,
    split_note,
    strip_brackets,
    strip_emphasis,
)

SOURCE_EDITION = "HAY"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
# Same host and same floor as `douay_rheims.py`, declared again rather than
# imported: when both run their politeness budgets add up, and that is a fact
# each file should show. vulgata.online's robots.txt is `Disallow:` with no
# Crawl-delay, so this floor is ours rather than theirs. 1,334 chapters is
# about 22 minutes.
RATE_LIMIT_SECONDS = 1.0

RAW_SUBDIR = "vulgata-online"
WORK_ID = "commentary.haydock.en"

#: The work this one annotates. Not a preference: Haydock's lemmas quote
#: Challoner's wording, so the commentary is ABOUT this edition and its
#: address space is this edition's.
ANNOTATES_WORK_ID = "bible.douay-rheims.en"

SAMPLE_BOOKS = {"john", "rev"}
SAMPLE_REV_CHAPTERS = {20}

#: The authorities a paragraph can close with. CLOSED, and the residue is
#: reported rather than guessed at -- see the docblock and `--attributions`.
#:
#: DERIVED, THEN READ, which is this project's standing rule for a vocabulary
#: (CLAUDE.md's `Пар.` lesson, and `book-forms-oracle.mjs --derive`). The first
#: nine came from a ten-chapter sample in docs/research/haydock.md; the rest
#: from running `--attributions` over the crawl and READING the sentences each
#: candidate closed, which is what separated the authorities below from
#: "Mauduit here represents the word:" -- a colon-terminated clause that a rule
#: taking whatever capitalised run ends a paragraph would have filed as an
#: author.
#:
#: THE ABBREVIATED FORMS ARE THEIR OWN ENTRIES, NOT ALIASES. `Ken.` and
#: `Kennicott` both appear and both are stored as printed, because folding one
#: into the other is an identity claim about two strings on a page and this
#: file's job is to record what the page says. The trailing full stop is
#: dropped where the name does not carry one and kept where it does -- `Bert.`
#: is an abbreviation and `Calmet.` is a sentence.
ATTRIBUTIONS: tuple[str, ...] = (
    # The compiler, his principal sources, and the Douay-Rheims reviser.
    "Haydock",
    "Calmet",
    "Worthington",
    "Witham",
    "Menochius",
    "Challoner",
    "Berthier",
    "Bristow",
    "Tirinus",
    "Estius",
    "Bert.",
    "Chal.",
    # Read off the crawl and verified in context: each closes a paragraph after
    # a full stop, in the position every attribution above occupies.
    "Salien.",
    "Kennicott.",
    "Grotius.",
    "Houbigant.",
    "Amama.",
    "Euseb.",
    "Ken.",
    "Grot.",
    "Houbig.",
    "Lyran.",
    "Vatable.",
    "Vatab.",
    "Pineda.",
    "Sanctius.",
    "Sanchez.",
    "Drusius.",
    "Bonfrere.",
    "Bochart.",
    "Serarius.",
    "Abulensis.",
    "Abul.",
    "Tostat.",
    "Masius.",
    "Josephus.",
    "Joseph.",
    "Philo.",
    "Usher.",
    "Rabbins.",
    "Bible de Vence",
    "Du Hamel",
    # The Fathers, cited directly.
    "Theodoret",
    "S. Athan.",
    "S. Jerom.",
    "Amb.",
    "Aug.",
    "Chrys.",
    "Hil.",
    "Jer.",
    "Theod.",
    # Manuel de Sá. Two letters, and the shortest thing here -- safe only
    # because a paragraph has to END on it, after a sentence that has already
    # closed, and no English sentence ends on the word "Sa".
    "Sa.",
)

#: `__Notes:__` -- the separator introducing one sub-note block. See the
#: docblock: the blocks are appended after the whole body, one per anchor, in
#: anchor order.
NOTES_SPLIT = "__Notes:__"

#: `_(#1)_` -- the in-body anchor. The digit is always 1 and carries no
#: information; the ORDER is what pairs it with a block.
ANCHOR_RE = re.compile(r"_\(#\d+\)_")

#: `#1: ...` -- the definition opening a sub-note block.
NOTE_DEF_RE = re.compile(r"^\s*#\d+:\s*")

#: The host prints an occasional HTML tag inside a note (`_<u>A</u>_` at
#: Psalm 118:103, marking a letter of Homer). Markup, not text, and dropped as
#: the v1 loss docs/corpus-schema.md records -- raw/ keeps it.
TAG_RE = re.compile(r"<[^>]{1,40}>")

#: The host's second emphasis form, beside the `_..._` `strip_emphasis` reads.
ASTERISK_RE = re.compile(r"\*([^*]*)\*")

TOKEN = "⟦{}⟧"

#: The token `TOKEN` writes, for reading it back out again -- `text` is
#: `text_marked` with these removed, and deriving one from the other is what
#: keeps the schema's "the two must agree" true by construction.
TOKEN_RE = re.compile(r"⟦\d+⟧")


def raw_dir() -> Path:
    """This scraper's fetch cache. A function, not a constant -- see cpdv.py."""
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


# --------------------------------------------------------------------------
# The chapter plan
# --------------------------------------------------------------------------


def chapter_plan() -> dict[str, list[int]]:
    """`osis -> chapter numbers`, read off the work this one annotates.

    See the docblock's third bullet for why this is not discovered by walking:
    an unannotated chapter and a chapter past the end of a book answer
    identically here, so a walk would stop at the first hole rather than at
    the end. Reading the plan off `bible.douay-rheims.en` also makes the
    address invariant true by construction on the way IN, which is the
    cheapest place to make it true -- `validate` then re-checks it on the way
    out against the same source, and a disagreement means the plan moved
    under the parse.
    """
    books_dir = build_root() / ANNOTATES_WORK_ID / "books"
    if not books_dir.is_dir():
        raise SystemExit(
            f"{WORK_ID} needs {ANNOTATES_WORK_ID} in the corpus to know which "
            f"chapters exist; {books_dir} is not there. Run "
            "`uv run pipeline/rebuild.py --only douay-rheims` first."
        )
    plan: dict[str, list[int]] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        plan[book["osis"]] = [c["n"] for c in book.get("chapters") or []]
    return plan


def annotated_verses() -> dict[str, dict[int, set[int]]]:
    """`osis -> {chapter: verse numbers}` from the work this one annotates.

    `validate`'s address oracle. Empty when that edition is not in the corpus,
    which cannot happen here (`chapter_plan` has already died), and is written
    defensively anyway because an oracle that quietly is not there is worse
    than no oracle -- the run still says PASS.
    """
    books_dir = build_root() / ANNOTATES_WORK_ID / "books"
    if not books_dir.is_dir():
        return {}
    out: dict[str, dict[int, set[int]]] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        out[book["osis"]] = {
            chap["n"]: {v["n"] for v in chap["verses"]}
            for chap in book.get("chapters") or []
        }
    return out


def canonical_order() -> dict[str, int]:
    """`osis -> order`, borrowed from the edition this one annotates.

    Same reason `douay_rheims.py` borrows it rather than restating it: the
    source's canon orders the Machabees after Malachias and ours puts them
    after Esther, so the API's own order is wrong for 27 books and a second
    hand-written table is one more thing to keep in step.
    """
    books_dir = build_root() / ANNOTATES_WORK_ID / "books"
    order: dict[str, int] = {}
    for path in sorted(books_dir.glob("*.json")):
        book = json.loads(path.read_text(encoding="utf-8"))
        order[book["osis"]] = book["order"]
    return order


# --------------------------------------------------------------------------
# Parsing one record
# --------------------------------------------------------------------------


def normalize(text: str) -> str:
    """This work's inline-markup policy (`Normalizer` in vulgata_online).

    TAGS AND BOTH EMPHASIS FORMS OFF, BRACKETS OFF. Unlike `DR2`, which sets
    nothing but a note's opening lemma in italics, Haydock sets quoted words
    throughout a paragraph in both `_..._` and `*...*` -- so emphasis here is
    the ordinary v1 loss rather than structure, and only the LEADING italic is
    promoted, by `split_note`, before this is ever reached. Brackets go for
    the reason `introductions.py` first gave: they are the transcriber's
    apparatus, and dropping them hands the site's citation parser a locator in
    running prose, which is the shape it reads everywhere else.
    """
    return collapse(
        strip_brackets(strip_emphasis(ASTERISK_RE.sub(r"\1", TAG_RE.sub("", text))))
    )


def split_attribution(text: str) -> tuple[str, str | None]:
    """`(paragraph, attribution)` -- the authority a paragraph closes with.

    Matched against the closed `ATTRIBUTIONS` vocabulary and nowhere else. A
    tail that is not in it is left in the text and reported by
    `--attributions`, because the alternative -- taking whatever capitalised
    run ends the paragraph -- reads "Mauduit here represents the word:" as an
    author, and the *Пар.* lesson in CLAUDE.md is that counting a candidate
    proposes it and only reading the sentence decides it.

    The trailing full stop is the sentence's, not the name's: the source
    prints "Calmet" and "Calmet." interchangeably for the same authority, so
    the stored value is the vocabulary's spelling rather than the page's.

    A PAIR IS TWO VOCABULARY ENTRIES AND IS NOT LISTED AS ONE. Haydock credits
    two authorities for a remark he has merged -- "Haydock Menochius",
    "Calmet Tirinus", "Challoner Worthington" -- printing them as one run with
    no separator. Eight such pairs appear in the crawl and enumerating them
    would be eight entries that say nothing the single names do not; matching a
    name and then trying again on what is left in front of it finds all of them
    and any ninth. They are stored as printed, in the source's order, rather
    than split into a list: which of the two said which half is a claim the
    page does not make.
    """
    head, name = _tail_name(text)
    if name is None:
        return text.rstrip(), None
    # A name is an attribution only where the remark it signs has ENDED in
    # front of it: "…as Calmet supposed" is a sentence about Calmet, and
    # "…he was from eternity, as Calmet" has the name as its own clause's
    # subject. The discriminator is what precedes it.
    if _closes_sentence(head):
        return head, name
    # Not a sentence end, so the only thing that can legitimately stand there
    # is the first half of a pair -- and it has to satisfy the same test.
    before, second = _tail_name(head)
    if second is not None and _closes_sentence(before):
        return before, f"{second} {name}"
    return text.rstrip(), None


#: Closing marks that may stand between a sentence's own punctuation and the
#: attribution after it. Haydock quotes constantly -- a version's rendering,
#: a Father's words -- and a quotation carries its full stop INSIDE the
#: quotation marks, so the head of `"man and his arms to the water." Haydock`
#: ends on a quote and not on the period. Reading that as an open clause cost
#: 2,167 notes their signature, 2,002 of them to this one character.
_CLOSERS = "\"'”’)]"


def _closes_sentence(head: str) -> bool:
    """Whether an attribution may follow `head` -- i.e. nothing is left, or
    what is left ends its own clause.

    The closers are stepped over rather than accepted: `…water."` closes
    because the period under the quote does, and `Heb. "cord"` still does not,
    because stripping the quote leaves a bare word. That is the distinction the
    guard exists for -- it is what keeps "Mauduit here represents the word:"
    from reading as an author -- and it was never about quotation.
    """
    head = head.rstrip(_CLOSERS)
    return not head or head[-1] in ".?!—:;,"


def _tail_name(text: str) -> tuple[str, str | None]:
    """The vocabulary name `text` ends on, longest first, and what precedes it.

    Deliberately WITHOUT the boundary test: applying it here is what made the
    pairs unmatchable, since the first half of "Haydock Menochius" is a bare
    word rather than a sentence end. The caller applies it, which is the only
    place that knows whether it is looking at a whole tail or half of one.
    """
    stripped = text.rstrip()
    for name in sorted(ATTRIBUTIONS, key=len, reverse=True):
        for printed in (name, name + "."):
            if stripped.endswith(printed):
                return stripped[: -len(printed)].rstrip(), name
    return stripped, None


def attribution_candidates(text: str) -> str | None:
    """What `--attributions` reports: the tail a paragraph MIGHT be signed by.

    Deliberately generous where `split_attribution` is strict -- this is the
    proposal half of the loop, read by a person, and a candidate it prints is
    not thereby a name.
    """
    match = re.search(r"(?:\.|\?|!|—)\s*([A-Z][A-Za-z.æ ]{1,28})\s*$", text)
    return match.group(1).strip() if match else None


def parse_record(
    record: dict, osis: str, chapter: int
) -> tuple[list[dict], list[Anomaly]]:
    """One `fn` record -> that verse's notes, one per paragraph.

    The sub-note pairing is the delicate half and the docblock states the
    rule: body first, then one `__Notes:__` block per anchor, in anchor order,
    every one of them printed `#1`. The anchors are collected across the whole
    body so the pairing is by document order, then renumbered per PARAGRAPH on
    the way out -- a marker is unique within its unit, and the unit stored here
    is the paragraph.
    """
    anomalies: list[Anomaly] = []
    raw = html.unescape(record.get("cnt") or "")
    verse = record.get("vn")

    segments = raw.split(NOTES_SPLIT)
    body = segments[0]
    blocks = segments[1:]

    definitions: list[str] = []
    for block in blocks:
        # A block holds one definition and nothing else in every case
        # measured; anything after it would be body text resuming, which the
        # anomaly below reports rather than silently dropping.
        text = NOTE_DEF_RE.sub("", block.strip(), count=1)
        definitions.append(normalize(text))

    anchors = ANCHOR_RE.findall(body)
    if len(anchors) != len(definitions):
        anomalies.append(
            Anomaly(
                osis,
                chapter,
                f"v{verse}: {len(anchors)} sub-note anchor(s) against "
                f"{len(definitions)} definition(s); pairing is positional, so "
                "the counts must agree",
                fatal=True,
            )
        )
        return [], anomalies

    notes: list[dict] = []
    consumed = 0
    paragraphs, unclosed = split_paragraphs(body)
    if unclosed:
        anomalies.append(
            Anomaly(
                osis,
                chapter,
                f"v{verse}: the body ends inside an emphasis run, so its last "
                "paragraphs were merged into one; the source's underscores do "
                "not pair",
            )
        )
    for paragraph in paragraphs:
        lemma, _ = split_note(paragraph)
        used = len(ANCHOR_RE.findall(paragraph))
        mine = definitions[consumed : consumed + used]
        consumed += used

        # BOTH FORMS COME OFF ONE STRING, which is the schema's requirement
        # ("`text` is always this string with the tokens stripped") and the
        # only way to satisfy it that cannot drift. Deriving the plain text
        # from `split_note`'s own half instead looked equivalent and was not:
        # `strip_emphasis` turns `_(#1)_` into `(#1)`, so `ANCHOR_RE` no longer
        # matched it and the anchor was left sitting in the reader's text as
        # literal "(#1)" while `text_marked` carried a proper token.
        marked = number_anchors(gloss_with_anchors(paragraph))
        plain = collapse(TOKEN_RE.sub("", marked))
        plain, attribution = split_attribution(plain)
        if not plain:
            continue

        note: dict = {"text": plain}
        if lemma:
            note["lemma"] = normalize(lemma).rstrip(":").strip()
        if attribution:
            note["attribution"] = attribution
        if used:
            trimmed, _ = split_attribution(marked)
            note["text_marked"] = trimmed
            note["notes"] = [
                {"marker": str(i + 1), "text": definition}
                for i, definition in enumerate(mine)
            ]
        notes.append(note)

    return notes, anomalies


def split_paragraphs(body: str) -> tuple[list[str], bool]:
    """A record's paragraphs, with a lemma that spans a blank line kept whole.

    The blank line is the source's paragraph break everywhere except inside an
    emphasis run, and there it is a line break inside a quotation -- Haydock
    cites two phrases of a verse as one lemma and the transcription sets the
    break between them. Splitting there costs the note its lemma AND leaves a
    bare `_` in the reader's text, because `strip_emphasis` pairs delimiters
    and an orphan has nothing to pair with.

    THE TEST IS PARITY AND THAT IS ENOUGH HERE, rather than a real emphasis
    parse: `_` is this format's only italic delimiter, an anchor is `_(#1)_`
    and so contributes two, and `__Notes:__` has already been split off by the
    caller. Measured over all 20,814 records, 20 have a chunk that opens a run
    it does not close and NONE has a body whose underscores do not pair
    overall -- so a merge begun always ends, and the flag returned is for the
    record that would prove that measurement stale.
    """
    out: list[str] = []
    pending = ""
    for chunk in re.split(r"\n\s*\n", body):
        if not chunk.strip():
            continue
        pending = f"{pending}\n\n{chunk}" if pending else chunk
        if not _continues(pending):
            out.append(pending)
            pending = ""
    if pending:
        out.append(pending)
    return out, bool(pending)


def _continues(pending: str) -> bool:
    """Whether the blank line after `pending` is a line break and not a break.

    TWO SIGNALS, AND BOTH ARE THE SOURCE'S PUNCTUATION RATHER THAN OUR
    JUDGMENT.

    An OPEN EMPHASIS RUN: `_` is this format's only italic delimiter, an
    anchor is `_(#1)_` and contributes two, and `__Notes:__` has already been
    split off by the caller, so odd parity means a lemma spans the break.

    AN OPEN CLAUSE: a segment ending on `,` `:` or `;` has not finished its
    sentence, so what follows is the rest of it. Genesis 1:4 is the case that
    reads worst -- `_Good;_ beautiful and convenient:` alone is not a note,
    it is the first half of Calmet's, whose second half glosses the next
    phrase of the verse and carries the signature for both. Split, the reader
    gets an unattributed fragment ending in a colon. It is 108 segments in
    45,824, and about half of them are the lines of a verse quotation, which
    the same rule reassembles: Judges 15:4 filed a Latin hexameter as seven
    separate notes.

    A segment that ends on a full stop and still continues is indistinguishable
    from one that does not, and is left alone. This reads punctuation, not
    sense.
    """
    return pending.count("_") % 2 == 1 or pending.rstrip()[-1:] in ",:;"


def number_anchors(text: str) -> str:
    """`_(#1)_ ... _(#1)_` -> `⟦1⟧ ... ⟦2⟧`, in document order.

    The renumbering the schema needs and the source does not do: every anchor
    the source prints is `#1`, and what distinguishes them is their position
    (see this module's docblock). Written as a walk rather than as `sub` with a
    counting closure, which is the same thing with a loop variable captured by
    reference -- correct here only because `sub` happens to run eagerly.
    """
    out: list[str] = []
    last = 0
    for i, match in enumerate(ANCHOR_RE.finditer(text), start=1):
        out.append(text[last : match.start()])
        out.append(TOKEN.format(i))
        last = match.end()
    out.append(text[last:])
    return "".join(out)


def gloss_with_anchors(paragraph: str) -> str:
    """The paragraph's gloss with its anchors still in place.

    `split_note` returns the lemma and the gloss already stripped of emphasis,
    and an anchor is spelled with underscores -- `_(#1)_` -- so the strip
    turns it into `(#1)` and `ANCHOR_RE` no longer matches. Rebuilding the
    marked form therefore has to work from the raw paragraph rather than from
    the stripped one, which is the whole of what this function is for.
    """
    lemma_match = re.match(r"^_([^_]*)_\s*", paragraph)
    rest = paragraph[lemma_match.end() :] if lemma_match else paragraph
    # Protect the anchors from `strip_emphasis`, which would otherwise eat
    # their own underscores, then restore them after the normalisation runs.
    guarded = ANCHOR_RE.sub("\x00", rest)
    normalised = normalize(guarded)
    return normalised.replace("\x00", "_(#1)_")


def parse_chapter_records(
    osis: str, chapter: int, chapter_records: list[dict]
) -> tuple[list[dict], list[Anomaly]]:
    """One chapter's `fn` records -> `[{verse, notes}]`, in verse order."""
    out: list[dict] = []
    anomalies: list[Anomaly] = []
    for record in of_type(chapter_records, "fn"):
        verse = record.get("vn")
        if not isinstance(verse, int) or verse < 1:
            anomalies.append(
                Anomaly(osis, chapter, f"record with vn={verse!r}", fatal=True)
            )
            continue
        notes, found = parse_record(record, osis, chapter)
        anomalies.extend(found)
        if notes:
            out.append({"verse": verse, "notes": notes})
    out.sort(key=lambda entry: entry["verse"])
    return out, anomalies


# --------------------------------------------------------------------------
# Crawling
# --------------------------------------------------------------------------


def run_scrape(
    *, sample: bool, offline: bool, refresh: bool, fetch_only: bool
) -> tuple[list[dict], list[Anomaly], Counter]:
    """Fetch every chapter the annotated edition has, plus one past each book.

    The probe is what keeps the plan honest: the plan says where the book
    ends, and one request past it answering `[]` is the evidence. A book that
    answers records beyond its plan is reported, because that is the edition
    and the plan disagreeing about the shape of the canon, which is exactly
    the class of thing a borrowed table can be wrong about.
    """
    plan = chapter_plan()
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
    residue: Counter = Counter()
    book_docs: list[dict] = []
    for abbr, (osis, name) in BOOK_MAP.items():
        if sample and osis not in SAMPLE_BOOKS:
            continue
        wanted = plan.get(osis) or []
        chapters: list[dict] = []
        for cn in wanted:
            if sample and osis == "rev" and cn not in SAMPLE_REV_CHAPTERS:
                continue
            payload = fetcher.fetch_bytes(
                chapter_url(SOURCE_EDITION, abbr, cn),
                cache_name(SOURCE_EDITION, abbr, cn),
            )
            if fetch_only:
                continue
            chapter_records = records(payload, where=f"{abbr} {cn} ({name})")
            for record in of_type(chapter_records, "fn"):
                for paragraph in re.split(r"\n\s*\n", record.get("cnt") or ""):
                    text, attribution = split_attribution(normalize(paragraph))
                    if attribution is None:
                        candidate = attribution_candidates(text)
                        if candidate:
                            residue[candidate] += 1
            verses, found = parse_chapter_records(osis, cn, chapter_records)
            anomalies.extend(found)
            if verses:
                chapters.append({"n": cn, "verses": verses})

        # One past the end: the plan's own proof. Skipped under `--sample`,
        # where the plan is deliberately partial.
        if wanted and not sample:
            beyond = fetcher.fetch_bytes(
                chapter_url(SOURCE_EDITION, abbr, max(wanted) + 1),
                cache_name(SOURCE_EDITION, abbr, max(wanted) + 1),
            )
            if records(beyond, where=f"{abbr} {max(wanted) + 1} (probe)"):
                anomalies.append(
                    Anomaly(
                        osis,
                        max(wanted) + 1,
                        f"{ANNOTATES_WORK_ID} ends this book at "
                        f"{max(wanted)} but HAY answers records beyond it",
                    )
                )

        if fetch_only:
            print(f"  {abbr:<5} {osis:<7} {name:<24} {len(wanted):>3} ch fetched")
            continue

        book_docs.append({"osis": osis, "order": 0, "chapters": chapters})
        notes = sum(len(v["notes"]) for c in chapters for v in c["verses"])
        print(
            f"  {abbr:<5} {osis:<7} {name:<24} {len(chapters):>3} ch  "
            f"{sum(len(c['verses']) for c in chapters):>5} vv  {notes:>5} notes"
        )

    order = canonical_order()
    for book in book_docs:
        book["order"] = order.get(book["osis"], 0)
    book_docs.sort(key=lambda b: b["order"])
    return book_docs, anomalies, residue


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def validate(book_docs: list[dict], sample: bool) -> tuple[bool, list[str]]:
    """The checks this work can actually make, and one it deliberately cannot.

    THE ADDRESS ORACLE IS THE POINT. A commentary that names a verse the
    annotated edition does not have addresses nothing, and the failure is
    invisible on the page -- the note simply never renders beside anything. So
    every `{osis, chapter, verse}` is checked against
    `bible.douay-rheims.en`, which is both what the plan was built from and
    what the site will resolve against.

    THE LINE IS DRAWN AT THE CHAPTER, AND THAT IS THE INTERESTING PART. A book
    or a chapter this commentary names and the edition does not have is a
    STRUCTURAL error and fatal: the two disagree about the shape of the canon,
    which nothing here can be right about. A VERSE it names inside a chapter
    that does exist is edition divergence, and is reported instead --
    docs/research/bible-edition-divergence.md's rule one work along, since a
    commentary is an edition of an apparatus and diverges the same ways.
    Measured 2026-09-01, all 25 of them, in three kinds and none a parse
    defect:

      - **Psalms 115 and 147, 17 notes: the same verses under other numbers.**
        The Vulgate runs Ps 115 on from Ps 114 and Ps 147 from Ps 146, so
        `DR2` numbers them 10-19 and 12-20; `HAY` restarts each at 1. It is a
        pure offset -- `HAY` 115:1 is `DR2` 115:10 -- and it is NOT converted
        here, because renumbering another edition's apparatus onto ours is the
        editorial act that document exists to forbid.
      - **Psalms 10 and 12, 7 notes past the chapter's end.** `DR2` ends Ps 10
        at verse 8 and Ps 12 at 6; `HAY` annotates to 14 and 7. The two
        transcriptions of the same psalter divide it differently at the seam
        the Hebrew and Vulgate numbering already disagree about.
      - **Wisdom 18:25, one note, and the gap is OURS.** `DR2` prints verses
        22, 23, 24, 26 -- a verse-number gap the schema explicitly allows and
        forbids renumbering. Haydock annotates the verse that edition omits.

    They are stored rather than dropped, because `build/` records what the
    source said and the site simply renders nothing beside an address it has
    no verse for. What must not happen is that they go unnoticed, which is
    what the count printed below is for.

    THE LEMMA CHECK IS REPORTED, NOT FATAL, and it is the cheapest available
    check on the transcription: a lemma is a quotation, so the same words are
    printed twice, once in Challoner's verse and once at the head of the note.
    It is not fatal because Haydock quotes loosely where Challoner's own
    apparatus quotes exactly -- he elides with "&c.", modernises a spelling,
    and quotes the Latin where the verse prints English -- so a mismatch here
    is a lead rather than a verdict. `douay_rheims.py` holds the same check to
    the same standard for the same reason.
    """
    problems: list[str] = []
    #: Verses this commentary names that the annotated edition numbers
    #: differently or does not print. Reported, never fatal -- see the
    #: docstring for all 25 of them, read one by one.
    diverged: list[str] = []
    oracle = annotated_verses()

    total_notes = 0
    attributed = 0
    lemma_hits = 0
    lemma_total = 0
    for book in book_docs:
        osis = book["osis"]
        known = oracle.get(osis)
        if known is None:
            problems.append(f"{osis}: not a book of {ANNOTATES_WORK_ID}")
            continue
        for chapter in book["chapters"]:
            verses = known.get(chapter["n"])
            if verses is None:
                problems.append(
                    f"{osis} {chapter['n']}: not a chapter of {ANNOTATES_WORK_ID}"
                )
                continue
            for entry in chapter["verses"]:
                if entry["verse"] not in verses:
                    diverged.append(f"{osis} {chapter['n']}:{entry['verse']}")
                for note in entry["notes"]:
                    total_notes += 1
                    if note.get("attribution"):
                        attributed += 1
                    if not note.get("text"):
                        problems.append(
                            f"{osis} {chapter['n']}:{entry['verse']}: empty note"
                        )
                    marked = note.get("text_marked")
                    subs = note.get("notes") or []
                    if marked is not None:
                        tokens = re.findall(r"⟦(\d+)⟧", marked)
                        if len(tokens) != len(subs):
                            problems.append(
                                f"{osis} {chapter['n']}:{entry['verse']}: "
                                f"{len(tokens)} token(s) against {len(subs)} sub-note(s)"
                            )
                    elif subs:
                        problems.append(
                            f"{osis} {chapter['n']}:{entry['verse']}: "
                            "sub-notes with no marked text to anchor them"
                        )

    lemma_hits, lemma_total = lemma_agreement(book_docs)
    ok = not problems
    print()
    print(f"  works            {WORK_ID}")
    print(f"  books            {len(book_docs)}")
    print(f"  chapters         {sum(len(b['chapters']) for b in book_docs)}")
    print(
        f"  annotated verses "
        f"{sum(len(c['verses']) for b in book_docs for c in b['chapters'])}"
    )
    print(f"  notes            {total_notes}")
    if total_notes:
        print(f"  attributed       {attributed} ({attributed / total_notes:.0%})")
    if lemma_total:
        print(
            f"  lemma in verse   {lemma_hits}/{lemma_total} "
            f"({lemma_hits / lemma_total:.0%}) -- reported, not fatal"
        )
    if diverged:
        print(
            f"  verse divergence {len(diverged)} note(s) at a verse "
            f"{ANNOTATES_WORK_ID} numbers otherwise -- reported, not fatal"
        )
        print(
            f"                   {', '.join(diverged[:8])}"
            + (f", +{len(diverged) - 8} more" if len(diverged) > 8 else "")
        )
    print(f"  address check    {'PASS' if ok else f'FAIL ({len(problems)})'}")
    if sample:
        print("  (sample run -- nothing written)")
    return ok, problems


def fold_for_match(text: str) -> str:
    """Lower-cased, punctuation-free, single-spaced -- for the lemma check."""
    return re.sub(r"[^a-z0-9 ]+", "", text.lower()).strip()


def lemma_agreement(book_docs: list[dict]) -> tuple[int, int]:
    """How many lemmas are found verbatim in the verse they gloss."""
    books_dir = build_root() / ANNOTATES_WORK_ID / "books"
    if not books_dir.is_dir():
        return 0, 0
    hits = 0
    total = 0
    for book in book_docs:
        path = books_dir / f"{book['osis']}.json"
        if not path.exists():
            continue
        source = json.loads(path.read_text(encoding="utf-8"))
        text_of = {
            (chap["n"], verse["n"]): fold_for_match(verse.get("text") or "")
            for chap in source.get("chapters") or []
            for verse in chap.get("verses") or []
        }
        for chapter in book["chapters"]:
            for entry in chapter["verses"]:
                verse_text = text_of.get((chapter["n"], entry["verse"]))
                if verse_text is None:
                    continue
                for note in entry["notes"]:
                    lemma = note.get("lemma")
                    if not lemma:
                        continue
                    total += 1
                    if fold_for_match(lemma) and fold_for_match(lemma) in verse_text:
                        hits += 1
    return hits, total


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def census(book_docs: list[dict]) -> dict[str, int]:
    notes = [
        note
        for book in book_docs
        for chapter in book["chapters"]
        for entry in chapter["verses"]
        for note in entry["notes"]
    ]
    return {
        "books": len(book_docs),
        "chapters": sum(len(b["chapters"]) for b in book_docs),
        "verses": sum(len(c["verses"]) for b in book_docs for c in b["chapters"]),
        "notes": len(notes),
        "attributed": sum(1 for n in notes if n.get("attribution")),
        "sub_notes": sum(len(n.get("notes") or []) for n in notes),
    }


def retrieved_at() -> str:
    """The date this work was actually FETCHED, which is not today.

    Same reasoning as `douay_rheims.retrieved_at`: an offline re-parse must
    not restamp a claim about the outside world, and `generated_at` already
    records when the parse ran.
    """
    recorded = captured_at(raw_dir() / cache_name(SOURCE_EDITION, "Gn", 1))
    if recorded:
        return recorded
    existing = work_dir() / "manifest.json"
    if existing.exists():
        try:
            prior = json.loads(existing.read_text(encoding="utf-8"))
            stamp = (prior.get("sources") or [{}])[0].get("retrieved_at")
            if isinstance(stamp, str) and stamp:
                return stamp
        except (json.JSONDecodeError, OSError, IndexError):
            pass
    return datetime.now(UTC).date().isoformat()


def write_output(
    book_docs: list[dict],
    *,
    sample: bool,
    counts: dict[str, int],
    receipt: dict,
    generated_at: str,
) -> None:
    if sample_run_writes_nothing(sample):
        return

    notes = (
        "George Leo Haydock's commentary (1811, revised 1859) on the "
        "Douay-Rheims, transcribed by vulgata.online as edition code HAY and "
        "taken from its JSON API. Public domain on age. It is an apparatus "
        "rather than a translation -- the source ships notes and no verses at "
        "all -- so it is stored as a commentary whose units address "
        f"{ANNOTATES_WORK_ID}, the Challoner text it was written on, and it "
        "has no address space of its own. It is a CATENA: the source closes a "
        "paragraph with the authority it is drawn from, and "
        f"{counts['attributed']} of {counts['notes']} notes are attributed "
        "against a closed vocabulary, the rest left unsigned as printed. One "
        "note is one paragraph of one authority; the source's own unit is the "
        "verse, holding all of them at once. Emphasis is dropped, the v1 loss "
        "docs/corpus-schema.md records, except the leading italic naming the "
        "words a note glosses, which is kept as its `lemma`. "
        f"{counts['sub_notes']} philological sub-notes carry the same "
        "U+27E6/U+27E7 token the rest of the corpus uses; the source numbers "
        "every one of them 1 and pairs them by position. Haydock's apparatus "
        "is eighteenth- and nineteenth-century controversy as much as "
        "exegesis; see docs/decisions.md §Posture."
    )
    manifest = {
        "id": WORK_ID,
        "type": "commentary",
        "title": "Haydock's Catholic Family Bible commentary",
        "short_title": "Haydock",
        "language": "en",
        "edition": "Revised edition, 1859",
        "annotates": ANNOTATES_WORK_ID,
        # WHICH UNIT SPACE ITS NOTES ADDRESS. There are two since
        # `commentary.preces.*` (2026-09-04) -- a Bible verse and a prayer --
        # and the field is written rather than inferred from the annotated
        # work's type so that a consumer can branch on it before reading a
        # second manifest. docs/corpus-schema.md §Commentary.
        "addresses": "bible",
        # HAYDOCK'S CATENA INCLUDES CHALLONER'S OWN NOTES, and a reader with
        # both apparatuses on sees most of one of them twice. Measured
        # 2026-09-01 over the built corpus: 1,399 of the Douay-Rheims's 1,916
        # notes appear again here (>=0.75 similar on the same verse, 1,249 of
        # them at >=0.9), and 1,300 paragraphs are attributed to Challoner by
        # name. It is a property of the WORK -- Haydock published Challoner's
        # text with Challoner's notes absorbed into the catena -- so it is
        # stated here rather than inferred by the reader's interface, which
        # only reads it to decide a default.
        #
        # NOT A LICENCE TO DROP EITHER COPY. The overlap is 73% and not 100%:
        # 517 of Challoner's notes are NOT in this capture, so a reader who
        # wants them can still switch the edition's own apparatus back on.
        "subsumes_notes": True,
        "sources": [
            {"url": BASE_URL + "/bible/Gn.1?ed=HAY", "retrieved_at": retrieved_at()}
        ],
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
    parser.add_argument("--sample", action="store_true", help="John + Apocalypse 20")
    parser.add_argument("--offline", action="store_true", help="cache only")
    parser.add_argument("--refresh", action="store_true", help="bypass the cache")
    parser.add_argument(
        "--fetch-only",
        action="store_true",
        help="crawl into raw/ and write no work; the acquisition half",
    )
    parser.add_argument(
        "--attributions",
        action="store_true",
        help="report unmatched paragraph-final candidates and exit",
    )
    args = parser.parse_args()

    require_corpus()
    generated_at = datetime.now(UTC).isoformat(timespec="seconds")

    print(f"Fetching {SOURCE_EDITION} from {BASE_URL}, one request per chapter\n")
    book_docs, anomalies, residue = run_scrape(
        sample=args.sample,
        offline=args.offline,
        refresh=args.refresh,
        fetch_only=args.fetch_only,
    )

    if args.fetch_only:
        print("\n--fetch-only: nothing written.")
        return 0

    if args.attributions:
        print("\nUnmatched paragraph-final candidates, commonest first.")
        print("A candidate is a PROPOSAL. Read the sentence before adding it.\n")
        for candidate, count in residue.most_common(60):
            print(f"  {count:>5}  {candidate}")
        return 0

    fatal = [a for a in anomalies if a.fatal]
    for anomaly in anomalies:
        mark = "FATAL" if anomaly.fatal else "note "
        print(f"  {mark} {anomaly.osis} {anomaly.chapter}: {anomaly.detail}")

    counts = census(book_docs)
    corrections = load_corrections(WORK_ID)
    receipt = corrections_receipt(WORK_ID, [], corrections, generated_at)
    ok, problems = validate(book_docs, args.sample)
    for problem in problems[:40]:
        print(f"  FAIL {problem}")
    if len(problems) > 40:
        print(f"  ... and {len(problems) - 40} more")

    write_output(
        book_docs,
        sample=args.sample,
        counts=counts,
        receipt=receipt,
        generated_at=generated_at,
    )
    return 0 if ok and not fatal else 1


if __name__ == "__main__":
    raise SystemExit(main())
