# site/CLAUDE.md

Operational notes for the site. The repo root's `CLAUDE.md` holds the
corpus-safety rules that apply before any of this (where the corpus lives,
what may be deleted, the lint hook); **`site/docs/*.md` holds the rationale**
— `addresses`, `languages`, `references`, `shell`, `edge`, `reading`,
`finding`, `calendar`, `usage`, `linking-out`, `colophon`, `dev-loop` — with
`docs/decisions.md` holding only posture, scope and process.

## The boot payload has a ceiling, and the deploy enforces it

Everything `index.html` asks for before it can paint. It was **6.30 MB of
JavaScript and is 0.47 MB** (2026-09-03, `site/docs/shell.md`); `npm run
preflight` prints it and refuses to deploy over `MAX_BOOT_JS_BYTES` in
`scripts/preflight-deploy.mjs`. Re-measure rather than quoting the number.

**Vite's `chunkSizeWarningLimit` is not this check and cannot be.** It fires per
chunk, so it says nothing about a payload split across twenty of them, and it
cannot tell the content URL map (1.34 MB, `await import()`ed) from a chunk every
route parses. It is raised to 1,700 kB for that reason — the app build is quiet
and the service worker's still warns, because SvelteKit compiles that one with
`configFile: false` and does not forward the option (the same gap
`assetsInlineLimit` has, below).

**Three things put data in the boot chunk, all silent, all one word wide:**

1. **An `import.meta.glob` over `corpus-data/` that lost `query: '?url'`** —
   `{ eager: true, import: 'default' }` compiles the JSON into the importing
   chunk. Nothing errors. This is how 2.92 MB of index tier got there.
2. **A static import of `corpus-assets.ts` from anything but
   `src/service-worker.ts`** — it eagerly inlines `content-manifest.json`
   (1.59 MB). Its docblock has always said "importing this from there and
   nowhere else is what actually keeps it out of the app"; `usage.ts` and
   `library.svelte.ts` each broke it anyway, when the file was small enough that
   nobody noticed.
3. **A static import from a component the layout RENDERS**, even one whose whole
   body is behind `{#if open}`. Svelte still mounts it, so `JumpBox`'s
   `suggest.ts` (with `refs-grammar.ts`, 186 KB) was boot-chunk code on every
   route. Rendering is not the gate — importing is.

**Lazy DATA, not lazy readers.** `corpus.ts`'s two dozen synchronous readers are
called from render and must stay synchronous; what became asynchronous is when
the registries are FILLED. The primers (`ensureCoreIndex`, `ensureBibleIndex`, …
in `corpus-index.ts`) mutate the same exported objects in place, and
`+layout.ts` awaits the ones `index-priming.ts` maps to the path — `load()` is
where a route already waits. Adding a reading route means adding it to
`BY_SEGMENT` there; an unknown path primes everything, which costs a fetch and
is the only direction that mapping may be wrong in.

**A shelf needs the indexes its text is read FROM and the indexes its text
POINTS AT.** `refs.ts`'s `refAddress` validates an address from render before it
mints a link, against the Bible's books, the Summa's questions and the
documents' section numbers — so every shelf that renders a citation owes those
three (`REFS` in `index-priming.ts`) whatever its own text costs.
`/doctrina-socialis` was listed as needing nothing, its paragraphs coming from
an inlined registry, and its first footnote threw `listBooks: … read before it
was primed` (site/docs/shell.md).

**Making a registry lazy also breaks what was DERIVED from it at module scope.**
`corpus.ts` memoises five maps at module load (the canonical book list, the
document groups, three existence Sets); module load is long before any primer
resolves, so they were built empty and stayed empty — the home page's Bible and
Magisterium sections, as it then was, rendered blank. They go through `derived()` now, which
recomputes when `indexGeneration()` moves. **Two of them named no registry** —
they reach `manifests` through `listWorksOfType` — so grepping for the registry
found nothing. `corpus-derivations.test.ts` scans the source for the pattern,
because under fixtures the registries ARE populated at module load and every
runnable test passes either way.

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
boot chunk every route `modulepreload`s, `sw-policy.ts`'s `contentPath` cannot
make a pathname of it so the file belongs to no download wave, and `fetch()`
still works, so nothing errors. `vite.config.ts` disables inlining for
anything under `corpus-data/` and says why. **If a new content kind is small,
check `build/_app/immutable/assets/` actually contains it** rather than
trusting the file count (43 documents' `appendix.json` were inlined, unnoticed,
for as long as that tier existed).

**And that config does NOT reach the service worker** (2026-09-03). SvelteKit
compiles `service-worker.ts` in a Vite build of its own with
`configFile: false`, forwarding `modulePreload`, `rollupOptions`, `outDir`,
`emptyOutDir` and `minify` and nothing else — so the guard held for the app
bundle while **1,656 content files under 4 KB were base64'd into the one
bundle whose entire job is to fetch them**. Every layer then failed quietly:
`contentPath` made a "pathname" out of the base64 payload, `cacheAssets`
fetched that and swallowed the 404, the real asset fell out of `contentUrls`
into the versioned SHELL precache (downloaded at install, lost on the next
deploy), and the library panel — which prices from the app bundle, where the
same glob yields real URLs — showed `27.1 / 27.2 MB` and a Download button
that could never finish it. **`content-urls.ts` and `plate-urls.ts` say
`no-inline` on the import itself**, which no config forwarding can drop, and
`scripts/audit-inlined-corpus.mjs` (in `postbuild`) fails the build on any
`data:application/json` or `data:image/avif` in built JS. Removing it also cut
the worker bundle from 6.16 MB to 3.63 MB. The general lesson: **a rule in
`vite.config.ts` is a rule about the builds that read it**, and this repo has
three.

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
`/documenta/{slug}`, `/doctrina-socialis/{n}`,
`/doctrina-socialis/caput/{n}`, `/doctores/summa/{part}/{question}`,
`/preces/{slug}`, `/colophon`.

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
`route-manifest.ts` is the edge half. The `CHROME_PATHS` are unchanged by it
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

**The script table is grouped, and the groups are the answer to "what do I
run"** (regrouped 2026-09-03). `package.json` has no comments, so the order is
the documentation: run, verify, derive, ship, and last the four npm invokes
itself. `src/lib/package-scripts.test.ts` is the compiler this table does not
otherwise have — see below.

| run              |                                                      |
| ---------------- | ---------------------------------------------------- |
| `dev`            | the only place a missing index primer THROWS         |
| `dev:clean`      | the same, after dropping Vite's dep cache            |
| `build`          | `prebuild` derives the corpus, `postbuild` audits it |
| `preview`        | static files only — **cannot see the worker**        |
| `preview:edge`   | `wrangler dev`: the real worker over `build/`        |
| `preview:deploy` | build -> preflight -> `preview:edge`                 |

| verify            |                                                            |
| ----------------- | ---------------------------------------------------------- |
| `verify`          | `format:check` -> `check` -> `test`, cheapest first        |
| `test`            | always fixtures, never a synced corpus                     |
| `check`           | `svelte-check`; **0 errors, and that is new** (2026-09-03) |
| `format:check`    | what the pre-commit hook does, over the whole tree         |
| `verify:calendar` | the oracle — **needs the corpus, and is NOT in `verify`**  |

| derive                |                                                      |
| --------------------- | ---------------------------------------------------- |
| `sync-corpus`         | full derivation, ~13.3s                              |
| `sync-corpus:changed` | skip if nothing moved, ~0.3s (what `predev` runs)    |
| `export`              | the three TS-table-to-JSON exporters, as one command |
| `coverage:accept`     | record an intended reference-coverage drop           |
| `lastmod:accept`      | record an intended lastmod change                    |

```sh
cd site
CORPUS_DIR=/path/to/glossa-corpus npm run dev        # corpus kept elsewhere
node scripts/sync-corpus.mjs --changed-only --force  # ignore the cache
npm run check -- --watch                             # what check:watch is
```

**`npm run check` reported 23 errors for as long as anyone had run it, and
that is why it gated nothing** (fixed 2026-09-03). All 23 were in three files —
`scripts/minify-build.mjs` (20), `scripts/export-section-names.mjs` (2) and one
stale `@ts-expect-error` — against sixteen other `.mjs` files that are JSDoc-
typed and clean, so the convention was never in doubt; two files had simply
drifted out of it and the noise made a real type error in real source
indistinguishable. **The fix was to type the two, never to loosen
`checkJs`/`strict`.** `html-minifier-terser` ships no types and now has a
four-option declaration in `src/html-minifier-terser.d.ts`, which says why it
is not `@types/…` and why it cannot live in `scripts/`.

**`npm run export` exists because three separate tests each named a different
command as their fix.** `book-forms.test.ts`, `versification-export.test.ts`
and `section-names.test.ts` fail when their committed JSON falls behind a
TypeScript table, and each used to say `node scripts/export-<one>.mjs`. Change
`refs-grammar.ts` and you do not know which is stale; all three now say
`npm run export`, and it runs all three. They are byte-identical re-writes when
nothing moved, so running the set is free.

**`npm run verify` is the only place the three checks are named together**, and
there is no CI to name them anywhere else — a deploy ships one person's working
tree (§Deploying). Order is cheapest-first so the fastest failure arrives
first, not most-important-first.

**FIVE SCRIPT NAMES BEGIN WITH `pre` FOR REASONS THAT HAVE NOTHING TO DO WITH
HOOKS** — `preview`, `preview:edge`, `preview:deploy`, `preflight` and npm's
own `prepare` — and npm runs `pre<name>`/`post<name>` around `npm run <name>`
whether or not anyone meant it. Adding a script called `view`, `flight` or
`view:deploy` would silently make an existing one its hook. The reverse is
worse and has no symptom at all: rename `build` and `prebuild`/`postbuild`
simply stop running, so the corpus is not re-derived and the built HTML is not
minified, and the build still exits 0.

**`src/lib/package-scripts.test.ts` is the compiler package.json does not
have.** Nothing else in this repo reads it — `svelte-check` does not, `vitest`
does not — so every composite is a string naming another string with no
checking behind it. It asserts six things: no composite calls a missing script,
no script names a missing `.mjs`, the three intended hooks still have their
targets, no accidental hook exists, `deploy` and `preview:deploy` share their
`build && preflight` gate, and `verify` still runs all three checks. Each was
mutation-tested when written — break the invariant and the test fails — because
a guard that cannot fail is worse than none.

**`npm run preview` CANNOT SEE THE EDGE, and it answers wrong rather than
refusing** (measured 2026-09-03). `vite preview` is a static file server with
SvelteKit's SPA fallback in front of it; `src/worker.ts` never runs, so every
behaviour the worker owns is silently absent — and absent as a _plausible_
200, which is the part that makes it a trap:

| request                | `npm run preview`  | `npm run preview:edge`        |
| ---------------------- | ------------------ | ----------------------------- |
| `/catechismus/999999`  | **200**, the shell | 404                           |
| `/scriptura/josh/1`    | **200**, the shell | 301 -> `/scriptura/iosue/1`   |
| `<title>` on a chapter | `Glossa Catholica` | `Joshua 1 — Glossa Catholica` |
| `_headers`             | not read           | `Parsed 3 valid header rules` |

So the whole head-rewriting half of this file (§The edge writes the head), the
route manifest's 404s, the OSIS 301s and the cache policy are unverifiable
under `preview`. `npm run preview:edge` is `wrangler dev`: the real worker over
`build/`, with local D1 for the beacon and `_headers` applied. It serves the
same built assets over `127.0.0.1`, which is a secure context, so the REAL
service worker still installs — everything `preview` was reached for, plus the
edge. **Prefer it; `preview` has no remaining advantage but startup time.**

**`npm run preview:deploy` is `npm run deploy` with the deploy removed** —
build, preflight, then `wrangler dev`. Reach for it rather than the two
separately: neither server rebuilds, so `preview` over a `build/` from an hour
ago is the ordinary way to spend an afternoon debugging a fixed bug, and
preflight is what turns a fixture build or a boot-payload regression (§The boot
payload has a ceiling) into a refusal instead of a puzzle.

**`npm run dev` is still the only place a missing primer THROWS.**
`requireIndex` throws under `import.meta.env.DEV` and warns everywhere else,
and `npm test` cannot reach it at all (§The boot payload has a ceiling). A
build-and-serve loop is therefore not a substitute for dev; it is the other
half. When dev misbehaves, the two documented causes each have a fix —
`npm run dev:clean` (`rm -rf node_modules/.vite`, then dev) for the dep-cache
tear below, and a hard reload for the browser cache the dev service worker
now uninstalls.

**DO NOT RUN `npm run build` WHILE `npm run dev` IS RUNNING** (2026-09-03, §Process).
`prebuild` runs `sync-corpus` in full, which DELETES every entry under
`src/lib/corpus-data/` before writing ~8,000 files back over ~13s. That is
inside the tree Vite watches, so a dev server reloads the page into a corpus
that is half gone: every eager index glob comes back empty, `listBibleWorks()`
returns `[]`, and a valid chapter gets `error(404)` — **"Nothing at this
address" at every address, until the server is restarted.**

- **`vite.config.ts`'s `server.watch.ignored` now covers `corpus-data/`**, so
  the wipe no longer tears the page. It costs nothing: dev never re-derived the
  corpus anyway (below), and the globs resolve at transform time regardless.
- **The six derived files under `static/` are wiped in the same breath and are
  still watched**, so a reload can still land mid-sync. What makes that
  survivable is that the failure is now retryable rather than terminal.
- **`npm run dev:clean` is not a remedy for this and never was.** It clears
  `node_modules/.vite` — Vite's DEPENDENCY pre-bundling cache, whose one symptom
  is `Pre-transform error: … deps/<name>-<hash>.js`. Three caches get confused
  for each other here; the corpus wipe touches none of them.

**A REJECTED PROMISE MUST NEVER BE MEMOISED, and this project has learned it
twice.** `corpus.ts`'s `readContent` wrote the rule for the content tier; the
index tier shipped without it on 2026-09-03 and cost more, because a content
read that never retries costs one text while an index that never retries costs
every address in that work type. `retryable-once.ts` is the rule as a tested
primitive — use it for any new module-scope `Promise` memo rather than writing
`??=` and hoping.

**A LOAD THAT THREW IS NOT A MISSING ADDRESS.** `+error.svelte` has three
states, not two, and picks between them with `error-view.ts` (a policy module
for `sw-policy.ts`'s reason: nothing renders a component under `vitest`). 404 ->
`NotFound`; a throw with offline mode on -> `NotDownloaded`, which carries the
switch; a throw while ONLINE -> `LoadFailed`, which carries the retry. Until
2026-09-03 the third fell through to the first, so a dropped fetch told the
reader their address did not exist and then sent them away from a page one retry
from working. `loadFailed.*` is English-only on purpose — `t()` falls back key
by key, so every other interface language gets English rather than the old wrong
answer in its own.

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
reload it replaced was at least honest (the workable shape is in
`docs/decisions.md`). Re-measure with the websocket, never by eye (`vite-hmr`
subprotocol; `full-reload` vs `update` is the whole measurement). And 73.8% of
what the dev server sends is inline sourcemaps — three documented attempts to
turn that off failed and are listed in `docs/decisions.md`; read it as bytes,
not seconds.

**`optimizeDeps.include` PINS EVERY DEPENDENCY REACHED ONLY BY A DYNAMIC
IMPORT, and `fuzzysort` is the one that taught us** (2026-09-02, §Process).
`JumpBox.svelte` loads it with `await import('fuzzysort')` — deliberately, it
is 7.5 KB the layout should not pay for — and Vite's dep scanner does not
find it, so it is discovered while the page is already loading. Vite then
rewrites `node_modules/.vite/deps/` under fresh hashes and forces a reload,
and every request still in flight against the old names 404s as `Pre-transform
error: The file does not exist at .../node_modules/.vite/deps/<name>-<hash>.js`.
With this graph — 411 modules, 18.78 MB, most of it sourcemap — a reload is
long enough for that to tear the page rather than just delay it.

**That error string has been misread once already.** It was read as a service
worker serving a stale shell, and `vite dev` was stopped from registering one
(2026-09-01, reverted 2026-09-02): the worker is a real hazard — the `fetch`
handler's `navigate` case is cache-first on the shell — but it was not this,
and `register: false` cannot evict a worker already installed anyway. **The
cache being swapped is the SERVER'S, not the browser's.** Tell them apart by
where the answer comes from: `/usr/bin/rm -rf node_modules/.vite`, load one
page, and read the dev log — `dependency optimized: <name>` followed by
`optimized dependencies changed. reloading` is this, and nothing in the
browser is involved. Add the dep to `include` and neither line appears.

**THE OTHER CACHE WAS A REAL HAZARD TOO, AND `vite dev` NOW UNINSTALLS IT**
(2026-09-02, §Process). `vite.config.ts`'s `glossa:dev-service-worker` plugin
resolves `src/service-worker.ts` to `src/service-worker.dev.ts` under `serve`:
a worker that caches nothing, intercepts nothing, and on `activate` drops every
`glossa-*` cache and unregisters itself. Both premises the real worker's
caching rests on are FALSE against the dev server, and each has a symptom that
does not look like a cache —

- **Content URLs are not content-hashed in dev** (`/src/lib/corpus-data/…`,
  from `content-urls.dev.ts`) and `CONTENT_CACHE` is unversioned, so
  `cacheFirstAndStore` pins the first read of a corpus file to that path
  **permanently**. Re-run `sync-corpus` and the browser serves the old text,
  and restarting the dev server does not help — nothing sweeps that cache but
  `CLEAR_CONTENT` or clearing site data by hand.
- **`version` changes per dev-server PROCESS, not per deploy** (`buildId()`
  carries the minute), and the shell precache includes `/` — the document every
  route is served from. So `src/app.html` edits appear to do nothing until the
  server is restarted, which is what makes "restart it and it's fine" read as a
  Vite problem.

There is a third cost that is not staleness at all: in dev the real worker's
module graph is **nine modules and 9.03 MB**, 8.82 MB of it
`content-manifest.json` and its inline sourcemap. A service worker is stopped
when idle and started again on the next event, and a controlled page's requests
wait behind that start — paid again on every full reload, which is what an edit
to any `.ts` module costs. The dev twin's graph is two modules and 11.9 KB.

**Substituting the module is what `register: false` could not do.** That was
tried first and reverted (above): it cannot evict a worker a browser already
installed, so it only ever helped a profile that never had the problem. This
keeps SvelteKit's registration exactly as a build has it — same shim, same
`sw.svelte.ts` — and changes only what gets registered, so the eviction reaches
the profiles that need it. **`npm run preview` is where the real worker is
exercised**, and always was: it serves a build, so both premises hold.

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
- **A failed sync now leaves nothing that looks synced** (2026-09-03,
  §Process). `sync-corpus.mjs` clears `corpus-routes.json`,
  `route-titles.json`, `apparatus.json`, `works.json`, `sitemap.xml` and
  `reference-coverage.json` in the same breath as it wipes `corpus-data/`, and
  writes them back on the way through — so they exist only where a run
  completed over what is on disk. Before that, a gate tripping between the two
  (the content-size ceiling, over 224 plate images) left `content/` with no
  `index/` — everything back on fixtures — under the previous run's route
  manifest, and preflight approved the build: the manifest is what it reads to
  tell a corpus from fixtures. **A new derived file belongs in `derivedFiles`**,
  or it is the next one to survive a failure. `lastmod.json` is the deliberate
  exception and says why.
- **Preflight (`scripts/preflight-deploy.mjs`) checks the corpus, not the
  page count**: it refuses a build reporting fewer than 100 works or 100
  content assets (the fixture-backed build), and refuses a build whose
  reference coverage dropped more than 3% in any family against
  `scripts/reference-coverage.baseline.json` — every grammar regression so
  far was silent. If the drop is intended, `npm run coverage:accept` records
  the new floor. `REFERENCE_COVERAGE=verbose npm run sync-corpus` prints what
  the grammar recognized nothing in, which is where coverage work starts.
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

## The bar is five doors, and adding a work does not add one

Rationale in `site/docs/finding.md`; what must be true before you touch it:

- **`NAV_ITEMS` names doors, not works** — Bible, Prayers, Library, Calendar,
  Learn. A newly ingested work goes on a shelf in `/bibliotheca` and, where it
  belongs there, on a route in `/schola`; it does **not** get a bar entry. The
  bar was one item per work until 2026-09-04 and had reached seven.
- **`Learn` names `/schola`, a portal, and not the Catechism.** It pointed at
  `/catechismus` for one day: a table of divisions is unusable by the reader
  the word was chosen for, who cannot yet name a part (`audiences.md` §5). The
  Catechism is the one work with no bar door, which is why `isActive` lights
  nothing on `/catechismus` — correctly.
- **`/schola` reports orders and never invents one.** Each route cites the
  document in this corpus that states it (`learning-routes.ts`); the one
  paragraph in the site's own voice carries `schola.start.attribution` on the
  page, because `docs/writing-descriptions.md` forbids recommending and this
  recommends. A second such paragraph needs the same mark or must not exist.
- **The home page's doors mirror the bar's order**, Learn last in both. Two
  lists of the same five things that disagree is worse than one.
- **`/bibliotheca` must stay a superset.** It lists every work including the
  ones with their own door. A Library that held only what the bar left out is
  a leftovers bin, and the label stops meaning anything.
- **No page in this group writes a name or a sentence of its own.** Library's
  shelves and the home page's doors reuse the key each destination is already
  titled and described by, the same rule `route-titles.mjs` follows for the
  `<head>`. Adding a shelf should add no dictionary key; if it does, check
  whether the destination page really has no tagline.
- **The home page is the liturgical day plus the doors.** Do not put an index
  on it. It carried the Bible's whole table of contents and the Catechism's
  whole outline until 2026-09-04, which is why nothing ingested after them was
  ever added to it — a WEIGHT problem that reads as a nesting problem.
- **Sections a reader can type are `suggest.ts`'s `SECTIONS`, not the bar.**
  Every work with an index belongs there whether or not it has a door, and
  `scripts/export-section-names.mjs` must be re-run and its output committed
  after any `nav.*` or `*.abbrev` change (`section-names.test.ts` fails
  otherwise).
- **One row per work TYPE in "continue reading", and the types are
  discovered.** `continueRows` reads the reader's own positions; it replaced a
  literal list written when four types existed, under which a reader halfway
  through the Code got no row.

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

**Some pages take a language prefix and the rest do not, and the line is not
cosmetic.** `CHROME_PATHS` in `route-manifest.ts` lists them — the pages whose
every word IS the interface, so the Portuguese one is a different page. Read the
list from the file, never from a copy here; it has moved twice. A reading
address names a citation, the same in every language, and takes no published
prefix: prefixing them would declare `hreflang` alternates serving
byte-identical text through `CONTENT_LANG_FALLBACK` (`site/docs/languages.md`;
the entry-point redirect above is the unpublished exception).

**`STATIC_PATHS` IS A SECOND TABLE AND A PAGE NEEDS BOTH, which is how two of
them 404'd for weeks.** `isCanonicalPath` decides whether a URL exists at all
and reads both tables; the sitemap and the head read only `CHROME_PATHS`. A new
static route that reaches neither answers **404 with the app's own not-found UI
on every cold load** while client-side navigation into it works perfectly — the
SPA router never asks the worker, so every way a person checks by hand shows the
page working. `/calendarium` and `/ius-canonicum` both shipped that way.
`route-manifest.test.ts` walks `src/routes/` and fails on any static route
directory neither table admits, so **adding a route is now the assertion rather
than remembering to add it to a list.**

**A page joins `CHROME_PATHS` only when its own title and description strings
exist in EVERY interface language**, which is a translation gate and not a
routing one — see `site/docs/addresses.md` §Two tables. `/calendarium`,
`/catechismus/compendium` and `/schola` are all in `STATIC_PATHS` and not on
that list today, so each answers 200 and is indexable at its bare address and
none is published. **They are waiting, not excluded** — each joins on the day
its strings are translated, one line plus a `CHROME_KEYS` entry, and `PLAN.md`
§Three pages are unpublished holds the table of what each is waiting on.

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
`route-titles.json` rode along in every reader's install for a day while the
docs asserted otherwise. `sw-policy.test.ts` names all five files.

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

## The Compendium of the Social Doctrine: the Catechism's addresses over a document's files

`type: 'social-doctrine'` (2026-09-02, §The Compendium of the Social Doctrine).
That sentence is the whole specification: `sync-corpus.mjs`'s branch writes what
the DOCUMENT branch writes (chunked `sections/` and `structure.json`, at paths
the document readers already resolve) and registers
what the CATECHISM branch registers (a number set, chapter anchors, an existence
check). No second content tier, no second chunk stride, no second reader.

- **A new work type must be added to `CONTENT_TYPES` in `sync-corpus.mjs`, or
  the sync excludes it and only warns.** That guard is right and it caught this
  during a rebase: without the entry, all ten editions were skipped and the
  build still exited 0.
- **`content/{workId}/structure.json` is `{ header?, nodes }`, not a bare
  array** — `getDocumentStructure` reads a document's and this one's through one
  parser and returns `.nodes`. A bare array does not degrade; the first
  `.filter` on `undefined` throws, on every page of the work.
- **`socialDoctrineOutline` drops the unanchored rows and a document's outline
  does not.** `buildDocumentOutline` gives a heading with no `before` a sentinel
  past the last paragraph (`documentTailNumber`) so a whole-work page can scroll
  to it; routed rather than anchored, that sentinel is a link to a 404. Nothing
  shows that matter now — see the appendix bullet below.
- **Every outline of this work leads into the CHAPTER, and one row is one
  link** (`socialDoctrineNav.ts`, 2026-09-02). The index, both sidebars and both
  breadcrumbs went four different ways before that module: a reader following a
  table of contents is going somewhere to read, and `/doctrina-socialis/{n}` is
  one paragraph out of a chapter of sixty. The index briefly gave each row TWO
  destinations — the title to the chapter, the range to the paragraph it opens
  at — which is two tab stops and a distinction no reader asked for. The range
  states the extent and goes where the row goes: `StructureIndex`'s `rowHref`
  stretches the title's anchor over the whole row, and `RowLink.href` is omitted
  so the chip renders as a `<span>`. The Catechism's index keeps two chips
  because it genuinely has two works.
- **`socialDoctrineHeadingHref` omits `#s{n}` at a division's own start.** The
  chapter page puts `id="s{n}"` on its INNER headings; the one that opens the
  division is the page's `<h1>` and carries no such id, so the fragment would
  name nothing and the browser would leave the reader at the previous page's
  scroll offset.
- **`marker()`'s short form (`Ch. 5`) is wrong for this work, and the sidebar
  passes `deriveMarkers={false}`.** That form numbers a labelled heading by its
  position among its TREE siblings; the Compendium runs its twelve chapters
  straight through three parts, so Chapter Five — the first child of Part Two —
  read `Ch. 1`, and its six siblings were numbered 2 to 7 in a table of contents.
  Position is right wherever a part restarts its chapter numbering (Gaudium et
  Spes does) and wrong wherever it does not, and nothing in the tree says which:
  the caller that knows says so, and the label prints as the source prints it.
- **The widest division opening at a chapter anchor is NOT the chapter.** The
  source prints `PART ONE` on a page of its own with no name beside it, opening
  at the same paragraph as Chapter One and running three times as far — so
  `shell-head.ts` carries `socialDoctrineChapterNames`, read off the nodes that
  produced the anchors, and the chapter page does not use `widestAt`.
  `socialDoctrineDivisions` is the same rule for the pages.
- **A heading's `level` is per-edition paint, so the outline is re-levelled onto
  the division anchors before the tree is built** (`levelSocialDoctrineRows`,
  2026-09-03). The twelve chapters sit at level 2 in English and level 1 in
  Portuguese, and `hu`/`sw`/`vi` paint no level that isolates them at all — so
  `buildDocumentOutline`, which nests by level, gave `csdc.pt` 75 roots and
  `csdc.hu` 97, and five of the ten more than 35. A root is always rendered, so
  the sidebar listed every chapter and every section inside it, permanently open,
  where only the
  reader's own branch is meant to expand. `socialDoctrineChapterStarts` is the
  one thing all ten editions agree on: rows above a division's heading are the
  part, the labelled row at the anchor is the division, and everything else
  keeps the edition's own relative depth below it. Every edition renders 3–13
  roots now. §The Compendium of the Social Doctrine.
- **Two calls to `socialDoctrineOutline` share no node, so nothing may compare
  them by identity.** `buildDocumentOutline` maps the stored `DocumentNode[]`
  into fresh `StructureNode`s every call, and both pages looked a division's
  depth up by scanning their own outline for `division.node` — a `===` that
  could never match. Neither failed: both took the `?? 0` fallback, so the
  landing page listed every chapter with one child repeating its own title and
  the chapter page printed its `<h1>` again as the first `<h2>` of its body.
  `socialDoctrineDivisions` returns the depth now.
- **The front matter has no page and `appendix.json` is not shipped.**
  `/doctrina-socialis/appendix` existed for a few hours on 2026-09-02 — the
  letter of transmittal and the presentation, the one address in this work with
  no number in it. It went because two prefatory documents are not what a reader
  arrives at this work for. The corpus still holds them; the sync's branch says
  why it leaves them there, and shipping the asset anyway would be a fetchable
  file no route reads.
- **The parts' epigraphs are on the section each part OPENS at, not on a
  structure node** (`DocumentSection.epigraph`, docs/corpus-schema.md). Half the
  editions have no part row to hang one on, so the chapter page tests its own
  first paragraph for the field — true on exactly the three pages that open a
  part, and it renders above the `<h1>`, which is where the book prints it.
- **A new work must be added to `EditionMenu`'s `context()` or it has no
  edition picker, silently.** The Compendium of the Social Doctrine was a
  `WorkTypeKey`, `listEditions` answered for it, the store and the fallback
  chain were complete — and its ten editions were unreachable from every page
  that read them for as long as that map had no branch, because the bar renders
  the trigger for no work at all rather than failing.
- **The chapter anchors are unioned across the editions that print a label**,
  and the seven that do agree exactly. §1 is added for the Introduction, which
  carries none; the CONCLUSION carries none either and reads as the tail of the
  last chapter's span — its paragraphs are addressable, its chapter page is
  titled Chapter Twelve's. A known cost, not an oversight.
- **The back matter is labelled in the SOURCE's own words wherever it can be.**
  Each sigla table's disclosure takes the heading the edition prints over it
  (`CccAbbreviation.section`), so six editions cost no new strings; only the
  appendix as a whole needed one, because no heading in any edition names it.

## Offline mode: three gates, and the one the worker has to remember

Added 2026-09-02 (§The site). Off by default, and **not in `SettingsMenu` at
all**: the `Advanced…` row at the foot of that panel — which is what
`AppearanceMenu` was called until it stopped holding only appearance — opens
`AdvancedSheet.svelte`, and the switch lives there beside the library.
`src/lib/offline.svelte.ts` is the feature's docblock.

- **Keeping it out of the front row is a measurement, not modesty.** The
  automatic waves put the shell, the prayers, the Compendium and ONE Catechism
  edition on the device and nothing else; Scripture, magisterium and Summa
  (23-28 MB each) arrive only if the reader asks. So the switch is worth
  little until a library is filled, and the two are one subject read in one
  order — not a row in the panel every reader opens to change the text size.
- **It was a fold in that popover until 2026-09-02, and the width is why it
  stopped being one.** The panel is ~11rem, so a switch whose price is a whole
  sentence could only carry it as a `title` nobody hovers on a phone; the
  library, being byte counts and a progress bar, had to be a second dialog
  regardless. One dialog holding both is one place to look with room to say
  what the switch costs.
- **The library block comes FIRST inside it.** Offline mode turns downloads
  off, so a reader meeting the switch before the shelf meets them in the wrong
  order.

## The Advanced panel: waves priced before the reader commits

Added 2026-09-02 with offline mode's second half (§The site). It is the
consumer `planWaves`' byte counts were written for and had never had.

- **The rows are WAVES, not works.** A wave is every edition of a kind in the
  reader's chain, so "Bible" can be two editions and 24 MB. `requestWork` and
  `assetsForWork` exist for the finer grain and are still unused; that is a
  second level in this list, not new machinery.
- **Doré's engravings are a wave (`illustrations`) as of 2026-09-02, and never
  an automatic one.** 482 AVIFs, 103 MB — four times the text corpus. They had
  been in no wave at all, reachable only by being looked at; `sync-corpus.mjs`
  now pushes each image into `content-manifest.json` (`kind: 'plate-image'`,
  `relPath` under `plates/`) so the panel can price them, and
  `corpus-assets.ts` resolves those rows through `plateUrl` rather than the
  content glob — widening that glob would put 482 hashed URLs in the boot
  chunk. `usage.ts` excludes them from `measureLibrary`'s denominator, or the
  `full` bucket would be unreachable.
- **`CACHE_WAVE` accepts `wave: 'all'`** — every wave, on the explicit
  (ungated, whole-wave) side of the branch, reporting progress wave by wave.
  It is a `WaveRequest` and not a `WaveId` precisely so it cannot land in
  `WAVE_ORDER` and have `planWaves` try to fill it.
- **It plans the waves on the CLIENT, and that is not duplication.** The
  worker plans to fetch; this plans to PRICE, before the download exists for
  the worker to be asked about. `shelfPlan()` is exported from
  `sw.svelte.ts` precisely so both sides plan from the same input — if they
  ever diverge, the panel shows one number and the worker fetches another set
  of files, with no symptom.
- **A SHELF IS PLANNED WITH NO PAGE OPEN, and `readerPlan()` is the wrong
  function to reach for here** (2026-09-03). `planWaves` lifts the files
  either side of the reader's current page into `neighbours`, which the panel
  never shows — so a named download arrived with a hole in it, the panel
  priced the same hole out of the total so nothing said so, and the next
  navigation moved the hole: those files back in the shelf, still absent, a
  row reading `26.5 / 26.6 MB` that no amount of pressing Download would
  finish. `shelfPlan()` is `readerPlan()` with `current` dropped, and
  `service-worker.ts` drops it too for any `CACHE_WAVE` — belt and braces,
  since the message carries whatever the page sent. `neighbours` earns its
  carve-out in the AUTOMATIC pass and nowhere else.
- **The rows are read in `SHELF_ORDER`, which is NOT `WAVE_ORDER`.** The
  download order is a priority (descending value per byte, so `illustrations`
  is last and decides what an interrupted fill got to); the panel is a list of
  the library's parts, where Doré's plates are a thing about the Bible and sit
  under it. Only `libraryRows`' output moves — `planWaves` is untouched.
- **The card is `block-size: fit-content`, not `auto`.** With both block
  insets pinned by `.sheet`'s `inset: 0`, an auto height is solved to FILL the
  containing block and the auto margins get nothing to centre with — so the
  panel stood at its own cap over a page of empty space. A `fit-content`
  height is a definite size, so the box shrinks to its content and the margins
  centre it.
- **No rule between the shelves.** Six lines through six short rows is more
  structure than the list has; the three columns already say where a row
  begins. The rule above the totals stays — that line is a different thing.
- **The progress bar is absolutely positioned on the row's bottom rule.** In
  the flow it appeared and disappeared with the download, pushing every shelf
  below it down and pulling them back up under the reader's finger; reserving
  the height on all seven rows instead would buy back the panel's own
  scrollbar. The card's `max-block-size` is likewise set so the content fits
  UNDER it (44rem) — at 34rem the panel opened scrolled, with the offline
  switch it is named for below the fold.
- **Held bytes are read back from the cache, never accumulated from progress
  messages** (`usage.ts`'s `measureLibrary` gives the reason: progress only
  covers fills this page watched). The comparison is `ContentEntry.path`
  against a cache key's pathname — `heldPaths` exists because comparing an
  absolute href to a pathname matches nothing and reports an empty library
  without erring.
- **`serviceWorker.completed` is a COUNTER**, bumped per `CACHE_CONTENT:done`,
  because two fills in a session must be two signals; the sheet re-measures
  off it.
- **The panel is a `<dialog>`, deliberately not a route.** An address would
  cost the whole grammar in `route-manifest.ts` (`corpus-routes.json`,
  sitemap, `route-titles.json`, `assertNamed`, an `hreflang` cluster) for a
  control surface with nothing to index.
- **A shelf is dropped from the PAGE; the whole library is dropped by the
  WORKER, and that is not drift.** `library.remove(wave)` re-plans, deletes
  that wave's paths out of `glossa-content` and re-measures — awaited, so no
  round trip to wait out. `CLEAR_CONTENT` is `caches.delete(CONTENT_CACHE)`
  and takes what no current plan NAMES as well: files whose content hash has
  moved on, a language the reader has stopped reading. Summing the waves would
  be a "forget everything" that quietly left things behind.
- **Every delete is two-click, and one `armed` holds the target** (a `WaveId`
  or `'all'`), so arming a second disarms the first. Two controls each one
  click from firing is how the wrong one goes.
- **The library block is gated on `serviceWorker.controlled`; the switch is
  not.** A Download button with no worker to receive the message does nothing
  at all (`#post` returns on a null controller), while offline mode still
  stops the beacon and the update check by itself. `controlled` is false under
  `npm run dev`, which registers no worker.
- **The sizes shown are RAW bytes**, per `Wave.bytes`' own docblock —
  `content-length` is knowable only after fetching, which is too late to ask.
  It over-states the transfer by roughly three, which is the safe direction.

- **Three gates because there are three mechanisms**: `sw.svelte.ts` (update
  check, offer, apply, and every download message — the gate sits in `#send`,
  the chokepoint), `usage.ts` (`#send` withholds the beacon; the session goes
  on counting locally), and `service-worker.ts` (cache-only, the only half
  that holds for a request no application code issues). Gating two of the
  three leaves the third talking.
- **The worker's copy is PERSISTED, in a cache of its own** (`glossa-prefs`):
  it has no `localStorage`, it is restarted freely, and the navigation that
  boots the app is answered before any page script runs. The page re-posts
  `OFFLINE_MODE` on every start as a correction, never as the source — a
  posted-only flag passes every manual test and fails once per cold start.
  `#post` exists because that one message must go THROUGH the gate in `#send`
  rather than obey it.
- **A miss is refused, never fetched** — `cacheOnly` answers 504 even when the
  cache itself throws, since an unreadable cache is not permission to make the
  request. `NotDownloaded` is what the reader sees, told apart from a real 404
  by the STATUS (`error(404, …)` is deliberate; a content read that threw is a
  500).
- **`install` is deliberately NOT gated**, and it is the one download the mode
  cannot refuse. A worker activating with an empty shell cache cannot boot at
  all. The browser's own byte-check of the worker script is likewise outside
  our reach; both are named in `service-worker.ts`'s header rather than
  quietly ignored.
- **It made two latent bugs reachable**, both fixed with it: `corpus.ts`
  memoized rejected reads (one failure poisoned a file for the life of the
  page — fatal to a switch whose point is to be turned off and retried), and
  `LinkPreview` had no `catch`, leaving the card in `loading` for ever. A
  failure path only ever reached by accident becomes ordinary here; look for
  the next one the same way.

## The Code of Canon Law: the same arrangement, a different reading unit

`type: 'canon-law'` (2026-09-03, §The Code of Canon Law). Everything the
Compendium of the Social Doctrine's section above says applies unchanged —
`sync-corpus.mjs`'s branch writes what the DOCUMENT branch writes and
registers what the CATECHISM branch registers, no second content tier, no
second chunk stride. What is new is only what a reading page IS.

- **The reading unit is the TITLE, and both other candidates fail at an end.**
  A page per BOOK is what the Latin edition itself publishes and puts 543
  canons and 300 KB on one; a page per CHAPTER cuts the titles that have none
  into nothing, since 78 titles hold 130 chapters between them and the rest
  hold their canons directly. The title is 85 units, eleven canons in the
  median one, and it is where the source's own editions paginate.
  `canonLawUnitStarts` is books ∪ titles: a book anchors a unit only where its
  canons run ahead of its first title, which is how cann. 1-6 get a page.
- **The units are picked by `kind`, and that is why `cic.py` stores one.**
  `structure.json` carries the division word the edition printed — `title`,
  `caput`, `liber` — which a document's structure deliberately does not
  (§Documents: `kind` forced the scraper to judge what a heading MEANT). Here
  it is read, not judged. Picking by `level === 4` would work today and break
  the day an edition omits a level, which is the one case a reading surface
  must not silently repaginate on.
- **A unit's name is the NARROWEST division at its anchor, the exact inverse
  of `socialDoctrineDivisions`.** There the outermost is the chapter and
  anything wider is a part divider printed on a page of its own; here four
  divisions routinely open at one canon — 1311 opens Book VI, its Part I and
  its Title I — and the outermost would title that page after a book running
  eighty-nine canons past it. `CANON_LAW_UNIT_RANK` is the order.
- **`canonLawDivisions` zips the stored rows against the outline BY POSITION
  within one anchor**, because `StructureNode.kind` is the tree's own word
  (`'sub'`) and not the source's. That is safe where an identity test is not:
  `buildDocumentOutline` maps rows to fresh nodes one for one and in order.
- **`canonLawTitleText` strips the range the source prints inside a heading**
  — five of the seven editions print `(Cann. 7 - 22)` there and two print
  none, so leaving it in gives the same page two shapes depending on the
  reader's edition, and gives five of them the range twice. Stripped for
  DISPLAY only; the corpus keeps what the edition printed, and
  `route-titles.mjs` carries the same rule by hand because it runs under
  plain node.
- **AND THE STRIP RUNS BEFORE THE CASING, which is the whole of what
  `canonLawHeadingParts` exists to fix.** `normalizeCase` (titles.ts) rewrites
  a heading only when it is ALL-CAPS, and the `ann` of `(Cann. 35 - 93)` is
  not — so with the strip applied afterwards, every heading carrying a range
  failed the test and came through shouting while its neighbours were cased.
  One breadcrumb showed `General Norms` and `SINGULAR ADMINISTRATIVE ACTS`
  side by side. The four display surfaces take the pair from that one function
  now, and `route-titles.mjs` takes a `clean` argument rather than a pass
  afterwards, because a `<title>` written the other way round is a visible
  rearrangement at hydration.
- **The chrome abbreviates a division's label; the running text prints it
  whole.** `canonLawLabelText` shortens the NOUN and keeps the source's own
  numeral — `CHAPTER I` → `CH. I` — which is what `marker()`'s short form
  cannot do here: that form renumbers from tree position, and the Code
  restarts `TITLE I` inside every book and part, so four different places
  would read `Title 1`. It is keyed by the printed noun rather than by kind,
  because the outline carries none (`buildDocumentOutline` stamps every node
  `sub`), which also makes French degrade correctly — `PREMIÈRE PARTIE` puts
  its ordinal first, matches nothing, and prints verbatim.
- **IT HOLDS NO WORDS AT ALL — `'title'` IS A KIND NOW, AND THE SHARED TABLES
  ANSWER.** `canonLawLabelText` maps a printed noun to a `StructureNode['kind']`
  and asks `kindLabelWord` for the word, so it cannot disagree with the rest of
  the site: a reader meeting `Ch. 3` on one page and `Chap. III` on the next is
  unrepresentable rather than merely tested against. Getting there took three
  small extensions, each measured:
  - **`CccNodeKind` gained `'title'`** (types.ts). Nothing reads it off a file:
    `cic.py` writes the word into its own flat `structure.json` rows, but a
    document-shaped outline stamps every derived node `sub`, so no
    `StructureNode` ever carries it. That is not a contradiction — the member
    exists so the two shared tables can key a column on it. It is a name in a
    vocabulary, not a claim about a tree. Widening the
    union is safe because every consumer is a `Partial<Record<…>>` or a `Set`;
    the one place it did bite is `StructureIndex`'s `IndexRank`, whose default
    `rank` now maps `title` beside `in-brief` as a fallback that cannot fire.
  - **`KIND_LABELS` gained a `title` column for seven languages, and `ru` gained
    `article`.** The title word is SPELLED OUT in all seven (`Title`,
    `Titulus`, `Título`…): it shipped as `Tit.` for a day on the density
    argument that earns `Ch.` and `Art.` their full stops, and that argument
    does not reach a word an abbreviation shortens by one letter. An
    abbreviation has to save something. A row is as complete as the works in
    that language require —
    naming a division in a language no work here divides that way is inventing
    vocabulary nobody can check — so the gaps say which works exist, not which
    words do.
  - **`LABEL_KIND_WORDS` gained the six Latin-script title nouns**, so
    `documentLabelKind` stops answering `null` for a division 77 rows deep.
    Inert for everything else, measured over all 1,668 `structure.json` files:
    those nouns match `cic.*` and nothing else.
- **The chapter and article nouns deliberately did NOT join the shared
  recogniser, and the measurement is why.** `CAPUT`, `CAPITOLO`, `CHAPITRE`,
  `KAPITEL`, `ARTICOLO`, `ARTIKEL`, `ART` match **148 works besides the Code** —
  every Latin, Italian, French and German conciliar document — and those take
  `marker()`'s DERIVED form, which numbers a row by its position among its tree
  siblings. `vatii.christus-dominus.la` prints `CAPUT II` and `CAPUT III` with
  no `CAPUT I` above them, so they would be renumbered `Cap. 1` and `Cap. 2`.
  They stay in `CANON_LAW_EXTRA_NOUNS`, beside the Cyrillic ones, which
  `documentLabelKind` cannot reach at all (its fold is `[A-Z]+` — a general
  limit of that function across all four kinds, not a gap in this one).
- **Book, part and section are outside what it relabels, on the shared table's
  own judgement** — `KIND_LABELS` holds a word for `title`, `chapter` and
  `article` and spells the other two out — and section doubly so, since the
  Code's German prints `SEKTION` where `KIND_LABELS.de.section` says
  `Abschnitt`: a different word, not a shorter one. `book` is absent from the
  kind union entirely and so degrades with no entry needed. For `title` the
  substitution is not a shortening at all but a NORMALISATION, and it earns its
  place there: the Spanish pages print `TITULO` and `CAPITULO` bare in places
  and `TÍTULO`/`CAPÍTULO` in others, and every crumb comes out of the table
  accented either way.
- **The breadcrumb is a flex row, and that block is global.** A crumb wraps as
  a UNIT — in inline flow the trail is one paragraph and the line breaks at
  whatever space it reaches, so `BOOK I` was stranded on a line above its own
  name with the previous crumb's `›` dangling over it. It matters most here
  (six levels where every other work has one or two) and is right everywhere,
  which is why it went into `reading-chrome.css` beside the rest of
  `.breadcrumb` rather than into this route.
- **`flex-wrap` alone did not deliver that, and the row looked WORSE than the
  inline flow it replaced.** A flex item shrinks before the row wraps, so a
  trail wider than the column was solved by squeezing every crumb and letting
  each break inside itself — the same stack of fragments, now sorted into a
  column of ordinals above a column of names, which is what the second
  screenshot showed. `.breadcrumb > *` takes `flex: 0 0 auto` to refuse the
  squeeze (the break goes between crumbs, where it belongs) plus
  `max-width: 100%` for the one case the arrangement allows an internal break:
  a single crumb wider than the whole column. **A wrapping rule is only as good
  as the shrink rule beside it.**
- **`superseded` renders on the canon page and not on the reading page.** It
  is apparatus about one canon — the wording a later act replaced — and the
  canon page is where a reader arrives holding that canon's number. Behind a
  closed disclosure summarised by the ACT's own line, because the text above
  it is the law and this is not.
- **The `CIC` siglum links now, and the grammar change is the payoff.**
  `LOCUS_RE` wanted a digit and the Catechism writes `CIC, can. 748, § 2`, so
  264 citations resolved to a tooltip beside a number left in plain text.
  `SiglumEntry.work` marks the siglum, `CANON_MARKER_RE` skips the word and
  the comma before it, and `refAddress` branches on `work` before the slug
  test that would otherwise reject it. Worth 658 more linkable citations in
  the Catechism alone, 185 in Vatican II, 215 in the encyclicals.
- **`classifyCitation` had to be told.** `reference-coverage.mjs` defined
  linkable as "a document segment with a slug", so every newly-linking canon
  counted as merely recognised and the measure understated its own gain. A
  metric that predates a kind of link does not report it.
- **Both offline waves and the bookmark shelf need a row.** `sw-policy.ts`'s
  `WAVE_BY_KIND` puts the two new asset kinds in `magisterium`; without it
  they land in `other`, which its own test catches. `bookmarkGroup` gives the
  Code order 5 and pushes prayers and documents down one — the sequence is a
  shelf order, not an append log.

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

**A clause is parsed to its end, not to its first match** (2026-09-03,
§Parsing). The siglum, title, Summa and work-title branches of `parseClause`
each dropped the clause tail to text, so `Const. dogm. Dei Filius, c. 4: DS
3016 [...] Const. dogm. Lumen Gentium, 25` in CCC 90's Portuguese footnote
linked only Dei Filius; they recurse now, as the scripture branch always did
(`vatii` 52.92% → 54.58% linkable, `nothing` unchanged). **And a document
link no longer requires an edition in the reader's own language**:
`refAddress` goes through `defaultDocumentWorkId`, the same `editionInLang`
chain `/documenta/{slug}` resolves at page load, because the URL names no
edition and the refusal only ever cost the citation (all 141 of `ccc.mg`'s
document citations linked nowhere). The section check stays strict against
whichever edition that picks.

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
it actually names. Modern is the default because that is what the corpus
prints nearly everywhere. **A work belongs in `WORK_CONFIGS` only when its
references are measurably read wrong without it**, evidence in the comment
beside it — the standard `pipeline/corrections/` holds a defect to. It is a
short list on purpose, not a second general axis.

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

## Two sigla link off the site, and the year is what makes it safe

`AAS` and `ASS` — the Holy See's gazette either side of 1909 — are the only
citations the grammar answers with an address outside the corpus (2026-09-02
and 2026-09-03, §Linking out): a `RefSegment`'s optional `external`, built by
`aasVolume`/`assVolume` in `refs-grammar.ts` and rendered inside
`SiglumGloss`'s card — never as a glyph on the siglum, which would mark
thousands of references in a column that is already apparatus.

- **The printed year is a CHECK, never an input.** Volume _n_ is 1908 + _n_,
  so the citation says it twice and both must agree. A long tail of sources
  write pre-1909 documents as `AAS 18 (1885)`, meaning volume 18 of the **Acta
  Sanctae Sedis** — deriving the year sends each to a real AAS volume forty
  years wrong, and nothing downstream can see it. Refusing the mismatch costs
  256 links and prevents 256 confident lies.
- **`slug` stays null and `refHref` still declines it.** An external address is
  a separate field for exactly that reason: nothing that resolves addresses
  HERE (`corpus-routes.json`, `sitemapPaths`, `assertNamed`, `suggest`) may
  ever see one. The proof is that the reference-coverage table did not move.
- **The volume list is read off the Vatican's own index**, not guessed: 1–94
  are single PDFs (9 and 75 in two parts, so both are skipped), 95 onward are
  monthly and a citation names no month. That ceiling is 23.8% of AAS
  references and is a fact about the publisher, not a gap to close.
- **ASS is a 41-row TABLE, and being closed is what licenses it.** The
  filenames do not derive (`ASS-32-1899-900`; volumes 10 and 16 carry a
  supplement's page range) and `year − volume == 1867` holds only from volume
  9 up — so a derivation is impossible, not merely inconvenient. What makes a
  table safe here is that the series ceased in 1908 and can never gain a row;
  ask for that before writing the next one, not "the rows are few".
  `audit.py`'s `SERIES_ASS_IRREGULAR_BELOW = 4` is set too low against the
  real index. 258 citations link across 27 volumes; what is refused is
  refused by the year check (`ASS 35 (1943)` is Mystici Corporis under the
  earlier siglum).
- **The volume's SPELLING does not matter, because the year check does.** It
  is read as a digit locus, as a Roman numeral `LOCUS_RE` cannot reach
  (`ASS XXVIII (1895-1896)` is volume 28), or as the head of a comma-chained
  locus that swallowed the year (`ASS 5, 1869, 305-331`); the year comes from
  `(1885)`, `(1890/91)`, `[1869]` or a bare `, 1908`. None needed a new
  tolerance — the same two tokens must agree, which is what refuses
  `ASS XII (1908)` (Haerent animo is volume XLI, and the year says so). All
  three shapes were refused for one pass on the grounds that they were "a
  different locus grammar", which was a fact about `LOCUS_RE` dressed as a
  fact about the citation: **where a shape is refused, the reason has to name
  what would go WRONG**, not what is currently written.
- **`ASS` was in no English or Portuguese sigla table until then**, so 146
  citations across those and the six tags falling back to English were
  unglossed text. Adding the rows moved `recognized` in `vatii` and
  `encyclical` and left `linkable` flat everywhere — the containment check.

## Haydock on the page: the commentary's site half

`commentary.haydock.en`'s units ADDRESS `bible.douay-rheims.en` rather than
containing text (2026-09-01, §Addresses and editions; the pipeline half —
parsing, markers, validation — is in `pipeline/CLAUDE.md`).

**Shape in the site:**

- **It contributes no route, no sitemap entry and no `route-titles.json`
  name** — none of the address-grammar machinery (`hrefFor`,
  `isCanonicalPath`, `WORK_OF`, `assertNamed`) had to learn about it. That is
  the cheap fork of the two `docs/research/haydock.md` left open.
- **`sync-corpus.mjs` SKIPS an unhandled `manifest.type` and says so**
  (`hasContentBranch`): it registered the manifest and emitted no content, no
  routes and no error until 2026-09-02, so the work existed in `listWorks()`,
  rendered nowhere and 404ed nowhere. Now it enters no synced output at all and
  the run warns per unknown type, naming the work ids — a warning and not an
  exit, because `build/` is shared and another branch's experiment must not
  block a deploy of the known corpus. The branch to copy is
  `if (manifest.type === 'commentary')`.
- **The content path shape is the Bible's on purpose**
  (`content/{workId}/books/{osis}/{start}-{end}.json`, packed by the same
  `BIBLE_CHAPTER_CHUNK_TARGET_BYTES`), so
  `bibleChapterLocations` reads both with one regex and `bibleChapterChunkFor`
  is keyed by work id with no claim about type. Do not add a second lookup.

**Preferences and defaults:**

- **The reader's preference selects the apparatus, and it is a SET.**
  `apparatus-prefs.svelte.ts` cannot reuse `content.svelte.ts` — a reader can
  have two apparatuses beside one verse. Edition notes default ON and a
  commentary defaults OFF, and what is stored is the DIFFERENCE from the
  default, not the state — storing the state makes "never touched the panel"
  and "switched everything off" the same value, and the next work ingested
  arrives silently off for the first of them.
- **BOTH DEFAULTS MOVE, AND A WORK IS WHAT MOVES THEM.** `subsumes_notes`
  flips the edition's; `default_on` flips the commentary's, and the prayers'
  apparatus is the only work in the corpus that sets it (2026-09-05) — tens of
  kilobytes, the only apparatus a prayer page has, two prayers of thirty-five,
  so opt-in meant a reader who never opened the panel never learned it existed.
  Every caller reads it through `commentaryDefaultsOn`, so the enabled test and
  the panel's switch cannot ask the question with two different defaults.
- **A COMMENTARY'S CHOICE IS STORED PER FAMILY, an edition's per edition.**
  `commentary.preces.*` is fifteen works and the reader meets one per page, so
  the id is stored without its language — "I do not want this commentary" is
  not a statement about English. An edition's notes must NOT be scoped that
  way: the Douay-Rheims and the CPDV are two apparatuses, and turning one off
  says nothing about the other.
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
- **Measured per edition**: douay-rheims 1,805 of 1,909 (95%), matos-soares
  1,377 of 1,743 (79%), martini **0 of 18,658** — Martini's notes are
  verse-level (every marker at position 0) and his lemma is a catchword with
  the elision printed in, a discontinuous quotation and so not a span of
  anything.
- **`.note-lemma` AND ITS HIGHLIGHT ARE IN `reading-chrome.css`, and were
  scoped to `AnnotatedText` until 2026-09-05.** `PrayerBlocks` then set the
  same spans for the prayers and every one came out unstyled — no error, no
  warning, just no highlight. It is the identical failure `.sidenote-lemma`
  moved global to prevent four days earlier, so the rule is worth stating
  plainly: **a class name borrowed across a component boundary in Svelte is
  silently unstyled.** Two components rendering one class means the rule is
  global, and the file to put it in is `reading-chrome.css`.
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

**A SECOND UNIT SPACE SINCE 2026-09-04, AND ALMOST NOTHING ABOVE CHANGED.**
`commentary.preces.{lang}` annotates `prayer.common.{lang}` and its units name
a `Prayer.slug`, not a verse — the Catechism on the Ave and the Compendium on
the Pater, over fifteen languages (`pipeline/CLAUDE.md` for what it reads and
why Haydock is not in it). It contributes no route and no name, it is still
fetched only when it is switched on, and the mark is the same dagger. What is
new is exactly four things:

- **`manifest.addresses` is the branch, and both scrapers write it.**
  `sync-corpus.mjs` reads it before it opens the work's directory, which is
  why it is a field rather than a lookup of the annotated work's own type.
  `commentaryPrayers` in `corpus-index.ts` is `commentaryChapters`'s twin —
  two registries and not one wider one, because nothing reads both.
- **The cursor walks the prayer, not the line, and so may a quotation**
  (`anchorCommentaryLines`). Resetting the cursor per line would give two notes
  the same repeated clause — `Mary` occurs in three lines of the English Ave.
  And a clause the edition set across a break is still one clause: confining a
  span to one line placed **77** of the tier's 120 headwords and left the Ave
  with a single mark in most languages; spanning it places every one. Each line
  lights the words it prints and only the last takes the dagger
  (`PlacedAnchor.showMark`), or one note raises three marks onto one card.
- **THERE IS NO TRAILING MARK, AND NOTHING HANGS AT THE FOOT** (2026-09-05).
  It was rendered after the whole run for a day, on the argument that a prayer
  has no end until its last line — true, and beside the point: two thirds of
  the source's runs gloss the prayer as a WHOLE, and 215 of those under a
  seven-line Ave is the Catechism reprinted beside the prayer rather than a
  gloss on it. The pipeline stores only notes that quote a clause (120 of the
  335 it reads), so every note anchors and the apparatus IS the marks in the
  text. `placePrayerCommentary` still returns what it could not place, named
  `unplaced` and rendered nowhere — the two folds could only ever disagree in
  silence, and a name is what lets a test say so.
- **What the dropped notes became is `PrayerCommentary.references`** — the
  Gospel the prayer is printed in, the Catechism's article on it, the
  Compendium's questions, as links under the text. Same file, same fetch, same
  switch, because they are the same act of reading two books beside a prayer.
  The ranges are the pipeline's and are checked there; `PrayerReferences`
  decides only how a range is written down, and takes each siglum from the
  source work's own `short_title` exactly as the locus does. It is `CitedBy`'s
  panel turned around — that one answers "who cites this address", this one
  "where is this prayer treated" — so it takes that panel's treatment: the rule
  above it, 0.85rem, the work named once and muted before its loci. Not its
  COLUMN, though: a concordance is dozens of rows to scan down, this is three
  groups, and one per line under a seven-line prayer reads as more apparatus
  than there is. A prayer
  is seven lines at 1.1x the reading base, and anything under it at body size
  argues with the prayer for the page. The links PREVIEW (no
  `data-link-preview` marker): that opt-out is for navigation chrome, and a
  paragraph the reader may want to see before deciding to leave the prayer is
  exactly what the card is for.
- **`CommentaryNote.locus` labels a note with the paragraph it IS, and links
  it.** One work draws on two books, so a manifest-level attribution would tell
  half its readers the wrong one; the siglum comes from that source work's own
  `short_title` in the corpus (`CCC` everywhere, `Compêndio`/`Lilla katekesen`
  per edition), never a literal.
- **The card does not print the headword, because the line is lighting it.**
  `CommentaryGloss` takes `lemmaMarked`, which is `Sidenote`'s rule one
  apparatus over: print the headword only where the words could not be marked.
  It is the CALLER's answer and defaults false, so Haydock is unchanged — a
  verse's card may hold several notes at one mark, where the headword divides
  one authority's remark from the next; a prayer's holds exactly one, always
  anchored.

**And the prayers' apparatus rides `essentials`, which is automatic** —
the one commentary in the corpus that may. `WAVE_FOR_KIND`'s own rule puts a
commentary on the wave of the work it annotates; the rule it looks like it
breaks is about SIZE, and this is tens of kilobytes beside a collection every
reader already takes. Left out, a reader who filled the library would get a 504
with the prayers sitting right there — and since 2026-09-05 without having
asked for anything, the apparatus being on unless they turn it off.

**`fold` in `lemma.ts` expands `æ` and `œ`**, which no normal form does — they
are letters, not a base plus a mark. The curated Latin Ave ends `nostræ` and
the Catechism prints `nostrae`, so without it the lemma matched as far as
`nostr` and the word-boundary guard then refused the whole clause.

## `scrollIntoView` moves the page, so a list never calls it

Use `$lib/reveal-row`'s `revealRow` to bring a current row into view.
`scrollIntoView` scrolls **every** scrollable ancestor up to the viewport, and
performing a scroll on a box aborts a smooth scroll already running on it —
so `StructureSidebarToc`, whose current row is `spy.current` on half its
routes, cancelled the keyboard reference step's animation the moment the step
crossed a section boundary. Setting one container's `scrollTop` cannot move
the page. The same call is wrong inside a modal for a second reason, which
`TocMenu` and `JumpBox` had already met: the document behind an open dialog is
inert but still scrollable. `site/docs/reading.md`.

The scroll the site DOES compute is `$lib/smooth-scroll`'s critically damped
spring, never `behavior: 'smooth'`: a second native `scrollTo` restarts the
first, and a held step key repeats thirty times a second. Retargeting a spring
keeps both position and velocity continuous, so nothing restarts. It yields to
any other scroll by noticing the page is not where it left it — one check that
catches the wheel, the scrollbar and the keys alike.

## Focus mode: print's hidden list, with three exceptions and one gate

`data-zen` on `<html>` (`$lib/zen.svelte.ts`, a fifth axis written exactly as
`theme.svelte.ts` writes its four) and `styles/zen.css` is the whole
behaviour. The selectors are `print.css`'s, which argues each one in place —
**do not re-argue them here; add to both or neither.** `site/docs/reading.md`.

- **Three are deliberately NOT repeated, and each is paper vs screen.**
  `.unit-nav` stays (prev/next IS reading; print drops it because paper
  cannot be followed), `.reading-bar` stays emptied rather than hidden (it
  carries the way out), `.breadcrumb` stays (print's own exception, and with
  the header and sidebar gone it is the only thing left saying which chapter
  of which work this is).
- **Every rule is gated on `:has(.reading-bar)`.** The preference persists
  across navigations and the only control that turns it off is in the bar, so
  without the gate a reader who left it on would meet the home page with no
  header, no footer and no way back. A new page that should honour focus mode
  needs a `ReadingBar`, not an entry in a list.
- **Nothing moves.** Everything hidden is hidden with `opacity: 0` and
  `visibility: hidden` together, never with `display: none`: the pair paints
  nothing and still holds every box, so the header keeps its height and the
  bar keeps the `--reading-bar-height` that `scroll-padding-top` is measured
  against. `display: none` was the first version and jumped the page by the
  header's height on every toggle. Add rules in that form, or the mode stops
  being free to leave on.
- **Hiding a container that holds a `<dialog>` disables the dialog, and both
  properties do it.** `JumpBox` and `Shortcuts` render trigger and `<dialog>`
  as siblings inside `.site-header`, so only the triggers are hidden;
  `display: none` would take the dialog out of the box tree (`layout.css`
  relies on that for `TocMenu`) and `visibility` inherits through the top
  layer. The bar's rule excludes `dialog` and `[popover]` in its `:not()`
  rather than overriding them — an override has to out-specify what it fights.
- **`zen` in the code, "focus" on screen.** The mode's name is what a
  developer searches for; the reader-facing string is not, on a site
  publishing the Catechism and the Code of Canon Law. `zen.enter`/`zen.exit`
  are in the fourteen dictionaries carrying the full chrome and deliberately
  not in the twenty-three that already fall back to English for `ui.close`.
- **`Escape` leaves it, gated on `ShortcutContext.zen` and checked AFTER the
  overlay guard** — otherwise a dialog opened inside focus mode would dismiss
  the mode and stay on screen.

## The liturgical calendar is computed, and checked against someone else's

`$lib/calendar/` derives every day of any liturgical year from the date of
Easter and a table of fixed celebrations; `/calendarium` renders it. No content
tier, no manifest, no download wave — it is the only page whose subject is not
a text (§The liturgical calendar).

**The table is ours because the Holy See publishes no calendar.** _Mysterii
Paschalis_ is on vatican.va; the _Universal Norms_ and the _Calendarium Romanum
Generale_ it approves are not, and `liturgical_year/` is six descriptive pages
with no dated list. So `grc.ts` sits here rather than in the corpus, on
`pontificates.ts`'s precedent — a fact about the world that nothing upstream
states.

**What makes it trustworthy is `oracle.test.ts`, not care.** It compares every
day of three years in all eight transfer variants plus every national calendar
GCatholic publishes — 94 in all as of 2026-09-04 — against calendars GCatholic
computed independently (`pipeline/CLAUDE.md`). Six rules came out of it that reading the Norms had got
wrong; the two worth carrying here because they generalise:

- **An optional memorial never takes the day**, though line 12 of n. 59 sits
  above line 13. Reading the precedence table as a plain sort made every ferial
  Tuesday with a saint on it disappear into that saint — 100 days of 2026.
- **RANK AND PRECEDENCE ARE DIFFERENT FIELDS AND MUST STAY SO.** A feast of the
  Lord is line 5 and a feast of a saint line 7, with a Sunday in Ordinary Time
  between them; both are `rank: 'feast'`. Comparing on rank gets the
  Transfiguration-on-a-Sunday case backwards and reads plausibly doing it.

**THE ORACLE MOVED TO THE CORPUS ON 2026-09-04** —
`glossa-corpus/build/gcatholic-calendar/`, untracked, rebuilt by `uv run
pipeline/rebuild.py --only calendar` from `raw/` with no network. It was 281
files and 28 MB in a public repository whose whole packed history is 10.6 MB.
**So `npm test` no longer runs it**: `npm run verify:calendar` does, with its own
`vitest.oracle.config.ts`, and `package-scripts.test.ts` asserts it stays out of
both `verify` and `test` — the colon in the name reads as membership and it is
not a member. **Without a corpus it FAILS naming the path and the rebuild
command**, never skips green. `held.ts` — the result, and the only part the site
acts on — stays here. It is the one directory under `build/` that is not a work,
so `sync-corpus.mjs` names it in `NON_WORK_DIRS` (§docs/calendar.md).

**The picker is a grid of flags grouped by region** (`CalendarMenu.svelte`).
A reader of that control already knows the answer before they read anything —
they are looking for their own country, which they recognise by its flag faster
than they can read a column of names in an alphabet that may not be theirs. The
flags are emoji composed from the same ISO code the calendar is keyed by, so a
country added to `national/` arrives with its flag drawn and no table to update;
England, Scotland and Wales are tag sequences and are named from
`SUBDIVISION_NAMES`, being the three ids that are 3166-2 subdivisions. Windows
draws the pair as boxed letters, which is the country's own code and why the
cells are sized for two letters rather than a picture; the name is the `title`
and the `aria-label`. Ordered inside a region by the reader's own alphabet
(`Intl.Collator`), so the layer table stores regions and not an order. The row's
controls wear `.menu-trigger` and `.label-micro` rather than restating them, so
a change to the chrome reaches this page without anyone remembering it is there.

**THE GENERAL CALENDAR IS NOT THE VATICAN'S, AND THE PICKER SAID IT WAS** for a
day (2026-09-04). Vatican City keeps the DIOCESE OF ROME's calendar — `IT-rome0`
upstream, `va` here, eleven propers no other calendar has — so 🇻🇦 stood for two
different calendars in one control. The mark is 🌐: a globe is not a territory
(§docs/calendar.md).

**`?c=` NAMES A TERRITORY, NOT A LAYER** (2026-09-04): four cells select `ps`,
and with the layer stored the trigger printed the alphabetically first, so
choosing Israel answered "Cyprus". `TERRITORY_CALENDARS` resolves it, and a
layer id stays valid because a layer's own territory is one it covers. **A held
calendar's territories leave the picker with it** — that map is built from the
published list — which is right: what is held for a country is held for everyone
who keeps that country's calendar (§docs/calendar.md).

**`/calendarium` IS A MONTH LISTING** (`CalendarMonth.svelte`, 2026-09-04),
where it listed the whole liturgical year filtered to its ~230 non-ferial days.
It was a seven-column grid for an afternoon in between, and the reason that went
back generalises: **this page is not a diary** — a day's name is a line of text
of unpredictable length, which a column a seventh of the page wide cannot hold.
**There is no separate "month being viewed"**: the month listed is the month of
`selected`, and paging moves the selected day, so the page keeps one piece of
state and it is the one in the URL. Rows are real `?c=`/`?d=` links, not buttons;
a keyboard move that crosses a month replaces every row, so the component names
the date to stand on and refocuses it after the render (§docs/calendar.md).

**IT LISTS THE DAYS THAT SAY SOMETHING, PLUS THE CHOSEN DAY AND TODAY** — that
second half is what makes filtering safe here and is what the year listing
lacked, since a date typed, pasted or arrowed onto is always a row and nothing
can be looked up and be missing. A row and a day are therefore not the same
thing, and the arrow keys walk ROWS, off one month's end into the next.

**THE DAY'S CARD IS ABOVE THE LISTING, AND NOTHING MAY MOVE UNDER A CLICK**
(2026-09-04). Two reflows, two rules. **A selection must not change text
metrics** — `font-weight` on a row whose name runs to 111 characters rewraps it
and shoves every row below it down, so selection is an accent bar every row
carries transparent. And **the box that is held is the one whose size moves for
a reason the reader did not intend**: the card's height is a function of the day
being changed (804 of 1,095 days carry no optional memorial; the worst carries
five), so IT takes a fixed height and scrolls inside itself, and the list is
free to be as long as its month. The list was the fixed pane first, with the
section measuring its own top edge to scroll the page back — a correction at the
wrong end, and once the card was fixed it measured zero every time
(§docs/calendar.md).

**A date is a query parameter (`/calendarium?d=2026-04-05`), not a path.** It
names no citation, so it is not a reading address; as a chrome path it would put
an unbounded set of URLs into the sitemap for pages that are pure computation.
The calendar sits beside it in `?c=` (2026-09-04), never written for the general
calendar — the default is an absence, not a value.

**`replaceState` FROM `$app/navigation` DOES NOT UPDATE `page.url`, and every
control on this page was inert because of it** (2026-09-04, §The liturgical
calendar). Shallow routing sets `page.state` and calls `history.replaceState`,
and assigns `page.url` nowhere — so the address bar moved on every click while
`selected`, derived from `page.url.searchParams`, stayed on today's date. Silent
in every direction: no console error, no `check` failure, no test. Commit a
parameter the render reads with `goto(url, { replaceState: true, noScroll: true,
keepFocus: true })`, the three flags `compare-nav.svelte.ts` already uses;
shallow routing is for state that belongs to a history entry and not to an
address.

**THE PAGE EXPLAINS ITS OWN VOCABULARY** (2026-09-04). Every word on the day's
card is a term of art — a vestment colour, a rank out of the Universal Norms, a
season that is not the English word, three lectionary counters — and the page
printed all of them with no way in. Two shapes, because the question has two:
`TermGloss` behind each term (`SiglumGloss`'s mechanism with the citation half
removed — the top layer is what lets it escape the card's `overflow-y: auto`),
and `CalendarPrimer` at the foot, whose lead says what a liturgical year is FOR
and whose folds are the vocabulary. **Both read the same `calendar.gloss.*`
strings**, so tooltip and primer cannot disagree; the primer's lists are
`satisfies Record<Season | Rank | Colour, true>` so an unexplained term is a
type error, and a test pairs names against glosses in both directions —
`TermGloss` interpolates its key, so a missing gloss shows as the key itself,
which for `rose` is visible twice a year. **English and Portuguese only**, on
`loadFailed.*`'s precedent (§docs/calendar.md).

**THE ENGINE COMPUTES; A NATIONAL LAYER IS COPIED, AND ALWAYS WAS.** Worth
being exact about, because the two halves are checked differently. The temporal
cycle, the Table of Liturgical Days, transferred solemnities, Lenten
commemorations and `grc.ts` are derived here and judged by a calendar somebody
else computed — that is the half that can be wrong invisibly, and it is what
seven engine extensions came out of. A conference's proper celebrations are not
derivable from anything: they are a positive act, and even the sixteen
hand-written layers took their content from the oracle (`br.ts`: "a celebration
earns a row by making a day come out differently"). So for a country the NAME
check is a transcription check; for the derived ones it is circular, and every
generated file says so in its own header.

**SOME LAYERS SHARE THEIR PROPERS, AND `national/groups.ts` HOLDS THE ROWS**
(2026-09-04). Kenya, Sudan, Uganda and South Africa carry seventeen dates
identically; Algeria and Tunisia twelve; Austria and Liechtenstein thirty-nine.
`withGroup` composes and **throws on a collision**, which is the whole safety
property: a date joins a group only where every member holds an identical list
on it, so a member can never carry a row of its own on a group's date. Three
rules keep it a deduplication rather than a claim — whole dates never single
celebrations, one anchor language per group (which is what keeps Luxembourg out
though it shares 48 celebrations), and names that describe the members and
assert nothing about who approved the rows. **It cost the oracle nothing**,
because `oracle.test.ts` compares computed calendars and never reads a layer
file. `groups.test.ts` is in the hermetic suite for a reason worth remembering:
the throw is at module load, and nothing in `npm test` imported a grouped layer
once the oracle moved out of it (§docs/calendar.md).

**`ALSO_COVERS` LIVES IN THE DERIVATION NOW, AND USED TO LIVE NOWHERE.** The
field was written into five layer files by a throwaway script that no longer
exists, so it was regenerable only from the previous copy of its own output —
the exact shape the root `CLAUDE.md` records biting this project three times in
one day. The first re-derivation dropped eleven territories out of the picker
silently, with every test still passing, because nothing computes them.

**Adding a country is a data file and no code.** `NationalCalendar` is a layer —
propers, overrides, transfers, and general celebrations kept on another day —
because that is what Universal Norms nn. 48–55 describe. `national/common.ts` is
what a row is spelled with. Since 2026-09-04 `national/` holds a layer for every
calendar GCatholic publishes: sixteen written by hand and the rest derived by
`pipeline/derive_national_calendars.py`, which reads the difference between a
country's feed and the general variant it layers over.

**EIGHTY-FIVE LAYERS, NINETY-SIX TERRITORIES, AND ONLY WHAT PASSES IS
PUBLISHED.** Three numbers, three separate facts:

- **96 against 85** is eight particular churches standing for more than one
  place — Åland keeps Finland's calendar, the Faroes and Greenland keep
  Denmark's, three vicariates carry eleven countries between them.
  `alsoCovers` on those layers puts the other territories in the picker without
  inventing a calendar for them; `TERRITORY_CALENDARS` resolves it.
- **`national/held.ts` is `site/unpublished.json`'s argument for a different
  kind of output**: a layer the oracle still disagrees with is kept out of
  `NATIONAL_CALENDAR_LIST` until it does not. A reader cannot tell a calendar
  that is wrong on four days from one that is right, and this is the one kind
  of output where being wrong looks exactly like being right. The counts in it
  are the evidence and they are small — out of 1,095 days per calendar, most
  differ on one to five.
- **The last test in `oracle.test.ts` asserts the list is EXACTLY the diverging
  set**, in both directions. Without it a regressed layer would be silently
  absorbed and a fixed one would sit unpublished for ever. `NATIONAL_CALENDARS`
  is keyed over ALL layers, held ones included, because the test has to reach a
  held layer to measure it; the route resolves `?c=` against the published list
  instead, so a held id in a pasted URL falls back to the general calendar.
- **`CALENDAR_FEED_IDS` maps GCatholic's code to the layer**, and the obvious
  derivation is wrong in a way that reads as right: taking the code up to the
  first hyphen answers `us` for `US-H` and then `it` for `IT-rome0`, which is
  the Diocese of Rome — so the Vatican was checked against Italy's layer and
  Andorra against Spain's, and both failed on days neither had got wrong.
  `national/br.ts` is the worked example, and its `movedInYear` is a table of
  YEARS rather than a rule: Brazil moved Peter and Paul backward from a Monday in
  2026 and forward from a Tuesday in 2027, so no rule fits and inventing one
  produces a date nobody chose.

**THE CLAIM "NO CODE" IS TRUE AND COST SEVEN EXTENSIONS TO KEEP TRUE**
(2026-09-03, §The liturgical calendar). Each was found by a country failing the
oracle, not by reasoning, and each is a thing the eight variants of the
universal calendar cannot express:

- **A fourth Sunday transfer**: the Congo keeps the Sacred Heart on the Sunday
  (`sacredHeartOnSunday`), and the Immaculate Heart does NOT follow it.
- **`movable` propers**, placed by an offset from Easter or by an *n*th weekday
  of a month — seven conferences keep the Eternal High Priest on the Thursday
  after Pentecost, the Philippines the Santo Niño on the third Sunday of
  January.
- **`'F'` in `common.ts` is a proper feast OF THE LORD**, line 5. This file
  argued for one afternoon that a country never needs it; the Santo Niño falls
  on a Sunday in Ordinary Time in 2026 and takes it, which only line 5 does.
- **`elevations` is called `overrides`** — Mexico keeps Scholastica and Padre
  Pio at a LOWER rank than the general calendar, and two layers change only a
  colour.
- **`since` on an override gates the OVERRIDE**, not the celebration: those two
  Mexican demotions begin in 2026.
- **`blue` is a `Colour`** — the _privilegio de azul_, in Spain and the
  Philippines and, measured, in none of the five Spanish-American calendars.
- **`Observance` is not a `Celebration`.** Thanksgiving, Independence Day,
  Germany's Whit Monday, Spain's Ember Days: the feeds rank them as nothing,
  because they are not lines of n. 59. Giving them a rank would lose the only
  true thing about them.

**A national proper's name is transcribed, and the oracle's name check for it is
a transcription check.** There is no Latin original — a conference approved it in
its own language — so the site carries that wording and (for the non-Anglophone
layers) an English rendering written here. What the oracle checks INDEPENDENTLY
is everything the engine does with the row: date, rank, colour, precedence,
moves, transfers, suppressions. That is the half that can be wrong invisibly.

## Languages: the interface is a superset of the content

The interface is wider than the corpus — it was the other way around for a
year, until 2026-08-31. `UI_LANGS` lives in `site/src/lib/ui-langs.ts` and
`ContentLang` in `types.ts`; use `isUiLang`/`UI_LANGS`, never a literal list
(`app.html` and `usage-schema.ts` each keep a necessary copy, and a test
asserts both against `UI_LANGS`).

**THE SUPERSET IS CHECKED BY `sync-corpus.mjs`, and until 2026-09-04 it was
only asserted** (§Languages). Five languages entered the corpus with no
interface behind them in the four days after the flip — `lt`, `sq`, `uk`,
`zh`, `zht`, `hi`, each inside a commit about something else — and the only
visible trace was the prayers' edition menu offering "hi", "zh" and "zht" as
if they were titles, which is exactly what `ccc.mg` had done a week earlier.
The sync now reads the real corpus and exits 1 on a language with no
`LANGUAGE_NAMES` entry or no dictionary; **the check cannot live in vitest**,
which runs on two Bible books in languages that have had dictionaries since
the first week. Both tables moved to `src/lib/lang-names.ts` to make it
possible — `corpus.ts` and `menu-filter.ts` reach `import.meta.glob` and Node
cannot import either, the same reason `ui-langs.ts` exists.

**`zht` is Vatican News's slug, not BCP-47, and `zh-Hant` throughout was
weighed and rejected** (§Languages). A tag here is an IDENTITY and a subtag is
a VARIANT: `baseLang` folds `zh-Hant` to `zh`, which is exactly how `en` and
`en-GB` become one row, and `EditionMenu`'s `pairEditions` keeps only the
first edition per base language — so the Traditional prayers would have been
unofferable and unnegotiable. Right for English spelling, wrong for a script.
`bcp47()` converts wherever a tag leaves for a machine; the URL keeps `zht`.
So `direction.css` matches `:lang(zh-Hant)`, **after** `:lang(zh)`, which
also matches it at equal weight; and `SCRIPT_VARIANTS` folds `zh-TW` to `zht`
rather than to `zh`, with a copy in `app.html` for the pre-paint pass.

**Every `Intl` constructor must be handed `bcp47(...)`, and a test scans the
source for it.** `zht` is structurally valid BCP-47, so `Intl` does not throw
— it answers in the browser's default locale, past a `try`/`catch` that never
fires. Two call sites shipped that way before anyone looked (`library.ts`,
`/calendarium`). **A shim is only as good as the places that remember it**, so
`i18n.test.ts` checks the places.

**`dateLocale` in `dates.ts` is the one helper that scan allows through, and it
is stricter than the shim** (2026-09-04): it cuts the region, runs `bcp47`, then
asks `supportedLocalesOf` whether the platform can answer — falling back to
`en-US` where it cannot, which is what Latin needs and `bcp47` alone does not
do. **The order matters both ways**: cut the region first (`pt-BR` is a language
choice, not a country), convert after (`zht` cut to `zh` resolves to
Simplified). It replaced `lang.startsWith('pt') ? 'pt-PT' : 'en-US'`, written
when the site had two interface languages — so every reader who was not
Portuguese was shown English dates for a year (§docs/languages.md).

**Still do not derive one list from the other.** The lists equalized and
separated four times in eight days; the rule survives the flip and reads the
other way now: an interface language is no longer evidence that the corpus
holds anything, and the next ingestion in a language with no dictionary
separates them again from the other side.

**What the old list actually tracked was who had written a dictionary.**
Closing that gap (twelve content languages had no chrome) made the interface
a superset; on top sit the **reach languages** (`tl ko id ig ml` of the eight
added on 2026-08-31 — `zh`, `uk` and `hi` have since gained a text), chosen
by Catholic population rather than by what has been ingested. A reader in one
gets their own chrome and English content through `CONTENT_LANG_FALLBACK`;
the alternative is the same content behind a language they do not read.

**A dictionary need not be complete** — `t()` falls back to English key by
key. What the build enforces is `CHROME_KEYS` (`assertNamed` throws on an
unnamed chrome page, which breaks the `hreflang` cluster) and
`bible-groups.test.ts`, which demands all nine group names.

**The colophon was the one page deliberately left untranslated, and on
2026-09-02 that was reversed** — the argument (a machine translation of the
page about care with words contradicts itself) proves too much: a reader who
cannot read the page cannot weigh it either. Every dictionary carries all 31
colophon keys now, with a parity check over `src/lib/i18n/*.ts`. The honesty
lives in each file's header instead, which names its own confidence tier —
keep that part.

**The standing statement is in the FOOTER of every page since 2026-09-02, not
only on the colophon.** `footer.notEndorsed` — "Not endorsed by the Holy See" —
is `colophon.whatThisIsStanding` in one line, on the reasoning that Can. 216 is
provoked by the NAME and the name is in the wordmark at every address the site
answers, so the disclaimer has to reach as far as it does. It says "the Holy
See" and not "the Vatican" (the state, not the authority) nor "ecclesiastical
approbation" (exact, and unreadable in a footer). **It is this short because of
where it sits** — the colophon link is the line directly above it, so it need
not carry its own context; move it away from that link and it would have to say
more. Every dictionary carries it.

**The lines are one chrome, and that is load-bearing rather than lazy.**
Colophon link, motto, disclaimer, then `.build` — one column, `.site-footer p`
in one rule, spacing from `line-height` rather than margins so the even leading
is one number. Give the motto its own face or step and the stack reads as a
heading with two captions instead of an imprint. `.build` is IN the column and
not under the whole imprint: centred against the mark as well, it would sit on
the footer's midline while the three lines it belongs with sit off it.

**The colophon link is the one exception, and it was made by DELETING.** The
footer overrode `a` back to `--color-text-muted` with `text-decoration: none`,
which left the only link in it indistinguishable from the two statements below
— an affordance disguised as a caption. The override is gone, so `base.css`'s
own rule applies: `--color-link`, underline at 35% of its colour, solid on
hover, like every other link on the site. **Reach for the global rule before
writing a footer-local one**; the size and leading are untouched, so the stack
is still one chrome and only the clickable thing looks clickable.

**`JerusalemCross.svelte` is inline SVG because an `<img>` cannot see the
theme.** `<html>` carries four independent axes — `data-theme`, `data-sepia`,
`data-oled`, `data-mono` — and a referenced SVG is a separate document that
sees none of them; the most it could read is `prefers-color-scheme`, which
covers one axis and gets `data-theme='light'` on a dark-preferring OS
backwards. Inline, `fill: currentColor` follows all four for nothing. It is its
own file rather than an entry in `Icon.svelte`, whose docblock promises it is
the only importer of `@lucide/svelte`; `Wordmark.svelte` is the precedent for a
mark that is live geometry. **THE GEOMETRY IS NOT OURS**: it is Wikimedia
Commons' `Cross-Jerusalem-Potent-Heraldry.svg` by AnonMoos and Melian, public
domain, verified through the Commons API (`AttributionRequired: false`, no
restrictions) before it was copied and credited in the docblock anyway. Three
of our own drawings preceded it — a solid potent built from overlapping rects,
the same traced as an outline, five plain crossed lines — and all three were
guesses at proportions the heraldry has already settled. **The `<use
xlink:href>` pairs were expanded into rotations** about (280, 280): two for the
arm, four for the crosslet. That is not a redraw and it was proved so — the
expansion pixel-diffs to zero against the original — and it exists because
`id`s in a component collide if it is ever rendered twice, and `xlink:href` is
deprecated. And **draw the plain
five-cross figure and nothing else**: no crown, no motto ring, no red-on-white
in the Order of the Holy Sepulchre's arrangement, because a mark drifting
toward a specific body's ARMS would contradict the sentence beside it.

**The mark and the lines are ONE centred group in TWO GRID COLUMNS**
(`.imprint`), and the two tracks are the point: the mark is beside the text
without being in with it, so it cannot reflow the lines or shift the one it
sits level with. A flex row did this for one revision and `flex-wrap` let the
mark drop onto the text's line at narrow widths — exactly the interference two
tracks rule out. `justify-content: center` centres the PAIR of tracks rather
than stretching them, which is what holds the group on the footer's midline
while each column stays its own content's width. Written in reading order and
never positioned, so **RTL needs nothing** — the columns reverse and the mark
lands on the right in Arabic and Hebrew.

**It was absolutely positioned in the inline-start lane for one revision**, and
the cost was a trick worth not reintroducing: `.site-footer` needed outsized
SYMMETRIC inline padding, whose only job was to reserve that lane on both sides
so the centred lines stayed on the footer's true midline. Pad one side and
every line shifts by half the difference — wrong in a way nobody can name. With
the mark in the flow there is no lane, so the padding is back to `1.25rem` and
a `max-width: 30rem` restack rule is gone entirely.

`Ad maiorem Dei gloriam` is untranslated and carries `lang="la"`, the only
Latin in the chrome. None of it prints — `.site-footer` is in `print.css`'s
hidden list, and the colophon carries the full statement.

**Twenty of the thirty-four dictionaries have never been read by a native
speaker** — every language added on 2026-08-31 was translated by an LLM in
one sitting, and the exposure grew when the colophon keys were added. The
colophon's `whatThisIsStanding`, the footer's `footer.notEndorsed` and
`copyrightBody3` (canonical standing under Can. 216 at both lengths; how a
rights holder reaches us) are the three strings where a mistranslation costs
something real — the first to check. Tiers, per each
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
