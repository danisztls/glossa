<script lang="ts">
	/**
	 * One numbered footnote reference: the superscript marker, and the
	 * citation it names.
	 *
	 * WHERE THERE IS A MARGIN, THE CITATION IS SET IN IT — open, beside the
	 * line that raises it, in the same `.margin-note` an annotated edition's
	 * gloss gets (`Sidenote.svelte`, `sidenotes.svelte.ts`). This component
	 * used to argue the opposite: that a source is a few words wanted only on
	 * demand, and so belongs behind a control. That reasoning was about a
	 * disclosure that pushes the rest of the page down — the mechanism
	 * `PLAN.md` #3 names as the one the designed reading experience replaces
	 * — and it stops applying the moment the note costs the text nothing,
	 * which is what the margin is. What a reader actually wants to know of a
	 * quoted sentence is where it comes from, and 3,698 of the Catechism's
	 * citations average 26 characters: short enough to sit in a 13rem column
	 * without ever being fetched.
	 *
	 * BELOW THE BREAKPOINT IT IS A DISCLOSURE AGAIN, and here the two
	 * apparatuses part company. A gloss becomes a block under its line,
	 * because a gloss is a paragraph; a citation stays the small boxed span
	 * inside the sentence it belongs to, because that is what it was and it
	 * fits.
	 *
	 * Extracted when a second reading surface needed it. A STRUCTURE HEADING
	 * can carry the same apparatus a paragraph can — the CCC's EN mirror
	 * prints a `<sup>` reference on two of its headings, sourcing the phrase
	 * each one quotes (docs/corpus-schema.md, "A heading can carry citations")
	 * — and `HeadingText` renders it, so the marker, the button, the boxed
	 * disclosure and the three ways a citation can be empty now have one owner
	 * instead of a copy per surface.
	 *
	 * THE OPEN STATE IS THE CALLER'S, not this component's. `ProseBlocks`
	 * keys a `SvelteSet` by block and position because the source can cite the
	 * same footnote twice in one paragraph and the two disclosures must open
	 * independently; a heading needs no such key. Neither rule belongs in
	 * here, which is why this takes `open` and reports a toggle rather than
	 * holding a boolean of its own.
	 *
	 * NOT for a citation the source printed inline — the PT Catechism's
	 * parenthesised Scripture locators (`CccCitation.label`). Those are text
	 * the source actually prints and render as themselves, never as a marker;
	 * callers test `label` first and never reach this.
	 */
	import type { CccCitation } from '$lib/types';
	import RefText from '$lib/components/RefText.svelte';
	import { sidenoteRoom } from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** The printed reference — "25". Shown in the superscript, and shown
		    again in place of the citation when there is no entry for it. */
		marker: string;
		/** The entry `marker` points at, or undefined when the corpus has
		    none (a validated-against case, so it means a bug, not a shrug). */
		citation: CccCitation | undefined;
		/** Bare content language, for `RefText`'s citation grammar. */
		lang: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it — English works that number the books of Kings
		    the Douay way — and passing nothing reads the work as its language
		    reads. */
		work?: string;
		open: boolean;
		onToggle: () => void;
	}

	let { marker, citation, lang, work, open, onToggle }: Props = $props();

	// In the margin the citation is on screen no matter what `open` says, so
	// the marker is not a disclosure control and does not claim to be one.
	const inMargin = $derived(sidenoteRoom.margin);
	const shown = $derived(inMargin || open);
</script>

{#if inMargin}
	<sup class="citation-marker citation-marker-static" aria-hidden="true">{marker}</sup>
{:else}
	<sup class="citation-marker">
		<button type="button" class="citation-trigger" aria-expanded={open} onclick={onToggle}>
			{marker}
		</button>
	</sup>
{/if}
{#if shown}
	<small class:margin-note={inMargin} class:citation-text={!inMargin}>
		{#if inMargin}<span class="margin-note-label" aria-hidden="true">{marker}</span
			>{/if}{#if citation && citation.text.trim() !== ''}<RefText
				text={citation.text}
				{lang}
				{work}
			/>{:else if citation}<!-- Deliberately empty source: a handful of citations in the Vatican II
			     corpus point at a footnote-list entry that is itself
			     missing/truncated in the source page, not a parsing failure
			     (docs/research/vatican-documents.md §6, "Known source defects" — 4
			     confirmed cases). No fabricated text to show, so say so rather than
			     rendering a dead-looking empty box. --><span
				class="citation-empty">{t('citation.unavailable')}</span
			>{:else if !inMargin}<!-- No entry at all for this marker — a case the pipeline validates
			     against, so a bug rather than a shrug. The marker itself is shown
			     in its place, which is strictly more than nothing: it is what the
			     source printed. In the margin the note's own label is already
			     that marker, so this branch would print it twice; the label
			     stands alone instead, and nothing here claims the source is
			     defective when what is missing is our entry for it. -->{marker}{/if}
	</small>
{/if}

<style>
	/* `.citation-marker` and `.citation-trigger` are global (app.css), shared
	   with `PrayerMystery`, as is `.margin-note`, shared with `Sidenote`. The
	   boxed disclosure below is neither: PrayerMystery has its own, unboxed
	   `.citation-text` — a mystery's citation is always visible rather than
	   disclosed — so the name is already taken there and the treatments
	   genuinely differ. It lives here, with the button it belongs to. */

	/* Static in the margin layout: no button, so the accent colour
	   `.citation-trigger` carries has to come from somewhere, and the mark is
	   no longer something to click. Hidden from assistive technology, since the
	   citation it points at is already next in the reading order and the number
	   is then decoration. */
	.citation-marker-static {
		color: var(--color-accent);
		user-select: none;
	}

	.citation-empty {
		font-style: italic;
	}

	.citation-text {
		font-size: max(var(--font-size-min), 0.9em);
		font-style: normal;
		color: var(--color-text-muted);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		padding: 0.35rem 0.5rem;
		margin-inline-start: 0.25rem;
	}
</style>
