# Decisions

The standing answer to "why is it like this", for choices that are not obvious
from the code. Not a history — git holds that, and the commit that changed a
rule holds the measurement that justified it.

This file holds only what is true of the whole project. Everything else lives
beside the code it governs:

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
| `site/docs/census.md`          | counting the library, and how a ranking is cut               |
| `site/docs/shell.md`           | the SPA shell, boot payload, chunking, offline               |
| `site/docs/edge.md`            | the worker, its cost, rate limiting, the head, the sitemap   |
| `site/docs/reading.md`         | lanes, apparatus, cards, the Bible's chrome, plates          |
| `site/docs/finding.md`         | the jump box and `/documenta`'s facets                       |
| `site/docs/calendar.md`        | the liturgical calendar                                      |
| `site/docs/lectionary.md`      | the day's readings, the rules that derive them, and the gaps |
| `site/docs/usage.md`           | the usage beacon and its legal assessment                    |
| `site/docs/linking-out.md`     | the only outbound links, and what licenses one               |
| `site/docs/colophon.md`        | can. 216, the disclaimer, the marks                          |
| `site/docs/dev-loop.md`        | sync, caches, HMR, serving and checking locally              |

Companions: `PLAN.md` (what is left), `docs/corpus-schema.md` (the data
contract), `docs/link-surface.md` (the reference apparatus), `docs/research/`
(the measurements), `docs/writing-voice.md` (how prose a reader reads is
written) and `docs/writing-descriptions.md` (how a description is read out of
the corpus), `CLAUDE.md` (what has actually bitten someone).

---

## Posture

**Church-owned texts are hosted verbatim, with full attribution, without asking
first; we comply promptly if a rights holder asks.** A deliberate position,
argued in `docs/research/copyright.md` §5. It covers **Church-owned magisterial
material only**: a Bible or a patristic translation owned by a commercial
publisher must be public domain. Matos Soares 1956 (PD 2028) is one knowingly
accepted, self-resolving exposure; Alexandre Correia's Summa (PD 2055) and
Paulus's _Coleção Patrística_ are blockers.

**Free, ad-free, account-free.** No advertising, no accounts, no third-party
code, no cookies, nothing that identifies a reader. There is a first-party,
bucketed, unlinkable usage measurement; `site/docs/usage.md` argues why it costs
the privacy position nothing.

**Indexable, and a duplicate of vatican.va on purpose.** Every page reproduces
text with a canonical home on someone else's server. What this site adds is the
apparatus — resolved citations, the reverse index, parallel editions, offline
reading — and a reader who searches a paragraph number should land somewhere
carrying all of it. So `robots.txt` carries no `Disallow` and the build sends no
`noindex`. Both were blanket-set before launch so a verification-only hostname
would not become the indexed one; that remains the single condition for
restoring them.

**A text we cannot show properly is not shown.** `site/unpublished.json`
switches a work off; its addresses redirect to the source page. Built for rights
and used for **quality** — a damaged parse is worse than an absence, because a
reader cannot see what is missing. Entries are temporary, each with its measured
defect. `site/src/lib/calendar/national/held.ts` is the same argument for output
that is not a text.

**There is no whole-site lever, and that is a real gap.** Nearly the whole
corpus is Libreria Editrice Vaticana material under one notice, so the request
the posture anticipates would concern almost everything at once. A per-work id
list is not the shape of that decision.

**The name is a promise about arrangement.** The _Glossa Ordinaria_ set
commentary around the sacred page, attributed and never mixed into it. So **a
gloss must never be confusable with its source, visually or structurally** —
Challoner's notes, Matos Soares' notes, and anything annotative added later.

## Scope

**In**: the Bible, the CCC, the Compendium, all encyclicals across all
pontificates, the 16 Vatican II documents, the 2 First Vatican Council
constitutions, apostolic exhortations, the prayers, the Summa (EN + LA), the
Compendium of the Social Doctrine, the Code of Canon Law, and the doctrinal
office's cited documents.

**Every encyclical the Holy See publishes is on the site in some language** —
English where it exists, otherwise the language it does exist in. Discovery
consults the Italian index per pontificate for anything English does not list;
measured, Italian is the only language reaching a document English does not.
This is not a "crawl more languages" switch.

**Translations beyond that are fetched, not published, by default.** Acquiring
sources and deciding what to publish are separate decisions on separate
timescales. A page's own language bar under-reports by a factor of six.

**One encyclical is on the index twice and the corpus takes it once.**
_Firmissimam Constantiam_ is published under both its Latin and its Spanish
incipit; both answer 200 and the two parses were byte-identical. Three reusable
parts: it is **dropped at discovery, not deleted afterwards**, so `raw/` keeps
the second page as evidence and only the second _address_ goes; it is a table
(`INDEX_DUPLICATE_SLUGS`) because an index that did this once can do it again;
and it is the only one, checked by hashing every work's `sections.json` and
`appendix.json`.

**Out, each for a reason that will not change on its own:**

- **The Fathers** — a library, not a work. 69% of 734 cited works are cited
  exactly once; there is no top-forty subset. Parse the citation strings
  instead; 72.8% already carry a work-internal locator.
- **Denzinger** — Herder-copyrighted, never a vatican.va publication.
- **General audiences** — thousands of talks, low citation density.
- **The Roman Catechism** — not found on vatican.va under any URL tried.
- **IntraText as a source** — quality there is per **work**, not per site: the
  same library holds a faithful copy of the Holy See's edition and a truncated
  unattributed transcription.
- **Machine-translated sources** — disqualified on provenance, read per work:
  liriocatolico, the source of `bible.matos-soares.pt`, now publishes
  AI-translated text elsewhere on the site.
- **A critical edition of anything.** Taking the better reading at each
  disagreement produces a text no page prints, whose provenance is a rule rather
  than a URL. `prayer.common.la` therefore takes one witness's characters and
  only the other's _segmentation_, which the base witness cannot be wrong about.

### Four lessons from taking something in

**A scope decision can rest on wrong facts, and a guessed URL's 404 is evidence
about the guess.** The Code of Canon Law was out for "no Portuguese edition" and
"not Latin (`cic_index_lt.html`, 404)". Both wrong: the Latin index is
`cic_index_la.html`, and a Portuguese PDF exists with a clean text layer. The
survey probed URLs derived from a naming convention where the origin prints an
index of every edition it has. **Where an origin prints an index, that index is
the answer and a derived address is a hypothesis.** Related: each edition links
a PDF called _Nova versio Libri VI_ beside the HTML, from which the obvious
reading is that the HTML is superseded. It is not. **A page that says what it is
beats a filename that implies it.**

**A work type is a statement about addressing, not about storage.** The
Compendium of the Social Doctrine is structurally a document, but is cited the
way the Catechism is (`CSDC 160`). So `type: "social-doctrine"` is **the
Catechism's addresses over a document's files** — the sync's branch writes what
the document branch writes and registers what the Catechism branch registers,
with no second content tier and no second copy of any reader.

**Which documents to hold can itself need measuring.** For three families
"discover" and "publish" were the same verb. The doctrinal office's Complete
List is 239 documents, most of them notifications about one theologian's book,
so the corpus was asked what it refers to: all 119,321 citation strings were
searched, the 25 documents held carry about 840 of the 1,121 hits, and every one
is cited **by paragraph number** — which is what makes a document a link target.
The notifications carry none.

**Reading an index is not reading a page.** That index was first read through a
Markdown extractor which dropped roughly half of it, producing a confident,
well-evidenced and wrong finding, a table of hardcoded URLs to work around it,
and a note here explaining the Holy See's editorial lapse. **A cleaned rendering
of a page is evidence about the rendering.** The scraper reads `raw/`, so the
scraper is what should have been asked.

**What is not held is reported by a command, not written down.**
`discover-cdf --unselected` names the documents the corpus does not hold. A
table of that residue would be wrong by the next promulgation, silently, in a
file nothing re-reads.

**A withholding signature has to be conjunctive.** Editions are switched off on
two cross-edition signatures together — text loss against the median edition of
the same document, _and_ addresses that are wrong while the text is whole. One
section holding half a document's text is not a defect where every edition
agrees the document has three sections. Two entries also came out of
`unpublished.json` in that change, having been repaired by someone else's parser
work with nothing re-reading them: the file says its entries are temporary, and
that only holds if something checks.

## Process

**Shared code is decided by entitlement, not by identical bodies.**
`apply_corrections` moved because everything in it comes from above the edition —
the drift guard, the locator shape, the schema. `validate` did not, though it
was byte-identical, because it is exactly where an edition's claims about its own
text live and is _expected_ to diverge.

**The rule cuts the other way too.** `vatican_docs.py`'s three index-driven
runners were 85–94% identical, but similarity was not the argument for merging
them: all three families are **discovered from an index that names every
edition's URL**, so a run is fully determined before the first fetch. Phase 2
does not have that entitlement — it discovers per pontificate and derives each
translation's URL by substitution — and stayed where it was.

**The table carries only what a family is, never how its pages are read.** Two
`family == "vati"` branches stay inside the parser, each carrying a paragraph on
why the general rule reads those pages _wrongly_ rather than badly. A descriptor
field would turn a documented exception into a configuration flag.

**Normalising the return type was the whole obstacle.** Two of five `discover_*`
functions returned one error and three returned a list of notes, which forced
each runner to open with its own preamble. Normalising that first, as its own
commit with the corpus rebuilt byte-for-byte unchanged, made the collapse
mechanical. The correctness claim for both commits is `rebuild.py --force` over
the 1,615 works the scraper owns: every checksum identical, `0 wrote`.

**A hook says when a check runs; an npm script says how to invoke one.** There
is no CI, so the alternative to the hook is nothing running it. It checks the
staged index, and it checks rather than rewrites. Mechanics in `CLAUDE.md`.

**Ruff's rule selection is pinned rather than defaulted** — the defaults have
widened across releases, so relying on them means an upgrade silently changes
what a commit is checked against. Two exclusions are about this corpus rather
than taste: `E501` (verbatim excerpts and source URLs run long) and
`RUF001/2/3` (Latin, Portuguese and Greek prose with curly quotes is the
content, not a homoglyph attack).

**Deleting generated works is a decision for the person directing the work**,
not a judgment call to make mid-task. When delegating, name the deletable set
and the protected set explicitly.

**Do not drive the site with browser automation to check UI changes.** The
person directing the work does that verification themselves.
