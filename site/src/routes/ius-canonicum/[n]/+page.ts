import { error } from '@sveltejs/kit';
import {
	canonLawLangs,
	canonLawTitleFor,
	canonLawWorkId,
	getAdjacentCanonNumber,
	getCanonAsync,
	getWork,
	loadCanonLawOutline
} from '$lib/corpus';
import type { DocumentSection, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * One canon of the Code, in every language the corpus has it in.
 *
 * SHAPED LIKE `/doctrina-socialis/[n]`, which is shaped like
 * `/catechismus/[n]`: the address names a canon, so the page embeds one canon
 * per language and switches between them client-side rather than embedding a
 * whole book and scrolling to a fragment of it.
 *
 * `prev`/`next` carry only a number, for the reason those routes record — the
 * page links to them and never shows them. They are also not `n ± 1`: two
 * editions do not carry all 1,752 canons (`getAdjacentCanonNumber`).
 */
interface CanonLawLangData {
	canon: DocumentSection;
	work: WorkManifest;
	prev: { n: number } | undefined;
	next: { n: number } | undefined;
	/** The reading unit this canon sits in, for the "read the whole title"
	 *  link. Its span only — the name comes from the outline, which the page
	 *  already holds for its own sidebar. */
	title: [number, number] | undefined;
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);

	const byLang: Partial<Record<string, CanonLawLangData>> = {};
	for (const lang of canonLawLangs()) {
		const work = getWork(canonLawWorkId(lang));
		if (!work) continue;
		const canon = await getCanonAsync(lang, n);
		if (!canon) continue;
		// The outline is a content-tier file and the sidebar needs it in
		// whichever language the reader ends up in, which this loader cannot
		// know: `content.langFor` is a client preference the page reads, not a
		// parameter of the address. One file per edition that has this canon,
		// cached for every other canon of it.
		await loadCanonLawOutline(lang);
		const prevN = getAdjacentCanonNumber(lang, n, 'prev');
		const nextN = getAdjacentCanonNumber(lang, n, 'next');
		byLang[lang] = {
			canon,
			work,
			prev: prevN !== undefined ? { n: prevN } : undefined,
			next: nextN !== undefined ? { n: nextN } : undefined,
			title: canonLawTitleFor(lang, n)
		};
	}

	if (Object.keys(byLang).length === 0) error(404, 'Canon not found in the Code of Canon Law');

	return { n, byLang };
};
