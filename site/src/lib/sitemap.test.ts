import { describe, it, expect } from 'vitest';
import { assertCanonical, sitemapPaths, sitemapXml, ORIGIN } from '../../scripts/sitemap.mjs';
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
		// 105 chrome + 4 bible + 2 cccChapters + 3 ccc + 1 compChapter
		// + 2 compendium + 1 document + 1 prayer + 3 summa.
		//
		// The chrome is SEVEN PAGES ONCE PLUS ONCE PER INTERFACE LANGUAGE
		// (2026-08-28): seven unprefixed, which are the cluster's `x-default`,
		// and seven under each of the fourteen tags in `UI_LANGS`. Seven and not
		// eight because the Compendium has no landing page of its own -- the
		// Catechism's index presents both works (`CatechismIndex.svelte`).
		expect(paths).toHaveLength(105 + 17);
		expect(new Set(paths).size).toBe(paths.length);
	});

	/** A reading address names a citation, which is the same citation in every
	 *  language, so it is listed once and takes no prefix. */
	it('prefixes the chrome pages and nothing else', () => {
		const prefixed = sitemapPaths(manifest).filter((p) => /^\/(pt|ar|la)(\/|$)/.test(p));
		expect(prefixed).toHaveLength(21);
		expect(prefixed.filter((p) => p.split('/').length > 3)).toEqual([]);
	});

	it('lists a book introduction as chapter 0, like any other chapter', () => {
		expect(sitemapPaths(manifest)).toContain('/scriptura/gen/0');
	});

	it('addresses a Summa question, not its articles — an article is a fragment', () => {
		const summa = sitemapPaths(manifest).filter((p) => p.startsWith('/summa/'));
		expect(summa).toEqual(['/summa/i/1', '/summa/i/2', '/summa/suppl/77']);
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
			/edge worker would 404.*\/summa\/suppl\/77/s
		);
	});
});
