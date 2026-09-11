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

	IT IS ASKED FOR RATHER THAN PRINTED: `HintNote`, which is the `i` every
	surface here draws and the popover behind it. What this file owns is the
	list — four short entries, the source's own words, marked as the source's
	language rather than the reader's.

	IT IS STILL A COMPONENT, though the panel's state has moved into the one
	that owns the panel: the rotation is read off the edition's groups, and a
	template deciding which sets exist is not a caption.
-->
<script lang="ts">
	import HintNote from '$lib/components/HintNote.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PrayerGroupEntry } from '$lib/types';

	interface Props {
		/** Every set this edition prints, in the order it prints them. */
		groups: PrayerGroupEntry[];
		/** The edition's language — the names and rubrics are its own words. */
		lang: string;
	}

	let { groups, lang }: Props = $props();
</script>

<HintNote label={t('prayers.rosary.whenPrayed')}>
	<ul class="rubrics" {lang}>
		{#each groups as group (group.name)}
			<li>
				<span class="rubric-set">{group.name}</span>
				{#if group.rubric}<span class="rubric-days">{group.rubric}</span>{/if}
			</li>
		{/each}
	</ul>
</HintNote>

<style>
	/* Set at its own size and not the caveat's: this panel holds four names
	   rather than a line of small print, and a name is read rather than
	   skimmed. The measure and the padding around it are `HintNote`'s. */
	.rubrics {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: max(var(--font-size-min), 0.85rem);
	}

	.rubrics li {
		margin: 0 0 0.45rem;
	}

	.rubrics li:last-child {
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
