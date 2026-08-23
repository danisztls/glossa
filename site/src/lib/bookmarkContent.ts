/**
 * Bookmark-target -> title/text resolution, and the library's ordering.
 *
 * The corpus-aware half of `bookmark-target.ts`, split from it for the same
 * reason `linkPreviewContent.ts` is split from `linkPreviewHref.ts`: this
 * side reads the reader's effective edition off the content store and fetches
 * corpus content, none of which belongs in the unit that parses a string.
 *
 * Almost all of it is delegation. Every bookmark whose address the hover
 * preview can already name resolves through `resolveUnitText`, sharing its
 * memo cache -- so a reader who hovered a verse and then bookmarked it pays
 * one read, not two. Only the two addresses the preview deliberately does not
 * cover (a whole prayer, a whole document) are resolved here.
 */

import {
	documentSectionExists,
	getDocumentManifest,
	getDocumentSectionAsync,
	documentSectionText,
	getPrayerAsync,
	getPrayerMeta,
	isUnpublished,
	listCanonicalBooks
} from './corpus';
import { content } from './content.svelte';
import { resolveUnitText, type ResolvedUnit } from './linkPreviewContent';
import type { BookmarkTarget } from './bookmark-target';

async function resolvePrayer(slug: string): Promise<ResolvedUnit | undefined> {
	const lang = content.langFor('prayer');
	if (isUnpublished(`prayers.${lang}`)) return undefined;
	const meta = getPrayerMeta(lang, slug);
	if (!meta) return undefined;
	const prayer = await getPrayerAsync(lang, slug);
	return {
		title: meta.title,
		text: prayer ? prayer.blocks.map((b) => b.text).join(' ') : ''
	};
}

async function resolveDocumentWhole(slug: string): Promise<ResolvedUnit | undefined> {
	const workId = content.documentWorkIdFor(slug);
	if (!workId || isUnpublished(workId)) return undefined;
	const manifest = getDocumentManifest(workId);
	if (!manifest) return undefined;

	// The document's OPENING section, not the whole encyclical -- the same
	// "preview, not a second reading pane" rule `resolveCccChapter` states.
	// A document whose source prints no numbered sections resolves to its
	// title alone rather than to nothing: the address is still real.
	const opening = documentSectionExists(workId, 1)
		? await getDocumentSectionAsync(workId, 1)
		: undefined;
	return {
		title: manifest.short_title,
		text: opening ? documentSectionText(opening) : ''
	};
}

/** Full text and citation for a bookmark. `undefined` for an address that no
 *  longer resolves -- a withheld work, a slug this edition doesn't carry, a
 *  number outside the corpus -- which the library renders as a dead row it
 *  can still remove, never as an error. */
export async function resolveBookmark(target: BookmarkTarget): Promise<ResolvedUnit | undefined> {
	switch (target.kind) {
		case 'unit':
			return resolveUnitText(target.target);
		case 'prayer':
			return resolvePrayer(target.slug);
		case 'documentWhole':
			return resolveDocumentWhole(target.slug);
	}
}

/** Position within a library section: canonical order, not save order. A
 *  reader scanning their marked verses wants them in the order the Bible
 *  prints them; `addedAt` decides nothing here except ties. */
function sortKey(target: BookmarkTarget): [number, number, number] {
	if (target.kind === 'prayer') {
		const meta = getPrayerMeta(content.langFor('prayer'), target.slug);
		return [meta?.n ?? 0, 0, 0];
	}
	if (target.kind === 'documentWhole') return [0, 0, 0];
	const t = target.target;
	switch (t.kind) {
		case 'bible': {
			const books = listCanonicalBooks();
			const i = books.findIndex((b) => b.osis === t.osis);
			return [i < 0 ? books.length : i, t.chapter, t.from ?? 0];
		}
		case 'ccc':
		case 'cccChapter':
		case 'compendium':
		case 'compendiumChapter':
			return [t.n, 0, 0];
		case 'document':
			return [t.n, 0, 0];
	}
}

export function compareBookmarks(a: BookmarkTarget, b: BookmarkTarget): number {
	const ka = sortKey(a);
	const kb = sortKey(b);
	return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
}

/** The heading a `document:{slug}` library section prints. Falls back to the
 *  slug so a section never renders headless for a document the reader's
 *  language doesn't carry. */
export function documentGroupTitle(slug: string): string {
	const workId = content.documentWorkIdFor(slug);
	const manifest = workId ? getDocumentManifest(workId) : undefined;
	return manifest?.short_title ?? slug;
}
