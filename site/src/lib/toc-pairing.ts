/**
 * Pairing the Catechism's outline with the Compendium's, so a table of
 * contents row in either work can offer the same division in the other.
 *
 * The two works are one outline published at two lengths. Filtering each
 * tree to a single kind and reading the result in document order pairs them
 * exactly: 4 parts, 8 sections, 20 chapters, in the same order, with the
 * same subjects. That is not an English coincidence — all eight CCC editions
 * and all ten Compendium editions report byte-identical spans for every one
 * of those 32 divisions, so the pairing is a property of the two works and
 * the tree it is computed from may be in any language.
 *
 * IT IS CORROBORATED BY THE SOURCE ITSELF, which is why it is done by
 * position rather than by matching titles. Every Compendium question prints
 * the CCC paragraphs it condenses (`ccc_refs`, docs/link-surface.md #11);
 * expanding those and asking what fraction of each Compendium chapter's
 * referenced paragraphs land inside its positionally-paired CCC chapter
 * gives 95–100% across all twenty, and 98–100% for the parts and sections.
 * Two independent derivations agreeing is the same standard
 * `BOOK_VARIANTS_LA` is held to in `refs-grammar.ts`.
 *
 * `ccc_refs` is nonetheless not read here, and the reason is which tier it
 * lives in: questions are content-tier and arrive by fetch, while both
 * structure trees are already in the eager index tier. Pairing divisions
 * therefore costs an index page nothing. The finer mapping it would buy —
 * a CCC ARTICLE to the run of questions condensing it, which is the level
 * the Compendium has no division of its own to pair with — needs a
 * build-time table and is deliberately not attempted here.
 *
 * WHAT IS DELIBERATELY NOT PAIRED. `article` (67 in the CCC, none in the
 * Compendium), `prologue` (one, none), `sub` (237 against 84) and
 * `in-brief`. In each the two works are not describing the same division,
 * and a row that linked to its parent's destination would claim a precision
 * the outline does not have.
 */
import type { StructureNode } from './types';

/**
 * The kinds the two outlines genuinely share. Everything else is left
 * unpaired — see the module docblock.
 */
export const PAIRED_KINDS: readonly StructureNode['kind'][] = ['part', 'section', 'chapter'];

/** Every node of one kind, depth-first in document order. */
function ofKind(nodes: StructureNode[], kind: StructureNode['kind'], out: StructureNode[] = []) {
	for (const node of nodes) {
		if (node.kind === kind) out.push(node);
		ofKind(node.children ?? [], kind, out);
	}
	return out;
}

/**
 * Map each division in `from` to the division holding the same place in
 * `to`, for the kinds the two works share.
 *
 * A KIND WHOSE COUNTS DIFFER IS SKIPPED ENTIRELY rather than paired up to
 * the shorter list, because pairing by position is only meaningful while
 * the positions agree: one missing division does not shift one row, it
 * shifts every row after it, and the result is a page full of confidently
 * wrong links rather than an obvious gap. This is not hypothetical —
 * `compendium.es` currently parses 7 sections where the other nine editions
 * parse 8, so a Spanish reader is exactly the case the guard is for. It
 * also subsumes the "not paired" list above: `article` is 67 against 0.
 */
export function pairDivisions(
	from: StructureNode[],
	to: StructureNode[]
): Map<StructureNode, StructureNode> {
	const pairs = new Map<StructureNode, StructureNode>();
	for (const kind of PAIRED_KINDS) {
		const left = ofKind(from, kind);
		const right = ofKind(to, kind);
		if (left.length === 0 || left.length !== right.length) continue;
		for (const [i, node] of left.entries()) pairs.set(node, right[i]);
	}
	return pairs;
}

/**
 * `pairDivisions` memoized on the two tree objects, which is what lets a
 * component call it from a `$derived` without rebuilding the map on every
 * render. `getCccStructure`/`getCompendiumStructure` return the same array
 * instance for a given language, so identity is a stable key; the one case
 * where it is not — an absent language, where both return a fresh `[]` —
 * produces an empty map either way.
 */
const cache = new WeakMap<
	StructureNode[],
	WeakMap<StructureNode[], Map<StructureNode, StructureNode>>
>();

export function pairDivisionsCached(
	from: StructureNode[],
	to: StructureNode[]
): Map<StructureNode, StructureNode> {
	let byTo = cache.get(from);
	if (!byTo) cache.set(from, (byTo = new WeakMap()));
	let pairs = byTo.get(to);
	if (!pairs) byTo.set(to, (pairs = pairDivisions(from, to)));
	return pairs;
}

/**
 * The unit number a paired division is addressed by — its first paragraph
 * (CCC) or question (Compendium).
 *
 * `undefined` for an unaddressable bound, the same posture the index takes
 * for its own rows: the Compendium prints divisions whose span is null on
 * both ends (the Creed, the Decalogue epigraphs), and there is no page to
 * send a reader to.
 */
export function pairedAnchor(
	node: StructureNode,
	pairs: Map<StructureNode, StructureNode>
): number | undefined {
	const anchor = pairs.get(node)?.paragraphs[0];
	return typeof anchor === 'number' && Number.isFinite(anchor) ? anchor : undefined;
}
