import { i18n } from '$lib/i18n.svelte';

/**
 * The reader is an SPA. `adapter-static` emits one fallback shell, and the
 * client router resolves the stable, path-based reference URLs from there.
 *
 * Content remains static: `corpus.ts` fetches immutable, content-hashed JSON
 * assets as a route needs them. Disabling SSR here is what stops SvelteKit
 * from materialising one HTML document per paragraph, chapter, and work just
 * to carry a small amount of route data around the same application shell.
 */
export const ssr = false;

/**
 * Wait for the reader's own dictionary before the first render.
 *
 * The dictionaries are lazy as of 2026-08-31 (see `i18n.svelte.ts`), so
 * without this a reader whose language is not English would get one frame of
 * English chrome and then a swap. `i18n.ready` is the load the store started
 * at module scope, not a second negotiation — this only joins it.
 *
 * `ssr = false` means this runs in the browser, where the shell is already
 * blank until the app mounts; the wait therefore lands inside a pause that
 * exists anyway rather than adding a new one.
 */
export async function load() {
	await i18n.ready;
}
