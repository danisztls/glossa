<script lang="ts">
	import { hrefFor } from '$lib/address';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

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

		{#if !data.index}
			<p class="empty">{t('quaestiones.landing.none')}</p>
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
											<a class="index-link" href={hrefFor({ kind: 'topic', slug })}>
												<span class="index-title">{t(`quaestiones.${slug}.title`)}</span>
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
	 * NOT `.index-row`, and the omission is deliberate: that class rules every
	 * row with a bottom border, which is right for a flat catalogue of three
	 * hundred documents and wrong for a hundred-odd rows already divided into
	 * sixteen groups. The grouping does the separating here, so the rows only
	 * need air. `.index-link` and `.index-title` are still the shared family —
	 * that is where the underline-at-rest decision lives, and this page should
	 * not be a fourth copy of it.
	 */
	.topic-row {
		margin-bottom: 0.7rem;
	}

	/* The row is a title and a question, one above the other, so the link is
	   not the site's usual title-and-chip flex line. */
	.index-link {
		display: inline;
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
