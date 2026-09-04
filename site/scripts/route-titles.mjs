/**
 * Names for every canonical address, for the edge worker's `<head>`.
 *
 * `corpus-routes.json` answers "is this an address?" and deliberately carries
 * no words at all. This file answers "what is it called?", which is the other
 * half of what a consumer that does not run JavaScript needs: `ssr = false`
 * means one document is served for all ~5,800 addresses, so without this every
 * one of them is titled `Glossa Catholica` and described by the same sentence
 * (site/docs/edge.md, "What a crawler that does not render is told").
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
import { CHROME_PATHS, parseChromePath } from '../src/lib/route-manifest.ts';
import { UI_LANGS } from '../src/lib/ui-langs.ts';
import { summaQuestionLabel } from '../src/lib/summa-titles.ts';
import { SITE_NAME, headFor } from '../src/lib/shell-head.ts';
import { displayDocumentTitle, displayTitle } from '../src/lib/titles.ts';
import { SITEMAP_LANGS } from './lastmod.mjs';

/** Bumped when the shape changes, so a worker isolate holding an older file
 *  can decline it rather than read undefined fields. */
export const ROUTE_TITLES_VERSION = 1;

/** For the cluster exemption in `assertNamed`. */
const CHROME_PATH_STRINGS = new Set(/** @type {readonly string[]} */ (CHROME_PATHS));

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
 * The same thing for a DOCUMENT's outline, which is flat rather than a tree.
 *
 * `structure.json` for a document is a list of `{ level, title, before }` rows
 * in reading order (docs/corpus-schema.md §Documents): `before` is the
 * paragraph the heading is printed above, and a heading's reach is everything
 * up to the next heading at its own level or shallower. So the spans are
 * COMPUTED here, where `titledSpans` reads them off a tree that already
 * carries them.
 *
 * Two rows are dropped and one is repaired, each for something the corpus
 * really contains:
 *
 * - **A row with no `before` anchors nothing.** The Compendium of the Social
 *   Doctrine ends in an index of references whose 90 headings are book names,
 *   printed after the last numbered paragraph; they name no stretch of text a
 *   reader can arrive in.
 * - **Two headings may share one anchor**, because the source prints a part
 *   divider and the chapter opening under it on the same page — and so may two
 *   consecutive rows at the same level, which makes the first one's span end
 *   before it starts. `Math.max` keeps it to the single paragraph it opens
 *   rather than emitting an inverted span that matches nothing.
 *
 * @param {{ level: number, title: string, before: number | null }[]} nodes
 * @param {number} last the work's highest paragraph number
 * @param {string} lang
 * @returns {[number, number, string][]}
 */
function documentSpans(nodes, last, lang) {
	/** @type {[number, number, string][]} */
	const spans = [];
	for (const [i, node] of nodes.entries()) {
		const from = node.before;
		if (typeof from !== 'number' || !Number.isFinite(from)) continue;
		const next = nodes
			.slice(i + 1)
			.find((other) => other.level <= node.level && typeof other.before === 'number');
		const to = Math.max(from, (next ? Number(next.before) : last + 1) - 1);
		const { title } = displayDocumentTitle(node.title, lang);
		if (title) spans.push([from, to, title]);
	}
	return spans;
}

/**
 * Chapter anchor -> the name of the division that opens there.
 *
 * READ OFF THE NODES THAT PRODUCED THE ANCHORS. `sync-corpus.mjs` derives the
 * anchor set from the rows carrying a `label` (`CHAPTER ONE`, `CAPITOLO
 * PRIMO`), plus §1 for the introduction, which carries none; this takes the
 * name from the same row. Choosing by span width instead would title
 * `/doctrina-socialis/caput/20` `Part One` — the unnamed divider the source
 * prints on its own page, which opens at the same paragraph and outruns the
 * chapter by three chapters.
 *
 * `clean` runs on the stored title BEFORE it is displayed, which is the only
 * order that works for a caller that has something to remove: `displayTitle`
 * rewrites a heading's case only when it is ALL-CAPS, and the Code's printed
 * `(Cann. 35 - 93)` is not — so stripping afterwards leaves the name shouting
 * while its neighbours are cased. See `canonLawHeadingParts`.
 *
 * @param {{ level: number, title: string, before: number | null, label?: string }[]} nodes
 * @param {readonly number[]} starts
 * @param {string} lang
 * @param {(title: string) => string} [clean]
 */
function documentChapterNames(nodes, starts, lang, clean) {
	/** @type {Record<string, string>} */
	const names = {};
	for (const start of starts) {
		const here = nodes.filter((node) => node.before === start);
		const node = here.find((candidate) => candidate.label) ?? here[0];
		if (!node) continue;
		const { title } = displayDocumentTitle(clean ? clean(node.title) : node.title, lang);
		if (title) names[start] = title;
	}
	return names;
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
 * @param {{ lang: string, work: string, sections: { n: number }[], structure: any[] }[]} input.socialDoctrineEditions
 * @param {readonly number[]} input.socialDoctrineChapterStarts
 * @param {{ lang: string, work: string, sections: { n: number }[], structure: any[] }[]} [input.canonLawEditions]
 * @param {readonly number[]} [input.canonLawUnitStarts]
 * @param {Record<string, Record<string, string>>} input.dictionaries lang -> strings
 */
export function buildRouteTitles({
	manifests,
	bibleIndex,
	cccIndex,
	compendiumIndex,
	summaIndex,
	prayerIndex,
	socialDoctrineEditions,
	socialDoctrineChapterStarts,
	canonLawEditions,
	canonLawUnitStarts,
	dictionaries
}) {
	const csdc = servedDocumentEdition(socialDoctrineEditions);
	const cic = servedDocumentEdition(canonLawEditions ?? []);
	return {
		version: ROUTE_TITLES_VERSION,
		chrome: chromeNames(dictionaries),
		books: bookNames(manifests, bibleIndex),
		cccSpans: structureSpans(cccIndex),
		compendiumSpans: structureSpans(compendiumIndex),
		socialDoctrineSpans: csdc
			? documentSpans(csdc.structure, Math.max(...csdc.sections.map((s) => s.n)), csdc.lang)
			: [],
		socialDoctrineChapterNames: csdc
			? documentChapterNames(csdc.structure, socialDoctrineChapterStarts, csdc.lang)
			: {},
		canonLawSpans: cic
			? documentSpans(cic.structure, Math.max(...cic.sections.map((s) => s.n)), cic.lang)
			: [],
		// The canon range the source prints inside a heading is dropped for
		// the same reason `canonLawTitleText` drops it on the page: five of
		// the seven editions print it, the line below the title states it
		// again, and a `<title>` is the one place there is no room for it
		// twice. Kept in step with that function by hand — this file runs
		// under plain node and cannot import it — INCLUDING the order, which
		// is why it is a `clean` argument and no longer a pass afterwards.
		canonLawTitleNames: cic
			? documentChapterNames(
					cic.structure,
					canonLawUnitStarts ?? [],
					cic.lang,
					(title) => title.replace(/\s*\((?=[^()]*\d)[^()]*\)\s*$/u, '').trim() || title
				)
			: {},
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

/**
 * The edition of a multi-language DOCUMENT a crawler is served.
 *
 * `servedEdition` above answers the same question from a manifest map; this
 * answers it from the records `sync-corpus.mjs` already holds, which carry the
 * language and the structure together. Same rule, same fall-through: an
 * edition in neither English nor Latin is still a real page.
 *
 * @template {{ lang: string, work: string }} T
 * @param {readonly T[]} editions
 * @returns {T | undefined}
 */
function servedDocumentEdition(editions) {
	const lang = servedLang(editions.map((edition) => edition.lang));
	return editions
		.filter((edition) => edition.lang === lang)
		.sort((a, b) => a.work.localeCompare(b.work))[0];
}

/** @param {Record<string, any>} index lang -> { structure } */
function structureSpans(index) {
	const lang = servedLang(Object.keys(index));
	return lang ? titledSpans(index[lang].structure, lang) : [];
}

/**
 * Document slug -> the work ids that are editions of it, slug order.
 *
 * Exported because `apparatus.mjs` needs exactly this grouping and the id
 * pattern is the kind of thing that drifts the moment it is written twice.
 *
 * @param {Record<string, any>} manifests
 */
export function documentSlugIds(manifests) {
	/** @type {Map<string, string[]>} */
	const bySlug = new Map();
	for (const [id, manifest] of Object.entries(manifests)) {
		if (manifest.type !== 'document') continue;
		const slug = /^[a-z0-9-]+\.([a-z0-9-]+)\.[a-z]{2,3}(-[a-z]{2,3})?$/.exec(id)?.[1];
		if (!slug) continue;
		bySlug.set(slug, [...(bySlug.get(slug) ?? []), id]);
	}
	return new Map([...bySlug].sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * The edition of a document a crawler is served — the same choice
 * `documentNames` makes about the same slug, so the name, the description and
 * the imprint on one page all come off one manifest.
 *
 * @param {Record<string, any>} manifests
 * @param {string[]} ids
 */
export function servedEdition(manifests, ids) {
	const lang = servedLang(ids.map((id) => manifests[id].language));
	return ids.filter((candidate) => manifests[candidate].language === lang).sort()[0];
}

/**
 * Slug -> `[title, author, year]`, the three facts a document's masthead
 * prints. `pontiff_or_council` and `promulgated` are absent on nothing in the
 * corpus today, but a `''` costs one byte and spares the edge a branch.
 *
 * @param {Record<string, any>} manifests
 */
function documentNames(manifests) {
	const bySlug = documentSlugIds(manifests);
	/** @type {Record<string, [string, string, string]>} */
	const documents = {};
	for (const [slug, ids] of bySlug) {
		const manifest = manifests[servedEdition(manifests, ids)];
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
 * Supplementum, so `/doctores/summa/suppl/77` exists in English alone (CLAUDE.md,
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
		// A chrome page is one member of an `hreflang` cluster whose members
		// SHARE a title on purpose — they are the same page in fourteen
		// languages, the one case where two addresses answering to one name is
		// correct rather than a defect. So distinctness is checked WITHIN a
		// language and not across the cluster: `/pt`'s seven titles must differ
		// from each other, and are free to equal `/en`'s. Every reading address
		// is in one bucket together, where a shared title is what it always was.
		const chrome = parseChromePath(pathname);
		const inCluster = chrome || CHROME_PATH_STRINGS.has(pathname);
		const bucket = inCluster ? `chrome:${chrome ? chrome.lang : 'x-default'}` : 'corpus';
		// The home page IS the site's name, in every language it is offered in.
		const isHome = pathname === '/' || (chrome && chrome.path === '/');
		if (!head || (!isHome && head.title === SITE_NAME)) {
			unnamed.push(pathname);
			continue;
		}
		const key = `${bucket}\u0000${head.title}`;
		byTitle.set(key, [...(byTitle.get(key) ?? []), pathname]);
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

/**
 * The keys each chrome page is named and described by, in `CHROME_PATHS` order.
 *
 * READ OUT OF THE DICTIONARIES RATHER THAN WRITTEN HERE, which is the whole
 * reason this table can exist in fourteen languages at all: every string below
 * is one a translator has already written for the page itself, so the head a
 * Portuguese searcher matches on is the same sentence the page shows them. The
 * alternative — a `meta.description` key per language — is thirteen new
 * sentences that need thirteen speakers, and CLAUDE.md's Malagasy note is what
 * happens when that is guessed at instead.
 *
 * `/` has no `description` key because it has no tagline. So it is composed
 * from the names of five works, which are themselves translated, and which is
 * what a reader searching for any one of them would type. They were the home
 * page's own section headings until 2026-09-04, when the page became the
 * liturgical day and five doors; the list stayed as it was, because what a
 * searcher types is the name of a work and not the name of a door.
 */
/** @type {Record<string, { title: string; description?: string }>} */
const CHROME_KEYS = {
	'/': { title: 'home.title' },
	'/bibliotheca': { title: 'nav.library', description: 'library.landing.tagline' },
	'/scriptura': { title: 'bible.landing.title', description: 'bible.landing.tagline' },
	'/catechismus': { title: 'ccc.landing.title', description: 'ccc.landing.tagline' },
	'/documenta': { title: 'nav.magisterium', description: 'document.library.tagline' },
	'/doctrina-socialis': {
		title: 'socialDoctrine.landing.title',
		description: 'socialDoctrine.landing.tagline'
	},
	'/ius-canonicum': {
		title: 'canonLaw.landing.title',
		description: 'canonLaw.landing.tagline'
	},
	'/doctores': { title: 'doctores.landing.title', description: 'doctores.landing.tagline' },
	'/doctores/summa': { title: 'summa.landing.title', description: 'summa.landing.tagline' },
	'/preces': { title: 'prayers.landing.title', description: 'prayers.landing.tagline' },
	'/colophon': { title: 'colophon.title', description: 'colophon.lede' }
};

/** Five works the site holds, for the one description with no key. */
const HOME_SECTION_KEYS = [
	'bible.landing.title',
	'ccc.landing.title',
	'doctores.landing.title',
	'nav.magisterium',
	'prayers.landing.title'
];

/**
 * Strip the markup a tagline may carry.
 *
 * `ccc.landing.tagline` sets two words in `<strong>` in every language, because
 * on the page it introduces two works and names them. A `<meta>` content
 * attribute is text, and a description reading `<strong>The Catechism</strong>`
 * is what a search result would print.
 */
/** @param {unknown} text */
function plain(text) {
	return String(text)
		.replace(/<[^>]*>/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * lang -> chrome path -> `[title, description]`, for all fourteen.
 *
 * NO FALLBACK TO ENGLISH HERE, unlike `t()` at runtime. A cluster whose
 * Portuguese member is described in English is worse than no cluster: it tells
 * a search engine the page is Portuguese and then shows it English, which is
 * the one thing an `hreflang` set is checked for. A missing key is a build
 * failure instead — `assertNamed` sees it as an unnamed address.
 *
 * @param {Record<string, Record<string, string>>} dictionaries lang -> strings
 */
function chromeNames(dictionaries) {
	/** @type {Record<string, Record<string, [string, string]>>} */
	const chrome = {};
	for (const lang of UI_LANGS) {
		const d = dictionaries[lang];
		if (!d) continue;
		const site = d['home.title'];
		/** @type {Record<string, [string, string]>} */
		const pages = {};
		for (const path of CHROME_PATHS) {
			const keys = CHROME_KEYS[path];
			const name = d[keys.title];
			if (!name) continue;
			const description = keys.description
				? plain(d[keys.description])
				: HOME_SECTION_KEYS.map((key) => plain(d[key]))
						.filter(Boolean)
						.join(' · ');
			if (!description) continue;
			// The home page is titled the site's name alone: it is the one page
			// where "<name> — <site name>" would print the same words twice.
			pages[path] = [path === '/' ? site : `${name} — ${site}`, description];
		}
		chrome[lang] = pages;
	}
	return chrome;
}

/**
 * Every interface dictionary, keyed by language.
 *
 * Dynamic imports because the list is `UI_LANGS` and has changed four times
 * since 2026-08-24; fourteen static imports would be a fifteenth place to
 * update. Each module exports one object named for its own tag
 * (`src/lib/i18n/pt.ts` exports `pt`), and its only import is a type, which
 * Node's loader erases — so nothing here reaches `i18n.svelte.ts` and its
 * store.
 */
export async function readDictionaries() {
	/** @type {Record<string, Record<string, string>>} */
	const dictionaries = {};
	for (const lang of UI_LANGS) {
		const module = await import(`../src/lib/i18n/${lang}.ts`);
		dictionaries[lang] = module[lang];
	}
	return dictionaries;
}
