# CLAUDE.md

Operational notes for working on Glossa Catholica. Architecture and rationale
live in `PLAN.md`, `docs/decisions.md`, `docs/corpus-schema.md` and
`docs/link-surface.md` — read those first. This file is only the things that
have actually bitten someone: the rule and its evidence, with the full story
in `docs/decisions.md` wherever a § is cited.

## The corpus: a separate repository, and two directories inside it

**The corpus is not in this repository.** It lives in `glossa-corpus`, a
**private** repository expected on disk as a sibling of this one — it holds
verbatim reproductions of texts other people hold rights in, and this
repository is public (`docs/decisions.md` §The corpus; the corpus repo's own
`README.md` has the copyright position).

Both halves resolve it the same way, so one exported variable moves both:

| Consumer    | Resolver                  | Default               |
| ----------- | ------------------------- | --------------------- |
| `pipeline/` | `common.corpus_dir()`     | `../glossa-corpus`    |
| `site/`     | `scripts/sync-corpus.mjs` | `../../glossa-corpus` |

Both honour **`CORPUS_DIR`**. The pipeline calls `common.require_corpus()` at
the top of each scraper's `main()` and dies with the path it tried — every
scraper creates its output with `parents=True` and would otherwise write a
phantom corpus somewhere nobody looks. The site warns and falls back to
fixtures.

Inside the corpus repo, **the directory names carry the distinction that
governs what may be deleted**:

| Path       | Value                                                                        | Rule                                |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| `build/`   | Parsed output. Rebuilt from cache in ~19s, zero network. **Untracked.**      | Safe to rebuild. Git holds no copy. |
| `oracles/` | Tables of contents read off the raw pages by hand. Nothing regenerates them. | Tracked. Treat like `raw/`.         |
| `raw/`     | Every scraped source page. The **only** artifact that cost real fetches.     | Treat as write-once. Never delete.  |

(`build/` was `works/`, tracked, until 2026-08-27 — §The corpus. It is one
copy plus the rebuild recipe now, and the recipe is the only way back to it.)

**The recipe is `pipeline/rebuild.py`, and it is a program.** It was a shell
block in the corpus README with a "keep it current" rule attached, and it
rotted silently four times under that rule (stale paths, an omitted scraper,
a flag never passed, a language list one short — each cost real works).
**The rule is unchanged and now has somewhere to land**: a new scraper is a
`Stage` in `STAGES`, and anything a stage needs that a table can state should
be derived from the scraper rather than typed there — `phase2`'s language list
is `sorted(V.DIVISIONS)` for exactly that reason.

    uv run pipeline/rebuild.py                  # ~19s, zero network, 0 files written
    uv run pipeline/rebuild.py --list           # the stages, their globs, their work counts
    uv run pipeline/rebuild.py --only bible     # a group, or named stages
    uv run pipeline/rebuild.py --no-images      # skip dore's AVIF re-encode
    uv run pipeline/rebuild.py --changed-only   # only the stages whose inputs moved
    uv run pipeline/rebuild.py --jobs 1         # one stage at a time, output streamed

- **Every stage declares the work-id globs it writes, and those globs are a
  PARTITION of `build/`** — every work (1,469 today) claimed by exactly one
  stage, none twice and none by nobody, asserted by reading `--list`. That is
  what makes running stages at once safe, and what makes the `wrote` column
  mean anything under `--jobs`.
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

The stated insurance policy is that any capture regret is fixed by
**re-parsing, never re-crawling** (`docs/link-surface.md`). That only holds
while `raw/` is intact. When judging whether a deletion is safe, the question
is never "is this corpus data" but _which of the two it is_.

**Output that is only regenerable from a previous copy of itself is not
regenerable.** This bit three times in one day: each was a fact the scrapers
kept alive by reading their own last `manifest.json`, so it survived a
re-parse and evaporated on a rebuild into an empty `build/` — which is the
supported way to get a corpus at all:

| what                                                     | where it lives now                             | scale       |
| -------------------------------------------------------- | ---------------------------------------------- | ----------- |
| definitive 404s                                          | `pipeline/absent-sources.json`                 | ~1,150 URLs |
| what a missing sibling-language edition turned out to BE | `pipeline/translations-checked.json`           | 635 records |
| the day each page was fetched (`retrieved_at`)           | `raw/<source>/captured-at.json`, in the corpus | all pages   |
| which verse each Doré plate depicts                      | `pipeline/dore-anchors.json`                   | 241 plates  |

The first two are knowledge derived where there is no page to sit beside, so
they are tracked here. The third belongs to the page, so it sits in `raw/`,
written by `Fetcher` at the moment it writes the file — the only point where
the answer is certain, since a cache hit never reaches it. (The dates were
recovered from filesystem mtimes, **which git does not preserve**.)

**The fourth is its own lesson: it WAS regenerable from `raw/`, and that was
the problem.** 202 of the 241 anchors came from tesseract, and OCR is not a
pure function of a file — a different engine build reads a digit differently,
so a rebuild could move a plate to a verse nobody chose, silently. The answer
was not to cache the read but to recognise the reconciliation had FINISHED:
the vote ran once, its result is committed, and the code that produced it was
deleted (2026-08-28) — evidence for a decision already taken belongs in git
history, not in a live file. `dore.py` kept only the image encoding, because
THAT is not settled and has to be able to run over the masters again.
**A pipeline stage that can only ever reproduce its own committed output is
not a pipeline stage.**

**The check that misses this class is a normalised field.** The rebuild
comparison excluded `retrieved_at` because the corpus README asserted it
carried no information — the assertion was false, and no reproducibility check
can disprove a claim that a value does not matter. Normalise `generated_at`
and `applied_at`, and nothing else.

**Deleting generated works is a decision for the person directing the work,
not a judgment call to make mid-task.** An agent once removed 105 empty work
directories on its own stub-detection heuristic; nothing was lost, but nothing
had authorized it either. If you are delegating, name the deletable set and
the protected set explicitly — a brief that only says what to _fix_ leaves
deletion as an unstated judgment call, and it will get taken.

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
  ccc/               ccc, compendium
  summa/             the Summa, EN from CCEL + LA from Corpus Thomisticum
  dore/              Doré's 241 engravings: `plates.py` is the image
                     pipeline (crop, level, resize, AVIF), `dore.py` the
                     script over it. Anchors come from
                     `pipeline/dore-anchors.json`, never re-derived --
                     see "Output that is only regenerable" above.
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

## Linting: ruff and prettier, behind a hook that is not installed for you

Ruff's rules live in `ruff.toml` at the repo root — not a `pyproject.toml`,
because the scrapers are standalone PEP 723 `uv run --script` files. The
selection is pinned rather than left to ruff's defaults, which have widened
between releases.

```sh
ruff format pipeline && ruff check --fix pipeline
git config core.hooksPath .githooks     # once per clone; git runs nothing from a tracked dir by itself
```

`.githooks/pre-commit` runs `ruff format --check` and `ruff check` over the
**staged content** of every touched `.py` file — piped from `git show :path`,
so an unstaged fix cannot make a broken commit pass, nor an unstaged breakage
fail a clean one. `ruff` from `PATH`, falling back to `uvx ruff`;
`--no-verify` bypasses. Note `git config` writes `.git/config`, which the
sandbox masks — run that one line with the sandbox off.

**Prettier runs in the same hook, over what is staged and nothing else**
(§Process) — everything under `site/`, plus Markdown anywhere in the tree.
Two invocation details are load-bearing:

- It runs **from `site/`** whatever the file, because prettier resolves a
  config's `plugins` against the working directory (`prettier-plugin-svelte`)
  and `site/.prettierignore` only applies from there. Files outside `site/`
  are addressed as `../path`, resolve no config, and get prettier's defaults —
  which is what the Markdown here is written to.
- A file prettier **cannot parse exits 0** over stdin and complains only on
  stderr. So the hook fails on any stderr output, not on the exit status.

It uses `site/node_modules/.bin/prettier`, falls back to `prettier` from
`PATH` (fine for Markdown; a `.svelte` file needs the plugin), and skips the
whole section when nothing it owns is staged. The pipeline's JSON stays out of
it: `pipeline/corrections/`, `pipeline/overrides/` and `absent-sources.json`
are written by the scrapers, and a hook that reformatted them would fight
their writer. `site/` still owns `npm run format` / `check` / `test` for a
whole-tree pass; the hook only decides _when_ something runs.

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

`pipeline/translations-checked.json` holds **635 records**, written by
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
by `Edition.sigla` and `SIGLA_READERS` from pages the body loop never visits. The two **disagree on
two entries** (`SC`: _Sacrosanctum concilium_ vs _Sources chrétiennes_; `CA`:
_Centesimus annus_ vs _Corpus apologetarum_) and each is right about its own
edition's references — so the schema is per-edition, the other six stay `[]`,
and `abbr` is not even unique within one edition: read the array in order and
use `kind`. **Both tables feed the site's grammar**, where the collision
mattered — see "Reference grammar" below.

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

## Haydock is a commentary, and a commentary has no address

Ingested 2026-09-01 (§Addresses and editions, `docs/corpus-schema.md`
§Commentary). `commentary.haydock.en` is the first `type: 'commentary'` work:
its units ADDRESS `bible.douay-rheims.en` rather than containing text —
Haydock wrote an apparatus on the Challoner text, not a translation of it.

**Pipeline and shape:**

- **It contributes no route, no sitemap entry and no `route-titles.json`
  name** — none of the address-grammar machinery (`hrefFor`,
  `isCanonicalPath`, `WORK_OF`, `assertNamed`) had to learn about it. That is
  the cheap fork of the two `docs/research/haydock.md` left open.
- **`sync-corpus.mjs`'s type chain has NO fallback**: an unhandled
  `manifest.type` registers its manifest and emits no content, no routes and
  no error — the work exists in `listWorks()`, renders nowhere, and 404s
  nowhere either. The branch to copy is `if (manifest.type === 'commentary')`.
- **The content path shape is the Bible's on purpose**
  (`content/{workId}/books/{osis}/{start}-{end}.json`, packed by the same
  `BIBLE_CHAPTER_CHUNK_TARGET_BYTES`), so
  `bibleChapterLocations` reads both with one regex and `bibleChapterChunkFor`
  is keyed by work id with no claim about type. Do not add a second lookup.
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

**Preferences and defaults:**

- **The reader's preference selects the apparatus, and it is a SET.**
  `apparatus-prefs.svelte.ts` cannot reuse `content.svelte.ts` — a reader can
  have two apparatuses beside one verse. Edition notes default ON and a
  commentary defaults OFF, and what is stored is the DIFFERENCE from the
  default, not the state — storing the state makes "never touched the panel"
  and "switched everything off" the same value, and the next work ingested
  arrives silently off for the first of them.
- **A commentary is offered at the edition it annotates** — `commentariesAt`
  takes an address and reads `annotates`. The argument went round twice; the
  settled condition is that the marks now sit at the words the notes quote, so
  a lemma-keyed apparatus really is undisplayable beside another edition.
  **The cost is real** (a CPDV or Clementine reader is not offered Haydock at
  all) and is paid rather than dodged. `subsumes_notes` is asked separately —
  "already contains the edition's own notes" is a narrower claim than
  "belongs beside this edition".
- **That cost is what moved the English default**:
  `PREFERRED_EDITION['bible:en']` is `bible.douay-rheims.en`, because with the
  gate back a reader who chose nothing (the CPDV has no notes either) got
  neither apparatus and no control saying one existed. **An edition gate on an
  apparatus is also a claim about which edition the default reader is on** —
  decide the two together or the apparatus is built for nobody. §Addresses and
  editions holds the argument and the price.
- **Haydock contains Challoner** — 1,399 of the Douay-Rheims's 1,916 notes
  reappear in the catena — so `CommentaryManifest.subsumes_notes` (a property
  of the WORK, written by `haydock.py`) flips ONE default:
  `editionNotesEnabled(workId, subsumed)`. **Nothing is suppressed** (the
  overlap is 73%, not 100%); the panel keeps the switch and says why it moved.
  That is also why the store's `off`/`on` lists both carry edition ids: a
  default that moves needs both directions.
- **Nothing is fetched until it is switched on.** `commentary.svelte.ts` is
  `xrefs.svelte.ts`'s shape and deliberately NOT part of the chapter route's
  `listBibleWorks()` loop; `commentary-chapters` is outside `AUTOMATIC_WAVES`,
  so it can never enter an offline fill uninvited.

**Same-chapter references** (`v. 12`, `ver. 5. 8` — an apparatus annotates one
verse at a time, so the page IS the chapter): `RefsOpts.sameChapter` is the
opt-in — `CommentaryGloss` passes the verse's own address, nothing else passes
it at all — worth 2,745 links, +31% on the work's apparatus.

- **`v.` is also the Roman FIVE**, and what separates them is the token
  BEFORE: a chapter-five is preceded by a capitalised word, a Roman numeral,
  or `and` continuing the locus. `sameChapterFalseLead` refuses those 593 and
  admits 2,753; `See` is the one capitalised word let through (a verb of the
  prose, never a work's name).
- **A `v.` inside a longer locus never reaches the guard** — `linkifyProse`'s
  merge drops any hit overlapping one that started earlier.
- **`parseVerseList` cannot be reused**: it chains a list on `.`, and at
  `v. 54. 2 Par. vi. 13` that eats the `2` of `2 Par.` as a verse.
  `SAME_CHAPTER_RE` encodes the guard (a real chained continuation carries its
  own full stop).
- **The bare run — `21. 27.` — is not linkable, by measurement.** Of 154 notes
  ending in a run of bare numbers, exactly one (Genesis 1:1) is verses; the
  rest are patristic and juridical loci whose title ends in a period, and
  nothing in the string distinguishes `matter.` from `Prolegom.`. It stays
  text.
- **The coverage meter had to be taught the same address**, gated on
  `family === 'commentary'`: `reference-coverage.mjs`'s `addUnits` tracks the
  osis and chapter down its walk. A Bible edition's own `notes` have the
  identical file shape and must NOT be read that way — `Sidenote` passes no
  address, and Challoner's `v.` is far more often a Roman five. The build side
  has to pass what the page passes.

**Rendering — marks, cards, margins:**

- **The dagger cost a font file.** `†` is NOT in either text family's `latin`
  subset (Google files U+2020 under `latin-ext`, 158 KB), so
  `static/fonts/source-sans-3-marks.woff2` is a 1.1 KB single-codepoint subset
  under its own family, precached with the core faces; `fonts.css` records the
  `pyftsubset` line. **`‡`, `※` and `⁂` are not reachable at any price** —
  checked with fontTools, Google's subsets do not carry them, so a second mark
  needs a different source font, not a different range. `sidenotes.test.ts`
  pins the codepoint against `fonts.css`'s `unicode-range`, because a mark and
  a face that disagree render in a system font and nothing fails.
- **It sets nothing in the margin, at any width** — the mark opens a card, the
  only way in. The gutter premise assumes an apparatus SMALLER than the text
  it hangs on, and this one is not (a chapter's notes run to 52 KB at worst).
  `NoteCard` has `{ margin: false }` and every gate reads `#inMargin`; the
  clamp, "read more", dialog and `commentaryChars` went with it. What stays
  global in `reading-chrome.css` is what genuinely has two owners:
  `.note-marker`, `.note-trigger`, `.note-popover`.
- **The dagger is superscripted by `vertical-align`, not by the glyph** — an
  asterisk is drawn high in its own em box, a dagger baseline-to-cap like a
  letter, so on the baseline it reads as a character of the verse.
  `.commentary-marker` overrides `.note-marker` in exactly two declarations.
- **What the marker opens is decided by LENGTH, not by apparatus.**
  `CARD_MAX_CHARS` is 900 (`overflowsCard` is the whole rule): under it a
  floating card, over it `.note-dialog`. The number is the card's own
  arithmetic (26rem × 32rem ≈ 1,490 chars; 900 keeps a card short of the
  scroll), and the same edition prints both a phrase and an essay, which is
  the argument for a threshold over a per-apparatus rule. It is the ONLY
  length threshold left — `MARGIN_CLAMP_CHARS` died with the gutter.
- **A 44px tap target on a mouse is a bug.** `.note-trigger::after` grows the
  mark as a positioned overlay, and a commentary's mark sits at the END of a
  verse, so the next verse's number was inside it. It is
  `@media (pointer: coarse)` now, and `.reference-number.inline` takes
  `position: relative` so where the two targets genuinely overlap (a phone)
  tree order settles it in favour of the address.

**The gutter gloss is gone for editions too** (2026-09-01): `Sidenote` set its
note beside the line — the _Glossa Ordinaria_ arrangement the project is named
for — and the same measurement retired it (Straubinger and Martini notes run
past the chapter; the column was neither beside its line nor bounded by it).
The mark opens a card, or a dialog past `CARD_MAX_CHARS`, at every width.
What STAYED:

- **`CitationDisclosure` keeps its margin copy** — a footnote's source is 26
  characters, the remark the arrangement was calibrated for — so
  `sidenoteRoom`, `.margin-note`, `--margin-lane` and `CompareGrid`'s claim
  are all live, and the lane is declared on every reading page to keep the
  column on the page's midline.
- **Paper is why `Sidenote` renders its popover unconditionally**: once the
  margin copy was gone, the card was the only copy of the apparatus in the
  document, and a printed chapter would have carried markers pointing at
  nothing. `print.css` sets `.note-popover` back into the flow. Gating on
  `!card.asModal` prints the short notes and drops the long ones — the worse
  half of both answers.
- **A commentary still prints nothing** — unchanged rather than overlooked:
  `CommentaryGloss` renders its card only when the mark does not open a
  dialog.

**The verse marks the lemma, and the note stopped repeating it** (2026-09-01,
`src/lib/lemma.ts`): `splitLemma` locates the words a note glosses,
`AnnotatedText` wraps them, `sidenoteRoom.highlighted` lights them while the
note is open, and `Sidenote` prints its headword only when the verse could
not.

- **The anchor is the MARKER, matched backwards, never a search** — the words
  are the run immediately before the token, so there is ONE candidate by
  construction and the match is either right or refused. A search would find
  the wrong occurrence of a repeated phrase.
- **The comparison ignores everything that carries no words** (case,
  diacritics, punctuation, whitespace) but still answers an exact OFFSET —
  `fold`'s index map is what buys the offset back. The `ELIDED` guard is
  load-bearing: `E... diede...` folds to `ediede` once the dots go, and would
  match across anything.
- **Fuzzy matching was tried and bought nothing** — a bounded edit distance
  recovers ZERO further headwords; what is left is not near-misses but notes
  that do not quote the verse.
- **Measured per edition**: douay-rheims 1,805/1,909 (95%), matos-soares
  1,377/1,743 (79%), martini **0/18,658** — Martini's notes are verse-level
  (every marker at position 0) and his lemma is a catchword with the elision
  printed in, a discontinuous quotation and so not a span of anything.
- **Refusing is a first-class outcome**: `lemmaMarked` is true exactly when
  the words were located and is the one prop that suppresses the headword —
  the two can never disagree. Dropping the headword unconditionally would have
  deleted 18,658 of the corpus's 22,310. **`CommentaryGloss` keeps its
  lemmas** — its card may hold several notes, where the headword divides one
  authority's remark from the next, and a trailing mark's notes have no words
  in the text at all.

**A commentary's marks sit at the words its notes quote**
(`commentary-anchors.ts`): 24,805 of 45,662 notes placed (54.3%), the rest on
a trailing mark at the verse's end, so the run has no holes.

- **The ORDER of the notes is the disambiguator.** 1,939 of Haydock's
  headwords occur more than once in their verse; a catena is printed in
  reading order, so the search carries a CURSOR and each note is found at or
  after the end of the last — 1,930 resolve, and the nine that do not (plus
  237 whose headwords run backwards) are refused rather than guessed.
- **The inline marks and the trailing mark PARTITION the verse's notes** — no
  note behind two marks, none behind none, pinned by a test because a leak
  would lose a fifth of the apparatus with nothing erroring.
- **`buildSegments` is a module because it had to be testable**: three
  separate cuts run through one verse (edition markers, edition lemmas,
  commentary lemmas), and any off by a character silently drops or repeats a
  word of Scripture. The round-trip property
  (`segmentText(segments) === text`) is in vitest and was run over all 20,789
  annotated verses of the real corpus.
- **An anchor that straddles a cut is dropped to the trailing mark**, so two
  apparatuses never nest — 0 anchors in the default state (`subsumes_notes`
  flips Challoner off), 1,568 with both on, none lost.
- **`commentary-anchors.ts` imports `./lemma.ts` WITH the extension** (like
  `route-manifest.ts` writes `./address.ts`): the anchoring is measured from a
  plain Node script, and the type-stripping loader will not resolve an
  extensionless relative specifier. Vite resolves it either way, so tidying it
  away breaks the measurement silently and not the site.

**The open state is a binding, not a field on `sidenoteRoom`.** `sidenoteRoom`
is the MARGIN's object; a verse with its own notes is local to one unit, and a
page-wide field there is a singleton needing a key both sides agree on.
`AnnotatedText` pairs on the PIECE INDEX alone (the run at `i` ends with the
lemma of the marker at `i + 1`). **It is an `onopen` callback, and was
`$bindable` for an hour**: `openNotes` is a deliberately sparse array, so a
parent binds a slot that is still `undefined`, and Svelte throws
`props_invalid_value` on a fallback plus an undefined binding — at HYDRATION,
a runtime error nothing in `npm test`, `npm run check` or the build sees.
A callback fits both consumers (`CommentaryGloss`'s trailing mark has nothing
in the text to bind to) and has no third state to explain.

## Corpus data must never be inlined into the bundle

`corpus-index.ts` globs the content tier with `query: '?url'` on the premise
that Vite emits the file as a separate content-hashed asset. **Below
`assetsInlineLimit` (4 KB default) that premise is false**: Vite base64s the
file into a `data:` URI and nothing downstream notices — the bytes land in the
boot chunk every route `modulepreload`s, `sw-policy.ts`'s `contentPath` cannot
make a pathname of it so the file belongs to no download wave, and `fetch()`
still works, so nothing errors. `vite.config.ts` disables inlining for
anything under `corpus-data/` and says why. **If a new content kind is small,
check `build/_app/immutable/assets/` actually contains it** rather than
trusting the file count (43 documents' `appendix.json` were inlined, unnoticed,
for as long as that tier existed).

**And the glob must not run under `npm run dev` at all.** An eager glob is one
static import per matched file: the build folds those into a chunk, the dev
server answers each as its own module request, and at 2,590 files Chrome fails
the surplus with `net::ERR_INSUFFICIENT_RESOURCES` — the module graph tears,
the page 500s, the service worker reports only `ServiceWorker cannot be
started`. `npm run preview` is always fine, which is the tell. So there is
exactly one glob (`site/src/lib/content-urls.ts` — it was written twice until
2026-08-26), and in `vite dev` even that one is replaced by
`content-urls.dev.ts`, which derives the same map from
`content-manifest.json` in a single request. `vite.config.ts`'s
`glossa:dev-content-urls` plugin performs the substitution and matches the
RELATIVE specifier because `vite:alias` is itself `enforce: 'pre'` and
resolves `$lib/...` before any other hook sees it.

## Running the site

**The site is one SPA shell, not a prerender** (`docs/decisions.md`,
2026-08-18). `prerender.entries: []`, `strict: false`, `ssr = false`; the
build emits `index.html` plus the offline fallback and nothing else per route.
So a broken link does **not** fail the build. What guards addresses instead is
`corpus-routes.json`, generated by the corpus sync and consulted by
`src/worker.ts` at the edge; `src/lib/route-manifest.ts` holds that grammar
and is unit-tested.

Canonical reader URLs are Latin and do not vary with interface language:
`/scriptura/{book}/{chapter}`, `/catechismus/{n}`, `/catechismus/caput/{n}`,
`/catechismus/compendium/{n}`, `/catechismus/compendium/caput/{n}`,
`/documenta/{slug}`, `/doctores/summa/{part}/{question}`, `/preces/{slug}`,
`/colophon`.

**`{book}` is a Latin slug since 2026-09-02, not an OSIS id** —
`/scriptura/iosue/1`, `/scriptura/i-samuel/3` (§Addresses and editions):

- **`BIBLE_BOOK_SLUGS` in `address.ts` is the boundary and the ONLY one.** The
  corpus is still keyed on the OSIS id everywhere (content paths,
  `corpus-routes.json`, `route-titles.json`, `apparatus.json` keys, the xref
  index) and `parseHref` still hands back an `osis` — `summaPartSlug`'s
  arrangement, one level down, which is why the change touched neither the
  pipeline nor the sync.
- **The table is DERIVED from `bible.clementina.la`'s own `name` field** (`ae`
  for `æ`, `J` folded to `I`). A slug judged wrong is a corpus defect — fix
  `pipeline/corrections/` and re-derive, never hand-edit the table, or the URL
  stops saying what the page says.
- **Anything building a `/scriptura/` href by hand must call `bookSlug`.**
  Two did (`chapterLink` in `shell-head.ts`, `bibleLink` in `apparatus.ts`),
  invisible until a test caught them. Prefer `hrefFor`.
- **The OSIS spelling 301s, and that vocabulary lives OUTSIDE the grammar**:
  `bookFromLegacySlug` is read by exactly two doormats that run before
  `parseHref` — `legacyBiblePath` in `src/worker.ts` (gated on the target
  existing, so a dead address 404s in place) and `migrateBibleHref` in
  `bookmarks.svelte.ts`, without which every reader's Bible bookmarks vanish
  silently (the store is keyed by raw href and drops what the grammar
  rejects).

**A reading address takes a language prefix as an ENTRY POINT** (2026-09-02):
`/es/scriptura/iosue/1` is served, persists Spanish as the switcher does, and
is replaced in the bar with the bare path by
`routes/[uilang=uilang]/[...rest]/+page.ts`. It canonicalizes to the bare
path, is in no sitemap and declares no alternates; `parseLangEntry` in
`route-manifest.ts` is the edge half. The eight `CHROME_PATHS` are unchanged
(published prefix, self-canonicalizing, `hreflang` cluster), so
`parseChromePath` is tried first everywhere. Two traps: `parseLangEntry` must
never be `noindex` (a `noindex` beside a canonical naming another URL can
carry to the target), and it must refuse a doubled prefix — it calls
`isCanonicalPath`, which calls back, so `/es/pt/…` would otherwise peel one
segment per round.

The English roots (`/bible`, `/ccc`, `/documents`, `/prayers`,
`/compendium/{n}`, `/summa/…`) deliberately resolve as invalid — no
compatibility layer (§Addresses and editions). **`/doctores` is not in the
nav**, deliberately: the Summa awaits a quality pass and the shelf holds
nothing else; restoring the entry is one line in `+layout.svelte`, where the
comment says so.

**The directory under `src/routes/` IS the canonical path** (2026-08-29). It
was named in English with a Latin re-export beside it, and the cost was a
legacy path getting a 404 from the worker and then rendering the real page
anyway, because the client router could still match it. The implementations
sit at `scriptura/`, `catechismus/`, `catechismus/compendium/`, `documenta/`
and `preces/`; the only re-exports left are under `[uilang=uilang]/`, which
mount entry points at a second address on purpose. Nothing outside the route
tree ever knew a directory name — why the mismatch survived a year and why
removing it was safe.

```sh
cd site
npm run dev                                          # or npm run build
CORPUS_DIR=/path/to/glossa-corpus npm run dev        # corpus kept elsewhere
npm run sync-corpus                                  # full derivation, ~13.3s
npm run sync-corpus:changed                          # skip if nothing moved, ~0.3s
node scripts/sync-corpus.mjs --changed-only --force  # ignore the cache
```

**`npm run dev` does not re-derive the corpus** (2026-09-01, §Process):
`predev` passes `--changed-only`, so a restart over an unchanged corpus costs
~0.27s. `sync-corpus.mjs` fingerprints six input sets into
`site/scripts/.sync-corpus-state.json` (untracked) and records them only where
the run reaches its last line, so a tripped gate is never skipped over.

- **`prebuild` deliberately does NOT pass it** — a deploy always derives in
  full, which is what keeps "a run that skips is only as good as its list of
  inputs" from reaching a reader. Do not "make it consistent".
- **The run says which part moved** (`corpus, ledger moved — rebuilding`), so
  an unexpected skip is diagnosable.
- **What it cannot see is `npm install`** — the same gap `rebuild.py`
  documents for `uv`. `--force` is the answer, and it still records state.
- **Deleting the state file costs one full sync, never a wrong one.** Same for
  a corpus `git checkout`: the digests are `size:mtime_ns`, so identical bytes
  under new mtimes force one needless rebuild — the only direction this may
  err in.

**Editing a `.ts` module reloads the page, editing a component does not, and
that is not a misconfiguration** (measured 2026-09-01, §Process). Components
are their own HMR boundaries; there are zero `import.meta.hot` calls in
`src/`, so a plain-module edit walks unaccepted to the root and Vite issues a
full reload. Before "fixing" it: a bare `import.meta.hot.accept()` re-executes
the module, building a new `$state` proxy while rendered components hold the
old one — the page keeps showing old strings with nothing erroring; the
reload was at least honest (the workable shape is in `docs/decisions.md`).
Re-measure with the websocket, never by eye (`vite-hmr` subprotocol;
`full-reload` vs `update` is the whole measurement). And 73.8% of what the
dev server sends is inline sourcemaps — three documented attempts to turn
that off failed and are listed in `docs/decisions.md`; read it as bytes, not
seconds.

**`npm run dev` registers no service worker; a build does** (2026-09-01, §The
site). `vite.config.ts` keys `serviceWorker.register` off `command`. SvelteKit
registers in dev by default, and here that installed the real worker against
`localhost` — cache-first on the shell, never `skipWaiting()` — serving a
shell from an earlier session. It presents as a repeating `Pre-transform
error: The file does not exist at .../node_modules/.vite/deps/runtime-<hash>.js`
**surviving both `rm -rf node_modules/.vite` and a restart** — the tell that
the request comes from the client, not the server. A worker on an old shell
serves old CODE, so if HMR ever seems broken, check for a controlling worker
before believing it. Nothing evicts one already installed: unregister once per
profile (DevTools → Application), or confirm the diagnosis in a private
window.

**The worktree trap shrank but did not vanish.** The default is
`../../glossa-corpus` resolved from `site/`, so a worktree beside the main
checkout finds the corpus. Anywhere else, the site silently falls back to the
test fixtures — two Bible books, which looks broken in a confusing way rather
than an obvious one. Set `CORPUS_DIR` there.

`npm test` always uses fixtures, never a synced corpus: `corpus.ts` checks
`import.meta.env.VITEST` explicitly. The absence of a `pretest` hook is _not_
what guarantees this — `prebuild` syncs and that directory persists. The
fixtures deliberately contain absent chapters and out-of-range
cross-references to exercise the not-in-corpus paths.

**Don't drive the site with Playwright/browser automation to verify UI
changes.** The user does that verification themselves. Only reach for it when
explicitly asked — default to describing the change and letting them look in a
real browser.

## Deploying

Live at <https://glossacatholica.org>, on Cloudflare Workers static assets
(`site/wrangler.jsonc`; rationale in `docs/decisions.md`).

```sh
cd site
npm run deploy      # build -> preflight -> wrangler deploy
```

- **`npm run deploy` is the whole thing.** Running `wrangler deploy` by hand
  skips the build and preflight and ships whatever is in `build/` — with no
  idea whether it is current or came from fixtures. There is no CI build; a
  deploy ships one person's working tree.
- **From a worktree not beside the main checkout, set `CORPUS_DIR`.**
  Preflight refuses a fixture-sized build, so the worst case is a refusal.
- **Deploys are not sandboxed** — `wrangler` needs the Cloudflare API. Same
  for `git commit` (GPG).
- **The file count is no longer the thing to watch** (cap 20,000; the build is
  ~8,000+, exactly two of them HTML). `npm run preflight` prints the real
  number and its share of the cap; read that line. The bulk is
  content-hashed corpus JSON, which Wrangler dedupes, so a redeploy that
  changes no corpus data uploads very little.
- **What IS worth watching is `run_worker_first` in `wrangler.jsonc`.** It
  must stay a list of navigation patterns with `!` negations for everything
  static. As the boolean `true`, every request is a billed invocation, and
  past the free plan's 100,000/day the platform answers **429 instead of
  serving the asset** — the whole site goes dark until 00:00 UTC (a cold
  visitor filling the offline library was ~2,240 invocations, i.e. about
  fifty readers a day). Anything new in `static/` still works un-negated; it
  just silently costs an invocation per request. What each layer actually
  costs is priced in §The site — read it before optimising here by guess.
- **Preflight (`scripts/preflight-deploy.mjs`) checks the corpus, not the
  page count**: it refuses a build
  reporting fewer than 100 works or 100 content assets (the fixture-backed
  build), and refuses a build whose reference coverage dropped more than 3%
  in any family against `scripts/reference-coverage.baseline.json` — every
  grammar regression so far was silent. If the drop is intended, `npm run
coverage:accept` records the new floor. `REFERENCE_COVERAGE=verbose npm run
sync-corpus` prints what the grammar recognized nothing in, which is where
  coverage work starts.
- **`postbuild` minifies the built HTML and then refuses a build that still
  ships a comment.** `src/app.html` is the most heavily commented file in the
  repo AND the document served at every address; `scripts/minify-build.mjs`
  strips `build/` and leaves `src/` alone. Nothing upstream does this:
  SvelteKit does not minify HTML, and no Vite hook even sees the file
  (`adapter-static` writes it in the adapt phase; `offline.html` is copied
  verbatim). Do not reach for `sveltekit-html-minifier` — it loops over
  `builder.prerendered.pages`, and this build has none. `commentsIn` reads a
  page as the two or three syntaxes it is (the boot script was 48% of the
  document while the pass read HTML as one syntax). The audit scans HTML, JS,
  CSS and XML and deliberately not JSON (a source page may one day print a
  comment marker as text; the 87 built files that once carried a bare `<!--`
  were all one parser defect, fixed in `strip_tags`). A vendor licence banner
  is the realistic first failure — keep it and record it in the script's
  `ALLOWED` rather than deleting a copyright notice to quiet a build.
  `robots.txt`, `.well-known/security.txt`, the `fonts/OFL-*.txt` licences and
  `_headers` keep their comments on purpose.

## `/documenta` filters, and the one editorial file behind them

Replaced the pontificate table of contents on 2026-08-31 (§The site): a
search box over a facet panel (author, kind, subject) above a flat
reverse-chronological list.

- **Author and kind ADD, subject SUBTRACTS, and that asymmetry is the field's
  arity**: a document has exactly one author and one kind (AND of two is empty
  by construction) and carries three subjects on average (AND is what
  narrowing asks for). Two parts break if the predicate is flipped back: the
  subject counts are taken against the FULLY filtered set, itself included, so
  a term's number is exactly what survives the click; and `liveTags` drops
  terms at 0 rather than greying them — a dead term in a cloud has no weight,
  renders at the floor size, and reads as a live chip that does nothing. A
  selected term is always live, so filtering can never make a filter
  unreachable.
- **The author facet's years come from `src/lib/pontificates.ts`, a TABLE.**
  Deriving the span from the documents is wrong in a way that looks right
  (first/last `promulgated` shorts every reign). The corpus CHECKS the table
  instead: every author's span falls inside its reign. `to: null` renders as a
  trailing en dash, deliberately not the word "present" (a chrome string in
  thirty-four dictionaries). Lookup by `Object.hasOwn`; an unknown name gets
  no years rather than a guess.
- **The search reads a document's whole metadata** (title, author, kind,
  description, tags), AND-ed with the facets.
- **Matching and marking are one function, in `src/lib/highlight.ts`**:
  `matchesQuery` and `highlight` share a fold and the same `occurrences`
  tiers, so a row is on the list exactly when the highlighter has something to
  draw on it. `matchesQuery` ANDs tokens where `highlight` ORs them (filtering
  strict, marking generous); a test pins the agreement.
- **`site/document-tags.json` is the subject vocabulary and it is CLOSED** —
  58 terms in its own `vocabulary` array, keyed by document SLUG (a tag is
  about the document, not an edition — the one difference from
  `descriptions.json` beside it). `sync-corpus.mjs` **exits 1** on a tag
  outside the list, a slug naming no document, two terms differing only in
  case, or an empty/padded tag. A term on no document is a warning; a missing
  FILE is fine (no subject facet).
- **The vocabulary was curated by reading, not counting** — the full story is
  in §The site, and three of its lessons generalise: a term is too generic
  when it names what a document DOES rather than what it is about (the
  signature is FLAT co-occurrence across the vocabulary); counting a word
  proposes a candidate, reading the sentence decides it (the `Пар.` lesson —
  the ancient heresies score zero in this Leo-XIII-to-Francis corpus); and a
  merge is a semantic act — check it against EVERY document it touches, not
  the archetype.
- **The subject facet is a CLOUD.** Three traps: the scale must renormalise
  against the CURRENT extremes (`src/lib/tag-cloud.ts`) or one click
  collapses it to the floor; the range is over POSITIVE counts only; and
  `CLOUD_SIZE_MAX` is a balance knob, not a size one — shrink from the top
  only, since `CLOUD_SIZE_MIN` is `--font-size-min` and the CSS clamps to it,
  so lowering it flattens rather than shrinks. **Colour is the second
  channel** off the SAME `weight` (so they cannot disagree), mixed between
  `--color-text-muted` and `--color-text` — two tokens, never a literal black,
  which in dark mode would make heavier terms disappear. The cloud chips carry
  no border (58 outlined pills is 58 boxes competing with their own words);
  `.doc-tag` keeps its outline because three chips inside a paragraph do need
  an edge.
- **The terms are NOT translated and render verbatim** — a closed list could
  carry i18n keys, but that is ~2,000 strings and nobody has asked.
- **`DocumentFilters.svelte` is rendered TWICE on the page** (aside above
  80rem, `<details>` below), which is why its options are `aria-pressed`
  buttons and not checkboxes (two elements claiming one `id`) and the search
  text is a PROP, not local state.

**The filters are deliberately not in the URL** — `?auctor=` would be a change
to the sitemap, the route manifest, the worker and the usage beacon. Note the
app does read/write the client URL in two places already (`?compare=` in
`compare-pref.svelte.ts`/`compare.ts`, `?v=` in `address.ts` and the chapter
route); a filter param would be a third-plus, and the argument against it is
the cost, not novelty.

## The edge writes the head, from names and never from text

Added 2026-08-28 (§The site). `ssr = false` means one document answers every
address, so everything a non-rendering consumer learns comes from
`src/worker.ts`, which rewrites the shell's `<head>` per address.

**Eight pages take a language prefix and the rest do not, and the line is not
cosmetic.** `CHROME_PATHS` in `route-manifest.ts` lists them (`/`,
`/scriptura`, `/catechismus`, `/documenta`, `/doctores`, `/doctores/summa`,
`/preces`, `/colophon`) — the pages whose every word IS the interface, so the
Portuguese one is a different page. A reading address names a citation, the
same in every language, and takes no published prefix: prefixing them would
declare `hreflang` alternates serving byte-identical text through
`CONTENT_LANG_FALLBACK` (§The site; the entry-point redirect above is the
unpublished exception).

**A cluster is thirty-five URLs, and the unprefixed one is not the English
page.** One prefixed member per interface language plus the bare path, which
is `x-default` because it NEGOTIATES; `/en/doctores` exists separately because
pinning English is not the same as negotiating and happening to get it. Every
member declares the whole cluster including itself, and every member
self-canonicalizes — a prefixed page canonicalizing to the bare path asks to
be de-indexed.

**The chrome heads are read out of the dictionaries, never written.**
`CHROME_KEYS` in `scripts/route-titles.mjs` names the keys, and every
dictionary must carry all of them. `chromeNames` deliberately does NOT fall
back to English the way `t()` does — a cluster whose Portuguese member is
described in English is the one failure an `hreflang` set is checked for, so a
missing key fails the sync. The cheap way to add a chrome page is a key the
translators have already written; `/doctores` could not reuse one and cost two
new strings in every dictionary.

**`UI_LANGS` lives in `src/lib/ui-langs.ts`, a plain module** —
`i18n.svelte.ts` constructs its store at module scope (reads `localStorage`,
instantiates `$state`), impossible in the Worker and in Node, and the edge,
`route-manifest.ts` and the build scripts all need `isUiLang`. Use
`isUiLang`/`UI_LANGS`, never a literal list. `src/params/uilang.ts` is the
SvelteKit matcher; without it `[uilang]` would swallow every top-level path.

**Arriving at `/pt/...` persists Portuguese**, exactly as the switcher does. A
shared link changes the reader's stored choice — the cost; the alternative
loses them on the first click, because every link on the page is unprefixed.
These are entry points, not a parallel site, which is why nothing in the app
builds prefixed hrefs.

**`static/route-titles.json` may hold NAMES and never TEXT.** It carries book
names, document titles with author and year, prayer and Summa question
titles, and paragraph spans of titled divisions — the imprint of a work, the
class of fact `sitemap.xml` already publishes. It is what keeps
`wrangler.jsonc`'s "never reads or transforms corpus text" true. A Catechism
paragraph or a verse would make a better search snippet and must not go in.

**Three files, read through three separate module-global promises, because
the failures differ.** `corpus-routes.json` decides the STATUS;
`route-titles.json` only the `<head>`; `static/apparatus.json` (303 KB,
`src/lib/apparatus.ts` / `scripts/apparatus.mjs`) the editorial description
and cross-reference apparatus. Losing the first would cost the address, the
second a name, the third a description — merging them would let a missing
title table take the site down.

- **`apparatus.json` is the one exception to "names, never text", and the
  exception is precise**: a description is prose written HERE, by reading a
  document — the one running text on this site nobody else holds rights in
  (`llms.txt` offers it for quotation). The absolute rule it refines: a
  paragraph, an answer or a verse belongs to its publisher and reaches the
  edge in neither file, ever.
- **The links are stored as bare numbers and slugs and named from
  `route-titles.json`** — storing names twice is how two tables come to
  disagree.
- **A budget per KIND of link, not one total.** Filling a single cap in source
  order gave Genesis 1 eight Catechism paragraphs and no documents. `PER_KIND`
  is exported from `apparatus.ts` and imported by the builder, because the two
  numbers existed separately for one afternoon and half the table was shipped
  for nothing.
- **`static/works.json` (246 KB) is the other half and nothing here reads
  it** — published because `llms.txt` points at it as the file to read instead
  of crawling ~6,000 addresses.

**`static/llms.txt` asks to be cited now, and used to ask not to be.** The
distinction it draws: **cite the publisher for the words, link here for the
locus** — vatican.va addresses a document, `/catechismus/330` addresses the
paragraph. It documents the address grammar in full so a client can construct
a citation URL without fetching, and one paragraph records the reversal on
purpose (a model trained on the old file carries the old instruction). Keep
the rights position exactly as strong when editing it.

**The structured data is attribution and NOT a rich result.** `headHtml` emits
one `@graph` (`BreadcrumbList`, `WebPage`, the unit, the work); the
publisher's name and rights come off the corpus manifests, never a constant,
and this site appears nowhere in the work node. Two tested choices: **one
script and one graph** (an `@id` reference resolves only within the same
page's graph) and **`isBasedOn`, never `sameAs`** (`sameAs` asserts identity
and concentrates authority on the publisher). No Wikidata ids, no
`inLanguage` — both would be guesses, and a guessed imprint is worse than a
gap.

**None of this costs an invocation.** `env.ASSETS.fetch()` from inside the
worker is a SUBREQUEST — issued once per isolate in one `Promise.all` with the
shell — and the files are negated in `run_worker_first`, so a crawler reaches
the asset binding directly. What it does cost is CPU on the first navigation
(~1 ms parse for `apparatus.json` against a 10 ms limit the rewrite already
spends 6.56 ms of) — re-measure with `wrangler dev` if the table grows.

**`assertNamed` runs in the sync, not in vitest, and that is the point.** It
refuses a build where any address in `sitemapPaths` has no name of its own or
shares a title with another. The failure is invisible everywhere a person
looks (the page titles itself at hydration) — only consumers that never
render see it, none of which reports back. A new work kind ingested before
`shell-head.ts` learns its name fails the sync rather than shipping hundreds
of pages called `Glossa Catholica`.

**`titles.ts` and `inline-html.ts` import each other WITH the `.ts`
extension** — `scripts/route-titles.mjs` imports `displayTitle` under Node's
type-stripping loader. Tidying the extension away breaks `npm run
sync-corpus` with `ERR_MODULE_NOT_FOUND`, not the site.

**A new file in `static/` is precached for every reader unless a list refuses
it.** `sw-policy.ts` takes all of `files`; `INFRASTRUCTURE_FILES` (served to
our own infrastructure) sits beside `CRAWLER_FILES` (served to a stranger's
machine), and every entry also needs its `run_worker_first` negation in
`wrangler.jsonc`. **The negation and the precache list are separate mistakes
with separate symptoms**: miss the negation and it costs invocations, miss the
list and it costs every reader bandwidth, and neither failure says anything —
`route-titles.json` rode along in every reader's install for a day while this
file asserted otherwise. `sw-policy.test.ts` names all five files.

**Fonts are precached by SCRIPT, not wholesale** (2026-08-31). Declaring a
`unicode-range` subset is close to free over HTTP and was false the moment the
service worker installed: everything in `static/` a list did not refuse was
downloaded whole — 1,118 KB of woff2 for every reader, Arabic included for the
English reader. `DEFERRED_FONTS` in `sw-policy.ts` puts every face but the
core Latin four in the CONTENT tier (fetched on demand, stored on first read,
outliving deploys); the precache is 157 KB, an 86% cut.

- **On demand is not enough on its own** — a reader who fills the offline
  library needs the faces for what they downloaded, and a face nobody
  rendered has never been fetched. `fontsForLangs` warms the scripts the
  reader's own languages need (every client message already carries
  `contentLangChain(readerLang())`; the worker cannot read `localStorage`).
- **`greek` is the bucket no language claims, correctly** — an APPARATUS
  script no reader's language predicts. It stays purely on demand.
- **`la` is ABSENT from the table, and the reason generalises: a language in
  the universal tail cannot be given a script.** `en` and `la` end every row
  of `CONTENT_LANG_FALLBACK`, so a `la` entry warms its subset for every
  reader on earth — it was there for one commit, for 19 glyphs of `ǽ`, at
  eleven times the font of the content it set. 18 of 34 languages warm
  nothing.
- **`ig` takes the `vietnamese` subset, not `latin-ext`** — Igbo's dots-below
  vowels are in Latin Extended Additional, which the subsetter files under
  `vietnamese`. Looks like a typo, is not.
- **A face matching no bucket is PRECACHED**, silently — the safe, quiet
  direction. `sw-policy.test.ts` reads the real `static/fonts/` directory
  rather than a fixture for that reason. `CORE_FONTS` matches `-latin-wght-`
  WITH the trailing hyphen; dropping it silently matches `-latin-ext-wght-`
  too.

**The reading routes' own `<svelte:head>` titles have to match the shapes in
`shell-head.ts`**, in the reader's language — the edge writes one title, the
route assigns another at hydration, and a mismatch is a visible rearrangement
on every load.

**Existence is a property of the URL, and the worker must never read a
request header to decide it.** Broken twice in the same predicate:
`isNavigation` required `GET` (so every address 404ed to HEAD), then
`Accept: text/html` (so bare `curl` and several crawlers got 404 at every
path except `/` — it surfaced in Search Console as pages "not found" and read
as a routing problem). The predicate is now three: `isPageMethod` (GET or
HEAD) gates the worker, **`isCanonicalPath` alone decides the status**, and
`wantsHtml` only settles what a path naming NO address gets (the app's 404 UI
vs the asset binding's answer — which is what keeps an un-negated `static/`
file served rather than 404ed). A browser always sends both, so neither bug
is reachable by hand; check the edge with `curl` and no headers at all.

## Usage measurement: one beacon, three dashboard rules, and a shared vocabulary

Added 2026-08-27 (§Usage measurement). First-party, bucketed, no identifier.

**`/a` must stay OUT of `run_worker_first`'s negation list** — it is the one
path besides navigations the worker must answer, covered by the leading `/*`.
Negating it (the reflex) does not fail loudly; the worker simply never sees a
beacon and the tables stay empty.

**`usage-schema.ts` is ONE module read by both ends on purpose.** The client
fills a payload from it and `src/worker.ts` validates against it; the whole
defence of an open POST endpoint is that the two vocabularies are the same
object. Split copies drift, and the failure is silent in the worst direction —
the metric reads zero rather than erroring.

**Three rules live in the Cloudflare dashboard and nothing here can assert
them** — the custom rule guarding `/a`, the zone's single rate-limiting rule,
and the kill switch. §Usage measurement is their only record. The free plan
allows exactly one rate-limiting rule, which is why the write ceiling is a
counter in `usage-store.ts` rather than a second limit.

**Retention is a cron** — `scheduled()` in `src/worker.ts` drops rows past
`RETENTION_DAYS` daily; `npm run usage -- --prune` forces it by hand. The
script duplicates the constant (plain Node cannot import the `.ts`);
`usage-report.test.ts` asserts the two agree. The two retention numbers are
NOT the same and are not meant to be — 365 on the device (`RECORD_MAX_DAYS`),
400 in D1 (`RETENTION_DAYS`). `RECORD_MAX_DAYS` is load-bearing in both
directions (shortening inflates the `new` bucket; lengthening walks away from
LGPD retention proportionality — §Usage measurement doubles as the
legitimate-interest assessment). Change it only with both halves in view.

```sh
cd site
npx wrangler d1 migrations apply glossa-usage --remote     # once per clone
npm run usage -- --days 30
```

The binding is optional in `src/worker.ts`, so a deploy without it serves the
site normally and drops beacons — right for a statistic, and the reason a
missing database is not a build error (the deployed worker dropped every
beacon while `wrangler.jsonc` held a placeholder id, and nothing reported
it). What says the measurement is live is `npm run usage` returning rows.

**The colophon's promise moved with the code**: `colophon.pointNoTracking`
states what is actually collected. Anything that changes what the beacon sends
has to be checked against that string — it is why the payload holds no free
text, no sequence and no passage-level position (the "deliberately not" list
is in §Usage measurement).

## Sandbox quirks that waste time

- **`rm` is aliased to `trash`**, which cannot write `~/.local/share/Trash`
  under the sandbox. It does not fail — it hangs forever at ~80% CPU and leaks
  the process. Delete with `/usr/bin/rm`.
- **Sandboxed `ps` cannot see processes from other tool calls** — each runs in
  its own PID namespace, so a genuinely-alive background job reads as dead.
  Use a heartbeat file, or check with the sandbox disabled.
- `git commit` needs `~/.gnupg` for signing, which the sandbox blocks.

## Reference grammar: eleven book tables, prose as apparatus, and the oracle behind both

`site/src/lib/refs-grammar.ts` turns a stored citation string into links, per
**content language**. Eleven configs (`ar de en es fr it la mg pl pt ru`);
until 2026-08-26 there were two, with `configFor` answering EN for everything
else.

**English was never a neutral default — falling back to it mis-read, not just
under-linked.** `1 Joh 2,20` has no numbered form in the English table, so the
bare `Joh` matched and every First-John citation in three editions resolved to
the Gospel; the German mirror prints `Job` where it means `Joh`; and `SC`/`CA`
collide across editions (Sources chrétiennes vs Sacrosanctum concilium,
Corpus apologetarum vs Centesimus annus), each edition right about its own
references.

**`scripts/book-forms-oracle.mjs` is where eight of the eleven tables came
from, and it is the tool to reach for next time.** Paragraph N is the same
paragraph in all eight Catechism editions, so align on the locus and read the
abbreviation off. `--derive` proposes a table with vote counts; the default
mode **checks** an existing one by reporting links the other editions
contradict — read that as a count, not a list (330 rows means the wrong table
is applied; 18 means the editions genuinely cite different verses).
`--work` points it at any work published in more than one language (which
derived Polish, Russian and Arabic off _Magnifica Humanitas_) — valid only
for a work translated from one text at one time, since a section number is
not the same section in two translations of an older encyclical. It will keep
proposing two things that are **not** books: patristic work titles (`Sermo
241, 2`), and the `??`-flagged singletons, which are for reading, not pasting.

**Latin is the exception to "derived"**: `BOOK_VARIANTS_LA` is the Latin
edition's own printed table (73 rows), with the oracle run over it as a check
— two independent derivations agreeing, and why Latin is the only table
complete for books the Catechism never cites.

**A table answers for every work in its language, not just the Catechism** —
`la` also covers the Summa, the Clementina and the Latin prayers; `it` covers
ten works. Scan the non-Catechism works after deriving a table; each form
found that way was worth a link or two.

**The oracle finds source defects too, and they belong in `corrections/`, not
in a hole in the table** — each a real link to the wrong verse, one edition
against seven.

**The tables have a second consumer, and it is the one a reader touches**:
`site/src/lib/suggest.ts` (the jump box) reads them through `grammarSurface`,
so editing a table changes what the box completes as well as what the page
links — deliberately, since a form the box completes and `parseRefs` fails to
resolve would offer an address that does not exist.

- **The tables hold abbreviations, not names** (the oracle derives from
  citations, and citations abbreviate) — so a French reader completes `Jn 3`,
  not `Jean 3`, and the fix is not to hand-write names. Full names are matched
  only where an EDITION carries them, which is why EN/PT/LA complete full
  names and the others do not.
- **`suggest()` takes its language as an argument**, never from the `i18n`
  store, and memoizes per language (`resetSuggestCaches()` in tests).
- **Loose matching is injected and must stay that way.** `fuzzysort` is the
  site's only dependency besides the icon set; `JumpBox` lazy-imports it and
  calls `setFuzzyRanker` — a static import in `suggest.ts` puts 7.5 KB in
  every route's boot chunk. A new caller injects the same ranker with the same
  0.3 threshold (measured against this corpus — `docs/decisions.md`).
  `suggest()` with no ranker is the literal tiers alone, a supported state.

The five tags with **no** config (`hu ro sl sv en-gb`) fall to English, and
that is measured rather than assumed: the Compendium-only languages cite by
bare number and their prose prints no Scripture locator, so the English table
matched nothing rather than something wrong. `scripts/reference-coverage.mjs`
is what says when that stops being true — and it did, for `ar`/`pl`/`ru`,
which got tables the day a work landed in them.

## Running prose is an apparatus, not decoration

**Three of the eight Catechism editions print no footnotes at all** (de
brackets, fr/es parenthesize), so everything `parseRefs` reads elsewhere,
`linkifyProse` must read in the body text — its document-siglum scan is worth
3,624 references in those editions against 82 in English.

**The counters that measure this scan do not render it, and for four days
that mattered.** `reference-coverage.mjs` and `build-xrefs.mjs` call
`linkifyProse` themselves, so the coverage table kept counting references the
page had stopped drawing — the CCC's 18,831 in-prose references went undrawn
for four days, total in exactly the editions with no footnote fallback. The
marker walk lives in `inline-html.ts` (`parseInlineMarked`, beside
`parseInlineHtml`), so both branches of `ProseBlocks` read
`linkifyInline(parse…(block), proseSegments)` and both are unit-testable.
There is no component test harness here; keeping renderable logic out of
`.svelte` files is the only way it gets tested at all.

**Three surfaces store plain strings, and all three were inert for the same
bad reason.** A Compendium answer, a Compendium question and an annotated
Bible edition's note carry no markup and no `⟦N⟧` tokens, and each was
rendered as raw text on the reasoning that a text with no footnote apparatus
has nothing to link — backwards, since those are precisely the texts that
print their locators in the sentence (1,436 + 65 + 435 references).
`plainTextNodes` in `inline-html.ts` is the third parser, so reaching for the
wrong one is a compile-time question.

**The Bible's VERSES are still not linkified, and must not be.** Scripture is
the text being read, not an apparatus over it. Only `Sidenote` linkifies,
because only the note is commentary.

**A siglum in prose must sit inside a bracket and carry a locus** — measured:
3,708 of 3,712 siglum-shaped prose tokens sit inside a `(` or `[`, and the
four that do not are one source defect repeated. Without the guard, every
capitalised abbreviation in the corpus is a candidate. **The one collision is
`AA`**: CCEL doubles a letter to pluralize, so the English Summa's "(AA 1,2)"
is _articles_, not Apostolicam actuositatem. The discriminator is the locus —
a conciliar decree cited in prose points at ONE section — so
`proseSiglumFalseLead` blocks the list form.

**The same scan is how the book tables get their second pass** — reading what
prose still resolves to nothing found 1,180 Douay-named references in
`summa.en`, 59 in the Portuguese encyclicals, and two source misprints now
filed as corrections. Run it after any table change; the residue is where the
next win is.

**English has two book-naming conventions and they collide on Kings, which is
why `RefsOpts` has a second axis.** The Douay tradition calls 1–2 Samuel the
first two books of Kings; `3/4 Kings` read the same under both conventions,
but `1/2 Kings` mean different books and **nothing in the citation string
tells them apart — only the work does**. So `configFor` takes a work id, and
`WORK_CONFIGS` lists the works whose own text contradicts their language's
table (seven today): `summa.en` (CCEL quotes Douay-Rheims throughout), two
encyclicals, and the annotated editions whose notes need it —
`bible.douay-rheims.en` for Challoner, `bible.straubinger.es`,
`bible.martini.it`, `commentary.haydock.en` — each verified against the verse
it actually names. Modern is the default because that is
what the corpus prints nearly everywhere. **A work belongs in `WORK_CONFIGS`
only when its references are measurably read wrong without it**, evidence in
the comment beside it — the standard `pipeline/corrections/` holds a defect
to. It is a short list on purpose, not a second general axis.

**Every reading surface passes `work`, including the ones that need it today's
answer of "nothing"** — `ProseBlocks`, `InlineProse`, `RefText`,
`CitationDisclosure`, `HeadingText`, `SummaDivisions`, `CompendiumQuestion`
(the prayers route is the exception: no prayer work cites Kings). **The build
side has to pass the same work the page passes**, or the scripture index
points at a different verse from the link on it: `build-xrefs.mjs` threads it
from the sync's edition records, `reference-coverage.mjs` buckets per work,
`book-forms-oracle.mjs` derives it from `--work`.

**`prose.document` is the counter that guards the sigla scan** — counted per
family, with preflight refusing a 3% drop, same as prose scripture.

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
Latin is evidence, not a third opinion. Those disagreements are **edition divergence, not
defects** — `docs/research/bible-edition-divergence.md` has the four kinds
and why calling them defects invites someone to "fix" a faithful text.

## Languages: the interface is a superset of the content

Thirty-four interface tags against twenty-eight content languages — it was
the other way around for a year, until 2026-08-31. `UI_LANGS` lives in
`site/src/lib/ui-langs.ts` and `ContentLang` in `types.ts`; use
`isUiLang`/`UI_LANGS`, never a literal list (`app.html` and `usage-schema.ts`
each keep a necessary copy, and a test asserts both against `UI_LANGS`).

**Still do not derive one list from the other.** The lists equalized and
separated four times in eight days; the rule survives the flip and reads the
other way now: an interface language is no longer evidence that the corpus
holds anything, and the next ingestion in a language with no dictionary
separates them again from the other side.

**What the old list actually tracked was who had written a dictionary.**
Closing that gap (twelve content languages had no chrome) made the interface
a superset; on top sit eight **reach languages** (`tl zh ko id uk ig ml hi`),
chosen by Catholic population rather than by what has been ingested. A reader
in one gets their own chrome and English content through
`CONTENT_LANG_FALLBACK`; the alternative is the same content behind a
language they do not read.

**A dictionary need not be complete** — `t()` falls back to English key by
key. What the build enforces is `CHROME_KEYS` (`assertNamed` throws on an
unnamed chrome page, which breaks the `hreflang` cluster) and
`bible-groups.test.ts`, which demands all nine group names.

**The colophon was the one page deliberately left untranslated, and on
2026-09-02 that was reversed** — the argument (a machine translation of the
page about care with words contradicts itself) proves too much: a reader who
cannot read the page cannot weigh it either. All 34 dictionaries carry all 31
colophon keys now, with a parity check over `src/lib/i18n/*.ts`. The honesty
lives in each file's header instead, which names its own confidence tier —
keep that part.

**Twenty of the thirty-four dictionaries have never been read by a native
speaker** — every language added on 2026-08-31 was translated by an LLM in
one sitting, and the exposure grew when the colophon keys were added. The
colophon's `whatThisIsStanding` and `copyrightBody3` (canonical standing
under Can. 216; how a rights holder reaches us) are the two strings where a
mistranslation costs something real — the first to check. Tiers, per each
file's header: **grounded** (`mg`'s core terms, read off `ccc.mg`'s own
manifest — the corpus is the authority for a language's Catholic usage, and
the first place to look), **medium** (`fi lv sw vi be zh ko tl id uk`), and
**low** (`he ig ml hi`, and `mg` outside its grounded terms — registers where
the obvious dictionary word is often not the one the Church uses).
**Deleting a doubtful string is a valid fix, and a better one than leaving
it** — a removed line renders in English, so correcting these needs no
coordination. The keys that cannot be deleted (`CHROME_KEYS`, the nine
`bible.group.*`) fail the build instead.

**Adding a language means five places, all guarded**: `ui-langs.ts` (plus
`RTL_LANGS` if right-to-left), the dictionary, `app.html`'s pre-paint copy,
`usage-schema.ts`'s `UI_TAGS`, and `UI_LANG_NAMES` in `menu-filter.ts` — a
`Record<UiLang, string>` since 2026-09-01, so an omission is a TYPE ERROR (it
was an unguarded array, and a language missing there stayed reachable but
unfindable). It cannot be derived from `LANGUAGE_NAMES`, which is keyed on
CONTENT language and deliberately does not name the reach tags;
`menu-filter.test.ts` asserts the two agree where both name a language. The
dictionary file needs no registration — `i18n.svelte.ts` globs the directory.

**The two language pickers have a search box, and the language menu has a
fold** (2026-09-01; `src/lib/menu-filter.ts` holds everything that is not
markup):

- **Matching is `highlight.ts`'s `matchesQuery`, never a fresh one** — what it
  buys here is the FOLD (`Čeština` reachable by `cestina`), and the third
  surface it reads is `Intl.DisplayNames`, so an English reader finds German
  by typing "German" — the one surface nobody here maintains.
- **The fold leads with `navigator.languages`, and corpus weight is only the
  filler.** Weight alone buried Korean under the Korean reader.
  `orderUiLangs` pins the reader's own languages in the browser's own order,
  plus their last manual choice, then tops up to twelve by weight.
  `PRIMARY_UI_LANG_COUNT` is a FLOOR for the pinned block, not a ceiling —
  folding away a language the reader configured is the one thing this exists
  to stop.
- **Ordering by the browser does not break the stability rule; ordering by
  weight would.** The rule forbids a sequence that changes UNDER a reader,
  and corpus weight moves on every deploy; `navigator.languages` is the
  reader's own setting. Everything below the pinned block stays in `UI_LANGS`
  order.
- **The edition pickers rank on `readerLangChain`** — interface language,
  then the browser's languages, then the fallback neighbours, whole (`en, la`
  tail included). The browser sits above the neighbours because that is the
  half a table cannot know (`hu → de` is a good guess until the browser also
  says English). The old alphabetical sorts stay as the tie-break, which
  keeps the Bible's two English editions in `PREFERRED_EDITION`'s order;
  `orderByLangChain`'s sort is stable for that reason alone.
- **Ranking a panel is reader-shaped; resolving an address is not.**
  `editionInLang` still walks `CONTENT_LANG_FALLBACK` alone, so the menu's
  top row and the column on the page can name different languages (the tick
  says which is showing). Deliberate: which text a citation resolves to must
  be a property of the language, or the same address gives two readers two
  documents — and feeding the browser into resolution would put `navigator`
  inside `corpus.ts`, which the build scripts import from Node.
- **`browserLangs` is the RAW list and `browserUiLangs` filters it** — the
  two menus filter against different things (chrome vs texts), and filtering
  once against `UI_LANGS` would lean on the superset relationship
  `ui-langs.ts` says never to derive from.
- **Typing ignores the fold entirely**, which is what makes the guess
  tolerable: being wrong costs three keystrokes, and the order is the same
  folded, expanded and filtered.

**A counterexample in a test will be overtaken.** Four tests used "a language
the interface does not have", spelled `mg`, then `sw`, then `ko` — the
interface grew into all three within a day. They are Icelandic and Estonian
now, with comments saying why: it can no longer be a content language at all.

**The superset flip has a cost and it shipped as a blank page.**
`content.catechismPairLang()` answered `i18n.lang` outright — a language the
Catechism/Compendium pair may not exist in — so `columns` was empty and
`work` being undefined took the `ReadingBar` with it: a blank page whose
missing control was the language picker itself. Twenty-two of the thirty-four
interface languages saw it. It walks `contentLangChain` now, stopping at the
reader's own language whenever that language has either work. **The general
lesson**: any resolver that reads `i18n.lang` as a CONTENT language is wrong
for two thirds of the list — `catechismPairLang` was the only one; everything
else already went through `editionInLang`.

**A content language that is not an interface language has exactly one place
to go wrong, and nothing checks it.** `LANGUAGE_NAMES` in `corpus.ts` names
each content language in its own language for the edition menu; an unnamed
tag falls through to the tag itself, past every build, test and type error
(`ccc.mg` shipped offering itself as "mg"). Adding a content language means
adding a line there in the same commit. The reach languages are deliberately
absent — they are not content languages.

**Direction is a property of the text, not of the reader.** `<html dir>`
follows the interface language; content regions get theirs from the `lang`
they declare, in `src/styles/direction.css` (imported last by `app.css`,
deliberately). **Both halves are hand-maintained and both were wrong for
Hebrew** (a literal `[lang='ar']`, and `l === 'ar'` in `app.html`'s pre-paint
block) — keep both in step with `RTL_LANGS`. `--prose-char-advance` is a
property of the SCRIPT and had the same bug (keyed to `ru` alone while 31
Byelorussian editions used the Latin measure). Write CSS in logical
properties (`margin-inline-start`, not `margin-left`) — the stylesheet is
entirely logical and the components are too.

Citations may use Hebrew or Vulgate versification. The corpus canonicalizes on
**Vulgate**; `site/src/lib/versification.ts` converts — the only
implementation, since its Python twin went with `pipeline/build/`
(§Parsing). A wrong chapter does not fail an existence check (`Joel 3:1-5`
resolves to real but wrong text), so conversion is applied unconditionally
for divergent books rather than as a fallback.
