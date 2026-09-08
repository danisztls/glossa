import { describe, expect, it } from 'vitest';
import { buildCensus, censusValue, countsTowardsRank, topOf } from '../../scripts/census.mjs';
import { CENSUS_GROUP_KEYS, CITER_KIND_KEYS } from './census';
import { en } from './i18n/en';
import type { Citer } from './types';

/**
 * The census, over a corpus small enough to count by hand.
 *
 * WHAT IS UNDER TEST IS THE MEASUREMENT AND NOT THE ARITHMETIC. Summing a
 * list is not where this goes wrong; the three decisions are — which citers
 * count, whether a citer that cites four verses of one chapter counts once or
 * four times, and where a ranking is allowed to stop. Each has a corpus
 * condition behind it that a plain sum would report the wrong answer for, and
 * each is asserted below against a fixture built to contain that condition.
 *
 * The last block is the one that catches an ordinary edit: every key the
 * builder can emit has to be a string somebody wrote, or the page renders a
 * dotted key at a reader.
 */

/** Two citers of one address, one of which is an edition's own footnote. */
const doc = (slug: string, n: number): Citer => ({ kind: 'document', slug, n });
const note = (verse: number): Citer => ({
	kind: 'annotation',
	work: 'commentary.haydock.en',
	osis: 'matt',
	chapter: 5,
	verse
});

const routeManifest = {
	version: 1 as const,
	workCount: 5,
	contentAssetCount: 40,
	// Genesis carries an introduction (chapter 0) and John does not, which is
	// what separates the `chapters` row from the `introductions` one.
	bible: { gen: [0, 1, 2], john: [1] },
	ccc: [1, 2],
	cccChapters: [1],
	compendium: [1],
	compendiumChapters: [1],
	socialDoctrine: [1, 2, 3],
	socialDoctrineChapters: [1],
	canonLaw: [1, 2],
	canonLawTitles: [1],
	documents: ['lumen-gentium', 'rerum-novarum'],
	prayers: ['our-father'],
	summa: { i: [1, 2] }
};

const manifests = {
	'bible.cpdv.en': { type: 'bible', language: 'en' },
	'bible.clementina.la': { type: 'bible', language: 'la' },
	'commentary.haydock.en': { type: 'commentary', language: 'en' },
	'ccc.en': { type: 'catechism', language: 'en' },
	'vatii.lumen-gentium.en': { type: 'document', language: 'en' },
	'encyclical.rerum-novarum.en': { type: 'document', language: 'en' }
};

const works = { works: [{ source: 'https://vatican.va/x', languages: ['en', 'la'] }] };

const census = buildCensus({
	manifests,
	routeManifest,
	works,
	apparatus: { descriptions: { 'lumen-gentium': 'a' } },
	addressCount: 11,
	uiLangCount: 37,
	scriptureByBook: {
		matt: {
			// ONE citer over four verses of one chapter, beside three notes on
			// the same verses. Counted as stored that is seven references to
			// Matthew 5; counted as citing places it is one.
			'5': {
				'3': [doc('lumen-gentium', 8), note(3)],
				'4': [doc('lumen-gentium', 8), note(4)],
				'5': [doc('lumen-gentium', 8)],
				'6': [doc('lumen-gentium', 8), note(6)]
			},
			// Two distinct places, so this chapter outranks the one above.
			'25': {
				'40': [doc('rerum-novarum', 1), doc('lumen-gentium', 9)]
			}
		}
	},
	citationXrefs: {
		documents: [
			// Lumen Gentium citing itself, which is the whole of what this
			// document is cited by here — so it must not appear in the ranking.
			{ work: 'lumen-gentium', n: 1, cited_by: [doc('lumen-gentium', 40)] },
			{ work: 'rerum-novarum', n: 1, cited_by: [doc('lumen-gentium', 8)] }
		],
		ccc: [{ ccc: 1, cited_by: [doc('lumen-gentium', 8)] }],
		summa: [{ part: 'I', question: 1, article: 1, cited_by: [doc('lumen-gentium', 8)] }]
	},
	summaArticles: new Map([['I', new Map([[1, new Set([1, 2])]])]])
});

describe('the tally', () => {
	it('counts a citing place once however many verses it cites', () => {
		const matt5 = census.rankings.chapters.find((c) => c.chapter === 5);
		expect(matt5?.value).toBe(1);
	});

	it('ranks by citing places, so the chapter cited by two works leads', () => {
		expect(census.rankings.chapters.map((c) => c.chapter)).toEqual([25, 5]);
	});

	it("leaves an edition's own notes out of a ranking and keeps them in the ledger", () => {
		// Matthew is cited by three distinct places — Lumen Gentium §8 and §9
		// and Rerum Novarum §1 — beside three of Haydock's notes, which the
		// ledger counts and the ranking does not.
		expect(census.rankings.books).toEqual([{ osis: 'matt', value: 3 }]);
		expect(censusValue(census, 'apparatus', 'referencesFromNotes')).toBe(3);
	});

	it('drops a work citing itself, so a document cited only by itself is not ranked', () => {
		expect(census.rankings.documents.map((d) => d.slug)).toEqual(['rerum-novarum']);
	});

	it('still counts every reference in the ledger, self-citation and notes alike', () => {
		// 9 rows in the scripture index + 2 document + 1 ccc + 1 summa.
		expect(censusValue(census, 'apparatus', 'references')).toBe(13);
	});

	it('breaks the citers down by kind, largest first', () => {
		expect(census.citers).toEqual([
			{ kind: 'document', value: 10 },
			{ kind: 'annotation', value: 3 }
		]);
	});
});

describe('the ledger', () => {
	it('counts a book introduction as an introduction and not as a chapter', () => {
		expect(censusValue(census, 'bible', 'chapters')).toBe(3);
		expect(censusValue(census, 'bible', 'introductions')).toBe(1);
	});

	it('counts editions by manifest type', () => {
		expect(censusValue(census, 'bible', 'bibleEditions')).toBe(2);
		expect(censusValue(census, 'bible', 'annotatedEditions')).toBe(1);
		expect(censusValue(census, 'magisterium', 'documentEditions')).toBe(2);
	});

	/**
	 * The corpus condition this exists for: the fixtures hold no Code and no
	 * prayers, and a `Canons — 0` row is this page asserting the Church has no
	 * law rather than reporting that nothing was synced.
	 */
	it('writes no row and no group for a work type this build does not hold', () => {
		const empty = buildCensus({
			manifests: {},
			routeManifest: { ...routeManifest, canonLaw: [], canonLawTitles: [] },
			works,
			apparatus: { descriptions: {} },
			addressCount: 1,
			uiLangCount: 1,
			scriptureByBook: {},
			citationXrefs: { documents: [], ccc: [], summa: [] },
			summaArticles: new Map()
		});
		expect(empty.groups.map((g) => g.key)).not.toContain('canonLaw');
		expect(() => censusValue(empty, 'canonLaw', 'canons')).toThrow(/no row/);
	});

	it('carries the three things llms.txt needs that are not counts', () => {
		expect(census.languages).toEqual(['en', 'la']);
		expect(census.summaParts).toEqual(['i']);
		expect(census.maxima.ccc).toBe(2);
	});
});

describe('topOf', () => {
	const tally = (counts: Record<string, number>) =>
		new Map(
			Object.entries(counts).map(([id, n]) => [
				id,
				new Set(Array.from({ length: n }, (_, i) => `c${i}`))
			])
		);
	const compare = (a: string, b: string) => a.localeCompare(b);

	/**
	 * The rule the Catechism's ranking is shaped by: thirteen paragraphs are
	 * cited exactly three times, and publishing four of them would be a claim
	 * about those four that nothing supports.
	 */
	it('cuts on the count, never through a tie', () => {
		const rows = topOf(tally({ a: 5, b: 3, c: 3, d: 3 }), compare, 3);
		expect(rows.map((r) => r.id)).toEqual(['a']);
	});

	it('takes a whole band that fits exactly', () => {
		const rows = topOf(tally({ a: 5, b: 3, c: 3 }), compare, 3);
		expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
	});

	it('publishes nothing rather than an arbitrary half of one band', () => {
		expect(topOf(tally({ a: 1, b: 1, c: 1 }), compare, 2)).toEqual([]);
	});

	it('orders a band by the tie-break, so a rebuild produces the same file', () => {
		const rows = topOf(tally({ zeta: 2, alpha: 2 }), compare, 4);
		expect(rows.map((r) => r.id)).toEqual(['alpha', 'zeta']);
	});
});

describe('countsTowardsRank', () => {
	it('excludes an annotation whatever it cites', () => {
		expect(countsTowardsRank(note(1))).toBe(false);
		expect(countsTowardsRank(note(1), 'document lumen-gentium')).toBe(false);
	});

	it('excludes a work citing itself and keeps it citing another', () => {
		expect(countsTowardsRank(doc('lumen-gentium', 8), 'document lumen-gentium')).toBe(false);
		expect(countsTowardsRank(doc('lumen-gentium', 8), 'document rerum-novarum')).toBe(true);
	});

	it('keeps every citer where the cited work names none — Scripture', () => {
		expect(countsTowardsRank(doc('lumen-gentium', 8))).toBe(true);
		expect(countsTowardsRank({ kind: 'ccc', n: 1 })).toBe(true);
	});
});

/**
 * THE PAGE RENDERS `t(key)` FOR EVERY ROW IT IS GIVEN, and `t()` shows the key
 * itself when nothing answers — so a row added to `scripts/census.mjs` without
 * a string reaches a reader as `census.row.canonLawTitles`. Nothing in
 * `npm test` renders a component, so the assertion is about the DICTIONARY,
 * which is `pigments.test.ts`'s move for a colour literal and
 * `citation-punctuation.test.ts`'s for a hardcoded colon.
 *
 * It runs over a census built to hold every group, which is what makes it a
 * check on the builder rather than on a list somebody kept in step by hand.
 */
describe('every key the builder emits is a string somebody wrote', () => {
	const strings = en as Record<string, string>;

	it.each(census.groups.map((g) => g.key))('names the group %s', (key) => {
		expect(CENSUS_GROUP_KEYS[key], `no heading key for group \`${key}\``).toBeTruthy();
		expect(strings[CENSUS_GROUP_KEYS[key]]).toBeTruthy();
	});

	it.each(census.groups.flatMap((g) => g.rows.map((r) => r.key)))('names the row %s', (key) => {
		expect(strings[`census.row.${key}`], `no string for \`census.row.${key}\``).toBeTruthy();
	});

	it.each(Object.keys(census.rankings))('names the ranking %s', (key) => {
		expect(strings[`census.rank.${key}`]).toBeTruthy();
	});

	it.each(Object.entries(CITER_KIND_KEYS))('names the citer kind %s', (_kind, key) => {
		expect(strings[key]).toBeTruthy();
	});

	it('writes the page its own furniture', () => {
		for (const key of [
			'census.title',
			'census.tagline',
			'census.holdings',
			'census.cited',
			'census.citers',
			'census.method',
			'census.derived',
			'census.unavailable',
			'census.timesCited',
			'census.link'
		]) {
			expect(strings[key], `no string for \`${key}\``).toBeTruthy();
		}
	});
});
