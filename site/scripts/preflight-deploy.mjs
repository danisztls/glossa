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
 *    build SUCCEEDS. That is the trap CLAUDE.md warns about, and it is worst
 *    from a git worktree, where `CORPUS_DIR`'s default `../corpus` resolves
 *    inside the worktree and finds nothing. A fixture deploy looks broken in a
 *    confusing way rather than an obvious one, which is precisely why it needs
 *    catching by a number rather than by eye.
 *
 * 2. THE CLOUDFLARE FILE CAP. A deployment may hold at most 20,000 files. Past
 *    it the upload fails — after several minutes of uploading — so this is
 *    worth knowing before the wait rather than after it.
 *
 * Deliberately checks the BUILD OUTPUT rather than the corpus directory: what
 * is about to be uploaded is the thing worth asserting about, and it stays
 * true no matter how the build was invoked.
 *
 * ON (1) BEING BELT AND BRACES TODAY: a fixture build currently does not even
 * finish — `strict: true` prerendering dies on `404 /compendium/11 (linked
 * from /compendium)`, because the fixtures are deliberately partial and one of
 * their own links has nowhere to land. So today the build failing is what
 * stands between a worktree and a fixture deploy, and this check never fires.
 * It is here because that protection is incidental rather than designed: it
 * holds only while the fixtures happen to contain an internally inconsistent
 * link, and the day someone makes them consistent — a reasonable thing to
 * want — the build starts succeeding and emitting a few dozen pages instead.
 *
 * Takes an optional path argument so the guard itself can be tested against a
 * synthetic directory rather than only against whatever `build/` happens to
 * hold.
 */
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = process.argv[2]
	? path.resolve(process.cwd(), process.argv[2])
	: path.join(siteRoot, 'build');

/** Cloudflare's hard limit on files in one deployment. */
const MAX_FILES = 20_000;

/**
 * Below this many prerendered pages, the build is fixtures rather than the
 * corpus. The gap either side is enormous — a real build emits ~5,100 pages,
 * the fixtures a few dozen — so this is a floor, not a tuned threshold, and it
 * needs no maintenance as the corpus grows.
 */
const MIN_PAGES = 1_000;

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
	`[preflight] ${files.toLocaleString()} files, ${pages.toLocaleString()} prerendered pages ` +
		`(${Math.round((files / MAX_FILES) * 100)}% of Cloudflare's ${MAX_FILES.toLocaleString()}-file cap)`
);

if (pages < MIN_PAGES) {
	fail(
		`only ${pages.toLocaleString()} prerendered pages — this looks like a FIXTURE build, not the ` +
			`corpus. Set CORPUS_DIR to a real corpus/ checkout and rebuild. From a git worktree this is ` +
			`the expected failure: the default ../corpus resolves inside the worktree, where there is none.`
	);
}

if (files > MAX_FILES) {
	fail(
		`${files.toLocaleString()} files exceeds Cloudflare's ${MAX_FILES.toLocaleString()}-file cap. ` +
			`See docs/decisions.md (2026-08-17) for which routes to collapse and what it costs.`
	);
}

console.log('[preflight] ok');
