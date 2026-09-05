/**
 * The ordered routes `/schola` offers, and the rule that keeps them honest.
 *
 * ## Nothing here is this site's opinion about what to read
 *
 * A page that tells a reader what to read next is the site recommending, and
 * `docs/writing-descriptions.md` binds the only prose this project authors
 * with "Do not evaluate, recommend, or contextualize". `/colophon` disclaims
 * any approbation and `docs/research/audiences.md` §9 exists to catch anything
 * that reads like one.
 *
 * So every route below reproduces an order that a document IN THIS CORPUS
 * states, and carries the address that states it (`LearningRoute.source`).
 * The four pillars are the Catechism's own plan for itself, at
 * `/catechismus/13`; that an ordered course is the right shape at all is
 * Catechesi Tradendae 21, "systematic, not improvised but programmed to reach
 * a precise goal"; the Council's documents are ranked by the Council's own
 * three genres. Where no source states an order, there is no route.
 *
 * The one place the site does speak for itself is the note at the top of
 * `/schola`, which is marked as ours on the page. It is not in this file,
 * because it is not a route.
 *
 * ## Every step is derived, never written down
 *
 * Step labels come from the corpus — a part's own title, a book's own name in
 * the reader's edition, a document's own title — so they are already in the
 * reader's content language and cannot fall out of date with an ingestion.
 * The interface strings on `/schola` are the route NAMES and the sentence
 * citing each source, and nothing else.
 *
 * ## Why these are pure functions over data
 *
 * Each builder takes what it needs rather than reaching into `corpus.ts`, so
 * `learning-routes.test.ts` can exercise the council and social-doctrine
 * routes at all: the test fixtures under `src/lib/fixtures/` carry the
 * Catechism, the Compendium, the Bible and the Summa, and no documents, no
 * prayers and no Social Doctrine. A builder that fetched its own data would
 * be untestable for exactly the two routes whose ordering rule is the least
 * obvious.
 *
 * Every address is built by `hrefFor`, which is the only function on the site
 * that writes one (`address.ts`). No path in this file is a template string.
 */

import { hrefFor } from './address';
import { BOOK_GROUPS } from './bible-groups';
import { catechismRowLinks, type IndexWork } from './components/catechismRows';
import type { RowLabels } from './components/catechismRows';
import type { DocumentGroup } from './corpus';
import type { DocumentManifest, StructureNode } from './types';

export type RouteKey = 'pillars' | 'gospels' | 'council' | 'social';

/**
 * A second address the same step offers — the Compendium's treatment beside
 * the Catechism's, a book's introduction beside its first chapter, the prayer
 * a pillar of the Catechism actually is.
 *
 * `label` is corpus text and `labelKey` an interface key; exactly one is set.
 * A chip naming a kind of thing ("Introduction") has no corpus text to use,
 * and a chip naming a text must never be translated away from it.
 */
export interface StepOffer {
	href: string;
	label?: string;
	labelKey?: string;
	/** The full accessible name, when there is corpus text for one. */
	title?: string;
}

export interface RouteStep {
	href: string;
	/** The step's own name, in the corpus's language. Never an interface string. */
	label: string;
	offers: StepOffer[];
}

export interface LearningRoute {
	key: RouteKey;
	/**
	 * The address in this corpus that states this ordering, rendered as the
	 * route's citation. A route with no such address does not belong here.
	 */
	source: string;
	steps: RouteStep[];
}

/**
 * THE ORDER OF THE ROUTES ON THE PAGE, which is itself a claim and is made
 * the same way: the Catechism's own plan first, because CCC 13 is the only
 * one of the four orders below that the Church states as a plan for
 * catechesis rather than as the shape of one work.
 */
export const ROUTE_ORDER: readonly RouteKey[] = ['pillars', 'gospels', 'council', 'social'];

/**
 * Which prayer each pillar IS, from the Catechism's own sentence naming them:
 * "the baptismal profession of faith (the Creed), the sacraments of faith, the
 * life of faith (the Commandments), and the prayer of the believer (the Lord's
 * Prayer)" — CCC 13. Two of the four pillars are texts this corpus holds under
 * `/preces`, so the route can end where the Catechism says it ends.
 *
 * Keyed by the part's own ordinal, never by its index: a tree whose first
 * child is the Prologue would otherwise hand the Creed to Part Two.
 */
const PRAYERS_BY_PART: Readonly<Record<number, readonly string[]>> = {
	1: ['apostles-creed', 'nicene-creed'],
	4: ['our-father']
};

/**
 * The Catechism's four parts, each offering both works and the prayers it is.
 *
 * `catechismRowLinks` does the addressing, which is the point of using it: a
 * part is a chapter-level page opened at its own first paragraph, and 65 of
 * the Catechism index's rows pointed at addresses the corpus does not carry
 * on the day that was worked out by hand instead (`catechismRows.ts`).
 *
 * `tree` is the Catechism's outline, or the Compendium's for the four
 * languages that have no Catechism — both number their parts one to four over
 * the same four subjects, which is the whole reason this route exists.
 */
export function pillarsRoute(opts: {
	tree: StructureNode[];
	treeWork: IndexWork;
	lang: string;
	columns: readonly IndexWork[];
	pairs: Map<StructureNode, StructureNode>;
	labels: RowLabels;
	/** A prayer's own title and address, or nothing when this edition lacks it
	 *  — not every prayer is in every edition (`prayerExists`). */
	prayer: (slug: string) => { href: string; label: string } | undefined;
}): LearningRoute {
	const steps: RouteStep[] = [];
	for (const node of opts.tree) {
		// The Prologue is a top-level node too, and it is not a pillar.
		if (node.kind !== 'part') continue;
		const links = catechismRowLinks(node, {
			tree: opts.treeWork,
			lang: opts.lang,
			columns: opts.columns,
			pairs: opts.pairs,
			labels: opts.labels
		});
		const own = links[opts.columns.indexOf(opts.treeWork)];
		const href = own?.href ?? links.find((link) => link?.href)?.href;
		if (!href) continue;

		const offers: StepOffer[] = [];
		for (const [i, link] of links.entries()) {
			// The tree's own work is the step itself, not an offer beside it.
			if (!link?.href || opts.columns[i] === opts.treeWork) continue;
			offers.push({ href: link.href, label: link.range, title: link.title });
		}
		for (const slug of PRAYERS_BY_PART[node.n ?? 0] ?? []) {
			const found = opts.prayer(slug);
			if (found) offers.push({ href: found.href, label: found.label, title: found.label });
		}

		steps.push({ href, label: node.title, offers });
	}
	return { key: 'pillars', source: hrefFor({ kind: 'ccc', n: 13 }), steps };
}

/**
 * The Gospels and Acts, IN THE CANON'S ORDER AND NOT IN ANY OTHER.
 *
 * Which Gospel a beginner should read first is a live opinion — Mark for its
 * length, Luke for its narrative, John for its theology — and this route takes
 * none of them: `BOOK_GROUPS` is the canonical partition, and the two groups
 * concatenated give Matthew, Mark, Luke, John, Acts in the order every
 * Catholic Bible prints them.
 *
 * THE STEP IS THE FIRST CHAPTER AND THE INTRODUCTION IS AN OFFER, which is the
 * right way round even though the introduction reads first: the introduction
 * is not Scripture (`bible.introSource` says so on the page), it exists only
 * in the languages that have one, and a route whose steps vanish in Malagasy
 * is not a route.
 */
export function gospelsRoute(opts: {
	/** The book's name in the reader's own edition, or nothing when that
	 *  edition does not carry it. */
	nameOf: (osis: string) => string | undefined;
	hasIntro: (osis: string) => boolean;
	source: string;
}): LearningRoute {
	const order = BOOK_GROUPS.filter(
		(group) => group.key === 'gospels' || group.key === 'acts'
	).flatMap((group) => group.osis);
	const steps: RouteStep[] = [];
	for (const osis of order) {
		const label = opts.nameOf(osis);
		if (!label) continue;
		steps.push({
			href: hrefFor({ kind: 'bible', osis, chapter: 1 }),
			label,
			offers: opts.hasIntro(osis)
				? [{ href: hrefFor({ kind: 'bible', osis, chapter: 0 }), labelKey: 'bible.introduction' }]
				: []
		});
	}
	return { key: 'gospels', source: opts.source, steps };
}

/**
 * THE COUNCIL'S SIXTEEN DOCUMENTS, RANKED BY THE COUNCIL'S OWN GENRES.
 *
 * This is the whole reason this route can exist without an editorial claim:
 * Vatican II published constitutions, decrees and declarations, and that
 * three-way split is the Council's own statement of weight, carried in the
 * corpus as `document_kind` (`types.ts`). Sorting by it is reporting, not
 * recommending. Within a genre the order is chronological, which is also not
 * ours.
 */
const CONCILIAR_KINDS: readonly string[] = [
	'conciliar-constitution',
	'conciliar-decree',
	'conciliar-declaration'
];

export function councilRoute(opts: {
	documents: readonly DocumentGroup[];
	/** The document's title in the reader's language, and its manifest, or
	 *  nothing when the corpus has no edition of it at all. */
	manifestOf: (group: DocumentGroup) => DocumentManifest | undefined;
	source: string;
}): LearningRoute {
	const rows: { rank: number; date: string; step: RouteStep }[] = [];
	for (const group of opts.documents) {
		const manifest = opts.manifestOf(group);
		if (!manifest) continue;
		const rank = CONCILIAR_KINDS.indexOf(manifest.document_kind);
		if (rank === -1) continue;
		rows.push({
			rank,
			date: manifest.promulgated ?? '',
			step: {
				href: hrefFor({ kind: 'document', slug: group.slug }),
				label: manifest.title,
				offers: []
			}
		});
	}
	rows.sort((a, b) => a.rank - b.rank || a.date.localeCompare(b.date));
	return { key: 'council', source: opts.source, steps: rows.map((row) => row.step) };
}

/**
 * The Compendium of the Social Doctrine's own top-level divisions.
 *
 * The order is the book's, and the book is the route: this is the one work in
 * the corpus that says it is a synthesis to be read through
 * (`/doctrina-socialis`), so naming its parts in sequence adds nothing to what
 * the work already claims about itself.
 */
export function socialRoute(opts: {
	outline: readonly StructureNode[];
	/** Where a heading printed at paragraph `n` is read — the route reuses
	 *  `/doctrina-socialis`'s own resolver rather than a second rule. */
	hrefAt: (n: number) => string | undefined;
	source: string;
}): LearningRoute {
	const steps: RouteStep[] = [];
	for (const node of opts.outline) {
		const at = node.paragraphs[0];
		const href = Number.isFinite(at) ? opts.hrefAt(at as number) : undefined;
		if (!href) continue;
		steps.push({ href, label: node.title, offers: [] });
	}
	return { key: 'social', source: opts.source, steps };
}
