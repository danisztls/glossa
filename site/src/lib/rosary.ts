/**
 * The Rosary's presentation logic: which set of mysteries a day keeps, and
 * what a mystery is called once the page around it has said the rest.
 *
 * `PrayerMysteries` and `PrayerMystery` are the callers; all of this is pure
 * functions of a weekday number or a stored string, and this file is where
 * they can be tested. There is no component test harness in this repo, so
 * logic left inside a `.svelte` file is logic nothing checks.
 */

import { dateLocale } from '$lib/dates';

/** 1 January 2024 was a Monday, so `REFERENCE_MONDAY + (iso - 1)` days is the
 *  day of that week carrying this ISO weekday number. Pinned by a test, which
 *  is the only thing standing between this and an off-by-one nobody would see
 *  except on one day of the week. */
const REFERENCE_YEAR = 2024;

/**
 * THE WEEK AS THE STRIP PRINTS IT, IN ISO NUMBERS: Sunday first.
 *
 * The corpus stores ISO weekdays, where Monday is 1 and Sunday 7, because that
 * is what `PrayerGroupEntry.days` needs to be to compare against a date. What
 * a reader is shown is a different question, and the answer is not the ISO
 * order: the week this rotation belongs to is the LITURGICAL week, which
 * begins on Sunday — the day the Glorious mysteries are prayed, and the day
 * every calendar in `/calendarium` starts its own week on.
 *
 * Fixed rather than read from the locale (`Intl.Locale`'s `getWeekInfo` would
 * answer Monday for most of Europe). That is right for a diary and wrong here:
 * which day opens the week is a fact about the Church's week, not about the
 * reader's country, and a strip that started on different days for two readers
 * would put the same set of mysteries in two places.
 */
export const WEEK_FROM_SUNDAY: readonly number[] = [7, 1, 2, 3, 4, 5, 6];

/** The day of the reference week carrying this ISO weekday number.
 *
 *  1 January 2024 was a Monday, so day `iso` of that January is the weekday
 *  `iso` names. Pinned by a test, which is the only thing standing between
 *  this and an off-by-one nobody would see except on one day of the week.
 *
 *  `timeZone: 'UTC'` on every formatter reading it, for `dates.ts`'s reason: a
 *  bare ISO date parses as UTC midnight, which is the previous evening for
 *  every reader west of Greenwich, so an unpinned formatter names the day
 *  before. */
function weekdayDate(iso: number): Date {
	return new Date(Date.UTC(REFERENCE_YEAR, 0, iso));
}

/**
 * That weekday's name in the reader's own language.
 *
 * `Intl` and not a dictionary: the corpus carries ISO numbers precisely so the
 * site never parses a rubric written in the content language, and naming a
 * number back is what a locale is for — a weekday vocabulary in forty
 * dictionaries would be forty translations of what the platform knows.
 */
export function weekdayName(iso: number, lang: string): string {
	return new Intl.DateTimeFormat(dateLocale(lang), {
		weekday: 'long',
		timeZone: 'UTC'
	}).format(weekdayDate(iso));
}

/**
 * The one or two characters that stand for that weekday on the strip.
 *
 * `narrow`, which is what gives English "S M T W T F S" and Portuguese
 * "D S T Q Q S S". **It is not unique** — English repeats T and S, Portuguese
 * repeats Q and S, and Chinese answers a single digit — so a strip drawn from
 * this is legible by POSITION and never by letter, and every button must carry
 * `weekdayName` as its accessible name. A reader is choosing a day out of a
 * row of seven they can see, which is exactly the case where an ambiguous
 * label costs nothing and a translated one costs forty dictionaries.
 */
export function weekdayInitial(iso: number, lang: string): string {
	return new Intl.DateTimeFormat(dateLocale(lang), {
		weekday: 'narrow',
		timeZone: 'UTC'
	}).format(weekdayDate(iso));
}

/**
 * A MYSTERY'S NAME, WITHOUT THE HEADING IT IS PRINTED UNDER.
 *
 * The six editions taken from the Holy Rosary micro-site title every mystery
 * with its own position and its own set restated: "First Joyful Mystery: The
 * Annunciation", "Das erste freudenreiche Geheimnis: Die Verkündigung…",
 * "1er Mystère Joyeux: L'Annonciation…". On a printed page that is the only
 * thing identifying the line. Here the set is the heading directly above it
 * and the position is the list marker beside it, so the whole prefix is the
 * page saying twice what it has already said once — and it is the longer half
 * of the line in every one of the six.
 *
 * The cut is exact rather than heuristic: all 120 titles in those six editions
 * carry exactly one colon, and every prefix is an ordinal followed by the set
 * name and nothing else. The three editions taken from the Compendium's
 * appendix carry no colon at all ("Vestea îngerului adusă Mariei.", "Jesus
 * bebådas av ängeln") and are returned unchanged, which is also what any
 * future edition gets until somebody has looked at it.
 */
export function mysteryName(title: string): string {
	const colon = title.indexOf(':');
	if (colon === -1) return title;
	const name = title.slice(colon + 1).trim();
	return name === '' ? title : name;
}

/** One piece of a sentence with prayer names taken out of it. */
export type Slotted = { text: string } | { slot: number };

/**
 * A WRITTEN SENTENCE, CUT AT THE PRAYERS IT NAMES.
 *
 * The Rosary's walkthrough is the one prose on this site that names other
 * prayers in running text, and every one of those names should be the link to
 * it. Splitting the sentence into a key per fragment would put the English
 * word order into the dictionary — "Say the", "and the prayer after it" — so
 * the string keeps its whole sentence and marks the holes with `{0}`, `{1}`,
 * which a translator may move anywhere the target language wants them.
 *
 * A slot that names nothing renders as nothing rather than as its own digits:
 * the caller decides what each index is, and a caller that runs out is a bug
 * in the caller, not a `{2}` printed at the reader.
 */
export function slotted(text: string): Slotted[] {
	const out: Slotted[] = [];
	let at = 0;
	for (const m of text.matchAll(/\{(\d+)\}/g)) {
		if (m.index > at) out.push({ text: text.slice(at, m.index) });
		out.push({ slot: Number(m[1]) });
		at = m.index + m[0].length;
	}
	if (at < text.length) out.push({ text: text.slice(at) });
	return out;
}
