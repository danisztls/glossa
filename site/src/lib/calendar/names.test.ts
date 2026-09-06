/**
 * The transcribed name tables, checked for the things transcription can break.
 *
 * What it cannot check is whether a name is RIGHT: these were read off the
 * calendars `oracle.test.ts` checks against, so asking that oracle about them
 * would be asking a source to confirm itself (`names.svelte.ts`, §The two
 * things these are not). What is checkable is that every table talks about
 * celebrations this calendar actually has, in a language nothing else already
 * answers for, and that the fallback chain still prefers what `grc.ts` says.
 */

import { describe, expect, it } from 'vitest';
import { celebrationName } from './index';
import { GRC } from './grc';
import { NAMED_LANGS, ensureCelebrationNames, residentCelebrationName } from './names.svelte';

const tables = import.meta.glob<Record<string, Record<string, string>>>('./names/*.ts', {
	eager: true
});

/** Every id the General Roman Calendar fixes, including the two it does not
 *  fix on a date — `ALL_SOULS` and the Saturday memorial are not in `GRC`. */
const GRC_IDS = new Set([...GRC.values()].flatMap((day) => day.map((c) => c.id)));

describe('the name tables', () => {
	it('is one module per language, each exporting its own tag', () => {
		for (const [path, module] of Object.entries(tables)) {
			const lang = path.slice('./names/'.length, -'.ts'.length);
			expect(Object.keys(module), path).toEqual([lang]);
		}
		expect(NAMED_LANGS).toEqual(
			Object.keys(tables)
				.map((p) => p.slice(8, -3))
				.sort()
		);
	});

	it('names only celebrations the Calendar has', () => {
		for (const [path, module] of Object.entries(tables)) {
			const lang = path.slice('./names/'.length, -'.ts'.length);
			const strangers = Object.keys(module[lang]).filter((id) => !GRC_IDS.has(id));
			expect(strangers, path).toEqual([]);
		}
	});

	// A table for one of these would be dead weight: `ROWS` carries all three
	// for every celebration, and `celebrationName` reads it first.
	it('holds no language `grc.ts` already carries', () => {
		expect(NAMED_LANGS).not.toContain('la');
		expect(NAMED_LANGS).not.toContain('en');
		expect(NAMED_LANGS).not.toContain('pt');
	});

	it('says nothing until its language is asked for', () => {
		expect(residentCelebrationName('it', 'timothy-titus')).toBeUndefined();
	});

	it('answers once it is', async () => {
		await ensureCelebrationNames('it');
		expect(residentCelebrationName('it', 'timothy-titus')).toBe('Santi Timoteo e Tito, vescovi');
		// A regional tag is the language's table, not a miss.
		expect(residentCelebrationName('it-CH', 'timothy-titus')).toBe('Santi Timoteo e Tito, vescovi');
	});
});

describe('celebrationName over a resident table', () => {
	const timothy = [...(GRC.get('01-26') ?? [])][0];

	it('answers in the reader’s language', async () => {
		await ensureCelebrationNames('de');
		expect(celebrationName(timothy, 'de')).toBe('Hl. Timotheus und hl. Titus, Bischöfe');
	});

	it('falls back to English for a language with no table', () => {
		expect(celebrationName(timothy, 'sw')).toBe(timothy.names.en);
	});

	it('falls back to English for a celebration the table omits', async () => {
		await ensureCelebrationNames('pl');
		const george = [...(GRC.get('04-23') ?? [])][0];
		// Poland keeps Adalbert on 23 April, so its edition never prints George.
		expect(residentCelebrationName('pl', george.id)).toBeUndefined();
		expect(celebrationName(george, 'pl')).toBe(george.names.en);
	});

	// `ROWS` is the Missal's wording and the tables are GCatholic's; where the
	// two both answer, the one this project stands behind is the one served.
	it('prefers what grc.ts says over the transcription', async () => {
		await ensureCelebrationNames('it');
		expect(celebrationName(timothy, 'en')).toBe('Saints Timothy and Titus, Bishops');
		expect(celebrationName(timothy, 'la')).toBe('Ss. Timothei et Titi, episcoporum');
	});
});
