import { describe, expect, it } from 'vitest';
import {
	placeCommentary,
	placePrayerCommentary,
	type CommentaryEntry
} from './commentary-placement';
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

// The English Ave, one line per element — `prayer.common.en`'s own setting.
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

describe('placePrayerCommentary', () => {
	it('files each quoted run under the line that carries it', () => {
		const { byLine } = placePrayerCommentary(AVE, [
			entry('commentary.preces.en', [note('a', 'Hail, Mary'), note('b', 'Holy Mary')])
		]);
		expect(byLine.map((marks) => marks.length)).toEqual([1, 0, 0, 0, 1, 0, 0, 0]);
	});

	// ONE NOTE, TWO RUNS, ONE DAGGER. The Catechism's `Full of grace, the Lord
	// is with thee` crosses the Ave's first line break: both lines light the
	// words they print, and only the second takes the mark — otherwise one note
	// raises two marks opening the same card.
	it('lights every line a quotation covers and marks only the last', () => {
		const { byLine, placed } = placePrayerCommentary(AVE, [
			entry('commentary.preces.en', [note('a', 'Full of grace, the Lord is with thee')])
		]);
		expect(byLine[0].map((m) => m.showMark)).toEqual([false]);
		expect(byLine[1].map((m) => m.showMark)).toEqual([true]);
		expect(byLine[0][0].at).toBe(byLine[1][0].at);
		expect(placed).toHaveLength(1);
	});

	// The same leak `placeCommentary`'s own test pins, one unit space over: a
	// mark must carry its OWN anchor's notes and not the work's whole apparatus
	// on the prayer. A superset renders perfectly well, which is why it went
	// unnoticed for a day the first time.
	it('partitions every note across the marks, none twice and none nowhere', () => {
		const notes = [note('a', 'Hail, Mary'), note('b'), note('c', 'Amen'), note('d', 'Elohim')];
		const { placed } = placePrayerCommentary(AVE, [entry('commentary.preces.en', notes)]);
		const seen = placed.flatMap((p) => p.notes);
		expect(seen).toHaveLength(notes.length);
		expect(new Set(seen).size).toBe(notes.length);
	});

	// `placed` is flat across works and its index is the mark's identity, so a
	// run filed under a line must point back at the right placement — the one
	// thing a per-line array could get wrong that a flat one cannot.
	it('keeps `at` pointing at the placement it belongs to', () => {
		const { placed, byLine } = placePrayerCommentary(AVE, [
			entry('commentary.preces.en', [note('a', 'Hail, Mary')]),
			entry('commentary.other.en', [note('b', 'Amen')])
		]);
		for (const mark of byLine.flat()) {
			expect(placed[mark.at].notes).toBe(mark.anchor.notes);
		}
	});

	// NOTHING IS RENDERED AT THE FOOT OF A PRAYER, so `unplaced` is the one
	// thing that could go wrong in silence: the pipeline stores only notes that
	// quote a clause, and a note that lost its place here would simply not
	// appear. Both directions are pinned — empty where every headword landed,
	// and populated (not swallowed) where one did not.
	it('places every headword the prayer carries, and reports the ones it does not', () => {
		const landed = placePrayerCommentary(AVE, [
			entry('commentary.preces.en', [note('a', 'Hail, Mary'), note('b', 'Amen')])
		]);
		expect(landed.unplaced).toEqual([]);

		const missed = placePrayerCommentary(AVE, [
			entry('commentary.preces.en', [note('a', 'Elohim')])
		]);
		expect(missed.unplaced.flatMap((p) => p.notes)).toHaveLength(1);
		expect(missed.byLine.flat()).toEqual([]);
	});
});
