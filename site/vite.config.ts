import { execFileSync } from 'node:child_process';
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
 * The build id, and the only place it is decided.
 *
 * It becomes `kit.version.name`, which is three things at once: the suffix of
 * the shell cache (`glossa-shell-${version}` in `src/service-worker.ts`), the
 * string `usage.ts` stores to tell an update that LANDED from one merely
 * offered again, and — since 2026-08-28 — the line printed in the site footer,
 * which is why it is legible rather than SvelteKit's default `Date.now()`.
 *
 * BOTH HALVES ARE LOAD-BEARING, in opposite directions:
 *
 *   - The minute makes it unique. A deploy ships one person's working tree
 *     (CLAUDE.md, "Deploying"), so two builds from one commit are the normal
 *     case, not an edge one. Were the sha alone the name, the second build
 *     would inherit the first's shell cache and its `activate` sweep would
 *     keep rather than drop it — an update that never announces itself and
 *     never arrives, which is exactly the failure the footer line exists to
 *     make visible.
 *   - The sha makes it mean something. `2026-08-28.1432` says when; only
 *     `f49a3c1` says what, and `-dirty` says the tree held changes that sha
 *     does not describe.
 *
 * Sorted lexically it sorts chronologically, which is the whole reason the
 * date leads.
 *
 * No git (a source tarball, a CI checkout without history) is not an error:
 * the minute alone still satisfies the uniqueness the cache name needs, and
 * `nogit` says why the rest is missing rather than leaving a gap to guess at.
 *
 * THE ENVIRONMENT VARIABLE IS NOT A CONVENIENCE. One `vite build` evaluates
 * this file FOUR times in four processes — the client pass, the server pass,
 * and SvelteKit's `analyse` and `prerender` steps — so a freshly computed
 * minute disagrees with itself across a minute boundary, and the first build
 * that proved this shipped `…1735…` in the service worker's cache name and
 * `…1736…` in `version.json` and the footer. One build, two identities: the
 * footer would then be reporting a build the shell cache had never heard of,
 * which is worse than no footer line at all.
 *
 * The first pass to get here decides and writes the answer into the
 * environment; every process spawned after inherits it. Exporting it by hand
 * is therefore also how a caller pins the id — a reproducible build, or a
 * rebuild that deliberately means to reuse a shell cache.
 */
const BUILD_ID_ENV = 'GLOSSA_BUILD_ID';

function buildId(): string {
	const inherited = process.env[BUILD_ID_ENV];
	if (inherited) return inherited;
	const id = computeBuildId();
	process.env[BUILD_ID_ENV] = id;
	return id;
}

function computeBuildId(): string {
	const iso = new Date().toISOString();
	const stamp = `${iso.slice(0, 10)}.${iso.slice(11, 13)}${iso.slice(14, 16)}`;
	const git = (...args: string[]): string =>
		execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
	try {
		const sha = git('rev-parse', '--short=7', 'HEAD');
		const dirty = git('status', '--porcelain') !== '';
		return `${stamp}-${sha}${dirty ? '-dirty' : ''}`;
	} catch {
		return `${stamp}-nogit`;
	}
}

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

/**
 * In `vite dev` only, resolve the service worker to `service-worker.dev.ts` —
 * a worker whose whole job is to uninstall the real one and drop its caches.
 *
 * WHY THE REAL WORKER CANNOT RUN HERE is argued in the dev twin's own
 * docblock: both premises its caching rests on (content-hashed URLs, a
 * `version` that turns over per deploy) are false against the dev server, so
 * it pins corpus bytes to an unhashed path permanently and serves `/` itself
 * cache-first out of a per-dev-server-process cache. Everything the person
 * editing this site sees of that is "my change did not appear" and "restarting
 * the server fixed it".
 *
 * SUBSTITUTING THE MODULE RATHER THAN SUPPRESSING THE REGISTRATION is the
 * point. `kit.serviceWorker.register: false` under `command === 'serve'` was
 * the first answer (2026-09-01, reverted 2026-09-02): it cannot evict a worker
 * a browser has already installed, so it helps exactly the profiles that never
 * had the problem, and it makes dev and production take different registration
 * paths. This changes what is registered and nothing else.
 *
 * Matching the SPECIFIER rather than an importer, unlike `glossa:dev-content-
 * urls` above: SvelteKit's dev shim is generated markup, not a module in this
 * tree, and it imports the worker by absolute `/@fs/` path — so the file is
 * the only thing there is to recognise, and one file is the whole rule.
 * `apply: 'serve'` is what keeps this out of a build, where the real worker is
 * the one that ships.
 */
function devServiceWorker(): Plugin {
	const src = (name: string) =>
		path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src', name);
	const real = src('service-worker.ts');
	const twin = src('service-worker.dev.ts');

	return {
		name: 'glossa:dev-service-worker',
		apply: 'serve',
		enforce: 'pre',
		resolveId(source) {
			const specifier = source.split('?', 1)[0];
			const file = specifier.startsWith('/@fs/') ? specifier.slice('/@fs'.length) : specifier;
			return file === real ? twin : null;
		}
	};
}

export default defineConfig({
	define: {
		__CORPUS_DATA_DIR__: JSON.stringify(corpusDataDir)
	},
	server: {
		watch: {
			/*
			 * THE CORPUS IS INSIDE `src/`, AND A BUILD DELETES ALL OF IT.
			 *
			 * `sync-corpus.mjs` opens by removing every entry under
			 * `src/lib/corpus-data/` and writing it back over ~13s, and
			 * `prebuild` runs it in FULL on purpose (a deploy always derives
			 * from scratch — see CLAUDE.md, "Running the site"). So the ordinary
			 * two-terminal habit — `npm run dev` in one, `npm run build` in the
			 * other — hands the dev server an unlink storm across thousands of
			 * files that its own module graph is built on: `corpus-index.ts`
			 * globs `corpus-data/index/` eagerly and `content-urls.dev.ts`
			 * imports `content-manifest.json` the same way.
			 *
			 * Unignored, Vite invalidates those modules and full-reloads the
			 * page INTO the half-written corpus. Every index glob comes back
			 * empty, `listBibleWorks()` returns `[]`, and
			 * `scriptura/[book]/[chapter]/+page.ts` answers a perfectly valid
			 * chapter with `error(404)` — "Nothing at this address", at every
			 * address, until the dev server is restarted. That is the failure
			 * this ignore exists for, and it long predates the index tier
			 * becoming lazy (2026-09-03).
			 *
			 * Ignoring the directory costs nothing that was ever promised:
			 * CLAUDE.md already states that `npm run dev` does not re-derive the
			 * corpus and that picking up a re-sync means restarting it. The
			 * eager globs are resolved at transform time either way; this only
			 * decides whether a DELETION mid-flight is allowed to tear the page.
			 *
			 * It is not the whole answer, and is not meant to be. The six
			 * derived files under `static/` are wiped in the same breath and are
			 * still watched, so a reload can still land mid-sync. What makes
			 * that survivable rather than terminal is `retryable-once.ts`: a
			 * failed index fetch is no longer memoised, so the retry that
			 * `LoadFailed` offers actually re-fetches.
			 */
			ignored: ['**/src/lib/corpus-data/**']
		}
	},
	optimizeDeps: {
		/*
		 * EVERY DEPENDENCY REACHED ONLY BY A DYNAMIC IMPORT BELONGS HERE, and
		 * this list is not an optimization — it is what keeps the dev server
		 * from swapping its own dep cache out from under a page that is still
		 * loading.
		 *
		 * Vite's scanner walks the module graph from the HTML entry to find
		 * what to pre-bundle. It does not find `fuzzysort`, which `JumpBox`
		 * loads as `await import('fuzzysort')` — deliberately, since it is
		 * 7.5 KB the layout should not pay for (see that component). So the
		 * dep is discovered LATE, on first render rather than at startup:
		 * Vite pre-bundles it then, rewrites `node_modules/.vite/deps/` under
		 * fresh hashes, and forces a reload. Requests already in flight for
		 * the old names 404, which surfaces as a repeating
		 *
		 *   Pre-transform error: The file does not exist at
		 *   .../node_modules/.vite/deps/<name>-<hash>.js
		 *
		 * and against this graph — 411 modules, 18.78 MB, most of it inline
		 * sourcemap (site/docs/dev-loop.md) — the reload is slow enough
		 * to tear the module graph rather than merely delay it. The page ends
		 * up in a state no reload fixes.
		 *
		 * That error string was once read as a service worker serving a stale
		 * shell, and `vite dev` was stopped from registering one; it fixed
		 * nothing and was reverted (§Process, 2026-09-02). The cache being
		 * swapped is the SERVER'S. To check this list is still complete:
		 * `rm -rf node_modules/.vite`, load one page, and confirm the log
		 * shows neither `dependency optimized:` nor `optimized dependencies
		 * changed. reloading`.
		 */
		include: ['fuzzysort']
	},
	build: {
		/*
		 * THE PER-CHUNK WARNING CANNOT ASK THE QUESTION THAT MATTERS HERE, which
		 * is not "is any chunk large" but "how much does a reader parse before
		 * the page paints". Two chunks are deliberately far over the 500 kB
		 * default and neither is in the boot payload: the content tier's
		 * relPath->URL map (~1.34 MB, `await import()`ed by `corpus-index.ts`
		 * when the first content read needs it) and `content-manifest.json`
		 * (~1.59 MB, the service worker's own bundle). Both are inventories of a
		 * ~9,700-file corpus, so they are large because the corpus is, and they
		 * compress to a fraction of that over the wire.
		 *
		 * Left at the default, the warning fired on every build for two chunks
		 * that are correct, which is how a warning stops being read.
		 *
		 * THIS SILENCES THE APP BUILD AND NOT THE SERVICE WORKER'S, for the same
		 * reason `assetsInlineLimit` below does not reach it: SvelteKit compiles
		 * `service-worker.ts` in a Vite build of its own with `configFile: false`
		 * and forwards five options, of which this is not one. So the worker's
		 * bundle still reports its `content-manifest.json` on every build. Left
		 * as is deliberately — there is no config surface to set it from, and the
		 * one warning that remains names the one chunk whose size is worth
		 * re-reading as the corpus grows.
		 *
		 * The real guard is `scripts/preflight-deploy.mjs`'s `MAX_BOOT_JS_BYTES`: it
		 * measures what `index.html` actually asks for before first paint —
		 * 0.47 MB as of 2026-09-03, down from 6.30 MB — and REFUSES THE DEPLOY
		 * over the ceiling, which is a stronger promise than a line of build log.
		 * This number only decides when Vite mentions a chunk in passing.
		 */
		chunkSizeWarningLimit: 1_700,
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
		 *
		 * THIS DOES NOT REACH THE SERVICE WORKER, and believing it did cost a
		 * shelf that could never finish downloading (2026-09-03). SvelteKit
		 * compiles `service-worker.ts` in a Vite build of its own with
		 * `configFile: false`, forwarding `modulePreload`, `rollupOptions`,
		 * `outDir`, `emptyOutDir` and `minify` and nothing else — so the
		 * bundle whose entire job is to fetch corpus files had 1,656 of them
		 * base64'd into it while the app bundle, guarded here, had none.
		 * `content-urls.ts` and `plate-urls.ts` therefore say `no-inline` on
		 * the import itself, which no config forwarding can drop, and
		 * `scripts/audit-inlined-corpus.mjs` fails the build if either guard
		 * comes undone. Keep this one anyway: it covers `corpus-index.ts`'s
		 * globs and anything else under `corpus-data/` that a future module
		 * reaches for.
		 */
		assetsInlineLimit: (filePath: string) =>
			filePath.includes('/corpus-data/') ? false : undefined
	},
	plugins: [
		devContentUrls(),
		devServiceWorker(),
		sveltekit({
			// See `buildId` above for why this is not SvelteKit's default
			// timestamp, and why dropping either half of it breaks something.
			version: { name: buildId() },
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
