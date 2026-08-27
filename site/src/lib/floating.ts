/**
 * Where a floating panel goes, given what it is anchored to.
 *
 * Extracted from `LinkPreview.svelte`, which had the only viewport-clamping
 * positioner on the site, when the anchor popover became the second consumer.
 * Those two are anchored to arbitrary points in flowing prose -- a verse
 * number mid-line, a paragraph number sitting at `-3.25rem` in the margin,
 * outside the content column entirely -- and `computePanelPosition` decides
 * where they go outright.
 *
 * THE DROPDOWN MENUS STILL POSITION THEMSELVES IN CSS, and should: they are
 * `position: absolute` inside a `position: relative` trigger wrapper, hung
 * from the trigger's bottom-right corner by `app.css`'s `.menu-panel`, which
 * is the right answer as long as the trigger has room to its start side. What
 * they take from here is `keepInViewport` -- the clamp alone, over a panel CSS
 * has already placed. This file used to say a menu trigger "is never anywhere
 * near an edge the panel could fall off"; `ReadingBar`'s edition picker is the
 * first control in its row, and it is.
 */

/** Breathing room from the viewport edge, and between anchor and panel. */
const GAP = 8;

/**
 * Viewport coordinates for a `position: fixed` panel of size `box` anchored
 * to `anchor`.
 *
 * Below the anchor when it fits, above when it doesn't, and pinned inside the
 * viewport when neither fits (a panel taller than the screen). Horizontally
 * start-aligned with the anchor, pulled back when that would overflow the
 * right edge, and never pushed past the left one -- the clamp order matters,
 * because an anchor in the margin can be far enough left that correcting for
 * the right edge would otherwise take the panel negative.
 */
export function computePanelPosition(anchor: DOMRect, box: DOMRect): { top: number; left: number } {
	let top = anchor.bottom + GAP;
	if (top + box.height > window.innerHeight - GAP) {
		const above = anchor.top - GAP - box.height;
		top = above >= GAP ? above : Math.max(GAP, window.innerHeight - box.height - GAP);
	}
	let left = anchor.left;
	if (left + box.width > window.innerWidth - GAP) left = window.innerWidth - box.width - GAP;
	left = Math.max(GAP, left);
	return { top, left };
}

/**
 * Keeps an already-positioned panel inside the viewport horizontally.
 *
 * The `.menu-panel` primitive hangs from its trigger's bottom-right corner in
 * CSS alone, which is correct wherever the trigger is near the right edge and
 * broken wherever it is not: the panel grows leftward by at least its
 * `min-width` (14rem), so a trigger whose right edge sits closer to the start
 * of the viewport than that puts the panel's left edge at a negative
 * coordinate. `app.css` used to answer this for the header alone, by making
 * the panels resolve against `.header-bar` below 30rem — a rule that could
 * only ever cover the menus it named, and did not cover `ReadingBar`'s
 * edition picker, which sits at the START of its row and overflowed there.
 *
 * CSS cannot measure the distance from an element to the viewport edge, so
 * this reads it back after layout and shifts the panel by whatever it is
 * short. It is a CORRECTION, not a positioner: `computePanelPosition` above
 * decides where a panel goes, this only nudges one already placed. Zero shift
 * is the common case and writes no style at all.
 *
 * Applied as `translate` rather than as an inset, so it composes with the
 * logical `inset-inline-end` the panel is anchored by and needs no separate
 * RTL case — the shift is measured in physical pixels because the viewport
 * edge it corrects against is physical too.
 */
export function keepInViewport(node: HTMLElement) {
	const apply = () => {
		// Measure unshifted: a stale correction from the previous viewport
		// width would otherwise be read back as part of the panel's position.
		node.style.removeProperty('translate');
		const shift = inlineShift(node.getBoundingClientRect(), window.innerWidth);
		if (shift) node.style.translate = `${Math.round(shift)}px 0`;
	};

	apply();
	// The panel's own size can change while it is open (`AppearanceMenu`'s
	// stepper reflows as the reading grows), and its max-width is a share of
	// the viewport, so both ends are observed.
	const observer = new ResizeObserver(apply);
	observer.observe(node);
	window.addEventListener('resize', apply);

	return {
		destroy() {
			observer.disconnect();
			window.removeEventListener('resize', apply);
		}
	};
}

/**
 * How far to move a box, in physical pixels, to bring it inside a viewport
 * `width` wide with `GAP` to spare. Positive is rightward. Zero -- the common
 * case, on every viewport with room for the panel where it already is --
 * means the caller writes no style at all.
 *
 * Split from the action above only so it can be tested: the test environment
 * is `node`, with no layout to measure.
 */
export function inlineShift(box: { left: number; right: number }, width: number): number {
	let shift = 0;
	if (box.right > width - GAP) shift = width - GAP - box.right;
	// Order matters, as in `computePanelPosition`: a panel wider than the room
	// it has must overflow the FAR edge, never the near one, because only the
	// near one puts its first row out of reach.
	if (box.left + shift < GAP) shift = GAP - box.left;
	return shift;
}
