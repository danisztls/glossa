import { describe, expect, it } from 'vitest';
import { placeCommentary, type CommentaryEntry } from './commentary-placement';
import type { CommentaryNote, WorkManifest } from './types';

const note = (text: string, lemma?: string): CommentaryNote =>
	({ text, ...(lemma === undefined ? {} : { lemma }) }) as CommentaryNote;

const entry = (id: string, notes: CommentaryNote[]): CommentaryEntry => ({
	work: { id } as WorkManifest,
	notes
});

// Genesis 1:1, because the ways a headword fails to name a run of the verse are
// the ways Haydock happened to print rather than ways one could invent.
const TEXT = 'In the beginning God created heaven, and earth.';

describe('placeCommentary', () => {
	it('anchors what the verse carries and sends the rest to the trailing mark', () => {
		const { inline, trailing } = placeCommentary(TEXT, [
			entry('commentary.haydock.en', [note('…', 'Beginning.'), note('…', 'Elohim,'), note('…')])
		]);
		expect(inline.map((p) => TEXT.slice(p.anchor.from, p.anchor.to))).toEqual(['beginning']);
		expect(trailing).toHaveLength(1);
		expect(trailing[0].notes).toHaveLength(2);
	});

	// THE PROPERTY EVERYTHING ELSE RESTS ON, and the one that broke: every note
	// is behind exactly one mark. Spreading the entry rather than the anchor's
	// own notes put the whole verse behind each inline mark — a superset, which
	// renders perfectly well and so erred nowhere.
	it('partitions every note across the marks, none twice and none nowhere', () => {
		const notes = [note('a', 'Beginning.'), note('b'), note('c', 'earth.'), note('d', 'Elohim,')];
		const { placed } = placeCommentary(TEXT, [entry('commentary.haydock.en', notes)]);
		const seen = placed.flatMap((p) => p.notes);
		expect(seen).toHaveLength(notes.length);
		expect(new Set(seen).size).toBe(notes.length);
	});

	// A trailing entry is added only when there is something to put in it —
	// otherwise every verse would carry a mark at its end opening an empty card.
	it('adds no trailing mark when the text carries every headword', () => {
		const { placed, trailing } = placeCommentary(TEXT, [
			entry('commentary.haydock.en', [note('…', 'Beginning.'), note('…', 'earth.')])
		]);
		expect(trailing).toEqual([]);
		expect(placed).toHaveLength(2);
	});

	it('places nothing when no commentary is switched on', () => {
		expect(placeCommentary(TEXT, undefined)).toEqual({ placed: [], inline: [], trailing: [] });
	});

	describe('two commentaries at once', () => {
		const two = [
			entry('commentary.b.en', [note('…', 'earth.')]),
			entry('commentary.a.en', [note('…', 'Beginning.')])
		];

		// `placed` is in WORK order because that is the order the reader chose to
		// stack them in; `inline` is in TEXT order because `buildSegments` walks
		// the string once and cannot go backwards.
		it('keeps work order in `placed` and text order in `inline`', () => {
			const { placed, inline } = placeCommentary(TEXT, two);
			expect(placed.map((p) => p.work.id)).toEqual(['commentary.b.en', 'commentary.a.en']);
			expect(inline.map((p) => p.work.id)).toEqual(['commentary.a.en', 'commentary.b.en']);
		});

		// `at` is the mark's identity everywhere else — `buildSegments`'s `mark`,
		// and the key `openMarks` lights the quoted words by. It must index
		// `placed`, not the text-ordered array it is read off.
		it('numbers each inline mark by its position in `placed`', () => {
			const { placed, inline } = placeCommentary(TEXT, two);
			for (const p of inline) expect(placed[p.at].work.id).toBe(p.work.id);
		});
	});
});
