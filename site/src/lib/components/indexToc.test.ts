import { describe, expect, it } from 'vitest';
import type { StructureNode } from '../types';
import {
	INDEX_OUTLINE_KINDS,
	indexDetailChildren,
	indexOutlineChildren,
	indexSidebarItems,
	isIndexOutline,
	rangeLabel
} from './indexToc';

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
