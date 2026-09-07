/**
 * The library's ORDER: which section a bookmark files under, and where it sits
 * inside it.
 *
 * The corpus-aware half of a bookmark, split from `address.ts` for the same
 * reason `linkPreviewContent.ts` is: this side reads the reader's effective
 * edition off the content store, which does not belong in the unit that parses
 * a string.
 *
 * A bookmark IS an `Address` and nothing else -- no title, no excerpt, no
 * edition, no work id -- because a canonical href is deliberately
 * edition-free, so an address saved while reading the Clementine Vulgate is
 * still the right address when the same reader comes back in Portuguese.
 * Everything a bookmark displays is re-derived.
 *
 * IT RESOLVED TEXT UNTIL 2026-09-07 AND NO LONGER DOES, which is why what is
 * left is one subject rather than two:
 *
 * - The two addresses the hover preview used to refuse (a whole prayer, a
 *   whole document) were resolved here, in a copy of the same logic. Widening
 *   `PreviewTarget` (see its docblock) moved them to the one resolver.
 * - `resolveBookmark` went with them. It existed to be the entry point taking
 *   an `Address` where `resolveUnitText` took the narrower `PreviewTarget`;
 *   the two are the same type now, so it was a second name for one function.
 * - `/signata` asks for no text at all any more. It prints a citation per row
 *   and no excerpt, and `citation-label.ts` answers that out of the index tier
 *   with no fetch -- so the page that used to `await` one content file per
 *   marked passage now awaits none.
 */

import { getPrayerMeta, listCanonicalBooks } from './corpus';
import { citationFor } from './citation-label';
import { summaPartFromSlug, type Address } from './address';
import { content } from './content.svelte';

/** The parts in the order the work prints them, for `sortKey`. Not
 *  `SUMMA_PART_SLUGS`' key order, which is an object literal's and carries no
 *  promise. */
const SUMMA_PART_ORDER = ['I', 'I-II', 'II-II', 'III', 'Suppl'];

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
		case 'socialDoctrine':
		case 'socialDoctrineChapter':
		case 'canonLaw':
		case 'canonLawTitle':
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

/** The heading a `document:{slug}` library section prints, which is the
 *  document's own citation with no section number on it — including the
 *  fallback to the slug, so a section never renders headless for a document
 *  the reader's language doesn't carry. */
export function documentGroupTitle(slug: string): string {
	return citationFor({ kind: 'document', slug });
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
		// Beside the two catechetical works rather than inside the document
		// library, because it is not a document: it has its own address space
		// and a reader marks a numbered paragraph of it exactly as they mark
		// CCC 1. Order 4 pushes prayers and documents down one, on the same
		// reasoning the Summa's note above records.
		case 'socialDoctrine':
		case 'socialDoctrineChapter':
			return { key: 'socialDoctrine', order: 4 };
		// Beside it, on the same reasoning and one place further along: the
		// Code is its own work with its own address space, and a reader marks
		// a canon exactly as they mark CCC 1. Prayers and documents move down
		// one again, which is what a shelf order does when a shelf is added.
		case 'canonLaw':
		case 'canonLawTitle':
			return { key: 'canonLaw', order: 5 };
		case 'prayer':
			return { key: 'prayers', order: 6 };
		// A section and the whole document file together, under the document.
		case 'document':
			return { key: `document:${target.slug}`, order: 7 };
	}
}
