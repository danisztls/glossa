/**
 * Where a heading of the Compendium of the Social Doctrine points, and the
 * chain of headings above a paragraph.
 *
 * ONE MODULE BECAUSE FOUR SURFACES ASK THE SAME TWO QUESTIONS — the landing
 * index, the reading sidebar (on both routes), and the breadcrumb (on both
 * routes). Each answered them for itself until 2026-09-02, and the answers
 * had already drifted: the index sent a division to the chapter view and
 * every heading inside it to a paragraph page, the sidebar sent all of them
 * to paragraph pages, and the breadcrumb showed one crumb where the
 * Catechism's shows the whole trail.
 *
 * THE CHAPTER VIEW IS THE READING SURFACE AND THE PARAGRAPH PAGE IS THE
 * CITATION SURFACE, which is the distinction a table of contents exists to
 * serve: a reader following an outline is going somewhere to READ, and
 * `/doctrina-socialis/{n}` gives them one paragraph out of a chapter of
 * sixty. So every row of every outline lands in the chapter, at the heading
 * it names; the paragraph page is reached by its number, which is the form a
 * citation takes anyway.
 */
import { hrefFor } from './address';
import { socialDoctrineChapterFor, socialDoctrineOutline } from './corpus';
import { contains } from './components/structureToc';
import type { StructureNode } from './types';

/**
 * The chapter page this heading is read on, at the heading itself.
 *
 * `#s{n}` is the id `/doctrina-socialis/caput/[n]` puts on the first inner
 * heading of a run, and it is omitted where `at` opens the division — there
 * the heading IS the page's `<h1>` and carries no such id, so a fragment
 * would name nothing and the browser would leave the reader wherever the
 * previous page's scroll left them.
 */
export function socialDoctrineHeadingHref(lang: string, at: number): string {
	const span = socialDoctrineChapterFor(lang, at);
	if (!span) return hrefFor({ kind: 'socialDoctrine', n: at });
	const chapter = hrefFor({ kind: 'socialDoctrineChapter', n: span[0] });
	return at === span[0] ? chapter : `${chapter}#s${at}`;
}

/** One crumb: the node, and where it sits among its own siblings — which is
 *  what `marker()` needs to abbreviate a printed label (`CHAPTER SIX`) to the
 *  short form a breadcrumb has room for (`Ch. 6`). */
export interface SocialDoctrineCrumb {
	node: StructureNode;
	siblings: StructureNode[];
	index: number;
}

/**
 * Every heading whose span contains `n`, outermost first — the Catechism's
 * `breadcrumb`, derived here rather than stored, because this work's outline
 * is built from a document's flat rows and its loader has no such field.
 *
 * The walk takes the FIRST containing child at each level and not every one:
 * several headings legitimately open at the same paragraph (a part, its
 * first chapter, that chapter's first section), and they are nested rather
 * than parallel, so descending once per level is what walks the trail.
 */
export function socialDoctrineTrail(lang: string, n: number): SocialDoctrineCrumb[] {
	const crumbs: SocialDoctrineCrumb[] = [];
	let siblings = socialDoctrineOutline(lang);
	for (;;) {
		const index = siblings.findIndex((node) => contains(node, n));
		if (index === -1) return crumbs;
		const node = siblings[index];
		crumbs.push({ node, siblings, index });
		if (!node.children || node.children.length === 0) return crumbs;
		siblings = node.children;
	}
}
