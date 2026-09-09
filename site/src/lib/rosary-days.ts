/**
 * The Rosary's weekday rotation, as arithmetic.
 *
 * `PrayerMysteries` shows one set of mysteries and steps through the week;
 * both halves of that are pure functions of an ISO weekday, and this file is
 * where they can be tested. There is no component test harness in this repo,
 * so logic left inside a `.svelte` file is logic nothing checks.
 */

import { dateLocale } from '$lib/dates';

/** 1 January 2024 was a Monday, so `REFERENCE_MONDAY + (iso - 1)` days is the
 *  day of that week carrying this ISO weekday number. Pinned by a test, which
 *  is the only thing standing between this and an off-by-one nobody would see
 *  except on one day of the week. */
const REFERENCE_YEAR = 2024;

/**
 * The ISO weekday `offset` days from `todayIso`, wrapped into the week.
 *
 * Wrapped rather than added to a date because only the weekday is ever
 * printed: the two agree for one step and part on the seventh, where a real
 * date is a week away and names the weekday the reader started on. Negative
 * offsets wrap the same way — JavaScript's `%` keeps the sign of its left
 * operand, so the `+ 7` before the second `%` is load-bearing.
 */
export function weekdayOn(todayIso: number, offset: number): number {
	return ((((todayIso - 1 + offset) % 7) + 7) % 7) + 1;
}

/**
 * That weekday's name in the reader's own language.
 *
 * `Intl` and not a dictionary: the corpus carries ISO numbers precisely so the
 * site never parses a rubric written in the content language, and naming a
 * number back is what a locale is for — a weekday vocabulary in forty
 * dictionaries would be forty translations of what the platform knows.
 *
 * `timeZone: 'UTC'` for `dates.ts`'s reason: a bare ISO date parses as UTC
 * midnight, which is the previous evening for every reader west of Greenwich,
 * so an unpinned formatter names the day before.
 */
export function weekdayName(iso: number, lang: string): string {
	return new Intl.DateTimeFormat(dateLocale(lang), {
		weekday: 'long',
		timeZone: 'UTC'
	}).format(new Date(Date.UTC(REFERENCE_YEAR, 0, iso)));
}
