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
	import { displayDocumentTitle, documentHeadingParts } from '$lib/titles';
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
	 * source prints it once. `division.depth` comes back from
	 * `socialDoctrineDivisions` rather than being looked up here by node
	 * identity, which never matched — see that function's docblock; until it
	 * did, the excluded node was the only one this printed twice.
	 */
	const innerHeadings = $derived.by(() => {
		const span = editions.current?.span;
		const byParagraph = new Map<number, { node: StructureNode; level: number }[]>();
		if (!span || !division) return byParagraph;
		const outerDepth = division.depth;
		for (const { node, depth } of rows) {
			const at = node.paragraphs[0];
			if (depth <= outerDepth || !Number.isFinite(at)) continue;
			const key = at as number;
			if (key < span[0] || key > span[1]) continue;
			// RELATIVE to the division, not absolute: the same roman-numeral
			// section is at tree depth 2 under a chapter and depth 1 under the
			// Introduction, and it is the same kind of heading on both pages.
			// Capped at 4 so a fifth level does not emit an `<h5>` nothing
			// styles — it takes the fourth's setting, which is already the
			// smallest.
			const level = Math.min(depth - outerDepth + 1, 4);
			byParagraph.set(key, [...(byParagraph.get(key) ?? []), { node, level }]);
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
						{#each innerHeadings.get(paragraph.n) ?? [] as row, h (row.node.anchor ?? row.node.title)}
							{@const dt = documentHeadingParts(row.node.title, editions.lang)}
							<!-- `id` on the first heading of a run only: they share a
							     paragraph, so they would share an anchor, and it is the
							     outermost one anything addresses.

							     THE TAG IS THE HEADING'S OWN LEVEL. Every one of these was
							     an `<h2>` until 2026-09-02, so a chapter's roman-numeral
							     sections and the lettered subsections inside them were the
							     same size on the page and the same rank to a screen reader
							     — the document said Economic Life had a dozen peers where
							     it has five. -->
							<svelte:element
								this={`h${row.level}`}
								class={`inner-heading level-${row.level}`}
								id={h === 0 ? `s${paragraph.n}` : undefined}
							>
								<!-- The division label the source prints (`CHAPTER SEVEN`) or
								     the list marker it prints instead (`I.`, `a)`) — never
								     both, because no heading carries both. -->
								{#if row.node.label}<span class="ordinal">{row.node.label}</span
									>{:else if dt.ordinal}<span class="marker">{dt.ordinal}</span>{/if}<HeadingText
									title={dt.title}
									node={row.node}
									lang={editions.lang}
									work={workId}
								/>
							</svelte:element>
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

	/* THE SOURCE'S OWN FOUR LEVELS, set apart. A chapter's roman-numeral
	   sections, the lettered subsections under them and anything deeper were
	   all one size until 2026-09-02, which made a page of Economic Life read
	   as a dozen equal headings rather than five sections with parts inside
	   them. Each step down takes a size and the space above it with it, so
	   the gap itself says which level is opening. */
	.inner-heading {
		font-family: var(--font-serif);
		margin: 2.5rem 0 1rem;
	}

	.inner-heading.level-2 {
		font-size: max(var(--font-size-min), 1.25em);
	}

	.inner-heading.level-3 {
		font-size: max(var(--font-size-min), 1.05em);
		font-weight: 600;
		margin: 1.9rem 0 0.75rem;
	}

	.inner-heading.level-4 {
		font-size: max(var(--font-size-min), 0.95em);
		font-weight: 600;
		margin: 1.4rem 0 0.6rem;
	}

	/* A heading directly under the one that opened its space: the gap is
	   already there, and a second full one reads as a missing paragraph. */
	.inner-heading + .inner-heading {
		margin-top: 0.75rem;
	}

	/* Never above the division's opening paragraph — the `h1` is right there,
	   and the gap would read as a missing heading rather than as space. */
	.inner-heading:first-child {
		margin-top: 0;
	}

	.inner-heading .ordinal {
		display: block;
	}

	/* The source's own list marker (`I.`, `a)`), split off the name by
	   `documentHeadingParts`. It stays on the heading's line and in the
	   heading's face — unlike `.ordinal` above, which is a division LABEL
	   standing over the name on a line of its own. It is what the reader
	   scans the column by, so it is not muted into apparatus. */
	.inner-heading .marker {
		margin-inline-end: 0.45em;
	}

	/* THE CONTAINING BLOCK FOR THE MARGIN NUMBER, and without it there were no
	   numbers on this page at all. `.reference-number.margin` is
	   `position: absolute` at `inset-inline-start: -3.25rem`
	   (`ReferenceNumber.svelte`), so it hangs off its nearest POSITIONED
	   ancestor — which, with no rule here, was whatever the app shell happened
	   to offer, putting every paragraph's number in one pile off the top of the
	   layout rather than one in each paragraph's margin. This route was written
	   from `/catechismus/caput/[n]`, whose `.para` carries the same two
	   declarations for the same reason; only the comment above them travelled.
	   The `margin-bottom` is that rule's other half: the numbers are what
	   separate one paragraph from the next here, so the gap between them has to
	   be larger than the gap between lines inside one. */
	.para {
		position: relative;
		margin-bottom: 1.1rem;
	}
</style>
