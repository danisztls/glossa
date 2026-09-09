<!--
	The whole rotation — every set and the days it is prayed on — behind an `i`.

	"(recited Tuesday and Friday)", "(da recitare lunedì e sabato)": the
	parenthetical the source prints under each set's name. It was set as a line
	under the heading, and on the six editions with a day strip above it that
	line is the third thing on screen saying the same thing — the strip shows
	the week, the reader has just pressed a day on it, and the set's name is
	what they came for.

	ONE NOTE FOR ALL FOUR, NOT ONE PER SET, and that is the difference between
	hiding a line and answering a question. Per set, the panel could only ever
	repeat what the reader had just chosen. Over all four it is the rotation
	itself: which mysteries belong to which day, the one fact about the Rosary
	that is not on the page and that a reader who does not already know it
	cannot work out from a page showing a single day.

	NOTHING IN IT IS MARKED AS CURRENT. The set on screen was picked out with a
	rule and a colour for a revision, and it was answering a question nobody
	holding this panel open has: they can see the day they pressed on the strip
	behind it and the set's name under it. A list of four short entries does
	not need a you-are-here.

	IT IS ASKED FOR RATHER THAN PRINTED, in `ArtFigure`'s arrangement:
	`AnchoredPanel`, a native popover in the top layer, the `info` glyph alone
	as the trigger. `role="note"` is ARIA's own word for content ancillary to
	the thing it hangs off, which this exactly is — not `tooltip`, which
	describes its anchor and is summoned rather than asked for. The panel is
	`position: fixed` in the top layer, so opening it costs no layout and
	nothing on the page moves.

	IT IS A COMPONENT BECAUSE THE PANEL IS STATE. `AnchoredPanel` is one
	instance per trigger and a snippet cannot hold one.

	THE TRIGGER'S LABEL IS MANDATORY. An icon has no text to fall back on;
	`Icon.svelte` enforces the other half by making every icon `aria-hidden`
	with no label prop to reach for. The label says what pressing it reveals,
	and the source's own words inside are marked as the source's language
	rather than the reader's.
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { AnchoredPanel } from '$lib/floating.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PrayerGroupEntry } from '$lib/types';

	interface Props {
		/** Every set this edition prints, in the order it prints them. */
		groups: PrayerGroupEntry[];
		/** The edition's language — the names and rubrics are its own words. */
		lang: string;
	}

	let { groups, lang }: Props = $props();

	// Per INSTANCE: `popovertarget` names an id. `$props.id()` has to be a bare
	// variable declaration initializer, so it cannot be passed straight to the
	// constructor.
	const uid = $props.id();
	const note = new AnchoredPanel(uid);
</script>

<button
	bind:this={note.trigger}
	type="button"
	class="hint-trigger"
	popovertarget={note.id}
	aria-expanded={note.open}
	aria-label={t('prayers.rosary.whenPrayed')}
	title={t('prayers.rosary.whenPrayed')}
>
	<Icon name="info" />
</button>
<div
	bind:this={note.panel}
	id={note.id}
	popover="auto"
	role="note"
	ontoggle={note.onToggle}
	class="panel-surface floating-panel rubric-note"
>
	<ul {lang}>
		{#each groups as group (group.name)}
			<li>
				<span class="rubric-set">{group.name}</span>
				{#if group.rubric}<span class="rubric-days">{group.rubric}</span>{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	/* Sized to its own words, which are four short lines: a panel at the
	   reading measure would be a wide box with a list in the corner. */
	.rubric-note {
		max-inline-size: 22rem;
		padding: 0.5rem 0.7rem;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.85rem);
	}

	.rubric-note ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.rubric-note li {
		margin: 0 0 0.45rem;
	}

	.rubric-note li:last-child {
		margin-bottom: 0;
	}

	.rubric-set {
		display: block;
		font-weight: 600;
	}

	.rubric-days {
		display: block;
		font-style: italic;
		color: var(--color-text-muted);
	}
</style>
