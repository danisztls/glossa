<!--
	The Jerusalem Cross: one cross with a smaller cross in each quadrant, drawn
	as plain crossed lines.

	A MARK, NOT AN ICON, which is why it is its own file rather than an entry in
	`Icon.svelte`'s map. That component's docblock states it is the only file in
	the app importing `@lucide/svelte`, so that changing icon library is a
	one-file change; a hand-drawn glyph living in its `ICONS` would quietly
	falsify that. `Wordmark.svelte` is the precedent — live geometry, not an
	asset.

	INLINE SVG AND NOT AN `<img>`, and that is forced rather than chosen.
	`<html>` carries four independent theme axes — `data-theme`, `data-sepia`,
	`data-oled`, `data-mono` (see `styles/tokens.css`). An `<img src="...svg">`
	is a separate document and can see none of them; the most it could do is
	read `prefers-color-scheme`, which covers one axis and gets
	`data-theme='light'` on a dark-preferring OS exactly backwards — the trap
	tokens.css records where it explains why the palette follows the attribute
	rather than the media query. Drawn inline, `currentColor` follows all four
	for free, and there is no request to make.

	THE ARMS ARE PLAIN, AND THAT IS A SIMPLIFICATION RATHER THAN AN OVERSIGHT.
	Heraldically a Jerusalem Cross is a cross POTENT — each arm capped by a bar
	— and this was drawn that way twice, first as a solid fill and then as a
	traced outline. Both were correct and both were busy: at the ~36px the
	footer sets this at, the potent bars and their counters close into texture.
	Five plain crosses keep the arrangement, which is what identifies the mark,
	and drop the detail that only survives at display size.

	And that is also the whole rule about what may be added back. NO CROWN, NO
	MOTTO RING, NO RED-ON-WHITE in the Equestrian Order of the Holy Sepulchre's
	arrangement. The bare cross is a public Christian symbol older than either
	that Order or the Custody of the Holy Land, and the line beside it in the
	footer states that this site is endorsed by nobody; a mark drifting toward a
	specific body's ARMS would contradict the sentence next to it. Making this
	look "more official" is a decision someone has to take deliberately.

	Decorative, so `aria-hidden` and no `<title>`: the lines beside it carry
	every word this says. Sized in `em` off whatever sets its font-size, the
	same rule `Icon.svelte` applies to every glyph.
-->

<script lang="ts">
	let { class: className }: { class?: string } = $props();

	/**
	 * A 64-unit field centred on (32, 32). Each cross is ONE path of two
	 * subpaths — the `M` in the middle starts a second line rather than
	 * continuing the first, so nothing is drawn between them.
	 *
	 * The centre's arms run 14..50, the crosslets' 9..23 about (16, 16), which
	 * leaves NINE units of clearance on every side of every crosslet: to the
	 * central arm beside it, and to the edge of the field. That evenness is
	 * what the numbers are for; move one and the quadrant it sits in stops
	 * matching the other three.
	 */
	const CENTRE = 'M32 14 V50 M14 32 H50';
	const CROSSLET = 'M16 9 V23 M9 16 H23';

	/**
	 * 32 = 64 - 2 * 16, the offset that mirrors a crosslet centred at 16 to one
	 * centred at 48 — symmetric about the field's midline. Recompute it from
	 * the crosslet's centre if that ever moves; do not nudge it.
	 */
	const QUADRANTS = [
		[0, 0],
		[32, 0],
		[0, 32],
		[32, 32]
	] as const;
</script>

<!--
	`stroke-width: 3` was picked by rasterizing at the footer's ~36px rather
	than by eye at display size: 2.5 goes spindly there and 4 thickens the
	crosslets into blocks. Re-render before changing it.
-->
<svg
	viewBox="0 0 64 64"
	width="1em"
	height="1em"
	fill="none"
	stroke="currentColor"
	stroke-width="3"
	aria-hidden="true"
	class={className}
>
	<path d={CENTRE} />
	{#each QUADRANTS as [dx, dy] (`${dx},${dy}`)}
		<path d={CROSSLET} transform="translate({dx} {dy})" />
	{/each}
</svg>
