import { describe, expect, it } from 'vitest';
import { UI_LANGS } from './i18n.svelte';
import {
	MAX_BODY_BYTES,
	SCALARS,
	SCHEMA_VERSION,
	SETS,
	UI_TAGS,
	bucketAge,
	bucketBehind,
	bucketDays28,
	bucketMinutes,
	bucketRefs,
	bucketVisits,
	validatePayload
} from './usage-schema';

/** A payload that must always validate, so each rejection test below can
 *  change exactly one thing and attribute the failure to it. */
function good(): Record<string, unknown> {
	return {
		v: SCHEMA_VERSION,
		days28: '4-7',
		visits: '3-5',
		age: '8-30d',
		mode: 'app',
		device: 'phone',
		minutes: '5-15',
		entry: 'deep',
		ui: 'pt',
		compare: 0,
		offline: 1,
		refs: '3-10',
		jump: 'hit',
		library: 'partial',
		behind: '0',
		work: ['ccc.pt', 'bible.cpdv.en'],
		content: ['pt', 'la'],
		section: ['catechismus', 'scriptura'],
		refKind: ['scripture']
	};
}

describe('vocabularies', () => {
	it('keeps UI_TAGS equal to the interface languages', () => {
		// The worker validates `ui` without importing the i18n store, whose
		// fourteen dictionaries it has no use for. This is what keeps the copy
		// honest — the same arrangement app.html's copy of UI_LANGS has.
		expect([...UI_TAGS].sort()).toEqual([...UI_LANGS].sort());
	});

	it('lists the content languages as a deliberate literal', () => {
		// NOT derived from UI_LANGS. The two sets have equalized and separated
		// four times (CLAUDE.md, "Work that spans languages"), and deriving one
		// from the other is the specific mistake that document warns against.
		// Adding a content language should mean editing this line on purpose.
		expect([...SETS.content].sort()).toEqual(
			[
				'ar',
				'de',
				'en',
				'es',
				'fr',
				'hu',
				'it',
				'la',
				'mg',
				'pl',
				'pt',
				'ro',
				'ru',
				'sl',
				'sv'
			].sort()
		);
	});

	it('gives every scalar a non-empty vocabulary', () => {
		for (const [field, list] of Object.entries(SCALARS)) {
			expect(list.length, field).toBeGreaterThan(0);
			expect(new Set(list).size, field).toBe(list.length);
		}
	});
});

describe('bucketing', () => {
	it('never leaves its own vocabulary', () => {
		for (let d = 0; d <= 40; d += 1) expect(SCALARS.days28).toContain(bucketDays28(d));
		for (let v = 0; v <= 300; v += 1) expect(SCALARS.visits).toContain(bucketVisits(v));
		for (let a = 0; a <= 400; a += 1) expect(SCALARS.age).toContain(bucketAge(a));
		for (let r = 0; r <= 60; r += 1) expect(SCALARS.refs).toContain(bucketRefs(r));
		for (let b = 0; b <= 30; b += 1) expect(SCALARS.behind).toContain(bucketBehind(b));
		for (let m = 0; m <= 90 * 60_000; m += 30_000) {
			expect(SCALARS.minutes).toContain(bucketMinutes(m));
		}
	});

	it('puts the boundaries where the labels say', () => {
		expect(bucketDays28(1)).toBe('1');
		expect(bucketDays28(2)).toBe('2-3');
		expect(bucketDays28(28)).toBe('15-28');
		expect(bucketVisits(1)).toBe('1');
		expect(bucketVisits(2)).toBe('2');
		expect(bucketVisits(100)).toBe('21-100');
		expect(bucketVisits(101)).toBe('100+');
		expect(bucketAge(0)).toBe('new');
		expect(bucketAge(7)).toBe('1-7d');
		expect(bucketAge(91)).toBe('90d+');
		expect(bucketRefs(0)).toBe('0');
		expect(bucketRefs(2)).toBe('1-2');
		expect(bucketRefs(11)).toBe('10+');
		expect(bucketMinutes(0)).toBe('<1');
		expect(bucketMinutes(59_999)).toBe('<1');
		expect(bucketMinutes(60_000)).toBe('1-5');
		expect(bucketMinutes(60 * 60_000)).toBe('60+');
	});
});

describe('validatePayload', () => {
	it('accepts a well-formed payload', () => {
		expect(validatePayload(good())).toMatchObject({ ui: 'pt', work: ['ccc.pt', 'bible.cpdv.en'] });
	});

	it('rejects a body that is not an object', () => {
		for (const raw of [null, undefined, 'x', 3, []]) expect(validatePayload(raw)).toBeUndefined();
	});

	it('rejects an unknown schema version', () => {
		// The case this exists for: an installed PWA running a superseded shell
		// for weeks, which should stop writing rather than write rows the
		// current schema would misread.
		expect(validatePayload({ ...good(), v: SCHEMA_VERSION + 1 })).toBeUndefined();
		expect(validatePayload({ ...good(), v: undefined })).toBeUndefined();
	});

	it('rejects a value outside a scalar vocabulary', () => {
		expect(validatePayload({ ...good(), minutes: '7' })).toBeUndefined();
		expect(validatePayload({ ...good(), mode: 'kiosk' })).toBeUndefined();
		expect(validatePayload({ ...good(), device: '<script>' })).toBeUndefined();
	});

	it('rejects a missing required scalar but allows an absent optional one', () => {
		const withoutLibrary = good();
		delete withoutLibrary.library;
		expect(validatePayload(withoutLibrary)).toBeUndefined();

		const withoutSwFail = good();
		expect(validatePayload(withoutSwFail)).toBeDefined();
		expect(validatePayload({ ...good(), swFail: 'quota' })).toMatchObject({ swFail: 'quota' });
		expect(validatePayload({ ...good(), swFail: 'exploded' })).toBeUndefined();
	});

	it('rejects an interface language it does not know', () => {
		expect(validatePayload({ ...good(), ui: 'mg' })).toBeUndefined();
		expect(validatePayload({ ...good(), ui: 'tlh' })).toBeUndefined();
	});

	it('requires the flags to be exactly 0 or 1', () => {
		expect(validatePayload({ ...good(), compare: true })).toBeUndefined();
		expect(validatePayload({ ...good(), offline: 2 })).toBeUndefined();
	});

	it('bounds and shapes the identifier fields', () => {
		expect(validatePayload({ ...good(), missBook: 'Sir' })).toBeUndefined();
		expect(validatePayload({ ...good(), missBook: 'sir' })).toMatchObject({ missBook: 'sir' });
		expect(validatePayload({ ...good(), work: ['a'.repeat(200)] })).toBeUndefined();
		expect(validatePayload({ ...good(), work: ['ccc.pt; drop table'] })).toBeUndefined();
		expect(validatePayload({ ...good(), work: Array(21).fill('ccc.pt') })).toBeUndefined();
	});

	it('rejects a set member outside its vocabulary', () => {
		expect(validatePayload({ ...good(), section: ['bible'] })).toBeUndefined();
		expect(validatePayload({ ...good(), refKind: ['footnote'] })).toBeUndefined();
		expect(validatePayload({ ...good(), content: ['tlh'] })).toBeUndefined();
		expect(validatePayload({ ...good(), work: 'ccc.pt' })).toBeUndefined();
	});

	it('deduplicates set fields rather than trusting the sender', () => {
		// One row per session per value; a payload repeating a work twenty
		// times would otherwise count it twenty times in the works report.
		const result = validatePayload({ ...good(), work: ['ccc.pt', 'ccc.pt', 'ccc.pt'] });
		expect(result?.work).toEqual(['ccc.pt']);
	});

	it('keeps the body cap small enough to refuse before parsing', () => {
		expect(MAX_BODY_BYTES).toBeLessThanOrEqual(4096);
		expect(JSON.stringify(good()).length).toBeLessThan(MAX_BODY_BYTES);
	});
});
