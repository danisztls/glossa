# pipeline/CLAUDE.md

Operational notes for the scrapers and the rebuild. The repo root's
`CLAUDE.md` holds the corpus-safety rules that apply before any of this
(where the corpus lives, what may be deleted, the ledgers); **`pipeline/docs/*.md`
holds the rationale** — `corpus`, `corrections`, `parsing`, `oracles`,
`languages` — with `docs/decisions.md` holding only posture, scope and
process.

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

**A PARSER FIX IS INVISIBLE UNTIL THE STAGE RUNS, and an A/B diff against a
scratch output directory is not that run.** `build/` is the only thing the site
reads (through `sync-corpus.mjs`), so a comparison written somewhere else
proves the fix and ships nothing — the Code's stranded colon and its Book I
correction were each confirmed by diff one day and each still on the page the
next. The loop that ends a parser change is `rebuild.py --only <stage>` **into
the real corpus** (`CORPUS_DIR` from a worktree — the default
`../glossa-corpus` resolves beside the WORKTREE and quietly finds nothing,
which `--list` shows as `0 works`), then `npm run sync-corpus`, then read the
change back out of `build/<work>/structure.json`.

**AND ANOTHER WORKTREE'S REBUILD WILL TAKE IT BACK OUT, which is the half that
makes the loop above insufficient.** `build/` is shared, `rebuild.py` with no
`--only` runs every stage, and every session runs it from ITS OWN checkout — so
a full rebuild launched from a branch that lacks your parser fix silently
re-parses the work with the older code and reverts the output. Measured
2026-09-03: `--only cic` landed the corrected titles at 09:04 and the
`prayers-basics` worktree's full rebuild overwrote them at 09:05:32, seventeen
seconds into a run this one knew nothing about. **The tell is
`corrections-applied.json`** — it came back `"applied": []` for a work with a
filed correction, which no run from this branch can produce. So: check for a
running `rebuild.py` (`pgrep -f pipeline/rebuild.py`, sandbox off — a sandboxed
`ps` sees its own namespace only) before the re-parse, verify AFTER the sync
rather than before, and expect the revert to keep happening until the parser
change is on the branch the other sessions build from.

**THE SECOND TELL IS A COVERAGE FALL IN A FAMILY YOUR BRANCH NEVER TOUCHED**,
and it is the one that misleads, because the report names a family rather than
a commit. Measured the same day, from the other side: a full rebuild launched
from a worktree twelve commits behind main re-parsed the whole corpus with the
older `vatican_docs.py` and `npm run sync-corpus` then refused the build over
`encyclical 15599 → 14726` and `exhortation 12030 → 11572` — in a branch whose
diff touches neither that scraper nor anything in its import closure. **The
import-closure argument is sound about a DIFF and says nothing about a
REBUILD**, which runs the whole checkout. The rebase alone restored both
numbers exactly, with no change to the baseline. So before reading a coverage
fall as a regression, ask whether this branch is current with the branch the
shared `build/` was last written from; `git log --oneline main ^HEAD` answers
in one line, and it is cheaper than the measurement it saves.

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
  vatican_docs.py    encyclicals, Vatican I, Vatican II, exhortations,
                     CDF/DDF. One scraper, four subcommands; three of
                     them are `INDEX_FAMILIES` rows over one runner and
                     `walk_vatican_i` is the one forked walk, its
                     docstring saying why.
  prayers.py
  liturgical_calendar.py   the General Roman Calendar, fetched from GCatholic
                     as an ORACLE. Writes nothing to `build/` and produces no
                     work: the site COMPUTES the calendar and this is what
                     proves it right. Its output is tracked in this repository,
                     not the corpus -- see below. NOT `calendar.py`: a script's
                     own directory leads `sys.path`, so that name shadowed the
                     STDLIB `calendar` for every sibling, and `common` imports
                     `http.client`, which imports `email`, which imports
                     `calendar` -- every other scraper died on a circular
                     import it had no part in (renamed 2026-09-04).
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
- **A citation correction needs a witness INSIDE the edition.**
  `find-gazette-siglum.py` proposes `AAS` -> `ASS` (the gazette renamed in 1909) only where the edition writes both sigla at pre-1909 citations, so its
  own correct uses are the evidence — Latin Lumen gentium prints both in ONE
  footnote. 36 entries filed for that document's la/en/es/sw; the 56 editions
  that write `AAS` uniformly are a practice, not a slip, and are refused
  (`--practice`). See §Corrections and overrides.
- **A defect proposer must read the page the parser reads**, which means
  applying already-filed corrections to the raw HTML first — `raw/` is never
  modified, so without that a second run finds the defect in the page, not in
  the parse, and refuses everything as unlocatable.
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
- **`pdf-only` is the one status that does not mean absent.** Editions that
  exist only as PDF, which nothing here reads — the **English _Amoris
  Laetitia_** among them, worth knowing before reading a hole in an English
  column as the source's fault. On the modern shell the evidence is a
  `/content/dam/` href whose language suffix matches the page, in the mirror's
  codes (Latin arrives as `_lt`).
- **A ledger cannot record what a regex never matched, and that is how
  seventeen editions went unrecorded for a week.** `_VATII_LINK_RE` requires
  `.html`, so the Vatican II index's Traditional Chinese PDFs — all sixteen
  documents, at `/chinese/concilio/vat-ii_{slug}_zh-t.pdf`, a path sharing
  nothing with the rest of the mirror — and the Hebrew _Dei Verbum_ were
  invisible to it. Nothing failed: the absence simply read as bare absence,
  which is indistinguishable from never having asked, and Hebrew looked
  complete because Nostra Aetate's IS html. `_VATII_PDF_LINK_RE` reads them
  off the same index now (§Languages). **The general form: a discovery regex
  narrowed to what the parser can read silently narrows what the LEDGER can
  know**, and the ledger's whole job is to tell a checked absence from an
  unchecked one.
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

## A new index-driven family is a table row, not a copied runner

`INDEX_FAMILIES` in `vatican_docs.py` (2026-09-03, `docs/decisions.md`
§Process). Three of the four subcommands — `phase1`, `vati`, `phase3` — are
`IndexFamily` rows driven by one `run_family`; they were three runners
measured 85–94% identical, and adding the CDF had meant editing four dispatch
sites and copying one, which a rebase then truncated at the tail two of them
shared.

- **The membership test is not similarity, it is that the family's index
  names every edition's URL.** A run is then fully determined before the first
  fetch: nothing per-document to derive, nothing to probe. `phase2` fails that
  test — per-pontificate discovery, URLs derived by substitution,
  `--offered-only` to avoid probing — and stays its own function. Do not fold
  it in.
- **The table carries what a family IS, never how its pages are read.** Index,
  titles, reading order, language-code spellings, `--lang` aliases. The two
  `family == "vati"` branches inside the parser are the counter-example and
  must stay branches: each says why the general rule reads Vatican I's pages
  _wrongly_ rather than badly, and a config flag cannot hold that.
- **Adding one**: a row here plus a `Stage` in `rebuild.py`. `url_lang_key`,
  `translation_url_for`, the lock's subcommand set and the subparsers all read
  the table.
- **Every `discover_*` returns `(refs, notes)`** — notes printed verbatim, a
  fatal failure being empty `refs` plus a note. Two used to return one error
  string instead, and that mismatch alone was what kept the three runners
  apart.
- **`--fetch-only` exits 0 before the baseline is judged**, for all three now.
  Nothing was parsed, so `report_run` would grade the corpus's standing state
  as this run's verdict — and `--accept-baseline` would write it. That is not
  hypothetical: it put 3,678 `fetch-failed` rows in the floor once.

## The First Vatican Council has a walk of its own, and had to

Ingested 2026-09-02 (`pipeline/docs/parsing.md`). Two
constitutions, Italian and Latin, four pages — vatican.va publishes no English
edition of either, recorded as `no-url` rather than left bare. The subcommand
is `vati` (its own, not a flag on `phase1`), and `walk_vatican_i` reads the
blocks the shared machinery hands it.

- **The general walk did not merely read this badly; it read it WRONGLY, and
  it said so in the language of a fix.** `Dei Filius` numbers only its canons
  and restarts at 1 in each of four groups (1–5, 1–4, 1–6, 1–3). Canon II.1
  arrives as `cand=1` against `last_n=5`, and `looks_like_number_typo(1, 6)`
  is TRUE — a same-length single-digit substitution — so the canon was
  silently renumbered §6 under an anomaly reading "single-digit typo,
  corrected". Groups III and IV, where the digits stop being the same length,
  fell through to the false-positive branch and were swept into the appendix
  one block per group, and the four doctrinal chapters were swallowed whole
  into §1. **A heuristic tuned to a misprint cannot tell a misprint from a
  restart**, because both look like a number going backwards; only knowing
  the document's shape separates them.
- **Everything before the walk is shared and everything after it is too** —
  shell sniffing, block extraction, masthead extraction, the footnote split,
  `narrow_html`, `build_manifest`, `validate_document`, the ledgers, the
  lock. `parse_document` takes a `family` and empties the block list; the
  appendix assembly that follows still runs. What is forked is the ~150 lines
  that decide what a block MEANS, and forking there is what keeps 1,700 other
  pages out of the blast radius.
- **The two constitutions do not share a page template with each other.**
  `Dei Filius` is on the modern `<div class="testo">` shell in both languages
  and `Pastor Aeternus` is on neither shell in either — same index, one
  directory apart. `find_content_start_old_shell` returns 0 for both Pastor
  Aeternus pages (it looks for the last `<hr>` before the first NUMBERED
  paragraph, and that document numbers nothing), so the whole page became the
  content region and `_gap_block` swept the `<head>`'s `<title>` and
  `printDiv()` script into the first block — the Italian edition parsed to a
  single 16,976-character unit with no structure at all. The fix is the inner
  wrapper all four pages DO share, `<div class="text parbase container
vaticanrichtext">`, which is exact where both shell rules are inference.
- **The mirrors of the two councils disagree with each other, on the same
  host.** `i-vatican-council` against `ii_vatican_council` — hyphen against
  underscore — and Latin is `la` on the First's mirror and `lt` on the
  Second's. Hence `VATI_LANG_FROM_URL` beside `VATII_LANG_FROM_URL` rather
  than one table: folding them would have sent every Latin request for
  _Dei Filius_ and _Pastor Aeternus_ to a URL that does not exist.
- **`CAPUT I` is not bold, and `is_full_bold` IS the heading detector.** The
  Latin editions print the label as a plain centred line with the bold subject
  beneath it, so all four chapters were lost in both — only the subject
  survived, and with it went the chapter numbering. `_vati_chapter_heading`
  takes both printed forms (two blocks in Latin, `Capitolo I - Title` in
  Italian) and resolves each through `match_label`, so the vocabulary stays in
  `DIVISIONS` where every other language's does.
- **The page says where its masthead ends, in words rather than in a rule.**
  Both constitutions close their address clause with the chancery formula for
  a perpetual act — `Ad perpetuam rei memoriam` / `A perpetua memoria` — and
  the text begins after it. Identity has nothing to work with here (only one
  of five centred blocks names the document, and none names the author,
  because the author is a council and the name printed is the Pope's), so the
  scan stopped after two and left three lines of formula to be read as the
  document's opening prose. `extract_document_header`'s `through` is the same
  deference it already gives a printed rule.
- **The canons are the sections, numbered 1..18 continuously, and each
  group's heading is anchored at its own first canon** (`before` 1, 6, 10,
  16). That is what recovers the printed address as a RANGE instead of
  fabricating it as a number: §6 is a number the edition never prints, and
  group II owning §§6–9 is how a reader gets back from it to the `II. 1` on
  the page. The chapters go to `appendix.json` with `position: "leading"`
  (`docs/corpus-schema.md`) — the field exists because the canons anathematize
  the denial of what the chapters teach, and an appendix renders after the
  sections.
- **The end of the canon run is the first unnumbered prose block after it.**
  Every canon is exactly one block ending `anathema sit`, with no unnumbered
  continuation anywhere between the group headings — measured on both
  editions — so an unnumbered block there is the closing address and nothing
  else. A numbered canon after that point is recorded as an anomaly rather
  than assumed away. The Italian prints `* * *` at that boundary, and the
  ornament has to OPEN the closing unit as it closes the canons: it did not
  for one iteration, and 1,790 characters of closing address joined the
  leading `Capitolo IV`.
- **The one note on either page is bibliographic, not textual.** A starred
  line under a rule of hyphens naming the printed edition transcribed — `ASS,
vol. V (1869-1870), pp. 481-493` for the Latin, Bellocchi's collection for
  the Italian, so the two languages name DIFFERENT printed sources. Neither
  constitution carries a footnote marker anywhere, so it resolves to no
  citation and goes to `manifest.notes` instead; without that it went out with
  the footnote region, and `find_footnote_region_start`'s last-`<hr>` fallback
  (page furniture, below the content) left both the rule and the note in the
  body as document text.

## The Dicastery for the Doctrine of the Faith: 25 documents chosen out of 239

`cdf.{slug}.{lang}`, `vatican_docs.py phase3` (2026-09-03, §The doctrinal
office). The fourth family that scraper carries and the first where the
SELECTION is a decision rather than an enumeration.

- **The index is complete; the corpus is what narrows it.** 239 documents,
  1962–2026, most of them notifications about one theologian's book, rescripts
  and procedural decrees. `CDF_DOCUMENTS` holds the 25 the corpus actually
  cites — measured, not judged: 1,121 of 119,321 citation strings name the
  Congregation or Holy Office, the 25 carry ~840 of them, and the
  notifications carry **zero** (fifteen searched by name). Re-run that
  measurement before growing the table; the numbers belong in the commit, not
  in the docblock.
- **`discover-cdf` is the census**, and it is where "what do we not have?"
  is answered — see below.
- **The corpus slug is assigned, not read off the filename.** This family
  names its files after the SUBJECT (`freedom-liberation` is _Libertatis
  Conscientia_, `eutanasia` is _Iura et Bona_), so `document_title`'s
  manufacture-from-slug is wrong here and `CDF_DOCUMENTS` carries slug, kind
  and title. Keyed by **(promulgation date, source slug)** — `homosexual-persons`
  is two different documents, 1986 and 1992.
- **`lt` is LATIN on this index and `lit` is Lithuanian** — 73 links against 5,
  and it prints `la` once as well. Third family to spring this trap
  (`catechism_lt`, `VATII_LANG_FROM_URL`) and the first with both readings
  live on one page, so a borrowed code map does not fail: it files 66 Latin
  editions as Lithuanian silently.
- **`lang_urls` is keyed by what the SOURCE calls the language**, the rule
  `MODERN_LANG_TO_URL` exists for, and breaking it fails the same invisible
  way: keying by the work tag left every German, Spanish, Latin and Portuguese
  edition reported `no-url` by a run that had just discovered its URL — 115
  pages fetched of 203.
- **`urljoin`, never a path prefix.** The index mixes three href shapes inside
  a single document's language list (relative `documents/…`, root-absolute
  `/documents/…`, and fully qualified). Requiring a leading `/` found 51
  documents where the page links 239 and reported "the index does not list it"
  for nineteen of the twenty-five — a wrong answer shaped exactly like a true
  one.
- **Do not read an index through a Markdown extractor.** One did, dropped half
  the page, and produced a confident finding that the Holy See's "Complete
  List" omits five major documents including the 2002 note on political life
  (96 citations, the second most-cited of the family). All five are on the
  page. `raw/` is what the scraper reads, so `raw/` is what an argument about
  the source has to be made from.

### Three page conventions, two of them corpus-wide bugs

- **Word writes `_edn`/`_ednref` for endnotes** where it writes `_ftn`/`_ftnref`
  for footnotes — same export, three letters different — and every regex here
  read only `_ftn`. 47 raw pages, only 10 of them CDF. Aliasing the two gave
  **39 works an apparatus they did not have**, _Caritas in Veritate_ in eight
  languages among them (0 → 159 citations each). `sacramentum-caritatis.ru`
  fell 275 → 256, which is the fix working: the page has exactly 256
  definitions and 256 references.
- **`find_bare_footnote_run_start`: a footnote list can announce itself only by
  the numbering RESTARTING.** Eight Polish editions print notes as `N.&nbsp;`
  with no heading, no anchor and no `<hr>` — the one label shape the existing
  run detector refuses, because it is also how every numbered paragraph opens.
  Two guards, neither optional: the run must be a restart (the first run of
  `N.` is the body, and taking it cuts every document at its own §1), and 90%
  of its numbers must already appear as inline markers above it. Measured over
  all 1,611 works this scraper owns: **16 changed, 0 regressed**, two of them
  pre-existing defects elsewhere (`nostra-aetate.he` 15 sections/0 resolved →
  5/15; `quas-primas.fr` stopped shipping its notes as ten extra sections).
- **`narrow_html` must drop what `strip_tags` drops.** `<!--` is not a tag to a
  regex needing a letter after `<`, so Word's `<!--[if !supportFootnotes]-->`
  survived narrowing as escaped text and came back through `html_to_text` as
  literal markup in the reader's prose. Fifteen editions, caught by the
  round-trip check.

### Judging a damaged edition needs a CONJUNCTIVE signature

Seven of 200 editions are withheld in `site/unpublished.json`, each with its
measurement. Two shapes, both cross-edition — text loss against the median
edition of the same document (`inter-insigniores.pl`: 4,855 characters against
32,092), and whole text under wrong addresses (`donum-vitae.it` and `.la` put
all of it in one section where every sibling captured nine; `donum-vitae.pl`
reads 51 footnotes as sections).

**"One section holds over half the text" is not a defect on its own.** A first
pass using that alone flagged all eight editions of _Iura et Bona_ and all
seven of _Samaritanus Bonus_ — documents with three and twelve long numbered
parts, where every edition agrees. The section COUNT has to have fallen too.

**Re-read that file when a parser changes.** Two Czech Vatican II editions were
switched off in August for a signature the parser no longer produces (9
sections with §1 at 59%/64%; now 44 and 130 sections, largest at 8% and 3%) and
nothing had re-measured them. The file says its entries are temporary; nothing
enforces it.

### What is NOT held, and the one command that says so

`uv run pipeline/scrapers/vatican_docs.py discover-cdf [--unselected]` — index
only, no document fetches. It prints the 25 held documents each annotated with
the editions the corpus does not take, then the count it does not hold at all;
`--unselected` names those too. **Derived rather than written down**: the index
gained six documents in 2025 alone, so a table of the residue in `docs/` would
be wrong by the next promulgation and nothing would re-read it.

Four kinds of gap, and they are four different decisions:

- **214 of 239 documents are not selected.** Not a backlog — `CDF_DOCUMENTS`
  holds what the corpus cites and these are what it does not. Re-run the
  citation measurement, not this list, before adding one.
- **Two editions are not fetched at all**: Dignitas Infinita's `zh_cn` and
  `zh_tw`, which the index links as HTML. Chinese has no `DIVISIONS` entry
  (`第一章` interleaves the numeral, `_NUMERAL` has no CJK digits), so a work
  tag would fetch two pages nothing can read. **The earlier claim that this
  index serves Chinese only as PDF is false** and was corrected where it was
  written.
- **Three editions are in `raw/` and not in `build/`**: the Lithuanian
  _Homosexualitatis Problema_, _Dominus Iesus_ and the 2002 note on political
  life. `lit` is mapped, so they were acquired; `lt` has no `DIVISIONS` entry,
  so they are not parsed. That split is the point of `--fetch-only`, and
  adding Lithuanian later costs a vocabulary entry and no requests.
- **Nine editions of seven documents exist only as PDF** (`cs` once, `nl`
  twice, `zh_cn`/`zh_tw` three times each). Nothing here reads PDF; the terms
  are the ones `ccc.py` set for Arabic and Chinese.

Plus the seven parsed editions withheld in `site/unpublished.json` above —
held, readable, and deliberately not published.

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

### A ceiling that only one edition needed is a defect in the others

`parse_page_en` refused an unbolded roman-numeral heading, because "`I.` et
al. are too easily mistaken for ordinary prose without the bold signal". True
of Portuguese, which the rule was written for; inherited by the IntraText
shell, where it cost **English 60 subdivisions and German 57** — among them
the seventh petition of the Our Father and `II THE CHURCH IS HOLY`, so the
English Catechism gave the Church three marks instead of four and nothing
said so.

**The count is what tells a ceiling from a defect.** Nodes whose title opens
on a roman numeral, 2026-09-03: es 272, fr 273, la 272, pt 272, mg 276, it
291, against en 214 and de 213. One-sided, so a parser defect by this file's
own rule (§Work that spans languages) — 274 and 270 after the fix.

**What replaces the bold signal is three measured guards**, each of which one
edition needs and the others do not, which is why they are a table and not a
rule: a 90-character cap (IntraText numbers every body paragraph, so prose
opens on a DIGIT); the period required for a ONE-character numeral only,
because `I` is the English pronoun and the book opens on it; and a title that
opens on a capital, a quote or an ellipsis, because French's period-optional
pattern otherwise reads two cells of the Creed table on `__P14.HTM` as
subdivisions. `docs/research/prayers-glossa.md` §6.2 holds the measurements.

## Prayers are CURATED, and this scraper's job is now to disagree with them

**`build/prayer.common.*` is not a parse** (2026-09-04, `docs/decisions.md`
§The curated prayers, `docs/corpus-schema.md` §Prayers). The corpus is
`<corpus>/oracles/prayers/*.json` — 35 files, 477 prayers, 20 editions, the
text as it should read with each editorial act recorded beside it.
`prayers_project.py` writes the work directories from it; everything below
still describes how the pages are READ, which is what the verifier does.

- **Two stages, and the split is the point.** `prayers-verify` runs
  `prayers.py --verify-curated`, reads every page and declares no outputs;
  `prayers` writes `prayer.*` and reads no page. The `outputs` partition stays
  exact and a failing check cannot take the reader's text down with it.
  Currently 363 (language, prayer) pairs, 0 unexplained departures.
- **A declared repair is not a defect.** The verifier reads the curated
  `flags`: a word missing from the page because a flag says it was repaired
  passes (`berlindung` is one word in the curation, `ber lindung` on the
  page); a word no flag accounts for fails. That is the guard against curation
  drifting into invention.
- **THE CURATION MUST NOT READ ITS OWN PROJECTION.** `curate.py` takes its
  witnesses from `build/`, which the projector writes — run in that order and
  every prayer agrees with itself. It refuses when a manifest says
  `"curated": true`. To re-curate:

      uv run pipeline/scrapers/prayers.py --write-parse /tmp/parse
      GLOSSA_PARSE_DIR=/tmp/parse uv run --no-project python run_all.py

  `--write-parse` is in no stage and writes the two DERIVED editions too —
  `la`, where the canonical Latin is read from, and `en-gb`. Without them the
  Latin resolves to nothing and the companion vanishes from every prayer.

- **`--changed-only` fingerprints `oracles/` too**, and did not until this
  landed: `shared_inputs()["corpus"]` hashed `raw/` alone, so a curated edit
  was invisible and the stage was skipped.

**EDITORIALISING MOVED THE CORPUS TOWARD THE SOURCE, NOT AWAY.** Every
editorial act so far undid damage done by a RENDERING rather than an editor:
fourteen transcriptions of one Latin collapsed to the text composed once; the
Veni Creator's quatrains recovered from pages printing 28 undivided lines;
`sæ´ culo`, `kami ber / lindung`, `och den / Helige Ande` closed, each a column
wrap inside a word or phrase. Sharpest: **both the Belarusian and Russian PDFs
print 28 lines and our own reader merged two**, so editing there recovered
what the page literally prints. What looks like fidelity is often fidelity to
an artifact of the copy.

- **The PDF appendix reader mis-reads VERSE as wrapped prose, structurally.**
  `carry = line.x1 >= region.measure(...) - MEASURE_TOL` calls a line reaching
  the measure a wrap, and `reach` is the column's 95th percentile — so in
  verse the longest metrical line reaches it BY CONSTRUCTION. Measured: the
  Belarusian's opening line is `x1=172.0` against p95 `152.0`, the Russian's
  `Во славе с Ним – Воскресший Сын.` is `575.0`, both the widest in their
  column, both swallowed the line beneath. The curated files restore them
  (`unmerge`); **the reader is deliberately unchanged**, because that rule
  serves four editions across verse AND justified prose (the Memorare must
  rejoin) and 27–47% of verse lines already sit within `MEASURE_TOL` — the
  obvious threshold is not obviously safe.
- **An `Amen.` on its own line is lineation, not metre.** Folding it onto the
  line before leaves Hungarian and Lithuanian at seven quatrains and Swedish
  at six. Only the Indonesian stays irregular, for a reason in the text: its
  sixth stanza is compressed into two long lines.

## Prayers: the Compendium's body is a source, and the Latin is the instrument

`prayer.common.{lang}` (`docs/corpus-schema.md` §Prayers). Every edition of
this work now carries the two Creeds, the Our Father and the Hail Mary —
eleven languages, up from three — and the eight that gained them cost **no
fetch**: the Compendium prints all three at the head of Part One Section Two
and Part Four Section Two, in the same file Appendix A is already read from,
and nothing had ever read that region.

- **The Latin is the anchor, the classifier and the check, and none of those
  three steps reads a word of the vernacular** — which is what makes the
  reader safe in eight languages nobody here is required to know. `Symbolum`
  and `Pater noster` are set in Latin script in every edition, so the region is
  bounded without a table of vernacular headings; each block is then scored
  against `ccc-la`'s own text (`latin_likeness`) to say whether it is Latin.
- **The four blocks are not in one order, and getting that wrong is silent.**
  German, Italian, Romanian and Slovenian interleave each Creed with its
  Latin; English, French, Spanish and Hungarian print both vernaculars and
  then both Latins. "The vernacular is the run before the Latin heading" files
  the Nicene Creed under `apostles-creed` in half the editions and yields a
  real creed under the wrong slug.
- **Score the whole text; never test an incipit.** Hungarian heads a block
  `Symbolum Apostolicum` and prints `Credo in unum Deum` under it — the Nicene
  incipit on the Apostles' Creed's body. An incipit test files it wrongly and
  reports nothing; a whole-text score puts it right and leaves the divergence
  to the report.
- **Four markup shapes, declared in `COMPENDIUM_BODY_SHAPE` per REGION rather
  than per edition**, because German sets its Creeds in a two-column table and
  its Our Father as paragraphs. Italian sets the entire Creed region inside one
  `<p>` divided only by its bold headings, which is why every paragraph is
  split on its bold runs before anything else looks at it.
- **The printed Latin is used and NOT stored.** It is a second transcription of
  what `prayer.common.la` already publishes, carrying its own misprints, so
  `NO_LATIN_SLUGS` does not move. What it buys instead is
  `print_body_latin_report`, run over all ten editions on every parse and
  **printed rather than gated**: a departure shared by many editions is a
  received variant (nine agree on `sedet ad dexteram Dei Patris` where `ccc-la`
  has no `Dei`; five on `quotidianum`), and one edition alone is a slip
  (`caeeli`, `proper`, `sedit`, `MaríaVírgine`, `et in incarnatus`). `Víirgine`
  is in en and it — one shared exemplar, not two witnesses, the same lesson
  `audit.py refs` records.

- **A TABLE ROW IS NOT A LINE, and only the source's `<br>` says where the
  lines are.** `build_creeds_pt` read the CCC's `#table2` one line per row,
  on a comment asserting the rows were lines; they are not — the table pairs
  the two Creeds SECTION for section so each stands level beside its
  counterpart, and the Latin Catechism sets the identical pair in eleven rows
  against Portuguese's seven, which settles that the row count is a fact about
  a page's layout. The collapse ran the Creed's clauses together with the
  semicolons as their only surviving trace, and `;` mid-line is the tell:
  eight in the Apostles' Creed, five in the Nicene, none in the Latin that
  already read the same table with `br_segments`. Fixed 2026-09-03, 7 lines →
  22 and 7 → 37. **`line_html`'s own test is what decides which kind of `<br>`
  a cell holds** — median 25 characters and 82% clause-final here, against
  22/80% for `ccc-la` — and French and Italian pass it the other way, printing
  their Creeds as running prose with no `<br>` at all. See
  `docs/research/prayers-glossa.md` §6.

- **A cross-language line count is not an oracle.** vatican.va typesets the same
  prayer differently per language, so the counts differ legitimately: the
  Compendium's Italian page prints the Pater as ten `<br>` lines and the French
  page prints the identical prayer as one paragraph, in the same document, the
  same year, the same appendix. Neither is damaged, and standardising the two
  would invent typography no one printed. Where a mismatch IS worth reading the
  raw over, the oracle is the Latin printed beside the prayer on the same page,
  not the other editions — checked by hand over all fourteen on 2026-09-03, and
  the six it turned up (fr, it×2, pt, ro×2, ru) were every one of them the
  source's own setting.

- **The fourteen Latin companions ARE one text, and folding them against each
  other is the oracle the line count could not be.** The appendix prints the
  same Latin beside every vernacular, so the columns are fourteen
  transcriptions of one exemplar rather than fourteen texts — fold away stress
  accents, the `ae`/`æ` ligature, case and punctuation and what is left is
  either one reading or a defect. Two things make it work where the line count
  failed: the subject is not written in any of the fourteen languages (the
  `audit.py refs` precondition), and the differences are separable into three
  kinds that want three different answers.
  - **House style is uniform per edition and carries no per-prayer
    information.** Measured 2026-09-03 over every prayer with a Latin
    companion: `de` prints it unaccented in 21 of 21, `ro` in 18 of 21 — and
    `ro`'s three exceptions are exactly the three canticles, which it sets
    with the chant pointing. `hu`, `ro` and `sv` never write `æ` at all. A
    rule that holds across a whole edition is not a reading.
  - **A slip is a non-word**: `luz` for `lux`, `Spirits` for `Spíritus`,
    `Sancii` for `Sancti`, `sieut` for `sicut`, `dorninica` for `dominica`
    (the `rn`→`m` of a page scan). `it` and `lt` share `sieut`, `eum`,
    `sanetitate` and `posi` — one exemplar, not two witnesses, the same
    lesson `audit.py refs` records.
  - **A variant is attested Latin**, and the two Gospel canticles have an
    oracle for it already in `build/`: the Magnificat is Luke 1:46–55 and the
    Benedictus 1:68–79, so `bible.clementina.la` says whether a reading is
    Latin at all. Every edition shares a 13–14 word residue (the Gloria Patri
    appended to each canticle); what stands ABOVE that residue is the
    corruption, and the Clementine clears `exultavit` (de/ru/sv) as its own
    spelling while convicting `ficit`, `mentis`, `onmium` and `ancillaesuae`.
    `genetrix`/`genitrix`, `eundem`/`eumdem`, `solacium`/`solatium`,
    `plebi`/`plebis suae` and the Vulgate's `salutari` against the
    Neo-Vulgate's `salvatore` are received variants and stay.

  **What it found that nothing per-edition could**, because within one edition
  each column is self-consistent: `prayer.common.fr` shipped the appendix's
  own section heading `A) PRIÈRES COMMUNES` as a second Latin block of the
  Eternal Rest (`FR_NOT_TITLES` denied it titlehood, and everything that is
  not a title joins the entry above it — which was the Latin _Requiem
  aeternam_; hence `FR_PAGE_FURNITURE`, which drops instead), and the French
  Latin Angelus was ONE block where its own vernacular is fourteen, because
  `build_prayers_fr` built the Latin as a flat run of `prose` while the
  vernacular went through `parse_simple_body` — the same page, the same
  prayer, the same printed `D.`/`C.`, read two ways. **Both columns of one
  page go through one reader.**

- **`&aelig;&acute;` is a corpus-wide defect that hid in a normalised field,
  and only French has it.** 18 occurrences, every one in the Latin companion,
  none corrected until 2026-09-03 — where the English page's single instance
  had been corrected by hand since August. It survived because every
  comparison that could have seen it folds orthography away first, which is
  exactly what makes an uncomposed accent invisible. Four of the eighteen also
  leave a SPACE inside the word (`qui a sæ´ culo sunt`), so the repair has to
  close two tokens into one — `_correct_lines` now permits a word-count change
  for a match holding no line break, since the separator-reuse argument that
  forbade it only ever bound a match that spans one. The Indonesian PDF splits
  the same word at the same point with an unrelated reader (MuPDF, so
  `_WORD_TOUCH` is not in play), which is what identifies the break as the
  shared exemplar's lost hyphen rather than either parser's doing.

### The four PDF editions: the same appendix, printed in two columns

`prayer.common.{be,id,lt,ru}` (2026-09-03). vatican.va publishes the
Compendium in fourteen languages and serves ten as HTML; the other four exist
only as a PDF made by the national bishops' conference that translated it, and
`ccc/compendium_pdf.py` already read the 598-question body out of all four. It
stops where this starts. **Every one of them is Appendix A entire plus the two
Creeds and the Our Father — 27 prayers, 24 for the Indonesian — and none of it
cost a fetch.** `rebuild.py --list` counts the works.

- **`compendium_pdf.PDF_EDITIONS` is IMPORTED, not mirrored** (unlike
  `COMPENDIUM_FILES`, which mirrors a table in a sibling _script_). It is a
  library, and which reader each file needs, which re-decode, which glyph its
  fonts fail to map and where its furniture ends are facts about those four
  files — as true of the appendix as of the body.
- **The appendix page is not the body page, so the body reader is not reused.**
  That one separates a cross-reference MARGIN from one column of text; this is
  parallel text, vernacular left and Latin right, each prayer opening with a
  heading on one baseline in both. What is shared is `common/pdf.py`.
- **The printed Latin is the anchor, the bound AND the check** — the same three
  jobs it does for the Compendium's body above, and for the same reason. The
  titles come off `prayer.common.en`'s own Latin column, so the anchors are
  read from the corpus rather than retyped into it; the columns being parallel,
  where a prayer's Latin stops its vernacular stops, which is what cuts
  twenty-four prayers apart with no vernacular string anywhere in the file.
- **THE RE-DECODE IS PER COLUMN, not per file.** The Russian's fonts carry no
  `ToUnicode`, and re-reading poppler's bytes as cp1251 is what recovers its
  Cyrillic — but the Latin column is not Cyrillic, and re-read it says `In
Nуmine Patris` for `In Nómine Patris`. `read_edition` cannot make this
  distinction and does not need to; the appendix reader applies `decode` to the
  left column alone.
- **A printed line that REACHES THE MEASURE is a wrap; one that stops short is
  a break the editor made.** It is the only signal a PDF carries for the
  difference and the appendix needs it both ways: the Memorare is justified
  prose that has to come back as one paragraph, the Ave Maria is set a clause
  to a line and has to keep every one. The measure is the column's **95th
  percentile** line end, not its mode — several editions set these prayers as
  verse, where the modal line end is some middle-length clause and every longer
  line then reads as having run out of room.
- **The Eastern-rite prayers are the one run with no anchor**, and what finds
  them is present in all four: each names its tradition on a line of its own in
  parentheses — `(Koptų tradicija)`, `(Коптский обряд)` — with the heading in
  the tight run of lines above it. The same rule pulls the Belarusian's
  `(паэтычная форма)` off its titles and into `rubric`, where it belongs.
- **Three editions differ in ways that are the source's, not the parser's**,
  and each is declared rather than branched on: the Indonesian misprints two
  Latin headings (`Egina Cæli`, `Vine, Creator Spiritus`), so they are located
  as the one heading standing in the gap their neighbours leave and stored as
  printed; the Indonesian prints neither the Rosary's concluding prayer nor any
  Eastern-rite prayer (`absent`); the Russian's reader reports no face at all,
  so a heading is recognised by its text there — measured off the region
  (`Region.faced`), not declared.
- **The Belarusian's Latin column is printed and NOT published.** It sets every
  accent as a separate positioned glyph over a base letter its fonts do not
  map, and the two readers fail differently and both irrecoverably: MuPDF
  answers `et F<FFFD>´lii` for `et Fílii` and floats some accents to the end of
  the line, poppler combines them onto the following letter (`Fĺii`) and drops
  others outright (`nostr.` for `nostræ`). Word for word against the English
  appendix it scores **84.9%**, against 99.5 / 99.2 / 95.1 for the other three.
  Hence `latin_unreadable`, which is a statement about the FILE — `no_latin`
  says the source printed nothing, and here that would be false.
- **`report_pdf_latin` is the oracle and it is printed, never gated**, like its
  sibling above. Read the SHAPE: the Lithuanian's six departures in 1,359 words
  are each one letter (`quelli` for `quem`, `sieut` for `sicut`, `posi` for
  `post`), which says a reader misread a glyph; the Russian's are whole words
  (`genitrix` for `genetrix`, `solatium` for `solacium`, `exultavit`), which
  says the edition did; the Indonesian's are both.

**WHERE THIS STOPS, and it stops at vatican.va.** Fourteen editions is every
one there is: no Catechism and no Compendium exists there in Polish, Dutch,
Czech, Slovak, Croatian, Vietnamese, Korean, Tagalog, Ukrainian, Finnish,
Danish, Latvian, Swahili, Hebrew, Hindi, Malayalam or Igbo, so nothing further
is reachable by re-parsing and the next edition costs a fetch from a host
nobody here has used. Twenty of the thirty-four interface languages still have
no prayers. **The survey of national bishops'-conference sources for thirteen
of them is written up in `docs/research/prayers-beyond-the-vatican.md`** —
which tier each language is in, what the catch is, the four small things the
code still lacks, and the one decision left open (Finland has exactly one
Catholic publisher and Tagalog has none hosting the text, so both defeat the
two-witness rule, and whether to ship them from a single named source is not a
call to take mid-task). Read it before starting, and re-confirm a URL before
capturing from it: the survey recorded hosts and findings, not always paths.

**Two defects in the shared reader came out of this, both fixed and both
measured over `compendium.ru` before they were kept.**

- **Not every one of poppler's `<word>` boundaries is a space.** It ends a word
  where the font forces it to, and `poppler_lines` was joining on the tag, so
  `sæ|cula` became `sæ cula` inside twelve Latin prayers and `Г|ЛАВА` became `Г
ЛАВА`. The threshold is measured and the measurement is what makes it safe:
  over 37,757 word pairs the gap is bimodal with an empty band between — 424
  pairs at 0.1pt or less, one at 0.5, then nothing until 0.7 where real spaces
  begin and run to a median of 2.26. `_WORD_TOUCH` is 0.6. At 0.8 it reaches
  real spaces and closes `«ВЕРУЮ В БОГА»` into `«ВЕРУЮ ВБОГА»`.
- **`PdfEdition.repair_small_caps` was that defect patched one layer too late**
  and is gone. It rejoined a lone capital to the word after it in an all-caps
  line, which is exactly what the reader had broken; with the cause fixed the
  patch became damage, since a one-letter Russian preposition before a word is
  the same shape. 38 answers of `compendium.ru` read correctly that did not,
  the division table still matches on all 218 pages, and nothing else uses
  poppler.

**A near miss worth recording: `furniture_strip` is compared against the
BASELINE, not `y0`.** The Russian's running head sits at y=80 and its text
block opens at y=101.1 on a 595pt page, so 0.17 — 101.15 — looks like it lands
exactly on the first body line, and a reading of it that way "explained" a
missing line of the Nicene Creed and would have re-admitted 164 running heads
into the body. The line was elsewhere. `_in_furniture` reads `line.baseline`,
which for poppler is the box BOTTOM, so the head clears at ~89 and the body at
~110 and the strip sits comfortably between them.

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
(2026-09-03, `docs/decisions.md` §Scope, `docs/corpus-schema.md`
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
- **The delimiter after a label does not always sit beside it.** English sets
  one title inside its own anchor and leaves the colon outside —
  `<a name="TITLE_I">TITLE I</a>:` — so once `split_label` has taken the
  label, the punctuation is behind a closing tag where a plain `lstrip` cannot
  see it, and canon 1166 opened under `TITLE I : SACRAMENTALS`.
  `drop_leading_punct` reads past tags and copies them through; it recovered
  30 canons in six editions as well, each opening with a stranded dash the
  same rule had left behind (`<b>— </b>§ 1. The following…`).
- **The one correction filed against this work is a heading, and it is a
  heading because the source left no markup to read.** The EN page for canons
  1-6 prints the Latin edition's book title run into the English one inside a
  single `<b>` — `GENERAL NORMS LIBER I. DE NORMIS GENERALIBUS` — so nothing
  can divide them; twelve other pages of the same edition print `BOOK I.
GENERAL NORMS`, which is the witness. `require_all_applied` runs after the
  page loop, where a language has been read whole and an entry that matched
  nothing is drift rather than an unvisited page.
- **`BOOK IV` reads `FUNCTION OF THE CHURCH` in every EN page and stays that
  way.** The word the other six editions carry (`SANCTIFICANDI`, `DI
SANTIFICARE`, `СВЯТИТЕЛЬСКОЕ`) is dropped consistently, which makes it the
  edition's own reading and not a slip — and a defect with no witness in its
  own edition gets documented, not invented (`KNOWN_GAPS`' argument).
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

## `derive_national_calendars.py` proposes a layer, and now also a shared set

**`SHARED_PROPERS` names groups of calendars whose propers agree, and the tool
takes the INTERSECTION** — it never trusts the table for content. A date enters
a group only where every member holds an identical entry list on it, every
member must share the anchor language (a name under two tags is not the same
row), and the whole run must include every member or `groups.ts` is not
rewritten. Three groups qualify today and two named candidates do not, both
recorded in the table rather than deleted (`site/docs/calendar.md`).

**`ALSO_COVERS` IS IN THIS FILE BECAUSE IT USED TO BE NOWHERE.** `alsoCovers`
was written into five layers by a throwaway script in the session that created
them; the script is gone, so the field was regenerable only from the previous
copy of its own output — the shape the root `CLAUDE.md` records biting this
project three times in one day. The first re-derivation after that dropped
eleven territories out of the site's picker, silently, with every test passing.
**When a re-derivation's diff DELETES a field, ask what wrote it** before
accepting the loss.

## `liturgical_calendar.py` fetches an oracle, and writes no WORK at all

It fetches GCatholic's iCal calendars into `raw/gcatholic-calendar/` and parses
them to `build/gcatholic-calendar/`, where the site's own computed calendar is
checked against them day by day (`site/CLAUDE.md`, `site/docs/calendar.md`).
Nothing it writes is served to a reader; it decides whether the code that
decides days is right.

- **THE ORACLE MOVED FROM `glossa` TO THE CORPUS ON 2026-09-04**, having been
  tracked at `site/src/lib/calendar/oracle/` since this scraper was written. It
  is parsed output regenerable from `raw/`, which is what `build/` means, and a
  verbatim reproduction of somebody else's published calendars, which is what
  the private corpus is for. It is therefore **the one directory under `build/`
  that is not a work** — no `manifest.json`, named in `sync-corpus.mjs`'s
  `NON_WORK_DIRS`, and a stage in `rebuild.py` so a rebuild into an empty
  `build/` does not leave the calendar with nothing to check itself against.
  The cost is paid rather than hidden: `npm run verify:calendar` is a
  development task, not part of the site's hermetic `npm test`
  (`site/docs/calendar.md`).
- The fetched feeds stay in `raw/` as usual, so widening the parse is a
  re-parse and never a re-crawl — demonstrated twice: the slimming pass that
  took the output from 7.1 MB to 2.7 MB cost 0 requests and 78 cache hits, and
  the move above was verified the same way (the re-parse into the corpus
  reported all 281 files **unchanged**).
- **Only the anchor language's names are written out.** Every language is still
  fetched and parsed, because the cross-language agreement check is what caught
  GCatholic emitting 22 June's two optional memorials in one order in Latin and
  the other in English — so **the index inside a UID is that language's
  POSITION, not the celebration's identity**, and joining on it silently gives
  Paulinus the name of Fisher and More. The other languages are dropped from
  the oracle because nothing could assert them: this project's vernaculars are
  the Missal's and GCatholic's are its house style.
- **`ics/{year}-{lang}-{calendar}.ics` is deterministic**, which is what makes
  the country dimension free. `CALENDARS` names what is fetched and a country
  is a row; since 2026-09-04 it holds **every calendar GCatholic publishes** —
  86 of them, plus the eight universal variants — where it had held the sixteen
  largest Catholic populations. The boundary was never a limit (a country costs
  one row here and one data file on the site), so the honest set is the one the
  source publishes.
- **GCatholic lists 96 territories and publishes 86 calendars**, and the
  difference is eight particular churches standing for more than one place:
  `IT-rome0` is the Diocese of Rome, which is Vatican City's calendar;
  `ES-urge0` is Urgell, which is Andorra's; `DK-kobe0` covers Denmark, the
  Faroes and Greenland; and three vicariates (`KW-arab1`, `AE-arab0`,
  `PS-jeru0`) carry eleven countries between them. **Read a code as a
  calendar, never as a country** — `IT-rome0` lowercases to `it`, and the
  site's oracle test compared the Vatican against Italy's layer for exactly
  that reason until `CALENDAR_FEED_IDS` existed.
- **The languages are read off the source, not guessed.** Each calendar's own
  HTML page carries a language switcher naming the editions it is published
  in; the anchor is the country's own language wherever there is one. Twenty-
  three calendars are English-only because GCatholic offers nothing else.
- **A CALENDAR-YEAR CAN BE ABSENT and that is the source's answer, not a
  failure.** Trinidad and Tobago publishes 2026 and 2027 and no 2025. The run
  skips the whole calendar-year rather than the one language that 404ed — a
  year checked in one language and not another is a hole the cross-language
  agreement check would not cover — and `Fetcher` has already written the URL
  to `absent-sources.json`, so the next run costs no request. Only a 404 or a
  410 counts (`_DEFINITIVELY_ABSENT`); a timeout is the network.
- **The rank token is the LANGUAGE's own initial, not a machine code.** Latin,
  English, Portuguese, Spanish, Italian and French all print `S F M m`, which
  reads as a vocabulary; German prints `H F G g` and Polish `U Ś W w`. `RANKS`
  is per language with a Latin-letter fallback, and an unknown token is FATAL —
  which is how this was found, on the first Polish feed, rather than by silently
  ranking a solemnity as nothing. The `_SUMMARY` regex matches the token as
  "anything but a bracket" for the same reason: an ASCII class turned Polish's
  `Ś` into part of the name.
- **THE FIFTEEN LANGUAGES ADDED WITH THE FULL CRAWL WERE READ, NOT WRITTEN**
  (2026-09-04). A table of guessed initials is exactly what that fatal guard
  exists to refuse, so they were derived by ALIGNMENT: one calendar and year in
  two languages is the same set of days, a day whose two editions each hold
  exactly one unresolved token forces that pair whatever the order inside the
  day, and iterating to a fixpoint reaches all five ranks in all fifteen. Every
  token came out unanimous. **Two of them refute the rule the first three
  suggested** — Latin, German and Polish all spell the optional memorial as the
  lowercase of the obligatory one, until Croatian pairs `Sp` with `ns`
  (_neobvezni spomendan_, a different word) and Indonesian pairs `Pfak` with
  `Pfac*`; three of the scripts have no case at all. There is no rule; there is
  a reading.
- **THE UNITED STATES IS TWO CALENDARS.** `US-D` and `US-H` and no plain `US`:
  the Ascension is on the Thursday in six ecclesiastical provinces and on the
  Sunday everywhere else. A trailing `-A`..`-H` names the transfer variant
  wherever it appears, so the oracle records it for those two exactly as for
  `General-*`, and the site's single US layer is checked against both.
- **Blue is a fifth disc, and it is narrower than it looks.** 🔵 appears on one
  day — the Immaculate Conception — in exactly two of sixteen national
  calendars, Spain and the Philippines. The privilege is described as Spain's
  and her former dominions', which predicts the Spanish-speaking Americas;
  Mexico, Colombia, Peru, Venezuela and Argentina all print 8 December white.
- **The feeds cover 2025–2027 only** (measured 2026-09-03 by asking; the HTML
  tables cover 2024–2028). The iCal is still what is read, because its `SUMMARY`
  carries the liturgical COLOUR and the rank as machine-readable tokens the HTML
  only paints in CSS — a whole column is worth more than two Easters. Years
  outside the window are covered by hand-written tests instead.

## A national layer is DERIVED, and the derivation is a proposer

`pipeline/derive_national_calendars.py` (2026-09-04, §The liturgical calendar).
`site/scripts/book-forms-oracle.mjs --derive` for a different table: it reads
what a country's feed does differently from the general variant it layers over
and PROPOSES the `NationalCalendar` that states it. Nothing runs it at deploy;
its output is committed as ordinary source and read by a person.

    uv run pipeline/derive_national_calendars.py --calendars IT   # print one
    uv run pipeline/derive_national_calendars.py --all --write    # write them

- **IT IS PYTHON AND WRITES TYPESCRIPT, which is the wrong way round for this
  repository, and the alternative is worse**: a second iCalendar parser.
  `parse_feed` already reads these feeds — folding, escaping, the coloured
  disc, the per-language rank tokens, the UID grammar — and every one of those
  is a place two implementations drift silently.
- **`--all` leaves the sixteen hand-written layers alone**, and naming one on
  `--calendars` is the only check there is on the tool: run it against Italy or
  the United States and read the proposal beside the file a person wrote. Both
  now come out identical, corrections included.
- **THE TRANSFERS ARE ASKED OF THREE DAYS, NOT SCORED OVER THE YEAR.** The
  first version compared a country against all eight `General-*` feeds and took
  the fewest differences; the variants differ from each other on two or three
  days and a country with sixty propers differs from every one of them on
  sixty, so the margin is noise. England came out `General-C` and keeps
  Epiphany on the Sunday, which put every comparison after it out by a day.
- **A year whose 6 January is a Sunday says nothing about Epiphany** — both
  conventions land on the same day — and reading it as evidence made England
  contradict itself between years.
- **The corrections are `oracle.test.ts`'s `ACCEPTED_VARIANTS`, read back.**
  That table already holds every name this project and GCatholic spell
  differently, a few of which are the source misprinting one (`Xeelos` for
  Blessed Francis Xavier Seelos). Hand transcription had been correcting those
  silently; a derivation would reproduce them. **Correcting the source where
  confidence is high is the right act** and this repository already has the
  shape for it — a locator, the exact before and after, a witness. A scan for
  further misprints (every proper name across all 86 calendars, grouped by the
  words that identify a saint) returned nothing beyond that table: GCatholic is
  internally consistent and `Xeelos` was a singleton.
- **What it will not derive** is stated in each generated file rather than
  guessed: holy days of obligation (the feeds do not mark them), `displacedBy`
  on a move, and any proper whose date fits neither a fixed day, an offset from
  Easter, nor an *n*th weekday. Those become a `NOT DERIVED` comment block.

- **Conduct**: `robots.txt` opens `/calendar/` to `*`; no `Crawl-delay` is
  stated, so the 2.0s floor is chosen rather than commanded, on the principle
  that an unstated limit is not a licence. The crawl is one file per year,
  calendar and language in `CALENDARS`, and every one is cached under `raw/`.

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
