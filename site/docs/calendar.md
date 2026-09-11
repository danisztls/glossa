# The liturgical calendar

`src/lib/calendar/` derives every day of any year from the date of Easter and a
table of the Church's fixed celebrations, and `/calendarium` renders it. It is
the first thing on this site whose subject is not a text, and the first content
that is **ours** rather than reproduced.

## Why it is computed here

**The Holy See does not publish it.** _Mysterii Paschalis_ promulgated the
Universal Norms and the _Calendarium Romanum Generale_ together, and vatican.va
publishes the motu proprio and neither of the documents it approves — they are
printed in the Roman Missal. (The near misses, so nobody re-runs the search:
`liturgical_year/` is six descriptive pages with no dated list, and the
Congregation's _Notificazione_ gives norms for drawing up a _particular_
calendar.)

So the corpus could not hold this: there is no page to fetch, therefore nothing
for `raw/` to keep write-once, therefore no work. The table lives in this
repository as `grc.ts`, and `pontificates.ts` is the precedent — a fact about
the world that nothing upstream states, kept beside the code that needs it.

## An oracle is not a source, and the difference is the whole design

**A liturgical calendar is the one kind of output where being wrong looks
exactly like being right.** A mis-parsed encyclical is visible in its own text;
an Ordinary Time week numbered one too high is invisible until a reader who
knows the year notices. And the cases that break an implementation are chosen
for their rarity.

GCatholic publishes the calendar as iCal, per year, in the eight variants that
correspond exactly to the three transfers a conference may make.
`pipeline/scrapers/liturgical_calendar.py` fetches those to `raw/` and parses
them to `glossa-corpus/build/gcatholic-calendar/`, where `oracle.test.ts`
compares every day of three years, in every variant and every published
national calendar, against what this project computes.

**Nothing from the oracle is served to a reader.** It decides no day at
runtime; it decides whether the code that decides days is right. That is what
makes it an oracle in the corpus's own sense of the word.

### It lived in this repository until 2026-09-04, and the argument for that expired

The reasoning was that `oracle.test.ts` reads it and the corpus is a separate,
private checkout a test run cannot assume is present — written when the oracle
was 130 files and 7.4 MB. Widening it to every calendar GCatholic publishes
took it to **281 files and 28 MB, about a quarter of this public repository's
whole packed history**, for one third-party dataset that grows with every
language and year added.

Two things settled it, and neither is size on its own.

**It is parsed output regenerable from `raw/` with no network, which is the
definition of `build/`** — and the corpus's own rule, since 2026-08-27, is that
generated output is not tracked. Keeping it here made this repository the one
place in the project where that rule did not hold, for the one artifact that
grows fastest.

**And it is a verbatim reproduction of somebody else's published calendars**,
which is the class of thing the corpus repository is private FOR. Whether a
table of feast names is copyrightable is exactly the judgement the public/private
split exists to avoid having to make in public.

**What it costs is that the check now needs the corpus, and the answer is that
the check was never a build step.** Parsing GCatholic and comparing against it
is a verification you run while working on the calendar — `npm run
verify:calendar`, its own vitest config, excluded from `npm test`, which is
hermetic by design and must stay runnable on any checkout. `held.ts`, the
RESULT of the comparison and the only part the site acts on, stays here.

**It FAILS without a corpus rather than skipping**, naming the path it looked in
and the rebuild command. An empty file list would make every `describe` vanish
and the run report green over nothing — the exact failure this whole apparatus
exists to prevent. The one test that would then give WRONG advice, the held-set
check (with no oracle it reports every held calendar as ready to publish), is
skipped instead of left to fail.

**It is the one directory under `build/` that is not a work**, carrying no
`manifest.json`; `sync-corpus.mjs` names it in `NON_WORK_DIRS` so the
manifestless check does not report it as a scrape that failed, and `rebuild.py`
carries it as a stage so a rebuild into an empty `build/` does not leave the
calendar with nothing to check itself against. The move was verified the way
this project verifies every re-parse: the parse into the corpus reported all 281
files **unchanged**.

**It earned its place before the first test ran**, finding two rules written
from the Norms that were wrong — the Octave of Easter is ranked as
_solemnities_ (n. 24), and reduction to a commemoration is not the Lenten thing
n. 14 describes. Four more came out of running it:

- **An optional memorial never takes the day.** Line 12 sits above line 13, so
  reading the Table as a plain sort makes every ferial Tuesday with a saint on
  it disappear into that saint — 100 days of 2026 alone. The Table ranks what
  happens when two celebrations _must_ be resolved.
- **A commemoration takes the season's colour, not the saint's**, being the
  weekday's own Mass with the saint's collect inside it.
- **The Saturday memorial of Our Lady is not offered on a Saturday that is
  already hers.**
- **The calendar is not a constant.** Newman was inscribed on 9 October between
  2025 and 2026, so a table with no dates in it quietly claims the calendar
  never changed. `SINCE` is the answer; a removal will want an `until`.

(The scraper is `liturgical_calendar.py` and not `calendar.py`, which it was
called for a day: a script's own directory leads `sys.path`, so every scraper
in the directory died on a circular import through `email` — and the shadowing
is silent when it does not crash, which is worse.)

## The engine

**Rank and precedence are separate fields.** The single most load-bearing
decision in the module. A feast of the Lord is line 5 and a feast of a saint is
line 7, with a Sunday in Ordinary Time between them at line 6, so the
Transfiguration displaces a Sunday and Saint Lawrence does not, though both are
`rank: 'feast'`. **Comparing on rank gets these backwards and reads plausibly
doing it.**

**An impeded solemnity does not always move forward.** n. 60 sends it to "the
closest day not listed under nn. 1–8", and _closest_ is not one direction:
Saint Joseph impeded by Holy Week is ANTICIPATED, because forward is past the
whole Octave of Easter, and impeded by a Sunday of Lent he is DEFERRED, because
a free day lies one step each way and a tie breaks forward. The search reads
the distance and gets both, along with the Immaculate Conception's Monday.

**The direction is not a property of the celebration**, which it was until
2026-09-06 — a flag set from Joseph's Holy Week case sent him backward off a
Lenten Sunday too, where the published practice of 2017 and USCCB's own 2028
readings both say Monday. The flag now names a DESTINATION instead of a
direction, and only the Annunciation has one: n. 61 sends it to the Monday
after the Second Sunday of Easter, which is not the closest free day — closest
would put it back in Lent — and so cannot be recovered from any search. 2035
exercises both at once, because Easter falls on 25 March.

**A national calendar is a layer over the general one** — propers, rank
changes, transfers, and the general celebrations it keeps on another day —
because that is what nn. 48–55 describe. A country is a data file with no code,
and the general calendar cannot drift out from under it.

**Brazil's Sunday transfers are a table of years, because the rule turned out
not to exist.** Measured across three oracle years, Peter and Paul moved
_backward_ from a Monday in 2026 and _forward_ from a Tuesday in 2027, and All
Saints moved from a Monday and not from a Saturday: neither "nearest Sunday"
nor "following Sunday" fits all six. Outside the years listed the celebration
keeps its own date — the general calendar's answer, which is at least not a
date nobody chose. (The field is not `sundayTransfers`: only a solemnity is
transferred when impeded, and the Congo's Visitation moves to a Monday.)

**Seven extensions kept "a country is a data file" true**, each found by a
country failing rather than by reasoning:

- **There are four Sunday transfers, not three.** `General-{A..H}` is eight
  combinations of three, which reads as a statement that those are all — the
  Congo also keeps the Sacred Heart on the Sunday, and the Immaculate Heart
  does not follow it.
- **A celebration can fall on no date at all**: the Thursday after Pentecost,
  the third Sunday of January. Two forms cover all of them — an offset from
  Easter and an _n_th weekday of a month — and they are two rather than a
  vocabulary of named anchors because an offset is a fact anyone can check
  against a calendar.
- **A proper can be a feast OF THE LORD.** The module argued for an afternoon
  that a country never needs line 5, since n. 59 gives proper feasts line 8;
  the Santo Niño disproves it, since line 8 loses to a Sunday and the feast
  falls on one.
- **`elevations` had to be renamed `overrides`**, having only ever raised a
  rank while Brazil was the only layer. **A field named for the commonest case
  invites a reader to assume the rank can only go up.**
- **A conference changes its mind**, so `since` gates an override as well as a
  celebration.
- **Blue is a liturgical colour in two of these calendars** (Spain's
  _privilegio de azul_, inherited by the Philippines). **The obvious
  generalisation is false and worth recording as such**: it predicts the
  Spanish-speaking Americas, and five of them print 8 December in white.
- **Some days a calendar names are not celebrations** — Thanksgiving, Republic
  Day, Whit Monday as a Mass of the Holy Spirit. They carry **no rank**, and
  that is not an omission: they are not lines of the Table at all, and an
  invented rank would lose the one true thing about them.

**The rank tokens in these feeds are the language's own initials.** Nine
calendars in Latin and the Romance languages print `S F M m`, which reads as a
machine vocabulary; German prints `H F G g` and Polish `U Ś W w`. A table read
as language-independent was a coincidence of six feeds.

## Every calendar the source publishes

The list was the sixteen largest Catholic populations, on the reasoning that a
list has to stop somewhere. **What retired that is that the boundary was never
a limit**: a country costs one row in the scraper and one data file. The set is
now the one the source publishes — 86 calendars over 96 territories.

**Fifteen languages arrived at once and their rank tokens were READ rather than
written.** An unknown token is fatal in `parse_feed` precisely so a table of
guesses cannot pass, so they were derived by alignment: one calendar and year
in two languages is the same set of days, a day whose two editions each hold
exactly one unresolved token forces that pair, and iterating to a fixpoint
reaches all five ranks in all fifteen, unanimously. Two refute the rule the
first three suggested, spelling the optional memorial as a different word
rather than as a lowercase.

**Is this still computing or now copying?** Two parts. The temporal cycle, the
Table, transferred solemnities and `grc.ts` are computed here and judged by a
calendar someone else computed; that half is unchanged and is the half that can
be wrong invisibly. A conference's propers are not derivable from anything —
they are a positive act — and even the hand-written layers took their content
from the oracle. **So the kind of knowledge did not change when the
transcription went from hand to machine.** What changed is that the name check
for a derived country is now circular, and that hand transcription had been
silently correcting the source; the second is fixed by deriving from
`ACCEPTED_VARIANTS`, where this project already keeps every name it and
GCatholic spell differently. **Correcting the source where confidence is high
is the right act.**

**Only what the oracle agrees with is published.** `national/held.ts` names the
layers that still differ, with the measured count of diverging days out of
1,095 per calendar, and they are excluded from the picker — `unpublished.json`'s
argument for a different kind of output. The last test asserts the held list is
EXACTLY the diverging set, in both directions; without it a regressed layer
would be silently absorbed and a fixed one would sit unpublished for ever.

**What is left is what no layer file can spell**, which is a different kind of
thing from what was left before: two calendars keep a celebration on the LUNAR
new year, and a lunisolar date is not a function of the Gregorian one. Read
`held.ts` rather than this paragraph — it is beside the rows it describes, and
it argues there why a table of years would be worse than holding.

### The derivation's defects read as the engine's, four times over

Measured twice by dumping every divergent day rather than reading a list of
causes, because the list was inferred both times and wrong both times about the
largest group. **`derive_national_calendars.py` wrote all four and `year.ts`
had none of them:**

- **A standing `moves` row from a SINGLE year's sighting.** England kept Saint
  George on 28 April for ever because 23 April 2025 fell inside the Octave of
  Easter. The mechanism for a one-year fact already existed (`movedInYear`).
- **`replacesDay` computed and then dropped on the way to the file**, which is
  worse than never computing it: every derived layer's Ember Days doubled the
  ferial day, and Spain looked like the only country that does it, Spain being
  hand-written.
- **A fixed date read as no date at all.** Ten propers were left out with the
  note "no fixed date and no fixed offset from Easter" — and nine of them are a
  fixed date the ENGINE moved in one of the three years, because the day it
  falls on outranked it. The derivation compared the dates it observed without
  asking what would have happened to a celebration on that date.
- **A celebration named by its date.** 28 June is Irenaeus in the General
  Calendar and, in all three oracle years, the Saturday the Immaculate Heart
  falls on — so two conferences raising the Immaculate Heart were recorded as
  raising Irenaeus, and San Marino's two propers on 8 November were crossed.

**A generator that turns one observation into a standing rule, computes an
answer it does not print, or identifies a celebration by the day it landed on
writes data that reads as an engine defect — and the engine is where everybody
then looks.** The last two are the same mistake the scraper's own docblock
warns about for feeds: never join on POSITION, join on the thing itself.

**And a wrong saint at the right rank is invisible to a rank-and-colour
check.** Ukraine's layer raised Ephrem where the conference raises Mary Mother
of the Church; in 2025 the two fell on one day, the raised feast took the
other's name, and the shape matched exactly. It surfaced only in the years they
did not coincide. A comparison that comes out equal has not said the two sides
agree about what is being celebrated.

**A `days: 0` row is held by a disagreement about WORDS, and Japan was the
one** (2026-09-06). The engine agreed about the rank, colour and precedence of
all 1,095 days; what held the calendar was 10 September, where this site prints
the form the Japanese Church's own calendars print and GCatholic names the same
205 martyrs by their leader. That is a row for `ACCEPTED_VARIANTS` — the
question to ask of a held calendar with no day differences is which book each
side is copying, not which is right.

**And the fold that check runs through kept the letters of one script.**
`[^a-z0-9]` is not a spelling of "punctuation": every name in the five
calendars anchored in Japanese, Korean or Chinese folded to its DIGITS, so
`성 김대건 안드레아 사제` and every other Korean name folded alike to the empty
string and matched. Japan's two divergences were caught only because one name
says 205 and the other 204. **A script-aware fold reports the same divergences
and no others** — the derived layers took their names from the feeds, so
nothing was hiding behind it — which is the measurement that made the change
free, not the reason it was needed.

**A national proper's name is transcribed, and the check that remains is
real.** These celebrations have no Latin original, so the site carries the
conference's own wording and the oracle checks names in the anchor language
only. What it checks independently is everything the ENGINE does with them —
date, rank, colour, precedence, moves, suppressions.

### The General Calendar reaches twenty more languages, on the same terms

Until 2026-09-06 `grc.ts` named its 218 celebrations in Latin, English and
Portuguese and in nothing else, so an Italian reader met Timothy and Titus as
_Saints Timothy and Titus, Bishops_ — `celebrationName` falling back to
English, correctly, on the page whose whole content is those names. The
vernaculars are in the feeds already: **`General-A` through `General-H` are
published in Latin, English and Portuguese, which are the three there was no
gap in, but a national calendar IS the General Calendar plus that conference's
propers**, so the whole sanctorale rides in on Italy's Italian edition, Korea's
Korean one, and eighteen others.

**The join key is `DESCRIPTION` and not position.** Every non-English edition
parenthesises the English name at the head of that field, which is the only
thing in a feed that identifies a celebration across languages — the order
inside a day genuinely differs between editions, 9 October putting Denis first
in Korean and last in Italian, and 22 June putting Paulinus of Nola and the
martyrs the other way round in Latin from English. Joining on position gives
Paulinus the martyrs' name and reads perfectly while doing it, which is why
`liturgical_calendar.py` refuses to; `DESCRIPTION` makes the refusal
unnecessary rather than working around it.

**Two hundred and five to two hundred and eighteen of the 218 per language**,
and what is absent is absent for a reason rather than a miss: Poland keeps
Adalbert on 23 April and Hungary Saint Stephen on 20 August, so no Polish
edition prints George and no Hungarian one prints Bernard. Those go on falling
back to English. Two languages have their editions disagree — Spain and Urgell
against the thirteen American calendars on nineteen names, Hong Kong and Macau
against Taiwan on 197 — and each file records which side it took and that
taking one was a choice.

**They are not checked, and this is the circularity in its pure form.**
`oracle.test.ts` compares what this project computes against what GCatholic
publishes; these names ARE what GCatholic publishes. What the distance costs is
measurable exactly where there is a second witness: against `ROWS`, GCatholic
differs on 19 of the 218 Latin names, 36 of the English and 48 of the
Portuguese — `Blase`, `Peñafort`, `Lurdes`, and a house style that lowercases
_bishop and martyr_. Every one is a correction made by hand from the Missal's
wording, and in the twenty new languages there is nothing to make it from. What
is served there is the source uncorrected, which is worth more than English and
less than a book. `celebrationName` reads `ROWS` first for that reason.

**A chunk per language, none of them in the boot graph.** The set builds to
twenty chunks and 277 KB; one language is about 14 KB, 5 KB over the wire
(2026-09-06, `npm run build`). That is the accounting
`i18n.svelte.ts` already does for the interface dictionaries, down to the
`import.meta.glob` and the argument for it, and a table of saints' names is the
same kind of thing as a table of button labels — the cost of a language is paid
by the reader who picks it. `names.svelte.ts` holds the loader,
`LiturgicalDayCard` and `CalendarMonth` ask for it, and a miss renders English
and re-renders when the chunk lands.

### And the 285 days a year that have no name to transcribe

The sanctorale is the smaller half. Of the 365 days of 2026, **80 carry a name
of their own and 285 are composed** — every Sunday and every ferial weekday,
_Tuesday of the 11th Week in Ordinary Time_ — so the transcription above
reaches eighty days a year and left every other one in English for thirty-four
of the thirty-seven interface languages. Twenty-one more are the days the
Missal names outright (Christmas, the Triduum, Corpus Christi), and those
joined the same record. The rest could not: **a formula is not a string.**

**So the feeds are solved for their pieces rather than copied.** GCatholic
composes those days the way `temporal.ts` does and its `DESCRIPTION` carries
the English composition, so a feed is a table of (pattern, weekday, week,
season) against the vernacular string — and two names differing in one slot
differ in one substring, which locates the slot. What ships is fifteen patterns
over a shared table of six weekdays and thirty-four numerals: about 1.5 KB a
language, against 40 KB for the ~390 finished strings it replaces, and the ~345
of those the feeds actually show. **The solve is checked by rebuilding every
observed string out of the pieces**, which is what makes an unobserved week
safe to compose.

**A solve that rebuilds the feed exactly is the wrong one where the feed is
wrong**, and four defects turned up — each stated identically in every year and
every territory, so none is a stray character a vote would clear. GCatholic's
Lithuanian numbers the sixth and seventh weeks of Easter `II`; its Indonesian
numbers the second week of Advent `III`; its Vietnamese sets a stray `i` into
the thirty-second week of Ordinary Time; its Croatian prints `3. tjedna kroz
godinu` for the thirteenth week. The first three are outvoted inside the
weekday family, where Ordinary Time counts thirty-four weeks against Advent's
three. **The fourth has one witness and it is wrong, so it is overruled from
outside** — Banjaluka numbers 28 June to 5 July 2026 the XIII, which settles
the number, and the column's own digits settle the spelling.

### Dropping a slot was the wrong default, and it cost four languages

Until 2026-09-06 that fourth defect was DROPPED rather than repaired, and
Croatian, Maltese, Dutch and Swedish each carried two to four Sunday slots
that fell back to English, on the reasoning that a week the feeds never showed
could not be filled. **Two of the four were in the feeds all along.** Every one
of those languages was missing Advent 3 and Lent 4 and no other season's
middle — which is Gaudete and Laetare, the two days this project paints rose
and GCatholic paints violet. The solve passed over them for the colour and
recorded the absence as the source's silence.

**The other slots are genuinely unwitnessed, and that is not the same as
unknowable.** Malta keeps the Ascension on the Sunday, so Eastertide week 7
has no Sunday there to observe; Ordinary Time's ninth Sunday needs an earlier
Easter than 2025, 2026 or 2027 gave, in any calendar. Both were settled
against the conferences' own pages — the Archdiocese of Malta and Laikos for
`Is-Seba’ Ħadd tal-Għid` and `Id-Disa’ Ħadd` — in the wording of the column
they join. **A second witness was a search away in every case**, which is the
lesson: the feeds are the source these tables were read from, not the limit of
what can be known about them.

`names.test.ts` now asserts the fallback list is **empty**, over thirty-seven
years rather than the oracle's three — because the slots hardest to fill are
exactly the ones a three-year window never reaches, so a short run would
assert nothing about them.

**The eight days of Advent named by their date are computed, not read.**
`temporal.ts` calls 19 December _19 December_, which is a date and not a
formula, and `Intl` writes a date in all twenty of these languages — where the
feeds themselves set `Décembre 17` and `Dicembre 17`, GCatholic's English
template applied to a French and an Italian month. Transcribing those would be
transcribing a defect.

**A celebration carries `parts` rather than the name being parsed out of its
id.** `temporal.ts` knows the season, the week and the weekday when it places a
day; a vernacular table needs exactly those three and nothing else. Reading
them back off `ordinary-11-2` would work and `christmas-jan-2` would defeat it —
that id carries a day of the month where the name needs a weekday.

## A country's calendar is a page and a day is not

**The test is whether a head can differ, and a parameter's cannot.** `headFor`
is built from `pathname` alone, so for as long as the country lived in `?c=`
every calendar shared one `<title>`, one description and one sitemap row: a reader searching for `calendário litúrgico Brasil` was offered a page
describing the General Roman Calendar in English, if they were offered anything.
A date fails the same test in the other direction — it names no citation, and
as a path it would put an unbounded set of URLs into the sitemap for pages that
are pure computation. So `?d=` stays a parameter and the calendar became a path.

**`?c=` is unchanged, and two things still need it.** A link made before these
addresses existed still lands where it meant (the page mirrors it to the path
on arrival), and a territory that keeps another's calendar is still named by it
— `?c=il` shows the Latin Patriarchate's calendar, whose address is
`/calendarium/ps`. Ten territory paths resolving to one calendar would be ten
pages with one body, which is the single duplicate an `hreflang` cluster cannot
consolidate, because they are not translations of each other.

**Each page is published ONCE, in the language its calendar is published in.**
The cross product was the obvious design and is the wrong one: forty interface
languages times every published calendar is thousands of addresses, most of
them cells nobody asks for, all of them claiming to be one page in forty
languages when what actually separates two of them is the days. So there is no
cluster and no `x-default` here — one singleton per calendar, each canonical.

**The language is read off the source, not chosen.** `CALENDARS` in
`pipeline/scrapers/liturgical_calendar.py` already recorded the editions
GCatholic publishes each calendar in, taken from each calendar's own language
switcher, and its first tag is the anchor: the country's own language wherever
there is one. Cross-checked against CLDR's likely subtags, the two disagree
only where the source is the better witness — CLDR says Uganda speaks Swahili
and India Hindi, and both conferences publish in English.

**A language that cannot carry a calendar cannot name one, and Russia is the
row that proves it.** Its conference works in Russian and `ru` is an interface
language; the page is in English, because GCatholic publishes that calendar in
English only, `ru` is not one of the twenty vernaculars under
`calendar/names/`, and `ru.ts`'s own propers carry English names and nothing
else. A Russian title over English feasts is the falsehood the chrome gate
exists to refuse, met again in a place the gate does not reach.

**The one disagreement worth re-examining is `vi`.** The source publishes the
United States Virgin Islands in Spanish and its derived propers are US federal
observances named in Spanish; CLDR says the territory is anglophone. The
measured witness is followed; the diocese's own ordo would settle it.

**A page whose language comes from its path has to be painted in it.** The edge
sets `lang` from the same table, and `app.html`'s pre-paint block carries a
copy — without it the document declares Portuguese in its head and negotiates
English chrome under it before hydration, which is the mismatch that would make
these addresses worth less than the parameter they replaced.

**Only the reader outranks the address, and the browser is not the reader.**
`initialLang` walks four rungs — what the reader chose, what the page held,
what the address says, what the browser says — and saves the first alone. A
`/pt/…` prefix is a choice and persists; this is not one, and persisting it
would turn a link off a search results page into a Portuguese site for ever.

**A negotiated answer that saves itself disables every rung below it.** That is
how this shipped and it made the rung above dead code: the site wrote the
negotiated language back on a reader's first page view of anything, so by the
time anyone met `/calendarium/brazil` they had a saved value, the first rung
matched, and the address was never once read. Negotiation is deterministic and
costs nothing, so it is recomputed per load instead — the argument
`calendar-pref.ts` already made about the edge's territory guess, which an
unasked-for answer should be free to be right again tomorrow.

**An address this page wrote is not an address that speaks.** `/calendarium/brazil`
gets into the address bar two ways and only one of them is somebody saying
something: a reader arriving from a search result was handed a Portuguese head
by the edge, while a reader who pressed Brazil in the picker was reading in
Albanian and the page rewrote its own URL under them. So `mirror` holds the
interface's current language in `glossa:ui-lang-session` at every write —
the picker, the day, an arriving `?c=`, and the remembered territory
`/calendarium` opens in — and the reload that follows reads the hold rather
than the address. Session-scoped, because what the hold records is true of the
tab and of nothing else.

**The address is a slug and the calendar's id is not one.** Fifteen of these
ids are also interface language tags, and four of those name
something else there: `tl` is Timor-Leste on this table and Tagalog in
`/tl/preces`, `vi` the United States Virgin Islands and Vietnamese, `ar`
Argentina and Arabic, `be` Belgium and Belarusian. So the segment is `brazil`
where `?c=` keeps `br` — the decision `BIBLE_BOOK_SLUGS` already made when
`/scriptura/josh/1` became `/scriptura/iosue/1`, so that the URL says what the
page says. **They are written down and never derived**, because
`Intl.DisplayNames` moves with the platform's CLDR and an address that changed
when a browser updated would break every link ever made to it.

**A calendar's name is written out per calendar and not composed.**
`Calendário Litúrgico Brasileiro`, `Österreichischer Liturgischer Kalender`,
`香港禮儀日曆`: the adjective follows the noun in Portuguese, precedes and
declines it in German, and is not a word at all in Chinese, where the territory
modifies the noun directly. A rule that built these would need a grammar per
language; a finished phrase needs a speaker once. Where no demonym reads
naturally the name is parenthetical, which is the source's own shape — `São
Tomé e Príncipe` has no usable adjective, and `congolais` names the calendar of
either Congo.

**It is the name for a reader of that language, and everyone else is given the
English one.** The propers under it already walk `celebrationName`'s chain —
the reader's language, then English — so an English page about Brazil's
calendar printed `Saint José de Anchieta, Priest` under a heading calling the
calendar `Calendário Litúrgico Brasileiro`, and titled the tab the same.
`CALENDAR_NAMES_EN` is the rows whose own language is not English, written out
for the reason the endonyms are: `Liturgical Calendar` plus a territory from
`Intl.DisplayNames` costs nothing and is wrong three times — the vicariates and
the patriarchate are not the country their id spells — and it would put
`Congo - Kinshasa` and `Hong Kong SAR China` into a title, in whatever wording
the reader's browser shipped CLDR with. The edge still serves the endonym
(`route-titles.mjs`), and the two disagree only for a reader who has chosen a
language, whose whole page disagrees with it too.

**A name from `Intl.DisplayNames` is a label and can be nothing else**, which
is what that table is still used for — the breadcrumb, and the picker's cells.
The tagline was built around one for an afternoon and printed "as United States
keeps it", "wie Schweiz ihn feiert", "tel que le célèbre France": the platform
returns a bare nominative with no article, and no rule can add one, because
which countries take an article is a fact about each language's own list.

## The page

**The date is a query parameter, not a path segment**, for the reason above.
The country was one too until it earned an address, on the argument `?compare=`
already makes: the address in front of the reader should reproduce what they
are looking at.

**`replaceState` does not update `page.url`, and the controls did nothing** for
weeks, with no console error and nothing in `npm run check` or `npm test`.
Shallow routing sets `page.state` and deliberately never assigns `page.url`, so
a page deriving from `page.url.searchParams` had two ideas of where it was.
**The general lesson is about the failure's shape, not the API**: a control that
reads derived state and writes it through a different mechanism can be wrong in
a way that looks like nothing at all — the address bar agreed with the reader,
which is what made it possible to conclude the page was slow rather than broken.

**The repair was `goto`, and `goto` was the wrong half to change** (2026-09-05).
It fixed the disagreement and bought a flinch on every click: the header, the
card and the listing all moved and settled back, on days whose card was
identical, because a `goto` runs the whole router lifecycle — the root layout's
`load` re-runs (it reads `url`), `root.$set` goes over the component tree, and a
focus pass and a scroll pass follow — for a page that fetches nothing and
computes every date it shows from arithmetic. **What isolated it was the control
that did NOT flinch**: paging the month is local state and touches no router, so
the one interaction with no navigation behind it was the one with no motion.

So the ownership is inverted rather than the mechanism patched. The date and the
calendar are `$state` on the page, **seeded from `page.url` and written back to
the address bar** — and `page.url` freezing is now a fact about a value nothing
reads, kept honest by a builder that sets both parameters unconditionally, so a
stale base cannot carry a stale answer. **A URL parameter that no `load` reads
does not need a navigation to change**, and one that some `load` does read
cannot be changed without one.

**And the flinch survived that, because `$app/navigation`'s `replaceState` is
not the cheap half of `goto`** (2026-09-05). Its last two lines are
`page.state = state` and a `root.$set` handing the whole tree a freshly cloned
`page`, so a shallow write still costs a prop update over every component in
the app. The page writes `history.replaceState` itself now, carrying
`history.state` over wholesale — the router keeps its history and navigation
indices in there and compares them on `popstate` — and updating only
`sveltekit:pageurl`, which is the address the router would otherwise restore
this entry to. In dev kit warns once that this conflicts with the router; the
warning is aimed at the write that drops that bookkeeping, and there is no
un-warned door to the same thing. The arrival path stopped being an exception
with it: `goto` was there because shallow routing throws before the router has
started and `onMount` runs inside that window, and a bare history write has no
such guard.

**How it was finally caught is the transferable part, and it is not a layout
technique.** Three rounds of measuring boxes said the header's nav grew ~34px
and the document a line, for two frames, on every click — which reads as a
reflow and is not one. `document.fonts.status` was going `loaded` ->
`loading` -> `loaded` in the same window, and every nav link was scaling by the
same ~1.13 together: the document was re-resolving its `@font-face` rules and
rendering in a system fallback until it finished. **A flicker that moves the
chrome on a page the chrome knows nothing about is a document-wide restyle
rather than a layout bug**, and `document.fonts`' `loading` / `loadingdone`
events name the faces in one click. Two false leads are worth naming because
both were plausible and both were wrong: `scrollbar-gutter` (ruled out —
`clientWidth` never moved) and Chrome's scroll anchoring (ruled out —
`scrollY` never moved). The reader's own clue was better than either: the
flicker stopped after a round trip through a mobile viewport, which is a font
and scrollbar state change, not a layout one.

**The country picker is a grid of flags.** The reader of that control is not
weighing alternatives, they are looking for their own country, which they
recognise by its flag faster than they can read a column of names in an
alphabet that may not be theirs — and a grid answers "which countries does this
site have?" by being opened. The flags are the two regional-indicator code
points of the ISO 3166-1 code the calendar is already keyed by: one offset, no
assets, no licence question. **The fallback is what makes that safe** — Windows
ships no flag glyphs, so Chrome draws the boxed letters `BR`, which is the
country's code and still names the cell.

**The general calendar is a group of one, and it was a full-width row for a
day.** The row printed 🌐 beside the calendar's name and the argument for it was
that this is the DEFAULT, the thing every other calendar is a layer over, and
that saying so in words was worth the four millimetres. **What that missed is
that the shape of a choice is its weight**: a row twenty times the area of the
cells below does not read as "the default", it reads as a different KIND of
thing offered by a different control — and every option in this panel answers
the same question. It is a square in a `flag-grid` under a `.label-micro`
heading now, exactly like a region, so the name is still printed where a
region's name is printed and every cell is one size.

**`auto-fill`, not `auto-fit`, is what makes a group of one possible.** The two
differ in exactly one case and this control hits it twice — Oceania is Guam
alone, and the general calendar is a grid of one cell. `auto-fit` collapses the
tracks nothing landed in and lets the survivors split the full width, so a lone
flag drew a button the whole panel wide; `auto-fill` keeps the empty tracks.
Nothing changes for a region that fills its row.

**IT WORE THE VATICAN FLAG FOR A DAY, AND THAT WAS A FACTUAL ERROR.** The
reasoning was that 🇻🇦 is the flag of the see whose calendar the general one is.
It is not: Vatican City keeps the **Diocese of Rome's** calendar, which
GCatholic publishes as `IT-rome0` and `national/` carries as `va`, with eleven
propers no other calendar has — Ludovica Albertoni, Our Lady _Salus Populi
Romani_, All Saints of the Holy Roman Church. So one flag stood for two
different calendars in the same control, and on the general row it said the
universal calendar belongs to a country. 🌐 is the mark now, because a globe is
not a territory and that is precisely the claim the row makes.

**`?c=` names a TERRITORY and not a layer**, which matters for eleven of the
ninety-six places. Four cells select `ps`; with a layer id stored, the trigger
had to guess which of them the reader had pressed, and it took the first by
name — so choosing Israel answered "Cyprus". The route resolves the code through
`TERRITORY_CALENDARS`, a lookup that cannot be ambiguous in that direction, and
every layer id remains a valid `?c=` because a layer's own territory is one of
the territories it covers. **A held calendar's territories leave the picker with
it**, since that map is built from the published list — which is correct rather
than incidental: what is held for a country is held for everyone who keeps that
country's calendar.

**The chosen calendar is REMEMBERED, and `?c=` overrides it without replacing
it** (2026-09-05, `calendar-pref.ts`). A reader in Brazil is not choosing Brazil
for one visit — they live there — so the picker's choice is stored the way the
theme and the reading size are, and a bare `/calendarium` opens in it. What is
stored is only an explicit choice in the picker: arriving on somebody else's
`?c=pl` link shows Poland's calendar and leaves the reader's own preference
alone. **That is the one place this differs from `compare-pref`**, which adopts
its parameter as a preference; a territory is a fact about a person in a way a
column layout is not, and a shared link should not silently re-home anyone. The
preference is applied by writing `?c=` into the address on mount, not by holding
a value beside the URL — this page's contract is that the address reproduces the
screen, and a page showing Brazil under a bare `/calendarium` would hand out
links that show the sender Brazil and the recipient Rome.

**And a reader who has never chosen opens where they are** (2026-09-06,
`geo.ts`). Cloudflare resolves the connecting address to a country, `worker.ts`
writes it onto the shell's `<html>` as `data-geo`, and `openingTerritory` ranks
the three answers: `?c=` in the address, then the stored choice, then the
country. **The middle rung is why `'general'` is stored rather than cleared** —
a reader who went back to the general calendar has made a choice, and `??`
stops the chain on it where `||` would have re-homed them by geography every
visit. Nothing is fetched, no permission is asked, and nothing about the reader
leaves the document served to them: the worker is invoked on that navigation
anyway (`site/docs/edge.md`), and the answer was already in the connection.

**The browser's locale is the other free signal and is a worse one.** `en-US`
is what a phone says in Lagos, Manila and Dublin alike, and an interface
language is a fact about what someone READS rather than about which
conference's calendar they keep — which is exactly why `ui-langs.ts` negotiates
the language from `navigator.languages` and this does not. **The guess is not
remembered**: an address is where the reader is now, and a pinned country would
hold someone who moved, or who read one page through a VPN, in a territory they
never picked under a key that claims they did. The language negotiation used to
be the counter-example here and wrote its answer back; that turned out to cost
the country calendars their own language (above), and now neither guess is
saved — a key means the reader pressed something, in both files.

**The United Kingdom is the one place a country code is not the answer**, and
Northern Ireland is deliberately unanswered. England, Scotland and Wales keep
three calendars and `gb` names none of them, so the hint comes from
Cloudflare's first-level region — `ENG`, `SCT`, `WLS`; `NIR` belongs to the
Irish conference rather than to any of the three, and answering `ie` off our
own inference would open a reader in one country on another country's calendar.
A `gb` with no region resolves to nothing at all rather than to the most
populous of the three: a reader in Glasgow shown England's calendar would be
shown a calendar somebody appears to have chosen for them.

**What the edge cannot do is decide whether a code names a calendar.**
`TERRITORY_CALENDARS` is derived from eighty-five layer files and the worker
carries names and manifests only, so `geo.ts` normalises a code and the client
filters it — which also means a country with no calendar, a calendar held by
`held.ts`, and Cloudflare's own non-answers (`XX` for unknown, `T1` for a Tor
exit) all degrade the same way a typed `?c=` does, to the general calendar.

### The controls moved into the card, and the home page got the same one

**A bordered box under a line of loose controls reads as its lid**, which the
control row's own margin was there to deny (2026-09-06). That was the tell
rather than a spacing problem: the date, Today and the picker all answer WHICH
DAY, the card is that answer, and controls that change a thing belong to it.
`LiturgicalDayCard` takes them as a `controls` snippet — top right, and above
the name on a phone (`column-reverse`, so they stay last in the DOM and a
screen reader still meets the day first).

**EVERYTHING IN THAT CORNER IS BORDERLESS AND THE PICKER IS A FLAG ALONE**
(2026-09-06). Boxed, the controls were three bordered rectangles a centimetre
inside a bordered card, which reads as a second card rather than as the
furniture of the first; muted until pointed at, they say "control" quite as
clearly at that size, and `.day-more` was already drawn that way. The picker
lost its name for a related reason and one of its own: `General Roman Calendar`
is up to sixteen characters in a row that has to fit beside a celebration's
name, and the flag is the same answer at a glyph's width — the name stays as
the `title` and the `aria-label`, which is the rule every icon-only control on
the site follows. The row now fits on one line on a phone, where it wrapped to
two.

**AND THE TWO CARDS BECAME ONE OBJECT LATER THE SAME DAY.** The date field and
Today went with the borders: both answered WHICH DAY, and the listing under
them answers it better — a reader picks a day by reading what is on it, where
the field made them type one blind. What is left in the corner is the calendar
picker, which is the only control there that changes what the days MEAN, plus
the way out on the home page. So both cards now read the same: a date, a name,
the facts under it, and one flag in the corner.

**The date leads the card again**, having spent an afternoon in that corner.
What was wrong there is what the corner IS — furniture, the things that change
the day or leave it — where the date is the first thing the card says. It
carries `today`, `yesterday` or `tomorrow` beside it when the day is one of
them, which is the relation rather than a second date; for every other day the
date already says it. **The word is `Intl.RelativeTimeFormat`'s and not three
dictionary keys**, on `Intl.DisplayNames`' argument for the picker's country
names: three words in thirty-seven languages is a table nobody would maintain
and every browser already holds. The calendar's terms of art stay in the
dictionaries, because those this project translates deliberately.

**What it costs is a distant date**, and that is the whole of the bill: the
field could be typed into, the listing pages one month at a time, and `?d=` is
still the address of any day for anyone who edits it. Getting back to today is
the header's Calendar link, which carries no `?d=`.

**Which is what let the home page keep a calendar at all.** It showed the
general calendar to everyone, and the reason recorded on the page was that the
territory lived in `?c=` and nowhere else — but the durable half of that
argument was the other one: a national solemnity under a bare "Today", with no
control beside it, is an unattributed claim about the reader. The picker is
that control, so the claim is now correctable in the place it is made, and the
site's front page opens in the calendar its reader keeps.

**The layers are fetched there, never imported.** Eighty-five files build a
184 KB chunk and the home page is the one every reader boots, so
`calendar/layers.svelte.ts` holds a lazy registry — `names.svelte.ts`'s
arrangement one directory up, and the same accounting: the cost of a country is
paid by the reader who keeps one. `/calendarium` still imports `./national`
outright, the layers being its subject. Three consequences worth knowing:

- **The card renders the general calendar until the chunk lands**, then
  re-renders. Visible only on the days two calendars disagree, and it is the
  same degradation a celebration's name has while its language's table is in
  flight.
- **A reader who keeps the general calendar fetches nothing**, because the
  page checks what it would be fetching FOR before asking.
- **The picker's trigger owes the fetch nothing.** A flag is arithmetic on the
  ISO code and a name is `Intl.DisplayNames`', so the control says which
  calendar the reader keeps from the first frame; only the panel behind it
  waits, and it primes on `pointerenter` as well as on open.

**The month's arrows spread to the edges on a phone** and stay huddled around
the month's name above `34rem`. Left-packed, the two arrows sat either side of
the name in the corner of a screen the day list fills edge to edge, so the name
read as belonging to the arrows rather than to the month under it; at the full
column width the same rule would put two 2rem buttons forty characters apart.

**A DATE FIELD LIVED HERE FOR A DAY AND A HALF** (2026-09-05 to 2026-09-06),
and what it cost is worth recording because the shape recurs. A native
`<input type="date">` prints the operating system's date format, not the
interface language's, so a reader on an American machine met `09/17/2026` at
the top of a page written in Portuguese; dressing it took a transparent input
over a rendered face, `showPicker()` on any click because the platform's
indicator was invisible with it, `opacity` rather than `visibility` so the
control stayed focusable, a blur-unless-typing rule because `:focus-visible`
fires on a CLICK in a text-entry control, and a hidden probe of the widest date
in the reader's language so the box stopped changing width as the day changed.
Six mechanisms, all correct, for a control the month listing already replaced —
and the listing shows what is ON each day, which is what a reader is choosing
by. **The lesson is the ratio**: when a control needs that much machinery to
behave, the question is whether the page needs the control.

**The month listing can show the days that say nothing, and does not by
default** (2026-09-06). The filter's argument stands — a third of a month
reading `Weekday` beside an empty name, between the reader and the days that
say something — but it is a judgement about what a reader wants, and one
counting the days of a month wants the month. So it is a press at the end of
the listing's own header, where what it changes is on screen: `aria-pressed`
carries the state and the label names the rows in both of them, which is the
rule every toggle on this site follows. The glyph is where the state shows — a
solid eye listing them, a dashed one not — and deliberately not `eye-off`,
whose struck-through eye would say "hidden from you" about rows the reader
chose not to list. It is not in `?d=` — the address reproduces WHICH DAY, and
how many rows are drawn under it is not a fact about the day — but it IS
remembered (`glossa:calendar-plain-days`, beside the territory in
`calendar-pref.ts`), which was decided the other way for two days. A reader
counting the days of a month is counting them next month too, and the press is
on the listing's own header, which they meet again at every page of the
calendar.

### Some layers share their propers, and factoring them out cost the oracle nothing

Comparing all 85 layers on 2026-09-04: **no two are identical**, so no calendar
here is redundant — but several carry propers agreeing to the letter. Kenya,
Sudan, Uganda and South Africa hold seventeen dates in common; Algeria and
Tunisia twelve; Austria and Liechtenstein thirty-nine. Written flat that is
several hundred lines saying the same thing in eight files, and the failure that
shape invites is the one nobody sees: a correction applied to three copies of
four.

**The objection to factoring them was wrong, and the way it was wrong is the
useful part.** It ran: a country's file should say everything that country does,
so the oracle can compare it whole. But `oracle.test.ts` compares the calendar
this project COMPUTES against the calendar GCatholic computes — it never reads a
layer file at all. A shared set is invisible to it, and every member goes on
being checked exactly as before. What was left of the objection was
readability, and several hundred duplicated lines answer that the other way.

`withGroup` (`national/common.ts`) composes; `groups.ts` is generated by the
same tool as the layers, from the intersection of the members it is told to
compare. Three rules keep it a deduplication of measured rows rather than a
claim about who approved them:

- **Whole DATES, never single celebrations.** A date joins a group only where
  every member holds an identical list on it — so a member can never carry a row
  of its own on a group's date, and `withGroup` can **throw** on a collision
  instead of letting argument order pick a winner silently.
- **One anchor language per group.** A shared celebration written under two
  different language tags is not a shared ROW. This is what keeps Luxembourg out
  of the German-language group although it shares 48 celebrations with it.
- **The names describe the members.** AMECEA is the plausible explanation of the
  eastern African set and the _Regionalkalender für das deutsche Sprachgebiet_
  of the German-language one; neither is verified here. What is verified, on
  every run, is that the rows are the same.

**The cluster that did not become a group is the argument for the first rule.**
Hong Kong and Taiwan share 27 celebrations and exactly ONE date: the Chinese
martyrs are in both calendars and are not kept on the same days. A group keyed on
celebration ids would have moved a feast in one of them.

**And the re-derivation that produced all this deleted eleven territories from
the picker.** `alsoCovers` had been written into five layer files by a throwaway
script from the session that created them, and the script was gone — so the
field was regenerable only from the previous copy of its own output, which the
root `CLAUDE.md` records as the shape that bit this project three times in one
day. Every test still passed; the layers were still valid; the countries were
simply no longer there. `ALSO_COVERS` is a table in the derivation now.

### The month listing, and the grid that lasted an afternoon

The page listed the whole liturgical year, Advent to Advent, filtered to the
~230 days that were not plain weekdays. **What was wrong with that was the SPAN,
not the shape**, and it took building the other thing to be sure. A reader had
to scan a screen and a half to find a date, and the days with nothing appointed
were filtered out altogether — so a date could be looked up and simply not be
there.

The replacement was a seven-column month grid, which is what a calendar usually
looks like. It went back the same day. **This page is not a diary**: nobody is
placing appointments against weekdays here, they are reading what each day IS,
and that is a line of text of unpredictable length — "Saints Cornelius, Pope,
and Cyprian, Bishop, Martyrs" — which a column a seventh of the page wide cannot
hold. The grid clipped nearly every name it drew to two lines and dropped them
all below 34rem. What survives of it is the month: a listing of one month, with
the month named above and one press to the next, and a heavier rule above each
Sunday for the week structure a list does not otherwise show.

**There IS a separate "month being viewed", and there was not until 2026-09-05.**
The month listed was the month of `selected` and the arrows moved the selected
day, clamped into the shorter month — one piece of state, in the URL, so the
address always reproduced the whole screen. The argument was sound and the
behaviour was wrong, because it priced out the thing a reader actually does with
a calendar: **looking**. Pressing forward twice to see when Advent starts threw
away the day they were reading about, replaced the card above with a day they
never chose, and — the clamp not being symmetric — could not be undone by
pressing back twice. **Turning a page is not choosing.**

`view` is the month on screen and it follows the chosen day ONE WAY: pick a day
(a row, a pasted `?d=`) and the listing goes to that day's
month; page the listing and the chosen day stays put. So the two can only
disagree while the reader is browsing, which is the state the second variable
exists to allow, and any choice at all resolves it. PageUp/PageDown on a row is
the one control left that moves the day by a month, and it moves it from the
FOCUSED ROW rather than from `selected` — a reader who paged to March and tabbed
into the list is standing in March, and stepping from a chosen day in February
would jump them out of what they are looking at.

**The awkward half is still focus**: a keyboard move that crosses a month
replaces every row, so the component names the date to stand on and refocuses it
after the render.

### The filter came back, with the repair the year listing needed

Listing every day was the month view's answer to the year listing's one real
defect, and it was the wrong answer: a third of a month is rows reading `Féria`
beside an empty name, and they sit between the reader and the days that are not.
`daysOf` filters to the days that have something to say — a celebration of their
own, an optional memorial, an observance — **plus the chosen day and today,
whatever is appointed on them**. That second half is the repair. A date can be
typed into the field, pasted in a URL or arrowed onto and it is always a row,
marked; nothing can be looked up and be missing. The year listing had no such
rule, which is why filtering there lost dates and filtering here does not.

A row and a day stopped being the same thing, so the arrow keys follow the rows,
off one end of a month and into the next month's list. Stepping by a calendar
day would make a hidden feria appear under the caret for one keystroke and
vanish again — a list that rearranges itself as it is read.

### The page must not move under the reader

Two separate jumps, with two different fixes, and the second only appeared when
the day's card moved ABOVE the listing on 2026-09-04 — where it belongs, since
the card is the answer and the list is the way to ask again.

**The selected row was rewrapping.** `font-weight: 600` on the whole row is a
metric change, and a celebration's name runs to 111 characters, so any row near
the wrap gained a line the moment it was selected and shoved every row below it
down. Clicking down the list made the list jump under the cursor. The mark is a
2px accent bar carried transparent by _every_ row plus a background tint; the
weight cue survives on the day number, which has a fixed `inline-size` and
cannot reflow whatever it wears.

**And the card's height depends on the day**, which is the whole of the second
jump. Measured over three years and every published layer: 804 of 1,095 days
carry no optional memorial, 229 carry one, 55 carry two, and the maximum is five
(Argentina, 9 October 2027).

**Two boxes were held in turn, and neither was the answer.** First the LIST was
made a fixed-height scrolling pane, with the section measuring its own top edge
before each navigation to scroll the page back afterwards — which worked, and
was a correction applied at the wrong end: the list's height is a property of
the MONTH, and nothing sits below it to be moved. Then the CARD was held instead
(15.5rem, 19rem below 34rem, `scrollbar-gutter: stable`), which is the box whose
size moves for a reason the reader did not intend — and the compensation could
then come out, because the anchor measured zero every time. That is the right
diagnosis and it produced a defect of its own: a height chosen to fit the
ordinary day whole CLIPS every day that has more to say, so a card whose whole
job is to answer a question showed its answer with the last line cut off, to
keep a list below it still.

**So the card is as tall as the day it shows, and the list moves** (2026-09-05).
A reflow is the smaller injury: the reader caused it, it settles in one frame,
and nothing is hidden by it. **The general rule the pair of reversals leaves is
narrower than "hold the box that moves"**: a surface that ANSWERS may not be
clipped to protect a surface that NAVIGATES. What is left of the fix is the
metric-stable selection above — which was always the real one, since it removed
a movement rather than absorbing it — plus the other half of the repair, one
section up: paging no longer changes the day, so the card only resizes when the
reader has asked for a different day.

The card kept the two-element split for a few hours after that (a `.pane` for
the height, an `.article` for the border, so the frame would not enclose empty
space) and it went with the height; one element again.

What is left in the component is the refocus alone — a keyboard move that
crosses a month replaces every row, so the date to stand on is named before the
navigation and focused after it.

**Today moved up to the page's control row and then off the page altogether**
(2026-09-05, 2026-09-06). It sat in this header beside the two arrows, where it
read as a third month control and is not one — it names a DAY — so it joined
the controls that do. It went with them: the card says `today` beside the date
when the day is today, which is what the button was for on the day a reader
could see it, and the header's Calendar link is the way back from any other.

## The page explains its own vocabulary

Asked by a reader who had met none of it: what do the colours mean, what is
Ordinary Time, why does it matter that tomorrow is the Twenty-third Sunday in
it, what are the Sunday cycle, the weekday cycle and the psalter week. Every
word on the day's card is a term of art, and the page printed all of them with
no way in.

**Two shapes, because the question has two shapes.** A gloss behind a term
answers "what does _Memorial_ mean"; it cannot answer "what is any of this
for", because a reader who does not know the vocabulary does not know which
word to press first, and pressing seven in turn never adds up to the sentence
that the Church keeps a year of its own and that a day's name, rank and colour
are what decide the prayers and readings appointed for it. So: `TermGloss` on
every term in the card, and `CalendarPrimer` at the foot of the page, whose
lead is that sentence and whose four folds are the vocabulary — the seasons,
what a day can be, the colours, the cycles.

**One set of sentences, shown twice.** Both read `calendar.gloss.*` out of the
dictionary, so the tooltip and the primer cannot come to say different things
about the same word — the reason the calendar page and the home page share
`LiturgicalDayCard` in the first place.

**`TermGloss` is `SiglumGloss` with the citation half removed**, mechanism for
mechanism: the same `NoteCard(uid, { margin: false })`, so the browser's
declarative invoker toggles it on a tap and a resting pointer opens it; the
same dotted underline and `cursor: help`; the same `role="note"`. What differs
is that a siglum's expansion is content in the citation's language with an
outbound address behind it, and this is chrome in the reader's own with nowhere
to send them — so no `lang`, no source line. **The top layer is load-bearing
here**: the card is held to a fixed height with `overflow-y: auto`, which clips
absolutely positioned descendants, and a popover is not one.

**Totality is checked from both ends.** The primer's three lists are
`satisfies Record<Season | Rank | Colour, true>`, so a term added to
`calendar/types.ts` and not explained is a type error; and a test pairs the
`calendar.*` names against the `calendar.gloss.*` sentences in both directions,
because `TermGloss` builds its key by interpolation — a named colour with no
gloss renders the key as its own tooltip, and for `rose` that is visible twice
a year, for `blue` once, in two countries.

**English and Portuguese only**, on `loadFailed.*`'s precedent: `t()` falls
back key by key, so the other thirty-two interface languages get these in
English rather than a machine translation of thirty definitions of Catholic
terms of art, where the obvious dictionary word is often not the one the Church
uses (site/CLAUDE.md §Languages, on the confidence tiers).

## What it deliberately does not say

**The lectionary.** The cycle letters are stated as facts about the year and
the page stops there; the readings are a work this corpus does not hold, and
printing citations for them would assert a table nobody here has sourced.

**The day's colour as the page's colour.** Liturgical colours are vestment
colours, and four of them are also this interface's background in one theme or
another. A named swatch says the same thing without the page pretending to be
the sanctuary.

**Every language's saints.** The Calendarium is a Latin book, so the Latin name
is the celebration's own; English and Portuguese are written, each layer's
propers carry the language its conference approved them in, and everything else
falls through `CONTENT_LANG_FALLBACK` exactly as it does for a work the corpus
does not hold. A national proper has no Latin at all, and that is correct
rather than a gap — composing one would be invented text.
