# Finding something

Three surfaces: the nav bar and `/bibliotheca`, which are for a reader who has
no address; the jump box, which completes one; and `/documenta`, which filters a
shelf. None of them is a full-text search.

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
guide to what each work IS, what a citation of it looks like, what the chrome
around the text does, and the orders for reading the Church has set out. The
Catechism is therefore the one work here with no door of its own, and nothing
became unreachable — the guide's first row opens it, Library shelves it, and the
jump box completes `CCC 1`.

**Learn is LAST on the bar, not first.** It led on the argument that a newcomer
needs the leftmost item; what that missed is that the four before it are the
works themselves, so a bar opening with a page about the others reads as a
preamble to them. The home page mirrored that order in four doors of its own
until 2026-09-06, when the doors became the catalogue; the bar is the only list
of pages now, which is one fewer place for two orders to disagree.

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
are not new judgments: `/schola` records the direction that a specimen teaches a
SHAPE and so must not be a link (§`/schola` is a guide), and that same page
describes the settings menu and the language switcher without linking to them,
because a control in the header of every page is not an address. Three is what it
takes to show the notations differ — a book with chapter and verse, a siglum with
a paragraph number, a code cited by canon — and a fourth of a shape already on the
row would be a longer row teaching nothing more. The Bible's is derived from the
reader's own citation grammar for the reason `/schola`'s is; the others are
gated on the work being in the build.

**The middle way in was four doors and is the catalogue itself** (2026-09-06, by
direction). The doors were Bible, Prayers, Library and Learn — two works a reader
wants most, plus two PAGES, one of whose entire content was "the catalogue is one
click that way". A home page whose answer to _what is here_ is a link to the
answer charges a click for a list that fits on a screen, and the two works it did
name were there for being popular rather than for any argument the file could
state. So the seven cards `/bibliotheca` draws are drawn here: one list
(`$lib/shelves.ts`), one card (`ShelfCard.svelte`), one grid (`.shelf-grid` in
`components.css`), and no copy of any of the three to keep true when a work is
ingested. Learn and the Library are named in the nav bar, which is where a page
rather than a work belongs.

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

## `/schola` is a guide, and its examples are specimens

**The reference system is the part nothing else on the site teaches.** The
corpus is addressed by number — `CCC 1`, `Comp. 1`, `CSDC 1`, `Can. 1`,
`STh I, 1` — and `suggest.ts` reads every one of those notations back. A reader
who has never seen a citation of the Catechism does not know that the number is
a PARAGRAPH running unbroken from the first page to the last, or that the Code
numbers canons rather than pages, and no page said so. That is
`audiences.md` §5's "vocabulary of the corpus itself" stated plainly: per work,
one sentence on what it is, one on what its numbered unit is called, and a
worked example.

**AN EXAMPLE IS A SHAPE, NOT A REFERENCE** (2026-09-05, by direction). Each was
a live link — `CCC 1` to paragraph 1, `Can. 1` to canon 1 — put through the same
existence predicate the jump box asks (`cccParagraphExists`,
`compendiumQuestionExists`, `summaQuestionExists`, …) so a specimen could never 404. That was a sound guard on the wrong thing. A reader working down a
CATALOGUE was being offered a door into the middle of a work they had not
chosen; and `CCC 1` is a meaningful citation, so a column of lowest numbers read
as eight recommendations rather than as eight examples of a form.

**So the numbers are representative and the chips are inert**: four figures for
a work with thousands of paragraphs, three for a code of canons, two for the
sections of a document. The shape of the number is part of what the specimen
teaches, `jumpbox.placeholder` already showed `ccc 1234` for that reason, and
`schola.books.lede` now sends the reader to type one into the jump box — which
is the one place a notation is worth having. Prayers get no specimen at all,
because they have no notation: they are cited by name, which the sentence under
that row says.

**Four indexes went with the predicates.** `/schola` primed `bible`, `ccc`,
`compendium`, `prayer` and `summa` to decide whether to underline eight words;
it primes `bible` alone now, which it genuinely needs for the Scripture
specimen's abbreviation and for the reading suggestion's book names. The check
at the foot of `index-priming.test.ts` only catches priming too LITTLE, so
over-priming outlives the code that caused it unless it is pruned by hand.

**The Bible's example is DERIVED and the others are sigla.** The book's
abbreviation comes from this language's own citation table (`bookAbbrev`),
falling back to the reader's edition's name for the book, and the separator from
the same grammar the parser reads — so a Portuguese reader is shown `Jo 3,16`
and an English one `Jn 3:16`. `CSDC` and `STh` are the works' own sigla and are
written down; `CCC`, `Comp.` and `Can.` come from the dictionary keys the
editions print. **The OSIS id is lower-case here** (`john`), and both readers
answer `undefined` for the other spelling, so the wrong case draws no example
rather than erring.

**The list is FLAT, one row per work, where it was six shelves with three works
nested inside them.** Nesting is right for a catalogue and wrong for a guide: a
nested work took its parent's definition and had no citation form of its own,
and the Compendium of the Catechism, the Compendium of the Social Doctrine and
the Summa are precisely the three a newcomer has heard named and cannot place.

**The chrome gets a section of its own, named by its own controls.** The search
box, Library, the language and edition menus, comparison, the apparatus, marks,
the settings panel, the calendar and offline reading — each headed by the key
that control is already labelled by (`jumpbox.short`, `settings.label`,
`compare.enter`, …), so a reader who reads a row and goes looking for the
control finds the same word, and a translated interface cannot disagree with its
own guide. Only the sentence under each is new writing.

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
the notation chips are `--color-text-muted` — the colour of the "Cited as"
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
mid-clause. `†` is the site's existing mark for "there is a source here" and has
a one-codepoint font of its own that is already precached; `‡` is not reachable
at any price. It is superscripted by `vertical-align` and not by the glyph — a
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
public-domain works newly cut from Commons scans and no master is kept:
faithful crops with no retouching, so `assets/README.md`'s recorded URL,
SHA-256 and crop box reproduce each one exactly. **A colour painting must not
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
card is `ShelfCard.svelte` and the bed is `.shelf-grid` in `components.css`,
and neither page holds a copy of any of the three.

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
reads exactly like the other seven — name, glyph, and `/signata`'s own tagline —
and is there whether or not the reader has marked anything (2026-09-06; it was
hidden on an empty store until then). A catalogue names what the site has, and
hiding the one door to marking until a reader has already found marking
elsewhere shuts it against the only person looking for it; the empty case is
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
