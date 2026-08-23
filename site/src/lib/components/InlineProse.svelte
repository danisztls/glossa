<script lang="ts">
	/**
	 * One paragraph of the corpus's narrowed inline markup, with scripture
	 * references linkified — for prose that carries no footnote apparatus.
	 *
	 * Distinct from `InlineText` (headings, TOC rows: no links at all, because
	 * a heading is itself a link target) and from `CccParagraphText` (which
	 * additionally turns `<sup data-fn>` into a citation disclosure). What all
	 * three share is `parseInlineHtml`, where the markup rules live.
	 */
	import { content } from '$lib/content.svelte';
	import { linkifyInline, parseInlineHtml, type InlineNode } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';

	let { html, lang }: { html: string; lang: string } = $props();

	const nodes = $derived(
		linkifyInline(parseInlineHtml(html), (text: string) => linkifyProse(text, { lang }))
	);

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}
</script>

{#snippet inline(items: InlineNode[])}
	{#each items as node, k (k)}
		{#if node.kind === 'text'}
			{node.text}
		{:else if node.kind === 'ref'}
			{@const href = hrefFor(node.seg)}
			{#if href}<a class="inline-ref" {href}>{@render inline(node.children)}</a
				>{:else}{@render inline(node.children)}{/if}
		{:else if node.kind === 'break'}
			<br />
		{:else if node.kind === 'emphasis'}
			{#if node.tag === 'i'}<em>{@render inline(node.children)}</em
				>{:else if node.tag === 'b'}<strong>{@render inline(node.children)}</strong>{:else}<sup
					>{@render inline(node.children)}</sup
				>{/if}
		{/if}
	{/each}
{/snippet}

<p>{@render inline(nodes)}</p>

<style>
	.inline-ref {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	.inline-ref:hover,
	.inline-ref:focus-visible {
		color: var(--color-link);
		text-decoration-color: currentColor;
	}
</style>
