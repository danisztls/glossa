<!--
	One Rosary mystery with its Vatican Scripture meditation and terminal
	citation. The source prints that citation in parentheses after the quoted
	text; the corpus keeps it separately so it can use the same inline,
	click-to-reveal citation treatment as CCC footnotes. It is deliberately a
	button rather than a link: the first tap exposes the exact locator, and
	the link inside it then opens the corresponding Bible passage.
-->
<script lang="ts">
	import RefText from '$lib/components/RefText.svelte';
	import type { PrayerMysteryItem } from '$lib/types';

	interface Props {
		item: PrayerMysteryItem;
		lang: string;
	}

	let { item, lang }: Props = $props();
	let citationOpen = $state(false);
</script>

<p class="prayer-mystery-title">{item.title}</p>
<p class="prayer-mystery-meditation">
	{item.meditation}
	{#if item.citation}
		<sup class="citation-marker">
			<button
				type="button"
				class="citation-trigger"
				aria-label={item.citation.text}
				aria-expanded={citationOpen}
				onclick={() => (citationOpen = !citationOpen)}
			>
				{item.citation.marker}
			</button>
		</sup>
		{#if citationOpen}
			<span class="citation-text"><RefText text={item.citation.text} {lang} /></span>
		{/if}
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

	.citation-text {
		margin-left: 0.35em;
		font-size: max(var(--font-size-min), 0.9em);
		color: var(--color-text-muted);
	}
</style>
