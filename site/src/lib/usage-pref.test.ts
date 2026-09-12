import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The store reads its initial value at MODULE INIT, so each case installs a
 * localStorage stand-in and then imports it fresh. Vitest runs with
 * `environment: 'node'` (`vitest.config.ts`), where there is no real one —
 * which is the case `storage.ts`'s guard exists for and is why the stub has
 * to be a global rather than a fixture passed in.
 */
const store = new Map<string, string>();

beforeEach(() => {
	store.clear();
	vi.resetModules();
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: {
			getItem: (k: string) => store.get(k) ?? null,
			setItem: (k: string, v: string) => void store.set(k, v),
			removeItem: (k: string) => void store.delete(k)
		}
	});
});

afterEach(() => {
	Reflect.deleteProperty(globalThis, 'localStorage');
});

async function load() {
	return (await import('./usage-pref.svelte')).usagePref;
}

describe('the reader’s answer to being counted', () => {
	it('counts a device that has never been asked', async () => {
		expect((await load()).enabled).toBe(true);
	});

	it('remembers a reader who turned it off', async () => {
		store.set('glossa:usage-off', '1');
		expect((await load()).enabled).toBe(false);
	});

	it('stores the choice, not the default', async () => {
		// The key records "off" and nothing records "on": the two-state
		// contract in `storage.ts`, and the reason a reader who never touched
		// the switch and one who turned it back on are the same state.
		const pref = await load();
		pref.set(false);
		expect(store.get('glossa:usage-off')).toBe('1');
		pref.set(true);
		expect(store.has('glossa:usage-off')).toBe(false);
	});

	it('toggles from wherever it was', async () => {
		store.set('glossa:usage-off', '1');
		const pref = await load();
		pref.toggle();
		expect(pref.enabled).toBe(true);
		pref.toggle();
		expect(pref.enabled).toBe(false);
	});
});

describe('the gate the switch actually closes', () => {
	it('is read by the beacon beside offline mode', async () => {
		// `usage.ts`'s `UsageSession` is a browser singleton no test can
		// drive, so what is checked is that the send path consults this store
		// at all — a gate that got dropped would fail nothing else here, and
		// would send a beacon the reader declined.
		const source = (await import('node:fs')).readFileSync('src/lib/usage.ts', 'utf8');
		expect(source).toContain('if (!usagePref.enabled) return;');
	});
});
