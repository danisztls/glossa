<script lang="ts">
	/**
	 * One plate, over the whole page, at the size the file it already
	 * downloaded can actually draw.
	 *
	 * THE READING COLUMN IS 40rem AND THE FILE IS 1200px WIDE, and that gap is
	 * the entire argument for this component. `PLATE_SIZES` asks for the plate
	 * at 640 CSS px on a desktop and at 100vw — around 390 — on a phone, so
	 * `srcset` hands the phone the 800px rendition for a 390px slot. The
	 * reader is holding roughly twice the detail that is on their screen, and
	 * until this existed there was no way to reach any of it. Doré's hatching
	 * is what that headroom is made of, so it is worth reaching.
	 *
	 * IT SHOWS THE RENDITION THE PAGE ALREADY LOADED, and never asks for a
	 * bigger one. `src` is the inline `<img>`'s own `currentSrc`, so opening
	 * the viewer costs no request, no wait and no spinner, and it works
	 * offline in exactly the cases the plate itself did — which matters,
	 * because the plates are deliberately in no service-worker download wave
	 * (`sw-policy.ts`) and an offline reader has the ones they have already
	 * seen. Fetching a detail rendition on tap would have made this the one
	 * control that breaks when the plate under it does not.
	 *
	 * TWO STATES, NOT A CONTINUOUS ZOOM. Fit, and the loaded file's own
	 * natural size — which is the ceiling, since past it the browser is
	 * inventing pixels. A pinch-zoom with momentum, bounds and a transform
	 * matrix is a great deal of code around a question the reader is asking
	 * once ("what is in there?"), and two states answer it with a scroll
	 * container the browser already knows how to pan.
	 *
	 * SO THE ZOOM IS OFFERED ONLY WHERE THERE IS SOMETHING TO GAIN.
	 * `canZoom` compares the natural width against the width the plate is
	 * ALREADY drawn at here, and on a tall desktop those are nearly the same
	 * number: fit in a 1440px-tall viewport is around 1155 px of a 1200px
	 * file. A control that magnifies by 4% is a control that reads as broken,
	 * so the toolbar button is not rendered and the picture is not a zoom
	 * target.
	 *
	 * `<dialog>` AND `showModal()`, which is a departure from every other
	 * floating thing on this site and the one case that earns it. A citation,
	 * a link preview and the plate's own credit card are popovers because
	 * they gloss the text and the text must stay readable beside them. This
	 * one IS the text — the picture is the thing being read, not an apparatus
	 * over it — and covering the page is the point. What that buys is the top
	 * layer, `::backdrop`, an inert background, a focus trap, Escape, and
	 * focus returned to the caption; all native, none of it ours. It also
	 * buys the Android back button: a modal dialog is closed by a close
	 * request, which is what the platform back gesture sends, so the reader
	 * who taps a plate and then taps back stays in their chapter. No history
	 * entry, no shallow routing, nothing to unwind.
	 *
	 * AND IT COSTS THE PAGE NO LAYOUT, which is the rule `Plate`'s own
	 * docblock is built around and the reason its credit is a card rather
	 * than a `<details>`. A dialog in the top layer moves no verse.
	 *
	 * THE SURROUND IS DARK IN EVERY THEME, and its chrome is therefore
	 * written in fixed light values rather than in the palette's tokens —
	 * nearly the only place in the stylesheet that does that. A viewer's
	 * backdrop is dark for the reason a cinema is: everything around the
	 * picture competes with it. Sepia and light both keep their `--color-bg`
	 * where it is load-bearing, which is behind the plate itself — see the
	 * `isolation` note in the CSS.
	 */
	import { tick } from 'svelte';
	import type { Plate } from '$lib/plates';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		plate: Plate;
		/** The rendition the inline `<img>` resolved and downloaded, as its
		 *  `currentSrc`. Passed rather than rebuilt from `plateSrcset` so that
		 *  this is the same file, already in the HTTP cache: which of the two
		 *  renditions it is depends on the reader's viewport and pixel ratio,
		 *  and only the browser knows the answer. */
		src: string;
		/** The collection's attribution, composed and localized by the route,
		 *  exactly as `Plate` receives it. Shown outright here rather than
		 *  behind a control: there is nothing else in this view to crowd. */
		credit?: string;
		/** Told when the dialog has closed, by any of the four routes out
		 *  (the button, the surround, Escape, a platform back gesture). */
		onclosed: () => void;
	}

	let { plate, src, credit, onclosed }: Props = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();
	let stageEl: HTMLDivElement | undefined = $state();
	let imgEl: HTMLImageElement | undefined = $state();

	let zoomed = $state(false);
	/** The stage's own box, bound rather than derived from the viewport: the
	 *  bar and the caption take a share of the screen that depends on how the
	 *  credit wraps, and only the element knows what is left. */
	let stageWidth = $state(0);
	let stageHeight = $state(0);
	/**
	 * The intrinsic width of the file that actually loaded — 800 or 1200 —
	 * and NOT `plate.width`, which is always 1200 because that is the
	 * rendition the pipeline measured (`PLATE_INTRINSIC_WIDTH`). Zooming to a
	 * width the file does not have is upscaling, which is the one thing this
	 * view exists to avoid.
	 */
	let natural = $state(0);

	const ratio = $derived(plate.width / plate.height);

	/** How wide the plate is drawn when it fits: whichever of the stage's two
	 *  dimensions binds first. */
	const fitWidth = $derived(Math.min(stageWidth, stageHeight * ratio));

	/** 1.15 rather than any headroom at all: below about a sixth, the reader
	 *  taps and the picture does not visibly change, which reads as a control
	 *  that failed rather than as one that had nothing to do. */
	const canZoom = $derived(natural > 0 && fitWidth > 0 && natural > fitWidth * 1.15);

	/* A stage that stops being able to zoom while it is zoomed — a rotation
	   to landscape, a window pulled taller — would otherwise leave the reader
	   in a state whose only exit control has just been removed. */
	$effect(() => {
		if (zoomed && !canZoom) zoomed = false;
	});

	/* `showModal()` cannot be called on an element that does not exist yet,
	   and the parent renders this component only once the reader has asked
	   for it, so the mount IS the open. Guarded on `open` because the effect
	   re-runs if the binding ever changes identity, and `showModal()` on an
	   already-open dialog throws. */
	$effect(() => {
		if (dialogEl && !dialogEl.open) dialogEl.showModal();
	});

	/* A cached image assigned to a fresh element still fires `load`, but not
	   in every browser and not in the same task, so `complete` is read here
	   as well. Whichever arrives first wins; both set the same number. */
	$effect(() => {
		if (imgEl?.complete && imgEl.naturalWidth > 0) natural = imgEl.naturalWidth;
	});

	/**
	 * Toggle, and keep the point the reader aimed at under their finger.
	 *
	 * `fx`/`fy` are where in the picture the tap landed, as fractions. On the
	 * way into zoom the scroll container is centred on that point, which is
	 * what makes tapping a face in a crowd show that face rather than the
	 * middle of the plate. The toolbar button and the keyboard both pass the
	 * centre, having named no point.
	 */
	async function setZoom(next: boolean, fx: number, fy: number) {
		if (!canZoom) return;
		zoomed = next;
		await tick();
		if (!next || !stageEl) return;
		stageEl.scrollLeft = fx * stageEl.scrollWidth - stageEl.clientWidth / 2;
		stageEl.scrollTop = fy * stageEl.scrollHeight - stageEl.clientHeight / 2;
	}

	/* `detail` is 0 for a click synthesized by Enter or Space, where there is
	   no pointer and `clientX` is a meaningless 0 — which would otherwise
	   scroll a keyboard reader to the plate's top-left corner. */
	function onPictureClick(e: MouseEvent) {
		if (!imgEl || e.detail === 0) return setZoom(!zoomed, 0.5, 0.5);
		const box = imgEl.getBoundingClientRect();
		return setZoom(!zoomed, (e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
	}

	/* A click that lands on the dialog or on the stage is a click on the
	   surround: every visible pixel of the picture belongs to the button
	   inside them. The same test, and the same reason for it, as `JumpBox`'s
	   `onDialogClick` — except that the sheet fills the viewport here, so
	   there is no `::backdrop` left to be clicked and the empty space is the
	   stage's own. */
	function onSurfaceClick(e: MouseEvent) {
		if (e.target === dialogEl || e.target === stageEl) dialogEl?.close();
	}
</script>

<!--
	No `role`, no `aria-modal`, no `tabindex`: `showModal()` carries all three.
	`aria-label` is the plate's title, because the view has no heading of its
	own — the caption below is the title, but a caption is not a name.
-->
<dialog
	bind:this={dialogEl}
	class="dialog-bare sheet plate-viewer"
	aria-label={plate.title}
	onclose={onclosed}
	onclick={onSurfaceClick}
>
	<div class="viewer-bar">
		{#if canZoom}
			<!-- One name in both states, with `aria-pressed` saying which one it
			     is in. Two labels ("zoom in" / "zoom out") would be a control
			     that renames itself under the reader's finger, and would cost
			     fourteen dictionaries a second string to say what a toggle
			     state already says. -->
			<button
				type="button"
				class="viewer-button"
				aria-pressed={zoomed}
				aria-label={t('plates.zoom')}
				onclick={() => setZoom(!zoomed, 0.5, 0.5)}
			>
				<Icon name={zoomed ? 'zoom-out' : 'zoom-in'} />
			</button>
		{/if}
		<button
			type="button"
			class="viewer-button"
			aria-label={t('ui.close')}
			onclick={() => dialogEl?.close()}
		>
			<Icon name="x" />
		</button>
	</div>

	<div
		class="stage"
		class:zoomed
		bind:this={stageEl}
		bind:clientWidth={stageWidth}
		bind:clientHeight={stageHeight}
	>
		<!--
			The picture is the zoom control, because tapping a picture to see it
			closer is the gesture a reader already has. The toolbar button is
			the same action given a name and a place to be found; on touch,
			where there is no cursor to change shape, it is the only thing
			announcing that the picture does anything at all.

			WHERE THERE IS NO HEADROOM IT IS NOT A CONTROL. `disabled` rather
			than a click handler that returns early: a button in the tab order
			that does nothing when it is reached is worse for a keyboard reader
			than no button, and this one is only ever inert in one geometry (a
			viewport tall enough to draw the whole file at its own size).
			`alt` follows it — empty inside a named control, since an image
			that repeats its button's name is announced twice, and the title
			once the button is not a control and has no name to repeat.
		-->
		<button
			type="button"
			class="picture"
			class:zoomable={canZoom}
			disabled={!canZoom}
			aria-pressed={canZoom ? zoomed : undefined}
			aria-label={canZoom ? t('plates.zoom') : undefined}
			style:--plate-ratio={`${plate.width} / ${plate.height}`}
			style:--plate-fit={fitWidth > 0 ? `${fitWidth}px` : '100%'}
			style:--plate-natural={`${natural}px`}
			onclick={onPictureClick}
		>
			<img
				bind:this={imgEl}
				{src}
				alt={canZoom ? '' : plate.title}
				width={plate.width}
				height={plate.height}
				decoding="async"
				onload={() => (natural = imgEl?.naturalWidth ?? 0)}
			/>
		</button>
	</div>

	<div class="viewer-caption">
		<span class="viewer-title">{plate.title}</span>
		{#if credit}
			<span class="viewer-credit">{credit}</span>
		{/if}
	</div>
</dialog>

<style>
	/*
	 * `.sheet` in `menus.css` is the position — fixed, `inset: 0`, the whole
	 * viewport, a flex column when open — shared with the jump box, the table
	 * of contents and the header's navigation sheet. What is different here is
	 * that nothing inside takes `.sheet-panel`'s opaque ground: the dialog
	 * stays transparent so the `::backdrop` under it is what the reader sees
	 * around the plate.
	 */

	/*
	 * DARKER THAN `.dialog-bare`'s 35%, which is the tint a panel needs to
	 * separate itself from the page it is still letting you read. Nothing here
	 * is meant to be read through: the dim is the frame around the picture,
	 * and at a third of black the page's own text stays legible enough behind
	 * an engraving to compete with it.
	 */
	.plate-viewer::backdrop {
		background: rgb(0 0 0 / 82%);
	}

	.viewer-bar {
		flex: none;
		display: flex;
		justify-content: flex-end;
		gap: 0.25rem;
		padding: 0.5rem 0.6rem;
	}

	/*
	 * Fixed light values rather than palette tokens, for the reason the
	 * docblock gives: this chrome sits on a dark surround in all three
	 * appearances, so `--color-text-muted` would be an unreadable brown on
	 * light and sepia. Thumb-sized regardless of pointer — on a phone in fit
	 * form the picture fills the stage and this row is the whole surround.
	 */
	.viewer-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		inline-size: 2.5rem;
		block-size: 2.5rem;
		padding: 0;
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: rgb(255 255 255 / 78%);
		font-size: 1.15rem;
		cursor: pointer;
	}

	.viewer-button:hover {
		color: #fff;
		background: rgb(255 255 255 / 12%);
	}

	.viewer-button:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
	}

	/*
	 * THE SCROLL CONTAINER, and it only ever has anything to scroll in the
	 * zoomed state. `overscroll-behavior` is what stops a pan that runs off
	 * the edge of a zoomed plate from chaining to the chapter underneath: the
	 * page behind a modal is inert but still scrollable, so a reader who
	 * flicked past the end would close the viewer onto a chapter that had
	 * moved.
	 */
	.stage {
		flex: 1 1 auto;
		min-block-size: 0;
		display: flex;
		overflow: hidden;
		overscroll-behavior: contain;
	}

	.stage.zoomed {
		overflow: auto;
	}

	/*
	 * `margin: auto` AND NOT `justify-content: center`, which is the whole
	 * reason this is a flex box rather than a grid with `place-items`.
	 * Centring a flex line that overflows its container pushes the item's
	 * start edge to a negative offset, and a scroll container cannot scroll to
	 * a negative offset: the top and the start edge of a zoomed plate would be
	 * unreachable. Auto margins absorb free space when there is any and
	 * collapse to nothing when there is not.
	 */
	.picture {
		margin: auto;
		flex: none;
		/* `appearance` and `opacity` against the UA's disabled styling: on a
		   viewport tall enough to need no zoom this button IS disabled, and a
		   browser that dims a disabled control would dim the engraving. */
		appearance: none;
		opacity: 1;
		padding: 0;
		border: 0;
		/*
		 * THE PLATE'S OWN PAPER, and the reason this box has a background at
		 * all. `--plate-blend` is `multiply` on light and sepia (see
		 * `tokens.css`): the scan's white paper multiplies away into whatever
		 * is painted beneath it, so the engraving takes the page's colour
		 * instead of punching a white rectangle through it. Beneath it HERE is
		 * a dark backdrop, which multiply would turn to a solid black square —
		 * so the paper colour has to be painted deliberately, and isolated so
		 * the blend resolves against it rather than against the dim.
		 */
		background: var(--color-bg);
		isolation: isolate;
		cursor: default;
	}

	.picture.zoomable {
		cursor: zoom-in;
	}

	.stage.zoomed .picture.zoomable {
		cursor: zoom-out;
	}

	.picture:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 3px;
	}

	/*
	 * FIT: as tall as the stage, as wide as that makes it, and no wider than
	 * the stage either — `aspect-ratio` recomputes the height when the width
	 * clamp bites, which is what makes one pair of rules fit a portrait plate
	 * on a phone and a landscape one on a laptop. The ratio is the plate's
	 * own, passed in from the dimensions the pipeline recorded, so the box is
	 * the right shape before the image has loaded a byte.
	 */
	.stage:not(.zoomed) .picture {
		inline-size: var(--plate-fit);
		max-inline-size: 100%;
		block-size: auto;
		aspect-ratio: var(--plate-ratio);
	}

	/* ZOOM: the loaded file's own width, in CSS pixels, which is the point at
	   which one image pixel is one CSS pixel and there is nothing further to
	   be had from it. */
	.stage.zoomed .picture {
		inline-size: var(--plate-natural);
		block-size: auto;
		max-inline-size: none;
		aspect-ratio: var(--plate-ratio);
	}

	/* `block-size: auto` and not `100%`, for the reason the fit rule above
	   gives at length: the image's own intrinsic ratio is the plate's, so a
	   full-width image is exactly as tall as the box around it, and nothing
	   has to resolve a percentage against a height derived from a ratio. */
	.picture img {
		display: block;
		inline-size: 100%;
		block-size: auto;
		mix-blend-mode: var(--plate-blend);
		filter: var(--plate-filter);
	}

	/*
	 * The title and the credit, which in the reading column are a caption and
	 * a card behind a control. There is nothing to crowd out here, so the
	 * credit is simply shown: this is the one view of a plate where the
	 * attribution costs the reader no tap and no page.
	 */
	.viewer-caption {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.6rem 1rem 1rem;
		font-family: var(--font-sans);
		text-align: center;
		text-wrap: pretty;
	}

	.viewer-title {
		font-size: 0.85rem;
		font-variant-caps: small-caps;
		letter-spacing: 0.04em;
		color: rgb(255 255 255 / 88%);
	}

	.viewer-credit {
		font-size: 0.75rem;
		line-height: 1.4;
		/* Two lines separated by a newline in the string, exactly as the card
		   in the reading column and the colophon both set it. */
		white-space: pre-line;
		color: rgb(255 255 255 / 55%);
	}

	/* A dialog open at the moment a chapter is printed would otherwise be the
	   only thing on the paper: it is in the top layer, and the top layer
	   prints. The plate itself prints from the reading column, where it
	   belongs — see `Plate`'s print rules. */
	@media print {
		.plate-viewer {
			display: none;
		}
	}
</style>
