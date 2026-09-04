# The dev loop

How the site is built, served and checked locally, and the traps that cost days
before they were understood.

## The sync

**The sync skips a run whose inputs have not moved, and `predev` is the one
caller that takes it.** It wiped and re-derived 8,431 files on every
invocation — 13.3 s paid by every `npm run dev`, for a corpus that during app
work never moves. The mechanism is `pipeline/rebuild.py`'s, deliberately rather
than a second design. 13.3 s to 0.27 s.

**The pipeline's rule is that `--changed-only` stays opt-in, and `predev` opts
in.** That rule is about the pipeline, where a stale parse is invisible; this
one fails in front of you. **What makes it safe is the split rather than the
reasoning: `prebuild` does not pass the flag**, so no deploy can take a skip.
`dictionaries` is a separate fingerprint because `readDictionaries` loads them
with a template-literal `import()` that no walk of import statements resolves.

**A `size:mtime_ns` digest needs a bigint stat, and getting it wrong degrades
silently.** `mtimeNs` is `undefined` on an ordinary `statSync`, which hashes
identically for every file and reduces the whole thing to a size-only check.
What caught it was a test asserting the digest moves when mtime moves — not any
run of the real thing, which skipped and rebuilt exactly when it looked like it
should.

**A script that destroys its output before rebuilding it must invalidate the
evidence that the output is good, in the same breath.** `sync-corpus.mjs` wipes
`corpus-data/` at the top and writes six files over the thousand lines that
follow, and a gate exiting between the two used to leave the whole set behind
describing a corpus no longer on disk — **and preflight approved the result,
because the file it reads to tell a real corpus from fixtures was the one file
the failed run had not touched.** The six are cleared beside the wipe, so the
check's own input cannot be forged. Clearing there rather than in an `exit`
handler is what makes it hold for a `kill -9`. `lastmod.json` is deliberately
not in the set: it is committed, and an input to the next run as much as an
output of this one.

**`npm run build` deletes the corpus out from under `npm run dev`.**
`prebuild` runs the sync in FULL on purpose, and `corpus-data/` is inside
`src/`, which Vite watches — so the two-terminal habit hands a running dev
server an unlink storm across the files its module graph is built on, and every
valid address answers `error(404)` until the server is restarted.
`server.watch.ignored` forfeits nothing that was promised: `npm run dev` never
re-derived the corpus, so the directory was never a live input.

## Three caches, confused for each other

`node_modules/.vite` is Vite's dependency pre-bundling cache, and clearing it
(`npm run dev:clean`) answers `Pre-transform error: … deps/<name>-<hash>.js`
and nothing else. `CONTENT_CACHE` is the service worker's, which the dev twin
drops on activate. The corpus wipe above touches neither, which is why a
`dev:clean` habit never helped.

**A dep reached only by a dynamic import is pinned in `optimizeDeps.include`.**
Vite's scanner does not see `await import('fuzzysort')`, so it is pre-bundled
while the page is already loading, `deps/` is rewritten under fresh hashes, and
requests in flight against the old names 404. **The lesson is not the pin, it
is which cache was suspected**: the same error was read the day before as a
stale service worker, and `register: false` fixed nothing, because it does not
evict a worker already installed. **Both caches produce a stale answer; only
one is on this machine's disk** — settle it by deleting the server's, loading
one page, and reading the log.

**The service worker's design rests on two premises a build satisfies and
`vite dev` does not**, so the other cache was real as well. Content URLs are
content-hashed, which is the entire licence for `cacheFirstAndStore` to keep a
file for ever; in dev they are plain paths, so the first read pins those bytes
to that path permanently. And `version` changes per deploy, where in dev it
changes per dev-server PROCESS, so between restarts the boot document comes
cache-first out of a snapshot. Those are the "often it does not show" and "so I
restart the server" halves of the complaint. There is also a cost that is not
staleness: the real worker's dev module graph is 9.03 MB, of which 8.82 MB is
`content-manifest.json` and its sourcemap, and a controlled page's requests
wait behind that worker starting.

**The fix substitutes the MODULE, which is what `register: false` could not
do.** `glossa:dev-service-worker` resolves `service-worker.ts` to a twin under
`apply: 'serve'` that registers no `fetch` handler, never calls
`clients.claim()`, and on `activate` deletes every `glossa-*` cache and
unregisters itself — so the eviction reaches the profile that has the problem.
No `fetch` handler is what makes the interval before the tab closes harmless;
skipping `claim()` is what stops a reload loop. It deliberately does not put an
`import.meta.env.DEV` branch in the real worker, which would still import the
8.8 MB manifest to reach the branch, and does not try to make the worker
correct in dev, which would mean inventing content hashes.

## HMR, measured and left alone

The complaint was edit-to-see latency, and the answer is that HMR is not slow —
it is _absent_ for half the files being edited. Measured off the dev server's
HMR websocket: a `.svelte` edit is an update in 7–40 ms, a `.ts` edit is a full
reload.

**A Svelte component is its own HMR boundary and a `.ts` module is not.** Vite
walks up the import graph looking for a module that called
`import.meta.hot.accept`; the Svelte plugin injects one into every component,
and there are zero such calls anywhere in `src/`. That is the whole mechanism,
and not a misconfiguration.

**The obvious fix is wrong in a way worth writing down.** A bare
`import.meta.hot.accept()` in `i18n.svelte.ts` stops the reload by re-executing
the module, which builds a new `$state` proxy while every rendered component
still holds the old one — an edit that appears to do nothing, which is worse
than the reload it replaced.

**Not doing it, and the conditions are recorded rather than the refusal.** The
dictionaries are 480 of ~876 reload-causing touches, but the other 396 hold
real module state and would each need their own state-transfer answer; it adds
a silent-staleness mode to a project whose documentation exists to prevent
them, and it cannot be unit-tested. Worth revisiting only with both
mitigations: the handler falling back to `location.reload()` on any error, and
the websocket probe checked in as its guard.

**73.8% of every byte the dev server sends is an inline sourcemap**, and three
attempts to turn that off all failed (Vite composes the map across the whole
transform chain, so one plugin declining contributes nothing; and
`dev.sourcemap.js` is `@experimental` and had no effect). **Read that as bytes
and not as seconds** — a browser does not parse an inline sourcemap unless
devtools is open, and the browser-side cost was not measured, because that
needs a real browser.

## Serving and checking

**A local server that answers a question wrongly is worse than one that refuses
to answer it, and `vite preview` had been the local server here for a year.**
It serves `build/` behind an SPA fallback, so `src/worker.ts` never runs — and
the way it does not run is a 200 that looks entirely normal:
`/catechismus/999999` is a 404 through the worker and a **200 carrying the
application shell** through preview. So the head-rewriting half of the site,
the route manifest's whole purpose and the OSIS redirects were unverifiable
locally by the only command anyone ran.

**`wrangler dev` was always available and simply had no script, which is the
whole reason it went unused.** It runs the real worker over `build/` with the
asset binding, local D1 and `_headers` parsed, over `127.0.0.1` — a secure
context, so the real service worker installs as it does in a deploy.
`npm run preview:deploy` is `npm run deploy` with the deploy removed, because
neither server rebuilds.

**None of this replaces `npm run dev`, and the temptation to let it is the trap
worth naming.** `requireIndex` throws under `import.meta.env.DEV` and only
warns in a build, and `npm test` cannot reach that class at all. The
build-and-serve loop answers "what does a reader get"; dev answers "is this
correct".

**A check that has never passed is not a check, and `npm run check` had never
passed.** 23 `svelte-check` errors on a clean tree, in two untyped scripts
against sixteen JSDoc-typed ones that are clean under the same config — so the
convention was never in question, and the noise made a real type error
indistinguishable. **The fix is to type the two, never to loosen the config**,
which is the same argument `chunkSizeWarningLimit` got: a warning that always
fires stops being read.

**`scripts/` is type-checked only where a test imports it.** SvelteKit's
generated tsconfig includes `../src/**` and nothing else, and an `include` in
an extending config REPLACES the base's rather than merging it — so the `.d.ts`
lives under `src/`.

**Three tests each named a different command as their fix, so the fix became
one command.** `npm run export` runs all three exporters; they are
byte-identical re-writes when nothing moved, and editing the grammar does not
tell you which of the three went stale.

**The script table is the one part of this project with no compiler behind it,
and now it has a test instead.** Rename `build` and `prebuild`/`postbuild` stop
running, with no error and no warning; five names begin with `pre` for reasons
unrelated to hooks, so a future script called `view` would silently acquire
one. Each invariant in `package-scripts.test.ts` was mutation-tested when
written — **a guard that cannot fail is worse than no guard, because it is also
an assurance.**

**Fixtures deliberately encode absent chapters and out-of-range
cross-references**, and a second English Bible for the preferred-edition table.
A replacement that drops those properties silently stops testing them.

**"Nothing at this address" was the wrong sentence for a dropped request.**
`+error.svelte` sent every non-404 to `NotFound`, which is built to send the
reader away from a page that was one retry from working. Three states now, in
`error-view.ts` because nothing renders a component under `vitest`, retrying
with `invalidateAll()` rather than `location.reload()`.

**A memoised rejection is how a transient failure becomes a permanent one, and
this project has learned it twice.** `readContent` wrote the rule down for the
content tier and the index tier did not inherit it — where it is strictly
worse, since a content read that never retries costs one text and an index that
never retries costs every address in that work type. `retryable-once.ts` is
that rule as a tested primitive rather than a comment repeated in two places.
