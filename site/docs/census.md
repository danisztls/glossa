# Counting the library

`/bibliotheca/census`, and the one derivation behind it. `scripts/census.mjs`
writes the numbers, `src/lib/census.ts` reads them back, and
`site/docs/references.md` is where the cross-reference index they count comes
from.

**One derivation, because a count is right until somebody knows better.** Nine
of these numbers were already published — `llms.txt` interpolated them, off
`routeManifest`, `works` and `apparatus` separately — and each was correct. A
page that counted the same things from `corpus.ts` would be a second reading of
a corpus the first one had already read, and the first of the two to fall
behind would fall behind in silence, because nothing about a stale number looks
wrong. So `llmsFacts` projects the census now, and the file for machines and the
page for readers cannot disagree about how many documents there are.

**A number must be derived, or it does not go on the page.** The repo's own
documentation rule against inventory counts, one step further out: those rot in
prose because nothing recomputes them, and this page exists precisely to be the
place that recomputes them. `censusValue` throws for a row that is not there,
so renaming one fails the build rather than shipping the word `undefined`
inside a published sentence.

**A count is nobody's property, which is why the page may exist at all.** How
many editions of the Catechism this library holds is a fact about the library,
not about the Catechism. `scripts/apparatus.mjs`'s rule for what may be
published unchanged.

**Nothing in the file is a word.** A row is a key and a number, a ranked entry
is an address and a number, and the names are added on the page out of the
edition the reader has open — Matthew, Mateus or Matthaeus, because the row is
a link and labelling it in another edition's spelling would name a page the
reader is not being taken to. `citation-style.ts` argues that for a composed
citation; this is the same rule over the thing cited.

**A group with no rows is dropped, and the fixtures are why.** They carry three
Bible editions, two Catechisms and no Code at all. A `Canons — 0` row is this
page asserting the Church has no law when what is missing is a sync, so a row
is written only where the thing it counts is in the build, and a build with no
census at all says so in a sentence rather than drawing a table of zeroes.

## The three decisions the rankings rest on

Each changes the answer, and each has a corpus condition behind it. All three
are stated on the page in one sentence above the tables, because a reader who
meets them afterwards has already read the tables wrongly.

**A ranking counts distinct citing places, not stored rows.** The index holds
one row per (citing address, cited address) pair, so a work citing
`Matt 25:31-46` lands on sixteen verses where one citing `Matt 25` lands on
one. Counted as stored, the most-cited chapter in the corpus is Matthew 25 —
which is a fact about how long the passages quoted from it are. Counted as
citing places, Matthew 25 is sixteenth, and Matthew 5, Romans 8 and John 1
lead. `citerKey` is the identity, the same one the index was built with.

**An edition's own footnotes are not counted.** 41,842 of the corpus's
references are `annotation` against 47,855 of everything else, so a ranking
that counted them would report which verses Haydock glossed. The "Cited in"
panel starts commentary switched off on the same measurement
(`site/docs/references.md`); here it is left out rather than offered behind a
control, because a ranking has no per-row filter to fall back on and a number
that changes when a toggle moves is not a rank.

**A work citing itself is not counted either — the same rule one work in.**
Lumen Gentium §8 citing §22 is an internal cross-reference, and counting it
puts every long document at the top of a table about how often the rest of the
corpus cites it. The Summa is where it decides the outcome: all but a fifteenth
of its citers are the Summa, and dropping them turns a ranking of Thomas's own
back-references into a ranking of the questions the magisterium reaches for —
I q1, I q2, II-II q184.

**A ranking is cut on the count and never on the rank.** Thirteen Catechism
paragraphs are cited exactly three times, so a `slice(0, 20)` would publish
four of them and drop nine cited exactly as often. `topOf` takes whole bands
while the next one still fits, so the table comes out shorter than the limit
rather than arbitrary at the bottom — which is why neither the Catechism's
ranking nor the Summa's fills its twenty rows.

## Where it sits

**In `STATIC_PATHS` and not in `CHROME_PATHS`**, which is
`/calendarium/liturgia`'s arrangement and `route-manifest.ts`'s argument: it
must answer 200 to a cold load and a shared link, and it must not declare an
`hreflang` cluster in every interface language while its own `census.*` strings
are written in one. Its head is fixed and English in `STATIC_HEADS` for the
same reason. `t()` falls back key by key, so every interface renders it with
its own chrome around English labels — and the numbers need no dictionary.

**Seven of its nine group headings are keys the site already had.** A group
here is a shelf in `shelves.ts`, so it is headed by whatever that shelf's own
landing page is titled by, and the citer breakdown reuses the nav keys the same
way. Only "The whole collection" and "The apparatus" name nothing on a shelf.

**It is fetched as a URL, not inlined.** One page asks for it, and a count
answers neither "does this address exist" nor "where does the text live", which
is `corpus-index.ts`'s eager/lazy line. Under `_app/immutable/assets` as
`.json`, so `sw-policy.ts` files it in the deferred tier with the rest of the
citation apparatus — cached on first read, never precached.

**Its registries come from `indexesForPath`'s `ALL` fallback**, because
`bibliotheca` is in no entry of `BY_SEGMENT`. The rankings resolve a book name
and a document title from render, so they need the Bible and document indexes
— and `index-priming.test.ts` cannot see that, since it scans what a page
imports from `$lib/corpus` and these readers are one module further in, inside
`census.ts`. A narrow entry added on the strength of what `/bibliotheca`
renders (`manifests` alone) would empty three of the five rankings and throw
nothing.

**One line at the foot of `/bibliotheca` opens it, and it is not a card.** A
card would put it in the grid as though it were a work to read; it is a fact
about the shelf the cards sit on. It is not in the footer's index either: those
entries are wanted from every page, this one is about the catalogue and is one
click from it, and its label is English in a footer written in every language.
