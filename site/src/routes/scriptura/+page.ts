import { primeForPath } from '$lib/index-priming';

/**
 * Prerendered. `src/routes/+page.ts` holds the argument and the measurement;
 * this page is in `CHROME_PATHS`, which is the whole of why it qualifies —
 * every word on it is the interface, so there is a document to write.
 */
export const ssr = true;
export const prerender = true;

/**
 * `await parent()` first, the wait every `+page.ts` here owes the layout's
 * index priming — and then the same priming again, because on the SERVER the
 * layout's `load` does not exist: SvelteKit sets `load: null` on the server
 * node of any node declaring `ssr = false`, and the root layout declares it.
 * Without this line a prerendered page renders against empty registries and
 * says so only as a warning. `primeForPath` holds the whole argument.
 */
export async function load({ parent, url }: { parent: () => Promise<unknown>; url: URL }) {
	await parent();
	await primeForPath(url.pathname);
}
