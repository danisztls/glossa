<script lang="ts">
	import { hrefFor } from '$lib/address';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import { t } from '$lib/i18n.svelte';
	import { matchingSlugs } from '$lib/topic-search';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * SEARCH IS THE ONE CONTROL THIS PAGE NEEDS AND FACETS ARE NOT.
	 *
	 * `/documenta` earns a facet panel because 298 rows carry axes that are
	 * invisible in the list — an author, a kind, a date. This page is already
	 * sixteen named shelves, so a doorway or cluster filter would only collapse
	 * the structure that IS the page. What no amount of grouping gives is the
	 * reader who arrives holding words rather than a place, which is the half
	 * of the audience `docs/research/audiences.md` found hits the jump box and
	 * bounces off it: the box completes citations, and they do not have one.
	 *
	 * LOCAL STATE, NOT THE URL. `/documenta` keeps its query in the route
	 * because its filters are worth linking to and returning to; a search here
	 * is a way of getting to one page and the page is the thing worth linking
	 * to. Nothing else on the site reads it, so nothing else needs to see it.
	 *
	 * ONE INPUT, ABOVE THE LIST, AND NOT IN THE ASIDE. The aside is gone below
	 * 80rem (`styles/layout.css`), so a control living there has to be rendered
	 * a second time for narrower screens — the duplication `/documenta` pays
	 * because its whole panel has to be reachable. A single field does not have
	 * to be paid for twice, and above the rows it filters is where it reads.
	 */
	let query = $state('');

	const rows = $derived(
		Object.keys(data.index?.topics ?? {}).map((slug) => ({
			slug,
			title: t(`quaestiones.${slug}.title`),
			question: t(`quaestiones.${slug}.question`)
		}))
	);

	/** Recomputed against the dictionary, so switching interface language
	 *  re-runs the match: the reader searches the words in front of them. */
	const matching = $derived(matchingSlugs(rows, query));
	const searching = $derived(query.trim() !== '');

	/**
	 * DOORWAY, THEN CLUSTER, THEN TOPIC — three levels, and the middle one is
	 * why this page is readable at all.
	 *
	 * `doorways` is a closed list and the order it is written in is the order a
	 * reader meets it, which is a judgement rather than an alphabet: the
	 * argument first because it is what a reader expects a page like this to
	 * be, and the two doorways nobody indexes — what happened on Tuesday, and
	 * what they would never ask a person — after it, where a reader who came
	 * for the first can find them.
	 *
	 * THE CLUSTER LAYER IS NOT DECORATION. `argument` alone holds sixty
	 * topics, and sixty rows under one heading is a wall: the reader asking
	 * whether any of it is true would have to read past contraception, the
	 * death penalty and the just wage to find out. `site/quaestiones.json`
	 * declares each doorway's clusters IN ORDER, which is why this maps over
	 * that list rather than collecting the clusters the topics happen to
	 * mention — deriving the order from the topics would let a reordering of
	 * the topic list silently reorder the page's headings.
	 *
	 * An empty doorway or cluster renders nothing. The sync warns about both
	 * rather than failing, because it is the ordinary condition while one is
	 * being filled.
	 */
	const byDoorway = $derived(
		(data.index?.doorways ?? []).map((doorway) => ({
			doorway,
			clusters: (data.index?.clusters?.[doorway] ?? [])
				.map((cluster) => ({
					cluster,
					topics: Object.entries(data.index?.topics ?? {})
						.filter(([, topic]) => topic.doorway === doorway && topic.cluster === cluster)
						.map(([slug]) => slug)
						.filter((slug) => matching.has(slug))
				}))
				.filter((group) => group.topics.length > 0)
		}))
	);

	/**
	 * THE SIDEBAR LISTS CLUSTERS AND NOT DOORWAYS, which is the whole point of
	 * having it: four entries would be a table of contents for a page nobody
	 * needs help with, and one entry per topic would be the page again beside
	 * itself — the failure `IndexSidebarToc`'s own docblock names. Sixteen
	 * rows is the size that makes a hundred-odd questions skimmable.
	 *
	 * The doorway is carried as a `group` label rather than a row of its own,
	 * so the spy's "where am I" never lands on a heading the reader cannot
	 * scroll to alone.
	 *
	 * IT NARROWS WITH THE LIST, because `byDoorway` is already filtered and a
	 * cluster with no surviving topic drops out of both. A table of contents
	 * offering sixteen shelves over a page showing three would send the reader
	 * to an anchor that is no longer on the page.
	 */
	const sidebarItems = $derived(
		byDoorway.flatMap((group) =>
			group.clusters.map((entry) => ({
				href: `#${group.doorway}-${entry.cluster}`,
				label: t(`quaestiones.cluster.${entry.cluster}`)
			}))
		)
	);
</script>

<svelte:head>
	<title>{t('quaestiones.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout index">
	<div class="landing-column">
		<h1>{t('quaestiones.landing.title')}</h1>
		<p class="page-tagline landing-measure">{t('quaestiones.landing.tagline')}</p>

		{#if data.index}
			<!-- `type="search"` for the clear affordance browsers give it; the
			     accessible name is an `aria-label` because a visible label would
			     only repeat the placeholder. `bind:` rather than `/documenta`'s
			     `value` + `oninput`, since here the text IS local state and
			     belongs to no route. -->
			<div class="search-band">
				<input
					type="search"
					class="search"
					bind:value={query}
					placeholder={t('quaestiones.search.label')}
					aria-label={t('quaestiones.search.label')}
				/>
				<!-- Announced only while it means something: with no query the
				     count would read "116 / 116" beside a page showing all of
				     them. `aria-live` so a screen reader hears the list shrink,
				     which is otherwise a silent change to content far below. -->
				<p class="count" aria-live="polite">
					{#if searching}
						<span class="visually-hidden">{t('quaestiones.search.label')}: </span>{matching.size} /
						{rows.length}
					{/if}
				</p>
			</div>
		{/if}

		{#if !data.index}
			<p class="empty">{t('quaestiones.landing.none')}</p>
		{:else if searching && matching.size === 0}
			<p class="empty">{t('quaestiones.search.none')}</p>
		{:else}
			{#each byDoorway as group (group.doorway)}
				{#if group.clusters.length > 0}
					<section class="doorway">
						<h2>{t(`quaestiones.doorway.${group.doorway}`)}</h2>
						<p class="blurb">{t(`quaestiones.doorway.${group.doorway}.blurb`)}</p>

						{#each group.clusters as entry (entry.cluster)}
							{@const id = `${group.doorway}-${entry.cluster}`}
							<section class="cluster" {id} aria-labelledby={`${id}-heading`}>
								<h3 id={`${id}-heading`}>{t(`quaestiones.cluster.${entry.cluster}`)}</h3>
								<!-- `"hover"`: a row here is a destination the reader picked in
								     order to GO to it, the same call `/preces` makes for the
								     same shape of list. -->
								<ul class="index-list" data-link-preview="hover">
									{#each entry.topics as slug (slug)}
										<li class="topic-row">
											<a class="topic-link" href={hrefFor({ kind: 'topic', slug })}>
												{t(`quaestiones.${slug}.title`)}
											</a>
											<p class="question">{t(`quaestiones.${slug}.question`)}</p>
										</li>
									{/each}
								</ul>
							</section>
						{/each}
					</section>
				{/if}
			{/each}
		{/if}
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('quaestiones.landing.title')} items={sidebarItems} />
	</aside>
</div>

<style>
	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	/*
	 * THE FIELD AND ITS COUNT SIT ON ONE LINE, the count to the right, so the
	 * number appears where the eye already is rather than pushing the list
	 * down by a line the moment somebody types. It holds its space when empty
	 * for the same reason: a count that appears and disappears would move a
	 * hundred rows every keystroke.
	 */
	.search-band {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
		max-width: 40rem;
	}

	/* The same field `/documenta`'s `.doc-search` is, and deliberately not a
	   shared class: that one is a component's own control and carries the
	   sticky band around it. What is worth copying is the four declarations
	   below and the focus rule, which every bordered text field on this site
	   now agrees on. */
	.search {
		flex: 1 1 auto;
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
	 * field on this site does — `JumpBox`, `.menu-filter` and `.doc-search`
	 * are the same declarations, and `DocumentFilters` records the arithmetic.
	 * An offset ring drawn around an already-bordered rounded field stacks
	 * into a double frame. The transparent outline is not decoration:
	 * `forced-colors` repaints an `outline` in the system focus colour, where
	 * the halo is dropped.
	 */
	.search:focus-visible {
		outline: 2px solid transparent;
		outline-offset: 2px;
		border-color: var(--color-apparatus);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-apparatus) 20%, transparent);
	}

	.count {
		flex: 0 0 auto;
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.doorway {
		margin-bottom: 3rem;
	}

	/*
	 * THE DOORWAY IS A RULE ACROSS THE COLUMN and the cluster is a plain
	 * heading, because a reader has to be able to tell the two levels apart
	 * at a glance without reading either. Four rules down a long page are
	 * landmarks; sixteen would be a grid.
	 */
	h2 {
		font-size: 1.15rem;
		margin: 0 0 0.25rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--color-border);
	}

	.blurb {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0 0 1.5rem;
	}

	.cluster {
		margin-bottom: 1.75rem;
		/* Clears the sticky chrome when a sidebar row jumps to this heading —
		   without it the heading lands behind the bar and the reader sees the
		   cluster's second topic first. `scroll-padding-top` on the scroll
		   container is the site's usual instrument; this is the same value
		   applied per target, since these are the only fragment targets here. */
		scroll-margin-top: calc(var(--sticky-chrome-height) + 1.5rem);
	}

	h3 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		font-weight: 600;
		margin: 0 0 0.6rem;
	}

	/*
	 * TWO TOPICS PER ROW ONCE THERE IS ROOM, because a topic is a short title
	 * over a one-line question and the column it sits in is 62rem: in one
	 * column each row uses a third of its width and the page becomes twice as
	 * tall as it needs to be, which on a hundred-odd topics is the difference
	 * between a list a reader scans and one they scroll.
	 *
	 * ROW FLOW AND NOT COLUMN FLOW — `grid` rather than CSS multi-column, and
	 * the choice matters. Multi-column would fill the left column top to
	 * bottom before starting the right, which reads well for a directory but
	 * would bury this file's ordering: within `the-rules` contraception is
	 * written first because it is the teaching most readers doubt, and it
	 * belongs at the top-left rather than halfway down. Grid keeps DOM order
	 * across the row, so first written is first read.
	 *
	 * `align-items: start` so a cell whose question wraps to two lines does
	 * not stretch its neighbour, and `minmax(0, 1fr)` because a grid track's
	 * default `min-width: auto` refuses to shrink below its longest
	 * unbreakable word — a long title would push the second column off the
	 * page rather than wrap.
	 *
	 * 46rem, WHICH IS NOT ONE OF THE SITE'S LAYOUT BREAKPOINTS and should not
	 * be made into one. This is the width at which two 23rem cells stop
	 * crowding, measured against this page's own content; the 80rem in
	 * layout.css is where the aside appears, which is a different question
	 * about a different element. Below it the list is one column and the rule
	 * never applies.
	 */
	.index-list {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		align-items: start;
		gap: 0.7rem 2.5rem;
	}

	@media (min-width: 46rem) {
		.index-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/*
	 * NOT THE `.index-list` FAMILY, and both halves of the omission are
	 * deliberate.
	 *
	 * `.index-row` rules every row with a bottom border, which is right for a
	 * flat catalogue of three hundred documents and wrong for a hundred-odd
	 * rows already divided into sixteen groups. The grouping does the
	 * separating here, so the rows only need air.
	 *
	 * `.index-title` sets the title in `--color-text`, and components.css says
	 * why: "in a list where every row is a link, colouring every title would
	 * make the page a wall of red". That reasoning is about a catalogue, where
	 * the row's title is the NAME OF A THING and its being a link is
	 * incidental. Here the title is a question somebody came to ask, the whole
	 * page is the answer to "where do I go", and every row wanting to be
	 * followed is the point rather than the hazard. So the link keeps
	 * `--color-link` from base.css and only the underline is dropped.
	 *
	 * The row spacing is the grid's `gap` above and not a margin here, so the
	 * two columns keep the same rhythm without one of them ending on a margin
	 * the other does not have.
	 */
	.topic-row {
		/* A grid item's default `min-width: auto` again, one level in. */
		min-width: 0;
	}

	/*
	 * A LIST-SHAPED SURFACE OPTS OUT OF THE UNDERLINE AT REST, which is the
	 * exemption base.css names for the breadcrumb, the nav and the index
	 * cards, and which `/schola`'s catalogue takes for the same reason: the
	 * mark earns its place under a link inside a sentence, and every line here
	 * is a link, so an underline on each is a column of rules down the page.
	 * Hover and focus restore it — the arrival IS the interaction.
	 *
	 * IT ARRIVES IN THE LINK'S OWN COLOUR, so nothing here names one:
	 * `a:hover` in base.css already sets `text-decoration-color:
	 * currentColor`, and a grey rule under a red word reads as a mistake.
	 */
	.topic-link {
		text-decoration: none;
	}

	.topic-link:hover,
	.topic-link:focus-visible {
		text-decoration: underline;
	}

	.question {
		margin: 0.1rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.empty {
		color: var(--color-text-muted);
	}
</style>
