/**
 * The offline library's state: what is on the device, measured, and the two
 * actions that change it.
 *
 * The arithmetic is `library.ts`, which a test can reach; this is the part
 * that touches the world — `listContentAssets()`, the content cache, and the
 * worker. Same split, and the same reason, as `sw-policy.ts` under
 * `service-worker.ts`.
 *
 * IT PLANS THE WAVES ON THIS SIDE, which looks like duplication and is not.
 * The worker plans them to FETCH; this plans them to PRICE, before the reader
 * has agreed to anything, and the worker cannot answer a question asked of it
 * before the download exists. What keeps the two honest is that both call
 * `planWaves` over the same inventory with the same `readerPlan()` — the
 * reason that function is exported from `sw.svelte.ts` rather than private to
 * its `#send`.
 *
 * MEASURED FROM THE CACHE, NEVER FROM THE PROGRESS MESSAGES, for the reason
 * `usage.ts`'s `measureLibrary` gives: progress only reports fills that
 * happened while this page was open, and the reader whose library was filled
 * last week is exactly the one the panel has to be right about.
 */

import { listContentAssets } from './corpus-assets';
import { heldPaths, libraryRows, libraryTotal, type LibraryRow } from './library';
import { contentPath, planWaves, type ContentEntry, type WaveId } from './sw-policy';
import { readerPlan, serviceWorker } from './sw.svelte';

/** The worker's content cache. A third copy of the constant — `usage.ts`
 *  documents why it cannot be imported from `service-worker.ts`, and its test
 *  pins the two it knows about. */
const CONTENT_CACHE = 'glossa-content';

class LibraryStore {
	/**
	 * Whether the panel is showing.
	 *
	 * UI state on a data store, deliberately: the control that opens it is a
	 * row in `SettingsMenu`'s popover and the dialog itself is mounted in the
	 * root layout beside the other overlays (it must outlive the popover,
	 * which closes the moment it is used). Two components, one boolean, and
	 * the alternative is a prop threaded through the layout for one flag.
	 */
	open = $state(false);

	rows = $state<LibraryRow[]>([]);
	/** Sums of `rows`, kept beside them so the panel's one summary line and
	 *  its rows can never disagree. */
	total = $state({ bytes: 0, heldBytes: 0, complete: false });
	/** True until the first measurement lands. Distinct from "empty": a panel
	 *  that renders zero rows while it is still counting says the corpus is
	 *  gone. */
	measuring = $state(true);

	/**
	 * Re-read the plan and the cache.
	 *
	 * Called when the panel opens and after every `CACHE_CONTENT:done`. Not on
	 * a timer and not per progress message: `cache.keys()` walks every entry,
	 * which is thousands of them, and a download reports progress dozens of
	 * times a second.
	 */
	async refresh(): Promise<void> {
		try {
			const waves = planWaves(entries(), readerPlan());
			const held = await heldContent();
			this.rows = libraryRows(waves, held);
			this.total = libraryTotal(this.rows);
		} catch {
			// A corpus that is not synced, or storage refused. Rows stay as
			// they were rather than being emptied under the reader.
		} finally {
			this.measuring = false;
		}
	}

	/** Take one wave whole. The reader asked, so the worker does not gate it
	 *  on connection or quota — see `service-worker.ts`'s message handler. */
	download(wave: WaveId): void {
		serviceWorker.requestWave(wave);
	}

	/** Forget everything downloaded. The rows go to zero when the worker
	 *  reports back, not here: this store's numbers are the cache's, and
	 *  guessing them would let the panel and the device disagree. */
	async forget(): Promise<void> {
		serviceWorker.clear();
		// `CLEAR_CONTENT` sends no completion message, so nothing else would
		// re-measure. One read, after the round trip has had a moment.
		await new Promise((resolve) => setTimeout(resolve, 150));
		await this.refresh();
	}
}

/** The inventory, with each URL reduced to the pathname the cache is keyed on
 *  — `partitionAssets` does exactly this in the worker, against
 *  `sw.location.href`; here the document is the base. */
function entries(): ContentEntry[] {
	const baseHref = typeof document === 'undefined' ? '/' : document.baseURI;
	return listContentAssets().map((asset) => ({
		...asset,
		path: contentPath(asset.url, baseHref)
	}));
}

async function heldContent(): Promise<Set<string>> {
	if (typeof caches === 'undefined') return new Set();
	try {
		const cache = await caches.open(CONTENT_CACHE);
		return heldPaths(await cache.keys());
	} catch {
		// Storage denied (private browsing, a browser blocking site data).
		// Nothing is held, which is the truth from where the reader sits.
		return new Set();
	}
}

export const library = new LibraryStore();
