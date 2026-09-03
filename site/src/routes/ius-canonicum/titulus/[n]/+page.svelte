<script lang="ts">
	/**
	 * A whole reading unit of the Code in one page — the destination of the
	 * "read the whole title" link on `/ius-canonicum/[n]`.
	 *
	 * Continuous prose with the canon numbers set in the margin, the way
	 * `/doctrina-socialis/caput/[n]` and `/catechismus/caput/[n]` read, and
	 * each canon keeps an `id` so `#p{n}` addresses one within the page.
	 *
	 * THE INNER HEADINGS ARE THE REASON THIS IS NOT A LIST OF CANONS. A title
	 * runs from one canon to a hundred and thirteen, under the source's own
	 * chapters and articles; without them the widest unit is an undivided
	 * column of legal text with its chapters nowhere on the page.
	 */
	import { page } from '$app/state';
	import { canonLawDivisions, compareColumnLabel, flattenCanonLawOutline } from '$lib/corpus';
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
	import { canonLawHeadingHref, canonLawTitleText, canonLawTrail } from '$lib/canonLawNav';
	import { displayDocumentTitle, documentHeadingParts } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection, StructureNode } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('canon-law')
	);

	const workId = $derived(editions.current?.work.id);
	const rows = $derived(flattenCanonLawOutline(editions.lang));

	const division = $derived(
		canonLawDivisions(editions.lang).find(({ from }) => from === editions.current?.span?.[0])
	);

	const heading = $derived(
		division
			? canonLawTitleText(displayDocumentTitle(division.node.title, editions.lang).title)
			: ''
	);

	/** The headings above this unit, and the unit itself as the last crumb —
	 *  cut at its own depth, because the trail runs on down to whatever
	 *  chapter opens at the same canon and those are the page's own body. */
	const trail = $derived(
		division ? canonLawTrail(editions.lang, division.from).slice(0, division.depth + 1) : []
	);

	/**
	 * The unit's own inner headings, keyed by the canon each opens at.
	 *
	 * A LIST per canon, not one heading: a chapter and its first article
	 * legitimately open on the same canon, and both must print, outermost
	 * first — which is the order this depth-first array already gives. The
	 * unit's OWN node is excluded; it is the page's `<h1>`.
	 */
	const innerHeadings = $derived.by(() => {
		const span = editions.current?.span;
		const byCanon = new Map<number, { node: StructureNode; level: number }[]>();
		if (!span || !division) return byCanon;
		const outerDepth = division.depth;
		for (const { node, depth } of rows) {
			const at = node.paragraphs[0];
			if (depth <= outerDepth || !Number.isFinite(at)) continue;
			const key = at as number;
			if (key < span[0] || key > span[1]) continue;
			// RELATIVE to the unit, not absolute: a chapter is at tree depth 4
			// under a title in Book II and depth 2 under one in Book III, and it
			// is the same kind of heading on both pages. Capped at 4 so a fifth
			// level does not emit an `<h5>` nothing styles.
			const level = Math.min(depth - outerDepth + 1, 4);
			byCanon.set(key, [...(byCanon.get(key) ?? []), { node, level }]);
		}
		return byCanon;
	});

	const spy = useScrollSpy(() =>
		(editions.current?.canons ?? []).map((c) => [`p${c.n}`, c.n] as const)
	);

	adoptCompareFromUrl();

	const unitHref = $derived(
		editions.current ? hrefFor({ kind: 'canonLawTitle', n: editions.current.span[0] }) : ''
	);

	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber(editions.current.canons, editions.secondary.canons)
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
			routeHref={(n) => canonLawHeadingHref(editions.lang, n)}
			deriveMarkers={false}
		/>
	{/snippet}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
					<a href="/ius-canonicum">{t('nav.canonLaw')}</a>
					{#each trail as crumb, i (crumb.node.anchor ?? crumb.node.title)}
						{@const dt = documentHeadingParts(crumb.node.title, editions.lang)}
						{@const at = crumb.node.paragraphs[0]}
						{@const last = i === trail.length - 1}
						<!-- THE LABEL VERBATIM: `marker()`'s short form numbers a row by
						     its position among its TREE siblings, and the Code restarts
						     `TITLE I` inside every book and part, so four different
						     places would read `Tit. 1`. -->
						<span class="sep">›</span>
						<a
							href={last || !Number.isFinite(at)
								? undefined
								: canonLawHeadingHref(editions.lang, at as number)}
							aria-current={last ? 'page' : undefined}
						>
							{#if crumb.node.label}<span class="ordinal label-micro">{crumb.node.label}</span
								>{:else if dt.ordinal}<span class="ordinal">{dt.ordinal}</span
								>{/if}{canonLawTitleText(dt.title)}
						</a>
					{/each}
				</nav>
			</div>

			<ReadingBar
				toc={{ label: t('document.tableOfContents'), content: tocList }}
				bookmarkHref={unitHref}
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
					? canonLawTitleText(
							displayDocumentTitle(division.node.title, editions.secondaryLang ?? editions.lang)
								.title
						)
					: ''}
				<!-- The division's TITLE is translated and so always splits; the
				     RANGE below it is a pair of canon numbers, which these seven
				     editions agree on by construction — they are translations of
				     one divided text — so it collapses, and a split there would
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
						{#snippet left()}<p class="range">{from}–{to}</p>{/snippet}
						{#snippet right()}<p class="range">
								{editions.secondary?.span[0]}–{editions.secondary?.span[1]}
							</p>{/snippet}
					</CompareField>

					<CompareCopyrightField left={editions.current.work} right={editions.secondary.work} />
				</div>
			{:else}
				{@render divisionTitle(division?.node.label, heading)}
				<p class="range">{t('canonLaw.canons')} {from}–{to}</p>

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
						href: hrefFor({ kind: 'canonLaw', n }),
						canonicalHref: hrefFor({ kind: 'canonLaw', n }),
						label: `${t('canonLaw.canon')} ${n}`,
						anchorId: `p${n}`
					})}
				/>
			{:else}
				<div class="reading-text chapter-body" lang={editions.current.work.language}>
					{#each editions.current.canons as canon, i (canon.n)}
						{#each innerHeadings.get(canon.n) ?? [] as row, h (row.node.anchor ?? row.node.title)}
							{@const dt = documentHeadingParts(row.node.title, editions.lang)}
							<!-- `id` on the first heading of a run only: they share a
							     canon, so they would share an anchor, and it is the
							     outermost one anything addresses. -->
							<svelte:element
								this={`h${row.level}`}
								class={`inner-heading level-${row.level}`}
								id={h === 0 ? `s${canon.n}` : undefined}
							>
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
							id={`p${canon.n}`}
							class:unit-bookmarked={bookmarks.has(hrefFor({ kind: 'canonLaw', n: canon.n }))}
						>
							<!-- The number links back to the canon's own page: this view
							     is for reading, that one for citing, and that page is also
							     its canonical address. -->
							<ReferenceNumber
								n={canon.n}
								href={hrefFor({ kind: 'canonLaw', n: canon.n })}
								canonicalHref={hrefFor({ kind: 'canonLaw', n: canon.n })}
								label={`${t('canonLaw.canon')} ${canon.n}`}
								placement="margin"
							/>
							<div class="para-text">
								<ProseBlocks unit={canon} lang={editions.lang} work={workId} dropCap={i === 0} />
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

	/* The division's printed label — `TITLE IV`, `TITULUS IV` — set as the
	   identifier it is while the heading beside it stays the name. */
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

	/* The source's own levels, set apart — each step down takes a size and the
	   space above it, so the gap itself says which level is opening. */
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

	.inner-heading:first-child {
		margin-top: 0;
	}

	.inner-heading .ordinal {
		display: block;
	}

	.inner-heading .marker {
		margin-inline-end: 0.45em;
	}

	/* THE CONTAINING BLOCK FOR THE MARGIN NUMBER — `.reference-number.margin`
	   is `position: absolute` and hangs off its nearest POSITIONED ancestor,
	   so without this every canon's number piles up off the top of the layout
	   instead of sitting in its own margin. The `margin-bottom` is that rule's
	   other half: the numbers are what separate one canon from the next. */
	.para {
		position: relative;
		margin-bottom: 1.1rem;
	}
</style>
