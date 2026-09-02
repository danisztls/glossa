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

export default defineConfig(({ command }) => ({
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
			// See `buildId` above for why this is not SvelteKit's default
			// timestamp, and why dropping either half of it breaks something.
			version: { name: buildId() },

			/*
			 * REGISTERED BY A BUILD, NEVER BY THE DEV SERVER, and the asymmetry
			 * is the point rather than a saving.
			 *
			 * SvelteKit injects `navigator.serviceWorker.register(...)` into the
			 * page it serves, and it did so in `vite dev` too — so an ordinary
			 * dev session installed the real worker against `localhost`. That
			 * worker is cache-first on the shell (`service-worker.ts`'s `fetch`)
			 * and deliberately does NOT call `skipWaiting()`, because a reader
			 * mid-chapter must not have assets swapped under an open tab. Both
			 * are right in production and both are wrong here: the consequence
			 * is a worker that keeps control until every tab on the origin
			 * closes, serving a shell captured from an earlier session.
			 *
			 * What that looked like was `Pre-transform error: The file does not
			 * exist at .../node_modules/.vite/deps/runtime-DcmRJ03G.js`, on
			 * repeat, surviving a `rm -rf node_modules/.vite` and every dev
			 * server restart — because nothing on the SERVER ever referenced
			 * that name. The cached shell did. The existing chunks were the same
			 * base names under different hashes (`runtime-DZSEjbWK.js`), which is
			 * the tell: a dep re-optimization had moved them and the old document
			 * was still asking for where they used to be.
			 *
			 * The real cost was never the log line. It is that a worker holding
			 * an old shell serves old CODE, so an edit can appear not to take —
			 * the silent stale answer this project keeps meeting, wearing the
			 * costume of a broken hot reload.
			 *
			 * `command` is the discriminator and it covers all three entry
			 * points: `vite dev` is `serve` and registers nothing; `vite build`
			 * is `build`, so `index.html` carries the registration and BOTH
			 * `npm run preview` and a deploy serve it. Preview is itself
			 * `serve`, which does not matter — it ships the document the build
			 * already wrote.
			 *
			 * A worker installed before this landed is not removed by it.
			 * Unregister those once, per browser profile.
			 */
			serviceWorker: command === 'build' ? { register: true } : { register: false },

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
}));
