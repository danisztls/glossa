/**
 * What one canonical address is called, for a consumer that does not render.
 *
 * `ssr = false` means the build emits one document for all ~5,800 addresses,
 * so everything a non-rendering consumer learns about a page has to come from
 * the edge. Until this module existed it learned the same title and the same
 * sentence 5,804 times — the textbook signature of duplicated content, and the
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

import { parseHref, summaPartFromSlug, type Address } from './address.ts';
import type { RouteManifest } from './route-manifest.ts';

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
	crumbs: Crumb[];
	/** Where a consumer that does not run JavaScript can go from here. The
	 *  cross-references between texts are written by script, so without these
	 *  the corpus has no link graph at all and `sitemap.xml` is the only way
	 *  in — see `static/robots.txt`, which says so. */
	links: Crumb[];
}

/** The English names of the works, for the crawler-facing language. */
const SCRIPTURE = 'Sacred Scripture';
const CATECHISM = 'Catechism of the Catholic Church';
const COMPENDIUM = 'Compendium of the Catechism';
const SUMMA = 'Summa Theologiae';
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
	'/summa': {
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
	titles: RouteTitles
): ShellHead | undefined {
	const fixed = STATIC_HEADS[pathname];
	if (fixed) {
		return {
			title: fixed.title,
			description: fixed.description,
			canonical: fixed.uncanonical ? null : pathname,
			noindex: fixed.noindex ?? false,
			crumbs: pathname === '/' ? [ROOT] : [ROOT, { name: fixed.title, href: pathname }],
			links: pathname === '/' ? sectionLinks() : [ROOT]
		};
	}

	const address = parseHref(pathname);
	return address && bodyHead(address, pathname, manifest, titles);
}

/** The site's own sections, for the `<noscript>` on the home page: the six
 *  places a crawler with no script can start from. */
function sectionLinks(): Crumb[] {
	return [
		{ name: SCRIPTURE, href: '/scriptura' },
		{ name: CATECHISM, href: '/catechismus' },
		{ name: MAGISTERIUM, href: '/documenta' },
		{ name: SUMMA, href: '/summa' },
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
				crumbs: [ROOT, { name: SUMMA, href: '/summa' }, { name: label, href: pathname }],
				links: [
					{ name: SUMMA, href: '/summa' },
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
			href: `/scriptura/${osis}/${chapter}`
		}
	];
}

function numberLink(label: string, base: string, n: number | undefined): Crumb[] {
	return n === undefined ? [] : [{ name: `${label} ${n}`, href: `${base}/${n}` }];
}

function summaLink(part: string, slug: string, question: number | undefined): Crumb[] {
	return question === undefined
		? []
		: [{ name: `Summa ${part} q. ${question}`, href: `/summa/${slug}/${question}` }];
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
 * out because one document answered all 5,804 addresses, so the only value the
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
	parts.push(
		`<script type="application/ld+json">${jsonLd({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: head.crumbs.map((crumb, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: crumb.name,
				item: `${origin}${crumb.href}`
			}))
		})}</script>`
	);
	return parts.join('');
}

/**
 * The links a consumer that does not run JavaScript can follow from here.
 *
 * `robots.txt` already states the problem this solves: the site is one SPA
 * shell and every cross-reference between texts is written by script, so the
 * corpus has no link graph at all to a crawler that does not render, and
 * `sitemap.xml` is the only flat statement that these ~5,800 addresses exist.
 * A sitemap says what exists; it cannot say what is near what.
 *
 * A `<noscript>` and not a hidden `<div>`: content withheld from a rendering
 * browser but served to a crawler is cloaking, whatever it was meant for.
 * `<noscript>` is the element that means precisely this and is read as such.
 */
export function noscriptHtml(head: ShellHead): string {
	if (!head.links.length) return '';
	const items = head.links
		.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.name)}</a></li>`)
		.join('');
	return (
		`<noscript><nav aria-label="${escapeHtml(head.title)}"><p>` +
		`${escapeHtml(SITE_NAME)} renders in a browser with JavaScript enabled. ` +
		`Every text here is reproduced from its source publisher — see the ` +
		`<a href="/colophon">colophon</a>.</p><ul>${items}</ul></nav></noscript>`
	);
}
