/**
 * The content-tier inventory: every corpus file this build emitted, with its
 * hashed URL, its byte size, its work, its kind and its language.
 *
 * A MODULE OF ITS OWN BECAUSE ONLY THE SERVICE WORKER READS IT. This lived in
 * `corpus-index.ts` until 2026-08-25, which meant `content-manifest.json` —
 * 248 KB raw, one row per content file — was inlined into the boot chunk that
 * every page in the site `modulepreload`s, to be read by nothing that runs on
 * a page. Alongside it went a second full copy of the relPath→URL map, built
 * so `listContentAssets()` need not rescan the glob.
 *
 * `src/service-worker.ts` is its own bundle entry, so importing this from
 * there and nowhere else is what actually keeps it out of the app.
 *
 * The relPath→URL glob it used to keep here — a deliberate duplicate of
 * `corpus-index.ts`'s, on the argument that duplicating a map of strings across
 * two bundles that never load together costs nothing — moved to
 * `content-urls.ts` on 2026-08-26. The argument was true of the BUILD and false
 * of the dev server, where an eager glob is one module request per matched file
 * and two globs over 2,590 files exhausted the browser's connection pool before
 * the app could boot. Importing the map from a module that is only the map keeps
 * the original objection satisfied: what could not happen was importing it from
 * `corpus-index.ts` and dragging the whole boot index in here with it.
 *
 * See `sw-policy.ts` for what the worker does with this: partition the build
 * into cache tiers, and order the library into per-language download waves.
 */

import { contentUrlByRelPath } from './content-urls';
import { plateUrl } from './plate-urls';

/** Where a plate image's `relPath` starts — `sync-corpus.mjs`'s `PLATES_DIR`,
 *  and the one prefix in the manifest that is not `content/`. */
const PLATES_PREFIX = 'plates/';

/** One row of `content-manifest.json`, as `scripts/sync-corpus.mjs` writes it. */
export interface ContentManifestEntry {
	workId: string;
	/** Must match the `kind` literals `sync-corpus.mjs` pushes onto
	 *  `contentManifest`. Nothing enforces that across the language boundary
	 *  and the two have drifted before (`corpus-index.ts`'s union listed
	 *  `document-sections` while the sync wrote `document-chunk`), so
	 *  `sw-policy.test.ts` reads the kinds back out of the sync script and
	 *  asserts every one of them lands in a download wave. */
	kind:
		| 'bible-chapters'
		| 'bible-intros'
		| 'ccc-chunk'
		| 'commentary-chapters'
		| 'compendium-chunk'
		| 'document-appendix'
		| 'document-chunk'
		| 'document-structure'
		| 'plate-image'
		| 'plates'
		| 'prayer-collection'
		| 'social-doctrine-appendix'
		| 'social-doctrine-chunk'
		| 'social-doctrine-structure'
		| 'summa-question';
	relPath: string;
	bytes: number;
	/** The language the work DECLARES, copied from its manifest rather than
	 *  parsed out of the work id — see `sync-corpus.mjs`, where the decoration
	 *  happens and why guessing it is wrong. */
	lang: string;
	/** How often the rest of the corpus cites this work; 0 for everything that
	 *  is not a document. The download order's one popularity signal. */
	citedBy: number;
}

export interface ContentAsset extends ContentManifestEntry {
	/** The hashed build-asset URL, as Vite's `?url` reports it. */
	url: string;
}

const realContentManifest = import.meta.glob('./corpus-data/index/content-manifest.json', {
	eager: true,
	import: 'default'
}) as Record<string, ContentManifestEntry[]>;

/**
 * The full per-file inventory. Empty when no corpus has been synced — there is
 * nothing to fetch, and the worker's partition then holds no content tier at
 * all, which is the correct answer rather than a degraded one.
 */
export function listContentAssets(): ContentAsset[] {
	const manifest = Object.values(realContentManifest)[0];
	if (!manifest) return [];

	const out: ContentAsset[] = [];
	for (const entry of manifest) {
		const url = urlFor(entry.relPath);
		if (url) out.push({ ...entry, url });
	}
	return out;
}

/**
 * A manifest row's hashed URL, from whichever of the two globs owns it.
 *
 * TWO GLOBS AND NOT ONE, deliberately. Doré's 482 plate images are in the
 * manifest so the library panel can price them (`sync-corpus.mjs`'s
 * `syncPlates`), but their URLs stay in `plate-urls.ts`: that module is
 * imported by `Plate.svelte`, which is a Bible-route chunk, while
 * `content-urls.ts` is imported by `corpus-index.ts`, which is the boot
 * chunk. Widening the content glob to `plates/*.avif` would put 482 hashed
 * URLs into the module every page loads, to be read by the two places that
 * already have them.
 */
function urlFor(relPath: string): string | undefined {
	if (relPath.startsWith(PLATES_PREFIX)) return plateUrl(relPath.slice(PLATES_PREFIX.length));
	return contentUrlByRelPath[relPath];
}
