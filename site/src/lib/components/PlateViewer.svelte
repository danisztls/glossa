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
	 * OPENING COSTS NOTHING; ZOOMING BUYS A BIGGER FILE. `src` is the inline
	 * `<img>`'s own `currentSrc`, so the picture appears with no request, no
	 * wait and no spinner, and it works offline in exactly the cases the plate
	 * itself did. Only the zoom — an explicit second gesture, on a picture the
	 * reader is already looking at — asks for `PLATE_DETAIL_WIDTH`, which is
	 * 2000px and is in no `srcset` precisely so that nothing else can ask for
	 * it (see `plates.ts`).
	 *
	 * THE ZOOM DOES NOT WAIT FOR IT. The geometry is the detail rendition's
	 * from the moment the reader asks: the stage goes straight to 2000 CSS px,
	 * drawing the file already in hand upscaled, and swaps in the real one
	 * when it decodes. So the arrival is a SHARPENING and never a jump —
	 * nothing moves under the reader, the point they aimed at stays where they
	 * put it, and a slow connection costs clarity rather than responsiveness.
	 * A brief upscale is the one place this view knowingly draws invented
	 * pixels, and it draws them only over a file that is on its way.
	 *
	 * AND IF IT NEVER ARRIVES, NOTHING IS BROKEN. A `failed` status — an offline
	 * reader who does not have this plate's zoom rendition, or a build derived
	 * before the width existed — puts the ceiling back at the loaded
	 * file's own natural width, which is precisely what this component did
	 * before the rendition existed. The plates are in no automatic download
	 * wave (`sw-policy.ts`), so that case is ordinary rather than exceptional.
	 *
	 * TWO STATES, NOT A CONTINUOUS ZOOM. Fit, and the best file's own natural
	 * size — which is the ceiling, since past it the browser is inventing
	 * pixels with nothing coming to replace them. A pinch-zoom with momentum,
	 * bounds and a transform matrix is a great deal of code around a question
	 * the reader is asking once ("what is in there?"), and two states answer
	 * it with a scroll container the browser already knows how to pan.
	 *
	 * SO THE ZOOM IS OFFERED ONLY WHERE THERE IS SOMETHING TO GAIN.
	 * `canZoom` compares the width zooming would reach against the width the
	 * plate is ALREADY drawn at here. That test is why the detail rendition
	 * exists at all: on a tall desktop the two were nearly the same number —
	 * fit in a 1440px-tall viewport is around 1155 px of a 1200px file — so
	 * the control magnified by 4%, read as broken, and was therefore not
	 * rendered. Desktop readers had no zoom. At 2000 they have 1.7x.
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
	import { PLATE_DETAIL_WIDTH } from '$lib/plates';
	import { plateDetailSrc } from '$lib/plate-src';
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
	 * The intrinsic width of the file currently ON the element — 800 or 1200,
	 * and 2000 once the zoom rendition has taken its place. NOT `plate.width`,
	 * which is always 1200 because that is the rendition the pipeline measured
	 * (`PLATE_INTRINSIC_WIDTH`).
	 *
	 * It is the zoom ceiling only where no bigger file can be had — see
	 * `zoomWidth`. That is the whole of the old rule ("never magnify past the
	 * file") kept as the fallback, with the new rule in front of it: magnify to
	 * the file that is coming.
	 */
	let natural = $state(0);

	/**
	 * The zoom rendition: where it lives, and how far along getting it we are.
	 *
	 * `idle` until the reader first asks to zoom — nothing here is fetched on
	 * open, for the reason the docblock gives. `failed` is a real resting
	 * state and not an error to report: it is what an offline reader without
	 * this plate cached gets, and what a build with no 2000px renditions gets
	 * on every plate. Both simply return this view to the ceiling it had
	 * before the rendition existed, which is a working view.
	 */
	const detailHref = $derived(plateDetailSrc(plate.id));
	let detailStatus = $state<'idle' | 'loading' | 'ready' | 'failed'>('idle');

	/** What is actually on the element. The loaded rendition until the bigger
	 *  file has DECODED — not merely loaded — so the swap cannot flash. */
	const shown = $derived(detailStatus === 'ready' && detailHref ? detailHref : src);

	const ratio = $derived(plate.width / plate.height);

	/** How wide the plate is drawn when it fits: whichever of the stage's two
	 *  dimensions binds first. */
	const fitWidth = $derived(Math.min(stageWidth, stageHeight * ratio));

	/**
	 * How wide the zoomed state draws.
	 *
	 * THE DETAIL WIDTH IS KNOWN BEFORE THE FILE IS, which is what lets the
	 * zoom be instant: every plate is encoded at exactly `PLATE_DETAIL_WIDTH`,
	 * so there is no measurement to wait for and the box can be right from the
	 * first frame. `natural` — the loaded file's own width, 800 or 1200 — is
	 * the answer only where there is no bigger file to be had.
	 */
	const zoomWidth = $derived(
		detailHref && detailStatus !== 'failed' ? PLATE_DETAIL_WIDTH : natural
	);

	/** 1.15 rather than any headroom at all: below about a sixth, the reader
	 *  taps and the picture does not visibly change, which reads as a control
	 *  that failed rather than as one that had nothing to do. */
	const canZoom = $derived(zoomWidth > 0 && fitWidth > 0 && zoomWidth > fitWidth * 1.15);

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
		if (next) void loadDetail();
		zoomed = next;
		await tick();
		if (!next || !stageEl) return;
		stageEl.scrollLeft = fx * stageEl.scrollWidth - stageEl.clientWidth / 2;
		stageEl.scrollTop = fy * stageEl.scrollHeight - stageEl.clientHeight / 2;
	}

	/**
	 * Fetch the zoom rendition, once, on the first zoom of this viewer.
	 *
	 * A DETACHED `Image` AND `decode()`, not a `src` swap on the element the
	 * reader is looking at. Assigning a new `src` to a live `<img>` and waiting
	 * for `load` shows the intermediate states of the decode; `decode()`
	 * resolves when the bitmap is ready, so `shown` flips to a file that will
	 * paint on the next frame. The element then resolves the same URL out of
	 * the HTTP cache with nothing left to do.
	 *
	 * IT RESOLVES WHILE THE READER IS ALREADY ZOOMED, deliberately — see the
	 * docblock. Nothing here touches `zoomed`, `stageEl.scrollLeft` or the
	 * geometry: the stage was sized to `PLATE_DETAIL_WIDTH` the moment the
	 * gesture landed, so this swap moves nothing and the scroll offsets stay
	 * valid in pixels.
	 *
	 * A REJECTION IS AN ANSWER AND IS REMEMBERED. `failed` is terminal for the
	 * life of this viewer: a reader toggling zoom on a plate they do not have
	 * offline would otherwise re-request a file they have already been refused,
	 * once per tap.
	 */
	async function loadDetail() {
		if (!detailHref || detailStatus !== 'idle') return;
		detailStatus = 'loading';
		const probe = new Image();
		probe.src = detailHref;
		try {
			await probe.decode();
			detailStatus = 'ready';
		} catch {
			detailStatus = 'failed';
		}
	}

	/* `e.detail` — the click's own count, nothing to do with `detailStatus`
	   above — is 0 for a click synthesized by Enter or Space, where there is
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
			     state already says.

			     `aria-busy` says the bigger file is still in flight, and it is
			     all that is said: the picture is already at its zoomed size and
			     only its sharpness is pending, so a spinner would announce a
			     wait the reader is not having. Like the label above, it costs
			     those fourteen dictionaries nothing. -->
			<button
				type="button"
				class="viewer-button"
				class:busy={detailStatus === 'loading'}
				aria-pressed={zoomed}
				aria-busy={detailStatus === 'loading'}
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
			style:--plate-zoom={`${zoomWidth}px`}
			onclick={onPictureClick}
		>
			<img
				bind:this={imgEl}
				src={shown}
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
	 * THE ZOOM RENDITION IS IN FLIGHT, said in the only place with nothing else
	 * to say. The control itself breathes rather than being replaced by a
	 * spinner: it is still the control, still pressable, and what is pending is
	 * the sharpness of a picture the reader is already looking at — so this has
	 * to read as "still working", never as "wait".
	 *
	 * `prefers-reduced-motion` takes the animation and keeps the statement: a
	 * steady dim is the same information without the pulse, and `aria-busy`
	 * carries it to a reader who gets neither.
	 */
	.viewer-button.busy {
		animation: plate-detail-pending 1.4s ease-in-out infinite;
	}

	@keyframes plate-detail-pending {
		50% {
			opacity: 0.45;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.viewer-button.busy {
			animation: none;
			opacity: 0.55;
		}
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

	/* ZOOM: the best available file's own width, in CSS pixels, which is the
	   point at which one image pixel is one CSS pixel and there is nothing
	   further to be had from it. `--plate-zoom` is `PLATE_DETAIL_WIDTH` from
	   the moment the reader asks — before that file has arrived, and whether
	   or not it ever does — so the box is settled in one step and the arriving
	   rendition only sharpens what is in it. */
	.stage.zoomed .picture {
		inline-size: var(--plate-zoom);
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
