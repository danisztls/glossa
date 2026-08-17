import { error } from '@sveltejs/kit';
import {
	baseLang,
	documentHasSections,
	getDocumentGroup,
	getDocumentSectionsAsync
} from '$lib/corpus';
import type { DocumentManifest, DocumentSection } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * Everything one document's page needs: its metadata in every language, and
 * its full text in one.
 *
 * THIS ROUTE IS THE WHOLE DOCUMENT. It absorbed the former
 * `documents/[slug]/read` (continuous full text) and `documents/[slug]/[n]`
 * (one page per numbered section) on 2026-08-17 — see docs/decisions.md. The
 * per-section route was 9,315 of the deployment's 15,256 prerendered files,
 * 61% of it, at ~21 KB each for a few hundred bytes of actual text; the rest
 * was the same chrome repeated. Section addresses did not go away, they became
 * fragments: `/documents/{slug}#s{n}`, against the `id="s{n}"` anchors the
 * continuous view already carried.
 *
 * ONE LANGUAGE'S SECTIONS ARE EMBEDDED, NOT EVERY LANGUAGE'S. A document's
 * full text is large — the corpus's worst case (`encyclical.fratelli-tutti`)
 * renders to 482 KB — so embedding both editions would put roughly twice that
 * into the page's hydration payload for a reader who reads one language at a
 * time. Every language's MANIFEST is embedded (kilobytes: title, source,
 * copyright notice, no section text) so the component can still offer every
 * edition and notice when the reader's differs from what got built in.
 *
 * WHICH LANGUAGE, AND WHY IT CANNOT BE "the reader's": this route is
 * prerendered with no server (adapter-static — see CLAUDE.md), so `load` runs
 * once at build time with no request to read a preference from. Content
 * language is a client-side preference (`$lib/content.svelte.ts`) and
 * `i18n.svelte.ts` defaults to `'en'` when nothing is stored — which is also
 * every prerendered page's condition, since there is no `localStorage` during
 * a build. Picking `'en'` here (falling back to whichever language DOES have
 * sections, for an all-PT document) means the embedded language matches what
 * `content.documentLangFor` resolves to for a reader with no override, so the
 * common case needs no client-side fetch at all.
 *
 * WHAT A NO-JAVASCRIPT READER GETS: exactly `embeddedLang`'s text, always.
 * There is no server here to content-negotiate against.
 *
 * A DOCUMENT WITH NOTHING READABLE STILL RENDERS. `embeddedLang` and
 * `embeddedSections` are absent when no edition has sections built — a rights
 * takedown (`site/unpublished.json`), or a v1 EN/PT asymmetry with nothing
 * built for either. The page then shows the document's bibliographic metadata
 * and the takedown notice, which is the posture docs/decisions.md fixed for
 * per-work unpublish: what is withheld is the work, not the fact of it. This
 * is the one behaviour that could not be carried over from `read/+page.ts`
 * unchanged — that route 404'd in this case, because the landing page it sat
 * behind was still there to say so. Now there is no page behind this one.
 */
export interface DocumentPageData {
	slug: string;
	/** Every language this document has sections built for, keyed by bare
	 *  language — MANIFEST metadata only, never that language's section text.
	 *  Deliberately excludes a manifest whose edition has no sections built
	 *  (withheld, or nothing built for it): a language present here is a
	 *  promise `getDocumentSectionsAsync` will return something for it. */
	manifestsByLang: Record<string, DocumentManifest>;
	/** The one language whose full sections are embedded — absent when this
	 *  document has no readable edition at all. */
	embeddedLang?: string;
	embeddedSections?: DocumentSection[];
}

export const load: PageLoad = async ({ params }) => {
	const slug = params.slug;
	const group = getDocumentGroup(slug);
	if (!group) error(404, 'Document not found in this corpus');

	const manifestsByLang: Record<string, DocumentManifest> = {};
	for (const manifest of Object.values(group.manifests)) {
		// Withheld edition, or nothing built for this language.
		if (!manifest || !documentHasSections(manifest.id)) continue;
		manifestsByLang[baseLang(manifest.language)] = manifest;
	}

	const availableLangs = Object.keys(manifestsByLang);
	// Nothing readable — the page still renders its metadata and, where the
	// registry has one, its takedown notice. See the module docblock.
	if (availableLangs.length === 0) return { slug, manifestsByLang };

	const embeddedLang = availableLangs.includes('en') ? 'en' : availableLangs[0];
	const embeddedSections = await getDocumentSectionsAsync(manifestsByLang[embeddedLang].id);

	return { slug, manifestsByLang, embeddedLang, embeddedSections };
};
