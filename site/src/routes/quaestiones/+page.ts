import { loadQuaestiones } from '$lib/corpus';
import type { PageLoad } from './$types';

/**
 * The whole topic index, which is a few kilobytes and is fetched once.
 *
 * `undefined` rather than an empty index for a build that has no topics — the
 * fixtures and any partial sync — so the page can say the list has not been
 * written rather than drawing an empty page. Same distinction `loadCensus`
 * makes and for the same reason.
 */
export const load: PageLoad = async ({ parent }) => {
	await parent();
	return { index: await loadQuaestiones() };
};
