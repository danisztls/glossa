import { error } from '@sveltejs/kit';
import { baseLang, getBookIntro, getChapter, getWork, listBibleWorks } from '$lib/corpus';
import type { BibleBookMeta } from '$lib/corpus-index';
import type { BibleIntro, Chapter, WorkManifest } from '$lib/types';
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

/**
 * This route's data, for both of the things it serves: a chapter of scripture
 * and a book's introduction. Declared as one type, and returned as one shape
 * with an empty half, rather than a union — the component reads `byWorkId` in
 * a dozen places and every one of them would otherwise need to re-narrow.
 * `introByLang` present is what says which of the two this is.
 */
interface BiblePageData {
	osis: string;
	chapterN: number;
	byWorkId: Record<string, BibleEditionData>;
	introByLang?: Record<string, BibleIntro>;
}

/**
 * Chapter 0 — a book's introduction (docs/corpus-schema.md §Book
 * introductions). Carried in route data as `introByLang`, keyed by LANGUAGE
 * rather than by work id, because that is how it is stored: one introduction
 * per language, shared by that language's editions.
 *
 * Every available language is loaded, exactly as every edition is loaded for
 * an ordinary chapter, so the reader can switch edition without a refetch and
 * the component decides what to show. There is one language today, so this
 * costs a single small fetch; the shape is what keeps adding Portuguese from
 * being a route change.
 */
export const load: PageLoad = async ({ params }): Promise<BiblePageData> => {
	const chapterN = Number(params.chapter);

	if (chapterN === 0) {
		const introByLang: Record<string, BibleIntro> = {};
		for (const manifest of listBibleWorks()) {
			const lang = baseLang(manifest.language);
			if (introByLang[lang]) continue;
			const intro = await getBookIntro(lang, params.book);
			if (intro) introByLang[lang] = intro;
		}
		// 404 only when NO language introduces this book — the same rule the
		// edition loop below uses, one level up. Genesis has an introduction and
		// 4 Kings does not (Challoner prints one preface for both volumes), so
		// `/scriptura/2kgs/0` is genuinely not an address; the edge already
		// refuses it too, since `corpus-routes.json` only carries a 0 for books
		// that have one.
		if (Object.keys(introByLang).length === 0) {
			error(404, 'This book has no introduction');
		}
		return { osis: params.book, chapterN, byWorkId: {}, introByLang };
	}

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
