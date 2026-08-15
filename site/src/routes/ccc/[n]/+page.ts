import { error } from '@sveltejs/kit';
import {
	getAdjacentCccParagraph,
	getCccBreadcrumb,
	getCccParagraph,
	getWork
} from '$lib/corpus';
import type { PageLoad } from './$types';

const LANG = 'en';

export const load: PageLoad = ({ params }) => {
	const n = Number(params.n);
	const paragraph = getCccParagraph(LANG, n);
	const work = getWork(`ccc.${LANG}`);

	if (!paragraph || !work) {
		error(404, 'CCC paragraph not found in this corpus');
	}

	return {
		lang: LANG,
		n,
		paragraph,
		work,
		breadcrumb: getCccBreadcrumb(LANG, n),
		prev: getAdjacentCccParagraph(LANG, n, 'prev'),
		next: getAdjacentCccParagraph(LANG, n, 'next')
	};
};
