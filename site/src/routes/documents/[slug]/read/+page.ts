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
 * The whole document in one page — the document-route analogue of
 * `ccc/chapter/[n]/+page.ts`, minus that route's "which chapter" step: a
 * document has exactly one full-document view, addressed by its slug alone,
 * so there is no chapter-boundary lookup to do first.
 *
 * `read` was checked against `documents/[slug]/[n]`'s route pattern before
 * picking it: `[n]` has no param matcher restricting it to digits, so it
 * matches any string INCLUDING the literal "read" — but SvelteKit resolves a
 * literal path segment ahead of a dynamic one at the same level (the same
 * reason `ccc/chapter/[n]` already coexists with `ccc/[n]`, `chapter` being
 * exactly such a literal), so `/documents/{slug}/read` never falls through
 * to being treated as a (nonsensical, non-numeric) section number.
 *
 * UNLIKE `documents/[slug]/[n]/+page.ts` AND `ccc/chapter/[n]/+page.ts`, this
 * route does NOT embed every language's full content. Those two embed a
 * whole chapter/paragraph per language — bounded by the CCC's largest
 * chapter (~90 paragraphs) or one section. This route's payload is an entire
 * document, and the corpus's worst case (`encyclical.evangelium-vitae`) runs
 * 558 KB raw / 113 KB gzip PER LANGUAGE — embedding both would put ~220 KB
 * gzip of sections JSON into the page's hydration payload for a single read,
 * the overwhelming majority of which the reader never looks at (they read in
 * one language at a time). So this embeds ONE language's sections
 * (`embeddedLang`/`embeddedSections`) plus every language's MANIFEST
 * (kilobytes — title, source, copyright notice; no section text) so the
 * sibling `+page.svelte` can still offer every edition and detect when the
 * reader's actual language differs from what got embedded.
 *
 * WHICH LANGUAGE GETS EMBEDDED, AND WHY IT CAN'T BE "the reader's language":
 * this route is prerendered (adapter-static, no server — see this project's
 * CLAUDE.md), so `load()` runs exactly once, at build time, with no request
 * to read a preference from. Content language is a client-side-only
 * preference (`$lib/content.svelte.ts`, driven by `$lib/i18n.svelte.ts`),
 * and `i18n.svelte.ts`'s own store defaults to `'en'` whenever nothing is
 * stored yet — which is also every prerendered page's condition, since
 * `localStorage` doesn't exist during a build. Picking `'en'` here (falling
 * back to whichever language DOES have sections built, for an all-PT
 * document) means the embedded language always matches what
 * `content.documentLangFor(slug)` resolves to for a reader with no stored
 * preference, so the overwhelmingly common case — first visit, no override —
 * needs no client-side fetch at all, only a reader who has actually picked a
 * different language (or a different UI language) pays for one.
 *
 * A LANGUAGE SWITCH AFTER LOAD THEREFORE CANNOT BE INSTANT THE WAY THE
 * SINGLE-SECTION ROUTES' IS: those routes keep every language in memory
 * already, so switching is a pure re-render. Here, `+page.svelte` (owned by
 * a parallel agent — see this project's task brief) has to notice the
 * mismatch and call `getDocumentSectionsAsync(manifest.id)` itself, client-
 * side, the same function this `load()` calls. That read goes through
 * `corpus.ts`'s own memoization, so it costs a real network request only the
 * first time a reader asks for that language's edition of that document in
 * that tab — and costs NOTHING if they already opened any single section of
 * it in that language, since both paths fetch and cache the identical file.
 *
 * WHAT A NO-JAVASCRIPT READER GETS: exactly `embeddedLang`'s text, always —
 * this was already true before this change (the previous version embedded
 * every language, but the prerendered HTML itself only ever rendered ONE,
 * chosen the same way, since a no-JS reader can't run the reactive
 * `content.documentLangFor` lookup at all). So a no-JS visitor to a document
 * with an English edition always reads the English edition of `/read`,
 * regardless of their browser's language, both before and after this
 * change — there is no server here to content-negotiate against. Only a
 * JS-enabled reader who wants a different language notices any difference,
 * and what they notice is one extra fetch on first switch, not a broken page.
 */
export interface DocumentReadData {
	slug: string;
	/** Every language this document has sections built for, keyed by bare
	 *  language — MANIFEST metadata only (id, title, source URL, copyright
	 *  notice: the index-tier shape `getDocumentGroup` already returns free),
	 *  never that language's section text. Deliberately excludes a manifest
	 *  whose edition has no sections built at all (`documentHasSections`
	 *  false — withheld, or a v1 EN/PT asymmetry with nothing built for it):
	 *  a language present here is a promise `getDocumentSectionsAsync` will
	 *  return something for it. */
	manifestsByLang: Record<string, DocumentManifest>;
	/** The one language whose full sections are embedded below — see this
	 *  module's docblock for why it's fixed at build time rather than chosen
	 *  per reader. */
	embeddedLang: string;
	embeddedSections: DocumentSection[];
}

export const load: PageLoad = async ({ params }) => {
	const slug = params.slug;
	const group = getDocumentGroup(slug);
	if (!group) error(404, 'Document not found in this corpus');

	const manifestsByLang: Record<string, DocumentManifest> = {};
	for (const manifest of Object.values(group.manifests)) {
		if (!manifest || !documentHasSections(manifest.id)) continue; // withheld edition, or nothing built for this language
		manifestsByLang[baseLang(manifest.language)] = manifest;
	}

	const availableLangs = Object.keys(manifestsByLang);
	if (availableLangs.length === 0) {
		error(404, 'Document has no readable sections in this corpus');
	}

	// 'en' when this document has it (matches i18n.svelte.ts's own built-time
	// default — see module docblock), else whichever language it does have.
	const embeddedLang = availableLangs.includes('en') ? 'en' : availableLangs[0];
	const embeddedSections = await getDocumentSectionsAsync(manifestsByLang[embeddedLang].id);

	return { slug, manifestsByLang, embeddedLang, embeddedSections };
};
