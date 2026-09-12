/**
 * How many chips of a row are printed before the rest become a count.
 *
 * `/documenta`'s subjects are the caller. A document carries three on average
 * and the heavily filed ones carry eight or nine, which is a paragraph of
 * chips under a two-line description — the row stops being a title with facts
 * under it and becomes a list of tags with a title on top.
 *
 * ## It measures, and the first version estimated
 *
 * The estimate was characters: a label's length plus three for its padding,
 * against a budget derived from the chip's type size. It was wrong on the
 * layout it mattered most on — a phone row took six subjects onto two lines,
 * which is the one thing the count exists to prevent — because a character
 * count is not a width in a proportional face, where `social doctrine` and
 * `illlllllllllll` are the same fifteen characters and nothing like the same
 * chip. **A rule about a width has to be given a width.**
 *
 * ## What it costs is one hidden element and no layout pass per row
 *
 * `ChipRuler` writes a label into one probe chip the page renders — the real
 * class, the real face, the real padding — and reads the box back. Per LABEL
 * and not per row: the subject vocabulary is closed at a few dozen terms
 * (`site/document-tags.json`), so the whole list is measured once and kept,
 * where a `ResizeObserver` per row would be a second layout pass on 272 of
 * them after every filter. A ruler holds its answers for as long as the caller
 * holds the ruler, which is what makes a font arriving cheap to answer: the
 * route takes a fresh one, and `document.fonts.ready` is the signal.
 */

/**
 * How many of `widths` fit in `available`, in pixels.
 *
 * EACH WIDTH CARRIES THE GAP THAT FOLLOWS IT, which over-counts the last chip
 * in the run by one gap — the direction that cuts a chip early rather than
 * late, and the only direction worth being wrong in here.
 *
 * `countWidth` IS RESERVED WHENEVER A COUNT IS NEEDED and never otherwise,
 * which is what the first pass does: a run that fits entire has no count to
 * make room for, so asking for the count's own width first would hide a chip
 * in order to say that a chip was hidden. It also replaces the rule the
 * estimate needed — that a run hiding exactly one chip prints the lot — since
 * a `+1` no wider than the chip it stands for now keeps the chip it stands
 * for, by arithmetic rather than by exception.
 */
export function fitChips(widths: readonly number[], available: number, countWidth: number): number {
	let whole = 0;
	for (const width of widths) whole += width;
	if (whole <= available) return widths.length;

	let used = countWidth;
	let fit = 0;
	for (const width of widths) {
		// ONE CHIP ALWAYS PRINTS. A subject long enough to fill the row on its
		// own is still what the row is filed under, and a row whose only visible
		// subject is `+1` says nothing at all.
		if (used + width > available && fit > 0) break;
		used += width;
		fit += 1;
	}
	return fit;
}

/**
 * The width a chip carrying a given label would take, measured on the page's
 * own probe element.
 *
 * NOT A FONT STACK AND A CANVAS: the probe wears the same class as the chips
 * it stands for, so the face, the size, the padding, the border and every
 * theme that moves any of them are the browser's answer rather than a table
 * here that would have to be kept true.
 */
export class ChipRuler {
	#probe: HTMLElement;
	#widths = new Map<string, number>();

	constructor(probe: HTMLElement) {
		this.#probe = probe;
	}

	/** The chip's border box, fractional — `getBoundingClientRect` and not
	 *  `offsetWidth`, which rounds, and rounding down a dozen chips is a line
	 *  that wraps for a pixel nobody can see. */
	width(label: string, variant?: string): number {
		const key = variant ? `${variant}\n${label}` : label;
		const seen = this.#widths.get(key);
		if (seen !== undefined) return seen;
		if (variant) this.#probe.classList.add(variant);
		this.#probe.textContent = label;
		const width = this.#probe.getBoundingClientRect().width;
		this.#probe.textContent = '';
		if (variant) this.#probe.classList.remove(variant);
		this.#widths.set(key, width);
		return width;
	}
}
