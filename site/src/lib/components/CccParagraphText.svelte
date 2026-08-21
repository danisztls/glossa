<script lang="ts">
	import type { CccBlock, CccCitation } from '$lib/types';
	import { SvelteSet } from 'svelte/reactivity';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { splitDropCap } from '$lib/dropcap';
	import { content } from '$lib/content.svelte';
	import RefText from '$lib/components/RefText.svelte';
	import { t } from '$lib/i18n.svelte';

	/**
	 * Deliberately narrower than `CccParagraph`: only `blocks`/`citations` are
	 * read below, and both a CCC paragraph and a document's `DocumentSection`
	 * (docs/corpus-schema.md §Documents) carry the identical wire shape for
	 * both fields — a document's `sections.json` reuses the CCC's block model
	 * verbatim. Structural typing means both satisfy this without a cast:
	 * this component is genuinely shared between `/catechismus/[n]` and
	 * `/documents/{slug}/{n}`, not merely similar-looking duplicated markup.
	 */
	interface Props {
		paragraph: { blocks: CccBlock[]; citations: CccCitation[] };
		/** Bare content language ('en' | 'pt') the paragraph is being read in — picks the citation grammar in `$lib/refs.ts` (e.g. PT's ':'-vs-','  chapter/verse separator, its own book-abbreviation table). */
		lang: string;
		/** Set an illuminated initial on the opening block. The caller decides — it is the one that knows this paragraph opens a chapter or a document, which this component cannot see. */
		dropCap?: boolean;
	}

	let { paragraph, lang, dropCap = false }: Props = $props();

	/**
	 * The opening of the first block, split into the pieces app.css's
	 * `.drop-cap-letter` / `.drop-cap-lead` need. Null whenever no cap is
	 * warranted, which `splitDropCap` decides for the text and this decides for
	 * the block: a `quote` block is already set off in its own indented,
	 * italic blockquote, and a drop cap inside that reads as a second opening
	 * rather than the paragraph's. Three CCC paragraphs open on one.
	 */
	const cap = $derived.by(() => {
		const opening = paragraph.blocks[0];
		if (!dropCap || !opening || opening.kind === 'quote') return null;
		const split = splitDropCap(opening.text_marked);
		return split.first === '' ? null : split;
	});
	// A marker has to stay phrasing content: this component is rendered inside
	// prose <p>s.  The previous <sup><details>...</details></sup> looked inline
	// in CSS but was invalid HTML (`details` is flow content), so browsers
	// repaired the DOM by ending the surrounding paragraph at a footnote.
	// Keeping the disclosure state here lets the citation remain a real inline
	// part of the sentence in both the source DOM and the rendered layout.
	let openMarkers = $state(new SvelteSet<string>());

	const MARKER_RE = /⟦([^⟧]+)⟧/g;

	interface Segment {
		text: string;
		marker?: string;
	}

	function splitMarked(textMarked: string): Segment[] {
		const segments: Segment[] = [];
		let lastIndex = 0;
		for (const match of textMarked.matchAll(MARKER_RE)) {
			const index = match.index ?? 0;
			if (index > lastIndex) {
				segments.push({ text: textMarked.slice(lastIndex, index) });
			}
			segments.push({ text: '', marker: match[1] });
			lastIndex = index + match[0].length;
		}
		if (lastIndex < textMarked.length) {
			segments.push({ text: textMarked.slice(lastIndex) });
		}
		return segments;
	}

	function citationFor(marker: string) {
		return paragraph.citations.find((c) => c.marker === marker);
	}

	function toggleCitation(marker: string) {
		if (openMarkers.has(marker)) openMarkers.delete(marker);
		else openMarkers.add(marker);
	}

	/**
	 * In-prose "cf. 1212" / "cf. Jn 3:16" mentions inside the CCC's own body
	 * text (docs/link-surface.md #3) are a different grammar from a footnote
	 * citation string: `linkifyProse` scans conservatively for an explicit
	 * "cf." trigger inside otherwise-ordinary running prose, whereas
	 * `parseRefs` (what `RefText` renders — see `$lib/refs.ts`'s module
	 * docblock) assumes the *whole* string is citation-shaped, which real
	 * paragraph prose is not. Rendered by hand below rather than through
	 * `RefText` for that reason; `refHref` (the same link-resolution
	 * `RefText` uses internally) keeps the actual URL logic in one place.
	 */
	function proseSegments(text: string): RefSegment[] {
		return linkifyProse(text, { lang });
	}
</script>

{#snippet prose(text: string)}
	{#each proseSegments(text) as seg}
		{#if seg.kind === 'text'}
			{seg.text}
		{:else}
			{@const href = refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang })}
			{#if href}
				<a class="inline-ref" {href}>{seg.raw}</a>
			{:else}
				{seg.raw}
			{/if}
		{/if}
	{/each}
{/snippet}

{#snippet markedText(textMarked: string, blockIndex: number)}
	{#each splitMarked(textMarked) as seg, markerIndex}
		{#if seg.marker}
			{@const marker = seg.marker}
			<!-- The source can cite the same numbered footnote twice in one
			     paragraph. Keep each disclosure independent, as <details> did. -->
			{@const disclosureKey = `${blockIndex}:${markerIndex}`}
			{@const citation = citationFor(marker)}
			<sup class="citation-marker">
				<button
					type="button"
					class="citation-trigger"
					aria-expanded={openMarkers.has(disclosureKey)}
					onclick={() => toggleCitation(disclosureKey)}
				>
					{citation?.number ?? marker}
				</button>
			</sup>
			{#if openMarkers.has(disclosureKey)}
				<span class="citation-text">
					{#if citation && citation.text.trim() !== ''}
						<RefText text={citation.text} {lang} />
					{:else if citation}
						<!-- Deliberately empty source: a handful of citations in the
						     Vatican II corpus point at a footnote-list entry that is
						     itself missing/truncated in the source page, not a parsing
						     failure (docs/research/vatican-documents.md §6, "Known
						     source defects" — 4 confirmed cases). No fabricated text
						     to show, so say so rather than rendering a dead-looking
						     empty box. -->
						<span class="citation-empty">{t('citation.unavailable')}</span>
					{:else}
						{marker}
					{/if}
				</span>
			{/if}
		{:else}
			{@render prose(seg.text)}
		{/if}
	{/each}
{/snippet}

{#each paragraph.blocks as block, blockIndex (block.text_marked)}
	{#if block.kind === 'quote'}
		<blockquote class="ccc-quote">
			<p>{@render markedText(block.text_marked, blockIndex)}</p>
			{#if block.attribution}
				<footer>{block.attribution}</footer>
			{/if}
		</blockquote>
	{:else}
		<p class="ccc-prose">
			{#if blockIndex === 0 && cap}<span class="drop-cap-letter"
					>{#if cap.lead}<span class="drop-cap-lead">{cap.lead}</span>{/if}{cap.first}</span
				>{@render markedText(cap.rest, blockIndex)}{:else}{@render markedText(
					block.text_marked,
					blockIndex
				)}{/if}
		</p>
	{/if}
{/each}

<style>
	.ccc-prose {
		margin: 0 0 1rem;
	}

	.ccc-quote {
		margin: 1rem 0;
		padding-inline-start: 1rem;
		border-inline-start: 3px solid var(--color-border);
		font-style: italic;
		color: var(--color-text-muted);
	}

	.ccc-quote p {
		margin: 0;
	}

	.ccc-quote footer {
		margin-top: 0.35rem;
		font-style: normal;
		font-size: 0.85rem;
	}

	.inline-ref {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
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
