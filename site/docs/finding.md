# Finding something

Two surfaces: the jump box, which completes an address, and `/documenta`, which
filters a shelf. Neither is a full-text search.

## The jump box

**It suggests over the sitemap's address space, not over a search index.** It
was a parser with a field in front of it — type a finished citation, press
Enter, be told "no match" — which serves a reader who already knows the
address, where three quarters of the corpus has no address anyone would type.
`suggest.ts` enumerates what a fragment could become, from the same places
`sitemap.mjs` enumerates, and reads the index tier only, so a keystroke costs
no fetch and the box works offline.

**It completes in the reader's own notation, sharing the parser's tables rather
than copying them**, because a form the suggester completes and the parser then
fails to resolve would offer an address that does not exist. What this cannot
fix is a table with no full book names in it, so a French reader completes
`Jn 3` and not `Jean 3` — inventing the missing names is exactly the
hand-maintenance derivation exists to avoid.

**A suggester has a list, so divergent numbering is offered rather than
guessed.** `Ps 23` is Psalm 22 in this corpus and Psalm 23 is also a real
address; `refparse.ts` has to pick one, and the box shows both, each labelled
by where it goes. **A completion of a divergent chapter is a DUAL citation**
(`Ps 22(23)`), because a plain one converts twice and would move the reader's
own chosen row down the list they picked it from.

**Tab completes, Enter goes, and a completion is an input rather than a
label.** A suggestion is usually a PREFIX of where the reader is going, so Tab
fills the field and leaves it open — and only with a row chosen, because Tab is
also the only keyboard way out of a modal. Every row states its own completion,
because label and grammar part company wherever the label reads better ("Summa
II-II, Q 184" parses as nothing); the round-trip is tested as a property over
every row, and it found three real defects.

**`suggest()` reads its language from its argument, never from the store.** A
function whose output half-follows its argument and half-follows a global is
one nobody can test.

**Loose matching is a dependency, and it is the site's second one.**
`fuzzysort` (MIT, zero deps, 7.5 KB gzipped) against ~70 lines of hand-rolled
scoring: the algorithm is textbook and the TUNING is not, and the tuning is
what decides whether a list of eight rows is useful. It is injected rather than
imported so it stays out of the boot chunk, and offline is not the casualty it
looks like, since a lazily imported chunk is an ordinary build asset.

**Fuzzy sits in one band below every literal reading, and may not stack a guess
on a guess.** It adds rows and never reorders the ones something actually read.
`ctechism 27` offers the Catechism and not paragraph 27, because which work was
meant and what the digits are would be two guesses; and `exactReference`
declines a misspelled book rather than demoting it, since a guess with a range
attached is a guess wearing a certainty.

**The threshold is 0.3, measured, not fuzzysort's default 0.5.** fuzzysort
penalises by target length and these names are long, so a real typo lands
between 0.33 and 0.39: swept over sixteen misspellings, 0.5 found four and 0.3
found fourteen with no literal row displaced, where 0.25 is where the lists
start filling with noise.

**Books get a SECOND matcher, because a transposition is not a weak subsequence
— it is none.** `fuzzysort.single('jonh', 'john')` returns `null`, and
transposing two letters is the commonest way to mistype a word one knows.
Bounded Optimal String Alignment over the book forms answers it in twenty lines
with no dependency. **Subsequence matching cannot read a transposition at any
threshold** — written down as a test rather than left as folklore, since the
next person to meet it will otherwise file it as a bug and tune the threshold,
which cannot fix it.

**The right letters in the wrong order outrank a wrong letter.** `jonh` is one
edit from Joshua, Jonah and John at once: the first two are reached by changing
a letter, which is also how one reaches a DIFFERENT book, where John is reached
by rearranging the letters actually typed. Same length and same multiset is the
whole test.

**The matched span is marked in the row, and re-derived rather than carried.**
A row shows an address as the reader's own language spells it, so
`highlight.ts` matches the LABEL rather than reusing what `suggest.ts` matched
— a span in a form the reader cannot see is nothing to draw. The consequence is
stated rather than papered over: `lg` reaching "Lumen Gentium" carries no mark
at all. A one-LETTER token must be a whole word and a one-DIGIT token need not,
since a digit is an address whose typed prefix is exactly why the row is there.

## `/documenta` is a filtered list, not a table of contents

It grouped 272 documents into twelve collapsible pontificates with a sidebar of
anchors — the right shape for the sixteen Vatican II texts it was written for.
What an anchor list cannot express is the question a reader arrives with, which
is rarely "what did Leo XIII write" alone but some conjunction of who wrote it,
what kind it is, and what it is about.

**Across facets the values are AND-ed; within one it depends on the field's
arity.** A document has exactly one author and one kind, so AND-ing two of
either is an empty list by construction and the only reading a second choice
can carry is "and these as well". A subject is multi-valued, so _peace_ and
then _poverty_ has an obvious second reading — and between "31 ∪ 25" and "9 ∩",
only one is narrowing, which is the whole reason the panel replaced an anchor
list.

**So the counts come from two pools, and the difference is not an
inconsistency.** An author is counted against the OTHER facets, since counting
against the fully filtered set would show 0 beside every unselected author —
true, and useless. A subject is counted against everything, itself included,
because it AND-s: its number is exactly what survives the click. **A term
reading 34 that yields 2 on click is a lie the reader can see.**

**A subject that reaches 0 is dropped, not greyed out**, because one selection
zeroes most of a 58-term vocabulary and the dead rows would hide the ones that
still narrow. A selected term counts as live whatever its number, so filtering
can never make a filter unreachable.

**The filters are not in the URL, and that is a decision rather than an
omission.** Nothing in this app reads or writes the client-side URL, and a
shareable `?auctor=` would be the first query string in the system and would
want modelling in the worker, the sitemap, the route manifest and the beacon.
**A filter here is a way of looking at one page, not a place.**

**The panel is rendered twice**, in the aside and in a `<details>` below the
list, which is why its options are `aria-pressed` buttons rather than
checkboxes: two instances of a checkbox facet are two elements claiming one
`id`, and a `<label for>` then points at whichever the parser saw first.

**The author facet prints each pontificate's years, from a table and not from
the documents.** Twelve regnal names in reverse-chronological order asks the
reader to know the modern papacy by heart; `Leo XIII 1878–1903` places itself.
Deriving the span from the corpus is the obvious source and is **wrong in a way
that looks right** — first and last `promulgated` gives Leo XIII as 1878–1902,
short by the years in which he wrote nothing this corpus holds. A pontificate
is a fact about the world, so `pontificates.ts` is a table and the corpus
CHECKS it: every author's document span must fall inside its reign. The lookup
is `Object.hasOwn`, because the key is corpus data and a bare index answers for
`constructor`.

**The subject vocabulary is CLOSED, and it was open for exactly one day.** 232
free-form terms were useless at both ends: 46 carried one document each, where
a facet row that narrows 272 documents to one is a worse way of reaching it
than its own title, while the head held terms that partitioned nothing —
`centenary` says what OCCASIONED a document rather than what it treats, and
`Vatican II` restates the facets directly above it.

**Frequency is not the test; what the term names is.** `errors condemned` (37)
went and `Church and State` (42) stayed, because nearly every magisterial text
rejects something and the measurable form of that is a FLAT co-occurrence
profile, where `Church and State` concentrates. What took its place is the
errors themselves, derived by scanning the descriptions and then **reading
every hit**: `gnosticism` scored 3 and is 1, because two hits were the string
`agnosticism`. **Counting a word proposes a candidate; reading the sentence
decides it.**

**The 35 region names were the closest call.** `Mexico` and `Hungary` are real
subjects a reader wants; they are dropped from the FACET and not from the site,
since every one is in the description the search box reads. That is the whole
argument for cutting hard — a facet row is for BROWSING an axis.

**Merging one term into another is a semantic act and it is easy to get
wrong.** Four merges were right about the commonest document carrying the term
and wrong about the rest: `technology` into `ecology` filed the
artificial-intelligence encyclical under ecology. Check a merge against every
document it touches rather than against the archetype.

**The closed vocabulary still does not translate.** Every coinage would be
thirty-four inventions rather than thirty-four lookups, and an i18n key each
would be near two thousand strings nobody has asked for.

**Three things about that file fail the sync rather than warning**: a tag
outside the vocabulary (a synonym splits a term's documents in two with neither
half findable), a slug naming no document in the build (a filter offering one
fewer term looks exactly like a corpus holding one fewer document), and two
terms differing only in case.

**The subject facet is a tag cloud, which is what retired the truncation.** 58
stacked rows is ~1,390px in a 17rem aside; flowing them inline and saying each
one's weight with its type size fits the whole vocabulary in ~480px. The
measurements that decided the shape:

- **Size follows the LIVE count**, so the cloud pictures what is left, and
  **alphabetical order is what pays for the reflow** — widths move, the
  sequence never does.
- **The scale renormalises against the current extremes**, over positive counts
  only: pinning it to the unfiltered range collapses every chip to the floor
  after one click, and letting a 0 set the minimum silently inflates every
  other chip.
- **Square root**, pinned by a test: linear crowds half the vocabulary into the
  bottom third and log over-expands the low end.
- **The size range is a balance knob, not a compactness one** — sweeping it
  moves the cloud's height by ~185px, because chip COUNT dominates. So the
  ceiling is chosen by what the cloud sits beside, and only the top is
  adjustable, since the CSS clamps to `--font-size-min`.
- **Colour carries the weight as well**, mixed from the same one number so the
  two channels cannot drift apart, and between two tokens rather than toward a
  literal black, since in dark mode `--color-text` is the light one.

**The search box is what made the cut safe, and it is one function with the
highlighter.** `matchesQuery` shares `highlight`'s fold and tiers, **so a
document is on the results list exactly when the highlighter has something to
mark on it** — every row can show why it is a row, and a matcher written
separately would drift invisibly in the direction that matters. It AND-s its
tokens where `highlight` ORs them, because marking is generous and filtering is
strict.

**The tags ship as one fetched file and not in the boot index**: the index
every reader downloads before first paint answers "does this address exist",
and a tag answers neither existence nor address. Nor are they merged onto the
manifests, which would write the same strings into all ten editions of Laudato
Si'.
