# Who this is for: nine readers, and where each one stops

Written 2026-08-28. **Nothing here is implemented.** This is an audience pass,
not a plan: it names the readers the site actually has, walks each one to the
point where the site stops answering them, and says which of the gaps in
`PLAN.md` that point corresponds to. Where a finding is measured, it says so;
everything else is labelled an estimate or a judgment.

Its use is as a benchmark. Each section below is a brief a persona agent can be
run against, so the same walkthroughs can be re-run after a change and compared
— see "Running one" at the foot. The value is not any single verdict; it is that
the set covers both sides of the two axes below, so a regression in one reader's
path shows up as one persona's report changing and the other eight's not.

## The two axes that actually generate personas

Rank does not vary the experience here. A bishop reading §2267 does what a
seminarian reading §2267 does. Two things vary it:

**1. Does the reader arrive with an ADDRESS or with a QUESTION?**

The site resolves addresses. `site/src/lib/suggest.ts` says so in its own header
— it is "deliberately NOT a full-text" search — and `PLAN.md` gap 2 records that
nothing else exists: no index builder in `site/scripts/`, no search route. So
every reader who arrives holding a citation is well served by machinery built
for exactly that (`refparse.ts`, `refs-grammar.ts`, eleven book tables, the
versification converter), and every reader who arrives holding a _question_ meets
the same wall regardless of who they are.

This is the single largest fact about the audience, and it splits it in half.

**2. Does their language have chrome, and does it have content?**

Three states, all currently occupied:

| State                     | Tags                                                    | What the reader gets                                               |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Chrome and content        | `en`, `pt`, `la`, and the six the Compendium/CCC landed | the intended experience                                            |
| Chrome, almost no content | `sl`, `sv`, `hu`, `ro`, `ru`                            | their own interface over English text, via `CONTENT_LANG_FALLBACK` |
| Content, no chrome        | `mg`                                                    | the whole Catechism, inside English chrome (`PLAN.md` gap 14)      |

`UI_LANGS` in `site/src/lib/i18n.svelte.ts` is fourteen; `ContentLang` in
`types.ts` is fifteen. They are not derived from one another, deliberately.

Device and connectivity is a third axis but a weaker one — it changes the
severity of a finding, not its existence — so it is folded into the personas
rather than crossed with them.

---

# The readers

Ordered by how badly the site currently serves them, worst first. That ordering
is a judgment, not a measurement.

## 1. The layperson with a question

**Who.** Brazilian, reads Portuguese, on a phone, on mobile data. Has heard
something at Mass or read something online and wants to know what the Church
actually says about it. Owns no citation and does not know the Catechism is
numbered.

**Arrives with.** A question in words: _"a Igreja permite cremação?"_

**First actions.** Searches the web, not the site — so the real entry is whatever
Google surfaced, which for an SPA with two HTML files and a sitemap is the home
route. Then the jump box, into which they type words.

**Where they stop.** Immediately, and at the deepest gap in the project. The jump
box completes _addresses_: book abbreviations, paragraph numbers, document
slugs. A Portuguese sentence matches nothing in `suggest()`'s tiers, and there is
no second thing to try. `PLAN.md` gap 2.

**Why this reader ranks first.** They are the largest audience by any reasonable
estimate, they are the audience the maintainer's own language weighting implies,
and they are the one for whom every other feature of the site — eleven book
tables, ten Compendium editions, the compare grid — is unreachable, because all
of it is behind an address they do not have.

**What would serve them.** Not necessarily full-text search. The Compendium is
598 questions in plain language and is the closest thing the corpus holds to a
topical index; `related` (gap 5) would be the print Catechism's own answer to
this reader, and it is empty on all 2,865 paragraphs.

**What already serves them.** The Compendium's question text is stored and
linkified (`plainTextNodes` in `inline-html.ts`), and Portuguese is a
first-class content language across every work.

## 2. The priest preparing a homily

**Who.** Parish priest, Saturday evening, needs Sunday.

**Arrives with.** A _date_. Not a citation, not a question — a date, or the name
of a Sunday.

**Where they stop.** At the first keystroke, and this is the finding this persona
exists to produce: **the corpus has no lectionary and no liturgical calendar.**
`site/src/lib/dates.ts` is date _formatting_ for a document's `promulgated`
field, and its own header says there is exactly one kind of date in this corpus.
Nothing maps a Sunday to its readings.

So the site cannot answer this reader's primary query at all, and — unlike the
layperson's — this is not a gap in `PLAN.md`. It is out of the scope the project
has drawn for itself, which is defensible (a lectionary is a distinct work with
its own rights position and its own per-conference variation), but it should be
a stated exclusion rather than an unnoticed one, in the way `PLAN.md` gap 10
states CIC and Denzinger.

**What serves him once he has the citation.** Everything. Verse text in three
editions, Challoner's 1,917 notes in the margin (`Sidenote.svelte`), the
Catechism's treatment of the same passage through the "cited by" apparatus, the
Fathers by way of the Summa. He is extremely well served on the second step and
not served at all on the first.

## 3. The Malagasy reader

**Who.** Reads Malagasy. Has the entire Catechism — 2,865 paragraphs of
`ccc.mg` — and no interface in their language.

**Arrives with.** An address, usually, since the alternative does not work.

**Where they stop.** Nowhere abruptly; the failure is a slow one. Every heading,
menu, label and error message is English. `mg` is not in `UI_LANGS` and cannot
be, because the dictionary it is owed is not one the maintainer can write —
that reason is recorded in `CLAUDE.md` and it is an honest one.

**The thing to check that nothing else checks.** `LANGUAGE_NAMES` in `corpus.ts`
is keyed on `ContentLang` and an unnamed tag falls through to the tag itself.
`ccc.mg` shipped offering itself as "mg" in the edition menu. No build, test or
type error sees that class of defect, and this persona is the only reader
positioned to.

`PLAN.md` gap 14.

## 4. The reader following a citation in from outside

**Who.** Anyone. Clicked a footnote in a Wikipedia article, a blog, a parish
bulletin PDF. No session, no stored language preference, no context, and no
intention of exploring — they want one paragraph and they want to leave.

**Arrives with.** A URL someone else wrote, which is the risk.

**Where they stop.** Three places, in increasing order of seriousness:

- **A wrong root.** `/bible`, `/ccc`, `/documents`, `/prayers` deliberately
  resolve as invalid — there is no compatibility layer, by design
  (`CLAUDE.md`). Canonical is Latin: `/scriptura`, `/catechismus`, `/documenta`,
  `/preces`. Anyone linking from outside in English guesses wrong, and the
  worker returns the shell with a 404 (`src/worker.ts`, `route-manifest.ts`).
  Whether that is the right trade is a settled decision; what this persona
  measures is its cost, which is borne entirely by the reader who did not choose
  it.
- **A language they cannot read.** With no preference stored, content resolves
  through `CONTENT_LANG_FALLBACK` — `pt` looks to `es`, then `en`, then `la`.
- **Real, plausible, wrong text.** The serious one. A citation using Hebrew
  versification into Psalm 13 or Acts 14 lands on verses that exist and are not
  the ones cited, with nothing on the page marking the divergence. `PLAN.md`
  gap 9; the classification landed 2026-08-25 and the disclosure did not. This
  reader is exactly the one it was written about, and they have no way to detect
  it, because the page they get looks correct.

**What serves them.** `versification.ts` converts unconditionally for divergent
books rather than as a fallback, which is why most of these land right in the
first place.

## 5. The OCIA/RCIA candidate

**Who.** Becoming Catholic. Nine months in. Has been told to "read the
Catechism" and has never held a reference work of this kind.

**Arrives with.** A word they heard in class, or a number their catechist wrote
on a handout without saying what it refers to.

**Where they stop.** At the vocabulary of the corpus itself. They do not know
that "CCC 2267" is a paragraph rather than a page, that the Compendium is a
different and shorter book than the Catechism, that the Summa is not
magisterial, or that a document slug is a thing. Nothing on the site teaches
them — `/colophon` states provenance, copyright and what is measured, which is
the right content for a different reader.

**Estimate, not measurement.** No usage data can currently distinguish this
reader from the layperson; the beacon is bucketed and carries no free text, by
design.

**What would serve them.** The Compendium, which is written for exactly this
reader and is complete in ten languages. They mostly cannot find out it is
there.

## 6. The catechist

**Who.** Prepares a weekly class from a diocesan syllabus that cites paragraph
ranges. Needs to read, then to print or project.

**Arrives with.** A range of addresses and a topic to hold them together.

**First actions.** `/catechismus/caput/{n}` for the chapter, the in-brief
divisions for a summary to hand out, `/compendium/{n}` for the question form of
the same material, then print.

**Where they stop.** Two smaller walls rather than one large one:

- The margin concordance — the print Catechism's own answer to "what else
  belongs in this class" — is `[]` on all 2,865 paragraphs in all eight
  editions, because no vatican.va mirror carries it. `PLAN.md` gap 5.
- Assembling a range is manual. There is no "these paragraphs, together, as one
  page" surface; `/signata` collects bookmarks by work, which is close but is a
  reading list rather than a handout.

**What serves them well, and it is a lot.** The in-brief divisions are correct in
all eight editions after the 2026-08-26 division pass, `PrintButton.svelte`
exists, the Compendium/CCC pairing is real, and the two index routes link each
other's matching division. This is the best-served reader on the list after the
seminarian.

## 7. The seminarian or theology student

**Who.** Reads Latin badly and English well, cites precisely, and is graded on
getting references right.

**Arrives with.** An exact citation, usually from a footnote in a textbook.

**Where they stop.** Later than anyone else, and on questions of apparatus rather
than of text:

- The reverse index reads **two of six citers** — `build-xrefs.mjs` builds "cited
  by" from CCC and document editions only, so the Summa, the Compendium and the
  Bible apparatus cite forward and are invisible backward. `PLAN.md` gap 12.
- Denzinger, CIC, the Roman Catechism and Vatican I are out of scope
  (`PLAN.md` gap 10), and this is the reader who will look for all four.
- The Supplementum exists only in English; `summa.la` has four parts to
  `summa.en`'s five. That is a property of the Corpus Thomisticum, resolved per
  address by `CONTENT_LANG_FALLBACK`, and it is the correct behaviour — but this
  reader is the one who will notice the seam.

**What serves them.** The most of anyone: normative Latin for the CCC and the
Summa, edition provenance in the colophon, the compare grid, stable canonical
URLs, and a citation apparatus that reads eleven book tables. If the site has a
core audience today, measured by fit rather than by size, it is this one.

## 8. The offline reader

**Who.** Reads on a phone with intermittent or expensive data — a seminary with
bad wifi, a long commute, a mission. Overlaps every persona above rather than
replacing one; run it as a modifier.

**Arrives with.** The intention to read a lot, later.

**What to check.** The install path (`install.svelte.ts`, `InstallButton.svelte`,
`InstallHint.svelte`), what the download waves actually fetch (`sw-policy.ts`'s
`contentPath`), whether a wave is silently empty because a content kind got
inlined into the bundle instead of emitted as an asset (`CLAUDE.md` is explicit
that this failure is invisible), and whether `/signata` and reading position
survive offline.

**Why it is worth a persona and not a checkbox.** The offline library is the one
feature whose failure mode is _nothing visibly wrong_ — the app works, the pages
load while online, and the reader finds out on the train.

---

## 9. The bishop, reframed — the legitimacy review

A bishop is not a usage mode; reading §2267 he behaves like the seminarian. But
there is a real ninth persona hiding behind the suggestion, and its job is not
reading — it is **legitimacy review**. It asks a different question of the same
pages: _does this site misrepresent the Church?_

What it reviews:

- **Edition labelling.** Is each text attributed to the edition it actually came
  from, and is `catechism_lt` still correctly understood as Latin rather than
  Lithuanian (`CLAUDE.md`)?
- **Superseded text presented as current.** The pre-2018 §2267 sits in the Latin
  mirror as editorial matter and was the cause of one balance outlier. Anywhere a
  reader could meet a superseded text unmarked is this persona's finding.
- **Silent divergence.** Gap 9 again, from the other side: not "the reader is
  inconvenienced" but "the site showed them the wrong verse under the right
  reference."
- **Implied approval.** Nothing on the site claims an imprimatur, and it must
  keep not claiming one. The colophon is the surface to check.
- **The copyright position**, which is stated in the corpus repo's `README.md`
  and summarized by `copyright.ts` / `CopyrightNotice.svelte`.

This is the persona to run with the highest reasoning effort, because unlike the
other eight its findings are not about missing features — they are about whether
what is present is _true_.

---

## What this set deliberately excludes

- **The academic in a non-Catholic department.** Real, and served incidentally by
  everything the seminarian is served by. Adding them produces no finding the
  seminarian does not.
- **The apologist.** Wants exact text, a permalink and provenance — which is the
  citation-follower's outbound half. Fold into #4 rather than adding a persona.
- **The translator.** Would exercise the compare grid harder than anyone, and is
  the only reader who would notice two editions disagreeing. Excluded only
  because `audit.py balance` and `book-forms-oracle.mjs` already measure that
  mechanically and better; add the persona if the compare _interface_ is ever the
  thing under test.
- **Rank above priest.** Covered above.

## How to read the set

The eight are not equally likely. If one number matters more than the others it
is this: **#1 and #5, the two readers who arrive with a question rather than an
address, are plausibly most of the traffic and are stopped in the first ten
seconds.** Every other finding in this document is about a reader who already
got in.

## Running one

There are no agent definition files, on purpose: `.claude/` is gitignored here,
so anything put there is local to one machine and cannot be part of the
benchmark. The brief is the section above, and the agent is a general-purpose one
pointed at it:

> Read `docs/research/audiences.md` and adopt persona §N. Follow the rules and
> the report shape below exactly.

**Rules, identical for every persona.**

- **Read-only.** Never edit, write, commit, or run a scraper. You are measuring,
  not fixing.
- **Do not drive a browser.** Playwright is out by project rule (`CLAUDE.md`);
  the maintainer does UI verification. You read routes, components, `site/src/lib/`
  and the synced corpus and reason about what this reader would meet. Where you
  genuinely cannot tell without looking, say so and name the URL to open.
- **Ground every claim in a path.** "This reader cannot X" is worth nothing
  without `site/src/routes/…` or `site/src/lib/…` beside it.
- **Separate missing from broken.** A gap `PLAN.md` already names is a
  confirmation, not a discovery — say which it is. The confirmation is still
  useful, because the job is to say what it costs _this reader_, which the gap
  table does not.
- Stay in character for the walkthrough. Drop it entirely for the findings.

**Report shape, identical for every persona.**

1. **Walkthrough** — the first five things this reader does, each with the route
   they land on and what they actually see.
2. **Findings** — a table: `what | where (path) | known? (PLAN gap N, or new) |
cost to THIS reader`.
3. **Where they give up** — the one point at which this reader closes the tab,
   and why. One paragraph, and the most valuable line in the report.
4. **What served them well** — at least two, with paths. A persona that only
   complains is not calibrated, and its findings cannot be ranked against the
   other eight.

Run the legitimacy review (§9) at a higher reasoning effort than the rest: its
findings are the only ones that are about whether what is present is true, rather
than about what is absent.
