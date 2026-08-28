/**
 * The plate list, fetched when a Bible chapter first asks for it.
 *
 * SAME SHAPE AS `document-structures.svelte.ts`, and for the same three
 * reasons — read that module first; this is the short version.
 *
 * A `$state` holder rather than an `await`, so the chapter page can ask for
 * plates from inside a `$derived` and register the dependency in the same
 * breath: it gets nothing now and re-runs when the list lands. Unlike a
 * document's outline, arriving late costs nothing to look at — a plate is
 * `loading="lazy"` with its box already reserved, and the reader is at the
 * top of the chapter while the first plate is usually screens below.
 *
 * A PLAIN `fetch` RATHER THAN `corpus.ts`'s `readContent`, which is the
 * subtle one and is stolen wholesale from that module: `readContent` records
 * every read as `lastContentRead()`, and that is what tells the service
 * worker's wave planner which file the reader has open. A 29 KB plate list
 * fetched in the same breath as the chapter would win that race and point the
 * planner at the illustrations instead of at Scripture, so its `neighbours`
 * wave would prefetch the wrong thing entirely. `started` below supplies the
 * memoization that was the other thing `readContent` offered.
 *
 * Under fixtures (`!USE_REAL_CORPUS`, always true in vitest) nothing is ever
 * fetched and every chapter has no plates — which is also what five chapters
 * in six look like with the real collection present.
 */

import { USE_REAL_CORPUS, plateContentLocation } from './corpus-index';
import type { Plate } from './plates';

/** The one collection the corpus holds. A parameter rather than a literal at
 *  the call sites so a second collection is a new argument, not a new module.  */
export const DORE_WORK_ID = 'dore.tours';

const EMPTY: Plate[] = [];

const store = $state<{ byWork: Record<string, Plate[]> }>({ byWork: {} });

/** Collections whose fetch has been started. Outside `$state` on purpose:
 *  nothing should re-run because a fetch STARTED. */
const started = new Set<string>();

/**
 * Every plate of one collection, starting the fetch on the first ask.
 *
 * Returns an array rather than a promise so callers stay synchronous. Reading
 * `store.byWork` is what registers the dependency in a calling `$derived`, so
 * the same line both triggers the load and arranges the re-run.
 */
export function getPlates(workId: string = DORE_WORK_ID): Plate[] {
	const loaded = store.byWork[workId];
	if (loaded) return loaded;
	// Started, never awaited — and `loadPlates` must not touch `store` before
	// its first `await`, since this runs inside a `$derived` and a synchronous
	// write there is Svelte's `state_unsafe_mutation`.
	if (USE_REAL_CORPUS && !started.has(workId)) void loadPlates(workId);
	return EMPTY;
}

/**
 * Resolves rather than rejects on a failed fetch, and records the failure as
 * an empty collection so it is not retried on every subsequent `$derived`
 * re-run. A chapter without its illustrations is a chapter; the text is what
 * the reader came for.
 */
export async function loadPlates(workId: string = DORE_WORK_ID): Promise<void> {
	if (!USE_REAL_CORPUS || started.has(workId)) return;
	started.add(workId);
	const location = plateContentLocation(workId);
	// No file means no collection was built. Not an error, and deliberately
	// not recorded in `store`: this branch runs before the first `await`.
	if (!location) return;
	let plates: Plate[];
	try {
		const res = await fetch(location.url);
		if (!res.ok) throw new Error(`failed to fetch ${location.url} (${res.status})`);
		plates = (await res.json()) as Plate[];
	} catch (err) {
		console.error(`[plates] failed to load ${workId}`, err);
		plates = EMPTY;
	}
	store.byWork = { ...store.byWork, [workId]: plates };
}
