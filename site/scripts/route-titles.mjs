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
import {
	CALENDAR_IDS,
	CALENDAR_PAGES,
	territoryName
} from '../src/lib/calendar/national/languages.ts';
import { CHROME_PATHS, parseChromePath } from '../src/lib/route-manifest.ts';
import { UI_LANGS } from '../src/lib/ui-langs.ts';
import { summaQuestionLabel } from '../src/lib/summa-titles.ts';
import { SITE_NAME, headFor } from '../src/lib/shell-head.ts';
import { displayDocumentTitle, displayTitle, printedMarker } from '../src/lib/titles.ts';
import { SITEMAP_LANGS } from './lastmod.mjs';

/** Bumped when the shape changes, so a worker isolate holding an older file
 *  can decline it rather than read undefined fields. */
export const ROUTE_TITLES_VERSION = 2;

/** For the cluster exemption in `assertNamed`. */
const CHROME_PATH_STRINGS = new Set(/** @type {readonly string[]} */ (CHROME_PATHS));

/** The one placeholder this file substitutes. See `calendar.national.tagline`
 *  in `src/lib/i18n/en.ts` for what a translation of it owes. */
const PLACEHOLDER = '{name}';

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
 * `clean` is `documentChapterNames`' argument and runs for the same reason and
 * in the same order — see its docblock. A caller passing it to one of the two
 * and not the other gets a work whose division is named one way on its own
 * page and another in the title of every unit inside it.
 *
 * @param {{ level: number, title: string, before: number | null }[]} nodes
 * @param {number} last the work's highest paragraph number
 * @param {string} lang
 * @param {(title: string) => string} [clean]
 * @returns {[number, number, string][]}
 */
function documentSpans(nodes, last, lang, clean) {
	/** @type {[number, number, string][]} */
	const spans = [];
	for (const [i, node] of nodes.entries()) {
		const from = node.before;
		if (typeof from !== 'number' || !Number.isFinite(from)) continue;
		const next = nodes
			.slice(i + 1)
			.find((other) => other.level <= node.level && typeof other.before === 'number');
		const to = Math.max(from, (next ? Number(next.before) : last + 1) - 1);
		const { title } = displayDocumentTitle(clean ? clean(node.title) : node.title, lang);
		if (title) spans.push([from, to, title]);
	}
	return spans;
}

/**
 * The canon range the Code's editions print inside a heading —
 * `MARRIAGE (Cann. 1055 - 1165)`. One definition because two tables strip it
 * and `canonLawTitleText` strips it on the page; a heading that keeps it in
 * one of the three is a division called two different things.
 *
 * The `(?=[^()]*\d)` is what keeps it a range and not any trailing
 * parenthetical: it fires only where the brackets hold a digit.
 *
 * @param {string} title
 * @returns {string}
 */
const stripPrintedRange = (title) =>
	title.replace(/\s*\((?=[^()]*\d)[^()]*\)\s*$/u, '').trim() || title;

/**
 * The list marker a source prints in front of a division's name — `I.`, `a.`,
 * `a)`. `printedMarker` is `titles.ts`'s, so this cannot drift from what
 * `documentHeadingParts` splits off on the page.
 *
 * `displayTitle` splits it by itself, so the CATECHISM's spans need nothing
 * here; a document's outline reaches `displayDocumentTitle`, which by design
 * splits nothing, so the Compendium of the Social Doctrine has to be told.
 *
 * @param {string} title
 * @returns {string}
 */
const stripHeadingMarker = (title) => printedMarker(title)?.rest ?? title;

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
 * @param {readonly string[]} [input.topics] topic slugs, `manifest.topics`
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
	topics,
	dictionaries
}) {
	const csdc = servedDocumentEdition(socialDoctrineEditions);
	const cic = servedDocumentEdition(canonLawEditions ?? []);
	return {
		version: ROUTE_TITLES_VERSION,
		chrome: chromeNames(dictionaries),
		calendars: calendarNames(dictionaries),
		books: bookNames(manifests, bibleIndex),
		cccSpans: structureSpans(cccIndex),
		compendiumSpans: structureSpans(compendiumIndex),
		// 223 of the 246 print a marker (`I. MEANING AND UNITY`, `a. God's
		// dominion`) that the work's own breadcrumb splits off with
		// `documentHeadingParts` — so without this the title of every unit in a
		// division named it one way and the page beside it another.
		socialDoctrineSpans: csdc
			? documentSpans(
					csdc.structure,
					Math.max(...csdc.sections.map((s) => s.n)),
					csdc.lang,
					stripHeadingMarker
				)
			: [],
		socialDoctrineChapterNames: csdc
			? documentChapterNames(
					csdc.structure,
					socialDoctrineChapterStarts,
					csdc.lang,
					stripHeadingMarker
				)
			: {},
		// The canon range the source prints inside a heading is dropped for
		// the same reason `canonLawTitleText` drops it on the page: five of
		// the seven editions print it, the line below the title states it
		// again, and a `<title>` is the one place there is no room for it
		// twice. Kept in step with that function by hand — this file runs
		// under plain node and cannot import it — INCLUDING the order, which
		// is why it is a `clean` argument and no longer a pass afterwards.
		//
		// BOTH TABLES TAKE IT. The unit pages read the second and every canon
		// page reads the FIRST, for the innermost division containing it, so
		// passing it to one alone left 86 of the 287 spans naming a division
		// `MARRIAGE (Cann. 1055 - 1165)` where its own page says `Marriage` —
		// shouting because `displayDocumentTitle` re-cases an ALL-CAPS heading
		// and the `ann` of `Cann.` is what stopped it being one.
		canonLawSpans: cic
			? documentSpans(
					cic.structure,
					Math.max(...cic.sections.map((s) => s.n)),
					cic.lang,
					stripPrintedRange
				)
			: [],
		canonLawTitleNames: cic
			? documentChapterNames(cic.structure, canonLawUnitStarts ?? [], cic.lang, stripPrintedRange)
			: {},
		documents: documentNames(manifests),
		prayers: prayerNames(prayerIndex),
		topics: topicNames(dictionaries, topics ?? []),
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

/**
 * Topic slug -> `[title, question]`, read straight out of the English
 * dictionary.
 *
 * THE ONLY NAMES IN THIS FILE THIS SITE WROTE, and the exception proves the
 * rule the docblock states: what may go in here is a name and never a text,
 * and a topic's title and question are what the page calls itself — the
 * passages under them stay out exactly as a Catechism paragraph does.
 *
 * ENGLISH BECAUSE THE WHOLE FILE IS, not because the strings exist in no other
 * language: they exist in Portuguese too, and in none of the other thirty-five,
 * which is why `/quaestiones` is out of `CHROME_PATHS` altogether.
 *
 * A slug whose strings are missing is LEFT OUT rather than named from itself,
 * so `assertNamed` refuses the build instead of publishing a page titled
 * `associationes-massonicae`.
 *
 * @param {Record<string, Record<string, string>>} dictionaries
 * @param {readonly string[]} slugs
 */
function topicNames(dictionaries, slugs) {
	const english = dictionaries.en ?? {};
	/** @type {Record<string, [string, string]>} */
	const topics = {};
	for (const slug of slugs) {
		const title = plain(english[`quaestiones.${slug}.title`] ?? '');
		const question = plain(english[`quaestiones.${slug}.question`] ?? '');
		if (title && question) topics[slug] = [title, question];
	}
	return topics;
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
	assertSpansDisplayable(titles);
}

/**
 * What a division may NOT be called in a `<title>`, over all four span tables.
 *
 * THE FAILURE THIS EXISTS FOR IS INVISIBLE TO EVERYONE WHO RENDERS. Both
 * producers take an optional cleaning function that exactly one caller passes,
 * and omitting it is silently wrong: `canonLawSpans` went without the one
 * `canonLawTitleNames` had, so 86 of 287 spans named a division
 * `MARRIAGE (Cann. 1055 - 1165)` where its own page said `Marriage`, and the
 * only consumer that could see it was one that never reports back. An optional
 * argument nobody is forced to pass needs a check that does not care which
 * producer a table came from — so this reads the OUTPUT rather than the call.
 *
 * All four shapes are artifacts of the source's typography and never of a
 * name: a heading still shouting is one `normalizeCase` did not recognise
 * (the `ann` of `Cann.` is what stopped it), a trailing parenthetical holding
 * a digit is a range the line below the title states again, a leading marker
 * is an enumerator the page splits off and sets apart, and a spaced hyphen is
 * a dash the source could not encode (`restoreDashes`, titles.ts).
 *
 * @param {import('../src/lib/shell-head.ts').RouteTitles} titles
 */
function assertSpansDisplayable(titles) {
	/** @type {[string, import('../src/lib/shell-head.ts').TitledSpan[]][]} */
	const tables = [
		['cccSpans', titles.cccSpans],
		['compendiumSpans', titles.compendiumSpans],
		['socialDoctrineSpans', titles.socialDoctrineSpans],
		['canonLawSpans', titles.canonLawSpans]
	];
	/** @type {string[]} */
	const bad = [];
	for (const [table, spans] of tables) {
		for (const [, , name] of spans ?? []) {
			const fault =
				name === name.toUpperCase() && /\p{Lu}/u.test(name)
					? 'still ALL-CAPS'
					: /\([^()]*\d[^()]*\)\s*$/u.test(name)
						? 'keeps a printed range'
						: printedMarker(name)
							? 'keeps a printed list marker'
							: /\S - \S/u.test(name)
								? 'keeps a hyphen where the source meant a dash'
								: null;
			if (fault) bad.push(`${table}: ${JSON.stringify(name)} — ${fault}`);
		}
	}
	if (bad.length) {
		throw new Error(
			`route-titles: ${bad.length} span name(s) a page would not print that way; ` +
				`the table is missing the cleaning its work's own display function does — ` +
				`${bad.slice(0, 3).join('; ')}`
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
 * `/` HAD NO `description` KEY BECAUSE IT HAD NO TAGLINE, and it has one since
 * 2026-09-06 — `home.tagline`, written in all 37, which is the condition the
 * key's own comment in `en.ts` set for switching this over. Until then the
 * description was composed from the names of five works: themselves translated,
 * and what a reader searching for any one of them would type. `HOME_SECTION_KEYS`
 * is kept as the FALLBACK rather than deleted, because it is the one description
 * on this table that can be assembled with no sentence of its own — so a
 * dictionary that has not yet caught up to a future rewrite of the tagline gets
 * five work names instead of dropping out of the cluster, which is what a
 * missing description costs here (`chromeNames` has no fallback to English).
 *
 * WHAT THE SWITCH BUYS is a description that says what the site IS. Five names
 * joined by `·` tells a searcher which books are here and nothing about what
 * they would be arriving at, and it read identically to a list of nav links;
 * the tagline is the sentence the page itself opens with, which is the rule
 * every other row on this table already follows.
 */
/** Every chrome page names BOTH keys since 2026-09-06, `/` included — the
 *  optional `description` was there for the root alone. @type {Record<string, { title: string; description: string }>} */
const CHROME_KEYS = {
	'/': { title: 'home.title', description: 'home.tagline' },
	'/bibliotheca': { title: 'nav.library', description: 'library.landing.tagline' },
	'/scriptura': { title: 'bible.landing.title', description: 'bible.landing.tagline' },
	'/catechismus': { title: 'ccc.landing.title', description: 'ccc.landing.tagline' },
	'/catechismus/compendium': {
		title: 'compendium.landing.title',
		description: 'compendium.landing.tagline'
	},
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
	'/preces': { title: 'nav.prayers', description: 'prayers.landing.tagline' },
	'/calendarium': { title: 'calendar.title', description: 'calendar.tagline' },
	'/schola': { title: 'schola.landing.title', description: 'schola.landing.tagline' },
	'/colophon': { title: 'colophon.title', description: 'colophon.lede' }
};

/** Five works the site holds — `/`'s description before `home.tagline` was
 *  translated, kept as its fallback. See `CHROME_KEYS`. */
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
			// The five work names are `/`'s fallback and nothing else's: it is the
			// only description on this table assemblable with no sentence of its
			// own, and dropping the root out of the cluster over one missing key
			// costs more than every other page here (`CHROME_KEYS`).
			const description =
				plain(d[keys.description] ?? '') ||
				(path === '/'
					? HOME_SECTION_KEYS.map((key) => plain(d[key]))
							.filter(Boolean)
							.join(' · ')
					: '');
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
 * The fifty-three country calendars, each named in its own language.
 *
 * ONE LANGUAGE PER PAGE, WHICH IS THE WHOLE ECONOMY OF THIS TABLE. The chrome
 * above is fourteen pages times forty languages because every word on those
 * pages is the interface; a country's calendar differs from another country's
 * in its CONTENT, so forty translations of `/calendarium/brazil` would be forty
 * addresses claiming to be one page. `CALENDAR_PAGES` says which language each
 * one is — read off the editions GCatholic publishes, not guessed — and that
 * language is the whole of what this table needs from a dictionary the reader
 * may never see: a crawler cannot negotiate, and English is what it would
 * otherwise be told a Brazilian page is written in.
 *
 * THE NAME IS THE CALENDAR'S OWN AND IS NOT COMPOSED HERE. `Calendário
 * Litúrgico Brasileiro` is one written phrase, because the adjective follows
 * the noun in Portuguese, precedes and declines in German, and is not a word
 * at all in Chinese — see `CALENDAR_PAGES`. What this file adds is the site's
 * name after it, and the sentence around it.
 *
 * THE TERRITORY IS STILL NAMED BY THE PLATFORM, for the breadcrumb alone:
 * `Intl.DisplayNames` knows every one of these regions in every language the
 * site offers, and a crumb is a label, which is the one place a bare
 * nominative with no article is exactly right.
 *
 * @param {Record<string, Record<string, string>>} dictionaries lang -> strings
 */
function calendarNames(dictionaries) {
	/** @type {Record<string, [string, string, string]>} */
	const calendars = {};
	for (const id of CALENDAR_IDS) {
		const { lang, name } = CALENDAR_PAGES[id];
		const d = dictionaries[lang];
		const tagline = plain(d?.['calendar.national.tagline'] ?? '');
		const site = d?.['home.title'];
		if (!tagline || !site) {
			throw new Error(
				`route-titles: /calendarium/${id} is published in ${lang}, and that dictionary is ` +
					`missing calendar.national.tagline or home.title — a calendar's page is ` +
					`written in one language and there is no fallback for it`
			);
		}
		const territory = territoryName(id, lang);
		// `territoryName` falls back to the ISO code, which is the right answer
		// in a picker cell and the wrong one in a breadcrumb: a trail ending in
		// `BR` is a build defect and reads as a template that did not fill in.
		if (territory === id.toUpperCase()) {
			throw new Error(`route-titles: Intl.DisplayNames cannot name ${territory} in ${lang}`);
		}
		// The same substitution the page makes at hydration, and the same
		// `.replace('{x}', …)` every other placeholder on this site takes — the
		// convention `summa.titleFromEdition` set and `i18n.test.ts` guards.
		if (!tagline.includes(PLACEHOLDER)) {
			throw new Error(
				`route-titles: calendar.national.tagline in ${lang} has lost its ${PLACEHOLDER} — ` +
					`the description would name no calendar`
			);
		}
		calendars[id] = [`${name} — ${site}`, tagline.replace(PLACEHOLDER, name), territory];
	}
	return calendars;
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
