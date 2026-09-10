# Counting the library

`/bibliotheca/census`, and the one derivation behind it. `scripts/census.mjs`
writes the numbers, `src/lib/census.ts` reads them back,
`scripts/language-coverage.mjs` gates the deploy on them, and
`site/docs/references.md` is where the cross-reference index they count comes
from.

**One derivation, because a count is right until somebody knows better.** Nine
of these numbers were already published — `llms.txt` interpolated them, off
`routeManifest`, `works` and `apparatus` separately — and each was correct. A
page that counted the same things from `corpus.ts` would be a second reading of
a corpus the first one had already read, and the first of the two to fall
behind would fall behind in silence, because nothing about a stale number looks
wrong. So `llmsFacts` projects the census now, and the file for machines and the
page for readers cannot disagree about how many documents there are.

**A number must be derived, or it does not go on the page.** The repo's own
rule against inventory counts, one step further out: those rot in prose because
nothing recomputes them, and this page exists to be the place that recomputes
them. `censusFact` throws for a fact that is not there, so renaming one fails
the build rather than shipping the word `undefined` inside a published
sentence.

**A count is nobody's property, which is why the page may exist at all.** How
many editions of the Catechism this library holds is a fact about the library,
not about the Catechism. `scripts/apparatus.mjs`'s rule for what may be
published, unchanged.

## Every number is a fraction, or it is one of four

The page opened as a 37-row ledger and read as noise — correctly, and not
because 37 is many. **Every row answered "how many" and none answered "out of
what".** `Canons 1,752` is unanchored: a reader cannot tell whether it is good.
`The Code in 7 of 40 languages` is the same shape of fact and is immediately a
judgement. So the inventory went, the four scale figures that survive are one
sentence, and what replaced the table is the coverage matrix.

**An inventory says how big; a fraction says how far.** That is the editorial
rule for this page, and it is what to test a proposed row against.

**A shelf's numbers are a sentence, and the apparatus is why.** As six figures
under a total, four of them summed to a fifth of it and read as broken. They
were not: a cross-reference is an EDGE and those counts were its ENDPOINTS —
104,017 references run from 29,908 citing places to 25,843 cited addresses, and
the two endpoint totals never were parts of the first. Nothing on the list said
so. A column of figures can only invite arithmetic; a sentence can state a
relation, and `census.prose.apparatus` reads "from X places to Y addresses",
which cannot be added up wrongly.

**Every fact has a placeholder and every placeholder a fact**, asserted both
ways in `census.test.ts`. A fact with no placeholder is a number the build
still computes and no longer publishes — `llmsTxt`'s quiet failure one surface
over; a placeholder with no fact reaches a reader as the literal `{documents}`.
Neither can be seen by reading the output.

## A line that qualifies goes behind the `i`

Three of them — how a cell of the matrix reads, the two rules a ranking is
counted by, and that every number here is derived at build. Each is the `info`
glyph beside the heading it belongs to, over a native popover with
`role="note"`: `DayReadings`' arrangement, which is `ArtFigure`'s, and the
site's one answer to a sentence of small print.

**What goes behind the glyph is a METHOD and never a NUMBER.** Those three say
how the page was counted, and a reader who never presses one reads every figure
on the page correctly and only lacks the argument for it. `census.citersLede`
therefore stays visible: it carries the two totals that keep the column under it
from being read as short of the ledger's, and a fact behind a control is a fact
most readers do not have.

**The glyph is on the HEADING, not in a line under it.** The method's two
clauses change what the ranking means, so they have to be reachable from above
the table — where three lines of small print between a heading and its own table
are read once and skipped at every later visit.

**Paper gets all three unconditionally**, under what each qualifies. A popover
never prints — top layer, and closed besides — and the printed page is the one
copy whose reader cannot press anything. `aria-hidden`, so a screen reader does
not meet each note twice.

## The matrix

One row per work, one column per interface language, one cell per pair: how
much of what that work offers a reader of that language can reach.

**It is headed "Multilingual coverage"** where its neighbours are named for the
question they answer ("What is here", "What is cited"). This is the one section
a reader arrives looking for by name — does this library have my language — and
the heading it replaces described the axis without naming the subject.

**One grid and not eight figures.** Drawn per shelf beside each shelf's
sentence, the rows lose the only thing worth drawing them for — the comparison
DOWN a column. In one grid, sharing one language order and one scale, they fall
into a staircase and the page argues without a word.

**The language order is derived, not chosen** — the sum of each language's
eight fractions — because any hand-made order is an editorial claim about which
languages matter, which is what a page of measurements must not make. Ties
break on the tag, so a rebuild produces the same file.

**All forty languages stay in, including the ones that carry nothing.** The
empty tail is the finding: it is `PLAN.md` gap 15 drawn rather than argued, and
a matrix listing only the languages with something in them would be the page
flattering the library.

**A row per WORK, not per shelf**, and the Catechism is the one place the two
orders differ: its shelf holds two works whose language sets differ by five, so
a single row over their union would report a coverage neither work has.

**The cell is a rising bar, not a tint.** Fill is a geometric channel, so the
matrix survives `data-mono` — where the whole palette collapses to one grey —
with nothing lost. `site/docs/references.md` draws that line for the family
marks, and this is the case it was drawn for: here the fill IS the datum.

**The bar is ground lapis, and it was `--color-text-muted` first.** That token
is what this page sets its secondary prose in, so three hundred cells of it read
as a matrix switched off rather than a matrix full, and the staircase the whole
arrangement exists to draw was the faintest thing on the page. It takes
`--color-apparatus`, the hue the palette already spends on citation — a token
and never a literal, which is what carries it through the five appearance axes
and flattens it to grey under `data-mono`, where the fill still carries every
datum.

**The cell under the pointer takes the accent, and so do its row and column
headings.** A readout above the grid names the work, the language and the
percentage. One of the three cannot be done in CSS — a column heading is not an
ancestor, a sibling or a descendant of the cell below it — so the hovered cell
is state.

**Nothing about that hover may change a text metric.** The headings went bold
for one revision, which is the defect `/calendarium` records one page over: a
bold heading is wider, so the first column grew, all forty language columns
moved with it, and the cell being pointed at slid out from under the pointer.
The readout is held to one line by the same rule and its height is reserved
whether or not it says anything; it carries no `aria-live`, a pointer readout
being forty interruptions a row where each cell already reads its own value.

**What replaced the weight is colour and nothing else.** A painted underline
stood under the two lit headings for one revision and was a second mark for a
state the colour already carried: a cell, its row and its column all turning
accent is one mark in three places, where a rule under two of them is a
different mark on the same event.

**Every row carries the glyph its work already has, in the accent.**
`CENSUS_ICONS` takes them from `shelves.ts` and `/schola` rather than choosing
again, which is the rule `shelves.ts` states for the catalogue and this is a
third surface obeying it: a reader who has learned a mark on either page has
learned it here. It is a map and not a field on `Shelf` because the key spaces
differ — the catalogue has one card for the Catechism and its Compendium, and
the matrix has a row for each. Only the two entries that name no shelf needed a
mark of their own, and neither is new writing: books on a shelf for the
collection, and `link` for the apparatus, a cross-reference being a link.

**One accent and not a colour per work**, which is `/schola`'s finding: past a
certain count a colour stops picking a row out and becomes the page's texture,
and there are more marks here than on that page. So the page has exactly two
colours — the accent on what is named, lapis on what is measured.

## The three decisions the rankings rest on

Each changes the answer, and each has a corpus condition behind it. All are
stated on the page above the tables, because a reader who meets them afterwards
has already read the tables wrongly.

**A ranking counts distinct citing places, not stored rows.** The index holds
one row per (citing address, cited address) pair, so a work citing
`Matt 25:31-46` lands on sixteen verses where one citing `Matt 25` lands on
one. Counted as stored, the most-cited chapter in the corpus is Matthew 25 —
a fact about how long the passages quoted from it are. Counted as citing
places, Matthew 25 is sixteenth, and Matthew 5, Romans 8 and John 1 lead.
`citerKey` is the identity, the same one the index was built with.

**An edition's own footnotes are not counted.** A ranking that counted them
would report which verses Haydock glossed — they outnumber everything else. The
"Cited in" panel starts commentary switched off on the same measurement
(`site/docs/references.md`); here it is left out rather than offered behind a
control, because a ranking has no per-row filter to fall back on and a number
that changes when a toggle moves is not a rank.

**And the breakdown under the ranking counts what the ranking counts**, which
is a second decision and the one that took a row off the page. Counted over
every reference, `annotation` headed that list — the largest number in the
section, for a family no table above it counts, and a row can only be read as
bearing on what it is printed under. `countsTowardsRank` now gates the tally
that feeds it, so the kind cannot come back through a later edit that forgets
why it went.

**Dropping it opens an arithmetic, and `countedReferences` closes it.** The rows
sum to a little over half the total the ledger states, and a column of counts
under a stated total it falls short of is the reading this page was rebuilt to
stop. So the census derives what the rows sum to and the page says it: N of the
M cross-references count towards the ranking, the rest set aside by the two
rules above it. Naming the difference is what a row for it was doing badly.

**A work citing itself is not counted either — the same rule one work in.**
Lumen Gentium §8 citing §22 is an internal cross-reference, and counting it
puts every long document at the top of a table about how often the rest of the
corpus cites it. The Summa is where it decides the outcome: all but a fifteenth
of its citers are the Summa, and dropping them turns a ranking of Thomas's own
back-references into a ranking of the questions the magisterium reaches for —
I q1, I q2, II-II q184.

**A ranking is cut on the count and never on the rank.** Thirteen Catechism
paragraphs are cited exactly three times, so a `slice(0, 20)` would publish
four of them and drop nine cited exactly as often. `topOf` takes whole bands
while the next one still fits, so a table comes out shorter than the limit
rather than arbitrary at the bottom — which is why neither the Catechism's
ranking nor the Summa's fills its hundred rows.

**Twenty was a screen, and the file was enforcing it.** The argument for
cutting at twenty was that a ranking is read down and a table longer than the
viewport stops being one — an argument about what meets the eye at once, which
`RANK_PAGE` is now where it lives. `RANK_LIMIT` is a hundred, which is where the
tail goes flat: below it the difference between one row and the next is a single
citation, and bands one deep are a list that happens to be sorted. It takes
`census.json` from 5.8 KB to 18.6 KB, in a file one page fetches on demand.

**A page boundary may split a tie where the table's own cut may not**, and the
two are not one rule doing different things. `topOf` refuses to split a band
because the rows under the line would be unpublished — four of thirteen
paragraphs, and no way to learn of the nine. Rows on the next page are
published; turning to them is one press.

**The list carries `start` and the counter is reset off the same number.** The
rank IS the content, so a second page announcing its first row as "1 of 20" is
saying something false rather than merely losing it — and an `ol start` is the
half a screen reader reads while a CSS counter is the half a reader sees, so
both have to move.

**Previous, where you are, next — and not a strip of numbered pages.** The
merged table is cut at `RANK_LIMIT` however many chips are on, so it is five
pages at most, and a reader turning them is reading DOWN a ranking: page four is
not a destination the way a chapter is, and a reader who wants one particular
work has the jump box. The position is stated in words because a reader who has
scrolled down the list cannot see the numbering start.

**A chip resets the page, and no effect watches the table.** Pressing a chip
changes what the table CONTAINS, so page four of the old one names nothing in
the new and the section goes blank; `toggle` is the only thing that can change
the table's length, so it is the only place that says so. An effect over the
merged rows would also fire on a language change, which renames every row and
moves none of them.

## One ranking, and the chips narrow what is in it

Five tables became one on 2026-09-08. They ranked five different units and a
reader comparing them had to hold five scales at once; merged, the rows are
comparable and the chips do the separating.

**Merging the stored tops is the EXACT top of the union.** A row in the merged
top hundred is in its own kind's top hundred, its kind's list being a subset of
the union — so nothing the merge needs was left out of the file. And a band the
merged cut can afford is one that kind could afford too, the merged list having
at least as many rows above any level. That is what makes a filter over kinds
safe, and it is a property of the KIND filter alone.

**The chips narrow what is ranked, not who did the citing.** `CitedBy`'s filter
narrows by citing family and this one cannot: those counts were summed at build
time, so re-ranking a stored top hundred by one family would publish that
family's real top only where the two happen to agree. Filtering by family means
a cut per subset, which is a different file and not a control. The drawing is
that panel's — on is plain, off is struck through — because a reader meets the
same control doing the same job on two pages.

**Books start switched OFF, the one kind that does**, and it is `CitedBy`'s
commentary rule at a different scale. A book's count is every place citing any
chapter of it, so it is an AGGREGATE of the chapter rows beside it: Matthew's
2,110 contains Matthew 5's 321. Measured, the top twenty of everything is
eighteen books and two documents, with the Catechism and the Summa unreachable —
the table answering itself twice. Switched off it opens on Lumen Gentium,
Gaudium et Spes, Romans 8 and Matthew 5, and one press puts the books back.

**The cut is written twice and the two are pinned against each other.** `topOf`
cuts the builder's map of citer sets under Node; `mergedRanking` cuts rows
already named out of the reader's own edition. They cannot be one function, and
a page that split a tie the file did not would be arbitrary at the bottom in
exactly the way the rule exists to prevent — so `census.test.ts` runs both over
the same counts.

**A row is marked and not labelled.** The kind is the glyph of the work it
belongs to, with the name behind it for a screen reader; set out as visible text
it was the kind repeated down twenty rows.

**The Summa's kind is named for its SHELF** — `doctores.landing.title`, which
is what `CENSUS_SHELF_KEYS` and `CITER_KIND_KEYS` already call it. Four of the
five names are sections of the library, and one naming a single book among them
reads as a different kind of thing; `rankLabelKey` is the map, and
`census.rank.summa` went with it, a fifth string saying the same about a
narrower subject.

**And a row names its own work, because nothing over it does any more.** The
Catechism's paragraphs were `¶1883` and the Summa's questions a bare `I-II 184`,
which is right under a heading reading "Paragraphs of the Catechism" and wrong
in a merged table. `citationFor` writes both now — the site's one notation, out
of the tables `/schola` teaches from — so they read `CCC 1883` and `STh I-II,
184`, and the siglum is `ccc.abbrev` in the reader's own language rather than
three letters spelled here. A page that teaches `CCC 1234` and ranks `¶1234` has
taught nothing.

## What is cited and not held

The other direction of the same index, and the one thing four rankings of what
the library HAS cannot say: which works its apparatus reaches for and cannot be
given. `buildCitationXrefs` already parses every citation against a grammar that
recognizes far more works than the corpus holds, so this was a measurement lying
on the floor of that function.

**A series siglum is a LOCATOR and not a work, which is what this section got
wrong first.** It headed itself with `Patrologia latina`, `Patrologia graeca`,
`Denzinger` — every one of them a critical EDITION, two hundred volumes of
somebody else's shelf — so it was answering "which books are these texts
printed in" where the reader had asked which texts. Nobody ingests Migne. The
text is named beside the locator in the same clause and always was, so both are
knowable and the section prints two lists: whom the library is cited for, and
where those texts are printed.

**The name fragments across languages, and the locator is the oracle.**
Augustine arrives as `St. Augustine`, `Santo Agostinho`, `Sant'Agostino`,
`Sanctus Augustinus`, `S. Agostinho`, `S. Agustín` — 1,811 spellings over some
600 people, so ranked raw the most-cited Father is whichever one has the fewest
translations. `PL 38, 1134` is a volume and a column in a book nobody here
published, so it is the same string in every language and every edition citing
it names the same man. That is `book-forms-oracle.mjs`'s method with the locus
supplied by the citation instead of by the paragraph number.
`scripts/patristic.mjs` carries the reading and the four rules it cost.

**A head is read per CLAUSE.** A citation chains works with `;`, and read whole
its first name attaches to every locator in it — `Concilium Vaticanum II … ; cf
Sanctus Hieronymus …: PL 24, 17` taught the clusterer that the council and
Jerome were one man, and through that hub Justin merged with Jerome and Clement
of Rome with Vatican II. `citationClauses` makes the cut and is the grammar's
own, so the two cannot drift.

**The parallel footnote is the second channel, and the stronger one.** A
locator only links two editions that happen to cite the SAME passage, so
Gregory of Nyssa stood as `St. Gregory of Nyssa` and `S. Gregorio di Nissa` and
Augustine in four rows across English, Italian, Polish and Slovene. `citerKey`
is an address and an address does not vary by language, so `ccc 27` note 1 is
one note in all nine Catechisms and the men named in it are one man. Two shared
notes are enough where a locator needs three, the evidence being that much
better. It halved the table.

**An edge needs three distinct locators.** One shared locator is a coincidence a
misprint can manufacture, and the relation is closed transitively, so a single
bad edge chains everything: at one, 4,450 of 6,878 heads came out as a single
Augustine. At three, Tertullian and Origen part and Jerome stands on his own.

**Every sighting is evidence and only some are counted.** A spelling is linked
to another by the locators they share, so narrowing the input to the citations
that RANK throws away the co-occurrences the clustering runs on — it left
Cyprian as two rows, one Latin and one Italian, and Chrysostom as three. The
builder emits every sighting and flags which are an absence.

**The display name is the English edition's where there is one**, then the
un-shouted, then the most frequent. Ranked on frequency alone the page printed
`S. CYPRIANUS` and `Sant'Ireneo di Lione` at the head of a page whose every
other word is English — the Latin and Italian apparatus being the
sigla-heaviest in the corpus.

**This ranking carries a floor the others do not.** Every other ranking on the
page names an ADDRESS, which either exists or does not; a row here is a
cluster, and a cluster is only as good as the co-occurrences that built it. A
name seen twice has had almost no chance to meet another spelling of itself, so
down there a row is as likely to be a second spelling of a row already in the
list — `Severiano de Gabala` beside `Severiano di Gabala` — as a work in its
own right, and what the reading cannot filter collects at the same depth. The
band cut alone published ninety-nine rows, of which the last fifty rested on
one or two citations apiece.

**It is not a ranking of works.** `Sermo` is three hundred different sermons and
`Adversus haereses` is written `Adv. haeres.` as often as not, so a work-level
table would be near-duplicate rows and a judgement per row. The author is the
grain somebody acquires a corpus at, and the grain the locator can check.

**A row carries a name and no address, and that is the whole content of the
section.** Every other ranking on the page links; this one cannot, because the
link is the thing that is missing. So its rows carry no shelf mark either —
there is no work here to have one — and they are set as plain names rather than
as the rows above with the anchor quietly absent, which would read as a list of
broken links.

**It is not a sixth chip on the ranking above**, and the reason is the one that
merged the five. Those rank addresses a reader can open, on one scale, which is
what makes their rows comparable. An absence has no address by definition, so a
row for it in that table would be the only one that did not link — a different
question wearing the same clothes.

**A row's identity is a NAME, decided in the sigla tables and not in the
census.** `ABSENT_WORKS` in `refs-grammar.ts` holds one constant per work and
every table that abbreviates it references that constant, because the expansions
are tooltips written for one language's reader and are not the same words:
keyed on the expansion, the Holy See's gazette came out as two rows of 1,513 and
1,213, Migne as four, Denzinger as two. A table of aliases beside them could
only have detected that after the fact.

**`siglumStanding` asks the corpus, never the table.** A slug in a sigla table
is a claim, and a claim about what is held goes stale in silence: the first run
of this ranking offered Familiaris consortio and Mulieris dignitatem as works to
acquire, both of them in `build/`, because Malagasy's `FM` and two `MD` entries
had been written before the exhortation sweep. **The ranking is therefore also a
check on the table** — and the one that catches the case a unit test cannot,
which is a work the corpus gained after somebody wrote down that it had not.

**A row leaves the list of its own accord the day the work is ingested**,
including a row that got there through an unhonoured slug. Nobody maintains it.

**What names nothing is counted and never ranked.** 31,525 distinct citation
strings resolve to no address and 94% of them occur exactly once — an unexpanded
`Ibid.` in a dozen languages, a synod `Propositio`, a line the parser stopped
short of. Ranked by their own text the head of that list is `Ibid.`, and the
page would publish it as the most-cited work this library lacks. So the residue
is two integers, and `census.absentLede` prints them: without that sentence a
short list of named works reads as the whole of what is missing, and it is a
small part of it. Same arithmetic `countedReferences` closes one section up.

**The two halves of the residue are kept apart because they are findings about
different things.** `ibidem` is a citation whose antecedent could not be carried
across a footnote run, which is a limit of the READING; `other` is a footnote
naming something the grammar has no table for, which is nearer a limit of the
CORPUS. Reported as one number they read as one defect.

**An absence is not a reference and is tallied apart from the four rankings.**
`tallyXrefs` counts a row into `references` and its address into
`citedAddresses`; doing that here would put the apparatus's edge count above the
number of edges the corpus has and its address count above the number of places
that exist. What it does share is `countsTowardsRank` — an edition's own
footnotes name Migne and Denzinger constantly, and a list of what to ingest next
that reported chiefly what Haydock read is the defect the annotation rule already
answered for once.

**`kindCountsTowardsRank` is that rule asked of a kind with no citer to hand**,
and `countsTowardsRank` delegates to it rather than the two testing the same
string apart. The residue is counted by kind because keeping a citer per
citation would be a megabyte to answer a question that is two integers.

**A siglum naming no work at all carries `names: null`** — `CDF` is a
dicastery, `off. lect.` an hour of the breviary. Collapsed into the same absence
as a work, the ranking would offer a Roman office as something to acquire.
`sigla-standing.test.ts` requires every entry with neither a slug nor a work to
declare one or the other, because a new bibliographic siglum added with an
expansion alone parses, glosses and renders exactly as its neighbours do — the
only thing it does differently is vanish from this ranking.

## Monitoring it

`scripts/language-coverage.mjs` writes `static/language-coverage.json` on every
sync, compares it against `scripts/language-coverage.baseline.json`, warns, and
`preflight-deploy.mjs` refuses the deploy on a loss. `npm run language:accept`
records an intended withdrawal as a diff.

**It guards a failure `reference-coverage.mjs` cannot see.** That one measures
the citations a work MAKES — how much of the printed apparatus the grammar
reads. This measures what a work OFFERS: whether a reader whose interface is
Portuguese has a Code of Canon Law at all. They fail independently.

**Nothing guarded it before.** `routeManifest` unions across editions, so
`/documenta/{slug}` stays a valid address while any language has it;
`workCount` is a scalar a swap leaves unchanged; and the census page draws
whatever it is given. A language could lose a work between two clean builds
with nothing said.

**The baseline is presence, not proportion**, and that is the whole design. It
records the SET of (work, language) pairs, never how much of each work a
language reaches. Recording the amounts would put a file in the tree that
churns on every ingest and needs accepting weekly — the exact noise a
regression has to stand out from. On presence it moves only when something real
happens, so the diff is worth reading.

**A set also catches a swap.** "8 languages" is still 8 after a build that
gained Polish and lost Portuguese, and the pair that went is the finding — so
the comparison is over pairs and the failure names them.

**A work missing from the report entirely reads as losing every language it
had**, which is the case that matters most: it is the failure the root
`CLAUDE.md` records for the lastmod ledger, where a `CORPUS_DIR` of symlinks
yielded zero works and two clean runs shipped an empty file.

**What it deliberately does NOT guard is completeness inside an edition** — an
edition present in a language but short of what its siblings carry. That was
measured when this was written and the corpus is sound at chapter, canon and
paragraph level; the documents carry a residue of 125 numbered editions under
90% of their fullest sibling, whose top is a handful of parse failures rather
than publishing facts. Recording it here would reopen the churn the presence
rule exists to avoid. The matrix SHOWS it as a partial bar, which is the right
place for it: information a reader can see, not a gate a build can trip on.

## Where it sits

**In `STATIC_PATHS` and not in `CHROME_PATHS`**, which is
`/calendarium/liturgia`'s arrangement and `route-manifest.ts`'s argument: it
must answer 200 to a cold load and a shared link, and it must not declare an
`hreflang` cluster in every interface language while its own `census.*` strings
are written in one. Its head is fixed and English in `STATIC_HEADS` for the
same reason, and `PLAN.md` sizes the promotion. `t()` falls back key by key, so
every interface renders it with its own chrome around English labels — and the
numbers need no dictionary.

**Eight of its ten names are keys the site already had.** A shelf here is a
shelf in `shelves.ts`, so it is named by whatever that shelf's own landing page
is titled by, and the citer breakdown reuses the nav keys the same way. Only
"The whole collection" and "The apparatus" name nothing on a shelf.

**It is fetched as a URL, not inlined.** One page asks for it, and a count
answers neither "does this address exist" nor "where does the text live", which
is `corpus-index.ts`'s eager/lazy line. Under `_app/immutable/assets` as
`.json`, so `sw-policy.ts` files it in the deferred tier with the rest of the
citation apparatus — cached on first read, never precached.

**Its registries come from `indexesForPath`'s `ALL` fallback**, because
`bibliotheca` is in no entry of `BY_SEGMENT`. The rankings resolve a book name
and a document title from render, so they need the Bible and document indexes
— and `index-priming.test.ts` cannot see that, since it scans what a page
imports from `$lib/corpus` and these readers are one module further in, inside
`census.ts`. A narrow entry added on the strength of what `/bibliotheca`
renders (`manifests` alone) would empty three of the five rankings and throw
nothing.

**A card at the end of `/bibliotheca`'s grid opens it, and it was a line under
the grid first.** The argument for the line was that a card would put a count in
the bed as though it were a work to read — true, and equally true of Bookmarks,
which has been a card there since the grid existed. What the line bought was a
way in that a reader scanning a bed of cards does not see.

**The card is a PROP on `ShelfGrid`, not a card the page appends.** That
component exists because `/bibliotheca` and the home page had each assembled the
catalogue and promptly disagreed about what it contains; a declared difference is
not that failure returning. The difference itself is real: how far the catalogue
reaches is a fact about the catalogue, and the home page offers a reader holding
no address a way in to the WORKS.

Its title and sentence are the census page's own, so it obeys the rule every card
there obeys — no entry in the catalogue writes a sentence of its own. That
retired `census.link`. It is still not in the footer's index: those entries are
wanted from every page, this one is about the catalogue and is one click from
it, and its label is English in a footer written in every language.
