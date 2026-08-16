/**
 * Corpus access layer — public API. `corpus-index.ts` builds the boot
 * index (registries + content-tier URL maps, see that file's docblock);
 * this module is what every route/component actually imports, and it's
 * responsible for two things the index alone doesn't give you: the
 * structure-tree walkers shared by the CCC and Compendium, and — the part
 * that changed on 2026-08-15 — fetching the actual reading text.
 *
 * WHY FETCH, NOW, WHEN THIS FILE USED TO ARGUE THE OPPOSITE: until
 * 2026-08-15 this module `import.meta.glob(..., { eager: true })`-ed the
 * ENTIRE corpus (every Bible verse, every CCC paragraph, every Compendium
 * answer, both languages) straight into the client JS graph, on the
 * reasoning that adapter-static prerenders every route at build time (no
 * server runtime, docs/decisions.md) so inlining avoided a network
 * round-trip and any risk of drift between what a page fetched and what
 * got embedded in it. That reasoning is correct as far as it goes — it just
 * doesn't scale. Measured against the real corpus: one chunk file, 18 MB
 * raw / 4.6 MB gzipped, `modulepreload`-ed on every page including the
 * home page, because "inline everything" doesn't distinguish between "the
 * page needs this" and "this exists somewhere in the corpus." A phone
 * doesn't just download that chunk once; it PARSES 18 MB of JS and holds
 * it on the heap for the lifetime of every tab, on every visit, to read
 * one Bible chapter. Content here is immutable (a published CCC paragraph
 * or Bible verse doesn't change once stable) — which is precisely the
 * property that makes per-file `fetch()` + long-lived caching strictly
 * better than eager-inlining once the corpus is real-sized: a
 * content-hashed file fetched once is cached forever (`immutable`
 * Cache-Control, wired at the host), and adding a work invalidates only
 * that work's files, never the whole library.
 *
 * THE SPLIT THIS LEADS TO (see `corpus-index.ts`'s docblock for the physical
 * layout `scripts/sync-corpus.mjs` produces):
 *   - INDEX tier (`corpus-data/index/`): manifests, canonical book/chapter
 *     NUMBERS, CCC/Compendium TOC trees, abbreviations, xrefs — small
 *     (kilobytes, not megabytes) and needed SYNCHRONOUSLY by components
 *     that read it outside any `load()` (the book/chapter picker, the jump
 *     box, both TOC pages). Still eager-glob-inlined — at this size that's
 *     the right call, not the mistake the content tier was.
 *   - CONTENT tier (`corpus-data/content/`): the actual reading text —
 *     Bible books (73/edition), CCC paragraphs (chunked, 100/file), the
 *     Compendium (whole per language). Globbed with `{ query: '?url' }`,
 *     which makes Vite emit each file as its own content-hashed build
 *     asset and hand back its URL as a plain string — the client bundle
 *     ends up with a few hundred URL strings, not 21 MB of JSON.
 *
 * HOW CONTENT ACTUALLY GETS READ IS NOT "fetch() everywhere" — that was
 * the first attempt, and it broke twice, both times because SvelteKit's
 * `load`-time `fetch` is doing more than moving bytes:
 *   1. A plain global `fetch()` with a relative URL fails outright during
 *      prerendering ("Failed to parse URL from /_app/immutable/...") —
 *      Node's `fetch` has no origin to resolve a relative URL against.
 *      SvelteKit's `load(event)` hands `load` a special `fetch` that
 *      SOLVES this (it resolves same-origin URLs by invoking the request
 *      in-process) — but reaching for it walks straight into the next
 *      problem.
 *   2. That special `fetch` also INLINES the full response of every
 *      request it makes into the prerendered page, so a client-side
 *      `load()` re-run can replay it without a network round-trip — a real
 *      feature, useful for dynamic routes, but one that applies to the raw
 *      response, not to whatever slice `load()` returns. Fetching a whole
 *      book that way to read one chapter measured out to a ~300 KB
 *      Genesis-1 page — the entire book, re-embedded, once per chapter:
 *      exactly the per-page bloat this rewrite exists to remove, just
 *      relocated from the JS bundle into the HTML.
 * So content is read two different ways depending on where the code runs,
 * and the split is SSR vs browser, not "prerender vs runtime" as it might
 * look: during SSR (`import.meta.env.SSR`, true for every prerendered
 * page), `readContentFromDisk` reads the file straight off disk with
 * `node:fs` — no `fetch` involved, so nothing auto-inlines anything; in the
 * browser, `readContentFromNetwork` is a normal `fetch()` against the
 * content-hashed URL, immutable-cached from the second read on. Both
 * branches share one memoization cache and one public function
 * (`getChapter`, `getCccParagraphAsync`, …) — this is what makes "one call
 * shape, not a server/client branch" true at every call site; only
 * `readContent` itself knows the two paths differ, and why.
 *
 * COARSE READ, NARROW RETURN: reading is per-BOOK / per-CHUNK /
 * per-LANGUAGE-WHOLE (the granularity a service worker should cache), never
 * per-page — but a `load()` must not then embed the whole read object into
 * that page's data (see point 2 above — this discipline matters even
 * MORE now that content isn't fetched through SvelteKit's auto-inlining
 * fetch, because there's no framework backstop catching an oversized
 * return value either; it's on this module alone to keep the cut narrow).
 * `getChapter` reads an entire book but returns only the one requested
 * `Chapter` (verses) alongside book *metadata* (name/osis/abbrevs — no
 * other chapter's verses); the CCC/Compendium neighbor helpers return bare
 * `{ n }` for prev/next rather than the neighboring paragraph's/question's
 * full content, since every caller only ever links to it by number.
 *
 * FUNCTIONS THAT STAYED SYNCHRONOUS ARE BACKED BY THE INDEX, NOT CONTENT:
 * `findBookByAbbrev`/`workIdToEdition` (depended on synchronously by
 * `refs.ts`, which this restructuring must not require editing) only ever
 * needed book metadata (name/osis/abbrevs/order/chapter EXISTENCE) — never
 * verse text — so they're unaffected by the content tier moving to fetch:
 * they still read straight out of `corpus-index.ts`'s `bibleIndex`, still
 * synchronous, still returning immediately. Same story for the book/chapter
 * picker, the CCC/Compendium TOC trees, and paragraph-number existence
 * checks (`cccParagraphExists`, used by the jump box and the "related
 * paragraphs" links) — all index-backed, all still plain synchronous calls.
 * Only the functions that need actual reading TEXT (`getChapter`,
 * `getCccParagraphAsync`, `getCompendiumQuestionAsync` and friends) became
 * `async`; every caller of those is a route `load()`, which was already the
 * right place for async work.
 *
 * FIXTURES (`src/lib/fixtures/`, always used under vitest — see the
 * `USE_REAL_CORPUS` guard re-exported from `corpus-index.ts`, and that
 * file's docblock for why the guard exists) never had a content tier to
 * fetch from — they're two hand-authored books and a couple dozen
 * paragraphs, already in memory. The `async` functions below still return
 * `Promise`s under fixtures (for one call shape regardless of branch); they
 * just resolve immediately from the already-imported fixture data instead
 * of issuing a `fetch()`.
 */

import type {
	CccNode,
	CccParagraph,
	Chapter,
	CompendiumQuestion,
	DocumentManifest,
	DocumentSection,
	ScriptureRef,
	StructureNode,
	WorkManifest,
	WorkType
} from './types';

import {
	USE_REAL_CORPUS,
	bibleIndex,
	cccAbbreviations,
	cccBibleXrefsByCcc,
	cccChunkLocation,
	cccChunkStartFor,
	cccParagraphNumbers,
	cccStructures,
	compendiumQuestionsLocation,
	compendiumStructures,
	documentSectionsLocation,
	documentSectionNumbers,
	documentStructures,
	fixtureBibleBooks,
	fixtureCccParagraphsByLang,
	fixtureCompendiumQuestionsByLang,
	bibleBookLocation,
	manifests,
	listContentAssets,
	type BibleBookMeta,
	type ContentAsset,
	type ContentLocation
} from './corpus-index';

export type { BibleBookMeta, ContentAsset };
export { USE_REAL_CORPUS, listContentAssets };

// --- Works -----------------------------------------------------------------

/** All work manifests available in this corpus, in registry order. */
export function listWorks(): WorkManifest[] {
	return Object.values(manifests);
}

export function getWork(workId: string): WorkManifest | undefined {
	return manifests[workId];
}

/** Convenience: just the Bible works. */
export function listBibleWorks(): WorkManifest[] {
	return listWorks().filter((w) => w.type === 'bible');
}

/** All works of a given type, in registry order (unsorted — see `listEditions`). */
export function listWorksOfType(type: WorkType): WorkManifest[] {
	return listWorks().filter((w) => w.type === type);
}

/**
 * Editions of a work type, sorted by language then id — the order the
 * edition/version selector (docs/decisions.md #1) lists them in. Distinct
 * from `listWorksOfType`, which returns registry order.
 */
export function listEditions(type: WorkType): WorkManifest[] {
	return listWorksOfType(type).sort(
		(a, b) => baseLang(a.language).localeCompare(baseLang(b.language)) || a.id.localeCompare(b.id)
	);
}

/**
 * Preferred work id for a type at a UI language (docs/decisions.md #1:
 * content language follows UI language by default) — the first edition
 * whose language matches, or any edition if none does.
 */
export function defaultWorkId(type: WorkType, lang: string): string | undefined {
	const target = baseLang(lang);
	const editions = listEditions(type);
	const match = editions.find((w) => baseLang(w.language) === target);
	return (match ?? editions[0])?.id;
}

/** BCP-47 language tag -> bare language subtag, e.g. "pt-PT" -> "pt". */
export function baseLang(tag: string): string {
	return tag.split('-')[0].toLowerCase();
}

/**
 * Bible work IDs are `bible.{edition}` (see docs/corpus-schema.md); routes
 * use just the `{edition}` part (e.g. `cpdv.en`) to avoid the `bible/bible.`
 * stutter in URLs like `/bible/cpdv.en/john/3`.
 */
export function editionToWorkId(edition: string): string {
	return `bible.${edition}`;
}

export function workIdToEdition(workId: string): string {
	return workId.replace(/^bible\./, '');
}

// --- Bible: index-backed (metadata + chapter existence, sync) -------------

export function getBook(workId: string, osis: string): BibleBookMeta | undefined {
	return bibleIndex[workId]?.find((b) => b.osis === osis);
}

/** All books physically present for a work, in canonical (`order`) order —
 *  already sorted by `scripts/sync-corpus.mjs` / `corpus-index.ts`'s fixture
 *  branch. */
export function listBooks(workId: string): BibleBookMeta[] {
	return bibleIndex[workId] ?? [];
}

/** The chapter immediately before/after the given one, among chapters present. */
export function getAdjacentChapter(
	workId: string,
	osis: string,
	chapterN: number,
	direction: 'prev' | 'next'
): number | undefined {
	const book = getBook(workId, osis);
	if (!book) return undefined;
	const ns = book.chapters.map((c) => c.n).sort((a, b) => a - b);
	const idx = ns.indexOf(chapterN);
	if (idx === -1) return undefined;
	const nextIdx = direction === 'next' ? idx + 1 : idx - 1;
	return ns[nextIdx];
}

/**
 * Like `getAdjacentChapter`, but rolls over into the next/previous book
 * when the current book has no more chapters in that direction — this is
 * what gives the reading view a continuous, book-like flow (docs/decisions.md
 * "Reading mode: continuous, book-like") instead of dead-ending at each
 * book's edges.
 */
export function getAdjacentChapterAcrossBooks(
	workId: string,
	osis: string,
	chapterN: number,
	direction: 'prev' | 'next'
): { osis: string; chapter: number } | undefined {
	const within = getAdjacentChapter(workId, osis, chapterN, direction);
	if (within !== undefined) return { osis, chapter: within };

	const books = listBooks(workId);
	const bookIdx = books.findIndex((b) => b.osis === osis);
	if (bookIdx === -1) return undefined;

	const adjacentBook = books[direction === 'next' ? bookIdx + 1 : bookIdx - 1];
	if (!adjacentBook || adjacentBook.chapters.length === 0) return undefined;

	const chapterNs = adjacentBook.chapters.map((c) => c.n).sort((a, b) => a - b);
	const chapter = direction === 'next' ? chapterNs[0] : chapterNs[chapterNs.length - 1];
	return { osis: adjacentBook.osis, chapter };
}

/** Find a book by one of its jump-box abbreviations (case-insensitive). */
export function findBookByAbbrev(workId: string, abbrev: string): BibleBookMeta | undefined {
	const needle = abbrev.trim().toLowerCase();
	return listBooks(workId).find(
		(b) => b.osis === needle || b.abbrevs.some((a) => a.toLowerCase() === needle)
	);
}

// --- Canonical (edition-independent) Bible structure ---------------------
//
// Tables of contents and the book/chapter picker describe the *work*, not
// whichever edition is currently selected (docs/decisions.md #4): a reader
// picking "Genesis 12" shouldn't see the picker change shape when they
// switch editions. `CanonicalBook` is the union of a book's presence across
// every Bible work — every osis code and chapter number seen in ANY
// edition — with `namesByWorkId` carrying each edition's own display name
// so callers can still label the book in the reader's chosen edition.
//
// Computed once at module load (not per call): with up to 73 books x ~150
// chapters x every Bible edition, re-walking this on every render would be
// wasteful for something that never changes at runtime. Index-backed (chapter
// NUMBERS only), same as everything else in this section — no content fetch.

export interface CanonicalBook {
	osis: string;
	order: number;
	/** Chapter numbers present in at least one edition, ascending. */
	chapters: number[];
	/** Display name per bible work id, for labelling in the reader's own edition. */
	namesByWorkId: Record<string, string>;
}

const canonicalBooksByOsis: Map<string, CanonicalBook> = (() => {
	const out = new Map<string, CanonicalBook>();
	// Sorted for determinism: iteration order otherwise depends on
	// filesystem/glob enumeration order, which isn't guaranteed stable.
	const works = [...listBibleWorks()].sort((a, b) => a.id.localeCompare(b.id));
	for (const work of works) {
		for (const book of listBooks(work.id)) {
			let entry = out.get(book.osis);
			if (!entry) {
				entry = { osis: book.osis, order: book.order, chapters: [], namesByWorkId: {} };
				out.set(book.osis, entry);
			}
			entry.namesByWorkId[work.id] = book.name;
			const chapters = new Set(entry.chapters);
			for (const chapter of book.chapters) chapters.add(chapter.n);
			entry.chapters = [...chapters].sort((a, b) => a - b);
		}
	}
	return out;
})();

export function listCanonicalBooks(): CanonicalBook[] {
	return [...canonicalBooksByOsis.values()].sort((a, b) => a.order - b.order);
}

export function getCanonicalBook(osis: string): CanonicalBook | undefined {
	return canonicalBooksByOsis.get(osis);
}

// --- Bible: content tier (async, read/fetched, memoized) -------------------

/**
 * `__CORPUS_DATA_DIR__`: the absolute path to `src/lib/corpus-data/`,
 * baked in at build time by `vite.config.ts` (`define`) — see that file's
 * comment for why it's injected there rather than derived from
 * `import.meta.url` here (Vite's SSR build bundles this module into a
 * chunk that doesn't live in `src/lib/`, so a self-relative path would
 * resolve against the wrong directory).
 */
declare const __CORPUS_DATA_DIR__: string;

/**
 * Content is read two different ways depending on where this code runs,
 * and the split is NOT the obvious "prerender vs runtime" one:
 *
 *   - SSR (`import.meta.env.SSR`, true during prerendering): reads the
 *     file straight off disk with `node:fs`. This is NOT primarily an
 *     optimization — it's required for correctness. SvelteKit's `load`-time
 *     `fetch` inlines the FULL response of every request it makes into the
 *     prerendered page's hydration payload, so a future client-side
 *     `load()` re-run can replay it without a network round-trip — a real
 *     feature, but one that applies to the raw response, not to whatever
 *     slice `load()` actually returns. Tried first, measured: fetching a
 *     whole book that way to read one chapter produced a ~300 KB page for
 *     Genesis 1 (the entire book, re-embedded, once per chapter — the
 *     exact per-page re-bloat this whole restructuring exists to remove,
 *     just relocated). A plain `fs.readFile` has no such side effect —
 *     nothing inlines a value into the page except `load`'s own return.
 *   - Browser (post-hydration, client-side navigation): a normal `fetch()`
 *     against the content-hashed URL, cached by the HTTP cache and (once
 *     wired) the service worker.
 *
 * Both branches share the same in-memory memoization below, so this is
 * still "one call shape, not a server/client branch" at every call site —
 * only this one function knows the two paths differ.
 */
/** relPath -> in-flight/resolved read, so N pages needing the same book
 *  (every chapter of Genesis wants Genesis's one file) issue exactly one
 *  disk read / fetch. */
const contentCache = new Map<string, Promise<unknown>>();

async function readContent<T>(location: ContentLocation): Promise<T> {
	let pending = contentCache.get(location.relPath) as Promise<T> | undefined;
	if (!pending) {
		pending = import.meta.env.SSR
			? readContentFromDisk<T>(location.relPath)
			: readContentFromNetwork<T>(location.url);
		contentCache.set(location.relPath, pending);
	}
	return pending;
}

async function readContentFromDisk<T>(relPath: string): Promise<T> {
	const { readFile } = await import('node:fs/promises');
	const path = await import('node:path');
	const raw = await readFile(path.join(__CORPUS_DATA_DIR__, relPath), 'utf8');
	return JSON.parse(raw) as T;
}

async function readContentFromNetwork<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`corpus.ts: failed to fetch ${url} (${res.status})`);
	return res.json() as Promise<T>;
}

async function fetchBookContent(
	workId: string,
	osis: string
): Promise<{ chapters: Chapter[] } | undefined> {
	if (!USE_REAL_CORPUS) return fixtureBibleBooks[workId]?.[osis];
	const location = bibleBookLocation(workId, osis);
	if (!location) return undefined;
	return readContent(location);
}

/**
 * Reads the whole book (content tier) but returns only book METADATA
 * (already had it, from the index — no need to wait on the read for it)
 * plus the ONE requested `Chapter` (verses). See this module's docblock,
 * "COARSE FETCH, NARROW RETURN": returning the full book here would
 * re-embed an entire book's text into every one of its chapter pages'
 * prerendered data, exactly the bloat this rewrite removes.
 */
export async function getChapter(
	workId: string,
	osis: string,
	chapterN: number
): Promise<{ book: BibleBookMeta; chapter: Chapter } | undefined> {
	const book = getBook(workId, osis);
	if (!book || !book.chapters.some((c) => c.n === chapterN)) return undefined;
	const full = await fetchBookContent(workId, osis);
	const chapter = full?.chapters.find((c) => c.n === chapterN);
	if (!chapter) return undefined;
	return { book, chapter };
}

// --- Structure trees (shared: CCC and Compendium) -------------------------
//
// The CCC and Compendium both model their table of contents as the same
// tree shape (`StructureNode`, see types.ts — Compendium's `.paragraphs`
// holds QUESTION ranges there, not CCC paragraph numbers). Both trees use
// the same null-bound convention for unaddressable content
// (docs/corpus-schema.md, "amended 2026-08-14"). Shared here so that
// convention is handled in exactly one place instead of two copies drifting
// apart. Index-backed (structure trees are index tier, not content) — no
// fetch involved anywhere in this section.

/**
 * Walk a structure tree and return the path of nodes from root to the
 * deepest node whose range contains `n` (a breadcrumb trail).
 */
function breadcrumbIn(tree: StructureNode[], n: number): StructureNode[] {
	const path: StructureNode[] = [];

	function walk(nodes: StructureNode[]): boolean {
		for (const node of nodes) {
			const [first, last] = node.paragraphs;
			// A `null` bound marks unnumbered content the structure knows
			// about but no number addresses (creed texts, epigraphs, ...).
			// Treat it as never containing anything rather than letting
			// `n < null` (== `n < 0` via JS coercion) falsely match.
			if (typeof first !== 'number' || typeof last !== 'number') continue;
			if (n < first || n > last) continue;
			path.push(node);
			walk(node.children);
			return true;
		}
		return false;
	}

	walk(tree);
	return path;
}

/** Flatten a structure tree into a depth-first list, for building a TOC. */
function flattenTree(tree: StructureNode[]): { node: StructureNode; depth: number }[] {
	const out: { node: StructureNode; depth: number }[] = [];
	function walk(nodes: StructureNode[], depth: number) {
		for (const node of nodes) {
			out.push({ node, depth });
			walk(node.children, depth + 1);
		}
	}
	walk(tree, 0);
	return out;
}

// --- Catechism: index-backed (structure, abbreviations, existence, sync) --

/** Languages the CCC is available in. */
export function cccLangs(): string[] {
	return Object.keys(cccStructures).sort();
}

export function getCccStructure(lang: string): CccNode[] {
	return cccStructures[lang] ?? [];
}

/** The CCC's own abbreviations table (document sigla, scripture book abbrevs). Not surfaced in the UI yet. */
export function listCccAbbreviations(lang: string) {
	return cccAbbreviations[lang] ?? [];
}

const cccParagraphNumberSets: Record<string, Set<number>> = Object.fromEntries(
	Object.entries(cccParagraphNumbers).map(([lang, ns]) => [lang, new Set(ns)])
);

/** Whether paragraph `n` exists in this corpus for `lang` — index-backed
 *  (no fetch), so the jump box and "related paragraphs" links can check
 *  existence without pulling in that paragraph's content. Never assume a
 *  contiguous range: the fixtures are deliberately gappy (see
 *  `corpus-index.ts`'s docblock). */
export function cccParagraphExists(lang: string, n: number): boolean {
	return cccParagraphNumberSets[lang]?.has(n) ?? false;
}

/** The paragraph number immediately before/after `n` that actually exists,
 *  or undefined at either end. Index-backed — see `cccParagraphExists`. */
export function getAdjacentCccParagraphNumber(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	const ns = cccParagraphNumbers[lang] ?? [];
	if (direction === 'next') return ns.find((x) => x > n);
	return [...ns].reverse().find((x) => x < n);
}

/**
 * Walk the structure tree and return the path of nodes from root to the
 * deepest node whose range contains paragraph `n` (a breadcrumb trail).
 * Shared implementation: see `breadcrumbIn` above.
 */
export function getCccBreadcrumb(lang: string, n: number): CccNode[] {
	return breadcrumbIn(getCccStructure(lang), n);
}

/**
 * Flatten the structure tree into a depth-first list, for building a TOC.
 * Shared implementation: see `flattenTree` above.
 */
export function flattenCccStructure(lang: string): { node: CccNode; depth: number }[] {
	return flattenTree(getCccStructure(lang));
}

/**
 * The kinds that count as a "chapter" for whole-chapter reading, innermost
 * first.
 *
 * `chapter` is the unit a reader means by the word, and the CCC's own
 * structure uses it consistently — but not universally: the Prologue holds
 * paragraphs 1-25 directly under itself with no chapter beneath, so it has
 * to be its own unit. `section` and `part` are the fallbacks for any node
 * arrangement neither covers (none exists in today's corpus; they are here
 * so a structure change upstream degrades to a larger reading unit rather
 * than to no link at all).
 *
 * Deliberately NOT including `article`: articles nest INSIDE chapters, so
 * ranking them innermost would make "read the full chapter" silently mean
 * "read this article" for the ~67 paragraphs that live under one.
 */
const CCC_CHAPTER_KINDS: CccNode['kind'][] = ['chapter', 'prologue', 'section', 'part'];

/** True when a node can serve as a whole-chapter reading unit: a chapter-ish
 *  kind AND a fully-numbered range to actually read (the corpus permits null
 *  bounds, meaning "unaddressable" — docs/corpus-schema.md). */
function isCccChapterNode(node: CccNode): boolean {
	return (
		CCC_CHAPTER_KINDS.includes(node.kind) &&
		Number.isFinite(node.paragraphs[0]) &&
		Number.isFinite(node.paragraphs[1])
	);
}

/**
 * The chapter-sized node containing paragraph `n`, or undefined if none
 * does. Walks the breadcrumb from the inside out and takes the first
 * qualifying ancestor, so a paragraph inside an article inside a chapter
 * resolves to the chapter.
 */
export function getCccChapterFor(lang: string, n: number): CccNode | undefined {
	const trail = getCccBreadcrumb(lang, n);
	for (let i = trail.length - 1; i >= 0; i--) {
		if (isCccChapterNode(trail[i])) return trail[i];
	}
	return undefined;
}

/**
 * Every chapter-sized node in a language's structure — the entry list for
 * prerendering `/ccc/chapter/[n]`, which is addressed by a chapter's FIRST
 * paragraph number.
 *
 * That address is chosen over a slug or an index because it is the only
 * identifier the corpus already guarantees: chapter titles differ by
 * language and change with the case-normalization pass, and an ordinal
 * position shifts if the structure is ever re-parsed, but "the chapter
 * starting at paragraph 27" names the same text in every edition and needs
 * nothing stored to resolve.
 */
export function listCccChapters(lang: string): CccNode[] {
	return flattenCccStructure(lang)
		.map(({ node }) => node)
		.filter(isCccChapterNode);
}

// --- Catechism: content tier (async, read/fetched, memoized, chunked) -----

async function fetchCccChunk(lang: string, n: number): Promise<CccParagraph[]> {
	if (!USE_REAL_CORPUS) return fixtureCccParagraphsByLang[lang] ?? [];
	const location = cccChunkLocation(`ccc.${lang}`, n);
	if (!location) return [];
	return readContent<CccParagraph[]>(location);
}

/** Reads the 100-paragraph chunk `n` lives in (content tier), returns only
 *  paragraph `n` itself. Checks `cccParagraphExists` first so a
 *  not-in-this-corpus number never triggers a read. */
export async function getCccParagraphAsync(
	lang: string,
	n: number
): Promise<CccParagraph | undefined> {
	if (!cccParagraphExists(lang, n)) return undefined;
	const chunk = await fetchCccChunk(lang, n);
	return chunk.find((p) => p.n === n);
}

/**
 * Every paragraph from `from` to `to` inclusive — the whole-chapter reading
 * view (`/ccc/chapter/[n]`).
 *
 * Fetches one chunk per 100-paragraph span the range touches, not one per
 * paragraph: the CCC's largest chapter is ~90 paragraphs, so this is
 * typically one or two reads regardless of range size, and each is the same
 * immutable, already-cacheable file the single-paragraph route pulls. That's
 * the "COARSE FETCH, NARROW RETURN" rule this module's docblock states,
 * applied in the direction it was designed for — a reader who opens a
 * chapter after reading one of its paragraphs usually needs no new request
 * at all.
 *
 * Chunk boundaries do not align with chapter boundaries (chunks are a fixed
 * arithmetic partition of the paragraph space, chapters are editorial), so
 * the fetched chunks are filtered down to the requested range afterwards and
 * re-sorted — a chapter spanning a boundary otherwise arrives in chunk
 * order, which is only coincidentally paragraph order.
 */
export async function getCccParagraphRangeAsync(
	lang: string,
	from: number,
	to: number
): Promise<CccParagraph[]> {
	if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [];

	// Step by chunk rather than by paragraph, then dedupe: `cccChunkStartFor`
	// is a pure function of `n`, so the set of distinct chunk starts is all
	// that decides how many reads happen.
	const starts = new Set<number>();
	for (let n = from; n <= to; n++) starts.add(cccChunkStartFor(n));

	const chunks = await Promise.all([...starts].map((start) => fetchCccChunk(lang, start)));
	return chunks
		.flat()
		.filter((p) => p.n >= from && p.n <= to)
		.sort((a, b) => a.n - b.n);
}

// --- Compendium: index-backed (structure, sync) ----------------------------
//
// The Compendium of the CCC (docs/corpus-schema.md "Compendium —
// questions.json"): 598 Q&A pairs, each printing the CCC paragraph range it
// condenses (`ccc_refs`, a raw string — see docs/link-surface.md #11). Its
// `structure.json` reuses the CCC's tree shape (see `StructureNode` in
// types.ts) but addresses QUESTION numbers via `.paragraphs`, not CCC
// paragraph numbers — every accessor below is careful to say "question",
// never "paragraph", so that distinction stays visible at the call site.

/** Languages the Compendium is available in. */
export function compendiumLangs(): string[] {
	return Object.keys(compendiumStructures).sort();
}

export function getCompendiumStructure(lang: string): StructureNode[] {
	return compendiumStructures[lang] ?? [];
}

/**
 * Walk the structure tree and return the path of nodes from root to the
 * deepest node whose QUESTION range contains `n` (a breadcrumb trail).
 * Shared implementation: see `breadcrumbIn` above.
 */
export function getCompendiumBreadcrumb(lang: string, n: number): StructureNode[] {
	return breadcrumbIn(getCompendiumStructure(lang), n);
}

/**
 * Flatten the structure tree into a depth-first list, for building a TOC.
 * Shared implementation: see `flattenTree` above.
 */
export function flattenCompendiumStructure(lang: string): { node: StructureNode; depth: number }[] {
	return flattenTree(getCompendiumStructure(lang));
}

// --- Compendium: content tier (async, read/fetched, memoized, whole) ------
//
// Unlike the Bible (per book) and the CCC (100-paragraph chunks), the
// Compendium is read WHOLE per language: ~90 KB gzipped total for BOTH
// languages combined (measured against the real corpus 2026-08-15) — well
// under the size that would justify splitting it further (docs/corpus-
// schema.md's own framing: "598 numbered questions" is already a small
// work compared to the Bible or CCC).

async function fetchCompendiumQuestions(lang: string): Promise<CompendiumQuestion[]> {
	if (!USE_REAL_CORPUS) return fixtureCompendiumQuestionsByLang[lang] ?? [];
	const location = compendiumQuestionsLocation(`compendium.${lang}`);
	if (!location) return [];
	return readContent<CompendiumQuestion[]>(location);
}

export async function getCompendiumQuestionAsync(
	lang: string,
	n: number
): Promise<CompendiumQuestion | undefined> {
	const questions = await fetchCompendiumQuestions(lang);
	return questions.find((q) => q.n === n);
}

/** The question number immediately before/after `n` that actually exists.
 *  Operates on the same whole-language read `getCompendiumQuestionAsync`
 *  uses (memoized — this doesn't cost a second read). */
export async function getAdjacentCompendiumQuestionNumber(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): Promise<number | undefined> {
	const questions = await fetchCompendiumQuestions(lang);
	const ns = questions.map((q) => q.n).sort((a, b) => a - b);
	if (direction === 'next') return ns.find((x) => x > n);
	return [...ns].reverse().find((x) => x < n);
}

// --- Cross-references -------------------------------------------------

/**
 * Scripture references for a CCC paragraph (xrefs/ccc-bible.json, derived —
 * see docs/corpus-schema.md). References are edition-independent (OSIS +
 * chapter + verse); resolve against whichever Bible edition the reader has
 * open. Index-backed (small — see corpus-index.ts): empty array when the
 * paragraph has none, or the xrefs file itself is absent (fixtures without
 * one).
 */
export function getCccBibleXrefs(cccN: number): ScriptureRef[] {
	return cccBibleXrefsByCcc.get(cccN) ?? [];
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
	for (const [cccN, refs] of cccBibleXrefsByCcc) {
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

// --- Documents: index-backed (registry, structure, existence, sync) -------
//
// docs/corpus-schema.md §Documents: encyclicals, conciliar constitutions/
// decrees/declarations, CDF declarations, .... Unlike the CCC and Compendium
// — one canonical work per language, so their accessors above are keyed by
// bare LANGUAGE — a "document" work type is really N independent works, one
// per {family, slug} pair, each with its own EN/PT editions (work ids
// `{family}.{slug}.{lang}`, e.g. `vatii.lumen-gentium.en`). There is no
// single "the document structure for English" the way there's a single CCC
// tree for English, so every document accessor below is keyed by WORK ID,
// and `DocumentGroup` — the one new grouping concept this needs — is what
// gives a language-independent handle (`slug`) to address a document's
// editions together, the same job `listEditions('bible')` does for Bible
// work ids, just scoped to one document instead of the whole work type.

export interface DocumentGroup {
	/** Language-independent id, e.g. "lumen-gentium" — the segment between
	 *  `family` and `lang` in every edition's work id, and what edition-free
	 *  `/documents/{slug}` URLs address (docs/decisions.md #2's URL
	 *  convention, extended to documents). */
	slug: string;
	/** Publishing family (`vatii`, `encyclical`, future `apost-exhort`/
	 *  `apost-const`/`cdf`, docs/corpus-schema.md §Documents) — carried for
	 *  grouping/future per-family styling, not otherwise interpreted here. */
	family: string;
	/** This document's manifest per bare language it's available in. */
	manifests: Partial<Record<string, DocumentManifest>>;
}

const DOCUMENT_WORK_ID_RE = /^([a-z0-9-]+)\.([a-z0-9-]+)\.([a-z]{2,3})$/;

function parseDocumentWorkId(workId: string): { family: string; slug: string; lang: string } | undefined {
	const m = DOCUMENT_WORK_ID_RE.exec(workId);
	return m ? { family: m[1], slug: m[2], lang: m[3] } : undefined;
}

/** Computed once at module load, same reasoning as `canonicalBooksByOsis`
 *  above: re-grouping ~450 document works (16 Vatican II + ~430 encyclicals
 *  and counting) on every `listDocuments()`/`getDocumentGroup()` call would
 *  be wasted work for something that never changes at runtime. */
const documentGroupsBySlug: Map<string, DocumentGroup> = (() => {
	const out = new Map<string, DocumentGroup>();
	// Sorted for determinism, same reasoning as `canonicalBooksByOsis`.
	const works = [...listWorksOfType('document')].sort((a, b) => a.id.localeCompare(b.id));
	for (const work of works) {
		const parsed = parseDocumentWorkId(work.id);
		if (!parsed) continue; // malformed work id -- skip rather than guess at its grouping
		let group = out.get(parsed.slug);
		if (!group) {
			group = { slug: parsed.slug, family: parsed.family, manifests: {} };
			out.set(parsed.slug, group);
		}
		group.manifests[parsed.lang] = work as DocumentManifest;
	}
	return out;
})();

/** All documents in this corpus, one entry per {family, slug} regardless of
 *  how many languages it has — the granularity the `/documents` library and
 *  the home page's Magisterium group both want (docs/corpus-schema.md
 *  §Documents). */
export function listDocuments(): DocumentGroup[] {
	return [...documentGroupsBySlug.values()];
}

export function getDocumentGroup(slug: string): DocumentGroup | undefined {
	return documentGroupsBySlug.get(slug);
}

/**
 * Preferred work id for a document slug at a UI language — same "content
 * language follows UI language by default" rule as `defaultWorkId`
 * (docs/decisions.md #1), scoped to one document's own editions rather than
 * a whole work type's edition list (see `DocumentGroup`'s docblock on why
 * documents need their own version of this instead of reusing
 * `defaultWorkId('document', lang)`, which would only tell you *a* document
 * exists in that language, not which one).
 */
export function defaultDocumentWorkId(slug: string, lang: string): string | undefined {
	const group = getDocumentGroup(slug);
	if (!group) return undefined;
	const target = baseLang(lang);
	return (group.manifests[target] ?? Object.values(group.manifests)[0])?.id;
}

export function getDocumentManifest(workId: string): DocumentManifest | undefined {
	const manifest = manifests[workId];
	return manifest?.type === 'document' ? manifest : undefined;
}

// --- Documents: structure trees (index-backed, sync) ------------------------
//
// Reuses `breadcrumbIn`/`flattenTree` — the same walkers the CCC/Compendium
// section above shares — rather than a third copy, per this module's own
// "Structure trees (shared: CCC and Compendium)" docblock; a document's
// `structure.json` is the identical `StructureNode` shape (docs/corpus-
// schema.md §Documents: "reuse the Catechism/Compendium node schema
// verbatim"), just addressing SECTION numbers via `.paragraphs` instead of
// CCC paragraphs or Compendium questions.

export function getDocumentStructure(workId: string): StructureNode[] {
	return documentStructures[workId] ?? [];
}

export function getDocumentBreadcrumb(workId: string, n: number): StructureNode[] {
	return breadcrumbIn(getDocumentStructure(workId), n);
}

export function flattenDocumentStructure(workId: string): { node: StructureNode; depth: number }[] {
	return flattenTree(getDocumentStructure(workId));
}

const documentSectionNumberSets: Record<string, Set<number>> = Object.fromEntries(
	Object.entries(documentSectionNumbers).map(([workId, ns]) => [workId, new Set(ns)])
);

/** Whether section `n` exists in this corpus for `workId` — index-backed
 *  (no fetch), same role as `cccParagraphExists`. */
export function documentSectionExists(workId: string, n: number): boolean {
	return documentSectionNumberSets[workId]?.has(n) ?? false;
}

/** The section number immediately before/after `n` that actually exists,
 *  or undefined at either end. Index-backed — see `documentSectionExists`. */
export function getAdjacentDocumentSectionNumber(
	workId: string,
	n: number,
	direction: 'prev' | 'next'
): number | undefined {
	const ns = documentSectionNumbers[workId] ?? [];
	if (direction === 'next') return ns.find((x) => x > n);
	return [...ns].reverse().find((x) => x < n);
}

// --- Documents: content tier (async, read/fetched, memoized, whole) --------
//
// Kept whole per work, like the Compendium (~200 KB raw worst-case — see
// `scripts/sync-corpus.mjs`'s docblock) rather than chunked like the CCC.
//
// No fixture branch: documents have no hand-authored fixtures yet (unlike
// the Bible/CCC/Compendium, which all ship a `src/lib/fixtures/` copy) —
// `documentStructures`/`documentSectionNumbers` are already `{}` under
// vitest/no-corpus (see `corpus-index.ts`), so `documentSectionExists`
// always answers false there and this never gets called under a fixture
// run. Returning `[]` rather than throwing keeps that graceful if a test
// ever does call it directly.

async function fetchDocumentSections(workId: string): Promise<DocumentSection[]> {
	if (!USE_REAL_CORPUS) return [];
	const location = documentSectionsLocation(workId);
	if (!location) return [];
	return readContent<DocumentSection[]>(location);
}

export async function getDocumentSectionAsync(workId: string, n: number): Promise<DocumentSection | undefined> {
	if (!documentSectionExists(workId, n)) return undefined;
	const sections = await fetchDocumentSections(workId);
	return sections.find((s) => s.n === n);
}
