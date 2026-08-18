import { error } from '@sveltejs/kit';
import { getChapter, getWork, listBibleWorks } from '$lib/corpus';
import type { BibleBookMeta } from '$lib/corpus-index';
import type { Chapter, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * A Scripture chapter at an EDITION-FREE address: `/scriptura/{book}/{chapter}`.
 *
 * The Bible used to be the site's one exception to docs/decisions.md #2's
 * "URLs stay edition-free" convention — CCC, Compendium and documents all
 * addressed content without naming an edition, while scripture carried
 * `/scriptura/{edition}/{book}/{chapter}`. That exception cost more than it
 * bought. A URL is a permanent public identity, and pinning the edition into
 * it meant every shared link, every cross-reference from the Catechism, and
 * every bookmark silently asserted a translation choice the reader may not
 * have made. It also meant switching interface language couldn't switch the
 * text without a redirect, since the URL outranked the preference.
 *
 * The SPA fetches this chapter's available editions into route data instead
 * of serialising them into a distinct HTML document per chapter. The reader
 * can still switch edition without changing the canonical address.
 */
export interface BibleEditionData {
	work: WorkManifest;
	/** Index-tier book metadata (`getChapter`'s narrow return), not the full book. */
	book: BibleBookMeta;
	chapter: Chapter;
}

export const load: PageLoad = async ({ params }) => {
	const chapterN = Number(params.chapter);

	const byWorkId: Record<string, BibleEditionData> = {};
	for (const manifest of listBibleWorks()) {
		const work = getWork(manifest.id);
		if (!work) continue;
		// `getChapter` reads the whole book (content tier, cached per book — see
		// corpus.ts's docblock) but returns only book METADATA plus this one
		// chapter's verses, keeping route data chapter-sized.
		const found = await getChapter(manifest.id, params.book, chapterN);
		if (!found) continue; // absent in this edition; another may still have it
		byWorkId[manifest.id] = { work, book: found.book, chapter: found.chapter };
	}

	// 404 only when NO edition has it. A chapter present in one edition and
	// missing from another is exactly the language/edition asymmetry
	// docs/decisions.md's symmetry principle expects to degrade gracefully,
	// and the page falls back to whichever edition does have it.
	if (Object.keys(byWorkId).length === 0) {
		error(404, 'This chapter does not exist in any edition of the Bible');
	}

	return { osis: params.book, chapterN, byWorkId };
};
