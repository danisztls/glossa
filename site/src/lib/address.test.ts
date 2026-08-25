import { describe, expect, it } from 'vitest';
import { hrefFor, parseHref, previewTarget, type Address } from './address';

describe('parseHref', () => {
	describe('bible', () => {
		it('parses a bare chapter link with no verse', () => {
			expect(parseHref('/scriptura/john/1')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1
			});
		});

		it('parses a single-verse anchor (#v{n}, no ?v=)', () => {
			expect(parseHref('/scriptura/john/1#v1')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 1,
				to: 1
			});
		});

		it('parses a cited span (?v=from-to#v{first})', () => {
			expect(parseHref('/scriptura/john/1?v=1-7#v1')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 1,
				to: 7
			});
		});

		it('prefers the ?v= span over the anchor when both are present', () => {
			// The span is the more informative of the two, so it should win
			// rather than the parser picking whichever happens to be checked
			// first for no principled reason.
			expect(parseHref('/scriptura/gen/1?v=3-9#v1')).toEqual({
				kind: 'bible',
				osis: 'gen',
				chapter: 1,
				from: 3,
				to: 9,
				anchor: 1
			});
		});

		it('keeps an anchor that is not the span start', () => {
			// What `refHref` emits for an unsorted comma list: "Jn 1:7,1" spans
			// 1-7 but is about verse 7.
			expect(parseHref('/scriptura/john/1?v=1-7#v7')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 1,
				to: 7,
				anchor: 7
			});
		});

		it('supports multi-character OSIS codes (numbered books)', () => {
			expect(parseHref('/scriptura/1cor/13')).toEqual({
				kind: 'bible',
				osis: '1cor',
				chapter: 13
			});
		});

		it('falls back to the anchor when ?v= is malformed', () => {
			expect(parseHref('/scriptura/john/1?v=nonsense#v3')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 3,
				to: 3
			});
		});

		it('falls back to the anchor when ?v= is reversed (to <= from)', () => {
			expect(parseHref('/scriptura/john/1?v=7-1#v7')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1,
				from: 7,
				to: 7
			});
		});

		it('ignores an unrelated query string / hash', () => {
			expect(parseHref('/scriptura/john/1?utm=x#somewhere-else')).toEqual({
				kind: 'bible',
				osis: 'john',
				chapter: 1
			});
		});

		it('admits chapter 0, which is a book introduction', () => {
			expect(parseHref('/scriptura/gen/0')).toEqual({ kind: 'bible', osis: 'gen', chapter: 0 });
		});
	});

	describe('ccc', () => {
		it('parses a paragraph link', () => {
			expect(parseHref('/catechismus/1234')).toEqual({ kind: 'ccc', n: 1234 });
		});

		it('parses a whole-chapter link', () => {
			expect(parseHref('/catechismus/caput/27')).toEqual({ kind: 'cccChapter', n: 27 });
		});

		it('does not treat the CCC landing page as a paragraph', () => {
			expect(parseHref('/catechismus')).toBeUndefined();
		});

		it('does not treat the chapter index as a chapter link', () => {
			expect(parseHref('/catechismus/caput')).toBeUndefined();
		});
	});

	describe('compendium', () => {
		it('parses a question link', () => {
			expect(parseHref('/compendium/12')).toEqual({ kind: 'compendium', n: 12 });
		});

		it('parses a whole-chapter link', () => {
			expect(parseHref('/compendium/caput/1')).toEqual({
				kind: 'compendiumChapter',
				n: 1
			});
		});

		it('does not treat the landing page as a question', () => {
			expect(parseHref('/compendium')).toBeUndefined();
		});
	});

	describe('documents', () => {
		it('parses a section link', () => {
			expect(parseHref('/documenta/gaudium-et-spes#s19')).toEqual({
				kind: 'document',
				slug: 'gaudium-et-spes',
				n: 19
			});
		});

		it('reads an unanchored document as the whole document', () => {
			expect(parseHref('/documenta/evangelium-vitae')).toEqual({
				kind: 'document',
				slug: 'evangelium-vitae'
			});
		});

		// The shape this route used to have, before a document became one page
		// (docs/decisions.md §Addresses and editions). Nothing generates it now, and a
		// stale link from anywhere should degrade to nothing rather than to the
		// wrong thing.
		it('does not parse the retired per-section path', () => {
			expect(parseHref('/documenta/gaudium-et-spes/19')).toBeUndefined();
		});

		it('does not treat the documents library as a document', () => {
			expect(parseHref('/documenta')).toBeUndefined();
		});
	});

	describe('prayers', () => {
		it('parses a whole prayer', () => {
			expect(parseHref('/preces/sub-tuum-praesidium')).toEqual({
				kind: 'prayer',
				slug: 'sub-tuum-praesidium'
			});
		});
	});

	describe('summa', () => {
		it('parses a question and an article fragment', () => {
			expect(parseHref('/summa/ii-ii/184')).toEqual({
				kind: 'summa',
				part: 'ii-ii',
				question: 184,
				article: null
			});
			expect(parseHref('/summa/ii-ii/184#a3')).toEqual({
				kind: 'summa',
				part: 'ii-ii',
				question: 184,
				article: 3
			});
		});

		it('drops an address with no usable question number', () => {
			expect(parseHref('/summa')).toBeUndefined();
			expect(parseHref('/summa/ii-ii')).toBeUndefined();
			expect(parseHref('/summa/i')).toBeUndefined();
			expect(parseHref('/summa/i/0')).toBeUndefined();
		});
	});

	// One resource, one spelling — the rule the edge worker's cache keys depend
	// on. Only a Bible chapter may be a bare `0`.
	describe('non-canonical number spellings', () => {
		it.each([
			'/catechismus/01234',
			'/catechismus/0',
			'/catechismus/caput/01',
			'/compendium/007',
			'/compendium/0',
			'/scriptura/gen/00',
			'/scriptura/gen/01'
		])('declines %s', (href) => {
			expect(parseHref(href)).toBeUndefined();
		});
	});

	describe('chrome and non-content links', () => {
		it.each([
			'/scriptura',
			'/catechismus',
			'/compendium',
			'/documenta',
			'/preces',
			'/colophon',
			'/signata',
			'/',
			// The English route names resolve as invalid addresses site-wide
			// (docs/decisions.md §Addresses and editions); nothing may resurrect them.
			'/ccc/1213',
			'/bible/exod/3#v12',
			'/prayers/sub-tuum-praesidium',
			'/documents/lumen-gentium',
			'/scriptura/GEN/1'
		])('rejects %s', (href) => {
			expect(parseHref(href)).toBeUndefined();
		});

		it('rejects an absolute external URL', () => {
			expect(parseHref('https://www.vatican.va/archive/ccc/index.htm')).toBeUndefined();
			expect(parseHref('https://vatican.va/documenta/lumen-gentium')).toBeUndefined();
		});

		it('rejects a mailto: link', () => {
			expect(parseHref('mailto:hello@example.com')).toBeUndefined();
		});

		it('rejects null/undefined/empty hrefs', () => {
			expect(parseHref(null)).toBeUndefined();
			expect(parseHref(undefined)).toBeUndefined();
			expect(parseHref('')).toBeUndefined();
		});

		it('rejects an unparsable href without throwing', () => {
			expect(() => parseHref('http://[::not-a-host')).not.toThrow();
			expect(parseHref('http://[::not-a-host')).toBeUndefined();
		});
	});
});

/**
 * `hrefFor` is the only place a canonical URL is written and `parseHref` the
 * only place one is read, so the pair being each other's inverse is what keeps
 * a bookmark saved by one release readable by the next. These addresses are
 * public and get bookmarked; the exact strings are part of the contract, which
 * is why they are spelled out rather than derived.
 */
describe('hrefFor / parseHref round trip', () => {
	const cases: Array<[string, Address]> = [
		['/scriptura/john/1', { kind: 'bible', osis: 'john', chapter: 1 }],
		['/scriptura/gen/0', { kind: 'bible', osis: 'gen', chapter: 0 }],
		['/scriptura/john/1#v5', { kind: 'bible', osis: 'john', chapter: 1, from: 5, to: 5 }],
		['/scriptura/john/1?v=1-7#v1', { kind: 'bible', osis: 'john', chapter: 1, from: 1, to: 7 }],
		[
			// An unsorted verse list: the extent starts at 1, the citation is
			// about verse 7.
			'/scriptura/john/1?v=1-7#v7',
			{ kind: 'bible', osis: 'john', chapter: 1, from: 1, to: 7, anchor: 7 }
		],
		['/catechismus/1234', { kind: 'ccc', n: 1234 }],
		['/catechismus/caput/27', { kind: 'cccChapter', n: 27 }],
		['/compendium/12', { kind: 'compendium', n: 12 }],
		['/compendium/caput/1', { kind: 'compendiumChapter', n: 1 }],
		['/documenta/lumen-gentium', { kind: 'document', slug: 'lumen-gentium' }],
		['/documenta/lumen-gentium#s12', { kind: 'document', slug: 'lumen-gentium', n: 12 }],
		['/summa/i/1', { kind: 'summa', part: 'i', question: 1, article: null }],
		['/summa/ii-ii/184#a3', { kind: 'summa', part: 'ii-ii', question: 184, article: 3 }],
		['/preces/our-father', { kind: 'prayer', slug: 'our-father' }]
	];

	it.each(cases)('writes %s', (href, address) => {
		expect(hrefFor(address)).toBe(href);
	});

	it.each(cases)('reads %s back to the same address', (href, address) => {
		expect(parseHref(href)).toEqual(address);
	});
});

/**
 * An unanchored document link and a prayer are navigation, not quotable units
 * — see `PreviewTarget`'s docblock. Everything else a reader can address, the
 * popover can show.
 */
describe('previewTarget', () => {
	it('declines a whole document', () => {
		expect(previewTarget('/documenta/gaudium-et-spes')).toBeUndefined();
	});

	it('declines a whole prayer', () => {
		expect(previewTarget('/preces/sub-tuum-praesidium')).toBeUndefined();
	});

	it('accepts a document section', () => {
		expect(previewTarget('/documenta/gaudium-et-spes#s19')).toEqual({
			kind: 'document',
			slug: 'gaudium-et-spes',
			n: 19
		});
	});

	// A Summa question is a page, but it is also a unit: this work cites itself
	// 5,180 times, which is what earned it a preview.
	it('accepts a Summa question and one of its articles', () => {
		expect(previewTarget('/summa/ii-ii/184')).toEqual({
			kind: 'summa',
			part: 'ii-ii',
			question: 184,
			article: null
		});
		expect(previewTarget('/summa/ii-ii/184#a3')).toEqual({
			kind: 'summa',
			part: 'ii-ii',
			question: 184,
			article: 3
		});
	});

	it('accepts a verse', () => {
		expect(previewTarget('/scriptura/exod/3#v12')).toEqual({
			kind: 'bible',
			osis: 'exod',
			chapter: 3,
			from: 12,
			to: 12
		});
	});
});
