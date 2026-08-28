"""Reading and writing files, and not rewriting the ones that have not changed.

`write_stamped_json` is the guard this module exists for; the rest are the
one-syscall primitives it and the fetchers are built from."""

from __future__ import annotations

import json
from pathlib import Path

_dir_indexes: dict[Path, frozenset[str]] = {}


def filed_work_ids(directory: Path) -> frozenset[str]:
    """Which work_ids have a `.json` filed in `directory`, listed once.

    `load_corrections` and `load_overrides` run once per document, and both
    began by asking the filesystem whether one specific file existed. Over a
    full run that was 717 `exists()` calls to locate the 12 files that are
    actually there -- 422 for corrections against 18 filed, 307 for overrides
    against 5. One `iterdir()` answers all of them from memory.

    Cached for the life of the process, which is the life of a run. A
    corrections file appearing *while* a run is in flight is not a case this
    pipeline has, and treating the layer as a snapshot for the duration is the
    same posture the drift guards already take -- they compare against what
    was filed when the run started, not against a moving target.

    A missing directory reads as empty rather than raising: `pipeline/overrides/`
    being absent is a legitimate state (no override has ever been needed), and
    the emptiness of that layer is documented as a feature."""
    idx = _dir_indexes.get(directory)
    if idx is None:
        try:
            idx = frozenset(
                entry.stem for entry in directory.iterdir() if entry.suffix == ".json"
            )
        except (FileNotFoundError, NotADirectoryError):
            idx = frozenset()
        _dir_indexes[directory] = idx
    return idx


def read_text_or_none(path: Path) -> str | None:
    """The file's text, or None if it is not there or not readable as UTF-8.

    One syscall where `path.exists()` followed by `path.read_text()` was two,
    and without the race between them. Used wherever an absent file is an
    ordinary outcome rather than an error."""
    try:
        return path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def json_text(value) -> str:
    """The corpus's one JSON spelling: indent 2, real UTF-8, trailing newline.

    Every scraper had spelled this inline, and two of them had the keyword
    arguments in a different order, which reads like a difference and is not.
    Shared so that "what a corpus file looks like" has one answer."""
    return json.dumps(value, indent=2, ensure_ascii=False) + "\n"


def read_bytes_or_none(path: Path) -> bytes | None:
    """The file's bytes, or None if it is not there.

    The cache-hit half of every `Fetcher` in this directory was `exists()`
    followed by `read_bytes()` -- two syscalls, the second of which re-answers
    the question the first just asked, with a race in between. The fetchers
    themselves stay separate (see this module's docblock); only this one line
    of them was ever the same."""
    try:
        return path.read_bytes()
    except OSError:
        return None


def file_has_text(path: Path, text: str) -> bool:
    """Is `path` exactly `text` already?

    Checks the SIZE first, which is one `stat` against a full read. JSON that
    has genuinely changed almost never lands on the same byte count, so the
    common changed case is settled without reading the file at all -- which
    matters because the caller is about to overwrite it anyway. Only a
    size match pays for the read that decides it."""
    encoded = text.encode("utf-8")
    try:
        if path.stat().st_size != len(encoded):
            return False
        return path.read_bytes() == encoded
    except OSError:
        return False


def write_if_changed(path: Path, text: str) -> bool:
    """Write `text` to `path` only when that is not already its content.

    A re-parse rewrote every file in `build/` on every run -- 18.1 MB of
    sections.json and structure.json alone -- whether or not the parser had
    changed its mind about a single byte.

    THE REASON OUTLIVED THE ONE IT WAS WRITTEN FOR. This was argued from git:
    the directory was tracked, and a diff in which all 1,229 files look
    touched cannot show which document a parser fix actually moved. `build/`
    stopped being tracked on 2026-08-27 (docs/decisions.md §The corpus), and
    the guard is worth more rather than less -- `git status` is no longer
    available to answer "what did this fix move", so the mtimes and the
    directory comparison in the next function are what is left. Rewriting
    everything unconditionally would destroy that too.

    A trade rather than a pure saving -- it reads on every document to skip a
    write on the unchanged ones. That is the right way round here, because the
    expected case after a parser fix is that most documents are unaffected."""
    if file_has_text(path, text):
        return False
    path.write_text(text, encoding="utf-8")
    return True


def _restamp(value, field: str, stamp):
    """`value` with its top-level `field` replaced, if it has one."""
    if isinstance(value, dict) and field in value:
        return {**value, field: stamp}
    return value


def write_stamped_json(
    out_dir: Path,
    payloads: dict[str, object],
    stamp: str,
    *,
    stamp_field: str = "generated_at",
    remove: tuple[str, ...] = (),
) -> bool:
    """Write a work's files, but only if something other than the clock moved.

    THE GUARD THIS DIRECTORY NEEDED. Every scraper here rewrote its whole
    output on every run, and the reason the obvious fix does not work on its
    own is `generated_at`: it is regenerated each run by construction, so a
    plain "skip identical files" check would still rewrite every manifest and
    every receipt, every time, to record that a run happened. Each scraper
    would have had to rediscover that, and the one that forgot would quietly
    put the churn back. So the rule lives here, once, and output goes through
    it.

    The comparison substitutes the STORED stamp into this run's payloads. If
    everything else matches, nothing is written and the work keeps the time it
    had -- so `generated_at` means "when this content was generated" rather
    than "when a run last touched the file", which is what it has to mean to
    be worth reading at all. It was written to be read in a git diff; with
    `build/` untracked since 2026-08-27 it is read by `audit.py` and by
    whoever is diffing two rebuilds, which needs the same property.

    ALL OR NOTHING across the work's files. Keeping an old stamp on a manifest
    while a sibling file changed underneath it would be a worse lie than the
    churn; if any file moved, they are all restamped.

    Names may be nested (`books/Gen.json`), which is what lets a work whose
    parts live in a subdirectory -- the Bibles, 73 book files beside a
    manifest -- be judged as the single unit it is. A book changing is a
    reason to restamp the manifest that counts them.

    `remove` names files that must not exist for this work -- a receipt whose
    reason for existing has gone away. Returns whether anything was written."""
    out_dir.mkdir(parents=True, exist_ok=True)

    # The stamp on disk comes from the first payload that carries one. Read
    # once and kept, because it is also that file's comparison text.
    stored, stored_raw, stamped_name = None, None, None
    for name, value in payloads.items():
        if isinstance(value, dict) and stamp_field in value:
            stamped_name = name
            stored_raw = read_text_or_none(out_dir / name)
            if stored_raw:
                try:
                    stored = json.loads(stored_raw).get(stamp_field)
                except json.JSONDecodeError:
                    stored = None
            break

    if stored is not None:
        unchanged = True
        for name, value in payloads.items():
            text = json_text(_restamp(value, stamp_field, stored))
            hit = (
                (text == stored_raw)
                if name == stamped_name
                else file_has_text(out_dir / name, text)
            )
            if not hit:
                unchanged = False
                break
        if unchanged and not any((out_dir / name).exists() for name in remove):
            return False

    wrote = False
    for name, value in payloads.items():
        path = out_dir / name
        path.parent.mkdir(parents=True, exist_ok=True)
        if write_if_changed(path, json_text(_restamp(value, stamp_field, stamp))):
            wrote = True
    for name in remove:
        path = out_dir / name
        if path.exists():
            path.unlink()
            wrote = True
    return wrote
