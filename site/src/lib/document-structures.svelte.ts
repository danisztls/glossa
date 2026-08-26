/**
 * A document's outline, fetched when a page asks for it rather than shipped in
 * the boot chunk.
 *
 * WHY THIS MODULE EXISTS. `document-index.json` carried a `structure` tree per
 * work: 354 editions, 414 KB raw, ~82 KB brotli — a quarter of the one chunk
 * every route `modulepreload`s, in front of first paint, so that a reader who
 * opens ONE document can see its headings. The home page, a Bible chapter, a
 * Compendium question and a prayer all paid for all 354. The trees are now
 * content-tier assets, one per work, averaging 1.2 KB (`sync-corpus.mjs`'s
 * document branch argues the tier choice).
 *
 * WHY NOTHING HAD TO BECOME `await`. Same shape as `xrefs.svelte.ts`, and for
 * the same reason: `getDocumentStructure` reads a `$state` holder and starts
 * the fetch on the first ask, so a caller inside a `$derived` — which both
 * callers are, the document route's `structureRows` and its comparison
 * column's — registers a dependency in the same breath as it asks. It gets an
 * empty outline now and re-runs when the tree lands.
 *
 * AND WHY THE ROUTE STILL AWAITS ONE. An empty-then-filled outline is a
 * visible reflow, not an invisible one: `flattenDocumentStructure`'s rows are
 * interleaved into the section flow, so headings appearing a beat late would
 * push the text the reader is already looking at. So `+page.ts` awaits
 * `loadDocumentStructure` for the edition it embeds, alongside the section
 * fetch it already awaits and over the same warm connection — the common path
 * renders complete and the `$state` holder is what covers the paths `load`
 * cannot see: a reader flipping content language without navigating, and the
 * comparison column, whose work id is chosen in the browser.
 *
 * FIXTURES HAVE NO DOCUMENTS AT ALL, so under vitest every lookup here is an
 * empty outline and no fetch is ever issued — the same posture `corpus.ts`'s
 * document content functions already take.
 */

import { USE_REAL_CORPUS, documentStructureLocation } from './corpus-index';
import type { DocumentNode } from './types';

const EMPTY: DocumentNode[] = [];

/**
 * Held in an object rather than a bare `let` so the value can be replaced from
 * outside a component and every reader still sees it — the standard shape for
 * cross-module `$state`, and the one `xrefs.svelte.ts` uses.
 *
 * `byWork` is REPLACED, never mutated in place, which is what makes the
 * dependency unambiguous: every reader took its dependency on `store.byWork`
 * itself, so assigning a new object wakes all of them. That is a handful of
 * `$derived` re-runs over a map of at most two or three work ids in a session
 * — the reader's document, and its comparison edition.
 */
const store = $state<{ byWork: Record<string, DocumentNode[]> }>({ byWork: {} });

/** Work ids whose fetch has been started, so a miss re-read on every
 *  `$derived` re-run does not issue the request again. Outside `$state` on
 *  purpose: nothing should re-run because a fetch STARTED. */
const started = new Set<string>();

/**
 * One document's outline, starting the fetch if this is the first ask.
 *
 * Returns empty rather than a promise, which is what lets the callers stay
 * synchronous — see this module's docblock. Reading `store.byWork` here is
 * also what registers the dependency in a calling `$derived`, so the same line
 * both triggers the load and arranges for the re-run.
 */
export function getDocumentStructure(workId: string): DocumentNode[] {
	const loaded = store.byWork[workId];
	if (loaded) return loaded;
	// Started, never awaited, and — the part that matters — `loadDocumentStructure`
	// must not touch `store` before its first `await`. This function is called
	// from inside a `$derived`, and a synchronous write there is Svelte's
	// `state_unsafe_mutation`. See the missing-location branch below, which is
	// where that was easy to get wrong.
	if (USE_REAL_CORPUS && !started.has(workId)) void loadDocumentStructure(workId);
	return EMPTY;
}

/**
 * The same load, awaitable — for `documents/[slug]/+page.ts`, which wants the
 * embedded edition's outline in hand before the page renders.
 *
 * Resolves rather than rejects on a failed fetch: an outline is navigation
 * apparatus beside the text, and losing it must not cost the reader the
 * document. The work is recorded as empty rather than left unset so a failure
 * is not retried on every subsequent `$derived` re-run.
 */
export async function loadDocumentStructure(workId: string): Promise<void> {
	if (!USE_REAL_CORPUS || started.has(workId)) return;
	started.add(workId);
	const location = documentStructureLocation(workId);
	// No file means the work was never built — an unpublished edition, or a
	// corpus that has none of this family. Not an error, and not a retry:
	// `started` already holds, and an absent key already reads as an empty
	// outline. Deliberately does NOT record the miss in `store`, because this
	// branch runs BEFORE the first `await` — synchronously inside whichever
	// `$derived` asked — and writing `$state` there is `state_unsafe_mutation`.
	if (!location) return;
	let structure: DocumentNode[];
	try {
		// A plain fetch rather than `corpus.ts`'s `readContent`, for two
		// reasons. It would be an import cycle — `corpus.ts` re-exports this
		// module's `getDocumentStructure` — and, less obviously, `readContent`
		// records every read as `lastContentRead()`, which is what tells the
		// service worker's wave planner what the reader has open. An outline
		// fetched in the same breath as the section chunk would win that race
		// and point the planner at a 1.2 KB file instead of the text, so its
		// `neighbours` wave would prefetch nothing worth having. `started`
		// above already supplies the memoization that was the other thing
		// `readContent` offered.
		const res = await fetch(location.url);
		if (!res.ok) throw new Error(`failed to fetch ${location.url} (${res.status})`);
		structure = (await res.json()) as DocumentNode[];
	} catch (err) {
		console.error(`[document-structures] failed to load the outline for ${workId}`, err);
		structure = EMPTY;
	}
	// Replaced, not mutated: `$state` tracks the property, and every reader is
	// holding a dependency on `byWork` itself.
	store.byWork = { ...store.byWork, [workId]: structure };
}
