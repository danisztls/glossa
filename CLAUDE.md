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

Live at <https://glossa.me-f65.workers.dev>, on Cloudflare Workers static assets
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
  deployment at 20,000 files, but the SPA-shell build is **635 files / 56 MB**,
  of which exactly two are HTML (`index.html` and the offline fallback) — down
  from ~5,700 when every unit had its own page (`docs/decisions.md`,
  2026-08-18). The bulk is now immutable, content-hashed corpus JSON, which
  Wrangler dedupes by content hash, so a redeploy that changes no corpus data
  uploads very little.
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

## Sandbox quirks that waste time

- **`rm` is aliased to `trash`**, which cannot write `~/.local/share/Trash`
  under the sandbox. It does not fail — it hangs forever at ~80% CPU and leaks
  the process. Delete with `/usr/bin/rm`.
- **Sandboxed `ps` cannot see processes from other tool calls** — each runs in
  its own PID namespace, so a genuinely-alive background job reads as dead.
  Don't use `ps` or `os.kill(pid, 0)` to decide whether a long job is running;
  use a heartbeat file, or check with the sandbox disabled.
- `git commit` needs `~/.gnupg` for signing, which the sandbox blocks.

## Work that spans languages

All three Bible editions and both CCC/Compendium editions cover the same
canonical address space, and that symmetry is a free QA oracle: when a document
exists in two languages, their unit-number sets must match, and any asymmetry is
a defect. That check caught three parser bugs that each looked internally
plausible in one language alone. It does **not** generalize to the encyclicals,
where a missing translation is legitimate and common (Leo XIII is ~17%
translated into Portuguese) — there the rule is "when both exist, they must
agree".

**Where the address space is fixed, that oracle is vacuous, and it will not
tell you so.** The Compendium is questions 1–598 in every edition by
construction, so the unit-number sets can never disagree — and while it
reported symmetry, four English answers were missing their entire bulleted
enumeration, 16 items the parser walked past (`docs/decisions.md`,
2026-08-25). What sees that is `audit.py balance`: per-unit text length
against the sibling edition, normalized by the pair's own median. Run it over
the CCC, the Compendium, the prayers and the Summa; it is deliberately not run
over the documents (a section number is not the same section in both editions
— `coverage` is the instrument there) or the Bible (Esther is versification
divergence, not loss). It reports and never fails.

**It scales quadratically, and that is what makes it worth running.** The
Compendium's ten editions are 45 pairs, and `balance` compares all of them:
48 pairs and 32,466 units across the corpus, 2 outside the band. That
all-pairs matrix is what found the Swedish edition storing 39 of its answers
as nothing but their own reference line — its text sits outside any paragraph,
so the block walk never saw it, and against English alone the ratio would have
read as one more terse translation.

**The Bible is the exception to reading asymmetry as a defect**, and adding the
Latin sharpened rather than blurred that. `bible.clementina.la` is the text
`bible.cpdv.en` was translated from, so where the three disagree about verse
shape the Latin is evidence, not a third opinion: it takes a side in all 31
chapters where EN and PT disagree (PT 25, EN 6, neither 0). Those disagreements
are **edition divergence, not defects** — see `docs/research/bible-edition-divergence.md`
for the four kinds and why calling them defects invites someone to "fix" a
faithful text.

**The interface languages and the content languages are two different sets**,
and since 2026-08-25 they are visibly different sizes: fourteen content
languages against ten interface ones. `UiLang` in
`site/src/lib/i18n.svelte.ts` is the nine Magnifica Humanitas is published in
plus Latin (use `isUiLang`/`UI_LANGS`, never a literal list — `app.css` and
`app.html` each keep one by necessity and say so); `ContentLang` in `types.ts`
is those ten plus `hu`, `ro`, `sl` and `sv`, which arrived with the
Compendium's ten editions and have no dictionary. **Do not derive one from the
other**: they equalized on 2026-08-24 and separated the next day, exactly the
way this note predicted (a text ingested in a language with no dictionary).
Russian is now the case in the other direction — an interface language whose
Compendium exists only as a PDF nothing parses. The seven that came with Magnifica Humanitas are
interface languages the corpus has one work in, so a reader in any of them
gets English content nearly everywhere through `CONTENT_LANG_FALLBACK`; Latin
is the opposite — two whole works, and the chrome arrived last
(`docs/decisions.md` §Languages). Latin's promotion deleted a special case
rather than adding one: `content.svelte.ts`'s `#stillApplies` used to keep an
override forever when its language was not a UI language, and now every
override sleeps and wakes on the UI language it was made under.

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
