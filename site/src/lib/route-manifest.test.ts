import { describe, expect, it } from 'vitest';
import { parseChromePath, isCanonicalPath, type RouteManifest } from './route-manifest';

const manifest: RouteManifest = {
	version: 1,
	workCount: 6,
	contentAssetCount: 12,
	bible: { gen: [0, 1, 2], john: [3] },
	ccc: [1, 2, 10],
	cccChapters: [1, 10],
	compendium: [1, 2],
	compendiumChapters: [1],
	documents: ['lumen-gentium'],
	prayers: ['our-father'],
	summa: { i: [1, 71], 'ii-ii': [184], suppl: [77] }
};

describe('isCanonicalPath', () => {
	it.each([
		'/',
		'/scriptura',
		'/scriptura/gen/1',
		// A book introduction. Admitted because `gen` carries a 0 above, not
		// because the segment parses as a number — see the two rejections below.
		'/scriptura/gen/0',
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
		'/scriptura/gen/3',
		// John has no introduction, so its chapter 0 is not an address even
		// though Genesis's is.
		'/scriptura/john/0',
		// The one-canonical-spelling rule survives admitting a bare 0.
		'/scriptura/gen/00',
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
		expect(parseChromePath('/pt/scriptura/gen/1')).toBeUndefined();
	});

	/** Both are noindex, so a fourteen-language cluster of them is fourteen
	 *  times nothing. */
	it('refuses the two static pages that are nobody’s destination', () => {
		expect(parseChromePath('/pt/signata')).toBeUndefined();
		expect(parseChromePath('/pt/404')).toBeUndefined();
	});

	it('refuses a language the interface does not have', () => {
		expect(parseChromePath('/xx/summa')).toBeUndefined();
		expect(parseChromePath('/mg/summa')).toBeUndefined();
	});
});
