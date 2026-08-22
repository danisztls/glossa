import { describe, expect, it } from 'vitest';
import {
	OUTLINE_KINDS,
	contains,
	currentIndex,
	hrefFor,
	marker,
	outlineChildren,
	rowState
} from './structureToc';
import type { StructureNode } from '../types';

/** Minimal `StructureNode` fixture — only the fields these functions read. */
function node(
	kind: StructureNode['kind'],
	n: number | null,
	title: string,
	paragraphs: [number | null, number | null],
	children: StructureNode[] = []
): StructureNode {
	return { kind, n, title, paragraphs, children };
}

describe('contains', () => {
	it('matches inside an inclusive range', () => {
		expect(contains(node('chapter', 1, 'X', [10, 20]), 10)).toBe(true);
		expect(contains(node('chapter', 1, 'X', [10, 20]), 20)).toBe(true);
		expect(contains(node('chapter', 1, 'X', [10, 20]), 15)).toBe(true);
	});

	it('rejects outside the range', () => {
		expect(contains(node('chapter', 1, 'X', [10, 20]), 9)).toBe(false);
		expect(contains(node('chapter', 1, 'X', [10, 20]), 21)).toBe(false);
	});

	// docs/corpus-schema.md: null bounds mean "unaddressable" and must never
	// match — the regression this guards is `n < null` coercing to `n < 0`
	// in JS, which would make a null lower bound match everything below it.
	it('never matches a null bound, in either direction', () => {
		expect(contains(node('sub', null, 'X', [null, null]), 5)).toBe(false);
		expect(contains(node('sub', null, 'X', [null, null]), -5)).toBe(false);
		expect(contains(node('sub', null, 'X', [null, 20]), 5)).toBe(false);
		expect(contains(node('sub', null, 'X', [10, null]), 15)).toBe(false);
	});
});

describe('outlineChildren', () => {
	const tree = node(
		'part',
		1,
		'Part',
		[1, 100],
		[
			node('chapter', 1, 'Ch1', [1, 50]),
			node('article', 1, 'Art1', [1, 20]),
			node('section', 1, 'Sec1', [51, 100])
		]
	);

	it('renders every child kind when no filter is given (document mode)', () => {
		expect(outlineChildren(tree, undefined).map((c) => c.kind)).toEqual([
			'chapter',
			'article',
			'section'
		]);
	});

	it('prunes to the given kind set (CCC/Compendium mode)', () => {
		expect(outlineChildren(tree, OUTLINE_KINDS).map((c) => c.kind)).toEqual(['chapter', 'section']);
	});
});

describe('rowState', () => {
	// part[1-100] > chapter[1-50] > sub[1-20], with an article[21-50] sibling
	// of the sub that OUTLINE_KINDS prunes away — exercises the "deepest
	// match within the RENDERED tree" rule, not the full corpus tree.
	const sub = node('sub', 1, 'Sub', [1, 20]);
	const article = node('article', 1, 'Art', [21, 50]);
	const chapter = node('chapter', 1, 'Ch', [1, 50], [sub, article]);
	const part = node('part', 1, 'Part', [1, 100], [chapter]);

	it('is neither on-path nor current when currentN is undefined', () => {
		expect(rowState(part, undefined, undefined)).toEqual({ onPath: false, isCurrent: false });
	});

	it('is neither on-path nor current for a node whose range misses', () => {
		expect(rowState(chapter, 75, undefined)).toEqual({ onPath: false, isCurrent: false });
	});

	it('unfiltered (document mode): the deepest containing node is current, its ancestors are on-path only', () => {
		expect(rowState(part, 5, undefined)).toEqual({ onPath: true, isCurrent: false });
		expect(rowState(chapter, 5, undefined)).toEqual({ onPath: true, isCurrent: false });
		expect(rowState(sub, 5, undefined)).toEqual({ onPath: true, isCurrent: true });
	});

	it('filtered (CCC/Compendium mode): a node whose only matching child is pruned away becomes current itself', () => {
		// n=30 falls in `article`'s range, but OUTLINE_KINDS prunes `article`
		// out of the rendered tree entirely — so within the tree that's
		// actually shown, `chapter` has no rendered child containing 30, and
		// must be marked current rather than merely on-path.
		expect(rowState(chapter, 30, OUTLINE_KINDS)).toEqual({ onPath: true, isCurrent: true });
		expect(rowState(part, 30, OUTLINE_KINDS)).toEqual({ onPath: true, isCurrent: false });
	});
});

describe('marker', () => {
	it('uses the abbreviated kind label when one exists for the kind', () => {
		expect(marker(node('chapter', 3, 'CHAPTER THREE X', [1, 1]), 'en')).toBe('Ch. 3');
	});

	// `sub` has no entry in titles.ts's KIND_LABELS, so `kindOrdinalLabel`
	// returns null for it — this is the one case documents actually need
	// (a document's fifth heading level, `read/+page.svelte`'s `headingTag`)
	// and `StructureSidebarToc` alone would have silently dropped it.
	it('falls back to the bare displayTitle ordinal when no label exists for the kind', () => {
		expect(marker(node('sub', 2, 'Paragraph 2. SOMETHING', [1, 1]), 'en')).toBe('2.');
	});

	it('is null when neither a label nor an ordinal exists (unnumbered node)', () => {
		expect(marker(node('prologue', null, 'Prologue', [null, null]), 'en')).toBeNull();
	});
});

describe('hrefFor', () => {
	const plain = node('chapter', 1, 'X', [1, 9]);

	it('route mode: basePath + the anchor number', () => {
		expect(hrefFor(plain, 27, 'route', '/catechismus')).toBe('/catechismus/27');
		expect(hrefFor(plain, 19, 'route', '/documenta/gaudium-et-spes')).toBe(
			'/documenta/gaudium-et-spes/19'
		);
	});

	it('anchor mode: an #s{n} fragment, ignoring basePath', () => {
		expect(hrefFor(plain, 19, 'anchor', '/documenta/gaudium-et-spes')).toBe('#s19');
		expect(hrefFor(plain, 19, 'anchor', undefined)).toBe('#s19');
	});

	// The heading and the section after it are different places on the page.
	// A document row addresses the heading it names; `#s{n}` would scroll
	// past it to the first paragraph underneath.
	it('anchor mode: a row carrying its own heading anchor uses that instead', () => {
		const withAnchor = { ...node('sub', null, 'CHAPTER THREE', [90, 130]), anchor: 'h12' };
		expect(hrefFor(withAnchor, 90, 'anchor', undefined)).toBe('#h12');
	});

	it('route mode ignores the heading anchor — those rows are their own pages', () => {
		const withAnchor = { ...node('sub', null, 'CHAPTER THREE', [90, 130]), anchor: 'h12' };
		expect(hrefFor(withAnchor, 90, 'route', '/documenta/x')).toBe('/documenta/x/90');
	});
});

describe('currentIndex', () => {
	// Two siblings sharing a range is legitimate — a document heading
	// immediately followed by its first sub-heading, no numbered section
	// between them. Marking both current duplicates the id the aside scrolls
	// to and puts aria-current on two links at once.
	it('picks only the first of several siblings sharing a range', () => {
		const nodes = [
			node('sub', null, 'A', [10, 20]),
			node('sub', null, 'B', [10, 20]),
			node('sub', null, 'C', [21, 30])
		];
		expect(currentIndex(nodes, 12, undefined)).toBe(0);
		// rowState on its own still reports the second as current — which is
		// exactly why the caller needs this.
		expect(rowState(nodes[1], 12, undefined).isCurrent).toBe(true);
	});

	it('is -1 when the reader is outside every row, or has no position', () => {
		expect(currentIndex([node('sub', null, 'A', [10, 20])], 99, undefined)).toBe(-1);
		expect(currentIndex([node('sub', null, 'A', [10, 20])], undefined, undefined)).toBe(-1);
	});
});

describe('marker', () => {
	it("prefers a document's own printed identifier line", () => {
		const withLabel = { ...node('sub', null, 'TECHNOLOGY AND DOMINANCE.', [90, 130]), label: 'CHAPTER THREE' };
		expect(marker(withLabel, 'en')).toBe('CHAPTER THREE');
	});
});
