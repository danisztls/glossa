#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Corpus audits that compare `raw/` against `works/` -- the checks that ask
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

  ./audit.py coverage            # ranked table, worst first
  ./audit.py withheld            # marker vs unpublished.json
  ./audit.py toc                 # parsed structure vs the read oracle
  ./audit.py balance             # cross-language text-length symmetry
  ./audit.py all                 # all four; exit 1 if any gates
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
        for field in ("ident", "title", "subtitle"):
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
        work = corpus / "works" / work_id
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
    `ident`/`title`/`subtitle` where it can, and a reader writing the oracle
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
            (node.get(f) or "").strip() for f in ("ident", "title", "subtitle")
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
        if title in parsed_by and nodes[0].get("level") is not None:
            got_level = parsed_by[title][0].get("level")
            if got_level is not None:
                deltas[got_level - nodes[0]["level"]] += 1
    offset = deltas.most_common(1)[0][0] if deltas else 0
    if offset and len(deltas) == 1:
        problems.append(
            f"OFFSET   every matched heading is parsed {offset:+d} level(s) -- one finding"
        )
    elif offset:
        problems.append(
            f"OFFSET   most headings are parsed {offset:+d} level(s); outliers below"
        )

    for title, nodes in read_by.items():
        if title not in parsed_by:
            continue
        want, got = nodes[0], parsed_by[title][0]
        if want.get("level") is None or got.get("level") is None:
            continue
        if got["level"] - want["level"] != offset:
            problems.append(
                f"LEVEL    {want.get('title')!r}: read {want['level']}, parsed {got['level']}"
                f" (others {offset:+d})"
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
    sections = corpus / "works" / work_id / "sections.json"
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
        structure = corpus / "works" / work_id / "structure.json"
        if not structure.exists():
            print(f"{work_id}: oracle present but no structure.json")
            failing += 1
            continue
        manifest = json.loads(
            (corpus / "works" / work_id / "manifest.json").read_text()
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
        return {
            p["slug"]: " ".join(
                [p.get("title") or "", p.get("rubric") or ""]
                + [b.get("text") or "" for b in p["blocks"]]
                + [
                    item.get("title", "") + " " + item.get("meditation", "")
                    for group in (p.get("groups") or [])
                    for item in group["items"]
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
    for work in sorted((corpus / "works").iterdir()):
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


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "check",
        choices=["coverage", "withheld", "toc", "balance", "all"],
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
    # `balance` reads no raw pages and no document works, so it does not pay
    # for the coverage measurement it never looks at.
    rows = measure(corpus) if args.check != "balance" else []

    if args.json:
        if args.check == "balance":
            json.dump(measure_balance(corpus), sys.stdout, indent=2, default=str)
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
    return status


if __name__ == "__main__":
    raise SystemExit(main())
