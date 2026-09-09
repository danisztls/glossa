<script lang="ts">
	/**
	 * The search field over `/quaestiones`, and the count of what it kept.
	 *
	 * A COMPONENT BECAUSE IT IS RENDERED TWICE, which is the cost of putting a
	 * control in the aside: `.index-aside` is `display: none` below 80rem
	 * (styles/layout.css), so the field there would be desktop-only, and search
	 * is the one affordance a phone reader most needs on a list of a hundred
	 * questions. `/documenta` pays the same duplication for `DocumentFilters`
	 * and for the same reason. Both copies bind one `$state` in the route, so
	 * there is one query and never two.
	 *
	 * THE COUNT LIVES HERE AND NOT IN THE ROUTE because it belongs to the
	 * field: it is the field's answer, and separating them would put the
	 * number in the aside while the box the reader typed into is above the
	 * list, or the reverse.
	 */
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** Bound to the route's own `$state`, so both copies read and write the
		    same query — see the component docblock on why there are two. */
		query: string;
		/** How many topics survive the query, and how many there are. Shown
		    only while a query is active; the route computes both because it
		    owns the match. */
		matched: number;
		total: number;
	}

	let { query = $bindable(), matched, total }: Props = $props();

	const searching = $derived(query.trim() !== '');
</script>

<!-- `type="search"` for the clear affordance browsers give it; the accessible
     name is an `aria-label` because a visible label would only repeat the
     placeholder. -->
<div class="topic-search-band">
	<input
		type="search"
		class="topic-search"
		bind:value={query}
		placeholder={t('quaestiones.search.label')}
		aria-label={t('quaestiones.search.label')}
	/>
	<!-- Announced only while it means something: with no query the count would
	     read "116 / 116" beside a page showing all of them. `aria-live` so a
	     screen reader hears the list shrink, which is otherwise a silent change
	     to content far below. The paragraph holds its space either way, or the
	     rows under it would move on the first keystroke. -->
	<p class="topic-search-count" aria-live="polite">
		{#if searching}
			<span class="visually-hidden">{t('quaestiones.search.label')}: </span>{matched} / {total}
		{/if}
	</p>
</div>

<style>
	/*
	 * A COLUMN IN THE ASIDE AND A ROW ABOVE THE LIST, decided by the space
	 * rather than by which copy this is: the aside is 21.5rem, where a field
	 * and a count side by side leave the field too narrow to read a query in,
	 * and the inline copy has the whole measure. `container` would be the
	 * precise instrument; this is a flex-wrap, which gets the same two
	 * outcomes with no container to declare.
	 */
	.topic-search-band {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.75rem;
		/* The gap below the field is the band's padding rather than a margin,
		   because the aside makes this element sticky and a sticky element's
		   margin is transparent — the list would scroll through it. Same
		   reasoning `DocumentFilters` records for `.doc-search-band`. */
		padding-block-end: 1rem;
	}

	/* The four declarations every bordered text field on this site agrees on
	   — `JumpBox`, `.menu-filter` and `.doc-search` are the same. */
	.topic-search {
		flex: 1 1 12rem;
		min-width: 0;
		box-sizing: border-box;
		padding: 0.45rem 0.6rem;
		font: inherit;
		font-size: 0.9rem;
		/* Restated because `font: inherit` above leaves a length, not a ratio
		   — styles/base.css says why. */
		line-height: 1.5;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/*
	 * THE FOCUS INDICATOR IS IN THE BORDER, which is what every bordered text
	 * field on this site does; `DocumentFilters` records the arithmetic. An
	 * offset ring drawn around an already-bordered rounded field stacks into a
	 * double frame. The transparent outline is not decoration: `forced-colors`
	 * repaints an `outline` in the system focus colour, where the halo is
	 * dropped.
	 */
	.topic-search:focus-visible {
		outline: 2px solid transparent;
		outline-offset: 2px;
		border-color: var(--color-apparatus);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-apparatus) 20%, transparent);
	}

	.topic-search-count {
		flex: 0 0 auto;
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
