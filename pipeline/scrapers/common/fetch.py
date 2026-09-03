"""Cache-first, rate-limited fetching, with each source's conduct as policy."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from http.client import HTTPException
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .absent import AbsentSources
from .captured import record_capture
from .files import read_bytes_or_none

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
    except HTTPException as exc:
        # A response that BEGAN and then stopped -- `IncompleteRead` above all,
        # which is what a large file off a flaky edge looks like. urllib does
        # not wrap it in URLError, so without this it escapes as `http.client`'s
        # own exception, past every caller that handles FetchError and past the
        # retry loop that exists for exactly this. Found by a 51 MB PDF that
        # cut off eight megabytes in.
        raise FetchError(f"{url}: {type(exc).__name__}: {exc}") from exc
    except TimeoutError as exc:
        # A response that never BEGAN, which is the same failure one step
        # earlier and escaped the same way. `socket.timeout` has been an alias
        # for the builtin `TimeoutError` since 3.10, and a builtin is not a
        # `URLError`, so a read that timed out killed the whole run from
        # inside the one function whose contract is to raise `FetchError`.
        # `download_resumable` below has always caught it; this is the half
        # that had not. Found by a 6 MB PDF on a crawl of 1,061 pages that had
        # just succeeded.
        raise FetchError(f"{url}: read timed out after {timeout}s") from exc


#: How much of a resumed download to read per `recv`. Big enough that a
#: 50 MB file is not fifty thousand syscalls, small enough that a drop costs
#: at most this much re-fetching.
RESUME_CHUNK = 1 << 20


def download_resumable(
    url: str,
    dest: Path,
    *,
    policy: FetchPolicy,
    attempts: int = 6,
) -> tuple[int, str | None]:
    """Stream `url` to `dest`, resuming with `Range` after a dropped transfer.

    THIS IS NOT WHAT `Fetcher` DOES, and the difference is the file size.
    `Fetcher` reads a whole response into memory and returns it, which is
    right for the pages this pipeline is made of and wrong for a 50 MB PDF
    over an edge that drops long transfers: every retry there starts from
    zero, so a file big enough to outlast the connection can never be
    fetched by retrying harder. This appends to `dest.part` instead and asks
    for the rest, so each attempt keeps its ground.

    Returns `(bytes_on_disk, error)`; `error` is None only when the whole file
    arrived and was moved into place. A server that ignores `Range` answers
    200 instead of 206, which is handled by starting the file over rather than
    corrupting it with a second copy of the head.

    Rate-limited the same way `Fetcher` is, from the same policy -- a resumed
    request is still a request to someone else's server.
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_name(dest.name + ".part")
    expected: int | None = None
    last: str | None = None

    for _ in range(attempts):
        have = part.stat().st_size if part.exists() else 0
        if expected is not None and have >= expected:
            break
        headers = {"User-Agent": policy.user_agent}
        if have:
            headers["Range"] = f"bytes={have}-"
        time.sleep(policy.delay)
        try:
            with urlopen(Request(url, headers=headers), timeout=policy.timeout) as resp:
                if have and resp.status != 206:
                    have = 0  # Range refused; the body is the whole file again.
                content_range = resp.headers.get("Content-Range", "")
                length = resp.headers.get("Content-Length")
                if "/" in content_range:
                    total = content_range.rsplit("/", 1)[1].strip()
                    expected = int(total) if total.isdigit() else expected
                elif length and length.isdigit():
                    expected = have + int(length)
                with part.open("ab" if have else "wb") as fh:
                    while chunk := resp.read(RESUME_CHUNK):
                        fh.write(chunk)
        except (HTTPError, URLError, HTTPException, TimeoutError) as exc:
            last = f"{type(exc).__name__}: {exc}"

    have = part.stat().st_size if part.exists() else 0
    if expected is None:
        return have, last or f"{url}: never learned the file's length"
    if have < expected:
        return have, (
            f"{url}: stopped at {have:,} of {expected:,} bytes"
            + (f" ({last})" if last else "")
        )
    part.replace(dest)
    return have, None


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
            # The capture date, written by the code that made the request, at
            # the moment it made it. This is the only point where the answer is
            # known for certain: a cache hit returns above and never gets here,
            # so a re-parse cannot claim a retrieval that did not happen. See
            # common/captured.py for why it sits beside the page and not in the
            # manifest, which is where it used to live and get lost.
            record_capture(path)
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
