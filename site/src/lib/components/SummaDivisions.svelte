<!--
	The divisions of a scholastic article, in the order the work prints them.

	These are an ADDRESS SPACE, not a rendering choice: this corpus's own
	footnotes cite `co.` (the body) and `ad 3` (the third reply) as locators,
	which is why the parser keeps them apart instead of flattening the article
	into prose, and why each one carries an id here. Nothing links to those
	ids yet — `refHref` resolves a citation as far as its article — but the
	anchors cost nothing and are what a division-level link would need.

	`preamble` is the one kind that is not Aquinas's and is deliberately
	unlabelled beyond a quiet "Note": it holds the translator's bracketed
	remark that opens 2 articles of 3,113, and giving it a division's heading
	would present an editorial aside as part of the argument.
-->
<script lang="ts">
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { linkifyInline, parseInlineHtml, type InlineNode } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { summaRefLabel } from '$lib/summa-titles';
	import type { SummaDivision } from '$lib/types';

	interface Props {
		divisions: SummaDivision[];
		lang: string;
		/** Prefix for the generated ids, so two articles on one page cannot collide. */
		idPrefix?: string;
	}

	let { divisions, lang, idPrefix = '' }: Props = $props();

	/**
	 * The Summa quotes Scripture constantly and in running prose, so the
	 * markup is WALKED and linkified rather than pasted into `{@html}` — the
	 * same path `CccParagraphText` takes, and for the reason
	 * `inline-html.ts` exists: an emphasis tag is not a word boundary
	 * (docs/decisions.md, 2026-08-22), so a reference split across `<i>` must
	 * still resolve as one reference.
	 *
	 * `linkifyProse`, not `parseRefs`: a division's blocks are prose with
	 * references in them, not citation-shaped strings. That distinction is
	 * `refs.ts`'s, not a new one here.
	 */
	function nodesFor(html: string): InlineNode[] {
		return linkifyInline(parseInlineHtml(html), (text: string) => linkifyProse(text, { lang }));
	}

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}

	function label(division: SummaDivision): string {
		switch (division.kind) {
			case 'objection':
				return `${t('summa.objection')} ${division.n ?? ''}`.trim();
			case 'reply':
				// An unnumbered reply is real: `ad arg.` answers the objections
				// together rather than one by one, and inventing an ordinal for
				// it would make it look like `ad 1` to a reader and to a future
				// citation parser alike.
				return `${t('summa.reply')} ${division.n ?? ''}`.trim();
			case 'sed-contra':
				return t('summa.sedContra');
			case 'corpus':
				return t('summa.corpus');
			case 'preamble':
				return t('summa.preamble');
		}
	}

	/** The locator this division answers to in a citation (`arg. 1`, `co.`). */
	function anchor(division: SummaDivision): string | undefined {
		const suffix =
			division.kind === 'objection'
				? `arg${division.n ?? ''}`
				: division.kind === 'reply'
					? `ad${division.n ?? ''}`
					: division.kind === 'sed-contra'
						? 'sc'
						: division.kind === 'corpus'
							? 'co'
							: undefined;
		return suffix ? `${idPrefix}${suffix}` : undefined;
	}
</script>

<!--
  One recursive walk over each block's inline nodes, the same shape
  `CccParagraphText` uses. Nothing here emits an HTML string.
-->
{#snippet inline(nodes: InlineNode[], within?: string)}
	{#each nodes as node, k (k)}
		{#if node.kind === 'text'}
			{within === 'summa' ? summaRefLabel(node.text) : node.text}
		{:else if node.kind === 'ref'}
			{@const href = hrefFor(node.seg)}
			<!-- A self-citation the CORPUS states, from CCEL's own anchor — see
			     `parseStoredRef`. Its text keeps the edition's words and loses
			     the square brackets that were only ever markup (`summaRefLabel`);
			     an unresolvable one still renders its words, never nothing. -->
			{#if href}<a class="inline-ref" {href}>{@render inline(node.children, node.seg.kind)}</a
				>{:else}{@render inline(node.children, node.seg.kind)}{/if}
		{:else if node.kind === 'break'}
			<br />
		{:else if node.kind === 'emphasis'}
			{#if node.tag === 'i'}<em>{@render inline(node.children, within)}</em
				>{:else if node.tag === 'b'}<strong>{@render inline(node.children, within)}</strong
				>{:else}<sup>{@render inline(node.children, within)}</sup>{/if}
		{/if}
	{/each}
{/snippet}

{#each divisions as division, i (i)}
	<section class="division" class:body={division.kind === 'corpus'} id={anchor(division)}>
		<h3 class="division-label">{label(division)}</h3>
		{#each division.blocks as block, j (j)}
			<p>{@render inline(nodesFor(block.html))}</p>
		{/each}
	</section>
{/each}

<style>
	.division {
		margin: 1.25rem 0;
		scroll-margin-top: 4rem;
	}

	/*
	 * The body of the article is the answer; the objections and replies argue
	 * around it. A left rule marks it without shouting — the reader's eye
	 * should be able to find "I answer that" in a long article at a glance,
	 * which is how the work is actually read.
	 */
	.division.body {
		border-left: 2px solid var(--color-border);
		padding-left: 1rem;
	}

	/* The division's NAME is chrome, not text — it is ours, not the source's
	   ("Objection 2", "I answer that"). Held in the sans face explicitly so it
	   stays chrome now that this component renders inside `.reading-text`,
	   whose serif face and reader-adjustable size govern the prose beneath. */
	.division-label {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0 0 0.35rem;
		font-weight: 600;
	}

	.division p {
		margin: 0 0 0.6rem;
	}

	/* Same quiet treatment as `RefText`'s links: the underline marks it, the
	   colour stays the text's until hover. */
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
