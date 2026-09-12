<!--
	THE `i` THAT OPENS A NOTE, AND THE NOTE IT OPENS.

	Six surfaces draw one — the day's readings and the Mass's liturgy on
	`/calendarium`, the marks page's caveat, the census's per-shelf notes, the
	Rosary's rotation and a plate's credit — and each wrote the same twenty
	lines out by hand: a button holding a glyph, a native popover beside it,
	an `AnchoredPanel` binding the two. The copies had agreed by hand for long
	enough to have stopped agreeing — 22rem of measure against 24rem, and an
	`Icon` class that styled the glyph on one surface and was inert wherever
	else it was copied to — which is what a copied assembly looks like just
	before somebody notices.

	IT IS A COMPONENT BECAUSE THE PANEL IS STATE. `AnchoredPanel` is one
	instance per trigger and a snippet cannot hold one, which is the wall the
	census hit: its notes were a `{#snippet}` taking a panel, over four panels
	constructed by hand above it, because that is as far as a snippet goes.

	IT IS NOT A `.menu-trigger`. That is the bordered square on an elevated
	ground the settings, the language and the edition wear — right for a
	control a reader goes LOOKING for, wrong for one offering a footnote about
	the thing beside it. Every one of these sits next to a heading or a row of
	other controls, where a bordered square claims to be one of them. So it is
	the mark and nothing else: no border, no ground, muted until hovered, with
	the hit area in the padding. The `<svg>` is sized here rather than by the
	caller's `font-size`, so the glyph is the same on every surface.

	`role="note"` is ARIA's own word for content ancillary to the thing it
	hangs off, which every one of these exactly is — not `tooltip`, which
	describes its anchor and is summoned rather than asked for. The panel is
	`position: fixed` in the top layer, so opening it costs the page no layout
	and nothing on it moves.

	THE LABEL IS MANDATORY AND NOT A COURTESY. The trigger's only content is a
	glyph, and `Icon` enforces the other half by making every icon
	`aria-hidden` with no label prop to reach for. It is the `title` as well:
	the pointer gets the same words, because there is no second thing to say.

	THE PANEL BRINGS ITS MEASURE AND ITS PADDING, which every copy had alike;
	the consumer brings the note. A sentence is `text` and is set as a caveat
	— small and muted, one setting for every surface that passes one.
	Anything else is `children`, whose own markup carries its own type, the
	panel then holding a list or a credit rather than a line of small print.

	THE SECOND ARRANGEMENT IS A GLYPH ON A PICTURE, and it is `overlay`. A
	landing page's painting has no caption row to sit in — one under a banner
	would be a row of empty page with a glyph in it — so the mark goes on the
	image at its trailing end, where a `currentColor` outline over Raphael's
	sky is not reliably visible in any theme. That one wears `.menu-trigger`,
	the site's icon button, at a smaller size: a square reads as chrome laid on
	the picture rather than as part of it. What separates the two arrangements
	is what the `i` sits ON, and nothing else does — same popover, same role,
	same panel. `CreditCard` passes the variant; `ArtFigure` is why it exists.

	ON PAPER THE CONTROL BECOMES THE LINE IT OPENS. A popover never prints —
	top layer, and closed besides — so the trigger hides itself here and every
	surface renders its own printed line separately (`.caveat-print` and its
	siblings), which is also the copy whose reader cannot press anything.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';

	/** A note or the other, never neither: a trigger opening an empty panel is
	 *  a control that does nothing, and it would look exactly like one that
	 *  works until it was pressed. */
	type Props = { label: string; variant?: 'mark' | 'overlay' } & (
		{ text: string; children?: never } | { text?: never; children: Snippet }
	);
	// `label` is the trigger's accessible name and its `title` — what pressing
	// it reveals ("About these readings"), since a glyph has no text to take a
	// name from. `text` is a note that is a line of small print; `children` is
	// one that is anything else, styled by the consumer whose scope the markup
	// keeps, inside a panel that is this component's. `variant` is which of the
	// two arrangements the mark is in, and the docblock is what it means.

	let { label, text, children, variant = 'mark' }: Props = $props();

	// Per INSTANCE: `popovertarget` names an id, and a chapter of Genesis
	// renders twenty-seven of these. `$props.id()` has to be a bare variable
	// declaration initializer, so it cannot be passed straight to the
	// constructor.
	const uid = $props.id();
	const note = new AnchoredPanel(uid);
</script>

<button
	bind:this={note.trigger}
	type="button"
	class:hint-trigger={variant === 'mark'}
	class:menu-trigger={variant === 'overlay'}
	class:overlay={variant === 'overlay'}
	popovertarget={note.id}
	aria-expanded={note.open}
	aria-label={label}
	title={label}
>
	<Icon name="info" />
</button>
<!-- A `<div>` and not a `<span>`, because a consumer's note may be a list and
     a `<ul>` inside a `<span>` is not a document. Every host is flow content,
     and where the panel actually sits is the top layer either way. -->
<div
	bind:this={note.panel}
	id={note.id}
	popover="auto"
	role="note"
	ontoggle={note.onToggle}
	class="panel-surface floating-panel hint-panel"
>
	{#if children}{@render children()}{:else}<span class="hint-line">{text}</span>{/if}
</div>

<style>
	/*
	 * THE MARK IS SIZED BY THE TYPE IT STANDS BESIDE, which a fixed `rem` box
	 * cannot be: these sit next to headings from 0.8rem to a page title, and
	 * at 1.6rem square with a 0.95rem glyph the mark beside the smallest of
	 * them was half again the height of the words it was offering a footnote
	 * about. Everything here is `em` off `--hint-size`, whose default is the
	 * ROW's size — which is the heading's only where the heading does not set
	 * its own, so a surface whose type is smaller than its row says so (see
	 * `DayReadings`). `font-size` is declared because a `<button>` does not
	 * inherit one: without it every `em` below would be the UA's 13.33px.
	 *
	 * The box is 1.75em against a 0.9em glyph, so the hit area stays in the
	 * padding — a mark this size is a small target, and the whitespace around
	 * it is free.
	 */
	.hint-trigger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
		font-size: var(--hint-size, 1em);
		inline-size: 1.75em;
		block-size: 1.75em;
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-text-muted);
		line-height: 1;
		cursor: pointer;
	}

	.hint-trigger:hover {
		color: var(--color-accent);
	}

	/* `:global` because the glyph is `Icon`'s element and carries `Icon`'s
	   scope, not this component's. `em`, so it follows the rule above. */
	.hint-trigger :global(svg) {
		width: 0.9em;
		height: 0.9em;
	}

	/*
	 * THE GLYPH ON A PICTURE, at its trailing end. WHAT `.menu-trigger` GIVES
	 * IS THE SQUARE and what is overridden is the size, only the size: the
	 * radius, the ground, the border, the flex centring and the hover all stay
	 * the class's, so it is still recognisably the same button. That class is
	 * 2.25rem because a header control is a primary tap target with neighbours
	 * to be told apart from; this one sits alone on a picture, is the least
	 * important control on the page, and at that size reads as a button
	 * somebody left on a painting. Its glyph sizes in `em` off the `font-size`
	 * here and takes no `--hint-size`: a picture has no type beside the mark
	 * for it to agree with.
	 *
	 * NOTHING HERE RESETS ANYTHING, deliberately, and the hour that cost is
	 * worth a line: a scoped rule compiles to `.overlay.svelte-hash`, two
	 * classes against `.menu-trigger`'s one, so a `border: 0` or a `font:
	 * inherit` written as a shared base beats the square it is meant to be
	 * wearing and the control renders as a bare glyph on the painting.
	 */
	.overlay {
		position: absolute;
		inset-block-end: 0.5rem;
		inset-inline-end: 0.5rem;
		inline-size: 1.6rem;
		block-size: 1.6rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	/*
	 * `SiglumGloss`'s card at this one's measure: where the panel goes is
	 * `.floating-panel` (styles/menus.css), and what is left here is that a
	 * note wants a narrower column than a paragraph of commentary.
	 *
	 * NAMED `hint-panel` AND NOT `note`, which is not fussiness: a scoped
	 * class is `.note.svelte-hash` in this file's own rules and a bare `note`
	 * in the markup, so it also wears every GLOBAL rule of that name — and
	 * `.note` in styles/menus.css is a settings-panel caption carrying
	 * `white-space: nowrap`. The panel came out one unwrapped line wide with a
	 * scrollbar under it, styled by a file this component never mentions.
	 *
	 * `text-align` is declared because a caption is a host — a plate's
	 * figcaption centres its own line, and the panel is a DOM child of it
	 * however far from it the top layer draws it.
	 */
	.hint-panel {
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		text-align: start;
		overflow-wrap: break-word;
	}

	.hint-line {
		display: block;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	@media print {
		.hint-trigger,
		.overlay {
			display: none;
		}
	}
</style>
