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
import { bookFromLegacySlug, bookSlug, parseHref, type Address } from './address';

const STORAGE_KEY = 'glossa:bookmarks';

export interface Bookmark {
	/** The canonical URL, and this record's key. */
	href: string;
	/** ISO 8601, tie-breaker only -- the library orders canonically. */
	addedAt: string;
}

export interface ResolvedBookmark extends Bookmark {
	target: Address;
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
		const migrated = migrateBibleHref(href);
		if (!parseHref(migrated)) continue;
		out[migrated] = { href: migrated, addedAt };
	}
	return out;
}

/**
 * The OSIS book spelling a Bible address used before 2026-09-02.
 *
 * WITHOUT THIS EVERY BIBLE BOOKMARK VANISHES SILENTLY, which is what makes it
 * worth the twelve lines: this store is keyed by the raw href and `readStored`
 * drops anything the current grammar rejects -- deliberately, because that is
 * how a hand-edited row or a retired address costs one entry instead of the
 * library. A grammar change is the one case where that tolerance is wrong,
 * and the Compendium's and the Summa's moves both simply accepted the loss.
 * The set here is far larger, and the rewrite is mechanical.
 *
 * It reads `bookFromLegacySlug` for the same reason `src/worker.ts` does: the
 * old vocabulary lives OUTSIDE `parseHref`, so the grammar keeps exactly one
 * spelling per address and only the two doormats know a second.
 *
 * The migrated map is written back on the next mutation, not eagerly -- a
 * reader who never touches a bookmark again keeps the old rows on disk and
 * reads them through this on every load, which costs one regex per row and
 * never a write they did not ask for.
 */
export function migrateBibleHref(href: string): string {
	const m = /^(\/scriptura\/)([a-z0-9]+)(\/\d+(?:[?#].*)?)$/.exec(href);
	if (!m) return href;
	const osis = bookFromLegacySlug(m[2]);
	return osis === undefined ? href : `${m[1]}${bookSlug(osis)}${m[3]}`;
}

class BookmarkStore {
	#items: BookmarkMap = $state(readStored());

	has(href: string): boolean {
		return this.#items[href] !== undefined;
	}

	add(href: string): void {
		if (this.has(href) || !parseHref(href)) return;
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
			.map((b) => ({ ...b, target: parseHref(b.href) }))
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
