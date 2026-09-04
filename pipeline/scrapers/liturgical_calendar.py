#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The General Roman Calendar, fetched from GCatholic as an ORACLE.

THIS SCRAPER PRODUCES NO WORK AND WRITES NOTHING TO `build/`. Every other
scraper here fetches a text and parses it into something the site reads; this
one fetches a calendar someone else computed so that the calendar THIS project
computes can be checked against it, day by day. The site's answer for a date
comes from `site/src/lib/calendar/`, which is arithmetic over the Universal
Norms and a table of the Church's fixed celebrations -- never from a row
fetched here. What lands in this repository is an oracle in the corpus's own
sense of the word (root CLAUDE.md): a reading of the source made once, kept,
and used to judge a derivation, with nothing downstream of it at runtime.

WHY AN ORACLE AND NOT A SOURCE. A liturgical calendar is the one kind of
content on this site that no amount of care makes self-evidently right. A
mis-parsed encyclical is visible in its own text; an Ordinary Time week
numbered one too high is invisible until someone who knows the year notices.
The precedence rules that produce it (Universal Norms n. 59's table of
liturgical days) are thirteen ranked classes interacting with two cycles and
three optional transfers, and the cases that break an implementation -- the
week Ordinary Time resumes at after Pentecost, a saint's memorial reduced to
a commemoration by Lent, an Epiphany-on-Sunday year -- are not visible in the
output unless something independent disagrees. A table of assertions written
by whoever wrote the algorithm cannot find those. A calendar computed by
someone else for the same years can.

WHY THE iCAL AND NOT THE HTML. GCatholic publishes both. The HTML tables
cover 2024-2028 and the iCal feeds only 2025-2027, so the HTML would buy two
more years -- and the feeds are still what this reads, because each `SUMMARY`
carries the LITURGICAL COLOUR and the rank as machine-readable tokens that
the HTML only paints in CSS. Colour is a computed property the site shows and
would otherwise go unchecked; two more Easters are worth less than a whole
column. The year window is a real limit of this oracle and is stated in
`YEARS` rather than worked around: cases outside it are covered by the
hand-written tests in `computus.test.ts` and `year.test.ts`, which is the
right tool for a year chosen for its rarity.

THE URL IS DETERMINISTIC, which is what makes the country dimension free:
`ics/{year}-{lang}-{calendar}.ics`, where `calendar` is `General-{A..H}` for
the eight transfer variants of the universal calendar or an ISO country code
for one of the ~100 national calendars. `CALENDARS` below names the ones
fetched, and adding a country is a row.

WHAT IS NOT TAKEN FROM HERE. The names in `site/src/lib/calendar/grc.ts` are
the calendar's own formulae, and this oracle is deliberately not their source
-- it is what proves the table is complete and correctly ranked, which is a
different claim. GCatholic's day rows are its editorial work; this repository
stores the parse as evidence for a check and publishes none of it as reading
text.

CONDUCT. `robots.txt` disallows `/temp/` and (separately) the AI-training
crawlers `GPTBot` and `Google-Extended`; `/calendar/` is open to `*`, which
is what this asks for. No `Crawl-delay` is stated, so the 2.0s floor is
chosen rather than commanded -- the same floor vatican.va asks for, on the
principle that an unstated limit is not a licence. The whole crawl is one
file per year, calendar and language in `CALENDARS`, and every one is cached
under `raw/`, so a re-parse costs no request and widening the languages a
calendar is checked in costs none either.
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    Fetcher,
    FetchPolicy,
    raw_root,
    require_corpus,
    write_stamped_json,
)

#: Where the fetched feeds live. One directory per source, as everywhere under
#: `raw/`; `captured-at.json` is written into it by `Fetcher`.
SOURCE_DIR_NAME = "gcatholic-calendar"

#: The oracle itself, checked into THIS repository rather than the corpus.
#: It is read by `site/src/lib/calendar/oracle.test.ts` and by nothing at
#: runtime, so it must travel with the tests that consult it -- the corpus is
#: a separate, private checkout that a test run cannot assume is present.
ORACLE_DIR = (
    Path(__file__).resolve().parents[2] / "site" / "src" / "lib" / "calendar" / "oracle"
)

BASE = "https://gcatholic.org/calendar/ics"

#: The years GCatholic publishes feeds for, measured 2026-09-03 by asking:
#: 2024 and earlier and 2028 and later answer 404, while the HTML tables cover
#: 2024-2028. A LIMIT OF THE ORACLE, NOT OF THE ENGINE -- the hand-written
#: tests cover years outside it from first principles.
YEARS = (2025, 2026, 2027)

#: What to fetch, and in which languages. `General-{A..H}` are the eight
#: transfer variants of the universal calendar; the rest are ISO 3166-1
#: alpha-2 country codes, each the GRC plus that conference's own propers,
#: elevations and transfers.
#:
#: NO NATIONAL CALENDAR HAS A LATIN EDITION and asking for one 404s. That is
#: correct rather than a gap: a national calendar's propers are approved in
#: the vernacular by the conference that has them, and GCatholic publishes
#: Latin only for the calendar that is a Latin book.
#:
#: WHICH COUNTRIES, AND WHY THESE. The order is Catholic population, largest
#: first -- the criterion the work was asked for, and the only one available
#: that is a fact rather than a preference. It reaches Germany at fifteen
#: countries, which is where the list stops; the next ones down (Uganda,
#: Tanzania, Canada, Vietnam) cost one row here and one file under
#: `site/src/lib/calendar/national/`, so the boundary is a decision and not a
#: limit. The populations themselves are not restated here: a count that rots
#: silently is worse than no count (root CLAUDE.md), and GCatholic's own
#: country pages carry them.
#:
#: THE UNITED STATES IS TWO CALENDARS AND NOT ONE. GCatholic publishes `US-D`
#: and `US-H` and no plain `US`, which is not an artefact of its URLs: the
#: Ascension is kept on the Thursday in the ecclesiastical provinces of
#: Boston, Hartford, New York, Newark, Omaha and Philadelphia and on the
#: Seventh Sunday of Easter everywhere else, so the country genuinely has
#: both. Fetching both is what lets the site's single US layer be checked
#: against both answers -- the propers do not differ between them, and the
#: Ascension is a flag the reader sets rather than a fact about the country.
CALENDARS: dict[str, tuple[str, ...]] = {
    "General-A": ("la", "en", "pt"),
    "General-B": ("la", "en", "pt"),
    "General-C": ("la", "en", "pt"),
    "General-D": ("la", "en", "pt"),
    "General-E": ("la", "en", "pt"),
    "General-F": ("la", "en", "pt"),
    "General-G": ("la", "en", "pt"),
    "General-H": ("la", "en", "pt"),
    "BR": ("pt", "en"),
    "MX": ("es", "en"),
    "PH": ("en",),
    "US-D": ("en",),
    "US-H": ("en",),
    "CO": ("es", "en"),
    "IT": ("it", "en"),
    "CD": ("fr", "en"),
    "FR": ("fr", "en"),
    "ES": ("es", "en"),
    "PL": ("pl", "en"),
    "AR": ("es", "en"),
    "PE": ("es", "en"),
    "VE": ("es", "en"),
    "IN": ("en",),
    "NG": ("en",),
    "DE": ("de", "en"),
}

#: THE FIRST LANGUAGE OF A CALENDAR IS ITS ANCHOR, and the only one whose
#: names reach the oracle file. Every language is still fetched and parsed --
#: that is what the cross-language agreement check below is made of, and it
#: is what caught GCatholic emitting a day's two optional memorials in one
#: order in Latin and the other in English -- but only the anchor's names are
#: written out.
#:
#: The reason is that the other languages could not be ASSERTED against
#: anything. This project's own English and Portuguese names are the Missal's
#: wordings, GCatholic's are its house style, and a test comparing them would
#: report a difference on nearly every saint while meaning nothing by it. The
#: Latin is different: it is the Calendarium Romanum Generale's own formula,
#: which both sides are reproducing rather than translating, so a disagreement
#: there is a real one. Brazil anchors on Portuguese because it has no Latin
#: edition and its propers were approved in Portuguese.
#:
#: The dropped languages are not lost. `raw/` holds every feed as fetched, so
#: widening this is a re-parse and never a re-crawl (root CLAUDE.md).

#: The three transfers each `General-` variant makes. The letters are
#: GCatholic's URLs' and mean nothing in themselves; this is what gives them
#: meaning, and they are the same three booleans `CalendarOptions` carries on
#: the site side. `A` is the universal calendar -- nothing transferred.
VARIANT_TRANSFERS: dict[str, tuple[bool, bool, bool]] = {
    # letter: (epiphany, ascension, corpusChristi) moved to a Sunday
    "A": (False, False, False),
    "B": (True, False, False),
    "C": (False, False, True),
    "D": (True, False, True),
    "E": (False, True, False),
    "F": (True, True, False),
    "G": (False, True, True),
    "H": (True, True, True),
}

TRANSFER_KEYS = ("epiphanyOnSunday", "ascensionOnSunday", "corpusChristiOnSunday")

#: `SUMMARY` opens with a coloured disc naming the vestment colour. GCatholic
#: emits five and no rose: Gaudete and Laetare are violet here and say
#: "(Gaudete)" / "(Laetare)" in the name instead. The site computes rose for
#: those two days, so `oracle.test.ts` accepts violet where it expects rose
#: and says why -- a difference between two calendars' conventions, not a
#: disagreement about the day.
#:
#: BLUE IS NOT A MISTAKE AND IS NOT UNIVERSAL. It appears on exactly one day
#: and in exactly two of the sixteen national calendars fetched here: the
#: Immaculate Conception, kept in blue under the *privilegio de azul* Spain
#: obtained in the eighteenth century, in Spain and in the Philippines. The
#: general calendar's answer for 8 December is white, so this is a fact about
#: a national calendar rather than about the feast, and the site carries it as
#: one -- an `overrides` row in each of those two layers.
#:
#: THE OBVIOUS GENERALISATION IS FALSE, and it is worth recording as such: the
#: privilege is described as Spain's and her former dominions', which predicts
#: the Spanish-speaking Americas, and Mexico, Colombia, Peru, Venezuela and
#: Argentina all print 8 December in white. Counting the discs over all
#: forty-eight feeds is what settles it -- the Philippines was the first
#: calendar fetched that showed the colour at all.
COLOURS = {"⚪": "white", "🟢": "green", "🟣": "violet", "🔴": "red", "🔵": "blue"}

#: The rank token in `SUMMARY`, per language. A day with no token is a Sunday
#: or a weekday, which the feed does not rank and the site ranks for itself.
#:
#: `m*` IS A FIFTH RANK AND NOT A SPELLING OF THE FOURTH: the commemoration
#: of a saint whose optional memorial Lent has suppressed (Universal Norms
#: nn. 14, 59). It is the one an implementation is most likely to be missing,
#: which is exactly the sort of thing this oracle is for.
#:
#: THE TOKEN IS THE LANGUAGE'S OWN INITIAL, which the first nine calendars
#: could not show because Latin, English, Portuguese, Spanish, Italian and
#: French all abbreviate to the same five letters. German prints `H F G g g*`
#: for *Hochfest, Fest, gebotener / nicht gebotener Gedenktag*, and Polish
#: `U Ś W w w*` for *uroczystość, święto, wspomnienie*. So a table read as
#: language-independent was a coincidence of six Romance-and-Latin feeds, and
#: the star suffix is the only part that genuinely is universal.
#:
#: A LANGUAGE ABSENT HERE FALLS BACK TO THE LATIN LETTERS rather than to
#: guessing, and an unknown token is fatal (`parse_feed`) — which is how this
#: was found, on the first Polish feed, rather than by silently ranking a
#: solemnity as nothing.
RANKS: dict[str, dict[str, str]] = {
    "*": {
        "S": "solemnity",
        "F": "feast",
        "M": "memorial",
        "m": "optional-memorial",
        "m*": "commemoration",
    },
    "de": {
        "H": "solemnity",
        "F": "feast",
        "G": "memorial",
        "g": "optional-memorial",
        "g*": "commemoration",
    },
    "pl": {
        "U": "solemnity",
        "Ś": "feast",
        "W": "memorial",
        "w": "optional-memorial",
        "w*": "commemoration",
    },
}

POLICY = FetchPolicy(
    user_agent="glossa-catholica/1.0 (+https://glossa.catholic; calendar oracle)",
    # Chosen, not commanded: gcatholic.org states no Crawl-delay. See the
    # module docstring on why an unstated limit is not a licence.
    delay=2.0,
    attempts=4,
    backoff=(2.0, 5.0, 15.0),
)


def decode(data: bytes) -> str:
    """GCatholic serves the feeds as UTF-8, as RFC 5545 requires."""
    return data.decode("utf-8")


def unfold(text: str) -> str:
    """Undo RFC 5545 line folding: a CRLF followed by one space or tab.

    Every long value in these feeds is folded, and folding lands INSIDE
    words -- a `SUMMARY` breaks mid-name and a `UID` mid-domain. Joining the
    continuation without stripping anything else is the whole of it; the
    single leading whitespace character is the fold marker, not content."""
    return re.sub(r"\r?\n[ \t]", "", text)


def unescape(value: str) -> str:
    """RFC 5545 §3.3.11 text escaping, undone in one left-to-right pass.

    A table of replacements applied in sequence gets this wrong: undoing
    `\\\\` first turns a literal backslash before a comma into an escape of
    it, and undoing it last leaves `\\\\n` as a newline. Consuming two
    characters at a time cannot make either mistake."""
    out: list[str] = []
    i = 0
    while i < len(value):
        c = value[i]
        if c == "\\" and i + 1 < len(value):
            nxt = value[i + 1]
            out.append("\n" if nxt in "nN" else nxt)
            i += 2
            continue
        out.append(c)
        i += 1
    return "".join(out)


_EVENT = re.compile(r"BEGIN:VEVENT(.*?)END:VEVENT", re.DOTALL)
#: `DTSTART` carries a `;VALUE=DATE` parameter; the others never do.
_DTSTART = re.compile(r"^DTSTART[^:]*:(.*)$", re.MULTILINE)
_UID_LINE = re.compile(r"^UID:(.*)$", re.MULTILINE)
_SUMMARY_LINE = re.compile(r"^SUMMARY:(.*)$", re.MULTILINE)
_DESCRIPTION_LINE = re.compile(r"^DESCRIPTION:(.*)$", re.MULTILINE)
#: `⚪ [m*] Saint Patrick, bishop` -> colour, rank, name. The rank bracket is
#: optional; the coloured disc never is. The token is matched as "anything but
#: a bracket" rather than as ASCII letters, because Polish's is `Ś` — see
#: `RANKS`, where an ASCII class quietly turned the token into part of the
#: name instead of failing.
_SUMMARY = re.compile(r"^(\S+)\s+(?:\[([^\]]+)\]\s+)?(.*)$", re.DOTALL)
_PSALTER = re.compile(r"Psalter Week ([IV]+)")
#: `2026-la-General-A-0322-1@gcatholic.org` -> year, language, calendar, the
#: day, and the celebration's index within it.
_UID = re.compile(r"^(\d{4})-([a-z]{2})-(.+?)-(\d{4})-(\d+)@")


def parse_feed(text: str, *, lang: str) -> dict[str, dict]:
    """One feed -> `{uid key: row}`, keyed so languages can be joined.

    KEYED BY UID RATHER THAN BY POSITION. The language editions of a year are
    the same calendar and their events do come out in the same order, but
    that is a property of GCatholic's generator rather than a promise, and
    zipping two lists that quietly differ attaches Latin names to English
    days from some point in the year onward -- an error that reads as a
    translation problem and is not one. The UID already carries the date and
    the index and differs only in its language segment, so dropping that
    segment gives a key both sides compute independently."""
    rows: dict[str, dict] = {}
    ranks = RANKS.get(lang, RANKS["*"])
    for body in _EVENT.findall(text):
        uid = _UID_LINE.search(body).group(1).strip()
        m = _UID.match(uid)
        if m is None:
            raise SystemExit(f"unparseable UID {uid!r} -- the feed changed shape")
        _, uid_lang, _calendar, mmdd, index = m.groups()
        if uid_lang != lang:
            raise SystemExit(
                f"UID {uid!r} says language {uid_lang!r} in the {lang!r} feed"
            )
        key = f"{mmdd}-{index}"

        date = _DTSTART.search(body).group(1).strip()
        summary = unescape(_SUMMARY_LINE.search(body).group(1).strip())
        sm = _SUMMARY.match(summary)
        if sm is None:
            raise SystemExit(f"unparseable SUMMARY {summary!r} on {date}")
        disc, rank_token, name = sm.groups()
        if disc not in COLOURS:
            raise SystemExit(
                f"unknown colour {disc!r} on {date} -- COLOURS needs a row, or "
                "GCatholic has started emitting rose"
            )
        if rank_token is not None and rank_token not in ranks:
            raise SystemExit(
                f"unknown rank token {rank_token!r} on {date} in the {lang!r} "
                f"feed -- RANKS needs a row for this language"
            )

        description = unescape(_DESCRIPTION_LINE.search(body).group(1))
        psalter = _PSALTER.search(description)
        rows[key] = {
            "date": f"{date[:4]}-{date[4:6]}-{date[6:8]}",
            "colour": COLOURS[disc],
            "rank": ranks[rank_token] if rank_token else None,
            # Stated in English on every feed including the Latin one, so it
            # is read wherever it is found rather than once per language.
            "psalter": psalter.group(1) if psalter else None,
            "name": name.strip(),
        }
    return rows


def fetch_calendar(fetcher: Fetcher, year: int, calendar: str) -> dict:
    """Every language of one year and calendar, per day and per language.

    THE LANGUAGES ARE NOT JOINED, and the reason is a fact about the source
    rather than caution. 22 June 2026 carries two optional memorials --
    Paulinus of Nola in white and John Fisher with Thomas More in red -- and
    the Latin feed emits them in the opposite order to the English and the
    Portuguese. So the index inside a UID is that language's POSITION, not
    the celebration's identity, and joining on it silently gives Paulinus the
    martyrs' name from that day onward. There is no key that fixes this: the
    feeds carry nothing else identifying a celebration, and two optional
    memorials of the same rank and colour on one day would be indistinguish-
    able even by rank and colour.

    So each language keeps its own list in its own order, and what is
    asserted across them is the only thing that IS language-independent: a
    day holds the same multiset of (rank, colour), and the same psalter week.
    That is the claim the oracle can actually support, and it is enough --
    the site's test compares a computed day against a set of celebrations,
    never against a position in one."""
    langs = CALENDARS[calendar]
    per_lang: dict[str, dict[str, dict]] = {}
    for lang in langs:
        url = f"{BASE}/{year}-{lang}-{calendar}.ics?v=3"
        text = unfold(fetcher.fetch_str(url, f"{year}-{lang}-{calendar}.ics"))
        per_lang[lang] = parse_feed(text, lang=lang)

    spine_lang = langs[0]
    spine = per_lang[spine_lang]
    for lang, rows in per_lang.items():
        if rows.keys() != spine.keys():
            missing = sorted(spine.keys() - rows.keys())[:5]
            extra = sorted(rows.keys() - spine.keys())[:5]
            raise SystemExit(
                f"{year} {calendar}: {lang} and {spine_lang} are not the same "
                f"calendar (missing {missing}, extra {extra})"
            )

    by_date: dict[str, dict[str, list[dict]]] = {}
    psalter_of: dict[str, str | None] = {}
    for row in spine.values():
        by_date.setdefault(row["date"], {})
        psalter_of[row["date"]] = row["psalter"]
    for lang in langs:
        for row in per_lang[lang].values():
            by_date[row["date"]].setdefault(lang, []).append(
                {"rank": row["rank"], "colour": row["colour"], "name": row["name"]}
            )

    days: list[dict] = []
    for date in sorted(by_date):
        by_lang = by_date[date]
        shapes = {
            lang: sorted((c["rank"] or "", c["colour"]) for c in cels)
            for lang, cels in by_lang.items()
        }
        if len(set(map(str, shapes.values()))) > 1:
            raise SystemExit(
                f"{year} {calendar} {date}: the language editions hold "
                f"different celebrations -- {shapes}"
            )
        days.append(
            {
                "date": date,
                "psalter": psalter_of[date],
                "celebrations": by_lang[spine_lang],
            }
        )

    oracle: dict = {
        "year": year,
        "calendar": calendar,
        "anchorLang": langs[0],
        "langsChecked": list(langs),
        "source": f"{BASE}/{year}-{{lang}}-{calendar}.ics",
        "days": days,
    }
    # A trailing `-A`..`-H` names the transfer variant wherever it appears:
    # `General-D` and `US-D` mean the same three booleans by it. A national
    # calendar with no such suffix makes its own transfers, and the site's
    # layer for it declares them -- the oracle is then what proves the
    # declaration rather than what supplies it.
    variant = calendar.rpartition("-")[2]
    if variant in VARIANT_TRANSFERS:
        oracle["transfers"] = dict(
            zip(TRANSFER_KEYS, VARIANT_TRANSFERS[variant], strict=True)
        )
    return oracle


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument(
        "--years",
        default=f"{YEARS[0]}-{YEARS[-1]}",
        help=f"inclusive civil-year range; GCatholic publishes {YEARS[0]}-{YEARS[-1]}",
    )
    ap.add_argument(
        "--calendars",
        default=",".join(CALENDARS),
        help="comma-separated calendar keys (default: all)",
    )
    ap.add_argument("--offline", action="store_true", help="cache only; never fetch")
    ap.add_argument("--refresh", action="store_true", help="ignore the cache")
    args = ap.parse_args()

    require_corpus()

    lo, _, hi = args.years.partition("-")
    years = range(int(lo), int(hi or lo) + 1)
    calendars = [c.strip() for c in args.calendars.split(",") if c.strip()]
    for c in calendars:
        if c not in CALENDARS:
            raise SystemExit(f"unknown calendar {c!r}; known: {', '.join(CALENDARS)}")

    fetcher = Fetcher(
        cache_dir=raw_root() / SOURCE_DIR_NAME,
        policy=POLICY,
        decode=decode,
        offline=args.offline,
        refresh=args.refresh,
    )

    stamp = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    payloads: dict[str, object] = {}
    for year in years:
        for calendar in calendars:
            oracle = fetch_calendar(fetcher, year, calendar)
            payloads[f"{year}-{calendar}.json"] = {"generated_at": stamp, **oracle}
            print(f"  {year} {calendar}: {len(oracle['days'])} rows", file=sys.stderr)

    # One call for the whole run, not one per file: `write_stamped_json` judges
    # its payloads as a unit, and this oracle IS one -- a re-parse that moves
    # any year has moved the reading of the source, and a diff in which only
    # some files carry the new stamp would hide which. It is tracked here (the
    # corpus is not on the machine that runs the site's tests), so the churn
    # guard is what keeps `git diff` able to answer "what did this change".
    wrote = write_stamped_json(ORACLE_DIR, payloads, stamp)

    print(
        f"\n{len(payloads)} oracle file(s) "
        f"{'written to' if wrote else 'unchanged in'} {ORACLE_DIR}\n"
        f"{fetcher.network_fetches} fetched, {fetcher.cache_hits} cached",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
