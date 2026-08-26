<script lang="ts">
	/**
	 * Renders a Compendium question's answer blocks (prose | quote, optional
	 * attribution) — the same block model as `ProseBlocks.svelte`, but
	 * simpler: Compendium answers carry plain `text` with no `⟦marker⟧`
	 * footnote tokens (docs/corpus-schema.md "Compendium — questions.json"),
	 * so there's no marker-splitting or citation lookup to do here, just
	 * block-kind formatting.
	 *
	 * IT STILL HAS AN APPARATUS, and that is the part this got wrong until
	 * 2026-08-26. Having no footnotes is not the same as naming no sources:
	 * the Compendium prints its locators in the sentence, in every edition
	 * ("the fruit of the Spirit" (Galatians 5:22)), and 1,436 of them across
	 * the ten editions rendered as inert text because "no apparatus to look
	 * up" was read as "nothing to linkify". `linkifyProse` is exactly the
	 * grammar for a reference that arrives inside running prose rather than
	 * as a citation string.
	 */
	import type { CompendiumBlock } from '$lib/types';
	import { linkifyInline, plainTextNodes } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import InlineNodes from './InlineNodes.svelte';

	interface Props {
		blocks: CompendiumBlock[];
		/** Bare content language the answer is being read in — picks the book
		    table `linkifyProse` reads its locators with. */
		lang: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it, and no Compendium edition is one of them — it is
		    threaded because the grammar takes it and a caller that drops it is
		    the reason a work ever reads wrong. */
		work?: string;
	}

	let { blocks, lang, work }: Props = $props();

	function nodesFor(block: CompendiumBlock) {
		return linkifyInline(plainTextNodes(block.text), (text) => linkifyProse(text, { lang, work }));
	}

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}
</script>

{#each blocks as block, i (i)}
	{#if block.kind === 'quote'}
		<blockquote class="compendium-quote">
			<p><InlineNodes nodes={nodesFor(block)} {hrefFor} /></p>
			{#if block.attribution}
				<footer>{block.attribution}</footer>
			{/if}
		</blockquote>
	{:else}
		<p class="compendium-prose"><InlineNodes nodes={nodesFor(block)} {hrefFor} /></p>
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
