import { describe, expect, it } from 'vitest';
import { summaTocGroups } from './summaToc';
import type { SummaNode } from '../types';
import type { SummaQuestionMeta } from '../corpus-index';

const q = (n: number): SummaQuestionMeta => ({ part: 'I', n, title: `Q${n}`, articles: [1] });
const h = (title: string, before: number | null): SummaNode => ({
	level: 2,
	part: 'I',
	title,
	before
});

describe('summaTocGroups', () => {
	it('runs each treatise from its own heading to the next', () => {
		const groups = summaTocGroups([h('A', 1), h('B', 3)], [q(1), q(2), q(3), q(4), q(5)]);
		expect(groups.map((g) => [g.title, g.questions.map((x) => x.n)])).toEqual([
			['A', [1, 2]],
			['B', [3, 4, 5]]
		]);
	});

	it('gives questions ahead of the first heading an untitled leading group', () => {
		const groups = summaTocGroups([h('A', 3)], [q(1), q(2), q(3)]);
		expect(groups.map((g) => [g.title, g.questions.map((x) => x.n)])).toEqual([
			[null, [1, 2]],
			['A', [3]]
		]);
	});

	it('puts the whole part in one untitled group when the edition prints no headings', () => {
		// This is `summa.la`: the Corpus Thomisticum publishes four part
		// headings and nothing below them, so the sidebar renders a flat list
		// rather than borrowing the English edition's treatise divisions.
		const groups = summaTocGroups([], [q(1), q(2)]);
		expect(groups).toEqual([{ title: null, questions: [q(1), q(2)] }]);
	});

	it('keeps a heading no question opens on, rather than dropping it', () => {
		const groups = summaTocGroups([h('A', 1), h('B', 9)], [q(1), q(2)]);
		expect(groups.map((g) => [g.title, g.questions.length])).toEqual([
			['A', 2],
			['B', 0]
		]);
	});

	it('keeps both of two headings that share a starting question', () => {
		const groups = summaTocGroups([h('A', 1), h('B', 1)], [q(1), q(2)]);
		// The later one wins the questions; the earlier keeps its row. Neither
		// disappears, so the outline still agrees with what the source prints.
		expect(groups.map((g) => [g.title, g.questions.length])).toEqual([
			['A', 0],
			['B', 2]
		]);
	});

	it('ignores a heading with no question to anchor it', () => {
		const groups = summaTocGroups([h('A', 1), h('trailing matter', null)], [q(1)]);
		expect(groups.map((g) => g.title)).toEqual(['A']);
	});
});
