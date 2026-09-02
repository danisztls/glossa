import { describe, it, expect } from 'vitest';
import { assertCanonical, sitemapPaths, sitemapXml, ORIGIN } from '../../scripts/sitemap.mjs';
import { parseChromePath } from './route-manifest';
import { isCanonicalPath, type RouteManifest } from './route-manifest';

/**
 * A manifest small enough to enumerate by hand, shaped like the real one:
 * a book with a chapter-0 introduction, a Summa part with no Supplement
 * counterpart, and slug-addressed documents and prayers.
 */
const manifest: RouteManifest = {
	version: 1,
	workCount: 3,
	contentAssetCount: 3,
	bible: { gen: [0, 1, 2], ps: [1] },
	ccc: [1, 2, 27],
	cccChapters: [1, 27],
	compendium: [1, 598],
	compendiumChapters: [1],
	documents: ['rerum-novarum'],
	prayers: ['ave-maria'],
	summa: { i: [1, 2], suppl: [77] }
};

describe('sitemapPaths', () => {
	it('emits only addresses the edge worker answers 200 for', () => {
		for (const p of sitemapPaths(manifest)) {
			expect(isCanonicalPath(p, manifest), p).toBe(true);
		}
	});

	it('covers every address in the manifest exactly once', () => {
		const paths = sitemapPaths(manifest);
		// 280 chrome + 4 bible + 2 cccChapters + 3 ccc + 1 compChapter
		// + 2 compendium + 1 document + 1 prayer + 3 summa.
		//
		// The chrome is EIGHT PAGES ONCE PLUS ONCE PER INTERFACE LANGUAGE
		// (2026-08-28): eight unprefixed, which are the cluster's `x-default`,
		// and eight under each of the THIRTY-FOUR tags in `UI_LANGS` — fourteen
		// until 2026-08-31, when the twelve content languages with no chrome
		// gained one and eight reach languages were added on top, which is why
		// this number moves whenever that list does. It was seven
		// until the Summa moved under `/doctores` the same day, which added the
		// shelf and its one work and took nothing away. Still no Compendium
		// landing page -- the Catechism's index presents both works
		// (`CatechismIndex.svelte`).
		expect(paths).toHaveLength(280 + 17);
		expect(new Set(paths).size).toBe(paths.length);
	});

	/** A reading address names a citation, which is the same citation in every
	 *  language, so it is listed once and takes no prefix. */
	it('prefixes the chrome pages and nothing else', () => {
		const prefixed = sitemapPaths(manifest).filter((p) => /^\/(pt|ar|la)(\/|$)/.test(p));
		expect(prefixed).toHaveLength(24);
		// Every prefixed path is a chrome page and nothing else. Depth is no
		// longer the discriminator: `/pt/doctores/summa` is three segments and
		// is chrome, so the test asks what the path IS rather than how long it
		// is (`/pt/doctores/summa/i/1` would fail this, which is the point).
		expect(prefixed.filter((p) => !parseChromePath(p))).toEqual([]);
	});

	it('lists a book introduction as chapter 0, like any other chapter', () => {
		expect(sitemapPaths(manifest)).toContain('/scriptura/genesis/0');
	});

	it('addresses a Summa question, not its articles — an article is a fragment', () => {
		const summa = sitemapPaths(manifest).filter((p) => p.startsWith('/doctores/summa/'));
		expect(summa).toEqual([
			'/doctores/summa/i/1',
			'/doctores/summa/i/2',
			'/doctores/summa/suppl/77'
		]);
	});

	it('omits the routes that are not addresses to visit', () => {
		const paths = sitemapPaths(manifest);
		// The bookmark library renders only what is in the reader's own
		// localStorage, and /404 exists to render a status.
		expect(paths).not.toContain('/signata');
		expect(paths).not.toContain('/404');
	});
});

describe('sitemapXml', () => {
	it('writes absolute URLs under the canonical origin', () => {
		const xml = sitemapXml(manifest);
		expect(xml).toContain(`<loc>${ORIGIN}/catechismus/27</loc>`);
		expect((xml.match(/<url>/g) ?? []).length).toBe(sitemapPaths(manifest).length);
	});

	it('carries no changefreq or priority', () => {
		const xml = sitemapXml(manifest);
		expect(xml).not.toMatch(/changefreq|priority/);
	});

	it('emits lastmod only where the ledger has a date', () => {
		const xml = sitemapXml(manifest, { '/catechismus/27': '2026-08-26' });
		expect(xml).toContain(
			`<url><loc>${ORIGIN}/catechismus/27</loc><lastmod>2026-08-26</lastmod></url>`
		);
		expect(xml).toContain(`<url><loc>${ORIGIN}/catechismus/1</loc></url>`);
	});

	it('says nothing about the static pages, which the ledger does not cover', () => {
		// They are chrome, not corpus. An address with no honest date available
		// gets no claim rather than the build's — see scripts/lastmod.mjs.
		const xml = sitemapXml(manifest, { '/catechismus/27': '2026-08-26' });
		expect(xml).toContain(`<url><loc>${ORIGIN}/</loc></url>`);
		expect(xml).toContain(`<url><loc>${ORIGIN}/colophon</loc></url>`);
	});

	it('omits lastmod entirely when no ledger is passed', () => {
		expect(sitemapXml(manifest)).not.toMatch(/lastmod/);
	});

	it('throws rather than advertising an address the worker would 404', () => {
		// The drift assertCanonical exists to catch: paths derived from one
		// manifest, validated against the manifest actually shipped. Shape-valid
		// and existence-invalid is the only way the two can disagree.
		const shipped = { ...manifest, summa: { i: manifest.summa.i } };
		expect(() => assertCanonical(sitemapPaths(manifest), shipped)).toThrow(
			/edge worker would 404.*\/doctores\/summa\/suppl\/77/s
		);
	});
});
