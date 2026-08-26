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
 * there and nowhere else is what actually keeps it out of the app. The glob
 * below duplicates the one in `corpus-index.ts` on purpose: Vite emits each
 * content file once regardless, and the duplicated thing is a map of strings
 * in a bundle the page never loads. The alternative — exporting the map from
 * `corpus-index.ts` — would pull the whole boot index into the service worker
 * instead, which is the same mistake pointed the other way.
 *
 * See `sw-policy.ts` for what the worker does with this: partition the build
 * into cache tiers, and order the library into per-language download waves.
 */

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
		| 'compendium-chunk'
		| 'document-appendix'
		| 'document-chunk'
		| 'document-structure'
		| 'prayer-collection'
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

const realContentUrls = import.meta.glob('./corpus-data/content/**/*.json', {
	eager: true,
	query: '?url',
	import: 'default'
}) as Record<string, string>;

/**
 * The full per-file inventory. Empty when no corpus has been synced — there is
 * nothing to fetch, and the worker's partition then holds no content tier at
 * all, which is the correct answer rather than a degraded one.
 */
export function listContentAssets(): ContentAsset[] {
	const manifest = Object.values(realContentManifest)[0];
	if (!manifest) return [];

	const urlByRelPath: Record<string, string> = {};
	for (const [globPath, url] of Object.entries(realContentUrls)) {
		urlByRelPath[globPath.replace(/^\.\/corpus-data\//, '')] = url;
	}

	const out: ContentAsset[] = [];
	for (const entry of manifest) {
		const url = urlByRelPath[entry.relPath];
		if (url) out.push({ ...entry, url });
	}
	return out;
}
