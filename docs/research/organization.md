# How this is organized: five doors, and the ladder behind them

Written 2026-09-03. **Built 2026-09-04.** This is an organization pass in
the shape of `audiences.md`: it names the shape the site converged on, says
which reader each part is for, and grounds every claim about the state it
found in a path.

**It is a record now and not a proposal, and it is kept as it was
argued.** The standing rules moved to where the code is —
`site/docs/finding.md` for the bar, Library and the jump box,
`site/docs/addresses.md` for the shelving and the two route tables,
`site/CLAUDE.md` for what must be true before any of it is touched. What
stays here is the reasoning those rules are the conclusion of, including
the parts that were wrong on the way: the three umbrella labels that
failed, the axis the Social Doctrine was sorted on twice before it settled,
and an exclusion the calendar falsified within a day. A design document
that is edited until it agrees with the code is a second copy of the code.

Three things came out differently in the building and are marked **[built
differently]** where they appear. Counts carry the date they were taken.

It exists because the navigation was built one work at a time. On
2026-09-03 the bar held six items and by the next morning seven, and the
two newest works were reachable from nowhere else: neither
`/doctrina-socialis` nor `/ius-canonicum` was named on the home page, and
neither was in the jump box.

## The fact that decides the shape

`audiences.md` §The two axes: readers split on whether they arrive with an
**address** or with a **question**, and the two who arrive with a question
(§1 the layperson, §5 the OCIA candidate) are "plausibly most of the
traffic" and are "stopped in the first ten seconds."

Read the nav against that. Every entry in `NAV_ITEMS`
(`site/src/routes/+layout.svelte`) is a _work_ — Bible, Catechism, Prayers,
Magisterium, Social Doctrine, Canon Law. To use it a reader must already
know which book holds their answer, which is precisely the knowledge §5
lacks: that persona stops "at the vocabulary of the corpus itself," not
knowing the Compendium is a different and shorter book than the Catechism.

Meanwhile the readers the bar is built for do not use it. §7 the seminarian
"arrives with an exact citation" and goes through `JumpBox`; §4 the
citation-follower arrives mid-corpus on a URL someone else wrote and never
sees the bar at all.

**The bar is therefore built for the readers who need it least.** That
inverts the design: it should be optimised for the newcomer, because the
expert is typing `can. 748` into the jump box. This is the single judgment
the rest of the document rests on.

## The bar

| Item         | Points at      | Holds                                     | Why it is in the bar                                                   |
| ------------ | -------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| **Learn**    | `/catechismus` | CCC, its Compendium, the Social Doctrine  | The only label a reader without the vocabulary can act on (§5, §1)     |
| **Bible**    | `/scriptura`   | every edition, Haydock, the book intros   | The most recognised word on the site, and the largest work             |
| **Prayers**  | `/preces`      | the prayer editions                       | High recognition, and the shortest path from arrival to reading        |
| **Library**  | `/bibliotheca` | everything, plus the reader's own place   | The complete catalogue — the superset, not the remainder               |
| **Calendar** | `/calendarium` | the liturgical year, general and national | The only by-date entry, and the only daily-return surface the site has |

Five, against seven today, and the difference is the whole argument.
`/calendarium` is one of the two additions since this bar was drafted, and
it is the one this bar would also have made: a calendar is a permanent
door, not a work. The other additions — `/doctrina-socialis` and
`/ius-canonicum` — are works, and they are precisely what the present rule
of one item per work costs.

The count is not the point — **the point is that it stops growing.**
Denzinger, the Roman Catechism, the Fathers and a second code each cost a
slot today. Under this bar every future work lands inside Library or inside
Learn, and the bar is finished.

`Learn` is one imperative among four nouns, and mixed grammar in a nav row
is normally a smell. It is taken deliberately: it is the only label on the
bar that explains itself to a reader who does not yet know that "Catechism"
is where one goes to learn. Two notes on it —

- It breaks nothing here. `+layout.svelte` already states that the
  canonical route is Latin while the displayed label is independent of it,
  and the site already ships that mismatch: the label reads "Magisterium"
  and the route is `/documenta`. So `Learn` can point at `/catechismus`
  with no route change.
- **It has to be checked in translation before it is committed.** An
  imperative is harder than a noun across the dictionaries in
  `site/src/lib/i18n/` (thirty-seven on 2026-09-04), several of which need
  an aspect or politeness choice English does not. If it does not survive,
  the fallback is the flagship noun, not a vaguer verb.
- **The calendar has just measured what a new door costs in strings.** It
  shipped forty-nine `calendar.*` keys, and they exist in three
  dictionaries — `en`, `la`, `pt`. `i18n.svelte.ts` resolves a key as
  `loaded[lang]?.[key] ?? en[key] ?? key`, so the other thirty-four
  interface languages read the newest door's label, its controls and its
  whole page in English. That is the same posture the corpus takes for a
  work it does not hold in a reader's language, and `site/docs/calendar.md` states it deliberately for the celebration names —
  but the page's own chrome is a different thing from a saint's name, and
  a bar of five doors should know that a door costs a page of interface
  strings and not merely a label.

## Library is the superset, not the leftovers

Three umbrella labels were tried and discarded in the discussion behind
this document — "Church", "Magisterium", "Teaching" — and all three failed
the same way: Scripture is transmitted by the Church, the Catechism is
issued by the Church, the prayers are the Church's, so a label whose
siblings all satisfy it carries no information and cannot tell a reader
where to click.

`Library` escapes that **only if it means the whole catalogue rather than
the rest.** A library contains the Bible too. Read that way it makes no
taxonomic claim at all, the bar reads as _four doors people want most, plus
the whole thing_, and the redundancy between a shortcut and the full index
is ordinary navigation rather than a defect. (Redundancy is only a defect
when two items reach the _same_ place, which is why `+layout.svelte`
removed its "Home" entry beside the brand link.)

So the page lists **every** work, Bible and Prayers included, and it is also
where the reader's own position in the corpus lives:

- **The catalogue**, arranged in the six shelves below, each with its
  editions and a sentence saying what it is.
- **Continue reading**, which today is a home-page section over four of the
  work types in `CONTINUE_TYPES` (`+page.svelte`) and silently omits
  `social-doctrine` and `canon-law` — a reader halfway through the Code
  gets no row. **[built differently]** The obvious fix is to add the two
  missing types, and that would have left the same defect armed for the
  next work ingested. `continueRows` DISCOVERS the types from the reader's
  own saved positions instead, so there is no list to fall behind the
  corpus.
- **Bookmarks**, which `/signata` already groups by work rather than by
  recency, for the reason its docblock gives. Library surfaces them;
  `/signata` remains the full view.

That last pairing is what makes the page more than an index: a library has
a catalogue _and_ a borrowing record, and the two belong on one page.

## The home page is today, not an index

The home page's present failure is a **weight** problem, not a nesting one,
and this is why nesting felt like the fix and was not. It renders the
Bible's complete table of contents (`BookChapterPicker`, grid variant, nine
groups, `collapsible={false}`) and then the Catechism's complete two-level
outline. Those two blocks are most of the page; Prayers gets five chips and
Magisterium gets a list of counts, and by the time the page reaches the
bottom there is no room left — which is why nothing added since was ever
added to it.

With Library holding the map, the home page can stop being an index:

- **Today** — the liturgical day, its rank, colour and season. This is now
  a component call and not a project: `today()` in
  `site/src/lib/calendar/` answers for the current date and
  `LiturgicalDayCard` takes the result as its one required prop, so the
  home page's Today block is the card `/calendarium` already renders, with
  the arrows and the country picker left off. **What it cannot yet carry is the day's readings** — the lectionary
  is absent by choice (§Liturgical scope), so Today states the day and its
  cycle letters and links into `/calendarium`, and the reading links are a
  later addition to a block that already exists.
- **The four doors**, and a link into Library.
- Nothing else. The full indices already exist at `/scriptura`,
  `/catechismus`, `/documenta`, `/doctrina-socialis`, `/ius-canonicum` and
  `/preces`; the home page duplicating two of them is the whole imbalance.

**Open:** whether Today also carries a compact continue-reading row, or
whether that lives only in Library. Both are defensible — continue-reading
is temporal, which argues for Today, and structural, which argues for
Library. Not decided here.

## The shelves, which are now a page and not a bar

The six shelves are the structure _of_ Library. Their value is that they
absorb growth instead of multiplying:

| Shelf           | Holds on 2026-09-04                          | Absorbs later                                          |
| --------------- | -------------------------------------------- | ------------------------------------------------------ |
| **Scriptura**   | the Bible editions, Haydock, the book intros | more editions, more commentaries, patristic commentary |
| **Catechismus** | CCC, its Compendium, the Social Doctrine     | the Roman Catechism                                    |
| **Magisterium** | the document library                         | Denzinger, Vatican I, the GIRM                         |
| **Ius**         | the Code                                     | the CCEO, particular law                               |
| **Preces**      | the prayer editions                          | further devotional collections                         |
| **Doctores**    | the Summa                                    | the Fathers and the other Doctors                      |

`/doctores` is unlisted today and `+layout.svelte` argues why (the Summa
awaits a quality pass and the shelf holds nothing else). Under this design
that argument weakens rather than strengthens: an unlisted shelf is
invisible in a bar, but a shelf on the Library page can carry its own
caveat in a sentence beside it. The Summa also stops needing a bar slot,
which `+layout.svelte` already planned for.

## Where the Social Doctrine goes, and why it moved three times

It was proposed beside Magisterium, then under it, then under Catechismus.
An item that will not sit still usually means the taxonomy is short an
axis, and it was: the Compendium of the Social Doctrine is a compilation of
magisterial documents by **origin**, a systematic synthesis by **form**,
and social teaching by **subject**. A single shelf can encode one.

The shelf that surrounds it encodes **form** — Scriptura, Ius and Preces
are all kinds of text — so form is the axis that keeps the set consistent.
On that axis the line is **synthesis against occasion**: works that gather
scattered teaching into an ordered whole and are read _through_, against
dated acts issued once and cited _singly_. The CCC, its Compendium and the
CSDC are the first; encyclicals and CDF instructions are the second.

Three confirmations already in the codebase:

- **Identical address shape.** `/doctrina-socialis/{n}` and
  `/doctrina-socialis/caput/{n}` mirror `/catechismus/{n}` and
  `/catechismus/caput/{n}`. Both are numbered-paragraph reference works
  with a chapter-level reading unit. The Code is cited by canon and the
  documents by section; neither matches.
- **The same component, said out loud.** `doctrina-socialis/+page.svelte`
  opens by calling itself "the same outline grid `/catechismus` draws, with
  ONE work column instead of two."
- The CSDC was written for formation — a systematic presentation for
  teaching, which is what a catechism is on a subject-restricted scale.

An earlier draft of this grouping used the **origin** axis instead, on the
evidence that exactly three work types in `manifests.json` carry
`promulgated`, `pontiff_or_council` and `document_kind` — `document`,
`social-doctrine` and `canon-law` — while every other type has all three
null. That observation is true and is still worth knowing (it is the line
the pipeline drew before anyone asked the question), but it is an origin
argument imported into a form-sorted shelf, and mixing the two is what
produced three different answers. Recorded so the reasoning is not
re-derived.

Two costs of the move, both real:

- **Two works are called "the Compendium."** `nav.compendium` is the
  Catechism's; `socialDoctrine.landing.title` is _Compendium of the Social
  Doctrine of the Church_. Different shelves keep them apart today; one
  shelf puts them one click apart. Inside Learn the CSDC must never be
  labelled bare "Compendium" — always "Social Doctrine" or the full title.
  This is a copy discipline, not a code problem, and it is the price of the
  move.
- **`/catechismus` is a _paired_ two-column index**, CCC against Compendium
  through `toc-pairing.ts`, which refuses to pair when division counts
  disagree. The CSDC pairs with nothing, so it cannot join that table; it
  needs its own one-column block below it, in the idiom
  `doctrina-socialis/+page.svelte` already draws. The landing page becomes
  two things instead of one clean paired outline.

The shelf keeps the name "Catechismus" though it holds a work that is not a
catechism, and there is precedent directly beside it: Scriptura already
holds `commentary.haydock.en` and `bible-intro.en`, neither of which is
Scripture. A shelf is named for its flagship and holds what belongs around
it. Renaming it to something literal like _Doctrina_ would be more accurate
and would cost the most recognised word on the site after "Bible" — which
§5, who was told to "read the Catechism", needs to see.

## The three ways in

The bar serves one rung of a ladder. Naming all three is what keeps the
next feature from being aimed at the rung that is already solved.

| Entry           | Who arrives this way                                | Surface                                       | State            |
| --------------- | --------------------------------------------------- | --------------------------------------------- | ---------------- |
| by **question** | §1 layperson, §5 OCIA candidate                     | nothing                                       | `PLAN.md` gap 2  |
| by **address**  | §7 seminarian, §4, §6, §2's second step             | `JumpBox`, canonical URLs, the xref apparatus | excellent        |
| by **date**     | §2 the priest — and anyone wanting today's readings | `/calendarium`, general and national          | built 2026-09-03 |

**That row moved in a day, and it is the only one that has.** §2 was the
reader `audiences.md` said the site "cannot answer at all"; the site now
answers the question that persona actually asks first — what day is it,
and what rank — for the general calendar and for every national calendar
GCatholic publishes. What is still missing for that reader is the second
half of the question (the readings), and two pieces of plumbing that have
nothing to do with the calendar's correctness: the day appears on no page
a reader lands on by default, and `/calendarium` is in neither the sitemap
nor an `hreflang` cluster (§What must change). A date entry nobody can
arrive at by date is half-built.

Two things follow that no amount of reorganizing can substitute for.

**Reorganizing cannot serve §1 at all.** Their problem is not which shelf —
it is that they hold no address. `suggest.ts` says in its own header that it
is deliberately not a full-text search, so a reader who types a sentence
gets nothing and learns the site cannot help them. Until gap 2 exists, the
cheapest partial answers are the two below.

**The Compendium has no front door.** `site/src/routes/catechismus/compendium/`
holds `[n]` and `caput/[n]` and no `+page.svelte`. Its questions are
reachable only by number, or through `/catechismus`'s paired outline where
they appear as counterparts to CCC divisions. So the one work
`audiences.md` names as written "for exactly this reader" and complete in
ten languages **cannot be browsed as questions at all** — which is §5's
finding restated as a missing file. Under this design `Learn` promises
exactly what that page would deliver, which makes it the highest-value
small build on the board.

**Plain-language subtitles are the other cheap answer.** §5 stops at the
vocabulary of the corpus, and the fix is a sentence per shelf saying what
it is and who it is for. The idiom exists: `canonLaw.landing.tagline` reads
"The law of the Latin Church, in 1,752 canons across seven books."
Extending that to every shelf and printing it on Library and on the four
doors is a handful of strings per dictionary and no new machinery.

## Liturgical scope: calendar built, lectionary as references, missal no

`audiences.md` §2 asks for this to be "a stated exclusion rather than an
unnoticed one." It is three decisions rather than one exclusion, and the
first of them has been taken and executed.

**Calendar — built, 2026-09-03.** The reasoning this section gave held:
a liturgical calendar is computed, not scraped, so there is no rights
position to negotiate, and it is the _good_ direction of the Doré lesson
in the root `CLAUDE.md` — a genuinely pure function of a year, which
re-deriving cannot silently move. It went where this section said it
would, `site/src/lib/calendar/` and not the corpus.

Two things about the shipped calendar are worth carrying back into this
document, because both bear on the rest of it.

- **The "which calendar" question was not answered the way this section
  framed it.** It offered a choice between shipping the General Roman
  Calendar and inheriting per-conference variation. What shipped is
  neither: the general calendar plus a **layer** per country, for every
  country GCatholic publishes one for, with each layer admitted only once
  a day-by-day oracle agrees with it — the rest held in `national/held.ts`
  with the count of days each still differs on
  (`site/docs/calendar.md`). The choice was false
  because it read national propers as a variant of the calendar rather
  than as data over it. That generalises: the exclusion list at the foot
  of this document should be read for the same mistake.
- **It is not reachable by date from anywhere a reader lands.** The date
  is `?d=`, correctly (a date names no citation and is not a chrome path),
  but the home page has no Today block and `/calendarium` is in no
  `hreflang` cluster and no sitemap. The engine is the part that was hard
  and it is done; what is left is navigation, which is this document's
  subject.

**Lectionary — in scope as references, not as readings.** The rights
problem in a lectionary is entirely in the _text_ of the readings, which
every conference licenses separately and enforces. The _schedule_ is a
different artifact: a table mapping a day to its pericopes. The site can
render that table through its own editions, and the machinery is already
built — `refparse.ts`, `refs-grammar.ts`, the book tables, and a
versification converter that already handles the Neo-Vulgate against the
Clementina, which is otherwise the hardest problem here. **A lectionary of
references is a list of citations, and this site is a citation resolver;**
it is the best available use of what exists. The cost is editorial and must
be stated on the page in the colophon's voice: the same pericopes, not the
translation read aloud in any given parish. Two sourcing notes — the _Ordo
Lectionum Missae_ is the universal reference and the defensible choice, and
while the underlying facts are not copyrightable a compiled _dataset_ of
them can carry its own licence, so where the table comes from matters even
though what it says does not.

Architecturally it is not scraped, so `raw/` means nothing for it. It is
the same species as `oracles/` in the corpus repo — an editorial table
nothing regenerates, tracked, treated as write-once. The root `CLAUDE.md`
already describes that slot.

**The calendar shipped with this exclusion stated, and it left the lookup
key behind.** `site/docs/calendar.md`
gives the reason in the same terms used here — the readings are a work the
corpus does not hold, and printing citations would be asserting a table
nobody here has sourced — and the page stops at the cycle letters. Those
letters are the point: a lectionary table is keyed by the day and its
cycle, and `/calendarium` already computes the Sunday cycle, the weekday
cycle and the psalter week for any date. So what remains is only the table
itself. The work is sourcing it, not joining it to anything.

**Missal — out of scope, and stated.** The rights are unresolvable rather
than awkward: ICEL holds the current English translation and licenses it
tightly, every vernacular belongs to its conference, and the Latin _editio
typica_ is LEV's. There is no public-domain modern Missal. The 1962 Missal
is out of copyright but shipping it is a statement about which form of the
Roman Rite the site is for, which is a far larger editorial claim than
anything on the site today. It is also off-model twice: it is not on
vatican.va in scrapeable form, and a Missal that looked usable _at_ Mass
edges toward implying liturgical approbation, which `/colophon` explicitly
disclaims and which `audiences.md` §9 exists to catch. What can be taken
cleanly is the **GIRM** — a Vatican document, in the corpus's existing
genre, on the Magisterium shelf, no new machinery.

**Why the date axis outranks search despite `audiences.md` ranking §1
first**, and why that judgment now has a measurement behind it. The
argument was that §2 is the one reader the site "cannot answer at all" and
that the fix is far cheaper than a full-text index — which the calendar
then demonstrated by landing in a day, where gap 2 has been open since the
project began. The larger reason stands and is still judgment rather than
measurement: "today's readings" is a **daily-return** behaviour and
nothing else on this site has one, every other use being episodic — arrive
with a citation, read, leave.

## What must change, and what must not

**Routes do not move.** `/scriptura`, `/catechismus`, `/documenta`,
`/doctrina-socialis`, `/ius-canonicum`, `/preces` and `/doctores` all stay
exactly where they are. This is a bar change plus two new pages. Grouping
is display and addressing is identity, and `+layout.svelte` already holds
those independent. Moving a reading address would also drop every bookmark
that names it — the lesson `migrateBibleHref` records from the Bible slug
change.

**One new chrome path, and two that are already live and missing.**
`/bibliotheca` does not exist yet and qualifies by the stated test in
`site/CLAUDE.md` — every word on the page is the interface — so it is a
language-prefixed `hreflang` cluster plus sitemap, route manifest and
worker entries.

**[built differently]** The omission turned out to be worse than a missing
cluster, and the fix split in two. `isCanonicalPath` reads a SECOND table,
`STATIC_PATHS`, and it is that one that decides whether a URL exists at
all — so `/calendarium` and `/ius-canonicum`, in neither table, were
answering **404 with the app's own not-found UI** on every cold load and to
every crawler, while client-side navigation into them worked perfectly.
Both are in `STATIC_PATHS` now and a test walks `src/routes/` so the next
one cannot be forgotten. But only `/ius-canonicum` and the new
`/bibliotheca` joined `CHROME_PATHS`: a cluster claims a page is written in
37 languages, and `/calendarium`'s 44 `calendar.*` keys exist in three
dictionaries. It joins the day it is translated. `/catechismus/compendium`
is held out by the same rule at fourteen.

The other two exist as routes and are absent from `CHROME_PATHS` anyway.
`route-manifest.ts` lists nine paths; **`/ius-canonicum` and
`/calendarium` are neither of them**, though `/ius-canonicum`'s twin
`/doctrina-socialis` is there and `/calendarium` is in the nav bar. Both
therefore take no language prefix, sit in no `hreflang` cluster, appear in
no sitemap row, and get no per-page `<title>` or description from the
worker: `route-titles.mjs` keys its map off `CHROME_PATHS`, so neither
page is named at the edge even though `canonLaw.landing.title` and
`calendar.title` both exist to name them. Two omissions of the same kind,
each dating from the day its page landed, and each fixable in a line —
which is the argument for fixing them now rather than as part of any of
this.

**One i18n trap.** `nav.socialDoctrine` and `nav.canonLaw` are not
nav-only: each is also the breadcrumb on every reading page under its work,
the `workColumns` label on its landing page, and the section heading in
`/signata`. Shortening either label for the bar renames all four.
`socialDoctrine.landing.title` and `canonLaw.landing.title` already hold
the full names, so the three non-nav call sites should be repointed at
those first. `scripts/export-section-names.mjs` also reads `nav.*` for
every language to feed the jump box, so a shorter label is a smaller
haystack there.

## Defects this design does not fix by itself

All six are live on 2026-09-04 and none of them is caused by the design;
two would be swept up by rebuilding the pages named, and four would not.

| What                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Where                                                                           | Swept up by this?          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------- |
| Home page's Magisterium rows link `/documenta#<pontiff>`, and that page has had no anchors since 2026-08-31                                                                                                                                                                                                                                                                                                                                                             | `+page.svelte`, `documenta/+page.svelte`                                        | Yes, when home is rebuilt  |
| `CONTINUE_TYPES` omits `social-doctrine` and `canon-law`                                                                                                                                                                                                                                                                                                                                                                                                                | `+page.svelte`                                                                  | Yes, in Library            |
| `/ius-canonicum` and `/calendarium` are both absent from `CHROME_PATHS`, so neither is in a language cluster, in the sitemap, or named at the edge                                                                                                                                                                                                                                                                                                                      | `route-manifest.ts`, `route-titles.mjs`                                         | No — fix separately        |
| The calendar's forty-nine `calendar.*` keys exist in `en`, `la` and `pt` only, so thirty-four interface languages read the newest door entirely in English                                                                                                                                                                                                                                                                                                              | `site/src/lib/i18n/`                                                            | No — a decision, not a fix |
| The jump box completes neither new work: `SECTIONS` has no `/doctrina-socialis` or `/ius-canonicum`, and its `CIC` docblock still says the corpus holds no canon law                                                                                                                                                                                                                                                                                                    | `suggest.ts`                                                                    | No — fix separately        |
| The doctrinal office is reachable in no single click: CDF and DDF are two author chips for one body renamed in 2022, the `cdf-*` kinds are six more, and a document's author is plain text rather than a link to its siblings. **[built differently]** — the facet folds now (`documentAuthorKey`), which is one click; the author stayed plain text, because a link into a facet needs the filter in the URL and `/documenta` keeps its filters out of it deliberately | `documenta/+page.svelte`, `document-labels.ts`, `documenta/[slug]/+page.svelte` | No — fix separately        |

## What this deliberately excludes

- **A site-wide subject vocabulary.** `site/document-tags.json` holds a
  closed, curated vocabulary (fifty-eight terms on 2026-09-03) that
  facets one section. Extending it across CCC divisions, canons and
  Compendium questions would give the site a topical index — which is also
  `PLAN.md` gap 5's marginal concordance generalised, and the one artifact
  that would collapse the question and work rungs of the ladder into a
  single surface. It is a corpus-wide vocabulary project, not a navigation
  change, and belongs in its own `PLAN.md` row.
- **Full-text search.** `PLAN.md` gap 2, unchanged and still the largest
  gap in the project. Named here only to say that none of the above is a
  substitute for it.
- **A nav dropdown.** The bar is a row above 720px and a modal `<dialog>`
  sheet below it, and there is no submenu anywhere on the site. Library is
  a page precisely so that no submenu has to be invented.
- **Renaming `Preces` to `Liturgia`.** Half the condition is now met — the
  calendar exists — and it is still excluded, because the calendar is its
  own door in this bar rather than something to fold into a category, and
  "Prayers" is a high-recognition word that should not be buried under one.
  Revisit if the lectionary lands and `Preces` starts holding three
  different kinds of thing.
- **Per-rite variation** — the Ambrosian calendar, the 1962 calendar.
  ~~Per-conference variation~~ is no longer excluded and no longer
  hypothetical: it shipped as a layer per country, which is why the
  crossing-out is left visible rather than edited away. An exclusion that
  turned out to rest on a category error (a national proper is data over
  the calendar, not a variant of it) is worth keeping legible next to the
  ones that have not been tested yet.

## Open questions

1. Whether Today carries a compact continue-reading row, or whether that
   lives only in Library (§The home page).
2. Whether `Learn` survives thirty-seven dictionaries as an imperative
   (§The bar).
3. Whether `/doctores` becomes listed on the Library page ahead of the
   Summa's quality pass, with its caveat in a sentence beside it.
4. ~~Sequencing: the Calendar item cannot ship before the calendar does.~~
   Answered by events on 2026-09-03 — the calendar shipped with its bar
   entry, and the question was never live. What replaces it: **the bar is
   at seven and this design wants five, so which two go first.** Learn
   (relabelling `/catechismus`) costs one string per dictionary and
   removes nothing; Library costs a page that does not exist and removes
   three items at once. The cheap one does not shrink the bar and the one
   that shrinks it is not cheap.
5. Whether Today's readings wait for the lectionary or Today ships without
   them. The block is buildable now (§The home page) and would answer §2's
   first question immediately; shipping it twice is a small cost against
   leaving the only daily-return surface unreachable from the home page
   for as long as sourcing a lectionary takes.
