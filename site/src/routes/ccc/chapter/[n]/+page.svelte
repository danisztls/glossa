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
	import BookmarkButton from '$lib/components/BookmarkButton.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import EditionMenu from '$lib/components/EditionMenu.svelte';
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
	import { displayTitle, type DisplayTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { CccNode, CccParagraph, StructureNode } from '$lib/types';
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

	/** This chapter's canonical address. Derived at script scope rather than
	 *  from the `from` const in the template, because the sticky bar's
	 *  toolbar snippet is declared outside that block. */
	const chapterHref = $derived(
		editions.current ? `/catechismus/caput/${editions.current.chapter.paragraphs[0]}` : ''
	);

	/**
	 * The chapter's own ARTICLE headings, keyed by the paragraph each one
	 * opens at, so the continuous body can print them where the source does.
	 *
	 * Without them this view ran a whole chapter — 113 paragraphs, for the
	 * first chapter of the Decalogue — as one undivided column, with the ten
	 * commandments' own headings nowhere on the page. That was tolerable only
	 * while the sidebar stopped at chapter level too; now that it lists
	 * articles (`OUTLINE_KINDS`), a row has to have something to land on, and
	 * a bare paragraph number is not it.
	 *
	 * ARTICLES ONLY, matching the sidebar's floor exactly. The `sub` level
	 * below them (the roman-numeral subdivisions) is left out on purpose: it
	 * is 238 EN / 301 PT nodes, no sidebar row points at one, and printing all
	 * of them would replace one extreme with the other.
	 *
	 * Keyed by first paragraph rather than by index, because the two editions'
	 * chapter boundaries genuinely diverge (see the compare docblock above) —
	 * a paragraph number is the one address both languages agree on.
	 */
	const articleHeadings = $derived.by(() => {
		const byParagraph = new Map<number, DisplayTitle>();
		const walk = (nodes: CccNode[]) => {
			for (const node of nodes) {
				const at = node.paragraphs[0];
				if (node.kind === 'article' && Number.isFinite(at)) {
					byParagraph.set(at as number, displayTitle(node, editions.lang));
				}
				walk(node.children ?? []);
			}
		};
		walk(editions.current?.chapter.children ?? []);
		return byParagraph;
	});

	/**
	 * Where a sidebar row lands once this route has loaded. Article rows get
	 * the heading `articleHeadings` prints above their first paragraph;
	 * everything at chapter level and above is the page top already, so it
	 * gets no fragment at all.
	 */
	function anchorFor(node: StructureNode): string | undefined {
		if (node.kind !== 'article') return undefined;
		const at = node.paragraphs[0];
		return Number.isFinite(at) ? `s${at}` : undefined;
	}

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

<!-- The sticky bar's slots (`CompareGrid`'s `controls`): both pickers moved
     here out of the header block, and the page-level buttons out of the
     breadcrumb row, so all four stay reachable at any scroll depth. -->
{#snippet compareLeftControl()}
	<EditionMenu />
{/snippet}

{#snippet compareRightControl()}
	<ComparisonEditionMenu
		editions={editions.others.map((e) => e.work)}
		current={editions.secondaryWorkId}
		onselect={chooseComparisonEdition}
	/>
{/snippet}

{#snippet compareToolbar()}
	<BookmarkButton href={chapterHref} />
	<CompareToggle active={editions.compareActive} onclick={toggleCompare} />
{/snippet}

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
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/catechismus">{t('nav.ccc')}</a>
				</nav>
				<!-- Only outside compare mode: while comparing, both of these live in
				     the sticky bar instead, where they stay reachable at any scroll
				     depth (`CompareGrid`'s `controls`). -->
				{#if !editions.compareActive}
					<div class="compare-toolbar">
						<BookmarkButton href={`/catechismus/caput/${from}`} />
						{#if editions.others.length > 0}
							<CompareToggle active={editions.compareActive} onclick={toggleCompare} />
						{/if}
					</div>
				{/if}
			</div>

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
				{@const secondaryFrom = editions.secondary.chapter.paragraphs[0]}
				{@const secondaryTo = editions.secondary.chapter.paragraphs[1]}
				<!-- One row per field (`.compare-unit-header`, app.css). The chapter
				     TITLE is translated and always splits; the RANGE beneath it is a
				     pair of paragraph numbers, which the CCC's EN/PT symmetry
				     guarantee (CLAUDE.md) says match — so it collapses, and on the
				     rare chapter where it doesn't, the split is itself the finding. -->
				<div class="compare-unit-header">
					<div
						class="compare-unit-field compare-unit-field-left"
						lang={editions.current.work.language}
					>
						<h1>
							{#if heading.ordinal}<span class="ordinal">{heading.ordinal}</span>{/if}
							{heading.title}
						</h1>
					</div>
					<div
						class="compare-unit-field compare-unit-field-right"
						lang={editions.secondary.work.language}
					>
						<h1>
							{#if secondaryHeading.ordinal}<span class="ordinal">{secondaryHeading.ordinal}</span
								>{/if}
							{secondaryHeading.title}
						</h1>
					</div>

					{#if from === secondaryFrom && to === secondaryTo}
						<div class="compare-unit-field compare-unit-field-shared">
							<p class="range">¶{from}–{to}</p>
						</div>
					{:else}
						<div class="compare-unit-field compare-unit-field-left">
							<p class="range">¶{from}–{to}</p>
						</div>
						<div class="compare-unit-field compare-unit-field-right">
							<p class="range">¶{secondaryFrom}–{secondaryTo}</p>
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
				<div class="title-row">
					<h1>
						{#if heading.ordinal}<span class="ordinal">{heading.ordinal}</span>{/if}
						{heading.title}
					</h1>
					<EditionMenu />
				</div>
				<p class="range">¶{from}–{to}</p>

				<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>
			{/if}

			{#if editions.compareActive && editions.secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={editions.current.work.language}
					rightLang={editions.secondary.work.language}
					leftLabel={editions.current.work.short_title}
					rightLabel={editions.secondary.work.short_title}
					left={leftCell}
					right={rightCell}
					unit={(n) => ({
						href: `/catechismus/${n}`,
						canonicalHref: `/catechismus/${n}`,
						label: `CCC ${n}`,
						anchorId: `p${n}`
					})}
					controls={{
						left: compareLeftControl,
						right: compareRightControl,
						toolbar: compareToolbar
					}}
				/>
			{:else}
				<div class="reading-text ccc-body chapter-body" lang={editions.current.work.language}>
					{#each editions.current.paragraphs as paragraph, i (paragraph.n)}
						{@const articleHeading = articleHeadings.get(paragraph.n)}
						{#if articleHeading}
							<h2 class="article-heading" id={`s${paragraph.n}`}>
								{#if articleHeading.ordinal}<span class="ordinal">{articleHeading.ordinal}</span
									>{/if}{articleHeading.title}
							</h2>
						{/if}
						<section
							class="para"
							id={`p${paragraph.n}`}
							class:in-brief={paragraph.in_brief}
							class:bookmarked={bookmarks.has(`/catechismus/${paragraph.n}`)}
						>
							<!-- The number is a link back to the paragraph's own page: this
						     view is for reading, that one for citing and cross-linking,
						     and a reader who wants the second from inside the first
						     should not have to go back through the TOC. That page is also
						     the paragraph's canonical address, so the popover bookmarks
						     and copies exactly what the number already pointed at. -->
							<ReferenceNumber
								n={paragraph.n}
								href={`/catechismus/${paragraph.n}`}
								canonicalHref={`/catechismus/${paragraph.n}`}
								label={`CCC ${paragraph.n}`}
								placement="margin"
							/>
							<!-- Opening paragraph only, and never on an "in brief" summary
						     block. The component does the splitting: `::first-letter`
						     used to do this job here, and could not stop swallowing the
						     opening `«` — which four of the PT catechism's twenty
						     chapters begin with (see app.css). -->
							<div class="para-text">
								<CccParagraphText
									{paragraph}
									lang={editions.lang}
									dropCap={i === 0 && !paragraph.in_brief}
								/>
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
				basePath="/catechismus/caput"
				outlineKinds={OUTLINE_KINDS}
				{anchorFor}
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

	.compare-unit-field .copyright-notice {
		margin: 0 0 0.5rem;
	}

	.compare-unit-field :global(.menu) {
		margin-bottom: 0.5rem;
	}

	/* An article's own heading, printed inside the chapter's continuous body
	   where the source prints it. Set well below the chapter's `h1` in weight
	   and size — this is a division WITHIN the page, not a second title for it
	   — and given generous space above so it reads as a break in the column
	   rather than as a bolded first line of the paragraph beneath it.

	   `scroll-margin-top` is what makes the sidebar's `#s{n}` land on the
	   heading with room to breathe instead of flush against the viewport
	   edge. */
	.article-heading .ordinal {
		color: var(--color-text-muted);
		margin-right: 0.35em;
	}

	.article-heading {
		font-family: var(--font-serif);
		font-size: max(var(--font-size-min), 1.05em);
		font-weight: 600;
		margin: 2.25rem 0 1rem;
		scroll-margin-top: 1.5rem;
	}

	/* Never above the chapter's opening paragraph: the `h1` is already right
	   there, and the gap would read as a missing heading rather than as
	   space. */
	.article-heading:first-child {
		margin-top: 0;
	}

	/* Paragraph numbers hang in the left margin where there's room for them,
	   the way the printed Catechism sets them. Below that width there is no
	   margin to hang into, so they fall back to sitting above the text (see
	   the media query) rather than eating into the measure. */
	.para {
		position: relative;
		margin-bottom: 1.1rem;
	}

	/* The reader's own mark. A block-level wash rather than the inline one the
	   Bible verse uses, because a paragraph here is already its own block; the
	   number itself carries the same colour (ReferenceNumber's `.bookmarked`). */
	.para.bookmarked {
		background: color-mix(in srgb, var(--color-bookmark) 12%, transparent);
		border-radius: 0.25rem;
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
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
