<script lang="ts">
	/**
	 * Prayer collection landing page — the `/compendium`/`/ccc` landing
	 * pages' shape, not a `StructureSidebarToc` consumer: `structure.json`'s
	 * ranges are `[null, null]` throughout (prayers address by `slug`, never
	 * by number — docs/corpus-schema.md "Prayers"), so that component's
	 * `hrefFor`/`rowState` would have nothing numeric to key on and every row
	 * would render unlinked. A plain, flat, two-level grouped list is the
	 * honestly-simpler alternative the task brief itself names — 24 prayers
	 * across 5 sections doesn't need a persistent sidebar tree to stay
	 * navigable on one page.
	 *
	 * Reactive, not `+page.ts`-loaded, for the same reason `/compendium` is:
	 * `structure.json` + prayer metadata are both INDEX tier, already
	 * eager-inlined for every language, so there's nothing to fetch here —
	 * `content.langFor('prayer')` alone decides which language's copy to
	 * show, and recomputes with no reload when the reader switches it.
	 */
	import { getWork, listPrayerGroups } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';

	let lang = $derived(content.langFor('prayer'));
	let groups = $derived(listPrayerGroups(lang));
	let work = $derived(getWork(`prayer.common.${lang}`));
</script>

<svelte:head>
	<title>{t('prayers.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('prayers.landing.title')}</h1>
	<p class="tagline">{t('prayers.landing.tagline')}</p>
	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	{#each groups as group (group.id)}
		<section class="prayer-group" id={group.id} aria-labelledby={`${group.id}-heading`}>
			<h2 id={`${group.id}-heading`}>{group.title}</h2>
			<ul class="prayer-list">
				{#each group.prayers as meta (meta.slug)}
					<li>
						<a class="prayer-link" href={`/preces/${meta.slug}`}>{meta.title}</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
		margin-top: 0;
	}

	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.prayer-group {
		margin: 1.75rem 0;
	}

	.prayer-group h2 {
		font-size: 1.1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
		margin: 0 0 0.5rem;
	}

	.prayer-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.prayer-list li {
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.prayer-link {
		font-family: var(--font-serif);
		text-decoration: none;
	}
</style>
