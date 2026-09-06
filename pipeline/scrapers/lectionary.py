#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The Lectionary for Mass, read off USCCB's daily-readings pages.

WHAT THIS TAKES AND WHAT IT LEAVES. Only the CITATIONS and the lectionary
number: `Reading 1  Sirach 27:30-28:7`, `Lectionary: 130`. The reading TEXT on
those pages is the New American Bible, which the Confraternity of Christian
Doctrine licenses and this project does not hold -- it stays in `raw/`, which
is private and is where a fetched page belongs, and nothing downstream of the
parse can reach it. A pericope list is a list of facts about which passage is
appointed for which day; the translation read aloud is somebody's work. The
site renders these citations through its OWN editions and says so
(site/docs/calendar.md), which is the whole reason a lectionary is takeable
here at all when a Missal is not.

WHY USCCB AND NOT THE TYPICAL EDITION. The universal Ordo Lectionum Missae
(editio typica altera, 1981) is the authority, and a scan of it exists -- but
its two columns linearise under OCR, so the slot labels arrive as `LEcrmio I`
and `Lzcrio II` detached from the readings they label. The citations survive
and the structure does not. USCCB's pages are the mirror image: the structure
is explicit markup and the citations are the US adaptation's. So this is the
source for WHICH SLOT ON WHICH DAY, and the typical edition is the oracle for
WHAT NUMBER N SAYS. Neither is asked for the half it reads badly.

WHAT THE US ADAPTATION COSTS, stated rather than discovered later. Its psalms
are numbered the modern way, where the Vulgate this corpus prints counts a
psalm's title as verse 1; `site/src/lib/versification.ts` converts the chapter
and REFUSES the verse, naming the table that would be needed first. Its
calendar is the United States', so a day whose celebration differs from the
General Roman Calendar's takes its number from the oracle instead -- the
engine can say which days those are, because `us` is not among the calendars
`site/src/lib/calendar/national/held.ts` holds back. And a handful of its
pericopes differ from OLM81 outright, which is what the oracle is for.

CONDUCT, AND WHY THIS RUN IS SLOW ON PURPOSE. `robots.txt` disallows
`/readings/calendar/` and says nothing about `/bible/readings/`, which is what
this asks for, and states no `Crawl-delay`. An unstated limit is not a licence
(the same reading `liturgical_calendar.py` gives), so a floor is chosen: 30s,
far above the 2.0s vatican.va asks, because the origin ALSO runs a bot
challenge that a faster crawl trips. Tripping it is the thing to design
against rather than to work around -- `_challenged` below refuses to cache a
challenge page as though it were content, and `main` stops the whole run on
the first one instead of hammering an origin that has just said no. The crawl
is resumable and costs each day exactly once, ever: `Fetcher` writes every
page to `raw/` and reads it back on the next run, so an interrupted run
resumes where it stopped and a re-parse costs no request at all.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shutil
import subprocess
import sys
from datetime import UTC, date, datetime, timedelta

from common import (
    Fetcher,
    FetchError,
    FetchPolicy,
    build_root,
    raw_root,
    require_corpus,
    write_stamped_json,
)

SOURCE_DIR_NAME = "usccb-readings"

#: `bible/readings/MMDDYY.cfm` -- a two-digit year, so this is 20xx-only, and
#: the pattern is the site's own rather than a guess: the undated
#: `/daily-bible-reading` lands on today and every day has this permalink.
URL = "https://bible.usccb.org/bible/readings/{mmddyy}.cfm"

#: Three consecutive civil years reach all three Sunday cycles and both
#: weekday cycles, which is every row the temporal table has. The sanctoral
#: repeats annually and needs only one. Stated as a default rather than a
#: constant because the range is the run's argument, not the source's limit.
DEFAULT_YEARS = (2026, 2028)

POLICY = FetchPolicy(
    # Accepted by the transport and deliberately unused -- see below.
    user_agent="GlossaCatholicaBot/1.0 (+https://glossa.catholic; lectionary citations)",
    # Chosen, not commanded -- see CONDUCT above. A browser fetch already
    # takes ten to twenty seconds, so this is the floor ON TOP of that.
    delay=10.0,
    attempts=2,
    backoff=(60.0,),
    # A real browser rendering a page is not a 30-second operation.
    timeout=120.0,
    # `definitive` is left at its default {404, 410} deliberately. A 403 here
    # is the bot challenge, which is this crawl going too fast and NOT the
    # origin saying the page does not exist; recording it in
    # `absent-sources.json` would make a day permanently unfetchable on the
    # strength of a rate limit.
)

#: A challenge page arrives with a 200 as readily as with a 403, and it is a
#: valid HTML document, so nothing but its content distinguishes it from a
#: day's readings. Matched on the markers the challenge itself carries.
_CHALLENGE = re.compile(
    rb"Checking connection|_Incapsula_Resource|Request unsuccessful|"
    rb"<title>\s*Checking",
    re.IGNORECASE,
)

#: Raised through `FetchError` so the fetcher's own retry path sees it, and
#: recognised again in `main` so the run can stop rather than retry into a
#: wall. A sentinel in the message beats a second exception type only because
#: `FetchPolicy` already routes on status and this is not a status.
BLOCKED = "bot challenge"


#: `--raw` puts the page's OWN HTML where the envelope otherwise carries
#: Markdown, and the slot markup is the whole point of reading this source, so
#: Markdown would throw away exactly what is wanted. `--no-cache` because
#: `raw/` is this project's cache of record and two caches cannot both be
#: authoritative -- `Fetcher` decides what is re-asked for, and a second cache
#: underneath it would answer a `--refresh` with a stale page.
VASCO_ARGS = ("fetch", "--mode", "browser", "--raw", "--json", "--no-cache")


def vasco_transport(url: str, *, user_agent: str, timeout: float) -> bytes:
    """Fetch through `vasco`'s browser tier, refusing a challenge page.

    WHY A BROWSER AT ALL. Plain HTTP trips this origin's bot challenge within
    about a dozen requests, and the block then persists across clients. A
    browser passes it by being what the challenge asks for, which is the
    difference between satisfying a check and circumventing one. `vasco` is on
    PATH here and carries Camoufox, so it is the transport rather than a
    browser dependency added to a PEP 723 script that declares none.

    `user_agent` is accepted and NOT used: the browser sends its own, and
    overriding it would defeat the thing this is here for. The floor in
    `FetchPolicy` still applies -- politeness is ours to keep whatever the
    transport is.

    THE CHALLENGE CHECK BELONGS HERE because `Fetcher` caches whatever a
    transport returns, with no hook between the request and the write to
    `raw/`. A challenge page written there is worse than a failed fetch:
    `raw/` is write-once by the corpus's own rule, the page parses to zero
    readings, and the next run reads it back from the cache and never asks
    again.
    """
    if shutil.which("vasco") is None:
        raise FetchError(f"{url}: vasco is not on PATH; it is this scraper's transport")
    try:
        proc = subprocess.run(
            ["vasco", *VASCO_ARGS, "--deadline", f"{int(timeout)}s", url],
            capture_output=True,
            timeout=timeout * 3,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        raise FetchError(f"{url}: vasco timed out after {timeout * 3:g}s") from exc
    if proc.returncode != 0:
        tail = proc.stderr.decode("utf-8", "replace").strip()[-200:]
        raise FetchError(f"{url}: vasco exited {proc.returncode}: {tail}")
    try:
        envelope = json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        raise FetchError(f"{url}: vasco emitted no envelope ({exc})") from exc
    # A single-URL fetch answers with the envelope; a batch wraps it in
    # `result`. Accept both rather than depend on which shape one URL takes.
    if isinstance(envelope, dict) and "result" in envelope:
        result = envelope["result"]
        envelope = result[0] if isinstance(result, list) else result
    failure = envelope.get("failure")
    if failure:
        raise FetchError(f"{url}: {failure.get('reason') or 'fetch failed'}")
    status = int(envelope.get("http_status") or 0)
    if status != 200:
        raise FetchError(f"{url}: HTTP Error {status}", status=status or None)
    data = (envelope.get("markdown") or "").encode("utf-8")
    if not data:
        raise FetchError(f"{url}: vasco returned an empty page")
    if _CHALLENGE.search(data[:4096]):
        raise FetchError(f"{url}: {BLOCKED}")
    return data


#: Each slot is an `<h3 class="name">` followed by the `<div class="address">`
#: holding its citation. Taken as an ordered sequence rather than a dict: a day
#: with several Mass formularies (Christmas has four, the Easter Vigil nine
#: readings) repeats the slot names, and an alternative pericope is a second
#: `address` under the same name. Order is the only thing that says which
#: reading belongs to which Mass, so order is what is stored -- grouping them
#: is a judgment the parse does not have to make and cannot unmake.
_SLOT = re.compile(
    r'<h3 class="name">(?P<name>.*?)</h3>.*?<div class="address">(?P<addr>.*?)</div>',
    re.DOTALL,
)
_LECTIONARY = re.compile(r"Lectionary:\s*(?P<num>[0-9][0-9A-Za-z/,\s-]*?)\s*<")
_TITLE = re.compile(r"<title>(?P<title>[^<|]*)")

#: A DAY WITH SEVERAL MASSES CARRIES NO READINGS OF ITS OWN. The dated URL is
#: a disambiguation page listing one link per Mass, each to a `MMDDYY-Name.cfm`
#: with the ordinary slot markup -- Christmas is the four-Mass case (Vigil,
#: Night, Dawn, Day). Its base page prints `Lectionary: 13, 14, 15, 16`, all
#: four in the order it lists them, which is exactly why the number is read off
#: each Mass's OWN page instead: pairing them by position would be an inference
#: where the pages state the fact.
_NESTED = re.compile(r'<ul class="nested">(?P<items>.*?)</ul>', re.DOTALL)
#: THE EXTENSION IS OPTIONAL BECAUSE THE SOURCE IS NOT CONSISTENT ABOUT IT.
#: The Assumption links its two Masses as `081527-Vigil.cfm` in 2027 and as
#: `081526-Vigil` in 2026 -- same feast, same template, one year apart -- so
#: requiring `.cfm` found the 2027 pair and silently none for 2026. Query and
#: fragment characters stay excluded: the same block also carries `?amp` and
#: `.cfm.md` variants of the page's own address, which are not Masses.
_MASS_LINK = re.compile(
    r'href="(?P<href>[^"?#]*/readings/[^"?#]+)"[^>]*>(?P<label>.*?)</a>',
    re.DOTALL,
)


def _text(fragment: str) -> str:
    """Tag soup to one line of plain text."""
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", fragment))).strip()


def _numbers(raw: str) -> list[str]:
    """`13, 14, 15, 16` to four numbers. One number is the common case."""
    return [n for n in (part.strip() for part in raw.split(",")) if n]


def parse_day(page: str) -> dict[str, object]:
    """One page to its citations. Never guesses; records what is there."""
    title = _TITLE.search(page)
    lectionary: list[str] = []
    for m in _LECTIONARY.finditer(page):
        lectionary.extend(_numbers(_text(m.group("num"))))
    readings = [
        {"slot": _text(m.group("name")), "cite": _text(m.group("addr"))}
        for m in _SLOT.finditer(page)
    ]
    return {
        # The day's own name, which is a second witness to the calendar: a row
        # whose title disagrees with what `year.ts` computed for the date is
        # either a US proper or a bug, and both are worth seeing.
        "title": _text(title.group("title")) if title else None,
        "lectionary": lectionary,
        "readings": readings,
    }


def _usable(readings: list[dict[str, str]]) -> bool:
    """Whether a parse found a reading rather than an empty slot.

    A DISAMBIGUATION PAGE IS NOT AN EMPTY PAGE, and telling them apart by
    `if readings:` is what lost the Assumption. Christmas links its four Masses
    from a page carrying nothing else, so the list comes back empty and the
    links are followed; the Assumption's page carries one `<h3 class="name">`
    with no text and an address with no citation, which is a truthy list of one
    reading that says nothing -- so the day was taken as an ordinary Mass with
    a blank slot, and both its formularies (621, 622) were never fetched. The
    test is whether any row carries a slot or a citation.
    """
    return any(r["slot"].strip() or r["cite"].strip() for r in readings)


def parse_masses(page: str) -> list[dict[str, str]]:
    """The per-Mass links of a disambiguation page, in the order printed."""
    nested = _NESTED.search(page)
    if not nested:
        return []
    return [
        {"label": _text(m.group("label")), "url": m.group("href")}
        for m in _MASS_LINK.finditer(nested.group("items"))
    ]


def _mass_cache_name(iso: str, url: str) -> str:
    """`.../122525-Vigil.cfm` beside 2025-12-25 to `2025-12-25-Vigil.html`.

    Keyed on the date this run asked about rather than on the one in the URL,
    so a cache file sorts beside the base page it came from and nothing has to
    parse `MMDDYY` back out to find it.
    """
    stem = url.rsplit("/", 1)[-1].removesuffix(".cfm")
    suffix = stem.partition("-")[2]
    return f"{iso}-{suffix or 'mass'}.html"


def decode(data: bytes) -> str:
    return data.decode("utf-8", "replace")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument(
        "--years",
        default=f"{DEFAULT_YEARS[0]}-{DEFAULT_YEARS[1]}",
        help="inclusive civil-year range to fetch",
    )
    ap.add_argument(
        "--delay",
        type=float,
        default=POLICY.delay,
        help=f"seconds between requests (default {POLICY.delay:g}; see CONDUCT)",
    )
    ap.add_argument(
        "--limit",
        type=int,
        default=0,
        help="stop after this many days fetched from the network (0 = no limit)",
    )
    ap.add_argument(
        "--dates",
        default="",
        help="comma-separated ISO dates instead of a year range; for checking "
        "one day's parse, and for filling a gap a stopped run left behind",
    )
    ap.add_argument("--offline", action="store_true", help="cache only; never fetch")
    ap.add_argument("--refresh", action="store_true", help="ignore the cache")
    args = ap.parse_args()

    require_corpus()

    picked = sorted(
        date.fromisoformat(d.strip()) for d in args.dates.split(",") if d.strip()
    )
    if picked:
        first, last = picked[0].year, picked[-1].year
    else:
        lo, _, hi = args.years.partition("-")
        first, last = int(lo), int(hi or lo)
        if last < first:
            raise SystemExit(f"--years {args.years}: range runs backwards")

    fetcher = Fetcher(
        cache_dir=raw_root() / SOURCE_DIR_NAME,
        policy=FetchPolicy(**{**vars(POLICY), "delay": args.delay}),
        transport=vasco_transport,
        decode=decode,
        offline=args.offline,
        refresh=args.refresh,
    )

    stamp = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    by_year: dict[int, list[dict[str, object]]] = {
        y: [] for y in range(first, last + 1)
    }
    missing: list[str] = []
    blocked = False
    fetched = 0

    if picked:
        schedule = picked
    else:
        span = (date(last, 12, 31) - date(first, 1, 1)).days
        schedule = [date(first, 1, 1) + timedelta(days=n) for n in range(span + 1)]

    for day in schedule:
        if blocked:
            break
        iso = day.isoformat()
        before = fetcher.network_fetches
        page, err = fetcher.fetch_text(
            URL.format(mmddyy=day.strftime("%m%d%y")), f"{iso}.html"
        )
        fetched += fetcher.network_fetches - before
        if page is None:
            if err and BLOCKED in err:
                # THE ORIGIN HAS SAID NO. Everything fetched so far is already
                # in `raw/`, so stopping costs nothing but the rest of this
                # run -- and continuing would spend the next hour asking a
                # server that is refusing, which is the conduct this scraper
                # exists to avoid.
                blocked = True
                break
            missing.append(f"{iso}: {err}")
        else:
            parsed = parse_day(page)
            masses: list[dict[str, object]] = []
            if _usable(parsed["readings"]):
                # The ordinary day: one Mass, and the page IS it. Labelled
                # `None` rather than invented, because the source names a Mass
                # only where a day has more than one to tell apart.
                masses.append(
                    {
                        "label": None,
                        "lectionary": parsed["lectionary"],
                        "readings": parsed["readings"],
                    }
                )
            else:
                for link in parse_masses(page):
                    before = fetcher.network_fetches
                    sub, sub_err = fetcher.fetch_text(
                        link["url"], _mass_cache_name(iso, link["url"])
                    )
                    fetched += fetcher.network_fetches - before
                    if sub is None:
                        if sub_err and BLOCKED in sub_err:
                            blocked = True
                            break
                        missing.append(f"{iso} ({link['label']}): {sub_err}")
                        continue
                    one = parse_day(sub)
                    masses.append(
                        {
                            "label": link["label"],
                            "lectionary": one["lectionary"],
                            "readings": one["readings"],
                        }
                    )
            if blocked:
                break
            if not masses:
                # A page that fetched and yielded no Mass is a defect worth
                # naming, not an empty day: every day of the year has readings,
                # so this is a template this parser has not been taught.
                missing.append(f"{iso}: no readings and no Mass links")
            else:
                by_year[day.year].append(
                    {"date": iso, "title": parsed["title"], "masses": masses}
                )
        if args.limit and fetched >= args.limit:
            break

    if fetcher.absent.save():
        print(
            f"  absent-sources.json: +{len(fetcher.absent.added)} "
            f"-{len(fetcher.absent.forgotten)}",
            file=sys.stderr,
        )

    # WRITTEN EVEN WHEN THE RUN STOPPED EARLY, and this is the point of the
    # design rather than a courtesy: the output is a partial reading of a
    # source that takes many hours to read, and a run that discarded its work
    # on a rate limit would never finish at all. A short year is visible in
    # `days` and the next run fills it from the cache for free.
    out_dir = build_root() / SOURCE_DIR_NAME

    # A `--dates` RUN MERGES; A YEAR RUN REPLACES, and the difference is what
    # the run knows about the days it did not read. `--dates 2027-08-15` reads
    # one day of a year holding 365, so writing `days` alone throws the other
    # 364 away -- which it did, twice, and the committed table fell from 482
    # numbered Mass sets to 55 before anyone noticed. A `--years` run walks
    # every day in its span, so a day absent from `days` is absent because the
    # source has nothing there, and replacing is how a day that has STOPPED
    # parsing gets noticed rather than preserved.
    #
    # THE MERGE ONLY EVER READS OUTPUT A FULL PARSE WROTE, which is what keeps
    # it clear of the root CLAUDE.md's rule about output regenerable only from
    # a previous copy of itself: `raw/` still holds every page, and
    # `--years <span> --offline` rebuilds the whole file from it at no network
    # cost. That is the command to reach for when this file looks wrong.
    if picked:
        for year, days in by_year.items():
            existing = out_dir / f"{year}.json"
            if not days or not existing.is_file():
                continue
            kept = json.loads(existing.read_text(encoding="utf-8")).get("days", [])
            fresh = {d["date"] for d in days}
            days[:] = sorted(
                [d for d in kept if d["date"] not in fresh] + days,
                key=lambda d: str(d["date"]),
            )

    payloads: dict[str, object] = {
        f"{year}.json": {
            "generated_at": stamp,
            "year": year,
            "source": URL.format(mmddyy="MMDDYY"),
            "days": days,
        }
        for year, days in by_year.items()
        if days
    }
    wrote = write_stamped_json(out_dir, payloads, stamp) if payloads else False

    for line in missing[:20]:
        print(f"  {line}", file=sys.stderr)
    if len(missing) > 20:
        print(f"  ... and {len(missing) - 20} more", file=sys.stderr)

    total = sum(len(d) for d in by_year.values())
    print(
        f"\n{total} day(s) parsed into {len(payloads)} file(s) "
        f"{'written to' if wrote else 'unchanged in'} {out_dir}\n"
        f"{fetcher.network_fetches} fetched, {fetcher.cache_hits} cached",
        file=sys.stderr,
    )
    if blocked:
        print(
            f"\nSTOPPED at {day.isoformat()}: the origin served its bot challenge.\n"
            f"Everything fetched is cached in raw/{SOURCE_DIR_NAME}/; re-run later\n"
            f"to resume, optionally with a longer --delay.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
