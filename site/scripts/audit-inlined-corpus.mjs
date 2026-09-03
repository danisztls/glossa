/**
 * Refuse a build that base64'd corpus data into a bundle.
 *
 * THE WHOLE POINT OF THE CONTENT TIER is that a corpus file is a separate,
 * content-hashed, immutably-cached build asset that something FETCHES. Below
 * Vite's `assetsInlineLimit` (4 KB) a `?url` import returns a `data:` URI
 * instead, the bytes land in whichever bundle did the import, and every layer
 * downstream does the wrong thing without raising anything:
 *
 *   - `sw-policy.ts`'s `contentPath` makes a "pathname" out of the base64
 *     payload, so the file matches nothing in the partition;
 *   - `cacheAssets` fetches that and gets a 404, which it swallows by design
 *     (a non-ok response is never stored);
 *   - the real emitted asset then falls OUT of `contentUrls` and into the
 *     versioned shell precache, so every reader downloads it at install and
 *     loses it on the next deploy;
 *   - and the offline-library panel, which prices from the app bundle, shows
 *     a shelf that can never finish — `27.1 / 27.2 MB`, with a Download
 *     button that does nothing.
 *
 * IT HAS HAPPENED TWICE, and the second time is why this script exists.
 * `vite.config.ts`'s `assetsInlineLimit` closed it for the app bundle in
 * 2026-08-26. It did not close it for the SERVICE WORKER, which SvelteKit
 * compiles in a Vite build of its own with `configFile: false`, forwarding
 * `modulePreload`, `rollupOptions`, `outDir`, `emptyOutDir` and `minify` and
 * nothing else (`@sveltejs/kit/src/exports/vite/build/build_service_worker.js`).
 * 1,656 files were inlined there, in the one bundle whose entire job is to
 * fetch them. The fix is `no-inline` on the imports themselves
 * (`content-urls.ts`, `plate-urls.ts`); this is what says so next time.
 *
 * WHY A BUILD STEP AND NOT A TEST. Nothing about this is visible before the
 * bundler runs: vitest sees source, `svelte-check` sees types, and the
 * symptom reaches a reader as a number that is quietly wrong. The check is
 * one grep over the built JS and belongs where the build can fail on it.
 *
 * Takes an optional build directory so it can be run against a synthetic one.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = process.argv[2]
	? path.resolve(process.cwd(), process.argv[2])
	: path.join(siteRoot, 'build');

/**
 * The media types the corpus ships as, and nothing else.
 *
 * A small inlined SVG or an icon font is Vite's default behaviour and the
 * right call — this is not a rule against inlining, it is a rule about the
 * content tier. Every corpus file is one of these two: JSON for the text,
 * AVIF for Doré's plates.
 */
const CORPUS_MEDIA = ['data:application/json', 'data:image/avif'];

/** Every `.js` in the build, at any depth — the service worker sits at the
 *  root and the app's chunks under `_app/immutable/`. */
function scripts(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const full = path.join(dir, name);
		if (statSync(full).isDirectory()) out.push(...scripts(full));
		else if (name.endsWith('.js') || name.endsWith('.mjs')) out.push(full);
	}
	return out;
}

const offenders = [];
for (const file of scripts(buildDir)) {
	const source = readFileSync(file, 'utf8');
	for (const prefix of CORPUS_MEDIA) {
		let count = 0;
		let at = source.indexOf(prefix);
		while (at !== -1) {
			count += 1;
			at = source.indexOf(prefix, at + prefix.length);
		}
		if (count > 0) offenders.push({ file: path.relative(buildDir, file), prefix, count });
	}
}

if (offenders.length === 0) {
	console.log('inlined corpus audit: clean');
	process.exit(0);
}

console.error('\nBuild refused: corpus data was inlined into a bundle.\n');
for (const { file, prefix, count } of offenders) {
	console.error(`  ${file}: ${count} × ${prefix}`);
}
console.error(
	'\nA `data:` URI is not a file anything can fetch, cache or count. Add' +
		'\n`no-inline` to the `?url` glob that produced it — and note that' +
		"\n`vite.config.ts`'s assetsInlineLimit does NOT reach the service-worker" +
		'\nbuild. See scripts/audit-inlined-corpus.mjs for the full failure chain.\n'
);
process.exit(1);
