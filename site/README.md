# Depositum — site

The SvelteKit + `adapter-static` frontend for Depositum: a free reading/reference
site for the Bible and the Catechism of the Catholic Church. See
`../docs/decisions.md` and `../docs/corpus-schema.md` for the project-level
architecture and data contract this app is built against.

## Corpus data

The corpus (`../corpus/`) is gitignored and lives outside this package — it's
scraped/built separately by `../pipeline/` (see `docs/corpus-schema.md`).
This site never commits corpus data; it only knows how to *read* it.

- `src/lib/corpus.ts` is the **only** module that knows where corpus data
  physically comes from. It reads real data through
  `import.meta.glob('./corpus-data/works/**/*.json', { eager: true })`, and
  falls back to the bundled fixtures under `src/lib/fixtures/` whenever
  `src/lib/corpus-data/` is empty (e.g. no corpus has been synced yet).
- `import.meta.glob` was chosen over `fetch()` because the whole site is
  prerendered by `adapter-static` (no server runtime, see
  `../docs/decisions.md`): a build-time glob import lets Vite inline the
  JSON straight into the prerendered pages, with no extra network
  round-trip and no risk of drift between what a route fetched and what
  actually got embedded in its HTML.
- `import.meta.glob` patterns must be static string literals, so they can't
  be built from an env var directly. Instead, `scripts/sync-corpus.mjs`
  copies `../corpus/works/` (and `../corpus/xrefs/`, if present) into the
  fixed, gitignored path `src/lib/corpus-data/` that the glob targets.
  - Configurable via the **`CORPUS_DIR`** env var (default: `../corpus`,
    resolved relative to this `site/` package).
  - Wired as an npm `prebuild` / `predev` hook, so `npm run build` and
    `npm run dev` always sync first. Run it manually with
    `npm run sync-corpus`.
  - If no corpus is found at `CORPUS_DIR`, the script warns and exits 0 —
    the build still succeeds, using the bundled fixtures instead.
  - **`npm test` never triggers a sync** (no `pretest` hook), so vitest is
    deterministic and always exercises the fixtures regardless of whether
    a corpus checkout happens to be present.

```sh
# sync ../corpus/ into src/lib/corpus-data/ (also runs automatically before
# `dev` and `build`)
npm run sync-corpus

# point at a corpus checkout elsewhere
CORPUS_DIR=/path/to/corpus npm run build
```

Works currently available in the real corpus: `bible.cpdv.en` and
`bible.matos-soares.pt` (both complete, 73/73 books), plus `ccc.en` and
`ccc.pt` (sample data — a few hundred paragraphs each, gaps expected until
the full crawl lands). The site is designed to build correctly from
whatever subset of works/paragraphs is actually present — gaps degrade
gracefully rather than failing the build (see `getAdjacentCccParagraph`,
`getAdjacentChapterAcrossBooks`, and the `related`-link resolution in
`routes/ccc/[n]/+page.svelte`).

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
