<script lang="ts">
	/**
	 * The index of the Catechism — and of its Compendium, which has no index
	 * of its own.
	 *
	 * ONE PAGE FOR BOTH WORKS, because they are one outline published at two
	 * lengths. `toc-pairing.ts` establishes that structurally (every part,
	 * section and chapter pairs, across all 80 edition pairs) and
	 * `condensation.ts` corroborates it from the questions' own `ccc_refs`, so
	 * every row offers both works and offers them ALIKE — see
	 * `StructureIndex` on why the title is not a link.
	 *
	 * The home page shows the same table to a shallower depth, from this same
	 * component and the same resolver (`catechismRows.ts`), so the two cannot
	 * drift the way the hand-written pair of them had.
	 */
	import { getCccStructure, getCompendiumStructure, getWork } from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import type { StructureNode } from '$lib/types';
	import CopyrightNotice from './CopyrightNotice.svelte';
	import IndexSidebarToc from './IndexSidebarToc.svelte';
	import ReadingBar from './ReadingBar.svelte';
	import StructureIndex from './StructureIndex.svelte';
	import { catechismRowLinks } from './catechismRows';
	import { indexSidebarItems } from './indexToc';

	// The two works resolve their editions SEPARATELY, and must: they do not
	// cover the same languages — `la` and `mg` have a Catechism and no
	// Compendium, `hu`/`ro`/`sl`/`sv` the reverse — so each side runs its own
	// `CONTENT_LANG_FALLBACK` chain. The pairing itself is
	// language-independent (every edition of both works reports the same
	// spans), so a fallback edition gives the same answer.
	const lang = $derived(content.langFor('catechism'));
	const compendiumLang = $derived(content.langFor('compendium'));

	const tree = $derived(getCccStructure(lang));
	const work = $derived(getWork(`ccc.${lang}`));
	const sidebarItems = $derived(indexSidebarItems(tree, lang));

	const pairs = $derived(pairDivisionsCached(tree, getCompendiumStructure(compendiumLang)));

	const links = $derived((node: StructureNode) =>
		catechismRowLinks(node, {
			cccLang: lang,
			pairs,
			labels: {
				cccAbbrev: t('ccc.abbrev'),
				cccTitle: t('ccc.landing.title'),
				compendiumAbbrev: t('compendium.abbrev'),
				compendiumTitle: t('compendium.landing.title')
			}
		})
	);
</script>

<svelte:head>
	<title>{t('ccc.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<div class="content-column">
		<!-- The edition picker alone, sticky over a table of contents that is
		     itself written in that edition — see `ReadingBar`. Guarded on
		     `work` for the same reason the notice below it is: with no manifest
		     there is no edition to offer and the bar would be an empty rule. -->
		{#if work}
			<ReadingBar print={false} />
		{/if}
		<h1>{t('ccc.landing.title')}</h1>
		<p class="tagline">{t('ccc.landing.tagline')}</p>
		{#if work}
			<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
		{/if}

		<h2 class="toc-heading">{t('ccc.tableOfContents')}</h2>
		<StructureIndex {tree} {lang} {links} unit="¶" noCounterpartLabel={t('ccc.noCounterpart')} />
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

	/* 0.8rem, not the app.css base's 0.75rem — this index page's own outlier. */
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
	}

	/* "Table of Contents" is ours, the way the sidebar's own heading is —
	   interface face, not the text face the base heading rule hands an `h2`. */
	.toc-heading {
		font-family: var(--font-sans);
		font-size: 1.1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}
</style>
