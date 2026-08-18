import { error } from '@sveltejs/kit';
import {
	compendiumLangs,
	getCompendiumChapterFor,
	getCompendiumQuestionRangeAsync,
	getWork
} from '$lib/corpus';
import type { CompendiumQuestion, StructureNode, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

export interface CompendiumChapterLangData {
	chapter: StructureNode;
	questions: CompendiumQuestion[];
	work: WorkManifest;
}

/** Whole Compendium structural unit, addressed by its opening question. */
export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);
	const byLang: Partial<Record<string, CompendiumChapterLangData>> = {};

	for (const lang of compendiumLangs()) {
		const work = getWork(`compendium.${lang}`);
		if (!work) continue;
		const chapter = getCompendiumChapterFor(lang, n);
		if (!chapter) continue;
		const [from, to] = chapter.paragraphs as [number, number];
		const questions = await getCompendiumQuestionRangeAsync(lang, from, to);
		if (questions.length === 0) continue;
		byLang[lang] = { chapter, questions, work };
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'No Compendium chapter contains this question in this corpus');
	}

	return { n, byLang };
};
