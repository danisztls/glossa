/**
 * Corpus access layer.
 *
 * This is the ONLY module that knows where corpus data physically comes
 * from. It reads the real corpus (see `docs/corpus-schema.md`) when one has
 * been synced into `src/lib/corpus-data/` by `npm run sync-corpus`
 * (`scripts/sync-corpus.mjs`, wired as a `prebuild`/`predev` hook — see
 * README.md "Corpus data"), and falls back to the schema-conformant
 * fixtures under `src/lib/fixtures/` otherwise. `npm test` never runs the
 * sync step, so vitest always exercises the fixtures, deterministically.
 *
 * Real data is read with `import.meta.glob(..., { eager: true })` rather
 * than `fetch()`: adapter-static prerenders every route at build time (no
 * server runtime, see docs/decisions.md), and `import.meta.glob` lets Vite
 * inline the JSON into the prerendered output at build time with no extra
 * network round-trip and no risk of the fetched data going stale relative
 * to the page that embeds it.
 *
 * Every exported function below is async-compatible in signature-shape
 * already (they return plain values, not promises, but callers already go
 * through `load()` functions in routes) — so switching to `await fetch(...)`
 * later, if ever needed, is a single-module change; no route or component
 * should need to change. Keep the exported function names and return shapes
 * stable; that's the contract the rest of the app is written against.
 */

import type {
	BibleBook,
	BibleManifest,
	CccAbbreviation,
	CccNode,
	CccParagraph,
	WorkManifest
} from './types';

import bibleCpdvEnManifest from './fixtures/bible.cpdv.en/manifest.json';
import genJson from './fixtures/bible.cpdv.en/books/gen.json';
import johnJson from './fixtures/bible.cpdv.en/books/john.json';

import cccEnManifest from './fixtures/ccc.en/manifest.json';
import cccEnStructure from './fixtures/ccc.en/structure.json';
import cccEnParagraphs from './fixtures/ccc.en/paragraphs.json';
import cccEnAbbreviations from './fixtures/ccc.en/abbreviations.json';

// --- Real corpus, if `npm run sync-corpus` has populated corpus-data/ -----
//
// Glob paths are relative to this file and must be literal for Vite's
// static analysis, so they can't be built from the CORPUS_DIR env var here
// — that's why sync-corpus.mjs materializes real data at this fixed path
// instead of corpus.ts reading `../../corpus` directly.

const realManifestModules = import.meta.glob('./corpus-data/works/*/manifest.json', {
	eager: true,
	import: 'default'
}) as Record<string, WorkManifest>;

const realBibleBookModules = import.meta.glob('./corpus-data/works/bible.*/books/*.json', {
	eager: true,
	import: 'default'
}) as Record<string, BibleBook>;

const realCccStructureModules = import.meta.glob('./corpus-data/works/ccc.*/structure.json', {
	eager: true,
	import: 'default'
}) as Record<string, CccNode[]>;

const realCccParagraphsModules = import.meta.glob('./corpus-data/works/ccc.*/paragraphs.json', {
	eager: true,
	import: 'default'
}) as Record<string, CccParagraph[]>;

const realCccAbbreviationModules = import.meta.glob('./corpus-data/works/ccc.*/abbreviations.json', {
	eager: true,
	import: 'default'
}) as Record<string, CccAbbreviation[]>;

/** True once corpus-data/ has been synced from a real corpus checkout. */
const USE_REAL_CORPUS = Object.keys(realManifestModules).length > 0;

function workIdFromManifestPath(path: string): string | null {
	return path.match(/works\/([^/]+)\/manifest\.json$/)?.[1] ?? null;
}

function cccLangFromPath(path: string): string | null {
	return path.match(/works\/ccc\.([^/]+)\//)?.[1] ?? null;
}

// --- Registry (real corpus when present, fixtures otherwise) -------------

const manifests: Record<string, WorkManifest> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(realManifestModules)
				.map(([path, manifest]) => [workIdFromManifestPath(path), manifest] as const)
				.filter((entry): entry is [string, WorkManifest] => entry[0] !== null)
				.sort(([a], [b]) => a.localeCompare(b))
		)
	: {
			'bible.cpdv.en': bibleCpdvEnManifest as BibleManifest,
			'ccc.en': cccEnManifest as WorkManifest
		};

const bibleBooks: Record<string, Record<string, BibleBook>> = USE_REAL_CORPUS
	? (() => {
			const out: Record<string, Record<string, BibleBook>> = {};
			for (const [path, book] of Object.entries(realBibleBookModules)) {
				const match = path.match(/works\/([^/]+)\/books\/([^/]+)\.json$/);
				if (!match) continue;
				const [, workId, osis] = match;
				(out[workId] ??= {})[osis] = book;
			}
			return out;
		})()
	: {
			'bible.cpdv.en': {
				gen: genJson as BibleBook,
				john: johnJson as BibleBook
			}
		};

const cccStructures: Record<string, CccNode[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(realCccStructureModules)
				.map(([path, structure]) => [cccLangFromPath(path), structure] as const)
				.filter((entry): entry is [string, CccNode[]] => entry[0] !== null)
		)
	: { en: cccEnStructure as unknown as CccNode[] };

const cccParagraphsByLang: Record<string, CccParagraph[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(realCccParagraphsModules)
				.map(([path, paragraphs]) => [cccLangFromPath(path), paragraphs] as const)
				.filter((entry): entry is [string, CccParagraph[]] => entry[0] !== null)
		)
	: { en: cccEnParagraphs as CccParagraph[] };

const cccAbbreviationsByLang: Record<string, CccAbbreviation[]> = USE_REAL_CORPUS
	? Object.fromEntries(
			Object.entries(realCccAbbreviationModules)
				.map(([path, abbrevs]) => [cccLangFromPath(path), abbrevs] as const)
				.filter((entry): entry is [string, CccAbbreviation[]] => entry[0] !== null)
		)
	: { en: cccEnAbbreviations as CccAbbreviation[] };

// --- Works -------------------------------------------------------------

/** All work manifests available in this corpus, in registry order. */
export function listWorks(): WorkManifest[] {
	return Object.values(manifests);
}

export function getWork(workId: string): WorkManifest | undefined {
	return manifests[workId];
}

/** Convenience: just the Bible works. */
export function listBibleWorks(): BibleManifest[] {
	return listWorks().filter((w): w is BibleManifest => w.type === 'bible');
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

// --- Bible ---------------------------------------------------------------

export function getBook(workId: string, osis: string): BibleBook | undefined {
	return bibleBooks[workId]?.[osis];
}

/** All books physically present for a work, in canonical (`order`) order. */
export function listBooks(workId: string): BibleBook[] {
	return Object.values(bibleBooks[workId] ?? {}).sort((a, b) => a.order - b.order);
}

export function getChapter(
	workId: string,
	osis: string,
	chapterN: number
): { book: BibleBook; chapter: BibleBook['chapters'][number] } | undefined {
	const book = getBook(workId, osis);
	const chapter = book?.chapters.find((c) => c.n === chapterN);
	if (!book || !chapter) return undefined;
	return { book, chapter };
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
export function findBookByAbbrev(workId: string, abbrev: string): BibleBook | undefined {
	const needle = abbrev.trim().toLowerCase();
	return listBooks(workId).find(
		(b) => b.osis === needle || b.abbrevs.some((a) => a.toLowerCase() === needle)
	);
}

// --- Catechism -------------------------------------------------------------

export function getCccStructure(lang: string): CccNode[] {
	return cccStructures[lang] ?? [];
}

export function listCccParagraphs(lang: string): CccParagraph[] {
	return cccParagraphsByLang[lang] ?? [];
}

export function getCccParagraph(lang: string, n: number): CccParagraph | undefined {
	return listCccParagraphs(lang).find((p) => p.n === n);
}

/** The CCC's own abbreviations table (document sigla, scripture book abbrevs). Not surfaced in the UI yet. */
export function listCccAbbreviations(lang: string): CccAbbreviation[] {
	return cccAbbreviationsByLang[lang] ?? [];
}

/** Paragraphs in the fixture whose `n` is nearest to (but not equal to) the given one. */
export function getAdjacentCccParagraph(
	lang: string,
	n: number,
	direction: 'prev' | 'next'
): CccParagraph | undefined {
	const ns = listCccParagraphs(lang)
		.map((p) => p.n)
		.sort((a, b) => a - b);
	if (direction === 'next') {
		const next = ns.find((x) => x > n);
		return next !== undefined ? getCccParagraph(lang, next) : undefined;
	}
	const prev = [...ns].reverse().find((x) => x < n);
	return prev !== undefined ? getCccParagraph(lang, prev) : undefined;
}

/** Walk the structure tree and return the path of nodes from root to the
 * deepest node whose range contains paragraph `n` (a breadcrumb trail). */
export function getCccBreadcrumb(lang: string, n: number): CccNode[] {
	const path: CccNode[] = [];

	function walk(nodes: CccNode[]): boolean {
		for (const node of nodes) {
			const [first, last] = node.paragraphs;
			// The schema (docs/corpus-schema.md) requires `paragraphs` to be a
			// `[number, number]` tuple, but some real-corpus structure nodes
			// carry a `null` first bound (unnumbered content, e.g. the Creed
			// printed in full) — a documented mismatch (see site/README.md /
			// final report). Treat such nodes as never containing anything
			// rather than letting `n < null` (== `n < 0`) falsely match.
			if (typeof first !== 'number' || typeof last !== 'number') continue;
			if (n < first || n > last) continue;
			path.push(node);
			if (!walk(node.children)) {
				// no child covers it more precisely; this node is the leaf
			}
			return true;
		}
		return false;
	}

	walk(getCccStructure(lang));
	return path;
}

/** Flatten the structure tree into a depth-first list, for building a TOC. */
export function flattenCccStructure(lang: string): { node: CccNode; depth: number }[] {
	const out: { node: CccNode; depth: number }[] = [];
	function walk(nodes: CccNode[], depth: number) {
		for (const node of nodes) {
			out.push({ node, depth });
			walk(node.children, depth + 1);
		}
	}
	walk(getCccStructure(lang), 0);
	return out;
}
