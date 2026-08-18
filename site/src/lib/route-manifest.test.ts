import { describe, expect, it } from 'vitest';
import { isCanonicalPath, type RouteManifest } from './route-manifest';

const manifest: RouteManifest = {
	version: 1,
	workCount: 6,
	contentAssetCount: 12,
	bible: { gen: [1, 2], john: [3] },
	ccc: [1, 2, 10],
	cccChapters: [1, 10],
	compendium: [1, 2],
	documents: ['lumen-gentium'],
	prayers: ['our-father']
};

describe('isCanonicalPath', () => {
	it.each([
		'/',
		'/scriptura',
		'/scriptura/gen/1',
		'/catechismus/10',
		'/catechismus/caput/10',
		'/compendium/2',
		'/documenta/lumen-gentium',
		'/preces/our-father',
		'/colophon'
	])('accepts %s', (path) => {
		expect(isCanonicalPath(path, manifest)).toBe(true);
	});

	it.each([
		'/scriptura/gen/3',
		'/scriptura/GEN/1',
		'/catechismus/3',
		'/catechismus/01',
		'/catechismus/caput/2',
		'/compendium/3',
		'/documenta/made-up',
		'/preces/made-up',
		'/catechismus/10/extra',
		'/bible/gen/1'
	])('rejects %s', (path) => {
		expect(isCanonicalPath(path, manifest)).toBe(false);
	});
});
