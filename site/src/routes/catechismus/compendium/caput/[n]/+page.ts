import { error } from '@sveltejs/kit';
import {
	compendiumLangs,
	getCompendiumChapterBreadcrumb,
	getCompendiumQuestionRangeAsync,
	getWork
} from '$lib/corpus';
import type { CompendiumQuestion, StructureNode, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

interface CompendiumChapterLangData {
	chapter: StructureNode;
	questions: CompendiumQuestion[];
	work: WorkManifest;
	/** The unit's ancestors, outermost first, with the unit itself last — the
	 *  crumb row above the text, per language for the reason
	 *  `/catechismus/caput/[n]`'s copy of this field states. */
	breadcrumb: StructureNode[];
}

/** Whole Compendium structural unit, addressed by its opening question. */
export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);
	const byLang: Partial<Record<string, CompendiumChapterLangData>> = {};

	for (const lang of compendiumLangs()) {
		const work = getWork(`compendium.${lang}`);
		if (!work) continue;
		const breadcrumb = getCompendiumChapterBreadcrumb(lang, n);
		const chapter = breadcrumb.at(-1);
		if (!chapter) continue;
		const [from, to] = chapter.paragraphs as [number, number];
		const questions = await getCompendiumQuestionRangeAsync(lang, from, to);
		if (questions.length === 0) continue;
		byLang[lang] = { chapter, questions, work, breadcrumb };
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'No Compendium chapter contains this question in this corpus');
	}

	return { n, byLang };
};
