/**
 * `service-worker.ts` for the dev server, substituted for it by
 * `vite.config.ts`'s `glossa:dev-service-worker` plugin. Never in a build.
 *
 * IT UNINSTALLS ITSELF. It caches nothing, intercepts nothing, and its whole
 * job is to evict the real worker — and the caches it left behind — from the
 * profile of the person editing this site.
 *
 * WHY THE REAL WORKER CANNOT RUN AGAINST `vite dev`. Every decision in
 * `service-worker.ts` rests on two premises a build satisfies and the dev
 * server does not:
 *
 *   - **Content URLs are content-hashed**, so `cacheFirstAndStore` can keep a
 *     file forever without revalidating — a changed file is a different URL.
 *     In dev they are plain paths (`/src/lib/corpus-data/…`, see
 *     `content-urls.dev.ts`), and CONTENT_CACHE is unversioned. So the first
 *     read of a corpus file pins those bytes to that path PERMANENTLY: re-run
 *     `sync-corpus` and the browser serves the old text, and restarting the
 *     dev server does not help, because nothing sweeps that cache but a
 *     `CLEAR_CONTENT` message or clearing site data by hand.
 *   - **`version` changes per deploy**, so SHELL_CACHE turns over. In dev it
 *     changes per dev-server PROCESS (`buildId()` carries the minute), and the
 *     shell precache includes `/` itself — the one document every route is
 *     served from. Between restarts the boot document is served cache-first
 *     from a snapshot, which is why `src/app.html` edits appear to do nothing
 *     until the server is restarted.
 *
 * There is a third cost that is not about staleness. In dev the real worker's
 * module graph is nine modules and 9.03 MB, 8.82 MB of which is
 * `content-manifest.json` and its inline sourcemap (measured 2026-09-02). A
 * service worker is stopped when idle and started again on the next event, and
 * a controlled page's requests wait behind that start — so every full reload,
 * which is what an edit to any `.ts` module costs (see `site/CLAUDE.md`), pays
 * it again.
 *
 * WHY SUBSTITUTE THE MODULE RATHER THAN REFUSE TO REGISTER. Setting
 * `serviceWorker.register: false` for `vite dev` was tried on 2026-09-01 and
 * reverted the next day: it cannot evict a worker that is already installed,
 * so it only ever helped a profile that never had the problem, and it made dev
 * and production run different registration paths. This keeps the registration
 * — SvelteKit's shim registers `./service-worker.js` exactly as it does in a
 * build, `sw.svelte.ts` wires itself up exactly as it does in a build — and
 * changes only what is registered.
 *
 * `npm run preview` is where the real worker is exercised, and always was: it
 * serves a build, so both premises above hold there.
 */

/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

/** Every cache this project has ever named. `sw-cache.ts`'s sweeps are keyed
 *  on `glossa-shell-` and `glossa-content` individually; one prefix here
 *  covers both, and anything a future tier adds. */
const CACHE_PREFIX = 'glossa-';

sw.addEventListener('install', () => {
	// Take over from the real worker now rather than waiting for every tab on
	// it to close — the reader-protecting rule `service-worker.ts` states in
	// its own `install` handler is about not moving the ground under someone
	// reading, and there is no reader here.
	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			try {
				const names = (await caches.keys()).filter((name) => name.startsWith(CACHE_PREFIX));
				await Promise.all(names.map((name) => caches.delete(name)));
				await sw.registration.unregister();
				if (names.length > 0) {
					console.info(
						`[service-worker] dev: unregistered, and dropped ${names.length} cache(s): ${names.join(', ')}`
					);
				}
			} catch (err) {
				console.error('[service-worker] dev: cleanup failed', err);
			}
		})()
	);
});

// DELIBERATELY NO `fetch` HANDLER AND NO `clients.claim()`. Between activation
// and the tab closing this worker still controls the pages the real one was
// controlling, and registering no handler is what makes that harmless: every
// request goes to the network, which in dev is the thing being edited.
//
// It is also what stops a reload loop. Without `claim()`, a page that loads
// after the unregistration is never controlled, so no `controllerchange`
// fires, so `sw.svelte.ts`'s `#land()` does not reload it — the one reload
// that does happen is the handover from the real worker, which is exactly the
// reload that shows the evicted content fresh.
export {};
