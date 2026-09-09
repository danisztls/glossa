# Topics: reaching the reader who has no address

`/quaestiones` and `/quaestiones/{slug}`. The site's first entry by subject
rather than by address, and the first surface built for the half of the audience
`docs/research/audiences.md` found the whole apparatus misses: the reader who
arrives with a question in words and meets a jump box that completes citations.

`site/quaestiones.json` is the tracked source and carries the format, the
checks, and the reasoning for each field. This file holds why the page is
shaped the way it is. `docs/research/topics.md` holds the selection pass — what
the topic set is, who each band is for, and what is deliberately held back.

## A topic is a doorway, not a subject

`document-tags.json` already holds subjects: 53 closed terms, browse axes over
documents, chosen so a facet row partitions the library. That is the wrong
instrument here and the difference is not one of granularity. **Nobody arrives
at a subject.** They arrive at _my father died_, or _is my first marriage still
binding_, and a page that lists subjects makes them translate their own sentence
into our vocabulary before it will answer.

So topics are grouped by **doorway** — what the reader was holding when they
typed — and the four are closed: the argument, the life event, the private
shame, the ordinary question. Three of the four are invisible to every survey of
religious opinion, because they are not controversies and nobody leaves a church
over them.

**The clearest case is that one subject is two topics.** As an argument abortion
is CCC 2270–2275; but `evangelium-vitae` 99 addresses, in the second person, a
woman who has had one, and she is not looking for the argument and will never
click a topic called "Abortion". Same corpus, same document, different door. Any
topic touching sin, failure or grief splits this way, and a subject list cannot
see the split.

## The passages are derived, not chosen

A topic anchors **spans of the Catechism**, and nothing else about it is a list
of passages. The Scripture comes out of those paragraphs' own footnotes, which
`ProseBlocks` linkifies wherever a unit is rendered — CCC 2357 carries
`Gen 19:1-29; Rom 1:24-27; 1 Cor 6:10; 1 Tim 1:10` and `CDF, Persona humana 8`
without anybody here deciding it should. Where the span is one of the
Catechism's own captured headings, the editorial act shrinks further: the topic
_is_ the heading, and "Chastity and homosexuality" is `[2357, 2359]` in
`structure.json`.

Two consequences worth keeping. A topic page renders the same paragraphs through
the same component as `/catechismus/{n}`, so it **cannot drift out of agreement
with the page it points at**. And a better parse of the Catechism's apparatus
improves every topic without anyone touching the topic file.

`documents` and `canons` carry what the footnotes cannot reach — a document
written after the Catechism, a procedure the Code holds and the Catechism only
names. They are additions to the derived set, never a replacement for it.

## `lead` is the judgment, and it is one field wide

The Catechism's order is systematic; a reader in trouble is not. CCC 2280–2283
opens on the gravity of suicide and closes on _"We should not despair of the
eternal salvation of persons who have taken their own lives"_ — and a bereaved
mother served those four paragraphs in printed order meets three she cannot bear
before the one she came for.

So a topic may name one paragraph to render first. **It reorders a span and
never trims one**, the page says so in the reader's own words whenever it has
done it, and the sync refuses a `lead` outside its own topic's spans — the one
defect here that is invisible on the page, because printed order looks exactly
like an ordering nobody wrote.

This is closer to editorialising than anything else on the site does, and it was
taken deliberately (2026-09-09, by direction) on the ground that **the
alternative is not neutrality**: printed order is itself an ordering, made by
someone else for a reader who is not this one. The disclosure is what keeps it
inside `docs/decisions.md` §Posture's rule that a gloss must never be
confusable with its source.

## What the route cost, and what it still owes

Adding an address kind is not a local change, and the type checker said so: a
new `Address` member failed the build in `shell-head.ts`, `citation-label.ts`
(twice) and `bookmarkContent.ts` (twice) plus seven route-manifest fixtures.
That is the design working. Two more were found by tests rather than types, and
both are the failure `route-manifest.ts` already documents:

- **`STATIC_PATHS`** — a route in neither table answers 404 to every cold load
  while client-side navigation into it works perfectly. `/quaestiones` is in the
  existence table and out of `CHROME_PATHS`, on the ordinary gate: its keys are
  English-only, and a 37-language cluster over English prose is the failure
  `/schola` and `/calendarium` each paid their whole key set to avoid.
- **The usage bucket** — an unlisted root lands in `other`, which is how
  `/doctrina-socialis` and `/ius-canonicum` each lost their first months. This
  is the one section whose series answers whether the question-holding half of
  the audience is reached at all, so it is bucketed from the day it lands.

What it owes: the `quaestiones.*` keys exist in English alone, so the route
stays out of `CHROME_PATHS` until the dictionaries carry them. A topic is not
offered for bookmarking yet, though the address supports it — `addressResolves`
answers `true` for a topic because the index tier deliberately does not carry
the topic list, and answering `false` would discard a reader's mark on every
topic at once.

## Adding a topic

The machinery is finished; what a second pass adds is judgment, three files at
a time. `docs/research/topics.md` holds the candidates and the blocklist.

**1. Find the anchor in the Catechism, and never write a paragraph number from
recollection.** The corpus is the oracle and answering takes one command:

```sh
# The Catechism's own headings, with the paragraph span of each — the best
# anchors there are, because a topic that IS a heading is barely editorial.
jq -r '[..|objects|select(.title?)|"\(.title)\t\(.paragraphs//"")"]|.[]' \
  "$CORPUS_DIR"/build/ccc.en/structure.json | grep -i <term>

# What a paragraph actually says, before claiming it answers anything.
jq -r '.[]|select(.n==2283)|.text' "$CORPUS_DIR"/build/ccc.en/paragraphs.json
```

A grep for the word is a candidate; reading the sentence is what decides it.
CCC 2283 carries the paragraph a bereaved reader needs and does not contain the
word "suicide" — it says "taken their own lives" — so a term search alone would
have missed the one anchor that topic exists for.

**2. Write the entry, and let the sync check it.** A wrong span, an unknown
canon, a renamed document slug or a drifted `lead` all fail the build with the
slug and the number, so there is no separate verification step:

```sh
CORPUS_DIR=… npm run build   # prints `Topics: N over 4 doorway(s)`
```

**3. Write the two strings.** `quaestiones.{slug}.title` and `.question` in
`src/lib/i18n/en.ts`, in that section's own register — the title is this site's
plain naming, the question is the reader's own sentence, and neither evaluates
or advises (`docs/writing-voice.md`). `quaestiones.test.ts` fails on a topic
missing either.

**4. Run the loop**: `npm run check`, `npm test`, `npm run preflight`. A topic
adds no route code, so a pass here is the whole of it — except the look, which
needs a browser and a person.

### Which doorway a candidate belongs to

`docs/research/topics.md` groups its candidates in lettered bands, which are
finer than the four doorways and do not map one-to-one. The mapping:

| Bands                                               | Doorway         |
| --------------------------------------------------- | --------------- |
| A, B, C, D, E, F, G (the arguing bands)             | `argument`      |
| the life-event table                                | `life-event`    |
| the private-shame table                             | `private-shame` |
| H, I, J, K (supernatural, practice, money, justice) | `ordinary`      |

**The doorway vocabulary stays closed at four.** A band is not a doorway: bands
name what a topic is about, doorways name what the reader was holding, and the
whole finding of the research pass is that only the second sorts a topic list
usefully. If a candidate fits no doorway, the question to ask is whether a
reader would really arrive at it — not whether to add a fifth.
