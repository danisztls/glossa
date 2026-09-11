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
	 */
	import { page } from '$app/state';
	import { getWork, listPrayerGroups, prayerIndexLang } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { t } from '$lib/i18n.svelte';

	/** `prayerIndexLang`, not `resolveEditionTag`: English (UK) is five prayers
	 *  and cannot enumerate a 28-prayer collection, so the listing runs on the
	 *  collection it falls back to while each prayer's own page still resolves
	 *  to the UK wording where there is one. */
	let lang = $derived(prayerIndexLang(content.tagFor('prayer')));
	let groups = $derived(listPrayerGroups(lang));
	let work = $derived(getWork(`prayer.common.${lang}`));
	let sidebarItems = $derived(
		groups.map((group) => ({ href: `#${group.id}`, label: group.title }))
	);

	/**
	 * OPEN UNTIL THE READER SHUTS ONE, which is the opposite default from
	 * `/quaestiones` and is what the two collections' sizes decide: sixteen
	 * shelves of questions are a list to choose between, five sections of
	 * prayers are the page itself, and a collection that arrived folded would
	 * put every prayer behind a click. The fold is here so a reader who wants
	 * the Marian prayers can put the rest away.
	 *
	 * A FRAGMENT OPENS ITS OWN SECTION. The aside's table of contents and
	 * anyone else's bookmark both address a group by `id`, and a browser opens
	 * a closed `<details>` only for a target INSIDE it — so a link into a shut
	 * section would scroll to its heading and stop there.
	 */
	let opened = $state<Record<string, boolean>>({});

	$effect(() => {
		const id = page.url.hash.slice(1);
		if (id) opened[id] = true;
	});
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

		{#each groups as group (group.id)}
			<details
				class="prayer-group fold"
				id={group.id}
				open={opened[group.id] ?? true}
				ontoggle={(event) => (opened[group.id] = event.currentTarget.open)}
			>
				<summary><h2>{group.title}</h2></summary>
				<!-- `"hover"`: a row here is a destination the reader picked in order
				     to GO to it. It needed no marker until 2026-09-07, when
				     `PreviewTarget` stopped refusing a whole prayer — the refusal WAS
				     the marker. -->
				<ul class="prayer-list index-list" data-link-preview="hover">
					{#each group.prayers as meta (meta.slug)}
						<li class="index-row">
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
	/* The work's name and the source's own section titles — `group.title` is
	   `structure.json`'s, not a string of ours. */
	h1,
	h2 {
		font-family: var(--font-serif);
	}

	/* 0.8rem, not the app.css base's 0.75rem — this index page's own outlier. */
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
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

	.prayer-group h2 {
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
