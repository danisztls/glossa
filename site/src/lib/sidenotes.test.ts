import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	chapterNoteOffsets,
	COMMENTARY_MARKER,
	COMMENTARY_MARKER_TRAILING,
	commentaryMarker,
	noteLetter,
	overflowsCard,
	CARD_MAX_CHARS
} from './sidenotes.svelte';

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

describe('overflowsCard', () => {
	// A card is a shape for a paragraph. Challoner's median note is 146
	// characters and his ninety-ninth percentile 728; Haydock's median
	// annotated verse is 245.
	it('cards a paragraph', () => {
		expect(overflowsCard(146)).toBe(false);
		expect(overflowsCard(728)).toBe(false);
	});

	// And not for an essay: Straubinger's longest note is 4,830 characters,
	// Martini's 10,243 and Haydock's fullest verse 14,433.
	it('sends an essay to the dialog', () => {
		expect(overflowsCard(4830)).toBe(true);
		expect(overflowsCard(14433)).toBe(true);
	});

	it('is inclusive at the boundary', () => {
		expect(overflowsCard(CARD_MAX_CHARS)).toBe(false);
		expect(overflowsCard(CARD_MAX_CHARS + 1)).toBe(true);
	});
});

describe('COMMENTARY_MARKER', () => {
	// The whole point of the marks: an edition's own notes letter themselves
	// a, b, c down the chapter and the page is already full of verse numbers,
	// so a commentary's mark must be neither. A letter or a digit here would
	// print a second run beside the first with nothing to say which was which.
	it('is neither a letter nor a digit', () => {
		for (const mark of [COMMENTARY_MARKER, COMMENTARY_MARKER_TRAILING]) {
			expect(mark).not.toMatch(/[a-z0-9]/i);
			expect(mark.length).toBe(1);
		}
	});

	// THE TWO MUST DIFFER, which is the only thing the second mark was added
	// for: `†` says the notes quote words the reader can see lit, `‡` says
	// they name the whole unit. Collapsing them back to one glyph is exactly
	// the state this apparatus was in before 2026-09-06, and it renders
	// perfectly — 9,594 verses carrying both kinds of mark and nothing on the
	// page telling them apart.
	it('draws a different mark for an anchored placement than for a trailing one', () => {
		expect(commentaryMarker(true)).toBe(COMMENTARY_MARKER);
		expect(commentaryMarker(false)).toBe(COMMENTARY_MARKER_TRAILING);
		expect(COMMENTARY_MARKER).not.toBe(COMMENTARY_MARKER_TRAILING);
	});

	// Neither mark is in either text family's `latin` subset: Google files
	// U+2020 under `latin-ext` — 158 KB a page carrying one dagger would
	// otherwise download for nothing else — and does not carry U+2021 in any
	// of its 14 files at all, which is why the face is subset from Adobe's own
	// release. `fonts.css` declares a 1.2 KB face over exactly this range, so
	// the marks and the file have to agree: change one without the other and a
	// mark renders in whatever system face the reader happens to have, which
	// no test could see and no build would fail.
	it('is the codepoints the subset face carries', () => {
		expect(COMMENTARY_MARKER.codePointAt(0)).toBe(0x2020);
		expect(COMMENTARY_MARKER_TRAILING.codePointAt(0)).toBe(0x2021);
		const fonts = readFileSync(new URL('../styles/fonts.css', import.meta.url), 'utf8');
		const face = fonts.slice(fonts.indexOf("font-family: 'Source Sans 3 Marks'"));
		expect(face.slice(0, face.indexOf('}'))).toContain('unicode-range: U+2020-2021;');
	});
});
