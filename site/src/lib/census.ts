/**
 * The census read back: an id and a number become a name, an address and a
 * number.
 *
 * `scripts/census.mjs` writes ids because a name is not a property of the
 * corpus — it is a property of the edition a reader has open, and the row
 * links into that edition. So Matthew is `matt` in the file, `Mateus` under a
 * Portuguese Bible and `Matthaeus` under the Clementine, and the ranking is
 * spelled the way the page it opens is. `cited-by.ts` names a citer by the
 * same rule; this is the other direction of it, over the thing CITED.
 *
 * SEPARATE FROM THE PAGE for `cited-by.ts`'s reason: this is where the
 * mapping is testable without rendering anything, and the page is where the
 * markup is. Nothing here imports the page.
 *
 * A ROW WHOSE WORK THIS BUILD DOES NOT HOLD IS DROPPED, silently, and that is
 * `citedSources`' rule again: it can only mean the index outlived the work —
 * a document switched off in `unpublished.json` between the sync that counted
 * it and the sync that built the page — and a bare slug is not something to
 * put in front of a reader.
 */
import { getCanonicalBook, getDocumentGroup } from './corpus';
import { content } from './content.svelte';
import { hrefFor, summaPartSlug } from './address';
import type { Census } from './types';

/** One line of a ranking: what it names, where it goes, how often it is cited. */
export interface CensusRankRow {
	key: string;
	label: string;
	/** The full name where the label is a short form — the row's `title`. */
	fullTitle: string | null;
	href: string;
	value: number;
}

/**
 * A book's name in the edition this reader would actually open.
 *
 * The same three lines as `cited-by.ts`'s `bookName`, and deliberately not
 * imported from it: that one is private to the panel and this file has no
 * business widening its surface. Both would move together if the rule ever
 * changed, which it has not since `citation-style.ts` argued it.
 */
function bookName(osis: string): string {
	const names = getCanonicalBook(osis)?.namesByWorkId ?? {};
	const preferred = content.workIdFor('bible');
	return (preferred && names[preferred]) || Object.values(names)[0] || osis;
}

/**
 * The books of Scripture the rest of the library cites most.
 *
 * A BOOK'S ADDRESS IS ITS FIRST CHAPTER — there is no page for a book as
 * such, which is `suggest.ts`'s rule for the same problem, spelled the same
 * way: the first chapter above zero, since chapter 0 is the introduction some
 * editions print and not the opening of the book.
 */
export function rankedBooks(census: Census): CensusRankRow[] {
	return census.rankings.books.flatMap(({ osis, value }) => {
		const chapters = getCanonicalBook(osis)?.chapters ?? [];
		const first = chapters.find((n) => n > 0) ?? chapters[0];
		if (first === undefined) return [];
		return [
			{
				key: osis,
				label: bookName(osis),
				fullTitle: null,
				href: hrefFor({ kind: 'bible', osis, chapter: first }),
				value
			}
		];
	});
}

/**
 * The chapters, labelled `Matthew 5` — the book out of the reader's own
 * edition and a bare number after it.
 *
 * NO CHAPTER MARK, because there is no verse for one to separate. The
 * punctuation `citation-style.ts` governs is the one BETWEEN a chapter and a
 * verse, and eight languages spell it with a comma; a space is what every
 * language puts between a book and its chapter.
 */
export function rankedChapters(census: Census): CensusRankRow[] {
	return census.rankings.chapters
		.filter(({ osis }) => getCanonicalBook(osis))
		.map(({ osis, chapter, value }) => ({
			key: `${osis} ${chapter}`,
			label: `${bookName(osis)} ${chapter}`,
			fullTitle: null,
			href: hrefFor({ kind: 'bible', osis, chapter }),
			value
		}));
}

/**
 * The documents, named out of the edition this reader would open and by their
 * short title where the manifest has one — `Lumen Gentium` rather than
 * `Dogmatic Constitution on the Church Lumen Gentium`, with the full name on
 * the row's `title`. `documentCitedSource` labels a citing document the same
 * way and the two must agree.
 */
export function rankedDocuments(census: Census): CensusRankRow[] {
	return census.rankings.documents.flatMap(({ slug, value }) => {
		const group = getDocumentGroup(slug);
		if (!group) return [];
		const lang = content.documentLangFor(slug);
		const manifest = group.manifests[lang] ?? Object.values(group.manifests)[0];
		if (!manifest) return [];
		const label = manifest.short_title || manifest.title;
		return [
			{
				key: slug,
				label,
				fullTitle: manifest.title !== label ? manifest.title : null,
				href: hrefFor({ kind: 'document', slug }),
				value
			}
		];
	});
}

/**
 * The Catechism's paragraphs, labelled `¶1883` — the mark this site already
 * uses for a Catechism locus everywhere a number appears without the work's
 * name beside it (`cited-by.ts`, `ReferenceNumber`).
 */
export function rankedCcc(census: Census): CensusRankRow[] {
	return census.rankings.ccc.map(({ n, value }) => ({
		key: String(n),
		label: `¶${n}`,
		fullTitle: null,
		href: hrefFor({ kind: 'ccc', n }),
		value
	}));
}

/**
 * The Summa's questions, in the form every citation of it prints and
 * `refs-grammar.ts` reads back: part, then question.
 *
 * The part label is the grammar's own (`I-II`) and is not translated, because
 * it is not a word — it is the address, and the same three characters in
 * every edition and every language.
 */
export function rankedSumma(census: Census): CensusRankRow[] {
	return census.rankings.summa.map(({ part, question, value }) => ({
		key: `${part} ${question}`,
		label: `${part} ${question}`,
		fullTitle: null,
		href: hrefFor({ kind: 'summa', part: summaPartSlug(part), question, article: null }),
		value
	}));
}

/**
 * The i18n key heading each ledger group.
 *
 * SEVEN OF THE NINE ARE A KEY THE SITE ALREADY HAS, and that is the same rule
 * `shelves.ts` states for the catalogue: a group here is a shelf there, so it
 * is headed by whatever that shelf's own landing page is titled by and costs
 * no string in thirty-seven dictionaries. `ccc.landing.pairTitle` heads the
 * Catechism's group because the group holds the Compendium's rows too, which
 * is exactly the pair that key was written for.
 *
 * The two exceptions name nothing on a shelf — everything at once, and the
 * cross-reference index this project derived rather than reproduced — so
 * they are the page's own and are written in `en.ts` alone.
 */
export const CENSUS_GROUP_KEYS: Readonly<Record<string, string>> = {
	library: 'census.group.library',
	bible: 'nav.bible',
	catechism: 'ccc.landing.pairTitle',
	socialDoctrine: 'nav.socialDoctrine',
	prayer: 'nav.prayers',
	canonLaw: 'nav.canonLaw',
	magisterium: 'nav.magisterium',
	summa: 'summa.landing.title',
	apparatus: 'census.group.apparatus'
};

/**
 * The ledger's groups, dropping one this file has no heading for — the same
 * answer `citerBreakdown` gives an unnamed citer kind, for the same reason.
 */
export function ledgerGroups(
	census: Census
): { key: string; labelKey: string; rows: { key: string; labelKey: string; value: number }[] }[] {
	return census.groups
		.filter((group) => CENSUS_GROUP_KEYS[group.key])
		.map((group) => ({
			key: group.key,
			labelKey: CENSUS_GROUP_KEYS[group.key],
			rows: group.rows.map((row) => ({
				key: row.key,
				labelKey: `census.row.${row.key}`,
				value: row.value
			}))
		}));
}

/**
 * The i18n key naming each citer kind, for the breakdown of where the
 * cross-references come from.
 *
 * EVERY KEY IS ONE A PAGE ALREADY USES, so the breakdown costs no new string
 * in thirty-seven dictionaries — `CITED_BY_FAMILIES` takes the same approach
 * and for the same reason. It is per KIND rather than per family here because
 * this table has no filter to drive: what it answers is "who does the citing",
 * and the Catechism and its Compendium are two different answers to that even
 * though they are one answer to "show me the Catechism".
 */
export const CITER_KIND_KEYS: Readonly<Record<string, string>> = {
	annotation: 'apparatus.commentary',
	document: 'nav.magisterium',
	summa: 'summa.landing.title',
	ccc: 'nav.ccc',
	socialDoctrine: 'nav.socialDoctrine',
	compendium: 'nav.compendium',
	canonLaw: 'nav.canonLaw',
	prayer: 'nav.prayers'
};

/**
 * The citer breakdown, dropping a kind this file has no name for.
 *
 * A NEW CITER KIND REACHING PRODUCTION BEFORE ITS KEY DOES loses a row rather
 * than showing a reader the string `lectionary` — the same answer `headFor`
 * gives an address it has no rule for, and the same reason: the page is still
 * right about everything else it says.
 */
export function citerBreakdown(census: Census): { key: string; labelKey: string; value: number }[] {
	return census.citers
		.filter(({ kind }) => CITER_KIND_KEYS[kind])
		.map(({ kind, value }) => ({ key: kind, labelKey: CITER_KIND_KEYS[kind], value }));
}
