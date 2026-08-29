import { describe, expect, it } from 'vitest';
import {
	chapterNoteOffsets,
	marginOverflows,
	MARGIN_CLAMP_CHARS,
	noteLetter
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

describe('marginOverflows', () => {
	const note = (chars: number, lemma?: string) => ({
		marker: '1',
		lemma,
		text: 'x'.repeat(chars)
	});

	// What the margin was written for: a citation's source is 26 characters and
	// Challoner glosses a verse in a sentence. Clamping a remark would be the
	// change costing something and buying nothing.
	it('sets a remark-length gloss open', () => {
		expect(marginOverflows(note(26))).toBe(false);
		expect(marginOverflows(note(100))).toBe(false);
	});

	// And the one it was not: Straubinger's median note is 248 characters, its
	// ninetieth percentile 814, its longest 4,830.
	it('clamps an essay-length one', () => {
		expect(marginOverflows(note(248))).toBe(true);
		expect(marginOverflows(note(4830))).toBe(true);
	});

	// The lemma is set in the same column, in bold, ahead of the gloss — so a
	// note just under the limit with a long lemma is over it.
	it('counts the lemma, which is set in the same column', () => {
		expect(marginOverflows(note(MARGIN_CLAMP_CHARS))).toBe(false);
		expect(marginOverflows(note(MARGIN_CLAMP_CHARS, 'And the judgment:'))).toBe(true);
	});

	// A token with no note behind it is a corpus bug the component renders a
	// message for; there is nothing to clamp and nothing to disclose.
	it('has nothing to say about a note that is not there', () => {
		expect(marginOverflows(undefined)).toBe(false);
	});
});
