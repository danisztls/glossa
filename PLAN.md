# Glossa Catholica — development plan

What is left, why it matters, what it depends on, and honest sizing.
`docs/decisions.md` holds the standing design choices; neither file is a
history.

**This file does not restate what shipped.** A phase that lands leaves it
entirely, and earns a line in `decisions.md` only if it left a non-obvious rule.

Sizing: a measured figure says how it was measured; anything else is labelled an
estimate; an unscoped item says so rather than guessing.

## Known gaps

| #   | Gap                                                                    | Why it matters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Depends on                                                                                                                                                                                                                                                                                                                                                                       | Sizing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **What the cross-language oracle should assert when Latin is present** | `check_language_symmetry` reads a section-number mismatch as a parsing defect, which is reasonable between two independent translations. Latin is the text the vernaculars translate, so a Latin/vernacular mismatch may be what translation _is_. Detailed below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Nothing. The comparison is already n-way over every edition present and names the one that deviates alone; what is undecided is what it concludes.                                                                                                                                                                                                                               | Not sized, deliberately — a decision before it is a change. The change it implies is small.                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2   | **Full-text search** (prebuilt client-side index)                      | Promised in the original v1 scope. Nothing exists: `JumpBox` resolves _addresses_; `site/scripts/` holds no index builder.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Corpus size. "Prebuilt" needs real index-size engineering, and the corpus is no longer two languages.                                                                                                                                                                                                                                                                            | Not sized — no prototype. Index format, build-vs-runtime, and per-work vs corpus-wide indexing are all open.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 5   | **CCC `related` (marginal concordance)**                               | The print Catechism's margin numbers — the internal concordance pointing each paragraph at others on the same theme — are absent from every vatican.va mirror in all editions. The field is ready and emitted `[]` everywhere, with the absence recorded in each manifest.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | A non-vatican.va source (`link-surface.md` names scborromeo.org, catholiccrossreference.online). Nothing in the pipeline or schema is missing.                                                                                                                                                                                                                                   | Not sized — depends on the source chosen.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6   | **Compendium Appendix B formulas**                                     | Appendix B's doctrinal formula lists are deliberately separate from the prayers work (`docs/corpus-schema.md`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | A dedicated scope and parser for non-prayer formula lists.                                                                                                                                                                                                                                                                                                                       | Not sized.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 9   | **The divergences nobody has found yet**                               | A reader following a citation into a chapter the editions divide differently now meets a line saying so, in their own language, in both reading modes. That covers the 34 chapters `divergence.py` knows. An unfound one is still real, plausible, **wrong** text with nothing marking it, and Acts 14 — 20 consecutive verses where one number names different text in two editions — was found by a person reading.                                                                                                                                                                                                                                                                                                                                  | Nothing on the delivery side: a confirmed find is a row in `divergence.py`'s table, and `--export` carries it to the reader with no further code. It needs the leads read. `audit.py balance` triages its 151 into 25 `moved`, 47 `absent` and 77 `mixed`; 124 of them are unread.                                                                                               | Not sized — per lead, and the reading is the whole of it. Two read so far: one was Crampon abridging Sirach 6, and the other was not a divergence at all but the argument leak `crampon.py` now takes back out.                                                                                                                                                                                                                                                                                                                                      |
| 13  | **The CCC's Arabic edition, and the PDF-only document editions**       | `ar` reads 24 documents and no Catechism. Twenty-seven document editions exist on vatican.va as PDF and as nothing else — ten on the modern shell, seventeen on the Vatican II mirror. **26 are now in `raw/`** and four are read exactly (`docs/research/pdf-editions.md` §10): the 27th is published empty and `evangelii-gaudium.ar` is a scan.                                                                                                                                                                                                                                                                                                                                                                                                     | `common/pdf_document.py` renders a PDF as the markup `parse_document` reads; the Catechism's readers are `scrapers/common/pdf.py`, `scrapers/ccc/compendium_pdf.py`, `scrapers/ccc/ccc_pdf.py`, with `rebuild.py`'s `readers` fingerprint. Arabic extends them rather than rewriting them. Four Compendium residues in `docs/research/pdf-editions.md` §8b are in the same code. | Measured 2026-09-08 for the documents: four editions equal their siblings on both section set and citation count; three want their note apparatus read (one finds no markers, one finds 508 against a sibling's 288), and no stage writes any of them to `build/` yet. The 16 Chinese and 4 RTL editions are unread. **Arabic Catechism, measured 2026-08-31: 2,852 of 2,865 paragraph numbers, poppler-only** (MuPDF fragments RTL lines) — the work is normalisation, not extraction, the Allah ligature decomposing in visual order ~4,900 times. |
| 15  | **A Bible in every interface language**                                | The rest read Scripture in English through `CONTENT_LANG_FALLBACK`. The largest coverage gap left, and the one a reader notices first. The research is finished (`docs/research/bible-texts.md` §One Bible per interface language).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | What remains is Polish, Russian and Romanian. None is blocked on a parser; each is blocked on a decision stated below.                                                                                                                                                                                                                                                           | Per language: one scraper against a known source with a known markup shape. All three are MediaWiki (`ru`/`ro` plain wikitext; `fr` transcluded from ProofreadPage). Romanian most expensive — versification survey first. **`sv`, `sl` and `ar` are blocked and are not sizing questions**: `sv` has no doctrinally acceptable text, `sl` and `ar` are blocked on digitisation.                                                                                                                                                                     |
| 18  | **Documents are discovered from one language's index**                 | `vatican_docs.py` reads the ENGLISH index and derives every sibling-language URL by substituting the language segment into the English path, so our map of what exists is one language's map. Where the two indexes spell a document's URL differently the sibling probe 404s, and the absence is recorded as the source's. Ten Pius XI encyclicals are affected, _Non Abbiamo Bisogno_ — written in Italian — among them. Detailed below.                                                                                                                                                                                                                                                                                                             | Nothing in the schema or the parser. It is a discovery pass and a re-probe, and it needs the network: these URLs were never fetched, so `raw/` cannot answer for them.                                                                                                                                                                                                           | Measured 2026-09-08: **at least 19 editions** are provably reachable and currently recorded as absent (10 `it`, 6 `la`, 3 `es`, off the Italian indexes alone). The document count is unlikely to move for encyclicals — the two indexes list the same 217/218 — and is **unmeasured for the other 76 documents**, whose indexes are cached in one language only.                                                                                                                                                                                    |
| 10  | **Denzinger, Roman Catechism, Vatican I**                              | Denzinger is Herder-copyrighted and never a vatican.va publication. The Roman Catechism and Vatican I were not found on vatican.va under any URL tried; Vatican I's absence is not conclusively confirmed (no sitemap search attempted). `docs/research/vatican-documents.md` §2, §5.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | —                                                                                                                                                                                                                                                                                                                                                                                | Out of scope, not sized.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 16  | **Provenance marking — which prose on a page is ours**                 | `site/descriptions.json` holds descriptions written here by reading a document, merged onto `manifest.description` at sync time and served on `/documenta`, in `apparatus.json` and in the shell `<head>` as `prose`. It is the one running text on this site nobody else holds rights in, and a reader cannot tell it from the publisher's own summary. A colophon sentence was drafted and removed: a reader meets that prose beside a document, not on the colophon.                                                                                                                                                                                                                                                                                | Nothing on the data side — the descriptions are already their own tier. It is a rendering and copy decision. Interacts with `site/docs/edge.md`'s "names, never text" rule: the edge already serves a description as `prose`.                                                                                                                                                    | Not sized. The marker is small; deciding what it _says_ is the work, and whether it needs a word in thirty-four dictionaries or can be non-verbal.                                                                                                                                                                                                                                                                                                                                                                                                   |
| 17  | **A site-wide subject vocabulary** — _partly done_                     | `/quaestiones` landed 2026-09-09 and is the first topical entry: the whole candidate set over four doorways, each topic anchoring spans of the Catechism, with the Scripture and the magisterial citations derived from those paragraphs' own footnotes rather than assigned (`site/docs/topics.md`; the count is in the sync's summary line). The editorial pass is finished apart from the held set. WHAT REMAINS is the generalisation this row asked for — the same key space over the Code's canons and the Compendium's questions, and a vocabulary shared with `document-tags.json` rather than a second one beside it — plus the thirty-five dictionaries that do not yet carry the keys, which is what holds the route out of `CHROME_PATHS`. | The doorway vocabulary is closed and `sync-corpus.mjs` exits 1 on an unlisted doorway, an unknown CCC paragraph, an unknown canon, an unknown document slug, or a `lead` outside its own spans. Extending the key space has to keep that discipline.                                                                                                                             | Machinery done. What is left is editorial: a topic per reader question, and a held topic waits on a document the corpus does not yet have.                                                                                                                                                                                                                                                                                                                                                                                                           |

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

- **Three of `bible.matos-soares.pt`'s notes are a headword with nothing after
  it** — `esth` 12:6, `1pet` 2:2 and `1pet` 3:4 each carry the whole note in
  `lemma` and an empty `text`, so the card opens on nothing. The shape says
  what happened: `Até aqui o proémio.` is a remark about the passage and not a
  quotation from it, and the parser reads a note's opening clause as its
  headword. **A field that is optional in the schema and mandatory in the
  parser is where this class hides** — fix it where the split is decided, not
  by moving three strings.

### Chapters at an address the Clementine does not give them

Six are reconciled: three editions keep the Hebrew's continuous numbering
through the second half of a psalm the Vulgate splits, and two chapters diverge
at a single verse. `versification.ts`'s `RENUMBERED` holds the rows and
`sync-corpus.mjs` applies them, beside the Crampon and CPDV branches.

What is left is the same defect where no count-based check can see it.
`edition_check.py`'s RENUMBERED note fires only where an edition and the
Clementine agree on a chapter's verse COUNT, which is a coincidence — 2 Samuel
13 qualified because a merge and a split cancelled out. **A chapter whose verse
labels are not `1..n` and whose last label is not the Clementine's last** is the
test that does not depend on the coincidence, and it finds nineteen more:

| Edition                | Shape                      | Chapters                                                     |
| ---------------------- | -------------------------- | ------------------------------------------------------------ |
| `bible.straubinger.es` | begins at verse 2          | Jer 47, Job 18, Job 19, Ps 85, Ps 96, Ps 102, Ps 121, Zeph 2 |
| `bible.straubinger.es` | a label skipped, and short | Josh 4, Judg 5, Lev 2, Num 13, Num 20, Sir 29                |
| `bible.allioli.de`     | a label skipped, and short | Sir 29                                                       |
| `bible.kaldi.hu`       | a label skipped, and short | Sir 29                                                       |
| `bible.crampon.fr`     | a label skipped, and short | Lev 6                                                        |

**A skipped label is usually the edition staying aligned, not losing its
place.** 62 of Straubinger's 77 label-gapped chapters run to the Clementine's
own last verse: the edition joins two verses, skips the number it did not use,
and every verse after the join is back at its Clementine address. That is why
these nineteen have to be read one at a time rather than offset.

The first group is a different animal again and is probably not an addressing
question at all: Straubinger's Ps 85 verses 2–17 are the Clementine's 2–17
(`Custodi animam meam` at 2 in both) and only verse 1, the superscription with
`Inclina Domine aurem tuam`, is missing. Read those as absent text before
reading them as wrong numbers.

**Not a parse defect, and it must not be "fixed" in the scrapers** — the stored
text follows the source, checked at `raw/`: Straubinger's own page prints no
verse 4 in 2 Samuel 13 (`id="v-3"` then `id="v-5"`). It was invisible to every
check the project had: round-trip, coverage, symmetry and `balance` are all
per-unit or per-count, and a chapter with the right number of verses under the
wrong labels passes all four.

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

- **The German book introductions.** `raw/allioli/front/book-intro/` holds 59
  essays covering all 73 books — nine of them are one preface printed across
  several volumes, `Moses` across the whole Pentateuch, which extends
  `shared_preface_with` from the 2→1 Challoner needed to 5→1. They read into a
  shape that exists and is now occupied twice (`bible-intro.en`,
  `bible-intro.es`): a `manifest.type` branch in `sync-corpus.mjs`, its own
  `bible-intro-index.json`, and chapter 0 as the address. What the wikitext
  costs over Spanish's plain prose is the stripping — headings, drop-caps,
  `[[:Kategorie:BIBLIA SACRA:…]]` locators — and one decision: `Korintherbrief`
  carries an internal `==Erster Korintherbrief==` heading, so it either splits
  into two introductions or is declared a shared preface. `einleitung.wikitext`
  is a 12,724-word introduction to the whole Bible, and chapter 0 addresses a
  book, so it has nowhere to go.
- **The 17 Spanish introductions the source will not release.**
  `bible-intro.es` publishes 56 of 73; 15 are stored truncated at 4,000
  characters and 2 are not Straubinger's prose (`introductions_es.py`,
  `docs/research/bible-texts.md`). Neither digital witness has the rest, so the
  remainder waits on the print edition — a digitisation, not an ingestion. The
  scraper fails rather than stays quiet if the site ever stores them whole.
- **Hungarian's second apparatus layer.** The source is 73 books × 3 pages —
  `szoveg`, `jegyzet`, `jegyzet2` — sharing one anchor scheme. The schema's
  `notes` is one field; the other layer is captured and unread.
- **Crampon's `Dictionnaire du Nouveau Testament`**, a 325 KB NT glossary
  corresponding to nothing in the schema. Captured; no home decided.

### Checks and filings to revisit

- **Martini's 13 dropped notes want hand-adjudication.** Each has a printed
  locator naming a verse absent from its page — 2 Corinthians 6's notes numbered
  `6,19`–`6,23` are verbatim about 2 Cor 7:1–4. The scraper logs them as
  anomalies rather than guessing.

## Gap 18 — closed 2026-09-09, and what it left behind

**The gap was that the map was drawn from one index.** `vatican_docs.py`
discovered a document from a pontiff's ENGLISH index and derived every other
language's URL by substituting the language segment, so the corpus's answer to
"what exists" was one language's answer and its answer to "in which languages"
was a guess checked only against a URL that guess had built. Ten of Pius XI's
encyclicals were read wrong by it: vatican.va writes the date digits into the
path, and for those ten the English index writes them the other way round from
every other language's, so `/it/…29061931…` went into `absent-sources.json` as
a definitive 404 — sixteen languages apiece, for pages that exist. _Non Abbiamo
Bisogno_, an encyclical Pius XI wrote in Italian, was held in English alone.

**What closed it**: `MODERN_FAMILIES` reads a measured chain of indexes per
family rather than one, `_chain_refs` merges the URL every index gives, and
`submit_doc` now prefers an index-given URL to a derived one — an index-given
URL is a fact and a derived one is a guess. Eighteen editions came back for
eighteen requests, the ten Italian ones among them. The stale 404 rows stay:
they are true about the URL they name, which is a URL nothing asks for now.

**What it left behind is the denominator, and the map is where it is now
answered.** `build/magisterium-map/` lists every document the six families'
indexes name, in every language any of them lists it in, so
`/bibliotheca/census` can be checked against what the source publishes rather
than against what we crawled. Two editions the map counts are not built and
should not be — `verbum-domini.la` and `amoris-laetitia.en` are `pdf-only` and
the translations ledger says so. **The map cannot tell an HTML edition from a
PDF-only one**, because an index links both the same way; the ledger can, and
nothing joins the two yet.

**The families the map does not cover are the live half of this gap** —
`docs/research/vatican-documents.md` §9 is the inventory.

## The document structure trees

`docs/research/document-structure-defects.md` §2 has its check now —
`audit.py trees`, which compares the flat `structure.json` the documents store
by the section number each heading precedes — and four parser classes have come
out of it. Below is what the worklist still holds.

What is at stake is the tree, which the sidebar contents renders, which a
per-division reading view would split on, and which `static/route-titles.json`
publishes as each division's paragraph span — so a wrong tree is served to
consumers that never render the page.

**The worklist on 2026-09-08: 529 editions across 126 works depart from their
siblings' outline**, 63 of them holding no outline at all. It ranks and does not
adjudicate, so every row ends at the raw page: `evangelii-nuntiandi.en` is first
on the list and correct — six bold runs in the whole English mirror, all
furniture. `evangelii-nuntiandi.la` (7 anchors) and `.hu` (8) want the same
check before anyone calls them damaged.

**One markup class named and not taken**: the bold and bold-italic residue,
`fratelli-tutti.sl` at 67 of its siblings' 87 anchors with 26 nobody else has,
`ecclesia-in-africa.de` at 76 of 100.

**21 editions in 18 works hold a fraction of their siblings' SECTIONS**, marked
`COLLAPSED SECTIONS` in the report. There the outline is a symptom and the
defect is upstream of the heading detector — `lumen-gentium.ar` and
`ecclesiam.fr` store one anchor against peer medians of 67 and 45 — so they
belong to `coverage` and are not sized here. Two came out as a single wrong
number apiece, one the parser's and one the source's, each costing the rest of
its document; read the rest the same way before reading them as heading
defects.

**Populations measured before the check existed, still open:**

| Defect                                            | Works | How it was measured                                         |
| ------------------------------------------------- | ----- | ----------------------------------------------------------- |
| ToC entries promoted to headings (44 nodes)       | 6     | a title still ending in its target's span, `[31]`, `[1-6]`  |
| First of two adjacent pre-body headings swallowed | 6     | oracle `MISSING` at `before=1`, then read on the raw page   |
| Closing block nested a tier too deep              | 10    | 3+ nodes after the last level-1, >1 tier below its siblings |

**Three works still carry a node their rule should have taken, and all three are
§2 cases.** `ecclesia-in-america.es` and `querida-amazonia.ar` keep a trailing
outline because their bodies' sub-headings were never detected at all, so it has
nothing to be a duplicate of; `lumen-gentium.pt` keeps its papal signature
because the Fathers' subscriptions below it are numbered. Each wants the
detector fixed, not the guard widened.

**One number deliberately not given.** The promoted-prayer-stanza defect has 2
confirmed and no population, because the obvious test ("an address-less heading
that is a full sentence") returns 67 works of which most are correct — Latin,
French and Italian end a real heading with a full stop by convention.

**Sizing.** Nothing here gates anything else and nothing is blocked. Every item
is a change to `vatican_docs.py`, which parses ~450 documents across several
page templates, so each costs the blast-radius measurement in
`docs/writing-descriptions.md` — snapshot, `rebuild.py --only documents`, diff —
now ~18s. **The ToC oracles are the regression suite this work needs**:
`audit.py toc` derives the count — 68 of 377 disagreeing, 524 differences, on
2026-09-08 — and a correct fix lowers it where an overreaching one raises it.
Per-item sizing is estimated, not measured.

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

## Five catalogue strings rewritten in English and Portuguese

`docs/writing-voice.md` landed 2026-09-07 and the catalogue's taglines were the
first surface read against it. Five were rewritten in `en` and `pt`; **38
dictionaries still carry the sentence each of them replaced.**

| Key                        | What the old sentence did                                                              |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `doctores.landing.tagline` | claimed the Fathers and Doctors carry "no official authority"                          |
| `schola.what.doctors`      | the same claim, in the stronger wording, on the guide                                  |
| `bible.landing.tagline`    | described the act of reading a book rather than naming the work or its size            |
| `document.library.tagline` | a genre list short of its own shelf, ending in a restatement of the card's title       |
| `bookmark.library.tagline` | restated the card's title, and did not name the reading position `/signata` also holds |

**Nothing falls back, so nothing is visibly wrong.** `t()` reaches for English
only where a key is MISSING, and all forty dictionaries carry these five with a
real translation of the old wording — so the other 38 go on printing the
superseded sentence in their own language, with nothing marking it stale.

**The two Doctors strings are one claim, and they are the reason this is not
cosmetic.** "No official authority" is not merely too strong but false: naming
a Doctor is itself an official act, and the consent of the Fathers is a
recognised rule for reading Scripture. What is true is the narrower claim about
the works, and until a dictionary is revisited it asserts the false form in its
own language. The other three are style and can wait.

Sizing: five keys in 38 dictionaries, no code and no schema. Two notes a
translation has to carry are on the keys in `en.ts` — _final_ is DEFINITIVE and
not final in time, and _receives_ is the theological sense.

## `/bibliotheca/census` is written in one language of forty

The library counted — the ledger, the coverage matrix and the citation ranking —
shipped 2026-09-08 with its 34 `census.*` keys in English alone, and is
deliberately **not in `CHROME_PATHS`** on that account (`site/docs/census.md`,
`route-manifest.ts`). `/calendarium/liturgia` stands in the same place for a
different reason.

**Nothing is visibly broken and the page is not English-only.** `t()` falls
back key by key, so every interface renders it with its own chrome around
English labels, and the numbers — which are most of the page — need no
dictionary at all. What is withheld is the published address: no
`/{lang}/bibliotheca/census`, no `hreflang` cluster, and one sitemap row where
a chrome page has forty-one. Its `<head>` is fixed English in `STATIC_HEADS`
rather than built per language from `route-titles.json`.

**The gate is the ARGUED one and not the coded one**, which is what makes this
larger than it looks. `census.title` and `census.tagline` alone would satisfy
`CHROME_KEYS` and publish a cluster in forty languages over nine English shelf
sentences and the matrix’s own labels — the exact failure `/calendarium` cost
75 keys to avoid. Every `census.*` key has to be written, or the page stays
where it is.

Promotion is then four edits: the keys in the remaining 39 dictionaries, the
path into `CHROME_PATHS`, an entry in `route-titles.mjs`'s `CHROME_KEYS`
(`census.title` / `census.tagline`), and the `STATIC_HEADS` entry deleted so
the per-language head takes over. `census.test.ts` already asserts that every
key the builder can emit exists in `en`; nothing asserts the other 39, by
design — `t()`'s per-key fallback is what makes a partial dictionary safe.

Sizing: 34 keys in 39 dictionaries, then four small edits and no schema. **Nine
of the 34 are the shelf sentences**, each carrying `{placeholder}` tokens a
translation must keep — `i18n.test.ts` checks exactly that, and
`census.test.ts` derives the expected set from the builder. The three that need
care are `census.method`, which states the rules the rankings are counted by,
`census.reachLede`, which says what a cell of the matrix means, and
`census.unavailable`.

## The colophon's Participate section exists in two languages

Four new keys (`colophon.participate*`), between the copyright section and the
address: write if you found a defect, or if you hold rights in a text that
belongs here. It is the counterpart to `colophon.copyrightBody3`, which invites
the opposite request.

**These are NEW keys, so the other 38 dictionaries fall back to English** —
visibly, in the middle of a page otherwise in the reader's own language. That is
the ordinary cost of a new string and not a defect; it is the opposite of the
five catalogue strings, which are translated and stale.

The heading is the part a translation can get wrong. Two sections up the page
promises there is nothing to buy, so it must not name a payment: "Contribute"
was the first heading written here and went because Portuguese "Contribuir"
reads as money. `Participate` has a cognate in most of the forty, which is why
it survives the crossing. The note is on the key.

## Recommended order

A priority argument, not a dependency one — nothing here gates anything else.

1. **The structure trees, down the worklist `audit.py trees` now prints** — the
   bold residue first, since it is a predicate and the ToC oracles tell a fix
   from a regression; then the stubs one raw page at a time, which is the only
   way to tell an unstructured mirror from an unread one. Above everything
   that adds coverage, because a wrong tree is served to consumers that never
   render the page.
2. **#9's 124 unread leads** — reading them is the only way to find another
   Acts 14, and `audit.py balance` has sorted them into the two piles worth
   reading. The two read so far returned one divergence and one defect, which
   is the ratio to expect.
3. **#15's three remaining languages** — Polish, Russian, Romanian. What is left
   is not scraping but the three decisions above, none of which is a parser's to
   take. (Spanish shipped with `bible.straubinger.es` recorded as
   `copyright.status: copyrighted`, a knowingly accepted self-resolving
   exposure; the term lapses 1 Jan 2027.)
4. **#13's remaining PDF editions, then its Arabic Catechism** — three
   Latin-script editions want their note apparatus read and a stage to write
   them; the sixteen Chinese ride on `ccc.zht`'s work and the four
   right-to-left ones on the Arabic normaliser, which is why the Catechism
   comes after them rather than before.
5. **#2 search** — the largest unscoped item; needs a prototype before it can be
   planned.
6. **#1's cross-language oracle** — what the symmetry check should assert.
7. **#18's Italian discovery pass** — nineteen recoverable editions and a
   denominator that is currently one language's. Placed here rather than higher
   because it is the only item on this list that needs the network, and the
   ten defective rows are known by name meanwhile.
8. **#5 `related` / #6 Appendix B** — lowest urgency; each needs a research pass
   in `docs/research/` style before implementation is scopeable.
