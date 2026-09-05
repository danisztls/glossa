#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""The Catechism and the Compendium glossing the prayers, as `commentary.preces.*`.

A commentary is a work whose units ADDRESS another work rather than containing
text (docs/corpus-schema.md §Commentary). `commentary.haydock.en` was the
first and addresses a Bible verse; this is the second and addresses a PRAYER,
which is the schema's second unit space and the whole of what is new here.

WHAT IT READS, AND IT COSTS NO FETCH. Two passages already in the corpus:

  * **CCC 2676-2677 on the Hail Mary.** The closest thing anywhere in the
    corpus to a printed glossa -- one gloss per clause of the Ave, in the
    edition's own language, with each clause quoted at the head of the run
    that explains it. Seven editions have both a Catechism and a prayer
    collection (`ccc.mg` has no `prayer.common.mg`, so there is nothing there
    to annotate).
  * **Compendium qq. 578-598 on the Our Father.** One question and one answer
    per petition, and the question QUOTES the petition -- `What does
    "Hallowed be thy Name" mean?` -- in all fourteen editions. Where the
    Catechism's own Part Four is forty paragraphs behind one line of the
    prayer, this is one paragraph, which is the size that fits beside a line.

WHY HAYDOCK IS NOT HERE, though four of the prayers are Scripture and he
glosses all four. Measured 2026-09-04 against `commentary.haydock.en` and
`prayer.common.en`: 37 notes over the four, 11 carrying a lemma, and 4 whose
lemma the prayer actually prints. The anchoring is not the problem -- Haydock
annotates the DOUAY-RHEIMS, and the appendix prints a different English. Its
Magnificat opens `My soul proclaims the greatness of the Lord` where Challoner
has `My soul doth magnify the Lord`, and Haydock's note at Matthew 6:11 is on
`supersubstantial bread`, which the prayer does not contain. That is the same
rule that already keeps Haydock off the CPDV, and it holds here: a lemma
quotes one text. The four prayers get a LINK to their Scripture address
instead (docs/link-surface.md), which is not this file's business.

THE LEMMA IS THE LONGEST OPENING RUN THE PRAYER ITSELF PRINTS, and that one
rule replaces a table of eight typographies. The source marks its lemma
differently in every edition -- italics inside guillemets in pt/la/it/es/mg,
italics inside curly quotes in fr, a colon and no markup at all in en, no
delimiter whatsoever in de -- and a per-edition rule would be eight guesses,
each falsifiable only by reading the page. So the rule is instead: a printed
glossa OPENS on the words it glosses, therefore take the longest prefix of the
run that occurs verbatim in the prayer. It cannot invent, because every
character it stores is quoted from the annotated text by construction; it
cannot silently mismatch, because a run that opens on anything else yields
nothing and the note simply carries no lemma.

THE ITALICS ARE KEPT AS AN ORACLE RATHER THAN A MECHANISM -- `--check` reports
where the derived lemma and the source's own italic run disagree. Every
disagreement measured so far is a real divergence between the two texts and
not a defect in the rule: the French Catechism glosses a `tu` Ave against the
appendix's `vous` Ave, the Spanish glosses `Llena de gracia` where the prayer
prints `llena eres de gracia`, and three editions open on `Ave, Maria
(Laetare, Maria)` where the parenthesis is the Catechism's own rendering note
and not part of the quotation. Refusing those is right.

WHY `raw/` FOR THE CATECHISM AND `build/` FOR THE COMPENDIUM. Not sloppiness,
and the asymmetry is the point: `ccc.{lang}/paragraphs.json` collapses `<br>`
to a space by the convention docs/corpus-schema.md states for CCC blocks, so
2676 is ONE undifferentiated run there and the boundary between one clause's
gloss and the next survives only on the page. That is the re-parse
docs/link-surface.md names as this project's insurance policy, and it is why
the tier-0 work is a parser rather than a query. The Compendium's quotation
marks survive its parse intact, so there is nothing to recover and reading the
raw PDF again would be work for its own sake.

EVERY NOTE CARRIES ITS OWN LOCUS, which is what makes one work per language
honest. The apparatus draws on two sources; a manifest can name only one set,
so provenance goes on the NOTE -- `{"work": "ccc", "n": 2676}` -- and the site
renders it as the note's label and links it. Stored typed rather than as the
string `CCC 2676`, because re-deriving a fact by parsing a string we wrote
ourselves is the shape the root CLAUDE.md warns about three times over.
"""

from __future__ import annotations

import argparse
import html as ihtml
import json
import re
import sys
import unicodedata
from datetime import UTC, datetime
from itertools import pairwise
from pathlib import Path
from typing import NamedTuple

sys.path.insert(0, str(Path(__file__).parent))

import common
from common import require_corpus, write_stamped_json

#: `commentary.{slug}.{lang}`, and the slug is the site's own Latin address
#: for the collection (`/preces`) rather than an author's name. Haydock's
#: slug is a person because that work IS one man's catena; this one is two
#: books of the magisterium read against a third text, and no person's name
#: would be true of it.
WORK_PREFIX = "commentary.preces"

#: CCC 2676-2677: the Ave Maria, clause by clause. The region is bounded by
#: the printed numbers 2676 and 2678 rather than by any structural marker,
#: because the eight editions share no markup and all eight print the number.
CCC_HAIL_MARY = {"slug": "hail-mary", "first": 2676, "last": 2678}

#: Compendium 578-598: the Our Father, from "what is its origin" to "what
#: does the final Amen mean". One numbering serves every edition -- that is
#: why the work is keyed by language and not by edition -- and the range is
#: asserted per edition rather than assumed.
COMPENDIUM_OUR_FATHER = {"slug": "our-father", "first": 578, "last": 598}

#: WHERE ELSE THE CORPUS SPEAKS OF THIS PRAYER -- the passages the page
#: offers as links under the text, and the reason the apparatus may drop
#: every note that quotes nothing. Each is a range, and every one of them is
#: checked against the corpus before it is written (`check_references`),
#: because a reference is a promise that something is there.
#:
#: THE THREE ARE NOT THE SAME KIND OF FACT AND ARE ALL VERIFIABLE. The
#: Catechism's and the Compendium's ranges are read off their own tables of
#: contents -- CCC 2759-2865 is the article `The Lord's Prayer`, and the
#: Compendium's 562-563 is the pair that names the Ave (`How does the Church
#: pray to Mary? Above all with the Hail Mary`). The scriptural ones are
#: where the prayer's words are printed as Scripture, which is the same
#: measurement that kept Haydock out of the apparatus: the Ave's first half
#: is Luke 1:28 and 1:42 and its second half is not Scripture at all, which
#: is why the verses are named one by one rather than as a span.
REFERENCES: dict[str, list[dict]] = {
    "hail-mary": [
        {"work": "bible", "osis": "luke", "chapter": 1, "first": 28, "last": 28},
        {"work": "bible", "osis": "luke", "chapter": 1, "first": 42, "last": 42},
        {"work": "ccc", "first": 2676, "last": 2677},
        {"work": "compendium", "first": 562, "last": 563},
    ],
    "our-father": [
        {"work": "bible", "osis": "matt", "chapter": 6, "first": 9, "last": 13},
        {"work": "bible", "osis": "luke", "chapter": 11, "first": 2, "last": 4},
        {"work": "ccc", "first": 2759, "last": 2865},
        {"work": "compendium", "first": 578, "last": 598},
    ],
}

#: A lemma has to be at least this many comparable characters and two words.
#: Both guards, because either alone admits junk that reads as a quotation:
#: the German 2676 opens `Du bist voll der Gnade`, whose prayer-matching
#: prefix is `Du bist` -- two words, six characters, and a coincidence.
MIN_LEMMA_CHARS = 8
MIN_LEMMA_WORDS = 2

#: Opening and closing quotation the sources set a lemma in, and the
#: punctuation that ends a headword. Trimmed from the STORED lemma only: the
#: anchoring ignores punctuation anyway, but a lemma is compared for length
#: and printed in the reports, and `Jojjon el a te Orszagod?` carries the
#: Compendium's question mark into a phrase the prayer states.
_OPENERS = "«“„‟‘\"'"
_CLOSERS = "»”’\"'"
_LEMMA_EDGES = " \t.,;:!?…" + _OPENERS + _CLOSERS

#: What the remark may not open with once its headword is cut away: the
#: closing half of the source's quotation, and whatever punctuation divided
#: the two. A colon in English, a guillemet and a full stop in Latin, a
#: semicolon in German -- taking them all is what lets one rule serve every
#: edition.
_TEXT_EDGES = _LEMMA_EDGES + "-—–"

#: A letter or digit in any script, and the elisions a lemma may not contain
#: -- `lemma.ts`'s `WORD` and `ELIDED`, which the site checks on the same
#: strings. Two definitions of "comparable" drift within a week.
_WORD_RE = re.compile(r"[^\W_]", re.UNICODE)
ELIDED_RE = re.compile(r"\.\.\.|…|\bec\.|\betc\.|&c\.")

#: `æ` and `œ` are LIGATURES, not accents, so no Unicode normal form takes
#: them apart -- `NFD("æ") == "æ"`. They have to be expanded by hand or the
#: Latin apparatus loses its lemmas mid-word: the curated Latin Ave ends
#: `in hora mortis nostræ` and the Catechism prints `nostrae`, so the longest
#: matching prefix stops at `nostr` and stores a lemma cut inside a word.
_LIGATURES = {"æ": "ae", "œ": "oe", "Æ": "AE", "Œ": "OE"}

_TAG_RE = re.compile(r"<[^>]+>")
_ITALIC_RE = re.compile(r"<i\b[^>]*>(.*?)</i>", re.DOTALL | re.IGNORECASE)
#: A `<p>` boundary or a `<br>`: between them these cut every edition's 2676
#: into its clause runs. English keeps the whole paragraph in one `<p>` and
#: breaks on `<br>`; the CMS mirrors give each clause its own `<p>`; German
#: does both and fuses its first clause into the lead-in, which is why it
#: yields one run fewer.
_RUN_SPLIT_RE = re.compile(r"(?i)</p\s*>|<br\s*/?>|<p\b[^>]*>")
#: A paragraph number the source prints at the head of a run -- dropped from
#: the note's text, since the note is not addressed by it.
_LEADING_NUMBER_RE = re.compile(r"^\s*\d{1,4}\s*\.?\s*")


def fold(text: str) -> tuple[str, list[int]]:
    """The comparable form of a string, with a map back into it.

    The site's `src/lib/lemma.ts` `fold` in Python, and the two must agree:
    this decides what gets STORED as a lemma and that decides where the mark
    is set. Punctuation and whitespace are dropped rather than normalised --
    an editor transcribing a headword differs from the text most often in
    exactly the matter that carries no words -- so `at[i]` is where the ith
    comparable character really sits and an offset survives the trip back.
    """
    out: list[str] = []
    at: list[int] = []
    for i, ch in enumerate(unicodedata.normalize("NFC", text)):
        c = "'" if ch in "‘’‛" else ch
        for piece in _LIGATURES.get(c, c):
            base = unicodedata.normalize("NFD", piece)[0]
            if base.isalnum():
                out.append(base.lower())
                at.append(i)
    return "".join(out), at


def plain(fragment: str) -> str:
    """HTML flattened to the text a reader sees."""
    return re.sub(r"\s+", " ", ihtml.unescape(_TAG_RE.sub(" ", fragment))).strip()


def printed_at(page: str, number: int) -> int | None:
    """Where the source PRINTS `number`, skipping any inside a tag.

    German's IntraText mirror names its anchors after the paragraph
    (`<A NAME=SL_4.1.2.2.0.2676 IXT=SL>`), so the first textual match is
    inside an attribute; slicing there leaves half a tag at each end of the
    region and `<[^>]+>` -- which needs both delimiters -- cannot remove it.
    """
    for m in re.finditer(rf"(?<![0-9]){number}(?![0-9])", page):
        if page.rfind(">", 0, m.start()) >= page.rfind("<", 0, m.start()):
            return m.start()
    return None


def ccc_page(lang: str) -> Path | None:
    """The raw page carrying the region, found rather than tabulated.

    Every mirror files the Catechism differently (`__P9F.HTM`,
    `p4s1c2a2_lt.htm`, `2650-2696_mg.html`), and a table of eight filenames
    is a table that goes stale the next time a mirror is re-captured. The
    page that prints 2676 and then 2678 is the page, and requiring both in
    order is what stops a table of contents matching.
    """
    directory = common.raw_root() / f"ccc-{lang}"
    if not directory.is_dir():
        return None
    for path in sorted(directory.iterdir()):
        if not path.is_file():
            continue
        try:
            page = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        first = printed_at(page, CCC_HAIL_MARY["first"])
        last = printed_at(page, CCC_HAIL_MARY["last"])
        if first is not None and last is not None and first < last:
            return path
    return None


def ccc_runs(page_html: str) -> list[tuple[str, str | None]]:
    """The region's runs as `(text, the source's own italic head)`."""
    first = printed_at(page_html, CCC_HAIL_MARY["first"])
    last = printed_at(page_html, CCC_HAIL_MARY["last"])
    if first is None or last is None or last <= first:
        return []
    region = re.sub(r"<[^>]*$", "", page_html[first:last])
    runs: list[tuple[str, str | None]] = []
    for part in _RUN_SPLIT_RE.split(region):
        text = _LEADING_NUMBER_RE.sub("", plain(part))
        if len(text) < 20:
            continue
        italic = _ITALIC_RE.search(part)
        runs.append((text, plain(italic.group(1)) if italic else None))
    return runs


class Quotation(NamedTuple):
    """A headword the source printed and the annotated prayer prints back.

    `at` and `length` are its position in the FOLDED prayer, which is the
    only coordinate the two texts share. They are what makes overlap
    detectable: two headwords that claim the same words are two spans that
    intersect, and nothing about the strings themselves says so.
    """

    lemma: str
    at: int
    length: int
    #: Where the headword ends in the run it opens. Meaningless for a lemma
    #: read out of the middle of a Compendium question, which is why it has
    #: a default rather than a value nobody may use.
    end: int = -1


class Comparable(NamedTuple):
    """A text with its folded form and the map back into it."""

    raw: str
    folded: str
    at: list[int]


def comparable(text: str) -> Comparable:
    folded, at = fold(text)
    return Comparable(text, folded, at)


def splits_word(text: str, at: int) -> bool:
    """Whether a boundary at `at` cuts a word in half.

    `commentary-anchors.ts`'s `splitsWord`, character for character, and the
    two HAVE to agree: this file decides what a lemma is, the site decides
    where it lands, and a boundary rule kept on one side only stores
    headwords the page then refuses. The French Ave is the case that proved
    it -- the Catechism glosses `prie pour nous` against an appendix that
    prints `priez`, and `prie` is a clean prefix of `priez` on the run's side
    of the comparison alone.
    """
    return (
        0 < at < len(text)
        and _WORD_RE.match(text[at - 1]) is not None
        and _WORD_RE.match(text[at]) is not None
    )


def find_quotation(needle: str, prayer: Comparable, start: int) -> int | None:
    """Where the prayer prints `needle` at or after `start`, whole-worded.

    AT OR AFTER, because the site reads the notes in one pass with a cursor
    and so must this: a headword found only BEFORE the last one is a headword
    the page will not find at all.
    """
    i = prayer.folded.find(needle, start)
    while i != -1:
        if not splits_word(prayer.raw, prayer.at[i]) and not splits_word(
            prayer.raw, prayer.at[i + len(needle) - 1] + 1
        ):
            return i
        i = prayer.folded.find(needle, i + 1)
    return None


def opening_quotation(run: str, prayer: Comparable, start: int) -> Quotation | None:
    """The longest prefix of `run` that `prayer` prints verbatim.

    THE OFFSET IS RETURNED BECAUSE THE NOTE MUST NOT REPEAT ITS OWN HEADWORD.
    A printed glossa sets the lemma and then the remark; the schema has a
    field for each, and `commentary.haydock.en` already stores them apart --
    its note at Luke 1:28 is headed `Hail, full of grace` and its text opens
    `by the greatest share of divine graces`. Storing the run whole would
    print the clause twice in one card.

    ENDING ON A WORD BOUNDARY IN BOTH TEXTS, which is not decoration. On the
    run's side, without it the Latin lemma stopped at `... in hora mortis
    nostr` (see `_LIGATURES` for the cause, since fixed, and this for why a
    cut like it can never be stored). On the prayer's side, without it the
    French stored `Sainte Marie, Mere de Dieu, prie` against an appendix that
    prints `priez` -- a headword the page then refused, silently, because
    `splitsWord` is checked there and was not checked here.
    """
    folded_run, run_at = fold(run)
    for k in range(len(folded_run), MIN_LEMMA_CHARS - 1, -1):
        end = run_at[k - 1] + 1
        if end < len(run) and run[end].isalnum():
            continue
        at = find_quotation(folded_run[:k], prayer, start)
        if at is None:
            continue
        lemma = run[:end].strip(_LEMMA_EDGES)
        if len(lemma.split()) < MIN_LEMMA_WORDS or ELIDED_RE.search(lemma):
            return None
        return Quotation(lemma, at, k, end)
    return None


def shorten(
    run: str, quotation: Quotation, length: int, prayer: Comparable
) -> Quotation | None:
    """`quotation` cut back to `length` folded characters, or nothing.

    Both word boundaries are asked again, and independently: the run and the
    prayer agree letter for letter over the match and about nothing else, so
    a cut that falls between words in one can fall inside a word in the other.
    """
    _, run_at = fold(run)
    while length >= MIN_LEMMA_CHARS:
        end = run_at[length - 1] + 1
        if (end >= len(run) or not run[end].isalnum()) and not splits_word(
            prayer.raw, prayer.at[quotation.at + length - 1] + 1
        ):
            lemma = run[:end].strip(_LEMMA_EDGES)
            if len(lemma.split()) >= MIN_LEMMA_WORDS and not ELIDED_RE.search(lemma):
                return Quotation(lemma, quotation.at, length, end)
        length -= 1
    return None


def resolve_overlaps(drafts: list[dict], prayer: Comparable) -> None:
    """No two headwords may claim the same words, in place.

    THE SOURCE OVERLAPS ITSELF AND THE PRAYER DOES NOT. CCC 2677 heads its
    two runs `Santa Maria, Mae de Deus, rogai por nos...` and `Rogai por nos,
    pecadores...`, which is a fair way to quote a prayer that prints the two
    as one continuous clause -- but the page anchors in one pass, so the
    first headword swallows the second's opening words and the second then
    anchors nowhere. English is the edition that does not do it (`Holy Mary,
    Mother of God`, then `Pray for us sinners`), which is why the miss was
    six editions wide and invisible in the one anybody reads first.

    The earlier headword yields, because the later one is where the source
    starts saying something new. Yielding is a CUT, never a search elsewhere:
    what is left is still a prefix of the run and still printed verbatim by
    the prayer.
    """
    quoted = [d for d in drafts if d["quotation"] is not None]
    for earlier, later in pairwise(quoted):
        first, second = earlier["quotation"], later["quotation"]
        if first.at + first.length <= second.at:
            continue
        earlier["quotation"] = shorten(
            earlier["body"], first, second.at - first.at, prayer
        )


#: An editorial parenthesis inside the source's own quotation of the lemma.
_PARENTHETICAL_RE = re.compile(r"\s*(\([^)]*\)|\[[^\]]*\])\s*")


def headword_end(run: str, end: int) -> int:
    """Where the source's own quotation of the lemma really ends.

    THE STORED LEMMA AND THE PRINTED HEADWORD ARE NOT THE SAME LENGTH, and
    everything here follows from that. The lemma stops where the prayer stops
    agreeing; the headword runs on to whatever the edition closes it with, and
    the remark begins after THAT. Cutting at the lemma instead left the
    Catechism's own words at the head of five editions' notes -- French opened
    a note `toi " : Les deux paroles`, English `[or Rejoice, Mary]: the
    greeting`, both of them the tail of a headword and neither of them a
    remark.

    A run that OPENS on a quotation closes on one, and that is the whole rule
    for the five editions that quote (pt, la, it, es, fr): the first closing
    glyph after the match ends the headword, whatever the prayer stopped
    printing and whatever parenthesis the Catechism added -- `« Ave, Maria
    (Laetare, Maria) »` is one headword, its parenthesis the edition's own
    rendering note. English and German quote nothing and need nothing: their
    headword ends where the lemma does, on a colon or a full stop that the
    text's own trim removes. The one exception is English's bracket, which is
    an editorial alternative rather than the start of the remark.
    """
    head = run.lstrip()[:1]
    if head and head in _OPENERS:
        closed = next((i for i in range(end, len(run)) if run[i] in _CLOSERS), None)
        if closed is not None:
            return closed + 1
        return end
    m = _PARENTHETICAL_RE.match(run, end)
    if m is not None and m.end() < len(run) and run[m.end()] in _CLOSERS + ":":
        return m.end() + 1
    return end


def quoted_phrase(question: str, prayer: Comparable, start: int) -> Quotation | None:
    """The petition a Compendium question quotes, if the prayer prints it.

    THE QUOTE GLYPHS ARE THE EDITION'S OWN and there are four pairs across
    the fourteen -- `"..."`, `«...»`, `,,...''` and the German `„..."`. A
    pattern that knows only the English pair reports de, hu, lt and ro as
    quoting nothing at all, which is how this file's first measurement was
    wrong by four editions.
    """
    best: Quotation | None = None
    for m in re.finditer(
        r"[\u201c\u201d\u201e\u201f«»\"]([^\u201c\u201d\u201e\u201f«»\"]{3,90}?)[\u201c\u201d\u201e\u201f«»\"]",
        question,
    ):
        candidate = m.group(1).strip(_LEMMA_EDGES)
        folded, _ = fold(candidate)
        if len(folded) < MIN_LEMMA_CHARS or len(candidate.split()) < MIN_LEMMA_WORDS:
            continue
        if ELIDED_RE.search(candidate):
            continue
        at = find_quotation(folded, prayer, start)
        if at is None:
            continue
        if best is None or len(folded) > best.length:
            best = Quotation(candidate, at, len(folded))
    return best


def work_dir(lang: str) -> Path:
    return common.build_root() / f"{WORK_PREFIX}.{lang}"


def read_manifest(work_id: str) -> dict | None:
    path = common.build_root() / work_id / "manifest.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def load_prayers(lang: str) -> dict[str, dict]:
    path = common.build_root() / f"prayer.common.{lang}" / "prayers.json"
    if not path.exists():
        return {}
    return {p["slug"]: p for p in json.loads(path.read_text(encoding="utf-8"))}


def annotated_text(prayer: dict) -> str:
    """The prayer as the edition PRINTS it -- what a lemma has to quote.

    The blocks and nothing else. A prayer's `latin` companion is a field on
    the vernacular entry, so a Portuguese reader has the Latin Ave on screen
    too; letting a lemma match against it would file a note quoting the Latin
    under a prayer whose own text does not contain those words, and the
    site -- which anchors against the rendered lines -- would then refuse it
    with nothing to say why. `prayer.common.la` carries the Latin in its own
    `blocks`, which is where the Latin apparatus gets its match.
    """
    return " ".join(b["text"] for b in prayer.get("blocks", []))


def ccc_notes(lang: str, prayer: dict) -> tuple[list[dict], list[tuple[str, str]], int]:
    """CCC 2676-2677 as notes on the Hail Mary, the italic disagreements, and
    how many runs were read to get them."""
    page = ccc_page(lang)
    if page is None:
        return [], [], 0
    text = comparable(annotated_text(prayer))
    # The paragraph a run belongs to: the region opens at 2676 and the second
    # printed number inside it starts 2677. Read off the run rather than
    # assumed, so a source that ever splits differently is not mis-cited.
    number = CCC_HAIL_MARY["first"]
    region_html = page.read_text(encoding="utf-8", errors="replace")
    first = printed_at(region_html, CCC_HAIL_MARY["first"])
    last = printed_at(region_html, CCC_HAIL_MARY["last"])
    region = re.sub(r"<[^>]*$", "", region_html[first:last])

    # TWO PASSES, BECAUSE ONE HEADWORD'S EXTENT DEPENDS ON THE NEXT ONE'S
    # START -- see `resolve_overlaps`. The first pass searches from just after
    # the previous headword's START rather than its end, which is what lets an
    # overlap be seen at all instead of silently costing the later note its
    # lemma.
    drafts: list[dict] = []
    search_from = 0
    for part in _RUN_SPLIT_RE.split(region):
        body = plain(part)
        if len(body) < 20:
            continue
        numbered = _LEADING_NUMBER_RE.match(body)
        if numbered:
            printed = numbered.group(0).strip(" .")
            if printed.isdigit():
                number = int(printed)
            body = body[numbered.end() :]
        found = opening_quotation(body, text, search_from)
        if found is not None:
            search_from = found.at + 1
        drafts.append(
            {"number": number, "body": body, "part": part, "quotation": found}
        )

    resolve_overlaps(drafts, text)

    notes: list[dict] = []
    disagreements: list[tuple[str, str]] = []
    for draft in drafts:
        body, found = draft["body"], draft["quotation"]
        lemma, remainder = None, None
        if found is not None:
            tail = body[headword_end(body, found.end) :].lstrip(_TEXT_EDGES)
            # A run that is nothing but its own headword is not a note: there
            # is no remark in it to read, and the paragraph it came from is
            # named in the prayer's references either way.
            if len(tail) >= 20:
                lemma, remainder = found.lemma, tail

        # THE SOURCE'S ITALICS ARE AN ORACLE, NOT THE MECHANISM -- see the
        # module docstring. An EMPTY italic run is markup rather than a
        # quotation (the French mirror sets `2676<i> </i>Ce double
        # mouvement`) and says nothing either way.
        if italic := _ITALIC_RE.search(draft["part"]):
            printed_lemma = plain(italic.group(1)).strip(_LEMMA_EDGES)
            folded_italic, _ = fold(printed_lemma)
            folded_lemma, _ = fold(lemma or "")
            if folded_italic and (
                not folded_lemma or folded_lemma not in folded_italic
            ):
                disagreements.append((printed_lemma, lemma or "(none)"))

        # NO LEMMA, NO NOTE, since 2026-09-05. A note that quotes nothing has
        # nowhere to sit but the foot of the prayer, and a foot-note on a
        # seven-line text is a paragraph of the Catechism reprinted beside a
        # prayer rather than a gloss ON it. What those paragraphs are is a
        # place to go and read them, which is `references`.
        if lemma is None or remainder is None:
            continue
        notes.append(
            {
                "lemma": lemma,
                "text": remainder,
                "locus": {"work": "ccc", "n": draft["number"]},
            }
        )
    return notes, disagreements, len(drafts)


def compendium_notes(lang: str, prayer: dict) -> tuple[list[dict], int]:
    """Compendium 578-598 as notes on the Our Father, and how many questions
    were read to get them."""
    path = common.build_root() / f"compendium.{lang}" / "questions.json"
    if not path.exists():
        return [], 0
    questions = {q["n"]: q for q in json.loads(path.read_text(encoding="utf-8"))}
    text = comparable(annotated_text(prayer))
    notes: list[dict] = []
    read = 0
    # The cursor the site keeps, kept here: the Compendium asks its questions
    # in the prayer's own order, so a petition is looked for at or after the
    # last one and `in heaven` cannot be found in `on earth as it is in
    # heaven` before it is found in `who art in heaven`.
    search_from = 0
    for n in range(COMPENDIUM_OUR_FATHER["first"], COMPENDIUM_OUR_FATHER["last"] + 1):
        question = questions.get(n)
        if question is None:
            raise RuntimeError(
                f"compendium.{lang}: question {n} is missing, and the Our "
                f"Father section is qq. {COMPENDIUM_OUR_FATHER['first']}-"
                f"{COMPENDIUM_OUR_FATHER['last']} in every edition -- one "
                "numbering serves them all"
            )
        blocks = question.get("answer_blocks") or []
        body = "\n\n".join(b["text"] for b in blocks if b.get("text"))
        if not body:
            continue
        read += 1
        found = quoted_phrase(question.get("question", ""), text, search_from)
        # No lemma, no note -- `ccc_notes` says why, and it bites hardest
        # here: eight of the twenty-one questions ask what the Our Father IS
        # rather than what one of its petitions means.
        if found is None:
            continue
        search_from = found.at + found.length
        notes.append(
            {
                "lemma": found.lemma,
                "text": body,
                "locus": {"work": "compendium", "n": n},
            }
        )
    return notes, read


def page_source(manifest: dict, page: Path) -> dict | None:
    """The source record for the page the notes were read off.

    The Catechism's manifest lists every page of the edition -- 375 of them
    in English -- and citing the first would name the front matter as the
    origin of a note on 2676. The raw filename is the URL's last segment,
    which is how `Fetcher` names what it stores, so the two can be paired.
    """
    from urllib.parse import unquote

    for source in manifest.get("sources") or []:
        url = source.get("url") or ""
        if unquote(url.rsplit("/", 1)[-1]) == page.name:
            return source
    return (manifest.get("sources") or [None])[0]


def compose(parts: list[str], separator: str) -> str:
    """Names joined, never invented.

    The apparatus draws on two books and needs one name; nothing published
    names the pair, and writing one here would put a title in fifteen
    languages nobody can check. So the two works' OWN names are joined --
    `CCC, Compêndio` -- which asserts only what the corpus already holds.
    """
    return separator.join(parts)


def numbered_units(work_id: str, filename: str) -> set[int] | None:
    """The unit numbers a work holds, or nothing where the work is absent."""
    path = common.build_root() / work_id / filename
    if not path.exists():
        return None
    return {u["n"] for u in json.loads(path.read_text(encoding="utf-8"))}


def bible_verses(lang: str, osis: str, chapter: int) -> set[int] | None:
    """One chapter's verse numbers in any Bible of this language."""
    for work in sorted(common.build_root().glob(f"bible.*.{lang}")):
        path = work / "books" / f"{osis}.json"
        if not path.exists():
            continue
        book = json.loads(path.read_text(encoding="utf-8"))
        found = next((c for c in book["chapters"] if c["n"] == chapter), None)
        if found is not None:
            return {v["n"] for v in found["verses"]}
    return None


def check_references(lang: str, slug: str, references: list[dict]) -> None:
    """That every reference names something the corpus actually holds.

    FATAL, like the slug check below and for the same reason one layer over:
    a reference is a promise that there is something to read at the other
    end, and a wrong number does not fail -- it renders as a link that lands
    on an empty page. Silence here means only that this language has no
    edition of the work to check against, which is the one honest way to
    skip.
    """
    for ref in references:
        if ref["work"] == "bible":
            held = bible_verses(lang, ref["osis"], ref["chapter"])
            where = f"{ref['osis']} {ref['chapter']}"
        elif ref["work"] == "ccc":
            held = numbered_units(f"ccc.{lang}", "paragraphs.json")
            where = f"ccc.{lang}"
        else:
            held = numbered_units(f"compendium.{lang}", "questions.json")
            where = f"compendium.{lang}"
        if held is None:
            continue
        absent = [n for n in (ref["first"], ref["last"]) if n not in held]
        if absent:
            raise RuntimeError(
                f"{WORK_PREFIX}.{lang}: the {slug} reference to {where} names "
                f"{', '.join(str(n) for n in absent)}, which is not there"
            )


def build(lang: str) -> tuple[dict | None, dict]:
    """One language's apparatus, and what it reached."""
    prayers = load_prayers(lang)
    stats = {
        "lang": lang,
        "read": 0,
        "notes": 0,
        "prayers": 0,
        "references": 0,
        "disagreements": [],
    }
    if not prayers:
        return None, stats

    entries: list[dict] = []
    contributors: list[tuple[str, dict]] = []

    hail_mary = prayers.get(CCC_HAIL_MARY["slug"])
    if hail_mary is not None:
        ccc = read_manifest(f"ccc.{lang}")
        page = ccc_page(lang)
        if ccc is not None and page is not None:
            notes, disagreements, read = ccc_notes(lang, hail_mary)
            stats["read"] += read
            stats["disagreements"] = disagreements
            if notes:
                entries.append({"slug": CCC_HAIL_MARY["slug"], "notes": notes})
                contributors.append((f"ccc.{lang}", ccc))

    our_father = prayers.get(COMPENDIUM_OUR_FATHER["slug"])
    if our_father is not None:
        compendium = read_manifest(f"compendium.{lang}")
        if compendium is not None:
            notes, read = compendium_notes(lang, our_father)
            stats["read"] += read
            if notes:
                entries.append({"slug": COMPENDIUM_OUR_FATHER["slug"], "notes": notes})
                contributors.append((f"compendium.{lang}", compendium))

    if not entries:
        return None, stats

    # THE ONE FATAL CHECK, and it is §Commentary's own: a note naming a unit
    # the annotated work does not have addresses nothing and renders beside
    # nothing, which is invisible on the page rather than loud.
    for entry in entries:
        if entry["slug"] not in prayers:
            raise RuntimeError(
                f"{WORK_PREFIX}.{lang}: no prayer `{entry['slug']}` in "
                f"prayer.common.{lang} -- the notes would address nothing"
            )
        # WHERE ELSE THE PRAYER IS SPOKEN OF, and the notes' own loci are not
        # it: a note cites the paragraph it IS, one per card, while these are
        # the whole of what the three books have on this prayer -- including
        # the twenty-one Compendium questions and the hundred CCC paragraphs
        # this apparatus does not reprint.
        references = [dict(ref) for ref in REFERENCES.get(entry["slug"], [])]
        check_references(lang, entry["slug"], references)
        if references:
            entry["references"] = references

    stats["prayers"] = len(entries)
    stats["notes"] = sum(len(e["notes"]) for e in entries)
    stats["references"] = sum(len(e.get("references") or []) for e in entries)
    return {"entries": entries, "contributors": contributors}, stats


def manifest_for(lang: str, doc: dict, generated_at: str) -> dict:
    contributors = doc["contributors"]
    sources = []
    for work_id, manifest in contributors:
        if work_id.startswith("ccc."):
            page = ccc_page(lang)
            record = page_source(manifest, page) if page else None
        else:
            record = (manifest.get("sources") or [None])[0]
        if record:
            sources.append(record)
    holder = next(
        (m["copyright"]["holder"] for _, m in contributors if m.get("copyright")),
        "Libreria Editrice Vaticana",
    )
    notice = next(
        (m["copyright"]["notice"] for _, m in contributors if m.get("copyright")),
        None,
    )
    named = [m.get("title", "") for _, m in contributors]
    short = [m.get("short_title") or m.get("title", "") for _, m in contributors]
    return {
        "id": f"{WORK_PREFIX}.{lang}",
        "type": "commentary",
        "title": compose(named, " · "),
        "short_title": compose(short, ", "),
        "language": lang,
        "annotates": f"prayer.common.{lang}",
        # THE SECOND UNIT SPACE, and the field exists so the sync can branch
        # before it touches the filesystem. Deriving it from the annotated
        # work's own type would make the answer depend on which manifest has
        # been read yet, which is an ordering dependency for a fact that is
        # simply true of this work.
        "addresses": "prayer",
        "sources": sources,
        "copyright": {
            "status": "copyrighted",
            "holder": holder,
            "notice": notice,
        },
        # THE APPARATUS IS ON UNLESS THE READER TURNS IT OFF, which no other
        # commentary in the corpus is. Haydock's default is off because he is
        # 23 MB and nobody opening a chapter asked for a catena; this is tens
        # of kilobytes, it is the only apparatus a prayer page has, and it
        # reaches two prayers of thirty-five -- so a reader who never opens
        # the panel would never learn it exists. Stated in the manifest and
        # not inferred by the site from `addresses`, on `subsumes_notes`'s
        # precedent: which way a default points is a fact about the work.
        "default_on": True,
        "notes": (
            "The Catechism of the Catholic Church and its Compendium read as "
            "a commentary on the common prayers: CCC 2676-2677, which glosses "
            "the Ave Maria clause by clause, and the Compendium's questions "
            "on the Our Father, one per petition. Neither was written as an "
            "apparatus to a prayer book; both quote the prayer's own words at "
            "the head of what they say about them, which is what makes the "
            "notes placeable. A note's `lemma` is the longest opening run of "
            "that note which this edition of the prayer prints verbatim, so "
            "every headword is a quotation of the annotated text -- and a "
            "note whose source glosses a different wording, or glosses the "
            "prayer as a whole rather than one of its clauses, is not kept. "
            "What those paragraphs and questions are is named instead in each "
            "prayer's `references`, which is where the two books' whole "
            "treatment of it can be read. Each note cites the paragraph or "
            "question it is."
        ),
        "generated_at": generated_at,
        "prayers": [e["slug"] for e in doc["entries"]],
    }


def write_output(lang: str, doc: dict, generated_at: str) -> None:
    write_stamped_json(
        work_dir(lang),
        {
            "manifest.json": manifest_for(lang, doc, generated_at),
            "prayers.json": doc["entries"],
        },
        generated_at,
    )


def languages() -> list[str]:
    """Every language with a prayer collection -- the works this can annotate.

    Derived, never listed: a table here would go stale the next time the
    curation gains an edition, and the answer is knowable. A language with no
    Catechism and no Compendium simply produces no work.
    """
    root = common.build_root()
    prefix = "prayer.common."
    return sorted(
        d.name[len(prefix) :]
        for d in root.iterdir()
        if d.is_dir() and d.name.startswith(prefix)
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lang", action="append", help="restrict to these languages")
    parser.add_argument(
        "--check",
        action="store_true",
        help="report where the derived lemma and the source's italics disagree",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="report and write nothing"
    )
    args = parser.parse_args()

    require_corpus()
    generated_at = datetime.now(UTC).isoformat(timespec="seconds")

    wanted = set(args.lang or []) or None
    rows: list[dict] = []
    written = 0
    for lang in languages():
        if wanted and lang not in wanted:
            continue
        doc, stats = build(lang)
        rows.append(stats)
        if doc and not args.dry_run:
            write_output(lang, doc, generated_at)
            written += 1

    print(f"{WORK_PREFIX}.* — the Catechism and the Compendium on the prayers\n")
    # `read` is every run of 2676-2677 and every question of 578-598 this
    # edition holds; `kept` is those that quote a clause of the prayer. The
    # gap is not a miss rate -- it is how much of the two books is about the
    # prayer as a whole rather than about one of its lines, and that share is
    # what the references carry instead.
    print(f"  {'lang':6} {'prayers':>7} {'read':>5} {'kept':>5} {'refs':>5}")
    total_read = total_kept = 0
    for row in rows:
        if row["read"] == 0:
            continue
        total_read += row["read"]
        total_kept += row["notes"]
        share = row["notes"] * 100 // row["read"]
        print(
            f"  {row['lang']:6} {row['prayers']:>7} {row['read']:>5} "
            f"{row['notes']:>5} {row['references']:>5}  {share:>3}%"
        )
    empty = [r["lang"] for r in rows if r["read"] == 0]
    share = total_kept * 100 // total_read if total_read else 0
    print(
        f"\n  {'total':6} {'':>7} {total_read:>5} {total_kept:>5} {'':>5}  {share:>3}%"
    )
    if empty:
        print(f"\n  no source in: {', '.join(empty)}")

    if args.check:
        print(
            "\nWhere the derived lemma and the source's own italics disagree.\n"
            "Every one measured so far is a real divergence between the two\n"
            "texts, not a defect in the derivation — read the pair before\n"
            "changing anything.\n"
        )
        for row in rows:
            for printed_lemma, derived in row["disagreements"]:
                print(f"  {row['lang']:4} italic {printed_lemma[:60]!r}")
                print(f"       {'':4} lemma  {derived[:60]!r}")

    if args.dry_run:
        print("\n--dry-run: nothing written.")
    else:
        print(f"\n  {written} work(s) written to {common.build_root()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
