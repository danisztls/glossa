import { error } from '@sveltejs/kit';
import { getDocumentGroup } from '$lib/corpus';
import type { PageLoad } from './$types';

/**
 * Just a slug-existence check. Unlike `ccc/[n]/+page.ts`/`compendium/[n]/
 * +page.ts`, this route needs no async content and no per-language data
 * bundle: a document's `manifest`/`structure.json` are both INDEX tier
 * (eager-inlined, synchronous — see `corpus.ts`'s "Documents" section), so
 * the page component reads them directly via `content.documentLangFor`/
 * `getDocumentGroup`/`getDocumentStructure`, the same reactive-not-loaded
 * pattern `ccc/+page.svelte`/`compendium/+page.svelte` already use for their
 * own TOC pages. The only job left for `load` is turning an unknown slug
 * into a proper 404 instead of a page that silently renders empty — worth
 * doing explicitly since `strict: true` prerendering (svelte.config.js)
 * means a bad link anywhere would otherwise fail the whole build with a
 * less specific error.
 */
export const load: PageLoad = ({ params }) => {
	if (!getDocumentGroup(params.slug)) {
		error(404, 'Document not found in this corpus');
	}
	return { slug: params.slug };
};
