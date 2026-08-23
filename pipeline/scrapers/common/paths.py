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

#: Default corpus location: a sibling checkout of the private corpus repository.
_DEFAULT_CORPUS_DIR = _REPO_ROOT.parent / "glossa-corpus"


def corpus_dir() -> Path:
    """The corpus checkout: `$CORPUS_DIR`, or a `glossa-corpus/` sibling.

    THE CORPUS IS NOT IN THIS REPOSITORY (docs/decisions.md, 2026-08-23). It
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


def works_root() -> Path:
    """`works/` inside the corpus checkout -- every scraper's parsed output."""
    return corpus_dir() / "works"


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
            "The corpus lives in its own private repository (docs/decisions.md, "
            "2026-08-23). Clone it beside this one as `glossa-corpus/`, or set "
            "CORPUS_DIR to point at it."
        )
    return path
