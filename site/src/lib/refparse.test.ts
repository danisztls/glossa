import { describe, expect, it } from 'vitest';
import { parseReference } from './refparse';

describe('parseReference', () => {
	it('parses a book + chapter + verse', () => {
		expect(parseReference('john 3:16')).toEqual({
			kind: 'bible',
			book: 'john',
			chapter: 3,
			verse: 16,
			verseEnd: undefined,
			raw: 'john 3:16'
		});
	});

	it('parses PT comma-style verse separator', () => {
		expect(parseReference('jo 3,16')).toEqual({
			kind: 'bible',
			book: 'jo',
			chapter: 3,
			verse: 16,
			verseEnd: undefined,
			raw: 'jo 3,16'
		});
	});

	it('parses a whole chapter with no verse', () => {
		expect(parseReference('gen 1')).toEqual({
			kind: 'bible',
			book: 'gen',
			chapter: 1,
			verse: undefined,
			verseEnd: undefined,
			raw: 'gen 1'
		});
	});

	it('parses a verse range', () => {
		const result = parseReference('john 3:16-18');
		expect(result).toMatchObject({
			kind: 'bible',
			book: 'john',
			chapter: 3,
			verse: 16,
			verseEnd: 18
		});
	});

	it('parses a CCC paragraph reference', () => {
		expect(parseReference('ccc 1234')).toEqual({
			kind: 'ccc',
			n: 1234,
			raw: 'ccc 1234'
		});
	});

	it('is case-insensitive for the ccc keyword', () => {
		expect(parseReference('CCC 1234')).toEqual({
			kind: 'ccc',
			n: 1234,
			raw: 'CCC 1234'
		});
	});

	it('normalizes book tokens with a numeric prefix and a space', () => {
		expect(parseReference('1 cor 13:4')).toMatchObject({
			kind: 'bible',
			book: '1cor',
			chapter: 13,
			verse: 4
		});
	});

	it('normalizes book tokens with a numeric prefix and no space', () => {
		expect(parseReference('1cor 13:4')).toMatchObject({
			kind: 'bible',
			book: '1cor',
			chapter: 13,
			verse: 4
		});
	});

	it('trims surrounding whitespace', () => {
		expect(parseReference('  gen 1  ')).toMatchObject({
			kind: 'bible',
			book: 'gen',
			chapter: 1
		});
	});

	it('returns invalid for empty input', () => {
		expect(parseReference('')).toEqual({ kind: 'invalid', raw: '' });
		expect(parseReference('   ')).toEqual({ kind: 'invalid', raw: '   ' });
	});

	it('returns invalid for unrecognizable input', () => {
		expect(parseReference('asdf')).toEqual({ kind: 'invalid', raw: 'asdf' });
		expect(parseReference('ccc')).toEqual({ kind: 'invalid', raw: 'ccc' });
	});

	describe('Hebrew/Masoretic -> Vulgate conversion (docs/link-surface.md\'s "Psalm 23 opens Psalm 22")', () => {
		it('converts a typed Psalm chapter to its Vulgate chapter', () => {
			expect(parseReference('psalm 23')).toMatchObject({ kind: 'bible', book: 'psalm', chapter: 22 });
			expect(parseReference('ps 23')).toMatchObject({ kind: 'bible', book: 'ps', chapter: 22 });
		});

		it('converts a typed Psalm chapter+verse (both stay unchanged here: no verse-title offset — see versification.ts)', () => {
			expect(parseReference('ps 51:12')).toEqual({
				kind: 'bible',
				book: 'ps',
				chapter: 50,
				verse: 12,
				verseEnd: undefined,
				raw: 'ps 51:12'
			});
		});

		it('converts a typed Psalm verse range that stays within one Vulgate chapter', () => {
			expect(parseReference('ps 22:10-11')).toMatchObject({ chapter: 21, verse: 10, verseEnd: 11 });
		});

		it('converts a typed Malachi reference across the chapter 3/4 split', () => {
			expect(parseReference('mal 3:19')).toMatchObject({ kind: 'bible', book: 'mal', chapter: 4, verse: 1 });
			expect(parseReference('malachi 1:11')).toMatchObject({ chapter: 1, verse: 11 }); // unaffected range: unchanged
		});

		it('converts a typed Joel reference across the chapter 2/3 fold', () => {
			expect(parseReference('joel 3:1')).toMatchObject({ kind: 'bible', book: 'joel', chapter: 2, verse: 28 });
			expect(parseReference('jl 4:1')).toMatchObject({ chapter: 3, verse: 1 });
		});

		it('does not convert unrelated books', () => {
			expect(parseReference('gen 9:16')).toEqual({
				kind: 'bible',
				book: 'gen',
				chapter: 9,
				verse: 16,
				verseEnd: undefined,
				raw: 'gen 9:16'
			});
		});
	});
});
