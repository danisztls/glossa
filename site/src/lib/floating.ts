/**
 * Where a floating panel goes, given what it is anchored to.
 *
 * Extracted from `LinkPreview.svelte`, which had the only viewport-clamping
 * positioner on the site, when the anchor popover became the second consumer.
 * The header menus do NOT use this and shouldn't: they are `position:
 * absolute` inside a `position: relative` trigger wrapper, hung from the
 * trigger's bottom-right corner by CSS alone (`app.css`'s `.menu-panel`), and
 * a header trigger is never anywhere near an edge the panel could fall off.
 * The two consumers here are anchored to arbitrary points in flowing prose --
 * a verse number mid-line, a paragraph number sitting at `-3.25rem` in the
 * margin, outside the content column entirely -- where CSS alone cannot know
 * whether the panel fits.
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
