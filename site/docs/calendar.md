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
closest day not listed under nn. 1–8", and _closest_ is not one direction: the
Annunciation goes forward past the Octave of Easter, Saint Joseph is
anticipated. 2035 needs both at once, because Easter falls on 25 March. The
direction is a property of the celebration and not a rule read off the season.

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
would be silently absorbed and a fixed one would sit unpublished for ever. The
recurring causes are things a layer cannot state: All Souls transferred off a
Sunday (a rule of `year.ts`), an observance suppressed by the day it falls on,
a conference that changed a transfer inside the oracle's window, and a patronal
solemnity on the LAST weekday of a month, which `MovableRule` cannot spell.

**A national proper's name is transcribed, and the check that remains is
real.** These celebrations have no Latin original, so the site carries the
conference's own wording and the oracle checks names in the anchor language
only. What it checks independently is everything the ENGINE does with them —
date, rank, colour, precedence, moves, suppressions.

## The page

**The date is a query parameter, not a path segment.** A reading address names
a citation and a chrome path names a page whose every word is the interface; a
date is neither, and as a chrome path it would put an unbounded set of URLs
into the sitemap for pages that are pure computation. The country joined it in
`?c=`, on the argument `?compare=` already makes: the address in front of the
reader should reproduce what they are looking at. `?c=general` is never
written, being an absence rather than a value.

**`replaceState` does not update `page.url`, and the controls did nothing** for
weeks, with no console error and nothing in `npm run check` or `npm test`.
Shallow routing sets `page.state` and deliberately never assigns `page.url`, so
a page deriving from `page.url.searchParams` had two ideas of where it was.
The fix is `goto(url, { replaceState, noScroll, keepFocus })`. **The general
lesson is about the failure's shape, not the API**: a control that reads
derived state and writes it through a different mechanism can be wrong in a way
that looks like nothing at all — the address bar agreed with the reader, which
is what made it possible to conclude the page was slow rather than broken.

**The country picker is a grid of flags.** The reader of that control is not
weighing alternatives, they are looking for their own country, which they
recognise by its flag faster than they can read a column of names in an
alphabet that may not be theirs — and a grid answers "which countries does this
site have?" by being opened. The flags are the two regional-indicator code
points of the ISO 3166-1 code the calendar is already keyed by: one offset, no
assets, no licence question. **The fallback is what makes that safe** — Windows
ships no flag glyphs, so Chrome draws the boxed letters `BR`, which is the
country's code and still names the cell. The general calendar is a labelled row
above the grid rather than a square in it, because it is the thing the others
are layers over.

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

**There is no separate "month being viewed".** The month listed is the month of
`selected`, and paging moves the selected day, clamped into the shorter month —
so the page keeps one piece of state and it is the one in the URL. A view month
held beside the selection would show two months at once, since the day's card
sits with the listing. **The awkward half is focus**: a keyboard move that
crosses a month replaces every row, so the component names the date to stand on
and refocuses it after the render.

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
(Argentina, 9 October 2027). **So the card is held to one height and scrolls
inside itself past it** (`fixedHeight`, 15.5rem, 19rem below 34rem,
`scrollbar-gutter: stable`) — a height that fits the ordinary day whole: date,
name over two lines, the kind-of-day line, the cycles, and one thing kept
beside it.

**The height is on a wrapper and the border is on the card inside it**, which is
why they are two elements. Bordered, the fixed box draws a frame around whatever
the day does not fill, and three days in four show a rule two lines under the
last word; unbordered, the space it holds open is just page, and the card is
exactly as tall as what it says. The frame belongs to the card and the height to
the layout.

**The fix went to the list first, and that was the wrong box.** The list was
made a fixed-height scrolling pane and the section measured its own top edge
before each navigation to scroll the page back afterwards — which worked, and
was a correction applied at the wrong end of the problem. The list's height is a
property of the MONTH and nothing sits below it to be moved; the card's height
is a property of the day the reader is changing, and it sits above everything.
**Hold the box whose size moves for a reason the reader did not intend**, and no
compensation is needed anywhere: with the card fixed, the anchor measured zero
every time and came out, and the list went back to being as long as the month
is.

What is left in the component is the refocus alone — a keyboard move that
crosses a month replaces every row, so the date to stand on is named before the
navigation and focused after it.

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
