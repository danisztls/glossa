/**
 * The two offers an index row makes: the Catechism's treatment of a division
 * and the Compendium's, addressed correctly.
 *
 * Shared by the home page and `/catechismus`, which show the same table of
 * contents to different depths.
 *
 * WHERE A ROW POINTS IS NOT UNIFORM, and getting it wrong is silent: the site
 * is an SPA shell, so a bad reader URL is answered by `src/worker.ts` with the
 * shell and a 404 rather than by a build failure. Both halves were wrong until
 * 2026-08-28 — 65 of the Catechism index's 100 rows and 60 of its Compendium
 * badges pointed at addresses the corpus does not carry — because both were
 * built by appending a number to one fixed base path. Four cases:
 *
 *   - A Catechism PART, SECTION, CHAPTER or the Prologue opens a chapter-level
 *     page and is addressed by its own first paragraph. All 33 of them are.
 *   - A Catechism ARTICLE or SUB-HEADING is not: it is a heading INSIDE that
 *     page, so
 *     `/catechismus/caput/51` is not an address at all. It is the enclosing
 *     CHAPTER-SIZED division plus `#s{n}` — the same fragment
 *     `ccc/chapter/[n]`'s `anchorFor` emits for its sidebar, so the index and
 *     the page it lands on agree by construction. Chapter-sized means
 *     `CCC_CHAPTER_KINDS`, which is chapter OR section OR part OR prologue,
 *     and the breadth matters: the four articles of Part Four's second
 *     section ("The Lord's Prayer", ¶2761 on) hang directly off a section
 *     with no chapter between, and resolving only chapters would leave them
 *     with no Catechism link at all — on the Catechism's own index. A `sub`
 *     takes the same rule and for the same reason: `ccc/chapter/[n]` prints a
 *     heading with an `s{n}` id for one, it simply had no sidebar row pointing
 *     at it (see `anchorFor` there).
 *   - A Compendium DIVISION paired structurally is a chapter-level page too,
 *     addressed by its own first question.
 *   - A run of questions CONDENSING a Catechism article is not a division at
 *     all — nothing makes its first question a chapter opening — so it is
 *     addressed as a question. All 60 resolve that way and none as a chapter.
 *
 * AND A COLUMN CAN BE ABSENT ENTIRELY. Four languages have the Compendium and
 * no Catechism (`hu`, `ro`, `sl`, `sv`) and two have the Catechism and no
 * Compendium (`la`, `mg`). The page then renders whichever work it has, and
 * `columns` says which offers exist — an absent work gets no column rather
 * than a column of dashes, and never a link into an edition the reader did
 * not ask for.
 */
import { hrefFor } from '../address';
import { condensingQuestionRun, getCccChapterFor } from '../corpus';
import type { StructureNode } from '../types';
import { workLink, type RowLink } from './indexToc';

/** The two works' full names, for the chips' hover and accessible name. The
 *  chip itself shows only the range — see `RowLink`. */
export interface RowLabels {
	cccTitle: string;
	compendiumTitle: string;
}

/** Which kinds are a heading inside a chapter's page rather than a page. */
const INSIDE_A_CHAPTER: readonly StructureNode['kind'][] = ['article', 'sub'];

/** The Catechism's own address for a row: itself, or its chapter plus a
 *  fragment when the row is an article or a sub-heading. Exported for its
 *  test. */
export function cccRowHref(node: StructureNode, lang: string): ((n: number) => string) | undefined {
	if (!INSIDE_A_CHAPTER.includes(node.kind)) return (n) => hrefFor({ kind: 'cccChapter', n });
	// `getCccChapterFor` walks out to the nearest CCC_CHAPTER_KINDS ancestor,
	// which is why an article under a bare section resolves as well as one
	// under a chapter.
	const chapter = getCccChapterFor(lang, node.paragraphs[0] as number);
	const at = chapter?.paragraphs[0];
	if (at == null || !Number.isFinite(at)) return undefined;
	return (n) => `${hrefFor({ kind: 'cccChapter', n: at })}#s${n}`;
}

/** Which work a rendered tree belongs to, and so which columns a row can
 *  offer. */
export type IndexWork = 'ccc' | 'compendium';

/**
 * Both works' offers for one row, one per entry in `columns` and in that
 * order, so the columns line up down the page. `undefined` in a slot is a row
 * that work has no counterpart for, which the index draws as a placeholder
 * rather than closing the gap.
 */
export function catechismRowLinks(
	node: StructureNode,
	opts: {
		/** Which work the rendered tree is. `compendium` only when the reader's
		 *  language has no Catechism at all. */
		tree: IndexWork;
		/** The tree's language, for resolving an article's enclosing chapter. */
		lang: string;
		/** The columns this page carries, in order. */
		columns: readonly IndexWork[];
		/** From `pairDivisionsCached(cccTree, compendiumTree)`. Empty when the
		 *  page carries only one work. */
		pairs: Map<StructureNode, StructureNode>;
		labels: RowLabels;
	}
): (RowLink | undefined)[] {
	const { labels } = opts;
	return opts.columns.map((column) =>
		column === 'ccc'
			? cccLink(node, opts.lang, labels.cccTitle)
			: compendiumLink(node, opts, labels.compendiumTitle)
	);
}

function cccLink(node: StructureNode, lang: string, workTitle: string): RowLink | undefined {
	const href = cccRowHref(node, lang);
	return href ? workLink(node.paragraphs, { href, unit: '¶', workTitle }) : undefined;
}

function compendiumLink(
	node: StructureNode,
	opts: { tree: IndexWork; pairs: Map<StructureNode, StructureNode> },
	workTitle: string
): RowLink | undefined {
	// The tree IS the Compendium: the row addresses itself. A division opens a
	// chapter-level page; a sub-heading is not a division, so it is addressed
	// as the question it starts at.
	if (opts.tree === 'compendium') {
		const kind: 'compendium' | 'compendiumChapter' =
			node.kind === 'sub' ? 'compendium' : 'compendiumChapter';
		return workLink(node.paragraphs, {
			href: (n) => hrefFor({ kind, n }),
			unit: 'Q',
			workTitle
		});
	}

	// Structural pairing first, then the condensation vote. The order is not
	// arbitrary: a part, section or chapter has a counterpart DIVISION in the
	// Compendium, which is a stronger statement than "these questions cite
	// these paragraphs" — and it is a different kind of address.
	const paired = opts.pairs.get(node);
	if (paired) {
		return workLink(paired.paragraphs, {
			href: (n) => hrefFor({ kind: 'compendiumChapter', n }),
			unit: 'Q',
			workTitle
		});
	}
	const [from, to] = node.paragraphs;
	const run =
		Number.isFinite(from) && Number.isFinite(to)
			? condensingQuestionRun(from as number, to as number)
			: undefined;
	return workLink(run, { href: (n) => hrefFor({ kind: 'compendium', n }), unit: 'Q', workTitle });
}
