<script lang="ts">
	/**
	 * Renders the corpus's inline markup where the text is NOT interactive —
	 * headings and table-of-contents rows.
	 *
	 * `ProseBlocks` has its own use of the same walk (`InlineNodes`) and
	 * this passes it neither `hrefFor` nor `marker`: body prose additionally
	 * linkifies scripture mentions and turns `<sup data-fn>` into a citation
	 * disclosure button, neither of which belongs in a heading (a heading is a
	 * link target itself, and nesting a button inside one is invalid). What is
	 * shared is `parseInlineHtml`, which is where the markup rules actually
	 * live, and `InlineNodes`, which is where the walk over them lives; this
	 * file only decides that neither extra is wanted here.
	 */
	import type { InlineNode } from '$lib/inline-html';
	import InlineNodes from './InlineNodes.svelte';

	let { nodes }: { nodes: InlineNode[] } = $props();
</script>

<InlineNodes {nodes} />
