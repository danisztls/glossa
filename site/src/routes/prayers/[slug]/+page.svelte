<script lang="ts">
	/**
	 * One prayer's reading page. Most prayers remain a standalone
	 * `.content-column`; the Rosary is the one exception, using the shared
	 * `.reading-layout` so its four-part table of contents has a right sidebar.
	 *
	 * THE SECOND COLUMN IS A CHOICE HERE TOO, and it used to be hardcoded to
	 * Latin. The reasoning for that was sound as far as it went — a prayer's
	 * `latin` is a FIELD on the one canonical work (docs/corpus-schema.md
	 * "Prayers": "Latin is a field, not an edition"), so there is no second
	 * `WorkManifest` for it — but it answered the wrong question. That Latin
	 * is not an edition explains why it cannot be the ONLY thing offered; it
	 * never explained why the OTHER vernacular could not be. `+page.ts`
	 * already embeds every language's copy of the slug, so English against
	 * Português was one line of markup away the whole time, and a reader who
	 * compares translations everywhere else on the site arrived here to find
	 * the picker replaced by the word "Latina".
	 *
	 * So this route now resolves a target like every other one
	 * (`compare.resolveTarget`), over every OTHER language's copy of this
	 * same slug — all of them real works with real ids.
	 *
	 * SO IS THE UK WORDING. The source prints one English appendix in which
	 * five prayers appear twice, headed "UK VERSION" and "USA VERSION"; this
	 * route used to render both, boxed and labelled, one above the other, so a
	 * reader who wanted the Te Deum had to choose between two regional labels
	 * before reading a word. That is an edition boundary, and is now built as
	 * one: `prayer.common.en` is the collection and prints the USA wording,
	 * `prayer.common.en-gb` is those five prayers in the UK wording and
	 * nothing else (docs/decisions.md, 2026-08-25). The reader picks once, in
	 * the same menu as every other work, and `variants` is gone from the
	 * schema rather than carried for five entries.
	 *
	 * WHICH MEANS THE UK EDITION IS ABSENT FROM 23 OF THESE PAGES, and nothing
	 * here announces that. `byLang` simply has no `en-gb` entry for the Our
	 * Father, `resolveEditionTag` lands on `en`, and the reader gets the only
	 * English text there is — the one their own source prints under the same
	 * heading. A notice would be telling them they are reading a fallback when
	 * what they are reading is the text.
	 *
	 * LATIN IS ONE OF THEM TOO. It used to be the exception this file existed
	 * to accommodate: a fabricated `prayer.latin` target whose manifest was
	 * the vernacular work's with `id` and `language` overwritten, because the
	 * schema held that "Latin is a field, not an edition". That ruling is
	 * reversed (docs/decisions.md) and `prayer.common.la` is a real work, so
	 * the fabrication and the second cell shape it needed are both gone —
	 * every column on this page is now a whole `Prayer` from a whole edition.
	 * The `latin` FIELD stays in the corpus, unchanged: it is what the source
	 * prints, and it is what the Latin edition was derived from.
	 *
	 * Latin sorts first among the alternatives, so it stays what `AUTO` picks
	 * and what a reader who has expressed no preference sees — `/preces`' own
	 * tagline is "Prayers with the Latin text alongside", and that remains the
	 * default reading of the page.
	 *
	 * BOTH SIDES ARE KEYED ON THE LEFT PRAYER'S `n`, deliberately, and this is
	 * the one place `alignByNumber` is handed a number rather than reading it.
	 * A prayer's `n` is its print order WITHIN ITS OWN LANGUAGE'S list, and
	 * what makes two entries the same prayer is the SLUG — the schema
	 * guarantees the slug sets match, not that the two lists number them
	 * alike. Passing each side its own `n` would therefore emit two orphaned
	 * rows instead of one pair the moment a language reordered. There is
	 * exactly one unit per side (this page is one slug), so forcing the pair
	 * cannot mis-zip: it is the degenerate case where the address IS the
	 * match.
	 *
	 * What genuinely does NOT fit is aligning by BLOCK: the Angelus has 14
	 * vernacular blocks (its versicle/response lines kept separate) against 10
	 * Latin blocks (the source collapses each repeated "Hail Mary" into one
	 * fused "Ave, María..." line) — a per-block zip would silently misalign
	 * the moment the two sides' block counts diverge, which is exactly the
	 * failure `alignByNumber`'s own docblock exists to rule out. Rendering
	 * each side's blocks in its own natural flow, inside one aligned row, is
	 * what stays honest.
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
	import { compareColumnLabel, resolveEditionTag } from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import CompareField from '$lib/components/CompareField.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import UnitNav from '$lib/components/UnitNav.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CompareCopyrightHeader from '$lib/components/CompareCopyrightHeader.svelte';
	import PrayerBlocks from '$lib/components/PrayerBlocks.svelte';
	import PrayerMystery from '$lib/components/PrayerMystery.svelte';
	import { setPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { Prayer } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/** `tagFor`, not `langFor`: `byLang` is keyed on full tags now that English
	 *  has two editions, and the bare form cannot tell them apart. */
	let lang = $derived(resolveEditionTag(Object.keys(data.byLang), content.tagFor('prayer')) ?? '');
	let current = $derived(data.byLang[lang]);

	/**
	 * Every second column this page can offer, in menu order: each OTHER
	 * language's edition of this same slug, Latin included.
	 *
	 * LATIN SORTS FIRST rather than alphabetically among the rest, and that
	 * is the one thing here that is a choice rather than a listing. `/preces`
	 * is published as "Prayers with the Latin text alongside", so Latin is
	 * what `AUTO` must keep landing on for a reader who has expressed no
	 * preference — a sibling vernacular winning that slot because its tag
	 * happens to sort earlier would quietly change what the collection is.
	 *
	 * NOT EVERY PRAYER HAS A LATIN EDITION. Seven of the twenty-eight are
	 * printed with no Latin anywhere in the source (the two Creeds, the Our
	 * Father, the three Eastern prayers, the Litany of Loreto), so
	 * `prayer.common.la` genuinely has no entry for them and `+page.ts`
	 * simply never puts one in `byLang`. Those pages offer the other
	 * vernacular instead, which is the ordinary "hide, don't disable"
	 * outcome rather than a case to handle.
	 */
	const comparisons = $derived.by(() => {
		if (!current) return [];
		const langs = Object.keys(data.byLang)
			.filter((other) => other !== lang)
			.sort((a, b) => (a === 'la' ? -1 : b === 'la' ? 1 : a.localeCompare(b)));
		return langs.map((other) => {
			const entry = data.byLang[other];
			return { work: entry.work, title: entry.prayer.title, prayer: entry.prayer };
		});
	});

	adoptCompareFromUrl();

	/** Latin first — see the module docblock on why `AUTO` must keep landing
	 *  there rather than on whichever sibling language sorts first. */
	const compareTarget = $derived(
		compare.resolveTarget(
			comparisons.map((c) => c.work.id),
			comparisons[0]?.work.id
		)
	);
	const secondary = $derived(comparisons.find((c) => c.work.id === compareTarget));
	const compareActive = $derived(secondary !== undefined);

	/** One row, both sides keyed on the LEFT prayer's `n` — the module
	 *  docblock says why the right side's own number is the wrong key. */
	const compareRows = $derived.by(() => {
		const prayer = current?.prayer;
		if (!prayer || !secondary) return [];
		return alignByNumber(
			[prayer],
			[
				{
					n: prayer.n,
					title: secondary.title,
					prayer: secondary.prayer
				}
			]
		);
	});

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

{#snippet prayerBody(p: Prayer, bodyLang: string)}
	{#if p.rubric}
		<p class="prayer-rubric">{p.rubric}</p>
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
							<PrayerMystery {item} lang={bodyLang} />
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
	{@render prayerBody(p, current?.work.language ?? 'en')}
{/snippet}

<!-- NO TITLE HERE. The secondary side carries its own `title`, and printing
     it at the top of this cell is what made the two columns start at different
     heights and in different weights: the vernacular column has no title of
     its own — the page's `<h1>` IS its title — so the right column opened one
     line lower with a bold line the left column had no counterpart for. Both
     titles now sit in the `.compare-unit-header` below, which is where every
     other compare route puts the pair, and where an identical pair collapses
     to one instead of being set twice.

     ONE SHAPE, NOT TWO. This snippet used to branch on whether the right side
     was a whole `Prayer` or the bare title-and-blocks of the Latin FIELD.
     Latin is an edition now (see the module docblock), so every column is a
     whole prayer and the branch is gone — which also means the Latin column
     renders a rubric or a group if the Latin edition ever prints one, instead
     of silently dropping it the way the field-shaped cell had to. -->
{#snippet rightCell(u: { n: number; title: string; prayer: Prayer })}
	{@render prayerBody(u.prayer, secondary?.work.language ?? 'en')}
{/snippet}

{#if current}
	<div class:reading-layout={hasToc} class="prayer-reading-layout" class:compare={compareActive}>
		{#if hasToc}
			<!-- On wide screens this is the right sidebar; source order keeps it
			     ahead of the long Rosary text on a narrow screen. -->
			<aside class="reading-aside reading-aside-mobile">
				{@render prayerToc(current.prayer)}
			</aside>
		{/if}

		<div class="content-column" class:compare={compareActive}>
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/preces">{t('nav.prayers')}</a>
					{#if current.group}
						<span class="sep">›</span>
						<a href={`/preces#${current.group.id}`}>{current.group.title}</a>
					{/if}
				</nav>
			</div>

			<!-- A prayer has no numbered sub-unit to hang the anchor popover off
			     (PrayerBlocks renders no anchors at all), so the whole prayer is
			     what `bookmarkHref` marks.

			     No `enterLabel`/`exitLabel` any more. They said "Show/Hide Latin
			     text", which was the accurate wording while Latin was the only
			     second column this route had; now that the reader picks, the
			     generic "Compare editions" the toggle defaults to is the accurate
			     one, and a button that promises Latin while showing Português
			     would be worse than one that promises nothing in particular. -->
			<ReadingBar
				bookmarkHref={hrefFor({ kind: 'prayer', slug: data.slug })}
				canCompare={comparisons.length > 0}
				{compareActive}
				onToggleCompare={toggleCompare}
				comparison={{
					editions: comparisons.map((c) => c.work),
					current: compareTarget,
					onselect: chooseComparisonEdition
				}}
			/>

			{#if compareActive && secondary}
				<!-- One row per field (`.compare-unit-header`, app.css), same as the
				     CCC/Compendium/document readers. The TITLE collapses whenever the
				     two match, which happens whenever the prayer is known by its
				     Latin incipit in both languages ("Memorare", "Magnificat") and
				     not when it is translated ("Hail Mary" against "Ave Maria") —
				     the field asks, nothing here decides centrally. -->
				<div class="compare-unit-header">
					<CompareField
						shared={secondary.title === current.prayer.title}
						leftLang={current.work.language}
						rightLang={secondary.work.language}
						leftTag={compareColumnLabel(current.work)}
						rightTag={compareColumnLabel(secondary.work)}
					>
						{#snippet left()}<h1>{current.prayer.title}</h1>{/snippet}
						{#snippet right()}<h1>{secondary.title}</h1>{/snippet}
					</CompareField>
				</div>
			{:else}
				<h1>{current.prayer.title}</h1>
			{/if}

			<!-- TWO NOTICES WHILE COMPARING, like every other compare route, and
			     the reason this route no longer has its own rule here is that it
			     no longer has its own second column. It used to print ONE, on the
			     grounds that `latin` was a field on the same array entry from the
			     same scraped page, so a second notice would have been the same
			     sentence twice rather than provenance. `prayer.common.la` is a
			     real edition with a real manifest now, and its sources are not
			     the vernacular's: it cites BOTH Compendium pages, because the
			     English one is where its text was transcribed and the Portuguese
			     one is where five of these prayers break into stanzas. Two
			     notices linking to different source lists is exactly the case
			     `CopyrightNotice` exists to make checkable. -->
			{#if compareActive && secondary}
				<CompareCopyrightHeader left={current.work} right={secondary.work} />
			{:else}
				<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>
			{/if}

			<!-- `{#if secondary}` rather than `{#if compareActive}`, which is the
			     same condition: the derived boolean is what the layout classes and
			     `ReadingBar` want, but only the object itself narrows here.

			     Both column labels come from `compareColumnLabel`, so the Latin
			     column is tagged "Latina" — the content language's own name, like
			     every other tag on the site — and never "Latin"/"Latim", which is
			     the READER's-language name and belongs on controls, not on a label
			     that names what the column holds. -->
			{#if secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={current.work.language}
					rightLang={secondary.work.language}
					leftLabel={compareColumnLabel(current.work)}
					rightLabel={compareColumnLabel(secondary.work)}
					left={leftCell}
					right={rightCell}
				/>
			{:else}
				<div class="reading-text prayer-body" lang={current.work.language}>
					{@render prayerBody(current.prayer, current.work.language)}
				</div>
			{/if}

			<UnitNav
				ariaLabel="Prayer navigation"
				prev={current.prev && {
					href: hrefFor({ kind: 'prayer', slug: current.prev.slug }),
					label: t('prayers.prevPrayer'),
					detail: current.prev.title
				}}
				next={current.next && {
					href: hrefFor({ kind: 'prayer', slug: current.next.slug }),
					label: t('prayers.nextPrayer'),
					detail: current.next.title
				}}
			/>
		</div>
	</div>
{/if}

<style>
	.copyright-notice {
		margin: 0.5rem 0 1.25rem;
	}

	.prayer-rubric {
		font-style: italic;
		color: var(--color-text-muted);
		margin: 0 0 1rem;
	}

	.prayer-mystery-group {
		margin: 0 0 1.5rem;
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
	}

	.prayer-instructions h2 {
		font-size: 1.05rem;
		margin: 0 0 0.75rem;
	}

	/* Non-Rosary prayers do not need a sidebar or a reading-layout, but their
	   Latin comparison still needs two full reading measures. Rosary compare
	   gets the equivalent shared app.css rule through `.reading-layout`. */
	.content-column.compare {
		max-width: calc(var(--content-width) * 2 + var(--compare-gutter));
	}
</style>
