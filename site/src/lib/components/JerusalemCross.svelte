<!--
	The Jerusalem Cross: a cross potent with a crosslet in each quadrant.

	NOT DRAWN HERE. The geometry is Wikimedia Commons'
	`Cross-Jerusalem-Potent-Heraldry.svg`, by AnonMoos and Melian, which is
	**public domain** — checked against the Commons API before it was copied,
	which reports `AttributionRequired: false` and no restrictions. It is kept
	anyway, because on this site of all sites the provenance of someone else's
	work is recorded whether or not a licence compels it.

	Three of our own attempts preceded it and all three are gone: a solid cross
	potent built from overlapping rectangles, the same shape as a traced
	outline, and five plain crossed lines. The heraldry has a settled form and
	somebody had already drawn it correctly; the arm proportions here are that
	drawing's, not a guess of ours.

	INLINE SVG AND NOT AN `<img>`, and that is forced rather than chosen.
	`<html>` carries four independent theme axes — `data-theme`, `data-sepia`,
	`data-oled`, `data-mono` (see `styles/tokens.css`). An `<img src="...svg">`
	is a separate document and can see none of them; the most it could do is
	read `prefers-color-scheme`, which covers one axis and gets
	`data-theme='light'` on a dark-preferring OS exactly backwards — the trap
	tokens.css records where it explains why the palette follows the attribute
	rather than the media query. Drawn inline, `fill: currentColor` follows all
	four for free, and there is no request to make.

	A MARK, NOT AN ICON, so it is its own file rather than an entry in
	`Icon.svelte`'s map: that component's docblock states it is the only file
	importing `@lucide/svelte`, so that changing icon library is a one-file
	change, and a hand-placed glyph in its `ICONS` would quietly falsify it.
	`Wordmark.svelte` is the precedent.

	WHAT MAY NOT BE ADDED: no crown, no motto ring, no red-on-white in the
	Equestrian Order of the Holy Sepulchre's arrangement. The bare cross is a
	public Christian symbol older than either that Order or the Custody of the
	Holy Land, and the line beside it in the footer states that this site is
	endorsed by nobody; a mark drifting toward a specific body's ARMS would
	contradict the sentence next to it.

	Decorative, so `aria-hidden` and no `<title>` — the source's own title
	element is dropped for that reason. The lines beside it carry every word
	this says. Sized in `em` off whatever sets its font-size, the same rule
	`Icon.svelte` applies to every glyph.
-->

<script lang="ts">
	let { class: className }: { class?: string } = $props();

	/**
	 * ONE ARM OF THE CROSS POTENT, as an I-beam: the bar across the top, the
	 * shaft, the bar across the bottom. Two of these at right angles are the
	 * whole central cross — which is why there is no separate "bar" geometry
	 * and no perimeter to trace. Verbatim from the source drawing.
	 */
	const ARM = 'M195,20h170v35h-55v450h55v35H195v-35h55V55h-55z';

	/**
	 * One crosslet, centred at (152.5, 152.5) in the top-left quadrant: two
	 * overlapping bars, wound the same way so `fill-rule: nonzero` unions them
	 * exactly as the source's two `<rect>`s did.
	 */
	const CROSSLET = 'M135,95h35v115h-35z M95,135h115v35h-115z';

	/**
	 * The figure is four-fold symmetric about (280, 280), so the arm is drawn
	 * at two rotations and the crosslet at four. The source expressed this with
	 * `<use xlink:href>` into two `id`s; rotations are the same picture without
	 * putting ids in a component — two of these on one page would be duplicate
	 * ids in the document, and `xlink:href` is deprecated besides.
	 */
	const ARM_TURNS = [0, 90] as const;
	const CROSSLET_TURNS = [0, 90, 180, 270] as const;
	const PIVOT = '280 280';
</script>

<svg
	viewBox="0 0 560 560"
	width="1em"
	height="1em"
	fill="currentColor"
	aria-hidden="true"
	class={className}
>
	{#each ARM_TURNS as deg (deg)}
		<path d={ARM} transform="rotate({deg} {PIVOT})" />
	{/each}
	{#each CROSSLET_TURNS as deg (deg)}
		<path d={CROSSLET} transform="rotate({deg} {PIVOT})" />
	{/each}
</svg>
