/**
 * Offline mode: the reader's declaration that this device is to make no
 * network request at all.
 *
 * WHAT IT IS NOT. The site is already offline-FIRST — the shell is precached,
 * content is stored on first read and the library can be filled ahead of time
 * — so a reader who loses their connection keeps reading. That is the app
 * coping with a network that went away. This is the opposite direction: the
 * network is there and the reader has asked us not to touch it. A metered
 * connection abroad, a flight, a rationed data plan, or simply not wanting a
 * reading device to talk to a server.
 *
 * WHAT IT SWITCHES OFF. Everything, in three places, each of which has to be
 * gated separately because each is a different mechanism:
 *
 *   - `sw.svelte.ts` — the update check (`registration.update()`), the offer
 *     and the apply, and every download request the page makes of the worker
 *     (the automatic waves, the font warming that rides along with them).
 *   - `service-worker.ts` — the fetch handler serves cache-only: a content
 *     file that is not on the device is refused rather than fetched, and a
 *     navigation is answered from the cached shell without a network attempt.
 *     That is the half that holds for requests no application code issues —
 *     an `<img>`, a font, a document load.
 *   - `usage.ts` — the beacon does not send. The session is still counted on
 *     the device; only the request is withheld.
 *
 * THE WORKER CANNOT READ THIS. `localStorage` does not exist in a service
 * worker, and the worker outlives the page — so the flag is mirrored into a
 * cache entry the worker owns (`OFFLINE_MODE` in `service-worker.ts`), and
 * that mirror, not this store, is what answers the document request of a cold
 * start. This module is the reader's copy: it is what the switch shows, what
 * the client-side gates read, and the thing that tells the worker when it
 * changes.
 *
 * THE OBSERVER RATHER THAN AN IMPORT. `sw.svelte.ts` is the only module with a
 * channel to the worker, and it already imports plenty; if this module
 * imported it back, the two would be a cycle — and a preference store that
 * drags the whole service-worker conversation in behind it is not something
 * `usage.ts` or a component should have to pay for. Same shape, and the same
 * argument, as `corpus.ts`'s `setContentReadObserver`.
 */

import { readStoredString, writeStoredString } from './storage';

const STORAGE_KEY = 'glossa:offline';

/** Notified whenever the preference changes, with the new value. */
export type OfflineObserver = (enabled: boolean) => void;

let observer: OfflineObserver | undefined;

/** Register the one observer — `serviceWorker.start()` — or clear it with
 *  `undefined` on teardown. One, not a list: there is exactly one consumer,
 *  and a set of subscribers would be a lifecycle to get wrong for no gain. */
export function setOfflineObserver(next: OfflineObserver | undefined): void {
	observer = next;
}

class OfflineStore {
	/** `true` while the reader has asked for no network. Off unless the key is
	 *  present and set: an absent or unreadable store is a reader who has never
	 *  touched the switch, and the default has to be the connected one. */
	enabled: boolean = $state(readStoredString(STORAGE_KEY) === '1');

	set(on: boolean): void {
		const changed = on !== this.enabled;
		this.enabled = on;
		// `undefined` removes the key — `storage.ts`'s two-state contract, and
		// the reason "never chose" and "chose off" are the same state here.
		writeStoredString(STORAGE_KEY, on ? '1' : undefined);
		if (changed) observer?.(on);
	}

	toggle(): void {
		this.set(!this.enabled);
	}
}

export const offline = new OfflineStore();
