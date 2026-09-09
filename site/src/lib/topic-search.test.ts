import { describe, expect, it } from 'vitest';
import { foldForSearch, matchesQuery, matchingSlugs } from './topic-search';

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
		{ slug: 'crematio', title: 'Cremation', question: 'May the ashes be scattered?' },
		{ slug: 'reditus', title: 'Confession after a long time', question: 'Years ago?' },
		{ slug: 'ieiunium', title: 'Fasting and abstinence', question: 'On which days?' }
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
});
