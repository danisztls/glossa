"""What a sibling-language edition turned out to be, remembered between runs."""

from __future__ import annotations

import json
from pathlib import Path

from .files import read_text_or_none
from .paths import TRANSLATIONS_CHECKED_PATH


def load_translations_checked(
    path: Path = TRANSLATIONS_CHECKED_PATH,
) -> dict[str, dict[str, dict]]:
    """`work_id -> {lang: {status, checked_at, note?}}` from the ledger.

    WHAT THIS RECORDS. A document work carries `translations` (see
    `docs/corpus-schema.md` #Documents) when a sibling-language edition is
    KNOWN not to exist as its own work, and the entry says which kind of
    not-existing it is -- `stub-page`, `no-url`, `not-found`, `fetch-failed`.
    Bare absence on disk cannot be told apart from "never checked" without
    re-crawling, which is the whole reason the field is there.

    WHY THIS IS AN INPUT AND NOT AN OUTPUT. It was neither until 2026-08-27.
    The statuses were established by a post-hoc reconciliation pass over the
    corpus, written into each work's `manifest.json`, and kept alive only by
    `vatican_docs.write_document_outputs` copying them off the manifest
    already on disk. That made them regenerable from nothing but a previous
    copy of the output -- so a rebuild into an empty directory silently
    dropped all 125 of them, and untracking the parsed corpus (2026-08-27,
    `docs/decisions.md` §The corpus) would have made the loss permanent.
    A status is a record of what the source ANSWERED, which is the same class
    of knowledge as `absent-sources.json` next door: measured against someone
    else's server, expensive to re-measure, and cheap to write down.

    WHY A LEDGER IN `pipeline/` AND NOT IN THE CORPUS. Identical to the
    argument in `absent.py`: a list of what is missing is knowledge we
    derived rather than a page we fetched, so it belongs here, tracked and
    diffable in the public repository beside `corrections/` and `overrides/`,
    rather than in the corpus repository whose `build/` is now output alone.

    NOT WRITTEN BY ANY SCRAPER. Nothing here appends to this file: the pass
    that establishes a status is a separate, deliberate act (it costs
    requests, or a scan of `raw/` for a cached stub), never a side effect of
    a parse. A run that has learned something new adds it here by hand, or by
    a tool that says so.
    """
    raw = read_text_or_none(path)
    if not raw:
        return {}
    by_work: dict[str, dict[str, dict]] = {}
    for entry in json.loads(raw):
        record = {"status": entry["status"], "checked_at": entry["checked_at"]}
        # Omitted when empty so the common two-key record stays two keys, the
        # shape `corpus-schema.md` documents and the manifests already hold.
        if entry.get("note"):
            record["note"] = entry["note"]
        by_work.setdefault(entry["work"], {})[entry["lang"]] = record
    return by_work
