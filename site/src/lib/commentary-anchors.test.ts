import { describe, expect, it } from 'vitest';
import { anchorCommentary, anchorCommentaryLines } from './commentary-anchors';
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

/*
 * The English Ave as `prayer.common.en` prints it, one line per element,
 * against the clauses CCC 2676-2677 quotes at the head of each of its runs.
 * Real text on both sides for `anchorCommentary`'s reason: what this decides
 * is whether one book's headwords name runs of another's wording, and the ways
 * that fails are the ways the Catechism happened to print.
 */
describe('anchorCommentaryLines', () => {
	const AVE = [
		'Hail, Mary, full of grace,',
		'the Lord is with thee.',
		'Blessed art thou among women',
		'and blessed is the fruit of thy womb, Jesus.',
		'Holy Mary, Mother of God,',
		'pray for us sinners,',
		'now and at the hour of our death.',
		'Amen.'
	];

	/** Each anchor as the words it covers, line by line. */
	const placed = (lines: string[], notes: CommentaryNote[]) =>
		anchorCommentaryLines(lines, notes).anchors.map((a) =>
			a.spans.map((s) => `${s.line}:${lines[s.line].slice(s.from, s.to)}`)
		);

	it('finds each headword in the line that prints it', () => {
		expect(placed(AVE, [note('…', 'Hail, Mary'), note('…', 'Holy Mary, Mother of God')])).toEqual([
			['0:Hail, Mary'],
			['4:Holy Mary, Mother of God']
		]);
	});

	// THE CASE THAT DECIDED THE SHAPE. CCC 2676's second gloss is headed `Full
	// of grace, the Lord is with thee` and the English Ave ends a line after
	// `full of grace,` — the clause is one clause and the break is the
	// edition's setting. Confined to a line this anchored nothing; across it,
	// each line carries the part of the quotation it prints.
	it('carries a headword across a line break, one span per line', () => {
		expect(placed(AVE, [note('…', 'Full of grace, the Lord is with thee')])).toEqual([
			['0:full of grace,', '1:the Lord is with thee']
		]);
	});

	it('sends a headword the prayer does not print to the trailing mark', () => {
		const { anchors, trailing } = anchorCommentaryLines(AVE, [
			note('…', 'Blessed is he who comes'),
			note('…')
		]);
		expect(anchors).toEqual([]);
		expect(trailing).toHaveLength(2);
	});

	// THE CURSOR WALKS THE UNIT, NOT THE LINE. `Mary` occurs in three of the
	// Ave's lines, so two notes quoting it must take the first and the second —
	// which is only true if the cursor survives the line boundary.
	it('advances the cursor across lines, so a repeated clause is not reused', () => {
		expect(placed(AVE, [note('a', 'Mary'), note('b', 'Mary')])).toEqual([['0:Mary'], ['4:Mary']]);
	});

	// The same property `anchorCommentary` is held to, across lines: every note
	// is behind exactly one mark, so nothing renders twice and nothing is lost.
	it('partitions the notes between the anchors and the trailing mark', () => {
		const notes = [
			note('a', 'Hail, Mary'),
			note('b'),
			note('c', 'Full of grace, the Lord is with thee'),
			note('d', 'Amen')
		];
		const { anchors, trailing } = anchorCommentaryLines(AVE, notes);
		const seen = [...anchors.flatMap((a) => a.notes), ...trailing];
		expect(seen).toHaveLength(notes.length);
		expect(new Set(seen).size).toBe(notes.length);
	});

	// A span is clipped to its own line and never covers the separator, so
	// slicing each line by its span reassembles the quotation and nothing else.
	it('clips every span to its own line', () => {
		const [spans] = anchorCommentaryLines(AVE, [
			note('…', 'Full of grace, the Lord is with thee')
		]).anchors;
		for (const span of spans.spans) {
			expect(span.from).toBeGreaterThanOrEqual(0);
			expect(span.to).toBeLessThanOrEqual(AVE[span.line].length);
			expect(span.from).toBeLessThan(span.to);
		}
	});

	// `æ` is a letter rather than a base plus a mark, so no normal form takes
	// it apart: the curated Latin Ave ends `nostræ` and the Catechism prints
	// `nostrae`. Without the expansion the lemma matched as far as `nostr` and
	// the guard against a headword ending inside a word then refused it
	// outright — a whole clause lost to one glyph.
	it('folds æ and œ, which normalization does not', () => {
		const lines = ['nunc et in hora mortis nostræ.'];
		expect(placed(lines, [note('…', 'in hora mortis nostrae')])).toEqual([
			['0:in hora mortis nostræ']
		]);
	});
});
