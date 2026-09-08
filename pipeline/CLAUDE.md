# pipeline/CLAUDE.md

Operational notes for the scrapers and the rebuild. The repo root's `CLAUDE.md`
holds the corpus-safety rules that apply first (where the corpus lives, what may
be deleted, the ledgers); **`pipeline/docs/*.md` holds the rationale** —
`corpus`, `corrections`, `parsing`, `oracles`, `languages`.

## The rebuild recipe is a program: `pipeline/rebuild.py`

```
uv run pipeline/rebuild.py                  # ~19s, zero network, 0 files written
uv run pipeline/rebuild.py --list           # stages, their globs, their work counts
uv run pipeline/rebuild.py --only bible     # a group, or named stages
uv run pipeline/rebuild.py --no-images      # skip dore's AVIF re-encode
uv run pipeline/rebuild.py --changed-only   # only stages whose inputs moved
uv run pipeline/rebuild.py --jobs 1         # one stage at a time, output streamed
```

It was a shell block in the corpus README and rotted silently four times under a
"keep it current" rule. A new scraper is now a `Stage` in `STAGES`, and anything
a stage needs that a table can state should be derived from the scraper rather
than typed — `phase2`'s language list is `sorted(V.DIVISIONS)`.

- **Every stage declares the work-id globs it writes, and those globs partition
  `build/`** — every work claimed by exactly one stage, asserted by `--list`.
  That is what makes concurrent stages safe and the `wrote` column meaningful.
- **The two document stages run `--offline` and take a lock per phase**, not the
  crawl lock. A crawl's lock is about someone else's server and cannot be
  narrowed; an offline parse's is about racing a work directory, and the two
  phases do not share one (`V.run_lock_path`).
- **`--changed-only` skips a stage whose `code`, `data`, `corpus` and `outputs`
  fingerprints all match the last run that exited 0.** Use it when iterating on
  a parser: editing `bible/martini.py` runs one stage in 2s; changing nothing
  takes 0.5s. `code` is the script's real import closure, read off its `import`
  statements and hashed by content. It is opt-in, like `--skip-written`, because
  this project's standing failure mode is the silent stale answer. `--force` is
  the escape hatch for the input the fingerprints cannot see — a `bs4` or `httpx`
  upgrade changes a parse without changing a byte here.
- **A stage that exits nonzero is not recorded**, so the next `--changed-only`
  runs it again. State lives in `<corpus>/.rebuild-state.json`, untracked;
  deleting it costs one full rebuild.

### Verifying a parser fix

**A parser fix is invisible until the stage runs into the real corpus.** An A/B
diff against a scratch output directory proves the fix and ships nothing —
`build/` is the only thing the site reads. The loop is `rebuild.py --only
<stage>` into the real corpus, then `npm run sync-corpus`, then read the change
back out of `build/<work>/structure.json`. From a worktree set `CORPUS_DIR`: the
default `../glossa-corpus` resolves beside the _worktree_ and quietly finds
nothing, which `--list` shows as `0 works`.

**Another worktree's full rebuild will take it back out.** `build/` is shared,
every session runs `rebuild.py` from its own checkout, and a full rebuild from a
branch lacking your fix re-parses the work with the older code. Measured
2026-09-03: `--only cic` landed corrected titles at 09:04 and another worktree's
full rebuild reverted them at 09:05:32. **The tell is
`corrections-applied.json`** coming back `"applied": []` for a work with a filed
correction. So check for a running `rebuild.py` (`pgrep -f pipeline/rebuild.py`,
sandbox off) before the re-parse, verify _after_ the sync, and expect the revert
until the fix is on the branch other sessions build from.

**The second tell is a coverage fall in a family your branch never touched.** A
full rebuild from a worktree twelve commits behind main re-parsed the corpus
with the older `vatican_docs.py`, and the sync refused the build over
`encyclical 15599 → 14726`. The import-closure argument is sound about a _diff_
and says nothing about a _rebuild_, which runs the whole checkout. Before
reading a coverage fall as a regression, ask whether this branch is current with
the branch the shared `build/` was last written from: `git log --oneline main
^HEAD`.

### What the exit code means

**A run's exit code says whether it went worse than
`pipeline/parse-baseline.json`, and nothing else.** Symmetry is printed as a
report, not gated on — it is chronically FAIL by design, so the recipe used to
exit 1 on every run it ever had. The gate is a baseline of the works known to
parse badly, same shape as the site's `reference-coverage.baseline.json`.
`--accept-baseline` moves the floor only for the works a run touched, so
accepting after a one-pontificate run cannot erase what a full run recorded.

**Two ledgers answer before the baseline does.** A `fetch-failed` whose URL is
in `absent-sources.json` is the origin's answer; a `no-translation-stub`
recorded in `translations-checked.json` is a CMS slot no translator filled.
Anything neither explains lands in the baseline. A page that parsed yesterday
and reads as a stub today is in none of the three, and fails.

**The gate is a floor under the parse's ADDRESSES, not its structure.**
`validate_document` reads section ranges, gaps and citation resolution; it never
opens `structure.json`. Misspelling the Latin `CAPUT` label loses every chapter
division in every Latin document and the check reports nothing — measured.
`rebuild.py`'s `wrote` column sees that, and the cross-edition division
comparison judges it.

**Resolve the build path through `common.build_root()`, never by hand.** It
takes an optional corpus argument for callers handed one (`audit.py`,
`census.py`, `apply_sweep.py`). The site's single construction is `buildSrc` in
`scripts/sync-corpus.mjs`.

## The scrapers' layout

```
pipeline/scrapers/
  common/            shared machinery -- paths, files, fetch, absent,
                     corrections, overrides, text, book_forms. Import it as
                     `common`; `__init__.py` re-exports the whole surface.
                     `book_forms.json` is GENERATED from the site's grammar --
                     never edit it by hand.
  bible/             cpdv, vulgate, matos_soares, and the sacredbible page
                     format the first two share; douay_rheims, introductions
                     and haydock, and the vulgata_online API format THOSE
                     three share (the only scrapers here reading JSON).
                     `haydock.py` writes a COMMENTARY, not a Bible -- it lives
                     here because it reads the same host and annotates the
                     edition beside it.
  ccc/               ccc, compendium, compendium_pdf, ccc_pdf
  summa/             the Summa, EN from CCEL + LA from Corpus Thomisticum
  dore/              Doré's engravings: `plates.py` is the image pipeline
                     (crop, level, resize, AVIF), `dore.py` the script over
                     it. Anchors come from `pipeline/dore-anchors.json`,
                     never re-derived -- see the root CLAUDE.md.
  vatican_docs.py    encyclicals, Vatican I, Vatican II, exhortations,
                     CDF/DDF. One scraper, four subcommands; three are
                     `INDEX_FAMILIES` rows over one runner and
                     `walk_vatican_i` is the one forked walk.
  prayers.py         the VERIFIER of the curated prayers, not their parser:
                     reads every witness page and checks each curated line is
                     findable in the page it cites. Declares no outputs.
  prayers_project.py projects `prayer.common.*` FROM `authored/prayers/`.
  prayers_glossa.py  the Catechism and Compendium read as an apparatus to the
                     prayers -- `commentary.preces.*`, plus the references
                     that reach the prayers those never quote. Reads
                     `raw/ccc-*`, the Compendium's parsed questions, and the
                     projected prayers, so it runs after all three.
  liturgical_calendar.py   the General Roman Calendar, fetched from GCatholic
                     as an ORACLE. Writes nothing to `build/` as a work.
                     NOT `calendar.py`: a script's own directory leads
                     `sys.path`, so that name shadowed the STDLIB `calendar`
                     for every sibling (`common` -> `http.client` -> `email`
                     -> `calendar`).
  audit.py census.py apply_sweep.py   tools over already-written output
```

- **A scraper in a subdirectory needs the `sys.path` line above its imports.**
  Python puts a script's own directory on `sys.path`, which is the whole
  mechanism behind a bare `import common`; for `bible/` and `ccc/` that is no
  longer the directory holding the package. Ruff exempts imports following
  `sys.path` manipulation from E402 — no `noqa` needed, and one added "for
  safety" is reported as unused.
- **`common/book_forms.json` is the site's book table, exported.** `ccc.py`
  tokenizes Portuguese Scripture locators with the same surface forms
  `site/src/lib/refs-grammar.ts` links with, and Python cannot import the
  TypeScript. After changing `BOOK_VARIANTS_EN`/`BOOK_VARIANTS_PT`:
  `cd site && node scripts/export-book-forms.mjs`, commit both.
  `site/src/lib/book-forms.test.ts` fails when the two differ. **Re-run the
  Kings adjudication after any table change** — which forms a scheme covers is a
  measurement, and a citation is evidence only where one reading addresses a
  verse that does not exist. Widening the table moves what resolves to nothing,
  which is where the next source defect shows up.
- **`common/paths.py` computes the repo root as `parents[3]`** and asserts the
  result contains `pipeline/scrapers`. Getting it wrong yields paths that are
  merely _absent_ — `load_corrections` reads a missing directory as "no
  corrections filed", a silent corpus-wide no-op.
- **A fetch that succeeded is no evidence the source published the whole text**,
  and a truncation stored in the source's own data is the one capture regret
  re-parsing cannot fix. 15 of Straubinger's 73 book introductions stop mid-word
  at 4,000 characters, in the live page and an archived copy alike, so
  `introductions_es.py` reads completeness off the text — his `†` closes the
  other 56 — and builds only what is whole (`docs/research/bible-texts.md`).

## Scraping vatican.va

- `robots.txt` says `Crawl-delay: 2`. A commitment about our conduct toward
  someone else's server, not a tuning parameter.
- **Never run two sweeps at once.** It doubles the request rate and races two
  writers on one work directory. `vatican_docs.py` holds a heartbeat lock.
- Expect ~1-in-6-to-8 transient failures (Azure edge flakiness; no 403s, no
  CAPTCHA). Retry with backoff; a genuine failure belongs in the run summary,
  never silently absent from the corpus.
- **The Pius XI index lists one encyclical twice.** `…firmissimam-constantiam`
  and `…nos-es-muy-conocida` are one document at two addresses.
  `INDEX_DUPLICATE_SLUGS` drops the Spanish-titled slug at **discovery**, so
  `raw/` keeps the second page as evidence and only the second address goes. The
  only duplicate in the corpus, checked by hashing every work's `sections.json`
  and `appendix.json`.
- **A document's title is manufactured from its slug, and `SLUG_TITLES` is where
  that breaks.** vatican.va names an encyclical's file after its incipit in 234
  of 256 documents — a habit, not a rule. Exceptions: fifteen slugs are
  truncations (`orientales` also misleads — `orientales-omnes-ecclesias` is a
  different encyclical), six cannot carry an apostrophe/accent/comma, and one
  names something else entirely. An entry records what the document's own
  language prints where editions disagree; `ideal-film` is deliberately absent
  (its editions disagree about the name). A stale key fails silently, so a full
  `--exhortations` run with no filter reports keys that matched no document.
- **A page's own linked table of contents outranks every other level signal**,
  and it is on 81 of 2,080 raw pages. **Re-measure that count when the corpus
  grows** — it is the blast radius of everything in `extract_toc_outline`, and
  the docstring said "three" until the corpus had quadrupled. Three shapes it
  hid:
  - **The depth cue can be structural rather than typographic.** A
    `<blockquote>` is the one _relative_ indent, so it sets a floor of one below
    the last entry outside it and never a tier of its own
    (`querida-amazonia.pt`, `verbum-domini.en`).
  - **The outline's own title is not part of the document.** `_TOC_TITLE_WORDS`
    is a **closed** table of 14 spellings, because the paragraph above an
    outline is as often the document's own name, its first division, or a rule
    of underscores — absorbing one of those loses a real heading.
  - **A `[9-14]` on an entry is an annotation, not a title.** It drops the fuzzy
    match below threshold exactly where outline and body also disagree, and the
    entry then nests one tier too deep.
- **A contents list is printed as a table, and `drop_table_of_contents` may
  only drop what looks like one.** Its entries stand next to each other and
  each is vouched for by a heading the document prints in its place — which is
  what separates a trailing outline from `dei-verbum.de`'s endnote groups
  headed `Kapitel 2:` .. `Kapitel 6:`, five duplicates of the body's own
  chapters that took their notes with them. Its CAPTION is the exception and
  needs neither test: measured, no work in the corpus has one inside its body.
- **A table of contents says nothing of its own, and that is what finds one
  the page did not link** (`toc_reprint_span`). Every line it prints is a line
  the document prints again below it — the property the forward links were
  only a proxy for — so a paragraph is a row where most of its lines are, and
  a masthead is not, because a document's title is said once. It reaches the
  outlines the link rule cannot see at all: `evangelii-gaudium.nl` links no
  entry, `sacrosanctum-concilium.hu` links all 128 at anchors the page never
  defines. Guarded by pointing at three DIFFERENT paragraphs, and refused
  outright on a page whose body never starts.
- **A leading number is a section's address only while it continues the
  document's count**, and the two ways of failing that carry the two costs.
  **Backwards is a heading** (`numbering_restarts`, used by the centred pass
  and the italic one) — that is the only thing that lets a numbered block into
  a heading run.
  `santateresa-delbambinogesu.en` heads its four chapters `1.`..`4.` while the
  body is at 6, 9, 20 and 30, and reading those as addresses cost three
  headings outright and put two sections at the wrong number;
  `ut-unum-sint.hu` counts its sub-headings 1..10 and then restarts, and the
  blanket exclusion cost it 27 of 32. **Hundreds ahead is a date**
  (`numbering_leaps`), and that one costs the document rather than a heading:
  `evangelii-nuntiandi.lv` opens two paragraphs `1974. gada …`, Latvian's
  ordinal year carrying the same trailing period a section number does, and
  every real number after it read as going backwards and merged into it — 5
  sections stored of 82. Refused only once the count has started, since a
  mirror may publish a fragment and number it where the original does
  (`humani-generis-redemptionem.fr` prints one paragraph and calls it 102).
- **Bold is a heading tier, and leaving it out of the rank flattens three into
  two.** `<p align="left"><b><i>…</i></b></p>` is the middle tier and
  `<p align="left"><i>…</i></p>` the one below; `heading_style_rank` ranked
  centring, size and italics and nothing else. The bit sits between size and
  italic so `style ^ 1` still means "the same but for the italics" — and an
  anchor-titled heading is unbold as well as italic, since it carries no
  emphasis at all (`fratelli-tutti.en` makes the two shapes peers).
- **A division above the numbers may say so in words or in paint, not only in
  Roman numerals.** `numbering_is_in_headings` decides whether a numbered run is
  the document's outline or its paragraph addresses, and a coarser heading in
  the middle of the run is what refuses it; recognising only the numeral cost 16
  editions 888 addresses. `gaudium-et-spes.fr` stored 10 sections against its
  peers' 93 because `EXPOSÉ PRÉLIMINAIRE` carries no numeral and no label and is
  simply painted above the numbers below it.
- **Capitals with no emphasis are the third way a mirror prints a heading.**
  `promote_plain_caps_run` runs after the italic and the centred pass and takes
  an unindented all-caps run inside the numbered body — 389 headings in 26
  editions — under the same guard as the others, that a heading heads text.
- **An anchor AROUND a heading names it as surely as one before it, but only
  the empty form may speak for the heading's style.** The two are one claim for
  detection (135 headings in 10 editions) and not for rank:
  `caritas-in-veritate.pt` anchors chapters II–VI and prints chapter I plain, so
  ranking the wrapping form as anchor-titled made five of six italic, dropped
  them out of the centred run, and lost chapter I its label.
- **Brackets around an italic line do not stop it being a heading.**
  `promote_italic_heading_run` tested the block whole, so the Latvian council's
  `(<i>…</i>)` outline was invisible to it.
- **`--slugs` naming only exhortations used to parse nothing and exit 0**
  (`run_phase2` `continue`d past the whole iteration when no encyclicals
  survived the filter). It is the recommended way to check a parser fix on one
  document.

### Corrections and overrides

- Source defects go through `pipeline/corrections/` with locator, exact
  before/after, reason and evidence — never a code special-case, never invented
  text. A defect with no known correct value gets documented, not fixed.
- **A citation correction needs a witness inside the edition.**
  `find-gazette-siglum.py` proposes `AAS` → `ASS` (the gazette renamed in 1909)
  only where the edition writes both sigla at pre-1909 citations — Latin _Lumen
  gentium_ prints both in one footnote. 36 entries filed for that document's
  la/en/es/sw; the 56 editions writing `AAS` uniformly are a practice, not a
  slip, and are refused (`--practice`).
- **A defect proposer must read the page the parser reads**, which means
  applying already-filed corrections to the raw HTML first. `raw/` is never
  modified, so without that a second run finds the defect in the page rather
  than the parse and refuses everything as unlocatable.
- **That rule is about prose. Broken markup is the parser's business.** A
  correction amends what the source _said_ and must be auditable; a mangled tag
  changes nothing a reader reads. `martini.py` normalises three (`<em<`, `<br<`,
  one `zem>`) in code with the locators in its docstring.
- **`corrections/` and `overrides/` are different layers.** A correction says
  the _source_ is wrong and edits the fetched HTML before parsing; an override
  says the source is fine and our _derivation_ is not, and edits the parsed
  output. Keeping them apart is what lets `raw/` stay the record of what the
  source said. Before filing an override, ask whether the defect belongs to one
  document or a class — it has been a class nearly every time. See
  `pipeline/overrides/README.md`.

## The magisterium in ten languages

`en it la pt es fr de pl ar ru`, plus twelve more (`cs da fi hr hu lv nl ro sk
sl sw vi`) as vocabulary entries. What bites:

- **`--fetch-only` is what lets a crawl be an acquisition rather than a
  publishing decision.** Most pages were already under `raw/` from an earlier
  `--fetch-only` run and the recorded 404s covered most of the rest, so the
  ten-language expansion cost 369 new requests.
- **If a family has a discovery function and a flag, check the rebuild recipe
  passes the flag.** `--exhortations` is opt-in and no recipe passed it, so 33
  documents sat in `raw/` with nothing saying they were missing.
- **`lt` is LATIN on the Vatican II mirror; `sw` is SWAHILI.** The archive
  mirror uses its own codes (`po` Portuguese, `sp` Spanish, `ge` German, `lt`
  Latin, `lv` Latvian, `be` Byelorussian); `VATII_LANG_FROM_URL` reads them off
  **the index's own link text**. Guessing `sw` gives you Swedish.
- **A source language code may not fall through a map unrecognised** —
  `common/langcodes.py`, which holds the ambiguous sets and raises rather than
  passing one on. vatican.va spells Latin `lt` where ISO 639-1 spells it `la`
  and reads `lt` as Lithuanian, so the naive reading is the wrong language and
  one the same host publishes: nothing downstream can see it. Read the index's
  own link text and add the row.
- **Most non-English editions print no paragraph numbers, and that is a property
  of the editions.** 328 print none anywhere (mostly it/la/fr); their whole text
  is stored under the headings the source does print, in `appendix.json`, with
  no citable address. Read an empty `sections.json` as an unnumbered edition,
  not an empty document.
- **A stray numbered list is what defeats the parse.** An unnumbered edition
  with a numbered list of decrees near the end reads as a six-section document
  whose §1 holds everything before the list. Signature: one section holding over
  half the text. Those parses are switched off in `site/unpublished.json`, each
  with its measured percentage.
- **`DIVISIONS` is a data table and a new language is a vocabulary entry.** The
  CLI's refusal to parse an unlisted language guards against one undivided blob,
  not against new languages.
  - **The cheapest useful entry is the four nouns and nothing else** —
    `_NUMERAL` already reads `CAPUT III` and `III CAPUT`. Ordinals matter only
    where the language spells a division number as a word.
  - **An empty `ordinals` was a latent bug**: `_alt` returned `""` and the
    pattern became `(…|)`, so prose opening with the word "part" read as a
    division. Fixed in `_compile_labels`.
  - **`--offered-only` is why the twelve-language crawl was 141 requests and not
    2,816.** Every modern-shell page prints a language switcher, exact rather
    than generous (measured over all 1,736 pages). It falls back to asking when
    the base page is not cached, so it can only save requests.
  - **A candidate noun is proposed by count and then READ.** Five of the twelve
    earned an empty `nouns` entry that way: Danish `DEL` scored 31 and every one
    is "del i"; Croatian `DIO` scored 3, all inside "vidio"; Finnish `LUKU`
    scored 1. Byelorussian `Пар.` out-scored every real division noun and is
    `параўн.`, "cf.", the first word of a footnote.
  - **Non-Latin scripts need a table, not code — except Chinese** (`第一章`
    interleaves the numeral; `_NUMERAL` has no CJK digits). **Hebrew needed
    three lines, none about the script**: the modern CMS spells it `iw` and the
    Vatican II mirror `he`, and the corpus stores `.he` — which broke
    `url_lang_key`, `translation_url_for` and `--offered-only` at once,
    invisibly, on the one document offering Hebrew. Hence `MODERN_LANG_TO_URL`,
    and the rule it encodes: **`lang_urls` is keyed by what the SOURCE calls the
    language, never by what we call it.**
  - **Ukrainian and Mongolian are switcher entries that lead nowhere** — all
    four pages are the 200-with-no-document shell, recorded as `stub-page`.
    That is why they have a `DIVISIONS` entry and no editions.
- **The English fallback reads these languages' Scripture forms correctly but
  incompletely.** Nothing mis-links; what is missing is coverage (Hungarian
  `Zsolt` etc.), which is what `book-forms-oracle.mjs --derive` is for.

### "Do we have every language?" — answered in the ledger

`pipeline/translations-checked.json`, written by
`pipeline/scrapers/record_translations.py` without one request.

- **A raw document page that produced no work directory is a page with no
  document on it.** The tool runs the real `parse_document` and records a status
  only where it raises `StubPageError`; a page that parses is printed as
  unexplained. vatican.va serves stubs **200, not 404** — the CMS generates a
  URL slot per (document, language) whether or not a translator filled it, and
  the page's own `EN - IT - LA - PT` bar is its statement of which editions
  exist.
- **`pdf-only` is the one status that does not mean absent.** The English
  _Amoris Laetitia_ is one. On the modern shell the evidence is a
  `/content/dam/` href whose language suffix matches the page (Latin arrives as
  `_lt`). `capture-pdfs` fetches every edition the ledger and the
  Vatican II index record that way, reading each URL off the page that
  established the status rather than a table of its own.
- **A 200 carrying no body is not a capture.** The Traditional Chinese _Inter
  Mirifica_ the mirror's index links answers `content-length: 0`, and `Fetcher`
  cannot tell an empty document from an empty answer — so the capture path
  deletes the file and withdraws its date (`common.forget_capture`), because a
  zero-byte page under write-once `raw/` would still carry evidence of a
  retrieval. `docs/research/pdf-editions.md` §10.
- **A PDF edition is rendered as markup, not parsed a second time.**
  `common/pdf_document.py` recovers only what a PDF has and a page does not —
  the folios, the note block, the raised markers, the paragraph breaks — and
  hands `parse_document` the block stream it already reads, so a PDF edition
  gets the structure walk, the corrections and the ledgers unchanged. Four of
  the seven Latin-script editions come out equal to their siblings on both
  section set and citation count; `docs/research/pdf-editions.md` §10 has the
  table and the three measurements that decided the reader.
- **A discovery regex narrowed to what the parser can read silently narrows what
  the LEDGER can know.** `_VATII_LINK_RE` required `.html`, so the Vatican II
  index's Traditional Chinese PDFs (all sixteen documents, at
  `/chinese/concilio/vat-ii_{slug}_zh-t.pdf`) and the Hebrew _Dei Verbum_ were
  invisible to it for a week. Nothing failed: the absence read as bare absence,
  indistinguishable from never having asked. `_VATII_PDF_LINK_RE` reads them off
  the same index now. The ledger's whole job is to tell a checked absence from
  an unchecked one.
- **The ledger is the record and the manifest a copy.**
  `write_document_outputs` reads it into `manifest.translations`
  (`common/translations.py`).
- **Ten is our boundary, not vatican.va's.** Each document's switcher offers
  more; a switcher entry is a link and a link can lead to a stub, so read it as
  an upper bound.

## A new index-driven family is a table row, not a copied runner

`INDEX_FAMILIES` in `vatican_docs.py`. `phase1`, `vati` and `phase3` are
`IndexFamily` rows driven by one `run_family`.

- **The membership test is not similarity: it is that the family's index names
  every edition's URL**, so a run is fully determined before the first fetch.
  `phase2` fails that test — per-pontificate discovery, URLs derived by
  substitution, `--offered-only` to avoid probing — and stays its own function.
  Do not fold it in.
- **The table carries what a family IS, never how its pages are read**: index,
  titles, reading order, language-code spellings, `--lang` aliases. The two
  `family == "vati"` branches inside the parser are the counter-example and must
  stay branches.
- **Adding one**: a row here plus a `Stage` in `rebuild.py`. `url_lang_key`,
  `translation_url_for`, the lock's subcommand set and the subparsers all read
  the table.
- **Every `discover_*` returns `(refs, notes)`** — notes printed verbatim, a
  fatal failure being empty `refs` plus a note.
- **`--fetch-only` exits 0 before the baseline is judged.** Nothing was parsed,
  so `report_run` would otherwise grade the corpus's standing state as this
  run's verdict, and `--accept-baseline` would write it — which once put 3,678
  `fetch-failed` rows in the floor.

## The First Vatican Council has a walk of its own

Two constitutions, Italian and Latin, four pages; vatican.va publishes no
English edition of either, recorded as `no-url`. The subcommand is `vati`, and
`walk_vatican_i` reads the blocks the shared machinery hands it
(`pipeline/docs/parsing.md`).

- **The general walk read it wrongly and said so in the language of a fix.**
  _Dei Filius_ numbers only its canons and restarts at 1 in each of four groups.
  Canon II.1 arrives as `cand=1` against `last_n=5`, and
  `looks_like_number_typo(1, 6)` is true, so the canon was renumbered §6 under
  an anomaly reading "single-digit typo, corrected". **A heuristic tuned to a
  misprint cannot tell a misprint from a restart** — both look like a number
  going backwards; only the document's shape separates them.
- **Everything before and after the walk is shared** — shell sniffing, block
  extraction, masthead extraction, the footnote split, `narrow_html`,
  `build_manifest`, `validate_document`, the ledgers, the lock. What is forked
  is the ~150 lines deciding what a block MEANS, which is what keeps 1,700 other
  pages out of the blast radius.
- **The two constitutions do not share a page template with each other.** _Dei
  Filius_ is on the modern `<div class="testo">` shell in both languages and
  _Pastor Aeternus_ on neither, one directory apart. The fix is the inner
  wrapper all four pages do share,
  `<div class="text parbase container vaticanrichtext">`, which is exact where
  both shell rules are inference.
- **The mirrors of the two councils disagree on the same host** —
  `i-vatican-council` against `ii_vatican_council`, and Latin is `la` on the
  First's mirror and `lt` on the Second's. Hence `VATI_LANG_FROM_URL` beside
  `VATII_LANG_FROM_URL`.
- **`CAPUT I` is not bold, and `is_full_bold` IS the heading detector.** The
  Latin editions print the label as a plain centred line with the bold subject
  beneath, so all four chapters were lost in both. `_vati_chapter_heading` takes
  both printed forms and resolves each through `match_label`, keeping the
  vocabulary in `DIVISIONS`.
- **The page says where its masthead ends, in words.** Both constitutions close
  their address clause with the chancery formula for a perpetual act — `Ad
perpetuam rei memoriam` / `A perpetua memoria`. Identity has nothing to work
  with (the author is a council and the name printed is the Pope's), so
  `extract_document_header`'s `through` defers to the formula as it already
  defers to a printed rule.
- **The canons are the sections, numbered 1..18 continuously, and each group's
  heading is anchored at its own first canon** (`before` 1, 6, 10, 16). That
  recovers the printed address as a RANGE instead of fabricating a number the
  edition never prints. The chapters go to `appendix.json` with
  `position: "leading"`.
- **The end of the canon run is the first unnumbered prose block after it.**
  Every canon is exactly one block ending `anathema sit`, measured on both
  editions. A numbered canon after that point is recorded as an anomaly. The
  Italian prints `* * *` at that boundary, and the ornament has to OPEN the
  closing unit as it closes the canons.
- **The one note on either page is bibliographic, not textual** — a starred line
  naming the printed edition transcribed, and the two languages name different
  printed sources. Neither constitution carries a footnote marker, so it
  resolves to no citation and goes to `manifest.notes`.

## The Dicastery for the Doctrine of the Faith

`cdf.{slug}.{lang}`, `vatican_docs.py phase3`. The fourth family that scraper
carries and the first where the **selection** is a decision rather than an
enumeration.

- **The index is complete; the corpus is what narrows it.** `CDF_DOCUMENTS`
  holds the 25 documents the corpus actually cites — measured, not judged. Re-run
  that measurement before growing the table; the numbers belong in the commit,
  not the docblock.
- **The corpus slug is assigned, not read off the filename.** This family names
  files after the SUBJECT (`freedom-liberation` is _Libertatis Conscientia_,
  `eutanasia` is _Iura et Bona_), so `document_title`'s manufacture-from-slug is
  wrong here. Keyed by **(promulgation date, source slug)** —
  `homosexual-persons` is two different documents, 1986 and 1992.
- **`lt` is LATIN on this index and `lit` is Lithuanian** — 73 links against 5,
  and it prints `la` once as well. Third family to spring this trap and the
  first with both readings live on one page, so a borrowed code map does not
  fail: it files 66 Latin editions as Lithuanian silently.
- **`lang_urls` is keyed by what the source calls the language.** Keying by the
  work tag left every German, Spanish, Latin and Portuguese edition reported
  `no-url` by a run that had just discovered its URL.
- **`urljoin`, never a path prefix.** The index mixes relative, root-absolute
  and fully qualified hrefs inside a single document's language list. Requiring
  a leading `/` found 51 documents where the page links 239 and reported "the
  index does not list it" for nineteen of the twenty-five — a wrong answer
  shaped exactly like a true one.
- **Do not read an index through a Markdown extractor.** One did, dropped half
  the page, and produced a confident finding that the Holy See's "Complete List"
  omits five major documents. All five are on the page. `raw/` is what the
  scraper reads, so `raw/` is what an argument about the source must be made
  from.

### Three page conventions, two of them corpus-wide bugs

- **Word writes `_edn`/`_ednref` for endnotes** where it writes `_ftn`/`_ftnref`
  for footnotes, and every regex here read only `_ftn`. 47 raw pages, only 10 of
  them CDF. Aliasing the two gave 39 works an apparatus they did not have
  (_Caritas in Veritate_ in eight languages, 0 → 159 citations each);
  `sacramentum-caritatis.ru` fell 275 → 256, which is the fix working — the page
  has exactly 256 definitions and 256 references.
- **`find_bare_footnote_run_start`: a footnote list can announce itself only by
  the numbering restarting.** Eight Polish editions print notes as `N.&nbsp;`
  with no heading, anchor or `<hr>` — the one label shape the run detector
  refuses, because it is also how every numbered paragraph opens. Two guards,
  neither optional: the run must be a restart (taking the first run of `N.` cuts
  every document at its own §1), and 90% of its numbers must already appear as
  inline markers above it. Measured over all 1,611 works: 16 changed, 0
  regressed.
- **`narrow_html` must drop what `strip_tags` drops.** `<!--` is not a tag to a
  regex needing a letter after `<`, so Word's `<!--[if !supportFootnotes]-->`
  survived narrowing as escaped text and came back through `html_to_text` as
  literal markup in the reader's prose. Fifteen editions, caught by the
  round-trip check.

### Judging a damaged edition needs a conjunctive signature

Two shapes, both cross-edition: text loss against the median edition of the same
document (`inter-insigniores.pl`: 4,855 characters against 32,092), and whole
text under wrong addresses (`donum-vitae.it`/`.la` put all of it in one section
where every sibling captured nine; `donum-vitae.pl` reads 51 footnotes as
sections).

**"One section holds over half the text" is not a defect on its own.** A first
pass using it alone flagged all eight editions of _Iura et Bona_ and all seven
of _Samaritanus Bonus_ — documents with three and twelve long numbered parts,
where every edition agrees. The section COUNT has to have fallen too.

**Re-read `site/unpublished.json` when a parser changes.** Two Czech Vatican II
editions were switched off for a signature the parser no longer produces (9
sections with §1 at 59%/64%; now 44 and 130 sections, largest at 8% and 3%). The
file says its entries are temporary; nothing enforces it.

### What is not held is a command, not a table

`uv run pipeline/scrapers/vatican_docs.py discover-cdf [--unselected]` — index
only, no document fetches. Derived rather than written down: the index gained
six documents in 2025 alone. Four kinds of gap, four different decisions:

- **214 of 239 documents are not selected.** Not a backlog. Re-run the citation
  measurement, not this list, before adding one.
- **Two editions are not fetched at all**: Dignitas Infinita's `zh_cn` and
  `zh_tw`, linked as HTML. Chinese has no `DIVISIONS` entry, so a work tag would
  fetch two pages nothing can read.
- **Three editions are in `raw/` and not in `build/`**: the Lithuanian
  _Homosexualitatis Problema_, _Dominus Iesus_ and the 2002 note on political
  life. `lit` is mapped so they were acquired; `lt` has no `DIVISIONS` entry so
  they are not parsed. Adding Lithuanian later costs a vocabulary entry and no
  requests.
- **Nine editions of seven documents exist only as PDF** (`cs` once, `nl`
  twice, `zh_cn`/`zh_tw` three times each).

Plus the parsed editions withheld in `site/unpublished.json`.

## The Catechism is nine editions in four page formats

`ccc.py` reads every language vatican.va publishes the CCC in as HTML (`de en es
fr it la mg pt`), reads Traditional Chinese out of the PDFs it publishes instead
(`zht`), and captures Arabic into `raw/` for nothing to read.

- **`catechism_lt` on vatican.va is LATIN, not Lithuanian.** The site's own link
  text says so and the pages say `PARS PRIMA`; `lt` there is _latine_. (The
  Compendium's Lithuanian PDF two directories away is
  `compendium_catech_lit.pdf`.) Getting it wrong files the _editio typica
  latina_ under a language it is not in, and no check catches it.
- **Four page families, not nine parsers**: `intratext` (en/fr/de), `cms`
  (es/it/la/mg), `pt` (its own per-chapter mirror) and `pdf` (`zht`, read by
  `ccc_pdf.py`). `EDITIONS` names the source, `LANG_CONFIG` the reader,
  `_LABEL_PATTERNS` the labels.
- **Only five of the nine print footnotes.** French, German and Spanish fold
  every reference into the running text, so their paragraphs carry
  `citations: []` by construction and their stored text is longer; the Chinese
  prints no apparatus at all. Read `audit.py balance` with that in mind.
- **A running banner restated with only its first line bolded is not a
  heading.** PT reprints the Part Two banner atop all seven of its pages and
  bolds the title line only on the first, so the other six reached
  `take_mini_header` as divisions. `_restates_banner` is the guard.

### Two abbreviation tables that disagree

French serves 58 sigla, Latin 119, parsed into `abbreviations.json` by
`Edition.sigla` and `SIGLA_READERS` from pages the body loop never visits. They
**disagree on two entries** (`SC`: _Sacrosanctum concilium_ vs _Sources
chrétiennes_; `CA`: _Centesimus annus_ vs _Corpus apologetarum_) and each is
right about its own edition's references — so the schema is per-edition, the
other seven stay `[]`, and `abbr` is not unique even within one edition: read
the array in order and use `kind`. Both tables feed the site's grammar; see
`site/CLAUDE.md` §Reference grammar.

### The Chinese edition is read from geometry

**It is `zht`, not `zh`.** The corpus holds both scripts (`prayer.common.zh` is
祈祷经文, `prayer.common.zht` 祈禱經文). Filed under `zh`, its reader would be
offered 简体中文 in the edition menu. `raw/ccc-zh/` keeps the name it was
captured under, because `raw/` records what the source served (`Edition.raw`).
`vatican_docs.py` still files the Vatican II PDFs' Traditional Chinese as `zh`
in `translations` — a ledger entry rather than a served edition, and unfixed.

`ccc_pdf.py`'s seam is `Block` — `(is_heading, kind, text)` — which
`process_page` has always consumed and which says nothing about markup, so a
reader deciding those three from type size and line position feeds the same
state machine as the four HTML parsers. Three measurements carry it: the
paragraph number **hangs** into the margin (all 2,860, and no other line opens
with a digit run), leading is **bimodal** (18pt inside a block, 36 between), and
the book sets **two text sizes** whose meaning its own §21 states — 10pt is a
citation from the Fathers, the liturgy, the Magisterium or the saints, which is
where this edition's `quote` blocks come from.

- **Every part-file reprints its ancestors, and the reprint is not always
  true** — sometimes misordered (§§355-421 prints Article 1 above Chapter 1),
  sometimes short (§§484-511 omits the Section). **Dropping any heading that
  names a division already open** makes both questions go away, because the
  stack is already right without it.
- **The 2018 revision of §2267 was pasted over the 1997 text without removing
  it**, and its file lost runs elsewhere in the same edit. Both texts are on the
  same baselines and parts of the revision have no text layer at all. Two
  geometries find it: runs that OVERLAP on one baseline (20 pairs, all §2267,
  against five benign bracket kerns of 5–7pt), and a HOLE inside a row (three,
  against seventeen that are the Creed table's second column and are told apart
  by being a column). §§2267, 2268, 2396 and 2397 are refused, and §1725 the
  book omits. All five are declared in `LANG_CONFIG['zht']['absent']`, and
  `validate` checks the declaration **in both directions**.
- **The failures here all read as prose.** §2396 stores a grammatical sentence
  missing its first eleven characters; §1471 lost 554 characters to a run-in
  question read as a division; §126 came out as its own colon when `一、二、三、`
  matched the subdivision pattern. None was visible in the tree and none failed
  `validate`. What found every one was `audit.py balance` against the eight
  editions printing the same 2,865 paragraphs, plus `audit.py divisions`.
- **An edition whose headings are measured must not be re-asked on the text's
  shape** — `LANG_CONFIG['zht']['measured_headings']` switches `opens_new_matter`
  off. Bold is the only signal an HTML mirror gives and says nothing about
  level; asking anyway put both creeds inside §184 and the Thérèse definition
  inside §2558, under a passing `validate` and a clean `divisions`.

### A ceiling only one edition needed is a defect in the others

`parse_page_en` refused an unbolded roman-numeral heading, on the reasoning that
`I.` is too easily mistaken for prose. True of Portuguese, which the rule was
written for; inherited by the IntraText shell, where it cost **English 60
subdivisions and German 57** — among them the seventh petition of the Our Father
and `II THE CHURCH IS HOLY`.

**The count is what tells a ceiling from a defect.** Nodes whose title opens on
a roman numeral: es 272, fr 273, la 272, pt 272, mg 276, it 291, against en 214
and de 213. One-sided, so a parser defect by this file's own rule (§Work that
spans languages).

**What replaces the bold signal is three measured guards**, each of which one
edition needs and the others do not, which is why they are a table: a
90-character cap (IntraText numbers every body paragraph, so prose opens on a
digit); the period required for a **one-character** numeral only, because `I` is
the English pronoun and the book opens on it; and a title opening on a capital,
a quote or an ellipsis, because French's period-optional pattern otherwise reads
two cells of the Creed table as subdivisions.

### The same defect one level down

The CCC's run-in headings ("The covenant with Noah") are a heading level.
`is_mini_header` recognised them and `state.dropped` threw them away — kept vs
dropped: es 380/5, it 378/7, la 378/6, mg 400/41, fr 39/156, de 7/330, pt
13/344, en 2/315. A near-constant total is eight editions agreeing about the
headings and disagreeing about bold. Keeping them took cross-edition node
agreement from two disjoint clusters at ~47% to 85–99%. **A run-in line is a
heading or is inside the paragraph depending on what follows it, never on how it
is set** (`pipeline/docs/parsing.md`).

It also found a verbatim-text defect: French bolds these, and a bold block after
body text was demoted to a quote for the Our Father's sake, so 264 French
paragraphs ended with the next section's title welded on. Invisible to a
reproducibility check, invisible to `check_declared_structure`, and reads as
ordinary text. What made it findable was a heading count that disagreed across
editions.

## Prayers are curated; this scraper's job is to disagree with them

**`build/prayer.common.*` is not a parse.** The corpus is
`<corpus>/authored/prayers/*.json` — 35 files, 477 prayers, 20 editions, the
text as it should read with each editorial act recorded beside it.
`prayers_project.py` writes the work directories from it; `prayers.py` reads the
pages.

- **Two stages, and the split is the point.** `prayers-verify` runs
  `prayers.py --verify-curated`, reads every page and declares no outputs;
  `prayers` writes `prayer.*` and reads no page. The `outputs` partition stays
  exact and a failing check cannot take the reader's text down with it.
- **A declared repair is not a defect.** The verifier reads the curated `flags`:
  a word missing from the page because a flag says it was repaired passes
  (`berlindung` is one word in the curation, `ber lindung` on the page); a word
  no flag accounts for fails. That is the guard against curation drifting into
  invention.
- **The curation must not read its own projection.** `curate.py` takes its
  witnesses from `build/`, which the projector writes; run in that order every
  prayer agrees with itself. It refuses when a manifest says `"curated": true`.
  To re-curate:

  ```sh
  uv run pipeline/scrapers/prayers.py --write-parse /tmp/parse
  GLOSSA_PARSE_DIR=/tmp/parse uv run --no-project python run_all.py
  ```

  `--write-parse` is in no stage and writes the two DERIVED editions too — `la`,
  where the canonical Latin is read from, and `en-gb`. Without them the Latin
  resolves to nothing and the companion vanishes from every prayer.

- **A title is read off the page, the Latin's included, and the slug is not a
  fallback.** `curate.py` took `title` from the witness for every vernacular
  entry and not for `latin`, so 18 of `prayer.common.la`'s 24 prayers published
  their slug as their name. `title_of` in `prayers_project.py` raises rather
  than reaching for the slug.
- **`--changed-only` fingerprints every tracked tree.** `shared_inputs()["corpus"]`
  hashed `raw/` alone, so a curated edit was invisible and the stage was skipped.

**Editorialising moved the corpus toward the source, not away.** Every editorial
act so far undid damage done by a RENDERING rather than an editor: fourteen
transcriptions of one Latin collapsed to the text composed once; the Veni
Creator's quatrains recovered from pages printing 28 undivided lines; `sæ´
culo`, `kami ber / lindung`, `och den / Helige Ande` closed, each a column wrap
inside a word. Both the Belarusian and Russian PDFs print 28 lines and our own
reader merged two, so editing there recovered what the page literally prints.

- **The PDF appendix reader mis-reads verse as wrapped prose, structurally.**
  `carry = line.x1 >= region.measure(...) - MEASURE_TOL` calls a line reaching
  the measure a wrap, and `reach` is the column's 95th percentile — so in verse
  the longest metrical line reaches it by construction. The curated files
  restore them (`unmerge`); **the reader is deliberately unchanged**, because
  that rule serves four editions across verse and justified prose (the Memorare
  must rejoin) and 27–47% of verse lines already sit within `MEASURE_TOL`.
- **An `Amen.` on its own line is lineation, not metre.** Folding it onto the
  line before leaves Hungarian and Lithuanian at seven quatrains and Swedish at
  six. Only the Indonesian stays irregular, for a reason in the text.

## The prayers' glossa reads two books the corpus already holds

`prayers_glossa.py` writes `commentary.preces.{lang}` — fifteen languages; the
script prints the table. Rationale and the tiers left out are in
`docs/research/prayers-glossa.md`.

- **It keeps only what quotes a clause; the report's columns are `read` and
  `kept`.** Most of what it reads glosses the prayer as a whole, and a note with
  no headword has nowhere to sit but the foot of a seven-line text — the
  Catechism reprinted beside the prayer rather than a gloss on it. Nothing is
  lost: each entry carries `references`, checked against the corpus before it is
  written (`check_references`).
- **A section is a stretch of one book that walks one prayer**
  (`COMPENDIUM_SECTIONS`). Both bounds are questions that say what they bound.
  The two Creeds share one section because the Compendium expounds one set of
  articles — a question is filed under whichever creed PRINTS the clause it
  quotes.
- **The references are not in the apparatus and have no language.** They are
  `build/prayer-references/`, one table for every reader, this stage's second
  output and not a work — that the Hail Mary is Luke 1:28 is a fact about the
  PRAYER, where the Catechism reading it clause by clause in fifteen languages
  is fifteen readings. Written inside `commentary.preces.{lang}` for one day,
  they were duplicated fifteen times and absent from the five collections with
  no Catechism and no Compendium. `check_references` asks every edition that
  could hold a number, not the one language at hand.
- **The references reach further than the notes.** Admission: the passage speaks
  of THIS prayer — by naming it (CCC 2678 on the rosary), by quoting it (CCC
  2157 prints the Sign of the Cross entire), or by being the article that
  expounds it (CCC 185-1065 is the Creed). A passage on the same SUBJECT is not
  one: the Catechism has a great deal on prayer to Mary and names neither the
  Salve Regina nor the Memorare. `check_tables` refuses a slug no collection
  prints, which the per-language loop cannot see.
- **Which prayers are Scripture is swept for, not remembered** (`--scripture`,
  ~11s): every prayer against every verse of all nine Bibles, reporting a shared
  run of `SCRIPTURE_RUN` characters. It gates nothing — a collection translates
  independently of any Bible here, so a true reference can go unwitnessed in
  fourteen editions and hold in the fifteenth. It added the Sign of the Cross,
  the Angelus and the responsory for the Pope, and refused four more, the Te
  Deum loudest: nine addresses in the Clementina alone, which says the hymn ENDS
  in a catena of Scripture rather than being a passage of it.
- **Haydock glosses four of these prayers and is not used, because he annotates
  a different English.** 37 notes, 11 with a lemma, **4** the prayer prints. His
  Magnificat opens "doth magnify the Lord" where the appendix prints "proclaims
  the greatness of the Lord". Same rule that keeps him off the CPDV — a lemma
  quotes one text.

### How a lemma is found

- **The lemma is derived, not transcribed, and that is one rule instead of
  eight.** These sources mark a headword differently in every edition — italics
  in guillemets (pt, la, it, es, mg), curly quotes (fr), a colon and no markup
  (en), nothing at all (de). So the lemma is the longest opening run of the note
  that the prayer prints VERBATIM: it can store nothing the annotated text does
  not contain. `--check` reports where that disagrees with the source's own
  italics, and every disagreement so far is a real divergence.
- **`raw/` for the Catechism, `build/` for the Compendium.** CCC blocks collapse
  `<br>` to a space by the schema's convention, so 2676 is one undifferentiated
  run in `build/` and the boundary between one clause's gloss and the next
  survives only on the page. The Compendium's quotation marks survive its parse.
- **The quote glyphs are the edition's own** — four pairs across the fourteen
  (`“ ”`, `« »`, `,, ''`, `„ "`). A pattern knowing only the English pair
  reports de, hu, lt and ro as quoting nothing.
- **The word boundary is asked of BOTH texts.** A prefix ending cleanly in the
  source can end mid-word in the prayer: the French Catechism's `prie pour nous`
  against an appendix printing `priez` stored `…, prie`, which the site then
  refused silently. `splits_word` here IS `splitsWord` in
  `commentary-anchors.ts`, character for character.
- **The headword ends where the EDITION closes it**, not where the lemma stops.
  A run opening on a quotation closes on one; cutting at the match instead opens
  five editions' notes on the tail of their own headword.
- **No two headwords may claim the same words.** CCC 2677 heads its two runs
  `Santa Maria, Mãe de Deus, rogai por nós…` and `Rogai por nós, pecadores…` —
  fair quotation of a prayer printing them as one clause, and fatal to a reader
  anchoring in one pass. The earlier one is CUT back to where the later begins,
  never searched for elsewhere. English heads the same two runs without
  overlapping, which is why the miss was six editions wide and invisible in the
  one anybody reads first.

## Prayers: the Compendium's body is a source, the Latin is the instrument

Every edition of `prayer.common.{lang}` carries the two Creeds, the Our Father
and the Hail Mary. The eight that gained them cost no fetch: the Compendium
prints all three at the head of Part One Section Two and Part Four Section Two,
in the same file Appendix A is read from.

- **The Latin is the anchor, the classifier and the check, and none of those
  reads a word of the vernacular** — which is what makes the reader safe in
  eight languages nobody here is required to know. `Symbolum` and `Pater noster`
  are set in Latin script in every edition, so the region is bounded without a
  table of vernacular headings; each block is then scored against `ccc-la`'s own
  text (`latin_likeness`).
- **The four blocks are not in one order, and getting that wrong is silent.**
  German, Italian, Romanian and Slovenian interleave each Creed with its Latin;
  English, French, Spanish and Hungarian print both vernaculars and then both
  Latins. "The vernacular is the run before the Latin heading" files the Nicene
  Creed under `apostles-creed` in half the editions.
- **Score the whole text; never test an incipit.** Hungarian heads a block
  `Symbolum Apostolicum` and prints `Credo in unum Deum` under it.
- **Four markup shapes, declared in `COMPENDIUM_BODY_SHAPE` per REGION rather
  than per edition**, because German sets its Creeds in a two-column table and
  its Our Father as paragraphs. Italian sets the entire Creed region inside one
  `<p>` divided only by bold headings, which is why every paragraph is split on
  its bold runs first.
- **The printed Latin is used and not stored.** It is a second transcription of
  what `prayer.common.la` publishes, carrying its own misprints, so
  `NO_LATIN_SLUGS` does not move. What it buys is `print_body_latin_report`, run
  over all ten editions on every parse and **printed rather than gated**: a
  departure shared by many editions is a received variant (nine agree on `sedet
ad dexteram Dei Patris` where `ccc-la` has no `Dei`), and one edition alone is
  a slip (`caeeli`, `proper`, `sedit`). `Víirgine` is in en and it — one
  exemplar, not two witnesses.
- **A table row is not a line; only the source's `<br>` says where the lines
  are.** `build_creeds_pt` read the CCC's `#table2` one line per row; the table
  pairs the two Creeds section for section, and the Latin Catechism sets the
  identical pair in eleven rows against Portuguese's seven. `;` mid-line is the
  tell — eight in the Apostles' Creed, five in the Nicene, none in the Latin
  that already read the same table with `br_segments`. **`line_html`'s own test
  decides which kind of `<br>` a cell holds** (median 25 characters and 82%
  clause-final here, against 22/80% for `ccc-la`); French and Italian pass it
  the other way, printing their Creeds as running prose with no `<br>` at all.
- **A cross-language line count is not an oracle.** vatican.va typesets the same
  prayer differently per language: the Compendium's Italian page prints the
  Pater as ten `<br>` lines and the French page prints it as one paragraph, same
  document, same appendix. Where a mismatch is worth reading the raw over, the
  oracle is the Latin printed beside the prayer on the same page.

### The fourteen Latin companions are one text

The appendix prints the same Latin beside every vernacular, so the columns are
fourteen transcriptions of one exemplar. Fold away stress accents, the `ae`/`æ`
ligature, case and punctuation and what is left is either one reading or a
defect. It works where the line count failed because the subject is not written
in any of the fourteen languages (the `audit.py refs` precondition), and the
differences separate into three kinds:

- **House style is uniform per edition and carries no per-prayer information.**
  `de` prints it unaccented in 21 of 21, `ro` in 18 of 21 — and `ro`'s three
  exceptions are exactly the three canticles, set with chant pointing. `hu`,
  `ro` and `sv` never write `æ`. A rule holding across a whole edition is not a
  reading.
- **A slip is a non-word**: `luz` for `lux`, `Spirits` for `Spíritus`, `Sancii`
  for `Sancti`, `sieut` for `sicut`, `dorninica` for `dominica` (the `rn`→`m` of
  a page scan). `it` and `lt` share `sieut`, `eum`, `sanetitate` and `posi` —
  one exemplar, not two witnesses.
- **A variant is attested Latin**, and the two Gospel canticles have an oracle
  in `build/`: the Magnificat is Luke 1:46–55 and the Benedictus 1:68–79, so
  `bible.clementina.la` says whether a reading is Latin at all. Every edition
  shares a 13–14 word residue (the Gloria Patri); what stands above it is the
  corruption. The Clementine clears `exultavit` as its own spelling while
  convicting `ficit`, `mentis`, `onmium`, `ancillaesuae`.
  `genetrix`/`genitrix`, `eundem`/`eumdem`, `solacium`/`solatium`,
  `plebi`/`plebis suae` and `salutari`/`salvatore` are received variants.

**What it found that nothing per-edition could**, each edition's columns being
self-consistent: `prayer.common.fr` shipped the appendix's own section heading
`A) PRIÈRES COMMUNES` as a second Latin block of the Eternal Rest (hence
`FR_PAGE_FURNITURE`, which drops where `FR_NOT_TITLES` only denied titlehood),
and the French Latin Angelus was ONE block where its own vernacular is fourteen,
because `build_prayers_fr` built the Latin as a flat run of `prose` while the
vernacular went through `parse_simple_body`. **Both columns of one page go
through one reader.**

**`&aelig;&acute;` is a corpus-wide defect that hid in a normalised field, and
only French has it.** 18 occurrences, every one in the Latin companion. It
survived because every comparison that could have seen it folds orthography away
first. Four of the eighteen also leave a space inside the word (`qui a sæ´ culo
sunt`), so `_correct_lines` now permits a word-count change for a match holding
no line break. The Indonesian PDF splits the same word at the same point with an
unrelated reader (MuPDF), which identifies the break as the shared exemplar's
lost hyphen rather than either parser's doing.

### The four PDF editions: the same appendix, printed in two columns

`prayer.common.{be,id,lt,ru}`. vatican.va serves ten of fourteen Compendium
editions as HTML; the other four exist only as a PDF made by the national
bishops' conference that translated it. `ccc/compendium_pdf.py` already read the
598-question body out of all four; this reads Appendix A entire plus the two
Creeds and the Our Father, at no fetch.

- **`compendium_pdf.PDF_EDITIONS` is imported, not mirrored** (unlike
  `COMPENDIUM_FILES`, which mirrors a table in a sibling _script_). Which reader
  each file needs, which re-decode, which glyph its fonts fail to map and where
  its furniture ends are facts about those four files.
- **The appendix page is not the body page, so the body reader is not reused.**
  That one separates a cross-reference margin from one column of text; this is
  parallel text, vernacular left and Latin right. What is shared is
  `common/pdf.py`.
- **The printed Latin is the anchor, the bound and the check.** Titles come off
  `prayer.common.en`'s own Latin column, so anchors are read from the corpus
  rather than retyped into it; the columns being parallel, where a prayer's
  Latin stops its vernacular stops — which is what cuts twenty-four prayers
  apart with no vernacular string anywhere in the file.
- **The re-decode is per COLUMN, not per file.** The Russian's fonts carry no
  `ToUnicode` and re-reading poppler's bytes as cp1251 recovers its Cyrillic —
  but the Latin column is not Cyrillic, and re-read it says `In Nуmine Patris`.
  `read_edition` cannot make this distinction; the appendix reader applies
  `decode` to the left column alone.
- **A printed line that reaches the measure is a wrap; one that stops short is a
  break the editor made.** The only signal a PDF carries for the difference, and
  the appendix needs it both ways. The measure is the column's **95th
  percentile** line end, not its mode — several editions set these prayers as
  verse, where the modal line end is some middle-length clause.
- **The Eastern-rite prayers are the one run with no anchor**: each names its
  tradition on a line of its own in parentheses — `(Koptų tradicija)`,
  `(Коптский обряд)` — with the heading in the tight run above it. The same rule
  pulls the Belarusian's `(паэтычная форма)` into `rubric`.
- **Three editions differ in ways that are the source's**, each declared rather
  than branched on: the Indonesian misprints two Latin headings (`Egina Cæli`,
  `Vine, Creator Spiritus`), located as the one heading standing in the gap
  their neighbours leave and stored as printed; the Indonesian prints neither
  the Rosary's concluding prayer nor any Eastern-rite prayer (`absent`); the
  Russian's reader reports no face at all, so a heading is recognised by its
  text there, measured off the region (`Region.faced`).
- **The Belarusian's Latin column is printed and not published.** It sets every
  accent as a separate positioned glyph over a base letter its fonts do not map,
  and both readers fail irrecoverably (MuPDF `et F<FFFD>´lii`; poppler `Fĺii`,
  `nostr.`). Word for word against the English appendix it scores **84.9%**,
  against 99.5 / 99.2 / 95.1 for the others. Hence `latin_unreadable`, a
  statement about the FILE — `no_latin` says the source printed nothing.
- **`report_pdf_latin` is printed, never gated.** Read the shape: the
  Lithuanian's six departures in 1,359 words are each one letter (`quelli`,
  `sieut`, `posi`), which says a reader misread a glyph; the Russian's are whole
  words (`genitrix`, `solatium`, `exultavit`), which says the edition did.

**Where this stops, and it stops at vatican.va.** Fourteen editions is every one
there is: no Catechism and no Compendium exists there in Polish, Dutch, Czech,
Slovak, Croatian, Vietnamese, Korean, Tagalog, Ukrainian, Finnish, Danish,
Latvian, Swahili, Hebrew, Hindi, Malayalam or Igbo. The next edition costs a
fetch from a host nobody here has used.
**`docs/research/prayers-beyond-the-vatican.md`** surveys national
bishops'-conference sources for thirteen of them — which tier each language is
in, the catch, the four small things the code lacks, and the one open decision
(Finland has one Catholic publisher and Tagalog has none hosting the text, so
both defeat the two-witness rule). Read it before starting, and re-confirm a URL
before capturing: the survey recorded hosts and findings, not always paths.

**Two defects in the shared PDF reader came out of this**, both measured over
`compendium.ru` before they were kept:

- **Not every one of poppler's `<word>` boundaries is a space.** It ends a word
  where the font forces it to, and `poppler_lines` was joining on the tag, so
  `sæ|cula` became `sæ cula`. Over 37,757 word pairs the gap is bimodal with an
  empty band: 424 pairs at ≤0.1pt, one at 0.5, then nothing until 0.7 where real
  spaces begin and run to a median of 2.26. `_WORD_TOUCH` is 0.6; at 0.8 it
  closes `«ВЕРУЮ В БОГА»` into `«ВЕРУЮ ВБОГА»`.
- **`PdfEdition.repair_small_caps` was that defect patched one layer too late**
  and is gone. It rejoined a lone capital to the word after it in an all-caps
  line, which is what the reader had broken; with the cause fixed the patch
  became damage, a one-letter Russian preposition being the same shape.

**`furniture_strip` is compared against the BASELINE, not `y0`.** The Russian's
running head sits at y=80 and its text block opens at y=101.1 on a 595pt page,
so 0.17 looks like it lands on the first body line. `_in_furniture` reads
`line.baseline`, which for poppler is the box bottom, so the head clears at ~89
and the body at ~110.

## The Compendium of the Social Doctrine

`csdc.{lang}`, ten of the twelve editions vatican.va publishes as HTML.

- **The page is split by READING the numbers, not by counting `<hr>` rules.**
  Sodano's letter of transmittal numbers its own paragraphs in the form the
  document numbers its 583: handed the whole page, `parse_document` took the
  letter as §§1–5, rejected the document's own 1–4 as backwards-running, and
  resynchronised at §10 — reporting 583 sections, no gaps, range 1..583. Every
  check asks whether numbers are well formed and none asks whose they are. Four
  editions print no `<hr>` at all.
- **A change to `vatican_docs.py` for one work is measured over all of them
  before it is kept.** The nine this needed improved 58 existing works —
  `BOLD_BARE_NUM_RE` is how every Czech Vatican II edition prints its paragraph
  numbers, and `sacrosanctum-concilium.cs` went from 9 sections to 130.
- **A drop in one direction is not a regression if the other rose.** Reading
  this work moved references out of `linkifyProse`'s running-text scan into the
  footnote apparatus, so `vatii` prose scripture fell while its linkable
  citations rose by more. Accept a coverage floor only when the citation column
  has risen to meet the fall.
- **After a rebase that touches this file, re-parse before reading a coverage
  number.** The corpus on disk was produced by the old parser, so a merged fix
  shows up as a loss until `rebuild.py` runs.
- **`appendix.json` is the front matter and nothing else.** It carried the index
  of references too, and badly: 19 KB of the English edition's ~195 KB reached
  it, stopping mid-block after Revelation 21:3. It is a concordance keyed to
  this work's own paragraph numbers, so it is to be parsed as references.
- **The sigla tables are the boundary of the front matter.** `split_page` can
  excise the contents list only where `toc_link_span` recognises one, by its
  links pointing forward — so on `hu`, `pl` and `vi`, whose contents list is
  plain text, it returns `None` and Hungarian shipped 64 units of its own
  outline ahead of the letter. The page family fixes the order, so a block at or
  before the last one the sigla reader took cannot be the letter (`_front_cut`).
  The guard matters: `vi` prints its one table LAST.
- **A unit whose table the sigla reader took must be CLOSED, not just marked.**
  Left open, the next non-heading block joined it — which is how `csdc.fr`
  shipped Sodano's letter titled `ABRÉVIATIONS BIBLIQUES`.
- **A part's epigraph belongs to the paragraph before it, and the count of
  blocks recovers it.** The source prints `PART TWO`, a quotation, then `CHAPTER
FIVE`; `reclaim_mid_body_prose` hands buffered prose back to the interrupted
  section — right for an encyclical's mid-paragraph subheading, wrong here. A
  numbered paragraph of this work is exactly ONE block, and §19/§208/§520 were
  the only sections in nine of ten editions carrying more, so
  `lift_part_epigraphs` moves the trailing blocks onto the section the part
  opens at. It reads the count, not the markup, because the markup differs in
  every edition.
- **`PART_STARTS` is a constant because no edition can be asked.** The parts
  open at §20, §209 and §521 in all ten, while the editions disagree about
  whether the part heading reaches their outline at all.
- **Two editions are withheld with the measurement in `csdc.WITHHELD`**: `id`
  publishes only a table of contents; `nl` interleaves per-group-numbered
  footnotes so pooling resolves citations to the wrong notes.
- **`KNOWN_GAPS` and `KNOWN_DANGLING` are tables, not silence.** Eight
  paragraphs have no address (the source puts two numbered paragraphs in one
  `<p>`; the second's text is stored under the first's number, nothing lost) and
  nine markers resolve to no note.

## The Code of Canon Law is discovered, never derived

`cic.{lang}`, the seven languages vatican.va publishes the Code in as HTML.
1,752 canons per edition, over 1,061 pages.

- **Nothing constructs a page URL.** Six index pages name their own edition's
  content pages and the conventions share no rule — `cic_lib1-cann7-22_en`,
  `cic_libroI_7-22_it`, `cic_libro1_cann7-22_sp`, `cic_liberI_la`, in the
  directories `eng`, `ita`, `esp`, `deu`, `fra`, `latin`.
- **Index order is not document order**, and `order_pages` sorts by the largest
  canon number on each page. The English index links `PART II` before the
  section it opens with, so canon 330 arrived after 430 a hundred times; the
  LARGEST is taken because Spanish's markers are bare numbers and so are its
  enumerated items, which makes every page's smallest a `1`.
- **Book VI is the text in force and the PDF beside it is not a replacement.**
  Each index links a _Nova versio Libri VI_ PDF; the HTML carries the _Pascite
  Gregem Dei_ revision. Read canon 1398 before believing a filename.
- **The three signals a heading has are centring, the mirror's brown, and
  capitals, and no edition uses all three.** English prints `BOOK I` flush left
  in colour and its chapters as unstyled paragraphs; French, German and Russian
  never use the colour. The amendment mark is also brown, which put every marked
  paragraph into the outline until `page_blocks` learned to read the colour past
  it.
- **A canon marker is capitalised and a self-citation is not** — the whole of
  what separates `Can. 1312` opening a canon from `can. 1452` inside one. Second
  guard: the number must be the one that comes next. Third: a marker is never
  followed by a comma (the English page prints `Can. 1423, the conference of
bishops must establish…`, which is canon 1439 §2 quoting 1423).
- **`strip_leading_text` exists because entities are not characters.**
  `vd.strip_leading_text_html` walks a prefix across tag boundaries and skips
  whitespace, but `&nbsp;` is not whitespace and `T&Iacute;TULO` does not start
  with `T`; 235 Spanish divisions read `TÍTULO I TÍTULO I DE LAS LEYES`.
- **A block's text is derived like the STORED text, not with every tag as a
  space.** The French edition prints `C<b>an. 237</b>`, which the
  every-tag-a-space rule reads as `C an. 237`.
- **The Latin Book VI page is a Word table export and the repair is the parser's
  business.** One canon per `<td>`, each closing with an unclosed `<p>&nbsp;`,
  so the block scan matched spans starting in one cell and ending in the next:
  43 canons missing. `unwrap_word_cells` rewrites a cell only where its `<p>`s do
  not balance or it has words before its first one — the archive template's own
  content cell is a leaf cell too, and rewriting that flattens the
  `align="center"` the whole outline is read from.
- **The delimiter after a label does not always sit beside it.** English sets
  one title inside its own anchor and leaves the colon outside —
  `<a name="TITLE_I">TITLE I</a>:` — so a plain `lstrip` cannot see it.
  `drop_leading_punct` reads past tags and copies them through; it also
  recovered 30 canons in six editions opening with a stranded dash.
- **The one correction filed against this work is a heading**, because the
  source left no markup to read: the EN page for canons 1-6 prints the Latin
  book title run into the English one inside a single `<b>`, and twelve other
  pages of the same edition print `BOOK I. GENERAL NORMS`, which is the witness.
  `require_all_applied` runs after the page loop, where a language has been read
  whole.
- **`BOOK IV` reads `FUNCTION OF THE CHURCH` in every EN page and stays that
  way.** The word the other six editions carry (`SANCTIFICANDI`) is dropped
  consistently, which makes it the edition's own reading — and a defect with no
  witness in its own edition gets documented, not invented.
- **The amendment apparatus is cut at the edition's own legend.** Three editions
  reprint superseded wordings after the Code; the boundary is the `( n : …)`
  line explaining the mark, with the typographic rule as a fallback. Cutting at
  the first repeated canon number instead took 61 English canons out of the
  corpus, because the Code cross-references itself in prose.

## The Summa is the exception to two rules at once

- **It has no Portuguese edition and will not before 2055** (Correia's
  translation is in copyright; the free online one is machine-translated). So
  the fallback is an explicit chain — reader's language, then **English, then
  Latin** (`CONTENT_LANG_FALLBACK` in `site/src/lib/corpus.ts`) — resolved **per
  address**, because:
- **Its two editions cover different parts.** `summa.en` has five, `summa.la`
  four (the Corpus Thomisticum publishes no Supplementum). A citation to `Suppl
q. 77` must reach English even for a reader who prefers Latin.

Neither is a gap to fill. `validate` asserts the shape rather than symmetry; the
cross-language oracle still runs over the parts both editions carry, and found
three articles whose body the English edition omits.

## Haydock: the commentary in the pipeline

`commentary.haydock.en` is the first `type: 'commentary'` work: its units
ADDRESS `bible.douay-rheims.en` rather than containing text. The site's half is
in `site/CLAUDE.md`.

- **`rebuild.py` has a dependency edge here, its first**: `haydock` reads
  `bible.douay-rheims.en` out of `build/` for its crawl plan and validation
  oracle, so `Stage.needs` and `waves` exist. The outputs partition is about
  WRITES and never said anything about reads.
- **A book cannot be walked to its first empty chapter here** —
  `douay_rheims.py`'s rule inverts, because a chapter Haydock did not annotate
  answers `[]` exactly as a chapter past the end does. The plan is read off the
  annotated edition, and one chapter past each book's end is probed.
- **The source's sub-note markers are all `#1` and pair by POSITION** — one
  `__Notes:__` block per `_(#1)_` anchor, in anchor order (Apocalypse 20:2 has
  sixteen of each). Reading the digit as a marker silently collapses them.
  `validate` asserts the counts agree; `number_anchors` renumbers on the way out.
- **One `fn` record is one VERSE, not one note** — blank-line-separated
  paragraphs, each one authority's remark, which is why the stored unit is the
  paragraph. 69% of notes close with an authority from a CLOSED vocabulary; a
  tail outside it keeps no `attribution`, and `--attributions` reports the
  residue so the vocabulary is widened by reading.
- **A blank line is not always a paragraph break**: 20 records print one inside
  an open italic run, and splitting there strands an orphan `_`.
  `split_paragraphs` rejoins while the run is open; the safety measurement is
  that not one of 20,814 records has an odd number of underscores overall.

## `liturgical_calendar.py` fetches an oracle and writes no work

It fetches GCatholic's iCal calendars into `raw/gcatholic-calendar/` and parses
them to `build/gcatholic-calendar/`, where the site's computed calendar is
checked against them day by day (`site/docs/calendar.md`). Nothing it writes is
served to a reader.

- **It is the one directory under `build/` that is not a work** — no
  `manifest.json`, named in `sync-corpus.mjs`'s `NON_WORK_DIRS`, and a stage in
  `rebuild.py` so a rebuild into an empty `build/` does not leave the calendar
  with nothing to check itself against. `npm run verify:calendar` is a
  development task, not part of the site's hermetic `npm test`.
- **The fetched feeds stay in `raw/`**, so widening the parse is a re-parse and
  never a re-crawl: the slimming pass that took the output from 7.1 MB to 2.7 MB
  cost 0 requests and 78 cache hits.
- **Only the anchor language's names are written out.** Every language is still
  fetched and parsed, because the cross-language agreement check caught
  GCatholic emitting 22 June's two optional memorials in one order in Latin and
  the other in English — so **the index inside a UID is that language's
  POSITION, not the celebration's identity**, and joining on it gives Paulinus
  the name of Fisher and More. The other languages are dropped because nothing
  could assert them: this project's vernaculars are the Missal's and
  GCatholic's are its house style.
- **`ics/{year}-{lang}-{calendar}.ics` is deterministic**, which makes the
  country dimension free. `CALENDARS` holds every calendar GCatholic publishes,
  plus the eight universal variants.
- **GCatholic lists 96 territories and publishes 86 calendars**: eight
  particular churches stand for more than one place. `IT-rome0` is the Diocese
  of Rome, which is Vatican City's calendar; `ES-urge0` is Urgell, which is
  Andorra's; `DK-kobe0` covers Denmark, the Faroes and Greenland; three
  vicariates carry eleven countries between them. **Read a code as a calendar,
  never as a country** — `IT-rome0` lowercases to `it`, which is why
  `CALENDAR_FEED_IDS` exists.
- **The languages are read off the source, not guessed.** Each calendar's HTML
  page carries a language switcher naming the editions it is published in; the
  anchor is the country's own language wherever there is one.
- **A calendar-year can be absent, and that is the source's answer.** Trinidad
  and Tobago publishes 2026 and 2027 and no 2025. The run skips the whole
  calendar-year rather than the one language that 404ed — a year checked in one
  language and not another is a hole the cross-language check would not cover —
  and `Fetcher` has already written the URL to `absent-sources.json`. Only a 404
  or 410 counts (`_DEFINITIVELY_ABSENT`); a timeout is the network.
- **The rank token is the LANGUAGE's own initial, not a machine code.** Latin,
  English, Portuguese, Spanish, Italian and French all print `S F M m`; German
  prints `H F G g` and Polish `U Ś W w`. `RANKS` is per language with a
  Latin-letter fallback, and an unknown token is FATAL — which is how this was
  found, on the first Polish feed. `_SUMMARY` matches the token as "anything but
  a bracket" for the same reason: an ASCII class turned `Ś` into part of the
  name.
- **The fifteen languages added with the full crawl were READ, not written.** A
  table of guessed initials is what that fatal guard exists to refuse, so they
  were derived by ALIGNMENT: one calendar and year in two languages is the same
  set of days, a day whose two editions each hold exactly one unresolved token
  forces that pair, and iterating to a fixpoint reaches all five ranks in all
  fifteen. Every token came out unanimous. **Two of them refute the rule the
  first three suggested** — Latin, German and Polish spell the optional memorial
  as the lowercase of the obligatory one, until Croatian pairs `Sp` with `ns`
  (_neobvezni spomendan_) and Indonesian pairs `Pfak` with `Pfac*`. There is no
  rule; there is a reading.
- **The United States is two calendars.** `US-D` and `US-H` and no plain `US`:
  the Ascension is on the Thursday in six ecclesiastical provinces and on the
  Sunday everywhere else. A trailing `-A`..`-H` names the transfer variant
  wherever it appears.
- **Blue is a fifth disc, and narrower than it looks.** 🔵 appears on one day —
  the Immaculate Conception — in exactly two of sixteen national calendars,
  Spain and the Philippines. The privilege is described as Spain's and her
  former dominions', which predicts the Spanish-speaking Americas; Mexico,
  Colombia, Peru, Venezuela and Argentina all print 8 December white.
- **The feeds cover 2025–2027 only** (the HTML tables cover 2024–2028). The iCal
  is still what is read, because its `SUMMARY` carries the liturgical COLOUR and
  the rank as machine-readable tokens the HTML only paints in CSS. Years outside
  the window are covered by hand-written tests.
- **Conduct**: `robots.txt` opens `/calendar/` to `*` with no `Crawl-delay`, so
  the 2.0s floor is chosen rather than commanded — an unstated limit is not a
  licence.

## A national layer is derived, and the derivation is a proposer

`pipeline/derive_national_calendars.py` reads what a country's feed does
differently from the general variant it layers over and PROPOSES the
`NationalCalendar` that states it. Nothing runs it at deploy; its output is
committed as ordinary source and read by a person.

```sh
uv run pipeline/derive_national_calendars.py --calendars IT   # print one
uv run pipeline/derive_national_calendars.py --all --write    # write them
```

- **It is Python and writes TypeScript, and the alternative is worse**: a second
  iCalendar parser. `parse_feed` already reads these feeds — folding, escaping,
  the coloured disc, the per-language rank tokens, the UID grammar — and every
  one of those is a place two implementations drift silently.
- **`--all` leaves the sixteen hand-written layers alone**, and naming one on
  `--calendars` is the only check there is on the tool: run it against Italy or
  the United States and read the proposal beside the file a person wrote. Both
  come out identical, corrections included.
- **The transfers are asked of three days, not scored over the year.** The first
  version compared a country against all eight `General-*` feeds and took the
  fewest differences; the variants differ from each other on two or three days
  and a country with sixty propers differs from every one on sixty, so the
  margin is noise. England came out `General-C` and keeps Epiphany on the
  Sunday, which put every comparison after it out by a day.
- **A year whose 6 January is a Sunday says nothing about Epiphany** — both
  conventions land on the same day.
- **The corrections are `oracle.test.ts`'s `ACCEPTED_VARIANTS`, read back.**
  That table holds every name this project and GCatholic spell differently, a
  few of which are the source misprinting one (`Xeelos` for Blessed Francis
  Xavier Seelos). Hand transcription had been correcting those silently; a
  derivation would reproduce them. A scan for further misprints across all 86
  calendars returned nothing beyond that table.
- **What it will not derive** is stated in each generated file rather than
  guessed: holy days of obligation (the feeds do not mark them), `displacedBy`
  on a move, and any proper whose date fits neither a fixed day, an offset from
  Easter, nor an \_n_th weekday. Those become a `NOT DERIVED` comment block.
- **`SHARED_PROPERS` names groups of calendars whose propers agree, and the tool
  takes the INTERSECTION** — it never trusts the table for content. A date
  enters a group only where every member holds an identical entry list on it,
  every member must share the anchor language, and the whole run must include
  every member or `groups.ts` is not rewritten. Candidates that do not qualify
  are recorded in the table rather than deleted.
- **`ALSO_COVERS` is in this file because it used to be nowhere.** `alsoCovers`
  was written into five layers by a throwaway script in the session that created
  them; the script is gone, so the field was regenerable only from the previous
  copy of its own output. The first re-derivation after that dropped eleven
  territories out of the site's picker, silently, with every test passing.
  **When a re-derivation's diff DELETES a field, ask what wrote it.**

## Work that spans languages

Editions of one work covering the same canonical address space are a free QA
oracle: their unit-number sets must match, and any asymmetry is a defect. That
caught three parser bugs that each looked plausible in one language alone. It
does **not** generalise to the encyclicals, where a missing translation is
legitimate — there the rule is "when both exist, they must agree".

**Where the address space is fixed, that oracle is vacuous and will not tell you
so.** The Compendium is questions 1–598 in every edition by construction; while
it reported symmetry, four English answers were missing their entire bulleted
enumeration. **Compare the DIVISIONS instead**: the unit sets cannot disagree,
but the structure trees can — English had 59 in-brief divisions where three
editions agreed on 81. A three-line script over `structure.json`, and nothing
else sees it. **Read it directionally**: an edition doing something the others
do not, consistently, is that edition; an edition missing what the others all
have, in scattered places, is the parser.

### `audit.py trees` — the documents' outlines

`divisions` reads the nested `structure.json` the Catechism and the Compendium
store. The documents, the social doctrine and canon law store a FLAT list, so
every one of their editions sat outside every cross-language check there was.
`trees` is that check, and like `balance` it ranks without adjudicating — its
own report says so, because an unstructured mirror and an unread one are
identical from here (`evangelii-nuntiandi.en` tops the list and is correct).

- **Compare by ANCHOR.** The title is translated and the level is relative, so
  the only part of a heading two editions can be said to share is the section
  number it precedes.
- **Compare the SIGN of the step between anchors, not the level.** An edition
  carrying one extra tier disagrees at every node it has — `csdc.en` reported
  184 — where what happened is one number added to all of them.
- **An edition that found nothing is not a witness that there is nothing.** An
  edition with at most one anchor is reported and never consulted:
  `mediator-dei.es` has 89 headings and one sibling that parsed at all, and
  counting that sibling as a witness made the working edition the one inventing
  73 headings.

### `audit.py balance` — loss inside a unit

Per-unit text length against the sibling edition, normalised by the pair's own
median. Run it over the CCC, the Compendium, the prayers, the Summa and the
Bible; deliberately not over the documents (a section number is not the same
section in both editions — `coverage` is the instrument there). It reports and
never fails.

**It scales quadratically, and that is what makes it worth running** — the
all-pairs matrix found the Swedish Compendium storing 39 answers as nothing but
their own reference line, which against English alone would have read as one
more terse translation. Its first Catechism run produced 375 outliers and three
real defects. **Read the count, not the list**: each defect was one edition far
outside a band the other seven agreed on.

**Where the address space is fixed only down to a division, that division is
the precondition** — not a widened band. Scripture's is fixed at the chapter,
so verses are compared only inside chapters whose verse-number sets agree;
requiring it took the unanimous leads from 405 to 113 and what went was the
documented divergence. That is why the Bible is in now and was not before: two
editions can disagree about verse shape and cannot say which of them is
speaking, and the corpus holds nine.

**An all-pairs report has to rank or nobody reads it.** Nine editions are 36
pairs, so one bad verse is eight rows eight places apart; a lead is a unit where
one edition is outside the band against every other edition comparable there,
ranked by how many. It is a sort order and not a verdict — the vote convicts
only in `refs`, below.

**What a lead means is answered by the units BESIDE it.** A unit short by an
amount its neighbours carry is a division the edition draws elsewhere; a unit
whose whole neighbourhood is short too is text that is not there. Measure it as
the fraction of the lead's own anomaly the three-unit window still shows, and
require every comparable edition to agree: 153 leads sort into 25 `moved`, 49
`absent` and 77 `mixed`, and only the last two are worth a person's reading.
**The statistic has to be a fraction of the anomaly, not a band** — a
one-character verse is outside any band both before and after the window is
widened, so `lam 5:5` read as `moved` until the test asked how much of its
shortfall the window recovered.

### `audit.py refs` — the one oracle allowed to VOTE

Allowed only because its subject is not written in any language. Every
Compendium edition prints, beside each question, the Catechism paragraphs it
condenses; those numbers are fourteen COPIES of one assertion, so the modal set
is an oracle where `balance`'s strongest claim is "a lead". First run: 98 defect
leads, 38 corrections.

- **Read the SHAPE, not the count.** A consistent subset or superset is the
  EDITION (German prints only the first of two ranges at 170 questions, and its
  raw page says so); overlapping and disjoint sets are misprints — no convention
  produces a set crossing the others without containing it.
- **Two editions agreeing on a wrong value are ONE witness.** It kept three
  questions out of `corrections/`.
- **The vote proposes; something else decides.** Every correction carries a
  witness independent of the count: the apparatus's groups ascend, its last
  group is the article's In Brief (a heuristic, and it fires backwards once),
  and the Catechism paragraph itself can be read.
- **A correction is a global substring replacement, so a swap cannot be two of
  them** (they undo each other exactly); each half quotes its own question
  heading. Entries apply in FILE ORDER, and one may quote the page as an earlier
  entry leaves it.
- **A PDF edition's margin needed a fourth correction field**: a margin number
  recurs down a page, so `margin_refs` is matched by EQUALITY against one
  question's assembled reference string. A filed entry whose question the walk
  never reaches is fatal rather than silent.

**The Catechism is deliberately not in that audit**: `related` is empty in every
paragraph of every edition (the mirrors do not print the margin apparatus; every
manifest records the absence), and its `citations` are prose whose conventions
differ per edition, so counting across editions measures the CONVENTION.
Restricted to the three sharing one (it/la/mg) it is worth 71 paragraphs.
`docs/research/ccc-citation-apparatus.md` has the sharper instrument.

### `audit.py apparatus` — the documents' footnotes

The first audit to look at them: `coverage` cuts the raw page at the footnote
boundary, `stored_text_len` counts no citations, and `balance`/`divisions` are
per-unit. The corpus stores 92,519 citations, and **24,154 notes the source
prints reach no reader**. Three questions share one walk — RECALL is ours,
SERIES is arithmetic on the source, the VOTE is the source judged by its own
translations — reported apart so a note we dropped and a misprint we kept cannot
read as one thing.

- **Two exact measures beat one heuristic.** A hole in the marker run `1..N`
  cannot be made honest (stray `(302)` in prose, per-chapter restarts, a guessed
  end). Reading the source's own footnote list with the parser's own reader
  (`split_region` + `build_footnote_table`) asks both halves exactly.
- **The two total failures point in opposite directions**: `list-unread` (123
  editions — markers found, footnote list not) vs `markers-unread` (97 — list
  read whole, not one marker matched; `vita-consecrata.la` stores 0 citations
  against 427 notes). `partial` is the remaining 199.
- **A volume of the Acta is its year minus a constant, so a reference convicts
  itself** — the only check needing no second edition. The constants are DERIVED
  (98.71% of 19,782 AAS references satisfy `volume == year - 1908`; the 304
  failures are transpositions). ASS takes its own offset and ceased in 1908, so
  an ASS reference to a later year is the other series misspelled.
- **Read the COLUMN, not the row** — the French Vatican II edition prints the
  cited document's paragraph number where the volume goes at 33 of its 76
  references. Ranking references instead of editions would open the report with
  it.
- **Here the vote is the SUPPLEMENT, the inverse of `refs`, and what differs is
  the precondition.** These are different apparatus (editions of one document
  print 53/62/63 notes), so footnote _k_ is footnote _k_ only where the marker
  sets are identical: 24 documents of 271. What it adds is the PAGE, which
  arithmetic cannot judge.
- **An edition citing the first page of a range is not misprinting it** — the
  Byelorussian prints a narrower span ten times out of ten.
  `SERIES_DEFECT_SHAPES` is the four no convention produces (`series`, `volume`,
  `year`, `page`); `page-narrower`, `page-wider` and `count` are editions being
  editions.

**The first run's top lead was a parser fix, applied: 730 notes back.** The
delimiter and digits of a `(N)`/`[N]` marker are not always adjacent (a Word
export opens a `<font>` or `<a>` between them); `_MARKER_INLINE_TAG` widens the
two intolerant marker templates, and the substitution KEEPS the tags it matched
(dropping them unbalances the markup).

- Verified by parsing the whole corpus both ways: +730 citations in exactly the
  20 works a scan over `raw/` predicted; eight works went from no apparatus to a
  complete one.
- **Whitespace is deliberately not tolerated.** `( N)` gains 12 markers and
  costs two false ones, and a false marker is worse than a missing one — it
  takes a printed number out of the reader's prose and files a footnote where
  the source never marked one. The one real marker it costs
  (`iucunda-sane.it`) is recorded in `pipeline/parse-baseline.json`.
- **The footnote list needed the same widening one layer down**
  (`build_footnote_table_anchor`); `ecclesiam.la` prints an anchor name that is
  a typo for its own printed number — the only one of 465 anchor-keyed entries
  where the two disagree, and broken markup, so repaired in code.
- **A recall fix scores as a regression in a checker that counts incidents.**
  Finding more markers on a page whose list only partly resolves necessarily
  finds more unresolved ones (`eccl-de-euch.hr` went 47→100 citations and
  `1 -> 4 problems`). Read the two numbers together.

**The Bible is the exception to reading asymmetry as a defect**, and the Latin
sharpened it: `bible.clementina.la` is the text the CPDV was translated from, so
where it, the CPDV and Matos Soares disagree about verse shape the Latin is
evidence, not a third opinion. Those disagreements are **edition divergence, not
defects** — `docs/research/bible-edition-divergence.md` has the four kinds and
why calling them defects invites someone to "fix" a faithful text. That is a
rule about verse SHAPE and not about the text under a shape both editions
agree on, which is what `balance` reads once the chapters that disagree are
out (§`audit.py balance`).

## `lectionary.py` is a source and `olm.py` is the oracle over it

USCCB's daily pages carry explicit slot markup and print the OLM's own numbers;
the 1981 typical edition's scan carries clean citations and no readable slot
labels, so neither is asked for the half it reads badly.
`site/docs/lectionary.md` has the argument and the gaps.

- **`--dates` MERGES into the year file; `--years` REPLACES it.** A dated run
  reads one day of a year holding 365, and writing its own days alone threw the
  other 364 away — twice, taking the committed table from 482 numbered Mass sets
  to 55. A year run walks its whole span, so absence there is real and replacing
  is how a day that STOPPED parsing gets seen. `--years <span> --offline`
  rebuilds from `raw/` at no network cost.
- **A disambiguation page is not an empty page.** The Assumption's carries one
  `<h3 class="name">` with no text, so `if parsed["readings"]:` was truthy and
  the day was taken as an ordinary Mass with a blank slot — both its formularies
  unfetched, in every year. `_usable` tests for a slot or a citation.
- **The source is not consistent about `.cfm`**: the same feast links
  `081527-Vigil.cfm` in 2027 and `081526-Vigil` in 2026, so a regex requiring
  the extension found one year's Masses and silently none of the other's.
- **A 404 here is the publisher's edge, a 403 is the bot challenge**, which is
  why `definitive` stays at its default and never records the latter. USCCB runs
  from about 2012 to 2028-03-31 with five permanent holes inside that
  (`absent-sources.json`); probing it with `curl` trips the challenge, so use the
  browser tier.
- **The scan is 92% of the numbering and 60% of the citations**, measured
  against the 439 numbers both sources hold. It checks a table; it may not fill
  one.
