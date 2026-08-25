<!--
	Renders a prayer's flowing text — one `PrayerBlock[]` array, `prose` |
	`versicle` | `response` (types.ts). The same component renders a
	vernacular prayer's `blocks`, one of its `variants[].blocks`, and its
	`latin.blocks` — all three are the identical shape, so there is exactly
	one renderer rather than three near-duplicates.

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
	import { parseInlineHtml } from '$lib/inline-html';

	interface Props {
		blocks: PrayerBlock[];
	}

	let { blocks }: Props = $props();

	/**
	 * A block's printed lines, or its collapsed `text` when it prints on one.
	 *
	 * `InlineText`, not `InlineProse`: a prayer's lines carry `<br>` and
	 * nothing else (measured across the source's whole prayer region), and
	 * the one thing `InlineProse` adds is linkifying scripture references out
	 * of running prose -- which a prayer does not contain and which would
	 * turn "and lead us not into temptation" into a hunt for citations that
	 * are not there. The Rosary's meditations DO carry sourced locators, and
	 * those are `PrayerMystery`'s, not this component's.
	 */
	function nodes(block: PrayerBlock) {
		return parseInlineHtml(block.html ?? escapeText(block.text));
	}

	/* `text` is plain text, so it has to be escaped before it can be parsed
	   as the narrow markup -- a prayer that printed an ampersand would
	   otherwise arrive as a broken entity. */
	function escapeText(text: string): string {
		return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

{#each blocks as block, i (i)}
	{#if block.kind === 'versicle' || block.kind === 'response'}
		<p class="prayer-line" class:prayer-versicle={block.kind === 'versicle'}>
			{#if block.label}<span class="prayer-line-label">{block.label}</span>{/if}
			<span class="prayer-line-text"><InlineText nodes={nodes(block)} /></span>
		</p>
	{:else}
		<p class="prayer-prose"><InlineText nodes={nodes(block)} /></p>
	{/if}
{/each}

<style>
	/*
	 * A prayer is set as verse, so a block's own line breaks are now kept
	 * (`PrayerBlock.html`) and this paragraph has to distinguish two things
	 * that would otherwise look identical: a line the SOURCE broke, and a
	 * line the VIEWPORT broke. The hanging indent does it -- a wrapped
	 * continuation sits in from the margin, a real new line starts at it --
	 * which is how a printed missal or hymnal sets the same text, and it
	 * costs nothing on the prayers that are genuinely one run of prose,
	 * where nothing wraps far enough to indent.
	 */
	.prayer-prose {
		margin: 0 0 1rem;
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

	/* The hanging indent belongs to the TEXT column of a dialogic line, not
	   to the row: the label already sits in its own fixed column, and
	   indenting the flex row would push the label out of alignment with the
	   ones above and below it. */
	.prayer-line-text {
		text-indent: -1.15em;
		padding-inline-start: 1.15em;
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
