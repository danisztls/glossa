"""Helpers shared by the scrapers in this directory.

WHY THIS MODULE EXISTS, given that each scraper is a standalone PEP 723
`uv run --script` file. Two comments in this directory used to assert that
sharing was impossible or unwanted -- that the scripts have "no common import
path", and that "small duplication [is] preferred over a shared module per
project convention". Neither was true. There is no such project convention
(nothing in CLAUDE.md, docs/decisions.md or docs/corpus-schema.md states one),
and the import path is simply the directory the script already lives in:
Python puts a script's own directory on `sys.path` at startup, so a sibling
module imports with a plain `import common` no matter what the working
directory is. PEP 723 metadata governs third-party DEPENDENCIES; it does not
prevent a script from importing a local module that has none.

WHAT BELONGS HERE is deliberately narrow: code that is byte-identical across
scrapers AND has no per-source behavior. That is a real distinction, because
several things in these files only LOOK duplicated:

  - **Rate limits are not shared and must not be.** vatican.va's 2.0s comes
    from its robots.txt `Crawl-delay` and is a commitment about someone else's
    server (docs/decisions.md); sacredbible.org and liriocatolico.com.br are
    different hosts with their own self-chosen floors. One shared constant
    would either loosen a self-imposed limit or read as a pretext to speed up
    the vatican.va crawl.
  - **`Fetcher` is not shared.** The four implementations genuinely differ --
    retry policy, raise-vs-return-status error handling, even the HTTP library
    -- and unifying them is a design decision about behavior, not a mechanical
    merge.
  - **`strip_tags` is not shared.** compendium.py's copy deliberately turns
    `<br/>` into a space before dropping other tags, which ccc.py's does not;
    that difference is documented at its call site and would be silently lost
    in a "consistency" merge.

None of these scrapers has tests, so anything moved here has to be verifiable
by reading. The pieces below qualify: they are pure, short, and were already
identical character for character.
"""

from __future__ import annotations

import json
from pathlib import Path

# This file lives at <repo>/pipeline/scrapers/common.py, so parents[2] is the
# repo root -- the same expression every scraper already used to locate its
# own corrections directory, under four different local names (SOURCE_ROOT,
# REPO_ROOT, ROOT, and prayers.py's CORRECTIONS_ROOT).
CORRECTIONS_DIR = Path(__file__).resolve().parents[2] / "pipeline" / "corrections"


class CorrectionDriftError(RuntimeError):
    """A correction's `from` text no longer matches the source.

    Raised when a recorded correction stops applying, which means either the
    source page changed or the correction was wrong to begin with. Either way
    the run must fail loudly rather than emit a work whose corrections
    silently did nothing -- see docs/decisions.md, "Source-defect corrections
    policy".

    vatican_docs.py deliberately does NOT use this: `scrape_one` promises not
    to raise, so that one bad document cannot kill a crawl of many, and it
    reports drift as `status="corrections-drift"` on its result instead.
    """


def load_corrections(work_id: str) -> list[dict]:
    """The recorded corrections for `work_id`, or `[]` when none are filed.

    An absent file is the normal case, not an error: most sources have no
    documented defect, and the layer is expected to apply zero corrections
    while still proving it ran (each scraper's own drift guard).
    """
    path = CORRECTIONS_DIR / f"{work_id}.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


# Punctuation that can legitimately stand before a chapter's first letter, so
# that a chapter opening on a quotation or a parenthesis is not mistaken for a
# lost capital. Kept in step with LEADING_PUNCT in site/src/lib/dropcap.ts,
# which makes the identical split to build the drop cap -- change one, change
# both.
CHAPTER_OPENING_PUNCT = "\"'“”‘’«»¿¡([{—–- \t"


def chapter_opening_letter(text: str) -> str | None:
    """The character a chapter's first verse actually opens on, skipping up to
    three units of leading punctuation. Returns None if the verse opens on
    something that is neither punctuation nor a letter/digit."""
    units = text.lstrip()
    taken = 0
    while taken < len(units) and taken < 3 and units[taken] in CHAPTER_OPENING_PUNCT:
        taken += 1
    if taken >= len(units) or not units[taken].isalnum():
        return None
    return units[taken]
