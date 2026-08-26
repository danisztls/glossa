import path from 'node:path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Absolute, build-time-baked path to src/lib/corpus-data/, read by
// corpus.ts's SSR content fetcher (see that file's docblock on why:
// SvelteKit's `load`-time fetch can't be used for large per-page reads
// without inlining the whole response into the prerendered page, so
// prerendering reads content files straight off disk instead). Computed
// here rather than from `import.meta.url` inside corpus.ts itself because
// Vite's SSR build bundles corpus.ts into a chunk whose OWN final location
// on disk isn't src/lib/ — `import.meta.url` there would resolve relative
// to the wrong directory. This file's location, by contrast, never moves.
const corpusDataDir = path.resolve(
	fileURLToPath(new URL('.', import.meta.url)),
	'src/lib/corpus-data'
);

export default defineConfig({
	define: {
		__CORPUS_DATA_DIR__: JSON.stringify(corpusDataDir)
	},
	build: {
		/*
		 * CORPUS DATA IS NEVER INLINED, whatever its size.
		 *
		 * `corpus-index.ts` globs the content tier with `query: '?url'` on the
		 * premise that Vite hands back a URL and emits the file as a separate,
		 * content-hashed, immutably-cached build asset. That premise is FALSE
		 * below `assetsInlineLimit` (4 KB by default): Vite base64s the file
		 * into a `data:` URI instead, and every layer downstream then quietly
		 * does the wrong thing —
		 *
		 *   - the bytes land in the boot chunk every route `modulepreload`s,
		 *     which is the exact cost the content tier exists to avoid;
		 *   - `sw-policy.ts`'s `contentPath` cannot make a pathname out of a
		 *     `data:` URI, so the file matches nothing in the partition and
		 *     belongs to no download wave;
		 *   - `fetch()`ing it works, so nothing errors.
		 *
		 * Found when the document outlines moved to the content tier
		 * (2026-08-26): 354 files averaging 1.2 KB, of which Vite emitted 29
		 * and inlined 325, and the boot chunk barely moved. 43 documents'
		 * `appendix.json` had been silently inlined the same way since the
		 * appendix tier shipped.
		 *
		 * `false` disables inlining for these paths; `undefined` leaves every
		 * other asset — icons, fonts, the odd small SVG — on Vite's default,
		 * where inlining is the right call.
		 */
		assetsInlineLimit: (filePath: string) =>
			filePath.includes('/corpus-data/') ? false : undefined
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Fully static SPA output. `index.html` is the one application shell;
			// `src/worker.ts` validates canonical reader URLs and serves that shell
			// only for routes present in the generated corpus manifest. See
			// docs/decisions.md for why a plain host-wide SPA fallback is not enough
			// for a citable reference site.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: 'index.html',
				precompress: false,
				strict: false
			}),
			prerender: {
				// The fallback is intentionally the only generated page. Route
				// completeness is checked against the corpus-generated route manifest
				// in the edge worker instead of by crawling thousands of HTML files.
				entries: []
			}
		})
	]
});
