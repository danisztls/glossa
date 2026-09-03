import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	cacheAssets,
	cacheFirst,
	cacheFirstAndStore,
	cacheOnly,
	navigable,
	OFFLINE_HEADER,
	OFFLINE_STATUS,
	precacheShell,
	sweepOrphanedContent,
	sweepShellCaches,
	type CacheEnv
} from './sw-cache';

/**
 * Cache behaviour, against an in-memory `CacheStorage`.
 *
 * These cover the promises the project states in prose and had never checked:
 * that a reader's downloaded library survives a deploy, that a failed install
 * cannot cost them offline support entirely, and that an immutable URL never
 * caches a transient failure. Each one fails silently in production — the
 * worker installs, reports success, and the reader simply finds their library
 * gone.
 */

// --- A fake CacheStorage --------------------------------------------------
//
// Deliberately minimal, and keyed on the request URL alone: the real Cache API
// matches on more than that (Vary, method, query handling), but nothing here
// depends on those, and a faithful reimplementation would be a second thing to
// keep correct.

const ORIGIN = 'https://glossacatholica.org';

function urlOf(request: RequestInfo | URL): string {
	if (typeof request === 'string') return new URL(request, ORIGIN).href;
	if (request instanceof URL) return request.href;
	return new URL((request as Request).url, ORIGIN).href;
}

class FakeCache {
	store = new Map<string, Response>();

	async match(request: RequestInfo | URL): Promise<Response | undefined> {
		return this.store.get(urlOf(request));
	}
	async put(request: RequestInfo | URL, response: Response): Promise<void> {
		this.store.set(urlOf(request), response);
	}
	async delete(request: RequestInfo | URL): Promise<boolean> {
		return this.store.delete(urlOf(request));
	}
	async keys(): Promise<Request[]> {
		return [...this.store.keys()].map((url) => new Request(url));
	}
}

class FakeCacheStorage {
	caches = new Map<string, FakeCache>();

	async open(name: string): Promise<FakeCache> {
		let cache = this.caches.get(name);
		if (!cache) this.caches.set(name, (cache = new FakeCache()));
		return cache;
	}
	async keys(): Promise<string[]> {
		return [...this.caches.keys()];
	}
	async delete(name: string): Promise<boolean> {
		return this.caches.delete(name);
	}
	async match(): Promise<Response | undefined> {
		return undefined;
	}
}

let storage: FakeCacheStorage;
let fetched: string[];
let env: CacheEnv;

/** Default: every URL answers 200. Individual tests override. */
function makeEnv(handler?: (url: string) => Response): CacheEnv {
	return {
		caches: storage as unknown as CacheStorage,
		fetch: (async (input: RequestInfo | URL) => {
			const url = urlOf(input);
			fetched.push(new URL(url).pathname);
			return handler ? handler(new URL(url).pathname) : new Response('ok');
		}) as typeof fetch
	};
}

beforeEach(() => {
	storage = new FakeCacheStorage();
	fetched = [];
	env = makeEnv();
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('sweepShellCaches', () => {
	/**
	 * The promise this whole two-tier design exists to keep: a reader who has
	 * downloaded the Catechism should still have it after an app update, the
	 * same way a downloaded book stays put. Nothing asserted it before.
	 */
	it('never touches the content cache', async () => {
		await storage.open('glossa-content').then((c) => c.put('/text.json', new Response('x')));
		await storage.open('glossa-shell-old');
		await storage.open('glossa-shell-new');

		await sweepShellCaches(env, { prefix: 'glossa-shell-', keep: 'glossa-shell-new' });

		expect(await storage.keys()).toContain('glossa-content');
		expect((await storage.open('glossa-content')).store.size).toBe(1);
	});

	it('deletes every superseded shell cache and keeps the current one', async () => {
		await storage.open('glossa-shell-a');
		await storage.open('glossa-shell-b');
		await storage.open('glossa-shell-c');

		const deleted = await sweepShellCaches(env, {
			prefix: 'glossa-shell-',
			keep: 'glossa-shell-c'
		});

		expect(deleted.sort()).toEqual(['glossa-shell-a', 'glossa-shell-b']);
		expect(await storage.keys()).toEqual(['glossa-shell-c']);
	});

	it('leaves an unrelated cache alone', async () => {
		await storage.open('some-other-cache');
		await sweepShellCaches(env, { prefix: 'glossa-shell-', keep: 'glossa-shell-x' });
		expect(await storage.keys()).toContain('some-other-cache');
	});
});

describe('sweepOrphanedContent', () => {
	/**
	 * Content URLs are content-hashed, so a re-parsed work changes URL and its
	 * old files become unreachable forever. Nothing removed them, so the cache
	 * grew by a corpus generation every time the corpus changed.
	 */
	it('drops files this build no longer references', async () => {
		const cache = await storage.open('glossa-content');
		await cache.put('/live.json', new Response('a'));
		await cache.put('/orphan.json', new Response('b'));

		const dropped = await sweepOrphanedContent(env, {
			cacheName: 'glossa-content',
			live: new Set(['/live.json'])
		});

		expect(dropped).toBe(1);
		expect(await cache.match('/live.json')).toBeDefined();
		expect(await cache.match('/orphan.json')).toBeUndefined();
	});

	it('is a no-op when everything cached is still referenced', async () => {
		const cache = await storage.open('glossa-content');
		await cache.put('/live.json', new Response('a'));

		expect(
			await sweepOrphanedContent(env, {
				cacheName: 'glossa-content',
				live: new Set(['/live.json', '/not-yet-downloaded.json'])
			})
		).toBe(0);
		expect(cache.store.size).toBe(1);
	});
});

describe('precacheShell', () => {
	/**
	 * A rejected install handler leaves the worker permanently 'redundant',
	 * which for an offline-first PWA means silently losing offline support
	 * until the next deploy. The invariant was stated in a comment and enforced
	 * nowhere.
	 */
	it('never rejects when one asset 404s', async () => {
		env = makeEnv((path) =>
			path === '/missing.js' ? new Response('', { status: 404 }) : new Response('ok')
		);

		const tally = await precacheShell(env, {
			cacheName: 'shell',
			urls: ['/a.js', '/missing.js', '/b.js']
		});

		expect(tally.count).toBe(2);
		expect((await storage.open('shell')).store.size).toBe(2);
	});

	it('never rejects when fetch itself throws', async () => {
		env = {
			caches: storage as unknown as CacheStorage,
			fetch: (async (input: RequestInfo | URL) => {
				if (urlOf(input).endsWith('/boom.js')) throw new Error('network down');
				return new Response('ok');
			}) as typeof fetch
		};

		await expect(
			precacheShell(env, { cacheName: 'shell', urls: ['/a.js', '/boom.js'] })
		).resolves.toMatchObject({ count: 1 });
	});

	it('never rejects when the cache itself is unavailable', async () => {
		env = {
			caches: {
				open: async () => {
					throw new Error('QuotaExceededError');
				},
				keys: async () => [],
				delete: async () => false,
				match: async () => undefined
			} as unknown as CacheStorage,
			fetch: (async () => new Response('ok')) as typeof fetch
		};

		await expect(
			precacheShell(env, { cacheName: 'shell', urls: ['/a.js'] })
		).resolves.toMatchObject({ count: 0 });
	});
});

describe('cacheAssets', () => {
	it('stores what it fetches and counts the inventory bytes, not the response', async () => {
		const tally = await cacheAssets(env, {
			cacheName: 'content',
			assets: [
				{ path: '/a.json', bytes: 1000 },
				{ path: '/b.json', bytes: 2000 }
			]
		});

		expect(tally).toEqual({ count: 2, bytes: 3000 });
		expect(fetched.sort()).toEqual(['/a.json', '/b.json']);
	});

	/** What makes an interrupted fill resumable: the browser kills a worker with
	 *  a long `waitUntil` sooner or later, and the next visit replays the plan. */
	it('resumes, requesting only what is missing', async () => {
		const cache = await storage.open('content');
		await cache.put('/a.json', new Response('already here'));

		const tally = await cacheAssets(env, {
			cacheName: 'content',
			assets: [
				{ path: '/a.json', bytes: 1000 },
				{ path: '/b.json', bytes: 2000 }
			]
		});

		// Both counted — the reader has both — but only one was fetched.
		expect(tally).toEqual({ count: 2, bytes: 3000 });
		expect(fetched).toEqual(['/b.json']);
	});

	/** These URLs are immutable, so a cached 404 would be served forever. */
	it('never stores a non-ok response', async () => {
		env = makeEnv(() => new Response('', { status: 503 }));
		const tally = await cacheAssets(env, {
			cacheName: 'content',
			assets: [{ path: '/a.json', bytes: 1000 }]
		});
		expect(tally.count).toBe(0);
		expect((await storage.open('content')).store.size).toBe(0);
	});

	it('keeps going when one asset fails', async () => {
		env = makeEnv((path) =>
			path === '/bad.json' ? new Response('', { status: 500 }) : new Response('ok')
		);
		const tally = await cacheAssets(env, {
			cacheName: 'content',
			assets: [
				{ path: '/a.json', bytes: 1 },
				{ path: '/bad.json', bytes: 1 },
				{ path: '/c.json', bytes: 1 }
			]
		});
		expect(tally.count).toBe(2);
	});

	it('reports progress as it goes, not only at the end', async () => {
		const seen: number[] = [];
		await cacheAssets(env, {
			cacheName: 'content',
			concurrency: 1,
			assets: [
				{ path: '/a.json', bytes: 10 },
				{ path: '/b.json', bytes: 20 },
				{ path: '/c.json', bytes: 30 }
			],
			onProgress: ({ bytes }) => seen.push(bytes)
		});
		expect(seen).toEqual([10, 30, 60]);
	});

	it('caps concurrency', async () => {
		let inFlight = 0;
		let peak = 0;
		env = {
			caches: storage as unknown as CacheStorage,
			fetch: (async () => {
				peak = Math.max(peak, ++inFlight);
				await Promise.resolve();
				inFlight--;
				return new Response('ok');
			}) as typeof fetch
		};

		await cacheAssets(env, {
			cacheName: 'content',
			concurrency: 2,
			assets: Array.from({ length: 10 }, (_, i) => ({ path: `/${i}.json`, bytes: 1 }))
		});

		expect(peak).toBeLessThanOrEqual(2);
	});
});

describe('cacheFirst', () => {
	it('serves the cached copy without a request', async () => {
		await (await storage.open('shell')).put('/app.js', new Response('cached'));
		const response = await cacheFirst(env, new Request(`${ORIGIN}/app.js`), 'shell');
		expect(await response.text()).toBe('cached');
		expect(fetched).toEqual([]);
	});

	/** A missing precached asset must degrade to "this loads slowly", not to a
	 *  failed page. */
	it('falls back to the network on a miss', async () => {
		const response = await cacheFirst(env, new Request(`${ORIGIN}/app.js`), 'shell');
		expect(await response.text()).toBe('ok');
		expect(fetched).toEqual(['/app.js']);
	});
});

describe('cacheFirstAndStore', () => {
	it('issues exactly one request for two reads of the same URL', async () => {
		const request = () => new Request(`${ORIGIN}/text.json`);
		expect(await (await cacheFirstAndStore(env, request(), 'content')).text()).toBe('ok');
		expect(await (await cacheFirstAndStore(env, request(), 'content')).text()).toBe('ok');
		expect(fetched).toEqual(['/text.json']);
	});

	it('never caches a non-ok response', async () => {
		env = makeEnv(() => new Response('nope', { status: 404 }));
		const response = await cacheFirstAndStore(env, new Request(`${ORIGIN}/text.json`), 'content');
		expect(response.status).toBe(404);
		expect((await storage.open('content')).store.size).toBe(0);
	});
});

/**
 * OFFLINE MODE's whole mechanism at this layer. The failure it guards against
 * is the quiet one: a cache-only path that falls through to the network on any
 * unexpected condition still works, still looks right, and silently breaks the
 * only promise the switch makes.
 */
describe('cacheOnly', () => {
	it('serves the cached copy', async () => {
		await (await storage.open('content')).put('/text.json', new Response('cached'));
		const response = await cacheOnly(env, new Request(`${ORIGIN}/text.json`), 'content');
		expect(await response.text()).toBe('cached');
		expect(fetched).toEqual([]);
	});

	it('refuses a miss instead of fetching it', async () => {
		const response = await cacheOnly(env, new Request(`${ORIGIN}/text.json`), 'content');
		expect(response.status).toBe(OFFLINE_STATUS);
		expect(response.headers.get(OFFLINE_HEADER)).toBe('1');
		expect(response.ok).toBe(false);
		expect(fetched).toEqual([]);
	});

	/** An unreadable cache is not permission to make the request — the one
	 *  direction this must never fail in. */
	it('refuses rather than falling through when storage throws', async () => {
		env = {
			...makeEnv(),
			caches: {
				open: () => Promise.reject(new Error('storage denied'))
			} as unknown as CacheStorage
		};
		const response = await cacheOnly(env, new Request(`${ORIGIN}/text.json`), 'content');
		expect(response.status).toBe(OFFLINE_STATUS);
		expect(fetched).toEqual([]);
	});
});

describe('navigable', () => {
	/**
	 * A redirected response passed to `respondWith` for a navigation is
	 * rejected by the browser. The offline fallback is fetched through the
	 * host's `.html` canonicalisation redirect, so caching it as-fetched arms a
	 * failure that fires only on the emergency path — offline, with no cached
	 * shell, which is the one moment the fallback exists for.
	 */
	it('copies a redirected response into one that is legal for a navigation', async () => {
		const redirected = new Response('offline page', {
			status: 200,
			statusText: 'OK',
			headers: { 'Content-Type': 'text/html' }
		});
		Object.defineProperty(redirected, 'redirected', { value: true });

		const copy = await navigable(redirected);

		expect(copy.redirected).toBe(false);
		expect(copy.status).toBe(200);
		expect(copy.headers.get('Content-Type')).toBe('text/html');
		expect(await copy.text()).toBe('offline page');
	});

	it('passes an ordinary response straight through', async () => {
		const plain = new Response('x');
		expect(await navigable(plain)).toBe(plain);
	});
});
