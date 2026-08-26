/**
 * `content-urls.ts` for the dev server, substituted for it by
 * `vite.config.ts`'s `glossa:dev-content-urls` plugin. Never in a build.
 *
 * WHY A SECOND IMPLEMENTATION AT ALL. The real module resolves the content
 * tier with one eager `import.meta.glob`, which is the only way to learn the
 * hashed asset URLs a build assigns. An eager glob is also one static import
 * per matched file, and Vite's dev server answers each of those with its own
 * module request: 2,590 of them, before the app can boot, on every full
 * reload. Chrome does not queue that — it fails the surplus with
 * `net::ERR_INSUFFICIENT_RESOURCES`, and what breaks is not the corpus but the
 * app: the module graph tears in the middle, `nodes/0.js` never arrives, the
 * page 500s, and the service worker (which needs the same inventory, and gets
 * a smaller connection budget) cannot start at all. `npm run preview` is
 * always fine, because the build resolves the whole glob into one chunk.
 *
 * WHAT MAKES A SECOND IMPLEMENTATION HONEST. In dev there are no hashed asset
 * URLs to learn: Vite serves a `?url` import straight back as the file's own
 * path under the project root. So the glob is not buying information here —
 * it is spending 2,590 requests to be told something already derivable from
 * `content-manifest.json`, which the sync writes from the same loop that
 * writes the files and which costs exactly one request. Divergence would be a
 * real risk if the two disagreed about WHICH files exist; they cannot, because
 * one writer emits both.
 *
 * THE PREFIX IS MEASURED, NOT ASSUMED. It would be easy to hardcode
 * `/src/lib/corpus-data/` and easy for that to go stale the day this file
 * moves or `base` stops being `/`. Instead one real `?url` import — of the
 * manifest itself, a file this module already needs — reports the prefix that
 * Vite is actually using, and every content URL is built from that.
 */

/** The single row shape this module reads. `corpus-assets.ts` owns the full
 *  `ContentManifestEntry`; duplicating one field beats importing that module
 *  here, which would pull the service worker's inventory into the app. */
interface ManifestRow {
	relPath: string;
}

const MANIFEST_REL_PATH = 'index/content-manifest.json';

const manifestRows = import.meta.glob('./corpus-data/index/content-manifest.json', {
	eager: true,
	import: 'default'
}) as Record<string, ManifestRow[]>;

// The one `?url` import in this file, and the whole point of it: whatever Vite
// hands back here is the prefix every other content URL shares.
const manifestUrls = import.meta.glob('./corpus-data/index/content-manifest.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

function baseUrl(): string | undefined {
	const url = Object.values(manifestUrls)[0];
	if (!url?.endsWith(MANIFEST_REL_PATH)) return undefined;
	return url.slice(0, url.length - MANIFEST_REL_PATH.length);
}

/** `relPath` -> dev URL, for every content file the sync wrote. Empty when no
 *  corpus has been synced, exactly as the built module is. */
export const contentUrlByRelPath: Record<string, string> = (() => {
	const base = baseUrl();
	const rows = Object.values(manifestRows)[0];
	if (!base || !rows) return {};
	return Object.fromEntries(rows.map((row) => [row.relPath, `${base}${row.relPath}`]));
})();
