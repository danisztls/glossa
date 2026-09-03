# pipeline/CLAUDE.md

Operational notes for the scrapers and the rebuild. The repo root's
`CLAUDE.md` holds the corpus-safety rules that apply before any of this
(where the corpus lives, what may be deleted, the ledgers); `docs/decisions.md`
holds the full rationale wherever a § is cited.

## The rebuild recipe is `pipeline/rebuild.py`, and it is a program

It was a shell block in the corpus README with a "keep it current" rule
attached, and it rotted silently four times under that rule (stale paths, an
omitted scraper, a flag never passed, a language list one short — each cost
real works). **The rule is unchanged and now has somewhere to land**: a new
scraper is a `Stage` in `STAGES`, and anything a stage needs that a table can
state should be derived from the scraper rather than typed there — `phase2`'s
language list is `sorted(V.DIVISIONS)` for exactly that reason.

    uv run pipeline/rebuild.py                  # ~19s, zero network, 0 files written
    uv run pipeline/rebuild.py --list           # the stages, their globs, their work counts
    uv run pipeline/rebuild.py --only bible     # a group, or named stages
    uv run pipeline/rebuild.py --no-images      # skip dore's AVIF re-encode
    uv run pipeline/rebuild.py --changed-only   # only the stages whose inputs moved
    uv run pipeline/rebuild.py --jobs 1         # one stage at a time, output streamed

- **Every stage declares the work-id globs it writes, and those globs are a
  PARTITION of `build/`** — every work claimed by exactly one stage, none
  twice and none by nobody, asserted by reading `--list`. That is what makes
  running stages at once safe, and what makes the `wrote` column mean
  anything under `--jobs`.
- **The two document stages run `--offline` and take a lock per phase** rather
  than the one crawl lock. `V.run_lock_path` is where the argument is written
  down: a crawl's lock is about someone else's server and cannot be narrowed;
  an offline parse's is about racing a work directory, and phase 1 and phase 2
  do not share one.
- **`--changed-only` skips a stage whose `code`, `data`, `corpus` and
  `outputs` fingerprints all match the last run that exited 0.** THIS IS THE
  ONE FOR ITERATING ON A PARSER: editing `bible/martini.py` runs one stage in
  2s; changing nothing takes 0.5s. `code` is the script's real import closure,
  read off its `import` statements and hashed by content, so a new import
  counts the day it is written. It is OPT-IN, for the same reason
  `--skip-written` is: this project's standing failure mode is the silent
  stale answer. `--force` is the escape hatch, and the input it exists for is
  the one the fingerprints cannot see — a `bs4` or `httpx` upgrade changes a
  parse without changing a byte here.

**A stage that exits nonzero is not recorded**, so the next `--changed-only`
runs it again. The state lives in `<corpus>/.rebuild-state.json`, untracked;
deleting it costs one full rebuild.

**A run's exit code says whether it went worse than
`pipeline/parse-baseline.json`, and nothing else.** Until 2026-08-29 both
phases gated on the cross-language symmetry check, which is chronically FAIL
by design (a missing or differently numbered translation is legitimate and
common), so the recipe had exited 1 on every run it ever had and nothing was
checking it. Symmetry is now printed as a report, and the gate is a baseline
of the 312 works known to parse badly — same shape and reason as the site's
`reference-coverage.baseline.json`. `--accept-baseline` moves the floor for
the works a run touched and no others, so accepting after a one-pontificate
run cannot erase what a full run recorded.

**Two ledgers answer before the baseline does.** A `fetch-failed` whose URL is
in `absent-sources.json` is the origin's answer, not this run's failure; a
`no-translation-stub` recorded in `translations-checked.json` is a CMS slot no
translator filled. Anything those cannot explain lands in the baseline. A page
that parsed yesterday and reads as a stub today is in none of the three, and
fails.

**The gate is a floor under the parse's ADDRESSES, not under its structure.**
`validate_document` reads section ranges, gaps and citation resolution; it
never opens `structure.json`. Misspelling the Latin `CAPUT` label loses every
chapter division in every Latin document and the check reports nothing —
measured, not assumed. `rebuild.py`'s `wrote` column is what sees that, and
the cross-edition division comparison is what judges it.

**Resolve the path through `common.build_root()`, never by hand.** It takes an
optional corpus argument for the callers that are handed one (`audit.py`,
`census.py`, `apply_sweep.py`). The site's single construction is `buildSrc`
in `scripts/sync-corpus.mjs`.

## The scrapers' layout

```
pipeline/scrapers/
  common/            shared machinery -- paths, files, fetch, absent,
                     corrections, overrides, text, book_forms. Import it as
                     `common`; `__init__.py` re-exports the whole surface.
                     `book_forms.json` there is GENERATED from the site's
                     grammar (see below) -- never edit it by hand.
  bible/             cpdv, vulgate, matos_soares, and the sacredbible page
                     format the first two share; douay_rheims, introductions
                     and haydock, and the vulgata_online API format THOSE
                     three share (the only scrapers here reading JSON, not
                     HTML). `haydock.py` writes a COMMENTARY, not a Bible --
                     it lives here because it reads the same host and
                     annotates the edition beside it.
  ccc/               ccc, compendium, compendium_pdf (the four PDF-only
                     Compendium editions)
  summa/             the Summa, EN from CCEL + LA from Corpus Thomisticum
  dore/              Doré's 241 engravings: `plates.py` is the image
                     pipeline (crop, level, resize, AVIF), `dore.py` the
                     script over it. Anchors come from
                     `pipeline/dore-anchors.json`, never re-derived --
                     see "Output that is only regenerable" in the root
                     CLAUDE.md.
  vatican_docs.py    encyclicals, Vatican II, exhortations
  prayers.py
  audit.py census.py apply_sweep.py   tools over already-written output
```

**A scraper in a subdirectory needs the `sys.path` line above its imports.**
Python puts a script's own directory on `sys.path`, which is the entire
mechanism behind a bare `import common`; for `bible/` and `ccc/` that
directory is no longer the one holding the package, so each file inserts its
parent before importing `common` (and the per-host format module that itself
imports `common`). Ruff exempts imports that follow `sys.path` manipulation
from E402 — no `noqa` needed, and one added "for safety" is reported as
unused. Copying one of these scrapers and dropping the "odd" lines at the top
gets you `ModuleNotFoundError: common`.

**`common/book_forms.json` is the site's book table, exported.** `ccc.py`
tokenizes the Portuguese Catechism's inline Scripture locators with the same
surface forms `site/src/lib/refs-grammar.ts` links with; Python cannot import
the TypeScript, so `site/scripts/export-book-forms.mjs` writes the table as
JSON and `site/src/lib/book-forms.test.ts` fails when the two differ. After
changing `BOOK_VARIANTS_EN`/`BOOK_VARIANTS_PT`: `cd site && node
scripts/export-book-forms.mjs`, commit both.

**`common/paths.py` computes the repo root as `parents[3]`** and asserts the
result contains `pipeline/scrapers`. The assert is there because getting it
wrong yields paths that are merely _absent_ rather than obviously wrong —
`load_corrections` reads a missing directory as "no corrections filed", a
silent, corpus-wide no-op.

## Scraping vatican.va

- `robots.txt` says `Crawl-delay: 2`. This is a commitment in
  `docs/decisions.md` about our conduct toward someone else's server, not a
  tuning parameter.
- **Never run two sweeps at once.** It doubles the request rate and races two
  writers on the same work directory. `vatican_docs.py` holds a heartbeat
  lock; don't work around it.
- Expect ~1-in-6-to-8 transient failures (Azure edge flakiness, no 403s, no
  CAPTCHA). Retry with backoff; a genuine failure belongs in the run summary,
  never silently absent from the corpus.
- **The Pius XI index lists one encyclical twice**, and the corpus takes it
  once: `…firmissimam-constantiam` and `…nos-es-muy-conocida` are the same
  document at two addresses, byte-identical parses. `INDEX_DUPLICATE_SLUGS`
  drops the Spanish-titled slug at DISCOVERY, which is the shape to copy: both
  pages are real and both were fetched, so `raw/` keeps the second as evidence
  and only the second address goes. It is the only duplicate in the corpus
  (checked 2026-08-31 by hashing every work's `sections.json` and
  `appendix.json`).
- **A document's title is MANUFACTURED from its slug, and `SLUG_TITLES` is
  where that breaks.** vatican.va names an encyclical's file after its incipit
  in 234 of 256 documents — a habit, not a rule. The exceptions (measured
  2026-08-31 against each raw page's own `<title>`): fifteen slugs are
  TRUNCATIONS of the incipit (`orientales` is the one that also misleads —
  `orientales-omnes-ecclesias` is a different encyclical), six cannot carry an
  apostrophe/accent/comma, and one names something else entirely (Francis's
  2023 exhortation, filed under the saint it commemorates, is _C'est la
  confiance_). An entry records what the document's OWN language prints where
  editions disagree; `ideal-film` is deliberately absent (its editions
  disagree about the NAME). A stale key fails silently — the manufactured
  title is only reached when the table misses — so a full `--exhortations` run
  with no filter reports keys that matched no discovered document.
- **A page's own linked table of contents outranks every other level signal,
  and it is on 81 of 2,080 raw pages, not the three `extract_toc_outline` was
  written for.** The docstring said three until 2026-09-01 — nothing re-ran the
  count when the corpus quadrupled. **Re-measure it when the corpus grows**;
  that number is the blast radius of everything in the function. Three shapes
  it was hiding, all fixed that day:
  - **The depth cue can be STRUCTURAL rather than typographic.** A
    `<blockquote>` is the one indent that is RELATIVE, so it sets a FLOOR of
    one below the last entry outside it and never a tier of its own
    (`querida-amazonia.pt` nests sub-entries in one with no emphasis at all;
    `verbum-domini.en` wraps most of a chapter's sections and forgets one).
  - **The outline's own TITLE is not part of the document.** `INDEX`,
    `ÍNDICE`, `Tartalomjegyzék` sit outside the run of links that detects the
    outline. `_TOC_TITLE_WORDS` is a CLOSED table of 14 spellings, because the
    paragraph above an outline is as often the document's own name, its first
    division, or a rule of underscores — absorbing one of those loses a real
    heading.
  - **A `[9-14]` on an entry is an annotation, not a title** — it drops the
    fuzzy match below threshold exactly where the outline and body also
    disagree, and the entry then nests one tier too deep.
- **`--slugs` naming only exhortations parsed nothing and exited 0** until
  2026-09-01 (`run_phase2` `continue`d past the whole iteration when no
  encyclicals survived the filter). It is the recommended way to check a
  parser fix on one document; it was answering "clean run" to a run that
  parsed nothing.
- Source defects go through `pipeline/corrections/` with locator, exact
  before/after, reason and evidence — never a code special-case, never
  invented text. A defect with no known correct value gets documented, not
  fixed (§Corrections and overrides).
- **That rule is about PROSE. Broken markup is the parser's business.** A
  correction amends what the source _said_ and must be auditable; a mangled
  tag changes nothing a reader reads and only decides whether the parser can
  find the text, so repairing it restores the source rather than amending it.
  `martini.py` normalises three (`<em<`, `<br<`, one `zem>`) in code with the
  locators in its docstring, and that is correct.
- **`pipeline/corrections/` and `pipeline/overrides/` are different layers.**
  A correction says the _source_ is wrong and edits the fetched HTML before
  parsing; an override says the source is fine and our _derivation_ is not,
  and edits the parsed output. Keeping them apart is what lets `raw/` stay the
  record of what the source said. Overrides are the exception: before filing
  one, ask whether the defect belongs to one document or a class — it has been
  a class nearly every time (the layer holds 5 entries, all the same defect,
  filed only because the sole discriminator is cross-language and the parser
  reads one document at a time). See `pipeline/overrides/README.md`.

## The Magisterium is ten languages, and most of them print no paragraph numbers

Taken in on 2026-08-29 (§Languages): from EN+PT for 272 documents to **1,237
editions of 305 documents in ten languages** (en it la pt es fr de pl ar ru).
What will bite:

- **The crawl was already paid for.** Most pages were under `raw/` from an
  August `--fetch-only` run, and the recorded 404s covered most of the rest;
  the whole expansion cost 369 new requests. `--fetch-only` is what lets a
  crawl be an acquisition rather than a publishing decision, and the value of
  that only showed up months later.
- **Apostolic exhortations were fetched and never parsed** — `--exhortations`
  is opt-in and no recipe passed it, so 33 documents sat in `raw/` with
  nothing anywhere saying they were missing. If a family has a discovery
  function and a flag, check the rebuild recipe passes the flag.
- **`lt` is LATIN on the Vatican II mirror, `sw` is SWAHILI.** The archive
  mirror uses its own two-letter codes (`po` Portuguese, `sp` Spanish, `ge`
  German, `lt` Latin, `lv` Latvian, `be` Byelorussian); `VATII_LANG_FROM_URL`
  reads them off **the index's own link text**. Do not guess them — the same
  `lt` trap is documented for `catechism_lt` below, and guessing `sw` gives
  you Swedish.
- **Most non-English editions are UNNUMBERED, and that is a property of the
  editions, not a parse failure.** 328 print no paragraph number anywhere
  (mostly it/la/fr); their whole text is stored under the headings the source
  does print, in `appendix.json`, with no citable address. Read an empty
  `sections.json` as an unnumbered edition, not an empty document.
- **A stray numbered list is what defeats the parse.** An edition with no
  paragraph numbers but a numbered list of decrees near the end reads as a
  six-section document whose §1 holds everything before the list. The
  signature is one section holding over half the text; those parses are
  switched off in `site/unpublished.json` (25 works today, each with its
  measured percentage), because a reader cannot tell a swallowed document from
  a short one.

### "Do we have every language?" — answered in the ledger

`pipeline/translations-checked.json` holds the answer, written by
`pipeline/scrapers/record_translations.py` — without one request, because
every answer was already in `raw/`. What to know:

- **A raw document page that produced no work directory is a page with no
  document on it.** The tool runs the real `parse_document` and records a
  status only where it raises `StubPageError`; a page that parses is printed
  as unexplained. vatican.va serves the stubs **200, not 404** — the CMS
  generates a URL slot per (document, language) whether or not a translator
  filled it, and the page's own `EN - IT - LA - PT` bar is its statement of
  which editions exist.
- **`pdf-only` is the one status that does not mean absent.** Six editions
  exist only as PDF, which nothing here reads — the **English _Amoris
  Laetitia_** among them, worth knowing before reading a hole in an English
  column as the source's fault. The evidence is a `/content/dam/` href whose
  language suffix matches the page, in the mirror's codes (Latin arrives as
  `_lt`).
- **The ledger is an input, and the manifests catch up on the next parse.**
  `write_document_outputs` reads it into `manifest.translations`
  (`common/translations.py`): the ledger is the record, the manifest a copy.
- **Ten is our boundary, not vatican.va's — a vocabulary, not a wall.** Each
  document's switcher offers more (`hu`, `zh`, `be`, `nl`, `sl`, `vi`…), but a
  switcher entry is a link and a link can lead to a stub — read it as an upper
  bound.

### Twelve more languages, and the answer to "hard constraint or table?"

Same day: **`DIVISIONS` is a data table and a new language is a vocabulary
entry**. The CLI's refusal to parse an unlisted language guards against one
undivided blob, not against new languages. cs da fi hr hu lv nl ro sk sl sw vi
added 139 editions for 141 requests; ten damaged parses are in
`site/unpublished.json`, everything else accounted for.

- **The cheapest useful entry is the four nouns and nothing else** —
  `_NUMERAL` already reads `CAPUT III` and `III CAPUT` with no vocabulary.
  Ordinals only matter where the language spells a division number out as a
  word.
- **An empty `ordinals` was a latent bug**: `_alt` returned `""` and the
  pattern became `(…|)` — an alternation with an empty branch, so ordinary
  prose opening with the word "part" read as a division. Fixed in
  `_compile_labels`.
- **`--offered-only` is why the crawl was 141 requests and not 2,816.** Every
  modern-shell page prints a language switcher, and it is EXACT rather than
  generous (measured over all 1,736 pages). The flag falls back to asking when
  the base page is not cached, so it can only save requests, never lose an
  edition.
- **Five of the twelve have an empty `nouns` entry, earned by READING**: a
  candidate noun is proposed by count and then read, never counted and
  believed. Danish `DEL` scored 31 and every one is the prose phrase "del i";
  Croatian `DIO` scored 3, all inside "vidio"; Finnish `LUKU` scored 1 and it
  is a sentence about John 17.
- **The English fallback reads these languages' Scripture forms correctly but
  incompletely** — every resolving surface was checked and nothing mis-links;
  what is missing is coverage (Hungarian `Zsolt` etc.), which is what
  `book-forms-oracle.mjs --derive` is for.
- **Non-Latin scripts need a table, not code — except Chinese.** Russian,
  Arabic and Byelorussian (`be`, 31 editions) prove the point. **Hebrew needed
  three lines, none about the script**: the modern CMS spells Hebrew `iw` (the
  retired ISO code) while the Vatican II mirror spells it `he`, and the corpus
  stores `.he` — which broke `url_lang_key`, `translation_url_for` and
  `--offered-only` at once, invisibly, on the ONE document offering Hebrew.
  The fix is `MODERN_LANG_TO_URL`, and the rule it encodes: **`lang_urls` is
  keyed by what the SOURCE calls the language, never by what we call it.**
  Chinese is the one real code question (`第一章` interleaves the numeral;
  `_NUMERAL` has no CJK digits).
- **Ukrainian and Mongolian are switcher entries that lead nowhere** — all
  four pages are the 200-with-no-document shell, recorded as `stub-page`.
  That is why they have a `DIVISIONS` entry and no editions.
- **`Пар.` is the near-miss worth remembering**: it out-scored every real
  Byelorussian division noun, and it is `параўн.` — "cf.", the first word of a
  footnote. Counting without reading would have made every footnote a chapter
  heading.

## The Catechism is eight editions in three page formats

Ingested 2026-08-26 (`docs/decisions.md`, `docs/corpus-schema.md`
§Catechism). `ccc.py` reads every language vatican.va publishes the CCC in as
HTML (`de en es fr it la mg pt`) and captures the two PDF-only ones (`ar`,
`zh`) into `raw/` for nothing to read.

- **`catechism_lt` on vatican.va is LATIN, not Lithuanian.** The site's own
  link text says so, and the pages say `PARS PRIMA` — `lt` there is _latine_.
  (The Compendium's Lithuanian PDF two directories away is
  `compendium_catech_lit.pdf`.) Getting it wrong files the _editio typica
  latina_ under a language it is not in, and no check catches it.
- **Three page families, not eight parsers**: `intratext` (en/fr/de),
  `cms` (es/it/la/mg) and `pt` (its own per-chapter mirror). `EDITIONS` names
  the source, `LANG_CONFIG` the reader, `_LABEL_PATTERNS` the labels.
- **Only five of the eight print footnotes.** French, German and Spanish fold
  every reference into the running text, so their paragraphs carry
  `citations: []` by construction and their stored text is longer. That is the
  edition, not a gap — see `docs/corpus-schema.md`, and read `audit.py
balance` with it in mind.

**Two editions print an abbreviations table, and they are not the same
table.** French serves 58 sigla, Latin 119, parsed into `abbreviations.json`
by `Edition.sigla` and `SIGLA_READERS` from pages the body loop never visits.
The two **disagree on two entries** (`SC`: _Sacrosanctum concilium_ vs
_Sources chrétiennes_; `CA`: _Centesimus annus_ vs _Corpus apologetarum_) and
each is right about its own edition's references — so the schema is
per-edition, the other six stay `[]`, and `abbr` is not even unique within one
edition: read the array in order and use `kind`. **Both tables feed the site's
grammar**, where the collision mattered — see `site/CLAUDE.md` §Reference
grammar.

## The Compendium of the Social Doctrine numbers a letter the way it numbers itself

`csdc.{lang}`, ten of the twelve editions vatican.va publishes as HTML
(2026-09-02, `docs/decisions.md` §Scope, `docs/corpus-schema.md` §Compendium of
the Social Doctrine).

- **The page is split by READING the numbers, not by counting `<hr>` rules.**
  Sodano's letter of transmittal numbers its own paragraphs in the form the
  document numbers its 583: handed the whole page, `parse_document` took the
  letter as §§1–5, rejected the document's own 1–4 as backwards-running, and
  resynchronised at §10 — reporting 583 sections, no gaps, range 1..583. Every
  check here asks whether numbers are well formed and none asks whose they are.
  Four editions print no `<hr>` at all, so the markup could not have decided it.
- **A change to `vatican_docs.py` for one work is measured over all of them
  before it is kept.** The nine this needed improved 58 existing works —
  `BOLD_BARE_NUM_RE` (a bare bold numeral, no period) is how every Czech
  Vatican II edition prints its paragraph numbers, and
  `sacrosanctum-concilium.cs` went from 9 sections to 130.
- **A drop in one direction is not a regression if the other rose.** Reading
  this work moved references out of `linkifyProse`'s running-text scan and into
  the footnote apparatus, so `vatii` prose scripture fell while its linkable
  citations rose by more. Accept a coverage floor only when the citation column
  has risen to meet the fall (§The Compendium of the Social Doctrine).
- **After a rebase that touches this file, re-parse before reading a coverage
  number.** The corpus on disk was produced by the OLD parser; the report is
  measured over it, so a merged fix shows up as a loss until `rebuild.py` runs.
  Cost one wrong diagnosis on 2026-09-02.
- **`appendix.json` is the front matter and nothing else.** It carried the
  index of references too until 2026-09-02, and carried it badly: 19 KB of the
  English edition's ~195 KB reached it, stopping mid-block after Revelation
  21:3 and losing the Ecumenical Councils and the Papal Documents outright. It
  is a concordance keyed to this work's own paragraph numbers, not prose, so
  it is to be parsed as references — a truncated concordance nobody can query
  is not a smaller version of the thing.
- **The sigla tables are the boundary of the front matter, and reading them as
  one is what fixed four editions.** `split_page` can only excise the contents
  list where `toc_link_span` recognises one, and it recognises one by its links
  pointing forward — so on `hu`, `pl` and `vi`, whose contents list is plain
  text, it returns `None`, the region opens at the language bar, and Hungarian
  shipped 64 units of its own outline (207 KB) ahead of the letter. The page
  family fixes the order, so a block at or before the last one the sigla reader
  took cannot be the letter (`_front_cut`). The guard matters: `vi` prints its
  one table LAST, and cutting there would have deleted its whole front matter.
- **A unit whose table the sigla reader took must be CLOSED, not just marked.**
  Left open, the next block that was not itself a heading joined it — which is
  how `csdc.fr` shipped Sodano's letter titled `ABRÉVIATIONS BIBLIQUES`.
  English never showed it because its letter opens full-bold and starts a unit
  either way.
- **A part's epigraph belonged to the paragraph BEFORE it, and the count of
  blocks is what recovers it.** The source prints `PART TWO`, a quotation from
  Centesimus Annus, then `CHAPTER FIVE`; `reclaim_mid_body_prose` hands prose
  buffered under a heading back to the section that heading interrupted — right
  for an encyclical's mid-paragraph subheading, wrong here — so §19, §208 and
  §520 each ended with the NEXT part's epigraph as their last sentence. A
  numbered paragraph of this work is exactly ONE block, and §19/§208/§520 were
  the only sections in nine of ten editions carrying more, so
  `lift_part_epigraphs` moves the trailing blocks onto the section the part
  opens at. It reads the count and not the markup because the markup differs in
  every edition: `align="right"` on the whole quotation in English, on the
  attribution alone in Hungarian, on nothing at all in Polish.
- **`PART_STARTS` is a constant because no edition can be asked.** The parts
  open at §20, §209 and §521 in all ten — they are translations of one numbered
  text — while the editions disagree about whether the part heading reaches
  their outline at all: `csdc.fr` emits no part row, `csdc.es` one, and
  `csdc.sw` read two of its own epigraphs AS headings (which is why it lifts
  one epigraph and not three).
- **Two editions are withheld with the measurement in `csdc.WITHHELD`**: `id`
  publishes only a table of contents, `nl` interleaves per-group-numbered
  footnotes so pooling resolves citations to the wrong notes.
- **`KNOWN_GAPS` and `KNOWN_DANGLING` are tables, not silence.** Eight
  paragraphs have no address (the source puts two numbered paragraphs in one
  `<p>`; the second's text is stored under the first's number, nothing lost) and
  nine markers resolve to no note. Hungarian's five are phantoms from a
  quotation's `(1)`–`(5)` — its real markers are bare digits glued to the
  preceding word and are unreadable.

## The Code of Canon Law is discovered, never derived

`cic.{lang}`, the seven languages vatican.va publishes the Code in as HTML
(2026-09-03, `docs/decisions.md` §The Code of Canon Law, `docs/corpus-schema.md`
§Code of Canon Law). 1,752 canons per edition, over 1,061 pages.

- **A scope decision that rested on a guessed URL's 404.** The Code was out of
  scope for "no Portuguese edition on vatican.va at all" and the survey also
  recorded no Latin one. Both wrong: Latin is `cic_index_la.html` (`lt` 404s,
  the exact inverse of `catechism_lt`, which IS Latin), and Portuguese is a
  488-page PDF with a clean text layer. `archive/cdc/index.htm` lists every
  edition and links each; **where an origin prints an index of what it has, a
  derived address is a hypothesis.**
- **Nothing constructs a page URL.** Six index pages name their own edition's
  content pages and the conventions share no rule — `cic_lib1-cann7-22_en`,
  `cic_libroI_7-22_it`, `cic_libro1_cann7-22_sp`, `cic_liberI_la`, in the
  directories `eng`, `ita`, `esp`, `deu`, `fra`, `latin`.
- **INDEX ORDER IS NOT DOCUMENT ORDER**, and `order_pages` sorts by the largest
  canon number on each page. The English index links `PART II` before the
  section it opens with, so canon 330 arrived after 430 a hundred times; the
  LARGEST is taken because Spanish's markers are bare numbers and so are its
  enumerated items, which makes every page's smallest a `1`.
- **Book VI is the text in force and the PDF beside it is not a replacement.**
  Each index links a _Nova versio Libri VI_ PDF, which reads as "the HTML is the
  1983 book" and is not: the HTML carries the _Pascite Gregem Dei_ revision.
  Read canon 1398 before believing a filename.
- **The three signals a heading has are centring, the mirror's brown, and
  capitals, and no edition uses all three.** English prints `BOOK I` flush left
  in colour and its chapters as unstyled paragraphs; Spanish prints its articles
  the same way; French, German and Russian never use the colour at all. The
  amendment mark is ALSO brown, which put every marked paragraph into the
  outline until `page_blocks` learned to read the colour past it.
- **A canon marker is capitalised and a self-citation is not**, which is the
  whole of what separates `Can. 1312` opening a canon from `can. 1452` inside
  one — needed because two pages run several canons into one paragraph. The
  second guard is that the number must be the one that comes next, and the
  third is that a marker is never followed by a comma: the English page for
  canons 1400–1500 prints `Can. 1423, the conference of bishops must
establish…`, which is canon 1439 §2 quoting 1423 with its opening words lost.
- **`strip_leading_text` exists because entities are not characters.**
  `vd.strip_leading_text_html` walks a prefix across tag boundaries and skips
  whitespace, but `&nbsp;` is not whitespace and `T&Iacute;TULO` does not start
  with `T`; 235 Spanish divisions read `TÍTULO I TÍTULO I DE LAS LEYES`.
- **A block's text is derived like the STORED text, not with every tag as a
  space.** The French edition prints `C<b>an. 237</b>`, which the every-tag-a-
  space rule reads as `C an. 237` — not a marker in any language, and canon 237
  was gone.
- **The Latin Book VI page is a Word table export and the repair is the
  parser's business.** One canon per `<td>`, each closing with an unclosed
  `<p>&nbsp;`, which made the block scan match spans starting in one cell and
  ending in the next: 43 canons missing, 46 of their neighbours fine.
  `unwrap_word_cells` rewrites a cell only where its `<p>`s do not balance or it
  has words before its first one — the archive template's own content cell is a
  leaf cell too, and rewriting THAT flattens the `align="center"` the whole
  outline is read from.
- **The amendment apparatus is cut at the edition's own legend.** Three
  editions reprint superseded wordings after the Code; the boundary is the
  `( n : …)` line that explains the mark, with the typographic rule as a
  fallback. Cutting at the first repeated canon number instead took 61 English
  canons out of the corpus, because the Code cross-references itself in prose.

## The Summa is the exception to two rules at once

Ingested 2026-08-23 (`docs/decisions.md`, `docs/corpus-schema.md` §Summa). It
breaks two assumptions the rest of the corpus satisfies:

- **It has no Portuguese edition, and will not before 2055** (Correia's
  translation is in copyright; the free online one is machine-translated). So
  the rule is an explicit chain — reader's language, then **English, then
  Latin** (`CONTENT_LANG_FALLBACK` in `site/src/lib/corpus.ts`) — resolved
  **per address**, not per work, because:
- **Its two editions cover different parts.** `summa.en` has five, `summa.la`
  four (the Corpus Thomisticum publishes no Supplementum). A citation to
  `Suppl q. 77` must reach English even for a reader who prefers Latin.

Neither is a gap to fill. `validate` asserts the shape rather than symmetry —
but the cross-language oracle still runs over the parts both editions carry,
and found three articles whose body the English edition omits.

## Haydock: the commentary in the pipeline

`commentary.haydock.en` is the first `type: 'commentary'` work
(2026-09-01, §Addresses and editions, `docs/corpus-schema.md` §Commentary):
its units ADDRESS `bible.douay-rheims.en` rather than containing text —
Haydock wrote an apparatus on the Challoner text, not a translation of it.
The site's half (rendering, preferences, anchors) is in `site/CLAUDE.md`.

- **`rebuild.py` has a dependency edge now, its first**: `haydock` reads
  `bible.douay-rheims.en` out of `build/` for its crawl plan and validation
  oracle, so `Stage.needs` and `waves` exist. The outputs partition is still
  about WRITES — it never said anything about reads.
- **A book cannot be walked to its first empty chapter here** —
  `douay_rheims.py`'s rule inverts, because a chapter Haydock did not annotate
  answers `[]` exactly as a chapter past the end does. The plan is read off
  the annotated edition, and one chapter past each book's end is probed so the
  plan is checked rather than trusted.
- **The source's sub-note markers are ALL `#1` and pair by POSITION** — one
  `__Notes:__` block per `_(#1)_` anchor, in anchor order (Apocalypse 20:2 has
  sixteen of each). Reading the digit as a marker silently collapses them.
  `validate` asserts the counts agree; `number_anchors` renumbers on the way
  out.
- **One `fn` record is one VERSE, not one note** — blank-line-separated
  paragraphs, each one authority's remark, which is why the stored unit is the
  paragraph. 69% of notes close with an authority from a CLOSED vocabulary; a
  tail outside it keeps no `attribution`, and `--attributions` reports the
  residue so the vocabulary is widened by reading, not counting.
- **A blank line is not always a paragraph break**: 20 records print one
  inside an open italic run (a two-phrase lemma), and splitting there strands
  an orphan `_` in the reader's text. `split_paragraphs` rejoins while the run
  is open; the safety measurement is that not one of 20,814 records has an odd
  number of underscores overall, and the anomaly report is for the record that
  would prove that stale.

## Work that spans languages

Editions of one work covering the same canonical address space are a free QA
oracle: their unit-number sets must match, and any asymmetry is a defect.
That caught three parser bugs that each looked plausible in one language
alone. It does **not** generalize to the encyclicals, where a missing
translation is legitimate and common — there the rule is "when both exist,
they must agree".

**Where the address space is fixed, that oracle is vacuous, and it will not
tell you so.** The Compendium is questions 1–598 in every edition by
construction — and while it reported symmetry, four English answers were
missing their entire bulleted enumeration (2026-08-25). The CCC is 1–2865 the
same way. **Compare the DIVISIONS instead**: the unit sets cannot disagree,
but the structure trees can — English had 59 in-brief divisions where three
editions agreed on 81; twenty-one were a year-old parser defect, one a source
omission. It is a three-line script over `structure.json`, and nothing else
sees it, because round-trip, coverage and balance are all per-unit and a
division is not a unit. **Read it directionally**: an edition doing something
the others do not, consistently, is that edition; an edition missing what the
others all have, in scattered places, is the parser.

**What sees loss _inside_ a unit is `audit.py balance`**: per-unit text length
against the sibling edition, normalized by the pair's own median. Run it over
the CCC, the Compendium, the prayers and the Summa; deliberately not over the
documents (a section number is not the same section in both editions —
`coverage` is the instrument there) or the Bible (versification divergence,
not loss). It reports and never fails. **It scales quadratically, and that is
what makes it worth running** — the all-pairs matrix is what found the Swedish
Compendium storing 39 answers as nothing but their own reference line, which
against English alone would have read as one more terse translation. Its
first Catechism run produced 375 outliers and three real defects (Malagasy
appending a page's whole footnote apparatus to its last paragraph; Latin
doing the same for a different reason; German and French both storing §103 as
a seven-character fragment — a citation split at the "103" in "(Augustinus,
Psal. 103,4, 1)"). **Read the count, not the list**: each defect was one
edition far outside a band the other seven agreed on.

**`audit.py refs` is the one oracle allowed to VOTE, and only because its
subject is not written in any language** (2026-09-02). Every Compendium
edition prints, beside each question, the Catechism paragraphs it condenses;
those numbers are fourteen COPIES of one assertion, so the modal set is an
oracle where `balance`'s strongest claim is "a lead". First run: 98 defect
leads, 38 corrections. The rules:

- **Read the SHAPE, not the count.** A consistent subset or superset is the
  EDITION (German prints only the first of two ranges at 170 questions and
  its raw page says so); overlapping and disjoint sets are misprints — no
  convention produces a set that crosses the others without containing it.
- **Two editions agreeing on a wrong value are ONE witness** — a shared
  exemplar, not two observations. It kept three questions out of
  `corrections/`.
- **The vote proposes; something else decides.** Every correction carries a
  witness independent of the count: the apparatus's groups ascend, its last
  group is the article's In Brief (the In Brief test is a heuristic and fires
  backwards once), and — decisively — the Catechism paragraph itself can be
  read.
- **A correction is a global substring replacement, so a swap cannot be two
  of them** (they undo each other exactly); each half quotes its own question
  heading. Entries apply in FILE ORDER, and one may quote the page as an
  earlier entry leaves it — the files are ordered by question, then filing
  date.
- **A PDF edition's margin needed a fourth correction field**: a margin number
  recurs down a page, so `margin_refs` is matched by EQUALITY against one
  question's assembled reference string and located by that question — and a
  filed entry whose question the walk never reaches is fatal rather than
  silent.

**The Catechism is deliberately NOT in that audit**: `related` is empty in all
22,920 paragraphs of all eight editions (the mirrors do not print the margin
apparatus; every manifest records the absence), and its `citations` are prose
whose conventions differ per edition, so counting across editions measures
the CONVENTION. Restricted to the three that share one (it/la/mg) it is worth
71 paragraphs. `docs/research/ccc-citation-apparatus.md` has the sharper
instrument.

**`audit.py apparatus` is the seventh audit and the first to look at the
magisterial documents' footnotes** (2026-09-02) — nothing had: `coverage`
cuts the raw page at the footnote boundary, `stored_text_len` counts no
citations, and `balance`/`divisions` are per-unit. The corpus stores 92,519
citations, and **24,154 notes the source prints reach no reader**. It is
three questions sharing one walk — RECALL is ours, SERIES is arithmetic on
the source, the VOTE is the source judged by its own translations — reported
apart so a note we dropped and a misprint we kept cannot read as one thing.

- **Two exact measures beat one heuristic**: a hole in the marker run `1..N`
  cannot be made honest (stray `(302)` in prose, per-chapter restarts, a
  guessed end). Reading the source's own footnote list with the parser's own
  reader (`split_region` + `build_footnote_table`) asks both halves exactly —
  a stored citation whose marker reached no note, and a note no citation
  carries.
- **The two total failures point in opposite directions**: `list-unread` (123
  editions — markers found, footnote LIST not, so an apparatus of markers
  pointing at nothing) vs `markers-unread` (97 — list read whole, not one
  marker matched; `vita-consecrata.la` stores 0 citations against 427 notes).
  `partial` is the remaining 199.
- **A volume of the Acta is its year minus a constant, so a reference convicts
  itself** — the only check needing no second edition. The constants are
  DERIVED (98.71% of 19,782 AAS references satisfy `volume == year - 1908`;
  the 304 failures are transpositions). ASS takes its own offset and ceased in
  1908, so an ASS reference to a later year is the other series misspelled.
- **Read the COLUMN, not the row** — the French Vatican II edition prints the
  cited document's paragraph number where the volume goes at 33 of its 76
  references. That is the edition speaking; ranking references instead of
  editions would open the report with it.
- **Here the vote is the SUPPLEMENT — the exact inverse of the Compendium's
  `refs` — and what differs is the precondition.** These are different
  apparatus (editions of one document print 53/62/63 notes), so footnote _k_
  is footnote _k_ only where the marker sets are identical: 24 documents of 271. What it adds is the PAGE, which arithmetic cannot judge.
- **An edition that cites the first page of a range is not misprinting it** —
  the Byelorussian prints a narrower span ten times out of ten, a convention.
  `SERIES_DEFECT_SHAPES` is the four no convention produces (`series`,
  `volume`, `year`, `page`); `page-narrower`, `page-wider` and `count` are
  editions being editions.

**The first run's top lead was a parser fix, applied: 730 notes back.** The
delimiter and digits of a `(N)`/`[N]` marker are not always adjacent (a Word
export opens a `<font>` or `<a>` between them); `_MARKER_INLINE_TAG` widens
the two intolerant marker templates, and the substitution KEEPS the tags it
matched (dropping them unbalances the markup and italicises the rest of the
block on `(</i>N)` markers). What to know:

- Verified by parsing the whole corpus both ways: +730 citations in exactly
  the 20 works a scan over `raw/` predicted; eight works went from no
  apparatus at all to a complete one.
- **Whitespace is deliberately not tolerated**: `( N)` gains 12 markers and
  costs two false ones, and a false marker is worse than a missing one — it
  takes a printed number out of the reader's prose and files a footnote where
  the source never marked one. The one real marker it costs
  (`iucunda-sane.it`) is recorded in `pipeline/parse-baseline.json`, and named
  here so it is not rediscovered as a mystery.
- **The footnote list needed the same widening one layer down**
  (`build_footnote_table_anchor`); `ecclesiam.la` prints an anchor name that
  is a typo for its own printed number — the only one of 465 anchor-keyed
  entries where the two disagree, and broken markup, so repaired in code.
- **The corpus on disk was stale against `HEAD`'s parser before the change**
  — the first rebuild after it reported 307 vatii files written and none of
  it was this. `rebuild.py --force` before reading a `wrote` column as a
  diff.
- **A recall fix scores as a regression in a checker that counts incidents**:
  finding more markers on a page whose list only partly resolves necessarily
  finds more unresolved ones (`eccl-de-euch.hr` went 47→100 citations and
  `1 -> 4 problems`). Read the two numbers together. What those exposed is a
  separate, pre-existing lookup defect, reported under `partial`.

**The Bible is the exception to reading asymmetry as a defect**, and the Latin
sharpened that: `bible.clementina.la` is the text the CPDV was translated
from, so where it, the CPDV and Matos Soares disagree about verse shape the
Latin is evidence, not a third opinion. Those disagreements are **edition
divergence, not defects** — `docs/research/bible-edition-divergence.md` has
the four kinds and why calling them defects invites someone to "fix" a
faithful text.
