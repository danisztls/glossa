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

WHAT BELONGS HERE is code with no per-source behaviour -- or code whose
per-source behaviour can be DECLARED rather than open-coded. That second
clause is newer than this module, and it is the whole of the difference
between the two lists below.

WHAT IS SHARED, and why sharing it costs nothing:

  - **The fetching skeleton** (`Fetcher`, `FetchPolicy`). This module used to
    say the four `Fetcher`s could not be shared, because they "genuinely
    differ -- retry policy, raise-vs-return-status error handling, even the
    HTTP library -- and unifying them is a design decision about behavior, not
    a mechanical merge". Every word of that stayed true; what changed is that
    the design decision was taken. The differences are now `FetchPolicy`, a
    value each scraper declares for its own source, and the identical part --
    look in the cache, wait out the floor, make one request, store the bytes
    verbatim -- is written once.
  - **Rate limits, as declared values.** Still not shared, and the guarantee
    is stronger than before: `FetchPolicy` has no default for `delay` or
    `user_agent`, so a new scraper cannot inherit another source's floor by
    forgetting to state one. Four copies of `CRAWL_DELAY = 2.0` never provided
    that. vatican.va's 2.0s is a commitment from its robots.txt
    (docs/decisions.md); sacredbible.org and liriocatolico.com.br chose their
    own, and sacredbible.org spends its floor AFTER a request rather than
    before -- a difference `delay_before` preserves precisely because it is
    the kind of thing a "consistency" merge would quietly erase.
  - **Output writing** (`write_stamped_json`, `write_if_changed`,
    `json_text`). Not merely duplicated: the `generated_at` trap that defeats
    the naive version is a thing each scraper would have to rediscover, and
    the one that forgot would silently rewrite the corpus every run.
  - **The corrections receipt** (`corrections_receipt`) and the **text
    utilities** below (`fold`, `roman_to_int`, `looks_like_number_typo`).
    Character-for-character identical across the scrapers that had them, and
    making claims about roman numerals and digit strings rather than about
    any source.

WHAT IS STILL NOT SHARED, because the duplication is only apparent:

  - **`strip_tags`.** compendium.py's copy deliberately turns `<br/>` into a
    space before dropping other tags, which ccc.py's does not; that difference
    is documented at its call site and would be silently lost in a merge.
  - **Decoding.** cp1252-always and sniff-the-`<meta>`-charset are claims
    about particular servers, so `Fetcher` takes a `decode` callable and each
    scraper supplies its own.
  - **Validation, and per-edition oracles.** `cpdv.py` and `vulgate.py` have
    byte-identical `validate` functions today and must keep them apart:
    `sacredbible.py`'s docblock records that these assert things about *an
    edition*, not about a template, and being equal right now is not a reason
    to make them unable to diverge.
  - **Heading heuristics** (`is_mini_header`, `is_full_bold` and friends).
    Same category as `strip_tags`: they encode what a heading looks like in
    one source's markup.

None of these scrapers has tests, so anything moved here has to be verifiable
by reading -- and every migration into this module has been checked by running
all eleven entry points offline and diffing the corpus byte for byte.
"""

from __future__ import annotations

import json
import os
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

# This file lives at <repo>/pipeline/scrapers/common.py, so parents[2] is the
# repo root -- the same expression every scraper already used to locate its
# own corrections directory, under four different local names (SOURCE_ROOT,
# REPO_ROOT, ROOT, and prayers.py's CORRECTIONS_ROOT).
CORRECTIONS_DIR = Path(__file__).resolve().parents[2] / "pipeline" / "corrections"
OVERRIDES_DIR = Path(__file__).resolve().parents[2] / "pipeline" / "overrides"
ABSENT_SOURCES_PATH = (
    Path(__file__).resolve().parents[2] / "pipeline" / "absent-sources.json"
)

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

    A re-parse rewrote every file in `works/` on every run -- 18.1 MB of
    sections.json and structure.json alone -- whether or not the parser had
    changed its mind about a single byte. Now that `works/` is tracked in git
    (docs/decisions.md, 2026-08-23) the second cost is the one that bites: a
    diff in which all 1,229 files look touched cannot show which document a
    parser fix actually moved, which is the entire reason for tracking it.

    A trade rather than a pure saving -- it reads on every document to skip a
    write on the unchanged ones. That is the right way round here, because the
    expected case after a parser fix is that most documents are unaffected."""
    if file_has_text(path, text):
        return False
    path.write_text(text, encoding="utf-8")
    return True


def corrections_receipt(
    work_id: str,
    applied: list[dict],
    corrections: list[dict],
    generated_at: str,
) -> dict:
    """The corrections receipt as a value (docs/corpus-schema.md #Corrections).

    Five scrapers had built this dict, and after the receipts became values
    rather than writes the five bodies were character for character the same.
    Nothing here is per-source: `applied` and `corrections` are already this
    work's own, and an entry carrying a `resolution` is documented-but-not-
    applied by the policy in docs/decisions.md, not by any one source's
    reading of it.

    Written by `write_stamped_json` along with the rest of the work, which is
    why it is built rather than written: the same payload is rendered twice,
    once with the stored stamp to compare and once with this run's to save."""
    return {
        "work_id": work_id,
        "generated_at": generated_at,
        "applied": applied,
        "unresolved": [c for c in corrections if c.get("resolution")],
        "count": len(applied),
    }


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
    be worth reading in a git diff now that `works/` is tracked
    (docs/decisions.md, 2026-08-23).

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


# --------------------------------------------------------------------------
# Fetching
#
# THIS MODULE'S DOCBLOCK USED TO SAY `Fetcher` WAS NOT SHARED, because the
# implementations "genuinely differ -- retry policy, raise-vs-return-status
# error handling, even the HTTP library -- and unifying them is a design
# decision about behavior, not a mechanical merge". The first half was true and
# stays true. The second half was a reason to WAIT for that decision, not a
# reason never to take it, and it has now been taken: unify the skeleton, keep
# every policy.
#
# What was duplicated six times was the shape, and it was the same shape every
# time: look in the cache; on a miss, wait out the politeness floor, make one
# request, store the bytes verbatim. What differed was never that sequence --
# it was a handful of knobs, open-coded, which is how vatican.va's `Crawl-delay`
# ended up asserted in four separate files where it reads like an
# implementation detail instead of the commitment docs/decisions.md says it is.
#
# A RATE LIMIT IS STILL NOT SHARED. It is DECLARED -- `FetchPolicy` has no
# default for `delay` or `user_agent`, so a new scraper cannot inherit another
# source's floor by forgetting to state one, and each declaration sits next to
# the reason for it. That is a stronger guarantee than four copies of the same
# literal, which is what the old arrangement actually provided.
#
# WHAT IS NOT HERE, deliberately: the HTTP library. `vatican_docs.py`, `ccc.py`
# and `compendium.py` are PEP 723 scripts with `dependencies = []`, so this
# module must stay stdlib-only; `transport` is a callable, `urllib_transport`
# is the default, and the two httpx-based scrapers pass their own. Decoding is
# also the caller's: cp1252-always and sniff-the-meta-charset are claims about
# a specific source, not about fetching.
# --------------------------------------------------------------------------

# --------------------------------------------------------------------------
# Text utilities that are about text, not about a source
#
# The bar `strip_tags` failed is the bar these clear. That one looks duplicated
# and is not: compendium.py's copy turns `<br/>` into a space and ccc.py's does
# not, and the difference is a claim about how one source marks up a line
# break. Nothing below makes a claim about any source -- roman numerals,
# Unicode combining marks and digit strings are the same everywhere -- so there
# is no divergence to preserve and no coupling created by sharing them.
# --------------------------------------------------------------------------


def fold(s: str) -> str:
    """Uppercase + strip accents, for robust (typo/accent-insensitive) label
    matching.

    Length-preserving for every character these labels use (single precomposed
    accented Latin letters), so a match offset in the folded string is safe to
    reuse against the original -- compendium.py depends on that and it is worth
    keeping written down."""
    s = unicodedata.normalize("NFKD", s.upper())
    return "".join(c for c in s if not unicodedata.combining(c))


_ROMAN_VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s: str) -> int | None:
    """The value of a roman numeral, or None if it is not one."""
    s = s.upper()
    if not s or any(c not in _ROMAN_VALUES for c in s):
        return None
    total, prev = 0, 0
    for ch in reversed(s):
        v = _ROMAN_VALUES[ch]
        total += -v if v < prev else v
        prev = max(prev, v)
    return total or None


def looks_like_number_typo(cand: int, expected: int) -> bool:
    """True when `cand` differs from `expected` by exactly one digit at the
    same string length (e.g. 2117 vs 2217, or 81 vs 87) -- a plausible
    single-keystroke misprint of a unit number, as opposed to an unrelated
    number that happens to start a block."""
    a, b = str(cand), str(expected)
    return len(a) == len(b) and sum(x != y for x, y in zip(a, b)) == 1


#: Statuses that mean the origin ANSWERED, and the answer is "no such page".
#: Retrying one cannot change it; see AbsentSources for what is done instead.
DEFINITIVE_ABSENCE = frozenset({404, 410})


class FetchError(Exception):
    """A transport failure. `status` is the HTTP status, when there was one.

    A transport must raise this rather than its library's own exception, which
    is what keeps `Fetcher` from having to know whether it is talking to
    urllib or httpx."""

    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


@dataclass(frozen=True)
class FetchPolicy:
    """One source's fetching conduct, as data rather than as code.

    `delay` and `user_agent` have NO DEFAULTS on purpose -- see the note above.

    `delay_before` says whether the floor is spent before a request or after
    it, and the difference is real rather than stylistic. Waiting beforehand
    counts whatever the scraper did in between (parsing, writing) toward the
    delay; sleeping afterwards does not, so the same number is a slower crawl.
    sacredbible.org's scrapers sleep afterwards and keep doing so: switching
    them to the other mode would make their requests come sooner than they do
    today, which is a loosening of a self-imposed floor and not this change's
    to make.

    `attempts` above 1 needs a `backoff` entry per gap between attempts. The
    retries exist for transient failures; a status in `definitive` breaks out
    of the loop, because the origin has already answered."""

    user_agent: str
    delay: float
    delay_before: bool = True
    attempts: int = 1
    backoff: tuple[float, ...] = ()
    timeout: float = 30.0
    definitive: frozenset[int] = DEFINITIVE_ABSENCE

    def __post_init__(self):
        if self.attempts < 1:
            raise ValueError(f"attempts must be >= 1, got {self.attempts}")
        if len(self.backoff) < self.attempts - 1:
            raise ValueError(
                f"attempts={self.attempts} needs {self.attempts - 1} backoff "
                f"value(s), got {len(self.backoff)}"
            )


def urllib_transport(url: str, *, user_agent: str, timeout: float) -> bytes:
    """The stdlib transport. Raises FetchError, carrying the status if any."""
    req = Request(url, headers={"User-Agent": user_agent})
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except HTTPError as exc:
        raise FetchError(f"{url}: {exc}", status=exc.code) from exc
    except URLError as exc:
        raise FetchError(f"{url}: {exc}") from exc


def httpx_transport(client):
    """A `Fetcher` transport backed by an httpx client.

    THE LAZY IMPORT IS THE POINT. This module is imported by PEP 723 scripts
    declaring `dependencies = []` (`vatican_docs.py`, `ccc.py`,
    `compendium.py`, `prayers.py`), so it must not import httpx at module
    load. Deferring it to the call means only the two scrapers that already
    depend on httpx ever pay for it -- and they hand in a live client, so it
    is installed by definition by the time this runs.

    The whole job is turning one library's exceptions into `FetchError`, which
    is what keeps `Fetcher` from having to know which library it is talking
    to. It is here rather than in `sacredbible.py` because that module is a
    page FORMAT shared by one host's two editions and says so; an HTTP error
    taxonomy is not a coincidence of that host."""
    import httpx

    def transport(url: str, *, user_agent: str, timeout: float) -> bytes:
        try:
            resp = client.get(url, headers={"User-Agent": user_agent}, timeout=timeout)
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise FetchError(f"{url}: {exc}", status=exc.response.status_code) from exc
        except httpx.HTTPError as exc:
            raise FetchError(f"{url}: {exc}") from exc
        return resp.content

    return transport


@dataclass
class Fetcher:
    """Cache-first, rate-limited fetching, with the conduct supplied as policy.

    Two ways to ask, because the callers genuinely want different things and
    that is a property of the call rather than a knob to configure:

      - `try_fetch` returns `(bytes, None)` or `(None, error)` and NEVER
        raises. `vatican_docs.py` crawls hundreds of documents and one dead URL
        must not kill the run.
      - `fetch_bytes` raises `FetchError`. The single-work scrapers crawl one
        document each, where a failed page means the output would be wrong and
        stopping is the correct response.

    `cache_name` may contain subdirectories; parents are created as needed."""

    cache_dir: Path
    policy: FetchPolicy
    transport: object = urllib_transport
    #: bytes -> str for this source. cp1252-always and sniff-the-meta-charset
    #: are claims about a particular server's pages, so the choice is declared
    #: per scraper; only the "decode what was just fetched" wrapper is shared.
    decode: object = None
    # Unquoted despite AbsentSources being defined below: `from __future__
    # import annotations` makes every annotation a string at runtime.
    absent: AbsentSources | None = None
    #: Ask again for URLs already recorded absent (`--recheck-absent`).
    recheck_absent: bool = False
    #: Never touch the network; a cache miss is an error.
    offline: bool = False
    #: Ignore the cache on read, refetching and overwriting it.
    refresh: bool = False
    network_fetches: int = field(default=0, init=False)
    retried_ok: int = field(default=0, init=False)
    cache_hits: int = field(default=0, init=False)
    _last_request: float = field(default=0.0, init=False)

    def __post_init__(self):
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        if self.absent is None:
            self.absent = AbsentSources()

    def _wait(self) -> None:
        elapsed = time.monotonic() - self._last_request
        if elapsed < self.policy.delay:
            time.sleep(self.policy.delay - elapsed)

    def cached(self, cache_name: str) -> bytes | None:
        """The cached bytes for `cache_name`, honouring `refresh`."""
        if self.refresh:
            return None
        data = read_bytes_or_none(self.cache_dir / cache_name)
        if data is not None:
            self.cache_hits += 1
        return data

    def try_fetch(self, url: str, cache_name: str) -> tuple[bytes | None, str | None]:
        """Cached, rate-limited, retrying fetch. Exactly one of the pair is
        None. Never raises."""
        data = self.cached(cache_name)
        if data is not None:
            return data, None
        if not self.recheck_absent:
            known = self.absent.knows(url)
            if known is not None:
                return None, (
                    f"{url}: HTTP Error {known['status']} (recorded absent "
                    f"{known.get('observed', 'previously')}; --recheck-absent "
                    "to re-ask)"
                )
        if self.offline:
            return (
                None,
                f"{url}: offline and not cached at {self.cache_dir / cache_name}",
            )

        last: str | None = None
        for attempt in range(self.policy.attempts):
            if self.policy.delay_before:
                self._wait()
            try:
                data = self.transport(
                    url,
                    user_agent=self.policy.user_agent,
                    timeout=self.policy.timeout,
                )
            except FetchError as exc:
                last = str(exc)
                self._last_request = time.monotonic()
                self.network_fetches += 1
                if exc.status in self.policy.definitive:
                    self.absent.record(url, exc.status, context=cache_name)
                    break
                if attempt < self.policy.attempts - 1:
                    time.sleep(self.policy.backoff[attempt])
                continue
            self._last_request = time.monotonic()
            self.network_fetches += 1
            if attempt > 0:
                self.retried_ok += 1
            path = self.cache_dir / cache_name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
            # A page that used to 404 and now fetches is the one event that
            # clears a ledger entry.
            self.absent.forget(url)
            if not self.policy.delay_before:
                time.sleep(self.policy.delay)
            return data, None
        return None, last

    def fetch_bytes(self, url: str, cache_name: str) -> bytes:
        """As `try_fetch`, but raising `FetchError` instead of reporting."""
        data, err = self.try_fetch(url, cache_name)
        if data is None:
            raise FetchError(err or f"{url}: fetch failed")
        return data

    def fetch_text(self, url: str, cache_name: str) -> tuple[str | None, str | None]:
        """`try_fetch` decoded through this fetcher's `decode`. Never raises."""
        data, err = self.try_fetch(url, cache_name)
        if data is None:
            return None, err
        return self._decode(data), None

    def fetch_str(self, url: str, cache_name: str) -> str:
        """`fetch_bytes` decoded through this fetcher's `decode`. Raises."""
        return self._decode(self.fetch_bytes(url, cache_name))

    def _decode(self, data: bytes) -> str:
        if self.decode is None:
            raise ValueError(
                "this Fetcher was built without a `decode`; use fetch_bytes, "
                "or declare how this source's pages are encoded"
            )
        return self.decode(data)


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


def load_corrections(work_id: str) -> list[dict]:
    """The recorded corrections for `work_id`, or `[]` when none are filed.

    An absent file is the normal case, not an error: most sources have no
    documented defect, and the layer is expected to apply zero corrections
    while still proving it ran (each scraper's own drift guard).
    """
    if work_id not in filed_work_ids(CORRECTIONS_DIR):
        return []
    path = CORRECTIONS_DIR / f"{work_id}.json"
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
