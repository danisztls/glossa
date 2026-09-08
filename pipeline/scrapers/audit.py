#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Corpus audits that compare `raw/` against `build/` -- the checks that ask
whether the parse still represents the page it came from.

WHY THIS EXISTS. The project already has two oracles and neither can see a
dropped block:

  - the **round-trip** check (`vatican_docs.validate_document`) compares a
    block's `html` against its own text. It is a statement about one block,
    so a block that never became a block is outside its universe.
  - **cross-language symmetry** (`check-symmetry`) compares section-number
    SETS between editions. `humanae-vitae.pt` has 31 sections and so does its
    English sibling, so symmetry passes -- while 22.7% of the Portuguese
    text is absent, because the loss is inside the sections, not between them.

`mortalium-animos.pt` is the case that makes the point sharpest: 19 sections
against the English edition's 13, so the count asymmetry points the WRONG WAY,
and half the text is missing. Nothing we had could report that.

The check here is deliberately crude and therefore hard to fool: take the text
of the page's body region, take the text of everything we stored from it, and
divide. It cannot say what was lost or why. It says how much.

WHY IT IS NOT A CLEAN PASS/FAIL. Coverage never reaches 100% legitimately --
`body_region` is split from the footnote region by a sniffed boundary, and
where that sniff misses, real footnote text counts against the body. So a
90%-band reading is a research lead, not a verdict. Only the floor is gated
(`--min-coverage`, default 50%), where no boundary error explains the gap.

The second audit has no such softness: a manifest that says PARSER DEFEATED
while the work is absent from `site/unpublished.json` is a work whose own
parser reported failure and which we publish anyway. That is exactly what
`unpublished.json`'s header calls dishonest, and it is an exact comparison,
so it gates.

THE THIRD AUDIT, `toc`, is not a measurement but a comparison against read
evidence. A person or agent reads the document's raw page and writes down the
headings it actually prints, into `<corpus>/oracles/toc/<work-id>.json`; this
compares that against `structure.json`. Heading levels are a best-effort
reading of loose source formatting and parsing alone was never expected to be
sufficient (`docs/research/description-pass-2026-08.md`), so the oracle is the
only thing that can say the parser got them wrong. Storing it turns a one-off
reading into a regression check that survives every future parser change.

THE FOURTH AUDIT, `balance`, is cross-language symmetry asking about SIZE
rather than membership. `check-symmetry` compares which unit numbers exist;
this compares how much text each one holds against the same unit in the
sibling edition, normalized by that pair's own median ratio so a language
being habitually terser than another says nothing. It exists because the
Compendium proved the set comparison vacuous there: both editions are
questions 1-598 by construction, so the sets can never disagree, and four
English answers were missing their entire enumeration -- 16 bulleted items
the parser walked straight past -- while the check reported symmetry. Run
against the corpus as it stood, those four questions were the only ones
outside the band, at 0.13-0.41x; the fifth-worst sat at 0.77x, and the
work's whole range was 0.13-1.49x.

WHERE IT DOES NOT APPLY is the DOCUMENTS, established by measuring rather
than by assumption. A section number is not the same section in both
editions: `mediator-dei` EN section 23 is PT sections 21-22; the numbering
drifts wherever a translation splits or joins a paragraph, and
`check-symmetry` passes because both editions have the same COUNT. Comparing
8,942 units across the 103 EN/PT document pairs put 650 of them outside the
band -- 7.3%, against one unit in 6,154 for the types kept -- and the ones
inspected were all drift. Document truncation is what `coverage` above is
for, and it is the better instrument: it needs no sibling edition and says
how much was lost.

THE BIBLE WAS OUT FOR THAT REASON AND IS BACK, and what changed is the
number of witnesses rather than anybody's mind. The exclusion was measured
over the two editions there were: 95 outliers in 35,743 verses (cpdv.en
against clementina.la), concentrated in Esther, which is the documented
versification divergence and not a defect (docs/research/bible-edition-
divergence.md). Two editions can disagree about verse shape and cannot tell
you which of them is speaking. Nine can, and the corpus now holds nine.

The precondition a document cannot meet, Scripture does meet at the CHAPTER:
where two editions divide a chapter into the same verse numbers, verse 3 is
the same verse, and where they do not, `comparable_units` skips it rather
than widening a band to swallow it. Requiring that took the unanimous leads
from 405 to 113, and what it took out was the divergence -- Esther, the
Song, the Psalms' titles, Crampon's Hebrew versification. What it left
includes `bible.matos-soares.pt` storing Lamentations 5:5 as a single full
stop, `bible.straubinger.es` holding 1 Kings 1:2 inside 1:1 with its printed
number still in the prose, and `bible.clementina.la` at Daniel 3:88 stopping
where all eight others continue.

It reports and never fails, the same footing as the Summa's cross-language
oracle -- but unlike that one, its findings have not all been the edition
speaking. Its first run produced four, and three were defects it was the
only thing that could see: `ccc.en` ¶2051 had swallowed the Ten Commandments
table (14.9x), `ccc.en` ¶2436 was missing the opening sentence the mirror
never printed (0.49x), and `summa.en` III q. 26 a. 2 had a 5,150-character
editorial note stored as the continuation of `ad 3` (2.35x). All three were
fixed on 2026-08-25 (pipeline/docs/oracles.md).

WHAT A BAND CANNOT DO, A COUNT CAN. Gating is still not offered -- the band
that would clear `ccc.en` ¶230, which prints its Augustine citation inline
where the Portuguese footnotes it, is wide enough to have missed ¶2436
anyway. What replaced it is the vote in `measure_balance`: a lead is a unit
where one edition sits outside the band against EVERY other edition
comparable there, and the report ranks by how many that is. Sorting by it
put `ccc.de` ¶2265, which stops two sentences before every other edition
does, and `ccc.mg` ¶1589, which has lost the Nazianzen quotation from
between its own two, at the top of a list they had been in unread.

READ IT DIRECTIONALLY, as `divisions` below says at more length. An edition
alone in one book or one chapter is that edition's own division; one
scattered across the corpus is the parser.

THE FIFTH AUDIT, `divisions`, is cross-language symmetry asking about the
STRUCTURE TREE rather than about units at all -- and it exists because the
other four are all per-unit, so a division that never got built is outside
every one of their universes.

`check-symmetry` compares which unit numbers exist and `balance` compares how
much text each holds; both are blind to whether the work's own divisions came
out the same shape. Where the address space is fixed that blindness is total:
the CCC is paragraphs 1-2865 in every edition by construction, so the sets
agree no matter what happens to the headings above them.

The Catechism's eight editions landed on 2026-08-26 and this is what they
bought. English carried 59 in-brief divisions where Portuguese, German and
Malagasy each carried 81 and agreed on which 81 -- a gap a year old, invisible
to everything else, and two defects underneath it: 21 of the 22 were the
parser (whole pages of the English mirror set every heading in plain type, and
only bold blocks were read as headings), and the 22nd was a real source
omission at §984, now supplied by a `heading_html` correction against the
three editions that print it. The same run recovered a Portuguese sub-heading
swallowed since the first ingestion.

READ IT DIRECTIONALLY, which is the whole skill in using it. An edition doing
something the others do not, consistently and everywhere, is that edition
speaking: English prints two of the CCC's divisions as articles where the
other seven print them as sub-headings, and the unnumbered run-in headings are
bold in four mirrors and plain in the rest, so `ccc.es` has several hundred
`sub` nodes and `ccc.en` has two. An edition missing what all the others have,
in scattered places, is a parser. So this reports only the kinds whose count
is a property of the work (`part`, `section`, `chapter`, `article`,
`in-brief`) and never `sub`, and it ranks by how many editions agree against
the odd one out.

It reports and never fails, for the same reason `balance` does not: the band
that would clear the legitimate divergences is wide enough to have missed the
finding.

THE SIXTH AUDIT, `refs`, is the same idea applied to the one apparatus that is
not written in any language: the Catechism paragraph numbers each Compendium
question prints beside itself. Question N is the same question in all fourteen
editions, so those numbers are not fourteen translations of an assertion, they
are fourteen copies of it -- and a copy can simply be wrong.

That is what lets this one vote where `balance` and `divisions` may only rank.
Both of those compare things an edition is entitled to differ about, so the
strongest they can say is "an edition alone against the rest is a lead". Here
thirteen editions reading 1198-1199 where the Italian reads `1198-1999` is not
a difference of convention, and the modal set is an oracle.

READ THE SHAPE, NOT THE COUNT. Sets are classified by how they stand to the
modal one, and the classes mean different things:

  - **subset / superset** is the edition, when it is consistent. The German
    prints only the first of the two ranges at 170 of 598 questions and its
    own raw page says so at each; the Slovenian prints a wider apparatus at
    82. Neither is a defect and a report that led with counts would bury
    everything else under them.
  - **overlap / disjoint** is a misprint. No convention produces a set that
    crosses the others without containing them. All four the Italian carries
    are in its raw HTML verbatim (`1198-1999`, `2617; 2018`, `2658`, `620`),
    and the Portuguese prints `971` at three consecutive questions where the
    other thirteen read 891, 893 and 971.
  - **shifted** is a displaced PAIR -- a swap, or a run -- and it is reported
    separately because it names a different culprit: an apparatus read
    correctly and attached to the wrong unit. A lone set that merely happens
    to equal a neighbour's is NOT one, which was learned by checking: of the
    17 a match-a-neighbour test flagged, 14 sit in the right slot on their own
    raw page. The German exchanging questions 248 and 249 is the only real
    one in the corpus.
  - **silent** is a question where we stored no apparatus and the others did.
    It is the only class that is a straight recall number.

WHY THE CATECHISM IS NOT HERE, given that it is the other work with eight
editions and would seem the obvious second candidate: it has no apparatus of
addresses. Its `related` field is the right shape and is empty in all 22,920
paragraphs of all eight editions, because the mirrors do not print the margin
apparatus at all. Its `citations` are prose in the edition's own language, and
three of the eight fold them into the sentence rather than footnoting them, so
a cross-edition count measures the convention. There is one comparison there
worth making and it is narrower than this; docs/research/ccc-citation-
apparatus.md records it and the measurements behind it.

THE SEVENTH AUDIT, `apparatus`, is the first to look at the magisterial
documents' FOOTNOTES, and it is three questions rather than one because they
share a walk and nothing else: RECALL is about our parser, SERIES is
arithmetic on the source, and the VOTE is the source judged by its own
translations. They are reported together so that a note missing from an
edition and a misprint inside one are never read as the same kind of thing.

Nothing had ever looked here. `coverage` cuts the page at `fn_start` and
`stored_text_len` counts no citations, so the apparatus is outside its
universe by construction on both sides of the division; `balance` and
`divisions` are per-unit and per-heading. The corpus stores 92,519 citations
and 24,154 notes that the source prints are in none of them.

RECALL IS TWO EXACT MEASURES AND NO HEURISTIC, which took a wrong turn first
and is the part worth reading. The obvious check is a hole in the marker run
1..N, and it cannot be made honest: a stray `(302)` in prose is stored as
marker 302, Vatican II restarts its numbering per chapter, and the run's end
therefore has to be guessed. Both halves can be asked exactly instead, by
reading the source's own footnote list with the parser's own reader --

  - **empty** is a stored citation whose marker reached no note.
  - **unreached** is a note in the source's list that no citation carries.

-- and the two are not degrees of one failure, they are opposite ones.
`list-unread` is 123 editions whose markers were all found and whose footnote
LIST was not, so the apparatus is a set of markers pointing at nothing
(`vatii.gaudium-et-spes.la`, 345 of them). `markers-unread` is 97 editions
where the list was read whole and not one marker matched
(`exhortation.vita-consecrata.la` stores 0 citations against 427 notes; its
template sniffed as `sup` where the body prints `(N)`, and only the
Portuguese edition of that document has an apparatus at all). `partial` is
the remaining 199, and it is the smallest of the three at 1,698 notes.
NEITHER MEASURE NEEDS A SIBLING EDITION, which is why this reaches the 19
documents the corpus holds in a single language and the 36 whose apparatus
survives in one edition only.

SERIES IS THE ONLY CHECK IN THIS FILE THAT CONVICTS WITHOUT A SECOND
EDITION. A volume of the Acta is its year minus a constant, so
`AAS 63 (1971)` carries its own proof and `AAS 38 (1991)` -- which is
`Centesimus annus`, AAS 83, the Slovenian edition having copied the section
number printed immediately before it -- is impossible on its face. The
constants are DERIVED and not looked up: 98.71% of the corpus's 19,782 AAS
references satisfy `volume == year - 1908` and the exceptions are
transpositions. Acta Sanctae Sedis takes its own offset and ceased in 1908,
so an ASS reference to a later year is the other series' name misspelled,
which is 45 of the 304 findings.

READ THE COLUMN, NOT THE ROW -- the same rule `refs` states for a subset.
The French Vatican II edition prints the CITED document's paragraph number
where the volume goes (`Lumen gentium : AAS 2 (1965), p. 5-6` is LG 2) at 33
of its 76 references. That is the edition speaking, and a report that ranked
individual references rather than editions would have opened with it.

THE VOTE IS THE SUPPLEMENT HERE AND NOT THE INSTRUMENT, which is the exact
inverse of `refs`, and the reason is a precondition rather than a preference.
There the fourteen editions were fourteen copies of one apparatus; here they
are different apparatus -- `ad-caeli-reginam` prints 53 notes in Italian, 62
in Latin and 63 in Portuguese and English, the Portuguese splitting the
Latin's last note in two -- so footnote k is only footnote k where the marker
sets are identical, which is 24 of 271 documents -- 15 of them with anything
to report. 62% of the corpus's series references are in documents it can
never reach.

What it adds is the PAGE, which arithmetic cannot judge: `AAS 95 (2003),
47-48` where seven editions read 447-448. Its shapes are classified for the
same reason `refs` classifies sets -- an edition that cites the first page of
a range rather than the range prints a NARROWER span consistently, and the
Byelorussian does it ten times out of ten, which is a convention and would
otherwise have been a fifth of the leads.

THE EIGHTH AUDIT, `trees`, is `divisions` for the documents, which `divisions`
cannot read at all: a document's `structure.json` is a flat array of
`{level, title, before}` with no `kind` to count, so every document edition in
the corpus is outside that check's universe by construction.

`docs/research/document-structure-defects.md` §2 asked for it by name and said
why. `check-symmetry` compares section-number sets, so `fratelli-tutti` passed
it with 287 sections on both sides while one edition found eight chapters and
the other found none. The trees are what the sidebar contents renders and what
`static/route-titles.json` publishes as each division's paragraph span, so a
wrong tree is served to consumers that never render the page.

WHAT IT COMPARES IS THE ANCHOR, because that is the only part of a heading two
editions share: the title is in a different language in each and the level is
compacted against its own document, while `before` is the publisher's own
paragraph number. An edition whose outline has one anchor or none is the
trivial single-node tree, and it is reported without being consulted -- an
edition that found nothing is not a witness that there is nothing.

DEPTH IS COMPARED AS A STEP AND NOT AS A LEVEL. Levels are compacted to a
contiguous 1..N per document, so an edition carrying one tier its siblings do
not shifts every node below it; comparing levels directly reported 184
disagreements for `csdc.en` where the fact was one extra tier.

AND IT RANKS WITHOUT ADJUDICATING, which is the whole skill in reading it.
`evangelii-nuntiandi.en` looks exactly like a parse failure at 1 heading
against a peer median of 82, and is not one: its mirror contains six bold runs
in the entire document. `familiaris-consortio.la` prints no sub-headings at
all. Both were settled by reading the raw page, and nothing in the measurement
could have settled either.

  ./audit.py coverage            # ranked table, worst first
  ./audit.py withheld            # marker vs unpublished.json
  ./audit.py toc                 # parsed structure vs the read oracle
  ./audit.py balance             # cross-language text-length symmetry
  ./audit.py divisions           # cross-language structure-tree symmetry
  ./audit.py trees               # the documents' outlines, compared by anchor
  ./audit.py refs                # cross-language reference-apparatus symmetry
  ./audit.py apparatus           # the documents' footnotes: recall, arithmetic, vote
  ./audit.py all                 # all eight; exit 1 if any gates
"""

from __future__ import annotations

import argparse
import collections
import itertools
import json
import re
import statistics
import sys
from pathlib import Path

import common
import vatican_docs as V

REPO_ROOT = Path(__file__).resolve().parents[2]
UNPUBLISHED = REPO_ROOT / "site" / "unpublished.json"

# Below this, no footnote-boundary misdetection explains the gap: the document
# is truncated. The 6 works withheld by hand all measure 0.0%, which is what
# calibrates it -- see docs/research/description-pass-2026-08.md.
DEFAULT_MIN_COVERAGE = 0.50

DEFEAT_MARKER = "PARSER DEFEATED"


def split_region(html: str) -> tuple[str, str]:
    """The document's body and its footnote list, delimited exactly as
    `parse_document` delimits them.

    Kept in step with `parse_document` by copying its shell sniff rather than
    calling it: the parser raises on stub pages and does a great deal of work
    we do not want here. If the two ever drift, coverage reads low across the
    board rather than subtly -- the failure is loud.

    Both halves are returned from one function because two audits now need
    opposite sides of the same cut, and a second copy of the sniff is a second
    thing to keep in step. The footnote half is empty when no boundary was
    found at all, which is a real state and not an error: some pages print no
    apparatus, and on some the boundary sniff is defeated -- `apparatus` is
    what tells those two apart.
    """
    html = V.strip_transparent_spans(html)
    testo = re.search(r'class="testo"', html)
    if testo:
        end = re.search(r"/TESTO", html[testo.start() :], re.IGNORECASE)
        # After the opening tag, matching `parse_document` -- see the note
        # there on why starting at the attribute mattered.
        tag_end = html.find(">", testo.start())
        start = tag_end + 1 if tag_end != -1 else testo.start()
        region = html[start : testo.start() + end.start()] if end else html[start:]
    else:
        region = html[V.find_content_start_old_shell(html) :]
    fn_start, _evidence = V.find_footnote_region_start(region)
    if fn_start is None:
        return region, ""
    return region[:fn_start], region[fn_start:]


def body_region(html: str) -> str:
    return split_region(html)[0]


def stored_text_len(work: Path) -> int:
    """Text we kept from the body: section blocks, the appendix, the structure
    tree, and the masthead.

    Headings count. The parser lifts a heading out of the prose and into
    `structure.json`, so charging it as missing would report every correctly
    parsed document as lossy.

    `manifest.header` counts for the same reason, and the omission was caught
    the hard way: when `extract_document_header` began working on modern-shell
    pages, 14 works "regressed" by up to 2.6pp purely because their masthead
    moved out of a counted field into an uncounted one. Nothing was lost. A
    coverage metric that ignores one of the three places body text is stored
    reports relocation as loss.
    """
    total = 0
    manifest = work / "manifest.json"
    if manifest.exists():
        header = json.loads(manifest.read_text()).get("header") or ""
        total += len(V.strip_tags(header))
    sections = json.loads((work / "sections.json").read_text())
    for section in sections:
        for block in section["blocks"]:
            total += len(V.strip_tags(block.get("html", "")))
    appendix = work / "appendix.json"
    if appendix.exists():
        # A fourth place body text is stored, added 2026-08-24: matter the
        # source prints with no number on it. Eight editions in this corpus
        # are numbered nowhere at all and are ENTIRELY appendix, so leaving
        # this out reported them at 0-6% coverage while their whole text sat
        # on disk.
        for unit in json.loads(appendix.read_text()):
            total += len(unit.get("title") or "")
            for block in unit["blocks"]:
                total += len(V.strip_tags(block.get("html", "")))
    structure = json.loads((work / "structure.json").read_text())
    for node in structure:
        for field in ("label", "title", "subtitle"):
            total += len(node.get(field) or "")
    return total


def raw_pages(corpus: Path) -> dict[str, Path]:
    """Work id -> raw page, for the document works only.

    `raw/vatican-docs` names files `<family>__<slug>__<lang>.html`, and the
    `index__*` listing pages are not works.
    """
    out = {}
    for path in sorted((corpus / "raw" / "vatican-docs").glob("*.html")):
        parts = path.stem.split("__")
        if len(parts) != 3 or parts[0] == "index":
            continue
        family, slug, lang = parts
        out[f"{family}.{slug}.{lang}"] = path
    return out


def measure(corpus: Path) -> list[dict]:
    rows = []
    for work_id, page in raw_pages(corpus).items():
        work = common.build_root(corpus) / work_id
        if not (work / "sections.json").exists():
            # An untranslated-edition probe: fetched, found to be a stub, and
            # never parsed. Absence of a translation is legitimate and common
            # (CLAUDE.md), so this is not a finding.
            continue
        raw = page.read_text(encoding="utf-8", errors="replace")
        body_len = len(V.strip_tags(body_region(raw)))
        if body_len < V.STUB_CONTENT_MIN_CHARS:
            continue
        stored = stored_text_len(work)
        rows.append(
            {
                "work": work_id,
                "coverage": stored / body_len,
                "body": body_len,
                "stored": stored,
                "sections": len(json.loads((work / "sections.json").read_text())),
                "nodes": len(json.loads((work / "structure.json").read_text())),
                "defeated": DEFEAT_MARKER
                in (
                    json.loads((work / "manifest.json").read_text()).get("notes") or ""
                ),
            }
        )
    rows.sort(key=lambda r: r["coverage"])
    return rows


def read_toc_oracles(corpus: Path) -> dict[str, list[dict]]:
    """Hand-read tables of contents, keyed by work id.

    Lives in the corpus repo rather than this one because its content is
    verbatim heading text from the source documents, which is the reason the
    corpus is private (pipeline/docs/corpus.md).
    """
    root = common.oracles_root(corpus) / "toc"
    if not root.exists():
        return {}
    out = {}
    for path in sorted(root.glob("*.json")):
        out[path.stem] = json.loads(path.read_text())
    return out


def compare_toc(
    read: list[dict],
    parsed: list[dict],
    masthead: set[str] = frozenset(),
    corrections: list[dict] = (),
) -> list[str]:
    """Differences between a read ToC and the parsed structure tree.

    Titles are compared on normalized text: the parser splits a heading into
    `label`/`title`/`subtitle` where it can, and a reader writing the oracle
    should not have to guess that split, so both sides are flattened first.

    CORRECTIONS ARE APPLIED TO THE READ SIDE. The oracle records what the PAGE
    prints and the corpus holds the page as corrected, so wherever a
    correction is filed the two must differ -- and reporting that as a
    difference would be reporting the corrections layer working. Ecclesiam
    Suam EN prints a heading `Modem Bent of Mind`; the reader wrote that down,
    correctly, and `pipeline/corrections/` turns it into `Modern`. Applying
    the same `from`/`to` to the read title is what keeps the oracle a faithful
    record of the page instead of a copy of our output.
    """
    edits = [
        (c["from"], c["to"])
        for c in corrections
        if c.get("field") == "raw_text" and c.get("from") and c.get("to")
    ]

    def corrected(text: str) -> str:
        for src, dst in edits:
            # The filed strings carry the source's markup around the words;
            # a heading title has none by the time it reaches the oracle, so
            # match on the visible text of each side.
            src_text = V.strip_tags(src).strip()
            dst_text = V.strip_tags(dst).strip()
            if src_text and src_text in text:
                text = text.replace(src_text, dst_text)
        return text

    def flat(node):
        joined = " ".join(
            (node.get(f) or "").strip() for f in ("label", "title", "subtitle")
        )
        return re.sub(r"\s+", " ", corrected(joined)).strip().casefold()

    problems = []
    read_by, parsed_by = {}, {}
    for node in read:
        read_by.setdefault(flat(node), []).append(node)
    for node in parsed:
        title = flat(node)
        # Every work gets a structure node for its own title, as a fallback
        # top node. It is a masthead, not a division, and the oracle records
        # divisions -- so counting it as EXTRA would make every genuinely
        # undivided work disagree with its own correct oracle, forever.
        if title in masthead or (
            not parsed_by and any(m and title.startswith(m + " ") for m in masthead)
        ):
            # The manifest title comes from the URL slug and is often a
            # truncation of what the page actually prints: `ecclesiam.en` is
            # titled "Ecclesiam" and its masthead reads "ECCLESIAM SUAM". The
            # prefix rule applies only to the FIRST parsed node, where a
            # masthead is the only thing that can sit.
            continue
        parsed_by.setdefault(title, []).append(node)

    for title in read_by:
        if title not in parsed_by:
            node = read_by[title][0]
            problems.append(
                f"MISSING  before={node.get('before')}  {node.get('title')!r}"
            )
    for title in parsed_by:
        if title not in read_by:
            node = parsed_by[title][0]
            problems.append(
                f"EXTRA    before={node.get('before')}  {node.get('title')!r}"
            )
    # A WHOLE-TREE OFFSET IS ONE FINDING, NOT FIFTY. A reader numbers the
    # document's top division 1; the parser ranks by observed typography and
    # may start at 2, so every level differs by a constant. Reporting each
    # separately buried the five real findings in `dilexit-nos.en` under
    # fifty rows of the same fact. The modal delta is reported once, and only
    # nodes deviating from it are called out -- those are the real anomalies.
    deltas: collections.Counter = collections.Counter()
    for title, nodes in read_by.items():
        for want, got in zip(nodes, parsed_by.get(title, ()), strict=False):
            if want.get("level") is not None and got.get("level") is not None:
                deltas[got["level"] - want["level"]] += 1
    offset = deltas.most_common(1)[0][0] if deltas else 0
    if offset and len(deltas) == 1:
        problems.append(
            f"OFFSET   every matched heading is parsed {offset:+d} level(s) -- one finding"
        )
    elif offset:
        problems.append(
            f"OFFSET   most headings are parsed {offset:+d} level(s); outliers below"
        )

    # EVERY OCCURRENCE, NOT THE FIRST. A document may print the same heading
    # twice -- Quadragesimo Anno PT has a level-3 `Rem\u00e9dios` under
    # `Despotismo econ\u00f3mico` and a level-2 `REM\u00c9DIOS` under `Reforma dos
    # costumes`, which casefold to one key. Comparing `[0]` against `[0]` left
    # the second pair unchecked in both directions and reported nothing, so a
    # real defect could hide behind a repeated title. The two lists are in
    # document order, so pairing them positionally is the reading a person
    # would make; a length mismatch is itself the finding.
    for title, nodes in read_by.items():
        if title not in parsed_by:
            continue
        seen = parsed_by[title]
        if len(seen) != len(nodes):
            problems.append(
                f"COUNT    {nodes[0].get('title')!r}: read {len(nodes)}x, parsed {len(seen)}x"
            )
        for want, got in zip(nodes, seen, strict=False):
            if want.get("level") is None or got.get("level") is None:
                continue
            if got["level"] - want["level"] != offset:
                problems.append(
                    f"LEVEL    {want.get('title')!r}: read {want['level']}, "
                    f"parsed {got['level']} (others {offset:+d})"
                )
            if want.get("before") is not None and want["before"] != got.get("before"):
                problems.append(
                    f"POSITION {want.get('title')!r}: read before \u00a7{want['before']}, "
                    f"parsed before \u00a7{got.get('before')}"
                )
    return problems


def check_numbering_flag(corpus: Path, work_id: str, oracle: dict) -> list[str]:
    """`numbered: false` must agree with the edition it describes.

    `before` is the number of the first numbered paragraph after a heading,
    and eight editions in this corpus print no numbers at all -- their whole
    text lives in `appendix.json`, and every heading's `before` is null. Null
    already meant something else, though: "this heading is trailing matter the
    numbered flow never reaches" (docs/corpus-schema.md). A reader could not
    tell the two apart, and both readers who wrote an oracle for an unnumbered
    edition raised it unprompted.

    So the file says which it is, and this checks the claim rather than
    trusting it -- an undeclared flag is as easy to get wrong as an undeclared
    null. A declared `numbered: false` whose oracle still carries a `before`
    is a contradiction; an edition with no sections whose oracle stays silent
    is the ambiguity this field exists to remove."""
    problems = []
    declared = oracle.get("numbered", True)
    sections = common.build_root(corpus) / work_id / "sections.json"
    has_sections = sections.exists() and bool(json.loads(sections.read_text()))
    if declared is False:
        stray = [
            h.get("title") for h in oracle["headings"] if h.get("before") is not None
        ]
        if stray:
            problems.append(
                f"NUMBERING oracle declares `numbered: false` but {len(stray)} "
                f"heading(s) carry a `before`: {', '.join(repr(t) for t in stray[:3])}"
            )
        if has_sections:
            problems.append(
                "NUMBERING oracle declares `numbered: false` but the work has "
                "numbered sections"
            )
    elif not has_sections:
        problems.append(
            "NUMBERING work has no numbered sections; its oracle should declare "
            "`numbered: false` so a null `before` is not read as trailing matter"
        )
    return problems


def report_toc(corpus: Path) -> int:
    oracles = read_toc_oracles(corpus)
    if not oracles:
        print("No ToC oracles yet (<corpus>/oracles/toc/). Nothing to compare.")
        return 0
    failing = 0
    for work_id, oracle in sorted(oracles.items()):
        read = oracle["headings"]
        structure = common.build_root(corpus) / work_id / "structure.json"
        if not structure.exists():
            print(f"{work_id}: oracle present but no structure.json")
            failing += 1
            continue
        manifest = json.loads(
            (common.build_root(corpus) / work_id / "manifest.json").read_text()
        )
        masthead = {
            re.sub(r"\s+", " ", (manifest.get(f) or "")).strip().casefold()
            for f in ("title", "short_title")
        } - {""}
        problems = compare_toc(
            read,
            json.loads(structure.read_text()),
            masthead,
            common.load_corrections(work_id),
        )
        problems += check_numbering_flag(corpus, work_id, oracle)
        if problems:
            failing += 1
            print(
                f"\n{work_id}: {len(problems)} difference(s), {len(read)} headings read"
            )
            for line in problems:
                print(f"  {line}")
    print(f"\n{len(oracles)} oracle(s) compared, {failing} disagreeing with the parse.")
    # Not gated. A disagreement is a finding to triage -- usually a parser fix
    # for a whole class of documents -- not a reason to block a build.
    return 0


def withheld_ids() -> set[str]:
    data = json.loads(UNPUBLISHED.read_text())
    return set(data.get("works", {}))


def report_coverage(rows: list[dict], floor: float, limit: int) -> int:
    withheld = withheld_ids()
    median = statistics.median(r["coverage"] for r in rows)
    print(f"{len(rows)} works measured, median coverage {median * 100:.1f}%\n")
    bands = [
        (0, 0.5, "<50%"),
        (0.5, 0.8, "50-80%"),
        (0.8, 0.9, "80-90%"),
        (0.9, 0.95, "90-95%"),
        (0.95, 9, ">=95%"),
    ]
    for lo, hi, label in bands:
        n = sum(1 for r in rows if lo <= r["coverage"] < hi)
        print(f"  {label:8} {n:4}")

    print(f"\n{'work':44} {'cov':>6} {'body':>8} {'secs':>5} {'nodes':>5}  flags")
    for row in rows[:limit]:
        flags = []
        if row["work"] in withheld:
            flags.append("withheld")
        if row["defeated"]:
            flags.append("defeated")
        print(
            f"{row['work']:44} {row['coverage'] * 100:5.1f}% {row['body']:8,} "
            f"{row['sections']:5} {row['nodes']:5}  {' '.join(flags)}"
        )

    failures = [r for r in rows if r["coverage"] < floor and r["work"] not in withheld]
    if failures:
        print(
            f"\nFAIL: {len(failures)} published work(s) below {floor * 100:.0f}% coverage:"
        )
        for row in failures:
            print(f"  {row['work']}  {row['coverage'] * 100:.1f}%")
        return 1
    print(f"\nOK: every published work is at or above {floor * 100:.0f}% coverage.")
    return 0


def report_withheld(rows: list[dict]) -> int:
    withheld = withheld_ids()
    defeated = {r["work"] for r in rows if r["defeated"]}
    published_defeats = sorted(defeated - withheld)
    print(
        f"{len(defeated)} work(s) marked {DEFEAT_MARKER!r}; {len(withheld)} withheld.\n"
    )
    if published_defeats:
        print(
            f"FAIL: {len(published_defeats)} work(s) report a defeated parse and are published:"
        )
        by_id = {r["work"]: r for r in rows}
        for work_id in published_defeats:
            row = by_id[work_id]
            print(
                f"  {work_id:44} {row['coverage'] * 100:5.1f}% coverage, {row['sections']} sections"
            )
        return 1
    print("OK: every defeated parse is withheld.")
    # Not gated in reverse: a work may be withheld for reasons the parser has
    # no marker for (rights, or a defect found by eye), so withheld-but-not-
    # defeated is expected and says nothing.
    return 0


# --------------------------------------------------------------------------
# Cross-language balance
# --------------------------------------------------------------------------

#: Work types whose unit number means the same thing in every edition, which
#: is the whole precondition for comparing unit against unit. See the module
#: docstring for what was measured to leave `document` out. The Bible meets
#: the precondition only inside a chapter both editions divide the same way,
#: which `comparable_units` is what enforces.
BALANCE_TYPES = ("bible", "catechism", "compendium", "prayer", "summa")

#: Below this many shared units a median ratio is not a norm, it is an
#: opinion. It also drops `prayer.common.en-gb` (five prayers, a regional
#: variant of a handful of texts) without naming it.
BALANCE_MIN_UNITS = 20

#: Reporting band, in multiples of the pair's own median ratio. Calibrated
#: against what the corpus actually holds: with the three defects of
#: 2026-08-25 repaired, every remaining unit across the CCC, the Compendium,
#: the prayers and the Summa sits inside [0.53, 2.12], and the defects had
#: sat at 0.13, 0.14, 0.24, 0.41, 0.49, 2.35 and 14.9.
BALANCE_LOW, BALANCE_HIGH = 0.5, 2.0


def unit_texts(work: Path, work_type: str) -> dict | None:
    """Addressable unit -> all the text stored under it, or None when the
    type is one this audit does not compare.

    The key is whatever the edition is addressed by, which differs per type:
    a paragraph number, a question number, a prayer slug, a Summa
    part/question/article triple, a Bible book/chapter/verse triple. It is
    compared for equality and nothing else, so its shape only has to be
    stable across editions."""
    if work_type == "bible":
        # The books are read off disk rather than off `manifest.books`, for
        # the same reason `divisions` reads the tree rather than a count: a
        # book listed and not written is exactly the kind of loss this audit
        # is looking for, and a manifest-driven walk would raise on it
        # instead of reporting it.
        return {
            (book["osis"], chapter["n"], verse["n"]): verse.get("text") or ""
            for path in sorted((work / "books").glob("*.json"))
            for book in (json.loads(path.read_text()),)
            for chapter in book["chapters"]
            for verse in chapter["verses"]
        }
    if work_type == "catechism":
        return {
            p["n"]: p.get("text") or ""
            for p in json.loads((work / "paragraphs.json").read_text())
        }
    if work_type == "compendium":
        return {
            q["n"]: q["question"]
            + " "
            + " ".join(b["text"] for b in q["answer_blocks"])
            for q in json.loads((work / "questions.json").read_text())
        }
    if work_type == "prayer":
        # The Rosary keeps its mysteries in `groups`, not `blocks`, and in
        # the vernacular editions only. Counting blocks alone made it the
        # single worst-skewed prayer in the collection -- a finding about
        # this function rather than about the corpus.
        #
        # `instructions` is here for the same reason and was missing for it:
        # five more blocks the Rosary alone carries, from the Joyful
        # Mysteries page, present in both vernacular editions. Their absence
        # never skewed the ratio -- both sides lost the same text -- which is
        # exactly what made it worth fixing: a parser that dropped the
        # directions in ONE language would have been invisible here, and the
        # Compendium's four unnumbered enumerations are what this audit exists
        # to have caught.
        return {
            p["slug"]: " ".join(
                [p.get("title") or "", p.get("rubric") or ""]
                + [b.get("text") or "" for b in p["blocks"]]
                + [
                    item.get("title", "") + " " + item.get("meditation", "")
                    for group in (p.get("groups") or [])
                    for item in group["items"]
                ]
                + [
                    b.get("text") or ""
                    for b in (p.get("instructions") or {}).get("blocks", [])
                ]
            )
            for p in json.loads((work / "prayers.json").read_text())
        }
    if work_type == "summa":
        # Note this reads `questions.json` as the Compendium does and means
        # something entirely different by it -- which is why the dispatch is
        # on the manifest's `type` and never on which files are present.
        out = {}
        for q in json.loads((work / "questions.json").read_text()):
            for article in q["articles"]:
                out[(q["part"], q["n"], article["n"])] = " ".join(
                    V.strip_tags(block.get("html") or "")
                    for division in article["divisions"]
                    # `preamble` and `postscript` are the English edition's
                    # own editorial matter and are outside the citable set
                    # (docs/corpus-schema.md). The Latin edition has neither,
                    # so counting them measures how much the translator wrote,
                    # which is not what this check is asking.
                    if division["kind"] not in ("preamble", "postscript")
                    for block in division["blocks"]
                )
        return out
    return None


def edition_key(work_id: str, work_type: str) -> tuple[str, str]:
    """`(work, edition)` split off a work id -- where the EDITION is what the
    corpus addresses one published text by, and that is not always the
    language.

    Every type but one holds at most one edition per language, so the
    language tag identifies the edition and the split is the last
    dot-component: `ccc.pt`, `prayer.common.en-gb`. The Bible is the
    exception the schema allows (corpus-schema.md), and it is not a corner
    case here -- `bible.cpdv.en` and `bible.douay-rheims.en` are two English
    editions of one base, and it is precisely their disagreeing that makes a
    reading the English tradition's habit rather than one translator's. So a
    Bible id splits after its first component and its edition key carries
    both slug and language."""
    if work_type == "bible":
        base, _, edition = work_id.partition(".")
        return base, edition
    base, _, lang = work_id.rpartition(".")
    return base, lang


def language_groups(
    corpus: Path,
    types: tuple[str, ...] = BALANCE_TYPES,
    min_editions: int = 2,
) -> dict[str, dict[str, Path]]:
    """`base work id -> {edition key: work directory}`, split by
    `edition_key`.

    `types` defaults to the comparable ones because every caller but
    `apparatus` is a cross-language check and `document` is exactly what
    those cannot compare. `bible` is in that default and reaches only
    `balance`: `divisions` reads a `structure.json` no Bible has and skips
    it, and `refs` tests the type itself. `min_editions` is 1 for the two
    apparatus checks that convict an edition on its own evidence -- a
    grouping that drops single-edition works is right for a comparison and
    silently wrong for an audit that does not need a comparison."""
    groups: dict[str, dict[str, Path]] = collections.defaultdict(dict)
    for work in sorted((common.build_root(corpus)).iterdir()):
        manifest = work / "manifest.json"
        if not work.is_dir() or not manifest.exists():
            continue
        work_type = json.loads(manifest.read_text()).get("type")
        if work_type not in types:
            continue
        if (work / "witnesses.json").exists():
            # A DERIVED edition: built from the other editions of this same
            # work rather than from a source of its own (today, exactly
            # `prayer.common.la`, which holds the 21 of 28 prayers the
            # Compendium prints Latin for). corpus-schema.md already narrows
            # the slug-set oracle away from it for being a subset by
            # construction, and length is the same story -- the Latin
            # Rosary has no mysteries because the source prints none, which
            # is a fact about the source and not a finding about anything.
            continue
        base, edition = edition_key(work.name, work_type)
        if base and edition:
            groups[base][edition] = work
    return {base: langs for base, langs in groups.items() if len(langs) >= min_editions}


def comparable_units(work_type: str, a_texts: dict, b_texts: dict) -> set | None:
    """The units of `a` whose number names the same text in `b`, or None when
    the whole address space qualifies and nothing has to be excluded.

    THE BIBLE IS THE ONE TYPE THAT NEEDS THIS, and it is why the audit could
    not take it before. Everywhere else the address space is fixed by
    construction -- the CCC is paragraphs 1-2865 in every edition -- so a
    unit number is the same unit or the check has nothing to stand on.
    Scripture's is fixed only down to the chapter: where two editions divide
    a chapter into a different number of verses, verse 3 is different words
    in each, and the ratio measures the division rather than the parse. The
    verse-number set is the exact test for that, so it is the precondition
    rather than a band widened to swallow the consequences.

    It is the same cut that keeps `document` out entirely, made where the
    Bible offers what a document cannot: a division whose sets can be
    compared. Measured over the nine editions, requiring it dropped the
    unanimous leads from 405 to 113, and what it dropped was the documented
    divergence -- Esther, the Song, the Psalms' titles, Crampon's Hebrew
    versification (docs/research/bible-edition-divergence.md)."""
    if work_type != "bible":
        return None
    chapters: dict[tuple, set] = collections.defaultdict(set)
    theirs: dict[tuple, set] = collections.defaultdict(set)
    for book, chapter, verse in a_texts:
        chapters[(book, chapter)].add(verse)
    for book, chapter, verse in b_texts:
        theirs[(book, chapter)].add(verse)
    agree = {c for c, verses in chapters.items() if verses == theirs.get(c)}
    return {k for k in a_texts if (k[0], k[1]) in agree}


def balance_pair(a_texts: dict, b_texts: dict, work_type: str) -> dict | None:
    """One edition pair measured: the median length ratio between them, and
    every unit whose own ratio departs from it.

    A unit one side stores empty is left out of the ratios rather than given
    an infinite one -- it is the same finding at its limit, and the one shape
    where the number would say nothing. `measure_balance` reports it per WORK,
    with membership, because both are facts about the work and neither gains
    anything from being restated once per pair."""
    universe = comparable_units(work_type, a_texts, b_texts)
    a_keys = [k for k in a_texts if universe is None or k in universe]
    b_keys = [k for k in b_texts if universe is None or k in universe]
    shared = [k for k in a_keys if k in b_texts]
    both = [k for k in shared if a_texts[k] and b_texts[k]]
    if len(both) < BALANCE_MIN_UNITS:
        return None
    ratios = {k: len(a_texts[k]) / len(b_texts[k]) for k in both}
    median = statistics.median(ratios.values())
    rows = sorted(
        ((r / median, k, len(a_texts[k]), len(b_texts[k])) for k, r in ratios.items()),
        key=lambda row: row[0],
    )
    return {
        "shared": len(shared),
        "compared": len(both),
        # The units behind that count, which `measure_balance` needs to give
        # the vote a per-unit denominator and pops before the row is kept:
        # 36 Bible pairs carry 1.2 million of them and no reader wants one.
        "compared_keys": both,
        "median": median,
        # Units the precondition excluded, counted and not listed: where they
        # exist they are thousands, and what divides differently is a
        # question for `edition_check.py`, which asks it chapter by chapter
        # against the Clementine.
        "incomparable": 0 if universe is None else len(a_texts) - len(universe),
        # Counted here and named per WORK rather than per pair: which units an
        # edition lacks is one fact about the work, and 91 prayer pairs
        # restated it 91 times.
        "only_a": len([k for k in a_keys if k not in b_texts]),
        "only_b": len([k for k in b_keys if k not in a_texts]),
        "outliers": [r for r in rows if r[0] < BALANCE_LOW or r[0] > BALANCE_HIGH],
        "range": (rows[0][0], rows[-1][0]),
    }


#: How much of a lead's own shortfall the units beside it have to carry before
#: the text counts as having moved rather than gone, and how little before it
#: counts as gone. Wide apart on purpose: what falls between them is the pile
#: a person reads, and a threshold that empties that pile is a threshold that
#: has stopped measuring anything.
NEIGHBOURHOOD_MOVED, NEIGHBOURHOOD_ABSENT = 0.75, 0.25

#: Below this many characters an anomaly is too small to divide by: the
#: quotient swings wildly on a unit whose expected and stored lengths differ
#: by a word.
NEIGHBOURHOOD_MIN_CHARS = 20


def unit_neighbours(unit) -> tuple | None:
    """The two units either side of `unit`, or None where the type does not
    number its units in a sequence.

    A prayer's slug is the one key that has no neighbour: the collection is a
    set of named texts and the prayer before `anima-christi` is whichever one
    sorts there. Every other key ends in a number inside a container -- a
    verse in its chapter, an article in its question, a paragraph in the whole
    work -- and the container is the key with that number taken off."""
    if isinstance(unit, bool):  # `True + 1` is 2, and nothing here is a flag
        return None
    if isinstance(unit, int):
        return (unit - 1, unit + 1)
    if isinstance(unit, (list, tuple)) and isinstance(unit[-1], int):
        head, n = tuple(unit[:-1]), unit[-1]
        return ((*head, n - 1), (*head, n + 1))
    return None


def neighbourhood_verdict(
    texts: dict[str, dict], medians: dict[tuple[str, str], float], edition: str, unit
) -> str | None:
    """Whether the text a lead is missing (or holding) is in the units beside
    it: `moved`, `absent`, or `mixed`.

    THE QUESTION A LENGTH RATIO CANNOT ANSWER ON ITS OWN. An edition alone at
    one unit has either divided the text differently from its siblings or lost
    it, and those are opposite findings with opposite remedies -- the first is
    a row for `divergence.py`'s `SILENT`, the second is a parse defect. What
    separates them is one unit either side: `matos-soares.pt` at 1 Corinthians
    9:9 holds a third of what the others do because it pulled a clause up into
    its v8, so the THREE verses together balance; a verse that simply stopped
    early leaves the window short as well.

    MEASURED AS A FRACTION OF THE ANOMALY, not as a second band. A window is
    three units wide, so asking only whether it falls inside `[0.5, 2.0]`
    dilutes a small loss into two ordinary neighbours: `matos-soares.pt`
    stores Lamentations 5:5 as a single full stop and its window balances
    perfectly. What is asked instead is how much of the unit's own shortfall
    the window still carries. Against each witness, the unit's expected length
    is what that witness holds times the pair's median, so the shortfall is a
    number of characters and the window's shortfall is the same number summed
    over three units -- `recovered` is one minus their quotient, and it is 1
    where the neighbours hold every character the unit gave up and 0 where
    nothing near it does.

    So `moved` is `recovered >= 0.75` against every witness and `absent` is
    `<= 0.25` against every one; `mixed` is everything else, and mixed is the
    pile to read. Nothing shorter than reading the passage separates a
    re-partition a neighbour half-absorbs from a loss beside a long verse.

    None where the type numbers no sequence (`unit_neighbours`), or where no
    witness could be compared."""
    keys = unit_neighbours(unit)
    if keys is None or edition not in texts:
        return None
    window = (unit, *keys)
    recovered = []
    for other, units in texts.items():
        if other == edition:
            continue
        pair = (edition, other) if edition < other else (other, edition)
        median = medians.get(pair)
        if median is None:
            continue
        # `medians` is keyed in sorted order and holds `len(a)/len(b)`, so a
        # witness's length is scaled into this edition's own by the median or
        # by its reciprocal, depending which side of the pair this edition is.
        factor = median if edition < other else 1 / median

        def gap(where, units=units, factor=factor) -> float:
            return sum(
                len(units.get(k) or "") * factor - len(texts[edition].get(k) or "")
                for k in where
            )

        own = gap((unit,))
        if abs(own) < NEIGHBOURHOOD_MIN_CHARS:
            continue
        recovered.append(1 - gap(window) / own)
    if not recovered:
        return None
    if all(r >= NEIGHBOURHOOD_MOVED for r in recovered):
        return "moved"
    if all(r <= NEIGHBOURHOOD_ABSENT for r in recovered):
        return "absent"
    return "mixed"


def measure_balance(corpus: Path) -> dict:
    """`{"pairs": [...], "leads": [...]}` -- the all-pairs measurement, and
    that measurement read as a vote.

    WHY THE FINDINGS ARE NOT THE PAIRS. The measurement is quadratic and what
    a person reads must not be: nine Bible editions are 36 pairs, so one bad
    verse arrives as eight rows sorted eight places apart, in a list nobody
    reaches the end of. The Catechism was already that shape at nine editions
    -- `ccc.de` §2158 is one paragraph reported eight times.

    A LEAD IS AN EDITION ALONE AGAINST EVERY OTHER ONE COMPARABLE AT THAT
    UNIT, and the denominator is per unit rather than per work because
    comparability is: a chapter Crampon divides its own way costs that verse
    a witness, not the whole edition.

    THE VOTE RANKS AND DOES NOT CONVICT, which is where this stops short of
    `refs`. There the editions print copies of one assertion, so the modal
    set is an oracle. Here they translate prose, which an edition is entitled
    to do differently, so the strongest claim available is still "an edition
    alone against the rest is a lead". What counting buys is the ORDER, and
    at nine editions that is the difference between a report and a list."""
    pairs, works, leads = [], [], []
    votes: dict[tuple, collections.Counter] = collections.defaultdict(
        collections.Counter
    )
    witnesses: collections.Counter = collections.Counter()
    stored: dict[tuple, int] = {}
    medians: dict[tuple[str, str], float] = {}
    for base, langs in sorted(language_groups(corpus).items()):
        work_type = json.loads(
            (next(iter(langs.values())) / "manifest.json").read_text()
        )["type"]
        texts = {}
        for lang, work in langs.items():
            got = unit_texts(work, work_type)
            if got is not None:
                texts[lang] = got
        if len(texts) < 2:
            continue
        held: dict = collections.defaultdict(list)
        for lang, units in texts.items():
            for unit, text in units.items():
                held[unit].append((lang, bool(text)))
        works.append(
            {
                "work": base,
                "type": work_type,
                "editions": sorted(texts),
                "units": len(held),
                # A unit no edition is missing is the ordinary case and says
                # nothing; these two are the membership findings, and they are
                # `check-symmetry`'s subject reported here only because this
                # audit has the texts open.
                "partial": sorted(
                    (
                        {
                            "unit": unit,
                            "missing": sorted(set(texts) - {e for e, _ in have}),
                        }
                        for unit, have in held.items()
                        if len(have) < len(texts)
                    ),
                    key=lambda r: str(r["unit"]),
                ),
                "empty": sorted(
                    (
                        {
                            "unit": unit,
                            "editions": sorted(e for e, filled in have if not filled),
                        }
                        for unit, have in held.items()
                        if any(not filled for _, filled in have)
                    ),
                    key=lambda r: str(r["unit"]),
                ),
            }
        )
        for a, b in itertools.combinations(sorted(texts), 2):
            measured = balance_pair(texts[a], texts[b], work_type)
            if measured is None:
                continue
            medians[(a, b)] = measured["median"]
            for key in measured.pop("compared_keys"):
                witnesses[(base, key, a)] += 1
                witnesses[(base, key, b)] += 1
            for skew, key, a_len, b_len in measured["outliers"]:
                longer, shorter = (a, b) if skew > 1 else (b, a)
                votes[(base, key, longer)]["long"] += 1
                votes[(base, key, shorter)]["short"] += 1
                stored[(base, key, a)] = a_len
                stored[(base, key, b)] = b_len
            pairs.append({"work": base, "a": a, "b": b, **measured})
        # Resolved per work, while this work's texts are still open: the
        # neighbourhood test below has to read the units beside the lead, and
        # holding every work's texts to the end costs the whole corpus in
        # memory for the sake of one loop.
        for (work, unit, edition), counted in votes.items():
            if work != base:
                continue
            against = max(counted["long"], counted["short"])
            if not against or against != witnesses[(work, unit, edition)]:
                continue
            leads.append(
                {
                    "work": work,
                    "unit": unit,
                    "edition": edition,
                    "direction": "long"
                    if counted["long"] > counted["short"]
                    else "short",
                    "against": against,
                    "stored": stored[(work, unit, edition)],
                    "neighbourhood": neighbourhood_verdict(
                        texts, medians, edition, unit
                    ),
                }
            )
        votes.clear()
        witnesses.clear()
        stored.clear()
        medians.clear()
    leads.sort(key=lambda r: (-r["against"], r["work"], r["edition"], str(r["unit"])))
    return {"works": works, "pairs": pairs, "leads": leads}


def unit_label(unit) -> str:
    """A unit key as an address a person can look up. Tuples are the two types
    keyed by one: a Bible verse and a Summa article."""
    if isinstance(unit, (list, tuple)) and len(unit) == 3 and isinstance(unit[1], int):
        return f"{unit[0]} {unit[1]}:{unit[2]}"
    if isinstance(unit, (list, tuple)):
        return " ".join(str(part) for part in unit)
    return str(unit)


def report_balance(measured: dict, limit: int) -> int:
    pairs, leads = measured["pairs"], measured["leads"]
    total = sum(len(r["outliers"]) for r in pairs)
    print(
        f"{len(pairs)} edition pair(s) compared, "
        f"{sum(r['compared'] for r in pairs):,} units, {total} outside "
        f"[{BALANCE_LOW}, {BALANCE_HIGH}]x the pair's own median; "
        f"{len(leads)} unit(s) where one edition stands alone.\n"
    )
    for entry in measured["works"]:
        rows = [r for r in pairs if r["work"] == entry["work"]]
        if not rows:
            continue
        skipped = sum(r["incomparable"] for r in rows)
        print(
            f"{entry['work']}  {len(entry['editions'])} editions, {len(rows)} "
            f"pair(s), {sum(r['compared'] for r in rows):,} comparisons, median "
            f"{min(r['median'] for r in rows):.2f}-"
            f"{max(r['median'] for r in rows):.2f}x"
            + (
                f"; {skipped:,} unit(s) skipped where a pair divides a chapter "
                "differently"
                if skipped
                else ""
            )
        )
        if entry["partial"]:
            # Named eight at a time and never `--limit` at a time: WHICH units
            # an edition lacks is `check-symmetry`'s question and, for a
            # Bible, `edition_check.py`'s, which asks it chapter by chapter
            # against the Clementine. Here it is context for the comparison
            # below, and 2,429 verse numbers would bury it.
            print(
                f"    {len(entry['partial'])} unit(s) not in every edition: "
                + ", ".join(
                    f"{unit_label(r['unit'])} (not in {', '.join(r['missing'])})"
                    for r in entry["partial"][:8]
                )
                + (" ..." if len(entry["partial"]) > 8 else "")
            )
        for row in entry["empty"]:
            print(
                f"    EMPTY {unit_label(row['unit'])}: stored empty in "
                f"{', '.join(row['editions'])}"
            )
    print()
    verdicts = collections.Counter(lead["neighbourhood"] for lead in leads)
    print(
        f"{len(leads)} lead(s), read by whether the units either side hold what "
        "the lead does not:\n"
        f"  moved {verdicts['moved']} -- the text is next door, so the edition "
        "divides the passage differently\n"
        f"  absent {verdicts['absent']} -- the neighbourhood is short too, so "
        "the text is not in it\n"
        f"  mixed {verdicts['mixed']}, unmeasurable {verdicts[None]} -- the "
        "window disagrees with itself, or has nothing to compare"
    )
    print()
    shown = leads[:limit]
    for lead in shown:
        print(
            f"{lead['direction'].upper():5}  {lead['work']}.{lead['edition']:<16} "
            f"{unit_label(lead['unit']):<22} {lead['stored']:6,}c  against all "
            f"{lead['against']} other edition(s)  {lead['neighbourhood'] or '-'}"
        )
    if len(leads) > len(shown):
        print(f"... {len(leads) - len(shown)} more")
        by_edition = collections.Counter(
            f"{lead['work']}.{lead['edition']}" for lead in leads
        )
        print(
            "    "
            + ", ".join(f"{name} {n}" for name, n in by_edition.most_common())
            + "\n    Read the tally directionally: an edition alone in one book "
            "or one chapter is that edition's own division; one scattered across "
            "the corpus is the parser."
        )
    # Not gated, for the reason the module docstring gives: a skew is a
    # finding to adjudicate, and the two standing against ccc.en would turn
    # `audit.py all` red without telling anyone anything new.
    return 0


# --------------------------------------------------------------------------
# Cross-language divisions
# --------------------------------------------------------------------------

#: The division kinds whose presence is a property of the WORK rather than of
#: the edition printing it. `sub` is deliberately absent: an unnumbered run-in
#: heading exists in the tree only where its mirror set it in bold, which is
#: typography and differs legitimately by two orders of magnitude across
#: editions of the CCC.
DIVISION_KINDS = ("part", "section", "chapter", "article", "in-brief")


def divisions(work: Path) -> dict[str, set[tuple]] | None:
    """`kind -> {(first, last) paragraph span}` for one edition.

    KEYED BY SPAN, NOT BY TITLE OR BY ORDINAL. The title is in a different
    language in every edition and the ordinal restarts inside each parent, so
    neither identifies a division across editions. The span does: the unit
    numbers are the one thing every edition of a work agrees on by
    construction, which is exactly what makes the unit-set oracle vacuous and
    this one possible.

    A node with a null bound (unnumbered content -- creed texts, Decalogue
    epigraphs; see corpus-schema.md) addresses nothing and is skipped."""
    structure = work / "structure.json"
    if not structure.exists():
        return None
    found: dict[str, set[tuple]] = {k: set() for k in DIVISION_KINDS}

    def walk(nodes: list[dict]) -> None:
        for node in nodes:
            span = tuple(node.get("paragraphs") or (None, None))
            # `.get`, because not every comparable type stores a division
            # tree of this shape -- the Summa's is questions and articles, and
            # the prayers have none at all. A node with no `kind` contributes
            # nothing rather than raising.
            if node.get("kind") in found and all(b is not None for b in span):
                found[node["kind"]].add(span)
            walk(node.get("children") or [])

    walk(json.loads(structure.read_text()))
    return found


def measure_divisions(corpus: Path) -> list[dict]:
    """One row per division that some editions of a work have and others do
    not, with the two sides named."""
    rows = []
    for base, langs in sorted(language_groups(corpus).items()):
        trees = {}
        for lang, work in langs.items():
            got = divisions(work)
            if got is not None:
                trees[lang] = got
        if len(trees) < 2:
            continue
        for kind in DIVISION_KINDS:
            spans: dict[tuple, set[str]] = collections.defaultdict(set)
            for lang, tree in trees.items():
                for span in tree[kind]:
                    spans[span].add(lang)
            for span, have in sorted(spans.items()):
                missing = set(trees) - have
                if not missing:
                    continue
                rows.append(
                    {
                        "work": base,
                        "kind": kind,
                        "span": span,
                        "have": sorted(have),
                        "missing": sorted(missing),
                    }
                )
    # The lopsided disagreements first: one edition against seven is a finding,
    # four against four is two conventions.
    rows.sort(key=lambda r: (len(r["missing"]), -len(r["have"])))
    return rows


def report_divisions(rows: list[dict], limit: int) -> int:
    works = {r["work"] for r in rows}
    print(
        f"{len(rows)} division(s) present in some editions and not others, "
        f"across {len(works)} work(s).\n"
        "Ranked by how lopsided the disagreement is. An edition alone against "
        "the rest is a lead;\nan even split is two printing conventions. "
        "Reports only; never gates."
    )
    if not rows:
        return 0
    print()
    for row in rows[:limit]:
        first, last = row["span"]
        print(
            f"  {row['work']:14s} {row['kind']:9s} {first}-{last}"
            f"  missing from {','.join(row['missing'])}"
            f"  (present in {len(row['have'])}: {','.join(row['have'])})"
        )
    if len(rows) > limit:
        print(f"  ... and {len(rows) - limit} more (raise --limit, or --json)")
    return 0


# --------------------------------------------------------------------------
# Cross-language structure trees
# --------------------------------------------------------------------------

#: The types whose `structure.json` is the DOCUMENTS' flat array of
#: `{level, title, before}` rather than the CCC's nested `kind`/`paragraphs`
#: nodes. `divisions` above reads the nested shape and counts kinds; these
#: have no kinds to count, which is why they needed a check of their own
#: (docs/corpus-schema.md, §Documents).
TREE_TYPES = ("document", "social-doctrine", "canon-law")

#: An outline of one anchor or none is the trivial single-node tree the
#: schema gives a document with no internal headings. It is not evidence
#: about where headings are, so it is reported and never consulted.
TREE_STUB_ANCHORS = 1

#: A collapsed section set makes the tree comparison meaningless rather than
#: informative -- see `measure_trees`. Same shape as the stub test: a quarter
#: of the peer median, and only where the peers have enough units for a
#: quarter to mean anything.
TREE_COLLAPSE_RATIO = 4
TREE_COLLAPSE_MIN_PEER = 8


def outline(work: Path) -> tuple[list[int], dict[int, int]] | None:
    """`(anchors, level by anchor)` for one edition, or None when the edition
    cannot take part in the comparison.

    KEYED BY ANCHOR, WHICH IS THE ONE THING THE EDITIONS SHARE. A document's
    heading carries a title in its own language and a `level` compacted
    against its own document; neither identifies a heading across editions.
    `before` -- the section number the heading precedes -- is the publisher's
    own paragraph number, printed identically in every translation, so it is
    the address a heading can be compared at.

    Two editions are excluded rather than compared. One with an EMPTY
    `sections.json` is typeset as continuous prose and every heading it has is
    unanchored, exactly the case `check_language_symmetry` skips and for the
    same reason. One with no `structure.json` was never parsed this far.

    A heading with `before: null` is trailing matter that the numbered flow
    never reaches (`docs/corpus-schema.md`), so it addresses nothing and is
    dropped here as `divisions` drops a null-bounded node. Where an anchor
    carries several headings the SHALLOWEST is kept: an anchor is one position
    in the outline, and the outer heading is what ranks it."""
    structure, sections = work / "structure.json", work / "sections.json"
    if not structure.exists() or not sections.exists():
        return None
    if not json.loads(sections.read_text()):
        return None
    level: dict[int, int] = {}
    for node in json.loads(structure.read_text()):
        anchor = node.get("before")
        if anchor is None:
            continue
        level[anchor] = min(level.get(anchor, node["level"]), node["level"])
    return sorted(level), level


def _steps(anchors: list[int], level: dict[int, int]) -> list[int]:
    """The tree's shape as the sign of the level change between consecutive
    anchors: +1 a step in, -1 a step out, 0 a sibling.

    THE SHAPE OF A TREE IS ITS STEPS, NOT THE LEVELS OF ITS NODES, and the
    difference is the whole reason this function exists. `level` is compacted
    to a contiguous 1..N per document, so an edition that finds one tier its
    siblings do not shifts EVERY node below it by one -- comparing levels
    directly reported 184 disagreements for `csdc.en` where the fact is that
    it has one more tier than `csdc.pl`. A step survives that shift, so what
    it reports is a node the editions disagree about the placement OF."""
    return [
        (level[b] > level[a]) - (level[b] < level[a])
        for a, b in itertools.pairwise(anchors)
    ]


def measure_trees(corpus: Path) -> list[dict]:
    """One row per edition whose outline departs from its siblings', with the
    three ways it can depart measured separately.

    `docs/research/document-structure-defects.md` §2 asked for exactly this
    and said why: `check-symmetry` compares section-number sets, so a document
    whose editions agree on 287 sections passes it while one of them found
    eight chapters and another found none. The trees are what the sidebar
    contents renders and what `static/route-titles.json` publishes as each
    division's paragraph span, so a wrong tree is served to consumers that
    never render the page.

    THREE MEASURES, BECAUSE THEY NAME THREE DIFFERENT FAULTS:

      - **lacks** -- anchors a majority of the witnesses carry a heading at
        and this edition does not. The sharpest of the three: the working
        siblings show what the broken one should produce.
      - **alone** -- anchors no other witness has a heading at. Read
        DIRECTIONALLY and against the counts printed beside it. An edition
        alone at an anchor where its siblings are rich has invented a heading
        -- a promoted table-of-contents entry, a stanza taken for a title. One
        alone where its siblings are thin is the only edition that parsed, and
        the finding is about them: `sollicitudo-rei-socialis.hu` is alone at
        42 anchors because the other eight editions found seven headings each.
      - **steps** -- anchors both sides carry but rank differently against
        the anchor before them. This is `document-structure-defects.md`'s
        closing-block-a-tier-too-deep class, and `_steps` says why it is
        measured as a step rather than as a level.

    A STUB IS NOT A WITNESS. An edition whose outline has one anchor or none
    is the trivial single-node tree, and treating it as evidence that there is
    no heading at anchor 40 is exactly backwards -- it says only that nothing
    was found. So stubs are reported (`stub: true`) and excluded from what the
    others are measured against, which is what stops the three editions of
    `mediator-dei` reading as one invention of 73 headings and one absence.

    A COLLAPSED SECTION SET MAKES THE TREE QUESTION MOOT, and the row says so
    rather than leaving it to be discovered. A heading is anchored to a
    section number, so an edition holding 1 of the 33 sections its siblings
    hold cannot anchor a heading anywhere; its outline is a symptom, and the
    work is in `check-symmetry`'s report, not here.

    IT RANKS AND IT DOES NOT ADJUDICATE, which is the one thing to keep in
    mind while reading the output. `evangelii-nuntiandi.en` reads exactly like
    a parse failure -- 1 heading against a peer median of 82 -- and is not
    one: the English mirror contains six bold runs in the whole document, all
    furniture, and is an unstructured rendering of the same text.
    `familiaris-consortio.la` is the same, confirmed on the raw page. The
    comparison produces candidates; the page decides."""
    rows = []
    for base, langs in sorted(language_groups(corpus, types=TREE_TYPES).items()):
        read = {}
        units = {}
        for lang, work in langs.items():
            got = outline(work)
            if got is not None:
                read[lang] = got
                units[lang] = len(json.loads((work / "sections.json").read_text()))
        witnesses = {
            lang
            for lang, (anchors, _) in read.items()
            if len(anchors) > TREE_STUB_ANCHORS
        }
        if len(witnesses) < 2:
            continue
        held = collections.Counter()
        for lang in witnesses:
            held.update(read[lang][0])
        agreed = {n for n, c in held.items() if c * 2 > len(witnesses)}
        for lang, (anchors, level) in sorted(read.items()):
            peers = sorted(witnesses - {lang})
            if not peers:
                continue
            peer_units = statistics.median_low([units[p] for p in peers])
            row = {
                "work": base,
                "edition": lang,
                "anchors": len(anchors),
                "peer_anchors": statistics.median_low([len(read[p][0]) for p in peers]),
                "witnesses": len(witnesses),
                "stub": lang not in witnesses,
                "collapsed": peer_units >= TREE_COLLAPSE_MIN_PEER
                and units[lang] * TREE_COLLAPSE_RATIO <= peer_units,
                "lacks": len(agreed - set(anchors)),
                "alone": sum(1 for n in anchors if held[n] == 1),
                "steps": 0,
            }
            # The step comparison needs a common spine, so it runs over the
            # anchors every witness carries -- a step between two anchors one
            # side does not have is not a disagreement about placement.
            shared = sorted(
                set.intersection(*(set(read[p][0]) for p in peers)) & set(anchors)
            )
            if lang in witnesses and len(shared) > 2:
                mine = _steps(shared, level)
                theirs = [
                    _steps(shared, read[p][1])
                    for p in peers
                    if set(shared) <= set(read[p][0])
                ]
                for i, step in enumerate(mine):
                    modal = collections.Counter(t[i] for t in theirs).most_common(1)
                    if modal and modal[0][1] * 2 > len(theirs) and modal[0][0] != step:
                        row["steps"] += 1
            if row["stub"] and row["peer_anchors"] <= TREE_STUB_ANCHORS:
                continue
            if row["stub"] or row["lacks"] or row["alone"] or row["steps"]:
                rows.append(row)
    # A stub is ranked by what its siblings found, because that is the whole
    # of what it lost; a partial by how far it strayed from them.
    rows.sort(
        key=lambda r: (
            not r["stub"],
            -(r["peer_anchors"] if r["stub"] else r["lacks"] + r["alone"] + r["steps"]),
            r["work"],
            r["edition"],
        )
    )
    return rows


def report_trees(rows: list[dict], limit: int) -> int:
    stubs = [r for r in rows if r["stub"]]
    partial = [r for r in rows if not r["stub"]]
    print(
        f"{len(rows)} edition(s) whose outline departs from their siblings', "
        f"across {len({r['work'] for r in rows})} work(s).\n"
        "Reports only; never gates -- and it RANKS WITHOUT ADJUDICATING: an "
        "unstructured mirror and\nan unread one look identical from here, so "
        "the raw page decides. `COLLAPSED SECTIONS`\nmarks an edition holding "
        "a fraction of its siblings' units, where the outline is a symptom."
    )
    print(f"\n{len(stubs)} found no outline at all, against siblings that did:")
    for row in stubs[:limit]:
        note = "  COLLAPSED SECTIONS" if row["collapsed"] else ""
        name = f"{row['work']}.{row['edition']}"
        print(
            f"  {name:46s} peer median {row['peer_anchors']:4d} anchors "
            f"({row['witnesses']} witnesses){note}"
        )
    if len(stubs) > limit:
        print(f"  ... and {len(stubs) - limit} more (raise --limit, or --json)")
    print(
        f"\n{len(partial)} found an outline that disagrees. `lacks` are anchors "
        "the witnesses agree on\nand this edition has not, `alone` anchors only "
        "it has, `steps` anchors it ranks differently:"
    )
    for row in partial[:limit]:
        note = "  COLLAPSED SECTIONS" if row["collapsed"] else ""
        name = f"{row['work']}.{row['edition']}"
        print(
            f"  {name:46s} {row['anchors']:4d}/{row['peer_anchors']:<4d} anchors  "
            f"lacks {row['lacks']:3d}  alone {row['alone']:3d}  "
            f"steps {row['steps']:3d}{note}"
        )
    if len(partial) > limit:
        print(f"  ... and {len(partial) - limit} more (raise --limit, or --json)")
    return 0


# --------------------------------------------------------------------------
# Cross-language reference apparatus
# --------------------------------------------------------------------------

#: The types carrying an apparatus of ADDRESSES rather than of prose. Only
#: the Compendium has one today: every edition prints, beside each question,
#: the Catechism paragraphs that question condenses.
#:
#: The CCC is deliberately absent and it is worth saying why, because it looks
#: like the obvious second candidate. Its `related` field -- the printed
#: margin apparatus, which WOULD be exactly this shape -- is empty in all
#: 22,920 paragraphs of all eight editions, because vatican.va's mirrors do
#: not print it (`ccc.py` says so in every manifest). What the CCC does carry
#: is `citations`, and those are PROSE: a work title in the edition's own
#: language, and three of the eight editions fold their references into the
#: sentence and print no footnote at all. Counting them across editions
#: measures which convention an edition follows, not whether we read it --
#: see docs/research/ccc-citation-apparatus.md for the measurement and for
#: the one comparison in it that is worth making.
REFS_TYPES = ("compendium",)

#: Ranges are written with any of five dashes across the fourteen editions,
#: and the extractors leave a space on one or both sides of some of them.
_DASHES = "-‐‑–—"

#: A ref is at most four digits: the Catechism ends at 2865. The ceiling is
#: what stops a mangled range from expanding into tens of thousands of
#: integers, and it is the parse's only sanity gate.
REF_MAX = 2865


def parse_refs(raw: str) -> tuple[frozenset[int], tuple[str, ...]]:
    """A stored `ccc_refs` string as the set of paragraphs it names, plus the
    tokens that were not paragraph numbers.

    COMPARED AS A SET, NOT AS A STRING, because every edition punctuates the
    same apparatus differently and none of it carries meaning: `1-25` and
    `1 - 25`, `84, 91-94, 99` and `84 91-94 99` and `84.91 94.99` are one
    apparatus in four hands. Normalizing to integers is what makes a
    fourteen-way comparison possible at all; it is also why the second half of
    the return value exists, since a token this cannot read is invisible to a
    set comparison and is usually the interesting one (`787-786` reversed,
    `1655-1558` for `1655-1658`).

    The full stop is a SEPARATOR here and not a sentence end. Italian
    typographic convention writes a list of single paragraphs as `96.98`, and
    the Portuguese and Spanish mirrors inherit it; reading the dot as anything
    else turns two references into one impossible one."""
    text = re.sub(rf"\s*[{_DASHES}]\s*", "-", (raw or "").strip())
    out: set[int] = set()
    unreadable: list[str] = []
    for token in re.split(r"[;,.\s]+", text):
        if not token:
            continue
        span = re.fullmatch(r"(\d+)-(\d+)", token)
        if span:
            first, last = int(span.group(1)), int(span.group(2))
            if first <= last <= REF_MAX:
                out.update(range(first, last + 1))
            else:
                unreadable.append(token)
        elif token.isdigit() and int(token) <= REF_MAX:
            out.add(int(token))
        else:
            unreadable.append(token)
    return frozenset(out), tuple(unreadable)


def unit_refs(work: Path, work_type: str) -> dict | None:
    """Addressable unit -> the raw apparatus string stored under it, for the
    units that have one. A unit with no apparatus is absent from the map
    rather than present and empty, so "we read nothing here" and "the source
    prints nothing here" stay one question this audit can ask."""
    if work_type != "compendium":
        return None
    return {
        q["n"]: q["ccc_refs"]
        for q in json.loads((work / "questions.json").read_text())
        if q.get("ccc_refs")
    }


def classify(mine: frozenset[int], modal: frozenset[int]) -> str:
    """How one edition's ref-set stands to the set the others agree on.

    THE SHAPE IS THE DIAGNOSIS, and it is the whole reason this reports a
    classification rather than a count. A translating conference that decides
    to print less of the apparatus prints a SUBSET, everywhere, consistently;
    one that decides to print more prints a SUPERSET the same way. Neither is
    a defect and both are common -- the German edition omits the In Brief
    range at 170 of 598 questions and its own raw page says so at every one.

    But no printing convention produces a set that overlaps the others'
    without containing or being contained by it, and none produces a disjoint
    one. Those are misprints and misreads, which is why they are what the
    report leads with."""
    if mine == modal:
        return "same"
    if mine < modal:
        return "subset"
    if mine > modal:
        return "superset"
    return "overlap" if mine & modal else "disjoint"


def measure_refs(corpus: Path) -> list[dict]:
    """One row per work, holding every edition's departures from the modal
    apparatus.

    THE MODAL SET IS THE ORACLE, and a vote is legitimate here in a way it
    would never be over text. Question N is the same question in every
    edition, and what it stores is a list of Catechism paragraph NUMBERS --
    so the editions are not expressing the same thing differently, they are
    asserting the same arithmetic, and thirteen of them saying 1198-1199
    where one says 1198-1999 is not a matter of style. `balance` and
    `divisions` both stop at "an edition alone against the rest is a lead"
    for exactly the reason this one can go further: they compare prose length
    and typography, which an edition is entitled to differ about."""
    rows = []
    for base, langs in sorted(language_groups(corpus).items()):
        work_type = json.loads(
            (next(iter(langs.values())) / "manifest.json").read_text()
        )["type"]
        if work_type not in REFS_TYPES:
            continue
        raw = {}
        for lang, work in langs.items():
            got = unit_refs(work, work_type)
            if got is not None:
                raw[lang] = got
        if len(raw) < 3:
            # Two editions can disagree but cannot outvote each other, and a
            # tie reported as a finding is a coin toss with a table around it.
            continue
        parsed = {
            lang: {n: parse_refs(s) for n, s in units.items()}
            for lang, units in raw.items()
        }
        units = sorted({n for units in parsed.values() for n in units})
        modal: dict[int, tuple[frozenset[int], int]] = {}
        for n in units:
            votes = collections.Counter(p[n][0] for p in parsed.values() if n in p)
            modal[n] = votes.most_common(1)[0]
        findings = collections.defaultdict(list)
        counts = {lang: collections.Counter() for lang in parsed}
        for lang, units_parsed in parsed.items():
            shapes: dict[int, str] = {}
            entries: dict[int, dict] = {}
            for n in units:
                agreed, votes = modal[n]
                if n not in units_parsed:
                    shapes[n] = "silent"
                    entries[n] = {"unit": n, "raw": "", "votes": votes}
                    continue
                mine, unreadable = units_parsed[n]
                if unreadable:
                    counts[lang]["unreadable"] += 1
                    findings[lang].append(
                        {
                            "unit": n,
                            "shape": "unreadable",
                            "raw": raw[lang][n],
                            "votes": votes,
                            "tokens": list(unreadable),
                        }
                    )
                shape = classify(mine, agreed)
                if shape == "same":
                    continue
                shapes[n] = shape
                entries[n] = {
                    "unit": n,
                    "raw": raw[lang][n],
                    "votes": votes,
                    "agreed": sorted(agreed),
                    "matches_modal_of": next(
                        (
                            n + step
                            for step in (1, -1)
                            if modal.get(n + step, (None,))[0] == mine
                        ),
                        None,
                    ),
                }
            # SECOND PASS, because a displacement is a claim about a PAIR.
            #
            # This class was written to catch our own misalignment -- an
            # apparatus read correctly and attached to the wrong question --
            # on the reasoning that a set equal to a neighbour's modal set is
            # unlikely to be a coincidence. Against the raw pages that
            # reasoning failed: 14 of the 17 it flagged sit in the right slot
            # on their own source page, and merely happen to name a range a
            # neighbouring question also names, because these editions draw
            # their ranges differently from one another to begin with.
            #
            # What a real displacement leaves is a PAIR -- a swap, or a run --
            # so the unit it was displaced from must deviate too. That is the
            # rule now, and it takes the class from 17 to 3: the German
            # exchanges questions 248 and 249, which its own page confirms,
            # and nothing else in the corpus is displaced at all.
            for n, shape in shapes.items():
                partner = entries[n].get("matches_modal_of") if n in entries else None
                if partner is not None and partner in shapes:
                    step = partner - n
                    shape = f"shifted{step:+d}"
                counts[lang][shape] += 1
                findings[lang].append({**entries[n], "shape": shape})
            findings[lang].sort(key=lambda f: f["unit"])
        rows.append(
            {
                "work": base,
                "units": len(units),
                "editions": sorted(parsed),
                "unanimous": sum(1 for n in units if modal[n][1] == len(parsed)),
                "weakest": min(modal[n][1] for n in units) if units else 0,
                "counts": {lang: dict(c) for lang, c in counts.items()},
                "findings": dict(findings),
                "modal": {n: sorted(modal[n][0]) for n in units},
            }
        )
    return rows


#: The shapes no printing convention produces, and which therefore name a
#: defect rather than an edition. `shifted` is ours; the other three are
#: usually the source's, and the report does not try to tell those apart --
#: that is what reading the raw page is for.
REFS_DEFECT_SHAPES = ("shifted+1", "shifted-1", "disjoint", "overlap", "unreadable")


def _span(numbers: list[int]) -> str:
    """A ref-set printed back as ranges, so a finding can be read against the
    edition's own string without counting integers."""
    if not numbers:
        return "-"
    parts, start, prev = [], numbers[0], numbers[0]
    for value in [*numbers[1:], None]:
        if value == prev + 1:
            prev = value
            continue
        parts.append(str(start) if start == prev else f"{start}-{prev}")
        if value is None:
            break
        start = prev = value
    return " ".join(parts)


def report_refs(rows: list[dict], limit: int) -> int:
    leads = sum(
        1
        for row in rows
        for finds in row["findings"].values()
        for f in finds
        if f["shape"] in REFS_DEFECT_SHAPES
    )
    print(
        f"{len(rows)} work(s) with a cross-language reference apparatus, "
        f"{leads} defect lead(s).\n"
        "A margin reference is an ADDRESS, so the editions assert the same "
        "arithmetic and the\nmodal set is an oracle rather than an opinion. "
        "Subset and superset are what a translating\nconference decides; "
        "overlapping, disjoint and shifted sets are what nobody decides.\n"
        "Reports only; never gates."
    )
    for row in rows:
        print(
            f"\n{row['work']}  {len(row['editions'])} editions, "
            f"{row['units']:,} units with an apparatus, "
            f"modal set unanimous in {row['unanimous']:,}, "
            f"weakest support {row['weakest']}/{len(row['editions'])}"
        )
        order = sorted(
            row["counts"],
            key=lambda lang: (
                -sum(
                    v for k, v in row["counts"][lang].items() if k in REFS_DEFECT_SHAPES
                )
            ),
        )
        print(
            f"    {'edition':10}{'silent':>7}{'subset':>7}{'superset':>9}"
            f"{'overlap':>8}{'disjoint':>9}{'shifted':>8}{'unread':>7}"
        )
        for lang in order:
            c = row["counts"][lang]
            shifted = c.get("shifted+1", 0) + c.get("shifted-1", 0)
            print(
                f"    {lang:10}{c.get('silent', 0):7}{c.get('subset', 0):7}"
                f"{c.get('superset', 0):9}{c.get('overlap', 0):8}"
                f"{c.get('disjoint', 0):9}{shifted:8}{c.get('unreadable', 0):7}"
            )
        found = [
            (lang, find)
            for lang in order
            for find in row["findings"][lang]
            if find["shape"] in REFS_DEFECT_SHAPES
        ]
        if found and limit:
            print("\n  defect leads, edition against the rest:")
        shown = 0
        for lang, find in found:
            if shown >= limit:
                break
            agreed = _span(find.get("agreed", []))
            print(
                f"    {lang:10} q{find['unit']:<4} {find['shape']:10} "
                f"{find['raw']!r:28} vs {find['votes']:2}x {agreed!r}"
            )
            shown += 1
        if len(found) > shown:
            print(f"    ... {len(found) - shown} more (raise --limit, or --json)")
    # Not gated, for the reason `balance` is not: a lead is a source misprint
    # to file or a reader to fix, and neither is a thing a build should stop
    # for. What gates the Compendium is `validate`'s absolute 598.
    return 0


# --------------------------------------------------------------------------
# The magisterial documents' footnote apparatus
# --------------------------------------------------------------------------

#: `document` is the one type left out of every cross-language check above,
#: for the reason the module docstring gives: a section number is not the
#: same section in two editions. Its APPARATUS is a different subject, and
#: two of the three questions below are not cross-language at all.
APPARATUS_TYPES = ("document",)


def source_notes(foot_html: str) -> dict[str, str]:
    """The footnote list as the SOURCE prints it, read with the parser's own
    reader so that what this compares against is what the parser would have
    had -- never a second implementation of the same sniff.

    The `SUPPLEMENTARY NOTES` split is `parse_document`'s and is copied for
    the same reason `split_region` copies the shell sniff: without it Lumen
    Gentium's second, star-marked series is read as part of the primary one
    and every entry after the heading is counted as a note nothing reaches."""
    if not foot_html:
        return {}
    star = re.search(r"SUPPLEMENTARY NOTES", foot_html, re.IGNORECASE)
    primary = foot_html[: star.start()] if star else foot_html
    flat, _chapter_scoped = V.build_footnote_table(primary)
    return flat


def stored_citations(work: Path) -> list[dict]:
    """Every citation the build stored for one edition, in document order.

    Sections and appendix both, because an unnumbered edition's whole text is
    in the appendix (`stored_text_len` had to learn the same thing) and its
    notes go with it."""
    out = []
    for name in ("sections.json", "appendix.json"):
        path = work / name
        if not path.exists():
            continue
        for unit in json.loads(path.read_text()):
            out.extend(unit.get("citations") or [])
    return out


def measure_apparatus_recall(corpus: Path) -> list[dict]:
    """Per edition: how much of the source's own footnote list we kept.

    TWO EXACT MEASURES AND NO HEURISTIC, which is the whole design. An
    earlier draft looked for holes in the marker run 1..N and had to guess
    where the run ended, because a stray `(302)` in prose is stored as
    marker 302 and Vatican II restarts its numbering per chapter. Both
    questions can be asked exactly instead, and they name different culprits:

      - **empty** is a stored citation whose marker reached no note. Either
        the footnote LIST was not read -- the boundary sniff missed, and then
        every citation in the edition is empty -- or the marker was never a
        marker.
      - **unreached** is a note in the source's list that no stored citation
        carries. The list was read and the MARKER in the body was not, so the
        note is on the page and in no reader's apparatus.

    Neither needs a sibling edition, which is why this reaches the 19
    documents held in a single language, and the cross-language vote does
    not."""
    rows = []
    for work_id, page in raw_pages(corpus).items():
        work = common.build_root(corpus) / work_id
        if not (work / "sections.json").exists():
            continue
        cites = stored_citations(work)
        _body, foot_html = split_region(
            page.read_text(encoding="utf-8", errors="replace")
        )
        notes = source_notes(foot_html)
        if not cites and not notes:
            # No apparatus on either side. The overwhelming majority of the
            # unnumbered editions, and not a finding about anything.
            continue
        carried = {str(c.get("marker")) for c in cites}
        empty = [c for c in cites if not (c.get("text") or "").strip()]
        unreached = sorted(set(notes) - carried, key=_marker_sort)
        rows.append(
            {
                "work": work_id,
                "state": apparatus_state(len(cites), len(empty), notes, carried),
                "stored": len(cites),
                "empty": len(empty),
                "source_notes": len(notes),
                "unreached": unreached,
            }
        )
    rows.sort(key=lambda r: -(r["empty"] + len(r["unreached"])))
    return rows


#: The three ways an edition's apparatus goes missing, in the order a fix
#: would take them. They are states of one edition and not severities: an
#: edition is in exactly one, and which one names the half of the parser to
#: look at.
APPARATUS_STATES = ("list-unread", "markers-unread", "partial")


def apparatus_state(
    stored: int, empty: int, notes: dict[str, str], carried: set[str]
) -> str:
    """Which half of the parse failed, or `ok`.

    THE TWO TOTAL FAILURES POINT IN OPPOSITE DIRECTIONS and were one bucket
    until the corpus was read. `list-unread` is a page whose markers were all
    found and whose footnote LIST was not, so the apparatus is a set of
    markers pointing at nothing -- 123 editions, every citation empty,
    `vatii.gaudium-et-spes.la` at 345 of them. `markers-unread` is the
    mirror: the list read whole and not one marker matched, so nothing points
    at any of it -- `exhortation.vita-consecrata.la` stores 0 citations
    against a source list of 427, its template sniffed as `sup` where the
    body prints `(N)`. Reporting those two together as "notes missing" hides
    that they are different bugs in different functions."""
    if notes and not (carried & set(notes)):
        return "markers-unread"
    if not notes and empty:
        return "list-unread"
    if empty or set(notes) - carried:
        return "partial"
    return "ok"


def _marker_sort(marker: str) -> tuple[int, int | str]:
    return (0, int(marker)) if marker.isdigit() else (1, marker)


# --------------------------------------------------------------------------

#: `AAS 63 (1971), 416-417`. The volume and the year are digits in every
#: language, which is what makes the series reference the one part of a
#: footnote that can be checked at all: the rest is the edition's own
#: bibliography, and a German footnote citing the German L'Osservatore
#: Romano is doing its job.
#:
#: The page group is deliberately loose about what sits between the year and
#: the numbers -- `p.`, `pp.`, `S.`, `s.`, `lpp.`, `str.` are six spellings
#: of "page" across these editions, and a pattern that admitted only the
#: Latin one read every German reference as having no pages at all and
#: reported 387 leads that were one abbreviation.
SERIES_RE = re.compile(
    r"\b(AAS|ASS)\s*\.?\s*(\d{1,3})\s*\(\s*(\d{4})\s*\)"
    r"[^\d]{0,12}(\d{1,4}(?:\s*[-\u2010\u2011\u2013\u2014]\s*\d{1,4})?)?"
)

#: A volume of the Acta is its year minus a constant, so a reference carries
#: its own check and needs no second edition to contradict it. DERIVED, not
#: looked up: 98.71% of the corpus's 19,782 AAS references satisfy the first
#: of these and the exceptions are transpositions (`AAS 38 (1991)` for 83,
#: `AAS 191 (2009)` for 101).
#:
#: THE TWO ARMS OF THIS ARE NOT EQUALLY STRONG, and the ASS one is a LEAD.
#: AAS is one volume a year, so the offset is exact. ASS is not: a third of
#: its 41 volumes span two years, the offset holds against the FIRST of them,
#: and a citation is free to name either. Measured 2026-09-07 over the
#: corpus's in-series ASS references at volume >= 9: 27 distinct
#: (volume, year) pairs, 21 satisfying the offset and 6 not — and `ASS 19
#: (1887)` and `ASS 29 (1897)` are two of the six, both correct, both naming
#: their volume's second year. So an ASS `volume-year` row is a candidate to
#: read, never a verdict; only AAS gates.
SERIES_OFFSET = {"AAS": 1908, "ASS": 1867}

#: Acta Sanctae Sedis ceased with volume 41 in 1908 and Acta Apostolicae
#: Sedis began in 1909, so an ASS reference to a later year is not a wrong
#: volume, it is the other series' name. The corpus prints ~50 of them and
#: every one is arithmetically perfect read as AAS.
SERIES_ASS_LAST_YEAR = 1908

#: WHERE THE ASS OFFSET STARTS HOLDING, read off the publisher's own index
#: rather than guessed -- the 41-row table in `site/src/lib/refs-grammar.ts`,
#: which is that series' volume-to-year list in full because the filenames do
#: not derive. Volumes 1-8 span years irregularly (1 is 1865-66, 2 AND 3 are
#: both 1867, 5 is 1869-70, 8 is 1874-75), so `year - volume` is 1861-1866
#: across them and never 1867; from volume 9 (1876) on it holds.
#:
#: IT WAS 4 UNTIL 2026-09-07, on a guess that the irregularity stopped after
#: the two-year volumes at the head of the series. It does not, and the
#: corpus pays for it: `ASS 4 (1868)`, `ASS 5 (1869)` and three of
#: `ASS 8 (1874)` are correct against that index and were all reported as
#: `volume-year` defects. A bound that is too low manufactures defects out of
#: good citations, which is the direction that wastes a reader's afternoon.
SERIES_ASS_IRREGULAR_BELOW = 9


def series_fault(name: str, volume: int, year: int) -> str | None:
    """What is impossible about one series reference, or None.

    Read an `ASS`/`volume-year` row as a lead and an `AAS` one as a fault --
    see `SERIES_OFFSET`, which measures the difference.
    """
    if name == "ASS":
        if year > SERIES_ASS_LAST_YEAR:
            return "aas-misspelled"
        if volume < SERIES_ASS_IRREGULAR_BELOW:
            return None
    return None if volume == year - SERIES_OFFSET[name] else "volume-year"


def series_refs(text: str) -> list[dict]:
    out = []
    for name, volume, year, pages in SERIES_RE.findall(text or ""):
        out.append(
            {
                "series": name,
                "volume": int(volume),
                "year": int(year),
                "pages": re.sub(r"\s*[-\u2010\u2011\u2013\u2014]\s*", "-", pages),
            }
        )
    return out


def measure_apparatus_series(corpus: Path) -> list[dict]:
    """Per edition: the series references that cannot be what they say.

    THE ONLY CHECK HERE THAT CONVICTS ON ITS OWN. `balance`, `divisions` and
    `refs` all need a sibling edition to have an opinion at all; this one
    needs nothing but arithmetic, so it reaches every edition of every
    document including the 105 the corpus holds in one language.

    READ THE COLUMN, NOT THE ROW. A consistent violation is a convention:
    the French Vatican II edition prints the CITED DOCUMENT's paragraph
    number where the volume goes -- `Lumen gentium : AAS 2 (1965), p. 5-6` is
    LG 2 -- at 46 references, and it is the edition speaking exactly as the
    German Compendium's short apparatus was. A scattered one is a misprint."""
    rows = []
    for base, langs in sorted(
        language_groups(corpus, APPARATUS_TYPES, min_editions=1).items()
    ):
        for lang, work in sorted(langs.items()):
            faults = []
            total = 0
            for cite in stored_citations(work):
                for ref in series_refs(cite.get("text") or ""):
                    total += 1
                    fault = series_fault(ref["series"], ref["volume"], ref["year"])
                    if fault:
                        faults.append(
                            {**ref, "fault": fault, "marker": str(cite.get("marker"))}
                        )
            if total:
                # EVERY edition that prints one, not only the faulty ones, so
                # the denominator is in the measurement rather than in the
                # report's head. A rate needs both halves stored or the next
                # reader of the JSON reconstructs it from the wrong total --
                # the faulty editions' references are 8,406 of the corpus's
                # 19,887, so the two answers differ by more than a factor of
                # two.
                rows.append({"work": f"{base}.{lang}", "refs": total, "faults": faults})
    rows.sort(key=lambda r: -len(r["faults"]))
    return rows


# --------------------------------------------------------------------------


#: How one edition's series reference stands to the one the rest print --
#: the same instrument `classify` is for the Compendium, and here for the
#: same reason. A translating conference that cites the first page of a
#: range rather than the range prints a NARROWER span, everywhere,
#: consistently; nothing decides to print 154 where the page is 145. Leading
#: with a count would bury the second under the first, which is exactly what
#: the first run of this did: the Byelorussian edition alone accounts for a
#: third of the leads and every one of them is its own page convention.
SERIES_DEFECT_SHAPES = ("series", "volume", "year", "page")


def _page_span(pages: str) -> tuple[int, int] | None:
    parts = [int(p) for p in pages.split("-") if p.isdigit()]
    if not parts:
        return None
    return (parts[0], parts[-1])


def series_shape(mine: tuple, modal: tuple) -> str:
    """The first field on which two readings of the same footnote disagree.

    Field order is the diagnosis's order: a wrong series name is a different
    publication, a wrong volume or year is a different book, and only once
    those agree is a page difference about the page."""
    if len(mine) != len(modal):
        return "count"
    for (name, volume, year, pages), (m_name, m_volume, m_year, m_pages) in zip(
        mine, modal, strict=True
    ):
        if name != m_name:
            return "series"
        if volume != m_volume:
            return "volume"
        if year != m_year:
            return "year"
        if pages == m_pages:
            continue
        span, m_span = _page_span(pages), _page_span(m_pages)
        if span is None or m_span is None:
            return "page"
        if m_span[0] <= span[0] and span[1] <= m_span[1]:
            return "page-narrower"
        if span[0] <= m_span[0] and m_span[1] <= span[1]:
            return "page-wider"
        return "page"
    return "same"


def measure_apparatus_vote(corpus: Path) -> list[dict]:
    """Per document: series references one edition prints differently from
    the rest.

    THE PRECONDITION IS MARKER IDENTITY, AND IT IS RARE. Footnote k has to be
    footnote k in every edition compared, and these editions do not agree
    about that: `ad-caeli-reginam` prints 53 notes in Italian, 62 in Latin
    and 63 in Portuguese and English, the Portuguese splitting the Latin's
    last note in two. So this runs over the documents whose editions carry
    identical marker sets and is silent about the rest -- 24 documents of
    271, holding 38% of the corpus's series references, which is why the
    arithmetic above is the instrument and this is the supplement.

    WHAT IT ADDS is the page number, which arithmetic cannot judge: 154 for
    145, or `AAS 72 (1980), 72` where the page repeats the volume and every
    other edition reads 926. Findings whose odd value is ALSO arithmetically
    impossible are marked, because those are already in the section above and
    counting them twice would overstate what the vote is worth."""
    rows = []
    for base, langs in sorted(
        language_groups(corpus, APPARATUS_TYPES, min_editions=3).items()
    ):
        cited = {}
        for lang, work in langs.items():
            notes = {
                str(c.get("marker")): (c.get("text") or "")
                for c in stored_citations(work)
            }
            if notes:
                cited[lang] = notes
        if len(cited) < 3 or len({frozenset(n) for n in cited.values()}) != 1:
            # Not a comparable set of editions. Reported nowhere: a document
            # whose translations carry different apparatus is the normal case
            # here, not a defect, and saying so 140 times is noise.
            continue
        findings = []
        markers = sorted(next(iter(cited.values())), key=_marker_sort)
        for marker in markers:
            printed = {
                lang: tuple(
                    (r["series"], r["volume"], r["year"], r["pages"])
                    for r in series_refs(notes[marker])
                )
                for lang, notes in cited.items()
            }
            printed = {lang: refs for lang, refs in printed.items() if refs}
            if len(printed) < 3:
                continue
            votes = collections.Counter(printed.values())
            modal, support = votes.most_common(1)[0]
            odd = {lang: refs for lang, refs in printed.items() if refs != modal}
            if not odd or len(odd) > 2 or support < 3:
                continue
            findings.append(
                {
                    "marker": marker,
                    "modal": [list(r) for r in modal],
                    "support": support,
                    "of": len(printed),
                    "odd": {
                        lang: [list(r) for r in refs] for lang, refs in odd.items()
                    },
                    "shapes": {
                        lang: series_shape(refs, modal) for lang, refs in odd.items()
                    },
                    "also_impossible": sorted(
                        lang
                        for lang, refs in odd.items()
                        if any(series_fault(r[0], r[1], r[2]) for r in refs)
                    ),
                }
            )
        # Every document COMPARED, findings or none -- the same reason the
        # series rows keep their clean editions. "15 documents have leads" and
        # "15 documents could be compared at all" are different claims, and
        # storing only the first makes the second unrecoverable.
        rows.append({"work": base, "editions": sorted(cited), "findings": findings})
    rows.sort(key=lambda r: -len(r["findings"]))
    return rows


def measure_apparatus(corpus: Path) -> dict:
    return {
        "recall": measure_apparatus_recall(corpus),
        "series": measure_apparatus_series(corpus),
        "vote": measure_apparatus_vote(corpus),
    }


def report_apparatus(measured: dict, limit: int) -> int:
    recall, series, vote = measured["recall"], measured["series"], measured["vote"]
    lost = sum(r["empty"] + len(r["unreached"]) for r in recall)
    print(
        f"{len(recall)} document edition(s) with an apparatus; "
        f"{lost:,} note(s) on the page and not in the corpus.\n"
        "Three questions about one apparatus, and each names a different "
        "culprit: RECALL is ours,\nSERIES is arithmetic on the source, and the "
        "VOTE is the source judged by its own\ntranslations. Reports only; "
        "never gates."
    )
    _report_recall(recall, limit)
    _report_series(series, limit)
    _report_vote(vote, limit)
    # Not gated, for the reason `refs` is not: every finding here is either a
    # source misprint to file or a parser to fix, and neither is a thing a
    # build should stop for. What gates a document is `coverage`'s floor.
    return 0


def _report_recall(recall: list[dict], limit: int) -> None:
    by_state = {
        state: [r for r in recall if r["state"] == state] for state in APPARATUS_STATES
    }
    print("\n  RECALL -- ours. Notes the source prints and the corpus does not.")
    for state in APPARATUS_STATES:
        rows = by_state[state]
        notes = sum(r["empty"] + len(r["unreached"]) for r in rows)
        print(f"    {state:16}{len(rows):5} edition(s){notes:8,} note(s)")
    # A SHARE OF THE LIMIT PER STATE, not the worst rows overall. The three
    # states are ranked by size in the same order every run -- an edition
    # whose whole list went unread has lost more notes than one missing four
    # markers, always -- so a single ranked table shows `list-unread` and
    # nothing else, and the state that is actually one bug away from a fix is
    # never on screen.
    each = max(3, limit // len(APPARATUS_STATES))
    for state in APPARATUS_STATES:
        rows = by_state[state]
        if not rows:
            continue
        print(
            f"\n    {state} -- {'markers found, list not' if state == 'list-unread' else 'list found, markers not' if state == 'markers-unread' else 'some of each'}"
        )
        print(
            f"      {'edition':44}{'stored':>7}{'empty':>7}{'source':>8}{'unreached':>10}"
        )
        for row in rows[:each]:
            print(
                f"      {row['work']:44}{row['stored']:7}{row['empty']:7}"
                f"{row['source_notes']:8}{len(row['unreached']):10}"
            )
        if len(rows) > each:
            print(f"      ... {len(rows) - each} more (raise --limit, or --json)")


def _report_series(series: list[dict], limit: int) -> None:
    faulty = [r for r in series if r["faults"]]
    faults = sum(len(r["faults"]) for r in faulty)
    scanned = sum(r["refs"] for r in series)
    print(
        f"\n  SERIES -- the source. {faults} of {scanned:,} reference(s) cannot be "
        f"what they say,\n  in {len(faulty)} of {len(series)} edition(s) that print "
        "one: a volume of the Acta is its year minus\n  a constant, so each carries "
        "its own check and no sibling edition is needed.\n  A consistent column is a "
        "convention, not a misprint."
    )
    print(f"    {'edition':44}{'bad':>5}{'of':>7}  kinds and an example")
    for row in faulty[:limit]:
        kinds = collections.Counter(f["fault"] for f in row["faults"])
        first = row["faults"][0]
        print(
            f"    {row['work']:44}{len(row['faults']):5}{row['refs']:7}  "
            f"{', '.join(f'{k} {v}' for k, v in sorted(kinds.items()))}"
            f"  e.g. fn{first['marker']} {first['series']} {first['volume']} "
            f"({first['year']})"
        )
    if len(faulty) > limit:
        print(f"    ... {len(faulty) - limit} more (raise --limit, or --json)")


def _report_vote(vote: list[dict], limit: int) -> None:
    shapes = collections.Counter()
    per_edition = collections.defaultdict(collections.Counter)
    for row in vote:
        for find in row["findings"]:
            for lang, shape in find["shapes"].items():
                shapes[shape] += 1
                per_edition[lang][shape] += 1
    leads = sum(v for k, v in shapes.items() if k in SERIES_DEFECT_SHAPES)
    print(
        f"\n  VOTE -- the source, judged by its own translations. "
        f"{len(vote)} document(s) whose editions\n  carry identical marker sets and "
        f"can be compared at all, {sum(shapes.values())} departure(s) from the\n  "
        f"modal reading, {leads} of them a shape no printing convention produces."
    )
    print(f"    {'edition':10}" + "".join(f"{s:>15}" for s in sorted(shapes)))
    for lang in sorted(per_edition, key=lambda x: -sum(per_edition[x].values())):
        counts = per_edition[lang]
        print(
            f"    {lang:10}" + "".join(f"{counts.get(s, 0):15}" for s in sorted(shapes))
        )
    # ROUND-ROBIN OVER THE DOCUMENTS, not document by document. `vote` is
    # ranked by how many departures a document has and the leading one has
    # nine times the next, so a straight walk fills the whole limit with
    # Evangelii Gaudium and never names the other fourteen.
    queues = [
        [
            (row["work"], find, lang, shape)
            for find in row["findings"]
            for lang, shape in sorted(find["shapes"].items())
            if shape in SERIES_DEFECT_SHAPES
        ]
        for row in vote
    ]
    shown = 0
    if leads and limit:
        print("\n  defect leads, edition against the rest:")
    for item in itertools.chain.from_iterable(itertools.zip_longest(*queues)):
        if item is None:
            continue
        if shown >= limit:
            break
        work, find, lang, shape = item
        flag = " (also impossible)" if lang in find["also_impossible"] else ""
        print(
            f"    {work:38} fn{find['marker']:<5}{lang:4}"
            f"{shape:8}{_series_text(find['odd'][lang]):26} vs "
            f"{find['support']:2}x {_series_text(find['modal'])}{flag}"
        )
        shown += 1
    if leads > shown:
        print(f"    ... {leads - shown} more (raise --limit, or --json)")


def _series_text(refs: list) -> str:
    return "; ".join(
        f"{name} {volume} ({year}){', ' + pages if pages else ''}"
        for name, volume, year, pages in refs
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "check",
        choices=[
            "coverage",
            "withheld",
            "toc",
            "balance",
            "divisions",
            "trees",
            "refs",
            "apparatus",
            "all",
        ],
        default="all",
        nargs="?",
    )
    parser.add_argument("--min-coverage", type=float, default=DEFAULT_MIN_COVERAGE)
    parser.add_argument(
        "--limit",
        type=int,
        default=25,
        help="rows in the coverage table, and outliers listed per edition pair",
    )
    parser.add_argument("--json", action="store_true", help="emit measurements as JSON")
    args = parser.parse_args()

    corpus = common.require_corpus()
    # `balance` and `divisions` read no raw pages and no document works, so
    # neither pays for the coverage measurement it never looks at.
    # `balance`, `divisions` and `refs` read no raw pages and no document
    # works, so none pays for the coverage measurement it never looks at.
    # `apparatus` reads raw pages but not the body region, and computes its
    # own.
    skips_coverage = ("balance", "divisions", "trees", "refs", "apparatus")
    rows = measure(corpus) if args.check not in skips_coverage else []

    if args.json:
        if args.check == "balance":
            json.dump(measure_balance(corpus), sys.stdout, indent=2, default=str)
        elif args.check == "divisions":
            json.dump(measure_divisions(corpus), sys.stdout, indent=2, default=str)
        elif args.check == "trees":
            json.dump(measure_trees(corpus), sys.stdout, indent=2, default=str)
        elif args.check == "refs":
            json.dump(measure_refs(corpus), sys.stdout, indent=2, default=str)
        elif args.check == "apparatus":
            json.dump(measure_apparatus(corpus), sys.stdout, indent=2, default=str)
        else:
            json.dump(rows, sys.stdout, indent=2)
        print()
        return 0

    status = 0
    if args.check in ("coverage", "all"):
        status |= report_coverage(rows, args.min_coverage, args.limit)
    if args.check == "all":
        print()
    if args.check in ("withheld", "all"):
        status |= report_withheld(rows)
    if args.check in ("toc", "all"):
        print()
        status |= report_toc(corpus)
    if args.check in ("balance", "all"):
        if args.check == "all":
            print()
        status |= report_balance(measure_balance(corpus), args.limit)
    if args.check in ("divisions", "all"):
        if args.check == "all":
            print()
        status |= report_divisions(measure_divisions(corpus), args.limit)
    if args.check in ("trees", "all"):
        if args.check == "all":
            print()
        status |= report_trees(measure_trees(corpus), args.limit)
    if args.check in ("refs", "all"):
        if args.check == "all":
            print()
        status |= report_refs(measure_refs(corpus), args.limit)
    if args.check in ("apparatus", "all"):
        if args.check == "all":
            print()
        status |= report_apparatus(measure_apparatus(corpus), args.limit)
    return status


if __name__ == "__main__":
    raise SystemExit(main())
