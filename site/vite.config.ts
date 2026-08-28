import path from 'node:path';
import { fileURLToPath } from 'node:url';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

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

/**
 * In `vite dev` only, resolve each `?url` glob module to its dev twin —
 * `./content-urls` and `./plate-urls`.
 *
 * The real module is one eager `import.meta.glob` over the content tier, which
 * a build folds into a chunk of strings and the dev server expands into 2,590
 * separate module requests — past what a browser will open, so the app's own
 * module graph tears and the page 500s. The dev twin derives the same map from
 * `content-manifest.json` in one request; its docblock argues why that is
 * equivalent rather than approximate.
 *
 * A plugin rather than a `resolve.alias` entry, and matching the RELATIVE
 * specifier rather than `$lib/content-urls`. Both details are load-bearing and
 * both were got wrong first: `vite:alias` is itself an `enforce: 'pre'` plugin
 * and runs ahead of every other one, so a `$lib/...` specifier is already an
 * absolute path by the time a hook here could see it — the substitution simply
 * never happened, silently, and dev still asked for 2,590 modules. `vite:alias`
 * does not touch relative specifiers, so this hook is genuinely first for them.
 *
 * `apply: 'serve'` is what makes "never in a build" a fact rather than an
 * intention; the consumers import the relative specifier and get the real
 * module everywhere else, with no plugin involved.
 */
function devContentUrls(): Plugin {
	const lib = (name: string) =>
		path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/lib', name);

	// Specifier -> [dev twin, the modules allowed to import it]. The importer
	// list is not ceremony: it is what stops an unrelated `./content-urls`
	// somewhere else in the tree from being silently captured.
	const substitutions = new Map<string, [string, readonly string[]]>([
		['./content-urls', [lib('content-urls.dev.ts'), ['corpus-index.ts', 'corpus-assets.ts']]],
		// The plates' 482 images, on the same terms and for the same reason —
		// see `plate-urls.dev.ts`.
		['./plate-urls', [lib('plate-urls.dev.ts'), ['plate-src.ts']]]
	]);

	return {
		name: 'glossa:dev-content-urls',
		apply: 'serve',
		enforce: 'pre',
		resolveId(source, importer) {
			const found = substitutions.get(source);
			if (!found || !importer) return null;
			const [devModule, importers] = found;
			return importers.some((name) => importer.endsWith(name)) ? devModule : null;
		}
	};
}

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
		devContentUrls(),
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
