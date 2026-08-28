<script lang="ts">
	/**
	 * The index of the Catechism — and of its Compendium, which has no index
	 * of its own.
	 *
	 * ONE PAGE FOR BOTH WORKS, because they are one outline published at two
	 * lengths. `toc-pairing.ts` establishes that structurally (every part,
	 * section and chapter pairs, across all 80 edition pairs) and
	 * `condensation.ts` corroborates it from the questions' own `ccc_refs`, so
	 * a row can carry the Catechism's paragraph range and the Compendium's
	 * question range at once. Two landing pages showing the same outline at
	 * two resolutions was the same page written twice, and they had already
	 * drifted: their `<title>` tags disagreed about whether they named the
	 * work or its table of contents.
	 *
	 * What the Compendium keeps is everything a reader needs where they
	 * actually read it: its own edition picker and copyright notice live on
	 * `/catechismus/compendium/{n}` and `/caput/{n}`, which is where choosing
	 * among its ten editions belongs. What it loses is a page that listed 32
	 * divisions this one already lists, with a badge each.
	 *
	 * THE COMPANION LOOKUP IS NOT SYMMETRIC, and that is a property of the
	 * works rather than an omission. 68 of the Catechism's 100 index rows —
	 * the Prologue and all 67 articles — have no counterpart DIVISION, because
	 * the Compendium prints no articles; those fall back to the condensation
	 * vote, which answers "which questions condense these paragraphs" instead.
	 * All 32 of the Compendium's own divisions pair structurally, so nothing
	 * needs the fallback in the other direction.
	 */
	import {
		condensingQuestionRun,
		getCccStructure,
		getCompendiumStructure,
		getWork
	} from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import type { StructureNode } from '$lib/types';
	import CopyrightNotice from './CopyrightNotice.svelte';
	import IndexSidebarToc from './IndexSidebarToc.svelte';
	import ReadingBar from './ReadingBar.svelte';
	import StructureIndex from './StructureIndex.svelte';
	import { indexSidebarItems, siblingLink } from './indexToc';

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

	// Structural pairing first, then the condensation vote. The order is not
	// arbitrary: a part, section or chapter has a counterpart DIVISION in the
	// Compendium, which is a stronger statement than "these questions cite
	// these paragraphs".
	const sibling = $derived((node: StructureNode) => {
		let span: readonly [number | null, number | null] | undefined = pairs.get(node)?.paragraphs;
		if (!span) {
			const [from, to] = node.paragraphs;
			if (Number.isFinite(from) && Number.isFinite(to)) {
				span = condensingQuestionRun(from as number, to as number);
			}
		}
		return siblingLink(span, {
			href: (n) => hrefFor({ kind: 'compendiumChapter', n }),
			unit: 'Q',
			abbrev: t('compendium.abbrev'),
			workTitle: t('compendium.landing.title')
		});
	});
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
		<StructureIndex
			{tree}
			{lang}
			href={(n) => hrefFor({ kind: 'cccChapter', n })}
			unit="¶"
			noAddressLabel={t('ccc.noParagraphNumber')}
			{sibling}
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
