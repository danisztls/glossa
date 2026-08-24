import { error } from '@sveltejs/kit';
import { cccLangs, getCccChapterFor, getCccParagraphRangeAsync, getWork } from '$lib/corpus';
import type { CccNode, CccParagraph, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * Whole-chapter reading view, addressed by the chapter's first paragraph
 * number (`corpus.ts`'s `listCccChapters` explains why that address and not
 * a slug or ordinal).
 *
 * The SPA requests the language editions needed for this reading view rather
 * than serialising a separate HTML document for every chapter start.
 */
export interface CccChapterLangData {
	chapter: CccNode;
	paragraphs: CccParagraph[];
	work: WorkManifest;
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);

	const byLang: Partial<Record<string, CccChapterLangData>> = {};
	for (const lang of cccLangs()) {
		const work = getWork(`ccc.${lang}`);
		if (!work) continue;
		// Resolve the chapter from `n` rather than trusting `n` to BE a chapter
		// start in this language: a start that exists in one language's tree
		// may fall mid-chapter in the other's, and landing mid-chapter should
		// still show the whole enclosing chapter rather than nothing.
		const chapter = getCccChapterFor(lang, n);
		if (!chapter) continue;
		const [from, to] = chapter.paragraphs as [number, number];
		const paragraphs = await getCccParagraphRangeAsync(lang, from, to);
		if (paragraphs.length === 0) continue;
		byLang[lang] = { chapter, paragraphs, work };
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'No CCC chapter contains this paragraph in this corpus');
	}

	return { n, byLang };
};
