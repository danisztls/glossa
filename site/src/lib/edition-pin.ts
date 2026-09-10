/**
 * The edition a SHARED LINK asked for.
 *
 * A canonical URL on this site is edition-free, and that is not negotiable:
 * `/catechismus/27` names a paragraph, and which edition renders it is the
 * reader's standing preference (`site/docs/addresses.md`). This does not
 * change that. The pin is a QUERY PARAMETER on a canonical path — the same
 * shape `?compare=` and `?c=` already have — and it decorates one visit
 * rather than naming a second address for the same text. The path a crawler,
 * a sitemap and a citation see is unchanged.
 *
 * IT EXISTS BECAUSE A LINK AND A BOOKMARK ARE DIFFERENT ARTIFACTS. A bookmark
 * must stay edition-free: that is what lets a verse marked in the Clementina
 * still be the right bookmark when the reader comes back in Portuguese. A link
 * handed to somebody else wants the opposite — it should show them what the
 * sender was looking at, and the passage a highlight names is only findable in
 * the edition whose words were highlighted.
 *
 * IT IS NOT ADOPTED AS A PREFERENCE, which is where it follows `?c=` rather
 * than `?compare=`, and the calendar's rule says why: a territory is a fact
 * about a person in a way a column layout is not. So is an edition — which
 * translation somebody reads is their language and their tradition, and a
 * link from a friend is not a decision to change it. Arriving on a pinned
 * link shows that edition for that page and leaves the reader's own choice
 * untouched; the pin dies at the next address.
 *
 * WHICH IS ALSO WHY PICKING AN EDITION HAS TO DROP IT. A pin that outlived an
 * explicit choice from the edition menu would make that menu look broken: the
 * reader picks a language, the parameter wins, and nothing on the page moves.
 * `EditionMenu` releases it on every pick.
 *
 * PURE, and takes the URL rather than reading `page.url` itself, on
 * `compare.ts`'s precedent — the parameter's name and meaning are wanted by
 * `selection.ts`, which writes the link and must not drag SvelteKit into a
 * module the tests import.
 */

/** The query parameter naming an edition. Short because it rides along with a
 *  text directive that is already long. */
export const EDITION_PARAM = 'ed';

/**
 * The pinned edition, when the address names one AND this page actually has
 * it.
 *
 * `available` is the guard, not a formality: a pin travels with a URL, and a
 * URL gets edited, forwarded and truncated. An id naming no edition here has
 * to fall through to the reader's own preference rather than render nothing
 * or throw — the same "degrade, don't fabricate" posture `resolveTarget`
 * takes for a compare target that isn't on the current route.
 */
export function pinnedEdition(url: URL, available: readonly string[]): string | undefined {
	const pinned = url.searchParams.get(EDITION_PARAM);
	return pinned && available.includes(pinned) ? pinned : undefined;
}

/** The same address with the pin dropped — what an explicit edition pick
 *  navigates to, so the address stops claiming something that is no longer
 *  true. Returns `undefined` when there was no pin, which is the common case
 *  and needs no navigation at all. */
export function withoutEditionPin(url: URL): string | undefined {
	if (!url.searchParams.has(EDITION_PARAM)) return undefined;
	const next = new URL(url);
	next.searchParams.delete(EDITION_PARAM);
	return `${next.pathname}${next.search}${next.hash}`;
}
