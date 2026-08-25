<!--
	The one recursive walk over `InlineNode[]` (`$lib/inline-html.ts`), shared
	by every caller that renders the corpus's inline markup: `InlineText`
	(headings, TOC rows — no links, no markers), `InlineProse` (scripture
	links), `SummaDivisions` (scripture links, plus stripping CCEL's brackets
	from text inside a `summa` self-citation), `CccParagraphText` (scripture
	links, plus footnote-marker disclosures and a drop cap). The four used to
	each carry their own copy of this walk and had already drifted in small
	ways — this is where the markup rules become rendering ONCE.

	Nothing here emits an HTML string — see `inline-html.ts`'s docblock for why
	the markup is walked (a `<sup data-fn>` has to become a disclosure button,
	a reference has to be findable in the flattened text, a drop cap needs the
	first letter of the first run) rather than pasted into `{@html}`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { InlineNode } from '$lib/inline-html';
	import type { RefSegment } from '$lib/refs-grammar';

	interface Props {
		nodes: InlineNode[];
		/** Resolve a `ref` node to an href. Omit for non-interactive text
		 *  (headings): a ref then renders its children as plain text rather
		 *  than a link, because a heading is itself a link target and nesting
		 *  an anchor inside one would be invalid. */
		hrefFor?: (seg: RefSegment) => string | undefined;
		/** Transform a text run, given the kind of ref node it is enclosed in,
		 *  if any. `SummaDivisions` passes `summaRefLabel` for text inside a
		 *  `summa` self-citation, to drop CCEL's own bracket markup; everyone
		 *  else leaves the run as printed. */
		text?: (text: string, within?: RefSegment['kind']) => string;
		/** Render a footnote marker. Omit to render nothing for one —
		 *  `InlineText` and `InlineProse` never see any (headings carry no
		 *  apparatus, and a caller that wants footnotes uses
		 *  `CccParagraphText`, which supplies this). */
		marker?: Snippet<[marker: string, seq: number]>;
	}

	let { nodes, hrefFor, text, marker }: Props = $props();
</script>

{#snippet walk(items: InlineNode[], within?: RefSegment['kind'])}
	{#each items as node, k (k)}
		{#if node.kind === 'text'}
			{text ? text(node.text, within) : node.text}
		{:else if node.kind === 'ref'}
			{@const href = hrefFor?.(node.seg)}
			<!-- A reference split across an emphasis boundary (`<i>Ezek </i>47:7`)
			     arrives as two adjacent `ref` nodes sharing one segment — each
			     keeps its own emphasis and they render as touching links, which is
			     right both visually and semantically. See `linkifyInline`. -->
			{#if href}<a class="inline-ref" {href}>{@render walk(node.children, node.seg.kind)}</a
				>{:else}{@render walk(node.children, hrefFor ? node.seg.kind : within)}{/if}
		{:else if node.kind === 'break'}
			<br />
		{:else if node.kind === 'emphasis'}
			{#if node.tag === 'i'}<em>{@render walk(node.children, within)}</em
				>{:else if node.tag === 'b'}<strong>{@render walk(node.children, within)}</strong
				>{:else}<sup>{@render walk(node.children, within)}</sup>{/if}
		{:else if marker}
			{@render marker(node.marker, node.seq)}
		{/if}
	{/each}
{/snippet}

{@render walk(nodes)}

<style>
	/*
	 * A REFERENCE LINKIFIED OUT OF RUNNING PROSE — the quiet treatment, shared
	 * by every caller that emits one. The underline marks it, the colour stays
	 * the sentence's until hover, because these appear several to a paragraph
	 * and a coloured link each time would speckle the page. Used to be a
	 * global rule in `app.css`, kept in sync by hand across three separately
	 * drifting components (one had lost the hover/focus pair); now there is
	 * one caller that emits `.inline-ref` at all, so there is nothing left to
	 * keep in sync.
	 */
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
