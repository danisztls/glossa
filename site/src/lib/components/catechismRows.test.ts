import { describe, expect, it } from 'vitest';
import { getCccStructure, getCompendiumStructure } from '../corpus';
import { pairDivisionsCached } from '../toc-pairing';
import type { StructureNode } from '../types';
import { catechismRowLinks, cccRowHref } from './catechismRows';

const LABELS = { cccTitle: 'Catechism', compendiumTitle: 'Compendium' };

function find(nodes: StructureNode[], kind: StructureNode['kind']): StructureNode {
	for (const node of nodes) {
		if (node.kind === kind) return node;
		const hit = node.children?.length ? tryFind(node.children, kind) : undefined;
		if (hit) return hit;
	}
	throw new Error(`no ${kind} in the fixture`);
}

function tryFind(nodes: StructureNode[], kind: StructureNode['kind']): StructureNode | undefined {
	for (const node of nodes) {
		if (node.kind === kind) return node;
		const hit = node.children?.length ? tryFind(node.children, kind) : undefined;
		if (hit) return hit;
	}
	return undefined;
}

const tree = getCccStructure('en');
const pairs = pairDivisionsCached(tree, getCompendiumStructure('en'));
const links = (node: StructureNode) =>
	catechismRowLinks(node, {
		tree: 'ccc',
		lang: 'en',
		columns: ['ccc', 'compendium'],
		pairs,
		labels: LABELS
	});

// The rule that was wrong until 2026-08-28, in both works at once: 65 of the
// Catechism index's 100 rows and 60 of its Compendium chips addressed pages
// the corpus does not carry, because both were built by appending a number to
// one fixed base path. An SPA shell answers a bad reader URL with a 404 rather
// than failing a build, so nothing said so.
describe('a row addresses each work the way that work is addressable', () => {
	it('sends a division to its own chapter-level page', () => {
		expect(cccRowHref(find(tree, 'chapter'), 'en')?.(27)).toBe('/catechismus/caput/27');
		expect(cccRowHref(find(tree, 'part'), 'en')?.(27)).toBe('/catechismus/caput/27');
	});

	// An article is a heading INSIDE its chapter's page, never a page: the
	// fragment is the one `ccc/chapter/[n]`'s `anchorFor` emits, so the index
	// and the page it lands on agree by construction.
	it('sends an article into its chapter, at the heading', () => {
		const article = find(tree, 'article');
		expect(cccRowHref(article, 'en')?.(article.paragraphs[0] as number)).toBe(
			'/catechismus/caput/27#s27'
		);
	});

	// Fixed order is what identifies the two, now that the chips print the
	// range alone: the Catechism's slot first, the Compendium's second, on
	// every row down the page. The work's full name is in `title`.
	it('gives both works a chip, in a fixed order', () => {
		const [ccc, compendium] = links(find(tree, 'chapter'));
		expect(ccc?.range.startsWith('¶')).toBe(true);
		expect(ccc?.title).toBe('Catechism — ¶27–49');
		expect(ccc?.href.startsWith('/catechismus/caput/')).toBe(true);
		expect(compendium?.range.startsWith('Q')).toBe(true);
		expect(compendium?.title.startsWith('Compendium — Q')).toBe(true);
	});

	// A structurally paired division is a chapter-level page in the Compendium
	// too; a run of questions merely CONDENSING an article is not a division at
	// all, so nothing makes its first question a chapter opening.
	it('addresses a condensing run as a question, not as a chapter', () => {
		expect(links(find(tree, 'article'))[1]?.href).toBe('/catechismus/compendium/2');
		expect(links(find(tree, 'part'))[1]?.href).toBe('/catechismus/compendium/caput/1');
	});
});
