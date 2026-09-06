/**
 * The transcribed name tables, checked for the things transcription can break.
 *
 * What it cannot check is whether a name is RIGHT: these were read off the
 * calendars `oracle.test.ts` checks against, so asking that oracle about them
 * would be asking a source to confirm itself (`names.svelte.ts`, §The two
 * things these are not). What is checkable is that every table talks about
 * celebrations this calendar actually has, in a language nothing else already
 * answers for, that the fallback chain still prefers what `grc.ts` says — and,
 * for the formulaic half, that every pattern fills. A pattern that cannot fill
 * has no symptom on a page: `celebrationName` falls through to English, and
 * English is what a language with no table shows anyway.
 */

import { describe, expect, it } from 'vitest';
import { celebrationName, getYear, liturgicalYearOf, toDayNumber } from './index';
import { GRC } from './grc';
import {
	NAMED_LANGS,
	ensureCelebrationNames,
	residentCelebrationName,
	residentTemporalName
} from './names.svelte';
import type { Celebration, NameForm, TemporalNames } from './types';

const tables = import.meta.glob<Record<string, unknown>>('./names/*.ts', { eager: true });

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

/** Every celebration the calendar can put in front of a reader, over enough
 *  years for the ones that do not occur annually — the Second Sunday after the
 *  Nativity is absent whenever Epiphany takes its Sunday. */
const CELEBRATIONS = new Map<string, Celebration>();
for (const year of YEARS) {
	for (const day of getYear(year).values()) {
		for (const c of [day.celebration, ...day.optional]) CELEBRATIONS.set(c.id, c);
	}
}
for (const day of GRC.values()) for (const c of day) CELEBRATIONS.set(c.id, c);

const langOf = (path: string) => path.slice('./names/'.length, -'.ts'.length);
const recordOf = (path: string) => tables[path][langOf(path)] as Record<string, string>;
const temporalOf = (path: string) => tables[path][`${langOf(path)}Temporal`] as TemporalNames;

const forms = (t: TemporalNames): NameForm[] => [
	...Object.values(t.sunday),
	...Object.values(t.weekday),
	t.holyWeek,
	t.afterAshes,
	t.afterEpiphany,
	t.christmasWeekday,
	t.easterOctave,
	t.christmasOctave
];

describe('the name tables', () => {
	it('is one module per language, each exporting its own tag twice', () => {
		for (const path of Object.keys(tables)) {
			const lang = langOf(path);
			expect(Object.keys(tables[path]).sort(), path).toEqual([lang, `${lang}Temporal`].sort());
		}
		expect(NAMED_LANGS).toEqual(Object.keys(tables).map(langOf).sort());
	});

	it('names only celebrations the Calendar has', () => {
		for (const path of Object.keys(tables)) {
			const strangers = Object.keys(recordOf(path)).filter((id) => !CELEBRATIONS.has(id));
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
		expect(residentTemporalName('it', { kind: 'holy-week', dow: 1 })).toBeUndefined();
	});

	it('answers once it is', async () => {
		await ensureCelebrationNames('it');
		expect(residentCelebrationName('it', 'timothy-titus')).toBe('Santi Timoteo e Tito, vescovi');
		// A regional tag is the language's table, not a miss.
		expect(residentCelebrationName('it-CH', 'timothy-titus')).toBe('Santi Timoteo e Tito, vescovi');
		expect(residentTemporalName('it-CH', { kind: 'holy-week', dow: 1 })).toBe('Lunedì Santo');
	});
});

describe('the formulaic tables', () => {
	// A slot the tables cannot answer for is a name that never composes, and
	// the failure is silent — English is what a miss shows either way.
	it('names only slots it can fill', () => {
		for (const path of Object.keys(tables)) {
			const t = temporalOf(path);
			for (const form of forms(t)) {
				const spec = typeof form === 'string' ? { form } : form;
				const slots = [...spec.form.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
				expect(slots.length, `${path} ${spec.form}`).toBeGreaterThan(0);
				for (const slot of slots) expect(['day', 'week', 'nth'], path).toContain(slot);
			}
		}
	});

	// Two weeks that read alike is how a feed's typo survives the solve —
	// GCatholic's Lithuanian numbers the sixth and seventh weeks of Easter `II`.
	it('spells no two weekdays or weeks alike', () => {
		for (const path of Object.keys(tables)) {
			const t = temporalOf(path);
			for (const table of [t.days, t.weeks, t.octave]) {
				const values = Object.values(table);
				expect(new Set(values).size, `${path} ${values.join()}`).toBe(values.length);
			}
		}
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

	it('composes the days named by rule', async () => {
		await ensureCelebrationNames('it');
		const name = (iso: string) => {
			const n = toDayNumber(...(iso.split('-').map(Number) as [number, number, number]));
			return celebrationName(getYear(liturgicalYearOf(n)).get(n)!.celebration, 'it');
		};
		expect(name('2026-06-16')).toBe('Martedì della XI settimana del Tempo Ordinario');
		expect(name('2026-03-30')).toBe('Lunedì Santo');
		expect(name('2026-02-19')).toBe('Giovedì dopo le Ceneri');
		expect(name('2026-04-07')).toBe('Martedì fra l’Ottava di Pasqua');
		expect(name('2026-12-19')).toBe('19 dicembre');
		expect(name('2025-12-29')).toBe('V giorno fra l’Ottava di Natale');
		expect(name('2026-05-17')).toBe('VII Domenica di Pasqua');
	});

	// Every day of three years, in every language with a table: a name either
	// composes whole or is not offered. A half-filled pattern would print its
	// own placeholder, and only a reader of that language would ever see it.
	it('never leaves a placeholder in a name', async () => {
		for (const lang of NAMED_LANGS) await ensureCelebrationNames(lang);
		const misses = new Map<string, number>();
		for (const lang of NAMED_LANGS) {
			for (const year of [2025, 2026, 2027]) {
				for (const day of getYear(year).values()) {
					const name = celebrationName(day.celebration, lang);
					expect(name, `${lang} ${day.date}`).not.toContain('{');
					if (day.celebration.parts && name === day.celebration.names.en) {
						misses.set(lang, (misses.get(lang) ?? 0) + 1);
					}
				}
			}
		}
		// Exactly the four languages whose own files say why, and no others:
		// each numbers its Sundays differently from its weekdays, so nothing
		// could be carried across to a week three years of feeds never showed.
		// A fifth language here is a table that stopped composing, which is
		// invisible on the page — English is what a miss shows either way.
		expect([...misses.keys()].sort()).toEqual(['hr', 'mt', 'nl', 'sv']);
		expect(Math.max(...misses.values())).toBeLessThan(20);
	});
});
