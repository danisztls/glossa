/**
 * Calendar-date arithmetic, and the date of Easter.
 *
 * ## Days are integers here, not `Date`s
 *
 * `dates.ts` sets out at length why a date in this corpus is a CALENDAR date
 * and not an instant: `new Date('2026-04-05')` is midnight UTC, which is the
 * previous evening for every reader west of Greenwich, and Brazil is the
 * site's second audience. That module solves the problem for FORMATTING, by
 * pinning `timeZone: 'UTC'`. This one has the same problem in a harder form,
 * because a liturgical year is built by adding and subtracting days several
 * hundred times, and a single local-time `Date` anywhere in that chain moves
 * a feast by a day for half the world.
 *
 * So no `Date` appears in the computation at all. A day is an integer — the
 * count of days since 1 January 1970 — and every operation on it is integer
 * arithmetic, which cannot acquire a timezone. `Date.UTC` is used at the two
 * boundaries where a caller hands in or reads out a civil date, and nowhere
 * between them. Adding 49 to Easter for Pentecost is then exactly that, with
 * no daylight-saving transition able to make it 48 or 50 — which is a real
 * failure mode of the obvious implementation and not a hypothetical one, as
 * `new Date(y, m, d + 49)` in a zone that springs forward will demonstrate.
 *
 * ## The epoch is arbitrary and that is the point
 *
 * Nothing here means anything by 1970; it is the offset `Date.UTC` already
 * counts from, so choosing it means the two conversion functions are a
 * division and a multiplication rather than a calendar algorithm of their
 * own. Every value that leaves this module is a civil date or a weekday, so
 * the epoch is never visible.
 */

/** Milliseconds in a day. Exact: no leap seconds in POSIX time. */
const MS_PER_DAY = 86_400_000;

/** A day, as the number of days since 1970-01-01. */
export type DayNumber = number;

/** A calendar date with no time and no zone — what the liturgy is kept by. */
export interface Ymd {
	year: number;
	/** 1–12. Not the 0-based month `Date` uses; this is a date, not a `Date`. */
	month: number;
	/** 1–31. */
	day: number;
}

/** `2026, 4, 5` -> the day number of 5 April 2026. */
export function toDayNumber(year: number, month: number, day: number): DayNumber {
	return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** The inverse of `toDayNumber`. */
export function fromDayNumber(n: DayNumber): Ymd {
	const d = new Date(n * MS_PER_DAY);
	return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

/** `2026-04-05` -> a day number, or `undefined` if that is not such a date.
 *
 * Strict on purpose. `Date.parse` accepts `2026-4-5`, `2026-02-31` and a
 * great deal else, silently normalising the impossible ones into a
 * neighbouring day — so a URL like `/calendarium/2026-02-31` would render a
 * real liturgical day for a date that does not exist. The round-trip check is
 * what rejects that: 31 February becomes 3 March, which does not format back
 * to the string that was asked for. */
export function parseIsoDate(iso: string): DayNumber | undefined {
	const m = /^(-?\d{4,6})-(\d{2})-(\d{2})$/.exec(iso);
	if (!m) return undefined;
	const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
	if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
	const n = toDayNumber(year, month, day);
	if (!Number.isFinite(n)) return undefined;
	return formatIsoDate(n) === iso ? n : undefined;
}

/** A day number -> `2026-04-05`. */
export function formatIsoDate(n: DayNumber): string {
	const { year, month, day } = fromDayNumber(n);
	const y = year < 0 ? `-${String(-year).padStart(4, '0')}` : String(year).padStart(4, '0');
	return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 0 = Sunday … 6 = Saturday, matching `Date.prototype.getUTCDay`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const SUNDAY = 0;
export const MONDAY = 1;
export const THURSDAY = 4;
export const FRIDAY = 5;
export const SATURDAY = 6;

/**
 * The weekday of a day number.
 *
 * 1 January 1970 was a Thursday, so the epoch sits at 4 and the modulo is
 * shifted by it. The `+ 7) % 7` is for dates before 1970, where `n % 7` is
 * negative in JavaScript — the liturgical year is computable for any year and
 * nothing should stop working in 1582.
 */
export function weekday(n: DayNumber): Weekday {
	return ((((n + 4) % 7) + 7) % 7) as Weekday;
}

/** The last `target` weekday on or before `n`. */
export function onOrBefore(n: DayNumber, target: Weekday): DayNumber {
	return n - ((((weekday(n) - target) % 7) + 7) % 7);
}

/** The first `target` weekday on or after `n`. */
export function onOrAfter(n: DayNumber, target: Weekday): DayNumber {
	return n + ((((target - weekday(n)) % 7) + 7) % 7);
}

/** The last `target` weekday strictly before `n`. */
export function before(n: DayNumber, target: Weekday): DayNumber {
	return onOrBefore(n - 1, target);
}

/** The first `target` weekday strictly after `n`. */
export function after(n: DayNumber, target: Weekday): DayNumber {
	return onOrAfter(n + 1, target);
}

/**
 * Easter Sunday in the Gregorian calendar, as a day number.
 *
 * The anonymous Gregorian algorithm (Meeus, *Astronomical Algorithms*, ch. 8,
 * where it is given as "the method of Butcher"), unchanged and uncommented
 * step by step on purpose: it is a closed piece of arithmetic whose
 * intermediate variables genuinely have no names, and inventing some would
 * suggest the reader could follow it, which nobody does. What makes it
 * trustworthy is not being readable but being CHECKED — `computus.test.ts`
 * asserts it against dates published for a long span of years, including
 * every extreme the date can reach.
 *
 * Two properties worth stating because they bound everything downstream:
 * Easter is never earlier than 22 March nor later than 25 April, and the
 * whole liturgical year is a fixed offset from it apart from the Christmas
 * cycle. So a defect here is not a defect in one feast; it moves Ash
 * Wednesday, Pentecost, and the week Ordinary Time resumes at, together.
 *
 * This is the GREGORIAN computus and says nothing about the Julian one the
 * Orthodox churches keep. For 1583 onward it is the Roman Rite's own answer;
 * before the reform it is an anachronism, which is why nothing here claims a
 * liturgical year for such a date rather than silently computing one.
 */
export function easter(year: number): DayNumber {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;
	return toDayNumber(year, month, day);
}

/** The first day of the Gregorian calendar — 15 October 1582. */
export const GREGORIAN_EPOCH = toDayNumber(1582, 10, 15);
