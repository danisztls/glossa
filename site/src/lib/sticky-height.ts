/**
 * Publishes a sticky element's measured height as a CSS variable on <html>,
 * for the things that have to be laid out against a height nobody can
 * declare: `html`'s `scroll-padding-top` and the two sticky sidebars
 * (app.css), which all inset themselves by the chrome above them.
 *
 * `ReadingBar` is the only caller. The site header was the other, publishing
 * a height this one used to stick below; it is in flow now
 * (`routes/+layout.svelte`), which is why nothing sums two variables any
 * more.
 *
 * MEASURED ONCE SYNCHRONOUSLY, THEN OBSERVED. That first write is not an
 * optimisation, it is the whole correctness of anchor navigation. SvelteKit
 * deep-links by awaiting two `tick()`s and then calling `scrollIntoView()`
 * (its client runtime, `scroll` handling in `navigate`), so the effect that
 * calls this HAS run by the time it scrolls — but a `ResizeObserver`'s first
 * callback has NOT: that is delivered at the next layout, one frame after the
 * scroll has already happened. An observer-only version therefore had every
 * `#s{n}` land one reading bar too high, behind the very chrome the
 * scroll-padding exists to clear, and looked correct on any subsequent jump
 * within the same page.
 *
 * The teardown removes the variable rather than leaving its last value, so a
 * route rendering no such element falls back to the `0px` in that `calc`
 * instead of inheriting the height of whatever the reader was on before.
 */
export function publishHeight(el: HTMLElement, property: string): () => void {
	const write = (px: number) => document.documentElement.style.setProperty(property, `${px}px`);

	// Border-box, to agree with the `borderBoxSize` the observer reports below —
	// these two write the same variable and must not disagree about what they
	// are measuring.
	write(el.getBoundingClientRect().height);

	const observer = new ResizeObserver(([entry]) => {
		write(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
	});
	observer.observe(el);

	return () => {
		observer.disconnect();
		document.documentElement.style.removeProperty(property);
	};
}
