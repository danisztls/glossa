<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getCccParagraph } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { setPosition } from '$lib/reading-position';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `related` cross-references may point outside whatever slice of the
	// corpus is actually present (always true for this fixture; possible
	// even for the real corpus if it's ever built/served partially) — only
	// link the ones we can actually resolve, and say so for the rest rather
	// than producing a dead link.
	function relatedExists(n: number): boolean {
		return getCccParagraph(data.lang, n) !== undefined;
	}

	onMount(() => {
		setPosition('ccc.' + data.lang, `CCC ${data.n}`, page.url.pathname);
	});
</script>

<svelte:head>
	<title>CCC {data.n} — {t('home.title')}</title>
</svelte:head>

<article class="content-column">
	<nav class="breadcrumb" aria-label="Breadcrumb">
		<a href="/ccc">{t('nav.ccc')}</a>
		{#each data.breadcrumb as node (node.title)}
			<span class="sep">›</span>
			<a href={`/ccc/${node.paragraphs[0]}`}>{node.title}</a>
		{/each}
	</nav>

	<h1>
		{#if data.paragraph.in_brief}
			<span class="in-brief-tag">{t('ccc.inBrief')}</span>
		{/if}
		CCC {data.n}
	</h1>

	<p class="copyright-notice">{copyrightLabel(data.work)}</p>

	<div class="reading-text ccc-body" lang={data.work.language}>
		<CccParagraphText paragraph={data.paragraph} />
	</div>

	{#if data.paragraph.related.length > 0}
		<p class="related">
			{t('ccc.related')}:
			{#each data.paragraph.related as n, i (n)}
				{#if i > 0}·{/if}
				{#if relatedExists(n)}
					<a href={`/ccc/${n}`}>¶{n}</a>
				{:else}
					<span class="related-unresolved" title="Not in this fixture">¶{n}</span>
				{/if}
			{/each}
		</p>
	{/if}

	<nav class="paragraph-nav" aria-label="Paragraph navigation">
		{#if data.prev}
			<a href={`/ccc/${data.prev.n}`} rel="prev">&larr; {t('ccc.prevParagraph')} · ¶{data.prev.n}</a
			>
		{:else}
			<span></span>
		{/if}
		{#if data.next}
			<a href={`/ccc/${data.next.n}`} rel="next">{t('ccc.nextParagraph')} · ¶{data.next.n} &rarr;</a
			>
		{/if}
	</nav>
</article>

<style>
	.breadcrumb {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.breadcrumb a {
		text-decoration: none;
		color: var(--color-text-muted);
	}

	.breadcrumb .sep {
		margin: 0 0.35em;
	}

	h1 {
		font-family: var(--font-serif);
		margin-top: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.copyright-notice {
		margin: 0 0 1rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.in-brief-tag {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 0.25rem;
		padding: 0.1rem 0.4rem;
	}

	.related {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.related a {
		color: var(--color-text-muted);
	}

	.related-unresolved {
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	.paragraph-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.95rem;
	}

	.paragraph-nav a {
		text-decoration: none;
	}
</style>
