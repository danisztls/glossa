# Glossa Catholica — development plan

A living document: what is left, why it matters, what it depends on, and honest sizing — organized so that someone can answer "what should I work on next, and in what order." Distinct from `docs/decisions.md`, which is the **standing statement of the design choices that are not obvious from the code** (read it for _why_ something is the way it is); neither file is a history, and git holds that.

This document gets rewritten as reality changes and has no history of its own. **It does not restate what shipped.** A phase that lands leaves this file entirely — and it earns a line in `decisions.md` only if it left behind a non-obvious rule, not merely because it happened.

Sizing is stated honestly throughout: a measured figure is presented as one (with how it was measured); anything else is explicitly labelled an estimate. Where sizing isn't yet knowable — an item nobody has scoped in detail — that is stated too, rather than guessed at.

## Known gaps

Each stated as: what it is, why it matters, what it depends on, and sizing.

| #   | Gap                                                                                 | Why it matters                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Depends on                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Sizing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **What the cross-language oracle should assert when Latin is present**              | The scrape this row was written for landed with the ten-language expansion on 2026-08-29, and it landed larger than the row asked for: **203 Latin works, 199 of them documents** — 163 encyclicals, 20 exhortations, 16 Vatican II — against the **4** counted here on 2026-08-26. What did not land is the question underneath it. `check_language_symmetry` reads a section-number mismatch as evidence of a parsing defect, which is reasonable between two independent translations; Latin is the text the vernaculars translate, so a Latin/vernacular mismatch may be what translation _is_. Scoped below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Nothing, and the mechanism generalised itself: `_WORK_ID_RE` takes any two-letter tag and the comparison is n-way over every edition present, naming the one that deviates alone. Latin is already inside the check; what is undecided is what it should conclude                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Not sized, and deliberately — it is a decision before it is a change. The change it implies is small: compare each vernacular **against Latin where Latin is present** rather than every present edition against every other                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2   | **Full-text search** (prebuilt client-side index)                                   | Promised in `docs/decisions.md`'s original v1 scope ("Lookup mode"). Nothing exists: `JumpBox` resolves _addresses_, and `site/scripts/` holds a cross-reference builder, a corpus sync and a deploy preflight — no index builder                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Corpus size. 354 document works plus four Bibles, the CCC, the Compendium and the Summa mean "prebuilt" needs real index-size engineering, not a toy — and the corpus is no longer two languages, which an index format has to answer for                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Not sized — no prototype exists; index format, build-time-vs-runtime tradeoffs, and per-work vs. corpus-wide indexing are all open                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 3   | **The apparatus beyond the Bible reader**                                           | **The half that gated published data has landed.** The Douay-Rheims's 1,917 notes, 1,307 chapter arguments and its one annotated heading now render: `Sidenote.svelte` sets a note in the inline-start margin above 100rem and turns it into a tap disclosure below, and `AnnotatedText.svelte` places the markers from `text_marked`. What is left of this row is the surface it did **not** touch — the CCC's and the documents' numbered citations, which still use `CitationDisclosure.svelte`'s inline expando. That is arguably correct rather than pending: a citation is a few words wanted on demand, a gloss is a paragraph meant to be in view, and `Sidenote.svelte` argues the two are different kinds. Worth a deliberate decision rather than drift                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Nothing. The margin layout, the breakpoint and the note-key rule all exist now                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Estimate: small, and possibly zero — the open question is whether citations _should_ move, not how                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 5   | **CCC `related` (marginal concordance)**                                            | The print Catechism's margin numbers — the internal concordance pointing each paragraph at others on the same theme — are absent from every vatican.va mirror, in all eight editions. The field is ready and empty: a per-paragraph array in `paragraphs.json`, emitted `[]` on all 2,865 paragraphs, with the absence recorded in the manifest notes. This is the half of the old row #5 with reader-visible reach; **`abbreviations.json` shipped 2026-08-26** and no longer belongs here                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | A non-vatican.va source (candidates in `link-surface.md`: scborromeo.org, catholiccrossreference.online) — nothing in the pipeline or the schema is missing                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Not sized — depends on which source is chosen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 6   | **Compendium Appendix B formulas**                                                  | Appendix B's doctrinal formula lists remain deliberately separate from the prayers work (`docs/corpus-schema.md`). **The Matos Soares footnotes that shared this row have shipped** (2026-08-25): `bible.matos-soares.pt` now carries 3,013 of the edition's own notes, 1,279 chapter arguments and 5,733 headings, taken from vulgata.online and joined onto liriocatolico's verses. Its text was deliberately NOT re-sourced — 247 verses are missing from that transcription — and each note is anchored where its own lemma ends in our verse. See `pipeline/docs/oracles.md` and `docs/research/matos-soares-re-sourcing.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | A dedicated scope and parser for non-prayer formula lists                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Not sized                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 9   | **Disclosing edition divergence to the reader**                                     | The classification landed 2026-08-25 (`pipeline/scrapers/bible/divergence.py`, `docs/research/bible-edition-divergence.md`); its proposal §5 did not. A reader following a citation into Psalm 13 or Acts 14 gets real, plausible, **wrong** text with nothing marking it — and Acts 14 is 20 consecutive verses where the same number names different text in the two editions. Behind it sit **101 unread silent-case candidates**: `--shifted` finds chapters whose verse numbers agree while their text has moved, and only three have been read                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | §5 needs the classification exported as data the site can read rather than a Python dict. The candidates need reading, not tooling                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Estimate: small for §5 (a data export and one advisory); the 101 candidates are their own pass, sized by how many get read                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 12  | **The reverse index reads two of the seven citers**                                 | `build-xrefs.mjs` builds the "cited by" apparatus from CCC editions and document editions and from nothing else -- 1,323 Catechism and 2,162 document xref entries, plus the two citation indices. **Four** bodies of text cite forward and are invisible backward (re-measured 2026-09-01 from `site/static/reference-coverage.json`): the **Bible editions' own apparatus** (20,596 prose Scripture references, against the 435 recorded here when Challoner and Matos Soares were the only annotated editions: **seven** of the nine carry notes, arguments or chapter summaries now, `bible.clementina.la` and `bible.cpdv.en` being the two bare texts), the **Summa** (8,763 prose references and 5,174 CCEL-stored self-citations), **`commentary.haydock.en`** (11,491, a work that did not exist when this row was written), and the **prayers** (40). So a Bible chapter's cited-by list omits every one of the works that cite Scripture most. The asymmetry predates the forward links but only became visible when the last of them landed on 2026-08-26. **The Compendium half is done** (2026-08-28): its 5,949 `ccc_refs` now read backward through `condensation.ts` rather than through this builder, because the design question below was answered rather than deferred -- a Catechism paragraph says which questions condense it, and the two indexes link each other's divisions | Nothing in the pipeline or the schema. The forward direction resolves for all four already, which is the whole point: the units exist, `citingUnits` and the two `build*BibleXrefs` functions simply are not given them. `sync-corpus.mjs` already branches on a commentary and writes `commentary-index.json`; `build-xrefs.mjs` has no notion of the type at all                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Estimate: **small for the Summa and the prayers** (thread their editions into the existing builders the way `documentEditions` is). The Bible notes remain a **design question**: a note glossing a verse in its own edition listing that verse as citing it is circular. **Haydock may be the case that settles it**, because it is the same apparatus with the circularity removed -- a commentary is a separate work that ADDRESSES the verse rather than living inside the edition, so nothing is listed as citing itself. Not sized until that is decided. The Compendium's own question -- "condenses" is not "cites" -- was settled by giving it a separate index and a separate sentence on the page rather than folding it into `CitedBy`      |
| 13  | **The CCC's two PDF-only editions, and six PDF-only documents**                     | **The Compendium's four shipped on 2026-09-01** — `compendium.{be,id,lt,ru}`, 598 questions each — so what is left of this row is the Catechism in Arabic and Traditional Chinese, and the six documents that exist only as PDF, the English _Amoris Laetitia_ among them. All eight are already in `raw/`, fetched and read by nothing. `ar` still ships as an interface language with no content behind it. Read `docs/research/pdf-editions.md`, which now carries the measurements for all of them and records why the two decisions this row used to turn on were made the way they were                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | The reader exists: `common/pdf.py` (two backends, coordinate-bearing lines) and `common/binaries.py`, with `rebuild.py`'s `readers` fingerprint closing the reproducibility gap. Four residues the Compendium left behind are listed in that note §8b and are all in the SAME code, so they are cheapest to take alongside a new edition rather than alone: the Russian carries no epigraphs or sub-headings because poppler reports no font (the fix is a `pdftohtml -xml` backend, which would also retire the `/Rotate` special case), `sub` nodes run 14-18 against the Italian's 82, and the Lithuanian is missing 24 of 598 `ccc_refs`. Arabic extends it; Chinese needs a `zh` book table in `refs-grammar.ts` and a CJK webfont, neither of which is extraction work                                                                                            | Measured 2026-08-31. **Chinese: 2,859 of 2,865 paragraph numbers from a one-line regex, and all six gaps explained** — two source defects for `corrections/`, one misprinted number, one paragraph genuinely absent from the edition, two a parser tolerance. No footnote apparatus at all, so `citations: []` by construction. Easiest of the six to extract and the hardest to publish; keep those apart. **Arabic: 2,852 of 2,865, poppler-only** (MuPDF fragments RTL lines), and the work is normalisation rather than extraction — the Allah ligature decomposes in visual order, so the text's commonest word is mis-spelled ~4,900 times before any pass. Estimate: small for Chinese extraction, medium for its publication, medium for Arabic |
| 15  | **A Bible in every interface language**                                             | The site has **thirty-four** interface languages and Bibles in **eight** content languages (`de`, `en` twice, `es`, `fr`, `hu`, `it`, `la`, `pt`); the rest read Scripture in English through `CONTENT_LANG_FALLBACK`. It is the largest single coverage gap left, and it is the one a reader notices first — the Bible is the work they came for. **The research is finished** (`docs/research/bible-texts.md` §One Bible per interface language, 2026-08-28) and **five of the eight editions it chose shipped on 2026-08-28** — Allioli, Straubinger, Crampon, Káldi and Martini, taking the corpus from four Bible editions to nine. What remains of the survey is Polish, Russian and Romanian, and none of the three is blocked on a parser: each is captured and unparsed behind a decision stated in full below                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Nothing structural, and none of the three remaining is a new `ContentLang`. The five that shipped are the map for the rest: **versification** (Crampon's Hebrew-numbered Psalter is converted in `sync-corpus.mjs`'s `toVulgateChapters`; the Romanian 1914's divergence is still unsurveyed), `refs-grammar.ts` book tables, and one `WORK_CONFIGS` look per edition on the Kings axis — which cost `bible.martini.it` a `proseRomanChapters` flag and `bible.kaldi.hu` nothing at all                                                                                                                                                                                                                                                                                                                                                                                 | Not scoped end-to-end. Per language it is one scraper against a known source with a known markup shape, and the three that remain are all MediaWiki (two readers, not one: `ru`/`ro` are plain wikitext where `fr` transcluded from ProofreadPage). Estimate: Romanian the most expensive (versification survey first). **Three more are blocked and are not sizing questions**: `sv` has no doctrinally acceptable text at all, `sl` and `ar` are blocked on digitisation (OCR projects, not ingestions)                                                                                                                                                                                                                                               |
| 10  | **Denzinger, Roman Catechism, Vatican I** (CIC is ingested)                         | Restated for self-containedness, and **the CIC half of this row is spent**: the Code was ingested and `/ius-canonicum` reads it in seven languages, so what remains under this number is the other three. Denzinger is Herder-copyrighted and never a vatican.va publication; the Roman Catechism and Vatican I were not found on vatican.va under any URL tried (Vatican I's absence isn't conclusively confirmed — no sitemap search attempted). The Code's arrival also settled a collision this project had written down in advance: `CIC` is the _Catecismo da Igreja Católica_ in Portuguese and the _Codex Iuris Canonici_ everywhere else, and `suggest.ts` now offers both rows rather than discriminating on the reader's language — see `site/docs/finding.md`. Full detail: `docs/research/vatican-documents.md` §2, §5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Out of scope, not sized                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 16  | **Provenance marking — which prose on a page is ours and which is the publisher's** | The colophon states the site's canonical standing (a private undertaking, no ecclesiastical approbation — `site/docs/colophon.md`) and deliberately makes **no claim about what text is authored here**. There is such text: `site/descriptions.json` holds descriptions of **385 works** (393 in all, since two carry several) — 263 English, 110 Portuguese, 20 across it/es/fr/de/pl/ru/ar — written here by reading a document, merged onto `manifest.description` at sync time and served on `/documenta`, in `static/apparatus.json` and in the shell `<head>` as `prose`. It is the one running text on this site nobody else holds rights in, and a reader cannot currently tell it from the publisher's own summary. A colophon sentence claiming it was drafted on 2026-09-02 and **removed**: a reader meets that prose beside a document, not on the colophon, so a paragraph there is read by few and cannot mark the individual item, which is the only place the question arises.                                                                                                                                                                                                                                                                                                                                                                                                       | Nothing on the data side — the descriptions are already their own tier (`descriptions.json` → `manifest.description` → `apparatus.json`), distinct from every scraped field. It is a rendering and copy decision. Interacts with `site/docs/edge.md`'s "names, never text" rule: the edge already serves a description as `prose`, so whatever marks it on the page has to have an answer for a consumer that never renders.                                                                                                                                                                                                                                                                                                                                                                                                                                            | Not sized. The marker is small; deciding what it SAYS is the work, and whether it needs a word in thirty-four dictionaries or can be a non-verbal affordance.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 17  | **A site-wide subject vocabulary** (topical entry across every work)                | `site/document-tags.json` holds a closed, curated vocabulary — 58 terms on 2026-09-03 — keyed by document SLUG, and it facets `/documenta` alone. Extending it across CCC divisions, canons and Compendium questions would give the site its first TOPICAL entry, which is the only surface that serves the two readers `docs/research/audiences.md` ranks largest (§1 the layperson, §5 the OCIA candidate) by SUBJECT without waiting for gap 2 — `/schola` (2026-09-04) reaches §5 by naming what each work is and the orders the sources set out for reading them, which is a different question from "where is this topic treated". It is also gap 5 generalised: the print Catechism's own answer to "what else belongs here", derived rather than scraped. `docs/research/organization.md` §What this deliberately excludes records why it is its own project and not part of the navigation redesign                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | The vocabulary discipline that already governs `document-tags.json` — `sync-corpus.mjs` exits 1 on a term outside the list, a slug naming nothing, a case-duplicate or a padded tag — has to extend to whatever new key space the terms attach to. Curation is by reading, not counting (`site/CLAUDE.md` §`/documenta` filters), and a merge is a semantic act checked against every item it touches                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Not sized. The machinery is small; assigning terms to the CCC's paragraphs and the Code's canons is the work, and it is editorial rather than mechanical                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 18  | **A lectionary of references** (the second half of the by-date entry)               | The calendar landed 2026-09-03 (§Loose ends from the liturgical calendar below) and answers what day it is; nothing maps that day to its readings, which is the other half of what `docs/research/audiences.md` §2 arrives asking. The scope taken 2026-09-03 in `docs/research/organization.md` §Liturgical scope stands unchanged: a lectionary is in **as REFERENCES**, rendered through this site's own Bible editions and never as licensed reading text; the **Missal is out and stated** (ICEL/conference/LEV rights, no scrapeable source, and a Missal that looked usable _at_ Mass edges toward the approbation `/colophon` disclaims — `audiences.md` §9). The GIRM is takeable as an ordinary Magisterium document. `/calendarium` already states the cycle letters and stops there on the same reasoning (`site/docs/calendar.md`), so this is the one remaining piece of the only **daily-return** surface the site has                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Nothing new on either side, which is what makes it sourcing rather than engineering. The resolver is built — `refparse.ts`, `refs-grammar.ts`, the book tables and `versification.ts` already turn a pericope list into linked text, including the Neo-Vulgate/Clementina Psalm divergence that is otherwise the hardest part — and so is the KEY: a lectionary table is looked up by day and cycle, and `site/src/lib/calendar/` computes the Sunday cycle, the weekday cycle and the psalter week for any date. What is missing is only the table. One sourcing check governs it: the facts are not copyrightable, but a compiled DATASET of them can carry its own licence, which makes the _Ordo Lectionum Missae_ as the universal reference the defensible choice. The table is `oracles/`-shaped, not `raw/`-shaped: tracked, write-once, nothing regenerates it | Not sized. Sourcing the schedule is the whole job; rendering it is existing machinery, and the calendar already supplies the lookup key                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## Loose ends from the liturgical calendar (landed 2026-09-03)

The calendar itself shipped, and so did a national calendar for every country
GCatholic publishes one for: `site/src/lib/calendar/` computes any day of any
year and `oracle.test.ts` checks every calendar — three years, eight transfer
variants, and 86 national feeds — day by day against GCatholic
(`site/docs/calendar.md`). Sixteen of the layers were
written by hand and the rest derived by
`pipeline/derive_national_calendars.py`; **only the ones the oracle agrees with
are published**, the rest being held in `national/held.ts` with the count of
days each still differs on. What follows is what that work located and
deliberately did not do.

### Three pages are unpublished, and each is waiting on the same thing

**`/calendarium`, `/catechismus/compendium` and `/schola` are in
`STATIC_PATHS` and not in `CHROME_PATHS`** (`site/src/lib/route-manifest.ts`).
Each answers 200 and is indexable at its bare address, and none of them takes a
language prefix, sits in an `hreflang` cluster, appears in a sitemap row, or
gets a per-page `<title>` or description at the edge —
`scripts/route-titles.mjs` keys its map off that second list.

**This is a translation gate, not an omission, and it started as one.** The
omission was real on 2026-09-04: `/calendarium` and `/ius-canonicum` were in
NEITHER table and answered 404 to every cold load. Fixing that separated the
two questions a chrome path asks — is every word on the page the interface, and
is the interface actually written — and the three below pass the first and fail
the second. `chromeNames` deliberately does not fall back to English, because a
cluster whose Portuguese member is described in English tells a search engine
the page is Portuguese and then serves English. `/ius-canonicum` was published
the same day precisely because its `canonLaw.landing.*` keys were already in
all 37.

| page                      | waits on               | in              |
| ------------------------- | ---------------------- | --------------- |
| `/calendarium`            | 44 `calendar.*` keys   | en, la, pt      |
| `/catechismus/compendium` | `compendium.landing.*` | 14 dictionaries |
| `/schola`                 | 19 `schola.*` keys     | en              |

**Each costs one line in `CHROME_PATHS` plus a `CHROME_KEYS` entry in
`scripts/route-titles.mjs`, and nothing else moves.** `sitemap.test.ts` and
`shell-head.test.ts` are written as arithmetic over `CHROME_PATHS.length`, so
they follow; `assertNamed` fails the sync if a key is missing anywhere, which
is what makes publishing early impossible rather than merely unwise. None of
the three depends on anything else in this file.

**`/schola` is the one to weigh separately.** The other two are pages a reader
can use in a second language; the learning portal is written FOR the reader who
has no vocabulary yet (`docs/research/audiences.md` §5), so shipping it as an
English cluster would be false exactly where being false costs most — and
leaving it unpublished costs that same reader a page a search engine cannot
offer them in their language. Both directions are bad and translation is the
only way out. Its bill is deliberately small: the page names no work, book or
division in its own words.

### Decisions only the person directing the work can take

- **The Roman Martyrology as a second layer.** GCatholic publishes every saint
  and blessed indexed by date of death — the Martyrology's ~7,000 against the
  General Roman Calendar's ~190 — at `gcatholic.org/saints/dates-of-death`.
  Ruled out of scope on 2026-09-03 so that the calendar could be judged first.
  It is a genuinely different feature: orders of magnitude more data, a
  different provenance question (the Martyrology is a book with a publisher,
  where a table of dates and ranks is fact), and it would belong in the corpus
  rather than in the site bundle. Depends on nothing; wants deciding on its own
  terms rather than as an extension.
- **The held calendars, one at a time.** Taken 2026-09-04: the list is every
  calendar GCatholic publishes, and what remains is not adding countries but
  finishing the ones already derived. `national/held.ts` names them with the
  measurement — out of 1,095 days per calendar, most differ on one to five —
  and its header groups them by cause. Three of those causes are ENGINE work
  rather than transcription and are the ones worth taking as a batch: All Souls
  transferred off a Sunday, an observance suppressed by the day it falls on,
  and a conference that changed a transfer inside the oracle's window. The
  fourth wants a `MovableRule` that can say "the last Sunday of October".
- **A second witness for a derived layer.** The oracle's name check is circular
  for a derived country — it compares a name to the feed the name came from —
  and the fix is what `docs/decisions.md` already requires of prayers and of
  the gazette sigla: a second source, here each conference's own published
  ordo. It is a large research job, one country at a time, and it is the only
  thing that would make a derived layer as well attested as a hand-read one.
- **Diocesan calendars.** Italy's file adds no saint of its own, which surprises
  until you see why: Italy's propers are in its dioceses' calendars, not its
  national one. A diocesan layer would be a third tier over the national one,
  and nothing in the model forbids it; whether the site wants ~2,000 of them is
  a different question from whether it could hold one. **Eight are already
  here, and not as a tier**: GCatholic publishes a particular church's calendar
  where a country has none of its own — the Diocese of Rome for Vatican City,
  Urgell for Andorra, the Latin Patriarchate of Jerusalem and two Arabian
  vicariates for eleven countries between them — so they are national layers by
  another name, and `alsoCovers` is what lets one stand for several places.

### Known limits, stated rather than fixed

- **The per-year tables run out after 2027.** `movedInYear` (Brazil's and the
  Congo's transfers, the Congo's Visitation) and Spain's Ember Days are tables
  of years and not rules, because the evidence rules every rule out: Peter and
  Paul went backward from a Monday in 2026 and forward from a Tuesday in 2027;
  Spain's Ember Days are Monday, Monday, Tuesday. Outside the listed years the
  celebration keeps its own date and the observance is absent. Fixing this
  properly means reading each conference's Ordo every year, which is an annual
  chore and not a piece of code; the alternative — guessing a direction — puts
  a solemnity on a date nobody chose.
- **The oracle covers 2025–2027 and nothing else.** That is GCatholic's iCal
  window (measured; its HTML tables reach 2024–2028). The rare cases live
  outside it and are covered by hand-written tests in `year.test.ts` instead —
  Easter on 25 March in 2035, a transferred Epiphany landing on 7 January, a
  Christmas that is itself a Sunday. **One rule in the engine the oracle cannot
  confirm**: Saint Joseph is anticipated rather than deferred when 19 March
  falls in Holy Week, which rests on the published practice of 2008 because 19
  March is outside Holy Week in all three oracle years.
- **A national proper's name is transcribed, not derived.** There is no Latin
  original to reproduce and no second published source that was consulted, so
  the oracle's name check for those rows is a transcription check. Everything
  the ENGINE does with the row — date, rank, colour, precedence, moves,
  transfers, suppressions — is checked independently, and that is the half that
  can be wrong invisibly. A second witness per country (a conference's own Ordo)
  would close the gap and is a country-by-country research task.
- **The lectionary is absent by choice.** The cycle letters are stated; the
  readings are not, because their citations are a work this corpus does not
  hold. Adding them is not a calendar problem — it is deciding whether to
  ingest a lectionary.
- **The general calendar is Latin, English and Portuguese.** A national layer
  carries the language its conference approved its propers in (es, it, fr, pl,
  de, en) and an English rendering beside it; every other interface language
  falls through `CONTENT_LANG_FALLBACK`. That is the same posture the corpus
  takes for a work it does not hold in a reader's language, and a translator
  adding a language adds name columns to `grc.ts`, not a mechanism.

## Loose ends from the 2026-08-28 Bible capture (gap #15)

Eight editions were captured on 2026-08-28 (`docs/research/bible-texts.md`
§What the capture found) and five parsers written against them. Everything below
is a real, located piece of work that the batch surfaced and deliberately did
not do. Grouped by what kind of thing it is, because the four kinds want
different people: two are **defects in editions already live**, three are
**decisions only the person directing the work can take**, and the rest are
engineering or content with a known shape.

### Defects in editions already shipped — found by `edition_check.py`, not by a reader

- **`bible.cpdv.en` has no Esther 16, and its Esther 15 is short.** The book
  stops at chapter 15 with 14 verses where `bible.clementina.la` has 19, so
  roughly 29 verses of the Greek additions are missing from a live edition. It
  has been that way since the edition was ingested on 2026-08-14 and nothing
  caught it, because every check the corpus had was per-unit and this is a
  missing unit. Diagnose before fixing: it may be a scraper bug (a dropped last
  chapter) or the source's own gap, and those want different responses.
- **`bible.douay-rheims.en` anchors headings on verses that do not exist** —
  `ps` 115 and 147 both carry a heading at `before_verse: 1`, but those Vulgate
  psalms begin at verses 10 and 12 respectively. Small, and the fix depends on
  whether the source prints the heading above the psalm as a whole (in which
  case the schema has no field for it and that is the finding) or above its
  first real verse.

Both were invisible until a **shared** schema check existed. Neither edition's
own `validate()` was wrong; they assert things about their own source, which is
what they are for. The general check is `pipeline/scrapers/bible/edition_check.py`
and it should be run over any edition anyone touches.

### Chapters whose verses are numbered differently — eight, across six editions

Found on 2026-08-28 by teaching `edition_check.py` to compare a chapter's verse
**count** and its **highest verse number** together. It had compared counts only,
and the dangerous shape is the one where the counts agree:

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
Hebrew's continuous verse numbering in the second half rather than restarting at

1. Three independent editions do it, so it is the editions being editions —
   but the corpus's address space is the Clementine's, and nothing reconciles them.

Two things follow. **This is not a parse defect and must not be "fixed" in the
scrapers** — the stored text follows the source, which is the rule. And **it was
invisible to every check the project had**: round-trip, coverage, symmetry and
`balance` are all per-unit or per-count, and a chapter with the right number of
verses under the wrong labels passes all four. `bible.douay-rheims.en` has
carried three of these since it was ingested.

It also explains that edition's two heading errors, which are the same fact seen
twice: a heading anchored at `before_verse: 1` in a chapter whose verses start at 10. Fixing the numbering question answers the heading question for free.

The open decision is where reconciliation belongs — a per-edition verse-offset
map consulted at read time, or a conversion in `sync-corpus.mjs` alongside the
Psalter conversion Crampon already needs. They are the same shape of problem and
should probably get the same answer.

### Decisions, not tasks

- **Polish: what to do about Esther 11–16.** `bible.info.pl`'s Wujek is missing
  108 verses — the gap is in the 1923 Bible Society base and propagates to every
  host that reuses it. The text exists in Wujek's own wording in the 1599
  _editio princeps_, captured at `raw/wujek_1599_ia/`, but as uncorrected OCR of
  16th-century type whose damage reaches the chapter numerals (`VIL`, `XIIL`,
  `XVL`). Three options, and the choice is not a parser's to make: ship with the
  1599 OCR as the source for 11–16, ship with a documented canon gap, or hold
  Polish until someone proofreads the OCR against the scan (which is also
  captured, so this is a re-parse rather than a re-crawl).
- **Russian: how a differently-shaped canon maps onto Vulgate addresses.** The
  Synodal's Esther additions exist but as unnumbered bracketed prose inside
  chapters 1–10, so no citation to Est 11–16 can reach them; and its Baruch has
  five chapters because the Letter of Jeremiah is a separate book, so `Bar 6`
  needs mapping rather than lookup. Neither is loss and neither is a defect.
  Until both are decided, Russian is captured and unparsed.
- **Romanian: whether it is worth a versification table an order of magnitude
  larger than the corpus's.** 308 of 1,321 chapters (23 %) differ in verse count
  from the Clementine, against `versification.json`'s three wholesale-divergent
  books and fifteen mapped verses. Three clusters are expected and not defects
  (Tobit, Judith, Sirach — a longer Greek recension against Jerome's abridged
  Latin) but low-density divergence remains nearly everywhere. It also lacks
  Esther's additions outright. Captured, unparsed, and correctly last.

### Site wiring the five parsers imply

- **`PsalmNumbering` widened to `'hebrew'` on 2026-08-28, and the conversion
  landed with it.** `bible.crampon.fr` is the corpus's first Hebrew-numbered
  Psalter — the edition
  states its own policy in a footnote, "sauf quelques exceptions" — and stores
  what the source prints, because `common/versification.py`'s `to_vulgate`
  **deliberately refuses Psalms**: that mapper is an algorithm, lives only in
  `site/src/lib/versification.ts`, and a Python twin already existed once and was
  deleted as drift. So the conversion belongs in `sync-corpus.mjs`, where the
  mapper is in scope and where the canonical-address content tier is actually
  built. No inverse mapper is needed: the existing forward `mapPsalm` turns the
  source's Heb 9 (21 vv) + Heb 10 (18 vv) into Vulg 9 (39 vv) directly. Done:
  `toVulgateChapters` in `sync-corpus.mjs`, after which every seam matches the
  Clementine, Malachi has its fourth chapter, and psalms differing in verse
  count from the Clementine fell from 134 to 5. What is left is the FIELD NAME,
  which says "Psalm" about an edition whose divergence is not confined to the
  Psalter — 156 of its 294 diverging chapters lie outside `ps`/`mal`/`joel`.
  Renaming it is a schema decision.
- **`WORK_CONFIGS` gained two entries on 2026-08-28, and the diagnosis above
  them was wrong in a way worth keeping.** This row read "1,008 four-Kingdoms
  citations … so `II Reyes` means 2 Samuel while the site's own '2 Kings' means
  2 Kings", i.e. that they were read as the wrong book. They were not: neither
  language's table held `Reyes` or `Reg` **at all**, so 1,430 of them resolved
  to nothing, and the only genuine misreadings were the 36 places Straubinger
  writes the short `1 R`/`2 R` the Spanish table already knew. Adding a surface
  form and re-pointing a scheme are two different repairs, and it took both.
  **Which forms the scheme covers is itself a measurement**, made by reading
  every Kings-family citation against the Clementine's real verse counts — a
  citation is evidence only where one reading addresses a verse that does not
  exist: `Reyes`/`Rey` 77–0 for Douay, `Reg` 13–4, and `R` **0–5 the other
  way**. Straubinger writes `1 Sam.` and `1 R.` in one sentence; the short form
  is modern and stays modern. Reading the counter-examples is what settled it,
  and all five are source misprints, listed below.
- **What the Italian entry actually needed was Roman-numeral chapters, and that
  is the larger finding.** Martini's whole apparatus writes the chapter in Roman
  ("`4. Reg. XVIII. 27.`", "`Matth. XVI. 18.`") — measured at roughly 10:1 over
  Arabic across eight book families — and `parseChapterVerses` had refused Roman
  loci in running prose since the pre-conciliar encyclicals needed them in
  citations, because there "John XXIII" is a pope. It is now a per-WORK flag,
  `proseRomanChapters`, on for `bible.martini.it` alone, with the existing
  guards (an explicit separator, a verse-sized verse) untouched. Martini's notes
  went from **26 resolved references to 840**.
- **`bible.kaldi.hu` needed the look and does not need the entry.** Káldi prints
  Douay-style titles ("Királyok III. (I.) könyve"), which is suggestive and is
  not evidence. The measurement: the built edition has **no notes at all** — only
  1,333 chapter summaries and 15 headings, and a scan of all 1,501 of those finds
  **zero** citation-shaped tokens. Its apparatus is the unbuilt `jegyzet` layer
  below. There is nothing yet for a book table to read, so `hu` gets no config
  and no `WORK_CONFIGS` row; revisit both when the notes land.
- **The corpus README's rebuild recipe now names the five parsers, and the claim
  that it must name `capture.py` was wrong.** `raw/` is tracked, so a fresh clone
  already has the pages and the rebuild is parse-only; `capture.py` is what
  filled `raw/` once, and running it during a rebuild would re-ask the origin for
  nothing. The README says so explicitly now, because the split is new here and
  reads like a missing step. Verified 2026-08-29 against an empty `build/`: 389
  works, 2,709 files, everything byte-identical to the previous tree apart from
  `generated_at`/`applied_at` — and **two files that differed for a real
  reason**, `bible.cpdv.en` and `bible.clementina.la`, which were stamping the
  RUN date into `retrieved_at` because they asked the capture ledger for an
  `index.htm` no crawl ever wrote. A verification run on the day of the change
  cannot tell "preserved" from "re-stamped"; running it a day later is what
  found this. Fixed with `source_captured_at`.
- **The corrections layer's two shared rules now live in `common/`.** Four
  appliers were each writing out "never apply an entry carrying a `resolution`"
  and three were each writing out the full-run drift guard, once per scraper.
  Both are `docs/decisions.md`'s policy rather than an edition's opinion, so
  they are `filed()` and `require_all_applied()` in `common/corrections.py`,
  with `FIELD_VERSE_NUMBER`/`FIELD_VERSE_DUPLICATE` naming the vocabulary. The
  appliers themselves stay put — `kaldi.py`'s relabels a parsed chapter after
  the fact, `straubinger.py`'s is consulted mid-parse and needs an `occurrence`
  key, and they are not the same algorithm. **What is deliberately not unified
  is which entries an applier owns**: `douay_rheims.py` partitions its file by
  locator scope and `matos_soares.py` by the presence of a locator key, both of
  which predate `field`. That is a schema question, not a refactor.

### Content captured and deliberately not built

- **Book introductions for two languages.** `raw/allioli/front/` holds **59
  per-book introduction essays** and `raw/straubinger/` holds Straubinger's own
  per-book introductions (1 Samuel's runs ~1,400 words). Both belong to
  `bible-intro.{lang}`, a separate work keyed by language rather than by edition,
  and neither was folded into its Bible. Building `bible-intro.de` and
  `bible-intro.es` is additive and needs no new schema — and the schema is no
  longer hypothetical: `bible-intro.en` (Challoner's prefaces) is built, has its
  own `manifest.type` branch in `sync-corpus.mjs` and its own
  `bible-intro-index.json`, and carries the `shared_preface_with` key that says
  what to do when one preface serves two books. Two more editions read into a
  shape that exists.
- **Hungarian's second apparatus layer.** The source is 73 books × 3 pages —
  `szoveg` (text), `jegyzet` (concise notes), `jegyzet2` (extended commentary) —
  sharing one anchor scheme. The schema's `notes` is one field. Whatever the
  first cut carried, the other layer is captured and unread.
- **Crampon's `Dictionnaire du Nouveau Testament`**, a 325 KB NT glossary that
  corresponds to nothing in the corpus schema. Captured; no home decided.
- **Cross-references have no schema field, and two editions are full of them.**
  Martini prints 27,746 (counted and stripped), Káldi prints its own as
  `<span class=biblink>`, and the Synodal carries `{{bible parallels}}`. The
  Bible schema defines no field, so all of it is currently discarded at parse
  time. Deciding whether it earns one is a schema question with three witnesses.

### Checks and filings to revisit

- **`audit.py balance` still excludes the Bible**, on the reasoning that Esther
  divergence reads as loss. This batch shows the exclusion is now costing more
  than it saves: with nine editions an edition-specific defect has eight
  witnesses against it, which is the configuration that found all three Catechism
  defects. It also shows the reasoning was half right — Esther holds real loss
  _and_ real divergence at once, and only reading the text tells them apart.
- **Five more source defects, each identified by its own sentence** (found
  2026-08-28 by the Kings adjudication above, and the reason that measurement is
  worth redoing after any table change). Straubinger's note at 1 Chr 25 writes
  `III Reyes 4, 31` and then `II Reyes 4, 31` for the same verse, one note apart.
  Martini's four each name a chapter of Kings and reach it with a numeral one off
  the one he uses everywhere else: `I. Reg. VII. 28` for Solomon's lavers,
  `2. Reg. XVII. 32` for Samaria's resettlement, `4. Reg. XX. 22` for Hezekiah's
  parallel to Isaiah 39, `4. Reg. XXIV. 21` for Seraiah's death. All five are
  wrong-address defects of exactly the class `pipeline/corrections/` exists for.
- **Martini's apparatus cites in LATIN book forms the Italian table does not
  hold.** With Roman chapters now read, the residue is the books: `Matth.`,
  `Isai.`, `Psal.`, `Luc.`, `Marc.`, `Esod.` and their kin resolve to nothing,
  and `2. Esd.` resolves to Ezra rather than Nehemiah because the Italian table
  has no numbered Esdras forms where the English one does. This is the "run the
  prose scan and read what resolves to nothing" pass CLAUDE.md describes, and
  Martini is now its largest single target.
- **Source defects observed and not yet filed.** `bible.kaldi.hu`'s Isaiah 7:14
  prints "Emmánnelnek" for "Emmánuelnek", corroborated by Matthew 1:23 quoting
  the same verse correctly. Martini drops 13 notes whose printed locator names a
  verse absent from their page (2 Corinthians 6's notes numbered `6,19`–`6,23`
  are verbatim about 2 Cor 7:1–4); they are logged as anomalies by the scraper
  and are the best candidates for hand-adjudication.
- **The three blocked languages should say so on the colophon.** `sv` has no
  doctrinally acceptable public-domain text at all; `sl` and `ar` are blocked on
  digitisation rather than on rights. A reader in any of the three currently gets
  English scripture under their own chrome with no explanation.

## The document structure trees — populations measured 2026-08-29

`docs/research/document-structure-defects.md` has recorded since 2026-08-16 that `structure.json` is unreliable for most of the corpus, and its §2 is still the largest open item. Reading the 32 English apostolic exhortations for a ToC oracle put **numbers on the individual failure modes** for the first time — §6–§14 of that note. Nothing is fixed; what follows is what a fix would have to cover, and what it would cost to get wrong.

**Why it matters, in the order a reader meets it.** Three of these are visible on the page rather than in the tree:

- **18 works open §1 with a wall of their own table of contents** — `sacramentum-caritatis.hu` prepends 60 of its own headings to its first paragraph, `africae-munus.en` 37, `africae-munus.es` 31. The document's opening sentence is below the fold.
- **`ecclesia-in-america.en` stores a heading titled `W` followed by a paragraph beginning "e thank you, Lord Jesus,"** — a drop cap read as a division. 11 nodes in 5 works; the Croatian pair break a chapter opening rather than a closing prayer.
- **`santateresa-delbambinogesu.en` is missing three of its four chapter headings from the build entirely** — present in `raw/` once each, absent from `sections.json` and `structure.json` both. It is the only confirmed text loss found, and no count check sees it because `sections.json` still totals 53.

Everything else is the tree, which is what the sidebar contents renders, what a per-division reading view (§3 of the research note) would split on, and what `static/route-titles.json` publishes as each division's paragraph span — so a wrong tree is served to consumers that never render the page.

**The populations.** Each measured across all 1,447 works, not inferred from the 32 read:

| Defect                                                       | Works     | How it was measured                                         |
| ------------------------------------------------------------ | --------- | ----------------------------------------------------------- |
| Index caption survives as a node and adopts the opening      | 44        | a structure title matching `INDEX`/`ÍNDICE`/`INHALT`/…      |
| Papal signature stored as a heading                          | 92        | a title matching `PAULUS P. P. VI`, `LEONE PP. XIII`, …     |
| Leaked ToC entries left in §1's body                         | 18        | §1's text contains 2+ titles of later headings              |
| A ToC printed _after_ the body, never a dedup candidate      | 15        | 2+ duplicated titles whose surplus copy has `before: null`  |
| ToC entries promoted to headings (44 nodes)                  | 6         | a title still ending in its target's span, `[31]`, `[1-6]`  |
| Drop cap read as a heading (11 nodes)                        | 5         | a title that is one stray letter                            |
| First of two adjacent pre-body headings swallowed            | 6         | oracle `MISSING` at `before=1`, then read on the raw page   |
| Closing block nested a tier too deep                         | 10        | 3+ nodes after the last level-1, >1 tier below its siblings |
| Tiers flattened — **3 confirmed, 25 strong, 157 candidates** | see below | census markup column, one document at a time                |

**Two numbers deliberately not given.** The tier-flattening population is the important one and the least knowable: 157 works have 40+ headings and only two levels, but a long document with two _genuine_ tiers looks identical from outside, and only the census's markup column separates them. The tighter signal is total collapse — **25 works carry 25+ headings with every one at level 1**, including `sacrosanctum-concilium.hu` (130) and three editions each of `evangelii-nuntiandi` (91) and `christifideles-laici` (74). Separately, the promoted-prayer-stanza defect has **2 confirmed and no population**, because the obvious test ("an address-less heading that is a full sentence") returns 67 works of which most are correct: Latin, French and Italian end a real heading with a full stop by convention.

**What to do first, and the caveat that reading the exhortations added.** §2's recommendation stands — compare structure trees across languages rather than section sets, turning a manual audit into a ranked worklist. The caveat is that **the oracle ranks but does not adjudicate.** `evangelii-nuntiandi` reads exactly like §2's `fratelli-tutti` case — de/es/fr/it/lv at 91 headings, hr 100, pt 89, and **en at 1** — and it is not a parse failure: the English mirror contains six bold runs in the whole document, all furniture, and the Italian edition's part titles appear on it in no form at all. It is an unstructured rendering of the same text. So the cross-language pass produces candidates and the raw page decides, which is the same directional reading `CLAUDE.md` already prescribes for the CCC's divisions. `evangelii-nuntiandi.la` (7) and `.hu` (8) want that check before anyone calls them damaged.

**The single highest-value fix** is the tier discriminator, because three readers working independently named the same rule: `<p align="left"><b><i>…</i></b></p>` is the middle tier and `<p align="left"><i>…</i></p>` is the tier below it, and the parser treats them as one. That is one predicate, and it is the difference between a two-level tree and a usable one in `ecclesia-in-oceania.en` (19 headings), `gaudete-et-exsultate.en` (30) and `familiaris-consortio.en`.

**Dependencies and sizing.** Nothing here gates anything else, and nothing here is blocked. Every item is a change to `vatican_docs.py`, which parses ~450 documents across several page templates, so each one costs the blast-radius measurement in `docs/writing-descriptions.md` — snapshot, `rebuild.py --only documents`, diff — and that procedure is now cheap (~18s) rather than the thing to avoid. **The 378 ToC oracles are the regression suite this work has been missing**: `audit.py toc` reports 72 disagreements today, so a fix that is right lowers that number and a fix that overreaches raises it, which no previous structure fix could check. Sizing per item is an estimate and not measured: the drop cap, the index caption and the trailing ToC look like a predicate apiece; the tier discriminator is one predicate plus a re-levelling pass; `santateresa`'s unemphasised headings are a detector change whose blast radius is genuinely unknown, because loosening the emphasis requirement is exactly what would start reading ordinary prose as headings.

**One filing, not a parser change.** `exhortation.redemptionis-donum.en`'s heading before §7 reads `Religious Profession Is a "Fuller Expression"of Baptismal Consecration` — no space after the quotation mark, `&quot;of Baptismal` in the source. A source defect with a known correct value, which is what `pipeline/corrections/` is for. Two others were left alone as reader-invisible: `christifideles-laici.en` prints "Lay Faithtul" and `"Criteria of Ecclesiality"for Lay Groups`.

## Sequencing and recommendation

Nothing here gates anything else; order is a priority argument, not a dependency one.

- **The row that used to lead this list has been paid off.** #3 led on a claim no other gap could make — that it was work which _revealed_ something rather than adding something, an apparatus that cost a crawl and rendered nowhere. That is no longer true: the Douay-Rheims's notes and arguments are on the page as of 2026-08-25. What remains of #3 is a question about a different surface, and it is small.
- **Nothing else here gates anything, and #5's sigla table gated nothing in the end.** The reverse citation index was long assumed to wait on it; it did not, and shipped without one. When the table finally arrived (2026-08-26, from the French and Latin editions' own front matter) it created no links either, exactly as predicted here: the CCC cites conciliar documents by siglum and encyclicals by spelled-out title, both of which already resolved, and the sigla that remain unresolvable — DS, PL, PG, CSEL, MGH — name works that are not in the corpus at all. What it did buy was the expansion layer, and evidence: the Latin table states outright that `SC` means Sources chrétiennes, which is a thing `refs-grammar.ts` gets wrong for two editions today (see its `DOCUMENT_SIGLA` docblock).
- **#13 lost its Compendium half on 2026-09-01, and what it left behind is worth carrying into the rest.** The four editions ship; `ru` now has content behind its chrome and `ar` is the only interface language left without any. Three things the build settled, all in `docs/research/pdf-editions.md` §5a and §8a: the extractor is a **per-edition** choice and not a global one (no single reader can read all four — poppler alone recovers the Russian's missing `ToUnicode`, MuPDF alone hides the Indonesian's invisible Italian layer); reproducibility is bought with a `readers` fingerprint over the binary's content rather than by pinning a library; and the "ships only where a sibling can check it" rule resolved **in favour of publishing**, because the sibling check turned out to be the language-independent cross-reference apparatus rather than the prose. Arabic still extends the reader rather than rewriting it, and its normalisation must stay separable — that part of the 2026-08-27 decision held.
- **Two rows left this list on their own schedule, and the second one changes what #1 means.** #14 shipped on 2026-08-31, and not as the one dictionary it was sized at: twenty were written, so `UI_LANGS` is now a SUPERSET of the content languages rather than a record of who happened to write chrome. No content language is owed an interface any more, and the failure mode has inverted with it — an interface language is no longer evidence the corpus holds anything, which is a thing any resolver reading `i18n.lang` as a content language now gets wrong. And #1's scrape landed on 2026-08-29 inside the ten-language expansion, which asked for Latin among nine others rather than for Latin alone. What is left of #1 is the half that was never a scraping question.
- **#15 is the only row whose research is finished and whose work is eleven independent pieces.** Deferred deliberately on 2026-08-28, the day the survey landed — the point of `docs/research/bible-texts.md` §One Bible per interface language is that the investigation does not have to be redone to start. Each language is one scraper against a named source with a measured markup shape, shippable alone, so this row can be picked up an hour at a time rather than needing a clear run. Start with German (`vulgata.info` is a MediaWiki carrying Latin, German and Allioli's notes in parallel) or French (`fr.wikisource`, 100 % proofread, verse anchors already in the markup); leave Romanian last, since it needs a versification survey before it needs a parser
- **The structure trees now have a regression suite, which is what changed on 2026-08-29.** Fixing them was never blocked on analysis — `docs/research/document-structure-defects.md` has described the problem since 2026-08-16 — it was blocked on being unable to tell a fix from a regression, since a parser change touches ~450 documents and nothing measured the tree. 378 ToC oracles read off the raw pages by hand now do: `audit.py toc` reports 72 disagreements, a number a correct fix lowers and an overreaching one raises. Three of the defects are visible to a reader today, which is the argument for placing it above everything that adds coverage rather than repairing it.

**Recommended order** (a priority argument, not a dependency one; #14, #13's Compendium half and #1's scrape left the list when they shipped):

1. **The structure trees' three reader-visible defects** — moved up now that #13's Compendium half has shipped.
2. **#13's Chinese Catechism** — the reader exists and the extraction is measured at 2,859 of 2,865; what it needs is a `zh` book table and a CJK face, which is publication work rather than parsing. The leaked contents opening §1 (18 works), the drop cap read as a heading (5), and `santateresa-delbambinogesu.en`'s three lost headings sit alongside it, then the tier discriminator.
3. **#9's reader-facing disclosure** — what the 2026-08-25 tier left behind, and a decision more than a task. Alongside it, the 101 unread silent-case candidates: reading them is the only way to find another Acts 14, and there is no tool left to write for it.
4. **#12's Summa and Haydock halves** — still the cheapest row on this list and the only one that adds no corpus at all: 8,763 references from the Summa and 11,491 from the commentary already resolve forward and reverse nowhere, and Haydock arrived after the row was written. Its Compendium half went first instead, on 2026-08-28, because answering that half's design question turned out to be the work rather than a prerequisite to it — "condenses" is not "cites", so it got an index and a sentence of its own rather than a row in `CitedBy`. What is left of #12 is the Summa, the commentary, the prayers, and the Bible-notes decision, which still belongs with #3's — and Haydock is the reason to take that decision now rather than defer it again, since it is the same apparatus with the circularity removed.
5. **#15's three remaining languages** — Polish, Russian and Romanian. German, French, Spanish, Italian and Hungarian shipped on 2026-08-28, Spanish included: Straubinger's manifest records `copyright.status: copyrighted` and the exposure was knowingly accepted as the self-resolving Matos Soares kind, so 1 Jan 2027 is when the term lapses rather than when the work could start. What is left is not scraping but the three decisions in the loose-ends section above, and none of them is a parser's to take. Deferred, not declined
6. **#13's Arabic Catechism and its six documents** — the normalisation layer has somewhere to grow now, and the documents are the smallest surface of the three.
7. **#2 search** — the largest unscoped item; needs a prototype before it can be planned.
8. **#1's cross-language oracle** — what the symmetry check should assert now that Latin is inside it; scoped below.
9. **#5 `related` / #6 Appendix B** — lowest urgency; each still needs a research pass in `docs/research/` style before implementation is scopeable.

## Latin — what the symmetry check should assert

The scrape is done, and so is the CCC half. `ccc.la` landed 2026-08-26 through `ccc.py`'s own edition table, its abbreviations page with it; the documents arrived on 2026-08-29 inside the ten-language expansion, which routed Latin through both of the URL templates `docs/research/latin-sources.md` §4 described — `_lt.html` on the archive mirror (`vat-ii_const_19631204_sacrosanctum-concilium_lt.html`) and a `/la/` path segment on the CMS (`leo-xiii/la/encyclicals/…rerum-novarum.html`) — as one more `lang` rather than as a new family, exactly as this section predicted it would be. Measured over `build/` on 2026-09-01: **203 Latin works, 199 of them documents** (163 encyclicals, 20 exhortations, 16 Vatican II). **The Compendium has no Latin edition anywhere on vatican.va** remains true and remains a permanent, source-level fact to design around rather than a scrape target.

`check_language_symmetry` generalised itself along the way, and not for Latin's sake: `_WORK_ID_RE` accepted only `en`/`pt` until Magnifica Humanitas arrived in nine editions, and the comparison is now n-way over every edition present, naming the one that deviates alone. So Latin has been inside the check for a week without anyone deciding what its presence there should mean. That decision is the whole of what remains, and it is a decision before it is a change:

- **A Latin/vernacular mismatch may be what translation _is_, not a defect.** The check reads a section-number mismatch as evidence of a parsing error, which is reasonable between two independent translations. Latin is the text the vernaculars translate. Comparing each vernacular **against Latin where Latin is present**, rather than comparing every present edition against every other, is the plausible better shape — and it is now a change with 199 documents' worth of evidence behind it rather than none.
- **The Bible is the precedent worth reading first.** Adding `bible.clementina.la` turned an unresolvable "both are faithful" into an adjudicable question — the Latin takes a side in all 31 chapters where EN and PT disagree, PT 25, EN 6, neither 0 (`pipeline/docs/oracles.md`). That is the argument for the against-Latin shape, made once already in another family.
- **What makes it worth deciding rather than leaving** is that symmetry across the document families is chronically FAIL by design, because a missing or differently numbered translation is legitimate and common. It is printed as a report and the parse gate is `pipeline/parse-baseline.json` instead. A check nobody can act on is the state to avoid, and it is the state this one is in today — so the question is not only what it should assert but whether the assertion can be made sharp enough to gate on.

This is flagged here so it is not rediscovered mid-implementation — the way the check itself was originally motivated by a real, found defect (`docs/research/vatican-documents.md` §6).

## The prayers glossa — tier 0 shipped 2026-09-04

The survey is `docs/research/prayers-glossa.md`. **§2's tier 0 is built**:
`commentary.preces.{lang}`, written by `pipeline/scrapers/prayers_glossa.py`,
fifteen languages — the Catechism's ¶2676-2677 on the Hail Mary, the
Compendium's qq. 578-598 on the Our Father and its qq. 33-217 on the two
Creeds. Only what quotes a clause of the prayer is kept; the rest glosses the
prayer as a whole and became `references` under the text instead (2026-09-05),
because an apparatus of unanchored notes at the foot of a seven-line Ave is
the Catechism reprinted beside the prayer rather than a gloss on it. Those
references reach further than the notes do — a prayer the two books name or
expound but never quote carries them alone, which is most of the dozen the
apparatus now touches. It cost no fetch and no new rights question, and the
machinery needed one new function (`anchorCommentaryLines`, the cursor walking
a prayer's printed lines instead of a verse). `pipeline/CLAUDE.md` §The
prayers' glossa and `site/CLAUDE.md` §Haydock on the page hold the rules.

**The order in this plan was Haydock first, and the measurement reversed it.**
Four prayers are Scripture and Haydock glosses all four — 37 notes, 11 with a
lemma, and **4** whose lemma the prayer prints. He annotates the Douay-Rheims
and the appendix prints a different English, so his Magnificat opens "doth
magnify the Lord" where the prayer reads "proclaims the greatness of the
Lord". §1's third property, and the rule that already keeps him off the CPDV.
The four get a link to their Scripture address instead, and the Catechism tier
became step 1. The general lesson is worth keeping: **"already glossed at
another address" is a claim about wording, and until the wording is compared it
is a claim about nothing.**

**Lemma, never the line — argued three times now.** §5 settled it on the
Portuguese Apostles' Creed going from seven lines to twenty-two with no word
changed; the curation made the same point from the other side, imposing a
`form` that moved line numbers again in three editions in one day. Tier 0 adds
the third and this plan had it backwards: it proposed refusing a headword that
spans a line break, and refusing cost 37 of 114 marks — the Catechism quotes a
clause the Ave sets across two lines. A break is the edition's typesetting, so
the anchor spans it and only the last line takes the mark.

What is left, in order:

1. **The Catechism on the Our Father and the Creeds, as LINKS not notes.**
   §2.1 and §2.3: the headings are the petitions and the articles, and the
   bodies are forty and two hundred paragraphs. `docs/link-surface.md`
   governs, and the four Scripture prayers above join the same surface.
2. **Then decide whether to go outside the corpus at all.** §3 ranks four
   public-domain works by how much work each is — the Roman Catechism, the
   three Lenten conferences of Aquinas, Britt on the Breviary hymns, Liguori
   on the Salve Regina. Each carries a fetch and a rights check.

Two things about the scope, unchanged by shipping:

- **The collection is 35 prayers and 20 editions.** The apparatus reaches two
  prayers and fifteen editions. The seven Vatican News devotions and the four
  editions that come only from there are all in §4's territory — modern
  formulas with no classical commentary — so they widen the collection without
  widening what a glossa can cover.
- **`latin_witnesses` is a second apparatus already in the curated files**, and
  it is not a glossa: 122 recorded departures of each edition's printed Latin
  from the canonical text. Whether a reader ever sees it is a separate question
  from this one, and answering them together would confuse an editorial record
  with a commentary.

**An apparatus that covers part of a collection is a fact about the sources;
one that pads the rest is a fabrication** (§ TL;DR). Two prayers of thirty-five
is what the sources support, and the page says so by offering the switch only
where there is something behind it.
