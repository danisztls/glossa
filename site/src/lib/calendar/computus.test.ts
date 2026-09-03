import { describe, expect, it } from 'vitest';
import {
	FRIDAY,
	SATURDAY,
	SUNDAY,
	THURSDAY,
	after,
	before,
	easter,
	formatIsoDate,
	fromDayNumber,
	onOrAfter,
	onOrBefore,
	parseIsoDate,
	toDayNumber,
	weekday
} from './computus';

const iso = (n: number) => formatIsoDate(n);

describe('day numbers', () => {
	it('round-trips a civil date', () => {
		expect(fromDayNumber(toDayNumber(2026, 4, 5))).toEqual({ year: 2026, month: 4, day: 5 });
		expect(iso(toDayNumber(1582, 10, 15))).toBe('1582-10-15');
	});

	it('counts the epoch from 1 January 1970', () => {
		expect(toDayNumber(1970, 1, 1)).toBe(0);
		expect(toDayNumber(1970, 1, 2)).toBe(1);
		expect(toDayNumber(1969, 12, 31)).toBe(-1);
	});

	/* Adding days is the operation the whole liturgical year is built from,
	   so the leap-day and year boundaries are asserted rather than assumed. */
	it('adds days across February and across a year', () => {
		expect(iso(toDayNumber(2024, 2, 28) + 1)).toBe('2024-02-29');
		expect(iso(toDayNumber(2026, 2, 28) + 1)).toBe('2026-03-01');
		expect(iso(toDayNumber(2025, 12, 31) + 1)).toBe('2026-01-01');
	});

	/* 2100 is divisible by 4 and is NOT a leap year, which is the one case a
	   naive leap rule gets wrong. `Date.UTC` knows; this pins it. */
	it('is right about the Gregorian century rule', () => {
		expect(iso(toDayNumber(2100, 2, 28) + 1)).toBe('2100-03-01');
		expect(iso(toDayNumber(2000, 2, 28) + 1)).toBe('2000-02-29');
	});
});

describe('parseIsoDate', () => {
	it('accepts a well-formed date', () => {
		expect(parseIsoDate('2026-04-05')).toBe(toDayNumber(2026, 4, 5));
	});

	/* The reason this is not `new Date(iso)`: every one of these parses to
	   SOMETHING under the built-in, and a route that took the result would
	   render a real liturgical day for a date nobody can name. */
	it('rejects a date that does not exist rather than normalising it', () => {
		expect(parseIsoDate('2026-02-31')).toBeUndefined();
		expect(parseIsoDate('2026-13-01')).toBeUndefined();
		expect(parseIsoDate('2026-00-10')).toBeUndefined();
		expect(parseIsoDate('2025-02-29')).toBeUndefined();
	});

	it('rejects a shape that is not a bare calendar date', () => {
		expect(parseIsoDate('2026-4-5')).toBeUndefined();
		expect(parseIsoDate('2026-04-05T00:00:00Z')).toBeUndefined();
		expect(parseIsoDate('')).toBeUndefined();
		expect(parseIsoDate('yesterday')).toBeUndefined();
	});

	it('accepts a leap day that does exist', () => {
		expect(parseIsoDate('2024-02-29')).toBe(toDayNumber(2024, 2, 29));
	});
});

describe('weekday', () => {
	it('puts Sunday at 0, matching getUTCDay', () => {
		expect(weekday(toDayNumber(2026, 4, 5))).toBe(SUNDAY); // Easter 2026
		expect(weekday(toDayNumber(1970, 1, 1))).toBe(THURSDAY); // the epoch
	});

	/* JavaScript's `%` yields a negative result for a negative operand, which
	   would make every pre-1970 weekday wrong — including the 1582 reform. */
	it('is right before the epoch', () => {
		expect(weekday(toDayNumber(1582, 10, 15))).toBe(FRIDAY);
		expect(weekday(toDayNumber(1969, 12, 28))).toBe(SUNDAY);
	});
});

describe('weekday seeking', () => {
	const wed = toDayNumber(2026, 4, 1); // a Wednesday

	it('finds the Sunday on or before, and returns the day itself when it is one', () => {
		expect(iso(onOrBefore(wed, SUNDAY))).toBe('2026-03-29');
		expect(iso(onOrBefore(toDayNumber(2026, 4, 5), SUNDAY))).toBe('2026-04-05');
	});

	it('finds the Sunday on or after, and returns the day itself when it is one', () => {
		expect(iso(onOrAfter(wed, SUNDAY))).toBe('2026-04-05');
		expect(iso(onOrAfter(toDayNumber(2026, 4, 5), SUNDAY))).toBe('2026-04-05');
	});

	/* The strict forms are what place Advent I and the Baptism, where landing
	   on the day itself would be wrong by a week. */
	it('excludes the day itself in the strict forms', () => {
		const sunday = toDayNumber(2026, 4, 5);
		expect(iso(before(sunday, SUNDAY))).toBe('2026-03-29');
		expect(iso(after(sunday, SUNDAY))).toBe('2026-04-12');
	});

	it('seeks a weekday other than Sunday', () => {
		expect(iso(onOrAfter(wed, SATURDAY))).toBe('2026-04-04');
		expect(iso(onOrBefore(wed, THURSDAY))).toBe('2026-03-26');
	});
});

describe('easter', () => {
	/* Published Gregorian Easter dates. A long run rather than a couple:
	   the algorithm is opaque by construction, so the test is the only thing
	   that makes it trustworthy, and every downstream date is an offset from
	   this one. */
	const KNOWN: Record<number, string> = {
		2015: '2015-04-05',
		2016: '2016-03-27',
		2017: '2017-04-16',
		2018: '2018-04-01',
		2019: '2019-04-21',
		2020: '2020-04-12',
		2021: '2021-04-04',
		2022: '2022-04-17',
		2023: '2023-04-09',
		2024: '2024-03-31',
		2025: '2025-04-20',
		2026: '2026-04-05',
		2027: '2027-03-28',
		2028: '2028-04-16',
		2029: '2029-04-01',
		2030: '2030-04-21',
		2031: '2031-04-13',
		2032: '2032-03-28',
		2033: '2033-04-17',
		2034: '2034-04-09',
		2035: '2035-03-25',
		2036: '2036-04-13',
		2037: '2037-04-05',
		2038: '2038-04-25'
	};

	it.each(Object.entries(KNOWN))('places Easter %s on %s', (year, date) => {
		expect(iso(easter(Number(year)))).toBe(date);
	});

	/* The extremes the date can reach at all. 2038 is the next 25 April and
	   is already in the table above; these are the historical anchors, and
	   they are what would catch an off-by-one in the epact that the middle of
	   the range hides. */
	it('reaches both ends of the possible range', () => {
		expect(iso(easter(1818))).toBe('1818-03-22'); // the earliest possible
		expect(iso(easter(1886))).toBe('1886-04-25'); // the latest possible
		expect(iso(easter(2285))).toBe('2285-03-22');
	});

	it('is always a Sunday, over four centuries', () => {
		for (let year = 1600; year <= 2100; year++) {
			expect(weekday(easter(year))).toBe(SUNDAY);
		}
	});

	it('never falls outside 22 March to 25 April', () => {
		for (let year = 1583; year <= 2500; year++) {
			const { month, day } = fromDayNumber(easter(year));
			expect(month === 3 || month === 4).toBe(true);
			if (month === 3) expect(day).toBeGreaterThanOrEqual(22);
			else expect(day).toBeLessThanOrEqual(25);
		}
	});
});
