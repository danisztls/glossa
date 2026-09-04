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
