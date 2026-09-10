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

import { getDocumentGroup, getPrayerMeta, listCanonicalBooks } from './corpus';
import { citationFor } from './citation-label';
import { summaPartFromSlug, type Address } from './address';
import { content } from './content.svelte';

/** The parts in the order the work prints them, for `sortKey`. Not
 *  `SUMMA_PART_SLUGS`' key order, which is an object literal's and carries no
 *  promise. */
const SUMMA_PART_ORDER = ['I', 'I-II', 'II-II', 'III', 'Suppl'];

/** Position within a library section: canonical order, not save order. A
 *  reader scanning their marked verses wants them in the order the Bible
 *  prints them; `addedAt` decides nothing here except ties.
 *
 *  DOCUMENTS ARE NOT HERE. Every other section is one work, so a number
 *  places a mark inside it; the Magisterium section is every document in the
 *  corpus, and which document a mark belongs to has to be decided before its
 *  section number means anything (`compareDocuments`). */
function sortKey(target: Exclude<Address, { kind: 'document' }>): [number, number, number] {
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
		case 'summa': {
			// Part first: question numbers restart at 1 in each part, so `n`
			// alone would interleave five parts into one run of ones and twos.
			const i = SUMMA_PART_ORDER.indexOf(summaPartFromSlug(target.part) ?? '');
			return [i < 0 ? SUMMA_PART_ORDER.length : i, target.question, target.article ?? 0];
		}
		// Every topic ties, and that is the answer rather than a gap. The other
		// branches sort by the order the WORK prints its units in, and a topic
		// set has no printed order — the doorway grouping `/quaestiones` shows
		// is editorial and lives in a file this module deliberately does not
		// fetch. Tying sends the whole section to `addedAt`, which for a page
		// somebody chose to mark is the order they will look for it in.
		case 'topic':
			return [0, 0, 0];
	}
}

/** The promulgation date of `slug`, which is a fact about the document and
 *  not about the edition the reader is in — so the Magisterium section keeps
 *  its order across a language switch. Empty for a slug the corpus no longer
 *  carries, which sorts it last rather than first. */
function promulgatedOf(slug: string): string {
	const editions = Object.values(getDocumentGroup(slug)?.manifests ?? {});
	return editions.find((m) => m !== undefined)?.promulgated ?? '';
}

/**
 * Two marks in the Magisterium section: the documents in the order
 * `/documenta` lists them — newest first, ties broken by the title on the row
 * — and the marks inside one document in the order it prints them, the whole
 * document ahead of every section of it.
 *
 * THE TIE-BREAK IS NOT DECORATION. Lumen Gentium and Orientalium Ecclesiarum
 * were both promulgated on 1964-11-21, and a date alone would interleave
 * their sections into one run of numbers — the failure `sortKey` already
 * records for the Summa's parts.
 */
function compareDocuments(
	a: Extract<Address, { kind: 'document' }>,
	b: Extract<Address, { kind: 'document' }>
): number {
	if (a.slug === b.slug) return (a.n ?? 0) - (b.n ?? 0);
	return (
		promulgatedOf(b.slug).localeCompare(promulgatedOf(a.slug)) ||
		citationFor({ kind: 'document', slug: a.slug }).localeCompare(
			citationFor({ kind: 'document', slug: b.slug })
		)
	);
}

export function compareBookmarks(a: Address, b: Address): number {
	// A section holds one `bookmarkGroup` key and documents have their own, so
	// a mixed pair cannot occur; it orders as a tie rather than inventing a
	// rank for two things that never meet.
	if (a.kind === 'document' || b.kind === 'document') {
		return a.kind === 'document' && b.kind === 'document' ? compareDocuments(a, b) : 0;
	}
	const ka = sortKey(a);
	const kb = sortKey(b);
	return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
}

/** A library section. Closed, and the page titles it from this union rather
 *  than from a prefix test, so a section added here cannot reach the reader
 *  headless — which canon law did for as long as it existed, and topics did
 *  on the day they were added. */
export type BookmarkGroupKey =
	| 'scripture'
	| 'catechism'
	| 'compendium'
	| 'summa'
	| 'socialDoctrine'
	| 'canonLaw'
	| 'prayers'
	| 'magisterium'
	| 'topics';

/** Which section of the library a bookmark files under, and where that
 *  section sits.
 *
 *  ONE MAGISTERIUM SECTION, NOT ONE PER DOCUMENT. Each document had its own
 *  heading through 2026-09-08, on the "Cited in" panel's reasoning that a
 *  work is named once and its references listed under it. That panel is
 *  showing one passage's citations; the library is showing a reader's whole
 *  history, and a reader who marks widely rather than deeply got a page of
 *  headings with a single row under each — a shelf per book. The section is
 *  the work TYPE here, as it is for every other row on the page, and
 *  `compareDocuments` keeps a document's own marks together inside it.
 *
 *  THE SUMMA TOOK ORDER 3, PUSHING PRAYERS AND DOCUMENTS DOWN ONE. The
 *  sequence is a shelf order, not an append log: Scripture, then the two
 *  catechetical works, then the Summa beside them as the other doctrinal
 *  text, then the devotional collection, then the document library last
 *  because it is the section that grows without bound. Adding the Summa at
 *  the end instead would have filed it after every encyclical a reader had
 *  ever marked. */
export function bookmarkGroup(target: Address): { key: BookmarkGroupKey; order: number } {
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
		case 'document':
			return { key: 'magisterium', order: 7 };
		// Last, and the only section here that is not a work. Everything above
		// is a text somebody else wrote and this site reproduces; a topic is a
		// page of this site's own arrangement, so it files after the whole
		// library rather than among it — including after the Magisterium, which
		// is the section that grows without bound.
		case 'topic':
			return { key: 'topics', order: 8 };
	}
}
