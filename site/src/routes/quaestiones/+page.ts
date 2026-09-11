import { loadQuaestiones } from '$lib/corpus';
import { primeForPath } from '$lib/index-priming';
import type { PageLoad } from './$types';

/**
 * Prerendered. `src/routes/+page.ts` holds the argument and the measurement.
 *
 * THE QUALIFICATION IS THE SAME ONE AND IT IS NOT `CHROME_PATHS`. The other
 * prerendered landings each cite their membership, because for them the two
 * questions have one answer; this page is in `STATIC_PATHS` instead, for the
 * reason `site/docs/addresses.md` gives — the gate on a prefixed cluster is
 * whether all 37 dictionaries hold its strings, and the topics are written in
 * two. That decides which ADDRESSES exist, and says nothing about whether the
 * bare one is worth writing to disk. What decides that is whether every word
 * on the page is the interface, and here it is: the shelf headings, a title and
 * a question per topic, and a tagline — the dictionary, and not one line of
 * corpus prose. A stranger arriving from a search result is exactly this
 * page's audience, which is the whole of why the landings pay for it.
 *
 * THE TOPIC LIST RIDES ALONG, which is the part the other landings have no
 * equivalent of: `load` returns data, so the index is serialized into the
 * prerendered document and the reader's first paint no longer waits on the
 * fetch below. Under `ssr = false` it could not be — the layout's `load` is
 * `null` on the server and this one never ran.
 *
 * NOT `/quaestiones/{slug}`, and for `/documenta/{slug}`'s reason: a topic
 * page is the corpus's own prose in whichever of nine languages the reader
 * has chosen, and a build cannot know which.
 */
export const ssr = true;
export const prerender = true;

/**
 * The whole topic index, which is a few kilobytes and is fetched once.
 *
 * `undefined` rather than an empty index for a build that has no topics — the
 * fixtures and any partial sync — so the page can say the list has not been
 * written rather than drawing an empty page. Same distinction `loadCensus`
 * makes and for the same reason.
 *
 * `await parent()` first, the wait every `+page.ts` here owes the layout's
 * index priming — and then the same priming again, because on the SERVER the
 * layout's `load` does not exist: SvelteKit sets `load: null` on the server
 * node of any node declaring `ssr = false`, and the root layout declares it.
 * Without this line a prerendered page renders against empty registries and
 * says so only as a warning. `primeForPath` holds the whole argument.
 */
export const load: PageLoad = async ({ parent, url }) => {
	await parent();
	await primeForPath(url.pathname);
	return { index: await loadQuaestiones() };
};
