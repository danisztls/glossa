#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The rebuild recipe, as a program rather than as prose in another repository.

    ./rebuild.py                     # the whole corpus, ~19s, zero network
    ./rebuild.py --list              # the stages, with what each writes
    ./rebuild.py --only bible        # one group
    ./rebuild.py --only ccc,summa    # or named stages
    ./rebuild.py --no-images         # skip dore's AVIF re-encode (minutes)
    ./rebuild.py --dry-run           # print the commands and stop
    ./rebuild.py --jobs 1            # one stage at a time, output streamed

    ./rebuild.py --changed-only      # ...only the stages whose inputs moved
    ./rebuild.py --changed-only -v   # ...and say what moved under each

THE LOOP THIS IS FOR is `--changed-only` while a parser is being worked on:
editing `bible/martini.py` runs one stage and takes 2s, editing
`vatican_docs.py` runs two and takes 18s, and changing nothing at all takes
0.5s. All three used to take 50.

WHY THIS EXISTS. `build/` is generated and untracked, so the recipe that
produces it is the only way back to it, and until 2026-08-29 the recipe was a
seventeen-line `sh` block in `glossa-corpus/README.md`. Nothing executes a
README, so nothing checks one, and `CLAUDE.md` records the class of failure
that follows -- four separate instances of it, the fourth found while this
file was being written. See PHASE 2'S LANGUAGES.

WHAT THIS IS NOT. It is not a build system and must not become one. There is
no dependency graph between stages, no partial output, and nothing that
rebuilds half of one. `--changed-only` is a staleness comparison, which is one
of the things a build system does, and the two paragraphs below are the whole
of what it claims; the DEFAULT is still to run every stage, because a run that
skips something is only as good as its list of inputs.

WHAT MAKES THE DEFAULT AFFORDABLE. Re-running fetches nothing and rewrites
nothing it did not change (`common.write_stamped_json`), so a full rebuild
over an up-to-date corpus writes zero files -- and every stage's own fetch
counter reads `network fetches this run: 0`, which is the check to run when
that claim is in doubt. What it does spend is CPU: about 180 core-seconds of
re-parsing, which is ~19s of wall clock at `--jobs 4` and ~50s at `--jobs 1`.
That is the number `--changed-only` and `--jobs` exist to reduce, and the
reason neither is needed for correctness.

ZERO NETWORK IS ENFORCED WHERE A SCRIPT CAN SAY SO AND ASSUMED EVERYWHERE
ELSE. Six of the sixteen scripts take `--offline`, and this recipe now passes
it to every one of them; the other ten simply find every page in `raw/` and so
ask for nothing. That is a property of the corpus being complete rather than
of the recipe, which is a weaker guarantee than it looks: `--offline` is one
field on `common.Fetcher` and adding the flag to a scraper that lacks it is a
few lines. Until then, the counter each stage prints is the evidence.

WHAT `--changed-only` COVERS. A stage is skipped when every fingerprint
matches the one recorded the last time it ran and exited 0:

  - `code`: the exact import closure of its script, by CONTENT. Computed by
    reading the imports, not by a table -- `bible/cpdv.py` reaches
    `bible/sacredbible.py` and all twelve modules of `common/`, and a new
    import is picked up the day it is written.
  - `data`: every non-Python file under `pipeline/` -- corrections,
    overrides, the three ledgers, `common/book_forms.json`,
    `bible/inventories/`. Global rather than per stage, because these change
    rarely and a whole rebuild when one moves costs less than a wrong answer
    about which stage reads which.
  - `corpus`: the size and mtime of every file in `raw/`.
  - `outputs`: the size and mtime of everything under this stage's own work
    directories, so a `build/` that was deleted, edited or half-written by an
    interrupted run cannot be skipped over.
  - `readers`: the CONTENT of every external program the stage shells out to
    (`Stage.binaries` -- `avifenc` for dore, poppler and MuPDF for the
    Compendium's PDF editions). Only stages that name one carry this part.
    A system binary is an input none of the four above can see, and unlike
    the PEP 723 case below it is upgraded by the package manager rather than
    deliberately, so nobody is present to think "that changed a parse".

WHAT IT DOES NOT COVER: the Python environment. `uv` resolves each script's
PEP 723 header at run time, and a `bs4` or `httpx` upgrade can change a parse
without changing a byte in this repository. That is the one input a `--force`
is for. It is also why the fingerprints are recorded per stage rather than
per corpus: a stale record can only ever cost one stage's worth of trust.

WHY THE STAGES CAN OVERLAP. `--jobs` runs whole stages at once, which is safe
because each writes work directories no other stage names -- `--list` prints
the globs, and the `wrote` column is measured over those and nothing else. The
two document stages were the exception until 2026-08-29: both take
`vatican_docs.py`'s crawl lock, so they could only run one after the other,
and between them that is eleven idle seconds on a sixteen-core machine, since
phase 1 keeps three cores busy and phase 2 eight. Both now run `--offline`,
which makes the recipe's zero-network promise enforced rather than asserted
and narrows the lock to one per phase; see `V.run_lock_path`.

THE PARTITION IS ABOUT WRITES, AND ONE STAGE READS ANOTHER'S. `haydock` is a
commentary on `bible.douay-rheims.en` and takes both its crawl plan and its
validation oracle from that edition's parsed output, so it is the first stage
here with a `needs`. `waves` is what honours it; everything else in `STAGES`
still depends on nothing but `raw/`.

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
it is the number to check after any parser change. It is also the reason
`--changed-only` prints what it skipped rather than staying quiet about it: a
column of zeros and a column of skips do not mean the same thing.
"""

from __future__ import annotations

import argparse
import ast
import contextlib
import hashlib
import json
import os
import subprocess
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

PIPELINE = Path(__file__).resolve().parent
SCRAPERS = PIPELINE / "scrapers"

# For DIVISIONS. Same `sys.path` line every scraper in a subdirectory carries,
# and for the same reason -- see CLAUDE.md, "The scrapers' layout".
sys.path.insert(0, str(SCRAPERS))

import vatican_docs as V  # noqa: E402
from common import binary_identity, build_root, corpus_dir, raw_root  # noqa: E402

#: Every language `vatican_docs` has division labels for. Derived rather than
#: listed; see PHASE 2'S LANGUAGES above.
PHASE2_LANGS = ",".join(sorted(V.DIVISIONS))

#: Beside the `build/` it describes rather than inside it, so that listing the
#: corpus's works still lists only works. Deleting `build/` does not delete it,
#: which is why the `outputs` fingerprint exists: the record then describes
#: work directories that are gone, and every stage runs.
STATE_PATH = corpus_dir() / ".rebuild-state.json"

STATE_COMMENT = [
    "What each stage's inputs looked like the last time it ran and exited 0.",
    "Written by pipeline/rebuild.py; read only by --changed-only. Generated,",
    "untracked, and safe to delete -- losing it costs one full rebuild.",
]

#: Caches and editor droppings: they change without anything changing.
IGNORED_DIRS = frozenset(
    {"__pycache__", ".ruff_cache", ".mypy_cache", ".pytest_cache", ".git"}
)


@dataclass(frozen=True)
class Stage:
    name: str
    group: str
    script: str
    args: tuple[str, ...] = ()
    #: Work-id globs under `build/`. The stage's whole footprint in the
    #: corpus: what `wrote` is measured over, what `--changed-only` checks is
    #: still there, and what makes running two stages at once safe. A stage
    #: that wrote outside these would be measured as writing nothing.
    outputs: tuple[str, ...] = ()
    #: Dropped by --no-images. Only dore has one, and only because its
    #: --derive re-encodes 482 AVIFs from 241 masters and takes minutes where
    #: every other stage takes seconds.
    heavy: tuple[str, ...] = field(default_factory=tuple)
    #: Stage names whose OUTPUT this one reads. Empty for all but `haydock`;
    #: see WHY THE STAGES CAN OVERLAP above for why this had to exist at all,
    #: and `waves` for what it does to the schedule. A dependency that is not
    #: in this run is not waited for -- `--only haydock` is a legitimate thing
    #: to ask for over a corpus that already holds the annotated edition, and
    #: the scraper itself dies with the path it tried when it does not.
    needs: tuple[str, ...] = field(default_factory=tuple)
    #: External programs this stage's parse depends on, by name on PATH.
    #: Folded into the fingerprint as `readers`, because a system binary is
    #: an input none of the other four can see and is upgraded by the package
    #: manager rather than deliberately -- so unlike the PEP 723 case that
    #: `--force` covers, nobody is present to think "that changed a parse".
    #: See `common/binaries.py` for why identity is the file's content.
    binaries: tuple[str, ...] = field(default_factory=tuple)

    def argv(self, *, images: bool) -> list[str]:
        args = list(self.args) + (list(self.heavy) if images else [])
        return ["uv", "run", str(SCRAPERS / self.script), *args]


# In the order the README's block ran them. The Bibles are independent of each
# other and of everything else; `vatii` and `encyclicals` are last but one
# because they are the slowest parse, and `dore` is last because of --derive.
# With --jobs that order is a preference rather than a schedule; see `plan`.
STAGES: tuple[Stage, ...] = (
    Stage("ccc", "catechism", "ccc/ccc.py", outputs=("ccc.*",)),
    Stage(
        "compendium",
        "catechism",
        "ccc/compendium.py",
        outputs=("compendium.*",),
        binaries=("mutool", "pdftotext"),
    ),
    Stage("prayers", "prayers", "prayers.py", outputs=("prayer.*",)),
    Stage("cpdv", "bible", "bible/cpdv.py", ("--offline",), ("bible.cpdv.*",)),
    Stage(
        "clementina",
        "bible",
        "bible/vulgate.py",
        ("--offline",),
        ("bible.clementina.*",),
    ),
    Stage(
        "matos-soares",
        "bible",
        "bible/matos_soares.py",
        outputs=("bible.matos-soares.*",),
    ),
    Stage(
        "douay-rheims",
        "bible",
        "bible/douay_rheims.py",
        ("--offline",),
        ("bible.douay-rheims.*",),
    ),
    Stage(
        "bible-intro",
        "bible",
        "bible/introductions.py",
        ("--offline",),
        ("bible-intro.*",),
    ),
    # The one stage that reads another's output: Haydock's notes address the
    # Douay-Rheims, so that edition's chapter and verse numbering is both the
    # crawl plan and the validation oracle (`haydock.py`'s `chapter_plan`).
    Stage(
        "haydock",
        "bible",
        "bible/haydock.py",
        ("--offline",),
        ("commentary.haydock.*",),
        needs=("douay-rheims",),
    ),
    Stage("allioli", "bible", "bible/allioli.py", outputs=("bible.allioli.*",)),
    Stage("martini", "bible", "bible/martini.py", outputs=("bible.martini.*",)),
    Stage("kaldi", "bible", "bible/kaldi.py", outputs=("bible.kaldi.*",)),
    Stage("crampon", "bible", "bible/crampon.py", outputs=("bible.crampon.*",)),
    Stage(
        "straubinger", "bible", "bible/straubinger.py", outputs=("bible.straubinger.*",)
    ),
    Stage(
        "summa",
        "summa",
        "summa/summa.py",
        ("--lang", "both", "--offline"),
        ("summa.*",),
    ),
    Stage(
        "vatii",
        "documents",
        "vatican_docs.py",
        ("phase1", "--lang", "all", "--offline"),
        ("vatii.*",),
    ),
    Stage(
        "encyclicals",
        "documents",
        "vatican_docs.py",
        (
            "phase2",
            "--exhortations",
            "--offered-only",
            "--offline",
            "--langs",
            PHASE2_LANGS,
        ),
        ("encyclical.*", "exhortation.*"),
    ),
    # `plates.json` alone is under a second; --derive is the image pipeline.
    Stage(
        "dore",
        "images",
        "dore/dore.py",
        outputs=("dore.*",),
        heavy=("--derive",),
        binaries=("avifenc",),
    ),
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


# --------------------------------------------------------------------------
# Fingerprints: what a stage reads, in four parts that can be named separately
# --------------------------------------------------------------------------


def resolve_import(name: str, level: int, source: Path) -> Path | None:
    """The file `source` means by this import, if it is one of ours.

    Anything that resolves to neither a module beside `source` nor one under
    `pipeline/scrapers/` is stdlib or a dependency and is None -- which is the
    honest answer, since a dependency's version is not a thing this file can
    see. See WHAT IT DOES NOT COVER."""
    if not name:
        return None
    bases = [source.parent] if level else [source.parent, SCRAPERS]
    parts = name.split(".")
    for base in bases:
        directory = base.joinpath(*parts[:-1])
        if not directory.is_dir():
            continue
        for candidate in (
            directory / f"{parts[-1]}.py",
            directory / parts[-1] / "__init__.py",
        ):
            if candidate.is_file():
                return candidate
    return None


def import_closure(script: Path) -> list[Path]:
    """Every `.py` file in this repository that `script` can reach.

    Read off the imports rather than declared in a table, because a table is a
    second place to remember something and this project's own history is a
    list of the things that were not remembered. A `from . import x` inside
    `common/` walks the package the same way an `import common` at the top of
    a scraper enters it, so the twelve modules of `common/` land in every
    stage's closure and editing any one of them re-runs the corpus."""
    seen: set[Path] = set()
    queue = [script]
    while queue:
        path = queue.pop()
        if path in seen:
            continue
        seen.add(path)
        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), str(path))
        except (OSError, SyntaxError):
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                pairs = [(alias.name, 0) for alias in node.names]
            elif isinstance(node, ast.ImportFrom):
                # `from .files import x` names the module; `from . import
                # files` names one per alias.
                pairs = (
                    [(node.module, node.level)]
                    if node.module
                    else [(alias.name, node.level) for alias in node.names]
                )
            else:
                continue
            for name, level in pairs:
                found = resolve_import(name, level, path)
                if found is not None:
                    queue.append(found)
    return sorted(seen)


def _digest(parts) -> str:
    h = hashlib.sha256()
    for part in sorted(parts):
        h.update(str(part).encode("utf-8"))
        h.update(b"\0")
    return h.hexdigest()[:16]


def content_digest(paths: list[Path]) -> str:
    """By content, for the handful of files being edited right now.

    Code is hashed rather than stat'd because saving a file in an editor
    without changing it is the commonest thing that happens to it during the
    work this flag is for, and it must not cost a rebuild."""
    return _digest(
        f"{p}:{hashlib.sha256(p.read_bytes()).hexdigest()}"
        for p in paths
        if p.is_file()
    )


def tree_digest(root: Path, want=None) -> str:
    """By size and mtime, for trees too large to read.

    `raw/` is 2.4 GB across 11,795 files and hashing it would cost more than
    the parse it is meant to save; one `os.walk` of it is 0.07s. The trade is
    that restoring an identical file with a new mtime -- a `git checkout` --
    re-runs a stage that need not have run. That is the safe direction, and
    the only direction a staleness check may err in."""
    entries = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in IGNORED_DIRS]
        here = Path(dirpath)
        for filename in filenames:
            path = here / filename
            if want is not None and not want(path):
                continue
            try:
                st = path.stat()
            except OSError:
                continue
            entries.append(f"{path}:{st.st_size}:{st.st_mtime_ns}")
    return _digest(entries)


def stage_dirs(stage: Stage, root: Path) -> list[Path]:
    """This stage's work directories that exist right now."""
    return sorted({d for glob in stage.outputs for d in root.glob(glob)})


def outputs_digest(stage: Stage, root: Path) -> str:
    return _digest(tree_digest(d) for d in stage_dirs(stage, root))


def fingerprint(stage: Stage, images: bool, shared: dict[str, str]) -> dict[str, str]:
    """The parts, named so that `-v` can say which one moved.

    `readers` is absent for a stage that shells out to nothing, which is most
    of them -- a constant empty digest on every stage would be noise in `-v`.
    """
    prints = {
        **shared,
        "code": content_digest(import_closure(SCRAPERS / stage.script)),
        "argv": _digest([" ".join(stage.argv(images=images))]),
        "outputs": outputs_digest(stage, build_root()),
    }
    if stage.binaries:
        prints["readers"] = _digest(binary_identity(b) for b in stage.binaries)
    return prints


def shared_inputs() -> dict[str, str]:
    """The two parts every stage shares, walked once for the whole run."""
    return {
        "data": tree_digest(PIPELINE, want=lambda p: p.suffix != ".py"),
        "corpus": tree_digest(raw_root()),
    }


def load_state() -> dict[str, dict]:
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8")).get("stages", {})
    except (OSError, ValueError):
        return {}


def save_state(stages: dict[str, dict]) -> None:
    STATE_PATH.write_text(
        json.dumps({"$comment": STATE_COMMENT, "stages": stages}, indent=2) + "\n",
        encoding="utf-8",
    )


def moved(now: dict[str, str], before: dict | None) -> list[str]:
    """Which parts of the fingerprint differ. Empty means skippable."""
    if not before:
        return ["no record"]
    return [k for k, v in now.items() if before.get(k) != v]


# --------------------------------------------------------------------------
# Running
# --------------------------------------------------------------------------


@dataclass
class Result:
    stage: Stage
    code: int
    elapsed: float
    wrote: int
    why: list[str] = field(default_factory=list)
    fingerprint: dict[str, str] = field(default_factory=dict)

    @property
    def skipped(self) -> bool:
        return self.code == 0 and not self.why and self.elapsed == 0.0


def file_mtimes(stage: Stage, root: Path) -> dict[Path, float]:
    """Every file under this stage's work directories, with its mtime.

    This is what makes `wrote` a real measurement rather than a guess, and
    scoping it to the stage is what makes it one under `--jobs`: a snapshot of
    the whole corpus taken around a stage that runs beside three others would
    attribute their writes to it. It is only meaningful at all because
    `write_stamped_json` leaves an unchanged file untouched -- against a
    scraper that rewrote its output every run it would report everything on
    every stage, which is precisely the state that guard was added to end."""
    out: dict[Path, float] = {}
    for directory in stage_dirs(stage, root):
        for path in directory.rglob("*"):
            if path.is_file():
                with contextlib.suppress(OSError):
                    out[path] = path.stat().st_mtime
    return out


def plan(stages: list[Stage], state: dict[str, dict]) -> list[Stage]:
    """Recipe order for reading, longest-first for running.

    A pool started in recipe order finishes when its last-started long stage
    does, so the two document stages -- which are most of the work -- would
    start last. `state` carries how long each stage took the last time it ran,
    so the schedule improves itself and needs no table of costs; a stage never
    yet seen sorts first, since an unknown cost is more likely large than
    small."""
    return sorted(
        stages,
        key=lambda s: -state.get(s.name, {}).get("seconds", float("inf")),
    )


def waves(order: list[Stage]) -> list[list[Stage]]:
    """`order`, split so a stage runs only after the stages it `needs`.

    THE PARTITION MAKES CONCURRENT WRITES SAFE AND SAYS NOTHING ABOUT READS,
    which is the gap this closes. Every stage writes work directories no other
    stage names, so two running at once cannot race a file; but `haydock`
    READS `bible.douay-rheims.en` to know which chapters exist, and a pool
    started in longest-first order is perfectly capable of running it before
    the edition it reads has been written. That failure would not be a crash
    -- the scraper would find no corpus and die with the path it tried, on a
    run where the path was about to be correct.

    A dependency OUTSIDE this run is not waited for. `--only haydock` over a
    corpus that already holds the Douay-Rheims is an ordinary thing to ask
    for, and so is a `--changed-only` run where the annotated edition is
    unchanged and therefore not in `todo`.

    Waves rather than a full dependency-aware scheduler because there is one
    edge. If a second ever appears, this still holds; if a tenth does, the
    right answer is futures per stage rather than a barrier per wave, and the
    cost of being wrong about that today is one stage's idle time.
    """
    selected = {s.name for s in order}
    remaining = list(order)
    done: set[str] = set()
    out: list[list[Stage]] = []
    while remaining:
        ready = [
            s for s in remaining if all(n in done or n not in selected for n in s.needs)
        ]
        if not ready:
            cycle = ", ".join(sorted(s.name for s in remaining))
            raise SystemExit(
                f"rebuild: stages depend on each other in a cycle: {cycle}"
            )
        out.append(ready)
        done.update(s.name for s in ready)
        remaining = [s for s in remaining if s not in ready]
    return out


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
    ap.add_argument(
        "--changed-only",
        "-c",
        action="store_true",
        help="skip a stage whose code, data, corpus and output fingerprints "
        "all match the last run that exited 0. For iterating on one parser; "
        "read this file's WHAT --changed-only COVERS before trusting it",
    )
    ap.add_argument(
        "--force",
        action="store_true",
        help="run every selected stage and re-record it, ignoring the "
        "fingerprints. What to reach for after a dependency upgrade, which "
        "is the one input --changed-only cannot see",
    )
    ap.add_argument(
        "--jobs",
        "-j",
        type=int,
        default=4,
        help="stages to run at once (default: 4). 1 streams each stage's "
        "output live, which is what to use when a parser is failing; above "
        "that each stage's output is printed whole when it finishes. Four "
        "rather than one per core because the two document stages already "
        "fan out to sixteen parse workers of their own",
    )
    ap.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="with --changed-only, name the fingerprint that moved",
    )
    args = ap.parse_args()

    stages = select(args.only)
    images = not args.no_images
    root = build_root()

    if args.list:
        width = max(len(s.name) for s in STAGES)
        for s in STAGES:
            mark = "  " if s in stages else "- "
            globs = ", ".join(s.outputs)
            n = len(stage_dirs(s, root))
            work = "work" if n == 1 else "works"
            print(f"{mark}{s.name:<{width}}  {s.group:<10}  {globs:<28}  {n:>4} {work}")
        return 0

    if args.dry_run:
        for s in stages:
            print(" ".join(s.argv(images=images)))
        return 0

    # Fail before a scraper creates a phantom corpus somewhere nobody looks;
    # each of them checks this too, but reporting it once up front beats
    # reporting it seventeen times.
    root.parent.mkdir(parents=True, exist_ok=True)

    state = load_state()
    # --force records a fingerprint as well as ignoring one, so that the run
    # after it can be skipped; that needs the shared parts either way.
    shared = shared_inputs() if (args.changed_only or args.force) else {}

    todo: list[Stage] = []
    results: dict[str, Result] = {}
    for s in stages:
        if not args.changed_only or args.force:
            todo.append(s)
            continue
        prints = fingerprint(s, images, shared)
        why = moved(prints, state.get(s.name))
        if why:
            todo.append(s)
            results[s.name] = Result(s, 0, 0.0, 0, why=why, fingerprint=prints)
        else:
            results[s.name] = Result(s, 0, 0.0, 0)

    if args.changed_only and not todo:
        print("nothing to rebuild: every selected stage matches its record")
        return 0

    lock = threading.Lock()
    counter = {"done": 0}
    capture = args.jobs > 1

    def run(stage: Stage) -> Result:
        argv = stage.argv(images=images)
        head = f"\033[1m{stage.name}\033[0m  {' '.join(argv[2:])}"
        why = results.get(stage.name, Result(stage, 0, 0, 0)).why
        if args.verbose and why:
            head += f"   \033[2m[{', '.join(why)}]\033[0m"
        if not capture:
            with lock:
                counter["done"] += 1
                print(f"\n[{counter['done']}/{len(todo)}] {head}")
        before = file_mtimes(stage, root)
        t0 = time.monotonic()
        proc = subprocess.run(argv, capture_output=capture, text=capture)
        elapsed = time.monotonic() - t0
        after = file_mtimes(stage, root)
        wrote = sum(1 for p, t in after.items() if before.get(p) != t)
        if capture:
            with lock:
                counter["done"] += 1
                print(f"\n[{counter['done']}/{len(todo)}] {head}  ({elapsed:.1f}s)")
                sys.stdout.write(proc.stdout or "")
                sys.stderr.write(proc.stderr or "")
        return Result(
            stage,
            proc.returncode,
            elapsed,
            wrote,
            why,
            results.get(stage.name, Result(stage, 0, 0, 0)).fingerprint,
        )

    started = time.monotonic()
    order = plan(todo, state) if capture else todo
    if capture:
        with ThreadPoolExecutor(max_workers=min(args.jobs, len(order))) as pool:
            for wave in waves(order):
                for r in pool.map(run, wave):
                    results[r.stage.name] = r
    else:
        # Flattened rather than recipe order: `--jobs 1` has to honour the
        # same edges, and a recipe order that happens to satisfy them today is
        # a thing the next insertion silently breaks.
        for wave in waves(order):
            for stage in wave:
                r = run(stage)
                results[r.stage.name] = r

    # A stage that failed must not record its fingerprint, or the next
    # --changed-only run would skip a broken parser.
    if args.changed_only or args.force:
        for r in results.values():
            if r.skipped or r.code != 0:
                continue
            prints = r.fingerprint or fingerprint(r.stage, images, shared)
            prints["outputs"] = outputs_digest(r.stage, root)
            state[r.stage.name] = {**prints, "seconds": round(r.elapsed, 2)}
    for r in results.values():
        if not r.skipped and r.code == 0:
            state.setdefault(r.stage.name, {})["seconds"] = round(r.elapsed, 2)
    try:
        save_state(state)
    except OSError as e:
        print(f"note: could not write {STATE_PATH}: {e}")

    ordered = [results[s.name] for s in stages if s.name in results]
    print("\n=== rebuild ===")
    width = max(len(r.stage.name) for r in ordered)
    for r in ordered:
        if r.skipped:
            print(f"  {r.stage.name:<{width}}       -      - unchanged")
            continue
        status = "ok" if r.code == 0 else f"exit {r.code}"
        print(
            f"  {r.stage.name:<{width}}  {r.elapsed:6.1f}s  {r.wrote:5d} wrote  {status}"
        )
    # Wall clock, not the sum of the column above it: with --jobs those are
    # different numbers and the sum is the one nobody waited for.
    ran = [r for r in ordered if not r.skipped]
    wall = time.monotonic() - started
    notes = []
    if len(ordered) - len(ran):
        notes.append(f"{len(ordered) - len(ran)} unchanged")
    if capture and ran:
        notes.append(f"{sum(r.elapsed for r in ran):.0f}s of stage time")
    tail = f"  ({', '.join(notes)})" if notes else ""
    print(
        f"  {'total':<{width}}  {wall:6.1f}s  "
        f"{sum(r.wrote for r in ran):5d} wrote{tail}"
    )

    failed = [r.stage.name for r in ordered if r.code != 0]
    if failed:
        print(f"\nnonzero exit: {', '.join(failed)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
