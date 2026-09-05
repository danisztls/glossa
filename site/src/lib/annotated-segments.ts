/**
 * One annotated unit as a flat run of things to draw — which is what THREE
 * separate cuts through a single string turned it into.
 *
 * A verse is divided by the edition's own footnote markers (`splitMarkers`), by
 * the words an edition note quotes (`splitLemma`, always at the end of the run
 * before its marker), and by the words a commentary note quotes
 * (`anchorCommentary`, anywhere in the unit). Composing those in the template
 * took three levels of `{@const}` and one more would have been unreadable, so
 * the arithmetic happens here and `AnnotatedText` renders a list.
 *
 * IT IS A MODULE AND NOT A `$derived` IN THE COMPONENT because there is no
 * component test harness in this repository (CLAUDE.md): keeping renderable
 * logic out of `.svelte` files is the only way it gets tested at all. What
 * wants testing here is the one property everything else rests on — that the
 * text segments, in order, are the verse exactly, with nothing dropped,
 * duplicated or reordered.
 */
import type { MarkedPiece } from './inline-markers';
import type { LemmaSplit } from './lemma';
import type { CommentaryAnchor } from './commentary-anchors';

export type Segment =
	/** Ordinary text, and what a drop cap is taken from. */
	| { kind: 'text'; text: string }
	/** The words an edition note quotes; `note` is the piece index of its marker. */
	| { kind: 'lemma'; text: string; note: number }
	/** The words a commentary note quotes; `mark` indexes the placed commentary. */
	| { kind: 'quoted'; text: string; mark: number }
	/** The edition's own footnote marker, at the piece it came from. */
	| { kind: 'note'; piece: number; marker: string }
	/** A commentary's mark, set after the words it quotes. */
	| { kind: 'mark'; mark: number };

/** A commentary anchor with the index of the placement that owns it. */
export interface PlacedAnchor {
	anchor: CommentaryAnchor;
	at: number;
	/**
	 * Whether this run of quoted words takes the mark. Absent means yes, which
	 * is every Bible caller: a verse is one line, so a quotation begins and ends
	 * inside it.
	 *
	 * FALSE ON EVERY LINE BUT THE LAST OF A QUOTATION THE EDITION SET ACROSS A
	 * BREAK. A printed apparatus sets its marker after the words it glosses,
	 * once; the words themselves are marked wherever they are. So a prayer's
	 * clause running over two lines lights both and takes one dagger, at the end
	 * of the second — see `anchorCommentaryLines`.
	 */
	showMark?: boolean;
}

export function buildSegments(
	text: string,
	pieces: MarkedPiece[],
	lemmas: Map<number, LemmaSplit>,
	inline: PlacedAnchor[]
): Segment[] {
	const out: Segment[] = [];
	const push = (t: string) => {
		if (t !== '') out.push({ kind: 'text', text: t });
	};
	let offset = 0;
	let next = 0;

	for (const [i, piece] of pieces.entries()) {
		if ('marker' in piece) {
			out.push({ kind: 'note', piece: i, marker: piece.marker });
			continue;
		}
		const start = offset;
		const end = start + piece.text.length;
		offset = end;

		// The edition's lemma is the tail of this run, so it bounds how far a
		// commentary anchor may reach into it: the two mark different things and
		// must not be nested.
		const lemma = lemmas.get(i);
		const stop = end - (lemma ? lemma.lemma.length : 0);

		let at = start;
		while (next < inline.length && inline[next].anchor.to <= stop) {
			const { anchor, at: mark } = inline[next];
			next += 1;
			// AN ANCHOR THAT STRADDLES A CUT IS DROPPED, deliberately and
			// silently: its notes fall to the trailing mark, where nothing is
			// lost. Splitting a commentary's quotation around the edition's own
			// footnote marker, or around the words another note quotes, would put
			// two apparatuses inside one another.
			//
			// A PRAYER HAS NO TRAILING MARK (2026-09-05), so there the drop would
			// be a loss — and there is nothing to drop: a prayer line is one
			// piece with no edition lemma, so `stop` is the line's end and there
			// is no cut to straddle. `PrayerBlocks` is the simplest caller this
			// function has, which is what makes that true rather than lucky.
			if (anchor.from < at) continue;
			push(text.slice(at, anchor.from));
			out.push({ kind: 'quoted', text: text.slice(anchor.from, anchor.to), mark });
			if (inline[next - 1].showMark !== false) out.push({ kind: 'mark', mark });
			at = anchor.to;
		}
		push(text.slice(at, stop));
		if (lemma) out.push({ kind: 'lemma', text: lemma.lemma, note: i + 1 });
	}
	return out;
}

/** Every character the segments will render, in order — the property the tests
 *  pin, and the one a reader would notice broken before anything else. */
export function segmentText(segments: Segment[]): string {
	return segments
		.map((seg) =>
			seg.kind === 'text' || seg.kind === 'lemma' || seg.kind === 'quoted' ? seg.text : ''
		)
		.join('');
}
