<script lang="ts">
	/**
	 * A citation's siglum, as a thing the reader can open: `AAS` with its
	 * expansion one press away.
	 *
	 * IT WAS A `title` ATTRIBUTE UNTIL 2026-09-02, AND A `title` NEVER FIRES ON
	 * A TAP. The cue was drawn all the same -- a dotted underline and
	 * `cursor: help` -- so on a phone the site promised something and then did
	 * nothing when pressed, which is worse than promising nothing: the reader
	 * cannot tell a broken affordance from one they are pressing wrongly. The
	 * same failure is recorded one surface over in `reading-chrome.css`, where
	 * `.sidebar-toc-note` swaps its hover glyph under `hover: none` for exactly
	 * this reason.
	 *
	 * `NoteCard` RATHER THAN A MECHANISM OF ITS OWN. `margin: false` is what
	 * makes `popovertarget` the panel's own id, so the browser's declarative
	 * invoker toggles the card on a tap and the pointer resting opens it where
	 * there is a pointer that can rest -- the two ways in the three apparatus
	 * marks already have, at the same grace periods, in the same
	 * `.panel-surface .floating-panel`. No `modal` thunk: an expansion is a
	 * phrase, never past `CARD_MAX_CHARS`, so there is no dialog branch here.
	 *
	 * THE PANEL IS RENDERED INLINE, BESIDE THE BUTTON, AND THAT IS LOAD-BEARING.
	 * `RefText` renders inside `CitationDisclosure`'s own `popover="auto"` card,
	 * and an auto popover's ancestor is computed from its invoker AND its
	 * position in the DOM -- so a card that stays inside the citation's card
	 * cannot light-dismiss it, on the click path or on the hover path, which
	 * calls `showPopover()` with no invoker at all. That is the hazard
	 * `LinkPreview` pays for with `popover="manual"`; this one avoids it by
	 * leaving the panel where it belongs.
	 *
	 * NOT `.note-trigger`, which is the other reuse that suggests itself and is
	 * wrong. That class grows a 44x44 tap target under `(pointer: coarse)`,
	 * sized for a 7px glyph; over a word in a footnote the overlay reaches into
	 * the lines above and below and swallows their taps -- the collision
	 * `reading-chrome.css` records fixing for the dagger. A word is already a
	 * finger-sized target.
	 */
	import { NoteCard } from '$lib/sidenotes.svelte';

	interface Props {
		/** The siglum as the source printed it. */
		label: string;
		/** The whole disclosed line, from `glossOf` -- the siglum and what it
		    stands for. Never empty: an empty one is `glossOf`'s way of saying no
		    cue should have been drawn at all. */
		gloss: string;
		/** The citation's content language. The card sits in the top layer,
		    outside every `lang` the page has declared, so it says its own. */
		lang?: string;
	}

	let { label, gloss, lang }: Props = $props();

	// See `Sidenote` on why these are bare top-level declarations: `NoteCard`
	// declares the effects that own the card's lifetime, and a rune outside
	// component initialisation has no component to attach to. `$props.id()` has
	// to be one in its own right -- it is rejected as a call argument -- and it
	// is per INSTANCE, which is the point: a footnote can print the same siglum
	// twice and each occurrence needs an id of its own.
	const uid = $props.id();
	const card = new NoteCard(uid, { margin: false });
</script>

<button
	bind:this={card.trigger}
	type="button"
	class="siglum-trigger"
	popovertarget={card.popovertarget}
	aria-expanded={card.expanded}
	onpointerenter={card.onPointerEnter}
	onpointerleave={card.onPointerLeave}>{label}</button
><!--
	`role="note"` for `CitationDisclosure`'s reason: ARIA's own word for content
	ancillary to the text it hangs off, and not `tooltip`, which the site does
	not use for any of the cards a mark opens.
--><span
	bind:this={card.panel}
	id={card.id}
	popover="auto"
	role="note"
	{lang}
	ontoggle={card.onToggle}
	onpointerenter={card.onPointerEnter}
	onpointerleave={card.onPointerLeave}
	class="panel-surface floating-panel siglum-card">{gloss}</span
>

<style>
	/*
	 * SCOPED, WHICH IS THE REVERSE OF `.note-marker` AND `.note-trigger` AND
	 * FOR THE SAME REASON. Those are global because two components share them
	 * and a class name borrowed across a Svelte boundary is silently unstyled
	 * rather than an error. This one has a single owner, so the styles belong
	 * with it.
	 *
	 * THE CUE IS UNCHANGED FROM THE `title` IT REPLACES -- a dotted underline
	 * and `cursor: help`, which is what the reader has already learned here:
	 * `RefText`'s own `.ref-link` and `CitedBy`'s `.source-label.named` draw
	 * the same line in the same border colour at the same offset. `help` and
	 * not `pointer` because what this opens is an explanation, not a
	 * destination.
	 */
	.siglum-trigger {
		font: inherit;
		color: inherit;
		background: none;
		border: 0;
		padding: 0;
		cursor: help;
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	.siglum-trigger:hover,
	.siglum-trigger:focus-visible {
		text-decoration-color: currentcolor;
	}

	.siglum-trigger:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/*
	 * `.note-popover`'s treatment at an expansion's scale: the same three
	 * signals that keep apparatus from reading as the text it hangs on --
	 * sans, smaller, muted -- and a narrower measure, because the longest
	 * expansion in any language's table is a sentence and a card sized for a
	 * paragraph of commentary would set it as one short line across 26rem.
	 *
	 * No print rule, unlike `.note-popover`: a chapter printed with its
	 * apparatus would otherwise carry markers pointing at nothing, where a
	 * siglum prints as the word the source printed and is complete on paper.
	 */
	.siglum-card {
		max-inline-size: min(20rem, calc(100vw - 1rem));
		padding: 0.4rem 0.6rem;
		font-size: 0.85rem;
		font-style: normal;
		line-height: 1.5;
		color: var(--color-text-muted);
		overflow-wrap: break-word;
	}
</style>
