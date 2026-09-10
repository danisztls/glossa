/**
 * Which calendar the reader keeps — remembered, so that `/calendarium` opens
 * in their own country rather than in Rome's every time.
 *
 * It is the same kind of thing as the theme, the reading size and compare
 * mode (`compare-pref.svelte.ts`), stored the same way and for the same
 * reason: a reader in Brazil is not choosing Brazil for one visit, they live
 * there, and a control that forgets between visits is a control they have to
 * operate before the page is ever right.
 *
 * THE URL PARAMETER OVERRIDES THE PREFERENCE AND DOES NOT REPLACE IT, which
 * is the one place this deliberately differs from `compare-pref`. `?c=` is
 * how a calendar gets SHARED — a link to what Poland keeps on 16 October —
 * and adopting it on arrival would mean that following somebody else's link
 * silently re-homes the reader. A territory is a fact about a person in a way
 * a column layout is not. So only an explicit choice in the picker is
 * remembered (`rememberTerritory`, called from the page's `onchoose`), and a
 * link's parameter wins for as long as the reader stays on it.
 *
 * `'general'` IS STORED RATHER THAN CLEARED. A reader who has been in the
 * Brazilian calendar and goes back to the general one has made a choice, and
 * an absent key would read as "never chose" and put them back in Brazil on
 * the next visit. That distinction is what `detectedTerritory` below rests
 * on: the two states an absent key used to share are now "never chose, guess"
 * and "chose the general calendar, leave it alone", and only the first is
 * guessed at.
 */

import { GEO_ATTRIBUTE } from './geo';
import { readStoredString, writeStoredString } from './storage';

const STORAGE_KEY = 'glossa:calendar-territory';

/** The remembered territory code, or `undefined` if the reader has never
 *  chosen one. Never validated here — `TERRITORY_CALENDARS` is what decides
 *  whether a code still names a published calendar, exactly as it does for a
 *  `?c=` typed by hand, so a territory withdrawn by `held.ts` degrades to the
 *  general calendar rather than to an error. */
export function storedTerritory(): string | undefined {
	return readStoredString(STORAGE_KEY);
}

export function rememberTerritory(id: string): void {
	writeStoredString(STORAGE_KEY, id);
}

/**
 * Whether the month listing draws the days that say nothing — the eye in
 * `CalendarMonth`'s header.
 *
 * IT IS A PREFERENCE AND NOT A WAY OF LOOKING AT ONE MONTH, which is the
 * reverse of what this file said until 2026-09-06 (the argument is kept in the
 * component, beside the state it now seeds). A reader who wants to count the
 * days of a month wants to count them next month too, and a control that
 * forgets is one they operate again at every page of the calendar. It stays out
 * of `?d=`/`?c=` for the reason those two are IN it: the address reproduces
 * which day the page shows, and how many rows the listing draws is not a fact
 * about the day.
 *
 * Stored as the DIFFERENCE from the default, like everything else here: the key
 * is absent while the plain days are hidden, which is what a reader who has
 * never pressed the eye gets.
 */
const PLAIN_DAYS_KEY = 'glossa:calendar-plain-days';

export function storedPlainDays(): boolean {
	return readStoredString(PLAIN_DAYS_KEY) === 'on';
}

export function rememberPlainDays(shown: boolean): void {
	writeStoredString(PLAIN_DAYS_KEY, shown ? 'on' : undefined);
}

/**
 * The territory the edge's geolocation suggests, for a reader who has never
 * chosen one — read off the attribute `src/worker.ts` wrote on the shell's
 * `<html>`, which `lib/geo.ts` argues for and normalises.
 *
 * A GUESS RANKS BELOW A CHOICE AND ABOVE THE DEFAULT, which is the whole of
 * the ordering: `?c=` beats the preference for the sharing reason above, the
 * preference beats this because it is the reader's own word, and this beats
 * the general calendar because opening a reader in Lisbon on Rome's calendar
 * is also a guess — just the one that is wrong more often.
 *
 * IT IS NOT REMEMBERED. An address is a fact about where the reader is now,
 * and a reader who moves country, or who read one page through a VPN, would
 * otherwise be held in a territory they never picked by a key that claims
 * they did. Not writing keeps `storedTerritory` meaning exactly one thing —
 * the reader pressed something — and leaves this free to be right again
 * tomorrow.
 *
 * THE LANGUAGE NEGOTIATION IN `i18n.svelte.ts` USED TO BE THE COUNTER-EXAMPLE
 * HERE, saving its detected answer so later visits stayed stable. It stopped:
 * a saved answer is indistinguishable from a chosen one, and it silently
 * outranked the language a country calendar's own address names (that file's
 * `initialLang`). Both guesses are now recomputed per load, and this rule is
 * the site's rule rather than this file's.
 *
 * Undefined everywhere the attribute is absent, which is every environment
 * but production: `npm run dev` and `npm run preview` serve the shell without
 * the worker, so the calendar opens general there. Validating the code is the
 * caller's job — see `lib/geo.ts` on why the edge cannot know which
 * territories have a published calendar.
 */
export function detectedTerritory(): string | undefined {
	if (typeof document === 'undefined') return undefined;
	return document.documentElement.getAttribute(GEO_ATTRIBUTE) || undefined;
}

/**
 * The territory `/calendarium` opens in for a reader who did not name one,
 * or `undefined` to stay in the general calendar.
 *
 * THE ORDER IS THE ARGUMENT AND IT IS THE ONLY THING HERE: what the reader
 * chose here before, because it is their own word; then where the network
 * says they are, because the alternative is not "no guess" — opening a reader
 * in Lisbon on Rome's calendar is a guess too, and the one that is wrong more
 * often.
 *
 * A `?c=` OUTRANKS BOTH AND IS NOT ARGUED HERE. It is the sharing rule at the
 * top of this file, and it belongs to the page that HAS an address for a
 * calendar: `/calendarium` returns before it reaches this, and the home page
 * — which shows today in the reader's own calendar and has no `?c=` in its
 * grammar — has nothing to check.
 *
 * `??` AND NOT `||` IN THE MIDDLE, which is the whole reason `'general'` is
 * stored rather than cleared: a reader who went back to the general calendar
 * has made a choice, it is a stored value, and it stops the chain here rather
 * than falling through to a country they did not ask for. An absent key is
 * then the only state meaning nobody has said anything yet.
 *
 * `published` IS PASSED IN AND NOT IMPORTED. `TERRITORY_CALENDARS` is derived
 * from eighty-five layer files that build a 184 KB chunk, and this module is
 * imported for a string in `localStorage`; a static import of the calendar
 * data here would put the whole of it wherever this is read, which is the
 * boot-chunk trap site/CLAUDE.md names three ways of falling into. The home
 * page passes what `layers.svelte.ts` has FETCHED for exactly that reason,
 * and `/calendarium` its own static import, which is a page whose subject is
 * the layers. It is also what makes the ordering testable in Node, where
 * neither `localStorage` nor `document` exists and both readers above answer
 * `undefined` for the wrong reason.
 */
export function openingTerritory(
	stored: string | undefined,
	detected: string | undefined,
	published: Record<string, string>
): string | undefined {
	const opening = stored ?? detected;
	if (!opening || opening === 'general' || !published[opening]) return undefined;
	return opening;
}
