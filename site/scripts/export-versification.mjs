/**
 * Write the versification divergence tables where the pipeline can read them:
 * `pipeline/scrapers/common/versification.json`.
 *
 * `src/lib/versification.ts` is the one implementation of Hebrew-to-Vulgate
 * conversion — its Python twin went with `pipeline/build/` on 2026-08-21, and
 * this export exists so that nothing is tempted to write another. Python
 * cannot import TypeScript, so the two TABLES are exported here as JSON —
 * generated and committed, never hand-edited — and `src/lib/versification.test.ts`
 * fails whenever the committed file falls behind. Run this after any change to
 * `LATE_MERGE` or `DIVERGENT_MAPPERS`:
 *
 *     node scripts/export-versification.mjs
 *
 * The wholesale mappers are deliberately NOT exported; see `VERSIFICATION_TABLE`.
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { VERSIFICATION_TABLE } from '../src/lib/versification.ts';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const VERSIFICATION_PATH = path.resolve(
	siteRoot,
	'../pipeline/scrapers/common/versification.json'
);

/** The JSON text, byte for byte — the test compares against this. */
export function versificationJson() {
	return (
		JSON.stringify(
			{
				generated_by:
					'site/scripts/export-versification.mjs — do not edit; see src/lib/versification.ts',
				...VERSIFICATION_TABLE
			},
			null,
			'\t'
		) + '\n'
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	writeFileSync(VERSIFICATION_PATH, versificationJson());
	console.log(`[export-versification] wrote ${VERSIFICATION_PATH}`);
}
