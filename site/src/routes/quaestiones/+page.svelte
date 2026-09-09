<script lang="ts">
	import { page } from '$app/state';
	import { hrefFor } from '$lib/address';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import TopicSearch from '$lib/components/TopicSearch.svelte';
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
	 * IT SITS AT THE TOP OF THE ASIDE, above the table of contents, and is
	 * rendered a SECOND time above the list for narrower screens — the aside is
	 * `display: none` below 80rem (`styles/layout.css`), and search is the one
	 * control a phone reader most needs on a list of a hundred questions. That
	 * is the duplication `/documenta` pays for `DocumentFilters`; both copies
	 * bind this one `$state`, so there is one query and never two, and exactly
	 * one of them is in the accessibility tree at any width.
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
	/**
	 * WHICH CLUSTERS THE READER HAS OPENED, and every shelf starts shut.
	 *
	 * Sixteen headings a reader can take in at once is what the cluster layer
	 * was for; a hundred and sixteen questions drawn under them is the wall it
	 * was meant to remove, three shelves at a time instead of sixty. Closed by
	 * default, the page opens as its own table of contents — the four doorways
	 * with their sixteen shelves under them, each saying how many questions it
	 * holds — and a reader opens the one they came for.
	 *
	 * SEARCH OVERRIDES IT AND DOES NOT RECORD ITSELF. `searching` forces every
	 * surviving cluster open, because a query that matched three questions and
	 * showed three closed headings would read as a page with no results. The
	 * `ontoggle` handler ignores what happens while a query is live, so
	 * clearing the box puts the page back exactly as the reader had it rather
	 * than leaving whatever the search opened standing.
	 *
	 * A FRAGMENT OPENS ITS OWN CLUSTER. The sidebar's rows are anchors at these
	 * ids, and a browser opens a closed `<details>` only for a target INSIDE
	 * it — the target here is the element itself, so nothing would open and the
	 * row would scroll to a heading and stop.
	 */
	let opened = $state<Record<string, boolean>>({});

	$effect(() => {
		const id = page.url.hash.slice(1);
		if (id) opened[id] = true;
	});

	/** The reader's own toggles, and only those — see `opened`. */
	function remember(id: string, open: boolean) {
		if (!searching) opened[id] = open;
	}

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
			<!-- The copy a reader gets where the aside is not, below the grid
			     breakpoint — `.search-inline` mirrors `.index-aside`'s own
			     `display` rule, exactly as `/documenta`'s `.filters-inline`
			     does. Not a `<details>` like that one: a single field is small
			     enough to simply show, and folding away the control that makes
			     a long list usable is the opposite of the point. -->
			<div class="search-inline">
				<TopicSearch bind:query matched={matching.size} total={rows.length} />
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
							<!-- The chip is what a closed shelf owes the reader: sixteen
							     headings with no sizes are sixteen doors into an unknown
							     room, and while a query is live it is the count that
							     survived it. -->
							<details
								class="cluster"
								{id}
								open={searching || opened[id] === true}
								ontoggle={(event) => remember(id, event.currentTarget.open)}
							>
								<summary>
									<h3>{t(`quaestiones.cluster.${entry.cluster}`)}</h3>
									<span class="chip">{entry.topics.length}</span>
								</summary>
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
							</details>
						{/each}
					</section>
				{/if}
			{/each}
		{/if}
	</div>
	<aside class="index-aside">
		{#if data.index}
			<TopicSearch bind:query matched={matching.size} total={rows.length} />
		{/if}
		<IndexSidebarToc heading={t('quaestiones.landing.title')} items={sidebarItems} />
	</aside>
</div>

<style>
	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	/*
	 * THE INLINE COPY IS THE MIRROR OF `.index-aside` in styles/layout.css:
	 * exactly where that rule takes the aside away, this appears, and where
	 * the aside is back this goes. `/documenta`'s `.filters-inline` is the
	 * same pair. Getting it wrong in either direction shows two search boxes
	 * or none.
	 */
	@media (min-width: 80rem) {
		.search-inline {
			display: none;
		}
	}

	.search-inline {
		max-width: 40rem;
	}

	/*
	 * THE SEARCH FIELD HOLDS THE TOP OF THE ASIDE'S SCROLLPORT.
	 *
	 * `.index-aside` is its own scroll container (styles/layout.css) and the
	 * table of contents under this is sixteen rows, so a reader who scrolled
	 * to the last shelf would have scrolled the one control they might want to
	 * type into off the top of it.
	 *
	 * ON THE ASIDE'S COPY AND NOT ON THE COMPONENT, because the same component
	 * is rendered inline above the list at narrower widths, where there is no
	 * scroll container of its own: sticky there resolves against the PAGE's
	 * scrollport and the field would ride down the document over a hundred
	 * rows. `:global()` reaches into the component's scope; `.index-aside` is
	 * this route's own element, so the pair stays scoped to this page.
	 *
	 * The ground is opaque because a sticky element does not clip what passes
	 * under it, and the band is what carries it — see the component, where the
	 * gap below the field is padding for exactly this reason.
	 */
	.index-aside :global(.topic-search-band) {
		position: sticky;
		top: 0;
		z-index: 1;
		background: var(--color-bg);
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

	/* Sixteen closed shelves want to read as a list rather than as sixteen
	   sections, so a shut one keeps only the space that separates two rows. */
	.cluster:not([open]) {
		margin-bottom: 0.35rem;
	}

	/*
	 * THE WHOLE HEADING ROW IS THE TOGGLE, which is what `<details>` is for and
	 * why the count rides its end rather than sitting beside the h3 as a second
	 * thing to aim at. `list-style: none` plus the WebKit pseudo drops the
	 * browser's own marker, and the glyph below is the one every other
	 * disclosure on this site draws — the default triangle cannot be styled
	 * consistently across browsers.
	 */
	summary {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
		padding: 0.15rem 0.35rem 0.15rem 0;
		border-radius: var(--radius-md);
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary::before {
		content: '▸';
		color: var(--color-text-muted);
		font-size: max(var(--font-size-min), 0.8em);
		display: inline-block;
	}

	.cluster[open] > summary::before {
		transform: rotate(90deg);
	}

	@media (prefers-reduced-motion: no-preference) {
		summary::before {
			transition: transform 120ms ease;
		}
	}

	/* The heading is the only word in the row, so the hover answers on it —
	   the same "this is a control" job `.facet-option`'s ground does in the
	   `/documenta` panel, at a size that does not want a filled band. */
	summary:hover h3,
	summary:focus-visible h3 {
		color: var(--color-text);
	}

	h3 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		font-weight: 600;
		margin: 0;
	}

	.cluster[open] > summary {
		margin-bottom: 0.6rem;
	}

	.chip {
		margin-inline-start: auto;
		font-variant-numeric: tabular-nums;
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

	/*
	 * THE QUESTION IS DROPPED ON A PHONE and the title carries the row alone.
	 * At 360px a one-line question is three lines, so a shelf of eight topics
	 * is thirty-two lines of grey text with eight links buried in it — the
	 * titles stop being scannable, which is the one thing a list of a hundred
	 * questions has to be. The title is already a whole subject; the question
	 * is the sentence a reader would have typed, and its work here is being
	 * SEARCHED rather than being read.
	 *
	 * Which is the one cost: `topic-search.ts` matches title and question
	 * together, so a phone reader can get a row back on a word that is not on
	 * screen. Deliberate — the question is where the reader's own words are, and
	 * losing the match would be worse than the unexplained hit.
	 */
	@media (max-width: 40rem) {
		.question {
			display: none;
		}
	}

	.empty {
		color: var(--color-text-muted);
	}
</style>
