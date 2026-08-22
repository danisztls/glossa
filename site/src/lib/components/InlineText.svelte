<script lang="ts">
	/**
	 * Renders the corpus's inline markup where the text is NOT interactive —
	 * headings and table-of-contents rows.
	 *
	 * `CccParagraphText` has its own walk over the same node type and this is
	 * deliberately not shared with it: body prose additionally linkifies
	 * scripture mentions and turns `<sup data-fn>` into a citation disclosure
	 * button, neither of which belongs in a heading (a heading is a link
	 * target itself, and nesting a button inside one is invalid). What is
	 * shared is `parseInlineHtml`, which is where the markup rules actually
	 * live; this file only decides how the nodes are printed.
	 */
	import type { InlineNode } from '$lib/inline-html';
	import Self from './InlineText.svelte';

	let { nodes }: { nodes: InlineNode[] } = $props();
</script>

{#each nodes as node}{#if node.kind === 'text'}{node.text}{:else if node.kind === 'break'}<br
		/>{:else if node.kind === 'emphasis'}{#if node.tag === 'i'}<em
				><Self nodes={node.children} /></em
			>{:else if node.tag === 'b'}<strong><Self nodes={node.children} /></strong>{:else}<sup
				><Self nodes={node.children} /></sup
			>{/if}{/if}{/each}
