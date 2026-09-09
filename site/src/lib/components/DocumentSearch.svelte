<script lang="ts">
	/**
	 * The search box over `/documenta`.
	 *
	 * IT READS THE WHOLE OF A DOCUMENT'S METADATA — title, author, kind,
	 * description, tags — and the route ANDs it with the three facets in
	 * `DocumentFilters`. It is the coarse instrument: a reader who knows a word
	 * reaches for it first, and the facets are what they narrow WITH
	 * afterwards, not instead. It also carries the weight the subject facet
	 * used to, since the terms cut from that vocabulary — every region name,
	 * every occasion word — are all still in the descriptions this box reads.
	 *
	 * A COMPONENT OF ITS OWN, AND NOT THE FIRST CONTROL INSIDE THE FACET PANEL,
	 * which is where it lived until the phone layout was looked at. Below 80rem
	 * `.index-aside` is `display: none` (styles/layout.css) and the panel is
	 * rendered inside a `<details>` above the list, closed by default so a
	 * phone reader meets the documents first — which folded the search box away
	 * with it. Being outside that disclosure is the whole point: the coarse
	 * instrument is the one control that must never need opening. `/quaestiones`
	 * makes the same split with `TopicSearch`.
	 *
	 * RENDERED TWICE, once in the aside and once above the list, and both bind
	 * the route's one `$state` — so there is one query and never two, and
	 * `display: none` keeps exactly one of them in the accessibility tree at
	 * any width.
	 */
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** Bound to the route's own `$state`, so both copies read and write the
		    same query — see the component docblock on why there are two. */
		query: string;
	}

	let { query = $bindable() }: Props = $props();
</script>

<!-- `type="search"` for the clear affordance browsers give it; the accessible
     name is an `aria-label` because a visible label would only repeat the
     placeholder. -->
<!-- The band is what the aside makes sticky (`.index-aside
     :global(.doc-search-band)` on the route), so the field stays reachable
     while sixteen authors and twelve kinds scroll under it. The gap below the
     field is the band's padding rather than the field's margin for that reason
     alone: a sticky element's margin is transparent, so a facet row would have
     scrolled through it. -->
<div class="doc-search-band">
	<input
		type="search"
		class="doc-search"
		bind:value={query}
		placeholder={t('document.filter.search')}
		aria-label={t('document.filter.search')}
	/>
</div>

<style>
	.doc-search-band {
		padding-block-end: 1rem;
	}

	/* The interface face, named rather than inherited: this control stands
	   outside the reading column at every width, and it no longer sits inside
	   `.doc-filters`, which used to name it for everything in the panel. */
	.doc-search {
		width: 100%;
		box-sizing: border-box;
		display: block;
		font-family: var(--font-sans);
		/* 0.45rem rather than 0.35 holds the field at the height it had while
		   it was being sized by the body's line box — 2.175rem against 2.2. */
		padding: 0.45rem 0.5rem;
		font-size: 0.85rem;
		/* A ratio, not the length `font: inherit` would have left — styles/base.css
		   says why. */
		line-height: 1.5;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/*
	 * THE FOCUS INDICATOR IS IN THE BORDER, which is what every bordered text
	 * field on this site now does — `JumpBox`'s and `.menu-filter`'s
	 * (styles/menus.css) are the same four declarations, and that one records
	 * the arithmetic. An offset rectangle drawn around an already-bordered
	 * rounded field stacks into a double frame; reddening the border underneath
	 * the global ring made it two frames in two hues, 2px apart.
	 *
	 * WHAT DOES NOT CARRY OVER IS THE AUTOFOCUS ARGUMENT. The other two are
	 * focused the moment their panel opens, so for them the ring is a resting
	 * state; this box is focused by a click, and the ring really would be a
	 * response. The doubling is the half that reaches it, since that is about
	 * the field's own border and not about how focus arrived.
	 *
	 * The transparent outline is not decoration: `forced-colors` repaints an
	 * `outline` in the system focus colour, where the halo below is dropped.
	 */
	.doc-search:focus-visible {
		outline: 2px solid transparent;
		outline-offset: 2px;
		border-color: var(--color-apparatus);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-apparatus) 20%, transparent);
	}
</style>
