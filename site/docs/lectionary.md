# The lectionary

What the site prints beside a liturgical day, where it comes from, and — at
length, because it is the part that will be wrong first — **what it cannot
say**. The calendar half is `site/docs/calendar.md`; the scrapers are
`pipeline/scrapers/lectionary.py` (the source) and `pipeline/scrapers/olm.py`
(the oracle).

## The source's citations, never the source's text

The site prints WHICH passages are appointed and resolves each through its own
editions. It is not a Missal and not the translation read aloud anywhere. The
rights problem in a lectionary lives entirely in the TEXT of the readings,
which every conference licenses separately; a schedule of citations is a list
of facts, and this site is a citation resolver. The reading text on USCCB's
pages is the New American Bible and stays in `raw/`, which is private, where
nothing downstream of the parse can reach it.

**Which is a rule about whose words, not about how many.**
`/calendarium/liturgia` sets each pericope out in full and does not weaken the
sentence above by one clause: the words it prints are the reader's own Bible
edition, which this site already serves a chapter at a time at `/scriptura`,
reached by resolving a citation exactly as every other citation on the site is
resolved. Nothing of the source's own text is anywhere near it. What changes
with length is only how loudly the qualifier has to be said — see below.

**On the card that sentence is behind the `i` beside the heading.** Set under
the list it was three lines of small print below five lines of citations, on a
card already carrying the day's name, its season, its rank and its colour — the
longest text in the block, and read once. It is `ArtFigure`'s arrangement: the
`info` glyph, a native popover, `role="note"`, which is what the rest of the
site does with a line that qualifies something rather than saying it. **Paper
still gets it unconditionally and still under the list** — a popover never
prints, and the printed copy is the one whose reader cannot press anything.

**On `/calendarium/liturgia` it is on the page.** A reader who has just read a
first reading, a psalm and a gospel under today's date will take them for what
is read at their parish unless something says otherwise, and a mark they have
to press is not something saying otherwise. The bigger the page, the louder the
qualifier: the card's list of five addresses can hold the note behind a glyph;
a page of Scripture cannot.

## The citation is an address, so it is written in the reader's language

Everywhere else on this site a citation is a QUOTATION — the work being read
printed it, in its own language, and reproducing it verbatim is the whole job.
Here it is not: USCCB printed it, in English, about a passage the reader will
open in their own edition. So a Portuguese reader met `Ezekiel 33:7-9` under a
heading, a date and a day's name that were all Portuguese, and nothing on the
page had said anything in English.

`lectionary/cite.ts` rewrites it — `Ez 33,7-9` — and hands the string back to
`RefText` to be parsed IN THAT LANGUAGE, so there is still one renderer and one
parser. Both halves come out of the grammar's own tables rather than being
written here: the book form from `bookAbbrev`, which returns a variant the
parser matches against, and the chapter mark from `grammarSurface`. Where the
chapter mark is a comma the passages are separated by `.`, which those tables
already chain a verse list with — the comma cannot do both jobs.

**The book is abbreviated, and English is not exempt.** The tables hold
abbreviations rather than names, the oracle having derived them from citations
and citations abbreviating, so for eight of the eleven languages with a table
an abbreviation is the only form the parser is certain to read back. It is also
the right form on its own merits: a reading list is where an abbreviation
belongs, and `/schola` already teaches that notation out of these same two
functions — printing a full name here would contradict the page that teaches
the citation form. English took the source's own spelling for a day, on no
better ground than that it was already there, which put two conventions on one
card decided by nothing but the reader's language. The source's language is not
a reason to print differently; the only tag treated specially is one with no
table.

**The round trip is checked at RENDER, not only in a test.** A localized
citation must parse, in its new language, to the same books, chapters and
verses the English one did; where it does not, the English stands. That guard
is not precautionary — it caught three mechanisms on its first run over the
table, each of which produced a citation that still read plausibly:
`2 Timothy 3:14-4:2` keeps its verse in English, where a `:` after a range's
far end marks a chapter crossing, and loses it in Portuguese, where that mark
is unavailable; `Romans 5:12-19 or 5:12, 17-19` GAINED a link to Romans 12,
PT's `:` being a clause separator; `Baruch 3:9-15, 32-4:4` dropped verse 32.

**A citation is rewritten whole or not at all.** The derived book tables are
derived from what the Catechism cites, so a book it never cites is absent from
them; swapping the punctuation and leaving `Ezekiel` standing would produce a
string the target grammar cannot read, turning an English link into no link.
Half the interface languages have no table at all and read the source as it
came. What that costs is measured by `cite.test.ts` — it is a percent or two in
the Romance languages and a fifth in Polish, Russian and Arabic.

## Two sources, and neither is asked for the half it reads badly

**USCCB is the SOURCE.** Its daily pages carry explicit slot markup and print
the OLM's own lectionary numbers. What that costs is the United States'
adaptation: NAB psalm numbering, the US calendar, and a few pericopes that
differ from the typical edition outright.

**The 1981 typical edition is the ORACLE.** `olm.py` reads the archive.org
scan and answers one question — which passages does entry N appoint — so the
two can be diffed. It serves nothing.

The scan's citations survive OCR and its slot labels do not (`LEcrmio I`,
`PsALMUS RESP.`); USCCB's structure is explicit markup and its citations are
an adaptation's. Each covers the other's failure mode.

## The lookup is arithmetic

`rules.ts` computes the number from the `LiturgicalDay` alone, so a reader
asking for 2040 is answered without anyone having crawled it. The temporal
cycle is formulae — Easter's weekdays are `255 + 6·week + (weekday − 1)` with
no exceptions in any crawled year, Ordinary Time's Sundays
`61 + 3·(week − 1) + cycle` — over three small base tables where the book
stops counting weeks and counts days, plus a sanctoral table that cannot be
derived from anything.

`days.oracle.json` is the date index that used to ship. It is built still,
imported by `rules.test.ts` and by nothing else, and the rules must reproduce
every comparable day in it. The crawl stopped being the answer and became the
check — the move `calendar.md` records for the calendar itself.

**The weekday number does not depend on the weekday cycle.** The OLM prints
Year I and Year II under one number in parallel columns; the cycle selects a
column, not a number.

**A day can have several Masses and they are not variants.** Christmas is four
(13–16), the Assumption, John the Baptist and Peter and Paul are a Vigil and a
Day, Holy Thursday is the Chrism Mass and the Evening Mass. `FORMULARIES`
holds them and `readingsFor` returns all of them, labelled.

**The Ascension is NOT one of those.** USCCB prints 58 and 60 on one page
because six United States provinces keep it on the Thursday and the rest
transfer it to the Sunday. That is two CALENDARS, not two Masses; the calendar
has already chosen, and offering both would show every reader a Mass they are
not at.

## `/calendarium/liturgia`: the passages, whole or not at all

The card lists the day's citations; this page sets out the verses under each of
them, and adds the two prayers a rubric appoints to a day — the Regina Caeli
through Easter Time and the Angelus through the rest of the year, and the
Rosary's mysteries for the weekday, which the corpus states in
`PrayerGroupEntry.days` rather than leaving this site to read a rubric written
in the content language.

**Which makes it a reading page, and it takes a reading page's shape.**
`.content-column` and a `ReadingBar`; the passages carry `.reading-text`, so
they are set in the face, at the measure and under the size adjustment every
other text on this site is read in. `layout.css` divides `.landing-column` from
`.content-column` on exactly this question — `--content-width` is a count of
CHARACTERS, wrong for `/calendarium`'s month of dated rows and right for a
gospel — and `/preces/{slug}` is the precedent for a reading page with no aside
being a bare column rather than a one-sided grid.

**A verse number is a `ReferenceNumber` and it points INTO the Bible.** On
`/scriptura` the number is an in-page `#v{n}` because the chapter is on the
screen; here the page holds nine verses of it, so the number is the way in, at
the verse it names, with the same anchor menu (copy, copy link, open, bookmark)
the reading routes give it. Only a run that OPENS a chapter the previous one did
not is headed by its number: `…31 1 So the heavens…` is two chapters and reads
as one, and the citation over the passage has already named the first.

**The bar carries print and the edition picker and nothing else.** Print because
a day's readings are carried to Mass on paper; the picker because on this page
the Bible edition is not a preference sitting behind the text but the text
itself — `EditionMenu`'s route map had to be told the path exists, which is the
failure that file's own docblock warns about (a work missing from it renders no
picker and nothing throws). No bookmark: what this address names is a date, and
the bookmark list is of passages.

**Whole or not at all is the whole design.** `refs.ts`'s `passageSpans` reads a
citation as VERSES where `citationPieces` reads it as a DESTINATION, and the
two under-answer in opposite directions: a piece that cannot be placed is drawn
as text, which costs a link and says nothing false, while a passage that cannot
be given entire is not printed at all. **A reader cannot tell a pericope
printed short from one printed whole** — the condition `cite.ts` refuses one
citation at a time and `national/held.ts` refuses a whole calendar layer for.

**It crosses chapters, and nothing else in the reference system does.** An
`Address` holds one chapter, so `Genesis 1:1-2:2` is one link and one verse to
`RefText`; here it is the two chapters it names, with any chapter the crossing
jumps over given in full and its length read off the edition's own index rather
than a table. It also reads the semicolon that joins two clauses of one
pericope (`Genesis 2:7-9; 3:1-7`) — the grammar already parses the second
clause as a segment carrying the first's book.

**Every span is minted by `refAddress`**, including the synthetic segment
naming the chapter a crossing lands in, so the Hebrew-to-Vulgate mapping, the
late-merge tables and the `vulgateNumbering` opt-out apply here exactly as they
apply to the link — the text under a citation cannot come from a chapter the
link above it does not open.

**A citation naming verses and placing none is not a whole chapter.**
`refAddress` degrades that case to the chapter alone, which is right for an
anchor and would be fifty verses printed where five were cited; the two
verse-less answers are told apart by what was ASKED, not by what came back.
`John 1:60-64` is the shape, and it was printing all of John 1 until the test
for it existed.

## THE GAPS

Everything below is a thing this feature cannot currently say. Figures are
measured as of **2026-09-06** and derived by the throwaway sweeps in
`rules.test.ts`'s neighbourhood — re-measure rather than quoting them.

### 1. Eleven dark days in fifteen years

Four numbers — **80, 83, 85, 88** — leave a day with no readings at all: 11 of
5,481 days over 2026–2040, **0.20%**. They are Sundays of Ordinary Time in
weeks that Lent swallows, and the reason they cannot be fetched is exact: the
combination of week and Sunday cycle that carries them does not occur in ANY
year USCCB publishes. 83 does not occur between 2005 and 2028 at all.

They are not a crawl failure and no amount of crawling fixes them. The OLM
scan holds all four and is refused for it — see §3.

### 2. USCCB's own holes, and its two horizons

- **Five dates 404 permanently**: 2026-05-09, 2026-06-30, 2026-08-01,
  2026-08-12, 2028-01-16. Verified by hand — 2026-05-09 answers 404 while
  2026-05-08 answers 200. They are recorded in `pipeline/absent-sources.json`
  and cost nothing, because the rules compute the number from the day and a
  missing page costs a DATE rather than a reading set.
- **Forward horizon: 2028-03-31.** 2028-04-01 onward answers 404 through the
  browser tier. That is the publisher's edge, not a stopping point chosen
  here.
- **Archive floor: about 2012.** 2013-01-20 and 2014-03-02 serve; 2011-02-27,
  2009-02-22 and 2005-06-28 do not. Worth knowing before concluding a number
  is unreachable: the FIRST date carrying a number is often outside the
  archive while a later one is inside it, and reading only the most recent
  candidate was how four fillable numbers were called permanent.

### 3. The OLM scan is an oracle and must not become a source

Measured over the 439 numbers both sources held: **40% of USCCB's citations
are absent from the scan's entry** (737 of 1,840); the scan has fewer
citations on 165 numbers and more on 125, the latter being a neighbouring
entry bleeding in. Mark's feast comes back without its first reading;
`Act 22, 93-16` is a mangled `22, 3-16`. It carries no slot labels at all.

Filling `masses` from it would give hundreds of numbers reading lists missing
two pericopes in five, and **a reader cannot tell an incomplete reading list
from a complete one** — the condition `national/held.ts` exists to refuse.

Two scan entries are listed in `olm-oracle.test.ts` as truncated (99 kept only
its alleluia; 639 kept the alternative gospel), read against the source by
hand rather than hidden behind a loosened threshold.

### 4. Vatican News cannot fill any of it

Assessed 2026-09-06 and rejected on three independent grounds, in increasing
order of finality:

1. It publishes **no lectionary numbers** — only a date's readings — and the
   missing numbers are missing precisely because no fetchable date carries
   them.
2. **Three slots of five**: a first reading, a second on Sundays, and the
   gospel. No responsorial psalm, no acclamation, ever. So it is blind at the
   psalm, which is the slot most in need of a witness.
3. It begins in **2020** and the missing numbers occur in **2005–2014**. Its
   window is strictly narrower than USCCB's, so it reaches nothing USCCB
   cannot.

Its English edition is additionally not independent: it prints the NAB, the
same translation USCCB serves. The Portuguese edition IS an independent
witness on the three slots it carries, and remains worth having as a
cross-check on the universal calendar against the US adaptation — that is the
one thing it can do that the scan cannot, being free of OCR.

### 5. What the psalms owed, and did not

This section claimed the opposite until it was measured, and the correction is
the useful part. `versification.ts` converts the Hebrew/Vulgate chapter shift
and REFUSES the verse-level one, naming the orphan-psalm table — which psalms
carry a superscription — as the prerequisite. USCCB's psalms were recorded here
as the convention that needs it.

**They are not.** The NAB counts a superscription as a verse exactly as the
Vulgate does, so the chapter shift alone lands every citation on the right text
and the verse number never moves. `Psalm 51:3` is the Miserere, `Psalm 4:2` is
`Cum invocarem`, `Psalm 30:2` is `Exaltabo te` — each a verse the KJV
convention calls 1 — and every psalm in the table whose title is its own verse
agrees. The claim had been reasoned from what the NAB is rather than read off
what it prints.

`psalms-oracle.test.ts` is the standing check: every psalm verse the table
cites must land inside the psalm it maps to. It found one real defect on its
first run, which is the answer to whether it was worth writing — Vulgate Ps 55
joins the two halves of Psalm 56's refrain into one verse, so `Psalm 56:12`
and `56:13` had been resolving to real, existing, WRONG text and only `56:14`
overran loudly. Three `LATE_MERGE` rows fixed it.

What the check cannot see: a merge whose overflow verse no citation happens to
reach leaves the verses before it silently wrong. The corpus holds no
modern-numbered psalter to diff against — every shipped edition is a Vulgate
one — so there is no sweep for this, only the citations actually made.

### 6. Two calendar defects this feature found — fixed, not a gap

Both were `$lib/calendar`'s rather than the lectionary's, and both were found
by diffing the rules against the crawl, which is what a second witness is for:
the calendar's own GCatholic oracle passed on both, because its window is
2025–2027 and neither year is in it. Kept here because the way they were found
is the reusable part.

- **St Joseph, 2028.** 19 March is the Third Sunday of Lent, so he is
  impeded, and USCCB transfers him FORWARD to the Monday. The engine sent him
  backward, because the direction was a flag on the celebration — set from
  the Holy Week case, where anticipating IS right (15 March in 2008). The fix
  was to stop stating a direction: n. 60's "closest day not listed under
  nn. 1–8" is closest in EITHER direction, ties going forward, which gives
  the Monday off a Lenten Sunday and the Saturday out of Holy Week from one
  rule. It also gives the Immaculate Conception her Monday, the commonest
  transfer there is. The Annunciation is the exception and is now stated as
  one: n. 61 NAMES its destination, the Monday after the Second Sunday of
  Easter, which is not the closest free day and cannot be found by looking.
- **There is no First Sunday of Ordinary Time.** The Sunday of that week is
  the Baptism of the Lord and the next is the SECOND; the book numbers from 64
  and prints no 61. `temporal.ts` counted the weeks from the day the season
  starts, so a year where the Baptism is displaced to the Monday left five
  weekdays instead of six and every Sunday came out a week early — 15 January
  2023 was emitted as a First Sunday that does not exist. The count is
  anchored on the Sunday now. `sundayNumber` clamped the week to 2 while this
  stood, and the clamp is gone, because it repaired exactly one day of the
  many that were wrong. The weekdays were right throughout; every SUNDAY of
  such a year's first part was a week early, and clamping only lifts the
  first of them. `days.oracle.json` holds 15 January 2023 — the clamped day,
  number 64 — and not the 22nd, which would still have read as the Second
  Sunday when it is the Third. A workaround that repairs precisely the case
  the oracle can see is the shape to distrust.

### 7. One citation in nine prints no passage, and two grammar shapes are most of it

Measured **2026-09-07** over the 1,782 distinct citations in `table.json`,
each localized as the page localizes it and resolved against the
Douay-Rheims: **1,592 give a passage** (70 of them crossing a chapter) and
**190 do not**. The residue is not scattered. Bucketed by what the grammar
left unconsumed:

| Shape                                  | Count | Example                               |
| -------------------------------------- | ----- | ------------------------------------- |
| verse groups chained with `and` or `&` | ~48   | `Psalm 33:4-5, 6-7, 12-13, 20 and 22` |
| a part letter past the first           | ~44   | `Psalm 25:4-5ab, 6 and 7bc, 8-9`      |
| an alternative left inside `cite`      | 10    | `Mark 10:2-16 or 10:2-12`             |
| verses lost to a Vulgate psalm split   | 8     | `Psalm 116:10, 15, 16-17, 18-19`      |

**Almost all of it is the responsorial psalm**, which is the slot whose
citations are the most finely divided, so the psalm is the pericope most often
left as a bare citation on a page where everything around it prints.

The first two are `refs-grammar.ts`'s and not this feature's: `LEAD_NUM_RE`
takes a single trailing letter and the locus parser chains on commas and dots
and not on a conjunction. **Fixing either would change every citation on the
site**, gaining links in `citationPieces` as well as passages here, so it is a
change with `reference-coverage`'s baseline attached to it and not a patch on
the way past. The fourth is `verseExtent` refusing to express a range that
straddles a Vulgate psalm split as one span, which is correct and stays.

## Running it

    uv run pipeline/scrapers/lectionary.py --years 2026-2028   # the crawl
    uv run pipeline/scrapers/lectionary.py --dates 2025-09-16  # one day
    uv run pipeline/scrapers/olm.py                            # the oracle
    cd site && node scripts/build-lectionary.mjs               # the table
    npm run verify:lectionary                                  # rules + oracle

**`--dates` MERGES into the year file; `--years` REPLACES it.** A dated run
reads one day of a year holding 365, so writing its own days alone throws the
other 364 away — which it did twice, and the committed table fell from 482
numbered Mass sets to 55 before anyone noticed. A year run walks every day in
its span, so a day absent from its output is absent because the source has
nothing there, and replacing is how a day that has STOPPED parsing gets seen
rather than preserved for ever. When the year files look wrong, the command is
`--years <span> --offline`: `raw/` holds every page and the rebuild costs no
request.

**The crawl is slow on purpose and the origin bot-challenges.** `robots.txt`
states no `Crawl-delay`, and an unstated limit is not a licence; the transport
is `vasco`'s browser tier because plain HTTP trips the challenge within about
a dozen requests. Probing the origin with `curl` trips it too — done once here,
by hand, while checking the publishing horizon.
