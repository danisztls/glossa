import { beforeEach, describe, expect, it } from 'vitest';
import { bookmarks, clampQuote, migrateBibleHref, QUOTE_MAX } from './bookmarks.svelte';

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

// A mark made by highlighting keeps the words, which is the one thing about a
// bookmark that is NOT re-derived from the address. See the store's docblock
// for what that costs and why a highlight earns it.
describe('a quoted bookmark', () => {
	const WORDS = 'In the beginning God created heaven, and earth.';

	it('keeps the words and the edition they were read in', () => {
		bookmarks.add(VERSE, { quote: WORDS, edition: 'bible.douay-rheims.en' });
		const [saved] = bookmarks.list;
		expect(saved.quote).toBe(WORDS);
		expect(saved.quotedFrom).toBe('bible.douay-rheims.en');
	});

	it('carries neither when the mark came from a unit number', () => {
		bookmarks.add(PARAGRAPH);
		const [saved] = bookmarks.list;
		expect(saved.quote).toBeUndefined();
		expect(saved.quotedFrom).toBeUndefined();
	});

	// The edition is meaningless on its own: it says which text some words
	// are, and there are no words.
	it('does not record an edition with no words to attribute', () => {
		bookmarks.add(VERSE, { quote: '   ', edition: 'bible.douay-rheims.en' });
		const [saved] = bookmarks.list;
		expect(saved.quote).toBeUndefined();
		expect(saved.quotedFrom).toBeUndefined();
	});

	it('is still keyed by address alone, so quoting twice is one bookmark', () => {
		bookmarks.add(VERSE, { quote: WORDS });
		bookmarks.add(VERSE, { quote: 'something else entirely' });
		expect(bookmarks.count).toBe(1);
		expect(bookmarks.list[0].quote).toBe(WORDS);
	});

	it('toggles the words on with the mark and off with it', () => {
		bookmarks.toggle(VERSE, { quote: WORDS });
		expect(bookmarks.list[0].quote).toBe(WORDS);
		bookmarks.toggle(VERSE);
		expect(bookmarks.count).toBe(0);
	});
});

describe('clampQuote', () => {
	it('leaves a quotation that fits exactly as it was', () => {
		expect(clampQuote('Fiat lux')).toBe('Fiat lux');
	});

	it('trims, so a highlight that overshot does not store the overshoot', () => {
		expect(clampQuote('  Fiat lux  ')).toBe('Fiat lux');
	});

	// Cut at a word, and marked: the ellipsis is what says the reader is
	// looking at part of what they highlighted rather than all of it.
	it('cuts a long quotation at a word boundary and marks the cut', () => {
		const long = `${'word '.repeat(200)}end`;
		const cut = clampQuote(long);
		expect(cut.length).toBeLessThanOrEqual(QUOTE_MAX + 1);
		expect(cut.endsWith('…')).toBe(true);
		expect(cut).not.toContain(' …');
	});

	it('still cuts where there is no word boundary to cut at', () => {
		const unbroken = 'x'.repeat(QUOTE_MAX * 2);
		expect(clampQuote(unbroken)).toBe(`${'x'.repeat(QUOTE_MAX)}…`);
	});
});
