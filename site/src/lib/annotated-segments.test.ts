import { describe, expect, it } from 'vitest';
import { buildSegments, segmentText, type PlacedAnchor } from './annotated-segments';
import { splitMarkers } from './inline-markers';
import { splitLemma, type LemmaSplit } from './lemma';
import { anchorCommentary } from './commentary-anchors';
import type { CommentaryNote } from './types';

const anchorsFor = (text: string, notes: CommentaryNote[]): PlacedAnchor[] =>
	anchorCommentary(text, notes)
		.anchors.map((anchor, at) => ({ anchor, at }))
		.sort((a, b) => a.anchor.from - b.anchor.from);

const note = (lemma?: string) => ({ text: '…', ...(lemma ? { lemma } : {}) }) as CommentaryNote;

describe('buildSegments', () => {
	const text = 'In the beginning God created heaven, and earth.';

	// THE PROPERTY A READER WOULD NOTICE BROKEN FIRST, and the reason this is a
	// module rather than a `$derived` in the component: three separate cuts run
	// through one string, and any of them off by a character silently drops or
	// repeats a word of Scripture.
	it('renders the unit exactly, whatever cuts it', () => {
		const pieces = splitMarkers(text, 'In the beginning⟦1⟧ God created heaven, and earth.');
		const lemmas = new Map<number, LemmaSplit>();
		const split = splitLemma('In the beginning', 'The beginning');
		if (split) lemmas.set(0, split);
		expect(segmentText(buildSegments(text, pieces, lemmas, []))).toBe(text);
		expect(
			segmentText(buildSegments(text, pieces, lemmas, anchorsFor(text, [note('heaven')])))
		).toBe(text);
		expect(segmentText(buildSegments(text, splitMarkers(text), new Map(), []))).toBe(text);
	});

	it('sets a commentary mark after the words it quotes', () => {
		const segs = buildSegments(
			text,
			splitMarkers(text),
			new Map(),
			anchorsFor(text, [note('God')])
		);
		const kinds = segs.map((s) => s.kind);
		expect(kinds).toEqual(['text', 'quoted', 'mark', 'text']);
		expect(segs[1]).toMatchObject({ kind: 'quoted', text: 'God' });
	});

	it('keeps several marks in text order', () => {
		const segs = buildSegments(
			text,
			splitMarkers(text),
			new Map(),
			anchorsFor(text, [note('beginning'), note('heaven')])
		);
		expect(
			segs.filter((s) => s.kind === 'quoted').map((s) => (s as { text: string }).text)
		).toEqual(['beginning', 'heaven']);
	});

	// An anchor reaching into the run's tail, which the edition's own note has
	// claimed. Nothing is lost — the caller puts those notes on the trailing
	// mark — but the two apparatuses must not nest.
	it('drops an anchor that straddles the edition’s own lemma', () => {
		const pieces = splitMarkers(text, 'In the beginning God⟦1⟧ created heaven, and earth.');
		const lemmas = new Map<number, LemmaSplit>();
		const split = splitLemma('In the beginning God', 'beginning God');
		expect(split).toBeDefined();
		lemmas.set(0, split!);
		const segs = buildSegments(text, pieces, lemmas, anchorsFor(text, [note('the beginning')]));
		expect(segs.some((s) => s.kind === 'mark')).toBe(false);
		expect(segmentText(segs)).toBe(text);
	});
});
