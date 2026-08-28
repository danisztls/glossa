import { error } from '@sveltejs/kit';
import { getSummaQuestionAsync, getWork, listSummaQuestions, summaLangs } from '$lib/corpus';
import { summaPartFromSlug } from '$lib/route-manifest';
import type { SummaQuestion, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

export interface SummaQuestionByLang {
	question: SummaQuestion;
	work: WorkManifest;
	prev?: { n: number };
	next?: { n: number };
}

/**
 * Every edition's copy of one question, for the same reason
 * `/catechismus/compendium/[n]` embeds both languages: the URL is edition-free, the
 * edition comes from a stored preference applied client-side, and `load`
 * re-runs on navigation rather than when that preference changes. So the
 * component picks reactively from what is already here.
 *
 * The Summa makes that pattern do more work than it does elsewhere. Its two
 * editions do not cover the same address space — the Latin has no
 * Supplement — so `byLang` is routinely a ONE-entry map, and which one it is
 * varies by address rather than by work. A Portuguese reader gets English
 * here always; a Latin-preferring reader gets Latin for parts I to III and
 * English for the Supplement. Both fall out of the component asking
 * `content.langFor('summa')` and taking what `byLang` actually has, in the
 * fallback order `corpus.ts` declares.
 */
export const load: PageLoad = async ({ params }) => {
	const part = summaPartFromSlug(params.part);
	if (!part) error(404, 'No such part of the Summa');

	const n = Number(params.q);
	if (!Number.isSafeInteger(n) || n < 1) error(404, 'Not a question number');

	const byLang: Partial<Record<string, SummaQuestionByLang>> = {};
	for (const lang of summaLangs()) {
		const work = getWork(`summa.${lang}`);
		if (!work) continue;
		const question = await getSummaQuestionAsync(work.id, part, n);
		if (!question) continue; // this edition does not carry the address (the Latin Supplement)

		// Adjacency within the PART, from the index tier — question numbers
		// restart at 1 in each part, so `n - 1` is not the previous question
		// at a part boundary, it is a different question entirely.
		const numbers = listSummaQuestions(lang)
			.filter((q) => q.part === part)
			.map((q) => q.n)
			.sort((a, b) => a - b);
		const at = numbers.indexOf(n);
		byLang[lang] = {
			question,
			work,
			prev: at > 0 ? { n: numbers[at - 1] } : undefined,
			next: at >= 0 && at < numbers.length - 1 ? { n: numbers[at + 1] } : undefined
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'Summa question not found in this corpus');
	}

	return { part, n, byLang };
};
