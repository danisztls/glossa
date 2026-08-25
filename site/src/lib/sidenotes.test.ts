import { describe, expect, it } from 'vitest';
import { chapterNoteOffsets, noteKey, noteLetter } from './sidenotes.svelte';

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
	// is for — the same rule `ProseBlocks` follows for a paragraph that
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

describe('noteLetter', () => {
	it('letters a chapter from a', () => {
		expect([0, 1, 2, 25].map(noteLetter)).toEqual(['a', 'b', 'c', 'z']);
	});

	// Daniel 11 has 27 notes, which is the whole reason this is bijective
	// base-26 rather than a modulo that would print a second "a".
	it('does not repeat itself past z', () => {
		expect(noteLetter(26)).toBe('aa');
		expect(noteLetter(27)).toBe('ab');
		expect(new Set([0, 26].map(noteLetter)).size).toBe(2);
	});

	it('says so rather than guessing when the index is nonsense', () => {
		expect(noteLetter(-1)).toBe('?');
	});
});

describe('chapterNoteOffsets', () => {
	const note = (marker: string) => ({ marker, text: 'x' });

	it('letters headings and verses in the order they are read, not the order they are stored', () => {
		// The corpus keeps headings in their own array; the reader meets each
		// one before its verse. John 3's shape, with a heading bolted on.
		const offsets = chapterNoteOffsets({
			verses: [{ n: 1, notes: [note('1')] }, { n: 2 }, { n: 3, notes: [note('1'), note('2')] }],
			headings: [{ before_verse: 3, notes: [note('1')] }]
		});
		expect(offsets.get('v1')).toBe(0);
		expect(offsets.get('v2')).toBe(1);
		// The heading before verse 3 takes the letter BEFORE verse 3's notes.
		expect(offsets.get('h3.0')).toBe(1);
		expect(offsets.get('v3')).toBe(2);
		expect([1, 2, 3].map(noteLetter)).toEqual(['b', 'c', 'd']);
	});

	it('keeps sibling headings on one verse apart', () => {
		// Genesis 1:1 in the Matos Soares edition: a part title, a section and
		// a line, all before verse 1.
		const offsets = chapterNoteOffsets({
			verses: [{ n: 1, notes: [note('1')] }],
			headings: [
				{ before_verse: 1, notes: [note('1')] },
				{ before_verse: 1 },
				{ before_verse: 1, notes: [note('1')] }
			]
		});
		expect(offsets.get('h1.0')).toBe(0);
		expect(offsets.get('h1.1')).toBe(1);
		expect(offsets.get('h1.2')).toBe(1);
		expect(offsets.get('v1')).toBe(2);
	});

	it('is all zeroes for the unannotated editions, which are most of them', () => {
		const offsets = chapterNoteOffsets({ verses: [{ n: 1 }, { n: 2 }] });
		expect([...offsets.values()]).toEqual([0, 0]);
	});
});
