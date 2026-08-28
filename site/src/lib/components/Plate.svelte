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
	 * second one.
	 *
	 * NATIVE `popover`, DECLARATIVELY INVOKED. `popovertarget` is valid on
	 * `<button>` and the trigger here is one, so the browser owns the open
	 * state, light dismiss, Escape, the top layer and returning focus to the
	 * caption. What is kept here is `aria-expanded`, which the reader's screen
	 * reader is owed, and the anchor tracking, which is only worth a listener
	 * while something is open.
	 *
	 * AND IT IS WHAT MAKES THE CREDIT REACHABLE ON A PHONE. The `title`
	 * attribute below is a real tooltip on a pointer and nothing whatsoever on
	 * touch — there is no hover to have — so on its own it left every phone
	 * reader with the plate's name and no attribution. It stays because it
	 * costs nothing and answers a mouse reader over the picture itself,
	 * without a click; the card is what answers everyone else. Neither is
	 * load-bearing for rights: the engravings are public domain and the credit
	 * is courtesy, with the full statement on the colophon.
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
	import { computePanelPosition, trackAnchor } from '$lib/floating';

	interface Props {
		plate: Plate;
		/** The collection's attribution, already composed and already
		 *  localized. Passed rather than read so this component needs no
		 *  corpus and no language: the page that knows which collection a
		 *  plate belongs to is the page that composes the line. Newlines are
		 *  honoured in every surface — the native tooltip breaks on them, and
		 *  the card and the print line set `pre-line`. */
		credit?: string;
	}

	let { plate, credit }: Props = $props();

	const srcset = $derived(plateSrcset(plate.id));
	const src = $derived(plateSrc(plate.id));

	let failed = $state(false);

	// Per INSTANCE, which is per plate: a chapter renders up to 27 of these
	// and each card needs an id of its own for `popovertarget` to name.
	const uid = $props.id();

	let trigger: HTMLElement | undefined = $state();
	let panel: HTMLElement | undefined = $state();
	/** Mirrors the popover's own state — for `aria-expanded`, and to decide
	 *  whether tracking the anchor is worth a listener. */
	let open = $state(false);

	/**
	 * PLACED IMPERATIVELY, for the ordering reason `NoteCard` sets out at
	 * length: `toggle` fires AFTER the popover is shown, so a coordinate that
	 * travelled back through Svelte's update cycle would leave one painted
	 * frame at the card's static position. The card starts `visibility:
	 * hidden` in CSS and is revealed here, in the same synchronous turn that
	 * measures it. It cannot be measured earlier either — a closed popover is
	 * `display: none`, and `getBoundingClientRect` on one is all zeroes.
	 */
	function place() {
		if (!panel || !trigger) return;
		const at = computePanelPosition(trigger.getBoundingClientRect(), panel.getBoundingClientRect());
		panel.style.top = `${at.top}px`;
		panel.style.left = `${at.left}px`;
		panel.style.visibility = 'visible';
	}

	/**
	 * The one thing native dismissal does not do is tell Svelte. Escape, a
	 * light dismiss and another plate's card superseding this one all hide the
	 * element without touching anything here, which would leave the caption's
	 * `aria-expanded` reading `true` over a card nobody can see.
	 */
	function onToggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (open) place();
		else if (panel) panel.style.visibility = 'hidden';
	}

	// Only while open. A component per plate means a chapter has dozens, and a
	// scroll listener per rendered caption is the mistake `AnchorMenu` records
	// not making. Tracking rather than dismissing because this card was opened
	// on purpose — see `trackAnchor`.
	$effect(() => (open ? trackAnchor(place) : undefined));
</script>

{#if src && !failed}
	<figure class="plate">
		<img
			{src}
			{srcset}
			sizes={PLATE_SIZES}
			width={plate.width}
			height={plate.height}
			alt={plate.title}
			title={credit ? `${plate.title}\n${credit}` : plate.title}
			loading="lazy"
			decoding="async"
			onerror={() => (failed = true)}
		/>
		<figcaption>
			{#if credit}
				<!-- The title IS the control's content, so its accessible name is
				     the plate's own name and `aria-expanded` says the rest. A
				     separate "show attribution" label would name the button
				     something other than its visible text, which is the one thing
				     a disclosure trigger must not do. -->
				<button
					bind:this={trigger}
					type="button"
					class="caption-trigger"
					popovertarget={uid}
					aria-expanded={open}
				>
					<span class="title">{plate.title}</span>
					<Icon name="info" class="hint" />
				</button>
				<!-- `role="note"` — ARIA's own word for content ancillary to the
				     thing it hangs off, which a credit exactly is. Not `tooltip`,
				     the role `LinkPreview`'s hover card carries: that one describes
				     its anchor and is summoned rather than asked for. -->
				<span
					bind:this={panel}
					id={uid}
					popover="auto"
					role="note"
					ontoggle={onToggle}
					class="floating-panel plate-credit">{credit}</span
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
	 * The card. Where it sits — fixed, the UA `[popover]` centring reset, no
	 * `z-index` because the top layer decides — is `.floating-panel` in
	 * app.css. Hidden until `place()` has measured it; see there for why that
	 * has to be the stylesheet's starting point rather than the template's.
	 *
	 * CHROME SIZE, NOT CAPTION SIZE, the same fixed `rem` as the citation card
	 * it borrows its look from: nothing around it now to grow with.
	 */
	.plate-credit {
		visibility: hidden;
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text);
		text-align: start;
		/* The credit is two lines separated by a newline in the string — the
		   same string the image's `title` carries, where the break is native. */
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
