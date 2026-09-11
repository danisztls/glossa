import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	CHROME_PATHS,
	PRERENDERED_CHROME_PATHS,
	PRERENDERED_STATIC_PATHS,
	STATIC_PATHS,
	isPrerenderedPath,
	parseChromePath,
	parseLangEntry,
	isCanonicalPath,
	type RouteManifest
} from './route-manifest';

const manifest: RouteManifest = {
	version: 1,
	workCount: 6,
	contentAssetCount: 12,
	bible: { gen: [0, 1, 2], john: [3] },
	ccc: [1, 2, 10],
	cccChapters: [1, 10],
	compendium: [1, 2],
	compendiumChapters: [1],
	socialDoctrine: [1, 2, 583],
	socialDoctrineChapters: [1, 20],
	canonLaw: [1, 216],
	canonLawTitles: [1, 7],
	documents: ['lumen-gentium'],
	prayers: ['our-father'],
	topics: ['crematio'],
	summa: { i: [1, 71], 'ii-ii': [184], suppl: [77] }
};

describe('isCanonicalPath', () => {
	it.each([
		'/',
		'/scriptura',
		'/scriptura/genesis/1',
		// A book introduction. Admitted because `gen` carries a 0 above, not
		// because the segment parses as a number — see the two rejections below.
		'/scriptura/genesis/0',
		'/catechismus/10',
		'/catechismus/caput/10',
		'/catechismus/compendium/2',
		'/catechismus/compendium/caput/1',
		'/documenta/lumen-gentium',
		'/preces/our-father',
		'/signata',
		'/colophon'
	])('accepts %s', (path) => {
		expect(isCanonicalPath(path, manifest)).toBe(true);
	});

	it.each([
		'/scriptura/genesis/3',
		// John has no introduction, so its chapter 0 is not an address even
		// though Genesis's is.
		'/scriptura/ioannes/0',
		// The one-canonical-spelling rule survives admitting a bare 0.
		'/scriptura/genesis/00',
		'/scriptura/GEN/1',
		'/catechismus/3',
		'/catechismus/01',
		'/catechismus/caput/2',
		'/catechismus/compendium/3',
		'/catechismus/compendium/caput/2',
		'/documenta/made-up',
		'/preces/made-up',
		'/catechismus/10/extra',
		'/signata/anything',
		'/bible/gen/1'
	])('rejects %s', (path) => {
		expect(isCanonicalPath(path, manifest)).toBe(false);
	});
});

/**
 * THE GUARD FOR THE FAILURE THIS FILE'S TWO TABLES ALLOW.
 *
 * `/calendarium` and `/ius-canonicum` each shipped as a route directory with a
 * `+page.svelte`, a nav entry and working client-side navigation, and each
 * answered 404 to every cold load for weeks: `isCanonicalPath` is the edge's
 * only authority on whether a URL exists, and neither path was in
 * `STATIC_PATHS` or in `CHROME_PATHS`. Nothing caught it because the SPA
 * router does not ask the worker, so every way a person would check by hand
 * works.
 *
 * So the routes on disk are the assertion. A directory with a page and no
 * dynamic segment IS an address, and this walks them rather than listing them
 * — a list would have to be remembered, which is the thing that failed.
 */
describe('every static route is an address the edge admits', () => {
	/** Route directories with a `+page.svelte` and no `[param]` anywhere above
	 *  them, as pathnames. `/404` and the language-entry tree are excluded:
	 *  the first is the not-found page itself, the second is a matcher. */
	function staticRoutes(dir: string, prefix = ''): string[] {
		const out: string[] = [];
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === '+page.svelte' && prefix) out.push(prefix);
			if (!entry.isDirectory()) continue;
			if (entry.name.startsWith('[') || entry.name.startsWith('.') || entry.name === '404')
				continue;
			out.push(...staticRoutes(join(dir, entry.name), `${prefix}/${entry.name}`));
		}
		return out;
	}

	it.each(staticRoutes('src/routes'))('%s', (path) => {
		expect(isCanonicalPath(path, manifest)).toBe(true);
	});

	it('finds the routes at all, so an empty walk cannot pass vacuously', () => {
		expect(staticRoutes('src/routes').length).toBeGreaterThan(8);
	});
});

describe('parseChromePath', () => {
	it('reads an interface language off a chrome path', () => {
		expect(parseChromePath('/pt/catechismus')).toEqual({ lang: 'pt', path: '/catechismus' });
		expect(parseChromePath('/ar')).toEqual({ lang: 'ar', path: '/' });
	});

	/** The bare path is not a language address: it NEGOTIATES, which is a
	 *  different claim and is what `x-default` names in the cluster. */
	it('does not read the unprefixed path as a language', () => {
		expect(parseChromePath('/catechismus')).toBeUndefined();
		expect(parseChromePath('/')).toBeUndefined();
	});

	/** A reading address names a citation, the same citation in every language. */
	it('refuses a reading address under a prefix', () => {
		expect(parseChromePath('/pt/catechismus/330')).toBeUndefined();
		expect(parseChromePath('/pt/scriptura/genesis/1')).toBeUndefined();
	});

	/** Both are noindex, so a fourteen-language cluster of them is fourteen
	 *  times nothing. */
	it('refuses the two static pages that are nobody’s destination', () => {
		expect(parseChromePath('/pt/signata')).toBeUndefined();
		expect(parseChromePath('/pt/404')).toBeUndefined();
	});

	// `is` is the second case: a well-formed language tag that is simply not
	// an interface language. It was `mg`, then `sw`, and the interface list
	// grew into both within one day — it is a superset of the corpus now, so
	// the counterexample can no longer be a content language at all. Icelandic
	// is on no list here and on no plan.
	it('refuses a language the interface does not have', () => {
		expect(parseChromePath('/xx/doctores')).toBeUndefined();
		expect(parseChromePath('/is/doctores')).toBeUndefined();
	});
});

/**
 * A language entry point on a READING address (2026-09-02).
 *
 * `/es/scriptura/genesis/1` is served so the language can be taken and stored,
 * and then stripped in the bar by `[uilang=uilang]/[...rest]`. It is not a
 * published address: it canonicalizes to the bare path, is in no sitemap, and
 * declares no alternates.
 */
describe('parseLangEntry', () => {
	it('splits a language off a reading address', () => {
		expect(parseLangEntry('/es/scriptura/genesis/1', manifest)).toEqual({
			lang: 'es',
			path: '/scriptura/genesis/1'
		});
		expect(parseLangEntry('/ar/catechismus/10', manifest)).toEqual({
			lang: 'ar',
			path: '/catechismus/10'
		});
	});

	/**
	 * A chrome page KEEPS its prefix — it is published in every language and
	 * self-canonicalizes — so it must not read as an entry point even though it
	 * has the same shape. Stripping one would drop the address a search result
	 * points at, which is the failure worth a test rather than a comment.
	 */
	it('leaves the chrome pages to parseChromePath', () => {
		for (const path of CHROME_PATHS) {
			const prefixed = path === '/' ? '/pt' : `/pt${path}`;
			expect(parseLangEntry(prefixed, manifest), prefixed).toBeUndefined();
			expect(parseChromePath(prefixed), prefixed).toBeDefined();
		}
	});

	it('refuses a tag that is not an interface language', () => {
		expect(parseLangEntry('/xx/catechismus/10', manifest)).toBeUndefined();
		expect(parseLangEntry('/scriptura/genesis/1', manifest)).toBeUndefined();
	});

	it('refuses an address the corpus does not carry', () => {
		expect(parseLangEntry('/es/catechismus/9999', manifest)).toBeUndefined();
		expect(parseLangEntry('/es/scriptura/nonesuch/1', manifest)).toBeUndefined();
	});

	/** One prefix, never two: peeling a segment per round would give every
	 *  address 34 x 34 spellings, which is the multiplication the unprefixed
	 *  reading addresses exist to avoid. */
	it('refuses a doubled prefix', () => {
		expect(parseLangEntry('/es/pt/catechismus/10', manifest)).toBeUndefined();
		expect(isCanonicalPath('/es/pt/catechismus/10', manifest)).toBe(false);
	});

	it('makes the entry point exist at the edge', () => {
		expect(isCanonicalPath('/es/scriptura/genesis/1', manifest)).toBe(true);
		expect(isCanonicalPath('/es/scriptura/genesis/9999', manifest)).toBe(false);
	});
});

/**
 * The third list, and the two properties that keep it from being a loophole.
 *
 * `vite.config.ts` throws at build time on the first of them, which is where
 * the check has to be — only a build knows the route tree. What is testable
 * here is the pair of claims that make the list a KIND of page rather than an
 * exception: a static entry is an address the edge admits, and it is not a
 * chrome path wearing the wrong hat. A chrome path that drifted onto this list
 * would prerender its bare form and silently lose its 37 prefixed ones.
 */
describe('the prerendered static paths', () => {
	it('are addresses the edge admits', () => {
		for (const path of PRERENDERED_STATIC_PATHS) {
			expect(STATIC_PATHS.has(path), path).toBe(true);
			expect(isCanonicalPath(path, manifest), path).toBe(true);
		}
	});

	it('are not chrome, which is the whole reason the list is separate', () => {
		for (const path of PRERENDERED_STATIC_PATHS) {
			expect((CHROME_PATHS as readonly string[]).includes(path), path).toBe(false);
			expect((PRERENDERED_CHROME_PATHS as readonly string[]).includes(path), path).toBe(false);
		}
	});

	/** The edge reads one predicate, so a list the build writes files for and
	 *  the predicate does not know about is a document nothing ever serves. */
	it('are what the edge serves a document for', () => {
		for (const path of PRERENDERED_STATIC_PATHS) expect(isPrerenderedPath(path), path).toBe(true);
		// And no prefixed form: `/pt/quaestiones` is a language ENTRY POINT the
		// router replaces with the bare path, not a page with a file of its own.
		expect(isPrerenderedPath('/pt/quaestiones')).toBe(false);
		expect(parseLangEntry('/pt/quaestiones', manifest)).toEqual({
			lang: 'pt',
			path: '/quaestiones'
		});
	});
});
