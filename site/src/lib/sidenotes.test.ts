import { describe, expect, it } from 'vitest';
import { noteKey } from './sidenotes.svelte';

describe('noteKey', () => {
	// THE BUG THIS EXISTS TO PREVENT, stated as a test because it is not
	// visible from the data: a marker is unique within its VERSE and not
	// within its chapter (docs/corpus-schema.md), so John 3 carries four notes
	// and every one of them is numbered 1. Keyed on the marker alone, opening
	// the note at verse 5 would also open the ones at 16, 18 and 20 — and show
	// the reader Nicodemus's gloss against a verse thirteen verses later.
	it('keeps one marker apart across the verses that repeat it', () => {
		expect(noteKey(5, '1', 0)).not.toBe(noteKey(18, '1', 0));
	});

	// Two occurrences of one marker INSIDE a single unit, which is what `seq`
	// is for — the same rule `CccParagraphText` follows for a paragraph that
	// cites one footnote twice.
	it('keeps two occurrences in one unit apart', () => {
		expect(noteKey(5, '1', 0)).not.toBe(noteKey(5, '1', 1));
	});

	// A heading's notes and those of the verse it precedes share a chapter and
	// both restart at 1; the Bible route keys headings `h{n}` for exactly this.
	it('keeps a heading apart from the verse it introduces', () => {
		expect(noteKey('h1', '1', 0)).not.toBe(noteKey(1, '1', 0));
	});
});
