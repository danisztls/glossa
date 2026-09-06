/**
 * Which reading set the Ordo Lectionum Missae appoints for a liturgical day.
 *
 * THIS REPLACES A DATE INDEX WITH ARITHMETIC, and that is the whole point. The
 * table shipped a `days` map from an ISO date to the numbers kept on it, which
 * could only ever answer for the years somebody had crawled — a reader asking
 * for 2040 got nothing. The OLM does not number days, it numbers READING SETS,
 * and it assigns them by a day's place in the year, so the mapping is a
 * function of what `$lib/calendar` already computes and needs no data at all
 * beyond the constants below.
 *
 * WHAT IS DERIVED AND WHAT IS COPIED, the same split `site/docs/calendar.md`
 * draws for the calendar itself. The temporal cycle is arithmetic: the Easter
 * weekdays are `255 + 6·week + (weekday − 1)` with no exceptions in three
 * years of crawled days, and the Sundays of Ordinary Time are
 * `61 + 3·(week − 1) + cycle`. The sanctoral cannot be derived from anything —
 * that Mark is 555 is a positive act, not a consequence — so it is a table,
 * and `rules.test.ts` checks every entry against the crawl.
 *
 * THE WEEKDAY NUMBER DOES NOT DEPEND ON THE WEEKDAY CYCLE, which looks wrong
 * and is not: the OLM prints Year I and Year II under ONE number, in parallel
 * columns — `pipeline/scrapers/olm.py` reads the scan and says so. The cycle
 * selects a column, not a number.
 *
 * A PROPER OUTRANKS THE ARITHMETIC. On a day carrying a feast or solemnity the
 * source prints that celebration's own set instead of the ferial one, so the
 * sanctoral table is consulted first. On a memorial it often prints both, as
 * `520/317` — the proper, then the ferial — and both are offered here.
 */

import type { LiturgicalDay } from '$lib/calendar/types';

/**
 * Days the book gives MORE THAN ONE Mass, in the order it prints them.
 *
 * A vigil is not a variant of the day's Mass, it is another Mass with its own
 * readings and its own number, and a reader arriving on Christmas Eve wants
 * the one they are going to. These were collapsed to a single number when the
 * sanctoral table was first derived — the day kept `16` and the Vigil, Night
 * and Dawn Masses were unreachable at any address.
 *
 * HOLY THURSDAY IS HERE FOR A DIFFERENT REASON and belongs all the same: the
 * Chrism Mass (260) and the Evening Mass of the Lord's Supper (39) are two
 * celebrations on one date, which is the same fact about the day even though
 * neither is a vigil.
 *
 * NOT HERE: the Ascension, where USCCB prints 58 and 60 on one page because
 * six United States provinces keep it on the Thursday and the rest on the
 * Sunday. That is two CALENDARS, not two Masses, and `$lib/calendar` has
 * already chosen one — so the celebration's own id selects the number and
 * offering both would show every reader a Mass they are not at.
 */
const FORMULARIES: Record<string, string[]> = {
	christmas: ['13', '14', '15', '16'],
	'holy-thursday': ['260', '39'],
	pentecost: ['62', '63'],
	assumption: ['621', '622'],
	'birth-of-john-the-baptist': ['586', '587'],
	'peter-and-paul': ['590', '591']
};

/** Sunday cycle as an offset: the OLM lists A, B, C in that order. */
const CYCLE: Record<string, number> = { A: 0, B: 1, C: 2 };

/**
 * The first number of each season's run of Sundays, at week 1 in Year A.
 * Advent opens the book at 1, so every one of these is countable from the
 * printed edition rather than chosen here.
 */
const SUNDAY_BASE: Record<string, number> = {
	advent: 1,
	lent: 22,
	// Easter Sunday itself is 42 and is reached through the sanctoral, being a
	// solemnity; this base carries the Sundays after it, 43 at week 2 in Year A.
	easter: 40,
	ordinary: 61
};

/**
 * The first number of each week's run of weekdays, Monday first.
 *
 * Ordinary Time and Easter are regular enough to be arithmetic (`305 + 6·(week
 * − 1)` and `255 + 6·week`); Advent, Christmas and Lent are not, because each
 * has a stretch the book numbers by DATE instead — see `weekdayNumber`.
 * Lent's week 0 is the stub between Ash Wednesday and the First Sunday, which
 * is four days and not six, which is why the run cannot be one formula.
 */
const LENT_WEEKDAY_BASE = [217, 224, 230, 237, 244, 251, 257];
const ADVENT_WEEKDAY_BASE = [0, 175, 181, 187];

/** Advent's last stretch is numbered by date: 17 December is 193. */
const ADVENT_LATE_FIRST = 193;
/** The days between 2 January and Epiphany, likewise: 2 January is 205. */
const CHRISTMAS_LATE_FIRST = 205;
/** The weekdays after Epiphany, numbered from Monday. */
const AFTER_EPIPHANY_FIRST = 212;

/** Monday is 1 here, matching the OLM's own ordering of a week. */
function weekdayIndex(date: string): number {
	const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
	return dow === 0 ? 0 : dow;
}

/** The temporal (ferial) number for a weekday, or null where there is none. */
function weekdayNumber(day: LiturgicalDay): number | null {
	const d = weekdayIndex(day.date);
	if (d === 0) return null;
	const md = day.date.slice(5);

	switch (day.season) {
		case 'advent': {
			// From 17 December the book stops counting weeks and counts days.
			if (md >= '12-17') return ADVENT_LATE_FIRST + (Number(md.slice(3)) - 17);
			const base = ADVENT_WEEKDAY_BASE[day.week];
			return base ? base + (d - 1) : null;
		}
		case 'christmas': {
			// THE CALENDAR ALREADY SAYS WHICH SIDE OF EPIPHANY THIS IS, and asking
			// it is what keeps this a pure function of the day. Epiphany moves —
			// a conference may keep it on the Sunday, as the United States does —
			// so the date cannot be assumed, but `week` counts from it either way:
			// week 1 is the days before, week 2 the days after.
			if (day.week >= 2) return AFTER_EPIPHANY_FIRST + (d - 1);
			if (md >= '01-02' && md <= '01-12') return CHRISTMAS_LATE_FIRST + (Number(md.slice(3)) - 2);
			return null;
		}
		case 'lent': {
			const base = LENT_WEEKDAY_BASE[day.week];
			return base ? base + (d - 1) : null;
		}
		case 'easter':
			return 255 + 6 * day.week + (d - 1);
		case 'ordinary':
			return 305 + 6 * (day.week - 1) + (d - 1);
		default:
			return null;
	}
}

/** The temporal number for a Sunday. */
function sundayNumber(day: LiturgicalDay): number | null {
	const base = SUNDAY_BASE[day.season];
	if (base === undefined) return null;
	// THERE IS NO FIRST SUNDAY OF ORDINARY TIME. The Sunday of that week is the
	// Baptism of the Lord, and the next Sunday is the SECOND — the book numbers
	// them from 64 and prints no 61, 62 or 63. `$lib/calendar` emits an Ordinary
	// week-1 Sunday in a year where the Baptism is displaced to the Monday (8
	// January 2023 kept Epiphany on the Sunday, so 15 January was labelled week
	// 1 and is the Second Sunday), which is a defect there; clamping states what
	// the book states rather than working around it, and keeps a reader in such
	// a year from being handed the wrong Sunday.
	const week = day.season === 'ordinary' ? Math.max(day.week, 2) : day.week;
	return base + 3 * (week - 1) + CYCLE[day.sundayCycle];
}

/**
 * The reading sets appointed for `day`, most proper first, or an empty array
 * where this cannot say. A pure function of the liturgical day and nothing
 * else — which is what lets it answer for a year nobody has crawled.
 */
export function olmNumbersFor(
	day: LiturgicalDay,
	sanctoral: Readonly<Record<string, string>> = SANCTORAL
): string[] {
	const id = day.celebration.id;
	const formularies = FORMULARIES[id];
	if (formularies) return [...formularies];

	const out: string[] = [];
	// Trinity, Corpus Christi, the Sacred Heart and Christ the King read a
	// three-year cycle as a Sunday does, so their entry carries it; every other
	// celebration reads the same set every year and is keyed by identity alone.
	const proper = sanctoral[`${id}|${day.sundayCycle}`] ?? sanctoral[id];
	if (proper) out.push(proper);

	const temporal = weekdayIndex(day.date) === 0 ? sundayNumber(day) : weekdayNumber(day);
	// A feast or solemnity replaces the ferial reading rather than adding to it;
	// a memorial leaves it standing, which is why the source prints both.
	const replaces =
		proper && (day.celebration.rank === 'solemnity' || day.celebration.rank === 'feast');
	if (temporal !== null && !replaces) out.push(String(temporal));
	return out;
}

/**
 * The sanctoral, keyed by the celebration id `$lib/calendar` gives it.
 *
 * COPIED, NOT DERIVED, and checked rather than trusted: `rules.test.ts` reads
 * every entry back off the crawl and fails on one the crawl contradicts. It
 * holds the celebrations the crawl actually met, which is not the whole
 * sanctoral — a saint whose day fell on a Sunday in all three years was never
 * printed with a number of its own, and is absent rather than guessed.
 */
export const SANCTORAL: Readonly<Record<string, string>> = {
	// The Triduum and Easter Day: fixed sets, and the calendar gives each its
	// own id, so no arithmetic is needed or possible.
	'holy-thursday': '39',
	'good-friday': '40',
	'holy-saturday': '41',
	'easter-sunday': '42',
	// The days the source prints with a vigil as well: the number kept here is
	// the one for the day itself, the vigil being a second Mass this does not
	// yet address (`table.json`'s `masses` holds both).
	ascension: '58',
	pentecost: '63',
	'birth-of-john-the-baptist': '587',
	'peter-and-paul': '591',
	christmas: '16',
	// The octave of Christmas past its feasts, numbered by date.
	'christmas-octave-5': '202',
	'christmas-octave-6': '203',
	'christmas-octave-7': '204',
	// Kept on a weekday of Lent, and transferred when Holy Week reaches it.
	joseph: '543',
	'mary-mother-of-the-church': '572A',
	'all-saints': '667',
	'all-souls': '668',
	andrew: '684',
	annunciation: '545',
	archangels: '647',
	assumption: '621',
	'baptism-of-the-lord': '21',
	barnabas: '580',
	bartholomew: '629',
	'chair-of-peter': '535',
	'conversion-of-paul': '519',
	'dedication-of-the-lateran': '671',
	'easter-octave-1': '261',
	'easter-octave-2': '262',
	'easter-octave-3': '263',
	'easter-octave-4': '264',
	'easter-octave-5': '265',
	'easter-octave-6': '266',
	epiphany: '20',
	'exaltation-of-the-cross': '638',
	'holy-family': '17',
	'holy-innocents': '698',
	'immaculate-conception': '689',
	james: '605',
	'john-evangelist': '697',
	lawrence: '618',
	luke: '661',
	mark: '555',
	'mary-magdalene': '603',
	'mary-mother-of-god': '18',
	matthew: '643',
	matthias: '564',
	'nativity-of-mary': '636',
	'our-lady-of-guadalupe': '690A',
	// THESE FOUR ARE THE SECOND HALF OF A `N/M` PAIR, and the first derivation
	// took the first half — which is the ferial on these days, so the Passion of
	// John the Baptist was filed under 430, a Thursday in Ordinary Time. The
	// Proper of Saints begins at 507; below it is temporal. `_gap` read them
	// back off the crawl against the calendar's own celebration ids.
	'passion-of-john-the-baptist': '634',
	'guardian-angels': '650',
	'martha-mary-lazarus': '607',
	'our-lady-of-sorrows': '639',
	'philip-james': '561',
	'presentation-of-the-lord': '524',
	'simon-jude': '666',
	stephen: '696',
	'thomas-apostle': '593',
	'timothy-titus': '520',
	transfiguration: '614',
	visitation: '572',
	// Cycle-dependent: these solemnities read a three-year cycle like a Sunday,
	// so they are keyed with it. `olmNumbersFor` tries the cycled key first.
	'trinity|A': '164',
	'trinity|B': '165',
	'trinity|C': '166',
	'corpus-christi|A': '167',
	'corpus-christi|B': '168',
	'corpus-christi|C': '169',
	'sacred-heart|A': '170',
	'sacred-heart|B': '171',
	'sacred-heart|C': '172',
	'christ-the-king|A': '160',
	'christ-the-king|B': '161',
	'christ-the-king|C': '162'
};
