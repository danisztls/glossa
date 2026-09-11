# The reading page

Type, lanes, and how an apparatus is offered without moving the text.

## Type and theme

**Theme is independent axes, not one list.** `auto / light / dark / sepia` made
one value answer two questions. Sepia yields to dark because no dark-sepia
palette exists, and it is **suspended, not cleared** — a dark control that
silently does nothing is more surprising than an inert sepia row that says why.

**A control belongs on the surface its effect is visible on.** The reading size
was a row in the header's settings panel, which is on every page; what
it moves is `.reading-text` and the column measured against it, which exists on
exactly the routes that render a reading bar. It is in that bar now
(`TypeMenu`), and off on the index routes it does not reach — two of which
hold their list in `.content-column` and so would have slid in and out under
type that never changed.

**A measured column moves when the size does, so the size control cannot be a
stepper.** The column is 62.4 characters wide and the grid centres it, so it
runs 24.6rem to 55.3rem across the range and every press slid the panel about
25px sideways; five stops on a rail (`FONT_SIZES`) is one click.

**Two faces, split on register rather than on authorship.** What the corpus
wrote is EB Garamond wherever it stands — running text, a work's title, a
division's name, a prayer group's heading out of `structure.json` — including
on a chrome surface that is otherwise sans. What we wrote is Garamond only
where it is read at length, and Source Sans wherever it is scanned or operated:
authorship alone gave the colophon and `/schola` one answer and a filter's
heading the same one.

**Our heading is a label and our paragraph is not**, so a surface of ours that
is read through — the colophon, `/schola`, a topic's note, the error pages —
sets its prose in the text face and keeps its headings in the interface one.
The colophon reached that arrangement first, by giving its section heads
`.label-micro`; the rule is what the other three were missing. It does not
reach the corpus's own headings, which clause one governs: a work's title and a
division's name are its words, not a label over them.

**A heading takes the face of the surface it is on**, which is why `base.css`
declares no family for `h1`–`h6`. A blanket rule there outranks `.reading-text`,
so the work's own section heads went on standing in Garamond after a reader
switched the reading region to the sans face — a heading that cannot follow its
surface is the one thing a rule per element cannot express. What still names a
face is the exception: the work's words on a chrome surface, a reading page's
`h1` or an index row's title.

**And the reader may set the work in the other one.** The split above is the
default, not a claim that Garamond is legible to everybody — fine hairlines,
old-style figures and a modest x-height are what some readers cannot manage,
and the sans is on the device already. `TypeMenu` offers it.

**A face's numbers are measured at wght 400, and a variable font's default
instance is not always 400.** Source Sans 3's default master is wght 200, so
measuring its file as loaded returns an advance 5% narrow and an ink height 1%
short — EB Garamond's default is 400, so only one of the pair ever needs
instantiating, which is what makes the error survive a spot check.
`scripts/face-metrics.py` does the instantiating, and is where all of it is
derived: the advance, the two ink measurements that bracket
`--face-size-adjust`, and the frequency table under both. The "ink area" those
brackets are stated in is the BOUNDING BOX and not the outline's own area,
which is three times smaller and would put the bracket somewhere else
entirely.

**Whether a script has two faces is a question about the script.** Latin and
Cyrillic do and this site ships both cuts; Han's pair is Ming and Gothic, named
now for the reading regions as it already was for the chrome, out of the
reader's own system faces because a Han webfont is megabytes and is never
coming. Arabic's axis is naskh against kufi, which is not the same question in
another alphabet — so the row is hidden there and the family rules exclude it,
and **both halves are needed**: the preference is one per reader and the panel
is one per page, so hiding the row alone would switch Amiri out with nothing on
screen saying why.

**Matching two faces is not matching their x-heights**, which is the standard
advice and is wrong for these two. EB Garamond is an old-style — small
x-height, long extenders — so at matched x-heights its caps and ascenders stand
20% taller than the sans's and the serif becomes the face that reads large. The
normaliser is a frequency-weighted mean **ink height** over the corpus, the
vertical twin of `--prose-char-advance` and measured the same way: it weighs
every part of the letter by how often a reader meets it, and needs no judgement
about which part counts.

**A second face is five numbers, not a family.** The measure is denominated in
the reading font, so the face carries its own advance
(`--prose-char-advance`, measured over the corpus the way the first was:
0.4121 against 0.3771 when the method was re-run on EB Garamond as a control)
and the initial's three sizes are derived from its cap height, ascent and
descent. Those were literals inside the derivations until there was a second
face to feed them.

**A token that a descendant overrides is not a token the column reads.** A
custom property is substituted for the element it is declared on, so
`--content-width` — declared on `:root` — resolves against `:root`'s advance
and nothing written further down can move it. That is why the face is an
attribute on `<html>`, and it is the same fact `/preces` uses in the other
direction to set prayers larger without widening their column.

**Which is how a whole mechanism ran for a year without running.** Every
per-script advance in `direction.css` — Cyrillic, Arabic, Han, and the Latin
reset guarding them — was written on the reading region, a descendant of the
grid that sizes the column, so no edition in any script was ever set at its own
measure. The comments described the columns they were meant to produce. The
width is declared on `.reading-layout` as well as `:root` now, and the scripts
reach it with `:has()`; `reading-face.test.ts` fails on a measure token set
anywhere the width is not computed.

**A repair whose evidence is a comment needs a test, not a better comment.**
Nothing here threw, logged or looked broken: a column of the wrong width is a
column. The rule the test states is the general one — an input to a derived
custom property may only be set on an element that derived value is declared
for — and it is worth more than the four rules it caught.

**An initial is sized in lines, so the number of lines it may take is decided
by whose lines they are.** Where a wrap is the viewport's, three lines is a
flourish; where the source printed the break — verse — the indent lands on
lines a reader is meant to read as new, so a prayer set in verse takes the
one-line versal instead (`.drop-cap-versal`, dropcaps.css, which derives its
two constants from the faces' real vertical metrics rather than by eye). The
property that makes it safe is not the size but the box: at one line the float
ends inside the `<p>` that opened it, and a float only reaches what follows it.

**Both halves of that are a property of the PRAYER, never of the block.** A
verse prayer takes an initial at every block — a stanza, then `Let us pray;`,
then a collect are three movements the source set apart — and a prose prayer
only at its first, a second paragraph of one run being no second beginning.
Sizing block by block instead is what puts a three-line cap on `Let us pray;`,
whose float then overflows four words into the collect and indents it.

**And the initial takes its letter out of the apparatus's own words when they
open the line.** Refusing a contended opening sounds safer and is decided by
where somebody else's quotation happens to start: three of the four glossed
English prayers open on their first lemma (`I believe in God`, `Hail Mary`),
so it withheld the initial from the Creed and the Ave while the Pater, whose
lemma begins four characters in, kept one. The quoted run keeps its kind, so it
still lights when the note opens — the highlight simply begins after the
versal, which is where a printed edition begins it.

**A prayer's credit is a block, not a last line, and the curation is what says
so.** `(Pope Francis, Amoris Laetitia, 325)` renders in `.copyright-notice`'s
three signals — sans, smaller, muted — because it is the same kind of statement
about a prayer that the notice makes about a work; the space above it is what
sets it apart, and it is wider than the gap between the prayer's own blocks,
since a credit run at that distance reads as a stanza that changed voice. The
site never recognises one: `kind: 'attribution'` arrives from the corpus, where
a parenthesised line is proof of nothing (`docs/corpus-schema.md`).

**A label is not glossed by its letter.** The prayers print `V.`/`R.` and
`D.`/`C.` for the same two parts, so the explanation behind each hangs off the
block's kind — `TermGloss`, the same dotted underline `/calendarium` teaches on
`Memorial`, with `lang` declared because a reading column says the CONTENT
language and the gloss is chrome.

**A scoped rule cannot reach into a child component, and the failure is
silent.** Svelte scopes an ancestor selector with a hard class, so `.division p`
stops matching once that element is rendered by a shared component — no error,
no unused-selector warning, just spacing that quietly changes. Pass a custom
property the child reads, or `:global()` the ancestor alone.

## Three lanes

**The reading page is three lanes, and the text sits on the page's midline.**
Centring the reading column and the aside AS A UNIT put the text 10.75rem left
of centre, with the apparatus set in whatever slack that left — one side a
declared column and the other leftovers, which reads as both off-centre and
crowded. The grid declares an apparatus lane the width of the aside and its
gutter, so both sides are 21.5rem.

**Each lane carries its own gutter rather than sharing a `column-gap`**,
because a gap is one number for every gutter in a grid: a collapsed apparatus
lane would still be charged 4.5rem and the reading measure would pay it.

**The two margins are mirror images, written as a calculation.** Both tokens
name the aside's (`--aside-gap`, `--aside-width`), so the symmetry is one
calculation rather than a second copy of 17rem. A gloss is marked as apparatus
by the sans face, the smaller size and the muted colour; the width was not
doing that work, only leaving 4.5rem of the lane empty beside an aside that
fills its own.

**The note's width is derived from the margin there actually is.** The reading
column grows with the reader's size setting, so a fixed displacement walked off
the left edge at the sizes where the reader can least afford it — and a media
query cannot see it, since it reads the root font size and `--reading-scale`
does not touch that. The width is a ceiling CSS clamps against
`--sidenote-room`.

**Compare mode takes the margin back**, claimed by `CompareGrid` while mounted;
the reader's compare _preference_ would be the wrong signal, since a work with
one edition has it on and still reads in one column. The lane is declared on
every reading page, occupied or not, because that is what centres the column.

## The apparatus

**A citation's source stays in the margin; a gloss does not, and that asymmetry
is the whole of the argument.** The Catechism's 3,698 citations average 26
characters and cost the text nothing. `.margin-note` was calibrated on Challoner
at the length of a sentence, and Straubinger and Martini gloss a verse in an
essay — clamping those to an incipit kept the column anchored by turning the
gutter into **a table of contents for an apparatus**. So a gloss is reached the
way a commentary is: the mark opens a card, or a dialog past `CARD_MAX_CHARS`,
at every width. **What broke was never the arrangement — it was applying it to
an apparatus longer than the text it hangs on.** What that buys is that the
marker means ONE thing everywhere: `aria-expanded` is always a claim we can
keep, and there is no second control and no second state to explain.

**A citation opens over the page rather than inside the sentence.** It was a
boxed span in the flow, so opening it reflowed the words around it and the
sentence being read moved while it was being read. It is a native `popover`
anchored to its marker, and it is the card `LinkPreview` already shows, because
a reader who has learned what a small box over the page means should not have
to learn a second one.

**An apparatus must not move the text, and that includes the apparatus saying
"this one".** The highlight lit on a marker was a background plus
`padding-inline`, which is inline size a superscript did not have. It is an
outline now — drawn outside the border box, taking no space.

**Where there is a margin, the click has a better answer than the card.** What
a reader cannot get any other way is which of the notes stacked in the gutter
belongs to the number just passed. Above the breakpoint the marker drops
`popovertarget` and a click lights the note; hover stopped opening the card
there for the same reason.

**The card opens on hover as well, and a preview can open on top of it.** A
footnote marker names a source without saying what it is, which is the case
`LinkPreview` already makes for a link, so the two share their delays and their
pointer test rather than each choosing numbers. `byHover` keeps the click
meaningful. What blocked a preview inside a citation was the top layer, not
nesting; making the overlay a popover puts both in the layer, `manual` rather
than `auto`, since an `auto` popover light-dismisses the one it was opened from.

**A tap peeks at a citation, and the marker that decides which links those
are names NAVIGATION rather than citations.** It was an allowlist of two CSS
classes on the argument that a hover is free and a tap is not — right about the
gesture, wrong about the instrument: citations come out of about a dozen
generators and two of them wore a class the list knew, so a prayer's "See
also", a "Cited in" chip, a paragraph's `related` numbers and the `†` that
sources a reading order peeked on a desktop and on a phone did not.
`citation-links.ts` inverts it into the shape the hover path already had — a
link previews unless a marker says otherwise — and gives the marker a third
state, since the jump box and the reading picks want the free glance under a
cursor and the plain one-tap navigation under a thumb, which `off` and absent
between them cannot say. What stays `off` is what names the page the reader is
standing on: a crumb, prev/next, a sidebar table of contents.

**And the last refusal in `PreviewTarget` was a marker wearing a type's
clothes.** It declined a whole prayer and an unanchored document on the rule
that a link with no anchor is navigation rather than a quotable unit. That rule
was true of the two surfaces where such links are actually emitted — the
document index and the prayer index — and false of the address itself: a reader
who marks the Our Father has marked a unit, and the bookmark library is where
they meet it again. What settled it was the library dropping its excerpt (below):
the two kinds it could not preview were the two whose rows then had a citation
and nothing behind them. So the type widened to every `Address`, and the two
index pages say `"hover"` — which is what they would have said all along had
anything been able to preview their rows. **A refusal in a type is invisible to
the surface it is protecting**, and the cost of finding out is a tap that peeks
where a reader meant to go.

**The library asks for no text at all now, and the excerpt is why it used to.**
`/signata` set two clamped lines of each marked passage under its citation, so
opening it fetched one content file per mark — eighty marks, eighty passages, to
print forty words of each. Every row is a citation in the form `/schola`
teaches (`citation-label.ts`, off the index tier, no fetch), and the text
arrives for the one row the reader peeks at. **The excerpt was also what made
`"hover"` right there**, since a row already said what it was; removing it is
what moved those rows back into the citation default.

**A section of that library is a work TYPE, and the Magisterium had been an
exception.** Every document got a heading of its own, borrowed from the "Cited
in" panel's rule that a work is named once and its references listed under it.
The two panels are answering different questions: that one shows what cites one
passage, where the library shows a reader's whole history, so a reader who marks
widely rather than deeply met a page of headings with a single row under each —
a shelf per book, and the shelves outnumbering the books on them. **A grouping
that reads well over one work's references does not survive being applied to
everything a person has ever marked.** What the per-document headings were
really carrying is that one document's marks belong together, which is an
ORDERING and now lives in `compareDocuments`: the documents in the order
`/documenta` lists them, newest first, and inside each the whole document ahead
of its sections. The tie-break on the date is load-bearing — three Vatican II
constitutions were promulgated on 1964-11-21, and a date alone interleaves their
sections into one run of numbers.

**A heading resolved by a prefix test lets the next section reach the reader
nameless, and it did so twice.** `/signata` titled its sections with a chain of
`if`s ending in `documentGroupTitle(key.slice('document:'.length))`, so a key
matching nothing above was sliced to the empty string and drew an empty `h2`
over the reader's own marks: `canonLaw` from the day the Code was ingested, and
`topics` from the day `/quaestiones` shipped, each added by someone reading a
chain that looked exhaustive. The group key is a closed union now and the titles
are a `Record` over it, which is the same move `menu-filter.ts`'s
`UI_LANG_NAMES` made for the language list: **a fallback that can name anything
cannot report that it named nothing**, so the second occurrence is as silent as
the first.

**A panel placed by measurement is a family.** `.floating-panel` holds the
declarations three components had each written out and `floating.ts` holds where
they go. What deliberately did not move is everything that differs — top layer
or z-index, tracking or dismissing — because a modifier for each is the shape
this codebase avoids.

**`NoteCard` is the whole of what the two apparatuses share** — placement,
hover intent, popover state, highlight — and each component keeps what it
actually is: a number against a letter, a source against a gloss. That deleted
the last of the caller-side bookkeeping, since `$props.id()` is per instance
where both had kept sets of open markers keyed by block and position.

**And it is what let the Bible's comparison stop stripping the apparatus** —
the one place comparing cost the reader something the single column gave them,
and precisely where Challoner is often explaining why his verse says what the
column beside it does not. A gloss opening as a block could not have been
restored there: it would push one column out of alignment with the other.

**A prayer's commentary survives comparison; a chapter's still does not, and
the difference is the lane.** The Bible's notes go because two reading columns
plus the aside leave about 10rem of the 17rem the notes live in — there is
nowhere to set them. A prayer's apparatus never used that lane: its mark is
inline and its card is anchored to the mark, so a second column costs it
nothing, and suppressing it bought only a switch reading "on" over a text with
no marks in it. Both columns are glossed now, each out of its OWN edition's
commentary, which is what keying the apparatus on the edition was always for —
a lemma quotes the wording of the edition it was written on, so only the Latin
Ave's notes can anchor in the Latin column. The marks do not correspond across
a row, since the Catechism quotes eight clauses of the English Our Father and
five of the Hungarian; that is each edition's own apparatus rather than a
misalignment.

**And the placement had to leave the renderer for that to be possible.** A
compare cell IS a printed line, and anchoring is not a per-line question: the
cursor walks the prayer once, so a placement taken over one line loses a
quotation the edition set across a break and can find the wrong occurrence of a
phrase the prayer repeats. The route places over the whole prayer
(`prayerTexts`) and each cell renders its own line, looking its marks up by
`line.n` — the one number that means the same thing in a column of thirty lines
and in a cell of one.

**A headword is set twice on paper and once on a screen.** A printed annotated
Bible repeats the lemma at the head of the note because the note is at the foot
of the page; on screen the note opens FROM the words. The verse marks it
instead.

**The words are found by matching backwards from the marker, and refusing is a
first-class answer.** The marker is where the source set it, so the words are
the run immediately before it, where a search would find the wrong occurrence
of any phrase a verse repeats. That matches 1,805 of the Douay's 1,909 lemmas
and **none of Martini's 18,658**, whose markers all sit at position 0 and whose
lemma prints its own elision. So the note keeps its headword wherever the verse
could not mark it, carried by one prop.

**The join goes with the headword it joined, and the capital takes its place.**
A source stores the punctuation between the two as the note's first characters —
`Salomão` heads the note and `, como os outros reis do oriente` continues it —
so a panel that stops printing the headword opens on a stray comma and then on
a lower-case word; 1,084 of the 1,377 headwords Matos Soares marks carry a
join, and the Douay's notes, written as sentences, carry none. `afterHeadword`
drops the run of punctuation and nothing else — an opening quote or parenthesis
is the note's own, and the letter raised is the first one after it — because
what on paper is the second half of a line the reader has just read is on
screen the whole of what the card says. **One letter, and no word rewritten**:
a note that is nothing but its join keeps it rather than opening empty, and a
script with no capitals is left as it stands.

**On paper the mark is permanent, because nothing there opens** — a dotted
underline rather than the wash. **And the card is rendered even for a note that
opens a dialog, because of PAPER**: a closed popover is `display: none`, so
once the margin copy was gone the card was the only copy of the apparatus left
in the document.

**A commentary is anchored to the verse and offered only beside the edition it
annotates.** The lemma was measured before it was rejected as the anchor: only
27,201 of 45,747 notes carry one and 25,078 of those quote the Douay verbatim,
so it would anchor 55% of the apparatus — and **a marker run with holes in it
is worse than no run.** Inline marks sit at the quoted words where the order
makes it safe (a catena is printed in reading order, so the search carries a
cursor and refuses the nine repeats it cannot place); the 40% with no headword
keep a mark at the verse's end. **The two sets partition the verse's notes** —
no note behind two marks and none behind none — which is the property to check,
since a leak would lose a fifth of the apparatus with nothing erroring.

**The two kinds of mark are two glyphs, because 9,594 verses carry both and
printed the same one for each.** `†` after the words a note quotes, `‡` at the
end of a verse whose notes name no words in it — so the reader can see, before
pressing, whether the card will light anything. **The mark reports PLACEMENT,
not whether the note has a lemma**, and the distinction is what makes it
truthful: 2,332 headwords are refused by the Douay's own wording and 59 are
elided catchwords, and all of them fall to the `‡` alongside the 18,466 that
never had a headword. A mark that claimed "no lemma" would be wrong 2,391 times;
"nothing here to light" is checkable by pressing it. The prayers' apparatus has
no trailing mark at all, so a `‡` can never appear on a prayer.

**And the glyph settles the headword as well as the light.** A `†` carries
exactly one note — two notes cannot share a span, the cursor having moved past
the first — and the verse is lighting the run that note quotes, so a card
printing the headword repeats the words under the reader's own finger. A `‡`
gathers several notes that name nothing in the text, and there the headword is
what divides one authority's remark from the next. The edition's rule, one
apparatus over, arrived at from the other side.

**A default outlives the argument that set it.** `lemmaMarked` came in with the
prayers, defaulted false, and carried a comment saying a verse's card may hold
several notes at one mark — written two days after an inline mark stopped
holding more than one, and left standing while the marks moved onto the quoted
words. Nothing erred and nothing looked wrong: a headword printed above a lit
run reads as a considered difference between the two apparatuses, which is what
kept it there for nine days.

**`‡` cost 100 bytes and a change of source font, which is the correction worth
carrying.** It had been recorded as unreachable at any price — measured over
Google's subsets, which partition a font by Unicode RANGE and drop a glyph
outside every range they define even where the original has it. Google ships
U+2021 in none of its 14 Source Sans 3 files; Adobe's release has it, so
`source-sans-3-marks.woff2` is now subset from the release and the recipe in
`fonts.css` names a URL rather than a path under `node_modules`. **Ask what the
font has, never what the subset ships.** The two glyphs have the identical
advance and bounding box at every weight, so which one a mark draws cannot move
a word.
**Attribution is parsed into a field, and the vocabulary is closed.** Splitting
"… Witham" off the end of someone else's sentence is an editorial act and also
the whole value of a catena, so the vocabulary is derived and then READ, a tail
outside it stays in the text with no field, and `--attributions` reports the
residue.

**Nothing goes in the margin at any width for a commentary**, which is where
the _Glossa Ordinaria_ arrangement stops: it assumes an apparatus smaller than
the text it hangs on, and a chapter of Haydock runs to 4,690 characters at the
median against 52,496 at its worst.

## The Bible's chrome

**The sidebar's chips are sized to the screen they have to fit.** 73 books in
three columns came to ~1,060px against the ~960 a 1080p viewport leaves the
aside, so the contents opened already scrolled on the commonest desktop there
is. Five numbers came down together; the text did not. **And the chips narrowed
to four columns**, pinned rather than fitted, because four is a decision about
how tall the list may be and `auto-fill` decides that from a floor it is not
being told about.

**The chapter panel opens OUT OF its chip and takes over naming the book.**
Growing the open cell to `max-content` was the right question in the wrong
place: a chip that changes width on click is a second thing moving under the
cursor, and it widened towards the very panel that had room to print the name
properly. Three things follow from covering the chip: the title is a BUTTON,
since the chip is what closes the panel; the panel takes the chip's measured
width as a floor, or the chip sticks out either side; and it takes a second
8rem floor for the title, which a 1-chapter book's 2rem column would otherwise
squeeze. **The chip outranks the viewport margin** — covering it is the design,
so the 1rem screen clearance applies only in the slack.

**An argument that is only the chapter's own rubrics is not printed.** Matos
Soares writes his as the chapter's rubrics joined with spaces, and 1,131 of his
1,279 are exactly the deepest-level headings of that chapter, so the reader met
the same words twice an inch apart. The 148 that do not match keep their
argument, because they earn it. **It is a display rule and not a correction**:
the source prints this, so the corpus keeps it.

## Plates

**A plate opens over the page, and the argument is arithmetic rather than
taste.** A phone is served the 800px rendition for a 390px slot, so the reader
is already holding twice the detail on their screen with no way to reach it.
Opening the viewer shows the file the page already downloaded, read off
`currentSrc`: no request, no wait, no spinner, and it works offline exactly
where the plate did.

**Zooming buys a bigger file, and only zooming does** (2026-09-05).
`PLATE_DETAIL_WIDTH` is 2000px — the masters' own floor, since the narrowest
engraving crops to 2248px — and it is deliberately not in `PLATE_WIDTHS`, so no
`srcset` can offer it and no phone can be handed 1.2 MB to draw two inches of
reading column. It is fetched on the first zoom of a viewer and never on open.

**The zoom does not wait for it.** The stage goes to 2000px the moment the
gesture lands, drawing the file in hand upscaled, and swaps in the real one
when it decodes — so the arrival sharpens rather than moves, and the point the
reader aimed at stays put. If it never arrives (offline, or a corpus derived
before the width existed) the ceiling falls back to the loaded file's own
natural width, which is exactly what this view did before.

**Two states, not a continuous zoom.** Fit, and the best available file's own
natural width, which is the point past which the browser invents pixels with
nothing coming to replace them. It is offered only where there is headroom to
gain — and that test is why the rendition exists: fit on a tall desktop is
~1155px of a 1200px file, so the control magnified by 4%, read as broken, and
was not drawn at all. Desktop readers had no zoom. At 2000 they have 1.7x.

**The engraver's quality figure stops descending here.** The ladder softens as
width grows (q60 at 800, q58 at 1200) because artifacts shrink on screen with
the rendition; the zoom rendition is the one file drawn at 1:1, where that
argument is exactly reversed, so it takes q58 again rather than less. Measured
against its own render it reaches SSIM 0.989–0.994 where the 1200 reaches
0.967–0.984.

**It is a second offline shelf, not more of the first.** `illustrations-detail`
is priced and offered beside `illustrations` rather than folded into it: the
zoom renditions cost several times the two a chapter draws, and a reader who
wants the pictures on a flight is not necessarily a reader who expects to zoom
into them there.

**It is the one modal on a site whose whole apparatus vocabulary is popovers.**
A citation floats beside the text because it glosses it; the picture IS the
thing being read. `showModal()` then pays for itself twice — top layer,
`::backdrop`, inert background, focus trap, Escape and the Android back button
are all native.

**The surround is dark in all three appearances, so its chrome is written in
fixed light values** rather than in the palette. `--color-bg` stays
load-bearing behind the plate itself, because `--plate-blend` is `multiply` on
light and sepia and multiplying a scan's paper into a dark backdrop yields a
black square.

**The fit size is computed in JS, and the reason is a CSS trap worth
recording.** Wrapping the picture in a control — which is what makes it a tab
stop at all — puts a shrink-to-fit box of `auto` height between it and the
stage, so `max-block-size: 100%` resolves to nothing, silently.

**A caption is not a control** (2026-09-11). The plate's whole title was the
button that opened its credit — the title in small caps, the `i` inside the
same element — on the argument that a disclosure trigger must be named by its
visible text and never by a label saying something else. That argument is
sound and the button was still wrong: nothing about a line of caption type
says it can be pressed, the hit area ran the width of the words, and the one
mark the site draws for "there is more to say about this" was inside the
control rather than being it. The title is type again and the `i` after it is
the trigger, which is `HintNote` — the same component every other surface with
a line that qualifies rather than says draws. The accessible name it loses from
its own content it takes from `plates.about`, which names the plate, because a
chapter of Genesis renders twenty-seven of them and a reader listing the buttons
on the page is owed which picture each belongs to.

**What was left of the caption trigger became a variant, not an exception.**
`CreditCard` had two sets of clothes for one mechanism, and one of them was a
line of type with a glyph inside it; that one is now the mark every note on the
site draws. The other is real and stays: a landing page's painting has no
caption row — one under a banner would be a row of empty page with a glyph in
it — so its `i` sits ON the picture at the trailing end, where a `currentColor`
outline over Raphael's sky is not reliably visible in any theme, and wears
`.menu-trigger`'s square at a smaller size. **What separates the two is what
the `i` sits on**, which is a fact about the surface and not about the credit,
so it is `HintNote`'s variant and `CreditCard` only passes it down.

## Stepping between references

**The arrow, WASD and HJKL keys step from one reference number to the next,
and the number they land on is parked at the reading line** — a third of the
way down the viewport, the same `REFERENCE_LINE` the scroll spy asks "where is
the reader looking" with. The step focuses the number with `preventScroll` and
then scrolls the page itself, because focus scrolls with `nearest` semantics:
left to the browser, a run of steps moves nothing until the cursor reaches an
edge and then pins each target _against_ that edge, with the text it names off
screen. The target is absolute rather than a delta, which is what makes a
held-down key behave: each keystroke re-measures against wherever the page has
got to and retargets, instead of stacking deltas onto a position the animation
has already left.

**The animation is a critically damped spring, not `behavior: 'smooth'`.** The
native one is a fixed curve, and a second `scrollTo` while it is running
restarts it — so a held key, repeating thirty times a second, began a fresh
animation from a standing start on every frame, and what the reader felt was a
stack of little lurches rather than a glide. A spring has no curve to restart:
there is only a point being pulled toward wherever the target now is, and both
its position and its velocity stay continuous when that target moves.
Critically damped is the specific choice — the fastest approach that does not
overshoot, and a reading page that sailed past the paragraph and came back
would be worse than a hard jump. `$lib/smooth-scroll` solves the equation in
closed form rather than integrating it, so a dropped frame or a tab that wakes
up half a second later cannot destabilise it, and `omega` is the one number to
turn.

It yields to the reader rather than fighting them, and by measurement rather
than by listener: if the page is not where the animation last put it, someone
else is scrolling — a wheel, a trackpad, a scrollbar drag, Space, Page Down, a
find-in-page match — and it abandons the glide where it stands. One check
catches every input; cancelling on `wheel` and `touchstart` would have missed
the keys, which are the likeliest thing to arrive while a keyboard reader is
stepping.

**The scroll is smooth, and one line elsewhere was quietly killing it.** A
sidebar keeping its own highlighted row visible used
`scrollIntoView({ block: 'nearest' })`, which scrolls every scrollable
ancestor up to and including the viewport — and performing a scroll on a box
aborts any smooth scroll already running on it, whether or not the position
actually changes. `StructureSidebarToc`'s current row is `spy.current` on half
the routes that render it, so it fires _while_ the page is moving: a step that
crossed a section boundary started gliding and then stopped dead. It reads as
the site being janky rather than as anything to do with a table of contents,
which is why it survived being written twice.

`$lib/reveal-row` is the answer and the place the argument lives: it nudges
one container's `scrollTop`, which cannot move the page, and it finds that
container by measuring `overflow-y` up the ancestor chain rather than by
naming a class — `StructureSidebarToc` renders into the aside, into the
reading bar's panel and into `/documenta`'s inline contents, and a list of
selectors would have been a fourth place to keep in step. The walk stops at
`<html>`, so the answer is never the viewport. `IndexSidebarToc` had avoided
`scrollIntoView` from the start for the neighbouring reason — a spy that moved
the window it was measuring would feed straight back into itself — and
`TocMenu` and `JumpBox` for a third: the document behind an open modal is
inert but still scrollable, so arrowing through a list would move the page the
reader comes back to.

**The spring answers three movements now, and the two later ones are capped.**
It was written for the keyboard step, whose distance is one reference number;
the return-to-top button and every same-page fragment jump reach it through
`glideScrollTo`, whose distance is however far the reader has read. A spring
settles in a constant time whatever the distance, so peak speed is
`ω·distance/e` and scales without limit — over a whole part of the Catechism
that is a strobe of text nobody reads, at a frame cost nobody asked for. The
surplus is jumped and the last `GLIDE_VIEWPORTS` (1.5) are glided, which is
the whole of `glideStart`. A viewport and a half rather than one: at exactly
one screen the reader sees a page they have not read scroll past and nothing
of where they were, which is a cut with a delay in front of it.

**A fragment jump is REPLAYED, never intercepted, and that is what makes it
safe.** A table of contents row on `/documenta/[slug]` — the whole document on
one page, so its sidebar links `#s{n}` — is not only a scroll: it is a history
entry, a `hashchange`, a focus move, and, where the router recognises it, an
update to `page.url`. Taking the click means owning every one, and the two
that cannot be owned cheaply are the ones that matter. A `history.pushState`
written by hand copies `sveltekit:history` onto the new entry, so Back lands on
an index SvelteKit reads as no movement at all; and `goto()`, the sanctioned way
to stay in sync, runs the whole navigation machinery — `load`, a `root.$set`
over the tree — for a scroll, which is the cost §The liturgical calendar
measured down to the font restyle it provoked. So `$lib/anchor-scroll` lets the
browser jump exactly as it did, notes where the page was on the way into the
click, and on the scroll that follows puts it back and glides. Everything above
happens untouched, and every guess in it fails toward no animation — which is
the behaviour it replaced — rather than toward a jump that lands elsewhere.

**The rewind is invisible by the event loop's own ordering, not by luck.** A
`scroll` event is dispatched in the rendering update's scroll steps, which run
before that frame's animation callbacks and before it paints; the frame that
would have shown the page at the target shows it back at the origin instead.
Both writes — the rewind and the glide's first — are inside that one handler,
so nothing is ever painted in two places. The click also cancels any spring
still running, or the spring's own per-frame writes would be read as the jump.

**A COMPUTED SCROLL REPORTS ITS DESTINATION AND NOTHING ON THE WAY, and the
glide is what made that a requirement.** The scroll spy answers "where is the
reader"; while the site is performing the scroll the reader already chose the
answer, and every offset between is a question nobody asked. Answering them is
not free on the one page where the spy drives a tree:
`StructureSidebarToc` renders only the branch containing the current row, so
each intermediate answer mounts and unmounts a subtree, lays its text out for
the first time — which is where a `unicode-range` subset is requested and
`font-display: swap` then restyles the document — and forces a layout from
`revealRow`. A jump across forty sections cost one of those. A glide across the
same forty cost forty, and `/documenta/[slug]` visibly reflowed under a moving
viewport. `springScrolling()` is the gate, and the spy keeps its frame alive
rather than dropping it: the measurement is taken on the first frame after the
animation stops, however it stopped, because the spring's last write can land
exactly where the page already was and fire no scroll event to wake it.

**THE UNIT A READER ASKED FOR IS REPORTED AT THE ASKING, and the gate above is
why it had to be.** With the spy quiet through the travel, the sidebar held its
old row for the whole half second and then snapped — the table of contents
trailing the page it describes, which is the lag the gate bought. So
`anchor-scroll` announces the fragment on the click (`onFragmentAsked`) and the
spy adopts it before the browser has moved anything. It is not a shortcut for
the measurement but a better answer than one: the fragment names the unit
outright, where the reference line infers a unit from a viewport offset, and
the reader is at §42 from the moment they ask for it whatever the scrollport is
doing.

It also OUTRANKS the arrival measurement, for one measurement only. The jump
parks the unit's top just under the reading bar, well above a line a third of
the way down the viewport — so on a section shorter than the gap between them
the line falls into the next unit, and the measurement taken on arrival answers
§43 to a reader who asked for §42. That was always true and was over before
anyone saw it; at the end of a glide it is a visible flip. The request stands
until the reader moves the page themselves.

**THE GLIDE FOLLOWS THE ELEMENT, NOT THE OFFSET THE ELEMENT STOOD AT.** The
browser computes a fragment's landing offset once, before any of the travel has
happened, and half a second is long enough for the page to stop agreeing with
it — a font arriving and swapping re-measures every line above the target. Two
things then go wrong and the second is worse: the reader lands at a
neighbouring heading, and the browser's own scroll anchoring compensates for
the shift by moving the scrollport, which `DRIFT_TOLERANCE` reads as somebody
else scrolling, so the spring abandons the glide mid-flight. `glideScrollToElement`
takes the element with the browser's offset for it, stores the DIFFERENCE
between the two, and re-derives the target every frame: layout moving the
element retargets the spring and is forgiven the drift, while the reader moving
the page still takes it over. The caller keeps handing over the browser's own
number rather than re-deriving it, so `scroll-padding-top` and any
`scroll-margin` on the element are accounted for without this code knowing they
exist.

**AND THE SIDEBAR STOPPED RESIZING, which is what was moving.** `.reading-aside`
was `max-height` with `overflow-y: auto` and no reserved scrollbar lane, and it
renders only the branch holding the current row — so crossing a section changed
the list's height, which crossed the cap, which brought a scrollbar in, which
took its width out of the content box and re-wrapped every row; and where an
article is shorter than its sidebar the grid row sizes to the aside, so the
resizing could reach the document. It is a fixed `height` with
`scrollbar-gutter: stable` now, which costs nothing visible — the element draws
no background and no border, so the surplus beside a short table of contents is
empty page either way. `html` had the same reservation and the same argument
(base.css) since the day `/scriptura` was caught stepping sideways; the two
other scroll containers on the page had never been given it.

**Only a link to the page the reader is on arms it.** A cross-page deep link
scrolls too — SvelteKit calls `scrollIntoView()` once the new route has
rendered — and gliding there would animate a page the reader has not seen yet,
from a top they never occupied. `samePageFragment` is that gate and the
three-frame deadline is its second half, short enough that a route resolving
from cache cannot land inside it.

## Focus mode

**It is `print.css`'s hidden list, read as a screen instead of as paper.**
`data-zen` on `<html>` — a fifth axis beside `data-theme`, `data-sepia`,
`data-oled` and `data-mono` — and `styles/zen.css` is the whole behaviour.
There was nothing to invent about which selectors those are: print has been
removing the same chrome for as long as the site has had any, and argues each
one in place.

**Three are deliberately not repeated, and each is the difference between the
two media.** `.unit-nav` stays — print drops it because paper cannot be
followed anywhere, but on a screen prev/next IS reading, and a mode that
strands the reader at the end of a unit has hidden the text rather than the
distractions. `.reading-bar` stays, emptied rather than hidden, because it
carries the way back out. `.breadcrumb` stays, which is print's own exception
too, for a reason that survives the change of medium: with the header and the
sidebar gone it is the only thing left saying which chapter of which work this
is.

**Nothing moves, which is what makes it safe to leave on.** Everything the
mode hides it hides with `opacity: 0` and `visibility: hidden` together, never
with `display: none`: the pair paints nothing and still holds every box, so the
header keeps its height, the reading bar keeps the height it publishes as
`--reading-bar-height` — which `scroll-padding-top` and both asides are
measured against — and the reader's line stays on the pixel it was on. The
first version used `display: none` and jumped the page twice per toggle: the
header collapsed and pulled the document up by its own height, and the one
control left in the bar slid to the inline start. A mode that changed the
measure would be worse still, rebreaking every line in the text.

`opacity` alone would not do. A fully transparent control still takes Tab,
still takes a click and is still announced; `visibility: hidden` is what
removes it from the tab order, from hit testing and from the accessibility
tree, and it is the half that keeps the box.

**Every rule is gated on `:has(.zen-toggle)`, and the gate is the feature.**
The preference outlives a navigation and the only control that clears it is
that button, so on a page without one a reader who left the mode on would meet
a site with no header, no footer and nothing that put them back. One selector
makes "the way out is always on screen" true rather than usually true, and
costs less than a route table that would then have to be kept in step.

It read `:has(.reading-bar)` until a bar could carry no toggle, which was the
same claim while every bar rendered one. `/calendarium/liturgia` renders a bar
and passes `zen={false}`: the mode takes away the furniture standing around a
text, and that page has no aside, no comparison, no unit nav and no
breadcrumb — all it could hide is the header the reader needs to reach another
day, which is the phone argument below at every width. Under the old gate that
page would have been stripped anyway, with the button that undoes it gone; a
gate names the control it depends on, not the container that usually holds it.
The prop is therefore off rather than merely hidden, and a reader who chose the
mode elsewhere meets this page whole.

**It stops at 641px, and the button stops at 640px.** On a phone the sidebar
and the second column are already gone, so all the mode has left to take away
is the header, the footer and the bar's own controls — two strips at the ends
of a screen the reader scrolls past in one flick. `ZenToggle` hides its button
below the width where the help sheet stops drawing its keyboard section, and
`zen.css` gates every rule above the complementary one — the same pair, in px
for the reason `Help` gives. Gating the
RULES and not only the button is the `:has(.zen-toggle)` argument at a
different width: the preference outlives the viewport, so a reader who chose
focus mode at a desk and opened the site on a phone would otherwise meet a
page with no header, no footer and no visible way out. The attribute is inert
there rather than cleared, so the desk it was chosen on still has it.

**The header is emptied leaf by leaf, and the trap is worth stating because
the site relies on its inverse elsewhere.** `JumpBox` and `Help` each
render trigger and `<dialog>` as siblings inside the control row, so hiding the
triggers leaves the dialogs alone. Hiding an ancestor would not, and neither
property gets you out of it: `display: none` takes a descendant dialog out of
the box tree — exactly how `layout.css` hides `TocMenu`'s panel with its
wrapper — and `visibility` inherits through the top layer, so a dialog in a
hidden subtree opens invisibly. Either way `/`, Ctrl+K and `?` are still
listening at the window and opening a modal nobody can see: `showModal()`
succeeds, the page goes inert, nothing errors.

The reading bar is the one container this file hides that holds a dialog —
`TocMenu`'s panel is a direct child, beside its trigger — so its rule excludes
`dialog` and `[popover]` in the `:not()` rather than overriding them
afterwards. An override has to out-specify whatever it is fighting, which puts
a safety net one careless selector away from losing silently.

**`Escape` leaves the mode and carries a flag saying when it may.**
`ShortcutContext.zen` is the fourth fact the resolver cannot read off a
keystroke; without it the key would be claimed on every page at all times, and
a key that quietly swallows something is dearer than one that quietly does
nothing. The ordering is the part to preserve — the check sits after the
overlay guard, so a dialog opened inside focus mode still closes on `Escape`
rather than dismissing the mode and standing there.

**It is `zen` in the code and "focus" on screen.** The editors that popularised
the arrangement supply the name a developer searches for; this site publishes
the Catechism and the Code of Canon Law, and a Buddhist school of meditation is
not the register its chrome is written in. The strings are in the fourteen
dictionaries holding the full chrome — the rest are partial by design and
already fall back to English for `ui.close`, so translating this one would draw
a second completeness boundary.

## What a highlight can do

A selection anywhere in the reading text raises a small popover — bookmark,
copy, copy link — over the words. `SelectionMenu.svelte`, mounted once in
`+layout.svelte`, and `selection.ts` for the half worth testing.

**A selection is not an address, and a bookmark is an address and nothing
else.** So the highlight has to be resolved to one before it can be marked, and
the resolution is the unit it lies in — the same unit its number would have
bookmarked had the reader clicked the number instead. What that loses is the
exact words, deliberately: an offset into the Clementina names a different
phrase in the Douay-Rheims and no phrase at all in the Portuguese, and a
bookmark that stops following the reader across editions is the one property
the store was built to have (`bookmarks.svelte.ts`). What it gains is that
nothing else in the system had to learn about highlights — the library, the
ordering, the edition-following and the idempotent save all work on a row that
looks like every other row.

**THE BOOKMARK KEEPS THE WORDS TOO, and that is a deliberate break with "an
address and nothing else."** Worth stating plainly, because the rule it breaks
is a good one and was argued for: an address-only row is a few dozen bytes and
means the same in every edition, and a quote spends both — it is as long as the
highlight, and it is frozen in the edition it was taken from, so a passage
marked in the Clementina still reads as Latin after the reader switches to
Portuguese. What earns it is that a highlight is a different ACT from pressing
a number. A reader who marks CCC 27 is marking the paragraph; a reader who
draws a line under one sentence of it has said something the address cannot
hold, and re-deriving the paragraph throws away the only part they chose.

**AND THE WASH IS THE SENTENCE, NOT THE PARAGRAPH, WHERE IT CAN BE.** Storing
the words is what makes this possible, and it is the whole reason a reader
would want them stored: a mark over the paragraph a sentence sits in is the
best an address can do, and the reader chose the sentence. `QuoteMarks` is a
ladder, and every rung is a real answer — same edition and the words found,
wash the words; different edition, wash the unit; words not found, wash the
unit; no Custom Highlight API, wash the unit. **The bottom rung is what the
site did before any of this existed**, so every way the search can decline
lands on a mark that was already correct, which is what makes searching safe
here at all.

**A different edition is not a failed search, and the two must not be
confused.** The words of a Latin bookmark are not in the Portuguese text and
must not be hunted for there — a fold loose enough to cross a translation is
loose enough to mark a sentence nobody chose. The edition is compared first,
and only the text the words came from is searched.

**The matcher is `lemma.ts`'s fold, and `lemma.ts` refuses to be a search**,
which is worth reconciling rather than quietly departing from. There the anchor
is the marker, and searching would pick the wrong occurrence of a repeated
phrase with nothing to say it had; here the reader's selection is gone and only
its text survives, so there is nothing to match backwards from. What makes it
tolerable is what is being looked for — a run of prose the reader chose, not an
editor's two-word headword — and what it costs when wrong: the same words,
marked somewhere else in the same paragraph. The first occurrence is taken.

**`CSS.highlights` rather than markup, and that decides itself.** Registering
ranges paints without touching the DOM, so it cannot fight Svelte over nodes
Svelte owns; wrapping the words in a `<mark>` would mean editing the output of
`ProseBlocks`, `AnnotatedText`, `PrayerBlocks` and every other renderer — from
outside, where the next render undoes it, or from inside, which is a segment
threaded through all of them. The costs are that a highlight pseudo-element
does not print and that an old browser shows the unit wash, and both land on a
rung of the ladder above.

**Both marks at once would be one claim too many**, so the block wash stands
down for a unit whose words were marked (`[data-quote-marked]`) — and that rule
is in a GLOBAL sheet even for `.verse.bookmarked`, which belongs to one route.
The attribute is written at runtime and appears in no template, so Svelte's
compiler sees a selector nothing in the component can match and prunes the
rule. **A style keyed on an attribute set at runtime cannot live in a scoped
block.**

**The address still decides everything derived, and the quote decides
nothing.** The citation, the title, the ordering, the section a row files
under, and whether the row resolves at all are read off the address exactly as
before; both new fields are optional and every reader of a bookmark works
without them. A mark made from a unit number carries neither, and so does every
row written before this existed.

**`quotedFrom` is not bookkeeping.** An unattributed frozen quote sitting under
a citation that re-derives is a claim about the reader's CURRENT text — the row
would show one edition's words under another edition's citation and say
nothing. It answers that in two ways, and only one of them is visible: the
`lang` declared on the blockquote, so the face, the hyphenation and the
direction follow the text rather than the interface; and the edition's name
beside the quote, **where naming it tells the reader anything**.

**Which is the Bible alone.** Everywhere else one language is one edition —
`EditionMenu` has always said so, and shows a language where it shows the Bible
a title — so the name printed under the quote is the WORK's, and the work is
what the section heading over the row and the citation on it have both already
said: "Compendium of the Social Doctrine of the Church" under a heading reading
Social Doctrine, "Dilexit Nos" under a row reading `Dilexit Nos 2`. The field is
still stored for every quote, being what the wash compares and what carries the
language. Where it is printed it runs on after the words — `— Douay-Rheims`,
the shape `quoteWithCitation` writes to the clipboard — rather than under them:
a block attribution spent a second line on two words, on a page whose other
rows are one line each.

**A quote is clamped, and the ellipsis is the point.** `QUOTE_MAX` keeps the
whole store inside one localStorage key when a reader has marked a hundred
passages — a highlight can be a page, and a page a row is a quota error the
reader meets as a bookmark that silently did not save. Cut at a word boundary
and marked, because a quotation truncated in silence is a misquotation.

**And the same mark says where the READER cut, which is the other way a stored
quotation misquotes.** A row is read cold, months later, under a citation and
no text: a phrase taken out of the middle of verse 3 looks like the whole of
verse 3, and the reader has no way to tell. `elideQuote` puts an ellipsis on
each end the highlight cut into — measured against the UNIT the bookmark names,
which makes it a fact about the selection rather than a judgement about prose,
and means a whole verse quoted whole carries no marks though the chapter runs
on either side of it. Apparatus comes out before the measurement, or a verse
whose number precedes its first word would be cut into at the head every time.

**The library's copy is marked and the clipboard's is not.** A row is read
where it stands and has to say what it is; a copied quotation is pasted into a
sentence the reader is writing, where the elisions are theirs to place. The
same two artifacts the `?ed=` pin distinguishes, one grain down.

**The ellipsis costs the wash nothing, and that is not luck**: `locateQuote`
folds both sides through `lemma.ts`'s `fold`, which keeps letters and digits
and drops everything else, so a mark that is not a word cannot be searched for.
A test pins it, the alternative being a wash that silently fell back to the
unit for every excerpt.

**The precision goes into the COPY instead, which is where it costs nothing.**
The clipboard takes exactly the words on screen, in the edition on screen, with
the unit's citation under them; that happens now rather than being stored, so
there is no later reader for it to be wrong for. It is the one thing this
panel does that the unit number's cannot, and it is the reason the panel is
worth having beyond a second way to bookmark.

**A Bible highlight drawn across verses saves the passage, and no other work's
does.** `hrefFor` already writes `?v=3-5#v3` for a cited extent, so the range
costs nothing and says what the reader meant. Nothing else has a way to spell
"sections 4 through 6", and minting one for this gesture would put a new
address shape into the sitemap, the edge worker and the route manifest — so
every other work saves the unit the highlight STARTED in, which is also the
right answer wherever an extent is meaningless: a highlight dragged across
compare mode's two columns, or from the end of one work's page into another's.

**THE ENDS OF A RANGE DO NOT NAME THE UNITS AT ITS ENDS**, which is what made
a highlight drawn across three verses bookmark the first one. A selection that
finishes on an element boundary reports its `endContainer` as the PARENT with
an offset, so walking up from it found `.reading-text` — whose `data-unit-href`
is the page's own address — and a bare chapter has no verse for `spanAddress`
to close a passage at. It degraded to the start, silently and plausibly, and
every unit test passed because the addresses being compared were right. The
units are read out of the range's own CONTENTS instead: a clone carries every
partially covered ancestor, so a highlight starting mid-verse still brings that
verse with it, and the common ancestor — the surface, the element that was
being mistaken for a unit — is not in it at all. **Ask a range what it
contains, never what its boundaries touch.**

**A route opts in by saying what its units are, not by rendering anything.**
`data-unit-href` on the element that already computes that address for the
bookmark wash, and the panel walks up from the selection to the nearest one.
Every reading route sets text; a component each of them had to mount is one
edit per route to add the feature and one more route that quietly does without
it. The same reasoning `LinkPreview` records for being one delegated
listener rather than a wrapper per link.

**Every `.reading-text` carries the page's own address as well**, so nearest
wins and the matter BETWEEN the units still resolves — a chapter's
introduction, a heading between two verses, the appendix a document prints with
no number on it. Those have no address of their own, and the fallback is
exactly what the page's own bookmark control already saves. The two surfaces
deliberately left unmarked are apparatus about the text rather than the text:
the wording a canon replaced, behind its disclosure, and compare mode's shared
row under a pair of cells.

**A cell in compare mode is its own `.reading-text`, which is what makes the
divider a boundary.** The panel requires both ends of a selection to be on one
surface, so a highlight dragged across the columns raises nothing rather than
claiming a passage from a text the reader was only half reading.

**The quotation is the text with the apparatus cut out of it.** A verse's span
contains its own reference number, so the raw text of a whole-verse selection
is `3In the beginning…` — a stray digit welded to the first word of every
quotation the site would ever produce. Footnote and commentary markers are the
same problem one superscript at a time, and a margin note is a whole sentence
of somebody else's apparatus landing mid-paragraph. `APPARATUS_SELECTOR` names
the five classes; the removal is done on a clone of the range, so nothing
leaves the page.

**It opens on `pointerup` and closes on `selectionchange`, which is not a
symmetry worth tidying.** Opening on every selection change would drag the
panel along under the pointer for the length of a sentence being drawn;
`selectionchange` is used for the one thing pointerup cannot see, a highlight
the reader has cleared. Pressing a button in the panel would collapse the
selection out from under it, so the panel prevents `mousedown` — which is also
what a native selection callout does.

**An `auto` popover shown from inside a pointerup is opened and shut in one
gesture, and the panel did not appear at all until it was deferred by a task.**
Light dismiss is not a listener that can be out-ordered: the browser records
the pointerDOWN target and acts at pointerUP, after dispatch, hiding every auto
popover that is not an ancestor of what was pressed. The comparison is the part
that surprises — at pointerdown there was nothing open, so the recorded target
is null, and at pointerup the clicked-popover ancestor of a run of prose is
null too. Two nulls compare equal, so the algorithm reads a panel that did not
exist when the gesture began as the one being dismissed. It is also why a
`popovertarget` button has never needed this: that toggles on `click`, which is
dispatched after pointerup, when light dismiss has already run and found
nothing. `setTimeout` is the whole fix, and it pays for a second thing on the
way — Firefox settles `selectionchange` after pointerup, so a selection read
inside the gesture can still be the previous one. **Reach for the deferral
whenever a popover is opened from a pointer event that is not `click`.**

**The link carries three things, and the address is only the first.** Copy
link writes the unit's canonical URL, then `?ed=` for the edition the words
were read in (`site/docs/addresses.md` on why that is a decoration and not an
address), then a native text directive — `#s3:~:text=…` — naming the words
themselves. A link to `#s3` alone opens whichever edition the recipient
prefers, at a section that may be a page long, and says nothing about the
sentence that was worth sending.

**The browser does the finding, which is the whole reason the directive is
worth having**: nothing stored, no offset scheme to version, no mark for this
site to paint, and a highlight that survives the text being re-chunked or the
markup around it changing. What it costs is that the quotation travels IN the
URL — a shared link now carries the sentence it points at — and that a browser
without support lands on the unit and marks nothing, which is a failure this
can afford now that arriving at a unit marks the unit. Being find-the-text
rather than an offset is also why the edition is pinned beside it: the same
words, in the same edition.

**A long quotation is written as its two ends, never truncated to its first.**
`textStart,textEnd` pins the span where a prefix pins only its opening, and it
keeps the link to something a person can paste into a message. `-`, `,` and
`&` delimit the directive, so they are percent-encoded; `encodeURIComponent`
covers the last two and leaves the hyphen, which is unreserved in a URL and
reserved in here.

**`::target-text` is restyled, and it is not decoration.** The UA pairs a
yellow wash with near-black text — a highlighter pen dropped on a printed book
against the sepia ground, and on the dark one the passage going invisible at
the moment it is pointed at. It takes the site's own arriving accent instead,
one shade stronger than `.unit-highlighted` because it sits under a run of text
rather than behind a block.

**Compare mode pins no edition**, deliberately and for now: `CompareGrid` is
handed languages and labels rather than work ids, so a highlight in a column
copies a link with the words and no `?ed=`. That degrades to an ordinary good
link, which is why it was not worth two props and every caller.

**Desktop only, and the reason is that the platform is already there.** A touch
screen raises its own selection callout over the words, with its own copy
button and its own handles, drawn in a layer this page cannot reach; a second
panel would be fighting it for the same strip of screen and losing. `canHover()`
is the gate, shared with the hover card, so the two cannot come to disagree
about what a pointer is.

**The row of icons is `styles/menus.css` and not either component's.** This
panel is `AnchorMenu` with View dropped — a reader who highlighted a sentence is
looking at it, so an eye offering to take them to the address they are standing
on is a control that does nothing — and the three that remain must not arrive
at two sizes, two gaps and two hovers. Svelte's scoped classes stop at the
component boundary, so a class two components render is either global or
silently unstyled in one of them.

**It cost no new interface strings.** The panel says what the unit number's
panel says, in the `anchor.*` and `bookmark.*` keys every dictionary already
carries. A surface that does what an existing surface does
should be checked for this before it is written: the alternative here was
inventing "Selection actions" forty times to name a panel whose actions are the
same actions.
