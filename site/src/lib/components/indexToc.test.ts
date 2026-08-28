import { describe, expect, it } from 'vitest';
import type { StructureNode } from '../types';
import {
	INDEX_OUTLINE_KINDS,
	indexDetailChildren,
	indexOutlineChildren,
	indexRows,
	rowKey,
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
});

// The recursion the nested `<ol>`s used to do in markup, moved here so the
// table can be one flat list of rows and so the depth rule is testable at all.
describe('indexRows', () => {
	const tree = [
		node(
			'part',
			1,
			'Part',
			[1, 100],
			[
				node(
					'section',
					1,
					'Section',
					[1, 50],
					[node('chapter', 1, 'Chapter', [1, 20], []), node('sub', null, 'An epigraph', [1, 2], [])]
				)
			]
		)
	];

	it('flattens the outline, carrying the depth each row was found at', () => {
		expect(
			indexRows(tree, { subsections: false }).map((row) => [row.node.kind, row.depth])
		).toEqual([
			['part', 0],
			['section', 1],
			['chapter', 2]
		]);
	});

	// Exclusive of the level it names: 1 is the top level alone.
	it('stops at maxDepth', () => {
		expect(indexRows(tree, { maxDepth: 1 }).map((row) => row.node.kind)).toEqual(['part']);
		expect(indexRows(tree, { maxDepth: 2 }).map((row) => row.node.kind)).toEqual([
			'part',
			'section'
		]);
	});

	// The chain the table collapses on: a row is on screen only while every
	// ancestor is open, and `ancestors[i]` is the one at depth `i`.
	it('names each row\u2019s ancestors, outermost first', () => {
		expect(indexRows(tree).map((row) => row.ancestors.length)).toEqual([0, 1, 2, 2]);
		expect(indexRows(tree)[2].ancestors[0]).toBe(rowKey(tree[0]));
	});

	// A row is worth a disclosure arrow when opening it would reveal something
	// — child divisions, or sub-headings. `maxDepth` truncating the children
	// takes the arrow with them.
	it('marks a row expandable only when it has something to reveal', () => {
		expect(indexRows(tree).map((row) => row.expandable)).toEqual([true, true, false, false]);
		expect(indexRows(tree, { maxDepth: 1 })[0].expandable).toBe(false);
	});

	// A `sub` is a row one level further in, not something hung off the row
	// above it: it has a paragraph span, so it has an address, and it is only
	// behind its parent's disclosure. An overview drops it by never walking in.
	it('walks sub-headings as rows of their own, in paragraph order', () => {
		expect(indexRows(tree).map((row) => [row.node.kind, row.depth])).toEqual([
			['part', 0],
			['section', 1],
			['chapter', 2],
			['sub', 2]
		]);
		expect(indexRows(tree, { subsections: false }).some((row) => row.node.kind === 'sub')).toBe(
			false
		);
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
		workTitle: 'Compendium'
	};

	// The chip shows the range alone; the work is named in `title`, which is
	// both the hover and the accessible name. It printed the siglum too until
	// 2026-08-28 — see `RowLink`.
	it('shows the extent, names the work only in the accessible name', () => {
		expect(workLink([251, 294], opts)).toEqual({
			href: '/catechismus/compendium/caput/251',
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
