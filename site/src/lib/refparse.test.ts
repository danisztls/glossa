import { describe, expect, it } from 'vitest';
import { parseReference } from './refparse';

describe('parseReference', () => {
	it('parses a book + chapter + verse', () => {
		expect(parseReference('john 3:16')).toEqual({
			kind: 'bible',
			book: 'john',
			chapter: 3,
			chapterEnd: undefined,
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
			chapterEnd: undefined,
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
			chapterEnd: undefined,
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

	describe('Portuguese notation', () => {
		it('parses a multi-word book name', () => {
			expect(parseReference('São João 1,1-3')).toMatchObject({
				kind: 'bible',
				book: 'sãojoão',
				chapter: 1,
				verse: 1,
				verseEnd: 3
			});
		});

		it('keeps accents in the book token (PT "jó" is Job, "jo" is John)', () => {
			expect(parseReference('jó 1,1')).toMatchObject({ book: 'jó' });
			expect(parseReference('jo 1,1')).toMatchObject({ book: 'jo' });
		});

		it('folds a Roman-numeral book prefix to the digit the corpus stores', () => {
			expect(parseReference('I Coríntios 13,4')).toMatchObject({
				book: '1coríntios',
				chapter: 13,
				verse: 4
			});
			expect(parseReference('II Sm 1,1')).toMatchObject({ book: '2sm' });
			expect(parseReference('III Jo 1,4')).toMatchObject({ book: '3jo' });
		});

		it('does not mistake a book whose name merely starts with "i" for a numeral', () => {
			expect(parseReference('Isaías 7,14')).toMatchObject({
				book: 'isaías',
				chapter: 7,
				verse: 14
			});
		});

		it('tolerates the dots of an abbreviation', () => {
			expect(parseReference('1 Cor. 13,4')).toMatchObject({ book: '1cor', chapter: 13, verse: 4 });
			expect(parseReference('Jo. 3,16')).toMatchObject({ book: 'jo', chapter: 3, verse: 16 });
		});

		it('parses a PT verse list, keeping only the first verse', () => {
			expect(parseReference('Jo 3,16.18')).toMatchObject({
				chapter: 3,
				verse: 16,
				verseEnd: undefined
			});
		});

		it('parses "ss" ("e seguintes") as the named verse', () => {
			expect(parseReference('Mt 5,3ss')).toMatchObject({
				chapter: 5,
				verse: 3,
				verseEnd: undefined
			});
		});

		it('accepts the Catechism under its Portuguese name', () => {
			expect(parseReference('catecismo 1234')).toEqual({
				kind: 'ccc',
				n: 1234,
				raw: 'catecismo 1234'
			});
		});

		describe('dual Psalm numbering, "Sl 22(23)"', () => {
			it('takes the lower number as the Vulgate one, whichever side it is printed on', () => {
				expect(parseReference('Sl 22(23)')).toMatchObject({ chapter: 22 });
				expect(parseReference('Sl 23(22)')).toMatchObject({ chapter: 22 });
			});

			it('does not then also convert it as if it were Hebrew', () => {
				// "sl 23" alone means Hebrew 23 -> Vulgate 22; the dual form
				// already told us the Vulgate number, so 22 must stay 22.
				expect(parseReference('sl 23')).toMatchObject({ chapter: 22 });
				expect(parseReference('sl 22(23),1')).toMatchObject({ chapter: 22, verse: 1 });
			});
		});
	});

	describe('English notation', () => {
		it('parses a multi-word book name', () => {
			expect(parseReference('song of songs 2:1')).toMatchObject({
				book: 'songofsongs',
				chapter: 2,
				verse: 1
			});
			expect(parseReference('acts of the apostles 2:42')).toMatchObject({
				book: 'actsoftheapostles',
				chapter: 2,
				verse: 42
			});
		});

		it('parses an EN verse list, keeping only the first verse', () => {
			expect(parseReference('John 3:16,18')).toMatchObject({
				chapter: 3,
				verse: 16,
				verseEnd: undefined
			});
		});

		it('parses "ff" ("and following") as the named verse', () => {
			expect(parseReference('John 3:16ff')).toMatchObject({
				chapter: 3,
				verse: 16,
				verseEnd: undefined
			});
		});

		it('parses an en-dash verse range like a hyphen', () => {
			expect(parseReference('John 3:16–18')).toMatchObject({ verse: 16, verseEnd: 18 });
		});
	});

	describe('chapter ranges', () => {
		it('lands on the first chapter and reports the end', () => {
			expect(parseReference('gen 1-3')).toMatchObject({
				chapter: 1,
				chapterEnd: 3,
				verse: undefined
			});
		});

		it('leaves "jude 3-5" for the caller to read as verses (see JumpBox)', () => {
			expect(parseReference('jude 3-5')).toMatchObject({
				chapter: 3,
				chapterEnd: 5,
				verse: undefined
			});
		});
	});

	describe('Hebrew/Masoretic -> Vulgate conversion (docs/link-surface.md\'s "Psalm 23 opens Psalm 22")', () => {
		it('converts a typed Psalm chapter to its Vulgate chapter', () => {
			expect(parseReference('psalm 23')).toMatchObject({
				kind: 'bible',
				book: 'psalm',
				chapter: 22
			});
			expect(parseReference('ps 23')).toMatchObject({ kind: 'bible', book: 'ps', chapter: 22 });
		});

		it('converts a typed Psalm chapter+verse (both stay unchanged here: no verse-title offset — see versification.ts)', () => {
			expect(parseReference('ps 51:12')).toEqual({
				kind: 'bible',
				book: 'ps',
				chapter: 50,
				chapterEnd: undefined,
				verse: 12,
				verseEnd: undefined,
				raw: 'ps 51:12'
			});
		});

		it('converts a typed Psalm verse range that stays within one Vulgate chapter', () => {
			expect(parseReference('ps 22:10-11')).toMatchObject({ chapter: 21, verse: 10, verseEnd: 11 });
		});

		it('converts a typed Malachi reference across the chapter 3/4 split', () => {
			expect(parseReference('mal 3:19')).toMatchObject({
				kind: 'bible',
				book: 'mal',
				chapter: 4,
				verse: 1
			});
			expect(parseReference('malachi 1:11')).toMatchObject({ chapter: 1, verse: 11 }); // unaffected range: unchanged
		});

		it('converts a typed Joel reference across the chapter 2/3 fold', () => {
			expect(parseReference('joel 3:1')).toMatchObject({
				kind: 'bible',
				book: 'joel',
				chapter: 2,
				verse: 28
			});
			expect(parseReference('jl 4:1')).toMatchObject({ chapter: 3, verse: 1 });
		});

		it('does not convert unrelated books', () => {
			expect(parseReference('gen 9:16')).toEqual({
				kind: 'bible',
				book: 'gen',
				chapter: 9,
				chapterEnd: undefined,
				verse: 16,
				verseEnd: undefined,
				raw: 'gen 9:16'
			});
		});
	});
});
