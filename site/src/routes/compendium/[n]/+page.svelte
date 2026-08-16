<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { flattenCompendiumStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import { setPosition } from '$lib/reading-position';
	import CompendiumAnswer from '$lib/components/CompendiumAnswer.svelte';
	import RefText from '$lib/components/RefText.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import { alignByNumber, isCompareRequested, withCompareParam } from '$lib/compare';
	import { t } from '$lib/i18n.svelte';
	import type { CompendiumQuestion } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Every language this question has in the corpus is already embedded in
	// `data.byLang` (see +page.ts) — this just picks which one to render,
	// reactively, from the reader's current content language. Falls back to
	// whichever language actually has this question if the preferred one
	// doesn't (a gappy fixture, or a v1 corpus asymmetry) rather than
	// 404-ing a page that has real content in another language.
	let lang = $derived(
		data.byLang[content.langFor('compendium')]
			? content.langFor('compendium')
			: Object.keys(data.byLang)[0]
	);
	let current = $derived(data.byLang[lang]);

	// Same index-backed, no-fetch call `/compendium/+page.svelte` makes for
	// the full table of contents, just recomputed for whichever language is
	// active on this page.
	const structure = $derived(flattenCompendiumStructure(lang));

	/** Compare mode for one question: both languages are already embedded
	 *  (`+page.ts`), so — same as `/ccc/[n]` — comparing here costs nothing
	 *  extra. */
	const availableLangs = $derived(Object.keys(data.byLang));
	const secondaryLang = $derived(availableLangs.find((l) => l !== lang));
	const secondary = $derived(secondaryLang ? data.byLang[secondaryLang] : undefined);

	const compareRequested = $derived.by(() => (browser ? isCompareRequested(page.url) : false));
	const compareActive = $derived(
		compareRequested && current !== undefined && secondary !== undefined
	);

	function toggleCompare() {
		goto(withCompareParam(page.url, !compareActive), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	const compareRows = $derived(
		current && secondary ? alignByNumber([current.question], [secondary.question]) : []
	);

	onMount(() => {
		setPosition('compendium.' + lang, `${t('compendium.question')} ${data.n}`, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{t('compendium.question')} {data.n} — {t('home.title')}</title>
</svelte:head>

{#snippet questionCell(question: CompendiumQuestion, cellLang: string)}
	<p class="qa-question">
		<span class="qa-label" aria-hidden="true">Q</span>
		{question.question}
	</p>
	<div class="qa-answer">
		<span class="qa-label" aria-hidden="true">A</span>
		<div class="qa-answer-body">
			<CompendiumAnswer blocks={question.answer_blocks} />
		</div>
	</div>
	{#if question.ccc_refs}
		<p class="ccc-refs">
			<span class="refs-label">{t('compendium.condenses')}</span>
			<RefText text={question.ccc_refs} lang={cellLang} />
		</p>
	{/if}
{/snippet}

{#snippet leftCell(question: CompendiumQuestion)}
	{@render questionCell(question, lang)}
{/snippet}

{#snippet rightCell(question: CompendiumQuestion)}
	{@render questionCell(question, secondaryLang ?? lang)}
{/snippet}

<div class="reading-layout" class:compare={compareActive}>
	<article class="content-column">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/compendium">{t('nav.compendium')}</a>
			{#each current.breadcrumb as node (node.title + node.paragraphs.join('-'))}
				{@const dt = displayTitle(node, lang)}
				<span class="sep">›</span>
				<a href={`/compendium/${node.paragraphs[0]}`}>{dt.title}</a>
			{/each}
		</nav>

		<div class="title-row">
			<!--
			A visually-hidden h1 keeps the document outline/SEO title numbered
			("Question 12") without presenting the reading question itself as a
			heading -- the Q&A rhythm below (badge + italic question) is the
			visible presentation instead (see the module's job #5).
		-->
			<h1 class="visually-hidden">{t('compendium.question')} {data.n}</h1>
			{#if secondary}
				<div class="compare-toolbar">
					<CompareToggle active={compareActive} onclick={toggleCompare} />
				</div>
			{/if}
		</div>

		<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>

		{#if compareActive && secondary}
			<CompareGrid
				rows={compareRows}
				leftLang={current.work.language}
				rightLang={secondary.work.language}
				leftLabel={current.work.short_title}
				rightLabel={secondary.work.short_title}
				left={leftCell}
				right={rightCell}
			/>
		{:else}
			<div class="reading-text compendium-body" lang={current.work.language}>
				<p class="qa-question">
					<span class="qa-label" aria-hidden="true">Q</span>
					<span class="visually-hidden">{t('compendium.question')} {data.n}</span>
					{current.question.question}
				</p>

				<div class="qa-answer">
					<span class="qa-label" aria-hidden="true">A</span>
					<span class="visually-hidden">{t('compendium.answer')}</span>
					<div class="qa-answer-body">
						<CompendiumAnswer blocks={current.question.answer_blocks} />
					</div>
				</div>

				{#if current.question.ccc_refs}
					<p class="ccc-refs">
						<span class="refs-label">{t('compendium.condenses')}</span>
						<RefText text={current.question.ccc_refs} {lang} />
					</p>
				{/if}
			</div>
		{/if}

		<nav class="question-nav" aria-label="Question navigation">
			{#if current.prev}
				<a href={`/compendium/${current.prev.n}`} rel="prev"
					>&larr; {t('compendium.prevQuestion')} · {current.prev.n}</a
				>
			{:else}
				<span></span>
			{/if}
			{#if current.next}
				<a href={`/compendium/${current.next.n}`} rel="next"
					>{t('compendium.nextQuestion')} · {current.next.n} &rarr;</a
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
			{lang}
			heading={t('compendium.tableOfContents')}
			basePath="/compendium"
			outlineKinds={OUTLINE_KINDS}
		/>
	</aside>
</div>

<style>
	.breadcrumb {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.breadcrumb a {
		text-decoration: none;
		color: var(--color-text-muted);
	}

	.breadcrumb .sep {
		margin: 0 0.35em;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.title-row .compare-toolbar {
		margin: 0;
	}

	.copyright-notice {
		margin: 0 0 1.25rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/*
	 * Q&A rhythm: a lettered badge (Q/A) sits in its own column so the
	 * question reads as a question and the answer as a reply beneath it,
	 * rather than as a numbered heading over a plain paragraph. Sizes stay
	 * relative (em) to the inherited `.reading-text` size so this scales
	 * along with the reader's font-size preference (--reading-scale) instead
	 * of competing with it.
	 */
	.qa-question {
		display: flex;
		gap: 0.75em;
		align-items: baseline;
		margin: 0 0 1.25em;
		font-weight: 600;
		font-style: italic;
	}

	.qa-answer {
		display: flex;
		gap: 0.75em;
		align-items: flex-start;
		margin: 0 0 1.5em;
	}

	.qa-label {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		border-radius: 50%;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		color: var(--color-accent);
		font-family: var(--font-sans);
		font-style: normal;
		font-weight: 700;
		font-size: 0.8em;
	}

	.qa-answer-body {
		flex: 1;
		min-width: 0;
	}

	.ccc-refs {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		border-top: 1px solid var(--color-border);
		padding-top: 0.75rem;
	}

	.refs-label {
		margin-right: 0.4em;
	}

	.question-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.95rem;
	}

	.question-nav a {
		text-decoration: none;
	}

	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
