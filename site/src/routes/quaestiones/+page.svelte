<script lang="ts">
	import { page } from '$app/state';
	import { hrefFor } from '$lib/address';
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
	 * IT SITS UNDER THE TAGLINE, in the column, at every width. It was in the
	 * aside above a table of contents, which cost a second copy below 80rem
	 * where the aside is `display: none` (`styles/layout.css`) — one control,
	 * two elements, one of them always hidden. With the shelves closed by
	 * default the page IS its own table of contents, so the aside had one thing
	 * left in it and that thing belongs where the reader's eye already is:
	 * under the sentence saying what the page holds, above the first shelf.
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
	 * SIXTEEN SHELVES AND NO DOORWAY HEADINGS — two levels on the page where
	 * `site/quaestiones.json` has three.
	 *
	 * THE DOORWAY IS STILL THE FILE'S AXIS and still decides the order these
	 * are drawn in; it just no longer heads anything. It sorts by the SITUATION
	 * a reader arrives in, which is the right question to ask of a topic and
	 * the wrong one to answer with a heading: "what people argue about" is true
	 * of all sixteen shelves, and the widest doorway held sixty topics across
	 * six of them, so the level that told the reader where to go was always the
	 * one underneath. Four headings over sixteen was a level to read past.
	 *
	 * THE ORDER IS THE FILE'S, twice over: doorway by doorway, and inside a
	 * doorway the clusters as that doorway declares them. Neither is derived
	 * from the topics — collecting the clusters the topics happen to mention
	 * would let a reordering of the topic list silently reorder the page.
	 *
	 * THE ID KEEPS THE DOORWAY IN IT (`argument-credibility`). A cluster key is
	 * scoped to its doorway, so two doorways may declare the same one, and the
	 * fragment has to stay unique either way — it is also somebody's bookmark.
	 *
	 * An empty cluster renders nothing. The sync warns about it rather than
	 * failing, because that is the ordinary condition while one is being filled.
	 */
	const shelves = $derived(
		(data.index?.doorways ?? []).flatMap((doorway) =>
			(data.index?.clusters?.[doorway] ?? [])
				.map((cluster) => ({
					id: `${doorway}-${cluster}`,
					cluster,
					topics: Object.entries(data.index?.topics ?? {})
						.filter(([, topic]) => topic.doorway === doorway && topic.cluster === cluster)
						.map(([slug]) => slug)
						.filter((slug) => matching.has(slug))
				}))
				.filter((shelf) => shelf.topics.length > 0)
		)
	);

	/**
	 * WHICH CLUSTERS THE READER HAS OPENED, and every shelf starts shut.
	 *
	 * Sixteen headings a reader can take in at once is what the shelves were
	 * for; a hundred and sixteen questions drawn under them is the wall they
	 * were meant to remove, three shelves at a time instead of sixty. Closed by
	 * default, the page IS its own table of contents — sixteen named shelves,
	 * each saying how many questions it holds — and a reader opens the one they
	 * came for.
	 *
	 * SEARCH OVERRIDES IT AND DOES NOT RECORD ITSELF. `searching` forces every
	 * surviving cluster open, because a query that matched three questions and
	 * showed three closed headings would read as a page with no results. The
	 * `ontoggle` handler ignores what happens while a query is live, so
	 * clearing the box puts the page back exactly as the reader had it rather
	 * than leaving whatever the search opened standing.
	 *
	 * A FRAGMENT OPENS ITS OWN CLUSTER. A browser opens a closed `<details>`
	 * only for a target INSIDE it, and these ids are on the element itself — so
	 * a link into a shelf would scroll to a shut heading and stop. Nothing on
	 * this page writes such a link any more, and someone else's bookmark is
	 * exactly the case that has to keep working.
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
</script>

<svelte:head>
	<title>{t('quaestiones.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="landing-column">
	<h1>{t('quaestiones.landing.title')}</h1>
	<p class="page-tagline landing-measure">{t('quaestiones.landing.tagline')}</p>

	{#if data.index}
		<!-- `type="search"` for the clear affordance browsers give it; the
		     accessible name is an `aria-label` because a visible label would only
		     repeat the placeholder.

		     THE COUNT IS PART OF THE FIELD and not of the list: it is the field's
		     answer, and putting it over the shelves would leave the box the reader
		     typed into saying nothing. Announced only while a query is live — with
		     none it would read "116 / 116" beside a page showing all of them — and
		     `aria-live` because the list shrinking is otherwise a silent change to
		     content far below. The paragraph holds its space either way, or the
		     first keystroke would move every shelf under it. -->
		<div class="search">
			<input
				type="search"
				class="topic-search"
				bind:value={query}
				placeholder={t('quaestiones.search.label')}
				aria-label={t('quaestiones.search.label')}
			/>
			<p class="search-count" aria-live="polite">
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
		{#each shelves as shelf (shelf.id)}
			<!-- The chip is what a closed shelf owes the reader: sixteen headings
			     with no sizes are sixteen doors into an unknown room, and while a
			     query is live it is the count that survived it. -->
			<details
				class="cluster fold"
				id={shelf.id}
				open={searching || opened[shelf.id] === true}
				ontoggle={(event) => remember(shelf.id, event.currentTarget.open)}
			>
				<summary>
					<h2>{t(`quaestiones.cluster.${shelf.cluster}`)}</h2>
					<span class="chip">{shelf.topics.length}</span>
				</summary>
				<!-- `"hover"`: a row here is a destination the reader picked in
				     order to GO to it, the same call `/preces` makes for the
				     same shape of list. -->
				<ul class="index-list" data-link-preview="hover">
					{#each shelf.topics as slug (slug)}
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
	{/if}
</div>

<style>
	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	/*
	 * THE FIELD KEEPS THE TAGLINE'S MEASURE and does not run the column's
	 * width. It sits directly under a 40rem sentence, and a search box three
	 * times the length of the line above it reads as a different page's
	 * furniture; nothing about a query needs 72rem to be typed into either.
	 *
	 * `flex-wrap` so the count drops under the field where the two together
	 * would squeeze it — the field has a floor and the count is short, so on
	 * anything but the narrowest phone they share one line.
	 */
	.search {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.75rem;
		max-width: 40rem;
		margin-bottom: 2rem;
	}

	/* The four declarations every bordered text field on this site agrees on
	   — `JumpBox`, `.menu-filter` and `.doc-search` are the same. */
	.topic-search {
		flex: 1 1 12rem;
		min-width: 0;
		box-sizing: border-box;
		font-family: var(--font-sans);
		padding: 0.45rem 0.6rem;
		font-size: 0.9rem;
		/* A ratio and not the length an inherited `font` shorthand leaves —
		   styles/base.css says why. */
		line-height: 1.5;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/*
	 * THE FOCUS INDICATOR IS IN THE BORDER, which is what every bordered text
	 * field on this site does; `DocumentSearch` records the arithmetic. An
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

	.search-count {
		flex: 0 0 auto;
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.cluster {
		margin-bottom: 2.25rem;
		/* Clears the sticky chrome when a fragment lands on this heading —
		   without it the heading lands behind the bar and the reader sees the
		   cluster's second topic first. `scroll-padding-top` on the scroll
		   container is the site's usual instrument; this is the same value
		   applied per target, since these are the only fragment targets here. */
		scroll-margin-top: calc(var(--sticky-chrome-height) + 1.5rem);
	}

	/* Sixteen closed shelves want to read as a list rather than as sixteen
	   sections, so a shut one keeps only the space that separates two rows. */
	.cluster:not([open]) {
		margin-bottom: 0.5rem;
	}

	/* THE WHOLE HEADING ROW IS THE TOGGLE, which is what `<details>` is for.
	   The mark, the reset and the tap target are `.fold` in components.css —
	   every disclosure on the site draws the same one. What is this page's is
	   the row's own height. */
	summary {
		padding-block: 0.15rem;
	}

	/* The heading is the only word in the row, so the hover answers on it —
	   the same "this is a control" job `.facet-option`'s ground does in the
	   `/documenta` panel, at a size that does not want a filled band. */
	summary:hover h2,
	summary:focus-visible h2 {
		color: var(--color-accent);
	}

	/*
	 * THE SHELF HEADING IS THE PAGE'S STRUCTURE now that no doorway stands over
	 * it, so it is set as something to choose between rather than as a label
	 * over a list: text colour, not muted, and no small-caps tracking — that
	 * treatment reads as a section marker, which is what it was when four
	 * headings ruled across the column above it.
	 *
	 * AND STILL NO RULE UNDER IT. Sixteen ruled headings down a page are a
	 * grid rather than sixteen landmarks; the disclosure mark and the count
	 * already say that a row is a row.
	 */
	h2 {
		/* The interface face, like `/documenta`'s table-of-contents heading and
		   the sidebars': this is our own label for a shelf, not a line of any
		   book, and the text face belongs to the questions under it. */
		font-family: var(--font-sans);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}

	.cluster[open] > summary {
		margin-bottom: 0.6rem;
	}

	/* BESIDE THE HEADING AND NOT AT THE ROW'S END. The row is as wide as the
	   column, which is three topics across at full width, so an auto margin
	   put the count a thousand pixels from the words it counts — a number
	   floating in the margin of a page it had stopped belonging to. */
	.chip {
		font-variant-numeric: tabular-nums;
	}

	/*
	 * AS MANY TOPICS PER ROW AS THE VIEWPORT WILL HOLD — one, two, then three.
	 * A topic is a short title over a one-line question, so in a single column
	 * each row uses a third of its width and the page is three times as tall as
	 * it needs to be, which on a hundred-odd topics is the difference between a
	 * list a reader scans and one they scroll.
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
	 * 46rem AND 75rem ARE NOT THE SITE'S LAYOUT BREAKPOINTS and should not be
	 * made into them. They are this page's own content: two 23rem cells stop
	 * crowding at the first, and the second is where the viewport can give the
	 * column its whole `--landing-width` (72rem plus its padding), which is
	 * what a third 22rem cell needs. The 80rem in layout.css is where an aside
	 * appears, a different question about a different element — and this page
	 * no longer has one.
	 *
	 * `auto-fit` WOULD BE THE SHORTER SPELLING AND IS THE WRONG ONE: the track
	 * minimum would have to be a length, and a cell here is sized by a question
	 * that wraps rather than by anything that refuses to. Stating the counts
	 * keeps the two thresholds where the reasoning for them is.
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

	@media (min-width: 75rem) {
		.index-list {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			/* Three cells in 72rem have less to spare than two had, so the
			   gutter narrows with them rather than eating a cell's width. */
			column-gap: 2rem;
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
