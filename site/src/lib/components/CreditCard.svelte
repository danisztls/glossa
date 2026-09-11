<script lang="ts">
	/**
	 * An attribution behind a caption trigger: the button, the popover it
	 * opens, and the line that prints instead of both.
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
	 * ## `variant`, because the trigger's clothes are the one real difference
	 *
	 * `'caption'` is a line of type under a plate: no chrome, the caption's own
	 * colour and size, the glyph a hint after the title. `'overlay'` is an icon
	 * square laid on a picture that has no caption row — `.menu-trigger`, the
	 * site's icon button, because a bare `currentColor` glyph over Raphael's
	 * sky is not reliably visible in any theme.
	 *
	 * The BEHAVIOUR is identical in both and that is why they are one
	 * component: the same popover, the same `role="note"`, the same print
	 * line. `BookChapterPicker`'s `variant` is the precedent — a component
	 * whose callers want one mechanism wearing two sets of clothes.
	 *
	 * ## A CARD RATHER THAN AN EXPANDING CAPTION
	 *
	 * `Plate.svelte` carried this argument until the card moved here, and it
	 * is the card's own: an apparatus must not move the text, which is what
	 * `CitationDisclosure` says about the box it used to be. A `<details>`
	 * under a picture pushes every verse below it down when it opens and pulls
	 * them back when it closes, so a reader who taps a caption loses their
	 * place — and a plate is mid-passage, the worst position for that. The
	 * popover is in the top layer and `position: fixed`; opening it costs the
	 * page no layout at all. It is the same `.floating-panel` a citation and a
	 * link preview appear in, which is the point: a reader who has learned
	 * what a small box over the page means should not have to learn a second.
	 *
	 * NATIVE `popover`, DECLARATIVELY INVOKED. `popovertarget` is valid on
	 * `<button>` and the trigger is one, so the browser owns the open state,
	 * light dismiss, Escape, the top layer and returning focus to the trigger.
	 * What is left is `aria-expanded`, which the reader's screen reader is
	 * owed. The measuring half — measure on `toggle`, reveal, track the anchor
	 * — is `AnchoredPanel` in `floating.svelte.ts`, shared with the citation
	 * card and the anchor menu rather than written again here.
	 *
	 * ## The panel and the print line
	 *
	 * `role="note"` is ARIA's own word for content ancillary to the thing it
	 * hangs off, which an attribution exactly is. Not `tooltip`, which
	 * describes its anchor and is summoned rather than asked for. Where it
	 * sits — fixed, hidden until `AnchoredPanel` has measured it, the UA
	 * `[popover]` centring reset, no `z-index` because the top layer decides —
	 * is `.floating-panel` in app.css.
	 *
	 * Print gets the credit unconditionally: a printed page leaves this site,
	 * and it is the one copy whose reader cannot press anything. A popover
	 * never prints — top layer, and closed besides — so the line is rendered
	 * separately rather than coaxed out of the card, `aria-hidden` so it is
	 * not read twice on screen.
	 */
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';

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
		/** See the docblock. `'caption'` sits in a caption row; `'overlay'`
		 *  is laid on the picture itself. */
		variant?: 'caption' | 'overlay';
		/** The trigger's accessible name. MANDATORY for `'overlay'`, whose
		 *  button is a glyph with no text to take a name from; `'caption'`
		 *  leaves it unset, its visible title being its name — a disclosure
		 *  trigger named something other than its own visible text is the one
		 *  thing such a control must not be. */
		label?: string;
		/** Rendered inside the trigger before the glyph. A plate passes its
		 *  own title; a painting passes nothing, having no title on the page,
		 *  and the control is then the glyph alone. */
		trigger?: Snippet;
	}

	let { credit, source, variant = 'caption', label, trigger }: Props = $props();

	// Per INSTANCE: a page renders several of these and `popovertarget` needs a
	// distinct id to name. `$props.id()` has to be a bare variable declaration
	// initializer, so it cannot be passed straight to the constructor.
	const uid = $props.id();
	const card = new AnchoredPanel(uid);
</script>

<button
	bind:this={card.trigger}
	type="button"
	class="credit-trigger"
	class:overlay={variant === 'overlay'}
	class:menu-trigger={variant === 'overlay'}
	popovertarget={card.id}
	aria-expanded={card.open}
	aria-label={label}
>
	{#if trigger}{@render trigger()}{/if}<Icon name="info" class="hint" />
</button>

<span
	bind:this={card.panel}
	id={card.id}
	popover="auto"
	role="note"
	ontoggle={card.onToggle}
	class="panel-surface floating-panel credit-card"
>
	<!-- THE IDENTIFICATION IS THE LINK where there is anywhere to go, on
	     `CopyrightNotice`'s reasoning and in its clothes: the credit IS the
	     anchor rather than a credit with a "source" hung off it. New tab and
	     `rel="external noopener"`, the site's rule for every outbound link.
	     Without a `source` it stays plain text — an anchor to nowhere is worse
	     than none. -->
	{#if source}
		<a class="source-link" href={source} target="_blank" rel="external noopener"
			>{credit}<Icon name="external-link" class="ext" /></a
		>
	{:else}
		{credit}
	{/if}
</span>

<span class="credit-print" class:overlay={variant === 'overlay'} aria-hidden="true">{credit}</span>

<style>
	/*
	 * A button that has to read as a caption: no chrome, the caption's own
	 * colour and size, and the pointer only to say it does something. The
	 * padding is above rather than a min-height, so the caption row does not
	 * grow — a caption-sized glyph is a small tap target, and touch is the
	 * reason this card exists at all, so the target extends into whitespace
	 * the figure already occupies.
	 */
	.credit-trigger {
		appearance: none;
		border: 0;
		background: none;
		padding: 0.4rem 0.2rem;
		margin: 0;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}

	.credit-trigger:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/*
	 * THE OVERLAY TRIGGER SITS ON THE PICTURE, at its trailing end. A caption
	 * row under a banner would be a row of empty page with one glyph in it,
	 * and those pictures are wide; on the image it is where the thing it
	 * describes is.
	 *
	 * WHAT `.menu-trigger` GIVES IS THE SQUARE, and WHAT IS OVERRIDDEN IS THE
	 * SIZE and only the size. That class is 2.25rem because a header control
	 * is a primary tap target with neighbours to be told apart from; this one
	 * sits alone on a picture, is the least important control on the page, and
	 * at that size it reads as a button somebody left on a painting. The
	 * radius, ground, border and hover stay the class's, so it is still
	 * recognisably the same button.
	 */
	.credit-trigger.overlay {
		position: absolute;
		inset-block-end: 0.5rem;
		inset-inline-end: 0.5rem;
		inline-size: 1.6rem;
		block-size: 1.6rem;
		padding: 0;
		font-size: 0.8rem;
	}

	.credit-trigger :global(.hint) {
		margin-inline-start: 0.35em;
		vertical-align: -0.1em;
		opacity: 0.55;
	}

	/* The glyph IS the control here, so it takes neither the spacing that
	   separates it from a title nor the dimming that makes it a hint after
	   one. */
	.credit-trigger.overlay :global(.hint) {
		margin-inline-start: 0;
		vertical-align: baseline;
		opacity: 1;
	}

	/*
	 * CHROME SIZE, NOT CAPTION SIZE, the same fixed `rem` as the citation card
	 * this borrows its look from: nothing around it now to grow with. The face
	 * is declared rather than inherited — a popover inherits from its DOM
	 * parent, which is a styled `figcaption` for one caller and nothing in
	 * particular for the other, and the card must not be set in two faces
	 * depending on who opened it.
	 */
	.credit-card {
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text);
		text-align: start;
		/* A credit may be two lines separated by a newline in the string, which
		   the colophon prints as two lines too. */
		white-space: pre-line;
		text-wrap: pretty;
		overflow-wrap: break-word;
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
	 * ON PAPER THE CONTROL BECOMES THE LINE IT OPENS. The trigger is a screen
	 * affordance and goes; the credit it was hiding is the one thing a printed
	 * picture cannot go and ask for.
	 *
	 * The two variants size it differently because their contexts do. A plate
	 * prints inside a `figcaption` that already carries the face, the colour
	 * and a size relative to the reading text, so `em` there follows the
	 * reader's own setting; a picture on a landing page has no such row, so
	 * that form states the whole thing in absolutes.
	 */
	@media print {
		.credit-trigger {
			display: none;
		}

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
