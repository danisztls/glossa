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
 * The i18n key naming each shelf and each coverage row.
 *
 * EIGHT OF TEN ARE A KEY THE SITE ALREADY HAS, which is `shelves.ts`'s rule
 * for the catalogue: a name here is a name there, so it is whatever that
 * shelf's own landing page is titled by and costs no string in any
 * dictionary. The two exceptions name nothing on a shelf — everything at
 * once, and the cross-reference index this project derived rather than
 * reproduced.
 *
 * `catechism` IS THE PAIR IN THE PROSE AND THE CATECHISM ALONE IN THE MATRIX,
 * the one key that means two things. The shelf holds two works whose language
 * sets differ by five, so its sentence names both and the matrix gives each a
 * row — a single row over their union would report a coverage neither work
 * has. `ccc.landing.pairTitle` heads the sentence, `nav.ccc` the row, and
 * both are already written everywhere.
 */
export const CENSUS_SHELF_KEYS: Readonly<Record<string, string>> = {
	library: 'census.shelf.library',
	bible: 'nav.bible',
	catechism: 'ccc.landing.pairTitle',
	compendium: 'nav.compendium',
	socialDoctrine: 'nav.socialDoctrine',
	prayer: 'nav.prayers',
	canonLaw: 'nav.canonLaw',
	magisterium: 'nav.magisterium',
	doctores: 'doctores.landing.title',
	apparatus: 'census.shelf.apparatus'
};

/** The matrix's row heading — the shelf's name except for the Catechism, see
 *  `CENSUS_SHELF_KEYS`. */
const COVERAGE_ROW_KEYS: Readonly<Record<string, string>> = {
	...CENSUS_SHELF_KEYS,
	catechism: 'nav.ccc'
};

/** One shelf as a heading and a sentence its numbers go into. */
export interface CensusShelf {
	key: string;
	labelKey: string;
	proseKey: string;
	facts: Record<string, number>;
}

/**
 * The shelves, dropping one this file has no name for — the same answer
 * `citerBreakdown` gives an unnamed citer kind, and `headFor` an address it
 * has no rule for: the page is still right about everything else it says.
 */
export function censusShelves(census: Census): CensusShelf[] {
	return census.shelves
		.filter((shelf) => CENSUS_SHELF_KEYS[shelf.key])
		.map((shelf) => ({
			key: shelf.key,
			labelKey: CENSUS_SHELF_KEYS[shelf.key],
			proseKey: `census.prose.${shelf.key}`,
			facts: shelf.facts
		}));
}

/**
 * A shelf's sentence with its numbers in it.
 *
 * PROSE AND NOT A TABLE OF ROWS, which is what the ledger was until a reader
 * added four of its numbers up and found them a fifth of the total they sat
 * under. They were right and the rows were right: cross-references are EDGES
 * and the counts beside them were their ENDPOINTS, two units on one list with
 * nothing saying so. A list of bare numbers invites the addition; a sentence
 * states the relation, and `census.prose.apparatus` now reads "from X places
 * to Y addresses", which cannot be misread as a sum.
 *
 * EVERY FACT MUST HAVE A PLACEHOLDER AND EVERY PLACEHOLDER A FACT, asserted
 * both ways in `census.test.ts` over a census built to carry every shelf. A
 * fact with no placeholder is a number this build computes and no longer
 * publishes — `llmsTxt`'s quiet failure one surface over; a placeholder with
 * no fact reaches a reader as the literal `{documents}`. Neither can be seen
 * by reading the output, so neither is left to review.
 *
 * `format` rather than the raw number, so a count is in the reader's own
 * notation on a page that is nothing but counts.
 */
export function censusProse(
	sentence: string,
	facts: Record<string, number>,
	format: (value: number) => string
): string {
	let out = sentence;
	for (const [name, value] of Object.entries(facts)) {
		out = out.replaceAll(`{${name}}`, format(value));
	}
	return out;
}

/** One row of the coverage matrix: a work, and what each language reaches of it. */
export interface CensusCoverageRow {
	key: string;
	labelKey: string;
	/** The address space this work offers, unioned across every edition. */
	of: number;
	/** How many languages reach any of it — the row's own headline. */
	languages: number;
	cells: { lang: string; value: number; fraction: number }[];
}

/**
 * The coverage matrix: one row per work, one cell per interface language.
 *
 * THE LANGUAGE ORDER IS THE FILE'S, NOT THIS FUNCTION'S. It is derived at
 * build from how much of the whole library each language carries and shared
 * by every row, which is the only reason the rows are worth stacking: what
 * the matrix shows is a comparison DOWN a column. Re-sorting here would be a
 * second order over the same data, and the first thing it would break is the
 * staircase that makes the picture readable.
 */
export function coverageRows(census: Census): CensusCoverageRow[] {
	const langs = census.coverage.languages;
	return census.coverage.rows
		.filter((row) => COVERAGE_ROW_KEYS[row.key])
		.map((row) => ({
			key: row.key,
			labelKey: COVERAGE_ROW_KEYS[row.key],
			of: row.of,
			languages: row.values.filter((v) => v > 0).length,
			cells: row.values.map((value, i) => ({
				lang: langs[i],
				value,
				fraction: row.of ? value / row.of : 0
			}))
		}));
}

/**
 * The i18n key naming each citer kind, for the breakdown of where the
 * cross-references come from.
 *
 * EVERY KEY IS ONE A PAGE ALREADY USES, so the breakdown costs no new string
 * in any dictionary — `CITED_BY_FAMILIES` takes the same approach and for the
 * same reason. It is per KIND rather than per family here because this table
 * has no filter to drive: what it answers is "who does the citing", and the
 * Catechism and its Compendium are two different answers to that even though
 * they are one answer to "show me the Catechism".
 *
 * `summa` IS NAMED FOR ITS SHELF and not for the work. Every other row here,
 * and every shelf above, is a section of the library; one row naming a single
 * book among nine naming shelves reads as a different kind of thing.
 */
export const CITER_KIND_KEYS: Readonly<Record<string, string>> = {
	annotation: 'apparatus.commentary',
	document: 'nav.magisterium',
	summa: 'doctores.landing.title',
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
