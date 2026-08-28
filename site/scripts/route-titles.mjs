/**
 * Names for every canonical address, for the edge worker's `<head>`.
 *
 * `corpus-routes.json` answers "is this an address?" and deliberately carries
 * no words at all. This file answers "what is it called?", which is the other
 * half of what a consumer that does not run JavaScript needs: `ssr = false`
 * means one document is served for all ~5,800 addresses, so without this every
 * one of them is titled `Glossa Catholica` and described by the same sentence
 * (docs/decisions.md §The site, "What a crawler that does not render is told").
 *
 * WHAT MAY GO IN HERE IS A NAME, NEVER A TEXT. `wrangler.jsonc` says the edge
 * worker "is not an application server and never reads or transforms corpus
 * text", and that line is worth keeping sharp. A book name, a chapter heading,
 * a document's title and its author are the imprint of a work — the same class
 * of fact `sitemap.xml` already publishes an address for. A Catechism
 * paragraph, a Compendium answer or a verse is the text itself and stays out,
 * whatever it would do for a search snippet.
 *
 * ONE LANGUAGE, and it is the sitemap's. A crawler arrives with no stored
 * preference and is served English, or Latin where the corpus has no English
 * — `SITEMAP_LANGS`, which is `CONTENT_LANG_FALLBACK.en`. Reading names in any
 * other language would title a page in a language its own text is not in.
 *
 * The headings are normalized by `displayTitle` — the site's own function, not
 * a second copy of it. The sources shout (`PART ONE: THE PROFESSION OF FAITH`,
 * `THE EXISTENCE OF GOD (THREE ARTICLES)`) and print an ordinal label the
 * heading does not need twice; a `<title>` in caps reads as spam in a result
 * page, and one that repeats its own number reads as a bug.
 */

import { summaPartSlug } from '../src/lib/address.ts';
import { summaQuestionLabel } from '../src/lib/summa-titles.ts';
import { SITE_NAME, headFor } from '../src/lib/shell-head.ts';
import { displayTitle } from '../src/lib/titles.ts';
import { SITEMAP_LANGS } from './lastmod.mjs';

/** Bumped when the shape changes, so a worker isolate holding an older file
 *  can decline it rather than read undefined fields. */
export const ROUTE_TITLES_VERSION = 1;

/**
 * The language a crawler's copy of these names is read from.
 *
 * `crawlerEditions` in `lastmod.mjs` makes the same choice about the same
 * addresses; this is that rule over a set of language tags rather than over a
 * map of fingerprints. The fall-through is the same too, and exists for the
 * same seven documents: an edition in neither English nor Latin is still a
 * real page showing real text, so it gets a real name rather than none.
 *
 * @param {readonly string[]} available
 * @returns {string | undefined}
 */
export function servedLang(available) {
	return SITEMAP_LANGS.find((lang) => available.includes(lang)) ?? [...available].sort()[0];
}

/**
 * `kind`s whose heading names a stretch of text a reader might arrive in.
 *
 * `in-brief` is excluded: every one of them is titled "IN BRIEF", so it names
 * nothing, and it is the narrowest span around many paragraphs — it would win
 * the innermost-wins rule below and title 500 addresses identically.
 */
const TITLED_KINDS = new Set(['prologue', 'part', 'section', 'chapter', 'article', 'sub']);

/**
 * Every titled node's paragraph span, as `[from, to, title]`.
 *
 * Flat and unordered by design: `shell-head.ts` picks the NARROWEST span
 * containing an address, which is the most specific heading true of it, and a
 * flat array needs no agreement about tree shape between the two ends.
 *
 * @param {import('../src/lib/types').StructureNode[]} nodes
 * @param {string} lang
 */
function titledSpans(nodes, lang) {
	/** @type {[number, number, string][]} */
	const spans = [];
	/** @param {import('../src/lib/types').StructureNode[]} items */
	function walk(items) {
		for (const node of items) {
			const [from, to] = node.paragraphs ?? [];
			// `typeof` rather than `Number.isFinite` alone: the span is typed
			// `[number | null, number | null]`, and only a typeof guard narrows
			// the null away for the tuple push below.
			if (
				TITLED_KINDS.has(node.kind) &&
				typeof from === 'number' &&
				typeof to === 'number' &&
				Number.isFinite(from) &&
				Number.isFinite(to)
			) {
				const { title } = displayTitle(node, lang);
				if (title) spans.push([from, to, title]);
			}
			walk(node.children ?? []);
		}
	}
	walk(nodes);
	return spans;
}

/**
 * Names for everything `sitemapPaths` enumerates.
 *
 * @param {object} input
 * @param {Record<string, any>} input.manifests workId -> manifest.json
 * @param {Record<string, any>} input.bibleIndex workId -> { books }
 * @param {Record<string, any>} input.cccIndex lang -> { structure }
 * @param {Record<string, any>} input.compendiumIndex lang -> { structure }
 * @param {Record<string, any>} input.summaIndex lang -> { questions }
 * @param {Record<string, any>} input.prayerIndex lang -> { prayers }
 */
export function buildRouteTitles({
	manifests,
	bibleIndex,
	cccIndex,
	compendiumIndex,
	summaIndex,
	prayerIndex
}) {
	return {
		version: ROUTE_TITLES_VERSION,
		books: bookNames(manifests, bibleIndex),
		cccSpans: structureSpans(cccIndex),
		compendiumSpans: structureSpans(compendiumIndex),
		documents: documentNames(manifests),
		prayers: prayerNames(prayerIndex),
		summa: summaNames(summaIndex)
	};
}

/**
 * OSIS -> the book's name.
 *
 * Where the served language has more than one edition, the id that sorts
 * first wins, and for English that is deliberate rather than incidental:
 * `bible.cpdv.en` prints `1 Samuel` where `bible.douay-rheims.en` prints
 * `1 Kings (1 Samuel)`. The parenthetical is Challoner's edition telling a
 * modern reader which book this is under the Vulgate's numbering (see
 * `WORK_CONFIGS` in refs-grammar.ts, which exists for the same collision) —
 * a statement about a naming tradition, not the name of the book, and not
 * what a page should be titled.
 *
 * @param {Record<string, any>} manifests
 * @param {Record<string, any>} bibleIndex
 */
function bookNames(manifests, bibleIndex) {
	const ids = Object.keys(bibleIndex);
	const lang = servedLang(ids.map((id) => manifests[id]?.language).filter(Boolean));
	const chosen = ids.filter((id) => manifests[id]?.language === lang).sort()[0];
	/** @type {Record<string, string>} */
	const books = {};
	for (const book of bibleIndex[chosen]?.books ?? []) books[book.osis] = book.name;
	return books;
}

/** @param {Record<string, any>} index lang -> { structure } */
function structureSpans(index) {
	const lang = servedLang(Object.keys(index));
	return lang ? titledSpans(index[lang].structure, lang) : [];
}

/**
 * Slug -> `[title, author, year]`, the three facts a document's masthead
 * prints. `pontiff_or_council` and `promulgated` are absent on nothing in the
 * corpus today, but a `''` costs one byte and spares the edge a branch.
 *
 * @param {Record<string, any>} manifests
 */
function documentNames(manifests) {
	/** @type {Map<string, string[]>} */
	const bySlug = new Map();
	for (const [id, manifest] of Object.entries(manifests)) {
		if (manifest.type !== 'document') continue;
		const slug = /^[a-z0-9-]+\.([a-z0-9-]+)\.[a-z]{2,3}(-[a-z]{2,3})?$/.exec(id)?.[1];
		if (!slug) continue;
		bySlug.set(slug, [...(bySlug.get(slug) ?? []), id]);
	}
	/** @type {Record<string, [string, string, string]>} */
	const documents = {};
	for (const [slug, ids] of [...bySlug].sort(([a], [b]) => a.localeCompare(b))) {
		const lang = servedLang(ids.map((id) => manifests[id].language));
		const id = ids.filter((candidate) => manifests[candidate].language === lang).sort()[0];
		const manifest = manifests[id];
		documents[slug] = [
			manifest.short_title || manifest.title || slug,
			manifest.pontiff_or_council || '',
			String(manifest.promulgated || '').slice(0, 4)
		];
	}
	return documents;
}

/** @param {Record<string, any>} prayerIndex lang -> { prayers } */
function prayerNames(prayerIndex) {
	const lang = servedLang(Object.keys(prayerIndex));
	/** @type {Record<string, string>} */
	const prayers = {};
	for (const prayer of (lang && prayerIndex[lang].prayers) || []) {
		prayers[prayer.slug] = prayer.title;
	}
	return prayers;
}

/**
 * Part slug -> question number -> title.
 *
 * FILLED IN LANGUAGE ORDER RATHER THAN FROM ONE EDITION, because the Summa's
 * two editions cover different parts: the Corpus Thomisticum publishes no
 * Supplementum, so `/summa/suppl/77` exists in English alone (CLAUDE.md,
 * "The Summa is the exception to two rules at once"). Taking the served
 * language and stopping would leave 99 addresses unnamed the day Latin sorts
 * first for some reason; filling forward names each question from the first
 * edition that has it, which is what the page does per address anyway.
 *
 * @param {Record<string, any>} summaIndex lang -> { questions }
 */
function summaNames(summaIndex) {
	const langs = [
		...SITEMAP_LANGS.filter((lang) => lang in summaIndex),
		...Object.keys(summaIndex).sort()
	];
	/** @type {Record<string, Record<string, string>>} */
	const summa = {};
	for (const lang of langs) {
		for (const question of summaIndex[lang]?.questions ?? []) {
			const part = summaPartSlug(question.part);
			(summa[part] ??= {})[question.n] ??= summaQuestionLabel(question.title);
		}
	}
	return summa;
}

/**
 * Throw unless every address the sitemap advertises has a name of its own.
 *
 * The counterpart to `assertCanonical` in `sitemap.mjs`, and it lives at the
 * same point for the same reason: a name missing at the edge is invisible
 * everywhere a person looks. The page titles itself at hydration, so a browser
 * shows the right thing whatever this file holds; only the consumers that do
 * not render — every crawler that is not Google, and every unfurler — see the
 * gap, and none of them reports it. So it is checked on every build, where a
 * new work kind reaching production without a rule in `shell-head.ts` fails
 * the sync rather than shipping 600 pages called `Glossa Catholica`.
 *
 * @param {string[]} paths from `sitemapPaths`
 * @param {import('../src/lib/route-manifest.ts').RouteManifest} manifest
 * @param {import('../src/lib/shell-head.ts').RouteTitles} titles
 */
export function assertNamed(paths, manifest, titles) {
	/** @type {string[]} */
	const unnamed = [];
	/** @type {Map<string, string[]>} */
	const byTitle = new Map();
	for (const pathname of paths) {
		const head = headFor(pathname, manifest, titles);
		if (!head || (pathname !== '/' && head.title === SITE_NAME)) {
			unnamed.push(pathname);
			continue;
		}
		byTitle.set(head.title, [...(byTitle.get(head.title) ?? []), pathname]);
	}
	if (unnamed.length) {
		throw new Error(
			`route-titles: ${unnamed.length} address(es) with no name of their own: ` +
				`${unnamed.slice(0, 5).join(', ')}`
		);
	}
	const collisions = [...byTitle.values()].filter((group) => group.length > 1);
	if (collisions.length) {
		throw new Error(
			`route-titles: ${collisions.length} title(s) shared by more than one address: ` +
				`${collisions
					.slice(0, 3)
					.map((group) => group.join(' = '))
					.join('; ')}`
		);
	}
}
