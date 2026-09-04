/**
 * The liturgical calendar's public surface.
 *
 * Everything a caller needs is here: which liturgical year a date belongs to,
 * the resolved day, and the name of a celebration in a reader's language.
 * `computus.ts`, `temporal.ts`, `grc.ts` and `year.ts` are the parts, and a
 * page should not need any of them directly.
 */

import { type DayNumber, fromDayNumber, parseIsoDate, toDayNumber } from './computus';
import { adventSunday } from './temporal';
import type { CalendarOptions, Celebration, LiturgicalDay } from './types';
import { buildYear } from './year';

export * from './types';
export { easter, formatIsoDate, parseIsoDate, toDayNumber } from './computus';
export { anchors, sundayCycle, weekdayCycle } from './temporal';
export { GRC, HOLY_DAYS_OF_OBLIGATION } from './grc';
export { buildYear };

/**
 * Which liturgical year a day belongs to — the civil year of its Easter.
 *
 * A date in December is in NEXT year's liturgical year if Advent has begun,
 * and this year's if it has not. The comparison is against the First Sunday
 * of Advent of the date's own civil year, which is the only boundary; nothing
 * about Easter is consulted, because the year has already turned by then.
 */
export function liturgicalYearOf(n: DayNumber): number {
	const { year } = fromDayNumber(n);
	return n >= adventSunday(year) ? year + 1 : year;
}

/**
 * A cache of built years, keyed by the year and the options that shaped it.
 *
 * Building a year is a few hundred map writes and costs well under a
 * millisecond, so this is not for speed on any one call — it is so that a
 * page rendering a whole month, or a reader stepping day by day, does not
 * rebuild the same year on every keystroke. Bounded because a reader who
 * pages through decades should not accumulate them; the calendar is
 * deterministic, so an evicted year is simply rebuilt.
 */
const CACHE_LIMIT = 24;
const cache = new Map<string, Map<DayNumber, LiturgicalDay>>();

function cacheKey(year: number, options: CalendarOptions): string {
	return [
		year,
		options.nationalCalendar?.id ?? '',
		options.epiphanyOnSunday ? 'e' : '',
		options.ascensionOnSunday ? 'a' : '',
		options.corpusChristiOnSunday ? 'c' : '',
		options.sacredHeartOnSunday ? 'h' : ''
	].join('|');
}

/** One whole liturgical year, resolved and cached. */
export function getYear(
	year: number,
	options: CalendarOptions = {}
): Map<DayNumber, LiturgicalDay> {
	const key = cacheKey(year, options);
	const hit = cache.get(key);
	if (hit) return hit;
	const built = buildYear(year, options);
	if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
	cache.set(key, built);
	return built;
}

/**
 * The liturgical day for a date, or `undefined` if the date does not parse.
 *
 * Takes `2026-04-05` or a day number. Returning `undefined` rather than
 * throwing is what lets a route hand it a path segment directly — the same
 * posture `formatPromulgated` takes in `dates.ts` for a date it cannot read.
 */
export function liturgicalDay(
	date: string | DayNumber,
	options: CalendarOptions = {}
): LiturgicalDay | undefined {
	const n = typeof date === 'number' ? date : parseIsoDate(date);
	if (n === undefined) return undefined;
	return getYear(liturgicalYearOf(n), options).get(n);
}

/** Today, in the viewer's own zone — which is the zone they keep the feast in. */
export function today(options: CalendarOptions = {}): LiturgicalDay | undefined {
	const now = new Date();
	// The reader's LOCAL date, deliberately. Everywhere else in this codebase
	// a date is pinned to UTC (`dates.ts`), because a promulgation date is a
	// fact about a document and must read the same everywhere. "Today" is the
	// opposite kind of question: at 21:00 in São Paulo it is already tomorrow
	// in UTC, and answering with tomorrow's feast would be wrong for the
	// person asking. So this is the one place the local zone is correct.
	return liturgicalDay(toDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate()), options);
}

/**
 * A celebration's name in a reader's language, falling back the way the rest
 * of the corpus does.
 *
 * The chain is the reader's own language, then English, then Latin — the tail
 * every row of `CONTENT_LANG_FALLBACK` ends in (`corpus.ts`). The calendar
 * carries three languages and the interface has thirty-four, so for most
 * readers this lands on Latin, which is the celebration's own name and not a
 * failure. It cannot return undefined: every celebration has a Latin name,
 * except a national proper approved only in the vernacular, which has the
 * language it was approved in.
 */
export function celebrationName(
	celebration: { id: string; names: Celebration['names'] },
	lang: string
): string {
	const base = lang.split('-')[0] as keyof Celebration['names'];
	return (
		celebration.names[base] ??
		celebration.names.en ??
		celebration.names.la ??
		celebration.names.pt ??
		celebration.id
	);
}
