import { error } from '@sveltejs/kit';
import {
	getAdjacentSocialDoctrineNumber,
	getSocialDoctrineParagraphAsync,
	getWork,
	loadSocialDoctrineOutline,
	socialDoctrineChapterFor,
	socialDoctrineLangs,
	socialDoctrineWorkId
} from '$lib/corpus';
import type { DocumentSection, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * One numbered paragraph of the Compendium of the Social Doctrine, in every
 * language the corpus has it in.
 *
 * SHAPED LIKE `/catechismus/[n]` AND NOT LIKE `/documenta/[slug]`, which is
 * the whole of what this work's own type is for: the address names a
 * paragraph, so the page embeds one paragraph per language and switches
 * between them client-side, rather than embedding a whole document and
 * scrolling to a fragment of it. `prev`/`next` carry only a number, for the
 * reason that route records — the page links to them and never shows them.
 *
 * They are also not `n ± 1`: three editions do not carry all 583 paragraphs
 * (`getAdjacentSocialDoctrineNumber`).
 */
interface SocialDoctrineLangData {
	paragraph: DocumentSection;
	work: WorkManifest;
	prev: { n: number } | undefined;
	next: { n: number } | undefined;
	/** The division this paragraph sits in, for the "read the whole chapter"
	 *  link. Its span only — the name comes from the outline, which the page
	 *  already holds for its own sidebar. */
	chapter: [number, number] | undefined;
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);

	const byLang: Partial<Record<string, SocialDoctrineLangData>> = {};
	for (const lang of socialDoctrineLangs()) {
		const work = getWork(socialDoctrineWorkId(lang));
		if (!work) continue;
		const paragraph = await getSocialDoctrineParagraphAsync(lang, n);
		if (!paragraph) continue;
		// The outline is a content-tier file and the sidebar needs it in
		// whichever language the reader ends up in, which this loader cannot
		// know: `content.langFor` is a client preference the page reads, not
		// a parameter of the address. One ~25 KB file per edition that has
		// this paragraph, cached for every other paragraph of it.
		await loadSocialDoctrineOutline(lang);
		const prevN = getAdjacentSocialDoctrineNumber(lang, n, 'prev');
		const nextN = getAdjacentSocialDoctrineNumber(lang, n, 'next');
		byLang[lang] = {
			paragraph,
			work,
			prev: prevN !== undefined ? { n: prevN } : undefined,
			next: nextN !== undefined ? { n: nextN } : undefined,
			chapter: socialDoctrineChapterFor(lang, n)
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'Paragraph not found in the Compendium of the Social Doctrine');
	}

	return { n, byLang };
};
