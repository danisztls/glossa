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
 * VERSE TAKES A ONE-LINE VERSAL AND PROSE TAKES THE THREE-LINE CAP, which is
 * the same initial at the two sizes the setting can carry.
 *
 * A drop cap is sized in LINES and the lines beside it indent around it — right
 * where those lines are the viewport's, wrong where they are the source's.
 * `PrayerBlocks` gives every printed line a `<p>` of its own and a float
 * overflows its own paragraph, so the three-line cap reached down into the two
 * `<p>`s below it: the Pai Nosso indented `santificado` and `venha` until they
 * read as continuations of the first line. At one line the float ends inside
 * the paragraph that opened it and there is nothing left for it to indent.
 *
 * `line.verse` IS the size, and nothing else distinguishes the two: it says the
 * source broke this block into lines, and a line the source printed is the
 * thing a three-line cap would indent (`prayer-lines.ts`).
 *
 * ONE INITIAL PER PRAYER EITHER WAY, on the opening line of the opening block.
 * A versal on every capitalised line was tried on 2026-09-03 and is the wrong
 * reading of the device: the lowercase rule fires it on about one line in five,
 * so it lands mid-stanza wherever a line happens to open on a capital rather
 * than where the prayer begins. A later block is a further paragraph of the
 * same prayer, not a second beginning — which is `ProseBlocks`'s rule for
 * excluding a `quote` block, arrived at from the other side.
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
	if (!(line.block === 0 && line.first)) return null;
	// The split comes off the line's first TEXT run rather than off its markup:
	// a line opening `<i>Sancta Maria</i>` would otherwise put a tag inside the
	// initial.
	const head = line.nodes[0];
	if (head?.kind !== 'text') return null;
	const split = splitDropCap(head.text);
	if (split.first === '') return null;
	const consumed = head.text.length - split.rest.length;
	// AND NOT WHERE A NOTE QUOTES THE OPENING WORD ITSELF. The initial and the
	// apparatus contend over exactly one thing: the characters the cap promotes.
	// The segments say whether they are contended — a first segment that is
	// plain text means the first lemma begins after them, and the two devices
	// are then simply in different places on the same line. Where the lemma
	// starts at the head, the letter would have to be lifted out of the words a
	// note is lighting, and the flourish stands down instead: it is an ornament
	// and the mark is the apparatus.
	//
	// IT USED TO STAND DOWN FOR ANY GLOSSED LINE, which was safe while verse
	// took no initial at all and became the whole of the feature once it did —
	// the four glossed English prayers (`commentary.preces.en`) are the Pater,
	// the Ave and both Creeds, every one of them verse.
	if (opts.segments) {
		const first = opts.segments[0];
		if (first?.kind !== 'text' || first.text.length < consumed) return null;
	}
	return { ...split, versal: line.verse, consumed };
}

/**
 * The line's nodes with the initial's characters taken off the front — what a
 * line with no apparatus renders after the cap.
 */
export function capNodes(line: PrayerLine, cap: PrayerCap): PrayerLine['nodes'] {
	return [{ kind: 'text', text: cap.rest }, ...line.nodes.slice(1)];
}

/**
 * The same, for a line the apparatus has already cut. `prayerCap` has
 * guaranteed the first segment is text and long enough, so this can only ever
 * shorten a run it owns.
 */
export function capSegments(segments: Segment[], consumed: number): Segment[] {
	const [head, ...rest] = segments;
	if (head?.kind !== 'text') return segments;
	return [{ ...head, text: head.text.slice(consumed) }, ...rest];
}
