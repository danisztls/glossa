<script lang="ts">
	/**
	 * Scripture landing route (`/scriptura`). No dynamic params — the reader's
	 * current edition comes entirely client-side from `content.workIdFor`
	 * (see `$lib/content.svelte.ts`), same as any other stored-preference
	 * read anywhere on the site now that `ssr = false` (`+layout.ts`) makes
	 * every route client-rendered. Offers the reader's edition + its
	 * copyright notice and the canonical book/chapter structure via
	 * `BookChapterPicker`.
	 *
	 * IT OFFERS NO ENTRY POINT OF ITS OWN. A "continue where you left off"
	 * link and a "start reading" link sat above the book list until
	 * 2026-08-26. The first is the home page's job and the home page does it
	 * better — one row per work type, so a reader's Bible, Catechism and
	 * document positions are in one place rather than each behind its own
	 * index. The second answered a question this page already answers
	 * seventy-three times over, and answered it with Genesis 1, which is
	 * where a reader who wants the beginning would look anyway.
	 *
	 * THE EDITION PICKER AND THE ROLL SIT IN `ReadingBar`, the same sticky bar
	 * the scripture reader carries, rather than in this page's own body. Both
	 * belong to the whole page and not to any one line of it: which edition
	 * this is decides the book list beneath as much as it decides a chapter's
	 * text, and the roll opens a verse from that same edition. The roll is now
	 * the only entry point here that needs no decision, which is the other
	 * reason it belongs in a bar that stays put while the book list scrolls.
	 */
	import { content } from '$lib/content.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { getWork } from '$lib/corpus';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import { t } from '$lib/i18n.svelte';

	const workId = $derived(content.workIdFor('bible'));
	const work = $derived(workId ? getWork(workId) : undefined);
</script>

<svelte:head>
	<title>{t('bible.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
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

		{#if workId}
			<section aria-labelledby="books-heading">
				<h2 id="books-heading">{t('bible.landing.books')}</h2>
				<BookChapterPicker currentWorkId={workId} collapsible={false} />
			</section>
		{/if}
	</div>
	<!--
		AND NO SIDEBAR IN THE SECOND TRACK, deliberately. `.reading-layout` is
		here for its geometry alone: above 80rem it centres the reading column
		and the aside AS A UNIT (app.css), so a page laid out without it drew
		its column half an aside-plus-gutter further along, and moving between
		`/scriptura` and any chapter under it — which IS a `.reading-layout` —
		slid the whole page sideways under the reader. The grid declares both
		tracks whether or not anything occupies the second, so the column sits
		where every other reading route puts it with no element here at all.

		The three sibling indexes fill that track because each has a table of
		contents worth carrying alongside a long scroll. This one has no such
		tree — the corpus knows no grouping of books finer than the testament
		(`CanonicalBook` is an order and nothing else) — and the two rows that
		amounts to were offered here until 2026-08-28: a jump to the New
		Testament, on the one index short enough to need no jumping. A sidebar
		with nothing to navigate is furniture, so this track stays empty.
	-->
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

	/* The book list follows directly now that the entry-point links are gone;
	   the bottom margin the removed paragraph carried lives here instead. */
	.copyright-notice {
		margin: 0.15rem 0 2rem;
	}

	h2 {
		font-family: var(--font-serif);
	}
</style>
