# CLAUDE.md

Operational notes for working on Glossa Catholica. Architecture and rationale live in
`PLAN.md`, `docs/decisions.md`, `docs/corpus-schema.md` and
`docs/link-surface.md` — read those first. This file is only the things that
have actually bitten someone.

## The corpus: a separate repository, and two directories inside it

**The corpus is not in this repository.** As of 2026-08-23 it lives in
`glossa-corpus`, a **private** repository expected on disk as a sibling of
this one (`~/Dev/me/glossa` and `~/Dev/me/glossa-corpus`) — it holds verbatim
reproductions of texts other people hold rights in, and this repository is
public. See `docs/decisions.md` §The corpus for why it lives there, and the corpus repo's own `README.md` for the copyright position.

Both halves resolve it the same way, so one exported variable moves both:

| Consumer    | Resolver                  | Default               |
| ----------- | ------------------------- | --------------------- |
| `pipeline/` | `common.corpus_dir()`     | `../glossa-corpus`    |
| `site/`     | `scripts/sync-corpus.mjs` | `../../glossa-corpus` |

Both honour **`CORPUS_DIR`**. The pipeline calls `common.require_corpus()` at
the top of each scraper's `main()` and dies with the path it tried, because
every scraper creates its output with `parents=True` and would otherwise
write a whole phantom corpus somewhere nobody looks. The site keeps its older
behaviour of warning and falling back to fixtures.

Inside the corpus repo, **the directory names now carry the distinction** that
governs what may be deleted, which is the whole reason they were renamed:

| Path       | Value                                                                        | Rule                                |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| `build/`   | Parsed output. Rebuilt from cache in ~16s, zero network. **Untracked.**      | Safe to rebuild. Git holds no copy. |
| `oracles/` | Tables of contents read off the raw pages by hand. Nothing regenerates them. | Tracked. Treat like `raw/`.         |
| `raw/`     | Every scraped source page. The **only** artifact that cost real fetches.     | Treat as write-once. Never delete.  |

**It was `works/`, tracked, until 2026-08-27** (`docs/decisions.md` §The corpus).
Two changes with one point: three sibling directories whose names did not say
which of them was derived is what made "is this corpus data" the wrong question
to ask, and `build/` answers it before anyone asks. It is no longer two copies
with one of them in git; it is one copy plus the rebuild recipe, which is now
the only way back to it.

**The recipe is `pipeline/rebuild.py`, and it is a program** (2026-08-29). It
was a seventeen-line `sh` block in the corpus repo's `README.md`, and the rule
attached to it was: if you change what a scraper writes or where it lives, the
recipe is part of the change, because nothing fails when it rots. It rotted
four times under that rule, each time silently — six of eight commands naming
pre-reorganisation paths, so a rebuild produced 369 of 383 works; `dore.py`
omitted, so a rebuild produced a Bible with no illustrations; `--exhortations`
never passed, so 33 documents had no work directory; and a `--langs` list one
language short of `DIVISIONS`, so phase 2 had never once asked for a Swahili
edition and the three that exist were neither captured nor parsed. **The rule is unchanged and now has somewhere to
land**: a new scraper is a `Stage` in `STAGES`, and anything a stage needs that
a table can state should be derived from the scraper rather than typed here —
`phase2`'s language list is `sorted(V.DIVISIONS)` for exactly that reason.

    uv run pipeline/rebuild.py                  # ~19s, zero network, 0 files written
    uv run pipeline/rebuild.py --list           # the stages, their globs, their work counts
    uv run pipeline/rebuild.py --only bible     # a group, or named stages
    uv run pipeline/rebuild.py --no-images      # skip dore's AVIF re-encode
    uv run pipeline/rebuild.py --changed-only   # only the stages whose inputs moved
    uv run pipeline/rebuild.py --jobs 1         # one stage at a time, output streamed

**It was ~50s and one stage at a time until 2026-08-29.** Three changes took
that to ~19s, and the one worth knowing about is the third:

- **Every stage declares the work-id globs it writes, and those globs are a
  PARTITION of `build/`** — 1,447 works, each claimed by exactly one stage,
  none twice and none by nobody, which is asserted by reading `--list` rather
  than by a test. That is what makes running stages at once safe, and it is
  also what makes the `wrote` column mean anything under `--jobs`: a snapshot
  of the whole corpus taken around a stage running beside three others would
  credit it with their writes.
- **The two document stages now run `--offline` and take a lock per phase
  rather than the one crawl lock.** They are most of the work — phase 1 keeps
  three cores busy and phase 2 eight — and one after the other they left most
  of a sixteen-core machine idle for twenty-seven seconds. `V.run_lock_path`
  is where the argument is written down: a crawl's lock is about someone
  else's server and cannot be narrowed, an offline parse's is about racing a
  work directory and phase 1 and phase 2 do not share one.
- **`--changed-only` skips a stage whose `code`, `data`, `corpus` and
  `outputs` fingerprints all match the last run that exited 0.** THIS IS THE
  ONE FOR ITERATING ON A PARSER: editing `bible/martini.py` runs one stage and
  takes 2s, editing `vatican_docs.py` runs two and takes 18s, changing nothing
  takes 0.5s. `code` is the script's real import closure, read off its
  `import` statements and hashed by content, so `bible/cpdv.py` depends on
  `bible/sacredbible.py` and on all twelve modules of `common/` without anyone
  writing that down and a new import counts the day it is written. It is
  OPT-IN, and stays opt-in for the same reason `--skip-written` is: a run that
  skips something is only as good as its list of inputs, and this project's
  standing failure mode is the silent stale answer. `--force` is the escape
  hatch, and the input it exists for is the one the fingerprints cannot see —
  a `bs4` or `httpx` upgrade changes a parse without changing a byte here.

**A stage that exits nonzero is not recorded**, so the next `--changed-only`
runs it again rather than skipping a parser that failed. The state lives in
`<corpus>/.rebuild-state.json`, is untracked, and deleting it costs one full
rebuild.

**A run's exit code says whether it went worse than `pipeline/parse-baseline.json`,
and nothing else.** It said nothing at all until 2026-08-29: `phase1` returned
`ok and sym_ok` and `phase2` returned `sym_ok` alone, so both hung on the
cross-language symmetry check — which is chronically FAIL by design, because a
missing or differently numbered translation is legitimate and common. Both
subcommands had therefore exited 1 on every run they ever had, and so had the
recipe, which is why nothing was checking it. Symmetry is now printed as the
report CLAUDE.md always said to read it as, and the gate is a baseline of the
311 works that are known to parse badly, in the same shape and for the same
reason as the site's `reference-coverage.baseline.json`. `--accept-baseline`
moves the floor, for the works a run touched and no others, so accepting after
a one-pontificate run cannot erase what a full run recorded.

**Two ledgers answer before the baseline does**, which is why it holds 311
entries and not 823. A `fetch-failed` whose URL is in `absent-sources.json` is
the origin's answer, not this run's failure; a `no-translation-stub` recorded
in `translations-checked.json` is a CMS slot no translator filled. Anything
those cannot explain lands in the baseline. A page that parsed yesterday and
reads as a stub today is in none of the three, and fails.

**The gate is a floor under the parse's ADDRESSES, not under its structure.**
`validate_document` reads section ranges, gaps and citation resolution; it
never opens `structure.json`. Misspelling the Latin `CAPUT` label and
re-running loses every chapter division in every Latin document and the check
reports nothing — measured, not assumed. `rebuild.py`'s `wrote` column is what
sees that, and the cross-edition division comparison is what judges it.

**Resolve the path through `common.build_root()`, never by hand.** It takes an
optional corpus argument for the callers that are handed one (`audit.py`,
`census.py`, `apply_sweep.py`), each of which used to rebuild `corpus / "works"`
itself — eight literals that all had to be found by grep at rename time. The
site's single construction is `buildSrc` in `scripts/sync-corpus.mjs`.

The project's stated insurance policy is that any capture regret is fixed by
**re-parsing, never re-crawling** (`docs/link-surface.md`). That only holds while
`raw/` is intact. When judging whether a deletion is safe, the question is never
"is this corpus data" but _which of the two it is_.

**Output that is only regenerable from a previous copy of itself is not
regenerable.** This bit three times in one day, and it is the shape to watch
for. Each was a fact the scrapers kept alive by reading their own last
`manifest.json`, so it survived a re-parse over an existing corpus and
evaporated on a rebuild into an empty `build/` — which is now the supported way
to get a corpus at all:

| what                                                     | where it lives now                             | scale         |
| -------------------------------------------------------- | ---------------------------------------------- | ------------- |
| definitive 404s                                          | `pipeline/absent-sources.json`                 | 746 URLs      |
| what a missing sibling-language edition turned out to BE | `pipeline/translations-checked.json`           | 125 documents |
| the day each page was fetched (`retrieved_at`)           | `raw/<source>/captured-at.json`, in the corpus | 6,328 pages   |
| which verse each Doré plate depicts                      | `pipeline/dore-anchors.json`                   | 241 plates    |

The first two are knowledge derived where there is no page to sit beside, so
they are tracked here. The third belongs to the page, so it sits in `raw/`,
written by `Fetcher` at the moment it writes the file — the only point where
the answer is certain, since a cache hit never reaches it. Those dates were
recovered from filesystem mtimes, **which git does not preserve**; they were
also finer than the manifests', which carried one date per work and had 354
works claiming a retrieval days after the real fetch.

**The fourth is the one that arrived by a different route, and it is worth
reading as its own lesson: it WAS regenerable from `raw/`, and that was the
problem. 202 of the 241 anchors came from tesseract reading the caption
printed under a plate, and OCR is not a pure function of a file — a different
engine build reads a digit differently. So a rebuild could move a plate to a
verse nobody chose, silently, with no diff anywhere to show it, because
`plates.json` lives in `build/`. The answer was not to cache the read but to
recognise that the reconciliation had finished: the vote ran once, its result
is committed, and the ~600 lines that produced it (`dore/sources.py`, the OCR,
the pairing, the election) were deleted on 2026-08-28. The witnesses' readings
went with them a commit later, for the same reason one step on — with nothing
left to weigh them, nothing read them, and evidence for a decision already
taken belongs in git history rather than in five sixths of a live file. `dore.py` kept only the image encoding, because THAT is not
settled — the AVIF ladder, the crop and the widths can all change and have to
be able to run over the masters again. **A pipeline stage that can only ever
reproduce its own committed output is not a pipeline stage.\*\*

**The check that misses this class is a normalised field.** The rebuild
comparison excluded `retrieved_at` because the corpus README asserted it
carried no information — the assertion was false, and no reproducibility check
can disprove a claim that a value does not matter. Normalise `generated_at` and
`applied_at`, and nothing else.

**Deleting generated works is a decision for the person directing the work, not
a judgment call to make mid-task.** An agent once removed 105 empty work
directories on its own stub-detection heuristic; nothing was lost, but nothing
had authorized it either. If you are delegating, name the deletable set and the
protected set explicitly — a brief that only says what to _fix_ leaves deletion
as an unstated judgment call, and it will get taken.

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
                     script over it. It reads its anchors from
                     `pipeline/dore-anchors.json` rather than deriving them --
                     see "Output that is only regenerable" above.
  vatican_docs.py    encyclicals, Vatican II, exhortations
  prayers.py
  audit.py census.py apply_sweep.py   tools over already-written output
```

**A scraper in a subdirectory needs the `sys.path` line above its imports.**
Python puts a script's own directory on `sys.path` at startup, which is the
entire mechanism behind a bare `import common`; for `bible/` and `ccc/` that
directory is no longer the one holding the package. Each of those six files
inserts its parent before importing `common`, so the `common` import (and the
per-host format import that itself imports `common` — `sacredbible` in two
Bible scrapers, `vulgata_online` in the other two) sits below that line rather
than at the very top. Ruff does not object — it
exempts imports that follow `sys.path` manipulation from E402, so no `noqa` is
needed and one added "for safety" is reported as unused. Copying one of these
scrapers to start a new one and dropping the "odd" lines at the top gets you
`ModuleNotFoundError: common`.

**`common/book_forms.json` is the site's book table, exported.** `ccc.py`
tokenizes the Portuguese Catechism's inline Scripture locators with the same
surface forms `site/src/lib/refs-grammar.ts` links with; Python cannot import
the TypeScript, so `site/scripts/export-book-forms.mjs` writes the table as
JSON and `site/src/lib/book-forms.test.ts` fails when the two differ. After
changing `BOOK_VARIANTS_EN`/`BOOK_VARIANTS_PT`: `cd site && node
scripts/export-book-forms.mjs`, commit both. Editing the JSON directly is
undone by the next export.

**`common/paths.py` computes the repo root as `parents[3]`** and asserts the
result contains `pipeline/scrapers`. It was `parents[2]` while `common` was a
single module beside the scrapers, and the assert is there because getting it
wrong yields paths that are merely _absent_ rather than obviously wrong --
`load_corrections` reads a missing directory as "no corrections filed", which
is a silent, corpus-wide no-op.

## Linting: ruff and prettier, behind a hook that is not installed for you

Ruff's rules live in `ruff.toml` at the repo root -- not a `pyproject.toml`,
because the scrapers are standalone PEP 723 `uv run --script` files and there
is no package to declare. The selection is pinned rather than left to ruff's
defaults, which have widened between releases.

```sh
ruff format pipeline && ruff check --fix pipeline
```

**A fresh clone has no hook until you enable it**, because git will not run
anything from a tracked directory by itself:

```sh
git config core.hooksPath .githooks     # once per clone
```

`.githooks/pre-commit` then runs `ruff format --check` and `ruff check` over
the **staged content** of every touched `.py` file -- piped from `git show
:path`, so an unstaged fix cannot make a broken commit pass, and an unstaged
breakage cannot fail a clean one. It uses `ruff` from `PATH`, falls back to
`uvx ruff`, and `git commit --no-verify` bypasses it. Note that `git config`
writes `.git/config`, which the sandbox masks with `/dev/null`; run that one
line with the sandbox off.

**Prettier runs in the same hook, over what is staged and nothing else**
(`docs/decisions.md` §Process) -- everything under `site/`, plus Markdown
anywhere in the tree. Two things about how it is invoked are load-bearing:

- It runs **from `site/`** whatever the file, because prettier resolves a
  config's `plugins` against the working directory, so `prettier-plugin-svelte`
  is only found from there, and `site/.prettierignore` (which is what excludes
  `package-lock.json`) is only the default ignore file from there. Files
  outside `site/` are addressed as `../path`; they resolve no config and get
  prettier's defaults, which is what the Markdown here is already written to.
- A file prettier **cannot parse exits 0** over stdin and complains only on
  stderr, unlike ruff. So the hook fails on any stderr output, not on the exit
  status alone.

It uses `site/node_modules/.bin/prettier`, falls back to `prettier` from
`PATH` (fine for Markdown; a `.svelte` file needs the plugin, i.e. `npm
install` in `site/`), and skips the whole section when nothing it owns is
staged -- a Python-only commit never touches Node.

The pipeline's JSON stays out of it: `pipeline/corrections/`,
`pipeline/overrides/` and `absent-sources.json` are written by the scrapers,
and a hook that reformatted them would fight their writer. `site/` still owns
`npm run format` / `check` / `test` for a whole-tree pass; the hook only
decides _when_ something runs.

## Scraping vatican.va

- `robots.txt` says `Crawl-delay: 2`. This is a commitment in
  `docs/decisions.md` about our conduct toward someone else's server, not a
  tuning parameter.
- **Never run two sweeps at once.** It doubles the request rate and races two
  writers on the same work directory. `vatican_docs.py` holds a heartbeat lock;
  don't work around it.
- Expect ~1-in-6-to-8 transient failures (Azure edge flakiness, no 403s, no
  CAPTCHA). Retry with backoff; a genuine failure belongs in the run summary,
  never silently absent from the corpus.
- **The Pius XI index lists one encyclical twice**, and the corpus takes it once.
  `hf_p-xi_enc_19370328_firmissimam-constantiam` and
  `hf_p-xi_enc_28031937_nos-es-muy-conocida` are the same document at two addresses —
  the Latin incipit against the Spanish one, the date written the other way round in
  each — and the parses were byte-identical. `INDEX_DUPLICATE_SLUGS` in
  `vatican_docs.py` drops the Spanish-titled slug at DISCOVERY, which is the shape to
  copy: both pages are real and both were fetched, so `raw/` keeps the second one as
  evidence and only the second address goes. It is the only duplicate in the corpus
  (checked 2026-08-31 by hashing every work's `sections.json` and `appendix.json`), and
  it is a table anyway, because what produced it was the origin's index rather than
  anything here.
- **A document's title is MANUFACTURED from its slug, and `SLUG_TITLES` is where that
  breaks.** `rerum-novarum` becomes `Rerum Novarum` because vatican.va names an
  encyclical's file after its incipit — a habit of the origin's file naming, true of 234
  of 256 documents, and not a rule. Measured 2026-08-31 against each raw page's own
  `<title>`, in three kinds. Fifteen slugs are TRUNCATIONS of the incipit (`mater`,
  `pacem`, `populorum`; `orientales` is the one that also misleads, since
  `orientales-omnes-ecclesias` is a different encyclical seven years older), six cannot
  carry the title's apostrophe, accent or comma (`vi-e-ben-noto`, `laudato-si`), and
  **one names something else entirely** — Francis's 2023 exhortation is filed under the
  saint it commemorates and is called _C'est la confiance_, which is also the only
  document of the 256 whose `<title>` does not contain its slug's words at all. The
  entry records what the document's OWN language prints where the editions disagree.
  `ideal-film` is deliberately absent: its editions disagree about the NAME —
  `Il Film Ideale` against `The Ideal Film` — and a work with no incipit gives the
  table nothing to choose on. A stale key fails silently — the manufactured title is only reached when
  the table misses — so a full `--exhortations` run with no filter reports keys that
  matched no discovered document.
- **A PAGE'S OWN LINKED TABLE OF CONTENTS OUTRANKS EVERY OTHER LEVEL SIGNAL, and
  it is on 81 of 2,080 raw pages rather than the three `extract_toc_outline` was
  written for.** The docstring said three until 2026-09-01, measured over a raw
  corpus a quarter of today's size; nothing re-ran the count when the
  ten-language expansion quadrupled it, so a mechanism described as an override
  for two documents had quietly become the outline of a twentieth of the corpus.
  **Re-measure it when the corpus grows** — that number is the blast radius of
  everything in the function. Three defects it was hiding, all fixed that day and
  all worth knowing as shapes:
  - **The depth cue can be STRUCTURAL rather than typographic.** `querida-amazonia.pt`
    emphasises nothing at all and nests its sub-entries in a `<blockquote>`, so all 37
    entries read as one level and the four chapters became siblings of their own
    sections — the reported symptom. A `<blockquote>` is the one indent that is
    RELATIVE, so it sets a FLOOR of one below the last entry outside it and never a
    tier of its own: `verbum-domini.en` wraps most of a chapter's sections and forgets
    one, and a third tier read off the wrapper alone would file fifteen sections under
    the sibling the source missed. 14 pages gained real structure; `magnifica-humanitas.de`
    moved onto the exact level counts its es/fr/ru siblings already had.
  - **The outline's own TITLE is not part of the document.** `INDEX`, `ÍNDICE`,
    `Tartalomjegyzék` sit outside the run of links that detects the outline, so the
    span began one paragraph late and left the word behind as a heading —
    `verbum-domini.en` opened with a level-3 node called INDEX. `_TOC_TITLE_WORDS` is a
    CLOSED table of 14 spellings, because the paragraph above an outline is as often the
    document's own name (`CASTI CONNUBII`), its first division (`PRVI DIO`) or a rule of
    underscores, and absorbing one of those loses a heading the document really prints.
  - **A `[9-14]` on an entry is an annotation, not a title.** It only ever mattered where
    the outline and the body also disagree: `Comunidade`/`Comunidades cheias de vida`
    drops the fuzzy match to 0.84 against a 0.90 threshold entirely on those eight
    characters, so the entry took no TOC level and nested one tier too deep.
- **`--slugs` naming only exhortations parsed nothing and exited 0**, until 2026-09-01.
  `run_phase2` filtered a pontificate's encyclicals and then `continue`d past the whole
  iteration when none survived — so `--slugs querida-amazonia` never reached Francis's
  exhortations, where the document actually lives. It is the recommended way to check a
  parser fix on one document, and it was answering "clean run" to a run that parsed
  nothing.
- Source defects go through `pipeline/corrections/` with locator, exact
  before/after, reason and evidence — never a code special-case, and never
  invented text. A defect with no known correct value gets documented, not
  fixed (`docs/decisions.md` §Corrections and overrides).
- **That rule is about PROSE. Broken markup is the parser's business**, however
  few instances there are, and the class-vs-instance test does not reach it.
  A correction amends what the source _said_ and so must be auditable; a
  mangled tag changes nothing a reader reads and only decides whether the
  parser can find the text at all, so repairing it restores the source rather
  than amending it. `martini.py` normalises three (`<em<`, `<br<`, one `zem>`)
  in code with the locators in its docstring, and that is correct.
- **`pipeline/corrections/` and `pipeline/overrides/` are different layers.**
  A correction says the _source_ is wrong and edits the fetched HTML before
  parsing; an override says the source is fine and our _derivation_ is not,
  and edits the parsed output. Keeping them apart is what lets `raw/`
  stay the record of what the source actually said. Overrides are the
  exception: before filing one, ask whether the defect belongs to one document
  or to a class of them. It has been a class nearly every time — the layer
  holds 5 entries against a corpus of 421 works, all of them the same defect
  (a PT edition using `<blockquote>` to indent the document's own words),
  filed only because the sole discriminator is cross-language and the parser
  reads one document at a time. See `pipeline/overrides/README.md`.

## The Magisterium is ten languages, and most of them print no paragraph numbers

Taken in on 2026-08-29 (`docs/decisions.md` §Languages). `vatican_docs.py` had
fetched English and Portuguese for 272 documents and left `DEFAULT_LANGS` as
the boundary of the corpus; it now holds **1,237 editions of 305 documents in
ten languages** — en 264, it 238, la 199, pt 138, es 125, fr 118, de 79,
pl 42, ar 24, ru 10. Five things about that will bite before the design will.

- **The crawl was already paid for and nobody had noticed.** 1,571 of the
  pages were under `raw/` before this started, put there by a `--fetch-only`
  run in August, and another 740 (document, language) pairs were recorded in
  `pipeline/absent-sources.json` as definitive 404s. The whole ten-language
  expansion cost **369 new requests**, all of them for the two families the
  earlier sweep never probed. `--fetch-only` is the reason: it is what lets a
  crawl be an acquisition rather than a publishing decision, and the value of
  that only showed up months later.
- **Apostolic exhortations were fetched and never parsed.** `--exhortations`
  is opt-in and no recipe passed it, so 33 documents sat in `raw/` with no
  work directory, no address and nothing anywhere saying they were missing.
  They are 236 editions now. If a family has a discovery function and a flag,
  check the rebuild recipe passes the flag.
- **`lt` is LATIN on the Vatican II mirror, `sw` is SWAHILI, and neither is
  what the code looks like.** The archive mirror uses its own two-letter codes
  — `po` Portuguese, `sp` Spanish, `ge` German, `lt` Latin, `lv` Latvian, `be`
  Byelorussian — and `VATII_LANG_FROM_URL` reads them off **the index's own
  link text**, which labels every link with the language's English name. Do
  not guess them; the same `lt` trap is documented for `catechism_lt` above,
  and guessing `sw` gives you Swedish.
- **The new editions are mostly UNNUMBERED, which is a property of the
  editions and not a parse failure.** 328 of them print no paragraph number
  anywhere — 145 Italian, 134 Latin, 34 French — so their whole text is stored
  under the headings the source does print, in `appendix.json`, and they have
  no citable address at all. That is the same shape eight editions already
  had; it is now the majority shape outside English. Read an empty
  `sections.json` as an unnumbered edition, not an empty document.
- **A stray numbered list is what defeats the parse, and there are 15 of
  them.** An edition that prints no paragraph numbers but does print a
  numbered list of decrees near the end gets read as a six-section document
  whose §1 holds everything before the list. The signature is one section
  holding over half the text; the fifteen are in `site/unpublished.json`, each
  with its measured percentage, and each is switched off rather than shipped
  because a reader cannot tell a swallowed document from a short one.

### "Do we have every language?" — answered on 2026-08-29, in the ledger

The question got asked twice, and the answer was not written down anywhere the
second asker could find it. It is now: `pipeline/translations-checked.json`
holds **629 records**, up from 125, and `pipeline/scrapers/record_translations.py`
is what put them there — **without one request**, because every answer was
already sitting in `raw/`.

- **619 raw document pages produced no work directory, and every one of them is
  a page with no document on it.** Not a parse we lost: the tool runs the real
  `parse_document` and records a status only where it raises `StubPageError`,
  so a page that parses is printed as unexplained and nothing is written for
  it. Zero were. 613 are `stub-page` — de 181, fr 143, es 135, it 23, en 8,
  pt 8, ar 3, pl 2, la 1 — and vatican.va serves them **200, not 404**: the CMS
  generates a URL slot per (document, language) whether or not a translator
  ever filled it, and the page's own `EN - IT - LA - PT` bar is its statement
  of which editions really exist.
- **`pdf-only` is a fifth status and the only one that does not mean absent.**
  Six editions exist and vatican.va publishes them as PDF, which nothing here
  reads: `amoris-laetitia.en`, `verbum-domini.la`, `africae-munus.ar`,
  `evangelii-gaudium.ar`, `lumen-fidei.ar`, `lumen-fidei.pl`. The **English
  _Amoris Laetitia_** being one of them is worth knowing before reading a hole
  in an English column as the source's fault. The evidence is a `/content/dam/`
  href whose language suffix matches the page — every page links its siblings'
  PDFs too — and the suffix uses the mirror's codes, so Latin arrives as `_lt`.
- **So the exhortations are 236 of a possible 330**: 76 recorded 404s, 14
  stubs, 4 PDF-only. Per language, of 33 documents: it 33, en 32, pt 30, fr 30,
  es 30, de 28, pl 21, la 20, ar 8, ru 4. Nothing is missing that a re-crawl
  would find.
- **The ledger is an input, and the manifests catch up on the next parse.**
  `write_document_outputs` reads it into `manifest.translations`, so the 504
  new records reach `build/` when the works are next re-parsed and not before.
  That is the design (`common/translations.py`), not a gap: the ledger is the
  record and the manifest is a copy of it.
- **Ten is our boundary, not vatican.va's, and it is a vocabulary and not a
  wall.** Each document's own language switcher offers more — measured across
  the 256 encyclicals and exhortations, `hu` in 32 documents, `zh_cn`/`zh_tw`
  in 15 each, `be` in 15, `nl` in 10, `sl` and `vi` in 8. Read those as an
  upper bound: a switcher entry is a link, and a link can lead to a stub. `hu`,
  `sl` and `ro` are the interesting ones because they are already interface
  languages with no content in them at all.

### Twelve more languages, and the answer to "hard constraint or table?"

Taken in on 2026-08-29, the same day the question above was answered.
**`DIVISIONS` is a data table and a new language is a vocabulary entry**, which
is what its own comment already said; the CLI's refusal to parse a language
with no entry is a guard against producing one undivided blob, not a wall.
The corpus now holds **139 more editions** in cs, da, fi, hr, hu, lv, nl, ro,
sk, sl, sw and vi — 1,272 works to 1,411 — for **141 requests**. 129 of them
ship with readable text; the other ten are the switched-off parses below, and
129 + 10 accounts for all 139 with nothing unexplained.

- **The cheapest useful entry is the four nouns and nothing else**, because
  `_NUMERAL` already reads `CAPUT III` and `III CAPUT` with no vocabulary at
  all. Ordinals are needed only where the language spells a division number
  out as a word, and not one of the twelve does.
- **That entry was a latent bug until this day.** With `ordinals` empty,
  `_alt` returned `""` and the compiled pattern became `(…|)` — an alternation
  with an empty branch, matching zero characters after the noun, so ordinary
  prose opening with the word "part" read as a division. It was waiting
  precisely where the next language would land. Fixed in `_compile_labels`.
- **`--offered-only` is why the crawl was 141 requests and not 2,816.** Every
  modern-shell page prints a language switcher naming its document's other
  editions, and measured over all 1,736 encyclical and exhortation pages it is
  on every one and is EXACT rather than generous — `signum-magnum` lists
  en/it/la/pt and omits the de/es/fr URLs that answer 200 with an empty shell.
  The flag falls back to asking when the base page is not cached, so it can
  only save requests, never lose an edition.
- **Five of the twelve print no division label at all**, and their entry is an
  empty `nouns` rather than one written from a dictionary — Swahili (16 pages,
  all Vatican II, which head divisions with a bare Roman numeral), Croatian,
  Slovak, Finnish, Romanian. **The check is what earned the empty entries**:
  Danish `DEL` scored 31 and every one is the prose phrase "del i"; Croatian
  `DIO` scored 3 and all three sit inside "vidio"; Finnish `LUKU` scored 1 and
  it is "the 17th chapter of John" in a sentence. A candidate noun is proposed
  and then READ, never counted and believed.
- **The English fallback reads these languages correctly, which is not what
  the `1 Joh` case would predict.** Every surface it resolves was checked:
  `Jn`→John and `1 Jn`→1 John in Hungarian, `Joh`/`Lc`/`Mc`/`Gn` in Dutch,
  `Mt`/`Lk` in Czech and Slovenian, `Taz. Mk` in Swahili. Nothing mis-links.
  What is missing is coverage, not correctness — Hungarian `Zsolt` (Psalms)
  and its like are simply not read, which is what `book-forms-oracle.mjs
--derive` is for and has not been run for these yet.
- **Ten damaged parses are switched off** in `site/unpublished.json`, found by
  the same measure as the last wave: one section holding over half the text.
  Slovak `dives-in-misericordia` and `laborem-exercens` are single sections
  holding 100%.
- **What is deliberately still out: the non-Latin scripts.** `be`
  (Byelorussian, 16 Vatican II documents) and `he` (Hebrew, 1) are mapped in
  `VATII_LANG_FROM_URL`'s comment and nowhere else; Chinese is the only one
  that is a code question rather than a table — `第一章` interleaves the
  numeral between two markers and `_NUMERAL` has no CJK digits. Russian and
  Arabic already prove a non-Latin script needs no code, only a table.

**That last bullet was tested the same day and was half wrong.** Byelorussian
needed no code — `be` on both mirrors, a table, 31 editions. **Hebrew needed
three lines, and none of them were about the script.** vatican.va's modern CMS
spells Hebrew `iw`, the ISO code retired in 1989, while the Vatican II archive
mirror spells it `he`; the corpus stores `.he`, so one language now takes a
different code in each of the two families and in the work id. That broke
`url_lang_key` (translated for `vatii` only), `translation_url_for`
(substituted the work tag into the path, producing a `/he/` that 404s) and
`--offered-only` itself (compared the work tag against a switcher that prints
`iw`). All three were invisible while every language's two codes matched, and
all three sit on the ONE document in the corpus that offers Hebrew. The fix is
`MODERN_LANG_TO_URL`, and the rule it encodes is that `lang_urls` is keyed by
what the SOURCE calls the language, never by what we call it.

**Ukrainian and Mongolian are switcher entries that lead nowhere.** All four
of their pages are the 200-with-no-document shell, now recorded as `stub-page`
— which is why they have a `DIVISIONS` entry and no editions, and why a
switcher count is an upper bound after all.

**`Пар.` is the Byelorussian near-miss worth remembering.** It scored 101, more
than any real division noun in the language, and it is `параўн.` — "cf." — the
first word of a footnote. Counting without reading would have made every
footnote in Byelorussian a chapter heading.

## The Catechism is eight editions in three page formats

Ingested 2026-08-26 (`docs/decisions.md`, `docs/corpus-schema.md` §Catechism).
`ccc.py` reads every language vatican.va publishes the CCC in as HTML — `de`,
`en`, `es`, `fr`, `it`, `la`, `mg`, `pt` — and captures the two it publishes
only as PDF (`ar`, `zh`, both split across part-files) into `raw/` for nothing
to read. Three things about it are worth knowing before touching the file:

- **`catechism_lt` on vatican.va is LATIN, not Lithuanian.** The site's own
  link text says so, the pages say `PARS PRIMA`, and `lt` there is _latine_.
  The Compendium's Lithuanian PDF two directories away is
  `compendium_catech_lit.pdf`, with the other slug. Both expansions are
  plausible and nothing else in the corpus disambiguates them, so getting it
  wrong files the _editio typica latina_ under a language it is not in and no
  check catches it.
- **Three page families, not eight parsers.** `intratext` (en/fr/de — the old
  IntraText mirror, `__P*.HTM`), `cms` (es/it/la/mg — vatican.va's own CMS,
  `<p align="left">` with a bold leading number), and `pt` (its own
  per-chapter mirror, which predates both and keeps its own reader).
  `EDITIONS` names the source, `LANG_CONFIG` the reader, and the label
  vocabulary is one table per language in `_LABEL_PATTERNS`.
- **Only five of the eight print footnotes.** French, German and Spanish fold
  every reference into the running text instead, so their paragraphs carry
  `citations: []` by construction and their stored text is longer than the
  same paragraph elsewhere. That is the edition, not a gap — see
  `docs/corpus-schema.md`, and read `audit.py balance` with it in mind.

**Two editions print an abbreviations table, and they are not the same
table.** `abbreviations.json` was `[]` everywhere until 2026-08-26 because
the EN and PT mirrors open at the Prologue; French serves one as `__P1.HTM`
("LISTE DES SIGLES", 58 magisterial documents and liturgical books) and Latin
as `abbrev_lt.htm` (119: 46 bibliographic and editorial sigla, then all 73
Scripture books). Both are now parsed, by `Edition.sigla` and
`SIGLA_READERS`, from pages the body loop never visits.

The open schema question — one shared table with per-language expansions, or
one per edition? — was settled by the sources rather than by argument. The two
overlap on eight abbreviations and **disagree on two of them**: `SC` is
_Sacrosanctum concilium_ in French and _Sources chrétiennes_ in Latin, `CA` is
_Centesimus annus_ against _Corpus apologetarum_, and each is right about its
own edition's references — the Latin text's 118 `SC` citations are
volume-and-page, "SC 211, 392 (PG 7, 944)". So it is per-edition, the other
six stay `[]`, and `abbr` is not even unique within one edition (Latin gives
`Act` as both _Actio_ and _Actus Apostolorum_): read the array in order and
use `kind`.

**Both tables now feed the site's grammar**, which is where the collision
turned out to matter: `refs-grammar.ts` had configs for EN and PT only, so
the six new editions read their references through the English sigla table
and `ccc.la`/`ccc.it` resolved 54 and 55 `SC` volume numbers to real
Sacrosanctum Concilium sections. See "Reference grammar" below.

## The Summa is the exception to two rules at once

Ingested 2026-08-23 (`docs/decisions.md`, `docs/corpus-schema.md` §Summa). It
is worth knowing about before touching edition logic, because it breaks two
assumptions the rest of the corpus satisfies:

- **It has no Portuguese edition, and will not before 2055** (the translation
  that circulates is Alexandre Correia's, who died in 1984; the free online
  one is machine-translated). So it is the first work where "content language
  follows UI language" has nothing to follow. The rule is now an explicit
  chain — the reader's language, then **English, then Latin**
  (`CONTENT_LANG_FALLBACK` in `site/src/lib/corpus.ts`) — and it resolves
  **per address**, not per work, because:
- **Its two editions cover different parts.** `summa.en` has five, `summa.la`
  four: the Corpus Thomisticum publishes no Supplementum. A citation to
  `Suppl q. 77` must therefore reach English even for a reader who prefers
  Latin, which a work-level fallback could not express.

Neither is a gap to be filled later. Both are properties of the sources, and
`validate` asserts the shape rather than symmetry — but the cross-language
oracle still runs over the parts both editions carry, and it is the check
that found three articles whose body the English edition omits.

## Haydock is a commentary, and a commentary has no address

Ingested 2026-09-01 (`docs/decisions.md` §Addresses and editions,
`docs/corpus-schema.md` §Commentary). `commentary.haydock.en` is the first
`type: 'commentary'` work: its units ADDRESS `bible.douay-rheims.en` rather
than containing text, because vulgata.online's `HAY` ships `fn` records and no
`vs` at all — Haydock wrote an apparatus on the Challoner text, not a
translation of it. Six things will bite before the design will.

- **It contributes no route, no sitemap entry and no `route-titles.json`
  name**, so none of the address-grammar machinery had to learn about it —
  `hrefFor`, `isCanonicalPath`, `WORK_OF` and `assertNamed` are all untouched.
  That is the cheap fork of the two `docs/research/haydock.md` left open, and
  it is the one the corpus already had a shape for.
- **`sync-corpus.mjs`'s type chain has NO fallback**, which is the silent
  failure to know about if a second commentary or any new work type arrives:
  an unhandled `manifest.type` registers its manifest and emits no content, no
  routes and no error. The work then exists in `listWorks()`, renders nowhere,
  and 404s nowhere either. The branch to copy is `if (manifest.type ===
'commentary')`.
- **The content path shape is the Bible's on purpose** —
  `content/{workId}/books/{osis}/{start}-{end}.json`, packed by the same
  `BIBLE_CHAPTER_CHUNK_TARGET_BYTES`. `bibleChapterLocations` in
  `corpus-index.ts` therefore reads both with one regex and one map, and
  `bibleChapterChunkFor` is keyed by work id and makes no claim about type.
  The name is the Bible's because that is what it was built for; do not add a
  second lookup. Measured worst case is Psalm 118 at 59 KB against a 150 KB
  pack target and a 200 KB hard ceiling.
- **`rebuild.py` has a dependency edge now, and it is the first.** `haydock`
  reads `bible.douay-rheims.en` out of `build/` for both its crawl plan and
  its validation oracle, so `Stage.needs` and `waves` exist. Everything else
  in `STAGES` still depends on nothing but `raw/`, and the outputs partition
  is still about WRITES — it never said anything about reads, which is the gap
  that closed.
- **A book cannot be walked to its first empty chapter here.** That is
  `douay_rheims.py`'s rule and it inverts: a chapter Haydock did not annotate
  answers `[]` exactly as a chapter past the end does, so a walk truncates the
  book at its first unannotated chapter with nothing to say it had. The plan
  is read off the annotated edition, and one chapter past each book's end is
  still probed so the plan is checked rather than trusted.
- **The source's sub-note markers are ALL `#1` and pair by POSITION.** A
  record's body carries `_(#1)_` anchors and `__Notes:__` blocks are appended
  after it, one per anchor, in anchor order; Apocalypse 20:2 has sixteen of
  each. Reading the digit as a marker silently collapses fifteen notes into
  one. `validate` asserts the two counts agree, and `number_anchors`
  renumbers on the way out.

**One `fn` record is one VERSE, not one note** — it holds that verse's whole
commentary as blank-line-separated paragraphs, and each paragraph is one
authority's remark. That is why the stored unit is the paragraph: filing the
record whole puts fourteen thousand characters under a single attribution.
69% of notes close with an authority from a CLOSED vocabulary; a tail outside
it stays in the text with no `attribution`, and `--attributions` reports the
residue so the vocabulary can be widened by reading rather than by counting.

**The reader's preference selects the apparatus, and it is a SET.**
`apparatus-prefs.svelte.ts` cannot reuse `content.svelte.ts` — `Override`
holds one `workId` and a reader can have two apparatuses beside one verse.
Edition notes default ON and a commentary defaults OFF, so what is stored is
the difference from the default rather than the state; storing the state makes
"never touched the panel" and "switched everything off" the same value, and
the next work ingested arrives silently off for the first of them.

**The mark is anchored to the VERSE, and getting a dagger to draw cost a font
file.** The obvious anchor is the lemma and it fails twice: of 45,824 notes only
27,201 carry a lemma at all and 25,078 of those quote the Douay verbatim, so a
lemma-matched token would anchor 55% of the apparatus and only on
`bible.douay-rheims.en`. A marker run with holes is worse than none, so the mark
names the verse, which every edition has. **`†` is NOT in either text family's
`latin` subset** — Google files U+2020 under `latin-ext`, so one dagger would
pull 158 KB of Source Sans 3 for a reader who needs it for nothing else, and
would pull it for the English reader too, since a commentary is switched on
rather than implied by a language. `static/fonts/source-sans-3-marks.woff2` is
1.1 KB subset to that single codepoint under its own family, precached with the
core faces, and `fonts.css` records the `pyftsubset` line that made it — the
same shape the two drop-cap faces already had. **`‡`, `※` and `⁂` are not
reachable at any price**: checked with fontTools across every file in both
`@fontsource-variable` packages, Google's subsets do not carry them, so a second
mark needs a different source font and not a different range.
`sidenotes.test.ts` pins the codepoint against `fonts.css`'s `unicode-range`,
because a mark and a face that disagree render in a system font and nothing
fails.

**IT SETS NOTHING IN THE MARGIN, AT ANY WIDTH — the mark opens a card and that
is the only way in.** It had a gutter form for a day, on the premise this site
is named for: the gloss beside the line it belongs to. That premise assumes an
apparatus SMALLER than the text it hangs on, and this one is not — Haydock
annotates 20,814 verses, a chapter runs to 4,690 characters at the median and
52,496 at its worst, and the column was neither beside the text nor bounded by
it. `.margin-note` was written for Challoner at the length of a sentence.
`NoteCard` learned `{ margin: false }` for it, and every gate in the class now
reads `#inMargin` rather than `sidenoteRoom.margin`: with no margin copy a click
always opens, `aria-expanded` is always a claim we can keep, and there is never
a note in the gutter to light. That also deleted the clamp, the "read more", the
dialog and `commentaryChars` — a card scrolls, so there is nothing in one for a
clamp to protect — and returned that CSS to `Sidenote.svelte`, which owns it
alone again. What stayed global in `reading-chrome.css` is what genuinely has
two owners: `.note-marker`, `.note-trigger`, `.note-popover`.

**The dagger is superscripted by `vertical-align`, not by the glyph**, and it
took a wrong turn first. The asterisk it replaced is drawn high in its own em
box, so raising it again put it above the ascenders and it was set on the
baseline; a dagger is drawn baseline-to-cap like a letter, so on the baseline it
sits IN the line and reads as a character of the verse. `.commentary-marker` now
overrides `.note-marker` in exactly two declarations — the face that draws
U+2020, and a hair more lead-in, because a footnote marker follows a word and
this one follows a full stop.

**A COMMENTARY IS OFFERED AT EVERY EDITION OF ITS ADDRESS, and the gate that was
there for a day was answering the wrong question.** `commentariesAt` took a work
id, on `docs/decisions.md`'s argument about Challoner and the CPDV: attaching an
apparatus to a translation it was not written on is an editorial act. That
argument is about a note the reader cannot tell apart from the edition's own —
Challoner's notes ship INSIDE `bible.douay-rheims`. Nothing here is silent: a
separate work, named in the panel that switches it on, opened from its own mark,
set in a card with its own `lang`. What made the gate unnecessary is the ANCHOR:
keyed to a lemma it really would be undisplayable beside another edition, since
the words it quotes are not there; keyed to the VERSE it asks only that the
address exist, and every edition here is versified the same way. `annotates` is
still read — by `subsumes_notes`, which is a claim about one edition only.

**HAYDOCK CONTAINS CHALLONER, so both apparatuses on printed most of one of them
twice.** Measured over the built corpus: 1,399 of the Douay-Rheims's 1,916 notes
appear again in the catena (1,249 at >=0.9 similarity) and 1,300 paragraphs are
signed "Challoner". `CommentaryManifest.subsumes_notes` states it — a property
of the WORK, written by `haydock.py` — and the site reads it to flip ONE default:
`editionNotesEnabled(workId, subsumed)`. **Nothing is suppressed**, because the
overlap is 73% and not 100% and 517 of Challoner's notes are not in the capture;
the panel keeps the switch and says why it moved. That is also why the store's
`off`/`on` lists both carry edition ids now: it holds the difference from the
default, so a default that moves needs both directions.

**A blank line is not always a paragraph break, and 20 records prove it.**
Haydock quotes two phrases of a verse in one italic run and the transcription
prints a blank line inside it, so `_Give his only begotten Son ⏎⏎ God sent not
his Son into the world._` (John 3:17) split into two chunks with one underscore
each — neither a lemma, and `strip_emphasis` left the orphan `_` in the reader's
text. `split_paragraphs` rejoins while the run is open. The count that makes
that safe is the other one: **not one of 20,814 records has an odd number of
underscores overall**, so a merge begun always closes, and the anomaly reported
is for the record that would prove the measurement stale.

**HAYDOCK NAMES HIS NEIGHBOURS WITH NO BOOK AND NO CHAPTER, and reading that
cost one opt-in and one refusal.** `v. 12`, `ver. 5. 8`, `vv. 3, 10` — an
apparatus annotates one verse at a time, so the page IS the chapter and a
printed catena says so by leaving it out. `RefsOpts.sameChapter` is the opt-in
(`CommentaryGloss` passes the verse's own address; nothing else passes it at
all) and it adds **2,745 links, a 31% rise on the work's whole apparatus**.
Four things about it:

- **`v.` is also the Roman FIVE, and nothing after it tells the two apart** —
  a chapter five is followed by a verse number exactly as "verse" is. What
  separates them is the token BEFORE: `Wisd. v. 1`, `Ezec. v. 2`, `1 K. v. 23`,
  `Calmet v. 6`, `S. Matt. c. xxiv. v. 40` are every one a chapter, and every
  one is preceded by a capitalised word, a Roman numeral, or `and` continuing
  the locus before it. `sameChapterFalseLead` refuses those 593 and admits
  2,753. `See` is the one capitalised word let through — a verb of the
  surrounding prose, never a work's name, 75 references.
- **A `v.` inside a longer locus never reaches the guard**: `linkifyProse`'s
  merge drops any hit overlapping one that started earlier, so scan 2 wins
  wherever it read the book.
- **`parseVerseList` cannot be reused, and reusing it eats the next
  reference's book number.** It chains a list on `.` for its own good reasons;
  at `v. 54. 2 Par. vi. 13` that takes the `2` of `2 Par.` as verse 2. A real
  `.`-chained continuation always carries a full stop of its own, which is the
  guard `SAME_CHAPTER_RE` encodes.
- **THE BARE RUN — `21. 27.` — IS NOT LINKABLE, and that is the measurement,
  not a shrug.** Genesis 1:1 ends "…out of pre-existing matter. 21. 27.", which
  really is verses 21 and 27. Of the 154 notes ending in a run of bare numbers
  it is **the only one**: the rest are patristic and juridical loci whose work
  title happens to end in a period — `S. Aug. ep. 119. 16.`, `Grot. Jur. ii.

21. 4.`, `Bible de Vence Max. 9. 5. 2.`, `Josep. Ant. 1. 6.`Under the
  tightest filter that still admits Genesis 1:1 (an ordinary prose word before
  the run) six of the seven survivors are still wrong. Nothing in the string
  distinguishes`matter.`from`Prolegom.`, so it stays text.

**The coverage meter had to be taught the same address, and the gate is
`family === 'commentary'`.** `reference-coverage.mjs` buckets prose as bare
strings, so it read 2,745 fewer references than the page drew until
`addUnits` started tracking the osis and chapter down its walk. A Bible
edition's own `notes` have the identical file shape and identical recursion
and must NOT be read that way — `Sidenote` passes no address, and Challoner's
`v.` is far more often a Roman five. That is the "the build side has to pass
what the page passes" rule arriving from the counting side rather than the
linking side.

**WHAT THE MARKER OPENS IS DECIDED BY LENGTH, NOT BY APPARATUS.**
`CARD_MAX_CHARS` is 900 and `overflowsCard` is the whole rule: under it a
floating card, over it `.note-dialog`. The number is the card's own arithmetic
— `.note-popover` caps at 26rem x 32rem, which is about 62 characters over 24
lines, so ~1,490 — and 900 keeps a card at three fifths of that, short of the
scroll. It moves 9.3% of Haydock's annotated verses, 8.2% of Martini's notes,
4.4% of Straubinger's, 0.7% of Allioli's, 0.3% of Challoner's and none of
Matos Soares's, which is the argument for a threshold rather than a
per-apparatus rule: the same edition prints both a phrase and an essay. It is
now the ONLY length threshold: `MARGIN_CLAMP_CHARS` (170) asked what a 17rem
gutter set before a float outran its line, the two were pinned four times
apart by a test so they could not converge, and the question stopped being
asked when the gloss left the gutter — below.

**AN EDITION'S GLOSS LEFT THE MARGIN ON 2026-09-01, AND THE APPARATUSES NOW
BEHAVE ALIKE.** `Sidenote` set its note in the gutter beside the line that
raised it — the _Glossa Ordinaria_ arrangement the project is named for — and
what retired it is the same measurement that had already kept Haydock out
(above): Straubinger's notes run 248/814 and Martini's 361/1,051 with single
notes at 4,830 and 10,243, so the column ran past the chapter and the gloss was
neither beside its line nor bounded by it. The mark opens a card, or a dialog
past `CARD_MAX_CHARS`, at every width. What went with it: `MARGIN_CLAMP_CHARS`,
`marginOverflows`, `--sidenote-clamp`, `splitNodes` and its node-tree cut, the
ellipsis button, `.note-tail`, `bible.readMore` in fourteen dictionaries, and
`.note-marker.highlighted` — a mark with no gutter copy has nothing across the
page to pair with. Three things about what STAYED:

- **`CitationDisclosure` KEEPS ITS MARGIN COPY**, so `sidenoteRoom`,
  `.margin-note`, `--margin-lane` and `CompareGrid`'s claim are all live. A
  footnote's source is 26 characters — a remark, which is what the arrangement
  was calibrated for and what it still sets whole. The lane is declared on
  every reading page whether or not anything occupies it, which is what keeps
  the reading column on the page's midline.
- **PAPER IS WHY `Sidenote` RENDERS ITS POPOVER UNCONDITIONALLY**, long notes
  included. A closed popover is `display: none` and a closed `<dialog>` holds
  nothing at all (`NoteDialog.rendered`), so once the margin copy was gone that
  card was the only copy of the apparatus left in the document — and a printed
  chapter would have carried a column of markers pointing at nothing.
  `print.css` sets `.note-popover` back into the flow in the shape
  `.margin-note` prints in. Gating it on `!card.asModal` prints the short notes
  and drops the long ones, which is the worse half of both answers.
- **A COMMENTARY STILL PRINTS NOTHING**, unchanged rather than overlooked:
  `CommentaryGloss` renders its card only when the mark does not open a dialog.

**THE VERSE MARKS THE LEMMA NOW, AND THE NOTE STOPPED REPEATING IT** (2026-09-01).
A headword quotes the words a note glosses, and a printed page sets it twice
because the note is at the foot of the page; on screen the note opens FROM those
words, so the copy at the head of the card was answering a question the reader
cannot have. `src/lib/lemma.ts`'s `splitLemma` locates them and `AnnotatedText`
wraps them, `sidenoteRoom.highlighted` lights them while the note is open, and
`Sidenote` prints its headword only when the verse could not. Five things.

- **THE ANCHOR IS THE MARKER, MATCHED BACKWARDS, NEVER A SEARCH.** The words are
  the run immediately before the token, because that is where the source set it.
  A search would find the wrong occurrence of any phrase a verse repeats and
  would then have to decide what to do about the ones it found twice; matching
  backwards has ONE candidate by construction and is either right or refused.
- **THE COMPARISON IGNORES EVERYTHING THAT CARRIES NO WORDS** — case,
  diacritics, punctuation and whitespace — because that is where a transcribing
  editor differs from the verse: `Perto estás de mim` against a verse that opens
  a parenthesis inside it, `Por que`/`Porque`, `first born`/`firstborn`. The
  answer is still an exact OFFSET, which is what `fold`'s index map is for: it
  was a length-preserving fold until the punctuation went, and `at[i]` is what
  buys the offset back. It also makes the `ELIDED` guard load-bearing —
  `E... diede...` folds to `ediede` once the dots are gone, and would match
  across any words at all.
- **FUZZY MATCHING WAS TRIED AND BOUGHT NOTHING.** A bounded edit distance (one
  edit per twelve characters) over the candidate tail recovers **zero** further
  headwords in either edition: what is left is not near-misses but places where
  the note does not quote the verse — `Let - human`, `A star fall`,
  `Now Alcimus` against `Now one Alcimus`. Loosening past the characters that
  carry no words only buys the power to mark a span the note never named.
- **MEASURED PER EDITION, AND THE THIRD IS ZERO**: `bible.douay-rheims.en`
  1,805 of 1,909 (95%), `bible.matos-soares.pt` 1,377 of 1,743 (79%),
  `bible.martini.it` **0 of 18,658**. Martini's notes are VERSE-level — every
  marker sits at position 0, so there is nothing before it — and his lemma is a
  catchword with the elision printed in (`E... diede... il nome di cielo.`),
  which names a discontinuous quotation and so is not a span of anything.
  Allioli (37,790 notes), Straubinger (13,079) and Crampon (8,854) print no
  lemma at all.
- **SO REFUSING IS A FIRST-CLASS OUTCOME AND THE PANEL KEEPS THE HEADWORD.**
  `lemmaMarked` is true exactly when the words were located, and it is what
  suppresses the headword — one prop, so the two can never disagree and no note
  can quietly lose its headword. A design that dropped the
  headword unconditionally would have deleted 18,658 of the corpus's 22,310.
- **`CommentaryGloss` KEEPS ITS LEMMAS, for two independent reasons.** Its mark
  is at the END of the verse, so there is nothing to match backwards from; and
  its card holds the verse's whole apparatus, up to twenty-nine notes, where the
  lemma is what divides one authority's remark from the next.

**THE OPEN STATE IS A BINDING, NOT A FIELD ON `sidenoteRoom`.** It was one for
an hour, on the argument that "which note has the reader named" is one question
whether the answer lights a gutter copy or a phrase in a verse. True, and the
wrong conclusion: `sidenoteRoom` is the MARGIN's object — whether the viewport
has room for a gutter copy, and which copy was clicked — and a verse with its
own notes is local to one unit. A page-wide field there is a singleton standing
in for something local, and it needs a key the parent and the child agree on to
address it by. `AnnotatedText` binds `Sidenote`'s `open` instead, and the
pairing runs on the PIECE INDEX alone: the text run at `i` ends with the lemma
of the marker at `i + 1`. `sidenoteRoom.highlighted` keeps its one writer.

**AND THAT BINDING MUST DECLARE NO FALLBACK.** `open = $bindable(false)` threw
`props_invalid_value` on every annotated chapter at hydration: `openNotes` is a
deliberately SPARSE array — only marker positions are ever written — so a parent
binds a slot that is still `undefined`, and Svelte refuses a fallback plus an
undefined binding because it cannot tell which of the two was meant. `$bindable()`
with no argument is the fix, and the third state is real rather than tolerated:
`undefined` is "this note has not reported yet", which reads as not open, which
is what it is. Filling the array to length ahead of the bindings is the other
fix and a worse one — an effect writing state derived from `pieces` on every
unit, to close a hole that already reads correctly. It is a RUNTIME error, so
nothing in `npm test`, `npm run check` or the build sees it.

**A 44px tap target on a mouse is a bug, and the dagger is where it showed.**
`.note-trigger::after` grows the mark to the accessibility floor as a
POSITIONED overlay, which paints above the inline content around it and
reaches ~18px each way from a 7px glyph. A commentary's mark sits at the END
of a verse, so the NEXT verse's number was inside it: clicking the number
opened the note. It is `@media (pointer: coarse)` now — a mouse is already
pointing at a single pixel and has `:hover` to confirm it — and
`.reference-number.inline` takes `position: relative` so that where the two
targets genuinely must overlap (a phone, four pixels apart) tree order settles
it in favour of the address. Same trick, same reason, as
`.reference-number.gutter` and its divider.

**Nothing is fetched until it is switched on.** `commentary.svelte.ts` is
`xrefs.svelte.ts`'s shape — a `$state` holder read inside a `$derived` — and
deliberately NOT part of `scriptura/[book]/[chapter]/+page.ts`'s
`listBibleWorks()` loop, which eagerly loads every edition of a chapter.
`commentary-chapters` is in the `scripture` wave, which is outside
`AUTOMATIC_WAVES`, so it can never enter an offline fill uninvited.

## Corpus data must never be inlined into the bundle

`corpus-index.ts` globs the content tier with `query: '?url'` on the premise
that Vite hands back a URL and emits the file as a separate, content-hashed
build asset. **Below `assetsInlineLimit` (4 KB by default) that premise is
false**: Vite base64s the file into a `data:` URI instead, and nothing
downstream notices. The bytes land in the boot chunk every route
`modulepreload`s -- the exact cost the content tier exists to avoid --
`sw-policy.ts`'s `contentPath` cannot make a pathname out of a `data:` URI so
the file belongs to no download wave, and `fetch()`ing it still works, so
nothing errors.

**And the glob must not run under `npm run dev` at all.** An eager glob is one
static import per matched file: the BUILD folds those into a chunk of strings,
the DEV SERVER answers each with its own module request. At 2,590 content files
that is past what a browser will open — Chrome fails the surplus with
`net::ERR_INSUFFICIENT_RESOURCES` rather than queueing, and what breaks is the
app, not the corpus: the module graph tears midway, `nodes/0.js` never arrives,
the page 500s, and the service worker (same inventory, smaller connection
budget) reports only `ServiceWorker cannot be started`. `npm run preview` is
always fine, which is the tell.

So there is exactly one glob (`site/src/lib/content-urls.ts`) — it was written
twice until 2026-08-26, free in production and 5,180 requests in dev — and in
`vite dev` even that one is replaced by `content-urls.dev.ts`, which derives
the same map from `content-manifest.json` in a single request. Dev URLs are
unhashed, so the glob buys no information there. `vite.config.ts`'s
`glossa:dev-content-urls` plugin performs the substitution and explains why it
matches the RELATIVE specifier: `vite:alias` is itself an `enforce: 'pre'`
plugin and resolves `$lib/...` before any other hook sees it, so the first
attempt silently did nothing at all.

`vite.config.ts` disables inlining for anything under `corpus-data/` and says
so at length. It was found when the document outlines moved to the content tier
(2026-08-26): 354 files averaging 1.2 KB, of which Vite emitted 29 and inlined
325, and the boot chunk barely moved. 43 documents' `appendix.json` had been
inlined the same way, unnoticed, since the appendix tier shipped. **If a new
content kind is small, check `build/_app/immutable/assets/` actually contains
it** rather than trusting the file count.

## Running the site

**The site is one SPA shell, not a prerender** (`docs/decisions.md`,
2026-08-18). `vite.config.ts` sets `prerender.entries: []` and `strict: false`,
and `src/routes/+layout.ts` sets `ssr = false`; the build emits `index.html`
plus the offline fallback and nothing else per route. So a broken link does
**not** fail the build. What guards addresses instead is `corpus-routes.json`,
generated by the corpus sync and consulted by `src/worker.ts` at the edge: a
canonical path gets the shell, an invalid reference-shaped one gets the shell
with a 404. `src/lib/route-manifest.ts` holds that grammar and is unit-tested.

Canonical reader URLs are Latin and do not vary with interface language:
`/scriptura/{osis}/{chapter}`, `/catechismus/{n}`, `/catechismus/caput/{n}`,
`/catechismus/compendium/{n}`, `/catechismus/compendium/caput/{n}`,
`/documenta/{slug}`, `/doctores/summa/{part}/{question}`, `/preces/{slug}`,
`/colophon`. The English roots (`/bible`, `/ccc`, `/documents`, `/prayers`)
deliberately resolve as invalid — there is no compatibility layer, and
**`/compendium/{n}` and `/summa/{part}/{question}` both joined them on
2026-08-28**, when the Compendium moved under the Catechism it condenses and the
Summa moved under `/doctores`, the shelf for the Fathers and Doctors of the
Church (`docs/decisions.md` §Addresses and editions). **`/doctores` is not in
the nav**, deliberately: the Summa is awaiting a quality pass and the shelf holds
nothing else yet, so nothing in the reading interface links to it. Restoring the
entry is one line in `+layout.svelte`, where the comment says so.

**The directory under `src/routes/` now IS the canonical path** (2026-08-29). It was
named in English with a Latin re-export beside it, and the cost was not
untidiness: a legacy path got a 404 from the worker and then rendered the real
page anyway, because `ccc/[n]` was still a route the client router could match.
Eleven of those existed. `bible/`, `ccc/`, `compendium/`, `documents/` and
`prayers/` are gone, the implementations sit at `scriptura/`, `catechismus/`,
`catechismus/compendium/`, `documenta/` and `preces/`, and the only re-exports
left are the eight under `[uilang=uilang]/`, which mount a landing page at a
second address on purpose. **Nothing outside the route tree changed** — no
consumer of the address grammar (`address.ts`, `route-manifest.ts`,
`shell-head.ts`, `worker.ts`, the sitemap) ever knew a directory name, which is
both why the mismatch survived a year and why removing it was safe.

```sh
cd site
npm run dev                                          # or npm run build
CORPUS_DIR=/path/to/glossa-corpus npm run dev        # corpus kept elsewhere
```

**The worktree trap shrank but did not vanish** (see the corpus section
above). The default is now `../../glossa-corpus`, resolved from `site/`, so a
worktree created _beside_ the main checkout finds the corpus without help. A
worktree anywhere else resolves to a `glossa-corpus` sibling that does not
exist, and the site then silently falls back to the test fixtures — two Bible
books and a few dozen paragraphs, which looks broken in a confusing way rather
than an obvious one. Set `CORPUS_DIR` there.

`npm test` always uses fixtures, never a synced corpus: `corpus.ts` checks
`import.meta.env.VITEST` explicitly. The absence of a `pretest` hook is _not_
what guarantees this — `prebuild` syncs and that directory persists, so on any
machine where a build has run the glob would otherwise pick up real data. The
fixtures deliberately contain absent chapters and out-of-range cross-references
to exercise the not-in-corpus paths.

**Don't drive the site with Playwright/browser automation to verify UI
changes.** The user does that verification themselves. Only reach for it in
very special cases (e.g. the user explicitly asks for an automated check) —
default to describing the change and letting them look at it in a real
browser.

## Deploying

Live at <https://glossacatholica.org>, on Cloudflare Workers static assets
(`site/wrangler.jsonc`; rationale in `docs/decisions.md`).

```sh
cd site
npm run deploy      # build -> preflight -> wrangler deploy
```

- **`npm run deploy` is the whole thing.** It builds (which syncs the corpus),
  runs `scripts/preflight-deploy.mjs`, and only then uploads. Running
  `wrangler deploy` by hand skips both and ships whatever is already in
  `build/` — it has no idea whether that is current, or whether it came from
  the real corpus or the fixtures. There is no CI build; a deploy ships one
  person's working tree.
- **From a worktree that is not beside the main checkout, set `CORPUS_DIR`**
  the same way `npm run build` needs it above. Preflight refuses a
  fixture-sized build, so the worst case there is a refusal rather than a
  two-book site going live.
- **Deploys are not sandboxed** — `wrangler` needs the Cloudflare API, which the
  sandbox blocks. Same for `git commit` (GPG).
- **The file count is no longer the thing to watch.** Cloudflare still caps a
  deployment at 20,000 files, but the SPA-shell build is **8,241 files**, of
  which exactly two are HTML (`index.html` and the offline fallback) — down
  from ~5,700 HTML pages when every unit had its own (`docs/decisions.md`,
  2026-08-18). It read ~2,910 here until 2026-08-29; the corpus tripled it, not
  the app, and `npm run preflight` prints the real number and its share of the
  cap on every deploy. Read that line rather than this one. The bulk is now immutable, content-hashed corpus JSON, which
  Wrangler dedupes by content hash, so a redeploy that changes no corpus data
  uploads very little.
- **What IS worth watching is `run_worker_first` in `wrangler.jsonc`.** It must
  stay a list of navigation patterns with `!` negations for everything static.
  As the boolean `true` it was until 2026-08-25, every request — every corpus
  chunk, every font — is a billed Worker invocation, and past the free plan's
  100,000/day the platform answers **429 instead of serving the asset**, so the
  whole site goes dark until 00:00 UTC. A cold visitor filling the offline
  library was ~2,240 invocations, i.e. about fifty readers a day. Anything new
  added to `static/` still works if it is not negated there; it just silently
  costs an invocation per request. **What each layer of that actually costs is
  priced in `docs/decisions.md` §The site** (2026-08-29) — the free plan's
  ceilings against the paid plan's, why subrequests and static assets are free,
  why Workers Cache stays off, and the prerender option that would take
  navigations off the meter entirely. Read it before optimising anything here by
  guess.
- **Preflight checks the corpus, not the page count.** `preflight-deploy.mjs`
  reads `corpus-routes.json` and refuses a build reporting fewer than 100 works
  or 100 content assets — that is what catches a fixture-backed build. The old
  minimum-HTML-count guard would reject a correct SPA build.
- **Preflight also refuses a build whose reference coverage dropped.** The
  sync measures how much of the corpus's citation apparatus the grammar reads
  (`scripts/reference-coverage.mjs`, printed as a per-family table on every
  sync) and preflight compares the shipped report against the committed
  `scripts/reference-coverage.baseline.json`: more than a 3% fall in any
  family's linkable citations, prose scripture references or stored references
  is a refusal. That is deliberate — every grammar regression so far was
  silent. If the drop is intended (a work withdrawn, a rule tightened on
  purpose), `npm run coverage:accept` records the new floor and the diff shows
  it. `REFERENCE_COVERAGE=verbose npm run sync-corpus` prints what the grammar
  recognized nothing in, which is where coverage work starts.

- **`postbuild` minifies the built HTML and then refuses a build that still
  ships a comment.** `src/app.html` is the most heavily commented file in
  the repository AND the one document served at every address, so its notes were
  7,383 bytes of `index.html`'s 15,063 (49%) on every cold visit;
  `scripts/minify-build.mjs` removes them from `build/` and leaves `src/`
  alone. **Nothing upstream does this and nothing will**: SvelteKit does not
  minify HTML at all (`build.minify` covers only what Vite itself emits;
  sveltejs/kit#568 has been open since 2021), and no Vite hook even sees the
  file — `adapter-static` writes `index.html` in the adapt phase, long after
  `transformIndexHtml`, and `offline.html` is copied verbatim out of `static/`.
  So a postbuild pass is the shape, and `html-minifier-terser` is the engine
  every wrapper in the ecosystem uses under the hood. Do not reach for
  `sveltekit-html-minifier`: its `adapt` loops over `builder.prerendered.pages`,
  and with `prerender.entries: []` this build has none — `index.html` is the
  adapter FALLBACK — so it would minify nothing here, silently.
- **The pass read HTML as one syntax for as long as it existed, and that hid
  the larger half.** It stripped `<!--` comments and deliberately stepped around
  `<script>`/`<style>`, since `<!--` opens nothing in JavaScript and reaching in
  would truncate the app. True, and the wrong conclusion: the boot script is
  where most of `app.html`'s commentary lives, so `index.html` went on shipping
  3,916 bytes of inline JavaScript at authoring width — 48% of the document —
  and the audit could not see it either, because it read `.html` as markup and
  `.js` as a program and had no notion that a `.html` file CONTAINS a program.
  Fixed 2026-08-28 by handing the parse to the dep and teaching `commentsIn` to
  read a page as the two or three syntaxes it is. `index.html` 16,260 → 5,020
  bytes, `offline.html` 2,968 → 1,618.
- The audit half exists because `vite.config.ts` names no `minify`, so that is
  a default rather than a promise. **It is a scan and not a
  re-minify-and-compare**, which would be tautological — drop `minifyJS` and
  unminified output is still a fixed point of the same options. It scans
  HTML, JS, CSS and XML and **deliberately not JSON**, though
  the evidence first given for that was wrong and is worth knowing about: 87
  built corpus files carried a bare `<!--` said to be stored document text, and
  on 2026-08-28 all 87 turned out to be one parser defect — every one the LAST
  footnote of its unit, where the region runs to the end of the page and
  vatican.va closes its body with `<!-- /TESTO -->`, so the region ended between
  the `<!--` and its `>`. A closed comment was already removed as a side effect
  of matching `<`-to-`>`; a comment cut in half survived every rule. Fixed in
  `strip_tags`. The scan still skips JSON, because a source page may one day
  print a comment marker as text and refusing a build over it is the wrong
  failure — but nothing in the corpus does today. A vendor licence banner is
  the realistic first failure; keep it and record it in the script's `ALLOWED`
  rather than deleting a copyright notice to quiet a build. `robots.txt`,
  `.well-known/security.txt`, the `fonts/OFL-*.txt` licences and `_headers`
  keep their comments on purpose — in each the comment is the file's substance,
  and `_headers` is never served at all.

## `/documenta` filters, and the one editorial file behind them

Replaced the pontificate table of contents on 2026-08-31 (`docs/decisions.md` §The site).
272 documents is past what a list of anchors helps with, so the aside is now a **search box
over a facet panel** — author, kind and subject — and the list is flat and
reverse-chronological. What follows will bite before the design will.

- **Author and kind ADD, subject SUBTRACTS, and that asymmetry is the field's arity.**
  A document has exactly one author and exactly one kind, so AND-ing two of either is an
  empty list by construction and a second choice can only mean "and these as well". A
  document carries three subjects on average, so a second subject has the other reading
  available — the documents about BOTH — and that is what narrowing 272 titles asks for.
  **Two consequences, and both are the parts that break if someone flips the predicate
  back**: the subject counts are taken against the FULLY filtered set, itself included,
  so a term's number is exactly what survives the click (the other two exclude themselves,
  or every unselected author would read 0); and `liveTags` drops the terms that reach 0
  rather than greying them, because one selection zeroes most of a 58-term vocabulary. That
  pruning matters MORE now the facet is a cloud: a dead term has no weight to draw, so it
  would render at the floor size and read as the smallest live term — a chip that looks
  available and does nothing. A selected term is always live, so filtering can never make a
  filter unreachable.
- **The author facet's years come from `src/lib/pontificates.ts`, a TABLE.** Deriving the
  span from the documents is the obvious shortcut and is wrong in a way that looks right —
  first and last `promulgated` gives Leo XIII 1878–1902 and Benedict XV 1914–1921, short at
  the end by the years each wrote nothing this corpus holds. The corpus is what CHECKS the
  table instead: every author's document span falls inside its reign. `to: null` is the
  reigning pope and renders as a trailing en dash, deliberately not the word "present",
  which would be a chrome string in thirty-four dictionaries. The lookup is `Object.hasOwn`
  because the key is corpus data, and an unknown name gets no years rather than a guess.
  `Facet.note` is the generic slot it renders through; only this facet fills one.
- **The search reads a document's WHOLE metadata** — title, author, kind, description,
  tags — and is AND-ed with the three facets. It sits at the head of the panel because it
  is the coarse instrument, and because it is what makes the small subject vocabulary
  safe (below).
- **Matching and marking are one function, in `src/lib/highlight.ts`.** `matchesQuery`
  and `highlight` share a fold and the same `occurrences` tiers, so a row is on the list
  exactly when the highlighter has something to draw on it. Write a matcher separately
  and it drifts within a week, in the direction only a reader notices: a result with no
  visible reason for being there. `highlight` was already the jump box's; `matchesQuery`
  is new beside it, and AND-s its tokens where `highlight` ORs them (marking is generous,
  filtering is strict). A test pins the agreement.
- **`site/document-tags.json` is the subject vocabulary and it is CLOSED** — 58 terms in
  its own `vocabulary` array, keyed by document SLUG rather than work id (a tag is about
  the document; every edition of Rerum Novarum is about labour — the one difference from
  `descriptions.json` beside it). `sync-corpus.mjs` **exits 1** on a tag outside the list,
  on a slug naming no document in the build, on two terms differing only in case, and on
  an empty or padded tag. A term on no document is a warning only. A missing FILE is fine;
  the page then offers no subject facet.
- **It was OPEN and 232 terms wide for one day, and both ends of that were useless.** The
  tail was 46 terms on one document apiece; a facet row that narrows 272 documents to one
  is a worse way of reaching it than its title. The head held words that partition
  nothing — `centenary` and `anniversary` say what OCCASIONED a document, `Vatican II` and
  `synod` restate the author and kind facets above them. **35 region names went too**, and
  that was the closest call: they are dropped from the FACET and not from the site,
  because every one of them is in the description the search box reads. Read the facet as
  the axes worth BROWSING and the search as everything else.
- **A second head cut took `errors condemned` (37) and kept `Church and State` (42), and the
  test that separated them was not frequency.** A term is too generic when it names what a
  document DOES rather than what it is about — the `centenary` failure. Nearly every
  magisterial text rejects something, so `errors condemned` had reached `spe-salvi`,
  `mysterium`, `providentissimus-deus` and `fratelli-tutti` alongside `pascendi`, and its
  co-occurrence was FLAT across the whole vocabulary (nothing above 8, spread over theology,
  saints, family, Christology, social doctrine). That flatness is the signature to look for:
  a real subject concentrates, and this one does — `persecution` 13, `education` 10, half of
  `religious liberty` — because its 42 are one question asked across seventy years, and the
  anti-error documents keep the error they actually name (`Freemasonry`, `communism`,
  `socialism`, `Thomism`). **Size alone condemns nothing now that subjects subtract**: a
  broad term is the best first click, meeting `education` at 10 documents and `marriage` at
  5, which is exactly what the old additive semantics could not do.
- **What replaced `errors condemned` is the errors themselves**, which is the same shape
  `communism`, `socialism` and `Freemasonry` already had: `rationalism` (6), `naturalism`
  (5), `modernism` (4), `atheism` (4), `materialism` (3), derived from the English
  descriptions and then READ. They fill a real hole — `pascendi-dominici-gregis` carried
  philosophy, seminaries, Scripture and Thomism and nothing naming Modernism — and they
  barely overlap, 22 assignments over 17 documents with a largest pairwise intersection of 2. **The half worth remembering is what failed.** The ANCIENT heresies are not subjects
  here: Arianism, Americanism, Jansenism, Gallicanism, Manichaeism, Donatism, pantheism and
  positivism score ZERO across 263 descriptions, and Pelagianism, Nestorianism and
  Monophysitism one or two apiece — always inside a document commemorating the Father who
  fought them, where the subject is the saint. This corpus runs Leo XIII to Francis.
  `gnosticism` scored 3 and is 1 (the other two are the string `agnosticism`), and
  `secularism` scored 5 and is 2. **Counting a word proposes a candidate; reading the
  sentence is what decides it** — the `Пар.` lesson, in another family.
- **Merging a term into another is a semantic act, not a bookkeeping one**, and four of
  the first cut's merges were wrong in the same way: `technology` into `ecology` filed the
  AI encyclical under ecology, `devotion` into `saints` made the Holy Spirit encyclical a
  saint's letter, `preaching` into `priesthood` made Dei Verbum a document about the
  clergy, `consecration` into `Marian devotion` made the consecration to the Sacred Heart
  Marian. Each was defensible on the commonest document carrying the term and wrong on the
  rest. **Check the merge against every document it touches, not against the archetype.**
- **The subject facet is a CLOUD, and that is what retired the truncation.** 58 stacked rows
  is ~1,390px in a 17rem aside, so the list showed eighteen behind a "Show all"; flowing the
  terms inline and saying each one's weight with its size fits the whole vocabulary in ~480px.
  More than the truncated list took, far less than the full one, and the aside already
  scrolls. **Size follows the LIVE count**, so every click resizes every chip — the accepted
  cost, and alphabetical order is what pays it: widths move, the sequence never does, so a
  term stays findable by scanning. Three things will bite. The scale must **renormalise
  against the current extremes** (`src/lib/tag-cloud.ts`), because pinning it to the
  unfiltered 3–42 collapses the cloud to the floor the moment a filter narrows it — after one
  click the largest survivor may hold nine. The range is taken over **positive counts only**,
  since two selected terms sharing no document leave both at 0 and a zero minimum drags the
  floor down and inflates everything against it. And `CLOUD_SIZE_MAX` is the one constant to
  turn if the cloud reads badly — height barely responds to it, because chip count dominates,
  so it is a BALANCE knob and not a size one: at 0.95rem the average chip is 15.0px against the
  panel's own 15.3px body, so the cloud sits just under what surrounds it, and the heaviest
  subject reaches 17.1px. It was 1.15rem for an afternoon, which put the big terms above every
  author row and section heading beside them. **Shrink it from the top only** —
  `CLOUD_SIZE_MIN` is `--font-size-min` and the CSS clamps to that token, so lowering it does
  not render smaller, it flattens every term below the floor onto it, and 23 of the 58 hold
  nine documents or fewer.
- **COLOUR is the second channel, and it exists because the first one is capped.** A 1.27x size
  spread is not much to read across 58 terms, and widening it makes the cloud outgrow the panel
  — so the same `weight` also mixes the chip's colour from `--color-text-muted` up to
  `--color-text`. It costs no space. Two things about it: both channels come off ONE number, so
  they cannot disagree; and it mixes **between two tokens, never toward a literal black**,
  because in dark mode `--color-text` is the light one — toward black, a heavier term would
  have DISAPPEARED in half the themes.
- **The cloud chips carry NO border, and the row chips still do.** 58 outlined pills is 58
  boxes, and at that count the chrome is what the eye reads first — it competes with the words
  it is drawn around, which is the opposite of what a cloud is for. So the cloud rhymes with
  the facet ROWS above it instead (same hover ground, same solid accent when on), while
  `.doc-tag` keeps its outline, because three or four chips sitting inside a paragraph do need
  an edge to be picked out of it and 58 in a column do not. What the border was also doing is
  saying "this is a control", so the hover now has to: `:focus-visible` is the global outline
  in `base.css` and survives, but at rest an unbordered chip is a word.
- **The terms are NOT translated and render verbatim.** A closed list could carry an i18n
  key each, the way `document_kind` does in `document-labels.ts`, but that is 58 terms
  times however many dictionaries there are — near two thousand strings at the current
  count — and nobody has asked for them.
- **`DocumentFilters.svelte` is rendered TWICE on the page** — the aside above 80rem, a
  `<details>` above the list below it — which is why its options are `aria-pressed`
  buttons and not checkboxes, and why the search text is a PROP rather than local state.
  Two checkbox facets are two elements claiming one `id`, and two independent search
  boxes are one control that forgets what it was told when the viewport changes.

**The filters are deliberately not in the URL.** Nothing in this app reads or writes the
client-side URL, and `?auctor=` would be the first query string in a system whose sitemap,
route manifest, worker and usage beacon all model paths and nothing else. Adding it is a
change to four things, not one.

## The edge writes the head, from names and never from text

Added 2026-08-28 (`docs/decisions.md` §The site). `ssr = false` means one document
answers all ~6,000 addresses, so everything a consumer that does not render learns
comes from `src/worker.ts`, which now rewrites the shell's `<head>` per address.
Five things about it will bite before the design will.

**Eight pages take a language prefix and ~5,800 do not, and the line is not
cosmetic.** `CHROME_PATHS` in `route-manifest.ts` lists them — `/`,
`/scriptura`, `/catechismus`, `/documenta`, `/doctores`, `/doctores/summa`,
`/preces`, `/colophon` — and they are the pages whose every word IS the
interface, so the Portuguese one
is a different page rather than the same page relabelled. A reading address
names a citation, the same citation in every language, and takes no prefix:
`/pt/catechismus/330` is a 404 on purpose. Prefixing those would publish
`/hu/catechismus/330` and `/en/catechismus/330` as `hreflang` alternates of each
other while serving byte-identical English text through
`CONTENT_LANG_FALLBACK` — see `docs/decisions.md` §The site.

**A cluster is fifteen URLs, and the unprefixed one is not the English page.**
Fourteen prefixed plus the bare path, which is `x-default` because it
NEGOTIATES; `/en/doctores` exists separately because pinning English is not the
same as negotiating and happening to get it. Every member declares the whole
cluster including itself, and every member self-canonicalizes — a prefixed page
canonicalizing to the bare path asks to be de-indexed, which leaves a cluster of
one.

**The chrome heads are read out of the dictionaries, never written.**
`CHROME_KEYS` in `scripts/route-titles.mjs` names the keys, and every one of the
fourteen dictionaries has to carry all of them, so the cheap way to add a chrome
page is to find a key a translator has already written rather than commission
fourteen new strings. `chromeNames` deliberately does NOT fall back to English
the way `t()` does: a cluster whose Portuguese member is described in English is
the one failure an `hreflang` set is checked for, so a missing key fails the
sync instead. `/doctores` is the one page that could not reuse a key
(2026-08-28) and cost two new strings in fourteen languages — pick a name with
an established translation, or that number is fourteen inventions rather than
fourteen lookups.

**`UI_LANGS` lives in `src/lib/ui-langs.ts`, a plain module.** `i18n.svelte.ts`
constructs its store at module scope, so importing it reads `localStorage` and
instantiates `$state` — impossible in the Worker and in Node, and three
consumers now need `isUiLang` there (the edge, `route-manifest.ts`, the build
scripts). `i18n.svelte.ts` re-exports everything, so the old rule is unchanged:
use `isUiLang`/`UI_LANGS`, never a literal list. `src/params/uilang.ts` is the
SvelteKit matcher over it, and without a matcher `[uilang]` would swallow every
top-level path.

**Arriving at `/pt/...` persists Portuguese**, exactly as the switcher does
(`[uilang=uilang]/+layout.ts`). A reader who follows a shared link has their
stored choice changed, which is the cost; the alternative loses them on the
first click, because every link on the page is unprefixed. These are entry
points, not a parallel site — which is why nothing in the app has to build
prefixed hrefs.

**`static/route-titles.json` may hold NAMES and never TEXT.** It is the second
generated file the worker reads (`scripts/route-titles.mjs` builds it beside the
route manifest) and it carries book names, document titles with author and year,
prayer and Summa question titles, and the paragraph spans of every titled
division. That is the imprint of a work — the same class of fact `sitemap.xml`
already publishes an address for — and it is what keeps `wrangler.jsonc`'s
"never reads or transforms corpus text" true. A Catechism paragraph, a Compendium
answer or a verse would make a better search snippet and must not go in.

**Two files, because the failures differ.** `corpus-routes.json` decides the
STATUS and `route-titles.json` only the `<head>`, read through separate
module-global promises. Losing the second costs a name; losing the first would
cost the address. Merging them into one fetch would make a missing title table
able to take the site down, which is the wrong trade in an obvious direction.

**Three files since 2026-08-29, and the third is the one that may hold prose.**
`static/apparatus.json` (303 KB) carries the editorial description of each
magisterial document and the cross-reference apparatus; `src/lib/apparatus.ts`
declares it and `scripts/apparatus.mjs` builds it. It reads through a third
module-global promise for the reason that split the first two, one step further
along: losing it costs a description and some links on a page that still
resolves and still names itself.

- **It is the exception to "names, never text", and the exception is precise.**
  A description is prose written HERE, by reading a document — the one kind of
  running text on this site nobody else holds rights in, which is why `llms.txt`
  now offers it for quotation with attribution. The rule that stays absolute is
  the one it was really about: a Catechism paragraph, a Compendium answer or a
  verse belongs to its publisher and reaches the edge in neither file, ever.
- **The links are stored as bare numbers and slugs and named from
  `route-titles.json`.** Storing the names twice is how two tables come to
  disagree, and the second one is always the one nobody re-reads.
- **A budget per KIND of link, not one total.** Filling a single cap in source
  order gave Genesis 1 eight Catechism paragraphs and pushed out every document
  citing it — the page linked into one work and not the other, which is the
  opposite of what an apparatus is for. `PER_KIND` is exported from
  `apparatus.ts` and imported by the builder, because the two numbers existed
  separately for one afternoon (8 stored, 4 rendered) and half the table was
  shipped and parsed at the edge for nothing.
- **`static/works.json` (246 KB) is the other half and nothing here reads it.**
  305 works with title, languages, address space, publisher, rights and the
  publisher's own URL, built in the same pass, published because `llms.txt`
  points at it as the file to read instead of crawling ~6,000 addresses.

**`static/llms.txt` asks to be cited now, and used to ask not to be.** It said
"cite the source below rather than this address", which a compliant client obeys
— so the file was declining the one thing the site is for. It now draws the
distinction it was missing: **cite the publisher for the words, link here for the
locus**, because vatican.va addresses a document or a run of paragraphs and
`/catechismus/330` addresses the paragraph. It also documents the address grammar
in full, so a client can construct a citation URL without fetching anything, and
one paragraph records the reversal on purpose — a model trained on the old file
carries the old instruction. Keep the rights position exactly as strong when
editing it; what changed is where the citation points, not who owns the text.

**The structured data is attribution and NOT a rich result.** `headHtml` emits
one `@graph` — `BreadcrumbList`, `WebPage`, the unit, the work — and only the
breadcrumb has ever drawn anything in a result page. What the rest does is state
in a form a parser reads what the colophon states in prose: the publisher's name
and rights notice come off the corpus manifests, never off a constant here, and
this site appears nowhere in the work node. Two choices in it are deliberate and
both are tested: **one script and one graph**, because an `@id` reference
resolves only against nodes in the same page's graph, so a publisher defined once
on `/` would be a reference to nothing on the other ~6,000 addresses; and
**`isBasedOn` and never `sameAs`**, because `sameAs` asserts the two pages are the
same work, which concentrates authority on the publisher. No Wikidata ids and no
`inLanguage`: both would have been guesses, and a guessed imprint is worse than a
gap.

**None of this costs an invocation, and knowing why is what keeps it true.**
`env.ASSETS.fetch()` from inside the worker is a SUBREQUEST, not an invocation —
three of them on the first navigation an isolate serves and none on any after it,
now issued in one `Promise.all` with the shell. The two new files are negated in
`run_worker_first`, so a crawler fetching `works.json` reaches the asset binding
directly. What the third table does cost is CPU on that first navigation:
`apparatus.json` parses in ~1 ms against a 10 ms limit that the rewrite already
spent 6.56 ms of. That is the number to re-measure with `wrangler dev` if the
table grows, and the reason its size is worth caring about at all.

**`assertNamed` runs in the sync, not in vitest, and that is the point.** It
refuses a build where any address in `sitemapPaths` has no name of its own or
shares a title with another. The failure it catches is invisible everywhere a
person looks — the page titles itself at hydration, so a browser is always
right — and only consumers that never render see the gap, none of which reports
back. A new work kind ingested before `shell-head.ts` learns its name fails the
sync rather than shipping hundreds of pages called `Glossa Catholica`.

**`titles.ts` and `inline-html.ts` import each other WITH the `.ts` extension**,
like `route-manifest.ts` writes `./address.ts`, because `scripts/route-titles.mjs`
imports `displayTitle` to normalize a heading exactly as the page does and Node's
type-stripping loader will not resolve an extensionless relative specifier. Vite
resolves it either way. Tidying the extension away breaks `npm run sync-corpus`
with `ERR_MODULE_NOT_FOUND`, not the site, so nothing in the app notices.

**A new file in `static/` is precached for every reader unless a list refuses
it.** `sw-policy.ts` takes all of `files`, and `corpus-routes.json` (27 KB, edge
only) and `reference-coverage.json` (12 KB, preflight only) had ridden along
since the partition existed. `INFRASTRUCTURE_FILES` is the list for things served
over HTTP to our own infrastructure, beside `CRAWLER_FILES` for things served to
a stranger's machine. Every one of them also needs its `run_worker_first`
negation in `wrangler.jsonc`, or a crawler's fetch of it is a billed invocation.

**Two lists, and a file has to be put on one — saying it belongs there does
nothing.** This document asserted for a day that `route-titles.json` was in
`INFRASTRUCTURE_FILES`. It was not: it had its `wrangler.jsonc` negation, so it
cost no invocation, and it was precached into every reader's install all the
same — 78 KB of a table only the edge reads, in the list that exists because
adding it is what made the category worth naming. Fixed on 2026-08-29 with
`apparatus.json`, and `sw-policy.test.ts` now names all five files rather than
the two the list started with. **The negation and the precache list are separate
mistakes with separate symptoms**: miss the negation and it costs invocations,
miss the list and it costs every reader bandwidth, and neither failure says
anything.

**Fonts are precached by SCRIPT, not wholesale, and the two halves of that
answer live in different files.** `fonts.css` says declaring a `unicode-range`
subset is "close to free" because a browser fetches a face only when a
character in its range is on the page. True over HTTP, and false the moment the
service worker installed: everything in `static/` a list did not refuse was
downloaded whole, so **every reader took all 1,118 KB of woff2** — 413 KB of it
Amiri, 315 KB the two `latin-ext` subsets — including the English reader who
will never render an Arabic character or a Polish one. Fixed 2026-08-31.
`DEFERRED_FONTS` in `sw-policy.ts` puts every face but the core Latin four in
the CONTENT tier, where the browser's own laziness survives — fetched on
demand, stored on first read, outliving deploys. **The precache drops to 157 KB,
an 86% cut.** Four things about it:

- **On demand is not enough on its own**, which is why `fontsForLangs` exists.
  A reader who fills the offline library and then loses the network needs the
  faces for what they downloaded, and a font nobody has rendered yet has never
  been fetched. Every message the client sends the worker already carries
  `contentLangChain(readerLang())` — the worker cannot read `localStorage` —
  so it warms exactly the scripts the reader's own languages need. Arabic adds
  back 413 KB, the `latin-ext` languages 315, the Cyrillic ones 160,
  Vietnamese 21, Hebrew 13, and English, Italian, Spanish, Portuguese, German,
  French, Dutch, Danish, Finnish, Swedish, Indonesian, Tagalog and Swahili
  nothing at all.
- **`greek` is the bucket no language claims, and that is correct.** Greek here
  is an APPARATUS script — a patristic quotation inside an edition in some
  other language — so no reader's language predicts it. It stays purely on
  demand, and the cost of being wrong is one quotation in a fallback face, once,
  for a reader who met their first Greek while offline.
- **`la` IS ABSENT FROM THE TABLE, and the reason generalises: a language in the
  universal tail cannot be given a script.** `en` and `la` end every row in
  `CONTENT_LANG_FALLBACK`, so both are in every reader's chain by construction —
  and `la` was in the font table for one commit, which meant every reader on
  earth warmed 315 KB of `latin-ext` and the whole partition bought nothing for
  eighteen of the thirty-four languages. It was there for `ǽ` (U+01FD), 19
  glyphs in Latin liturgical text; an English reader's automatic fill takes 28
  KB of Latin, so it was eleven times the font of the content it set. Measured
  after removing it: **18 of 34 languages warm nothing at all** and stay at the
  157 KB precache, and the worst case is Belarusian at 632 KB — its own Cyrillic
  plus the `latin-ext` its Polish neighbour row pulls in, which is the only
  place one fallback row moves a second script onto a reader.
- **`ig` takes the `vietnamese` subset and not `latin-ext`**, which looks like a
  typo and is not: Igbo's dots-below vowels are `ị ọ ụ` (U+1ECB, U+1ECD,
  U+1EE5), in Latin Extended Additional, which the subsetter files under
  `vietnamese` (U+1EA0-1EF9). `latin-ext` does not reach them. And `la` takes
  `latin-ext` for `ǽ`, which Latin liturgical text prints 19 times here.
- **A face matching no bucket is PRECACHED**, silently, exactly as before — the
  safe direction, and the quiet one. `sw-policy.test.ts` reads the real
  `static/fonts/` directory rather than a fixture list for that reason: a
  fixture cannot notice a file nobody told it about. `CORE_FONTS` matches
  `-latin-wght-` with the trailing hyphen, and dropping it silently restores
  the old behaviour by matching `-latin-ext-wght-` too.

**The reading routes' own `<svelte:head>` titles have to match the shapes in
`shell-head.ts`**, in the reader's language — the edge writes one title and the
route assigns another at hydration, and a mismatch is a visible rearrangement on
every load. Two were wrong rather than merely different until 2026-08-28: the
Bible chapter route suffixed with the EDITION's short title at an address that is
deliberately edition-free, and the Summa question route suffixed with the work's
name where every other route names the site.

**Existence is a property of the URL, and the worker must never read a request
header to decide it.** That rule has been broken twice in the same predicate,
and each time every canonical address in the corpus answered 404 to a client
that was not a browser. `isNavigation` required `GET` until 2026-08-28, so a
HEAD fell through to the asset binding — which has no file at any reader address
— and every address answered 404 to the HEAD of a URL it answered 200 to on GET.
It then required `Accept: text/html` until 2026-08-29, so `curl` with no flags,
several crawlers and whatever Google fetches with got a real 404 at every path
except `/` — the one path this build does emit a file for, which is why it
surfaced in Search Console as `/scriptura` and `/documenta` "not found" while
`/` was fine, and read as a routing problem rather than a header one. The
predicate is now three: `isPageMethod` (GET or HEAD) gates the worker,
**`isCanonicalPath` alone decides the status**, and `wantsHtml` is consulted
only to settle what a path naming NO address gets — the app's own 404 UI for a
client that wanted a page, the asset binding's answer for one that wanted a
file, which is what keeps an un-negated file in `static/` served rather than
404ed. A browser always sends both a GET and an `Accept`, so neither bug is
reachable by hand; check the edge with `curl` and no headers at all.

## Usage measurement: one beacon, three dashboard rules, and a shared vocabulary

Added 2026-08-27 (`docs/decisions.md` §Usage measurement). The site now counts
how it is used — first-party, bucketed, with no identifier. Four things about
it will bite before the design will.

**`/a` must stay OUT of `run_worker_first`'s negation list.** It is the one
path besides navigations that the worker has to answer itself, and it is
covered by the leading `/*`. Negating it (the reflex, since everything else
static is negated) does not fail loudly — the worker simply never sees a
beacon and the tables stay empty.

**`usage-schema.ts` is ONE module read by both ends on purpose.** The client
fills a payload from it and `src/worker.ts` validates against it, and the whole
defence of an open POST endpoint is that the two vocabularies are literally the
same object. Splitting it into "a client copy and a worker copy" drifts, and
the failure is silent in the worst direction: the page keeps sending a bucket
the worker has started dropping, and the metric reads zero rather than erroring.

**Three rules live in the Cloudflare dashboard and nothing here can assert
them** — a custom rule guarding `/a`, the zone's single (already-spent) rate
limiting rule which happens to cover it, and the kill switch. All three are
written out in `docs/decisions.md` §Usage measurement, which is their only
record. The free plan allows five custom rules and exactly one rate limiting
rule; that is why the write ceiling is a counter in `usage-store.ts` rather
than a second rate limit.

**Retention is a cron, and `--prune` is not it.** `scheduled()` in
`src/worker.ts` drops rows past `RETENTION_DAYS` daily, on the trigger in
`wrangler.jsonc`. `npm run usage -- --prune` forces the same thing by hand. The
script duplicates the constant because it runs in plain Node and cannot import
the `.ts`; `usage-report.test.ts` asserts the two agree, and a drift there
silently deletes data the stated policy says to keep. Note the two retention
numbers are NOT the same and are not meant to be — 365 on the device
(`RECORD_MAX_DAYS`), 400 in D1 (`RETENTION_DAYS`).

**`npm run usage` needs a database whose schema a fresh clone has not
applied.**

```sh
cd site
npx wrangler d1 migrations apply glossa-usage --remote     # once
npm run usage -- --days 30
```

The database exists and `wrangler.jsonc` carries its real `database_id` — it
was a `REPLACE_WITH_ID_FROM_WRANGLER_D1_CREATE` placeholder until 2026-08-28,
and while it was, the deployed worker dropped every beacon it received. The
binding is optional in `src/worker.ts`, so a deploy without it serves the site
normally and drops beacons — right for a statistic, the reason a missing
database is not a build error, and the reason nothing reported the loss. What
says the measurement is live is `npm run usage` returning rows; "no sessions
recorded" reads the same whether nobody visited or nothing was ever written.

**The device record expires after a year and that number is load-bearing in two
directions** — see `RECORD_MAX_DAYS`. Shortening it is not free (it inflates the
`new` bucket, worst for infrequent readers, who are the readers the measurement
is least able to judge); lengthening it walks away from the retention
proportionality the ANPD cookie guide asks for. The governing law is the
**LGPD**, not the GDPR/ePrivacy pair the design was first argued against —
`docs/decisions.md` §Usage measurement says which argument answers which
regulator, and doubles as the legitimate-interest assessment. Change the number
only with both halves in view.

**The colophon's promise moved with the code, in fourteen dictionaries.**
`colophon.pointNoTracking` used to say "no analytics"; it now states what is
actually collected. Anything that changes what the beacon sends has to be
checked against that string, and the string is the reason the payload holds no
free text, no sequence and no passage-level position — see the "deliberately
not" list in `docs/decisions.md`.

## Sandbox quirks that waste time

- **`rm` is aliased to `trash`**, which cannot write `~/.local/share/Trash`
  under the sandbox. It does not fail — it hangs forever at ~80% CPU and leaks
  the process. Delete with `/usr/bin/rm`.
- **Sandboxed `ps` cannot see processes from other tool calls** — each runs in
  its own PID namespace, so a genuinely-alive background job reads as dead.
  Don't use `ps` or `os.kill(pid, 0)` to decide whether a long job is running;
  use a heartbeat file, or check with the sandbox disabled.
- `git commit` needs `~/.gnupg` for signing, which the sandbox blocks.

## Reference grammar: eleven book tables, prose as apparatus, and the oracle behind both

`site/src/lib/refs-grammar.ts` turns a stored citation string into links. It
is per **content language**, and until 2026-08-26 it had exactly two
configs — EN and PT — with `configFor` answering EN for everything else.
There are eleven now — `ar`, `de`, `en`, `es`, `fr`, `it`, `la`, `mg`, `pl`,
`pt`, `ru` — added in two passes on 2026-08-26: six for the Catechism
editions ingested that day, then `ar`, `pl` and `ru` when the prose scan
below measured what the English fallback was reading in them (nothing at
all — not one of their forms shares a surface with the English table).

**English was never a neutral default, and that is the point.** Falling back
to it did not merely under-link; it mis-read. `1 Joh 2,20` / `1 Io 2,20` /
`1 Jn 4,19` have no numbered form in the English table, so the bare
`Joh`/`Io`/`Jn` matched and **every First-John citation in three editions
resolved to the Gospel** — 120, 138 and 4. The German mirror prints `Job`
where it means `Joh` (73 times, an h/b confusion of its Word export), so those
linked to the book of Job. And `SC`, which the Portuguese table was split off
for, collides again: Sources chrétiennes in the Latin and Italian apparatus,
Sacrosanctum concilium in the German, Spanish and French, with `CA` doing the
same (Corpus apologetarum against Centesimus annus). The Latin edition's own
printed sigla table settles both.

**`scripts/book-forms-oracle.mjs` is where eight of the eleven tables came
from, and it is the tool to reach for next time.** Paragraph N is the same
paragraph in all eight editions, so a chapter:verse the EN/PT tables resolve is
the same reference the Italian edition prints beside its own abbreviation:
align on the locus, read the abbreviation off. `--derive` proposes a table with
vote counts; the default mode **checks** an existing one by reporting links
whose OSIS the other editions contradict. Read that as a count, not a list —
330 rows for German meant the wrong table was being applied, 18 means the
editions genuinely cite different verses (Sir 5:8 against Qo 5:9 at §2536).

**`--work` points it at any work published in more than one language**, which
is what derived Polish, Russian and Arabic: _Magnifica Humanitas_ is 245
sections that align exactly across nine editions, so
`--work encyclical.magnifica-humanitas --ref en,it` reads their forms off the
same way and then checks them (62 links apiece, none contested). The alignment
is not free for every family — a section number is not the same section in two
translations of an older encyclical (see "Work that spans languages") — so it
holds for a work translated from one text at one time, and for nothing else.

Two things it will keep proposing that are **not** books: patristic work
titles (`Sermo 241, 2`, `Enarratio in Psalmum 103, 4, 1`, `Ed. Leon. 4, 31`),
which shape exactly like a locator and name works the corpus deliberately does
not hold; and the `??`-flagged singletons, which are for reading, not pasting.

**Latin is the exception to "derived":** `BOOK_VARIANTS_LA` is the Latin
edition's own printed table (73 rows, via `ccc.la/abbreviations.json`), and
the oracle was run over it as a check — 53 rows corroborated in use, none
contradicted. That is two independent derivations agreeing, and it is why
Latin is the only table complete for books the Catechism never cites.

**A table answers for every work in its language, not just the Catechism.**
`la` also covers `summa.la`, `bible.clementina.la` and `prayer.common.la`;
`it` covers ten works. That is how `Gen.` (the Corpus Thomisticum's form) and
`Psalm.`/`Ephes.` (Pius XI's _Ecclesiam Dei_, in Italian) got in — each worth
one or two links, each found by scanning the non-Catechism works after the
Catechism-derived table was in place. Do that second scan.

**The oracle finds source defects too, and they belong in `corrections/`, not
in a hole in the table.** Three were filed on 2026-08-26 — German §330 citing
`Dtn 10,9-12` where all seven other editions read Daniel, Spanish §1867
keeping the French `Jc` for James where its own convention is `St`, Malagasy
§604 dropping the `1` from `1 Jo 4,19`. Each was a real link to the wrong
verse, and each was one edition against seven.

**The tables now have a second consumer, and it is the one a reader touches.**
`site/src/lib/suggest.ts` (the jump box's autocomplete) reads them through
`grammarSurface`, so editing a book table or a siglum table changes what the
box completes as well as what the page links — deliberately, since a form the
box completes and `parseRefs` then fails to resolve would offer an address that
does not exist. Two consequences worth knowing before you touch either:

- **The tables hold abbreviations, not names**, because the oracle derives
  them from citations and citations abbreviate. So a French reader completes
  `Jn 3` and not `Jean 3`, and the fix is not to hand-write the missing names
  — that is the maintenance `--derive` exists to avoid. A book's full name is
  matched only where an EDITION carries it (`bible.*`'s own `name`/`abbrevs`,
  the suggester's lower tier), which is why English, Portuguese and Latin
  complete full names and the other eleven do not.
- **`suggest()` takes its language as an argument**, never from the `i18n`
  store, and memoizes its book and title indexes per language. A test that
  switches language calls `resetSuggestCaches()`; the app never needs to.
- **Loose matching is injected and must stay that way.** `fuzzysort` is the
  site's only dependency besides the icon set, and `JumpBox` lazy-imports it on
  open and calls `setFuzzyRanker` — a static import in `suggest.ts` would put
  7.5 KB in the boot chunk of every route. If you add a caller, inject the same
  ranker with the same 0.3 threshold; the number is measured against this
  corpus (`docs/decisions.md`) and a different one silently changes what a
  reader is offered. `suggest()` with no ranker is the literal tiers alone,
  which is a supported state, not a broken one.

The five tags with **no** config (`hu`, `ro`, `sl`, `sv`, `en-gb`) fall to
English, and that is measured rather than assumed: the four Compendium-only
languages cite the Catechism by bare number, which needs no book table at all
and is already at 100%, and their prose prints no Scripture locator, so the
English table matched nothing rather than matching something wrong.
`scripts/reference-coverage.mjs` is what says when that stops being true —
and it did: `ar`, `pl` and `ru` were on that list until _Magnifica Humanitas_
landed a work in each of them.

## Running prose is an apparatus, not decoration

**Three of the eight Catechism editions print no footnotes at all** — German
brackets its references, French and Spanish parenthesize them — so everything
`parseRefs` reads elsewhere, `linkifyProse` has to read in the body text. That
is the whole reason its **document-siglum scan** (added 2026-08-26) is worth
3,624 references in those three editions against 82 in English.

**The counters that measure this scan do not render it, and for four days
that mattered.** `reference-coverage.mjs` and `build-xrefs.mjs` call
`linkifyProse` themselves, so the coverage table and the scripture index kept
counting references the page had stopped drawing (and, in the other direction,
the meter walked past `answer_blocks`, `question` and `notes` for as long as
the page did — it reads all three now, and `coverage:accept` recorded the
floor): the walk-the-markup refactor
(2026-08-22) gave `ProseBlocks`' new `html` branch `linkifyInline` and left its
`text_marked` branch returning nodes raw, and the CCC's 18,831 in-prose
references went undrawn until 2026-08-26 — total in German, French and Spanish,
which have no footnote apparatus to fall back on. The marker walk now lives in
`inline-html.ts` as `parseInlineMarked`, beside the `parseInlineHtml` it
parallels, so both branches read `linkifyInline(parse…(block), proseSegments)`
and both are unit-testable. There is no component test harness in this repo;
keeping renderable logic out of `.svelte` files is the only way it gets tested
at all.

**Three surfaces store plain strings, and all three were inert for the same
bad reason.** A Compendium answer, a Compendium question and an annotated
Bible edition's note carry no markup and no `⟦N⟧` tokens, and each was
rendered as text on the reasoning that a text with no footnote apparatus has
nothing to link — which is backwards, since those are precisely the texts
that print their locators in the sentence. 1,436 references in the ten
Compendium answers, 65 in the questions (eight questions quote a verse and
name it), 435 in Challoner's and Matos Soares's notes. `plainTextNodes` in
`inline-html.ts` is the third parser beside `parseInlineHtml` and
`parseInlineMarked`; it exists so that reaching for the wrong one is a
compile-time question rather than an accident that works.

**The Bible's VERSES are still not linkified, and must not be.** Scripture is
the text being read, not an apparatus over it — a locator-shaped phrase inside
a verse is prose. Only `Sidenote` linkifies, because only the note is
commentary.

**Adding the notes is what put `bible.douay-rheims.en` in `WORK_CONFIGS`.**
Challoner writes "2 Kings 24" for the census in 2 Samuel 24 and "2 Kings 5"
for David at Baal-perazim; two of his four Kings citations read into the wrong
book without the entry, and the evidence is in each note's own sentence. Matos
Soares was checked the same way and reads MODERN — "1Rs. 16, 34" is Jericho
rebuilt under Ahab, "2Rs. 20, 8-11" the sundial — so PT needs no entry.

**A siglum in prose must sit inside a bracket**, and that is a measurement
rather than a hunch: of the 3,712 siglum-shaped tokens those four editions
print in prose, 3,708 are inside a `(` or a `[`, and the four that are not are
one source defect repeated (an opening bracket lost in the mirror's markup).
Without the guard, every capitalised abbreviation in 383 works is a candidate.
It must also carry a locus; a siglum named in passing points at nothing.

**The one collision the whole corpus produces is `AA`.** CCEL doubles a
letter to pluralize, so the English Summa's "(AA 1,2)" is _articles_ 1 and 2 of
the question being read, not Apostolicam actuositatem. It anchors 300+ of those
itself and forgot three. The discriminator is the locus — a conciliar decree
cited in prose points at ONE section, and all 42 real uses of `AA` are a single
number — so `proseSiglumFalseLead` blocks the list form and keeps the rest.

**The same scan is how the book tables get their second pass.** Reading what
prose still resolves to nothing found 1,180 Douay-named references in
`summa.en` ("Mat. 7:6" 820 times, "Eccles.", "Ezech.", "Osee", "3 Kings"), 59
in the Portuguese encyclicals ("Êx", "Flp", "1 Tes", "Coel"), and two source
misprints now filed as corrections (`ccc.it-964-1gv-for-gv`,
`ccc.pt-371-ga-for-gn`). Run it after any table change; the residue is where
the next win is.

**English has two book-naming conventions and they collide on Kings, which
is why `RefsOpts` has a second axis.** The Douay tradition — the Septuagint's
four Βασιλειῶν by way of the Vulgate's four Regum, stated by
`bible.douay-rheims.en`'s own book names ("1 Kings (1 Samuel)", "3 Kings
(1 Kings)") — calls 1–2 Samuel the first two books of Kings. `3 Kings` and
`4 Kings` mean the same under both and always read; `1 Kings` and `2 Kings`
mean different books and **nothing in the citation string tells them apart —
only the work does**.

So `configFor` takes a work id as well as a language, and
`refs-grammar.ts`'s **`WORK_CONFIGS`** lists the works whose own text
contradicts their language's table. Modern is the default, because that is
what the corpus prints nearly everywhere (13 references in `ccc.en`, one
apiece in the Compendium and six encyclicals). Three works opt out, each
verified against the verse it actually names: `summa.en` (CCEL quotes
Douay-Rheims throughout — 38/17/37/30 across the four books), and
`encyclical.aeterni-patris.en` and `encyclical.diuturnum.en`, one reference
each. Two more print `III Kings`/`3 Kgs` and need no entry. None of the three
ever prints "Samuel", which is the corroboration.

**A work belongs in `WORK_CONFIGS` only when its references are measurably
read wrong without it**, and the evidence goes in the comment beside it — the
same standard `pipeline/corrections/` holds a source defect to. It is a short
list on purpose, not a second general axis.

**Every reading surface passes `work`, including the ones that need it
today's answer of "nothing".** `ProseBlocks`, `InlineProse`, `RefText`,
`CitationDisclosure`, `HeadingText`, `SummaDivisions` and `CompendiumQuestion`
all take it, and the CCC, Compendium, Summa and document routes all fill it
from `editions.current?.work.id` / `editions.secondaryWorkId`. The prayers
route is the one that does not — a prayer carries no work id where it renders
one, and no prayer work cites Kings at all. **The build side has to pass the
same work the page passes**, or the scripture index points at a different
verse from the link on it: `build-xrefs.mjs` threads it from `sync-corpus`'s
edition records, `reference-coverage.mjs` buckets per work rather than per
language for the same reason, and `book-forms-oracle.mjs` derives it from
`--work` so it does not report a contradiction of its own making.

**`prose.document` is the counter that guards the sigla scan.**
`reference-coverage.mjs` counts it per family and `preflight-deploy.mjs`
refuses a 3% drop, the same as prose scripture. A baseline written before the
counter existed compares as zero rather than as NaN.

## Work that spans languages

All three Bible editions, all eight CCC editions and all ten Compendium
editions cover the same canonical address space, and that symmetry is a free QA
oracle: when a document exists in two languages, their unit-number sets must
match, and any asymmetry is a defect. That check caught three parser bugs that
each looked internally plausible in one language alone. It does **not**
generalize to the encyclicals, where a missing translation is legitimate and
common (Leo XIII is ~17% translated into Portuguese) — there the rule is "when
both exist, they must agree".

**Where the address space is fixed, that oracle is vacuous, and it will not
tell you so.** The Compendium is questions 1–598 in every edition by
construction, so the unit-number sets can never disagree — and while it
reported symmetry, four English answers were missing their entire bulleted
enumeration, 16 items the parser walked past (`docs/decisions.md`,
2026-08-25). The CCC is 1–2865 by construction the same way.

**Compare the DIVISIONS instead, and it stops being vacuous.** The unit sets
cannot disagree, but the structure trees can, and that is where the CCC's
eight editions earned their keep on the day they landed (2026-08-26): English
had 59 in-brief divisions where Portuguese, German and Malagasy each had 81
and agreed on which. Twenty-one were a parser defect a year old, one was a
source omission now corrected, and the same pass recovered a Portuguese
sub-heading that had been swallowed since the first ingestion. It is a
three-line script over `structure.json` — collect nodes of a kind with their
paragraph spans, set-difference the editions — and nothing else in the corpus
sees it, because round-trip, coverage and balance are all per-unit and a
division is not a unit. **Read it directionally**: an edition doing something
the others do not, everywhere and consistently, is that edition; an edition
missing what the others all have, in scattered places, is the parser.

What sees loss _inside_ a unit is `audit.py balance`: per-unit text length
against the sibling edition, normalized by the pair's own median. Run it over
the CCC, the Compendium, the prayers and the Summa; it is deliberately not run
over the documents (a section number is not the same section in both editions
— `coverage` is the instrument there) or the Bible (Esther is versification
divergence, not loss). It reports and never fails.

**It scales quadratically, and that is what makes it worth running.** The
Compendium's ten editions are 45 pairs and the Catechism's eight are 28, so
`balance` now compares 75 pairs and 109,821 units. That all-pairs matrix is
what found the Swedish Compendium storing 39 of its answers as nothing but
their own reference line — its text sits outside any paragraph, so the block
walk never saw it, and against English alone the ratio would have read as one
more terse translation.

**Its first run over eight Catechism editions produced 375 outliers and three
defects**, and each was invisible to every other check because each was one
edition against seven (2026-08-26):

- Malagasy appended each page's entire footnote apparatus to that page's last
  paragraph — §975 stored at 13,680 characters against Portuguese's 197. Its
  notes live in `<div id="ftnN">` rather than in a `<p>`, so the block walk
  never matched them and the gap recovery swept them up.
- Latin did the same to §2330 (45x), for a different reason: that page prints
  its notes and then keeps going, with the pre-2018 text of §2267 as editorial
  matter, so a note run detected by walking back from the end found nothing.
- German and French both stored §103 as a seven-character fragment. The
  embedded-paragraph-start heuristic split a quotation at the "103" in
  "(Augustinus, Psal. 103,4, 1)" — a citation both editions print inline where
  the others footnote it.

375 outliers became 56. **Read the count, not the list**: what identified all
three was one edition sitting far outside a band the other seven agreed on,
and the remaining 56 are editions being editions.

**The Bible is the exception to reading asymmetry as a defect**, and adding the
Latin sharpened rather than blurred that. `bible.clementina.la` is the text
`bible.cpdv.en` was translated from, so where the three disagree about verse
shape the Latin is evidence, not a third opinion: it takes a side in all 31
chapters where EN and PT disagree (PT 25, EN 6, neither 0). Those disagreements
are **edition divergence, not defects** — see `docs/research/bible-edition-divergence.md`
for the four kinds and why calling them defects invites someone to "fix" a
faithful text.

**The interface languages are now a SUPERSET of the content languages** —
thirty-four tags against twenty-six, as of 2026-08-31. It was the other way
around for a year, and the flip is the thing to understand before touching
either list. `UI_LANGS` lives in `site/src/lib/ui-langs.ts` and `ContentLang`
in `types.ts` (use `isUiLang`/`UI_LANGS`, never a literal list — `app.html` and
`usage-schema.ts` each keep a copy by necessity and say so, and a test asserts
both against `UI_LANGS`).

**Still do not derive one from the other.** The lists equalized and separated
four times in eight days for their own reasons, and the rule survives the flip
— it just reads in the other direction now: an interface language is no longer
evidence that the corpus holds anything, and the next ingestion in a language
nobody has written a dictionary for separates them again from the other side.

**What the old list actually tracked was who had written a dictionary.** The
gap was never `mg` alone: TWELVE content languages had no chrome, and
Byelorussian had 31 editions against Swedish's one complete dictionary. Closing
it is what made the interface a superset. On top of that sit eight **reach
languages** — `tl zh ko id uk ig ml hi` — chosen by Catholic population rather
than by what has been ingested, because the Philippines is the third-largest
Catholic country in the world and Tagalog had no interface. A reader in one of
those gets their own chrome and English content through
`CONTENT_LANG_FALLBACK`; the alternative is not better content, it is the same
content behind a language they do not read.

**A dictionary need not be complete, so adding a language is not a promise of
245 strings.** `t()` falls back to English key by key. What the build actually
enforces is `CHROME_KEYS` (`scripts/route-titles.mjs`) — `assertNamed` throws
on an unnamed chrome page, because that breaks the `hreflang` cluster — and
`bible-groups.test.ts`, which demands all nine group names rather than
tolerating a partial set. The long colophon prose is deliberately omitted from
every new dictionary: it is the page explaining how carefully this site handles
other people's words, and a machine translation of it is the one page whose
form would contradict its content.

**TWENTY OF THE THIRTY-FOUR DICTIONARIES HAVE NEVER BEEN READ BY A NATIVE
SPEAKER**, and that is the single most important thing to know about them. Every
language added on 2026-08-31 was translated by an LLM in one sitting. The
exposure is bounded on purpose — each is ~45 chrome keys, not the full 245, and
the long colophon prose is omitted so it falls back to English — but bounded is
not the same as verified. Each dictionary states its own tier in its header:

- **Grounded**: `mg`'s core terms alone, read off `ccc.mg`'s own manifest and
  division headings (`Katesizin'ny Fiangonana Katôlika`, `Toko`, `Fizarana`,
  `Sampana`). The corpus is the authority for how a language's Catholic usage
  actually names things, and it is the first place to look when adding another.
- **Medium** (`fi lv sw vi be zh ko tl id uk`): conventional chrome vocabulary,
  likely right; the longer taglines are what to check first.
- **Low** (`he ig ml hi`, and `mg` outside its grounded terms): each is a
  minority or liturgically specific register where the obvious dictionary word
  is often not the one the Church uses. Malayalam is Syro-Malabar and
  Syro-Malankara usage; Hindi competes with better-known Hindu and Protestant
  words for the same concepts; Igbo carries dots below and tone that a generator
  drops silently.

**Deleting a doubtful string is a valid fix, and a better one than leaving it.**
`t()` falls back to English key by key, so a removed line renders in English
rather than breaking — which means correcting these needs no coordination and no
permission. The two keys that cannot simply be deleted are anything in
`CHROME_KEYS` and the nine `bible.group.*`; both fail the build instead.

**Adding a language means five places, and all five are guarded now.**
`ui-langs.ts` (plus `RTL_LANGS` if it is right to left), the dictionary itself,
`app.html`'s pre-paint copy, `usage-schema.ts`'s `UI_TAGS` — and the language's
own name, which was `LanguageMenu.svelte`'s `OPTIONS` array and **no test
guarded it**: a language missing there stayed reachable by URL and by
negotiation, so everything worked except that nobody could find it. It is
`UI_LANG_NAMES` in `menu-filter.ts` since 2026-09-01, a `Record<UiLang, string>`
— so an omission is a TYPE ERROR rather than a test someone has to write, which
is the cheapest guard there is and the reason the fix was to move the table
rather than to derive it. Deriving it from `LANGUAGE_NAMES` was the obvious
plan and is not possible: that table is keyed on CONTENT language and
deliberately does not name the eight reach tags. `menu-filter.test.ts` asserts
the two agree wherever both name a language. The dictionary file itself needs
no registration — `i18n.svelte.ts` globs the directory.

**THE TWO LANGUAGE PICKERS HAVE A SEARCH BOX, AND THE LANGUAGE MENU HAS A FOLD**
(2026-09-01). Thirty-four interface languages and up to twenty-four editions of a
work are both past what a list of rows serves, so `LanguageMenu`, `EditionMenu`
and `ComparisonEditionMenu` filter; `src/lib/menu-filter.ts` holds everything in
that which is not markup, and `.menu-filter`/`.menu-list`/`.menu-more` are in
`menus.css` beside `.edition-lang`, for the reason that rule records. Three
things about it.

- **Matching is `highlight.ts`'s `matchesQuery`, never a fresh one** — the rule
  `/documenta`'s search box already established. What it buys here is the FOLD,
  not the tiers: `Čeština` is reachable by typing `cestina` and `Tiếng Việt` by
  `tieng viet`, and a language whose name a reader cannot type is a language
  they can only scroll to. The third surface the box reads is
  `Intl.DisplayNames`, so an English reader finds German by typing "German" and
  a Portuguese one by typing "alemão" — the only one of the three that nobody
  here maintains, since a table of 34 names in 34 languages is 1,156 strings for
  a search box.
- **The fold's first tier is DERIVED FROM THE CORPUS**, not from an editorial
  list: the twelve languages this site holds the most editions in, which today
  is en, pt, la, de, es, fr, it, hu, pl, lv, be, ar. It needs no maintenance,
  and it puts the reach tier (`tl`, `zh`, `ko`, `id`, `ig`, `uk`, `ml`, `hi` —
  the languages the corpus holds nothing in) behind "+ more", which is honest
  rather than unkind: those readers are served English content either way, and
  `app.html` negotiates them into their own chrome before any module runs, so
  the menu is not how they arrive. Membership moves with the corpus; ORDER does
  not — it is always `UI_LANGS`'s, so a reader never has to re-find a language
  whose position they had learned.
- **Typing ignores the fold entirely**, and that is what makes the guess
  tolerable. A twelve-of-thirty-four guess is only cheap if being wrong costs
  three keystrokes; a filtered list that silently omitted matches below the fold
  would be the one failure neither half could recover from.

**A counterexample in a test will be overtaken.** Four tests used "a language
the interface does not have" as an assertion, spelled `mg`, then `sw`, then
`ko`. The interface grew into all three within a day. They are Icelandic and
Estonian now, and the comments say why: it can no longer be a content language
at all.

**THE FLIP HAS A COST AND IT SHIPPED AS A BLANK PAGE.** `/catechismus` and the
home page's Catechism section resolve through ONE language rather than one per
work — `content.catechismPairLang()`, so that a Hungarian reader gets their
Hungarian Compendium and no English Catechism beside it. It answered
`i18n.lang` outright, which is a language the pair may not exist in: with
neither `ccc.he` nor `compendium.he`, `columns` was empty, the tree was empty,
and `work` being undefined took the `ReadingBar` with it — **a blank page with
no edition menu on it**, which is the one shape a reader cannot recover from,
because the control that would let them pick a language is the control that is
missing. Twelve languages carry one of the two works and the interface has
thirty-four, so **twenty-two of them saw it**, `pl`, `ru` and `ar` included from
the day the method was written on 2026-08-28. It walks `contentLangChain` now,
which is what the rest of the corpus already resolves through, and it keeps the
reason the method exists: the chain stops at the reader's OWN language whenever
that language has either work. **The general lesson is the one the superset flip
makes routine** — an interface language is no longer evidence the corpus holds
anything, so any resolver that reads `i18n.lang` as a CONTENT language is now
wrong for two thirds of the list. `catechismPairLang` was the only one;
everything else already went through `editionInLang`.

**A content language that is not an interface language has exactly one place
to go wrong, and nothing checks it.** `LANGUAGE_NAMES` in `corpus.ts` names
each content language in its own language for the edition menu and the compare
columns; it is keyed on `ContentLang`, and an unnamed tag falls through to the
tag itself. So `ccc.mg` shipped offering itself as "mg" — the type union gained
the language, that table did not, and no build, test or type error saw it.
Adding a content language means adding a line there in the same commit. (That
class of failure is now rarer but not gone: the table is complete today, and
the reach languages are deliberately absent from it because they are not
content languages.)

**Coverage, not the count, is what decides whether a language belongs in
`UI_LANGS`** — and since 2026-08-31 the answer for a content language is always
yes. Russian remains the case pointing the other way: chrome since Magnifica
Humanitas, and a Compendium that exists only as a PDF nothing parses. Latin's
promotion deleted a special case rather than adding one: `content.svelte.ts`'s
`#stillApplies` used to keep an override forever when its language was not a UI
language, and now every override sleeps and wakes on the UI language it was
made under.

**Direction is a property of the text, not of the reader.** `<html dir>`
follows the interface language; content regions get theirs from the `lang`
they already declare, in `src/styles/direction.css` (imported last by
`app.css`, deliberately). **Both halves are hand-maintained lists and both
were wrong for Hebrew**: `direction.css` keyed RTL off a literal `[lang='ar']`,
so the two Hebrew editions shipped left-to-right, and `app.html`'s pre-paint
block said `l === 'ar'`, which would have painted the page the wrong way and
flipped it at hydration. Keep both in step with `RTL_LANGS`. The same file's
`--prose-char-advance` is a property of the SCRIPT and had the same shape of
bug — keyed to `ru` alone while 31 Byelorussian editions used the Latin
measure. Write CSS in
logical properties (`margin-inline-start`, not `margin-left`) — the stylesheet
is entirely logical and the components are now too.

Citations may use Hebrew or Vulgate versification. The corpus canonicalizes on
**Vulgate**; `site/src/lib/versification.ts` converts — the only implementation, since its Python twin went with `pipeline/build/` (see `docs/decisions.md` §Parsing). Note that a wrong
chapter does not fail an existence check — `Joel 3:1-5` resolves to real but
wrong text — so conversion is applied unconditionally for divergent books rather
than as a fallback.
