<script lang="ts">
	/**
	 * The Compendium's own index.
	 *
	 * IT HAD NONE UNTIL 2026-09-04, and the omission was reasoned rather than
	 * forgotten: `/catechismus` presents both works a row at a time
	 * (`CatechismIndex.svelte`), so a second index of the same outline looked
	 * like a duplicate. What that argument missed is WHICH READER each page is
	 * for. `/catechismus` is a table of DIVISIONS — parts, sections, chapters —
	 * offering each one in two works. The Compendium is not read as divisions.
	 * It is 598 questions, and `docs/research/audiences.md` §5 names it as the
	 * one work here written "for exactly this reader": someone who was told to
	 * read the Catechism, does not know the Compendium is a different and
	 * shorter book, and arrives holding a question rather than an address.
	 *
	 * That reader could reach a question only by knowing its number. So the
	 * shortest, plainest work in the corpus was the one with no front door, and
	 * the site's whole answer to a reader without the vocabulary was a page
	 * whose first column is the Catechism.
	 *
	 * ## The same component, one column
	 *
	 * Nothing here is new machinery. `CatechismIndex` already renders a
	 * single-column outline, because four languages carry the Compendium and no
	 * Catechism (`hu`, `ro`, `sl`, `sv`) and the shared page has to work for
	 * them — so this page is that case made reachable in every language rather
	 * than only in the four that force it. `catechismRowLinks` with
	 * `tree: 'compendium'` addresses every row against the Compendium itself:
	 * a division opens its chapter-level page, a sub-heading is addressed as
	 * the question it starts at.
	 *
	 * THE LANGUAGE IS THE COMPENDIUM'S OWN, not the pair's. `/catechismus`
	 * resolves one language for both works together (`catechismPairLang`), so a
	 * reader whose language has only one of them is never shown an English
	 * column beside their own. There is no pair here to keep whole, so the
	 * ordinary per-type resolution applies.
	 */
	import MessageCircleQuestionMark from '@lucide/svelte/icons/message-circle-question-mark';
	import { getCompendiumStructure, getWork } from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import StructureIndex from '$lib/components/StructureIndex.svelte';
	import { catechismRowLinks } from '$lib/components/catechismRows';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode } from '$lib/types';

	const lang = $derived(content.langFor('compendium'));
	const work = $derived(getWork(`compendium.${lang}`));
	const tree = $derived(work ? getCompendiumStructure(lang) : []);

	// One column, so no pairing: `pairs` is consulted only to find a row's
	// counterpart in the OTHER work, and there is no other work on this page.
	const links = $derived((node: StructureNode) =>
		catechismRowLinks(node, {
			tree: 'compendium',
			lang,
			columns: ['compendium'],
			pairs: new Map<StructureNode, StructureNode>(),
			labels: {
				cccTitle: t('ccc.landing.title'),
				compendiumTitle: t('compendium.landing.title')
			}
		})
	);

	const workColumns = $derived([{ label: t('nav.compendium'), icon: MessageCircleQuestionMark }]);
</script>

<svelte:head>
	<title>{t('compendium.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="index-column">
	{#if work}
		<ReadingBar print={false} />
	{/if}

	<h1>{t('compendium.landing.title')}</h1>
	<p class="page-tagline">{t('compendium.landing.tagline')}</p>

	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	{#if tree.length > 0}
		<StructureIndex
			{tree}
			{lang}
			{links}
			{workColumns}
			noCounterpartLabel={t('ccc.noCounterpart')}
		/>
	{/if}
</div>

<style>
	/* `/catechismus`'s measure, for the same reason: this is a table, and a
	   table's width is what its columns need. One column needs less than two,
	   but the two pages sit a click apart and a reader moving between them
	   should not watch the page change shape. */
	.index-column {
		max-width: 52rem;
		margin-inline: auto;
		padding-inline: 1.25rem;
	}

	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
	}

	.page-tagline {
		max-width: 40rem;
	}

	.copyright-notice {
		margin: 0 0 1.5rem;
	}
</style>
