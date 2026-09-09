<!--
	A work's copyright notice, followed by a link to the page its text was
	actually scraped from — or, where the address in view was assembled from
	more than one page, a link to each of them.

	Renders a `<span>`, not a block: every call site already has its own
	`<p class="copyright-notice">` (or equivalent) with route-specific
	styling, and wrapping the text in a shared component shouldn't quietly
	restyle eight pages. Call sites keep their wrapper; this owns the
	contents.

	WHY THE LINK MATTERS MORE THAN IT LOOKS. docs/research/copyright.md §5's
	posture is that we host this text openly and say exactly where it came
	from. An attribution with no way to reach the original asks the reader to
	take our word for both the text and its provenance; the link makes the
	claim checkable, which is the whole point of stating it. It is also the
	affordance that makes "degrade a work to a link-out" (docs/decisions.md
	§Architecture consequences) a small change rather than a new feature —
	the link-out target is already here. Hence the external-link glyph: the
	host on its own reads as a citation, and readers were not being told the
	line was clickable at all.

	THE EXACT NOTICE IS THE `title`, not the visible text. The visible label
	is the short attribution; the source's own notice — the long USCCB-style
	boilerplate, where a source prints one — is one hover away rather than
	set under every chapter. See `copyright.ts` for why that split is safe.

	Opens in a new tab: the reader is mid-chapter, and sending them off-site
	in the same tab costs them their place. `rel="noopener"` accordingly.
-->
<script lang="ts">
	import { copyrightLabel, copyrightNoticeExact, sourceLabels, sourceUrl } from '$lib/copyright';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { SourceRef, WorkManifest } from '$lib/types';

	interface Props {
		manifest: WorkManifest;
		/**
		 * Override the source link when the ADDRESS in view has a narrower
		 * provenance than the work.
		 *
		 * Every other type's editions are one page (or one contiguous run of
		 * them), so `manifest.sources[0]` is the page any address in it came
		 * from. The prayer collection is not: English is assembled from eight
		 * pages, and four of its twenty-eight prayers come from somewhere
		 * other than the Compendium appendix `sources[0]` names. `Prayer.sources`
		 * records which; passing it here is what makes the notice name the page
		 * a reader can actually check the text against.
		 *
		 * ALL OF THEM ARE DRAWN, WHERE THE MANIFEST'S FALLBACK DRAWS ONE. That
		 * asymmetry is the difference between the two lists: a manifest's is
		 * every page the collection was assembled from — twelve, for English —
		 * and says nothing about the address in view, where this one is a claim
		 * about this text. The Rosary is the only prayer with two, and it needs
		 * both: the appendix has its concluding prayer and not its mysteries,
		 * the micro-site its mysteries and not its concluding prayer.
		 *
		 * Omitted everywhere else, and the fallback is the manifest — so a
		 * corpus with no per-address provenance behaves exactly as before.
		 */
		sources?: SourceRef[];
	}

	let { manifest, sources }: Props = $props();

	const urls = $derived(
		sources?.length ? sources.map((source) => source.url) : [sourceUrl(manifest)]
	);
	/* Paired by INDEX with `urls`, so a label that came back undefined drops
	   its own link and nothing else's. */
	const labels = $derived(sourceLabels(urls));
	const shown = $derived(
		urls.map((url, i) => ({ url, label: labels[i] })).filter((row) => row.url && row.label)
	);
	const exact = $derived(copyrightNoticeExact(manifest));
</script>

<span class="notice">
	<span title={exact}>{copyrightLabel(manifest)}</span>
	{#if shown.length > 0}
		<span class="sep" aria-hidden="true">·</span>
		<!-- ONE LABEL OVER A LIST, and the list is separated by commas rather
		     than by the `·` above: that dot divides the notice from its
		     sources, and spending it again inside would make three items of
		     two. The word stays singular in all thirty-nine dictionaries — a
		     field label reads over a list without being pluralised, and a
		     second key would be one English word on this line for every reader
		     whose language nobody has translated it into yet. -->
		<span class="source-label">{t('copyright.sourceLabel')}:</span>
		{#each shown as row, i (row.url)}
			{#if i > 0}<span class="list-sep">,</span>{/if}
			<a
				class="source-link"
				href={row.url}
				target="_blank"
				rel="external noopener"
				title={t('copyright.sourceTitle')}
			>
				{row.label}<Icon name="external-link" class="ext" />
			</a>
		{/each}
	{/if}
</span>

<style>
	.notice {
		/* Inherits size/colour from the call site's wrapper — see docblock. */
		display: inline;
	}

	.sep {
		opacity: 0.6;
		margin-inline: 0.15rem;
	}

	.source-link {
		color: inherit;
		text-decoration-line: underline;
		text-decoration-style: dotted;
		text-underline-offset: 0.15em;
	}

	.source-link:hover {
		color: var(--color-accent);
		text-decoration-style: solid;
	}

	.source-label {
		/* A label, not part of the destination's name, so it stays outside the
		   anchor: the link text should be the thing being linked to. */
		margin-inline-end: 0.2em;
	}

	/* The comma belongs to the list and not to the address before it, so it is
	   its own element: inside the anchor it would be underlined as part of a
	   destination, and the markup's own whitespace would set it a space away
	   from the address it follows. */
	.list-sep {
		margin-inline-start: -0.25em;
	}

	/* The glyph, at 1em and on the baseline, rose past the cap height of the
	   text beside it: an inline <svg> puts the BOTTOM of its box on the
	   baseline, and lucide's 24x24 viewBox insets the drawn glyph by ~2 units,
	   so the visible mark ends up floating a further ~8% of its height up. Hence
	   both numbers below — smaller than the text, and dropped by roughly that
	   inset plus enough to centre it against the x-height rather than sit on
	   top of it. */
	.source-link :global(.ext) {
		width: 0.85em;
		height: 0.85em;
		margin-inline-start: 0.28em;
		vertical-align: -0.18em;
	}
</style>
