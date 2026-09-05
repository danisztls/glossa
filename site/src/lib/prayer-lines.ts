import type { PrayerBlock, PrayerBlockKind } from '$lib/types';
import { parseInlineHtml, splitLines, type InlineNode } from '$lib/inline-html';

/**
 * ONE PRINTED LINE OF A PRAYER — the unit the SOURCE broke the text into, and
 * since 2026-09-03 the unit the page renders and compare mode aligns on.
 *
 * `PrayerBlocks` used to flatten this inside itself: a block came in, the
 * component split it and emitted the lines as spans within one paragraph. That
 * was fine while a cell held a whole prayer, and impossible once a cell had to
 * hold one line — compare mode aligns by handing `CompareGrid` a row per unit,
 * and a unit that only exists inside a component's render cannot be a row. So
 * the split happens here, once, and both the single column and the two columns
 * render the same flat list.
 *
 * The fields that are not the text are all answers the BLOCK knew and a line
 * on its own would not: which block it came from, whether that block was
 * broken into lines at all, whether this is the block's first line (the label,
 * the initial) or its last (the gap to the next block).
 */
export interface PrayerLine {
	/** Position among the prayer's printed lines. What the two columns zip on
	 *  in compare mode, and nothing else — a line has no address. */
	n: number;
	kind: PrayerBlockKind;
	/** The source's own label ("V.", "R.", "D.", "C."), verbatim and on the
	 *  block's FIRST line only — it prefixes the dialogue turn, not every line
	 *  of it. */
	label?: string;
	/** The block prints a label on some line. Its other lines reserve the
	 *  label's column so the turn stays in one alignment; a block whose source
	 *  prints no label at all reserves nothing and starts at the margin. */
	labelled: boolean;
	nodes: InlineNode[];
	/** The source broke this block into lines — so this is verse, and the line
	 *  below is the source's own, not the viewport's. False for a block printed
	 *  as one run, whose only lines are wraps. */
	verse: boolean;
	/** Index of the block this line came from. Zero is the prayer's opening,
	 *  which is the one place a block printed as one run takes an initial. */
	block: number;
	first: boolean;
	/** Last line of its block, and so the one carrying the gap to the next. */
	last: boolean;
}

/*
 * `text` is plain text, so it has to be escaped before it can be parsed as the
 * narrow markup -- a prayer that printed an ampersand would otherwise arrive
 * as a broken entity.
 */
function escapeText(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * A prayer's blocks as the flat list of lines they print.
 *
 * `parseInlineHtml`, not `parseInlineProse`: a prayer's lines carry `<br>` and
 * nothing else (measured across the source's whole prayer region), and the one
 * thing the prose parser adds is linkifying scripture references out of running
 * prose -- which a prayer does not contain and which would turn "and lead us
 * not into temptation" into a hunt for citations that are not there. The
 * Rosary's meditations DO carry sourced locators, and those are
 * `PrayerMystery`'s, not this list's.
 */
export function prayerLines(blocks: PrayerBlock[]): PrayerLine[] {
	const out: PrayerLine[] = [];
	blocks.forEach((block, index) => {
		const ls = splitLines(parseInlineHtml(block.html ?? escapeText(block.text)));
		ls.forEach((nodes, i) => {
			out.push({
				n: out.length,
				kind: block.kind ?? 'prose',
				label: i === 0 ? block.label : undefined,
				labelled: block.label !== undefined,
				nodes,
				verse: ls.length > 1,
				block: index,
				first: i === 0,
				last: i === ls.length - 1
			});
		});
	});
	return out;
}

/**
 * ONE COLUMN OF ONE COMPARE ROW: the lines that go in it.
 *
 * A list and not a single line, because a row is not always a line. Where the
 * two editions break the prayer alike, every row holds one line on each side
 * and the columns stay level line for line; where they do not, one row holds
 * the whole of each and the columns flow as they did before. `pairPrayerLines`
 * is the decision, and holds the measurement behind it.
 */
export interface PrayerRow {
	n: number;
	lines: PrayerLine[];
}

/**
 * The two editions' lines as compare rows.
 *
 * LINE-FOR-LINE ONLY WHERE THE TWO EDITIONS BREAK ALIKE, and the corpus is
 * what makes that a condition rather than the whole answer: of the 28 prayers
 * Portuguese and English both hold, 8 print the same number of lines (against
 * Latin it is 6 of 24). The rest disagree, and not narrowly — the Nicene Creed
 * is 37 lines in Portuguese against 24 in English, and the Our Father is 9
 * against 1, because the English appendix prints it as one run. Zipping those
 * by position pairs a whole prayer with its opening line and leaves the rest of
 * the column blank, which is worse than the drift it set out to fix.
 *
 * So equal line counts is the gate. It does not PROVE the pairing — two
 * editions could break the same number of times in different places, and
 * nothing in the corpus could say — but it rules out every case where the
 * pairing is knowably wrong. Below the gate the row is the whole prayer, which
 * is what this route did for every prayer until 2026-09-03: the columns flow
 * independently and stay level only while neither wraps.
 *
 * The empty case takes the same fallback rather than no rows at all: the
 * Slovenian Rosary has four mystery groups and no blocks, and its groups render
 * in the band ABOVE the first row, which cannot exist without one.
 */
export function pairPrayerLines(
	left: PrayerLine[],
	right: PrayerLine[]
): { n: number; left: PrayerRow; right: PrayerRow }[] {
	if (left.length !== right.length || left.length === 0) {
		return [{ n: 0, left: { n: 0, lines: left }, right: { n: 0, lines: right } }];
	}
	return left.map((line, i) => ({
		n: i,
		left: { n: i, lines: [line] },
		right: { n: i, lines: [right[i]] }
	}));
}

/**
 * A line as the plain string a commentary anchor is an offset into, or
 * undefined where it is not one.
 *
 * EVERY PRAYER LINE IN THE CORPUS IS PLAIN TEXT, and the schema is why: a
 * prayer block's `html` carries `<br>` and nothing else (types.ts,
 * `PrayerBlock.html`), so `splitLines` hands back runs with no markup left in
 * them. This still asks rather than asserting, because the day a source
 * prints an italic inside a prayer the honest answer is to set that line with
 * no marks in it — its notes fall to the trailing mark and nothing is lost —
 * rather than to anchor an offset into a string the reader is not seeing.
 */
export function plainLine(line: PrayerLine): string | undefined {
	if (!line.nodes.every((node) => node.kind === 'text')) return undefined;
	return line.nodes.map((node) => (node.kind === 'text' ? node.text : '')).join('');
}
