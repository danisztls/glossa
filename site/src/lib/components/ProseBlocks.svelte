<script lang="ts">
	import type { CccBlock, CccCitation } from '$lib/types';
	import {
		parseInlineHtml,
		parseInlineMarked,
		linkifyInline,
		type InlineNode
	} from '$lib/inline-html';
	import { SvelteSet } from 'svelte/reactivity';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { splitDropCap } from '$lib/dropcap';
	import { content } from '$lib/content.svelte';
	import RefText from '$lib/components/RefText.svelte';
	import CitationDisclosure from '$lib/components/CitationDisclosure.svelte';
	import InlineNodes from '$lib/components/InlineNodes.svelte';

	/**
	 * ONE READING UNIT'S BLOCKS — deliberately narrower than any of the four
	 * types that have one. A CCC paragraph, a Compendium question's answer, a
	 * document's `DocumentSection` (docs/corpus-schema.md §Documents) and a
	 * Summa division all carry the identical wire shape for `blocks` and
	 * `citations`: a document's `sections.json` reuses the CCC's block model
	 * verbatim, and a division's blocks are the `html`-only subset of it.
	 * Structural typing means all of them satisfy this without a cast, which
	 * is why this component is genuinely shared rather than similar-looking
	 * duplicated markup.
	 *
	 * `unit`, not `paragraph`, and `ProseBlocks`, not `CccParagraphText`: it
	 * was named for the first type that used it and outgrew that name twice —
	 * once when the documents arrived, once when `SummaDivisions` stopped
	 * carrying its own copy of this walk.
	 *
	 * A caller with no apparatus passes `citations: []` — `blocks` then carry
	 * no markers to look up, so nothing here goes hunting through an empty
	 * array.
	 */
	interface Props {
		unit: { blocks: CccBlock[]; citations: CccCitation[] };
		/** Bare content language ('en' | 'pt') the unit is being read in — picks the citation grammar in `$lib/refs.ts` (e.g. PT's ':'-vs-','  chapter/verse separator, its own book-abbreviation table). */
		lang: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it — English works that number the books of Kings
		    the Douay way — and passing nothing reads the work as its language
		    reads. */
		work?: string;
		/** Set an illuminated initial on the opening block. The caller decides — it is the one that knows this unit opens a chapter or a document, which this component cannot see. */
		dropCap?: boolean;
	}

	let { unit, lang, work, dropCap = false }: Props = $props();

	/**
	 * The opening of the first block, split into the pieces app.css's
	 * `.drop-cap-letter` / `.drop-cap-lead` need. Null whenever no cap is
	 * warranted, which `splitDropCap` decides for the text and this decides for
	 * the block: a `quote` block is already set off in its own indented,
	 * italic blockquote, and a drop cap inside that reads as a second opening
	 * rather than the paragraph's. Three CCC paragraphs open on one.
	 */
	const cap = $derived.by(() => {
		const opening = unit.blocks[0];
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
		// Exactly one of the two is present (types.ts, `CccBlock.text_marked`):
		// a shipped document block has `html` and no `text_marked`, the CCC and
		// Compendium the reverse. `?? ''` is the unreachable third case, kept
		// so a block that somehow arrives with neither renders empty instead
		// of throwing inside the render.
		//
		// PARSE, THEN LINKIFY -- both branches, which is why they are written
		// as one line each. Splitting the marker walk out into `parseInlineMarked`
		// is what makes that visible: while it was inlined here, this branch
		// returned its nodes without the linkify step and the Catechism drew
		// none of the references its prose names. Nothing caught it, because
		// `reference-coverage.mjs` and `build-xrefs.mjs` call `linkifyProse`
		// themselves -- the coverage table and the scripture index went on
		// counting what the page had stopped drawing.
		const parsed = block.html
			? parseInlineHtml(block.html)
			: parseInlineMarked(block.text_marked ?? '');
		return linkifyInline(parsed, proseSegments);
	}

	function citationFor(marker: string) {
		return unit.citations.find((c) => c.marker === marker);
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
		return linkifyProse(text, { lang, work });
	}

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}
</script>

<!-- Keyed by POSITION, not by text. `text_marked` was the key until documents
     started shipping without it (types.ts) — every document block would have
     keyed on `undefined`, and Svelte rejects a duplicate key at runtime, so a
     two-block section would have thrown rather than rendered. Position is the
     right key regardless: a unit's blocks are a fixed ordered list that
     is never reordered, inserted into, or filtered. -->
{#each unit.blocks as block, blockIndex (blockIndex)}
	<!-- The source can cite the same numbered footnote twice in one paragraph;
	     the key stays independent per occurrence, as <details> did. Declared
	     per block so it closes over `blockIndex` — `InlineNodes`'s `marker`
	     snippet is `Snippet<[marker, seq]>` only, with no block of its own. -->
	{#snippet marker(marker: string, seq: number)}
		{@const disclosureKey = `${blockIndex}:${seq}`}
		{@const citation = citationFor(marker)}
		{#if isInline(citation)}<RefText
				text={citation.label}
				{lang}
				{work}
			/>{:else}<CitationDisclosure
				{marker}
				{citation}
				{lang}
				{work}
				open={openMarkers.has(disclosureKey)}
				onToggle={() => toggleCitation(disclosureKey)}
			/>{/if}
	{/snippet}
	{#if block.kind === 'quote'}
		<blockquote class="prose-quote">
			<p><InlineNodes nodes={nodesFor(block)} {hrefFor} {marker} /></p>
			{#if block.attribution}
				<footer>{block.attribution}</footer>
			{/if}
		</blockquote>
	{:else}
		<p class="prose-block">
			{#if blockIndex === 0 && cap}<span class="drop-cap-letter"
					>{#if cap.lead}<span class="drop-cap-lead">{cap.lead}</span>{/if}{cap.first}</span
				><InlineNodes nodes={cap.restNodes} {hrefFor} {marker} />{:else}<InlineNodes
					nodes={nodesFor(block)}
					{hrefFor}
					{marker}
				/>{/if}
		</p>
	{/if}
{/each}

<style>
	/*
	 * The gap between blocks is the CALLER'S, because it is a statement about
	 * what surrounds them: a CCC paragraph and a document section sit alone
	 * under their own number and get the full rem, while a Summa division's
	 * blocks are consecutive paragraphs of one argument, set tighter so that
	 * the 1.25rem between divisions still reads as the larger break. Passed as
	 * a custom property rather than a class prop because a scoped `.division p`
	 * rule cannot reach into this component at all — which is what would have
	 * silently swallowed the Summa's tighter setting when it moved here.
	 */
	.prose-block {
		margin: 0 0 var(--prose-block-gap, 1rem);
	}

	.prose-quote {
		margin: 1rem 0;
		padding-inline-start: 1rem;
		border-inline-start: 3px solid var(--color-border);
		font-style: italic;
		color: var(--color-text-muted);
	}

	.prose-quote p {
		margin: 0;
	}

	.prose-quote footer {
		margin-top: 0.35rem;
		font-style: normal;
		font-size: 0.85rem;
	}
</style>
