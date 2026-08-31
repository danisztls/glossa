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
slot nobody filled — and `pipeline/parse-baseline.json` holds the 311 works those cannot
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
those globs are a partition of `build/`** — 1,447 works, each claimed by exactly one
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
`/catechismus/compendium/{n}`, `/documenta/{slug}`, `/doctores/summa/{part}/{question}`,
`/preces/{slug}`, `/signata`, `/colophon`. The English roots deliberately resolve as
invalid; there is no compatibility layer.

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
has an established translation in all fourteen interface languages, which matters because
`chromeNames` does not fall back to English — a coined category would have meant
commissioning fourteen inventions rather than looking up fourteen terms. The realistic
patristic ingest (Augustine, Jerome, Ambrose, Gregory, Chrysostom, Damascene) are all
Doctors as well as Fathers, so the name covers the shelf it will hold.

The nested spelling, `/doctores/summa/{part}/{question}`, rather than renaming the
existing prefix: the shelf and the work have to be different addresses, or the second work
on the shelf has nowhere to go. `/doctores` is a shelf like `/documenta`, and
`/doctores/summa` is a work index like `/catechismus`. Both are chrome — every word on
either is the interface — so both take the fourteen language prefixes, and
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
file holds 629 records and cost no requests. It is a separate script rather than a flag on
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
generated file, `static/route-titles.json` — 62 KB of **names**: book names, document
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
(12 KB, read only by `preflight-deploy.mjs`) had been precached since the partition
existed. Neither is fetched by anything that runs in a browser. `INFRASTRUCTURE_FILES` is
a third list beside `HOST_CONFIG_FILES` and `CRAWLER_FILES` because the reason differs
again: those are read by a stranger's machine, these by ours.

**The interface has addresses; the corpus does not** (2026-08-28). Seven pages now answer
under an interface-language prefix — `/pt/catechismus`, `/ar/summa`, `/la/preces` — and
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
one level down. It would also take 5,811 addresses to 81,368, force a `<sitemapindex>`,
and contradict the "canonical reader URLs do not vary with interface language" rule that
`hrefFor` exists to enforce. **The addressable-content-language question is untouched by
this** and remains where §Languages leaves it.

**Fifteen members per cluster, and every one of them declares the whole cluster.** Fourteen
prefixed pages plus the unprefixed path, which is `x-default`. The unprefixed path is not
"the English page" — it NEGOTIATES (`app.html`'s pre-paint block, then `I18nStore`), which
is a different claim, and `x-default` is the tag for exactly that. `/en/catechismus` exists
separately because pinning English is a different thing from negotiating and happening to
get it. Each member self-canonicalizes: a prefixed page canonicalizing to the bare path
would ask to be de-indexed, leaving a cluster of one and no purpose.

**Not one new translated string was written.** `CHROME_KEYS` in `scripts/route-titles.mjs`
maps each chrome page to keys the dictionaries already carry — `ccc.landing.title`,
`bible.landing.tagline`, `colophon.lede` — so the head a Portuguese searcher matches on is
the sentence the page then shows them. All fourteen dictionaries carry all seven, which a
test asserts. The home page is the one exception, having no tagline: its description is
composed from the five translated section names, which is both what the page is and what
someone searching for any of those works would type. Inventing a `meta.description` key
would have been thirteen sentences needing thirteen speakers, and CLAUDE.md's Malagasy note
records what happens when that is guessed at.

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
  term counts as live whatever its number, so filtering can never make a filter
  unreachable, and the order is the corpus-wide one throughout — options drop out, they
  never move past one another under the cursor.
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
  list could carry an i18n key each, the way `document_kind` does; that is 812 strings and
  nobody has asked for them. The terms render verbatim and only the panel is translated.

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
reading.** The interface is in fourteen languages, most of them European, which is the
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

## Scope

**In**: the Bible (four editions), the CCC, the Compendium, all encyclicals across all
pontificates, the 16 Vatican II documents, apostolic exhortations, the prayers, and the
Summa (EN + LA).

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
