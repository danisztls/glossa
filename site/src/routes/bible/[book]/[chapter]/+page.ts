import { error } from '@sveltejs/kit';
import { getChapter, getWork, listBibleWorks, listCanonicalBooks } from '$lib/corpus';
import type { BibleBookMeta } from '$lib/corpus-index';
import type { Chapter, WorkManifest } from '$lib/types';
import type { EntryGenerator, PageLoad } from './$types';

/**
 * A Bible chapter at an EDITION-FREE address: `/bible/{book}/{chapter}`.
 *
 * The Bible used to be the site's one exception to docs/decisions.md #2's
 * "URLs stay edition-free" convention — CCC, Compendium and documents all
 * addressed content without naming an edition, while scripture carried
 * `/bible/{edition}/{book}/{chapter}`. That exception cost more than it
 * bought. A URL is a permanent public identity, and pinning the edition into
 * it meant every shared link, every cross-reference from the Catechism, and
 * every bookmark silently asserted a translation choice the reader may not
 * have made. It also meant switching interface language couldn't switch the
 * text without a redirect, since the URL outranked the preference.
 *
 * So this route embeds EVERY edition, keyed by work id, exactly as
 * `ccc/[n]/+page.ts` embeds every language — and for the same reason: the
 * page is prerendered, so a client-side edition preference has no request in
 * which to be resolved. The cost is one chapter of text per extra edition,
 * which is the same total bytes the old scheme shipped across twice as many
 * pages, and it buys instant edition switching with no navigation at all.
 */
export interface BibleEditionData {
	work: WorkManifest;
	/** Index-tier book metadata (`getChapter`'s narrow return), not the full book. */
	book: BibleBookMeta;
	chapter: Chapter;
}

/**
 * Enumerated from the CANONICAL book/chapter union rather than from any one
 * edition (`listCanonicalBooks` — docs/decisions.md #4, "structure is
 * independent of the content version"), so a chapter present in only one
 * edition still gets a page. Being explicit rather than relying on the
 * prerender crawler also means a chapter no page happens to link to is still
 * built, which matters now that the picker links are edition-free and no
 * longer vary per edition.
 */
export const entries: EntryGenerator = () =>
	listCanonicalBooks().flatMap((book) =>
		book.chapters.map((n) => ({ book: book.osis, chapter: String(n) }))
	);

export const load: PageLoad = async ({ params }) => {
	const chapterN = Number(params.chapter);

	const byWorkId: Record<string, BibleEditionData> = {};
	for (const manifest of listBibleWorks()) {
		const work = getWork(manifest.id);
		if (!work) continue;
		// `getChapter` reads the whole book (content tier, cached per book — see
		// corpus.ts's docblock) but returns only book METADATA plus this one
		// chapter's verses, so the prerendered payload stays chapter-sized
		// regardless of how long the book is.
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
