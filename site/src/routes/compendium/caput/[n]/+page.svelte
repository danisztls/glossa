<script lang="ts">
	import { page } from '$app/state';
	import { compareColumnLabel, flattenCompendiumStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CompendiumQa from '$lib/components/CompendiumQuestion.svelte';
	import RefText from '$lib/components/RefText.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
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

	/**
	 * Which questions the two editions cite the SAME CCC paragraphs for — and
	 * so which of them print that line ONCE beneath the pair instead of once
	 * inside each column (`CompareGrid`'s `apparatus`). A question's
	 * cross-references are a property of the question, not of either
	 * translation of it, which is why printing them twice said something
	 * untrue; it is the same rule `.compare-unit-header` applies to a title or
	 * a range, one level further down.
	 *
	 * Compared as raw strings rather than parsed reference sets: the two
	 * editions transcribe the same list, so anything that is not
	 * character-identical is a difference worth showing rather than
	 * normalising away — and a normaliser here would be the second
	 * implementation of one `RefText` already owns.
	 */
	const sharedRefs = $derived.by(() => {
		const out = new Map<number, string>();
		if (!(editions.current && editions.secondary)) return out;
		const right = new Map(editions.secondary.questions.map((q) => [q.n, q.ccc_refs]));
		for (const q of editions.current.questions) {
			if (q.ccc_refs && right.get(q.n) === q.ccc_refs) out.set(q.n, q.ccc_refs);
		}
		return out;
	});

	/** This chapter's canonical address. Derived at script scope rather than
	 *  from the `from` const in the template, because the sticky bar's
	 *  toolbar snippet is declared outside that block. */
	const chapterHref = $derived(
		editions.current ? `/compendium/caput/${editions.current.chapter.paragraphs[0]}` : ''
	);

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

<!-- What identifies the second column in `ReadingBar` — see that component
     for why the route supplies it rather than the bar building its own. -->
{#snippet comparisonEdition()}
	<ComparisonEditionMenu
		editions={editions.others.map((edition) => edition.work)}
		current={editions.secondaryWorkId}
		onselect={chooseComparisonEdition}
	/>
{/snippet}

{#snippet sharedCccRefs(n: number)}
	<p class="ccc-refs-shared">
		<span class="refs-label">{t('compendium.condenses')}</span>
		<RefText text={sharedRefs.get(n) ?? ''} lang={editions.lang} />
	</p>
{/snippet}

{#snippet leftCell(question: CompendiumQuestion)}
	<CompendiumQa {question} lang={editions.lang} showRefs={!sharedRefs.has(question.n)} />
{/snippet}

{#snippet rightCell(question: CompendiumQuestion)}
	<CompendiumQa
		{question}
		lang={editions.secondaryLang ?? editions.lang}
		showRefs={!sharedRefs.has(question.n)}
	/>
{/snippet}

{#if editions.current && heading}
	{@const from = editions.current.chapter.paragraphs[0]}
	{@const to = editions.current.chapter.paragraphs[1]}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/compendium">{t('nav.compendium')}</a>
				</nav>
			</div>

			<!-- Edition, comparison, bookmark and print, in that order and in both
			     modes — see `ReadingBar`. Everything it carries used to be spread
			     across the breadcrumb row, the title row and the site header. -->
			<ReadingBar
				bookmarkHref={chapterHref}
				canCompare={editions.others.length > 0}
				compareActive={editions.compareActive}
				onToggleCompare={toggleCompare}
				comparison={comparisonEdition}
			/>

			{#if editions.compareActive && editions.secondary}
				<!-- Compare mode's WHOLE header, merged into one two-column block —
				     same reasoning as `documents/[slug]` and the Bible chapter
				     route: heading, range, copyright notice and edition picker all
				     differ by edition. `showHeader={false}` below drops
				     `CompareGrid`'s own label row in favour of this one. The
				     bookmark/compare-toggle controls are up in `.breadcrumb-row`
				     now, not repeated here. -->
				{@const secondaryHeading = displayTitle(
					editions.secondary.chapter,
					editions.secondaryLang ?? editions.lang
				)}
				{@const secondaryHeadingText = secondaryHeading.ordinal
					? `${secondaryHeading.ordinal} ${secondaryHeading.title}`
					: secondaryHeading.title}
				{@const secondaryFrom = editions.secondary.chapter.paragraphs[0]}
				{@const secondaryTo = editions.secondary.chapter.paragraphs[1]}
				<!-- One row per field (`.compare-unit-header`, app.css). The chapter
				     TITLE is translated and always splits; the RANGE is a pair of
				     question numbers, which the Compendium's EN/PT symmetry guarantee
				     (CLAUDE.md) says match — so it collapses, and a split there is
				     itself the finding. -->
				<div class="compare-unit-header">
					<div
						class="compare-unit-field compare-unit-field-left"
						lang={editions.current.work.language}
					>
						<h1>{headingText()}</h1>
					</div>
					<div
						class="compare-unit-field compare-unit-field-right"
						lang={editions.secondary.work.language}
					>
						<h1>{secondaryHeadingText}</h1>
					</div>

					{#if from === secondaryFrom && to === secondaryTo}
						<div class="compare-unit-field compare-unit-field-shared">
							<p class="range">{from === to ? `Q${from}` : `Q${from}–${to}`}</p>
						</div>
					{:else}
						<div class="compare-unit-field compare-unit-field-left">
							<p class="range">{from === to ? `Q${from}` : `Q${from}–${to}`}</p>
						</div>
						<div class="compare-unit-field compare-unit-field-right">
							<p class="range">
								{secondaryFrom === secondaryTo
									? `Q${secondaryFrom}`
									: `Q${secondaryFrom}–${secondaryTo}`}
							</p>
						</div>
					{/if}

					<!-- Never collapsed: the two notices read alike and link to
					     different source pages (see `documents/[slug]`). -->
					<div
						class="compare-unit-field compare-unit-field-left"
						lang={editions.current.work.language}
					>
						<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>
					</div>
					<div
						class="compare-unit-field compare-unit-field-right"
						lang={editions.secondary.work.language}
					>
						<p class="copyright-notice"><CopyrightNotice manifest={editions.secondary.work} /></p>
					</div>
				</div>
			{:else}
				<h1>{headingText()}</h1>
				<p class="range">{from === to ? `Q${from}` : `Q${from}–${to}`}</p>
				<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>
			{/if}

			{#if editions.compareActive && editions.secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={editions.current.work.language}
					rightLang={editions.secondary.work.language}
					leftLabel={compareColumnLabel(editions.current.work)}
					rightLabel={compareColumnLabel(editions.secondary.work)}
					left={leftCell}
					right={rightCell}
					unit={(n) => ({
						href: `/compendium/${n}`,
						canonicalHref: `/compendium/${n}`,
						label: `${t('compendium.question')} ${n}`,
						anchorId: `q${n}`
					})}
					apparatus={{ has: (n) => sharedRefs.has(n), render: sharedCccRefs }}
				/>
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
	}

	.compare-unit-field h1 {
		margin: 0 0 0.25rem;
	}

	.compare-unit-field .copyright-notice {
		margin: 0 0 0.5rem;
	}

	.compare-unit-field :global(.menu) {
		margin-bottom: 0.5rem;
	}
	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
