import { describe, expect, it } from 'vitest';
import { indexesForPath } from './index-priming';

/**
 * The mapping decides which per-work-type indexes a route waits for, and a miss
 * is a class of bug the test suite cannot otherwise reach: under fixtures
 * `USE_REAL_CORPUS` is false, so `requireIndex`'s guard is inert and an
 * unprimed read looks exactly like a corpus that does not hold the text. What
 * IS testable is the mapping itself, which is where the judgement lives.
 */
describe('indexesForPath', () => {
	it('gives each reading shelf its own index and nothing else', () => {
		expect(indexesForPath('/scriptura/iosue/1')).toEqual(['bible']);
		expect(indexesForPath('/documenta/lumen-gentium')).toEqual(['document']);
		expect(indexesForPath('/preces/rosarium')).toEqual(['prayer']);
		expect(indexesForPath('/doctores/summa/i/1')).toEqual(['summa']);
	});

	it('gives the Catechism and the Compendium to each other', () => {
		// `CatechismIndex.svelte` renders the pair, and `/catechismus/caput/{n}`
		// reads the Compendium's structure — so splitting them would be a fetch
		// saved on one route and a thrown error on the other.
		expect(indexesForPath('/catechismus/1')).toEqual(['ccc', 'compendium']);
		expect(indexesForPath('/catechismus/compendium/1')).toEqual(['ccc', 'compendium']);
		expect(indexesForPath('/catechismus/caput/1')).toEqual(['ccc', 'compendium']);
	});

	it('reads a language entry point as the shelf it points at', () => {
		// `/es/scriptura/iosue/1` is served and canonicalizes to the bare path
		// (site/CLAUDE.md, "A reading address takes a language prefix as an ENTRY
		// POINT"), so it must prime the same index.
		expect(indexesForPath('/es/scriptura/iosue/1')).toEqual(['bible']);
		expect(indexesForPath('/pt/preces/rosarium')).toEqual(['prayer']);
	});

	it('does not mistake a work slug for a language prefix', () => {
		// `is` and `it` are interface languages AND plausible first segments; only
		// a segment followed by more path is treated as a prefix.
		expect(indexesForPath('/it')).toEqual(['ccc', 'compendium']);
	});

	it('gives the home page the outlines it renders', () => {
		expect(indexesForPath('/')).toEqual(['ccc', 'compendium']);
		expect(indexesForPath('')).toEqual(['ccc', 'compendium']);
	});

	it('asks for nothing where the shelf needs nothing', () => {
		expect(indexesForPath('/colophon')).toEqual([]);
		expect(indexesForPath('/doctrina-socialis/1')).toEqual([]);
	});

	it('falls back to everything for a path it has never heard of', () => {
		// The permissive direction is the only one this may be wrong in: an
		// unknown path costs fetches, where a narrow guess costs a thrown error
		// on a route added without this table being updated.
		expect(indexesForPath('/something-new/1')).toHaveLength(6);
	});
});
