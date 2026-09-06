/**
 * Where the reader is, as the network already knows it.
 *
 * `/calendarium` opens in a territory, and until a reader has picked one there
 * is only ever a guess to open on. This is the guess: Cloudflare resolves the
 * connecting address to a country and hands it to the worker in `request.cf`,
 * the worker writes it onto the shell's `<html>` as one attribute, and
 * `calendar-pref.ts` reads it back on arrival. It costs no request, no API, no
 * permission prompt, and nothing about the reader leaves the document that was
 * served to them — the answer was already in the connection.
 *
 * WHAT IT IS NOT IS THE BROWSER'S LOCALE. `navigator.language`'s region
 * subtag is the other free signal and it is a worse one for this question:
 * `en-US` is what a phone says in Lagos, Manila and Dublin alike, and a
 * reader's interface language is a fact about what they READ rather than
 * about which conference's calendar they keep. The Geolocation API is the
 * accurate answer and asks a permission prompt for a house number when the
 * question stops at the border. `ui-langs.ts` negotiates the language from
 * `navigator.languages` and this negotiates the territory from the edge,
 * because those are the signals the two questions actually have.
 *
 * IT RETURNS A HINT AND NOT A TERRITORY. Whether a code names a published
 * calendar is `TERRITORY_CALENDARS`' business, and that map is derived from
 * eighty-five layer files this worker must never import — the edge carries
 * names and manifests, never the corpus or its tables (site/docs/edge.md). So
 * this normalises a code and the client filters it, which also means a
 * calendar withdrawn by `held.ts` degrades here exactly as a typed `?c=`
 * does: to the general calendar, with nothing to remember.
 *
 * Cloudflare's non-answers need no special case for the same reason. `XX`
 * (unknown) and `T1` (a Tor exit) are shaped like country codes and name no
 * territory, so they fall out at the same filter every unlisted country does.
 *
 * IMPORTS NOTHING, which is what lets the edge worker have it — the rule
 * `ui-langs.ts` states and this file is the second instance of.
 */

/** Where the edge writes the hint, and where the client reads it. One
 *  constant, because an attribute name agreed by two modules that never
 *  import each other is the kind of string that drifts silently. */
export const GEO_ATTRIBUTE = 'data-geo';

/**
 * The United Kingdom is the one place a country code is not the answer.
 *
 * England, Scotland and Wales keep three different calendars, so `gb` names
 * none of them; the picker's ids for those are 3166-2 subdivisions
 * (`SUBDIVISION_NAMES` in `calendar/national/index.ts`) and the first-level
 * region Cloudflare resolves is exactly that distinction — `ENG`, `SCT`,
 * `WLS`, `NIR`.
 *
 * NORTHERN IRELAND IS DELIBERATELY ABSENT. Its dioceses belong to the Irish
 * conference rather than to any of the three, and answering `ie` here would
 * open a reader in one country on another country's calendar off our own
 * inference. A reader in Belfast gets the general calendar and one press of
 * the picker, which is what every unlisted territory gets.
 */
const GB_NATIONS: Readonly<Record<string, string>> = {
	ENG: 'gb-eng',
	SCT: 'gb-sct',
	WLS: 'gb-wls'
};

/**
 * The territory code the edge's geolocation suggests, or `undefined` where it
 * suggests nothing usable.
 *
 * Both arguments are nullable because Cloudflare's are: `country` and
 * `regionCode` are documented `string | null`, "if known". `region` is that
 * `regionCode`, read only for the United Kingdom and optional even there: an
 * isolate handed no region answers nothing for `gb` rather than picking the
 * most populous of the three, since the whole value of a default is that a
 * reader in Glasgow is not shown England's calendar as though someone had
 * chosen it.
 */
export function geoTerritory(
	country: string | null | undefined,
	region?: string | null
): string | undefined {
	const code = country?.trim().toLowerCase();
	if (!code || !/^[a-z]{2}$/.test(code)) return undefined;
	if (code === 'gb') return GB_NATIONS[region?.trim().toUpperCase() ?? ''];
	return code;
}
