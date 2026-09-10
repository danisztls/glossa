import { describe, expect, it } from 'vitest';
import { foldForSearch, keywordsFrom, matchesQuery, matchingSlugs } from './topic-search';

describe('foldForSearch', () => {
	it('drops case and diacritics', () => {
		expect(foldForSearch('Cremação')).toBe('cremacao');
		expect(foldForSearch('Gênero e transição')).toBe('genero e transicao');
		expect(foldForSearch('ISLÃ')).toBe('isla');
	});

	/** The ligature is a letter and not a base plus a mark, so NFD leaves it
	 *  alone — worth stating so nobody "fixes" the fold into a transliterator.
	 *  No interface language's questions turn on it. */
	it('leaves a letter that is not a base plus a mark', () => {
		expect(foldForSearch('Œuvre')).toBe('œuvre');
	});
});

describe('matchesQuery', () => {
	it('matches every term in any order and any position', () => {
		const haystack =
			'Confession after a long time What happens if the last confession was years ago?';
		expect(matchesQuery(haystack, 'confession years')).toBe(true);
		expect(matchesQuery(haystack, 'years confession')).toBe(true);
		expect(matchesQuery(haystack, 'confession absolution')).toBe(false);
	});

	it('matches inside a word, not only at its start', () => {
		expect(matchesQuery('Homossexualidade', 'sexual')).toBe(true);
	});

	/** The reason the fold exists: a Portuguese reader typing bare vowels. */
	it('matches an accented question typed without accents', () => {
		expect(matchesQuery('A cremação — a Igreja permite?', 'cremacao')).toBe(true);
		expect(matchesQuery('Gênero e transição', 'genero transicao')).toBe(true);
	});

	it('treats an empty or blank query as matching everything', () => {
		expect(matchesQuery('anything at all', '')).toBe(true);
		expect(matchesQuery('anything at all', '   ')).toBe(true);
	});
});

describe('matchingSlugs', () => {
	const rows = [
		{
			slug: 'crematio',
			title: 'Cremation',
			question: 'May the ashes be scattered?',
			keywords: 'urn, columbarium, grave'
		},
		{
			slug: 'reditus',
			title: 'Confession after a long time',
			question: 'Years ago?',
			keywords: 'been away, coming back'
		},
		{ slug: 'ieiunium', title: 'Fasting and abstinence', question: 'On which days?', keywords: '' }
	];

	it('keeps the rows whose title or question matches', () => {
		expect(matchingSlugs(rows, 'ashes')).toEqual(new Set(['crematio']));
		expect(matchingSlugs(rows, 'confession')).toEqual(new Set(['reditus']));
	});

	/** Title and question are one haystack, so a term from each still matches
	 *  — the pair is what the reader sees as one row. */
	it('matches a term from the title together with one from the question', () => {
		expect(matchingSlugs(rows, 'cremation ashes')).toEqual(new Set(['crematio']));
	});

	it('returns every slug for a blank query rather than none', () => {
		expect(matchingSlugs(rows, '').size).toBe(3);
	});

	it('returns an empty set when nothing matches', () => {
		expect(matchingSlugs(rows, 'purgatory').size).toBe(0);
	});

	/** The point of the third field: `urn` is a word the row does not show
	 *  anywhere, and a reader holding it is the reader this page is for. */
	it('keeps a row on a keyword neither the title nor the question uses', () => {
		expect(matchingSlugs(rows, 'urn')).toEqual(new Set(['crematio']));
		expect(matchingSlugs(rows, 'coming back')).toEqual(new Set(['reditus']));
	});

	it('matches a keyword together with a term from the visible pair', () => {
		expect(matchingSlugs(rows, 'cremation grave')).toEqual(new Set(['crematio']));
	});

	/** A row whose dictionary has no keywords is still matched on what it
	 *  shows, and the empty string adds nothing to anybody else's haystack. */
	it('leaves a row without keywords matching on its title and question', () => {
		expect(matchingSlugs(rows, 'fasting')).toEqual(new Set(['ieiunium']));
	});
});

describe('keywordsFrom', () => {
	it('passes a real value through', () => {
		expect(keywordsFrom('quaestiones.crematio.keywords', 'urn, grave')).toBe('urn, grave');
	});

	/** `t()` answers with the key when no dictionary carries it, and that key
	 *  contains the slug — which the search deliberately does not match — and
	 *  the word `quaestiones`, which would otherwise match every row. */
	it('drops the key `t()` hands back when no dictionary has the string', () => {
		expect(keywordsFrom('quaestiones.crematio.keywords', 'quaestiones.crematio.keywords')).toBe('');
	});
});
