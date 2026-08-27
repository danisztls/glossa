<!--
	The reading page's own control bar: which edition, whether to compare it
	with another, and the things a reader does with the page itself (save it,
	print it, and — on scripture — roll for another verse). Sticky, so they
	stay reachable at any depth in a text that can run to 287 sections.

	IT EXISTS IN BOTH MODES, WHICH IS WHY IT IS NOT PART OF `CompareGrid`.
	These controls used to be scattered across three places that each existed
	in only one of them: the edition picker sat next to the `<h1>` while
	reading normally and inside the compare header while comparing, the
	bookmark and compare toggle sat in the breadcrumb row, and print sat in the
	site header. A reader turning comparison on watched three controls move.
	Gathering them here means the bar is the same object before and after —
	only the comparison picker appears, next to the toggle that summoned it.

	ONE FLAT ROW, IN A FIXED ORDER: bookmark, print, roll, edition, compare,
	second edition. The page-level buttons come first and the text-level
	controls follow, so the row runs from what is being read to how it is
	being read. The roll joins the first group and sits last in it: it is the
	only one of the three that leaves the page, and the only one not every
	route renders (see `randomVerse` below), so putting it at that group's
	edge keeps bookmark and print in the same place whether or not it is
	there.
	Evenly spaced throughout — the three edition controls share a wrapper, but
	only so they wrap as a unit (see `.reading-bar-editions`), not to set them
	apart. An earlier version DID pin them to opposite ends of the bar; that
	made it read as two bars, and put the widest, most-changed control (an
	edition name that can be "Bíblia Sagrada (Matos Soares)") at the end of a
	line whose left half was empty.

	The row as a whole is packed against the inline END of the measure, which
	is where the site header keeps its own controls — the two bands of chrome
	line up on one edge rather than each starting from a different side. That
	is alignment of the group, not separation within it; see the
	`justify-content` comment on `.reading-bar` below.

	THE TOGGLE SITS BETWEEN THE TWO EDITIONS, and that placement is the point:
	it is the control that put the second one there, so it reads as the seam
	between them rather than as one more button in a row. Left to right that
	part of the row says "this edition, compared with, that edition" — the same
	order the two columns appear in beneath.

	`comparison` USED TO BE A SNIPPET, on the argument that the routes differed
	in what belonged there: the Bible passes `editionStyle`, and `/preces`
	"builds its own option list, mixing this prayer's sibling languages with
	its Latin FIELD — which is not a work and has no manifest of its own".
	The second half of that stopped being true when Latin became a real prayer
	edition (docs/decisions.md §Addresses and editions) and `/preces` started passing
	ordinary manifests like everyone else; the first half was always just a
	boolean. What was left was eight copies of one `ComparisonEditionMenu`
	call differing only in where the array came from, so the bar builds it.

	THE INDEX ROUTES CARRY THE SAME BAR WITH MOST OF IT ABSENT. `/scriptura`,
	`/catechismus`, `/compendium` and `/summa` are tables of contents, and the
	one control in this row that still means something there is the edition
	picker: which edition a reader is browsing decides which book list, which
	chapter titles and which parts they see (the Summa has four under Latin
	and five under English), and before this it could only be changed by
	opening a text first. The rest drops out — an index page has no unit to
	bookmark, and `PrintButton`'s own docblock is the argument against
	printing one — so `bookmarkHref` and `print` are optional and those pages
	pass neither. Scripture keeps the roll, which is a page-level action on a
	page that IS scripture: from `/scriptura` it is the one entry point that
	needs no decision, next to a book list asking for eighty of them.

	Sticks at the viewport top, and is the ONLY chrome that stays there. It used
	to sit below the site header, offset by that header's measured height
	(`--site-header-height`); the header is in flow now — see `+layout.svelte`
	for why — so everything above this bar has scrolled past by the time it
	reaches the top edge, and there is nothing left to offset against. It still
	publishes its OWN height, which `scroll-padding-top` and the two sticky
	sidebars are laid out against; see the effect below.
-->
<script lang="ts">
	import EditionMenu from './EditionMenu.svelte';
	import ComparisonEditionMenu from './ComparisonEditionMenu.svelte';
	import type { WorkManifest } from '$lib/types';
	import CompareToggle from './CompareToggle.svelte';
	import BookmarkButton from './BookmarkButton.svelte';
	import PrintButton from './PrintButton.svelte';
	import RandomVerseButton from './RandomVerseButton.svelte';
	import { publishHeight } from '$lib/sticky-height';

	/** What the second column shows, and how the reader changes it. The
	 *  caller supplies the list because only it knows which editions this
	 *  address actually has text for — see each route's `others`. */
	export interface ComparisonPicker {
		editions: WorkManifest[];
		/** The work id currently in the second column, if any. */
		current: string | undefined;
		onselect: (workId: string) => void;
		/** Name editions rather than languages. The Bible only: it is the one
		 *  work that can carry two editions in the same language, so its
		 *  picker has something to disambiguate. */
		editionStyle?: boolean;
	}

	interface Props {
		/** The page's own canonical address, for the bookmark. Omitted by the
		 *  index routes: a table of contents is not an address a reader saves,
		 *  and the bookmark list is of passages. */
		bookmarkHref?: string;
		/** Offer the print button. On everywhere a text is being read, and off
		 *  on the index routes for the reason `PrintButton` gives for not
		 *  living in the site header — the print stylesheet is written about
		 *  reading layouts, so on an index the button has nothing
		 *  page-specific to ask for. */
		print?: boolean;
		/** Whether there is anything to compare against at all. False hides the
		 *  toggle outright rather than disabling it — the same "hide, don't
		 *  disable" posture `EditionMenu` and `CompareToggle` already take.
		 *  Defaults to false, which is what an index route wants and what a
		 *  single-edition address passes explicitly. */
		canCompare?: boolean;
		compareActive?: boolean;
		/** Omitted by routes that pass `canCompare: false` and therefore never
		 *  render the toggle — a book introduction (`/scriptura/{book}/0`) has
		 *  no second edition to align against. Required in spirit whenever
		 *  `canCompare` is true; `CompareToggle` is simply not rendered
		 *  otherwise, so there is nothing to call. */
		onToggleCompare?: () => void;
		/** The picker that names and chooses the second column. Rendered only
		 *  while comparing. */
		comparison?: ComparisonPicker;
		/** Offer the random-verse roll beside print. Opt-in, and taken up by
		 *  the scripture routes alone: it opens a Bible verse, which is a
		 *  page-level action where the page IS scripture and a non-sequitur
		 *  in the bar of a Summa article or an encyclical. */
		randomVerse?: boolean;
	}

	let {
		bookmarkHref,
		print = true,
		canCompare = false,
		compareActive = false,
		onToggleCompare,
		comparison,
		randomVerse = false
	}: Props = $props();

	/**
	 * Publish this bar's height as `--reading-bar-height` on <html>, which is
	 * what `app.css`'s `scroll-padding-top` and the two sticky sidebars inset
	 * themselves by. `+layout.svelte` published the site header's the same way
	 * and the two were summed; the header is in flow now, so this is the whole
	 * of the sticky chrome — and, as before, the one only some routes render,
	 * so its variable has to disappear again on the ones that don't. The
	 * helper's teardown does that.
	 *
	 * Measured rather than declared, because the row wraps at phone width and
	 * the edition it names can be as wide as "Bíblia Sagrada (Matos Soares)":
	 * there is no single height to state.
	 */
	let barEl: HTMLElement | undefined = $state();

	$effect(() => {
		const el = barEl;
		if (!el) return;
		return publishHeight(el, '--reading-bar-height');
	});
</script>

<div class="reading-bar" bind:this={barEl}>
	{#if bookmarkHref}
		<BookmarkButton href={bookmarkHref} />
	{/if}
	{#if print}
		<PrintButton />
	{/if}
	{#if randomVerse}
		<RandomVerseButton />
	{/if}
	<div class="reading-bar-editions">
		<EditionMenu />
		{#if canCompare && onToggleCompare}
			<CompareToggle active={compareActive} onclick={onToggleCompare} />
		{/if}
		{#if compareActive && comparison}
			<ComparisonEditionMenu
				editions={comparison.editions}
				current={comparison.current}
				onselect={comparison.onselect}
				editionStyle={comparison.editionStyle}
			/>
		{/if}
	</div>
</div>

<style>
	/*
	 * Opaque background because reading text scrolls under it. z-index 30 lifts
	 * it over the article's own flow and sits below `.menu-panel`'s 50, which
	 * is what lets a picker opened FROM this bar draw over it — that 50 orders
	 * the panel within this bar's own stacking context (sticky + z-index).
	 *
	 * The site header no longer competes for this ordering. It used to carry a
	 * 40 here, above this bar, because a menu opened from it dropped past its
	 * own box and over this bar while both were pinned. In flow it is off
	 * screen by the time this bar is stuck, and its panels are ordered by their
	 * own 50 against an element that is no longer a stacking context.
	 */
	.reading-bar {
		position: sticky;
		top: 0;
		z-index: 30;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		/* Packed against the inline END, under the site header's own controls,
		   which sit there for the same reason (`.controls` in `+layout.svelte`
		   takes the free space with one auto margin). The two rows of chrome
		   then share an edge instead of starting from opposite sides of the
		   measure. `flex-end` rather than a physical value: in a row flex
		   container it already follows `direction`, so the Arabic interface
		   packs against the left without a second rule.

		   NOT `space-between`, which an earlier version used to pin the page
		   controls and the edition controls to opposite ends — see the
		   docblock above for why that read as two bars. The group stays
		   contiguous and evenly spaced; only where it sits changes. */
		justify-content: flex-end;
		background: var(--color-bg);
		border-block-end: 1px solid var(--color-border);
		padding-block: 0.5rem;
		margin-block-end: 1.25rem;
	}

	/*
	 * The three edition controls wrap as ONE THING or not at all. They read as
	 * a sentence — "this edition, compared with, that edition" — and letting
	 * the row break it wherever it ran out of width stranded a lone toggle, or
	 * a lone second edition, on a line of its own, where neither says what it
	 * is. The outer row still wraps, so on a narrow viewport the whole group
	 * drops beneath the bookmark and print buttons intact.
	 *
	 * Same `gap` as the parent: the wrapper is here for the wrap behaviour, not
	 * to set this part of the row apart visually — the bar is still one flat
	 * sequence of evenly spaced controls.
	 */
	.reading-bar-editions {
		display: flex;
		align-items: center;
		flex-wrap: nowrap;
		gap: 0.5rem;
		min-width: 0;
	}
</style>
