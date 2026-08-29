"""When each page under `raw/` was fetched, recorded beside the page itself."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

from .files import read_text_or_none, write_if_changed
from .paths import raw_root

#: The record's filename, one per source directory under `raw/`.
CAPTURED_AT_NAME = "captured-at.json"

_cache: dict[Path, dict[str, str]] = {}


def load_captured(source_dir: Path) -> dict[str, str]:
    """`path relative to source_dir -> capture date`, for one crawl's pages.

    WHAT THIS IS AND WHY IT SITS IN `raw/`. The capture date is a property of
    the fetched page: the day this project asked someone else's server for it.
    It is the one fact in the corpus that records an action taken against a
    third party rather than a computation over the result, so it belongs with
    the artifact it describes, written by the code that made the request at the
    moment it made it. `absent.py` argues the opposite for its own ledger and
    is right to -- a 404 has no file to sit beside, and a list of what is
    missing is knowledge we derived. A capture date has a file, and is not
    derived from anything.

    IT WAS IN THE MANIFEST AND THE MANIFEST WAS WRONG TWICE OVER. Until
    2026-08-28 `retrieved_at` lived only in `build/<id>/manifest.json`, kept
    alive by four scrapers reading their own previous output and by the fifth
    (`vatican_docs.py`, 354 of 383 works) not at all. So it evaporated on a
    rebuild into an empty directory -- which is now the supported way to get a
    corpus. It was also per WORK rather than per page, and recorded whichever
    crawl session last touched the work: `encyclical.quas-primas.en` claimed
    2026-08-25 for a page fetched on the 16th.

    THE TRUE DATES WERE RECOVERED FROM FILESYSTEM MTIMES on 2026-08-28, which
    git does not preserve -- one working tree held them and a fresh clone would
    have stamped all 6,328 with its own checkout time. Recorded in UTC, the
    same basis every scraper stamps on.

    Callers should prefer `captured_at`, which takes a page's real path."""
    path = source_dir / CAPTURED_AT_NAME
    if path not in _cache:
        raw = read_text_or_none(path)
        _cache[path] = json.loads(raw) if raw else {}
    return _cache[path]


def captured_at(page: Path) -> str | None:
    """The `YYYY-MM-DD` this page was fetched, or None if unrecorded.

    `page` is a real path under `raw/`; the source directory and the key are
    derived from it, so a caller names the file it actually read rather than
    reconstructing a key."""
    try:
        rel = page.resolve().relative_to(raw_root().resolve())
    except ValueError:
        return None
    if len(rel.parts) < 2:
        return None
    source_dir = raw_root() / rel.parts[0]
    return load_captured(source_dir).get(str(Path(*rel.parts[1:])))


def source_captured_at(source_dir: Path) -> str | None:
    """The day a whole crawl was taken: the earliest date recorded under it.

    For a manifest `sources[]` entry that names a SITE rather than one page,
    which is what a Bible edition's does -- one URL standing for 73 fetched
    book pages. `captured_at` cannot answer it, because the URL named is
    usually an index the crawl read links off and never wrote to `raw/`.

    THAT GAP WAS STAMPING THE RUN DATE. `cpdv.py` and `vulgate.py` asked for
    `index.htm`, which is not on disk and not in the ledger, and fell through
    to `datetime.now()` -- so `bible.cpdv.en` claimed a 2026-08-14 capture on
    the day the mtimes were recovered and a 2026-08-29 one the next morning,
    for the same untouched pages. It hid because the recovery run and the
    rebuild that verified it happened on the same day; a rebuild the following
    day is what surfaced it. Earliest rather than latest because a crawl is
    dated by when it was taken, and a `--refresh` of one page does not
    re-date the other seventy-two.
    """
    dates = load_captured(source_dir).values()
    return min(dates) if dates else None


def record_capture(page: Path, when: str | None = None) -> None:
    """Note that `page` was fetched today (or on `when`).

    Called by `Fetcher` at the moment it writes the page, which is the only
    time the answer is known for certain. Existing entries are never moved: a
    `--refresh` re-fetch genuinely re-captures and does update, but nothing
    else may, and a cache hit never reaches here at all."""
    try:
        rel = page.resolve().relative_to(raw_root().resolve())
    except ValueError:
        return
    if len(rel.parts) < 2:
        return
    source_dir = raw_root() / rel.parts[0]
    key = str(Path(*rel.parts[1:]))
    entries = dict(load_captured(source_dir))
    entries[key] = when or datetime.now(UTC).date().isoformat()
    path = source_dir / CAPTURED_AT_NAME
    _cache[path] = entries
    write_if_changed(
        path,
        json.dumps(dict(sorted(entries.items())), indent=2, ensure_ascii=False) + "\n",
    )
