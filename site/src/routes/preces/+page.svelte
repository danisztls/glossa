<script lang="ts">
	/**
	 * Prayer collection landing page — the `/catechismus/compendium`/`/ccc` landing
	 * pages' shape, not a `StructureSidebarToc` consumer: `structure.json`'s
	 * ranges are `[null, null]` throughout (prayers address by `slug`, never
	 * by number — docs/corpus-schema.md "Prayers"), so that component's
	 * `hrefFor`/`rowState` would have nothing numeric to key on and every row
	 * would render unlinked. A plain, flat, two-level grouped list is the
	 * honestly-simpler alternative the task brief itself names — 28 prayers
	 * across 5 sections doesn't need a persistent sidebar tree to stay
	 * navigable on one page.
	 *
	 * Reactive, not `+page.ts`-loaded, for the same reason `/catechismus/compendium` is:
	 * `structure.json` + prayer metadata are both INDEX tier, already
	 * eager-inlined for every language, so there's nothing to fetch here —
	 * `content.langFor('prayer')` alone decides which language's copy to
	 * show, and recomputes with no reload when the reader switches it.
	 *
	 * IT IS LAID OUT AS AN INDEX AND NOT AS A READING COLUMN, since 2026-09-11:
	 * `.reading-layout.index` with `.landing-column` inside it, the third page
	 * shape `styles/layout.css` carries the argument for and `/documenta`
	 * takes. What is on this page is a list of titles and not prose, and
	 * `--content-width` is a count of CHARACTERS — so the collection was being
	 * set at the measure of a sentence while `/scriptura`, `/schola` and
	 * `/documenta` all give the same kind of list the landing width. The
	 * `index` is load-bearing: without it the grid places `.content-column`
	 * only, and this column is auto-placed into the apparatus lane.
	 *
	 * WHAT IT HOLDS IS NAMES, and the three things below follow from that: the
	 * rows run in COLUMNS, each section FOLDS, and a box FILTERS them. A page
	 * of names is scanned rather than read, so it wants the width, a way to
	 * put away what the reader is not looking for, and a way to ask for one by
	 * its words.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getWork, listPrayerGroups, prayerIndexLang } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import { content } from '$lib/content.svelte';
	import { filterByQuery } from '$lib/highlight';
	import { hrefFor } from '$lib/address';
	import { t } from '$lib/i18n.svelte';

	/** `prayerIndexLang`, not `resolveEditionTag`: English (UK) is five prayers
	 *  and cannot enumerate a 28-prayer collection, so the listing runs on the
	 *  collection it falls back to while each prayer's own page still resolves
	 *  to the UK wording where there is one. */
	let lang = $derived(prayerIndexLang(content.tagFor('prayer')));
	let groups = $derived(listPrayerGroups(lang));
	let work = $derived(getWork(`prayer.common.${lang}`));

	/**
	 * SEARCH OVER THE TITLES, WHICH IS THE WHOLE OF WHAT THIS PAGE HOLDS.
	 *
	 * `/quaestiones`'s box and this one answer the same reader — the one who
	 * arrives holding words rather than an address, whom the jump box cannot
	 * help because it completes citations. What differs is the haystack: a
	 * topic carries a question and a line of unseen keywords, and a prayer
	 * carries its name and nothing else the index tier holds. The Latin and
	 * the text itself are the content tier, fetched per prayer, so searching
	 * them would mean fetching the collection to filter a list of it.
	 *
	 * A SECTION'S NAME IS NOT IN THE HAYSTACK. It is the heading over the
	 * rows, so a query matching it would return every prayer under it as a
	 * result — and the fold already gives a reader who wants one section a
	 * better way to have it.
	 *
	 * NO LITERAL TIER OF ITS OWN, unlike `/quaestiones`. That page passes a
	 * bare-substring reader because its rows are sentences; these are
	 * twenty-odd short names, which is the vocabulary `filterByQuery`'s
	 * default was written for — and a surface only brings its own tier where
	 * it has an argument about its words (`highlight.ts`).
	 *
	 * LOCAL STATE, NOT THE URL, for the reason `/quaestiones` gives: a search
	 * here is a way of reaching one prayer, and the prayer is the thing worth
	 * linking to.
	 */
	let query = $state('');
	const searching = $derived(query.trim() !== '');

	const rows = $derived(groups.flatMap((group) => group.prayers));
	const matching = $derived(
		new Set(filterByQuery(rows, (prayer) => prayer.title, query).map((prayer) => prayer.slug))
	);

	/** The sections as drawn: everything while the box is empty, and otherwise
	 *  only what survived, with a section that kept nothing dropped whole. */
	const shown = $derived(
		searching
			? groups
					.map((group) => ({
						...group,
						prayers: group.prayers.filter((prayer) => matching.has(prayer.slug))
					}))
					.filter((group) => group.prayers.length > 0)
			: groups
	);

	/** Counted over what is DRAWN and not over `matching`, which is a set of
	 *  slugs: a prayer listed under two sections is two rows on the page. */
	const shownCount = $derived(shown.reduce((n, group) => n + group.prayers.length, 0));

	/** The aside follows the filter — a row there is a fragment, and a
	 *  fragment naming a section the query removed would scroll nowhere. */
	let sidebarItems = $derived(shown.map((group) => ({ href: `#${group.id}`, label: group.title })));

	/**
	 * OPEN UNTIL THE READER SHUTS ONE, which is the opposite default from
	 * `/quaestiones` and is what the two collections' sizes decide: sixteen
	 * shelves of questions are a list to choose between, five sections of
	 * prayers are the page itself, and a collection that arrived folded would
	 * put every prayer behind a click. The fold is here so a reader who wants
	 * the Marian prayers can put the rest away.
	 *
	 * ON A PHONE IT OPENS ON THE FIRST TWO SECTIONS AND FOLDS THE REST
	 * (2026-09-11, by direction). The columns are what pays for an open
	 * collection, and a phone has room for one — so the same seven sections
	 * that are a page at the landing width are a scroll of thirty-five rows
	 * there, and the fold does the work the columns were doing.
	 *
	 * BY POSITION AND NOT BY NAME. In English the two left open are Basic
	 * Prayers and the Rosary, but the section titles are `structure.json`'s
	 * and are the source's own words; what every collection agrees on is the
	 * ORDER, the shorter ones being that same list with sections missing. A
	 * count of sections is stable where a title is not.
	 *
	 * A FRAGMENT OPENS ITS OWN SECTION. The aside's table of contents and
	 * anyone else's bookmark both address a group by `id`, and a browser opens
	 * a closed `<details>` only for a target INSIDE it — so a link into a shut
	 * section would scroll to its heading and stop there.
	 *
	 * SEARCH OVERRIDES IT AND DOES NOT RECORD ITSELF, `/quaestiones`'s rule
	 * and it still earns its place under the opposite default: a reader who
	 * folded the Marian prayers away and then typed would get a heading and a
	 * count and no rows. `remember` ignores what the query opens, so clearing
	 * the box puts the page back as the reader had it.
	 */
	const NARROW_QUERY = '(max-width: 40rem)';
	const OPEN_ON_NARROW = 2;

	/** Read synchronously rather than on mount, `theme.svelte.ts`'s guard and
	 *  its reason: a value settled after the first paint is a phone watching
	 *  five sections shut themselves. */
	function narrowNow(): boolean {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
		return window.matchMedia(NARROW_QUERY).matches;
	}

	let narrow = $state(narrowNow());
	let opened = $state<Record<string, boolean>>({});

	onMount(() => {
		const mq = window.matchMedia(NARROW_QUERY);
		const follow = (event: MediaQueryListEvent) => (narrow = event.matches);
		mq.addEventListener('change', follow);
		return () => mq.removeEventListener('change', follow);
	});

	const defaultOpen = (index: number) => !narrow || index < OPEN_ON_NARROW;

	$effect(() => {
		const id = page.url.hash.slice(1);
		if (id) opened[id] = true;
	});

	/**
	 * The reader's own toggles, and only those — see `opened`.
	 *
	 * A TOGGLE THAT AGREES WITH THE DEFAULT RECORDS NOTHING, and it has to:
	 * `open` is reactive, so a viewport crossing the breakpoint closes five
	 * sections and the browser fires `toggle` for each. Written down, those
	 * would be five choices the reader never made — and rotating back would
	 * leave the page folded for a width that has room. Clearing the entry
	 * instead also gives a reader who toggles back to the default their
	 * default back, rather than a pin at the same value.
	 */
	function remember(id: string, index: number, open: boolean) {
		if (searching) return;
		if (open === defaultOpen(index)) delete opened[id];
		else opened[id] = open;
	}
</script>

<svelte:head>
	<title>{t('nav.prayers')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout index">
	<div class="landing-column">
		<h1>{t('nav.prayers')}</h1>
		{#if work}
			<p class="copyright-notice landing-measure"><CopyrightNotice manifest={work} /></p>
		{/if}

		<!-- `type="search"` for the clear affordance browsers give it; the
		     accessible name is an `aria-label` because a visible label would only
		     repeat the placeholder.

		     THE COUNT IS PART OF THE FIELD and not of the list — it is the field's
		     answer, and over the sections it would leave the box the reader typed
		     into saying nothing. Announced only while a query is live, `aria-live`
		     because the list shrinking is otherwise a silent change below, and the
		     paragraph holds its space either way so the first keystroke moves
		     nothing. -->
		<div class="search">
			<input
				type="search"
				class="prayer-search list-filter"
				bind:value={query}
				placeholder={t('prayers.search.label')}
				aria-label={t('prayers.search.label')}
			/>
			<p class="search-count" aria-live="polite">
				{#if searching}
					<span class="visually-hidden">{t('prayers.search.label')}: </span>{shownCount} /
					{rows.length}
				{/if}
			</p>
		</div>

		{#if searching && shownCount === 0}
			<p class="empty">{t('prayers.search.none')}</p>
		{/if}

		{#each shown as group, index (group.id)}
			<details
				class="prayer-group fold"
				id={group.id}
				open={searching || (opened[group.id] ?? defaultOpen(index))}
				ontoggle={(event) => remember(group.id, index, event.currentTarget.open)}
			>
				<summary><h2>{group.title}</h2></summary>
				<!-- `"hover"`: a row here is a destination the reader picked in order
				     to GO to it. It needed no marker until 2026-09-07, when
				     `PreviewTarget` stopped refusing a whole prayer — the refusal WAS
				     the marker. -->
				<ul class="prayer-list index-list" data-link-preview="hover">
					{#each group.prayers as meta (meta.slug)}
						<li class="index-row pointing-row">
							<a class="prayer-link" href={hrefFor({ kind: 'prayer', slug: meta.slug })}>
								{meta.title}
							</a>
						</li>
					{/each}
				</ul>
			</details>
		{/each}
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('nav.prayers')} items={sidebarItems} />
	</aside>
</div>

<style>
	h1 {
		font-family: var(--font-serif);
	}

	/* 0.8rem, not the app.css base's 0.75rem — this index page's own outlier. */
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
	}

	/* The field and its count on one row, at the width a name is read at
	   rather than the column's — the clothes are `.list-filter`
	   (styles/components.css), which `/quaestiones` wears too. */
	.search {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem 0.75rem;
		max-width: 40rem;
		margin-bottom: 2rem;
	}

	.prayer-search {
		flex: 1 1 12rem;
		min-width: 0;
	}

	.search-count {
		flex: 0 0 auto;
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.empty {
		color: var(--color-text-muted);
	}

	.prayer-group {
		margin: 1.75rem 0;
		/* Clears the sticky chrome when the aside's table of contents lands a
		   fragment on a heading. `scroll-padding-top` on the scroll container is
		   the site's usual instrument; this is the same value per target, these
		   being the only fragment targets on the page. */
		scroll-margin-top: calc(var(--sticky-chrome-height) + 1.5rem);
	}

	/* Five shut sections should read as five rows and not as five empty
	   sections, so a closed one keeps only the space that separates two rows. */
	.prayer-group:not([open]) {
		margin: 0.5rem 0;
	}

	/* THE RULE BELONGS TO THE ROW AND NOT TO THE HEADING'S WORDS. The summary
	   is a flex row (`.fold`, components.css) and the `h2` in it is only as
	   wide as the title, so the border that used to run the column's width
	   would underline three words and stop. */
	.prayer-group > summary {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
	}

	/* THE WHOLE HEADING ROW IS THE TOGGLE, which is what `<details>` is for.
	   The mark, the marker reset and the coarse-pointer target are `.fold` —
	   every disclosure on the site draws the same one. The hover answers on
	   the heading, which is the only word in the row. */
	summary:hover h2,
	summary:focus-visible h2 {
		color: var(--color-accent);
	}

	/* THE INTERFACE FACE ON A HEADING THAT IS THE SOURCE'S OWN WORDS
	   (2026-09-11, by direction), which is the one exception to the type rule
	   in CLAUDE.md §Type. What the reader operates here is the row, not the
	   words: the summary is a toggle over a filtered list, and the prayer's
	   own language is on the prayer's own page. It sets with the titles under
	   it for the same reason they are sans. */
	.prayer-group h2 {
		font-family: var(--font-sans);
		font-size: 1.1rem;
		margin: 0;
	}

	/* THE INTERFACE FACE, against the serif of the section titles over them.
	   `docs/reading.md` splits the two faces on authorship, and what is set
	   here is not a prayer but a way to reach one: 28 names in a column to
	   pick from, the job `/documenta`'s index rows and both sidebars already
	   do in sans. The words themselves are serif on the prayer's own page. */
	.prayer-link {
		font-family: var(--font-sans);
		text-decoration: none;
	}

	/*
	 * AS MANY COLUMNS AS THE TRACK WILL HOLD, filled DOWN and then across,
	 * which is what multicol gives and a grid does not: these are short names
	 * in the collection's own print order, and a reader scans a column of them
	 * rather than reading across a row. One column on a phone, three at the
	 * landing width, with no breakpoint to keep in step — the browser decides
	 * from the column width.
	 *
	 * The count is capped at three because the measure stops helping below
	 * that: a fourth column would be narrower than the longest title and start
	 * wrapping names that fit.
	 */
	.prayer-list {
		columns: 16rem 3;
		column-gap: 2.5rem;
	}

	/*
	 * NO RULE UNDER A ROW, which `.index-row` draws and which is right for a
	 * single ruled column and wrong for three. Across columns the rules are a
	 * grid, and a grid of hairlines under twenty short names is more structure
	 * than a list of names has — the same complaint `/quaestiones` records
	 * against ruling its shelf headings. What separates one row from the next
	 * is `.pointing-row`'s mark at the start of each, which says where a row
	 * BEGINS where a rule only said where one ended.
	 *
	 * The rule gone, the rows can close up: the padding was holding two of
	 * them apart across a line that is no longer there.
	 */
	.prayer-list .index-row {
		padding-block: 0.25rem;
		border-bottom: none;
		break-inside: avoid;
	}

	/* 28 titles down a ruled list, one per row: at rest the underline would
	   be 28 rules under 28 rules, which is why the row carries none. Hover
	   puts it back on the one row the pointer is over — the same promotion
	   the breadcrumb and the Magisterium groups make, and the reason none of
	   these lists needed a background tint to answer the pointer. */
	.prayer-link:hover,
	.prayer-link:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
</style>
