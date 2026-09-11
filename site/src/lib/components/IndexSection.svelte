<script lang="ts">
	/**
	 * One folded section of an index — a heading that is the whole toggle, an
	 * optional count beside it, and the rows underneath.
	 *
	 * `/quaestiones` draws one per shelf of questions, `/preces` one per section
	 * of prayers and `/schola` one per catechetical formula, and the first two had
	 * arrived at the same object twice: the
	 * `<details class="fold">`, the `<summary>` with a heading in it, the
	 * heading set in the interface face, the hover that answers on the words
	 * because the words are the only thing in the row, the sticky-chrome
	 * `scroll-margin-top` a fragment needs, and the one row's worth of space
	 * above every heading so a run of them reads as a list of rows rather than
	 * as sections with nothing in them.
	 *
	 * THE ROWS ARE NOT HERE, and that is the seam. One page sets short names in
	 * multicolumn flow, another a grid of title-over-question cells, the third a
	 * numbered list of the Church's own words — different objects, laid out
	 * differently, marked up differently — so the page hands the whole list in as
	 * `children`. What this component owns is the disclosure and its heading; what
	 * a page owns is what is behind it.
	 *
	 * THE RULE IS DRAWN ONLY WHILE THE SECTION IS OPEN, and that is what let
	 * both pages take it (2026-09-11, by direction). `/quaestiones` had argued
	 * against one — sixteen ruled headings down a page are a grid rather than
	 * sixteen landmarks — and that objection was to a rule drawn at rest. Shut,
	 * these draw none: a page of closed sections is a list of headings and the
	 * fold mark is all the structure it has. Open, the rule says what is below
	 * belongs to the heading above it, which is the one thing it is for. On a
	 * shut section it underlined nothing, and a run of them came out as
	 * headings over empty ruled boxes.
	 *
	 * SO THERE IS NO VARIANT AND NO FLAG. The two pages differ in their rows
	 * and in nothing else here.
	 *
	 * The fold's own state is `$lib/fold-state.svelte.ts` — this draws what it
	 * decides and holds none of it.
	 */
	import type { Snippet } from 'svelte';

	interface Props {
		/** The fragment a table of contents and somebody's bookmark address.
		 *  OPTIONAL, because a section is not always addressable: a catechetical
		 *  formula has no key and cannot be given one — the heading is the
		 *  edition's own and the editions disagree about the order (`Formula`,
		 *  types.ts) — so `/schola` draws these with no fragment rather than
		 *  minting an address that names a different list in Italian. */
		id?: string;
		heading: string;
		/** 2 by default, 3 where the sections sit inside a `<section>` that has a
		 *  heading of its own, as `/schola`'s formulas do. Neither the face nor the
		 *  size changes with it: this is the document's outline, not its type
		 *  scale. */
		level?: 2 | 3;
		/** Drawn beside the heading where given. A shut section owes the reader
		 *  a size — a heading with no number is a door into an unknown room —
		 *  and a page whose sections are open by default does not. */
		count?: number;
		open: boolean;
		/** The new state, reported for every toggle including the ones a
		 *  reactive `open` caused; `foldState.remember` is what tells those
		 *  apart from the reader's own. */
		ontoggled: (open: boolean) => void;
		children: Snippet;
	}

	let { id, heading, level = 2, count, open, ontoggled, children }: Props = $props();
</script>

<details
	class="index-section fold"
	{id}
	{open}
	ontoggle={(event) => ontoggled(event.currentTarget.open)}
>
	<summary>
		<svelte:element this={`h${level}`} class="index-heading">{heading}</svelte:element>
		{#if count !== undefined}<span class="chip">{count}</span>{/if}
	</summary>
	{@render children()}
</details>

<style>
	/*
	 * EVERY HEADING SITS THE SAME DISTANCE FROM THE ONE ABOVE IT, open or shut.
	 * The space that separates two rows is what a list of headings is made of,
	 * and it is the only space a heading gets above it — opening a section used
	 * to push its own heading down by two rems, which moved the words the
	 * reader had just clicked and left a hole in the list where they had been
	 * reading.
	 */
	.index-section {
		margin-block: 0.5rem;
		/* Clears the sticky chrome when a fragment lands on this heading —
		   without it the heading sits behind the bar and the reader meets the
		   section's second row first. `scroll-padding-top` on the scroll
		   container is the site's usual instrument; this is the same value
		   applied per target, these being the only fragment targets on either
		   page. */
		scroll-margin-top: calc(var(--sticky-chrome-height) + 1.5rem);
	}

	/* WHAT AN OPEN SECTION ADDS IS UNDERNEATH, and it is for its rows: without
	   it the last row of one section and the heading of the next are a row
	   apart, and the heading reads as one more entry in the list it is closing
	   rather than as the start of the next. A shut section has no rows and owes
	   nothing. */
	.index-section[open] {
		margin-block-end: 2.25rem;
	}

	/* THE WHOLE HEADING ROW IS THE TOGGLE, which is what `<details>` is for.
	   The mark, the marker reset and the coarse-pointer target are `.fold`
	   (styles/components.css) — every disclosure on the site draws the same
	   one. What is here is the row's own height. */
	summary {
		padding-block: 0.15rem;
	}

	/* Only while there is something under the heading for the rule to belong
	   to — see the docblock. */
	.index-section[open] > summary {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
	}

	/* The heading is the only word in the row, so the hover answers on it —
	   the same "this is a control" job `.facet-option`'s ground does in the
	   `/documenta` panel, at a size that does not want a filled band. */
	summary:hover .index-heading,
	summary:focus-visible .index-heading {
		color: var(--color-accent);
	}

	/*
	 * THE SECTION HEADING IS THE PAGE'S STRUCTURE, so it is set as something
	 * to choose between rather than as a label over a list: text colour, not
	 * muted, and no small-caps tracking — that treatment reads as a section
	 * marker.
	 *
	 * The interface face, like `/documenta`'s table-of-contents heading and
	 * the sidebars'. On `/quaestiones` these are our own words for a shelf; on
	 * `/preces` and `/schola` they are the source's, and take this face anyway
	 * because what the reader operates here is the row — CLAUDE.md §Type carries
	 * that exception.
	 */
	.index-heading {
		font-family: var(--font-sans);
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	/* BESIDE THE HEADING AND NOT AT THE ROW'S END. The row is as wide as the
	   column, so an auto margin put the count a thousand pixels from the words
	   it counts — a number floating in the margin of a page it had stopped
	   belonging to. `.chip` is the shared primitive; the figures are this
	   row's own. */
	.chip {
		font-variant-numeric: tabular-nums;
	}
</style>
