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
	icon-sized trigger; a size rail beside a two-cell face picker would be the
	widest thing in a row that already carries two edition names as wide as
	"Bíblia Sagrada (Matos Soares)" and wraps beneath them. The panel costs one
	click to open and none to keep open, which is the trade `SettingsMenu`'s
	"nothing here closes the panel" rule already made for this control: a
	reader trying a size or the other face wants to keep clicking and watching
	the text behind the panel reflow.

	THE SIZE IS A RAIL OF FIVE STOPS, AND THE REASON IS THE MEASURE. It was a
	`[−] 120% [+]` stepper over eleven values. The reading column is
	`--measure-cpl` characters wide, so it grows with the setting, and the grid
	centres it — which means every press slid the column's start edge, the bar
	packed against it and this panel hanging off the bar about 25px sideways,
	and a reader crossing the range chased their own button through ten presses
	and a quarter of the viewport. The travel cannot go: the column IS the
	size, and pinning it while the type moved would be the bug. What can go is
	the repetition. One click lands anywhere on the rail. `prefs.svelte.ts`
	carries the five values and why they are spaced as they are.

	NO PERCENTAGE AND NO RESET. The number was a readout the stepper needed —
	with eleven indistinguishable states a reader had no other way to know
	where they were, and no way home from 180% but eight clicks — and it was
	the button back to 100% for that reason. Five labelled stops with the
	current one accented say both things in the shape of the control, and the
	default is the second dot, one click away from anywhere.

	THE ARROW KEYS MOVE ALONG THE RAIL, gated on the focus being inside it —
	the face row is a radio group where an arrow means "the other face", which
	the browser does not do for `<button role=menuitemradio>` but which a
	reader may reasonably expect, and resizing the type from it would be the
	wrong answer either way. Left and right follow the rail's own direction, so
	an Arabic interface — where the rail runs the other way — steps toward the
	key that was pressed rather than away from it.

	Built to the shared row template (`.field`, `.segmented` in
	`styles/menus.css`), so the two rows here and the four in `SettingsMenu`
	are one family and a third preference is a `<div class="field">`.

	Hidden in focus mode with the rest of the bar, `ZenToggle` excepted
	(`styles/zen.css`). That is not a regression — the settings panel's
	trigger sits in the site header, which the same mode hides — but it is the
	argument to weigh if these are ever wanted there: the mode's promise is
	that the bar carries the way back out and nothing else.
-->
<script lang="ts">
	import { fontScale, readingFace, FONT_SIZES, type ReadingFace } from '$lib/prefs.svelte';
	import { keepInViewport } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';

	const menu = new Menu();

	/** Serif first: it is the default, and the row reads left to right from
	 *  what the reader has unless they said otherwise. */
	const FACES: ReadingFace[] = ['serif', 'sans'];

	function onPanelKeydown(e: KeyboardEvent) {
		menu.onPanelKeydown(e);
		if (!(e.target instanceof Element)) return;
		const rail = e.target.closest('.rail');
		if (!rail) return;

		// The rail is a row flex container, so it already runs right to left in
		// an Arabic interface and the physical arrow keys have to follow it.
		// Read back rather than assumed: the interface language and the
		// language being read are different questions, and only the computed
		// direction answers the one this control is laid out by.
		const rtl = getComputedStyle(rail).direction === 'rtl';
		const forward = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
		const back = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
		if (!forward && !back) return;
		e.preventDefault();

		const at = FONT_SIZES.findIndex((size) => size.scale === fontScale.value);
		const next = Math.max(0, Math.min(FONT_SIZES.length - 1, at + (forward ? 1 : -1)));
		fontScale.set(FONT_SIZES[next].scale);
		// Focus follows the selection, as it does in a radio group: the stop
		// the reader just chose is the one the next arrow steps from.
		rail.querySelectorAll<HTMLElement>('.stop')[next]?.focus();
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
				<div
					class="field-control rail"
					style="--half-stop: {50 / FONT_SIZES.length}%"
					role="group"
					aria-label={t('fontSize.label')}
				>
					{#each FONT_SIZES as size, i (size.scale)}
						{@const current = fontScale.value === size.scale}
						<button
							type="button"
							role="menuitemradio"
							aria-checked={current}
							class="stop"
							class:current
							style="--i: {i}"
							aria-label={t(`fontSize.${size.name}`)}
							title={t(`fontSize.${size.name}`)}
							onclick={() => fontScale.set(size.scale)}
						>
							<span class="dot"></span>
						</button>
					{/each}
				</div>
			</div>

			<!-- The same segmented control `SettingsMenu` picks a dark mode with,
			     and `menuitemradio` for the same reason: the two faces are
			     alternatives, where the apparatus panel's rows are not.

			     `.face-field` IS A HANDLE FOR A STYLESHEET, not a style of its
			     own: `styles/direction.css` hides this row over Arabic text,
			     where serif and sans name a distinction the script does not
			     have, and does it there because the same block excludes Arabic
			     from the face rules themselves. One fact, one place. The row
			     is hidden and not disabled — it is inapplicable here rather
			     than unavailable — so nothing in this component needs to know
			     which language is being read. -->
			<div class="field face-field" role="none">
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

	/*
	 * Five hit targets filling the row edge to edge, each with its dot in the
	 * middle: a rail is a thing you click AT rather than a set of buttons you
	 * click ON, and a gap between the stops would be a place a click lands on
	 * nothing.
	 */
	.rail {
		position: relative;
		gap: 0;
	}

	/*
	 * The line the stops sit on. It runs from the first dot's centre to the
	 * last, which is half a stop in from either end. The template computes it
	 * from the count rather than writing it as a number here, so the rail
	 * keeps its ends if `FONT_SIZES` ever gains or loses a rung.
	 */
	.rail::before {
		content: '';
		position: absolute;
		inset-inline: var(--half-stop);
		inset-block-start: calc(50% - 0.5px);
		height: 1px;
		/* Half the dots' own weight: the line joins the stops and is not one
		   of them, and at `--color-border` it was not visible at all. */
		background: color-mix(in oklab, var(--color-text-muted) 50%, transparent);
	}

	.stop {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}

	/*
	 * THE DOTS GROW ALONG THE RAIL, which is what the control says instead of
	 * a word. Five wordless stops of one size would be five identical things
	 * in a row with no clue which end is which; a size ramp is legible before
	 * the tooltip arrives and in every language without being translated. The
	 * names are still there for anyone who hovers, and for a screen reader,
	 * where the ramp says nothing at all.
	 *
	 * FILLED AND `--color-text-muted`, WHICH IS A CORRECTION. They were hollow
	 * with a `--color-border` edge, and that token is the faintest thing in the
	 * palette (`#ddd9d0` on the light ground) — right for a box outline, where
	 * a rectangle of it encloses a whole control, and far too little for a 6px
	 * ring, which is nearly all edge. A disc of the text colour is the same
	 * mark at the weight the rest of the panel is set in.
	 */
	.dot {
		width: calc(0.36rem + var(--i) * 0.06rem);
		aspect-ratio: 1;
		border-radius: 50%;
		background: var(--color-text-muted);
	}

	/* The pointer darkens rather than accents: the accent is what says WHICH
	   stop is current, and a hover wearing it claims a choice not yet made. */
	.stop:hover .dot {
		background: var(--color-text);
	}

	.stop.current .dot {
		background: var(--color-accent);
	}
</style>
