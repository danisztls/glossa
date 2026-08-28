<script lang="ts">
	/**
	 * One of Doré's engravings, in the reading column at the verse it depicts.
	 *
	 * NOTHING IS FETCHED UNTIL IT HAS TO BE. `loading="lazy"` plus the exact
	 * intrinsic size is the whole design: the browser reserves the right box
	 * from the `width`/`height` pair before it has a byte of the image, and
	 * then declines to fetch it at all until the reader has scrolled near it.
	 * A chapter that opens with a plate three screens down costs nothing on
	 * arrival. Those two attributes are also what stop the plate shoving the
	 * verse the reader is on off the screen when it does land — see
	 * `derive_images` in `pipeline/scrapers/dore/dore.py` for why the numbers
	 * are recorded rather than derived here (every plate has its own crop, so
	 * there is no ratio to assume).
	 *
	 * THE ATTRIBUTION IS THE CAPTION, AND OPENS OVER THE PAGE. Genesis carries
	 * 27 plates and a credit repeated 27 times down a reading column is noise,
	 * while one said once at the foot of the chapter is a line the reader
	 * meets long after the picture it refers to. So the caption is the
	 * control: the plate's title always, and whose engraving it is and whose
	 * scan when the reader asks.
	 *
	 * A CARD RATHER THAN AN EXPANDING CAPTION, and the reason is the one
	 * `CitationDisclosure` already gives about the box it used to be: an
	 * apparatus must not move the text. A `<details>` under the picture pushes
	 * every verse below it down when it opens and pulls them back when it
	 * closes, so a reader who taps a caption loses their place in the chapter
	 * — and the plate is mid-passage, which is the worst position for that.
	 * The popover is in the top layer and `position: fixed`; opening it costs
	 * the page no layout at all. It is the same `.floating-panel` a citation
	 * and a link preview appear in, which is the point: a reader who has
	 * learned what a small box over the page means should not have to learn a
	 * second one. The mechanism — measure on `toggle`, reveal, track the
	 * anchor — is `AnchoredPanel` in `floating.svelte.ts`, shared with the two
	 * older popovers rather than written a third time here.
	 *
	 * NATIVE `popover`, DECLARATIVELY INVOKED. `popovertarget` is valid on
	 * `<button>` and the trigger here is one, so the browser owns the open
	 * state, light dismiss, Escape, the top layer and returning focus to the
	 * caption. What is left is `aria-expanded`, which the reader's screen
	 * reader is owed.
	 *
	 * AND THE CARD IS THE ONLY ROUTE, deliberately. The image carried a
	 * `title` as well until the card existed — a real tooltip on a pointer and
	 * nothing whatsoever on touch, since there is no hover to have. Once the
	 * caption answers everyone, a second tooltip saying the same words a few
	 * pixels away is two controls for one fact, and the one that works is not
	 * the one the reader finds first. Neither was ever load-bearing for
	 * rights: the engravings are public domain and the credit is courtesy,
	 * with the full statement on the colophon.
	 *
	 * THE PICTURE OPENS OVER THE PAGE TOO, and for a reason the caption's card
	 * does not share: it is not that there is more to say about the plate, but
	 * that there is more of the plate than is on the screen. `PLATE_SIZES`
	 * draws it at 640 CSS px in the reading column and at about 390 on a
	 * phone, where `srcset` has handed the browser the 800px rendition — so
	 * the reader is holding roughly twice the detail they can see, and Doré's
	 * hatching is what that detail is made of. `PlateViewer` is a full-viewport
	 * `<dialog>` over the SAME file, never a larger one; its docblock carries
	 * the rest of the argument, including why it is a modal where every other
	 * floating thing here is a popover.
	 *
	 * `t` ARRIVES WITH IT, and the note above about this component needing no
	 * language still holds where it was aimed: the CREDIT is composed by the
	 * route, because only the route knows which collection a plate belongs to.
	 * A control's own name is not corpus data and has nowhere else to come
	 * from.
	 *
	 * IT HIDES ITSELF WHEN THE IMAGE DOES NOT ARRIVE, and that is not defensive
	 * padding — it is the offline case, by design. The plates are enrichment
	 * and are deliberately in no service-worker download wave (`sw-policy.ts`),
	 * so an offline reader has the ones they have already seen and not the
	 * rest. An empty figure with a caption under it would announce a picture
	 * that is not there; a chapter with one fewer plate announces nothing,
	 * which is right, because the text is what they came for.
	 */
	import type { Plate } from '$lib/plates';
	import { PLATE_SIZES } from '$lib/plates';
	import { plateSrc, plateSrcset } from '$lib/plate-src';
	import Icon from '$lib/components/Icon.svelte';
	import PlateViewer from '$lib/components/PlateViewer.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		plate: Plate;
		/** The collection's attribution, already composed and already
		 *  localized. Passed rather than read so this component needs no
		 *  corpus and no language: the page that knows which collection a
		 *  plate belongs to is the page that composes the line. Newlines are
		 *  honoured — the card and the print line both set `pre-line`. */
		credit?: string;
	}

	let { plate, credit }: Props = $props();

	const srcset = $derived(plateSrcset(plate.id));
	const src = $derived(plateSrc(plate.id));

	let failed = $state(false);

	/**
	 * The viewer, mounted only once it has been asked for.
	 *
	 * NOT RENDERED CLOSED, which is where this parts company with `JumpBox`.
	 * That box is one dialog on the page and leaves its markup in the document
	 * because a closed `<dialog>` is `display: none` and costs nothing;
	 * Genesis renders twenty-seven of these, and twenty-seven dialogs each
	 * holding a second `<img>` for a picture nobody has asked to see is a
	 * different bargain. `TocMenu` renders its list the same way and for the
	 * same reason.
	 *
	 * `viewerSrc` IS READ OFF THE INLINE IMAGE at the moment of the click,
	 * never rebuilt: `currentSrc` is the rendition the browser actually chose
	 * out of the `srcset` for this viewport and this pixel ratio, and it is
	 * therefore the one file already in the cache. See `PlateViewer`'s
	 * docblock for why the viewer refuses to fetch a bigger one.
	 */
	let imgEl: HTMLImageElement | undefined = $state();
	let openerEl: HTMLButtonElement | undefined = $state();
	let viewerSrc = $state('');
	let viewing = $state(false);

	/* No src, no viewer. The one way to arrive here with nothing is a click
	   landing before the lazy image has resolved a candidate, and opening an
	   empty dialog over the page is a worse answer than the click appearing
	   not to have registered. */
	function openViewer() {
		viewerSrc = imgEl?.currentSrc || imgEl?.src || '';
		if (viewerSrc) viewing = true;
	}

	// Per INSTANCE, which is per plate: a chapter renders up to 27 of these
	// and each card needs an id of its own for `popovertarget` to name.
	// `$props.id()` has to be a bare variable declaration initializer, so it
	// cannot be passed straight to the constructor.
	const uid = $props.id();
	const card = new AnchoredPanel(uid);
</script>

{#if src && !failed}
	<figure class="plate">
		<!-- A button and not an image with a handler on it: the picture opens a
		     dialog, and everything that makes that reachable — the tab stop,
		     Enter and Space, the focus ring, the announcement that this is a
		     control at all — comes from the element being one. `aria-haspopup`
		     says which kind, so a screen-reader user knows the page is about
		     to change out from under them rather than navigate. -->
		<button
			bind:this={openerEl}
			type="button"
			class="plate-open"
			aria-haspopup="dialog"
			aria-label={t('plates.enlarge').replace('{title}', plate.title)}
			onclick={openViewer}
		>
			<img
				bind:this={imgEl}
				{src}
				{srcset}
				sizes={PLATE_SIZES}
				width={plate.width}
				height={plate.height}
				alt=""
				loading="lazy"
				decoding="async"
				onerror={() => (failed = true)}
			/>
		</button>
		<figcaption>
			{#if credit}
				<!-- The title IS the control's content, so its accessible name is
				     the plate's own name and `aria-expanded` says the rest. A
				     separate "show attribution" label would name the button
				     something other than its visible text, which is the one thing
				     a disclosure trigger must not do. -->
				<button
					bind:this={card.trigger}
					type="button"
					class="caption-trigger"
					popovertarget={card.id}
					aria-expanded={card.open}
				>
					<span class="title">{plate.title}</span>
					<Icon name="info" class="hint" />
				</button>
				<!-- `role="note"` — ARIA's own word for content ancillary to the
				     thing it hangs off, which a credit exactly is. Not `tooltip`,
				     the role `LinkPreview`'s hover card carries: that one describes
				     its anchor and is summoned rather than asked for. -->
				<span
					bind:this={card.panel}
					id={card.id}
					popover="auto"
					role="note"
					ontoggle={card.onToggle}
					class="panel-surface floating-panel plate-credit">{credit}</span
				>
				<!-- Print gets the credit unconditionally: a printed plate leaves
				     this site entirely, and it is the one copy whose reader cannot
				     tap anything or follow a link to the colophon. A popover never
				     prints — it is in the top layer and closed besides — so the
				     line is rendered separately rather than coaxed out of the card.
				     `aria-hidden` so it is not announced twice on screen. -->
				<span class="credit-print" aria-hidden="true">{credit}</span>
			{:else}
				<span class="title">{plate.title}</span>
			{/if}
		</figcaption>
	</figure>

	{#if viewing}
		<!-- Focus is put back by hand for the reason `TocMenu` gives: the
		     dialog restores it as it closes, but this one is unmounted in the
		     same turn, and a keyboard reader whose focus went with it is
		     returned to the top of the document instead of to the picture they
		     were standing on. -->
		<PlateViewer
			{plate}
			{credit}
			src={viewerSrc}
			onclosed={() => {
				viewing = false;
				openerEl?.focus();
			}}
		/>
	{/if}
{/if}

<style>
	/*
	 * `display: block` on a figure inside `.reading-text`, which is a run of
	 * inline verse spans rather than paragraphs. That is what makes the plate
	 * break the line and sit between verses instead of inside one.
	 */
	.plate {
		display: block;
		margin-block: 2.5rem;
		margin-inline: 0;
	}

	/*
	 * The trigger is the picture and must look like nothing: no chrome, no
	 * box, and the figure's own width. `display: block` rather than the
	 * button default so the image inside is not sitting on a text baseline
	 * with a descender's worth of space under it.
	 */
	.plate-open {
		appearance: none;
		display: block;
		inline-size: 100%;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		cursor: zoom-in;
	}

	.plate-open:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 3px;
	}

	.plate img {
		display: block;
		inline-size: 100%;
		block-size: auto;
		/* See `--plate-blend` in app.css: the scan's paper multiplies away on
		   a light or sepia page, and dark keeps the paper and dims it. */
		mix-blend-mode: var(--plate-blend);
		filter: var(--plate-filter);
	}

	figcaption {
		margin-block-start: 0.6rem;
		font-family: var(--font-sans);
		font-size: 0.8em;
		line-height: 1.4;
		color: var(--color-text-muted);
		text-align: center;
	}

	.title {
		font-variant-caps: small-caps;
		letter-spacing: 0.04em;
	}

	/* A button that has to read as a caption: no chrome, the caption's own
	   colour and size, and the pointer only to say it does something. */
	.caption-trigger {
		appearance: none;
		border: 0;
		background: none;
		padding: 0.4rem 0.2rem;
		margin: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}

	/* Padding above rather than a min-height, so the caption row does not grow:
	   a caption-sized glyph is a small tap target, and touch is the reason this
	   card exists at all, so the target extends into whitespace the figure
	   already occupies. */
	.caption-trigger :global(.hint) {
		margin-inline-start: 0.35em;
		vertical-align: -0.1em;
		opacity: 0.55;
	}

	.caption-trigger:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/*
	 * The card. Where it sits — fixed, hidden until `AnchoredPanel` has
	 * measured it, the UA `[popover]` centring reset, no `z-index` because the
	 * top layer decides — is `.floating-panel` in app.css.
	 *
	 * CHROME SIZE, NOT CAPTION SIZE, the same fixed `rem` as the citation card
	 * it borrows its look from: nothing around it now to grow with.
	 */
	.plate-credit {
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text);
		text-align: start;
		/* The credit is two lines separated by a newline in the string, which
		   the colophon prints as two lines too. */
		white-space: pre-line;
		text-wrap: pretty;
		overflow-wrap: break-word;
	}

	.credit-print {
		display: none;
	}

	/*
	 * A plate PRINTS. The chapter's print rules hide screen affordances —
	 * pickers, the reading bar, the button that started the print — and an
	 * engraving is none of those; it is the illustration of the passage, and
	 * it is the one thing on the page that was made to be printed.
	 *
	 * Paper is white, so the blend has nothing to blend with and the
	 * dark-theme dim would only waste ink; a plate broken across a page
	 * boundary is worse than one moved to the next; and the caption becomes a
	 * plain line of type with the credit beneath it, since on paper there is
	 * nothing to press.
	 */
	@media print {
		.plate {
			break-inside: avoid;
		}

		.plate img {
			mix-blend-mode: normal;
			filter: none;
		}

		.plate-open {
			cursor: auto;
		}

		.caption-trigger {
			padding: 0;
			cursor: auto;
		}

		.caption-trigger :global(.hint) {
			display: none;
		}

		.credit-print {
			display: block;
			margin-block-start: 0.1rem;
			font-size: 0.9em;
			white-space: pre-line;
		}
	}
</style>
