# Decisions

The design choices here that are **not obvious from the code**, each with the reason
that makes it a decision rather than an accident.

This is not a history. Git holds that, and the commit that changed a rule holds the
measurement that justified it. What belongs here is the standing answer to "why is it
like this", stated once, in the shape someone needs when they are about to change it.

Companions: `PLAN.md` (what is left), `docs/corpus-schema.md` (the data contract),
`docs/link-surface.md` (the reference apparatus), `docs/research/` (the measurements),
`CLAUDE.md` (what has actually bitten someone).

---

## Posture

**Church-owned texts are hosted verbatim, with full attribution, without asking first;
we comply promptly if a rights holder asks.** This is a deliberate position, not an
oversight — `docs/research/copyright.md` §5 argues it. It covers **Church-owned
magisterial material only**. A Bible or a patristic translation owned by a commercial
publisher is outside it and must be public domain; Matos Soares 1956 (PD 1 Jan 2028) is
one knowingly accepted, self-resolving exposure, and Alexandre Correia's Summa
(PD 2055) and Paulus's _Coleção Patrística_ are blockers rather than exposures.

**Free, ad-free, account-free, no analytics.** The absence of analytics is what lets the
colophon state a privacy position without qualification.

**Indexable, and a duplicate of vatican.va on purpose.** Every page reproduces text with a
canonical home on someone else's server, so the site competes with that server for its own
paragraphs. It is still the copy meant to be found: what it adds is the apparatus —
resolved citations, the reverse index, parallel editions, offline reading — and a reader
who searches a paragraph number should land somewhere that carries all of it. So
`robots.txt` carries no `Disallow` and the build sends no `noindex`. Both were blanket-set
before launch, so that a verification-only hostname would not become the indexed one; that
remains the single condition under which they go back, because whichever hostname is
crawlable is the one readers will cite.

**A text we cannot show properly is not shown.** `site/unpublished.json` switches a work
off; its addresses then redirect to the source page rather than explaining themselves.
The mechanism was built for rights and is used for **quality** — a damaged parse is
worse than an absence, because a reader cannot see what is missing. Entries are meant to
be temporary; the file ships empty.

**There is no whole-site lever, and that is a real gap.** Nearly the whole corpus is
Libreria Editrice Vaticana material under one notice, so the request the posture
actually anticipates would concern almost everything at once. A per-work id list is not
the shape of that decision.

**The name is a promise about arrangement.** The _Glossa Ordinaria_ set commentary
around the sacred page, attributed and never mixed into it. So: **a gloss must never be
confusable with its source, visually or structurally.** That rule governs Challoner's
notes, Matos Soares' notes, and anything annotative added later.

## The corpus

**The corpus is a separate, private repository** (`glossa-corpus`, a sibling checkout;
`CORPUS_DIR` moves both halves). Not because of size — measured, size alone would not
have justified it — but because `raw/` is **reproduction**, not quotation: the complete
original pages, everything the parser discards included. Quotation stays here (fixtures,
corrections' `from`/`to`, research notes arguing about verses) and is a different thing.
A build is therefore no longer reproducible from a clone of this repository alone; that
is the accepted cost.

**`raw/` is write-once. `works/` is regenerable.** The project's whole insurance policy
is that capture regret is fixed by **re-parsing, never re-crawling**, and that holds
only while `raw/` is intact. When judging whether a deletion is safe the question is
never "is this corpus data" but which of the two it is.

**Every edition the source publishes as HTML is parsed, not just the two with
a dictionary.** The Compendium is ten editions as of 2026-08-25 — de, en, es,
fr, hu, it, pt, ro, sl, sv — because they exist, they are the same 598
questions, and the marginal cost of the eighth is a config entry. Four of
those languages have no interface translation, and that is not a reason to
decline the text: a reader of Hungarian gets the Compendium in Hungarian and
everything else in English through `CONTENT_LANG_FALLBACK`, which is better
than getting the Compendium in English too. It is also what finally separated
`ContentLang` from `UiLang`, one day after they equalized.

**The same work in ten hands is ten different pages.** Nothing about the
Compendium's markup is uniform across its editions, and every rule the parser
has is a claim about which of them: the reference line follows the question in
eight editions and the answer in two; Romanian sets no `<blockquote>` at all
and italicises its quotations instead; Swedish prints 21 questions and 39
answers outside any paragraph; Spanish opens four questions with no period
after the number and one inside the previous answer's paragraph; Italian packs
a question, its references and its answer into a single paragraph broken by
`<br/>`. Each is declared per edition in `LANG_CONFIG` rather than sniffed,
because a rule that guesses is a rule that will guess wrong silently on the
eleventh.

**A heading's title ends where the source says, and the source says it two
ways.** The named anchor is the mirror's own statement and is used where it
exists (en, pt, es, fr, it); the printed line break between label and title is
the fallback for the five editions with no usable anchors — Hungarian has 21
anchors for 33 headings, which is worse than none. The line rule is second
rather than only because it cannot see a title that wraps: English's "CHAPTER
ONE 'You Shall Love the Lord Your God / With All Your Heart... / and With All
Your Mind'" is one title on three lines, and reading lines alone turns the
last two into sub-headings no edition has.

**The division scheme is asserted as a subsequence, not as equality.** Four
parts, eight sections, twenty chapters, written down rather than taken from
one edition's parse. A heading matched that the work does not have, or matched
out of order, fails the run — that is ours. A heading an edition does not
print is reported and not failed — that is the page's, and there is nothing to
invent it from. Three editions omit one or more, and Slovenian prints two of
them twice.

**A heading in an unexpected style is read, not corrected** (2026-08-25). Same test as
the separator below, applied to structure: the Swedish Compendium heads two of its eight
sections `sektionen` where the other six are `avdelningen`, and the Italian numbers one
chapter `CAPITOLO I` where its other nineteen spell the ordinal out. Both say exactly
which division they are, so reading them as printed loses nothing and the parser's
vocabulary widened instead. Contrast the one heading in the same edition that IS
corrected: Swedish prints `Andra delen` over a SECTION, and `delen` is that edition's word
for a PART — read as printed it opens a fifth part in a four-part work.

**A missing heading is a claim about the parser until the raw page is opened.** All three
editions recorded as "omitting" a heading the work has were printing it; two are fixed
above and the third (`es`) is a parser gap of another kind. The lesson is procedural: the
subsequence check reports what it did not find, and "not found" was written into a
manifest note as "not printed at all" without anyone looking at the page. `raw/` is kept
so that question is always answerable — see `corpus-schema.md` §Compendium.

**A wrong separator is corrected only when it stops the line parsing.** The
Compendium's reference lines are full of typesetting slips — periods where a
hyphen belongs, en dashes and hyphens used interchangeably, a semicolon and a
comma doing the same job in the same line — and none of them is corrected,
because none of them changes which paragraphs are cited or stops a reader
following them. Two are: a colon standing where a comma belongs (PT Q378) and
where a range hyphen belongs (SV Q5), because a colon is not a separator in
these lists at all and the line stops being a reference list, so all six
references go unlinked. The evidence in both cases is the other nine editions
printing the same references with the ordinary mark. That is the line: not
"is this what a careful typesetter would have done" but "does reading it as
printed lose something".

**A stray U+00C2 before a punctuation mark is decoding, not a correction.**
38 occurrences across four editions, always in front of an en dash, a curly
quote or an ellipsis, in files that are pure ASCII and spell every other
character as an entity: it is the residue of encoding the mark twice, not
something the source says. It is removed in `strip_tags`, one level up from
`decode_cp1252`'s claim about the same bytes. The follow-set is what keeps it
safe and is checked rather than assumed — French prints a real Â in "GRÂCE"
and "ton ÂME", and a rule reading Â alone would eat it.

**Capture is cheap; re-crawling is not, so capture every edition the source has.**
vatican.va publishes the Compendium in fourteen languages; we parse two. All fourteen
are in `raw/` regardless — ten HTML, four PDF-only — because the marginal cost was
twelve requests once, and the alternative is that the day a third language is wanted,
someone crawls that server again. This is the same insurance the rule above states, paid
before the loss rather than after. It scales by judgment, not by rule: the whole
Compendium is 68 MB, of which 51 MB is one Indonesian PDF, and a work with hundreds of
per-chapter pages per language would deserve a different answer.

**A resumed download is a different operation from a retried one.** A 50 MB file across
an edge that drops long transfers can never arrive by retrying, because every retry
starts at zero — three attempts at that Indonesian PDF reached 8 MB, then 33 MB, then
failed. `common.download_resumable` appends to a `.part` and asks for the rest, so each
attempt keeps its ground; `Fetcher` stays the whole-response-in-memory thing the pipeline
is otherwise made of. Related, and found the same afternoon: `IncompleteRead` is an
`http.client` exception that urllib does not wrap, so it used to escape past every caller
that handles `FetchError` and past the retry loop that exists for it.

**`works/` is tracked in git anyway**, though it is derived. Not for reproducibility —
for **diffability**: the blast radius of a parser change is `git status` in the corpus
repo, and nothing else answers "what did this fix actually move".

**Someone else's server is a commitment, not a tuning parameter.** vatican.va's
`Crawl-delay: 2` comes from its `robots.txt`; other hosts have their own self-chosen
floors. `FetchPolicy` has no default for `delay` or `user_agent`, so a new scraper
cannot inherit a floor by forgetting to state one. Never run two sweeps at once.

**Requests are serial; parsing is not.** The delay is about the network and says nothing
about bytes already in hand. `fetch_for_parse` stays behind the floor, `parse_and_write`
fans out — so a document parses inside the two seconds the crawler already owes.

**A 404 is an answer, not a failure to retry.** Definitive statuses land in
`pipeline/absent-sources.json`; a timeout or a 5xx must never, since caching one as an
absence silently drops a real document. An absence is not permanent (`--recheck-absent`).

**`generated_at` means when the content was generated**, not when a run touched the file
— `common.write_stamped_json` compares against the stored stamp, all-or-nothing across a
work's files. Otherwise every run rewrites everything and the diff shows nothing.

## Corrections and overrides

Three layers, and keeping them apart is what lets `raw/` stay the record of what the
source said rather than of how we read it.

| Layer                   | Claim                             | Applies        |
| ----------------------- | --------------------------------- | -------------- |
| `pipeline/corrections/` | **the source is wrong**           | before parsing |
| `pipeline/overrides/`   | **our derivation is wrong**       | after parsing  |
| the parser              | the defect belongs to a **class** | —              |

**Never invented text, in either direction.** A defect with no known correct value is
documented and reported, not fixed. Every correction carries a locator, exact
before/after, a reason and evidence, and fails loudly when its `from` stops matching.
Only mechanical defects qualify — OCR artifacts, digit typos, marker mismatches — never
wording, never modernization.

**Before filing an override, ask whether the defect belongs to one document or to a
class of them. It has been a class nearly every time**, and an override would then have
repaired one unit while claiming the defect was handled. The layer holds five entries
against a corpus of hundreds of works, all the same defect, filed only because the sole
discriminator is cross-language and the parser reads one document at a time.

**Loud failure is the point.** An override exists because the parser is wrong, so the
parser improving is the _expected_ way for one to stop matching — indistinguishable from
being aimed at the wrong unit unless the run says which entry and why.

**Presentation is not a corrections matter.** The mirrors' loose citation spacing is a
typesetting habit of the source (thousands of instances), tidied at render,
whitespace-only, verified to add and remove no mark. The corpus keeps what was printed.

## Storage

**One representation: `html`, and nothing derived from it stored beside it.** The source
is HTML and the render target is HTML; Markdown would be a detour expressing less than
either end, with a hand-rolled escaping layer over a corpus that is wall-to-wall `«…»`,
`[…]`, `(N*)` and italicised Latin — where an escaping bug would look exactly like a
source defect. The stored subset is a **measured** allowlist (`i`, `b`, `sup`, `br`,
`blockquote`), narrowed at emit; an unexpected tag has its markup stripped and its text
kept, with an anomaly logged.

**An oracle whose expected value is stored is not an oracle.** `text` and `text_marked`
were dropped once the round-trip check moved into `validate_document`, where both sides
are computed from the same source string in the same process. Storing the copy was never
what made the check work — computing both was.

**Absence means the default.** `kind`, `attribution`, `label`, `subtitle`, `title_html`
and their kin are omitted when unexceptional, so every stored value marks an exception
and `grep -c` is the census. `to: null` in an override deletes a field back to its
default rather than inventing a state the schema does not define.

**Structure records observed depth and an anchor; nesting and ranges are derived.**
A stored range drifts from the text — nearly every structural defect ever found here was
one. And a semantic `kind` would force the scraper to judge whether a heading _means_
"chapter", which the sources do not encode. Record the observable thing; derive the rest.

**A section always has a number.** Text the source prints with no number goes in
`appendix.json`, not a section with a null `n`: `sections.json` is indexed by number by
the chunker, the compare view, `#s{n}` deep links and the route manifest, and a
numberless row is a hole in all four. An edition that numbers nothing is an
`UNNUMBERED EDITION` — valid and published, honest about lacking a citable address —
not a parser defeat.

**Every content split is a fixed stride, and a size ceiling fails the build.** Chunk
membership is a pure function of the unit's own number (`*ChunkStartFor`), so no boundary
table has to ship or stay in sync. The strides differ because the units do — 100 CCC
paragraphs, 100 Compendium questions, 50 document sections, 20 Bible chapters, one file
per Summa question. What the strides are matters less than the ceiling: every chunking
regression this project has had was one size premise recorded in a comment, correct when
written, never re-measured. Documents were whole-file on a "~200 KB worst case" note until
the real worst case reached 827 KB; the Compendium was whole-file on a "~90 KB for both
languages" note until it had ten editions at 290 KB each. Both were found months late by
someone happening to look. `CONTENT_FILE_CEILING_BYTES` turns that class into a failed
sync. Raising it is legitimate — a single Summa question cannot be split — but it has to
be a decision someone records.

**The reader's unit, not the volume's, decides the chunk.** A Bible book matched the print
volume's own granularity and was the wrong unit anyway: `/scriptura/{osis}/{chapter}` shows
one chapter and `getChapter` is that tier's only reader, so opening Ps 23 fetched all 150
psalms. Splitting moved existence and adjacency for the Compendium up to the index tier
too — they were answered by scanning the whole-language file every reader had already
fetched, which chunked would have meant fetching every chunk to learn a number is absent.

**A reference grammar is per content language, and English is not a neutral
default.** `refs-grammar.ts` had EN and PT for a year, on the reasonable-looking
premise that another language would merely under-link under the English table.
It over-linked instead: the bare `Joh`/`Io`/`Jn` matched inside `1 Joh 2,20`
and every First-John citation in three editions resolved to the Gospel, the
German mirror's `Job` (its own misprint of `Joh`) resolved to the book of Job,
and `SC` — the collision Portuguese had already been split off for — sent 109
Latin and Italian Sources-chrétiennes volume numbers to real sections of
Sacrosanctum Concilium. A language with no table is safe; a language reading
another language's table is not, and the difference is invisible because both
produce links that look right. Six tables were added 2026-08-26 (docs above);
the eight tags still without one fall back to English on a measurement, not an
assumption — they cite by bare number or not at all.

**The corpus's own cross-language symmetry builds the table, not just checks
it.** The Catechism is the same paragraph in eight editions, so a
chapter:verse the English table resolves is the same reference the Italian
edition prints beside its own abbreviation; aligning on the locus reads the
abbreviation off, with a vote count per entry. Five of the six tables were
derived that way and the sixth — Latin, transcribed from the edition's own
printed list — was checked by it, agreeing on 53 rows and contradicting none.
The same pass is the regression check afterwards, and it found three source
misprints (a book named wrong in German, a French siglum left in Spanish, a
dropped book number in Malagasy) that no per-edition check could see. This is
`audit.py divisions`' argument one level down: the symmetry is free evidence,
and it is the only instrument that can tell a wrong link from a missing one.

**The grammar's axis is content language, plus a short list of works that
contradict it** (2026-08-26). English numbers the books of Kings two ways —
the Septuagint's four Regum, which the Douay-Rheims translates and the CCEL
Summa quotes in, against the modern Samuel-and-Kings the Nova Vulgata and
every modern Catholic translation use — and the two disagree about exactly
`1 Kings` and `2 Kings`. `3 Kings` and `4 Kings` are unambiguous under both
and had been read since the tables were written; the other two were left as
the modern books, correct for the Catechism and one book off for fifty-odd
references in the Summa, because nothing in the citation string distinguishes
them and the grammar could not see the work.

It can now: `RefsOpts` carries an optional work id, `configFor` consults
`WORK_CONFIGS` before the language table, and three works are listed there —
`summa.en`, `encyclical.aeterni-patris.en`, `encyclical.diuturnum.en`. Two
things about the shape were deliberate. **Modern is the default and Douay is
the opt-in**, which is the measurement rather than a preference about
traditions: thirteen references in `ccc.en` and one apiece in the Compendium
and six encyclicals read modern, against three works that do not. And **the
list is per work and evidence-backed, not a general second axis** — each
entry was verified against the verse it actually names (Aeterni Patris's
"1 Kings 2:3" anchors "the God of all knowledge", 1 Samuel 2:3; Diuturnum's
"1 Kings 9:16; 10:1; 16:13" anchors the anointing of Saul and David, which
`ccc.en` cites as 1 Samuel), and none of the three ever prints "Samuel". A
work earns a row the way a source defect earns a correction, or the axis
becomes a place to put guesses.

The cost of the axis is that **the builders have to pass the same work the
page passes**. `build-xrefs.mjs` threads it from the sync's edition records,
`reference-coverage.mjs` buckets per work instead of per language — an
`encyclical`/`en` bucket would have measured two of its works differently
from how the site renders them — and `book-forms-oracle.mjs` derives it from
`--work`, without which it would report a contradiction it had introduced
itself. That is the recurring shape here: one grammar, or the index and the
page disagree about which verse a citation names.

**A reference table belongs to the edition that printed it, not to the work.** The
Catechism's front-matter sigla are the corpus's one case of the same key meaning two
different things in two editions of one work, and it took reading both to see it: French
prints `SC` for _Sacrosanctum concilium_ and Latin prints `SC` for _Sources chrétiennes_,
`CA` for _Centesimus annus_ against _Corpus apologetarum_ — and each is right about its
own apparatus, since the Latin text's 118 `SC` references are volume-and-page. The two
tables are not translations of each other either: one lists documents, the other
bibliographic sigla plus all 73 Scripture books. So `abbreviations.json` is per-edition,
`abbr` is not a key even within one edition, and the six mirrors that print no table keep
an empty array rather than borrowing a neighbour's. The site's grammar had reached the
same split for EN and PT from the citations alone, which is the corroboration, not the
cause (2026-08-26).

**An edition that prints no footnotes puts its apparatus in the prose, and the prose
scan has to be an apparatus reader.** German, French and Spanish fold every reference
into the Catechism's body text, so a grammar that reads sigla only in citation strings
reads three of eight editions at a fraction of the others. `linkifyProse` gained a
document-siglum scan on 2026-08-26 — 3,624 references in those three, 82 in English —
and the guard that makes a two-letter token safe in running text is a **bracket**:
3,708 of the 3,712 such tokens the four editions print in prose are inside a `(` or a
`[`, the four that are not are one repeated markup defect, and the rule is therefore
measured rather than stylistic. It also fixed the direction of the standing note that
`ar`, `pl` and `ru` "print no Scripture locator": they had none when that was written,
and one encyclical later they had 62 apiece that nothing was reading.

**Inline emphasis is not a word boundary.** A tag becomes a space only where it is
block-level; an emphasis tag leaves nothing behind. The substituted space was hiding real
source defects behind a code rule, and stripping whitespace afterwards cannot work
because this corpus prints spaced punctuation on purpose.

## Parsing

**What the source states outranks what we infer.** vatican.va's markup carries no
heading semantics — a chapter title and a sub-section title are both a `<p>` with some
emphasis on it — so levels are inferred from typography. Wherever a page states its own
structure instead, the statement wins and the heuristics stop applying to that page: a
printed table of contents, a named anchor on every real title, an `<hr>` closing the
masthead, a declared breadcrumb chain. Inference should defer to a statement, not average
with it.

**If two headings look the same on the page, they are the same level.** That is the
corpus's rule and the reader's rule both, and several parser fixes are it applied to a
case where markup alone said otherwise.

**Under-linking is acceptable; a wrong link is not.** The prose scanner matches a book
name **case-sensitively** on its exact printed surface form followed by its own locus —
in Portuguese, "na" and "at" are ordinary words where "Na" and "At" are Nahum and Acts.
Rules that would guess (a bare `cf. 1212`, a commentary title naming the book it
comments on) stay off until they can be read rather than inferred.

**`Ibid.` left that list by acquiring a check rather than an argument** (2026-08-25). An
ibidem word opens 1,243 of the corpus's 22,693 citation strings and names the work of the
previous footnote — which no single string can state, so reading it means carrying a work
in from outside the string, and 401 of them carry it across a unit boundary as well. What
settles that it is reading: the apparatus numbers its own notes. `buildCitationXrefs`
expands an `Ibid.` only where this citation's number is exactly one past the citation it
would inherit from, so a footnote the parser dropped, or a chapter that restarts its
numbering, breaks the run and the citation stays unread — 1,227 of 1,240 pass, and the
thirteen that fail are the check working. `expandIbidem` then writes the work back into
the string and hands the result to `parseRefs`, so the locus, the "cf." and everything
else are read by the rules that read every other citation instead of by a second set of
them. 513 citations that named nothing now name an ingested work.

**`Id.` did not leave the list, and the scripture index is deliberately not in this.**
`Id.`/`Idem` means the same AUTHOR and a different work — all but one of the corpus's 299
print that work's title immediately after it — so expanding it would file a citation the
source never made. And a document section is one number deep where a verse address is
two, so "Ibid., 14." after "Rom. 10:17" cannot be assigned to a chapter or to a verse
without guessing which; the reverse citation index reads ibidem words, the Scripture
cross-reference index does not.

**One grammar.** The citation grammar lives once, in TypeScript
(`site/src/lib/refs-grammar.ts`), and every index is **derived at build and never
committed** — a committed index is an interpretation living next to the sources, free to
drift from the works it describes. Where Python needs the same table it consumes an
export (`common/book_forms.json`), held equal by a test. Every second implementation this
project has had drifted, and the second one was wrong each time.

## Oracles

Every check here is blind to something the others see. None is a substitute for another,
and the reason each exists is the gap in the one before it.

- **Round-trip** (`html_to_text(html) == text`) — a statement about one block, so a block
  that never became a block is outside its universe.
- **Cross-language symmetry** — compares unit-number _sets_, so it is blind to loss
  inside a unit. **Where the address space is fixed it is vacuous and will not say so**:
  the Compendium is 1–598 in both editions by construction, and reported symmetry while
  four English answers were missing an entire enumeration. **Comparing DIVISIONS rather
  than units is the version of it that is not vacuous there**, and it is what six new
  Catechism editions were worth: the CCC is 1–2865 in all eight by construction, so the
  unit sets can never disagree — but the in-brief divisions can, and did. English had 59
  where Portuguese, German and Malagasy each had 81 and agreed on which. Twenty-one were
  a parser defect a year old (whole pages of the English mirror set every heading in
  plain type, and only bold blocks were read as headings, so those in-brief headings fell
  under the run-in-subheader word cap and were dropped); the twenty-second is a genuine
  source omission at §984, now supplied by a `heading_html` correction against the three
  editions that print it. The same pass found a Portuguese sub-heading that had been
  swallowed since the first ingestion. **A one-sided gap against three independent
  editions is not a reading, it is a bug**, and no check the corpus already had could see
  it: round-trip, coverage and balance are all per-unit, and the divisions are not units.
- **Coverage** (`audit.py coverage`) — raw body text divided by what we stored. Crude and
  therefore hard to fool; it cannot say what was lost, only how much. It never legitimately
  reaches 100%, so a low band is a research lead and only a floor is gated.
- **Balance** (`audit.py balance`) — per-unit length against the sibling edition,
  normalized by the pair's own median. Run over the CCC, Compendium, prayers and Summa;
  deliberately **not** over documents (a section number is not the same section in both
  editions — `coverage` is the instrument there) or the Bible. Its first run over eight
  Catechism editions found three defects in three different parsers' worth of assumption
  — a whole page's footnotes appended to that page's last paragraph in Malagasy, the same
  in Latin for a different reason, and a quotation split at the "103" inside "(Augustinus,
  Psal. 103,4, 1)" in both German and French. 375 outliers became 56.
- **Divisions** (`audit.py divisions`) — the structure trees of a work's editions, compared
  by paragraph span. The one check that is not per-unit, and therefore the only one that
  can see a division that never got built: it is what found English carrying 59 in-brief
  divisions where three other editions carried 81.
- **Hand-read oracles** — a person reads the source page and writes down its table of
  contents (`audit.py toc`), or a note's lemma is checked against the verse it quotes.
  These are the only checks that can see something the parser never produced at all.

**A metric that ignores one of the places body text is stored reports relocation as
loss.** That lesson has been learned three times — the masthead, the appendix, the
Summa's non-Aquinas divisions.

**An oracle records the page, not the corpus.** Where a correction is filed, the two
_must_ differ, and reporting that is reporting the corrections layer working. Editing an
oracle to match the parser is how it stops being evidence — the ToC audit applies filed
corrections to the read side instead.

**A verse-count oracle is not a textual one.** Numbers agreeing says nothing about the
text beneath them; Acts 14 runs 1–27 in both editions with twenty verses naming different
text. Where the Latin agrees with one edition on the count, it has taken a side on the
count and on nothing else.

**Bible asymmetry is edition divergence, not defect** (`docs/research/bible-edition-divergence.md`).
Calling it a defect invites someone to "fix" a faithful text.

**And neither is every Catechism asymmetry**, which is the same rule meeting eight
editions of one work. Three of the eight print no footnote apparatus at all — French
folds its references into the prose in parentheses, German in brackets, Spanish in
parentheses with a hyperlink — so their paragraphs carry no citations and their stored
text is longer. The unnumbered run-in sub-headings are bold in four mirrors and plain in
the others, so `ccc.es` has several hundred `sub` nodes and `ccc.en` has two. English
prints two divisions as articles that the rest print as sub-headings. **What separates
these from the in-brief gap above is which way the evidence points**: an edition doing
something the others do not, consistently and everywhere, is that edition; an edition
missing something the others all have, in scattered places, is a parser.

**A second transcription of the same printing is the only check that sees a hole.** It
is why `bible.matos-soares.pt` keeps liriocatolico's verses despite taking its apparatus
from vulgata.online: that transcription is missing 247 verses, and nothing but the
comparison could tell which of the two was short.

**The cross-edition oracle is not the Catechism's; it belongs to any work translated
once.** `book-forms-oracle.mjs` was written to derive book tables from the CCC's eight
aligned editions, and on 2026-08-26 it was pointed at _Magnifica Humanitas_ — 245
sections in nine languages — to derive Polish, Russian and Arabic, which the corpus had
no grammar for at all. What makes the alignment usable is not the family but the
translation history: a work rendered from one text at one moment has section N meaning
the same thing everywhere, which is exactly what a nineteenth-century encyclical's
translations do not. So `--work` takes any work id and the reading is on whoever passes
it. Arabic is the interesting case, because it shares no surface form, no letter case
and not even the comma with any other edition: its chapter/verse mark is U+060C, and a
grammar built on "," reads none of its 62 references.

## Addresses and editions

**A canonical URL selects a reference; the reader's preference selects the edition.**
So every reader URL is **edition-free** and Latin, and does not vary with interface
language: `/scriptura/{osis}/{chapter}`, `/catechismus/{n}`, `/catechismus/caput/{n}`,
`/compendium/{n}`, `/documenta/{slug}`, `/preces/{slug}`, `/signata`, `/colophon`. The
English roots deliberately resolve as invalid; there is no compatibility layer. (Route
directories under `src/routes/` are still named in English, with Latin re-exports.)

**`src/lib/address.ts` is the only place a reader URL is written or read.** The grammar
was known in six places and four unions described the same thing; serializing an address
to a string and regex-parsing it back inside one process is not an architecture.

**Which edition a reader gets is written down, never derived from sort order.**
`PREFERRED_EDITION` names it per type and language, `DEFAULT_REGION` names the unmarked
region within a language, and a test refuses two editions sharing a tag with no entry.
An English reader got the CPDV because `c` sorts before `d` — right by accident, and one
rename from changing.

**The fallback chain resolves per address, not per work**: the reader's language, then
English, then Latin (`CONTENT_LANG_FALLBACK`). It has to, because the Summa's two
editions cover different parts — a citation to `Suppl q. 77` must reach English even for
a Latin-preferring reader.

**A bookmark is a canonical URL and a timestamp, nothing else.** Not the text, not the
edition it was read in. Resolving late is what makes it follow the reader across an
edition switch instead of freezing the wording they happened to have open.

**An address, not a work, picks the edition** — the same rule that lets English (UK) be
five prayers while the collection's shape, order and prev/next chain come from the
28-prayer English edition.

**So the edition MENU is address-scoped too** (2026-08-25). It was not, and prayers are
the one type where that shows: `listEditions('prayer')` put "English (UK)" in the picker
on all twenty-eight prayers, where on twenty-three it named an edition with no text at
that address, resolved straight back to `prayer.common.en`, and left the trigger
announcing a wording the page was not printing. The rule the text already followed now
governs the control that offers it — the menu lists the editions holding the address in
view, and the trigger names the edition actually rendered rather than the one stored.
At the collection index, where no one prayer is in view, "holds the address" means "can
enumerate the collection", which is `completeEditionTags` — the set `prayerIndexLang`
already indexes off. A menu row that changes nothing is worse than an absent one: it
reads as a claim that a second English wording of the Our Father exists.

**Provenance follows the address as well** (2026-08-25). A work-level `sources` list
answers "where did this work come from", and for every other type that is also the answer
for any address in it. A prayer collection is assembled from unrelated pages — eight for
English — so the copyright notice's `sources[0]` claimed the Compendium's Appendix A
under all twenty-eight prayers, wrongly for the two Creeds, the Our Father and the Litany
of Loreto, and half-wrongly for the Rosary, whose twenty mysteries and directions come
from four Holy Rosary micro-site pages the Compendium does not contain. Prayers now carry
their own `sources`, and the Rosary's groups and instructions each carry the page they
were parsed from, printed beside them. The point is the same one the source link has
always been making (`research/copyright.md` §5): an attribution the reader cannot check
is asking them to take our word for it, and one that sends them to the wrong page is
worse than none.

**A correction's `field` names which text it repairs** (2026-08-26). It had been
decorative — every prayer correction on file said `latin_text` and the code read
`prayer.latin.blocks` unconditionally, so the key described what the code happened to do.
That held only for as long as every defect found here was in the Latin, which was a fact
about which column had been read closely rather than about the corpus. The first
vernacular defect (a dropped letter in the UK Te Deum) could not be expressed at all.
`variant_text` is the third value and needs a `locator.variant`, because corrections run
before the UK/USA split resolves and the two wordings share whole lines — "whichever
column matched" is not a safe answer.

**A correction receipt names only what is in the file beside it** (2026-08-26). One
parse is written into three editions, so `corrections-applied.json` was the same list in
all of them: `prayer.common.en-gb` shipped a receipt for a defect in `glory-be`, which
it does not contain. A receipt exists to be checked against its own file, and naming a
change that is not there is the one thing it cannot do.

## Languages

**Content language follows UI language**, with a per-work-type override as the escape
hatch. One switch, fewer surprising states; the override sleeps and wakes on the UI
language it was made under.

**`UiLang` and `ContentLang` are two sets, fourteen tags against fifteen.** They answer
different questions — a content language arrives when someone ingests a text, an interface
language when someone writes a dictionary — and either moves alone: they were equal at
ten, separated when the Compendium's editions brought `hu`, `ro`, `sl` and `sv` in with no
dictionaries, drew level again when those four were written, and separated once more on
2026-08-26 when the Catechism landed `mg`. **Do not derive one from the other.** Use
`isUiLang`/`UI_LANGS`, never a literal list.

**Malagasy is a content language with no chrome, and that is the honest state rather than
a defect to hide** (2026-08-26). A Malagasy reader has the whole Catechism, 2,865
paragraphs, inside an English interface; by the rule the four Compendium languages
established that is a dictionary owed, and it is owed to a language nobody working here
reads. Until someone who does writes it, `CONTENT_LANG_FALLBACK` is what keeps the rest of
the corpus navigable around it. What the asymmetry must NOT do is leave the edition
unnamed: a content language is named in its own language by `LANGUAGE_NAMES` in
`corpus.ts`, which is keyed on `ContentLang` and not on the interface list, and an
unnamed tag degrades silently to itself — `ccc.mg` offered itself in the edition menu as
"mg".

**Content fallback is per-language, at most one neighbour deep, and always ends English
then Latin** (2026-08-26). `CONTENT_LANG_FALLBACK` in `corpus.ts` was one global
`['en', 'la']`, which said where a reader ends up and nothing about where they should look
first. It is now a row per content language. English then Latin ends every row and is the
invariant a test asserts: English is the only language the whole corpus exists in and
Latin is complete wherever it exists, so a chain ending in the two can always answer.

Four rows name a neighbour ahead of that tail, each on a claim about a specific
readership rather than on a general ranking of languages by distance: `mg → fr` (French is
co-official in Madagascar and the language the Church there works in alongside Malagasy,
and `mg` has one work, so it is a reader who falls back constantly), `la → it` (the
closest living language to the one the reader chose, and the Holy See's working language),
`es → pt` and `pt → es` (where the fallback buys the most — Portuguese carries 112 works to
Spanish's three, and the two read across), plus `ar → fr` and `hu → de` for the second
language those readers are likeliest to already have. **One neighbour at most, deliberately:**
a longer row is a ranking of languages by closeness, which is an argument nobody wins and
the corpus cannot settle. A row that names none is not a gap — a German or Polish reader is
better served by English than by a language they are being guessed into.

**The offline fill follows the same chain, three languages deep** (`OFFLINE_LANG_DEPTH` in
`sw-policy.ts`). One order, walked by both edition resolution and the download planner, so
what a reader is routed to is what they have offline — a reader sent to the Italian
Catechism with no Italian Catechism on the device would lose the fallback exactly when the
network drops, which is the condition the offline library exists for.

The cap is there because the planner's three automatic waves fill _per language_: a
language costs ~3.3 MB raw across ~35 files wherever it has a Catechism (~290 KB of
essentials, ~3 MB of Catechism). Uncapped, a Spanish reader would fill four languages
against a German reader's three, ~12.9 MB against ~9.5, for a preference neither expressed.
**Every reader should pay about the same, and three is what every chain cost before the
neighbour rows existed.** What the cap drops is Latin, for the nine rows with a neighbour,
and that is the cheapest thing in the chain to lose: Latin sits last precisely because it is
reached only when English lacks the address, which against a complete English tier is close
to never. It caps the fill and not the chain — `editionInLang` still walks every row to its
end, so an address that exists is never refused, only fetched on demand rather than ahead
of the reader.

**Direction is a property of the text, not of the reader.** `<html dir>` follows the
interface language; a content region takes its direction from the `lang` it already
declares. Write CSS in logical properties.

**Vulgate is the canonical versification.** Conversion is applied unconditionally for
divergent books rather than as a fallback, because a wrong chapter does not fail an
existence check — `Joel 3:1-5` resolves to real but wrong text.

**Where a work has no Portuguese and never will, that is a property of the source.**
The Summa ships EN + LA; symmetry checks assert the shape rather than symmetry, and the
cross-language oracle runs only over the parts both editions carry.

**Nine interface languages the corpus has one work in is the intended state**, not debt.
A reader in any of them gets English content nearly everywhere through the fallback
chain, and the alternative is a reader who _can_ read Magnifica Humanitas in their own
language having to navigate to it in someone else's. Latin is the mirror image: two whole
works, chrome added last.

**A whole work in a language with no chrome is the case that does not wait.** The
Compendium is complete in Hungarian, Romanian, Slovenian and Swedish — 598 questions
each — so a reader of any of them was reading a finished work inside an English
interface, which is a worse state than the seven single-work languages ever were in
(English chrome around English content is at least consistent). The four dictionaries
were written for that reason, and the rule they encode is about coverage, not counts: a
dictionary is owed where the corpus can already fill a reader's language, not wherever a
tag exists. Russian is the standing counter-case — chrome since Magnifica Humanitas, and
a Compendium that exists only as a PDF nothing parses.

**A division label is read in the language it was printed in.** `titles.ts` strips the
label a source prints on top of a structure title (`PART ONE`, `ERSTER ABSCHNITT`),
because `kind` and `n` already carry it and the site prints its own translated marker
instead. That grammar was `en`/`pt` for as long as those were the only editions of
anything; the Compendium's ten made it eight languages short, and the label survived into
the title everywhere else — `Erster Abschnitt „Ich Glaube“ – „Wir Glauben“`. The table is
now a **second copy** of the vocabulary `compendium.py` matches, and deliberately not a
generated one: the scraper's copy decides what a heading _is_, and getting it wrong fails
`validate`; this one decides how a heading _reads_, and getting it wrong shows an
unstripped label. Different failure modes, and the source they both describe is a frozen
capture. What guards the copy is a test asserting a real title from each of the ten
editions, not the table.

**One language can print one kind two ways, and the table is keyed by language.** French
numbers its Compendium chapters in roman numerals and its Catechism chapters in ordinal
words, so `fr.chapter` holds both series and the first that matches wins — they cannot
both match one title. The Catechism's eight editions also added the `article` kind to six
tables that had never needed it (only the Catechism has articles) and brought `la` and
`mg` into the grammar: Latin had been a content language since the Summa and stayed out
of it because the Summa's divisions carry no printed label to strip, which stopped being
true the moment `PARS PRIMA` arrived.

**Title case is the only safe guess from an ALL-CAPS heading, so every language gets one
small-word list rather than its own convention.** Most of the twelve would use sentence
case for a heading, and sentence case is unavailable: from `CREDO IN GESÙ CRISTO` nothing
distinguishes `CRISTO` from `FEDE`, and lower-casing a name is a loss no later pass can
repair. Over-capitalising a content word is the error a reader reads past. So the same
title-case pass runs everywhere and only its list of function words is per language — the
one thing that can be lower-cased with no risk, because no article or preposition is ever
a proper noun. What that leaves is a ceiling, not a bug to file: German adjectives and
verbs stay capitalised (`Das Christliche Gebet`), because only a lexicon separates them
from the nouns German capitalises by rule.

**A list entry that is a coin flip does not go on the list.** Two of these decided
themselves against the obvious reading. Polish `i` is both "and" and roman one, and the
corpus prints `ROZDZIAŁ I` — so it stays off the list and stays capitalised, wrong in the
other headings and harmless there. Hungarian `vagy` is both "or" and "you are", and the
corpus's only heading with it is the Our Father. In both cases the entry would have been
right more often than not, which is not the standard: the list's whole warrant is that
lower-casing its members is _always_ safe.

**A roman numeral that is a word is a per-language fact.** `DI`, `DIX`, `MI` and `VI`
satisfy every roman-numeral rule and are Italian, French, Hungarian and Swedish words;
`VI` is also the number six heading 31 real divisions in English and Portuguese. The
exclusions were counted out of the corpus — every roman-shaped token in every ALL-CAPS
heading, per language — the same way the acronym list is built, and for the same reason:
a plausible-looking guess here freezes a word in capitals wherever it appears.

**A description must be read, not recalled, and a translation is not a reading.**
`site/descriptions.json` carries `origin: "read" | "translated"` plus a `from` chain, so
correcting a reading marks every translation of it stale by inspection. A fluent wrong
summary is indistinguishable on the page from a real one.

## The site

**One static SPA shell, not a prerender.** The static page was never the content
identity: prerendering repeated the chrome thousands of times and could embed only a
build-time default edition or every edition at once. The build is two HTML documents.

**The boot chunk is what that shell actually costs, and it is priced per registry, not
per byte** (2026-08-26). With `ssr = false` nothing paints until the client bundle has
downloaded, parsed and mounted, so whatever the boot index carries sits in front of first
paint on every route — including the routes that never read a byte of it. Three cuts took
it from 2.32 MB raw / 305 KB brotli to 1.34 MB / 170 KB. What decides whether a registry
boots with the app is the QUESTION IT ANSWERS, not its size: "does this address exist" is
asked with no work in hand and stays eager, while a document's outline is only ever wanted
by the page already reading that document — so all 354 of them became content-tier assets,
where they also ride the offline download waves rather than merely landing in a cache.
Numbering runs (a chapter's verses, the Compendium's questions, a document's sections, a
Summa question's articles) are stored as their count, with the explicit array kept wherever
there is a gap; that is lossless, so the older refusal to store a mere BOUND — a verse gap
must not silently mislink — still holds unamended. And a work manifest keeps only the first
of its `sources`, because `sourceUrl` reads `sources[0].url` and no page reads the rest.

**A bogus reference-shaped URL gets a 404, not the shell with a 200.** The host's
ordinary SPA fallback would make every mistyped citation look like a citable resource, on
a site whose whole point is citable deep links. `corpus-routes.json` is an address-only
manifest checked at the edge, generated from the same indexes the client uses.

**Offline is two cache tiers.** The content tier is unversioned and survives app updates
the way a downloaded book should; the shell tier is versioned and swept on activate. No
`skipWaiting()` — a reader mid-chapter should not have assets swapped under an open tab.
Content-hashed data the app fetches on demand but that is not corpus text — the citation
tables, the translated descriptions — is content tier too, and deliberately not in the
install precache.

**Not calling `skipWaiting()` obliges us to offer the update instead.** The browser's own
rule for when a waiting worker takes over ("once every client on the old version is gone")
is not something a reader can act on: a plain reload does not release the old worker, and
an installed PWA can sit on a superseded version indefinitely. Since the corpus index
ships inside the shell bundle, that is a stale table of contents, not merely stale code.
The page watches for the waiting worker and offers a reload; nothing moves until the
reader accepts. Announcing it requires an existing controller, or a first-time visitor is
told a version they have never seen is out of date.

**The background fill is per-language, ordered, and opt-in past the Catechism.** The
corpus is 82.6 MB raw / ~26 MB gzipped across fifteen languages, and a reader speaks one
or two of them. The worker plans waves over the reader's own language chain and takes only
the three cheapest without being asked — the next chunk of what is open, the small whole
works, the Catechism, together about 1.2 MB gzipped. Scripture, the Magisterium and the
Summa are offered, not taken. It asked for everything, in every language, on every visit
until 2026-08-25, gated only by `saveData`, which almost nobody sets.

**The service worker's decisions live outside the service worker.** `service-worker.ts`
cannot be imported by a test — it reads `$service-worker` at module scope and registers
listeners on load — and every way it can be wrong is silent: a misclassified corpus file
lands in the versioned cache, is wiped on the next deploy, and the reader re-downloads
their library without an error anywhere. The classification, the routing table and the
wave order are in `sw-policy.ts`; the cache operations take `caches` and `fetch` as
arguments in `sw-cache.ts`. Same split, and same reason, as `route-manifest.ts` for the
edge worker.

**`run_worker_first` is a list of navigation patterns, never `true`.** As a boolean it
routes every request through the edge worker, and every one of those is a billed Worker
invocation — corpus chunks, JS, fonts, icons. `src/worker.ts` returns non-navigations on
its first line, but the invocation is already spent: one cold visitor filling the offline
library cost ~2,240 of the free plan's 100,000 per day, about fifty first-time readers.
Past the limit `run_worker_first` answers 429 rather than falling back to the asset, so
the whole site went dark until 00:00 UTC. Scoped, a cold visit costs one invocation and
the failure degrades instead: negative patterns keep serving assets, and only fresh
navigations 429.

**The zone has one rate limiting rule, and it lives in the Cloudflare dashboard**
(2026-08-26). Every HTML navigation is a billed Worker invocation against the free plan's
100,000/day, the sitemap advertises ~5,800 canonical addresses, and nothing bounds how
many times they are crawled. A rule in the WAF is the only lever that costs nothing to
exercise: it runs before the Worker, and per Cloudflare's pricing "only requests that hit
a Worker will count against your limits and your bill".

The rule is: **block** an unverified client at **120 requests per 10 seconds**, counted per
`ip.src` **and `cf.colo.id`** (the counter is per data centre, not global), with a
10-second mitigation timeout, over the expression

```
not starts_with(http.request.uri.path, "/_app/")
  and not starts_with(http.request.uri.path, "/fonts/")
  and not starts_with(http.request.uri.path, "/icons/")
  and not cf.client.bot
```

**Those three exclusions are load-bearing and must stay equal to the first three
`run_worker_first` negations in `site/wrangler.jsonc`.** A reader who accepts the offline
library pulls ~2,240 content assets in a burst from one IP, and all of them are under
`/_app/immutable/assets/`; counting those would rate-limit the site's headline feature at
the moment it works. The excluded set is also exactly the set that is free to serve, so
there is nothing there to protect. What remains is the navigation plus the eight
one-per-visit files the service worker precaches from outside those prefixes, so a cold
visit spends **nine** and a returning reader spends **zero** — their service worker answers
the navigation. An in-app route change is a `pushState` and never reaches the edge. 120 is
therefore about thirteen simultaneous first-time readers behind one address.

**It was written as `site/scripts/waf-rate-limit.mjs` and the script has been deleted.**
Wrangler's OAuth token is `zone:read` and cannot write — or even read — the ratelimit
ruleset, so the script could never apply anything; a script that cannot run reads as though
it does. The rule is dashboard state, and this is its record.

Three things about it are decisions rather than settings. **`cf.client.bot`, not a
user-agent test**: the free plan restricts the expression to Path and Verified Bot, which
is a good restriction — it exempts Googlebot and Bingbot by Cloudflare's own reverse-DNS
verification instead of by a string anyone can send. **Block, because it is the only action
the free plan offers here**; managed challenge was the first choice and is not on the menu.
For the traffic this aims at that is an improvement — a block answers **429**, the
standardised back-off signal a crawler can act on, where a challenge says nothing. The loss
is entirely in the false-positive case, which is why the threshold is 120 rather than the
40 it would have been under a challenge: a shared exit address (a household, an office, a
carrier's CGNAT) is many readers on one IP, and a 10-second characteristic cannot tell them
apart.

**What it does not do**: bound a daily total. The free plan allows one rule, per IP, over a
10-second window, so a scraper pacing itself just under the threshold stays under it all
day. This stops the pathological case — the crawler that takes the whole budget in twenty
minutes needs 83 requests/second — and nothing subtler. The levers that bound the total are
the AI-crawler controls and an accurate sitemap `lastmod`.

**What a crawler that does not render is told — and what it is still not told**
(2026-08-26). `ssr = false` means `%sveltekit.head%` is empty in the build, so the one
document served for all 5,812 canonical addresses is the whole of what a non-rendering
consumer receives. Until now that document had **no `<title>` at all** and one
library-wide description, so every social unfurl, every chat preview and every crawler
that is not Google saw an untitled, bodyless page — the same one, 5,812 times, which is
also the textbook signature of duplicated content. `app.html` now carries a static
`<title>`; it is safe there because Svelte compiles a `<title>` in `<svelte:head>` to an
assignment to `document.title` rather than to an appended element, so the route's own
title overwrites it at hydration rather than being shadowed by it.

That fixes the missing name, not the sameness. **The open option is to have
`src/worker.ts` inject a per-address `<title>`, description and `<noscript>` line**, all
derived from the address it has already parsed and the `corpus-routes.json` it already
holds — no corpus text at the edge, and no extra invocation, since the invocation is spent
the moment the request arrives. It would give `/catechismus/330` a name of its own without
JavaScript, and let the `<noscript>` say what `llms.txt` says in prose: that the text
renders in a browser, and that the source publisher is the place to take it from.

Deliberately **not done yet**, because it costs two things worth deciding in the open
rather than in a commit. It widens the edge worker's job past the line `wrangler.jsonc`
draws for it — "not an application server and never reads or transforms corpus text" — and
a title derived from an address is not corpus text but is not nothing either. And it adds
`HTMLRewriter` work to every navigation, against a CPU limit that has never yet been the
binding constraint and would want measuring before it is.

**A link to this site is unfurled, not searched, nearly everywhere it is pasted**
(2026-08-26). The head above is read by search engines; what a chat client, a forum or a
social post reads is Open Graph, and there was none — so a pasted link rendered as the bare
URL. `app.html` now carries the tags and `static/og.png` the card they point at.

Two of the tags are absent on purpose, and the absences are the decisions. **`og:url` is
omitted**: its job is to name the canonical address of the thing being unfurled, and with
one document answering all 5,812 addresses the only value this file could hold is the site
root — which would retitle and relink every deep-link preview to the home page. Omitted, an
unfurler falls back to the URL it fetched, which is right by construction. **`og:locale` is
omitted** for the same shape of reason: the interface language is a stored preference, not
part of the path, so no one value is true of the document.

**The card is generated, not drawn** (`site/scripts/og-image.mjs`). It is the site's own
wordmark — the lockup from `Wordmark.svelte`, whose second line is sized by a ratio derived
from Pirata One's advance widths — set in the site's own faces on the light palette's
paper, with the words read from `manifest.webmanifest` so the image cannot claim a name or
a description the site does not. Drawing that by hand in an editor produces a second
wordmark, which is the drift that component's docblock already spends a paragraph
refusing. The script is run by hand and the PNG committed: it shells out to
`woff2_decompress` and `rsvg-convert` (fontconfig will not read woff2, and the render is
pointed at a private font directory so a locally-installed EB Garamond of another vintage
cannot answer instead), and a deploy that needs either binary is a deploy that fails on a
machine which is otherwise fine.

It is **one image in one theme**, and the theme is the paper. A card is a single file
served to a reader whose `prefers-color-scheme` it cannot know, so there is nothing to
answer — only a choice of which of the site's looks represents it.

The file is 47 KB nothing on this site ever fetches, which puts it in two lists it would
otherwise have quietly missed: `CRAWLER_FILES` in `sw-policy.ts`, so the service worker
does not precache a card for an unfurler in someone else's chat client, and the
`run_worker_first` negations in `wrangler.jsonc`, so a scrape of it is not a billed Worker
invocation.

**The sitemap dates each URL from the English text, because that is the text the URL
serves a crawler** (2026-08-26). `<lastmod>` comes from a committed ledger of per-address
fingerprints (`site/scripts/lastmod.mjs`) rather than the build clock — git's granularity
is the work, so `git log -1 -- works/ccc.en/paragraphs.json` would call a one-paragraph
correction a change to all 2,865 CCC addresses, which is the lie the element is discounted
for.

The ledger first unioned every edition answering at an address, and that was the same lie
one level down. **There is exactly one URL per address and no `hreflang` alternates** —
the reader's language is a stored preference, not part of the path — so the page a crawler
is told about is the page a crawler gets, and a crawler arrives with no preference. It
gets English, or Latin where the corpus has no English. A Malagasy re-parse moving 2,865
dates would have been 2,865 claims about a text no consumer of the sitemap can see.
`SITEMAP_LANGS` is `CONTENT_LANG_FALLBACK.en`, a test asserts the two agree, and the sync
prints which language each address was read from — today 5,797 English and 7 from neither
(the documents held only in Italian and Portuguese, which follow `defaultWorkId` in
rendering _something_ rather than refusing). The other fourteen languages are not
unadvertised; they are one preference away at the same URL, and simply get no vote on when
it changed. If a language ever becomes addressable, this is the decision to revisit.

Narrowing the basis moved every multi-edition hash at once, which is exactly the shape the
change ceiling exists to refuse. The migration was a `LEDGER_VERSION` bump instead: an
unrecognised version re-seeds from each work's own corpus commit date, which is true, where
carrying the ledger forward would have stamped 5,804 addresses as changed today. It
produced **identical dates** — the narrowing is invisible in this build and entirely about
the next one.

The eight static pages carry no `lastmod` at all, deliberately: they are chrome, whose
content changes with the app, and the ledger does not fingerprint the app. The **file**
carries none either, and cannot — a sitemap's own date exists only inside a
`<sitemapindex>`, and 5,812 URLs against a 50,000 cap do not warrant one. Cloudflare
serves it with a strong `ETag` and no `Last-Modified`; adding the latter would mean routing
the file through the Worker that `run_worker_first` deliberately negates, at an invocation
per fetch.

**The `ETag` is not worth reasoning about either way, and it is worth saying so** rather
than leaving it to look like a compensating mechanism. A conditional fetch of the sitemap
saves a 562 KB body, but `/sitemap.xml` is negated in `run_worker_first`, so the request
was already free of invocations, and bandwidth is unmetered on this plan. It saves nothing
we pay for. Nor does a 304 change crawl scheduling: what schedules a recrawl is the
`<lastmod>` values, which a crawler receiving a 304 already holds. The byte-stability the
ledger buys is real, but it pays off somewhere else — Wrangler dedupes uploads by content
hash, so a deploy over an unchanged corpus re-uploads neither the sitemap nor the corpus
JSON.

**Deploy guards measure the corpus, not the page count.** Preflight refuses a
fixture-sized build, and refuses a build whose reference coverage fell more than 3% below
the committed baseline in any family — every grammar regression so far was silent. A
deliberate drop is recorded with `npm run coverage:accept` and shows in the diff. There is
no CI; a deploy ships one person's working tree.

**The jump box suggests over the sitemap's address space, not over a search index.**
It was a parser with a field in front of it: type a finished citation, press Enter, be
told "no match". That serves a reader who already knows the address, and three quarters of
the corpus has no address anyone would type — a document, a prayer and a Summa question
are reached by name. `suggest.ts` enumerates what a fragment could become, from the same
places `scripts/sitemap.mjs` enumerates: Bible chapters and verses, Catechism paragraphs
and chapters, Compendium questions and chapters, documents (with a section locus, `LG 12`),
prayers, Summa questions, and the section landing pages. It reads the index tier only, so
a keystroke costs no fetch and the box works offline. It is deliberately not full-text
search — it completes addresses, which is what this site's URLs name.

**It completes in the reader's own notation, sharing the parser's tables rather than
copying them.** The surface forms come from `refs-grammar.ts` through `grammarSurface`,
the same tables `parseRefs` links printed citations with, because a form the suggester
completes and the parser then fails to resolve would offer an address that does not exist.
Behind them every edition's own `abbrevs` and `name` are matched, ranked lower — the five
interface languages with no grammar config would otherwise complete nothing but English.
What this cannot fix is a table that has no full book names in it: the tables are derived
from citations by `scripts/book-forms-oracle.mjs`, so a French reader completes `Jn 3` and
not `Jean 3`, and inventing the missing names is exactly the hand-maintenance that
derivation exists to avoid.

**A suggester has a list, so divergent numbering is offered rather than guessed.** `Ps 23`
is Psalm 22 in this corpus and Psalm 23 is also a real address; `refparse.ts` has to pick
one and picks the citation's meaning. The box shows both, converted first, each labelled by
where it actually goes — which is the one thing this surface can do about
`docs/link-surface.md`'s standing warning that a wrong chapter does not fail an existence
check.

**Tab completes, Enter goes, and a completion is an input rather than a label.** A
suggestion is usually a PREFIX of where the reader is going — completing `John 3` and then
typing `:16` is a chain the box could not previously make — so Tab fills the field and
leaves it open, and only with a row chosen, because Tab is also the only keyboard way out
of a modal. Every row states its own completion because the label is an output and the two
part company wherever the label reads better than the grammar parses: "Summa II-II, Q 184"
parses as nothing. The round-trip is tested as a property over every row, not spot-checked,
and it found three real defects — a book introduction swallowed by the single-chapter
fixup, a full section name outranked by a Summa title that merely contained the word, and
an Arabic completion the partial matcher could not read back because it wrote the Arabic
comma and read only the Latin one.

**A completion of a divergent chapter is a DUAL citation, because a plain one converts
twice.** A row labelled "Psalms 22" completing to "Psalms 22" is read back as a Hebrew
citation and converted to Psalm 21 — Tab moved the reader's own chosen row down the list
they picked it from. `refparse.ts` already has the escape hatch and the sources already
print it: `Ps 22(23)` states both numberings, so nothing converts. It is the same
double-conversion `address.ts` refuses to risk by parsing URLs with regexes instead of
replaying how they were built.

**`suggest()` reads its language from its argument, never from the store.** The component
passes `i18n.lang`, so the two agree in the app; a function whose output half-follows its
argument and half-follows a global is one nobody can test, and this one is tested at
fourteen languages' worth of labels. Enter still runs the parser when no row is chosen, so
a complete citation stays a one-keystroke operation and the shapes the suggester declines
to complete — a verse list, an `ff` tail — keep working.

**Loose matching is a dependency, and it is the site's second one.** `fuzzysort` (MIT,
zero deps, 7.5 KB gzipped) against ~70 lines of hand-rolled subsequence scoring: the
algorithm is textbook and the TUNING is not, and the tuning is what decides whether a
list of eight rows is useful. Buying a scorer somebody else has already tuned, and
spending the saved effort on measuring it against this corpus, is the better trade. It
also folds diacritics and reads Cyrillic and Arabic, which a first attempt would have got
wrong here and nowhere it was tested.

**It is injected, not imported, so it stays out of the boot chunk.** `JumpBox` sits in the
layout header, so a static import would put 7.5 KB in the chunk every route
`modulepreload`s — for a tier only some readers reach. The box loads it when it first opens
and calls `setFuzzyRanker`; until then the literal tiers answer alone, which is what the
first keystroke sees and nobody notices. Offline is not the casualty it looks like:
`sw-policy.ts` precaches every build asset that is not corpus content, and a lazily
imported chunk is an ordinary build asset. Verified in the build — fuzzysort is its own
8 KB chunk and appears in none of the 17 boot modules. This is `refs-grammar.ts`'s
`setDocumentTitleSource` arrangement, for the same reason.

**Fuzzy sits in one band below every literal reading, and may not stack a guess on a
guess.** It adds rows; it never reorders the ones something actually read, and a test
asserts that over five queries. A section reached only loosely will not then attach a unit
number to itself — `ctechism 27` offers the Catechism and not paragraph 27, because which
work was meant and what the digits are would be two guesses, and the second is not one to
make. Its rows complete to the real title, so Tab turns a guess into something the literal
tiers read.

**The threshold is 0.3, measured, not fuzzysort's default 0.5.** fuzzysort penalises by
target length and this corpus's names are long, so a real typo lands between 0.33 and 0.39
(`rerm novarum` 0.386, `magnifca` 0.345, `sacrosanctm` 0.337, `rosry` 0.336). Swept over
sixteen plausible misspellings and thirteen queries whose literal reading must not move:
0.5 found four, 0.35 found ten, 0.3 found fourteen with no literal row displaced and
almost no rows added to queries that already had an answer. 0.25 is where the first
regression appears and the lists start filling with noise. The cost side is real and
recorded — `perfecton` against the Summa's fifty-character titles scores 0.282 and is
missed.

**Books get a SECOND matcher, because a transposition is not a weak subsequence — it is
none.** `fuzzysort.single('jonh', 'john')` returns `null`, not a low score, since the `h`
the needle wants after the `n` is behind it in the target; and transposing two letters is
the commonest way to mistype a word one knows. Bible books were also not in the fuzzy
haystack at all, which was a plain gap: `gnesis` scores 0.358 against "genesis", over the
threshold, and was thrown away. Both are answered by bounded Optimal String Alignment over
the book forms — twenty lines, no dependency, and not behind the lazy import, so it answers
on the first keystroke. It runs only where no form was read literally, at four characters
or more, one edit to six and two above: `jonh`, `jhon`, `psalsm`, `mathew` are one and
`corinthans` is two, while `jo` alone is within one of Joshua, Job, Jeremiah and John and
is a literal reading of John — the inversion `book-token.ts` warns about, and the reason
for the gate. Titles keep fuzzysort alone: a distance-2 window over hundreds of long names
has not been measured, so `perfectoin` still reads as nothing.

**The right letters in the wrong order outrank a wrong letter.** `jonh` is one edit from
Joshua, Jonah and John at once, and distance alone cannot separate them. Joshua and Jonah
are reached by changing or dropping a letter, which is also how one reaches a DIFFERENT
book; John is reached by rearranging the letters actually typed, which is only how one
mistypes the word one meant. Same length and same multiset is the whole test, and it needs
no backtrack through the matrix. All three are still offered — the box is a list.

**Everything built on a book read loosely is demoted as a block, and the exact shapes
refuse it outright.** The numeric tiers still say which chapter was meant, so the block
keeps its own order, but `SCORE.exactUnit` is 900 and `jonh 3` is not an exact anything —
it lands in the same band as every other loose reading. `exactReference`, which confirms
verse ranges in the top band, declines a misspelled book rather than demoting it: a guess
with a range attached is a guess wearing a certainty. Cost is 0.70 ms per keystroke against
0.49 for a token that reads literally, since the tier only runs when nothing did.

**Subsequence matching cannot read a transposition, at any threshold.** `perfecton` reads
and `perfectoin` does not, because its `o` precedes its `i` and the target's does not.
Written down as a test rather than left as folklore, since the next person to meet it will
otherwise file it as a bug and tune the threshold, which cannot fix it.

**The matched span is marked in the row, and re-derived rather than carried.** A row shows
an address as the reader's own language spells it, which is very often not what they typed
— `jo 3` offers "John 3", `lg` offers "Lumen Gentium" — so the row says where it goes and
nothing about why it is on a list of eight. `highlight.ts` marks the spans, and it matches
the LABEL rather than reusing what `suggest.ts` matched: the suggester scores a candidate's
_forms_ (a title, a slug with its hyphens opened out, a siglum, a book abbreviation in
eleven languages), and a span in a form the reader cannot see is nothing to draw. The
consequence is stated rather than papered over — `lg` reaching "Lumen Gentium" carries no
mark at all, because the evidence was a siglum and the siglum is not printed. It renders as
segments and never as `{@html}`: the strings being marked are corpus titles.

**It marks by the matcher's own tiers, with one asymmetry that is the corpus's.** A token
marks where it opens a word, and only where it opens none does an interior hit count, from
four characters — `titleScore`'s gate and `titleSubstring`'s measurement. A one-LETTER
token must be a whole word and a one-DIGIT token need not: `summa i-ii 1` otherwise marked
the `I` of "In", "Is" and "Intention" down four rows of Summa titles, while a digit is an
address whose typed prefix is exactly why the row is there, so `jo 3` marking the `3` of
"Job 30" is information. Where nothing matches literally a subsequence is marked instead,
for the rows loose matching put on the list — `capcity` over "Man's **Cap**a**city** for
God" is the whole explanation for a row that would otherwise look accidental. That pass
runs only after the literal tiers find nothing, and it is honest rather than tidy: a stray
letter far from the rest ("**Prayer** in the Chri**s**tian Life") is what the matcher
actually walked, and hiding it would mean drawing a shape the ranker did not use.

**Theme is independent axes, not one list.** `auto / light / dark / sepia` made one value
answer two questions and cost the reader a real combination. Sepia yields to dark because
no dark-sepia palette exists, and it is **suspended, not cleared** — a dark control that
silently does nothing is more surprising than an inert sepia row that says why. Cascade
order in `app.css` is what encodes the precedence.

**Two faces, split on authorship rather than on chrome-versus-content.** What the work
wrote is EB Garamond — every `h1`, every structure heading. What we wrote _about_ the
work is Source Sans — the header, the controls, the labels, the marker beside a title.
A heading is a title until it says otherwise.

**A scoped rule cannot reach into a child component, and the failure is silent.** Svelte
scopes an ANCESTOR selector with a hard class, so `.division p` or
`.compare-unit-field .subtitle` written in a route simply stops matching once the element
it names is rendered by a shared component — no error, no unused-selector warning, just
spacing that quietly changes. Pass a custom property the child reads
(`--prose-block-gap`), or `:global()` the ancestor alone.

**A note goes in the margin where there is a margin and becomes a disclosure where there
is not**, and the breakpoint is legible to the markup, not only to the stylesheet: a
visible margin note is not a disclosure control, and `aria-expanded` on a button whose
content is on screen is a lie.

**Fixtures deliberately encode absent chapters and out-of-range cross-references** to
exercise the not-in-corpus paths, and a second English Bible to exercise the
preferred-edition table. `npm test` always uses them (`corpus.ts` checks
`import.meta.env.VITEST`); a replacement that drops those properties silently stops
testing them.

**Do not drive the site with browser automation to check UI changes.** The person
directing the work does that verification themselves.

## Scope

**In**: the Bible (four editions), the CCC, the Compendium, all encyclicals across all
pontificates, the 16 Vatican II documents, apostolic exhortations, the prayers, and the
Summa (EN + LA).

**Every encyclical the Holy See publishes is on the site in some language** — English
where it exists, otherwise the language it does exist in. Discovery consults the Italian
index per pontificate for anything English does not list; measured, Italian is the only
language that reaches a document English does not. This is not a "crawl more languages"
switch: the language a document arrives in is whichever one it exists in.

**Translations beyond that are fetched, not published, by default.** Every encyclical is
held in `raw/` in the nine interface languages plus Latin; acquiring sources and deciding
what to publish are separate decisions on separate timescales. A page's own language bar
under-reports by a factor of six and cannot be used as an index of what exists.

**Out, each for a reason that will not change on its own:**

- **The Fathers** — a library, not a work. Measured by _works_ rather than authors, the
  demand is flat: 69% of 734 cited works are cited exactly once, and "ingest Augustine"
  is eighty-two projects. There is no top-forty subset. Parse the citation strings
  instead; 72.8% already carry a work-internal locator.
- **The Code of Canon Law** — no Portuguese edition on vatican.va at all.
- **Denzinger** — Herder-copyrighted, never a vatican.va publication, despite being the
  most-cited non-scripture siglum in the CCC.
- **General audiences** — thousands of talks, low citation density.
- **Roman Catechism, Vatican I** — not found on vatican.va under any URL tried.
- **IntraText as a source** — quality there is per **work**, not per site: the same
  library holds a faithful copy of the Holy See's own edition and a truncated
  unattributed transcription. A good result licenses nothing about the next work. It is
  also not a fallback for anything published after it stopped: the vatican.va Compendium
  pages are IntraText's _export_, but the Compendium is absent from IntraText's own
  library, whose Catholica section carries the 1997 Catechism and stops before 2005.
- **Machine-translated sources** — disqualified on provenance. Note this now has to be
  read per work: liriocatolico, the source of `bible.matos-soares.pt`, has begun
  publishing AI-translated text elsewhere on the site.
- **A critical edition of anything.** Taking the better reading at each disagreement
  between two witnesses produces a text no page prints, whose provenance is a rule rather
  than a URL. `prayer.common.la` therefore takes one witness's characters and only the
  other's _segmentation_, which the base witness does not carry and cannot be wrong about.

## Process

**Shared code is decided by entitlement, not by identical bodies.** `apply_corrections`
moved because everything in it comes from above the edition — the drift guard, the
locator shape, the schema. `validate` did not, though it was byte-identical, because it
is exactly where an edition's claims about its own text live and is _expected_ to
diverge. Rate limits and decoding are the same category.

**A hook says when a check runs; an npm script says how to invoke one.** There is no CI,
so the alternative to the hook is nothing running it. It checks the **index**, piped from
`git show :path`, so an unstaged fix cannot make a broken commit pass and an unstaged
breakage cannot fail a clean one, and it checks rather than rewrites. Mechanics and the
per-clone opt-in are in `CLAUDE.md`.

**Ruff's rule selection is pinned rather than defaulted** — the defaults have widened
across releases, so relying on them means an upgrade silently changes what a commit is
checked against. Two exclusions are about this corpus rather than taste: `E501` (verbatim
excerpts and source URLs run long) and `RUF001/2/3` (Latin, Portuguese and Greek prose
with curly quotes is the content, not a homoglyph attack).

**Deleting generated works is a decision for the person directing the work**, not a
judgment call to make mid-task. If you are delegating, name the deletable set and the
protected set explicitly — a brief that only says what to _fix_ leaves deletion as an
unstated judgment call, and it will get taken.
