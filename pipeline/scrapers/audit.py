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

WHERE IT DOES NOT APPLY, both established by measuring rather than by
assumption:

  - **Documents.** A section number is not the same section in both
    editions. `mediator-dei` EN section 23 is PT sections 21-22; the
    numbering drifts wherever a translation splits or joins a paragraph,
    and `check-symmetry` passes because both editions have the same COUNT.
    Comparing 8,942 units across the 103 EN/PT document pairs put 650 of
    them outside the band -- 7.3%, against one unit in 6,154 for the types
    kept -- and the ones inspected were all drift. Document truncation is
    what `coverage` above is for, and it is the better instrument: it needs
    no sibling edition and says how much was lost.
  - **The Bible.** 95 outliers in 35,743 verses (cpdv.en against
    clementina.la), concentrated in Esther -- which is the documented
    versification divergence, not a defect (docs/research/bible-edition-
    divergence.md). Reading verse-shape asymmetry as a defect there is the
    specific mistake CLAUDE.md warns against.

It reports and never fails, the same footing as the Summa's cross-language
oracle -- but unlike that one, its findings have not all been the edition
speaking. Its first run produced four, and three were defects it was the
only thing that could see: `ccc.en` ¶2051 had swallowed the Ten Commandments
table (14.9x), `ccc.en` ¶2436 was missing the opening sentence the mirror
never printed (0.49x), and `summa.en` III q. 26 a. 2 had a 5,150-character
editorial note stored as the continuation of `ad 3` (2.35x). All three were
fixed on 2026-08-25 (docs/decisions.md §Oracles).

What is left is the noise floor, and it is worth naming so nobody re-opens
it: `ccc.en` ¶230 at 2.12x prints its Augustine citation inline where the
Portuguese footnotes it. Gating is still not offered, because the band that
would clear that row is wide enough to have missed ¶2436 anyway -- the value
here is a short list somebody reads, not a build that stops.

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

  ./audit.py coverage            # ranked table, worst first
  ./audit.py withheld            # marker vs unpublished.json
  ./audit.py toc                 # parsed structure vs the read oracle
  ./audit.py balance             # cross-language text-length symmetry
  ./audit.py divisions           # cross-language structure-tree symmetry
  ./audit.py refs                # cross-language reference-apparatus symmetry
  ./audit.py all                 # all six; exit 1 if any gates
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


def body_region(html: str) -> str:
    """The document's body, delimited exactly as `parse_document` delimits it.

    Kept in step with `parse_document` by copying its shell sniff rather than
    calling it: the parser raises on stub pages and does a great deal of work
    we do not want here. If the two ever drift, coverage reads low across the
    board rather than subtly -- the failure is loud.
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
    return region if fn_start is None else region[:fn_start]


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
    corpus is private (docs/decisions.md §The corpus).
    """
    root = corpus / "oracles" / "toc"
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
#: docstring for what was measured to leave `document` and `bible` out.
BALANCE_TYPES = ("catechism", "compendium", "prayer", "summa")

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
    part/question/article triple. It is compared for equality and nothing
    else, so its shape only has to be stable across editions."""
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


def language_groups(corpus: Path) -> dict[str, dict[str, Path]]:
    """`base work id -> {language tag: work directory}`, for the comparable
    types only. The language is the last dot-component of the work id and
    may carry a region (`prayer.common.en-gb`)."""
    groups: dict[str, dict[str, Path]] = collections.defaultdict(dict)
    for work in sorted((common.build_root(corpus)).iterdir()):
        manifest = work / "manifest.json"
        if not work.is_dir() or not manifest.exists():
            continue
        if json.loads(manifest.read_text()).get("type") not in BALANCE_TYPES:
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
        base, _, lang = work.name.rpartition(".")
        if base and lang:
            groups[base][lang] = work
    return {base: langs for base, langs in groups.items() if len(langs) > 1}


def balance_pair(a_texts: dict, b_texts: dict) -> dict | None:
    """One edition pair measured: the median length ratio between them, and
    every unit whose own ratio departs from it.

    A unit stored empty on one side and not the other is reported separately
    rather than as an infinite ratio -- it is the same finding at its limit,
    and it is the one shape where the number would say nothing."""
    shared = [k for k in a_texts if k in b_texts]
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
        "median": median,
        "only_a": sorted((k for k in a_texts if k not in b_texts), key=str),
        "only_b": sorted((k for k in b_texts if k not in a_texts), key=str),
        "empty": sorted(
            (k for k in shared if bool(a_texts[k]) != bool(b_texts[k])), key=str
        ),
        "outliers": [r for r in rows if r[0] < BALANCE_LOW or r[0] > BALANCE_HIGH],
        "range": (rows[0][0], rows[-1][0]),
    }


def measure_balance(corpus: Path) -> list[dict]:
    rows = []
    for base, langs in sorted(language_groups(corpus).items()):
        work_type = json.loads(
            (next(iter(langs.values())) / "manifest.json").read_text()
        )["type"]
        texts = {}
        for lang, work in langs.items():
            got = unit_texts(work, work_type)
            if got is not None:
                texts[lang] = got
        for a, b in itertools.combinations(sorted(texts), 2):
            measured = balance_pair(texts[a], texts[b])
            if measured is not None:
                rows.append({"work": base, "a": a, "b": b, **measured})
    return rows


def report_balance(rows: list[dict], limit: int) -> int:
    total = sum(r["outliers"].__len__() for r in rows)
    print(
        f"{len(rows)} edition pair(s) compared, "
        f"{sum(r['compared'] for r in rows):,} units, {total} outside "
        f"[{BALANCE_LOW}, {BALANCE_HIGH}]x the pair's own median.\n"
    )
    for row in rows:
        lo, hi = row["range"]
        print(
            f"{row['work']}  {row['a']}:{row['b']}  {row['compared']:,} units, "
            f"median {row['median']:.2f}x, skew {lo:.2f}-{hi:.2f}"
        )
        for key, label in (("only_a", row["a"]), ("only_b", row["b"])):
            if row[key]:
                print(
                    f"    {len(row[key])} unit(s) in {label} only: "
                    f"{', '.join(str(k) for k in row[key][:8])}"
                    f"{' ...' if len(row[key]) > 8 else ''}"
                )
        for key in row["empty"]:
            print(f"    EMPTY   {key}: stored on one side only")
        for skew, key, a_len, b_len in row["outliers"][:limit]:
            print(
                f"    {'SHORT' if skew < 1 else 'LONG ':7} {skew:6.2f}x  {key!s:<14} "
                f"{row['a']} {a_len:6,}c  {row['b']} {b_len:6,}c"
            )
        if len(row["outliers"]) > limit:
            print(f"    ... {len(row['outliers']) - limit} more")
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
            "refs",
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
    rows = measure(corpus) if args.check not in ("balance", "divisions", "refs") else []

    if args.json:
        if args.check == "balance":
            json.dump(measure_balance(corpus), sys.stdout, indent=2, default=str)
        elif args.check == "divisions":
            json.dump(measure_divisions(corpus), sys.stdout, indent=2, default=str)
        elif args.check == "refs":
            json.dump(measure_refs(corpus), sys.stdout, indent=2, default=str)
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
    if args.check in ("refs", "all"):
        if args.check == "all":
            print()
        status |= report_refs(measure_refs(corpus), args.limit)
    return status


if __name__ == "__main__":
    raise SystemExit(main())
