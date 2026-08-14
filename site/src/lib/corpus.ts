/**
 * Corpus access layer.
 *
 * This is the ONLY module that knows where corpus data physically comes
 * from. Right now that's the schema-conformant fixtures under
 * `src/lib/fixtures/`, imported statically so the whole site prerenders.
 *
 * To point this at the real corpus later (see `docs/corpus-schema.md`):
 *   - Replace the static JSON imports below with `fetch()` calls (or a
 *     build-time step that copies `corpus/works/**` into `static/corpus/`
 *     and fetches from there), keyed the same way: `{workId}/manifest.json`,
 *     `{workId}/books/{osis}.json`, `ccc.{lang}/structure.json`,
 *     `ccc.{lang}/paragraphs.json`.
 *   - Every exported function below is async-compatible in signature-shape
 *     already (they return plain values, not promises, but callers already
 *     go through `load()` functions in routes) — so switching the bodies to
 *     `await fetch(...)` and making these functions `async` is a
 *     single-module change; no route or component should need to change.
 *   - Keep the exported function names and return shapes stable; that's the
 *     contract the rest of the app is written against.
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

// --- Fixture registry ------------------------------------------------

const manifests: Record<string, WorkManifest> = {
	'bible.cpdv.en': bibleCpdvEnManifest as BibleManifest,
	'ccc.en': cccEnManifest as WorkManifest
};

const bibleBooks: Record<string, Record<string, BibleBook>> = {
	'bible.cpdv.en': {
		gen: genJson as BibleBook,
		john: johnJson as BibleBook
	}
};

const cccStructures: Record<string, CccNode[]> = {
	en: cccEnStructure as unknown as CccNode[]
};

const cccParagraphsByLang: Record<string, CccParagraph[]> = {
	en: cccEnParagraphs as CccParagraph[]
};

const cccAbbreviationsByLang: Record<string, CccAbbreviation[]> = {
	en: cccEnAbbreviations as CccAbbreviation[]
};

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

/** All books physically present for a work, in the fixture's own order. */
export function listBooks(workId: string): BibleBook[] {
	return Object.values(bibleBooks[workId] ?? {});
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
