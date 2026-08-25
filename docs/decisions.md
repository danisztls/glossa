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
  four English answers were missing an entire enumeration.
- **Coverage** (`audit.py coverage`) — raw body text divided by what we stored. Crude and
  therefore hard to fool; it cannot say what was lost, only how much. It never legitimately
  reaches 100%, so a low band is a research lead and only a floor is gated.
- **Balance** (`audit.py balance`) — per-unit length against the sibling edition,
  normalized by the pair's own median. Run over the CCC, Compendium, prayers and Summa;
  deliberately **not** over documents (a section number is not the same section in both
  editions — `coverage` is the instrument there) or the Bible.
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

**A second transcription of the same printing is the only check that sees a hole.** It
is why `bible.matos-soares.pt` keeps liriocatolico's verses despite taking its apparatus
from vulgata.online: that transcription is missing 247 verses, and nothing but the
comparison could tell which of the two was short.

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

## Languages

**Content language follows UI language**, with a per-work-type override as the escape
hatch. One switch, fewer surprising states; the override sleeps and wakes on the UI
language it was made under.

**`UiLang` and `ContentLang` are two sets that happen to hold the same fourteen tags.**
They answer different questions — a content language arrives when someone ingests a text,
an interface language when someone writes a dictionary — and either will move alone: they
were equal at ten, separated when the Compendium's editions brought `hu`, `ro`, `sl` and
`sv` in with no dictionaries, and are equal again now that those four are written. **Do
not derive one from the other.** Use `isUiLang`/`UI_LANGS`, never a literal list.

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

**A bogus reference-shaped URL gets a 404, not the shell with a 200.** The host's
ordinary SPA fallback would make every mistyped citation look like a citable resource, on
a site whose whole point is citable deep links. `corpus-routes.json` is an address-only
manifest checked at the edge, generated from the same indexes the client uses.

**Offline is two cache tiers.** The content tier is unversioned and survives app updates
the way a downloaded book should; the shell tier is versioned and swept on activate. No
`skipWaiting()` — a reader mid-chapter should not have assets swapped under an open tab.

**Deploy guards measure the corpus, not the page count.** Preflight refuses a
fixture-sized build, and refuses a build whose reference coverage fell more than 3% below
the committed baseline in any family — every grammar regression so far was silent. A
deliberate drop is recorded with `npm run coverage:accept` and shows in the diff. There is
no CI; a deploy ships one person's working tree.

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
