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
 * the next visit.
 */

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
