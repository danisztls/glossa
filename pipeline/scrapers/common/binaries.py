"""External command-line tools a scraper shells out to, and their identity.

WHY THIS EXISTS. Two scrapers already depend on a program this repository
does not ship -- `dore/plates.py` runs `avifenc`, `find-lost-spaces.py` runs
`hunspell` -- and the PDF editions add two more (`pdftotext`, `mutool`).
Every one of them is an INPUT to a parse that none of `rebuild.py`'s
fingerprints can see: `code` hashes this repository's Python, `data` its
non-Python files, `corpus` what is under `raw/`, and `outputs` what a stage
wrote. A poppler upgrade changes a parse without changing a byte of any of
them, which is the same shape as the `bs4`/`httpx` case `--force` exists for,
except that a system binary is upgraded by the package manager rather than
deliberately -- so nobody is present to think "I should force a rebuild".

`binary_identity` is what closes that. `rebuild.py` folds it into a stage's
fingerprint, so an upgraded reader reports as `readers` moved under
`--changed-only -v`, exactly as an edited parser reports `code`.

IDENTITY IS THE FILE'S CONTENT, NOT ITS `--version` STRING. Three reasons,
and the third is the one that decided it: a version string's format is not
promised stable across releases and parsing it is a second thing to get
wrong; some of these tools spell the flag differently (`mutool -v` writes to
stderr, `pdftotext -v` too); and a distribution can rebuild a package against
a new library, changing what it does, WITHOUT changing the version it prints.
Hashing the bytes on disk answers all three and costs one read of a few MB.

A MISSING BINARY IS NOT A CRASH HERE. `binary_identity` returns a marker
rather than raising, because a fingerprint is not the place to enforce a
dependency -- `rebuild.py --list` must work on a machine that has never had
poppler installed, and the stage that actually needs the tool is where the
loud failure belongs. That is `run_binary`, which raises with the name it
looked for.
"""

from __future__ import annotations

import hashlib
import shutil
import subprocess
from pathlib import Path

#: What `binary_identity` answers for a tool that is not on PATH. A stage
#: fingerprinted while the tool is missing and again once it is installed
#: reads as changed, which is correct: it could not have run the first time.
MISSING = "absent"


class BinaryMissingError(RuntimeError):
    """A required external tool is not on PATH."""


def binary_path(name: str) -> Path | None:
    found = shutil.which(name)
    return Path(found) if found else None


def binary_identity(name: str) -> str:
    """`name:<sha256 of the resolved executable>`, or `name:absent`.

    Follows `shutil.which`, so it identifies the program that would actually
    run, not a package version recorded somewhere else. Symlinked wrappers
    hash as their target because `read_bytes` follows the link.
    """
    path = binary_path(name)
    if path is None:
        return f"{name}:{MISSING}"
    try:
        digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16]
    except OSError:
        # Present but unreadable is not the same as absent, and must not
        # collide with it -- a fingerprint that flipped between the two on
        # a permissions change would skip a stage that should re-run.
        return f"{name}:unreadable"
    return f"{name}:{digest}"


def run_binary(argv: list[str], *, timeout: float | None = None) -> bytes:
    """Run an external tool, returning stdout, raising loudly on anything else.

    The failure mode this exists to prevent is the quiet one: a tool that is
    absent, or that wrote a diagnostic to stderr and exited 0 with a short
    read, silently producing a corpus with a hole in it. `dore/plates.py`
    states the same rule for `avifenc` -- "a plate that silently did not
    encode would be a hole in the apparatus".
    """
    if binary_path(argv[0]) is None:
        raise BinaryMissingError(
            f"{argv[0]} is not on PATH; it is required to read this source"
        )
    proc = subprocess.run(argv, capture_output=True, timeout=timeout)
    if proc.returncode != 0:
        err = proc.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"{' '.join(argv[:2])} exited {proc.returncode}: {err}")
    return proc.stdout
