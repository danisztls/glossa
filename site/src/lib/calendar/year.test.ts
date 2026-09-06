/**
 * The calendar in years the oracle cannot reach.
 *
 * `oracle.test.ts` checks every day of 2025, 2026 and 2027 against calendars
 * computed by somebody else, which is the strongest evidence available and
 * covers three Easters. THREE EASTERS IS NOT MANY. The cases that break a
 * liturgical calendar are chosen for their rarity — an Annunciation falling on
 * Easter Sunday itself, a transferred Epiphany landing on 7 or 8 January, a
 * Christmas that is a Sunday and so leaves its octave without one — and none
 * of the three happens to contain any of them.
 *
 * So this file goes the other way: it names a year for the property it has and
 * asserts the rule directly. Where a date is stated it comes from the norm, not
 * from running the code and writing down the answer.
 */

import { describe, expect, it } from 'vitest';
import { formatIsoDate, parseIsoDate, toDayNumber } from './computus';
import { GRC } from './grc';
import { BRAZIL } from './national/br';
import { adventSunday, anchors, sundayCycle, weekdayCycle } from './temporal';
import type { CalendarOptions } from './types';
import { buildYear } from './year';

const day = (y: number, iso: string, options: CalendarOptions = {}) =>
	buildYear(y, options).get(parseIsoDate(iso)!);

describe('the liturgical year is designated by the civil year of its Easter', () => {
	/* The single easiest thing to be wrong by a year about. Liturgical year
	   2026 begins in November 2025 and its Christmas is in December 2025. */
	it('begins in the previous November', () => {
		expect(formatIsoDate(anchors(2026).adventStart)).toBe('2025-11-30');
		expect(formatIsoDate(anchors(2026).christmas)).toBe('2025-12-25');
		expect(formatIsoDate(anchors(2026).easter)).toBe('2026-04-05');
		expect(formatIsoDate(anchors(2026).nextAdvent)).toBe('2026-11-29');
	});

	it('puts Advent on the Sunday nearest 30 November', () => {
		expect(formatIsoDate(adventSunday(2025))).toBe('2025-11-30');
		expect(formatIsoDate(adventSunday(2026))).toBe('2026-11-29');
		expect(formatIsoDate(adventSunday(2027))).toBe('2027-11-28');
		// 2022: 27 November, the earliest Advent can begin.
		expect(formatIsoDate(adventSunday(2022))).toBe('2022-11-27');
		// 2023: 3 December, the latest.
		expect(formatIsoDate(adventSunday(2023))).toBe('2023-12-03');
	});
});

describe('the lectionary cycles', () => {
	/* Published cycles. Year A is the year running from Advent 2025 into 2026;
	   weekday Year I belongs to a liturgical year designated by an odd civil
	   year. Both turn over at Advent, which is why they are stated off the
	   liturgical year's own designation and not off a civil one. */
	it.each([
		[2023, 'A', 'I'],
		[2024, 'B', 'II'],
		[2025, 'C', 'I'],
		[2026, 'A', 'II'],
		[2027, 'B', 'I'],
		[2028, 'C', 'II']
	])('year %i is Sunday cycle %s and weekday cycle %s', (year, sunday, weekday) => {
		expect(sundayCycle(year)).toBe(sunday);
		expect(weekdayCycle(year)).toBe(weekday);
	});

	it('carries the same cycle across the January boundary and changes it at Advent', () => {
		// Both sides of 1 January 2026 are in liturgical year 2026.
		expect(day(2026, '2025-12-31')!.sundayCycle).toBe('A');
		expect(day(2026, '2026-01-01')!.sundayCycle).toBe('A');
		// Advent 2026 opens liturgical year 2027.
		expect(day(2026, '2026-11-28')!.sundayCycle).toBe('A');
		expect(day(2027, '2026-11-29')!.sundayCycle).toBe('B');
	});
});

describe('Ordinary Time is numbered so that Christ the King is the thirty-fourth Sunday', () => {
	it.each([2024, 2025, 2026, 2027, 2030, 2035, 2038])('holds in %i', (year) => {
		const a = anchors(year);
		const king = buildYear(year).get(a.christTheKing)!;
		expect(king.celebration.id).toBe('christ-the-king');
		expect(king.week).toBe(34);
		expect(king.season).toBe('ordinary');
		// And the Saturday after it is the last day of the year.
		expect(buildYear(year).get(a.nextAdvent - 1)!.week).toBe(34);
		expect(buildYear(year).get(a.nextAdvent)).toBeUndefined();
	});

	/* The first block of Ordinary Time opens on the Monday after the Baptism,
	   and that Monday is in week 1 — the Baptism itself occupies week 1's
	   Sunday, so the following Sunday is the SECOND Sunday in Ordinary Time. */
	it('starts week 1 on the Monday after the Baptism', () => {
		const a = anchors(2026);
		expect(formatIsoDate(a.baptism)).toBe('2026-01-11');
		expect(buildYear(2026).get(a.baptism + 1)!.week).toBe(1);
		expect(buildYear(2026).get(a.baptism + 7)!.week).toBe(2);
		expect(buildYear(2026).get(a.baptism + 7)!.celebration.id).toBe('ordinary-2-sunday');
	});

	/* AND IT DOES NOT START ON A MONDAY EVERY YEAR. Where Epiphany is kept on
	   the Sunday, the Baptism is the Monday after it and Ordinary Time opens
	   on the Tuesday — so week 1 holds five weekdays instead of six. Counting
	   the weeks from the day the season STARTS makes that year's every Sunday
	   a week early; the count is anchored on the Sunday for this reason. The
	   dates are the norm's: 2023 kept Epiphany on 8 January, so 15 January is
	   the Second Sunday in Ordinary Time and 22 January the Third. */
	it('opens week 1 on the Tuesday where the Baptism is displaced', () => {
		const us: CalendarOptions = { epiphanyOnSunday: true };
		expect(day(2023, '2023-01-08', us)!.celebration.id).toBe('epiphany');
		expect(day(2023, '2023-01-09', us)!.celebration.id).toBe('baptism-of-the-lord');
		expect(day(2023, '2023-01-10', us)!.celebration.id).toBe('ordinary-1-2');
		expect(day(2023, '2023-01-14', us)!.celebration.id).toBe('ordinary-1-6');
		expect(day(2023, '2023-01-15', us)!.celebration.id).toBe('ordinary-2-sunday');
		expect(day(2023, '2023-01-22', us)!.celebration.id).toBe('ordinary-3-sunday');
	});

	/* 2024 is the same shape one day earlier — Epiphany on 7 January, the
	   Baptism on Monday the 8th — and its Second Sunday is 14 January. */
	it('does the same where Epiphany falls on 7 January', () => {
		const us: CalendarOptions = { epiphanyOnSunday: true };
		expect(day(2024, '2024-01-08', us)!.celebration.id).toBe('baptism-of-the-lord');
		expect(day(2024, '2024-01-13', us)!.celebration.id).toBe('ordinary-1-6');
		expect(day(2024, '2024-01-14', us)!.celebration.id).toBe('ordinary-2-sunday');
	});
});

describe('Saint Joseph moves in whichever direction is closer', () => {
	/* n. 60's "closest day not listed under nn. 1-8" is closest in EITHER
	   direction, and 19 March is the celebration that meets both. The engine
	   carried a per-celebration direction until 2026-09-06 and got the second
	   of these backwards. */

	/* Impeded by a Sunday of Lent, a free day lies one step each way and the
	   tie breaks FORWARD. 19 March 2017 was the Third Sunday of Lent and the
	   solemnity was kept on Monday the 20th. */
	it('is deferred to the Monday off a Sunday of Lent', () => {
		expect(day(2017, '2017-03-19')!.celebration.id).toBe('lent-3-sunday');
		const moved = day(2017, '2017-03-20')!;
		expect(moved.celebration.id).toBe('joseph');
		expect(moved.celebration.transferredFrom).toBe('2017-03-19');
	});

	/* 2028 is the same case, and is the one a second witness confirms: USCCB
	   publishes the solemnity's readings on Monday 20 March 2028. */
	it('does the same in 2028, where the crawl agrees', () => {
		expect(day(2028, '2028-03-19')!.celebration.id).toBe('lent-3-sunday');
		expect(day(2028, '2028-03-20')!.celebration.id).toBe('joseph');
	});

	/* Impeded by Holy Week, forward is past the whole Octave of Easter and
	   backward is a few days, so he is ANTICIPATED. 19 March 2008 was Holy
	   Wednesday and the solemnity was kept on Saturday the 15th. */
	it('is anticipated out of Holy Week', () => {
		expect(day(2008, '2008-03-19')!.celebration.id).toBe('holy-week-3');
		const moved = day(2008, '2008-03-15')!;
		expect(moved.celebration.id).toBe('joseph');
		expect(moved.celebration.transferredFrom).toBe('2008-03-19');
	});

	/* 2035 puts him inside Holy Week while the Annunciation is on Easter
	   Sunday, so both move and in opposite directions. */
	it('clears Holy Week in 2035 without taking the Annunciation’s day', () => {
		expect(day(2035, '2035-03-19')!.celebration.id).toBe('holy-week-1');
		expect(day(2035, '2035-03-17')!.celebration.id).toBe('joseph');
	});

	/* The commonest transfer of all, and the same tie: 8 December 2024 was the
	   Second Sunday of Advent and the Immaculate Conception was kept on the
	   Monday. A rule that anticipated would have put her on the 7th. */
	it('breaks the same tie forward for the Immaculate Conception', () => {
		expect(day(2025, '2024-12-08')!.celebration.id).toBe('advent-2-sunday');
		expect(day(2025, '2024-12-09')!.celebration.id).toBe('immaculate-conception');
	});
});

describe('the Annunciation when Holy Week or the Octave of Easter takes 25 March', () => {
	/* Easter 2035 is 25 March — the Annunciation falls on Easter Sunday
	   itself, the most impeded a solemnity can be. This is NOT n. 60's closest
	   day, which would send it backward into Lent; n. 61 names the destination
	   outright, the Monday after the Second Sunday of Easter. The octave runs
	   to Sunday 1 April, so Monday 2 April. */
	it('moves it past the whole octave in 2035', () => {
		expect(formatIsoDate(anchors(2035).easter)).toBe('2035-03-25');
		expect(day(2035, '2035-03-25')!.celebration.id).toBe('easter-sunday');
		const moved = day(2035, '2035-04-02')!;
		expect(moved.celebration.id).toBe('annunciation');
		expect(moved.celebration.transferredFrom).toBe('2035-03-25');
	});

	/* 2027 is the same case one step less extreme: 25 March is Holy Thursday,
	   so the Annunciation clears Holy Week and the octave and lands on Monday
	   5 April. This one the oracle also confirms. */
	it('moves it out of Holy Week in 2027', () => {
		expect(day(2027, '2027-03-25')!.celebration.id).toBe('holy-thursday');
		expect(day(2027, '2027-04-05')!.celebration.id).toBe('annunciation');
	});

	it('leaves it alone in a year where nothing impedes it', () => {
		expect(day(2026, '2026-03-25')!.celebration.id).toBe('annunciation');
		expect(day(2026, '2026-03-25')!.celebration.transferredFrom).toBeUndefined();
	});
});

describe('the Christmas octave', () => {
	/* When Christmas is a Sunday the octave holds no Sunday of its own — 26 to
	   31 December runs Monday to Saturday — and the Holy Family is kept on 30
	   December instead. 2033 is such a year. */
	it('puts the Holy Family on 30 December when Christmas is a Sunday', () => {
		expect(formatIsoDate(anchors(2034).christmas)).toBe('2033-12-25');
		expect(day(2034, '2033-12-25')!.celebration.id).toBe('christmas');
		expect(day(2034, '2033-12-30')!.celebration.id).toBe('holy-family');
	});

	it('puts it on the Sunday within the octave otherwise', () => {
		expect(day(2026, '2025-12-28')!.celebration.id).toBe('holy-family');
	});

	/* The Holy Family is a feast OF THE LORD (line 5) and the Holy Innocents a
	   feast of saints (line 7), so when they collide the Holy Family wins —
	   which is the whole reason the two feast ranks are separate fields. */
	it('gives 28 December to the Holy Family over the Holy Innocents', () => {
		const d = day(2026, '2025-12-28')!;
		expect(d.celebration.id).toBe('holy-family');
		expect(d.optional.map((c) => c.id)).not.toContain('holy-innocents');
	});
});

describe('the transfers a conference may make', () => {
	it('keeps the universal calendar by default', () => {
		expect(day(2026, '2026-01-06')!.celebration.id).toBe('epiphany');
		expect(day(2026, '2026-05-14')!.celebration.id).toBe('ascension'); // Thursday
		expect(day(2026, '2026-06-04')!.celebration.id).toBe('corpus-christi'); // Thursday
	});

	it('moves Epiphany to the Sunday falling 2–8 January', () => {
		const o = { epiphanyOnSunday: true };
		expect(day(2026, '2026-01-04', o)!.celebration.id).toBe('epiphany');
		expect(day(2026, '2026-01-06', o)!.celebration.id).not.toBe('epiphany');
	});

	/* THE CLAUSE THAT IS EASY TO MISS. Where a transferred Epiphany itself
	   falls on 7 or 8 January, the Baptism of the Lord is the MONDAY after,
	   not the following Sunday. Asserted as the rule over a long span rather
	   than on one year, because the years it bites in are rare. */
	it('puts the Baptism on the Monday after a late transferred Epiphany', () => {
		const o = { epiphanyOnSunday: true };
		let seen = 0;
		for (let year = 2020; year <= 2060; year++) {
			const a = anchors(year, o);
			const epiphanyDay = Number(formatIsoDate(a.epiphany).slice(8));
			if (epiphanyDay >= 7) {
				seen++;
				expect(a.baptism).toBe(a.epiphany + 1);
			} else {
				expect(a.baptism).toBe(a.epiphany + 7);
			}
		}
		expect(seen).toBeGreaterThan(0);
	});

	it('moves the Ascension to the Seventh Sunday of Easter', () => {
		const o = { ascensionOnSunday: true };
		expect(day(2026, '2026-05-17', o)!.celebration.id).toBe('ascension');
		expect(day(2026, '2026-05-14', o)!.celebration.id).not.toBe('ascension');
	});
});

describe('holy days of obligation', () => {
	/* The universal law's list is CIC c. 1246 §1, which the corpus holds in
	   seven languages. Every Sunday is one by the same canon. */
	it('marks Sundays and the ten solemnities of c. 1246 §1', () => {
		expect(day(2026, '2026-06-07')!.holyDayOfObligation).toBe(true); // a Sunday
		expect(day(2026, '2025-12-25')!.holyDayOfObligation).toBe(true);
		expect(day(2026, '2026-08-15')!.holyDayOfObligation).toBe(true);
		expect(day(2026, '2026-06-09')!.holyDayOfObligation).toBe(false); // a weekday
	});
});

describe('Brazil', () => {
	it('is the general calendar plus its own', () => {
		const o = { nationalCalendar: BRAZIL };
		expect(day(2026, '2026-06-09', o)!.celebration.id).toBe('jose-de-anchieta');
		expect(day(2026, '2026-10-12', o)!.celebration.id).toBe('aparecida');
		// Its transfers come with it, without the caller restating them.
		expect(day(2026, '2026-01-04', o)!.celebration.id).toBe('epiphany');
		expect(day(2026, '2026-05-17', o)!.celebration.id).toBe('ascension');
	});

	it('displaces the general memorial whose date a proper has taken', () => {
		const o = { nationalCalendar: BRAZIL };
		expect(day(2026, '2026-06-08', o)!.optional.map((c) => c.id)).toContain('ephrem');
		expect(day(2026, '2026-06-09', o)!.optional.map((c) => c.id)).not.toContain('ephrem');
	});

	it('leaves the general calendar untouched for everyone else', () => {
		expect(day(2026, '2026-06-09')!.optional.map((c) => c.id)).toContain('ephrem');
		expect(day(2026, '2026-10-12')!.celebration.id).not.toBe('aparecida');
	});
});

describe('the table itself', () => {
	it('gives every celebration a Latin name and a unique id', () => {
		const ids = new Set<string>();
		for (const [key, list] of GRC) {
			expect(key).toMatch(/^\d{2}-\d{2}$/);
			for (const c of list) {
				expect(c.names.la, c.id).toBeTruthy();
				expect(c.names.en, c.id).toBeTruthy();
				expect(c.names.pt, c.id).toBeTruthy();
				expect(ids.has(c.id), `duplicate id ${c.id}`).toBe(false);
				ids.add(c.id);
			}
		}
	});

	/* 29 February is the one date a fixed calendar must not use: three years
	   in four it does not exist, and a celebration placed there would vanish
	   without anything reporting it. */
	it('places nothing on 29 February', () => {
		expect(GRC.has('02-29')).toBe(false);
	});

	it('answers for a leap day like any other', () => {
		const d = day(2024, '2024-02-29')!;
		expect(d.date).toBe('2024-02-29');
		expect(d.season).toBe('lent');
	});
});

describe('every day of a year is answered exactly once', () => {
	it.each([2024, 2025, 2026, 2027, 2030, 2035])('for %i', (year) => {
		const built = buildYear(year);
		const a = anchors(year);
		expect(built.size).toBe(a.nextAdvent - a.adventStart);
		for (let n = a.adventStart; n < a.nextAdvent; n++) {
			const d = built.get(n);
			expect(d, formatIsoDate(n)).toBeDefined();
			expect(d!.colour).toBeTruthy();
			expect(d!.psalterWeek).toBeGreaterThanOrEqual(1);
			expect(d!.psalterWeek).toBeLessThanOrEqual(4);
		}
	});

	it('runs the seasons in order and covers the year with them', () => {
		const seasons = new Set<string>();
		const a = anchors(2026);
		for (let n = a.adventStart; n < a.nextAdvent; n++) {
			seasons.add(buildYear(2026).get(n)!.season);
		}
		expect([...seasons].sort()).toEqual([
			'advent',
			'christmas',
			'easter',
			'lent',
			'ordinary',
			'triduum'
		]);
	});
});

describe('day numbers and dates agree', () => {
	it('keeps the ISO date and the day number in step', () => {
		const d = day(2026, '2026-04-05')!;
		expect(d.dayNumber).toBe(toDayNumber(2026, 4, 5));
		expect(d.date).toBe('2026-04-05');
	});
});
