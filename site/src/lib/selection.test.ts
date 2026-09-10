import { describe, expect, it } from 'vitest';
import { quoteWithCitation, shareHref, spanAddress, textDirective, tidyQuote } from './selection';

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

describe('textDirective', () => {
	it('spells a short quotation out whole', () => {
		expect(textDirective('Fiat lux')).toBe('text=Fiat%20lux');
	});

	it('is empty for a quotation of nothing, so the link carries no directive', () => {
		expect(textDirective('   ')).toBe('');
	});

	it('percent-encodes the three characters that delimit a directive', () => {
		// `-` is unreserved in a URL and reserved in here, so
		// `encodeURIComponent` alone is not enough.
		expect(textDirective('a-b, c & d')).toBe('text=a%2Db%2C%20c%20%26%20d');
	});

	it('names a long quotation by its two ends rather than truncating it', () => {
		const long = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ');
		expect(textDirective(long)).toBe(
			'text=word0%20word1%20word2%20word3%20word4%20word5%20word6%20word7,' +
				'word52%20word53%20word54%20word55%20word56%20word57%20word58%20word59'
		);
	});

	it('spells out a long quotation of few words, where two ends would overlap', () => {
		const fewLongWords = Array.from({ length: 8 }, () => 'x'.repeat(40)).join(' ');
		expect(textDirective(fewLongWords)).toBe(`text=${fewLongWords.replace(/ /g, '%20')}`);
	});
});

describe('shareHref', () => {
	it('pins the edition and carries the words, keeping the unit fragment in front', () => {
		expect(shareHref('/documenta/antiqua-et-nova#s3', 'antiqua-et-nova.en', 'Fiat lux')).toBe(
			'/documenta/antiqua-et-nova?ed=antiqua-et-nova.en#s3:~:text=Fiat%20lux'
		);
	});

	it('joins onto a query the address already had', () => {
		expect(shareHref('/scriptura/genesis/1?v=3-5#v3', 'bible.clementina.la', 'fiat lux')).toBe(
			'/scriptura/genesis/1?v=3-5&ed=bible.clementina.la#v3:~:text=fiat%20lux'
		);
	});

	it('writes a bare directive where the address names no fragment', () => {
		expect(shareHref('/catechismus/27', 'ccc.en', 'God is love')).toBe(
			'/catechismus/27?ed=ccc.en#:~:text=God%20is%20love'
		);
	});

	it('is a good link with no edition to pin', () => {
		expect(shareHref('/catechismus/27', undefined, 'God is love')).toBe(
			'/catechismus/27#:~:text=God%20is%20love'
		);
	});

	it('is the address itself when there is nothing to add to it', () => {
		expect(shareHref('/catechismus/27', undefined, '  ')).toBe('/catechismus/27');
	});
});
