import { error } from '@sveltejs/kit';
import {
	cccLangs,
	getAdjacentCccParagraphNumber,
	getCccBreadcrumb,
	getCccChapterFor,
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
 * (`$lib/content.svelte.ts`) and this route renders only in the browser
 * (`ssr = false`, `+layout.ts`, docs/decisions.md §The site) — but `load`
 * only re-runs on navigation, not when a stored preference changes on its
 * own, so reading it there wouldn't keep the page honest anyway. Cheap to
 * embed: one
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
	/**
	 * The chapter this paragraph sits in, for the "read the full chapter"
	 * link. Carries only what the link needs — its start paragraph (the
	 * `/catechismus/caput/[n]` address) and its title/range for the label — never
	 * the chapter's text, which would multiply this page's payload by ~90x
	 * to render one link (corpus.ts's "COARSE FETCH, NARROW RETURN").
	 * Undefined for a paragraph no chapter-sized node contains.
	 */
	chapter: { start: number; end: number; node: CccNode } | undefined;
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
		const chapterNode = getCccChapterFor(lang, n);
		byLang[lang] = {
			paragraph,
			work,
			breadcrumb: getCccBreadcrumb(lang, n),
			prev: prevN !== undefined ? { n: prevN } : undefined,
			next: nextN !== undefined ? { n: nextN } : undefined,
			chapter: chapterNode
				? {
						start: chapterNode.paragraphs[0] as number,
						end: chapterNode.paragraphs[1] as number,
						node: chapterNode
					}
				: undefined
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'CCC paragraph not found in this corpus');
	}

	return { n, byLang };
};
