<script lang="ts">
	import { page } from '$app/state';
	import { hrefFor } from '$lib/address';
	import { foldState } from '$lib/fold-state.svelte';
	import { t } from '$lib/i18n.svelte';
	import { keywordsFrom, matchingSlugs } from '$lib/topic-search';
	import { BANNERS, type Artwork } from '$lib/landing-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import IndexSection from '$lib/components/IndexSection.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// The identification, plus the one interface word in it — composed here and
	// passed down, the arrangement `Plate.svelte` argues for: the page that
	// knows what a picture is is the page that writes the line.
	const creditOf = (art: Artwork) => art.credit + (art.detail ? ` (${t('art.detail')})` : '');

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
		Object.keys(data.index?.topics ?? {}).map((slug) => {
			// The third string is the one the reader never sees: the words they
			// would type for this topic that the title and the question do not
			// happen to use. `keywordsFrom` is what keeps a dictionary that has
			// none from putting the key — and so the slug — into the haystack.
			const keywords = `quaestiones.${slug}.keywords`;
			return {
				slug,
				title: t(`quaestiones.${slug}.title`),
				question: t(`quaestiones.${slug}.question`),
				keywords: keywordsFrom(keywords, t(keywords))
			};
		})
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
	 * EVERY SHELF STARTS SHUT, which is the whole of what this page states
	 * about the fold — `$lib/fold-state.svelte.ts` holds the rest, and
	 * `/preces` states the opposite default against the same module.
	 *
	 * Sixteen headings a reader can take in at once is what the shelves were
	 * for; every question the file holds drawn under them is the wall they were
	 * meant to remove, three shelves at a time instead of sixty. Closed by
	 * default, the page IS its own table of contents — sixteen named shelves,
	 * each saying how many questions it holds — and a reader opens the one they
	 * came for.
	 *
	 * The default takes no `index`: a shelf's position says nothing here, where
	 * on a phone it says which prayers a reader met first.
	 */
	const shelfFolds = foldState({ searching: () => searching });

	$effect(() => shelfFolds.reveal(page.url.hash.slice(1)));
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
				class="topic-search list-filter"
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
		{#each shelves as shelf, index (shelf.id)}
			<!-- The chip is what a closed shelf owes the reader: sixteen headings
			     with no sizes are sixteen doors into an unknown room, and while a
			     query is live it is the count that survived it. -->
			<IndexSection
				id={shelf.id}
				heading={t(`quaestiones.cluster.${shelf.cluster}`)}
				count={shelf.topics.length}
				open={shelfFolds.isOpen(shelf.id, index)}
				ontoggled={(open) => shelfFolds.remember(shelf.id, index, open)}
			>
				<!-- `"hover"`: a row here is a destination the reader picked in
				     order to GO to it, the same call `/preces` makes for the
				     same shape of list. -->
				<ul class="index-list" data-link-preview="hover">
					{#each shelf.topics as slug (slug)}
						<li class="topic-row pointing-row">
							<a class="topic-link" href={hrefFor({ kind: 'topic', slug })}>
								{t(`quaestiones.${slug}.title`)}
							</a>
							<p class="question">{t(`quaestiones.${slug}.question`)}</p>
						</li>
					{/each}
				</ul>
			</IndexSection>
		{/each}
	{/if}

	<!--
		A TAILPIECE, AND NOT WHILE A QUERY IS LIVE. `/bibliotheca` argues the
		position: a reader arriving here wants the questions, and a picture
		above them is a picture between the reader and every shelf. Below the
		last one there is nothing left for it to be the subject of.

		The search is why this page's copy is conditional where that one's is
		not. A query that matched nothing prints one line saying so, and a
		painting under that line would be the page's answer to it. A corpus that
		failed to sync prints the same shape of line and gets the same silence.

		Raphael's disputing doctors, cut to the earthly register: the fresco
		entire is the Church agreeing with itself in glory, and the half below
		the clouds is people arguing about one thing with the answer on the
		table between them, which is what this page is. `landing-art.ts` holds
		the credit, the crop's reasoning and the second file a press opens —
		the whole fresco, heaven included, which is the one thing a band across
		its bottom third can never show.
	-->
	{#if data.index && (!searching || matching.size > 0)}
		<div class="tailpiece">
			<ArtFigure
				art={BANNERS.quaestiones}
				credit={creditOf(BANNERS.quaestiones)}
				label={t('art.about')}
				expandable
			/>
		</div>
	{/if}
</div>

<style>
	/*
	 * THE BAND IS SIZED SO THE SPAN SURVIVES, which is the opposite call from
	 * `/bibliotheca`'s. That picture is a ROOM: its subject is central, so the
	 * band takes a horizontal slice and the sides are what cover may eat. This
	 * one is a FRIEZE — the men at the left parapet, the altar, the doctors on
	 * the right — and its subject IS the span, so every pixel of width cover
	 * takes is an argument the reader does not see.
	 *
	 * Hence a height derived rather than chosen. `.landing-column` is 72rem
	 * less 1.25rem of padding each side, so the picture is 69.5rem at its
	 * widest; the file is 4.21:1; 69.5 ÷ 4.21 is 16.5rem, and at that height
	 * the band IS the file with nothing cropped at all. In rem and not pixels
	 * so the match holds at any root size, both numbers being rem.
	 */
	.tailpiece {
		margin: 2.5rem 0 0;
		--art-height: 16.5rem;
	}

	/*
	 * AND THE PHONE WANTS IT SHORTER, which reads backwards until you work it.
	 * Below the column's full width cover takes its crop off the ENDS, and a
	 * shorter box is a wider ratio, so it takes less: at 20rem of screen this
	 * band keeps half the fresco's span at 8.75rem and only two fifths at
	 * `/bibliotheca`'s 11.25rem. A frieze drawn thinner is still a frieze; a
	 * frieze drawn short and narrow is an altar with the argument cut off.
	 */
	@media (max-width: 40rem) {
		.tailpiece {
			--art-height: 8.75rem;
		}
	}

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

	/* The field's clothes are `.list-filter` (styles/components.css), which
	   `/preces` wears too; what is this page's is where the field sits in the
	   row it shares with the count. */
	.topic-search {
		flex: 1 1 12rem;
		min-width: 0;
	}

	.search-count {
		flex: 0 0 auto;
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
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
	/* The gutter mark and the hand that replaces it under the pointer are
	   `.pointing-row` (styles/components.css), which `/preces` wears too;
	   what is this page's is the cell the row is. */
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

	/* The reading face, and a size up to pay for it: this line is the question
	   itself rather than a label on the row above it, and EB Garamond's
	   x-height at 0.85rem set it smaller than the sans it replaced. */
	.question {
		margin: 0.1rem 0 0;
		font-family: var(--font-serif);
		font-size: 0.92rem;
		color: var(--color-text-muted);
	}

	.empty {
		color: var(--color-text-muted);
	}
</style>
