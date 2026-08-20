<script lang="ts">
	import { getCompendiumStructure, getWork } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import StructureIndex from '$lib/components/StructureIndex.svelte';
	import { indexSidebarItems } from '$lib/components/indexToc';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';

	let lang = $derived(content.langFor('compendium'));
	let tree = $derived(getCompendiumStructure(lang));
	let work = $derived(getWork(`compendium.${lang}`));
	let sidebarItems = $derived(indexSidebarItems(tree, lang));
</script>

<svelte:head>
	<title>{t('compendium.tableOfContents')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<div class="content-column">
		<h1>{t('compendium.landing.title')}</h1>
		<p class="tagline">{t('compendium.landing.tagline')}</p>
		{#if work}
			<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
		{/if}

		<h2 class="toc-heading">{t('compendium.tableOfContents')}</h2>
		<StructureIndex
			{tree}
			{lang}
			hrefBase="/compendium/caput"
			unit="Q"
			noAddressLabel={t('compendium.noQuestionNumber')}
		/>
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('compendium.tableOfContents')} items={sidebarItems} />
	</aside>
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
		margin-top: 0;
	}

	/* 0.8rem, not the app.css base's 0.75rem — this index page's own outlier. */
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
	}

	.toc-heading {
		font-size: 1.1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}
</style>
