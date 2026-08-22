/**
 * Pure logic behind `StructureSidebarToc.svelte`, pulled out of the
 * component so it can be unit-tested directly (house style — see
 * `refs.test.ts`/`refs.ts`) rather than only indirectly through rendered
 * markup. The component itself is a thin recursive-snippet walk over
 * `StructureNode.children` that calls straight into these functions; nothing
 * here talks to the DOM or to Svelte.
 */
import type { StructureNode } from '../types';
import { displayTitle, kindLabelWord, kindOrdinalLabel } from '../titles';

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
 * `label`'s first-or-last alphabetic word, normalized (accents stripped,
 * upper-cased), matched against the same four kinds `KIND_LABELS`
 * (`titles.ts`) carries a printed word for — or `null` when neither end
 * matches, which is the common case (`"INTRODUÇÃO"`, a nested sub-heading's
 * own title with no printed identifier line at all).
 *
 * Checking BOTH ends, not just the first word, is what `kindPrefixTokens`
 * (`titles.ts`) already found true of the real corpus: chapter puts the kind
 * word first ("CHAPTER TWO", "CAPÍTULO I") but Portuguese part/section put
 * it last ("PRIMEIRA PARTE") — both attested in `structure.json`, not a typo
 * to normalize away. This only ever feeds a display abbreviation and a
 * same-kind sibling count, never the tree shape itself (`DocumentNode`'s own
 * docblock in `types.ts` is the reason the scraper stopped attaching a
 * `kind` to documents at all — that judgment call is what mis-nested
 * chapters inside sections in Gaudium et Spes), so a wrong or missing match
 * here degrades to the plain verbatim label, not a structural error.
 */
const LABEL_KIND_WORDS: Partial<Record<string, StructureNode['kind']>> = {
	CHAPTER: 'chapter',
	CAPITULO: 'chapter',
	PART: 'part',
	PARTE: 'part',
	ARTICLE: 'article',
	ARTIGO: 'article',
	SECTION: 'section',
	SECCAO: 'section'
};

function documentLabelKind(label: string): StructureNode['kind'] | null {
	const words = label
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toUpperCase()
		.match(/[A-Z]+/g);
	if (!words || words.length === 0) return null;
	return LABEL_KIND_WORDS[words[0]] ?? LABEL_KIND_WORDS[words[words.length - 1]] ?? null;
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
 *
 * A document heading whose source printed its own identifier line
 * ("CHAPTER THREE") normally uses that verbatim — it is what the page says,
 * so there is nothing to reconstruct or translate. The sidebar TOC is the
 * one exception: a column 17rem wide has no room for "CHAPTER THREE" spelled
 * out at every row, the way it does for a full-width heading, so callers
 * that pass `siblings`/`index` (this node's own position among its actual
 * tree siblings) get `kindLabelWord`'s abbreviated word ("Ch.") plus a
 * number DERIVED from position — the count of earlier siblings recognized as
 * the same kind — rather than parsed out of the source text. Deriving from
 * position, not parsing the printed ordinal, is what stays robust against
 * the real corpus's inconsistent numbering style (spelled-out cardinals,
 * roman numerals, and at least one scrape typo — "CAPÍTULO IlII" — none of
 * which this ever has to read). Omitting `siblings`/`index`, or a label
 * whose kind word isn't recognized, falls back to the verbatim label
 * unchanged.
 */
export function marker(
	node: StructureNode,
	lang: string,
	siblings?: StructureNode[],
	index?: number
): string | null {
	if (node.label) {
		const kind = documentLabelKind(node.label);
		const word = kind ? kindLabelWord(kind, lang) : null;
		if (word && siblings && index !== undefined) {
			const position =
				siblings
					.slice(0, index)
					.filter((sib) => sib.label && documentLabelKind(sib.label) === kind).length + 1;
			return `${word} ${position}`;
		}
		return node.label;
	}
	return kindOrdinalLabel(node, lang) ?? displayTitle(node, lang).ordinal;
}

/**
 * The index of the ONE row among `nodes` that marks the reader's position,
 * or -1. Siblings can legitimately share a range — a document heading
 * immediately followed by its first sub-heading, with no numbered section
 * between them, derives the same span for both — and `rowState` alone would
 * then report every one of them as current, duplicating the `id` the aside
 * scrolls to and putting `aria-current="page"` on several links at once.
 * First match wins, which is the row a reader scrolling down reaches first.
 */
export function currentIndex(
	nodes: StructureNode[],
	currentN: number | undefined,
	kinds: Set<StructureNode['kind']> | undefined
): number {
	return nodes.findIndex((node) => rowState(node, currentN, kinds).isCurrent);
}

export type LinkMode = 'route' | 'anchor';

/**
 * `'route'` (default): `${basePath}/{n}` — the CCC/Compendium/per-section
 * document routes, where each row is its own page.
 *
 * `'anchor'`: `#s{n}` — `/documents/[slug]`, where the whole document
 * is already one page and a row navigates within it instead of away from
 * it. `basePath` is unused in this mode.
 */
export function hrefFor(
	node: StructureNode,
	n: number,
	linkMode: LinkMode,
	basePath: string | undefined
): string {
	// A row carrying its own `anchor` addresses the heading it names. Only
	// documents set one, and only they need it: `#s{n}` lands on the SECTION
	// after the heading, which puts the heading itself off the top of the
	// viewport and makes a TOC row and the text it points at disagree about
	// where the division starts.
	if (linkMode === 'anchor' && node.anchor) return `#${node.anchor}`;
	return linkMode === 'anchor' ? `#s${n}` : `${basePath}/${n}`;
}
