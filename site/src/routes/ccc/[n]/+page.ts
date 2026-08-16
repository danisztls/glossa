import { error } from '@sveltejs/kit';
import {
	cccLangs,
	getAdjacentCccParagraphNumber,
	getCccBreadcrumb,
	getCccParagraphAsync,
	getWork
} from '$lib/corpus';
import type { CccNode, CccParagraph, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * Everything the page needs to render paragraph `n` in ONE language. The
 * page embeds one of these per language the corpus ships (see module
 * docblock below) rather than picking a language at load time, because
 * content language now follows a client-side preference
 * (`$lib/content.svelte.ts`) and this route is prerendered — there is no
 * server request to resolve that preference against. Cheap to embed: one
 * paragraph of text and a handful of structure nodes per extra language —
 * `prev`/`next` deliberately carry only `{ n }`, never the neighboring
 * paragraph's own text (corpus.ts's "COARSE FETCH, NARROW RETURN"): the
 * page only ever links to them by number, and embedding their content too
 * would silently double this page's payload for no reader-visible benefit.
 */
export interface CccLangData {
	paragraph: CccParagraph;
	work: WorkManifest;
	breadcrumb: CccNode[];
	prev: { n: number } | undefined;
	next: { n: number } | undefined;
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);

	// Embed every language the corpus has this paragraph in, keyed by bare
	// language tag, so the component can switch languages client-side
	// (`content.langFor('catechism')`) without a page reload — see
	// docs/decisions.md's language symmetry principle: the paragraph number
	// `n` is the shared canonical ID, only the language of what's shown at
	// it changes.
	const byLang: Partial<Record<string, CccLangData>> = {};
	for (const lang of cccLangs()) {
		const work = getWork(`ccc.${lang}`);
		if (!work) continue;
		const paragraph = await getCccParagraphAsync(lang, n);
		if (!paragraph) continue;
		const prevN = getAdjacentCccParagraphNumber(lang, n, 'prev');
		const nextN = getAdjacentCccParagraphNumber(lang, n, 'next');
		byLang[lang] = {
			paragraph,
			work,
			breadcrumb: getCccBreadcrumb(lang, n),
			prev: prevN !== undefined ? { n: prevN } : undefined,
			next: nextN !== undefined ? { n: nextN } : undefined
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'CCC paragraph not found in this corpus');
	}

	return { n, byLang };
};
