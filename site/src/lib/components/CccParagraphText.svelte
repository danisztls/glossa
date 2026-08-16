<script lang="ts">
	import type { CccParagraph } from '$lib/types';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import RefText from '$lib/components/RefText.svelte';

	interface Props {
		paragraph: CccParagraph;
		/** Bare content language ('en' | 'pt') the paragraph is being read in — picks the citation grammar in `$lib/refs.ts` (e.g. PT's ':'-vs-','  chapter/verse separator, its own book-abbreviation table). */
		lang: string;
	}

	let { paragraph, lang }: Props = $props();

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
			{@const href = refHref(seg, { bibleWorkId: content.workIdFor('bible') })}
			{#if href}
				<a class="inline-ref" {href}>{seg.raw}</a>
			{:else}
				{seg.raw}
			{/if}
		{/if}
	{/each}
{/snippet}

{#snippet markedText(textMarked: string)}
	{#each splitMarked(textMarked) as seg}
		{#if seg.marker}
			{@const citation = citationFor(seg.marker)}
			<sup class="citation-marker">
				<details>
					<summary>{seg.marker}</summary>
					<span class="citation-text">
						{#if citation}
							<RefText text={citation.text} {lang} />
						{:else}
							{seg.marker}
						{/if}
					</span>
				</details>
			</sup>
		{:else}
			{@render prose(seg.text)}
		{/if}
	{/each}
{/snippet}

{#each paragraph.blocks as block (block.text_marked)}
	{#if block.kind === 'quote'}
		<blockquote class="ccc-quote">
			<p>{@render markedText(block.text_marked)}</p>
			{#if block.attribution}
				<footer>{block.attribution}</footer>
			{/if}
		</blockquote>
	{:else}
		<p class="ccc-prose">{@render markedText(block.text_marked)}</p>
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

	.citation-marker {
		font-size: 0.7em;
	}

	.citation-marker details {
		display: inline;
	}

	.citation-marker summary {
		display: inline;
		cursor: pointer;
		color: var(--color-accent);
		list-style: none;
	}

	.citation-marker summary::-webkit-details-marker {
		display: none;
	}

	.citation-marker .citation-text {
		display: block;
		font-size: 1.1em;
		font-style: normal;
		color: var(--color-text-muted);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		padding: 0.35rem 0.5rem;
		margin-top: 0.25rem;
	}
</style>
