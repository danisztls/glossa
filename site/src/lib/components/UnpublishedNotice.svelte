<!--
	What a reader sees where a withheld work's text would be.

	TWO REASONS, TWO MESSAGES. Usually this is a QUALITY withholding: our parse
	of the work is damaged — paragraphs swallowed by a source-HTML defect — and
	publishing it would hand the reader an incomplete text with no way to tell.
	Occasionally it is a RIGHTS request. Those are different statements about
	the same blank space, and a reader deciding whether to trust the rest of
	the site is owed the right one, so the copy branches on `info.kind` rather
	than saying something vague enough to cover both.

	The quality message admits fault plainly. Saying "this text is incomplete
	because we could not parse it properly" costs nothing and is the only thing
	that makes the rest of the corpus credible: a site that hides its failures
	is asking to be trusted about the ones you cannot see. It also names the
	remedy — read it at the source — which is what the reader actually wants.

	WRITTEN TO BE READ BY SOMEONE WHO CAME FOR THE TEXT, not as an error page.
	They followed a working link and the thing they wanted is elsewhere, so the
	link gets the emphasis. The stated reason is shown verbatim from
	`unpublished.json` rather than summarised.

	Deliberately NOT styled as a warning. For the rights case, an amber banner
	would frame a rights holder exercising their rights as a fault; for the
	quality case, it would make a temporary, known, documented gap look like a
	malfunction. Both are ordinary parts of running this site honestly.
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

	// Defaults to `quality`: that is the common case, and an entry written
	// without a `kind` is far likelier to be a hasty quality withholding than
	// an unlabelled rights request.
	const kind = $derived(info.kind ?? 'quality');
	const url = $derived(sourceUrl(manifest));
	const host = $derived(sourceHost(manifest));
</script>

<section class="unpublished">
	<h2>{t(`unpublished.${kind}.heading`)}</h2>
	<p class="explain">{t(`unpublished.${kind}.explain`)}</p>

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
