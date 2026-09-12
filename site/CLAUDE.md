# site/CLAUDE.md

Operational notes for the site. The repo root's `CLAUDE.md` holds the
corpus-safety rules that apply first; **`site/docs/*.md` holds the rationale** —
`addresses`, `languages`, `references`, `shell`, `edge`, `reading`, `finding`,
`calendar`, `lectionary`, `usage`, `linking-out`, `colophon`, `census`,
`dev-loop`.

## The boot payload has a ceiling, and the deploy enforces it

Everything `index.html` asks for before it can paint. `npm run preflight` prints
it and refuses to deploy over `MAX_BOOT_JS_BYTES` in
`scripts/preflight-deploy.mjs`. Re-measure rather than quoting a number.

**Vite's `chunkSizeWarningLimit` is not this check and cannot be.** It fires per
chunk, so it says nothing about a payload split across twenty of them, and it
cannot tell the content URL map (`await import()`ed) from a chunk every route
parses. It is raised to 1,700 kB for that reason; the service worker's warning
still fires, because SvelteKit compiles that one with `configFile: false` and
does not forward the option.

**Three things put data in the boot chunk, all silent, all one word wide:**

1. **An `import.meta.glob` over `corpus-data/` that lost `query: '?url'`** —
   `{ eager: true, import: 'default' }` compiles the JSON into the importing
   chunk. Nothing errors.
2. **A static import of `corpus-assets.ts` from anything but
   `src/service-worker.ts`** — it eagerly inlines `content-manifest.json`. Its
   docblock has always said so; `usage.ts` and `library.svelte.ts` each broke it
   anyway, when the file was small enough that nobody noticed.
3. **A static import from a component the layout RENDERS**, even one whose whole
   body is behind `{#if open}`. Svelte still mounts it, so `JumpBox`'s
   `suggest.ts` (with `refs-grammar.ts`) was boot-chunk code on every route.
   **Rendering is not the gate — importing is.**

**Lazy DATA, not lazy readers.** `corpus.ts`'s readers are called from render
and must stay synchronous; what became asynchronous is when the registries are
FILLED. The primers (`ensureCoreIndex`, `ensureBibleIndex`, … in
`corpus-index.ts`) mutate the same exported objects in place, and `+layout.ts`
awaits the ones `index-priming.ts` maps to the path. Adding a reading route
means adding it to `BY_SEGMENT` there; an unknown path primes everything, which
costs a fetch and is the only direction that mapping may be wrong in.

**Lazy data is not free data, and the boot ceiling cannot see what it costs.**
`preflight` weighs the bytes `index.html` asks for; the index tier is fetched
past it, so its parse and post-processing are main-thread work no gate reports.
Keep a registry in the shape the file stores and read it through
`corpus-index.ts`'s `run*` accessors — expanding a `CompactRun` on arrival, or
building a `Set` to ask whether a gapless run holds a number, is work in the
render window (33.5 ms → 9.3 ms; `site/docs/shell.md`).

**A `+page.ts` `load` opens with `await parent()`, always.** SvelteKit starts a
route's whole branch of `load`s at once, so the layout's priming does not
resolve first. `index-priming.test.ts` scans for the wait.

**A shelf needs the indexes its text is read FROM and the indexes its text
POINTS AT.** `refs.ts`'s `refAddress` validates an address from render before it
mints a link, against the Bible's books, the Summa's questions and the
documents' section numbers — so every shelf that renders a citation owes those
three (`REFS` in `index-priming.ts`).

**Making a registry lazy also breaks what was DERIVED from it at module scope.**
`corpus.ts` memoises five maps at module load; module load is long before any
primer resolves, so they were built empty and stayed empty. They go through
`derived()` now, recomputing when `indexGeneration()` moves. **Two of them named
no registry** — they reach `manifests` through `listWorksOfType` — so grepping
for the registry found nothing. `corpus-derivations.test.ts` scans the source
for the pattern, because under fixtures the registries ARE populated at module
load and every runnable test passes either way.

**`npm test` cannot catch a missing primer.** `USE_REAL_CORPUS` is false under
fixtures, so both guards (`requireContentIndex`, `requireIndex`) are inert and
an unprimed read is indistinguishable from a corpus that lacks the text.
`npm run dev` is what catches it — `requireIndex` throws there and warns in
production, deliberately.

## Corpus data must never be inlined into the bundle

`corpus-index.ts` globs the content tier with `query: '?url'` on the premise
that Vite emits the file as a separate content-hashed asset. **Below
`assetsInlineLimit` (4 KB default) that premise is false**: Vite base64s the
file into a `data:` URI and nothing downstream notices — the bytes land in the
boot chunk, `sw-policy.ts`'s `contentPath` cannot make a pathname of it so the
file belongs to no download wave, and `fetch()` still works. `vite.config.ts`
disables inlining for anything under `corpus-data/`. **If a new content kind is
small, check `build/_app/immutable/assets/` actually contains it** rather than
trusting the file count.

**That config does not reach the service worker.** SvelteKit compiles
`service-worker.ts` in a Vite build of its own with `configFile: false`,
forwarding `modulePreload`, `rollupOptions`, `outDir`, `emptyOutDir` and
`minify` and nothing else — so the guard held for the app bundle while 1,656
content files under 4 KB were base64'd into the one bundle whose job is to fetch
them. Every layer then failed quietly: `contentPath` made a "pathname" out of
the base64 payload, `cacheAssets` fetched that and swallowed the 404, the real
asset fell out of `contentUrls` into the versioned SHELL precache, and the
library panel showed a Download button that could never finish.
**`content-urls.ts` and `plate-urls.ts` say `no-inline` on the import itself**,
which no config forwarding can drop, and `scripts/audit-inlined-corpus.mjs` (in
`postbuild`) fails the build on any `data:application/json` or `data:image/avif`
in built JS. **A rule in `vite.config.ts` is a rule about the builds that read
it, and this repo has three.**

**And the glob must not run under `npm run dev` at all.** An eager glob is one
static import per matched file: the build folds those into a chunk, the dev
server answers each as its own module request, and at 2,590 files Chrome fails
the surplus with `net::ERR_INSUFFICIENT_RESOURCES` — the module graph tears, the
page 500s, the service worker reports only `ServiceWorker cannot be started`.
`npm run preview` is always fine, which is the tell. So there is exactly one
glob (`src/lib/content-urls.ts`), and in `vite dev` even that one is replaced by
`content-urls.dev.ts`, which derives the same map from `content-manifest.json`
in a single request. `vite.config.ts`'s `glossa:dev-content-urls` plugin
performs the substitution and matches the RELATIVE specifier, because
`vite:alias` is itself `enforce: 'pre'` and resolves `$lib/...` first.

## Running the site

**Every citation is the SPA shell; the chrome pages are prerendered.**
`ssr = false` and `strict: false` still hold for the corpus's hundreds of
thousands of addresses, which boot from `build/shell.html` — but every page in
`PRERENDERED_CHROME_PATHS` (`route-manifest.ts`) and each of its
language-prefixed forms is written out as a document. So a broken link does
**not** fail the build. What guards addresses is `corpus-routes.json`, generated
by the corpus sync and consulted by `src/worker.ts` at the edge;
`src/lib/route-manifest.ts` holds that grammar and is unit-tested.

- **The set is `CHROME_PATHS` minus what cannot render, and `/calendarium` is
  the exception**: it 500s under SSR, undiagnosed. The two lists live in
  `route-manifest.ts` because the build, each prefixed route's `entries()` and
  the edge must not disagree about which addresses have a document; the build
  refuses a path that is not chrome, or a prefixed one with no `+page.svelte`
  of its own.

- **A page is prerendered by its own `+page.ts`, and the layout cannot help
  it.** SvelteKit sets `load: null` on the SERVER node of any node declaring
  `ssr = false`, so the root layout's priming does not exist during a
  prerender: each such page calls `primeForPath` itself, and a prefixed one
  calls `i18n.set` too. Without them the build succeeds and writes documents
  with the catalogue missing and the chrome in English —
  `requireIndex` only warns in production (`site/docs/shell.md`).
- **The fallback is `shell.html`, addressed as `/shell`.** `/` is a document
  now, so the fallback needed a file of its own; `html_handling` is
  `auto-trailing-slash`, so asking for `/shell.html` gets a 307 with an empty
  body at every citation on the site.
- **The edge decides which of the two an address gets** — `isPrerenderedPath`
  in `src/worker.ts`, a set membership and never a prefix test, since serving
  `/preces`'s document at a citation's URL is worse than no prerender.
  `worker.test.ts` asserts both directions.
- **A prefixed chrome path needs a route of its own, and five did not have
  one.** `/pt/schola` was in the sitemap and in the `hreflang` cluster while
  `[...rest]` redirected it to `/schola` — a cluster whose members redirect to
  one negotiated page is the claim the cluster exists to make, unmade. Four now
  have a four-line re-export; `/catechismus/compendium` was retired instead.
- **What it bought, measured cold on Slow 4G** (`npm run vitals`): LCP 5,344 ms
  to 1,072 ms on `/`, FCP with it, and the same on every other chrome page.
  **What it cost is CLS, and painting early is what exposed it** — the shell hid
  every shift by painting nothing until everything had arrived. `/ar` 0.084 to
  0.308, the wordmark's own `font-display: block` face resizing the lockup
  twice while an Arabic page's bandwidth goes elsewhere; `/ius-canonicum` 0.386,
  the footer moving for content that arrives after hydration. Both want a
  reserved box, and neither is fixed.

Canonical reader URLs are Latin and do not vary with interface language:
`/scriptura/{book}/{chapter}`, `/catechismus/{n}`, `/catechismus/caput/{n}`,
`/catechismus/compendium/{n}`, `/catechismus/compendium/caput/{n}`,
`/documenta/{slug}`, `/doctrina-socialis/{n}`, `/doctrina-socialis/caput/{n}`,
`/doctores/summa/{part}/{question}`, `/preces/{slug}`, `/colophon`.

**`{book}` is a Latin slug, not an OSIS id** — `/scriptura/iosue/1`,
`/scriptura/i-samuel/3`:

- **`BIBLE_BOOK_SLUGS` in `address.ts` is the boundary and the only one.** The
  corpus is still keyed on the OSIS id everywhere (content paths,
  `corpus-routes.json`, `route-titles.json`, `apparatus.json` keys, the xref
  index) and `parseHref` still hands back an `osis`.
- **The table is DERIVED from `bible.clementina.la`'s own `name` field** (`ae`
  for `æ`, `J` folded to `I`). A slug judged wrong is a corpus defect — fix
  `pipeline/corrections/` and re-derive, never hand-edit the table, or the URL
  stops saying what the page says.
- **Anything building a `/scriptura/` href by hand must call `bookSlug`.** Two
  did (`chapterLink` in `shell-head.ts`, `bibleLink` in `apparatus.ts`). Prefer
  `hrefFor`.
- **The OSIS spelling 301s, and that vocabulary lives outside the grammar**:
  `bookFromLegacySlug` is read by exactly two doormats that run before
  `parseHref` — `legacyBiblePath` in `src/worker.ts` (gated on the target
  existing, so a dead address 404s in place) and `migrateBibleHref` in
  `bookmarks.svelte.ts`, without which every reader's Bible bookmarks vanish
  silently (the store is keyed by raw href and drops what the grammar rejects).

**A reading address takes a language prefix as an ENTRY POINT.**
`/es/scriptura/iosue/1` is served, persists Spanish as the switcher does, and is
replaced in the bar with the bare path by
`routes/[uilang=uilang]/[...rest]/+page.ts`. It canonicalizes to the bare path,
is in no sitemap and declares no alternates; `parseLangEntry` in
`route-manifest.ts` is the edge half. `CHROME_PATHS` are unchanged by it, so
`parseChromePath` is tried first everywhere. Two traps: `parseLangEntry` must
never be `noindex` (a `noindex` beside a canonical naming another URL can carry
to the target), and it must refuse a doubled prefix — it calls
`isCanonicalPath`, which calls back, so `/es/pt/…` would otherwise peel one
segment per round.

The English roots (`/bible`, `/ccc`, `/documents`, `/prayers`,
`/compendium/{n}`, `/summa/…`) deliberately resolve as invalid — no
compatibility layer. **`/doctores` is not in the nav**, deliberately: the Summa
awaits a quality pass and the shelf holds nothing else; restoring the entry is
one line in `+layout.svelte`.

**The directory under `src/routes/` IS the canonical path.** It was named in
English with a Latin re-export beside it, and the cost was a legacy path getting
a 404 from the worker and then rendering the real page anyway, because the
client router could still match it. The only re-exports left are under
`[uilang=uilang]/`, which mount entry points at a second address on purpose.

### The script table

`package.json` has no comments, so the grouping is the documentation.
`src/lib/package-scripts.test.ts` is the compiler it does not otherwise have.

| run              |                                                      |
| ---------------- | ---------------------------------------------------- |
| `dev`            | the only place a missing index primer THROWS         |
| `dev:clean`      | the same, after dropping Vite's dep cache            |
| `build`          | `prebuild` derives the corpus, `postbuild` audits it |
| `preview`        | static files only — **cannot see the worker**        |
| `preview:edge`   | `wrangler dev`: the real worker over `build/`        |
| `preview:deploy` | build → preflight → `preview:edge`                   |

| verify            |                                                           |
| ----------------- | --------------------------------------------------------- |
| `verify`          | `format:check` → `check` → `test`, cheapest first         |
| `test`            | always fixtures, never a synced corpus                    |
| `check`           | `svelte-check`; 0 errors                                  |
| `format:check`    | what the pre-commit hook does, over the whole tree        |
| `verify:calendar` | the oracle — **needs the corpus, and is NOT in `verify`** |

| derive                |                                                      |
| --------------------- | ---------------------------------------------------- |
| `sync-corpus`         | full derivation                                      |
| `sync-corpus:changed` | skip if nothing moved (what `predev` runs)           |
| `export`              | the three TS-table-to-JSON exporters, as one command |
| `coverage:accept`     | record an intended reference-coverage drop           |
| `lastmod:accept`      | record an intended lastmod change                    |

```sh
cd site
CORPUS_DIR=/path/to/glossa-corpus npm run dev        # corpus kept elsewhere
node scripts/sync-corpus.mjs --changed-only --force  # ignore the cache
npm run check -- --watch                             # what check:watch is
```

- **`npm run check` gated nothing while it reported 23 errors**, all in three
  files, against sixteen other JSDoc-typed `.mjs` files that were clean. The fix
  was to type the two, never to loosen `checkJs`/`strict`.
  `html-minifier-terser` ships no types and has a four-option declaration in
  `src/html-minifier-terser.d.ts`, which says why it is not `@types/…`.
- **`npm run export` exists because three separate tests each named a different
  command as their fix.** `book-forms.test.ts`, `versification-export.test.ts`
  and `section-names.test.ts` all say `npm run export` now, and it runs all
  three. They are byte-identical re-writes when nothing moved, so running the
  set is free.
- **`npm run verify` is the only place the three checks are named together**,
  and there is no CI to name them anywhere else. Order is cheapest-first.
- **Five script names begin with `pre` for reasons that have nothing to do with
  hooks** — `preview`, `preview:edge`, `preview:deploy`, `preflight` and npm's
  own `prepare` — and npm runs `pre<name>`/`post<name>` around `npm run <name>`
  whether or not anyone meant it. Adding a script called `view`, `flight` or
  `view:deploy` would silently make an existing one its hook. The reverse has no
  symptom at all: rename `build` and `prebuild`/`postbuild` stop running, so the
  corpus is not re-derived and the HTML is not minified, and the build exits 0.
- **`package-scripts.test.ts` asserts six things**: no composite calls a missing
  script, no script names a missing `.mjs`, the three intended hooks still have
  their targets, no accidental hook exists, `deploy` and `preview:deploy` share
  their `build && preflight` gate, and `verify` still runs all three checks.
  Each was mutation-tested when written.

### `preview` cannot see the edge, and answers wrong rather than refusing

`vite preview` is a static file server with SvelteKit's SPA fallback in front of
it; `src/worker.ts` never runs, so every behaviour the worker owns is absent —
and absent as a plausible 200:

| request                | `npm run preview`  | `npm run preview:edge`        |
| ---------------------- | ------------------ | ----------------------------- |
| `/catechismus/999999`  | **200**, the shell | 404                           |
| `/scriptura/josh/1`    | **200**, the shell | 301 → `/scriptura/iosue/1`    |
| `<title>` on a chapter | `Glossa Catholica` | `Joshua 1 — Glossa Catholica` |
| `_headers`             | not read           | `Parsed 6 valid header rules` |

So the head-rewriting half of this file, the route manifest's 404s, the OSIS
301s and the cache policy are all unverifiable under `preview`.
`npm run preview:edge` is `wrangler dev`: the real worker over `build/`, with
local D1 for the beacon and `_headers` applied, served over `127.0.0.1` — a
secure context, so the real service worker still installs. **Prefer it;
`preview` has no remaining advantage but startup time.**

**`npm run preview:deploy` is `npm run deploy` with the deploy removed.** Reach
for it rather than the two separately: neither server rebuilds, and preflight is
what turns a fixture build or a boot-payload regression into a refusal instead
of a puzzle.

**`npm run dev` is still the only place a missing primer throws.**
`requireIndex` throws under `import.meta.env.DEV` and warns everywhere else, and
`npm test` cannot reach it. A build-and-serve loop is not a substitute for dev;
it is the other half.

### Dev-server traps

**Do not run `npm run build` while `npm run dev` is running.** `prebuild` runs
`sync-corpus` in full, which DELETES every entry under `src/lib/corpus-data/`
before writing thousands of files back. A dev server reloads the page into a
corpus that is half gone: every eager index glob comes back empty,
`listBibleWorks()` returns `[]`, and a valid chapter gets `error(404)` —
"Nothing at this address" at every address, until the server is restarted.

- **`vite.config.ts`'s `server.watch.ignored` now covers `corpus-data/`**, so
  the wipe no longer tears the page. It costs nothing: dev never re-derived the
  corpus anyway, and the globs resolve at transform time regardless.
- **The six derived files under `static/` are wiped in the same breath and are
  still watched**, so a reload can still land mid-sync. The failure is retryable
  rather than terminal.
- **`npm run dev:clean` is not a remedy for this.** It clears
  `node_modules/.vite` — Vite's DEPENDENCY pre-bundling cache, whose one symptom
  is `Pre-transform error: … deps/<name>-<hash>.js`. Three caches get confused
  for each other here; the corpus wipe touches none of them.

**A rejected promise must never be memoised.** `corpus.ts`'s `readContent` wrote
the rule for the content tier; the index tier shipped without it and cost more,
because a content read that never retries costs one text while an index that
never retries costs every address in that work type. `retryable-once.ts` is the
rule as a tested primitive — use it for any new module-scope `Promise` memo.

**A load that threw is not a missing address.** `+error.svelte` has three
states, picked by `error-view.ts` (a policy module, because nothing renders a
component under `vitest`): 404 → `NotFound`; a throw with offline mode on →
`NotDownloaded`, which carries the switch; a throw while ONLINE → `LoadFailed`,
which carries the retry. The third used to fall through to the first, telling
the reader their address did not exist and sending them away from a page one
retry from working.

**`npm run dev` does not re-derive the corpus**: `predev` passes
`--changed-only`. `sync-corpus.mjs` fingerprints six input sets into
`site/scripts/.sync-corpus-state.json` (untracked) and records them only where
the run reaches its last line, so a tripped gate is never skipped over.

- **`prebuild` deliberately does not pass it** — a deploy always derives in
  full, which keeps "a run that skips is only as good as its list of inputs"
  from reaching a reader. Do not "make it consistent".
- **The run says which part moved** (`corpus, ledger moved — rebuilding`).
- **What it cannot see is `npm install`** — the same gap `rebuild.py` documents
  for `uv`. `--force` is the answer, and it still records state.
- **Deleting the state file costs one full sync, never a wrong one.** Same for a
  corpus `git checkout`: the digests are `size:mtime_ns`, so identical bytes
  under new mtimes force one needless rebuild — the only direction this may err.

**Editing a `.ts` module reloads the page, editing a component does not, and
that is not a misconfiguration.** Components are their own HMR boundaries; there
are zero `import.meta.hot` calls in `src/`, so a plain-module edit walks
unaccepted to the root and Vite issues a full reload. Before "fixing" it: a bare
`import.meta.hot.accept()` re-executes the module, building a new `$state` proxy
while rendered components hold the old one — the page keeps showing old strings
with nothing erroring. Re-measure with the websocket (`vite-hmr` subprotocol;
`full-reload` vs `update` is the whole measurement), never by eye.

**`optimizeDeps.include` pins every dependency reached only by a dynamic
import.** `JumpBox.svelte` loads `fuzzysort` with `await import()` deliberately,
and Vite's dep scanner does not find it, so it is discovered while the page is
already loading. Vite then rewrites `node_modules/.vite/deps/` under fresh
hashes and forces a reload, and every request still in flight against the old
names 404s as `Pre-transform error: The file does not exist at
.../node_modules/.vite/deps/<name>-<hash>.js`.

**That error string has been misread once.** It was read as a service worker
serving a stale shell, and `vite dev` was stopped from registering one (since
reverted): the worker is a real hazard, but it was not this, and
`register: false` cannot evict a worker already installed. **The cache being
swapped is the SERVER'S, not the browser's.** Tell them apart by where the
answer comes from: `/usr/bin/rm -rf node_modules/.vite`, load one page, and read
the dev log — `dependency optimized: <name>` followed by `optimized dependencies
changed. reloading` is this, and nothing in the browser is involved.

**The other cache was a real hazard too, and `vite dev` now uninstalls it.**
`vite.config.ts`'s `glossa:dev-service-worker` plugin resolves
`src/service-worker.ts` to `src/service-worker.dev.ts` under `serve`: a worker
that caches nothing, intercepts nothing, and on `activate` drops every
`glossa-*` cache and unregisters itself. Both premises the real worker's caching
rests on are false against the dev server:

- **Content URLs are not content-hashed in dev** (`/src/lib/corpus-data/…`) and
  `CONTENT_CACHE` is unversioned, so `cacheFirstAndStore` pins the first read of
  a corpus file to that path permanently. Re-run `sync-corpus` and the browser
  serves the old text; restarting the dev server does not help.
- **`version` changes per dev-server PROCESS, not per deploy**, and the shell
  precache includes `/`. So `src/app.html` edits appear to do nothing until the
  server is restarted, which is what makes "restart it and it's fine" read as a
  Vite problem.

There is a third cost that is not staleness: in dev the real worker's module
graph is nine modules and 9.03 MB, most of it `content-manifest.json` and its
inline sourcemap. A service worker is stopped when idle and started again on the
next event, and a controlled page's requests wait behind that start. The dev
twin's graph is two modules and 11.9 KB. **Substituting the module is what
`register: false` could not do**: it keeps SvelteKit's registration exactly as a
build has it and changes only what gets registered, so the eviction reaches the
profiles that need it. **`npm run preview` is where the real worker is
exercised**, and always was.

**The worktree trap shrank but did not vanish.** The default is
`../../glossa-corpus` resolved from `site/`, so a worktree beside the main
checkout finds the corpus. Anywhere else the site silently falls back to the
test fixtures — two Bible books, which looks broken in a confusing way. Set
`CORPUS_DIR` there.

`npm test` always uses fixtures: `corpus.ts` checks `import.meta.env.VITEST`
explicitly. The absence of a `pretest` hook is _not_ what guarantees this. The
fixtures deliberately contain absent chapters and out-of-range cross-references
to exercise the not-in-corpus paths.

**Do not drive the site with browser automation to verify UI changes.** The user
does that verification themselves.

## Deploying

Live at <https://glossacatholica.org>, on Cloudflare Workers static assets
(`site/wrangler.jsonc`).

```sh
cd site
npm run deploy      # build -> preflight -> wrangler deploy
```

- **`npm run deploy` is the whole thing.** Running `wrangler deploy` by hand
  skips the build and preflight and ships whatever is in `build/`. There is no
  CI build; a deploy ships one person's working tree.
- **From a worktree not beside the main checkout, set `CORPUS_DIR`.** Preflight
  refuses a fixture-sized build, so the worst case is a refusal.
- **Deploys are not sandboxed** — `wrangler` needs the Cloudflare API.
- **The file count is not the thing to watch** (cap 20,000; exactly two of the
  build's files are HTML). `npm run preflight` prints the real number and its
  share of the cap. The bulk is content-hashed corpus JSON, which Wrangler
  dedupes.
- **What is worth watching is `run_worker_first` in `wrangler.jsonc`.** It must
  stay a list of navigation patterns with `!` negations for everything static.
  As the boolean `true`, every request is a billed invocation, and past the free
  plan's 100,000/day the platform answers **429 instead of serving the asset** —
  the whole site goes dark until 00:00 UTC. (A cold visitor filling the offline
  library was ~2,240 invocations, about fifty readers a day.) Anything new in
  `static/` still works un-negated; it silently costs an invocation per request.
- **A `.txt` in `static/` needs its charset declared in `_headers`, or its
  typography is mojibake.** Cloudflare infers `text/plain` from the extension
  and appends no charset, so the reader's browser default decodes it —
  `llms.txt`'s em dashes arrived as `â€”` for as long as the file has existed.
  Only the extensionless formats need it: `.html`, JSON and `.xml` each declare
  their own. `_headers` itself is in `.prettierignore`, prettier having no
  parser for it and the hook reading its complaint as a failure.
- **A failed sync leaves nothing that looks synced.** `sync-corpus.mjs` clears
  `corpus-routes.json`, `route-titles.json`, `apparatus.json`, `works.json`,
  `sitemap.xml` and `reference-coverage.json` in the same breath as it wipes
  `corpus-data/`, and writes them back on the way through — so they exist only
  where a run completed. Before that, a gate tripping between the two left
  everything back on fixtures under the previous run's route manifest, and
  preflight approved the build, because the manifest is what it reads to tell a
  corpus from fixtures. **A new derived file belongs in `derivedFiles`**, or it
  is the next one to survive a failure. `lastmod.json` is the deliberate
  exception and says why.
- **A `lastmod.json` conflict is resolved by keeping both sides' addresses.**
  Taking one side whole loses the other's, no run counts them as withdrawn, and
  the next sync re-dates every one of them today — seeding cannot rescue them
  while `build/` is untracked. Three ceilings guard the ledger and only the
  third sees this one, which is why it is a refusal rather than a note here.
- **Preflight checks the corpus, not the page count**: it refuses a build
  reporting fewer than 100 works or 100 content assets, and a build whose
  reference coverage dropped more than 3% in any family against
  `scripts/reference-coverage.baseline.json` — every grammar regression so far
  was silent. `npm run coverage:accept` records an intended new floor.
  `REFERENCE_COVERAGE=verbose npm run sync-corpus` prints what the grammar
  recognized nothing in, which is where coverage work starts.
- **`postbuild` minifies the built HTML and then refuses a build that still
  ships a comment.** `src/app.html` is the most heavily commented file in the
  repo and the document served at every address; `scripts/minify-build.mjs`
  strips `build/` and leaves `src/` alone. Nothing upstream does this: SvelteKit
  does not minify HTML and no Vite hook sees the file. Do not reach for
  `sveltekit-html-minifier` — it loops over `builder.prerendered.pages`, and
  this build has none. `commentsIn` reads a page as the two or three syntaxes it
  is. The audit scans HTML, JS, CSS and XML and deliberately not JSON. A vendor
  licence banner is the realistic first failure — keep it and record it in the
  script's `ALLOWED` rather than deleting a copyright notice to quiet a build.
  `.well-known/security.txt`, the `fonts/OFL-*.txt` licences and `_headers`
  keep their comments on purpose. `robots.txt` is four directive lines and no
  prose: what it used to explain is `docs/decisions.md` §Indexable and
  `shellLinks`' docblock, and five places pointed at the file for it.

## The bar is five doors, and adding a work does not add one

Rationale in `site/docs/finding.md`.

- **`NAV_ITEMS` names doors, not works** — Bible, Prayers, Library, Calendar,
  Learn. A newly ingested work goes on a shelf in `/bibliotheca` and, where it
  belongs there, on a route in `/schola`; it does not get a bar entry.
- **The footer is the full index, which is what lets the bar stop**: works from
  `visibleShelves()`, pages from `FOOTER_PAGES` beside `NAV_ITEMS`. A bar has
  one line and a footer has none, so the two answer different questions — do
  not compose either from the other, and **do not move the colophon link out of
  the footer without lengthening `footer.notEndorsed`**, which is short on the
  strength of being able to reach it. The `<nav>`'s own name must differ from
  `nav.menu`, or two landmarks announce as "Menu".
- **Both footer columns are alphabetical in the READER's alphabet**, sorted at
  render through one `Intl.Collator(bcp47(...))` — an index at the foot of
  every page is looked up where a catalogue is read, and a column ordered by
  the English labels is alphabetical for one reader in thirty-seven.
  `$lib/shelves.ts` still owns what is in the works column and the gate on it;
  only the order is the footer's. `/quaestiones` sits in that column and not in
  Pages, being a way into the works listed beside it rather than site
  furniture.
- **`Learn` names `/schola`, a guide, and not the Catechism.** It pointed at
  `/catechismus` for one day: a table of divisions is unusable by the reader the
  word was chosen for, who cannot yet name a part (`audiences.md` §5). The
  Catechism is the one work with no bar door, which is why `isActive` lights
  nothing on `/catechismus`.
- **`/bibliotheca` must stay a superset.** It lists every work including the
  ones with their own door. A Library holding only what the bar left out is a
  leftovers bin.
- **The box completes the headings inside a work, out of one shard per
  interface language.** `index/section-headings.<lang>.json`, resolved at
  build time to the edition each work will open in — so the reader fetches
  ONE (65–100 KB gzipped) on first opening the box, and gets their
  neighbour's headings for the works their own language has no edition of.
  `suggest()` takes it as an ARGUMENT, never from a registry; the pruning
  rule is `src/lib/section-headings.ts` and the design is
  `site/docs/finding.md`.
- **A table a build script and the browser must not disagree about lives in a
  leaf module.** `content-fallback.ts` holds `CONTENT_LANG_FALLBACK` because
  the shards resolve the same chain `editionInLang` does and Node cannot
  import `corpus.ts` — `lang-names.ts`'s precedent, and it imports
  `./lang-names.ts` WITH the extension or the sync cannot resolve it.
- **A heading and a topic rank below every NAME.** One work's title names the
  work; a heading is one line inside one edition, and there are five thousand
  per shard against fifteen hundred names (`SCORE.heading`, `SCORE.topic`,
  four rows and three).
- **The box's empty panel prints the notation of every work, and its query
  survives the close.** One row per work out of `$lib/specimens.ts` — the
  fourth surface to want that table, so it is a module rather than a fourth
  copy — and a row fills the FIELD rather than navigating, which is the one
  thing an inert chip on a page cannot offer. Reopening finds the old query
  selected, so the legend is what a reader who has not used the box sees.
- **A legend prints the form a reader TYPES; a catalogue prints the form the
  work PRINTS.** `comp 123` in the box against the `Comp. 123` the edition
  itself prints — `fold` and `sectionForm` mean both resolve, so the stop and the capitals
  only tell a reader that characters they need not type are load-bearing.
  Punctuation that MEANS something stays: Scripture's separator is the
  chapter/verse mark, and `specimens.test.ts` puts both forms through
  `suggest()`.
- **A scope is a section word and a colon** — `ccc: church`. The left side is
  whatever `matchSections` already resolves, in every language, which is why it
  is a colon and not `in:`; literal tiers only, so `jn 3:16` is untouched and a
  misspelled section is not a filter. A row is filed by the longest
  `SECTIONS.path` its href sits under, never by `SuggestionKind` — `heading`
  belongs to three sections. It narrows the merged list and no producer.
- **The legend IS the listbox while the field is empty**, so choosing a work
  there needs no new control and no new key: the two lists are mutually
  exclusive. A row is a work rather than a destination, so Enter arms it, Tab
  completes its citation, and a printable character does both at once. One row
  per `SECTIONS` entry — nine, two of which have no citation to teach — and
  `specimens.test.ts` welds the hand-written paths to `SECTION_PATHS`, since
  `specimens.ts` must not pull `suggest.ts` into the boot payload.
- **Every row in the box wears its work's mark**, the legend's and the chip's
  beside a name and the result's in place of one. A glyph replacing the only
  words that say which work answered owes a text alternative, not a second
  channel — `Icon.svelte` enforces `aria-hidden`, so the badge's words stay
  in the row, visually hidden, and are what the option still announces.
  **Shape is not the colour rule**: 1.4.1 is about colour and a distinct shape
  is its remedy. The mark comes off `Suggestion.section` — the address, where
  the badge is a name — so `suggest.test.ts` welds the two.
- **An armed scope is a CHIP in the field, and the colon alone arms it.**
  `ccc:` read as a keyword also went to the loose title tier, which answered
  it with two magisterial documents; it now answers with that section's
  landing row and nothing else. The chip is a real element rather than styled
  text — `JumpBox` holds a token and a term and recomposes them for
  `suggest`, `.field` carries the border the input used to, and the chip is
  the one tabbable control in the panel because it sits before the input.
- **Sections a reader can type are `suggest.ts`'s `SECTIONS`, not the bar.**
  Every work with an index belongs there whether or not it has a door, and
  `scripts/export-section-names.mjs` must be re-run and its output committed
  after any `nav.*` or `*.abbrev` change (`section-names.test.ts` fails
  otherwise).

### `/schola` and the chrome guide

- **`/schola` is a catalogue, and the citation forms are in the jump box.** One
  row per work, flat, each with a name that opens the work and one sentence
  saying what kind of thing it is. Every row carried a second line and a
  specimen chip of the notation until 2026-09-10; the box's empty panel prints
  that table now, on the legend-against-catalogue rule two bullets above, and a
  row there fills the field where an inert chip on a page could not.
  `$lib/specimens.ts` is the box's and its own test's — and the `schola.cite.*`
  keys went out of every dictionary with the row.
- **A work with no index of its own is not a row.** The Catechism and its
  Compendium are one, `ccc.landing.pairTitle`, because `/catechismus` indexes
  both and two rows were two names for one door — the call `shelves.ts` had
  already made for the catalogue card. **Above 80rem the order is read as
  PAIRS**, the grid being two tracks filled row by row: a source beside a
  source, and under each the volume that gathers it.
- **A row listed here is a row the site HAS**, which is what `/quaestiones` and
  the census arriving on the page a year late say: a guide listing what existed
  when it was written is a guide that is quietly wrong. Questions is gated on
  `hasTopics()`, `ShelfGrid`'s own test, because a door onto
  `quaestiones.landing.none` is worse than no door.
- **`/schola` primes `bible` alone, and linkifying anything on it costs two
  more indexes.** `refHref` validates an address before it mints one, reading
  the Summa and document registries as well as the Bible's — so the page that
  calls it owes all three (214 KB before first paint), which
  `index-priming.test.ts` asserts and which the appendix section below was
  written against. **`index-priming.test.ts` only catches priming too LITTLE**,
  so over-priming has to be pruned by hand.
- **The chrome guide is the sheet `?` opens**, `Help.svelte` over `$lib/help.ts`,
  and the button is named Help rather than Keyboard shortcuts. A guide printed on
  a page of its own describes controls the reader cannot see while reading it, so
  **the sheet draws only the rows whose control is on the page in front of
  them** — learnt from `data-help="<key>"` on the control itself plus
  `checkVisibility`. No route registers anything, and the same reading is what
  empties the sheet in focus mode. `help.test.ts` scans the source both ways,
  because a described row nothing marks and a marked control no row describes
  look identical to a control that is simply not on this page.
- **Rows are named by their control's own key** — `install.label`,
  `compare.enter`, `document.tableOfContents` — so a row and the control it
  describes cannot be called two different things in a translated interface, and
  **the icon is the glyph that control draws**. Only the sentence under each
  (`help.feature.*`) is new writing, and a new one costs thirty-six dictionaries.
- **A row has to teach something the control does not, and the panel a control
  opens is part of that control.** A group heading says WHERE, so the one group
  left is the reading bar's — the bar a reader does not always have. The jump
  box's row went when the box grew a legend of its own: a guide that teaches the
  same notation one panel further from the field is a second copy that can fall
  out of step with the box, so `JumpBox` carries no `data-help` at all.
- **A control headed by its own name is a SECTION** (`HELP_SECTIONS`), and the
  install button is the one left: a heading naming the bar every page carries,
  standing over one row, sends a reader looking for a list that is not there.
- **Nothing in that guide is a page.** Library, Calendar and Bookmarks are
  addresses, not controls, and are a group under `/schola`'s works. What the
  sheet holds is exactly what no link can reach.
- **Headings run h2 section, h3 group, h4 row**, on the page and in the sheet.

### The formulas of Catholic doctrine

- **IT IS HELD OUT OF PRODUCTION** (2026-09-11, by direction — it needs review
  nobody has done yet). `FORMULAS_HELD` in the page; it draws under
  `npm run dev`, and a production build folds the constant, drops the `{#if}`
  and references no `index/formulas.*.json`, so nothing fetches. The
  component's CSS and the two dictionary strings still ship, Svelte emitting
  the first regardless and the second being data. `held.ts`'s argument for a
  calendar, applied to a section: derived, readable, deliberately not served.
  Publishing again is that one line.
- **The one section on the site whose every word is the Church's, and it cost
  one key.** The Compendium's appendix prints the ten commandments, the
  theological and cardinal virtues, the seven capital sins, the Beatitudes, the
  works of mercy and the rest; `compendium.py` parses it, `sync-corpus.mjs`
  writes `index/formulas.{lang}.json`, and the section renders it. The
  alternative was two dozen names as interface strings in thirty-seven
  dictionaries — our words for the Church's list, drifting.
- **It draws in the reader's own language or not at all, and `loadFormulas` is
  the gate.** It read `langFor('compendium')`, which answers English for a
  language the corpus cannot meet — so a Japanese reader saw the English
  appendix under a Japanese heading. It reads `i18n.lang` now, and a language
  `sync-corpus.mjs` wrote no file for gets nothing. **So `schola.formulas.*` is
  in ten dictionaries and not forty**: a string no reader of that language can
  reach is one the next translator keeps true for nobody, which is what the
  `schola.cite.*` keys went out on. Nothing in the code lists the ten — a list
  is a second place to update when an eleventh edition is read.
- **A held section is not translated yet, and that is the general rule.**
  `schola.formulas.heading` is English in `en.ts` and absent everywhere else,
  which falls back silently and is legal. **Translating to every language is one
  of the LAST things done to a surface, because the chance of rework is
  significant** — this section is held for a review that may well rename it.
  `schola.formulas.decalogue` is in all ten because those values already
  existed under the old key, so keeping them cost nothing.
- **Nothing there is ordered or selected by the site, and exactly one thing is
  named.** The editions disagree about order and item counts, so
  `formulas.json` carries no key (`docs/corpus-schema.md`) — a heading is the
  edition's and so is its order. The exception is the Decalogue, which no
  edition NAMES: English heads it "A Traditional Catechetical Formula", so
  `schola.formulas.decalogue` says "the ten commandments" and a reader scanning
  for them stops. A trailing colon comes off every heading the editions print
  with one; a colon inside a Scripture reference stays.
- **It closes the page and every formula is folded shut** (2026-09-11, by
  direction). Open it is the longest thing on the page and the only quoted text
  on it; shut it is a dozen names of lists, which is what a reader who came for
  the ten commandments scans. `<details class="fold">` — `disclosure.test.ts`
  fails on a `<details>` without the class — and every summary but the
  Decalogue's is the edition's own heading, so the shut state is a table of
  contents nobody wrote.
- **The headings are not linkified**, and six of them print a Scripture
  reference. That is the specimens' lesson a second time — a reference inside a
  heading on a catalogue page is a door into the middle of a work the reader
  did not choose — and it is also what keeps the page at one primed index.
- **A reader whose edition has none gets no section and no sentence.** Four of
  the fourteen are PDFs nothing has read; a line apologising for that would be
  this page explaining its own pipeline. `/bibliotheca/census` says so because
  that page is nothing without its numbers; this is one section of a page that
  is whole without it.

### The reading suggestion

- **Two sections advise, and their headings are what mark them** — "New to
  Catholicism?", "Never read the Bible?", the reader's own question. Every other
  section is titled by what it lists. Both earlier marks are gone: an accent
  rule read as a blockquote, and an attribution line was small print explaining
  a distinction the layout was failing to draw. **A convention that must be
  learned is worth less than a sentence that explains itself, and a caption is
  worth less than a heading that makes it unnecessary.**
- **The Church states a narrative frame and never a reading plan**, which is why
  that section can exist at all and why it has to be ours. `Dei Verbum` 25 names
  a priority and no sequence; `Verbum Domini` 41 gives a hermeneutic, not an
  order; CCC 54-64 cite no books. Which Gospel to open first is genuinely
  contested, so the page offers the three that are argued for with their
  arguments and picks none. `†` marks the two sentences that lean on a document.
- **A sourced order still has to be a beginner's order**, and that second test
  ate the first: `/schola`'s sourced routes are gone and `learning-routes.ts`
  with them. Each cited the document in this corpus that stated its order — a
  sound rule that produced a page whose most useful sentence for a newcomer was
  the one it would not say. (One of them also filtered on `document_kind` alone
  and put two Vatican I constitutions at its head: **a `kind` is not a
  provenance**.) `site/docs/finding.md` keeps the three defects those routes
  paid for.
- **The Bible section is three numbered stages, and the numeral is IN the
  title.** A 2.25rem gutter column bought a straight edge down three figures and
  charged every paragraph and card in the section an indent from the page's own
  margin, which is the shape of a quotation. Here the cards ARE cards, where the
  books section argues the opposite for its rows: a catalogue entry is read, and
  these are CHOSEN BETWEEN. **Every card carries a reason** — a card's second
  line is not for telling one book from another, it is for telling a reader who
  has never opened a Bible what they would be opening.
- **Nothing on `/schola` is measured.** `.landing-measure` on a `<section>` caps
  its heading rule too, so a heading ruled two-thirds of the way across a page
  whose every other rule ran full width; moving it to the paragraphs fixed the
  rules and left the real complaint, that a 40rem paragraph in a 72rem column
  breaks against a wall the page never draws. **Leading carries a long line
  where a cap would fence it** — 1.62 on the running prose. The other landing
  pages still measure their prose.
- **The picture is the hinge, not the masthead**: it sits between the sections
  that LIST and the two that ADVISE, the one place on the page where the voice
  changes. `/bibliotheca` keeps the same component as a masthead.

### Pictures

- **One picture per landing page, and it earns the page by a sentence that
  would be false of the others.** Antonello's Jerome is a man alone in a room
  full of books, which is a library; Raphael's disputing doctors are people
  arguing about one thing with the answer on the table, which is
  `/quaestiones`; Michelangelo's two hands are Genesis 2:7 and do not touch,
  so what crosses the gap is a word, which is what a text is. A sentence true
  of every page names decoration.
- **Rows in `assets/README.md` for withdrawn pictures are struck through rather
  than deleted**, a URL and a SHA-256 and a crop box being enough to bring one
  back. Delete the row instead when the picture returns in a shape it cannot
  describe — the Disputa came back off a different scan at a different ratio,
  and a recipe for a file nothing asks for is worse than none.
- **A caption says "(detail)" only where the picture IS one** — a band cut out
  of a much taller painting, which three of the four are; without it the credit
  would tell a reader the work itself is that shape. `/scriptura`'s is the
  panel entire and says nothing, the flag being a claim about the file and not
  a house style. `art.detail` and `art.about` are the two keys the whole set
  costs, and they are `art.*` rather than `schola.*` because four pages read
  them. A caption is `Artist, Title, year. Institution.`, held in
  `landing-art.ts`. Only ink on a white sheet may take `--plate-blend`, and
  `[data-mono]` desaturates every one.
- **Hand work keeps its master only where a crop box cannot say what the hand
  did.** Jerome is a crop AND a tone-correction, so the 12 MB source is
  `authored/art/hero-jerome-adjusted.jpg` in `glossa-corpus` under LFS, this
  repository being public; the drollery's 777 KB master stays here, **the rule
  being the bytes and not the principle.** A band cut by eye in an editor is
  still a faithful crop if it is only a cut: recover the box (match per-row
  averages against the master, then PSNR a re-cut against the file) and record
  that instead of committing the cut.
- **A picture may ship twice at two framings, and then the second is what
  opens.** `landing-art.ts`'s `whole` is a different framing, not more pixels of
  the same one — `/quaestiones` draws the Disputa's earthly register and a press
  opens the whole fresco, which no band across its bottom third can show. Two
  framings are two ratios, so `ArtFigure` hands the viewer the intrinsic pixels
  belonging to whichever it opened, and the caption drops its "(detail)" because
  the whole work is not one. Not `PlateViewer`'s `detailSrc`, which is the same
  framing at more pixels fetched on zoom. It costs the free open: the band is in
  the cache and the whole is a fetch.
- **The test is whether a press SHOWS anything new, not whether the page's file
  was cropped.** `/scriptura` runs the relation backwards — the page draws the
  Creation panel whole and a press opens that panel in its SETTING, the vault
  around it — so the field is named for its first case and limited to neither
  direction.
- **A second framing may be a second FILE, and then it is a second file page
  too.** `/scriptura`'s band is a Commons derivative of the file its `whole`
  ships — the panel rotated and straightened, published in its own right and
  declaring `Extracted from` — so `whole` carries its own `source` and the
  viewer links whichever file the reader is looking at. Two fetch rows in
  `assets/README.md` and no crop box for either.
- **Hand work published upstream needs no master here.** A rotation and a
  perspective correction is what the rule above says keeps its master, and this
  one's master is a Commons file with a page, a licence tag and a SHA-256 in
  that table — **the rule is about a derivation nobody can reproduce, not about
  whose hand did it.**
- **A credit is behind an `i`, not set under the picture, and the arrangement
  is `CreditCard.svelte`** — the credit, whether it links, and the print line,
  shared by `Plate` and `ArtFigure`. The mark and the popover under it are
  `HintNote`'s, one variant apart: a plate's follows the caption on the page's
  own ground, a painting's is laid on the picture, having no caption row to
  follow. `label` is mandatory in both — a glyph has no text to take a name
  from, and it names the picture, since a chapter draws twenty-seven.
- **A caption is type and the glyph beside it is the control.** A plate's whole
  title was the disclosure button — correctly named by its visible text, and an
  affordance a reader could not see, with a hit area the width of the words. A
  surface with something further to say draws the one mark every other surface
  draws.
- **A component's own rule outranks a global utility class on the same
  element, by scoping alone.** Svelte compiles a scoped class to
  `.that-class.svelte-hash`, two classes against `.menu-trigger`'s one —
  so a shared base carrying `border: 0`, `background: none` and `font:
inherit` beat the square that class exists to draw, and the overlay trigger
  rendered as a bare glyph on the painting. **Anything a variant means to
  INHERIT from a global class has to stay out of the base**; only what every
  variant wants belongs there. The mirror of the rule above it — a class
  borrowed across a component boundary is silently unstyled, and a class
  restyled inside one silently wins.
- **A scoped class still wears every GLOBAL rule of the same name**, scoping
  narrowing what a component's own rules reach and not what reaches its
  markup. `HintNote`'s panel was `note`, and `.note` in `styles/menus.css` is a
  settings caption carrying `white-space: nowrap`: the caveat rendered as one
  unwrapped line off the side of the card, styled by a file that component
  never mentions. **Check a new class name against `styles/` before using it**,
  the generic ones — `note`, `line`, `title`, `head` — being where this lives.
- **Extract a component when a POLICY is being decided twice, not when the CSS
  looks similar.** Those two agreed on 18 of the 36 declarations in their four
  paired rules, which on its own would not have been worth a third file: most
  of what differed was context, not rot — a plate's card inherits its face from
  the `figcaption` it lives in and a painting's has nothing to inherit from.
  What earned it is that whether a credit LINKS got answered `yes` in one file
  and `no` in the other, and neither knew the other had been asked. **The
  picture did NOT move**: an `srcset` over two renditions with a zoom that
  fetches a third is not the same problem as a band cropped by `--art-height`
  with a second framing behind it, and one component holding both is two modes
  and a flag.
- **The credit is the anchor everywhere it is shown**, `PlateViewer` included
  since 2026-09-11 — it was a dead line there, which is the one view where the
  reader is looking AT the picture. The URL travels as its own prop because
  `credit` is a composed STRING, the arrangement that lets a route hand the
  line down to components that know no corpus and no dictionary; a string
  cannot carry a URL, so **a composed-string boundary silently drops whatever
  made the claim checkable.** `Plate` passes none: the plates' `provider_url`
  is a courtesy link to the provider's gallery, not a licence page. **And the
  page it names is the SHOWN file's**, which is the artwork's only until a
  `whole` brings a second one.
- **`ArtFigure` reads `--art-height`** and crops to it with `object-fit:
cover`; `/bibliotheca`'s 300px band is a WINDOW, `expandable` putting the
  picture in `PlateViewer`. Set that prop only where there is something behind
  the picture — a height cropping it, or a `whole` — since a picture that is
  drawn whole and has no `whole` would be a control promising nothing.
- **The height follows what the picture's subject is.** A room's subject is
  central, so a band slices it and the ends are what `cover` may eat; a frieze's
  subject IS its span, so `/quaestiones` derives 16.5rem from the column's
  69.5rem and the file's 4.21:1 and loses nothing at full width. Below that
  width `cover` crops the ENDS, so a frieze wants a SHORTER band on a phone, not
  a taller one — the opposite of `/bibliotheca`'s call.
- **A picture inside a list divides it, so the picture goes after the list.**
  `/scriptura`'s hung on the seam between the Testaments for part of a day —
  the most interesting place to put it and the wrong one, since 73 books are
  one canon and a band across the middle is a page break the corpus does not
  have. All four close their page now.
- **How tall the band is and WHICH band it is are two questions, and centring
  only answers the second while the file's ratio is near the slot's.** Jerome
  is 2.2:1 in a 2.3:1 box, so the window is nearly the whole file and
  `assets/README.md`'s rule — centre the band on the file and let `cover` find
  it — settles it. `/scriptura` is 2.15:1 in a 3.9:1 slot, where the middle
  gives God an arm and no head: one figure with a face and one without reads as
  a crop that missed. `--art-position` is the page's second knob for that, and
  **the crop is baked into the file only where the file and the slot want the
  same window at every width** — baked in here it would also be all a phone
  could show, where `cover` flips to cropping the ends and a narrow screen
  wants the panel back.
- **A caption's "(detail)" is a claim about what the reader SEES, not about the
  file.** That band's file is the Creation panel entire and `detail` is still
  true, because the slot crops it — a picture the page crops is a detail
  however whole the bytes were.
- **A slot with no caller is machinery.** `BookChapterPicker`'s `seam` snippet
  outlived the picture it was cut for by an hour and went with it; git has it.
  While it existed it silently broke `.testament + .testament` — **an
  adjacent-sibling rule stops matching the moment something may come
  between**, which is the half of such a slot nothing type-checks.
- **A heading that names what the page already is earns nothing, and the
  landmark around it goes too.** `/scriptura` titled its one list "Books" under
  a title saying Bible; with the heading gone the `<section aria-labelledby>`
  had nothing to be named by, and a landmark announcing itself as untitled is
  worse than none — the picker's own testament headings already put that list
  in the outline. **Delete the key from every dictionary in the same commit**,
  since nothing flags an orphan.
- **The viewer's surround BLURS where the browser can and is only dimmed where
  it cannot.** Dark was the means and not the end: what has to stop is the page
  competing, and opacity alone was also erasing the one cue saying the reader
  is standing over the page they came from. Text stops being text at about 12px
  of radius whatever it says, so the tint drops from 82% to 62% — welded to the
  blur by `@supports`, since either half alone is worse than the fallback —
  with `saturate(70%)` so a colour wash does not smear onto the plate, and
  `prefers-reduced-transparency` getting the opaque end of the trade. One
  full-viewport filter, composited once: the page under a modal does not
  repaint, and zoom and pan move layers above the backdrop.
- **A class that supplies a link's clothes must not also supply its colour.**
  `PlateViewer`'s credit wears `.viewer-credit` and `.source-link` at once;
  the second was copied from `CopyrightNotice` carrying `color: inherit`,
  right where an anchor sits inside a paragraph that owns the colour and wrong
  where the anchor IS the credit. Equal specificity, so SOURCE ORDER decided
  and the later one won: every credit in that view rendered in the page's
  `--color-text`, dark on a dark scrim, from the day the line became a link.
  **Two rules setting `color` on one element is a silent bug — nothing warns,
  and the surviving rule looks deliberate.**
- **Measure the pixels before theorising about a contrast complaint.** That one
  was read twice as a consequence of the blurred backdrop and patched twice on
  that reading — a raised alpha, then a text-shadow — neither of which could
  reach a colour that was being overridden. Sampling the screenshot settled it
  in one step: ground `rgb(97,97,97)`, exactly the 62% scrim over white and so
  working as designed, with glyphs DARKER than it. A shadow under dark text is
  a halo, not a contrast.
- **Fixed light values in that view are still a wager on the page behind it**,
  which is the real thing the blur changed: at 82% the ground was near-black
  whatever was under it, and at 62% some of a nearly-white `--color-bg` comes
  through. So the caption carries its own dark ground (`text-shadow`,
  inherited by title, credit and link together) and the bar's glyphs the same
  as a `filter: drop-shadow`, an `<svg>` taking no text decoration. Where
  contrast is scarce, rank by TYPE rather than by alpha: the credit sits 3
  points below the title and a size and a case below it, where it used to be
  33 points and unreadable.
- **`†` links carry no `title`.** Those get the site's own preview card, and the
  platform's tooltip draws on top of it. The `aria-label` stays.
- **The definitions take icons, not paintings.** A painting beside a definition
  is something to look at while reading the sentence; a glyph belongs to the
  row. **Illustration goes above a route, not beside a definition.**

### Page shapes

- **The landing pages are `.landing-column`, not `.content-column`** — `/`,
  `/bibliotheca`, `/schola`, `/calendarium`, and `/scriptura` since
  2026-09-11. `--content-width` is a count of CHARACTERS (`--measure-cpl`) and
  is the wrong tool for a page made of doors and grids; `layout.css` holds all
  three shapes. Prose on such a page takes `.landing-measure`, the measure
  without the column. `.index-column`'s 52rem is a table's width and is
  neither.
- **Being under a reading route does not make a page a reading page.**
  `/scriptura` wore `.reading-layout` for its geometry alone — so that stepping
  into a chapter moved nothing sideways — and paid for it with 73 book chips
  and nine headings set in a column sized for a sentence, at less than half the
  width the same grid gets elsewhere. **A lineup between two pages is worth
  less than either page being the right shape**; the step is visible now and
  that is the trade.
- **`/documenta` and `/preces` are the third shape and need BOTH classes**
  (`.reading-layout index` around a `.landing-column`): a landing page with an
  aside. Without the `index` the grid places `.content-column` and nothing else,
  so the column is auto-placed into the 21.5rem apparatus lane with the reading
  track empty beside it, and nothing errors. `layout-placement.test.ts` catches
  the next one. Its width is `--index-width` (62rem), not `--landing-width`: an
  index is sized by its row's first line. **A document card is four stacked
  full-width blocks** — title and kind, date and author, the description, the
  subjects — and **the description carries no max-width**. Two attempts to fill
  the empty half a 60ch measure left in a 62rem track failed the same way, by
  moving things into it rather than letting the text have it.
- **A section of a folded index is `IndexSection.svelte`** — the
  `<details class="fold">`, the `<summary>` with its heading, the optional
  count beside it, the rule under an OPEN heading, and the space — one row's
  worth above every heading whatever its state, and the rem and a half an open
  section adds BELOW, for its rows. Opening a section must not move the heading
  the reader just clicked. `/quaestiones`, `/preces` and `/schola`'s formulas draw the
  same one and pass their rows in as `children`: a grid of title-over-question
  cells, a multicolumn list of names and the Church's own lists are different
  objects and are the seam. **No variant and no flag** — the rule being drawn
  only while a section is open is what retired the objection to it (sixteen
  ruled headings at rest are a grid rather than sixteen landmarks; shut, they
  draw none). Two props say what a caller can differ about: `level` (3 where
  the sections sit under a `<section>`'s own `h2`, the face and size not
  changing with it) and an OPTIONAL `id`, a catechetical formula having no key
  it could be addressed by.
- **A folded index states its DEFAULT and nothing else** —
  `$lib/fold-state.svelte.ts`, which `/quaestiones`, `/preces` and `/schola`
  run on their own. Three rules live there because each is invisible when it
  is wrong: a live query forces every surviving section open; it records none
  of that, so clearing the box restores the reader's own folds; and a fragment
  opens its own section, a browser opening a closed `<details>` only for a
  target INSIDE it. **A toggle that agrees with the default records nothing**,
  or a viewport crossing a breakpoint writes down folds the reader never chose
  and the page stays folded at a width with room for it.
- **A row that is a way out takes `.pointing-row`** (styles/components.css):
  a `⬝` where the row begins, growing into EB Garamond's manicule while the
  pointer is on its LINK — `:has(a:hover)`, never `:hover`, or the hand
  promises a click that dead space does not answer. `/quaestiones` and
  `/preces` both set their rows in columns, which is what makes the mark
  necessary: across columns a wrapped title's second line and the next row's
  title start at the same edge. **A second copy of that content declaration
  fails `pointing-row.test.ts`** — the mark, the `unicode-range` and the
  family name have to agree, and where they come apart the gutter gets a
  colour emoji and nothing else can see it.
- **Every `<details>` takes `.fold`** (styles/components.css), and
  `disclosure.test.ts` scans the source for the ones that do not. Nine surfaces
  open one and they had reached three different marks — a chevron at the row's
  end, a `▸` at its start, the browser's triangle on the rest — which is one
  mark too many for a reader who learns it once. The class carries the mark, the
  native-marker reset, the coarse-pointer target and the ROW'S ANSWER — accent
  on hover and on focus, three surfaces having lit their words and six the mark
  alone, and only one of the three answering a keyboard. **A surface declares
  `--fold-ink` on its own element and never a `color` on its summary**, the
  heading inside taking `color: inherit`: the shared answer and a scoped
  `.x > summary` are both (0,2,1) — Svelte 5 hides the hash in `:where()` — so
  they tie and the component's later stylesheet wins, which silenced four
  surfaces in one commit. Set on the summary and inherited from the surface,
  no comparison happens at all. `disclosure.test.ts` scans for the `color`.
  A summary's own LAYOUT still stays with the surface, and **the space belongs
  to the OPEN state** — one row's worth above every heading whatever it is
  doing, the extra below an open one, four surfaces at four values.
  **A glyph is the wrong instrument for a mark**: `▸`
  sizes with the text, so at an index heading's 0.85rem it lands at seven pixels
  and reads as a speck.
- **A line that qualifies rather than says goes behind `HintNote`**, not into
  markup of its own: the `i`, the popover, `role="note"`, the panel's measure
  and the state under them are the component's, and a surface passes a label
  and either `text` or its own markup. Six surfaces had written that out by
  hand and had drifted to two measures. **Paper is the caller's half** — a
  popover never prints, so each prints its own line (`.caveat-print` and its
  siblings) where the reader cannot press anything.
- **A mark beside a heading is sized by the heading, and a fixed `rem` box
  cannot be.** These stand next to type from 0.8rem to a page title; at one
  size the smallest of them was half again the height of the words it was
  offering a footnote about. **A sibling's font-size cannot be read in CSS**,
  so the row declares `--hint-size` and the mark is `em` off that — the row's
  own size being the default, and right wherever the heading does not set one
  of its own.
- **The catalogue is one component**: `ShelfGrid.svelte` over `$lib/shelves.ts`
  (the entries and `visibleShelves()`) and `ShelfCard.svelte`, because
  `/bibliotheca` and the home page both draw it. The list, the card and the grid
  class were shared while the `<ul>`, the `{#each}` and the gate were not, and
  the two pages promptly disagreed about what the catalogue contains: **a shared
  class fixes a copied style, not a copied assembly.** Only the wrapper is the
  page's — a `<section>` where the cards are the subject, a `<nav>` where they
  are the way in.
- **A glyph is looked up, never chosen** — `$lib/work-icons.ts` is the one
  vocabulary, works keyed by `WorkType` and places by the address they open,
  so no surface declares an `icon` of its own. Three tables had each picked
  the same marks separately and agreed, which is the danger rather than the
  reassurance: nothing would have said so if they had not.
- **One card per work, no nesting**, each one anchor. A shelf could hold rows
  and exactly one did, and that one shelf was
  what kept the card from being an anchor (an `<a>` inside an `<a>`). The `<h3>`
  lives INSIDE the anchor, which is valid and keeps the named things in the
  outline. Its glyph is centred in a `1lh` box at the start of the text column,
  not baseline-aligned: a box with no text in it offers its bottom edge as a
  baseline, so a 1em mark stood a full em over capitals reaching seven tenths.
  Every card is the height of the tallest (`grid-auto-rows: 1fr`), so a long
  tagline costs the whole grid.
- **The bed is `minmax(min(16rem, 100%), 1fr)` with `grid-auto-rows: 1fr`, and
  it is inside `ShelfGrid` rather than in `components.css`** (a shared class is
  for a pattern with several unrelated callers; this has one). Four columns at
  the full `--landing-width` is what a catalogue wants. **Write the track
  minimum with a `min()`**: a bare `24rem` laid the cards out 384px wide inside
  a 350px column and ran them off the side of a 390px phone.
- **There is no Learn shelf and the Summa has no row.** The Catechism and its
  Compendium are one card (`/catechismus` indexes both); the Compendium of the
  Social Doctrine is its own. The taxonomy argument that grouped them —
  synthesis read THROUGH against dated acts cited SINGLY — is still true and
  needs no container, since one card per work makes the ORDER say it.
  `/doctores` keeps its card and its caveat.
- **The last three cards are not works, and only Questions is on both pages.**
  A topic list is a second index over the works, so it goes wherever the
  catalogue does; Bookmarks and the census are `/bibliotheca`'s, declared as
  PROPS (`<ShelfGrid bookmarks census />`) rather than appended by hand,
  because what the catalogue holds and how far it reaches are facts about the
  catalogue where the home page is a way in to the works. A card that is drawn
  is drawn unconditionally on the READER — Questions' `hasTopics()` gates on
  the build. None has a row in `$lib/shelves.ts` and none needs one, which is
  why `ShelfCard` takes strings.
- **No page in this group writes a sentence of its own except the home page.**
  The catalogue's cards reuse the key each destination is already titled and
  described by, the same rule `route-titles.mjs` follows for the `<head>`.
  Adding a shelf should add no dictionary key; if it does, check whether the
  destination really has no tagline. The exceptions are
  `ccc.landing.pairTitle`/`pairTagline` — one card names the Catechism and its
  Compendium as ONE work and no other surface wants either string.
- **A landing page's tagline is its `<meta name="description">` and its card's
  line, and is not drawn on the page** (2026-09-11, by direction) —
  `/scriptura`, `/bibliotheca`, `/schola`, `/preces`. A sentence saying what a
  work is earns a search result and a grid of seven cards; under the work's own
  name, over its own index, it captions something already named. **The key
  stays**, so each page carries a comment naming who still reads it.

### The home page

- **The home page is the day and the catalogue** — two of `organization.md`'s
  three ways in (by date, by question); the third is by ADDRESS, and it is the
  jump box in the header of every page rather than anything on this one. A row
  of inert specimens naming that box stood here until 2026-09-11, last on the
  page, for the reason it did not need to be on the page: a reader who knows
  `CCC 1234` types it into the box without reading this. **Do not put an index
  on it**: it carried the Bible's whole table of contents and the Catechism's
  whole outline until 2026-09-04, which is why nothing ingested after them was
  ever added to it — a WEIGHT problem that reads as a nesting problem.
- **Everything on the page is true on a first visit**, which is the test a new
  section has to pass. "Continue reading" went for that reason, and the
  Bookmarks card after it: the one page a stranger arrives at was arranged
  around a state only a returning reader has.
- **The way to the calendar is a glyph in the day card's own corner**
  (`LiturgicalDayCard`'s `more` prop, passed by nothing else): under the box it
  read as a caption on the card rather than as part of it.
- **No section on that page is titled**: every `h2` is `visually-hidden` and
  every one still exists, since rules labelling what the cards already say made
  the page read as a form. The ruled-heading rule has been deleted twice and is
  not coming back.
- **`/` keeps its `CHROME_PATHS` row even when it holds an untranslated key** —
  the one exception to the gate that holds pages unpublished. It is the ROOT's
  exception: withholding the home page costs the sitemap row and the `hreflang`
  cluster the whole site's ranking leans on. `route-manifest.ts` carries why
  this is not a precedent.

### `/signata`: the marks, and the position beside them

"Continue reading" lives here too, uncapped, above the marks. A position and a
mark answer one question (take me back to where I was) and are opposite in how
they got there: a mark is a decision, a position is a trace kept without being
asked. Split across two pages, a returning reader had to know which one had kept
their place. Two sections, not one list, and the trace goes first.

- **The key is `reading.continue`, named for `reading-position.ts` and not for a
  page.** It was `home.continueReading`, then `library.continueReading`, and
  each rename was the key having made a claim the code stopped keeping.
- **One row per work TYPE, and the types are discovered.** `continueRows` reads
  the reader's own positions; it replaced a literal list written when four types
  existed, under which a reader halfway through the Code got no row.
- **`/signata`'s title and tagline still name the marks alone** — the accepted
  cost: renaming a route and two strings in thirty-seven dictionaries to cover a
  section one heading already names is a larger claim than the page is making.
- **A section of the library is a work TYPE, the Magisterium included** — every
  one but topics, which is not a work at all and files after the lot. Each
  document had a heading of its own until 2026-09-09, on the "Cited in" panel's
  rule — right for one passage's references, and a shelf per book for a reader's
  whole history. `compareDocuments` is what those headings were really carrying:
  a document's marks stay together, `/documenta`'s order, newest first.
- **A section heading is a `Record` over `BookmarkGroupKey`, never a prefix
  test.** The chain of `if`s it replaced ended in a `document:` slice, so the
  canon law and topics sections each drew an empty `h2` from the day they were
  added — a chain that looks exhaustive twice over.

### Type: two faces, and what each may claim

- **The corpus's words take the text face wherever they stand** — running text,
  a work's title, a division's name — including on a chrome surface that is
  otherwise sans. **The exception is a heading that is itself a CONTROL**
  (2026-09-11, by direction): `/preces` sets its section headings and its
  prayer titles in the interface face, those rows being a fold over a filtered
  list of names and the prayer's own language being on the prayer's own page.
- **Ours take it only where they are read at length** — the colophon,
  `/schola`, a topic's note, the error pages. A label, a count, a filter, a
  caption and a gloss are operated rather than read, and take the interface
  face. Having written it is not by itself a claim to either face.
- **A heading of ours is a label wherever it stands**, including at the head of
  our own prose: those four surfaces set their paragraphs in the text face and
  their headings in the interface face, which is the arrangement the colophon
  already had in `.label-micro`. The corpus's heading is not a label — a work's
  title and a division's name are its words, and clause one governs them.
- **A heading takes the face of the surface it is on**, so `base.css` declares
  no family for `h1`–`h6`: a surface that reads declares the text face on its
  own container and its headings follow. The blanket rule this replaced
  outranked `.reading-text`, so the work's section heads stayed in Garamond
  when a reader switched the reading region to the sans face.
- **Every number a face is worth is derived, not recalled.**
  `scripts/face-metrics.py` walks the corpus and the font files for the advance
  and the two ink measurements `tokens.css` states and `reading-face.test.ts`
  pins — measuring at wght 400, because a variable font's default instance is
  not always it and Source Sans 3's is 200. Run it before editing any of those
  numbers; it reproduces the committed ones to four places.
- **A heading that names a face is claiming the work's words on a chrome
  surface** — a reading page's `h1`, an index row's title. Our own label never
  does: `Old Testament` over a picker and `Holdings` over the census take
  whatever the surface around them is in. Rationale in `site/docs/reading.md`.

### Colour: two token families, and what each may claim

- **`--shelf-*` is the literal and `--pigment-*` is derived from it.** The
  literal is a colour somebody would name out loud (red, orange, gold, green,
  teal, blue, purple, magenta); the pigment is that literal mixed halfway to
  `--color-text-muted` (`color-mix(in oklab, <seed> 50%, var(--color-text-muted))`),
  so one definition serves every theme. `/schola`'s icons take the first,
  `CitedBy`'s marks the second, and a shelf therefore has one colour and two
  presentations. `pigments.test.ts` fails on a `--pigment-*` written as its own
  literal.
- **`--hue-1` … `--hue-8` are the same eight in an order, for lists that want
  variety and not identity** — the chrome guide's controls, the rows that are
  pages rather than texts, the books of the reading suggestion. A shelf colour
  is a claim; most coloured lists make none. They are ALIASES, so each follows
  its theme family and `data-mono` flattens them through what they point at.
  **The order is interleaved rather than spectral** — walked in declaration
  order a list gets red beside orange beside gold, three warm neighbours a
  reader has to look at twice. `pigments.test.ts` fails on a literal written
  into one, and on a ramp that is not a permutation of the shelves.
- **`/schola`'s marks are ONE accent, not a colour per work.** They were eight
  colours for a day: **past a certain count a colour stops picking a row out and
  becomes the page's texture.** What keeps its variety is the reading
  suggestion's cards, a list a reader is choosing BETWEEN; there the colour is
  in the EDGE alone, a 3px head rule, because eight tinted grounds were eight
  coloured boxes competing with the words in them. The per-row mark that
  survives is the icon's SHAPE — a scroll, a scale, a feather.
  `pigments.test.ts` fails if the guide names a `--shelf-*` again.
- **Check `tokens.css` before opening a token family, not after.** `/schola` and
  `CitedBy` both reached for `--pigment-*` in one afternoon with different
  keying; convergence on the shelf-keyed one cost the guide nothing it wanted.
- **A colour's name lives at a particular lightness**, which is why the literals
  are per theme family where the mixes are not. Brown is dark orange, olive is
  dark yellow, navy is dark blue. Three schemes tried to compute a legible icon
  out of one literal and each turned the warm half of the palette to earth
  tones: **holding one lightness across the hue circle is exactly what destroys
  a colour's name.** Lightness has to vary per hue AND per ground, which is two
  degrees of freedom no single literal has.
- **The floor for a shelf colour is 3:1, not 4.5:1.** It is set on a 1.35rem
  icon beside the work's own name in words, so nothing is told apart by hue and
  none of it is required to understand anything — the graphical-object bar,
  taken as a courtesy. Measured worst 4.15 light, 3.43 sepia, 6.11 dark. Sepia
  and OLED restate none: those move a ground, not a palette.
- **Monochrome has to restate the literals**, because `--pigment-strength: 0%`
  cannot reach them — they are values, not mixes. `data-mono` needs two dials
  (`--pigment-strength: 0%` and `--pigment-icon-c: 0`), because a consumer that
  overrides chroma is out of the first one's reach.
- **Where a pigment may go is arithmetic.** The family resolves to 3.4–4.2:1 on
  a dark ground, which is a decoration's contrast and not a text colour's — so
  `/schola` spends it on a 1.35rem icon, on 1.6rem serif stage figures (large
  text, a 3:1 floor it clears) and on card borders and washes, and its card
  names stay `--color-accent`. If a pigment ever becomes the only thing saying
  which work a row is, it owes WCAG 1.4.1 and cannot pay it.
- **A rule that sizes both kinds of icon may not colour either.** A
  `.book-icon { color: var(--shelf) }` sat above a
  `.feature-icon, .book-icon { … color: var(--color-accent) }` — same
  specificity, later wins — so every shelf icon was the house red at rest and
  took its colour only on hover. Three rounds of palette work went into a
  feature that only ever appeared in a hover state: **a cascade bug looks
  exactly like a design problem and will absorb as much design work as you give
  it.** Colour is stated per kind, after; `pigments.test.ts` fails if that rule
  regains a `color`.
- **A card's name is accent at rest, because the card IS a link.** Holding the
  colour back for hover reads on a touch screen as a paragraph in a box.
- **An accent is the cheapest structure on a landing page.** Section rules and
  chrome icons take `--color-accent`, mixed toward the border or the ground
  rather than filled — four sections divided by four hairlines in the same grey
  as every card border is a page with no landmarks in it.

## `/quaestiones`: a topic is a doorway, and one paragraph may come first

Reader questions anchored to spans of the numbered works (`site/quaestiones.json`,
rationale in `site/docs/topics.md`, selection in `docs/research/topics.md`).

- **Anchor a CCC span; never list passages.** The Scripture and the magisterial
  citations come from those paragraphs' own footnotes, which `ProseBlocks`
  already linkifies — CCC 2357 carries `Gen 19:1-29` and `Persona humana 8`
  without anyone here choosing them.
- **Three works are quoted and one is listed.** `ccc`, `csdc` and `canons` name
  spans of works this site addresses a unit at a time, so the page prints their
  text under a heading each; `documents` names whole works, which no topic can
  quote, so it prints titles. Each block resolves the reader's language on its
  own — nine editions of the Catechism, ten of the Compendium, seven of the
  Code.
- **Name `csdc` where the Compendium develops what the Catechism summarises**,
  and nowhere else: work is CCC 2426-2433 against a hundred-section chapter, and
  ninety topics carry no `csdc` because the Compendium says nothing about
  purgatory or scruples. **Name a canon where the law settles the question** —
  can. 1176 answers a reader asking about cremation and a link reading `1176`
  did not.
- **`lead` reorders a span and never trims one**, and the page says so whenever
  it has: CCC 2283 before the three paragraphs on the gravity of suicide is an
  arrangement, and an undisclosed one would be the gloss `docs/decisions.md`
  §Posture forbids.
- **`editorial` is the only sentence of ours on a topic page**, declared per
  topic and currently on one. It is earned by a false belief the corpus cannot
  dislodge — a canon does not print the penalties it declines to impose, so no
  quotation tells a reader that Freemasonry stopped meaning automatic
  excommunication in 1983. The disclosure is the heading, which names this site
  where every other block names the work it quotes, and **a note owes a
  `editorial.sources` line** — the one paragraph resting on nobody else's
  authority is the one that cannot be traced from the line it is on. Tests pair
  the flag with both strings in both directions and cap how many topics carry
  one.
- **That footing's citations are ADDRESSES, not words, and the page links
  them.** `editorialSources` names the units, `citationFor` labels each in the
  reader's own language, and the sentence keeps only its prose around
  `{sources}` (`src/lib/topic-sources.ts`). Every unit must be one the topic
  already anchors, or the sync exits 1 — which is what makes the line's own
  claim, that all of it is printed or linked on this page, true by construction.
  `linkifyProse` is still the wrong instrument and the reason has narrowed: it
  is careful because it reads somebody else's text and has to INFER what a
  number is, and none of that applies to a sentence written here.
- **A topic's summary is one the Catechism wrote**, never one composed here:
  `brief` names paragraphs flagged `in_brief` (548 of the 2,865, in all nine
  editions), so the short answer above the passages is still quotation with an
  address behind every number. The sync refuses a number the Catechism did not
  flag, and one the topic's own spans already cover.
- **The topics are in the sitemap and `/quaestiones` is still out of
  `CHROME_PATHS`.** A cluster claims the page exists in 37 languages and
  `quaestiones.*` is written in two; a `<loc>` claims only that the address
  exists, so the index and the 141 topics are listed once, unprefixed
  (`site/docs/addresses.md`). A topic's head is its own two strings — the title
  as the route writes it, the question as the description — and its `<lastmod>`
  is composed from the fingerprints of the passages it prints, a document
  contributing its title and not its text.
- **A topic the corpus cannot answer properly does not ship**, and the gap is
  written down instead — the held set is in `docs/research/topics.md`, and
  `fiducia-supplicans` is the case that matters, since the three earlier
  documents ARE here and a stale answer reads as a current one.
- **A doorway sorts and a cluster is what the page draws.** Sixty topics under
  one heading is a wall, so each topic also names a shelf; `quaestiones.json`
  declares each doorway's clusters in the order the page draws them, and
  deriving that order from the topics would let a reordered list silently
  reorder the headings. **The doorway itself heads nothing** — "what people
  argue about" is true of all sixteen shelves — and it stays in the file
  because it is the question a topic is filed by and the thing that orders the
  shelves.
- **A shelf heading names its contents, where a topic's question names a
  situation.** The shelves are the whole navigation of that page and are read
  shut, so each has one line to say what is behind it; a name may not claim more
  than the shelf holds ("Morality" over thirteen contested teachings) or use a
  word about the reader they may not use of themselves ("Purity").
- **A cluster is a `<details>` shut by default, and two rules keep it usable**: a
  live query forces every surviving shelf open (three closed headings read as no
  results), and the page opens the cluster a fragment names, since a browser
  opens a closed `<details>` only for a target INSIDE it and the id is on the
  cluster itself. **A topic page's middle crumb is that fragment** — most
  readers reach a topic from a search engine, and without it the way back was
  sixteen shut shelves saying nothing about which one they had left.
- **Read `descriptions.json` before naming a document.** A title is a poor
  oracle: `veritatis-splendor` sounds like the document for faith and works and
  is about the moral act, and it sat under `iustificatio` until the description
  was read.
- **Two doors are two topics only where they change the answer.** `abortus` and
  `post-abortum` differ in anchor and in order; six candidates were dropped for
  resolving to a shipped topic's paragraphs in a shipped topic's order.
- **A new document reaches the footnotes by itself and the `documents` array
  never.** The citation text resolves at render time, so an ingest relinks every
  topic that cites the arrival; the named list is hand-written, and so is
  lifting a topic off the blocklist.

## `/documenta` filters, and the one editorial file behind them

A search box over a facet panel (author, kind, subject) above a flat
reverse-chronological list.

- **Author and kind ADD, subject SUBTRACTS, and that asymmetry is the field's
  arity**: a document has exactly one author and one kind (AND of two is empty
  by construction) and carries three subjects on average. Two parts break if the
  predicate is flipped back: the subject counts are taken against the FULLY
  filtered set, itself included, so a term's number is exactly what survives the
  click; and `liveTags` drops terms at 0 rather than greying them — a dead term
  in a cloud has no weight, renders at the floor size, and reads as a live chip
  that does nothing. A selected term is always live, so filtering can never make
  a filter unreachable.
- **The kind facet is folded, like the author one, and by the same file.**
  `documentKindKey` files `cdf-responsum` under `cdf-declaration` and
  `cdf-doctrinal-note`/`cdf-considerations` under `cdf-letter`: the doctrinal
  office held six of thirteen rows for 8% of the corpus, three of them offering
  one document each. **The predicate and the facet must fold the same way** or a
  selection matches nothing. The row's chip and the search box still read the
  raw `document_kind` (`src/lib/document-labels.ts`).
- **Each facet is a `<details>` and SUBJECT is closed**, being the tallest and
  the axis a reader narrows with rather than arrives on. Its `open` is read ONCE
  (`subjectStartOpen`) and deliberately not `$derived` — a reactive expression
  shuts the section under a reader who unpicks their last term. The badge on a
  summary is how many values are chosen inside a folded one.
- **The author facet's years come from `src/lib/pontificates.ts`, a TABLE.**
  Deriving the span from the documents is wrong in a way that looks right
  (first/last `promulgated` shorts every reign). The corpus CHECKS the table
  instead: every author's span falls inside its reign. `to: null` renders as a
  trailing en dash, deliberately not the word "present" (a chrome string in
  thirty-four dictionaries). Lookup by `Object.hasOwn`; an unknown name gets no
  years rather than a guess.
- **Matching and marking are one function**, in `src/lib/highlight.ts`:
  `filterByQuery` and `highlight` share a fold and the same `occurrences` tiers,
  so a row is on the list exactly when the highlighter has something to draw on
  it. Matching ANDs tokens where `highlight` ORs them (filtering strict, marking
  generous); a test pins the agreement. The search reads a document's whole
  metadata, AND-ed with the facets.
- **Every box that filters a list takes a misspelling, and a guess is what a
  list FALLS BACK to** — `filterByQuery`, used by `/documenta`, `/quaestiones`,
  `/preces` and the four menus. Mixing loose rows in beside literal ones widened the 400
  commonest words of the corpus by 35%, and no token-length floor separated
  that from the repairs. A caller that filters row by row instead has silently
  opted out (`site/docs/finding.md`).
- **The LITERAL tier is the argument, the loose one never is.** `/quaestiones`
  matches a bare substring anywhere and passes its own `readsLiterally`; a
  surface that wants its own idea of "near enough" is writing the second
  implementation this arrangement exists to prevent. **Bringing one is the
  exception and needs a claim about the VOCABULARY** — that page's rows are
  sentences, where `/preces` filters short names and takes the default.
- **A route's own filter box wears `.list-filter`** (styles/components.css),
  and the page keeps only where the field sits. Four surfaces had written the
  same declarations out and every comment cited the others, which is a copied
  style and not a decision being made twice; the three inside a panel, a
  sticky band or a dialog keep their scoped blocks, that context being what
  they actually differ in.
- **The fallback is decided once per LIST, not per row and not per pool.**
  `/documenta` decides against the whole corpus and AND-s the result with its
  facets; deciding inside a facet would make a word spelled correctly elsewhere
  behave like a typo the moment a reader clicked an author.
- **A loose reading owes the four characters an interior literal one owes.**
  `rav` is contiguous inside "Ingravescentibus" and the literal tier refuses it,
  so a three-letter subsequence would be `MIN_INTERIOR` removed by the back
  door. Three was safe only while `loose` marked rows a RANKER had chosen.
- **`loose` marks by density or by distance, per token.** A subsequence explains
  a row only where the marks fill half the span they cover (`dani` found four
  letters across thirty of a Summa title), and a transposition is no subsequence
  at all, so a second pass marks the whole word within one edit — `deniel` →
  "Daniel". A subsequence also walks over a field seam `indexOf` cannot, so it
  is confined to one field (`site/docs/finding.md`).
- **`site/document-tags.json` is the subject vocabulary and it is CLOSED**, in
  its own `vocabulary` array, keyed by document SLUG (a tag is about the
  document, not an edition — the one difference from `descriptions.json`).
  `sync-corpus.mjs` **exits 1** on a tag outside the list, a slug naming no
  document, two terms differing only in case, or an empty/padded tag. A term on
  no document is a warning; a missing FILE is fine.
- **The vocabulary was curated by reading, not counting**, and three of its
  lessons generalise: a term is too generic when it names what a document DOES
  rather than what it is about (the signature is FLAT co-occurrence across the
  vocabulary); counting a word proposes a candidate and reading the sentence
  decides it (the ancient heresies score zero in a Leo-XIII-to-Francis corpus);
  and a merge is a semantic act — check it against EVERY document it touches,
  not the archetype.
- **The subject facet is a cloud.** Three traps: the scale must renormalise
  against the CURRENT extremes (`src/lib/tag-cloud.ts`) or one click collapses
  it to the floor; the range is over POSITIVE counts only; and `CLOUD_SIZE_MAX`
  is a balance knob, not a size one — shrink from the top only, since
  `CLOUD_SIZE_MIN` is `--font-size-min` and the CSS clamps to it. **Colour is
  the second channel** off the SAME `weight`, mixed between `--color-text-muted`
  and `--color-text` — two tokens, never a literal black, which in dark mode
  would make heavier terms disappear. Cloud chips carry no border (58 outlined
  pills is 58 boxes competing with their own words); `.doc-tag` keeps its
  outline because three chips inside a paragraph do need an edge.
- **The terms are not translated and render verbatim** — a closed list could
  carry i18n keys, but that is ~2,000 strings and nobody has asked.
- **`DocumentFilters.svelte` is rendered twice on the page** (aside above 80rem,
  `<details>` below), which is why its options are `aria-pressed` buttons and
  not checkboxes (two elements claiming one `id`) and the search text is a PROP,
  not local state.
- **The search box is `DocumentSearch.svelte`, OUTSIDE that disclosure.** Inside
  the panel it was folded away with it below 80rem — the coarse instrument, shut
  by default, on the layout where a reader most needs it. It is rendered twice
  for the same reason the panel is, and `/quaestiones` keeps its own box in the
  column for the same reason.
- **The filters are deliberately not in the URL** — `?auctor=` would be a change
  to the sitemap, the route manifest, the worker and the usage beacon. The app
  does read and write the client URL in two places already (`?compare=`, `?v=`);
  the argument against a third is the cost, not novelty.

## The edge writes the head, from names and never from text

`ssr = false` means one document answers every reading address, so everything a
non-rendering consumer learns comes from `src/worker.ts`, which rewrites the
shell's `<head>` per address. The rewrite runs over a prerendered landing page
too: that page titles itself, but the canonical, the `hreflang` cluster, the
structured data and `data-geo` are the edge's either way.

**Some pages take a language prefix and the rest do not.** `CHROME_PATHS` in
`route-manifest.ts` lists them — the pages whose every word IS the interface, so
the Portuguese one is a different page. Read the list from the file, never from
a copy here. A reading address names a citation, the same in every language, and
takes no published prefix: prefixing them would declare `hreflang` alternates
serving byte-identical text through `CONTENT_LANG_FALLBACK`.

**`STATIC_PATHS` is a second table and a page needs both.** `isCanonicalPath`
decides whether a URL exists at all and reads both; the sitemap and the head
read only `CHROME_PATHS`. A new static route reaching neither answers **404 with
the app's own not-found UI on every cold load** while client-side navigation
into it works perfectly — the SPA router never asks the worker, so every way a
person checks by hand shows the page working. Two pages shipped that way.
`route-manifest.test.ts` walks `src/routes/` and fails on any static route
directory neither table admits, so **adding a route is now the assertion rather
than remembering to add it to a list.**

**That walk skips every `[dynamic]` directory, so a dynamic route owes its own
guard.** `calendarium/[calendar]/` is the case to copy: its `load` and
`isCanonicalPath` read ONE table (`CALENDAR_LANGS`), so they cannot disagree,
and `languages.test.ts` asserts every published id is canonical. A dynamic
route validating against a list of its own is the same 404-on-cold-load defect
with nothing walking the tree to catch it.

**A page joins `CHROME_PATHS` only when its own title and description strings
exist in every interface language** — a translation gate, not a routing one
(`site/docs/addresses.md` §Two tables). **The gate is on the PAGE, not the
head.** Two keys apiece would satisfy `CHROME_KEYS` while leaving a cluster in
37 languages over a page of English prose, which is the thing the gate exists to
refuse. `/schola` and `/calendarium` both teach a vocabulary to a reader who has
none, so both are the case where being false costs most. **Where the coded gate
and the argued one come apart, translate the page.**

**A cluster is thirty-five URLs, and the unprefixed one is not the English
page.** One prefixed member per interface language plus the bare path, which is
`x-default` because it NEGOTIATES; `/en/doctores` exists separately because
pinning English is not the same as negotiating and happening to get it. Every
member declares the whole cluster including itself, and every member
self-canonicalizes — a prefixed page canonicalizing to the bare path asks to be
de-indexed.

**The chrome heads are read out of the dictionaries, never written.**
`CHROME_KEYS` in `scripts/route-titles.mjs` names the keys, and every dictionary
must carry all of them. `chromeNames` deliberately does NOT fall back to English
the way `t()` does — a cluster whose Portuguese member is described in English
is the one failure an `hreflang` set is checked for, so a missing key fails the
sync. The cheap way to add a chrome page is a key the translators have already
written.

**`UI_LANGS` lives in `src/lib/ui-langs.ts`, a plain module** —
`i18n.svelte.ts` constructs its store at module scope (reads `localStorage`,
instantiates `$state`), impossible in the Worker and in Node, and the edge,
`route-manifest.ts` and the build scripts all need `isUiLang`. Use
`isUiLang`/`UI_LANGS`, never a literal list. `src/params/uilang.ts` is the
SvelteKit matcher; without it `[uilang]` would swallow every top-level path.

**Arriving at `/pt/...` persists Portuguese**, exactly as the switcher does. A
shared link changes the reader's stored choice — the cost; the alternative loses
them on the first click, because every link on the page is unprefixed. These are
entry points, not a parallel site, which is why nothing in the app builds
prefixed hrefs.

**`static/route-titles.json` may hold NAMES and never TEXT.** Book names,
document titles with author and year, prayer and Summa question titles, and
paragraph spans of titled divisions — the imprint of a work, the class of fact
`sitemap.xml` already publishes. It is what keeps `wrangler.jsonc`'s "never
reads or transforms corpus text" true. A Catechism paragraph or a verse would
make a better search snippet and must not go in.

**Three files, read through three separate module-global promises, because the
failures differ.** `corpus-routes.json` decides the STATUS;
`route-titles.json` only the `<head>`; `static/apparatus.json`
(`src/lib/apparatus.ts` / `scripts/apparatus.mjs`) the editorial description and
cross-reference apparatus. Losing the first costs the address, the second a
name, the third a description — merging them would let a missing title table
take the site down.

- **`apparatus.json` is the one exception to "names, never text", and the
  exception is precise**: a description is prose written HERE, by reading a
  document — the one running text on this site nobody else holds rights in
  (`llms.txt` offers it for quotation). The absolute rule it refines: a
  paragraph, an answer or a verse belongs to its publisher and reaches the edge
  in neither file, ever.
- **The links are stored as bare numbers and slugs and named from
  `route-titles.json`** — storing names twice is how two tables come to
  disagree.
- **A budget per KIND of link, not one total.** Filling a single cap in source
  order gave Genesis 1 eight Catechism paragraphs and no documents. `PER_KIND`
  is exported from `apparatus.ts` and imported by the builder, because the two
  numbers existed separately for one afternoon and half the table was shipped
  for nothing.
- **`static/works.json` is the other half and nothing here reads it** —
  published because `llms.txt` points at it as the file to read instead of
  crawling thousands of addresses.

**`static/llms.txt` asks to be cited, and used to ask not to be.** The
distinction it draws: **cite the publisher for the words, link here for the
locus** — vatican.va addresses a document, `/catechismus/330` addresses the
paragraph. It documents the address grammar in full so a client can construct a
citation URL without fetching, and one paragraph records the reversal on purpose
(a model trained on the old file carries the old instruction). Keep the rights
position exactly as strong when editing it. **`/quaestiones/{topic}` is the one
family that is an enumerated set rather than a grammar, so the file enumerates
it** — `{{TOPIC_LIST}}` is built by `topicList` from `quaestiones.json` and the
English dictionary, and a list written by hand would claim a completeness it
could not keep. **That list is the last section and everything added to the file
goes above it**: it is half the bytes and the only half that grows, so a
consumer that truncates has to lose questions rather than the rights position or
the publishers.

**The structured data is attribution and not a rich result.** `headHtml` emits
one `@graph` (`BreadcrumbList`, `WebPage`, the unit, the work); the publisher's
name and rights come off the corpus manifests, never a constant, and this site
appears nowhere in the work node. Two tested choices: **one script and one
graph** (an `@id` reference resolves only within the same page's graph) and
**`isBasedOn`, never `sameAs`** (`sameAs` asserts identity and concentrates
authority on the publisher). No Wikidata ids, no `inLanguage` — both would be
guesses, and a guessed imprint is worse than a gap.

**The kinds a build owes an imprint and an address are the CORPUS's, not a list
beside it.** `assertApparatus` reads every `manifest.type` and refuses one that
`WORK_KINDS` in `apparatus.mjs` does not answer for — iterating the imprint
table instead asks only whether the kinds it HAS are filled in, which the Code
of Canon Law and the Compendium of the Social Doctrine were routed, titled and
served past.

**None of this costs an invocation.** `env.ASSETS.fetch()` from inside the
worker is a SUBREQUEST — issued once per isolate in one `Promise.all` with the
shell — and the files are negated in `run_worker_first`, so a crawler reaches
the asset binding directly. What it costs is CPU on the first navigation (~1 ms
parse for `apparatus.json` against a 10 ms limit the rewrite already spends
6.56 ms of) — re-measure with `wrangler dev` if the table grows.

**`assertNamed` runs in the sync, not in vitest, and that is the point.** It
refuses a build where any address in `sitemapPaths` has no name of its own or
shares a title with another. The failure is invisible everywhere a person looks
(the page titles itself at hydration) — only consumers that never render see it,
none of which reports back. A new work kind ingested before `shell-head.ts`
learns its name fails the sync rather than shipping hundreds of pages called
`Glossa Catholica`.

**`titles.ts` and `inline-html.ts` import each other WITH the `.ts`
extension** — `scripts/route-titles.mjs` imports `displayTitle` under Node's
type-stripping loader. Tidying the extension away breaks `npm run sync-corpus`
with `ERR_MODULE_NOT_FOUND`, not the site.

**A new file in `static/` is precached for every reader unless a list refuses
it.** `sw-policy.ts` takes all of `files`; `INFRASTRUCTURE_FILES` (served to our
own infrastructure) sits beside `CRAWLER_FILES` (served to a stranger's
machine), and every entry also needs its `run_worker_first` negation in
`wrangler.jsonc`. **The negation and the precache list are separate mistakes
with separate symptoms**: miss the negation and it costs invocations, miss the
list and it costs every reader bandwidth, and neither failure says anything.
`sw-policy.test.ts` names all five files.

**Fonts are precached by SCRIPT, not wholesale.** Declaring a `unicode-range`
subset is close to free over HTTP and was false the moment the service worker
installed: everything in `static/` a list did not refuse was downloaded whole —
1,118 KB of woff2 for every reader, Arabic included for the English reader.
`DEFERRED_FONTS` in `sw-policy.ts` puts every face but the core Latin four in
the CONTENT tier (fetched on demand, stored on first read, outliving deploys);
the precache is 157 KB, an 86% cut.

- **On demand is not enough on its own** — a reader who fills the offline
  library needs the faces for what they downloaded, and a face nobody rendered
  has never been fetched. `fontsForLangs` warms the scripts the reader's own
  languages need (every client message already carries
  `contentLangChain(readerLang())`; the worker cannot read `localStorage`).
- **`greek` is the bucket no language claims, correctly** — an APPARATUS script
  no reader's language predicts. It stays purely on demand.
- **`la` is absent from the table, and the reason generalises: a language in the
  universal tail cannot be given a script.** `en` and `la` end every row of
  `CONTENT_LANG_FALLBACK`, so a `la` entry warms its subset for every reader on
  earth — it was there for one commit, for 19 glyphs of `ǽ`, at eleven times the
  font of the content it set.
- **`ig` takes the `vietnamese` subset, not `latin-ext`** — Igbo's dots-below
  vowels are in Latin Extended Additional, which the subsetter files under
  `vietnamese`. Looks like a typo, is not.
- **A face matching no bucket is PRECACHED**, silently — the safe, quiet
  direction. `sw-policy.test.ts` reads the real `static/fonts/` directory rather
  than a fixture for that reason. `CORE_FONTS` matches `-latin-wght-` WITH the
  trailing hyphen; dropping it silently matches `-latin-ext-wght-` too.

**The reading routes' own `<svelte:head>` titles have to match the shapes in
`shell-head.ts`**, in the reader's language — the edge writes one title, the
route assigns another at hydration, and a mismatch is a visible rearrangement on
every load.

**Existence is a property of the URL, and the worker must never read a request
header to decide it.** Broken twice in the same predicate: `isNavigation`
required `GET` (so every address 404ed to HEAD), then `Accept: text/html` (so
bare `curl` and several crawlers got 404 at every path except `/`, which
surfaced in Search Console as pages "not found" and read as a routing problem).
The predicate is now three: `isPageMethod` (GET or HEAD) gates the worker,
**`isCanonicalPath` alone decides the status**, and `wantsHtml` only settles
what a path naming NO address gets. A browser always sends both, so neither bug
is reachable by hand; check the edge with `curl` and no headers at all.

## The Compendium of the Social Doctrine: the Catechism's addresses over a document's files

`type: 'social-doctrine'`. That sentence is the whole specification:
`sync-corpus.mjs`'s branch writes what the DOCUMENT branch writes (chunked
`sections/` and `structure.json`, at paths the document readers already resolve)
and registers what the CATECHISM branch registers (a number set, chapter
anchors, an existence check). No second content tier, no second chunk stride, no
second reader.

- **A new work type must be added to `CONTENT_TYPES` in `sync-corpus.mjs`, or
  the sync excludes it and only warns.** That guard is right and caught this
  during a rebase: without the entry, all ten editions were skipped and the
  build still exited 0.
- **`content/{workId}/structure.json` is `{ header?, nodes }`, not a bare
  array** — `getDocumentStructure` reads a document's and this one's through one
  parser and returns `.nodes`. A bare array does not degrade; the first
  `.filter` on `undefined` throws, on every page of the work.
- **`socialDoctrineOutline` drops the unanchored rows and a document's outline
  does not.** `buildDocumentOutline` gives a heading with no `before` a sentinel
  past the last paragraph (`documentTailNumber`) so a whole-work page can scroll
  to it; routed rather than anchored, that sentinel is a link to a 404.
- **Every outline of this work leads into the CHAPTER, and one row is one link**
  (`socialDoctrineNav.ts`). The index, both sidebars and both breadcrumbs went
  four different ways before that module: a reader following a table of contents
  is going somewhere to read, and `/doctrina-socialis/{n}` is one paragraph out
  of a chapter of sixty. The index briefly gave each row two destinations, which
  is two tab stops and a distinction no reader asked for. `StructureIndex`'s
  `rowHref` stretches the title's anchor over the whole row, and `RowLink.href`
  is omitted so the chip renders as a `<span>`. The Catechism's index keeps two
  chips because it genuinely has two works.
- **`socialDoctrineHeadingHref` omits `#s{n}` at a division's own start.** The
  chapter page puts `id="s{n}"` on its INNER headings; the one opening the
  division is the page's `<h1>` and carries no such id, so the fragment would
  name nothing and the browser would leave the reader at the previous page's
  scroll offset.
- **`marker()`'s short form (`Ch. 5`) is wrong for this work, and the sidebar
  passes `deriveMarkers={false}`.** That form numbers a labelled heading by its
  position among its TREE siblings; the Compendium runs its twelve chapters
  straight through three parts, so Chapter Five read `Ch. 1` and its six
  siblings were numbered 2 to 7. Position is right wherever a part restarts its
  chapter numbering (Gaudium et Spes does) and wrong wherever it does not, and
  nothing in the tree says which: **the caller that knows says so**, and the
  label prints as the source prints it.
- **The widest division opening at a chapter anchor is NOT the chapter.** The
  source prints `PART ONE` on a page of its own with no name beside it, opening
  at the same paragraph as Chapter One and running three times as far — so
  `shell-head.ts` carries `socialDoctrineChapterNames`, read off the nodes that
  produced the anchors, and the chapter page does not use `widestAt`.
- **A heading's `level` is per-edition paint, so the outline is re-levelled onto
  the division anchors before the tree is built** (`levelSocialDoctrineRows`).
  The twelve chapters sit at level 2 in English and level 1 in Portuguese, and
  `hu`/`sw`/`vi` paint no level isolating them at all — so `buildDocumentOutline`
  gave `csdc.pt` 75 roots and `csdc.hu` 97. A root is always rendered, so the
  sidebar listed every chapter and every section inside it, permanently open.
  `socialDoctrineChapterStarts` is the one thing all ten editions agree on: rows
  above a division's heading are the part, the labelled row at the anchor is the
  division, and everything else keeps the edition's own relative depth below it.
- **Two calls to `socialDoctrineOutline` share no node, so nothing may compare
  them by identity.** `buildDocumentOutline` maps the stored `DocumentNode[]`
  into fresh `StructureNode`s every call, and both pages looked a division's
  depth up by scanning their own outline for `division.node` — a `===` that
  could never match. Neither failed: both took the `?? 0` fallback, so the
  landing page listed every chapter with one child repeating its own title and
  the chapter page printed its `<h1>` again as the first `<h2>` of its body.
  `socialDoctrineDivisions` returns the depth now.
- **The front matter has no page and `appendix.json` is not shipped.** Two
  prefatory documents are not what a reader arrives at this work for. The corpus
  still holds them; shipping the asset anyway would be a fetchable file no route
  reads.
- **The parts' epigraphs are on the section each part OPENS at, not on a
  structure node** (`DocumentSection.epigraph`). Half the editions have no part
  row to hang one on, so the chapter page tests its own first paragraph for the
  field — true on exactly the three pages that open a part, and it renders above
  the `<h1>`, which is where the book prints it.
- **A new work must be added to `EditionMenu`'s `context()` or it has no edition
  picker, silently.** This work was a `WorkTypeKey`, `listEditions` answered for
  it, the store and the fallback chain were complete — and its ten editions were
  unreachable from every page that read them for as long as that map had no
  branch, because the bar renders the trigger for no work at all rather than
  failing.
- **The chapter anchors are unioned across the editions that print a label**,
  and the seven that do agree exactly. §1 is added for the Introduction, which
  carries none; the CONCLUSION carries none either and reads as the tail of the
  last chapter's span. A known cost, not an oversight.
- **The back matter is labelled in the source's own words wherever it can be.**
  Each sigla table's disclosure takes the heading the edition prints over it
  (`CccAbbreviation.section`), so six editions cost no new strings; only the
  appendix as a whole needed one, because no heading in any edition names it.

## Offline mode: three gates, and the one the worker has to remember

Off by default, and **not in `SettingsMenu`**: the `Advanced…` row at the foot
of that panel opens `AdvancedSheet.svelte`, and the switch lives there beside
the library. `src/lib/offline.svelte.ts` is the feature's docblock.

- **Keeping it out of the front row is a measurement, not modesty.** The
  automatic waves put the shell, the prayers, the Compendium and one Catechism
  edition on the device and nothing else; Scripture, magisterium and Summa
  (23–28 MB each) arrive only if the reader asks. So the switch is worth little
  until a library is filled, and the two are one subject read in one order — not
  a row in the panel every reader opens to change the text size.
- **The width is why it stopped being a fold in that popover.** The panel is
  ~11rem, so a switch whose price is a whole sentence could only carry it as a
  `title` nobody hovers on a phone; the library, being byte counts and a
  progress bar, had to be a second dialog regardless.
- **The library block comes FIRST inside it.** Offline mode turns downloads off,
  so a reader meeting the switch before the shelf meets them in the wrong order.
- **Three gates because there are three mechanisms**: `sw.svelte.ts` (update
  check, offer, apply, and every download message — the gate sits in `#send`,
  the chokepoint), `usage.ts` (`#send` withholds the beacon; the session goes on
  counting locally), and `service-worker.ts` (cache-only, the only half that
  holds for a request no application code issues). Gating two of the three
  leaves the third talking.
- **The worker's copy is PERSISTED, in a cache of its own** (`glossa-prefs`): it
  has no `localStorage`, it is restarted freely, and the navigation that boots
  the app is answered before any page script runs. The page re-posts
  `OFFLINE_MODE` on every start as a correction, never as the source — a
  posted-only flag passes every manual test and fails once per cold start.
  `#post` exists because that one message must go THROUGH the gate in `#send`
  rather than obey it.
- **A miss is refused, never fetched** — `cacheOnly` answers 504 even when the
  cache itself throws, since an unreadable cache is not permission to make the
  request. `NotDownloaded` is told apart from a real 404 by the STATUS
  (`error(404, …)` is deliberate; a content read that threw is a 500).
- **`install` is deliberately NOT gated**, and it is the one download the mode
  cannot refuse: a worker activating with an empty shell cache cannot boot at
  all. The browser's own byte-check of the worker script is likewise outside our
  reach; both are named in `service-worker.ts`'s header rather than quietly
  ignored.
- **It made two latent bugs reachable**, both fixed with it: `corpus.ts`
  memoized rejected reads (fatal to a switch whose point is to be turned off and
  retried), and `LinkPreview` had no `catch`. **A failure path only ever reached
  by accident becomes ordinary here**; look for the next one the same way.

## The Advanced panel: waves priced before the reader commits

The consumer `planWaves`' byte counts were written for.

- **The rows are WAVES, not works.** A wave is every edition of a kind in the
  reader's chain, so "Bible" can be two editions and 24 MB. `requestWork` and
  `assetsForWork` exist for the finer grain and are still unused; that is a
  second level in this list, not new machinery.
- **Doré's engravings are a wave (`illustrations`) and never an automatic one.**
  482 AVIFs, 103 MB — four times the text corpus. `sync-corpus.mjs` pushes each
  image into `content-manifest.json` (`kind: 'plate-image'`, `relPath` under
  `plates/`) so the panel can price them, and `corpus-assets.ts` resolves those
  rows through `plateUrl` rather than the content glob — widening that glob
  would put a hashed URL per rendition of every plate in the boot chunk.
  `usage.ts` excludes them from `measureLibrary`'s denominator, or the `full`
  bucket would be unreachable.
- **The zoom renditions are a SECOND wave (`illustrations-detail`).**
  `PLATE_DETAIL_WIDTH` is 2000px and costs several times both served widths
  together, so folding `kind: 'plate-detail'` into `illustrations` would
  multiply the one number a reader reads before pressing a button and leave no
  way to take the pictures without them. Same exclusions as `plate-image`
  everywhere.
- **`CACHE_WAVE` accepts `wave: 'all'`** — every wave, on the explicit
  (ungated, whole-wave) side of the branch, reporting progress wave by wave. It
  is a `WaveRequest` and not a `WaveId` precisely so it cannot land in
  `WAVE_ORDER` and have `planWaves` try to fill it.
- **It plans the waves on the CLIENT, and that is not duplication.** The worker
  plans to fetch; this plans to PRICE, before the download exists for the worker
  to be asked about. `shelfPlan()` is exported from `sw.svelte.ts` precisely so
  both sides plan from the same input.
- **A shelf is planned with no page open, and `readerPlan()` is the wrong
  function here.** `planWaves` lifts the files either side of the reader's
  current page into `neighbours`, which the panel never shows — so a named
  download arrived with a hole in it, the panel priced the same hole out of the
  total so nothing said so, and the next navigation moved the hole: a row
  reading `26.5 / 26.6 MB` that no amount of pressing Download would finish.
  `shelfPlan()` is `readerPlan()` with `current` dropped, and
  `service-worker.ts` drops it too for any `CACHE_WAVE`. `neighbours` earns its
  carve-out in the AUTOMATIC pass and nowhere else.
- **The rows are read in `SHELF_ORDER`, which is NOT `WAVE_ORDER`.** The
  download order is a priority (descending value per byte, so `illustrations` is
  last and decides what an interrupted fill got to); the panel is a list of the
  library's parts, where Doré's plates are a thing about the Bible and sit under
  it. Only `libraryRows`' output moves.
- **The card is `block-size: fit-content`, not `auto`.** With both block insets
  pinned by `.sheet`'s `inset: 0`, an auto height is solved to FILL the
  containing block and the auto margins get nothing to centre with. Its
  `max-block-size` is likewise set so the content fits UNDER it (44rem) — at
  34rem the panel opened scrolled, with the offline switch below the fold.
- **No rule between the shelves.** Six lines through six short rows is more
  structure than the list has; the three columns already say where a row begins.
  The rule above the totals stays — that line is a different thing.
- **The progress bar is absolutely positioned on the row's bottom rule.** In the
  flow it appeared and disappeared with the download, pushing every shelf below
  it down and pulling them back up under the reader's finger; reserving the
  height on all seven rows instead would buy back the panel's own scrollbar.
- **Held bytes are read back from the cache, never accumulated from progress
  messages** (progress only covers fills this page watched). The comparison is
  `ContentEntry.path` against a cache key's pathname — `heldPaths` exists
  because comparing an absolute href to a pathname matches nothing and reports
  an empty library without erring.
- **`serviceWorker.completed` is a COUNTER**, bumped per `CACHE_CONTENT:done`,
  because two fills in a session must be two signals; the sheet re-measures off
  it.
- **The panel is a `<dialog>`, deliberately not a route.** An address would cost
  the whole grammar in `route-manifest.ts` for a control surface with nothing to
  index.
- **A shelf is dropped from the PAGE; the whole library is dropped by the
  WORKER, and that is not drift.** `library.remove(wave)` re-plans, deletes that
  wave's paths out of `glossa-content` and re-measures — awaited.
  `CLEAR_CONTENT` is `caches.delete(CONTENT_CACHE)` and takes what no current
  plan NAMES as well: files whose content hash has moved on, a language the
  reader has stopped reading. Summing the waves would be a "forget everything"
  that quietly left things behind.
- **Every delete is two-click, and one `armed` holds the target** (a `WaveId` or
  `'all'`), so arming a second disarms the first. Two controls each one click
  from firing is how the wrong one goes.
- **The library block is gated on `serviceWorker.controlled`; the switch is
  not.** A Download button with no worker to receive the message does nothing at
  all, while offline mode still stops the beacon and the update check by itself.
  `controlled` is false under `npm run dev`.
- **The sizes shown are RAW bytes**, per `Wave.bytes`' docblock —
  `content-length` is knowable only after fetching. It over-states the transfer
  by roughly three, which is the safe direction.

## The Code of Canon Law: the same arrangement, a different reading unit

`type: 'canon-law'`. Everything the Social Doctrine section above says applies
unchanged. What is new is only what a reading page IS.

- **The reading unit is the TITLE, and both other candidates fail at an end.** A
  page per BOOK is what the Latin edition itself publishes and puts 543 canons
  and 300 KB on one; a page per CHAPTER cuts the titles that have none into
  nothing, since 78 titles hold 130 chapters between them and the rest hold
  their canons directly. The title is 85 units, eleven canons in the median one,
  and it is where the source's own editions paginate. `canonLawUnitStarts` is
  books ∪ titles: a book anchors a unit only where its canons run ahead of its
  first title, which is how cann. 1-6 get a page.
- **The units are picked by `kind`, and that is why `cic.py` stores one.**
  `structure.json` carries the division word the edition printed — `title`,
  `caput`, `liber` — which a document's structure deliberately does not (there,
  `kind` would force the scraper to judge what a heading MEANT). Here it is
  read, not judged. Picking by `level === 4` would work today and break the day
  an edition omits a level, which is the one case a reading surface must not
  silently repaginate on.
- **A unit's name is the NARROWEST division at its anchor, the exact inverse of
  `socialDoctrineDivisions`.** There the outermost is the chapter and anything
  wider is a part divider printed on a page of its own; here four divisions
  routinely open at one canon — 1311 opens Book VI, its Part I and its Title I —
  and the outermost would title that page after a book running eighty-nine
  canons past it. `CANON_LAW_UNIT_RANK` is the order.
- **`canonLawDivisions` zips the stored rows against the outline BY POSITION
  within one anchor**, because `StructureNode.kind` is the tree's own word
  (`'sub'`) and not the source's. Safe where an identity test is not:
  `buildDocumentOutline` maps rows to fresh nodes one for one and in order.
- **`canonLawTitleText` strips the range the source prints inside a heading** —
  five of the seven editions print `(Cann. 7 - 22)` there and two print none, so
  leaving it in gives the same page two shapes depending on the reader's edition.
  Stripped for DISPLAY only; the corpus keeps what the edition printed, and
  `route-titles.mjs` carries the same rule by hand because it runs under plain
  node.
- **The strip runs BEFORE the casing**, which is what `canonLawHeadingParts`
  exists to fix. `normalizeCase` rewrites a heading only when it is ALL-CAPS,
  and the `ann` of `(Cann. 35 - 93)` is not — so with the strip applied
  afterwards, every heading carrying a range came through shouting while its
  neighbours were cased. The four display surfaces take the pair from that one
  function, and `route-titles.mjs` takes a `clean` argument rather than a pass
  afterwards, because a `<title>` written the other way round is a visible
  rearrangement at hydration.
- **The chrome abbreviates a division's label; the running text prints it
  whole.** `canonLawLabelText` shortens the NOUN and keeps the source's own
  numeral — `CHAPTER I` → `CH. I` — which `marker()`'s short form cannot do
  here: that form renumbers from tree position, and the Code restarts `TITLE I`
  inside every book and part, so four different places would read `Title 1`. It
  is keyed by the printed noun rather than by kind, because the outline carries
  none, which also makes French degrade correctly (`PREMIÈRE PARTIE` puts its
  ordinal first, matches nothing, and prints verbatim).
- **It holds no words at all — `'title'` is a kind, and the shared tables
  answer.** `canonLawLabelText` maps a printed noun to a `StructureNode['kind']`
  and asks `kindLabelWord` for the word, so a reader meeting `Ch. 3` on one page
  and `Chap. III` on the next is unrepresentable rather than merely tested
  against. Three small extensions, each measured:
  - **`CccNodeKind` gained `'title'`.** Nothing reads it off a file: `cic.py`
    writes the word into its own flat `structure.json` rows, but a
    document-shaped outline stamps every derived node `sub`. **It is a name in a
    vocabulary, not a claim about a tree** — the member exists so the two shared
    tables can key a column on it. Widening the union is safe because every
    consumer is a `Partial<Record<…>>` or a `Set`; the one place it bit is
    `StructureIndex`'s `IndexRank`, whose default `rank` now maps `title` beside
    `in-brief` as a fallback that cannot fire.
  - **`KIND_LABELS` gained a `title` column for seven languages, and `ru` gained
    `article`.** The title word is SPELLED OUT in all seven: it shipped as
    `Tit.` for a day on the density argument that earns `Ch.` and `Art.` their
    stops, and **an abbreviation has to save something**. A row is as complete
    as the works in that language require — naming a division in a language no
    work here divides that way is inventing vocabulary nobody can check.
  - **`LABEL_KIND_WORDS` gained the six Latin-script title nouns**, so
    `documentLabelKind` stops answering `null` for a division 77 rows deep.
    Inert for everything else, measured over all 1,668 `structure.json` files.
- **The chapter and article nouns deliberately did NOT join the shared
  recogniser.** `CAPUT`, `CAPITOLO`, `CHAPITRE`, `KAPITEL`, `ARTICOLO`,
  `ARTIKEL`, `ART` match **148 works besides the Code** — every Latin, Italian,
  French and German conciliar document — and those take `marker()`'s DERIVED
  form, which numbers a row by tree position. `vatii.christus-dominus.la` prints
  `CAPUT II` and `CAPUT III` with no `CAPUT I` above them, so they would be
  renumbered `Cap. 1` and `Cap. 2`. They stay in `CANON_LAW_EXTRA_NOUNS`, beside
  the Cyrillic ones, which `documentLabelKind` cannot reach at all (its fold is
  `[A-Z]+`).
- **Book, part and section are outside what it relabels**, on the shared table's
  own judgement — and section doubly so, since the Code's German prints
  `SEKTION` where `KIND_LABELS.de.section` says `Abschnitt`: a different word,
  not a shorter one. `book` is absent from the kind union entirely and degrades
  with no entry needed. For `title` the substitution is a NORMALISATION rather
  than a shortening, and that earns its place: the Spanish pages print `TITULO`
  and `CAPITULO` bare in places and `TÍTULO`/`CAPÍTULO` in others.
- **The breadcrumb is a flex row, and that block is global.** A crumb wraps as a
  UNIT — in inline flow the trail is one paragraph and breaks at whatever space
  it reaches, so `BOOK I` was stranded on a line above its own name. It matters
  most here (six levels where every other work has one or two) and is right
  everywhere, which is why it went into `reading-chrome.css`.
- **`flex-wrap` alone did not deliver that, and the row looked worse than the
  inline flow it replaced.** A flex item shrinks before the row wraps, so a
  trail wider than the column was solved by squeezing every crumb and letting
  each break inside itself. `.breadcrumb > *` takes `flex: 0 0 auto` to refuse
  the squeeze, plus `max-width: 100%` for the one case the arrangement allows an
  internal break. **A wrapping rule is only as good as the shrink rule beside
  it.**
- **`superseded` renders on the canon page and not on the reading page.** It is
  apparatus about one canon — the wording a later act replaced — and the canon
  page is where a reader arrives holding that canon's number. Behind a closed
  disclosure summarised by the ACT's own line, because the text above it is the
  law and this is not.
- **The `CIC` siglum links, and the grammar change is the payoff.** `LOCUS_RE`
  wanted a digit and the Catechism writes `CIC, can. 748, § 2`, so 264 citations
  resolved to a tooltip beside a number left in plain text. `SiglumEntry.work`
  marks the siglum, `CANON_MARKER_RE` skips the word and the comma before it,
  and `refAddress` branches on `work` before the slug test that would otherwise
  reject it. Worth 658 more linkable citations in the Catechism alone.
- **`classifyCitation` had to be told.** `reference-coverage.mjs` defined
  linkable as "a document segment with a slug", so every newly-linking canon
  counted as merely recognised. **A metric that predates a kind of link does not
  report it.**
- **Both offline waves and the bookmark shelf need a row.** `sw-policy.ts`'s
  `WAVE_BY_KIND` puts the two new asset kinds in `magisterium`; without it they
  land in `other`, which its own test catches. `bookmarkGroup` gives the Code
  order 5 and pushes prayers and documents down one — the sequence is a shelf
  order, not an append log.

## Usage measurement

First-party, bucketed, no identifier. `site/docs/usage.md` is the legal
assessment.

- **`/a` must stay OUT of `run_worker_first`'s negation list** — it is the one
  path besides navigations the worker must answer, covered by the leading `/*`.
  Negating it (the reflex) does not fail loudly; the worker never sees a beacon
  and the tables stay empty.
- **`usage-schema.ts` is ONE module read by both ends on purpose.** The client
  fills a payload from it and `src/worker.ts` validates against it; the whole
  defence of an open POST endpoint is that the two vocabularies are the same
  object. Split copies drift, and the metric then reads zero rather than
  erroring.
- **Three rules live in the Cloudflare dashboard and nothing here can assert
  them** — the custom rule guarding `/a`, the zone's single rate-limiting rule,
  and the kill switch. `site/docs/usage.md` is their only record. The free plan
  allows exactly one rate-limiting rule, which is why the write ceiling is a
  counter in `usage-store.ts`.
- **Retention is a cron** — `scheduled()` in `src/worker.ts` drops rows past
  `RETENTION_DAYS` daily; `npm run usage -- --prune` forces it. The script
  duplicates the constant (plain Node cannot import the `.ts`);
  `usage-report.test.ts` asserts the two agree. **The two retention numbers are
  not the same and are not meant to be** — 365 on the device
  (`RECORD_MAX_DAYS`), 400 in D1 (`RETENTION_DAYS`). `RECORD_MAX_DAYS` is
  load-bearing in both directions (shortening inflates the `new` bucket;
  lengthening walks away from LGPD retention proportionality). Change it only
  with both halves in view.

```sh
cd site
npx wrangler d1 migrations apply glossa-usage --remote     # once per clone
npm run usage -- --days 30
```

The binding is optional in `src/worker.ts`, so a deploy without it serves the
site normally and drops beacons — right for a statistic, and the reason a
missing database is not a build error. What says the measurement is live is
`npm run usage` returning rows.

**The colophon's promise moved with the code**: `colophon.pointNoTracking`
states what is actually collected. Anything that changes what the beacon sends
has to be checked against that string — it is why the payload holds no free
text, no sequence and no passage-level position.

## Reference grammar: twelve book tables, and the oracle behind them

`site/src/lib/refs-grammar.ts` turns a stored citation string into links, per
**content language**. Twelve configs (`ar de en es fr it la mg pl pt ru zht`).

**English was never a neutral default — falling back to it mis-read, not just
under-linked.** `1 Joh 2,20` has no numbered form in the English table, so the
bare `Joh` matched and every First-John citation in three editions resolved to
the Gospel; the German mirror prints `Job` where it means `Joh`; and `SC`/`CA`
collide across editions (Sources chrétiennes vs Sacrosanctum concilium, Corpus
apologetarum vs Centesimus annus), each edition right about its own references.

**`scripts/book-forms-oracle.mjs` is where nine of the twelve tables came from.**
Paragraph N is the same paragraph in all nine Catechism editions, so align on
the locus and read the abbreviation off. `--derive` proposes a table with vote
counts; the default mode **checks** an existing one by reporting links the other
editions contradict — read that as a count, not a list (330 rows means the wrong
table is applied; 18 means the editions genuinely cite different verses).
`--work` points it at any work published in more than one language, valid only
for a work translated from one text at one time. It will keep proposing two
things that are **not** books: patristic work titles (`Sermo 241, 2`), and the
`??`-flagged singletons, which are for reading, not pasting.

- **It has two shapes, because a capital is not available in every script.** The
  first is anchored on `\p{Lu}`, right for a bicameral script and answering ZERO
  for Han — so the Chinese Catechism read as nothing to propose rather than as
  fifty things, which is silence and not an answer. The second is anchored on
  `\p{Script=Han}` with no book-number group (Chinese writes the number into the
  name: `格前` is 1 Corinthians, `若一` 1 John). It is looser, and it can be,
  because **the locus vote is what decides** — an ordinary sentence's last
  characters before a number match the shape and lose the vote.
- **`BOOK_VARIANTS_ZHT` is the first table where `LEFT_BOUND`/`RIGHT_BOUND` do
  real work.** Every neighbouring character in Chinese is `\p{L}`, so a form
  matches only where punctuation or a space bounds it — exactly where a citation
  stands and nowhere a word does. `多` is Tobit in `(多 8:4-9)` and the ordinary
  word "many" in 多次; `瑪` is Matthew and the first character of 瑪利亞.
  Forty-nine books, 2,934 links, 0 contested against the eight other editions.
- **Latin is the exception to "derived"**: `BOOK_VARIANTS_LA` is the Latin
  edition's own printed table (73 rows), with the oracle run over it as a check
  — two independent derivations agreeing, and why Latin is the only table
  complete for books the Catechism never cites.
- **A table answers for every work in its language, not just the Catechism** —
  `la` also covers the Summa, the Clementina and the Latin prayers. Scan the
  non-Catechism works after deriving a table.
- **The oracle finds source defects too, and they belong in `corrections/`, not
  in a hole in the table** — each a real link to the wrong verse, one edition
  against seven.

**The tables have a second consumer, and it is the one a reader touches**:
`suggest.ts` (the jump box) reads them through `grammarSurface`, so editing a
table changes what the box completes as well as what the page links —
deliberately, since a form the box completes and `parseRefs` fails to resolve
would offer an address that does not exist.

- **The tables hold abbreviations, not names** (the oracle derives from
  citations, and citations abbreviate) — so a French reader completes `Jn 3`,
  not `Jean 3`, and the fix is not to hand-write names. Full names are matched
  only where an EDITION carries them.
- **`suggest()` takes its language as an argument**, never from the `i18n`
  store, and memoizes per language (`resetSuggestCaches()` in tests).
- **Loose matching is injected and must stay that way.** `fuzzysort` is the
  site's only dependency besides the icon set; `JumpBox` lazy-imports it and
  calls `setFuzzyRanker` — a static import in `suggest.ts` puts 7.5 KB in every
  route's boot chunk. A new caller injects the same ranker with the same 0.3
  threshold. `suggest()` with no ranker is the literal tiers alone, a supported
  state.

**A clause is parsed to its end, not to its first match.** The siglum, title,
Summa and work-title branches of `parseClause` each dropped the clause tail to
text, so `Const. dogm. Dei Filius, c. 4: DS 3016 [...] Const. dogm. Lumen
Gentium, 25` linked only Dei Filius; they recurse now, as the scripture branch
always did. **And a document link no longer requires an edition in the reader's
own language**: `refAddress` goes through `defaultDocumentWorkId`, the same
`editionInLang` chain `/documenta/{slug}` resolves at page load, because the URL
names no edition and the refusal only ever cost the citation. The section check
stays strict against whichever edition that picks.

**A citation this site WRITES takes its chapter mark from `grammarSurface` and
its language from the reader's Bible EDITION.** Four surfaces compose one — the
day's readings, `PrayerReferences`, and the two notation specimens, which share
`scriptureSpecimen`. The book form still differs per surface and each difference
is argued; **the punctuation may not**, and `PrayerReferences`' literal `:`
showed a Portuguese reader `Lucas 1:28`. `chapterVerseSep()` in
`citation-style.ts` is the call, safe because `vulgateNumbering` is a property
of a WORK and never of a language. **`citation-punctuation.test.ts` scans the
source for the literal** — nothing else can see it, a hardcoded `:` being
correct in the language of whoever typed it. Its discriminator is a space before
the chapter, which is what tells a citation from a key, and is why a comparison
string must be spelled like a key.

**A citation naming several passages is several links.** `Ps 95:1-2, 6-7, 8-9`
was one link, and an `Address` holds one span, so it claimed `?v=1-9` — four
verses nobody cited. `parseVerseList` returns the comma-chained groups,
`citationParts` re-reads them off a segment's `raw` (deliberately not a field on
`RefSegment`, which would land in all 87 scripture expectations in
`refs.test.ts` for two callers), and `citationPieces` addresses each. **A
component calling either that or `refHref` owes the three `REFS` indexes**, and
`index-priming.test.ts` scans for both names.

**A tap peeks at any citation, and `data-link-preview` marks NAVIGATION rather
than citations.** The tap path was an allowlist of `.ref-link, .inline-ref` —
two of the dozen generators that emit citations — so a prayer's "See also", a
"Cited in" chip, a CCC paragraph's `related` numbers and the `†` sourcing a
reading order previewed under a cursor and navigated under a thumb.
`citation-links.ts` is the one classifier, and the marker has three states:
absent peeks on both gestures, `"hover"` peeks on the pointer only (the jump
box, the reading picks, the two index pages — chosen in order to GO there),
`"off"` never (a crumb, prev/next, a sidebar TOC — the page the reader is
already on). `usage.ts` deliberately kept the two classes: widening what counts
as a citation followed is a step in a reported series, not a consequence of a
change to the card.

**`PreviewTarget` refuses nothing now.** The rule was that an unanchored link is
navigation, and `/signata`'s rows are the counter-case, since a marked prayer is
a unit. The refusal was doing a marker's job: `/documenta` and `/preces` emit
exactly those two kinds of link and carry `"hover"`. And `linkPreviewContent.ts`
had no `canonLaw` case at all since the Code was ingested: **a switch over a
union is not exhaustive because it looks exhaustive**, and both halves of that
one return `| undefined`.

**A `/signata` row is a citation, written in the form `specimens.ts` holds.**
`citation-label.ts` is the one writer — `citationFor` off the index tier, so a
library of eighty marks fetches nothing where it used to fetch eighty passages
to print two clamped lines of each. Its `addressResolves` asks the ROUTE's
question ("does following this show the reader something"), which is why a
division address is checked for a division CONTAINING the number and not one
opening at it.

**A work's siglum is a dictionary key unless the work itself prints one.**
`CSDC` was a literal in `citationFor` on the ground that every language prints
it, and the Compendium's own abbreviations table names `AAS`, `DS` and the parts
of the Summa and never the Compendium — so `socialDoctrine.abbrev` carries the
form each language built out of its own title, and `CSDC` where none did
(`docs/finding.md`).

The six tags with **no** config (`hu ro sl sv zh en-gb`) fall to English, and
that is measured rather than assumed: the Compendium-only languages cite by bare
number and their prose prints no Scripture locator, so the English table matched
nothing rather than something wrong. `scripts/reference-coverage.mjs` is what
says when that stops being true — and it did, for `ar`/`pl`/`ru`.

## The reverse index reads every work, and is sharded per book

`build-xrefs.mjs` emits the "cited in" apparatus; `site/docs/references.md`
holds the rationale.

- **`Citer` is eight kinds and adding a ninth is one place, not five.**
  `cited-by.ts`'s `citedSources` groups every kind for all four pages that
  render `CitedBy` (Bible chapter, CCC paragraph, document, Summa question).
  Each page grouped its own until 2026-09-05, and each could see only the two
  kinds the index then held.
- **The scripture index is emitted INVERTED and sharded per book**
  (`index/scripture-citations/{osis}.json`). The two forward tables it replaced
  were 993 KB fetched by every reading page and read forward by nothing. Do not
  add a whole-corpus citation table back: 5.7 MB raw over 73 files is affordable
  only because a chapter fetches one of them.
- **`query: '?url'` on that glob is load-bearing** — without it Vite compiles
  5.7 MB of index into the boot chunk, silently.
- **An `annotation` citer names the EDITION, not the Bible.** Two annotated
  editions are two apparatuses; two editions of one Catechism are one Catechism
  and collapse to one citer. `isSelfReference` drops a note's references to its
  own chapter.
- **A prayer-addressed commentary is not a citer.** `commentary.preces.*`
  reprints the Catechism and the Compendium beside a prayer, each note naming
  its source in its own `locus`, so counting it would file one citation twice
  under two labels.
- **A commentary's verse number is `verse` and an edition's is `n`.** Read wrong
  it is silent: the citer serializes with the key absent and the page links to
  `#vundefined`.
- **An `annotation` is shown in ONE language and every other citer in all of
  them.** Only this kind names an edition, so ten annotated editions cite one
  verse as ten works; `citedSources`' `commentaryLang` keeps the reader's own,
  defaulting to the Bible edition they would open. The chapter page passes the
  edition ON SCREEN instead, being the one page where the two differ.
- **The panel's filter toggles a FAMILY, and every citer kind belongs to one.**
  `CitedByFamily` maps them onto the library's own sections (the Catechism and
  its Compendium share one); a family covering only some kinds would leave the
  rest permanently on. Every label is a key a page already uses, so a family
  costs no new string in 37 dictionaries.
- **The family marks are ORNAMENT, and the shelf is named beside every one of
  them.** Judge a `--shelf-*` seed by what it MIXES to (a near-neutral one
  resolves to no colour at all), by how far that lands from the rest, and by its
  HUE ANGLE, which this panel cannot see and `/schola` can.
  `src/lib/pigments.test.ts` is the bookkeeping: the set, the mix, both dials,
  the flat fallback above a relative-colour declaration, and no
  `var(--pigment-…)` naming a token that does not exist.
- **One mark for every family, and it is drawn rather than set.** A square, not
  a circle: a filled circle before a word is a bullet wherever it appears. `▪`
  is in Source Sans 3's release TTF and would cost about a hundred bytes — it is
  a CSS box anyway, because a rectangle is a shape CSS makes exactly and a
  subset is for a mark nobody can compute. A mark PER family was measured and is
  not available: what the originals add beyond the subsets is fill-and-size
  variants of three shapes, which at this size is one shape each.
- **The panel CLOSES the page and it FOLDS**: prev/next sits above it on all
  three routes that draw both, and the open state is one stored preference for
  all four (`glossa:cited-in`, open by default) — a reader who folded away 237
  references under Matthew 25 has said the same about a Catechism paragraph.
- **Commentary starts switched OFF and is the only family that does** — the
  largest family in the index by a wide margin, and the one already on the page
  under its own marks. The buttons are drawn whenever pressing one would change
  something, a lone hidden family included, or a chapter cited by nothing but
  its own apparatus would show an empty panel with no way to open it.

## Every number a reader sees is derived once

`scripts/census.mjs` writes `index/census.json`; `/bibliotheca/census` renders
it, `llmsFacts` projects it and `scripts/language-coverage.mjs` gates the
deploy on it. `site/docs/census.md` holds the rationale.

- **A count published twice is a count that will disagree with itself.**
  `llms.mjs` derived nine facts of its own until the census existed, correctly;
  what it could not do is answer a second consumer. Put a new number there, not
  in the page that wants it — `censusFact` throws for a renamed one, which is a
  build failure instead of the word `undefined` in published prose.
- **An inventory count says how big; a fraction says how far, and only the
  second belongs on the page.** `Canons 1,752` is unanchored and a reader
  cannot tell whether it is good; `the Code in 7 of 40 languages` is a
  judgement. The 37-row ledger that opened this page went for that reason.
- **A row of bare figures invites arithmetic, so a shelf's numbers are a
  sentence.** Four of the apparatus counts summed to a fifth of the total they
  sat under and read as broken; they were not, a cross-reference being an EDGE
  and those being its ENDPOINTS. Prose can state a relation.
- **A ranking counts distinct citing PLACES, not stored rows.** The index holds
  one row per (citing address, cited address) pair, so counting rows makes the
  most-cited chapter the one people quote longest passages from — Matthew 25
  leads on rows and is sixteenth on places.
- **A work's account of itself is not evidence of how the library reads it.**
  An edition's footnotes are excluded from every ranking (they outnumber
  everything else), and so is a work citing itself — all but a fifteenth of the
  Summa's citers are the Summa.
- **A ranking is cut on the COUNT and never on the rank.** Thirteen Catechism
  paragraphs are cited exactly three times, so a `slice(0, 20)` would publish
  four of them and drop nine cited as often.
- **The file's cut is not the screen's.** `RANK_LIMIT` is what gets published
  and `RANK_PAGE` is what is on screen at once; twenty was a screen being
  enforced by the file, so a reader who wanted the twenty-first row had nowhere
  to go. A page boundary may split a tie — those rows are published — where the
  table's own cut may not.
- **A shelf is written only where the build holds what it counts.** The
  fixtures hold no Code, and "the Code of Canon Law in 0 languages" asserts the
  Church has no law rather than reporting that nothing was synced.
- **`language-coverage.baseline.json` records PRESENCE and never proportion**,
  and `npm run language:accept` is how a withdrawal lands as a diff. Amounts
  would churn on every ingest, which is the noise a regression has to stand out
  from; a SET also catches a swap that leaves the count unchanged. Completeness
  inside an edition is deliberately not gated — the matrix shows it as a
  partial bar instead.
- **The five rankings are one, and the chips narrow WHAT IS RANKED.** Merging
  the stored tops is the exact top of the union — a row in the merged top
  hundred is in its own kind's top hundred — which is what makes a filter over
  KINDS safe. A filter over citing families would not be: those counts were
  summed at build time, so re-ranking a stored top by one family publishes a
  wrong ranking wherever the two orders differ.
- **Books start switched off, the one kind that does.** A book's count is every
  place citing any chapter of it, so beside its own chapters it is an aggregate
  answering the table twice — measured, the head of everything is eighteen books
  and two documents.
- **What the library is CITED FOR and has not got is its own ranking, and its
  rows carry a name and no address.** Every other ranking links; this one
  cannot, the link being the thing that is missing — so it is not a sixth chip
  on the table above, whose rows are comparable because they are all addresses.
- **A series siglum is a LOCATOR, not a work.** That ranking headed itself with
  `Patrologia latina` — two hundred volumes of somebody else's shelf — where
  the reader had asked which texts. The text is named beside the locator in the
  same clause, so the section prints two lists: whom the library is cited for,
  and the editions those texts are printed in.
- **The locator is the oracle for a name that fragments.** Augustine has nine
  spellings across the editions and no letters in common between `St. Augustine`
  and `Sanctus Augustinus`; `PL 38, 1134` is a volume and column in a book
  nobody here published, so it reads the same in every language and every
  edition citing it names the same man (`scripts/patristic.mjs`). A head is read
  per CLAUSE and an edge needs THREE shared locators — at one, 4,450 of 6,878
  heads came out as a single Augustine. The parallel FOOTNOTE is the second and
  stronger channel, `citerKey` being an address that does not vary by language:
  two shared notes are enough, and it halved the table. Keyed by POSITION in
  the note, never by the note: two names in one note are two spellings at one
  key, and Augustine came out at 535 having swallowed Irenaeus and Chrysostom.
  Missing a link is a row too many; making a wrong one is a row that swallows
  another.
- **That ranking carries an evidence floor the others do not.** Every other row
  on the page names an address, which exists or does not; a row here is a
  cluster, and a name seen twice has had no chance to meet another spelling of
  itself — so it is as likely to be a duplicate of a row above as a work in its
  own right (`MIN_CITING_PLACES`).
- **A siglum's identity is a NAME from `ABSENT_WORKS`, never its expansion.**
  The tables gloss one work differently for each language's reader, so keyed on
  the expansion the Holy See's gazette was two rows of 1,513 and 1,213.
  `sigla-standing.test.ts` requires every entry with neither a slug nor a work
  to declare `names`, or a new siglum falls out of the ranking in silence.
- **`siglumStanding` asks the corpus and never the sigla table.** A slug there
  is a claim that goes stale without a symptom: the first run of the absence
  ranking offered two exhortations sitting in `build/` as works to acquire. The
  ranking is a check on the table as much as a list for a reader.
- **A citation that names nothing is COUNTED and never ranked.** 94% of the
  31,525 strings that resolve to no address occur once, and the head of that
  list is `Ibid.` — ranked by their own text the page would publish it as the
  most-cited work this library lacks. Two integers under the ranking, and the
  lede says what they are, which is `countedReferences`' arithmetic one section
  over.
- **The breakdown under a ranking counts what the ranking counts.** Over every
  reference, `annotation` headed it — the largest number in the section, for a
  family no table above it counts. `countsTowardsRank` gates that tally now, so
  the row cannot return through an edit that forgets why it went, and
  `countedReferences` is what stops the remaining column from reading as short
  of a stated total.
- **A glyph on this page is one the work already has** (`CENSUS_ICONS` maps
  the builder's keys onto `work-icons.ts`), and it is the accent, one accent
  for all of them.
- **The matrix is `--color-apparatus` and the hovered cell is the accent**, so
  the page spends two colours: one on what is named, one on what is measured.
  A token and never a literal, which is what survives `data-mono`.
- **A hover mark here may not change a text metric**, which is
  `/calendarium`'s rule met a second time: the lit headings went bold, so the
  first column grew, forty language columns moved, and the cell under the
  pointer slid out from under it. What marks the lit cell, its row and its
  column is colour alone — one mark in three places, where a rule under two of
  them would be a second mark for one event.
- **The page is in `STATIC_PATHS` and NOT in `CHROME_PATHS`** — the arrangement
  `/calendarium/liturgia` already stands on, because its `census.*` strings are
  written in English alone. Its head is fixed and English in `STATIC_HEADS` to
  match; `PLAN.md` sizes the promotion.

## Running prose is an apparatus, not decoration

**Four of the nine Catechism editions print no footnotes at all** (de brackets,
fr/es parenthesize, `zht` prints no apparatus whatever), so everything
`parseRefs` reads elsewhere, `linkifyProse` must read in the body text — its
document-siglum scan is worth 3,624 references in those editions against 82 in
English.

**The counters that measure this scan do not render it.**
`reference-coverage.mjs` and `build-xrefs.mjs` call `linkifyProse` themselves,
so the coverage table kept counting references the page had stopped drawing —
the CCC's 18,831 in-prose references went undrawn for four days, in exactly the
editions with no footnote fallback. The marker walk lives in `inline-html.ts`
(`parseInlineMarked`, beside `parseInlineHtml`), so both branches of
`ProseBlocks` read `linkifyInline(parse…(block), proseSegments)` and both are
unit-testable. There is no component test harness here; **keeping renderable
logic out of `.svelte` files is the only way it gets tested at all.**

**Three surfaces store plain strings, and all three were inert for the same bad
reason.** A Compendium answer, a Compendium question and an annotated Bible
edition's note carry no markup and no `⟦N⟧` tokens, and each was rendered as raw
text on the reasoning that a text with no footnote apparatus has nothing to link
— backwards, since those are precisely the texts that print their locators in
the sentence (1,436 + 65 + 435 references). `plainTextNodes` in `inline-html.ts`
is the third parser, so reaching for the wrong one is a compile-time question.

**The Bible's VERSES are still not linkified, and must not be.** Scripture is
the text being read, not an apparatus over it. Only `Sidenote` linkifies,
because only the note is commentary.

**A siglum in prose must sit inside a bracket and carry a locus** — measured:
3,708 of 3,712 siglum-shaped prose tokens sit inside a `(` or `[`, and the four
that do not are one source defect repeated. Without the guard, every capitalised
abbreviation in the corpus is a candidate. **The one collision is `AA`**: CCEL
doubles a letter to pluralize, so the English Summa's "(AA 1,2)" is _articles_,
not Apostolicam actuositatem. The discriminator is the locus — a conciliar
decree cited in prose points at ONE section — so `proseSiglumFalseLead` blocks
the list form.

**The same scan is how the book tables get their second pass.** Reading what
prose still resolves to nothing found 1,180 Douay-named references in
`summa.en`, 59 in the Portuguese encyclicals, and two source misprints now filed
as corrections. Run it after any table change; the residue is where the next win
is.

**English has two book-naming conventions and they collide on Kings, which is
why `RefsOpts` has a second axis.** The Douay tradition calls 1–2 Samuel the
first two books of Kings; `3/4 Kings` read the same under both conventions, but
`1/2 Kings` mean different books and **nothing in the citation string tells them
apart — only the work does**. So `configFor` takes a work id, and `WORK_CONFIGS`
lists the works whose own text contradicts their language's table (seven today):
`summa.en` (CCEL quotes Douay-Rheims throughout), two encyclicals, and the
annotated editions whose notes need it — `bible.douay-rheims.en` for Challoner,
`bible.straubinger.es`, `bible.martini.it`, `commentary.haydock.en` — each
verified against the verse it actually names. Modern is the default because that
is what the corpus prints nearly everywhere. **A work belongs in `WORK_CONFIGS`
only when its references are measurably read wrong without it**, evidence in the
comment beside it. It is a short list on purpose, not a second general axis.

**Every reading surface passes `work`, including the ones whose answer today is
"nothing"** — `ProseBlocks`, `InlineProse`, `RefText`, `CitationDisclosure`,
`HeadingText`, `SummaDivisions`, `CompendiumQuestion` (the prayers route is the
exception: no prayer work cites Kings). **The build side has to pass the same
work the page passes**, or the scripture index points at a different verse from
the link on it: `build-xrefs.mjs` threads it from the sync's edition records,
`reference-coverage.mjs` buckets per work, `book-forms-oracle.mjs` derives it
from `--work`.

**`prose.document` is the counter that guards the sigla scan** — counted per
family, with preflight refusing a 3% drop, same as prose scripture.

## Two sigla link off the site, and the year is what makes it safe

`AAS` and `ASS` — the Holy See's gazette either side of 1909 — are the only
citations the grammar answers with an address outside the corpus: a
`RefSegment`'s optional `external`, built by `aasVolume`/`assVolume` and
rendered inside `SiglumGloss`'s card, never as a glyph on the siglum, which
would mark thousands of references in a column that is already apparatus.

- **The printed year is a CHECK, never an input.** Volume _n_ is 1908 + _n_, so
  the citation says it twice and both must agree. A long tail of sources write
  pre-1909 documents as `AAS 18 (1885)`, meaning volume 18 of the **Acta Sanctae
  Sedis** — deriving the year sends each to a real AAS volume forty years wrong,
  and nothing downstream can see it. Refusing the mismatch costs 256 links and
  prevents 256 confident lies.
- **`slug` stays null and `refHref` still declines it.** An external address is
  a separate field for exactly that reason: nothing that resolves addresses HERE
  (`corpus-routes.json`, `sitemapPaths`, `assertNamed`, `suggest`) may ever see
  one. The proof is that the reference-coverage table did not move.
- **The volume list is read off the Vatican's own index**, not guessed: 1–94 are
  single PDFs (9 and 75 in two parts, so both are skipped), 95 onward are
  monthly and a citation names no month. That ceiling is 23.8% of AAS references
  and is a fact about the publisher, not a gap to close.
- **ASS is a 41-row TABLE, and being closed is what licenses it.** The filenames
  do not derive (`ASS-32-1899-900`; volumes 10 and 16 carry a supplement's page
  range) and `year − volume == 1867` holds only from volume 9 up, so a
  derivation is impossible rather than inconvenient. What makes a table safe
  here is that the series ceased in 1908 and can never gain a row — ask for that
  before writing the next one, not "the rows are few". (`audit.py`'s
  `SERIES_ASS_IRREGULAR_BELOW = 4` is set too low against the real index.)
- **The volume's SPELLING does not matter, because the year check does.** It is
  read as a digit locus, as a Roman numeral `LOCUS_RE` cannot reach
  (`ASS XXVIII (1895-1896)` is volume 28), or as the head of a comma-chained
  locus that swallowed the year (`ASS 5, 1869, 305-331`); the year comes from
  `(1885)`, `(1890/91)`, `[1869]` or a bare `, 1908`. None needed a new
  tolerance. All three shapes were refused for one pass on the grounds that they
  were "a different locus grammar", which was a fact about `LOCUS_RE` dressed as
  a fact about the citation: **where a shape is refused, the reason has to name
  what would go WRONG**, not what is currently written.
- **Adding `ASS` to the English and Portuguese sigla tables** moved `recognized`
  in `vatii` and `encyclical` and left `linkable` flat everywhere — the
  containment check.

## Commentaries on the page

`commentary.haydock.en`'s units ADDRESS `bible.douay-rheims.en` rather than
containing text; `commentary.preces.{lang}` does the same for
`prayer.common.{lang}`. The pipeline half is in `pipeline/CLAUDE.md`.

### Shape in the site

- **A commentary contributes no route, no sitemap entry and no
  `route-titles.json` name** — none of the address-grammar machinery (`hrefFor`,
  `isCanonicalPath`, `WORK_OF`, `assertNamed`) had to learn about it.
- **`sync-corpus.mjs` SKIPS an unhandled `manifest.type` and says so**
  (`hasContentBranch`): it used to register the manifest and emit no content, no
  routes and no error, so the work existed in `listWorks()`, rendered nowhere
  and 404ed nowhere. Now it enters no synced output at all and the run warns per
  unknown type, naming the work ids — a warning and not an exit, because
  `build/` is shared and another branch's experiment must not block a deploy of
  the known corpus.
- **The content path shape is the Bible's on purpose**
  (`content/{workId}/books/{osis}/{start}-{end}.json`, packed by the same
  `BIBLE_CHAPTER_CHUNK_TARGET_BYTES`), so `bibleChapterLocations` reads both
  with one regex and `bibleChapterChunkFor` is keyed by work id with no claim
  about type. Do not add a second lookup.
- **`manifest.addresses` is the branch, and both scrapers write it.**
  `sync-corpus.mjs` reads it before it opens the work's directory, which is why
  it is a field rather than a lookup of the annotated work's own type.
  `commentaryPrayers` in `corpus-index.ts` is `commentaryChapters`'s twin — two
  registries and not one wider one, because nothing reads both.

### Preferences and defaults

- **The reader's preference selects the apparatus, and it is a SET.**
  `apparatus-prefs.svelte.ts` cannot reuse `content.svelte.ts` — a reader can
  have two apparatuses beside one verse. **What is stored is the DIFFERENCE from
  the default, not the state**: storing the state makes "never touched the
  panel" and "switched everything off" the same value, and the next work
  ingested arrives silently off for the first of them.
- **Both defaults move, and a WORK is what moves them.** `subsumes_notes` flips
  the edition's; `default_on` flips the commentary's, and the prayers' apparatus
  is the only work in the corpus that sets it — tens of kilobytes, the only
  apparatus a prayer page has, and reaching part of the collection rather than
  all of it, so opt-in meant a reader who never opened the panel never learned
  it existed. Every caller reads it through `commentaryDefaultsOn`, so the
  enabled test and the panel's switch cannot ask the question with two different
  defaults.
- **A commentary's choice is stored per FAMILY, an edition's per edition.**
  `commentary.preces.*` is fifteen works and the reader meets one per page, so
  the id is stored without its language — "I do not want this commentary" is not
  a statement about English. An edition's notes must NOT be scoped that way: the
  Douay-Rheims and the CPDV are two apparatuses.
- **A commentary is offered at the edition it annotates** — `commentariesAt`
  takes an address and reads `annotates`. The settled condition is that the
  marks sit at the words the notes quote, so a lemma-keyed apparatus really is
  undisplayable beside another edition. **The cost is real** (a CPDV or
  Clementine reader is not offered Haydock at all) and is paid rather than
  dodged. `subsumes_notes` is asked separately — "already contains the edition's
  own notes" is a narrower claim than "belongs beside this edition".
- **That cost is what moved the English default**: `PREFERRED_EDITION['bible:en']`
  is `bible.douay-rheims.en`, because with the gate back a reader who chose
  nothing got neither apparatus and no control saying one existed. **An edition
  gate on an apparatus is also a claim about which edition the default reader is
  on** — decide the two together or the apparatus is built for nobody.
- **Haydock contains Challoner** — 1,399 of the Douay-Rheims's 1,916 notes
  reappear in the catena — so `CommentaryManifest.subsumes_notes` (a property of
  the WORK) flips one default: `editionNotesEnabled(workId, subsumed)`.
  **Nothing is suppressed** (the overlap is 73%, not 100%); the panel keeps the
  switch and says why it moved. That is also why the store's `off`/`on` lists
  both carry edition ids: a default that moves needs both directions.
- **Nothing is fetched until it is switched on.** `commentary.svelte.ts` is
  `xrefs.svelte.ts`'s shape and deliberately NOT part of the chapter route's
  `listBibleWorks()` loop; `commentary-chapters` is outside `AUTOMATIC_WAVES`.
  **The prayers' apparatus is the exception and rides `essentials`** —
  `WAVE_FOR_KIND` puts a commentary on the wave of the work it annotates, and
  the rule it looks like it breaks is about SIZE. Left out, a reader who filled
  the library would get a 504 with the prayers sitting right there.

### Same-chapter references

`v. 12`, `ver. 5. 8` — an apparatus annotates one verse at a time, so the page
IS the chapter. `RefsOpts.sameChapter` is the opt-in; `CommentaryGloss` passes
the verse's own address and nothing else passes it at all. Worth 2,745 links,
+31% on the work's apparatus.

- **`v.` is also the Roman FIVE**, and what separates them is the token BEFORE:
  a chapter-five is preceded by a capitalised word, a Roman numeral, or `and`
  continuing the locus. `sameChapterFalseLead` refuses those 593 and admits
  2,753; `See` is the one capitalised word let through.
- **A `v.` inside a longer locus never reaches the guard** — `linkifyProse`'s
  merge drops any hit overlapping one that started earlier.
- **`parseVerseList` cannot be reused**: it chains a list on `.`, and at
  `v. 54. 2 Par. vi. 13` that eats the `2` of `2 Par.` as a verse.
  `SAME_CHAPTER_RE` encodes the guard.
- **The bare run — `21. 27.` — is not linkable, by measurement.** Of 154 notes
  ending in a run of bare numbers, exactly one (Genesis 1:1) is verses; the rest
  are patristic and juridical loci whose title ends in a period, and nothing in
  the string distinguishes `matter.` from `Prolegom.`.
- **The coverage meter had to be taught the same address**, gated on
  `family === 'commentary'`. A Bible edition's own `notes` have the identical
  file shape and must NOT be read that way — `Sidenote` passes no address, and
  Challoner's `v.` is far more often a Roman five.

### Marks, cards, margins

- **Two marks.** `†` sits after the words a note quotes, `‡` at the end of a
  verse whose notes name no words in it — 9,594 verses carry both kinds. **It
  reports placement, not the `lemma` field**: 2,332 headwords the Douay's
  wording refuses fall to the `‡`, so the mark claims only "nothing here to
  light". `commentaryMarker(anchored)`, and `anchored` is required with no
  default at the call site — either default renders perfectly and misinforms.
- **The daggers cost a font file.** Neither is in either text family's `latin`
  subset, so `static/fonts/source-sans-3-marks.woff2` is a 1.2 KB two-codepoint
  subset under its own family, precached with the core faces. The earlier claim
  that `‡` was unreachable was measured over Google's subsets, which partition a
  font by Unicode RANGE and drop a glyph outside every range they define even
  where the original has it: **ask what the FONT has, never what the subset
  ships.** `fonts.css`'s `pyftsubset` line names Adobe's release zip for that
  reason. `sidenotes.test.ts` pins both codepoints against `fonts.css`'s
  `unicode-range`, because a mark and a face that disagree render in a system
  font and nothing fails.
- **A commentary sets nothing in the margin, at any width** — the mark opens a
  card, the only way in. **The gutter premise assumes an apparatus SMALLER than
  the text it hangs on**, and this one is not (a chapter's notes run to 52 KB).
  `NoteCard` has `{ margin: false }` and every gate reads `#inMargin`. What
  stays global in `reading-chrome.css` is what genuinely has two owners:
  `.note-marker`, `.note-trigger`, `.note-popover`.
- **The dagger is superscripted by `vertical-align`, not by the glyph** — an
  asterisk is drawn high in its own em box, a dagger baseline-to-cap like a
  letter, so on the baseline it reads as a character of the verse.
  `.commentary-marker` overrides `.note-marker` in exactly two declarations.
- **What the marker opens is decided by LENGTH, not by apparatus.**
  `CARD_MAX_CHARS` is 900 (`overflowsCard` is the whole rule): under it a
  floating card, over it `.note-dialog`. The number is the card's own arithmetic
  (26rem × 32rem ≈ 1,490 chars; 900 keeps a card short of the scroll), and the
  same edition prints both a phrase and an essay, which is the argument for a
  threshold over a per-apparatus rule. It is the only length threshold left.
- **A 44px tap target on a mouse is a bug.** `.note-trigger::after` grows the
  mark as a positioned overlay, and a commentary's mark sits at the END of a
  verse, so the next verse's number was inside it. It is
  `@media (pointer: coarse)` now, and `.reference-number.inline` takes
  `position: relative` so where the two targets genuinely overlap tree order
  settles it in favour of the address.

**The gutter gloss is gone for editions too**: `Sidenote` set its note beside
the line — the _Glossa Ordinaria_ arrangement the project is named for — and the
same measurement retired it (Straubinger and Martini notes run past the chapter;
the column was neither beside its line nor bounded by it). What stayed:

- **`CitationDisclosure` keeps its margin copy** — a footnote's source is 26
  characters, the remark the arrangement was calibrated for — so `sidenoteRoom`,
  `.margin-note`, `--margin-lane` and `CompareGrid`'s claim are all live, and
  the lane is declared on every reading page to keep the column on the page's
  midline.
- **Paper is why `Sidenote` renders its popover unconditionally**: once the
  margin copy was gone, the card was the only copy of the apparatus in the
  document, and a printed chapter would have carried markers pointing at
  nothing. `print.css` sets `.note-popover` back into the flow. Gating on
  `!card.asModal` prints the short notes and drops the long ones — the worse
  half of both answers.
- **A commentary still prints nothing** — unchanged rather than overlooked:
  `CommentaryGloss` renders its card only when the mark does not open a dialog.

### The verse marks the lemma

`src/lib/lemma.ts`: `splitLemma` locates the words a note glosses,
`AnnotatedText` wraps them, `sidenoteRoom.highlighted` lights them while the
note is open, and `Sidenote` prints its headword only when the verse could not.

- **The anchor is the MARKER, matched backwards, never a search** — the words
  are the run immediately before the token, so there is ONE candidate by
  construction and the match is either right or refused. A search would find the
  wrong occurrence of a repeated phrase.
- **The comparison ignores everything that carries no words** (case, diacritics,
  punctuation, whitespace) but still answers an exact OFFSET — `fold`'s index
  map buys the offset back. The `ELIDED` guard is load-bearing: `E... diede...`
  folds to `ediede` once the dots go, and would match across anything.
- **`fold` expands `æ` and `œ`**, which no normal form does — they are letters,
  not a base plus a mark. The curated Latin Ave ends `nostræ` and the Catechism
  prints `nostrae`.
- **Fuzzy matching was tried and bought nothing** — a bounded edit distance
  recovers ZERO further headwords; what is left is not near-misses but notes
  that do not quote the verse.
- **Measured per edition**: douay-rheims 1,805 of 1,909 (95%), matos-soares
  1,377 of 1,743 (79%), martini **0 of 18,658** — Martini's notes are
  verse-level and his lemma is a catchword with the elision printed in, a
  discontinuous quotation and so not a span of anything.
- **`.note-lemma` and its highlight are in `reading-chrome.css`.** They were
  scoped to `AnnotatedText` until `PrayerBlocks` set the same spans and every
  one came out unstyled — no error, no warning, just no highlight. **A class
  name borrowed across a component boundary in Svelte is silently unstyled.**
  Two components rendering one class means the rule is global.
- **The panel drops the punctuation that JOINED the headword to the note and
  raises the letter behind it** (`afterHeadword`) — a source stores the join as
  the note's first characters, so hiding the headword opened 1,084 of Matos
  Soares's 1,377 marked notes on a stray `, ` and a lower-case word. Only
  punctuation, only from the front, and one letter: a quote or parenthesis is
  the note's own, a note that is nothing but its join keeps it, and an uncased
  script is left alone.
- **Refusing is a first-class outcome**: `lemmaMarked` is true exactly when the
  words were located and is the one prop that suppresses the headword, so the
  two can never disagree. Dropping the headword unconditionally would have
  deleted 18,658 of the corpus's 22,310.
- **A commentary's card keeps its headwords only at the TRAILING mark**, whose
  notes name no words in the text and which is the one card holding several. An
  anchored mark carries exactly one note (`anchorCommentaryLines` pushes
  `notes: [note]`) and the verse is lighting the run it quotes, so the card
  printing it repeats the words the reader just pressed.
- **A default outlives the argument that set it.** `lemmaMarked` defaulted
  false "because a card may hold several notes", written two days after an
  inline mark stopped holding more than one — and the headword left standing
  under every lit run then read as a deliberate difference from the prayers.

**A commentary's marks sit at the words its notes quote**
(`commentary-anchors.ts`): 24,805 of 45,662 notes placed (54.3%), the rest on a
trailing mark at the verse's end, so the run has no holes.

- **The ORDER of the notes is the disambiguator.** 1,939 of Haydock's headwords
  occur more than once in their verse; a catena is printed in reading order, so
  the search carries a CURSOR and each note is found at or after the end of the
  last — 1,930 resolve, and the nine that do not (plus 237 whose headwords run
  backwards) are refused rather than guessed.
- **The inline marks and the trailing mark PARTITION the verse's notes** — no
  note behind two marks, none behind none, pinned by a test because a leak would
  lose a fifth of the apparatus with nothing erroring.
- **`buildSegments` is a module because it had to be testable**: three separate
  cuts run through one verse (edition markers, edition lemmas, commentary
  lemmas), and any off by a character silently drops or repeats a word of
  Scripture. The round-trip property (`segmentText(segments) === text`) is in
  vitest and was run over all 20,789 annotated verses of the real corpus.
- **An anchor that straddles a cut is dropped to the trailing mark**, so two
  apparatuses never nest.
- **`commentary-anchors.ts` imports `./lemma.ts` WITH the extension** (like
  `route-manifest.ts` writes `./address.ts`): the anchoring is measured from a
  plain Node script, and the type-stripping loader will not resolve an
  extensionless relative specifier. Vite resolves it either way, so tidying it
  away breaks the measurement silently and not the site.

**The open state is a binding, not a field on `sidenoteRoom`.** `sidenoteRoom`
is the MARGIN's object; a verse with its own notes is local to one unit, and a
page-wide field there is a singleton needing a key both sides agree on.
`AnnotatedText` pairs on the PIECE INDEX alone. **It is an `onopen` callback,
and was `$bindable` for an hour**: `openNotes` is a deliberately sparse array,
so a parent binds a slot that is still `undefined`, and Svelte throws
`props_invalid_value` on a fallback plus an undefined binding — at HYDRATION, a
runtime error nothing in `npm test`, `npm run check` or the build sees.

### The prayers' apparatus, a second unit space

`commentary.preces.{lang}`'s units name a `Prayer.slug`, not a verse. Almost
everything above is unchanged; what is new:

- **The cursor walks the prayer, not the line, and so may a quotation**
  (`anchorCommentaryLines`). Resetting the cursor per line would give two notes
  the same repeated clause — `Mary` occurs in three lines of the English Ave.
  And a clause the edition set across a break is still one clause: confining a
  span to one line placed 77 of the tier's 120 headwords; spanning it places
  every one. Each line lights the words it prints and only the last takes the
  dagger (`PlacedAnchor.showMark`), or one note raises three marks onto one card.
- **There is no trailing mark and nothing hangs at the foot.** The pipeline
  stores only notes that quote a clause, so every note anchors and the apparatus
  IS the marks in the text. `placePrayerCommentary` still returns what it could
  not place, named `unplaced` and rendered nowhere — the two folds could only
  ever disagree in silence, and a name is what lets a test say so.
- **What the dropped notes became is the prayer's REFERENCES, and they are not
  the apparatus** — the Gospel the prayer is printed in, the Catechism's article
  on it, the Compendium's questions, as links under the text. **A note is one
  book read in one LANGUAGE; a reference is an ADDRESS, and an address is the
  same for every reader** — so they are one language-free table,
  `corpus-index.ts`'s `prayerReferences`, keyed by slug, index tier, eager,
  switched by nothing. As `PrayerCommentary.references` they were absent from
  the four collections with no Catechism and no Compendium, whose readers saw
  nothing under any prayer, for a claim their language has no bearing on. The
  ranges are the pipeline's and are checked there; `PrayerReferences` decides
  only how a range is written down, and takes each siglum from the reader's OWN
  edition of that work, falling back to the annotated language — because the
  link opens the reader's edition. It is `CitedBy`'s panel turned around, so it
  takes that panel's treatment whole, its COLUMN included: set as a single
  wrapping line first, the groups ran together into a sentence of numbers. **The
  panel is not scanned, it is recognised.** The links PREVIEW: that opt-out is
  for navigation chrome.
- **`CommentaryNote.locus` labels a note with the paragraph it IS, and links
  it.** One work draws on two books, so a manifest-level attribution would tell
  half its readers the wrong one; the siglum comes from that source work's own
  `short_title` in the corpus, never a literal.
- **Both columns are glossed while comparing**, where the Bible's chapter route
  suppresses its commentary — that route's second column takes the apparatus
  lane, and this one has no lane to take. Each column reads its own edition's
  commentary, and the placement is the ROUTE's, over the whole prayer, because a
  compare cell is one line and a quotation may cross a break. One switch still:
  the choice is stored per family, so both columns move together.
- **The card does not print the headword, because the line is lighting it.**
  `CommentaryGloss` takes `lemmaMarked`, defaulting false so Haydock is
  unchanged — a verse's card may hold several notes at one mark; a prayer's
  holds exactly one, always anchored.
- **It shares its line with the initial.** A prayer set in verse takes a
  one-line versal on its opening line (`.drop-cap-versal`, dropcaps.css — three
  lines would indent lines the SOURCE broke, every printed line being its own
  `<p>`), and that line is also where the apparatus's first mark tends to fall.
  "A glossed line takes no initial" would have been the feature switched off,
  and refusing only a CONTENDED opening was barely better, three of the four
  glossed English prayers opening on their own first lemma. `prayerCap` takes
  the letter out of whatever run opens the line, quoted words included, and
  `capSegments` keeps that run's kind so the rest of it still lights. **Which
  blocks take one and at which size are properties of the PRAYER**
  (`opensInVerse`, `prayer-lines.ts`), never of the block: sized block by block,
  `Let us pray;` gets a three-line cap overflowing four words into the collect
  below. `prayer-cap.ts` is a module because the slice is an offset into a
  string `buildSegments` has already cut.

## `scrollIntoView` moves the page, so a list never calls it

Use `$lib/reveal-row`'s `revealRow` to bring a current row into view.
`scrollIntoView` scrolls **every** scrollable ancestor up to the viewport, and
performing a scroll on a box aborts a smooth scroll already running on it — so
`StructureSidebarToc`, whose current row is `spy.current` on half its routes,
cancelled the keyboard reference step's animation the moment the step crossed a
section boundary. Setting one container's `scrollTop` cannot move the page. The
same call is wrong inside a modal for a second reason: the document behind an
open dialog is inert but still scrollable.

**The scroll the site DOES compute is `$lib/smooth-scroll`'s critically damped
spring, never `behavior: 'smooth'`**: a second native `scrollTo` restarts the
first, and a held step key repeats thirty times a second. Retargeting a spring
keeps both position and velocity continuous, so nothing restarts. It yields to
any other scroll by noticing the page is not where it left it — one check that
catches the wheel, the scrollbar and the keys alike.

- **It answers three movements, and the two whose distance the READER chooses go
  through `glideScrollTo`** — the way back to the top and every same-page
  fragment jump. A spring settles in constant time whatever the distance, so
  peak speed is `ω·distance/e`: `glideStart` jumps the surplus and glides the
  last `GLIDE_VIEWPORTS` (1.5), or a table-of-contents row at the far end of
  `/documenta/[slug]` strobes a part of the Catechism past the reader.
- **A fragment jump is REPLAYED, never intercepted** (`$lib/anchor-scroll`): the
  browser jumps, and this rewinds the page to where the click found it and then
  glides. Taking the click would mean owning the history entry, the `hashchange`
  and `page.url` — and a hand-written `pushState` duplicates
  `sveltekit:history`, so Back lands on an index the router reads as no movement.
- **It targets the ELEMENT, not the offset the element stood at**
  (`glideScrollToElement`). The browser computes that offset before any of the
  travel; a font swap above the target re-measures it mid-glide, and the scroll
  anchoring that compensates trips `DRIFT_TOLERANCE`.
- **A scroll the site performs reports its destination and nothing on the way**,
  and the unit a reader ASKED for is reported at the click (`onFragmentAsked`)
  rather than measured on arrival. The sidebar renders only the branch holding
  the current row, so each intermediate answer mounts a subtree and lays out its
  text — forty of those per glide where a jump had cost one.
- **`.reading-aside` and `.index-aside` take a fixed `height` and
  `scrollbar-gutter: stable`**, being the two scroll containers `html`'s own
  reservation (base.css) had never reached: expanding a branch changed the
  list's height, brought a scrollbar in, and re-wrapped every row.

## A highlight resolves to a unit, and the popover acts on that

A selection in the reading text raises bookmark, copy and copy link
(`SelectionMenu.svelte`, mounted once in `+layout.svelte`; `selection.ts` for
the half that is testable, rationale in `site/docs/reading.md`).

- **A bookmark is an address, so a highlight is resolved to the unit it lies
  in.** Storing the offsets would name a different phrase in the next edition,
  and following the reader across editions is what that store exists for
  (`bookmarks.svelte.ts`). The exact words go to the CLIPBOARD, where they cost
  nothing later.
- **A route opts in with `data-unit-href` and renders nothing.** It goes on the
  element that already computes that address for the bookmark wash; every
  `.reading-text` carries the PAGE's address as well, so `closest` takes the
  nearest and the matter between the units — an introduction, a heading, an
  unnumbered appendix — still resolves.
- **A bookmark made by highlighting keeps the WORDS as well as the address**
  (`quote`, `quotedFrom`), which breaks "an address and nothing else" on
  purpose: a highlight is a different act from pressing a number, and
  re-deriving the unit throws away the only part the reader chose. Both fields
  are optional and nothing derived reads them; the edition is recorded because
  a frozen quote under a re-derived citation otherwise claims to be the
  reader's current text, and it is what the wash below compares. Clamped at
  `QUOTE_MAX` — one localStorage key holds the whole store.
- **A stored quotation says where it was cut and a copied one does not**
  (`elideQuote`). A library row is read months later under a citation and no
  text, so a phrase out of the middle of a verse would look like the verse; a
  clipboard quotation is pasted into a sentence the reader is writing, where
  the elisions are theirs to place. Measured against the UNIT the bookmark
  names, apparatus removed first, so it is a fact about the selection.
- **An edition is NAMED only where one language could hold more than one, which
  is the Bible** (`EditionMenu`'s `editionStyle`, `/signata`'s quote).
  Everywhere else the edition is the language, so its title only repeats the
  work the section heading and the citation have already said — the library
  printed "Dilexit Nos" under a row reading `Dilexit Nos 2`.
- **The wash over a quoted bookmark is the sentence where it can be and the
  unit otherwise** (`QuoteMarks`, `quote-mark.ts`). A ladder: same edition and
  words found → the words; different edition, words absent, or no Custom
  Highlight API → the unit, which is what the site did before. A different
  edition is not a failed search — a fold loose enough to cross a translation
  would mark a sentence nobody chose, so the edition is compared before the
  text is read.
- **A style keyed on an attribute set at RUNTIME cannot live in a scoped
  block.** Svelte prunes a selector nothing in the component's markup can
  match, silently — `[data-quote-marked]` is written by a global component and
  its rules are in `styles/`, `.verse.bookmarked`'s included, though that class
  belongs to one route.
- **Ask a range what it CONTAINS, never what its boundaries touch.** A
  selection ending on an element boundary reports its `endContainer` as the
  parent, so walking up from it lands on the surface rather than the last unit
  — which made a highlight across three verses bookmark the first, with every
  address in the comparison correct and every test passing.
- **A Bible highlight across verses saves the passage; no other work's does.**
  `hrefFor` already writes `?v=3-5#v3`, and nothing else can spell a range
  without a new address shape in the sitemap, the worker and the route
  manifest.
- **Both ends must be on ONE `.reading-text`**, which is what makes compare
  mode's divider a boundary rather than a passage claimed out of two texts.
- **The quotation is cut from a clone with `APPARATUS_SELECTOR` removed** — a
  verse's span contains its own reference number, so the raw text of a whole
  verse begins `3In the beginning`.
- **An `auto` popover opened from a pointer event that is not `click` must be
  deferred by a task, or light dismiss shuts it in the same gesture.** The
  browser records the pointerdown target and acts at pointerup, after dispatch;
  with nothing open at pointerdown that target is null, and the ancestor of a
  run of prose is null too, so the two compare equal and the panel is dismissed
  as though it had been there all along. The symptom is a popover that never
  appears, with nothing logged.
- **It cost no new interface strings**, saying what the unit number's panel
  says in keys every dictionary carries. A surface that does what an existing
  surface does is worth checking for this before it is written.
- **Following an address that names a unit MARKS that unit** (`isArriving`,
  `.unit-highlighted`). Only the Bible reader did until 2026-09-10; everywhere
  else `#s3` scrolled and marked nothing, leaving a reader dropped into a long
  document to find what they were sent to. Never `:target` — these readers are
  reused across units, so a reused element keeps it after a hashless address
  replaces it, which is the trap `directVerse` already records.
- **Apparatus that sits outside the column is still inside the flow.**
  `.margin-note` is a float, so a drag down the text swept every citation
  beside it into the selection; it refuses selection, as `.reference-number`
  already did. Nothing is lost — the card the marker opens holds the same note
  and stays selectable.

## A shared link may pin an edition, and a canonical URL still may not

`?ed=` (`edition-pin.ts`), written by the highlight popover's copy link
alongside a native text directive. Rationale in `site/docs/addresses.md` and
`site/docs/reading.md`.

- **A query parameter on a canonical path is not a second address.** `parseHref`,
  the sitemap, the route manifest and the edge see the same path they always
  did — the rule that a canonical URL is edition-free is intact, which is the
  only reason this is allowed at all.
- **A link and a bookmark are different artifacts.** A bookmark stays
  edition-free so it follows the reader across editions; a link should show the
  recipient what the sender saw, and the highlight it carries is findable only
  in the edition whose words were highlighted.
- **It is shown, never adopted** — `?c=`'s rule rather than `?compare=`'s,
  because an edition is a fact about a person the way a territory is. And an
  explicit pick from `EditionMenu` drops it, or that menu appears to do nothing
  for the one reader who arrived on somebody's link.
- **Release it with `goto`, never `replaceState` from `$app/navigation`**,
  which does not update `page.url` — and `page.url` is where all four edition
  resolvers read the pin.
- **The words travel as a text directive, so the browser does the finding.** No
  offsets stored, no scheme to version, nothing for this site to paint; the
  costs are that the quotation is in the URL and that a browser without support
  marks nothing, which is affordable only because arriving at a unit now marks
  the unit.

## Focus mode: print's hidden list, with three exceptions and one gate

`data-zen` on `<html>` (`$lib/zen.svelte.ts`, a fifth axis written exactly as
`theme.svelte.ts` writes its four) and `styles/zen.css` is the whole behaviour.
The selectors are `print.css`'s, which argues each one in place — **do not
re-argue them here; add to both or neither.**

- **Three are deliberately not repeated, and each is paper vs screen.**
  `.unit-nav` stays (prev/next IS reading; print drops it because paper cannot
  be followed), `.reading-bar` stays emptied rather than hidden (it carries the
  way out), `.breadcrumb` stays (print's own exception, and with the header and
  sidebar gone it is the only thing left saying which chapter of which work this
  is).
- **Every rule is gated on `:has(.zen-toggle)`, so the toggle is the feature.**
  The preference persists across navigations and that button is the only
  control that turns it off, so without the gate a reader who left it on would
  meet the home page with no header, no footer and no way back. **A page
  honours focus mode by rendering the toggle** — every `ReadingBar` does unless
  it is passed `zen={false}`, which is off rather than merely hidden.
  `/calendarium/liturgia` is the one that declines it: a page whose only
  hideable chrome is the header the reader needs to reach another day.
- **Off below 641px, the button hidden at 640px.** A phone has no sidebar left
  to hide, and the gate is on the RULES and not only the button, for the reason
  above at a different width: the preference outlives the viewport.
- **Nothing moves.** Everything hidden is hidden with `opacity: 0` and
  `visibility: hidden` together, never `display: none`: the pair paints nothing
  and still holds every box, so the header keeps its height and the bar keeps
  the `--reading-bar-height` that `scroll-padding-top` is measured against. Add
  rules in that form, or the mode stops being free to leave on.
- **Hiding a container that holds a `<dialog>` disables the dialog, and both
  properties do it.** `JumpBox` and `Help` render trigger and `<dialog>` as
  siblings inside `.site-header`, so only the triggers are hidden;
  `display: none` would take the dialog out of the box tree (`layout.css` relies
  on that for `TocMenu`) and `visibility` inherits through the top layer. The
  bar's rule excludes `dialog` and `[popover]` in its `:not()` rather than
  overriding them — an override has to out-specify what it fights.
- **`zen` in the code, "focus" on screen.** The mode's name is what a developer
  searches for; the reader-facing string is not, on a site publishing the
  Catechism and the Code of Canon Law.
- **`Escape` leaves it, gated on `ShortcutContext.zen` and checked AFTER the
  overlay guard** — otherwise a dialog opened inside focus mode would dismiss
  the mode and stay on screen.

## The liturgical calendar is computed, and checked against someone else's

`$lib/calendar/` derives every day of any liturgical year from the date of
Easter and a table of fixed celebrations; `/calendarium` renders it. No content
tier, no manifest, no download wave — the only page whose subject is not a text.
`site/docs/calendar.md` holds the rationale for everything here.

**The table is ours because the Holy See publishes no calendar.** _Mysterii
Paschalis_ is on vatican.va; the _Universal Norms_ and the _Calendarium Romanum
Generale_ it approves are not. So `grc.ts` sits here rather than in the corpus,
on `pontificates.ts`'s precedent — a fact about the world that nothing upstream
states.

**What makes it trustworthy is `oracle.test.ts`, not care.** It compares every
day of three years in all eight transfer variants plus every national calendar
GCatholic publishes, against calendars GCatholic computed independently. Six
rules came out of it that reading the Norms had got wrong; two generalise:

- **An optional memorial never takes the day**, though line 12 of n. 59 sits
  above line 13. Reading the precedence table as a plain sort made every ferial
  Tuesday with a saint on it disappear into that saint — 100 days of 2026.
- **Rank and precedence are different fields and must stay so.** A feast of the
  Lord is line 5 and a feast of a saint line 7, with a Sunday in Ordinary Time
  between them; both are `rank: 'feast'`. Comparing on rank gets the
  Transfiguration-on-a-Sunday case backwards and reads plausibly doing it.

**The oracle lives in the corpus** — `glossa-corpus/build/gcatholic-calendar/`,
untracked, rebuilt by `uv run pipeline/rebuild.py --only calendar` from `raw/`
with no network. It was 281 files and 28 MB in a public repository whose whole
packed history is 10.6 MB. **So `npm test` does not run it**: `npm run
verify:calendar` does, with its own `vitest.oracle.config.ts`, and
`package-scripts.test.ts` asserts it stays out of both `verify` and `test` — the
colon in the name reads as membership and it is not a member. **Without a corpus
it FAILS naming the path and the rebuild command**, never skips green.
`held.ts` — the result, and the only part the site acts on — stays here.

### The engine computes; a national layer is copied

Worth being exact about, because the two halves are checked differently. The
temporal cycle, the Table of Liturgical Days, transferred solemnities, Lenten
commemorations and `grc.ts` are derived here and judged by a calendar somebody
else computed — that is the half that can be wrong invisibly, and it is what
seven engine extensions came out of. A conference's proper celebrations are not
derivable from anything: they are a positive act, and even the hand-written
layers took their content from the oracle. **So for a country the NAME check is
a transcription check; for a derived layer it is circular**, and every generated
file says so in its own header.

**Adding a country is a data file and no code.** `NationalCalendar` is a layer —
propers, overrides, transfers, and general celebrations kept on another day —
because that is what Universal Norms nn. 48–55 describe. `national/common.ts` is
what a row is spelled with. Sixteen layers are written by hand and the rest
derived by `pipeline/derive_national_calendars.py`.

**The claim "no code" is true and every extension here was bought by a country
failing the oracle.** Each is a thing the eight variants of the universal
calendar cannot express:

- **A fourth Sunday transfer**: the Congo keeps the Sacred Heart on the Sunday
  (`sacredHeartOnSunday`), and the Immaculate Heart does NOT follow it.
- **`movable` propers**, placed by an offset from Easter or by an \_n_th weekday
  of a month — seven conferences keep the Eternal High Priest on the Thursday
  after Pentecost, the Philippines the Santo Niño on the third Sunday of January.
- **`'F'` in `common.ts` is a proper feast OF THE LORD**, line 5. This file
  argued for one afternoon that a country never needs it; the Santo Niño falls
  on a Sunday in Ordinary Time in 2026 and takes it, which only line 5 does.
- **`elevations` is called `overrides`** — Mexico keeps Scholastica and Padre
  Pio at a LOWER rank than the general calendar, and two layers change only a
  colour.
- **`since` on an override gates the OVERRIDE**, not the celebration.
- **`blue` is a `Colour`** — the _privilegio de azul_, in Spain and the
  Philippines and, measured, in none of the five Spanish-American calendars.
- **`Observance` is not a `Celebration`.** Thanksgiving, Independence Day,
  Germany's Whit Monday, Spain's Ember Days: the feeds rank them as nothing,
  because they are not lines of n. 59. Giving them a rank would lose the only
  true thing about them.
- **An observance says how far down it reaches** (`replaces`), and a SOLEMNITY
  leaves no room for one at all. Four calendars agree about the second — no
  ANZAC Day inside the Octave of Easter, no Ember Day on the Immaculate
  Conception — and a feast does not suppress one, so it is a threshold and not
  a general deference. How far `replaces` reaches is the conference's claim:
  Bosnia's Ember Saturday displaces an obligatory memorial and Austria's Whit
  Monday does not, and one rule for both would delete a saint from four
  calendars to add an Ember Day to one.
- **`nth: -1` counts back from the end of the month.** Southern Arabia keeps
  the Dedication of the Churches of the Vicariate on the LAST Sunday of
  October, which is the fourth in two of three years and the fifth in the
  other; counting forward cannot spell it, so it had been written as a table of
  years, which is a fact about three of them.
- **`transferable` on a proper FEAST**, and the impeded test compares against
  the celebration's own precedence rather than against the constant `SOLEMNITY`.
  Three dioceses move their cathedral's dedication off the Sunday it fell on
  rather than losing it; and reading n. 60's "nn. 1-8" as a constant is right
  only while every transfer is of a line-3 solemnity — a PROPER solemnity is
  line 4, so Haiti's patronal was dropped rather than moved when the Sacred
  Heart fell on its date.
- **`optionsInYear`** — `movedInYear`'s bargain, made for a transfer. England
  and Wales kept the Epiphany on the Sunday until Advent 2025 and on 6 January
  since, and `options` can hold one answer.
- **A proper the General Calendar has since taken up is not a second
  celebration.** Three conferences kept John Henry Newman before he was
  inscribed on 9 October, and from 2026 the day carried him twice.

**Eighty-five layers, ninety-six territories, and only what passes is
published** — three separate facts:

- **96 against 85** is eight particular churches standing for more than one
  place. `alsoCovers` on those layers puts the other territories in the picker
  without inventing a calendar for them; `TERRITORY_CALENDARS` resolves it.
  **`ALSO_COVERS` lives in the derivation** because it used to live nowhere: it
  was written into five layer files by a throwaway script that no longer exists,
  so it was regenerable only from the previous copy of its own output, and the
  first re-derivation dropped eleven territories out of the picker silently with
  every test passing.
- **`national/held.ts` is `site/unpublished.json`'s argument for a different
  kind of output**: a layer the oracle still disagrees with is kept out of
  `NATIONAL_CALENDAR_LIST` until it does not. **A reader cannot tell a calendar
  that is wrong on four days from one that is right, and this is the one kind of
  output where being wrong looks exactly like being right.**
- **The last test in `oracle.test.ts` asserts the list is EXACTLY the diverging
  set**, in both directions. Without it a regressed layer would be silently
  absorbed and a fixed one would sit unpublished for ever. `NATIONAL_CALENDARS`
  is keyed over ALL layers, held ones included, because the test has to reach a
  held layer to measure it; the route resolves `?c=` against the published list,
  so a held id in a pasted URL falls back to the general calendar.
- **`CALENDAR_FEED_IDS` maps GCatholic's code to the layer**, and the obvious
  derivation is wrong in a way that reads as right: taking the code up to the
  first hyphen answers `us` for `US-H` and `it` for `IT-rome0`, which is the
  Diocese of Rome — so the Vatican was checked against Italy's layer and Andorra
  against Spain's, and both failed on days neither had got wrong.

**Some layers share their propers, and `national/groups.ts` holds the rows.**
`withGroup` composes and **throws on a collision**, which is the whole safety
property: a date joins a group only where every member holds an identical list
on it. Three rules keep it a deduplication rather than a claim — whole dates
never single celebrations, one anchor language per group, and names that
describe the members and assert nothing about who approved the rows. It cost the
oracle nothing, because `oracle.test.ts` compares computed calendars and never
reads a layer file. `groups.test.ts` is in the hermetic suite because the throw
is at module load, and nothing in `npm test` imported a grouped layer once the
oracle moved out of it.

**The general calendar's 218 names reach twenty more languages, and the join key
is `DESCRIPTION`.** `grc.ts` carries Latin, English and Portuguese;
`calendar/names/{lang}.ts` carries the rest, transcribed from the national
feeds — `General-A`…`H` are published in the same three, and a national calendar
IS the General Calendar plus that conference's propers. **Never join a feed on
POSITION**: 9 October puts Denis first in Korean and last in Italian, and the
English name parenthesised at the head of `DESCRIPTION` is the only thing in a
feed that identifies a celebration across languages. A chunk per language, and
`celebrationName` reads `grc.ts` first — **these are not checked and cannot be**,
the oracle being where they came from.

**And 285 of the 365 days of 2026 are named by a FORMULA, which is not a string
to transcribe.** The sanctorale is the smaller half: 80 days carry a name of
their own, every Sunday and ferial weekday is composed. GCatholic composes them
the same way and its `DESCRIPTION` carries the English composition, so its feeds
are SOLVED for their pieces — fifteen patterns over six weekdays and thirty-four
numerals, ~1.5 KB a language against 40 KB of finished strings — and the solve
is checked by rebuilding every observed string out of them. **A solve that
rebuilds the feed exactly is the wrong one where the feed is wrong**: four
defects turned up, three outvoted inside the weekday family and Croatia's
thirteenth week DROPPED, because a numeral in digits can be checked against its
own key and `Trinaesta` cannot. A celebration carries `parts` for this; nothing
parses an id.

### `/calendarium`

- **It is a month listing** (`CalendarMonth.svelte`), where it listed the whole
  liturgical year filtered to its ~230 non-ferial days. It was a seven-column
  grid for an afternoon in between, and the reason that went back generalises:
  **this page is not a diary** — a day's name is a line of text of unpredictable
  length, which a column a seventh of the page wide cannot hold.
- **It lists the days that say something, plus the chosen day and today** — that
  second half is what makes filtering safe here and is what the year listing
  lacked, since a date typed, pasted or arrowed onto is always a row. **A row
  and a day are therefore not the same thing**, and the arrow keys walk ROWS,
  off one month's end into the next. Rows are real `?c=`/`?d=` links, not
  buttons; a keyboard move that crosses a month replaces every row, so the
  component names the date to stand on and refocuses it after the render.
- **Turning a page is not choosing.** The month being viewed is a second piece
  of state. One state in the URL was the tidier design and it priced out
  looking — two presses forward to see when Advent starts threw away the day
  being read about, and the clamp into a shorter month meant two presses back
  would not restore it. `view` follows the chosen day one way only.
- **The day's card is above the listing, and nothing may move under a click.**
  Two reflows, two rules. **A selection must not change text metrics** —
  `font-weight` on a row whose name runs to 111 characters rewraps it and shoves
  every row below it down, so selection is an accent bar every row carries
  transparent. **The second was answered by freezing a height, twice, and
  neither box was the answer**: the list first (wrong end — its height is a
  property of the month, and nothing sits below it), then the card, which IS the
  box whose size moves for a reason the reader did not intend (804 of 1,095 days
  carry no optional memorial; the worst carries five). **A surface that ANSWERS
  may not be clipped to protect a surface that NAVIGATES**: the fixed card cut
  the last line off every day that had more to say. What survives is the
  metric-stable selection, which removed a movement rather than absorbing one.
- **A date is a query parameter (`?d=2026-04-05`), not a path.** It names no
  citation, so it is not a reading address; as a chrome path it would put an
  unbounded set of URLs into the sitemap for pages that are pure computation.
  **`/calendarium/liturgia` takes `?d=` and `?c=`**, so walking between the two
  pages keeps both the day and the country.
- **A COUNTRY'S CALENDAR IS A PATH AND A DAY IS NOT, and the test is whether a
  head can differ.** `/calendarium/brazil` is one of the published pages
  (`calendar/national/languages.ts` is the list); `?c=br` is the same parameter it always
  was, still read, still what names a territory keeping another's calendar, and
  now mirrored to the path on arrival. The distinction is not tidiness: a head
  is built from `pathname` alone, so every `?c=` shared one title, one
  description and one sitemap row, and no crawler could be told that a page
  about Brazil's calendar exists.
- **Each is published ONCE, in the language that calendar is published in**,
  and declares no `hreflang` alternates — what separates two of them is the
  days, not the words, so forty translations would be forty addresses claiming
  to be one page. `route-titles.mjs` writes the head; `held.ts` decides which
  calendars have an address at all.
- **A page whose language comes from its path must be painted in it.** The edge
  sets `lang` from `CALENDAR_PAGES` and `app.html`'s pre-paint block carries a
  copy of that table (`i18n.test.ts` pins it, as it does `UI`/`BCP`/`VAR`), or
  the document declares Portuguese in its head and paints English chrome under
  it.
- **Only the reader outranks the address, and the browser is not the reader.**
  `initialLang` walks four rungs — chosen, held, address, negotiated — and
  saves the first alone; a `/pt/…` prefix is a choice and saves, the address is
  not and does not. **A negotiated answer that saves itself disables every rung
  below it**: it used to, so every reader had a saved language from their first
  page view and no country calendar's address ever reached anybody.
- **An address this page wrote is not an address that speaks.** `mirror` holds
  the interface's current language for the session at every write, so pressing
  Brazil in the picker moves the calendar and leaves the language alone — the
  picker, the day, an arriving `?c=` and the remembered territory all go
  through it.
- **The address is a SLUG, not the layer's id.** Fifteen of the ids are also
  interface language tags and four name something else there —
  `tl` is Timor-Leste here and Tagalog in `/tl/preces` — so the segment is
  `brazil` where `?c=` keeps `br`. The slugs are written down and never
  derived: `Intl.DisplayNames` moves with the platform's CLDR, and an address
  that changed when a browser updated would break every link made to it. It is
  `BIBLE_BOOK_SLUGS`' decision a second time.
- **A calendar's NAME is written out per calendar, in its own language.**
  `Calendário Litúrgico Brasileiro`, not a territory dropped into a sentence:
  the adjective follows the noun in Portuguese, precedes and declines it in
  German, and is not a word at all in Chinese, so composing one needs a grammar
  per language where a finished phrase needs a speaker once. It is what both
  the `<title>` and `calendar.national.tagline`'s `{name}` take.
- **Everyone else gets one of two rungs under it** (`calendarName`): the
  written English name where the reader is English (`CALENDAR_NAMES_EN`), and
  `calendar.title` joined to the place otherwise — `Kalendarz liturgiczny:
Brazylia`. Composing is safe here and not in a sentence, because a label
  joined to a label needs no article. It must reach for the JURISDICTION and
  not the territory on the three ids that are a vicariate or a patriarchate,
  and must fall back to English rather than print the ISO code a platform with
  no name for a territory returns — including for a whole language it cannot
  name places in, which `Intl.DisplayNames` answers for in the browser's
  language rather than admitting (Latin). The edge keeps the endonym
  (`site/docs/calendar.md`).
- **A name from `Intl.DisplayNames` can be a label and nothing else.** It is a
  bare nominative with no article, which is why the tagline built around one
  printed "as United States keeps it", "wie Schweiz ihn feiert", "tel que le
  célèbre France" — no rule can supply the article, since which countries take
  one is a fact about each language's own list. It still names the breadcrumb,
  where a label is exactly right.
- **The card leaves in two directions and they are drawn differently.** The
  corner's glyph (`more`) is a SIDEWAYS move — the same day on another surface,
  which is `/calendarium` from the home and liturgy pages and nothing from
  `/calendarium` itself. **The word at the foot of the READINGS (`read`) is
  downward**, into the passages, and it is drawn where it is because of what it
  offers: more of that one section, not more of the card, whose other parts are
  the day's rank, its colour and its optional memorials. `LiturgicalDayCard`
  only forwards the prop; `DayReadings` draws it, as `LinkPreview`'s "Open"
  marker at that list's scale. A day the lectionary cannot answer for therefore
  shows no link, which is correct — there is nothing further to read.
  **The visible word is "Read" and the accessible name contains it** — an
  `aria-label` of "The day's liturgy" over a link reading "Read" gives voice
  control two names for one target.
- **`replaceState` from `$app/navigation` does not update `page.url`**, and
  every control on this page was inert because of it: shallow routing sets
  `page.state` and calls `history.replaceState`, and assigns `page.url` nowhere,
  so the address bar moved on every click while `selected` stayed on today's
  date. Silent in every direction.
- **A URL parameter no `load` reads does not need a navigation to change** — so
  that fix was the wrong half, and this page holds the day and the calendar as
  `$state`, seeded from `page.url` and mirrored back. `goto` per click ran the
  root layout's `load`, a `root.$set` over the tree and a focus and scroll pass
  for a page that fetches nothing.
- **Nor does it need `$app/navigation`, whose `replaceState` ends in a
  `root.$set` over the whole tree** — so the page writes `history.replaceState`
  itself, carrying `history.state` over wholesale and updating only
  `sveltekit:pageurl`. What that prop update looked like was not a re-render:
  `document.fonts` went `loading` on every click and the document spent two
  frames in a fallback face. **A flicker that moves the chrome on a page the
  chrome knows nothing about is a document-wide restyle, not a layout bug**, and
  `document.fonts`' `loading`/`loadingdone` events name it in one click where
  four rounds of measuring boxes did not.

### The calendar's controls

- **The picker is a grid of flags grouped by region** (`CalendarMenu.svelte`). A
  reader of that control already knows the answer before they read anything —
  they are looking for their own country, which they recognise by its flag
  faster than they can read a column of names in an alphabet that may not be
  theirs. The flags are emoji composed from the same ISO code the calendar is
  keyed by, so a country added to `national/` arrives with its flag drawn and no
  table to update; England, Scotland and Wales are tag sequences named from
  `SUBDIVISION_NAMES`, being the three ids that are 3166-2 subdivisions. Windows
  draws the pair as boxed letters, which is the country's own code and why the
  cells are sized for two letters rather than a picture; the name is the `title`
  and the `aria-label`. Ordered inside a region by the reader's own alphabet
  (`Intl.Collator`), so the layer table stores regions and not an order.
- **The general calendar is not the Vatican's, and the picker said it was** for
  a day. Vatican City keeps the Diocese of Rome's calendar — eleven propers no
  other calendar has — so 🇻🇦 stood for two different calendars in one control.
  The mark is 🌐: **a globe is not a territory.**
- **Every option in that panel is the same size, including the general
  calendar.** It was a full-width labelled row above the grid, on the argument
  that it is the default every other calendar layers over; a row twenty times a
  cell's area reads as a different KIND of thing rather than as a default, and
  its name is the group's `.label-micro` heading instead. The grid is
  `repeat(auto-fill, …)` and not `auto-fit`, because `auto-fit` collapses the
  empty tracks and a group of one drew a button the whole panel wide.
- **`?c=` names a TERRITORY, not a layer**: four cells select `ps`, and with the
  layer stored the trigger printed the alphabetically first, so choosing Israel
  answered "Cyprus". `TERRITORY_CALENDARS` resolves it, and a layer id stays
  valid because a layer's own territory is one it covers. **A held calendar's
  territories leave the picker with it** — what is held for a country is held
  for everyone who keeps that country's calendar.
- **The chosen calendar is remembered, and `?c=` overrides without replacing
  it** (`calendar-pref.ts`). Only a choice made in the picker is stored; arriving
  on somebody's `?c=pl` link shows Poland and leaves the reader's own preference
  alone — the one place this differs from `compare-pref`, which adopts its
  parameter, because **a territory is a fact about a person in a way a column
  layout is not**. It is applied by writing `?c=` into the address on mount,
  never by holding a value beside the URL.
- **A reader who has never chosen opens where they are** (`geo.ts`):
  Cloudflare's country, written onto the shell's `<html>` as `data-geo` by the
  worker already rewriting the head, ranked below the stored choice by
  `openingTerritory` — `??` and not `||`, which is what makes a stored
  `'general'` a choice rather than an absence. **It is the only thing in the
  served document that varies by reader**, so it is a second reason
  `wrangler.jsonc`'s `cache.enabled` stays false: a shared cache would hand one
  reader's country to the next.
- **And then there was one control.** The date field and Today both answered
  WHICH DAY and the month listing answers it better — by showing what is on each
  day — so both went and the picker stayed, being the only one that changes what
  the days MEAN. The card names `today`/`yesterday`/`tomorrow` beside the date
  from `Intl.RelativeTimeFormat`, not from three keys in thirty-seven
  dictionaries.
- **The controls live in the day card, and the home page carries the picker.**
  `LiturgicalDayCard` takes a `controls` snippet — top right, above the name
  under 44rem — because the controls answer WHICH DAY and the card is that
  answer. **The eighty-five layer files are a 184 KB chunk and the home page is
  the boot route**, so it reads them through `calendar/layers.svelte.ts` — lazy
  DATA behind synchronous readers — and never imports `./national`, which only
  `/calendarium` may do.
- **The date field prints the date, and the card stopped.** A native
  `<input type="date">` takes its format from the OS locale, not the interface
  language, so the page's own control disagreed with every date below it. The
  input keeps the value, keyboard, validation and picker and is hidden with
  `opacity` — never `visibility`, `display` or a clip, which take a control out
  of the focus order — under a span carrying `formatPromulgated`; a click
  anywhere calls `showPicker()`, and `:focus-visible` uncovers the real input,
  because typing into segments that cannot be seen is what this arrangement
  could genuinely break.
- **`:focus-visible` is not keyboard-only on a text-entry control — a browser
  sets it on a CLICK there too**, which is why that field blurs once a date is
  chosen. It does not blur while the reader is TYPING, since `input` fires as
  the last segment lands. **And a control whose width is its text moves whatever
  stands beside it**: the widest date is computable (twelve probes, one per
  month), so it is rendered hidden in the same grid cell as the real one, which
  is exact where a `min-inline-size` in `rem` would be one language's
  measurement.
- **`.menu-trigger` is an icon square and `.wide` is the one that carries a
  label** (`styles/menus.css`). A labelled button given the bare class cannot
  shrink below its own word as a flex item, so it renders text-width with NO
  side padding and nothing looks broken enough to notice. That page names one
  `--control-padding` on the row and the date face reads it too.
- **The page explains its own vocabulary.** Every word on the day's card is a
  term of art — a vestment colour, a rank out of the Universal Norms, a season
  that is not the English word, three lectionary counters. Two shapes, because
  the question has two: `TermGloss` behind each term (`SiglumGloss`'s mechanism
  with the citation half removed — the top layer is what lets it escape the
  card's `overflow-y: auto`), and `CalendarPrimer` at the foot, whose lead says
  what a liturgical year is FOR and whose folds are the vocabulary. **Both read
  the same `calendar.gloss.*` strings**, so tooltip and primer cannot disagree;
  the primer's lists are `satisfies Record<Season | Rank | Colour, true>` so an
  unexplained term is a type error, and a test pairs names against glosses in
  both directions.

## Languages: the interface is a superset of the content

`UI_LANGS` lives in `src/lib/ui-langs.ts` and `ContentLang` in `types.ts`; use
`isUiLang`/`UI_LANGS`, never a literal list (`app.html` and `usage-schema.ts`
each keep a necessary copy, and a test asserts both). `site/docs/languages.md`
holds the rationale.

**The superset is checked by `sync-corpus.mjs`, and was only asserted before.**
Five languages entered the corpus with no interface behind them in four days,
each inside a commit about something else, and the only visible trace was the
prayers' edition menu offering "hi", "zh" and "zht" as if they were titles. The
sync reads the real corpus and exits 1 on a language with no `LANGUAGE_NAMES`
entry or no dictionary. **The check cannot live in vitest**, which runs on two
Bible books in languages that have had dictionaries since the first week. Both
tables live in `src/lib/lang-names.ts` to make that possible — `corpus.ts` and
`menu-filter.ts` reach `import.meta.glob` and Node cannot import either.

**Still do not derive one list from the other.** The lists equalized and
separated four times in eight days. An interface language is not evidence the
corpus holds anything, and the next ingestion in a language with no dictionary
separates them again from the other side.

- **Three reasons to add an interface language**, and only the first two are the
  corpus: a content language that has none; the **reach tier** (`tl ko id ig
ml`), chosen by Catholic population rather than by what has been ingested; and
  a whole surface the site can answer with no chrome around it — `ja`, `mt` and
  `no` joined because `calendar/names/` names every day of the year in them.
- **A reader in a reach language gets their own chrome and English content
  through `CONTENT_LANG_FALLBACK`**; the alternative is the same content behind
  a language they do not read.
- **Adding a language means five places, all guarded**: `ui-langs.ts` (plus
  `RTL_LANGS` if right-to-left), the dictionary, `app.html`'s pre-paint copy,
  `usage-schema.ts`'s `UI_TAGS`, and `UI_LANG_NAMES` in `menu-filter.ts` — a
  `Record<UiLang, string>`, so an omission is a TYPE ERROR (it was an unguarded
  array, and a language missing there stayed reachable but unfindable). It
  cannot be derived from `LANGUAGE_NAMES`, which is keyed on CONTENT language
  and deliberately does not name the reach tags. The dictionary file needs no
  registration — `i18n.svelte.ts` globs the directory.
- **A content language that is not an interface language has exactly one place
  to go wrong, and nothing checks it.** `LANGUAGE_NAMES` in `corpus.ts` names
  each content language in its own language for the edition menu; an unnamed tag
  falls through to the tag itself, past every build, test and type error. Adding
  a content language means adding a line there in the same commit.
- **A key only English has is legal, silent and indefinite.** `t()` resolves
  `loaded[lang]?.[key] ?? en[key] ?? key` and `i18n.test.ts` forbids only the
  other direction — a key English does not have — so the four
  `document.kind.cdf*` labels added with the doctrinal office's decrees, norms,
  notifications and communications read in English in the other thirty-nine
  dictionaries and nothing reports it. The fallback is what keeps a new kind
  from shipping a bare key at a reader; it is not a substitute for the
  translation, and only a commit will say the translation is owed.

**`zht` is Vatican News's slug, not BCP-47, and `zh-Hant` throughout was weighed
and rejected.** A tag here is an IDENTITY and a subtag is a VARIANT: `baseLang`
folds `zh-Hant` to `zh`, which is exactly how `en` and `en-GB` become one row,
and `EditionMenu`'s `pairEditions` keeps only the first edition per base
language — so the Traditional prayers would have been unofferable and
unnegotiable. Right for English spelling, wrong for a script. `bcp47()` converts
wherever a tag leaves for a machine; the URL keeps `zht`. So `direction.css`
matches `:lang(zh-Hant)` **after** `:lang(zh)`, which also matches it at equal
weight; and `SCRIPT_VARIANTS` folds `zh-TW` to `zht` rather than `zh`, with a
copy in `app.html` for the pre-paint pass.

**Every `Intl` constructor must be handed `bcp47(...)`, and a test scans the
source for it.** `zht` is structurally valid BCP-47, so `Intl` does not throw —
it answers in the browser's default locale, past a `try`/`catch` that never
fires. **A shim is only as good as the places that remember it.**

**`dateLocale` in `dates.ts` is the one helper that scan allows through, and it
is stricter than the shim**: it cuts the region, runs `bcp47`, then asks
`supportedLocalesOf` whether the platform can answer — falling back to `en-US`
where it cannot, which is what Latin needs. **The order matters both ways**: cut
the region first (`pt-BR` is a language choice, not a country), convert after
(`zht` cut to `zh` resolves to Simplified). It replaced
`lang.startsWith('pt') ? 'pt-PT' : 'en-US'`, written when the site had two
interface languages, so every reader who was not Portuguese was shown English
dates for a year.

**Cutting the region makes the dictionary decide the variant, and `pt.ts` is
written neutral, Brazilian where no neutral form exists.** What a mixed variant
costs is not style but fact — `install.hint.*` quotes an iOS menu entry, which
Portugal and Brazil print as different words in different case.

**A dictionary need not be complete** — `t()` falls back to English key by key.
What the build enforces is `CHROME_KEYS` (`assertNamed` throws on an unnamed
chrome page, which breaks the `hreflang` cluster) and `bible-groups.test.ts`,
which demands all nine group names.

**But a set that renders as one list is complete or absent** — `bible.group.*`'s
rule read as the general one. One English heading among eight translated ones
reads as a bug, and no test says so outside that one family. That decides what
comes WITH each key rather than what to translate: `anchor.copyFailed` pulls in
the other five `anchor.*`, `lang.more` pulls in `lang.label`, `bookmark.empty`
pulls in `emptyHint` and `deviceOnly` — and `document.kind.cdf*` was held back
entirely, because those five join a filter list of twelve. **The unit of
translation is the surface, not the key.**

**And a key is shared by two surfaces only where the sentence is true on
both.** `jumpbox.hint` names the shortcuts that OPEN the jump box and was also
printed inside it, where those keys do nothing — a rewrite would have made 38
dictionaries wrong to fix one surface, so the box got a second key
(`site/docs/finding.md`).

**Twenty of the thirty-four dictionaries have never been read by a native
speaker** — every language added on 2026-08-31 was translated by an LLM in one
sitting. `colophon.whatThisIsStanding`, `footer.notEndorsed` and
`copyrightBody3` (canonical standing under Can. 216 at both lengths; how a
rights holder reaches us) are the three strings where a mistranslation costs
something real. Tiers, per each file's header: **grounded** (`mg`'s core terms,
read off `ccc.mg`'s own manifest — the corpus is the authority for a language's
Catholic usage, and the first place to look), **medium** (`fi lv sw vi be zh ko
tl id uk`), **low** (`he ig ml hi`, and `mg` outside its grounded terms).
**Deleting a doubtful string is a valid fix and a better one than leaving it** —
a removed line renders in English, so correcting these needs no coordination.
The keys that cannot be deleted fail the build instead.

**The colophon was the one page deliberately left untranslated, and that was
reversed**: the argument (a machine translation of the page about care with
words contradicts itself) proves too much, since a reader who cannot read the
page cannot weigh it either. Every dictionary carries all 31 colophon keys, with
a parity check over `src/lib/i18n/*.ts`. The honesty lives in each file's header
instead.

**A counterexample in a test will be overtaken.** Four tests used "a language
the interface does not have", spelled `mg`, then `sw`, then `ko` — the interface
grew into all three within a day. They are Icelandic and Estonian now, with
comments saying why: it can no longer be a content language at all.

**Any resolver that reads `i18n.lang` as a CONTENT language is wrong for two
thirds of the list.** `content.catechismPairLang()` answered `i18n.lang`
outright — a language the Catechism/Compendium pair may not exist in — so
`columns` was empty and `work` being undefined took the `ReadingBar` with it: a
blank page whose missing control was the language picker itself. It walks
`contentLangChain` now. Everything else already went through `editionInLang`.

### The two language pickers

`src/lib/menu-filter.ts` holds everything that is not markup.

- **Matching is `highlight.ts`'s `filterByQuery`, never a fresh one** — what it
  buys here is the FOLD (`Čeština` reachable by `cestina`) and the misspelling
  fallback (`portugese`, `brasil`), and the third surface it reads is
  `Intl.DisplayNames`, so an English reader finds German by typing "German".
- **The fold leads with `navigator.languages`, and corpus weight is only the
  filler.** Weight alone buried Korean under the Korean reader. `orderUiLangs`
  pins the reader's own languages in the browser's own order, plus their last
  manual choice, then tops up to twelve by weight. `PRIMARY_UI_LANG_COUNT` is a
  FLOOR for the pinned block, not a ceiling.
- **Ordering by the browser does not break the stability rule; ordering by
  weight would.** The rule forbids a sequence that changes UNDER a reader, and
  corpus weight moves on every deploy. Everything below the pinned block stays
  in `UI_LANGS` order.
- **The edition pickers rank on `readerLangChain`** — interface language, then
  the browser's languages, then the fallback neighbours, whole. The browser sits
  above the neighbours because that is the half a table cannot know (`hu → de`
  is a good guess until the browser also says English). The alphabetical sorts
  stay as the tie-break; `orderByLangChain`'s sort is stable for that reason
  alone.
- **Ranking a panel is reader-shaped; resolving an address is not.**
  `editionInLang` still walks `CONTENT_LANG_FALLBACK` alone, so the menu's top
  row and the column on the page can name different languages (the tick says
  which is showing). Deliberate: **which text a citation resolves to must be a
  property of the language**, or the same address gives two readers two
  documents — and feeding the browser into resolution would put `navigator`
  inside `corpus.ts`, which the build scripts import from Node.
- **`browserLangs` is the RAW list and `browserUiLangs` filters it** — the two
  menus filter against different things (chrome vs texts), and filtering once
  against `UI_LANGS` would lean on the superset relationship `ui-langs.ts` says
  never to derive from.
- **Typing ignores the fold entirely**, which is what makes the guess tolerable:
  being wrong costs three keystrokes, and the order is the same folded,
  expanded and filtered.

### Direction and versification

**Direction is a property of the text, not of the reader.** `<html dir>` follows
the interface language; content regions get theirs from the `lang` they declare,
in `src/styles/direction.css` (imported last by `app.css`, deliberately). **Both
halves are hand-maintained and both were wrong for Hebrew** — keep both in step
with `RTL_LANGS`. `--prose-char-advance` is a property of the SCRIPT and had the
same bug (keyed to `ru` alone while 31 Byelorussian editions used the Latin
measure). Write CSS in logical properties; the stylesheet is entirely logical
and the components are too.

Citations may use Hebrew or Vulgate versification. The corpus canonicalizes on
**Vulgate**; `site/src/lib/versification.ts` converts — the only implementation,
since its Python twin was deleted as drift. **A wrong chapter does not fail an
existence check** (`Joel 3:1-5` resolves to real but wrong text), so conversion
is applied unconditionally for divergent books rather than as a fallback.

**An edition stored in another numbering is converted at the sync, never at
render** — `sync-corpus.mjs` is the one seam, and downstream there are no
exceptions to Vulgate numbering. Three tables feed it and none may be folded
into another, because each answers a different question about where its rows
came from:

- **`psalm_numbering`** is a tradition a CITATION can also be phrased in, so
  its mapper is what `refs.ts` resolves references with. `bible.crampon.fr`.
- **`book_arrangement`** is where one edition chose to print a passage, and
  applying it to a citation would move "Esther 13" under every reference into
  the book. `bible.cpdv.en`. **A permutation is not a paraphrase** — CPDV's
  Esther carries all 274 of its verses onto the Vulgate's 275, so re-addressing
  it costs no text (`divergence.py` re-derives that bijection every run).
- **`RENUMBERED`** is one edition's LABELS in the chapter it printed them in,
  and it is keyed by WORK ID because it is the one of the three no manifest
  declares — the other two record what an edition says about itself and a
  scraper writes them down; these rows were measured against the Clementine.
  Six chapters, four editions. Never reachable from a citation, for
  `book_arrangement`'s reason.

**Rows, not offsets, and the two shapes are why.** Three editions shift a whole
chapter (Ps 147 numbered 12–20 for the Vulgate's 1–9); two agree with the
Clementine nearly throughout and diverge at one verse, so an offset over
`bible.straubinger.es`'s 2 Samuel 13 would move thirty-odd verses that are
already right.

**A heading may be anchored above a chapter's first verse where a verse may
not**, which is why `toVulgateChapters` takes a `mapAnchor` beside its
`mapVerse`. Douay-Rheims prints one over the whole of Ps 115 and Ps 147 at
`before_verse: 1` — no verse of either chapter in either numbering — and the
schema has no field for a heading belonging to a chapter. Folding the rule into
the verse mapper would silence a real defect.

**Re-emitting an unchanged unit dates it today**, so the renumbering relabels
in place instead of going through `toVulgateChapters`. That function rebuilds a
book from scratch — right where a chapter can split or merge, and free-looking
everywhere else — but `lastmod.mjs` fingerprints a chapter with
`JSON.stringify`, and a rebuilt object serialises its keys in a new order. Two
chapters changed and the ledger moved 169 addresses. **Anything that rewrites
stored units owes the ledger a check of how many it claims to have touched.**

**A check that reports what the sync already answers is a check nobody
clears.** `edition_check.py` reads the exported tables and downgrades exactly
those chapters to notes; `PLAN.md` holds what is left, which is the same defect
where a count-based comparison cannot see it.

## The footer imprint

**The standing statement is in the FOOTER of every page, not only on the
colophon.** `footer.notEndorsed` — "Not endorsed by the Holy See" — is
`colophon.whatThisIsStanding` in one line, on the reasoning that Can. 216 is
provoked by the NAME and the name is in the wordmark at every address the site
answers. It says "the Holy See" and not "the Vatican" (the state, not the
authority) nor "ecclesiastical approbation" (exact, and unreadable in a footer).
**It is this short because the colophon is reachable from the same footer** —
the link is the last entry of the index's Pages column. Take it out of the
footer and this sentence has to grow.

- **The imprint's lines are one chrome.** Motto and disclaimer, one column,
  `.site-footer p` in one rule, spacing from `line-height` so the even leading
  is one number. One FACE across both, and the motto is set as the device: small
  caps, tracking, a tenth over the disclaimer's size, and `font-weight: 900`,
  which is the top of Source Sans 3's declared `200 900` axis and so an
  interpolation rather than a synthesised bold. Both the step and the leading
  are custom properties because the mark's size is computed from them.
- **Reach for the global rule before writing a footer-local one.** The imprint
  overrode `a` back to `--color-text-muted` with no underline, which left the
  footer's only link indistinguishable from the statements under it — an
  affordance disguised as a caption — and the fix was to DELETE the override.
  The index's links are the same rule from the other side: a column of names is
  a list-shaped surface, so it drops the resting underline, and **the hover is
  that underline arriving**. Declare only `text-decoration-line`, never the
  shorthand, which resets the colour and thickness `base.css` owns.
- **The mark is measured from the lines beside it, not set**:
  `calc(2 * var(--imprint-leading) * 1em + 0.4rem)`, so it stands slightly proud
  of the block and follows it if the leading or the footer's font-size moves.
  Keep it above about 36px, where the potent bars and the four crosslets start
  closing up.
- **`JerusalemCross.svelte` is inline SVG because an `<img>` cannot see the
  theme.** `<html>` carries four independent axes — `data-theme`, `data-sepia`,
  `data-oled`, `data-mono` — and a referenced SVG is a separate document that
  sees none of them; the most it could read is `prefers-color-scheme`, which
  covers one axis and gets `data-theme='light'` on a dark-preferring OS
  backwards. Inline, `fill: currentColor` follows all four for nothing. It is
  its own file rather than an entry in `Icon.svelte`, whose docblock promises it
  is the only importer of `@lucide/svelte`.
- **The geometry is not ours**: Wikimedia Commons'
  `Cross-Jerusalem-Potent-Heraldry.svg` by AnonMoos and Melian, public domain,
  verified through the Commons API before it was copied and credited in the
  docblock anyway. Three of our own drawings preceded it and all three were
  guesses at proportions the heraldry has already settled. The `<use
xlink:href>` pairs were expanded into rotations about (280, 280) — proved by a
  pixel diff of zero — because `id`s in a component collide if it is ever
  rendered twice, and `xlink:href` is deprecated. **Draw the plain five-cross
  figure and nothing else**: no crown, no motto ring, no red-on-white in the
  Order of the Holy Sepulchre's arrangement, because a mark drifting toward a
  specific body's ARMS would contradict the sentence beside it.
- **The mark and the lines are ONE group in TWO GRID COLUMNS** (`.imprint`): the
  mark is beside the text without being in with it, so it cannot reflow the
  lines. A flex row did this for one revision and `flex-wrap` let the mark drop
  onto the text's line at narrow widths. Written in reading order and never
  positioned, so **RTL needs nothing**.
- **The footer is one band on the header's margins**: `.footer-inner` restates
  `.header-bar`'s container — 90rem, `margin-inline: auto`, 1rem inline — with
  the imprint at one end and the index at the other, so the cross sits under the
  wordmark. **The container is a resemblance maintained by hand**; change one
  band's three declarations and change the other's. It was two centred stacks
  first, and **a centred pair of columns of unequal width does not put its text
  on the page's midline**. Below 54rem it stacks and re-centres.
- **It was absolutely positioned in the inline-start lane for one revision**,
  and the cost was a trick worth not reintroducing: `.site-footer` needed
  outsized SYMMETRIC inline padding whose only job was to reserve that lane on
  both sides. Pad one side and every line shifts by half the difference — wrong
  in a way nobody can name.
- `Ad maiorem Dei gloriam` is untranslated and carries `lang="la"`, the only
  Latin in the chrome. None of it prints — `.site-footer` is in `print.css`'s
  hidden list, and the colophon carries the full statement.
- **The build id is at the foot of `AdvancedSheet`, not a third line here** — a
  dialog opens over the document already loaded, so it answers "did this update
  land" about the page in front of you exactly as the footer did, without
  spending a line of the imprint on the one reader who asks.

## The day's readings are computed, and the crawl is the oracle

`rules.ts` derives the Ordo Lectionum Missae's number from the `LiturgicalDay`
alone — Easter's weekdays are `255 + 6·week + (weekday − 1)`, Ordinary Time's
Sundays `61 + 3·(week − 1) + cycle` — so a reader asking for 2040 is answered by
arithmetic and not by whether anybody crawled it. The date index that used to
ship is `days.oracle.json`, imported by `rules.test.ts` and nothing else.
`site/docs/lectionary.md` holds the rest, including a §THE GAPS that is the
first thing to read before believing this feature about any particular day.

- **`table.json` ships `masses` and NOT `days`.** What set 130 IS has no year in
  it; which day keeps it is computation. A static import of that table from a
  component the home page renders is the third silent route into the boot chunk
  — it is fetched behind `retryableOnce`, and preflight is what says so.
- **The weekday number does not depend on the weekday cycle**, which looks wrong
  and is not: the OLM prints Year I and Year II under one number in parallel
  columns, and the cycle selects a column.
- **A day can have several Masses and they are not variants** — Christmas is
  four, the Assumption a Vigil and a Day, Holy Thursday the Chrism and Evening
  Masses. `FORMULARIES` returns all of them, labelled. **The Ascension is not
  one of these**: USCCB prints two numbers because six US provinces keep it on
  the Thursday, which is two calendars rather than two Masses.
- **A memorial's proper is not always the first half of a `N/M` pair.**
  `520/317` puts it first and `459/650` second; the Proper of Saints begins at
  507, and keying by position filed the Passion of John the Baptist under 430, a
  Thursday in Ordinary Time. The OLM scan oracle caught it.
- **Two calendar defects came out of this and are recorded, not worked around**:
  St Joseph transferred backward in 2028 where the Universal Norms send him
  forward, and an Ordinary week-1 Sunday emitted in a year where the Baptism is
  displaced — there is no First Sunday of Ordinary Time.
- **The citation is an address and is written in the reader's language**, which
  is the one place on the site a citation is not reproduced as its source
  printed it — everywhere else the source is the work being read.
  `lectionary/cite.ts` rewrites `Ezekiel 33:7-9` to `Ez 33,7-9` out of
  `bookAbbrev` and `grammarSurface` — the parser's own tables, never a form
  written here — and `RefText` then parses it in that language, so there is one
  renderer and one parser. **English is not exempt** (`Ez 33:7-9`): it took the
  source's own spelling for a day and put two conventions on one card. **The
  round trip is verified at RENDER**: a rewrite that does not parse back to the
  same books, chapters and verses is discarded and the English stands, which
  caught three silent mis-readings on its first run over the table.

### `/calendarium/liturgia` prints the passages

The card lists the day's citations; this page sets out the verses under each,
out of the reader's own Bible edition, and adds the two prayers a rubric
appoints to a day. `site/docs/lectionary.md` holds the design and a §7 that
measures what still prints no passage.

- **A pericope is printed whole or not at all.** `refs.ts`'s `passageSpans`
  reads a citation as VERSES where `citationPieces` reads it as a DESTINATION,
  and the two under-answer in opposite directions: an unplaceable piece is
  drawn as text and says nothing false, where a passage cut short cannot be
  told from a complete one.
- **It crosses chapters, and nothing else in the reference system does** — an
  `Address` holds one, so `Genesis 1:1-2:2` is one link and two chapters of
  text. Chapter lengths come off the edition's own index, never a table here.
- **Every span is minted by `refAddress`**, the synthetic segment naming a
  crossing's landing chapter included, so the Vulgate mapping applies here
  exactly as it applies to the link and the text cannot come from a chapter the
  link does not open.
- **A citation naming verses and placing none is not a whole chapter.**
  `refAddress` degrades that to the chapter alone, which is right for an anchor
  and would be fifty verses printed where five were cited; the two verse-less
  answers are told apart by what was ASKED, not by what came back.
- **The caveat is behind the same `i` here as on the card**, and paper gets it
  unconditionally under the list on both. One arrangement for a line that
  qualifies something rather than saying it — `ArtFigure`'s — and a page of
  Scripture is where a paragraph of small print over the first reading would be
  least read, not most.
- **It is a READING page and is laid out as one**: `.content-column` and a
  `ReadingBar`, not `.landing-column`, and the passages are `.reading-text`, so
  the face, the measure and the reader's own size setting are the ones a
  chapter of Genesis is read in. A reading page with no aside is a bare column
  — `/preces/{slug}` is the precedent — not a one-sided grid.
- **A verse number is a `ReferenceNumber` pointing INTO the Bible**, not at
  this page: the chapter is not on screen, so `#v{n}` here would name nothing.
  Only a run that opens a chapter the previous one did not is headed by its
  number, because that is the only place the restarting numbers would read as
  one chapter.
- **The bar carries print and the edition picker.** `EditionMenu`'s route map
  had to be told this path exists — its own docblock records that a work
  missing from that map fails by rendering nothing at all — and here the Bible
  edition is not a preference behind the text but the text itself.
- **It is in `STATIC_PATHS` and not in `CHROME_PATHS`** — it must answer a cold
  load, and it must not declare a 37-language cluster over a body that is
  corpus text in whichever edition the reader has open.
