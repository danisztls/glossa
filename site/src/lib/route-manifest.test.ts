import { describe, expect, it } from 'vitest';
import { isCanonicalPath, type RouteManifest } from './route-manifest';

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
	prayers: ['our-father']
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
		'/compendium/2',
		'/compendium/caput/1',
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
		'/compendium/3',
		'/compendium/caput/2',
		'/documenta/made-up',
		'/preces/made-up',
		'/catechismus/10/extra',
		'/signata/anything',
		'/bible/gen/1'
	])('rejects %s', (path) => {
		expect(isCanonicalPath(path, manifest)).toBe(false);
	});
});
