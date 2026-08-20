<script lang="ts">
	/**
	 * A whole CCC chapter in one page — the destination of the
	 * "read the full chapter" link on `/catechismus/[n]`.
	 *
	 * Continuous prose rather than the single-paragraph route's card: no
	 * per-paragraph headings, no prev/next paragraph nav, just the text with
	 * its numbers set in the margin, which is how the Catechism is actually
	 * printed and how anyone reading more than one paragraph at a time wants
	 * it. Each paragraph keeps an `id` so `/catechismus/caput/27#p31` addresses a
	 * specific paragraph within the chapter, and so the link back from a
	 * single paragraph can land the reader where they already were.
	 */
	import { page } from '$app/state';
	import { flattenCccStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
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
	import { useScrollSpy } from '$lib/scroll-spy.svelte';
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { CccParagraph } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `useEditionCompare` picks which embedded language is active from
	// `content.langFor`, reactively, and resolves compare mode's second
	// edition against it — see that module's docblock for the shared
	// reasoning (why this is free of any fetch, the `availableLangs[0]`
	// fallback, why an absent language is skipped rather than indexed blind,
	// work id vs. bare language tag).
	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('catechism')
	);
	const heading = $derived(
		editions.current ? displayTitle(editions.current.chapter, editions.lang) : undefined
	);
	const structure = $derived(flattenCccStructure(editions.lang));

	/**
	 * Compare mode, paragraph by paragraph across the whole chapter.
	 *
	 * Chapter BOUNDARIES can genuinely diverge between EN and PT
	 * (docs/decisions.md: "the vatican.va editions genuinely diverge in a few
	 * article groupings" — ccc.pt has 480 structure nodes to ccc.en's 396),
	 * so the chapter this URL names may cover a different paragraph RANGE in
	 * each language even though both chapters open at the same paragraph
	 * number `n`. `alignByNumber` already does the right thing about that
	 * without any special-casing here: a paragraph only one language's
	 * chapter reaches renders as a row with a gap on the other side, exactly
	 * like a genuine missing-translation gap would.
	 */

	// BROWSER-ONLY side effect — see `bible/[book]/[chapter]/+page.svelte`'s
	// `citedRange` docblock and `compare-pref.svelte.ts`'s `syncFromUrl`.
	/**
	 * Which paragraph the reader has scrolled to. This view is a whole
	 * chapter on one page, so the sidebar's position cannot come from the
	 * URL — `currentN` was the chapter's FIRST paragraph, fixed, which meant
	 * the table of contents marked the chapter's opening no matter how far
	 * into it the reader had read.
	 *
	 * Fed the `id="p{n}"` anchors the paragraphs already carry for `#p{n}`
	 * deep links, so the spy cannot disagree with the page. Browser-only —
	 * `useScrollSpy` runs inside `$effect` — so the initial render is
	 * unaffected, and falls back to the chapter's first paragraph before the
	 * first measurement.
	 */
	const spy = useScrollSpy(() =>
		(editions.current?.paragraphs ?? []).map((p) => [`p${p.n}`, p.n] as const)
	);

	adoptCompareFromUrl();

	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber(editions.current.paragraphs, editions.secondary.paragraphs)
			: []
	);

	// Scroll the reader to the paragraph they arrived from. SvelteKit restores
	// a `#hash` on navigation, but arriving here from `/ccc/31`'s footer link
	// there is no hash to restore — the link carries the paragraph as the
	// hash precisely so this works, and this effect covers the case where the
	// element only exists after the language-dependent render.
	$effect(() => {
		if (editions.current) setPosition(editions.current.work.id, headingText(), page.url.pathname);
	});

	function headingText(): string {
		if (!editions.current) return '';
		const dt = displayTitle(editions.current.chapter, editions.lang);
		return dt.ordinal ? `${dt.ordinal} ${dt.title}` : dt.title;
	}
</script>

<svelte:head>
	<title>{headingText()} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(paragraph: CccParagraph)}
	<div class="para" class:in-brief={paragraph.in_brief}>
		<div class="para-text">
			<CccParagraphText {paragraph} lang={editions.lang} />
		</div>
	</div>
{/snippet}

{#snippet rightCell(paragraph: CccParagraph)}
	<div class="para" class:in-brief={paragraph.in_brief}>
		<div class="para-text">
			<CccParagraphText {paragraph} lang={editions.secondaryLang ?? editions.lang} />
		</div>
	</div>
{/snippet}

{#if editions.current && heading}
	{@const from = editions.current.chapter.paragraphs[0]}
	{@const to = editions.current.chapter.paragraphs[1]}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/catechismus">{t('nav.ccc')}</a>
			</nav>

			<div class="title-row">
				<h1>
					{#if heading.ordinal}<span class="ordinal">{heading.ordinal}</span>{/if}
					{heading.title}
				</h1>
				{#if editions.others.length > 0}
					<div class="compare-toolbar">
						<CompareToggle active={editions.compareActive} onclick={toggleCompare} />
					</div>
				{/if}
			</div>
			<p class="range">¶{from}–{to}</p>

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
							editions={editions.others.map((e) => e.work)}
							current={editions.secondaryWorkId}
							onselect={chooseComparisonEdition}
						/>
					{/snippet}
				</CompareGrid>
			{:else}
				<div class="reading-text ccc-body chapter-body" lang={editions.current.work.language}>
					{#each editions.current.paragraphs as paragraph, i (paragraph.n)}
						<section class="para" id={`p${paragraph.n}`} class:in-brief={paragraph.in_brief}>
							<!-- The number is a link back to the paragraph's own page: this
						     view is for reading, that one for citing and cross-linking,
						     and a reader who wants the second from inside the first
						     should not have to go back through the TOC. -->
							<ReferenceNumber
								n={paragraph.n}
								href={`/catechismus/${paragraph.n}`}
								label={`CCC ${paragraph.n}`}
								placement="margin"
							/>
							<!-- The CSS `::first-letter` drop cap works here (unlike in the
							     Bible reader) precisely because the margin reference is absolutely
						     positioned: the first inline content of `.para-text` really
						     is the first letter of the prose. Opening paragraph only,
						     and never on an "in brief" summary block. -->
							<div class="para-text" class:drop-cap={i === 0 && !paragraph.in_brief}>
								<CccParagraphText {paragraph} lang={editions.lang} />
							</div>
						</section>
					{/each}
				</div>
			{/if}
		</article>

		<!-- Same treatment as `/catechismus/[n]` — hidden below 80rem, no mobile
	     counterpart to preserve, and omitted entirely in compare mode (see
	     app.css's `.reading-layout.compare` docblock). `from` is this
	     language's actual matched chapter start (`getCccChapterFor`,
	     +page.ts), not the URL's `n`, which may fall mid-chapter in a
	     language whose tree diverges from the one `n` was minted against. -->
		<aside class="reading-aside">
			<StructureSidebarToc
				{structure}
				currentN={spy.current ?? from ?? undefined}
				lang={editions.lang}
				heading={t('ccc.tableOfContents')}
				basePath="/catechismus"
				outlineKinds={OUTLINE_KINDS}
			/>
		</aside>
	</div>
{/if}

<style>
	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.25rem;
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

	h1 .ordinal {
		color: var(--color-text-muted);
		margin-right: 0.35em;
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

	/* Paragraph numbers hang in the left margin where there's room for them,
	   the way the printed Catechism sets them. Below that width there is no
	   margin to hang into, so they fall back to sitting above the text (see
	   the media query) rather than eating into the measure. */
	.para {
		position: relative;
		margin-bottom: 1.1rem;
	}

	/* "In brief" summary blocks are set apart in the printed text too; without
	   this they read as just more prose in a wall of it. */
	.para.in-brief .para-text {
		border-inline-start: 2px solid var(--color-border);
		padding-inline-start: 0.9rem;
		font-size: max(var(--font-size-min), 0.95em);
		color: var(--color-text-muted);
	}

	/* No mobile counterpart exists to preserve — below `.reading-layout`'s
	   own breakpoint (app.css) this simply isn't shown. */
	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
