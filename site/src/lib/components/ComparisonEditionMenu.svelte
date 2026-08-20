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
-->
<script lang="ts">
	import { baseLang } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import type { WorkManifest } from '$lib/types';

	interface Props {
		editions: WorkManifest[];
		/** The work id currently shown in the second column, if any. */
		current: string | undefined;
		onselect: (workId: string) => void;
	}

	let { editions, current, onselect }: Props = $props();

	const currentEdition = $derived(editions.find((e) => e.id === current));

	const menu = new Menu();

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
		aria-label={`${t('edition.label')}: ${currentEdition?.short_title ?? t('edition.select')}`}
		title={t('edition.label')}
		onclick={menu.toggle}
	>
		<Icon name="book-open" />
		<span class="trigger-label">{currentEdition?.short_title ?? t('edition.select')}</span>
	</button>
	{#if menu.open}
		<ul
			class="menu-panel"
			role="menu"
			aria-label={t('edition.label')}
			onkeydown={menu.onPanelKeydown}
		>
			{#each editions as edition (edition.id)}
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
							<span>{edition.title}</span>
							<span class="edition-lang">{baseLang(edition.language).toUpperCase()}</span>
						</span>
						<span class="menu-item-meta">
							{edition.short_title} &middot; {copyrightLabel(edition)}
						</span>
					</button>
				</li>
			{/each}
		</ul>
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
