import { error } from '@sveltejs/kit';
import {
	compendiumLangs,
	getAdjacentCompendiumQuestionNumber,
	getCompendiumBreadcrumb,
	getCompendiumQuestionAsync,
	getWork
} from '$lib/corpus';
import type { CompendiumQuestion, StructureNode, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

interface CompendiumQuestionByLang {
	question: CompendiumQuestion;
	work: WorkManifest;
	breadcrumb: StructureNode[];
	prev?: { n: number };
	next?: { n: number };
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);

	// Compendium URLs stay edition-free (site/docs/addresses.md: `/catechismus/compendium/1`,
	// never `/catechismus/compendium/en/1`) — the edition comes from a stored preference
	// applied client-side, and this route renders only in the browser
	// (`ssr = false`, `+layout.ts`) — but `load` only re-runs on navigation,
	// not when a stored preference changes on its own, so reading it there
	// wouldn't keep the page honest anyway. So this embeds EVERY
	// language's copy of question `n` up front; the component picks which
	// one to show reactively from `content.langFor('compendium')`. That's
	// what makes the "language symmetry principle" true: switching the UI
	// language swaps the words on screen but keeps the reader on the same
	// question number, because both languages' copies of it are already
	// sitting in this page's data. `prev`/`next` carry only `{ n }` — see
	// `ccc/[n]/+page.ts`'s docblock on why, same reasoning here.
	// `Partial<Record<…>>`, and not merely as a formality: both `continue`s
	// below skip a language, so a key's absence is a real, reachable state —
	// the same one `/catechismus/[n]` and `/catechismus/compendium/caput/[n]` already declare.
	const byLang: Partial<Record<string, CompendiumQuestionByLang>> = {};
	for (const lang of compendiumLangs()) {
		const work = getWork(`compendium.${lang}`);
		if (!work) continue;
		const question = await getCompendiumQuestionAsync(lang, n);
		if (!question) continue; // this language's corpus doesn't have question `n` (gappy fixtures)
		// Synchronous since the chunk split: adjacency reads the index, not
		// the content tier, which chunked would have meant fetching every
		// chunk to learn what the neighbouring number is.
		const prevN = getAdjacentCompendiumQuestionNumber(lang, n, 'prev');
		const nextN = getAdjacentCompendiumQuestionNumber(lang, n, 'next');
		byLang[lang] = {
			question,
			work,
			breadcrumb: getCompendiumBreadcrumb(lang, n),
			prev: prevN !== undefined ? { n: prevN } : undefined,
			next: nextN !== undefined ? { n: nextN } : undefined
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'Compendium question not found in this corpus');
	}

	return { n, byLang };
};
