<!--
	The Jerusalem Cross: a cross potent with a crosslet in each quadrant, drawn
	as an outline.

	A MARK, NOT AN ICON, which is why it is its own file rather than an entry in
	`Icon.svelte`'s map. That component's docblock states it is the only file in
	the app importing `@lucide/svelte`, so that changing icon library is a
	one-file change; a hand-drawn glyph living in its `ICONS` would quietly
	falsify that. `Wordmark.svelte` is the precedent — live geometry, not an
	asset. Lucide has no Jerusalem Cross in any case.

	INLINE SVG AND NOT AN `<img>`, and that is forced rather than chosen.
	`<html>` carries four independent theme axes — `data-theme`, `data-sepia`,
	`data-oled`, `data-mono` (see `styles/tokens.css`). An `<img src="...svg">`
	is a separate document and can see none of them; the most it could do is
	read `prefers-color-scheme`, which covers one axis and gets
	`data-theme='light'` on a dark-preferring OS exactly backwards — the trap
	tokens.css records where it explains why the palette follows the attribute
	rather than the media query. Drawn inline, `currentColor` follows all four
	for free, and there is no request to make.

	DRAW THE PLAIN FIVE-CROSS FIGURE AND NOTHING ELSE. No crown, no motto ring,
	no red-on-white in the Equestrian Order of the Holy Sepulchre's arrangement.
	The bare cross is a public Christian symbol older than either that Order or
	the Custody of the Holy Land, and the footer beside it states that this site
	is endorsed by nobody; a mark drifting toward a specific body's ARMS would
	contradict the sentence it sits next to. Making it look "more official" is
	therefore a decision someone has to take deliberately, not a tidy-up.

	Decorative, so `aria-hidden` and no `<title>`: the lines beside it carry
	every word this says. Sized in `em` off whatever sets its font-size, the
	same rule `Icon.svelte` applies to every glyph.
-->

<script lang="ts">
	let { class: className }: { class?: string } = $props();

	/**
	 * Where the four crosslets go. The shape is drawn ONCE below and placed
	 * four times, so the quadrants cannot drift apart into four sets of
	 * numbers that need keeping in step.
	 *
	 * 43 = 64 - 2 * 10.5, the offset that puts the mirrored crosslet's centre
	 * at 53.5 where the first sits at 10.5 — symmetric about the field's
	 * midline at 32, which is what makes the figure balance. Change the
	 * crosslet's geometry below and this number is wrong; recompute it from
	 * its centre rather than nudging it.
	 */
	const QUADRANTS = [
		[0, 0],
		[43, 0],
		[0, 43],
		[43, 43]
	] as const;

	/**
	 * THE PERIMETER OF THE CROSS POTENT, TRACED CLOCKWISE FROM THE TOP BAR'S
	 * LEFT CORNER — and it has to be a perimeter rather than the six
	 * overlapping rectangles this was built from first. Those unioned cleanly
	 * under a `fill`; STROKED, every internal edge draws, and the mark comes
	 * out as a lattice of boxes instead of a cross. There is no way to stroke
	 * an outline you have not actually computed.
	 *
	 * Read it against the shape it encloses: arms 8 units thick spanning
	 * 14..50, each capped by a bar 8 thick and 18 long, on a 64-unit field
	 * centred at (32, 32). Every turn below is one of those edges meeting the
	 * next, so a wrong number shows up as a notch rather than as anything
	 * subtle.
	 */
	const POTENT =
		'M23 14 H41 V22 H36 V28 H42 V23 H50 V41 H42 V36 H36 V42 H41 V50 ' +
		'H23 V42 H28 V36 H22 V41 H14 V23 H22 V28 H28 V22 H23 Z';

	/** One crosslet: a Greek cross 5 thick and 13 long, centred at (10.5, 10.5). */
	const CROSSLET = 'M8 4 H13 V8 H17 V13 H13 V17 H8 V13 H4 V8 H8 Z';
</script>

<!--
	`stroke-linejoin: miter` (the default, named anyway because it is a choice):
	round joins pull every corner of the crosslets into a blob at the size this
	is actually set. `stroke-width: 3` was picked by rasterizing at the footer's
	~36px, not by eye at full size — 2.5 goes spindly there and 3.5 begins to
	close the crosslets' counters. Re-render before changing it.

	The stroke is centred on the path, so the figure spans 2.5..61.5 rather than
	the geometry's 4..60, and still carries its own margin inside the viewBox.
-->
<svg
	viewBox="0 0 64 64"
	width="1em"
	height="1em"
	fill="none"
	stroke="currentColor"
	stroke-width="3"
	stroke-linejoin="miter"
	aria-hidden="true"
	class={className}
>
	<path d={POTENT} />
	{#each QUADRANTS as [dx, dy] (`${dx},${dy}`)}
		<path d={CROSSLET} transform="translate({dx} {dy})" />
	{/each}
</svg>
