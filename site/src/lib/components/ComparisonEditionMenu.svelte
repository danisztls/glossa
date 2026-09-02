<!--
	The comparison column's own edition picker (task brief, defect 2: "a
	selector in the right column's header, listing the other editions
	available for the work being read"). Reuses the same `.menu`/
	`.menu-trigger`/`.menu-panel`/`.menu-item` primitives `EditionMenu`
	already established (app.css), including its outside-click and Escape
	handling — not a second, invented dropdown.

	DELIBERATELY NOT `EditionMenu` ITSELF, despite the near-identical markup:
	that component switches the PRIMARY reading edition through
	`content.svelte.ts`, one instance in the page chrome, entirely
	independent of compare mode. This one writes to the compare PREFERENCE
	(`compare-pref.svelte.ts`) instead — a different store, a different
	semantic ("what should the SECOND column show"), and a different
	lifetime (it only exists while compare mode is on, inside
	`CompareGrid`'s right header via its `rightHeaderExtra` slot). Sharing
	the component would mean branching its behaviour on which of two stores
	to write to, which is worse than the duplication.

	`editions` is never the FULL edition list for the work type — the caller
	filters out the primary edition (and anything this page doesn't actually
	have text for) before passing it down; see each reading route's
	`otherEditions`. Rendered only when the caller has something to offer
	(`editions.length > 0` at the call site), the same "hide, don't disable"
	posture `EditionMenu` and `CompareToggle` already take.

	`editionStyle` MIRRORS `EditionMenu`'s FORK (see that component's
	docblock): only the Bible is expected to ever carry more than one edition
	per language, so everywhere else this picker is functionally a language
	switch and collapses to the language name plus its code badge, with no
	title/copyright line. Passed down rather than re-derived from the route,
	because this component already takes no other route-shaped input — the
	caller (which knows its own `WorkTypeKey`) is a cheaper source of truth
	than teaching this component to inspect `page.url.pathname` itself.
-->
<script lang="ts">
	import { baseLang, contentLangChain, languageDisplayName } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { matchesQuery } from '$lib/highlight';
	import { editionSearchText, FILTER_MIN_ROWS, orderByLangChain } from '$lib/menu-filter';
	import { i18n, t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { keepInViewport } from '$lib/floating';
	import type { WorkManifest } from '$lib/types';

	interface Props {
		editions: WorkManifest[];
		/** The work id currently shown in the second column, if any. */
		current: string | undefined;
		onselect: (workId: string) => void;
		/** Default false: every caller except the Bible route is a language
		 *  switch in disguise, not a true multi-edition picker. */
		editionStyle?: boolean;
	}

	let { editions, current, onselect, editionStyle = false }: Props = $props();

	/** Reader's language first, then its neighbours — `EditionMenu`'s matching
	 *  `$derived` is where the reasoning is written down. Ordered HERE rather
	 *  than by the caller for the same reason this component filters here: the
	 *  routes that build `otherEditions` are deciding what may be offered, and
	 *  what order to offer it in is the panel's own business. */
	const rows = $derived(orderByLangChain(editions, contentLangChain(i18n.lang)));

	const currentEdition = $derived(editions.find((e) => e.id === current));
	const triggerLabel = $derived(
		currentEdition
			? editionStyle
				? currentEdition.short_title
				: languageDisplayName(currentEdition.language)
			: t('edition.select')
	);

	const menu = new Menu();

	/** Same box, same threshold and same reset as `EditionMenu`'s — that
	 *  component's docblock is where the reasoning is written down. This list
	 *  is always one shorter than its (the caller removes the primary column's
	 *  own edition), so it crosses `FILTER_MIN_ROWS` one edition later. */
	let query = $state('');
	let filterEl: HTMLInputElement | undefined = $state();

	const showFilter = $derived(rows.length >= FILTER_MIN_ROWS);
	const visible = $derived(
		showFilter && query.trim()
			? rows.filter((edition) =>
					matchesQuery(editionSearchText(edition, languageDisplayName(edition.language)), query)
				)
			: rows
	);

	$effect(() => {
		if (menu.open) filterEl?.focus();
		else query = '';
	});

	function choose(workId: string) {
		onselect(workId);
		menu.closeAndRefocus();
	}
</script>

<svelte:window onclick={menu.onWindowClick} />

<div class="menu comparison-edition-menu" bind:this={menu.containerEl}>
	<button
		type="button"
		bind:this={menu.triggerEl}
		class="menu-trigger wide"
		aria-haspopup="menu"
		aria-expanded={menu.open}
		aria-label={`${t('edition.label')}: ${triggerLabel}`}
		title={t('edition.label')}
		onclick={menu.toggle}
	>
		<!-- Text only, for the reason `EditionMenu`'s matching trigger records:
		     the label names the edition and the glyph added nothing to it. The
		     `check` below stays — that one marks which row is chosen, which is
		     information the panel has no other way to show. -->
		<span class="trigger-label">{triggerLabel}</span>
	</button>
	{#if menu.open}
		<div class="panel-surface menu-panel menu-panel-filtered" use:keepInViewport>
			{#if showFilter}
				<input
					type="search"
					class="menu-filter"
					bind:this={filterEl}
					bind:value={query}
					onkeydown={menu.onPanelKeydown}
					placeholder={t('edition.filter')}
					aria-label={t('edition.filter')}
				/>
			{/if}
			{#if visible.length === 0}
				<p class="menu-empty">{t('menu.noMatches')}</p>
			{:else}
				<ul
					class="menu-list"
					role="menu"
					aria-label={t('edition.label')}
					onkeydown={menu.onPanelKeydown}
				>
					{#each visible as edition (edition.id)}
						{@const isCurrent = edition.id === current}
						<li role="none">
							<button
								type="button"
								role="menuitemradio"
								aria-checked={isCurrent}
								class="menu-item"
								class:current={isCurrent}
								onclick={() => choose(edition.id)}
							>
								<span class="menu-item-main">
									{#if isCurrent}<Icon name="check" />{/if}
									<span>{editionStyle ? edition.title : languageDisplayName(edition.language)}</span
									>
									<span class="edition-lang">{baseLang(edition.language).toUpperCase()}</span>
								</span>
								{#if editionStyle}
									<span class="menu-item-meta">
										{edition.short_title} &middot; {copyrightLabel(edition)}
									</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* Smaller than EditionMenu's own trigger label — this one sits inside a
	   reading column's header rather than the page chrome, where the extra
	   width matters more. */
	.trigger-label {
		font-size: 0.75rem;
		max-width: 8rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
