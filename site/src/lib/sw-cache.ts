/**
 * The service worker's cache operations, with `caches` and `fetch` passed in.
 *
 * Same motive as `sw-policy.ts`, one layer down: `src/service-worker.ts`
 * cannot be imported by a test, and these are the operations whose failures
 * are least visible and most expensive. Two in particular are promises the
 * project has made in prose and never checked in code:
 *
 *   - a reader's downloaded library survives an app update (`sweepShellCaches`
 *     must not touch the content cache), and
 *   - a failed install never rejects (`precacheShell` swallowing one bad asset
 *     is the difference between a slow load and no offline support at all
 *     until the next deploy).
 *
 * Injecting the environment rather than closing over the globals is what makes
 * both assertable. It costs one parameter at each call site in the worker,
 * which is wiring code either way.
 */

/** Just enough of the worker's globals to do the work, and to fake in a test. */
export interface CacheEnv {
	caches: CacheStorage;
	fetch: typeof fetch;
}

/** One content-tier file, as `sw-policy.ts` plans them. */
export interface CacheableAsset {
	path: string;
	bytes: number;
}

export interface CacheTally {
	count: number;
	bytes: number;
}

/**
 * Delete every versioned shell cache but the current one.
 *
 * The content cache is untouched, and that is the entire point rather than an
 * omission: it is what makes a downloaded book survive a deploy, the same way
 * a reader expects a book they downloaded to stay put across an app update
 * rather than needing a re-download. Returns what it deleted, so the caller
 * can report and a test can assert what it did NOT.
 */
export async function sweepShellCaches(
	env: CacheEnv,
	{ prefix, keep }: { prefix: string; keep: string }
): Promise<string[]> {
	const names = await env.caches.keys();
	const stale = names.filter((name) => name.startsWith(prefix) && name !== keep);
	await Promise.all(stale.map((name) => env.caches.delete(name)));
	return stale;
}

/**
 * Drop content files this build no longer references.
 *
 * "Never swept" is not the same as "never collected". Content URLs are
 * content-hashed, so a re-parsed work changes URL and its old files become
 * unreachable forever; nothing ever removed them, so the cache grew by a
 * corpus generation every time the corpus changed.
 *
 * Safe to run in `activate` because nothing survives it holding a dropped URL.
 * That USED to be a consequence of install never calling `skipWaiting()` —
 * activate meant every client on the old version had already closed — and
 * since 2026-08-28 it is a consequence of what replaced that: every route to
 * activation goes through `$lib/sw.svelte.ts`, every client hears
 * `controllerchange`, and every client answers it by loading the new version
 * (`#land`). The window in which a page holds a URL this build dropped is now
 * the length of that load rather than zero, and a page in it is either hidden
 * or already navigating away.
 */
export async function sweepOrphanedContent(
	env: CacheEnv,
	{ cacheName, live }: { cacheName: string; live: ReadonlySet<string> }
): Promise<number> {
	const cache = await env.caches.open(cacheName);
	const keys = await cache.keys();
	const orphans = keys.filter((request) => !live.has(new URL(request.url).pathname));
	await Promise.all(orphans.map((request) => cache.delete(request)));
	return orphans.length;
}

/**
 * A response that is still legal to hand back for a NAVIGATION later.
 *
 * The host canonicalises `.html` URLs by redirecting: `/offline.html` answers
 * 307 to `/offline` (site/wrangler.jsonc's `html_handling:
 * "auto-trailing-slash"`). `fetch` follows that transparently and the result
 * is a perfectly good 200 — but it carries `redirected: true`, and browsers
 * reject a redirected response passed to `respondWith` for a navigation
 * request. The navigation handler serves the cached `/offline.html` for
 * exactly that, so caching the response as-fetched would arm a failure that
 * only fires on the emergency path: offline, with no cached shell, which is
 * the one moment this fallback exists for.
 *
 * Copying the body into a fresh Response drops the flag. A no-op for every
 * asset the host serves without redirecting, which is all of them but this one.
 */
export async function navigable(response: Response): Promise<Response> {
	if (!response.redirected) return response;
	return new Response(await response.blob(), {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
}

/**
 * Fill the shell cache. NEVER THROWS — every failure is caught per asset.
 *
 * A rejected install handler leaves the worker permanently 'redundant', which
 * for an offline-first PWA means silently losing offline support until the
 * next deploy. One 404 among two hundred assets must not do that, and neither
 * must a `caches.open` that fails outright (storage quota, private browsing).
 */
export async function precacheShell(
	env: CacheEnv,
	{ cacheName, urls }: { cacheName: string; urls: readonly string[] }
): Promise<CacheTally> {
	const tally: CacheTally = { count: 0, bytes: 0 };

	await Promise.all(
		urls.map(async (url) => {
			try {
				const response = await env.fetch(url);
				if (!response.ok) return;
				const cache = await env.caches.open(cacheName);
				await cache.put(url, await navigable(response.clone()));
				tally.count++;
				tally.bytes += Number(response.headers.get('content-length')) || 0;
			} catch (err) {
				console.error('[service-worker] failed to precache', url, err);
			}
		})
	);

	return tally;
}

/**
 * Fetch content files into the content cache, in the order given.
 *
 * Concurrency is capped: a wave can be hundreds of files, and firing all of
 * them at once on a phone on mobile data is a worse experience than a steady
 * queue — and it would compete with the reader's own next-page fetch, which is
 * the request that actually matters.
 *
 * Already-cached files are counted and skipped without a request. That is what
 * makes an interrupted fill resumable: the browser kills a worker with a long
 * `waitUntil` sooner or later, and a later visit replays the same plan and
 * picks up where it stopped.
 *
 * Byte counts come from the inventory rather than from response headers, so a
 * caller can show the real size *before* committing to the download;
 * `content-length` is only knowable after fetching, which is too late to ask.
 */
export async function cacheAssets(
	env: CacheEnv,
	{
		cacheName,
		assets,
		concurrency = 6,
		onProgress
	}: {
		cacheName: string;
		assets: readonly CacheableAsset[];
		concurrency?: number;
		onProgress?: (tally: CacheTally) => void;
	}
): Promise<CacheTally> {
	const cache = await env.caches.open(cacheName);
	const tally: CacheTally = { count: 0, bytes: 0 };
	const queue = [...assets];

	const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
		for (let asset = queue.shift(); asset; asset = queue.shift()) {
			try {
				if (!(await cache.match(asset.path))) {
					const response = await env.fetch(asset.path);
					// A non-ok response is never stored: these URLs are immutable,
					// so a cached transient 404 would be served forever.
					if (!response.ok) continue;
					await cache.put(asset.path, response);
				}
				tally.count++;
				tally.bytes += asset.bytes;
				onProgress?.({ ...tally });
			} catch (err) {
				console.error('[service-worker] failed to cache content', asset.path, err);
			}
		}
	});
	await Promise.all(workers);

	return tally;
}

/** Serve from one cache; network otherwise, so a missing asset degrades to
 *  "this loads slowly" rather than failing outright. */
export async function cacheFirst(
	env: CacheEnv,
	request: Request,
	cacheName: string
): Promise<Response> {
	const cached = await (await env.caches.open(cacheName)).match(request);
	return cached ?? env.fetch(request);
}

/**
 * The status a request refused by offline mode answers with.
 *
 * 504 and not 503: the reader's own switch is a gateway that declines to make
 * the upstream request, which is exactly what a gateway timeout says, and it
 * keeps this distinguishable from `handleNavigate`'s 503 (the worker has
 * nothing cached AND no network — a different failure with a different fix).
 * Nothing in the app branches on the number today; the header below is the
 * signal a caller should read, and the status is what makes `res.ok` false so
 * an unchanged caller fails rather than parsing an empty body.
 */
export const OFFLINE_STATUS = 504;

/** Marks a response as the reader's own choice rather than a broken network. */
export const OFFLINE_HEADER = 'X-Glossa-Offline';

/** The refusal itself. A body would be read by nobody: every consumer of a
 *  content URL parses JSON and checks `ok` first. */
export function offlineRefusal(): Response {
	return new Response(null, {
		status: OFFLINE_STATUS,
		statusText: 'Offline mode',
		headers: { [OFFLINE_HEADER]: '1' }
	});
}

/**
 * Serve from one cache and NEVER reach the network — the offline-mode form of
 * `cacheFirst` and `cacheFirstAndStore` both.
 *
 * A miss is refused rather than fetched, which is the whole point: the reader
 * has asked for no traffic, and quietly fetching "just this one" is the
 * failure this mode exists to prevent. There is nothing to store either, since
 * nothing was fetched — so one function replaces both of the above.
 */
export async function cacheOnly(
	env: CacheEnv,
	request: Request,
	cacheName: string
): Promise<Response> {
	try {
		const cached = await (await env.caches.open(cacheName)).match(request);
		return cached ?? offlineRefusal();
	} catch {
		// Storage refused (private browsing, a browser blocking site data).
		// Refuse rather than fall through to the network: an unreadable cache
		// is not permission to make the request.
		return offlineRefusal();
	}
}

/**
 * Like `cacheFirst`, but stores what it fetches. Used only for corpus content,
 * where "read it once, keep it forever" is the whole caching story: the URLs
 * are content-hashed and the text is immutable, so there is nothing to
 * revalidate and no staleness to reason about.
 */
export async function cacheFirstAndStore(
	env: CacheEnv,
	request: Request,
	cacheName: string
): Promise<Response> {
	const cache = await env.caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;

	const response = await env.fetch(request);
	// Store a clone rather than the response itself; the caller consumes the
	// original body, and a Response body can only be read once. Only when `ok`:
	// an immutable URL that cached a transient 404 would serve it forever.
	if (response.ok) await cache.put(request, response.clone());
	return response;
}
