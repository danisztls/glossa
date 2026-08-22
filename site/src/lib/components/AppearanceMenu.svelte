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

	THREE ROWS BUILT TO ONE TEMPLATE: a `.field-label` over a `.field-control`
	of fixed height, and the control fills the panel's width. That is what
	makes the panel read as balanced rather than as three unrelated widgets —
	the segmented dark-mode control and the size stepper are both a full-width
	bar of three cells, and the sepia switch shares their row height. The
	sepia note sits BESIDE the switch, in the same row, rather than under it,
	so that turning dark mode on doesn't make one row taller than the other
	two.

	Sepia yields to dark and its row goes inert while dark is showing; the
	store (`$lib/theme.svelte.ts`) owns that rule and the note beside the
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
				<div class="field-control segmented" role="group" aria-label={t('darkMode.label')}>
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
				<span class="field-label">{t('sepia.label')}</span>
				<div class="field-control" role="none">
					<!-- The visible name is the label above, so the button carries the
					     same string as its accessible name rather than wrapping it. -->
					<button
						type="button"
						role="menuitemcheckbox"
						aria-checked={appearance.sepia}
						aria-label={t('sepia.label')}
						class="switch-btn"
						disabled={appearance.dark}
						onclick={() => appearance.toggleSepia()}
					>
						<span class="switch" class:on={appearance.sepia}></span>
					</button>
					{#if appearance.dark}
						<span class="note">{t('sepia.lightOnly')}</span>
					{/if}
				</div>
			</div>

			<div class="field" role="none">
				<span class="field-label">{t('fontSize.label')}</span>
				<div class="field-control stepper" role="none">
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
		min-width: 11rem;
		/* Tight, because the controls are meant to run the full width of the
		   panel — the padding is a hairline margin around a stack of bars, not
		   a frame around a list of items. The titles take their own small
		   inset back below, so they sit in from the edge the bars reach. */
		padding: 0.4rem;
		/* One height for every control row, so the three fields are the same
		   height and the panel reads as one list rather than three widgets. */
		--control-height: 1.7rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	/* Every row's title, the sepia switch's own label included: all three name
	   a setting of the same rank, so all three are set alike. Uppercase and
	   tracked, at the same size as the segmented control's own text — these
	   are labels on a panel of bars, and at this size mixed case reads as
	   prose that got small rather than as a heading. */
	.field-label {
		padding-inline: 0.2rem;
		font-size: 0.68rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		line-height: 1.2;
		color: var(--color-text-muted);
	}

	/* Even spacing between the fields, and no rule between the theme pair and
	   the size stepper: a divider would have made one of the two gaps larger
	   than the other, which is the imbalance it was meant to organize. */
	.field + .field {
		margin-block-start: 0.55rem;
	}

	.field-control {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		height: var(--control-height);
	}

	/* One control, three cells: a single bordered box divided by hairlines,
	   rather than three separate buttons, so the group reads as "pick one of
	   these" the way a radio set should. */
	.segmented {
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		overflow: hidden;
		gap: 0;
	}

	.segment {
		flex: 1;
		min-width: 0;
		height: 100%;
		padding: 0 0.2rem;
		border: 0;
		background: var(--color-bg-elevated);
		color: var(--color-text);
		/* Small caps-height text with a little tracking: at three cells across
		   a 12rem panel the words are chips, not prose, and uppercase keeps
		   them legible at a size where mixed case would not be. */
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		line-height: 1;
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

	.switch-btn {
		display: inline-flex;
		align-items: center;
		height: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		cursor: pointer;
	}

	/* Dimmed whole, rather than by recolouring the label: the label sits
	   outside the button now, and is already muted. */
	.switch-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	/* Drawn rather than a checkbox: `appearance: none` on a real one would
	   need the same box anyway, and the button already carries the state via
	   `role="menuitemcheckbox"` + `aria-checked`. Decorative, so no ARIA. */
	.switch {
		position: relative;
		display: block;
		width: 2.4rem;
		height: 1.4rem;
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
		width: 1rem;
		height: 1rem;
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
		   under an RTL interface language. Width less knob less both insets. */
		translate: 1rem 0;
	}

	/* No wrapping: the row has a fixed height, so a second line would spill
	   out of it. If a translation ever outgrows the space the panel widens
	   (up to `.menu-panel`'s max-width) instead, which is the visible
	   failure rather than the silent one. */
	.note {
		font-size: 0.7rem;
		line-height: 1.2;
		white-space: nowrap;
		color: var(--color-text-muted);
	}

	/* Laid out like the segmented control above it — the two ends of a
	   full-width bar with the reading between them — so the panel's two
	   multi-part controls have the same silhouette. */
	.stepper {
		justify-content: space-between;
	}

	.step-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--control-height);
		height: 100%;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.step-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.value {
		flex: 1;
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		color: var(--color-text);
	}
</style>
