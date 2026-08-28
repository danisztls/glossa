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
 *   - A Catechism ARTICLE is not: it is a heading INSIDE that page, so
 *     `/catechismus/caput/51` is not an address at all. It is the enclosing
 *     CHAPTER-SIZED division plus `#s{n}` — the same fragment
 *     `ccc/chapter/[n]`'s `anchorFor` emits for its sidebar, so the index and
 *     the page it lands on agree by construction. Chapter-sized means
 *     `CCC_CHAPTER_KINDS`, which is chapter OR section OR part OR prologue,
 *     and the breadth matters: the four articles of Part Four's second
 *     section ("The Lord's Prayer", ¶2761 on) hang directly off a section
 *     with no chapter between, and resolving only chapters would leave them
 *     with no Catechism link at all — on the Catechism's own index.
 *   - A Compendium DIVISION paired structurally is a chapter-level page too,
 *     addressed by its own first question.
 *   - A run of questions CONDENSING a Catechism article is not a division at
 *     all — nothing makes its first question a chapter opening — so it is
 *     addressed as a question. All 60 resolve that way and none as a chapter.
 */
import { hrefFor } from '../address';
import { condensingQuestionRun, getCccChapterFor } from '../corpus';
import type { StructureNode } from '../types';
import { workLink, type RowLink } from './indexToc';

export interface RowLabels {
	cccAbbrev: string;
	cccTitle: string;
	compendiumAbbrev: string;
	compendiumTitle: string;
}

/** The Catechism's own address for a row: itself, or its chapter plus a
 *  fragment when the row is an article. Exported for its test. */
export function cccRowHref(node: StructureNode, lang: string): ((n: number) => string) | undefined {
	if (node.kind !== 'article') return (n) => hrefFor({ kind: 'cccChapter', n });
	// `getCccChapterFor` walks out to the nearest CCC_CHAPTER_KINDS ancestor,
	// which is why an article under a bare section resolves as well as one
	// under a chapter.
	const chapter = getCccChapterFor(lang, node.paragraphs[0] as number);
	const at = chapter?.paragraphs[0];
	if (at == null || !Number.isFinite(at)) return undefined;
	return (n) => `${hrefFor({ kind: 'cccChapter', n: at })}#s${n}`;
}

/**
 * Both works' offers for one row, in a fixed order so the two columns line up
 * down the page. `undefined` in a slot is a row the work has no counterpart
 * for, which the index draws as a placeholder rather than closing the gap —
 * the Catechism's Prologue was the only such row until the condensation vote
 * gave it question 1.
 */
export function catechismRowLinks(
	node: StructureNode,
	opts: {
		cccLang: string;
		/** From `pairDivisionsCached(cccTree, compendiumTree)`. */
		pairs: Map<StructureNode, StructureNode>;
		labels: RowLabels;
	}
): (RowLink | undefined)[] {
	const { labels } = opts;
	const href = cccRowHref(node, opts.cccLang);
	const ccc = href
		? workLink(node.paragraphs, {
				href,
				unit: '¶',
				abbrev: labels.cccAbbrev,
				workTitle: labels.cccTitle
			})
		: undefined;

	// Structural pairing first, then the condensation vote. The order is not
	// arbitrary: a part, section or chapter has a counterpart DIVISION in the
	// Compendium, which is a stronger statement than "these questions cite
	// these paragraphs" — and it is a different kind of address.
	const paired = opts.pairs.get(node);
	let compendium: RowLink | undefined;
	if (paired) {
		compendium = workLink(paired.paragraphs, {
			href: (n) => hrefFor({ kind: 'compendiumChapter', n }),
			unit: 'Q',
			abbrev: labels.compendiumAbbrev,
			workTitle: labels.compendiumTitle
		});
	} else {
		const [from, to] = node.paragraphs;
		const run =
			Number.isFinite(from) && Number.isFinite(to)
				? condensingQuestionRun(from as number, to as number)
				: undefined;
		compendium = workLink(run, {
			href: (n) => hrefFor({ kind: 'compendium', n }),
			unit: 'Q',
			abbrev: labels.compendiumAbbrev,
			workTitle: labels.compendiumTitle
		});
	}

	return [ccc, compendium];
}
