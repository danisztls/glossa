<!--
	How the reading text is set — its size and its face — in the bar of the
	page it sets.

	IT WAS A ROW IN `SettingsMenu`, in the header of every page, and held the
	size alone. What that row changed is `.reading-text` and the column
	measured against it, which exists on exactly the routes that render a
	reading bar — so on the home page, `/schola`, `/calendarium`, `/signata`
	and `/colophon` a reader could step from 80% to 180% and watch nothing
	happen. A control belongs on the surface its effect is visible on, and the
	reading bar is that surface's definition.

	It leaves behind a panel that is now about the PAGE — dark mode, sepia,
	OLED, monochrome, the door to the network — where the reading size was the
	one row in it about the text. That is why the move is not a loss for
	`SettingsMenu`: it is the row that made the panel answer two questions.

	THE FACE IS THE SECOND ROW AND THE REASON THE PANEL IS NOT CALLED "TEXT
	SIZE". EB Garamond is the right face for what these works wrote and is a
	hard face for some people to read — fine hairlines, old-style figures, a
	modest x-height. Source Sans 3 is downloaded on every visit for the chrome
	already, so the alternative costs a reader nothing. What it costs US is in
	`styles/tokens.css`, which measures the second face the way the first was
	measured and carries the argument.

	A PANEL AND NOT INLINE CONTROLS, which the bar has room for at desktop
	widths and not at a phone's. Every other control in that row is one
	icon-sized trigger; a bare `[-] 120% [+]` beside a two-cell face picker
	would be the widest thing in a row that already carries two edition names
	as wide as "Bíblia Sagrada (Matos Soares)" and wraps beneath them. The
	panel costs one click to open and none to keep open, which is the trade
	`SettingsMenu`'s "nothing here closes the panel" rule already made for
	this control: a reader stepping the size or trying the other face wants to
	keep clicking and watching the text behind the panel reflow.

	Built to the shared row template (`.field`, `.segmented` in
	`styles/menus.css`), so the two rows here and the four in `SettingsMenu`
	are one family and a third preference is a `<div class="field">`.

	THE PERCENTAGE IS A BUTTON, not a readout. The stepper had no way home
	from 180% but eight clicks on the other arrow, and the one place a reader
	looks while stepping is the number. Its `aria-live` stays, so the value is
	still announced as it changes; `disabled` at 100% is what says the button
	is spent rather than broken.

	THE ARROW KEYS STEP THE SIZE, and they are gated on the focus being inside
	the stepper — the face row is a radio group where an arrow means "the
	other face", which the browser does not do for `<button role=menuitemradio>`
	but which a reader may reasonably expect, and stepping the type size from
	it would be the wrong answer either way. `SettingsMenu` carried the same
	gate for the same reason before this panel existed.

	Hidden in focus mode with the rest of the bar, `ZenToggle` excepted
	(`styles/zen.css`). That is not a regression — the settings panel's
	trigger sits in the site header, which the same mode hides — but it is the
	argument to weigh if these are ever wanted there: the mode's promise is
	that the bar carries the way back out and nothing else.
-->
<script lang="ts">
	import {
		fontScale,
		readingFace,
		DEFAULT_FONT_SCALE,
		MIN_FONT_SCALE,
		MAX_FONT_SCALE,
		type ReadingFace
	} from '$lib/prefs.svelte';
	import { keepInViewport } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';

	const menu = new Menu();

	const percent = $derived(Math.round(fontScale.value * 100));

	/** Serif first: it is the default, and the row reads left to right from
	 *  what the reader has unless they said otherwise. */
	const FACES: ReadingFace[] = ['serif', 'sans'];

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
		aria-label={t('type.label')}
		title={t('type.label')}
		onclick={menu.toggle}
	>
		<Icon name="a-large-small" />
	</button>
	{#if menu.open}
		<div
			class="panel-surface menu-panel type-panel"
			use:keepInViewport
			role="menu"
			tabindex="-1"
			aria-label={t('type.label')}
			onkeydown={onPanelKeydown}
		>
			<div class="field" role="none">
				<span class="field-label label-micro">{t('fontSize.label')}</span>
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
					<button
						type="button"
						role="menuitem"
						class="value"
						aria-label={t('fontSize.reset')}
						aria-live="polite"
						disabled={fontScale.value === DEFAULT_FONT_SCALE}
						onclick={() => fontScale.reset()}
					>
						{percent}%
					</button>
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

			<!-- The same segmented control `SettingsMenu` picks a dark mode with,
			     and `menuitemradio` for the same reason: the two faces are
			     alternatives, where the apparatus panel's rows are not. -->
			<div class="field" role="none">
				<span class="field-label label-micro">{t('face.label')}</span>
				<div class="field-control segmented" role="group" aria-label={t('face.label')}>
					{#each FACES as face (face)}
						{@const current = readingFace.value === face}
						<button
							type="button"
							role="menuitemradio"
							aria-checked={current}
							class="segment"
							class:current
							onclick={() => readingFace.set(face)}
						>
							{t(`face.${face}`)}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.type-panel {
		/* `SettingsMenu`'s width, and for its reason: the widest thing in
		   either panel is a full-width bar of cells carrying a word each, and
		   two panels a reader opens a minute apart should not be two sizes. */
		min-width: 11rem;
		padding: 0.4rem;
		/* The shared `.field` rules honour this and do not set it — see the
		   template's docblock in `styles/menus.css`. */
		--control-height: 1.7rem;
	}

	/* Laid out like the segmented control below it — the two ends of a
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
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.step-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* A button wearing no chrome at all: the reading is what it was, and the
	   affordance is that it responds to the pointer. A bordered cell here
	   would make the row read as three buttons of equal weight, where two of
	   them are the control and this one is a way back. */
	.value {
		flex: 1;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		text-align: center;
		font: inherit;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		line-height: 1;
		color: var(--color-text);
		cursor: pointer;
	}

	.value:hover:not(:disabled) {
		color: var(--color-accent);
	}

	/* Not dimmed at rest — it is still the reading, and a greyed number would
	   say the size itself was unavailable. Only the pointer changes. */
	.value:disabled {
		cursor: default;
	}
</style>
