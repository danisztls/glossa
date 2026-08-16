import { describe, expect, it } from 'vitest';
import { splitDropCap } from './dropcap';

describe('splitDropCap', () => {
	it('promotes a single opening letter', () => {
		expect(splitDropCap('In the beginning')).toEqual({ first: 'I', rest: 'n the beginning' });
	});

	it('keeps opening punctuation with the letter it belongs to', () => {
		// Setting only the quote mark in the cap and leaving "And" at body size
		// is worse than no cap; a typesetter would take both.
		expect(splitDropCap('“And the Lord said')).toEqual({ first: '“A', rest: 'nd the Lord said' });
	});

	it('trims leading whitespace rather than capping it', () => {
		expect(splitDropCap('   Therefore')).toEqual({ first: 'T', rest: 'herefore' });
	});

	it('keeps a combining accent attached to its base letter', () => {
		// Decomposed "Ó" (O + U+0301). Slicing at index 1 would strand the
		// accent in the cap and render a bare diacritic.
		const decomposed = 'Ótimo';
		const { first, rest } = splitDropCap(decomposed);
		expect(first.normalize('NFC')).toBe('Ó');
		expect(rest).toBe('timo');
	});

	it('handles a precomposed accented capital', () => {
		expect(splitDropCap('Édito')).toEqual({ first: 'É', rest: 'dito' });
	});

	it('stops taking punctuation before it swallows a word', () => {
		// Bounded at three punctuation units, so a run of dashes and quotes
		// can't absorb the opening word into the cap.
		const { first } = splitDropCap('«—— "Assim');
		expect(first.length).toBeLessThanOrEqual(4);
	});

	it('degrades to no cap for empty or punctuation-only text', () => {
		expect(splitDropCap('')).toEqual({ first: '', rest: '' });
		expect(splitDropCap('...')).toEqual({ first: '', rest: '...' });
	});

	it('leaves the original text recoverable by concatenation', () => {
		// The rendered output is `first + rest`; if that isn't the input (modulo
		// the deliberate leading-whitespace trim), the reader loses characters.
		for (const text of ['In the beginning', '“And', 'Ódio', 'a', '¿Quién']) {
			const { first, rest } = splitDropCap(text);
			expect(first + rest).toBe(text.trimStart());
		}
	});
});
