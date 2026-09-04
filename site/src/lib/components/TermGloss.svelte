<script lang="ts">
	/**
	 * A word of the calendar's vocabulary, with what it means one press away:
	 * `Memorial`, `Violet`, `Psalter week`.
	 *
	 * `SiglumGloss` IS THE MODEL AND EVERY MECHANISM HERE IS ITS OWN — the same
	 * `NoteCard(uid, { margin: false })`, so the browser's declarative invoker
	 * toggles the card on a tap and the pointer resting opens it where a
	 * pointer can rest; the same dotted underline and `cursor: help`, which is
	 * the cue this site has already taught for "an explanation is behind this
	 * word"; the same `role="note"` and not `tooltip`.
	 *
	 * IT IS A SEPARATE COMPONENT FOR ONE REASON THAT MATTERS: what that one
	 * glosses is a siglum as some publisher PRINTED it, expanded in the
	 * citation's own language and carrying an outbound address for the volume.
	 * This glosses a word the interface itself chose, in the reader's own
	 * language, with nowhere to send them — so it declares no `lang` (the panel
	 * inherits the document's, which is the right one here) and has no source
	 * line. Sharing the component would mean two callers disagreeing about
	 * whether the panel's contents are content or chrome.
	 *
	 * THE TOP LAYER IS LOAD-BEARING ON `/calendarium`. The day's card there is
	 * held to a fixed height with `overflow-y: auto`, which clips absolutely
	 * positioned descendants; a popover is not one, so the card opens over the
	 * page instead of being cut off at the box's edge.
	 */
	import { NoteCard } from '$lib/sidenotes.svelte';

	interface Props {
		/** The word as the page prints it. */
		term: string;
		/** What it means, in a sentence or two. */
		gloss: string;
	}
	let { term, gloss }: Props = $props();

	// See `SiglumGloss` on why these are bare top-level declarations, and why
	// the id is per INSTANCE: a page prints `Memorial` on thirty rows and each
	// occurrence needs a card of its own.
	const uid = $props.id();
	const card = new NoteCard(uid, { margin: false });
</script>

<button
	bind:this={card.trigger}
	type="button"
	class="term-trigger"
	popovertarget={card.popovertarget}
	aria-expanded={card.expanded}
	onpointerenter={card.onPointerEnter}
	onpointerleave={card.onPointerLeave}>{term}</button
><span
	bind:this={card.panel}
	id={card.id}
	popover="auto"
	role="note"
	ontoggle={card.onToggle}
	onpointerenter={card.onPointerEnter}
	onpointerleave={card.onPointerLeave}
	class="panel-surface floating-panel term-card">{gloss}</span
>

<style>
	/* `.siglum-trigger`'s treatment exactly, and scoped for its reason: one
	   owner, so the styles belong with it. `help` and not `pointer` because
	   what opens is an explanation and not a destination. */
	.term-trigger {
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
	.term-trigger:hover,
	.term-trigger:focus-visible {
		text-decoration-color: currentcolor;
	}
	.term-trigger:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}

	/* Wider than `.siglum-card` (20rem) because these are two or three
	   sentences rather than an expansion, and set in the reading colour rather
	   than the muted one: an expansion is apparatus beside a text, and this is
	   the only thing on the screen answering the question it was opened for. */
	.term-card {
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-style: normal;
		line-height: 1.5;
		color: var(--color-text);
		overflow-wrap: break-word;
	}
</style>
