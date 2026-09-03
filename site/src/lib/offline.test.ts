import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { offline, setOfflineObserver } from './offline.svelte';

/**
 * The store is a module-level singleton, like `compare-pref`'s, so every case
 * resets it — and the observer with it, since a leaked one would fire into a
 * finished test.
 */
beforeEach(() => {
	setOfflineObserver(undefined);
	offline.set(false);
});

afterEach(() => {
	setOfflineObserver(undefined);
});

describe('OfflineStore', () => {
	/** The default is the whole safety property: a reader who has never touched
	 *  the switch, and one whose browser refuses storage, both get a working
	 *  site rather than an inexplicably empty one. */
	it('starts off (no localStorage in this test environment, same as SSR)', () => {
		expect(offline.enabled).toBe(false);
	});

	it('toggle() turns on, then off', () => {
		offline.toggle();
		expect(offline.enabled).toBe(true);
		offline.toggle();
		expect(offline.enabled).toBe(false);
	});
});

describe('the observer', () => {
	/** The worker cannot read the preference, so a change that does not reach
	 *  this callback is a worker still fetching after the switch went on. */
	it('reports every change, with the new value', () => {
		const seen: boolean[] = [];
		setOfflineObserver((on) => seen.push(on));

		offline.set(true);
		offline.set(false);

		expect(seen).toEqual([true, false]);
	});

	/** Setting the value it already has is not a change. The message is posted
	 *  on every page start anyway (`sw.svelte.ts`), so a repeat here would only
	 *  add traffic to the one thing that must not add any. */
	it('stays quiet when the value does not move', () => {
		const seen: boolean[] = [];
		setOfflineObserver((on) => seen.push(on));

		offline.set(false);
		offline.set(true);
		offline.set(true);

		expect(seen).toEqual([true]);
	});

	it('is cleared by passing undefined', () => {
		const seen: boolean[] = [];
		setOfflineObserver((on) => seen.push(on));
		setOfflineObserver(undefined);

		offline.set(true);

		expect(seen).toEqual([]);
	});
});
