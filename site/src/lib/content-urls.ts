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

// `?url` + `import: 'default'` yields the hashed BUILD ASSET URL for each file
// (a string), not its contents — Vite still emits the file itself as a build
// asset, just doesn't inline it. `vite.config.ts` is what makes that last part
// true below 4 KB; see its `assetsInlineLimit` note, which is not optional
// reading.
const globbed = import.meta.glob('./corpus-data/content/**/*.json', {
	eager: true,
	query: '?url',
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
