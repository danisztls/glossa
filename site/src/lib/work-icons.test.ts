import { describe, expect, it } from 'vitest';
import { isCanonicalPath, type RouteManifest } from './route-manifest';
import { SHELVES } from './shelves';
import { PLACE_ICONS, WORK_ICONS } from './work-icons';

/**
 * The bookkeeping the types cannot do, which is `pigments.test.ts`'s job on
 * the other vocabulary. Completeness IS typed — `WORK_ICONS` is a total
 * `Record<ShelvedWork, IconName>` and every consumer indexes it out of a
 * field it already holds — so what is left is the two things a `Record` has
 * nothing to say about: that no two subjects wear one mark, and that a place
 * names an address that exists.
 */
describe('the icon vocabulary', () => {
	/** A mark tells one work from another, so a mark on two of them tells the
	 *  reader nothing and does it confidently. It cannot be a type error: both
	 *  values are `IconName` and both are valid. */
	it('gives no glyph to two different subjects', () => {
		const all = [...Object.values(WORK_ICONS), ...Object.values(PLACE_ICONS)];
		expect(new Set(all).size, all.join(' ')).toBe(all.length);
	});

	/** The catalogue is what the vocabulary was extracted from, so a shelf with
	 *  no mark is the regression this module exists to make impossible. Typed
	 *  today; asserted in case `Shelf.type` ever widens back to `WorkType`. */
	it('marks every shelf in the catalogue', () => {
		for (const shelf of SHELVES) {
			expect(WORK_ICONS[shelf.type], shelf.key).toBeTruthy();
		}
	});

	/**
	 * A place is keyed by the address it opens, so a key that names no address
	 * is a row nothing can ever read — and the two surfaces that draw these
	 * look the glyph up BY href, so the failure would be an undefined icon on
	 * a live card rather than anything louder.
	 */
	it('keys every place on an address the site actually serves', () => {
		const manifest = { topics: [] } as unknown as RouteManifest;
		for (const path of Object.keys(PLACE_ICONS)) {
			expect(isCanonicalPath(path, manifest), path).toBe(true);
		}
	});
});
