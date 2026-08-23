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
import os
from pathlib import Path

# This file lives at <repo>/pipeline/scrapers/common.py, so parents[2] is the
# repo root -- the same expression every scraper already used to locate its
# own corrections directory, under four different local names (SOURCE_ROOT,
# REPO_ROOT, ROOT, and prayers.py's CORRECTIONS_ROOT).
CORRECTIONS_DIR = Path(__file__).resolve().parents[2] / "pipeline" / "corrections"
OVERRIDES_DIR = Path(__file__).resolve().parents[2] / "pipeline" / "overrides"

_REPO_ROOT = Path(__file__).resolve().parents[2]
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


class OverrideDriftError(RuntimeError):
    """An override's `from` value no longer matches the parsed output.

    The same loud-failure posture as `CorrectionDriftError`, and for a
    sharper reason: an override exists BECAUSE the parser gets something
    wrong, so the parser improving is the expected way for one to stop
    matching. That is the good case -- it means the override is redundant
    and should be deleted -- but it is indistinguishable from the bad case
    (the override was aimed at the wrong unit) unless the run says so. An
    override that silently no-ops is worse than no override: the defect it
    documents is back, and the file still claims it is handled."""


def load_overrides(work_id: str) -> list[dict]:
    """The recorded overrides for `work_id`, or `[]` when none are filed.

    OVERRIDES ARE NOT CORRECTIONS, and the two directories are separate on
    purpose (docs/decisions.md, 2026-08-22):

      - `pipeline/corrections/` says **the source is wrong**. It edits the
        fetched page before parsing, and its evidence is an argument about
        what vatican.va should have printed.
      - `pipeline/overrides/` says **the source is fine and our derivation
        is not**. It edits the parsed output after parsing, and its evidence
        is a quotation of what the source actually prints -- the thing we
        failed to reproduce.

    Blurring them would cost the question `corpus/raw/` exists to answer:
    "what does the source actually say?" A correction rewrites that answer;
    an override must never be able to.

    An override is the exception, not the rule. Before filing one, ask
    whether the defect belongs to one document or to a class of them --
    every defect found in the 2026-08 description pass so far has been the
    latter, and each was fixed in the parser where it repaired between 275
    and 14,924 units at once. The layer exists for what genuinely does not
    generalise, and its emptiness is a feature."""
    path = OVERRIDES_DIR / f"{work_id}.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


_OVERRIDE_TARGETS = ("structure", "section")


def _locate_structure(structure: list[dict], loc: dict) -> list[int]:
    """Indices of the structure nodes an override's locator names.

    Two ways to point at a heading, and both are checked when both are
    given. `index` is its position in the flat array -- exact, but it moves
    whenever a heading is added or removed anywhere above it. `before` is
    the section it precedes, which survives that but is not unique when
    several headings open the same section. Filing both makes the override
    fail loudly if they ever disagree, which is the point: an override is
    aimed at one heading, and a locator that quietly starts matching a
    different one is the failure mode this whole layer has to avoid."""
    hits = range(len(structure))
    if "index" in loc:
        hits = [i for i in hits if i == loc["index"]]
    if "before" in loc:
        hits = [i for i in hits if structure[i].get("before") == loc["before"]]
    if "title" in loc:
        hits = [i for i in hits if structure[i].get("title") == loc["title"]]
    return list(hits)


def apply_overrides(
    work_id: str,
    structure: list[dict],
    sections: list[dict],
    overrides: list[dict],
) -> list[dict]:
    """Apply post-parse overrides in place; return the receipt entries.

    Raises `OverrideDriftError` on anything that does not apply exactly:
    an unknown target or field, a locator matching zero or several units,
    or a `from` value that is not what is actually there. There is no
    best-effort path -- see `OverrideDriftError` for why a silent no-op is
    the one outcome this layer must never produce.

    Operations:

      - `set` (default) replaces `field` on the located unit. `from` must
        equal the current value; use `null` to add a field that is absent,
        and `to: null` to delete one back to its omitted default.
      - `remove` deletes the located structure node entirely, for a block
        the parser promoted to a heading that is not one. `from` must equal
        its `title`.

    Sections are located by `{"section": n}` plus optional `{"block": i}`,
    and the caller is responsible for re-checking the corpus's round-trip
    invariant afterwards: an override that edits `html` without editing
    `text_marked` to match leaves the work inconsistent, and this function
    deliberately does not guess which of the two was meant."""
    applied: list[dict] = []
    for ov in overrides:
        ident = ov.get("id", "<unnamed>")
        target = ov.get("target")
        if target not in _OVERRIDE_TARGETS:
            raise OverrideDriftError(
                f"{work_id}: override {ident!r} has target {target!r}; "
                f"expected one of {_OVERRIDE_TARGETS}"
            )
        loc = ov.get("locator") or {}
        op = ov.get("op", "set")

        if target == "structure":
            hits = _locate_structure(structure, loc)
            if len(hits) != 1:
                raise OverrideDriftError(
                    f"{work_id}: override {ident!r} locator {loc!r} matched "
                    f"{len(hits)} structure nodes; expected exactly 1"
                )
            i = hits[0]
            if op == "remove":
                if structure[i].get("title") != ov.get("from"):
                    raise OverrideDriftError(
                        f"{work_id}: override {ident!r} expected title "
                        f"{ov.get('from')!r}, found {structure[i].get('title')!r}"
                    )
                removed = structure.pop(i)
                applied.append({"id": ident, "op": "remove", "removed": removed})
                continue
            unit = structure[i]
        else:
            n = loc.get("section")
            matches = [s for s in sections if s.get("n") == n]
            if len(matches) != 1:
                raise OverrideDriftError(
                    f"{work_id}: override {ident!r} locator {loc!r} matched "
                    f"{len(matches)} sections; expected exactly 1"
                )
            unit = matches[0]
            if "block" in loc:
                blocks = unit.get("blocks") or []
                if loc["block"] >= len(blocks):
                    raise OverrideDriftError(
                        f"{work_id}: override {ident!r} names block "
                        f"{loc['block']} of section {n}, which has {len(blocks)}"
                    )
                unit = blocks[loc["block"]]

        if op != "set":
            # `remove` is handled above and only for structure nodes. Dropping
            # a SECTION is deliberately not offered: a numbered section is an
            # address readers can link to, and silently deleting one would
            # leave a gap the validator reports as a parse failure. Withhold
            # a whole work through site/unpublished.json instead.
            raise OverrideDriftError(
                f"{work_id}: override {ident!r} has op {op!r} on target "
                f"{target!r}; 'set' applies to both targets and 'remove' "
                f"only to a structure node"
            )
        field = ov.get("field")
        if not field:
            raise OverrideDriftError(f"{work_id}: override {ident!r} names no field")
        if "to" not in ov:
            raise OverrideDriftError(
                f"{work_id}: override {ident!r} sets {field!r} but names no 'to'"
            )
        current = unit.get(field)
        if current != ov.get("from"):
            raise OverrideDriftError(
                f"{work_id}: override {ident!r} expected {field}="
                f"{ov.get('from')!r}, found {current!r}"
            )
        # `to: null` DELETES the key rather than storing a null, mirroring
        # `from: null`, which already means "the key is absent". The corpus
        # omits defaults -- `kind` when the block is prose, `ident`/`subtitle`/
        # `title_html` when a heading has none -- so "make this an ordinary
        # block" has to be expressible as removing the key. Writing
        # `"kind": null` instead would invent a third state no reader knows:
        # `kind === 'quote'` is false for it, so it would happen to render
        # correctly while leaving a value in the corpus that the schema does
        # not define and the next round of tooling would have to special-case.
        if ov["to"] is None:
            unit.pop(field, None)
        else:
            unit[field] = ov["to"]
        applied.append(
            {
                "id": ident,
                "op": "set",
                "field": field,
                "from": ov.get("from"),
                "to": ov["to"],
            }
        )
    return applied


def load_corrections(work_id: str) -> list[dict]:
    """The recorded corrections for `work_id`, or `[]` when none are filed.

    An absent file is the normal case, not an error: most sources have no
    documented defect, and the layer is expected to apply zero corrections
    while still proving it ran (each scraper's own drift guard).
    """
    path = CORRECTIONS_DIR / f"{work_id}.json"
    if not path.exists():
        return []
    entries = json.loads(path.read_text(encoding="utf-8"))
    # Ids must be unique within a file: `apply_raw_text_corrections` records
    # each applied id in a `seen_ids` set and skips anything already there,
    # so two entries sharing an id means the second SILENTLY does not apply.
    # Caught live -- two Redemptoris Missio entries both derived the id
    # `...-missing-space-Ac` from their own `from` text, and only the first
    # was applied while the receipt still reported success. Nothing else
    # would have noticed: the layer's drift guard checks that a filed
    # correction MATCHED, not that every filed correction was reached.
    ids = [e.get("id") for e in entries]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise ValueError(
            f"{path}: duplicate correction id(s) {dupes} -- ids must be unique "
            "within a file or all but the first are skipped without a word"
        )
    return entries


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
