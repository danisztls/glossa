import { describe, expect, it } from 'vitest';
import { anchorCommentary } from './commentary-anchors';
import type { CommentaryNote } from './types';

const note = (text: string, lemma?: string): CommentaryNote =>
	({ text, ...(lemma === undefined ? {} : { lemma }) }) as CommentaryNote;

/*
 * Haydock's own verses, because what this decides is whether one editor's
 * headwords name runs of one translation — and the ways that fails are the
 * ways he happened to print, not ways one could invent.
 */
describe('anchorCommentary', () => {
	const spans = (text: string, notes: CommentaryNote[]) =>
		anchorCommentary(text, notes).anchors.map((a) => text.slice(a.from, a.to));

	it('places a headword at the words it quotes, folding case and punctuation', () => {
		const text = 'In the beginning God created heaven, and earth.';
		expect(spans(text, [note('…', 'Beginning.')])).toEqual(['beginning']);
	});

	// Genesis 1:1 carries both: `Beginning.` names words in the verse, `Elohim,`
	// is the Hebrew Haydock is discussing and appears nowhere in the Douay.
	it('sends a headword the verse does not carry to the trailing mark', () => {
		const text = 'In the beginning God created heaven, and earth.';
		const { anchors, trailing } = anchorCommentary(text, [
			note('…', 'Beginning.'),
			note('…', 'Elohim,'),
			note('…')
		]);
		expect(anchors).toHaveLength(1);
		expect(trailing).toHaveLength(2);
	});

	// THE PROPERTY EVERYTHING ELSE RESTS ON: every note is behind exactly one
	// mark. 40% of the commentary has no headword at all, so a partition that
	// leaked would lose a fifth of the apparatus without anything erroring.
	//
	// Unordered on purpose. The two sets are drawn from one sequence but are not
	// a slice of it — a note with no headword between two that have one goes to
	// the trailing mark while they stay in place — so what has to hold is that
	// each note is in exactly one set, not that the concatenation is the input.
	it('partitions the notes, losing none and repeating none', () => {
		const notes = [note('a', 'Beginning.'), note('b', 'Elohim,'), note('c'), note('d', 'God')];
		const { anchors, trailing } = anchorCommentary('In the beginning God created heaven.', notes);
		const placed = [...anchors.flatMap((a) => a.notes), ...trailing];
		expect(placed).toHaveLength(notes.length);
		expect(new Set(placed)).toEqual(new Set(notes));
	});

	// The disambiguator, and the reason this works rather than mostly working:
	// 1,939 of Haydock's headwords occur more than once in their verse, and a
	// catena is printed in reading order. Without the cursor both notes here
	// would land on the first `the Lord`.
	it('walks a repeated phrase in the order the source prints its notes', () => {
		const text = 'And the Lord said to Moses: go to the Lord and speak.';
		const { anchors } = anchorCommentary(text, [note('a', 'the Lord'), note('b', 'the Lord')]);
		expect(anchors.map((a) => a.from)).toEqual([4, 34]);
		expect(anchors.map((a) => text.slice(a.from, a.to))).toEqual(['the Lord', 'the Lord']);
	});

	// 237 notes name words that appear only BEFORE the previous note's. The
	// cursor cannot go back without unpicking what it already placed, so they
	// are refused rather than guessed at.
	it('refuses a headword that appears only before the note above it', () => {
		const text = 'And God saw the light, that it was good.';
		const { anchors, trailing } = anchorCommentary(text, [note('a', 'good'), note('b', 'light')]);
		expect(anchors.map((a) => text.slice(a.from, a.to))).toEqual(['good']);
		expect(trailing.map((n) => n.text)).toEqual(['b']);
	});

	// The anchors feed a text cut, so an overlap would render a word twice.
	it('never overlaps, so the text can be cut at them', () => {
		const text = 'the man of the man of the man';
		const { anchors } = anchorCommentary(text, [
			note('a', 'the man'),
			note('b', 'the man'),
			note('c', 'the man')
		]);
		let prev = 0;
		for (const a of anchors) {
			expect(a.from).toBeGreaterThanOrEqual(prev);
			prev = a.to;
		}
	});

	it('refuses a headword that is only the end of a longer word', () => {
		const { anchors, trailing } = anchorCommentary('their uncleannesses', [
			note('a', 'Uncleanness')
		]);
		expect(anchors).toHaveLength(0);
		expect(trailing).toHaveLength(1);
	});

	// With the dots dropped from the comparison, `E... diede` would otherwise
	// match across whatever words fell between — a catchword silently marking a
	// span it does not name.
	it('refuses an elided catchword rather than matching across the gap', () => {
		const { anchors } = anchorCommentary('E al firmamento diede Dio il nome di cielo', [
			note('a', 'E... diede... il nome di cielo.')
		]);
		expect(anchors).toHaveLength(0);
	});

	it('has nothing to place for a note with no headword', () => {
		const { anchors, trailing } = anchorCommentary('In the beginning', [
			note('a'),
			note('b', '  ')
		]);
		expect(anchors).toHaveLength(0);
		expect(trailing).toHaveLength(2);
	});
});
