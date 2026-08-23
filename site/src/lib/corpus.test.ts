import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { documentChunkStartFor } from './corpus-index';
import {
	documentSectionText,
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
	it('returns the stored text when the section still carries one', () => {
		const section = {
			n: 1,
			blocks: [{ html: 'ignored' }],
			text: 'the stored value',
			citations: []
		};
		expect(documentSectionText(section)).toBe('the stored value');
	});

	it('derives from html when the shipped section has no text', () => {
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
