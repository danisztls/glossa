import { describe, expect, it } from 'vitest';
import {
	CHROME_PATHS,
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
