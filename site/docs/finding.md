# Finding something

Four surfaces: the nav bar, the footer's index and `/bibliotheca`, which are for
a reader who has no address; the jump box, which completes one; and
`/documenta`, which filters a shelf. None of them is a full-text search.

## The bar is for the readers who use it least, so it is built for the others

`docs/research/audiences.md` splits readers on whether they arrive with an
**address** or with a **question**. The address-holders never touch the bar —
one types `can. 748` into the jump box, another arrives mid-corpus on a URL
somebody else wrote and never sees the header — while the question-holders are
"plausibly most of the traffic" and are the ones a bar of work names cannot
serve, because using it means already knowing which book holds the answer.

**So the bar names doors and not works**: Bible, Prayers, Library, Calendar,
Learn. It was one item per work until 2026-09-04, which is a rule with no end
state — seven items by the time the Code landed, and Denzinger, the Roman
Catechism, the Fathers and a second code each cost another slot. Under five
doors every future work lands inside Library or inside Learn.

**`Learn` is the one imperative among four nouns, and the mixed grammar is the
point.** It is the only label that explains itself to a reader who does not yet
know that "Catechism" is where one goes to learn — and the site already ships
that mismatch the other way, with "Magisterium" over `/documenta`. Each
dictionary takes whatever register its language puts on a nav item: an
imperative in the Romance languages, a verbal noun where an imperative would
read as an order.

**It pointed at `/catechismus` for one day, and that was a label doing work the
page behind it did not do.** A table of divisions is exactly right for a reader
who knows the outline and useless to one who cannot name a part — which is the
reader the word "Learn" was chosen for. `/schola` is the page it opens now: a
guide to what each work IS, what a citation of it looks like, and the orders for
reading the Church has set out. The
Catechism is therefore the one work here with no door of its own, and nothing
became unreachable — the guide's first row opens it, Library shelves it, and the
jump box completes `CCC 1`.

**Learn is LAST on the bar, not first.** It led on the argument that a newcomer
needs the leftmost item; what that missed is that the four before it are the
works themselves, so a bar opening with a page about the others reads as a
preamble to them. The home page mirrored that order in four doors of its own
until 2026-09-06, when the doors became the catalogue; the bar is the only list
of pages a reader meets on the way IN, which is one fewer place for two orders
to disagree.

## The footer names everything, which is what lets the bar stop at five

**The bar's end state is a width argument, and a footer has no width.** A bar is
one line read on the way through a page, so every work ingested would want a
slot in it and the answer had to be doors; the footer is read by somebody who
has reached the END of a page and is deciding where to go instead. The two are
not the same list at two lengths — they answer different questions, and the bar
keeps its end state precisely because the full list exists somewhere. Before
this the site had no surface naming every destination: `/bibliotheca` names
every WORK, and Learn, the Calendar and Bookmarks appeared on no single one with
them.

**Works and pages, which is the split `/bibliotheca` already draws** — a work is
text somebody else wrote and this site reproduces, a page is something this site
made. The works come from `visibleShelves()`, the catalogue's own call, so the
two cannot disagree and the footer inherits the gate: a link to a work a partial
sync did not carry is a door onto an empty index. The pages are written out and
deliberately not `NAV_ITEMS` minus its works, which would make the footer's
contents a consequence of an edit to the bar.

**`/colophon` is in the index; `footer.notEndorsed` stays in the imprint.** That
one-line disclaimer is the one-sentence form of `colophon.whatThisIsStanding`
and is short because the full statement is reachable from the same footer — move
the link out of the footer and the sentence has to grow. No Home entry: that is
the argument the bar already makes about the brand link.

**The imprint and the index take opposite ends of one band on the header's own
margins**, so the cross lands under the wordmark. Stacked and centred, as it was
first drawn, it had three axes that could not agree — a centred pair of columns
of unequal width does not put its text on the page's midline, and there was no
rule for any of them to be measured to.

**It cost three English strings and not one link.** Every name in it was already
written in all thirty-seven languages, because the footer invents no destination
the site did not already name; what was new is the two column heads and the
`<nav>`'s own accessible name, which had to differ from the header's or a screen
reader announces two landmarks called "Menu". The one entry that needed a
shorter name got `Shelf.navKey` — a card has a sentence under it and can afford
`Catechism & Compendium`, a column of bare links cannot.

## The home page is the three ways in, in the order they are needed

`docs/research/organization.md` §The three ways in names them — a reader arrives
**by date**, **by question**, or **by address** — and until 2026-09-06 the home
page held the first two and never said the third existed. So the notation this
whole corpus is addressed by was something a reader found out about by pressing
`/` on a hunch, and `/schola`'s citation column was the only page that taught it,
which is one click behind a door labelled for someone who does not know they
need it.

**The day, the catalogue, then the notation.** The order is the reverse of
expertise and is deliberate: the day is the only surface anyone returns to daily,
the catalogue is for the reader holding no address at all, and the specimens are
last because the reader who already knows `CCC 1234` types it into the box
without reading this page.

**The specimens are inert, and three of them, and the section describes a
control rather than opening one.** All three follow rules stated elsewhere and
are not new judgments: the direction that a specimen teaches a SHAPE and so
must not be a link is recorded in §`/schola` is a catalogue, and a control in
the header of every page is not an address, which is why the section names the
box rather than opening it. Three is what it
takes to show the notations differ — a book with chapter and verse, a siglum with
a paragraph number, a code cited by canon — and a fourth of a shape already on the
row would be a longer row teaching nothing more. The Bible's is derived from the
reader's own citation grammar for the reason `/schola`'s is; the others are
gated on the work being in the build.

**The sentence leads and the specimens follow it, and they carry no fill.** Both
followed the heading coming off. Under a rule the chips could go first and the
line beneath them was a footnote; with no rule they were three unexplained boxes
over the small print saying what they were, so the reader met the exhibit before
the claim — the line is the page's own text now and the chips are quiet. And the
chip's ground was `--color-bg-elevated`, copied from `/schola` where it collides
with nothing because that page's rows are deliberately not cards; a centimetre
under seven cards in exactly that ground, border and radius, three inert
specimens were three small cards, and a card on this page is a link. **The
hairline is what makes a specimen findable; the fill is what made it look
pressable.**

**The middle way in was four doors and is the catalogue itself** (2026-09-06, by
direction). The doors were Bible, Prayers, Library and Learn — two works a reader
wants most, plus two PAGES, one of whose entire content was "the catalogue is one
click that way". A home page whose answer to _what is here_ is a link to the
answer charges a click for a list that fits on a screen, and the two works it did
name were there for being popular rather than for any argument the file could
state. So the catalogue `/bibliotheca` draws is drawn here, and since
2026-09-06 as one component: `ShelfGrid.svelte` is the list, the cards and the
bed, so neither page holds a copy of any of it. Learn and the Library are named
in the nav bar, which is where a page rather than a work belongs.

**THE TWO PAGES ASSEMBLED THAT GRID SEPARATELY FOR A FEW HOURS, AND DISAGREED
ABOUT WHAT IT CONTAINS.** The list, the card and the grid class were shared and
the `<ul>`, the `{#each}` and the `visibleShelves()` call were not — so
`/bibliotheca` appended a Bookmarks card that the home page's copy did not have,
while the comments on three files each said the two pages drew the same
catalogue. A shared class fixes a copied STYLE; a copied ASSEMBLY needs a
component.

**WHAT THE COMPONENT ENDED WAS THE ACCIDENT, NOT THE DIFFERENCE** (2026-09-10,
by direction). The Bookmarks card was put on the home page in the same breath as
the component, on the argument that a reader who arrives at the root and has
marks wants them from there; it is `/bibliotheca`'s again, and so is the census
card, both declared at the call site as `<ShelfGrid bookmarks census />`. The
distinction the first arrangement recorded is the one that holds: that page is
the catalogue of what the site HAS, marking and the count of it included, where
this page is a way in to the WORKS. And the rule that decides it is the one two
sections down — everything on the home page is true on a first visit. A card is
not empty the way a section is, since `/signata` answers a reader with no marks
in its own words, but it is a door onto that answer, and a stranger's press of
it lands on a sentence explaining a feature they have not used. A resemblance
maintained by hand is the defect; a difference maintained by a prop is a
declaration two pages away from anyone reading either of them.

**The `type` gate came with the list, and it is the reverse of what a door
wanted.** A door was a page and correct in an empty build — `/bibliotheca` and
`/schola` hold no corpus text — so hiding one because a work type was missing
would have taken away the reader's way to the page that says the work is missing.
A card IS a work, and a card for a work a partial sync did not carry is a door
onto an empty index, so `visibleShelves()` filters and the specimens use the same
test.

**No section on the page is titled** (2026-09-06, by direction). Every heading was
`visually-hidden`; two were made visible on the argument that a rule is right over
a grid of four and wrong over one titled object; then the grid became the
catalogue, whose seven cards say what they are better than the words "Where to
go" over them. Three sections, three rules, three labels naming what is legible
underneath — the page read as a form. Every `h2` is hidden and every one still
exists, the outline being what a reader moving by heading has and a rule being
only what a reader looking at the page sees. The day's was always hidden for the
narrower reason that its card carries the celebration's name as its own heading.

**The way to the calendar is a glyph in the day card's own corner.**
`Liturgical Calendar →` sat under the box as the page's only trailing link, which
reads as a caption on the card rather than as part of it, and put the one control
the card has outside its own border. `LiturgicalDayCard`'s `more` prop is what
draws it — a prop, because `/calendarium` renders the same card and a link to the
page you are on is no link at all.

## `/schola` is a catalogue, and the citation forms moved to the box

**The reference system is the part nothing else on the site teaches.** The
corpus is addressed by number — `CCC 1`, `Comp. 1`, `CSDC 1`, `Can. 1`,
`STh I, 1` — and `suggest.ts` reads every one of those notations back. A reader
who has never seen a citation of the Catechism does not know that the number is
a PARAGRAPH running unbroken from the first page to the last, or that the Code
numbers canons rather than pages. That is `audiences.md` §5's "vocabulary of the
corpus itself", and **this page taught it for five days and does not any more**
(2026-09-10, by direction).

Every row carried a second line — "Identified by paragraph number, running
unbroken from the first page to the last" — and a specimen chip of the notation
at its trailing edge, eight of them in a column down the grid. The jump box's
empty panel prints that table now, one row per work out of `$lib/specimens.ts`,
and a row there FILLS THE FIELD. **A legend prints the form a reader types; a
catalogue prints the form the work prints**, and the reader who needs the
notation is the reader already in the box. The `schola.cite.*` keys went out of
all forty dictionaries with the row, on the rule that a translated value nothing
reads is a line the next translator keeps true for nobody.

What the page kept is what a catalogue is for: a name that opens the work and
one sentence saying what kind of thing it is. **The list is FLAT, one row per
work, where it was six shelves with three works nested inside them.** Nesting is
right for a catalogue and wrong here: a nested work took its parent's definition
and had no line of its own, and the Compendium of the Catechism, the Compendium
of the Social Doctrine and the Summa are precisely the three a newcomer has
heard named and cannot place.

**The specimens' own argument is still worth keeping, because it decided the
formulas section too.** Each specimen was a live link — `CCC 1` to paragraph 1 —
put through the same existence predicate the jump box asks, so a specimen could
never 404. That was a sound guard on the wrong thing: a reader working down a
CATALOGUE was being offered a door into the middle of a work they had not
chosen, and `CCC 1` is a meaningful citation, so a column of lowest numbers read
as eight recommendations rather than as eight examples of a form. The same
sentence refuses a link in a formula's heading: six of them print a Scripture
reference the prose linkifier would gladly turn into a door onto Matthew 5.

**And it is what keeps the page at one primed index.** `/schola` primed `bible`,
`ccc`, `compendium`, `prayer` and `summa` to decide whether to underline eight
words; it primes `bible` alone now, which it needs for the reading suggestion's
book names. Linkifying anything would put it back up to three: `refHref`
validates an address before it mints one, reading the Summa and document
registries as well as the Bible's — 214 KB before first paint, on the page
written for the reader least likely to wait for it. The check at the foot of
`index-priming.test.ts` asserts exactly that, and failed on the first version of
the formulas section; it only catches priming too LITTLE, so over-priming
outlives the code that caused it unless it is pruned by hand.

**The chrome had a section of its own here and does not any more** (2026-09-07)
— it is the sheet the `?` button opens, and the section below is the argument.

**A row listed here is a row the site HAS.** `/quaestiones` and the census were
on the site and not on the one page that says what is on the site, for as long
as it took somebody to notice; a guide that lists what existed when it was
written is a guide that is quietly wrong. Questions is gated on `hasTopics()`,
which is `ShelfGrid`'s own test, because a door onto `quaestiones.landing.none`
is worse than no door; the other four rows are unconditional, the Library and
the Census drawing whatever the corpus holds and Bookmarks and the Calendar
needing no corpus at all.

## The formulas are the Church's own list, and that is why they are parsed

**A reader nine months into becoming Catholic wants the ten commandments and
the seven capital sins**, and `audiences.md` §5 is explicit that they arrive
without the vocabulary to ask for either by address. The cheap way to give them
is two dozen names as interface strings: our words for the Church's list, in
thirty-seven dictionaries, drifting, and with nothing behind them but this
site's say-so.

**The Holy See publishes the list.** The Compendium of the Catechism ends with
an appendix whose Part B is "Formulas of Catholic Doctrine" — the two
commandments of love, the Golden Rule, the Beatitudes, the theological and
cardinal virtues, the gifts and fruits of the Holy Spirit, the precepts of the
Church, the two sets of works of mercy, the capital sins and the last things —
and prints the Decalogue as a three-column table before question 434, its third
column the numbered catechetical formula a catechism class learns. All of it was
already in `raw/`, in ten languages, deferred since the day the Compendium was
first parsed on the ground that it was "not prayers". `ccc/compendium.py` reads
it now; `docs/corpus-schema.md` has the shape and `pipeline/CLAUDE.md` the
parsing rules.

**So the section costs two keys and quotes everything else.** One is the
section's heading, which is what the editions call the set — "Catechetical
Formulas". The other names the Decalogue, and it is the ONE heading in the
section this site writes rather than quotes: the editions do not name that list
at all. The English prints "A Traditional Catechetical Formula" over it and the
Slovenian "Katehetski obrazec", so a reader who came for the ten commandments
would read past the ten commandments; `schola.formulas.decalogue` says what they
are. Everything else is the edition's own words, which is also what now says
whose the words are, the lede that used to say so having gone — every heading in
the section is one no English speaker would write.

**The section heading has been wrong twice, both times by saying too much.** It
was "The ten commandments, and what else is learnt by heart", then "The ten
commandments" (2026-09-11, both by direction). A heading that lists what is
under it is a heading competing with its own contents, and folding the formulas
made the contents legible without it: what a reader sees is a dozen names, so
the heading only has to say what kind of thing they are. The name the folds
could not supply — the Decalogue's — moved down to the fold that needed it, and
trailing colons came off the printed headings, which the editions set because
the list ran on from the words and a fold's summary runs on into nothing.

**Nothing in the section is named, ordered or selected by the site**, because
nothing can be. The editions disagree about the ORDER — Italian prints the
precepts of the Church and the corporal works of mercy before the theological
virtues, where the other nine print them after — so `formulas.json` carries no
key at all, and the page renders the headings it is given in the order it is
given them. There is no formula this page can be found naming, and no formula it
can be found leaving out.

**And the whole section is HELD out of production** (2026-09-11, by
direction: it needs review nobody has done yet). `FORMULAS_HELD` in the page,
true everywhere but `npm run dev`, so it can be read and worked on and is not
served. That is `held.ts`'s argument for a national calendar applied to a
section: derived, readable, deliberately not published.

What a production build drops was checked and not assumed. Vite replaces
`import.meta.env.DEV` with `false`, the constant folds, and the `{#if}` goes
with it — the built bundle carries no markup for the section and no reference to
`index/formulas.*.json`, so no reader fetches one. What survives is this
component's CSS, which Svelte emits whether a branch draws or not, and the two
dictionary strings, which are data rather than code. That is a few hundred bytes
and buying them back would mean a mechanism, which is a worse trade than the
bytes. The index files are still written, so publishing again is one line. What
follows is the state it is held in.

**It closes the page, and every formula is folded shut** (2026-09-11, by
direction). It sat above the picture, on the hinge's argument that it reports
where the two sections below advise — which was true and cost the page its
shape: open, twelve formulas and the Decalogue are longer than everything else
on `/schola` put together, and they stood between a reader and the advice
written for them. Folded, the section is a dozen names of lists, and the names
are the editions' own. `<details class="fold">` is the site's one accordion, so
the mark is the mark every other disclosure here draws.

**Three shapes, and the source chooses.** A numbered list where the edition
numbered it, the numerals redrawn because the parse strips them; a plain list
where the edition set its items apart without numbering them (Slovenian's
`<ol><li>`, Hungarian's table cells, Spanish's dashed beatitudes); and a block
of printed lines where the source marks no item boundary at all. The Beatitudes
are numbered in no edition, and nine lines of "Blessed are…" are a passage
rather than a list — reading them as one would be this page deciding where a
beatitude ends, which is exactly what it has nothing to decide with.

**But a line break is not a boundary either, and six editions proved it.**
Portuguese breaks every beatitude after its comma, Italian and Romanian
mid-clause: the source's `<br/>`s there are one printer's column width, and
reproducing them put a hard break in the middle of every sentence at every
screen size. `shape_lines` joins a line to the next unless it ended a sentence,
so what the page draws is whole beatitudes and the breaks between them are the
full stops the edition printed. English, which already sets one per line, comes
through the same rule untouched — and where a beatitude ends is still the
source's to say, which was the point all along.

**And it draws in the reader's own language or not at all.** It read
`langFor('compendium')`, which answers English for a language the corpus cannot
meet — the right answer for a work somebody asked to read, and the wrong one
here: a Japanese reader who had chosen nothing was shown the ENGLISH appendix
under a Japanese heading, as though their Church printed the capital sins in
English. A fallback is a courtesy when what it offers is a book the reader can
still read, and a misrepresentation when what it offers is what their own Church
prints.

So the section reads `i18n.lang`, and `loadFormulas` is the whole gate: it
answers undefined for a language no file was written for. **That is also why
`schola.formulas.*` lives in ten dictionaries rather than forty** — the section
is unreachable in the other thirty, and a translated string nothing can reach is
a line the next translator keeps true for nobody. Neither the page nor the
dictionaries name the ten: the built index is the list, so reading an eleventh
edition adds a language without anyone remembering to.

**Of those ten, nine are not translated yet either, deliberately.** The section
is held for a review that may rename it, and translating a surface into every
language is the last thing done to it rather than the first — the chance of
rework is what makes it last. `schola.formulas.heading` is English in `en.ts`
and absent elsewhere, which falls back silently; a key only English has is legal
and `i18n.test.ts` says so. `schola.formulas.decalogue` is the exception that
proves the ordering: those ten values already existed, having been the section's
heading until the swap, so keeping them cost nothing to keep.

**A reader whose edition has none gets no section and no sentence.** Four of the
fourteen editions are PDFs whose appendix nothing has read, so a Russian reader
sees the page without this section — which is also what a failed fetch gets, and
deliberately. `/bibliotheca/census` explains its own absence because that page is
nothing without its numbers; this is one section of a page that is whole without
it, and a line apologising for it would be the guide explaining its own pipeline
to the reader it was written for.

## The guide to the chrome is a sheet, and it answers for the page it opens on

**A guide to the controls, printed on a page of its own, describes controls the
reader cannot see while they read it.** That was the shape of `/schola`'s first
section, and it had already paid once for the problem: the rows were split into
two groups headed "The bar at the top of every page" and "The bar above a text",
because run together the list told a reader to look for the compare button on a
landing page, which correctly does not have one. A heading is the best a page
can do. It is still describing a button that is not there.

**In the sheet the rows are read beside the controls they name, so the sheet
draws only the rows whose control is on the page.** A group with nothing on this
page is dropped with its heading rather than left standing over an empty list —
and the last group standing loses its heading too, because a heading
distinguishes one list from another and over the only list in the sheet it is a
line above one row. On `/` that is the install button; on a Bible chapter it is
that plus the four reading-bar controls under a heading; in focus mode it is the
toggle that leaves the mode, because the mode has hidden the rest.

**A row has to teach something the control does not**, which is what the list
lost two rows to (2026-09-07, by direction) and a third on 2026-09-10. Opening
the settings panel, the language menu or the jump box explains any of the three
completely; that whole works download for offline reading is guessable from
nothing, and it is what the header keeps. The reading bar's four all qualify —
nothing on the page says a second edition can be set beside the first, or that
an edition's own footnotes are available at all.

**And a heading that names a bar, standing over one row, is what the header
group became.** Once the jump box had a section of its own, "The bar at the top
of every page" led a single install row: a heading tells a reader there is a
list under it and which bar to find it on, and there was no list. So the install
button took a section too, headed by its own label, and the group heading and
its key went — which is why the jump box's removal cost the header nothing to
rearrange. **A group exists to tell two lists apart; the reading bar's heading
survives because that bar is the one a reader does not always have.**

**The jump box had a section rather than a row, because its lesson is a
notation and a notation has to be shown** — three pairs, `catechism 101 → ccc
101`, the name a reader already has beside the short form the work is cited by.
**It went on 2026-09-10, by direction, because the box now teaches the same
thing itself**: an empty field is answered by a legend of one row per work, the
form beside the name, and pressing a row puts that form in the field. The two
lessons were the same lesson, and the sheet's copy was the one a reader reached
by pressing `?` instead of pressing the control they were asking about. **A
panel a control opens is part of that control**, which is what the settings and
language rows had already been measured against, and the jump box only looked
like an exception while its own panel had nothing in it.

So the sheet's rule generalised rather than gaining an exception, and what the
section took with it is a `searchExamples()` derived from `suggest.ts`'s keys, a
`data-help="search"` on the trigger, and a sentence in forty dictionaries. What
the box's legend keeps of the argument is that both halves are spelled the way a
reader may type them — lower case, no stops, `fold` and `sectionForm` ignoring
both — which is the one thing that belongs beside the field.

**The sheet opens on whatever section the page carries, and no longer on a
sentence about the page.** It led with "The text is the whole of the page;
everything else is a control you can ignore until you want it" — true, and an
instruction to ignore what the reader had just opened a panel to ask about.

**The page answers in its own markup: `data-help="offline"` on the control, a
set of keys collected at open time, `$lib/help.ts` turning that set into rows.**
No
route registers anything, no context store, no list of selectors in the sheet to
keep in step with eight components — the same bargain the keyboard step already
strikes with `rel="prev"`, which is the address sitting in the one element whose
job is to be that link. `help.test.ts` scans the source in both directions,
because both failures are silent and both look exactly like a control that is
simply not on this page: a described row nothing marks can never be drawn, and a
marked control no row describes was marked for nothing.

**Present in the markup is not the question, so every hit is put through
`checkVisibility`.** The table of contents is a sidebar above 80rem and a panel
in the reading bar below it; both are in the document at every width, and
`layout.css` hands one to the reader and takes the other away. The same reading
is what empties the sheet in focus mode, where `zen.css` hides the chrome with
`visibility` rather than removing it. It is read at open time for that reason
rather than once — which controls a page shows changes with the route, the width
and the mode.

**The button is named Help and prints `?`.** It was "Keyboard shortcuts", which
was the whole of the sheet; the guide is now the larger half, and a sheet
holding both needs the name the reader already reaches for. The keys keep their
own heading inside it — `shortcuts.title`, the key that named the sheet — and
they are the one section a width takes away: the trigger is on every width now,
where it stopped at 640px, and the clusters are what a phone does not get. That
inversion is the point. A phone reader has the least room for a control to
explain itself in place, and eight keycaps drawn for a device with no keyboard
would push the rows that do apply below the fold.

**Every row is still named by the key its own control is labelled by**
(`install.label`, `compare.enter`, `document.tableOfContents`, …), so a reader
who reads a row and goes looking for the control finds the same word, and a
translated interface cannot disagree with its own guide. **The icon is the glyph
that control draws**, for the same reason and with the same failure mode: the
focus row was set in `eye` for a day, where `ZenToggle` has always drawn
`maximize`, so the row named a mark that is nowhere in the bar. Only the
sentence under each (`help.feature.*`) is written for the list.

## The sourced routes are gone, and what they were is worth keeping

**Three of them, and the rule behind them was sound.** Every route on the page
was an order some document in this corpus states, carrying the address that
states it: the four pillars were the Catechism's own plan at `/catechismus/13`,
the Gospels stood in the canon's order under Dei Verbum's urging to read
Scripture, the social teaching followed the Compendium's own parts.
`learning-routes.ts` held the rule and its builders took their data as
arguments, so the route whose ordering rule was least obvious could be tested at
all — the fixtures carry no Social Doctrine.

**They went on 2026-09-05, and the reason is not that the rule was wrong.** The
rule produced a page whose most useful sentence for a newcomer was the one it
would not say. A reader who cannot name a book of the Bible is not served by the
canon's order restated; they are served by being told to open one Gospel, which
no document states. The Gospels route's place is taken by the Bible section
above, which recommends and is written as ours. The other two have no successor
and need none: a reader who wants the Catechism's plan reads `/catechismus`,
which IS that plan, and the Compendium's arrangement is its own table of
contents.

**Three lessons paid for by those routes survive them**, and each cost a real
defect:

- **A SOURCED ORDER IS NOT SUFFICIENT, AND THE COUNCIL IS WHERE THAT WAS
  LEARNED.** A route listed the Council's documents ranked by the Council's own
  three genres — constitutions, decrees, declarations — a real ordering made by
  the body that wrote them, and it lasted one day. Sixteen documents is not a
  beginner's reading order. **The test was therefore always both halves:
  somebody else stated the order, AND a newcomer can start on it.** In the end
  the second half ate the first.
- **A `kind` is not a provenance.** That route filtered on `document_kind`
  alone, so `vati.dei-filius` and `vati.pastor-aeternus` — Vatican I, 1870 —
  stood at the head of a list titled "The Second Vatican Council", and they were
  the only two entries in it a reader could not read: Italian and Latin, nothing
  else. When a filter is a claim about who made something, filter on who made
  it.
- **A work's own title is not a division of itself.** The Social Doctrine route
  opened on the masthead, because `csdc.*/structure.json` begins with it and
  that node had absorbed the Introduction — the two share a paragraph, so the
  range cannot tell them apart. `socialRoute` matched it against the work's own
  title rather than guessing from the node's shape.

The module and its tests were deleted rather than left unimported; git holds
them, and a route that comes back comes back with this section as its brief.

**The prohibition those routes obeyed still binds everything else.**
`docs/writing-descriptions.md` binds the only prose this project authors with
"Do not evaluate, recommend, or contextualize", `/colophon` disclaims any
approbation, and `audiences.md` §9 exists to catch anything that reads like one.
What changed is not the rule but where the exception is drawn: two places on
this one page advise, and they are the only two on the site.

**Two sections advise, and what marks them is their HEADINGS.** "If you are new
to this" recommends the Compendium; "If you have never read the Bible" proposes
a first reading path. Every other section on the page is titled by what it lists
— "Finding your way around", "What is here, and how it is cited" — so a section
titled with the reader's own question is visibly answering it, and a paragraph
under such a question is visibly advice.

**Both of the earlier marks are gone, and each failed differently.** The accent
rule down the inline start was a blockquote — the one shape on the web that
means "somebody else said this" — drawn around the two passages nobody else
said, and the indent made the page's longest prose its hardest to read. The
attribution line under the note ("A note from this site, not from any of the
works below") was small print explaining a distinction the layout was already
failing to draw. **A visual convention that has to be learned is worth less than
a sentence that explains itself, and a caption is worth less than a heading that
makes the caption unnecessary.**

**THE BIBLE SECTION TOOK THE NUMBERED GUTTER BACK, AND IT IS HONEST NOW.** That
drawing belonged to the sourced routes, where it said "this is a sequence
somebody authorised"; it went out with them and stayed out while the section was
nine blocks of prose. What changed is not the argument but the reading: heading,
two long paragraphs, a lead-in, a list, a paragraph, another lead-in, another
list and a closing paragraph is the longest reading on the site outside the
corpus, at the foot of a landing page, aimed at the reader least likely to
finish it. What it SAYS is three sentences — read a Gospel, then Acts, then four
places in the older half — so it is drawn as three numbered stages, each a
numeral, a title of three or four words, the reason under it, and the books as
cards that can be pressed. A reader who takes in only the three titles has the
whole suggestion.

The gutter is honest here because the heading is the reader's own question and
the two sentences that lean on a document carry `†`. The order is ours, the page
says so, and numbering it is clearer than pretending it has none.

**And here the cards ARE cards**, where the books section three sections up
argues the opposite for its own rows. The difference is what the reader is being
asked to do: a catalogue entry is READ, and these are CHOSEN BETWEEN — which of
three Gospels, which of four places. A grid of doors is what "pick one" looks
like everywhere else on this site.

**NOTHING ON THE PAGE IS MEASURED, and the measure came off in two passes.** It
was on the `<section>` first, which caps the heading rule too — so this section
ruled two-thirds of the way across a page whose every other rule ran full width,
and the last section read as though it belonged to a narrower document. Moving
it to the paragraphs fixed the rules and left the real complaint standing: **a
40rem paragraph in a 72rem column breaks against a wall the page does not
draw**, and it does it mid-section, beside grids and cards that run the full
width. What carries a long line now is LEADING — 1.62 on the running prose,
against the ~1.5 it inherits — because leading makes a line easier to return
from and a cap draws an edge. The cards are what break the section up, and they
cap themselves at 14rem tracks.

**The numeral is in the title, not in a gutter beside it.** The gutter was a
2.25rem column with the stage indented past it: a straight edge down three
figures, bought by charging every paragraph and every card in the section an
indent from the page's own margin. Nothing else on the page indents, and an
indented block is the shape of a quotation — which is the second time this
section has accidentally drawn itself as one.

**Every card carries a reason, including the stage with one book in it.** Acts
shipped as a bare name for a day, on the reasoning that the stage above has
three Gospels to tell apart and this one has a single book to name. That is an
argument about DISAMBIGUATION, and a card's second line is not for telling one
book from another — it is for telling a reader who has never opened a Bible what
they would be opening. The word "Acts" tells them nothing.

**THE PICTURE IS THE PAGE'S HINGE** (2026-09-06). It was the masthead, above the
`h1`, where it announced the page before the page said anything and delayed the
one sentence a newcomer needs by a banner's height. It now sits between the two
sections that LIST — the chrome, then the works and their notation — and the two
that ADVISE. That is the one place on the page where the voice changes, and it
was the only change with no mark on it; a band across the column is read as a
turn before anyone works out why. A picture of somebody being taught is the
right picture for that seam, and `/bibliotheca` keeps the same component as a
masthead — one `ArtFigure`, two rules around it.

**AN ACCENT IS THE CHEAPEST STRUCTURE A LANDING PAGE HAS.** Four sections
divided by four hairlines in the same grey as every card border leaves the eye
nothing to count. The section rules and the chrome icons take `--color-accent` —
mixed toward the border or toward the ground, never filled, because a solid
accent chip reads as a button. A card's NAME is coloured at rest rather than on
hover, because the card is a link and a touch screen has no hover.

**AND THE SHELF LIST TAKES A PIGMENT PER SHELF** (2026-09-06). Eight rows whose
icons were eight identical red glyphs made a stripe down the gutter that carried
nothing: the mark was decoration beside a name doing all the work. Now the icon,
the specimen chip and the row's hover all take that shelf's colour, and the
Bible section further down is vermilion throughout — every card in it opens the
Bible, so a reader who met vermilion on the Scripture row meets it again where
the suggestion sends them.

**They are the site's own `--pigment-*`, and that family shipped twice in one
day.** `/schola`'s first version defined eight of them keyed by PIGMENT NAME —
azurite, verdigris, folium, iron gall — with a hand-kept block per palette
family; `CitedBy`'s panel, landing on main the same afternoon, defined seven
keyed by SHELF, each `color-mix(in oklab, <seed> 50%, var(--color-text-muted))`
so that one definition serves four themes and `data-mono` needs a single dial
(`--pigment-strength: 0%`) rather than four rules. Main's is better on both
counts and already had a consumer, so the guide converged onto it and lost
nothing it wanted. **Two independent designs reaching for the same token prefix
in one afternoon is what a shared vocabulary looks like when it works and what a
collision looks like when it does not**; the lesson is to read `tokens.css`
before opening a family, not after.

**`--pigment-bible` is what the guide added**, because the panel had no shelf
for Scripture: minium, red lead, the pigment a rubricator opened a book with and
the one "miniature" is named after. A seed is judged by what it MIXES to, never
by the literal — minium resolves 4.7 (OKLab ×100) from the Catechism's red,
wider than the family's own closest pair at 4.3, where vermilion, the obvious
first try, resolves 1.2 away and would have given two shelves one colour. The
Compendium takes no seed and wears the Catechism's, being the same teaching
abridged.

**WHERE A PIGMENT MAY GO IS ARITHMETIC, NOT TASTE.** Mixed halfway to the muted
grey, the family resolves to 3.4–4.2:1 on a dark ground — a decoration's
contrast, which is exactly what `tokens.css` says it is. So the guide spends it
on the row's 1.35rem icon, on the 1.6rem serif figures that number the stages
(large text, a 3:1 floor the family clears), and on the cards' borders and
hover washes, which are not text at all. The card names, the running words and
the notation chips are `--color-text-muted` — the colour of the "Identified"
line they sit on, since an accent chip was the loudest thing on the quietest
line of the card. Both owe 4.5:1 and clear it. A
pigment on 0.8rem text would have shipped a contrast failure in one theme only,
which is the kind nobody finds.

**THE ICONS TAKE THE LITERAL, AND THE PANEL TAKES THE MIX.** `tokens.css` holds
two tokens per shelf: `--shelf-*`, a colour somebody would name out loud, and
`--pigment-*`, that same colour mixed halfway to the muted grey. A dot in a
column of dots is read against its neighbours and only has to sit in a tonal
band; an icon standing alone in a row, half a page from the next, has to be red
or blue or green on its own. Deriving the second from the first is what keeps a
shelf to one colour with two presentations rather than two colours.

**AND FOR FOUR COMMITS NONE OF IT WAS VISIBLE AT REST.**
`.book-icon { color: var(--shelf) }` was written above a
`.feature-icon, .book-icon { … color: var(--color-accent) }` that sized both
kinds of icon and coloured them too. Two selectors at the same specificity, the
later one winning — so every shelf icon was the house red until the pointer
touched it, and `.book:hover .book-icon`, one class higher, was the only rule
that ever showed a shelf its own colour. The feature was exactly inverted: the
colour identifies the row and should be there always; the hover only answers the
pointer and should be the variation.

Nothing failed. `svelte-check` saw two live selectors, both used. The page
rendered. **A cascade bug looks exactly like a design problem, and it will
absorb as much design work as it is given** — three rounds went into this
palette before anyone looked at the cascade, and every one of them was judged
against a hover state, because that was the only place a colour appeared. The
invariant that prevents it is one line: **a rule that sizes both kinds of icon
may not colour either.** Colour is stated per kind, after, and
`pigments.test.ts` fails if the shared rule regains a `color`.

**Three schemes tried to compute the icon out of the dot before that, and each
failed the same way.** Turning `--pigment-strength` up buys separation and
spends contrast on a dark ground, the seeds being dark and the ground darker;
holding a lightness and a chroma with `oklch(from …)` fixes contrast and still
produces four earth tones. The reason is one sentence: **a colour's name lives at
a particular lightness.** Brown is dark orange, olive is dark yellow, navy is
dark blue — so any scheme that holds one lightness across the hue circle turns
the warm half of a palette to mud however much chroma it spends. Lightness has
to vary per hue AND per ground, which is two degrees of freedom no single
literal has, and that is why `--shelf-*` is written per theme family where
`--pigment-*` is not.

**Its floor is 3:1, not 4.5:1, and the reason is what the mark is.** A shelf
colour lands on a 1.35rem icon that sits beside the work's own name in words:
nothing is told apart by one and none of them is required to understand
anything, so the graphical-object bar applies and is taken as a courtesy rather
than owed. Measured against every ground of each family — worst 4.15 light, 3.43
sepia, 6.11 dark, separation 7.8 on paper and 8.7 on a dark ground. Sepia and
OLED restate nothing: each moves a ground rather than a palette.

**AND THEN ALL OF IT CAME BACK OUT AGAIN, EXCEPT ON THE CARDS** (2026-09-06).
Four coloured lists put twenty-odd coloured glyphs across four grids, and **past
a certain count a colour stops picking a row out and becomes the page's
texture**: every row shouting is every row quiet. The marks are one accent
again, and the per-row distinction is what it was before any of this — the
icon's SHAPE, a scroll, a scale, a feather, which is a stronger signal than a
hue and costs no palette.

The one list that keeps its colours is the reading suggestion's cards, and the
difference is what the reader is doing. A row in the shelf list is READ, one
after another, and a colour on it is a label; a card in the suggestion is CHOSEN
BETWEEN, and there a colour is doing the work a grid of cards exists to do.
**The colour is in the edge and nowhere else** — a 3px head rule, with hover
carrying it round the whole frame. It washed the ground at 7% as well for a day,
on the argument that a 2px rule alone will not separate one card from the next;
what that produced was eight coloured boxes competing with the words inside
them.

Everything below is the history of a colour system that shipped and was taken
back. It is kept because the measurements are still true of the tokens, which
are all still there and all still spent — `CitedBy` marks every shelf with the
muted mix, and the cards walk the ramp — and because the next surface to reach
for one owes the same arithmetic.

**FOUR LISTS ON THE PAGE WERE COLOURED AND ONLY ONE OF THEM MEANT ANYTHING BY
IT.** The shelf list's colour is identity: a work wears it wherever the site
names it, and `CitedBy` marks the same work with the muted mix of the same
value. The chrome guide's eight controls, the three rows that are pages rather
than texts, and the eight books of the reading suggestion are not shelves and
must not borrow a shelf's token — `--shelf-catechism` on a search icon would
assert something false. They walk `--hue-1` … `--hue-8` instead, which is the
same eight values in an order and asserts nothing; the colour there does one
job, which is keeping a row from blurring into the row beside it.

That is a reversal of what this file said for a day, which was that the chrome
is one KIND of thing and so takes one colour. True of what the controls are, and
wrong about what the mark is for: eight identical glyphs down two grids stop
being a way into a row and become texture beside it. **The ramp is interleaved
rather than spectral** — walked in the shelves' own order a list gets red beside
orange beside gold, three warm neighbours — and it is aliases rather than
literals, so every position follows its theme and monochrome flattens the lot
through the values it points at.

**A card can afford a colour its name cannot.** The reading suggestion's cards
carry theirs in the head rule and in a 7% wash of the ground, because a 2px edge
alone does not separate one card from the next at a glance; the card's NAME
stays on the accent, since 1.1rem of serif owes 4.5:1 and these literals clear
3:1. The stage figures stay minium throughout — the section is Scripture, and
that much is a claim.

**Monochrome has to restate the literals**, because `--pigment-strength: 0%`
reaches only the mixes. Miss that and the page keeps its colours in the one mode
whose entire contract is that nothing is told apart by hue.

**HUE CARRIES NOTHING BY ITSELF.** Every mark wearing a pigment sits beside the
work's name in words, so the colour is a second channel over a complete first
one — which is what lets `data-mono` turn the whole family off and lose nothing.
`src/lib/pigments.test.ts` does the bookkeeping, because every way this breaks
is silent: a `var(--pigment-…)` naming nothing falls back past an invalid
declaration and reads as a design choice; a value written flat instead of mixed
looks right on paper and fails in dark alone; and one pigment the dial does not
reach falsifies monochrome for exactly the readers it exists for.

**A `†` carries no `title`.** The platform's own tooltip draws on top of the
site's link-preview card, so the mark's name was covering the thing the mark
opens. The `aria-label` stays and is what announces the document.

## The Bible section proposes a path, because nobody else publishes one

**The Church states a narrative frame and never a reading plan, and that
asymmetry is the whole warrant for this section existing.** Three documents were
read looking for one and none of them has it:

- **`Dei Verbum` 25** asks bishops to give the faithful "suitable instruction in
  the right use of the divine books, **especially the New Testament and above
  all the Gospels**". That is a priority, and it is the strongest thing any
  magisterial text says about where to start — but it names no single Gospel and
  no sequence after it.
- **`Verbum Domini` 41** says the Old Testament is read in the light of Christ
  and the New in the light of the Old. That is a HERMENEUTIC, not an order.
  Conflating the two is the usual error, and it is used to justify both
  "therefore start with the Old Testament" and "therefore skip it".
- **CCC 54-64**, the stages of revelation, is theology and not a syllabus: it
  divides salvation history into named stages and cites no books to read. Every
  year-long plan on sale takes that frame and supplies the missing list itself.

**WHICH GOSPEL IS LEFT OPEN, WITH THE ARGUMENT ATTACHED.** Mark (shortest,
finishing one beats choosing the best one), Luke (written for an outsider who
wanted the story in order, and runs on into Acts), John (says outright why it
was written) are all genuinely argued for and no document settles it. The page
offers the three with their reasons and adds no fourth row saying which is
right — the same instinct as the jump box offering both readings of a divergent
psalm rather than picking one.

**Every row is the reader's own Bible.** `passage()` names a book as their
edition names it and checks the chapter exists before it links, so a book an
edition does not carry drops out of the list rather than 404ing; the extents
(`1-11`, `12-50`) are numerals and cost no dictionary. The two documents are
cited by their own Latin names through `documentWorkIdFor`, so a reader who has
chosen an edition of Dei Verbum keeps it.

**THE TWO CITATIONS ARE DAGGERS, NOT NAMES SET INTO THE SENTENCE.** Two Latin
titles and two numbers inside two paragraphs of deliberately plain writing broke
them exactly where they should have read straight through, and a reader who has
not yet met the word "Gospel" is not helped by meeting "Verbum Domini 41"
mid-clause. `†` is the site's existing mark for "there is a source here" and is in the
two-codepoint font that is already precached. `‡` IS reachable and is not free
to take: the commentary draws it for the notes that name no words in a verse,
so setting it here would claim something of this sentence that is not true of
it. It is superscripted by `vertical-align` and not by the glyph — a
dagger is drawn baseline-to-cap like a letter — and the link carries an
`aria-label`, because its only content is a mark.

**No name on the page is written twice.** Every work is titled by the key its
own landing page is titled by, every feature by the key its own control is
labelled by, and every book in the reading suggestion by the reader's own
edition — so a name arrives in the reader's content language and cannot fall
behind an ingestion. The `schola.*` keys are the page's name and its SENTENCES:
what each work is, what its unit of citation is called, what each control does,
and the reading suggestion. That is the part §5 actually stops at — not where a
work is, but what authority it carries and what `CCC 1` means when somebody
writes it down.

**THE PICTURES COST TWO KEYS, because a caption is not a sentence.** Each is
`Artist, Title, year. Institution.` — proper nouns and a date, held beside the
asset in `landing-art.ts` — and the only interface words in the whole set are
"detail" and the name of the control that shows a credit. Images are `alt=""`
with the identification in the caption, `Plate.svelte`'s arrangement. They are
public-domain works newly cut from Commons scans, and a faithful crop keeps no
master: no retouching, nothing invented, so `assets/README.md`'s recorded URL,
SHA-256 and crop box reproduce it exactly. **Jerome's is not faithful and
therefore keeps one** — cropped and tone-corrected by hand on 2026-09-06, which
no command reproduces — and the 12 MB source is in `glossa-corpus` under LFS
rather than in this public repository. **A colour painting must not
take `--plate-blend`** — that token is tuned to multiply a grey scan's white
paper away and turns an oil into mud — and under `[data-mono]` every one is
desaturated, because a reader who asked for one grey ramp did not ask for
paintings.

**THE CREDIT IS A PRESS AWAY, WHICH IS ALSO WHAT KILLED THE SHELF VIGNETTES.**
`ArtFigure.svelte` puts the identification behind the same caption trigger a
Doré plate uses — `AnchoredPanel`, native popover, `role="note"`, printed
unconditionally because the printed copy is the one whose reader cannot press
anything — so a banner carries no line of small type under it. **The credit in
that card IS a link** (2026-09-06), to the Commons file page `landing-art.ts`
has held in `source` since the pictures arrived: it carries the licence tag,
the digitizing institution's own terms and the master, and it is the page
`assets/README.md` re-derives the crop from, so one anchor is both the
provenance a reader can check and the recipe. `CopyrightNotice`'s clothes,
dotted underline and external-link glyph, since it is that component's argument
applied to a picture. The printed line stays plain: a Commons URL is a hundred
characters of ink for a reader who cannot press it. **The trigger is
`.menu-trigger`**, the site's own icon button, and carries nothing of its own
but where it sits: it was a 1.75rem disc for a day, which made the one control
laid on a picture the one control on the site that was not a rounded square.
The definitions below had 400px paintings and now have icons: that part of the
page is definition rather than illustration, read by someone who does not yet
know a catechism from a council, and a painting beside a definition is
something to look at instead of reading it. A glyph belongs to the row. It also
took 147 KB out of the build.

**AND THE PAGE IS A LANDING PAGE, LAID OUT AS ONE.** `.landing-column` in
`layout.css`, shared with `/`, `/bibliotheca` and — through the `.index`
variant below — `/documenta`; all four were set in `--content-width`, which is
62.4 CHARACTERS of prose and the wrong instrument for a page of banners, grids
and a numbered list. The prose that is still prose keeps `.landing-measure`.

**Library works only as the SUPERSET, and three umbrella labels failed before
it.** "Church", "Magisterium" and "Teaching" all failed the same way: Scripture
is transmitted by the Church, the Catechism is issued by the Church, the prayers
are the Church's — a label every sibling satisfies carries no information and
cannot tell a reader where to click. `/bibliotheca` escapes that only because it
lists **every** work, Bible and Prayers included, so it makes no taxonomic claim
and cannot become the bin for whatever did not fit. Redundancy is a defect only
when two items reach the SAME place, which is why there is no "Home" entry
beside the brand link and why a shortcut past an index is not one.

**It holds a catalogue and a way in to the record**, which is what makes it
more than an index: the shelves, then one card for the marks. `/signata` holds
the record itself.

**"CONTINUE READING" MOVED TWICE IN ONE DAY AND THE TRAIL IS THE ARGUMENT**
(2026-09-06). It was on the home page, capped at four against this page's
uncapped copy, on the reasoning that an entrance may show a little of what the
record holds. What that produced was a section EMPTY for every reader who has
not been here before — the one page a stranger arrives at, arranged around a
state only a returning reader has — while the returning reader got a truncated
copy of a list one click away. It came here, and then went on to `/signata`:
**a position and a mark answer the same question and are opposite in how they
got there** — a mark is a decision, saved on purpose and removable, a position
is a trace the site kept without being asked — so splitting them across two
pages meant a returning reader had to know which one had kept their place. Two
sections on one page, not one list, and the trace goes first.

**BOTH SECTIONS PRINT A CITATION NOW, AND THE PAGE STOPPED READING THE CORPUS
TO DO IT** (2026-09-07). They printed whatever the surface that produced the
row happened to have said: a position's label is composed by each reading route
(`CSDC 8` from one, `1. The Sacraments of Christian Initiation` from another,
`Part II-II · Question 189` from a third), and a mark's was the hover card's
own heading. This is the ONE page where every work meets in a single column,
which is exactly where a notation has to be the one the site teaches — so
`citation-label.ts` writes them all in `/schola`'s forms, out of the reader's
own edition's abbreviation table.

**What paid for it was the excerpt.** Two clamped lines of the passage under
each mark meant a content file per row; a citation comes off the index tier and
costs nothing, and the text now arrives for the one row the reader peeks at.
That is also what put the rows back in the tap-peek default (`site/docs/reading.md`):
an excerpt is what made a row self-explanatory enough to justify skipping the
peek under a thumb.

**A DEAD ROW IS STILL A ROW, and what tells it apart got cheaper rather than
weaker.** The library learned a mark was dead by fetching its text and getting
nothing; `addressResolves` asks the index tier instead, and asks the ROUTE's
question — `/catechismus/caput/{n}` serves the chapter CONTAINING `n`, so a
marker that demanded `n` open one would have called a working link broken.

**Two defects surfaced from the same corner and neither was in the page.** The
Summa wrote its reading position under the literal work id `'summa'`, which
`getWork` cannot resolve, so `continueRows` had dropped every Summa position
since the work was ingested — the section had never offered one. And the hover
card titled a Catechism paragraph `CCC 1` as a literal, in English, over
Portuguese prose that cites it as `CIC`. Both are the shape of defect a page
that prints one work at a time cannot see: **a column where every work meets is
a test, and it is the only one either of these would ever have failed.**

**The key was renamed twice on the way and is `reading.continue` now**, named
for `reading-position.ts` rather than for a page. `home.continueReading`, then
`library.continueReading`: each was a claim the codebase stopped keeping within
hours, and the fix was not a better page name but no page name. (`nav.library`
was `home.works` for the identical reason a year earlier — the label is the
same words in every language, so all three renames were mechanical.)
`/signata`'s own title and tagline still name the marks alone, which is the
accepted cost: renaming a route and two strings in thirty-seven dictionaries to
cover a section one heading already names is a larger claim than the page is
making.

**No page below the bar declares a SENTENCE of its own, and one declares a
name.** The catalogue's cards — on `/bibliotheca` and on the home page, one list
between them — and the `<head>` all read the key the destination page is
already titled and described by (`scripts/route-titles.mjs`). A catalogue that
paraphrased the pages it lists
would be a second set of sentences to translate into 37 languages and a second
set to keep true. The one exception is named below, and it is a name.

**THE SHELVES ARE CARDS ACROSS THE COLUMN** (2026-09-06), each carrying the
glyph `/schola` already assigns that work, where they were stacked blocks down
72rem: a column of headings with an ocean to the right of each. They were the
home page's `.door` grid — the same track pattern, the same gap, the same card,
the same whole-card anchor, differing only in the track floor — for as long as
that page had doors. **It is one object rather than a resemblance now**: the
home page draws this same catalogue, so the entries are `$lib/shelves.ts`, the
card is `ShelfCard.svelte`, and `ShelfGrid.svelte` is the bed and the assembly —
both pages render it and neither holds a copy of anything in it. What stays with
the page is the element around it: a `<section>` on `/bibliotheca`, where the
cards are the subject, and a `<nav>` on the home page, where they are the way
in.

**AND THE WHOLE CARD IS THE ANCHOR ONLY BECAUSE LEARN WAS UNFOLDED.** For one
commit a shelf could hold rows of its own and exactly one did — Learn, over the
Catechism pair and the Social Doctrine — which forced the heading to be the
target and left the rest of the card inert, since an `<a>` inside an `<a>` is
ambiguous before it is invalid. Unfolded, each is its own card and the whole
apparatus that shape needed goes with it: a second type, a nested list, and
four rules pulling `.index-row` back into a block, all of it for one group of
two. **A container holding one group is a heading doing what a position in a
list already does.** The `<h3>` stays, inside the anchor, which is valid and is
what keeps every named thing in the outline.

**The Summa has no card and the Catechism's holds two works.** `/catechismus`
indexes the Catechism AND its Compendium, which the sentence under it has
always said, so the pair is one card named for the pair —
`ccc.landing.pairTitle`, and it carries a sentence written for it too
(`ccc.landing.pairTagline`) because `/catechismus`'s own tagline is a masthead's
two sentences and set six lines in a 16rem card. Those two are the only strings
on this page written FOR it, since `/schola` lists the two works separately and
the `<head>` titles `/catechismus` after the Catechism alone. `/doctores` keeps its card and its caveat; what went
is the row underneath that jumped past the caveat into an unrevised Summa. The
taxonomy that put the Social Doctrine under Learn — synthesis read THROUGH
against dated acts cited SINGLY, after it had moved three times — is still true
and needs no container: with one card per work the ORDER states it, and the
address space states it without being asked.

**The last card is Bookmarks, and it is the only one that is not a work.** It
reads exactly like the others — name, glyph, and `/signata`'s own tagline — it is
there whether or not the reader has marked anything (2026-09-06; it was hidden on
an empty store until then), and it is on both pages that draw the catalogue.
It has no row in `$lib/shelves.ts` and needs none: a `Shelf` is a work type plus
the strings its own landing page is titled by, and this card has neither. That is
also why `ShelfCard` takes four strings rather than a `Shelf`. A catalogue names
what the site has, and hiding the one door to marking until a reader has already
found marking elsewhere shuts it against the only person looking for it; the empty case is
`/signata`'s to answer, and it answers in words. It carried `/signata`'s section
counts as chips where a work card carries its sentence, on the argument that the
shape of a collection says more than a total about whether it is worth opening.
It says that to whoever wrote it; on the page it was `1 1`, numbers with nothing
naming what they counted, in the one slot a reader had learned to read as a
sentence.

**Every card is the height of the tallest** (`grid-auto-rows: 1fr`), because a
grid of cards is read as a grid and a short row of them under a tall one reads
as two grids. It is also what makes a long tagline expensive rather than free,
which is the pressure that produced `pairTagline`.

**The painting is a tailpiece, not a masthead** (2026-09-06). A reader arriving
at a catalogue wants the catalogue, and a 400px banner above the title put a
picture between them and every door on the site. Below the last card it is
decoration, loads lazily since nothing is above the fold, and keeps its credit
behind `ArtFigure`'s trigger — where a picture sits in a page's argument is a
separate question from whether the page says whose it is.

**And it is a 300px BAND, which is a window and not the picture.** Drawn at its
own ratio the painting is 739px tall at the column's full width — half the page,
under the catalogue the reader came for — so `--art-height` fixes the height and
`object-fit: cover` crops to it, 180px on a phone where the box is narrower and
the crop comes off the sides instead. **What makes that free is that pressing it
opens the whole file** over the page, in the same viewer a Doré plate uses. The
two questions came apart that day and had been one: how much painting is worth
shipping (1600×727, the study and no further) and how much page a picture may
take (300px). Only a cropped picture gets the control — a picture drawn whole
has nothing behind it, and making it a control would promise one.

**The home page is the liturgical day and the doors, and nothing else.** It
rendered the Bible's whole table of contents and then the Catechism's whole
outline until 2026-09-04, and those two blocks were most of its height — which
is why nothing ingested afterwards was ever added to it, neither the Compendium
of the Social Doctrine nor the Code. **That was a WEIGHT problem and not a
nesting one**, which is why rearranging the nav into categories kept feeling
like the fix and kept not being one. What "continue reading" then cost it was
not weight but TRUTH: every other thing on that page is true on a first visit.

## The jump box

**It suggests over the sitemap's address space, not over a search index.** It
was a parser with a field in front of it — type a finished citation, press
Enter, be told "no match" — which serves a reader who already knows the
address, where three quarters of the corpus has no address anyone would type.
`suggest.ts` enumerates what a fragment could become, from the same places
`sitemap.mjs` enumerates, and reads the index tier only, so a keystroke costs
no fetch and the box works offline.

**It completes in the reader's own notation, sharing the parser's tables rather
than copying them**, because a form the suggester completes and the parser then
fails to resolve would offer an address that does not exist. What this cannot
fix is a table with no full book names in it, so a French reader completes
`Jn 3` and not `Jean 3` — inventing the missing names is exactly the
hand-maintenance derivation exists to avoid.

**A suggester has a list, so divergent numbering is offered rather than
guessed.** `Ps 23` is Psalm 22 in this corpus and Psalm 23 is also a real
address; `refparse.ts` has to pick one, and the box shows both, each labelled
by where it goes. **A completion of a divergent chapter is a DUAL citation**
(`Ps 22(23)`), because a plain one converts twice and would move the reader's
own chosen row down the list they picked it from.

**Tab completes, Enter goes, and a completion is an input rather than a
label.** A suggestion is usually a PREFIX of where the reader is going, so Tab
fills the field and leaves it open — and only with a row chosen, because Tab is
also the only keyboard way out of a modal. Every row states its own completion,
because label and grammar part company wherever the label reads better ("Summa
II-II, Q 184" parses as nothing); the round-trip is tested as a property over
every row, and it found three real defects.

**`suggest()` reads its language from its argument, never from the store.** A
function whose output half-follows its argument and half-follows a global is
one nobody can test.

**Loose matching is a dependency, and it is the site's second one.**
`fuzzysort` (MIT, zero deps, 7.5 KB gzipped) against ~70 lines of hand-rolled
scoring: the algorithm is textbook and the TUNING is not, and the tuning is
what decides whether a list of eight rows is useful. It is injected rather than
imported so it stays out of the boot chunk, and offline is not the casualty it
looks like, since a lazily imported chunk is an ordinary build asset.

**Fuzzy sits in one band below every literal reading, and may not stack a guess
on a guess.** It adds rows and never reorders the ones something actually read.
`ctechism 27` offers the Catechism and not paragraph 27, because which work was
meant and what the digits are would be two guesses; and `exactReference`
declines a misspelled book rather than demoting it, since a guess with a range
attached is a guess wearing a certainty.

**The threshold is 0.3, measured, not fuzzysort's default 0.5.** fuzzysort
penalises by target length and these names are long, so a real typo lands
between 0.33 and 0.39: swept over sixteen misspellings, 0.5 found four and 0.3
found fourteen with no literal row displaced, where 0.25 is where the lists
start filling with noise.

**Books get a SECOND matcher, because a transposition is not a weak subsequence
— it is none.** `fuzzysort.single('jonh', 'john')` returns `null`, and
transposing two letters is the commonest way to mistype a word one knows.
Bounded Optimal String Alignment over the book forms answers it in twenty lines
with no dependency. **Subsequence matching cannot read a transposition at any
threshold** — written down as a test rather than left as folklore, since the
next person to meet it will otherwise file it as a bug and tune the threshold,
which cannot fix it.

**The right letters in the wrong order outrank a wrong letter.** `jonh` is one
edit from Joshua, Jonah and John at once: the first two are reached by changing
a letter, which is also how one reaches a DIFFERENT book, where John is reached
by rearranging the letters actually typed. Same length and same multiset is the
whole test.

**A section the bar does not name is still completable, because the two lists
answer different questions.** `suggest.ts`'s `SECTIONS` is every work with an
index, which is not the five doors: `/doctrina-socialis` and `/ius-canonicum`
are reached through Library and through the box, and both were missing from the
box until 2026-09-04 — so the Code was ingested in seven languages and `can. 748`
completed to nothing for weeks. A work that is in the corpus and not in that
table is invisible to the one surface an expert uses.

**`CIC` means two works and both rows are offered.** Portuguese cites the
Catechism as `CIC` (_Catecismo da Igreja Católica_); everywhere else it is the
_Codex Iuris Canonici_. This was noted as a future collision while the corpus
held no canon law, with the predicted fix being a discriminator on the reader's
language — and that prediction was wrong for the same reason the box accepts
every language's word for a work: **the interface language decides what a row is
labelled and does not get to decide what the reader meant.** A Portuguese
speaker reading English chrome still types `CIC` for the Catechism. So the
siglum sits on both sections, the box offers both rows, and the ranking orders
them. It costs one row in a list of eight and can never be silently wrong.

**The matched span is marked in the row, and re-derived rather than carried.**
A row shows an address as the reader's own language spells it, so
`highlight.ts` matches the LABEL rather than reusing what `suggest.ts` matched
— a span in a form the reader cannot see is nothing to draw. The consequence is
stated rather than papered over: `lg` reaching "Lumen Gentium" carries no mark
at all. A one-LETTER token must be a whole word and a one-DIGIT token need not,
since a digit is an address whose typed prefix is exactly why the row is there.

**A loose mark has to be dense, or it is the query's letters found by
accident.** Four letters exist somewhere in almost any sentence: `dani` drew
"Of Man's Various **D**uties **an**d States **i**n General" one row under
"**Dani**el 1", on the same keystroke — a row wearing highlights rather than a
row explaining itself. The gate is how much of the span the marks fill (half),
plus a run of three characters or no more than two pieces, which is what
separates a misspelling from a coincidence: `capcity` fills 7 of the 9
characters it spans and `psms` is two pieces of a short word, where the letters
of a coincidence are strung across thirty. **Nothing here counts runs alone** —
`rermnvrum` over "Rerum Novarum" is legitimately five of them.

**And the marker owes the same shape as the matcher that found the row.**
`deniel` is not a subsequence of "Daniel" — the `e` it wants before the `n` is
behind it — so the row `boundedEdit` had put at the top of the list arrived
with nothing marked on it, which reads as a result arriving for no reason. The
answer is a second loose pass keyed on DISTANCE rather than containment,
marking the whole word the typo was aimed at: which letters of "Daniel" the
reader got right is an artifact of the edit the table preferred, and the claim
being made is "this word is what you meant". `boundedEdit` moved to
`edit-distance.ts` for it, ~600 bytes into the boot chunk, `highlight.ts` being
imported by a component the layout renders. **A subsequence matcher and a
subsequence highlighter agree by construction; a distance matcher and a
subsequence highlighter do not, and the disagreement is silent.**

**The foot of the box names the keys that do something NOW.** It read "Press /
or Ctrl+K to jump to a reference" until 2026-09-10, which is a true sentence in
the one place it was never printed: those two keys OPEN the box and are inert
inside it, where that line was the only thing on screen — and Tab and Enter,
the two keys the box's whole grammar rests on, were named nowhere at all. Each
row is conditional on the same state its handler tests (arrows need a list, Tab
needs a row chosen, Enter needs something to submit), so the legend cannot
promise a key that would do nothing.

**That string was right on the other surface, which is why it kept its
translations.** The home page prints it as the lead over the notation
specimens, with the box shut and both keys live, so the fix was a second key
(`jumpbox.searches`) and not a rewrite — a rewrite would have made 38
dictionaries wrong to fix one surface. **A key may be shared by two surfaces
only where the sentence is true on both**, and the cost of getting that
backwards is paid in the translated half, silently, in languages nobody here
reads.

**The box completes what a work is CALLED and, since 2026-09-10, what it
prints inside itself.** A document's sections, the Code's titles and chapters,
the Compendium of the Social Doctrine's divisions — 203,073 headings across
the corpus, reachable before this only by opening the work and reading its
table of contents, which is the one thing a reader who knows the words cannot
do quickly. The Bible, the Catechism, its Compendium and the Summa are
deliberately not in it: their divisions are already offered by name.

**A heading is TEXT, so the shard is resolved per reader and not filtered per
reader.** Every edition's headings is 1.8 MB before framing, and a reader
wants one edition of each work — the one they would open. So `sync-corpus.mjs`
walks `editionInLang`'s own chain per interface language and writes
`index/section-headings.<lang>.json`: 40 shards, 8.2 MB raw over the build,
and **the reader fetches ONE, 65–100 KB gzipped, on the first opening of the
box**. Shipping a shard per language and loading the reader's whole chain
instead was measured at 256 KB gzipped for the same answer.

**The neighbour is what makes a shard complete rather than merely native.** A
Portuguese reader's shard carries the Spanish headings of the documents with
no Portuguese edition, because Spanish is the edition `/documenta/{slug}` will
show them. A reader who has overridden one work's edition by hand is offered
that work's headings in the shard's language and lands on the page in theirs —
the anchor is a unit number, which no edition disagrees about, so the cost is
a label in the wrong language rather than a row that goes anywhere wrong.

**`CONTENT_LANG_FALLBACK` moved to a leaf module for this.** The build now has
to resolve the same edition the browser will, and Node cannot import
`corpus.ts`. `content-fallback.ts` is `lang-names.ts`'s precedent a second
time, and the general rule both instances teach: **a table a build script and
the browser must not disagree about cannot live where only the browser can
read it.**

**A heading and a topic are handed to `suggest()` as ARGUMENTS.** That module's
own rule about its language — a function whose output half-follows its
argument and half-follows a global is one nobody can test — applied to a
table, and it is what makes the producers testable at all: the fixtures carry
no documents, no Code and no Compendium of the Social Doctrine, so a registry
read would have left the whole feature exercised by nothing.

**Both new kinds sit in bands below every name.** A work's title names the
work, a section landing page names a shelf of them, a topic is a door onto
passages of several, and a heading is one line inside one edition — of which
there are five thousand per shard against fifteen hundred names. So `mercy`
offers the works called that before the chapters that mention it, and the
tier still decides within a band, so an exact heading beats a substring one
and no heading climbs out. Capped at four rows, the same cap a kind of title
gets — and that cap is lifted by a scope, which is the only state in which
there is nobody to crowd.

**The questions are wired to the box on the same terms, and cost no fetch at
all beyond the topic list.** What is matched is what `/quaestiones`'s own
search matches — the title, the question, and the line of keywords nobody sees
— because those three are in the DICTIONARIES and already resident. The
keywords are the load-bearing third: `mors-voluntaria` is titled "After a
suicide" and a reader typing "killed himself" finds nothing without them.

**An index-tier file rides no download wave, and this one accepts that.**
`partitionAssets` puts every unlisted `.json` under `/immutable/` in the
content cache — stored on first read, outliving deploys — so a reader who has
opened the box once has its headings offline for good, and a reader who never
did has none. That is the translated descriptions' bargain and the wrong one
for a document's OUTLINE, which is content-tier precisely so it rides the wave
beside the text it describes; the difference is that an outline is wanted by
the page already open and a shard is wanted by a control that is not.

**A panel that caps its list rather than itself cannot know where the fold
is.** The suggestions carried `max-height: min(24rem, 55vh)` and the dialog
carried nothing, so on a 900px window the list scrolled inside a panel with a
third of the page empty beneath it. The cap belongs to the dialog — the only
box that knows where the bottom of the viewport is — and the list takes what
the field and the foot leave it (`flex: 0 1 auto`, `min-block-size: 0`). `dvh`
and not `vh`, the two differing by the browser's own chrome on a phone.

**The empty panel is where the notation is taught, because it is the one state
with room to teach it.** A reader who opens the box sees a field and forty rems
of nothing until they type, and what that space held was a placeholder with two
examples crammed into it — `Jump to… (e.g. john 3:16, ccc 1234)`, truncated on
every phone, teaching two of the seven notations this corpus is addressed by.
The legend prints all seven, one row per work, the form on the trailing edge;
the placeholder goes back to naming the field, and the long string stays as the
accessible name, where brevity buys nothing and the examples still help. It
stands where the results will, so a reader learns in one open that the space
under the field is where the box answers.

**And it prints the form a reader TYPES, not the form the work prints.**
A citation is set as the work sets it, `Comp. 123`, which is what the home
page's chips still print; every row here is a string that goes into the field
above it, so it reads `comp 123`. Both resolve — `fold` lower-cases every title, heading and topic,
and `sectionForm` drops punctuation on top of that, which is why `ccc. 27` and
`CATECHISM 27` are one query — but a legend that prints the stop and the
capitals states a precision the box does not ask for, and the reader cannot
tell which characters were load-bearing. The two exceptions are punctuation
that MEANS something: Scripture keeps its separator, which is the chapter and
verse mark and is a comma in half these languages, and its abbreviation is
read by the book tables rather than by `sectionForm`. `specimens.test.ts` puts
every row of both forms back through `suggest()`.

**A specimen there goes into the FIELD, which is the one thing a page of
specimens cannot offer.** The home page leaves its three inert for a reason
that holds here too — `CCC 1234` is a meaningful citation, so an example that
navigated would drop a reader who is being taught a form into the middle of a
work they did not choose. Filling the field is not navigation: the list
answers under the reader's own eyes and they still press Enter. The rows are
`tabindex="-1"` like the suggestions, because focus belongs to the field and
Tab is spoken for, and nothing is unreachable by keyboard — every row is a
string the reader can type, which is the whole lesson.

**The query survives the close, and selecting it is what keeps a new one
cheap.** It was cleared on every open, so a reader who jumped to `John 3:16`
and came back for the next chapter retyped the book, and a reader whose
spelling missed retyped the whole attempt to fix one letter. Reopening now
finds the old text selected: the first character typed replaces it, while
Enter, the arrows and an edit to one letter all still have it — a browser's own
address bar, for the same two cases. It also settles who sees the legend, since
a box with a query in it shows results instead: the lesson meets a reader who
has not used the box and gets out of the way of everyone who has.

### A scope is a section word and a colon

**Naming the work you wanted used to destroy the query.** `catechism creation`
answered with NOTHING, measured — `KEYWORD_RE` folds a whole non-digit prefix
into one keyword, so `catechismcreation` matched no section, and
`titleSuggestions` folds the entire query, so `creation` was never matched on
its own either. The two vocabularies the box already had did not compose, and
the reader who knew most about where they were going was the one it served
worst.

**The operator is a colon after a word the box already knows, and that is why
it costs no vocabulary at all.** `SECTIONS` holds every section's name in
fourteen dictionaries, every siglum and every URL segment; `ccc: church` puts
that table on the left of a colon and changes nothing about it. **`in:` was the
proposal and it is an English word on an interface in thirty-seven languages** —
translating it means thirty-seven strings AND a parser accepting all of them at
once, since a Portuguese speaker reading English chrome still types `em:`, which
is the `cic` argument (a section word is accepted in every language, because the
interface language decides what a row is LABELLED and not what the reader
MEANT) arriving at the operator.

**The literal tiers only, and that is also what settles the collision with
Scripture.** `matchSections` falls back to a loose reading when nothing matches
literally, which is right for a keyword and wrong for a scope: a fuzzy match
would narrow a search to a work the reader never named. So an unrecognised left
side is not a filter and the query falls through — and in `jn 3:16` the left
side is `jn 3`, which folds to `jn3` and is no section's prefix. **No rule about
digits was needed**, because a chapter number stands left of a citation's colon
and no section name begins with one.

**A row is filed by its ADDRESS, not by its kind.** `heading` is one
`SuggestionKind` belonging to three sections, so a kind list could not tell a
title of the Code from a division of the Compendium of the Social Doctrine;
`sectionPathOf` takes the longest `SECTIONS.path` the href sits under, which
says so already and says so for every row a producer will ever add. The longest,
because exactly one pair nests — `/catechismus/compendium/1` is not the
Catechism's.

**It narrows the answer and never the search.** Every producer still runs over
the rest of the query and the rows are filtered afterwards, which is `suggest`'s
own rule about ranking rather than routing held to under a filter: `ccc: 27`
has to reach the tier for a query with NO keyword in it, and dispatching on the
section would never have got there.

**A colon with nothing after it is still a scope, and reading it as a keyword
was not merely equivalent.** `ccc:` used to reach the Catechism's landing page
through `sectionForm`, which drops the stop — so it looked right — while the
same string also went to `titleSuggestions`, whose loose tier answered it with
_Pastores Gregis_ and _Ut Unum Sint_. **The one state in which the reader has
unambiguously said WHERE they are looking was the state that answered from
somewhere else.** An armed scope with an empty term now answers with that
section's landing row and nothing else: the filter is on, and the row names the
work it is on.

**The scope is a TOKEN in the field, not text in it.** It is one recognised
value, always leading, never usefully edited a character at a time — and held
as text the reader could see `ccc:` with nothing to tell it from the words
beside it. The alternatives to lifting it out of the value are pixel tricks: an
overlay behind transparent input text, matched declaration for declaration to
the input's metrics and scrolled in step with it. **Lifting it out costs one
`input` handler and buys a real element** — one that can be styled, labelled,
announced and pressed. `typed` recomposes the two for `suggest` and the parser,
so a reader who pastes `ccc: church` gets what one who typed it gets; what is
NOT recomposed is the string the highlighter marks with, the scope being no
part of what any row matched.

**A chip names the WORK where it can and the reader's own word where it
cannot.** `cic:` is the Catechism and the Code at once, and a chip resolving it
to one of them is the confident guess `SECTIONS` refuses to make; a chip
reading both names, or all four of `c:`, is a paragraph. One section, its name;
several, what was typed.

**The chip is the one tabbable thing in the panel, and it can be because it
sits BEFORE the input.** Forward Tab out of an empty field still leaves the
modal — the escape hatch `onInputKeydown` declines to take — and Shift+Tab is
what reaches the chip; Backspace at position 0 takes it too, which is how every
token field behaves. `aria-describedby` points the field at it, because focus
never leaves the input and a token forming beside it would otherwise be
characters vanishing from the value with nothing said.

**The bordered box moved to a wrapper for it.** `.field` carries the border,
the radius and the ground, `:focus-within` carries the ring, and the input
inside is bare — the other three bordered fields on the site (`.menu-filter`,
`.doc-search`, `.topic-search`) keep those four declarations on the input
itself, because this is the only field with something in it that is not text.

**An empty scoped list is an answer, so it says so while the reader types.**
Everywhere else the box stays silent on no match, because nothing matching `chu`
is what typing looks like; a scope has a subject, and silence to `ccc: church`
reads as the filter having been ignored. Gated at two characters, which is where
`titleSuggestions` starts answering at all.

**`/quaestiones` gained a row in `SECTIONS` for this**, and the gap it closes
predates the scope: the topics were matchable by their titles and the page
listing them was not typeable at all. A scope is what made it worth fixing —
`quaestiones:` has to name something.

**The legend IS the listbox when there is nothing typed, and that is why it
costs no widget.** `suggest()` answers an empty query with no rows and the
legend renders only on an empty field with no scope armed, so the two lists are
mutually exclusive — one combobox whose options are "what you could type" until
the reader types, and "what you typed" afterwards. Same `active`, same
`optionId`, same `aria-activedescendant`, same id on whichever list is mounted,
same arrow keys. A row of chips above the field was the proposal; it wanted a
key the panel does not have, since Up/Down move the list, Tab completes, Enter
goes, Escape closes and Backspace at 0 drops the chip.

**What a row MEANS is what its keys follow from.** A suggestion is a
destination, so Enter goes and Tab completes. A legend row is a WORK, so Enter
arms it as a filter, Tab still completes — into its citation form — and an
ordinary printable character does both at once: it arms the row and is the
term's first letter. Highlight Bible, type `gene`, and the chip reads Bible
while the results are Genesis. The character is not prevented, which is the
whole trick; the test is `e.key.length === 1` with no Ctrl, Meta or Alt, so the
modifiers and Ctrl+A leave the row alone.

**The list of PLACES is not the list of NOTATIONS, which is two rows' worth of
difference.** `citationSpecimens` has seven rows because seven works have a
numbered unit to cite; the legend has nine, because `/preces` and
`/quaestiones` are places to look inside even though a prayer is cited by name
and a topic is cited not at all. Their citation cell is simply empty, and Tab
on them falls through to being the way out of the modal.

**A row does two things, so it is two buttons and the geometry is a grid.**
Pressing the row arms the work; pressing the citation puts that form in the
field, which is what the whole legend used to do. Neither can own the row's
background, so the `<li>` carries the padding, the radius, the hover and the
active marker. And the columns have to be columns — a reader reads the scope
prefixes or the citations straight down without reading the names — which
`space-between` cannot deliver, since it aligns to each row's own content. A
grid track is shared by the whole list.

**The prefix is the siglum where the work has one and its name where it has
none** — `ccc:` and `can:` against `prayers:` and `questions:`. Both are read by
`parseSectionFilter`, which matches a section word in any interface language, so
the name arrives translated for free and the abbreviation wins only for being
shorter to type. A document takes the name too: `dei verbum:` names no section.

**The weld between the two tables is a test, because it cannot be an import.**
`specimens.ts` feeds the legend and must not pull `suggest.ts` into the boot
payload, so it writes each section's path out by hand; `specimens.test.ts`
asserts against the exported `SECTION_PATHS` that every section has a row, and
that the parser reads every row's own prefix back as that row's own path. A
tenth section, or a siglum that stopped resolving, is then a failing test rather
than a chip that quietly filters nothing.

**A legend row and the armed chip take the work's own mark; a result row does
not, and the difference is whether the work is named in words.** On
`/bibliotheca` and `/schola` a glyph sits beside the work's name, which is what
makes it decoration — nothing is told apart by it and nothing is required to
understand it. A legend row is that same list, so the mark is free there;
`work-icons.ts` is the vocabulary and `sectionIcon` the lookup. A RESULT row
is the case those pages never have: its label is a heading, a paragraph number
or a topic, and the badge is the only thing saying which work it came out of.
A glyph there would be the sole carrier, which costs three things at once —
`Icon.svelte` enforces `aria-hidden` as its contract, so the option would
announce its label and no work; **it is the colour rule one channel over**
("if a pigment ever becomes the only thing saying which work a row is, it owes
WCAG 1.4.1 and cannot pay it"); and it asks a reader in a hurry to have
visited another page first.

**The chip's mark follows its label by the same test**: one section, its
glyph; several, none. There is no mark for "the Catechism or the Code", and
picking either is the guess `SECTIONS` refuses to make — so `cic:` is the word
alone, which is what it looks like. It is read from the PATH rather than
carried in from the row that was pressed, so a legend row and a `ccc:` typed
by hand cannot arrive at two different chips.

## `/documenta` is a filtered list, not a table of contents

**SO IT IS THE ONE PAGE THAT IS BOTH A LANDING PAGE AND A READING GRID**, and
`.reading-layout.index` is that third shape: the reading grid with the measure
replaced by `--index-width` and the apparatus lane taken out. Neither of the
other two fits — a title-and-chip row is not 62.4 characters of prose, and a
plain `.landing-column` has nowhere to stand the facets but above the list.
An index has no margin notes and no hanging section numbers, so the lane that
puts a reading column on the page's midline is 21.5rem declared for nothing.
The list track is the flexible one, capped by the container, because with no
lane to give way it is what has to yield between 80rem and 86rem.

**AND `--index-width` IS NOT `--landing-width`, THOUGH IT WAS FOR AN
AFTERNOON.** A landing page's width is its grid of shelves; an index's is its
row's FIRST LINE — title, date, author, kind — since everything below that
line is prose at its own measure and cannot help size the track. At 72rem the
extra 10rem had nothing left to spend itself on and every description sat in
an empty row, which is the apparatus lane's defect one column over. 62rem is
where a body's whole name stops trading places with a long title.

**THE VARIANT IS LOAD-BEARING AND WAS MISSING FOR A DAY** (2026-09-05). The
grid places `.content-column` and nothing else, so the `.landing-column` this
page took on 2026-09-04 was auto-placed — into track 1, the apparatus lane —
and the whole Magisterium was set in 344px with the 56rem reading track empty
beside it. **A mis-placed grid child is not an error**: every track is the
right shape to hold either child, nothing threw, `svelte-check` had nothing to
check, and the site has no visual regression suite. `layout-placement.test.ts`
reads the `class="…"` attributes under `src/routes/` and is what catches the
next one.

**A card is four stacked full-width blocks**: title with its kind chip at the
end of the line, date and author, the description, the subjects. The title row
is `.index-link`'s own title-and-chip shape, the one `/preces`,
`/doctores/summa` and `/colophon` share and the one the both-ends hover is
written for; the chips stay outside the anchor, being buttons.

**The description carries no max-width, and getting there took two wrong
answers** (2026-09-06, by direction). It was capped at 60ch inside a 62rem
track, so the right half of every row was empty — and twice that emptiness was
read as a PLACEMENT problem and filled by moving something into it. First
date, author and kind went up into a rail at the end of the title's line.
That left the same hole one line down, so the subject chips then went into a
second column beside the blurb. Each attempt cost something: the rail made
three facts read twice, once at a title's end and once as a column down the
page, and the chip column left the space under a short chip list empty
instead.

**It was a WIDTH problem, and the answer was the text having the width.** The
argument against it was that 62rem of 0.9rem sans is about 130 characters,
twice a measure — true, and it measures the wrong thing. `--measure-cpl`
governs running prose read line after line, and this is two or three sentences
under a title, read as a block to decide whether to open a document. **Nothing
in an index is set in the reading grid's measure.** With the description
filling the row there is no empty half left for anything to be moved into, and
the rows lost half their height on the way.

**The count prints a fraction only once there is one.** `298 / 298` is a ratio
saying nothing, and a page that opens with one reads as a state the reader is
already in. It sits on the rule that opens the list, too — it is a fact about
the rows, and between the tagline and the first of them it belonged to neither.

It grouped 272 documents into twelve collapsible pontificates with a sidebar of
anchors — the right shape for the sixteen Vatican II texts it was written for.
What an anchor list cannot express is the question a reader arrives with, which
is rarely "what did Leo XIII write" alone but some conjunction of who wrote it,
what kind it is, and what it is about.

**Across facets the values are AND-ed; within one it depends on the field's
arity.** A document has exactly one author and one kind, so AND-ing two of
either is an empty list by construction and the only reading a second choice
can carry is "and these as well". A subject is multi-valued, so _peace_ and
then _poverty_ has an obvious second reading — and between "31 ∪ 25" and "9 ∩",
only one is narrowing, which is the whole reason the panel replaced an anchor
list.

**So the counts come from two pools, and the difference is not an
inconsistency.** An author is counted against the OTHER facets, since counting
against the fully filtered set would show 0 beside every unselected author —
true, and useless. A subject is counted against everything, itself included,
because it AND-s: its number is exactly what survives the click. **A term
reading 34 that yields 2 on click is a lie the reader can see.**

**A subject that reaches 0 is dropped, not greyed out**, because one selection
zeroes most of a 58-term vocabulary and the dead rows would hide the ones that
still narrow. A selected term counts as live whatever its number, so filtering
can never make a filter unreachable.

**The filters are not in the URL, and that is a decision rather than an
omission.** Nothing in this app reads or writes the client-side URL, and a
shareable `?auctor=` would be the first query string in the system and would
want modelling in the worker, the sitemap, the route manifest and the beacon.
**A filter here is a way of looking at one page, not a place.**

**The panel is rendered twice**, in the aside and in a `<details>` below the
list, which is why its options are `aria-pressed` buttons rather than
checkboxes: two instances of a checkbox facet are two elements claiming one
`id`, and a `<label for>` then points at whichever the parser saw first.

**A body that has been renamed is one facet option, and its documents still say
what they said.** _Praedicate Evangelium_ made the Congregation for the Doctrine
of the Faith a Dicastery in 2022, and the facet showed the doctrinal office as
two options — 188 documents under one name, 12 under the other — so no click
reached its work whole. `documentAuthorKey` folds the pair for the facet only:
`pontiff_or_council` is corpus data and a document issued in 2016 still prints
the name it was issued under, because that is a fact about the document, and the
search box still reads the raw field so "Congregation" still finds them. **The
curia is renamed regularly, so this is a table that will grow.**

**The same body then did it to the kind facet, and the fix is the same file.**
The doctrinal office publishes under six `document_kind` values, so it held
six of the facet's thirteen rows for 8% of the corpus — and three of those
rows offered ONE document each, which is the argument the subject vocabulary's
46 singletons already lost: a facet row that narrows 298 titles to one is a
worse way of reaching it than its own name. `documentKindKey` keeps the two
forms that PARTITION — a declaration states what the Church holds, an
instruction directs what is to be done about it — and files the rest as
communications: the doctrinal notes and the _Considerations_ under
`cdf-letter`, the _Responsum ad Dubium_ under `cdf-declaration`, since a reply
declaring a teaching definitive is a declaration one paragraph long. **The
predicate and the facet have to fold the same way**, or a selection matches
nothing; the row's own chip does not fold at all, so a doctrinal note still
says it is one.

**Each facet is a `<details>`, and subject is the one closed.** Three facets
open at once is taller than the aside's scrollport — sixteen authors, the
kinds, and the whole vocabulary — so the panel's own height was what a reader
scrolled past to reach the axis they wanted. Subject is the tallest and the
axis a reader narrows WITH rather than arrives on. **Its `open` is read once
and is deliberately not `$derived`**: a reactive expression takes the
attribute back off the reader, so opening the cloud, picking a term and
unpicking it would shut the section under their cursor. A folded facet still
says what it is doing — the badge on its summary is the number of values
chosen inside it, drawn only when there is one.

**The author facet prints each pontificate's years, from a table and not from
the documents.** Twelve regnal names in reverse-chronological order asks the
reader to know the modern papacy by heart; `Leo XIII 1878–1903` places itself.
Deriving the span from the corpus is the obvious source and is **wrong in a way
that looks right** — first and last `promulgated` gives Leo XIII as 1878–1902,
short by the years in which he wrote nothing this corpus holds. A pontificate
is a fact about the world, so `pontificates.ts` is a table and the corpus
CHECKS it: every author's document span must fall inside its reign. The lookup
is `Object.hasOwn`, because the key is corpus data and a bare index answers for
`constructor`.

**The subject vocabulary is CLOSED, and it was open for exactly one day.** 232
free-form terms were useless at both ends: 46 carried one document each, where
a facet row that narrows 272 documents to one is a worse way of reaching it
than its own title, while the head held terms that partitioned nothing —
`centenary` says what OCCASIONED a document rather than what it treats, and
`Vatican II` restates the facets directly above it.

**Frequency is not the test; what the term names is.** `errors condemned` (37)
went and `Church and State` (42) stayed, because nearly every magisterial text
rejects something and the measurable form of that is a FLAT co-occurrence
profile, where `Church and State` concentrates. What took its place is the
errors themselves, derived by scanning the descriptions and then **reading
every hit**: `gnosticism` scored 3 and is 1, because two hits were the string
`agnosticism`. **Counting a word proposes a candidate; reading the sentence
decides it.**

**The 35 region names were the closest call.** `Mexico` and `Hungary` are real
subjects a reader wants; they are dropped from the FACET and not from the site,
since every one is in the description the search box reads. That is the whole
argument for cutting hard — a facet row is for BROWSING an axis.

**Merging one term into another is a semantic act and it is easy to get
wrong.** Four merges were right about the commonest document carrying the term
and wrong about the rest: `technology` into `ecology` filed the
artificial-intelligence encyclical under ecology. Check a merge against every
document it touches rather than against the archetype.

**The closed vocabulary still does not translate.** Every coinage would be
thirty-four inventions rather than thirty-four lookups, and an i18n key each
would be near two thousand strings nobody has asked for.

**Three things about that file fail the sync rather than warning**: a tag
outside the vocabulary (a synonym splits a term's documents in two with neither
half findable), a slug naming no document in the build (a filter offering one
fewer term looks exactly like a corpus holding one fewer document), and two
terms differing only in case.

**The subject facet is a tag cloud, which is what retired the truncation.** 58
stacked rows is ~1,390px in a 17rem aside; flowing them inline and saying each
one's weight with its type size fits the whole vocabulary in ~480px. The
measurements that decided the shape:

- **Size follows the LIVE count**, so the cloud pictures what is left, and
  **alphabetical order is what pays for the reflow** — widths move, the
  sequence never does.
- **The scale renormalises against the current extremes**, over positive counts
  only: pinning it to the unfiltered range collapses every chip to the floor
  after one click, and letting a 0 set the minimum silently inflates every
  other chip.
- **Square root**, pinned by a test: linear crowds half the vocabulary into the
  bottom third and log over-expands the low end.
- **The size range is a balance knob, not a compactness one** — sweeping it
  moves the cloud's height by ~185px, because chip COUNT dominates. So the
  ceiling is chosen by what the cloud sits beside, and only the top is
  adjustable, since the CSS clamps to `--font-size-min`.
- **Colour carries the weight as well**, mixed from the same one number so the
  two channels cannot drift apart, and between two tokens rather than toward a
  literal black, since in dark mode `--color-text` is the light one.

**The search box is what made the cut safe, and it is one function with the
highlighter.** `matchesQuery` shares `highlight`'s fold and tiers, **so a
document is on the results list exactly when the highlighter has something to
mark on it** — every row can show why it is a row, and a matcher written
separately would drift invisibly in the direction that matters. It AND-s its
tokens where `highlight` ORs them, because marking is generous and filtering is
strict.

**The tags ship as one fetched file and not in the boot index**: the index
every reader downloads before first paint answers "does this address exist",
and a tag answers neither existence nor address. Nor are they merged onto the
manifests, which would write the same strings into all ten editions of Laudato
Si'.
