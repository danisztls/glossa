#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Apply a batch of description-sweep returns: descriptions into the site,
ToC oracles into the corpus.

The sweep runs one agent per work, and the two artifacts have different
collision behaviour, which is why applying them is a coordinator's job rather
than each agent's:

  - `site/descriptions.json` is ONE shared file. Concurrent writers collide,
    so agents return their entry and this merges them.
  - `<corpus>/oracles/toc/<work>.json` is one file per work and cannot
    collide -- but it lives in the corpus repo, outside the sandbox's write
    scope, so it is written here too rather than by twelve separate agents
    each needing the sandbox disabled.

Input is a JSON array of agent returns, each `{work, description, headings,
defects, notes}`. Reads stdin or a path.

  ./apply_sweep.py batch3.json
  ./apply_sweep.py batch3.json --dry-run
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import common

REPO_ROOT = Path(__file__).resolve().parents[2]
DESCRIPTIONS = REPO_ROOT / "site" / "descriptions.json"


def validate(entry: dict, corpus: Path) -> list[str]:
    """Refuse anything that would put a wrong claim into the corpus.

    A description invented from a title is the failure this whole procedure
    exists to prevent (`docs/writing-descriptions.md`), and it arrives looking
    exactly like a good one -- so the checks here are structural, and the
    reading itself stays a human judgment.
    """
    problems = []
    work = entry.get("work", "")
    if not (common.build_root(corpus) / work / "manifest.json").exists():
        problems.append(f"{work}: no such work in the corpus")
    description = (entry.get("description") or "").strip()
    if not description:
        problems.append(f"{work}: no description")
    else:
        words = len(description.split())
        if not 25 <= words <= 110:
            problems.append(
                f"{work}: description is {words} words (expected roughly 40-70)"
            )
    headings = entry.get("headings")
    if headings is None:
        problems.append(
            f"{work}: no headings key (an empty list is the valid 'no divisions' answer)"
        )
    else:
        for node in headings:
            if not node.get("title"):
                problems.append(f"{work}: a heading has no title")
            if node.get("before") is not None and not isinstance(node["before"], int):
                problems.append(
                    f"{work}: heading {node.get('title')!r} has non-integer `before`"
                )
    return problems


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument(
        "batch", nargs="?", help="JSON array of agent returns; default stdin"
    )
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--read-on", default="", help="ISO date the batch was read")
    args = ap.parse_args()

    raw = Path(args.batch).read_text() if args.batch else sys.stdin.read()
    entries = json.loads(raw)
    corpus = common.require_corpus()

    problems = [p for entry in entries for p in validate(entry, corpus)]
    if problems:
        print("REFUSED — fix these first:")
        for line in problems:
            print(f"  {line}")
        return 1

    doc = json.loads(DESCRIPTIONS.read_text())
    descriptions = doc.setdefault("descriptions", {})
    oracle_dir = corpus / "oracles" / "toc"

    for entry in entries:
        work = entry["work"]
        already = work in descriptions
        descriptions[work] = entry["description"].strip()
        family, slug, lang = work.split(".")
        oracle = {
            "work": work,
            "read_on": entry.get("read_on") or args.read_on,
            "source": f"raw/vatican-docs/{family}__{slug}__{lang}.html",
            "headings": entry["headings"],
        }
        if not args.dry_run:
            oracle_dir.mkdir(parents=True, exist_ok=True)
            (oracle_dir / f"{work}.json").write_text(
                json.dumps(oracle, indent="\t", ensure_ascii=False) + "\n"
            )
        print(
            f"{'would apply' if args.dry_run else 'applied'} {work}: "
            f"{'REPLACED description' if already else 'description'}, "
            f"{len(entry['headings'])} heading(s), "
            f"{len(entry.get('defects') or [])} defect(s)"
        )

    if not args.dry_run:
        DESCRIPTIONS.write_text(json.dumps(doc, indent="\t", ensure_ascii=False) + "\n")
    print(f"\n{len(descriptions)} descriptions total.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
