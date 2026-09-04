# Decisions

The design choices that are **not obvious from the code**, each with the reason
that makes it a decision rather than an accident.

This is not a history. Git holds that, and the commit that changed a rule holds
the measurement that justified it. What belongs here is the standing answer to
"why is it like this", stated once, in the shape someone needs when they are
about to change it.

This file holds only what is true of the whole project. **Everything else lives
beside the code it governs**, and the entry that says why is one file away:

| Where                          | What it decides                                              |
| ------------------------------ | ------------------------------------------------------------ |
| `pipeline/docs/corpus.md`      | the corpus repository, `raw/` vs `build/`, capture, storage  |
| `pipeline/docs/corrections.md` | corrections, overrides, and what the parser owns             |
| `pipeline/docs/parsing.md`     | reading a page, family conventions, the rebuild              |
| `pipeline/docs/oracles.md`     | the ladder of checks, and when a vote is allowed             |
| `pipeline/docs/languages.md`   | which editions are crawled, and what a language costs        |
| `site/docs/addresses.md`       | the URL grammar, work types, editions, commentaries          |
| `site/docs/languages.md`       | `UiLang` vs `ContentLang`, fallback, tags, language prefixes |
| `site/docs/references.md`      | reading a printed citation into a link                       |
| `site/docs/shell.md`           | the SPA shell, boot payload, chunking, offline               |
| `site/docs/edge.md`            | the worker, its cost, rate limiting, the head, the sitemap   |
| `site/docs/reading.md`         | lanes, apparatus, cards, the Bible's chrome, plates          |
| `site/docs/finding.md`         | the jump box and `/documenta`'s facets                       |
| `site/docs/calendar.md`        | the liturgical calendar                                      |
| `site/docs/usage.md`           | the usage beacon and its legal assessment                    |
| `site/docs/linking-out.md`     | the only outbound links, and what licenses one               |
| `site/docs/colophon.md`        | can. 216, the disclaimer, the marks                          |
| `site/docs/dev-loop.md`        | sync, caches, HMR, serving and checking locally              |

Companions: `PLAN.md` (what is left), `docs/corpus-schema.md` (the data
contract), `docs/link-surface.md` (the reference apparatus), `docs/research/`
(the measurements), `CLAUDE.md` (what has actually bitten someone).

---

## Posture

**Church-owned texts are hosted verbatim, with full attribution, without asking
first; we comply promptly if a rights holder asks.** A deliberate position, not
an oversight — `docs/research/copyright.md` §5 argues it. It covers
**Church-owned magisterial material only**: a Bible or a patristic translation
owned by a commercial publisher is outside it and must be public domain. Matos
Soares 1956 (PD 2028) is one knowingly accepted, self-resolving exposure;
Alexandre Correia's Summa (PD 2055) and Paulus's _Coleção Patrística_ are
blockers rather than exposures.

**Free, ad-free, account-free.** No advertising, no accounts, no third-party
code, no cookies, and nothing that identifies a reader. There IS a usage
measurement — first-party, bucketed, unlinkable — and `site/docs/usage.md` is
the argument for why it does not cost the privacy position anything the
colophon has to qualify.

**Indexable, and a duplicate of vatican.va on purpose.** Every page reproduces
text with a canonical home on someone else's server, so the site competes with
that server for its own paragraphs. It is still the copy meant to be found:
what it adds is the apparatus — resolved citations, the reverse index, parallel
editions, offline reading — and a reader who searches a paragraph number should
land somewhere that carries all of it. So `robots.txt` carries no `Disallow`
and the build sends no `noindex`. Both were blanket-set before launch so that a
verification-only hostname would not become the indexed one; that remains the
single condition under which they go back.

**A text we cannot show properly is not shown.** `site/unpublished.json`
switches a work off; its addresses then redirect to the source page rather than
explaining themselves. The mechanism was built for rights and is used for
**quality** — a damaged parse is worse than an absence, because a reader cannot
see what is missing. Entries are meant to be temporary, each with its measured
defect. (`site/src/lib/calendar/national/held.ts` is the same argument for
output that is not a text.)

**There is no whole-site lever, and that is a real gap.** Nearly the whole
corpus is Libreria Editrice Vaticana material under one notice, so the request
the posture actually anticipates would concern almost everything at once. A
per-work id list is not the shape of that decision.

**The name is a promise about arrangement.** The _Glossa Ordinaria_ set
commentary around the sacred page, attributed and never mixed into it. So: **a
gloss must never be confusable with its source, visually or structurally.**
That rule governs Challoner's notes, Matos Soares' notes, and anything
annotative added later.

## Scope

**In**: the Bible, the CCC, the Compendium, all encyclicals across all
pontificates, the 16 Vatican II documents, the 2 First Vatican Council
constitutions, apostolic exhortations, the prayers, the Summa (EN + LA), the
Compendium of the Social Doctrine, the Code of Canon Law, and the doctrinal
office's cited documents.

**Every encyclical the Holy See publishes is on the site in some language** —
English where it exists, otherwise the language it does exist in. Discovery
consults the Italian index per pontificate for anything English does not list;
measured, Italian is the only language that reaches a document English does
not. **The language a document arrives in is whichever one it exists in**, and
this is not a "crawl more languages" switch.

**Translations beyond that are fetched, not published, by default.** Acquiring
sources and deciding what to publish are separate decisions on separate
timescales. A page's own language bar under-reports by a factor of six and
cannot be used as an index of what exists.

**One encyclical is on that index twice, and the corpus takes it once.**
_Firmissimam Constantiam_ is published under both its Latin and its Spanish
incipit, with the date written the other way round in each; both answer 200 and
the two parses were byte-identical. Three things about the decision are the
reusable part. **It is dropped at discovery, not deleted afterwards**, because
both pages are real and both were fetched, so the raw capture stays as evidence
and only the second _address_ goes. **It is a table** (`INDEX_DUPLICATE_SLUGS`)
rather than a special case, because what produces it is the origin's index, and
an index that did this once can do it again. And **it is the only one**,
checked by hashing every work's `sections.json` and `appendix.json` across the
whole corpus.

**Out, each for a reason that will not change on its own:**

- **The Fathers** — a library, not a work. Measured by _works_ rather than
  authors the demand is flat: 69% of 734 cited works are cited exactly once,
  and "ingest Augustine" is eighty-two projects. There is no top-forty subset.
  Parse the citation strings instead; 72.8% already carry a work-internal
  locator.
- **Denzinger** — Herder-copyrighted, never a vatican.va publication, despite
  being the most-cited non-scripture siglum in the CCC.
- **General audiences** — thousands of talks, low citation density.
- **The Roman Catechism** — not found on vatican.va under any URL tried.
- **IntraText as a source** — quality there is per **work**, not per site: the
  same library holds a faithful copy of the Holy See's own edition and a
  truncated unattributed transcription, so a good result licenses nothing about
  the next work.
- **Machine-translated sources** — disqualified on provenance, and this now has
  to be read per work: liriocatolico, the source of `bible.matos-soares.pt`,
  has begun publishing AI-translated text elsewhere on the site.
- **A critical edition of anything.** Taking the better reading at each
  disagreement produces a text no page prints, whose provenance is a rule
  rather than a URL. `prayer.common.la` therefore takes one witness's
  characters and only the other's _segmentation_, which the base witness does
  not carry and cannot be wrong about.

### Three lessons from taking something in

**A scope decision can rest on wrong facts, and a guessed URL's 404 is evidence
about the guess.** The Code of Canon Law was out because "no Portuguese edition
on vatican.va" and "not Latin (`cic_index_lt.html`, 404)". Both were wrong: the
Latin index is `cic_index_la.html` — `lt` 404s here, the exact inverse of the
trap `ccc.py` documents on the same host — and a Portuguese PDF exists with a
clean text layer. The survey had probed URLs derived from a naming convention,
where the origin prints an index of every edition it has. **Where an origin
prints an index, that index is the answer and a derived address is a
hypothesis.** (A related near miss: each edition links a PDF called _Nova versio
Libri VI_ beside the HTML, from which the obvious reading is that the HTML is
the superseded text. It is not, and the corpus nearly withheld 89 canons of
current law on the strength of a link's title. **A page that says what it is
beats a filename that implies it.**)

**A work type is a statement about addressing, not about storage.** The
Compendium of the Social Doctrine is structurally a document and the whole
ingestion would have been a table entry — but a document is addressed as a
document because a reader cites an encyclical by name and reads it through,
where this work is cited the way the Catechism is: `CSDC 160`, a number and
nothing else. So `type: "social-doctrine"` is **the Catechism's addresses over
a document's files**, and that sentence is the whole specification: the sync's
branch writes what the document branch writes and registers what the Catechism
branch registers, with no second content tier and no second copy of any reader.

**Which documents to hold can itself need measuring.** Vatican II is sixteen
documents and a pontiff's encyclical index is the Holy See's own list of what
he wrote, so for three families "discover" and "publish" were the same verb.
The doctrinal office's Complete List is 239 documents, most of them
notifications about one named theologian's book. So the corpus was asked what
it refers to: all 119,321 citation strings were searched, the 25 documents held
carry about 840 of the 1,121 hits, and every one is cited **by paragraph
number** — which is what makes a document a link target rather than a mention.
The notifications carry **none**. The criterion is the one
`docs/link-surface.md` already sets; what was new is that it had to be measured
before the family could be scoped.

**Reading an index is not reading a page, and the difference cost three
hours.** That index was first read through a Markdown extractor which dropped
roughly half of it, including the second most-cited CDF document in the corpus
— producing a confident, well-evidenced and wrong finding ("the Complete List
is not complete"), a table of hardcoded URLs to work around it, and a note in
this file explaining the Holy See's editorial lapse. **A cleaned rendering of a
page is evidence about the rendering.** The scraper reads `raw/`, so the
scraper is what should have been asked first.

**What is not held is reported by a command, not written down in a file.**
`discover-cdf --unselected` names the documents the corpus does not hold. A
table of that residue in `docs/research/` was the obvious alternative and is
the wrong shape: this index gained six documents in 2025 alone, so such a table
is wrong by the next promulgation, silently, in a file nothing re-reads.

**A withholding signature has to be conjunctive.** Editions are switched off on
two cross-edition signatures together — text loss against the median edition of
the same document, and addresses that are wrong while the text is whole. One
section holding half a document's text is not a defect where every edition
agrees the document has three sections, and a first pass flagged every edition
of two genuinely short documents. (Two entries also came OUT of
`unpublished.json` in that change, having been repaired by someone else's
parser work with nothing re-reading them. The file says its entries are
expected to be temporary; that only holds if something checks.)

## Process

**Shared code is decided by entitlement, not by identical bodies.**
`apply_corrections` moved because everything in it comes from above the edition
— the drift guard, the locator shape, the schema. `validate` did not, though it
was byte-identical, because it is exactly where an edition's claims about its
own text live and is _expected_ to diverge.

**The rule cuts the other way too.** `vatican_docs.py`'s three index-driven
runners were 85–94% identical, but similarity was not the argument for merging
them: all three families are **discovered from an index that names every
edition's URL**, so a run is fully determined before the first document is
fetched. That is an entitlement shared from above the family, and it is exactly
what phase 2 does not have — it discovers per pontificate and derives each
translation's URL by substitution. Phase 2 stayed where it was. A sixth family
is now a table entry and a `Stage` in `rebuild.py`.

**What stayed duplicated is the point of that entry.** Two `family == "vati"`
branches sit inside the parser, each carrying a paragraph on why the general
rule reads those pages _wrongly_ rather than merely badly. A descriptor field
would have turned a documented exception into a configuration flag, which is
how the reason gets lost: **the table carries only what a family is, never how
its pages are read.**

**The prerequisite was a return type, and it was the whole obstacle.** Two of
five `discover_*` functions returned one error and three returned a list of
notes, which forced each runner to open with its own preamble — the whole of
what kept three otherwise-identical bodies apart. Normalising it first, as its
own commit with the corpus rebuilt byte-for-byte unchanged, made the collapse
mechanical. **The correctness claim for both commits is `rebuild.py --force`
over the 1,615 works the scraper owns: every checksum identical, `0 wrote`.**

**A hook says when a check runs; an npm script says how to invoke one.** There
is no CI, so the alternative to the hook is nothing running it. It checks the
**index**, piped from `git show :path`, so an unstaged fix cannot make a broken
commit pass nor an unstaged breakage fail a clean one, and it checks rather
than rewrites. Mechanics and the per-clone opt-in are in `CLAUDE.md`.

**Ruff's rule selection is pinned rather than defaulted** — the defaults have
widened across releases, so relying on them means an upgrade silently changes
what a commit is checked against. Two exclusions are about this corpus rather
than taste: `E501` (verbatim excerpts and source URLs run long) and
`RUF001/2/3` (Latin, Portuguese and Greek prose with curly quotes is the
content, not a homoglyph attack).

**Deleting generated works is a decision for the person directing the work**,
not a judgment call to make mid-task. If you are delegating, name the deletable
set and the protected set explicitly — a brief that only says what to _fix_
leaves deletion as an unstated judgment call, and it will get taken.

**Do not drive the site with browser automation to check UI changes.** The
person directing the work does that verification themselves.
