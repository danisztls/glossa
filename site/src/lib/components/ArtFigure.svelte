<script lang="ts">
	/**
	 * One of the landing-page paintings, with its attribution behind the same
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
	 * `floating.svelte.ts`'s own stated rule — only the mechanism moved into that
	 * class, because these panels want different widths and type and Svelte's
	 * scoped classes stop at the component boundary. It stays a separate
	 * component for a reason of its own: a plate carries an `srcset` over two
	 * renditions and a title of its own in the caption, and neither exists here —
	 * one file, and an identification rather than a name.
	 *
	 * **IT DOES SHARE `PlateViewer` NOW, SINCE 2026-09-06, and the sentence that
	 * used to sit here said it never would.** "There is nothing to zoom into" was
	 * true of a banner drawn whole and stopped being true the moment
	 * `--art-height` cropped one: see below.
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
	 *
	 * ## THE PAGE SETS THE HEIGHT, AND THE PICTURE IS CROPPED TO IT
	 *
	 * `--art-height` is the one knob, unset by default and therefore `auto`,
	 * which is what `/schola`'s banner still gets: the file's own ratio, whole.
	 * `/bibliotheca` sets 300px, and `object-fit: cover` then draws a band across
	 * the middle of the painting rather than letting a picture that is a ROOM
	 * take half the page under a catalogue. A component-level prop was the other
	 * option and this is not one: the number is a fact about how much room that
	 * page has after its shelves, which is the page's business and nothing this
	 * file could ever decide.
	 *
	 * `--art-position` is the same knob for WHICH band, and exists because a
	 * slot far narrower than its file makes that a choice rather than a
	 * rounding. It is the page's for the same reason. See the CSS.
	 *
	 * ## AND THE PICTURE OPENS OVER THE PAGE, on `Plate.svelte`'s reasoning
	 * arrived at from the opposite direction. A plate opens because the file
	 * holds more DETAIL than the reading column can draw; this opens because the
	 * band holds less PICTURE than the file has — cover keeps the middle and the
	 * reader who wants Jerome's shelves, his lion and his floor cannot get to
	 * them otherwise. Same `PlateViewer`, generalized on 2026-09-06 to take a
	 * picture rather than a plate, and `plates.enlarge` reused as the label
	 * rather than adding a string to thirty-seven dictionaries to say the same
	 * word.
	 *
	 * ## WHAT OPENS IS NOT ALWAYS THE FILE ON THE PAGE
	 *
	 * An artwork with a `whole` ships twice at two framings, and the viewer
	 * gets that one: `/quaestiones`' band is the Disputa's earthly register,
	 * and what a reader who presses wants is the fresco it was cut from, not
	 * more of the strip. `landing-art.ts` argues the case; this component only
	 * has to hand the view a source and the intrinsic pixels that go WITH it,
	 * since the stage reserves its ratio from those and a second framing is a
	 * second ratio.
	 *
	 * EVERYTHING THE VIEW SHOWS MUST BE THE SHOWN FILE'S, its Commons file
	 * page included. A second framing is sometimes a second FILE —
	 * `/scriptura`'s band is a Commons derivative of the file its `whole`
	 * ships, straightened and published in its own right — so `whole.source`
	 * overrides the artwork's wherever it exists, and the link under the
	 * picture is the page for the picture rather than for its parent.
	 *
	 * It costs the sentence below. `viewerSrc` off the inline image is the file
	 * already in the cache, so opening it is free; a `whole` is a fetch the
	 * press pays for. Free was never the point — it was what the arrangement
	 * happened to buy when there was only ever one file.
	 */
	import type { Artwork } from '$lib/landing-art';
	import Icon from '$lib/components/Icon.svelte';
	import PlateViewer from '$lib/components/PlateViewer.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';
	import { t } from '$lib/i18n.svelte';

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
		/**
		 *  THE PICTURE OPENS OVER THE PAGE. Set it where there is something
		 *  behind the picture and nowhere else, which is either of two things: a
		 *  `--art-height` cropping the file, since a band is a WINDOW and a
		 *  reader who can see only the middle of a room needs a way to the rest
		 *  of it, or an artwork with a `whole`, which ships a second framing for
		 *  the viewer to open. A picture that is drawn whole and has no `whole`
		 *  has nothing behind it, and making it a control would promise one.
		 */
		expandable?: boolean;
	}

	let { art, credit, label, eager = false, expandable = false }: Props = $props();

	/**
	 * The viewer, mounted only once it has been asked for — `Plate.svelte`'s
	 * arrangement and its argument, which holds here for a smaller reason: a
	 * landing page renders one of these, but a dialog holding a second
	 * `<img>` for a picture nobody has asked to see is still a second fetch
	 * waiting to happen.
	 *
	 * Without a `whole`, `viewerSrc` is read off the inline image at the moment
	 * of the click and never rebuilt: it is the file the browser actually chose
	 * and therefore the one already in the cache, which is what makes opening
	 * free. With one, the whole work is what opens — see above.
	 */
	let imgEl: HTMLImageElement | undefined = $state();
	let openerEl: HTMLButtonElement | undefined = $state();
	let viewerSrc = $state('');
	let viewing = $state(false);

	/** Whatever `openViewer` chose, never the other one: the stage reserves
	 *  its ratio from these pixels before a byte has landed, the two framings
	 *  do not share a ratio, and where they are two scans they do not share a
	 *  file page either. `whole` may omit `source` — both framings off one
	 *  download is the ordinary case — so the artwork's is the fallback. */
	const viewed = $derived(art.whole ?? art);
	const viewedSource = $derived(viewed.source ?? art.source);

	function openViewer() {
		viewerSrc = art.whole ? art.whole.src : imgEl?.currentSrc || imgEl?.src || '';
		if (viewerSrc) viewing = true;
	}

	// Per INSTANCE: a page renders several of these and `popovertarget` needs a
	// distinct id to name. `$props.id()` has to be a bare variable declaration
	// initializer, so it cannot be passed straight to the constructor.
	const uid = $props.id();
	const card = new AnchoredPanel(uid);
</script>

<figure class="art">
	<!-- A button and not an image with a handler on it, for every reason
	     `Plate.svelte` gives: the tab stop, Enter and Space, the focus ring and
	     the announcement that this is a control at all come from the element
	     being one. `aria-haspopup` says which kind, so the page changing out
	     from under the reader is not a surprise. The label names the picture
	     it enlarges, which is the credit, since these have no title on the
	     page. -->
	{#if expandable}
		<button
			bind:this={openerEl}
			type="button"
			class="art-open"
			aria-haspopup="dialog"
			aria-label={t('plates.enlarge').replace('{title}', credit)}
			onclick={openViewer}
		>
			{@render picture()}
		</button>
	{:else}
		{@render picture()}
	{/if}
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

<!-- One `<img>`, rendered in or out of the opener. Written twice it would
     be two places to keep the blend, the loading and the intrinsic size
     agreeing, which is the bug this shape exists to make impossible. -->
{#snippet picture()}
	<img
		bind:this={imgEl}
		class="plate"
		class:paper={art.paper}
		src={art.src}
		width={art.width}
		height={art.height}
		alt=""
		loading={eager ? 'eager' : 'lazy'}
		decoding="async"
	/>
{/snippet}

{#if viewing}
	<!-- Focus is put back by hand: the dialog restores it as it closes, but
	     this component unmounts it in the same turn, so a keyboard reader
	     whose focus went with it would land at the top of the document
	     instead of on the picture they were standing on. -->
	<!-- The credit loses its "(detail)" when what opens is the whole work,
	     because it is then not one. `art.credit` is the plain identification —
	     the page composed the other line by adding the interface word to this
	     same string, so taking it back needs no second prop and no dictionary.

	     AND IT CARRIES ITS SOURCE, which the caption card below has always
	     done and this view could not: `credit` is a string, and a string
	     cannot hold a URL. The claim is most worth checking here, where the
	     reader is looking at the picture rather than past it — and where, for
	     an artwork with a `whole`, the work itself is on the screen for the
	     only time. -->
	<PlateViewer
		width={viewed.width}
		height={viewed.height}
		credit={art.whole ? art.credit : credit}
		source={viewedSource}
		src={viewerSrc}
		onclosed={() => {
			viewing = false;
			openerEl?.focus();
		}}
	/>
{/if}

<style>
	.art {
		margin: 0;
		position: relative;
	}

	/* `Plate.svelte`'s opener exactly, minus the `zoom-in` cursor: this one
	   does not magnify, it uncovers — the band is a window on the file and
	   what a click opens is the rest of the picture. */
	.art-open {
		appearance: none;
		display: block;
		inline-size: 100%;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}

	.art-open:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 3px;
	}

	/*
	 * `--art-height` IS THE PAGE'S, and unset it is `auto` — the file's own
	 * ratio, which is what a banner wants. A page that gives it a number gets
	 * a band: `cover` fills that box from the middle of the picture and
	 * crops what will not fit, which is why the shipped file is cropped to
	 * the study and no further (`assets/README.md`).
	 *
	 * `--art-position` IS THE SECOND HALF OF THAT, and it defaults to the
	 * middle because that is where `cover` crops from. `assets/README.md`'s
	 * rule is to CENTRE THE BAND ON THE FILE and let cover find it, and that
	 * rule holds wherever the file's ratio is near the slot's — Jerome is
	 * 2.2:1 in a 2.3:1 box, so the window barely moves and baking it in costs
	 * nothing.
	 *
	 * It stops holding when the two are far apart. `/scriptura` hangs a 2.15:1
	 * panel in a 5.3:1 slot, and then the window is a THIRD of the file rather
	 * than nearly all of it, so which third is a real choice and a different
	 * one at different widths — baked into the file it would also be all a
	 * phone could ever show, where cover flips to cropping the ends and a
	 * narrow screen wants the panel back. So the file stays whole and the page
	 * says where to look. **Bake the crop in where the file and the slot want
	 * the same window at every width; use this where they do not.**
	 */
	.plate {
		display: block;
		inline-size: 100%;
		block-size: var(--art-height, auto);
		object-fit: cover;
		object-position: var(--art-position, center);
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

		.art-open {
			cursor: auto;
		}

		/* Paper has no viewer to open, so the band is not a window on
		   anything — the whole picture prints. */
		.plate {
			block-size: auto;
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
