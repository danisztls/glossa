import { beforeEach, describe, expect, it } from 'vitest';
import { bookmarks, migrateBibleHref } from './bookmarks.svelte';

const VERSE = '/scriptura/exodus/3#v12';
const PARAGRAPH = '/catechismus/1213';

// A module-level singleton, like every other store here, so each test resets
// it by hand rather than by re-importing (see theme.test.ts / compare-pref.test.ts).
beforeEach(() => {
	for (const b of bookmarks.list) bookmarks.remove(b.href);
});

describe('BookmarkStore', () => {
	it('adds, reports and removes', () => {
		expect(bookmarks.has(VERSE)).toBe(false);
		bookmarks.add(VERSE);
		expect(bookmarks.has(VERSE)).toBe(true);
		expect(bookmarks.count).toBe(1);
		bookmarks.remove(VERSE);
		expect(bookmarks.has(VERSE)).toBe(false);
		expect(bookmarks.count).toBe(0);
	});

	it('is idempotent — saving the same address twice is one bookmark', () => {
		bookmarks.add(VERSE);
		bookmarks.add(VERSE);
		expect(bookmarks.count).toBe(1);
	});

	it('toggles both ways', () => {
		bookmarks.toggle(VERSE);
		expect(bookmarks.has(VERSE)).toBe(true);
		bookmarks.toggle(VERSE);
		expect(bookmarks.has(VERSE)).toBe(false);
	});

	// Nothing that cannot be resolved back to a unit is worth storing: the
	// library would only have to drop it again on the way out.
	it('refuses an address the route grammar does not have', () => {
		bookmarks.add('/ccc/1213');
		bookmarks.add('https://vatican.va/whatever');
		expect(bookmarks.count).toBe(0);
	});

	it('carries a parsed target on every listed row', () => {
		bookmarks.add(PARAGRAPH);
		expect(bookmarks.list[0].target).toEqual({ kind: 'ccc', n: 1213 });
	});

	it('lists newest first', async () => {
		bookmarks.add(VERSE);
		// `addedAt` has millisecond resolution and both adds would otherwise
		// land in the same millisecond.
		await new Promise((r) => setTimeout(r, 2));
		bookmarks.add(PARAGRAPH);
		expect(bookmarks.list.map((b) => b.href)).toEqual([PARAGRAPH, VERSE]);
	});

	it('removing something absent changes nothing', () => {
		bookmarks.add(VERSE);
		bookmarks.remove(PARAGRAPH);
		expect(bookmarks.count).toBe(1);
	});
});

/**
 * The Bible's books took Latin slugs on 2026-09-02. This store is keyed by the
 * raw href and `readStored` drops whatever the current grammar rejects — so
 * without the rewrite every Bible bookmark a reader had would vanish with
 * nothing said. Tested as a function because the store is a module singleton
 * built at import, and seeding storage before that is not something a test can
 * do without re-importing the module.
 */
describe('migrateBibleHref', () => {
	it('rewrites the OSIS spelling to the Latin slug', () => {
		expect(migrateBibleHref('/scriptura/josh/1')).toBe('/scriptura/iosue/1');
		expect(migrateBibleHref('/scriptura/rev/22')).toBe('/scriptura/apocalypsis/22');
		expect(migrateBibleHref('/scriptura/1kgs/3')).toBe('/scriptura/i-reges/3');
	});

	it('keeps the verse anchor and the span, which are what a bookmark is FOR', () => {
		expect(migrateBibleHref('/scriptura/exod/3#v12')).toBe('/scriptura/exodus/3#v12');
		expect(migrateBibleHref('/scriptura/john/1?v=1-7#v7')).toBe('/scriptura/ioannes/1?v=1-7#v7');
	});

	it('leaves an address that is already Latin, and anything that is not scripture', () => {
		expect(migrateBibleHref('/scriptura/genesis/1')).toBe('/scriptura/genesis/1');
		expect(migrateBibleHref('/catechismus/1213')).toBe('/catechismus/1213');
		expect(migrateBibleHref('/doctores/summa/i/1#a3')).toBe('/doctores/summa/i/1#a3');
	});

	it('leaves a book that never existed rather than inventing one', () => {
		expect(migrateBibleHref('/scriptura/nonesuch/1')).toBe('/scriptura/nonesuch/1');
	});

	it('produces an href the grammar accepts, for every book', () => {
		expect(bookmarks.list).toEqual([]);
		bookmarks.add(migrateBibleHref('/scriptura/2macc/7#v9'));
		expect(bookmarks.list.map((b) => b.href)).toEqual(['/scriptura/ii-machabaeus/7#v9']);
	});
});
