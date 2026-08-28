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
	 * THE ATTRIBUTION IS THE CAPTION, EXPANDED. Genesis carries 27 plates and
	 * a credit repeated 27 times down a reading column is noise, while one
	 * said once at the foot of the chapter is a line the reader meets long
	 * after the picture it refers to. So the caption is a disclosure: the
	 * plate's title always, and whose engraving it is and whose scan when the
	 * reader asks for it.
	 *
	 * `<details>` RATHER THAN A `$state` BOOLEAN, the same choice the document
	 * route's inline table of contents makes and for the same reason: the
	 * browser already owns this widget's keyboard handling, its ARIA, and
	 * find-in-page (Chrome and Firefox open a closed one to reveal a match),
	 * and none of that is worth reimplementing for a caption. It also means
	 * the credit works with no JavaScript at all.
	 *
	 * AND IT IS WHAT MAKES THE CREDIT REACHABLE ON A PHONE. The `title`
	 * attribute below is a real tooltip on a pointer and nothing whatsoever on
	 * touch — there is no hover to have — so on its own it left every phone
	 * reader with the plate's name and no attribution. It stays because it
	 * costs nothing and answers a desktop reader without a click; the
	 * disclosure is what answers everyone else. Neither is load-bearing for
	 * rights: the engravings are public domain and the credit is courtesy,
	 * with the full statement on the colophon.
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

	interface Props {
		plate: Plate;
		/** The collection's attribution, already composed and already
		 *  localized — passed in rather than read, because no component in
		 *  this directory imports the i18n store and this one is not the
		 *  place to start. Newlines are honoured in both surfaces: the native
		 *  tooltip breaks on them, and the disclosure sets `pre-line`. */
		credit?: string;
	}

	let { plate, credit }: Props = $props();

	const srcset = $derived(plateSrcset(plate.id));
	const src = $derived(plateSrc(plate.id));

	let failed = $state(false);
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
				<details>
					<!-- The title IS the summary, so the control's accessible name is
					     the plate's own name and `aria-expanded` — which the browser
					     supplies — says the rest. A separate "show attribution" label
					     would name the control something other than its visible text,
					     which is the one thing a disclosure trigger must not do. -->
					<summary>
						<span class="title">{plate.title}</span>
						<Icon name="info" class="hint" />
					</summary>
					<p class="credit">{credit}</p>
				</details>
				<!-- Print gets the credit unconditionally: a printed plate leaves
				     this site entirely, and it is the one copy whose reader cannot
				     tap anything or follow a link to the colophon. Rendered
				     separately rather than by opening the `<details>` in print,
				     because a closed disclosure's contents are hidden by the user
				     agent in a way no print stylesheet can reliably override.
				     `aria-hidden` so it is not announced twice on screen. -->
				<p class="credit-print" aria-hidden="true">{credit}</p>
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

	/* Both markers, because the engines disagree about which one they draw,
	   and a stray triangle beside a centred caption is the whole reason this
	   reads as a caption rather than as a widget. */
	summary {
		list-style: none;
		cursor: pointer;
		/* A caption-sized glyph is a small tap target, and touch is the reason
		   this disclosure exists at all. Padding rather than a min-height so
		   the row does not grow: the target extends into the whitespace the
		   caption already sits in. */
		padding-block: 0.4rem;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary :global(.hint) {
		margin-inline-start: 0.35em;
		vertical-align: -0.1em;
		opacity: 0.55;
	}

	/* Focus lands on the summary, which is the whole caption row. */
	summary:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}

	.credit {
		margin-block: 0.1rem 0;
		font-size: 0.9em;
		/* The credit is two lines separated by a newline in the string; the
		   same string is the `title` above, where the break is native. */
		white-space: pre-line;
		text-wrap: pretty;
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
	 * boundary is worse than one moved to the next; and the disclosure
	 * becomes a plain line of type, with the credit beneath it whether or not
	 * the reader had it open on screen.
	 */
	@media print {
		.plate {
			break-inside: avoid;
		}

		.plate img {
			mix-blend-mode: normal;
			filter: none;
		}

		summary {
			padding-block: 0;
			cursor: auto;
		}

		summary :global(.hint) {
			display: none;
		}

		.credit-print {
			display: block;
			margin-block: 0.1rem 0;
			font-size: 0.9em;
			white-space: pre-line;
		}
	}
</style>
