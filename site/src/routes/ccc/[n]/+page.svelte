<script lang="ts">
	import { page } from '$app/state';
	import { cccParagraphExists } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `data.byLang` embeds every language the corpus has this paragraph in
	// (see +page.ts — the page is prerendered, so this can't be resolved
	// against a client preference at request time). `content.langFor` picks
	// which embedded language is active, reactively; fall back to whatever
	// language *is* embedded if the preferred one somehow isn't (only
	// possible against a partial fixture — the real corpus has both `ccc.en`
	// and `ccc.pt` complete for every paragraph).
	const availableLangs = $derived(Object.keys(data.byLang));
	const lang = $derived(
		data.byLang[content.langFor('catechism')] ? content.langFor('catechism') : availableLangs[0]
	);
	const current = $derived(data.byLang[lang]);

	// `related` cross-references may point outside whatever slice of the
	// corpus is actually present (always true for this fixture; possible
	// even for the real corpus if it's ever built/served partially) — only
	// link the ones we can actually resolve, and say so for the rest rather
	// than producing a dead link.
	function relatedExists(n: number): boolean {
		return cccParagraphExists(lang, n);
	}

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles content language mid-read too, so "continue reading"
	// always points at the edition they were last actually looking at.
	$effect(() => {
		if (current) setPosition(current.work.id, `CCC ${data.n}`, page.url.pathname);
	});
</script>

<svelte:head>
	<title>CCC {data.n} — {t('home.title')}</title>
</svelte:head>

{#if current}
	<article class="content-column">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/ccc">{t('nav.ccc')}</a>
			{#each current.breadcrumb as node (node.title)}
				{@const dt = displayTitle(node, lang)}
				<span class="sep">›</span>
				<a href={`/ccc/${node.paragraphs[0]}`}>
					{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
					{dt.title}
				</a>
			{/each}
		</nav>

		<h1>
			{#if current.paragraph.in_brief}
				<span class="in-brief-tag">{t('ccc.inBrief')}</span>
			{/if}
			CCC {data.n}
		</h1>

		<p class="copyright-notice">{copyrightLabel(current.work)}</p>

		<div class="reading-text ccc-body" lang={current.work.language}>
			<CccParagraphText paragraph={current.paragraph} {lang} />
		</div>

		{#if current.paragraph.related.length > 0}
			<p class="related">
				{t('ccc.related')}:
				{#each current.paragraph.related as n, i (n)}
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
			{#if current.prev}
				<a href={`/ccc/${current.prev.n}`} rel="prev"
					>&larr; {t('ccc.prevParagraph')} · ¶{current.prev.n}</a
				>
			{:else}
				<span></span>
			{/if}
			{#if current.next}
				<a href={`/ccc/${current.next.n}`} rel="next"
					>{t('ccc.nextParagraph')} · ¶{current.next.n} &rarr;</a
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

	.breadcrumb .ordinal {
		margin-right: 0.3em;
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
