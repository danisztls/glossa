/**
 * Service worker: offline caching for Glossa Catholica.
 *
 * Two cache tiers, each with a different lifecycle — this split is the
 * organizing idea of the whole file, so it's worth stating up front rather
 * than letting it emerge implicitly from the code below.
 *
 * CONTENT_CACHE — the readable text itself: ~200 content-hashed per-work
 * files (Bible per book, CCC in 100-paragraph chunks, Compendium whole),
 * 16.9 MB raw / ~4.6 MB gzipped in total, filled on demand rather than at
 * install — see the "CONTENT TIER POLICY" block below.
 * Unversioned cache name, never swept by `activate`, evicted only by
 * explicit user action (the browser's own "clear site data", or the
 * CACHE_CONTENT/CLEAR_CONTENT messages at the bottom of this file). This
 * is the tier the "offline-first PWA, entire library on device" commitment
 * (docs/decisions.md, 2026-08-14) is actually about: it should survive
 * routine app updates untouched, the same way a reader expects a book
 * they've downloaded to stay put across app updates rather than needing a
 * re-download every release.
 *
 * SHELL_CACHE — everything needed to boot the app and route around it: the
 * SvelteKit client runtime, route components, CSS, this project's static/
 * assets (manifest, icons, the offline fallback document), plus one
 * deliberate, single prerendered page (the home page) used as the boot
 * document for an offline navigation to a URL that was never fetched before
 * — see `handleNavigate`. Versioned off `$service-worker`'s `version`,
 * wiped and rebuilt on every deploy by `activate`, because none of it is
 * meaningful to keep once a newer copy exists.
 *
 * What's never cached, on purpose: the 6,135 individual prerendered HTML
 * pages this build emits (207 MB of the 240 MB build — see site/README.md
 * "Testing offline behaviour"). They exist for first paint, SEO,
 * and readers with JS disabled — not for the offline path. A reader who
 * goes offline gets the cached shell plus whatever's in CONTENT_CACHE, and
 * the app's own client-side router (which, per src/lib/corpus.ts's
 * docblock, never needs a network round-trip to render a page once that
 * page's data is in memory) renders the actual requested page from there,
 * with no further network request. Precaching the prerendered set would
 * also blow past Cache Storage's quota on constrained browsers for no
 * benefit — iOS Safari evicts caches under pressure starting around 1 GB —
 * since nothing above needs it.
 */

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { base, build, files, version } from '$service-worker';
import { listContentAssets } from '$lib/corpus-index';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CONTENT_CACHE = 'glossa-content';
const SHELL_CACHE = `glossa-shell-${version}`;

// ============================================================================
// CONTENT TIER POLICY — read this before changing what goes in CONTENT_CACHE
// ============================================================================
//
// Corpus content is no longer inlined into the client JS. `sync-corpus.mjs`
// splits it into per-work files (Bible per book, CCC in 100-paragraph
// chunks, Compendium whole) which Vite emits as individually content-hashed
// assets, and `corpus-index.ts` exposes the inventory — URL and byte size
// per file — through `listContentAssets()`. So the two tiers are now
// separated by an explicit list rather than inferred.
//
// (An earlier version of this file classified `build` entries by measured
// response size at install, because the whole corpus sat in one ~18 MB
// chunk and nothing else came within three orders of magnitude of it. That
// heuristic's own comment predicted its death: once the corpus was split,
// nothing crossed the 1 MB threshold and the content tier would have
// silently precached NOTHING — a service worker that installs cleanly,
// reports success, and leaves the reader with no library offline. Explicit
// beats inferred here precisely because the failure mode is invisible.)
//
// WHAT GOES WHERE, AND WHY NOT EVERYTHING AT INSTALL: content is *not*
// precached wholesale. The library is ~4.6 MB gzipped across both
// languages, and downloading all of it uninvited on a first visit is the
// cost the corpus split exists to eliminate. Instead:
//   - install  → shell only (~157 KB gzipped): boot fast, work offline for
//                anything already read.
//   - runtime  → each content file the reader actually opens is stored in
//                CONTENT_CACHE on first read, permanently. Safe to keep
//                forever without revalidation because these URLs are
//                content-hashed: a changed file is a different URL.
//   - explicit → the reader asks for a work (or all of them) via the
//                CACHE_CONTENT message below, which is what makes "the
//                entire library on device" (docs/decisions.md) a deliberate
//                choice rather than a surprise download.
const CONTENT_ASSETS = listContentAssets();

/**
 * Normalize any of the three URL spellings in play to a single comparable
 * pathname. This is load-bearing, not tidiness: the two sides genuinely
 * disagree, and every way they can disagree fails *silently*.
 *
 *   - `$service-worker`'s `build` entries: base-prefixed, root-relative
 *     (`/_app/immutable/assets/x.json`).
 *   - Vite `?url` values from `listContentAssets()`: **document-relative,
 *     no leading slash** (`_app/immutable/assets/x.json`), which the
 *     bundler resolves against `import.meta.url` at runtime — so in a
 *     browser these arrive as fully absolute hrefs.
 *   - `fetch` events: `url.pathname`, always root-relative.
 *
 * Comparing any two of those as raw strings matches nothing, and nothing
 * throws when it doesn't match: content simply never routes to
 * CONTENT_CACHE, and the corpus quietly lands in the shell precache
 * instead. Caught only by running the built worker against stubs.
 */
function contentPath(url: string): string {
	try {
		return new URL(url, sw.location.href).pathname;
	} catch {
		return url.startsWith('/') ? url : `/${url}`;
	}
}

interface ContentEntry {
	workId: string;
	path: string;
	bytes: number;
}

const CONTENT_ENTRIES: ContentEntry[] = CONTENT_ASSETS.map((asset) => ({
	workId: asset.workId,
	path: contentPath(asset.url),
	bytes: asset.bytes
}));

/** Content-file pathnames, for O(1) routing in `fetch`. Empty under fixtures. */
const CONTENT_URLS = new Set(CONTENT_ENTRIES.map((entry) => entry.path));

/**
 * Build output MINUS the corpus.
 *
 * `$service-worker`'s `build` list is *every* emitted build asset, and
 * since the corpus split that includes all ~200 content-hashed corpus JSON
 * files — Vite emits them as ordinary build assets, indistinguishable from
 * app code by URL shape alone. Precaching `build` wholesale would therefore
 * pull the entire ~4.6 MB library at install, into SHELL_CACHE, which
 * `activate` wipes on every deploy: it would undo both of this file's
 * decisions at once (don't download uninvited; content outlives deploys).
 * Verified against a real build — `build` and CONTENT_ASSETS overlap on
 * exactly the 198 content files.
 */
const PRECACHE_BUILD_URLS = build.filter((url) => !CONTENT_URLS.has(contentPath(url)));

/** static/ assets (manifest, icons, offline.html, robots.txt, …) — always shell tier. */
const PRECACHE_FILE_URLS = files;

// One prerendered page, deliberately, used as the offline "boot" document —
// see the file header and handleNavigate. NOT sourced from
// `$service-worker`'s `prerendered` list; that list is exactly what this
// file goes out of its way to avoid touching.
const SHELL_DOCUMENT_URL = `${base}/`;
const OFFLINE_FALLBACK_URL = `${base}/offline.html`;

/**
 * Precache the shell tier: `build` (app code — the corpus is no longer in
 * here, see the policy block) plus `files` plus the one boot document.
 * Content is deliberately not touched; it arrives via `cacheContent` below,
 * either on demand as the reader reads or in bulk when they ask for it.
 *
 * Never throws: every failure is caught and logged so one bad asset can't
 * abort the rest of the pass (see `install`'s comment on why an install
 * handler must never reject).
 */
async function precacheShell(): Promise<{ count: number; bytes: number }> {
	const shell = { count: 0, bytes: 0 };

	await Promise.all(
		[...PRECACHE_BUILD_URLS, ...PRECACHE_FILE_URLS, SHELL_DOCUMENT_URL].map(async (url) => {
			try {
				const response = await fetch(url);
				if (!response.ok) return;
				const cache = await caches.open(SHELL_CACHE);
				await cache.put(url, response.clone());
				shell.count++;
				shell.bytes += Number(response.headers.get('content-length')) || 0;
			} catch (err) {
				console.error('[service-worker] failed to precache', url, err);
			}
		})
	);

	return shell;
}

/**
 * Fetch content files into CONTENT_CACHE — the explicit "make this
 * available offline" operation. `workId` scopes it to one work (the
 * granularity a reader actually thinks in: "the Catechism", "the CPDV
 * Bible"); omitting it takes the whole library.
 *
 * Byte counts come from the inventory rather than from response headers, so
 * a caller can show the real size *before* committing to the download —
 * `content-length` is only knowable after fetching, which is too late to
 * ask "this is 1.6 MB, continue?".
 *
 * Concurrency is capped: the Bible is 73 files per edition, and firing all
 * of them at once on a phone on mobile data is a worse experience than a
 * steady queue.
 */
async function cacheContent(workId?: string): Promise<{ count: number; bytes: number }> {
	const wanted = workId ? CONTENT_ENTRIES.filter((e) => e.workId === workId) : CONTENT_ENTRIES;
	const cache = await caches.open(CONTENT_CACHE);
	const done = { count: 0, bytes: 0 };
	const queue = [...wanted];

	const workers = Array.from({ length: Math.min(6, queue.length) }, async () => {
		for (let asset = queue.shift(); asset; asset = queue.shift()) {
			try {
				if (await cache.match(asset.path)) {
					// Immutable URL already stored — no revalidation, by design.
					done.count++;
					done.bytes += asset.bytes;
					continue;
				}
				const response = await fetch(asset.path);
				if (!response.ok) continue;
				await cache.put(asset.path, response);
				done.count++;
				done.bytes += asset.bytes;
			} catch (err) {
				console.error('[service-worker] failed to cache content', asset.path, err);
			}
		}
	});
	await Promise.all(workers);

	return done;
}

sw.addEventListener('install', (event) => {
	// Guard: a rejected/thrown install handler leaves this worker
	// permanently 'redundant' — for an offline-first PWA that means
	// silently losing offline support until the next deploy. precacheAll()
	// already catches per-asset failures; wrap the call anyway so a failure
	// in caches.open() itself (storage quota, private browsing) still can't
	// make install() reject.
	event.waitUntil(
		(async () => {
			try {
				const shell = await precacheShell();
				console.info(
					`[service-worker] precached shell: ${shell.count} file(s), ${(shell.bytes / 1e6).toFixed(2)} MB. ` +
						`Content tier holds ${CONTENT_ASSETS.length} file(s), fetched on demand.`
				);
			} catch (err) {
				console.error('[service-worker] install failed', err);
			}
		})()
	);

	// Deliberately NOT calling skipWaiting() here. This is a reading site
	// (docs/decisions.md's "Reading mode: continuous, book-like"), and a
	// reader mid-chapter shouldn't have the ground shift under them because
	// a new version activated and started serving different assets to an
	// already-open tab. The new worker waits — the browser's normal
	// behaviour — until every tab on the old version has closed or
	// navigated away, then takes over cleanly for the next visit.
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			try {
				const names = await caches.keys();
				await Promise.all(
					names
						.filter((name) => name.startsWith('glossa-shell-') && name !== SHELL_CACHE)
						.map((name) => caches.delete(name))
				);
				// CONTENT_CACHE is deliberately excluded from this sweep — see
				// the file header. It outlives every deploy until something
				// explicitly clears it.
			} catch (err) {
				console.error('[service-worker] cache cleanup failed', err);
			}
			try {
				// Safe to claim unconditionally here: by the time activate runs,
				// either this is the very first install (nothing to disrupt) or
				// every tab on the old version has already gone away (see the
				// skipWaiting comment in `install`) — so claiming now only
				// affects pages that have no conflicting old worker to be
				// yanked out from under.
				await sw.clients.claim();
			} catch (err) {
				console.error('[service-worker] clients.claim failed', err);
			}
		})()
	);
});

/** Serve from the first cache (in order) that has a match; network otherwise. */
async function cacheFirst(request: Request, cacheNames: string[]): Promise<Response> {
	for (const name of cacheNames) {
		const cached = await (await caches.open(name)).match(request);
		if (cached) return cached;
	}
	// Not precached (a partially-failed install, or the browser evicted it
	// under storage pressure) — fall back to network so a missing asset
	// degrades to "this one script/style loads slowly" rather than failing
	// outright.
	return fetch(request);
}

/**
 * Like `cacheFirst`, but stores what it fetches. Used only for corpus
 * content, where "read it once, keep it forever" is the whole caching
 * story: the URLs are content-hashed and the text is immutable, so there is
 * nothing to revalidate and no staleness to reason about.
 */
async function cacheFirstAndStore(request: Request, cacheName: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);
	if (cached) return cached;

	const response = await fetch(request);
	// Store a clone rather than the response itself; the caller consumes the
	// original body, and a Response body can only be read once.
	if (response.ok) await cache.put(request, response.clone());
	return response;
}

/**
 * Full-page navigations: try the network first — while online this is the
 * normal, freshest path, and the one search engines and no-JS readers use
 * (see the file header on why prerendered pages aren't precached). Only on
 * network failure does this reach for the cached shell: the app boots from
 * it, and its client-side router (see src/lib/corpus.ts) renders the
 * actually-requested page from CONTENT_CACHE with no further network
 * request. Svelte recovers from the shell's markup not matching the
 * requested route the same way adapter-static's own SPA `fallback` option
 * would — this app doesn't use that option (see vite.config.ts's
 * `fallback: undefined` and its "fully static output" comment: every route
 * is meant to prerender for real, loudly, or fail the build) — so this is
 * the same fallback mechanism applied by hand, for exactly one page,
 * instead of enabled site-wide.
 */
async function handleNavigate(request: Request): Promise<Response> {
	try {
		return await fetch(request);
	} catch {
		const shell = await caches.match(SHELL_DOCUMENT_URL);
		if (shell) return shell;
		const offline = await caches.match(OFFLINE_FALLBACK_URL);
		if (offline) return offline;
		// Both precache candidates missing (a badly failed install) — this is
		// the only place this file constructs a response by hand rather than
		// serving a cached one.
		return new Response('Offline, and no cached copy of Glossa Catholica is available.', {
			status: 503,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' }
		});
	}
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;

	// Never cache non-GET requests — the site makes none itself (no forms,
	// no mutation; see docs/decisions.md's account-free posture), but stay
	// defensive rather than caching e.g. a hypothetical future POST by
	// accident.
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// Never touch cross-origin requests, and in particular never cache an
	// opaque cross-origin response (one whose success/failure this worker
	// can't inspect). The site makes no cross-origin requests at all — see
	// docs/decisions.md's "Icon library: Lucide" entry, which picked inline
	// SVG specifically to avoid a webfont fetch — so this branch is never
	// exercised today, but it's cheap insurance against that changing
	// silently later.
	if (url.origin !== sw.location.origin) return;

	// Corpus content: serve from CONTENT_CACHE, and store it there on the
	// first read so ordinary reading builds up an offline library without
	// the reader doing anything. Permanent and never revalidated — these
	// URLs are content-hashed, so a changed file is a different URL.
	if (CONTENT_URLS.has(url.pathname)) {
		event.respondWith(cacheFirstAndStore(request, CONTENT_CACHE));
		return;
	}

	if (PRECACHE_BUILD_URLS.includes(url.pathname)) {
		event.respondWith(cacheFirst(request, [SHELL_CACHE]));
		return;
	}

	if (PRECACHE_FILE_URLS.includes(url.pathname) || url.pathname === SHELL_DOCUMENT_URL) {
		event.respondWith(cacheFirst(request, [SHELL_CACHE]));
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(handleNavigate(request));
		return;
	}

	// Everything else falling through here (there is currently no other
	// request shape the app makes) is left to the network unmodified.
});

/**
 * Sketch of a future explicit "make this work available offline" control
 * (docs/decisions.md, 2026-08-15 offline entry) — not wired to any UI yet.
 * The contract: a page posts `{ type: 'CACHE_CONTENT' }` or
 * `{ type: 'CLEAR_CONTENT' }` via
 * `navigator.serviceWorker.controller?.postMessage(...)`; this worker does
 * the caching/eviction and, for CACHE_CONTENT, posts a
 * `{ type: 'CACHE_CONTENT:done', count, bytes }` message back to every open
 * client so a picker UI can update its state without polling.
 *
 * Per-work granularity is real now that the corpus is split: pass a
 * `workId` to take just that work (~1.6-1.7 MB gzipped for a complete Bible
 * edition, well under 1 MB for the CCC or the Compendium alone), or omit it
 * for the whole library. `listContentAssets()` carries the byte size of
 * every file, so a picker can show what a work costs *before* the reader
 * commits — see `cacheContent`.
 */
sw.addEventListener('message', (event) => {
	const data = event.data as { type?: string; workId?: string } | undefined;
	if (!data || typeof data.type !== 'string') return;

	if (data.type === 'CACHE_CONTENT') {
		event.waitUntil(
			(async () => {
				const result = await cacheContent(data.workId);
				const clients = await sw.clients.matchAll();
				for (const client of clients) {
					client.postMessage({ type: 'CACHE_CONTENT:done', workId: data.workId, ...result });
				}
			})()
		);
	} else if (data.type === 'CLEAR_CONTENT') {
		event.waitUntil(caches.delete(CONTENT_CACHE));
	}
});
