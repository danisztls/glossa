/**
 * The content tier's one glob: every corpus content file this build emitted,
 * keyed by its `relPath`, valued by its hashed build-asset URL.
 *
 * A MODULE OF ITS OWN BECAUSE THE GLOB IS EXPENSIVE TO WRITE TWICE, and it was
 * written twice until 2026-08-26 — once in `corpus-index.ts` for the location
 * lookups, once in `corpus-assets.ts` for the service worker's inventory. In a
 * production build that duplication was free, which is the argument that put it
 * there: Vite emits each file once regardless, and what got duplicated was a map
 * of strings in two bundles that are never loaded together.
 *
 * IN DEV IT IS NOT FREE, and that is what this module fixes. `import.meta.glob`
 * with `eager: true` compiles to one static import per matched file, and Vite
 * serves each of those as its own module request — so two globs over a 2,590-file
 * corpus meant ~5,180 requests before the app could boot. Chrome answers that
 * with `net::ERR_INSUFFICIENT_RESOURCES` rather than a queue: the module graph
 * fails in the middle, `nodes/0.js` never arrives, the service worker cannot
 * start, and the page 500s. Production never showed any of it, because the build
 * resolves the whole glob into one chunk of strings.
 *
 * `corpus-assets.ts`'s original objection stands and is answered rather than
 * overruled: what it refused was importing the map FROM `corpus-index.ts`, since
 * that would drag the whole boot index into the service-worker bundle. This
 * module is the map and nothing else — no registries, no manifests, no trees —
 * so both sides can share it without either paying for the other.
 *
 * KEYED BY `relPath` (`content/{workId}/...`), not by Vite's glob path
 * (`./corpus-data/content/...`), because `relPath` is the shape
 * `content-manifest.json` uses and the shape both consumers wanted anyway; the
 * two used to strip the prefix separately, with their own copy of the regex.
 */

/*
 * `?url` + `import: 'default'` yields the hashed BUILD ASSET URL for each file
 * (a string), not its contents — Vite still emits the file itself as a build
 * asset, just doesn't inline it.
 *
 * `no-inline` IS WHAT MAKES THAT LAST PART TRUE, and it is here rather than
 * only in `vite.config.ts` because this module is read by a build that config
 * cannot reach. SvelteKit compiles `service-worker.ts` in a Vite build of its
 * own with `configFile: false`, forwarding four options and NOT
 * `assetsInlineLimit` (`build_service_worker.js`) — so the guard held for the
 * app bundle and did nothing here, and 1,656 content files under 4 KB were
 * base64'd into `data:` URIs in the worker alone. Everything downstream then
 * did the wrong thing quietly: `contentPath` made a "pathname" out of the
 * base64 payload, `cacheAssets` fetched that and got a 404 it swallows, the
 * real asset fell out of `contentUrls` and into the SHELL precache instead —
 * and the panel, which prices from the APP bundle where the same glob yields
 * real URLs, showed a shelf that could never finish (`27.1 / 27.2 MB`). Two
 * bundles, one module, two different answers.
 *
 * `scripts/audit-inlined-corpus.mjs` fails the build if this ever regresses,
 * because none of the above raises anything.
 */
const globbed = import.meta.glob('./corpus-data/content/**/*.json', {
	eager: true,
	query: '?url&no-inline',
	import: 'default'
}) as Record<string, string>;

/** `relPath` -> hashed build-asset URL, for every content file in this build.
 *  Empty when no corpus has been synced. */
export const contentUrlByRelPath: Record<string, string> = Object.fromEntries(
	Object.entries(globbed).map(([globPath, url]) => [
		globPath.replace(/^\.\/corpus-data\//, ''),
		url
	])
);
