import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assertNamed } from '../../scripts/route-titles.mjs';
import { sitemapPaths } from '../../scripts/sitemap.mjs';
import {
	clip,
	escapeHtml,
	headFor,
	headHtml,
	noscriptHtml,
	SITE_DESCRIPTION,
	SITE_NAME,
	type RouteTitles
} from './shell-head';
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

const titles: RouteTitles = {
	version: 1,
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
	it('titles the home page with the site name and nothing else', () => {
		expect(head('/')?.title).toBe(SITE_NAME);
		expect(head('/')?.description).toBe(SITE_DESCRIPTION);
	});

	it('gives every section landing page a name and a sentence of its own', () => {
		for (const p of [
			'/scriptura',
			'/catechismus',
			'/documenta',
			'/summa',
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
		expect(head('/scriptura/gen/1')?.title).toBe('Genesis 1 — Glossa Catholica');
	});

	it('reads chapter 0 as the book introduction it is', () => {
		expect(head('/scriptura/gen/0')?.title).toBe('Genesis: introduction — Glossa Catholica');
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
		expect(head('/summa/i/2')?.title).toBe(
			'Summa I q. 2 · The Existence of God — Glossa Catholica'
		);
		expect(head('/summa/suppl/77')?.title).toContain('Summa Suppl q. 77');
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
		expect(head('/scriptura/gen/1')?.crumbs.map((c) => c.href)).toEqual([
			'/',
			'/scriptura',
			'/scriptura/gen/1'
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
		expect(head('/scriptura/tob/1')).toBeUndefined();
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
		expect(() => assertNamed(['/scriptura/gen/1', '/scriptura/ps/1'], manifest, collide)).toThrow(
			/shared by more than one address/
		);
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
		const json = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)?.[1];
		expect(json, 'no JSON-LD block emitted').toBeDefined();
		const crumbs = JSON.parse(json!.replace(/\\u003c/g, '<'));
		expect(crumbs['@type']).toBe('BreadcrumbList');
		expect(crumbs.itemListElement.map((i: { item: string }) => i.item)).toEqual([
			'https://glossacatholica.org/',
			'https://glossacatholica.org/catechismus',
			'https://glossacatholica.org/catechismus/330'
		]);
		expect(crumbs.itemListElement.map((i: { position: number }) => i.position)).toEqual([1, 2, 3]);
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
