<script lang="ts">
	/**
	 * Scripture landing route (`/scriptura`). No dynamic params — the reader's
	 * current edition comes entirely client-side from `content.workIdFor`
	 * (see `$lib/content.svelte.ts`), same as any other stored-preference
	 * read on a prerendered page. Offers the reader's edition + its
	 * copyright notice, a single entry point (continue reading if a
	 * position is stored for this edition, else the edition's first
	 * chapter — Genesis 1 for both v1 editions), and the canonical
	 * book/chapter structure via `BookChapterPicker`.
	 */
	import { content } from '$lib/content.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { getWork, listBooks } from '$lib/corpus';
	import { getPosition, type ReadingPosition } from '$lib/reading-position';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import { t } from '$lib/i18n.svelte';

	const workId = $derived(content.workIdFor('bible'));
	const work = $derived(workId ? getWork(workId) : undefined);


	// The reading position is read on mount, not eagerly, because localStorage
	// doesn't exist during prerendering (see reading-position.ts) — matches
	// the pattern the home page (`routes/+page.svelte`) already uses.
	let position: ReadingPosition | undefined = $state(undefined);

	$effect(() => {
		position = workId ? getPosition(workId) : undefined;
	});

	const firstChapterHref = $derived.by(() => {
		if (!workId) return undefined;
		const firstBook = listBooks(workId)[0];
		if (!firstBook) return undefined;
		const firstChapterN = firstBook.chapters[0]?.n ?? 1;
		return `/scriptura/${firstBook.osis}/${firstChapterN}`;
	});
</script>

<svelte:head>
	<title>{t('bible.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('bible.landing.title')}</h1>
	<p class="tagline">{t('bible.landing.tagline')}</p>

	{#if work}
		<p class="edition-label">{work.title}</p>
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	<p class="entry-point">
		{#if position}
			<a href={position.href} class="entry-link">{t('bible.landing.continue')}</a>
			<span class="entry-detail">— {position.label}</span>
		{:else if firstChapterHref}
			<a href={firstChapterHref} class="entry-link">{t('bible.landing.start')}</a>
		{/if}
	</p>

	{#if workId}
		<section aria-labelledby="books-heading">
			<h2 id="books-heading">{t('bible.landing.books')}</h2>
			<BookChapterPicker currentWorkId={workId} collapsible={false} />
		</section>
	{/if}
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
	}

	.edition-label {
		margin: 1.5rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.copyright-notice {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.entry-point {
		margin: 1.25rem 0 2rem;
	}

	.entry-link {
		font-weight: 600;
	}

	.entry-detail {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	h2 {
		font-family: var(--font-serif);
	}
</style>
