<script lang="ts">
	/**
	 * The index page for the Catechism and for its Compendium.
	 *
	 * ONE COMPONENT, because the two are one outline published at two lengths
	 * and their landing pages had become near-identical copies — same layout,
	 * same four components, same styles, differing only in a table of facts
	 * about which work is being shown. `indexToc.ts` already exists to keep
	 * "their indexes from quietly growing apart again"; this is the same
	 * argument applied to the page around them.
	 *
	 * THE SIBLING RESOLVER IS DELIBERATELY NOT SYMMETRIC, and the asymmetry is
	 * a property of the works rather than an omission. The Catechism's index
	 * has 100 rows and 68 of them — the Prologue and all 67 articles — have no
	 * counterpart DIVISION, because the Compendium prints no articles; those
	 * fall back to the condensation vote, which answers "which questions
	 * condense these paragraphs" instead. The Compendium's index has 32 rows,
	 * every one a part, section or chapter, and every one pairs structurally
	 * (`toc-pairing.ts`, corroborated by the sync's 2,560 paired divisions over
	 * all 80 edition pairs). So the fallback is reachable in one direction only
	 * and the mirror of it would be dead code.
	 */
	import {
		condensingQuestionRun,
		getCccStructure,
		getCompendiumStructure,
		getWork
	} from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import type { StructureNode } from '$lib/types';
	import CopyrightNotice from './CopyrightNotice.svelte';
	import IndexSidebarToc from './IndexSidebarToc.svelte';
	import ReadingBar from './ReadingBar.svelte';
	import StructureIndex from './StructureIndex.svelte';
	import { indexSidebarItems, siblingLink } from './indexToc';

	/**
	 * Everything the page needs that differs between the two works.
	 *
	 * `langKey` is not `workPrefix`: which edition a reader gets is resolved
	 * per work through `CONTENT_LANG_FALLBACK`, and the two works do not cover
	 * the same languages — `la` and `mg` have a Catechism and no Compendium,
	 * `hu`/`ro`/`sl`/`sv` the reverse. So each side resolves its own, and the
	 * companion's tree is read in the companion's language. The pairing is
	 * language-independent (every edition of both works reports the same
	 * spans), so a fallback edition gives the same answer.
	 */
	const WORKS = {
		catechism: {
			langKey: 'catechism',
			workPrefix: 'ccc',
			structure: getCccStructure,
			/** Where a ROW links, and where the companion's badge links from the
			 *  other page — the same base serves both roles. */
			chapterBase: '/catechismus/caput',
			unit: '¶',
			titleKey: 'ccc.landing.title',
			taglineKey: 'ccc.landing.tagline',
			tocKey: 'ccc.tableOfContents',
			noAddressKey: 'ccc.noParagraphNumber',
			abbrevKey: 'ccc.abbrev'
		},
		compendium: {
			langKey: 'compendium',
			workPrefix: 'compendium',
			structure: getCompendiumStructure,
			chapterBase: '/catechismus/compendium/caput',
			unit: 'Q',
			titleKey: 'compendium.landing.title',
			taglineKey: 'compendium.landing.tagline',
			tocKey: 'compendium.tableOfContents',
			noAddressKey: 'compendium.noQuestionNumber',
			abbrevKey: 'compendium.abbrev'
		}
	} as const;

	interface Props {
		/** Which of the two works this page is the index of. */
		primary: keyof typeof WORKS;
	}

	let { primary }: Props = $props();

	const self = $derived(WORKS[primary]);
	const other = $derived(WORKS[primary === 'catechism' ? 'compendium' : 'catechism']);

	const lang = $derived(content.langFor(self.langKey));
	const tree = $derived(self.structure(lang));
	const work = $derived(getWork(`${self.workPrefix}.${lang}`));
	const sidebarItems = $derived(indexSidebarItems(tree, lang));

	const pairs = $derived(
		pairDivisionsCached(tree, other.structure(content.langFor(other.langKey)))
	);

	// Structural pairing first, then the condensation vote. The order is not
	// arbitrary: a part, section or chapter has a counterpart DIVISION, which
	// is a stronger statement than "these questions cite these paragraphs".
	const sibling = $derived((node: StructureNode) => {
		let span: readonly [number | null, number | null] | undefined = pairs.get(node)?.paragraphs;
		if (!span && primary === 'catechism') {
			const [from, to] = node.paragraphs;
			if (Number.isFinite(from) && Number.isFinite(to)) {
				span = condensingQuestionRun(from as number, to as number);
			}
		}
		return siblingLink(span, {
			hrefBase: other.chapterBase,
			unit: other.unit,
			abbrev: t(other.abbrevKey),
			workTitle: t(other.titleKey)
		});
	});
</script>

<svelte:head>
	<title>{t(self.titleKey)} — {t('home.title')}</title>
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
		<h1>{t(self.titleKey)}</h1>
		<p class="tagline">{t(self.taglineKey)}</p>
		{#if work}
			<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
		{/if}

		<h2 class="toc-heading">{t(self.tocKey)}</h2>
		<StructureIndex
			{tree}
			{lang}
			hrefBase={self.chapterBase}
			unit={self.unit}
			noAddressLabel={t(self.noAddressKey)}
			{sibling}
		/>
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t(self.tocKey)} items={sidebarItems} />
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
