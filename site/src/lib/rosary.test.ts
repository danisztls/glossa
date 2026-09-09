import { describe, expect, it } from 'vitest';
import { mysteryName, slotted, weekdayName, weekdayOn } from './rosary';

/** The rotation the Holy Rosary micro-site prints, as `PrayerGroupEntry.days`
 *  stores it: joyful, luminous, sorrowful, glorious. */
const ROTATION: Record<number, number[]> = {
	1: [1, 6],
	2: [4],
	3: [2, 5],
	4: [3, 7]
};

const setFor = (iso: number) =>
	Number(Object.keys(ROTATION).find((k) => ROTATION[+k].includes(iso)));

describe('weekdayOn', () => {
	it('answers the day itself at no offset', () => {
		for (let iso = 1; iso <= 7; iso++) expect(weekdayOn(iso, 0)).toBe(iso);
	});

	it('wraps forward off the end of the week', () => {
		expect(weekdayOn(7, 1)).toBe(1);
		expect(weekdayOn(6, 2)).toBe(1);
	});

	/** JavaScript's `%` keeps the sign of its left operand, so this is the
	 *  half a naive modulo gets wrong — and it gets it wrong by answering 0
	 *  or a negative, which `days.includes` matches on no set at all. */
	it('wraps backward off the start of the week', () => {
		expect(weekdayOn(1, -1)).toBe(7);
		// A week and a day back from Monday is the Sunday before it.
		expect(weekdayOn(1, -8)).toBe(7);
		expect(weekdayOn(1, -9)).toBe(6);
		for (let iso = 1; iso <= 7; iso++) {
			for (let offset = -21; offset <= 21; offset++) {
				const day = weekdayOn(iso, offset);
				expect(day).toBeGreaterThanOrEqual(1);
				expect(day).toBeLessThanOrEqual(7);
			}
		}
	});

	it('is a week-long cycle', () => {
		for (let iso = 1; iso <= 7; iso++) {
			expect(weekdayOn(iso, 7)).toBe(iso);
			expect(weekdayOn(iso, -7)).toBe(iso);
		}
	});

	/**
	 * The control's own promise: every step lands on a different set of
	 * mysteries, so pressing a button never looks like it did nothing. It
	 * holds for all seven days in both directions, which is why the component
	 * steps by DAY rather than by set.
	 */
	it('changes the set of mysteries on every single step', () => {
		for (let iso = 1; iso <= 7; iso++) {
			expect(setFor(weekdayOn(iso, 1))).not.toBe(setFor(iso));
			expect(setFor(weekdayOn(iso, -1))).not.toBe(setFor(iso));
		}
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
