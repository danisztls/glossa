# Counting the library

`/bibliotheca/census`, and the one derivation behind it. `scripts/census.mjs`
writes the numbers, `src/lib/census.ts` reads them back,
`scripts/language-coverage.mjs` gates the deploy on them, and
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
rule against inventory counts, one step further out: those rot in prose because
nothing recomputes them, and this page exists to be the place that recomputes
them. `censusFact` throws for a fact that is not there, so renaming one fails
the build rather than shipping the word `undefined` inside a published
sentence.

**A count is nobody's property, which is why the page may exist at all.** How
many editions of the Catechism this library holds is a fact about the library,
not about the Catechism. `scripts/apparatus.mjs`'s rule for what may be
published, unchanged.

## Every number is a fraction, or it is one of four

The page opened as a 37-row ledger and read as noise — correctly, and not
because 37 is many. **Every row answered "how many" and none answered "out of
what".** `Canons 1,752` is unanchored: a reader cannot tell whether it is good.
`The Code in 7 of 40 languages` is the same shape of fact and is immediately a
judgement. So the inventory went, the four scale figures that survive are one
sentence, and what replaced the table is the coverage matrix.

**An inventory says how big; a fraction says how far.** That is the editorial
rule for this page, and it is what to test a proposed row against.

**A shelf's numbers are a sentence, and the apparatus is why.** As six figures
under a total, four of them summed to a fifth of it and read as broken. They
were not: a cross-reference is an EDGE and those counts were its ENDPOINTS —
104,017 references run from 29,908 citing places to 25,843 cited addresses, and
the two endpoint totals never were parts of the first. Nothing on the list said
so. A column of figures can only invite arithmetic; a sentence can state a
relation, and `census.prose.apparatus` reads "from X places to Y addresses",
which cannot be added up wrongly.

**Every fact has a placeholder and every placeholder a fact**, asserted both
ways in `census.test.ts`. A fact with no placeholder is a number the build
still computes and no longer publishes — `llmsTxt`'s quiet failure one surface
over; a placeholder with no fact reaches a reader as the literal `{documents}`.
Neither can be seen by reading the output.

## The matrix

One row per work, one column per interface language, one cell per pair: how
much of what that work offers a reader of that language can reach.

**One grid and not eight figures.** Drawn per shelf beside each shelf's
sentence, the rows lose the only thing worth drawing them for — the comparison
DOWN a column. In one grid, sharing one language order and one scale, they fall
into a staircase and the page argues without a word.

**The language order is derived, not chosen** — the sum of each language's
eight fractions — because any hand-made order is an editorial claim about which
languages matter, which is what a page of measurements must not make. Ties
break on the tag, so a rebuild produces the same file.

**All forty languages stay in, including the ones that carry nothing.** The
empty tail is the finding: it is `PLAN.md` gap 15 drawn rather than argued, and
a matrix listing only the languages with something in them would be the page
flattering the library.

**A row per WORK, not per shelf**, and the Catechism is the one place the two
orders differ: its shelf holds two works whose language sets differ by five, so
a single row over their union would report a coverage neither work has.

**The cell is a rising bar, not a tint.** Fill is a geometric channel, so the
matrix survives `data-mono` — where the whole palette collapses to one grey —
with nothing lost. `site/docs/references.md` draws that line for the family
marks, and this is the case it was drawn for: here the fill IS the datum.

## The three decisions the rankings rest on

Each changes the answer, and each has a corpus condition behind it. All are
stated on the page above the tables, because a reader who meets them afterwards
has already read the tables wrongly.

**A ranking counts distinct citing places, not stored rows.** The index holds
one row per (citing address, cited address) pair, so a work citing
`Matt 25:31-46` lands on sixteen verses where one citing `Matt 25` lands on
one. Counted as stored, the most-cited chapter in the corpus is Matthew 25 —
a fact about how long the passages quoted from it are. Counted as citing
places, Matthew 25 is sixteenth, and Matthew 5, Romans 8 and John 1 lead.
`citerKey` is the identity, the same one the index was built with.

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
while the next one still fits, so a table comes out shorter than the limit
rather than arbitrary at the bottom — which is why neither the Catechism's
ranking nor the Summa's fills its twenty rows.

## Monitoring it

`scripts/language-coverage.mjs` writes `static/language-coverage.json` on every
sync, compares it against `scripts/language-coverage.baseline.json`, warns, and
`preflight-deploy.mjs` refuses the deploy on a loss. `npm run language:accept`
records an intended withdrawal as a diff.

**It guards a failure `reference-coverage.mjs` cannot see.** That one measures
the citations a work MAKES — how much of the printed apparatus the grammar
reads. This measures what a work OFFERS: whether a reader whose interface is
Portuguese has a Code of Canon Law at all. They fail independently.

**Nothing guarded it before.** `routeManifest` unions across editions, so
`/documenta/{slug}` stays a valid address while any language has it;
`workCount` is a scalar a swap leaves unchanged; and the census page draws
whatever it is given. A language could lose a work between two clean builds
with nothing said.

**The baseline is presence, not proportion**, and that is the whole design. It
records the SET of (work, language) pairs, never how much of each work a
language reaches. Recording the amounts would put a file in the tree that
churns on every ingest and needs accepting weekly — the exact noise a
regression has to stand out from. On presence it moves only when something real
happens, so the diff is worth reading.

**A set also catches a swap.** "8 languages" is still 8 after a build that
gained Polish and lost Portuguese, and the pair that went is the finding — so
the comparison is over pairs and the failure names them.

**A work missing from the report entirely reads as losing every language it
had**, which is the case that matters most: it is the failure the root
`CLAUDE.md` records for the lastmod ledger, where a `CORPUS_DIR` of symlinks
yielded zero works and two clean runs shipped an empty file.

**What it deliberately does NOT guard is completeness inside an edition** — an
edition present in a language but short of what its siblings carry. That was
measured when this was written and the corpus is sound at chapter, canon and
paragraph level; the documents carry a residue of 125 numbered editions under
90% of their fullest sibling, whose top is a handful of parse failures rather
than publishing facts. Recording it here would reopen the churn the presence
rule exists to avoid. The matrix SHOWS it as a partial bar, which is the right
place for it: information a reader can see, not a gate a build can trip on.

## Where it sits

**In `STATIC_PATHS` and not in `CHROME_PATHS`**, which is
`/calendarium/liturgia`'s arrangement and `route-manifest.ts`'s argument: it
must answer 200 to a cold load and a shared link, and it must not declare an
`hreflang` cluster in every interface language while its own `census.*` strings
are written in one. Its head is fixed and English in `STATIC_HEADS` for the
same reason, and `PLAN.md` sizes the promotion. `t()` falls back key by key, so
every interface renders it with its own chrome around English labels — and the
numbers need no dictionary.

**Eight of its ten names are keys the site already had.** A shelf here is a
shelf in `shelves.ts`, so it is named by whatever that shelf's own landing page
is titled by, and the citer breakdown reuses the nav keys the same way. Only
"The whole collection" and "The apparatus" name nothing on a shelf.

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
