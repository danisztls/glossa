/**
 * Pure structure-index helpers shared by the Catechism and Compendium
 * landing pages. Both works have the same tree schema and the same broad
 * editorial shape; keeping the selection and labelling rules here prevents
 * their indexes from quietly growing apart again.
 */
import type { StructureNode } from '../types';

/** The NUMBERED spine of the outline. `in-brief` is reading content rather
 * than an index destination, and `sub` is handled apart — see
 * `indexDetailChildren`. */
export const INDEX_OUTLINE_KINDS = new Set<StructureNode['kind']>([
	'prologue',
	'part',
	'section',
	'chapter',
	'article'
]);

/**
 * The same floor for a work whose outline came out of a DOCUMENT's flat
 * `{level, title, before}` rows — the Compendium of the Social Doctrine.
 *
 * It is `sub` and nothing else because `buildDocumentOutline` (corpus.ts)
 * stamps every node it builds `kind: 'sub'`: a document heading carries no
 * structured kind at all, deliberately (`types.ts`'s `DocumentNode`
 * docblock — judging what a heading *means* is what mis-nested chapters
 * inside sections in Gaudium et Spes). So the whole outline is one kind, the
 * spine/detail split `indexDetailChildren` draws does not describe it, and
 * "the numbered spine" and "everything" are the same set.
 *
 * Passing it is what lets `indexRows` walk that tree at all: filtered against
 * `INDEX_OUTLINE_KINDS` it selects no root and returns nothing.
 */
export const DOCUMENT_OUTLINE_KINDS = new Set<StructureNode['kind']>(['sub']);

/** Whether `node` is on the spine `kinds` describes. The default is the
 *  Catechism's and its Compendium's. */
export function isIndexOutline(
	node: StructureNode,
	kinds: Set<StructureNode['kind']> = INDEX_OUTLINE_KINDS
): boolean {
	return kinds.has(node.kind);
}

export function indexOutlineChildren(
	node: StructureNode,
	kinds: Set<StructureNode['kind']> = INDEX_OUTLINE_KINDS
): StructureNode[] {
	return (node.children ?? []).filter((child) => isIndexOutline(child, kinds));
}

/** A source can print an unnumbered `sub` heading. It is a row like any
 * other — it has a paragraph span, so it has an address — just one level
 * further in and behind its parent's disclosure. It was drawn as a list
 * INSIDE the parent's title cell until 2026-08-28, which put its range at the
 * title column's edge rather than under the work it belongs to. */
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

/**
 * The outline flattened to rows, each carrying the depth it was found at and
 * the ancestors it hangs off.
 *
 * WHY FLAT. The index is a table of two variables — a division, and what each
 * of the two works has at it — so it is drawn as one: a real `<table>` whose
 * columns are the works. Nested `<ol>`s cannot do that. Each level is its own
 * formatting context, so the chips in it right-align against ITS box and not
 * the page's, which is why the two columns were ragged and why no amount of
 * per-row flexbox could straighten them. Depth becomes an indent on the title
 * cell instead, and the recursion happens here where it can be tested.
 *
 * WHY ANCESTORS. Collapsing is what a flat list gives up and has to buy back:
 * a row is on screen only while every row above it in the tree is open, and
 * `ancestors` is that chain, outermost first. It is a list of KEYS rather than
 * nodes so the caller can answer "is this open?" from a set of strings that
 * survives a language switch — `ancestors[i]` is always the ancestor at depth
 * `i`, which is what lets openness be decided per depth without storing a row
 * for every closed one.
 *
 * `maxDepth` is exclusive of the level it names: 1 is the top level alone, 2
 * adds its children.
 *
 * `kinds` is which kinds the spine is made of, defaulting to the Catechism's
 * (`INDEX_OUTLINE_KINDS`). The Social Doctrine passes
 * `DOCUMENT_OUTLINE_KINDS` — an outline built from a document's headings is
 * all one kind, so it is the whole tree, and the `sub` detail pass is skipped
 * rather than walking every row a second time.
 */
export interface IndexRow {
	node: StructureNode;
	depth: number;
	/** `rowKey` of every ancestor, outermost first. */
	ancestors: string[];
	/** Whether opening this row would reveal anything. */
	expandable: boolean;
}

/** A row's identity. Title plus span, because a `StructureNode` carries no id
 *  and the same object is not handed back across a language switch. */
export function rowKey(node: StructureNode): string {
	return `${node.title}|${node.paragraphs.join('-')}`;
}

export function indexRows(
	tree: StructureNode[],
	opts: { maxDepth?: number; subsections?: boolean; kinds?: Set<StructureNode['kind']> } = {}
): IndexRow[] {
	const maxDepth = opts.maxDepth ?? Number.POSITIVE_INFINITY;
	// Which kinds are the spine. `INDEX_OUTLINE_KINDS` for the Catechism and
	// its Compendium; `DOCUMENT_OUTLINE_KINDS` for an outline derived from a
	// document's headings, whose nodes are all one kind.
	const kinds = opts.kinds ?? INDEX_OUTLINE_KINDS;
	// A `sub` is a row at the next depth down, not something hung off the row
	// above it — so an overview drops it by not walking into it at all. Merged
	// in paragraph order rather than appended: the one section that prints both
	// a sub-heading and chapters prints the sub-heading first.
	//
	// The detail pass is skipped entirely when `sub` is ITSELF the spine, or
	// the whole tree would be walked twice and every row rendered twice.
	const detailOf = (node: StructureNode) =>
		opts.subsections === false || kinds.has('sub') ? [] : indexDetailChildren(node);
	const childrenOf = (node: StructureNode) => {
		const spine = indexOutlineChildren(node, kinds);
		const detail = detailOf(node);
		return detail.length === 0
			? spine
			: [...spine, ...detail].sort((a, b) => (a.paragraphs[0] ?? 0) - (b.paragraphs[0] ?? 0));
	};
	const rows: IndexRow[] = [];
	const walk = (nodes: StructureNode[], depth: number, ancestors: string[]) => {
		for (const node of nodes) {
			const kids = depth + 1 < maxDepth ? childrenOf(node) : [];
			rows.push({ node, depth, ancestors, expandable: kids.length > 0 });
			if (kids.length > 0) walk(kids, depth + 1, [...ancestors, rowKey(node)]);
		}
	};
	walk(
		tree.filter((node) => isIndexOutline(node, kinds)),
		0,
		[]
	);
	return rows;
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
 * THE CHIP SHOWS THE RANGE AND NOT THE WORK'S NAME. It carried the siglum too
 * until 2026-08-28 — `CCC ¶198–421`, `Comp. Q36–95` — and reading a hundred
 * rows of it is reading `CCC` a hundred times to learn nothing: the slots are
 * in a fixed order down the whole page, and the range already opens with the
 * unit that names the work (`¶` for a paragraph, `Q` for a question). What
 * the abbreviation was carrying for the reader who does not yet know that is
 * kept in `title`, which is both the hover and the accessible name.
 */
export interface RowLink {
	/** Where the chip goes on its own. ABSENT ON A ONE-DESTINATION INDEX:
	 *  where the whole row is a single link (`StructureIndex`'s `rowHref`) the
	 *  chip sits inside that link's target area, so an `<a>` of its own would
	 *  be a second link to the same page — which is what the Compendium of the
	 *  Social Doctrine's index had, one going to the chapter and one to a
	 *  paragraph. The chip then states the extent and nothing else, which is
	 *  the only thing it was carrying that the title does not. */
	href?: string;
	/** Its extent in its OWN numbering — `¶198–421`, `Q36–95`. Set in tabular
	 *  numerals so a column of them lines up. */
	range: string;
	/** `"Compendium of the Catechism — Q251–294"`, for the hover and the
	 *  accessible name. The only place the work is named in full. */
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
		/** The address of the span's first unit, from `hrefFor`. Omitted where
		 *  the row itself is the link — see `RowLink.href`. */
		href?: (n: number) => string;
		unit: string;
		workTitle: string;
	}
): RowLink | undefined {
	if (!span) return undefined;
	const [from, to] = span;
	if (!Number.isFinite(from)) return undefined;
	const range = runLabel(from as number, to, opts.unit);
	return {
		...(opts.href ? { href: opts.href(from as number) } : {}),
		range,
		title: `${opts.workTitle} — ${range}`
	};
}
