<!--
	A work's copyright notice, followed by a link to the page its text was
	actually scraped from.

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
	import {
		copyrightLabel,
		copyrightNoticeExact,
		hostOf,
		sourceHost,
		sourceUrl
	} from '$lib/copyright';
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
		 * Omitted everywhere else, and the fallback is the manifest — so a
		 * corpus with no per-address provenance behaves exactly as before.
		 */
		sources?: SourceRef[];
	}

	let { manifest, sources }: Props = $props();

	const source = $derived(sources?.[0]);
	const url = $derived(source?.url ?? sourceUrl(manifest));
	const host = $derived(source ? hostOf(source.url) : sourceHost(manifest));
	const exact = $derived(copyrightNoticeExact(manifest));
</script>

<span class="notice">
	<span title={exact}>{copyrightLabel(manifest)}</span>
	{#if url && host}
		<span class="sep" aria-hidden="true">·</span>
		<span class="source-label">{t('copyright.sourceLabel')}:</span>
		<a
			class="source-link"
			href={url}
			target="_blank"
			rel="external noopener"
			title={t('copyright.sourceTitle')}
		>
			{host}<Icon name="external-link" class="ext" />
		</a>
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
