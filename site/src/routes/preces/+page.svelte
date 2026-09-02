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
	 */
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
</script>

<svelte:head>
	<title>{t('prayers.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<div class="content-column">
		<h1>{t('prayers.landing.title')}</h1>
		<p class="page-tagline">{t('prayers.landing.tagline')}</p>
		{#if work}
			<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
		{/if}

		{#each groups as group (group.id)}
			<section class="prayer-group" id={group.id} aria-labelledby={`${group.id}-heading`}>
				<h2 id={`${group.id}-heading`}>{group.title}</h2>
				<ul class="prayer-list index-list">
					{#each group.prayers as meta (meta.slug)}
						<li class="index-row">
							<a class="prayer-link" href={hrefFor({ kind: 'prayer', slug: meta.slug })}>
								{meta.title}
							</a>
							<!-- A prayer is recognized by its opening words far more than by
							     its title, and twenty-eight titles down a page gave a reader
							     nothing to recognize. Not a link: the title above it already
							     is one, and a second target for the same address would double
							     every row's tab stop. The Rosary carries none -- see
							     `incipitOf` in scripts/sync-corpus.mjs. -->
							{#if meta.incipit}
								<p class="prayer-incipit">{meta.incipit}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('prayers.landing.title')} items={sidebarItems} />
	</aside>
</div>

<style>
	/* 0.8rem, not the app.css base's 0.75rem — this index page's own outlier. */
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
	}

	.prayer-group {
		margin: 1.75rem 0;
	}

	.prayer-group h2 {
		font-size: 1.1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
		margin: 0 0 0.5rem;
	}

	.prayer-link {
		font-family: var(--font-serif);
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

	/* The same treatment `/documenta` gives a document's description and
	   `/signata` its excerpt: muted, a step down in size, clamped to one line
	   so a long opening cannot turn the list back into a wall. Italic because
	   this is the prayer's own words quoted inside a listing, not chrome
	   describing it. */
	.prayer-incipit {
		margin: 0.25rem 0 0;
		font-family: var(--font-serif);
		font-style: italic;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		max-width: 60ch;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
