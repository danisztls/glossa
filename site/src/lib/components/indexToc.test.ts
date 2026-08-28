import { describe, expect, it } from 'vitest';
import type { StructureNode } from '../types';
import {
	INDEX_OUTLINE_KINDS,
	indexDetailChildren,
	indexOutlineChildren,
	indexSidebarItems,
	isIndexOutline,
	rangeLabel,
	workLink
} from './indexToc';
import { hrefFor } from '../address';

function node(
	kind: StructureNode['kind'],
	n: number | null,
	title: string,
	paragraphs: [number | null, number | null],
	children: StructureNode[] = []
): StructureNode {
	return { kind, n, title, paragraphs, children };
}

describe('index outline', () => {
	it('keeps the navigable editorial spine and excludes in-brief content', () => {
		expect(isIndexOutline(node('article', 1, 'Article', [1, 2]))).toBe(true);
		expect(isIndexOutline(node('sub', null, 'Subheading', [1, 2]))).toBe(false);
		expect(isIndexOutline(node('in-brief', null, 'In Brief', [1, 2]))).toBe(false);
		expect(INDEX_OUTLINE_KINDS.has('chapter')).toBe(true);
	});

	it('puts subheadings behind their parent, including unaddressable context', () => {
		const parent = node(
			'chapter',
			1,
			'Chapter',
			[1, 10],
			[
				node('sub', null, 'An epigraph', [null, null]),
				node('in-brief', null, 'In Brief', [8, 10]),
				node('article', 1, 'Article', [1, 7])
			]
		);
		expect(indexDetailChildren(parent).map((child) => child.title)).toEqual(['An epigraph']);
		expect(indexOutlineChildren(parent).map((child) => child.title)).toEqual(['Article']);
	});

	it('uses a compact singular range rather than repeating its endpoint', () => {
		expect(rangeLabel(node('sub', null, 'X', [217, 217]), 'Q')).toBe('Q217');
		expect(rangeLabel(node('chapter', 1, 'X', [27, 49]), '¶')).toBe('¶27–49');
		expect(rangeLabel(node('sub', null, 'X', [null, null]), 'Q')).toBe('');
	});

	it('gives the sidebar explicit, kind-aware labels for root divisions', () => {
		const items = indexSidebarItems(
			[node('part', 1, 'PART ONE: THE PROFESSION OF FAITH', [1, 100])],
			'en'
		);
		expect(items).toEqual([{ href: '#toc-1', label: 'Part 1 The Profession of Faith' }]);
	});
});

// One work's chip on an index row. Its address comes from `hrefFor` via the
// caller rather than a base path to concatenate, which is what lets an
// article point into its chapter and a condensing run point at a question —
// two different shapes the old single base path could not express.
describe('workLink', () => {
	const opts = {
		href: (n: number) => hrefFor({ kind: 'compendiumChapter', n }),
		unit: 'Q',
		abbrev: 'Comp.',
		workTitle: 'Compendium'
	};

	it('names the work and its extent, and addresses the first unit', () => {
		expect(workLink([251, 294], opts)).toEqual({
			href: '/catechismus/compendium/caput/251',
			work: 'Comp.',
			range: 'Q251–294',
			title: 'Compendium — Q251–294'
		});
	});

	it('drops the dash when the span is a single unit', () => {
		expect(workLink([1, 1], opts)?.range).toBe('Q1');
	});

	// A row this work has no counterpart for, and a division whose own bounds
	// the source never numbered. Both are "no chip", not a chip pointing
	// nowhere — the index draws the empty slot itself.
	it('offers nothing without a span, or without a lower bound', () => {
		expect(workLink(undefined, opts)).toBeUndefined();
		expect(workLink([null, 294], opts)).toBeUndefined();
	});

	it('takes the address from the caller, not from a base path', () => {
		expect(
			workLink([39, 39], { ...opts, href: (n) => hrefFor({ kind: 'compendium', n }) })?.href
		).toBe('/catechismus/compendium/39');
	});
});
