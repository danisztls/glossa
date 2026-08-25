/**
 * Bookmark-target -> title/text resolution, and the library's ordering.
 *
 * The corpus-aware half of a bookmark, split from `address.ts` for the same
 * reason `linkPreviewContent.ts` is: this side reads the reader's effective
 * edition off the content store and fetches corpus content, none of which
 * belongs in the unit that parses a string.
 *
 * A bookmark IS an `Address` and nothing else -- no title, no excerpt, no
 * edition, no work id -- because a canonical href is deliberately
 * edition-free, so an address saved while reading the Clementine Vulgate is
 * still the right address when the same reader comes back in Portuguese.
 * Everything a bookmark displays is re-derived here.
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
import { summaPartFromSlug, type Address } from './address';
import { content } from './content.svelte';
import { resolveUnitText, type ResolvedUnit } from './linkPreviewContent';

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

/** The parts in the order the work prints them, for `sortKey`. Not
 *  `SUMMA_PART_SLUGS`' key order, which is an object literal's and carries no
 *  promise. */
const SUMMA_PART_ORDER = ['I', 'I-II', 'II-II', 'III', 'Suppl'];

/** Full text and citation for a bookmark. `undefined` for an address that no
 *  longer resolves -- a withheld work, a slug this edition doesn't carry, a
 *  number outside the corpus -- which the library renders as a dead row it
 *  can still remove, never as an error. */
export async function resolveBookmark(target: Address): Promise<ResolvedUnit | undefined> {
	if (target.kind === 'prayer') return resolvePrayer(target.slug);
	// A document with no section number is the whole document -- the one
	// bookmarkable address the hover preview deliberately declines, along with
	// prayers (see `PreviewTarget`).
	if (target.kind === 'document') {
		return target.n === undefined
			? resolveDocumentWhole(target.slug)
			: resolveUnitText({ ...target, n: target.n });
	}
	return resolveUnitText(target);
}

/** Position within a library section: canonical order, not save order. A
 *  reader scanning their marked verses wants them in the order the Bible
 *  prints them; `addedAt` decides nothing here except ties. */
function sortKey(target: Address): [number, number, number] {
	switch (target.kind) {
		case 'prayer': {
			const meta = getPrayerMeta(content.langFor('prayer'), target.slug);
			return [meta?.n ?? 0, 0, 0];
		}
		case 'bible': {
			const books = listCanonicalBooks();
			const i = books.findIndex((b) => b.osis === target.osis);
			return [i < 0 ? books.length : i, target.chapter, target.from ?? 0];
		}
		case 'ccc':
		case 'cccChapter':
		case 'compendium':
		case 'compendiumChapter':
			return [target.n, 0, 0];
		// The whole document sorts to the top of its own section, ahead of every
		// section of it.
		case 'document':
			return [target.n ?? 0, 0, 0];
		case 'summa': {
			// Part first: question numbers restart at 1 in each part, so `n`
			// alone would interleave five parts into one run of ones and twos.
			const i = SUMMA_PART_ORDER.indexOf(summaPartFromSlug(target.part) ?? '');
			return [i < 0 ? SUMMA_PART_ORDER.length : i, target.question, target.article ?? 0];
		}
	}
}

export function compareBookmarks(a: Address, b: Address): number {
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

/** Which section of the library a bookmark files under, and where that
 *  section sits. Every document gets its own section (`document:{slug}`),
 *  the way the "Cited in" panel names a work once and lists its references
 *  under it.
 *
 *  THE SUMMA TOOK ORDER 3, PUSHING PRAYERS AND DOCUMENTS DOWN ONE. The
 *  sequence is a shelf order, not an append log: Scripture, then the two
 *  catechetical works, then the Summa beside them as the other doctrinal
 *  text, then the devotional collection, then the document library last
 *  because it is the section that grows without bound. Adding the Summa at
 *  the end instead would have filed it after every encyclical a reader had
 *  ever marked. */
export function bookmarkGroup(target: Address): { key: string; order: number } {
	switch (target.kind) {
		case 'bible':
			return { key: 'scripture', order: 0 };
		case 'ccc':
		case 'cccChapter':
			return { key: 'catechism', order: 1 };
		case 'compendium':
		case 'compendiumChapter':
			return { key: 'compendium', order: 2 };
		case 'summa':
			return { key: 'summa', order: 3 };
		case 'prayer':
			return { key: 'prayers', order: 4 };
		// A section and the whole document file together, under the document.
		case 'document':
			return { key: `document:${target.slug}`, order: 5 };
	}
}
