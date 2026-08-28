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
	return runLabel(from as number, to, unit);
}

/** The same, for a span that is not a structure node — a run of Compendium
 *  questions condensing a Catechism article, say. */
export function runLabel(from: number, to: number | null | undefined, unit: string): string {
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
 * One work's offer on an index row: where it treats this division, and how
 * much of it there is.
 *
 * A row carries one of these PER WORK, presented alike — the Catechism and
 * its Compendium are one outline at two lengths, and an index that linked the
 * title to one of them and badged the other would be answering a question the
 * reader has not asked yet. So the title is not a link and both works are.
 *
 * `work` and `range` are separate because they are read differently: the
 * abbreviation says which book, the range says how much, and the range is set
 * in tabular numerals so a column of them lines up. `title` carries the full
 * name for the hover and the accessible name, since "Comp. Q251-294" is only
 * legible to a reader who already knows which of the two books it names.
 */
export interface RowLink {
	href: string;
	/** The work's siglum — `CCC`, `Comp.` */
	work: string;
	/** Its extent in its OWN numbering — `¶198–421`, `Q36–95`. */
	range: string;
	/** `"Compendium — Q251–294"`, for the hover and the accessible name. */
	title: string;
}

/**
 * Build that offer from a span, or nothing when the work has none here.
 *
 * This only formats. What the span IS comes from `toc-pairing.ts` for the
 * divisions the two outlines share and from `condensation.ts` for the
 * Catechism articles they do not, and WHERE IT POINTS comes from `href` —
 * which differs between those two cases and is the caller's to know
 * (`catechismRows.ts`).
 */
export function workLink(
	span: readonly [number | null, number | null] | undefined,
	opts: {
		/** The address of the span's first unit, from `hrefFor`. */
		href: (n: number) => string;
		unit: string;
		abbrev: string;
		workTitle: string;
	}
): RowLink | undefined {
	if (!span) return undefined;
	const [from, to] = span;
	if (!Number.isFinite(from)) return undefined;
	const range = runLabel(from as number, to, opts.unit);
	return {
		href: opts.href(from as number),
		work: opts.abbrev,
		range,
		title: `${opts.workTitle} — ${range}`
	};
}
