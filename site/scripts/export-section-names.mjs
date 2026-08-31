/**
 * Write the jump box's section names, in every interface language, to
 * `src/lib/section-names.json`.
 *
 * THE JUMP BOX COMPLETES A SECTION IN ANY INTERFACE LANGUAGE, not just the
 * reader's: typing `Bibbia` finds `/scriptura` from an English interface, and
 * `Katekesen` finds `/catechismus`. `suggest.ts` built that index by reading
 * every dictionary at module scope, which is a fine way to spend nothing when
 * the dictionaries are already in the boot chunk and an expensive one now that
 * they are not (2026-08-31 — see `i18n.svelte.ts`). One `import` of
 * `dictionaryFor` in a module the layout loads would have pulled all of them
 * back in and silently undone the split.
 *
 * So the eight keys it actually needs are extracted here instead — generated
 * and committed, never hand-edited, exactly like `export-book-forms.mjs` — and
 * `src/lib/section-names.test.ts` fails whenever the committed file falls
 * behind the dictionaries. Run this after changing any `nav.*` or `*.abbrev`
 * string, or after adding an interface language:
 *
 *     node scripts/export-section-names.mjs
 *
 * It is ~8 short strings per language against a dictionary's ~270, so the
 * whole table is a few KB and stays eager without apology.
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { UI_LANGS } from '../src/lib/ui-langs.ts';
import { readDictionaries } from './route-titles.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SECTION_NAMES_PATH = path.resolve(siteRoot, 'src/lib/section-names.json');

/**
 * The keys `suggest.ts`'s `SECTIONS` reads for every language.
 *
 * Kept in step with that table by `section-names.test.ts`, which reads
 * `SECTIONS` itself rather than trusting this list — a section added there
 * with a new `titleKey` and not added here would otherwise be completable in
 * the reader's language only, which is precisely the kind of quiet
 * half-working the split is meant not to introduce.
 */
export const SECTION_KEYS = [
	'nav.bible',
	'nav.ccc',
	'ccc.abbrev',
	'nav.compendium',
	'compendium.abbrev',
	'nav.magisterium',
	'nav.prayers',
	'nav.summa'
];

/** `{ [lang]: { [key]: name } }`, omitting keys a dictionary does not define. */
export async function sectionNames() {
	const dictionaries = await readDictionaries();
	const out = {};
	for (const lang of UI_LANGS) {
		const dictionary = dictionaries[lang] ?? {};
		const row = {};
		for (const key of SECTION_KEYS) {
			const value = dictionary[key];
			// A dictionary need not be complete (`t()` falls back to English
			// key by key), so a missing name is normal and is simply not a
			// surface the box completes in that language.
			if (typeof value === 'string' && value.trim()) row[key] = value;
		}
		out[lang] = row;
	}
	return out;
}

/** The JSON text, byte for byte — the test compares against this. */
export async function sectionNamesJson() {
	return (
		JSON.stringify(
			{
				generated_by: 'site/scripts/export-section-names.mjs — do not edit; see src/lib/i18n/*.ts',
				names: await sectionNames()
			},
			null,
			'\t'
		) + '\n'
	);
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const json = await sectionNamesJson();
	writeFileSync(SECTION_NAMES_PATH, json);
	console.log(`wrote ${SECTION_NAMES_PATH} (${UI_LANGS.length} languages)`);
}
