<script lang="ts">
	/**
	 * Renders a Compendium question's answer blocks (prose | quote, optional
	 * attribution) — the same block model as `CccParagraphText.svelte`, but
	 * simpler: Compendium answers carry plain `text` with no `⟦marker⟧`
	 * footnote tokens (docs/corpus-schema.md "Compendium — questions.json"),
	 * so there's no marker-splitting or citation lookup to do here, just
	 * block-kind formatting.
	 */
	import type { CompendiumBlock } from '$lib/types';

	interface Props {
		blocks: CompendiumBlock[];
	}

	let { blocks }: Props = $props();
</script>

{#each blocks as block, i (i)}
	{#if block.kind === 'quote'}
		<blockquote class="compendium-quote">
			<p>{block.text}</p>
			{#if block.attribution}
				<footer>{block.attribution}</footer>
			{/if}
		</blockquote>
	{:else}
		<p class="compendium-prose">{block.text}</p>
	{/if}
{/each}

<style>
	.compendium-prose {
		margin: 0 0 1rem;
	}

	.compendium-quote {
		margin: 1rem 0;
		padding-inline-start: 1rem;
		border-inline-start: 3px solid var(--color-border);
		font-style: italic;
		color: var(--color-text-muted);
	}

	.compendium-quote p {
		margin: 0;
	}

	.compendium-quote footer {
		margin-top: 0.35rem;
		font-style: normal;
		font-size: max(var(--font-size-min), 0.85em);
	}
</style>
