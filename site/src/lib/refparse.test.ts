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
});
