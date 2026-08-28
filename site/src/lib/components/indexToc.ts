/**
 * Pure structure-index helpers shared by the Catechism and Compendium
 * landing pages. Both works have the same tree schema and the same broad
 * editorial shape; keeping the selection and labelling rules here prevents
 * their indexes from quietly growing apart again.
 */
import type { StructureNode } from '../types';
import { displayTitle } from '../titles';
import { marker } from './structureToc';

/** Headings that make up the readable outline. `sub` headings remain
 * available behind each parent disclosure; `in-brief` is reading content,
 * not a useful index destination. */
export const INDEX_OUTLINE_KINDS = new Set<StructureNode['kind']>([
	'prologue',
	'part',
	'section',
	'chapter',
	'article'
]);

export function isIndexOutline(node: StructureNode): boolean {
	return INDEX_OUTLINE_KINDS.has(node.kind);
}

export function indexOutlineChildren(node: StructureNode): StructureNode[] {
	return (node.children ?? []).filter(isIndexOutline);
}

/** A source can print an unnumbered `sub` heading. Keep it as context in the
 * disclosure, but leave it unlinked because null bounds are unaddressable. */
export function indexDetailChildren(node: StructureNode): StructureNode[] {
	return (node.children ?? []).filter((child) => child.kind === 'sub');
}

/** `¶27` / `¶27–49`, or `Q217` / `Q217–218`. */
export function rangeLabel(node: StructureNode, unit: string): string {
	const [from, to] = node.paragraphs;
	if (!Number.isFinite(from)) return '';
	return from === to ? `${unit}${from}` : `${unit}${from}–${to ?? '?'}`;
}

export interface IndexSidebarItem {
	href: string;
	label: string;
}

/** The sidebar mirrors only the root divisions; duplicating a whole long
 * index there would make the navigation harder, not easier, to scan. */
export function indexSidebarItems(tree: StructureNode[], lang: string): IndexSidebarItem[] {
	return tree
		.filter((node) => isIndexOutline(node) && Number.isFinite(node.paragraphs[0]))
		.map((node) => ({
			href: `#toc-${node.paragraphs[0]}`,
			label: `${marker(node, lang) ?? ''} ${displayTitle(node, lang).title}`.trim()
		}));
}

/**
 * A row's link to the same division in the companion work — the Compendium
 * from a Catechism row, the Catechism from a Compendium row.
 *
 * `label` is what the row shows and is abbreviated on purpose: the row
 * already spends its width on a title and its own range, and the whole
 * affordance is worth one glance. `title` carries the work's full name for
 * the hover and the accessible name, because "Comp. Q251–294" is only
 * legible to a reader who already knows which of the two books they are
 * looking at.
 */
export interface SiblingLink {
	href: string;
	label: string;
	title: string;
}

/**
 * Build that link from the paired division, or nothing when the outlines
 * do not pair here (`toc-pairing.ts` decides that; this only formats it).
 */
export function siblingLink(
	paired: StructureNode | undefined,
	opts: { hrefBase: string; unit: string; abbrev: string; workTitle: string }
): SiblingLink | undefined {
	if (!paired) return undefined;
	const anchor = paired.paragraphs[0];
	if (!Number.isFinite(anchor)) return undefined;
	const range = rangeLabel(paired, opts.unit);
	return {
		href: `${opts.hrefBase}/${anchor}`,
		label: `${opts.abbrev} ${range}`,
		title: `${opts.workTitle} — ${range}`
	};
}
