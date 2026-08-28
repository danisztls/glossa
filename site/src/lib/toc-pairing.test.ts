import { describe, expect, it } from 'vitest';
import { getCccStructure, getCompendiumStructure } from './corpus';
import { PAIRED_KINDS, pairDivisions, pairDivisionsCached, pairedAnchor } from './toc-pairing';
import type { StructureNode } from './types';

function node(
	kind: StructureNode['kind'],
	title: string,
	paragraphs: [number | null, number | null],
	children: StructureNode[] = []
): StructureNode {
	return { kind, n: null, title, paragraphs, children };
}

/** The two outlines in miniature: one part, two chapters, same order. */
function ccc(): StructureNode[] {
	return [
		node('prologue', 'Prologue', [1, 25]),
		node(
			'part',
			'Part One',
			[26, 200],
			[
				node(
					'section',
					'Section One',
					[26, 200],
					[
						node('chapter', 'Chapter One', [27, 100], [node('article', 'Article 1', [27, 60])]),
						node('chapter', 'Chapter Two', [101, 200])
					]
				)
			]
		)
	];
}

function compendium(): StructureNode[] {
	return [
		node(
			'part',
			'Part One',
			[1, 40],
			[
				node(
					'section',
					'Section One',
					[1, 40],
					[node('chapter', 'Chapter One', [2, 20]), node('chapter', 'Chapter Two', [21, 40])]
				)
			]
		)
	];
}

describe('pairDivisions', () => {
	it('pairs the divisions the two outlines share, in document order', () => {
		const from = ccc();
		const pairs = pairDivisions(from, compendium());
		const part = from[1];
		const section = part.children[0];
		const [one, two] = section.children;

		expect(pairs.get(part)?.paragraphs).toEqual([1, 40]);
		expect(pairs.get(section)?.paragraphs).toEqual([1, 40]);
		expect(pairs.get(one)?.paragraphs).toEqual([2, 20]);
		expect(pairs.get(two)?.paragraphs).toEqual([21, 40]);
	});

	it('pairs in both directions over the same trees', () => {
		const to = compendium();
		const pairs = pairDivisions(to, ccc());
		expect(pairs.get(to[0])?.paragraphs).toEqual([26, 200]);
		expect(pairs.get(to[0].children[0].children[1])?.paragraphs).toEqual([101, 200]);
	});

	// The Compendium publishes no prologue and no articles, so neither has a
	// counterpart to offer. See the module docblock on why linking them to
	// their parent's destination would be worse than linking nothing.
	it('leaves the divisions only one work has unpaired', () => {
		const from = ccc();
		const pairs = pairDivisions(from, compendium());
		expect(pairs.has(from[0])).toBe(false);
		expect(pairs.has(from[1].children[0].children[0].children[0])).toBe(false);
		expect([...pairs.keys()].every((n) => PAIRED_KINDS.includes(n.kind))).toBe(true);
	});

	// The guard that matters: one missing division shifts every row after it,
	// so a kind whose counts disagree yields no links at all rather than a
	// page of confidently wrong ones. `compendium.es` really does parse 7
	// sections where the other nine editions parse 8.
	it('skips a whole kind when the two outlines disagree on how many there are', () => {
		const short = [
			node(
				'part',
				'Part One',
				[1, 40],
				[node('section', 'Section One', [1, 20]), node('section', 'Section Two', [21, 40])]
			)
		];
		const long = [
			node(
				'part',
				'Part One',
				[26, 200],
				[
					node('section', 'Section One', [26, 100]),
					node('section', 'Section Two', [101, 150]),
					node('section', 'Section Three', [151, 200])
				]
			)
		];
		const pairs = pairDivisions(short, long);
		expect(pairs.get(short[0])?.paragraphs).toEqual([26, 200]);
		expect(pairs.get(short[0].children[0])).toBeUndefined();
		expect(pairs.get(short[0].children[1])).toBeUndefined();
	});

	it('is empty rather than throwing when a work is absent in a language', () => {
		expect(pairDivisions([], compendium()).size).toBe(0);
		expect(pairDivisions(ccc(), []).size).toBe(0);
	});
});

describe('pairedAnchor', () => {
	it('answers the unit number the paired division is addressed by', () => {
		const from = ccc();
		const pairs = pairDivisions(from, compendium());
		expect(pairedAnchor(from[1].children[0].children[0], pairs)).toBe(2);
	});

	it('refuses an unaddressable bound, the way the index refuses its own', () => {
		const from = [node('part', 'Part One', [1, 40])];
		const to = [node('part', 'A creed the source prints unnumbered', [null, null])];
		expect(pairedAnchor(from[0], pairDivisions(from, to))).toBeUndefined();
	});

	it('answers undefined for a division with no counterpart', () => {
		const from = ccc();
		expect(pairedAnchor(from[0], pairDivisions(from, compendium()))).toBeUndefined();
	});
});

describe('pairDivisionsCached', () => {
	it('returns the same map for the same pair of trees', () => {
		const from = ccc();
		const to = compendium();
		expect(pairDivisionsCached(from, to)).toBe(pairDivisionsCached(from, to));
		expect(pairDivisionsCached(from, to)).not.toBe(pairDivisionsCached(to, from));
	});
});

// The fixtures are deliberately partial (`corpus-index.ts`), and that makes
// them the mismatch guard's own regression test: they carry one CCC chapter
// against the Compendium's three, so chapters must not pair while the part
// and section above them still do.
describe('over the test fixtures', () => {
	it('pairs what the fixtures agree on and skips what they do not', () => {
		const cccTree = getCccStructure('en');
		const compendiumTree = getCompendiumStructure('en');
		const pairs = pairDivisions(cccTree, compendiumTree);
		const kinds = [...pairs.keys()].map((n) => n.kind);

		expect(cccTree.length).toBeGreaterThan(0);
		expect(compendiumTree.length).toBeGreaterThan(0);
		expect(kinds).toContain('part');
		expect(kinds).not.toContain('chapter');
	});
});
