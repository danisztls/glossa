<script lang="ts">
	/**
	 * A whole division of the Compendium of the Social Doctrine in one page —
	 * the destination of the "read the whole chapter" link on
	 * `/doctrina-socialis/[n]`.
	 *
	 * Continuous prose with the numbers set in the margin, the way
	 * `/catechismus/caput/[n]` reads a Catechism chapter, and each paragraph
	 * keeps an `id` so `#p{n}` addresses one within the page.
	 *
	 * THE INNER HEADINGS ARE THE REASON THIS IS NOT A LIST OF PARAGRAPHS.
	 * A chapter here runs 20 to 68 paragraphs under a dozen or more of the
	 * source's own headings, and without them it is one undivided column with
	 * the roman-numeral sections nowhere on the page.
	 */
	import { page } from '$app/state';
	import {
		compareColumnLabel,
		flattenSocialDoctrineOutline,
		socialDoctrineDivisions
	} from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
	import HeadingText from '$lib/components/HeadingText.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import CompareField from '$lib/components/CompareField.svelte';
	import CompareCopyrightField from '$lib/components/CompareCopyrightField.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
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
	import { hrefFor } from '$lib/address';
	import { displayDocumentTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection, StructureNode } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('social-doctrine')
	);

	const workId = $derived(editions.current?.work.id);
	const rows = $derived(flattenSocialDoctrineOutline(editions.lang));

	const division = $derived(
		socialDoctrineDivisions(editions.lang).find(({ from }) => from === editions.current?.span?.[0])
	);

	const heading = $derived(
		division ? displayDocumentTitle(division.node.title, editions.lang).title : ''
	);

	/**
	 * The division's own inner headings, keyed by the paragraph each opens at.
	 *
	 * A LIST per paragraph, not one heading, and for the reason the Catechism's
	 * chapter view records: a section and its first subsection legitimately
	 * open on the same paragraph, and both must print, outermost first — which
	 * is the order this already-depth-first array gives.
	 *
	 * The division's OWN node is excluded: it is the page's `<h1>`, and the
	 * source prints it once.
	 */
	const innerHeadings = $derived.by(() => {
		const span = editions.current?.span;
		const byParagraph = new Map<number, StructureNode[]>();
		if (!span || !division) return byParagraph;
		const outerDepth = rows.find((row) => row.node === division.node)?.depth ?? 0;
		for (const { node, depth } of rows) {
			const at = node.paragraphs[0];
			if (depth <= outerDepth || !Number.isFinite(at)) continue;
			const key = at as number;
			if (key < span[0] || key > span[1]) continue;
			byParagraph.set(key, [...(byParagraph.get(key) ?? []), node]);
		}
		return byParagraph;
	});

	const spy = useScrollSpy(() =>
		(editions.current?.paragraphs ?? []).map((p) => [`p${p.n}`, p.n] as const)
	);

	adoptCompareFromUrl();

	const chapterHref = $derived(
		editions.current ? hrefFor({ kind: 'socialDoctrineChapter', n: editions.current.span[0] }) : ''
	);

	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber(editions.current.paragraphs, editions.secondary.paragraphs)
			: []
	);

	$effect(() => {
		if (editions.current) setPosition(editions.current.work.id, heading, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{heading} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(section: DocumentSection)}
	<div class="para-text">
		<ProseBlocks unit={section} lang={editions.lang} work={workId} />
	</div>
{/snippet}

{#snippet rightCell(section: DocumentSection)}
	<div class="para-text">
		<ProseBlocks
			unit={section}
			lang={editions.secondaryLang ?? editions.lang}
			work={editions.secondaryWorkId ?? workId}
		/>
	</div>
{/snippet}

{#snippet divisionTitle(label: string | undefined, title: string)}
	<h1>
		{#if label}<span class="ordinal">{label}</span>{/if}
		{title}
	</h1>
{/snippet}

{#if editions.current}
	{@const from = editions.current.span[0]}
	{@const to = editions.current.span[1]}
	{#snippet tocList()}
		<StructureSidebarToc
			structure={rows}
			currentN={spy.current ?? from}
			lang={editions.lang}
			heading={t('document.tableOfContents')}
			routeHref={(n) => hrefFor({ kind: 'socialDoctrine', n })}
		/>
	{/snippet}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
					<a href="/doctrina-socialis">{t('nav.socialDoctrine')}</a>
					<span class="sep">›</span>
					<a href={undefined} aria-current="page">{heading}</a>
				</nav>
			</div>

			<ReadingBar
				toc={{ label: t('document.tableOfContents'), content: tocList }}
				bookmarkHref={chapterHref}
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
				{@const secondaryTitle = division
					? displayDocumentTitle(division.node.title, editions.secondaryLang ?? editions.lang).title
					: ''}
				<!-- The division's TITLE is translated and so always splits; the
				     RANGE below it is a pair of paragraph numbers, which these ten
				     editions agree on by construction — they are translations of
				     one numbered text — so it collapses, and a split there would
				     itself be the finding. -->
				<div class="compare-unit-header">
					<CompareField
						leftLang={editions.current.work.language}
						rightLang={editions.secondary.work.language}
						leftTag={compareColumnLabel(editions.current.work)}
						rightTag={compareColumnLabel(editions.secondary.work)}
					>
						{#snippet left()}{@render divisionTitle(division?.node.label, heading)}{/snippet}
						{#snippet right()}{@render divisionTitle(
								division?.node.label,
								secondaryTitle
							)}{/snippet}
					</CompareField>

					<CompareField
						shared={from === editions.secondary.span[0] && to === editions.secondary.span[1]}
					>
						{#snippet left()}<p class="range">¶{from}–{to}</p>{/snippet}
						{#snippet right()}<p class="range">
								¶{editions.secondary?.span[0]}–{editions.secondary?.span[1]}
							</p>{/snippet}
					</CompareField>

					<CompareCopyrightField left={editions.current.work} right={editions.secondary.work} />
				</div>
			{:else}
				{@render divisionTitle(division?.node.label, heading)}
				<p class="range">¶{from}–{to}</p>

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
						href: hrefFor({ kind: 'socialDoctrine', n }),
						canonicalHref: hrefFor({ kind: 'socialDoctrine', n }),
						label: `CSDC ${n}`,
						anchorId: `p${n}`
					})}
				/>
			{:else}
				<div class="reading-text chapter-body" lang={editions.current.work.language}>
					{#each editions.current.paragraphs as paragraph, i (paragraph.n)}
						{#each innerHeadings.get(paragraph.n) ?? [] as node, h (node.anchor ?? node.title)}
							<!-- `id` on the first heading of a run only: they share a
							     paragraph, so they would share an anchor, and it is the
							     outermost one anything addresses. -->
							<h2 class="inner-heading" id={h === 0 ? `s${paragraph.n}` : undefined}>
								{#if node.label}<span class="ordinal">{node.label}</span>{/if}<HeadingText
									title={displayDocumentTitle(node.title, editions.lang).title}
									{node}
									lang={editions.lang}
									work={workId}
								/>
							</h2>
						{/each}
						<section
							class="para"
							id={`p${paragraph.n}`}
							class:unit-bookmarked={bookmarks.has(
								hrefFor({ kind: 'socialDoctrine', n: paragraph.n })
							)}
						>
							<!-- The number links back to the paragraph's own page: this
							     view is for reading, that one for citing, and that page is
							     also its canonical address — so the popover bookmarks and
							     copies exactly what the number already pointed at. -->
							<ReferenceNumber
								n={paragraph.n}
								href={hrefFor({ kind: 'socialDoctrine', n: paragraph.n })}
								canonicalHref={hrefFor({ kind: 'socialDoctrine', n: paragraph.n })}
								label={`CSDC ${paragraph.n}`}
								placement="margin"
							/>
							<div class="para-text">
								<ProseBlocks
									unit={paragraph}
									lang={editions.lang}
									work={workId}
									dropCap={i === 0}
								/>
							</div>
						</section>
					{/each}
				</div>
			{/if}
		</article>

		<aside class="reading-aside">
			{@render tocList()}
		</aside>
	</div>
{/if}

<style>
	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.25rem;
	}

	/* The division's printed label — `CHAPTER ONE`, `CAPITOLO PRIMO` — set as
	   the identifier it is while the heading beside it stays the name. */
	.ordinal {
		display: block;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.range {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.copyright-notice {
		margin: 0 0 1.5rem;
	}

	.inner-heading {
		font-family: var(--font-serif);
		margin: 2.5rem 0 1rem;
	}

	.inner-heading .ordinal {
		display: block;
	}
</style>
