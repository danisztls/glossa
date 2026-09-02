import { beforeEach, describe, expect, it } from 'vitest';
import { AUTO, compare } from './compare-pref.svelte';

// The store is a module-level singleton (same instance every reading route
// imports), so tests must not leak state into each other — reset to "off"
// before every case rather than exporting a second constructor just for
// tests.
beforeEach(() => {
	compare.set(undefined);
});

describe('CompareStore.active / target', () => {
	it('starts off (no localStorage in this test environment, same as SSR)', () => {
		expect(compare.active).toBe(false);
		expect(compare.target).toBeUndefined();
	});

	it('toggle() turns on to AUTO, then off to undefined', () => {
		compare.toggle();
		expect(compare.active).toBe(true);
		expect(compare.target).toBe(AUTO);

		compare.toggle();
		expect(compare.active).toBe(false);
		expect(compare.target).toBeUndefined();
	});

	it('set() stores a specific work id as the target', () => {
		compare.set('bible.matos-soares.pt');
		expect(compare.active).toBe(true);
		expect(compare.target).toBe('bible.matos-soares.pt');
	});
});

describe('CompareStore.syncFromUrl', () => {
	it('leaves the preference untouched when the URL has no `compare` param — absence is not "off"', () => {
		compare.set('bible.matos-soares.pt');
		compare.syncFromUrl(new URL('https://example.test/scriptura/ioannes/2'));
		expect(compare.target).toBe('bible.matos-soares.pt');
	});

	it('`?compare=0` is the only spelling that explicitly turns compare off', () => {
		compare.set('bible.matos-soares.pt');
		compare.syncFromUrl(new URL('https://example.test/scriptura/ioannes/2?compare=0'));
		expect(compare.target).toBeUndefined();
	});

	it('`?compare=1` is the original on/off spelling and maps to AUTO', () => {
		compare.syncFromUrl(new URL('https://example.test/catechismus/1?compare=1'));
		expect(compare.target).toBe(AUTO);
	});

	it('any other value is adopted verbatim as a work id target', () => {
		compare.syncFromUrl(new URL('https://example.test/catechismus/1?compare=ccc.pt'));
		expect(compare.target).toBe('ccc.pt');
	});

	it('a shared link overrides whatever the reader had stored, and becomes the new preference', () => {
		compare.set('bible.matos-soares.pt');
		compare.syncFromUrl(new URL('https://example.test/scriptura/ioannes/1?compare=bible.cpdv.en'));
		expect(compare.target).toBe('bible.cpdv.en');
	});
});

describe('CompareStore.resolveTarget', () => {
	it('returns undefined when compare is off, regardless of what is available', () => {
		expect(compare.resolveTarget(['ccc.en', 'ccc.pt'], 'ccc.pt')).toBeUndefined();
	});

	it("AUTO resolves to the caller-supplied fallback (the route's own pick)", () => {
		compare.toggle(); // -> AUTO
		expect(compare.resolveTarget(['ccc.en', 'ccc.pt'], 'ccc.pt')).toBe('ccc.pt');
	});

	it('a stored target available on this route wins over the fallback', () => {
		compare.set('bible.douay-rheims.en');
		expect(
			compare.resolveTarget(
				['bible.matos-soares.pt', 'bible.douay-rheims.en'],
				'bible.matos-soares.pt'
			)
		).toBe('bible.douay-rheims.en');
	});

	it('a stored target NOT available on this route degrades to the fallback, not to off', () => {
		// The scenario the task brief calls out by name: a reader turns compare
		// on while reading the Bible (target = a Bible edition id), then
		// navigates to the Catechism, where that id is meaningless.
		compare.set('bible.matos-soares.pt');
		expect(compare.resolveTarget(['ccc.en', 'ccc.pt'], 'ccc.pt')).toBe('ccc.pt');
	});

	it('returns undefined when active but the route has no fallback either (nothing to compare against)', () => {
		compare.toggle();
		expect(compare.resolveTarget([], undefined)).toBeUndefined();
	});
});

describe('CompareStore.paramValue', () => {
	it('is undefined when compare is off', () => {
		expect(compare.paramValue).toBeUndefined();
	});

	it('is the short "1" spelling for AUTO, not the literal "auto" string', () => {
		compare.toggle();
		expect(compare.paramValue).toBe('1');
	});

	it('is the work id verbatim for an explicit pick', () => {
		compare.set('ccc.pt');
		expect(compare.paramValue).toBe('ccc.pt');
	});
});
