<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getAdjacentChapterAcrossBooks } from '$lib/corpus';
	import { setPosition } from '$lib/reading-position';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const prev = $derived(
		getAdjacentChapterAcrossBooks(data.workId, data.osis, data.chapterN, 'prev')
	);
	const next = $derived(
		getAdjacentChapterAcrossBooks(data.workId, data.osis, data.chapterN, 'next')
	);

	function headingBefore(verseN: number) {
		return data.chapter.headings?.find((h) => h.before_verse === verseN);
	}

	onMount(() => {
		setPosition(data.workId, `${data.book.name} ${data.chapter.n}`, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{data.book.name} {data.chapter.n} — {data.work.short_title}</title>
</svelte:head>

<article class="content-column">
	<p class="edition-label">{data.work.title}</p>
	<h1>{data.book.name} {data.chapter.n}</h1>

	<BookChapterPicker
		currentEdition={data.edition}
		currentOsis={data.osis}
		currentChapter={data.chapterN}
	/>

	<div class="reading-text">
		{#each data.chapter.verses as verse (verse.n)}
			{@const heading = headingBefore(verse.n)}
			{#if heading}
				<h2 class="section-heading">{heading.text}</h2>
			{/if}
			<span id={`v${verse.n}`} class="verse">
				<sup class="verse-num">{verse.n}</sup>{verse.text}
			</span>
		{/each}
	</div>

	<nav class="chapter-nav" aria-label="Chapter navigation">
		{#if prev}
			<a href={`/bible/${data.edition}/${prev.osis}/${prev.chapter}`} rel="prev">
				&larr; {t('bible.prevChapter')}
			</a>
		{:else}
			<span></span>
		{/if}
		{#if next}
			<a href={`/bible/${data.edition}/${next.osis}/${next.chapter}`} rel="next">
				{t('bible.nextChapter')} &rarr;
			</a>
		{/if}
	</nav>
</article>

<style>
	.edition-label {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	h1 {
		font-family: var(--font-serif);
		margin-top: 0.25rem;
	}

	.section-heading {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		font-weight: 600;
		margin: 1.5rem 0 0.5rem;
	}

	.verse {
		margin-right: 0.25em;
	}

	.verse-num {
		font-size: 0.65em;
		color: var(--color-text-muted);
		margin-right: 0.15em;
		user-select: none;
	}

	.chapter-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.95rem;
	}

	.chapter-nav a {
		text-decoration: none;
	}
</style>
