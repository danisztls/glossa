<script lang="ts">
	/**
	 * One prayer's reading page. Most prayers remain a standalone
	 * `.content-column`; the Rosary is the one exception, using the shared
	 * `.reading-layout` so its four-part table of contents has a right sidebar.
	 *
	 * COMPARE MODE HERE IS LATIN, NOT A SECOND EDITION. Every other route
	 * `CompareGrid` serves pairs the SAME unit across two language editions
	 * of a work; a prayer's `latin` is a FIELD on the one canonical work
	 * (docs/corpus-schema.md "Prayers": "Latin is a field, not an edition"),
	 * so there is no second `WorkManifest` here at all — `leftLang`/
	 * `rightLang` are the reader's language and the literal string `"la"`,
	 * not two entries from `listEditions('prayer')`.
	 *
	 * `alignByNumber` is still the RIGHT mechanism, not a bent one: there is
	 * exactly one prayer and exactly one Latin companion, and both sides of
	 * `compareRows` are keyed on the SAME real number — the prayer's own
	 * `n` (print order), not a fabricated index. A single-row alignment like
	 * this can never mis-zip, by construction — there is only one number to
	 * align on either side. What genuinely does NOT fit is aligning by
	 * BLOCK: the Angelus has 14 vernacular blocks (its versicle/response
	 * lines kept separate) against 10 Latin blocks (the source collapses
	 * each repeated "Hail Mary" into one fused "Ave, María..." line) — a
	 * per-block zip would silently misalign the moment the two sides'
	 * block counts diverge, which is exactly the failure `alignByNumber`'s
	 * own docblock exists to rule out. Rendering each side's `blocks` in its
	 * own natural flow, inside one aligned row, is what stays honest.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { alignByNumber } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { content } from '$lib/content.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import EditionMenu from '$lib/components/EditionMenu.svelte';
	import BookmarkButton from '$lib/components/BookmarkButton.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import PrayerBlocks from '$lib/components/PrayerBlocks.svelte';
	import PrayerMystery from '$lib/components/PrayerMystery.svelte';
	import { setPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { Prayer } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let lang = $derived(
		data.byLang[content.langFor('prayer')] ? content.langFor('prayer') : Object.keys(data.byLang)[0]
	);
	let current = $derived(data.byLang[lang]);

	const hasLatin = $derived(current?.prayer.latin !== undefined);

	/** The Latin side as a `{ n }`-shaped unit sharing the prayer's own `n` —
	 *  see this module's docblock for why that's a genuine, not a bent, use
	 *  of `alignByNumber`. */
	const compareRows = $derived.by(() => {
		const prayer = current?.prayer;
		const latin = prayer?.latin;
		if (!prayer || !latin) return [];
		return alignByNumber([prayer], [{ n: prayer.n, title: latin.title, blocks: latin.blocks }]);
	});

	adoptCompareFromUrl();

	/**
	 * ON/OFF ONLY — NO EDITION TO PICK, AND SO NO `resolveTarget` CALL HERE.
	 * Every other route resolves the store's target against a list of
	 * alternative WORK ids (`otherEditions`, `compare.resolveTarget`) because
	 * the second column there really is a choice between editions. This
	 * route's second column is the prayer's own `latin` FIELD (see the module
	 * docblock above), so there is nothing a stored work id could ever name
	 * here — reading `compare.active` directly is what keeps this route
	 * boolean, without teaching the store or `CompareGrid` a special case for
	 * it: a reader whose *stored* preference happens to be a specific Bible
	 * edition id (picked on some other page) still gets Latin shown here,
	 * because `active` only asks "is compare mode on at all", never "is THIS
	 * particular id available".
	 */
	const compareActive = $derived(compare.active && hasLatin);
	const hasToc = $derived((current?.prayer.groups?.length ?? 0) > 0);

	/** Stable in-page destinations for a grouped prayer's sourced divisions.
	 * The Rosary is currently the only such prayer; deriving these from each
	 * printed group name keeps EN/PT headings and their ToC aligned without
	 * inventing a second set of identifiers in the corpus. */
	function groupAnchorId(name: string) {
		return (
			'prayer-group-' +
			name
				.toLowerCase()
				.normalize('NFD')
				.replace(/[\u0300-\u036f]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '')
		);
	}

	onMount(() => {
		if (current) setPosition('prayer.common.' + lang, current.prayer.title, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{current?.prayer.title ?? data.slug} — {t('home.title')}</title>
</svelte:head>

{#snippet prayerBody(p: Prayer)}
	{#if p.rubric}
		<p class="prayer-rubric">{p.rubric}</p>
	{/if}

	<!-- Variants render BEFORE the shared `blocks` -- in the real corpus a
	     variant-bearing prayer's `blocks` is either empty (the whole prayer
	     differs by region, e.g. Hail Holy Queen) or a shared tail the source
	     prints after every variant (Regina Caeli's closing collect, the same
	     for UK and USA) -- either way, "the alternatives, then whatever both
	     share" is the order the source itself reads in. -->
	{#if p.variants && p.variants.length > 0}
		{#each p.variants as variant (variant.label)}
			<div class="prayer-variant">
				<p class="prayer-variant-label">{variant.label}</p>
				<PrayerBlocks blocks={variant.blocks} />
			</div>
		{/each}
	{/if}

	<!-- Groups (the Rosary alone, v1) render as their own named list, never
	     flattened into prose -- see PrayerBlocks.svelte's docblock and
	     docs/corpus-schema.md "Prayers" on why. Rendered BEFORE `blocks`:
	     the source's own `blocks` for a group-kind prayer document how to
	     CONCLUDE it (the Rosary's closing prayer starts "Prayer concluding
	     the Rosary"), which only makes sense read after the groups
	     themselves. -->
	{#if p.groups && p.groups.length > 0}
		{#each p.groups as group (group.name)}
			<section class="prayer-mystery-group" id={groupAnchorId(group.name)}>
				<h2 class="prayer-mystery-name">
					{group.name}
					{#if group.rubric}<span class="prayer-mystery-rubric">{group.rubric}</span>{/if}
				</h2>
				<ol class="prayer-mystery-items">
					{#each group.items as item, i (i)}
						<li>
							<PrayerMystery {item} lang={current?.work.language ?? 'en'} />
						</li>
					{/each}
				</ol>
			</section>
		{/each}
	{/if}

	{#if p.instructions}
		<section class="prayer-instructions" id="prayer-instructions">
			<h2>{p.instructions.title}</h2>
			<PrayerBlocks blocks={p.instructions.blocks} />
		</section>
	{/if}

	<PrayerBlocks blocks={p.blocks} />
{/snippet}

{#snippet prayerToc(p: Prayer)}
	<nav class="prayer-toc" aria-label={t('prayers.tableOfContents')} data-link-preview="off">
		<h2>{t('prayers.tableOfContents')}</h2>
		<ol>
			{#each p.groups ?? [] as group (group.name)}
				<li><a href={`#${groupAnchorId(group.name)}`}>{group.name}</a></li>
			{/each}
			{#if p.instructions}
				<li><a href="#prayer-instructions">{p.instructions.title}</a></li>
			{/if}
		</ol>
	</nav>
{/snippet}

{#snippet leftCell(p: Prayer)}
	{@render prayerBody(p)}
{/snippet}

{#snippet rightCell(l: { n: number; title: string; blocks: Prayer['blocks'] })}
	<p class="prayer-latin-title">{l.title}</p>
	<PrayerBlocks blocks={l.blocks} />
{/snippet}

{#if current}
	<div class:reading-layout={hasToc} class="prayer-reading-layout" class:compare={compareActive}>
		{#if hasToc}
			<!-- On wide screens this is the right sidebar; source order keeps it
			     ahead of the long Rosary text on a narrow screen. -->
			<aside class="reading-aside">
				{@render prayerToc(current.prayer)}
			</aside>
		{/if}

		<div class="content-column" class:compare={compareActive}>
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/preces">{t('nav.prayers')}</a>
				{#if current.group}
					<span class="sep">›</span>
					<a href={`/preces#${current.group.id}`}>{current.group.title}</a>
				{/if}
			</nav>

			<div class="title-row">
				<h1>{current.prayer.title}</h1>
				<div class="compare-toolbar">
					<!-- A prayer has no numbered sub-unit to hang the anchor popover off
					     (PrayerBlocks renders no anchors at all), so the whole prayer is
					     what a reader can mark. -->
					<BookmarkButton href={`/preces/${data.slug}`} />
					{#if hasLatin}
						<CompareToggle
							active={compareActive}
							onclick={toggleCompare}
							enterLabel={t('prayers.showLatin')}
							exitLabel={t('prayers.hideLatin')}
						/>
					{/if}
					<EditionMenu />
				</div>
			</div>

			<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>

			{#if compareActive}
				<CompareGrid
					rows={compareRows}
					leftLang={current.work.language}
					rightLang="la"
					leftLabel={current.work.short_title}
					rightLabel={t('prayers.latin')}
					left={leftCell}
					right={rightCell}
				/>
			{:else}
				<div class="reading-text prayer-body" lang={current.work.language}>
					{@render prayerBody(current.prayer)}
				</div>
			{/if}

			<nav class="unit-nav" aria-label="Prayer navigation">
				{#if current.prev}
					<a href={`/preces/${current.prev.slug}`} rel="prev"
						>&larr; {t('prayers.prevPrayer')} · {current.prev.title}</a
					>
				{:else}
					<span></span>
				{/if}
				{#if current.next}
					<a href={`/preces/${current.next.slug}`} rel="next"
						>{t('prayers.nextPrayer')} · {current.next.title} &rarr;</a
					>
				{/if}
			</nav>
		</div>
	</div>
{/if}

<style>
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
		flex-shrink: 0;
	}

	.copyright-notice {
		margin: 0.5rem 0 1.25rem;
	}

	.prayer-rubric {
		font-style: italic;
		color: var(--color-text-muted);
		margin: 0 0 1rem;
	}

	.prayer-variant {
		margin: 0 0 1.25rem;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
	}

	.prayer-variant-label {
		margin: 0 0 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.prayer-mystery-group {
		margin: 0 0 1.5rem;
		scroll-margin-top: 1rem;
	}

	.prayer-toc {
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.prayer-toc h2 {
		margin: 0 0 0.4rem;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.prayer-toc ol {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.prayer-toc li {
		margin: 0.15rem 0;
	}

	.prayer-toc a {
		display: block;
		padding: 0.2rem 0.35rem;
		border-radius: 0.3rem;
		color: var(--color-text);
		text-decoration: none;
	}

	.prayer-toc a:hover {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/* Source order makes the mobile TOC useful; the shared reading-layout's
	   grid puts it into its requested right sidebar from 80rem upward. */
	@media (min-width: 80rem) {
		.prayer-reading-layout > .content-column {
			grid-column: 1;
			grid-row: 1;
		}

		.prayer-reading-layout > .reading-aside {
			grid-column: 2;
			grid-row: 1;
		}
	}

	.prayer-mystery-name {
		font-size: 1.05rem;
		margin: 0 0 0.5rem;
	}

	.prayer-mystery-rubric {
		display: block;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 400;
		font-style: italic;
		color: var(--color-text-muted);
	}

	.prayer-mystery-items {
		margin: 0;
		padding-inline-start: 1.5rem;
	}

	.prayer-mystery-items li {
		margin: 0 0 0.9rem;
	}

	.prayer-instructions {
		margin: 1.75rem 0;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		scroll-margin-top: 1rem;
	}

	.prayer-instructions h2 {
		font-size: 1.05rem;
		margin: 0 0 0.75rem;
	}

	.prayer-latin-title {
		font-family: var(--font-serif);
		font-weight: 700;
		margin: 0 0 0.75rem;
	}

	/* Non-Rosary prayers do not need a sidebar or a reading-layout, but their
	   Latin comparison still needs two full reading measures. Rosary compare
	   gets the equivalent shared app.css rule through `.reading-layout`. */
	.content-column.compare {
		max-width: calc(var(--content-width) * 2 + 3rem);
	}
</style>
