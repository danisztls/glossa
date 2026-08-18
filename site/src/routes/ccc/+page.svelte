<script lang="ts">
	import { getCccStructure, getWork } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import StructureIndex from '$lib/components/StructureIndex.svelte';
	import { indexSidebarItems } from '$lib/components/indexToc';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';

	const lang = $derived(content.langFor('catechism'));
	const tree = $derived(getCccStructure(lang));
	const work = $derived(getWork(`ccc.${lang}`));
	const sidebarItems = $derived(indexSidebarItems(tree, lang));
</script>

<svelte:head>
	<title>{t('ccc.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<div class="content-column">
		<h1>{t('ccc.landing.title')}</h1>
		<p class="tagline">{t('ccc.landing.tagline')}</p>
		{#if work}
			<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
		{/if}

		<h2 class="toc-heading">{t('ccc.tableOfContents')}</h2>
		<StructureIndex
			{tree}
			{lang}
			hrefBase="/catechismus/caput"
			unit="¶"
			noAddressLabel={t('ccc.noParagraphNumber')}
		/>
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('ccc.tableOfContents')} items={sidebarItems} />
	</aside>
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
	.toc-heading {
		font-size: 1.1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}
</style>
