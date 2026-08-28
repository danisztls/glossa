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

	interface Props {
		plate: Plate;
		/** The collection's own credit line, said once per chapter rather than
		 *  under every plate — passed in so this component needs no i18n. */
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
			loading="lazy"
			decoding="async"
			onerror={() => (failed = true)}
		/>
		<figcaption>
			<span class="title">{plate.title}</span>
			{#if credit}<span class="credit">{credit}</span>{/if}
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
		display: block;
		font-variant-caps: small-caps;
		letter-spacing: 0.04em;
	}

	.credit {
		display: block;
		margin-block-start: 0.15rem;
		font-size: 0.9em;
	}

	/*
	 * A plate PRINTS. The chapter's print rules hide screen affordances —
	 * pickers, the reading bar, the button that started the print — and an
	 * engraving is none of those; it is the illustration of the passage, and
	 * it is the one thing on the page that was made to be printed.
	 *
	 * Two adjustments and no more: paper is white, so the blend has nothing
	 * to blend with and the dark-theme dim would only waste ink; and a plate
	 * broken across a page boundary is worse than one moved to the next.
	 */
	@media print {
		.plate {
			break-inside: avoid;
		}

		.plate img {
			mix-blend-mode: normal;
			filter: none;
		}
	}
</style>
