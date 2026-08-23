/**
 * Href -> bookmark-target parsing.
 *
 * A bookmark IS a canonical URL. Nothing else is stored -- no title, no
 * excerpt, no edition, no work id -- because `refHref`'s output is
 * deliberately edition-free, so an address saved while reading the Clementine
 * Vulgate is still the right address when the same reader comes back in
 * Portuguese. Everything a bookmark displays is re-derived from its href
 * through the resolvers the hover preview already uses.
 *
 * WHY THIS WRAPS `parsePreviewHref` RATHER THAN EXTENDING IT. Two of the
 * bookmarkable addresses are not previewable ones: a whole prayer
 * (`/preces/{slug}`) and a whole document (`/documenta/{slug}`, no `#s{n}`).
 * `linkPreviewHref.ts` rejects both on purpose -- its docblock says an
 * unanchored document link is "navigation rather than a quotable unit", and
 * prayers have no inline link surface at all. Teaching `PreviewTarget` about
 * them would silently give every prayer link on the site a hover popover it
 * does not have today. So this module tries the preview parser first and only
 * adds the two shapes it has no reason to know.
 *
 * Pure and dependency-free for the same reason `linkPreviewHref.ts` is: it is
 * the half with a clean input and output, and it is what a stored bookmark is
 * validated against on the way out of `localStorage`.
 */

import { parsePreviewHref, type PreviewTarget } from './linkPreviewHref';

export type BookmarkTarget =
	/** Anything the hover preview can already address: a verse or a whole
	 *  Bible chapter, a CCC paragraph or chapter, a Compendium question or
	 *  chapter, a document section. */
	| { kind: 'unit'; target: PreviewTarget }
	| { kind: 'prayer'; slug: string }
	/** A whole document, as opposed to `{kind:'unit'}` carrying a
	 *  `PreviewTarget` of kind `document`, which is one numbered section. */
	| { kind: 'documentWhole'; slug: string };

const INTERNAL_BASE = 'https://glossa.internal.invalid';
const PRAYER_RE = /^\/preces\/([a-z0-9-]+)$/;
const DOCUMENT_RE = /^\/documenta\/([a-z0-9-]+)$/;

/**
 * Parse a canonical URL into a bookmark target, or `undefined` for anything
 * this site does not address that way -- a legacy English path (`/ccc/1`,
 * `/prayers/x`), an external URL, chrome, or a stored value from a future
 * version of the site whose grammar this one does not know. `undefined` is
 * always "drop it quietly", never an error: a bookmark that no longer parses
 * is one row the library omits, not a page that fails to load.
 */
export function parseBookmarkHref(href: string | null | undefined): BookmarkTarget | undefined {
	if (!href) return undefined;

	const target = parsePreviewHref(href);
	if (target) return { kind: 'unit', target };

	let url: URL;
	try {
		url = new URL(href, INTERNAL_BASE);
	} catch {
		return undefined;
	}
	if (url.origin !== INTERNAL_BASE) return undefined;

	const prayer = PRAYER_RE.exec(url.pathname);
	if (prayer) return { kind: 'prayer', slug: prayer[1] };

	// Reached only when `parsePreviewHref` declined, i.e. there was no
	// `#s{n}` -- so this is the document as a whole.
	const document = DOCUMENT_RE.exec(url.pathname);
	if (document) return { kind: 'documentWhole', slug: document[1] };

	return undefined;
}

/** Which section of the library a bookmark files under, and where that
 *  section sits. Every document gets its own section (`document:{slug}`),
 *  the way the "Cited in" panel names a work once and lists its references
 *  under it. */
export function bookmarkGroup(target: BookmarkTarget): { key: string; order: number } {
	if (target.kind === 'prayer') return { key: 'prayers', order: 3 };
	if (target.kind === 'documentWhole') return { key: `document:${target.slug}`, order: 4 };
	switch (target.target.kind) {
		case 'bible':
			return { key: 'scripture', order: 0 };
		case 'ccc':
		case 'cccChapter':
			return { key: 'catechism', order: 1 };
		case 'compendium':
		case 'compendiumChapter':
			return { key: 'compendium', order: 2 };
		case 'document':
			return { key: `document:${target.target.slug}`, order: 4 };
	}
}
