# Glossa Catholica — development plan

What is left, why it matters, what it depends on, and honest sizing.
`docs/decisions.md` holds the standing design choices; neither file is a
history.

**This file does not restate what shipped.** A phase that lands leaves it
entirely, and earns a line in `decisions.md` only if it left a non-obvious rule.

Sizing: a measured figure says how it was measured; anything else is labelled an
estimate; an unscoped item says so rather than guessing.

## Known gaps

| #   | Gap                                                                    | Why it matters                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Depends on                                                                                                                                                                                                                                                                                               | Sizing                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **What the cross-language oracle should assert when Latin is present** | `check_language_symmetry` reads a section-number mismatch as a parsing defect, which is reasonable between two independent translations. Latin is the text the vernaculars translate, so a Latin/vernacular mismatch may be what translation _is_. Detailed below.                                                                                                                                                                                                                      | Nothing. The comparison is already n-way over every edition present and names the one that deviates alone; what is undecided is what it concludes.                                                                                                                                                       | Not sized, deliberately — a decision before it is a change. The change it implies is small.                                                                                                                                                                                                                                                                                      |
| 2   | **Full-text search** (prebuilt client-side index)                      | Promised in the original v1 scope. Nothing exists: `JumpBox` resolves _addresses_; `site/scripts/` holds no index builder.                                                                                                                                                                                                                                                                                                                                                              | Corpus size. "Prebuilt" needs real index-size engineering, and the corpus is no longer two languages.                                                                                                                                                                                                    | Not sized — no prototype. Index format, build-vs-runtime, and per-work vs corpus-wide indexing are all open.                                                                                                                                                                                                                                                                     |
| 5   | **CCC `related` (marginal concordance)**                               | The print Catechism's margin numbers — the internal concordance pointing each paragraph at others on the same theme — are absent from every vatican.va mirror in all editions. The field is ready and emitted `[]` everywhere, with the absence recorded in each manifest.                                                                                                                                                                                                              | A non-vatican.va source (`link-surface.md` names scborromeo.org, catholiccrossreference.online). Nothing in the pipeline or schema is missing.                                                                                                                                                           | Not sized — depends on the source chosen.                                                                                                                                                                                                                                                                                                                                        |
| 6   | **Compendium Appendix B formulas**                                     | Appendix B's doctrinal formula lists are deliberately separate from the prayers work (`docs/corpus-schema.md`).                                                                                                                                                                                                                                                                                                                                                                         | A dedicated scope and parser for non-prayer formula lists.                                                                                                                                                                                                                                               | Not sized.                                                                                                                                                                                                                                                                                                                                                                       |
| 9   | **Disclosing edition divergence to the reader**                        | A reader following a citation into Psalm 13 or Acts 14 gets real, plausible, **wrong** text with nothing marking it; Acts 14 is 20 consecutive verses where the same number names different text in two editions. Behind it sit **101 unread silent-case candidates** from `--shifted`.                                                                                                                                                                                                 | §5 of `docs/research/bible-edition-divergence.md` needs the classification exported as data the site can read, not a Python dict. The candidates need reading.                                                                                                                                           | Estimate: small for §5 (a data export and one advisory). The 101 candidates are their own pass.                                                                                                                                                                                                                                                                                  |
| 13  | **The CCC's Arabic edition, and six PDF-only documents**               | `ar` still ships as an interface language with no content behind it. Six documents exist only as PDF, the English _Amoris Laetitia_ among them. All seven are in `raw/`, read by nothing.                                                                                                                                                                                                                                                                                               | The reader exists in three shapes: `common/pdf.py`, `ccc/compendium_pdf.py`, `ccc/ccc_pdf.py`, with `rebuild.py`'s `readers` fingerprint. Arabic extends it rather than rewriting it. Four Compendium residues in `docs/research/pdf-editions.md` §8b are in the same code and cheapest taken alongside. | Measured 2026-08-31. **Arabic: 2,852 of 2,865 paragraph numbers, poppler-only** (MuPDF fragments RTL lines). The work is normalisation, not extraction — the Allah ligature decomposes in visual order, so the text's commonest word is mis-spelled ~4,900 times before any pass. Estimate: medium for Arabic, small for the documents.                                          |
| 15  | **A Bible in every interface language**                                | The rest read Scripture in English through `CONTENT_LANG_FALLBACK`. The largest coverage gap left, and the one a reader notices first. The research is finished (`docs/research/bible-texts.md` §One Bible per interface language).                                                                                                                                                                                                                                                     | What remains is Polish, Russian and Romanian. None is blocked on a parser; each is blocked on a decision stated below.                                                                                                                                                                                   | Per language: one scraper against a known source with a known markup shape. All three are MediaWiki (`ru`/`ro` plain wikitext; `fr` transcluded from ProofreadPage). Romanian most expensive — versification survey first. **`sv`, `sl` and `ar` are blocked and are not sizing questions**: `sv` has no doctrinally acceptable text, `sl` and `ar` are blocked on digitisation. |
| 10  | **Denzinger, Roman Catechism, Vatican I**                              | Denzinger is Herder-copyrighted and never a vatican.va publication. The Roman Catechism and Vatican I were not found on vatican.va under any URL tried; Vatican I's absence is not conclusively confirmed (no sitemap search attempted). `docs/research/vatican-documents.md` §2, §5.                                                                                                                                                                                                   | —                                                                                                                                                                                                                                                                                                        | Out of scope, not sized.                                                                                                                                                                                                                                                                                                                                                         |
| 16  | **Provenance marking — which prose on a page is ours**                 | `site/descriptions.json` holds descriptions written here by reading a document, merged onto `manifest.description` at sync time and served on `/documenta`, in `apparatus.json` and in the shell `<head>` as `prose`. It is the one running text on this site nobody else holds rights in, and a reader cannot tell it from the publisher's own summary. A colophon sentence was drafted and removed: a reader meets that prose beside a document, not on the colophon.                 | Nothing on the data side — the descriptions are already their own tier. It is a rendering and copy decision. Interacts with `site/docs/edge.md`'s "names, never text" rule: the edge already serves a description as `prose`.                                                                            | Not sized. The marker is small; deciding what it _says_ is the work, and whether it needs a word in thirty-four dictionaries or can be non-verbal.                                                                                                                                                                                                                               |
| 17  | **A site-wide subject vocabulary**                                     | `site/document-tags.json` is a closed vocabulary keyed by document slug and facets `/documenta` alone. Extending it across CCC divisions, canons and Compendium questions would give the site its first **topical** entry — the only surface serving the two largest reader groups (`docs/research/audiences.md` §1, §5) by subject without waiting for gap 2. It is also gap 5 generalised: the print Catechism's own answer to "what else belongs here", derived rather than scraped. | The vocabulary discipline that already governs `document-tags.json` (`sync-corpus.mjs` exits 1 on an unlisted term, an unknown slug, a case-duplicate or a padded tag) has to extend to whatever new key space the terms attach to.                                                                      | Not sized. The machinery is small; assigning terms to the CCC's paragraphs and the Code's canons is editorial rather than mechanical.                                                                                                                                                                                                                                            |

## Gap 1 — what the symmetry check should assert

Latin has been inside `check_language_symmetry` since the ten-language
expansion, without anyone deciding what its presence should mean.

- **A Latin/vernacular mismatch may be what translation _is_.** Comparing each
  vernacular **against Latin where Latin is present**, rather than every present
  edition against every other, is the plausible better shape.
- **The Bible is the precedent.** Adding `bible.clementina.la` turned an
  unresolvable "both are faithful" into an adjudicable question — the Latin
  takes a side in all 31 chapters where EN and PT disagree: PT 25, EN 6, neither
  0 (`pipeline/docs/oracles.md`).
- **The reason to decide rather than leave it** is that symmetry across the
  document families is chronically FAIL by design, because a missing or
  differently numbered translation is legitimate and common. It is printed as a
  report and the parse gate is `pipeline/parse-baseline.json` instead. A check
  nobody can act on is the state to avoid, and it is the state this one is in —
  so the question is also whether the assertion can be made sharp enough to gate
  on.

**The Compendium has no Latin edition anywhere on vatican.va.** A permanent,
source-level fact to design around, not a scrape target.

## Loose ends from the liturgical calendar

The calendar ships, with a national layer for every country GCatholic publishes
one for; `oracle.test.ts` checks each against GCatholic day by day
(`site/docs/calendar.md`). Only calendars the oracle agrees with are published;
the rest are held in `national/held.ts` with the count of days each differs on.

### Decisions only the person directing the work can take

- **The Roman Martyrology as a second layer.** GCatholic publishes every saint
  and blessed indexed by date of death — the Martyrology's ~7,000 against the
  General Roman Calendar's ~190 — at `gcatholic.org/saints/dates-of-death`. A
  genuinely different feature: orders of magnitude more data, a different
  provenance question (the Martyrology is a book with a publisher, where a table
  of dates and ranks is fact), and it belongs in the corpus rather than the site
  bundle. Depends on nothing; wants deciding on its own terms.
- **The held calendars, one at a time.** What remains is not adding countries
  but finishing the ones already derived. `national/held.ts` groups them by
  cause; three causes are engine work rather than transcription and are worth
  taking as a batch — All Souls transferred off a Sunday, an observance
  suppressed by the day it falls on, and a conference that changed a transfer
  inside the oracle's window. The fourth wants a `MovableRule` that can say "the
  last Sunday of October".
- **A second witness for a derived layer.** The oracle's name check is circular
  for a derived country — it compares a name to the feed the name came from. The
  fix is what `docs/decisions.md` already requires of prayers and the gazette
  sigla: a second source, here each conference's own published ordo. A large
  research job, one country at a time, and the only thing that would make a
  derived layer as well attested as a hand-read one.
- **Diocesan calendars.** Italy's file adds no saint of its own because Italy's
  propers are in its dioceses' calendars. A diocesan layer would be a third tier
  and nothing in the model forbids it; whether the site wants ~2,000 of them is
  a different question from whether it could hold one. Eight are already here
  and not as a tier — GCatholic publishes a particular church's calendar where a
  country has none of its own, so they are national layers by another name and
  `alsoCovers` lets one stand for several places.

### Known limits, stated rather than fixed

- **The per-year tables run out after 2027.** `movedInYear` (Brazil's and the
  Congo's transfers, the Congo's Visitation) and Spain's Ember Days are tables
  of years, not rules, because the evidence rules every rule out: Peter and Paul
  went backward from a Monday in 2026 and forward from a Tuesday in 2027;
  Spain's Ember Days are Monday, Monday, Tuesday. Outside the listed years the
  celebration keeps its own date and the observance is absent. Fixing it
  properly means reading each conference's Ordo every year — an annual chore,
  not code; the alternative puts a solemnity on a date nobody chose.
- **The oracle covers 2025–2027 and nothing else** (GCatholic's iCal window;
  its HTML tables reach 2024–2028). Rare cases outside it are covered by
  hand-written tests in `year.test.ts`. **Saint Joseph's direction is the rule
  the oracle cannot confirm**, 19 March being outside Holy Week in all three
  years: the engine takes n. 60's closest free day in either direction, which
  anticipates him out of Holy Week (15 March 2008) and defers him off a Sunday
  of Lent (20 March 2017 and 2028). Both rest on published practice; the 2028
  half is a second witness (USCCB's own readings for that Monday).
- **A national proper's name is transcribed, not derived.** No Latin original
  and no second published source, so the oracle's name check for those rows is a
  transcription check. Everything the engine does with the row — date, rank,
  colour, precedence, moves, transfers, suppressions — is checked independently,
  and that is the half that can be wrong invisibly.
- **The lectionary is a consumer of this engine, not part of it.** What it still
  cannot say is in `site/docs/lectionary.md` §THE GAPS. It is also the engine's
  second witness: two defects were found by diffing it against USCCB's crawled
  days, not by the oracle.
- **The general calendar is Latin, English and Portuguese.** A national layer
  carries the language its conference approved its propers in (es, it, fr, pl,
  de, en) and an English rendering beside it; every other interface language
  falls through `CONTENT_LANG_FALLBACK`. A translator adding a language adds
  name columns to `grc.ts`, not a mechanism.

## Loose ends from the Bible capture (gap 15)

### Defects in editions already shipped

Found by `pipeline/scrapers/bible/edition_check.py`, which should be run over
any edition anyone touches.

- **`bible.cpdv.en` has no Esther 16, and its Esther 15 is short.** The book
  stops at chapter 15 with 14 verses where `bible.clementina.la` has 19 —
  roughly 29 verses of the Greek additions missing from a live edition, since
  the edition was ingested. Every check the corpus had was per-unit; this is a
  missing unit. Diagnose before fixing: a dropped last chapter and a source gap
  want different responses.
- **`bible.douay-rheims.en` anchors headings on verses that do not exist** —
  `ps` 115 and 147 both carry a heading at `before_verse: 1`, but those Vulgate
  psalms begin at verses 10 and 12. The fix depends on whether the source prints
  the heading above the psalm as a whole (in which case the schema has no field
  for it, and that is the finding) or above its first real verse.

### Chapters whose verses are numbered differently

| Edition                 | Chapter  | Verses | Numbered | Clementine |
| ----------------------- | -------- | ------ | -------- | ---------- |
| `bible.allioli.de`      | Ps 147   | 9      | 12–20    | 1–9        |
| `bible.douay-rheims.en` | Ps 147   | 9      | 12–20    | 1–9        |
| `bible.kaldi.hu`        | Ps 147   | 9      | 12–20    | 1–9        |
| `bible.douay-rheims.en` | Ps 115   | 10     | 10–19    | 1–10       |
| `bible.crampon.fr`      | Ps 55    | 13     | 12–24    | 1–13       |
| `bible.douay-rheims.en` | Wis 18   | 25     | 2–26     | 1–25       |
| `bible.kaldi.hu`        | Heb 13   | 25     | 2–26     | 1–25       |
| `bible.straubinger.es`  | 2 Sam 13 | 38     | 2–39     | 1–38       |

**`Ps 147:1` resolves in the Clementine and resolves to nothing in three other
editions.** The Psalms cases are one convention, not three bugs: where the
Vulgate splits a Hebrew psalm across two chapters, these editions keep the
Hebrew's continuous numbering in the second half. Three independent editions do
it, so it is the editions being editions — but the corpus's address space is the
Clementine's, and nothing reconciles them.

Two things follow. **This is not a parse defect and must not be "fixed" in the
scrapers** — the stored text follows the source. And **it was invisible to every
check the project had**: round-trip, coverage, symmetry and `balance` are all
per-unit or per-count, and a chapter with the right number of verses under the
wrong labels passes all four. It also explains `bible.douay-rheims.en`'s two
heading errors above; fixing the numbering answers the heading question.

**Open decision: where reconciliation belongs** — a per-edition verse-offset map
consulted at read time, or a conversion in `sync-corpus.mjs` alongside the
Psalter conversion Crampon already needs. Same shape of problem; probably the
same answer.

### Decisions, not tasks

- **Polish: what to do about Esther 11–16.** `bible.info.pl`'s Wujek is missing
  108 verses; the gap is in the 1923 Bible Society base and propagates to every
  host that reuses it. The text exists in Wujek's own wording in the 1599
  _editio princeps_, captured at `raw/wujek_1599_ia/`, but as uncorrected OCR of
  16th-century type whose damage reaches the chapter numerals (`VIL`, `XIIL`,
  `XVL`). Three options: ship with the 1599 OCR for 11–16, ship with a
  documented canon gap, or hold Polish until someone proofreads the OCR against
  the scan (also captured, so a re-parse rather than a re-crawl).
- **Russian: how a differently-shaped canon maps onto Vulgate addresses.** The
  Synodal's Esther additions exist as unnumbered bracketed prose inside chapters
  1–10, so no citation to Est 11–16 can reach them; its Baruch has five chapters
  because the Letter of Jeremiah is a separate book, so `Bar 6` needs mapping
  rather than lookup. Neither is loss and neither is a defect. Captured,
  unparsed until both are decided.
- **Romanian: whether it is worth a versification table an order of magnitude
  larger than the corpus's.** 308 of 1,321 chapters (23%) differ in verse count
  from the Clementine, against `versification.json`'s three wholesale-divergent
  books and fifteen mapped verses. Three clusters are expected and not defects
  (Tobit, Judith, Sirach — a longer Greek recension against Jerome's abridged
  Latin) but low-density divergence remains nearly everywhere. It also lacks
  Esther's additions outright. Captured, unparsed, and correctly last.

### Open schema and table questions

- **`PsalmNumbering`'s field name.** It says "Psalm" about an edition whose
  divergence is not confined to the Psalter — 156 of `bible.crampon.fr`'s 294
  diverging chapters lie outside `ps`/`mal`/`joel`. Renaming it is a schema
  decision.
- **`bible.kaldi.hu` gets no `WORK_CONFIGS` row until its notes land.** The
  built edition has no notes at all — 1,333 chapter summaries and 15 headings,
  with zero citation-shaped tokens across all 1,501. Its apparatus is the
  unbuilt `jegyzet` layer.
- **Cross-references have no schema field, and three editions are full of
  them.** Martini prints 27,746 (counted and stripped), Káldi prints its own as
  `<span class=biblink>`, the Synodal carries `{{bible parallels}}`. All of it
  is discarded at parse time. Whether it earns a field is a schema question with
  three witnesses.

### Content captured and deliberately not built

- **Book introductions for two languages.** `raw/allioli/front/` holds 59
  per-book introduction essays and `raw/straubinger/` holds Straubinger's own
  (1 Samuel's runs ~1,400 words). Both belong to `bible-intro.{lang}`, a work
  keyed by language rather than edition. The schema is not hypothetical:
  `bible-intro.en` is built, has its own `manifest.type` branch in
  `sync-corpus.mjs` and its own `bible-intro-index.json`, and carries
  `shared_preface_with`. Two more editions read into a shape that exists.
- **Hungarian's second apparatus layer.** The source is 73 books × 3 pages —
  `szoveg`, `jegyzet`, `jegyzet2` — sharing one anchor scheme. The schema's
  `notes` is one field; the other layer is captured and unread.
- **Crampon's `Dictionnaire du Nouveau Testament`**, a 325 KB NT glossary
  corresponding to nothing in the schema. Captured; no home decided.

### Checks and filings to revisit

- **`audit.py balance` still excludes the Bible**, on the reasoning that Esther
  divergence reads as loss. With nine editions an edition-specific defect has
  eight witnesses against it, which is the configuration that found all three
  Catechism defects — so the exclusion now costs more than it saves. The
  reasoning was also half right: Esther holds real loss _and_ real divergence at
  once, and only reading the text tells them apart.
- **Martini's 13 dropped notes want hand-adjudication.** Each has a printed
  locator naming a verse absent from its page — 2 Corinthians 6's notes numbered
  `6,19`–`6,23` are verbatim about 2 Cor 7:1–4. The scraper logs them as
  anomalies rather than guessing.

## The document structure trees

`docs/research/document-structure-defects.md` §2 is still the largest open item.
Below is what a fix would have to cover.

**Two defects are visible on the page rather than in the tree:**

- **18 works open §1 with a wall of their own table of contents** —
  `sacramentum-caritatis.hu` prepends 60 of its own headings to its first
  paragraph, `africae-munus.en` 37, `africae-munus.es` 31. The document's
  opening sentence is below the fold.
- **`santateresa-delbambinogesu.en` is missing three of its four chapter
  headings from the build** — present in `raw/` once each, absent from
  `sections.json` and `structure.json` both. The only confirmed text loss found,
  and no count check sees it because `sections.json` still totals 53.

Everything else is the tree, which the sidebar contents renders, which a
per-division reading view would split on, and which `static/route-titles.json`
publishes as each division's paragraph span — so a wrong tree is served to
consumers that never render the page.

**Populations, measured across all 1,447 works:**

| Defect                                                       | Works     | How it was measured                                         |
| ------------------------------------------------------------ | --------- | ----------------------------------------------------------- |
| Leaked ToC entries left in §1's body                         | 18        | §1's text contains 2+ titles of later headings              |
| ToC entries promoted to headings (44 nodes)                  | 6         | a title still ending in its target's span, `[31]`, `[1-6]`  |
| First of two adjacent pre-body headings swallowed            | 6         | oracle `MISSING` at `before=1`, then read on the raw page   |
| Closing block nested a tier too deep                         | 10        | 3+ nodes after the last level-1, >1 tier below its siblings |
| Tiers flattened — **3 confirmed, 25 strong, 157 candidates** | see below | census markup column, one document at a time                |

**Three works still carry a node their rule should have taken, and all three are
§2 cases.** `ecclesia-in-america.es` and `querida-amazonia.ar` keep a trailing
outline because their bodies' sub-headings were never detected at all, so it has
nothing to be a duplicate of; `lumen-gentium.pt` keeps its papal signature
because the Fathers' subscriptions below it are numbered. Each wants the
detector fixed, not the guard widened.

**Two numbers deliberately not given.** Tier flattening is the important
population and the least knowable: 157 works have 40+ headings and only two
levels, but a long document with two _genuine_ tiers looks identical from
outside. The tighter signal is total collapse — **25 works carry 25+ headings
with every one at level 1**, including `sacrosanctum-concilium.hu` (130) and
three editions each of `evangelii-nuntiandi` (91) and `christifideles-laici`
(74). The promoted-prayer-stanza defect has 2 confirmed and no population,
because the obvious test ("an address-less heading that is a full sentence")
returns 67 works of which most are correct — Latin, French and Italian end a
real heading with a full stop by convention.

**What to do first.** §2's recommendation stands: compare structure trees across
languages rather than section sets, turning a manual audit into a ranked
worklist. **The oracle ranks but does not adjudicate** — `evangelii-nuntiandi`
reads exactly like §2's `fratelli-tutti` case (de/es/fr/it/lv at 91 headings, hr
100, pt 89, **en at 1**) and is not a parse failure: the English mirror contains
six bold runs in the whole document, all furniture. It is an unstructured
rendering of the same text. So the cross-language pass produces candidates and
the raw page decides. `evangelii-nuntiandi.la` (7) and `.hu` (8) want that check
before anyone calls them damaged.

**The single highest-value fix** is the tier discriminator: three readers
working independently named the same rule, that `<p align="left"><b><i>…</i></b></p>`
is the middle tier and `<p align="left"><i>…</i></p>` the tier below it, and the
parser treats them as one. One predicate, and the difference between a two-level
tree and a usable one in `ecclesia-in-oceania.en` (19 headings),
`gaudete-et-exsultate.en` (30) and `familiaris-consortio.en`.

**Sizing.** Nothing here gates anything else and nothing is blocked. Every item
is a change to `vatican_docs.py`, which parses ~450 documents across several
page templates, so each costs the blast-radius measurement in
`docs/writing-descriptions.md` — snapshot, `rebuild.py --only documents`, diff —
now ~18s. **The ToC oracles are the regression suite this work needs**:
`audit.py toc` derives the count — 70 of 377 disagreeing on 2026-09-07 — and a
correct fix lowers it where an overreaching one raises it. Per-item sizing is
estimated, not measured: the tier discriminator is one predicate plus a
re-levelling pass; `santateresa`'s unemphasised headings are a detector change
whose blast radius is genuinely unknown, because loosening the emphasis
requirement is exactly what would start reading ordinary prose as headings.

**Two source defects left alone as reader-invisible.**
`christifideles-laici.en` prints "Lay Faithtul" and `"Criteria of
Ecclesiality"for Lay Groups`.

## The prayers glossa — what is left

Tier 0 is built: `commentary.preces.{lang}`, from `pipeline/scrapers/prayers_glossa.py`.
The survey is `docs/research/prayers-glossa.md`; the rules are in
`pipeline/CLAUDE.md` §The prayers' glossa and `site/CLAUDE.md` §Haydock on the
page.

1. **The Catechism on the Our Father and the Creeds, as LINKS not notes.**
   §2.1 and §2.3: the headings are the petitions and the articles, and the
   bodies are forty and two hundred paragraphs. `docs/link-surface.md` governs,
   and the four Scripture prayers join the same surface.
2. **Then decide whether to go outside the corpus at all.** §3 ranks four
   public-domain works by cost — the Roman Catechism, the three Lenten
   conferences of Aquinas, Britt on the Breviary hymns, Liguori on the Salve
   Regina. Each carries a fetch and a rights check.

Two facts about the scope:

- **The collection is 35 prayers and 20 editions; the apparatus reaches two
  prayers and fifteen editions.** The seven Vatican News devotions and the four
  editions that come only from there are §4's territory — modern formulas with
  no classical commentary — so they widen the collection without widening what a
  glossa can cover. **An apparatus that covers part of a collection is a fact
  about the sources; one that pads the rest is a fabrication.**
- **`latin_witnesses` is a second apparatus already in the curated files**, and
  it is not a glossa: 122 recorded departures of each edition's printed Latin
  from the canonical text. Whether a reader ever sees it is a separate question,
  and answering both together would confuse an editorial record with a
  commentary.

## The `petitions` block is a projection loss

Open, found 2026-09-06. `build/prayer.common.en` stores the Litany of Loreto's
response once over 54 invocations, with a flag on the one the source printed it
after:

```
{ "kind": "petitions", "response": "pray for us.",
  "invocations": [ { "text": "Holy Mary,", "response_printed": true },
                   { "text": "Holy Mother of God," }, … ] }
```

`BlockOut.to_dict` keeps `text`/`html` beside it so consumers predating the kind
are unaffected. **The site is that consumer**: it reads the `html`, prints 108
alternating lines, and the reader sees an undifferentiated column where the
source has a call and a refrain.

**The kind is declared and nothing renders it.** `PrayerBlockKind` names
`petitions`, so the gap answers a `switch` rather than flowing through cast as
`prose` — which makes what follows a decision to take rather than a defect to
find.

**One structure, five presentations, inside one prayer.** The English Litany
alone stores its call-and-response as a `prose` block whose lines alternate (the
Kyrie); unlabelled `versicle`/`response` blocks, which reserve no label column;
the `petitions` block above; and `prose` runs of invocations with the response
elided. The Angelus, two prayers away, uses _labelled_ `versicle`/`response`.
Every one is faithful to a page somebody typeset; what is missing is a rendering
that makes them read alike.

**Coverage is the part to decide first: 14 of the 20 editions carry no dialogue
structure at all.** `be hi hu id la lt ro ru sl sv vi zh zht en-gb` are 100%
`prose`. Six editions (`de en es fr it pt`) hold every `versicle`, `response`
and `petitions` block in the collection. So this is a curation question before
it is a rendering one, with §4's shape: improving what six editions show while
fourteen show what they always did. Not scoped, deliberately.

## Recommended order

A priority argument, not a dependency one — nothing here gates anything else.

1. **The structure trees' two reader-visible defects** — the leaked contents
   opening §1 (18 works) and `santateresa-delbambinogesu.en`'s three lost
   headings; then the tier discriminator. Above everything that adds coverage,
   because both are what a reader meets on the page, and the ToC oracles tell a
   fix from a regression.
2. **#9's reader-facing disclosure**, and alongside it the 101 unread
   silent-case candidates — reading them is the only way to find another Acts
   14, and there is no tool left to write for it.
3. **#15's three remaining languages** — Polish, Russian, Romanian. What is left
   is not scraping but the three decisions above, none of which is a parser's to
   take. (Spanish shipped with `bible.straubinger.es` recorded as
   `copyright.status: copyrighted`, a knowingly accepted self-resolving
   exposure; the term lapses 1 Jan 2027.)
4. **#13's Arabic Catechism and its six documents** — the normalisation layer
   has somewhere to grow, and the documents are the smaller surface.
5. **#2 search** — the largest unscoped item; needs a prototype before it can be
   planned.
6. **#1's cross-language oracle** — what the symmetry check should assert.
7. **#5 `related` / #6 Appendix B** — lowest urgency; each needs a research pass
   in `docs/research/` style before implementation is scopeable.
