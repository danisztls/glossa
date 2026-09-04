# The reading page

Type, lanes, and how an apparatus is offered without moving the text.

## Type and theme

**Theme is independent axes, not one list.** `auto / light / dark / sepia` made
one value answer two questions. Sepia yields to dark because no dark-sepia
palette exists, and it is **suspended, not cleared** — a dark control that
silently does nothing is more surprising than an inert sepia row that says why.

**Two faces, split on authorship rather than on chrome-versus-content.** What
the work wrote is EB Garamond, what we wrote _about_ the work is Source Sans. A
heading is a title until it says otherwise.

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
The viewer shows the file the page already downloaded, read off `currentSrc`:
no request, no wait, no spinner, and it works offline exactly where the plate
did.

**A detail rendition is a separate decision and is deliberately not taken** —
1800–2000px from the masters is ~140 MB on top of a 110 MB deploy, and
per-reader it is free only until someone taps.

**Two states, not a continuous zoom.** Fit, and the file's own natural width,
which is the point past which the browser invents pixels. It is offered only
where there is headroom to gain: a control that magnifies by 4% reads as broken
rather than as finished.

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

**Subtractive by construction, which is what makes it safe to leave on.**
Hiding `.reading-aside` changes no geometry at all — the aside is a grid child
and the track it sat in is declared by `grid-template-columns`, so the column
stays on the midline with the apparatus lane still opposite it. A mode that
widened the measure would change where every line breaks, and the reader would
lose their place twice on every toggle.

**Every rule is gated on `:has(.reading-bar)`, and the gate is the feature.**
The preference outlives a navigation and the only control that clears it is in
the bar, so on a page with no bar a reader who left it on would meet a site
with no header, no footer and nothing that put them back. One selector makes
"the way out is always on screen" true rather than usually true, and costs less
than a route table that would then have to be kept in step.

**The header is emptied leaf by leaf and NOT `display: none`, and the trap is
worth stating because the site relies on its inverse elsewhere.** `JumpBox` and
`Shortcuts` each render trigger and `<dialog>` as siblings inside the control
row. `display: none` on an ancestor takes the dialog out of the box tree too —
exactly how `layout.css` hides `TocMenu`'s panel with its wrapper — so hiding
the header would leave `/`, Ctrl+K and `?` still listening at the window and
opening a modal nobody can see: `showModal()` succeeds, the page goes inert,
nothing errors. The leaves go instead, which also clears the tab order in a way
`visibility: hidden` would not.

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
