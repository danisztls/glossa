/**
 * A commentary's notes for one chapter, fetched when the reader asks for them.
 *
 * WHY THIS MODULE EXISTS. `commentary.haydock.en` is the largest single body
 * of text in the corpus, and it is apparatus rather than text: nobody opening
 * John 3 is owed it. So it is the one reading surface here that is not in
 * route data — `scriptura/[book]/[chapter]/+page.ts` loads every EDITION of a
 * chapter up front, deliberately, so switching edition costs no fetch, and
 * adding a tenth stream to that loop would charge every reader for an
 * apparatus most of them have switched off. Nothing is fetched until
 * `apparatus-prefs.svelte.ts` says a commentary is on.
 *
 * WHY NOTHING HAD TO BECOME `await`. The same shape as `xrefs.svelte.ts` and
 * `document-structures.svelte.ts`, and for the same reason: `notesFor` reads a
 * `$state` holder and starts the fetch on the first ask, so a caller inside a
 * `$derived` registers its dependency in the same breath as it asks. It gets
 * nothing now and re-runs when the notes land.
 *
 * AND WHY, UNLIKE AN OUTLINE, NOTHING AWAITS IT. `document-structures` makes
 * its route `await` the outline because headings are interleaved into the text
 * and would push it about on arrival. Commentary notes are not: they are set
 * in the apparatus lane, out of the reading column entirely, or open from a
 * card. Arriving a beat late costs the reader nothing they were reading, which
 * is the whole reason the margin is where they go.
 *
 * FIXTURES HAVE NO COMMENTARY, so under vitest every lookup is empty and no
 * fetch is issued — the posture `corpus.ts` already takes for documents.
 */

import { getCommentaryChapter } from './corpus';
import { USE_REAL_CORPUS } from './corpus-index';
import type { CommentaryNote } from './types';

const EMPTY: Map<number, CommentaryNote[]> = new Map();

/** `{workId}\u0000{osis}\u0000{chapter}` — joined on NUL rather than a colon
 *  because an OSIS code is caller-supplied and a separator that can appear in
 *  a key is how two addresses come to share one. */
function keyOf(workId: string, osis: string, chapter: number): string {
	return `${workId}\u0000${osis}\u0000${chapter}`;
}

/**
 * Held in an object so the value can be replaced from outside a component and
 * every reader still sees it — the cross-module `$state` shape the two modules
 * named above already use.
 *
 * `byChapter` is REPLACED, never mutated in place: every reader takes its
 * dependency on the object itself, so assigning a new one wakes all of them.
 * The map holds one entry per (commentary, chapter) the reader has actually
 * opened, which over a session is single digits.
 */
const store = $state<{ byChapter: Record<string, Map<number, CommentaryNote[]>> }>({
	byChapter: {}
});

/** Keys whose fetch has been started, so a miss re-read on every `$derived`
 *  re-run does not issue the request again. Outside `$state` on purpose:
 *  nothing should re-run because a fetch STARTED. */
const started = new Set<string>();

/**
 * One chapter's commentary, keyed by verse of the ANNOTATED work, starting the
 * fetch if this is the first ask.
 *
 * Returns an empty map rather than a promise, which is what lets the callers
 * stay synchronous. Reading `store.byChapter` here is also what registers the
 * dependency in a calling `$derived`, so the same line both triggers the load
 * and arranges for the re-run.
 */
export function notesFor(
	workId: string,
	osis: string,
	chapter: number
): Map<number, CommentaryNote[]> {
	const key = keyOf(workId, osis, chapter);
	const loaded = store.byChapter[key];
	if (loaded) return loaded;
	// Started, never awaited, and `loadChapter` must not touch `store` before
	// its first `await`: this runs inside a `$derived`, where a synchronous
	// `$state` write is Svelte's `state_unsafe_mutation`.
	if (USE_REAL_CORPUS && !started.has(key)) void loadChapter(workId, osis, chapter);
	return EMPTY;
}

/**
 * The same load, awaitable — nothing in the app needs it today, and it exists
 * for the same reason `bibleBookLocations` does: "put this commentary offline"
 * and "prefetch the next chapter's notes" are both expressible over it, and
 * neither should have to reach into the `$state` holder to be written.
 *
 * Resolves rather than rejects on a failed fetch, and records the miss as an
 * empty chapter: an apparatus that fails to arrive must not cost the reader
 * the Scripture beside it, and a failure recorded is a failure not retried on
 * every subsequent `$derived` re-run.
 */
export async function loadChapter(workId: string, osis: string, chapter: number): Promise<void> {
	const key = keyOf(workId, osis, chapter);
	if (!USE_REAL_CORPUS || started.has(key)) return;
	started.add(key);
	let notes: Map<number, CommentaryNote[]>;
	try {
		// `corpus.ts`'s reader rather than a bare `fetch`, unlike
		// `document-structures.svelte.ts` — the two reasons that module gives
		// for going around it do not apply here and one of them inverts. There
		// is no import cycle (`corpus.ts` does not re-export this module), and
		// `readContent` recording the read as `lastContentRead()` is WANTED:
		// the service worker's `neighbours` wave then prefetches the adjacent
		// commentary chunks, which is exactly what a reader who has just
		// switched the apparatus on is about to want. An outline had nothing
		// to prefetch and so had to stay out of that race; a commentary is the
		// text being read.
		notes = await getCommentaryChapter(workId, osis, chapter);
	} catch {
		notes = new Map();
	}
	store.byChapter = { ...store.byChapter, [key]: notes };
}
