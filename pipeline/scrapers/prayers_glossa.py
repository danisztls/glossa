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
from pathlib import Path

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

#: A lemma has to be at least this many comparable characters and two words.
#: Both guards, because either alone admits junk that reads as a quotation:
#: the German 2676 opens `Du bist voll der Gnade`, whose prayer-matching
#: prefix is `Du bist` -- two words, six characters, and a coincidence.
MIN_LEMMA_CHARS = 8
MIN_LEMMA_WORDS = 2

#: Opening and closing quotation the sources set a lemma in. Trimmed from the
#: STORED lemma only: the anchoring ignores punctuation anyway, but the site
#: prints this string as the note's headword and a stray guillemet there is
#: the source's typesetting leaking into our own.
_QUOTES = " \t«»“”„‟‘’'\"«»"

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


def opening_quotation(run: str, prayer: str) -> tuple[str, int] | None:
    """The longest prefix of `run` that `prayer` prints verbatim, and where
    it ends.

    THE OFFSET IS RETURNED BECAUSE THE NOTE MUST NOT REPEAT ITS OWN HEADWORD.
    A printed glossa sets the lemma and then the remark; the schema has a
    field for each, and `commentary.haydock.en` already stores them apart --
    its note at Luke 1:28 is headed `Hail, full of grace` and its text opens
    `by the greatest share of divine graces`. Storing the run whole would
    print the clause twice in one card.

    ENDING ON A WORD BOUNDARY, which is not decoration: without it the Latin
    lemma stopped at `... in hora mortis nostr` (see `_LIGATURES` for the
    cause that has since been fixed, and this for why a cut like it can never
    be stored). A headword that ends inside a word is wrong twice over -- it
    reads as a transcription error and it marks a span the source did not
    name.
    """
    folded_run, at = fold(run)
    folded_prayer, _ = fold(prayer)
    length = 0
    for k in range(len(folded_run), MIN_LEMMA_CHARS - 1, -1):
        if folded_run[:k] in folded_prayer:
            length = k
            break
    while length >= MIN_LEMMA_CHARS:
        end = at[length - 1] + 1
        if end >= len(run) or not run[end].isalnum():
            lemma = run[:end].strip(_QUOTES)
            if len(lemma.split()) >= MIN_LEMMA_WORDS:
                return lemma, end
            return None
        length -= 1
    return None


#: An editorial parenthesis inside the source's own quotation of the lemma,
#: and the closing quote after it.
_PARENTHETICAL_RE = re.compile(r"\s*(\([^)]*\)|\[[^\]]*\])\s*")


def close_quotation(run: str, end: int) -> int:
    """Where the source's quotation of the lemma really ends.

    Three editions print `« Ave, Maria (Laetare, Maria) »` -- the prayer says
    only `Ave, Maria`, so the derived lemma stops there and the remark would
    open on `(Laetare, Maria) ». Gabrielis...`, carrying the closing
    guillemet of a quotation whose opening one is already gone. The
    parenthesis is the Catechism's own rendering note and belongs INSIDE the
    quotation, so where a closing quote follows it the cut moves past both.

    Not where it does not: English prints `Hail Mary [or Rejoice, Mary]: the
    greeting`, whose bracket is followed by a colon and is the first thing
    the note says. The closing quote is the whole discriminator.
    """
    m = _PARENTHETICAL_RE.match(run, end)
    if m is None:
        return end
    after = m.end()
    if after < len(run) and run[after] in "»”’\"'":
        return after + 1
    return end


def quoted_phrase(question: str, prayer: str) -> str | None:
    """The petition a Compendium question quotes, if the prayer prints it.

    THE QUOTE GLYPHS ARE THE EDITION'S OWN and there are four pairs across
    the fourteen -- `"..."`, `«...»`, `,,...''` and the German `„..."`. A
    pattern that knows only the English pair reports de, hu, lt and ro as
    quoting nothing at all, which is how this file's first measurement was
    wrong by four editions.
    """
    best: str | None = None
    folded_prayer, _ = fold(prayer)
    for m in re.finditer(r"[“”„‟«»\"»]([^“”„‟«»\"]{3,90}?)[“”„‟«»\"«]", question):
        candidate = m.group(1).strip(_QUOTES)
        folded, _ = fold(candidate)
        if len(folded) < MIN_LEMMA_CHARS or len(candidate.split()) < MIN_LEMMA_WORDS:
            continue
        if folded in folded_prayer and (
            best is None or len(folded) > len(fold(best)[0])
        ):
            best = candidate
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


def ccc_notes(lang: str, prayer: dict) -> tuple[list[dict], list[tuple[str, str]]]:
    """CCC 2676-2677 as notes on the Hail Mary, plus the italic disagreements."""
    page = ccc_page(lang)
    if page is None:
        return [], []
    text = annotated_text(prayer)
    notes: list[dict] = []
    disagreements: list[tuple[str, str]] = []
    # The paragraph a run belongs to: the region opens at 2676 and the second
    # printed number inside it starts 2677. Read off the run rather than
    # assumed, so a source that ever splits differently is not mis-cited.
    number = CCC_HAIL_MARY["first"]
    region_html = page.read_text(encoding="utf-8", errors="replace")
    first = printed_at(region_html, CCC_HAIL_MARY["first"])
    last = printed_at(region_html, CCC_HAIL_MARY["last"])
    region = re.sub(r"<[^>]*$", "", region_html[first:last])
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

        lemma, remainder = None, body
        found = opening_quotation(body, text)
        if found is not None:
            candidate, end = found
            # The delimiter between headword and remark is the source's own
            # and differs in every edition -- a colon in English, a closing
            # guillemet and a full stop in Latin, nothing but a full stop in
            # German. Taking whatever punctuation follows the quotation is
            # what lets one rule serve all of them.
            tail = body[close_quotation(body, end) :].lstrip(_QUOTES + ".:;,-—– ")
            # A run that is nothing but its own headword keeps its text and
            # loses the field: a note with no remark in it is not a note.
            if len(tail) >= 20:
                lemma, remainder = candidate, tail

        # THE SOURCE'S ITALICS ARE AN ORACLE, NOT THE MECHANISM -- see the
        # module docstring. An EMPTY italic run is markup rather than a
        # quotation (the French mirror sets `2676<i> </i>Ce double
        # mouvement`) and says nothing either way.
        if italic := _ITALIC_RE.search(part):
            printed_lemma = plain(italic.group(1)).strip(_QUOTES)
            folded_italic, _ = fold(printed_lemma)
            folded_lemma, _ = fold(lemma or "")
            if folded_italic and (
                not folded_lemma or folded_lemma not in folded_italic
            ):
                disagreements.append((printed_lemma, lemma or "(none)"))

        note: dict = {}
        if lemma:
            note["lemma"] = lemma
        note["text"] = remainder
        note["locus"] = {"work": "ccc", "n": number}
        notes.append(note)
    return notes, disagreements


def compendium_notes(lang: str, prayer: dict) -> list[dict]:
    """Compendium 578-598 as notes on the Our Father."""
    path = common.build_root() / f"compendium.{lang}" / "questions.json"
    if not path.exists():
        return []
    questions = {q["n"]: q for q in json.loads(path.read_text(encoding="utf-8"))}
    text = annotated_text(prayer)
    notes: list[dict] = []
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
        note: dict = {}
        lemma = quoted_phrase(question.get("question", ""), text)
        if lemma:
            note["lemma"] = lemma
        note["text"] = body
        note["locus"] = {"work": "compendium", "n": n}
        notes.append(note)
    return notes


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


def build(lang: str) -> tuple[dict | None, dict]:
    """One language's apparatus, and what it reached."""
    prayers = load_prayers(lang)
    stats = {
        "lang": lang,
        "notes": 0,
        "anchored": 0,
        "prayers": 0,
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
            notes, disagreements = ccc_notes(lang, hail_mary)
            if notes:
                entries.append({"slug": CCC_HAIL_MARY["slug"], "notes": notes})
                contributors.append((f"ccc.{lang}", ccc))
                stats["disagreements"] = disagreements

    our_father = prayers.get(COMPENDIUM_OUR_FATHER["slug"])
    if our_father is not None:
        compendium = read_manifest(f"compendium.{lang}")
        if compendium is not None:
            notes = compendium_notes(lang, our_father)
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

    stats["prayers"] = len(entries)
    stats["notes"] = sum(len(e["notes"]) for e in entries)
    stats["anchored"] = sum(1 for e in entries for n in e["notes"] if n.get("lemma"))
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
        "notes": (
            "The Catechism of the Catholic Church and its Compendium read as "
            "a commentary on the common prayers: CCC 2676-2677, which glosses "
            "the Ave Maria clause by clause, and the Compendium's questions "
            "on the Our Father, one per petition. Neither was written as an "
            "apparatus to a prayer book; both quote the prayer's own words at "
            "the head of what they say about them, which is what makes the "
            "notes placeable. A note's `lemma` is the longest opening run of "
            "that note which this edition of the prayer prints verbatim, so "
            "every headword is a quotation of the annotated text and a note "
            "whose source glosses a different wording carries none. Each note "
            "cites the paragraph or question it is."
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
    print(f"  {'lang':6} {'prayers':>7} {'notes':>6} {'anchored':>9}")
    total_notes = total_anchored = 0
    for row in rows:
        if row["notes"] == 0:
            continue
        total_notes += row["notes"]
        total_anchored += row["anchored"]
        share = row["anchored"] * 100 // row["notes"]
        print(
            f"  {row['lang']:6} {row['prayers']:>7} {row['notes']:>6} "
            f"{row['anchored']:>6} {share:>3}%"
        )
    empty = [r["lang"] for r in rows if r["notes"] == 0]
    share = total_anchored * 100 // total_notes if total_notes else 0
    print(f"\n  {'total':6} {'':>7} {total_notes:>6} {total_anchored:>6} {share:>3}%")
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
