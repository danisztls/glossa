/**
 * Where a heading of the Code of Canon Law points, and the chain of headings
 * above a canon.
 *
 * `socialDoctrineNav.ts`'s two questions, asked by the same four surfaces —
 * the landing index, the reading sidebar on both routes, and the breadcrumb
 * on both routes — and answered here rather than four times, which is that
 * module's whole reason for existing.
 *
 * THE TITLE VIEW IS THE READING SURFACE AND THE CANON PAGE IS THE CITATION
 * SURFACE. A reader following an outline is going somewhere to read, and
 * `/ius-canonicum/1311` gives them one canon out of a title of fifty-three;
 * the canon page is reached by its number, which is the form `CIC can. 1311`
 * takes anyway.
 */
import { hrefFor } from './address';
import { canonLawOutline, canonLawTitleFor } from './corpus';
import { contains } from './components/structureToc';
import type { StructureNode } from './types';

/**
 * The reading page this heading is read on, at the heading itself.
 *
 * `#s{n}` is the id `/ius-canonicum/titulus/[n]` puts on the first inner
 * heading of a run, and it is omitted where `at` opens the unit — there the
 * heading IS the page's `<h1>` and carries no such id, so the fragment would
 * name nothing and the browser would leave the reader at the previous page's
 * scroll offset.
 */
export function canonLawHeadingHref(lang: string, at: number): string {
	const span = canonLawTitleFor(lang, at);
	if (!span) return hrefFor({ kind: 'canonLaw', n: at });
	const unit = hrefFor({ kind: 'canonLawTitle', n: span[0] });
	return at === span[0] ? unit : `${unit}#s${at}`;
}

/** One crumb: the node, and where it sits among its own siblings — which is
 *  what `marker()` needs to abbreviate a printed label. */
export interface CanonLawCrumb {
	node: StructureNode;
	siblings: StructureNode[];
	index: number;
}

/**
 * Every heading whose span contains `n`, outermost first.
 *
 * THE CODE IS THE DEEPEST TRAIL IN THIS CORPUS — book, part, section, title,
 * chapter, article, six levels where the Compendium of the Social Doctrine
 * has two — so this walk routinely returns four or five crumbs where that
 * one returns one. The descent takes the FIRST containing child at each
 * level and not every one: canon 1311 opens Book VI, its Part I and its Title
 * I together, and those are nested rather than parallel.
 */
export function canonLawTrail(lang: string, n: number): CanonLawCrumb[] {
	const crumbs: CanonLawCrumb[] = [];
	let siblings = canonLawOutline(lang);
	for (;;) {
		const index = siblings.findIndex((node) => contains(node, n));
		if (index === -1) return crumbs;
		const node = siblings[index];
		crumbs.push({ node, siblings, index });
		if (!node.children || node.children.length === 0) return crumbs;
		siblings = node.children;
	}
}

/**
 * A division's title with the canon range the source prints inside it
 * removed — `ECCLESIASTICAL LAWS (Cann. 7 - 22)` -> `ECCLESIASTICAL LAWS`.
 *
 * FIVE OF THE SEVEN EDITIONS PRINT IT AND TWO DO NOT (Latin and Russian
 * print none), so leaving it in gives the same page two shapes depending on
 * the reader's edition, and gives five of them the range twice: once inside
 * the heading and once on the line below, which this site derives for every
 * division of every work. Stripping it here rather than in the corpus is the
 * point — `structure.json` keeps what the edition printed, and this is a
 * decision about a page.
 *
 * Anchored to the END and requiring a digit, so a division whose NAME ends
 * in a parenthesis keeps it.
 */
export function canonLawTitleText(title: string): string {
	return title.replace(/\s*\((?=[^()]*\d)[^()]*\)\s*$/u, '').trim() || title;
}
