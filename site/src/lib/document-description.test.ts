import { describe, expect, it } from 'vitest';
import { preferredDescription } from './document-description';

const read = { description: 'Written by reading this edition.', language: 'pt' };

describe('preferredDescription', () => {
	it('prefers a reading in the reader own language over a translation into it', () => {
		expect(preferredDescription(read, 'pt', { x: 'Traduzida de outra edição.' }, 'x')).toBe(
			read.description
		);
	});

	it('translates a reading written in some other language', () => {
		expect(preferredDescription({ ...read, language: 'en' }, 'pt', { x: 'Traduzida.' }, 'x')).toBe(
			'Traduzida.'
		);
	});

	it("falls back to the work's own reading when nothing is translated", () => {
		expect(preferredDescription({ ...read, language: 'en' }, 'pt', {}, 'x')).toBe(read.description);
	});

	it('takes a translation for a work nobody has read', () => {
		expect(preferredDescription({ language: 'pt' }, 'pt', { x: 'Traduzida.' }, 'x')).toBe(
			'Traduzida.'
		);
	});

	// Nothing to show is `undefined`, not an empty string: a caller that
	// renders whatever it is handed would print a blank line under the row.
	it('is undefined where there is neither', () => {
		expect(preferredDescription({ language: 'pt' }, 'pt', {}, 'x')).toBeUndefined();
		expect(
			preferredDescription({ description: '  ', language: 'pt' }, 'pt', { x: ' ' }, 'x')
		).toBeUndefined();
	});
});
