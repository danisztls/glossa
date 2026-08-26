/**
 * The four citation tables, fetched after first paint instead of shipped in
 * the boot chunk.
 *
 * WHY THIS MODULE EXISTS. These are the largest thing the boot bundle carried
 * for pages that never ask for it: `document-xrefs.json` (366 KB raw),
 * `xrefs.json` (215 KB), `document-citations.json` (134 KB) and
 * `ccc-citations.json` — 715 KB raw, ~69 KB gzipped, eagerly inlined into the
 * one chunk every route `modulepreload`s. Nothing on the home page, a prayer,
 * a Compendium question or a Summa article reads a byte of it. With `ssr =
 * false` that weight sits squarely in front of first paint on every route.
 *
 * WHAT THEY ARE. Reading apparatus, not reading text: which verses a
 * Catechism paragraph cites, and — the reverse direction — which paragraphs
 * and which magisterial sections cite the verse a reader is looking at. Every
 * one of them renders BELOW the text it annotates. Arriving a moment after
 * first paint is the correct trade for a body of text that arrives sooner;
 * arriving before the text it annotates was never worth anything.
 *
 * WHY NOTHING HAD TO BECOME `await`. The query functions read a `$state`
 * holder and kick off the load on first call. A caller inside a `$derived` —
 * which is all four of them, in the Bible chapter, CCC paragraph and document
 * routes — therefore registers a dependency on the holder in the same breath
 * that it asks for the data. It gets an empty result now and re-runs itself
 * when the tables land. No call site changed, no `load()` gained an await, and
 * a page that never asks never fetches.
 *
 * FIXTURES ARE SYNCHRONOUS. Under vitest (`!USE_REAL_CORPUS`) the tables are
 * the hand-authored fixtures, present from module load, so tests observe the
 * same behaviour they always did rather than racing a fetch that never
 * resolves.
 */

import {
	USE_REAL_CORPUS,
	cccBibleXrefsByCcc as fixtureCccBibleXrefsByCcc,
	xrefUrls
} from './corpus-index';
import type {
	CccCitationXref,
	Citer,
	DocumentBibleXref,
	DocumentCitationXref,
	ScriptureRef
} from './types';

interface XrefTables {
	cccBibleXrefsByCcc: Map<number, ScriptureRef[]>;
	documentBibleXrefs: DocumentBibleXref[];
	documentCitationXrefs: DocumentCitationXref[];
	cccCitationXrefs: CccCitationXref[];
}

const EMPTY: XrefTables = {
	cccBibleXrefsByCcc: new Map(),
	documentBibleXrefs: [],
	documentCitationXrefs: [],
	cccCitationXrefs: []
};

/**
 * Held in an object rather than a bare `let` so the value can be replaced from
 * outside a component and every reader still sees it — the standard shape for
 * cross-module `$state`.
 */
const store = $state<{ tables: XrefTables | null }>({
	tables: USE_REAL_CORPUS ? null : { ...EMPTY, cccBibleXrefsByCcc: fixtureCccBibleXrefsByCcc }
});

let loading: Promise<void> | null = null;

/**
 * Read the tables, starting the fetch if this is the first ask.
 *
 * Returns empty rather than a promise, which is what lets the callers stay
 * synchronous — see this module's docblock. Reading `store.tables` here is
 * also what registers the dependency in a calling `$derived`, so the same line
 * both triggers the load and arranges for the re-run.
 */
function tables(): XrefTables {
	const loaded = store.tables;
	if (loaded) return loaded;
	loading ??= load();
	return EMPTY;
}

async function load(): Promise<void> {
	try {
		const [ccc, documents, documentCiters, cccCiters] = await Promise.all([
			fetchTable<{ ccc: number; refs: ScriptureRef[] }[]>(xrefUrls.cccBible),
			fetchTable<DocumentBibleXref[]>(xrefUrls.documentBible),
			fetchTable<DocumentCitationXref[]>(xrefUrls.documentCitations),
			fetchTable<CccCitationXref[]>(xrefUrls.cccCitations)
		]);
		store.tables = {
			cccBibleXrefsByCcc: new Map(ccc.map((entry) => [entry.ccc, entry.refs])),
			documentBibleXrefs: documents,
			documentCitationXrefs: documentCiters,
			cccCitationXrefs: cccCiters
		};
	} catch (err) {
		// A failed apparatus fetch must not take the page with it: the reader
		// loses the cross-reference footers and keeps the text. Left unresolved
		// rather than retried, so a broken build does not spin.
		console.error('[xrefs] failed to load the citation tables', err);
		store.tables = EMPTY;
	}
	// Every memo below is derived from `store.tables`; clearing them here is
	// what makes the first post-load call rebuild rather than serve the empty
	// indexes it built while the fetch was in flight.
	cccBibleReverseIndex = null;
	documentBibleReverseIndex = null;
	documentCitationIndex = null;
	cccCitationIndex = null;
}

async function fetchTable<T>(url: string | undefined): Promise<T> {
	if (!url) return [] as T;
	const response = await fetch(url);
	if (!response.ok) throw new Error(`xrefs: failed to fetch ${url} (${response.status})`);
	return response.json() as Promise<T>;
}

/**
 * Scripture references for a CCC paragraph (xrefs/ccc-bible.json, derived —
 * see docs/corpus-schema.md). References are edition-independent (OSIS +
 * chapter + verse); resolve against whichever Bible edition the reader has
 * open. Index-backed (small — see corpus-index.ts): empty array when the
 * paragraph has none, or the xrefs file itself is absent (fixtures without
 * one).
 */
export function getCccBibleXrefs(cccN: number): ScriptureRef[] {
	return tables().cccBibleXrefsByCcc.get(cccN) ?? [];
}

/**
 * The REVERSE direction of the same data: which CCC paragraphs cite a given
 * chapter, grouped by verse.
 *
 * docs/decisions.md calls bidirectional CCC-Bible linking the flagship v1
 * feature, and only the forward half (`getCccBibleXrefs`) ever shipped: a
 * reader could go from a Catechism paragraph to the verse it cites, but a
 * reader in the Bible had no way to learn that the verse in front of them is
 * cited in the Catechism at all. This is the other half, and it needs no new
 * corpus data -- the same `xrefs/ccc-bible.json` inverted.
 *
 * INVERTED LAZILY AND ONCE, on the first Bible chapter that asks. The
 * forward file is ~3,800 refs over 1,198 paragraphs; building the reverse
 * map eagerly at module load would put that work on every page in the site,
 * including the ones that never open a Bible chapter. Building it per-call
 * would put it on every chapter navigation. The memo is the obvious middle,
 * and the data is immutable once loaded.
 *
 * A WHOLE-CHAPTER CITATION (`verses: []`, the corpus's convention -- see
 * `ScriptureRef`) is recorded under the sentinel key 0 rather than being
 * dropped or expanded across every verse in the chapter. Expanding it would
 * claim the Catechism cites each verse individually, which is a different
 * and stronger statement than what it actually did; dropping it would lose a
 * real citation. Callers render key 0 as a chapter-level note.
 */
type CccCitationsByVerse = Map<number, number[]>;
let cccBibleReverseIndex: Map<string, CccCitationsByVerse> | null = null;

function reverseKey(osis: string, chapter: number): string {
	return `${osis}:${chapter}`;
}

function buildCccBibleReverseIndex(): Map<string, CccCitationsByVerse> {
	const index = new Map<string, CccCitationsByVerse>();
	for (const [cccN, refs] of tables().cccBibleXrefsByCcc) {
		for (const ref of refs) {
			const key = reverseKey(ref.osis, ref.chapter);
			let byVerse = index.get(key);
			if (!byVerse) index.set(key, (byVerse = new Map()));
			// `[0]` rather than `ref.verses` when empty -- see the docblock.
			for (const verse of ref.verses.length > 0 ? ref.verses : [0]) {
				const list = byVerse.get(verse);
				if (list) {
					// The same paragraph can cite the same verse twice (a "cf."
					// repeat in a long footnote); the reader wants one link.
					if (!list.includes(cccN)) list.push(cccN);
				} else {
					byVerse.set(verse, [cccN]);
				}
			}
		}
	}
	for (const byVerse of index.values()) {
		for (const list of byVerse.values()) list.sort((a, b) => a - b);
	}
	return index;
}

/**
 * CCC paragraph numbers citing each verse of one chapter, keyed by verse
 * number (0 = the chapter as a whole). Empty map when nothing cites it.
 *
 * Scoped to a chapter rather than exposing the whole reverse index because
 * that is exactly what a reading page needs, and it keeps the shape that
 * callers iterate small enough to hand straight to a template.
 */
export function getCccCitationsForChapter(osis: string, chapter: number): CccCitationsByVerse {
	cccBibleReverseIndex ??= buildCccBibleReverseIndex();
	return cccBibleReverseIndex.get(reverseKey(osis, chapter)) ?? new Map();
}

/**
 * The same relation for the magisterial documents: which SECTION of which
 * document cites each verse of one chapter.
 *
 * Grouped by document here rather than left as a flat list, because that is
 * the shape the reader wants and the shape the page renders — one label per
 * work with its section numbers beside it ("Lumen Gentium §8 §22"), not the
 * work's name repeated once per section. Sections within a document come out
 * ascending; the documents themselves are left in the index's own order,
 * which is alphabetical by slug, and the page re-sorts by display title since
 * the title is what a reader actually scans.
 *
 * Same lazy-once inversion as the CCC index above, and for the same reason:
 * ~1,900 entries is real work to invert, and no page outside a Bible chapter
 * ever asks for it. `verses: []` (a whole-chapter citation) lands under the
 * sentinel key 0, identically.
 */
export interface DocumentCitation {
	slug: string;
	sections: number[];
}
type DocumentCitationsByVerse = Map<number, DocumentCitation[]>;

let documentBibleReverseIndex: Map<string, DocumentCitationsByVerse> | null = null;

function buildDocumentBibleReverseIndex(): Map<string, DocumentCitationsByVerse> {
	const index = new Map<string, DocumentCitationsByVerse>();
	for (const entry of tables().documentBibleXrefs) {
		for (const ref of entry.refs) {
			const key = reverseKey(ref.osis, ref.chapter);
			let byVerse = index.get(key);
			if (!byVerse) index.set(key, (byVerse = new Map()));
			for (const verse of ref.verses.length > 0 ? ref.verses : [0]) {
				let works = byVerse.get(verse);
				if (!works) byVerse.set(verse, (works = []));
				const existing = works.find((w) => w.slug === entry.work);
				if (existing) {
					// One section can cite the same verse from two of its
					// citations; the reader wants one link.
					if (!existing.sections.includes(entry.n)) existing.sections.push(entry.n);
				} else {
					works.push({ slug: entry.work, sections: [entry.n] });
				}
			}
		}
	}
	for (const byVerse of index.values()) {
		for (const works of byVerse.values()) {
			for (const work of works) work.sections.sort((a, b) => a - b);
		}
	}
	return index;
}

export function getDocumentCitationsForChapter(
	osis: string,
	chapter: number
): DocumentCitationsByVerse {
	documentBibleReverseIndex ??= buildDocumentBibleReverseIndex();
	return documentBibleReverseIndex.get(reverseKey(osis, chapter)) ?? new Map();
}

/**
 * The non-scripture reverse index: who cites this document, and who cites
 * this Catechism paragraph.
 *
 * ALREADY INVERTED, unlike the two above, which is why there is no lazy build
 * here. Those two invert a forward index the site also needs forward (a
 * paragraph's own references); this one has no forward use — the forward
 * direction is a link the grammar renders from the citation string itself,
 * with nothing stored. So the builder emits it in the only shape anything
 * reads it in (`scripts/build-xrefs.mjs`).
 *
 * Grouped by section for the same reason `DocumentCitation` groups by work:
 * the reader is standing on one section and wants that section's citers, not
 * a flat list to filter. The `null` key holds the citations that name the
 * document without naming a section of it — see `DocumentCitationXref`.
 */
let documentCitationIndex: Map<string, Map<number | null, Citer[]>> | null = null;

function buildDocumentCitationIndex(): Map<string, Map<number | null, Citer[]>> {
	const index = new Map<string, Map<number | null, Citer[]>>();
	for (const entry of tables().documentCitationXrefs) {
		let bySection = index.get(entry.work);
		if (!bySection) index.set(entry.work, (bySection = new Map()));
		bySection.set(entry.n, entry.cited_by);
	}
	return index;
}

/**
 * Every citer of one document, keyed by the section cited (`null` = the
 * document at large). Empty map when nothing cites it.
 */
export function getDocumentCitations(slug: string): Map<number | null, Citer[]> {
	documentCitationIndex ??= buildDocumentCitationIndex();
	return documentCitationIndex.get(slug) ?? new Map();
}

let cccCitationIndex: Map<number, Citer[]> | null = null;

/** Who cites one Catechism paragraph. Empty array when nothing does. */
export function getCccCitations(cccN: number): Citer[] {
	cccCitationIndex ??= new Map(
		tables().cccCitationXrefs.map((entry) => [entry.ccc, entry.cited_by])
	);
	return cccCitationIndex.get(cccN) ?? [];
}
