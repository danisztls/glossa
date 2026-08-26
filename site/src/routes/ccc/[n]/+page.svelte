<script lang="ts">
	import { page } from '$app/state';
	import {
		cccParagraphExists,
		compareColumnLabel,
		flattenCccStructure,
		getCccCitations
	} from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { displayTitle } from '$lib/titles';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CitedBy from '$lib/components/CitedBy.svelte';
	import { documentCitedSource, type CitedByRow, type CitedBySource } from '$lib/cited-by';
	import CompareField from '$lib/components/CompareField.svelte';
	import CompareCopyrightField from '$lib/components/CompareCopyrightField.svelte';
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
	import type { CccParagraph } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `data.byLang` embeds every language the corpus has this paragraph in
	// (see +page.ts — this route renders only in the browser, `ssr = false`
	// in `+layout.ts`, but `load` only re-runs on navigation, so this can't
	// be resolved against a client preference at load time either).
	// `useEditionCompare`
	// (see its docblock for the shared reasoning: why this is free of any
	// fetch, the `availableLangs[0]` fallback, why an absent language is
	// skipped rather than indexed blind, work id vs. bare language tag)
	// picks which embedded language is active from `content.langFor`,
	// reactively, and resolves compare mode's second edition against it.
	//
	// Compare mode for a single paragraph specifically: the CCC's own EN/PT
	// language symmetry guarantee (docs/decisions.md — paragraph NUMBER sets
	// match across languages) means a second language is almost always
	// present.
	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('catechism')
	);

	adoptCompareFromUrl();

	// A single-paragraph comparison is still an `alignByNumber` call, not a
	// bespoke two-column special case: both sides carry the SAME paragraph
	// number `data.n` by construction (each is looked up by it in +page.ts),
	// so the result is always exactly one row when both languages exist —
	// but going through the shared function keeps this route consistent with
	// the chapter/multi-row callers rather than hand-rolling a degenerate
	// case that happens to look the same today.
	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber([editions.current.paragraph], [editions.secondary.paragraph])
			: []
	);

	// `related` cross-references may point outside whatever slice of the
	// corpus is actually present (always true for this fixture; possible
	// even for the real corpus if it's ever built/served partially) — only
	// link the ones we can actually resolve, and say so for the rest rather
	// than producing a dead link.
	function relatedExists(n: number): boolean {
		return cccParagraphExists(editions.lang, n);
	}

	// The sidebar's own tree, recomputed whenever the reader switches content
	// language mid-read — same index-backed, no-fetch call `/ccc/+page.svelte`
	// makes for the full table of contents (`getCccStructure`'s flattened
	// sibling), just for whichever language is active here.
	const structure = $derived(flattenCccStructure(editions.lang));

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles content language mid-read too, so "continue reading"
	// always points at the edition they were last actually looking at.
	$effect(() => {
		if (editions.current) setPosition(editions.current.work.id, `CCC ${data.n}`, page.url.pathname);
	});

	/**
	 * Which magisterial documents cite this paragraph — the other direction of
	 * the pass that lets a document say who cites IT
	 * (`scripts/build-xrefs.mjs`, docs/link-surface.md #12).
	 *
	 * ONE ROW, always, because the reader is standing on one paragraph and
	 * there is only one address to group by. That is the degenerate case of
	 * the same panel the Bible chapter and the documents use, and it renders
	 * as one because the shape is genuinely the same — not because the panel
	 * was bent to fit.
	 *
	 * IT IS RARE, and that is a fact about the corpus rather than a bug: 44 of
	 * the Catechism's 2,865 paragraphs have a citer, because a document can
	 * only cite the Catechism if it was written after 1992 and most of this
	 * corpus was not. The panel is simply absent on the rest.
	 */
	const citedInRows: CitedByRow[] = $derived.by(() => {
		const citers = getCccCitations(data.n);
		if (citers.length === 0) return [];
		const bySlug = new Map<string, number[]>();
		for (const citer of citers) {
			if (citer.kind !== 'document' || !citer.slug) continue;
			const list = bySlug.get(citer.slug);
			if (list) list.push(citer.n);
			else bySlug.set(citer.slug, [citer.n]);
		}
		const sources = [...bySlug]
			.map(([slug, sections]) => documentCitedSource(slug, sections))
			.filter((source): source is CitedBySource => source !== null)
			.sort((a, b) => a.label.localeCompare(b.label));
		return sources.length > 0 ? [{ key: data.n, label: `¶${data.n}`, sources }] : [];
	});
</script>

<svelte:head>
	<title>CCC {data.n} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(paragraph: CccParagraph)}
	<ProseBlocks unit={paragraph} lang={editions.lang} />
{/snippet}

{#snippet rightCell(paragraph: CccParagraph)}
	<ProseBlocks unit={paragraph} lang={editions.secondaryLang ?? editions.lang} />
{/snippet}

<!-- The paragraph's address, and the tag the CCC sets on a summary paragraph.
     Written once and rendered three times: the plain heading, and each column
     of the compare header — where the two can disagree about `in_brief`, which
     is the one thing that makes this a field with two sides at all. -->
{#snippet address(inBrief?: boolean)}
	<h1>
		{#if inBrief}
			<span class="in-brief-tag">{t('ccc.inBrief')}</span>
		{/if}
		CCC {data.n}
	</h1>
{/snippet}

{#if editions.current}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/catechismus">{t('nav.ccc')}</a>
					{#each editions.current.breadcrumb as node (node.title)}
						{@const dt = displayTitle(node, editions.lang)}
						{@const from = node.paragraphs[0]}
						<span class="sep">›</span>
						<!-- A structure node's paragraph bounds are nullable (`CccNode`), and
						     a node with no lower bound names no address — so it renders as
						     a crumb without a link rather than as `/catechismus/null`. -->
						<a href={from === null ? undefined : hrefFor({ kind: 'ccc', n: from })}>
							{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
							{dt.title}
						</a>
					{/each}
				</nav>
			</div>

			<!-- Edition, comparison, bookmark and print, in that order and in both
			     modes — see `ReadingBar`. Everything it carries used to be spread
			     across the breadcrumb row, the title row and the site header. -->
			<ReadingBar
				bookmarkHref={hrefFor({ kind: 'ccc', n: data.n })}
				canCompare={editions.others.length > 0}
				compareActive={editions.compareActive}
				onToggleCompare={toggleCompare}
				comparison={{
					editions: editions.others.map((e) => e.work),
					current: editions.secondaryWorkId,
					onselect: chooseComparisonEdition
				}}
			/>

			{#if editions.compareActive && editions.secondary}
				<!-- Read out here, not inside the field below: a snippet body does
				     not inherit the narrowing this `{#if}` performs, so
				     `editions.secondary` reads as possibly-undefined once it is
				     referenced from inside `{#snippet right()}`. -->
				{@const inBriefLeft = editions.current.paragraph.in_brief}
				{@const inBriefRight = editions.secondary.paragraph.in_brief}
				<!-- Compare mode's WHOLE header, merged into one two-column block —
				     same reasoning as `documents/[slug]` and the Bible chapter
				     route: the heading, copyright notice and edition picker all
				     differ by edition, so a single primary-edition-only copy above
				     `CompareGrid`'s own label row was always showing the second
				     column a header that wasn't its own. `showHeader={false}` below
				     drops that row in favour of this one. The bookmark/compare-toggle
				     controls are up in `.breadcrumb-row` now, not repeated here. -->
				<!-- One row per field (`.compare-unit-header`, app.css). The heading
				     collapses whenever it would print twice, which is almost always:
				     `CCC {n}` is the same address in every language by construction,
				     and the "in brief" tag beside it is an interface-language label
				     that the CCC's own EN/PT symmetry guarantee (CLAUDE.md) says is
				     set on the same paragraph numbers in both. It splits only when
				     the two editions genuinely disagree about that flag, which is a
				     defect worth seeing rather than smoothing over. -->
				<div class="compare-unit-header">
					<CompareField
						shared={inBriefLeft === inBriefRight}
						leftLang={editions.current.work.language}
						rightLang={editions.secondary.work.language}
					>
						{#snippet left()}{@render address(inBriefLeft)}{/snippet}
						{#snippet right()}{@render address(inBriefRight)}{/snippet}
					</CompareField>

					<CompareCopyrightField left={editions.current.work} right={editions.secondary.work} />
				</div>
			{:else}
				{@render address(editions.current.paragraph.in_brief)}

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
						// `href` is the canonical address, i.e. this very page: a
						// single-paragraph route has no in-page unit to view, and no
						// `anchorId` either. What the popover is worth here is its
						// other three actions — copy, copy link, bookmark — which
						// compare mode had no way to reach at all.
						href: hrefFor({ kind: 'ccc', n }),
						canonicalHref: hrefFor({ kind: 'ccc', n }),
						label: `CCC ${n}`
					})}
				/>
			{:else}
				<div class="reading-text ccc-body" lang={editions.current.work.language}>
					<ProseBlocks unit={editions.current.paragraph} lang={editions.lang} />
				</div>
			{/if}

			{#if editions.current.paragraph.related.length > 0}
				<p class="related">
					{t('ccc.related')}:
					{#each editions.current.paragraph.related as n, i (n)}
						{#if i > 0}·{/if}
						{#if relatedExists(n)}
							<a href={hrefFor({ kind: 'ccc', n })}>¶{n}</a>
						{:else}
							<span class="related-unresolved" title="Not in this fixture">¶{n}</span>
						{/if}
					{/each}
				</p>
			{/if}

			{#if citedInRows.length > 0}
				<CitedBy heading={t('refs.citedIn')} rows={citedInRows} />
			{/if}

			{#if editions.current.chapter}
				{@const dt = displayTitle(editions.current.chapter.node, editions.lang)}
				<!--
				Reading a single paragraph is the citation case; this is the
				escape hatch to the reading case. The hash carries this
				paragraph's own number so the reader lands on the text they
				were already looking at rather than at the chapter's top,
				having lost their place as the price of getting context.
			-->
				<p class="read-chapter">
					<a href={`/catechismus/caput/${editions.current.chapter.start}#p${data.n}`}>
						{t('ccc.readFullChapter')}
						<span class="chapter-name">
							{#if dt.ordinal}{dt.ordinal}{/if}
							{dt.title}
						</span>
						<span class="chapter-range"
							>¶{editions.current.chapter.start}–{editions.current.chapter.end}</span
						>
					</a>
				</p>
			{/if}

			<UnitNav
				ariaLabel="Paragraph navigation"
				prev={editions.current.prev && {
					href: hrefFor({ kind: 'ccc', n: editions.current.prev.n }),
					label: t('ccc.prevParagraph'),
					detail: `¶${editions.current.prev.n}`
				}}
				next={editions.current.next && {
					href: hrefFor({ kind: 'ccc', n: editions.current.next.n }),
					label: t('ccc.nextParagraph'),
					detail: `¶${editions.current.next.n}`
				}}
			/>
		</article>

		<!-- Hidden below 80rem, alongside `.reading-layout`'s own breakpoint
	     (app.css) — there is no pre-existing mobile presentation to preserve
	     here (this route had no chapter/TOC navigation in the reading view
	     before this sidebar existed), so the desktop-only addition is simply
	     absent on narrow viewports rather than duplicated like the Bible
	     picker. Omitted entirely in compare mode — see app.css's
	     `.reading-layout.compare` docblock. -->
		<aside class="reading-aside">
			<StructureSidebarToc
				{structure}
				currentN={data.n}
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
		margin-top: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.copyright-notice {
		margin: 0 0 1rem;
	}

	.in-brief-tag {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 0.25rem;
		padding: 0.1rem 0.4rem;
	}

	.related {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.related a {
		color: var(--color-text-muted);
	}

	.related-unresolved {
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
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
</style>
