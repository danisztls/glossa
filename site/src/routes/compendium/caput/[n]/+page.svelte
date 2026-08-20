<script lang="ts">
	import { page } from '$app/state';
	import { flattenCompendiumStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CompendiumQa from '$lib/components/CompendiumQuestion.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import { alignByNumber } from '$lib/compare';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { useEditionCompare } from '$lib/edition-compare.svelte';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { setPosition } from '$lib/reading-position';
	import { useScrollSpy } from '$lib/scroll-spy.svelte';
	import { displayTitle } from '$lib/titles';
	import type { CompendiumQuestion } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `useEditionCompare` — see its docblock, and `/catechismus/caput/[n]`'s
	// identical call, for the shared reasoning (why comparing here is free of
	// any fetch, the `availableLangs[0]` fallback, why an absent language is
	// skipped rather than indexed blind, work id vs. bare language tag).
	// Chapter boundaries can diverge between EN and PT the same way the CCC's
	// do; `alignByNumber` in `compareRows` below already handles that.
	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('compendium')
	);
	const heading = $derived(
		editions.current ? displayTitle(editions.current.chapter, editions.lang) : undefined
	);
	const structure = $derived(flattenCompendiumStructure(editions.lang));

	adoptCompareFromUrl();

	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber(editions.current.questions, editions.secondary.questions)
			: []
	);
	const spy = useScrollSpy(() =>
		(editions.current?.questions ?? []).map((question) => [`q${question.n}`, question.n] as const)
	);

	function headingText(): string {
		if (!editions.current || !heading) return '';
		return heading.ordinal ? `${heading.ordinal} ${heading.title}` : heading.title;
	}

	$effect(() => {
		if (editions.current) setPosition(editions.current.work.id, headingText(), page.url.pathname);
	});
</script>

<svelte:head>
	<title>{headingText()} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(question: CompendiumQuestion)}
	<CompendiumQa {question} lang={editions.lang} />
{/snippet}

{#snippet rightCell(question: CompendiumQuestion)}
	<CompendiumQa {question} lang={editions.secondaryLang ?? editions.lang} />
{/snippet}

{#if editions.current && heading}
	{@const from = editions.current.chapter.paragraphs[0]}
	{@const to = editions.current.chapter.paragraphs[1]}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/compendium">{t('nav.compendium')}</a>
			</nav>

			<div class="title-row">
				<h1>{headingText()}</h1>
				{#if editions.others.length > 0}
					<div class="compare-toolbar">
						<CompareToggle active={editions.compareActive} onclick={toggleCompare} />
					</div>
				{/if}
			</div>
			<p class="range">{from === to ? `Q${from}` : `Q${from}–${to}`}</p>
			<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>

			{#if editions.compareActive && editions.secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={editions.current.work.language}
					rightLang={editions.secondary.work.language}
					leftLabel={editions.current.work.short_title}
					rightLabel={editions.secondary.work.short_title}
					left={leftCell}
					right={rightCell}
				>
					{#snippet rightHeaderExtra()}
						<ComparisonEditionMenu
							editions={editions.others.map((edition) => edition.work)}
							current={editions.secondaryWorkId}
							onselect={chooseComparisonEdition}
						/>
					{/snippet}
				</CompareGrid>
			{:else}
				<div
					class="reading-text compendium-body chapter-body"
					lang={editions.current.work.language}
				>
					{#each editions.current.questions as item (item.n)}
						<CompendiumQa question={item} lang={editions.lang} href={`/compendium/${item.n}`} />
					{/each}
				</div>
			{/if}
		</article>

		<aside class="reading-aside">
			<StructureSidebarToc
				{structure}
				currentN={spy.current ?? from ?? undefined}
				lang={editions.lang}
				heading={t('compendium.tableOfContents')}
				basePath="/compendium/caput"
				outlineKinds={OUTLINE_KINDS}
			/>
		</aside>
	</div>
{/if}

<style>
	.title-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}
	h1 {
		font-family: var(--font-serif);
		margin: 0;
	}
	.range {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.copyright-notice {
		margin: 0 0 2rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
