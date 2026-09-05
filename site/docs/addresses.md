# Addresses and editions

The URL grammar, and how an address resolves to an edition. Written and read in
`src/lib/address.ts` and nowhere else.

## The grammar

**A canonical URL selects a reference; the reader's preference selects the
edition.** So every reader URL is edition-free and Latin, and does not vary
with interface language: `/scriptura/{osis}/{chapter}`, `/catechismus/{n}`,
`/catechismus/caput/{n}`, `/catechismus/compendium/{n}`, `/documenta/{slug}`,
`/doctores/summa/{part}/{question}`, `/preces/{slug}`, `/signata`, `/colophon`.
The English roots deliberately resolve as invalid.

**The book segment is Latin, and derived from the corpus rather than
invented.** `bible.clementina.la` carries its own Latin `name` for each of its
73 books; folding `æ` to `ae`, lowercasing and hyphenating gives 73 slugs with
no collisions (`BIBLE_BOOK_SLUGS`). The one departure is `J` → `I`, one
internal authority against another: the Clementine prints `Joannes` where
`BOOK_VARIANTS_LA`, corroborated against the Latin Catechism's printed sigla,
reads `Io`. **A name judged wrong is therefore a CORPUS defect**, fixed in
`pipeline/corrections/` and re-derived.

Where the corpus normalizes a title the normalized form wins — `i-reges` for
1 Kings rather than the Vulgate's _III Regum_. The Clementine's names follow
the MODERN division, so `i-samuel` and `i-reges` are unambiguous where I–IV
Regum would make `i-regum` mean 1 Samuel to one reader and 1 Kings to another.
**An address that needs a tradition to disambiguate it is not an address.**

**There is no compatibility layer, and the one exception is precise.** The rule
was paid in full twice, by the Compendium's move and the Summa's, each
knowingly dropping every reader's bookmarks. The OSIS spelling is 1,405
published addresses and the bulk of the sitemap, so it gets a `301` — and what
keeps the exception small is WHERE it lives: `parseHref` and `isCanonicalPath`
learn Latin and nothing else, so `/scriptura/josh/1` is not an address by any
reading. Two doormats know the old vocabulary, both running before the grammar
(`legacyBiblePath` in `src/worker.ts`, `migrateBibleHref` in
`bookmarks.svelte.ts`). **The compatibility layer is on the doormat, not in the
address space.**

**The edge redirect is gated on the TARGET existing**, which is why it reads
the route manifest first. Answering `/scriptura/gen/99` with a redirect to a
404 publishes a second dead address for every dead one.

**A canonical URL is written in `hrefFor` and nowhere else.** `StructureIndex`
and `StructureSidebarToc` took a base string and built `${base}/${n}`
themselves, which made five call sites into five more places the grammar was
spelled out — and moving the Compendium left four live 404s precisely there,
because a grep for the old prefix cannot see a URL assembled from a prop. Both
take the address as a function now.

**The route tree is that grammar and not a translation of it.** English
directories with Latin re-exports left `/ccc/1` answering 404 at the edge and
then rendering Catechism ¶1 anyway, because the client router still carried the
route. Eleven such routes existed, advertised by no sitemap and emitted by no
`hrefFor`.

**A moved work's `lastmod` entries are re-keyed, not left to expire**:
`<lastmod>` means "when the text last changed", and the text did not change.
The sync confirms it (`0 changed, 0 new, 0 withdrawn`), which is also the check
that the slug map is complete.

## Where a work is shelved

**The Compendium is addressed under the Catechism.** It is the _Compendium
Catechismi Catholicae Ecclesiae_, 598 questions over the same outline the
Catechism prints at length — which `toc-pairing.ts` verifies structurally
across all 18 editions. The rejected spelling was `/catechismus/cccc/{n}`:
`CCCC` is a siglum no edition prints, and the two differ by a repetition count
rather than a glyph.

**And the Compendium had no index of its own until 2026-09-04.** The argument
against one was that the Catechism's presents both works a row at a time, with
paragraph range and question range together, so a second page would be one
outline at two resolutions — the same page written twice, which they already
were, having drifted apart in their `<title>` tags.

**What that missed is that a table of DIVISIONS is not the only way in.** Parts
and sections are exactly right for a reader who knows the outline and wrong for
the reader the Compendium was written for, who arrives holding a question rather
than an address (`docs/research/audiences.md` §5). So the shortest, plainest
work in the corpus was the one reachable only by knowing a question's number,
and the site's whole answer to a reader without the vocabulary was a page whose
first column is the Catechism. The new page is not a second outline: it is
`CatechismIndex`'s existing ONE-COLUMN case — already written, because four
languages carry the Compendium and no Catechism — made reachable in every
language rather than only in the four that force it.

**The Social Doctrine is shelved under the Catechism too, and it moved three
times first** — beside the Magisterium, then under it, then here. An item that
will not sit still means the taxonomy is short an axis, and it was: the
_Compendium of the Social Doctrine_ is a compilation of magisterial documents by
ORIGIN, a systematic synthesis by FORM, and social teaching by SUBJECT, and one
shelf can encode one of those. **The shelf encodes form**, like every other one
here — Bible, Law and Prayers are all kinds of text — and on that axis the line
is synthesis against occasion: works that gather scattered teaching into an
ordered whole and are read THROUGH, against dated acts issued once and cited
SINGLY. The address space had already drawn it: `/doctrina-socialis/{n}` and
`/doctrina-socialis/caput/{n}` mirror the Catechism's two exactly, where the
Code is cited by canon and a document by section.

An earlier draft grouped it with the Magisterium on the ORIGIN axis, on the
evidence that exactly three work types carry `promulgated`,
`pontiff_or_council` and `document_kind` — `document`, `social-doctrine` and
`canon-law` — while every other type has all three null. That is true and worth
knowing; it is also an origin argument imported into a form-sorted shelf, and
mixing the two is what produced three different answers.

**The price is that two works are called "the Compendium", and it is paid in
copy.** Inside this shelf the _Compendium of the Social Doctrine_ is never
labelled bare "Compendium": every row prints its full title.

**The Summa is addressed under `/doctores`, a shelf for the Fathers and Doctors
of the Church.** It had been a fifth peer of Scripture, the Catechism, the
Magisterium and the prayers; those four are the Church's own texts and the
Summa is one Doctor writing about them.
`docs/research/copyright.md` §5's posture toward Church-owned texts explicitly
does not transfer to an eight-centuries-dead theologian whose modern
translators are ordinary commercial publishers.

Not `/patres` (which excludes Aquinas, a Doctor and not a Father) and not
`/traditio` (the elegant, wrong one: it labels a private theologian's writings
with the name of a source of revelation). `doctores` also has an established
translation in every interface language, which matters because `chromeNames`
does not fall back to English — a coined category would have meant
commissioning inventions rather than looking up terms.

**The nested spelling is what lets a second work onto the shelf.**
`/doctores` is a shelf like `/documenta` and `/doctores/summa` is a work index
like `/catechismus`; both are chrome, so both take every language prefix.

**The shelf is off the nav bar, and that is a separate decision from the move.**
The Summa awaits a quality pass and has no company, and it stays reachable by
address, by the jump box, by cross-reference and through the sitemap. This cuts
against the prayers' rule that "a corpus nobody can find from the nav is a
corpus nobody reads", and is meant to: the Summa is being held back
deliberately, not filed badly.

**`/bibliotheca` lists it anyway, and the argument does not reach that page.**
Being unlisted in a BAR is invisibility, because a bar has no room to say why;
on a catalogue the caveat can be a sentence beside the shelf. The two are not in
tension — one is a door and the other is the record of what is behind every
door.

**The usage beacon keeps `summa` as its own bucket and adds `doctores`**
(`usage-schema.ts`). A series that broke at the move would read as a collapse
in readership rather than a change of address.

## Two tables decide a URL, and a page needs both

**`STATIC_PATHS` is EXISTENCE and `CHROME_PATHS` is PUBLICATION.**
`isCanonicalPath` is the edge's only authority on whether a URL is a page at
all, and it reads both; the sitemap, the `hreflang` clusters and the per-page
`<head>` read only the second. They overlap almost entirely, which is exactly
how a page can fall through both.

**Two did.** `/calendarium` and `/ius-canonicum` each shipped with a route
directory, a `+page.svelte`, a nav entry and working navigation, and each
answered **404 with the app's own not-found UI** to every cold load and every
crawler from the day it landed. The SPA router never asks the worker, so a
reader who followed the nav saw the page and a reader who refreshed it, opened
it in a new tab or was sent the link did not — and every way a person would
check by hand is the first kind. `route-manifest.test.ts` walks `src/routes/`
now and fails on any static route directory neither table admits: **a list that
has to be remembered is the thing that failed, so the routes on disk are the
assertion.**

**A page joins `CHROME_PATHS` only when its own strings exist in every
interface language.** `route-titles.mjs` states the rule — a cluster whose
Portuguese member is described in English is worse than no cluster, because it
tells a search engine the page is Portuguese and then serves English — and two
pages are held out by it today. `/calendarium` is the purest chrome page on the
site, holding no corpus text at all, and its 44 `calendar.*` keys are written in
three dictionaries; `/catechismus/compendium` is described by
`compendium.landing.*`, which fourteen carry. Both are in `STATIC_PATHS`, so
both exist, answer 200 and are indexable at their bare address. Each is one line
plus a `CHROME_KEYS` entry on the day its strings are translated.

**So "should this be a chrome path" is two questions, not one**: is every word
on the page the interface, and is the interface actually written. The first was
always the test; the second is what the two omissions taught.

**`/schola` is the third page held out, and it is the one that shows the rule
is not a technicality.** The learning portal (2026-09-04) is addressed to the
reader with no vocabulary yet — `audiences.md` §5, who does not know the
Compendium is a shorter book — which is the reader least able to make anything
of an English page, so claiming it in 37 languages would be false exactly where
being false costs most. Its 19 `schola.*` keys are in `en`. What keeps that
bill small is that the page names no work, book or division in its own words:
every step of every route is titled from the corpus, already in the reader's
content language.

## Which edition a reader gets

**Written down, never derived from sort order.** `PREFERRED_EDITION` names it
per type and language, `DEFAULT_REGION` names the unmarked region, and a test
refuses two editions sharing a tag with no entry. An English reader got the
CPDV because `c` sorts before `d` — right by accident, one rename from
changing.

**An English reader gets the Douay-Rheims, and the argument was the apparatus
rather than the provenance.** The provenance was already on the record and was
not enough on its own. What decided it: **the CPDV carries no notes at all**,
so `commentariesAt` returned nothing and `ApparatusMenu`'s trigger did not
render — the reader who chose nothing was handed a bare text and no control
saying an apparatus existed, on a site named for the _Glossa Ordinaria_. The
Douay brings Challoner's 1,916 notes, his 1,307 chapter arguments and Haydock's
45,747, and the corpus already leaned on it in English anyway.

**The cost is the register, and it falls on the readers least able to afford
it.** Every `CONTENT_LANG_FALLBACK` row ends in `en, la` and only eight of the
interface languages have a Bible, so the English default is what most readers
meet, mostly as non-native English. Accepted because it is bounded: the CPDV is
one click away and the choice persists.

**The fallback chain resolves per address, not per work.** It has to, because
the Summa's two editions cover different parts — a citation to `Suppl q. 77`
must reach English even for a Latin-preferring reader.

**A bookmark is a canonical URL and a timestamp, nothing else.** Not the text,
not the edition it was read in. Resolving late is what makes it follow the
reader across an edition switch.

**An address, not a work, picks the edition** — the same rule that lets English
(UK) be five prayers while the collection's shape, order and prev/next chain
come from the 28-prayer English edition.

**So the edition MENU is address-scoped too.** `listEditions('prayer')` put
"English (UK)" in the picker on all twenty-eight prayers, where on twenty-three
it resolved straight back to `prayer.common.en` and left the trigger announcing
a wording the page was not printing. The menu lists the editions holding the
address in view; at a collection index that means "can enumerate the
collection" (`completeEditionTags`). **A menu row that changes nothing is worse
than an absent one**: it reads as a claim that a second English wording of the
Our Father exists.

**Provenance follows the address as well.** A prayer collection is assembled
from unrelated pages — eight for English — so a work-level `sources[0]` claimed
the Compendium's Appendix A under all twenty-eight prayers, wrongly for four of
them. Prayers carry their own `sources`, and the Rosary's groups carry the page
they were parsed from. An attribution the reader cannot check asks them to take
our word for it; one that sends them to the wrong page is worse than none.

## Commentaries

**A commentary is a work with no address, and the reader's preference selects
the apparatus.** Haydock wrote an apparatus ON the Douay-Rheims rather than a
translation of it: `HAY` ships footnotes and no verses, so every consumer of
`type: 'bible'` would be handed a text with nothing in it. It is its own work
type, its units name `{osis, chapter, verse}` of the work its manifest
`annotates`, and it contributes no route, no sitemap entry and nothing to
`route-titles.json`. `bible-intro` is the near precedent and stops one step
short: an introduction is chapter 0, which is an address.

**So the apparatus is a set and not a choice**, which is why it could not join
`content.svelte.ts` — every other edition-shaped preference resolves to exactly
one work. A reader can have Challoner's notes and Haydock's catena beside the
same verse, and that is the arrangement this site is named for.
`apparatus-prefs.svelte.ts` stores a set and the control is a panel of
`menuitemcheckbox` switches.

**The two defaults are opposite on purpose.** An edition's own notes are ON,
because the reader who chose the Douay chose Challoner's apparatus. A
commentary is OFF, because it is the largest body of text in the corpus and
switching it on is what causes it to be fetched at all. **What is stored is the
DIFFERENCE from the default and not the state**: store the state and a reader
who has never touched the panel is indistinguishable from one who switched
everything off, and the next work ingested arrives silently switched off for
the first of them.

**A second apparatus must not print the first one twice.** Haydock absorbed
1,399 of the Douay's 1,916 notes into his catena, 1,300 paragraphs signed
"Challoner" by name. That is a fact about the WORK, so it is stated in the
corpus (`CommentaryManifest.subsumes_notes`) rather than inferred, and the
interface turns ONE default around: enabling the commentary switches the
edition's own notes off. Nothing is suppressed — the overlap is 73%, so 517 of
Challoner's notes are only reachable that way, and the panel says why the
switch moved.

## A work type's reading surfaces

The Compendium of the Social Doctrine is `type: "social-doctrine"` — the
Catechism's addresses over a document's files (`docs/decisions.md` §Scope). Its
surfaces were built twice, and three decisions did not survive a reading of the
first result.

**An appendix page was the wrong answer to "this text has nowhere to go."** The
letter of transmittal and the presentation are real text in ten languages, and
that made an address for them look obligatory. It is not: a reader arriving at
a work numbered 1 to 583 is not arriving for two prefatory documents, and **a
page that exists because the data does is a page nothing links to.** The corpus
keeps them; the site does not ship them.

**Where a table of contents POINTS is a decision about what a reader is
doing.** Four surfaces answered it four ways. The rule (`socialDoctrineNav.ts`)
is that following an outline is going somewhere to READ, so every row lands in
the chapter at the heading it names, and the paragraph page is reached by its
number — which is the form a citation takes anyway. The index was first built
with TWO destinations per row, and that is one too many: a hundred rows of
choosing between them, two tab stops apiece, and a distinction nobody asked
for. One link per row, with the range stating how much of the book the row
covers — a fact about the row rather than a second place to go. The Catechism's
index keeps two chips, because it genuinely has two works.

**A derived number is a claim, and this work falsifies it.** The sidebar
abbreviates a printed division label to a short form whose number comes from
the row's position among its tree siblings, because a 17rem column has no room
for the words. The Compendium numbers its twelve chapters straight through
three parts, so Chapter Five is the FIRST child of Part Two and read `Ch. 1`.
Position is the right basis wherever a part restarts its chapter numbering
(Gaudium et Spes does) and the wrong one wherever it does not, and nothing in a
document's tree says which — so the caller that knows says so
(`deriveMarkers={false}`). **A long label is a cost, a wrong number is a lie.**

**A heading's `level` is not a fact about the work, and one sidebar per edition
is what trusting it costs.** `level` is read off how a page paints a heading,
and this work's ten editions are ten differently painted pages: the twelve
chapters sit at level 2 in English, level 1 in Portuguese, and in three others
at no level that isolates them at all. `buildDocumentOutline` nests by level,
so a flat edition builds a flat tree — five of the ten came out with more than
35 top-level rows. **A root is always rendered**, since the collapse rule is
that a row's children appear when the reader is inside it, so an outline whose
every row is a root has nothing to collapse. `levelSocialDoctrineRows`
re-levels the rows onto the anchors before the tree is built. **Where the
editions disagree about how a text is painted, derive the structure from what
they agree it SAYS** — here, which paragraph each division opens at, which is
identical in all ten because they are translations of one numbered text. The
sync had already measured exactly this, which is why the division anchors are
unioned across editions rather than read from one outline.
