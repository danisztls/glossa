import { error } from '@sveltejs/kit';
import { editionToWorkId, getChapter, getWork } from '$lib/corpus';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const workId = editionToWorkId(params.edition);
	const work = getWork(workId);
	const chapterN = Number(params.chapter);
	const found = getChapter(workId, params.book, chapterN);

	if (!work || !found) {
		error(404, 'Chapter not found in this fixture corpus');
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
