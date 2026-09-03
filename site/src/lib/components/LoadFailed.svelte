<!--
	What a reader sees when a load THREW while online. Reached only from
	`+error.svelte`; see its docblock for how the three failures are told apart.

	IT EXISTS BECAUSE THE ALTERNATIVE WAS A LIE. Until 2026-09-03 this case fell
	through to `NotFound`, so a chapter whose index or content file failed to
	arrive told the reader the address does not exist — about an address that
	does, and that will work on the next attempt. `NotFound` is a dead end by
	design: it apologises, offers the search box and sends the reader elsewhere.
	That is the correct answer to a wrong address and the worst possible answer
	to a dropped request, because it redirects the reader away from a page that
	was one retry from working.

	THE REMEDY IS THE POINT, exactly as it is in `NotDownloaded`, which this is
	modelled on. `invalidateAll()` re-runs the failed load in place rather than
	reloading the document: the shell, the dictionaries and every index that DID
	arrive are already resident, so the retry costs only what failed. A full
	`location.reload()` would throw all of that away to re-fetch it.

	No illustration, for `NotDownloaded`'s reason: this is a two-sentence
	interruption in the middle of reading, not a page.
-->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { t } from '$lib/i18n.svelte';

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} finally {
			retrying = false;
		}
	}
</script>

<svelte:head>
	<title>{t('loadFailed.title')} — {t('home.title')}</title>
	<!-- A transient failure is not a page worth indexing, and it answers at an
	     address that is otherwise perfectly good. -->
	<meta name="robots" content="noindex" />
</svelte:head>

<article class="content-column load-failed">
	<h1>{t('loadFailed.title')}</h1>
	<p class="page-tagline lede">{t('loadFailed.hint')}</p>
	<p>
		<button type="button" class="retry" onclick={retry} disabled={retrying}>
			{retrying ? t('loadFailed.retrying') : t('loadFailed.retry')}
		</button>
	</p>
</article>

<style>
	.load-failed {
		font-family: var(--font-serif);
		line-height: 1.7;
	}

	.load-failed h1 {
		margin-bottom: 0.5rem;
	}

	/* `NotFound`'s lede, at `NotFound`'s size: these pages answer the same kind
	   of moment and should not look like different sites. */
	.lede {
		font-size: 1.15rem;
	}

	/* `NotDownloaded`'s chip, and deliberately the same one — the two components
	   offer the same gesture (the way on) and differ only in what it does. */
	.retry {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		line-height: 1.5;
		cursor: pointer;
	}

	.retry:hover:not(:disabled),
	.retry:focus-visible {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.retry:disabled {
		cursor: default;
		opacity: 0.6;
	}
</style>
