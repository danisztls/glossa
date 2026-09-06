/**
 * The three territories `Intl.DisplayNames` cannot name.
 *
 * ITS OWN MODULE, IMPORTING NOTHING, and that is the whole reason it is not
 * in `./index.ts` any more: the picker's trigger has to print the name of the
 * calendar the reader keeps before anything has been fetched, and reaching
 * for these three through the index would pull all eighty-five layers — 184 KB
 * — into whatever chunk asked (`layers.svelte.ts`). The index re-exports it,
 * so nothing that imported it from there had to change.
 */

/**
 * England, Scotland and Wales keep three different calendars and none of them
 * has an ISO 3166-1 country code, so their ids are 3166-2 SUBDIVISION tags
 * and `Intl.DisplayNames({ type: 'region' })` answers nothing for them. Every
 * other territory in the picker is named by the platform in the reader's own
 * language, which is the whole reason there is no table of country names in
 * this repo; these three are English-only until someone asks otherwise, which
 * is better than the alternative of a bare `GB-ENG`.
 */
export const SUBDIVISION_NAMES: Record<string, string> = {
	'gb-eng': 'England',
	'gb-sct': 'Scotland',
	'gb-wls': 'Wales'
};
