<script lang="ts">
	/**
	 * Scripture landing route (`/scriptura`). No dynamic params — the reader's
	 * current edition comes entirely client-side from `content.workIdFor`
	 * (see `$lib/content.svelte.ts`), same as any other stored-preference
	 * read anywhere on the site now that `ssr = false` (`+layout.ts`) makes
	 * every route client-rendered. Offers the reader's edition + its
	 * copyright notice, a single entry point (continue reading if a
	 * position is stored for this edition, else the edition's first
	 * chapter — Genesis 1 for both v1 editions), and the canonical
	 * book/chapter structure via `BookChapterPicker`.
	 *
	 * THE EDITION PICKER AND THE ROLL SIT IN `ReadingBar`, the same sticky bar
	 * the scripture reader carries, rather than in this page's own body. Both
	 * belong to the whole page and not to any one line of it: which edition
	 * this is decides the book list beneath as much as it decides a chapter's
	 * text, and the roll opens a verse from that same edition. The dice used
	 * to sit inline at the end of the entry-point sentence, which put it out
	 * of reach the moment a reader scrolled into the seventy-three books —
	 * exactly where an undecided reader is.
	 */
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { getWork, listBooks } from '$lib/corpus';
	import { getPosition, type ReadingPosition } from '$lib/reading-position';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import { t } from '$lib/i18n.svelte';

	const workId = $derived(content.workIdFor('bible'));
	const work = $derived(workId ? getWork(workId) : undefined);

	// The reading position is read on mount, not eagerly, because localStorage
	// doesn't exist outside a browser (see reading-position.ts). That guarded
	// against a prerendering throw; since `ssr = false` (`+layout.ts`,
	// docs/decisions.md §The site) no route ever runs server-side at all, so
	// the guard is now belt-and-braces rather than load-bearing — kept
	// because it still states the actual requirement, and matches the
	// pattern the home page (`routes/+page.svelte`) already uses.
	let position: ReadingPosition | undefined = $state(undefined);

	$effect(() => {
		position = workId ? getPosition(workId) : undefined;
	});

	const firstChapterHref = $derived.by(() => {
		if (!workId) return undefined;
		const firstBook = listBooks(workId)[0];
		if (!firstBook) return undefined;
		const firstChapterN = firstBook.chapters[0]?.n ?? 1;
		return hrefFor({ kind: 'bible', osis: firstBook.osis, chapter: firstChapterN });
	});
</script>

<svelte:head>
	<title>{t('bible.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<!-- Edition and roll, and nothing else: there is no chapter here to
	     bookmark or print — see `ReadingBar`. Guarded on `work` like the
	     notice below, so a corpus that failed to sync leaves no empty rule. -->
	{#if work}
		<ReadingBar print={false} randomVerse />
	{/if}
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
