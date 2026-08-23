<!--
	The reading page's own control bar: which edition, whether to compare it
	with another, and the two things a reader does with the page itself (save
	it, print it). Sticky, so all four stay reachable at any depth in a text
	that can run to 287 sections.

	IT EXISTS IN BOTH MODES, WHICH IS WHY IT IS NOT PART OF `CompareGrid`.
	These controls used to be scattered across three places that each existed
	in only one of them: the edition picker sat next to the `<h1>` while
	reading normally and inside the compare header while comparing, the
	bookmark and compare toggle sat in the breadcrumb row, and print sat in the
	site header. A reader turning comparison on watched three controls move.
	Gathering them here means the bar is the same object before and after —
	only the comparison picker appears, next to the toggle that summoned it.

	THE TOGGLE SITS BETWEEN THE TWO EDITIONS, and that placement is the point:
	it is the control that put the second one there, so it reads as the seam
	between them rather than as one more button in a row. Left to right the
	group says "this edition, compared with, that edition" — which is also what
	identifies the two columns beneath, since they appear in the same order.

	`comparison` is a snippet rather than a `ComparisonEditionMenu` of this
	component's own making because the routes genuinely differ in what belongs
	there: the Bible passes `editionStyle` (it is the one work that can carry
	two editions in the same language, so its picker names editions rather than
	languages), and `/preces` has no picker at all — its second column is a
	Latin FIELD on the one work, not a second edition, so it passes a plain
	label and that is the only identification that column gets.

	Sticks BELOW the site header, not at the viewport top, using
	`--site-header-height` — published by `+layout.svelte` from a
	ResizeObserver, since that header's height is scroll-animated and wraps at
	phone width. The `0px` fallback covers the first frame before the observer
	has fired.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import EditionMenu from './EditionMenu.svelte';
	import CompareToggle from './CompareToggle.svelte';
	import BookmarkButton from './BookmarkButton.svelte';
	import PrintButton from './PrintButton.svelte';

	interface Props {
		/** The page's own canonical address, for the bookmark. */
		bookmarkHref: string;
		/** Whether there is a second edition (or, on `/preces`, a Latin text) to
		 *  compare against at all. False hides the toggle outright rather than
		 *  disabling it — the same "hide, don't disable" posture `EditionMenu`
		 *  and `CompareToggle` already take. */
		canCompare: boolean;
		compareActive: boolean;
		onToggleCompare: () => void;
		/** What identifies the second column: a picker on five routes, a plain
		 *  label on `/preces`. Rendered only while comparing. */
		comparison?: Snippet;
		/** `/preces` calls it "show/hide Latin" — see `CompareToggle`. */
		enterLabel?: string;
		exitLabel?: string;
	}

	let {
		bookmarkHref,
		canCompare,
		compareActive,
		onToggleCompare,
		comparison,
		enterLabel,
		exitLabel
	}: Props = $props();
</script>

<div class="reading-bar">
	<div class="reading-bar-editions">
		<EditionMenu />
		{#if canCompare}
			<CompareToggle active={compareActive} onclick={onToggleCompare} {enterLabel} {exitLabel} />
		{/if}
		{#if compareActive && comparison}
			{@render comparison()}
		{/if}
	</div>
	<div class="reading-bar-tools">
		<BookmarkButton href={bookmarkHref} />
		<PrintButton />
	</div>
</div>

<style>
	/*
	 * Opaque background because reading text scrolls under it. z-index 40 is
	 * `.site-header`'s — the two never overlap, since this one starts where
	 * that one ends — and below `.menu-panel`'s 50, so a picker opened FROM
	 * this bar still draws over it.
	 */
	.reading-bar {
		position: sticky;
		top: var(--site-header-height, 0px);
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		background: var(--color-bg);
		border-block-end: 1px solid var(--color-border);
		padding-block: 0.5rem;
		margin-block-end: 1.25rem;
	}

	.reading-bar-editions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		min-width: 0;
	}

	/* Page-level, not edition-level, so they pin to the far end rather than
	   joining the group on the left — the top-right corner is where the
	   bookmark button already lived, and where print lived before that in the
	   site header. */
	.reading-bar-tools {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-inline-start: auto;
	}
</style>
