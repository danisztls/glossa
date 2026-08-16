<!--
	Reading font-size control: fine adjustment on top of the base reading
	size `app.css` sets on `.reading-text` (see the `--reading-base` /
	`--reading-scale` split documented there). Drives `$lib/prefs.svelte.ts`'s
	`fontScale` store, which is what actually writes `--reading-scale`.

	Unlike `ThemeMenu`/`EditionMenu`, picking an option here doesn't close
	the panel — a reader fine-tuning size wants to click +/- repeatedly and
	watch the value change, not reopen the menu after every click. The panel
	still closes on Escape and on an outside click, same as the others.
-->
<script lang="ts">
	import { fontScale, MIN_FONT_SCALE, MAX_FONT_SCALE, DEFAULT_FONT_SCALE } from '$lib/prefs.svelte';
	import Icon from './Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	let open = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();
	let triggerEl: HTMLButtonElement | undefined = $state();

	const percent = $derived(Math.round(fontScale.value * 100));

	function close() {
		open = false;
	}

	function onWindowClick(e: MouseEvent) {
		if (!open) return;
		if (menuEl && e.target instanceof Node && !menuEl.contains(e.target)) close();
	}

	function onPanelKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			triggerEl?.focus();
		} else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
			e.preventDefault();
			fontScale.increase();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
			e.preventDefault();
			fontScale.decrease();
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
		aria-label={`${t('fontSize.label')}: ${percent}%`}
		title={t('fontSize.label')}
		onclick={() => (open = !open)}
	>
		<Icon name="type" />
	</button>
	{#if open}
		<div
			class="menu-panel font-size-panel"
			role="menu"
			tabindex="-1"
			aria-label={t('fontSize.label')}
			onkeydown={onPanelKeydown}
		>
			<button
				type="button"
				role="menuitem"
				class="step-btn"
				aria-label={t('fontSize.smaller')}
				disabled={fontScale.value <= MIN_FONT_SCALE}
				onclick={() => fontScale.decrease()}
			>
				<Icon name="minus" />
			</button>
			<output class="value" aria-live="polite">{percent}%</output>
			<button
				type="button"
				role="menuitem"
				class="step-btn"
				aria-label={t('fontSize.larger')}
				disabled={fontScale.value >= MAX_FONT_SCALE}
				onclick={() => fontScale.increase()}
			>
				<Icon name="plus" />
			</button>
			<button
				type="button"
				role="menuitem"
				class="step-btn reset-btn"
				aria-label={t('fontSize.reset')}
				disabled={fontScale.value === DEFAULT_FONT_SCALE}
				onclick={() => fontScale.reset()}
			>
				<Icon name="rotate-ccw" />
			</button>
		</div>
	{/if}
</div>

<style>
	.font-size-panel {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-width: 0;
		width: max-content;
		padding: 0.35rem;
	}

	.step-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--color-bg-elevated);
		color: var(--color-text);
		cursor: pointer;
	}

	.step-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.reset-btn {
		margin-inline-start: 0.25rem;
		border-color: transparent;
		background: transparent;
		color: var(--color-text-muted);
	}

	.value {
		min-width: 3.2em;
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-size: 0.9rem;
		color: var(--color-text);
	}
</style>
