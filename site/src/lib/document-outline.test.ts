import { describe, it, expect } from 'vitest';
import { buildDocumentOutline } from './corpus';
import type { DocumentNode } from './types';

/*
 * `structure.json` stores a flat list of headings with a `level` and an
 * anchor; nesting and ranges are DERIVED (docs/corpus-schema.md, amended
 * 2026-08-21). That derivation replaced stored `[lo, hi]` spans precisely
 * because those drifted from the text — 680 null-ranged nodes, chapters
 * truncated to a single paragraph, sections overreaching into the next
 * chapter. Deriving it moves the risk into this one function, so it is the
 * function that needs pinning down.
 */
const row = (level: number, title: string, before: number | null): DocumentNode => ({
	level,
	title,
	before
});

describe('buildDocumentOutline', () => {
	it('nests by level and ends a heading where the next equal-or-shallower one starts', () => {
		// Gaudium et Spes' real shape: a part, its chapters, a chapter's sections.
		const out = buildDocumentOutline(
			[
				row(1, 'PART I', 11),
				row(2, 'CHAPTER I', 12),
				row(2, 'CHAPTER II', 23),
				row(1, 'PART II', 46),
				row(2, 'CHAPTER I', 47),
				row(3, 'SECTION 1', 54)
			],
			93
		);

		expect(out.map((n) => n.title)).toEqual(['PART I', 'PART II']);
		expect(out[0].paragraphs).toEqual([11, 45]); // ends before PART II
		expect(out[0].children.map((c) => c.title)).toEqual(['CHAPTER I', 'CHAPTER II']);
		expect(out[0].children[0].paragraphs).toEqual([12, 22]); // ends before CHAPTER II
		expect(out[1].children[0].children[0].title).toBe('SECTION 1');
		expect(out[1].children[0].children[0].paragraphs).toEqual([54, 93]); // to the end
	});

	it('runs the last heading to the document end', () => {
		const out = buildDocumentOutline([row(1, 'ONLY', 1)], 64);
		expect(out[0].paragraphs).toEqual([1, 64]);
	});

	it('leaves an unanchored heading unaddressable rather than guessing a span', () => {
		// `before: null` is trailing matter the numbered flow never reaches.
		// A consumer must not link it; inventing a range would make it look
		// addressable, which is the failure the stored spans used to produce.
		const out = buildDocumentOutline([row(1, 'A', 1), row(1, 'APPENDIX', null)], 10);
		expect(out[1].paragraphs).toEqual([null, null]);
	});

	it('skips back out of a deep run to a shallower sibling', () => {
		const out = buildDocumentOutline(
			[row(1, 'A', 1), row(2, 'A.1', 2), row(3, 'A.1.a', 3), row(1, 'B', 8)],
			12
		);
		expect(out.map((n) => n.title)).toEqual(['A', 'B']);
		expect(out[0].paragraphs).toEqual([1, 7]);
		expect(out[0].children[0].children[0].title).toBe('A.1.a');
		expect(out[0].children[0].children[0].paragraphs).toEqual([3, 7]);
	});

	it('returns nothing for a document with no headings', () => {
		expect(buildDocumentOutline([], 40)).toEqual([]);
	});

	it('treats headings sharing one anchor as one heading, not a boundary', () => {
		// Magnifica Humanitas prints "CHAPTER THREE", "TECHNOLOGY AND
		// DOMINANCE." and "THE GRANDEUR OF HUMANITY..." as three lines all
		// standing before section 90, and its own table of contents gives
		// all three the same level. Ending each at the next one yields the
		// inverted range [90, 89] and an empty chapter.
		const out = buildDocumentOutline(
			[
				row(1, 'CHAPTER THREE', 90),
				row(1, 'TECHNOLOGY AND DOMINANCE.', 90),
				row(1, 'THE GRANDEUR OF HUMANITY', 90),
				row(2, 'The technocratic paradigm', 92),
				row(1, 'CHAPTER FOUR', 131)
			],
			200
		);
		expect(out.map((n) => n.paragraphs)).toEqual([
			[90, 130],
			[90, 130],
			[90, 130],
			[131, 200]
		]);
		expect(out[2].children.map((c) => c.title)).toEqual(['The technocratic paradigm']);
	});

	it('still ends a heading at a later one that shares no anchor', () => {
		// The skip above is keyed on the anchor, not on the level, so an
		// ordinary same-level sibling must still close the previous run.
		const out = buildDocumentOutline([row(1, 'A', 1), row(1, 'B', 5)], 9);
		expect(out.map((n) => n.paragraphs)).toEqual([
			[1, 4],
			[5, 9]
		]);
	});
});
