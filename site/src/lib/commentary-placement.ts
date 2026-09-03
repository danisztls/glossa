/**
 * Every commentary's notes on one unit, divided into the marks that will
 * carry them.
 *
 * IT IS A MODULE BECAUSE TWO SURFACES NOW ASK THE SAME QUESTION. It was
 * `AnnotatedText`'s alone while a mark was the only way into a commentary:
 * the component cut the text, so the component owned the partition. The
 * commentary column reads it too — a mark in the verse has to name the block
 * in the pane that holds its notes — and calling `anchorCommentary` twice in
 * two places and hoping the two agree about which notes are trailing is
 * exactly the invariant `annotated-segments.ts` was extracted to protect. A
 * disagreement there does not throw; it silently points a mark at another
 * note's text.
 *
 * The partition is TOTAL and DISJOINT, which is the property worth pinning:
 * every note is behind exactly one mark. Measured over the built corpus when
 * the anchoring landed, 9,349 verses take inline marks only, 1,846 a trailing
 * mark only and 9,594 both — and a leak in either direction would lose a fifth
 * of Haydock's apparatus with nothing erroring.
 */
import type { CommentaryNote, WorkManifest } from '$lib/types';
import { anchorCommentary, type CommentaryAnchor } from '$lib/commentary-anchors';

/** One commentary's notes on this unit, as handed in by the caller. */
export interface CommentaryEntry {
	work: WorkManifest;
	notes: CommentaryNote[];
}

/** One mark's worth of commentary: the notes behind it, and where in the text
 *  it sits. `anchor: undefined` is the mark at the unit's end. */
export interface PlacedCommentary extends CommentaryEntry {
	anchor: CommentaryAnchor | undefined;
}

/** A placement the text itself carries, with its index in `placed` — which is
 *  the mark's identity everywhere else, `buildSegments`'s `mark` included. */
export interface InlinePlacement extends PlacedCommentary {
	anchor: CommentaryAnchor;
	at: number;
}

export interface CommentaryPlacement {
	/** Every mark on this unit, in work order then anchor order. The index into
	 *  this array is what a segment's `mark` refers to. */
	placed: PlacedCommentary[];
	/** The marks the text carries, in TEXT order, so the cuts can be made in
	 *  one pass. */
	inline: InlinePlacement[];
	/** The notes no words in the text carry — the mark at the unit's end. */
	trailing: PlacedCommentary[];
}

/**
 * `text` is the unit as the annotated edition prints it; nothing here rewrites
 * it, since an anchor is a pair of offsets into that exact string.
 *
 * FLATTENED ACROSS WORKS because the segments are one sequence: two
 * commentaries anchoring at the same words would otherwise each want to cut the
 * run, and the order they are set in has to be the order the works are listed.
 * Each entry keeps its own work, since the mark's label and the grammar its
 * citations resolve under are the work's, not the edition's.
 */
export function placeCommentary(
	text: string,
	commentary: readonly CommentaryEntry[] | undefined
): CommentaryPlacement {
	const placed: PlacedCommentary[] = (commentary ?? []).flatMap((entry) => {
		const { anchors, trailing } = anchorCommentary(text, entry.notes);
		return [
			// `notes: anchor.notes` AND NOT THE ENTRY'S. Spreading `entry` alone
			// leaves every inline mark holding the work's whole apparatus on this
			// verse, which is what shipped between the anchoring landing on
			// 2026-09-01 and this extraction: `anchorCommentary` divided the notes
			// correctly and the render then handed all of them to each mark, so a
			// dagger after "beginning" opened Genesis 1:1's entire catena and the
			// one after the next phrase opened it again. Nothing erred, because a
			// superset renders perfectly well.
			...anchors.map((anchor) => ({ ...entry, notes: anchor.notes, anchor })),
			...(trailing.length ? [{ ...entry, notes: trailing, anchor: undefined }] : [])
		];
	});

	const inline = placed
		.flatMap((p, at) => (p.anchor ? [{ ...p, anchor: p.anchor, at }] : []))
		.sort((a, b) => a.anchor.from - b.anchor.from);

	return { placed, inline, trailing: placed.filter((p) => !p.anchor) };
}
