/**
 * The national layers, fetched when a reader turns out to want one.
 *
 * ## Why anything at all stands between a page and `./national`
 *
 * Because of what that directory weighs: eighty-five layer files build one
 * 184 KB chunk (measured 2026-09-06 in `build/_app/immutable/nodes/`), and
 * `/calendarium` is a route a reader arrives at deliberately while the home
 * page is the one every reader boots on. A static import there would put all
 * of it in the boot payload, which is 0.47 MB with a deploy-time ceiling over
 * it (site/CLAUDE.md §The boot payload has a ceiling) — a third again, to
 * answer a question most readers will never ask.
 *
 * So `/calendarium` imports `./national` outright, because the layers ARE its
 * subject, and everything else comes through here. This is `names.svelte.ts`'s
 * arrangement exactly, one directory up and for the same accounting: the cost
 * of a country is paid by the reader who keeps one.
 *
 * ## Lazy DATA, not a lazy reader
 *
 * The site's rule, and the shape it takes here: `residentOptions` and its two
 * neighbours are SYNCHRONOUS and answer `undefined` before the chunk lands, so
 * a component calls them from render without awaiting anything; the `$state`
 * below is what re-renders it when the chunk arrives. What must not happen is
 * a fetch started from inside a render nobody is waiting for, so `ensure` is
 * called from an effect or from a handler — never from a getter.
 *
 * A reader on the home page therefore sees the general calendar for as long
 * as the fetch takes and their own calendar after, which is the same
 * degradation `celebrationName` has when a language's table is still in
 * flight: the answer is never wrong, only sometimes less specific than it will
 * be a moment later.
 *
 * ## One promise, kept forever
 *
 * `pending` is the memo rather than `index`, so two callers in the same frame
 * — the card priming its own calendar and the picker priming its panel —
 * share one request. Nothing is ever evicted: the table is the whole of what a
 * reader could ask for, and a second fetch of it would buy nothing.
 */

import type { CalendarOptions } from './types';

type NationalIndex = typeof import('./national');

/** `$state.raw`, not `$state`: this is a frozen table of eighty-five layers
 *  and every celebration in them, and a deep proxy over it would be paid for
 *  on every read for a value nothing ever mutates. */
let index = $state.raw<NationalIndex | undefined>(undefined);
let pending: Promise<void> | undefined;

/** Fetch the layer table if it is not resident yet. Cheap to call again:
 *  after the first call it is the same promise, and on `/calendarium` — where
 *  the route already imports the module — it resolves without a request. */
export function ensureNationalCalendars(): Promise<void> {
	return (pending ??= import('./national').then((module) => {
		index = module;
	}));
}

/**
 * What `liturgicalDay` should compute under for this territory, IF the table
 * is resident — `undefined` meaning "not yet", which a caller renders as the
 * general calendar and re-renders out of.
 *
 * Note the two undefineds are different and both are answered the same way:
 * a table that has not landed and a territory that names no published
 * calendar both leave the reader in the general calendar, which is the right
 * answer to each.
 */
export function residentOptions(territory: string): CalendarOptions | undefined {
	return index?.calendarOptionsFor(territory);
}

/** Which calendar each territory keeps, if the table is resident — the map
 *  that decides whether a stored or geolocated code still names one. */
export function residentTerritories(): Record<string, string> | undefined {
	return index?.TERRITORY_CALENDARS;
}

/** The picker's regions, if the table is resident. */
export function residentRegions(): NationalIndex['CALENDAR_REGIONS'] | undefined {
	return index?.CALENDAR_REGIONS;
}
