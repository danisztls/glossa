/**
 * What one canonical address is called, for a consumer that does not render.
 *
 * `ssr = false` means the build emits one document for all ~6,000 addresses,
 * so everything a non-rendering consumer learns about a page has to come from
 * the edge. Until this module existed it learned the same title and the same
 * sentence ~6,000 times — the textbook signature of duplicated content, and the
 * reason a pasted link unfurled as the site's name rather than the chapter's
 * (docs/decisions.md §The site).
 *
 * PURE, AND THAT IS THE POINT. It takes an address and two generated tables
 * and returns fields; `src/worker.ts` is the only place that knows about
 * `HTMLRewriter`. So the thing worth testing — that every address in
 * `sitemapPaths` gets a name of its own — is testable in vitest against the
 * real manifest, which is what `shell-head.test.ts` does.
 *
 * IT IS ENGLISH, deliberately and not by neglect. A crawler arrives with no
 * stored preference and is served `CONTENT_LANG_FALLBACK.en` — English, or
 * Latin where the corpus has no English — so the names in `route-titles.json`
 * are read in that language and the fixed words around them have to match.
 * The alternative, negotiating on `Accept-Language`, would vary a response
 * that every cache in front of it keys by URL alone.
 */

import { bookSlug, parseHref, summaPartFromSlug, type Address } from './address.ts';
import { relatedLinks, type Apparatus, type WorkImprint } from './apparatus.ts';
import {
	CHROME_PATHS,
	parseChromePath,
	parseLangEntry,
	type RouteManifest
} from './route-manifest.ts';
import { isRtl, UI_LANGS, type UiLang } from './ui-langs.ts';

/**
 * The site's name, and the tail of nearly every title.
 *
 * Equal to `home.title` in `src/lib/i18n/en.ts` and to the static `<title>` in
 * `src/app.html`; `shell-head.test.ts` fails when they drift, the same guard
 * `shell-meta.test.ts` already keeps over the other two. Spelled here rather
 * than imported because the worker would otherwise carry fourteen dictionaries
 * to the edge to read one string.
 */
export const SITE_NAME = 'Glossa Catholica';

/**
 * The one origin this site's addresses are published under.
 *
 * `scripts/sitemap.mjs` re-exports this as its `ORIGIN`, and the two having a
 * single definition is load-bearing rather than tidy: `<loc>` in the sitemap
 * and `<link rel="canonical">` on the page are a CLAIM AND A CONFIRMATION
 * about the same URL, and a crawler that finds them disagreeing resolves the
 * disagreement against the site — usually by trusting neither.
 *
 * Fixed here rather than read from `request.url`, which is the tempting
 * version and is wrong twice. A request arriving over plain HTTP would mint a
 * canonical under `http://`, which points at a different URL from the one the
 * sitemap advertises; and a preview or verification hostname would declare
 * ITSELF canonical, which is precisely the duplicate the `Disallow: /` at
 * launch existed to prevent (see static/robots.txt). Naming production is
 * right in both cases: a preview that says "the real one is over there" is
 * exactly what a preview should say.
 */
export const SITE_ORIGIN = 'https://glossacatholica.org';

/** The one-sentence description of the library, for the addresses that are
 *  the library rather than a text in it. Equal to `app.html`'s static
 *  `<meta name="description">` and to `manifest.webmanifest`. */
export const SITE_DESCRIPTION =
	'Scripture and the Magisterium — the Bible, the Catechism, the Compendium, and the documents of the Church. Free to read, offline-first.';

/** `[from, to, title]`. Flat and unordered: the reader of this table wants the
 *  NARROWEST span containing an address, which needs no tree. */
export type TitledSpan = [number, number, string];

export interface RouteTitles {
	version: number;
	/** lang -> chrome path -> `[title, description]`, from the interface's own
	 *  dictionaries. See `CHROME_KEYS` in scripts/route-titles.mjs. */
	chrome: Record<string, Record<string, [string, string]>>;
	books: Record<string, string>;
	cccSpans: TitledSpan[];
	compendiumSpans: TitledSpan[];
	/** slug -> `[title, author, year]`. */
	documents: Record<string, [string, string, string]>;
	prayers: Record<string, string>;
	/** part slug -> question number -> title. */
	summa: Record<string, Record<string, string>>;
}

export interface Crumb {
	name: string;
	href: string;
}

export interface ShellHead {
	title: string;
	description: string;
	/**
	 * Path only. A `?v=1-7` names a passage within a page, not a page, and
	 * collapsing the query is what keeps one text at one address.
	 *
	 * `null` on the not-found page, which is the one head here that answers
	 * for a URL that does not exist. A canonical link is a claim that THIS
	 * address is the preferred spelling of a real resource; declaring one on a
	 * 404 says the opposite of what the status says.
	 */
	canonical: string | null;
	/** True for the pages that exist but are nobody's destination — the
	 *  bookmark library, whose contents live in one reader's localStorage, and
	 *  the 404 route. Both are deliberately absent from `sitemap.xml` too. */
	noindex: boolean;
	/** The document's own language, which is the path's where the path names
	 *  one. `undefined` leaves `app.html`'s `lang="en"` alone — right for a
	 *  reading address, whose text a crawler is served in English. */
	lang?: UiLang;
	/** The whole `hreflang` cluster, `x-default` included, for a page that has
	 *  one. Empty for a reading address: those are not translated, they are one
	 *  citation with an edition the reader chooses. */
	alternates: { hreflang: string; href: string }[];
	crumbs: Crumb[];
	/** Where a consumer that does not run JavaScript can go from here. The
	 *  cross-references between texts are written by script, so without these
	 *  the corpus has no link graph at all and `sitemap.xml` is the only way
	 *  in — see `static/robots.txt`, which says so. */
	links: Crumb[];
	/**
	 * The prose THIS SITE wrote about the thing at this address.
	 *
	 * Today that is the editorial description of a magisterial document and
	 * nothing else. It is the one kind of running text the edge may serve,
	 * because it is the one kind nobody else holds rights in — see
	 * `apparatus.ts`. It is rendered into the `<noscript>`, so the page a
	 * reader sees is unchanged and the page a crawler reads is not empty.
	 */
	prose?: string;
	/** The work this address is a unit of, for the structured data. Absent
	 *  where the imprint table could not be read. */
	work?: WorkImprint & { href: string };
	/** The unit itself. `position` where the work numbers its units, which is
	 *  every work here except the documents and the prayers. */
	unit?: { name: string; position?: number };
	/** Set for a document, which is authored and dated in its own right rather
	 *  than inheriting its collection's imprint. */
	author?: string;
	datePublished?: string;
	/** The publisher's own address for this text — the URL to cite for the
	 *  words, as `llms.txt` puts it. */
	source?: string;
}

/** The English names of the works, for the crawler-facing language. */
const SCRIPTURE = 'Sacred Scripture';
const CATECHISM = 'Catechism of the Catholic Church';
const COMPENDIUM = 'Compendium of the Catechism';
const SUMMA = 'Summa Theologiae';
const DOCTORES = 'Doctors of the Church';
const MAGISTERIUM = 'Documents of the Magisterium';
const PRAYERS = 'Prayers';

const ROOT: Crumb = { name: SITE_NAME, href: '/' };

/**
 * The fixed pages, whose content is the interface rather than a text.
 *
 * `/catechismus/compendium` is absent because it is not a page: the
 * Compendium has no index of its own, the Catechism's presenting both works a
 * row at a time (2026-08-28). It is a path segment that groups addresses,
 * exactly as `/catechismus/caput` is.
 */
const STATIC_HEADS: Record<
	string,
	{ title: string; description: string; noindex?: boolean; uncanonical?: boolean }
> = {
	'/': { title: SITE_NAME, description: SITE_DESCRIPTION },
	'/scriptura': {
		title: `${SCRIPTURE} — ${SITE_NAME}`,
		description: `The Bible in English, Latin and Portuguese, book by book, with every chapter cross-referenced to the Catechism and the documents of the Church.`
	},
	'/catechismus': {
		title: `${CATECHISM} — ${SITE_NAME}`,
		description: `The Catechism of the Catholic Church and the Compendium that condenses it, read side by side, with their footnotes and sources.`
	},
	'/documenta': {
		title: `${MAGISTERIUM} — ${SITE_NAME}`,
		description: `Encyclicals, the documents of the Second Vatican Council, and apostolic exhortations, with their citations linked to the texts they name.`
	},
	'/doctores': {
		title: `${DOCTORES} — ${SITE_NAME}`,
		description: `The theological works of the Fathers and Doctors of the Church, read at the source with their citations linked to the texts they name.`
	},
	'/doctores/summa': {
		title: `${SUMMA} — ${SITE_NAME}`,
		description: `Thomas Aquinas's Summa Theologiae in English and Latin, question by question, with its citations linked to Scripture and the Fathers.`
	},
	'/preces': {
		title: `${PRAYERS} — ${SITE_NAME}`,
		description: `The common prayers of the Church in English, Latin and Portuguese, with their sources.`
	},
	'/colophon': {
		title: `Colophon — ${SITE_NAME}`,
		description: `How this library is made: where each text came from, who holds rights in it, and how the site is built.`
	},
	'/signata': {
		title: `Bookmarks — ${SITE_NAME}`,
		description: `The passages you have marked. They live in this browser and are never sent anywhere.`,
		noindex: true
	},
	'/404': {
		title: `Not found — ${SITE_NAME}`,
		description: SITE_DESCRIPTION,
		noindex: true,
		uncanonical: true
	}
};

/**
 * Shorten a heading to something a result page will print whole.
 *
 * Search engines truncate a title around 60 characters and a description
 * around 160, and a heading cut mid-word by the renderer reads worse than one
 * cut on a word boundary here. Several Compendium divisions are a quoted
 * article of the Creed and run past 70 characters on their own.
 */
export function clip(text: string, max: number): string {
	if (text.length <= max) return text;
	const cut = text.slice(0, max);
	const space = cut.lastIndexOf(' ');
	return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:—–-]+$/, '')}…`;
}

/** The narrowest titled span containing `n` — the most specific heading that
 *  is true of the address. */
function innermost(spans: TitledSpan[], n: number): string | undefined {
	let best: TitledSpan | undefined;
	for (const span of spans) {
		if (span[0] > n || n > span[1]) continue;
		if (!best || span[1] - span[0] < best[1] - best[0]) best = span;
	}
	return best?.[2];
}

/** The widest span STARTING at `n` — the division a `caput` page renders,
 *  which is the outermost one that opens there. */
function widestAt(spans: TitledSpan[], n: number): string | undefined {
	let best: TitledSpan | undefined;
	for (const span of spans) {
		if (span[0] !== n) continue;
		if (!best || span[1] - span[0] > best[1] - best[0]) best = span;
	}
	return best?.[2];
}

/** The entry before and after `n` in an ascending list, as far as they exist. */
function neighbours(
	numbers: readonly number[],
	n: number
): [number | undefined, number | undefined] {
	const i = numbers.indexOf(n);
	return i < 0 ? [undefined, undefined] : [numbers[i - 1], numbers[i + 1]];
}

/**
 * The head for one canonical address, or `undefined` for one this module has
 * no rule for.
 *
 * `undefined` is a real answer and the caller must handle it: it means serve
 * the shell as it stands, which is what the site did for every address before
 * this module existed. A new work kind that reaches production before its rule
 * does then loses a good title rather than a page.
 */
export function headFor(
	pathname: string,
	manifest: RouteManifest,
	titles: RouteTitles,
	apparatus?: Apparatus
): ShellHead | undefined {
	// A language-prefixed chrome page, and the bare page it is an alternate of,
	// are the same head in different languages — so they are built together and
	// differ only in which row of `titles.chrome` they read.
	const prefixed = parseChromePath(pathname);
	if (prefixed) return chromeHead(prefixed.path, prefixed.lang as UiLang, titles);
	if ((CHROME_PATHS as readonly string[]).includes(pathname)) {
		return chromeHead(pathname, undefined, titles);
	}

	// A language entry point on a READING address: the citation's own head, so
	// that a pasted link unfurls with the passage's real name, but pointing at
	// the bare path it is about to be replaced by.
	//
	// CANONICAL AND DELIBERATELY NOT `noindex`. The two together are an
	// anti-pattern -- a `noindex` on a page whose canonical names another can
	// carry the directive to the target, and the target here is the real
	// address. A canonical alone is what consolidates a duplicate, and the
	// client redirect means a crawler that renders ends up there anyway. So
	// `noindex` stays what it was: `/signata` and `/404`.
	//
	// `lang` is set because `htmlAttrs` reads it, and an Arabic or Hebrew entry
	// point that painted left-to-right and flipped at hydration is the same
	// defect `app.html`'s pre-paint block exists to prevent.
	const entry = parseLangEntry(pathname, manifest);
	if (entry) {
		const bare = headFor(entry.path, manifest, titles, apparatus);
		return bare && { ...bare, lang: entry.lang as UiLang, alternates: [] };
	}

	const fixed = STATIC_HEADS[pathname];
	if (fixed) {
		return {
			title: fixed.title,
			description: fixed.description,
			canonical: fixed.uncanonical ? null : pathname,
			noindex: fixed.noindex ?? false,
			alternates: [],
			crumbs: [ROOT, { name: fixed.title, href: pathname }],
			links: [ROOT]
		};
	}

	const address = parseHref(pathname);
	if (!address) return undefined;
	const head = bodyHead(address, pathname, manifest, titles);
	return head && decorate(head, address, titles, apparatus);
}

/**
 * Add to a structural head everything that comes from the apparatus.
 *
 * Separate from `bodyHead` rather than threaded through its eight cases, and
 * that is not only brevity: every field this adds is optional and every one of
 * them is absent when the table could not be read, so keeping the two apart
 * makes "what the page has without the apparatus" a thing you can still read
 * off `bodyHead` alone.
 */
function decorate(
	head: ShellHead,
	address: Address,
	titles: RouteTitles,
	apparatus: Apparatus | undefined
): ShellHead {
	const decorated: ShellHead = {
		...head,
		links: [...head.links, ...relatedLinks(address, apparatus, titles)],
		...imprintFor(address, apparatus)
	};

	// A document is the one address whose description we actually wrote. Using
	// it costs nothing a template was saying better: `clip` cuts on a word
	// boundary at the length a result page prints, and the whole of it goes to
	// the `<noscript>` where there is no such limit.
	const prose = address.kind === 'document' ? apparatus?.descriptions[address.slug] : undefined;
	if (prose) {
		decorated.prose = prose;
		decorated.description = clip(prose, 155);
	}
	return decorated;
}

/**
 * The publisher, the rights notice and the source URL for one address.
 *
 * READ FROM THE MANIFESTS AND NEVER WRITTEN HERE. Every value comes from the
 * corpus manifest of the edition a crawler is served, so a work whose rights
 * position changes at the source changes here on the next sync rather than
 * when someone remembers a constant. A field the manifest leaves empty stays
 * `null`: an imprint is a claim about somebody else's property and a guess at
 * one is worse than a gap.
 */
function imprintFor(
	address: Address,
	apparatus: Apparatus | undefined
): Pick<ShellHead, 'work' | 'unit' | 'author' | 'datePublished' | 'source'> {
	if (!apparatus) return {};
	const kind = WORK_OF[address.kind];
	const imprint = apparatus.works[kind.key];
	if (!imprint) return {};
	const work = { ...imprint, href: kind.href };

	if (address.kind === 'document') {
		const [author, promulgated, source] = apparatus.imprint[address.slug] ?? ['', '', ''];
		return {
			work,
			unit: { name: work.name },
			...(author ? { author } : {}),
			...(promulgated ? { datePublished: promulgated } : {}),
			// The document's own page at the publisher, which is finer than the
			// collection's and is the URL a citation should carry.
			...(source ? { source } : {})
		};
	}

	return {
		work,
		unit: unitOf(address),
		...(imprint.source ? { source: imprint.source } : {})
	};
}

/** Which work each address kind is a unit of. `compendium` points at
 *  `/catechismus` because the Compendium has no index of its own — the
 *  Catechism's page presents both, a row at a time. */
const WORK_OF: Record<Address['kind'], { key: string; href: string }> = {
	bible: { key: 'bible', href: '/scriptura' },
	ccc: { key: 'ccc', href: '/catechismus' },
	cccChapter: { key: 'ccc', href: '/catechismus' },
	compendium: { key: 'compendium', href: '/catechismus' },
	compendiumChapter: { key: 'compendium', href: '/catechismus' },
	document: { key: 'document', href: '/documenta' },
	prayer: { key: 'prayer', href: '/preces' },
	summa: { key: 'summa', href: '/doctores/summa' }
};

/** The unit a page renders, named as the work itself numbers it. */
function unitOf(address: Address): { name: string; position?: number } | undefined {
	switch (address.kind) {
		case 'bible':
			return address.chapter === 0
				? undefined
				: { name: `Chapter ${address.chapter}`, position: address.chapter };
		case 'ccc':
			return { name: `Paragraph ${address.n}`, position: address.n };
		case 'compendium':
			return { name: `Question ${address.n}`, position: address.n };
		case 'summa':
			return { name: `Question ${address.question}`, position: address.question };
		default:
			return undefined;
	}
}

/**
 * One chrome page, in one interface language or in none.
 *
 * `lang` undefined is the UNPREFIXED path, and it is not "the English page":
 * it negotiates (`app.html`'s pre-paint block, then `I18nStore`), which is a
 * different claim and exactly what `x-default` names. It is described in
 * English here because that is what a crawler — which does not negotiate —
 * receives, and the same reason `SITEMAP_LANGS` reads the corpus in English.
 *
 * Every member of the cluster declares the whole cluster, itself included.
 * That is not redundancy: an `hreflang` set is only honoured when the pages in
 * it agree, and a page omitting its own entry is the commonest way the set is
 * dropped. Each self-canonicalizes for the same reason — a prefixed page
 * canonicalizing to the bare path would be asking to be de-indexed, which
 * would leave the cluster with one member and no purpose.
 */
function chromeHead(
	path: string,
	lang: UiLang | undefined,
	titles: RouteTitles
): ShellHead | undefined {
	const row = titles.chrome[lang ?? 'en'];
	const entry = row?.[path];
	if (!entry) return undefined;
	const [title, description] = entry;
	const canonical = lang ? chromeHref(lang, path) : path;
	return {
		title,
		description,
		canonical,
		noindex: false,
		lang,
		alternates: [
			...UI_LANGS.filter((tag) => titles.chrome[tag]?.[path]).map((tag) => ({
				hreflang: tag,
				href: chromeHref(tag, path)
			})),
			{ hreflang: 'x-default', href: path }
		],
		crumbs: path === '/' ? [ROOT] : [ROOT, { name: title, href: canonical }],
		links: path === '/' ? sectionLinks() : [ROOT]
	};
}

/** `('pt', '/')` -> `/pt`; `('pt', '/doctores')` -> `/pt/doctores`. */
function chromeHref(lang: string, path: string): string {
	return path === '/' ? `/${lang}` : `/${lang}${path}`;
}

/** The site's own sections, for the `<noscript>` on the home page: the six
 *  places a crawler with no script can start from. Six, not the four in
 *  `NAV_ITEMS` — this list is a map of what is published, and `/colophon` has
 *  never been in the bar either. */
function sectionLinks(): Crumb[] {
	return [
		{ name: SCRIPTURE, href: '/scriptura' },
		{ name: CATECHISM, href: '/catechismus' },
		{ name: MAGISTERIUM, href: '/documenta' },
		// The shelf, not the Summa on it. This list is what a crawler with no
		// script can walk, and the shelf is the address that will still name
		// the right page once it holds more than one work. It is here and NOT
		// in `NAV_ITEMS` on purpose: the sitemap already publishes it, so
		// leaving it out would make this map poorer than the sitemap for no
		// gain, while the readable navigation stays as the reader chose.
		{ name: DOCTORES, href: '/doctores' },
		{ name: PRAYERS, href: '/preces' },
		{ name: 'Colophon', href: '/colophon' }
	];
}

function bodyHead(
	address: Address,
	pathname: string,
	manifest: RouteManifest,
	titles: RouteTitles
): ShellHead | undefined {
	switch (address.kind) {
		case 'bible': {
			const book = titles.books[address.osis];
			if (!book) return undefined;
			const intro = address.chapter === 0;
			const name = intro ? `${book}: introduction` : `${book} ${address.chapter}`;
			const [prev, next] = neighbours(manifest.bible[address.osis] ?? [], address.chapter);
			return {
				title: `${name} — ${SITE_NAME}`,
				description: intro
					? `An introduction to the book of ${book}: what it is, when it was written and how it is read.`
					: `${book}, chapter ${address.chapter}, in English, Latin and Portuguese, with the Catechism and the documents of the Church that cite it.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [ROOT, { name: SCRIPTURE, href: '/scriptura' }, { name, href: pathname }],
				links: [
					{ name: SCRIPTURE, href: '/scriptura' },
					...chapterLink(book, address.osis, prev),
					...chapterLink(book, address.osis, next)
				]
			};
		}

		case 'ccc': {
			const where = innermost(titles.cccSpans, address.n);
			const [prev, next] = neighbours(manifest.ccc, address.n);
			return {
				title:
					clip(where ? `CCC ${address.n} · ${where}` : `CCC ${address.n}`, 60) + ` — ${SITE_NAME}`,
				description: `Paragraph ${address.n} of the Catechism of the Catholic Church${where ? `, in “${where}”` : ''} — with its footnotes, its sources, and the Compendium beside it.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [
					ROOT,
					{ name: CATECHISM, href: '/catechismus' },
					{ name: `CCC ${address.n}`, href: pathname }
				],
				links: [
					{ name: CATECHISM, href: '/catechismus' },
					...numberLink('CCC', '/catechismus', prev),
					...numberLink('CCC', '/catechismus', next)
				]
			};
		}

		case 'cccChapter': {
			const name = widestAt(titles.cccSpans, address.n) ?? `Paragraphs from ${address.n}`;
			return {
				title: `${clip(name, 58)} — ${CATECHISM}`,
				description: `“${clip(name, 90)}” in the Catechism of the Catholic Church, from paragraph ${address.n}.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [ROOT, { name: CATECHISM, href: '/catechismus' }, { name, href: pathname }],
				links: [{ name: CATECHISM, href: '/catechismus' }]
			};
		}

		case 'compendium': {
			const where = innermost(titles.compendiumSpans, address.n);
			const [prev, next] = neighbours(manifest.compendium, address.n);
			const label = `Compendium ${address.n}`;
			return {
				title: clip(where ? `${label} · ${where}` : label, 60) + ` — ${SITE_NAME}`,
				description: `Question ${address.n} of the Compendium of the Catechism of the Catholic Church${where ? `, in “${clip(where, 70)}”` : ''}, with the paragraphs of the Catechism it condenses.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [ROOT, { name: CATECHISM, href: '/catechismus' }, { name: label, href: pathname }],
				links: [
					{ name: CATECHISM, href: '/catechismus' },
					...numberLink('Compendium', '/catechismus/compendium', prev),
					...numberLink('Compendium', '/catechismus/compendium', next)
				]
			};
		}

		case 'compendiumChapter': {
			const name = widestAt(titles.compendiumSpans, address.n) ?? `Questions from ${address.n}`;
			return {
				title: `${clip(name, 58)} — ${COMPENDIUM}`,
				description: `“${clip(name, 90)}” in the Compendium of the Catechism of the Catholic Church, from question ${address.n}.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [ROOT, { name: CATECHISM, href: '/catechismus' }, { name, href: pathname }],
				links: [{ name: CATECHISM, href: '/catechismus' }]
			};
		}

		case 'document': {
			const entry = titles.documents[address.slug];
			if (!entry) return undefined;
			const [name, author, year] = entry;
			const imprint = [author, year].filter(Boolean).join(', ');
			return {
				title: imprint ? `${name} — ${imprint}` : `${name} — ${SITE_NAME}`,
				description: `${name}${imprint ? `, ${imprint}` : ''} — the full text, with every citation linked to the Scripture and the documents it names.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [ROOT, { name: MAGISTERIUM, href: '/documenta' }, { name, href: pathname }],
				links: [{ name: MAGISTERIUM, href: '/documenta' }]
			};
		}

		case 'prayer': {
			const name = titles.prayers[address.slug];
			if (!name) return undefined;
			return {
				title: `${name} — ${SITE_NAME}`,
				description: `${name}, in English, Latin and Portuguese, with its source.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [ROOT, { name: PRAYERS, href: '/preces' }, { name, href: pathname }],
				links: [{ name: PRAYERS, href: '/preces' }]
			};
		}

		case 'summa': {
			const part = summaPartFromSlug(address.part);
			if (!part) return undefined;
			const name = titles.summa[address.part]?.[String(address.question)];
			const label = `Summa ${part} q. ${address.question}`;
			const [prev, next] = neighbours(manifest.summa[address.part] ?? [], address.question);
			return {
				title: clip(name ? `${label} · ${name}` : label, 60) + ` — ${SITE_NAME}`,
				description: `${SUMMA}, ${part} question ${address.question}${name ? `: ${name}` : ''} — every article, with its objections, its answer and its replies.`,
				canonical: pathname,
				noindex: false,
				alternates: [],
				crumbs: [
					ROOT,
					{ name: DOCTORES, href: '/doctores' },
					{ name: SUMMA, href: '/doctores/summa' },
					{ name: label, href: pathname }
				],
				links: [
					{ name: SUMMA, href: '/doctores/summa' },
					...summaLink(part, address.part, prev),
					...summaLink(part, address.part, next)
				]
			};
		}
	}
}

function chapterLink(book: string, osis: string, chapter: number | undefined): Crumb[] {
	if (chapter === undefined) return [];
	return [
		{
			name: chapter === 0 ? `${book}: introduction` : `${book} ${chapter}`,
			// `bookSlug`, not the osis: the crumb is a link, and the address is
			// spelled in Latin (`address.ts`). Building it by hand here is what
			// made this the one place the two disagreed.
			href: `/scriptura/${bookSlug(osis)}/${chapter}`
		}
	];
}

function numberLink(label: string, base: string, n: number | undefined): Crumb[] {
	return n === undefined ? [] : [{ name: `${label} ${n}`, href: `${base}/${n}` }];
}

function summaLink(part: string, slug: string, question: number | undefined): Crumb[] {
	return question === undefined
		? []
		: [{ name: `Summa ${part} q. ${question}`, href: `/doctores/summa/${slug}/${question}` }];
}

/**
 * Escape text for a place inside HTML markup.
 *
 * Needed because the fragments below are appended with `{ html: true }`,
 * which is HTMLRewriter's way of saying "I have already made this safe". The
 * inputs are generated tables rather than anyone's input, but a title carrying
 * an ampersand is ordinary and one carrying a quote is routine — several of
 * the Compendium's divisions are a quoted article of the Creed.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * JSON inside a `<script>`, which is not the same as JSON.
 *
 * A `</script>` sequence ends the element wherever it appears, quoted or not:
 * the HTML tokenizer does not read JSON. Escaping every `<` as its unicode
 * escape is the standard answer and leaves the value identical to a JSON
 * parser.
 */
function jsonLd(value: unknown): string {
	return JSON.stringify(value).replace(/</g, '\\u003c');
}

/**
 * The elements appended to `<head>`: the canonical address, the card's URL, a
 * robots directive where one is warranted, and the breadcrumb.
 *
 * `og:url` IS THE REVERSAL of the omission argued in docs/decisions.md, and
 * the reason it was omitted is the reason it can be written now. It was left
 * out because one document answered all ~6,000 addresses, so the only value the
 * static file could carry was the site root — which would have retitled and
 * relinked every deep-link preview to the home page. The document is
 * per-address here, so the tag can name the address it is actually about.
 * `app.html` still declares none, which is still right: the static file is not
 * about any one address.
 */
export function headHtml(head: ShellHead, origin: string): string {
	const url = head.canonical === null ? null : `${origin}${head.canonical}`;
	const parts = url
		? [
				`<link rel="canonical" href="${escapeHtml(url)}">`,
				`<meta property="og:url" content="${escapeHtml(url)}">`
			]
		: [];
	// `follow`, not `noindex, nofollow`: neither page is worth a result of its
	// own, and both link into the corpus, which is.
	if (head.noindex) parts.push('<meta name="robots" content="noindex, follow">');
	for (const alternate of head.alternates) {
		parts.push(
			`<link rel="alternate" hreflang="${escapeHtml(alternate.hreflang)}" ` +
				`href="${escapeHtml(`${origin}${alternate.href}`)}">`
		);
	}
	parts.push(`<script type="application/ld+json">${jsonLd(graphFor(head, origin))}</script>`);
	return parts.join('');
}

/**
 * The structured data for one address, as a single `@graph`.
 *
 * WHAT IT IS FOR IS ATTRIBUTION, NOT A RICH RESULT. None of these types earns
 * one — `BreadcrumbList` is the only node here a result page draws, and it was
 * the only node here until the rest was added. What the rest does is state, in
 * a form a parser reads, the thing the colophon and `llms.txt` state in prose:
 * the text belongs to its publisher, this site published the address.
 *
 * ONE SCRIPT AND ONE GRAPH, because an `@id` reference only resolves against
 * nodes in the SAME page's graph. Defining the publisher once on `/` and
 * pointing at it from the other ~6,000 addresses would read, everywhere but
 * the home page, as a reference to nothing.
 *
 * `isBasedOn` AND NOT `sameAs`, deliberately. `sameAs` would assert that this
 * page and the publisher's are the same work, which is a coherence signal that
 * tends to concentrate authority on the publisher; `isBasedOn` states the
 * derivation, which is what is actually true and all that needs saying. It is
 * a one-word change if that trade is ever worth making the other way.
 */
function graphFor(head: ShellHead, origin: string): unknown {
	const url = head.canonical === null ? null : `${origin}${head.canonical}`;
	const nodes: Record<string, unknown>[] = [
		{
			'@type': 'BreadcrumbList',
			...(url ? { '@id': `${url}#breadcrumb` } : {}),
			itemListElement: head.crumbs.map((crumb, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: crumb.name,
				item: `${origin}${crumb.href}`
			}))
		}
	];

	// The 404 head declares no canonical, and every node below is addressed by
	// one. A page that is not a resource gets the breadcrumb alone.
	if (!url) return { '@context': 'https://schema.org', '@graph': nodes };

	const unitId = head.unit ? `${url}#text` : undefined;
	const workId = head.work ? `${origin}${head.work.href}#work` : undefined;

	nodes.push({
		'@type': 'WebPage',
		'@id': url,
		url,
		name: head.title,
		description: head.description,
		isPartOf: {
			'@type': 'WebSite',
			'@id': `${origin}/#website`,
			name: SITE_NAME,
			url: `${origin}/`
		},
		breadcrumb: { '@id': `${url}#breadcrumb` },
		...(unitId ? { mainEntity: { '@id': unitId } } : {})
	});

	if (unitId && head.unit) {
		nodes.push({
			'@type': 'CreativeWork',
			'@id': unitId,
			name: head.unit.name,
			...(head.unit.position === undefined ? {} : { position: head.unit.position }),
			...(head.author ? { author: { '@type': 'Person', name: head.author } } : {}),
			...(head.datePublished ? { datePublished: head.datePublished } : {}),
			...(head.source ? { isBasedOn: head.source } : {}),
			...(workId ? { isPartOf: { '@id': workId } } : {})
		});
	}

	if (workId && head.work) {
		const publisher = head.work.publisher
			? { '@type': 'Organization', name: head.work.publisher }
			: undefined;
		nodes.push({
			'@type': 'CreativeWork',
			'@id': workId,
			name: head.work.name,
			url: `${origin}${head.work.href}`,
			...(publisher ? { publisher, copyrightHolder: publisher } : {}),
			...(head.work.notice ? { copyrightNotice: head.work.notice } : {}),
			...(head.work.source ? { isBasedOn: head.work.source } : {})
		});
	}

	return { '@context': 'https://schema.org', '@graph': nodes };
}

/**
 * The links a consumer that does not run JavaScript can follow from here.
 *
 * `robots.txt` already states the problem this solves: the site is one SPA
 * shell and every cross-reference between texts is written by script, so the
 * corpus has no link graph at all to a crawler that does not render, and
 * `sitemap.xml` is the only flat statement that these ~6,000 addresses exist.
 * A sitemap says what exists; it cannot say what is near what.
 *
 * A `<noscript>` and not a hidden `<div>`: content withheld from a rendering
 * browser but served to a crawler is cloaking, whatever it was meant for.
 * `<noscript>` is the element that means precisely this and is read as such.
 */
export function noscriptHtml(head: ShellHead): string {
	if (!head.links.length && !head.prose) return '';
	// Outside the `<nav>`: it is the page's own text, not a way out of it.
	const prose = head.prose ? `<p>${escapeHtml(head.prose)}</p>` : '';
	if (!head.links.length) return `<noscript>${prose}</noscript>`;
	const items = head.links
		.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.name)}</a></li>`)
		.join('');
	return (
		`<noscript>${prose}<nav aria-label="${escapeHtml(head.title)}"><p>` +
		`${escapeHtml(SITE_NAME)} renders in a browser with JavaScript enabled. ` +
		`Every text here is reproduced from its source publisher — see the ` +
		`<a href="/colophon">colophon</a>.</p><ul>${items}</ul></nav></noscript>`
	);
}

/**
 * The `lang` and `dir` a language-prefixed page's `<html>` should carry.
 *
 * `undefined` where the path names no language, which leaves `app.html`'s
 * `lang="en"` in place — right for a reading address, whose text a crawler is
 * served in English.
 *
 * `dir` MATTERS MORE THAN `lang` HERE and is why this is worth doing at the
 * edge rather than leaving to hydration: an Arabic reader arriving at
 * `/ar/catechismus` would otherwise watch the whole page flip sides once the
 * app boots. `app.html`'s pre-paint block reads the same path for the same
 * reason; this is the copy that reaches a consumer which never runs it.
 */
export function htmlAttrs(head: ShellHead): { lang: string; dir: string } | undefined {
	return head.lang ? { lang: head.lang, dir: isRtl(head.lang) ? 'rtl' : 'ltr' } : undefined;
}
