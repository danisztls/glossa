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
 *
 * AND SO DOES EVERY `+page.ts` LOAD ON THIS ROUTE — which is the one thing
 * this arrangement needs from the pages, and the one thing it cannot get by
 * itself. SvelteKit launches a route's whole branch of `load`s at once
 * (`node_ids.map(…)` into a `Promise.all`, `runtime/client/client.js`); a
 * layout's does NOT resolve before its page's, and `await parent()` is the
 * only thing that orders them. So a page load that opens with a synchronous
 * registry read — and every reading route's does, `cccLangs()`,
 * `compendiumLangs()`, `getWork()` — reads it while the fetch above is still
 * in flight, and gets whatever an empty registry says.
 *
 * WHAT THAT LOOKS LIKE IS TWO DIFFERENT BUGS, and only one of them is loud.
 * `/catechismus/caput/{n}` on a cold ccc index threw `cccLangs: the ccc index
 * was read before it was primed` in dev; in production `requireIndex` only
 * warns, so `cccLangs()` returned `[]`, no language produced a chapter, and
 * the load answered `error(404, 'No CCC chapter contains this paragraph')` —
 * a reader told an address does not exist while its text was arriving. The
 * silent half is wider than the guarded one: `manifests` is behind no
 * `requireIndex` at all, so `getWork()` returning nothing turns EVERY reading
 * route's 404 branch into a race, including the shelves whose own registries
 * are inlined and look like they need no primer.
 *
 * The rule is therefore flat and takes no per-route judgement: **a `+page.ts`
 * `load` awaits `parent()` before it reads anything.** It costs nothing — the
 * page's own first fetch could not have started before the index it addresses
 * arrived anyway — and `index-priming.test.ts` scans the route tree for it,
 * because under fixtures every registry is populated at module load and a load
 * that never waits passes every runnable test.
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
