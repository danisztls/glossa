import { error } from '@sveltejs/kit';
import {
	baseLang,
	getAdjacentDocumentSectionNumber,
	getDocumentBreadcrumb,
	getDocumentGroup,
	getDocumentSectionAsync
} from '$lib/corpus';
import type { DocumentManifest, DocumentSection, StructureNode } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * Everything the page needs to render section `n` of one document in ONE
 * language — the document-route analogue of `ccc/[n]/+page.ts`. Document
 * URLs are edition-free (`/documents/{slug}/{n}`, docs/corpus-schema.md
 * §Documents extending docs/decisions.md #2's convention) and the whole
 * site is prerendered with no server to consult a client preference at
 * request time, so — same reasoning as the CCC/Compendium — this embeds
 * EVERY language this document has section `n` in, keyed by bare language,
 * and the component picks which one to show reactively from
 * `content.documentLangFor(slug)`.
 */
export interface DocumentSectionByLang {
	section: DocumentSection;
	work: DocumentManifest;
	breadcrumb: StructureNode[];
	prev?: { n: number };
	next?: { n: number };
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);
	const slug = params.slug;
	const group = getDocumentGroup(slug);
	if (!group) error(404, 'Document not found in this corpus');

	const byLang: Record<string, DocumentSectionByLang> = {};
	for (const manifest of Object.values(group.manifests)) {
		if (!manifest) continue;
		const lang = baseLang(manifest.language);
		const section = await getDocumentSectionAsync(manifest.id, n);
		if (!section) continue; // this language's edition doesn't have section `n` (a v1 EN/PT asymmetry)
		const prevN = getAdjacentDocumentSectionNumber(manifest.id, n, 'prev');
		const nextN = getAdjacentDocumentSectionNumber(manifest.id, n, 'next');
		byLang[lang] = {
			section,
			work: manifest,
			breadcrumb: getDocumentBreadcrumb(manifest.id, n),
			prev: prevN !== undefined ? { n: prevN } : undefined,
			next: nextN !== undefined ? { n: nextN } : undefined
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'Document section not found in this corpus');
	}

	return { slug, n, byLang };
};
