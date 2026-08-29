#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The rebuild recipe, as a program rather than as prose in another repository.

    ./rebuild.py                     # the whole corpus, ~50s, zero network
    ./rebuild.py --list              # the stages, in order, with what they write
    ./rebuild.py --only bible        # one group
    ./rebuild.py --only ccc,summa    # or named stages
    ./rebuild.py --no-images         # skip dore's AVIF re-encode (minutes)
    ./rebuild.py --dry-run           # print the commands and stop

WHY THIS EXISTS. `build/` is generated and untracked, so the recipe that
produces it is the only way back to it, and until now the recipe was a
seventeen-line `sh` block in `glossa-corpus/README.md`. Nothing executes a
README, so nothing checks one, and `CLAUDE.md` already records the class of
failure that follows -- three separate instances of it:

  - the block named pre-reorganisation paths in six of eight commands and
    omitted four works, so a rebuild produced 369 of 383 and reported nothing
    wrong;
  - `dore.py` was ingested and never added, so a rebuild produced a Bible with
    no illustrations;
  - `--exhortations` was an opt-in flag no line passed, so 33 documents sat in
    `raw/` with no work directory and nothing anywhere saying so.

A fourth was found while this file was being written, and it is the one that
decided how the language list below is computed. See PHASE 2'S LANGUAGES.

WHAT THIS IS NOT. It is not a build system and must not become one. There is
no dependency graph, no staleness comparison and no caching, because each
scraper already does the only two things such a graph would buy: a cached
`raw/` means re-running fetches nothing, and `common.write_stamped_json` means
re-running rewrites nothing it did not change. The whole recipe over an
up-to-date corpus writes zero files. This is a list, in order, with a clock on
it -- the value is that the list is executable, not that it is clever.

PHASE 2'S LANGUAGES ARE DERIVED, NOT WRITTEN DOWN. The README's line carried
a hand-maintained 25-code `--langs` list, and on 2026-08-29 that list was
short: `sw` had been added to `DIVISIONS` hours earlier for the Vatican II
mirror and never added here, so phase 2 had never once asked vatican.va for a
Swahili edition of anything. Three exist -- `pacem`, `africae-munus` and
`amoris-laetitia` -- and this is the half of the failure worth taking
seriously: a hand-written list does not merely leave cached pages unparsed,
it decides what is ever CAPTURED, so `raw/`'s completeness silently depended
on a list somebody typed. The project's insurance is that any regret is fixed
by re-parsing rather than re-crawling (`docs/link-surface.md`), and that
insurance does not cover a page nobody asked for.

`DIVISIONS` is this parser's statement of which languages it can read, so
asking it is the difference between a list that is correct and a list that was
correct when it was typed. Naming a language is cheap rather than free:
`--offered-only` skips one the document's own switcher does not name without a
request, but it falls back to asking where the base-language page is not
cached, which is what it must do to be unable to lose an edition. Adding `sw`
cost 23 requests -- the three editions, and 20 definitive 404s now in
`pipeline/absent-sources.json` and so never asked again.

EXIT CODES. Every stage exits 0 on a clean run, and a nonzero one here means
a stage said something went wrong. That was not true when this file was
written: `vatii` and `encyclicals` exited 1 on every run they had ever had,
because both gated on the cross-language symmetry check, which is chronically
FAIL by design. They now gate on `pipeline/parse-baseline.json` instead --
"did this run go worse than the state we wrote down" rather than "is the
corpus perfect" -- and symmetry is printed as the report it always was.

READ THE `wrote` COLUMN ANYWAY. The gate is a floor under the parse's
ADDRESSES and not under its structure: `validate_document` never reads
`structure.json`, so a change that silently rewrites every division in the
corpus passes it. `wrote` is what shows you that a stage moved something, and
it is the number to check after any parser change.
"""

from __future__ import annotations

import argparse
import subprocess
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

PIPELINE = Path(__file__).resolve().parent
SCRAPERS = PIPELINE / "scrapers"

# For DIVISIONS. Same `sys.path` line every scraper in a subdirectory carries,
# and for the same reason -- see CLAUDE.md, "The scrapers' layout".
sys.path.insert(0, str(SCRAPERS))

import vatican_docs as V  # noqa: E402
from common import build_root  # noqa: E402

#: Every language `vatican_docs` has division labels for. Derived rather than
#: listed; see PHASE 2'S LANGUAGES above.
PHASE2_LANGS = ",".join(sorted(V.DIVISIONS))


@dataclass(frozen=True)
class Stage:
    name: str
    group: str
    script: str
    args: tuple[str, ...] = ()
    writes: str = ""
    #: Dropped by --no-images. Only dore has one, and only because its
    #: --derive re-encodes 482 AVIFs from 241 masters and takes minutes where
    #: every other stage takes seconds.
    heavy: tuple[str, ...] = field(default_factory=tuple)

    def argv(self, *, images: bool) -> list[str]:
        args = list(self.args) + (list(self.heavy) if images else [])
        return ["uv", "run", str(SCRAPERS / self.script), *args]


# In the order the README's block ran them. The Bibles are independent of each
# other and of everything else; `vatii` and `encyclicals` are last but one
# because they are the slowest parse, and `dore` is last because of --derive.
STAGES: tuple[Stage, ...] = (
    Stage("ccc", "catechism", "ccc/ccc.py", writes="ccc.* (8 editions)"),
    Stage(
        "compendium",
        "catechism",
        "ccc/compendium.py",
        writes="compendium.* (10 editions)",
    ),
    Stage("prayers", "prayers", "prayers.py", writes="prayer.common.* (4)"),
    Stage("cpdv", "bible", "bible/cpdv.py", ("--offline",), "bible.cpdv.en"),
    Stage(
        "clementina", "bible", "bible/vulgate.py", ("--offline",), "bible.clementina.la"
    ),
    Stage(
        "matos-soares", "bible", "bible/matos_soares.py", writes="bible.matos-soares.pt"
    ),
    Stage(
        "douay-rheims",
        "bible",
        "bible/douay_rheims.py",
        ("--offline",),
        "bible.douay-rheims.en",
    ),
    Stage(
        "bible-intro",
        "bible",
        "bible/introductions.py",
        ("--offline",),
        "bible-intro.en",
    ),
    Stage("allioli", "bible", "bible/allioli.py", writes="bible.allioli.de"),
    Stage("martini", "bible", "bible/martini.py", writes="bible.martini.it"),
    Stage("kaldi", "bible", "bible/kaldi.py", writes="bible.kaldi.hu"),
    Stage("crampon", "bible", "bible/crampon.py", writes="bible.crampon.fr"),
    Stage(
        "straubinger", "bible", "bible/straubinger.py", writes="bible.straubinger.es"
    ),
    Stage("summa", "summa", "summa/summa.py", ("--lang", "both"), "summa.en, summa.la"),
    Stage(
        "vatii",
        "documents",
        "vatican_docs.py",
        ("phase1", "--lang", "all"),
        "vatii.* (16 documents)",
    ),
    Stage(
        "encyclicals",
        "documents",
        "vatican_docs.py",
        ("phase2", "--exhortations", "--offered-only", "--langs", PHASE2_LANGS),
        "encyclical.*, exhortation.*",
    ),
    # `plates.json` alone is under a second; --derive is the image pipeline.
    Stage("dore", "images", "dore/dore.py", writes="dore.tours", heavy=("--derive",)),
)


def select(only: str | None) -> list[Stage]:
    """The named stages and groups, kept in recipe order.

    An unknown name is an error rather than an empty run: `--only bibles` is a
    typo a silent no-op would report as a successful rebuild."""
    if not only:
        return list(STAGES)
    wanted = [x.strip() for x in only.split(",") if x.strip()]
    names = {s.name for s in STAGES} | {s.group for s in STAGES}
    unknown = [w for w in wanted if w not in names]
    if unknown:
        raise SystemExit(
            f"no such stage or group: {', '.join(unknown)}\n"
            f"stages: {', '.join(s.name for s in STAGES)}\n"
            f"groups: {', '.join(sorted({s.group for s in STAGES}))}"
        )
    return [s for s in STAGES if s.name in wanted or s.group in wanted]


def snapshot(root: Path) -> dict[Path, float]:
    """Every corpus file with its mtime.

    This is what makes `wrote` a real measurement rather than a guess. It is
    only meaningful because `write_stamped_json` leaves an unchanged file
    untouched -- against a scraper that rewrote its output every run it would
    report the whole corpus on every stage, which is precisely the state that
    guard was added to end."""
    try:
        return {p: p.stat().st_mtime for p in root.rglob("*") if p.is_file()}
    except OSError:
        return {}


def changed(before: dict[Path, float], after: dict[Path, float]) -> int:
    return sum(1 for p, t in after.items() if before.get(p) != t)


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument(
        "--only",
        help="comma-separated stage or group names; default: every stage. "
        "Groups: " + ", ".join(sorted({s.group for s in STAGES})),
    )
    ap.add_argument("--list", action="store_true", help="the stages, and stop")
    ap.add_argument(
        "--dry-run", action="store_true", help="print the commands, run nothing"
    )
    ap.add_argument(
        "--no-images",
        action="store_true",
        help="run dore.py without --derive: plates.json in under a second "
        "instead of a re-encode of 482 AVIFs, which is what you want when "
        "images/ is already there",
    )
    args = ap.parse_args()

    stages = select(args.only)
    images = not args.no_images

    if args.list:
        width = max(len(s.name) for s in STAGES)
        for s in STAGES:
            mark = "  " if s in stages else "- "
            print(f"{mark}{s.name:<{width}}  {s.group:<10}  {s.writes}")
        return 0

    if args.dry_run:
        for s in stages:
            print(" ".join(s.argv(images=images)))
        return 0

    # Fail before a scraper creates a phantom corpus somewhere nobody looks;
    # each of them checks this too, but reporting it once up front beats
    # reporting it seventeen times.
    root = build_root()
    root.parent.mkdir(parents=True, exist_ok=True)

    results: list[tuple[Stage, int, float, int]] = []
    for i, s in enumerate(stages, 1):
        argv = s.argv(images=images)
        print(f"\n\033[1m[{i}/{len(stages)}] {s.name}\033[0m  {' '.join(argv[2:])}")
        before = snapshot(root)
        t0 = time.monotonic()
        code = subprocess.run(argv).returncode
        elapsed = time.monotonic() - t0
        results.append((s, code, elapsed, changed(before, snapshot(root))))

    print("\n=== rebuild ===")
    width = max(len(s.name) for s, _, _, _ in results)
    for s, code, elapsed, wrote in results:
        status = "ok" if code == 0 else f"exit {code}"
        print(f"  {s.name:<{width}}  {elapsed:6.1f}s  {wrote:5d} wrote  {status}")
    total = sum(e for _, _, e, _ in results)
    print(
        f"  {'total':<{width}}  {total:6.1f}s  {sum(w for *_, w in results):5d} wrote"
    )

    failed = [s.name for s, code, _, _ in results if code != 0]
    if failed:
        # Expected for the two document stages; see EXIT CODES, HONESTLY.
        print(f"\nnonzero exit: {', '.join(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
