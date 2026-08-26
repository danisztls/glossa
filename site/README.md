# Glossa Catholica — site

The SvelteKit + `adapter-static` frontend for Glossa Catholica: a free reading/reference
site for the Bible, the Catechism of the Catholic Church, and the Compendium of
the Catechism (encyclicals and conciliar documents next). See
`../docs/decisions.md` and `../docs/corpus-schema.md` for the project-level
architecture and data contract this app is built against.

## Corpus data

The corpus lives in **its own private repository**, `glossa-corpus`, expected
on disk as a sibling of this one — `~/Dev/me/glossa` and
`~/Dev/me/glossa-corpus` (docs/decisions.md §The corpus; it holds verbatim
reproductions of copyrighted texts and this repository is public). It is
scraped/built separately by `../pipeline/` (see `docs/corpus-schema.md`). The
site never commits its synced build copy; it only knows how to _read_ it.

- `src/lib/corpus.ts` (public API) and `src/lib/corpus-index.ts` (the
  registries it's backed by) are the **only** modules that know where
  corpus data physically comes from — see their docblocks for the full
  design. Short version: `scripts/sync-corpus.mjs` doesn't just copy the
  corpus, it splits each work into two tiers on disk —
  `src/lib/corpus-data/index/` (manifests, canonical book/chapter
  _numbers_, TOC trees, abbreviations, xrefs — small, `import.meta.glob(...,
{ eager: true })`-inlined) and `src/lib/corpus-data/content/` (the actual
  reading text — Bible books, CCC paragraph chunks, the Compendium — globbed
  with `{ query: '?url' }` so Vite emits each as its own content-hashed
  build asset instead of inlining it). `corpus.ts` reads the content tier via
  `fetch()` in the browser. The app is an SPA, so the static build emits one
  shell rather than a rendered document for every reference. A generated
  `static/corpus-routes.json` contains addresses only; the Cloudflare worker
  uses it to give valid deep links the shell and invalid citations a true 404.
  Both data tiers fall back to the bundled fixtures under
  `src/lib/fixtures/` whenever `src/lib/corpus-data/` is empty (e.g. no
  corpus has been synced yet).
- Why the split (2026-08-15, replacing an earlier version that
  eager-globbed the WHOLE corpus into one client chunk): measured against
  the real corpus, that chunk was 18 MB raw / 4.6 MB gzipped, preloaded on
  every page including the home page, to read one Bible chapter. Content
  here is immutable — a published CCC paragraph or Bible verse doesn't
  change once stable — which is exactly the property that makes per-file
  `fetch()` + long-lived caching better than eager-inlining at real-corpus
  scale: a content-hashed file fetched once is cached forever, and adding a
  work (the ~300 Vatican documents queued behind the 16 already landed,
  `../docs/corpus-schema.md` §Documents) invalidates only that work's
  files, never the whole library.
- `import.meta.glob` patterns must be static string literals, so they can't
  be built from an env var directly. Instead, `scripts/sync-corpus.mjs`
  reads `works/` (and `xrefs/`, if present) from the corpus checkout and
  writes the two-tier layout above into the fixed, gitignored path
  `src/lib/corpus-data/` that the globs target.
  - Configurable via the **`CORPUS_DIR`** env var (default:
    `../../glossa-corpus`, resolved relative to this `site/` package —
    spelled the same way as `pipeline/scrapers/common/`'s `corpus_dir()`,
    so one exported variable moves both halves of the project).
  - Wired as an npm `prebuild` / `predev` hook, so `npm run build` and
    `npm run dev` always sync first. Run it manually with
    `npm run sync-corpus`.
  - If no corpus is found at `CORPUS_DIR`, the script warns and exits 0 —
    the build still succeeds, using the bundled fixtures instead.
  - **`npm test` always exercises the fixtures**, never a synced corpus, so
    vitest is deterministic. Note that the absence of a `pretest` hook is not
    what guarantees this: `prebuild`/`predev` sync into `src/lib/corpus-data/`
    and that directory _persists_, so on any machine where `npm run build` has
    ever run, the glob would otherwise pick up real data. `corpus-index.ts`
    therefore checks `import.meta.env.VITEST` explicitly and forces the
    fixture registry under test. The fixtures deliberately contain absent
    chapters and out-of-range cross-references to exercise the
    not-in-this-corpus code paths, which real data does not reproduce — so
    this is a correctness guarantee, not just a speed one.

```sh
# sync the corpus checkout into src/lib/corpus-data/ (also runs automatically before
# `dev` and `build`)
npm run sync-corpus

# point at a corpus checkout elsewhere
CORPUS_DIR=/path/to/glossa-corpus npm run build
```

Works currently available in the real corpus: `bible.cpdv.en` and
`bible.matos-soares.pt` (both complete, 73/73 books); `ccc.en` and `ccc.pt`
(both complete, 2865/2865 paragraphs); `compendium.en` and `compendium.pt`
(both complete, 598/598 questions); and Vatican II plus encyclical documents
in every available language, surfaced under Magisterium. The site is still
designed to build correctly from whatever
subset of works is actually present — gaps degrade gracefully rather than
failing the build (see `getAdjacentCccParagraphNumber`,
`getAdjacentChapterAcrossBooks`, and the `related`-link resolution in
`routes/ccc/[n]/+page.svelte`) — this matters for the encyclicals/conciliar
documents work now underway (`../docs/corpus-schema.md` §Documents), which
will ship works incrementally rather than all at once.

## Offline / service worker

Glossa Catholica is an offline-first PWA (`../docs/decisions.md`): `src/service-worker.ts`
(SvelteKit's `$service-worker` module, auto-registered in production builds —
see `svelte-kit`'s default `kit.serviceWorker.register`) caches the app in two
tiers with different lifecycles. The shell is precached on install; immutable
corpus JSON is cached as it is read, then the root layout asks the worker to
finish the whole content tier after first render (unless the browser declares
data saver). A later visit safely resumes an interrupted fill. See the
"CONTENT TIER POLICY" block in that file for the precise behavior.

The service worker only runs against a **production build** — `npm run dev`
never registers one, and `vite dev` doesn't emit `service-worker.js` at all.

To test offline behaviour locally:

```sh
CORPUS_DIR=/path/to/glossa-corpus npm run build   # or omit CORPUS_DIR to use fixtures
npm run preview
```

Then, in a real browser (not just curl — the install/activate lifecycle and
runtime cache classification only run in an actual service worker context):

1. Open `http://localhost:4173` and confirm DevTools → Application →
   Service Workers shows it activated, and → Cache Storage shows two
   caches: `glossa-content` (immutable corpus JSON, progressively filled)
   and `glossa-shell-{version}` (the application shell and its assets).
2. Let the background cache fill finish, then DevTools → Network → set
   "Offline" and reload/navigate to several Bible, CCC, and document routes.
   They should still render from the shell plus `glossa-content`.
3. Navigate directly to a URL via the address bar while offline (a real,
   uncached navigation, not a client-side link click) — it should still
   render the correct page, not the offline fallback, because the cached
   home page boots the app and the router takes it from there. Only if
   Cache Storage itself is empty (e.g. a failed install) should you see
   `offline.html`'s plain notice instead.
4. Application → Manifest should show "Glossa Catholica", `standalone` display, and
   the generated icons (`static/icons/`); "Add to home screen" / install
   prompts exercise this.

`curl`-based checks (no browser needed, but only confirm the files are
_served correctly_ — not that the service worker actually installs, caches,
or serves offline responses):

```sh
curl -I http://localhost:4173/service-worker.js    # text/javascript
curl -I http://localhost:4173/manifest.webmanifest # application/manifest+json
curl -I http://localhost:4173/offline.html
```

## Install prompts ("Add to Home Screen")

Being installable and _telling anyone so_ are separate problems, and the second
one splits along platform lines that share no mechanism. Both halves live in
`src/lib/install.svelte.ts`, which is where the reasoning is written down.

| Platform        | Mechanism                                                | Component              |
| --------------- | -------------------------------------------------------- | ---------------------- |
| Chromium / Edge | `beforeinstallprompt`, stashed and replayed from a click | `InstallButton.svelte` |
| iOS / iPadOS    | No API exists. Written instructions only                 | `InstallHint.svelte`   |
| Firefox desktop | Not installable; nothing is shown                        | —                      |

The button is ungated: it appears only when the browser has said the site is
installable, and does nothing until pressed. The iOS hint is proactive, so it
is gated on **15 minutes of visible reading time** (counted by timer firings
while `visibilityState === 'visible'`, so a sleeping laptop banks nothing), and
appears at the reader's next navigation rather than mid-paragraph. Dismissal is
permanent. Counters are `glossa:engaged-ms` and `glossa:install-dismissed`,
alongside the other `glossa:` preferences — nothing leaves the device.

Fifteen minutes is a long time to earn by hand, so two query parameters work on
any page, in `dev` and in production alike:

```
?install-hint         show the bar now, on any browser, ignoring every gate
?install-hint=reset   clear the dismissal and the banked time
```

`?install-hint` is the only way to see the bar on a desktop at all, since the
platform check is otherwise fatal. Closing a forced bar records nothing.

Testing the _button_ needs a production build, same as the service worker —
Chromium only fires `beforeinstallprompt` for a page it considers installable,
which requires the worker. Testing the hint does not; `?install-hint` works
under `npm run dev`.

## The link-preview card

`static/og.png` is what a paste of this site's URL renders as in a chat client
or a social post. It is generated, not drawn:

```sh
node scripts/og-image.mjs   # rewrites static/og.png; commit it
```

The words come from `static/manifest.webmanifest` (its `name`, and the clause
before the em dash of its `description`), the type from `static/fonts/`, and the
colours from `src/app.css`'s light palette — so the card cannot drift from the
name and description the head declares. `src/lib/shell-meta.test.ts` checks that
the `og:` tags, the page title, the description and the PNG's own dimensions all
still agree.

It is **not** part of `npm run build`, and must not become part of it: the script
shells out to `woff2_decompress` (Arch: `woff2`) and `rsvg-convert` (Arch:
`librsvg`), and a deploy that needs either binary fails on a machine that is
otherwise fine. Run it when the name, the description or the design changes,
which is roughly never.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
