import { describe, expect, it } from 'vitest';
import { mysteryName, slotted, WEEK_FROM_SUNDAY, weekdayInitial, weekdayName } from './rosary';

/** The rotation the Holy Rosary micro-site prints, as `PrayerGroupEntry.days`
 *  stores it: joyful, luminous, sorrowful, glorious. */
const ROTATION: Record<number, number[]> = {
	1: [1, 6],
	2: [4],
	3: [2, 5],
	4: [3, 7]
};

describe('WEEK_FROM_SUNDAY', () => {
	it('is the seven ISO weekdays, each once', () => {
		expect([...WEEK_FROM_SUNDAY].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	/** Sunday is 7 in ISO and first here — the one thing about this constant
	 *  that a reader of the numbers alone would get backwards. */
	it('opens on Sunday and closes on Saturday', () => {
		expect(WEEK_FROM_SUNDAY[0]).toBe(7);
		expect(WEEK_FROM_SUNDAY[6]).toBe(6);
		expect(WEEK_FROM_SUNDAY.map((iso) => weekdayName(iso, 'en'))).toEqual([
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday'
		]);
	});

	/** Every day of the week has mysteries appointed to it, so no button on the
	 *  strip can select a day with nothing under it. */
	it('covers every day the rotation appoints a set to', () => {
		for (const iso of WEEK_FROM_SUNDAY) {
			expect(Object.values(ROTATION).some((days) => days.includes(iso))).toBe(true);
		}
	});
});

describe('weekdayInitial', () => {
	it('is the narrow form, in the reader’s own language', () => {
		expect(WEEK_FROM_SUNDAY.map((iso) => weekdayInitial(iso, 'en'))).toEqual([
			'S',
			'M',
			'T',
			'W',
			'T',
			'F',
			'S'
		]);
	});

	/** The reason every button carries `weekdayName` as its accessible name:
	 *  the visible letters are ambiguous by design, in English and elsewhere. */
	it('repeats itself, which is why it is never the accessible name', () => {
		const en = WEEK_FROM_SUNDAY.map((iso) => weekdayInitial(iso, 'en'));
		expect(new Set(en).size).toBeLessThan(en.length);
	});

	it('falls back rather than failing for a language Intl cannot answer for', () => {
		expect(weekdayInitial(1, 'la')).toBeTruthy();
	});
});

describe('weekdayName', () => {
	/** The reference week is 1 January 2024 onward, and that day was a Monday.
	 *  An off-by-one here would name every day wrong by one and look entirely
	 *  plausible doing it. */
	it('names the ISO week in order, in English', () => {
		expect([1, 2, 3, 4, 5, 6, 7].map((iso) => weekdayName(iso, 'en'))).toEqual([
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
			'Sunday'
		]);
	});

	it('answers in the reader’s own language', () => {
		expect(weekdayName(1, 'pt')).toBe('segunda-feira');
		expect(weekdayName(7, 'fr')).toBe('dimanche');
	});

	/** `dateLocale` asks `supportedLocalesOf` and falls back to `en-US`, which
	 *  is what Latin needs — the point being that it answers a weekday rather
	 *  than throwing or emitting a tag. */
	it('falls back rather than failing for a language Intl cannot answer for', () => {
		expect(weekdayName(1, 'la')).toBeTruthy();
	});
});

describe('mysteryName', () => {
	it('drops the ordinal and the set the heading already names', () => {
		expect(mysteryName('First Joyful Mystery: The Annunciation')).toBe('The Annunciation');
		expect(
			mysteryName('Quinto Misterio Gozoso: El Niño Jesús perdido y hallado en el Templo')
		).toBe('El Niño Jesús perdido y hallado en el Templo');
		expect(mysteryName('Das erste freudenreiche Geheimnis: Die Verkündigung.')).toBe(
			'Die Verkündigung.'
		);
	});

	it('leaves a title alone where the edition printed no prefix', () => {
		// Romanian and Swedish come from the Compendium's appendix, which names
		// the mysteries and never their position.
		expect(mysteryName('Vestea îngerului adusă Mariei.')).toBe('Vestea îngerului adusă Mariei.');
		expect(mysteryName('Jesus bebådas av ängeln')).toBe('Jesus bebådas av ängeln');
	});

	it('keeps the whole title rather than returning nothing', () => {
		expect(mysteryName('First Joyful Mystery:')).toBe('First Joyful Mystery:');
		expect(mysteryName('First Joyful Mystery:   ')).toBe('First Joyful Mystery:   ');
	});

	it('cuts at the FIRST colon, so a name carrying one keeps it', () => {
		expect(mysteryName('First Joyful Mystery: He said: come')).toBe('He said: come');
	});
});

describe('slotted', () => {
	it('cuts a sentence at its placeholders and keeps the rest whole', () => {
		expect(slotted('Say the {0} and the prayer after it.')).toEqual([
			{ text: 'Say the ' },
			{ slot: 0 },
			{ text: ' and the prayer after it.' }
		]);
	});

	it('reads the index rather than the order, so a translation may reorder', () => {
		expect(slotted('{1} kommt vor {0}.')).toEqual([
			{ slot: 1 },
			{ text: ' kommt vor ' },
			{ slot: 0 },
			{ text: '.' }
		]);
	});

	it('is the whole string where a language needed no name in it', () => {
		expect(slotted('Say the prayers at the foot of this page.')).toEqual([
			{ text: 'Say the prayers at the foot of this page.' }
		]);
		expect(slotted('')).toEqual([]);
	});

	it('emits no empty run for a placeholder at either end', () => {
		expect(slotted('{0} first')).toEqual([{ slot: 0 }, { text: ' first' }]);
		expect(slotted('last {0}')).toEqual([{ text: 'last ' }, { slot: 0 }]);
		expect(slotted('{0}')).toEqual([{ slot: 0 }]);
	});

	it('leaves a brace that is not a placeholder alone', () => {
		expect(slotted('a {x} b')).toEqual([{ text: 'a {x} b' }]);
	});
});
