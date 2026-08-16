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

	interface Props {
		blocks: PrayerBlock[];
	}

	let { blocks }: Props = $props();
</script>

{#each blocks as block, i (i)}
	{#if block.kind === 'versicle' || block.kind === 'response'}
		<p class="prayer-line" class:prayer-versicle={block.kind === 'versicle'}>
			{#if block.label}<span class="prayer-line-label">{block.label}</span>{/if}
			<span class="prayer-line-text">{block.text}</span>
		</p>
	{:else}
		<p class="prayer-prose">{block.text}</p>
	{/if}
{/each}

<style>
	.prayer-prose {
		margin: 0 0 1rem;
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
