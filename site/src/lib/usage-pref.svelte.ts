/**
 * The reader's answer to being counted: on unless they say otherwise.
 *
 * WHY A SWITCH AT ALL, when the measurement is already anonymous. Two
 * readers are badly served without one. The first is the person who simply
 * does not want a reading device reporting anything, whatever it reports —
 * the same reader `offline.svelte.ts` exists for, at a finer grain, since
 * offline mode buys that by giving up every download and every update.
 * The second is whoever runs the site: their own devices are the ones that
 * open every work, on every build, from the same place, and a handful of
 * such sessions is the whole difference between a report about readers and
 * a report about the people making it. `?usage=on` makes a beacon
 * deliberate; this is the other direction, and it has to persist.
 *
 * IT DOES NOT STOP THE DEVICE COUNTING ITSELF, only the sending — the same
 * shape as offline mode, and for a reason that matters here. The record in
 * `usage-device.ts` is what makes a returning reader distinguishable from a
 * new one; wiping it on the way out would mean a reader who turns the
 * switch back on reports as a device that has never been here, which is the
 * one number this measurement exists to establish. Nothing local is sent by
 * being kept, and the record expires on its own (`RECORD_MAX_DAYS`).
 *
 * The gate itself is `usage.ts`'s `#send`, where offline mode's is, so a
 * reader who flips this mid-session stops that session's beacon rather than
 * the next one's.
 */

import { readStoredString, writeStoredString } from './storage';

const STORAGE_KEY = 'glossa:usage-off';

class UsagePrefStore {
	/** `true` while this device may send a beacon. On unless the key is
	 *  present and set: an absent or unreadable store is a reader who has
	 *  never touched the switch, and the default is the measured one —
	 *  which is the opposite polarity to what is stored, deliberately, so
	 *  that the state worth recording is the one the reader chose. */
	enabled: boolean = $state(readStoredString(STORAGE_KEY) !== '1');

	set(on: boolean): void {
		this.enabled = on;
		// `undefined` removes the key — `storage.ts`'s two-state contract.
		writeStoredString(STORAGE_KEY, on ? undefined : '1');
	}

	toggle(): void {
		this.set(!this.enabled);
	}
}

export const usagePref = new UsagePrefStore();
