<!--
	What a reader sees when offline mode refused a text that is not on the
	device. Reached only from `+error.svelte`; see its docblock for how the two
	failures are told apart.

	IT ENDS IN THE SWITCH, and that is the whole reason this is a component
	rather than a line added to `NotFound`. The reader is one click from the
	text they asked for, and a page that explains the situation without
	offering the remedy would send them hunting through a menu for a control
	they may not remember turning on. Turning it off here also RETRIES: the
	load already failed, so there is nothing on the page to preserve, and
	`invalidateAll()` re-runs it against a worker that will now fetch.

	It carries no illustration, unlike `NotFound`. That page is a dead end and
	can afford to be a page; this one is a two-sentence interruption in the
	middle of reading, and the picture would be the largest thing on a screen
	whose news is small. It is also, precisely, the reader whose device may not
	have the image (`NotFound`'s own docblock says so — the AVIF is deferred
	media, cached on first read).
-->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { t } from '$lib/i18n.svelte';
	import { offline } from '$lib/offline.svelte';

	async function turnOff() {
		offline.set(false);
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>{t('offline.notDownloaded')} — {t('home.title')}</title>
</svelte:head>

<article class="content-column not-downloaded">
	<h1>{t('offline.notDownloaded')}</h1>
	<p class="page-tagline lede">{t('offline.hint')}</p>
	<p>
		<button type="button" class="turn-off" onclick={turnOff}>{t('offline.turnOff')}</button>
	</p>
</article>

<style>
	.not-downloaded {
		font-family: var(--font-serif);
		line-height: 1.7;
	}

	.not-downloaded h1 {
		margin-bottom: 0.5rem;
	}

	/* `NotFound`'s lede, at `NotFound`'s size: the two pages answer the same
	   kind of moment and should not look like different sites. */
	.lede {
		font-size: 1.15rem;
	}

	/* The same chip as `NotFound`'s section links — a button here rather than
	   an anchor because it changes a preference and stays put, and the shape
	   is what says "this is the way on". */
	.turn-off {
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

	.turn-off:hover,
	.turn-off:focus-visible {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
