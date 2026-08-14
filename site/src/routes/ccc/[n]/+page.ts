import { error } from '@sveltejs/kit';
import { getAdjacentCccParagraph, getCccBreadcrumb, getCccParagraph } from '$lib/corpus';
import type { PageLoad } from './$types';

const LANG = 'en';

export const load: PageLoad = ({ params }) => {
	const n = Number(params.n);
	const paragraph = getCccParagraph(LANG, n);

	if (!paragraph) {
		error(404, 'CCC paragraph not found in this fixture corpus');
	}

	return {
		lang: LANG,
		n,
		paragraph,
		breadcrumb: getCccBreadcrumb(LANG, n),
		prev: getAdjacentCccParagraph(LANG, n, 'prev'),
		next: getAdjacentCccParagraph(LANG, n, 'next')
	};
};
