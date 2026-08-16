<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import { flattenDocumentStructure } from '$lib/corpus';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import { alignByNumber, withCompareParam } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `data.byLang` embeds every language this document has section `n` in
	// (see +page.ts — prerendered, so this can't be resolved against a
	// client preference at request time). `content.documentLangFor` picks
	// which embedded language is active, reactively; fall back to whatever
	// language *is* embedded if the preferred one somehow isn't (a v1 EN/PT
	// asymmetry — same posture as `ccc/[n]`/`compendium/[n]`).
	const availableLangs = $derived(Object.keys(data.byLang));
	const lang = $derived(
		data.byLang[content.documentLangFor(data.slug)]
			? content.documentLangFor(data.slug)
			: availableLangs[0]
	);
	const current = $derived(data.byLang[lang]);

	// Structure trees are INDEX tier (eager-inlined, synchronous — corpus.ts's
	// "Documents" section), so unlike `current.section` this needs no
	// `+page.ts` load step: read reactively for the `.reading-aside` TOC, the
	// same posture `documents/[slug]/+page.svelte`'s own TOC already takes.
	const structureRows = $derived(current ? flattenDocumentStructure(current.work.id) : []);

	/**
	 * Compare mode for one section: `+page.ts` embeds every language this
	 * document has section `n` in (its own docblock), so — same reasoning as
	 * `/ccc/[n]` — comparing here is free. Unlike the CCC/Compendium, a
	 * document's second language is NOT guaranteed to exist at all (a missing
	 * translation is legitimate and common — docs/decisions.md "Vatican
	 * documents in scope"), so `secondary` is genuinely undefined more often
	 * here, and the toggle simply doesn't render when it is (see markup).
	 */
	/** See `/ccc/[n]`'s identical block for the reasoning. Unlike the CCC,
	 *  `otherEditions` here is genuinely, routinely empty (a missing
	 *  translation is legitimate and common for documents), which is exactly
	 *  what already made `secondary` optional below. */
	const otherEditions = $derived(
		availableLangs.filter((l) => l !== lang).map((l) => ({ lang: l, work: data.byLang[l].work }))
	);
	const fallbackWorkId = $derived(otherEditions[0]?.work.id);

	// BROWSER-ONLY side effect — see `bible/[book]/[chapter]/+page.svelte`'s
	// `citedRange` docblock and `compare-pref.svelte.ts`'s `syncFromUrl`.
	$effect(() => {
		if (browser) compare.syncFromUrl(page.url);
	});

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			otherEditions.map((e) => e.work.id),
			fallbackWorkId
		)
	);
	const secondaryLang = $derived(otherEditions.find((e) => e.work.id === secondaryWorkId)?.lang);
	const secondary = $derived(secondaryLang ? data.byLang[secondaryLang] : undefined);
	const compareActive = $derived(current !== undefined && secondary !== undefined);

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

	const compareRows = $derived(
		current && secondary ? alignByNumber([current.section], [secondary.section]) : []
	);

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles the document's language mid-read too, same as `ccc/[n]`.
	$effect(() => {
		if (current) {
			setPosition(current.work.id, `${current.work.short_title} ${data.n}`, page.url.pathname);
		}
	});
</script>

<svelte:head>
	<title>{current?.work.short_title ?? data.slug} {data.n} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(section: DocumentSection)}
	<CccParagraphText paragraph={section} {lang} />
{/snippet}

{#snippet rightCell(section: DocumentSection)}
	<CccParagraphText paragraph={section} lang={secondaryLang ?? lang} />
{/snippet}

{#if current}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/documents">{t('nav.magisterium')}</a>
				<span class="sep">›</span>
				<a href={`/documents/${data.slug}`}>{current.work.short_title}</a>
				{#each current.breadcrumb as node (node.title + node.paragraphs.join('-'))}
					{@const dt = displayTitle(node, lang)}
					<span class="sep">›</span>
					{#if Number.isFinite(node.paragraphs[0])}
						<a href={`/documents/${data.slug}/${node.paragraphs[0]}`}>{dt.title}</a>
					{:else}
						<span>{dt.title}</span>
					{/if}
				{/each}
			</nav>

			<div class="title-row">
				<h1>{current.work.short_title} {data.n}</h1>
				{#if otherEditions.length > 0}
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
				>
					{#snippet rightHeaderExtra()}
						<ComparisonEditionMenu
							editions={otherEditions.map((e) => e.work)}
							current={secondaryWorkId}
							onselect={chooseComparisonEdition}
						/>
					{/snippet}
				</CompareGrid>
			{:else}
				<div class="reading-text document-body" lang={current.work.language}>
					<CccParagraphText paragraph={current.section} {lang} />
				</div>
			{/if}

			{#if current.breadcrumb.length > 0}
				{@const deepest = current.breadcrumb[current.breadcrumb.length - 1]}
				{@const dt = displayTitle(deepest, lang)}
				<!--
					Reading a single section is the citation case; this is the
					escape hatch to the reading case — same split, same markup, as
					`ccc/[n]`'s `.read-chapter` block. The hash carries this
					section's own number so the reader lands on the text they were
					already looking at rather than at the document's top, having
					lost their place as the price of getting context.
				-->
				<p class="read-chapter">
					<a href={`/documents/${data.slug}/read#s${data.n}`}>
						{t('document.readFullDocument')}
						<span class="chapter-name">
							{#if dt.ordinal}{dt.ordinal}{/if}
							{dt.title}
						</span>
						{#if Number.isFinite(deepest.paragraphs[0]) && Number.isFinite(deepest.paragraphs[1])}
							<span class="chapter-range"
								>§{deepest.paragraphs[0]}{deepest.paragraphs[1] !== deepest.paragraphs[0]
									? `–${deepest.paragraphs[1]}`
									: ''}</span
							>
						{/if}
					</a>
				</p>
			{:else}
				<p class="read-chapter">
					<a href={`/documents/${data.slug}/read#s${data.n}`}>
						{t('document.readFullDocument')}
					</a>
				</p>
			{/if}

			<nav class="section-nav" aria-label="Section navigation">
				{#if current.prev}
					<a href={`/documents/${data.slug}/${current.prev.n}`} rel="prev"
						>&larr; {t('document.prevSection')} · §{current.prev.n}</a
					>
				{:else}
					<span></span>
				{/if}
				{#if current.next}
					<a href={`/documents/${data.slug}/${current.next.n}`} rel="next"
						>{t('document.nextSection')} · §{current.next.n} &rarr;</a
					>
				{/if}
			</nav>
		</article>

		<!-- Omitted entirely in compare mode — see app.css's
		     `.reading-layout.compare` docblock. -->
		<aside class="reading-aside">
			<StructureSidebarToc
				structure={structureRows}
				currentN={data.n}
				{lang}
				heading={t('document.tableOfContents')}
				basePath={`/documents/${data.slug}`}
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

	.breadcrumb .sep {
		margin: 0 0.35em;
	}

	h1 {
		font-family: var(--font-serif);
		margin-top: 0;
	}

	.title-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.title-row h1 {
		margin: 0;
	}

	.title-row .compare-toolbar {
		margin: 0;
	}

	.copyright-notice {
		margin: 0 0 1rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.read-chapter {
		margin: 2rem 0 0;
		padding: 0.85rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-bg-elevated);
	}

	.read-chapter a {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		text-decoration: none;
	}

	.read-chapter .chapter-name {
		font-family: var(--font-serif);
		color: var(--color-text);
	}

	.read-chapter .chapter-range {
		margin-inline-start: auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.section-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.95rem;
	}

	.section-nav a {
		text-decoration: none;
	}
</style>
