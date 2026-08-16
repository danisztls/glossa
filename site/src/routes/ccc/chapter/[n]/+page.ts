import { error } from '@sveltejs/kit';
import {
	cccLangs,
	getCccChapterFor,
	getCccParagraphRangeAsync,
	getWork,
	listCccChapters
} from '$lib/corpus';
import type { CccNode, CccParagraph, WorkManifest } from '$lib/types';
import type { EntryGenerator, PageLoad } from './$types';

/**
 * Whole-chapter reading view, addressed by the chapter's first paragraph
 * number (`corpus.ts`'s `listCccChapters` explains why that address and not
 * a slug or ordinal).
 *
 * Same per-language embedding shape as the single-paragraph route
 * (`ccc/[n]/+page.ts`) and for the same reason: content language is a
 * client-side preference and this route is prerendered, so there is no
 * request in which to resolve it. The cost is higher here — a chapter's full
 * text per language rather than one paragraph — but still bounded by the
 * CCC's largest chapter, and it buys instant language switching mid-chapter
 * with no refetch.
 */
export interface CccChapterLangData {
	chapter: CccNode;
	paragraphs: CccParagraph[];
	work: WorkManifest;
}

/**
 * Chapters are enumerated across EVERY language, not just one, and unioned
 * by start paragraph. EN and PT structure trees genuinely diverge
 * (docs/decisions.md's language symmetry principle — ccc.pt has 480
 * structure nodes to ccc.en's 396), so a chapter boundary present in only
 * one language still needs its page: with `prerender.handleHttpError:
 * 'fail'`, a link the PT tree emits to a page the EN tree never generated
 * would fail the whole build.
 */
export const entries: EntryGenerator = () => {
	const starts = new Set<number>();
	for (const lang of cccLangs()) {
		for (const chapter of listCccChapters(lang)) starts.add(chapter.paragraphs[0] as number);
	}
	return [...starts].sort((a, b) => a - b).map((n) => ({ n: String(n) }));
};

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
