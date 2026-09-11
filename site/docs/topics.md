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

A topic anchors **spans of numbered works** — the Catechism first and always —
and nothing about it is a list of passages. The Scripture comes out of those paragraphs' own footnotes, which
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

`csdc`, `canons` and `documents` carry what the footnotes cannot reach. The
first two are additions to the derived set, never a replacement for it; the
third is not a passage at all.

## Three works are quoted and one is listed

A topic page prints the Catechism, then the Compendium of the Social Doctrine
where the topic names sections of it, then the Code where it names canons, and
then the titles of any documents. The first three are quoted because this site
addresses each of them a numbered unit at a time — `/catechismus/{n}`,
`/doctrina-socialis/{n}`, `/ius-canonicum/{n}` — so a span of one resolves to
text with an address behind every number. A document is a whole work and cannot
be quoted at a topic's length, which is why it stays a title and a link.

**Each block is headed by the work it quotes**, and that is what earns the
second and third of them. The three teach at different levels — a summary, its
development, the law — and a reader who cannot see which one they are reading
has been handed a composite nobody wrote.

**`csdc` is for the question the Catechism answers in a paragraph and the
Compendium answers in a chapter.** The Catechism's social teaching is real and
short: work is CCC 2426–2433, private property 2402–2407, the political
community 2234–2246, because it is a catechism and those are its summaries. The
Compendium is the developed teaching underneath them. So a topic in the public
square carries both, and ninety of the topics carry no `csdc` at all — there is
nothing in the Compendium about purgatory or scruples, and a field named where
it adds nothing is a heading over a repetition.

**`canons` used to be a list of numbers.** A reader asking whether the Church
allows cremation was shown a link reading `1176`; they are now shown can. 1176,
which says the Church earnestly recommends burial and does not forbid cremation
unless it is chosen against the faith. That is the whole argument for the
change, and it is also the rule for naming a canon: name it where the law
_settles_ the question and the Catechism only mentions it — a procedure, a
permission, a condition.

**The span stays short in all three.** A topic is read at one sitting by
somebody who arrived with a question, and the Compendium's chapters run past a
hundred sections; `labor` names six of them. The rest is one link away, at the
paragraph the span opens on.

Each work resolves the reader's language **separately**, because the editions do
not line up: nine of the Catechism, ten of the Compendium, seven of the Code.
`content.langFor` already keeps those preferences apart everywhere else on the
site, and one language chosen for the page would have to be wrong for two of its
blocks or hide them. The Catechism block is whole or absent — a language short
this topic's paragraphs is skipped — while the other two keep whatever the
edition has, since a reader with nine sections of ten is better served than one
sent to another language.

### What a newly ingested document does to the topics, on its own

Half of a topic keeps itself current and half does not, and the line runs
exactly where the derivation does.

**The footnotes catch up by themselves.** A citation in a Catechism paragraph
is plain text in the corpus — CCC 2357 carries the string `CDF, Persona humana
8` — and `refs.ts` resolves it to a link at render time, against the documents
the build actually shipped. So a document ingested today makes every citation
of it, on every topic page that anchors a paragraph citing it, become a live
link at the next sync. Nothing in `quaestiones.json` is touched, and no topic
is regenerated. Two conditions: `refs-grammar.ts` must map the siglum to the
slug, and `documentSectionExists` must find the section. An unmapped siglum
stays plain text however much of the corpus arrives.

**The `documents` array does not.** It is hand-written, so a new document joins
a topic only when somebody adds it — and the topics a new document _unblocks_
are added by hand too. That is the cost of the field, and it is the right cost:
naming a document is a claim that the reader should open it, which the corpus
cannot make on its own.

So the periodic act after an ingest is small and worth doing: check whether the
arrival lifts anything off the blocklist in `docs/research/topics.md`, and
whether it belongs in the `documents` of a topic already shipped. The passages
need no attention.

## A doorway is not a heading a reader can scan

Four doorways sorted the topics correctly and organised the page badly, and the
difference showed the moment the set went from twelve to a hundred-odd.
`argument` alone holds sixty: under one heading that is a wall, and the reader
who came asking whether any of it is true has to read past contraception, the
death penalty and the just wage to find out.

So a topic also names a **cluster** — a shelf inside its doorway — and the page
draws the sixteen shelves.

**The doorway is not drawn at all**, which is where this ended up and is the
same finding pressed one step further. It headed the page for a while, four
rules across the column with the shelves under them, and the trouble is that
"what people argue about" is true of all sixteen: a heading that describes
everything directs nobody, and the widest doorway held sixty topics across six
shelves, so the level that actually told a reader where to go was always the one
underneath. Four headings over sixteen is a level to read past.

It stays in the file, and not as a vestige. It is the question the file is
edited by — a topic is filed by the situation somebody arrives in, and the
`lead` field, the two-doors rule and the whole selection pass in
`docs/research/topics.md` are all reasoning about that — and it is what puts the
shelves in order. Dropping the field would leave sixteen clusters in no
particular sequence.

**Order is declared, not derived.** `quaestiones.json` lists each doorway's
clusters in the order the page draws them, rather than the page collecting the
clusters its topics happen to mention. Deriving it would mean that reordering
the topic list silently reorders the page's headings, which is the kind of
coupling nobody looks for when they move an entry.

**A shelf's heading names its contents; a topic's question names a situation.**
The two levels are written in opposite registers on purpose, and the shelves
were not always: they began as situations too — "Whether any of it is true",
"Why am I not allowed to", "When it has gone" — matching the doorways over them.
That reads well under a heading and badly _as_ one. Sixteen shut shelves are the
whole navigation of the page; each is met cold, with one line to say what is
behind it, so `credibility` is "Faith & reason" and `the-rules` is "The hard
teachings". The restraint is in what a name may claim: not "Morality" for a
shelf holding thirteen contested teachings, and not "Purity" for the shelf a
reader reaches at 2 a.m., which is a word they may not use of themselves.

**Clusters are English and slugs are Latin**, which is not an inconsistency: a
slug is an address and has to name the same thing in every language, while a
cluster appears in no URL and is a dictionary key.

**A shelf is closed until it is opened.** The cluster layer removed the wall
three shelves at a time and left a page taller than the wall it removed, which
is the same complaint one level up. Every cluster is a `<details>`, shut by
default, with the number of questions on its heading — so the page opens as its
own table of contents, sixteen named shelves, and the reader opens the one they
came for. Two things follow. A live query forces every
surviving shelf open, or a search matching three questions would show three
closed headings and read as no results; and the search does not record what it
opened, so clearing the box puts the page back as the reader had it. A browser
opens a closed `<details>` only for a target _inside_ one, and these ids are on
the element itself, so the page reads the fragment itself and opens the cluster
it names.

**The shelf is a crumb on the topic page**, `Questions › Money, work & vocation
› Tax`, pointing at that fragment. It is the only way back to a question's
neighbours, and most readers arrive at a topic from a search engine rather than
through the list: before it, the first crumb landed them in sixteen shut shelves
with nothing to say which one they had come out of. The link works because the
landing page opens what the fragment names — the same mechanism somebody else's
bookmark uses, now with a caller inside the site.

**Which is what retired the aside.** It held a table of contents listing the
sixteen clusters and, above that, the search box; with the shelves shut the page
is that table of contents, so the sidebar was a second copy of the thing it
pointed at. The aside also cost the search box a **second element** — it is
`display: none` below 80rem, so the control had to be rendered again above the
list, one query in two boxes with one of them always hidden. Both are gone. The
search box sits under the tagline in the column, at every width, and is the only
control on the page.

`/documenta` earns a facet panel because 298 rows carry axes invisible in the
list — author, kind, date; this page is already sixteen named shelves, so a
doorway or cluster filter would collapse the structure that _is_ the page. What
no grouping gives is the reader who arrives holding words rather than a place,
which is the half of the audience `docs/research/audiences.md` found bouncing
off a jump box that completes citations they do not have. The box matches title,
question and a third string nobody sees, folded for case and diacritics
(`topic-search.ts` — `cremacao` has to find _cremação_), and it keeps the
tagline's measure rather than the column's: a field three times the length of the
line above it reads as another page's furniture.

**The keywords exist because the two visible strings are written to be read.**
`mors-voluntaria` is titled _After a suicide_ and asks _Someone has taken their
own life_, so a reader typing `killed himself` matched nothing; `crematio` never
says _urn_, `divinatio` never says _ouija_, `contraceptio` never says _the pill_.
The alternative was to write the search terms into the questions, which spends
the register the whole page is built on. So `quaestiones.{slug}.keywords` sits in
the dictionaries beside the pair, renders nowhere, and is **translated rather
than transposed** — the reader's word is `camisinha`, not `condom`; `macumba`,
not `witchcraft`. A term the title or the question already carries is already
matched, and `quaestiones.test.ts` fails on one written twice. The key is also
the one whose absence is invisible: a missing title renders as its own key on the
page, missing keywords render as a topic that is merely harder to find, which is
why `topic-search.ts` refuses the key `t()` hands back rather than putting the
slug into the haystack.

**The list is one, two or three columns**, by viewport rather than by a fixed
pair — a topic is a short title over a one-line question, so a single column
spends a third of its width and makes the page three times as tall as it needs to
be. The thresholds (46rem, 75rem) are this page's own content and not the site's
layout breakpoints; the second is where the viewport can give the column its
whole width, which is what a third cell needs.

**The question is drawn at every width**, one column deep on a phone. Hiding it
there was tried and reversed: it buys back a third of the page's height, and
what it spends is the half of a row that says what the topic is _for_ — the
title names a subject, the question is the sentence somebody would have typed.
It is also half of what `topic-search.ts` matches, so hiding it leaves a phone
reader with rows that match a word not on screen. The shelves being shut is what
makes the length affordable instead.

## A title is a poor oracle for what a document is about

`documents` entries are checked against `site/descriptions.json`, which is the
only place here that records what a document _says_ rather than what it is
called. Reading the 85 descriptions the topic set names caught two documents
that were simply wrong, and neither was findable by title:

- **`veritatis-splendor` under `iustificatio`.** It sounds like the document for
  faith and works. It is about the moral act, freedom and conscience.
- **`signum-magnum` under `apparitiones`.** It sounds like the document for
  private revelation. It is an exhortation on Marian devotion.

It also found nine documents that belonged and were missing — `sacramentum-caritatis`
on Sunday obligation, `collaboration-of-men-and-women` on gender, `mysterium-ecclesiae`
on whether a dogmatic formula can be historically conditioned. Read the
description before naming a document, and again before removing one.

## The site speaks once, and the heading is what makes it safe

Every other rule on this page is a way of not writing a sentence of our own. The
passages are derived, the summary is the Catechism's, the document titles come
out of the corpus, and `lead` moves a paragraph without adding a word. `editorial`
is the exception, it is declared per topic, and one topic has it.

**What earns it is a false belief the corpus cannot dislodge**, which is a
narrower thing than a difficult subject. A reader arriving at
`associationes-massonicae` has usually been told that Freemasonry means automatic
excommunication. It did, until 27 November 1983. The law that replaced it says
nothing about excommunication — and **a canon does not print the penalties it
declines to impose**, so there is no passage anywhere in the corpus whose
quotation would correct them. The texts are silent in exactly the shape of the
error. That is the test: name the belief, then name the passage that would have
corrected it. If the passage exists, anchor it and write nothing.

**The disclosure is the heading, not a disclaimer.** Every block on a topic page
is headed by the work it quotes — the Catechism, the Social Doctrine, the Code —
so the heading slot is already the place a reader learns whose words follow. Ours
goes in the same slot and says "A note from this site". Nothing else on the page
has to change, and the reader learns one convention rather than two. The block is
also lifted onto the elevated ground with a border and an accent rule, so it
reads as a different KIND of thing before the heading is read and after it has
been forgotten, and it hangs no unit number in the margin because it addresses no
unit and has no address of its own.

**It goes above the quotations**, which is the part worth arguing, and the
argument is `lead`'s one level up: the risk is our voice standing over somebody
else's, the certainty is a reader misreading three works before meeting the
correction, and the misreading is what they arrived with. Printed order is itself
an ordering.

**Two tests hold it and both are about invisibility.** The flag and the string
live in different files and fail in opposite directions: flagged with no string,
`t()` hands back the key and the page prints `quaestiones.{slug}.editorial` as
literal text at the top; written with no flag, the paragraph is composed,
reviewed and silently dropped. A third caps the count — **a file where a third of
the topics explain themselves in our voice is a commentary with quotations in
it**, which is a different site, and no threshold is defensible in the abstract
except one low enough that crossing it has to be done on purpose in a diff.

**What may go in it.** Only what can be checked against a text printed below it
or against a date, and nothing about the people on the other side of the
question. That second half is not delicacy: the page is read by the families of
the people it is about, and a site that publishes the Catechism forfeits the
standing it is trading on the moment it characterises a class of persons. It is
also the weaker instrument — a reader who holds the false belief is moved by the
1917 canon and the 1983 date, and hardened by an insult. **This is the one place
on a topic page where the site can be wrong rather than merely badly arranged**,
and the only place where nobody else's authority stands behind the words.

## The summary is the Catechism's, which is the only reason there is one

A topic page prints no sentence of its own between its heading and its
quotation, and the longest of them is sixteen paragraphs. Those two facts had
been in tension since the file went past a dozen topics: a reader who arrives at
_Why do Catholics give her so much?_ and meets the Immaculate Conception,
the perpetual virginity, ten paragraphs of _Lumen Gentium_ on the Church's
Marian doctrine and the Hail Mary line by line has been answered thoroughly and
not briefly, and nothing on the page is willing to say the short version.

**The Catechism says it.** Every article closes with a run of summary paragraphs
under a heading of its own — IN BRIEF, EN BREF, Resumindo, KURZTEXTE — and the
corpus already carries the flag: `in_brief` is true on 548 of the 2,865
paragraphs, in all nine editions, because the Church wrote the short form in
nine languages and this project did not have to. So `brief` is a list of
paragraph numbers, the page opens on them, and the page has still never written
a sentence about what a quotation means.

**A summary composed here would have been the one thing this page has never
done**, and it is worth being exact about why, because the arrangement that
tempts it is the arrangement that makes it most dangerous: our voice, in the
Catechism's place, above the quotation, read INSTEAD of the quotation by
precisely the reader a summary is for, and carried away as the Church's. A
number cannot do that. It resolves to text with an address behind it, and the
reader can press 509 and land on the paragraph.

**The editorial act is the selection, and it is `lead`'s size.** An IN BRIEF run
summarises its ARTICLE, not the reader's question — 2680–2682 close the article
on Christian prayer with the Father, the Son and the Spirit, and only the last of
the three is about Mary — so the field is a list rather than a span, its order is
the answer's rather than the work's, and the page discloses both in the same
register the `lead` note uses. Two checks in `sync-corpus.mjs` keep it from
becoming something else, and each is invisible on the rendered page:

- **Every number must be a paragraph the Catechism itself flagged.** Without it,
  `brief` is a field for quoting whichever paragraph reads best under a heading
  claiming the Catechism summarised this, which is a heading that lies.
- **No number may also be inside the topic's own `ccc` spans.** A paragraph
  printed in the summary and again in the body is read twice, and the summary
  stops being one. This is the ordinary case rather than a hazard: an article's
  IN BRIEF sits outside the span a topic took out of that article, which is why
  `brief` is drawn from anywhere in the work where `lead` may only name a
  paragraph the topic already has.

**Most topics want none.** A topic anchoring four paragraphs is read at one
sitting and a summary over it is a heading over a repetition — `csdc`'s rule
again. Name it where the passages run long and the reader arrived at a wall.

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

What it owes: the `quaestiones.*` keys exist in `en` and `pt` alone, so the
route stays out of `CHROME_PATHS` until the rest of the dictionaries carry
them — and this is now the largest block of untranslated chrome on the site,
three strings per topic plus the sixteen shelf headings. A topic is not offered for
bookmarking yet, though the address supports it — `addressResolves` answers
`true` for a topic because the index tier deliberately does not carry the topic
list, and answering `false` would discard a reader's mark on every topic at
once.

**Three ways in, and none of them is the bar.** A card in the catalogue, drawn
by `ShelfGrid.svelte` on the home page and on `/bibliotheca`, and a row in the
footer's works column. The bar stops at five doors because a bar is one line
(`docs/finding.md`), and this is not one of the five; what it is instead is a
way into the three works it quotes, by the index a reader holding a sentence
and no reference can use — which is why the card sits in the bed with the works
rather than above them, and why the footer row is in Works and not in Pages.
Both are gated on `hasTopics()`, the door's version of `visibleShelves()`: over
a build with no topic list they would open onto `quaestiones.landing.none`. The
card's sentence is `quaestiones.landing.cardTagline` and not the tagline above,
which is a masthead's two sentences and was five lines in a 16rem card — the
same problem `ccc.landing.pairTagline` was written for.

**The title and the question are the only strings here written as somebody
else's words** — the keywords are written in the reader's, which is a different
job with the same rule against transposing the English — and a translator needs
to be told so. The title is this site's
plain naming; the question is the reader's own sentence, and it has to stay a
sentence they would actually type in the plainest register their language has —
never a formal rendering of the English, and never lighter than the thing it
asks about. `pt` was written under that rule and its section comment repeats it.

## Adding a topic

The machinery is finished; what each pass adds is judgment, three files at a
time. `docs/research/topics.md` holds the candidates and the blocklist.

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
canon, a renamed document slug, a cluster the topic's doorway does not declare
or a drifted `lead` all fail the build with the slug and the number, so there is
no separate verification step:

```sh
CORPUS_DIR=… npm run build   # prints `Topics: N over 4 doorway(s)`
```

**3. Read the document's description before naming it.**
`site/descriptions.json` says what each document is about; the title does not.

```sh
jq -r '.descriptions["encyclical.veritatis-splendor.en"].en.text' site/descriptions.json
```

**4. Write the three strings.** `quaestiones.{slug}.title` and `.question` in
`src/lib/i18n/en.ts`, in that section's own register — the title is this site's
plain naming, the question is the reader's own sentence, and neither evaluates
or advises (`docs/writing-voice.md`) — and then `.keywords`, which is read by
`topic-search.ts` and by nobody else: the words somebody would type for this
topic that the first two do not happen to use. `quaestiones.test.ts` fails on a
topic missing any of the three. Any dictionary that already carries the section —
`pt` does — wants all three, or that reader gets an English question inside a
Portuguese page and a search that misses their own vocabulary.

**5. Run the loop**: `npm run check`, `npm test`, `npm run preflight`. A topic
adds no route code, so a pass here is the whole of it — except the look, which
needs a browser and a person.

### Reviewing a topic that already ships

Adding a topic and reviewing one are different jobs, and the sync only does the
first. It checks that every span, canon and document slug **exists**; nothing
checks that the passages **answer the question**, because no build can. That is
a read. `site/quaestiones-review.json` holds its verdicts — a grade per topic, a
note where the anchor is oblique, the fix named where a question had no passage
behind it — and `docs/research/topic-anchor-review.md` holds the method and what
the reading has taught so far.

**A grade is a claim about a particular anchor set**, so each row states the set
it was formed on and `quaestiones.test.ts` recomputes it. Change a reviewed
topic's spans and that test fails by name: re-read the topic against its new
passages rather than pasting the new signature in. Nothing else can catch a
verdict left standing beside a page it is no longer about.

**Read the question clause by clause against the passages, not the title.** The
first defects the pass found were topics anchored correctly for their title and
not at all for their question: `pornographia` was CCC 2354 and nothing on the
page said anything about being unable to stop, which is half of what its
question asks and the first word of its keywords.

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
