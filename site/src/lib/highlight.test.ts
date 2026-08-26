import { describe, expect, it } from 'vitest';
import { highlight, type HighlightSegment } from './highlight';
import { fold } from './suggest';

/** The marked runs, in order — what a reader actually sees emphasized. */
function marks(segments: HighlightSegment[]): string[] {
	return segments.filter((segment) => segment.hit).map((segment) => segment.text);
}

/** The property every case below depends on: rendering the segments in order
 *  reproduces the label. A highlighter that drops or duplicates a character is
 *  a highlighter that silently rewrites the corpus's own titles. */
function joined(segments: HighlightSegment[]): string {
	return segments.map((segment) => segment.text).join('');
}

describe('highlight', () => {
	it('marks a prefix of the label', () => {
		const segments = highlight('Lumen Gentium', 'lumen');
		expect(marks(segments)).toEqual(['Lumen']);
		expect(joined(segments)).toBe('Lumen Gentium');
	});

	it('marks each token of the query separately', () => {
		expect(marks(highlight('John 3:16', 'john 3:16'))).toEqual(['John', '3', '16']);
	});

	it('marks the tokens it can and leaves the rest alone', () => {
		// The reader typed the siglum; the row is spelled out. Half an
		// explanation is the honest amount here.
		expect(marks(highlight('Catechism 27', 'ccc 27'))).toEqual(['27']);
	});

	it('marks a word start inside the label', () => {
		expect(marks(highlight('Fides et Ratio', 'rat'))).toEqual(['Rat']);
	});

	it('marks every word the token opens', () => {
		expect(marks(highlight('De Ecclesia in Ecclesiis', 'eccl'))).toEqual(['Eccl', 'Eccl']);
	});

	it('ignores an interior hit below four characters', () => {
		// `ave` inside "Inter Graves" is the measurement `MIN_INTERIOR` records.
		expect(marks(highlight('Inter Graves', 'ave'))).toEqual([]);
	});

	it('marks an interior hit from four characters', () => {
		expect(marks(highlight('Ingravescentibus Malis', 'grav'))).toEqual(['grav']);
	});

	it('prefers word starts over interior hits of the same token', () => {
		// "Graves" opens with the token, so the `grav` buried in
		// "Ingravescentibus" is not also marked — one tier at a time.
		expect(marks(highlight('Ingravescentibus Graves', 'grav'))).toEqual(['Grav']);
	});

	it('marks a one-letter token only where it is the whole word', () => {
		// "Summa I-II, Q 1" is the reader's own query; "In"/"Is"/"Intention"
		// down a column of Summa titles is a list wearing highlights.
		expect(marks(highlight('Summa I-II, Q 1', 'summa i-ii 1'))).toEqual(['Summa', 'I', 'II', '1']);
		expect(marks(highlight('Of the Manner in Which the Will Is Moved', 'i'))).toEqual([]);
	});

	it('marks a one-digit token as a prefix, unlike a letter', () => {
		// A digit is an address, and a typed prefix of a longer number is why
		// the row is on the list at all.
		expect(marks(highlight('Job 30', 'jo 3'))).toEqual(['Jo', '3']);
	});

	it('is accent- and case-insensitive but returns the original characters', () => {
		const segments = highlight('São João', 'sao joao');
		expect(marks(segments)).toEqual(['São', 'João']);
		expect(joined(segments)).toBe('São João');
	});

	it('keeps a combining mark with the base it sits on', () => {
		// Decomposed input: the mark folds to nothing and has no index of its
		// own, so it must fall inside the run rather than just outside it.
		const decomposed = 'São';
		const segments = highlight(decomposed, 'sao');
		expect(joined(segments)).toBe(decomposed);
		expect(marks(segments)).toEqual([decomposed]);
	});

	it('returns one unmarked segment when nothing matches', () => {
		expect(highlight('Lumen Gentium', 'rosary')).toEqual([{ text: 'Lumen Gentium', hit: false }]);
	});

	it('returns nothing for empty text', () => {
		expect(highlight('', 'lumen')).toEqual([]);
	});

	it('returns one unmarked segment for a query with no word characters', () => {
		expect(highlight('Lumen Gentium', '   ,  ')).toEqual([{ text: 'Lumen Gentium', hit: false }]);
	});

	describe('loose', () => {
		it('is off unless asked for', () => {
			expect(marks(highlight("Man's Capacity for God", 'capcity'))).toEqual([]);
		});

		it('marks the subsequence a typo actually walked', () => {
			const segments = highlight("Man's Capacity for God", 'capcity', { loose: true });
			expect(marks(segments)).toEqual(['Cap', 'city']);
			expect(joined(segments)).toBe("Man's Capacity for God");
		});

		it('ignores the query’s own spacing', () => {
			const spaced = marks(highlight('Rerum Novarum', 'rerm nvrum', { loose: true }));
			const run = marks(highlight('Rerum Novarum', 'rermnvrum', { loose: true }));
			expect(spaced.length).toBeGreaterThan(0);
			expect(spaced).toEqual(run);
		});

		it('never runs when a literal tier found something', () => {
			// "gentium" is there literally, so the loose pass — which would also
			// pick up the `l`, `u` and `m` of a query like "lumgen" — is not
			// consulted at all.
			expect(marks(highlight('Lumen Gentium', 'gentium', { loose: true }))).toEqual(['Gentium']);
		});

		it('needs three characters', () => {
			expect(marks(highlight('Lumen Gentium', 'lm', { loose: true }))).toEqual([]);
		});

		it('marks nothing when the letters are not there in order', () => {
			// A transposition is not a subsequence — the same limit `suggest.ts`
			// records for `fuzzysort` itself.
			expect(marks(highlight('Of Perfection', 'perfectoin', { loose: true }))).toEqual([]);
		});
	});

	describe('folding agrees with the matcher', () => {
		// `highlight.ts` folds per code point so it can map spans back; `fold`
		// folds the whole string at once. They must agree, or a row matches and
		// then shows no mark. One word each, so the whole string is one token
		// and a match has to cover all of it.
		const battery = [
			'Gentium',
			'S\u00E3o', // precomposed
			'Sa\u0303o', // the same word decomposed
			'\u0130stanbul', // folds to one `i`, not the two JS `toLowerCase` alone gives
			'\u0393\u03A1\u0391\u03A6\u0397',
			'\u041A\u0430\u0442\u0435\u0301\u0445\u0438\u0437\u0438\u0441',
			'\u0627\u0644\u0645\u0642\u062F\u0633'
		];

		for (const [index, text] of battery.entries()) {
			it(`${index}: ${text}`, () => {
				const segments = highlight(text, fold(text));
				expect(joined(segments)).toBe(text);
				expect(marks(segments).join('')).toBe(text);
			});
		}
	});
});
