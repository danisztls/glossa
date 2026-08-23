/**
 * The reader's saved addresses.
 *
 * WHAT IS STORED IS AN ADDRESS AND A TIMESTAMP, nothing else. Not the text,
 * not the citation, not the edition it was read in. `refHref`'s output is
 * edition-free by design, so `/scriptura/exod/3#v12` names the same verse to
 * the same reader in English, Portuguese or Latin -- resolving a bookmark
 * late (through `bookmarkContent.ts`, which reads the reader's CURRENT
 * edition) is what makes a bookmark follow them across an edition switch
 * instead of freezing the wording they happened to have open. It also keeps
 * the stored blob to a few dozen bytes a row, which matters when the whole
 * store is one localStorage key.
 *
 * KEYED BY HREF, so saving twice is idempotent and `has()` is a lookup rather
 * than a scan -- the reader page asks it once per rendered unit, which on a
 * long Bible chapter is a hundred-odd calls per render.
 *
 * Storage failure is swallowed, not surfaced. `writeStoredJson` throws when
 * the quota is exhausted or when a browser is in a mode that refuses
 * persistence; the in-memory `$state` has already been updated by then, so
 * the bookmark works for this session and is simply not there next time.
 * A modal about storage quotas is not the right answer to a reader tapping
 * a bookmark icon.
 */

import { readStoredJson, writeStoredJson } from './storage';
import { parseBookmarkHref, type BookmarkTarget } from './bookmark-target';

const STORAGE_KEY = 'glossa:bookmarks';

export interface Bookmark {
	/** The canonical URL, and this record's key. */
	href: string;
	/** ISO 8601, tie-breaker only -- the library orders canonically. */
	addedAt: string;
}

export interface ResolvedBookmark extends Bookmark {
	target: BookmarkTarget;
}

type BookmarkMap = Record<string, Bookmark>;

/**
 * `readStoredJson` covers unavailable/absent/malformed; what it can't know is
 * our shape. Rows are validated individually rather than the map as a whole,
 * so one bad entry -- a hand-edited value, an address from a future version
 * of the route grammar -- costs that entry and not the reader's whole
 * library. Same posture as `content.svelte.ts`'s `readStored`, one level
 * deeper because this collection grows.
 */
function readStored(): BookmarkMap {
	const parsed = readStoredJson<unknown>(STORAGE_KEY, {});
	if (!parsed || typeof parsed !== 'object') return {};
	const out: BookmarkMap = {};
	for (const [href, row] of Object.entries(parsed as Record<string, unknown>)) {
		if (!row || typeof row !== 'object') continue;
		const addedAt = (row as Bookmark).addedAt;
		if (typeof addedAt !== 'string') continue;
		if (!parseBookmarkHref(href)) continue;
		out[href] = { href, addedAt };
	}
	return out;
}

class BookmarkStore {
	#items: BookmarkMap = $state(readStored());

	has(href: string): boolean {
		return this.#items[href] !== undefined;
	}

	add(href: string): void {
		if (this.has(href) || !parseBookmarkHref(href)) return;
		this.#write({ ...this.#items, [href]: { href, addedAt: new Date().toISOString() } });
	}

	remove(href: string): void {
		if (!this.has(href)) return;
		const next = { ...this.#items };
		delete next[href];
		this.#write(next);
	}

	toggle(href: string): void {
		if (this.has(href)) this.remove(href);
		else this.add(href);
	}

	/** Every bookmark whose address still parses, each with its target. Newest
	 *  first; the library re-sorts canonically within each of its sections. */
	get list(): ResolvedBookmark[] {
		return Object.values(this.#items)
			.map((b) => ({ ...b, target: parseBookmarkHref(b.href) }))
			.filter((b): b is ResolvedBookmark => b.target !== undefined)
			.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
	}

	get count(): number {
		return Object.keys(this.#items).length;
	}

	#write(next: BookmarkMap): void {
		this.#items = next;
		try {
			writeStoredJson(STORAGE_KEY, next);
		} catch {
			// See the module docblock: this session keeps working, next one
			// starts without the row.
		}
	}
}

export const bookmarks = new BookmarkStore();
