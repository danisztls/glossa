<script lang="ts">
	/**
	 * An attribution behind an `i`: the credit, where it may link to, and the
	 * line that prints instead of the control.
	 *
	 * ## Why it exists, which is not the CSS
	 *
	 * `Plate.svelte` and `ArtFigure.svelte` grew this twice. Measured before
	 * it was extracted, the two agreed on 18 of the 36 declarations in their
	 * four paired rules, and on about twenty lines apiece of `AnchoredPanel`
	 * wiring, `role="note"` markup, a print line and a focus ring. That
	 * overlap is the cheap half of the argument and on its own would not have
	 * been worth a third component: most of what DIFFERED between them turned
	 * out to be context rather than rot — a plate's card inherits its face
	 * from the `figcaption` it lives in, a painting's has no caption to
	 * inherit from, and the two triggers share a name and no declarations
	 * because one is text in a caption and the other is an icon square laid on
	 * a picture.
	 *
	 * **What earned the extraction is that a POLICY was being decided twice.**
	 * The credit became a link for the paintings and stayed plain text for the
	 * plates, and nothing in either file knew the other had been asked. The
	 * same split let a colour bug live in `PlateViewer` that only one of the
	 * two callers could reach. Whether an attribution is clickable is one
	 * question about the whole site, and it now has one place to be answered:
	 * `source`, here.
	 *
	 * ## What did NOT move, and must not
	 *
	 * The picture. A plate carries an `srcset` over two renditions, an
	 * `onerror` fallback and a zoom that fetches a third file; a landing-page
	 * painting is one file cropped to a band by `--art-height`, with a second
	 * FRAMING behind the press. Those are different problems, and one
	 * component holding both would be two modes and a flag. `PlateViewer` is
	 * already the shared half of the picture and is where that leverage was.
	 *
	 * ## The mark and the card are `HintNote`'s
	 *
	 * The `i`, the popover it opens, `role="note"`, the panel's measure and
	 * the `AnchoredPanel` wiring are that component's, and every surface on
	 * the site with something further to say about the thing beside it draws
	 * the same one. A credit was the sixth such surface and had written its
	 * own; what is left here is what a CREDIT is, which is the two paragraphs
	 * above and the line below.
	 *
	 * `variant` is passed straight down: a plate's `i` follows its caption on
	 * the page's own ground, a painting's is laid on the picture because it
	 * has no caption row to follow. `A CARD RATHER THAN AN EXPANDING CAPTION`
	 * — an apparatus must not move the text — was this file's argument and is
	 * `HintNote`'s now, along with the native `popover` that carries it.
	 *
	 * THE CAPTION IS NOT THE TRIGGER, and was until 2026-09-11: a plate passed
	 * its title as the button's content, on the argument that a disclosure
	 * must be named by its visible text. It bought a title no reader could see
	 * was pressable and a hit area the width of the words. The title is type
	 * again, `label` is mandatory in both variants, and `site/docs/reading.md`
	 * carries the rest.
	 *
	 * ## The print line
	 *
	 * Print gets the credit unconditionally: a printed page leaves this site,
	 * and it is the one copy whose reader cannot press anything. A popover
	 * never prints — top layer, and closed besides — so the line is rendered
	 * separately rather than coaxed out of the card, `aria-hidden` so it is
	 * not read twice on screen.
	 */
	import HintNote from '$lib/components/HintNote.svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		/** The attribution, already composed and already localized — passed
		 *  rather than read for the reason `Plate.svelte` gives: the page that
		 *  knows which collection a picture belongs to is the page that writes
		 *  the line, so this component needs no corpus and no language.
		 *  Newlines are honoured; the card and the print line both set
		 *  `pre-line`. */
		credit: string;
		/**
		 * WHERE THE CREDIT GOES, and without it the line is plain text.
		 *
		 * `CopyrightNotice` argues the case: an attribution with no way to
		 * reach the original asks the reader to take our word for the
		 * provenance. For the landing-page paintings it is the Commons file
		 * page, which carries the licence tag, the digitizing institution's
		 * own terms and the master, and is the page `assets/README.md`
		 * re-derives the crop from — so the link is the reproduction recipe as
		 * much as the credit.
		 *
		 * The plates pass none, deliberately and pending a decision: their
		 * `provider_url` is a courtesy link to the provider's gallery rather
		 * than a licence page, which is a different claim. **That it is one
		 * prop on one component is the point of this file** — the question is
		 * now asked once.
		 */
		source?: string;
		/** See the docblock. `'caption'` follows a caption on the page's own
		 *  ground; `'overlay'` is laid on the picture itself. */
		variant?: 'caption' | 'overlay';
		/** The trigger's accessible name, mandatory in both variants: the
		 *  control is a glyph and a glyph has no text to take a name from. It
		 *  names the picture — `plates.about`, `art.about` — because a chapter
		 *  of Genesis draws twenty-seven of them. */
		label: string;
	}

	let { credit, source, variant = 'caption', label }: Props = $props();
</script>

<HintNote {label} variant={variant === 'overlay' ? 'overlay' : 'mark'}>
	<span class="credit-card">
		<!-- THE IDENTIFICATION IS THE LINK where there is anywhere to go, on
		     `CopyrightNotice`'s reasoning and in its clothes: the credit IS the
		     anchor rather than a credit with a "source" hung off it. New tab and
		     `rel="external noopener"`, the site's rule for every outbound link.
		     Without a `source` it stays plain text — an anchor to nowhere is
		     worse than none. -->
		{#if source}
			<a class="source-link" href={source} target="_blank" rel="external noopener"
				>{credit}<Icon name="external-link" class="ext" /></a
			>
		{:else}
			{credit}
		{/if}
	</span>
</HintNote>

<span class="credit-print" class:overlay={variant === 'overlay'} aria-hidden="true">{credit}</span>

<style>
	/*
	 * CHROME SIZE, NOT CAPTION SIZE, the same fixed `rem` as the citation card
	 * this borrows its look from: the panel is a DOM child of a styled
	 * `figcaption` for one caller and of nothing in particular for the other,
	 * and the card must not be set in two sizes depending on who opened it.
	 * The measure, the padding and the face around it are `HintNote`'s, which
	 * is the same answer stated once for every note on the site.
	 */
	.credit-card {
		display: block;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text);
		/* A credit may be two lines separated by a newline in the string, which
		   the colophon prints as two lines too. */
		white-space: pre-line;
		text-wrap: pretty;
	}

	/*
	 * `CopyrightNotice`'s source link: dotted until the pointer is on it, and
	 * `color: inherit` so the line reads as the credit it is rather than as a
	 * link with a credit attached.
	 *
	 * `inherit` IS CORRECT HERE and is not the bug it was in `PlateViewer`.
	 * There the anchor wore a colour class of its own and this declaration
	 * beat it on source order; here the card above owns the colour and there
	 * is nothing for it to override.
	 */
	.source-link {
		color: inherit;
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-underline-offset: 0.15em;
	}

	.source-link:hover,
	.source-link:focus-visible {
		color: var(--color-accent);
		text-decoration-style: solid;
	}

	/* The two numbers `CopyrightNotice` derives and explains: an inline `<svg>`
	   puts the BOTTOM of its box on the baseline, so a 1em glyph rises past the
	   cap height of the words beside it. */
	.source-link :global(.ext) {
		width: 0.85em;
		height: 0.85em;
		margin-inline-start: 0.28em;
		vertical-align: -0.18em;
	}

	.credit-print {
		display: none;
	}

	/*
	 * ON PAPER THE CONTROL BECOMES THE LINE IT OPENS — the trigger goes with
	 * `HintNote`, and the credit it was hiding is the one thing a printed
	 * picture cannot go and ask for.
	 *
	 * The two variants size it differently because their contexts do. A plate
	 * prints inside a `figcaption` that already carries the face, the colour
	 * and a size relative to the reading text, so `em` there follows the
	 * reader's own setting; a picture on a landing page has no such row, so
	 * that form states the whole thing in absolutes.
	 */
	@media print {
		.credit-print {
			display: block;
			margin-block-start: 0.1rem;
			font-size: 0.9em;
			white-space: pre-line;
		}

		.credit-print.overlay {
			margin-block-start: 0.3rem;
			font-family: var(--font-sans);
			font-size: 0.75rem;
			color: var(--color-text-muted);
		}
	}
</style>
