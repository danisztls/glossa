<!--
	One Rosary mystery: its name, the Scripture the source meditates it on, and
	the passage that came from.

	THE NAME IS THE PART OF THE TITLE THE PAGE HAS NOT ALREADY SAID —
	`mysteryName` carries the cut and the evidence for it. The list marker
	beside this line is its position and the heading above it is its set, so the
	six editions that print "First Joyful Mystery: The Annunciation" print the
	last two words here.

	THE CITATION IS SET, NOT HIDDEN BEHIND A MARK. It was a superscript `1`
	opening a click-to-reveal panel, on the CCC footnote's pattern — and a
	footnote mark earns that treatment by standing in a page of running prose
	where the note is an aside. This is neither: there is exactly one citation,
	it is the only thing saying which Gospel the reader is being asked to
	picture, and every mystery carried an identical `1` that a reader had to
	press twenty times to learn twenty different answers. Set after the
	quotation it is shorter than the mark plus its panel and it is legible
	without a gesture. `RefText` still links it, so the passage is one tap away
	rather than two.
-->
<script lang="ts">
	import RefText from '$lib/components/RefText.svelte';
	import { mysteryName } from '$lib/rosary';
	import type { PrayerMysteryItem } from '$lib/types';

	interface Props {
		item: PrayerMysteryItem;
		lang: string;
	}

	let { item, lang }: Props = $props();

	const name = $derived(mysteryName(item.title));
</script>

<p class="prayer-mystery-title">{name}</p>
<p class="prayer-mystery-meditation">
	{item.meditation}
	{#if item.citation}
		<span class="prayer-mystery-citation"><RefText text={item.citation.text} {lang} /></span>
	{/if}
</p>

<style>
	.prayer-mystery-title {
		margin: 0;
		font-weight: 700;
	}

	.prayer-mystery-meditation {
		margin: 0.25rem 0 0;
	}

	/* Sans, small and muted: it is an address, and the words before it are the
	   text. `--font-size-min` floors it the way every other relative reduction
	   on the site does, so the enlarged prayer type above cannot shrink it out
	   of legibility. It sits on the quotation's own last line rather than under
	   it — a locator of eleven characters on a line of its own costs a line per
	   mystery and reads as a caption. */
	.prayer-mystery-citation {
		margin-inline-start: 0.4em;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.78em);
		color: var(--color-text-muted);
		white-space: nowrap;
	}
</style>
