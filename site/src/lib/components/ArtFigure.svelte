<script lang="ts">
	/**
	 * One of `/schola`'s paintings, with its attribution behind the same
	 * control a Doré plate's caption uses.
	 *
	 * ## Why the credit is a card and not a line
	 *
	 * `Plate.svelte` argues this at length for the engravings and every word
	 * of it holds here: an attribution is apparatus, apparatus must not move
	 * the text, and a `<details>` under a picture pushes the whole page down
	 * when it opens. The popover is in the top layer and `position: fixed`, so
	 * opening it costs no layout at all. `AnchoredPanel` is the mechanism,
	 * shared with the plate card, the citation card and the anchor menu rather
	 * than written a fourth time.
	 *
	 * WHAT IT DOES NOT SHARE WITH `Plate.svelte` IS THE MARKUP, which is
	 * `floating.svelte.ts`'s own stated rule — only the mechanism moved into
	 * that class, because these panels want different widths and type and
	 * Svelte's scoped classes stop at the component boundary. This is a
	 * separate component for a reason of its own besides: a plate is a
	 * zoomable engraving with an `srcset`, a `PlateViewer` and a title of its
	 * own in the caption, and none of those exist here. A painting on a
	 * landing page is illustration; there is nothing to zoom into and nothing
	 * to read.
	 *
	 * ## The card is one link
	 *
	 * The identification IS the anchor, pointing at `source` — the Commons file
	 * page, which is where the licence tag, the digitizing institution's own
	 * terms and the master all are. `CopyrightNotice` argues this for a work's
	 * text and every word holds for a picture: an attribution with no way to
	 * reach the original asks the reader to take our word for the provenance,
	 * and it is also the page `assets/README.md` re-derives the crop from, so
	 * the link is the reproduction recipe as much as the credit. Its clothes
	 * are that component's too, dotted underline and external-link glyph
	 * included.
	 *
	 * The printed line stays plain text: a Commons URL is a hundred characters
	 * of ink for a reader who cannot press it, and what paper needs is the
	 * identification, which it gets.
	 *
	 * ## The trigger is the icon alone
	 *
	 * A plate's caption trigger has the plate's own title as its content and
	 * the glyph as a hint after it. These pictures have no title on the page —
	 * they are not the subject of anything, and a line of small caps under
	 * each would be four captions competing with the headings they sit above.
	 * So the control is the `info` glyph and nothing else, which makes an
	 * `aria-label` mandatory rather than optional: an icon has no text to
	 * attach a name to. `docs/decisions.md`'s accessibility bar says exactly
	 * this, and `Icon.svelte` enforces the other half by making every icon
	 * `aria-hidden` with no label prop to reach for.
	 *
	 * ## The image
	 *
	 * `alt=""`, with the identification in the caption — `Plate.svelte`'s
	 * arrangement and its argument: the picture is not information the page
	 * would be incomplete without, and a screen reader that reads the same
	 * line twice is worse served than one that reads it once.
	 *
	 * `width`/`height` are the intrinsic pixels, so the browser reserves the
	 * box before it has a byte and nothing below shifts when the file lands.
	 * `eager` is for a picture above the fold; everything else is `lazy` and
	 * costs nothing until the reader arrives at it.
	 */
	import type { Artwork } from '$lib/landing-art';
	import Icon from '$lib/components/Icon.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';

	interface Props {
		art: Artwork;
		/** The attribution, already composed and already localized — passed
		 *  rather than read for the reason `Plate.svelte` gives: the page that
		 *  knows which collection a picture belongs to is the page that writes
		 *  the line, and this component then needs no corpus and no language. */
		credit: string;
		/** The trigger's accessible name. Its own string because the button has
		 *  no text content to take one from. */
		label: string;
		/** Above the fold. The hero, and nothing else. */
		eager?: boolean;
	}

	let { art, credit, label, eager = false }: Props = $props();

	// Per INSTANCE: a page renders several of these and `popovertarget` needs a
	// distinct id to name. `$props.id()` has to be a bare variable declaration
	// initializer, so it cannot be passed straight to the constructor.
	const uid = $props.id();
	const card = new AnchoredPanel(uid);
</script>

<figure class="art">
	<img
		class="plate"
		class:paper={art.paper}
		src={art.src}
		width={art.width}
		height={art.height}
		alt=""
		loading={eager ? 'eager' : 'lazy'}
		decoding="async"
	/>
	<figcaption>
		<button
			bind:this={card.trigger}
			type="button"
			class="menu-trigger caption-trigger"
			popovertarget={card.id}
			aria-expanded={card.open}
			aria-label={label}
		>
			<Icon name="info" class="hint" />
		</button>
		<!-- `role="note"` — ARIA's own word for content ancillary to the thing it
		     hangs off, which an attribution exactly is. Not `tooltip`, which
		     describes its anchor and is summoned rather than asked for. -->
		<span
			bind:this={card.panel}
			id={card.id}
			popover="auto"
			role="note"
			ontoggle={card.onToggle}
			class="panel-surface floating-panel art-credit"
		>
			<!-- THE IDENTIFICATION IS THE LINK, on `CopyrightNotice`'s reasoning
			     and in its clothes: an attribution with no way to reach the
			     original asks the reader to take our word for it, and the link is
			     what makes the claim checkable. `landing-art.ts` has held the
			     Commons file page in `source` since the pictures arrived — it is
			     where the licence tag, the digitizing institution's terms and the
			     master all are, which is the same page `assets/README.md` re-derives
			     the crop from. New tab and `rel="external noopener"`, the site's
			     rule for every outbound link. -->
			<a class="source-link" href={art.source} target="_blank" rel="external noopener"
				>{credit}<Icon name="external-link" class="ext" /></a
			>
		</span>
		<!-- Print gets the credit unconditionally, on `Plate.svelte`'s reasoning:
		     a printed page leaves this site, and it is the one copy whose reader
		     cannot press anything. A popover never prints — top layer, and
		     closed besides — so the line is rendered separately rather than
		     coaxed out of the card. `aria-hidden` so it is not read twice. -->
		<span class="credit-print" aria-hidden="true">{credit}</span>
	</figcaption>
</figure>

<style>
	.art {
		margin: 0;
		position: relative;
	}

	.plate {
		display: block;
		inline-size: 100%;
		block-size: auto;
		border-radius: var(--radius-md);
		filter: var(--plate-filter);
	}

	/*
	 * A PAINTING MUST NOT TAKE `--plate-blend`. That token multiplies a grey
	 * scan's white paper away into the page and is tuned for exactly that; an
	 * oil painting put through it goes to mud. Only the works `landing-art.ts`
	 * marks `paper` — ink on a white sheet — get it.
	 */
	.plate.paper {
		mix-blend-mode: var(--plate-blend);
	}

	/* A reader who asked for one grey ramp is not handed four oil paintings. */
	:global(html[data-mono]) .plate {
		filter: var(--plate-filter) grayscale(1);
	}

	/*
	 * THE TRIGGER SITS ON THE PICTURE, at its trailing end. A caption row under
	 * a banner would be a row of empty page with one glyph in it, and these
	 * banners are wide. On the image it is where the thing it describes is.
	 *
	 * It is `.menu-trigger` — the site's icon button, a rounded square on an
	 * elevated ground taking the accent on hover. THAT IT IS A BUTTON AT ALL is
	 * why it is not a bare glyph here: a `currentColor` outline over Raphael's
	 * sky is not reliably visible in any theme, and the square reads as chrome
	 * laid on the picture rather than as part of it.
	 *
	 * WHAT IS OVERRIDDEN IS THE SIZE, and only the size. The class is 2.25rem
	 * because a header control is a primary tap target with its neighbours to
	 * be told apart from; this one sits alone on a picture, is the least
	 * important control on the page, and at that size it reads as a button
	 * somebody left on a painting. The radius, ground, border and hover stay
	 * the class's, so it is still recognisably the same button.
	 */
	.caption-trigger {
		position: absolute;
		inset-block-end: 0.5rem;
		inset-inline-end: 0.5rem;
		inline-size: 1.6rem;
		block-size: 1.6rem;
		font-size: 0.8rem;
	}

	/*
	 * The card. Where it sits — fixed, hidden until `AnchoredPanel` has
	 * measured it, the UA `[popover]` centring reset, no `z-index` because the
	 * top layer decides — is `.floating-panel` in app.css.
	 */
	.art-credit {
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text);
		text-align: start;
		text-wrap: pretty;
		overflow-wrap: break-word;
	}

	/* `CopyrightNotice`'s source link exactly — dotted until the pointer is on
	   it, and `color: inherit` so the panel reads as a line of prose with one
	   thing in it rather than as a link with a credit attached. */
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
	 * ON PAPER THE CONTROL BECOMES THE LINE IT OPENS. Paper is white, so the
	 * blend has nothing to blend with and the dark-theme dim would only waste
	 * ink; and a picture printed with no attribution beside it is the one copy
	 * that cannot go and ask for one.
	 */
	@media print {
		.art {
			break-inside: avoid;
		}

		.plate {
			mix-blend-mode: normal;
			filter: none;
		}

		.caption-trigger {
			display: none;
		}

		.credit-print {
			display: block;
			margin-block-start: 0.3rem;
			font-family: var(--font-sans);
			font-size: 0.75rem;
			color: var(--color-text-muted);
		}
	}
</style>
