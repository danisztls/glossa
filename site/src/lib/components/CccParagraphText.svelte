<script lang="ts">
	import type { CccParagraph } from '$lib/types';

	interface Props {
		paragraph: CccParagraph;
	}

	let { paragraph }: Props = $props();

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
</script>

{#each paragraph.blocks as block (block.text_marked)}
	{#if block.kind === 'quote'}
		<blockquote class="ccc-quote">
			<p>
				{#each splitMarked(block.text_marked) as seg}
					{#if seg.marker}
						{@const citation = citationFor(seg.marker)}
						<sup class="citation-marker">
							<details>
								<summary>{seg.marker}</summary>
								<span class="citation-text">{citation?.text ?? seg.marker}</span>
							</details>
						</sup>
					{:else}
						{seg.text}
					{/if}
				{/each}
			</p>
			{#if block.attribution}
				<footer>{block.attribution}</footer>
			{/if}
		</blockquote>
	{:else}
		<p class="ccc-prose">
			{#each splitMarked(block.text_marked) as seg}
				{#if seg.marker}
					{@const citation = citationFor(seg.marker)}
					<sup class="citation-marker">
						<details>
							<summary>{seg.marker}</summary>
							<span class="citation-text">{citation?.text ?? seg.marker}</span>
						</details>
					</sup>
				{:else}
					{seg.text}
				{/if}
			{/each}
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
