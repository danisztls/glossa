/**
 * Pure logic behind `StructureSidebarToc.svelte`, pulled out of the
 * component so it can be unit-tested directly (house style — see
 * `refs.test.ts`/`refs.ts`) rather than only indirectly through rendered
 * markup. The component itself is a thin recursive-snippet walk over
 * `StructureNode.children` that calls straight into these functions; nothing
 * here talks to the DOM or to Svelte.
 */
import type { StructureNode } from '../types';
import { displayTitle, kindOrdinalLabel } from '../titles';

/**
 * The granularity `/ccc/+page.svelte`'s "chapter-sized" reasoning already
 * uses (`getCccChapterFor`) and this sidebar cuts the CCC/Compendium tree
 * down to: prologue/part/section/chapter, no `article` and nothing below
 * it. Counted against the real corpus that floor is 32-33 nodes for the CCC
 * and 32 for the Compendium, in EN and PT alike (`structure.json` for all
 * four work/lang combinations was counted directly, not assumed) — small
 * enough to render fully expanded, permanently, in a 17rem column, so there
 * is no expand/collapse state to manage anywhere in this module or the
 * component that uses it.
 *
 * A document's tree gets no such floor (`outlineChildren` below renders
 * every kind when the caller passes `undefined` instead of this set): a
 * short apostolic letter and a four-level encyclical don't share a universal
 * "chapter-sized" cutoff the way the CCC and Compendium — both fixed,
 * both already measured — do.
 */
export const OUTLINE_KINDS = new Set<StructureNode['kind']>([
	'prologue',
	'part',
	'section',
	'chapter'
]);

/**
 * Whether `n` falls inside `node`'s own paragraph/question/section range.
 * Null bounds mean "unaddressable" (docs/corpus-schema.md) and never match —
 * checked with `Number.isFinite`, not `n < node.paragraphs[0]`, because JS
 * coerces `n < null` to `n < 0` and would silently misreport.
 */
export function contains(node: StructureNode, n: number): boolean {
	const [from, to] = node.paragraphs;
	return (
		Number.isFinite(from) && Number.isFinite(to) && n >= (from as number) && n <= (to as number)
	);
}

/**
 * `node`'s children, restricted to `kinds` when given. `undefined` renders
 * every child kind present in the corpus — right for a document; a fixed
 * `Set` (pass `OUTLINE_KINDS`) prunes the walk to chapter-sized granularity —
 * right for the CCC/Compendium, whose trees are shallow enough that showing
 * everything already fits.
 */
export function outlineChildren(
	node: StructureNode,
	kinds: Set<StructureNode['kind']> | undefined
): StructureNode[] {
	const kids = node.children ?? [];
	return kinds ? kids.filter((child) => kinds.has(child.kind)) : kids;
}

export interface RowState {
	/** `node` itself, or an ancestor of the reader's current row. */
	onPath: boolean;
	/** The DEEPEST node (within the rendered — i.e. `kinds`-filtered — tree)
	 *  containing the reader's current position. At most one row per level
	 *  of the walk is ever current, but every ancestor of it is `onPath`. */
	isCurrent: boolean;
}

/**
 * Merges the two source components' approaches to "which row is the reader
 * on" into one: `StructureSidebarToc` distinguished the exact matching row
 * (`isCurrent`, a solid highlight + `aria-current`) from its ancestors
 * (`onPath`, an accent-only cue); `DocumentToc` marked every ancestor
 * identically with no distinct "this one exactly" signal. The distinction
 * wins here — the merged component is used on documents whose trees run
 * deeper (part → chapter → article → sub) than the CCC/Compendium's fixed
 * `OUTLINE_KINDS` floor, so knowing *which* ancestor is the actual leaf
 * matters more here, not less.
 */
export function rowState(
	node: StructureNode,
	currentN: number | undefined,
	kinds: Set<StructureNode['kind']> | undefined
): RowState {
	if (currentN === undefined || !contains(node, currentN))
		return { onPath: false, isCurrent: false };
	const kids = outlineChildren(node, kinds);
	return { onPath: true, isCurrent: !kids.some((child) => contains(child, currentN)) };
}

/**
 * The leading marker shown before a row's title — `kindOrdinalLabel`'s
 * abbreviated, kind-disambiguated form ("Ch. 3", "Art. 2") when one exists
 * for this node's kind, falling back to `displayTitle`'s bare ordinal
 * ("3.") when it doesn't.
 *
 * `kindOrdinalLabel` only covers part/section/chapter/article
 * (`titles.ts`'s `KIND_LABELS`) — `DocumentToc` used `displayTitle`'s bare
 * ordinal for every kind instead, which is the only way a `sub` node (a
 * document's fifth heading level, `read/+page.svelte`'s `headingTag`) ever
 * gets numbered at all, since `KIND_LABELS` has no "Sub" entry. Picking
 * `kindOrdinalLabel` alone, the way `StructureSidebarToc` did, would have
 * silently dropped that numbering for documents; falling back to the bare
 * ordinal keeps it exactly as `DocumentToc` rendered it while still
 * upgrading part/section/chapter/article to the disambiguated label — worth
 * having on a document tree for the identical reason `kindOrdinalLabel`'s
 * own docblock gives for the CCC: four levels of numbered heading otherwise
 * all show the same bare "1.".
 */
export function marker(node: StructureNode, lang: string): string | null {
	return kindOrdinalLabel(node, lang) ?? displayTitle(node, lang).ordinal;
}

export type LinkMode = 'route' | 'anchor';

/**
 * `'route'` (default): `${basePath}/{n}` — the CCC/Compendium/per-section
 * document routes, where each row is its own page.
 *
 * `'anchor'`: `#s{n}` — `/documents/[slug]/read`, where the whole document
 * is already one page and a row navigates within it instead of away from
 * it. `basePath` is unused in this mode.
 */
export function hrefFor(n: number, linkMode: LinkMode, basePath: string | undefined): string {
	return linkMode === 'anchor' ? `#s${n}` : `${basePath}/${n}`;
}
