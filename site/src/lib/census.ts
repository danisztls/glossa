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
import { citationFor } from './citation-label';
import type { Census } from './types';
import type { IconName } from './components/Icon.svelte';
import { WORK_ICONS } from './work-icons';

/** One line of a ranking: what it names, where it goes, how often it is cited. */
export interface CensusRankRow {
	key: string;
	label: string;
	/** The full name where the label is a short form — the row's `title`. */
	fullTitle: string | null;
	href: string;
	value: number;
}

/** A row of the one table, carrying the kind it came from so it can be marked
 *  and filtered. */
export interface CensusRankedRow extends CensusRankRow {
	kind: string;
	icon: IconName | undefined;
}

/**
 * `topOf`'s limit, restated on this side because this side cuts too.
 *
 * `census.test.ts` runs the builder's cut and this one over the same counts
 * and asserts they agree, which is what makes two implementations of one rule
 * safe. They cannot be one function: the builder cuts a `Map` of citer sets
 * written by Node, and this cuts rows already named out of the reader's own
 * edition.
 */
export const RANK_LIMIT = 100;

/**
 * How many rows of the ranking are on screen at once.
 *
 * TWENTY WAS THE WHOLE TABLE UNTIL 2026-09-09, and the argument for it was
 * that a ranking is read down: past a screenful it stops being a ranking and
 * becomes a list that happens to be sorted. That argument was right about the
 * SCREEN and was being enforced by the FILE, which is why a reader who wanted
 * the twenty-first row had nowhere to go. It is enforced here now, and the
 * file carries five times as much (`RANK_LIMIT`).
 *
 * A PAGE BOUNDARY MAY SPLIT A TIE where the table's own cut may not, and the
 * two are not the same rule doing different things. `topOf` refuses to split
 * a band because the rows below the line would be UNPUBLISHED — four of
 * thirteen paragraphs cited three times, and no way to learn of the nine.
 * Rows on the next page are published; turning to them is one press.
 */
export const RANK_PAGE = 20;

/**
 * The kinds, in the order the library is read.
 *
 * `books` IS FIRST AND STARTS SWITCHED OFF, the one that does — `CitedBy`'s
 * arrangement, and the same argument at a different scale. A book's count is
 * every place citing any chapter of it, so it is an AGGREGATE of the rows
 * below it: Matthew's 2,110 contains Matthew 5's 321. Shown together the two
 * are not comparable and the table answers itself twice — measured, the top
 * twenty of everything is eighteen books and two documents, with the Catechism
 * and the Summa unreachable. Switched off, the table opens on the documents
 * and chapters, and one press puts the books back.
 */
export const RANK_KINDS = ['books', 'chapters', 'documents', 'ccc', 'summa'] as const;
export const RANK_HIDDEN_BY_DEFAULT: readonly string[] = ['books'];

/**
 * The name of each kind, for its chip and for the hidden name behind its rows'
 * marks.
 *
 * THE SUMMA'S IS ITS SHELF'S, which is `CENSUS_SHELF_KEYS`' rule and
 * `CITER_KIND_KEYS`' before it: every other name on this page is a section of
 * the library, and one naming a single book among four naming shelves reads as
 * a different kind of thing. It also costs no string — `doctores.landing.title`
 * is what `/doctores` calls itself and is already written wherever that page
 * is, where `census.rank.summa` was a fifth sentence to translate saying the
 * same thing about a narrower subject.
 */
const RANK_LABEL_KEYS: Readonly<Record<string, string>> = {
	books: 'census.rank.books',
	chapters: 'census.rank.chapters',
	documents: 'census.rank.documents',
	ccc: 'census.rank.ccc',
	summa: 'doctores.landing.title'
};

export const rankLabelKey = (kind: string) => RANK_LABEL_KEYS[kind] ?? `census.rank.${kind}`;

/** The glyph each kind's rows carry — the mark of the work they belong to,
 *  which is why Scripture's two kinds share one. */
const RANK_ICONS: Readonly<Record<string, string>> = {
	books: 'bible',
	chapters: 'bible',
	documents: 'magisterium',
	ccc: 'catechism',
	summa: 'doctores'
};

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
 * The Catechism's paragraphs, labelled `CCC 1883`.
 *
 * IT WAS `¶1883` WHILE THE TABLE HAD A HEADING. That mark is what this site
 * uses for a Catechism locus wherever the work is already named beside it
 * (`cited-by.ts`, `ReferenceNumber`), and the table used to be headed
 * "Paragraphs of the Catechism". Merged into one ranking there is no such
 * heading, so a row has to name its own work — which is what a citation is.
 *
 * `citationFor` WRITES IT, and this file spells nothing. That module is the
 * site's one notation, read out of the tables `/schola` teaches from, so the
 * siglum is `ccc.abbrev` in the reader's own language rather than a literal
 * three letters. A page that teaches `CCC 1234` and then ranks `¶1234` has
 * taught nothing.
 */
export function rankedCcc(census: Census): CensusRankRow[] {
	return census.rankings.ccc.map(({ n, value }) => {
		const at = { kind: 'ccc', n } as const;
		return { key: String(n), label: citationFor(at), fullTitle: null, href: hrefFor(at), value };
	});
}

/**
 * The Summa's questions, labelled `STh I-II, 184` — `citationFor` again, for
 * the Catechism's reason: a row in a merged table names its own work.
 *
 * `STh` AND NOT `S. Th.` because that is the specimen `/schola` teaches, and
 * `citation-label.ts` records why. The part is the work's own spelling
 * (`I-II`) and is not translated, being the address rather than a word — the
 * same three characters in every edition and every language.
 */
export function rankedSumma(census: Census): CensusRankRow[] {
	return census.rankings.summa.map(({ part, question, value }) => {
		const at = {
			kind: 'summa',
			part: summaPartSlug(part),
			question,
			article: null
		} as const;
		return {
			key: `${part} ${question}`,
			label: citationFor(at),
			fullTitle: null,
			href: hrefFor(at),
			value
		};
	});
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

/**
 * THE MARK EACH ENTRY ALREADY HAS ELSEWHERE, and taken from there rather than
 * chosen again: `shelves.ts` draws the catalogue's cards with these and
 * `/schola` lists the same works under the same glyphs, so a reader who has
 * learned a mark on either page has learned it here. `shelves.ts` states the
 * rule; this is a third surface obeying it.
 *
 * IT IS A MAP AND NOT A FIELD ON `Shelf` because the key spaces differ: the
 * catalogue has one card for the Catechism and its Compendium, and the matrix
 * has a row for each — the pair's coverage is not one number
 * (`COVERAGE_ROW_KEYS`, and `site/docs/census.md` on why the rows are works).
 * The Compendium's glyph is `/schola`'s, which is where it has one.
 *
 * The two with no card are the two that name no shelf, and `Icon.svelte`
 * carries the argument for both.
 */
export const CENSUS_ICONS: Readonly<Record<string, IconName>> = {
	// The two rows that name no work: the holding as a whole, and the
	// apparatus over it. They are this page's own subjects, so their glyphs
	// are its own — `library` here is the COLLECTION, where `PLACE_ICONS`'
	// `/bibliotheca` is the page that lists it.
	library: 'library',
	apparatus: 'link',
	// The rest are works, and the builder's key is the only thing this table
	// still says about them: the glyph itself is `work-icons.ts`'s, which is
	// what keeps a mark the same on this page, the catalogue and `/schola`.
	bible: WORK_ICONS.bible,
	catechism: WORK_ICONS.catechism,
	compendium: WORK_ICONS.compendium,
	socialDoctrine: WORK_ICONS['social-doctrine'],
	prayer: WORK_ICONS.prayer,
	canonLaw: WORK_ICONS['canon-law'],
	magisterium: WORK_ICONS.document,
	doctores: WORK_ICONS.summa
};

/**
 * Reading order on the page, which is not the order the builder writes.
 *
 * The collection as a whole and the apparatus over it are the two entries that
 * name nothing on a shelf — they are the frame the seven works sit inside, not
 * items in the list — so they lead it together on one row. Written out, the
 * builder's order would open on the collection and close on the apparatus four
 * rows later, with the pair reading as a first item and a last one.
 *
 * Everything else keeps the builder's order, which is the order a reader meets
 * the Church's texts (`shelves.ts`). `sort` is stable, so saying where two
 * entries go says nothing about the rest.
 */
const SHELF_LEAD = ['library', 'apparatus'];

const lead = (key: string) => {
	const at = SHELF_LEAD.indexOf(key);
	return at === -1 ? SHELF_LEAD.length : at;
};

/** One shelf as a heading and a sentence its numbers go into. */
export interface CensusShelf {
	key: string;
	labelKey: string;
	proseKey: string;
	icon: IconName | undefined;
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
			icon: CENSUS_ICONS[shelf.key],
			facts: shelf.facts
		}))
		.sort((a, b) => lead(a.key) - lead(b.key));
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
	icon: IconName | undefined;
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
			icon: CENSUS_ICONS[row.key],
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
 *
 * THERE IS NO `annotation` ROW AND THE BUILDER IS WHY. The census counts this
 * breakdown over the references a ranking counts, and `countsTowardsRank`
 * refuses an edition's own footnotes — so the kind never reaches this map. A
 * key here would be a row for a family no table on the page counts, printed
 * directly under those tables, and it was the largest number in the section.
 */
export const CITER_KIND_KEYS: Readonly<Record<string, string>> = {
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

/**
 * The two numbers the breakdown's own sentence needs: what its rows sum to,
 * and the total they are a part of.
 *
 * BOTH OR NEITHER. A column of counts under a stated total that it falls two
 * fifths short of is the reading this page was rebuilt to stop, and dropping
 * the commentary row is exactly what opens that gap — 41,842 references that
 * no ranking counts and no row now names. The sentence closes it by saying
 * which of the two totals the rows below are.
 */
export function citedTotals(census: Census): { counted: number; references: number } | undefined {
	const references = census.shelves.find((shelf) => shelf.key === 'apparatus')?.facts.references;
	if (references === undefined || census.countedReferences === undefined) return undefined;
	return { counted: census.countedReferences, references };
}

/**
 * The five rankings merged into one table, cut on the count.
 *
 * THE MERGE OF STORED TOPS IS THE EXACT TOP OF THE UNION, which is what makes
 * a filter over kinds safe here where a filter over citing families would not
 * be. A row in the union's top N is in its own kind's top N, its kind's list
 * being a subset of the union — so nothing the merge needs was left out of the
 * file. And a band this cut can afford is one that kind could afford too: the
 * merged list has at least as many rows above any level, so its remaining room
 * at that level is never greater.
 *
 * THE CUT IS `topOf`'s AND IS WRITTEN OUT AGAIN. A `slice` would split a tie —
 * publishing four of thirteen Catechism paragraphs cited exactly three times —
 * so whole bands are taken while the next still fits. `census.test.ts` runs
 * both implementations over the same counts.
 *
 * Ordering within a band is by kind and then by the row's own key, so a
 * rebuild over an unchanged corpus draws the same table.
 */
export function mergedRanking(
	rankings: { key: string; rows: CensusRankRow[] }[],
	limit = RANK_LIMIT
): CensusRankedRow[] {
	const rows = rankings
		.flatMap(({ key, rows }) =>
			rows.map((row) => ({ ...row, kind: key, icon: CENSUS_ICONS[RANK_ICONS[key]] }))
		)
		.sort(
			(a, b) => b.value - a.value || a.kind.localeCompare(b.kind) || a.key.localeCompare(b.key)
		);

	let kept = 0;
	for (let i = 0; i < rows.length;) {
		let j = i;
		while (j < rows.length && rows[j].value === rows[i].value) j++;
		if (j > limit) break;
		kept = j;
		i = j;
	}
	return rows.slice(0, kept);
}

/** One line of the absence ranking: a work, and how many places asked for it. */
export interface CensusAbsentRow {
	work: string;
	value: number;
}

/**
 * The works the apparatus names that this library has not got.
 *
 * NOTHING IS MAPPED HERE, and that is the finding rather than an omission.
 * Every other reader in this file turns an id into the name and the address of
 * an edition the reader could open; there is no edition, so the builder's
 * string IS the row and this is the one ranking `content` has no part in.
 * Which is also why it needs no per-row drop: the rule at the top of this file
 * exists because a slug can outlive its work, and a row here has no slug to
 * outlive anything.
 *
 * Empty for a census written before the field, which is the same silence a
 * partial sync produces one layer up.
 */
export function absentRanking(census: Census): CensusAbsentRow[] {
	return census.absent ?? [];
}

/** One line of the author ranking: whom the library is cited for, and how many
 *  places ask for him. */
export interface CensusAuthorRow {
	author: string;
	value: number;
}

/**
 * Whom the apparatus cites that this library has not got.
 *
 * THE ROW `absentRanking` LOOKS LIKE GIVING AND DOES NOT. That one names the
 * critical EDITION a text is printed in — Migne, Corpus Christianorum — which
 * is a fact about somebody else's shelf and not a work to acquire; this names
 * the man. Nothing is mapped here either, and for that function's reason:
 * there is no edition to open.
 */
export function absentAuthors(census: Census): CensusAuthorRow[] {
	return census.absentAuthors ?? [];
}

/**
 * What the absence ranking leaves out: the citations that named nothing.
 *
 * THE SAME ARITHMETIC `citedTotals` CLOSES ONE SECTION UP. A ranking of what
 * the library is asked for and lacks invites the question of how much of the
 * apparatus it accounts for, and the answer is "a small part": most of what
 * resolves to nothing names nothing either. Printed without that, the ranking
 * reads as the whole of what is missing.
 *
 * `undefined` where the census carries no such count, so the page can leave
 * the sentence out rather than assert a zero it did not measure — a build that
 * did not look and a corpus with nothing to find are not the same claim.
 */
export function unreadTotals(
	census: Census
): { ibidem: number; other: number; total: number } | undefined {
	const unread = census.unread;
	if (!unread) return undefined;
	return { ...unread, total: unread.ibidem + unread.other };
}
