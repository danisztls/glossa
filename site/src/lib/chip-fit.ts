/**
 * How many chips of a row are printed before the rest become a count.
 *
 * `/documenta`'s subjects are the caller. A document carries three on average
 * and the heavily filed ones carry eight or nine, which is a paragraph of
 * chips under a two-line description — the row stops being a title with facts
 * under it and becomes a list of tags with a title on top.
 *
 * ## It measures nothing, and that is the decision
 *
 * The honest criterion is a WIDTH — one line on a phone, half the row above
 * that — and the browser is the only thing that knows one. Asking it means a
 * `ResizeObserver` per row, a second layout pass after every filter, and a
 * visible settle on a list of 272; so the width is ESTIMATED from the text, in
 * characters, which is a number the row already has.
 *
 * The estimate is deliberately crude, because being wrong costs a chip either
 * way and nothing else: a row that cuts one chip early shows `+2` where it
 * could have shown `+1`, and one that cuts late wraps to a second line. Both
 * are what the reader gets today on every row.
 *
 * ## The arithmetic behind the two budgets
 *
 * A `.doc-tag` is set at 0.7rem — 11.2px at the browser's own default root —
 * and a lowercase character in Source Sans 3 advances about half its size, so
 * roughly 5.6px. Its padding (0.4rem either side) and the gap after it
 * (0.3rem) come to 17.6px, near enough three characters: `CHIP_CHROME`.
 *
 * `WIDE` is half of `--index-width` (62rem → 31rem → 496px → ~88 characters),
 * which is the row the subjects share with the languages at its end. `NARROW`
 * is one line of the card on a phone (~350px inside a 390px viewport → ~62),
 * where the languages have taken a line of their own and the subjects have the
 * whole of this one.
 */

/** A chip's padding and the gap after it, in characters of its own size. */
export const CHIP_CHROME = 3;

/** Half the row, for the layout that has an aside beside it. */
export const TAG_BUDGET_WIDE = 88;

/** One line of a phone's card. */
export const TAG_BUDGET_NARROW = 62;

/**
 * How many of `labels` to print. The rest belong behind a count.
 *
 * TWO RULES KEEP A COUNT FROM COSTING MORE THAN IT SAVES. One chip is always
 * printed, so a single long subject is shown rather than hidden behind a `+1`
 * that says nothing about it; and a run that would hide exactly one chip
 * prints the lot, since `+1` is about as wide as the chip it replaces and the
 * reader would be pressing it to learn one word.
 */
export function fitChips(labels: readonly string[], budget: number): number {
	let used = 0;
	let fit = 0;
	for (const label of labels) {
		used += label.length + CHIP_CHROME;
		if (used > budget && fit > 0) break;
		fit += 1;
	}
	return fit >= labels.length - 1 ? labels.length : fit;
}
