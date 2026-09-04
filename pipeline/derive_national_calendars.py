#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Propose a national calendar's layer by reading what its feed does differently.

WHAT THIS IS, AND WHAT IT IS NOT. It is `site/scripts/book-forms-oracle.mjs`'s
`--derive` mode for a different table: a tool that PROPOSES, from the source, a
table a person then reads and commits. It is not a build step, nothing runs it
at deploy, and its output is checked in as ordinary source. The reason is the
one that governs every oracle here (root CLAUDE.md, `feedback-compute-with-
oracle`): the site computes the calendar and GCatholic's feeds only judge the
result, so a layer generated from a feed and then checked against the same feed
proves the transcription and nothing else. What the check is still worth is
stated at the bottom of this docstring, and it is not nothing.

WHY IT IS PYTHON AND WRITES TYPESCRIPT, which is the wrong way round for this
repository. Because the alternative is a second iCalendar parser. `parse_feed`
in `scrapers/liturgical_calendar.py` already reads these feeds -- the folding,
the escaping, the coloured disc, the per-language rank tokens, the UID grammar
-- and every one of those is a place two implementations would drift silently.
Writing a `.ts` file from here costs a `render` function that nothing else
depends on; writing a parser costs a defect nobody would find.

## The method

A national calendar is not a calendar (Universal Norms nn. 48-55): it is the
General Roman Calendar with a conference's own celebrations inserted, kept at
another rank, or kept on another day. So the layer is a DIFFERENCE, and the
honest way to derive it is to take the difference:

1. **Find the country's transfer variant by measuring, not by reading.** The
   eight `General-{A..H}` feeds are the universal calendar under the eight
   combinations of Epiphany, Ascension and Corpus Christi kept on a Sunday.
   Whichever of the eight disagrees with the country on the fewest days is the
   one its conference keeps -- a stronger test than looking up Epiphany's date,
   because it is decided by the whole year rather than by three days.
2. **Diff in ENGLISH, on both sides.** GCatholic publishes almost every
   national calendar in English as well as the country's own language, and the
   general calendar too, so the two sides are comparable name for name. The
   country's own language is read in the same pass and supplies the propers'
   names -- those were approved in that language and have no Latin original.
3. **Classify each difference by what it does to the day**, which is what
   `NationalCalendar`'s fields are: a name the general calendar does not have
   is a PROPER; a general name kept at another rank or colour is an OVERRIDE;
   a general name on another date is a MOVE; a general name gone from the whole
   year is a SUPPRESSION; an unranked row beside the ferial one is an
   OBSERVANCE.
4. **Aggregate over the three years the oracle covers.** A proper on the same
   `MM-DD` all three years is fixed. One at a fixed offset from Easter is
   `movable`. One that is neither is a table of years, because the evidence
   rules the rules out -- `movedInYear`'s docblock has the argument.

## What it cannot derive, and says so rather than guessing

- **Holy days of obligation.** The feeds do not mark them, so `notObligatory`
  is never proposed. A conference that has transferred one to a Sunday shows
  that in the calendar and the obligation itself is invisible here.
- **`marian`**, which suppresses Our Lady's Saturday memorial. It is visible
  only on a Saturday inside the three years, so it is proposed only where a
  day actually showed it and otherwise left for a reader.
- **`displacedBy` on a move.** Whether a move is conditional on a proper being
  kept shows up only in a year where that proper falls on a Sunday, which most
  of these do not have inside three years.
- **An English rendering of a proper's name** where GCatholic publishes the
  calendar in one language only. The field is emitted with the anchor language
  alone, which is what `celebrationName` falls back to.

Each of those is a place the generated file carries a `TODO` comment rather
than a value, so what was derived and what was left is legible in the file.

## What the oracle is still worth over a derived layer

The layer states the data; `year.ts` computes with it. Every precedence
decision, every transfer of an impeded solemnity, every memorial suppressed by
Lent, every Sunday that wins or loses -- all of that is the engine's, and none
of it is in the feed. So `oracle.test.ts` over a derived layer still checks the
half that can be wrong invisibly, and that is the half seven engine extensions
came out of. What it no longer independently checks for these countries is the
transcription of the propers' names, and that limit is stated in the header of
every file this writes.

    uv run pipeline/derive_national_calendars.py --calendars AT,BE,CZ
    uv run pipeline/derive_national_calendars.py --all --write
"""

from __future__ import annotations

import argparse
import re
import sys
import unicodedata
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "scrapers"))

from common import raw_root, require_corpus
from liturgical_calendar import (
    CALENDARS,
    SOURCE_DIR_NAME,
    TRANSFER_KEYS,
    VARIANT_TRANSFERS,
    YEARS,
    parse_feed,
    unfold,
)

SITE_CALENDAR = (
    Path(__file__).resolve().parents[1] / "site" / "src" / "lib" / "calendar"
)
NATIONAL_DIR = SITE_CALENDAR / "national"

#: The general variants, in the order the fewest-differences test tries them.
VARIANTS = tuple(f"General-{letter}" for letter in "ABCDEFGH")


# --------------------------------------------------------------------------
# Reading the feeds back out of `raw/`
# --------------------------------------------------------------------------


def feed(year: int, lang: str, calendar: str) -> dict[str, list[dict]]:
    """One cached feed as `{ISO date: [celebration, ...]}`.

    Read from `raw/` and never fetched: the crawl is the scraper's job and a
    derivation that could reach the network would make re-deriving cost
    requests. A missing file is fatal here for the same reason.
    """
    path = raw_root() / SOURCE_DIR_NAME / f"{year}-{lang}-{calendar}.ics"
    if not path.exists():
        raise SystemExit(f"not in raw/: {path.name} -- run the scraper first")
    rows = parse_feed(unfold(path.read_text(encoding="utf-8")), lang=lang)
    by_date: dict[str, list[dict]] = defaultdict(list)
    for row in rows.values():
        by_date[row["date"]].append(row)
    return dict(by_date)


def fold(name: str) -> str:
    """What two editions of one name cannot disagree about -- `oracle.test.ts`
    folds the same way and for the same reason.

    THE ACCENTS COME OFF FIRST. Without that, `André` folds to `andr` and its
    slug to `andr-bessette`: a name with a letter deleted rather than
    transliterated, which is worse than either. `NFKD` separates the mark from
    the letter it sits on and the class then keeps the letter."""
    stripped = "".join(
        c for c in unicodedata.normalize("NFKD", name) if not unicodedata.combining(c)
    )
    return re.sub(r"[^a-z0-9]+", " ", stripped.lower()).strip()


# --------------------------------------------------------------------------
# The general calendar's own ids, read off the tables that define them
# --------------------------------------------------------------------------

_GRC_ROW = re.compile(
    r"^\t\['(\d\d-\d\d)', '([a-z0-9-]+)', '((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)',",
    re.MULTILINE,
)
_TEMPORAL_DAY = re.compile(
    r"day\(\s*'([a-z0-9-]+)',\s*\{[^}]*?en: '((?:[^'\\]|\\.)*)'", re.DOTALL
)


def general_by_date() -> dict[str, list[tuple[str, str]]]:
    """`{MM-DD: [(id, folded English name), ...]}` from `grc.ts`'s own rows.

    THE SECOND JOIN, AND THE ONE THAT ACTUALLY RESOLVES. Matching a general
    celebration by its English name fails wherever this project and GCatholic
    word it differently, and they differ often -- "Saint Francis of Assisi"
    against "Saint Francis of Assisi, religious", "Saints Cyril, Monk, and
    Methodius, Bishop" against "Saint Cyril, monk, and Saint Methodius,
    bishop". Neither is wrong and neither can be normalised into the other.
    What both agree about is the DATE, and the general calendar has one
    celebration on most of them; where it has several, the folded names still
    separate them by how many words they share.
    """
    out: dict[str, list[tuple[str, str]]] = defaultdict(list)
    grc = (SITE_CALENDAR / "grc.ts").read_text(encoding="utf-8")
    for mmdd, cid, _la, en in _GRC_ROW.findall(grc):
        out[mmdd].append((cid, fold(en.replace("\\'", "'"))))
    return dict(out)


def resolve(
    name: str, date: str, ids: dict[str, str], by_date: dict[str, list[tuple[str, str]]]
) -> str | None:
    """The general celebration's id, by name and then by date."""
    key = fold(name)
    if key in ids:
        return ids[key]
    rows = by_date.get(date[5:], [])
    if len(rows) == 1:
        return rows[0][0]
    if not rows:
        return None
    words = set(key.split())
    scored = sorted(
        ((len(words & set(other.split())), cid) for cid, other in rows), reverse=True
    )
    # A single shared word is a coincidence ("saint"); two is a name.
    return scored[0][1] if scored[0][0] >= 2 else None


_VARIANT_PAIR = re.compile(
    r"\[\s*'((?:[^'\\]|\\.)*)',\s*'((?:[^'\\]|\\.)*)'\s*\]", re.DOTALL
)


def corrections() -> dict[str, str]:
    """`{the form GCatholic prints: the form this project reads}`.

    READ OFF `oracle.test.ts`'s `ACCEPTED_VARIANTS`, which is where this
    project already keeps every name it and GCatholic spell differently, with
    the reasoning beside it. Most of those rows are alternative Latin forms
    and house style; a few are the source misprinting a name -- `Xeelos` for
    Blessed Francis Xavier Seelos, `Augustín` for Blessed Miguel Agustín Pro
    -- and hand transcription silently corrected them while a derivation would
    reproduce them.

    CORRECTING THE SOURCE WHERE CONFIDENCE IS HIGH IS THE RIGHT ACT, and this
    repository already has the shape for it: a correction carries a locator,
    the exact before and after, and a witness (root CLAUDE.md on
    `pipeline/corrections/`). What it must not become is a fuzzy tolerance, so
    this reads one table rather than guessing: a form not in it is written as
    printed, and a new correction is one row where the twenty-odd already are.

    A scan for further misprints -- every proper name across all eighty-six
    calendars, grouped by the words that identify a saint, reporting groups
    whose spellings differ -- returned nothing beyond that table (2026-09-04).
    GCatholic is internally consistent; `Xeelos` was a singleton.
    """
    text = (SITE_CALENDAR / "oracle.test.ts").read_text(encoding="utf-8")
    block = text[text.index("ACCEPTED_VARIANTS") : text.index("const VARIANT_OF")]
    return {
        theirs.replace("\\'", "'"): mine.replace("\\'", "'")
        for mine, theirs in _VARIANT_PAIR.findall(block)
    }


def general_ids() -> dict[str, str]:
    """`{folded English name: celebration id}` for the whole general calendar.

    READ OFF `grc.ts` AND `temporal.ts` RATHER THAN RESTATED. `overrides`,
    `moves` and a suppression are all keyed by a general celebration's own id,
    and a table of ids written here would be a third copy of a list that
    already exists twice. The English name is the join because it is what the
    feeds are diffed on; where the site and GCatholic word a name differently
    the row simply does not resolve, and the country's proposal says so
    instead of inventing an id.
    """
    out: dict[str, str] = {}
    grc = (SITE_CALENDAR / "grc.ts").read_text(encoding="utf-8")
    for _mmdd, cid, _la, en in _GRC_ROW.findall(grc):
        out.setdefault(fold(en.replace("\\'", "'")), cid)
    temporal = (SITE_CALENDAR / "temporal.ts").read_text(encoding="utf-8")
    for cid, en in _TEMPORAL_DAY.findall(temporal):
        out.setdefault(fold(en.replace("\\'", "'")), cid)
    return out


# --------------------------------------------------------------------------
# Which of the eight variants a country keeps
# --------------------------------------------------------------------------


def difference_count(a: dict[str, list[dict]], b: dict[str, list[dict]]) -> int:
    """How many celebration-rows the two calendars do not share, over a year."""
    total = 0
    for date in set(a) | set(b):
        left = sorted(fold(c["name"]) for c in a.get(date, []))
        right = sorted(fold(c["name"]) for c in b.get(date, []))
        remaining = list(right)
        for name in left:
            if name in remaining:
                remaining.remove(name)
            else:
                total += 1
        total += len(remaining)
    return total


#: The shapes GCatholic's English temporal formula produces, as a pattern.
#:
#: THE MEASURED SET BELOW IS NOT ENOUGH ON ITS OWN, and the reason is the one
#: it was written against turned inside out: a name is missing from the
#: general calendar exactly where a celebration covers it, and a ferial the
#: general calendar never prints in any of three years is precisely the one a
#: country reaches by keeping that celebration elsewhere. Monday of the 9th
#: Week in Ordinary Time is the case -- 2027's falls on 31 May, which the
#: general calendar keeps as the Visitation, so Austria's ferial there matched
#: nothing and entered its layer as a civil observance.
#:
#: So the set says what was seen and the pattern says what the formula CAN
#: say, and a row has to fail both to be an observance. The pattern is over
#: English because that is the language both sides are diffed in.
_TEMPORAL_SHAPE = re.compile(
    r"^(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day\b"
    r"|\bWeek (?:in Ordinary Time|of (?:Advent|Lent|Easter))\b"
    r"|\bOctave of (?:Christmas|Easter)\b"
    r"|\b(?:Advent|Christmas|Lenten) Weekday\b"
    r"|\bChristmas Time\b"
    r"|\bHoly Week\b"
    r"|^(?:Ash Wednesday|Holy Saturday)$",
    re.IGNORECASE,
)

_TEMPORAL_CACHE: dict[tuple[int, ...], set[str]] = {}


def temporal_names(years: tuple[int, ...]) -> set[str]:
    """Every name the temporal cycle's own formula produces, measured.

    A DAY OF THE WEEK IS NOT AN OBSERVANCE, and telling the two apart is the
    one thing the unranked rows need. GCatholic leaves a ferial day unranked
    and it leaves Thanksgiving unranked, so "no rank" alone puts "Friday in
    the 5th Week in Ordinary Time" in a country's layer as a civil observance
    — which is what Croatia's file said for one iteration, because the general
    variant it layers over keeps Cyril and Methodius as a feast on that day
    and so prints no ferial row there to match against.

    What separates them is that a temporal name is GENERATED. Every one the
    formula can produce appears somewhere across the eight variants and three
    years — the variants move Epiphany and Ascension, which slides the whole
    numbering of Ordinary Time, so a name a feast covers in one variant is
    printed in another. Measuring the set beats writing a regular expression
    for it: the shapes are eight or nine and would be a table to keep in step
    with someone else's generator.
    """
    if years not in _TEMPORAL_CACHE:
        names: set[str] = set()
        for variant in VARIANTS:
            for year in years:
                for rows in feed(year, "en", variant).values():
                    names.update(fold(r["name"]) for r in rows if r["rank"] is None)
        _TEMPORAL_CACHE[years] = names
    return _TEMPORAL_CACHE[years]


#: The three transferable celebrations, by the English name GCatholic prints,
#: and what a Sunday means for each. A conference may move any of them to a
#: Sunday under c. 1246 §2, and `General-{A..H}` are the eight combinations.
#: MATCHED AS A SUFFIX, because the two sides word the article differently:
#: the general feeds print "The Ascension of the Lord" and the national ones
#: "Ascension of the Lord". An exact match found nothing in a national feed,
#: and finding nothing was read as "not transferred" -- so Poland and the
#: United States came out with no Ascension transfer at all, which is a
#: quieter way to be wrong than raising. A miss is fatal now.
TRANSFERABLE = (
    ("epiphanyOnSunday", "epiphany of the lord"),
    ("ascensionOnSunday", "ascension of the lord"),
    ("corpusChristiOnSunday", "most holy body and blood of christ"),
)


def measured_transfers(
    calendar: str, years: tuple[int, ...]
) -> tuple[dict[str, bool], list[str]]:
    """Which of the three transfers this conference makes, read off its feed.

    ASKED OF THE THREE DAYS, NOT SCORED OVER THE YEAR. The first version of
    this compared the country against all eight `General-*` feeds and took the
    variant that disagreed on the fewest days, on the reasoning that a whole
    year is more evidence than three dates. It is more evidence about the
    wrong question: the variants differ from each other on two or three days,
    and a country with sixty propers differs from every one of them on sixty,
    so the winning margin is noise beside the signal. England came out
    `General-C` on that test and keeps Epiphany on the Sunday — which put
    Epiphany on 6 January, the Second Sunday after the Nativity on the 5th,
    and every comparison after it out by a day.

    The three dates answer exactly. Epiphany is transferred when it is not on
    6 January; the Ascension and Corpus Christi when they fall on a Sunday
    rather than on their Thursday. Each is checked in every year and a
    disagreement between years is fatal rather than resolved -- a conference
    does not transfer a solemnity in one year and not the next, so a feed that
    says it did is a feed this tool has misread.
    """
    from datetime import date as _date

    answer: dict[str, bool] = {}
    notes: list[str] = []
    for key, name in TRANSFERABLE:
        seen: set[bool] = set()
        changes: dict[int, bool] = {}
        for year in years:
            found = [
                date
                for date, rows in feed(year, "en", calendar).items()
                if any(fold(r["name"]).endswith(name) for r in rows)
            ]
            if not found:
                raise SystemExit(f"{calendar} {year}: no row named {name!r}")
            day = _date.fromisoformat(min(found))
            if key != "epiphanyOnSunday":
                changes[year] = day.weekday() == 6
            elif (day.month, day.day) != (1, 6):
                changes[year] = True
            elif _date(year, 1, 6).weekday() != 6:
                changes[year] = False
            if year in changes:
                seen.add(changes[year])
            # A YEAR WHOSE 6 JANUARY IS A SUNDAY SAYS NOTHING, and reading it
            # as evidence is what made England contradict itself. Both
            # conventions put Epiphany on the same day that year -- on the
            # Sunday, which is also the 6th -- so a test asking "is it on the
            # 6th" answers "not transferred" for a country that transfers it,
            # and the next year answers the other way. Skipping the year
            # leaves the other two to decide, and a country with no
            # informative year in three keeps the general calendar's answer.
        if len(seen) > 1:
            # A CONFERENCE CAN CHANGE ITS MIND, AND ENGLAND DID. Its feeds
            # keep Epiphany on the Sunday in 2025 and on 6 January in 2026 and
            # 2027 — the bishops of England and Wales restored the holy days
            # of obligation from Advent 2025 — so this is the source being
            # right rather than misread. `CalendarOptions` carries a boolean
            # per country and not a table of years, so the layer can hold one
            # answer: the LATEST, which is the one a reader asking about today
            # or about next year needs. The year that disagrees is recorded in
            # the file's own `NOT DERIVED` block and shows up as an oracle
            # divergence for that year, which is the honest outcome.
            latest = max(changes)
            answer[key] = changes[latest]
            notes.append(
                f"{key}: {', '.join(f'{y} {v}' for y, v in sorted(changes.items()))}"
                " -- the conference changed it; the latest is kept"
            )
            continue
        answer[key] = bool(seen and seen.pop())
    return answer, notes


def variant_for(transfers: dict[str, bool]) -> str:
    """The `General-*` feed a country's own transfers make it comparable to."""
    wanted = tuple(transfers[key] for key in TRANSFER_KEYS)
    for letter, combination in VARIANT_TRANSFERS.items():
        if combination == wanted:
            return f"General-{letter}"
    raise SystemExit(f"no general variant for {wanted}")


# --------------------------------------------------------------------------
# The difference, classified
# --------------------------------------------------------------------------

#: Ranks in the order the Table of Liturgical Days ranks them, so "does
#: something on this day outrank a memorial" is a comparison.
RANK_ORDER = {
    None: 0,
    "commemoration": 1,
    "optional-memorial": 2,
    "memorial": 3,
    "feast": 4,
    "solemnity": 5,
}

#: `grc.ts` exports this one outside the table, so `general_by_date` cannot
#: see it and it needs naming here. It is also the one absence that is never a
#: suppression and the one arrival that is never a proper -- see `build_layer`.
SATURDAY_MEMORIAL = "the blessed virgin mary on saturday"

#: Words that appear in hundreds of these names and identify none of them, so
#: two names sharing only these share nothing. The list is what a celebration's
#: title is MADE of -- the honorific and the state of life -- with the saint's
#: own name left over, which is the part a match has to be about.
_GENERIC = {
    "saint",
    "saints",
    "blessed",
    "the",
    "of",
    "and",
    "our",
    "lady",
    "priest",
    "priests",
    "bishop",
    "bishops",
    "martyr",
    "martyrs",
    "virgin",
    "virgins",
    "religious",
    "abbot",
    "pope",
    "deacon",
    "doctor",
    "church",
    "companions",
    "apostle",
    "apostles",
    "evangelist",
    "monk",
    "widow",
    "king",
    "queen",
    "mother",
    "st",
    "ss",
    "b",
    "v",
    "m",
}


def identifying(name: str) -> set[str]:
    """The words in a name that are about WHO it names."""
    return {w for w in fold(name).split() if w not in _GENERIC and len(w) > 2}


def same_person(left: set[str], right: set[str], *, same_day: bool = False) -> bool:
    """Do two names name the same saint?

    Two identifying words in common settles it. One is not enough on its own
    -- half the calendar shares a forename -- but a country that spells a name
    its own way often shares only one: the United States prints Raymond of
    *Peñafort* where this table prints *Penyafort*, so `raymond` is the whole
    of the overlap and the surnames are one letter apart in the middle. So a
    near-match on the whole identifying phrase counts as a second word, which
    is the case `SequenceMatcher` is for and a word-set cannot see.

    ONE WORD IS ENOUGH WHEN THE TWO ROWS ARE ON THE SAME DAY, because what
    they are being told apart from is the general calendar keeping a DIFFERENT
    celebration there, and it keeps one thing per day per line. Ireland's
    Saint Patrick is the case: its feed adds "principal patron of Ireland" to
    the name, so `patrick` is the whole overlap, and read as a proper beside a
    suppressed memorial it lost the solemnity Ireland keeps.
    """
    if len(left & right) >= 2:
        return True
    if not left or not right:
        return False
    if same_day and left & right:
        return True
    ratio = SequenceMatcher(None, " ".join(sorted(left)), " ".join(sorted(right)))
    return ratio.ratio() >= 0.7


def pair_names(english: list[dict], local: list[dict]) -> dict[int, str]:
    """`{index into `english`: the same celebration's name in the local feed}`.

    THE TWO EDITIONS OF A DAY ARE THE SAME CELEBRATIONS IN A DIFFERENT ORDER,
    which the scraper's own docblock records: 22 June 2026 emits its two
    optional memorials one way round in Latin and the other in English. So
    they are paired on `(rank, colour)`, which is language-independent. Where a
    day holds two rows of one rank and colour the pairing falls back to their
    ORDER inside that bucket, which the scraper's docblock says is not
    guaranteed -- and taking the risk is right here because it is CHECKED:
    `oracle.test.ts` compares every proper's name against the anchor
    language's own row, so a mispairing fails a test rather than shipping.
    Refusing to pair was the alternative and it is worse: the English name
    then stands in the country's own slot, which asserts that the conference
    approved an English wording, and thirteen calendars failed the name check
    for exactly that.
    """
    out: dict[int, str] = {}
    buckets: dict[tuple, list[str]] = defaultdict(list)
    for row in local:
        buckets[(row["rank"], row["colour"])].append(row["name"])
    seen: dict[tuple, int] = defaultdict(int)
    for i, row in enumerate(english):
        key = (row["rank"], row["colour"])
        names = buckets.get(key, ())
        index = seen[key]
        if index < len(names):
            out[i] = names[index]
        seen[key] = index + 1
    return out


def diff_year(
    country: dict[str, list[dict]],
    baseline: dict[str, list[dict]],
    local: dict[str, list[dict]],
) -> dict:
    """One year of one country against its general variant.

    Returns `extra` (rows the country has and the general calendar does not),
    `missing` (the other way round) and `changed` (one name, two ranks or two
    colours), each keyed by ISO date.
    """
    extra: dict[str, list[dict]] = {}
    missing: dict[str, list[dict]] = {}
    changed: dict[str, list[tuple[dict, dict]]] = {}
    for date in sorted(set(country) | set(baseline)):
        mine = country.get(date, [])
        theirs = baseline.get(date, [])
        by_name = {fold(r["name"]): r for r in theirs}
        names = {fold(r["name"]) for r in mine}
        local_names = pair_names(mine, local.get(date, []))

        for i, row in enumerate(mine):
            key = fold(row["name"])
            if key not in by_name:
                extra.setdefault(date, []).append(
                    {**row, "local": local_names.get(i, row["name"])}
                )
            else:
                other = by_name[key]
                if (row["rank"], row["colour"]) != (other["rank"], other["colour"]):
                    changed.setdefault(date, []).append((other, row))
        for row in theirs:
            if fold(row["name"]) not in names:
                missing.setdefault(date, []).append(row)
    return {"extra": extra, "missing": missing, "changed": changed}


def easter_day(year: int) -> str:
    """Gregorian Easter, so a proper's offset from it can be recognised."""
    a, b, c = year % 19, year // 100, year % 100
    d, e = b // 4, b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = c // 4, c % 4
    ll = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * ll) // 451
    month = (h + ll - 7 * m + 114) // 31
    day = ((h + ll - 7 * m + 114) % 31) + 1
    return f"{year:04d}-{month:02d}-{day:02d}"


def nth_weekday(dates: list[str]) -> dict | None:
    """`{month, weekday, nth}` where every date is the same one, else None.

    The second of `MovableRule`'s two forms. Labor Day and Thanksgiving are
    the first Monday of September and the fourth Thursday of November, and a
    table of three years would say that in three rows while saying nothing
    about a fourth.
    """
    from datetime import date as _date

    seen = set()
    for iso in dates:
        d = _date.fromisoformat(iso)
        seen.add((d.month, (d.weekday() + 1) % 7, (d.day - 1) // 7 + 1))
    if len(seen) != 1:
        return None
    month, weekday, nth = next(iter(seen))
    return {"month": month, "weekday": weekday, "nth": nth}


def day_number(iso: str) -> int:
    """Days since an arbitrary epoch, for an offset between two dates."""
    y, m, d = (int(p) for p in iso.split("-"))
    if m <= 2:
        y, m = y - 1, m + 12
    return 365 * y + y // 4 - y // 100 + y // 400 + (153 * (m - 3) + 2) // 5 + d


#: `NationalCalendar`'s own one-letter shorthand (`national/common.ts`).
PROPER_LETTER = {
    "solemnity": "s",
    "feast": "f",
    "memorial": "m",
    "optional-memorial": "o",
    "commemoration": "o",
}


# --------------------------------------------------------------------------
# From a calendar's URL code to the site's own id for it
# --------------------------------------------------------------------------

#: The site keys a layer by the country, and eight of GCatholic's calendars
#: are a particular church's rather than a country's -- see `CALENDARS` in the
#: scraper. `IT-rome0` is the Diocese of Rome, which is the calendar Vatican
#: City keeps; `ES-urge0` is Urgell, whose bishop is a co-prince of Andorra.
#: The three British codes are GCatholic's own (`Q` for a country with no
#: alpha-2 code of its own) and become ISO 3166-2 subdivision tags here, which
#: is what those three have.
SITE_ID = {
    "US-D": "us",
    "US-H": "us",
    "VN-H": "vn",
    "QE": "gb-eng",
    "QS": "gb-sct",
    "QW": "gb-wls",
    "IT-rome0": "va",
    "IT-zmar5": "sm",
    "ES-urge0": "ad",
    "DK-kobe0": "dk",
    "FI-hels0": "fi",
    "KW-arab1": "kw",
    "AE-arab0": "ae",
    "PS-jeru0": "ps",
}

_ARTICLE = re.compile(
    r"^(?:saints?|blessed|the|our lady of|our lady|st)\s+", re.IGNORECASE
)


def slug(name: str) -> str:
    """A stable id for a proper, from its English name.

    The role after the comma goes ("Saint Florian, Martyr" -> `florian`),
    because it is a description of the saint and not part of who they are, and
    two celebrations of one saint at different ranks are the same id. A
    collision inside one country is resolved by keeping the words the first
    one dropped rather than by numbering, which would make the id depend on
    the order the file was written in.
    """
    head = _ARTICLE.sub("", name.split(",")[0].strip())
    return fold(head).replace(" ", "-") or fold(name).replace(" ", "-")


def analyse(calendar: str, langs: tuple[str, ...], years: tuple[int, ...]) -> dict:
    """One country's whole difference from the general calendar it layers over."""
    transfers, transfer_notes = measured_transfers(calendar, years)
    variant = variant_for(transfers)
    score = sum(
        difference_count(feed(y, "en", calendar), feed(y, "en", variant)) for y in years
    )
    anchor = langs[0]
    ids = general_ids()
    by_date = general_by_date()

    extras: dict[str, list[tuple[int, str, dict]]] = defaultdict(list)
    missing: dict[str, list[tuple[int, str, dict]]] = defaultdict(list)
    changed: dict[str, list[tuple[int, str, dict, dict]]] = defaultdict(list)
    country_by_year: dict[int, dict[str, list[dict]]] = {}

    for year in years:
        country = feed(year, "en", calendar)
        country_by_year[year] = country
        d = diff_year(country, feed(year, "en", variant), feed(year, anchor, calendar))
        for date, rows in d["extra"].items():
            for row in rows:
                extras[fold(row["name"])].append((year, date, row))
        for date, rows in d["missing"].items():
            for row in rows:
                missing[fold(row["name"])].append((year, date, row))
        for date, pairs in d["changed"].items():
            for base, mine in pairs:
                changed[fold(base["name"])].append((year, date, base, mine))

    return {
        "calendar": calendar,
        "id": SITE_ID.get(calendar, calendar.split("-")[0].lower()),
        "variant": variant,
        "transfers": transfers,
        "transfer_notes": transfer_notes,
        "variant_score": score,
        "anchor": anchor,
        "langs": langs,
        "years": years,
        "ids": ids,
        "by_date": by_date,
        "corrections": corrections(),
        "extras": dict(extras),
        "missing": dict(missing),
        "changed": dict(changed),
        "country": country_by_year,
    }


# --------------------------------------------------------------------------
# The country's name, for the file it writes
# --------------------------------------------------------------------------

#: GCatholic's own English name for each calendar, and the constant the file
#: exports. Taken from its index page rather than from `Intl`, because a
#: calendar keyed `IT-rome0` is Vatican City's and no code table would say so.
NAMES: dict[str, tuple[str, str]] = {
    # The sixteen hand-written layers, so the tool can be run against one and
    # its proposal read beside the file a person wrote -- which is the only
    # check there is on the derivation itself.
    "AR": ("Argentina", "ARGENTINA"),
    "BR": ("Brazil", "BRAZIL"),
    "CD": ("the Democratic Republic of the Congo", "CONGO"),
    "CO": ("Colombia", "COLOMBIA"),
    "DE": ("Germany", "GERMANY"),
    "ES": ("Spain", "SPAIN"),
    "FR": ("France", "FRANCE"),
    "IN": ("India", "INDIA"),
    "IT": ("Italy", "ITALY"),
    "MX": ("Mexico", "MEXICO"),
    "NG": ("Nigeria", "NIGERIA"),
    "PE": ("Peru", "PERU"),
    "PH": ("the Philippines", "PHILIPPINES"),
    "PL": ("Poland", "POLAND"),
    "US-H": ("the United States", "UNITED_STATES"),
    "VE": ("Venezuela", "VENEZUELA"),
    "AT": ("Austria", "AUSTRIA"),
    "BA": ("Bosnia and Herzegovina", "BOSNIA_HERZEGOVINA"),
    "BE": ("Belgium", "BELGIUM"),
    "CH": ("Switzerland", "SWITZERLAND"),
    "CZ": ("Czechia", "CZECHIA"),
    "DK-kobe0": ("Denmark", "DENMARK"),
    "ES-urge0": ("Andorra", "ANDORRA"),
    "FI-hels0": ("Finland", "FINLAND"),
    "HR": ("Croatia", "CROATIA"),
    "HU": ("Hungary", "HUNGARY"),
    "IE": ("Ireland", "IRELAND"),
    "IT-rome0": ("Vatican City", "VATICAN_CITY"),
    "IT-zmar5": ("San Marino", "SAN_MARINO"),
    "LI": ("Liechtenstein", "LIECHTENSTEIN"),
    "LT": ("Lithuania", "LITHUANIA"),
    "LU": ("Luxembourg", "LUXEMBOURG"),
    "MC": ("Monaco", "MONACO"),
    "MT": ("Malta", "MALTA"),
    "NL": ("the Netherlands", "NETHERLANDS"),
    "NO": ("Norway", "NORWAY"),
    "PT": ("Portugal", "PORTUGAL"),
    "QE": ("England", "ENGLAND"),
    "QS": ("Scotland", "SCOTLAND"),
    "QW": ("Wales", "WALES"),
    "RU": ("Russia", "RUSSIA"),
    "SE": ("Sweden", "SWEDEN"),
    "SI": ("Slovenia", "SLOVENIA"),
    "SK": ("Slovakia", "SLOVAKIA"),
    "UA": ("Ukraine", "UKRAINE"),
    "BO": ("Bolivia", "BOLIVIA"),
    "CA": ("Canada", "CANADA"),
    "CL": ("Chile", "CHILE"),
    "CR": ("Costa Rica", "COSTA_RICA"),
    "EC": ("Ecuador", "ECUADOR"),
    "GT": ("Guatemala", "GUATEMALA"),
    "HT": ("Haiti", "HAITI"),
    "PA": ("Panama", "PANAMA"),
    "PR": ("Puerto Rico", "PUERTO_RICO"),
    "TT": ("Trinidad and Tobago", "TRINIDAD_TOBAGO"),
    "VI": ("the United States Virgin Islands", "VIRGIN_ISLANDS"),
    "AO": ("Angola", "ANGOLA"),
    "CV": ("Cabo Verde", "CABO_VERDE"),
    "DZ": ("Algeria", "ALGERIA"),
    "KE": ("Kenya", "KENYA"),
    "RW": ("Rwanda", "RWANDA"),
    "SD": ("Sudan", "SUDAN"),
    "ST": ("São Tomé and Príncipe", "SAO_TOME_PRINCIPE"),
    "TN": ("Tunisia", "TUNISIA"),
    "UG": ("Uganda", "UGANDA"),
    "ZA": ("South Africa", "SOUTH_AFRICA"),
    "AE-arab0": ("Southern Arabia", "SOUTHERN_ARABIA"),
    "BN": ("Brunei", "BRUNEI"),
    "HK": ("Hong Kong", "HONG_KONG"),
    "ID": ("Indonesia", "INDONESIA"),
    "JP": ("Japan", "JAPAN"),
    "KR": ("South Korea", "SOUTH_KOREA"),
    "KW-arab1": ("Northern Arabia", "NORTHERN_ARABIA"),
    "MO": ("Macau", "MACAU"),
    "MY": ("Malaysia", "MALAYSIA"),
    "PS-jeru0": ("the Latin Patriarchate of Jerusalem", "JERUSALEM"),
    "SG": ("Singapore", "SINGAPORE"),
    "TH": ("Thailand", "THAILAND"),
    "TL": ("Timor-Leste", "TIMOR_LESTE"),
    "TW": ("Taiwan", "TAIWAN"),
    "VN-H": ("Vietnam", "VIETNAM"),
    "AU": ("Australia", "AUSTRALIA"),
    "GU": ("Guam", "GUAM"),
    "MP": ("the Northern Mariana Islands", "NORTHERN_MARIANAS"),
    "NZ": ("New Zealand", "NEW_ZEALAND"),
}


# --------------------------------------------------------------------------
# The difference, as a layer
# --------------------------------------------------------------------------


def slots(
    occ: list[tuple[int, str, dict]], years: tuple[int, ...]
) -> list[dict[int, str]]:
    """One name falling on several days a year, split into one entry per day.

    THE EMBER DAYS ARE WHY. Croatia prints *Kvatreni dan* on twelve days of
    every year -- three days in each of four weeks -- so aggregating by name
    gives one row with twelve dates and no rule, which is neither a date nor a
    rule and was dropped. What the twelve are is twelve separate observances
    that happen to share a name, and the years line up: sort each year's dates
    and the *n*th of one year is the *n*th of the next.

    Where the years do not agree on how many there are, the whole run is kept
    as one slot, so it comes out as a table of years rather than as a silently
    mismatched pairing.
    """
    by_year: dict[int, list[str]] = defaultdict(list)
    for year, date, _row in occ:
        by_year[year].append(date)
    for dates in by_year.values():
        dates.sort()
    # PAIRED BY INDEX, AND A YEAR MAY BE SHORT. Where every year prints the
    # same number the *n*th of one is the *n*th of the next; where one prints
    # fewer -- a day the year's own calendar covered -- the slot simply has no
    # entry for that year, which is what a table of years is for. Collapsing
    # the whole run to one slot on a count mismatch is what lost eleven of
    # Bosnia's twelve Ember Days.
    width = max(len(dates) for dates in by_year.values())
    return [
        {year: dates[i] for year, dates in by_year.items() if i < len(dates)}
        for i in range(width)
    ]


def explained_absence(a: dict, occurrences: list[tuple[int, str, dict]]) -> bool:
    """Is a general celebration missing because the engine would suppress it?

    A country that keeps its own feast on 15 May does not need a rule saying
    the general optional memorial that day is not printed -- `year.ts` works
    that out from the Table of Liturgical Days, and writing it into the layer
    as a suppression would state twice what the engine already decides once.
    So an absence counts as explained where the day carries something the
    country added that outranks what went missing.
    """
    for year, date, row in occurrences:
        rank = RANK_ORDER[row["rank"]]
        here = a["country"][year].get(date, [])
        added = [r for r in here if fold(r["name"]) in a["extras"]]
        if not any(RANK_ORDER[r["rank"]] > rank for r in added):
            return False
    return True


def unique(candidate: str, taken: set[str]) -> str:
    """An id no other row in this layer has.

    A file is one object literal, so two propers with one id is not a
    collision that shows up as a wrong answer -- it is a duplicate key, and
    the second silently wins. The Latin Patriarchate has two: its calendar
    keeps two distinct celebrations whose names reduce to the same words. The
    suffix is a letter rather than a number because a numbered id reads as an
    ordering, and there is none.
    """
    if candidate not in taken:
        taken.add(candidate)
        return candidate
    for letter in "bcdefghijk":
        alt = f"{candidate}-{letter}"
        if alt not in taken:
            taken.add(alt)
            return alt
    raise SystemExit(f"too many celebrations named {candidate!r}")


def build_layer(a: dict) -> dict:
    """One country's `NationalCalendar`, as plain data plus what was refused."""
    years, ids, by_date = a["years"], a["ids"], a["by_date"]
    options = {key: True for key, value in a["transfers"].items() if value}

    used_ids: set[str] = set()
    propers: dict[str, list[dict]] = {}
    movable: list[dict] = []
    moves: dict[str, str] = {}
    moved_in_year: dict[str, dict[int, str]] = {}
    overrides: dict[str, dict | None] = {}
    observances: list[dict] = []
    todo: list[str] = list(a["transfer_notes"])

    # A COUNTRY MAY WORD A GENERAL CELEBRATION ITS OWN WAY, and then the same
    # day reads as one row gone and one row arrived. The United States prints
    # the North American martyrs with Isaac Jogues first, so its obligatory
    # memorial looked like a proper and the general memorial looked suppressed
    # -- two rows in the layer for one line of the calendar. What separates
    # that from a proper that genuinely displaces a memorial is whether the
    # two names are about the same saint, which is what `identifying` asks.
    renamed: dict[str, str] = {}
    for key, occ in a["extras"].items():
        if key in ids or key in a["missing"]:
            continue
        mine = identifying(occ[0][2]["name"])
        for other, gone in a["missing"].items():
            if other in a["extras"] or gone[0][1] != occ[0][1]:
                continue
            theirs = identifying(gone[0][2]["name"])
            if same_person(mine, theirs, same_day=True):
                cid = resolve(gone[0][2]["name"], gone[0][1], ids, by_date)
                if cid:
                    renamed[key] = cid
                break

    for _key, occ in a["extras"].items():
        row = occ[0][2]
        if _key == SATURDAY_MEMORIAL:
            # OUR LADY ON SATURDAY IS THE ENGINE'S, NEVER A LAYER'S. She is
            # offered on any Saturday carrying no obligatory celebration, so
            # she is "extra" on every Saturday where the general calendar has
            # a memorial and the country does not -- and a layer that added
            # her would then offer her twice, in the country's own language
            # beside the Latin. `grc.ts` exports her; `year.ts` places her.
            continue
        if _key in renamed:
            base = a["missing"][
                next(
                    k
                    for k, v in a["missing"].items()
                    if resolve(v[0][2]["name"], v[0][1], ids, by_date) == renamed[_key]
                )
            ][0][2]
            # A COUNTRY THAT ONLY SPELLS IT DIFFERENTLY CHANGES NOTHING.
            # The name is not in the layer at all -- `grc.ts` holds it -- so
            # where the rank and the colour agree there is no row to write,
            # and one saying `keptAs` at the rank it already has would be a
            # line asserting the general calendar.
            if row["rank"] != base["rank"] or row["colour"] != base["colour"]:
                overrides[renamed[_key]] = {
                    "rank": row["rank"],
                    "base_rank": base["rank"],
                    "colour": row["colour"]
                    if row["colour"] != base["colour"]
                    else None,
                }
            continue
        mmdds = {date[5:] for _y, date, _r in occ}
        offsets = {
            day_number(date) - day_number(easter_day(year)) for year, date, _r in occ
        }
        # AN EXTRA RESOLVES BY NAME AND NEVER BY DATE, which the two sides
        # below do the opposite of. A row the general calendar does not have
        # on this date is either a proper or a general celebration kept
        # elsewhere, and the date it is kept on says nothing about which --
        # falling back to "the general celebration on this date" turned every
        # proper into a move of whatever the general calendar keeps that day
        # (Blessed Marie-Rose Durocher on 6 October became a move of Saint
        # Bruno, who had not gone anywhere). What identifies a move instead is
        # that the SAME name is missing from its own date in the same year.
        cid = ids.get(_key)
        if cid is None and _key in a["missing"]:
            gone = a["missing"][_key][0]
            cid = resolve(gone[2]["name"], gone[1], ids, by_date)
        if row["rank"] is None:
            if _key in temporal_names(a["years"]) or _TEMPORAL_SHAPE.search(
                row["name"]
            ):
                continue  # a ferial day, named by the formula and not by a country
            if _key == SATURDAY_MEMORIAL:
                continue  # `year.ts` offers her; a layer never adds her

            # An unranked row beside the ferial one: a civil observance the
            # calendar prints, which is not a line of n. 59 at all.
            # `replacesDay` (see `Observance`): the feeds emit Spain's and
            # Croatia's Ember Days INSTEAD of the ferial row rather than
            # beside it, in their own colour, and the optional memorial the
            # day would otherwise offer is not offered. What says which this
            # is, is whether the country still prints a ferial that day.
            def replaces_day(slot: dict[int, str]) -> bool:
                return all(
                    not any(
                        r["rank"] is None and _TEMPORAL_SHAPE.search(r["name"])
                        for r in a["country"][year].get(date, [])
                    )
                    for year, date in slot.items()
                )

            placed: set[str] = set()
            for slot in slots(occ, years):
                fixed = {d[5:] for d in slot.values()}
                if len(fixed) == 1:
                    # Two slots can land on one date where a year prints the
                    # observance twice, and two identical entries put it on
                    # the day twice. Slovakia's Ember Friday in Advent is the
                    # case.
                    only = next(iter(fixed))
                    if only in placed:
                        continue
                    placed.add(only)
                observances.append(
                    {
                        "row": row,
                        "mmdds": sorted({d[5:] for d in slot.values()}),
                        "offsets": {
                            day_number(d) - day_number(easter_day(y))
                            for y, d in slot.items()
                        },
                        "nth": nth_weekday(list(slot.values())),
                        "years": {y: d[5:] for y, d in slot.items()},
                        "replacesDay": replaces_day(slot),
                    }
                )
            continue
        if cid is not None:
            # A general celebration, on a date the general calendar does not
            # keep it: a move, or a year table where the dates do not agree.
            if len(mmdds) == 1:
                moves[cid] = next(iter(mmdds))
            else:
                moved_in_year[cid] = {year: date[5:] for year, date, _r in occ}
            # A MOVE AND AN OVERRIDE ARE TWO DIFFERENT ACTS AND A COUNTRY MAY
            # DO BOTH. Canada keeps the North American martyrs on 26 September
            # AND as an obligatory memorial; Croatia keeps Cyril and Methodius
            # on 5 July AND as a feast. `moves` carries only the date, so a
            # layer recording the move alone put the celebration on the right
            # day at the general calendar's rank -- right about the half that
            # is visible in a date and wrong about the day itself.
            gone = a["missing"].get(_key)
            if gone and (
                row["rank"] != gone[0][2]["rank"]
                or row["colour"] != gone[0][2]["colour"]
            ):
                overrides[cid] = {
                    "rank": row["rank"],
                    "base_rank": gone[0][2]["rank"],
                    "colour": row["colour"]
                    if row["colour"] != gone[0][2]["colour"]
                    else None,
                }
            continue
        # RANK AND COLOUR COME FROM THE OCCURRENCE THAT SHOWS THEM, which is
        # the highest-ranked of the three years and not the first. A memorial
        # whose day fell in Lent in 2025 is printed there as a commemoration
        # in violet -- the season's answer for that year, not the
        # celebration's own -- and reading the first occurrence gave Saint
        # Zeno of Verona a violet optional memorial in every year.
        best = max(occ, key=lambda o: RANK_ORDER[o[2]["rank"]])[2]
        corrected = a["corrections"].get(row["name"], row["name"])
        entry = {
            "id": unique(slug(corrected), used_ids),
            "en": corrected,
            "local": best.get("local", row["local"]),
            "rank": best["rank"],
            "colour": best["colour"],
            "years": sorted({y for y, _d, _r in occ}),
        }
        nth = nth_weekday([date for _y, date, _r in occ])
        if len(mmdds) == 1:
            propers.setdefault(next(iter(mmdds)), []).append(entry)
        elif len(offsets) == 1:
            movable.append({**entry, "fromEaster": next(iter(offsets))})
        elif nth:
            movable.append({**entry, "nth": nth})
        else:
            todo.append(
                f"{entry['en']}: kept on "
                + ", ".join(f"{y} {d}" for y, d, _r in sorted(occ))
                + " -- no fixed date and no fixed offset from Easter"
            )

    for key, occ in a["missing"].items():
        if key == SATURDAY_MEMORIAL:
            # READ BEFORE THE "IT MOVED" SHORTCUT BELOW, and that ordering is
            # the whole of the fix. She is offered on most Saturdays, so for
            # nearly every country she is BOTH missing somewhere (a Saturday
            # the country fills) and extra somewhere (a Saturday the general
            # calendar fills), which sent her down the moved-elsewhere branch
            # and never reached this. The Czech Our Lady of the Angels lost
            # its `marian` that way, and the day then carried Our Lady twice.
            #
            # ONLY AN OPTIONAL MEMORIAL PROVES IT. Her memorial is not offered
            # on a Saturday carrying any OBLIGATORY celebration, so a
            # country's obligatory memorial displaces her by rank and says
            # nothing about what it is of -- Saint Frances Xavier Cabrini was
            # marked `marian` for one iteration on that reasoning. An optional
            # memorial leaves her offered beside it, so her absence beside one
            # is a fact about the celebration itself.
            for _y, date, _r in occ:
                for entry in propers.get(date[5:], []):
                    if entry["rank"] == "optional-memorial":
                        entry["marian"] = True
            continue
        if key in a["extras"]:
            continue  # it did not go; it moved, and the extra above recorded it
        if occ[0][2]["rank"] is None:
            # A FERIAL DAY IS NOT SUPPRESSED BY A LAYER. Where a country keeps
            # its own feast on a Tuesday the feed prints the feast instead of
            # "Tuesday in the 16th Week in Ordinary Time", and that is the
            # engine's arithmetic rather than anything this file can state.
            continue
        cid = resolve(occ[0][2]["name"], occ[0][1], ids, by_date)
        if cid is None:
            todo.append(f"absent and unresolved: {occ[0][2]['name']}")
            continue
        if cid in renamed.values():
            continue  # the country's own wording of it arrived above
        if explained_absence(a, occ):
            continue
        if len({y for y, _d, _r in occ}) < len(years):
            # ABSENT IN ONE YEAR IS NOT SUPPRESSED, and writing it as one is
            # wrong in the other two. Bosnia's feed omits Saint Rita in 2027
            # and prints her in 2025 and 2026; a `null` override took her out
            # of all three. What a one-year absence actually is cannot be read
            # off three years -- a conference that began or stopped keeping
            # her, a year where something else took the day, or a gap in the
            # source -- so it is reported and nothing is written.
            todo.append(
                f"{occ[0][2]['name']}: absent in "
                + ", ".join(str(y) for y in sorted({y for y, _d, _r in occ}))
                + " only -- not written; three years cannot say which it is"
            )
            continue
        overrides[cid] = None

    for _key, occ in a["changed"].items():
        cid = resolve(occ[0][2]["name"], occ[0][1], ids, by_date)
        if cid is None:
            todo.append(f"kept differently and unresolved: {occ[0][2]['name']}")
            continue
        kept = {(mine["rank"], mine["colour"]) for _y, _d, _b, mine in occ}
        base_colour = occ[0][2]["colour"]
        if len(kept) > 1:
            todo.append(
                f"{occ[0][2]['name']}: kept at {sorted(kept)} in different years"
                " -- `since` on the override"
            )
        rank, colour = max(kept)
        overrides[cid] = {
            "rank": rank,
            "base_rank": occ[0][2]["rank"],
            "colour": colour if colour != base_colour else None,
        }

    return {
        **a,
        "options": options,
        "propers": propers,
        "movable": movable,
        "moves": moves,
        "movedInYear": moved_in_year,
        "overrides": overrides,
        "observances": observances,
        "todo": todo,
    }


# --------------------------------------------------------------------------
# Writing it out
# --------------------------------------------------------------------------


def rule_literal(entry: dict) -> str:
    """A `MovableRule`, in whichever of its two forms the dates showed."""
    if "fromEaster" in entry:
        return f"{{ fromEaster: {entry['fromEaster']} }}"
    if len(entry.get("offsets", ())) == 1:
        return f"{{ fromEaster: {next(iter(entry['offsets']))} }}"
    nth = entry.get("nth")
    if nth:
        return (
            f"{{ month: {nth['month']}, weekday: {nth['weekday']}, nth: {nth['nth']} }}"
        )
    table = entry.get("years")
    if table:
        rows = ", ".join(f"{y}: '{table[y]}'" for y in sorted(table))
        return "{ years: { " + rows + " } }"
    return "{ years: {} } /* TODO: no rule fits */"


#: GCatholic's language slug against the site's content-language tag. Only
#: one differs: it spells Traditional Chinese `zt` and this site spells it
#: `zht`, which is Vatican News's slug and the one the corpus is keyed on
#: (`site/CLAUDE.md` §Languages -- a tag here is an identity, not a variant).
LANG_TAG = {"zt": "zht"}

RANK_LETTER = {
    "solemnity": "s",
    "feast": "f",
    "memorial": "m",
    "optional-memorial": "o",
    "commemoration": "o",
}

HEADER = """/**
 * {article} — the General Roman Calendar as {possessive} bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what {name} actually does
 * differently, and no code at all.
 *
 * ## Derived, and what that costs
 *
 * DERIVED BY `pipeline/derive_national_calendars.py`, not written by hand —
 * unlike the sixteen layers that came before it, whose propers were read one
 * at a time. That tool takes the difference between this calendar's feed and
 * the general variant it layers over, both in English, and classifies each
 * difference by what it does to the day. The honest consequence is stated
 * rather than left to be discovered: `oracle.test.ts` compares this country
 * against the same feed the layer came from, so for THIS file the name check
 * is a transcription check and not an independent one.
 *
 * What the oracle still checks independently is everything the ENGINE does
 * with these rows — precedence, an impeded solemnity transferred, a memorial
 * reduced by Lent, a Sunday that wins or loses. None of that is in the feed,
 * and it is the half that can be wrong invisibly.
 *
 * ## The names
 *
 * {names_note}
 */

"""


def names_literal(entry: dict, anchor: str) -> str:
    """A celebration's `names` object, in the anchor language and English.

    THE ANCHOR IS OMITTED WHERE IT WOULD REPEAT THE ENGLISH. `pair_names`
    leaves a celebration unpaired where a day holds two of the same rank and
    colour, and the English name stands in -- writing that under the country's
    own tag would assert that the conference approved an English wording,
    which is the one thing these names are here to say it did not.

    Module level rather than a closure in `render` because `groups.ts` renders
    propers too, and a second copy of this rule is a second place for the
    anchor tag to be got wrong.
    """
    local = entry.get("local", entry["en"])
    if anchor == "en" or local == entry["en"]:
        return "{ en: " + ts(entry["en"]) + " }"
    tag = LANG_TAG.get(anchor, anchor)
    return "{ " + tag + ": " + ts(local) + ", en: " + ts(entry["en"]) + " }"


def proper_call(entry: dict, indent: str, anchor: str) -> str:
    """One `proper(...)` call, indented."""
    opts = []
    if entry["colour"] != "white":
        opts.append(f"colour: '{entry['colour']}'")
    if entry.get("marian"):
        opts.append("marian: true")
    since = entry.get("since")
    if since:
        opts.append(f"since: {since}")
    tail = f", {{ {', '.join(opts)} }}" if opts else ""
    return (
        f"{indent}proper('{entry['id']}', {names_literal(entry, anchor)}, "
        f"'{RANK_LETTER[entry['rank']]}'{tail})"
    )


def render(layer: dict, group: str | None = None) -> str:
    """The layer as the TypeScript file that states it.

    `group` names a constant in `./groups.ts` holding propers this layer
    shares, to the letter, with every other member of that group -- see
    `SHARED_PROPERS` below and `withGroup` in `national/common.ts`.
    """
    calendar = layer["calendar"]
    name, const = NAMES[calendar]
    anchor = layer["anchor"]
    article = name[0].upper() + name[1:]
    possessive = "its" if name.startswith("the ") else f"{name}’s"

    if anchor == "en":
        names_note = (
            "GCatholic publishes this calendar in English only, so a proper "
            "carries its English name and nothing else. `celebrationName` "
            "falls back to it for a reader of any other language, which is the "
            "name the celebration actually has."
        )
    else:
        names_note = (
            f"A proper carries the name its conference approved, in {anchor}, "
            "and the English rendering GCatholic prints beside it. There is no "
            "Latin original — the celebration was approved in the vernacular — "
            "and composing one would be exactly the invented text this project "
            "refuses (`docs/decisions.md` §Scope)."
        )

    used_helpers = set()
    body: list[str] = [f"export const {const}: NationalCalendar = {{"]
    body.append(f"\tid: '{layer['id']}',")
    covers = ALSO_COVERS.get(calendar)
    if covers:
        body.append("\talsoCovers: [" + ", ".join(f"'{t}'" for t in covers) + "],")
    if layer["options"]:
        opts = ", ".join(f"{k}: true" for k in layer["options"])
        body.append(f"\toptions: {{ {opts} }},")
    else:
        body.append("\toptions: {},")

    if group:
        used_helpers.add("withGroup")
        if not layer["propers"]:
            body.append(f"\tpropers: withGroup({group}),")
        else:
            body.append(f"\tpropers: withGroup({group}, {{")
    elif not layer["propers"]:
        body.append("\tpropers: {},")
    else:
        body.append("\tpropers: {")
    for mmdd in sorted(layer["propers"]):
        entries = layer["propers"][mmdd]
        used_helpers.add("proper")
        rows = ",\n".join(proper_call(e, "\t\t\t", anchor) for e in entries)
        body.append(f"\t\t'{mmdd}': [\n{rows}\n\t\t],")
    if layer["propers"]:
        body.append("\t}),") if group else body.append("\t},")

    if layer["movable"]:
        used_helpers.add("proper")
        body.append("\tmovable: [")
        for entry in sorted(layer["movable"], key=lambda e: e["id"]):
            call = proper_call(entry, "\t\t\t", anchor)
            body.append(
                f"\t\t{{\n\t\t\tat: {rule_literal(entry)},"
                f"\n\t\t\tcelebration:\n{call}\n\t\t}},"
            )
        body.append("\t],")

    if layer["observances"]:
        body.append("\tobservances: [")
        for obs in layer["observances"]:
            row = obs["row"]
            at = f"'{obs['mmdds'][0]}'" if len(obs["mmdds"]) == 1 else rule_literal(obs)
            colour = f", colour: '{row['colour']}'" if row["colour"] != "white" else ""
            body.append(
                f"\t\t{{\n\t\t\tat: {at},"
                f"\n\t\t\tobservance: {{ id: '{slug(row['name'])}', "
                f"names: {names_literal({'en': row['name'], 'local': row['local']}, anchor)}"
                f"{colour} }}\n\t\t}},"
            )
        body.append("\t],")

    if layer["overrides"]:
        body.append("\toverrides: {")
        for cid in sorted(layer["overrides"]):
            value = layer["overrides"][cid]
            if value is None:
                body.append(f"\t\t'{cid}': null,")
            elif value["rank"] == value["base_rank"]:
                body.append(f"\t\t'{cid}': {{ colour: '{value['colour']}' }},")
            else:
                used_helpers.add("keptAs")
                colour = f", '{value['colour']}'" if value["colour"] else ""
                body.append(
                    f"\t\t'{cid}': keptAs('{RANK_LETTER[value['rank']]}'{colour}),"
                )
        body.append("\t},")

    if layer["moves"]:
        body.append("\tmoves: {")
        for cid in sorted(layer["moves"]):
            body.append(f"\t\t'{cid}': {{ to: '{layer['moves'][cid]}' }},")
        body.append("\t},")

    if layer["movedInYear"]:
        body.append("\tmovedInYear: {")
        for cid in sorted(layer["movedInYear"]):
            table = layer["movedInYear"][cid]
            rows = ", ".join(f"{y}: '{table[y]}'" for y in sorted(table))
            body.append(f"\t\t'{cid}': {{ {rows} }},")
        body.append("\t},")

    body.append("};")

    imports = ["import type { NationalCalendar } from '../types';"]
    if group:
        imports.insert(0, f"import {{ {group} }} from './groups';")
    if used_helpers:
        imports.insert(
            0, f"import {{ {', '.join(sorted(used_helpers))} }} from './common';"
        )

    head = HEADER.format(
        article=article,
        possessive=possessive,
        name=name,
        names_note=names_note,
    )
    todo = ""
    if layer["todo"]:
        todo = (
            "/*\n * NOT DERIVED, and left here rather than guessed:\n *\n"
            + "".join(f" *   - {line}\n" for line in layer["todo"])
            + " */\n\n"
        )
    return head + "\n".join(imports) + "\n\n" + todo + "\n".join(body) + "\n"


def ts(value: str) -> str:
    """A TypeScript single-quoted string literal."""
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


# --------------------------------------------------------------------------
# The fourth transfer, which the variant letters do not carry
# --------------------------------------------------------------------------


def lift_sacred_heart(layer: dict) -> dict:
    """Turn a Sacred Heart kept on a Sunday into the OPTION for it.

    `General-{A..H}` are the eight combinations of three transfers, which
    reads as a statement that there are three; `CalendarOptions` records that
    there are four. A country that keeps the Sacred Heart on the Sunday
    therefore shows up here as the solemnity moving to a different date every
    year -- a `movedInYear` table saying in three rows what one boolean says
    once, and saying nothing at all about a fourth year.
    """
    from datetime import date as _date

    table = layer["movedInYear"].get("sacred-heart") or (
        {layer["years"][0]: layer["moves"]["sacred-heart"]}
        if "sacred-heart" in layer["moves"]
        else None
    )
    if not table:
        return layer
    if not all(
        _date.fromisoformat(f"{year}-{mmdd}").weekday() == 6
        for year, mmdd in table.items()
    ):
        return layer
    layer["options"]["sacredHeartOnSunday"] = True
    layer["movedInYear"].pop("sacred-heart", None)
    layer["moves"].pop("sacred-heart", None)
    return layer


#: The layers written by hand before this tool existed, whose propers were
#: read one at a time and whose comments record why each row is there. `--all`
#: leaves them alone: a derivation would overwrite a better file with a worse
#: one, and it has already corrected two of GCatholic's own misprints (Francis
#: Xavier Seelos, Miguel Agustín Pro) that a re-derivation would reintroduce.
#: Naming one on `--calendars` still derives it, which is the only check there
#: is on this tool -- run it against Italy or the United States and read the
#: proposal beside the file.
HAND_WRITTEN = {
    "AR",
    "BR",
    "CD",
    "CO",
    "DE",
    "ES",
    "FR",
    "IN",
    "IT",
    "MX",
    "NG",
    "PE",
    "PH",
    "PL",
    "US-D",
    "US-H",
    "VE",
}


#: Layers that carry the same propers, and the constant in
#: `national/groups.ts` each shared set is written to.
#:
#: MEASURED, THEN NAMED -- never the other way round. Comparing all 85 layers
#: on 2026-09-04 found that no two are identical but several carry propers
#: agreeing to the letter, and these are the groups where the shared set is
#: large enough to be worth naming. THE NAMES ARE DESCRIPTIONS OF THE MEMBERS
#: AND NOT CLAIMS ABOUT WHO APPROVED THE ROWS: AMECEA is the plausible
#: explanation of the eastern African set and the *Regionalkalender fur das
#: deutsche Sprachgebiet* of the third, and neither is verified here. What is
#: verified is the identity, on every run.
#:
#: A group is only emitted where every member is being derived in the same
#: run, every member shares the anchor language (a name written under two
#: different tags is not the same row), and the intersection is worth a file.
#: A DATE enters the group only where every member holds an identical entry
#: list for it -- whole dates rather than single celebrations, so that a
#: member can never carry its own row on a group's date and `withGroup` can
#: refuse a collision outright.
#: TWO CANDIDATES WERE TRIED AND REFUSED BY THE RULES ABOVE, and they are
#: recorded here rather than deleted, because both look like obvious groups
#: and the next person will propose them again:
#:
#:   - LUXEMBOURG belongs with Austria and Liechtenstein by celebration and
#:     not by ROW: it shares 48 of them, and its anchor language is French
#:     where theirs is German, so every shared celebration carries a different
#:     name. A group is a set of rows, and those are not the same rows.
#:   - HONG KONG AND TAIWAN share 27 celebrations and exactly ONE date. The
#:     Chinese martyrs are in both and are not kept on the same days, which is
#:     the whole reason the intersection is taken over dates: a group built on
#:     celebration ids would have moved a feast in one of them.
#: Territories that keep a calendar which is not their own country's, by the
#: GCatholic code of the calendar they keep.
#:
#: IT LIVES HERE BECAUSE IT USED TO LIVE NOWHERE. `alsoCovers` was added to
#: five layer files by a throwaway script in the session that wrote them, and
#: the script is gone -- so the field was regenerable only from the previous
#: copy of its own output, which is the exact shape the root `CLAUDE.md`
#: records biting this project three times in one day. The first re-derivation
#: after that dropped all eleven territories out of the picker, silently and
#: with every test still passing, because nothing computes them.
#:
#: Eight particular churches stand for more than one place: two vicariates of
#: Arabia and the Latin Patriarchate of Jerusalem carry ten countries between
#: them, Copenhagen carries the Faroes and Greenland, and Helsinki carries
#: Aland. Read off GCatholic's own calendar index, which lists a territory
#: under the calendar it keeps.
ALSO_COVERS: dict[str, tuple[str, ...]] = {
    "AE-arab0": ("om", "ye"),
    "DK-kobe0": ("fo", "gl"),
    "FI-hels0": ("ax",),
    "KW-arab1": ("bh", "qa", "sa"),
    "PS-jeru0": ("cy", "il", "jo"),
}

SHARED_PROPERS: dict[str, tuple[str, ...]] = {
    "EASTERN_AFRICA": ("KE", "SD", "UG", "ZA"),
    "NORTH_AFRICA": ("DZ", "TN"),
    "GERMAN_LANGUAGE_AREA": ("AT", "LI"),
}

#: Below this many shared dates a group costs a reader more than it saves: an
#: import and a second file to look in, for a handful of rows.
MIN_GROUP_DATES = 5

GROUPS_HEADER = """/**
 * Propers that several national calendars carry identically.
 *
 * GENERATED by `pipeline/derive_national_calendars.py` -- do not edit. Each
 * constant below is the intersection of its members' derived propers, at
 * whole-date granularity: a date is here only where EVERY member of the group
 * holds an identical list of celebrations on it, same ids, ranks, colours and
 * names. A member that stops agreeing simply keeps the date in its own file
 * on the next run.
 *
 * ## These are measurements, not claims about authority
 *
 * The names describe who shares the rows, and nothing more. AMECEA is the
 * plausible explanation of the eastern African set and the *Regionalkalender
 * fur das deutsche Sprachgebiet* of the German-language one, and this project
 * has verified neither -- what it has verified, on every run, is that the
 * rows are the same. Do not read a group as saying that some body approved
 * it, and do not add a member by hand on the grounds that it ought to belong.
 *
 * ## What this changes about checking, which is nothing
 *
 * `oracle.test.ts` compares the calendar this project COMPUTES against the
 * calendar GCatholic computes, day by day, per country. It never reads a
 * layer file, so a shared set is invisible to it and every member goes on
 * being checked whole. That is what makes this a deduplication of the data
 * rather than an assertion about it -- and it is why it was safe to do at
 * all. See `withGroup` in `./common.ts`.
 */

"""


def render_groups(shared: dict[str, tuple[str, dict]]) -> str:
    """`national/groups.ts`, from each group's name, anchor and propers."""
    body = [
        GROUPS_HEADER,
        "import { proper } from './common';",
        "import type { Celebration } from '../types';",
        "",
    ]
    for name in sorted(shared):
        anchor, propers = shared[name]
        members = ", ".join(NAMES[c][0] for c in SHARED_PROPERS[name])
        body.append(f"/** Carried identically by {members}. */")
        body.append(f"export const {name}: Record<string, Celebration[]> = {{")
        for mmdd in sorted(propers):
            rows = ",\n".join(proper_call(e, "\t\t", anchor) for e in propers[mmdd])
            body.append(f"\t'{mmdd}': [\n{rows}\n\t],")
        body.append("};")
        body.append("")
    return "\n".join(body)


def shared_propers(layers: dict[str, dict]) -> dict[str, tuple[str, dict]]:
    """Pull each group's identical dates out of its members, in place.

    Returns the group name -> (anchor, propers) for the ones that qualify;
    every date it returns has been REMOVED from each member's own propers, so
    a member's file and its group are disjoint by construction.
    """
    found: dict[str, tuple[str, dict]] = {}
    for name, members in SHARED_PROPERS.items():
        if not all(c in layers for c in members):
            continue
        anchors = {layers[c]["anchor"] for c in members}
        if len(anchors) != 1:
            print(
                f"{name}: members disagree on the anchor language "
                f"({', '.join(sorted(anchors))}) -- not grouped",
                file=sys.stderr,
            )
            continue
        first, *rest = (layers[c]["propers"] for c in members)
        agreed = {
            mmdd: entries
            for mmdd, entries in first.items()
            if all(other.get(mmdd) == entries for other in rest)
        }
        if len(agreed) < MIN_GROUP_DATES:
            print(
                f"{name}: only {len(agreed)} shared date(s) -- not grouped",
                file=sys.stderr,
            )
            continue
        for code in members:
            for mmdd in agreed:
                layers[code]["propers"].pop(mmdd)
        found[name] = (anchors.pop(), agreed)
        print(
            f"{name}: {len(agreed)} shared date(s) across {', '.join(members)}",
            file=sys.stderr,
        )
    return found


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--calendars", help="comma-separated GCatholic calendar codes")
    ap.add_argument("--all", action="store_true", help="every calendar NAMES holds")
    ap.add_argument("--write", action="store_true", help="write the files")
    ap.add_argument(
        "--out",
        type=Path,
        default=NATIONAL_DIR,
        help="where to write (default: the site's national/ directory)",
    )
    args = ap.parse_args()

    require_corpus()

    if args.all:
        codes = [c for c in NAMES if c not in HAND_WRITTEN]
    elif args.calendars:
        codes = [c.strip() for c in args.calendars.split(",") if c.strip()]
    else:
        raise SystemExit("name --calendars or pass --all")

    # EVERY LAYER IS BUILT BEFORE ANY IS WRITTEN, which is what the shared
    # sets need: a group's contents are an intersection across its members, so
    # no member can be rendered until all of them exist.
    layers: dict[str, dict] = {}
    for code in codes:
        if code not in CALENDARS:
            raise SystemExit(f"unknown calendar {code!r}")
        years = tuple(
            y
            for y in YEARS
            if (raw_root() / SOURCE_DIR_NAME / f"{y}-en-{code}.ics").exists()
        )
        if not years:
            print(f"{code}: nothing in raw/ -- skipped", file=sys.stderr)
            continue
        layers[code] = lift_sacred_heart(
            build_layer(analyse(code, CALENDARS[code], years))
        )

    shared = shared_propers(layers)
    group_of = {
        code: name
        for name, members in SHARED_PROPERS.items()
        if name in shared
        for code in members
    }

    for code, layer in layers.items():
        text = render(layer, group_of.get(code))
        summary = (
            f"{code}: {layer['variant']} (+{layer['variant_score']}), "
            f"{sum(len(v) for v in layer['propers'].values())} propers"
            f"{' + ' + group_of[code] if code in group_of else ''}, "
            f"{len(layer['movable'])} movable, {len(layer['overrides'])} overrides, "
            f"{len(layer['moves']) + len(layer['movedInYear'])} moves, "
            f"{len(layer['observances'])} observances, {len(layer['todo'])} todo"
        )
        print(summary, file=sys.stderr)
        if args.write:
            out = (
                args.out
                / f"{layer['id'].split('-')[0] if '-' not in layer['id'] else layer['id']}.ts"
            )
            out.write_text(text, encoding="utf-8")
        else:
            print(text)

    # WRITTEN ONLY WHEN EVERY MEMBER OF EVERY GROUP WAS IN THIS RUN, because a
    # partial rewrite would drop the groups the run did not derive and leave
    # their members importing a constant that no longer exists.
    if (
        shared
        and args.write
        and all(
            all(c in layers for c in members) for members in SHARED_PROPERS.values()
        )
    ):
        (args.out / "groups.ts").write_text(render_groups(shared), encoding="utf-8")
        print(f"groups.ts: {len(shared)} shared set(s)", file=sys.stderr)
    elif shared and args.write:
        print(
            "groups.ts NOT written: not every group's members were derived in "
            "this run. Re-run with --all to rewrite it.",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
