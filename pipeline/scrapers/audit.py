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

  ./audit.py coverage            # ranked table, worst first
  ./audit.py withheld            # marker vs unpublished.json
  ./audit.py toc                 # parsed structure vs the read oracle
  ./audit.py all                 # all three; exit 1 if any gates
"""

from __future__ import annotations

import argparse
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
        region = (
            html[testo.start() : testo.start() + end.start()]
            if end
            else html[testo.start() :]
        )
    else:
        region = html[V.find_content_start_old_shell(html) :]
    fn_start, _evidence = V.find_footnote_region_start(region)
    return region if fn_start is None else region[:fn_start]


def stored_text_len(work: Path) -> int:
    """Text we kept from the body: section blocks plus the structure tree.

    Headings count. The parser lifts a heading out of the prose and into
    `structure.json`, so charging it as missing would report every correctly
    parsed document as lossy.
    """
    total = 0
    sections = json.loads((work / "sections.json").read_text())
    for section in sections:
        for block in section["blocks"]:
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
                in (json.loads((work / "manifest.json").read_text()).get("notes") or ""),
            }
        )
    rows.sort(key=lambda r: r["coverage"])
    return rows


def read_toc_oracles(corpus: Path) -> dict[str, list[dict]]:
    """Hand-read tables of contents, keyed by work id.

    Lives in the corpus repo rather than this one because its content is
    verbatim heading text from the source documents, which is the reason the
    corpus is private (docs/decisions.md, 2026-08-23).
    """
    root = corpus / "oracles" / "toc"
    if not root.exists():
        return {}
    out = {}
    for path in sorted(root.glob("*.json")):
        out[path.stem] = json.loads(path.read_text())["headings"]
    return out


def compare_toc(read: list[dict], parsed: list[dict]) -> list[str]:
    """Differences between a read ToC and the parsed structure tree.

    Titles are compared on normalized text: the parser splits a heading into
    `ident`/`title`/`subtitle` where it can, and a reader writing the oracle
    should not have to guess that split, so both sides are flattened first.
    """
    def flat(node):
        joined = " ".join(
            (node.get(f) or "").strip() for f in ("ident", "title", "subtitle")
        )
        return re.sub(r"\s+", " ", joined).strip().casefold()

    problems = []
    read_by, parsed_by = {}, {}
    for node in read:
        read_by.setdefault(flat(node), []).append(node)
    for node in parsed:
        parsed_by.setdefault(flat(node), []).append(node)

    for title in read_by:
        if title not in parsed_by:
            node = read_by[title][0]
            problems.append(f"MISSING  before={node.get('before')}  {node.get('title')!r}")
    for title in parsed_by:
        if title not in read_by:
            node = parsed_by[title][0]
            problems.append(f"EXTRA    before={node.get('before')}  {node.get('title')!r}")
    for title, nodes in read_by.items():
        if title not in parsed_by:
            continue
        want, got = nodes[0], parsed_by[title][0]
        if want.get("level") is not None and want["level"] != got.get("level"):
            problems.append(
                f"LEVEL    {want.get('title')!r}: read {want['level']}, parsed {got.get('level')}"
            )
        if want.get("before") is not None and want["before"] != got.get("before"):
            problems.append(
                f"POSITION {want.get('title')!r}: read before \u00a7{want['before']}, "
                f"parsed before \u00a7{got.get('before')}"
            )
    return problems


def report_toc(corpus: Path) -> int:
    oracles = read_toc_oracles(corpus)
    if not oracles:
        print("No ToC oracles yet (<corpus>/oracles/toc/). Nothing to compare.")
        return 0
    failing = 0
    for work_id, read in sorted(oracles.items()):
        structure = corpus / "works" / work_id / "structure.json"
        if not structure.exists():
            print(f"{work_id}: oracle present but no structure.json")
            failing += 1
            continue
        problems = compare_toc(read, json.loads(structure.read_text()))
        if problems:
            failing += 1
            print(f"\n{work_id}: {len(problems)} difference(s), {len(read)} headings read")
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
    bands = [(0, 0.5, "<50%"), (0.5, 0.8, "50-80%"), (0.8, 0.9, "80-90%"),
             (0.9, 0.95, "90-95%"), (0.95, 9, ">=95%")]
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
        print(f"\nFAIL: {len(failures)} published work(s) below {floor * 100:.0f}% coverage:")
        for row in failures:
            print(f"  {row['work']}  {row['coverage'] * 100:.1f}%")
        return 1
    print(f"\nOK: every published work is at or above {floor * 100:.0f}% coverage.")
    return 0


def report_withheld(rows: list[dict]) -> int:
    withheld = withheld_ids()
    defeated = {r["work"] for r in rows if r["defeated"]}
    published_defeats = sorted(defeated - withheld)
    print(f"{len(defeated)} work(s) marked {DEFEAT_MARKER!r}; {len(withheld)} withheld.\n")
    if published_defeats:
        print(f"FAIL: {len(published_defeats)} work(s) report a defeated parse and are published:")
        by_id = {r["work"]: r for r in rows}
        for work_id in published_defeats:
            row = by_id[work_id]
            print(f"  {work_id:44} {row['coverage'] * 100:5.1f}% coverage, {row['sections']} sections")
        return 1
    print("OK: every defeated parse is withheld.")
    # Not gated in reverse: a work may be withheld for reasons the parser has
    # no marker for (rights, or a defect found by eye), so withheld-but-not-
    # defeated is expected and says nothing.
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "check", choices=["coverage", "withheld", "toc", "all"], default="all", nargs="?"
    )
    parser.add_argument("--min-coverage", type=float, default=DEFAULT_MIN_COVERAGE)
    parser.add_argument("--limit", type=int, default=25, help="rows in the coverage table")
    parser.add_argument("--json", action="store_true", help="emit measurements as JSON")
    args = parser.parse_args()

    corpus = common.require_corpus()
    rows = measure(corpus)

    if args.json:
        json.dump(rows, sys.stdout, indent=2)
        print()
        return 0

    status = 0
    if args.check in ("coverage", "all"):
        status |= report_coverage(rows, args.min_coverage, args.limit)
    if args.check in ("all",):
        print()
    if args.check in ("withheld", "all"):
        status |= report_withheld(rows)
    if args.check in ("toc", "all"):
        print()
        status |= report_toc(corpus)
    return status


if __name__ == "__main__":
    raise SystemExit(main())
