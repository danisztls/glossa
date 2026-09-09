import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { HELP_GROUPS, HELP_SECTIONS, helpFor } from './help';
import { dictionaryFor } from './i18n.svelte';

const KEYS = [
	...HELP_SECTIONS.map((feature) => feature.key),
	...HELP_GROUPS.flatMap((group) => group.features.map((f) => f.key))
];

describe('helpFor', () => {
	it('keeps only the rows whose control is on the page', () => {
		const sheet = helpFor(new Set(['search', 'focus']));
		expect(sheet.sections.map((s) => s.key)).toEqual(['search']);
		expect(sheet.groups.map((g) => g.headingKey)).toEqual(['help.reading.heading']);
		expect(sheet.groups.flatMap((g) => g.features.map((f) => f.key))).toEqual(['focus']);
	});

	// A landing page has no reading bar, and a heading over an empty list is
	// the same false promise the guide made on `/schola`: it told a reader to
	// look for the compare button on a page that correctly does not have one.
	it('drops a group whose controls are all absent, heading and all', () => {
		expect(helpFor(new Set(['search'])).groups).toEqual([]);
		expect(helpFor(new Set()).groups).toEqual([]);
	});

	// A section is a control headed by its own name rather than by the bar it
	// stands on, so it is answered for apart from the groups — but it is still
	// the page that decides whether it is drawn.
	it('answers for a section only when the page carries its control', () => {
		expect(helpFor(new Set(['search'])).sections.map((s) => s.key)).toEqual(['search']);
		expect(helpFor(new Set(['offline'])).sections.map((s) => s.key)).toEqual(['offline']);
		expect(helpFor(new Set(['focus'])).sections).toEqual([]);
	});

	// The sheet reads an unordered set of attributes off the page. A reader who
	// opens it on two pages must meet one order.
	it('draws the rows in the module’s order and never the page’s', () => {
		const shuffled = new Set([...KEYS].reverse());
		const sheet = helpFor(shuffled);
		expect([
			...sheet.sections.map((s) => s.key),
			...sheet.groups.flatMap((g) => g.features.map((f) => f.key))
		]).toEqual(KEYS);
	});

	it('knows nothing about a key no section or group holds', () => {
		expect(helpFor(new Set(['bookmark', 'print']))).toEqual({ sections: [], groups: [] });
	});
});

/**
 * EVERY ROW IS DECLARED BY A CONTROL, AND EVERY CONTROL DECLARES A ROW, which
 * is the pairing `data-help` exists to make and the one nothing else checks.
 *
 * The failure in each direction is silent. A feature whose key no markup
 * carries is a sentence written in 37 languages that no reader can ever be
 * shown; an attribute whose key no group holds is a control that marked itself
 * for a sheet which will not draw it. Neither errors, neither fails
 * `svelte-check`, and both look exactly like a control that is simply not on
 * this page — which is the sheet's ordinary, correct behaviour.
 */
describe('the markup that declares the rows', () => {
	const SRC = path.join(process.cwd(), 'src');

	const walk = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) return walk(full);
			return /\.(svelte|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [full] : [];
		});

	const declared = new Set(
		walk(SRC).flatMap((file) =>
			[...readFileSync(file, 'utf8').matchAll(/data-help="([a-z-]+)"/g)].map((m) => m[1])
		)
	);

	it('marks a control for every row the guide can draw', () => {
		expect(
			KEYS.filter((key) => !declared.has(key)),
			'described, never marked'
		).toEqual([]);
	});

	it('draws a row for every control that marks itself', () => {
		expect(
			[...declared].filter((key) => !KEYS.includes(key)),
			'marked, never described'
		).toEqual([]);
	});
});

describe('the words each row is written from', () => {
	it('names every control by the key that control is labelled by', async () => {
		const en = await dictionaryFor('en');
		for (const group of HELP_GROUPS) {
			expect(en[group.headingKey], group.headingKey).toBeTruthy();
			for (const feature of group.features) {
				expect(en[feature.nameKey], feature.nameKey).toBeTruthy();
				expect(en[`help.feature.${feature.key}`], feature.key).toBeTruthy();
			}
		}
		for (const feature of HELP_SECTIONS) {
			expect(en[feature.nameKey], feature.nameKey).toBeTruthy();
			expect(en[`help.feature.${feature.key}`], feature.key).toBeTruthy();
		}
		expect(en['help.title']).toBeTruthy();
	});

	// The sentences moved out of `schola.*` with the section that held them.
	// A key left behind is one nobody would think to translate again.
	it('leaves no chrome sentence in the guide’s own namespace', async () => {
		const en = await dictionaryFor('en');
		expect(Object.keys(en).filter((k) => k.startsWith('schola.feature.'))).toEqual([]);
		expect(Object.keys(en).filter((k) => k.startsWith('schola.guide.'))).toEqual([]);
	});
});
