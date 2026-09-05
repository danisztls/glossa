/**
 * Every commentary's notes on one unit, divided into the marks that will
 * carry them.
 *
 * IT IS A MODULE BECAUSE THE PARTITION WENT UNTESTED INSIDE A COMPONENT, AND
 * BROKE THERE. `anchorCommentary` divides a verse's notes correctly and
 * `AnnotatedText` used to spread the whole ENTRY into each placement, so every
 * inline mark carried the work's entire apparatus on that verse and only the
 * trailing mark was scoped. Measured over the built corpus: 18,943 of 20,789
 * annotated verses affected, 66,929 note-renderings where 24,805 were right,
 * and 1 Maccabees 15:23 opening the same fifteen notes from fifteen daggers.
 * Nothing erred, because a superset renders perfectly well.
 *
 * The test that was supposed to catch it ran over `anchorCommentary`'s OUTPUT,
 * and the leak was one layer above — at the point of USE, which lived in a
 * `.svelte` file and so was reachable by no test in this repository. That is
 * the whole argument for the module: it is the same reason
 * `annotated-segments.ts` was extracted, and it now holds a test that fails on
 * exactly this.
 *
 * The partition is TOTAL and DISJOINT, which is the property worth pinning:
 * every note is behind exactly one mark. Measured over the built corpus when
 * the anchoring landed, 9,349 verses take inline marks only, 1,846 a trailing
 * mark only and 9,594 both — and a leak in either direction would lose a fifth
 * of Haydock's apparatus with nothing erroring.
 */
import type { CommentaryNote, WorkManifest } from '$lib/types';
import {
	anchorCommentary,
	anchorCommentaryLines,
	type CommentaryAnchor,
	type CommentaryLineAnchor
} from '$lib/commentary-anchors';
import type { PlacedAnchor } from '$lib/annotated-segments';

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

/**
 * The same partition over a unit the source printed as SEVERAL LINES — a
 * prayer, whose notes name the prayer and quote one of its clauses.
 *
 * `byLine` rather than one `inline` list, because the cuts are made per line: a
 * prayer line is its own element (`PrayerBlocks`), so each needs its own run of
 * segments. `placed` stays flat and its index is still the mark's identity,
 * exactly as above, so `buildSegments` needs no notion of a line at all — it is
 * handed one line's text and the runs that fall inside it.
 *
 * A QUOTATION THE EDITION SET ACROSS A BREAK IS ONE ANCHOR AND SEVERAL RUNS.
 * Each line lights the words it prints; only the last takes the dagger, which
 * is `PlacedAnchor.showMark` and is what stops one note raising three marks.
 *
 * THERE IS NO TRAILING MARK, AND THAT IS THE PRAYER APPARATUS'S OWN RULE
 * (2026-09-05). A verse ends and its unplaced notes can hang there; a prayer
 * has no such place until its last line, and an apparatus at the foot of a
 * seven-line text is a paragraph of the Catechism reprinted beside the prayer
 * rather than a gloss ON it. So `prayers_glossa.py` stores only notes that
 * quote a clause, and what the rest of those two books say about the prayer is
 * offered as `PrayerCommentary.references` — a place to go and read them.
 *
 * `unplaced` is therefore expected to be EMPTY and is returned anyway. It is
 * the one thing that could go wrong silently: the pipeline and
 * `commentary-anchors.ts` fold the same strings by the same rules, and if they
 * ever stop agreeing a note would simply not appear. Naming it is what lets a
 * caller — or a test — say so.
 */
export interface PlacedPrayerCommentary extends CommentaryEntry {
	/** `undefined` on the mark at the prayer's end. */
	anchor: CommentaryLineAnchor | undefined;
}

export interface PrayerCommentaryPlacement {
	placed: PlacedPrayerCommentary[];
	/** One entry per line, in the order given: the quoted runs that line
	 *  carries, in text order. */
	byLine: PlacedAnchor[][];
	/** Notes whose lemma the prayer's lines did not carry. Empty against the
	 *  corpus, and NOT rendered — see the docblock above. */
	unplaced: PlacedPrayerCommentary[];
}

export function placePrayerCommentary(
	lines: readonly string[],
	commentary: readonly CommentaryEntry[] | undefined
): PrayerCommentaryPlacement {
	const placed: PlacedPrayerCommentary[] = [];
	const byLine: PlacedAnchor[][] = lines.map(() => []);

	for (const entry of commentary ?? []) {
		const { anchors, trailing } = anchorCommentaryLines(lines, entry.notes);
		for (const anchor of anchors) {
			// `notes: anchor.notes` and not the entry's, for the reason
			// `placeCommentary` above spells out at length.
			const at = placed.length;
			placed.push({ ...entry, notes: anchor.notes, anchor });
			anchor.spans.forEach((span, i) => {
				byLine[span.line].push({
					anchor: { from: span.from, to: span.to, notes: anchor.notes },
					at,
					showMark: i === anchor.spans.length - 1
				});
			});
		}
		if (trailing.length) placed.push({ ...entry, notes: trailing, anchor: undefined });
	}

	for (const marks of byLine) marks.sort((a, b) => a.anchor.from - b.anchor.from);
	return { placed, byLine, unplaced: placed.filter((p) => !p.anchor) };
}
