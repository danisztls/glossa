<!--
	A work's copyright notice, followed by a link to the page its text was
	actually scraped from.

	Renders a `<span>`, not a block: every call site already has its own
	`<p class="copyright-notice">` (or equivalent) with route-specific
	styling, and wrapping the text in a shared component shouldn't quietly
	restyle eight pages. Call sites keep their wrapper; this owns the
	contents.

	WHY THE LINK MATTERS MORE THAN IT LOOKS. The notice is reproduced
	verbatim because the rights holder requires it (`copyright.ts`), and
	docs/research/copyright.md §5's posture is that we host this text openly
	and say exactly where it came from. A notice with no way to reach the
	original asks the reader to take our word for both the text and its
	provenance; the link makes the claim checkable, which is the whole point
	of stating it. It is also the affordance that makes "degrade a work to a
	link-out" (docs/decisions.md §Architecture consequences) a small change
	rather than a new feature — the link-out target is already here.

	Opens in a new tab: the reader is mid-chapter, and sending them off-site
	in the same tab costs them their place. `rel="noopener"` accordingly.
-->
<script lang="ts">
	import { copyrightLabel, sourceHost, sourceUrl } from '$lib/copyright';
	import { t } from '$lib/i18n.svelte';
	import type { WorkManifest } from '$lib/types';

	interface Props {
		manifest: WorkManifest;
	}

	let { manifest }: Props = $props();

	const url = $derived(sourceUrl(manifest));
	const host = $derived(sourceHost(manifest));
</script>

<span class="notice">
	{copyrightLabel(manifest)}
	{#if url && host}
		<span class="sep" aria-hidden="true">·</span>
		<a
			class="source-link"
			href={url}
			target="_blank"
			rel="external noopener"
			title={t('copyright.sourceTitle')}
		>
			{host}
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
</style>
