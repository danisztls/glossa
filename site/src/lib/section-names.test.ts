/**
 * `section-names.json` is generated; this is what keeps it honest.
 *
 * The same arrangement, and the same reason, as `book-forms.test.ts`: a table
 * derived from another source and committed alongside it will fall behind the
 * day someone edits the source and forgets the export. Here the failure would
 * be especially quiet — the jump box would simply stop completing a section
 * under its new name in some languages, which nobody who reads only one
 * language can see.
 */

import { describe, expect, it } from 'vitest';

import { SECTION_KEYS, sectionNamesJson } from '../../scripts/export-section-names.mjs';
import { dictionaryFor, UI_LANGS } from './i18n.svelte';
import table from './section-names.json';

describe('section-names.json', () => {
	it('matches what the exporter would write today', async () => {
		const raw = await import('node:fs').then((fs) =>
			fs.readFileSync(new URL('./section-names.json', import.meta.url), 'utf8')
		);
		expect(raw).toBe(await sectionNamesJson());
	});

	it('covers every interface language', () => {
		for (const lang of UI_LANGS) {
			expect(Object.keys(table.names), lang).toContain(lang);
		}
	});

	/**
	 * The names are a COPY, and a copy that disagrees with its source is worse
	 * than no copy: the box would complete a word the page never prints.
	 */
	it('agrees with the dictionaries it was taken from', async () => {
		for (const lang of UI_LANGS) {
			const dictionary = await dictionaryFor(lang);
			const row: Record<string, string> = table.names[lang] ?? {};
			for (const key of SECTION_KEYS) {
				const stored = row[key];
				if (stored === undefined) {
					// Absent is legitimate — a dictionary need not be complete —
					// but only when the dictionary really has nothing to say.
					expect(dictionary[key]?.trim() || undefined, `${lang}: ${key}`).toBeUndefined();
				} else {
					expect(stored, `${lang}: ${key}`).toBe(dictionary[key]);
				}
			}
		}
	});

	/**
	 * `SECTION_KEYS` is a hand-written list in the exporter, and `SECTIONS` in
	 * `suggest.ts` is what actually reads it. A section added there with a new
	 * `titleKey` and not added here would be completable in the reader's own
	 * language and no other — working, and quietly worse.
	 */
	it('names every key the suggester reads', async () => {
		const source = await import('node:fs').then((fs) =>
			fs.readFileSync(new URL('./suggest.ts', import.meta.url), 'utf8')
		);
		const used = new Set<string>();
		for (const match of source.matchAll(/(?:titleKey|abbrevKey):\s*'([^']+)'/g)) {
			used.add(match[1]);
		}
		expect(used.size).toBeGreaterThan(0);
		for (const key of used) expect(SECTION_KEYS, key).toContain(key);
	});
});
