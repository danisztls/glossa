<script lang="ts">
	import type { CccBlock, CccCitation } from '$lib/types';
	import { parseInlineHtml, linkifyInline, type InlineNode } from '$lib/inline-html';
	import { SvelteSet } from 'svelte/reactivity';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { splitDropCap } from '$lib/dropcap';
	import { content } from '$lib/content.svelte';
	import RefText from '$lib/components/RefText.svelte';
	import CitationDisclosure from '$lib/components/CitationDisclosure.svelte';

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
		// The cap comes off the first TEXT run, not off the block's string:
		// with markup in play the opening may be `<i>Rerum Novarum</i>...`,
		// and slicing the raw markup would put a tag inside the initial.
		const nodes = nodesFor(opening);
		const first = nodes[0];
		if (first?.kind !== 'text') return null;
		const split = splitDropCap(first.text);
		if (split.first === '') return null;
		const rest: InlineNode[] = [{ kind: 'text', text: split.rest }, ...nodes.slice(1)];
		return { ...split, restNodes: rest };
	});
	// A marker has to stay phrasing content: this component is rendered inside
	// prose <p>s.  The previous <sup><details>...</details></sup> looked inline
	// in CSS but was invalid HTML (`details` is flow content), so browsers
	// repaired the DOM by ending the surrounding paragraph at a footnote.
	// Keeping the disclosure state here lets the citation remain a real inline
	// part of the sentence in both the source DOM and the rendered layout.
	let openMarkers = $state(new SvelteSet<string>());

	const MARKER_RE = /⟦([^⟧]+)⟧/g;

	/**
	 * The block as inline nodes.
	 *
	 * `html` is the document corpus's form and carries the source's italics;
	 * `text_marked` is the CCC's and the Compendium's, which have not been
	 * migrated (docs/corpus-schema.md) and have no markup to carry. Both end
	 * up as the same node list so there is ONE render path below rather than
	 * a markup-aware branch and a plain one drifting apart.
	 */
	function nodesFor(block: CccBlock): InlineNode[] {
		if (block.html) return linkifyInline(parseInlineHtml(block.html), proseSegments);
		// Exactly one of the two is present (types.ts, `CccBlock.text_marked`):
		// a shipped document block has `html` and no `text_marked`, the CCC and
		// Compendium the reverse. `?? ''` is the unreachable third case, kept
		// so a block that somehow arrives with neither renders empty instead
		// of throwing inside the render.
		const marked = block.text_marked ?? '';
		const nodes: InlineNode[] = [];
		let lastIndex = 0;
		let seq = 0;
		for (const match of marked.matchAll(MARKER_RE)) {
			const index = match.index ?? 0;
			if (index > lastIndex) {
				nodes.push({ kind: 'text', text: marked.slice(lastIndex, index) });
			}
			nodes.push({ kind: 'marker', marker: match[1], seq: seq++ });
			lastIndex = index + match[0].length;
		}
		if (lastIndex < marked.length) {
			nodes.push({ kind: 'text', text: marked.slice(lastIndex) });
		}
		return nodes;
	}

	function citationFor(marker: string) {
		return paragraph.citations.find((c) => c.marker === marker);
	}

	/**
	 * A citation the SOURCE printed inline, in the running text, rather than
	 * as a numbered note — the Portuguese Catechism types Scripture locators
	 * straight into the sentence ("...até ao fim do mundo» (Mt 28, 19-20).")
	 * where the English edition puts a footnote. `label` carries that
	 * parenthesis verbatim, and it is what the reader sees: turning it into a
	 * superscript number would replace something the source actually prints
	 * with an apparatus it does not have. See `docs/corpus-schema.md` §CCC.
	 */
	function isInline(
		citation: CccCitation | undefined
	): citation is CccCitation & { label: string } {
		return typeof citation?.label === 'string';
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

<!--
  One recursive walk over the block's inline nodes. Emphasis nests, so the
  snippet calls itself; everything else is a leaf. Nothing here emits an HTML
  string — see `$lib/inline-html.ts` for why the markup is walked rather than
  pasted into {@html}.
-->
{#snippet inline(nodes: InlineNode[], blockIndex: number)}
	{#each nodes as node}
		{#if node.kind === 'text'}
			{node.text}
		{:else if node.kind === 'ref'}
			<!-- `linkifyInline` resolved this run to a reference. A citation
			     whose book name is italic and whose numbers are not arrives as
			     two adjacent ref nodes sharing one segment; they render as
			     touching links, each keeping its own emphasis. -->
			{@const href = refHref(node.seg, { bibleWorkId: content.workIdFor('bible'), lang })}
			{#if href}<a class="inline-ref" {href}>{@render inline(node.children, blockIndex)}</a
				>{:else}{@render inline(node.children, blockIndex)}{/if}
		{:else if node.kind === 'break'}
			<br />
		{:else if node.kind === 'emphasis'}
			{#if node.tag === 'i'}<em>{@render inline(node.children, blockIndex)}</em
				>{:else if node.tag === 'b'}<strong>{@render inline(node.children, blockIndex)}</strong
				>{:else}<sup>{@render inline(node.children, blockIndex)}</sup>{/if}
		{:else}
			{@const marker = node.marker}
			<!-- The source can cite the same numbered footnote twice in one
			     paragraph. Keep each disclosure independent, as <details> did. -->
			{@const disclosureKey = `${blockIndex}:${node.seq}`}
			{@const citation = citationFor(marker)}
			{#if isInline(citation)}<RefText text={citation.label} {lang} />{:else}<CitationDisclosure
					{marker}
					{citation}
					{lang}
					open={openMarkers.has(disclosureKey)}
					onToggle={() => toggleCitation(disclosureKey)}
				/>{/if}
		{/if}
	{/each}
{/snippet}

<!-- Keyed by POSITION, not by text. `text_marked` was the key until documents
     started shipping without it (types.ts) — every document block would have
     keyed on `undefined`, and Svelte rejects a duplicate key at runtime, so a
     two-block section would have thrown rather than rendered. Position is the
     right key regardless: a paragraph's blocks are a fixed ordered list that
     is never reordered, inserted into, or filtered. -->
{#each paragraph.blocks as block, blockIndex (blockIndex)}
	{#if block.kind === 'quote'}
		<blockquote class="ccc-quote">
			<p>{@render inline(nodesFor(block), blockIndex)}</p>
			{#if block.attribution}
				<footer>{block.attribution}</footer>
			{/if}
		</blockquote>
	{:else}
		<p class="ccc-prose">
			{#if blockIndex === 0 && cap}<span class="drop-cap-letter"
					>{#if cap.lead}<span class="drop-cap-lead">{cap.lead}</span>{/if}{cap.first}</span
				>{@render inline(cap.restNodes, blockIndex)}{:else}{@render inline(
					nodesFor(block),
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
</style>
