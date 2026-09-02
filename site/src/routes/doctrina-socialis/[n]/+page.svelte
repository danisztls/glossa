<script lang="ts">
	/**
	 * One numbered paragraph of the Compendium of the Social Doctrine.
	 *
	 * THE CITATION VIEW, as `/catechismus/[n]` is for the Catechism: this is
	 * where `CSDC 160` resolves to, and `/doctrina-socialis/caput/{n}` is
	 * where it is read. The paragraph is a document's `DocumentSection`, so
	 * `ProseBlocks` renders its `html` blocks and its footnote apparatus
	 * exactly as an encyclical's — the difference between this work and a
	 * document is the address, not the text.
	 */
	import { page } from '$app/state';
	import {
		compareColumnLabel,
		flattenSocialDoctrineOutline,
		socialDoctrineDivisions
	} from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
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
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { socialDoctrineHeadingHref, socialDoctrineTrail } from '$lib/socialDoctrineNav';
	import { displayDocumentTitle, documentHeadingParts } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('social-doctrine')
	);

	/** Passed to every surface that linkifies this text. No edition of this
	 *  work is in `refs-grammar.ts`'s `WORK_CONFIGS` — it is passed so the
	 *  axis is reachable here as it is everywhere else, not because it
	 *  changes anything today. */
	const workId = $derived(editions.current?.work.id);

	const structure = $derived(flattenSocialDoctrineOutline(editions.lang));

	/**
	 * Every heading standing over this paragraph, outermost first — the trail
	 * `/catechismus/[n]` gets from its own loader and this page has to derive,
	 * because a document's outline carries no breadcrumb field.
	 *
	 * It printed ONE crumb until 2026-09-02, the division, so a reader looking
	 * at `CSDC 310` was told it is in Human Work and not that Human Work is in
	 * Part Two, nor which of that chapter's seven sections they had landed in.
	 * The Catechism's five crumbs are the shape to match.
	 */
	const trail = $derived(socialDoctrineTrail(editions.lang, data.n));

	/** The division this paragraph is in, with its own name — the "read the
	 *  whole chapter" card. `socialDoctrineDivisions` names it from the node
	 *  that carries the printed label, which is why an unnamed `PART ONE`
	 *  divider opening at the same paragraph cannot take the name. */
	const division = $derived(
		socialDoctrineDivisions(editions.lang).find(
			({ from }) => from === editions.current?.chapter?.[0]
		)
	);

	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber([editions.current.paragraph], [editions.secondary.paragraph])
			: []
	);

	adoptCompareFromUrl();

	$effect(() => {
		if (editions.current) {
			setPosition(editions.current.work.id, `CSDC ${data.n}`, page.url.pathname);
		}
	});

	/** ` · The Human Person and Human Rights`, or nothing. The same suffix
	 *  the edge writes into the shell before this page loads — see
	 *  `innermost` in `shell-head.ts`; a mismatch is a visible rearrangement
	 *  on every load. */
	function headingSuffix(): string {
		const title = division && displayDocumentTitle(division.node.title, editions.lang).title;
		return title ? ` · ${title}` : '';
	}
</script>

<svelte:head>
	<title>CSDC {data.n}{headingSuffix()} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(section: DocumentSection)}
	<ProseBlocks unit={section} lang={editions.lang} work={workId} />
{/snippet}

{#snippet rightCell(section: DocumentSection)}
	<ProseBlocks
		unit={section}
		lang={editions.secondaryLang ?? editions.lang}
		work={editions.secondaryWorkId ?? workId}
	/>
{/snippet}

{#if editions.current}
	<!-- Written once and rendered twice: the desktop sidebar, and the reading
	     bar's panel at the widths where that sidebar is hidden (`TocMenu`). -->
	{#snippet tocList()}
		<!-- EVERY ROW LANDS IN THE CHAPTER, at the heading it names, rather
		     than on that heading's own first paragraph — see
		     `socialDoctrineNav.ts`. The fragment comes back from `routeHref`
		     rather than from `anchorFor`, because which heading is addressable
		     is a fact about this work's chapter page and not about the row: the
		     one that OPENS a division is the page's `<h1>` and carries no
		     `s{n}` id at all. -->
		<StructureSidebarToc
			{structure}
			currentN={data.n}
			lang={editions.lang}
			heading={t('document.tableOfContents')}
			routeHref={(n) => socialDoctrineHeadingHref(editions.lang, n)}
			deriveMarkers={false}
		/>
	{/snippet}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
					<a href="/doctrina-socialis">{t('nav.socialDoctrine')}</a>
					{#each trail as crumb (crumb.node.anchor ?? crumb.node.title)}
						{@const dt = documentHeadingParts(crumb.node.title, editions.lang)}
						{@const at = crumb.node.paragraphs[0]}
						<span class="sep">›</span>
						<!-- THE LABEL VERBATIM, and set as the identifier it is rather
						     than run into the name. `marker()`'s abbreviated form
						     (`Ch. 6`) is not available here: it derives the number from
						     the row's position among its TREE siblings, and this work
						     numbers its twelve chapters straight through three parts —
						     Chapter Five is the first child of Part Two, so that form
						     reads `Ch. 1`. A long label is a cost; a wrong number is a
						     lie. A heading with no label carries its own list marker at
						     the head of its title (`I.`, `a)`), split off by
						     `documentHeadingParts` and left in the running face because
						     that is how the source prints it. -->
						<a
							href={Number.isFinite(at)
								? socialDoctrineHeadingHref(editions.lang, at as number)
								: undefined}
						>
							{#if crumb.node.label}<span class="ordinal label-micro">{crumb.node.label}</span
								>{:else if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}{dt.title}
						</a>
					{/each}
				</nav>
			</div>

			<ReadingBar
				toc={{ label: t('document.tableOfContents'), content: tocList }}
				bookmarkHref={hrefFor({ kind: 'socialDoctrine', n: data.n })}
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
				<!-- The heading is the address and so is the same on both sides;
				     what genuinely differs is the imprint, which is why only the
				     copyright field is a two-column row here. -->
				<h1>CSDC {data.n}</h1>
				<div class="compare-unit-header">
					<CompareCopyrightField left={editions.current.work} right={editions.secondary.work} />
				</div>
			{:else}
				<h1>CSDC {data.n}</h1>
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
						label: `CSDC ${n}`
					})}
				/>
			{:else}
				<div class="reading-text" lang={editions.current.work.language}>
					<ProseBlocks unit={editions.current.paragraph} lang={editions.lang} work={workId} />
				</div>
			{/if}

			<!--
				Reading a single paragraph is the citation case; this is the escape
				hatch to the reading case, and the hash carries this paragraph's own
				number so the reader lands where they already were. No hover preview:
				it names the division the paragraph above is already in.
			-->
			{#if division}
				<p class="read-chapter" data-link-preview="off">
					<a href={`${hrefFor({ kind: 'socialDoctrineChapter', n: division.from })}#p${data.n}`}>
						<span class="label">{t('ccc.readFullChapter')}</span>
						<span class="chapter-name">
							<!-- The division's printed label, set as the identifier it is
							     rather than run into the name. `CHAPTER ONE God's Plan of
							     Love for Humanity` in one serif line reads as a title
							     beginning with two shouted words; the Catechism's version
							     of this card has the same two parts and only ever puts a
							     bare `1.` in the first, which is why the difference did
							     not show until this work took the card. -->
							{#if division.node.label}<span class="chapter-label label-micro"
									>{division.node.label}</span
								>{/if}{displayDocumentTitle(division.node.title, editions.lang).title}
						</span>
						<span class="chapter-range">¶{division.from}–{division.to}</span>
					</a>
				</p>
			{/if}

			<UnitNav
				ariaLabel="Paragraph navigation"
				prev={editions.current.prev && {
					href: hrefFor({ kind: 'socialDoctrine', n: editions.current.prev.n }),
					label: t('unitNav.previous'),
					detail: `¶${editions.current.prev.n}`,
					full: `${t('ccc.prevParagraph')} ${editions.current.prev.n}`
				}}
				next={editions.current.next && {
					href: hrefFor({ kind: 'socialDoctrine', n: editions.current.next.n }),
					label: t('unitNav.next'),
					detail: `¶${editions.current.next.n}`,
					full: `${t('ccc.nextParagraph')} ${editions.current.next.n}`
				}}
			/>
		</article>

		<aside class="reading-aside">
			{@render tocList()}
		</aside>
	</div>
{/if}

<style>
	h1 {
		font-family: var(--font-serif);
		margin-top: 0;
	}

	.copyright-notice {
		margin: 0 0 1rem;
	}

	/* The same card `/catechismus/[n]` ends on, and deliberately identical:
	   the two pages are the same kind of page. */
	.read-chapter {
		margin: 2rem 0 0;
		padding: 0.85rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
	}

	.read-chapter a {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		text-decoration: none;
	}

	.read-chapter a:hover .label,
	.read-chapter a:focus-visible .label {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.read-chapter .chapter-name {
		font-family: var(--font-serif);
		color: var(--color-text);
	}

	.read-chapter .chapter-label {
		margin-inline-end: 0.5em;
	}

	.read-chapter .chapter-range {
		margin-inline-start: auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
