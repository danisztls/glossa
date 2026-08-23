"""URLs a source has said do not exist, remembered between runs."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from .files import read_text_or_none
from .paths import ABSENT_SOURCES_PATH


class AbsentSources:
    """URLs the source answered 404/410 for, so a re-run stops asking.

    WHY THIS EXISTS. `vatican_docs.py`'s docstring calls a re-parse
    "provably zero-network", and it was not: a full `phase2 --overwrite`
    over the cached corpus made 36 requests and took 2m59s while spending
    6.5s of CPU. All 36 were retry storms against 12 URLs that return a hard
    404 -- ten Pius XI/XII encyclicals with no Portuguese translation, and
    two pontificate indexes that do not exist. A failed fetch was never
    recorded anywhere, so every run rediscovered the same twelve absences
    from scratch, at `MAX_ATTEMPTS` requests and two backoff sleeps each.

    WHY A LEDGER IN `pipeline/` AND NOT A MARKER IN `raw/`. Both were on
    the table. `raw/` is the record of what the source said, and a 404 is
    something the source said -- but it is also the one artifact the project
    treats as write-once (CLAUDE.md), and a list of what is missing is
    knowledge we derived rather than a page we fetched. Kept here it is
    tracked, diffable and reviewable in the public repository, next to
    `corrections/` and `overrides/`, which are the other two places where
    this pipeline writes down what it has learned about its sources.

    ONLY DEFINITIVE STATUSES BELONG HERE. 404 and 410 are answers from the
    origin; a timeout, a connection reset or a 5xx is the Azure edge
    flakiness the survey measured at ~1-in-6-to-8, and caching one of those
    as an absence would silently drop a document from the corpus. That
    distinction is the whole safety argument for this class, and it lives in
    the caller: nothing else may call `record`.

    AN ABSENCE IS NOT PERMANENT. A translation can appear years later, and a
    ledger nobody rechecks would make it invisible forever. `--recheck-absent`
    ignores the ledger for one run and re-fetches every entry in it; anything
    that now succeeds is dropped from the file and reported, which is the
    only way an entry ever leaves.
    """

    def __init__(self, path: Path = ABSENT_SOURCES_PATH):
        self.path = path
        self.entries: dict[str, dict] = {}
        raw = read_text_or_none(path)
        if raw:
            for entry in json.loads(raw):
                self.entries[entry["url"]] = entry
        self._loaded = dict(self.entries)
        self.skipped = 0  # requests this ledger prevented
        self.added: list[str] = []
        self.forgotten: list[str] = []

    def knows(self, url: str) -> dict | None:
        """The recorded absence for `url`, or None. Counts a skipped request."""
        entry = self.entries.get(url)
        if entry is not None:
            self.skipped += 1
        return entry

    def record(self, url: str, status: int, context: str = "") -> None:
        """Note that `url` is definitively absent. Callers must have checked
        that `status` is definitive; see the class docstring."""
        existing = self.entries.get(url)
        if existing is None:
            self.added.append(url)
        # A hand-written `note` is the reason a person recorded for an
        # absence, and re-observing it must not erase that. Only the fields
        # this pipeline derives are overwritten.
        entry = dict(existing or {})
        entry.update(
            {
                "url": url,
                "status": status,
                "observed": datetime.now(timezone.utc).date().isoformat(),
            }
        )
        if context:
            entry["context"] = context
        entry.setdefault("note", "")
        self.entries[url] = entry

    def forget(self, url: str) -> None:
        """Drop `url` after it fetched successfully -- the absence is over."""
        if self.entries.pop(url, None) is not None:
            self.forgotten.append(url)

    def save(self) -> bool:
        """Write the ledger back if it changed. Returns whether it did.

        Sorted by url and written only on a real change, so the file's git
        history shows absences appearing and disappearing rather than a
        reshuffle on every run."""
        if self.entries == self._loaded:
            return False
        self.path.parent.mkdir(parents=True, exist_ok=True)
        ordered = [self.entries[u] for u in sorted(self.entries)]
        self.path.write_text(
            json.dumps(ordered, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        self._loaded = dict(self.entries)
        return True
