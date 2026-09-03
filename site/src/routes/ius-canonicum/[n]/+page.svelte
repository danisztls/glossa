<script lang="ts">
	/**
	 * One canon of the Code of Canon Law.
	 *
	 * THE CITATION VIEW, as `/doctrina-socialis/[n]` and `/catechismus/[n]`
	 * are for their works: this is where `CIC can. 216` resolves to, and
	 * `/ius-canonicum/titulus/{n}` is where it is read. A canon is a
	 * document's `DocumentSection`, so `ProseBlocks` renders its `html` blocks
	 * exactly as an encyclical's — the difference between this work and a
	 * document is the address, not the text.
	 *
	 * WHAT IS NEW ON THIS PAGE is `superseded`: four editions print, below the
	 * Code, the wording a later act replaced. It is shown here and not on the
	 * reading page because it is apparatus about ONE canon, and this is the
	 * page a reader arrives at holding that canon's number.
	 */
	import { page } from '$app/state';
	import { canonLawDivisions, compareColumnLabel, flattenCanonLawOutline } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
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
	import {
		canonLawHeadingHref,
		canonLawHeadingParts,
		canonLawLabelText,
		canonLawTitleText,
		canonLawTrail
	} from '$lib/canonLawNav';
	import { displayDocumentTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const editions = useEditionCompare(
		() => data.byLang,
		() => content.langFor('canon-law')
	);

	const workId = $derived(editions.current?.work.id);

	const structure = $derived(flattenCanonLawOutline(editions.lang));

	/** Every heading standing over this canon, outermost first. The deepest
	 *  trail on the site: the Code runs book, part, section, title, chapter,
	 *  article, so a canon in Book VII routinely carries five crumbs. */
	const trail = $derived(canonLawTrail(editions.lang, data.n));

	/** The reading unit this canon is in, with its own name — the "read the
	 *  whole title" card. */
	const division = $derived(
		canonLawDivisions(editions.lang).find(({ from }) => from === editions.current?.title?.[0])
	);

	const compareRows = $derived(
		editions.current && editions.secondary
			? alignByNumber([editions.current.canon], [editions.secondary.canon])
			: []
	);

	adoptCompareFromUrl();

	$effect(() => {
		if (editions.current) {
			setPosition(editions.current.work.id, `CIC ${data.n}`, page.url.pathname);
		}
	});

	/** ` · Ecclesiastical Laws`, or nothing — the same suffix the edge writes
	 *  into the shell before this page loads (`shell-head.ts`); a mismatch is
	 *  a visible rearrangement on every load. */
	function headingSuffix(): string {
		const title =
			division && displayDocumentTitle(canonLawTitleText(division.node.title), editions.lang).title;
		return title ? ` · ${title}` : '';
	}
</script>

<svelte:head>
	<title>CIC {data.n}{headingSuffix()} — {t('home.title')}</title>
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
	{#snippet tocList()}
		<StructureSidebarToc
			{structure}
			currentN={data.n}
			lang={editions.lang}
			heading={t('document.tableOfContents')}
			routeHref={(n) => canonLawHeadingHref(editions.lang, n)}
			deriveMarkers={false}
			markerText={(label) => canonLawLabelText(label, editions.lang)}
			titleText={canonLawTitleText}
		/>
	{/snippet}
	<div class="reading-layout" class:compare={editions.compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
					<a href="/ius-canonicum">{t('nav.canonLaw')}</a>
					{#each trail as crumb (crumb.node.anchor ?? crumb.node.title)}
						{@const dt = canonLawHeadingParts(crumb.node.title, editions.lang)}
						{@const at = crumb.node.paragraphs[0]}
						<span class="sep">›</span>
						<!-- THE SOURCE'S OWN NUMERAL, and only the noun rewritten.
						     `marker()`'s short form is not available here for
						     `socialDoctrineNav`'s reason and a sharper one: it numbers a
						     row by its position among its TREE siblings, and the Code
						     restarts `TITLE I` inside every book and part, so four
						     different places would read `Title 1`. `canonLawLabelText`
						     touches nothing a citation is made of, and this is the
						     deepest trail on the site — six crumbs spelling out
						     `CHAPTER` is what it saves. -->
						<a
							href={Number.isFinite(at)
								? canonLawHeadingHref(editions.lang, at as number)
								: undefined}
						>
							{#if crumb.node.label}<span class="ordinal label-micro"
									>{canonLawLabelText(crumb.node.label, editions.lang)}</span
								>{:else if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}{dt.title}
						</a>
					{/each}
				</nav>
			</div>

			<ReadingBar
				toc={{ label: t('document.tableOfContents'), content: tocList }}
				bookmarkHref={hrefFor({ kind: 'canonLaw', n: data.n })}
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
				<h1>{t('canonLaw.canon')} {data.n}</h1>
				<div class="compare-unit-header">
					<CompareCopyrightField left={editions.current.work} right={editions.secondary.work} />
				</div>
			{:else}
				<h1>{t('canonLaw.canon')} {data.n}</h1>
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
						label: `${t('canonLaw.canon')} ${n}`
					})}
				/>
			{:else}
				<div class="reading-text" lang={editions.current.work.language}>
					<ProseBlocks unit={editions.current.canon} lang={editions.lang} work={workId} />
				</div>
			{/if}

			<!--
				THE WORDING THIS CANON REPLACED, where the edition prints one.

				BEHIND A DISCLOSURE, and closed, because the text above it is the
				law and this is not. A reader who opens it is asking a historical
				question — what did canon 579 say before *Authenticum charismatis*
				— and a reader who does not must never be able to mistake the two,
				which is why the act's own line is the summary rather than a label
				of ours.
			-->
			{#if editions.current.canon.superseded?.length}
				{#each editions.current.canon.superseded as replaced, i (i)}
					<details class="superseded">
						<summary>
							<span class="superseded-label">{t('canonLaw.superseded')}</span>
							<span class="superseded-act">{replaced.title}</span>
						</summary>
						<div class="reading-text" lang={editions.current.work.language}>
							<ProseBlocks
								unit={{ blocks: replaced.blocks, citations: [] }}
								lang={editions.lang}
								work={workId}
							/>
						</div>
					</details>
				{/each}
			{/if}

			<!--
				Reading a single canon is the citation case; this is the escape
				hatch to the reading case, and the hash carries this canon's own
				number so the reader lands where they already were.
			-->
			{#if division}
				<p class="read-chapter" data-link-preview="off">
					<a href={`${hrefFor({ kind: 'canonLawTitle', n: division.from })}#p${data.n}`}>
						<span class="label">{t('canonLaw.readFullTitle')}</span>
						<span class="chapter-name">
							{#if division.node.label}<span class="chapter-label label-micro"
									>{canonLawLabelText(division.node.label, editions.lang)}</span
								>{/if}{displayDocumentTitle(canonLawTitleText(division.node.title), editions.lang)
								.title}
						</span>
						<span class="chapter-range">{division.from}–{division.to}</span>
					</a>
				</p>
			{/if}

			<UnitNav
				ariaLabel="Canon navigation"
				prev={editions.current.prev && {
					href: hrefFor({ kind: 'canonLaw', n: editions.current.prev.n }),
					label: t('unitNav.previous'),
					detail: `${editions.current.prev.n}`,
					full: `${t('canonLaw.prevCanon')} ${editions.current.prev.n}`
				}}
				next={editions.current.next && {
					href: hrefFor({ kind: 'canonLaw', n: editions.current.next.n }),
					label: t('unitNav.next'),
					detail: `${editions.current.next.n}`,
					full: `${t('canonLaw.nextCanon')} ${editions.current.next.n}`
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

	/* Quieter than the card below it, and deliberately: this is apparatus
	   about a text that is no longer in force, sitting under the text that
	   is. Muted, no elevation, and the act's line set small. */
	.superseded {
		margin: 1.5rem 0 0;
		border-inline-start: 2px solid var(--color-border);
		padding-inline-start: 0.85rem;
		color: var(--color-text-muted);
	}

	.superseded summary {
		cursor: pointer;
		font-size: 0.85rem;
		line-height: 1.5;
	}

	.superseded-label {
		font-variant: small-caps;
		letter-spacing: 0.04em;
		margin-inline-end: 0.4em;
	}

	.superseded-act {
		font-style: italic;
	}

	.superseded .reading-text {
		margin-top: 0.5rem;
		font-size: 0.95em;
	}

	/* The same card `/catechismus/[n]` and `/doctrina-socialis/[n]` end on. */
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
