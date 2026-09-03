/**
 * Memoise an async initialiser on its PROMISE, and forget a REJECTED one.
 *
 * Both halves are load-bearing and they pull in opposite directions.
 *
 * MEMOISING THE PROMISE rather than a boolean is what makes concurrent callers
 * safe: a reading route and the jump box can ask for the same index in the same
 * tick, and a boolean would let the second past while the first was still in
 * flight. That much was never in doubt.
 *
 * FORGETTING A REJECTION is the half that gets left out, and `corpus.ts`'s
 * `readContent` already carries the scar — "a rejection kept in it makes the
 * failure permanent for the life of the page: every later route asking for the
 * same book is handed the same dead promise without ever trying again". The
 * same sentence is true of an index primer, and worse: a content read that
 * never retries costs one text, while an index that never retries costs every
 * address in that work type. `listBibleWorks()` returns `[]` against an unfilled
 * registry, and a `+page.ts` reading `[]` calls `error(404)` — so ONE failed
 * fetch of `bible-index.json` turns every valid chapter into "Nothing at this
 * address" until the tab is reloaded.
 *
 * The retry is free where it is not needed: a resolved promise is returned as
 * itself, so the second and millionth call are one `await` on a settled value.
 *
 * A synchronous throw from `load` is also not memoised — the assignment never
 * happens, so the next call tries again. That is the same rule, arrived at by
 * the language rather than by the `catch`.
 */
export function retryableOnce<T>(load: () => Promise<T>): () => Promise<T> {
	let inFlight: Promise<T> | undefined;

	return () =>
		(inFlight ??= load().catch((cause: unknown) => {
			inFlight = undefined;
			throw cause;
		}));
}
