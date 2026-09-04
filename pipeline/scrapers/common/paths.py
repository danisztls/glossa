"""Where things live: the corpus checkout, and this repository's own layers.

Split out of the single `common.py` because every other module here needs it
and it needs none of them -- so it is the one that must not import sideways."""

from __future__ import annotations

import os
from pathlib import Path

# This file lives at <repo>/pipeline/scrapers/common/paths.py, so parents[3]
# is the repo root. It was parents[2] while this was a single common.py beside
# the scrapers; the depth is asserted below rather than trusted, because
# getting it wrong produces paths that are merely absent rather than obviously
# wrong, and `load_corrections` reads an absent directory as "no corrections
# filed" -- a silent, corpus-wide no-op.
_REPO_ROOT = Path(__file__).resolve().parents[3]
# Cheap proof that the depth above is right: these two are tracked in this
# repository and are not going anywhere.
assert (_REPO_ROOT / "pipeline" / "scrapers").is_dir(), (
    f"common/paths.py computed the repo root as {_REPO_ROOT}, which has no "
    "pipeline/scrapers -- the parents[] depth is wrong for where this file lives"
)

CORRECTIONS_DIR = _REPO_ROOT / "pipeline" / "corrections"
OVERRIDES_DIR = _REPO_ROOT / "pipeline" / "overrides"
ABSENT_SOURCES_PATH = _REPO_ROOT / "pipeline" / "absent-sources.json"
TRANSLATIONS_CHECKED_PATH = _REPO_ROOT / "pipeline" / "translations-checked.json"
PARSE_BASELINE_PATH = _REPO_ROOT / "pipeline" / "parse-baseline.json"
DORE_ANCHORS_PATH = _REPO_ROOT / "pipeline" / "dore-anchors.json"

#: Default corpus location: a sibling checkout of the private corpus repository.
_DEFAULT_CORPUS_DIR = _REPO_ROOT.parent / "glossa-corpus"


def corpus_dir() -> Path:
    """The corpus checkout: `$CORPUS_DIR`, or a `glossa-corpus/` sibling.

    THE CORPUS IS NOT IN THIS REPOSITORY (pipeline/docs/corpus.md). It
    holds verbatim reproductions of texts other people hold rights in, so it
    lives in a private repository of its own, expected on disk beside this
    one. `CORPUS_DIR` overrides that, and is spelled the same way here as in
    `site/scripts/sync-corpus.mjs` so one exported variable moves both halves
    of the project at once.

    Resolved through one function because seven scrapers previously each
    rebuilt `<repo>/corpus/...` from `__file__` under four different local
    names -- the same duplication the 2026-08-20 entry found in the
    corrections loader, and with a sharper failure mode now that the path
    leaves this repository.

    PURE PATH ARITHMETIC, no existence check: several scrapers build module
    level constants from this, and a check here would fail at import time and
    take `--help` with it. `require_corpus()` is the check, and it runs at the
    top of each scraper's `main()`.
    """
    env = os.environ.get("CORPUS_DIR")
    return Path(env).expanduser().resolve() if env else _DEFAULT_CORPUS_DIR


def raw_root() -> Path:
    """`raw/` inside the corpus checkout -- every scraper's fetch cache."""
    return corpus_dir() / "raw"


def authored_root(corpus: Path | None = None) -> Path:
    """`authored/` inside the corpus -- text this project decided, and serves.

    IT WAS `oracles/prayers/` UNTIL 2026-09-04, and the rename is the whole
    point. An ORACLE tells you whether your output is right; this is the
    output. `prayers_project.py` writes `build/prayer.common.*` FROM these
    files and the site serves them, while `prayers.py` was demoted to the
    thing that CHECKS them against the pages they cite -- so the direction of
    checking runs the opposite way from `oracles/toc/`, which sat beside it
    under one name saying both were oracles.

    That name was not merely imprecise, it produced a false belief in a reader
    who had read the docs: the README described this directory as "read off
    the raw pages by hand; nothing regenerates them", and in fact 17 scripts
    under `authored/prayers/curation/` rebuild all 35 files in ~40s. What is
    true is narrower and is why it is tracked: the thing that rebuilds them is
    deliberately NOT a pipeline stage and cannot be made one, because
    `source_blocks` reads its witnesses out of `build/` -- run in the ordinary
    order, every prayer would agree with itself and the check would pass for
    the worst possible reason.

    `raw/` is somebody else's, `build/` is a machine's, this is ours.
    """
    return (corpus if corpus is not None else corpus_dir()) / "authored"


def oracles_root(corpus: Path | None = None) -> Path:
    """`oracles/` inside the corpus -- independent readings that CHECK a parse.

    What is left here after the curated prayers moved to `authored/` on
    2026-09-04, and now the directory means one thing: a reading taken by a
    person, kept so a parser can be held to it. `oracles/toc/` is the whole of
    it -- the headings someone saw a source print, recorded before the parse
    was trusted, and compared by `audit.py toc`.

    NOTHING HERE IS EVER SERVED TO A READER, which is the test for whether a
    new file belongs. If the site would publish it, it is `authored/`; if a
    pipeline stage reproduces it from `raw/`, it is `build/`.

    Five places built this path out of a literal before this function existed
    -- the same duplication `corpus_dir()` was written to end.
    """
    return (corpus if corpus is not None else corpus_dir()) / "oracles"


def build_root(corpus: Path | None = None) -> Path:
    """`build/` inside the corpus checkout -- every scraper's parsed output.

    IT WAS `works/` AT THE TOP LEVEL UNTIL 2026-08-27, and the rename is the
    point rather than a tidy-up. The corpus repository holds three things and
    only one of them is derived: `raw/` is what someone else's server was
    asked for, `authored/` and `oracles/` are what a person decided here, and
    this is output -- rebuilt from `raw/` in seconds, tracked by nothing, and
    the only one of the four that a deletion cannot destroy. Sibling
    directories with names that did not say which was which is what made
    "is this corpus data" the wrong question to be asking (CLAUDE.md); a
    directory called `build/` answers it before anyone has to ask. It also
    lets `.gitignore` say `build/` once, so a generated kind added later is
    ignored by default rather than by someone remembering to add it.

    `corpus` overrides the checkout for callers that were handed one --
    `audit.py`, `census.py` and `apply_sweep.py` all take a corpus path as an
    argument and each rebuilt `build_root(corpus)` by hand. That is the
    duplication this module exists to prevent, and it is why the parameter is
    here rather than each of them growing a second literal."""
    return (corpus if corpus is not None else corpus_dir()) / "build"


def require_corpus() -> Path:
    """Fail loudly if the corpus checkout is absent. Call from `main()`.

    A MISSING CORPUS MUST NOT READ AS AN EMPTY ONE. Every scraper creates its
    output directories with `parents=True`, so an unchecked wrong path is
    silently populated rather than reported -- the pipeline's version of the
    fixture-fallback trap CLAUDE.md warns about on the site side, and worth
    less silence, since the result is a whole phantom corpus somewhere nobody
    will look for it.
    """
    path = corpus_dir()
    if not path.is_dir():
        raise SystemExit(
            f"corpus directory not found at {path}\n"
            "The corpus lives in its own private repository (pipeline/docs/corpus.md, "
            "2026-08-23). Clone it beside this one as `glossa-corpus/`, or set "
            "CORPUS_DIR to point at it."
        )
    return path
