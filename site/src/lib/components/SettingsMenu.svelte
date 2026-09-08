<!--
	The reader's settings, in one popover: dark mode, the sepia paper tint, the
	OLED true-black ground, the monochrome palette — and, below the divider,
	the way into everything about the network.

	THE READING SIZE WAS A SIXTH ROW HERE and is now the reading bar's
	(`TypeMenu`), which holds the argument. What it leaves behind is a
	panel whose every row is true of the page the reader is on: this trigger
	is in the header of all of them, and the reading size was the one control
	in it that did nothing on most.

	IT WAS `AppearanceMenu` UNTIL OFFLINE MODE, and the rename is the honest
	half of that change. Everything above the divider is still the one question
	the panel was built around ("how does this page look to me?"); what the
	network does on this device is a second question, and a panel called
	Appearance offering a door to it would have been a worse lie than a panel
	called Settings holding five appearance rows. The trigger is the same
	slider icon, which is what a reader reads as "settings" anyway.

	OFFLINE MODE IS NOT IN THIS PANEL, AND THAT IS A MEASUREMENT RATHER THAN A
	TASTE. What the switch buys a reader is conditional on their having filled
	a library first: the automatic waves put the shell, the prayers, the
	Compendium and ONE Catechism edition on the device (`sw-policy.ts`'s
	`AUTOMATIC_WAVES`), and the Scripture, magisterium and Summa waves are
	23-28 MB each that somebody has to ask for. So the switch and the library
	are one subject read in one order, and neither belongs in the front row of
	the panel a reader opens to change how the page looks. Both live in
	`AdvancedSheet.svelte`, which the row below opens; all this panel keeps is
	the door.

	THE DOOR IS A ROW AND NOT A FOLD, which it was until 2026-09-02. A fold
	made this panel host the pair, and the panel is ~11rem wide: a switch whose
	price is a whole sentence could only carry that sentence as a `title` — and
	the library, being a list of byte counts and a progress bar, had to be a
	second dialog anyway. One dialog holding both is one place to look, with
	room to say what the switch costs.

	WHY ONE MENU. These were two triggers in the header — a palette icon for a
	four-item theme list (auto/light/dark/sepia) and an "Aa" icon for the
	reading size. Two icons for one question ("how does this page look to me?") is
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
	unrelated widgets — the segmented dark-mode control is a full-width bar of
	three cells, and the three switches share their row height. Each switch's
	note sits BESIDE it, in the same row, rather than under it, so that a
	change of mode doesn't make one row taller than the rest. The template is
	`styles/menus.css`'s, shared with `ApparatusMenu` and `TypeMenu`,
	which is why the size rail's silhouette still matches the segmented
	control here from another bar.

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

	NOTHING HERE CLOSES THE PANEL, which the reading size wanted first (a
	reader trying a larger one wants to keep clicking and watching) and every
	control here wants for itself: comparing dark against light means flipping
	back and forth. Escape and an outside click still close it, via the shared
	`Menu` in `./menu.svelte.ts`.

	THE ARROW KEYS WENT WITH THE SIZE CONTROL, and nothing else in the panel
	notices: the handler they lived in was already gated on the focus being
	inside that control, so an arrow pressed on a switch or a segment did
	nothing then and does nothing now. This panel's keydown is the shared
	`Menu`'s unaltered — Escape and no more. Tab still walks the rows.
-->
<script lang="ts">
	import { appearance, DARK_MODES } from '$lib/theme.svelte';
	import { library } from '$lib/library.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { keepInViewport } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';

	const menu = new Menu();
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
			onkeydown={menu.onPanelKeydown}
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

			<!-- The one part that is not about how the page looks, which is why
			     it takes the divider the appearance rows deliberately do
			     without: that rule was about not carving up ONE subject, and
			     this is a second one. -->
			<div class="advanced" role="none">
				<!-- `.menu-more` is `LanguageMenu`'s "+ more" control, reused rather
				     than restyled: the trailing ellipsis rather than a leading "+"
				     is what says this one leaves the panel instead of growing it,
				     which is the same distinction every other menu here draws. The
				     popover closes as the dialog opens — two overlapping surfaces
				     for one subject, and the dialog is the one being read. -->
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
					{t('advanced.label')}…
				</button>
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
	/* Even spacing between the fields, and no rule between the theme rows:
	   a divider would have made one of the gaps larger than the others,
	   which is the imbalance it was meant to organize. */
	/* `.segmented` / `.segment` are in `styles/menus.css` with the rest of
	   the row template — `TypeMenu` picks a face with the same control, and
	   Svelte's scoping cannot share a block. */

	/* Dimmed whole, rather than by recolouring the label: the label sits
	   outside the button now, and is already muted. */
	/* Drawn rather than a checkbox: `appearance: none` on a real one would
	   need the same box anyway, and the button already carries the state via
	   `role="menuitemcheckbox"` + `aria-checked`. Decorative, so no ARIA. */
	/* No wrapping: the row has a fixed height, so a second line would spill
	   out of it. If a translation ever outgrows the space the panel widens
	   (up to `.menu-panel`'s max-width) instead, which is the visible
	   failure rather than the silent one. */
	/* THE ONE DIVIDER IN THE PANEL, and the argument against the others is what
	   justifies this one: a rule between two appearance rows would have made
	   one gap larger than the rest and organised nothing, because those rows
	   are one subject. This separates two subjects. The margin above it is
	   `.field + .field`'s own, restated because the row below is not a `.field`
	   and would otherwise sit tight against the row above. */
	.advanced {
		margin-block-start: 0.55rem;
		border-block-start: 1px solid var(--color-border);
		padding-block-start: 0.55rem;
	}
</style>
