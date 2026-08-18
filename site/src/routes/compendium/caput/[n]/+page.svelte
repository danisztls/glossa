<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { flattenCompendiumStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CompendiumAnswer from '$lib/components/CompendiumAnswer.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import RefText from '$lib/components/RefText.svelte';
	import { alignByNumber, withCompareParam } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { setPosition } from '$lib/reading-position';
	import { useScrollSpy } from '$lib/scroll-spy.svelte';
	import { displayTitle } from '$lib/titles';
	import type { CompendiumQuestion } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const availableLangs = $derived(Object.keys(data.byLang));
	const lang = $derived(
		data.byLang[content.langFor('compendium')] ? content.langFor('compendium') : availableLangs[0]
	);
	const current = $derived(data.byLang[lang]);
	const heading = $derived(current ? displayTitle(current.chapter, lang) : undefined);
	const structure = $derived(flattenCompendiumStructure(lang));
	const otherEditions = $derived(
		availableLangs
			.filter((language) => language !== lang)
			.flatMap((language) => {
				const entry = data.byLang[language];
				return entry ? [{ lang: language, work: entry.work }] : [];
			})
	);
	const fallbackWorkId = $derived(otherEditions[0]?.work.id);

	$effect(() => {
		if (browser) compare.syncFromUrl(page.url);
	});

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			otherEditions.map((edition) => edition.work.id),
			fallbackWorkId
		)
	);
	const secondaryLang = $derived(
		otherEditions.find((edition) => edition.work.id === secondaryWorkId)?.lang
	);
	const secondary = $derived(secondaryLang ? data.byLang[secondaryLang] : undefined);
	const compareActive = $derived(current !== undefined && secondary !== undefined);
	const compareRows = $derived(
		current && secondary ? alignByNumber(current.questions, secondary.questions) : []
	);
	const spy = useScrollSpy(() =>
		(current?.questions ?? []).map((question) => [`q${question.n}`, question.n] as const)
	);

	function toggleCompare() {
		compare.toggle();
		goto(withCompareParam(page.url, compare.paramValue), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function chooseComparisonEdition(id: string) {
		compare.set(id);
		goto(withCompareParam(page.url, compare.paramValue), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function headingText(): string {
		if (!current || !heading) return '';
		return heading.ordinal ? `${heading.ordinal} ${heading.title}` : heading.title;
	}

	$effect(() => {
		if (current) setPosition(current.work.id, headingText(), page.url.pathname);
	});
</script>

<svelte:head>
	<title>{headingText()} — {t('home.title')}</title>
</svelte:head>

{#snippet qa(question: CompendiumQuestion, questionLang: string)}
	<p class="qa-question">
		<span class="qa-label" aria-hidden="true">Q</span>
		{question.question}
	</p>
	<div class="qa-answer">
		<span class="qa-label" aria-hidden="true">A</span>
		<div class="qa-answer-body"><CompendiumAnswer blocks={question.answer_blocks} /></div>
	</div>
	{#if question.ccc_refs}
		<p class="ccc-refs">
			<span class="refs-label">{t('compendium.condenses')}</span>
			<RefText text={question.ccc_refs} lang={questionLang} />
		</p>
	{/if}
{/snippet}

{#snippet leftCell(question: CompendiumQuestion)}
	{@render qa(question, lang)}
{/snippet}

{#snippet rightCell(question: CompendiumQuestion)}
	{@render qa(question, secondaryLang ?? lang)}
{/snippet}

{#if current && heading}
	{@const from = current.chapter.paragraphs[0]}
	{@const to = current.chapter.paragraphs[1]}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/compendium">{t('nav.compendium')}</a>
			</nav>

			<div class="title-row">
				<h1>{headingText()}</h1>
				{#if otherEditions.length > 0}
					<div class="compare-toolbar">
						<CompareToggle active={compareActive} onclick={toggleCompare} />
					</div>
				{/if}
			</div>
			<p class="range">{from === to ? `Q${from}` : `Q${from}–${to}`}</p>
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
				>
					{#snippet rightHeaderExtra()}
						<ComparisonEditionMenu
							editions={otherEditions.map((edition) => edition.work)}
							current={secondaryWorkId}
							onselect={chooseComparisonEdition}
						/>
					{/snippet}
				</CompareGrid>
			{:else}
				<div class="reading-text compendium-body chapter-body" lang={current.work.language}>
					{#each current.questions as item (item.n)}
						<section class="question" id={`q${item.n}`}>
							<a
								class="question-n"
								href={`/compendium/${item.n}`}
								aria-label={`${t('compendium.question')} ${item.n}`}>{item.n}</a
							>
							{@render qa(item, lang)}
						</section>
					{/each}
				</div>
			{/if}
		</article>

		<aside class="reading-aside">
			<StructureSidebarToc
				{structure}
				currentN={spy.current ?? from ?? undefined}
				{lang}
				heading={t('compendium.tableOfContents')}
				basePath="/compendium/caput"
				outlineKinds={OUTLINE_KINDS}
			/>
		</aside>
	</div>
{/if}

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
	.question {
		position: relative;
		margin-bottom: 2rem;
	}
	.question-n {
		position: absolute;
		inset-inline-start: -3.25rem;
		top: 0.15em;
		width: 2.75rem;
		text-align: end;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-apparatus);
		text-decoration: none;
	}
	.question-n:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}
	@media (max-width: 60rem) {
		.question-n {
			position: static;
			display: block;
			width: auto;
			text-align: start;
			margin-bottom: 0.15rem;
		}
	}
	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
