<script lang="ts">
	import { hrefFor } from '$lib/address';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * GROUPED BY DOORWAY, IN THE FILE'S OWN ORDER.
	 *
	 * `doorways` is a closed list and the order it is written in is the order a
	 * reader meets it, which is a judgement rather than an alphabet: the
	 * argument first because it is what a reader expects a page like this to
	 * be, and the two doorways nobody indexes — what happened on Tuesday, and
	 * what they would never ask a person — after it, where a reader who came
	 * for the first can find them.
	 *
	 * A doorway with no topic renders nothing. The sync warns about that state
	 * rather than failing, because it is the ordinary condition while a doorway
	 * is being filled.
	 */
	const byDoorway = $derived(
		(data.index?.doorways ?? []).map((doorway) => ({
			doorway,
			topics: Object.entries(data.index?.topics ?? {})
				.filter(([, topic]) => topic.doorway === doorway)
				.map(([slug]) => slug)
		}))
	);
</script>

<svelte:head>
	<title>{t('quaestiones.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="page">
	<header>
		<h1>{t('quaestiones.landing.title')}</h1>
		<p class="tagline">{t('quaestiones.landing.tagline')}</p>
	</header>

	{#if !data.index}
		<p class="empty">{t('quaestiones.landing.none')}</p>
	{:else}
		{#each byDoorway as group (group.doorway)}
			{#if group.topics.length > 0}
				<section>
					<h2>{t(`quaestiones.doorway.${group.doorway}`)}</h2>
					<p class="blurb">{t(`quaestiones.doorway.${group.doorway}.blurb`)}</p>
					<ul>
						{#each group.topics as slug (slug)}
							<li>
								<a href={hrefFor({ kind: 'topic', slug })}>
									{t(`quaestiones.${slug}.title`)}
								</a>
								<span class="question">{t(`quaestiones.${slug}.question`)}</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		{/each}
	{/if}
</div>

<style>
	.page {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1rem;
	}

	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	.tagline {
		margin: 0 0 2.5rem;
		opacity: 0.75;
	}

	h2 {
		font-size: 1rem;
		margin: 0 0 0.25rem;
	}

	.blurb {
		font-size: 0.85rem;
		opacity: 0.65;
		margin: 0 0 0.9rem;
	}

	section {
		margin-bottom: 2.5rem;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		margin-bottom: 0.7rem;
	}

	.question {
		display: block;
		font-size: 0.85rem;
		opacity: 0.6;
	}

	.empty {
		opacity: 0.7;
	}
</style>
