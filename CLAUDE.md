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

Inside the corpus repo, the old distinction still governs what may be deleted:

| Path     | Value                                                                    | Rule                               |
| -------- | ------------------------------------------------------------------------ | ---------------------------------- |
| `works/` | Parsed output. Regenerable from cache in minutes, zero network.          | Safe to rebuild.                   |
| `raw/`   | Every scraped source page. The **only** artifact that cost real fetches. | Treat as write-once. Never delete. |

The project's stated insurance policy is that any capture regret is fixed by
**re-parsing, never re-crawling** (`docs/link-surface.md`). That only holds while
`raw/` is intact. When judging whether a deletion is safe, the question is never
"is this corpus data" but _which of the two it is_.

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
                     format the first two share; douay_rheims and
                     introductions, and the vulgata_online API format THOSE
                     two share (the only scrapers here reading JSON, not HTML)
  ccc/               ccc, compendium
  summa/             the Summa, EN from CCEL + LA from Corpus Thomisticum
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
- Source defects go through `pipeline/corrections/` with locator, exact
  before/after, reason and evidence — never a code special-case, and never
  invented text. A defect with no known correct value gets documented, not
  fixed (`docs/decisions.md` §Corrections and overrides).
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
`/compendium/{n}`, `/compendium/caput/{n}`, `/documenta/{slug}`,
`/preces/{slug}`, `/colophon`. The English roots (`/bible`, `/ccc`,
`/documents`, `/prayers`) deliberately resolve as invalid — there is no
compatibility layer. Note the route directories under `src/routes/` are still
named in English, with the Latin ones as thin re-exports; the canonical name
and the directory name do not match.

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
  deployment at 20,000 files, but the SPA-shell build is **~2,910 files / 110 MB**,
  of which exactly two are HTML (`index.html` and the offline fallback) — down
  from ~5,700 when every unit had its own page (`docs/decisions.md`,
  2026-08-18). The bulk is now immutable, content-hashed corpus JSON, which
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
  costs an invocation per request.
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

**`npm run usage` needs a database that does not exist in a fresh clone.**

```sh
cd site
npx wrangler d1 create glossa-usage                        # once; paste the id
npx wrangler d1 migrations apply glossa-usage --remote     # once
npm run usage -- --days 30
```

`wrangler.jsonc`'s `database_id` ships as a placeholder. The binding is
optional in `src/worker.ts`, so a deploy without it serves the site normally
and drops beacons — right for a statistic, and the reason a missing database
is not a build error.

**The device record expires after a year and that number is load-bearing in two
directions** — see `RECORD_MAX_DAYS`. Shortening it is not free (it inflates the
`new` bucket, worst for infrequent readers) and lengthening it walks toward the
thirteen-month figure the ePrivacy exemption argument rests on. Change it only
with both halves in view.

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

**The interface languages and the content languages are two different sets**,
fourteen tags against fifteen as of 2026-08-26. `UiLang` in
`site/src/lib/i18n.svelte.ts` is the nine Magnifica Humanitas is published in,
plus Latin, plus `hu`, `ro`, `sl` and `sv` (use `isUiLang`/`UI_LANGS`, never a
literal list — `app.css` and `app.html` each keep a copy by necessity and say
so; a test asserts `app.html`'s copy against `UI_LANGS`); `ContentLang` in
`types.ts` is those fourteen plus `mg`. **Do not derive one from the other**:
they equalized at ten on 2026-08-24, separated the next day when the
Compendium's ten editions landed four texts with no dictionary, equalized at
fourteen the day after when the dictionaries were written, and separated again
on 2026-08-26 when the Catechism landed Malagasy — which nobody working here
reads, so the dictionary it is owed is not one of us to write.

**A content language that is not an interface language has exactly one place
to go wrong, and nothing checks it.** `LANGUAGE_NAMES` in `corpus.ts` names
each content language in its own language for the edition menu and the compare
columns; it is keyed on `ContentLang`, and an unnamed tag falls through to the
tag itself. So `ccc.mg` shipped offering itself as "mg" — the type union gained
the language, that table did not, and no build, test or type error saw it,
because the one surface that would have made it obvious (the language switch)
is the surface `mg` is deliberately absent from. Adding a content language
means adding a line there in the same commit.

Coverage, not the count, is what decides whether a language belongs in
`UI_LANGS`. The four newest each have a **whole work** in them — the
Compendium, all 598 questions — so their readers were reading a finished text
inside English chrome; the seven that came with Magnifica Humanitas are
interface languages the corpus has one work in, so a reader in any of them
gets English content nearly everywhere through `CONTENT_LANG_FALLBACK`, which
is at least consistent. Russian is the case in the other direction — chrome
since Magnifica Humanitas, and a Compendium that exists only as a PDF nothing
parses. Latin is the opposite again: two whole works, and the chrome arrived
last (`docs/decisions.md` §Languages). Latin's promotion deleted a special
case rather than adding one: `content.svelte.ts`'s `#stillApplies` used to
keep an override forever when its language was not a UI language, and now
every override sleeps and wakes on the UI language it was made under.

**Direction is a property of the text, not of the reader.** `<html dir>`
follows the interface language; content regions get theirs from the `lang`
they already declare, via two rules at the foot of `app.css`. Write CSS in
logical properties (`margin-inline-start`, not `margin-left`) — the stylesheet
is entirely logical and the components are now too.

Citations may use Hebrew or Vulgate versification. The corpus canonicalizes on
**Vulgate**; `site/src/lib/versification.ts` converts — the only implementation, since its Python twin went with `pipeline/build/` (see `docs/decisions.md` §Parsing). Note that a wrong
chapter does not fail an existence check — `Joel 3:1-5` resolves to real but
wrong text — so conversion is applied unconditionally for divergent books rather
than as a fallback.
