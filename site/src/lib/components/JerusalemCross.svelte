<!--
	The Jerusalem Cross: a cross potent with a crosslet in each quadrant.

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
	rather than the media query. Drawn inline, `fill: currentColor` follows all
	four for free, and there is no request to make.

	DRAW THE PLAIN FIVE-CROSS FIGURE AND NOTHING ELSE. No crown, no motto ring,
	no red-on-white in the Equestrian Order of the Holy Sepulchre's arrangement.
	The bare cross is a public Christian symbol older than either that Order or
	the Custody of the Holy Land, and the footer beside it states that this site
	is endorsed by nobody; a mark drifting toward a specific body's ARMS would
	contradict the sentence it sits next to. Making it look "more official" is
	therefore a decision someone has to take deliberately, not a tidy-up.

	Decorative, so `aria-hidden` and no `<title>`: the motto and the standing
	statement beside it carry every word this says. Sized in `em` off whatever
	sets its font-size, the same rule `Icon.svelte` applies to every glyph.
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
</script>

<!--
	A 64-unit field centred on (32, 32). Rectangles rather than one computed
	outline: the parts overlap and a fill unions them, so the geometry stays
	numbers a person can read and correct instead of a path nobody will touch.

	  central arms  8 units thick, spanning 14..50
	  potent bars   8 thick, 18 long, capping each arm
	  crosslet      5 thick, 13 long, centred at (10.5, 10.5) before translation

	The figure spans 4..60 in both axes, so it carries its own margin inside the
	viewBox and needs no padding from whatever places it.

	THE PROPORTIONS WERE RASTERIZED, NOT ESTIMATED. A first pass drew a thinner
	central cross with the crosslets at (11, 11); that is a correct Jerusalem
	Cross and it reads badly — the crosslets hug the corners of the field and
	leave a wide diagonal void, and their thinner arms close up at the ~36px the
	footer actually sets this at. The numbers above leave a clean six-unit gap
	on both axes between each crosslet and the arm beside it. Re-render before
	changing any of them.
-->
<svg
	viewBox="0 0 64 64"
	width="1em"
	height="1em"
	fill="currentColor"
	aria-hidden="true"
	class={className}
>
	<!-- The cross potent: two arms, then the bar across the end of each. -->
	<rect x="28" y="14" width="8" height="36" />
	<rect x="14" y="28" width="36" height="8" />
	<rect x="23" y="14" width="18" height="8" />
	<rect x="23" y="42" width="18" height="8" />
	<rect x="14" y="23" width="8" height="18" />
	<rect x="42" y="23" width="8" height="18" />

	{#each QUADRANTS as [dx, dy] (`${dx},${dy}`)}
		<g transform="translate({dx} {dy})">
			<rect x="8" y="4" width="5" height="13" />
			<rect x="4" y="8" width="13" height="5" />
		</g>
	{/each}
</svg>
