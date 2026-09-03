/**
 * Refuse to deploy a build that should not go out.
 *
 * `wrangler deploy` uploads whatever is sitting in `build/`. It cannot tell a
 * current build from a stale one, or a real build from a fixture build, and
 * there is no CI here — a deploy ships one person's working tree. This runs
 * between the build and the upload and checks the two things that would
 * otherwise be discovered by a reader.
 *
 * 1. FIXTURE BUILDS. `scripts/sync-corpus.mjs` warns and `process.exit(0)`s
 *    when it cannot find the corpus, so `corpus.ts` silently falls back to the
 *    bundled fixtures — two Bible books and a few dozen paragraphs — and the
 *    SPA build SUCCEEDS. That is the trap CLAUDE.md warns about, and it is
 *    worst from a git worktree, where `CORPUS_DIR`'s default `../corpus`
 *    resolves inside the worktree and finds nothing. A fixture deploy looks
 *    broken in a confusing way rather than an obvious one, which is precisely
 *    why it needs a corpus-generated manifest rather than a visual check.
 *
 * 2. THE CLOUDFLARE FILE CAP. A deployment may hold at most 20,000 files. Past
 *    it the upload fails — after several minutes of uploading — so this is
 *    worth knowing before the wait rather than after it.
 *
 * Deliberately checks the BUILD OUTPUT rather than the corpus directory: what
 * is about to be uploaded is the thing worth asserting about, and it stays
 * true no matter how the build was invoked.
 *
 * The old guard counted prerendered HTML pages. An SPA intentionally has one
 * of those, so `corpus-routes.json` now carries the independently meaningful
 * work/content-file counts emitted by the sync step.
 *
 * Takes an optional path argument so the guard itself can be tested against a
 * synthetic directory rather than only against whatever `build/` happens to
 * hold.
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareCoverage, readBaseline } from './reference-coverage.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = process.argv[2]
	? path.resolve(process.cwd(), process.argv[2])
	: path.join(siteRoot, 'build');

/** Cloudflare's hard limit on files in one deployment. */
const MAX_FILES = 20_000;

/**
 * Below these counts, the build is fixtures rather than the real corpus. They
 * are intentionally low floors, not a model of corpus growth: the current
 * corpus is hundreds of works and content files, while fixtures have none of
 * the generated route manifest at all.
 */
const MIN_WORKS = 100;
const MIN_CONTENT_ASSETS = 100;

/**
 * The boot payload: every `.js` file `index.html` asks for before it can paint.
 *
 * WHAT THIS GUARDS IS A CLASS OF MISTAKE THAT MAKES NO NOISE. Everything in the
 * index tier is reached by `import.meta.glob`, and the difference between a
 * file that ships as a fetched asset and one compiled into the boot chunk is
 * `query: '?url'` — one word, no error either way, and the symptom is only that
 * the site got slower for everyone. It has happened repeatedly: the document
 * outlines (414 KB), the xref tables (715 KB), and `content-manifest.json`,
 * which `corpus-assets.ts`'s docblock says must never be reached from a page
 * and which two later imports put in `nodes/0.js` anyway — 1.59 MB, unnoticed,
 * until the whole boot payload was measured on 2026-09-03 and came to 6.30 MB.
 *
 * A CEILING IN BYTES, NOT A RATIO OR A CHUNK COUNT. `build.chunkSizeWarningLimit`
 * fires per chunk and so says nothing about a payload split across twenty of
 * them, and it cannot tell a 1.3 MB chunk that is lazily fetched — as the
 * content URL map now is — from one every route parses before first paint. What
 * matters is the total a reader waits for, so that is what is measured.
 *
 * The limit is ~2.5x the current 0.47 MB: loose enough that ordinary feature
 * work never trips it, tight enough that re-inlining any one of the index files
 * does. Raise it deliberately, with a measurement, or not at all.
 */
const MAX_BOOT_JS_BYTES = 1_200_000;

function walk(dir) {
	let files = 0;
	let pages = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			const sub = walk(path.join(dir, entry.name));
			files += sub.files;
			pages += sub.pages;
		} else {
			files++;
			if (entry.name.endsWith('.html')) pages++;
		}
	}
	return { files, pages };
}

function fail(message) {
	console.error(`[preflight] REFUSING TO DEPLOY: ${message}`);
	process.exit(1);
}

if (!existsSync(buildDir)) {
	fail(`no build/ directory. Run \`npm run build\` first.`);
}

const { files, pages } = walk(buildDir);

console.log(
	`[preflight] ${files.toLocaleString()} files, ${pages.toLocaleString()} HTML shell(s) ` +
		`(${Math.round((files / MAX_FILES) * 100)}% of Cloudflare's ${MAX_FILES.toLocaleString()}-file cap)`
);

// Absent for either of two reasons, and the second is why the message names
// both: the sync found no corpus and said so, or it FAILED partway. It clears
// this file in the same breath as it wipes `corpus-data/` and writes it back
// only on the way through, so a manifest that is missing means no run has
// completed over what is on disk — which is exactly the build that must not be
// uploaded, and the one that used to arrive here carrying the previous run's
// manifest. See the clearing in `sync-corpus.mjs` for the failure that found it.
const routesPath = path.join(buildDir, 'corpus-routes.json');
if (!existsSync(routesPath)) {
	fail(
		'missing corpus-routes.json — no sync has completed over this tree. Either the corpus ' +
			'was not found (set CORPUS_DIR to a real glossa-corpus checkout) or the sync failed ' +
			'partway; re-run `npm run sync-corpus`, read what it refuses, and rebuild.'
	);
}

let routes;
try {
	routes = JSON.parse(
		await import('node:fs/promises').then(({ readFile }) => readFile(routesPath, 'utf8'))
	);
} catch (error) {
	fail(
		`could not read corpus-routes.json: ${error instanceof Error ? error.message : String(error)}`
	);
}

if (routes.workCount < MIN_WORKS || routes.contentAssetCount < MIN_CONTENT_ASSETS) {
	fail(
		`corpus-routes.json reports ${routes.workCount ?? '?'} work(s) and ${routes.contentAssetCount ?? '?'} ` +
			`content file(s) — this looks like fixtures, not the real corpus. Set CORPUS_DIR and rebuild.`
	);
}

// 3. REFERENCE COVERAGE. The sync measured how much of the corpus's citation
//    apparatus the grammar reads and shipped the report with the build; a
//    family that lost links against the committed baseline is a grammar
//    regression nobody would otherwise see until a reader did. See
//    `reference-coverage.mjs`; `npm run coverage:accept` records an intended
//    drop.
const coveragePath = path.join(buildDir, 'reference-coverage.json');
if (!existsSync(coveragePath)) {
	fail('missing reference-coverage.json — the build predates the coverage report. Rebuild.');
}
const baseline = readBaseline();
if (!baseline) {
	fail('no scripts/reference-coverage.baseline.json — run `npm run coverage:accept` after a sync.');
}
const regressions = compareCoverage(JSON.parse(readFileSync(coveragePath, 'utf8')), baseline);
if (regressions.length > 0) {
	fail(
		`reference coverage dropped below the baseline:\n` +
			regressions.map((r) => `  ${r}`).join('\n') +
			`\n  Fix the grammar, or \`npm run coverage:accept\` if the drop is intended.`
	);
}

if (files > MAX_FILES) {
	fail(
		`${files.toLocaleString()} files exceeds Cloudflare's ${MAX_FILES.toLocaleString()}-file cap. ` +
			`See docs/decisions.md §The site for which routes to collapse and what it costs.`
	);
}

// 3. THE CRAWLER-FACING FILES. Both are generated (sitemap.xml by the corpus
//    sync, security.txt by its own prebuild step) and both are gitignored, so
//    neither can be spotted missing by reading the tree. A build made with a
//    prebuild step that did not run ships without them and looks entirely
//    normal; what breaks is discovery and a disclosure route, neither of which
//    surfaces as an error anyone here would see.
const sitemapPath = path.join(buildDir, 'sitemap.xml');
if (!existsSync(sitemapPath)) {
	fail('missing sitemap.xml — the build predates the sitemap, or prebuild did not run. Rebuild.');
}

// A sitemap that lost its dates is not a broken build in any visible way — it
// is a smaller file that still validates, still lists every address, and tells
// every crawler nothing about what changed. The corpus addresses all carry a
// date; only the handful of static pages do not (scripts/lastmod.mjs), so
// anything below a large majority means the ledger did not reach this build.
{
	const xml = readFileSync(sitemapPath, 'utf8');
	const urls = (xml.match(/<url>/g) ?? []).length;
	const dated = (xml.match(/<lastmod>/g) ?? []).length;
	if (urls > 0 && dated / urls < 0.9) {
		fail(
			`sitemap.xml carries <lastmod> on ${dated} of ${urls} URLs — the lastmod ledger did not ` +
				`reach this build. Check scripts/lastmod.json is present, then rebuild.`
		);
	}
}

const securityTxtPath = path.join(buildDir, '.well-known/security.txt');
if (!existsSync(securityTxtPath)) {
	fail(
		'missing .well-known/security.txt — run `npm run security-txt`, or rebuild so prebuild does.'
	);
}

// RFC 9116 §2.5.5: past `Expires`, the file is to be disregarded. It rolls
// forward on every build, so an expired one here means the file in `build/`
// is over a year stale — i.e. this is not the build the prebuild step wrote.
const expires = /^Expires:\s*(\S+)$/m.exec(readFileSync(securityTxtPath, 'utf8'))?.[1];
const expiresAt = expires ? Date.parse(expires) : NaN;
if (Number.isNaN(expiresAt)) {
	fail(`security.txt has no parseable Expires field (RFC 9116 requires one). Rebuild.`);
} else if (expiresAt <= Date.now()) {
	fail(`security.txt expired at ${expires}, so it is stale build output. Rebuild.`);
}

/**
 * Measured off `index.html` rather than off a chunk listing, because that file
 * IS the definition: the SPA shell is what every address is served, so what it
 * asks for before it can render is what every reader waits for. `modulepreload`
 * and `<script src>` alike — both are fetched and parsed on the critical path.
 */
const shellPath = path.join(buildDir, 'index.html');
if (existsSync(shellPath)) {
	const shell = readFileSync(shellPath, 'utf8');
	const referenced = [...shell.matchAll(/(?:href|src)="([^"]+\.js)"/g)].map((m) => m[1]);
	let bootBytes = 0;
	const missing = [];
	for (const href of new Set(referenced)) {
		const file = path.join(buildDir, href.replace(/^\//, ''));
		if (!existsSync(file)) {
			missing.push(href);
			continue;
		}
		bootBytes += statSync(file).size;
	}
	if (missing.length > 0) {
		fail(
			`index.html references ${missing.length} missing script(s): ${missing.slice(0, 3).join(', ')}`
		);
	}
	if (bootBytes > MAX_BOOT_JS_BYTES) {
		fail(
			`boot payload is ${(bootBytes / 1e6).toFixed(2)} MB of JavaScript, over the ` +
				`${(MAX_BOOT_JS_BYTES / 1e6).toFixed(2)} MB ceiling. Something that should be fetched ` +
				`is being inlined into the boot chunk — check for an \`import.meta.glob\` over ` +
				`corpus-data/ that lost its \`query: '?url'\`, or a new static import of ` +
				`corpus-assets.ts (see MAX_BOOT_JS_BYTES above).`
		);
	}
	console.log(`[preflight] boot payload ${(bootBytes / 1e6).toFixed(2)} MB of JS`);
}

console.log('[preflight] ok');
