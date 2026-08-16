import { error } from '@sveltejs/kit';
import { editionToWorkId, getChapter, getWork } from '$lib/corpus';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const workId = editionToWorkId(params.edition);
	const work = getWork(workId);
	const chapterN = Number(params.chapter);
	// `getChapter` reads the whole book (content tier, cached per book — see
	// corpus.ts's docblock) but returns only book METADATA plus this one
	// `Chapter`'s verses, so this page's prerendered data stays chapter-sized
	// regardless of how long the book is.
	const found = await getChapter(workId, params.book, chapterN);

	// 404s here, rather than crashing, are how language/edition symmetry
	// (docs/decisions.md "Language symmetry principle") degrades gracefully:
	// the edition selector (EditionMenu) navigates straight to
	// `/bible/{edition}/{osis}/{chapter}` in the target edition, and while
	// both v1 editions are complete at 73/73 chapters, this route must not
	// assume that stays true — a chapter present in one edition and absent
	// in another lands here instead of throwing.
	if (!work || !found) {
		error(404, 'This chapter does not exist in this edition of the Bible');
	}

	return {
		workId,
		edition: params.edition,
		osis: params.book,
		chapterN,
		work,
		book: found.book,
		chapter: found.chapter
	};
};
