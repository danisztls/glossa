#!/usr/bin/env node
/**
 * Syncs `corpus/works/` (+ `corpus/xrefs/`, if present) from the corpus
 * repo location into a site-local, gitignored data directory that
 * `src/lib/corpus.ts` reads at build time via `import.meta.glob`. See
 * site/README.md ("Corpus data") for the full contract.
 *
 * Runs automatically before `npm run build` / `npm run dev` (see the
 * `prebuild` / `predev` npm scripts) — not before `npm test`, so vitest
 * always exercises the bundled fixtures regardless of whether a corpus
 * checkout is present.
 *
 * Configurable via the `CORPUS_DIR` env var (default: `../corpus`,
 * resolved relative to this `site/` package — i.e. the `corpus/` dir
 * documented in docs/corpus-schema.md, a sibling of `site/`).
 *
 * If no corpus is found, this is a no-op (with a warning): `corpus.ts`
 * falls back to its bundled fixtures, so the site still builds.
 */

import { existsSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const siteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const corpusDir = path.resolve(siteRoot, process.env.CORPUS_DIR ?? '../corpus');
const destDir = path.join(siteRoot, 'src/lib/corpus-data');

function countFiles(dir) {
	if (!existsSync(dir)) return 0;
	let n = 0;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) n += countFiles(p);
		else n += 1;
	}
	return n;
}

rmSync(destDir, { recursive: true, force: true });

const worksSrc = path.join(corpusDir, 'works');
const xrefsSrc = path.join(corpusDir, 'xrefs');

if (!existsSync(worksSrc)) {
	console.warn(
		`[sync-corpus] No corpus found at ${worksSrc} -- corpus.ts will fall back to its bundled ` +
			`fixtures. Set CORPUS_DIR to point at a real corpus/ checkout to build with real data.`
	);
	process.exit(0);
}

cpSync(worksSrc, path.join(destDir, 'works'), { recursive: true });

let xrefsSynced = false;
if (existsSync(xrefsSrc)) {
	cpSync(xrefsSrc, path.join(destDir, 'xrefs'), { recursive: true });
	xrefsSynced = true;
}

const works = readdirSync(path.join(destDir, 'works'), { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.sort();

console.log(
	`[sync-corpus] Synced ${works.length} work(s) from ${worksSrc} ` +
		`(${countFiles(path.join(destDir, 'works'))} files)${xrefsSynced ? ', plus xrefs/' : ''}: ` +
		works.join(', ')
);
