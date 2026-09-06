import { beforeEach, describe, expect, it } from 'vitest';
import { citedSources } from './cited-by';
import { content } from './content.svelte';
import { i18n } from './i18n.svelte';
import type { Citer } from './types';

/**
 * `citedSources` — the one grouping behind the "Cited in" panel on all four
 * pages that render it.
 *
 * Two things are asserted here and nothing else is: the FAMILY each kind
 * belongs to, which is what the panel's filter toggles, and the commentary
 * language rule. The fixture registry holds the Catechism, its Compendium,
 * the Summa and three Bible editions, so the four remaining families
 * (magisterium, social doctrine, canon law, prayers) have no manifest to be
 * named from and are dropped by design — the same path a real build takes
 * when the index outlives a work.
 */
const note = (work: string): Citer => ({
	kind: 'annotation',
	work,
	osis: 'gen',
	chapter: 3,
	verse: 9
});

beforeEach(async () => {
	await i18n.set('en');
	content.set('bible', null);
});

describe('citedSources', () => {
	it('files the Catechism and its Compendium under one family, in two groups', () => {
		const sources = citedSources([
			{ kind: 'ccc', n: 27 },
			{ kind: 'compendium', n: 3 },
			{ kind: 'summa', part: 'I', question: 2, article: 3 }
		]);
		expect(sources.map((s) => [s.key, s.family])).toEqual([
			['ccc', 'catechism'],
			['compendium', 'catechism'],
			['summa', 'doctors']
		]);
	});

	it('groups one work’s references rather than repeating its name', () => {
		const sources = citedSources([
			{ kind: 'ccc', n: 27 },
			{ kind: 'ccc', n: 355 }
		]);
		expect(sources).toHaveLength(1);
		expect(sources[0].refs.map((r) => r.label)).toEqual(['¶27', '¶355']);
	});

	// An annotation is the one citer that names an EDITION, so ten annotated
	// editions cite one verse as ten works — nine of them in languages this
	// reader did not ask for.
	it('offers commentary in the reader’s own language only', () => {
		const citers = [note('bible.douay-rheims.en'), note('bible.matos-soares.pt')];
		expect(citedSources(citers).map((s) => s.key)).toEqual(['annotation:bible.douay-rheims.en']);
		expect(citedSources(citers, 'pt').map((s) => s.key)).toEqual([
			'annotation:bible.matos-soares.pt'
		]);
		expect(citedSources(citers, 'la')).toEqual([]);
	});

	// No argument means the edition the reader would open, which is what the
	// three pages that are not a Bible chapter pass.
	it('follows the reader’s Bible edition when no language is given', () => {
		content.set('bible', 'bible.clementina.la');
		expect(citedSources([note('bible.clementina.la')]).map((s) => s.family)).toEqual([
			'commentary'
		]);
		expect(citedSources([note('bible.douay-rheims.en')])).toEqual([]);
	});

	it('drops a citer whose work this build does not hold', () => {
		expect(citedSources([note('bible.nonexistent.en')])).toEqual([]);
	});
});
