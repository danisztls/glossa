import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assertNamed, buildRouteTitles, readDictionaries } from '../../scripts/route-titles.mjs';
import { sitemapPaths } from '../../scripts/sitemap.mjs';
import { CHROME_PATHS } from './route-manifest';
import { UI_LANGS } from './ui-langs';
import {
	clip,
	escapeHtml,
	headFor,
	headHtml,
	htmlAttrs,
	noscriptHtml,
	SITE_DESCRIPTION,
	SITE_NAME,
	type RouteTitles
} from './shell-head';
import type { Apparatus } from './apparatus';
import type { RouteManifest } from './route-manifest';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

/** Shaped like the real pair and small enough to enumerate: a book with a
 *  chapter-0 introduction, nested divisions that start at the same paragraph,
 *  and a Summa part the other edition does not carry. */
const manifest: RouteManifest = {
	version: 1,
	workCount: 3,
	contentAssetCount: 3,
	bible: { gen: [0, 1, 2], ps: [1] },
	ccc: [1, 2, 330],
	cccChapters: [1, 325],
	compendium: [1, 45, 598],
	compendiumChapters: [1],
	documents: ['rerum-novarum'],
	prayers: ['ave-maria'],
	summa: { i: [1, 2], suppl: [77] }
};

/**
 * A chrome table over every interface language, the way the real one is built.
 *
 * Generated rather than written out because the point of these tests is the
 * CLUSTER, and a fixture with two languages in it would pass the whole
 * hreflang suite while the shipped table had fourteen. The strings are the
 * English ones with the tag on the front, which is enough to tell members
 * apart and keeps the per-language distinctness check honest.
 */
function chromeFixture(): RouteTitles['chrome'] {
	const pages: Record<string, [string, string]> = {
		'/': ['Glossa Catholica', 'The Bible · Catechism · Summa'],
		'/scriptura': ['The Bible — Glossa Catholica', 'Read the whole Bible.'],
		'/catechismus': [
			'Catechism of the Catholic Church — Glossa Catholica',
			'Doctrine in 2,865 paragraphs.'
		],
		'/documenta': ['Magisterium — Glossa Catholica', 'Encyclicals and conciliar documents.'],
		'/doctores': ['Doctors of the Church — Glossa Catholica', 'The Fathers and Doctors.'],
		'/doctores/summa': ['Summa Theologiae — Glossa Catholica', 'Thomas Aquinas.'],
		'/preces': ['Common Prayers — Glossa Catholica', 'Prayers with the Latin alongside.'],
		'/colophon': ['Colophon — Glossa Catholica', 'What this site is.']
	};
	return Object.fromEntries(
		UI_LANGS.map((lang) => [
			lang,
			Object.fromEntries(
				Object.entries(pages).map(([path, [title, description]]) => [
					path,
					// The home page is the site's name in every language, exactly as
					// the real table has it — which is what makes the cluster
					// exemption in `assertNamed` worth testing.
					path === '/' ? [title, `${lang}: ${description}`] : [`${lang}: ${title}`, description]
				])
			)
		])
	);
}

const titles: RouteTitles = {
	version: 1,
	chrome: chromeFixture(),
	books: { gen: 'Genesis', ps: 'Psalms' },
	cccSpans: [
		[1, 25, 'Prologue'],
		[1, 3, 'I. The life of man - to know and love God'],
		[325, 349, 'Heaven and Earth'],
		[325, 421, 'I Believe in God the Father']
	],
	compendiumSpans: [
		[1, 217, 'The Profession of Faith'],
		[1, 32, '“I believe” – “We believe”'],
		[36, 58, 'I believe in God the Father Almighty, Creator of heaven and earth']
	],
	documents: { 'rerum-novarum': ['Rerum Novarum', 'Leo XIII', '1891'] },
	prayers: { 'ave-maria': 'Hail Mary' },
	summa: {
		i: { '1': 'The Nature and Extent of Sacred Doctrine', '2': 'The Existence of God' },
		suppl: { '77': 'Of the Time and Manner of the Resurrection' }
	}
};

const head = (p: string) => headFor(p, manifest, titles);

describe('SITE_NAME and SITE_DESCRIPTION', () => {
	/**
	 * The same guard `shell-meta.test.ts` keeps over `app.html`, extended to
	 * the third copy. The edge now writes a title into a document that already
	 * carries one, and the route overwrites both at hydration; three spellings
	 * of the site's name would show as a visible flicker on every load.
	 */
	it('names the site as app.html and the root layout do', () => {
		const shell = /<title>([^<]*)<\/title>/.exec(read('src/app.html'))?.[1];
		const layout = /'home\.title':\s*'([^']*)'/.exec(read('src/lib/i18n/en.ts'))?.[1];
		expect(SITE_NAME).toBe(shell);
		expect(SITE_NAME).toBe(layout);
	});

	it('describes the library as app.html does', () => {
		const shell = /<meta\s+name="description"\s+content="([^"]*)"/s.exec(read('src/app.html'))?.[1];
		expect(shell, 'no `<meta name="description">` in src/app.html').toBeDefined();
		expect(SITE_DESCRIPTION).toBe(shell);
	});
});

describe('headFor, static pages', () => {
	/** The site's name, and a description that is now the interface's own — the
	 *  home page is a chrome page like the other six. */
	it('titles the home page with the site name and nothing else', () => {
		expect(head('/')?.title).toBe(SITE_NAME);
		expect(head('/')?.description).toBe('en: The Bible · Catechism · Summa');
	});

	it('gives every section landing page a name and a sentence of its own', () => {
		for (const p of [
			'/scriptura',
			'/catechismus',
			'/documenta',
			'/doctores',
			'/doctores/summa',
			'/preces',
			'/colophon'
		]) {
			const h = head(p);
			expect(h, p).toBeDefined();
			expect(h?.title, p).not.toBe(SITE_NAME);
			expect(h?.description, p).not.toBe(SITE_DESCRIPTION);
		}
	});

	/** Both are real routes the sitemap deliberately omits: one renders what is
	 *  in a single reader's localStorage, the other renders a status. */
	it('marks the bookmark library and the 404 route noindex', () => {
		expect(head('/signata')?.noindex).toBe(true);
		expect(head('/404')?.noindex).toBe(true);
		expect(head('/catechismus')?.noindex).toBe(false);
	});

	it('offers the sections as links from the home page, for a consumer with no script', () => {
		expect(head('/')?.links.map((l) => l.href)).toContain('/documenta');
	});
});

describe('headFor, the corpus', () => {
	it('names a Bible chapter by its book', () => {
		expect(head('/scriptura/genesis/1')?.title).toBe('Genesis 1 — Glossa Catholica');
	});

	it('reads chapter 0 as the book introduction it is', () => {
		expect(head('/scriptura/genesis/0')?.title).toBe('Genesis: introduction — Glossa Catholica');
	});

	/** The narrowest containing division is the most specific heading true of
	 *  the paragraph; the widest would title 500 addresses "Part One". */
	it('places a Catechism paragraph in its innermost division', () => {
		expect(head('/catechismus/330')?.title).toBe('CCC 330 · Heaven and Earth — Glossa Catholica');
	});

	/** The other direction, and it is why both helpers exist: a `caput` page
	 *  renders the OUTERMOST division opening at that number. */
	it('names a chapter page after the widest division starting there', () => {
		expect(head('/catechismus/caput/325')?.title).toContain('I Believe in God the Father');
		expect(head('/catechismus/caput/1')?.title).toContain('Prologue');
	});

	it('reads the Compendium at the address it moved to under the Catechism', () => {
		expect(head('/catechismus/compendium/45')?.title).toContain('Compendium 45');
		expect(head('/compendium/45')).toBeUndefined();
	});

	it('gives a document its author and year rather than the site name', () => {
		expect(head('/documenta/rerum-novarum')?.title).toBe('Rerum Novarum — Leo XIII, 1891');
	});

	it('names a prayer', () => {
		expect(head('/preces/ave-maria')?.title).toBe('Hail Mary — Glossa Catholica');
	});

	/** The Supplementum exists in English alone, so its titles come from the
	 *  edition that has it rather than from the served language wholesale. */
	it('names a Summa question, Supplement included', () => {
		expect(head('/doctores/summa/i/2')?.title).toBe(
			'Summa I q. 2 · The Existence of God — Glossa Catholica'
		);
		expect(head('/doctores/summa/suppl/77')?.title).toContain('Summa Suppl q. 77');
	});

	it('walks to the neighbouring address, so the corpus has a link graph without script', () => {
		expect(head('/catechismus/2')?.links.map((l) => l.href)).toEqual([
			'/catechismus',
			'/catechismus/1',
			'/catechismus/330'
		]);
		// The ends of a run have one neighbour, not a link to nothing.
		expect(head('/catechismus/1')?.links.map((l) => l.href)).toEqual([
			'/catechismus',
			'/catechismus/2'
		]);
	});

	it('breadcrumbs from the site root down to the address', () => {
		expect(head('/scriptura/genesis/1')?.crumbs.map((c) => c.href)).toEqual([
			'/',
			'/scriptura',
			'/scriptura/genesis/1'
		]);
	});

	it('declares the path as canonical, never a query', () => {
		for (const p of sitemapPaths(manifest)) {
			expect(head(p)?.canonical, p).toBe(p);
		}
	});

	/** A canonical link says "this address is the preferred spelling of a real
	 *  resource", which is the opposite of what a 404 status says. */
	it('declares no canonical for the not-found page', () => {
		expect(head('/404')?.canonical).toBeNull();
		expect(headHtml(head('/404')!, ORIGIN)).not.toContain('rel="canonical"');
		expect(headHtml(head('/404')!, ORIGIN)).not.toContain('og:url');
		// It still breadcrumbs and still says noindex.
		expect(headHtml(head('/404')!, ORIGIN)).toContain('BreadcrumbList');
	});

	/** A well-formed address for something the tables do not name: the caller
	 *  serves the shell unaltered rather than titling the page after nothing. */
	it('returns undefined for an address it has no name for', () => {
		expect(head('/scriptura/tobias/1')).toBeUndefined();
		expect(head('/documenta/no-such-document')).toBeUndefined();
		expect(head('/not-an-address-at-all')).toBeUndefined();
	});
});

describe('assertNamed', () => {
	it('passes over an address space every rule covers', () => {
		expect(() => assertNamed(sitemapPaths(manifest), manifest, titles)).not.toThrow();
	});

	/** The failure it exists for: a work ingested before `shell-head.ts` learns
	 *  its name ships hundreds of pages all called `Glossa Catholica`, and
	 *  nothing a person looks at reports it. */
	it('refuses an address whose name the tables do not carry', () => {
		const gap = { ...titles, prayers: {} };
		expect(() => assertNamed(sitemapPaths(manifest), manifest, gap)).toThrow(
			/no name of their own/
		);
	});

	it('refuses two addresses sharing one title', () => {
		const collide = { ...titles, books: { gen: 'Genesis', ps: 'Genesis' } };
		expect(() =>
			assertNamed(['/scriptura/genesis/1', '/scriptura/psalmi/1'], manifest, collide)
		).toThrow(/shared by more than one address/);
	});
});

describe('clip', () => {
	it('leaves a short heading alone', () => {
		expect(clip('Heaven and Earth', 60)).toBe('Heaven and Earth');
	});

	it('cuts on a word boundary rather than mid-word', () => {
		expect(clip('The Profession of the Christian Faith', 20)).toBe('The Profession of…');
	});

	it('cuts mid-word only when the boundary would lose most of the text', () => {
		expect(clip('Antidisestablishmentarianism', 10)).toBe('Antidisest…');
	});
});

const ORIGIN = 'https://glossacatholica.org';

/** One node of the emitted `@graph`, by `@type`. The graph is the unit of
 *  assertion here rather than the script block, because which node carries
 *  which fact is exactly what the shape is for. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function graphNodes(html: string): any[] {
	const block = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)?.[1];
	return block ? JSON.parse(block.replace(/\\u003c/g, '<'))['@graph'] : [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function graphNode(html: string, type: string): any {
	return graphNodes(html).find((node) => node['@type'] === type);
}

/** By `@id` rather than by `@type`: the unit and the work are both a
 *  `CreativeWork`, and which is which is exactly what the id says. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function graphById(html: string, suffix: string): any {
	return graphNodes(html).find((node) => String(node['@id']).endsWith(suffix));
}

describe('headHtml', () => {
	const html = headHtml(head('/catechismus/330')!, ORIGIN);

	it('declares the address it is being served for as canonical', () => {
		expect(html).toContain(
			'<link rel="canonical" href="https://glossacatholica.org/catechismus/330">'
		);
	});

	/**
	 * The reversal recorded in docs/decisions.md: `og:url` was omitted from
	 * `app.html` because one document answered every address, so the only value
	 * it could carry was the site root — which would have relinked every
	 * deep-link preview to the home page. Per-address, it can name the address.
	 */
	it('names the same address as the card URL', () => {
		expect(html).toContain(
			'<meta property="og:url" content="https://glossacatholica.org/catechismus/330">'
		);
	});

	it('emits the breadcrumb as parseable JSON-LD with absolute items', () => {
		const crumbs = graphNode(html, 'BreadcrumbList');
		expect(crumbs, 'no BreadcrumbList in the graph').toBeDefined();
		expect(crumbs.itemListElement.map((i: { item: string }) => i.item)).toEqual([
			'https://glossacatholica.org/',
			'https://glossacatholica.org/catechismus',
			'https://glossacatholica.org/catechismus/330'
		]);
		expect(crumbs.itemListElement.map((i: { position: number }) => i.position)).toEqual([1, 2, 3]);
	});

	/**
	 * ONE SCRIPT AND ONE GRAPH. An `@id` reference resolves only against nodes
	 * in the same page's graph, so a publisher defined once on `/` and pointed
	 * at from ~6,000 addresses would be a reference to nothing everywhere but
	 * the home page. This is the test that fails if the graph is ever split.
	 */
	it('emits exactly one JSON-LD block, as a graph', () => {
		const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
		expect(blocks).toHaveLength(1);
		const parsed = JSON.parse(blocks[0][1].replace(/\\u003c/g, '<'));
		expect(parsed['@context']).toBe('https://schema.org');
		expect(Array.isArray(parsed['@graph'])).toBe(true);
	});

	/** A `</script>` sequence ends the element wherever it appears, quoted or
	 *  not — the HTML tokenizer does not read JSON. */
	it('escapes every angle bracket inside the JSON-LD', () => {
		const evil = { ...titles, prayers: { 'ave-maria': '</script><img src=x>' } };
		const out = headHtml(headFor('/preces/ave-maria', manifest, evil)!, ORIGIN);
		expect(out).not.toContain('</script><img');
		expect(out.match(/<\/script>/g)).toHaveLength(1);
	});

	it('marks a noindex page, and only a noindex page', () => {
		expect(headHtml(head('/signata')!, ORIGIN)).toContain(
			'name="robots" content="noindex, follow"'
		);
		expect(html).not.toContain('name="robots"');
	});
});

describe('noscriptHtml', () => {
	const html = noscriptHtml(head('/catechismus/330')!);

	/** The corpus has no link graph at all to a consumer that does not render:
	 *  every cross-reference is written by script (see static/robots.txt). */
	it('offers the neighbouring addresses as real links', () => {
		// The fixture's Catechism is 1, 2, 330, so 2 is what precedes 330 here.
		expect(html).toContain('<a href="/catechismus/2">');
		expect(html).toContain('<a href="/catechismus">');
	});

	/** Withholding content from a rendering browser while serving it to a
	 *  crawler is cloaking; `<noscript>` is the element that means this. */
	it('wraps them in a noscript, not a hidden element', () => {
		expect(html.startsWith('<noscript>')).toBe(true);
		expect(html).not.toMatch(/hidden|display:\s*none/);
	});

	it('escapes a name that carries markup characters', () => {
		const out = noscriptHtml(head('/catechismus/caput/1')!);
		expect(out).not.toMatch(/<a href="[^"]*"><[a-z]/);
	});
});

describe('escapeHtml', () => {
	it('escapes the four characters that change how markup parses', () => {
		expect(escapeHtml('a & b < c > d " e')).toBe('a &amp; b &lt; c &gt; d &quot; e');
	});

	/** The Compendium's divisions are quoted articles of the Creed, so a
	 *  curly quote in a title is routine and must survive untouched. */
	it('leaves a curly quote alone', () => {
		expect(escapeHtml('\u201cI believe\u201d')).toBe('\u201cI believe\u201d');
	});
});

describe('the interface-language cluster', () => {
	/** A reading address names a citation, which is the same citation in every
	 *  language; a chrome page's every word IS the language. That distinction
	 *  is the whole basis for which addresses take a prefix. */
	it('serves a prefixed page in the language its path names', () => {
		expect(head('/pt/catechismus')?.title).toBe(
			'pt: Catechism of the Catholic Church — Glossa Catholica'
		);
		expect(head('/pt/catechismus')?.description).toBe('Doctrine in 2,865 paragraphs.');
		expect(head('/catechismus')?.title).toBe(
			'en: Catechism of the Catholic Church — Glossa Catholica'
		);
	});

	it('reads /pt as the home page in Portuguese', () => {
		expect(head('/pt')?.title).toBe('Glossa Catholica');
		expect(head('/pt')?.description).toBe('pt: The Bible · Catechism · Summa');
	});

	/**
	 * A page omitting its own entry is the commonest way a set is dropped, and
	 * a prefixed page canonicalizing to the bare path would ask to be
	 * de-indexed — leaving a cluster of one.
	 */
	it('has every member declare the whole cluster, itself included', () => {
		for (const p of ['/catechismus', '/pt/catechismus', '/en/catechismus']) {
			const alternates = head(p)?.alternates.map((a) => a.hreflang) ?? [];
			expect(alternates, p).toContain('en');
			expect(alternates, p).toContain('pt');
			expect(alternates, p).toContain('x-default');
		}
	});

	it('points x-default at the unprefixed path, which negotiates', () => {
		const xd = head('/pt/doctores/summa')?.alternates.find((a) => a.hreflang === 'x-default');
		expect(xd?.href).toBe('/doctores/summa');
	});

	it('has every member self-canonicalize', () => {
		expect(head('/pt/doctores/summa')?.canonical).toBe('/pt/doctores/summa');
		expect(head('/doctores/summa')?.canonical).toBe('/doctores/summa');
		expect(head('/pt')?.canonical).toBe('/pt');
	});

	/** `dir` is the half that has to reach a consumer before hydration: an
	 *  Arabic reader would otherwise watch the page flip sides. */
	it('gives a prefixed page its own lang and direction', () => {
		expect(htmlAttrs(head('/ar/doctores/summa')!)).toEqual({ lang: 'ar', dir: 'rtl' });
		expect(htmlAttrs(head('/pt/doctores/summa')!)).toEqual({ lang: 'pt', dir: 'ltr' });
	});

	/** The unprefixed path is not "the English page" — it negotiates, which is
	 *  what x-default names — so it declares no language of its own. */
	it('leaves the unprefixed path and every reading address unlanguaged', () => {
		expect(htmlAttrs(head('/doctores/summa')!)).toBeUndefined();
		expect(htmlAttrs(head('/catechismus/330')!)).toBeUndefined();
		expect(head('/catechismus/330')?.alternates).toEqual([]);
	});

	it('emits each alternate as an absolute hreflang link', () => {
		const html = headHtml(head('/pt/doctores/summa')!, ORIGIN);
		expect(html).toContain(
			'<link rel="alternate" hreflang="pt" href="https://glossacatholica.org/pt/doctores/summa">'
		);
		expect(html).toContain(
			'<link rel="alternate" hreflang="x-default" href="https://glossacatholica.org/doctores/summa">'
		);
	});

	it('refuses a language the interface does not have', () => {
		expect(head('/xx/doctores')).toBeUndefined();
		expect(head('/xx/catechismus/330')).toBeUndefined();
	});

	/**
	 * A reading address under a prefix is an entry point, not a published page
	 * (2026-09-02, `parseLangEntry`). It carries the citation's own name so a
	 * pasted link unfurls properly, and points at the bare path it is about to
	 * be replaced by.
	 */
	it('gives a language entry point the citation head and the bare canonical', () => {
		const entry = head('/pt/catechismus/330')!;
		const bare = head('/catechismus/330')!;
		expect(entry.title).toBe(bare.title);
		expect(entry.canonical).toBe('/catechismus/330');
		// No cluster: it is one citation, not a page translated fourteen times.
		expect(entry.alternates).toEqual([]);
		// NOT `noindex`. Paired with a canonical naming another URL, the
		// directive can carry to the target — here, the real address.
		expect(entry.noindex).toBe(false);
	});

	it('sets lang and dir on an entry point, so a right-to-left page does not flip', () => {
		expect(htmlAttrs(head('/ar/catechismus/330')!)).toEqual({ lang: 'ar', dir: 'rtl' });
		expect(htmlAttrs(head('/pt/catechismus/330')!)).toEqual({ lang: 'pt', dir: 'ltr' });
	});
});

describe('the chrome table the build actually ships', () => {
	/**
	 * THE FAILURE THIS EXISTS FOR is a cluster whose Portuguese member is
	 * described in English. That tells a search engine the page is Portuguese
	 * and then shows it English, which is the one thing an `hreflang` set is
	 * checked for — and `t()`'s runtime fallback to English, which is right on
	 * a page, would produce exactly it here. `chromeNames` has no fallback; this
	 * is what says the dictionaries make one unnecessary.
	 */
	it('names all seven pages in all fourteen interface languages', async () => {
		const { chrome } = buildRouteTitles({
			manifests: {},
			bibleIndex: {},
			cccIndex: {},
			compendiumIndex: {},
			summaIndex: {},
			prayerIndex: {},
			dictionaries: await readDictionaries()
		});
		for (const lang of UI_LANGS) {
			expect(Object.keys(chrome[lang] ?? {}).sort(), lang).toEqual([...CHROME_PATHS].sort());
		}
	});

	/** The taglines are written for the page, where two of the words are set in
	 *  `<strong>`; a `<meta>` content attribute is text. */
	it('strips the markup a tagline carries', async () => {
		const { chrome } = buildRouteTitles({
			manifests: {},
			bibleIndex: {},
			cccIndex: {},
			compendiumIndex: {},
			summaIndex: {},
			prayerIndex: {},
			dictionaries: await readDictionaries()
		});
		for (const lang of UI_LANGS) {
			for (const [, description] of Object.values(chrome[lang])) {
				expect(description, lang).not.toMatch(/[<>]/);
			}
		}
	});
});

/**
 * A fixture apparatus over the fixture corpus.
 *
 * Small enough to enumerate, and shaped like the real one in the two ways that
 * matter: a document with a description, and a Catechism paragraph whose
 * apparatus points three different ways at once.
 */
const apparatus: Apparatus = {
	version: 1,
	works: {
		ccc: {
			name: 'Catechism of the Catholic Church',
			publisher: 'Libreria Editrice Vaticana',
			notice: 'Copyright © Libreria Editrice Vaticana',
			source: 'https://www.vatican.va/archive/ENG0015/_INDEX.HTM'
		},
		document: {
			name: 'Documents of the Magisterium',
			publisher: 'Libreria Editrice Vaticana',
			notice: 'Copyright © Libreria Editrice Vaticana',
			source: null
		},
		bible: {
			name: 'Sacred Scripture',
			publisher: null,
			notice: 'Entire text is in the public domain. No copyright.',
			source: 'https://sacredbible.org/catholic/index.htm'
		},
		compendium: { name: 'Compendium', publisher: null, notice: null, source: null },
		summa: { name: 'Summa Theologiae', publisher: null, notice: null, source: null },
		prayer: { name: 'Common Prayers', publisher: null, notice: null, source: null }
	},
	descriptions: {
		'rerum-novarum':
			'On the condition of labor amid industrial upheaval, addressing what the document itself calls the rights and duties of capital and labor. It refutes the socialist proposal to abolish private property, grounds ownership in natural and paternal right, and sets out duties binding workers and employers alike.'
	},
	imprint: {
		'rerum-novarum': [
			'Leo XIII',
			'1891-05-15',
			'https://www.vatican.va/content/leo-xiii/en/encyclicals/documents/rerum-novarum.html'
		]
	},
	bible: { 'gen.1': { ccc: [330], docs: ['rerum-novarum'] } },
	ccc: { '330': { bible: ['gen.1'], docs: ['rerum-novarum'], comp: [45] } },
	compendium: { '45': [[330, 331]] },
	docs: { 'rerum-novarum': { bible: ['gen.1'] } }
};

describe('the apparatus', () => {
	const withApparatus = (p: string) => headFor(p, manifest, titles, apparatus)!;

	/**
	 * The description is the one kind of running text the edge may serve,
	 * because it is the one kind nobody else holds rights in. Before this it
	 * was a template naming the document and saying nothing about it, on all
	 * 272 document addresses.
	 */
	it('describes a document with the prose written about it', () => {
		const head = withApparatus('/documenta/rerum-novarum');
		expect(head.description).toContain('industrial upheaval');
		expect(head.description).not.toContain('the full text, with every citation');
		expect(head.prose).toBe(apparatus.descriptions['rerum-novarum']);
	});

	/** 160 characters is what a result page prints; the `<noscript>` has no
	 *  such limit and gets the whole of it. */
	it('clips the description and never the prose', () => {
		const head = withApparatus('/documenta/rerum-novarum');
		expect(head.description.length).toBeLessThanOrEqual(156);
		expect(head.prose!.length).toBeGreaterThan(head.description.length);
		expect(noscriptHtml(head)).toContain('industrial upheaval');
	});

	/**
	 * The link graph the sitemap cannot state. A sitemap says what exists; it
	 * cannot say what is near what, and every cross-reference on this site is
	 * written by script.
	 */
	it('links a paragraph to what it cites and to what condenses it', () => {
		const hrefs = withApparatus('/catechismus/330').links.map((l) => l.href);
		expect(hrefs).toContain('/scriptura/genesis/1');
		expect(hrefs).toContain('/catechismus/compendium/45');
		expect(hrefs).toContain('/documenta/rerum-novarum');
		// The structural links are not displaced by the apparatus.
		expect(hrefs).toContain('/catechismus');
	});

	/** The direction no other index in the corpus holds: a chapter of Scripture
	 *  naming the paragraphs that cite it. */
	/** A document is a whole work, not a unit of one: no neighbours, no parent
	 *  but the collection. Without its own apparatus it is a page with one
	 *  link, which is what all 272 of them were. */
	it('links a document to the Scripture it cites', () => {
		const hrefs = withApparatus('/documenta/rerum-novarum').links.map((l) => l.href);
		expect(hrefs).toContain('/scriptura/genesis/1');
	});

	/**
	 * A budget per kind of link, not one total. Filling a single budget in
	 * source order gave Genesis 1 eight Catechism paragraphs and pushed out
	 * every document that cites it — the page linked into one work and not the
	 * other, which is the opposite of what an apparatus is for.
	 */
	it('never lets one kind of link starve another', () => {
		const links = withApparatus('/scriptura/genesis/1').links;
		expect(links.some((l) => l.href.startsWith('/catechismus/'))).toBe(true);
		expect(links.some((l) => l.href.startsWith('/documenta/'))).toBe(true);
	});

	it('links a chapter of Scripture to its citers', () => {
		const hrefs = withApparatus('/scriptura/genesis/1').links.map((l) => l.href);
		expect(hrefs).toContain('/catechismus/330');
		expect(hrefs).toContain('/documenta/rerum-novarum');
	});

	it('names the apparatus links from the titles table, never from the address', () => {
		const names = withApparatus('/catechismus/330').links.map((l) => l.name);
		expect(names).toContain('Genesis 1');
		expect(names).toContain('Rerum Novarum');
	});

	/**
	 * The whole point of the structured data. The site publishes the page; the
	 * publisher published the text, and this is where that is said in a form a
	 * parser reads.
	 */
	it('attributes the text to its publisher and never to this site', () => {
		const html = headHtml(withApparatus('/catechismus/330'), ORIGIN);
		const work = graphById(html, '#work');
		expect(work.publisher.name).toBe('Libreria Editrice Vaticana');
		expect(work.copyrightHolder.name).toBe('Libreria Editrice Vaticana');
		expect(JSON.stringify(work)).not.toContain('Glossa Catholica');
	});

	it('carries a document’s own author, date and source', () => {
		const html = headHtml(withApparatus('/documenta/rerum-novarum'), ORIGIN);
		const unit = graphById(html, '#text');
		expect(unit.author.name).toBe('Leo XIII');
		expect(unit.datePublished).toBe('1891-05-15');
		expect(unit.isBasedOn).toContain('vatican.va');
	});

	/**
	 * `isBasedOn` states derivation; `sameAs` would assert that this page and
	 * the publisher's are the same work, which concentrates authority on the
	 * publisher. The choice is deliberate and this is what would catch it
	 * changing by accident.
	 */
	it('states derivation rather than identity', () => {
		const html = headHtml(withApparatus('/catechismus/330'), ORIGIN);
		expect(html).toContain('isBasedOn');
		expect(html).not.toContain('sameAs');
	});

	/**
	 * The third file is the least critical of the three the worker reads, and
	 * this is the assertion that keeps it so: with no apparatus at all, every
	 * address still has a name, a canonical and a way onward.
	 */
	it('degrades to the structural head when the table is missing', () => {
		const without = headFor('/catechismus/330', manifest, titles)!;
		expect(without.title).toBe(withApparatus('/catechismus/330').title);
		expect(without.canonical).toBe('/catechismus/330');
		expect(without.links.map((l) => l.href)).toContain('/catechismus');
		expect(without.prose).toBeUndefined();
		expect(without.work).toBeUndefined();
		expect(() => headHtml(without, ORIGIN)).not.toThrow();
	});
});
