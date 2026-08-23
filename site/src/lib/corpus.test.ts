import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { documentChunkStartFor } from './corpus-index';
import {
	documentSectionText,
	getAdjacentChapterAcrossBooks,
	getBook,
	getBookIntro,
	getCanonicalBook,
	hasBookIntro,
	hasIntroForWork,
	getCompendiumChapterFor,
	getCompendiumQuestionRangeAsync,
	listCompendiumChapters
} from './corpus';

describe('Compendium whole-reading units', () => {
	it('uses the innermost chapter, while retaining a section fallback before its first chapter', () => {
		expect(getCompendiumChapterFor('en', 2)?.kind).toBe('chapter');
		expect(getCompendiumChapterFor('en', 1)?.kind).toBe('section');
	});

	it('makes all whole-reading starts available to the route manifest', () => {
		expect(listCompendiumChapters('en').map((chapter) => chapter.paragraphs[0])).toEqual([
			1, 1, 2, 6, 25
		]);
	});

	it('reads only the requested question range from the memoized language asset', async () => {
		await expect(getCompendiumQuestionRangeAsync('en', 2, 4)).resolves.toMatchObject([
			{ n: 2 },
			{ n: 3 },
			{ n: 4 }
		]);
	});
});

describe('document chunking', () => {
	/**
	 * `DOCUMENT_CHUNK_SIZE` is written twice — in `scripts/sync-corpus.mjs`,
	 * which decides where the chunk boundaries fall, and in `corpus-index.ts`,
	 * which decides where to look for them. They cannot import each other (one
	 * is a build script, the other ships to the browser), and a mismatch fails
	 * SILENTLY: `documentChunkLocation` would compute a start no file was
	 * written for, return `undefined`, and the link preview would render
	 * nothing at all rather than erroring. This is the guard for that.
	 */
	it('uses the same chunk stride as the sync script that writes the chunks', () => {
		const source = readFileSync(new URL('../../scripts/sync-corpus.mjs', import.meta.url), 'utf8');
		const declared = source.match(/^const DOCUMENT_CHUNK_SIZE = (\d+);$/m);
		expect(declared, 'sync-corpus.mjs must declare DOCUMENT_CHUNK_SIZE').not.toBeNull();
		const stride = Number(declared![1]);

		// `documentChunkStartFor` is the only place the reader's copy is
		// observable, so exercise it rather than re-reading the literal:
		// the first section of a chunk and its last must agree on the start.
		expect(documentChunkStartFor(1)).toBe(1);
		expect(documentChunkStartFor(stride)).toBe(1);
		expect(documentChunkStartFor(stride + 1)).toBe(stride + 1);
		expect(documentChunkStartFor(stride * 2)).toBe(stride + 1);
	});
});

describe('documentSectionText', () => {
	it('derives from html — the corpus stores no `text` to read', () => {
		const section = {
			n: 1,
			blocks: [{ html: 'Constitution <i>Esti minime</i>.' }, { html: 'A second block.' }],
			citations: []
		};
		// Blocks joined by ONE space, and no space introduced at the `</i>`
		// boundary — the corpus's own `text` stores `Esti minime .` there
		// (see `documentSectionText`'s docblock: 17.2% of sections differ from
		// their stored text by exactly this, and by nothing else).
		expect(documentSectionText(section)).toBe('Constitution Esti minime. A second block.');
	});

	it('drops footnote markers without leaving a space behind', () => {
		const section = {
			n: 1,
			blocks: [{ html: 'word<sup data-fn="12"></sup>. Next.' }],
			citations: []
		};
		expect(documentSectionText(section)).toBe('word. Next.');
	});
});

describe('book introductions (chapter 0)', () => {
	// The fixtures give English an introduction for Genesis and none for John,
	// which is what lets both the present and the absent path be asserted here
	// rather than only the happy one.
	it('knows which books a language introduces', () => {
		expect(hasBookIntro('en', 'gen')).toBe(true);
		expect(hasBookIntro('en', 'john')).toBe(false);
		expect(hasBookIntro('pt', 'gen')).toBe(false);
	});

	it('resolves a work id to its language, so an edition inherits its language’s introductions', () => {
		expect(hasIntroForWork('bible.cpdv.en', 'gen')).toBe(true);
		// Same book, same address, a language with nothing written for it yet.
		expect(hasIntroForWork('bible.matos-soares.pt', 'gen')).toBe(false);
		expect(hasIntroForWork('bible.clementina.la', 'gen')).toBe(false);
	});

	it('reads the introduction as blocks, and nothing for a book without one', async () => {
		const intro = await getBookIntro('en', 'gen');
		expect(intro?.osis).toBe('gen');
		expect(intro?.blocks.length).toBe(2);
		expect(intro?.blocks[0].text).toContain('GENERATION');
		await expect(getBookIntro('en', 'john')).resolves.toBeUndefined();
		await expect(getBookIntro('pt', 'gen')).resolves.toBeUndefined();
	});

	it('puts chapter 0 before chapter 1 for the languages that have one', () => {
		// The fixture Genesis carries one chapter; the 0 sorts in front of it.
		expect(getCanonicalBook('gen')?.chapters).toEqual([0, 1]);
		// The canonical list is the union across languages, so John — which no
		// language introduces — never gains a 0 at all. (Its [1, 3] gap is the
		// fixtures' own deliberate not-in-corpus case, left untouched.)
		expect(getCanonicalBook('john')?.chapters).toEqual([1, 3]);
	});

	it('navigates from chapter 1 back into the introduction, but only where there is one', () => {
		expect(getAdjacentChapterAcrossBooks('bible.cpdv.en', 'gen', 1, 'prev')).toEqual({
			osis: 'gen',
			chapter: 0
		});
		expect(getAdjacentChapterAcrossBooks('bible.cpdv.en', 'gen', 0, 'next')).toEqual({
			osis: 'gen',
			chapter: 1
		});
		// A Portuguese reader steps straight past it, because for them it is an
		// absent chapter rather than a page with nothing on it.
		expect(
			getAdjacentChapterAcrossBooks('bible.matos-soares.pt', 'gen', 1, 'prev')
		).toBeUndefined();
	});

	it('keeps chapter 0 out of the citation address space', () => {
		// The whole reason introductions are stored apart from `chapters`: a
		// reference must never resolve to one. `refs.ts` checks existence
		// against the book's chapters, which never carry a 0.
		expect(getBook('bible.cpdv.en', 'gen')?.chapters.some((c) => c.n === 0)).toBe(false);
	});
});
