/**
 * Service worker: offline caching for Glossa Catholica.
 *
 * This file is event wiring and I/O. Every *decision* it makes — which URLs
 * are corpus content, which are shell, what a given request should do, and
 * what order the library downloads in — lives in `$lib/sw-policy`, which a
 * test can import. See that file's docblock for why the split exists; the
 * short version is that this one cannot be imported at all (it reads
 * `$service-worker` at module scope and registers listeners on load), and its
 * whole failure mode is silent.
 *
 * Two cache tiers, each with a different lifecycle — this split is the
 * organizing idea of the whole file, so it's worth stating up front rather
 * than letting it emerge implicitly from the code below.
 *
 * CONTENT_CACHE — the readable text itself: content-hashed per-work files
 * (Bible per 20-chapter chunk, CCC per 100 paragraphs, Compendium per 100
 * questions, documents per 50 sections, one file per Summa question), 82.6 MB
 * raw / ~26 MB gzipped in total across fourteen languages. Filled in ordered
 * waves rather than wholesale — see `planWaves` and the "CONTENT TIER POLICY"
 * block below. Unversioned cache name, never swept by `activate` except to
 * drop files this build no longer references, and otherwise evicted only by
 * the browser's own "clear site data" or `CLEAR_CONTENT`. This is the tier the
 * "offline-first PWA" commitment is actually about: it should survive routine
 * app updates untouched, the same way a reader expects a book they've
 * downloaded to stay put across an app update rather than needing a
 * re-download.
 *
 * SHELL_CACHE — everything needed to boot the app and route around it: the
 * SvelteKit client runtime, route components, CSS, this project's static/
 * assets (manifest, icons, the offline fallback document), plus the SPA shell
 * used as the boot document for any offline navigation — see `handleNavigate`.
 * Versioned off `$service-worker`'s `version`, wiped and rebuilt on every
 * deploy by `activate`, because none of it is meaningful to keep once a newer
 * copy exists.
 *
 * There is no separate page tier: the SPA has one shell. A reader who goes
 * offline gets that cached shell plus whatever is in CONTENT_CACHE, and the
 * client router renders the requested canonical path from there.
 *
 * OFFLINE MODE is the reader asking for that state deliberately while the
 * network is still there — see the block on it below, and
 * `$lib/offline.svelte.ts` for the whole feature. Two things it cannot stop,
 * and both belong to the browser rather than to this file: the periodic
 * byte-check of this script (the browser makes it on its own schedule, on
 * navigation), and the `install` below, which runs if that check finds a new
 * version. The precache is deliberately NOT gated on the flag: a worker that
 * activates with an empty shell cache is an app that cannot boot at all, which
 * is a far worse answer to "make no requests" than one 157 KB install the
 * reader did not ask for.
 */

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { base, build, files, version } from '$service-worker';
import { listContentAssets } from '$lib/corpus-assets';
import {
	assetsForWork,
	fontsForLangs,
	partitionAssets,
	planWaves,
	routeFor,
	type Wave,
	type WaveRequest
} from '$lib/sw-policy';
import {
	cacheAssets,
	cacheFirst,
	cacheFirstAndStore,
	cacheOnly,
	offlineRefusal,
	precacheShell,
	sweepOrphanedContent,
	sweepShellCaches,
	type CacheEnv
} from '$lib/sw-cache';

const sw = self as unknown as ServiceWorkerGlobalScope;

/** The globals `sw-cache.ts` operates on, passed rather than closed over so
 *  those operations can be exercised against a fake — see its docblock. */
const env: CacheEnv = { caches, fetch: (input, init) => fetch(input, init) };

const CONTENT_CACHE = 'glossa-content';
const SHELL_CACHE = `glossa-shell-${version}`;

// ============================================================================
// OFFLINE MODE — the reader's switch, mirrored where the worker can read it
// ============================================================================
//
// `$lib/offline.svelte.ts` holds the preference; this is the half that stops
// the requests no application code issues. When it is on, every branch of the
// fetch handler below serves cache-only and every download message is dropped.
//
// IT HAS TO BE PERSISTED, AND NOT MERELY POSTED. A worker is killed and
// restarted freely, and the request that matters most — the document of a cold
// start — is answered BEFORE any page script runs to tell it anything. So the
// flag lives in a cache of its own: `caches` is the only storage a service
// worker and a page both have, `localStorage` being absent here. Its own cache
// and not a key in one of the two tiers, because `activate` sweeps both and a
// preference is neither shell nor content.
//
// The read is a promise resolved once per worker instance; `isOffline()` is
// what every branch awaits, so the answer costs one microtask after the first
// request. `offlineMode` is also read directly, in the one place that has to
// decide synchronously — see the `passthrough` branch.
const PREF_CACHE = 'glossa-prefs';
/** Never fetched: a cache key is a URL, and this one names no asset. */
const OFFLINE_FLAG_URL = `${base}/__offline-mode`;

let offlineMode = false;

const offlineReady: Promise<void> = (async () => {
	try {
		const cache = await caches.open(PREF_CACHE);
		offlineMode = (await cache.match(OFFLINE_FLAG_URL)) !== undefined;
	} catch {
		// Storage refused. Off is the safe direction: the reader keeps a
		// working site rather than an inexplicably empty one.
	}
})();

async function isOffline(): Promise<boolean> {
	await offlineReady;
	return offlineMode;
}

/** Record the reader's switch. In memory first, so the very next request in
 *  this event loop already obeys it, and in the cache for the next worker. */
async function setOfflineMode(on: boolean): Promise<void> {
	offlineMode = on;
	try {
		const cache = await caches.open(PREF_CACHE);
		if (on) await cache.put(OFFLINE_FLAG_URL, new Response('1'));
		else await cache.delete(OFFLINE_FLAG_URL);
	} catch {
		// The in-memory flag still holds for the life of this worker; what is
		// lost is the answer a restarted one starts from.
	}
}

// ============================================================================
// CONTENT TIER POLICY — read this before changing what goes in CONTENT_CACHE
// ============================================================================
//
// `sync-corpus.mjs` splits the corpus into per-work chunk files which Vite
// emits as individually content-hashed assets, and `corpus-index.ts` exposes
// the inventory — URL, byte size, work, kind and language per file — through
// `listContentAssets()`. So the two tiers are separated by an explicit list
// rather than inferred.
//
// (An earlier version of this file classified `build` entries by measured
// response size at install, because the whole corpus sat in one ~18 MB chunk
// and nothing else came within three orders of magnitude of it. That
// heuristic's own comment predicted its death: once the corpus was split,
// nothing crossed the 1 MB threshold and the content tier would have silently
// precached NOTHING — a service worker that installs cleanly, reports success,
// and leaves the reader with no library offline. Explicit beats inferred here
// precisely because the failure mode is invisible.)
//
// WHAT GOES WHERE, AND WHY NOT EVERYTHING AT INSTALL:
//   - install  → shell only: boot fast, work offline for anything already read.
//   - runtime  → each content file the reader actually opens is stored in
//                CONTENT_CACHE on first read, permanently. Safe to keep forever
//                without revalidation because these URLs are content-hashed: a
//                changed file is a different URL.
//   - deferred → after first render the layout sends CACHE_CONTENT with the
//                reader's language chain, the editions they picked themselves
//                and what they have open. The worker fills the AUTOMATIC part
//                of the AUTOMATIC waves (`planWaves`, and `autoAssets` for the
//                Catechism, which is one edition of eight) and stops. The rest
//                is reachable, but only by asking: CACHE_WAVE for a wave,
//                CACHE_CONTENT with a `workId` for one work.
//
// Until 2026-08-25 that last step took the WHOLE library in EVERY language,
// on every visit, 1.5s after first render: 2,236 files and ~26 MB gzipped, to
// a reader who had opened one prayer. The header of this file said 4.6 MB,
// which had been true a corpus ago.
const partition = partitionAssets({
	build,
	files,
	base,
	contentAssets: listContentAssets(),
	baseHref: sw.location.href
});

/** Progress, reported to every open client so a UI need not poll. */
function announce(message: Record<string, unknown>): Promise<void> {
	return sw.clients.matchAll().then((clients) => {
		for (const client of clients) client.postMessage(message);
	});
}

/**
 * Report a failure that leaves the reader without the library this worker just
 * reported installing — the silent failure `sw-policy.ts`'s docblock names
 * ("installs cleanly, reports success, and leaves the reader with no library
 * offline") and which, until this existed, went to `console.error` and nowhere
 * a reader or a maintainer would ever see it.
 *
 * `includeUncontrolled`, unlike `announce`: on a FIRST install there is no
 * controlled client yet, and the page that registered this worker is exactly
 * the one that should hear about it. A failure with no page open at all is
 * still missed, which is the honest limit of reporting from here.
 */
function announceFailure(reason: string): Promise<void> {
	return sw.clients
		.matchAll({ includeUncontrolled: true })
		.then((clients) => {
			for (const client of clients) client.postMessage({ type: 'SW:install-failed', reason });
		})
		.catch(() => {});
}

/** Why an install failed, in the vocabulary `usage-schema.ts` accepts. A failed
 *  `fetch` in a worker throws `TypeError`, which is why that maps to the
 *  network rather than to a parse. */
function failureReason(err: unknown): string {
	switch ((err as { name?: string })?.name) {
		case 'QuotaExceededError':
			return 'quota';
		case 'TypeError':
		case 'NetworkError':
		case 'AbortError':
			return 'network';
		case 'SyntaxError':
			return 'parse';
		default:
			return 'other';
	}
}

/**
 * Whether it is reasonable to spend a reader's bandwidth and storage without
 * being asked. Governs the AUTOMATIC waves only; an explicit CACHE_WAVE or a
 * per-work request is the reader speaking for themselves and is not gated.
 *
 * `saveData` alone was the old gate, and almost nobody sets it. The two checks
 * added here are the ones that catch the cases it misses: a slow or metered
 * connection, and a browser that has less quota left than the wave needs.
 */
async function mayDownloadUninvited(bytes: number): Promise<boolean> {
	const connection = (
		sw as unknown as {
			navigator?: { connection?: { saveData?: boolean; effectiveType?: string } };
		}
	).navigator?.connection;
	if (connection?.saveData) return false;
	if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') return false;

	try {
		const { quota, usage } = await navigator.storage.estimate();
		// Leave real headroom rather than filling to the brim: the browser
		// evicts the whole origin under pressure, and evicting a half-downloaded
		// library is worse than never having started it.
		if (quota !== undefined && usage !== undefined && quota - usage < bytes * 2) return false;
	} catch {
		// No Storage API (or it refused): fall through and let the per-asset
		// error handling deal with a quota failure, which it already does.
	}
	return true;
}

/**
 * Ask the browser to keep this origin's storage.
 *
 * Cache Storage is best-effort by default, and a multi-megabyte offline
 * library is exactly what gets evicted first under pressure — which makes the
 * "whole library on device" promise unenforced. Requested only once a reader
 * has actually accumulated a library, because that is when a browser is
 * willing to grant it and when the prompt (where there is one) is meaningful.
 */
async function requestPersistence(): Promise<void> {
	try {
		if (await navigator.storage.persisted()) return;
		await navigator.storage.persist();
	} catch {
		// Unsupported or refused; nothing to do and nothing to report.
	}
}

/** The waves for one reader, and the assets in a named wave. */
function wavesFor(
	langs: string[],
	current?: { workId: string; path: string },
	chosen?: string[]
): Wave[] {
	return planWaves(partition.contentEntries, { langs, current, chosen });
}

sw.addEventListener('install', (event) => {
	// Guard: a rejected/thrown install handler leaves this worker permanently
	// 'redundant' — for an offline-first PWA that means silently losing offline
	// support until the next deploy. precacheShell() already catches per-asset
	// failures; wrap the call anyway so a failure in caches.open() itself
	// (storage quota, private browsing) still can't make install() reject.
	event.waitUntil(
		(async () => {
			try {
				const shell = await precacheShell(env, {
					cacheName: SHELL_CACHE,
					urls: partition.precacheUrls
				});
				console.info(
					`[service-worker] precached shell: ${shell.count} file(s), ${(shell.bytes / 1e6).toFixed(2)} MB. ` +
						`Content tier holds ${partition.contentEntries.length} file(s), fetched on demand.`
				);
			} catch (err) {
				console.error('[service-worker] install failed', err);
				await announceFailure(failureReason(err));
			}
		})()
	);

	// Deliberately NOT calling skipWaiting() here. This is a reading site
	// (docs/decisions.md's "Reading mode: continuous, book-like"), and a reader
	// mid-chapter shouldn't have the ground shift under them because a new
	// version activated and started serving different assets to an already-open
	// tab.
	//
	// What changed on 2026-08-25 is what happens NEXT. The browser's own rule —
	// wait until every tab on the old version has closed — is not something a
	// reader can discover or act on: a plain reload does not release the old
	// worker (the new document is claimed by it, so there is never a moment
	// with zero clients), and an installed PWA can sit on a superseded version
	// for weeks. Since the corpus index is baked into the shell, that is a
	// stale table of contents, not just stale code. So the client watches for
	// `updatefound` and sends SKIP_WAITING itself — see the message handler
	// below and `$lib/sw.svelte.ts`.
	//
	// WHEN it sends it is the part worth reading over there, and it changed on
	// 2026-08-28. Asking the reader was the first answer and is now the last
	// of three: the update is taken silently while the tab is hidden, or on
	// the next link the reader follows, and only a reader who does neither —
	// parked on one chapter — is asked. What this comment refuses is
	// unchanged, and all three obey it: the ground never moves under someone
	// standing on it.
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			try {
				// CONTENT_CACHE is deliberately not in this sweep's prefix — see
				// `sweepShellCaches`, where that is the documented point rather
				// than an omission.
				await sweepShellCaches(env, { prefix: 'glossa-shell-', keep: SHELL_CACHE });
			} catch (err) {
				console.error('[service-worker] cache cleanup failed', err);
			}

			try {
				const dropped = await sweepOrphanedContent(env, {
					cacheName: CONTENT_CACHE,
					live: partition.contentUrls
				});
				if (dropped > 0) {
					console.info(`[service-worker] dropped ${dropped} superseded content file(s)`);
				}
			} catch (err) {
				console.error('[service-worker] content sweep failed', err);
			}

			try {
				// Safe to claim unconditionally here: by the time activate runs,
				// either this is the very first install (nothing to disrupt) or
				// every tab on the old version has already gone away (see the
				// skipWaiting comment in `install`) — so claiming now only
				// affects pages that have no conflicting old worker to be yanked
				// out from under.
				await sw.clients.claim();
			} catch (err) {
				console.error('[service-worker] clients.claim failed', err);
			}
		})()
	);
});

/**
 * Full-page navigations: try the network first — while online this is the
 * normal, freshest path. Only on network failure does this reach for the
 * cached shell: the app boots from it, and its client-side router renders the
 * actually-requested page from CONTENT_CACHE with no further network request.
 *
 * Note this handler does NOT see `/` itself. The boot document is in the
 * precache list, so `routeFor` classifies it as `shell` before reaching the
 * navigation branch — the home page is cache-first while every other route is
 * network-first. That is correct (the shell cache is version-scoped, so its
 * copy can never be staler than the worker serving it), and it is now written
 * down in `routeFor` rather than being an accident of branch order.
 *
 * `vite.config.ts` DOES configure adapter-static's `fallback: 'index.html'`
 * (it has to, to emit a single shell artifact from a build with no per-route
 * pages) — but the host never serves that fallback automatically:
 * `src/worker.ts` intercepts every navigation and serves the shell only for a
 * path `corpus-routes.json` recognizes, an HTTP 404 shell otherwise (see
 * site/docs/shell.md). This
 * handler is that same idea's OFFLINE counterpart: with no network to reach
 * the edge worker or its manifest, it serves the cached shell unconditionally
 * and lets the client-side router decide what the address means, rather than
 * refuse a genuinely-cached page just because it can't re-validate it.
 */
async function handleNavigate(request: Request): Promise<Response> {
	// Offline mode makes the network attempt itself the thing to avoid, so the
	// cached shell is served outright rather than after a failure. Same answer,
	// no request — and no multi-second wait on a connection that is up but
	// which the reader has asked us not to use.
	if (await isOffline()) return cachedShell();
	try {
		return await fetch(request);
	} catch {
		return cachedShell();
	}
}

/** The boot document, from the cache. What every offline navigation lands on:
 *  the app starts and its own router renders the address out of
 *  CONTENT_CACHE. */
async function cachedShell(): Promise<Response> {
	const shell = await caches.match(partition.shellDocumentUrl);
	if (shell) return shell;
	const fallback = await caches.match(partition.offlineFallbackUrl);
	if (fallback) return fallback;
	// Both precache candidates missing (a badly failed install) — this is
	// the only place this file constructs a response by hand rather than
	// serving a cached one.
	return new Response('Offline, and no cached copy of Glossa Catholica is available.', {
		status: 503,
		headers: { 'Content-Type': 'text/plain; charset=utf-8' }
	});
}

/** Content, and in offline mode nothing but what is already here. */
async function handleContent(request: Request): Promise<Response> {
	if (await isOffline()) return cacheOnly(env, request, CONTENT_CACHE);
	// Serve from CONTENT_CACHE, and store on first read so ordinary reading
	// builds up an offline library without the reader doing anything.
	return cacheFirstAndStore(env, request, CONTENT_CACHE);
}

/** The shell. A miss here is close to impossible — everything in this tier was
 *  precached at install — so what offline mode changes is the ONE case that
 *  matters: a file this build references that install never managed to store,
 *  which must not become a silent request. */
async function handleShell(request: Request): Promise<Response> {
	if (await isOffline()) return cacheOnly(env, request, SHELL_CACHE);
	return cacheFirst(env, request, SHELL_CACHE);
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);
	const sameOrigin = url.origin === sw.location.origin;

	switch (
		routeFor(
			{
				method: request.method,
				sameOrigin,
				pathname: url.pathname,
				mode: request.mode
			},
			partition
		)
	) {
		case 'content':
			event.respondWith(handleContent(request));
			return;
		case 'shell':
			event.respondWith(handleShell(request));
			return;
		case 'navigate':
			event.respondWith(handleNavigate(request));
			return;
		case 'passthrough':
			// THE ONLY BRANCH THAT READS THE FLAG SYNCHRONOUSLY, because it is
			// the only one that has to decide whether to intercept at all:
			// `respondWith` cannot be called after this handler returns, and
			// awaiting the flag first would mean intercepting every passthrough
			// request forever after — including the cross-origin ones this
			// worker has never touched.
			//
			// What it catches is the same-origin request nothing above claims:
			// the usage beacon's POST (already withheld by `usage.ts`, this is
			// the half that holds if a page from before the toggle is still
			// open), and any same-origin asset that entered the page after this
			// build's manifest was written. The window in which `offlineMode`
			// is still `false` because `offlineReady` has not resolved is the
			// first few milliseconds of a worker's life, and everything the
			// reader actually reads goes through a branch above that awaits it.
			if (sameOrigin && offlineMode) event.respondWith(offlineRefusal());
			return;
	}
});

/**
 * Messages from the page. Five of them:
 *
 *   OFFLINE_MODE   — `{ on }`. The reader's switch, from
 *                    `$lib/offline.svelte.ts`. Sent on every page start as
 *                    well as on every change, because a worker that was
 *                    restarted in between has only what it read out of
 *                    PREF_CACHE and a page is the cheapest thing to hear it
 *                    from. Everything below it here is a download, and while
 *                    it is on none of them run.
 *   CACHE_CONTENT  — `{ langs, current?, chosen?, workId? }`. With a `workId`,
 *                    take that one work (this is the explicit request that
 *                    reaching outside the reader's own language requires).
 *                    Without one, fill the automatic part of the AUTOMATIC
 *                    waves for `langs` and stop.
 *   CACHE_WAVE     — `{ langs, current?, chosen?, wave }`. Take one named wave
 *                    WHOLE and ungated — every edition of it in the chain, not
 *                    just the automatic slice: the reader asked. `wave: 'all'`
 *                    is every wave on the same terms, and reports progress
 *                    wave by wave as it goes.
 *   CLEAR_CONTENT  — drop the whole content cache.
 *   SKIP_WAITING   — the reader accepted the update offer; take over now.
 *
 * Progress is posted back to every open client as `CACHE_CONTENT:progress` per
 * wave and `CACHE_CONTENT:done` at the end, so a UI can render "Catechism ✓ ·
 * Bible 40% · Summa (5.0 MB) [Download]" without polling. `listContentAssets()`
 * has carried the byte size of every file since the corpus was split; this is
 * what it was for.
 */
interface CacheMessage {
	type?: string;
	/** OFFLINE_MODE only. */
	on?: boolean;
	langs?: string[];
	workId?: string;
	wave?: WaveRequest;
	current?: { workId: string; path: string };
	/** The reader's explicitly picked editions — see `WavePlanInput.chosen`. */
	chosen?: string[];
}

sw.addEventListener('message', (event) => {
	const data = event.data as CacheMessage | undefined;
	if (!data || typeof data.type !== 'string') return;

	if (data.type === 'SKIP_WAITING') {
		// The page has told the reader a new version is ready and the reader
		// said yes. `controllerchange` on the page side reloads it.
		sw.skipWaiting();
		return;
	}

	if (data.type === 'CLEAR_CONTENT') {
		// Not gated on offline mode, deliberately: forgetting the library is a
		// local deletion, and a reader freeing space on a metered connection is
		// exactly who has the switch on.
		event.waitUntil(caches.delete(CONTENT_CACHE));
		return;
	}

	if (data.type === 'OFFLINE_MODE') {
		event.waitUntil(setOfflineMode(data.on === true));
		return;
	}

	// EVERYTHING BELOW DOWNLOADS, so offline mode ends the handler here. The
	// page already declines to send these (`sw.svelte.ts`'s `#send`); this is
	// the half that holds for a page still open from before the switch, and for
	// a second tab that has not heard about it.
	//
	// Asynchronous, unlike the fetch handler's `passthrough` branch: a message
	// has nothing to answer synchronously, so it can afford the true answer.
	event.waitUntil(
		isOffline().then((off) => {
			if (!off) fill(event, data);
		})
	);
});

/** The download half of the message handler, reached only while offline mode
 *  is off. Split out so the gate above is one expression rather than a flag
 *  threaded through three branches. */
function fill(event: ExtendableMessageEvent, data: CacheMessage): void {
	// Every cache message carries the reader's language chain (`sw.svelte.ts`
	// sends it with all of them, because the worker cannot read localStorage),
	// which is the only chance this worker gets to know which scripts the
	// reader actually reads in. The faces for those scripts are no longer
	// precached — see `DEFERRED_FONTS` — so this is what puts them on the
	// device before the network goes away. Cheap and idempotent: `cacheAssets`
	// skips what the cache already holds, and the table bounds the largest
	// possible pull at Arabic's 413 KB.
	if (data.langs?.length) {
		// Read off the PARTITION, not off `files`: the partition's paths have
		// been through `contentPath`, and a cache key that differs from the
		// routing key by a base prefix stores a face the fetch handler will
		// never find — the exact silent mismatch this module's docblock is
		// about.
		const faces = fontsForLangs([...partition.contentUrls], data.langs);
		if (faces.length) {
			event.waitUntil(cacheAssets(env, { cacheName: CONTENT_CACHE, assets: faces }));
		}
	}

	if (data.type === 'CACHE_CONTENT' && data.workId) {
		const assets = assetsForWork(partition.contentEntries, data.workId);
		event.waitUntil(
			(async () => {
				const result = await cacheAssets(env, { cacheName: CONTENT_CACHE, assets });
				await requestPersistence();
				await announce({ type: 'CACHE_CONTENT:done', workId: data.workId, ...result });
			})()
		);
		return;
	}

	if (data.type === 'CACHE_CONTENT' || data.type === 'CACHE_WAVE') {
		const langs = data.langs?.length ? data.langs : ['en'];
		const explicit = data.type === 'CACHE_WAVE';
		// NO `current` ON AN EXPLICIT REQUEST, and this is a fix rather than a
		// tidy-up. `planWaves` lifts the files either side of the open page
		// into `neighbours`, removing them from the wave they belong to — so
		// "download the Bible" while reading Genesis fetched a Bible with a
		// hole where Genesis's neighbours were, and the panel then read
		// "26.5 / 26.6 MB" forever. Worse, the hole MOVES: navigate and those
		// files are back in `scripture`, still absent. Prefetching what is
		// adjacent is what the AUTOMATIC pass is for; a shelf the reader named
		// is taken whole. `library.svelte.ts`'s `shelfPlan()` prices it on the
		// same terms, which is what keeps the two numbers the same number.
		const planned = wavesFor(langs, explicit ? undefined : data.current, data.chosen);
		// `'all'` takes the whole plan rather than a named wave — the loop
		// below already walks a list, so "everything" is the list unfiltered
		// and needs no second code path. It stays on the EXPLICIT side of the
		// branch, so it is ungated on connection and quota and takes each
		// wave whole: a reader who pressed "download everything" asked for
		// every edition, not one Catechism.
		const wanted = explicit
			? data.wave === 'all'
				? planned
				: planned.filter((wave) => wave.id === data.wave)
			: planned.filter((wave) => wave.automatic);

		event.waitUntil(
			(async () => {
				const total = { count: 0, bytes: 0 };
				for (const wave of wanted) {
					// The reader asked for the whole wave; the automatic pass takes
					// only the part `planWaves` marked as takeable uninvited, which
					// for `catechism` is one edition of eight (`ONE_EDITION_AUTOMATIC`).
					const assets = explicit ? wave.assets : wave.autoAssets;
					const bytes = explicit ? wave.bytes : wave.autoBytes;
					if (assets.length === 0) continue;
					// Gated per wave, not once for the whole run: `essentials` is
					// worth taking on a connection that `catechism` is not, and a
					// wave-sized question is the one the quota check can answer.
					if (!explicit && !(await mayDownloadUninvited(bytes))) {
						break;
					}
					const result = await cacheAssets(env, {
						cacheName: CONTENT_CACHE,
						assets,
						onProgress: ({ count, bytes: done }) =>
							announce({
								type: 'CACHE_CONTENT:progress',
								wave: wave.id,
								count,
								bytes: done,
								ofCount: assets.length,
								ofBytes: bytes
							})
					});
					total.count += result.count;
					total.bytes += result.bytes;
				}
				// Only once something substantial is on the device: a reader who
				// has the whole Catechism stored is who this protects.
				if (total.bytes > 0) await requestPersistence();
				await announce({ type: 'CACHE_CONTENT:done', ...total });
			})()
		);
	}
}
