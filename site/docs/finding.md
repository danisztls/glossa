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
preamble to them. The home page's doors mirror the bar's order, and the two must
not disagree.

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

**The section takes the whole column**, and carried `.landing-measure` on the
`<section>` itself until the same day. That capped it at 40rem, so its heading
rule stopped two-thirds of the way across a page whose every other rule ran the
full width, and the last section read as though it belonged to a narrower
document. The measure belongs on the PARAGRAPHS, which is where every other
section on the page carries it.

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
anything — so a banner carries no line of small type under it. **The trigger is
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

**It holds a catalogue AND a borrowing record**, which is what makes it more
than an index: where the reader left off and their marks, then the shelves.
`/signata` remains the full view of the second.

**AND IT IS THE ONLY PAGE THAT HOLDS THE RECORD** (2026-09-06). The home page
carried "continue reading" too, capped at four against this page's uncapped
list, on the reasoning that an entrance may show a little of what the record
holds. What that produced was a section EMPTY for every reader who has not been
here before — so the one page a stranger arrives at was arranged around a state
only a returning reader has — while the returning reader got a truncated copy of
a list one click away. **A surface only a returning reader can fill belongs on
the page that is about returning.** `home.continueReading` became
`library.continueReading` in the same commit, the second key on that page
renamed rather than re-translated (`nav.library` was `home.works`).

**No page below the bar declares a SENTENCE of its own, and one declares a
name.** Library's shelves, the home page's doors and the `<head>` all read the
key the destination page is already titled and described by
(`scripts/route-titles.mjs`). A catalogue that paraphrased the pages it lists
would be a second set of sentences to translate into 37 languages and a second
set to keep true. The one exception is named below, and it is a name.

**THE SHELVES ARE THE HOME PAGE'S DOOR GRID** (2026-09-06) — cards across the
column, each carrying the glyph `/schola` already assigns that work, where they
were six stacked blocks down 72rem: a column of headings with an ocean to the
right of each. Two departures from the doors, both forced. A door is one
card-wide anchor and a shelf cannot be, because two shelves hold their own
links and an anchor inside an anchor is ambiguous before it is invalid — so the
heading is the target and the card is the ground it stands on. And the track
floor is 17rem against the doors' 15, which is where the Learn card's two
titles stop taking three lines each.

**The Learn shelf is TWO cards and the Summa has none.** The Compendium of the
Catechism stood as a row beside the Catechism and the two led to one index —
`/catechismus` holds both, which the sentence under them has always said — so
the pair is one card named for the pair. That name (`ccc.landing.pairTitle`) is
the single string on this page written FOR it: `/schola` lists the two works
separately and the `<head>` titles `/catechismus` after the Catechism alone, so
no existing key means the pair. `/doctores` keeps its shelf and its caveat; what
went is the row underneath that jumped past the caveat into an unrevised Summa.

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

**Date, author and kind ride the title's line.** They were a second line under
it, which was right in a 56rem column and wrong the moment the page got a wider
one: the description is capped at its own 60ch, so the right half of every row
was empty while three facts that would have filled it sat stacked underneath.
In the rail they cost 298 rows a line each and read down the page as a column.
They are inside the anchor, which is what `.index-link` already intends; the
subject chips stay outside it, being buttons.

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
