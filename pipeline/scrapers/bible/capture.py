# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Capture a source's pages into `raw/`, from an inventory someone wrote down.

WHY THIS EXISTS AND WHAT IT IS NOT. It is not a scraper: it parses nothing,
writes nothing under `build/`, and knows no source's markup. It is the fetching
half of a scraper, extracted so that eight new Bible editions can be captured
before any of the eight parsers exist -- `docs/link-surface.md`'s insurance
policy is that capture regret is fixed by re-parsing rather than re-crawling,
and that policy only pays out for pages already in `raw/`. Capturing first
means the parser can be got wrong as many times as it takes without asking
someone else's server about it again.

An INVENTORY is a JSON file naming one source, its conduct, and every page to
be asked for:

    {
      "source": "crampon",
      "note":   "fr.wikisource, Bible Crampon 1923, one page per book",
      "user_agent": "Glossa Catholica corpus builder (+https://glossacatholica.org)",
      "delay": 2.0,
      "attempts": 3,
      "backoff": [3.0, 8.0],
      "timeout": 60.0,
      "pages": [{"url": "https://...", "path": "genese.html"}, ...]
    }

`delay` and `user_agent` are required, with no default, for the reason
`FetchPolicy` gives them none: a source's crawl floor is a commitment about
conduct toward a particular server, and a floor inherited by forgetting to
state one is not a commitment. Each inventory states the robots.txt it read.

`path` is relative to `raw/<source>/` and is the ONLY thing tying a captured
file to the URL it came from, so it should encode the address rather than a
sequence number. Duplicate paths are an error, not a last-write-wins.

Usage:
    uv run pipeline/scrapers/bible/capture.py inventories/crampon.json --limit 3
    uv run pipeline/scrapers/bible/capture.py inventories/crampon.json

Re-runs are free: `Fetcher` is cache-first, so a second run over a complete
capture makes no requests at all and is the cheapest way to verify one.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

# `common` is a package one directory up; see the note in cpdv.py. This is why
# the imports below are not at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import AbsentSources, Fetcher, FetchPolicy, raw_root, require_corpus


def load_inventory(path: Path) -> dict:
    """Read an inventory and refuse the ways it can be quietly wrong."""
    data = json.loads(path.read_text(encoding="utf-8"))
    for key in ("source", "user_agent", "delay", "pages"):
        if key not in data:
            raise SystemExit(f"{path}: inventory has no {key!r}")
    if not data["pages"]:
        raise SystemExit(f"{path}: inventory lists no pages")

    seen: dict[str, str] = {}
    for i, page in enumerate(data["pages"]):
        if "url" not in page or "path" not in page:
            raise SystemExit(f"{path}: pages[{i}] needs both 'url' and 'path'")
        rel = page["path"]
        if rel.startswith("/") or ".." in Path(rel).parts:
            raise SystemExit(f"{path}: pages[{i}] path {rel!r} escapes the source dir")
        # Two pages writing one file is the failure this catches: the second
        # overwrites the first, both report success, and the missing page is
        # discoverable only by counting files against the inventory later.
        if rel in seen:
            raise SystemExit(
                f"{path}: two pages claim {rel!r} -- {seen[rel]} and {page['url']}"
            )
        seen[rel] = page["url"]
    return data


def policy_for(inv: dict) -> FetchPolicy:
    backoff = tuple(inv.get("backoff", ()))
    return FetchPolicy(
        user_agent=inv["user_agent"],
        delay=float(inv["delay"]),
        attempts=int(inv.get("attempts", 1)),
        backoff=backoff,
        timeout=float(inv.get("timeout", 30.0)),
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("inventory", type=Path, help="path to the inventory JSON")
    ap.add_argument(
        "--limit",
        type=int,
        default=None,
        help="capture only the first N pages -- the sample pass, run and "
        "reviewed before the whole crawl (docs/corpus-schema.md)",
    )
    ap.add_argument(
        "--refresh",
        action="store_true",
        help="re-ask for pages already captured. `raw/` is write-once by "
        "policy; this is for a source known to have changed, not for a retry.",
    )
    ap.add_argument(
        "--offline",
        action="store_true",
        help="verify a capture without touching the network: every page must "
        "already be in the cache, and a miss is reported as a failure",
    )
    args = ap.parse_args()

    require_corpus()
    inv_path = args.inventory
    if not inv_path.is_absolute():
        # Inventories are named relative to this script's directory as often as
        # to the working directory, and guessing between them silently reads
        # the wrong file only if both exist.
        here = Path(__file__).resolve().parent / inv_path
        inv_path = here if here.is_file() else inv_path
    inv = load_inventory(inv_path)

    pages = inv["pages"]
    if args.limit is not None:
        pages = pages[: args.limit]

    cache_dir = raw_root() / inv["source"]
    fetcher = Fetcher(
        cache_dir=cache_dir,
        policy=policy_for(inv),
        # A definitive 404 is knowledge about the source and belongs in the
        # tracked ledger, not in this run's stderr -- but only when it is
        # really this source's answer, so the ledger is shared and keyed by URL.
        absent=AbsentSources(),
        refresh=args.refresh,
        offline=args.offline,
    )

    print(f"{inv['source']}: {len(pages)} page(s) -> {cache_dir}")
    if note := inv.get("note"):
        print(f"  {note}")
    print(f"  delay={fetcher.policy.delay}s ua={fetcher.policy.user_agent!r}")

    failures: list[tuple[str, str]] = []
    started = time.monotonic()
    for i, page in enumerate(pages, 1):
        _, err = fetcher.try_fetch(page["url"], page["path"])
        if err:
            failures.append((page["path"], err))
            print(f"  [{i}/{len(pages)}] FAILED {page['path']}: {err}", flush=True)
        elif i % 25 == 0 or i == len(pages):
            elapsed = time.monotonic() - started
            print(
                f"  [{i}/{len(pages)}] {fetcher.network_fetches} fetched, "
                f"{fetcher.cache_hits} cached, {len(failures)} failed "
                f"({elapsed:.0f}s)",
                flush=True,
            )

    fetcher.absent.save()
    print(
        f"{inv['source']}: {fetcher.network_fetches} fetched "
        f"({fetcher.retried_ok} after a retry), {fetcher.cache_hits} already "
        f"cached, {len(failures)} failed"
    )
    if failures:
        print("\nFAILED -- these pages are NOT in the corpus:", file=sys.stderr)
        for rel, err in failures:
            print(f"  {rel}: {err}", file=sys.stderr)
        # A genuine failure belongs in the run summary, never silently absent
        # from the corpus (CLAUDE.md).
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
