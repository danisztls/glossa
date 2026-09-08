import { describe, expect, it } from 'vitest';
import { buildCensus, censusFact, countsTowardsRank, topOf } from '../../scripts/census.mjs';
import {
	CENSUS_ICONS,
	CENSUS_SHELF_KEYS,
	CITER_KIND_KEYS,
	RANK_HIDDEN_BY_DEFAULT,
	RANK_KINDS,
	censusProse,
	censusShelves,
	coverageRows,
	mergedRanking,
	rankedCcc,
	rankedSumma
} from './census';
import { en } from './i18n/en';
import type { Census, Citer } from './types';

/**
 * The census, over a corpus small enough to count by hand.
 *
 * WHAT IS UNDER TEST IS THE MEASUREMENT AND NOT THE ARITHMETIC. Summing a
 * list is not where this goes wrong; the decisions are — which citers count,
 * whether a citer that cites four verses of one chapter counts once or four
 * times, where a ranking is allowed to stop, and what a coverage cell is a
 * fraction OF. Each has a corpus condition behind it that a plain sum would
 * answer wrongly, and each is asserted below against a fixture built to
 * contain that condition.
 *
 * The last block is the one that catches an ordinary edit: every key the
 * builder can emit has to be a string somebody wrote, and every fact has to
 * have somewhere in a sentence to go.
 */

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
	// what keeps the coverage denominator off by exactly that one.
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
	'ccc.la': { type: 'catechism', language: 'la' },
	'compendium.en': { type: 'compendium', language: 'en' },
	'csdc.en': { type: 'social-doctrine', language: 'en' },
	'cic.en': { type: 'canon-law', language: 'en' },
	'prayer.en': { type: 'prayer', language: 'en' },
	'summa.en': { type: 'summa', language: 'en' },
	'vatii.lumen-gentium.en': { type: 'document', language: 'en' },
	'encyclical.rerum-novarum.en': { type: 'document', language: 'en' },
	'encyclical.rerum-novarum.la': { type: 'document', language: 'la' }
};

const works = { works: [{ source: 'https://vatican.va/x', languages: ['en', 'la'] }] };

/** Three interface languages, one of which the corpus has nothing in. */
const uiLangs = ['en', 'la', 'ja'] as const;

const input = {
	manifests,
	routeManifest,
	works,
	apparatus: { descriptions: { 'lumen-gentium': 'a' } },
	addressCount: 11,
	uiLangs,
	// English has both books; Latin has Genesis only — a partial reach, which
	// is what makes a coverage cell a fraction rather than a tick.
	bibleIndex: {
		'bible.cpdv.en': {
			books: [
				{ osis: 'gen', chapters: [{ n: 0 }, { n: 1 }, { n: 2 }] },
				{ osis: 'john', chapters: [{ n: 1 }] }
			]
		},
		'bible.clementina.la': { books: [{ osis: 'gen', chapters: [{ n: 1 }, { n: 2 }] }] }
	},
	cccEditions: [
		{ lang: 'en', paragraphs: [{ n: 1 }, { n: 2 }] },
		{ lang: 'la', paragraphs: [{ n: 1 }] }
	],
	compendiumEditions: [{ lang: 'en', questions: [{ n: 1 }] }],
	socialDoctrineEditions: [{ lang: 'en', sections: [{ n: 1 }, { n: 2 }, { n: 3 }] }],
	canonLawEditions: [{ lang: 'en', sections: [{ n: 1 }, { n: 2 }] }],
	prayerIndex: { en: { prayers: [{ slug: 'our-father' }] } },
	documentEditions: [
		{ slug: 'lumen-gentium', lang: 'en' },
		{ slug: 'rerum-novarum', lang: 'en' },
		{ slug: 'rerum-novarum', lang: 'la' }
	],
	summaIndex: {
		en: {
			questions: [
				{ part: 'I', n: 1 },
				{ part: 'I', n: 2 }
			]
		}
	},
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
			'25': { '40': [doc('rerum-novarum', 1), doc('lumen-gentium', 9)] }
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
};

const census = buildCensus(input);

describe('the tally', () => {
	it('counts a citing place once however many verses it cites', () => {
		expect(census.rankings.chapters.find((c) => c.chapter === 5)?.value).toBe(1);
	});

	it('ranks by citing places, so the chapter cited by two works leads', () => {
		expect(census.rankings.chapters.map((c) => c.chapter)).toEqual([25, 5]);
	});

	it("leaves an edition's own notes out of the ranking and out of the breakdown", () => {
		// Matthew is cited by three distinct places — Lumen Gentium §8 and §9
		// and Rerum Novarum §1 — beside three of Haydock's notes, which the
		// apparatus's own total counts and neither the ranking nor the
		// breakdown printed under it does.
		expect(census.rankings.books).toEqual([{ osis: 'matt', value: 3 }]);
		expect(census.citers.map((c) => c.kind)).not.toContain('annotation');
		expect(censusFact(census, 'apparatus', 'references')).toBe(13);
	});

	it('drops a work citing itself, so a document cited only by itself is not ranked', () => {
		expect(census.rankings.documents.map((d) => d.slug)).toEqual(['rerum-novarum']);
	});

	/**
	 * THE READING THAT MADE THE LEDGER PROSE. A cross-reference is an edge and
	 * the two counts beside it are its endpoints, so they do not sum to it —
	 * which is exactly what a list of bare figures invited someone to try.
	 */
	it('counts references as edges and the two endpoint totals as nodes', () => {
		// 9 rows in the scripture index + 2 document + 1 ccc + 1 summa.
		expect(censusFact(census, 'apparatus', 'references')).toBe(13);
		// Four distinct citing places: LG 8, LG 9, LG 40, RN 1, plus 3 notes.
		expect(censusFact(census, 'apparatus', 'citingPlaces')).toBe(7);
		// Five verses + 2 document sections + 1 paragraph + 1 article.
		expect(censusFact(census, 'apparatus', 'citedAddresses')).toBe(9);
	});

	/**
	 * The breakdown counts what a RANKING counts, which is why it falls short
	 * of the apparatus's own total: three of the thirteen references are an
	 * edition's own notes, and the tenth is Lumen Gentium citing itself.
	 */
	it('breaks the counted citers down by kind, largest first', () => {
		expect(census.citers).toEqual([{ kind: 'document', value: 9 }]);
	});

	/**
	 * THE ARITHMETIC THE PAGE PRINTS. Dropping the notes from that list is what
	 * opens a gap between it and the stated total, so the number closing the
	 * gap is derived here rather than added up on the page.
	 */
	it('states what the breakdown sums to', () => {
		const summed = census.citers.reduce((n, c) => n + c.value, 0);
		expect(census.countedReferences).toBe(summed);
		expect(census.countedReferences).toBeLessThan(censusFact(census, 'apparatus', 'references'));
	});
});

describe('coverage', () => {
	const row = (key: string) => census.coverage.rows.find((r) => r.key === key);
	const cell = (key: string, lang: string) =>
		row(key)?.values[census.coverage.languages.indexOf(lang)];

	it('counts a book introduction out of the denominator', () => {
		// gen 1, gen 2, john 1 — chapter 0 is an introduction, not a chapter.
		expect(row('bible')?.of).toBe(3);
	});

	it('unions a language across its editions and reports a partial reach', () => {
		expect(cell('bible', 'en')).toBe(3);
		expect(cell('bible', 'la')).toBe(2);
		expect(cell('bible', 'ja')).toBe(0);
	});

	it('gives the Catechism and its Compendium a row each, not their union', () => {
		expect(cell('catechism', 'la')).toBe(1);
		expect(cell('compendium', 'la')).toBe(0);
	});

	it('counts a document once per language however many editions carry it', () => {
		expect(row('magisterium')?.of).toBe(2);
		expect(cell('magisterium', 'en')).toBe(2);
		expect(cell('magisterium', 'la')).toBe(1);
	});

	/** The order is the picture: a language carrying more of the library comes
	 *  first, and the empty ones fall to the end where the tail is the finding. */
	it('orders the languages by how much of the whole library they carry', () => {
		expect(census.coverage.languages).toEqual(['en', 'la', 'ja']);
	});

	it('keeps a language that carries nothing, because the tail is the finding', () => {
		expect(census.coverage.languages).toContain('ja');
		for (const r of census.coverage.rows) {
			expect(r.values).toHaveLength(3);
		}
	});

	it('turns each cell into a fraction of its own row', () => {
		const rows = coverageRows(census as unknown as Census);
		const bible = rows.find((r) => r.key === 'bible');
		expect(bible?.cells.map((c) => c.fraction)).toEqual([1, 2 / 3, 0]);
		expect(bible?.languages).toBe(2);
	});
});

describe('the shelves', () => {
	it('names a shelf only where this build holds the thing it counts', () => {
		const empty = buildCensus({
			...input,
			manifests: {},
			routeManifest: { ...routeManifest, canonLaw: [], canonLawTitles: [] },
			canonLawEditions: []
		});
		expect(empty.shelves.map((s) => s.key)).not.toContain('canonLaw');
		expect(() => censusFact(empty, 'canonLaw', 'canons')).toThrow(/no fact/);
	});

	it('carries the three things llms.txt needs that are not counts', () => {
		expect(census.languages).toEqual(['en', 'la']);
		expect(census.summaParts).toEqual(['i']);
		expect(census.maxima.ccc).toBe(2);
	});

	/**
	 * The two entries that name nothing on a shelf lead the list TOGETHER, and
	 * the builder's order does not put them there — it opens on the collection
	 * and closes on the apparatus. The page lays the sentences out in a
	 * two-column grid filled row by row, so this order is what puts the pair on
	 * one row; asserted here because nothing about the rendered page can say it.
	 */
	it('leads with the collection and the apparatus, in that order', () => {
		const keys = censusShelves(census as unknown as Census).map((shelf) => shelf.key);
		expect(keys.slice(0, 2)).toEqual(['library', 'apparatus']);
	});

	it('keeps the builder’s order for everything else', () => {
		const built = census.shelves
			.map((shelf) => shelf.key)
			.filter((key) => key !== 'library' && key !== 'apparatus');
		const shown = censusShelves(census as unknown as Census)
			.map((shelf) => shelf.key)
			.slice(2);
		expect(shown).toEqual(built);
	});
});

/**
 * EVERY NAMED ENTRY HAS A GLYPH, both ways round. A shelf or a matrix row with
 * no icon renders its name with a gap where its neighbours have a mark, and an
 * icon keyed to nothing is a mark for an entry that no longer exists — neither
 * is visible in the output, and the second survives a rename of the entry it
 * was drawn for.
 */
describe('the glyphs', () => {
	it('gives every shelf and every coverage row a mark', () => {
		for (const key of Object.keys(CENSUS_SHELF_KEYS)) {
			expect(CENSUS_ICONS[key], `no icon for \`${key}\``).toBeTruthy();
		}
	});

	it('draws no mark for an entry the census does not name', () => {
		for (const key of Object.keys(CENSUS_ICONS)) {
			expect(CENSUS_SHELF_KEYS[key], `icon \`${key}\` names no shelf`).toBeTruthy();
		}
	});

	it('carries the mark through to the rows the page renders', () => {
		for (const row of coverageRows(census as unknown as Census)) {
			expect(row.icon, `no icon on coverage row \`${row.key}\``).toBeTruthy();
		}
		for (const shelf of censusShelves(census as unknown as Census)) {
			expect(shelf.icon, `no icon on shelf \`${shelf.key}\``).toBeTruthy();
		}
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
		expect(topOf(tally({ a: 5, b: 3, c: 3, d: 3 }), compare, 3).map((r) => r.id)).toEqual(['a']);
	});

	it('takes a whole band that fits exactly', () => {
		expect(topOf(tally({ a: 5, b: 3, c: 3 }), compare, 3).map((r) => r.id)).toEqual([
			'a',
			'b',
			'c'
		]);
	});

	it('publishes nothing rather than an arbitrary half of one band', () => {
		expect(topOf(tally({ a: 1, b: 1, c: 1 }), compare, 2)).toEqual([]);
	});

	it('orders a band by the tie-break, so a rebuild produces the same file', () => {
		expect(topOf(tally({ zeta: 2, alpha: 2 }), compare, 4).map((r) => r.id)).toEqual([
			'alpha',
			'zeta'
		]);
	});
});

/**
 * ONE RULE, TWO IMPLEMENTATIONS, AND THIS IS WHAT MAKES THAT SAFE.
 *
 * `topOf` cuts the builder's `Map` of citer sets under Node; `mergedRanking`
 * cuts rows already named out of the reader's own edition. They cannot be one
 * function and they must not disagree — a page that splits a tie the file did
 * not is a ranking whose bottom row is arbitrary in exactly the way the rule
 * exists to prevent. So both are run over the same counts.
 */
describe('the two cuts agree', () => {
	const cases: Record<string, number>[] = [
		{ a: 5, b: 4, c: 3 },
		{ a: 5, b: 3, c: 3 },
		{ a: 1, b: 1, c: 1 },
		{ a: 9, b: 9, c: 2, d: 2, e: 2 },
		{}
	];

	for (const counts of cases) {
		for (const limit of [1, 2, 3, 5]) {
			it(`${JSON.stringify(counts)} cut at ${limit}`, () => {
				const byTopOf = topOf(
					new Map(
						Object.entries(counts).map(([id, n]) => [
							id,
							new Set(Array.from({ length: n }, (_, i) => `c${i}`))
						])
					),
					(a, b) => a.localeCompare(b),
					limit
				).map((r) => r.id);

				const byMerge = mergedRanking(
					[
						{
							key: 'books',
							rows: Object.entries(counts)
								.map(([key, value]) => ({
									key,
									label: key,
									fullTitle: null,
									href: '/',
									value
								}))
								.sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
						}
					],
					limit
				).map((r) => r.key);

				expect(byMerge).toEqual(byTopOf);
			});
		}
	}
});

/**
 * A ROW IN A MERGED TABLE NAMES ITS OWN WORK, because there is no longer a
 * heading over it doing so. Both labels come from `citationFor` — the site's
 * one notation, read out of the tables `/schola` teaches from — and what is
 * asserted here is that they are not spelled in this file: a page that teaches
 * `CCC 1234` and ranks `¶1234` has taught nothing.
 */
describe('a ranked row is written as a citation', () => {
	it('gives a Catechism paragraph the siglum the interface uses for it', () => {
		const rows = rankedCcc(census as unknown as Census);
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0].label).toBe(`${en['ccc.abbrev']} ${rows[0].key}`);
	});

	it('gives a Summa question the scholastic short form, not a bare part', () => {
		const rows = rankedSumma(census as unknown as Census);
		expect(rows.length).toBeGreaterThan(0);
		// `STh` and not `S.Th.`: `/schola`'s specimen is what the site teaches.
		expect(rows[0].label).toMatch(/^STh [IV-]+, \d+$/);
	});
});

describe('mergedRanking', () => {
	const rows = (key: string, counts: Record<string, number>) => ({
		key,
		rows: Object.entries(counts)
			.map(([k, value]) => ({ key: k, label: k, fullTitle: null, href: '/', value }))
			.sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
	});

	it('interleaves the kinds by count, so one table ranks them together', () => {
		const merged = mergedRanking(
			[rows('documents', { lg: 9, gs: 4 }), rows('ccc', { '1': 7, '2': 3 })],
			10
		);
		expect(merged.map((r) => [r.kind, r.value])).toEqual([
			['documents', 9],
			['ccc', 7],
			['documents', 4],
			['ccc', 3]
		]);
	});

	it('marks every row with the glyph of the work it belongs to', () => {
		const merged = mergedRanking([rows('chapters', { a: 1 }), rows('summa', { b: 1 })], 10);
		expect(merged.find((r) => r.kind === 'chapters')?.icon).toBe('scroll');
		expect(merged.find((r) => r.kind === 'summa')?.icon).toBe('feather');
	});

	/**
	 * The property the kind filter rests on: dropping a kind re-cuts the table
	 * rather than leaving a hole in it, so what a reader sees is always the
	 * real top of what they asked for.
	 */
	it('re-cuts when a kind is dropped, rather than leaving its rows out', () => {
		const both = [rows('books', { m: 90, j: 80 }), rows('ccc', { '1': 5, '2': 4, '3': 3 })];
		expect(mergedRanking(both, 2).map((r) => r.key)).toEqual(['m', 'j']);
		expect(mergedRanking(both.slice(1), 2).map((r) => r.key)).toEqual(['1', '2']);
	});

	it('is empty when every kind is switched off', () => {
		expect(mergedRanking([], 20)).toEqual([]);
	});
});

/**
 * The one kind that starts hidden, and it is hidden because it is an
 * AGGREGATE: a book's count is every place citing any chapter of it, so shown
 * beside its own chapters it answers the table twice. Measured over the real
 * corpus, the top twenty of everything is eighteen books and two documents.
 */
describe('the ranking kinds', () => {
	it('starts with the books switched off and nothing else', () => {
		expect(RANK_HIDDEN_BY_DEFAULT).toEqual(['books']);
	});

	it('names a heading for every kind', () => {
		for (const kind of RANK_KINDS) {
			expect(en[`census.rank.${kind}`], `no heading for \`${kind}\``).toBeTruthy();
		}
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

describe('censusProse', () => {
	it('substitutes every fact through the reader’s own formatter', () => {
		const out = censusProse('{a} of {b}', { a: 1704, b: 2 }, (v) => v.toLocaleString('pt-BR'));
		expect(out).toBe('1.704 of 2');
	});

	it('replaces a placeholder that occurs more than once', () => {
		expect(censusProse('{a}/{a}', { a: 3 }, String)).toBe('3/3');
	});
});

/**
 * THE PAGE RENDERS `t(key)` FOR EVERYTHING IT IS GIVEN, and `t()` shows the
 * key itself when nothing answers — so a shelf added to `scripts/census.mjs`
 * without a string reaches a reader as `census.prose.lectionary`. Nothing in
 * `npm test` renders a component, so the assertion is about the DICTIONARY,
 * which is `pigments.test.ts`'s move for a colour literal and
 * `citation-punctuation.test.ts`'s for a hardcoded colon.
 *
 * The placeholder pair is the half that cannot be seen by reading the output.
 * A fact with no placeholder is a number this build still computes and no
 * longer publishes — `llmsTxt`'s quiet failure one surface over; a
 * placeholder with no fact reaches a reader as the literal `{documents}`.
 */
describe('every key the builder emits is a string somebody wrote', () => {
	const strings = en as Record<string, string>;

	it.each(census.shelves.map((s) => s.key))('names the shelf %s', (key) => {
		expect(CENSUS_SHELF_KEYS[key], `no heading key for shelf \`${key}\``).toBeTruthy();
		expect(strings[CENSUS_SHELF_KEYS[key]]).toBeTruthy();
		expect(strings[`census.prose.${key}`], `no sentence for shelf \`${key}\``).toBeTruthy();
	});

	it.each(census.shelves.map((s) => [s.key, s.facts] as const))(
		'%s: every fact has a placeholder and every placeholder a fact',
		(key, facts) => {
			const sentence = strings[`census.prose.${key}`];
			const asked = [...sentence.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]);
			expect([...asked].sort(), `placeholders in census.prose.${key}`).toEqual(
				Object.keys(facts).sort()
			);
		}
	);

	it.each(census.coverage.rows.map((r) => r.key))('names the coverage row %s', (key) => {
		const rows = coverageRows(census as unknown as Census);
		const row = rows.find((r) => r.key === key);
		expect(row, `coverage row \`${key}\` has no label key`).toBeTruthy();
		expect(strings[row!.labelKey]).toBeTruthy();
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
			'census.reach',
			'census.reachLede',
			'census.reachRow',
			'census.reachCell',
			'census.reachNone',
			'census.cited',
			'census.citers',
			'census.method',
			'census.derived',
			'census.unavailable',
			'census.timesCited',
			'census.rankFilter',
			// One per `i` button. A trigger with no text of its own is read out
			// by its label alone, so a missing one is a button announced as
			// nothing at all.
			'census.about.derived',
			'census.about.reach',
			'census.about.cited'
		]) {
			expect(strings[key], `no string for \`${key}\``).toBeTruthy();
		}
	});

	/** The matrix's own two sentences carry placeholders the page substitutes
	 *  by hand, so they are checked the same way the shelves' are. */
	it('keeps the placeholders the matrix substitutes', () => {
		expect(strings['census.reachRow']).toContain('{languages}');
		expect(strings['census.reachRow']).toContain('{total}');
		expect(strings['census.reachRow']).toContain('{of}');
		expect(strings['census.reachCell']).toContain('{value}');
		expect(strings['census.reachCell']).toContain('{of}');
	});
});
