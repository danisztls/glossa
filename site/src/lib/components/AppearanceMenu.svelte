<!--
	The reader's visual settings, in one popover: dark mode, the sepia paper
	tint, and the reading text size.

	WHY ONE MENU. These were two triggers in the header — a palette icon for a
	four-item theme list (auto/light/dark/sepia) and an "Aa" icon for the size
	stepper. Two icons for one question ("how does this page look to me?") is
	one too many in a row that already holds search, language, print and
	install; and the theme list itself conflated two independent choices,
	since picking sepia there silently meant "and stop following the system's
	dark preference". Splitting theme into the two axes it always was — a
	tri-state dark mode and a sepia toggle — makes three controls, which is
	exactly the point at which they want a panel rather than a row of icons.

	Sepia yields to dark and its row goes inert while dark is showing; the
	store (`$lib/theme.svelte.ts`) owns that rule and the note under the
	switch is what says so out loud. The switch keeps showing the reader's
	stored preference while inert rather than snapping to off — it is
	suspended, not cleared.

	NOTHING HERE CLOSES THE PANEL. `FontSizeMenu` already worked that way (a
	reader stepping the size up wants to keep clicking and watching), and the
	same is true of every control now that they share a panel: comparing dark
	against light means flipping back and forth. Escape and an outside click
	still close it, via the shared `Menu` in `./menu.svelte.ts`.
-->
<script lang="ts">
	import { appearance, DARK_MODES } from '$lib/theme.svelte';
	import { fontScale, MIN_FONT_SCALE, MAX_FONT_SCALE } from '$lib/prefs.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { t } from '$lib/i18n.svelte';

	const menu = new Menu();

	const percent = $derived(Math.round(fontScale.value * 100));

	// Escape comes from the shared `Menu`; the arrow keys are this menu's own
	// and step the text size. They are gated on the focused element being one
	// of the stepper's buttons, because the panel also holds a set of radio
	// buttons where an arrow key means something else entirely.
	function onPanelKeydown(e: KeyboardEvent) {
		menu.onPanelKeydown(e);
		if (!(e.target instanceof Element) || !e.target.closest('.stepper')) return;
		if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
			e.preventDefault();
			fontScale.increase();
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
			e.preventDefault();
			fontScale.decrease();
		}
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
		aria-label={t('appearance.label')}
		title={t('appearance.label')}
		onclick={menu.toggle}
	>
		<Icon name="sliders-horizontal" />
	</button>
	{#if menu.open}
		<div
			class="menu-panel appearance-panel"
			role="menu"
			tabindex="-1"
			aria-label={t('appearance.label')}
			onkeydown={onPanelKeydown}
		>
			<!-- The layout wrappers are `role="none"` so the menuitems inside them
			     still read as direct children of the menu — the same job the other
			     menus' `<li role="none">` does. -->
			<div class="field" role="none">
				<span class="field-label">{t('darkMode.label')}</span>
				<div class="segmented" role="group" aria-label={t('darkMode.label')}>
					{#each DARK_MODES as mode (mode)}
						{@const current = appearance.mode === mode}
						<button
							type="button"
							role="menuitemradio"
							aria-checked={current}
							class="segment"
							class:current
							onclick={() => appearance.setMode(mode)}
						>
							{t(`darkMode.${mode}`)}
						</button>
					{/each}
				</div>
			</div>

			<div class="field" role="none">
				<button
					type="button"
					role="menuitemcheckbox"
					aria-checked={appearance.sepia}
					class="switch-row"
					disabled={appearance.dark}
					onclick={() => appearance.toggleSepia()}
				>
					<span class="field-label">{t('sepia.label')}</span>
					<span class="switch" class:on={appearance.sepia}></span>
				</button>
				{#if appearance.dark}
					<p class="note">{t('sepia.lightOnly')}</p>
				{/if}
			</div>

			<hr class="divider" />

			<div class="field" role="none">
				<span class="field-label">{t('fontSize.label')}</span>
				<div class="stepper" role="none">
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
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.appearance-panel {
		min-width: 13rem;
		padding: 0.5rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	/* Every row's title, the sepia switch's own label included: all three name
	   a setting of the same rank, so all three are set alike. */
	.field-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.field + .field {
		margin-block-start: 0.5rem;
	}

	.divider {
		margin-block: 0.5rem;
		border: 0;
		border-block-start: 1px solid var(--color-border);
	}

	/* One control, three cells: a single bordered box divided by hairlines,
	   rather than three separate buttons, so the group reads as "pick one of
	   these" the way a radio set should. */
	.segmented {
		display: flex;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		overflow: hidden;
	}

	.segment {
		flex: 1;
		padding: 0.3rem 0.4rem;
		border: 0;
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-size: 0.85rem;
		line-height: 1.2;
		cursor: pointer;
	}

	.segment + .segment {
		border-inline-start: 1px solid var(--color-border);
	}

	.segment:hover:not(.current) {
		color: var(--color-accent);
	}

	.segment.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	.switch-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.6rem;
		width: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		text-align: start;
		cursor: pointer;
	}

	/* Dimmed whole, rather than by recolouring the label: the label is now a
	   `.field-label` and already muted, so there was no colour left to shift. */
	.switch-row:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	/* Drawn rather than a checkbox: `appearance: none` on a real one would
	   need the same box anyway, and the button already carries the state via
	   `role="menuitemcheckbox"` + `aria-checked`. Decorative, so no ARIA. */
	.switch {
		position: relative;
		flex: none;
		width: 1.9rem;
		height: 1.1rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-bg-elevated);
		transition: background-color 120ms ease;
	}

	.switch::after {
		content: '';
		position: absolute;
		inset-block-start: 0.15rem;
		inset-inline-start: 0.15rem;
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--color-text-muted);
		transition:
			translate 120ms ease,
			background-color 120ms ease;
	}

	.switch.on {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.switch.on::after {
		background: var(--color-accent-contrast);
		/* Logical, so the knob still travels toward the switch's "on" end
		   under an RTL interface language. */
		translate: 0.8rem 0;
	}

	.stepper {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.step-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
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

	.value {
		min-width: 3em;
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
		color: var(--color-text);
	}

	.note {
		margin: 0;
		font-size: 0.75rem;
		line-height: 1.3;
		color: var(--color-text-muted);
	}
</style>
