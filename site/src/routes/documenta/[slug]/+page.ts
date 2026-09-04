import { error, redirect } from '@sveltejs/kit';
import {
	baseLang,
	getDocumentGroup,
	getDocumentSectionsAsync,
	getDocumentAppendixAsync,
	documentHasText,
	loadDocumentStructure
} from '$lib/corpus';
import { sourceUrl } from '$lib/copyright';
import type { DocumentAppendixUnit, DocumentManifest, DocumentSection } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * Everything one document's page needs: its metadata in every language, and
 * its full text in one.
 *
 * THIS ROUTE IS THE WHOLE DOCUMENT. It absorbed the former
 * `documents/[slug]/read` (continuous full text) and `documents/[slug]/[n]`
 * (one page per numbered section) on 2026-08-17 — see site/docs/shell.md. The
 * per-section route was 9,315 of the deployment's 15,256 prerendered files,
 * 61% of it, at ~21 KB each for a few hundred bytes of actual text; the rest
 * was the same chrome repeated. Section addresses did not go away, they became
 * fragments: `/documenta/{slug}#s{n}`, against the `id="s{n}"` anchors the
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
 * WHICH LANGUAGE, AND WHY IT CANNOT BE "the reader's": content language is a
 * client-side preference (`$lib/content.svelte.ts`), and `load` only
 * re-runs on navigation, not when that preference changes on its own — this
 * route renders only in the browser now (`ssr = false`, `+layout.ts`,
 * site/docs/shell.md), so `load` COULD technically read
 * `localStorage`, but doing so wouldn't keep the page honest once the
 * reader flips languages without navigating. `i18n.svelte.ts` defaults to
 * `'en'` when nothing is stored; picking `'en'` here too (falling back to
 * whichever language DOES have sections, for an all-PT document) means the
 * embedded language matches what `content.documentLangFor` resolves to for
 * a reader with no override, so the common case needs no client-side fetch
 * at all.
 *
 * WHAT A READER WITHOUT JAVASCRIPT GETS: nothing — this used to name exactly
 * `embeddedLang`'s text, back when the route was prerendered and a no-JS
 * visitor got that HTML directly from the server. Since the site became one
 * SPA shell with `ssr = false`, no route (this one included) has any
 * content until the client hydrates, so there is no server here to
 * content-negotiate against, and no fallback content either.
 *
 * A DOCUMENT WITH NOTHING READABLE REDIRECTS TO ITS SOURCE. When no edition
 * has sections built — switched off in `site/unpublished.json`, or a parse
 * that produced nothing — this sends the reader to the vatican.va page the
 * text would have come from, rather than rendering a page about not having
 * it (docs/decisions.md §Posture). One behaviour covers both reasons,
 * because from where the reader stands they are the same event: we do not
 * have this text, and the people who do are one hop away.
 *
 * An external `redirect()` from `load` is a full-page navigation in the
 * browser (SvelteKit's client turns a cross-origin redirect into
 * `location.href = …`), which is what we want: the reader leaves. The
 * address stays in `corpus-routes.json` so the edge serves the shell that
 * performs it — a 404 there would strand the redirect before it ran.
 */
export interface DocumentPageData {
	slug: string;
	/** Every language this document has sections built for, keyed by bare
	 *  language — MANIFEST metadata only, never that language's section text.
	 *  Deliberately excludes a manifest whose edition has no sections built
	 *  (withheld, or nothing built for it): a language present here is a
	 *  promise `getDocumentSectionsAsync` will return something for it. */
	manifestsByLang: Record<string, DocumentManifest>;
	/** The one language whose full sections are embedded. Always set: a
	 *  document with no readable edition never reaches the page. */
	embeddedLang?: string;
	embeddedSections?: DocumentSection[];
	/** The embedded edition's unnumbered matter — an appendix on a numbered
	 *  document, or the whole text on one that numbers nothing. `[]` when it
	 *  has none, which is the usual case. */
	embeddedAppendix?: DocumentAppendixUnit[];
}

export const load: PageLoad = async ({ params }) => {
	const slug = params.slug;
	const group = getDocumentGroup(slug);
	if (!group) error(404, 'Document not found in this corpus');

	const manifestsByLang: Record<string, DocumentManifest> = {};
	for (const manifest of Object.values(group.manifests)) {
		// Disabled edition, or nothing built for this language.
		// `documentHasText`, not `documentHasSections`: an edition that numbers
		// nothing has no sections and is still perfectly readable.
		if (!manifest || !documentHasText(manifest.id)) continue;
		manifestsByLang[baseLang(manifest.language)] = manifest;
	}

	const availableLangs = Object.keys(manifestsByLang);
	if (availableLangs.length === 0) {
		// Nothing readable — hand the reader to the source. Whichever edition's
		// manifest carries a source URL will do: they are editions of one
		// document, and the reader asked for the document. 404 only if none
		// does, which would mean a manifest with no provenance at all — a
		// corpus defect, not a state to design around.
		const url = Object.values(group.manifests)
			.map((m) => m && sourceUrl(m))
			.find(Boolean);
		if (url) redirect(307, url);
		error(404, 'Document not published in this corpus');
	}

	const embeddedLang = availableLangs.includes('en') ? 'en' : availableLangs[0];
	const embeddedId = manifestsByLang[embeddedLang].id;
	// THE OUTLINE IS AWAITED BUT NOT RETURNED. It left the boot index for the
	// content tier on 2026-08-26 (`document-structures.svelte.ts`), and the
	// page reads it through the synchronous `$state` accessor rather than from
	// `data` — so what this call is for is the TIMING, not the value: the
	// outline's rows are interleaved into the section flow, and letting them
	// arrive a beat after the text would shove the text the reader is already
	// looking at. Fetched alongside the sections rather than after them, over
	// the same warm connection, so it costs no wall clock; ~1.2 KB against a
	// document's own text.
	//
	// Returning it in `data` would embed it in the page's hydration payload as
	// well, which is the per-page re-bloat this route's docblock spends a
	// paragraph refusing for the sections themselves.
	const [embeddedSections, embeddedAppendix] = await Promise.all([
		getDocumentSectionsAsync(embeddedId),
		getDocumentAppendixAsync(embeddedId),
		loadDocumentStructure(embeddedId)
	]);

	return { slug, manifestsByLang, embeddedLang, embeddedSections, embeddedAppendix };
};
