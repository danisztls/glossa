<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { flattenCompendiumStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import { setPosition } from '$lib/reading-position';
	import CompendiumQa from '$lib/components/CompendiumQuestion.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import EditionMenu from '$lib/components/EditionMenu.svelte';
	import BookmarkButton from '$lib/components/BookmarkButton.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import { alignByNumber } from '$lib/compare';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { useEditionCompare } from '$lib/edition-compare.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { CompendiumQuestion } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `useEditionCompare` picks which of `data.byLang`'s embedded languages
	// (see +page.ts) to render, reactively, from the reader's current content
	// language, and resolves compare mode's second edition against it — see
	// that module's docblock for the shared reasoning (why this costs
	// nothing extra, the fallback-to-whatever's-available behaviour for a
	// gappy fixture or v1 corpus asymmetry, why an absent language is
	// skipped rather than indexed blind, work id vs. bare language tag).
	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('compendium')
	);

	// Same index-backed, no-fetch call `/compendium/+page.svelte` makes for
	// the full table of contents, just recomputed for whichever language is
	// active on this page.
	const structure = $derived(flattenCompendiumStructure(editions.lang));

	adoptCompareFromUrl();

	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber([editions.current.question], [editions.secondary.question])
			: []
	);

	onMount(() => {
		setPosition(
			'compendium.' + editions.lang,
			`${t('compendium.question')} ${data.n}`,
			page.url.pathname
		);
	});
</script>

<svelte:head>
	<title>{t('compendium.question')} {data.n} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(question: CompendiumQuestion)}
	<CompendiumQa {question} lang={editions.lang} />
{/snippet}

{#snippet rightCell(question: CompendiumQuestion)}
	<CompendiumQa {question} lang={editions.secondaryLang ?? editions.lang} />
{/snippet}

{#if editions.current}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/compendium">{t('nav.compendium')}</a>
					{#each editions.current.breadcrumb as node (node.title + node.paragraphs.join('-'))}
						{@const dt = displayTitle(node, editions.lang)}
						<span class="sep">›</span>
						<a href={`/compendium/${node.paragraphs[0]}`}>{dt.title}</a>
					{/each}
				</nav>
				<div class="compare-toolbar">
					<BookmarkButton href={`/compendium/${data.n}`} />
					{#if editions.others.length > 0}
						<CompareToggle active={editions.compareActive} onclick={toggleCompare} />
					{/if}
				</div>
			</div>

			<div class="title-row">
				<!--
				A visually-hidden h1 keeps the document outline/SEO title numbered
				("Question 12") without presenting the reading question itself as a
				heading -- the Q&A rhythm below (badge + italic question) is the
				visible presentation instead (see the module's job #5).
			-->
				<h1 class="visually-hidden">{t('compendium.question')} {data.n}</h1>
				<!-- While comparing, EditionMenu moves into the left column's own
				     header (`.compare-unit-header` below) next to the comparison
				     picker on the right — there's only one column for it up here
				     once compare mode is off. -->
				{#if !editions.compareActive}<EditionMenu />{/if}
			</div>

			{#if editions.compareActive && editions.secondary}
				<!-- The visible header for compare mode: copyright notice and
				     edition picker, per edition, side by side — the h1 above stays
				     a single visually-hidden label (it's an a11y-only "Question 12"
				     landmark, not visible content, so duplicating it per column
				     would add nothing a screen reader wants twice). -->
				<div class="compare-unit-header">
					<div class="compare-unit-header-col" lang={editions.current.work.language}>
						<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>
						<EditionMenu />
					</div>
					<div class="compare-unit-header-col" lang={editions.secondary.work.language}>
						<p class="copyright-notice"><CopyrightNotice manifest={editions.secondary.work} /></p>
						<ComparisonEditionMenu
							editions={editions.others.map((e) => e.work)}
							current={editions.secondaryWorkId}
							onselect={chooseComparisonEdition}
						/>
					</div>
				</div>
			{:else}
				<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>
			{/if}

			{#if editions.compareActive && editions.secondary}
				<!-- `showHeader={false}`: the label + picker this header would
				     otherwise print are already up in `.compare-unit-header`
				     above. -->
				<CompareGrid
					rows={compareRows}
					leftLang={editions.current.work.language}
					rightLang={editions.secondary.work.language}
					leftLabel={editions.current.work.short_title}
					rightLabel={editions.secondary.work.short_title}
					left={leftCell}
					right={rightCell}
					showHeader={false}
				/>
			{:else}
				<div class="reading-text compendium-body" lang={editions.current.work.language}>
					<CompendiumQa question={editions.current.question} lang={editions.lang} />
				</div>
			{/if}

			<nav class="unit-nav" aria-label="Question navigation">
				{#if editions.current.prev}
					<a href={`/compendium/${editions.current.prev.n}`} rel="prev"
						>&larr; {t('compendium.prevQuestion')} · {editions.current.prev.n}</a
					>
				{:else}
					<span></span>
				{/if}
				{#if editions.current.next}
					<a href={`/compendium/${editions.current.next.n}`} rel="next"
						>{t('compendium.nextQuestion')} · {editions.current.next.n} &rarr;</a
					>
				{/if}
			</nav>
		</article>

		<!-- No mobile counterpart to preserve — this route had no chapter/TOC
		     navigation in the reading view before this sidebar existed, so it's
		     hidden below `.reading-layout`'s own 80rem breakpoint (app.css and
		     the media query below) rather than shown as a plain block after
		     the text. Omitted entirely in compare mode — see app.css's
		     `.reading-layout.compare` docblock. -->
		<aside class="reading-aside">
			<StructureSidebarToc
				{structure}
				currentN={data.n}
				lang={editions.lang}
				heading={t('compendium.tableOfContents')}
				basePath="/compendium"
				outlineKinds={OUTLINE_KINDS}
			/>
		</aside>
	</div>
{/if}

<style>
	.title-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.copyright-notice {
		margin: 0 0 1.25rem;
	}

	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
