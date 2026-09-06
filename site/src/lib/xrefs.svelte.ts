/**
 * The reverse citation indexes, fetched after first paint instead of shipped
 * in the boot chunk.
 *
 * WHY THIS MODULE EXISTS. These were the largest thing the boot bundle
 * carried for pages that never ask for it — 715 KB raw, ~69 KB gzipped,
 * eagerly inlined into the one chunk every route `modulepreload`s. Nothing on
 * the home page, a prayer or a Compendium question reads a byte of it. With
 * `ssr = false` that weight sits squarely in front of first paint on every
 * route.
 *
 * WHAT THEY ARE. Reading apparatus, not reading text: which places in the
 * corpus cite the verse, the Catechism paragraph, the document section or the
 * Summa article a reader is looking at. Every one of them renders BELOW the
 * text it annotates. Arriving a moment after first paint is the correct trade
 * for a body of text that arrives sooner; arriving before the text it
 * annotates was never worth anything.
 *
 * FOUR TABLES BECAME THREE PLUS SEVENTY-THREE, and the shape is the point.
 * Two of the four were FORWARD tables (`xrefs.json`, `document-xrefs.json`,
 * 993 KB) whose only consumer was a lazy inversion this module ran on the
 * first Bible chapter that asked — the forward direction is a link the
 * grammar renders from the citation string itself, so nothing ever read them
 * forward. They are inverted at build time now and sharded by book
 * (`scripts/build-xrefs.mjs`), which is what let the index grow from two
 * citers to eight without any page paying for the growth: a Bible chapter
 * fetches its own book (39 KB gzipped for Matthew, the worst; a few
 * kilobytes for most), and every other route fetches none of them.
 *
 * AND EACH TABLE IS FETCHED BY THE PAGE THAT WANTS IT. The four used to
 * arrive in one `Promise.all`, so a Catechism paragraph downloaded the
 * documents' index and the Summa's. They are four independent lazy loads now:
 * a CCC page costs 2.6 KB gzipped where it cost 69.
 *
 * WHY NOTHING HAD TO BECOME `await`. The query functions read a `$state`
 * holder and kick off the load on first call. A caller inside a `$derived` —
 * which is all of them, in the Bible chapter, CCC paragraph, document and
 * Summa routes — therefore registers a dependency on the holder in the same
 * breath that it asks for the data. It gets an empty result now and re-runs
 * itself when the table lands. No call site changed, no `load()` gained an
 * await, and a page that never asks never fetches.
 *
 * FIXTURES ARE SYNCHRONOUS. Under vitest (`!USE_REAL_CORPUS`) the tables are
 * the hand-authored fixtures, present from module load, so tests observe the
 * same behaviour they always did rather than racing a fetch that never
 * resolves.
 */

import {
	USE_REAL_CORPUS,
	fixtureScriptureCitations,
	scriptureCitationUrl,
	xrefUrls
} from './corpus-index';
import type {
	CccCitationXref,
	Citer,
	DocumentCitationXref,
	ScriptureCitationsFile,
	SummaCitationXref
} from './types';

/**
 * One lazily-fetched table.
 *
 * A CLASS BECAUSE THERE ARE NOW FOUR OF THEM, and the shape each one needs is
 * the same three lines: hold a `$state` slot, start the fetch on the first
 * read, and hand back the fallback until it lands. Written out four times it
 * was four chances to forget the `catch` — a failed apparatus fetch must not
 * take the page with it, and must not be retried on a loop either.
 *
 * The rejection is swallowed and the slot is filled with the empty value, so
 * a broken build costs the reader the cross-reference footers and keeps the
 * text. Deliberately NOT `retryable-once.ts`: this is the case that module's
 * docblock excludes, a memo whose failure is meant to be terminal for the
 * session rather than retried on every render.
 */
class LazyTable<T> {
	#state = $state<{ value: T | null }>({ value: null });
	#loading: Promise<void> | null = null;
	readonly #empty: T;
	readonly #url: () => string | undefined;

	constructor(url: () => string | undefined, empty: T, fixture?: T) {
		this.#url = url;
		this.#empty = empty;
		if (!USE_REAL_CORPUS) this.#state.value = fixture ?? empty;
	}

	/** Read it, starting the fetch if this is the first ask. Reading the
	 *  `$state` slot here is what registers the dependency in a calling
	 *  `$derived`, so the same line both triggers the load and arranges for
	 *  the re-run. */
	get(): T {
		const loaded = this.#state.value;
		if (loaded) return loaded;
		this.#loading ??= this.#load();
		return this.#empty;
	}

	async #load(): Promise<void> {
		this.#state.value = await fetchJson<T>(this.#url(), this.#empty);
	}
}

/**
 * A fetched JSON table, or the fallback.
 *
 * `url` undefined means the file is not in this build at all — a fixture
 * build, or a book nothing in the corpus cites — which is an ordinary answer
 * and not an error.
 */
async function fetchJson<T>(url: string | undefined, fallback: T): Promise<T> {
	if (!url) return fallback;
	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`xrefs: failed to fetch ${url} (${response.status})`);
		return (await response.json()) as T;
	} catch (err) {
		console.error('[xrefs] failed to load a citation table', err);
		return fallback;
	}
}

// --- The scripture index, one book at a time -------------------------------

/**
 * Books already fetched, and a counter that moves when one lands.
 *
 * THE COUNTER IS NOT BELT AND BRACES. A `$derived` that asks for a book
 * nothing has fetched yet reads a MISSING property of the map; making a
 * re-run depend on that alone would rest on the state proxy tracking absent
 * keys, which it does, but which is also the kind of thing a refactor
 * silently breaks. `generation` is read on every call, so the dependency
 * exists whatever the key did.
 */
const scripture = $state<{
	books: Record<string, ScriptureCitationsFile>;
	generation: number;
}>({
	books: USE_REAL_CORPUS ? {} : fixtureScriptureCitations,
	generation: 0
});
const requested = new Set<string>();

function scriptureBook(osis: string): ScriptureCitationsFile | undefined {
	// Read first, so the dependency is registered before any early return.
	void scripture.generation;
	const held = scripture.books[osis];
	if (held || !USE_REAL_CORPUS) return held;
	if (!requested.has(osis)) {
		requested.add(osis);
		void fetchJson<ScriptureCitationsFile>(scriptureCitationUrl(osis), {}).then((file) => {
			scripture.books[osis] = file;
			// Incremented off the CURRENT value, never off one read before the
			// fetch: two books in flight at once would otherwise write the same
			// number and the second landing would notify nobody.
			scripture.generation += 1;
		});
	}
	return undefined;
}

/**
 * Everything in the corpus that cites one chapter, keyed by verse number
 * (0 = the chapter as a whole). Empty map when nothing cites it.
 *
 * Scoped to a chapter rather than exposing the book because that is exactly
 * what a reading page needs, and it keeps the shape callers iterate small
 * enough to hand straight to a template.
 *
 * VERSE 0 IS THE WHOLE-CHAPTER SENTINEL and callers render it as a
 * chapter-level row. A work that cited the chapter did not cite each verse in
 * it, and did cite something; the sentinel is what says both.
 */
export function getScriptureCitationsForChapter(
	osis: string,
	chapter: number
): Map<number, Citer[]> {
	const verses = scriptureBook(osis)?.[String(chapter)];
	if (!verses) return new Map();
	return new Map(Object.entries(verses).map(([verse, citers]) => [Number(verse), citers]));
}

// --- The three whole-work tables -------------------------------------------

const documentCitations = new LazyTable<DocumentCitationXref[]>(
	() => xrefUrls.documentCitations,
	[]
);
const cccCitations = new LazyTable<CccCitationXref[]>(() => xrefUrls.cccCitations, []);
const summaCitations = new LazyTable<SummaCitationXref[]>(() => xrefUrls.summaCitations, []);

/**
 * These three are ALREADY INVERTED, unlike the scripture index, which is why
 * nothing here inverts anything: they have no forward use — a forward link is
 * one the grammar renders from the citation string itself, with nothing
 * stored — so the builder emits them in the only shape anything reads them
 * in (`scripts/build-xrefs.mjs`).
 *
 * What is memoised is the grouping by address, which is a linear pass over
 * the table and would otherwise run on every navigation.
 */
let documentIndex: Map<string, Map<number | null, Citer[]>> | null = null;
let documentIndexFrom: DocumentCitationXref[] | null = null;

/**
 * Every citer of one document, keyed by the section cited (`null` = the
 * document at large). Empty map when nothing cites it.
 *
 * Grouped by section because the reader is standing on one section and wants
 * that section's citers, not a flat list to filter. The `null` key holds the
 * citations that name the document without naming a section — see
 * `DocumentCitationXref`.
 */
export function getDocumentCitations(slug: string): Map<number | null, Citer[]> {
	const table = documentCitations.get();
	// Keyed on the TABLE and not a boolean, so the memo rebuilds exactly once
	// when the fetch lands and never again.
	if (documentIndexFrom !== table) {
		documentIndexFrom = table;
		documentIndex = new Map();
		for (const entry of table) {
			let bySection = documentIndex.get(entry.work);
			if (!bySection) documentIndex.set(entry.work, (bySection = new Map()));
			bySection.set(entry.n, entry.cited_by);
		}
	}
	return documentIndex?.get(slug) ?? new Map();
}

let cccIndex: Map<number, Citer[]> | null = null;
let cccIndexFrom: CccCitationXref[] | null = null;

/** Who cites one Catechism paragraph. Empty array when nothing does. */
export function getCccCitations(cccN: number): Citer[] {
	const table = cccCitations.get();
	if (cccIndexFrom !== table) {
		cccIndexFrom = table;
		cccIndex = new Map(table.map((entry) => [entry.ccc, entry.cited_by]));
	}
	return cccIndex?.get(cccN) ?? [];
}

let summaIndex: Map<string, Map<number | null, Citer[]>> | null = null;
let summaIndexFrom: SummaCitationXref[] | null = null;

/**
 * Every citer of one question of the Summa, keyed by the article cited
 * (`null` = the question at large).
 *
 * `part` is the grammar's own label (`I-II`), not the URL slug — the same
 * spelling `parseStoredRef` and every citation of the Summa produce, so
 * nothing in the index has to know how a part is written into an address.
 * The page converts with `summaPartFromSlug`.
 */
export function getSummaCitations(part: string, question: number): Map<number | null, Citer[]> {
	const table = summaCitations.get();
	if (summaIndexFrom !== table) {
		summaIndexFrom = table;
		summaIndex = new Map();
		for (const entry of table) {
			const key = `${entry.part}:${entry.question}`;
			let byArticle = summaIndex.get(key);
			if (!byArticle) summaIndex.set(key, (byArticle = new Map()));
			byArticle.set(entry.article, entry.cited_by);
		}
	}
	return summaIndex?.get(`${part}:${question}`) ?? new Map();
}
