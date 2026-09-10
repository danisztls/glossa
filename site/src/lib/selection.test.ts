import { describe, expect, it } from 'vitest';
import { quoteWithCitation, spanAddress, tidyQuote } from './selection';

describe('spanAddress', () => {
	it('is the unit itself for a highlight that never left one', () => {
		expect(spanAddress('/scriptura/genesis/1#v3', '/scriptura/genesis/1#v3')).toBe(
			'/scriptura/genesis/1#v3'
		);
		expect(spanAddress('/catechismus/27', '/catechismus/27')).toBe('/catechismus/27');
	});

	it('spans the verses a Bible highlight was drawn across', () => {
		expect(spanAddress('/scriptura/genesis/1#v3', '/scriptura/genesis/1#v5')).toBe(
			'/scriptura/genesis/1?v=3-5#v3'
		);
	});

	it('opens at the first verse and closes at the last, when either end is itself an extent', () => {
		// The reader arrived on `?v=3-5#v3` from a citation and highlighted on
		// past its end: the passage is 3 through 7, not 3 through 5.
		expect(spanAddress('/scriptura/genesis/1?v=3-5#v3', '/scriptura/genesis/1#v7')).toBe(
			'/scriptura/genesis/1?v=3-7#v3'
		);
	});

	it('keeps the start for a work with no way to spell a range', () => {
		expect(spanAddress('/catechismus/27', '/catechismus/29')).toBe('/catechismus/27');
		expect(spanAddress('/documenta/lumen-gentium#s4', '/documenta/lumen-gentium#s6')).toBe(
			'/documenta/lumen-gentium#s4'
		);
	});

	it('keeps the start when the ends are in different chapters or different works', () => {
		expect(spanAddress('/scriptura/genesis/1#v30', '/scriptura/genesis/2#v2')).toBe(
			'/scriptura/genesis/1#v30'
		);
		expect(spanAddress('/scriptura/genesis/1#v30', '/scriptura/exodus/1#v2')).toBe(
			'/scriptura/genesis/1#v30'
		);
		expect(spanAddress('/scriptura/genesis/1#v3', '/catechismus/27')).toBe(
			'/scriptura/genesis/1#v3'
		);
	});

	it('keeps the start when an end names no verse — a whole-chapter address has no extent', () => {
		expect(spanAddress('/scriptura/genesis/1', '/scriptura/genesis/1#v5')).toBe(
			'/scriptura/genesis/1'
		);
	});

	it('keeps the start when the end does not parse at all', () => {
		expect(spanAddress('/scriptura/genesis/1#v3', '/nowhere/at/all')).toBe(
			'/scriptura/genesis/1#v3'
		);
	});

	it('never writes a backwards or empty span', () => {
		expect(spanAddress('/scriptura/genesis/1#v5', '/scriptura/genesis/1#v3')).toBe(
			'/scriptura/genesis/1#v5'
		);
	});
});

describe('tidyQuote', () => {
	it('collapses the line breaks and indentation between two units markup', () => {
		expect(tidyQuote('In the beginning\n\t\t\tGod created')).toBe('In the beginning God created');
	});

	it('trims, so a highlight that overshot into whitespace quotes the words alone', () => {
		expect(tidyQuote('  fiat lux  ')).toBe('fiat lux');
	});

	it('is empty for a selection of nothing but whitespace, which is what suppresses the panel', () => {
		expect(tidyQuote(' \n\t ')).toBe('');
	});
});

describe('quoteWithCitation', () => {
	it('puts the words first and the address under them', () => {
		expect(quoteWithCitation('Fiat lux', 'Gn 1:3')).toBe('Fiat lux\n— Gn 1:3');
	});

	it('is the words alone when there is no citation to give', () => {
		expect(quoteWithCitation('Fiat lux', '')).toBe('Fiat lux');
	});
});
