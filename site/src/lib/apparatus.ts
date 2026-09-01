/**
 * The two things on this site that are ours, in the form the edge can serve.
 *
 * `corpus-routes.json` says which addresses exist and `route-titles.json` says
 * what each is called. Both are facts about someone else's work. This third
 * table carries what this project actually produced: the editorial description
 * of each magisterial document, and the cross-reference apparatus — which
 * paragraphs of the Catechism cite a chapter of Scripture, which documents cite
 * a paragraph, which Compendium question condenses which paragraphs.
 *
 * THAT DISTINCTION IS WHY THIS FILE MAY DO WHAT THE OTHER TWO MAY NOT.
 * `wrangler.jsonc` says the worker "is not an application server and never
 * reads or transforms corpus text", and that still holds: a description is
 * prose written HERE by reading a document, and an apparatus entry is a pair of
 * addresses. Neither is a paragraph, an answer or a verse, and none of those
 * may enter this file any more than they may enter `route-titles.json`.
 *
 * A THIRD FILE AND A THIRD PROMISE, on the same reasoning that split the first
 * two: this one is the largest and the least critical. Losing
 * `corpus-routes.json` costs the address; losing `route-titles.json` costs the
 * name; losing this costs a description and some links, on a page that still
 * resolves, still titles itself and still says what it is. The severities are
 * different, so the failures are kept separable.
 *
 * The links are stored as bare numbers and slugs, never as rendered names,
 * because `route-titles.json` already holds every name this needs and storing
 * them twice is how two tables come to disagree.
 */

import type { Address } from './address.ts';
import type { Crumb, RouteTitles } from './shell-head.ts';

/** Bumped when the shape changes, so a worker isolate holding an older file
 *  can decline it rather than read undefined fields. */
export const APPARATUS_VERSION = 1;

/** The imprint of one work, for the structured data. Every field is read off
 *  the corpus manifest of the edition a crawler is actually served, and a
 *  field the manifest leaves empty is `null` rather than invented. */
export interface WorkImprint {
	name: string;
	/** The party that published the TEXT. Never this site. */
	publisher: string | null;
	/** The rights notice as the publisher words it. */
	notice: string | null;
	/** Where that publisher publishes it — the URL to cite for the words. */
	source: string | null;
	/**
	 * `copyright.status` off the served edition's manifest.
	 *
	 * Added 2026-09-01 with the first work kind whose every edition is public
	 * domain. `assertApparatus` refuses a kind with "no rights position at
	 * all", which until then meant a publisher or a notice — and a public
	 * domain work has neither by definition, so the check could not tell a
	 * kind that states its rights from one that forgot to. Saying "public
	 * domain" IS a rights position, and it is the one the commentary has.
	 *
	 * OPTIONAL because this type declares the READER's copy of a file that is
	 * already deployed: an `apparatus.json` built before this field existed
	 * carries no `rights`, and the edge has to read it without throwing until
	 * the next deploy replaces it. Every file the current builder writes has
	 * one.
	 */
	rights?: string | null;
}

export interface Apparatus {
	version: number;
	/** Work kind (`ccc`, `bible`, …) -> who published the text there. */
	works: Record<string, WorkImprint>;
	/** Document slug -> the description written by reading that document. */
	descriptions: Record<string, string>;
	/** Document slug -> `[author, promulgated, source]`, for the work node of a
	 *  document that has its own imprint rather than its collection's. */
	imprint: Record<string, [string, string, string]>;
	/** `{osis}.{chapter}` -> what cites that chapter. */
	bible: Record<string, { ccc?: number[]; docs?: string[] }>;
	/** Catechism paragraph -> what it cites, and what condenses it. */
	ccc: Record<string, { bible?: string[]; docs?: string[]; comp?: number[] }>;
	/** Compendium question -> the Catechism spans it condenses. */
	compendium: Record<string, [number, number][]>;
	/** Document slug -> the chapters of Scripture that document cites. The one
	 *  apparatus a document page has: it is a whole work rather than a unit of
	 *  one, so it has no neighbours and, without this, one link. */
	docs: Record<string, { bible?: string[] }>;
}

/**
 * How many apparatus links one page offers, PER KIND OF LINK.
 *
 * A cap rather than everything: Genesis 1 is cited by ninety-odd paragraphs,
 * and a `<noscript>` listing all of them would be longer than the page it sits
 * on. The point of these links is that the corpus has a link graph at all — a
 * crawler needs a path onward, not the whole index, which is what
 * `sitemap.xml` is for.
 *
 * PER KIND AND NOT A SINGLE TOTAL, which is how this was first written and was
 * wrong in a way only the output showed: filling one budget in source order
 * gave Genesis 1 eight Catechism paragraphs and pushed out every document that
 * cites it, so the page linked into one work and not the other. A budget per
 * kind cannot starve a kind.
 *
 * EXPORTED SO THE BUILD STORES EXACTLY THIS MANY. It did not, for as long as
 * both numbers existed: `apparatus.mjs` capped at 8 and this took 4, so half of
 * every list in a 338 KB table was parsed at the edge and never rendered. A cap
 * that is read in one place and written in another is a cap that drifts.
 */
export const PER_KIND = 4;

/** The first `n` of a list, or all of it. */
function take<T>(list: readonly T[] | undefined, n: number): T[] {
	return (list ?? []).slice(0, n);
}

/** `{osis}.{chapter}` — the key the build writes and the only spelling of it. */
function chapterKey(osis: string, chapter: number): string {
	return `${osis}.${chapter}`;
}

/**
 * The apparatus links for one address, named from the titles table.
 *
 * Returns `[]` for every address kind whose apparatus is empty or absent, which
 * is a real answer: `shell-head.ts` appends these to the structural links it
 * builds anyway, so a missing table costs the cross-references and keeps the
 * parent and the neighbours.
 */
export function relatedLinks(
	address: Address,
	apparatus: Apparatus | undefined,
	titles: RouteTitles
): Crumb[] {
	if (!apparatus) return [];
	const links: Crumb[] = [];

	switch (address.kind) {
		case 'bible': {
			const entry = apparatus.bible[chapterKey(address.osis, address.chapter)];
			if (!entry) break;
			for (const n of take(entry.ccc, PER_KIND)) links.push(cccLink(n));
			for (const slug of take(entry.docs, PER_KIND)) {
				const link = documentLink(slug, titles);
				if (link) links.push(link);
			}
			break;
		}

		case 'ccc': {
			const entry = apparatus.ccc[String(address.n)];
			if (!entry) break;
			for (const key of take(entry.bible, PER_KIND)) {
				const link = bibleLink(key, titles);
				if (link) links.push(link);
			}
			for (const q of take(entry.comp, PER_KIND)) {
				links.push({ name: `Compendium ${q}`, href: `/catechismus/compendium/${q}` });
			}
			for (const slug of take(entry.docs, PER_KIND)) {
				const link = documentLink(slug, titles);
				if (link) links.push(link);
			}
			break;
		}

		case 'compendium': {
			// The first paragraph of each span, not every paragraph in it: a
			// question condensing 1-25 would otherwise spend the whole budget on
			// one span and offer nothing else.
			for (const [from] of take(apparatus.compendium[String(address.n)], PER_KIND)) {
				links.push(cccLink(from));
			}
			break;
		}

		case 'document': {
			for (const key of take(apparatus.docs[address.slug]?.bible, PER_KIND)) {
				const link = bibleLink(key, titles);
				if (link) links.push(link);
			}
			break;
		}
	}

	return links;
}

function cccLink(n: number): Crumb {
	return { name: `CCC ${n}`, href: `/catechismus/${n}` };
}

/** `gen.1` -> `Genesis 1`, or nothing where the titles table has no such book —
 *  which is a table disagreement rather than a missing chapter, so it is
 *  dropped rather than linked under its OSIS id. */
function bibleLink(key: string, titles: RouteTitles): Crumb | undefined {
	const split = key.lastIndexOf('.');
	if (split < 0) return undefined;
	const osis = key.slice(0, split);
	const chapter = Number(key.slice(split + 1));
	const book = titles.books[osis];
	if (!book || !Number.isFinite(chapter)) return undefined;
	return { name: `${book} ${chapter}`, href: `/scriptura/${osis}/${chapter}` };
}

function documentLink(slug: string, titles: RouteTitles): Crumb | undefined {
	const name = titles.documents[slug]?.[0];
	return name ? { name, href: `/documenta/${slug}` } : undefined;
}
