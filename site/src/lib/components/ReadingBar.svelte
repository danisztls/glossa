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

	ONE FLAT ROW, IN A FIXED ORDER: bookmark, print, edition, compare, second
	edition. The two page-level buttons come first and the text-level controls
	follow, so the row runs from what is being read to how it is being read.
	They deliberately share one container rather than being split into a
	page-tools group and an editions group pinned to opposite ends — the split
	made the bar read as two bars, and put the widest, most-changed control (an
	edition name that can be "Bíblia Sagrada (Matos Soares)") at the end of a
	line whose left half was empty.

	THE TOGGLE SITS BETWEEN THE TWO EDITIONS, and that placement is the point:
	it is the control that put the second one there, so it reads as the seam
	between them rather than as one more button in a row. Left to right that
	part of the row says "this edition, compared with, that edition" — the same
	order the two columns appear in beneath.

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
	<BookmarkButton href={bookmarkHref} />
	<PrintButton />
	<EditionMenu />
	{#if canCompare}
		<CompareToggle active={compareActive} onclick={onToggleCompare} {enterLabel} {exitLabel} />
	{/if}
	{#if compareActive && comparison}
		{@render comparison()}
	{/if}
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
</style>
