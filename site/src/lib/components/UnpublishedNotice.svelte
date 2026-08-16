<!--
	What a reader sees where a taken-down work's text used to be.

	docs/decisions.md's Architecture consequences require that any work can be
	"degraded to a link-out to vatican.va without rearchitecting". This is the
	link-out. The page still exists, still names the work, still carries the
	rights holder's own copyright notice, and still says where the text can be
	read — it simply no longer reproduces it.

	WRITTEN TO BE READ BY SOMEONE WHO CAME FOR THE TEXT, not as an error. They
	followed a working link and the thing they wanted is genuinely elsewhere,
	so the useful content of this page is the link, which gets the emphasis. No
	apology, no "oops", no suggestion that something broke: nothing did. The
	stated reason is shown verbatim from `unpublished.json` rather than
	summarised, because the whole posture (docs/research/copyright.md §5) rests
	on saying plainly what we are doing and why.

	Deliberately NOT styled as a warning or an error. Amber banners and red
	borders would frame a rights holder exercising their rights as a fault, and
	frame us as having been caught at something. The project's position is that
	complying promptly is the normal, expected half of hosting without asking
	first — so this reads as a normal part of the site.
-->
<script lang="ts">
	import { sourceUrl, sourceHost, copyrightLabel } from '$lib/copyright';
	import { t } from '$lib/i18n.svelte';
	import type { UnpublishedWork } from '$lib/corpus';
	import type { WorkManifest } from '$lib/types';

	interface Props {
		manifest: WorkManifest;
		info: UnpublishedWork;
	}

	let { manifest, info }: Props = $props();

	const url = $derived(sourceUrl(manifest));
	const host = $derived(sourceHost(manifest));
</script>

<section class="unpublished">
	<h2>{t('unpublished.heading')}</h2>
	<p class="explain">{t('unpublished.explain')}</p>

	{#if info.reason}
		<p class="reason">{info.reason}</p>
	{/if}

	{#if url && host}
		<p class="read-at">
			<a href={url} rel="external noopener" target="_blank">
				{t('unpublished.readAt')}
				{host}
			</a>
		</p>
	{/if}

	<p class="rights">{copyrightLabel(manifest)}</p>
</section>

<style>
	.unpublished {
		margin: 2rem 0;
		padding: 1.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-bg-elevated);
	}

	.unpublished h2 {
		margin: 0 0 0.75rem;
		font-family: var(--font-serif);
		font-size: 1.1rem;
	}

	.explain {
		margin: 0 0 0.75rem;
		color: var(--color-text-muted);
		max-width: 60ch;
	}

	/* The rights holder's own words for why, shown as given. */
	.reason {
		margin: 0 0 1rem;
		padding-inline-start: 0.9rem;
		border-inline-start: 2px solid var(--color-border);
		color: var(--color-text-muted);
		max-width: 60ch;
	}

	/* The one thing a reader who came for the text can actually use. */
	.read-at {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
	}

	.rights {
		margin: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
