<!--
	Theme picker: Auto / Light / Dark / Sepia (replaces the old click-to-cycle
	`ThemeToggle.svelte` — a menu makes "what am I currently on, and what are
	the other options" visible at a glance instead of requiring the reader to
	cycle blind). Auto is the default and means "follow prefers-color-scheme"
	(see `$lib/theme.svelte.ts`).

	Dropdown shape (trigger button + `.menu-panel` of `.menu-item`s) is shared
	with `FontSizeMenu`/`EditionMenu` via the `.menu*` primitives in
	`app.css`, and the open/close, outside-click and Escape handling comes
	from the shared `Menu` in `./menu.svelte.ts` — see that module on why the
	behavior half could finally be shared once runes arrived.
-->
<script lang="ts">
	import { themeStore, type Theme } from '$lib/theme.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { t } from '$lib/i18n.svelte';

	const THEMES: Theme[] = ['auto', 'light', 'dark', 'sepia'];

	const menu = new Menu();

	function choose(theme: Theme) {
		themeStore.set(theme);
		menu.closeAndRefocus();
	}
</script>

<svelte:window onclick={menu.onWindowClick} />

<div class="menu" bind:this={menu.containerEl}>
	<button
		type="button"
		bind:this={menu.triggerEl}
		class="menu-trigger"
		aria-haspopup="menu"
		aria-expanded={menu.open}
		aria-label={`${t('theme.label')}: ${t(`theme.${themeStore.current}`)}`}
		title={t('theme.label')}
		onclick={menu.toggle}
	>
		<Icon name="palette" />
	</button>
	{#if menu.open}
		<ul
			class="menu-panel"
			role="menu"
			aria-label={t('theme.label')}
			onkeydown={menu.onPanelKeydown}
		>
			{#each THEMES as theme (theme)}
				{@const current = themeStore.current === theme}
				<li role="none">
					<button
						type="button"
						role="menuitemradio"
						aria-checked={current}
						class="menu-item"
						class:current
						onclick={() => choose(theme)}
					>
						<span class="menu-item-main">
							{#if current}<Icon name="check" />{/if}
							<span>{t(`theme.${theme}`)}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
