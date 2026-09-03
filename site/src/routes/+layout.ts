import {
	ensureBibleIndex,
	ensureCoreIndex,
	ensureCccIndex,
	ensureCompendiumIndex,
	ensureDocumentIndex,
	ensurePrayerIndex,
	ensureSummaIndex
} from '$lib/corpus-index';
import { i18n } from '$lib/i18n.svelte';
import { indexesForPath, type IndexName } from '$lib/index-priming';

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
 *
 * IT ALSO PRIMES THE INDEXES THIS PATH READS, for the reason the dictionary is
 * awaited here rather than fetched by whoever first needs it: the readers are
 * synchronous. `corpus.ts`'s `getBook`, `getCccStructure`, `listSummaQuestions`
 * and twenty-odd others are called from render, so the data has to be resident
 * before a component exists — and `load` is the one place a route already
 * waits. See `index-priming.ts` for why the mapping lives in the layout instead
 * of in thirteen `+page.ts` files.
 *
 * `url` IS READ, so this re-runs on every client-side navigation rather than
 * only on the cold load. That is the point — a reader who lands on the Bible
 * and then opens a prayer needs the prayer index before that page renders — and
 * it is close to free after the first visit, since the primers memoise the
 * promise and a repeat is one resolved `await`.
 *
 * The primers run CONCURRENTLY with the dictionary, not after it: they are
 * separate network reads and neither needs the other's answer.
 */
const PRIMERS: Record<IndexName, () => Promise<void>> = {
	bible: ensureBibleIndex,
	ccc: ensureCccIndex,
	compendium: ensureCompendiumIndex,
	summa: ensureSummaIndex,
	document: ensureDocumentIndex,
	prayer: ensurePrayerIndex
};

export async function load({ url }: { url: URL }) {
	await Promise.all([
		i18n.ready,
		// Unconditional: the work manifests answer "what works are there, and
		// what are they called", which the language menu, the edition pickers and
		// the footer ask on every path — see `ensureCoreIndex`.
		ensureCoreIndex(),
		...indexesForPath(url.pathname).map((name) => PRIMERS[name]())
	]);
}
