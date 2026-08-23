<script lang="ts">
	/**
	 * One numbered footnote reference: the superscript marker, and the
	 * citation text it discloses when the reader opens it.
	 *
	 * Extracted when a second reading surface needed it. A STRUCTURE HEADING
	 * can carry the same apparatus a paragraph can — the CCC's EN mirror
	 * prints a `<sup>` reference on two of its headings, sourcing the phrase
	 * each one quotes (docs/corpus-schema.md, "A heading can carry citations")
	 * — and `HeadingText` renders it, so the marker, the button, the boxed
	 * disclosure and the three ways a citation can be empty now have one owner
	 * instead of a copy per surface.
	 *
	 * THE OPEN STATE IS THE CALLER'S, not this component's. `CccParagraphText`
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
		open: boolean;
		onToggle: () => void;
	}

	let { marker, citation, lang, open, onToggle }: Props = $props();
</script>

<sup class="citation-marker">
	<button type="button" class="citation-trigger" aria-expanded={open} onclick={onToggle}>
		{marker}
	</button>
</sup>
{#if open}
	<span class="citation-text">
		{#if citation && citation.text.trim() !== ''}
			<RefText text={citation.text} {lang} />
		{:else if citation}
			<!-- Deliberately empty source: a handful of citations in the Vatican II
			     corpus point at a footnote-list entry that is itself
			     missing/truncated in the source page, not a parsing failure
			     (docs/research/vatican-documents.md §6, "Known source defects" — 4
			     confirmed cases). No fabricated text to show, so say so rather than
			     rendering a dead-looking empty box. -->
			<span class="citation-empty">{t('citation.unavailable')}</span>
		{:else}
			{marker}
		{/if}
	</span>
{/if}

<style>
	/* `.citation-marker` and `.citation-trigger` are global (app.css), shared
	   with `PrayerMystery`. The boxed disclosure below is not: PrayerMystery
	   has its own, unboxed `.citation-text` — a mystery's citation is always
	   visible rather than disclosed — so the name is already taken there and
	   the treatments genuinely differ. It lives here, with the button it
	   belongs to. */
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
