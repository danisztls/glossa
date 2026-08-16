<!--
	Theme picker: Auto / Light / Dark / Sepia (replaces the old click-to-cycle
	`ThemeToggle.svelte` — a menu makes "what am I currently on, and what are
	the other options" visible at a glance instead of requiring the reader to
	cycle blind). Auto is the default and means "follow prefers-color-scheme"
	(see `$lib/theme.svelte.ts`).

	Dropdown shape (trigger button + `.menu-panel` of `.menu-item`s) is shared
	with `FontSizeMenu`/`EditionMenu` via the `.menu*` primitives in
	`app.css`; each component still owns its own open/close state and
	keyboard/outside-click handling since Svelte has no cross-file scoped
	style or behavior sharing below a full component.
-->
<script lang="ts">
	import { themeStore, type Theme } from '$lib/theme.svelte';
	import Icon from './Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	const THEMES: Theme[] = ['auto', 'light', 'dark', 'sepia'];

	let open = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();
	let triggerEl: HTMLButtonElement | undefined = $state();

	function close() {
		open = false;
	}

	function choose(theme: Theme) {
		themeStore.set(theme);
		close();
		triggerEl?.focus();
	}

	// Closes on any click outside the trigger+panel — attached to the window
	// rather than a backdrop element so the rest of the page stays clickable
	// (unlike JumpBox's modal dialog, this is a lightweight menu, not a
	// dialog that should block interaction with the page behind it).
	function onWindowClick(e: MouseEvent) {
		if (!open) return;
		if (menuEl && e.target instanceof Node && !menuEl.contains(e.target)) close();
	}

	function onPanelKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			triggerEl?.focus();
		}
	}
</script>

<svelte:window onclick={onWindowClick} />

<div class="menu" bind:this={menuEl}>
	<button
		type="button"
		bind:this={triggerEl}
		class="menu-trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-label={`${t('theme.label')}: ${t(`theme.${themeStore.current}`)}`}
		title={t('theme.label')}
		onclick={() => (open = !open)}
	>
		<Icon name="palette" />
	</button>
	{#if open}
		<ul class="menu-panel" role="menu" aria-label={t('theme.label')} onkeydown={onPanelKeydown}>
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
