import { beforeEach, describe, expect, it } from 'vitest';
import { bookmarks } from './bookmarks.svelte';

const VERSE = '/scriptura/exod/3#v12';
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
		expect(bookmarks.list[0].target).toEqual({
			kind: 'unit',
			target: { kind: 'ccc', n: 1213 }
		});
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
