<script lang="ts">
	import { page } from '$app/state';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `data.byLang` embeds every language this document has section `n` in
	// (see +page.ts — prerendered, so this can't be resolved against a
	// client preference at request time). `content.documentLangFor` picks
	// which embedded language is active, reactively; fall back to whatever
	// language *is* embedded if the preferred one somehow isn't (a v1 EN/PT
	// asymmetry — same posture as `ccc/[n]`/`compendium/[n]`).
	const availableLangs = $derived(Object.keys(data.byLang));
	const lang = $derived(
		data.byLang[content.documentLangFor(data.slug)] ? content.documentLangFor(data.slug) : availableLangs[0]
	);
	const current = $derived(data.byLang[lang]);

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles the document's language mid-read too, same as `ccc/[n]`.
	$effect(() => {
		if (current) {
			setPosition(current.work.id, `${current.work.short_title} ${data.n}`, page.url.pathname);
		}
	});
</script>

<svelte:head>
	<title>{current?.work.short_title ?? data.slug} {data.n} — {t('home.title')}</title>
</svelte:head>

{#if current}
	<article class="content-column">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/documents">{t('nav.magisterium')}</a>
			<span class="sep">›</span>
			<a href={`/documents/${data.slug}`}>{current.work.short_title}</a>
			{#each current.breadcrumb as node (node.title + node.paragraphs.join('-'))}
				{@const dt = displayTitle(node, lang)}
				<span class="sep">›</span>
				{#if Number.isFinite(node.paragraphs[0])}
					<a href={`/documents/${data.slug}/${node.paragraphs[0]}`}>{dt.title}</a>
				{:else}
					<span>{dt.title}</span>
				{/if}
			{/each}
		</nav>

		<h1>{current.work.short_title} {data.n}</h1>

		<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>

		<div class="reading-text document-body" lang={current.work.language}>
			<CccParagraphText paragraph={current.section} {lang} />
		</div>

		<nav class="section-nav" aria-label="Section navigation">
			{#if current.prev}
				<a href={`/documents/${data.slug}/${current.prev.n}`} rel="prev"
					>&larr; {t('document.prevSection')} · §{current.prev.n}</a
				>
			{:else}
				<span></span>
			{/if}
			{#if current.next}
				<a href={`/documents/${data.slug}/${current.next.n}`} rel="next"
					>{t('document.nextSection')} · §{current.next.n} &rarr;</a
				>
			{/if}
		</nav>
	</article>
{/if}

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
	}

	.copyright-notice {
		margin: 0 0 1rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.section-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.95rem;
	}

	.section-nav a {
		text-decoration: none;
	}
</style>
