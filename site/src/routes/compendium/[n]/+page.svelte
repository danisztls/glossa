<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { compareColumnLabel, flattenCompendiumStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CompareCopyrightHeader from '$lib/components/CompareCopyrightHeader.svelte';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { displayTitle } from '$lib/titles';
	import { setPosition } from '$lib/reading-position';
	import CompendiumQa from '$lib/components/CompendiumQuestion.svelte';
	import RefText from '$lib/components/RefText.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import UnitNav from '$lib/components/UnitNav.svelte';
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
		const right = new Map([editions.secondary.question].map((q) => [q.n, q.ccc_refs]));
		for (const q of [editions.current.question]) {
			if (q.ccc_refs && right.get(q.n) === q.ccc_refs) out.set(q.n, q.ccc_refs);
		}
		return out;
	});

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

{#if editions.current}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/compendium">{t('nav.compendium')}</a>
					{#each editions.current.breadcrumb as node (node.title + node.paragraphs.join('-'))}
						{@const dt = displayTitle(node, editions.lang)}
						{@const from = node.paragraphs[0]}
						<span class="sep">›</span>
						<!-- Nullable bounds, as on the CCC breadcrumb: no lower bound, no
						     address, so the crumb keeps its text and loses its link. -->
						<a href={from === null ? undefined : hrefFor({ kind: 'compendium', n: from })}>
							{dt.title}
						</a>
					{/each}
				</nav>
			</div>

			<!-- Edition, comparison, bookmark and print, in that order and in both
			     modes — see `ReadingBar`. Everything it carries used to be spread
			     across the breadcrumb row, the title row and the site header. -->
			<ReadingBar
				bookmarkHref={hrefFor({ kind: 'compendium', n: data.n })}
				canCompare={editions.others.length > 0}
				compareActive={editions.compareActive}
				onToggleCompare={toggleCompare}
				comparison={{
					editions: editions.others.map((e) => e.work),
					current: editions.secondaryWorkId,
					onselect: chooseComparisonEdition
				}}
			/>

			<!--
				A visually-hidden h1 keeps the document outline/SEO title numbered
				("Question 12") without presenting the reading question itself as a
				heading -- the Q&A rhythm below (badge + italic question) is the
				visible presentation instead (see the module's job #5).
			-->
			<h1 class="visually-hidden">{t('compendium.question')} {data.n}</h1>

			{#if editions.compareActive && editions.secondary}
				<!-- The visible header for compare mode: copyright notice and
				     edition picker, per edition, side by side — the h1 above stays
				     a single visually-hidden label (it's an a11y-only "Question 12"
				     landmark, not visible content, so duplicating it per column
				     would add nothing a screen reader wants twice). -->
				<!-- One row per field (`.compare-unit-header`, app.css). Neither
				     field can collapse: the copyright notices link to different
				     source pages, and the two pickers are different controls. -->
				<CompareCopyrightHeader left={editions.current.work} right={editions.secondary.work} />
			{:else}
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
						// Its own page, and no `anchorId` — same single-unit case as
						// `catechismus/[n]`, see that route for the reasoning.
						href: hrefFor({ kind: 'compendium', n }),
						canonicalHref: hrefFor({ kind: 'compendium', n }),
						label: `${t('compendium.question')} ${n}`
					})}
					apparatus={{ has: (n) => sharedRefs.has(n), render: sharedCccRefs }}
				/>
			{:else}
				<div class="reading-text compendium-body" lang={editions.current.work.language}>
					<CompendiumQa question={editions.current.question} lang={editions.lang} />
				</div>
			{/if}

			<UnitNav
				ariaLabel="Question navigation"
				prev={editions.current.prev && {
					href: hrefFor({ kind: 'compendium', n: editions.current.prev.n }),
					label: t('compendium.prevQuestion'),
					detail: String(editions.current.prev.n)
				}}
				next={editions.current.next && {
					href: hrefFor({ kind: 'compendium', n: editions.current.next.n }),
					label: t('compendium.nextQuestion'),
					detail: String(editions.current.next.n)
				}}
			/>
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
	.copyright-notice {
		margin: 0 0 1.25rem;
	}
</style>
