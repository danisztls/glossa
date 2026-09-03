<!--
	The reader's settings, in one popover: dark mode, the sepia paper tint, the
	OLED true-black ground, the monochrome palette, the reading text size — and
	offline mode.

	IT WAS `AppearanceMenu` UNTIL OFFLINE MODE, and the rename is the honest
	half of that change. Everything above the divider is still the one question
	the panel was built around ("how does this page look to me?"); offline mode
	is a second question, and a panel called Appearance holding it would have
	been a worse lie than a panel called Settings holding five appearance rows.
	The trigger is the same slider icon, which is what a reader reads as
	"settings" anyway.

	OFFLINE MODE IS BEHIND A FOLD, AND THAT IS A MEASUREMENT RATHER THAN A
	TASTE. What the switch buys a reader today is narrow: the automatic waves
	put the shell, the prayers, the Compendium and ONE Catechism edition on the
	device (`sw-policy.ts`'s `AUTOMATIC_WAVES`), and nothing else — the
	Scripture, magisterium and Summa waves are 23-28 MB each and are reachable
	only by a `CACHE_WAVE` that no UI sends. So a reader who turns it on has
	what they have already read and little more, and the feature it would pair
	with — "fill my library, then go dark" — does not exist yet. A control
	whose value is that conditional does not belong in the front row of the one
	panel every reader opens to change the text size.

	THE FOLD OPENS ITSELF WHEN THE SWITCH IS ON, which is the rule that keeps
	hiding it honest: a reader who cannot find the control is a reader who
	cannot explain why nothing loads. It is one-way within a session, exactly
	as `LanguageMenu`'s "+ more" is — there is no state in which folding it
	back is what someone wants, and while offline mode is on there is a state
	in which it would be actively harmful.

	IT CARRIES THE ONLY `title` BESIDES MONOCHROME'S, for the same reason that
	one does: the label names the state and not the price. What it actually
	costs — that a text not already on the device will not open — is a
	sentence, and a sentence belongs in a tooltip rather than in a row of a
	panel whose every other row is two words wide. `$lib/offline.svelte.ts` is
	the feature; this switch is the whole of its UI.

	WHY ONE MENU. These were two triggers in the header — a palette icon for a
	four-item theme list (auto/light/dark/sepia) and an "Aa" icon for the size
	stepper. Two icons for one question ("how does this page look to me?") is
	one too many in a row that already holds search, language, print and
	install; and the theme list itself conflated two independent choices,
	since picking sepia there silently meant "and stop following the system's
	dark preference". Splitting theme into the axes it always was — a tri-state
	dark mode plus a tint toggle per half of it — makes several controls, which
	is exactly the point at which they want a panel rather than a row of
	icons.

	EVERY ROW IS BUILT TO ONE TEMPLATE: a `.field-label` over a
	`.field-control` of fixed height, and the control fills the panel's width.
	That is what makes the panel read as balanced rather than as a stack of
	unrelated widgets — the segmented dark-mode control and the size stepper
	are both a full-width bar of three cells, and the two switches share their
	row height. Each switch's note sits BESIDE it, in the same row, rather
	than under it, so that a change of mode doesn't make one row taller than
	the rest.

	SEPIA AND OLED ARE THE SAME ROW MIRRORED, and they are adjacent so that
	reads as deliberate: sepia yields to dark, OLED needs it, and so exactly
	one of the two is ever live. Monochrome can switch sepia off from a third
	direction, which is why the sepia row's disabled state asks the store
	rather than testing `dark` itself. The store (`$lib/theme.svelte.ts`) owns both
	rules and the note beside each switch is what says so out loud. A switch
	keeps showing the reader's stored preference while inert rather than
	snapping to off — it is suspended, not cleared.

	THE MONOCHROME SWITCH IS THE THIRD ONE AND THE ODD ONE OUT: it applies in
	every theme, so it is the only switch here that is never disabled — it is
	the one that disables something else. It sits last of the three because
	it outranks both, and it is the only row carrying a `title`, because
	"monochrome" names the result without saying what the page gives up for
	it. What it does is app.css's monochrome section.

	NOTHING HERE CLOSES THE PANEL. `FontSizeMenu` already worked that way (a
	reader stepping the size up wants to keep clicking and watching), and the
	same is true of every control now that they share a panel: comparing dark
	against light means flipping back and forth. Escape and an outside click
	still close it, via the shared `Menu` in `./menu.svelte.ts`.
-->
<script lang="ts">
	import { appearance, DARK_MODES } from '$lib/theme.svelte';
	import { offline } from '$lib/offline.svelte';
	import { library } from '$lib/library.svelte';
	import { serviceWorker } from '$lib/sw.svelte';
	import { fontScale, MIN_FONT_SCALE, MAX_FONT_SCALE } from '$lib/prefs.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { keepInViewport } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';

	const menu = new Menu();

	/** Whether the network fold is showing. Initialised from the preference so
	 *  an active offline mode is never the thing behind the fold — see the
	 *  docblock. */
	let advancedOpen = $state(offline.enabled);

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
		aria-label={t('settings.label')}
		title={t('settings.label')}
		onclick={menu.toggle}
	>
		<Icon name="sliders-horizontal" />
	</button>
	{#if menu.open}
		<div
			class="panel-surface menu-panel settings-panel"
			use:keepInViewport
			role="menu"
			tabindex="-1"
			aria-label={t('settings.label')}
			onkeydown={onPanelKeydown}
		>
			<!-- The layout wrappers are `role="none"` so the menuitems inside them
			     still read as direct children of the menu — the same job the other
			     menus' `<li role="none">` does. -->
			<div class="field" role="none">
				<span class="field-label label-micro">{t('darkMode.label')}</span>
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
				<span class="field-label label-micro">{t('sepia.label')}</span>
				<div class="field-control" role="none">
					<!-- The visible name is the label above, so the button carries the
					     same string as its accessible name rather than wrapping it. -->
					<button
						type="button"
						role="menuitemcheckbox"
						aria-checked={appearance.sepia}
						aria-label={t('sepia.label')}
						class="switch-btn"
						disabled={appearance.sepiaSuspended}
						onclick={() => appearance.toggleSepia()}
					>
						<span class="switch" class:on={appearance.sepia}></span>
					</button>
					{#if appearance.mono}
						<span class="note">{t('sepia.noHue')}</span>
					{:else if appearance.dark}
						<span class="note">{t('sepia.lightOnly')}</span>
					{/if}
				</div>
			</div>

			<div class="field" role="none">
				<span class="field-label label-micro">{t('oled.label')}</span>
				<div class="field-control" role="none">
					<button
						type="button"
						role="menuitemcheckbox"
						aria-checked={appearance.oled}
						aria-label={t('oled.label')}
						class="switch-btn"
						disabled={!appearance.dark}
						onclick={() => appearance.toggleOled()}
					>
						<span class="switch" class:on={appearance.oled}></span>
					</button>
					{#if !appearance.dark}
						<span class="note">{t('oled.darkOnly')}</span>
					{/if}
				</div>
			</div>

			<div class="field" role="none">
				<span class="field-label label-micro">{t('mono.label')}</span>
				<div class="field-control" role="none">
					<button
						type="button"
						role="menuitemcheckbox"
						aria-checked={appearance.mono}
						aria-label={t('mono.label')}
						title={t('mono.hint')}
						class="switch-btn"
						onclick={() => appearance.toggleMono()}
					>
						<span class="switch" class:on={appearance.mono}></span>
					</button>
				</div>
			</div>

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

			<!-- The one part that is not about how the page looks, which is why
			     it takes the divider the appearance rows deliberately do
			     without: that rule was about not carving up ONE subject, and
			     this is a second one. -->
			<div class="advanced" role="none">
				{#if advancedOpen}
					<!-- FIRST, because it is the prerequisite: offline mode below
					     turns downloads OFF, so a reader who meets the switch
					     before the shelf meets it in the wrong order. Offered
					     only where a download would do something —
					     `serviceWorker.controlled` is false under `npm run dev`,
					     which registers no worker at all. -->
					{#if serviceWorker.controlled}
						<div class="field" role="none">
							<button
								type="button"
								role="menuitem"
								aria-haspopup="dialog"
								class="menu-more"
								onclick={() => {
									library.open = true;
									menu.close();
								}}
							>
								{t('library.title')}…
							</button>
						</div>
					{/if}

					<div class="field" role="none">
						<span class="field-label label-micro">{t('offline.label')}</span>
						<div class="field-control" role="none">
							<button
								type="button"
								role="menuitemcheckbox"
								aria-checked={offline.enabled}
								aria-label={t('offline.label')}
								title={t('offline.hint')}
								class="switch-btn"
								onclick={() => offline.toggle()}
							>
								<span class="switch" class:on={offline.enabled}></span>
							</button>
						</div>
					</div>
				{:else}
					<!-- `.menu-more` is `LanguageMenu`'s fold control, reused rather
					     than restyled: two folds in the header's panels that look
					     different are two folds a reader has to learn twice. -->
					<button
						type="button"
						role="menuitem"
						aria-expanded="false"
						class="menu-more"
						onclick={() => (advancedOpen = true)}
					>
						+ {t('advanced.label')}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.settings-panel {
		min-width: 11rem;
		/* Tight, because the controls are meant to run the full width of the
		   panel — the padding is a hairline margin around a stack of bars, not
		   a frame around a list of items. The titles take their own small
		   inset back below, so they sit in from the edge the bars reach. */
		padding: 0.4rem;
		/* One height for every control row, so every field is the same height
		   and the panel reads as one list rather than a pile of widgets. */
		--control-height: 1.7rem;
	}

	/* Every row's title, the two switches' own labels included: they all name
	   a setting of the same rank, so they are all set alike — `.label-micro`
	   (styles/components.css), which is that setting site-wide. At this size
	   mixed case would read as prose that got small rather than as a heading,
	   which is why the shared label is uppercase in the first place. It ran a
	   step smaller here (0.68rem) than everywhere else, which was not a
	   decision anyone made. */
	/* Even spacing between the fields, and no rule between the theme rows and
	   the size stepper: a divider would have made one of the gaps larger than
	   the others, which is the imbalance it was meant to organize. */
	/* One control, three cells: a single bordered box divided by hairlines,
	   rather than three separate buttons, so the group reads as "pick one of
	   these" the way a radio set should. */
	.segmented {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
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

	/* Dimmed whole, rather than by recolouring the label: the label sits
	   outside the button now, and is already muted. */
	/* Drawn rather than a checkbox: `appearance: none` on a real one would
	   need the same box anyway, and the button already carries the state via
	   `role="menuitemcheckbox"` + `aria-checked`. Decorative, so no ARIA. */
	/* No wrapping: the row has a fixed height, so a second line would spill
	   out of it. If a translation ever outgrows the space the panel widens
	   (up to `.menu-panel`'s max-width) instead, which is the visible
	   failure rather than the silent one. */
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

	/* THE ONE DIVIDER IN THE PANEL, and the argument against the others is what
	   justifies this one: a rule between two appearance rows would have made
	   one gap larger than the rest and organised nothing, because those rows
	   are one subject. This separates two subjects. The margin above it is
	   `.field + .field`'s own, restated because the fold is not a `.field` and
	   would otherwise sit tight against the row above. */
	.advanced {
		margin-block-start: 0.55rem;
		border-block-start: 1px solid var(--color-border);
		padding-block-start: 0.55rem;
	}

	.value {
		flex: 1;
		text-align: center;
		font-variant-numeric: tabular-nums;
		font-size: 0.8rem;
		color: var(--color-text);
	}
</style>
