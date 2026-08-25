/**
 * Write the grammar's book-abbreviation tables where the pipeline can read
 * them: `pipeline/scrapers/common/book_forms.json`.
 *
 * `src/lib/refs-grammar.ts` is the one home of every surface form a citation
 * may spell a book with, and the Portuguese Catechism scraper needs the same
 * list to tell a Scripture locator from an ordinary parenthesis. Python
 * cannot import TypeScript, so the table is exported here as JSON — generated
 * and committed, never hand-edited — and `src/lib/book-forms.test.ts` fails
 * whenever the committed file falls behind the table. Run this after any
 * change to `BOOK_VARIANTS_EN`/`BOOK_VARIANTS_PT`:
 *
 *     node scripts/export-book-forms.mjs
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOK_FORMS } from '../src/lib/refs-grammar.ts';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BOOK_FORMS_PATH = path.resolve(
	siteRoot,
	'../pipeline/scrapers/common/book_forms.json'
);

/** The JSON text, byte for byte — the test compares against this. */
export function bookFormsJson() {
	return (
		JSON.stringify(
			{
				generated_by:
					'site/scripts/export-book-forms.mjs — do not edit; see src/lib/refs-grammar.ts',
				...BOOK_FORMS
			},
			null,
			'\t'
		) + '\n'
	);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	writeFileSync(BOOK_FORMS_PATH, bookFormsJson());
	console.log(`[export-book-forms] wrote ${BOOK_FORMS_PATH}`);
}
