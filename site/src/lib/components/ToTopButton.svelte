<!--
	The way back to the top of a long page, in the bottom-trailing corner of
	the viewport, once the top has actually gone off screen.

	IT IS GLOBAL, NOT PER-ROUTE. Unlike `PrintButton` — which lives on the
	reading bar because printing is a reading-page act — nothing about this
	control is page-specific: a chapter of Isaiah, the Catechism's index and
	the colophon are all longer than a viewport, and a reader who has scrolled
	one of them wants the same thing from all three. So it is mounted once in
	the root layout beside the other ambient overlays.

	WHY A SCROLL LISTENER RATHER THAN `animation-timeline: scroll()`, which is
	how the header's shrink reads the same scroll position (see
	`+layout.svelte`). Two reasons, both about this being a control rather than
	a decoration:

	  - A control the reader cannot see must not be tabbable, and that is a
	    property of the accessibility tree, not of opacity. `visibility` is the
	    only thing that takes a button out of the tab order while leaving it in
	    the layout to fade, and animating it from a scroll timeline means
	    flipping a discrete property at some arbitrary fraction of a range
	    rather than at a stated scroll offset.
	  - The header's `@supports` fallback is a header that never shrinks, which
	    costs nothing. The fallback here would be a button pinned over the text
	    at the very top of the page, where it is both useless and in the way.

	The threshold is one viewport height: the button appears exactly when the
	top of the page is no longer on screen, which is also when scrolling back
	to it stops being a flick. No hysteresis, deliberately — the button is
	`position: fixed`, so appearing and disappearing moves nothing in flow and
	cannot feed back into the scroll position that summoned it. (That feedback
	is real for the header, which is why it also sets `overflow-anchor: none`.)

	Focus after the jump is left to the browser on purpose. The button hides
	itself on arrival, focus reverts to the body, and the next Tab therefore
	starts from the first control in the header — the top of the page, which is
	where the reader just asked to be.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	let visible = $state(false);

	const label = $derived(t('toTop.label'));

	$effect(() => {
		// rAF-coalesced, passive: the same shape as `scroll-spy.svelte.ts`, and
		// for the same reason — a scroll event per frame at most, and never one
		// that can block the scroll it is reporting on.
		let frame = 0;

		function measure() {
			visible = window.scrollY > window.innerHeight;
		}

		function schedule() {
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				measure();
			});
		}

		// A restored scroll position (back/forward, a reload mid-chapter) is in
		// place before this ever runs, so the first measurement cannot wait for
		// the reader to move.
		measure();
		window.addEventListener('scroll', schedule, { passive: true });
		// Resizing changes the threshold itself, not just the offset compared
		// against it — on a phone that is every time the URL bar collapses.
		window.addEventListener('resize', schedule, { passive: true });

		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
		};
	});

	function toTop() {
		// `scroll-behavior` is not set globally, so the smoothness is asked for
		// here — and withdrawn for a reader who has asked their system for less
		// motion, since a full page-height glide is exactly the kind of travel
		// that setting is about.
		const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
	}
</script>

<!--
	`.menu-trigger` (app.css) carries the whole appearance — the 2.25rem square,
	the border, the elevated background, the hover — exactly as it does for the
	header's controls and for `PrintButton`. This component's own style adds
	only what is peculiar to it: where it sits, and whether it is there at all.
-->
<button
	type="button"
	class="menu-trigger to-top"
	class:visible
	aria-label={label}
	title={label}
	onclick={toTop}
>
	<Icon name="arrow-up" />
</button>

<style>
	.to-top {
		position: fixed;
		/* Logical, so the corner follows the interface's own direction: the
		   bottom-right for the thirteen left-to-right interfaces, the
		   bottom-left in Arabic. The whole stylesheet is written this way (see
		   CLAUDE.md) and a reader in an RTL interface expects the trailing
		   corner, not the English one. */
		inset-inline-end: 1rem;
		/* The iPhone home indicator sits in the bottom inset, which is exactly
		   where a 2.25rem target 1rem off the edge would land — `InstallHint`
		   pads for the same reason. */
		bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		/* Below `InstallHint`'s bar (40), which shares this edge and is a
		   sentence rather than a glyph, and below every panel the reader opens
		   on purpose — `.menu-panel` (50), the link preview (70), the jump
		   box's suggestions (100). This is the most ambient control on the
		   page: it yields to all of them. */
		z-index: 35;
		/* The one thing `.menu-trigger` cannot give it: those buttons sit on the
		   header's own background, while this one is over running text, so it
		   needs to read as lifted off the page rather than set into it.
		   DELIBERATELY NOT `UpdateBanner`/`InstallHint`'s `0 2px 14px / 0.1`:
		   that shadow is scaled to a bar the width of the window, and under a
		   2.25rem square it spreads well past the button's own edges and reads
		   as a smudge. Tight and faint is all this needs — enough to separate
		   the border from the text behind it, not enough to notice. */
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.08);
		/* Hidden state. `visibility` is what takes it out of the tab order and
		   the accessibility tree; the delayed transition on it is what lets the
		   opacity fade finish before it goes. */
		opacity: 0;
		visibility: hidden;
		transform: translateY(0.4rem);
		transition:
			opacity 0.18s ease,
			transform 0.18s ease,
			visibility 0s linear 0.18s;
	}

	.to-top.visible {
		opacity: 1;
		visibility: visible;
		transform: none;
		transition:
			opacity 0.18s ease,
			transform 0.18s ease,
			visibility 0s;
	}

	@media (prefers-reduced-motion: reduce) {
		.to-top,
		.to-top.visible {
			transform: none;
			transition: none;
		}
	}
</style>
