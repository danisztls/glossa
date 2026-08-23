"""The overrides layer: the source is fine, and the parsed output is edited."""

from __future__ import annotations

import json

from .files import filed_work_ids
from .paths import OVERRIDES_DIR


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
    if work_id not in filed_work_ids(OVERRIDES_DIR):
        return []
    path = OVERRIDES_DIR / f"{work_id}.json"
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
