# Reading citations

The grammar that turns a printed citation into a link. `docs/link-surface.md`
is the reference apparatus as a whole; this is why the grammar is shaped the
way it is.

**One grammar.** It lives once, in `src/lib/refs-grammar.ts`, and every index
is derived at build and never committed — a committed index is an
interpretation living next to the sources, free to drift from the works it
describes. Where Python needs the same table it consumes an export
(`common/book_forms.json`), held equal by a test. Every second implementation
this project has had drifted, and the second one was wrong each time.

**Under-linking is acceptable; a wrong link is not.** The prose scanner matches
a book name case-sensitively on its exact printed surface form followed by its
own locus — in Portuguese, "na" and "at" are ordinary words where "Na" and "At"
are Nahum and Acts. Rules that would guess (a bare `cf. 1212`, a commentary
title naming the book it comments on) stay off until they can be read rather
than inferred.

**A citation naming several passages is several links, because an address
holds one span.** `Ps 95:1-2, 6-7, 8-9` parses to the verse set it names and
nothing was ever wrong about that; what was wrong is that a single link over
the whole string had to spell the set as `?v=1-9`, which appointed four verses
nobody cited and titled the hover card `Psalms 94:1-9` to say so. The parser
now hands back the comma-chained GROUPS as well as the set (`citationParts`),
`citationPieces` gives each one an address of its own, and the string on the
page is reproduced character for character around them — the book and chapter
inside the first link, the source's own `, ` between them as text. A group
whose verses do not resolve is drawn as text rather than degraded to the
chapter: the words under it read `98-99` and a chapter link is one the reader
cannot tell from a working one.

**A citation this site WRITES is written the way the reader's own Bible
edition's language writes one.** Four surfaces compose one rather than
reproduce one — the day's readings, the prayers' "cited in" panel, and the
notation specimens on `/` and `/schola` — and until 2026-09-06 they disagreed
on both axes. The book form still differs by surface and each difference is
argued (a reading list abbreviates; a panel names the book out of the edition
its link opens; a specimen teaches a shape). **The chapter mark does not**: it
comes from `grammarSurface`, the parser's own table, so a composed citation
cannot be spelled in a form the parser refuses. `PrayerReferences` had a
literal `:` and showed a Portuguese reader `Lucas 1:28` — the same defect the
lectionary card was reported for, in a component nobody had looked at.

**The language is the EDITION's, not the interface's**, because the link opens
that edition: labelling it in another language's convention describes a page
the reader is not being taken to. `content.langFor('bible')` is the input at
all four. It is safe against the versification trap because `vulgateNumbering`
is a property of a WORK and never of a language — naming a language cannot
switch off the Hebrew-to-Vulgate conversion.

**The groups are not on `RefSegment` and are re-read from `raw` instead.** A
segment carries what an address is built from; how the source PUNCTUATED it is
wanted by two surfaces and would otherwise appear in all 87 scripture
expectations in `refs.test.ts`. `citationParts` re-runs the same primitives
over the same string under the same config, so it cannot disagree with the
parse it re-runs — pass it the opts the segment was parsed with and that stays
true.

**A reference grammar is per content language, and English is not a neutral
default.** The premise that a language with no table would merely under-link
was wrong: under English, the bare `Joh`/`Io`/`Jn` matched inside `1 Joh 2,20`
and sent every First-John citation in three editions to the Gospel, the German
mirror's `Job` misprint resolved to Job, and `SC` sent 109 Latin and Italian
_Sources chrétiennes_ volume numbers to real sections of Sacrosanctum
Concilium. **A language with no table is safe; a language reading another
language's table is not**, and the difference is invisible because both produce
links that look right. The tags still without one fall back to English on a
measurement — they cite by bare number or not at all.

**The corpus's cross-language symmetry builds the table, not just checks it.**
The Catechism is the same paragraph in eight editions, so a chapter:verse the
English table resolves is the same reference the Italian edition prints beside
its own abbreviation; aligning on the locus reads the abbreviation off, with a
vote count per entry. The same pass is the regression check afterwards, and it
found three source misprints no per-edition check could see. The symmetry is
free evidence, and the only instrument that can tell a wrong link from a
missing one.

**The axis is content language, plus a short list of works that contradict
it.** English numbers the books of Kings two ways — the Septuagint's four
Regum, which the Douay and the CCEL Summa use, against the modern
Samuel-and-Kings — and the two disagree about exactly `1 Kings` and `2 Kings`.
`RefsOpts` carries a work id and `configFor` consults `WORK_CONFIGS` before the
language table. Two things about the shape are deliberate: **modern is the
default and Douay is the opt-in**, which is the measurement rather than a
preference about traditions; and **the list is per work and evidence-backed,
not a general second axis** — each entry was verified against the verse it
actually names, or the axis becomes a place to put guesses.

**The cost is that the builders have to pass the same work the page passes.**
`build-xrefs.mjs` threads it from the sync's edition records,
`reference-coverage.mjs` buckets per work rather than per language, and
`book-forms-oracle.mjs` derives it from `--work`. One grammar, or the index and
the page disagree about which verse a citation names.

**A reference table belongs to the edition that printed it, not to the work.**
The Catechism's front-matter sigla are the one case of a key meaning two things
in two editions of one work: French prints `SC` for _Sacrosanctum concilium_
and Latin prints `SC` for _Sources chrétiennes_, and each is right about its
own apparatus. So `abbreviations.json` is per edition, `abbr` is not a key even
within one, and the six mirrors that print no table keep an empty array rather
than borrowing a neighbour's.

**An edition that prints no footnotes puts its apparatus in the prose, and the
prose scan has to be an apparatus reader.** German, French and Spanish fold
every reference into the Catechism's body text — 3,624 references against
English's 82 — and the guard that makes a two-letter token safe in running text
is a **bracket**: 3,708 of the 3,712 such tokens those editions print in prose
are inside a `(` or a `[`, and the four that are not are one repeated markup
defect. Measured rather than stylistic.

**A clause names as many documents as it names, and the parse stopped at
the first.** The
leftmost-wins race between the siglum, title, Summa and work-title matchers
settled which match comes first and then dropped the rest of the clause to
plain text, which quietly made it settle that there was only one. Recursing all
four (as the scripture branch beside them always had) raised linkable citations
in every family that moved, with `nothing` unchanged in each.

**`Ibid.` is expanded and `Id.` is not.** An ibidem word opens 1,243 of 22,693
citation strings and names the work of the previous footnote, which no single
string can state — but the apparatus numbers its own notes, so
`buildCitationXrefs` expands only where this citation's number is exactly one
past the one it would inherit from. A dropped footnote or a restarted chapter
breaks the run and the citation stays unread; 1,227 of 1,240 pass, and the
thirteen that fail are the check working. `expandIbidem` writes the work back
into the string and hands it to `parseRefs`, so everything else is read by the
rules that read every other citation. `Id.` means the same AUTHOR and a
different work, which all but one of the corpus's 299 name immediately after
it, so expanding it would file a citation the source never made.

**The Scripture index deliberately does not read ibidem words.** A document
section is one number deep where a verse address is two, so "Ibid., 14." after
"Rom. 10:17" cannot be assigned to a chapter or a verse without guessing.

**An index nobody reads forward should not be stored forward.** The reverse
"cited in" apparatus was two whole-corpus tables of `citer -> verses`, 993 KB,
fetched by every reading page and inverted in the browser on the first Bible
chapter that asked — and never read in the direction they were written, because
a forward link is one the grammar renders from the citation string with nothing
stored. Inverted at build and sharded per book, the same apparatus went from
two citing works to **eight** (the Compendium, the Compendium of the Social
Doctrine, the Code, the Summa, the prayers, and the annotated editions' own
notes joined the Catechism and the documents) while what a chapter fetches
FELL: one book, 39 KB gzipped for Matthew and a few for most.

**A note's own chapter is dropped from its references, and that is the answer
to "may an edition's apparatus be a citer at all".** It may, AS THE EDITION —
Challoner's note is not Allioli's, so an `annotation` carries its work id where
two editions of one Catechism collapse to one citer. What was really circular
is narrower: a note glossing Matthew 5 that says "Matt. v. 31" names the page
the reader already has open, which is the document-cites-itself drop one work
type over.

**Reading an apparatus is what turns a numbering table from wrong-in-principle
to wrong-in-evidence.** `bible.allioli.de` joined `WORK_CONFIGS` on
`vulgateNumbering` alone — the only entry there that is about numbering and not
about the books of Kings — because its note at 1 Chronicles 16:7 prints
`Ps 95,1-13` and the Hebrew conversion sent it to a psalm with eleven verses.
172 of its references resolved outside the corpus; 96 of them stopped. The
manifest had said `psalm_numbering: "vulgate"` all along, and nothing read it.

**A document is addressed in the reader's language or not at all — and that
refusal bought nothing.** `refAddress` looked up the exact `manifests[lang]`
edition and emitted no link where there was none, on the argument that a
citation must not land a reader on an edition they are not reading. But a
document URL names no edition: `/documenta/{slug}` resolves one at page load,
so all 141 of `ccc.mg`'s document citations linked nowhere while opening the
document would have shown them something. It goes through
`defaultDocumentWorkId(slug, lang)` now. **The strict half was always the
section check, not the language**: a section absent from the edition the reader
will actually get still refuses the anchor, and a title degrades to the landing
page.

**Every citer but one is an EDITION-FREE ADDRESS, and the one that is not
decides how the panel is read.** `CCC ¶27` opens in whatever Catechism the
reader reads, so eight editions of it collapse to one citer and there is
nothing to choose between; an `annotation` names the edition, because
Challoner's note is Challoner's, in English. Ten annotated editions cite one
verse as ten works, so the panel shows the reader's own language and no other
— `citedSources`' `commentaryLang`, defaulting to the Bible edition they would
open, and taken from the edition actually on screen by the chapter page, which
is the only page that can differ from the preference (it falls back when its
preferred edition has no text for the chapter). Without the rule, every other edition's
apparatus stands beside the one this reader can actually open, and the
annotated editions between them are the largest family in the index.

**The panel filters by SHELF and not by kind, so no citer can be
unfilterable.** `CitedByFamily` maps every citer kind onto one of the
library's own sections — the Catechism and its Compendium are one answer to
"show me the Catechism", and the rest are one each. Coarser than the kinds
because a Bible verse cited two hundred times is scanned for a shelf, not for
a work; total because a family that covered only the kinds someone remembered
would leave the rest permanently on, which is worse than no filter. The
buttons are drawn from the rows, and appear exactly when pressing one would
change what is shown — more than one family present, or a family that starts
switched off. Switched-off is the MARKED state, because all but one family
start on and the panel's loudest thing must not be its own control.

**Commentary is the one family that starts off**, and the reason is the point
above turned around: the annotated editions cite Scripture more than the
Catechism, the documents and the Summa together, so a heavily annotated verse
answers "who cites this" mostly with one edition's footnotes.
It is also the one family already on the page — the reader's own notes hang off
the verses under their own marks — so the row repeats what is a scroll away.
That is why the control is drawn for a LONE hidden family too: a chapter cited
by nothing but its own apparatus would otherwise show an empty panel with no
way to open it.

**The pigments are ornament and are allowed to be, because the shelf is named
in the same breath.** Each family's chip and each group in the list carry the
same mark in that shelf's low-chroma pigment (`--pigment-*` in
`tokens.css`), and nothing anywhere is told apart by one: the work's name is beside every dot,
so a reader under `data-mono` — where `--pigment-strength: 0%` resolves the
whole set to one grey — loses nothing. That is the line to hold. The moment a
pigment is the only thing saying which work a row belongs to, this stops being
decoration and owes WCAG 1.4.1, which a family of hues this size cannot pay:
the monochrome palette has three greys at dE 8.6, and the site's own two data
colours already fall to dE 10.6 under deuteranopia.

**One definition serves every theme, because the mix adapts and the literal
does not.** Each pigment is `color-mix(in oklab, <seed> 50%, var(--color-text-muted))`,
so the same seeds come out darker on paper and lighter on a dark ground with
nothing repeated per theme — and `oklab` rather than sRGB
because an sRGB path from ultramarine to a warm grey runs through a muddy
violet that half these pigments would land in. They resolve to chroma
0.039–0.080 across a lightness band of 0.05, so the marks differ in hue and in
almost nothing else. **Judge a new seed by what it mixes to**: the commentary's
first slate was already near neutral and resolved to chroma 0.017, an
accidental grey sitting among colours.

**And judge it by its HUE ANGLE too, which this panel cannot see and another
consumer can.** The seeds were picked as pigments first and sat where a
manuscript kit puts them — madder, minium, bistre and orpiment all inside 52° of
arc — which at this chroma is invisible and free. `/schola` then asked the same
tokens for a legible icon and four shelves came out four shades of one rust. The
seeds are spread about the circle now, roughly evenly, each still something a
workshop ground; the panel gained a little by it, its closest pair going 4.3 to
4.4 and its worst contrast on a dark ground 3.39 to 3.87. **Pick the pigment
nearest a slot, not the slot nearest a pigment.**

**A square and not a circle, and drawn rather than set.** A filled circle in
front of a word is a bullet wherever it appears, so every group read as a list
item introducing itself; a square reads as a swatch, which is what a mark
shared with the legend above it should read as. It is a CSS box rather than a
`▪`, and the reason is not cost — `U+25AA` is in Source Sans 3's own release
TTF and would join the existing marks subset for about a hundred bytes on a
face already precached. A square is simply a shape CSS makes exactly: `em`
sized, aligned by rule rather than by a face's metrics, with no swap and no
fallback to whatever the system serves. **Subset for a mark nobody can
compute** — a hedera, a manicule — **and draw a rectangle.**

**One symbol per family was measured and is not available**, which is worth
recording because the obvious answer looks available. Of the ornament
codepoints, all four families in this tree ship only `†`, `¶`, `§`, `•`
and `*` — and most of those are already spoken for in the immediate vicinity
(`¶29` is the Catechism's own reference label in this panel, `§8` the
document's, `†` and `‡` the two commentary markers in the verses above). The
originals hold more than the subsets do (`❦` and `☞` in EB Garamond,
the geometric shapes in Source Sans 3), but what they hold is fill-and-size
variants of three shapes — `▪ ■`, `◆ ◊`, `● ◦` — which at a mark this size is
one shape each. `❖` is in neither original at all. A distinguishable mark per
family needs a font chosen for its ornaments, which is a design decision about
what sits beside Garamond, not a subsetting one.
