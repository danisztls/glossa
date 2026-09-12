import { describe, expect, it } from 'vitest';
import { nearLanguages } from './document-langs';

// A Portuguese reader's chain, as `contentLangChain('pt')` writes it.
const PT = ['pt', 'es', 'en', 'la'];

describe('nearLanguages', () => {
	it('prints the chain and counts the rest', () => {
		const near = nearLanguages(['de', 'en', 'it', 'pt', 'ru'], PT, 'pt');
		expect(near.shown).toEqual(['pt', 'en']);
		expect(near.rest).toEqual(['de', 'it', 'ru']);
	});

	// The chain is a ranking, so it decides the order; the caller's list is
	// alphabetical by tag and says nothing about what this reader wants first.
	it('orders what it prints by the chain and not by the caller', () => {
		expect(nearLanguages(['en', 'es', 'la', 'pt'], PT, 'pt').shown).toEqual([
			'pt',
			'es',
			'en',
			'la'
		]);
	});

	// The language the row is written in, which a per-document edition pick can
	// put outside the chain entirely.
	it('leads with the current language and never folds it away', () => {
		const near = nearLanguages(['en', 'uk'], PT, 'uk');
		expect(near.shown).toEqual(['uk', 'en']);
		expect(near.rest).toEqual([]);
	});

	it('names the current language once when the chain names it too', () => {
		expect(nearLanguages(['en', 'pt'], PT, 'pt').shown).toEqual(['pt', 'en']);
	});

	// A document the reader's own chain reaches in nothing: the row still says
	// what it is written in rather than opening with a bare count.
	it('prints the current language alone where the chain meets none', () => {
		const near = nearLanguages(['hu', 'pl'], PT, 'pl');
		expect(near.shown).toEqual(['pl']);
		expect(near.rest).toEqual(['hu']);
	});

	// `documentLangFor` answers the interface language where the group has no
	// edition at all, so the row's own language may not be among them.
	it('drops a current language the document does not have', () => {
		expect(nearLanguages(['en'], PT, 'pt')).toEqual({ shown: ['en'], rest: [] });
	});

	it('is empty for a document with no editions', () => {
		expect(nearLanguages([], PT, 'pt')).toEqual({ shown: [], rest: [] });
	});
});
