<!--
	THE SECTION'S OWN SOURCE, printed under its heading.

	Only the Rosary has any (`PrayerGroupEntry.source`, `PrayerInstructions
	.source`): it is the one prayer assembled from more than one page, and the
	notice at the top of the page names the Compendium appendix its entry,
	rubric and concluding prayer come from — not the four Holy Rosary
	micro-site pages the twenty mysteries and the directions come from, which
	is most of what is on the screen.

	IT SAYS WHAT THE NOTICE AT THE TOP OF THE PAGE SAYS — `Source: vatican.va`,
	the same label and the same bare host — and it printed the URL's LAST
	SEGMENT until 2026-09-06. The argument for the filename was that the host
	is the same five words five times while `misteri_gaudiosi_en` against
	`misteri_luminosi_en` tells the pages apart, and that is exactly why the
	line read as a leaked file path: a reader is not choosing between those
	four addresses, they are reading the mysteries under a heading the filename
	only transliterates. The line answers the same question `CopyrightNotice`
	answers — whose server this came from — for the sections that came from a
	different one, so it answers it in the same words. Being repeated is what a
	provenance line does.

	A section with no `source` renders nothing at all, which is every prayer
	but one, and every group in a corpus written before this field existed.

	IT IS A COMPONENT AND NOT A SNIPPET because it has two callers in two
	files: the route draws it beside the opening prayer's section name and
	`PrayerMysteries` beside each set's rubric. It was a snippet on the route
	while both callers were there, and the mysteries moving out is what made
	the second copy the alternative — a copied assembly, which a shared class
	does not fix.

	THE ROUTE'S CALLER MOVED WITH THE TEXT IT ATTRIBUTES. It sat under the
	directions' heading until those directions came off the page (the Rosary's
	how-to is written here now, and the source's four sentences said nothing
	the walkthrough had not); what is left of `instructions` is the opening
	prayer, which is the source's words and takes the source's line.
-->
<script lang="ts">
	import { hostOf } from '$lib/copyright';
	import { t } from '$lib/i18n.svelte';
	import Icon from '$lib/components/Icon.svelte';

	interface Props {
		url: string | undefined;
	}

	let { url }: Props = $props();

	const host = $derived(hostOf(url));
</script>

{#if url && host}
	<span class="prayer-section-source">
		<span class="source-label">{t('copyright.sourceLabel')}:</span><a
			class="source-link"
			href={url}
			target="_blank"
			rel="external noopener"
			title={t('copyright.sourceTitle')}
			data-link-preview="off">{host}<Icon name="external-link" class="ext" /></a
		>
	</span>
{/if}

<style>
	/* Sized and coloured like `.copyright-notice`, because that is what it is
	   — the same claim about the same kind of fact, made about a section
	   instead of a work. `--font-size-min` floors it at 13.5px the way every
	   other relative reduction on the site does; the `em` is relative to the
	   heading it sits under, which is itself relative to nothing the reader
	   can adjust, so this stays a fixed small rather than shrinking with the
	   enlarged prayer type above it. */
	.prayer-section-source {
		display: block;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.7em);
		font-weight: 400;
		font-style: normal;
		color: var(--color-text-muted);
		margin-block-start: 0.15rem;
	}

	/* THE UNDERLINE IS ON THE ANCHOR AND NOT ON THE LINE, which it was until
	   the label arrived: with the whole line ruled, `Source:` looked like part
	   of the destination and the row read as one long link. `CopyrightNotice`
	   draws exactly this pair, and the label's own rule there says why it stays
	   outside the anchor — the link text should be the thing being linked to. */
	.prayer-section-source .source-label {
		margin-inline-end: 0.2em;
	}

	.prayer-section-source .source-link {
		color: inherit;
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-underline-offset: 0.15em;
	}

	.prayer-section-source .source-link:hover {
		color: var(--color-accent);
		text-decoration-style: solid;
	}

	/* Same optical correction as `CopyrightNotice`'s glyph — see its docblock
	   for the 24x24 viewBox inset the numbers come from. */
	.prayer-section-source :global(.ext) {
		width: 0.85em;
		height: 0.85em;
		margin-inline-start: 0.28em;
		vertical-align: -0.18em;
	}
</style>
