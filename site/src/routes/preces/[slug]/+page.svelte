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
	 * nothing else (site/docs/addresses.md). The reader picks once, in
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
	 * A ROW IS A PRINTED LINE, NOT THE PRAYER — see `compareRows`, which holds
	 * the argument for zipping the two columns by position and what it costs.
	 * A prayer's own `n` never enters it: `n` is print order WITHIN ITS OWN
	 * LANGUAGE'S list, and what makes two entries the same prayer is the SLUG,
	 * which this page already IS.
	 *
	 * BLOCKS ARE STILL THE WRONG UNIT TO ZIP, and lines are not blocks. The
	 * Angelus has 14 vernacular blocks (its versicle/response lines kept
	 * separate) against 10 Latin ones, because the Latin source collapses each
	 * repeated "Hail Mary" into one fused "Ave, María..." line — a per-block zip
	 * pairs the second block with the second block and is wrong from there down.
	 * Flattening to lines does not make those two editions agree either; what it
	 * does is make the disagreement a line's worth rather than a block's, and
	 * visible where it happens rather than as an accumulating drift.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { pairPrayerLines, prayerLines, type PrayerRow } from '$lib/prayer-lines';
	import { compare } from '$lib/compare-pref.svelte';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { compareColumnLabel, getPrayerMeta, resolveEditionTag } from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import CompareField from '$lib/components/CompareField.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import UnitNav from '$lib/components/UnitNav.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import Icon from '$lib/components/Icon.svelte';
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

	/**
	 * A ROW PER PRINTED LINE WHERE THE TWO EDITIONS BREAK ALIKE, and the whole
	 * prayer in one row where they do not (2026-09-03). `pairPrayerLines` is the
	 * rule and carries the measurement; what belongs here is why the row is the
	 * lever at all.
	 *
	 * It was one row holding each side's whole prayer. `CompareGrid` sizes each
	 * ROW to its taller cell — that is the whole of how it keeps two columns
	 * level — so a single row aligned nothing inside itself: the two columns
	 * flowed independently and stayed level only for as long as neither wrapped
	 * a line. Line-for-line alignment is therefore a row per line, which is what
	 * `prayerLines` exists to make available.
	 *
	 * `alignByNumber` is not used and is not the tool here. It aligns on numbers
	 * the two sides CARRY, over their union; a line carries only its position,
	 * and pairing by position is a claim about the source that has to be tested
	 * rather than a key to look up.
	 */
	const compareRows = $derived.by(() => {
		const prayer = current?.prayer;
		if (!prayer || !secondary) return [];
		return pairPrayerLines(prayerLines(prayer.blocks), prayerLines(secondary.prayer.blocks));
	});

	const hasToc = $derived((current?.prayer.groups?.length ?? 0) > 0);

	/** Whether EITHER column has anything to put in the band above the first row
	 *  — a rubric, mystery groups, directions. An empty band is not free: its
	 *  cells carry the grid's own block padding, so it would open a gap over
	 *  every compared prayer that has none of the three, which is most of them
	 *  (English and Portuguese print no rubric at all). */
	const hasPreamble = $derived(
		[current?.prayer, secondary?.prayer].some(
			(p) => p && (p.rubric || p.groups?.length || p.instructions)
		)
	);

	/** Stable in-page destinations for a grouped prayer's sourced divisions.
	 * The Rosary is currently the only such prayer; deriving these from each
	 * printed group name keeps EN/PT headings and their ToC aligned without
	 * inventing a second set of identifiers in the corpus. */
	/**
	 * TODAY, AS AN ISO WEEKDAY (1 = Monday … 7 = Sunday).
	 *
	 * `getDay()` is 0-for-Sunday; the corpus stores ISO numbers because that
	 * is what the rubric means by "Monday and Saturday" and because a
	 * 0-indexed week has no name anyone prays by. Read from the BROWSER's
	 * local date deliberately: which mysteries are today's is a fact about
	 * where the reader is standing, not about where the site is served from,
	 * and this route renders only in the browser anyway (`ssr = false`).
	 *
	 * Computed once at mount rather than derived: a reactive read of the
	 * clock would buy nothing (nobody is holding this page open across
	 * midnight waiting for the highlight to move) and would make every
	 * re-render depend on the time.
	 */
	const todayIso = new Date().getDay() || 7;

	/** The mystery set whose rubric names today, if this prayer has groups and
	 *  the corpus recorded their weekdays. Undefined for every prayer but the
	 *  Rosary, and for a Rosary parsed before `days` existed — in which case
	 *  the page simply renders without a highlight, which is what it did
	 *  before. */
	const todayGroup = $derived(current?.prayer.groups?.find((g) => g.days?.includes(todayIso)));

	/**
	 * The three prayers a decade is made of, as links.
	 *
	 * BY SLUG, NOT BY MATCHING THE SOURCE'S WORDS. The directions name them
	 * in running prose — `the "Our Father", ten "Hail Marys" and the "Glory
	 * be to the Father"`, `um Pai Nosso, dez Ave Marias e um Glória ao Pai` —
	 * and linkifying that text would mean a per-language table of prayer
	 * names, in singular and plural, to recover addresses the corpus already
	 * assigns. Slugs are language-invariant, so the same three constants find
	 * the right prayer in every edition, and each link's TITLE comes from
	 * that edition's own index rather than from anything written here.
	 *
	 * Rendered beside the directions rather than inside them: the source's
	 * sentences stay exactly as printed, and the reader still gets somewhere
	 * to go. A slug the current edition lacks is dropped rather than rendered
	 * dead — `prayer.common.la` has all three, but nothing here assumes that.
	 */
	const DECADE_SLUGS = ['our-father', 'hail-mary', 'glory-be'];
	const decadePrayers = $derived(
		DECADE_SLUGS.map((slug) => ({ slug, meta: getPrayerMeta(lang, slug) })).filter(
			(p) => p.meta !== undefined
		)
	);

	/** A source URL's own filename, without extension —
	 *  `.../misteri_gaudiosi_en.html` -> `misteri_gaudiosi_en`. See the
	 *  `sectionSource` snippet on why this and not the host. Degrades to the
	 *  whole URL rather than to nothing if a source is ever not a file path. */
	function sourceFileLabel(url: string): string {
		const last = url.split('/').pop();
		return last ? last.replace(/\.[^.]+$/, '') : url;
	}

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

<!--
	THE SECTION'S OWN SOURCE, printed under its heading.

	Only the Rosary has any (`PrayerGroupEntry.source`): it is the one prayer
	assembled from more than one page, and the notice at the top of the page
	names the Compendium appendix its entry, rubric and concluding prayer come
	from — not the four Holy Rosary micro-site pages the twenty mysteries and
	the directions come from, which is most of what is on the screen.

	It prints the URL's LAST SEGMENT, not the host `CopyrightNotice` prints.
	The host is what answers that notice's question ("is this from the Holy
	See's own servers?") and it would be the same five words five times here;
	what distinguishes these is exactly the filename — `misteri_gaudiosi_en`
	against `misteri_luminosi_en` — which is also the only part a reader could
	use to tell which page they are being sent to before clicking.

	A section with no `source` renders nothing at all, which is every prayer
	but one, and every group in a corpus written before this field existed.
-->
{#snippet sectionSource(url: string | undefined)}
	{#if url}
		<a
			class="prayer-section-source"
			href={url}
			target="_blank"
			rel="external noopener"
			title={t('copyright.sourceTitle')}
			data-link-preview="off"
		>
			{sourceFileLabel(url)}<Icon name="external-link" class="ext" />
		</a>
	{/if}
{/snippet}

{#snippet prayerPreamble(p: Prayer, bodyLang: string)}
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
			<section
				class="prayer-mystery-group"
				class:today={group === todayGroup}
				id={groupAnchorId(group.name)}
			>
				<h2 class="prayer-mystery-name">
					{group.name}
					<!-- The badge names the DAY, never the weekday. "Today" is true in
					     every interface language without a weekday vocabulary, and the
					     rubric beside it already prints which days these are — in the
					     content language, where the source put them. -->
					{#if group === todayGroup}<span class="prayer-today-badge"
							>{t('prayers.rosary.today')}</span
						>{/if}
					{#if group.rubric}<span class="prayer-mystery-rubric">{group.rubric}</span>{/if}
					{@render sectionSource(group.source)}
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

	<!--
	     THE DIRECTIONS ARE A HOW-TO, AND THE SOURCE ALREADY WROTE THEM AS ONE.
	     They were rendered as five undifferentiated paragraphs, which is what
	     `PrayerBlocks` is for and what hid the shape: the FIRST block is not a
	     direction at all but the opening prayer itself, the words a reader
	     says out loud — sign of the cross, "O God come to my aid", the Glory
	     be — and the remaining four are the numbered steps that follow it.
	     Setting them apart is not editorializing; it is printing the
	     difference the source's own text states.

	     THE TEXT ITSELF IS UNTOUCHED. No sentence is rewritten, split, joined
	     or renumbered — the blocks are the corpus's, in the corpus's order,
	     through the same `PrayerBlocks` renderer. What changed is the frame
	     around them: a label over the first, an ordered list around the rest,
	     and links beside them to the three prayers a decade is made of, which
	     the directions name but a reader had no way to reach from here. -->
	{#if p.instructions}
		<section class="prayer-instructions" id="prayer-instructions">
			<h2>
				{p.instructions.title}
				{@render sectionSource(p.instructions.source)}
			</h2>

			{#if p.instructions.blocks.length > 1}
				<div class="prayer-opening">
					<p class="prayer-step-label label-micro">{t('prayers.rosary.openingPrayer')}</p>
					<PrayerBlocks lines={prayerLines(p.instructions.blocks.slice(0, 1))} />
				</div>
				<ol class="prayer-steps">
					{#each p.instructions.blocks.slice(1) as block, i (i)}
						<li><PrayerBlocks lines={prayerLines([block])} /></li>
					{/each}
				</ol>
			{:else}
				<!-- A single-block instructions field has no opening prayer to
				     separate from its steps, so it renders the way it always did. -->
				<PrayerBlocks lines={prayerLines(p.instructions.blocks)} />
			{/if}

			{#if decadePrayers.length > 0}
				<p class="prayer-decade-links">
					<span class="prayer-step-label label-micro">{t('prayers.rosary.decadePrayers')}</span>
					{#each decadePrayers as entry, i (entry.slug)}
						{#if i > 0}<span class="sep" aria-hidden="true">·</span>{/if}
						<a href={hrefFor({ kind: 'prayer', slug: entry.slug })}>{entry.meta?.title}</a>
					{/each}
				</p>
			{/if}
		</section>
	{/if}
{/snippet}

<!-- The whole prayer in one flow: what the SINGLE column renders. Compare mode
     splits the same two halves apart — the preamble into `CompareGrid`'s band
     above the first row, the lines into a row each.

     THE INITIALS GO ON THE BLOCKS ONLY WHERE THE BLOCKS OPEN THE READING,
     which for every prayer but one they do. A group prayer's `blocks` are its
     CONCLUSION — the preamble's own comment says so, and it is why they render
     last — so an initial there would fall halfway down the Rosary. `kind` is
     `'group'` exactly when `groups` is present (types.ts), and no prayer in any
     edition carries `instructions` without them, so the one test covers both. -->
{#snippet prayerBody(p: Prayer, bodyLang: string)}
	{@render prayerPreamble(p, bodyLang)}
	<PrayerBlocks lines={prayerLines(p.blocks)} dropCap={p.kind !== 'group'} />
{/snippet}

{#snippet prayerToc(p: Prayer)}
	<nav class="prayer-toc" aria-label={t('prayers.tableOfContents')} data-link-preview="off">
		<h2 class="label-micro">{t('prayers.tableOfContents')}</h2>
		<ol>
			{#each p.groups ?? [] as group (group.name)}
				<li>
					<a href={`#${groupAnchorId(group.name)}`} class:today={group === todayGroup}>
						{group.name}
					</a>
				</li>
			{/each}
			{#if p.instructions}
				<li><a href="#prayer-instructions">{p.instructions.title}</a></li>
			{/if}
		</ol>
	</nav>
{/snippet}

<!-- A CELL IS ONE PRINTED LINE, which is what makes the two columns stay level
     line by line rather than only at the top (see `compareRows`). It is still
     the one renderer the single column uses — handed a list of one.

     NO TITLE HERE. The secondary side carries its own `title`, and printing it
     at the top of the right cell is what made the two columns start at
     different heights and in different weights: the vernacular column has no
     title of its own — the page's `<h1>` IS its title — so the right column
     opened one line lower with a bold line the left column had no counterpart
     for. Both titles sit in the `.compare-unit-header` below, which is where
     every other compare route puts the pair, and where an identical pair
     collapses to one instead of being set twice. -->
{#snippet leftCell(row: PrayerRow)}<PrayerBlocks
		lines={row.lines}
		dropCap={current?.prayer.kind !== 'group'}
	/>{/snippet}

{#snippet rightCell(row: PrayerRow)}<PrayerBlocks
		lines={row.lines}
		dropCap={secondary?.prayer.kind !== 'group'}
	/>{/snippet}

<!-- EVERYTHING THAT IS NOT A LINE, in the band above the first row.
     `CompareGrid`'s interlude is for content that divides the units rather
     than being one of them, and a rubric, the Rosary's four mystery groups and
     its directions are exactly that here: they precede the prayer's own lines,
     each column prints its own, and none of them is a line to pair with a line
     opposite. Each side renders whatever it has, which may be nothing —
     `prayerPreamble` emits a rubric only where the source printed one, so the
     band is empty for most prayers and costs an empty row.

     This is also what keeps a Latin column able to show a rubric or a group if
     that edition ever prints one, rather than silently dropping it the way the
     old field-shaped cell had to. -->
{#snippet leftPreamble()}{#if current}{@render prayerPreamble(
			current.prayer,
			current.work.language
		)}{/if}{/snippet}

{#snippet rightPreamble()}{#if secondary}{@render prayerPreamble(
			secondary.prayer,
			secondary.work.language
		)}{/if}{/snippet}

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
				<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
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
			     `CopyrightNotice` exists to make checkable.

			     AND THE SOURCE IS THE PRAYER'S, NOT THE WORK'S. The manifest
			     lists eight pages for English and cannot say which prayer came
			     from which, so the notice linked `sources[0]` — the Compendium
			     appendix — under all twenty-eight, including the four that are
			     not from it at all (the two Creeds, the Our Father, the Litany
			     of Loreto) and the Rosary, whose twenty mysteries are from four
			     pages the Compendium does not contain. `Prayer.sources` is the
			     per-address answer; the mysteries and the directions carry their
			     own, printed beside the sections they belong to. -->
			{#if compareActive && secondary}
				<CompareCopyrightHeader
					left={current.work}
					right={secondary.work}
					leftSources={current.prayer.sources}
					rightSources={secondary.prayer.sources}
				/>
			{:else}
				<p class="copyright-notice">
					<CopyrightNotice manifest={current.work} sources={current.prayer.sources} />
				</p>
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
					interlude={{
						has: (n) => hasPreamble && n === compareRows[0]?.n,
						left: leftPreamble,
						right: rightPreamble
					}}
				/>
				<!-- WHICH MYSTERIES ARE TODAY'S, ANSWERED BEFORE THE READER SCROLLS.
			     The Rosary is prayed one set of five decades at a time, on a
			     weekday rotation the source prints as a rubric over each set —
			     so a reader arriving to pray has to read four rubrics and work
			     out which one names today before they can start. This says it
			     once, at the top, and links straight into that set.

			     SINGLE-COLUMN ONLY. In compare mode the two editions each print
			     their own four rubrics, and a banner over the pair would have to
			     name one edition's heading or both; the reader in that mode is
			     comparing wordings rather than sitting down to pray. -->
			{:else}
				{#if todayGroup}
					<p class="prayer-today">
						<span class="prayer-today-badge">{t('prayers.rosary.today')}</span>
						<span class="prayer-today-heading">{t('prayers.rosary.todayHeading')}:</span>
						<a href={`#${groupAnchorId(todayGroup.name)}`} lang={current.work.language}>
							{todayGroup.name}
						</a>
					</p>
				{/if}
				<div class="reading-text prayer-body" lang={current.work.language}>
					{@render prayerBody(current.prayer, current.work.language)}
				</div>
			{/if}

			<UnitNav
				ariaLabel="Prayer navigation"
				prev={current.prev && {
					href: hrefFor({ kind: 'prayer', slug: current.prev.slug }),
					label: t('unitNav.previous'),
					full: `${t('prayers.prevPrayer')} · ${current.prev.title}`
				}}
				next={current.next && {
					href: hrefFor({ kind: 'prayer', slug: current.next.slug }),
					label: t('unitNav.next'),
					full: `${t('prayers.nextPrayer')} · ${current.next.title}`
				}}
			/>
		</div>
	</div>
{/if}

<style>
	/*
	 * PRAYERS ARE SET LARGER THAN THE REST OF THE READING TEXT, AT THE SAME
	 * COLUMN WIDTH.
	 *
	 * `--reading-base` (app.css) is 1.3rem, tuned for running prose — a
	 * Catechism paragraph, an encyclical section, a chapter of Kings, all read
	 * in long unbroken stretches where 62.4 characters per line is the point.
	 * A prayer is not that. It is short, it is often set in versicle/response
	 * or stanza lines that break well before the measure, and it is a text
	 * people read ALOUD and from memory — the two things that make a larger
	 * face useful rather than merely bigger. The longest thing here is the
	 * Rosary, and even that is twenty short meditations rather than one column
	 * of prose.
	 *
	 * 1.1x (`--reading-base-prayer`, app.css), and the number is bounded rather
	 * than chosen by eye. `--content-width` is declared on `:root` and
	 * therefore resolves against `:root`'s `--reading-base`, so overriding the
	 * base HERE moves the type without moving the column — which is exactly
	 * the ask, and also what makes the multiplier a decision about characters
	 * per line. 62.4 / 1.1 = 56.7 cpl, inside the 55-65 band `--measure-cpl`'s
	 * own comment names as where this type sets well. 1.15x would put it at
	 * 54.3 and outside it.
	 *
	 * Scale-invariant: both the column and the type carry `--reading-scale`,
	 * so the reader's own size setting cancels out of that ratio and 56.7
	 * holds across all eleven steps.
	 *
	 * It is set on the LAYOUT, not on `.prayer-body`, because compare mode
	 * renders the same text through `CompareGrid`'s cells instead — both
	 * columns and the gutter's unit number are `.reading-text`, and a rule
	 * scoped to the single-column class would silently stop applying the
	 * moment a reader opened the Latin alongside.
	 *
	 * The two `1.05rem` headings below are deliberately NOT relative to this.
	 * They are labels over a list ("The Joyful Mysteries", "How to pray the
	 * Rosary?"), sized as chrome and already smaller than the body they head;
	 * scaling them with the text would make them compete with it.
	 */
	.prayer-reading-layout {
		--reading-base: var(--reading-base-prayer);
	}

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
		font-size: 0.8rem;
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
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
	}

	.prayer-toc a:hover {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/* Source order makes the mobile TOC useful; the shared reading-layout's
	   grid puts it into its requested right sidebar from 80rem upward. This
	   route used to repeat that placement itself, in the two-track numbering —
	   `layout.css` now places both children explicitly, row included, and says
	   that this route is why the row is named. */

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

	/* Sized and coloured like `.copyright-notice`, because that is what it is
	   — the same claim about the same kind of fact, made about a section
	   instead of a work. `--font-size-min` floors it at 13.5px the way every
	   other relative reduction on the site does; the `em` is relative to the
	   heading it sits under, which is itself relative to nothing the reader
	   can adjust, so this stays a fixed small rather than shrinking with the
	   enlarged prayer type above it. */
	.prayer-section-source {
		display: block;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.7em);
		font-weight: 400;
		font-style: normal;
		color: var(--color-text-muted);
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-underline-offset: 0.15em;
		margin-block-start: 0.15rem;
	}

	.prayer-section-source:hover {
		color: var(--color-accent);
		text-decoration-style: solid;
	}

	/* Same optical correction as `CopyrightNotice`'s glyph — see its docblock
	   for the 24x24 viewBox inset the numbers come from. */
	.prayer-section-source :global(.ext) {
		width: 0.85em;
		height: 0.85em;
		margin-inline-start: 0.28em;
		vertical-align: -0.18em;
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

	/*
	 * TODAY'S SET — the banner above the text, the badge on its heading, and
	 * the marker in the table of contents. Three places, one accent, because
	 * a reader who has read the banner should recognize the same mark when
	 * they arrive at the section and in the list they navigate by.
	 *
	 * `--color-apparatus` (ground lapis), not `--color-accent`: app.css
	 * reserves the blue for the reference apparatus — the marks that tell a
	 * reader WHERE they are rather than carrying text — and "which of these
	 * four is today's" is exactly that job. The reds are already spoken for by
	 * links and initials, and a red badge beside a red link would read as a
	 * second kind of link.
	 */
	.prayer-today {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin: 0 0 1.5rem;
		padding: 0.6rem 0.8rem;
		border-inline-start: 3px solid var(--color-apparatus);
		border-radius: 0 var(--radius-md) var(--radius-md) 0;
		background: var(--color-bg-elevated);
		font-family: var(--font-sans);
		font-size: 0.9rem;
	}

	.prayer-today-heading {
		color: var(--color-text-muted);
	}

	.prayer-today a {
		font-weight: 600;
	}

	.prayer-today-badge {
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.65em);
		font-weight: 600;
		font-style: normal;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-apparatus);
		border: 1px solid var(--color-apparatus);
		border-radius: var(--radius-sm);
		padding: 0.05em 0.4em;
		/* `white-space: nowrap` because in several interface languages this is
		   two words ("I dag", "A mai titkok" shortens to "Ma" but "Aujourd’hui"
		   does not) and a badge that wraps stops reading as a badge. */
		white-space: nowrap;
	}

	/* On the heading the badge rides the baseline of a line it is smaller
	   than, so it gets its own spacing rather than the flex gap above. */
	.prayer-mystery-name .prayer-today-badge {
		margin-inline-start: 0.5em;
		vertical-align: 0.1em;
	}

	.prayer-mystery-group.today {
		border-inline-start: 3px solid var(--color-apparatus);
		padding-inline-start: 0.9rem;
		/* Pulled back by its own indent so the TEXT stays on the measure and
		   only the rule sits outside it — otherwise today's set would be set
		   to a narrower column than the other three and read as a quotation. */
		margin-inline-start: -0.9rem;
	}

	.prayer-toc a.today {
		color: var(--color-apparatus);
		font-weight: 600;
	}

	/*
	 * The directions, as a how-to. See the markup's own comment for why the
	 * first block is separated from the rest.
	 */
	.prayer-step-label {
		display: block;
		margin: 0 0 0.3rem;
	}

	.prayer-opening {
		margin: 0 0 1.25rem;
		padding-inline-start: 0.9rem;
		border-inline-start: 2px solid var(--color-border);
	}

	.prayer-steps {
		margin: 0 0 1.25rem;
		padding-inline-start: 1.5rem;
	}

	.prayer-steps li {
		margin: 0 0 0.6rem;
	}

	.prayer-decade-links {
		margin: 0;
		font-family: var(--font-sans);
		font-size: 0.9rem;
	}

	.prayer-decade-links .sep {
		opacity: 0.6;
		margin-inline: 0.35rem;
	}

	/* Non-Rosary prayers do not need a sidebar or a reading-layout, but their
	   Latin comparison still needs two full reading measures. Rosary compare
	   gets the equivalent shared app.css rule through `.reading-layout`. */
	.content-column.compare {
		max-width: calc(var(--content-width) * 2 + var(--compare-gutter));
	}
</style>
