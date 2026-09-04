/**
 * Keep a list's current row visible inside ITS OWN scroll container, without
 * ever moving the page.
 *
 * WHY THIS IS A MODULE AND NOT SIX LINES IN A COMPONENT. Three lists mark the
 * row the reader is standing on and want it on screen — the reading sidebar
 * (`StructureSidebarToc`), the page's own headings (`IndexSidebarToc`), and
 * the narrow-screen panel that renders both (`TocMenu`). The obvious call is
 * `scrollIntoView({ block: 'nearest' })`, and it is wrong here for a reason
 * that is invisible until something else on the page is animating:
 *
 * **`scrollIntoView` scrolls every scrollable ancestor, up to and including
 * the viewport** — and performing a scroll on a scrolling box aborts any
 * smooth scroll already running on it, whether or not the new position
 * differs from the current one. Two of those three lists are driven by
 * `useScrollSpy`, so their current row changes WHILE the page is scrolling;
 * a keyboard reference step (`Shortcuts.svelte`) asks for a smooth scroll,
 * crosses one section boundary on the way, and the sidebar's own bookkeeping
 * cancels the animation underneath it. What the reader sees is a scroll that
 * starts gliding and then stops dead, which reads as the site being janky
 * rather than as anything to do with a table of contents.
 *
 * Setting one container's `scrollTop` cannot move the page. That is the whole
 * of the fix, and the reason both callers say so in their own words: the
 * feedback loop (a spy that moves the window it is measuring) was already
 * understood — see `IndexSidebarToc`, which avoided it from the start — and
 * this module is what stops the third list from having to rediscover it.
 *
 * `TocMenu` centres rather than nudges and keeps its own arithmetic: it runs
 * once, on a box that has just rendered scrolled to the top, where `nearest`
 * would pin the row to the bottom edge with nothing below it.
 */

/** The two edges of a box on the block axis, as `getBoundingClientRect` gives
 *  them. A pair of numbers rather than the elements, so the arithmetic is
 *  testable in the `node` environment the suite runs in. */
export interface BlockEdges {
	top: number;
	bottom: number;
}

/**
 * How far `box` must scroll to bring `row` inside it — `0` when the row is
 * already fully visible, which is the common case and the one that must cost
 * nothing.
 *
 * `nearest` semantics: a row above the top edge comes to the top, a row below
 * the bottom edge comes to the bottom, and a row taller than the box is
 * aligned to its top rather than being chased in both directions (the first
 * branch wins, and it is the row's beginning the reader wants).
 */
export function nearestScrollDelta(row: BlockEdges, box: BlockEdges): number {
	if (row.top < box.top) return row.top - box.top;
	if (row.bottom > box.bottom) return row.bottom - box.bottom;
	return 0;
}

/**
 * The nearest ancestor that actually scrolls, or `null` if the row's only
 * scrollport is the page itself.
 *
 * MEASURED RATHER THAN NAMED BY CLASS, because `StructureSidebarToc` renders
 * in three places — `.reading-aside`, the reading bar's `.sheet-body` panel,
 * and `/documenta`'s narrow-screen `.toc-inline` — and a list of selectors
 * here would be a fourth place to keep in step with the markup. The walk ends
 * at `<html>`, whose `overflow-y` is `visible`, so this never answers with the
 * viewport: returning `null` and doing nothing is the correct failure, since
 * moving the page is the one thing this file exists to prevent.
 *
 * THE FIRST SCROLLPORT WINS WHETHER OR NOT IT IS CURRENTLY OVERFLOWING. Asking
 * for `scrollHeight > clientHeight` as well would be the tempting extra test
 * and it is the dangerous one: a list short enough to fit its own aside would
 * fall THROUGH that aside and hand back whatever scrolls further out. A box
 * that cannot scroll clamps `scrollTop` to 0 by itself, so the loose test
 * costs nothing and the strict one costs the guarantee.
 */
export function scrollingAncestor(el: HTMLElement): HTMLElement | null {
	for (let node = el.parentElement; node; node = node.parentElement) {
		const overflowY = getComputedStyle(node).overflowY;
		if (overflowY === 'auto' || overflowY === 'scroll') return node;
	}
	return null;
}

/** Nudge `row` into view within the box it scrolls in, and nowhere else. */
export function revealRow(row: HTMLElement): void {
	const box = scrollingAncestor(row);
	if (!box) return;
	box.scrollTop += nearestScrollDelta(row.getBoundingClientRect(), box.getBoundingClientRect());
}
