<!--
	Renders a prayer's flowing text — one `PrayerBlock[]` array, `prose` |
	`versicle` | `response` (types.ts). The same component renders a
	vernacular prayer's `blocks`, the Rosary's `instructions.blocks`, and a
	Latin companion's — all the identical shape, so there is exactly one
	renderer rather than three near-duplicates.

	THE LABEL IS VERBATIM SOURCE TEXT, RENDERED AS PRINTED, NEVER REGENERATED
	FROM THE BLOCK KIND: a `versicle` block doesn't imply "V." — most sources
	print that, but PT's own Angelus and Rosary-closing dialogue print "D."/
	"C." for the identical leader/assembly roles (docs/corpus-schema.md
	"Prayers"). Synthesizing a label from `block.kind` would silently erase
	that real difference between how each source page typesets the same
	prayer; `block.label` is shown exactly as the corpus stored it instead.

	NOT `aria-hidden` on the label: unlike a decorative bullet or rule, "V."/
	"R." is content a reader following along in a missal expects to hear
	announced, the same way the label is expected to be SEEN in print — so a
	screen reader gets it too, read inline before the line it prefixes.
-->
<script lang="ts">
	import type { PrayerBlock } from '$lib/types';
	import InlineText from './InlineText.svelte';
	import { parseInlineHtml, splitLines, type InlineNode } from '$lib/inline-html';

	interface Props {
		blocks: PrayerBlock[];
	}

	let { blocks }: Props = $props();

	/**
	 * A block's printed lines — one entry per line the SOURCE broke, which for
	 * a block that prints on one line is a single entry.
	 *
	 * `InlineText`, not `InlineProse`: a prayer's lines carry `<br>` and
	 * nothing else (measured across the source's whole prayer region), and
	 * the one thing `InlineProse` adds is linkifying scripture references out
	 * of running prose -- which a prayer does not contain and which would
	 * turn "and lead us not into temptation" into a hunt for citations that
	 * are not there. The Rosary's meditations DO carry sourced locators, and
	 * those are `PrayerMystery`'s, not this component's.
	 */
	function lines(block: PrayerBlock): InlineNode[][] {
		return splitLines(parseInlineHtml(block.html ?? escapeText(block.text)));
	}

	/* `text` is plain text, so it has to be escaped before it can be parsed
	   as the narrow markup -- a prayer that printed an ampersand would
	   otherwise arrive as a broken entity. */
	function escapeText(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

<!--
	A block's body. VERSE AND PROSE ARE SET DIFFERENTLY, and which one a block
	is is not a field on it — it is whether the source broke the block into
	lines. A block with lines gets each of them as its own hanging-indent
	block, so every line the source printed starts at the margin and only a
	line the viewport broke sits in from it; a block the source printed as one
	run gets no wrapper and no indent, because there are no source lines for a
	wrap to be confused with and indenting every continuation of a prose
	paragraph would be setting the Memorare as if it were a hymn.
-->
{#snippet body(ls: InlineNode[][])}
	{#if ls.length > 1}
		{#each ls as line, i (i)}<span class="prayer-verse-line"><InlineText nodes={line} /></span
			>{/each}
	{:else}
		<InlineText nodes={ls[0] ?? []} />
	{/if}
{/snippet}

{#each blocks as block, i (i)}
	{#if block.kind === 'versicle' || block.kind === 'response'}
		<p class="prayer-line" class:prayer-versicle={block.kind === 'versicle'}>
			{#if block.label}<span class="prayer-line-label">{block.label}</span>{/if}
			<span class="prayer-line-text">{@render body(lines(block))}</span>
		</p>
	{:else}
		<p class="prayer-prose">{@render body(lines(block))}</p>
	{/if}
{/each}

<style>
	.prayer-prose {
		margin: 0 0 1rem;
	}

	/*
	 * ONE LINE THE SOURCE PRINTED, hanging so that a line the viewport breaks
	 * is visibly a continuation and not a new verse -- which is how a printed
	 * missal or hymnal sets the same text, and the distinction the block's own
	 * `<br>`s would otherwise lose. `display: block` rather than a real block
	 * element because these sit inside a `<p>` and inside the text column of a
	 * dialogic line, neither of which may contain one.
	 */
	.prayer-verse-line {
		display: block;
		text-indent: -1.15em;
		padding-inline-start: 1.15em;
	}

	/* Versicle/response set as a hanging-label line -- the label sits in its
	   own fixed-width column so a run of several V./R. pairs (the Angelus)
	   lines up as a dialogue rather than reading as an inline abbreviation
	   glued to each line's first word. */
	.prayer-line {
		display: flex;
		gap: 0.6em;
		margin: 0 0 0.4rem;
	}

	/* The text column is what carries the lines; the row must not, because the
	   label already sits in its own fixed column and indenting the flex row
	   would push it out of alignment with the ones above and below it. */
	.prayer-line-text {
		min-width: 0;
	}

	.prayer-line-label {
		flex-shrink: 0;
		width: 1.6em;
		font-family: var(--font-sans);
		font-weight: 700;
		color: var(--color-text-muted);
	}

	/* The versicle (leader's line) is set slightly muted against the
	   response (the assembly's reply) -- a plain-text way to distinguish the
	   two voices for a sighted reader without inventing a color that isn't
	   one of the theme tokens. */
	.prayer-versicle .prayer-line-text {
		color: var(--color-text-muted);
	}
</style>
