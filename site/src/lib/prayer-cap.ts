/**
 * WHICH PRAYER LINE TAKES AN INITIAL, AT WHICH OF THE TWO SIZES, AND WHAT IS
 * LEFT OF THE LINE ONCE THE LETTER IS LIFTED OUT OF IT.
 *
 * A module rather than three functions inside `PrayerBlocks.svelte`, on this
 * project's standing rule: there is no component test harness here, so logic
 * left in a `.svelte` file is logic nothing runs but a browser. What made that
 * bite was the offset — `capSegments` slices a string the commentary apparatus
 * has already cut, and one character either way silently drops a letter of a
 * prayer or repeats it, which is `buildSegments`' own reason for being a
 * module.
 */

import { splitDropCap, type DropCapSplit } from './dropcap';
import type { Segment } from './annotated-segments';
import type { PrayerLine } from './prayer-lines';

export interface PrayerCap extends DropCapSplit {
	/**
	 * The one-line size, for verse. `dropcaps.css` reads it as
	 * `.drop-cap-versal`; see there for the arithmetic and for why the three-line
	 * cap cannot be used on a line the source printed.
	 */
	versal: boolean;
	/**
	 * How many characters of the line's opening text the initial took, measured
	 * against the ORIGINAL string rather than recomputed from `lead + first`:
	 * `splitDropCap` trims leading whitespace, so a block that arrived from the
	 * parser with a space in front would otherwise leave that space behind and
	 * set the cap an em off the margin.
	 */
	consumed: number;
}

/**
 * A PRAYER SET IN VERSE TAKES A ONE-LINE VERSAL AT EVERY BLOCK; A PRAYER SET
 * AS PROSE TAKES THE THREE-LINE CAP ONCE. Both halves are decided by
 * `opensInVerse`, which is a property of the PRAYER — never by `line.verse`,
 * which is a property of the block this line came out of.
 *
 * The SIZE is what that first buys. A drop cap is sized in LINES and the lines
 * beside it indent around it — right where those lines are the viewport's,
 * wrong where they are the source's. `PrayerBlocks` gives every printed line a
 * `<p>` of its own and a float overflows its own paragraph, so the three-line
 * cap reached down into the two `<p>`s below it: the Pai Nosso indented
 * `santificado` and `venha` until they read as continuations of the first line.
 * At one line the float ends inside the paragraph that opened it and there is
 * nothing left for it to indent.
 *
 * **And a verse prayer's later blocks are sized by the prayer for a reason the
 * line cannot see.** The Regina Caeli is a stanza, then `Let us pray;`, then a
 * collect — two single-run blocks under verse. Sized line by line those two
 * would take the three-line cap, and the one on `Let us pray;` would overflow
 * its four-word paragraph straight into the collect below and indent it, which
 * is the bug this whole rule exists to prevent. An initial's size belongs to
 * the setting it stands in, not to the block it happens to open.
 *
 * WHICH BLOCKS is the other half, and the two settings genuinely differ. A
 * prose prayer's second block is a further paragraph of one run — not a second
 * beginning, which is `ProseBlocks`'s rule for excluding a `quote` block,
 * arrived at from the other side. A verse prayer's second block is a MOVEMENT:
 * the stanza ends, the rubric turns, the collect begins, and the source set
 * each apart on purpose. So a verse prayer takes an initial at every block's
 * first line and a prose prayer only at its first.
 *
 * NOT ON EVERY CAPITALISED LINE, which was tried on 2026-09-03 and is the wrong
 * reading of the device: the lowercase rule fires it on about one line in five,
 * so it lands mid-stanza wherever a line happens to open on a capital rather
 * than where something begins.
 *
 * `splitDropCap` decides the rest for the text itself: it declines a digit, a
 * lowercase opening and a joining script ($lib/dropcap.ts).
 */
export function prayerCap(
	line: PrayerLine,
	opts: {
		/** The caller's answer to whether these lines OPEN the reading — see
		    `PrayerBlocks`'s prop, which cannot decide it for itself. */
		dropCap: boolean;
		/**
		 * The line cut at the words its commentary quotes, where an apparatus is
		 * switched on for it, and undefined where none is.
		 */
		segments?: Segment[];
	}
): PrayerCap | null {
	// AND NOT TO A DIALOGUE'S OPENING TURN. The line already carries a mark of
	// its own — the `V.` or `D.` in its own column, which is what says where the
	// prayer starts and who says it — and an initial beside it is a second
	// answer to the question the label has answered. The layout agrees: a
	// versicle's text sits in a flex item, a flex item is a block formatting
	// context, and so it CONTAINS the float rather than letting it escape,
	// leaving the letter standing in a row with the label at its shoulder and
	// nothing wrapped around it. Three prayers in the corpus open this way (EN,
	// FR and PT Angelus); every other opening block is prose, and since the
	// initial goes on the opening block alone, such a prayer takes none at all.
	if (!opts.dropCap || line.kind !== 'prose') return null;
	if (!line.first) return null;
	if (!(line.block === 0 || line.opensInVerse)) return null;
	// The split comes off the line's first TEXT run rather than off its markup:
	// a line opening `<i>Sancta Maria</i>` would otherwise put a tag inside the
	// initial.
	const head = line.nodes[0];
	if (head?.kind !== 'text') return null;
	const split = splitDropCap(head.text);
	if (split.first === '') return null;
	const consumed = head.text.length - split.rest.length;
	// THE INITIAL IS LIFTED OUT OF WHATEVER RUN OPENS THE LINE, THE WORDS A NOTE
	// QUOTES INCLUDED, and the corpus is what settled that. Three of the four
	// glossed English prayers open on their own first lemma — the Creed's first
	// note quotes `I believe in God`, the Ave's quotes `Hail Mary`, both from
	// character zero — so refusing a contended opening refused the initial on
	// three of the four best-known prayers in the collection while the Pater,
	// whose first lemma begins four characters in, kept one. A rule whose
	// outcome is decided by where somebody else's quotation happens to start is
	// not a typographic rule.
	//
	// So the cap takes its letter and the lemma keeps the rest: the highlight a
	// note draws when it opens begins after the initial, which is what a printed
	// edition does — a versal belongs to the page, not to the sentence it opens,
	// and it is the most visible thing on the line either way. What is still
	// refused is an opening the cap cannot be taken out of at all: a first
	// segment carrying no text (a mark at position zero), or one shorter than
	// the letter, where slicing would reach into the run after it.
	if (opts.segments) {
		const first = headOf(opts.segments);
		if (first === undefined || first.length < consumed) return null;
	}
	return { ...split, versal: line.opensInVerse, consumed };
}

/**
 * The line's nodes with the initial's characters taken off the front — what a
 * line with no apparatus renders after the cap.
 */
export function capNodes(line: PrayerLine, cap: PrayerCap): PrayerLine['nodes'] {
	return [{ kind: 'text', text: cap.rest }, ...line.nodes.slice(1)];
}

/**
 * The opening run's text, whatever KIND of run it is — plain text, an edition's
 * lemma, or the words a commentary quotes. `mark` and `note` carry none and
 * answer undefined, which is what `prayerCap` refuses on.
 */
function headOf(segments: Segment[]): string | undefined {
	const head = segments[0];
	return head && 'text' in head ? head.text : undefined;
}

/**
 * The same, for a line the apparatus has already cut. `prayerCap` has
 * guaranteed the first run carries text and is long enough, so this can only
 * ever shorten a run it owns — and it keeps that run's KIND, so a lemma the cap
 * came out of still lights the rest of itself when its note opens.
 */
export function capSegments(segments: Segment[], consumed: number): Segment[] {
	const [head, ...rest] = segments;
	if (!head || !('text' in head)) return segments;
	return [{ ...head, text: head.text.slice(consumed) }, ...rest];
}
