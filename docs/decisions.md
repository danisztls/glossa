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

**Free, ad-free, account-free.** No advertising, no accounts, no third-party code, no
cookies, and nothing that identifies a reader. There IS a usage measurement as of
2026-08-27 — first-party, bucketed, unlinkable — and §Usage measurement below is the
argument for why it does not cost the privacy position anything the colophon has to
qualify.

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
be temporary; the file shipped empty, and holds 25 works today — all quality
switch-offs from the 2026-08-29 language expansions, each with its measured defect.

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

**`raw/` is write-once. `build/` is regenerable.** The project's whole insurance policy
is that capture regret is fixed by **re-parsing, never re-crawling**, and that holds
only while `raw/` is intact. When judging whether a deletion is safe the question is
never "is this corpus data" but which of the two it is.

**The directories are named for that question now** (2026-08-27). They were `raw/`,
`works/` and `oracles/` — three siblings whose names said what each held and not which
was derived, so the distinction lived in prose and had to be recalled rather than read.
`works/` became **`build/`**, and the word does the work the paragraph above was doing:
`raw/` is what someone else's server was asked for, `oracles/` is what a person read off
those pages by hand, `build/` is output. It also lets `.gitignore` say `build/` once, so
a generated kind added later is ignored by default rather than by someone remembering to
come back to it — the failure this whole entry is about, in miniature.

**And it is no longer tracked** (same day). It was, on the reasoning that a
byte-for-byte reproducible rebuild made the commit free and bought a diffable history
across parser changes. What it bought was a history of OUTPUT — 42 of the repository's
71 commits touched nothing else — over a repository that exists for the pages someone
else's server was asked for and the readings a person made by hand. `raw/` and
`oracles/` stay; `build/` is ignored, and the history carrying it was rewritten out.
The pack fell from 182 MB to 137 MB, which is the smaller half of the point.

**The precondition was a measurement, not the claim already in the README.** That
claim — reproducible, therefore safe to drop — had never been tested against the
corpus as it stood, and it did not hold three ways. The documented recipe named
pre-reorganisation paths for six of its eight commands; it omitted `summa.py`,
`douay_rheims.py` and `introductions.py`, so it built 369 of 383 works and said
nothing was wrong; and a rebuild into an empty directory silently dropped the
`translations` field from 125 manifests, because the only thing that had ever
preserved it was the scraper reading the previous output. **Output regenerable only
from a copy of itself is not regenerable**, and untracking is what turns that from a
latent defect into a loss. Each was fixed and then the rebuild was verified in full:
383 works, 1,850 files, zero differences outside the three timestamps, zero network
requests, 16 seconds.

**A date the source was asked on belongs to the page.** `retrieved_at` is the
day this project made a request against someone else's server — the one fact in
a manifest recording an action taken toward a third party rather than a
computation over the result — and until 2026-08-28 it survived only in
`build/<id>/manifest.json`, kept by four scrapers reading their own previous
output and by the fifth (354 of 383 works) not at all. It now lives in
`raw/<source>/captured-at.json`, written by `Fetcher` as it writes the page.
Two things were wrong and both are fixed: it was regenerable only from a copy
of itself, and it was per WORK, recording whichever crawl session last touched
it rather than when the page was taken. The true per-page dates came from
filesystem mtimes, which git does not preserve — one working tree held all
6,328, and they corrected 354 works.

**A normalised field is a hole a reproducibility check cannot see.** That the
capture dates were being lost was invisible because the check excluded
`retrieved_at`, on the strength of a README sentence claiming it recorded only
when the parse ran. The sentence was backwards. A check can disprove a claim
about a value; it cannot disprove a claim that the value does not matter.

**A status the source answered is an input.** `translations` records what a missing
sibling-language edition turned out to BE — a page shell with no translation, a
measured 404 — and that is knowledge bought with requests against vatican.va, the same
class as `absent-sources.json`. It now lives beside it in `pipeline/`, tracked and
diffable in the public repository, and the parser reads it rather than remembering it.

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
vatican.va publishes the Compendium in fourteen languages; we parsed two when this was
written. All fourteen were in `raw/` regardless — ten HTML, four PDF-only — because the
marginal cost was twelve requests once, and the alternative is that the day a third
language is wanted, someone crawls that server again. This is the same insurance the
rule above states, paid before the loss rather than after — and it paid out on
2026-09-02, when all fourteen came to parse, the PDF four through
`ccc/compendium_pdf.py`, with no request to anyone. It scales by judgment, not by rule: the whole
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

**`works/` was tracked in git anyway**, though derived. Not for reproducibility — for
**diffability**: the blast radius of a parser change was `git status` in the corpus repo,
and nothing else answered "what did this fix actually move". ~~Reversed 2026-08-27~~ —
see §The corpus above: what it bought was a history of output, and the diffability it
paid for is now a rebuild-and-compare rather than a `git status`.

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

**The edition's own inconsistency is a witness, and it is the one that licenses a
citation correction.** The corpus writes the pre-1909 gazette under the later siglum 194
times — `AAS 18 (1885)` for what is volume 18 of the _Acta Sanctae Sedis_ — and the
question is which of those are defects. The test that decides it is internal:
`find-gazette-siglum.py` proposes an entry only where **the edition writes `ASS` at some
pre-1909 citations and `AAS` at others**, so the edition contradicts its own practice and
its correct uses are the witness. No sibling language is relied on, which matters because
this is a citation and not a lost space: the Latin editio typica of Lumen gentium prints
both sigla _in one footnote_, seven words apart, and that footnote is the whole argument
for its own correction.

**The refusal is the larger half, and it is where "never modernization" bites.** 56
editions and 134 citations write `AAS` uniformly — Czech Lumen gentium at all seventeen of
its pre-1909 citations. A uniform practice is that edition's usage, not a slip, and there
is no witness inside it; correcting those would impose the Latin's convention on an
edition that consistently does otherwise. They are reported under `--practice` and filed
nowhere. Two narrower refusals sit beside it: a volume and year that do not agree (Spanish
`AAS 29 (1896-1807)` is the right volume with an OCR'd year — a second defect, reported,
never bundled into the first), and a `from` that cannot be made unique, since
`apply_raw_text_corrections` matches by string and replaces once.

**A proposer must read the page the way the parser does.** The tool applies already-filed
corrections to the raw HTML before scanning it, because `raw/` is never modified: without
that, running it after filing finds the defect still in the page and gone from the parse,
disagrees with itself, and refuses every entry as unlocatable. It is idempotent as a
result, which is what makes it safe to run over the whole corpus repeatedly.

**Loud failure is the point.** An override exists because the parser is wrong, so the
parser improving is the _expected_ way for one to stop matching — indistinguishable from
being aimed at the wrong unit unless the run says which entry and why.

**Broken markup is the parser's business, not a correction, however few instances there
are.** The axis is what the defect is made of, not how many there are — the class-vs-instance
test in the table above sorts _prose_ defects and does not reach this one. A correction is
about the text a reader reads: a wrong word, a wrong number, a mismatched marker. It earns a
locator, evidence and loud drift-failure because someone must be able to audit a change to
what the source said. A corrupted **tag** changes nothing a reader reads. It changes only
whether the parser can find the text at all, and repairing it restores the source rather than
amending it. `bible.martini.it` meets three — `<em<` for `<em>` ten times, one `<br<`, and one
`zem>` — each an opening tag whose own `>` is missing or mangled, which a permissive stripper
swallows real words across. All three are normalised in `martini.py` before parsing, the
single instance included, with the locators in its module docstring. Filing them would put a
byte sequence with no address into a layer whose every entry is locator-plus-field, to record
an edit that leaves the text identical.

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
`WORK_CONFIGS` before the language table, and three works were listed there at first —
`summa.en`, `encyclical.aeterni-patris.en`, `encyclical.diuturnum.en`; the annotated
Bible editions and Haydock joined as their notes were linkified, seven entries today. Two
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

**A fixed section count is only a fixed byte count while the alphabet is** (2026-08-29).
`DOCUMENT_CHUNK_SIZE` was 50 on a measurement over a Latin-script corpus; the day the
documents landed in ten languages, `caritas-in-veritate.ru` made a 202 KB chunk out of
the same 50 sections its English edition fits in 108 KB, because Cyrillic and Arabic cost
two UTF-8 bytes a letter. The stride is 25. Every chunking premise this project has had
went stale the same way — recorded in a comment, correct when written, never re-measured
— and the alphabet is the axis none of them had thought to state.

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

**A run's verdict is a baseline, because most failure here is the corpus's known
state** (2026-08-29). `vatican_docs.py`'s two phases gated their exit code on the
cross-language symmetry check, which is chronically FAIL by design — two editions of one
document legitimately carry different section sets — so both had exited 1 on every run
they had ever had, and nothing was reading them. Gating instead on "no document failed"
would have been exactly as useless: a run reports 445 fetch failures, 212 documents whose
parse does not validate and 67 stub pages. The answerable question is whether a run went
worse than what was already written down, which is the shape the site's reference-coverage
baseline already uses. Two existing ledgers answer first — `absent-sources.json` for a
fetch failure the origin explained, `translations-checked.json` for a page that is a CMS
slot nobody filled — and `pipeline/parse-baseline.json` holds the 312 works those cannot
speak for, as a status and a problem count. Symmetry is now printed as the report it
always was. The limit is stated where the code is: the baseline is a floor under the
parse's addresses and not its structure, since `validate_document` never reads
`structure.json`, and breaking a division label was measured to pass the gate untouched.

**The rebuild recipe is a program** (2026-08-29). It was seventeen `sh` lines in
`glossa-corpus/README.md`, which is the only way back to an untracked `build/` and
which nothing executes, so nothing checked it. It rotted four times without once
failing: pre-reorganisation paths that built 369 of 383 works, a missing `dore.py`
that left the Bible with no illustrations, an unpassed `--exhortations` that left 33
documents with no work directory, and — found on the day it was replaced — a
hand-written `--langs` list one language short of `DIVISIONS`, which meant phase 2 had
never once asked vatican.va for a Swahili edition of anything and the three that exist
were neither captured nor parsed — a hand-written list decides what is captured, not
just what is read, and "re-parse, never re-crawl" cannot recover a page nobody asked
for. `pipeline/rebuild.py` is
the list, executable, with `--only`, `--list` and `--dry-run`; it derives what it can
from the scrapers rather than restating it, which is what stops the fourth kind. It is
deliberately not a build system: there is no dependency graph between stages and
nothing that rebuilds half of one, because a cached `raw/` already makes a re-run
fetch nothing and `write_stamped_json` already makes it write nothing it did not
change. It grew one staleness comparison the same day, opt-in and whole-stage; see
the next entry.

**A rebuild's cost is CPU, and `--changed-only` is what a parser's author spends
instead** (2026-08-29). A full rebuild writes zero files and makes zero requests and
still cost fifty seconds, all of it re-parsing, which is a poor price to pay dozens
of times while one parser is being worked on. Three changes took it to nineteen, and
the ordering of them matters more than the number.

The enabling one is that **each stage now declares the work-id globs it writes, and
those globs are a partition of `build/`** — 1,469 works at last count, each claimed by exactly one
stage, none twice and none unclaimed. That is what makes running stages concurrently
safe rather than merely faster, and it is what keeps the `wrote` column honest under
`--jobs`, since a snapshot of the whole corpus taken around one of four concurrent
stages would credit it with the other three's writes. It also replaced four
hand-written work counts in `--list` with measured ones.

The second is that **the two document stages run `--offline` and take a lock per
phase**. They are most of the work and were the only pair that could not overlap:
both took `vatican_docs.py`'s single crawl lock, so twenty-seven seconds of a
fifty-second rebuild ran with three of sixteen cores busy and then eight. The lock
was right and the reason for it was two reasons wearing one name — doubling the
request rate against vatican.va, and racing a work directory. An offline run retires
the first, and the second is a race between two runs of the same phase, never
between phase 1 and phase 2, which write disjoint families. `--offline` is also
worth having on its own: this recipe has always claimed zero network and nothing
enforced it, and `CLAUDE.md` records a supposedly-zero-network run that cost 36
requests and 2m59s.

The third is `--changed-only`, which skips a stage whose `code`, `data`, `corpus`
and `outputs` fingerprints all match the last run of it that exited 0. **`code` is
the script's real import closure**, read off its `import` statements and hashed by
content — `bible/cpdv.py` reaches `bible/sacredbible.py` and all twelve modules of
`common/` with nobody writing that down, and a new import counts the day it is
written. A table would have been a second place to remember something, which is the
shape of every rot listed in the entry above. `data` (everything non-Python under
`pipeline/`) and `corpus` (`raw/`) are global rather than per stage: they change
rarely, and a whole rebuild when one moves is cheaper than a wrong answer about
which stage reads which. `outputs` is what refuses to skip over a `build/` someone
deleted or half-wrote.

It is opt-in, and stays opt-in. The default is still to run everything, for the same
reason `--skip-written` is not the default: a run that skips something is only as
good as its list of inputs, and the failure it risks is the silent stale answer this
project keeps meeting. The list is also knowably incomplete — `uv` resolves each
script's PEP 723 header at run time, so a `bs4` upgrade changes a parse without
changing a byte in this repository, and `--force` exists for exactly that. A stage
that exits nonzero is not recorded, so a broken parser is never skipped.

**A sampled run reports and writes nothing** (2026-08-29). `--sample` parses a chosen
slice — two books, one part, the Prologue and the article on Baptism — so what it
produces is a fraction of a work by construction. Seven of the eight scrapers that
have the flag wrote that fraction into the work's real directory under `build/`,
marked only by a `SAMPLE RUN — partial corpus, for review only` line in
`manifest.notes` that nothing downstream reads: a sampled `ccc.en` replaced
`paragraphs.json` with two article slices and would have passed preflight, whose
floor counts works and not their size, and a sampled Bible left two fresh book files
beside seventy-one the previous run had written — a state no full run can produce.
`matos_soares.py` printed "Full crawl NOT executed" at the end of a run that had just
overwritten the manifest. `summa.py` alone was right, and the rule is now stated once
in `common.sample_run_writes_nothing` rather than in each scraper: the protocol exists
to learn what a full crawl would cost before spending it, which wants a report and not
an artifact.

**A clause names as many documents as it names, and the parse stopped at the first**
(2026-09-03). CCC 90's Portuguese footnote reads `Cf. I Concílio do Vaticano, Const. dogm.
Dei Filius, c. 4: DS 3016 [...] Cf. II Concílio do Vaticano, Const. dogm. Lumen Gentium,
25: AAS 57 (1965) 29` — two documents this site holds, and only ever one link. The
leftmost-wins race between the siglum, title, Summa and work-title matchers was written to
settle which match comes FIRST; each of the four branches then dropped the rest of the
clause to plain text, which quietly made it settle that there was only one. The scripture
branch beside them had recursed since the day it was written, for the same reason and
against the same corpus — one clause carrying two references. Recursing all four raised
linkable citations in every family that moved (`vatii` 52.92% → 54.58%, `encyclical`
38.91% → 39.07%, `ccc` 77.74% → 77.76%) with `nothing` unchanged in each: what moved came
out of "recognized but not linkable", never out of text.

**And half of what that recovered would still have been dead, because a document was
addressed in the reader's language or not at all.** `refAddress` looked up the exact
`manifests[lang]` edition and emitted no link where there was none, on the argument that a
citation must not land a reader on an edition they are not reading. But a document URL
names no edition — `/documenta/{slug}` resolves one at page load through `editionInLang` —
so the refusal bought nothing and cost the citation: Dei Filius exists in Italian and Latin
only and is cited 25 times in the Portuguese Catechism and 17 in the English, and no
document in this corpus has a Malagasy edition, so all 141 of `ccc.mg`'s document citations
linked nowhere. It goes through `defaultDocumentWorkId(slug, lang)` now — the reader's own
edition first, and the one opening the document would have given them otherwise. **The
strict half was always the section check, not the language**: a section absent from the
edition the reader will actually get still refuses the anchor, and a title then degrades to
the landing page where a siglum links nowhere.

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
- **Reference apparatus** (`audit.py refs`, added 2026-09-02) — the Catechism paragraph
  numbers each Compendium question prints beside itself, compared across all fourteen
  editions. It is the only check here that may take a **vote**, and the reason is that
  what it compares is not written in any language: question N is the same question
  everywhere, so the editions are not fourteen renderings of an assertion but fourteen
  copies of it, and a copy can simply be wrong. Everything else in this list compares
  prose length, typography or structure, which an edition is entitled to differ about, so
  the strongest any of them may say is "an edition alone against the rest is a lead".
- **Hand-read oracles** — a person reads the source page and writes down its table of
  contents (`audit.py toc`), or a note's lemma is checked against the verse it quotes.
  These are the only checks that can see something the parser never produced at all.

**THE SHAPE OF A DISAGREEMENT NAMES ITS CULPRIT, WHICH IS WHY `refs` REPORTS A
CLASSIFICATION AND NOT A COUNT.** A ref-set is compared to the modal one by how it stands
to it, and the classes mean different things. A **subset or superset**, held consistently,
is the edition: the German prints only the first of the two ranges at 170 of 598 questions
and its own raw page says so at every one, and the Slovenian prints a wider apparatus at 82. Led with counts, those two would have buried everything else. **Overlapping or
disjoint** is a misprint — no printing convention produces a set that crosses the others
without containing them — and **a displaced pair** is a reading attached to the wrong unit.
The first run classified 98 leads; 38 were filed as corrections and the rest are the two
editions being themselves.

**A LONE COINCIDENCE IS NOT A DISPLACEMENT, AND THAT CLASS WAS WRONG FOR A DAY.** It began
as "a set equal to a neighbour's modal set", on the reasoning that such a coincidence is
unlikely. Checked against the raw pages, 14 of the 17 it flagged sit in the right slot on
their own source page and merely name a range a neighbouring question also names — because
these editions draw their ranges differently from each other to begin with. A real
displacement leaves a **pair**, so the unit it was displaced from must deviate too. That
took the class from 17 to 3, and the only real one in the corpus is the German exchanging
questions 248 and 249.

**THE EDITIONS ARE NOT INDEPENDENT WITNESSES, AND A VOTE QUIETLY ASSUMES THEY ARE.** German
and Slovenian carry the identical departure at six questions; Italian and French carry the
identical impossible range `1198-1999` at another. Two editions agreeing on a wrong value
is evidence of a shared exemplar, not of two observations — so "one against thirteen" is a
real standard and "two against twelve" is not the same claim with a smaller number. That
rule kept three questions out of `pipeline/corrections/` that the count alone would have
corrected.

**SO A VOTE PROPOSES AND SOMETHING ELSE DECIDES**, and every one of the 38 corrections
carries a witness independent of the count. Three were available and all three were
measured rather than assumed. The apparatus's groups **ascend**, in 375 of 375 modal sets
with more than one group, so a set running backwards is impossible on its face. Its last
group is the article's **In Brief**, in 357 of 375, while the first group is in one in 0 of
375 — a fact about the Catechism's own structure tree and nothing to do with the vote,
though it is a heuristic and not a rule, and it fires the wrong way at Italian 557 where
the wrong value happens to sit inside an In Brief. And the decisive one is simply **reading
the Catechism paragraph**: Compendium 382 asks what fortitude is, CCC 1837 is "Fortitude
ensures firmness in difficulties" and CCC 1838 is temperance. Counting a value proposes a
candidate; reading the sentence is what decides it — the `Пар.` lesson, in a fourth family.

**THE CATECHISM IS NOT IN THIS AUDIT AND HAS NO APPARATUS TO PUT IN IT.** `related`, the
field that would be exactly this shape, is empty in all 22,920 paragraphs of all eight
editions, because the vatican.va mirrors do not print the margin — `ccc.py` says so in
every manifest. What it has is `citations`, which are prose, and three of the eight
editions fold them into the sentence and print no footnote at all, so a cross-edition count
measures the convention rather than the parse. There is one narrower comparison worth
making and `docs/research/ccc-citation-apparatus.md` records it, along with the 71
paragraphs it finds.

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

**The magisterial documents' FOOTNOTES had no oracle at all until 2026-09-02, and
`audit.py apparatus` is three of them.** `coverage` cuts the raw page at the footnote
boundary and `stored_text_len` counts no citations, so the apparatus was outside its
universe on both sides of the division; `balance` is per-unit and `divisions` per
heading. The corpus stores 92,519 citations and **24,154 notes the source prints reach
no reader**. Four things about it are worth keeping.

**Two exact measures beat one heuristic, and the heuristic was written first.** The
obvious check is a hole in the marker run 1..N, and it cannot be made honest here: a
stray `(302)` in prose is stored as marker 302, Vatican II restarts its numbering per
chapter, and where the run ends therefore has to be guessed. Reading the source's own
footnote list with the parser's own reader asks both halves exactly instead — a stored
citation whose marker reached no note, and a note in the list no citation carries — and
needs no constant.

**The two total failures point in opposite directions and were one bucket until the
corpus was read.** `list-unread` is 123 editions whose markers were all found and whose
footnote LIST was not, so the apparatus is a set of markers pointing at nothing.
`markers-unread` is 97 editions where the list was read whole and not one marker
matched: `exhortation.vita-consecrata.la` stores 0 citations against 427 notes, its
template sniffed as `sup` where the body prints `(N)`, and only the Portuguese edition
of that document has an apparatus at all. Reported together as "notes missing" they are
one number; separated they are two bugs in two functions.

**A volume of the Acta is its year minus a constant, so a reference convicts itself.**
That is the only check in the file needing no second edition, and it therefore reaches
every edition of every document rather than the 24 the vote can compare. The constants
are DERIVED, not looked up: 98.71% of the corpus's 19,782 AAS references satisfy
`volume == year - 1908`, and the 304 that fail are transpositions — `AAS 38 (1991)` for
83, which is _Centesimus annus_, the Slovenian having copied the section number printed
immediately before it. Acta Sanctae Sedis takes its own offset and ceased in 1908, so an
ASS reference to a later year is the other series' name misspelled, which is 45 of them.

**And here the cross-language vote is the SUPPLEMENT, which is the exact inverse of the
Compendium's `refs`.** There the fourteen editions were fourteen copies of one
apparatus. Here they are different apparatus — `ad-caeli-reginam` prints 53 notes in
Italian, 62 in Latin and 63 in Portuguese and English, the Portuguese splitting the
Latin's last note in two — so footnote _k_ is footnote _k_ only where the marker sets
are identical, which is 24 documents holding 38% of the corpus's series references. What
it adds is the PAGE, which arithmetic cannot judge: `AAS 95 (2003), 47-48` where seven
editions read 447-448. Its shapes are classified for the reason `refs` classifies sets —
an edition citing the first page of a range rather than the range prints a NARROWER span
consistently, and the Byelorussian does it ten times out of ten. **A vote is only ever
as good as its precondition, and the precondition is what differs between the two
audits, not the technique.**

**Its first act was a parser fix worth 730 notes, and the rule it turned on was chosen by
measuring both candidates.** A `(N)` or `[N]` footnote marker's delimiter and digits are
not always adjacent — a Word export opens a `<font>` or an `<a>` between them — and of the
three marker templates only `sup` tolerated it, having stripped its inner tags since it
was written. Widening the other two to admit inline TAGS gains 591 markers and costs one
false; also admitting bare WHITESPACE gains 12 more and costs two, both in `iucunda-sane`,
whose prose cites an epistle's variant numbering (`Ibid. v, 58 (53 ) ad Virgil, episcop.`).
So tags are admitted and whitespace is not: **a false marker is worse than a missing one**
in a way the counts do not show, because it takes the printed number out of the reader's
prose and puts a footnote where the source marked nothing. Eight editions went from no
apparatus at all to a complete one, and the effect was confirmed by parsing the whole
document corpus both ways and diffing all 1,209 editions — exactly the 20 works a scan of
`raw/` predicted, and no others.

**A RECALL FIX SCORES AS A REGRESSION IN A CHECKER THAT COUNTS INCIDENTS**, which is worth
knowing before reading `parse-baseline.json`'s verdict on one. `eccl-de-euch.hr` went from
47 citations to 100 and from 46 resolved to 96, and the baseline recorded it as
`1 -> 4 problems`: finding more markers on a page whose note list only partly resolves
necessarily finds more unresolved ones. The two numbers have to be read together, and what
the pair actually exposed is a different defect that was there all along — those markers'
notes are all present in the source's own table, so the lookup is missing them.

## Addresses and editions

**A canonical URL selects a reference; the reader's preference selects the edition.**
So every reader URL is **edition-free** and Latin, and does not vary with interface
language: `/scriptura/{osis}/{chapter}`, `/catechismus/{n}`, `/catechismus/caput/{n}`,
`/catechismus/compendium/{n}`, `/documenta/{slug}`, `/doctores/summa/{part}/{question}`,
`/preces/{slug}`, `/signata`, `/colophon`. The English roots deliberately resolve as
invalid; there is no compatibility layer.

**The book segment became Latin on 2026-09-02, and the sentence above was half
false until it did.** Every path word here is Latin — `scriptura`, `catechismus`,
`doctores`, `preces` — and the one segment naming a book of the Bible was a lowercased
OSIS id, so a Vulgate-canonical library addressed the Apocalypse as `rev`, the Canticle
as `song` and Ecclesiasticus as `sir`. `/scriptura/iosue/1` now, and `BIBLE_BOOK_SLUGS`
in `address.ts` is the table.

**Derived from the corpus, not invented.** `bible.clementina.la` carries its own Latin
`name` for each of its 73 books; folding `æ` to `ae`, lowercasing and hyphenating gives
73 slugs with no collisions. The one departure is `J` → `I`, and it is one internal
authority against another: the Clementine prints `Joannes` and `Josue`, while
`BOOK_VARIANTS_LA` — the citation table, corroborated against the Latin Catechism's own
printed sigla — reads `Io` and `Ios` throughout. The checked table wins. So a name judged
wrong is a CORPUS defect, fixed in `pipeline/corrections/` and re-derived: the URL says
what the Latin book list on the page says, which is the whole point of it.

The Vulgate's own titles are NOT used where the corpus normalizes them — `i-corinthii`
rather than _ad Corinthios_, `i-machabaeus` rather than _Machabaeorum_, `i-reges` for
1 Kings rather than _III Regum_. That last one is worth reading as a feature: the
Clementine's names follow the MODERN division, so `i-samuel` and `i-reges` are
unambiguous, where the Vulgate's I–IV Regum numbering would have made `i-regum` mean 1
Samuel to one reader and 1 Kings to another. An address that needs a tradition to
disambiguate it is not an address.

**It costs a compatibility layer, which is the first, and the exception is precise.**
The rule two paragraphs up — the English roots resolve as invalid, there is no
compatibility layer — was paid in full twice, by the Compendium's move and the Summa's,
each of which knowingly dropped every reader's bookmarks. This is 1,405 published
addresses and the bulk of the sitemap, so the OSIS spelling gets a `301` instead. What
keeps the exception small is WHERE it lives: `parseHref` and `isCanonicalPath` learn
Latin and nothing else, so the grammar still has exactly one spelling per address and
`/scriptura/josh/1` is not an address by any reading. Two doormats know the old
vocabulary, both running before the grammar — `legacyBiblePath` in `src/worker.ts`, and
`migrateBibleHref` in `bookmarks.svelte.ts`, without which every reader's Bible
bookmarks would have vanished with nothing said. The compatibility layer is on the
doormat, not in the address space.

**The edge redirect is gated on the TARGET existing**, which is why it reads the route
manifest first. `/scriptura/gen/99` names no chapter in either spelling, and answering it
with a redirect to a 404 publishes a second dead address for every dead one — a link
checker follows the hop and then reports the wrong URL. A path that does not survive the
rewrite 404s where it stands.

**`scripts/lastmod.json`'s 1,405 Bible entries were re-keyed rather than left to
expire**, exactly as the Summa's move re-keyed its 611: `<lastmod>` means "when the text
last changed", and the text did not change. The sync confirms it — `5836 addresses — 0
changed, 0 new, 0 withdrawn` — which is also the check that the table is complete, since
a book the slug map missed would have shown up as a withdrawal and a new address.

**The route tree is that grammar and not a translation of it** (2026-08-29). The
directories under `src/routes/` were named in English with the Latin ones as thin
re-exports, which left `/ccc/1` answering 404 at the edge — `isCanonicalPath` has never
counted it — and then rendering Catechism ¶1 anyway, because the client router still
carried a `ccc/[n]` route to match. Eleven such routes existed, advertised by no sitemap
and emitted by no `hrefFor`. The implementations now live at the canonical paths and the
English directories are gone, so a legacy path is invalid in the app for the same reason
it is invalid at the edge, and the eighteen re-export files (each casting its `data`
through `unknown`, since a shim's generated `$types` cannot see through the re-export)
went with them. `/doctores/summa` was already the precedent: nothing was left at `/summa`
when it moved.

**The Compendium is addressed under the Catechism** (2026-08-28). It was `/compendium/{n}`
until then, and the move is what the work is: the _Compendium Catechismi Catholicae
Ecclesiae_, 598 questions over the same part/section/chapter outline the Catechism prints
at length — which `site/src/lib/toc-pairing.ts` verifies structurally across all 18
editions and `condensation.ts` corroborates from the questions' own `ccc_refs`. The
rejected spelling was `/catechismus/ccc/{n}` and `/catechismus/cccc/{n}`: `CCCC` is not a
siglum any edition prints (its only 12 occurrences in the corpus are Roman numerals inside
papal dates, `MDCCCCXXXI`), the two differ by a repetition count rather than a glyph, and
`compendium` is already the Latin word the initialism would abbreviate. The cost, accepted
knowingly: every reader's saved Compendium bookmarks are dropped, because
`bookmarks.svelte.ts` keys them by href and `load()` discards an href the current grammar
rejects.

**And the Compendium has no index of its own.** The Catechism's presents both works, a row
at a time: every part, section and chapter carries its paragraph range and its question
range together. Two landing pages showing one outline at two resolutions was the same page
written twice, and they had already drifted apart in their `<title>` tags. So there is one
nav entry, `/catechismus/compendium` is a path segment rather than a page — the way
`/catechismus/caput` already was — and the Compendium's own edition picker and copyright
notice live on the pages where a reader actually reads it.

**The Summa is addressed under `/doctores`, a shelf for the Fathers and Doctors of the
Church** (2026-08-28). It was `/summa/{part}/{question}` and a fifth entry in the main
navigation, sitting as a peer of Scripture, the Catechism, the Magisterium and the
prayers. Those four are the Church's own texts; the Summa is one Doctor writing about
them, and the corpus already draws that line internally — `research/summa-and-fathers.md`
§5 says the Summa and the Fathers "need a new work type", and `research/copyright.md` §5's
posture toward Church-owned texts explicitly does not transfer to an eight-centuries-dead
theologian whose modern translators are ordinary commercial publishers. The shelf is the
category that was missing.

`/doctores` and not `/patres` or `/traditio`. `patres` excludes Aquinas, who is a Doctor
and not a Father; `traditio` is the elegant one and the wrong one, because it would label
a private theologian's writings with the name of a source of revelation. `doctores` also
has an established translation in every interface language (fourteen then; thirty-four
now), which matters because `chromeNames` does not fall back to English — a coined
category would have meant commissioning inventions rather than looking up terms. The realistic
patristic ingest (Augustine, Jerome, Ambrose, Gregory, Chrysostom, Damascene) are all
Doctors as well as Fathers, so the name covers the shelf it will hold.

The nested spelling, `/doctores/summa/{part}/{question}`, rather than renaming the
existing prefix: the shelf and the work have to be different addresses, or the second work
on the shelf has nowhere to go. `/doctores` is a shelf like `/documenta`, and
`/doctores/summa` is a work index like `/catechismus`. Both are chrome — every word on
either is the interface — so both take every language prefix, and
`/doctores/summa` is the first two-segment member of `CHROME_PATHS`. The cost is the same
one the Compendium's move accepted three paragraphs up and is accepted for the same
reason: every saved Summa bookmark is dropped, and there is no compatibility layer.
`scripts/lastmod.json`'s 611 Summa entries were re-keyed rather than left to expire,
because `<lastmod>` means "when the text last changed" and the text did not change.

**The shelf is unlisted, and that is a separate decision from the move** (2026-08-28).
`NAV_ITEMS` is four entries now and names no shelf: the Summa is awaiting a quality pass,
and until it has had one and has company on the shelf, nothing in the reading interface
links to `/doctores`. It stays reachable by address, by the jump box, by a cross-reference
from the Catechism, and through the sitemap; `shell-head.ts`'s `sectionLinks` still names
it for a crawler with no script, because the sitemap publishes it either way and a
`<noscript>` map poorer than the sitemap buys nothing. This cuts against the rule the
prayers entry states in the same file — "a corpus nobody can find from the nav is a corpus
nobody reads" — and is meant to: the Summa is being held back deliberately, not filed
badly. Restoring it is one line, named in the comment where the entry used to be.

The usage beacon keeps `summa` as its own bucket and adds `doctores` for the shelf
(`usage-schema.ts`), by the same special case `/catechismus/compendium` already has. A
series that broke at the move would read as a collapse in readership rather than a change
of address.

**A canonical URL is written in `hrefFor` and nowhere else, and that is now true rather
than merely stated.** `StructureIndex` and `StructureSidebarToc` took a `hrefBase` /
`basePath` string and built `${base}/${n}` themselves, which made five call sites into
five more places the grammar was spelled out. Moving the Compendium left four live 404s
behind precisely there, because a grep for the old prefix cannot see a URL assembled from
a prop. Both components now take the address as a function, and the five callers pass
their own `hrefFor`.

**`src/lib/address.ts` is the only place a reader URL is written or read.** The grammar
was known in six places and four unions described the same thing; serializing an address
to a string and regex-parsing it back inside one process is not an architecture.

**Which edition a reader gets is written down, never derived from sort order.**
`PREFERRED_EDITION` names it per type and language, `DEFAULT_REGION` names the unmarked
region within a language, and a test refuses two editions sharing a tag with no entry.
An English reader got the CPDV because `c` sorts before `d` — right by accident, and one
rename from changing.

**An English reader gets the Douay-Rheims since 2026-09-01, and the argument was the
apparatus rather than the provenance.** The provenance was already on the record and was
not enough on its own: the CPDV is the one Bible here that is not a received edition —
one man's, self-published, unreviewed by his own choice, with a doctrinally motivated
`donec` → "yet" at Matt 1:25 — where every other language's default is an approved
translation with a history behind it (Clementina 1592, Martini, Allioli, Káldi-Tárkányi,
Crampon, Straubinger, Matos Soares). What actually decided it is that **the CPDV carries
no notes at all**, and Haydock annotates the Douay-Rheims, so `commentariesAt` returned
nothing and `ApparatusMenu`'s trigger did not render: the reader who chose nothing was
handed a bare text and no control saying an apparatus existed, on a site named for the
_Glossa Ordinaria_. The Douay-Rheims brings Challoner's 1,916 notes, his 1,307 chapter
arguments and Haydock's 45,747, and it is what the corpus already leaned on in English
anyway — `bible-intro.en` is Challoner's prefaces, shipped to CPDV readers all along;
Doré's plate anchors were decided against it; it prints Esther in the sixteen chapters
the corpus canonicalizes on, where the CPDV's fifteen leave a Douay-style "Esther 16" —
the form the magisterial corpus itself prints — unresolvable in the default edition.

**The cost is the register, and it falls on the readers least able to afford it.** "The
Lord ruleth me: and I shall want nothing" against "The Lord directs me, and nothing will
be lacking to me." Every `CONTENT_LANG_FALLBACK` row ends in `en, la` and only eight of
the thirty-four interface languages have a Bible of their own, so the English default is
what most of this site's readers meet — mostly as non-native English. It is accepted
because it is bounded: the CPDV is one click away in the edition menu, and the choice
persists. What is NOT settled by this is whether the CPDV should be one of the two
English editions at all; that is a different question from which one a reader meets
first, and it stays open.

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

**A commentary is a work with no address, and the reader's preference selects the
apparatus** (2026-09-01, `commentary.haydock.en`). The rule at the head of this section —
a canonical URL selects a reference, the reader's preference selects the edition — now
runs one notch further. Haydock wrote an apparatus ON the Douay-Rheims rather than a
translation of it, and vatican-style "which edition" has no answer for that: `HAY` ships
footnotes and no verses, so every consumer of `type: 'bible'` would be handed a text with
nothing in it. It is its own work type, its units name `{osis, chapter, verse}` of the
work its manifest `annotates`, and it contributes no route, no sitemap entry and nothing
to `route-titles.json`. `bible-intro` is the near precedent and stops one step short: an
introduction is chapter 0, which is an address.

**So the apparatus is a set and not a choice, which is why it could not join
`content.svelte.ts`.** Every other edition-shaped preference resolves to exactly one work
— `Override` holds one `workId`, `CompareStore.target` one id or `AUTO`. A reader can
have Challoner's notes and Haydock's catena beside the same verse, and that is the
arrangement this site is named for. `apparatus-prefs.svelte.ts` stores a set, the control
is a panel of `menuitemcheckbox` switches rather than a menu of radio items, and it sits
outside `.reading-bar-editions` so that wrapper's three controls keep reading as one
phrase.

**The two defaults are opposite on purpose.** An edition's own notes are ON, because the
reader who chose the Douay-Rheims chose Challoner's apparatus — it is what distinguishes
it from the four other English texts. A commentary is OFF, because it is the largest body
of text in the corpus and nobody opening a chapter asked for it; switching it on is what
causes it to be fetched at all. What is stored is therefore the DIFFERENCE from the
default and not the state: store the state and a reader who has never touched the panel is
indistinguishable from one who switched everything off, and the next work ingested arrives
silently switched off for the first of them.

**A commentary is anchored to the VERSE, by one mark, and each note is labelled by its
author.** It cannot be anchored the way a footnote is: a footnote has a token inside the
edition's own text, and a commentary has none to be given. The obvious substitute is the
lemma, and it was measured before it was rejected — of 45,824 notes (counted before
later corrections; 45,747 today) only 27,201 carry one
and 25,078 of those quote the Douay verbatim, so a lemma-matched token would anchor 55% of
the apparatus and only on the one edition whose words it quotes. A marker run with holes
in it is worse than no run. A verse is something every edition has, so one dagger sits at
the end of the verse and opens the whole of that verse's commentary; inside, each note is
labelled "Calmet", which needs no second vocabulary and tells the reader whose opinion
they are about to read where a letter tells them nothing. Two lettered runs a hand's width
apart would have printed two different "a"s with nothing to say which belonged to which.

**Verse anchoring is also what let the commentary be offered at EVERY edition.** The first
version gated it to the work its manifest `annotates`, on this section's own rule that
attaching an apparatus to a translation it was not written on is an editorial act. That
rule is about a note the reader cannot tell apart from the edition's own — Challoner's
notes ship inside `bible.douay-rheims`, and copying them to the CPDV would have read as
the CPDV's. Nothing about this apparatus is silent: it is a separate work, named in the
panel that switches it on, opened from its own mark, set in a card carrying its own
`lang`. So the gate was refusing the reader of the Clementine a commentary on the Latin in
front of her, to prevent a confusion the design had already ruled out.

**A commentary's marks sit at the words its notes quote, and it is offered only beside the
edition it annotates** (2026-09-01). The mark named the verse, on the reasoning that a
lemma quotes one text and a mark keyed to it would vanish beside the Clementine or the
CPDV — true, and answered by paying for it rather than by avoiding it: `commentariesAt`
takes a work id again, Haydock is the Douay-Rheims's, and a reader of another edition is
no longer offered it. That is a real cost, accepted because the alternative is half an
apparatus anchored in the text on one edition and the whole of it heaped at the verse's
end on the others.

**The order of the notes is what makes the placement safe rather than merely mostly
right.** A verse repeats its own words, so 1,939 of Haydock's headwords occur more than
once in the verse they annotate and a search cannot say which is meant. A catena is
printed in reading order, so the search carries a cursor and each note is found at or
after the end of the last: 1,930 of the 1,939 resolve, and the nine that do not — with
237 whose headwords run backwards — are refused rather than guessed. Anchoring reaches
24,805 of 45,662 notes, 54.3% (that denominator, like the one above, predates later
corrections; the total is 45,747 today).

**And the notes with no place in the text keep the mark they always had.** 40% of the
apparatus carries no headword at all, which is Haydock's own way of saying a note is a
remark on the whole verse rather than on a phrase of it. Those stay behind a mark at the
verse's end, so the two sets partition the verse's notes: 9,349 verses take inline marks
only, 1,846 a trailing mark only, 9,594 both. No note is behind two marks and none behind
none — which is the property to check, since a leak would lose a fifth of the apparatus
with nothing erroring.

**It sets nothing in the margin, at any width, which is where the _Glossa Ordinaria_
arrangement stops.** That arrangement assumes an apparatus smaller than the text it hangs
on; Haydock annotates 20,814 verses and a chapter of him runs to 4,690 characters at the
median against 52,496 at its worst, so the gutter column was neither beside the text nor
bounded by it — and below the breakpoint, in the flow, it made the Scripture an
interruption in the commentary. The mark opens a card instead, at every width. That looked
at the time like the exception rather than the rule — an edition's own notes and a
citation's source still took the margin, because those were remarks and this was a book.
Two days later the same measurement caught up with an edition's own notes, and only the
citation's source is left there (below, 2026-09-01).

**The one thing a second apparatus must not do is print the first one twice.** Haydock
published Challoner's text with Challoner's notes absorbed into his catena: 1,399 of the
Douay-Rheims's 1,916 notes appear again in it, 1,300 paragraphs signed "Challoner" by
name. That is a fact about the WORK, so it is stated in the corpus
(`CommentaryManifest.subsumes_notes`) rather than inferred by the interface, and what the
interface does with it is turn ONE default around — enabling the commentary switches the
edition's own notes off. Nothing is suppressed: the overlap is 73% and not 100%, so 517 of
Challoner's notes are only reachable that way, and the panel keeps the switch and says why
it moved.

**Attribution is parsed into a field, and the vocabulary is closed.** That was the open
question the research note would not answer, because splitting "… Witham" off the end of
someone else's sentence is an editorial act and is also the whole value of a catena. It is
settled by the standard this project already holds a source defect to: the vocabulary is
derived and then READ, a tail outside it stays in the text with no field rather than being
guessed at, and `--attributions` reports the residue. Taking whatever capitalised run ends
a paragraph reads "Mauduit here represents the word:" as an author, which is the `Пар.`
lesson in another family.

## Languages

**Content language follows UI language**, with a per-work-type override as the escape
hatch. One switch, fewer surprising states; the override sleeps and wakes on the UI
language it was made under.

**`UiLang` and `ContentLang` are two sets** — fourteen tags against fifteen when this
was written, thirty-four against twenty-eight today. They answer
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
the corpus navigable around it. (Superseded 2026-08-31: `i18n/mg.ts` was written — the
first dictionary for a language nobody working here reads, grounded in `ccc.mg`'s own
headings — when the interface became a superset of the content languages.) What the asymmetry must NOT do is leave the edition
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

Four rows named a neighbour ahead of that tail when this was written (eleven do today —
`fr → it`, `it → es`, `ro → it`, `sk → cs` and `be → pl` joined as their languages
arrived), each on a claim about a specific readership rather than on a general ranking of
languages by distance: `mg → fr` (French is
co-official in Madagascar and the language the Church there works in alongside Malagasy,
and `mg` has one work, so it is a reader who falls back constantly), `la → it` (the
closest living language to the one the reader chose, and the Holy See's working language),
`es → pt` and `pt → es` (where the fallback buys the most — Portuguese carried 112 works
to Spanish's three, a gap the ten-language Magisterium expansion has since closed, and the
two read across), plus `ar → fr` and `hu → de` for the second
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

**A tail of interface languages the corpus has one work in — nine when this was
written — is the intended state**, not debt.
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
tag exists. Russian was the standing counter-case — chrome since Magnifica Humanitas,
with a Compendium that existed only as a PDF nothing parsed — until
`ccc/compendium_pdf.py` parsed it on 2026-09-02.

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

**The Magisterium is taken in every language the Holy See publishes it in and this
parser can read — ten** (2026-08-29). `DEFAULT_LANGS` was English and Portuguese and had
been read as a scope decision; it was a crawl-budget decision, made when reaching further
would have meant ~2,400 requests against someone else's server for editions the site had
no interface in. Both halves of that had since stopped being true. The interface reached
fourteen languages, and — the part nobody had noticed — the pages were **already here**:
1,571 of them cached by a `--fetch-only` sweep in August and 740 more (document,
language) pairs recorded as definitive 404s, so the expansion from 354 editions to 1,237
cost 369 new requests, every one of them for the two families that sweep never probed.
The languages are the ones `DIVISIONS` has a division vocabulary for, which is a
statement about what can be parsed rather than about what is worth having; the Vatican II
mirror publishes six more (Swahili, Hungarian, Latvian, Czech, Byelorussian, Croatian)
and they stay uncrawled rather than half-read.

**Latin is a magisterial language and was the largest gap.** 163 Latin encyclicals sat in
`raw/` unparsed for the want of one table: `CAPUT`/`PARS`/`SECTIO` and the ordinals,
which was written from the twelve pages that actually print a division label rather than
from the language. `PARS ALTERA` is the entry that would not have been guessed — Latin
says "the other of two" where the other eight tables say "second", and reading it as
anything else numbers Sacrosanctum Concilium 1, 3, 4.

**Most of the Magisterium outside English prints no paragraph numbers, and that is the
edition rather than a defeat.** 328 of the new editions store their whole text in
`appendix.json` under the headings the source does print, and so have no citable address
at all. The provision existed for eight editions and now describes the majority shape.
What it costs is that the ceiling on a content file stops meaning anything for that kind:
a file holding several addressable units is one a reader over-pays for, and a file
holding none is simply the document.

**A language column with a hole in it is a claim about someone else's server, and it now
has to be written down** (2026-08-29). `pipeline/translations-checked.json` existed for
exactly this and held 125 records, all Portuguese encyclicals, while 619 pages sat under
`raw/` carrying the same answer for nine languages — fetched in August, classified by the
parser on every run since, reported in each run summary, and forgotten when the run ended.
`pipeline/scrapers/record_translations.py` reads them off cache and writes them down; the
file held 629 records and cost no requests (635 today). It is a separate script rather than a flag on
the scraper because a status is established deliberately, never as a side effect of a
parse — a scraper that appends to its own input turns one bad run into a permanent record
— and it writes nothing at all for a page that PARSES, because that would be a parse we
lost dressed up as a translation that does not exist.

**`pdf-only` is a fifth status, and the first one that does not mean absent.** Six
editions exist and vatican.va publishes them as a PDF, which nothing here reads — the
English _Amoris Laetitia_ among them. Filing that as `stub-page` would have been the
convenient lie: it reads as "the Church never published this in English", when what it
means is that we cannot read the format. The two absences point in opposite directions,
one at the source and one at us, and only the second is ours to close.

**A division vocabulary is a table, and asking a server for a language should
cost what the language costs** (2026-08-29). Twelve Latin-script languages
joined the Magisterium — 139 editions in cs, da, fi, hr, hu, lv, nl, ro, sk,
sl, sw, vi — and the two things that made it a day's work rather than a
project are worth separating. The first is that `DIVISIONS` was already a data
table: `_NUMERAL` reads `CAPUT III` with no vocabulary at all, so the cheapest
useful entry is the nouns, and five of the twelve print no division noun and
got an empty entry. The second is `--offered-only`. Deriving a translation's
URL by substitution is right and is how the corpus learned that most of them
404, but it makes the price of ASKING about a new language the whole document
count: 2,816 requests for eleven languages, 2,740 of them 404s. Every page
already carries a switcher naming its document's real editions, and reading it
off the copy in `raw/` turns that into 76. `robots.txt`'s `Crawl-delay: 2` is
a commitment about our conduct, not a budget to spend down, so a cheaper way
to ask the same question is not an optimisation.

**A table written from the language is a table nothing measured.** Every one
of the twelve entries was read off the pages fetched that day, and the reading
is what kept three languages honest: Danish `DEL` scored 31 and is the
preposition phrase "del i" in every one, Croatian `DIO` scored 3 and all three
are inside "vidio", Finnish `LUKU` scored 1 and it is John's seventeenth
chapter named in a sentence. Each would have looked like a division noun to
anyone counting without reading. The same posture explains what is NOT here:
Byelorussian and Hebrew are a table away and were left, and Chinese is the
only one that is a code question rather than a vocabulary one.

**Byelorussian and Hebrew followed hours later, and Hebrew is the exception
that names the rule.** 33 more editions — 31 Byelorussian, 2 Hebrew. Cyrillic
and a right-to-left script cost a table and nothing else, exactly as `ru` and
`ar` predicted. What Hebrew cost was a URL code: vatican.va's modern CMS calls
it `iw`, the ISO 639-1 code retired in 1989, while the Vatican II archive
mirror calls it `he`, and the corpus stores `.he`. So a language can take three
different codes — one per source family, one in the work id — and the scraper
had been assuming two of the three were always equal. The assumption was
invisible for every other language and wrong for exactly one document. The
lesson is not about Hebrew: it is that `lang_urls` is keyed by what the SOURCE
calls a language, and any code that writes into it with our own tag is a bug
waiting for the first language where the two disagree.

**Seventeen Vatican II editions were never recorded, because a discovery regex
narrowed to what the parser could read** (2026-09-02). The question was
whether the corpus had every language of the Second Vatican Council. It had
every HTML one — 202 editions, twelve languages carrying all sixteen
documents, Arabic eight, Croatian and Hebrew one each — and the index also
links Traditional Chinese for all sixteen, plus Hebrew for _Dei Verbum_, as
PDFs. `_VATII_LINK_RE` requires `.html`, so it had never seen them, and no
ledger in the repository said they existed.

Nothing failed and nothing looked wrong. The absence read as bare absence,
which is exactly what `translations` was built to distinguish from a checked
one — and Hebrew looked complete because Nostra Aetate's Hebrew edition IS
html and had been captured, so the gap was one document deep in a language
that appeared present. **A regex written to find what the parser can read
silently decides what the LEDGER can know**, and the ledger's whole job is to
tell "asked and the answer was no" from "never asked". The fix is not a hand
written table: `_VATII_PDF_LINK_RE` reads them off the same index, and
`parse_and_write` records them on every edition of the document it can read,
so a PDF the Holy See replaces with HTML is picked up by the next crawl.

### The prayers a Catholic knows by heart, in fifteen languages, for no fetch

The site's interface is thirty-four languages. `/preces` was eleven, and only
three of those — English, Portuguese, Latin — carried all four of the prayers
a Catholic is expected to know by heart: the two Creeds, the Our Father and
the Hail Mary. That is the worst place a fallback can land, because a prayer
is the one text people already know and would notice being wrong.

**The answer was in a file already on disk, and had been for a year.** Every
Compendium edition prints the two Creeds at the head of Part One Section Two
and the Our Father at the head of Part Four Section Two, vernacular beside
Latin — in the same page `prayers.py` was already reading Appendix A out of.
Nothing had ever read that region, because the scraper was written to read an
appendix and an appendix is what it looked for. Eight editions were completed
(2026-09-02) without one request. **Before adding a source, read the whole of
the one you have**: the survey that would have named national bishops'
conferences as the next step was the survey that found this instead.

**The four PDF editions came in the same way** (2026-09-03). vatican.va serves
ten of the fourteen Compendium editions as HTML and publishes Byelorussian,
Indonesian, Lithuanian and Russian only as a PDF made by the conference that
translated each. Those files had been in `raw/` since August and their
598-question bodies were already parsed; their appendices had never been
looked at. `prayer.common.{be,id,lt,ru}` are 27 prayers each (24 for the
Indonesian), and three of the four are interface languages.

**What made a reader safe in four languages nobody here reads is that the
Latin does every job.** The page is parallel text — vernacular column, Latin
column — so the printed Latin is the ANCHOR (the titles are Latin script in
all four, and they are read off `prayer.common.en`'s own Latin column rather
than retyped), the BOUND (the columns being parallel, where a prayer's Latin
stops its vernacular stops, which is what cuts twenty-four prayers apart), and
the CHECK (every extracted Latin word folded against the English appendix's).
Not one line of the reader tests a vernacular string.

**Two limits are the file's and are recorded as the file's.** The Belarusian
PRINTS a Latin column and publishes none of it: its accents are separate
positioned glyphs over base letters its fonts do not map, and the two PDF
readers fail differently and both irrecoverably — 84.9% of the English
appendix's Latin words survive against 99.5, 99.2 and 95.1 for the other
three. That is `latin_unreadable`, deliberately not the existing `no_latin`,
which says the SOURCE printed nothing: a reader has to be able to tell "not
printed" from "not readable", and only one of the two is a fact about the
book. The Indonesian genuinely prints no Eastern-rite prayers and no
concluding prayer for the Rosary, which is `absent` — the same statement
Swedish and Slovenian already make.

**Reading a new region of an old file found two defects in the shared PDF
reader, and the second is the more interesting.** poppler ends a `<word>`
where the font forces it to, not only where a space is printed, and
`poppler_lines` was joining on the tag — putting a space inside `sæcula` and
`ГЛАВА`. The threshold that fixes it is measured rather than chosen: over
37,757 word pairs in that edition the gap is bimodal with an empty band
between, 424 pairs at 0.1pt or less and then nothing until 0.7 where real
spaces begin. And `PdfEdition.repair_small_caps` — a regex that rejoined a
lone capital to the word after it — turned out to be that same defect patched
one layer too late. With the cause fixed the patch became damage, closing
`«ВЕРУЮ В БОГА»` into `«ВЕРУЮ ВБОГА»`, because a one-letter Russian
preposition before a word is exactly the shape it was written to join. **A
downstream repair outlives the bug it was written for and then starts
producing it.** 38 answers of `compendium.ru` read correctly that did not.

**The near miss is worth as much as the fixes.** A line of the Russian Nicene
Creed came out missing, and the obvious explanation was that
`furniture_strip=0.17` — 101.15pt on a 595pt page — lands exactly on a text
block that opens at y=101.1. It was wrong: `_in_furniture` compares the
BASELINE, which for poppler is the box bottom, so the head clears at ~89 and
the body at ~110. Acting on the plausible reading would have re-admitted 164
running heads into `compendium.ru`'s body to fix a line that was somewhere
else entirely. **A number that explains the symptom is not evidence that it
caused it** — the diff of the rebuilt work is.

## The First Vatican Council

Ingested 2026-09-02: two dogmatic constitutions, _Dei Filius_ and _Pastor
Aeternus_, Italian and Latin, four pages. **There is no English edition of
either on vatican.va** — the English texts in circulation come from Tanner and
Denzinger, a different rights and provenance position from everything else
here — so `vati.*.en` is absent and recorded as `no-url` rather than left
bare.

**The schema held and the walk did not, and that distinction is the whole
story.** Every other document in this corpus is a stream of numbered
paragraphs with headings between them, and `vatican_docs.py`'s walk is eleven
hundred lines of judgement about that stream. Vatican I is not that shape in
two ways:

_Pastor Aeternus_ prints no number anywhere. _Dei Filius_ numbers only its
canons, restarting at 1 in each of four groups (1–5, 1–4, 1–6, 1–3). And the
numbered matter comes LAST — four unnumbered `CAPUT`s of doctrine, then the
canons that anathematize the denial of what they taught.

**Fed to the general walk it produced a confident, wrong answer, and reported
the damage as a fix.** Canon II.1 arrives as `cand=1` against `last_n=5`, and
`looks_like_number_typo(1, 6)` is true — a same-length single-digit
substitution, which is exactly what that heuristic exists to catch — so the
canon was silently renumbered §6 under an anomaly reading "single-digit typo,
corrected". Four canons went that way. Groups III and IV, where the digits
stop being the same length, fell through to the false-positive branch and were
swept into the appendix, one block per group. The four doctrinal chapters were
swallowed whole into §1 as "unnumbered prose before section 1". **A heuristic
tuned to a misprint cannot tell a misprint from a restart**: both look like a
number going backwards, and only knowing the document's shape separates them.

**So the walk is forked and nothing else is.** `walk_vatican_i` is ~150 lines
deciding what a block MEANS; the shell sniffing, block extraction, masthead
extraction, footnote split, inline narrowing, manifest building, validation,
ledgers and lock are all shared. The shape is small, fixed and fully known —
two documents, one council that closed in 1870 and will not publish again — so
it is read by a walk written for it rather than by a third set of exceptions
in a parser tuned against seventeen hundred other pages.

**The canons are the sections and the chapters are leading matter, which cost
one new field.** Canons are numbered 1..18 continuously, with each group's
heading anchored at its own first canon (`before` 1, 6, 10, 16). §6 is a
number the printed edition never uses — it prints `II. 1` — so the printed
address is recovered as a RANGE rather than fabricated as a number: group II
owns §§6–9, and that is how a reader gets back from §6 to the page.

The chapters go to `appendix.json`, which until now meant back matter and
nothing else — the schema's own words, and the site's `tailRows` renders it
strictly after the numbered sections. Rendered there, _Dei Filius_ would read
backwards. `position: "leading"` is the answer, on the unit and on the
structure row; **`before: null` keeps meaning what it always meant**, and
leading matter got a field of its own rather than a re-reading of that one. It
rides on the UNIT as well as the row because the first leading run has no
heading to carry it — the constitution opens with its address to the Church,
above the first `CAPUT` — and pairing by title cannot place a run with no
title. A document that numbers nothing gets no `position` at all: _Pastor
Aeternus_ has no numbered flow to be before or after, and marking it would ask
a renderer to split a body with no other half.

**Extracting the pairing to check it found a bug older than this work.**
`splitUnnumbered` is a pure function because the site's own notes forbid
driving a browser to verify UI, and the pairing was the only part of that page
anything could check without one. Walking the HEADINGS and appending whatever
they did not claim put an edition's OPENING paragraph after its last section:
the untitled run matches no heading by construction, so it always fell into
the unclaimed bucket at the end. `ad-catholici-sacerdotii.it` read its first
paragraph after twenty-five headed units. Both arrays are already in document
order, so the merge walks them together and the ordering fixes itself — for
Vatican I and for every unnumbered edition that opens with prose.

**Two smaller things, each a rule wearing a general one's clothes.** The two
constitutions do not share a page template WITH EACH OTHER: `Dei Filius` is on
the modern `<div class="testo">` shell and `Pastor Aeternus` is on neither
shell, same index, one directory apart — so `find_content_start_old_shell`
returned 0 for both Pastor Aeternus pages (it looks for the last `<hr>` before
the first NUMBERED paragraph, and that document numbers nothing) and the
Italian edition parsed to a single 16,976-character unit with no structure.
What all four pages do share is the CMS's inner wrapper, which is exact where
both shell rules are inference. And `CAPUT I` is not bold while `is_full_bold`
IS the heading detector, so both Latin editions lost all four chapter labels —
the subject survived, the numbering did not.

## The site

**One static SPA shell, not a prerender.** The static page was never the content
identity: prerendering repeated the chrome thousands of times and could embed only a
build-time default edition or every edition at once. The build is two HTML documents.

**The boot chunk is what that shell actually costs, and it is priced per registry, not
per byte** (2026-08-26). With `ssr = false` nothing paints until the client bundle has
downloaded, parsed and mounted, so whatever the boot index carries sits in front of first
paint on every route — including the routes that never read a byte of it. Three cuts took
it from 2.32 MB raw / 305 KB brotli to 1.34 MB / 170 KB. (Those are 2026-08-26 numbers
at 383 works; at 1,469 works the boot index is ~5.2 MB raw / ~480 KB brotli —
re-measured 2026-09-02, recorded in `corpus-index.ts`'s docblock, and compressing it was
measured to buy nothing. The per-registry pricing below is the part that holds.) What decides whether a registry
boots with the app is the QUESTION IT ANSWERS, not its size: "does this address exist" is
asked with no work in hand and stays eager, while a document's outline is only ever wanted
by the page already reading that document — so all 354 of them became content-tier assets,
where they also ride the offline download waves rather than merely landing in a cache.
Numbering runs (a chapter's verses, the Compendium's questions, a document's sections, a
Summa question's articles) are stored as their count, with the explicit array kept wherever
there is a gap; that is lossless, so the older refusal to store a mere BOUND — a verse gap
must not silently mislink — still holds unamended. And a work manifest keeps only the first
of its `sources`, because `sourceUrl` reads `sources[0].url` and no page reads the rest.

**The lever that was left was not shipping it eagerly, and it took the boot payload from
6.30 MB to 0.47 MB** (2026-09-03). The entry above ends by saying compression bought
nothing and that the per-registry pricing is the part that holds; this is what applying
that pricing to the rest of the tier actually cost and bought. The measurement that
started it was not of the boot INDEX but of the boot PAYLOAD — every `.js` file
`index.html` asks for before it can paint, which nothing had ever added up: 6.30 MB raw,
~530 KB brotli, of which 92% was data compiled into JavaScript rather than code. Four
things were in it, and only one was suspected:

- **2.92 MB of index-tier JSON**, inlined by `import.meta.glob(..., { eager: true })`.
  The six large per-work-type files (1.33 MB) are now `?url` assets primed by the route
  that reads them (`index-priming.ts`), and `manifests.json` (1.50 MB) is a `?url` asset
  awaited unconditionally in `+layout.ts` — it answers "what works are there", which
  every path asks. Small files stay eager: under 20 KB a request costs more than a parse,
  and `plates-credit.json` stays for a stated reason (the colophon must not have its
  attribution arrive over a network that can fail).
- **1.59 MB of `content-manifest.json`**, which `corpus-assets.ts`'s docblock says must be
  read by the service worker AND NOWHERE ELSE, "because importing it from there and
  nowhere else is what actually keeps it out of the app". `usage.ts` and
  `library.svelte.ts` had each added a static import since — the rule was written when the
  file was 248 KB. `usage.ts` did not need it at all (it wanted a work's language, which
  `manifests` already carries — verified equal across all 1,654 works); `library.svelte.ts`
  now `await import()`s it, which is free because nothing renders until the reader opens
  the panel. `nodes/0.js` fell from 1.65 MB to 65 KB.
- **1.34 MB of the content tier's relPath->URL map**, plus a module-scope loop running up
  to ten regexes over each of 9,733 keys before first paint. A location answers "which file
  holds section 12", which nothing can ask before a route has decided to read something, so
  `corpus-index.ts` reaches `content-urls.ts` by `await import()` now. Every one of the
  eighteen call sites was already inside an `async` function, so the readers stayed
  synchronous and no signature moved.
- **`suggest.ts` and its 186 KB grammar**, static in `JumpBox`, which the layout RENDERS on
  every route behind an `{#if open}` that is false until a reader reaches for the box. The
  precedent was already in that file: it lazily imported `fuzzysort` (7.5 KB) while
  statically importing the module that consumes it.

**The generalisable part is that three of the four were invisible to every check that
existed.** Each was one word (`query: '?url'`) or one import away from correct, neither
spelling errors nor fails a test, and the symptom is only that the site got slower for
everybody. `scripts/preflight-deploy.mjs` now measures the boot payload off `index.html`
and REFUSES THE DEPLOY over `MAX_BOOT_JS_BYTES` — a ceiling in bytes rather than Vite's
per-chunk warning, which cannot tell a 1.34 MB chunk that is lazily fetched from one every
route parses before paint, and says nothing about a payload spread over twenty chunks.

**Making a registry lazy breaks whatever was DERIVED from it at module scope, and that
is not visible from the registry's own call sites** (2026-09-03, same day). The home page's
Bible and Magisterium sections rendered blank against a full corpus. `corpus.ts` builds
five maps once at module load — the canonical book list, the document groups, three
existence Sets — on the sound argument that regrouping ~450 document works on every
`listDocuments()` would be waste. Module load now happens long before any primer resolves,
so those maps were built from empty registries and memoised the emptiness permanently.

**The search that missed them looked for the registry and they do not name it.**
`canonicalBooksByOsis` and `documentGroupsBySlug` reach `manifests` through
`listWorksOfType`, inside an IIFE — so a scan for module-scope reads of `manifests` found
nothing, and the conversion looked complete. The lesson generalises past this refactor:
when a value stops being available at module load, the thing to enumerate is not its
readers but everything memoised from it, one indirection out.

**The fix keeps the memo and keys it on a GENERATION rather than dropping it.** The
original reasoning about wasted work was correct and still is; only the "once" was wrong.
`corpus-index.ts` counts registry fills, `corpus.ts`'s `derived()` recomputes when the
count moves — a counter and not a boolean, because six primers land independently and a
map built after the Bible index arrived is still stale for the document index. That is
correct under any ordering, including a read before any primer at all.

**It is guarded by a source scan, because nothing runnable can catch it.** Under fixtures
`USE_REAL_CORPUS` is false and the registries ARE populated at module load, so an eager
derivation is perfectly correct and every test passes; the difference exists only against a
real corpus. `corpus-derivations.test.ts` therefore asserts about the text of `corpus.ts`
— every module-scope declaration mentioning a lazily-primed registry, or one of the ten
functions that read one for you, must go through `derived()` — with a second assertion
that the scan still matches something, so it cannot pass by finding nothing. Same move
`sw-policy.test.ts` makes when it reads the content kinds back out of `sync-corpus.mjs`.

**The route mapping was wrong on the same page for an unrelated reason, and the two looked
identical from the browser.** `index-priming.ts` gave `/` the Catechism pair, from a grep
that found the two work types `+page.svelte` names and not the three it reaches through
`listDocuments`, `listPrayerGroups` and `BookChapterPicker`. Both bugs blank the same
sections; only one was the cause of what was actually observed. Fixing a symptom that has
two sufficient causes needs both found.

**The mapping was wrong a second time, and for a reason the first fix could not have
reached: it asks only half the question.** `/doctrina-socialis` was listed as needing
nothing primed, which is true of the Compendium of the Social Doctrine's own paragraphs —
they come from a registry that is still inlined — and says nothing about what those
paragraphs CITE. `refs.ts`'s `refAddress` runs from render, once per reference, and
validates an address before it will mint a link: scripture against the Bible's book/chapter
table, a Summa citation against its questions, a document siglum against its section
numbers. So the first footnote on `/doctrina-socialis/1` threw `listBooks: the bible index was read before it was primed`. It
was never one shelf's bug — `/documenta` primed only `document`, against prose that cites
Scripture in the open rather than in footnotes (~4,400 locators corpus-wide), and
`/catechismus` primed the Catechism pair and neither of the two registries its footnotes
cite most. Those two failed SILENTLY, which
is the worse half: only the scripture check is behind `requireIndex`, so a document or
Summa citation read an empty registry, concluded the corpus does not hold the target, and
rendered as dead text. A shelf owes the indexes its own text is read FROM and the indexes
its text POINTS AT, and the table asked only the first.

**Asynchrony was pushed to the ARRIVAL of the data, never to its readers.** Two dozen
synchronous readers in `corpus.ts` (`getBook`, `getCccStructure`, `listSummaQuestions`)
are called from render and keep their signatures; the registries are the same mutable
objects, filled in place by primers that `load()` awaits — which is where a route already
waits. That is why this is a change to a handful of files rather than to the component
tree. The guards differ by how completely their callers can be enumerated: the content
index throws always (every call site is inside one of eighteen `async` functions and is
provably covered), while the per-work-type indexes throw only in dev and warn in
production, because their readers include reading chrome that appears on more than one
shelf and the path mapping is a judgement. Under fixtures `USE_REAL_CORPUS` is false and
neither guard can fire, so `npm test` is not what catches a mistake here — `npm run dev`
is, which is the argument for the throw.

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
The page watches for the waiting worker and takes it. Announcing it requires an existing
controller, or a first-time visitor is told a version they have never seen is out of date.

**Asking was the first answer and is now the last of three** (2026-08-28). The reason not
to `skipWaiting()` is that the ground must not move under a reader standing on it, and
consent is one way to honour that, not the only one. There are two moments where nothing
is standing on it: the tab is hidden, and the reader has just clicked a link away from
this page. So the update is applied silently at both — on the second by cancelling the
client-side navigation and landing the full load on the destination, where there is no
scroll position yet to lose and nothing on screen to shift. `UpdateBanner` is what is left
for the reader who does neither: parked on one chapter, reading, not navigating. That is
the one case where the ground genuinely would move, and the case consent was always the
right answer to. At one to two deploys a day, the bar was a near-daily interruption
offering something the reader had no reason to refuse.

Three details are load-bearing. The navigation must be a real `link` to a different
address: a `goto` is often a button wearing a URL (a compare toggle, an edition switch),
`popstate` must stay soft or Back stops meaning back, and a `#`-jump to a footnote is a
navigation to the page already being read — the commonest one in the corpus, and the one
a reload costs the most. The update must be applied BEFORE the new document opens, not
alongside it: a document opened while the old worker still controls the scope is claimed
by it, so the reader would pay a full load and arrive on the same stale shell. And the
wait for `controllerchange` times out, because `activate` sweeps two caches first and a
reader who clicked a link is watching nothing happen; on a timeout the navigation
completes on the old shell and the next link tries again.

`usage.ts`'s `behind` bucket is unchanged and now measures a much smaller population —
readers who saw the bar and left it, rather than readers who had an update waiting. It
should read near zero; a `behind` that climbs is readers reaching the third path and
declining there, which is the signal it always was.

**The build id is legible, and printed in the footer.** SvelteKit's default version name
is `Date.now()`, which names the shell cache and is what `usage.ts` compares to tell a
landed update from an offered one — all correct, and unreadable. It is now
`2026-08-28.1740-01eabd8`, a UTC minute and the commit, `-dirty` when the tree held
changes that commit does not describe, and the footer prints it. The minute cannot be
dropped in favour of the sha: a deploy ships one person's working tree, so two builds from
one commit are the normal case, and sharing a cache name between them is an update that
never arrives. `vite.config.ts` is evaluated four times per build in four processes, so
the first one to compute the id exports it and the rest inherit it — without that, one
build shipped two identities, `…1735…` in the service worker and `…1736…` in the footer.
The line is in the footer rather than behind the colophon link because the question it
answers ("did the update land?") is asked while looking at a page that might be stale,
about that page.

**The background fill is per-language, ordered, and opt-in past the Catechism.** The
corpus was 82.6 MB raw / ~26 MB gzipped across fifteen languages when this was designed
(~298 MB raw across twenty-eight languages today), and a reader speaks one
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
100,000/day, the sitemap advertises ~6,000 canonical addresses, and nothing bounds how
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

**`not cf.client.bot` exempts verified bots, and it is the SEO clause rather than a
concession.** Cloudflare's own rate limiting page warns that limiting verified bots may
affect indexing, and this site is deliberately indexable and competing with vatican.va
for its own paragraphs (§Posture). It gives up less than it looks: on the free plan the
rule is 10 seconds counted per IP per data centre with a 10-second timeout, so it clips
one address's burst and never bounded a distributed crawl; what actually guards the
invocation ceiling is `run_worker_first` above. `cf.client.bot` is Cloudflare's own
verification, not a User-Agent, so a scraper claiming to be Googlebot is still counted.

**The expression is written in the only two fields the plan allows.** A Free rate
limiting rule may reference Path and Verified Bot and nothing else — not method, not
User-Agent, not the source IP (rate limiting rules, Availability) — which is why the
static exclusions are path prefixes and why the bot clause is the only other term
available. The five WAF custom rules have the full field vocabulary; that asymmetry is
what puts the `/a` guard in a custom rule and the burst exclusion here.

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

**The invocation model, priced** (2026-08-29). The question that keeps returning — "what
happens if we are attacked, or simply found?" — has one answer per layer, and they were
scattered across a wrangler comment, a dashboard rule and nobody's notes. Cloudflare's
published limits, read on this date:

|                                           | Workers Free         | Workers Paid                               |
| ----------------------------------------- | -------------------- | ------------------------------------------ |
| Static asset files **per Worker version** | 20,000               | 100,000                                    |
| Individual asset file size                | 25 MiB               | 25 MiB                                     |
| Requests                                  | 100,000/day          | 10M included/month, then $0.30/M           |
| CPU time                                  | 10 ms per invocation | 30M CPU-ms/month, max 5 min per invocation |
| Subrequests                               | 50/request           | 10,000/request                             |

**An invocation is one inbound request that reaches the Worker, and nothing the Worker
does internally multiplies it.** Cloudflare states it outright — "Cloudflare does not bill
for subrequests you make from your Worker" — so the three tables `src/worker.ts` reads
(`corpus-routes.json`, `route-titles.json`, `apparatus.json`) are free, whatever their
number. They are read once per isolate and in one `Promise.all` with the shell, which buys
latency and not money. **Requests to static assets are free and unlimited on both plans**,
which is what makes the `run_worker_first` negation list the whole of the cost model:
Cloudflare's own worked example is 15M requests a month with 80% static, billed at $5.00.

**So the only thing that costs anything here is a navigation, and that is structural.**
The Worker must run on every navigation to decide 200 against 404 from
`corpus-routes.json` — that is what makes `/catechismus/9999` a real 404 rather than a
soft one. The `<head>` rewrite and the apparatus ride along on an invocation that was
already being spent; neither added one. It follows that there is nothing to reclaim by
undoing them, and that the client cannot take this over: the client already computes the
same predicate for its own 404 UI, but only the origin can set a status code, and serving
200 with a "not found" page is the soft 404 this whole address grammar exists to avoid.

**Workers Cache stays off, and the docs now say why more plainly than the comment does.**
`site/wrangler.jsonc` sets `cache: { enabled: false }` because enabling it bills every
request at the standard rate including the static asset requests that are otherwise free.
Cloudflare's pricing page now states this directly: requests served from the Worker's cache
are billed at the per-request rate, "including requests to static assets". Under the
attack case it is therefore worse than neutral — it re-prices the ~2,240 assets of a cold
visit that the negation list exists to keep free.

**The file ceiling is purchasable, and an earlier reading of it here was wrong.** 20,000
is per _Worker version_, not per account, and Workers Paid raises it to 100,000. It was
briefly believed to be a hard wall that no plan lifts, which made the deployment file
count look like a constraint on architecture. It is not one.

**Which puts a real option back on the table: prerender one shell per canonical address.**
`not_found_handling` is already `"404-page"`, so the asset platform already answers 404 for
any path with no file. If every canonical address had a file, the platform alone would give
exactly the Worker's semantics — canonical to a file at 200, everything else to a 404 —
with no invocation at all, and the Worker would be left holding only `/a`. It needs no new
logic: `headFor` / `headHtml` / `noscriptHtml` are pure functions of a path and the
generated tables, so a postbuild pass calls the same three functions the edge calls and
writes files instead of streaming a rewrite. The cost is ~5,957 files (14,198 total, 14% of
the paid ceiling and 71% of the free one) at ~8 KB each, none of which Wrangler can dedupe
because every one differs by design in its head.

That is a partial reversal of the 2026-08-18 move to one SPA shell, and the reason differs
enough to be worth stating: that decision retired ~5,700 pages that each carried the
_text_, at a time when the file count was the binding constraint. These carry only a head.

**The order is: subscribe first, prerender second, and they are not the same fix.**
Workers Paid removes the outage — past 100,000/day the free plan answers 429 instead of
serving the asset and the site goes dark until 00:00 UTC, whereas on Paid an overage is a
bill. It also retires the 10 ms CPU limit, which is the one budget this year's edge work
actually consumed (6.56 ms for the rewrite, ~1 ms more to parse `apparatus.json`, once per
isolate). Prerendering is the different fix: it moves navigations from billed invocations
to free static requests, so the bill stops varying with traffic at all. Paid alone bounds
the damage of an attack to money; Paid plus prerendering bounds it to nothing.

**Neither is done.** The site is on the free plan as of this date, and this section is the
analysis rather than a record of a change.

**What a crawler that does not render is told — and what it is still not told**
(2026-08-26). `ssr = false` means `%sveltekit.head%` is empty in the build, so the one
document served for all ~6,000 canonical addresses is the whole of what a non-rendering
consumer receives. Until now that document had **no `<title>` at all** and one
library-wide description, so every social unfurl, every chat preview and every crawler
that is not Google saw an untitled, bodyless page — the same one, ~6,000 times, which is
also the textbook signature of duplicated content. `app.html` now carries a static
`<title>`; it is safe there because Svelte compiles a `<title>` in `<svelte:head>` to an
assignment to `document.title` rather than to an appended element, so the route's own
title overwrites it at hydration rather than being shadowed by it.

That fixed the missing name, not the sameness. **The edge now writes the head**
(2026-08-28): `src/worker.ts` runs an `HTMLRewriter` over the shell on every navigation
and gives each address its own `<title>`, description, `og:title`/`og:description`,
`<link rel="canonical">`, `og:url`, a `BreadcrumbList` in JSON-LD, and a `<noscript>` with
real links. The two objections that held it back for two days were the right ones to raise
and both have answers.

**The boundary.** `wrangler.jsonc` says the worker "is not an application server and never
reads or transforms corpus text", and it still doesn't. What it reads is a second
generated file, `static/route-titles.json` — ~107 KB of **names**, a size that scales
with `UI_LANGS`: book names, document
titles with their author and year, prayer titles, Summa question titles, and the paragraph
spans of every titled division in the Catechism and the Compendium. A name is the imprint
of a work, the same class of fact `sitemap.xml` already publishes an address for. No
paragraph, answer or verse reaches the edge, and none may — the line is stated in the file
that builds the table (`scripts/route-titles.mjs`) and again at `withHead`.

**The cost.** Measured rather than guessed, since the objection asked for it: a local
`wrangler dev` over 140 navigations reads 6.24 ms mean without the rewrite and 6.56 ms
with it, against a 10 ms CPU limit that the asset subrequest already dominates. One extra
subrequest per isolate for the titles table, and none per request.

**Two files, two promises.** `corpus-routes.json` decides the STATUS and
`route-titles.json` only the `<head>`, and they are read through separate module-global
promises so that losing the second costs a name and never a page. The site was entirely
serviceable with a generic head until this week; it would not be serviceable with
addresses that stop resolving.

**What guards it is a build assert, not a test.** `assertNamed` runs inside
`sync-corpus.mjs` beside the older `assertCanonical`, and refuses a build where any address
in `sitemapPaths` has no name of its own or shares a title with another. Today that is
every address named and none sharing a title. The check belongs there rather than in vitest
because the failure is invisible everywhere a person looks: the page titles itself at
hydration, so a browser shows the right thing whatever the table holds, and only the
consumers that never render see the gap — none of which reports back. A work kind ingested
before `shell-head.ts` learns its name now fails the sync instead of shipping 600 pages
called `Glossa Catholica`.

**`og:url` is written now, and its earlier absence is why it can be.** The tag was omitted
from `app.html` precisely because one document answered every address, so the only value
that file could carry was the site root — which would have retitled and relinked every
deep-link preview to the home page. Per-address, the tag can name the address it is
actually about. `app.html` still declares none, which is still right: the static file is
not about any one address.

**The canonical and the sitemap have one definition of the origin.** `SITE_ORIGIN` lives
in `shell-head.ts` and `scripts/sitemap.mjs` re-exports it as `ORIGIN`. `<loc>` in the
sitemap and `<link rel="canonical">` on the page are a claim and a confirmation about the
same URL, and a crawler that finds them disagreeing resolves the disagreement against the
site. It is fixed rather than read from `request.url` for two reasons found in testing: a
request arriving over plain HTTP mints a canonical under `http://`, pointing at a URL the
sitemap does not advertise; and a preview hostname would declare itself canonical, which
is the duplicate the launch-time `Disallow: /` existed to prevent. The 404 head declares no
canonical at all — a canonical link asserts that this address is the preferred spelling of
a real resource, which is the opposite of what the status says.

**The `<noscript>` is the half a sitemap cannot do.** `robots.txt` already states the
problem: every cross-reference between texts is written by script, so the corpus has no
link graph to a consumer that does not render. A sitemap says what exists; it cannot say
what is near what. Each page now carries its parent index and its neighbouring addresses
as real links, in a `<noscript>` and not a hidden element — content withheld from a
rendering browser but served to a crawler is cloaking, whatever it was meant for.

**A HEAD answered 404 on every canonical address**, found while probing production for
this work (2026-08-28). `isNavigation` required `GET`, so a HEAD fell through to the asset
binding, which has no file at `/catechismus/330`, and every address in the corpus answered
404 to the HEAD of a URL it answered 200 to on GET. Nothing on this site issues one, which
is why it went unseen for as long as the worker has existed; link checkers, several
unfurlers, and crawlers probing before they fetch issue little else.

**The reading routes were retitled to match** (`shell-head.ts`'s shapes, in the reader's
language), because the edge writing one title and the route assigning another at hydration
is a visible rearrangement on every load. Two were not merely different but wrong: the
Bible chapter route suffixed with the EDITION's short title, at an address that is
deliberately edition-free, so the title contradicted its own URL and changed when the
reader switched edition; the Summa question route suffixed with the work's name where
every other route names the site. Both now name the site, and the CCC, Compendium and
Summa routes name the division or question they sit in — 2,865 Catechism addresses had
shared one title but for a number.

**Two generated files left the reader's install precache in the same pass.**
`sw-policy.ts` takes everything in `static/` unless a list refuses it, and
`corpus-routes.json` (27 KB, read only by the edge worker) and `reference-coverage.json`
(~19 KB, read only by `preflight-deploy.mjs`) had been precached since the partition
existed. Neither is fetched by anything that runs in a browser. `INFRASTRUCTURE_FILES` is
a third list beside `HOST_CONFIG_FILES` and `CRAWLER_FILES` because the reason differs
again: those are read by a stranger's machine, these by ours.

**The interface has addresses; the corpus does not** (2026-08-28). Eight pages now answer
under an interface-language prefix — `/pt/catechismus`, `/ar/doctores/summa`,
`/la/preces` — and
~5,800 reading addresses deliberately do not. The line between them is the one the whole
URL grammar rests on. A reading address names a **citation**, which is the same citation
in every language; which edition renders there is the reader's standing preference, and
the canonical spelling is Latin precisely so that it does not vary. A chrome page has no
citation in it at all: every word on `/catechismus` is the interface, so the Portuguese
version is a genuinely different page rather than the same page relabelled.

Prefixing the reading addresses was considered and refused, and the reason is worth
keeping. Interface language is not content language: a Hungarian reader at
`/hu/catechismus/330` would be shown the ENGLISH Catechism through
`CONTENT_LANG_FALLBACK`, so `/hu/…` and `/en/…` would be byte-identical in the only part a
crawler weighs and differ in the navigation labels. Publishing that as an `hreflang`
alternate is a false claim of the same shape the `lastmod` ledger already refused to make
one level down. It would also take 5,811 addresses to 81,368 (the arithmetic at fourteen
interface languages; worse at thirty-four), force a `<sitemapindex>`,
and contradict the "canonical reader URLs do not vary with interface language" rule that
`hrefFor` exists to enforce. **The addressable-content-language question is untouched by
this** and remains where §Languages leaves it.

**A reading address takes a prefix as an ENTRY POINT since 2026-09-02, and the refusal
above is unchanged.** Every objection in it is about PUBLICATION — a false `hreflang`
claim, 5,811 addresses becoming 81,368, a forced `<sitemapindex>`, `hrefFor` losing its
monopoly on the spelling of an address. None of them reaches an address that is never
published. `/es/scriptura/genesis/1` is served, sets and persists Spanish exactly as the
switcher does, and is then replaced in the bar by `/scriptura/genesis/1`. It
canonicalizes to that bare path, is in no sitemap, and declares no alternates. The eight
chrome pages are untouched: theirs is published, self-canonicalizes, and keeps its
cluster.

**What forced it is that the site teaches the prefix and then refuses it.** A reader who
has seen `/pt/catechismus` writes `/pt/catechismus/330`, and that answered 404 —
extrapolating the rule was the natural move and the site punished it. The principle
separating chrome from citation is real, but it was being expressed as an error rather
than as a redirect.

**`?lang=es` was the cheaper answer and was refused.** It needs no edge work at all:
`ShellHead.canonical` is path-only by design, so a param already emits the right
canonical and `isCanonicalPath` never sees it. Nor would it be a new category, which is
the objection that first suggested itself and is wrong — `?compare=` is already read and
written on the client and already seeds a persisted preference, which is exactly the
shape `?lang=` would have. What refuses it is that it leaves `/pt/scriptura/…` a 404 and
answers the question with a THIRD way of naming a language. Twenty lines at the edge is
the price of one rule.

**Canonical, and deliberately not `noindex`.** The two together are an anti-pattern: a
`noindex` on a page whose canonical names another URL can carry the directive to the
target, and the target here is the real address. A canonical alone is what consolidates a
duplicate, and the client redirect means a crawler that renders ends up there anyway.
`noindex` stays what it was — `/signata` and `/404`.

**One prefix, never two.** `parseLangEntry` calls `isCanonicalPath`, which calls back
into it, so `/es/pt/catechismus/330` would otherwise peel a segment per round and answer
200 — an address with 34 x 34 spellings, which is the exact multiplication the
unprefixed reading addresses exist to avoid.

**Thirty-five members per cluster (fifteen when this was written), and every one of them
declares the whole cluster.** One prefixed page per interface language plus the
unprefixed path, which is `x-default`. The unprefixed path is not
"the English page" — it NEGOTIATES (`app.html`'s pre-paint block, then `I18nStore`), which
is a different claim, and `x-default` is the tag for exactly that. `/en/catechismus` exists
separately because pinning English is a different thing from negotiating and happening to
get it. Each member self-canonicalizes: a prefixed page canonicalizing to the bare path
would ask to be de-indexed, leaving a cluster of one and no purpose.

**Not one new translated string was written.** `CHROME_KEYS` in `scripts/route-titles.mjs`
maps each chrome page to keys the dictionaries already carry — `ccc.landing.title`,
`bible.landing.tagline`, `colophon.lede` — so the head a Portuguese searcher matches on is
the sentence the page then shows them. All thirty-four dictionaries carry all eight, which a
test asserts. The home page is the one exception, having no tagline: its description is
composed from the five translated section names, which is both what the page is and what
someone searching for any of those works would type. Inventing a `meta.description` key
would have been thirty-three sentences needing thirty-three speakers, and CLAUDE.md's
Malagasy note records what happens when that is guessed at.

**`chromeNames` has no fallback to English, unlike `t()`.** A cluster whose Portuguese
member is described in English tells a search engine the page is Portuguese and then shows
it English, which is the one thing an `hreflang` set is checked for. A missing key fails
the sync through `assertNamed` instead.

**`assertNamed`'s distinctness check became per-language rather than global**, because a
cluster's members share a title on purpose — it is the same page in fourteen languages,
the one case where two addresses answering to one name is correct. So `/pt`'s seven titles
must differ from each other and are free to equal `/en`'s, while every reading address
stays in one bucket where a shared title is the defect it always was.

**`UI_LANGS` moved to a plain `src/lib/ui-langs.ts`.** Three consumers now need `isUiLang`
and none can import `i18n.svelte.ts`, which constructs its store at module scope and so
reads `localStorage` and instantiates `$state` on import: the edge worker, the route
grammar it shares with the client, and the build scripts. `i18n.svelte.ts` re-exports it,
so the rule stands — use `isUiLang`/`UI_LANGS`, never a literal list.

**Arriving at a prefixed page persists the language**, exactly as the switcher does, and
the cost is stated rather than hidden: a reader who has chosen English and follows a shared
`/pt/summa` link has their stored choice changed. The alternative is worse. Every link on
the page that follows is unprefixed, so honouring the language for one page and dropping it
would answer the search and then lose the reader on their first click. These addresses are
entry points, not a parallel site — which is also why the internal link graph needs no
prefix-awareness at all.

**`dir` is why the edge writes `<html lang>` too.** An Arabic reader landing on
`/ar/catechismus` would otherwise watch the page flip sides once the app boots.
`app.html`'s pre-paint block reads the same path segment for the same reason; the edge
rewrite is the copy that reaches a consumer which never runs it.

**A link to this site is unfurled, not searched, nearly everywhere it is pasted**
(2026-08-26). The head above is read by search engines; what a chat client, a forum or a
social post reads is Open Graph, and there was none — so a pasted link rendered as the bare
URL. `app.html` now carries the tags and `static/og.png` the card they point at.

Two of the tags are absent on purpose, and the absences are the decisions. **`og:url` is
omitted**: its job is to name the canonical address of the thing being unfurled, and with
one document answering all ~6,000 addresses the only value this file could hold is the site
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
`<sitemapindex>`, and ~6,000 URLs against a 50,000 cap do not warrant one. Cloudflare
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

**The reading page is three lanes, and the text sits on the page's midline** (2026-08-29).
`.reading-layout` centred the reading column and the aside AS A UNIT, so the text ran
10.75rem — half the aside plus its gutter — left of centre on every reading page, and the
margin the apparatus is set in was whatever slack that centring happened to leave. One
side of the column was a declared column and the other was leftovers, which is why the
text read both as off-centre and as crowded: the aside stood 4.5rem away while 58rem of
page went unused beyond it on a wide display. The grid now declares an apparatus lane in
front of the text, the same width as the aside and its gutter, so both sides are 21.5rem
and the column lands on the midline at every reading size. It is NOT the arrangement
rejected earlier — centring the text and hanging the aside off the right edge, which reads
as two unrelated pages — because the aside keeps its gutter and the ensemble is still
centred as a unit; only the unit became symmetric. Each lane carries its own gutter rather
than sharing a `column-gap`, because a gap is one number for every gutter in a grid: with
one, a collapsed apparatus lane would still be charged 4.5rem and the reading measure
would pay it. Carried inside the lane, the collapse is total, and the layout at its
narrowest is exactly the two-track one it replaced.

**A note goes in the margin where there is a margin and becomes a disclosure where there
is not**, and the breakpoint is legible to the markup, not only to the stylesheet: a
visible margin note is not a disclosure control, and `aria-expanded` on a button whose
content is on screen is a lie.

**A footnote's source is a note, so it goes there too.** The margin was an annotated
edition's gloss only, on the reasoning that a citation is a few words wanted on demand.
That was reasoning about a disclosure which pushes the page down, and it stops applying
where the note costs the text nothing: the Catechism's 3,698 citations average 26
characters, and where a quoted sentence comes from is what a reader wants of it. One
arrangement (`.margin-note`), two apparatuses; each keeps its own fallback where there is
no margin — a gloss becomes a block, a citation becomes a popover it also keeps above the
breakpoint.

**The note's width is derived from the margin there actually is, not assumed.** The
reading column grows with the reader's size setting, so the margin shrinks as the text
grows and a fixed displacement walked off the left edge of the viewport at the sizes
where the reader can least afford it. The 100rem query cannot see that — a media query
reads the root font size, which `--reading-scale` does not touch — so the width is a
ceiling CSS clamps against the room there actually is (`--sidenote-room`). It was the
slack a centred pair left over, which bound at about 142% on a 100rem viewport and
narrowed the gloss to about 7rem at the maximum; bound to the apparatus lane instead it no
longer binds anywhere the notes are shown at all — narrowing the gloss on a 100rem
viewport would take a 58rem reading column against a 56rem ceiling — so the same reader
at the maximum now gets the full width. It stays a ceiling because the lane can still be
squeezed, which is to say where the margin is not being used anyway.

**And that width is the aside's, so the two margins are mirror images** (2026-08-29). The
gloss column was 13rem and its gutter 4rem, on the reasoning that a gloss is subordinate
to the text and reads as apparatus partly BY being a narrower column. It is marked as
apparatus by three other things at once — the sans face, the smaller size, the muted
colour — and what the width was doing instead was leaving 4.5rem of a 21.5rem lane empty
beside an aside that fills its own, which the eye reads as the two sides not lining up.
Both tokens now name the aside's: the gap is `--aside-gap` and the ceiling
`--aside-width`, so 4.5 and 17 partition the lane exactly and the clamp binds at precisely
its ceiling wherever the lane is full. The symmetry is written as that calculation rather
than as a second copy of 17rem. Clearance is unaffected — 4.5rem clears the 3.25rem the
unit number hangs in by more than the 4 it replaces.

**The margin sets a gloss open until it stops being a gloss, and then it sets a preview**
(2026-08-28). `.margin-note` was calibrated on the apparatus the site had: Challoner's
notes are 126 characters at the median and 343 at the ninetieth percentile, a citation's
source 26. The continental annotated editions print something else — Straubinger 248/814,
Martini 361/1,051, single notes at 4,830 and 10,243 — and per chapter their apparatus
comes to as many characters as the Scripture beside it (1.03 and 1.90 times the verse
text at the median, 46 in the Song of Songs). The gloss column sets about 43 characters a
line against the reading measure's 62.4, so parity of characters is already near half
again the height, and `clear: inline-start` starts each note below wherever the last one
ended.
What that breaks is not the look of the page but the arrangement's premise: by the eighth
verse the gloss is pages below the line that raises it, and a gloss BESIDE its line is
the whole of why the margin exists. So a note past 170 characters is clamped to four
lines, with "read more" under it — four after twelve and then six, each larger number
having still run the gutter past the chapter, because a margin holds a remark and a gloss
the reader must scroll past to reach the next one has stopped being one. A citation's
source is still set whole (every one of the Catechism's 3,698), with 59% of Challoner's
notes and 76% of Matos Soares's, against 35% of Straubinger's and 16% of Martini's —
which is the asymmetry the clamp is for. The count is the four lines MEASURED and moves
when they are remeasured: it was 130 against a 13rem column, and widening that column to
the aside's 17rem without moving it would have printed "read more" under notes the four
lines now set whole. The control sits tight under its own gloss and pushes
the next one down, since notes stack in the gutter with nothing but `clear` between them
and a control set evenly between two of them reads as belonging to the lower.

**Nothing about the marker changes, and that is the point.** A marker that opened a card
for the long notes and lit the gutter for the short ones would be two controls printed as
one mark, and the pointer would go back to raising a card over prose it was merely
crossing. Where there is a margin the marker still discloses nothing and a click still
lights the note it belongs to; the way to a clamped note's tail is in the note itself.

**And the tail opens as a modal, not as the card.** The card is anchored beside a marker,
which is a shape for a paragraph — these notes run to 4,830 and 10,243 characters, and a
card holding an essay covers the text it is glossing while pointing at it. A dialog
centred over the page is what the site already does with a panel that has stopped being
anchored to anything: `.dialog-bare` and the `.sheet-*` chrome in `menus.css`, shared with
the plate viewer and the tables of contents, with `showModal()` carrying the top layer,
the inert page, Escape and focus restoration. It is built only for the notes that need it
and only rendered while open, since a chapter of Straubinger raises forty of them.

**The clamp is counted, not measured**, and the count and the line limit are one decision
written twice (`MARGIN_CLAMP_CHARS`, `--sidenote-clamp`). Whether a note overflows is a
question for layout — `scrollHeight > clientHeight`, measured after a paint, per note, on
every resize and every change of reading size — where what the markup actually needs to
know is whether to render a way to the rest at all. `--sidenote-width` narrows with the
reader's text size, so there is no one width to have measured against in any case. A
character count is wrong only at the boundary, where it decides between a note set open
and a note set open to within a line of its end.

**An edition's gloss left the margin, and the two apparatuses over a Bible now behave
alike** (2026-09-01). Everything above about the clamp is history, and what dated it is
the corpus rather than a change of taste: `.margin-note` was calibrated on Challoner at
the length of a sentence, and the editions ingested since gloss a verse in an essay. The
clamp kept the column anchored by cutting most of the apparatus to an incipit — 65% of
Straubinger's notes and 84% of Martini's set only their first four lines — so the gutter
held a page of openings, each with a way to the rest of itself. That is not the _Glossa
Ordinaria_ arrangement with long notes in it; it is a table of contents for an apparatus.
Haydock's catena had already been kept out of the gutter for the same measurement, which
left one apparatus over the Bible arranged one way and the next arranged another. So the
gloss is reached the way the commentary is: the mark opens a card, or a dialog past
`CARD_MAX_CHARS`, at every width. What that buys beyond the page being quieter is that the
marker means ONE thing everywhere — `aria-expanded` is always a claim we can keep, a click
always opens something, and there is no second control (the ellipsis) and no second state
(the lit note) to explain.

**A citation's source stays in the margin, and that asymmetry is the whole of the
argument.** The reasoning above for putting it there is untouched: 26 characters on
average across the Catechism's 3,698, wanted beside the line that quotes it, costing the
text nothing and never clamped. What broke was never the arrangement — it was applying it
to an apparatus longer than the text it hangs on. So `sidenoteRoom`, `.margin-note` and
`CompareGrid`'s claim on the lane all stay, and the lane itself is still declared on every
reading page, occupied or not, because that is what centres the reading column.

**And the card is rendered even for a note that opens a dialog, because of PAPER.** A
closed popover is `display: none` and a closed `<dialog>` holds nothing at all, so once
the margin copy was gone the card was the only copy of the apparatus left in the document
— and a printed chapter would have carried a column of markers pointing at nothing, which
is exactly the silent loss `print.css` exists to prevent. It is set back into the flow
under the line that raised it, in the shape `.margin-note` printed in. Rendering it only
for the short notes would print most of the apparatus and drop the essays, which is the
worse half of both answers.

**A headword is set twice on paper and once on a screen, so the verse marks it and the
note stops repeating it** (2026-09-01). A lemma quotes the words a note glosses, and a
printed annotated Bible prints it in the verse and again at the head of the note, because
the note is at the foot of the page and the reader looking at it has lost their place.
On screen the note is anchored to its own marker — it opens FROM the words — so the second
copy answers a question the reader cannot have, and spends the first line of every note
saying what the mark they just pressed already said. Marking the first copy says the same
thing where the reader is already looking, in the wash `.citation-marker.highlighted`
already uses for "this is the one you asked about". It is also what the margin note's
highlight used to say across the page, now that there is no margin copy to pair a marker
with.

**The words are found by matching backwards from the marker, and refusing is a first-class
answer.** The marker is where the source set it, so the words are the run immediately
before it; a search would find the wrong occurrence of any phrase a verse repeats. That
matches 1,805 of the Douay-Rheims's 1,909 lemmas and 1,377 of Matos Soares's 1,743 — and
**none of Martini's 18,658**, which is the measurement the design is built around rather
than a shortfall in it. His notes are verse-level, with every marker at position 0, and his
lemma is a catchword printing its own elision (`E... diede... il nome di cielo.`): a
discontinuous quotation is not a span of anything. So the note keeps its headword wherever
the verse could not mark it, carried by the presence or absence of a single prop, and no
note can quietly lose one. Dropping the headword unconditionally would have deleted 18,658
of the corpus's 22,310. Allioli, Straubinger and Crampon print no lemma at all, and a
commentary keeps its lemmas for its own two reasons: its mark sits at the end of the verse
with nothing to match backwards from, and its card holds a whole catena, where the lemma is
what divides one authority's remark from the next.

**On paper the mark is permanent, because nothing there opens.** A screen shows the words
only while their note is open; print has no open state, so a printed chapter would
otherwise carry notes that had lost their headwords and verses that never said which words
each one was about. It is a dotted underline rather than the wash — what a printed
apparatus does, and not something to ask of a sheet of paper.

**An apparatus must not move the text, and that includes the apparatus saying "this
one".** The highlight lit on a marker was a background plus `padding-inline`, which is
inline size a superscript in running text did not have: clicking a note re-broke its line
and pushed every word after it along, with the floated notes beside those lines moving
too. A click that shifts the sentence being read is the exact failure the citation
disclosure was rewritten to stop making, arriving by a different door. It is an outline
now — drawn outside the border box, following the radius, taking no space — which is what
`.margin-note.highlighted` had already been reasoned into for the same arithmetic.

**Compare mode spends the room the notes live in, so it takes the margin back.** The
margin is a lane sized from what the reading columns leave over, and two of them plus the
aside leave it very little — about 10rem at 100rem with two columns up, against the 17rem
a note wants at full width. `CompareGrid` claims it while mounted; the reader's compare
_preference_ would be the wrong signal, since a work with one edition has it on and still
reads in one column.

**A citation opens over the page rather than inside the sentence, and it does so at every
width.** It was a boxed span that appeared in the flow, which is the one thing an
apparatus must not do: opening it reflowed the words around it, so the sentence being read
moved while it was being read, and closing it moved back. It is now a native `popover`
anchored to its marker — the browser owns the open state, the light dismiss, Escape, the top layer and
focus restoration, and `popovertarget` invokes it declaratively because the trigger is a
real `<button>` (`ReferenceNumber`'s is an `<a href>`, which is why `AnchorMenu` has to
show its own). Two things follow. `ProseBlocks` and `HeadingText` each kept a set of open
markers keyed by block and position, because a source can cite the same footnote twice in
one paragraph; both sets are gone, since `$props.id()` is per instance and there is one
instance per occurrence. And the card is the one `LinkPreview` already shows — same
chrome, same positioner — because a reader who has learned what a small box over the page
means should not have to learn a second one.

**The desktop marker keeps the popover even though the citation is already in the
margin**, which is where this apparatus stops matching the gloss. The margin is not a
reserved gutter but leftover slack, so it narrows as the reader's text grows — to about
7rem at the largest setting — and a column of stacked notes beside a densely-cited
paragraph does not say plainly which one belongs to the number just passed. Clicking the
number answers that at the number. The margin note stays in the accessibility tree rather
than being hidden as a duplicate: it is read right behind the marker for free, and hiding
it would charge an interaction for text already on the screen. The price is one extra
"collapsed" announced on a control that genuinely does open something.

**A panel placed by measurement is a family, and it now shares its chrome.**
`.floating-panel` (app.css) holds the five declarations `LinkPreview`, `AnchorMenu` and
the citation popover had each written out; `floating.ts` holds where they go, and
`trackAnchor` the scroll-and-resize tracking two of the three want. What deliberately did
not move is everything that differs — top layer or z-index, tracking or dismissing,
pointer events or none, padding — because a modifier for each is the shape
`menu.svelte.ts` records this codebase avoiding. `.menu-panel` is not in the family: it is
positioned in CSS from its own trigger rather than measured against one.

**The card opens on hover as well, and a preview can open on top of it.** These were one
problem. A footnote marker names a source without saying what it is, which is the same
case `LinkPreview` already makes for a link, so the two share their delays and their
pointer-capability test (`floating.ts`) rather than each choosing numbers — a paragraph
where the two disagreed would read as two different pages. `byHover` is what keeps the
click meaningful: a card the pointer summoned leaves with the pointer, one the reader
clicked for stays.

What blocked a preview inside the citation was the top layer, not nesting. Anything in it
paints above the whole ordinary document however high a `z-index` the rest is given, so
while the preview overlay was a plain positioned `div` it rendered BEHIND the card that
raised it, and the references in there were opted out of previewing altogether. Making the
overlay a popover puts both in the layer, where order of showing decides — and it is
`manual` rather than `auto` for one reason: an `auto` popover light-dismisses the one it
was opened from. `LinkPreview` already owns every path that closes it (a timer, a pointer
leaving, Escape, a scroll); it wants the layer and none of the behaviour.

**Where there is a margin, the click has a better answer than the card.** A card over the
page duplicates a note already set beside the line; what a reader cannot get any other way
is which of the notes stacked in the gutter belongs to the number just passed — marker and
note are separated by the whole width of the margin, and the only thing pairing them is
that they print the same character. So above the breakpoint the marker drops
`popovertarget` and a click lights the note instead, in the accent wash
`.compare-row.highlighted` already uses for "this is the one you asked about". At most one
is lit, which is the whole question it answers. Hover stopped opening the card there for
the same reason the click did: it raised a card over the prose to repeat words already a
hand's width to the left, and it did it while the pointer was merely passing through.

**And all of it generalized to the annotated editions' notes, where the phone was the
point.** A Challoner gloss used to open as a block under its line, breaking the verse at
the marker and pushing the rest of the chapter down — opening a note moved the sentence
being read, and closing it moved it back. It is the same card now, capped and scrolling
rather than growing, since a gloss is a paragraph where a citation is a phrase. The two
apparatuses had been diverging one behaviour at a time; `NoteCard` in `sidenotes.svelte.ts`
is now the whole of what they share — placement, hover intent, the popover's state, the
highlight — on `menu.svelte.ts`'s pattern and for its stated reason. Each component keeps
what it actually is: a number against a letter, a source against a gloss.

That deleted the last of the caller-side bookkeeping. `AnnotatedText` kept a `SvelteSet` of
open notes keyed by unit, marker and position, because the Douay-Rheims numbers four
different notes `1` down a single chapter; `noteKey` existed for that and is gone with it,
along with the `unit` prop whose only reader it was. `$props.id()` is per instance, and
there is one instance per note.

**And it is what let the Bible's comparison stop stripping the apparatus.** That route's
compare cell printed `verse.text` and nothing else — the one place on the site where
comparing cost the reader something the single column gave them, and precisely where they
have most reason to want it, since Challoner is often explaining why his verse says what
the column beside it does not. A gloss that opened as a block in the flow could not have
been restored there: it would have pushed one column's verses out of alignment with the
other's, which is the one thing a comparison cannot survive. A card costs the grid no
layout. The cell also had to become two — each column's notes are written in that
edition's language, resolve against that edition's work id, and take their letters from
that chapter's own run, none of which one shared snippet could carry.

**The Bible sidebar's chips are sized to the screen they have to fit** (2026-08-29). 46
Old Testament books in three columns is 16 rows and the New Testament 9 more; at the
1.9rem chip and 0.25rem gap the aside carried, that plus two testament headings came to
about 1,060px against the ~960 a 1080p viewport leaves `.reading-aside`, so the table of
contents opened already scrolled on the commonest desktop there is. Five numbers came down
together — the chip's block padding and height, the grid's gap, and the space either side
of a testament's heading — for a row pitch of 33px against 39 and a list of about 910. The
TEXT did not come down: 0.8rem is unchanged, and the chip's height is now its line box's
rather than a `min-height` floor's, which is also what stops `display: block` from seating
the label high in its own box. Removing the scrollbar gives the chips back the ~15px it
occupied, which is a character and a half of every truncated name.

**And the chips narrowed to four columns.** Three was `auto-fill`'s answer to a 4.5rem
floor; four is 19 rows for the 73 books against 25, at about 74px a cell — 62 of them
text, or nine characters of this sans. Most of the canon still sets whole and "Cântico dos
Cânticos" does not, which is fine while a reader is scanning: the chip carries a `title`
for that. The count is pinned rather than fitted because four is a decision about how tall
the list may be, and `auto-fill` decides that from a floor it is not being told about.

**The chapter panel opens OUT OF its chip, and takes over naming the book** (2026-08-29).
The truncation four columns cost was first answered by growing the open cell to
`max-content` — the right question in the wrong place. A chip that changes width on click
is a second thing moving under the reader's cursor, and it was widening towards the very
panel that had room to print the name properly. So the panel's top-left corner is now the
chip's: it covers the chip, and `.chapters-title` sets the whole name where the chip's
truncated label was a moment before. Nothing floats below anything, and the growth rule
and the `:nth-child(4n)` companion that turned the last column around are both gone — with
the chip covered, a grown chip would not be visible anyway.

Three things follow from covering the chip rather than hanging off it. The title is a
BUTTON: the chip is what closes the panel, and a covered chip cannot be clicked. (Keyboard
readers never lost it — focus stays on the chip, so Enter still toggles — but a pointer had
nothing to press, and outside-click and Escape are the way out of a popover, not the way
out of a disclosure you just opened.) The panel's width takes the CHIP's width as a floor,
measured rather than assumed, since a panel narrower than the box it covers leaves the chip
sticking out either side — which is what a 1-chapter book would do to a 15rem chip like
Martini's "Seconda lettera di Giovanni". And it takes a second, 8rem floor for the title,
which `.chapters`' own comment had rejected as arbitrary and which is not: a 1-chapter book
asks for one 2rem column and no book name in the corpus is that narrow. The title wraps
rather than truncates — a truncated title would be the defect it exists to answer, one
level down — and the names run to 32 characters ("Seconda lettera ai Tessalonicesi"), so
the floor is what keeps that wrap to two lines rather than one word each.

**And the chip outranks the viewport margin**, which is the same rule stated as a clamp.
The panel keeps 1rem of clearance from the edge of the screen; the contents sheet insets
its book grid by 14px on a phone, which is inside that, so clamping to the margin alone
pushed the panel 4px to the right of the chip it had opened from and left a stripe of
accent fill showing down the chip's edge. Covering the chip is the design, so the panel may
never begin after the chip begins or end before the chip ends, in either coordinate space,
and the margin is what applies in the slack between those. The width ceiling yields the
same way — `inlinePx` is never less than the chip is wide, which is what makes those two
clamps satisfiable at once.

The accent fill on the open chip stays, though a reader sees it only for the frame between
the click and the measurement: the state is real whether or not something is painted over
it, and that frame is the one where a chip that had not visibly changed would read as a
dead click.

**An argument that is only the chapter's own rubrics is not printed** (2026-08-29). Five
of the six annotated editions write a chapter argument as prose about the chapter —
Challoner's 1,307, and none of them matching anything else on the page. Matos Soares
writes his as the chapter's rubrics joined with spaces: of the 1,279 chapters he gives one
to, **1,131 are exactly the deepest-level headings of that chapter**, so the reader met
"Principio. Primeiro dia da criação…" above the title and then "Principio." again as a
rubric an inch below it. `chapterArgument` prints the stored summary unless it collapses
to precisely those rubrics. The deepest level is what is compared, not every heading: a
chapter may open with a part and a section title above its first rubric, and comparing
against all of them recognises 644 of the 1,131. The 148 that do not match keep their
argument, because they earn it — the Psalms carry a real title over rubrics that say
something else. It is a display rule and NOT a correction: the source prints this, so the
corpus keeps it; what changes is whether one screen shows the same words twice.

**A plate opens over the page, and the argument for it is arithmetic rather than taste**
(2026-08-28). `PLATE_SIZES` draws an engraving at 640 CSS px in the reading column and at
about 390 on a phone, where `srcset` therefore hands the browser the 800px rendition — so
the reader is already holding roughly twice the detail on their screen, and had no way to
reach any of it. That is what the viewer spends: it shows the file the page already
downloaded, read off the inline image's own `currentSrc`, and never asks for a larger
one. Opening it costs no request, no wait and no spinner, and it works offline in exactly
the cases the plate itself did — the plates being deliberately in no service-worker
download wave, an offline reader has the ones they have already seen, and a viewer that
fetched on tap would be the one control that breaks when the picture under it does not.

**A detail rendition is a separate decision and is deliberately not taken.** 1800–2000px
from the masters is what the engravings would support and what the ceiling is really
worth; at ~590 KB a plate that is about 140 MB on top of a 110 MB deploy, and per-reader
it is free only until someone taps. The measurement above says the free version is worth
shipping first, and the expensive one should be argued from what readers do with it.

**Two states, not a continuous zoom.** Fit, and the loaded file's own natural width, which
is the point past which the browser is inventing pixels. Pinch-zoom with momentum, bounds
and a transform matrix is a great deal of machinery around a question asked once; two
states answer it with a scroll container the browser already knows how to pan, and native
pinch still works over the top of it. The zoom is offered only where there is headroom to
gain — on a 1440px-tall viewport, fit is already about 1155px of a 1200px file, and a
control that magnifies by 4% reads as broken rather than as finished.

**It is the one modal on a site whose whole apparatus vocabulary is popovers.** A
citation, a link preview and the plate's own credit card float beside the text because
they gloss it and the text has to stay readable; the picture is not apparatus over the
text, it IS the thing being read, and covering the page is the point. `showModal()` then
pays for itself twice: the top layer, `::backdrop`, an inert background, a focus trap,
Escape and focus return are all native — and so is the Android back button, since a modal
dialog closes on a platform close request. No history entry, no shallow routing, nothing
to unwind. A reader who taps a plate and then taps back is still in their chapter.

**The surround is dark in all three appearances, so its chrome is written in fixed light
values** rather than in the palette — close to the only place in the stylesheet that does
that, and deliberate: a viewer's backdrop is dark for the reason a cinema is. `--color-bg`
stays load-bearing exactly where it always was, behind the plate itself, because
`--plate-blend` is `multiply` on light and sepia and multiplying a scan's paper into a
dark backdrop yields a black square. The picture's own box paints the page colour and
isolates, so the blend resolves against paper.

**The fit size is computed in JS, and the reason is a CSS trap worth recording.** A
percentage height resolves against the containing block's height, and wrapping the picture
in a control — which is what makes it a tab stop, Enter-and-Space activatable and
announced as a control at all — puts a shrink-to-fit box of `auto` height in between. So
`max-block-size: 100%` resolves to nothing, silently, and the clamp meant to letterbox a
portrait plate on a phone never applies. No arrangement of `aspect-ratio` and `max-*`
across the two elements avoids it without either distorting the plate or making the whole
stage a click target. The stage is measured instead and the width set outright.

**Fixtures deliberately encode absent chapters and out-of-range cross-references** to
exercise the not-in-corpus paths, and a second English Bible to exercise the
preferred-edition table. `npm test` always uses them (`corpus.ts` checks
`import.meta.env.VITEST`); a replacement that drops those properties silently stops
testing them.

**Do not drive the site with browser automation to check UI changes.** The person
directing the work does that verification themselves.

**`/documenta` is a filtered list and not a table of contents, since 2026-08-31.** It
grouped 272 documents into twelve collapsible pontificates with a sidebar of anchors into
them — the right shape for the sixteen Vatican II texts it was written for, and it
survived the encyclicals landing behind them without being reconsidered. What an anchor
list cannot express is the question a reader actually arrives with, which is rarely "what
did Leo XIII write" alone: it is some conjunction of who wrote it, what kind of document
it is, and what it is about. So the aside became a facet panel over those three axes and
the list went flat and reverse-chronological.

- **Across facets the values are AND-ed; within one it depends on the field's arity.**
  Author and kind OR, subject ANDs. The uniform rule was OR everywhere, which is what a
  faceted list means elsewhere, and it is right for the two single-valued fields — a
  document has exactly one author and exactly one kind, so AND-ing two of either is an
  empty list by construction and the only reading a second choice can carry is "and these
  as well". A subject is multi-valued: a document carries three on average, and picking
  _peace_ and then _poverty_ has an obvious second reading, the nine documents about both.
  Between "31 documents ∪ 25" and "9 ∩", only one of the two is narrowing, and narrowing
  is the whole reason the panel replaced an anchor list. Measured before the change:
  a first subject leaves 25 to 39 of the other 53 terms still co-occurring, so the facet
  does not collapse to a dead end after one click.
- **So the counts come from two pools, and the difference is not an inconsistency.** An
  author or a kind is counted against the OTHER facets: a number beside "Pius XII" says
  what remains if you add him to the authors already chosen, so within that facet the
  numbers add up, and counting against the fully filtered set would show 0 beside every
  author but the selected one — true, and useless. A subject is counted against
  everything, itself included, because it AND-s: its number is exactly what survives the
  click, which is the promise a subtractive facet has to keep. Getting this wrong is not a
  cosmetic error — a term reading 34 that yields 2 on click is a lie the reader can see.
- **A subject that reaches 0 is dropped from the panel, not greyed out.** One selection
  zeroes most of a 58-term vocabulary, and eighteen dead rows would hide the thirty that
  still narrow; a disabled row is only worth showing where it is one of a few. A selected
  term counts as live whatever its number, so filtering can never make a filter unreachable.

**The author facet prints each pontificate's years, from a table and not from the
documents** (2026-09-01). Twelve regnal names in reverse-chronological order asks the reader
to know the modern papacy by heart to make sense of the order they are in, let alone to
choose from it; `Leo XIII 1878–1903` places itself. The years are set smaller and muted, so
the row still reads as a name first, and they are the one label on this page that needs no
translator — digits and an en dash are the same in all thirty-four dictionaries, which is
also why an office still held ends in a bare dash rather than in the word _present_.

Two things about it are worth keeping.

- **Deriving the span from the corpus would have been wrong in a way that looks right.**
  First and last `promulgated` under a name is the obvious source and needs no table at all;
  it gives Leo XIII as 1878–1902 and Benedict XV as 1914–1921, each short at the end by the
  years in which the pope wrote nothing this corpus happens to hold. A pontificate is a fact
  about the world, not about a document, and nothing upstream publishes it —
  `pontiff_or_council` is a string vatican.va's index prints. So `src/lib/pontificates.ts`
  is a table, and what the corpus is used for is CHECKING it: every author's document span
  falls inside its reign, which is what catches a mistyped year.
- **The council is in the table, and the table is `Object.hasOwn`.** _Second Vatican
  Council_ is one of the twelve values a reader chooses between, and a single gap in a
  column of years reads as an omission rather than as a distinction, so it carries its own
  session years. The lookup is guarded because the key is corpus data: a bare index into an
  object literal answers for `constructor` and `toString`, and the test that says so failed
  on the first run.

**The subject facet became a tag cloud on 2026-08-31, and that is what retired the
truncation.** 58 stacked rows is about 1,390px in a 17rem aside, so the list showed eighteen
of them behind a "Show all" — a workaround for a list being the wrong shape for 58 short
labels, not a considered design. Flowing the terms inline and saying each one's weight with
its type size fits the whole vocabulary in roughly 480px: more than the truncated list took,
far less than the full one, and the aside is already `overflow-y: auto` under a sticky
max-height, so the extra height is absorbed rather than new. The measurements that decided the
shape are worth keeping, because two of them are counter-intuitive.

- **Size follows the LIVE count, not a corpus-wide total**, so the cloud is a picture of what
  is currently left. The cost is that every click resizes every chip and the cloud reflows.
  **Alphabetical order is what pays for that**, and it is why the order changed at the same
  time: widths move, but the sequence never does, so a term stays findable by scanning the way
  an index is. Ranking by a number that also moves would have sent the chips past one another
  as well. The fallback, if the reflow proves unreadable, is sizing from a corpus-wide total,
  which needs a `total` field on `Facet` and about three lines.
- **The scale renormalises against the current extremes.** Pinning it to the unfiltered 3–42
  would collapse every chip to the floor as soon as a filter narrowed the corpus — after one
  click the largest surviving term may hold nine documents, not forty-two.
- **The range is taken over positive counts only.** Two selected terms that share no document
  leave both at 0, and a zero minimum drags the floor of the scale down, silently inflating
  every other chip against it. Terms at 0 clamp to the smallest size instead, which is what
  they should read as.
- **Square root, and the curve is pinned by a test.** Measured over the real distribution,
  linear crowds half the vocabulary into the bottom third of the range and log over-expands
  the low end, spending most of the scale separating terms that differ by two documents.
- **The size range is a balance knob, not a compactness one.** Sweeping it from 0.75–1.35rem
  down to 0.75–1.00rem moves the cloud's height by only ~185px, because chip COUNT dominates.
  So `CLOUD_SIZE_MAX` is chosen by what the cloud has to sit beside, not by the space it saves:
  the panel's body is 0.85rem and its section headings 0.8rem, so at **0.75–0.95rem** the
  average chip is 15.0px against that 15.3px body — the cloud sitting just under the panel it
  lives in — and the heaviest subject reaches 17.1px. It shipped at 1.15rem for an afternoon
  and the big terms out-shouted every author row and heading around them. **Only the top of
  the range is adjustable.** `CLOUD_SIZE_MIN` is `--font-size-min` and the CSS clamps to that
  token, so setting it lower does not draw anything smaller — it flattens every term that
  would fall below the floor onto it, and 23 of the 58 hold nine documents or fewer, which is
  where the distinctions are worth most. The remaining 1.27x spread is near the floor of what
  reads as weight at all; below about 0.9rem the cloud is a list of words in one size.
- **Which is why colour carries the weight as well.** The size channel is capped by the panel
  it sits in, and 1.27x across 58 terms is thin; colour adds a second axis for nothing, since
  it costs no space. The same `weight` that sets the size mixes the chip's colour from
  `--color-text-muted` at the lightest to `--color-text` at the heaviest, so a term holding
  three documents is grey and one holding forty-two is as dark as the page's own prose. Both
  channels are read off one number, which is the reason they cannot drift apart — a size table
  beside a colour table is two things to keep in agreement. And the mix runs **between two
  tokens rather than toward a literal black**: in dark mode `--color-text` is the light one, so
  "heavier is nearer the text colour" stays true, where "heavier is nearer black" would have
  made the most important terms vanish into the background in half the themes.
- **The cloud chips carry no border; the document-row chips still do.** 58 outlined pills is 58
  boxes, and past a certain count the chrome is what the eye reads first — it competes with the
  words it is drawn around, which is the opposite of what a cloud is for. Removing it also
  changed what the cloud rhymes with: not `.doc-tag` on the rows any more, but the facet ROWS
  directly above it, sharing their hover ground and their solid accent fill. `.doc-tag` keeps
  its outline on purpose, and the difference is the setting rather than inconsistency — three
  or four chips inside a paragraph need an edge to be picked out of the prose; 58 in a column
  need to be left alone. The one thing the border was carrying besides decoration is the signal
  that a chip is a control, so the hover state now carries it; keyboard focus was never the
  border's job and is the global `:focus-visible` outline in `base.css`.
- **Pruning zero-count terms matters more here than it did in the list.** A dead term has no
  weight to draw, so it renders at the floor and is indistinguishable from the smallest live
  term: a chip that looks available and does nothing.
- **The count moved into a visually-hidden label** rather than staying a visible column, since
  size is what carries it now. That span is load-bearing — size is invisible to a screen
  reader — and it reuses `colophon.countDocuments`, which every dictionary already has, so the
  change cost no new strings in any language. Deleting the two "Show all/fewer" keys made it a
  net removal.
- **The filters are not in the URL, and that is a decision rather than an omission.**
  Nothing in this app reads or writes the client-side URL: the address grammar is
  pathname-only, `worker.ts` decides a page's status from the pathname alone, and the
  sitemap, the route manifest and the usage beacon all model paths and nothing else. A
  shareable `?auctor=` would be the first query string in the system and would want
  modelling in all four before it earned its keep. A filter here is a way of looking at
  one page, not a place.
- **The panel is rendered twice** — in the aside above 80rem and inside a `<details>`
  above the list below it, the handover `.toc-inline` already makes on `/documenta/{slug}`
  — which is why its options are `aria-pressed` buttons rather than checkboxes. Two
  instances of a checkbox facet are two elements claiming one `id`, and a `<label for>`
  then points at whichever the parser saw first, so a tap on the mobile panel would toggle
  a control in the hidden desktop one.

**The subject vocabulary is CLOSED, and it was open for exactly one day.** It began as 232
free-form terms written per document, and both ends of that distribution were useless in
their own way. The tail was 46 terms carrying one document each — `dueling`, `Dante`,
`Amazon`, `Fatima` — and a facet row that narrows 272 documents to one is a worse way of
reaching that document than its own title, while making the panel unreadable at the size
where the useful terms live. The head held terms that partitioned nothing: `centenary` (35)
and `anniversary` say what OCCASIONED a document rather than what it treats, and
`Vatican II` (23) and `synod` (22) restate the author and kind facets sitting directly
above them. `saints` survived the same cut because commemorating a saint IS a subject,
where the occasion words around it are not. What is left is 58 terms between 3 and 42
documents apiece, listed in the file's own `vocabulary` array, with the sync refusing
anything outside it.

**The head was cut a second time the same day**, and the pass is worth recording because it
separated two terms that looked alike from a distance. `errors condemned` (37) went and
`Church and State` (42) stayed. Frequency is not the test — 42 of 271 is 15%, and `education`,
`social doctrine` and `saints` all sit in the same band — so what decides it is whether the
term names what a document DOES or what it is about, the same distinction that removed
`centenary`. Nearly every magisterial text rejects something, and `errors condemned` had duly
attached itself to `spe-salvi`, `mysterium`, `providentissimus-deus` and `fratelli-tutti`
alongside `pascendi` and `humani-generis`. The measurable form of that is a FLAT
co-occurrence profile: nothing above 8, spread evenly over theology, saints, family,
Christology and social doctrine, because a mode attaches to documents about everything.
`Church and State` concentrates instead — `persecution` 13, `religious liberty` 3 of 6,
`education` 10 — since its 42 documents are one question asked from `vehementer-nos` and
`mit-brennender-sorge` to `dignitatis-humanae`, and that question is genuinely most of what
the Leonine and interwar corpus is about. The documents that really are anti-error lose
nothing: each keeps the error it names, `Freemasonry`, `communism`, `socialism`, `philosophy`,
`Thomism`, `Christian unity`. No document was left untagged by the cut.

**And the head-cut rule itself is weaker than it was, because the facet subtracts now.** The
original argument against a 40-document term was that it is not an answer, which was true
while the values within a facet OR-ed: adding it to anything only flooded the list. Under AND
a broad term is the best FIRST click — `Church and State` meets `education` at 10 documents
and `marriage` at 5 — so size is no longer evidence against a term, and only the
mode-versus-subject test is left doing work.

**What took `errors condemned`'s place is the errors themselves**, and that is the shape the
vocabulary already had: `communism`, `socialism` and `Freemasonry` were named errors from the
start. Five more were derived by scanning the 263 English descriptions and then reading every
hit — `rationalism` (6), `naturalism` (5), `modernism` (4), `atheism` (4), `materialism` (3).
They are not five words for one thing: 22 assignments over 17 documents, largest pairwise
intersection 2. And they close a real gap, since a mode term had been standing in for the
subject — `pascendi-dominici-gregis`, the systematic condemnation of Modernism, carried
philosophy, seminaries, Scripture and Thomism and nothing that named it.

**The rejected candidates are the more useful half of that scan.** The ancient heresies are
not subjects in this corpus: Arianism, Americanism, Jansenism, Gallicanism, Manichaeism,
Donatism, pantheism, positivism, evolutionism and immanentism appear in none of the 263
descriptions, and Pelagianism, Nestorianism and Monophysitism in one or two apiece — always
inside a document commemorating the Father who fought them, `aeterna-dei` for Leo the Great,
`orientalis-ecclesiae` for Cyril, `ad-salutem-humani` for Augustine, where the subject is the
saint and `saints` already holds it. The corpus runs Leo XIII to Francis and the errors it
treats are that period's. Two near-misses are worth recording for the method rather than the
result: `gnosticism` scored 3 and is 1, because the other two hits were the string
`agnosticism` inside `pascendi` and `communium-rerum`; and `secularism` scored 5 and is 2,
because `tametsi-futura-prospicientibus` lists it among the consequences of unbelief,
`grata-recordatio` among a Rosary letter's prayer intentions, and `sancta-dei-civitas` as
background to an appeal for missions. It stays out on a second ground as well — the documents
that would carry it are the separation-law encyclicals, which `Church and State` and
`persecution` already hold. Counting a word proposes a candidate; reading the sentence is what
decides it.

- **The 35 region names were the closest call.** `Mexico` and `Hungary` are real subjects
  and a reader does want them. They are dropped from the FACET and not from the site: every
  one is in the document's description, which the search box reads. That is the whole
  argument for cutting hard — a facet row is for BROWSING an axis, and the search is for
  everything else.
- **Merging one term into another is a semantic act and it is easy to get wrong.** Four of
  the first cut's merges were wrong in the same shape: each was right about the commonest
  document carrying the term and wrong about the rest. `technology` into `ecology` filed
  the artificial-intelligence encyclical under ecology and left the only document on that
  subject unreachable by it; `devotion` into `saints` made the encyclical on the Holy
  Spirit a saint's letter; `preaching` into `priesthood` made Dei Verbum a document about
  the clergy; `consecration` into `Marian devotion` made the consecration of the human race
  to the Sacred Heart a Marian document. The rule that follows is to check a merge against
  every document it touches rather than against the archetype, and it was a probe over the
  real corpus that caught the first of them, not a test.
- **What the open vocabulary could not do is translate**, and the closed one still does not.
  Every coinage would have been fourteen inventions rather than fourteen lookups — the cost
  `route-titles.mjs`'s `CHROME_KEYS` warns about, paid per tagged document. A closed 58-term
  list could carry an i18n key each, the way `document_kind` does; that is 58 strings per
  dictionary, near two thousand at the current count, and nobody has asked for them. The terms render verbatim and only the panel is translated.

**Three things about that file fail the sync rather than warning.** A tag outside the
vocabulary — a typo, or a synonym of a listed term, which splits a term's documents in two
with neither half findable. A slug naming no document in the build, which is the residue of
a renamed work whose tags are lost silently otherwise, because a filter offering one fewer
term looks exactly like a corpus holding one fewer document. And two vocabulary terms
differing only in case, which the panel matches as one facet with two labels. A term on no
document is a warning only: that is the ordinary state while one is being introduced, and an
empty facet row is visible in a way a missing one is not. A missing FILE is still not an
error, on the same terms as `descriptions.json`.

**The search box is what made the cut safe, and it is one function with the highlighter.**
`/documenta` searches title, author, kind, description and tags together, AND-ed with the
facets. `matchesQuery` lives in `src/lib/highlight.ts` beside the `highlight` the jump box
already used, sharing its fold and its `occurrences` tiers, so a document is on the results
list exactly when the highlighter has something to mark on it — every row can show why it
is a row. A matcher written separately would drift, and the drift is invisible in the one
direction that matters: a result arriving for no reason a reader can see. It AND-s its
tokens where `highlight` ORs them, because marking is generous (an unmarked span costs
nothing) and filtering is strict (two words typed into a box are a narrowing).

**The tags ship as one fetched file and not in the boot index**, on the rule
`corpus-index.ts` states: the index every reader downloads before the first paint answers
"does this address exist", and a tag answers neither existence nor address. One page wants
it, so that page fetches it — the same arrangement the translated descriptions have. Nor is
it merged onto the manifests, which would write the same strings into all ten editions of
Laudato Si' and put them in the index after all.

### The colophon states the site's canonical standing, and deliberately not its provenance

Added 2026-09-02. **Can. 216 CIC** reserves the name _Catholic_ to undertakings holding the
consent of competent ecclesiastical authority — _nullum tamen inceptum nomen catholicum sibi
vindicet, nisi consensus accesserit competentis auctoritatis ecclesiasticae_. This site is
named `Glossa Catholica`, holds no such consent, and until this day said nothing anywhere
about its standing. `colophon.whatThisIsStanding` says it now: a private undertaking of the
lay faithful, no ecclesiastical approbation, no authority of its own.

**The word is not the exposure; the absence of a disclaimer was.** The commentary tradition
reads _vindicare_ narrowly — what is forbidden is claiming the name so as to imply the
undertaking acts in the Church's name — and on the facts here that reading was the
unfavourable one. A site that reproduces the Catechism, the Compendium and the magisterial
documents verbatim and adds no visible byline presents as an organ of the Holy See's own
texts. That confusion is the whole _ratio legis_, and it existed independently of the title.
Compare c. 808 on universities, which concedes that a thing may _be_ Catholic in fact and
still not be entitled to the _title_: the canon regulates the name, so being manifestly
orthodox is not a defence.

**It sits in "What this is", not in the copyright section.** The copyright section is
addressed to a rights holder; standing is addressed to the reader, and belongs where a reader
asks what this is. It is not its own `<h2>` because a heading would need a name in fourteen
dictionaries for a term of art none of them has a settled word for.

**What it does NOT say is what is ours, and that omission is deliberate.** A second paragraph
was drafted the same day claiming the arrangement and the editorial descriptions, and removed.
There is real prose here that is not the publishers' — `descriptions.json` holds 385 works'
descriptions, written here by reading a document — but a reader meets that prose _beside a
document_, not on the colophon, so a paragraph on a page most readers never open is the wrong
instrument for it: it cannot mark the individual item, which is the only place the question
actually arises. Provenance belongs in the reading interface, per item. That is `PLAN.md` gap
16, and until it exists the colophon claims nothing rather than claiming it in the weakest
available place.

**AND THE PAGE IS TRANSLATED NOW, WHICH REVERSED A STANDING RULE.** The long
colophon prose had been withheld from every dictionary written on 2026-08-31, on
the argument that a machine translation of the page explaining how carefully this
site handles other people's words would be the one page whose form contradicts its
content. That argument proves too much. The page's job is to be _weighed_ by the
reader it is addressed to, and a reader who cannot read it cannot weigh it — an
English wall is not more honest than a translation, only more silent. The
asymmetry is what settles it: an unread page protects nobody, while a translated
one is wrong only where a translator was wrong, and says so in its own header.
All 34 dictionaries carry all 31 colophon keys as of 2026-09-02.

**What the old rule was really protecting is kept, and moved.** Each dictionary
states its own confidence tier, and the twenty added on 2026-08-31 say plainly
that no native speaker has read them. Two of the colophon's strings are singled
out there because they are OPERATIVE rather than descriptive — the canonical
standing statement above, and `copyrightBody3`, which tells a rights holder how to
object. Everywhere else on the page a bad translation reads oddly; in those two it
would misstate what this site claims about itself, or lose someone the only
sentence written for them. Deleting a doubtful line remains the right fix: `t()`
falls back per key, so removal costs English rather than nothing.

**The statement reached the footer of every page on 2026-09-02**, which is the same
argument one step on rather than a second decision. Can. 216 is provoked by the NAME, and
the name is in the wordmark at every one of the roughly six thousand addresses this site
answers; a disclaimer that only a reader who navigates to the colophon ever meets does not
reach as far as the thing it disclaims. `footer.notEndorsed` is the one-line form —
_Not endorsed by the Holy See_ — set under the colophon link and the motto _Ad maiorem Dei
gloriam_, all three in one chrome beside a Jerusalem Cross. It says **"the Holy See"**
rather than "the Vatican", which names the state and not the authority, and rather than
"ecclesiastical approbation", which is the exact term and one no footer can carry.
**It is as short as it is because of where it sits**: the line above it is the link to the
full statement, so the disclaimer need not carry its own context, and the three lines are
deliberately the same size and colour — set the motto larger and the stack reads as a
heading with two captions rather than as an imprint. All 34 dictionaries carry it, and it joins
`whatThisIsStanding` and `copyrightBody3` in each machine-translated file's header as a
string that is OPERATIVE rather than descriptive.

**Neither of the two marks beside it is encumbered, and that was checked rather than
assumed.** _Ad maiorem Dei gloriam_ is the Society of Jesus's motto and was never
proprietary to it — it long ago passed into general Catholic use. The Jerusalem Cross is
the emblem of the Custody of the Holy Land and of the Equestrian Order of the Holy
Sepulchre, and is also a public Christian symbol far older than either body's current use
of it; its traditional reading, the Gospel going out from Jerusalem to the four corners of
the earth, is close to a statement of what this site is for. **Can. 216 reserves a NAME.
No canon reserves a symbol or a Latin phrase.** The one line not to cross is a specific
body's ARMS — no crown, no motto ring, no red-on-white in the Order's arrangement — because
a mark drifting there would contradict the sentence printed next to it. The component's
docblock carries that rule, so making it look "more official" has to be a decision someone
takes rather than a tidy-up.

**The mark itself is not ours, and that is the right answer rather than a shortcut.**
Three drawings were made here first — a solid cross potent from overlapping rectangles, the
same shape as a traced outline, then five plain crossed lines — and each was an attempt to
settle proportions that heraldry settled centuries ago. What ships is Wikimedia Commons'
`Cross-Jerusalem-Potent-Heraldry.svg` by AnonMoos and Melian, which is **public domain**:
checked through the Commons API before copying, which reports no attribution requirement
and no restrictions. It is credited in the component's docblock regardless, because a site
whose entire position is about other people's rights in their work does not take a licence
exemption as permission to go quiet about where something came from.

**Its `<use xlink:href>` indirection was expanded into explicit rotations and the
equivalence was PROVED, not assumed.** The source defines two `id`s and re-uses them; two
copies of a component carrying `id`s are duplicate ids in one document, and `xlink:href` is
deprecated besides. So the arm is drawn at two rotations about (280, 280) and the crosslet
at four, and the result pixel-diffs to **zero** against the original render. A refactor of
someone else's geometry is a redraw unless something checks it.

**Two canons bite harder than 216 and are not addressed by any of this**, recorded here so
nobody reads the colophon paragraph as having settled them. **C. 826 §3**: collections of
prayers for the public or private use of the faithful are not to be published except with the
permission of the local ordinary — `/preces` is exactly that, with no interpretive room.
**C. 825 §1**: Scripture may not be published without the approval of the Apostolic See or the
conference of bishops; Challoner and the Clementine carry historical approbations, and
`bible.cpdv.en` carries none at all.

**OFFLINE MODE, 2026-09-02: the reader may switch the network off entirely.** The site was
already offline-FIRST — the shell precached, content stored on first read, the library
fillable ahead of time — and every one of those mechanisms is about coping with a network
that went away. This is the other direction: the network is there, and the reader has asked
that nothing touch it. A metered plan abroad, a flight, a rationed connection, or simply not
wanting a reading device to talk to a server. Off by default, one switch reached from the
settings panel (`SettingsMenu.svelte`, which is what `AppearanceMenu` became when it stopped
holding only appearance).

**It shipped behind a fold on the same day it was built, and the reason is worth keeping.**
Asked what the switch actually buys, the answer was smaller than it looked: the automatic
waves put the shell, the prayers, the Compendium and one Catechism edition on the device
(`AUTOMATIC_WAVES`), and the three large waves — Scripture, magisterium, Summa, 23-28 MB each
— are reachable only by a `CACHE_WAVE` that no UI sends. So a reader who turns offline mode
on has what they have already read and little more, and the case that would make anyone reach
for it — fill my library, then go dark — has no door. The half that IS served is real and
needs nothing further: the reader who does not want a reading device phoning home. That is a
narrower audience than a front-row control implies, so the control moved behind
`+ Advanced` rather than being widened or removed.

**Then the first half was built, on the same day and into the same fold** — a panel of the
reader's waves priced before they commit to any of them, which is the consumer `planWaves`'
byte counts had been waiting for since the corpus was split. The two rows sat in the fold in
the order the reader needs them: the library first, because offline mode turns downloading
off, and a reader who meets the switch before the shelf meets them backwards. That ordering
is the whole of what the pairing had been missing.

**Doré's engravings became a shelf, having been in no wave at all.** The 241 plates are
ordinary build assets rather than corpus text, so the fetch handler had always stored them in
the permanent content cache on first read — which meant the only way to get them was to have
already looked at them, one plate at a time, online. That is the opposite of what a reader
packing for a flight wants. They are now `illustrations`, last in the wave order and outside
`AUTOMATIC_WAVES`: 482 files and 103 MB, four times the entire text corpus, so nobody may
have it uninvited and the row says what it costs before anyone presses anything. Two
consequences worth recording. The sync writes each image into `content-manifest.json` to give
it a price, but its URL is resolved through `plate-urls.ts` rather than the content glob —
widening that glob would have moved 482 hashed URLs into the chunk every page loads, to be
read by the two places that already had them. And the usage beacon's `full` library bucket
now excludes the plates from its denominator: leaving them in would have made a reader with
every word of every work read as `partial` forever, retiring the bucket without anyone
noticing.

**A shelf can be dropped as well as taken, and the two deletions are not one operation.**
Each row carries a bin beside its arrow, and the foot of the panel still carries "remove
everything" — but a per-wave delete happens in the page, against the same content cache the
panel already reads, while the whole-library one is the worker's `caches.delete`. The reason
is what the wave plan can NAME: the cache also holds files whose content hash has moved on
and languages the reader has stopped reading, so a "forget everything" assembled by summing
the waves would quietly leave things behind. Both are two-click, and one piece of state holds
which is armed, so a second click always lands where the reader is looking.

**The panel plans the waves on the client, which is not a second planner.** The worker plans
in order to fetch; this plans in order to PRICE, and a price is asked for before the download
exists for the worker to be asked about. `readerPlan()` moved out of `sw.svelte.ts`'s `#send`
and became exported for exactly this: two callers that must plan from the same input, because
a divergence would show the reader one number while the worker fetched a different set of
files, with no symptom on either side. What is NOT duplicated is the measurement — held bytes
are read back from the cache every time, never accumulated from the progress messages, for
the reason `measureLibrary` already gives: progress covers only the fills this page watched,
and the reader whose library was filled last week is the one the panel must be right about.

**And then the fold stopped being a fold, later the same day** — `+ Advanced` now opens
`AdvancedSheet`, a dialog holding the library and the switch together, and the settings
popover keeps only the door. Three things were wrong with the fold and the third is the one
that decided it. A hidden control that is silently ON is a reader who cannot explain why
nothing loads, which the fold answered by opening itself whenever offline mode was enabled —
a rule that works and that nothing needs once the control is simply a row in a panel with a
title. The library was a second dialog either way, because byte counts, a progress bar and a
destructive action do not fit an 11rem popover. And that width is why the switch could only
ever name its state and not its price: what offline mode costs — that a text not already on
the device will not open — is a sentence, and the popover could carry a sentence only as a
`title` nobody hovers on a phone. Splitting one subject across a popover row and a dialog
made the reader assemble it themselves, and the panel that was too narrow to explain either
half was what forced the split.

**It is three gates and not one, because there are three mechanisms and no single
chokepoint.** `sw.svelte.ts` stops the update check, the offer and every download message the
page sends; `usage.ts` withholds the beacon; `service-worker.ts` serves cache-only, which is
the only half that can hold for a request no application code issues — a font, an image, the
document of a cold start. Gating any two of the three leaves the third talking.

**The worker's copy has to be PERSISTED, and that is the non-obvious part.** A service worker
has no `localStorage` and is killed and restarted freely, and the request that matters most —
the navigation that boots the app — is answered before any page script exists to tell it
anything. So the flag is mirrored into a cache of its own (`glossa-prefs`), which is the only
storage a page and a worker share; the page re-posts it on every start as a correction, never
as the source. A design that only posted the flag would have worked in every manual test and
failed exactly once per cold start.

**A miss is REFUSED, not fetched, and that is the whole feature.** `cacheOnly` answers 504
rather than falling through — including when the cache itself throws, since an unreadable
cache is not permission to make the request. What the reader sees is `NotDownloaded`, which
carries the switch that undoes it, distinguished from a genuine 404 by the status alone
(every deliberate refusal in a `load` is `error(404, …)`; a content read that threw is a 500).

**Two things it cannot stop, and both are the browser's.** The periodic byte-check of the
worker script, which the browser schedules on its own, and the `install` that follows if that
check finds a new version. The precache is deliberately NOT gated: a worker that activates
with an empty shell cache is an app that cannot boot at all, which is a far worse answer to
"make no requests" than one 157 KB install nobody asked for.

**It made two latent bugs reachable, and both were fixed with it.** `corpus.ts` memoized
REJECTED reads, so one failure poisoned a file for the life of the page — harmless while the
only cause was a network already gone, fatal to a switch whose entire purpose is to be turned
back off and retried. And `LinkPreview` had no `catch` on its resolve, so a failed read left
the card in `loading` for ever and the rejection reached nothing. Both are the same shape: a
failure path that was only ever reached by accident, and became ordinary.

## Usage measurement

**Nothing measured usage until 2026-08-27, and the reason it had to change is the
offline-first design itself.** `/` is precached and served cache-first, an installed app
launching at `start_url` makes no document request at all, and an in-app route change is
a `pushState` that never reaches the edge. So request logs can count arrivals and nothing
else: they cannot tell a reader who came once from one who has read daily for a year.
That question — "is anyone using this, and do they come back" — had no instrument.

**Retention is measured without an identifier, by making the device count itself.**
`usage-device.ts` keeps a 28-bit integer in localStorage, one bit per day, "did this
device open the site". What leaves the device is the bucket that count falls in
(`15-28`, `4-7`, `1`), never the bitmask, never a date, never a number assigned to
anyone. Two sessions from the same device carry no field that joins them.

The cost is classic cohort retention — of the devices first seen in March, how many
survived to April — which genuinely does need identity. What it buys is the age
distribution of the active population, which is what the question actually asks. That
trade was made deliberately and is not a gap to close later.

**One beacon per session, and only for a reader.** Nothing is sent until the session has
had five seconds of visible time and at least one real interaction. That gate is the bot
defence, not politeness: a JS-rendering crawler loads, snapshots the DOM and leaves
without scrolling or clicking, and because it keeps no localStorage between crawls every
visit looks like a brand-new device that came once and never returned — precisely the row
this exists to count. Letting crawlers write it would poison the one number that matters.
Edge logs still count arrivals; the beacon counts readers.

**The country is recorded and never meets the session.** Eighteen bucketed fields in one
row is already a weak quasi-identifier; adding the country makes an unusual reader — a
tablet in a small country reading a rare edition — unique in the table. So `geo_lang` is
a separate counter with no key back to `session`, and the cross-tab it answers (which
languages each country reads in, and where interface language and content language
diverge because `CONTENT_LANG_FALLBACK` is doing the work) costs nothing in linkage.

**Work level, never passage level, and never free text.** Which text someone opened is a
corpus-priority signal; which paragraph they read is their business. The jump box records
that a query missed and, where the grammar recognised one, which book — an identifier
from our own tables. The query itself is the one thing on a site of these texts that must
not be stored.

**Every field is an enum, validated at the edge, because `/a` is an open POST endpoint.**
`usage-schema.ts` is one module shared by the sender and the receiver rather than two
lists, since the whole defence rests on their vocabularies being the same object; two
copies drift, and the failure is silent in the worst direction. Every outcome is 204, so
a prober learns nothing about what the validator accepts.

**The damage worth preventing is not a skewed statistic but an eaten quota.** A poisoned
window is dropped with one `delete ... where day = ?`. D1's free tier allows 100,000 row
writes a day, and exhausting it stops genuine rows being written — the same shape of
failure as the `run_worker_first` outage, a free-tier ceiling reached quietly. So
`usage-store.ts` holds a 20,000-row daily cap, read from D1 at most once a minute per
isolate and incremented locally between reads.

**Three pieces live in the Cloudflare dashboard and nothing in the repository can assert
they agree. This is their record.**

1. **A WAF custom rule** (one of the free plan's five) blocking `/a` for verified bots,
   non-`POST` methods and non-same-origin requests:

   ```
   (http.request.uri.path eq "/a")
   and (
     cf.client.bot
     or http.request.method ne "POST"
     or not any(http.request.headers["origin"][*] eq "https://glossacatholica.org")
   )
   ```

   `http.request.uri.path`, not `http.request.uri`, which carries the query string and
   would miss `/a?x=1`. `eq`, not `wildcard` — with no `*` the two are the same match,
   and on a path this short a later "fix" to `r"/a*"` would swallow every route
   beginning with `a`.

   **The third clause tested `sec-fetch-site` with `any(… ne "same-origin")` until
   2026-08-29, and it never fired.** A header that is absent is an EMPTY ARRAY,
   `any()` over an empty array is false, and so a request carrying no
   fetch-metadata at all read as "not non-same-origin" and was allowed: `curl -X POST`
   with no headers reached the worker, which is how it was found. The shape to write is
   `not any(… eq …)`, never `any(… ne …)` — the first treats absence as failure, the
   second as consent, and every header test on an open endpoint wants the first.

   **And the field had to change with it**, because failing closed is only safe on a
   header every genuine sender actually sets. `Origin` is attached by the Fetch spec to
   every request whose method is not `GET` or `HEAD`, so every `sendBeacon` POST carries
   it in any browser that has `sendBeacon` at all; `Sec-Fetch-Site` arrived in Safari
   only at 16.4, so tightening THAT clause would have silently stopped counting readers
   on iPhones that cannot pass iOS 16.3 — an undercount biased toward older devices,
   invisible in the report, and indistinguishable from those readers not existing.

   Verified by hand after the change, which is the only check there is: no `Origin` and
   a foreign `Origin` both answer 403, the site's own `Origin` answers 204, and a real
   browser session still lands a row. A rule that blocked forgeries and readers alike
   would look identical from outside.

2. **The zone's single rate limiting rule already covers `/a`**, because it excludes
   three static prefixes and verified bots, and `/a` is none of them:

   ```
   not starts_with(http.request.uri.path, "/_app/")
     and not starts_with(http.request.uri.path, "/fonts/")
     and not starts_with(http.request.uri.path, "/icons/")
     and not cf.client.bot
   ```

   Block at 120 requests per 10 seconds per IP per data centre — §The site is the full
   record of it, including why those three prefixes must stay equal to the first three
   `run_worker_first` negations. The bot clause costs the beacon nothing, since rule 1
   already blocks verified bots on `/a`; it is there for indexing. The free plan allows
   exactly one rate limiting rule and it is spent, which is why the write ceiling is a
   counter in `usage-store.ts` rather than a second rule.

3. **The kill switch is a third custom rule blocking `/a` outright.** A dashboard change
   rather than a deploy on purpose: a client-side stop needs the service worker to
   propagate, and an installed PWA can sit on a superseded shell indefinitely.

**AI Labyrinth is off, and the reason is specific rather than general.** It works by
adding invisible honeypot links so unauthorised crawlers follow an endless chain — more
requests to a zone whose documented failure mode is too many navigations, 100,000
invocations, and 429 on everything until 00:00 UTC. It also injects into HTML, and this
site serves exactly one HTML file, precached by the service worker.

**The law this is built to is the LGPD, and it is a better fit than the one the design
was first argued against.** The site's author is in Brazil. There is no Brazilian analogue
to ePrivacy's Art. 5(3) — the rule that storing information on a device is regulated
whether or not it is personal data — so the localStorage counter, which under the European
reading was the whole exposure, is not itself a regulated act here. What matters is
whether what is transmitted is _dados pessoais_ at all (Art. 12: anonymised data is not,
unless reversible by reasonable means), and on what legal basis.

The ANPD's `Guia Orientativo — Cookies e Proteção de Dados Pessoais` (2022) is directly on
point: **legítimo interesse** (Art. 7, IX) supports first-party audience measurement
without consent, provided the processing is limited to patterns and trends over
**aggregated** data, is not combined with other tracking mechanisms, and does not build
profiles. It names aggregation into anonymous statistics as something that _supports_ the
basis rather than merely permitting it. Every condition is satisfied here by construction
— one first-party origin, no third party, no identifier, buckets instead of values, and a
`geo_lang` table with no key back to `session`. That last separation is what makes Art. 12
an argument rather than an assertion: it is the reason an unusual reader is not unique in
the table.

**This section is the legitimate-interest assessment.** ANPD's 2024 legitimate-interest
guidance expects the balancing to be documented rather than assumed, and this is that
document: the purpose, the alternatives rejected, the data deliberately not collected, and
the measures that lower the risk. If it is ever asked for, it exists.

**The device record expires after twelve months, absolutely.** The same ANPD guide
requires a retention period proportionate to the purpose, rejects indeterminate durations
outright, and asks that persistent storage be limited in time as far as the purpose
allows. Twelve months is where that lands, and the window is bounded from below as well as
above: `age` tops out at `90d+`, so any expiry past three months costs that field nothing,
and the field that needs the room is `visits` — where the binding case is the INFREQUENT
reader, who takes a year to reach twelve visits at all. Cutting to four months would
report a monthly reader as a brand-new device three times a year, inflating the one number
the whole measurement exists to establish. A year is the shortest window that does not
corrupt the answer.

**Stored rows are pruned by a daily cron, not by a flag someone remembers.** The retention
period the guide asks for is 400 days — thirteen months, because comparing a month against
the same month a year earlier needs both endpoints present — and it is enforced by
`scheduled()` in `src/worker.ts`, on a trigger declared in `wrangler.jsonc` and versioned
with the deploy. `npm run usage -- --prune` still exists as a way to force it; it is not
the mechanism. This distinction is the whole point rather than tidiness: a period applied
only when someone types a flag IS an indeterminate retention period, however firmly the
constant is written down, and indeterminate is the one thing the ANPD guide refuses
outright.

The two windows are deliberately different numbers. `RECORD_MAX_DAYS` (365, on the device)
bounds how long a device may remember itself; `RETENTION_DAYS` (400, in D1) bounds how
long an anonymous aggregate stays useful. They answer to different purposes, and
collapsing them into one constant would make both harder to argue.

It is an ABSOLUTE lifetime, never renewed by a visit: a sliding window would keep a record
alive indefinitely for exactly the readers who visit most, which is what a retention limit
is for. The cost is one distorted number, and the report prints the caveat beside it — a
returning device whose record has expired reports `age: new, visits: 1` for one session,
so `new` is over-counted by about one session per device per year (0.3% of a daily
reader's sessions, 8% of a monthly one's).

**EU readers are a real secondary exposure and the design is left at the stricter
reading.** The interface is in thirty-four languages, most of them European, which is the
kind of evidence GDPR Art. 3(2) treats as offering a service into the Union; ePrivacy's
consent rule is stricter than anything above. Nothing here was relaxed on discovering that
the LGPD is the primary law — the point of recording it is to know which argument answers
which regulator.

**Nothing is collected from a developer's machine, and `dev` alone does not
establish that.** `$app/environment`'s `dev` is `import.meta.env.DEV`, so it is false
under `npm run preview` and false under `wrangler dev` — both of which serve a production
build from a laptop. The test is the hostname, and it is spelled deny-local rather than
allow-canonical: listing the real domain would fail in the worse direction, since moving
the site would stop measurement silently and the report would read as "nobody visited"
rather than as an error. `?usage=on` overrides it, because a measurement nobody can
exercise by hand is a measurement nobody checks. The worker refuses a local hostname too
— `wrangler dev --remote` is the one path by which a working tree can write production
rows, and either guard alone would stop it.

**The report is a terminal report** (`npm run usage`), beside `audit.py`,
`census.py` and `reference-coverage.mjs`, and for the same reason: a number worth acting
on is a number worth printing beside the others. It suppresses population cells below
five — not because a count of three is dangerous but because a single-reader cell invites
you to read a person into it — and deliberately does NOT suppress diagnostics, where a
long tail of three quota failures or one unserved book is the entire value.

## Linking out

Until 2026-09-02 every link this site made pointed at a locus inside its own corpus, and
`llms.txt` said as much: **cite the publisher for the words, link here for the locus**.
An outbound link is therefore a new kind of object here, not a new field, and it arrived
for one citation only — Acta Apostolicae Sedis. Its predecessor gazette followed on
2026-09-03, and the two together are still the whole list.

**AAS is a venue, not a work, which is why it is linked and not ingested.**
`AAS 86 (1994), 386-387` addresses a page in a printed volume; this corpus's whole address
grammar is unit-based and a page number has no unit to become. The Holy See publishes it
only as scanned OCR PDFs, which nothing in the pipeline reads. And the citation is a
provenance note in the first place — the reader wants the _document_, and AAS only says
where it was promulgated. It is simultaneously the most-cited absent source in the corpus
(23,245 references, measured 2026-09-02) and the one with the least to gain from a parse.

**A derived href, never a table of rows.** An outbound URL table is this project's known
failure shape — the silent stale answer, unverifiable at build time without network. The
volume is in the citation string, so the address is computed from it, and a derivation
cannot rot one entry at a time the way a typed row can. The same reasoning applies to any
outbound source later: prefer a derivation wherever the citation carries the key, and
where a row is unavoidable hold it to the `absent-sources.json` standard — verified once
by a real fetch, recorded, re-checked on a schedule rather than in the build.

**The printed year is a CHECK, not an input, and that is the load-bearing part.** AAS
volume _n_ is the year 1908 + _n_ without exception, so the citation states the same fact
twice and both must agree before anything is linked. Deriving the year instead would be
one line shorter and quietly wrong, because a long tail of pre-conciliar citations reads
`Leo XIII, "Immortale Dei", 1 Nov. 1885: AAS 18 (1885)` — AAS did not exist in 1885, and
that is volume 18 of the **Acta Sanctae Sedis**, its 1865–1908 predecessor, written under
the later siglum out of habit. Derived, each of those becomes a confident link to a real
volume forty years wrong, which is exactly this project's standing failure mode; checked,
1908 + 18 ≠ 1885 and the reader is told nothing instead. Of the 22,885 AAS references
carrying a volume, 22,417 print a year and 256 of those disagree — the ASS citations plus
OCR wreckage (`AAS 4433 (1941)`). Two independent tokens, both must agree.

**What is linked, and what the ceiling is made of.** 16,531 references (71.1%) resolve to
a volume PDF. The largest refusal is not a gap in the code: volumes 95 (2003) onward are
published one PDF per _month_ under an Italian month name, and a citation gives volume and
page and never a month, so those 5,524 are unresolvable in principle. The rest are the
year check doing its work, two volumes bound in two parts (the page decides which, and
this grammar does not read pages), and citations with no volume at all. The 92 addresses
the derivation builds were each confirmed 200 and `application/pdf` by HEAD on 2026-09-02.

**The chrome goes inside the disclosure, not on the siglum.** The obvious affordance is an
external-link glyph beside every `AAS 58` — and there are thousands of them, in a column
that is already mostly apparatus. A siglum already opens a card that says what its letters
stand for (`SiglumGloss`); where the volume can be read is the same kind of answer, so it
rides in that card, behind the same press. The link's own treatment is
`CopyrightNotice`'s, unchanged, because it is the same promise and a second outbound style
would read as a second kind of promise. It says "scanned PDF" for two reasons: the reader
is owed the format before the tap, and on a page being read offline the link is dead and
this is the only warning of that there can be.

**Containment: it is not a slug and must never become one.** `slug` stays null, `refHref`
still declines the segment, and nothing that resolves addresses on this site
(`corpus-routes.json`, `sitemapPaths`, `assertNamed`, `suggest`) sees an AAS volume as one
of them — the reference-coverage table is byte-identical across the change, which is the
check that says so. An external address is a separate optional field for that reason
rather than a nullable slug, and a held siglum's link here always wins.

**It strengthens the rights position rather than straining it.** `llms.txt` already says
to cite the publisher for the words; an external-link line pointing at vatican.va is that
sentence made clickable.

**Acta Sanctae Sedis is the second, and it is a TABLE — the exception the paragraph above
asks for evidence before making.** ASS is what AAS was called from 1865 to 1908, cited 389
times across the corpus and most densely in Lumen gentium, which prints it in nine of its
editions. Two things make a derivation impossible rather than merely inconvenient. The
filename does not follow from the volume: the Vatican's year suffixes are irregular
(`ASS-32-1899-900`, `ASS-33-1900-1`, `ASS-34-1901-2`) and volumes 10 and 16 carry a
supplement's page range inside the name. And the CHECK only half derives — `year − volume
== 1867` holds from volume 9 up and fails for all eight below it, where the early volumes
span two years apiece and the offset walks (volume 4 is 1868, not 1871). `audit.py` has
carried that offset since it learned to flag impossible references, with
`SERIES_ASS_IRREGULAR_BELOW = 4`; it is set too low, and only had 13 distinct volumes to
test against.

**What licenses the table is that the series is CLOSED.** The failure a URL table is
avoided for here is the silent stale row, and that needs a series still growing. ASS
ceased with volume 41 in 1908 and cannot gain one; the only way the table rots is
vatican.va moving the files, which breaks the AAS derivation in the same breath. That is
the shape of evidence to ask for before writing the next one — not "the rows are few" but
"the set cannot change".

**Everything else carries over unchanged, the year check first**, and it is the year check
that makes the volume's SPELLING not matter. A volume reaches the table three ways, because
the corpus prints it three ways and all three are the same address: as a digit locus; as a
Roman numeral, which `LOCUS_RE` cannot read and which the French and Latin editions set
(`ASS XXVIII (1895-1896)` is volume 28, whose years are 1895-96); and as the head of a
comma-chained locus, where the citation put the year inside it (`ASS 5, 1869, 305-331`
arrives as one locus carrying volume, year and pages together). None of the three needed a
new tolerance, because each is answered by the same two-token check — which on the Roman
numerals earns its keep twice over, refusing `ASS XXII (1930)` (Casti connubii, an AAS
volume under the earlier siglum) and `ASS XII (1908)`, where the source has set Haerent
animo's volume XLI as XII and the printed year says so.

The year itself is read from `(1885)`, `(1890-91)`, `(1890/91)`, `[1869]` and a bare
`, 1908` alike — a two-year volume is cited by either of its years, the Vatican's own index
brackets rather than parenthesises, and the Latin editions use no bracket at all. The
unbracketed form is safe for the same reason the whole design is: the number must EQUAL one
of the volume's own years, and an ASS volume runs to some 700 pages, so nothing it could be
confused with reaches four digits (`ASS 41,555-575` is declined on the digit count alone).
Measured over the corpus through the grammar itself: **258 citations link, across 27 of the
41 volumes.** Each of the 41 addresses was confirmed 200 and `application/pdf` by HEAD on
2026-09-03.

**The siglum was not glossed in English or Portuguese at all**, which is the half of this
that had nothing to do with linking: `ASS` sat only in `SERIES_SIGLA`, so 31 citations in
the English editions, 72 more in the six tags that fall back to English (`be`, `lv`, `sw`,
`sl`, `nl`, `hr`) and 43 in Portuguese rendered as unglossed text. Adding the two rows
moved `recognized` in the `vatii` and `encyclical` families and left `linkable` flat in
every family — the same containment check the AAS change was held to, and the same result:
an external address is not an address on this site.

**A first pass refused the Roman and unbracketed forms on the grounds that they were "a
different locus grammar", and that was wrong in a way worth recording.** `ASS XXVIII` is
`ASS 28`; the spelling of a numeral is not a different address, and "`LOCUS_RE` only reads
digits" is a fact about the implementation offered as if it were a fact about the citation.
The tell is that the refusal had no failure to point at — every argument for it was about
this code, and none about what the reader would be sent to. **Where a shape is refused, the
reason has to name what would go wrong**; where it names only what is currently written, it
is a to-do wearing a rule's clothes.

**What is refused now is refused on the year alone.** The bulk are AAS volumes under the
earlier siglum — `ASS 57 (1965)`, `ASS 81 (1989)`, `ASS XXII (1929)` — which is the check
doing exactly its job. The one genuine cost is a citation that prints the DOCUMENT's year
rather than the VOLUME's: `ASS 20 (1888)` is Libertas praestantissimum, really in volume
20, which the Vatican's index labels 1887. Accepting a year ±1 would recover a handful and
would be the one thing this design refuses — a tolerance invented to fit the cases in front
of it, on a check whose whole value is that two tokens must agree. The table follows the
index, and a year the index does not print is not ours to supply.

**The Code of Canon Law is no longer one of these, and the reason is worth keeping.** It
was listed here as a citation carrying a real locus whose per-book URLs needed a range
table — an argument for linking OUT that was really an argument for not having ingested
it. It is in the corpus now (§The Code of Canon Law), so a `CIC can. 216` resolves to a
canon on this site rather than to someone else's page, and this row was never about
canon law: it is about works this corpus does not hold.

**Still not linked out, deliberately.** The papal minor
magisterium — addresses, homilies, messages, motu proprios, roughly 2,000 citations, every
one of them on vatican.va at an address the citation does not derive. That family needs a
discovery crawl of the pontificate indexes, which is most of the work of _ingesting_ it;
so for it the question is not "link or parse" but how much the site wants to be, and that
is not a technical decision. Denzinger, Migne and Sources Chrétiennes have no link to give
at all.

## The liturgical calendar

Taken in on 2026-09-03. The General Roman Calendar, computed rather than stored:
`site/src/lib/calendar/` derives every day of any year from the date of Easter and a
table of the Church's fixed celebrations, and `/calendarium` renders it. It is the
first thing on this site whose subject is not a text, and the first content that is
**ours** rather than reproduced — both of which needed deciding rather than assuming.

### The Holy See does not publish the calendar, and that decided the architecture

The _Universal Norms on the Liturgical Year and the Calendar_ and the _Calendarium
Romanum Generale_ were promulgated together by Paul VI's motu proprio _Mysterii
Paschalis_ of 14 February 1969. vatican.va publishes **the motu proprio and neither of
the documents it approves**: the page carries the letter, ends at _Datum Romae_, and
the Norms and the Calendar are printed in the Roman Missal after the General
Instruction. Checked 2026-09-03, and the near misses are worth recording so nobody
re-runs the search: vatican.va's own `liturgical_year/` section is six descriptive
pages on the seasons with no dated list behind any of them, and the Congregation for
Divine Worship's _Notificazione su alcuni aspetti dei calendari e dei testi liturgici
propri_ gives norms for **drawing up** a particular calendar rather than the general
one's contents.

So the corpus could not hold this. There is no page to fetch, therefore nothing for
`raw/` to keep write-once, therefore no work. The table lives in **this** repository as
`grc.ts`, and `pontificates.ts` is the precedent with the same argument: a fact about
the world that nothing upstream states, kept beside the code that needs it.

### An oracle is not a source, and the difference is the whole design

A liturgical calendar is the one kind of output where being wrong looks exactly like
being right. A mis-parsed encyclical is visible in its own text; an Ordinary Time week
numbered one too high is invisible until a reader who knows the year happens to notice.
And the cases that break an implementation are chosen for their rarity — an
Annunciation falling inside Holy Week, a transferred Epiphany landing on 7 January, the
week Ordinary Time resumes at after Pentecost.

GCatholic publishes the General Roman Calendar as iCal, per year, in the eight variants
that correspond exactly to the three transfers a conference may make, and in Latin as
well as the vernaculars. `pipeline/scrapers/liturgical_calendar.py` fetches those into
`raw/gcatholic-calendar/` and parses them to `site/src/lib/calendar/oracle/`, where
`oracle.test.ts` compares **every day of three years in all eight variants, plus
sixteen national calendars** — 72 calendars — against what this project computes.

It is `liturgical_calendar.py` and not `calendar.py`, which is what it was called for a
day. A script's own directory leads `sys.path`, so that name was the stdlib `calendar`
for every other file in `pipeline/scrapers/` — and `common` imports `http.client`, which
imports `email`, which imports `calendar`. Every scraper in the directory died on a
circular import through a module it never mentions, in a traceback naming
`email/_parseaddr.py`. The shadowing is silent when it does not crash, which is worse:
anything reaching for `calendar.monthrange` would have got a calendar of feast days.

**Nothing from the oracle is served to a reader.** It decides no day at runtime; it
decides whether the code that decides days is right. That is what makes it an oracle in
the corpus's own sense of the word rather than a source, and it is why a scraper that
writes nothing to `build/` belongs in `pipeline/` at all.

**It earned its place before the first test ran.** Reading it to calibrate found two
rules that had been written from the Norms and were wrong: the eight days of the Octave
of Easter are ranked as **solemnities** (n. 24), and the reduction of a memorial to a
commemoration is not the Lenten thing n. 14 describes it as — it happens on the
privileged weekdays of 17–24 December and inside the Christmas octave too. Four more
came out of running it:

- **An optional memorial never takes the day.** Line 12 of the Table of Liturgical Days
  sits above line 13, and reading the table as a plain sort makes every ferial Tuesday
  with a saint on it disappear into that saint — 100 days of 2026 alone. The table
  ranks what happens when two celebrations _must_ be resolved; an optional memorial is
  by definition one that may be observed or not.
- **A commemoration takes the season's colour, not the saint's.** It is the Lenten
  weekday's own Mass with the saint's collect inside it, so a martyr commemorated on a
  Lenten Friday is violet and never red. This was wrong on every commemoration in the
  year.
- **The Saturday memorial of Our Lady is not offered on a Saturday that is already
  hers.** 12 September 2026 is a Saturday and the Most Holy Name of Mary.
- **The calendar is not a constant.** John Henry Newman was inscribed on 9 October
  between 2025 and 2026, so a table with no dates in it quietly claims the calendar
  never changed. `SINCE` is the answer, and a removal will want an `until` beside it.

### Rank and precedence are separate fields

The single most load-bearing decision in the module. A feast of the Lord is line 5 of
n. 59 and a feast of a saint is line 7, with a Sunday in Ordinary Time between them at
line 6 — so the Transfiguration displaces a Sunday and Saint Lawrence does not, though
both are `rank: 'feast'`. Every Sunday of Advent, Lent and Easter is line 2, above every
solemnity, while a Sunday in Ordinary Time is line 6, below them; both are
`rank: 'sunday'`. **Comparing on rank gets these backwards and reads plausibly doing
it.** So the class from the table is stated per celebration and comparison is on the
number alone.

### An impeded solemnity does not always move forward

n. 60 sends a solemnity impeded by a higher class to "the closest day not listed under
nn. 1–8", and _closest_ is not one direction. The Annunciation impeded by Holy Week goes
**forward**, past the whole Octave of Easter, to the Monday after the Second Sunday —
25 March 2027 is Holy Thursday and the oracle confirms it lands on 5 April. Saint
Joseph impeded by Holy Week is **anticipated**, to the free day before, as 19 March was
in 2008. 2035 is the year that needs both at once, because Easter falls on 25 March: a
single forward queue gives Joseph the Annunciation's day and pushes the Annunciation a
fortnight past it. The direction is therefore a property of the celebration and not a
rule read off the season — and Joseph's is the one rule here the oracle cannot confirm,
since 19 March is outside Holy Week in all three of its years.

### Brazil, and a rule that turned out not to exist

A national calendar is modelled as a **layer** over the general one — propers, rank
changes, transfers, and the general celebrations it keeps on another day — because
that is what nn. 48–55 describe. A country is then a data file with no code, and the
general calendar cannot drift out from under it.

Brazil's Sunday transfers are the interesting part, because the attempt to find the
rule behind them failed and the failure is the finding. Measured across the three oracle
years: Saints Peter and Paul moved from a **Monday backward** to the preceding Sunday in
2026 and from a **Tuesday forward** to the following Sunday in 2027; All Saints moved
forward from a Monday in 2027 and did not move at all from a Saturday in 2025. Neither
"nearest Sunday" nor "following Sunday" fits all six. So `movedInYear` is a table of
years rather than a rule, and outside the years listed the celebration keeps its own
date — the general calendar's answer, which is at least not a date nobody chose. (The
field is not called `sundayTransfers`, because a Sunday is not what these have in
common: the Congo keeps the Visitation on Monday 1 June 2026, 31 May that year being
Pentecost, and only a solemnity is transferred when impeded.)

Two smaller facts of the same kind. A move can be **conditional on the displacing
proper being kept**: 5 October 2025 is a Sunday, so São Benedito is not observed, so
nothing displaces Faustina and she does not move to the 6th. And a move can **begin**
in a given year — Brazil omitted Pontian and Hippolytus outright in 2025 and has kept
them on 12 August since 2026.

### Fifteen countries, and what a layer had to learn to be one

Extended on 2026-09-03, the same day. The countries are the fifteen with the most
Catholics, which is the criterion the work was asked for and the only one available
that is a fact rather than a preference; the list stops at Germany because a list has
to stop somewhere, and the next one down costs a file and no code. Sixteen oracle
calendars, because GCatholic publishes the United States twice — `US-D` and `US-H`,
the Ascension on the Thursday in six ecclesiastical provinces and on the Sunday
everywhere else — and one layer is checked against both.

**The claim that a country is a data file survived, and it cost seven small extensions
to the engine to keep it true.** Each is a thing a real conference does that the eight
variants of the universal calendar cannot express, and each was found by a country
failing rather than by reasoning:

- **There are four Sunday transfers, not three.** GCatholic's `General-{A..H}` are the
  eight combinations of Epiphany, the Ascension and Corpus Christi, which reads as a
  statement that those are the three. The Democratic Republic of the Congo also keeps
  the **Sacred Heart** on the Sunday, in all three years — and the Immaculate Heart
  does not follow it, staying on her Saturday, which becomes the day before rather
  than the day after.
- **A celebration can fall on no date at all.** Seven conferences keep Our Lord Jesus
  Christ the Eternal High Priest on the Thursday after Pentecost, a feast Benedict XVI
  granted in 2012 that is in no variant of the general calendar; the Philippines keeps
  the Santo Niño on the third Sunday of January; Argentina keeps Our Lady of the Valley
  on the Saturday after the Second Sunday of Easter and Saint Mary at the Cross on the
  Friday of the Fifth Week of Lent. Two forms cover all of them — an offset from Easter
  and an *n*th weekday of a month — and they are two rather than a vocabulary of named
  anchors because an offset is a fact anyone can check against a calendar.
- **A proper can be a feast OF THE LORD.** The module argued for one afternoon that a
  country never needs line 5, since n. 59 gives proper feasts one line (8). The Santo
  Niño disproves it: the third Sunday of January 2026 is the Second in Ordinary Time,
  and the feast takes it. Line 8 loses to a Sunday and the feast would have vanished.
- **`elevations` had to be renamed `overrides`.** It only ever raised a rank while
  Brazil was the only layer. Mexico keeps Saint Scholastica and Padre Pio as OPTIONAL
  memorials where the general calendar makes them obligatory; the Philippines and Spain
  change only a colour. A field named for the commonest case invites a reader to assume
  the rank can only go up.
- **A conference changes its mind.** Those two Mexican demotions are true from 2026 and
  were not true in 2025, so `since` gates an override as well as a celebration — the
  same lesson John Henry Newman taught, from the other direction.
- **Blue is a liturgical colour in two of these calendars.** Spain obtained the
  _privilegio de azul_ for the Immaculate Conception in the eighteenth century and the
  Philippines inherited it. **The obvious generalisation is false and worth recording
  as such**: the privilege is described as Spain's and her former dominions', which
  predicts the Spanish-speaking Americas, and Mexico, Colombia, Peru, Venezuela and
  Argentina all print 8 December in white. Counting the discs over forty-eight feeds is
  what settles it.
- **Some days a calendar names are not celebrations.** The United States prints four
  (the Day of Prayer for the Legal Protection of Unborn Children, Independence Day,
  Labor Day, Thanksgiving), India one (Republic Day), Germany keeps Whit Monday as a
  Mass of the Holy Spirit in red, and Spain keeps Ember Days of Thanksgiving and
  Petition in October. They carry **no rank**, and that is not an omission: they are not
  lines of the Table of Liturgical Days at all. Giving them an invented rank would be
  the only way to lose the one true thing about them — that Thanksgiving is a Thursday
  in Ordinary Time with a Mass appointed for it. So they are a separate kind, kept
  beside the day's celebration rather than among them.

**The rank tokens in these feeds are the language's own initials.** Nine calendars in
Latin, English, Portuguese, Spanish, Italian and French all print `S F M m`, which
reads as a machine vocabulary; German prints `H F G g` for _Hochfest, Fest, gebotener /
nicht gebotener Gedenktag_ and Polish `U Ś W w` for _uroczystość, święto, wspomnienie_.
A table read as language-independent was a coincidence of six Romance-and-Latin feeds.
The star suffix for a commemoration is the only part that genuinely is universal.

**A national proper's name is transcribed, and the check that remains is real.** These
celebrations have no Latin original — they were approved by a conference in the
language it works in — so the site carries the conference's own wording, and for the
non-Anglophone layers an English rendering of it written here. The oracle then checks
the names in the anchor language only, which is a transcription check rather than an
independent one; what it checks independently is everything the ENGINE does with them —
the date, the rank, the colour, the precedence interactions, the moves, the transfers,
the suppressions. That is the part that can be wrong in a way nobody notices, and the
part the day-by-day comparison of 75 calendars actually tests. Three of GCatholic's
names are misspellings (`Baustista`, `Xeelos`, `Augustín`); the site prints them
correctly and the divergence is a named pair rather than a loosened match.

### What the calendar deliberately does not say

**The lectionary.** The cycle letters (A/B/C, I/II) are stated as facts about the year,
and the page stops there. The readings themselves are a work this corpus does not hold,
and printing citations for them would be asserting a table nobody here has sourced.

**The day's colour as the page's colour.** The liturgical colours are vestment colours,
and four of them are also this interface's background in one theme or another. A named
swatch says the same thing without the page pretending to be the sanctuary.

**Thirty-four languages' worth of saints.** The Calendarium is a Latin book, so the
Latin name is the celebration's own and Latin is complete. English and Portuguese — the
site's two stated audiences — are written, and each national layer's propers carry the
language its conference approved them in; every other interface language falls through
`CONTENT_LANG_FALLBACK` to English and then to Latin, exactly as it does for a work the
corpus does not hold in that language. A national calendar's propers have no Latin at
all, and that is correct rather than a gap: they were approved in the vernacular by the
conference that has them, and composing a Latin name for them would be the invented
text §Scope refuses.

### The date is a query parameter, not a path segment

`/calendarium?d=2026-04-05`. The URL grammar divides addresses in two — a reading
address names a citation and takes no language prefix, a chrome path names a page whose
every word is the interface and does — and a date is neither. It names no citation,
because there is no text at `2026-04-05`; and as a chrome path it would multiply by
every date in history and put an unbounded set of URLs into the sitemap for pages that
are pure computation.

## Scope

**In**: the Bible (nine editions), the CCC, the Compendium, all encyclicals across all
pontificates, the 16 Vatican II documents, the 2 First Vatican Council constitutions,
apostolic exhortations, the prayers, the Summa (EN + LA), and the Compendium of the
Social Doctrine of the Church (ten languages, see below).

**Every encyclical the Holy See publishes is on the site in some language** — English
where it exists, otherwise the language it does exist in. Discovery consults the Italian
index per pontificate for anything English does not list; measured, Italian is the only
language that reaches a document English does not. This is not a "crawl more languages"
switch: the language a document arrives in is whichever one it exists in.

**One encyclical is on that index twice, and the corpus takes it once.** Pius XI's
_Firmissimam Constantiam_ (28 March 1937, on the religious situation in Mexico) is
published by vatican.va under two slugs — `hf_p-xi_enc_19370328_firmissimam-constantiam`
and `hf_p-xi_enc_28031937_nos-es-muy-conocida`, the Latin incipit against the Spanish one,
with the date written the other way round in each. Both are linked from the Pius XI index,
both answer 200, and the second page's own masthead reads FIRMISSIMAM CONSTANTIAM: the two
parses were byte-identical, 39 sections and 29,655 characters apiece. The corpus addresses
documents by their Latin title, so the Latin-titled slug is the one that stays, with the
Spanish one dropped at discovery by `INDEX_DUPLICATE_SLUGS` in `vatican_docs.py`.

Three things about that decision are the reusable part. **It is dropped at discovery, not
deleted afterwards**, because it is not a parse defect — both pages are real and both were
fetched, so `raw/encyclical__nos-es-muy-conocida__en.html` stays as the evidence and only
the second _address_ goes. **It is a table rather than a special case**, because what
produces it is the origin's index, and an index that did this once can do it again.
And **it is the only one**: checked 2026-08-31 by hashing every work's `sections.json` and
`appendix.json` across all 1,446 works, which found this pair and nothing else. (The one
other exact match is `ad-gentes.la` and `presbyterorum-ordinis.la` sharing a _Patrum
subsignationes_ appendix, which is correct — the same fathers signed both decrees on the
same day.)

**Translations beyond that are fetched, not published, by default.** Every encyclical is
held in `raw/` in the nine interface languages plus Latin; acquiring sources and deciding
what to publish are separate decisions on separate timescales. A page's own language bar
under-reports by a factor of six and cannot be used as an index of what exists.

**Out, each for a reason that will not change on its own:**

- **The Fathers** — a library, not a work. Measured by _works_ rather than authors, the
  demand is flat: 69% of 734 cited works are cited exactly once, and "ingest Augustine"
  is eighty-two projects. There is no top-forty subset. Parse the citation strings
  instead; 72.8% already carry a work-internal locator.
- ~~**The Code of Canon Law** — no Portuguese edition on vatican.va at all.~~ **Taken
  in on 2026-09-03, and the reason it was out was simply false** — see below.
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

### The Code of Canon Law, and a scope decision that rested on two wrong facts

Taken in on 2026-09-03, in the seven languages vatican.va publishes it in as HTML —
`de en es fr it la ru`, 1,752 canons apiece. `cic.{lang}`, `type: "canon-law"`,
the arrangement the Compendium of the Social Doctrine set out below: a document's
content files, the Catechism's addresses.

**It was out of scope for a reason that was never true, and a second one that was
a wrong URL.** The 2026-08-15 survey (`docs/research/vatican-documents.md`)
recorded "no Portuguese edition on vatican.va at all" and "not Latin
(`cic_index_lt.html`, 404)", and this file carried the first of those as the
standing reason the Code was excluded. Both are wrong. The Latin index is
`cic_index_la.html`; `lt` 404s here, which is the exact inverse of the trap
`ccc.py` documents on the same host, where `catechism_lt` IS the Latin
Catechism. And a Portuguese edition exists at
`cod-iuris-canonici/portuguese/codex-iuris-canonici_po.pdf` — 488 pages with a
clean text layer, which `common/pdf.py` and `ccc/compendium_pdf.py` are already
equipped to read.

**What found them is the page that lists the editions, and the lesson is about
where a scope survey looks.** `archive/cdc/index.htm` names every edition of the
Code and links each one — six HTML indexes, two PDFs, a single-page Russian
mirror, a Chinese page in another directory entirely. The survey had probed
URLs it derived from a naming convention and read a 404 as an absent edition;
the mirror does not follow that convention here, and it publishes a page that
says so. **A guessed URL's 404 is evidence about the guess.** Where an origin
prints an index of what it has, that index is the answer and a derived address
is a hypothesis — the same rule `cic.py`'s discovery follows for the 1,061
content pages, none of whose names any rule produces (`cic_lib1-cann7-22_en`,
`cic_libroI_7-22_it`, `cic_libro1_cann7-22_sp`, `cic_liberI_la`).

**Book VI is the law in force, and it took two checks to be sure.** _Pascite
Gregem Dei_ replaced canons 1311–1399 whole on 8 December 2021, and each
edition's index links a PDF called _Nova versio Libri VI_ beside the HTML — from
which the obvious reading is that the HTML is the superseded text and the
replacement is in a format nothing here parses. That reading is wrong: the HTML
IS the revision (English canon 1311 carries the §2 on pastoral charity the
revision introduced; canon 1398 is the new delict against the dignity of the
person; the 1983 abortion canon has moved to 1397 §2), and the PDF is the same
book in another format. The corpus nearly withheld 89 canons of current law on
the strength of a link's title. **A page that says what it is beats a filename
that implies it**, and the check that settled it was reading two canons whose
text the revision is known to have changed.

**The Latin edition keeps an amendment apparatus, and it is the first thing in
this corpus that publishes a superseded text.** A superscript `n` marks each
canon a later act has changed, and below the Code the edition reprints the
wording that act replaced, under a bracketed line naming it. English and Spanish
do the same in their own words; German does; Italian and Russian do not. It is
real content and it is not an address — canon 579 must resolve to the law in
force — so it rides on the canon as `superseded` rather than in `sections.json`'s
numbered flow (`docs/corpus-schema.md` §Code of Canon Law). The alternative
considered and rejected was `appendix.json`: an appendix is matter with no
number, and these have one.

### The Compendium of the Social Doctrine, and what a work type is for

Taken in on 2026-09-02, in ten of the twelve languages vatican.va publishes it as
HTML. It is the first work since the Summa to be a work rather than an edition of
something already here, and the first ever to need a `type` of its own.

**It could have been shelved as a document, and the choice against that was about the
ADDRESS.** Structurally it is one: `vatican_docs.py`'s discovery would have found it, its
sections are `html` blocks with `<sup data-fn="N">` markers, its ten editions would have
grouped under `/documenta/compendio-dott-soc` like any other slug, and the whole ingestion
would have been a table entry. What that gives up is the thing the work is used for. A
document is addressed as a document — one page, `#s{n}` within it — because a reader
cites an encyclical by name and reads it through. This work is cited the way the Catechism
is: **`CSDC 160`, a number and nothing else**, in every language, and its own index of
references is 90 book names each pointing at a run of paragraph numbers. An address that
cannot be `/doctrina-socialis/160` fails at the one thing 583 numbered paragraphs are for.

So `type: "social-doctrine"` is **the Catechism's addresses over a document's files**, and
that sentence is the whole specification. `sync-corpus.mjs`'s branch writes exactly what
the document branch writes — the same chunked `sections/` and the same `structure.json`, at
paths the document readers already resolve — and registers
exactly what the Catechism branch registers: a number set, a set of chapter anchors, an
existence check. There is no second content tier, no second chunk stride, and no second
copy of any reader. **A work type is a statement about addressing, not about storage**, and
this is the case that made the difference visible.

**Two editions are withheld with the measurement that put them there.** Indonesian,
because vatican.va publishes only that edition's table of contents — 22,573 characters
against English's 846,980, and a page of headings is not a text. Dutch, because its
footnotes are interleaved through the body and numbered per group, so pooling them into
one apparatus resolves a citation to the wrong note: not a hole, which is honest, but a
wrong answer, which is not. Five further languages exist as PDF alone and are captured to
`raw/` for nothing to read, on the terms `ccc.py` set for Arabic and Chinese.

**The one that is worth the space is the failure the scraper exists to prevent.** Cardinal
Sodano's letter of transmittal stands above the document and numbers its own five
paragraphs in exactly the form the document numbers its 583. Handed the whole page, the
walker took the letter's numbers as sections 1–5, rejected the document's own 1–4 as
backwards-running false positives, folded them into §5, and resynchronised at §10. **It
reported 583 sections, no gaps, range 1..583.** Every check this project has — the range,
the gap list, the section count, the cross-edition comparison — passed, because every one
of them asks whether the numbers are well formed and none asks whose numbers they are.
That is the standing shape of the dangerous defect here, and it is why `csdc.py` splits
the page by reading the numbers rather than by counting the `<hr>` rules the markup
offers: four of the ten editions do not print them.

**Reading it required nine changes to `vatican_docs.py`, which is the argument for doing
it in a scraper beside that file rather than inside it.** Each change was measured across
the whole corpus before it was kept, and together they improved 58 existing works — most
of them nothing to do with this one. `BOLD_BARE_NUM_RE` is the one to know about: a fifth
paragraph-numbering convention (`<b>1 </b>`, no period) that turns out to be how all
sixteen Czech Vatican II editions print their numbers. They had been parsing as a handful
of sections with hundreds of orphaned blocks; `sacrosanctum-concilium.cs` went from 9
sections to 130. Nothing had reported this, because `vatii` had exited nonzero on every
run it had ever had (the symmetry check, which is FAIL by design) and so nobody was
reading its exit code. Both document stages exit 0 now.

**Its reading surfaces were built twice on 2026-09-02, and the second pass is
where the work's shape was actually settled.** The first gave it the Catechism's index
grid, addresses for its front matter, and an edition picker. Three of those decisions did
not survive a reading of the result:

- **An appendix page was the wrong answer to "this text has nowhere to go."** The letter
  of transmittal and the presentation are real text in ten languages, and that made an
  address for them look obligatory. It is not: a reader arriving at a work numbered 1 to
  583 is not arriving for two prefatory documents, and a page that exists because the data
  does is a page nothing links to. The corpus keeps them; the site does not ship them.
- **Where a table of contents POINTS is a decision about what a reader is doing.** Four
  surfaces answered it four ways — the index sent a division to the chapter view and every
  heading inside it to a paragraph page, both sidebars sent everything to paragraph pages,
  and the breadcrumb printed one crumb where the Catechism's prints five. The rule
  (`socialDoctrineNav.ts`) is that following an outline is going somewhere to READ, so
  every row lands in the chapter at the heading it names, and the paragraph page is
  reached by its number — which is the form a citation takes anyway. The index was first
  built with TWO destinations per row, the title to the chapter and the range to the
  paragraph it opens at, and that is one destination too many: the two are a hundred rows
  of choosing between them, two tab stops apiece, and a distinction nobody asked for. One
  link per row now — the title's anchor stretched over the row — and the range states how
  much of the book the row covers, which is a fact about the row rather than a second
  place to go. The Catechism's index keeps two chips, because it genuinely has two works
  and linking the title to one of them would answer a question the reader has not asked.
- **A derived number is a claim, and this work falsifies it.** The sidebar abbreviates a
  printed division label to a short form whose number comes from the row's position among
  its tree siblings — `CHAPTER FIVE` → `Ch. 5` — because a 17rem column has no room for
  the words. The Compendium numbers its twelve chapters straight through three parts, so
  Chapter Five is the FIRST child of Part Two and read `Ch. 1`, with its six siblings
  numbered 2 to 7 in a table of contents. Position is the right basis wherever a part
  restarts its chapter numbering (Gaudium et Spes does) and the wrong one wherever it does
  not, and nothing in a document's tree says which. So the caller that knows says so
  (`deriveMarkers={false}`) and the label prints as the source prints it: **a long label is
  a cost, a wrong number is a lie.**

**The parts' epigraphs were in the corpus all along, at the end of the wrong paragraph.**
The source prints `PART TWO`, a quotation from Centesimus Annus, then `CHAPTER FIVE`.
`reclaim_mid_body_prose` hands prose buffered under a heading back to the section that
heading interrupted — the right rule for an encyclical's mid-paragraph subheading, and the
wrong one here — so §19, §208 and §520 each ended with the NEXT part's epigraph as their
closing sentence, in every edition, and nothing could have reported it: the text was
present, the round trip was clean, and only reading the page shows it. What recovers it is
a count rather than a pattern: a numbered paragraph of this work is exactly one block, and
those three sections were the only ones in nine of ten editions with more. The markup
could not have decided it — `align="right"` covers the whole quotation in English, the
attribution alone in Hungarian, and nothing at all in Polish.

**A heading's `level` is not a fact about the work, and one sidebar per edition is what
trusting it costs (2026-09-03).** `level` is read off how a page paints a heading, and this
work's ten editions are ten differently painted pages: the twelve chapters sit at level 2
in English, level 1 in Portuguese, and in Hungarian, Swahili and Vietnamese at no level
that isolates them at all. `sync-corpus.mjs` had already measured exactly this — it is why
the division anchors are unioned across editions rather than read from one outline — and
the outline itself was still handed the printed levels. `buildDocumentOutline` nests by
level, so a flat edition builds a flat tree: five of the ten came out with more than 35
top-level rows, 75 in `csdc.pt` and 97 in `csdc.hu`. **A root is always rendered**, since
the sidebar's collapse rule is that a row's children appear when the reader is inside it,
so an outline whose every row is a root has nothing to collapse — the Portuguese reader got
all twelve chapters and every roman-numeral section inside them, permanently open, and the
chapter page's inner headings vanished besides (they are selected by depth, and everything
was at depth 0). The fix re-levels the rows onto the anchors before the tree is built
(`levelSocialDoctrineRows`): the rows above a division's own heading are the part standing
over it, the labelled row at the anchor is the division — the same choice
`socialDoctrineDivisions` makes when it names one — and everything else keeps the edition's
own relative depth below it. Every edition renders 3 to 13 roots now, and each of them
collapses. **Where the editions disagree about how a text is
painted, derive the structure from what they agree it SAYS** — here, which paragraph each
division opens at, which is identical in all ten because they are translations of one
numbered text.

**The reference coverage fell in two families and the fall is the fix.** `vatii` prose
scripture 6,995 → 5,896, prose sigla 950 → 847 — against citations 6,626 → 9,998 and
linkable citations 3,046 → 5,114. The references did not go anywhere: they moved out of
`linkifyProse`, which scans running text because an edition with no footnote apparatus has
nowhere else to keep its sources, and into the apparatus, where `parseRefs` attaches each
one to the marker that raises it. Net +866 linked references in `vatii`, +422 in
`encyclical`, +40 in `exhortation`. The general rule the preflight gate encodes still
holds and is not weakened by this: **a coverage drop is a question, and the answer is only
ever "accept" when the citation column has risen to meet it.**

### The doctrinal office, and the first family whose selection is an argument

Taken in on 2026-09-03: 25 documents of the Congregation — now Dicastery — for the
Doctrine of the Faith, 200 editions in seventeen languages, as `cdf.*`
(`pipeline/scrapers/vatican_docs.py` phase 3). The fourth family that scraper carries,
and the first where deciding WHICH documents to hold was most of the work.

**The index is complete and that is the problem.** Vatican II is sixteen documents and a
pontiff's encyclical index is the Holy See's own list of what he wrote, so for the first
three families "discover" and "publish" were the same verb. The Dicastery's "Complete List
of Documents" is 239 documents spanning 1962 to 2026, and most of them are notifications
about one named theologian's book, rescripts, communiqués, letters about a single shrine
and procedural decrees. Publishing all of it is not the same decision as publishing every
encyclical, and no rule inside the scraper could make it one.

**So the corpus was asked what it refers to.** Every citation string in `build/` — 119,321
of them across 1,480 editions — was searched for the Congregation and the Holy Office;
1,121 name one of them (exhortation 357, encyclical 348, csdc 252, ccc 122, vatii 40). The
25 documents in `CDF_DOCUMENTS` carry about 840 of those, and every one is cited **by
paragraph number** (`CDF, instruction, Libertatis conscientia 13.`), which is what makes a
document a link target rather than a mention. The notifications carry **none** — not few:
Schillebeeckx, Boff, Curran, Dupuis, Balasuriya, Küng, Pohier, Guindon, Gramick/Nugent, de
Mello, Vidal, Messner, _Anglicanorum coetibus_, Medjugorje and Gisella Cardia were each
searched for by name across every citation in the corpus and found zero times. (Two
apparent hits were the Latvian vocative _Kungs_ in `gaudete-et-exsultate.lv` and the poet
Thiago de Mello in `querida-amazonia.de`.) The criterion is the one
`docs/link-surface.md` already sets for everything else; what is new is that it had to be
MEASURED before the family could be scoped, rather than read off an index.

**The corpus slug is the incipit, because here the filename names the subject.** Every
other family in this scraper is filed under its document's own first words, which is why
`document_title` manufactures a title from the slug and `SLUG_TITLES` holds the
twenty-two exceptions. This office inverts the habit: `freedom-liberation` is _Libertatis
Conscientia_, `eutanasia` is _Iura et Bona_, `theologian-vocation` is _Donum Veritatis_.
Manufacturing from those produces a name no citation anywhere uses, so `CDF_DOCUMENTS`
assigns the slug as well as the title — the incipit where there is one, an English
description for the four documents that have none. **The table is keyed by (date, source
slug) and not by slug**, because `homosexual-persons` is two documents: the 1986
pastoral-care letter and a 1992 set of considerations on legislative proposals.

**Reading an index is not reading a page, and the difference cost three hours.** The
index was first read through a Markdown extractor, which dropped roughly half of it — and
the half it dropped included the 2002 doctrinal note on political life, the second
most-cited CDF document in this corpus at 96 citations. That produced a confident,
well-evidenced and wrong finding ("the Complete List is not complete"), a table of
hardcoded URLs to work around it, and a note in this file explaining the Holy See's
editorial lapse. The scraper's own fetch of the raw page found all 239 documents and every
one of the five supposedly-missing ones. **A cleaned rendering of a page is evidence about
the rendering.** The scraper reads `raw/`, so the scraper is what should have been asked
first, and the code that caught it was the one line written to report the case the table
was for: `on the index after all -- drop its CDF_OFF_INDEX entry`.

**Three page conventions were new, and two of them were corpus-wide bugs wearing a new
family's clothes.**

- **Word writes `_edn`/`_ednref` when the author used endnotes rather than footnotes.**
  Same export, same pairing, three letters different, and every regex in this scraper read
  only `_ftn` — so those pages matched no marker template, found no definition anchor, and
  fell through to the `(N)` fallback. 47 raw pages are in that state and only 10 are CDF:
  aliasing the two gave **39 works a footnote apparatus they did not have**, including
  _Caritas in Veritate_ in eight languages at once (0 → 159 citations each) and
  `ecclesia-in-asia.es` (0 → 239). It also cost `sacramentum-caritatis.ru` nineteen
  citations, which is the fix working: the page has exactly 256 endnote definitions and
  256 references, and 275 was the fallback counting numbers that were not markers.
- **A footnote list can announce itself only by the numbering restarting.** Eight Polish
  editions print their notes as `N.&nbsp;text` with no heading, no anchor and no `<hr>`
  anywhere on the page — the one label shape `find_footnote_run_start` could not read,
  because it is also how every numbered paragraph in this corpus opens. Two guards make it
  readable and neither is optional: the run must be a RESTART (the page's first run of
  `N.` is its own body, and taking it would cut every document at its own paragraph 1),
  and **the markers must corroborate it** — 90% of the run's numbers must already appear
  as inline markers above it, which a body part that restarts its own numbering cannot
  satisfy. Measured over all 1,611 works this scraper owns: 16 changed, zero regressed,
  and two were pre-existing defects elsewhere — `nostra-aetate.he` went from 15 sections
  and no resolved citations to 5 and all 15, and `quas-primas.fr` stopped shipping its
  footnote list as ten extra sections.
- **`narrow_html` kept the HTML comments `strip_tags` drops.** `<!--` is not a tag to a
  regex that requires a letter after the `<`, so Word's `<!--[if !supportFootnotes]-->`
  wrappers survived narrowing as escaped text and came back out of `html_to_text` as
  literal markup in the reader's prose. The round-trip check caught it on fifteen editions
  the day the family landed; the encyclicals had never shown it because their export path
  emits no conditional comments.

**`lt` is Latin here and `lit` is Lithuanian — 73 links against five.** Third family to
spring that trap (`ccc.py` documents it for `catechism_lt`, `VATII_LANG_FROM_URL` for the
conciliar mirror) and the first where both readings are live on one index, which is what
makes it dangerous: a code map borrowed from anywhere else does not fail, it files
sixty-six Latin editions as Lithuanian and says nothing. The index also prints `la` once,
on a 1962 instruction, so the table cannot be inferred from a sample either.

**Seven editions of 200 are withheld, each with the measurement that put it there**
(`site/unpublished.json`). Two signatures, both cross-edition: text loss against the
median edition of the same document (`inter-insigniores.pl` stores 4,855 characters
against 32,092), and addresses that are wrong while the text is whole — one section
holding most of the document where every other edition captured nine (`donum-vitae.it`,
`.la`), or a footnote list read as 51 further sections (`donum-vitae.pl`). **The
signature has to be conjunctive**: one section holding half a document's text is not a
defect where every edition agrees the document has three sections, and a first pass at
this flagged all eight editions of _Iura et Bona_ and all seven of _Samaritanus Bonus_ for
being short documents.

**Two entries came OUT of that file in the same change.** `vatii.christus-dominus.cs` and
`vatii.sacrosanctum-concilium.cs` were switched off in August for capturing 9 sections with
§1 holding 59% and 64% of the text; they now capture 44 and 130, matching every sibling
edition, with the largest section at 8% and 3%. The file says its entries are expected to
be temporary and that the fix is to repair the parser and remove the entry — these had
been repaired by someone else's parser work and nothing re-read them.

**One siglum, not eleven.** `LC` now resolves to `cdf.libertatis-conscientia`; the other
24 documents get no row in `DOCUMENT_SIGLA_EN`. The rule that decided it is the one that
table already runs on — a siglum earns a row by appearing in a source's apparatus — and
the sources answer clearly: of the editions that print an abbreviation table at all
(`ccc.fr`'s 58 entries, `ccc.la`'s 119), **none lists a single CDF document**. This office
is cited in longhand, which is the `cdf instr.` residue bucket in
`scripts/reference-coverage.baseline.json`. Inventing two-letter sigla nobody prints would
not be neutral: `II` for _Inter Insigniores_ would claim every "Vatican II" in the corpus,
which is the trap `SS` is already kept out for.

**What is not held is reported by a command, not written down in a file.** `discover-cdf`
prints each held document annotated with the editions the corpus does not take, and
`--unselected` names the 214 documents it does not hold at all. A table of that residue in
`docs/research/` was the obvious alternative and is the wrong shape: this index gained six
documents in 2025 alone, so such a table is wrong by the next promulgation, silently, in a
file nothing re-reads — the rot CLAUDE.md's rule about inventory counts exists to prevent.
The instrument does not rot. Four gaps, four different decisions: 214 documents unselected
(not a backlog — the citation measurement is what to re-run, not the list); two Chinese
HTML editions of _Dignitas Infinita_ never fetched, because `DIVISIONS` has no Chinese and
a work tag would acquire two pages nothing can read; three Lithuanian editions in `raw/`
and not in `build/`, acquired and unparsed, which is exactly the split `--fetch-only`
exists for; and nine PDF-only editions across seven documents, on the terms `ccc.py` set
for Arabic and Chinese. **The first of those corrected a claim in the code**: Chinese was
left unmapped on the stated ground that this index only ever serves it as PDF, which is
true of three documents and false of the fourth.

## Process

**Shared code is decided by entitlement, not by identical bodies.** `apply_corrections`
moved because everything in it comes from above the edition — the drift guard, the
locator shape, the schema. `validate` did not, though it was byte-identical, because it
is exactly where an edition's claims about its own text live and is _expected_ to
diverge. Rate limits and decoding are the same category.

**The rule cuts the other way too, and `vatican_docs.py`'s three index-driven runners
are the case** (2026-09-03). `run_phase1`, `run_vati` and `run_phase3` were 85–94%
identical line-for-line once the family-specific names were normalised away, and six
lines apart in substance — but similarity was not the argument for merging them. The
argument is that all three families are **discovered from an index that names every
edition's URL**, so a run is fully determined before the first document is fetched and
there is nothing per-document to derive or probe. That is an entitlement shared from
above the family, and it is exactly what phase 2 does not have: it discovers per
pontificate, derives each translation's URL by substitution, and spends `--offered-only`
to avoid asking for editions that may not exist. Phase 2 stayed where it was. One
`IndexFamily` descriptor and one `run_family` now carry the three, and the four dispatch
sites adding the CDF had needed — `translation_url_for`'s membership tuple,
`url_lang_key`'s three branches, the lock's subcommand tuple, `main`'s branch per
family — are table lookups. A sixth family is a table entry and a `Stage` in
`rebuild.py`.

**What stayed duplicated is the point of the entry.** Two `family == "vati"` branches
sit inside the parser — the starred bibliographic line that ends Vatican I's footnote
block, and the hand-off to `walk_vatican_i` — and each carries a paragraph on why the
general rule reads those pages _wrongly_ rather than merely badly (§The First Vatican
Council). A descriptor field would have turned a documented exception into a
configuration flag, which is how the reason gets lost; the table carries only what a
family **is**, never how its pages are read.

**The prerequisite was a return type, and it was the whole obstacle.** Two of the five
`discover_*` functions returned `(refs, str | None)` — one error, no notes — and three
returned `(refs, list[str])`. That difference alone forced each runner to open with its
own error-handling preamble, which is what kept three otherwise-identical bodies apart.
Normalising it first, as its own commit with the corpus rebuilt byte-for-byte
unchanged, made the collapse a mechanical edit. **The correctness claim for both commits
is `rebuild.py --force` over the 1,615 works the scraper owns: 7,089 files, every
checksum identical, `0 wrote`.** One behaviour did change, deliberately and in the
direction of an existing guard: `--fetch-only` now exits 0 before `report_run` for all
three, where only phase 3 did. Phase 2 grew that guard the day a fetch-only run with
`--accept-baseline` wrote 3,678 `fetch-failed` rows into the floor; phase 1 and `vati`
had been one flag away from the same thing.

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

**The site's sync grew the same staleness check, and `predev` is the one caller that
takes it** (2026-09-01). `sync-corpus.mjs` wiped `src/lib/corpus-data/` and re-derived
all 8,431 files on every invocation — 13.3 s, paid by `predev` on every `npm run dev`,
for a corpus that during app work never moved. The mechanism is `pipeline/rebuild.py`'s,
deliberately rather than a second design: `code` (the script's real import closure, 21
files, read off its import statements and content-hashed), `dictionaries`, `editorial`,
`ledger`, `corpus` and `outputs`, in `site/scripts/.sync-corpus-state.json`, recorded
only where the run reaches its last line. The two large trees get `size:mtime_ns` and
the small hand-edited sets get content, for the reason `raw/` already had: hashing 460
MB costs more than the parse it saves, and erring toward an unnecessary run is the only
direction this may err in. Measured: 13.3 s to 0.27 s, and `npm run dev` to first
`ready` from ~15.3 s to 2.0 s.

**The entry above says `--changed-only` is opt-in and stays opt-in, and `predev` opts
in.** That is a departure and needs its argument on the record. The rule is about the
pipeline, where a stale parse is invisible and flows into everything downstream with
nothing to show it; this one fails in front of you, since its output is the page in the
browser, and the recovery is `--force`. What makes it safe is the split rather than the
reasoning: **`prebuild` does not pass the flag**, so no deploy can take a skip, and a
fingerprint that missed an input cannot reach a reader. `dictionaries` is a separate
part for the failure that would otherwise be silent — `readDictionaries` loads them with
a template-literal `import()` over `UI_LANGS`, which no walk of import statements
resolves, so folding it into `code` would keep serving a stale `route-titles.json` after
a translation was edited.

**A `size:mtime_ns` digest needs a bigint stat, and getting that wrong degrades it
silently.** `mtimeNs` exists only on `statSync(p, { bigint: true })`; on an ordinary
stat it is `undefined`, which hashes identically for every file and quietly reduces the
whole thing to a size-only check that misses any edit preserving a file's length. It was
written that way first, and what caught it was a test asserting the digest moves when
mtime moves — not any run of the real thing, which skipped and rebuilt exactly when it
looked like it should.

**HMR was measured and left alone, and the measurement is the point of this entry**
(2026-09-01). The dev loop's remaining complaint after `--changed-only` was edit-to-see
latency, and the answer turned out to be that HMR is not slow — it is _absent_ for half
the files being edited. Measured by connecting to the dev server's HMR websocket as a
protocol client (`ws://localhost:5173`, subprotocol `vite-hmr`) and timing a write to
the payload it provokes, with the module graph first populated over HTTP the way a
browser populates it:

| edit                                      | payload         |
| ----------------------------------------- | --------------- |
| `components/Sidenote.svelte`              | update, 9 ms    |
| `components/Icon.svelte`                  | update, 7 ms    |
| `scriptura/[book]/[chapter]/+page.svelte` | update, 40 ms   |
| `styles/base.css`                         | update, 1 ms    |
| `i18n/pt.ts`                              | **full reload** |
| `corpus-index.ts`                         | **full reload** |

**A Svelte component is its own HMR boundary and a `.ts` module is not.** Vite walks up
the import graph looking for a module that called `import.meta.hot.accept`; the Svelte
plugin injects one into every component, and there are **zero** such calls anywhere in
`src/`, so an edit to any plain module walks to the root unaccepted and reloads the
page. That is the whole mechanism, and it is not a misconfiguration.

**The obvious fix is wrong in a way worth writing down.** A bare
`import.meta.hot.accept()` in `i18n.svelte.ts` does stop the reload — by re-executing
the module, which builds a new `loaded = $state({ en })` proxy while every rendered
component still holds the old one. The page then keeps showing the old strings with
nothing saying so: an edit that appears to do nothing, which is worse than the reload it
replaced. The shape that would work keeps the module's identity and assigns into the
ORIGINAL proxy, which is what components are already reactive to — and cannot use
`hot.accept(deps, cb)` to do it, because that takes static specifiers and the
dictionaries arrive through `import.meta.glob`.

**Not doing it, and the conditions are recorded rather than the refusal.** It is the
largest single bucket — `src/lib/i18n/*.ts` took 480 file-touches over 43 commits spread
across 8 separate days, so it is a standing pattern and not the one-sitting dictionary
expansion — but it is 480 of ~876 reload-causing touches, and the other 396
(`corpus.ts` 55, `types.ts` 37, `corpus-index.ts` 26, `refs-grammar.ts` 21) hold real
module state and would each need their own state-transfer answer. Against that: it adds
a silent-staleness mode to a project whose documentation exists to prevent them, it
would be the first `import.meta.hot` here and so the pattern others copy, and it cannot
be unit-tested — there is no component harness, and HMR is a property of a running
server. It is worth revisiting only with both mitigations: the handler falling back to
`location.reload()` on any error, so the worst case degrades to today, and the websocket
probe checked in as its guard, so a Vite upgrade that changes propagation does not
silently restore full reloads. Note also that 213 of the `src/lib` touches were
`.test.ts` files, which never reach the dev server at all.

**A DEP REACHED ONLY BY A DYNAMIC IMPORT IS PINNED IN `optimizeDeps.include`, AND THE
ONE THAT WAS NOT COST A MISDIAGNOSIS** (2026-09-02). `JumpBox.svelte` loads `fuzzysort`
with `await import('fuzzysort')`, on purpose — it is 7.5 KB the layout should not pay for
— and Vite's dep scanner does not see it. So it is discovered while the page is already
loading: Vite pre-bundles it then, rewrites `node_modules/.vite/deps/` under fresh
hashes, and forces a reload. Requests still in flight against the old names 404, and the
dev server prints `Pre-transform error: The file does not exist at
.../node_modules/.vite/deps/<name>-<hash>.js`. Reproduced from cold in one page load:
`dependency optimized: fuzzysort`, then `optimized dependencies changed. reloading`.
Against the graph two entries up — 411 modules, 18.78 MB, most of it sourcemap — a
forced reload is long enough for the swap to tear the module graph rather than merely
delay it, which is what "the site goes into a broken state after some changes" was.

**The lesson is not the pin, it is which cache was suspected.** The same error string was
read the day before as a service worker serving a stale shell, and `vite dev` was made to
register none (`serviceWorker.register` keyed off `command`); it was reverted on
2026-09-02 having fixed nothing, because the person reporting it had a worker installed
from before the change and `register: false` does not evict one — the change could only
ever have helped a profile that never had the problem. It also lost the one property
worth keeping, which is that dev and production run the same registration path. The
worker IS a real hazard here — `service-worker.ts`'s `fetch` handler is cache-first on
the shell and `navigate` can hand back a document captured in an earlier session — and
that is exactly what made the wrong answer plausible. **Both caches produce a stale
answer; only one of them is on this machine's disk.** Settle it by deleting the server's:
`rm -rf node_modules/.vite`, load one page, read the log. If the two optimizer lines
appear, no browser was involved. The earlier report claimed the symptom survived that
deletion, which — now that the mechanism is understood — it cannot, since the deletion is
what provokes the re-optimization; the observation was of a second cold start, not of a
cache that had been left alone.

**AND THEN THE OTHER CACHE TURNED OUT TO BE REAL AS WELL** (2026-09-02, same day, later).
With the pin in place the dev server no longer re-optimizes — checked the way the entry
above prescribes, from cold, crawling the whole 464-module client graph over HTTP: no
`dependency optimized:` line, no `optimized dependencies changed. reloading`. The
complaint survived it, and grew a second half that the optimizer cannot produce at all —
_"often the changed content doesn't show, so I close the tab and restart the server."_
That is a browser cache being described, and this time it was.

**The service worker's design rests on two premises a build satisfies and `vite dev`
does not.** Neither is a bug in the worker; both are it being right about a build and
running somewhere else:

- **Content URLs are content-hashed**, which is the entire licence for
  `cacheFirstAndStore` to keep a file forever without revalidating — a changed file is a
  different URL. In dev they are plain paths (`/src/lib/corpus-data/…`, from
  `content-urls.dev.ts`, which exists because the real glob costs 2,590 module requests)
  and `CONTENT_CACHE` is unversioned. So the first read of a corpus file pins those bytes
  to that path permanently: re-run `sync-corpus` and the browser serves the old text, and
  restarting the dev server does **not** help, because nothing sweeps that cache but a
  `CLEAR_CONTENT` message or clearing site data by hand. This is the half that reads as
  "often".
- **`version` changes per deploy**, so `SHELL_CACHE` turns over and `activate` sweeps the
  old one. In dev it changes per dev-server PROCESS — `buildId()` carries the minute — and
  the shell precache includes `/` itself, the one document every address is served from.
  Between restarts the boot document comes cache-first out of a snapshot. This is the half
  that reads as "restart the server", and it is why the restart looked like it was fixing
  Vite.

**There is a third cost that is not staleness, and it is the one that answers "reloading
forever".** In dev the real worker's module graph is nine modules and **9.03 MB**, of
which 8.82 MB is `content-manifest.json` and its inline sourcemap (measured by crawling
`/service-worker.js` transitively). A service worker is stopped when idle and started
again on the next event, and a controlled page's requests wait behind that start. An edit
to any `.ts` module is a full reload (the HMR entry above), so that is paid again on every
edit. The dev twin's graph is two modules and 11.9 KB.

**The fix substitutes the MODULE, which is precisely what `register: false` could not
do.** `vite.config.ts`'s `glossa:dev-service-worker` resolves `src/service-worker.ts` to
`src/service-worker.dev.ts` under `apply: 'serve'` — a worker that registers no `fetch`
handler, never calls `clients.claim()`, and on `activate` deletes every `glossa-*` cache
and unregisters itself. SvelteKit's shim still registers `./service-worker.js` exactly as
it does in a build and `sw.svelte.ts` still wires itself up, so the eviction reaches the
profile that has the problem — the failure of the previous day's answer, which could only
help a profile that never had one. Registering no `fetch` handler is what makes the
interval between activation and the tab closing harmless; skipping `claim()` is what stops
a reload loop, since a page loaded after the unregistration is never controlled, never
fires `controllerchange`, and so is never reloaded by `#land()`. The one reload that does
happen is the handover from the real worker, which is the reload that shows the evicted
content fresh.

**Two things this deliberately does not do.** It does not touch `src/service-worker.ts`
with an `import.meta.env.DEV` branch — the file would still import the 8.8 MB manifest to
reach the branch, and the dev twin sits beside `content-urls.dev.ts` and `plate-urls.dev.ts`
under a rule the config already states. And it does not try to make the worker correct in
dev, which would mean inventing content hashes the dev server has no reason to produce.
`npm run preview` serves a build and is where the worker is exercised — as it already was
for the 2,590-module glob, which is the second time "preview is always fine" has been the
tell.

**73.8% OF EVERY BYTE THE DEV SERVER SENDS IS AN INLINE SOURCEMAP**, and three attempts
to turn that off all failed. The graph is 411 modules and 18.78 MB, of which 13.85 MB is
base64 `sourceMappingURL` payload; `content-manifest.json` alone is served as 8,552,054
bytes of which **7,062,454 (82.6%) is its map**, against 1,331,016 bytes on disk.
`refs-grammar.ts` is 68% map, `corpus.ts` 66%, SvelteKit's client runtime 81%. What did
not work, all reverted: a `enforce: 'post'` plugin returning `map: { mappings: '' }` for
corpus-data JSON (Vite composes the map across the whole transform chain, so one plugin
declining contributes nothing); `dev: { sourcemap: { js: false } }`; and
`environments: { client: { dev: { sourcemap: { js: false } } } }`. The option is real —
`DevEnvironmentOptions.sourcemap` in Vite 8's types — and marked `@experimental`; whether
SvelteKit overrides it or rolldown-vite has not wired it up is unresolved and is a
question for upstream's source rather than for guessing. `json: { stringify: false }` was
also measured and rejected: 8.55 MB to 6.91 MB, only 19%, and it would move the
production boot chunk as well as dev.

**Read that 73.8% as bytes and not as seconds.** A browser downloads an inline sourcemap
as part of the module text but does not parse it unless devtools is open, and this is all
over localhost. The browser-side reload cost was NOT measured — doing so needs a real
browser, which this project deliberately does not drive — so no claim about wall-clock is
made here. The server-side numbers above are the measured ones.

**A script that destroys its output before rebuilding it must invalidate the evidence
that the output is good, in the same breath.** `sync-corpus.mjs` wipes
`src/lib/corpus-data/` at the top and writes `corpus-routes.json`, `route-titles.json`,
`apparatus.json`, `works.json`, `sitemap.xml` and `reference-coverage.json` at six points
over the thousand lines that follow. Every gate between those two ends exits nonzero, and
until 2026-09-03 an exit there left the whole set behind, describing a corpus that was no
longer on disk. The failure that surfaced it was the content-size ceiling refusing 224
plate images: the tree kept `corpus-data/content/` with no `corpus-data/index/` beside
it — every manifest, TOC and xref table silently back on the bundled fixtures — under a
`corpus-routes.json` still naming 344 works. `npm run build` will not run after a failed
`prebuild`, but `vite build` by hand exits 0 and produces a normal-looking 9,412-file
build, and preflight approved it: the file it reads to tell a real corpus from fixtures
was the one file the failed run had not touched.

**The fix is to make the check's own input impossible to forge, not to add a check.** The
six files are cleared beside the wipe, so they exist only where a run wrote them over a
complete `corpus-data/` — and preflight's existing refusal for a missing manifest becomes
a refusal for an incomplete sync at no cost. Clearing at the wipe rather than in a
`process.on('exit')` handler is what makes it hold for a `kill -9` as well as an exit,
and the set was already named once in `syncFingerprint`'s `outputs`, which is the other
place that has to agree about what one run produces. `lastmod.json` is deliberately not in
it: it is committed, it is an input to the next run as much as an output of this one, and
clearing it would forget when every address was last revised rather than invalidate a
derivation.

**A local server that answers a question wrongly is worse than one that refuses to
answer it, and `vite preview` had been the local server here for a year** (2026-09-03).
`npm run preview` serves `build/` as static files behind SvelteKit's SPA fallback.
`src/worker.ts` never runs, so nothing the edge owns is exercised — and the way it is
not exercised is a 200 that looks entirely normal. Measured against the same build,
side by side: `/catechismus/999999` is a 404 through the worker and a **200 carrying
the application shell** through preview; `/scriptura/josh/1` is a 301 to the Latin slug
through the worker and a 200 through preview; a Bible chapter's `<title>` is
`Joshua 1 — Glossa Catholica` through the worker and the un-rewritten
`Glossa Catholica` through preview. `_headers` is read by one and not the other. So
the entire head-rewriting half of the site (§The edge writes the head), the route
manifest's whole purpose, and the OSIS compatibility redirects were unverifiable
locally by the only command anyone ran — while presenting as working.

**`wrangler dev` was always available and simply had no script, which is the whole
reason it went unused.** It runs the real worker over `build/` with the asset binding,
local D1 for the beacon, and `_headers` parsed; it serves over `127.0.0.1`, a secure
context, so the real service worker installs exactly as it does in a deploy. It
therefore dominates `vite preview` on every axis except startup time, and `preview` is
kept only for that. `npm run preview:edge` is the bare form and
`npm run preview:deploy` is `npm run deploy` with the deploy removed — build,
preflight, serve — because neither server rebuilds, and a `build/` an hour old is the
ordinary way to spend an afternoon on a bug that was already fixed.

**None of this replaces `npm run dev`, and the temptation to let it is the trap worth
naming.** `requireIndex` throws under `import.meta.env.DEV` and only warns in a build,
and `npm test` cannot reach that class at all (§The site, the boot payload). A missing
index primer is therefore visible in dev, a console warning in `preview:edge`, and
invisible in `vitest`. The build-and-serve loop answers "what does a reader get"; dev
answers "is this correct", and the two are not substitutes.

**A check that has never passed is not a check, and `npm run check` had never
passed** (2026-09-03). `svelte-check` reported 23 errors on a clean tree, which is why
nothing gated on it and why no aggregate "is this sound" script existed to put it in.
The 23 were in three files — 20 in `scripts/minify-build.mjs`, 2 in
`scripts/export-section-names.mjs`, and one stale `@ts-expect-error` in
`minify-build.test.ts` — against sixteen other `.mjs` scripts that are JSDoc-typed and
clean under the same `checkJs: true, strict: true`. So the convention was never in
question; two files had drifted out of it, and the noise made a real type error in real
source indistinguishable from the standing 23. **The fix is to type the two, never to
loosen the config**, which is the same argument `chunkSizeWarningLimit` got: a warning
that always fires stops being read, and the answer is to make it mean something rather
than to raise it until it is quiet. `html-minifier-terser` ships no types and got a
four-option `declare module` rather than `@types/html-minifier-terser`, because this
project passes four options and asserts about them, so a fifth added silently is worth
a compile error.

**`scripts/` is type-checked only where a test imports it**, which is worth knowing
before wondering why some `.mjs` files are annotated and others are not. The generated
`.svelte-kit/tsconfig.json` includes `../src/**` and `../vite.config.ts` and nothing
else, and its `include` cannot be extended from `tsconfig.json` — an `include` in an
extending config REPLACES the base's rather than merging, so restating it would mean
maintaining a copy of SvelteKit's list. The `.d.ts` therefore lives under `src/`.

**Three tests each named a different command as their fix, so the fix became one
command.** `book-forms.test.ts`, `versification-export.test.ts` and
`section-names.test.ts` fail when a committed JSON export falls behind the TypeScript
table it is derived from — `refs-grammar.ts`, `versification.ts`, the i18n dictionaries
— and each said `node scripts/export-<one>.mjs`. Editing the grammar does not tell you
which of the three went stale. `npm run export` runs all three; they are byte-identical
re-writes when nothing moved, so running the set costs nothing over running the right
one.

**The script table is the one part of this project with no compiler behind it, and now
it has a test instead.** Every composite in `package.json` is a string naming another
string: rename `build` and `prebuild`/`postbuild` stop running, with no error and no
warning — the corpus is not re-derived, the built HTML is not minified, and the build
exits 0. Five names begin with `pre` for reasons unrelated to hooks (`preview`,
`preview:edge`, `preview:deploy`, `preflight`, `prepare`), so a future script called
`view` or `flight` would silently acquire one. `src/lib/package-scripts.test.ts`
asserts both directions plus four more invariants, and each was mutation-tested when
written: six deliberate breakages, six failures. A guard that cannot fail is worse than
no guard, because it is also an assurance.

**`npm run build` deletes the corpus out from under `npm run dev`, and the dev server
reloads the page into the hole** (found 2026-09-03; the defect long predates the day).
`sync-corpus.mjs` opens by removing every entry under `src/lib/corpus-data/` and writes
~8,000 files back over ~13s, and `prebuild` runs it in FULL on purpose — a deploy always
derives from scratch. That directory is inside `src/`, which Vite watches, so the
ordinary two-terminal habit hands a running dev server an unlink storm across the files
its module graph is built on: `corpus-index.ts` globs `corpus-data/index/` eagerly and
`content-urls.dev.ts` imports `content-manifest.json` the same way. Vite invalidates
them and full-reloads INTO the half-written corpus, every index comes back empty,
`listBibleWorks()` returns `[]`, and `scriptura/[book]/[chapter]/+page.ts` answers a
perfectly good chapter with `error(404)`. The symptom is "Nothing at this address" at
every valid address, and nothing recovers it but restarting the server.

**`server.watch.ignored` is the fix, and it forfeits nothing that was promised.**
CLAUDE.md already states that `npm run dev` does not re-derive the corpus and that
picking up a re-sync means restarting it, so the directory was never a live input. The
eager globs resolve at transform time either way; the ignore only decides whether a
DELETION mid-flight may tear the page. It is deliberately not the whole answer — the six
derived files under `static/` are wiped in the same breath and are still watched — which
is why the two repairs below matter as much as this one.

**Three caches were confused for each other, and only one of them was ever the
problem.** `node_modules/.vite` is Vite's dependency pre-bundling cache, and clearing it
(`npm run dev:clean`) is the right answer to `Pre-transform error: … deps/<name>-<hash>.js`
and to nothing else. `CONTENT_CACHE` is the service worker's, which the dev twin now
drops on activate. The corpus wipe touches neither, which is why a `dev:clean` habit
never helped and why the failure read as unfixable.

**"Nothing at this address" was also the wrong sentence, and that is a separate bug with
a longer history.** `+error.svelte` discriminates on status — every deliberate refusal in
a `load` is `error(404, …)`, an unexpected throw is a 500 — and it sent EVERY non-404 to
`NotFound` whenever offline mode was off. So a dropped request told the reader their
address does not exist, about an address that does, and `NotFound` is built to send them
somewhere else: away from a page that was one retry from working. The file's own docblock
argues at length that answering a reader this way would be "a lie about their own
library", and then only guarded the offline case. There are three states now, the rule
lives in `error-view.ts` because nothing renders a component under `vitest`
(`environment: 'node'`), and `LoadFailed` carries the retry the way `NotDownloaded`
carries the switch. `invalidateAll()` rather than `location.reload()`: the shell,
the dictionaries and every index that DID arrive are already resident, so the retry costs
only what failed.

**A memoised rejection is how a transient failure becomes a permanent one, and this
project has now learned it twice.** `corpus.ts`'s `readContent` wrote the rule down for
the content tier — "a rejection kept in it makes the failure permanent for the life of
the page: every later route asking for the same book is handed the same dead promise
without ever trying again" — and the index tier, added on 2026-09-03, did not inherit it.
The consequence is strictly worse one level up: a content read that never retries costs
one text, while an index that never retries costs every address in that work type at
once. `retryable-once.ts` is that rule as a tested primitive rather than a comment
repeated in two places, and it is the reason the retry button can succeed at all.
