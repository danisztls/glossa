import { describe, expect, it } from 'vitest';
import { locateQuote } from './quote-mark';

const VERSE = 'In the beginning God created heaven, and earth.';

describe('locateQuote', () => {
	it('finds the words and answers offsets into the text as written', () => {
		const at = locateQuote(VERSE, 'God created heaven');
		expect(at).toBeDefined();
		expect(VERSE.slice(at!.from, at!.to)).toBe('God created heaven');
	});

	// A span runs from the first word character to the last, so punctuation
	// the text ENDS on falls outside it — where punctuation between two words
	// is covered, as the next test but one asserts. The mark is over the
	// words; a wash that reached past the final letter to swallow a full stop
	// would be claiming a character the reader did not choose.
	it('covers the whole text but its final stop, when the whole text was quoted', () => {
		const at = locateQuote(VERSE, VERSE);
		expect(VERSE.slice(at!.from, at!.to)).toBe('In the beginning God created heaven, and earth');
	});

	// The stored quote has had its whitespace collapsed and its apparatus cut
	// out; the rendered unit has had neither treatment.
	it('survives the whitespace a stored quote was collapsed to', () => {
		const rendered = 'In the beginning\n\t\t\tGod created heaven';
		const at = locateQuote(rendered, 'beginning God created');
		expect(at).toBeDefined();
		expect(rendered.slice(at!.from, at!.to)).toBe('beginning\n\t\t\tGod created');
	});

	// A stored quotation says where it was cut from (`elideQuote`), and those
	// marks are not words: the fold drops them, so the wash still finds the
	// sentence a marked excerpt names rather than falling back to the unit.
	it('finds the words under the marks an excerpt carries', () => {
		const at = locateQuote(VERSE, '…God created heaven…');
		expect(VERSE.slice(at!.from, at!.to)).toBe('God created heaven');
	});

	// `fold` drops punctuation rather than normalising it, so the mark covers
	// the text as the text is written — including punctuation the quote lost.
	it('covers punctuation the quotation did not carry', () => {
		const at = locateQuote(VERSE, 'created heaven and earth');
		expect(VERSE.slice(at!.from, at!.to)).toBe('created heaven, and earth');
	});

	it('ignores case and diacritics, as a re-transcribed edition may differ in both', () => {
		const text = 'à tua Santa morada';
		const at = locateQuote(text, 'A tua santa morada');
		expect(text.slice(at!.from, at!.to)).toBe(text);
	});

	// The caller only asks within the edition the quote came from; this is what
	// happens when the text has moved on under it anyway.
	it('refuses words that are not there', () => {
		expect(locateQuote(VERSE, 'Fiat lux')).toBeUndefined();
	});

	it('refuses a quotation of nothing rather than matching everywhere', () => {
		expect(locateQuote(VERSE, '   ')).toBeUndefined();
		expect(locateQuote(VERSE, '—')).toBeUndefined();
	});

	it('takes the first occurrence, there being nothing stored to prefer another', () => {
		const text = 'a word and then a word again';
		const at = locateQuote(text, 'a word');
		expect(at).toEqual({ from: 0, to: 6 });
	});
});
