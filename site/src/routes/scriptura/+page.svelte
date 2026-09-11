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
	import { BANNERS, type Artwork } from '$lib/landing-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import { t } from '$lib/i18n.svelte';

	const workId = $derived(content.workIdFor('bible'));
	const work = $derived(workId ? getWork(workId) : undefined);

	// The identification, plus the one interface word in it — composed here and
	// passed down, the arrangement `Plate.svelte` argues for: the page that
	// knows what a picture is is the page that writes the line. This one is not
	// a detail, so the word is never added; the expression stays the other
	// landing pages' so the four cannot come to disagree about the line.
	const creditOf = (art: Artwork) => art.credit + (art.detail ? ` (${t('art.detail')})` : '');
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
			<ReadingBar print={false} textSize={false} randomVerse />
		{/if}
		<h1>{t('bible.landing.title')}</h1>
		<p class="page-tagline">{t('bible.landing.tagline')}</p>

		{#if work}
			<p class="edition-label label-micro">{work.title}</p>
			<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
		{/if}

		{#if workId}
			<section aria-labelledby="books-heading">
				<h2 id="books-heading">{t('bible.landing.books')}</h2>
				<BookChapterPicker currentWorkId={workId} collapsible={false} />
			</section>

			<!--
				Michelangelo's two hands are Genesis 2:7 — the first thing that
				happens in the first of the seventy-three books listed above — and
				what crosses the gap between them is a word, which is what a text
				is. `landing-art.ts` holds the credit and the case.

				It closes the page rather than bridging the testaments, which is
				where this picture was first wanted. The seam between the two is
				inside `BookChapterPicker`, a component with four call sites, and
				it is a seam in the CANON rather than in this page — a picture put
				there is on three other pages that never asked for one. Genesis is
				also the wrong picture for a bridge: it belongs at the start of
				what is above it, not between its halves.

				Guarded on `workId` with the book list, so a corpus that failed to
				sync leaves no picture hanging under nothing.
			-->
			<div class="tailpiece">
				<ArtFigure
					art={BANNERS.scriptura}
					credit={creditOf(BANNERS.scriptura)}
					label={t('art.about')}
					expandable
				/>
			</div>
		{/if}
	</div>
	<!--
		AND NO SIDEBAR IN THE THIRD TRACK, deliberately. `.reading-layout` is
		here for its geometry alone: above 80rem it places the reading column
		in the middle of three (app.css), so a page laid out without it drew
		its column elsewhere, and moving between `/scriptura` and any chapter
		under it — which IS a `.reading-layout` — slid the whole page sideways
		under the reader. The grid declares all three tracks whether or not
		anything occupies the apparatus track or the aside's, so the column
		sits where every other reading route puts it with no element here at
		all.

		The three sibling indexes fill that track because each has a table of
		contents worth carrying alongside a long scroll. This one had no such
		tree until 2026-08-29 — the corpus knows no grouping of books finer
		than the testament (`CanonicalBook` is an order and nothing else) — and
		the two rows that amounted to were offered here until 2026-08-28: a
		jump to the New Testament, on the one index short enough to need no
		jumping. A sidebar with nothing to navigate is furniture, so this track
		stayed empty.

		IT STAYS EMPTY, but the reason has changed and is now a judgment rather
		than a fact. `bible-groups.ts` gives the picker nine named groups, so
		there are nine rows to offer where there were two. What there still is
		not is a long scroll to escape: the grouped grid is the same 73 chips
		it always was, laid out in columns, and every group heading is already
		on the screen with its books under it. A sidebar duplicating headings
		the reader can see is still furniture. If the groups ever gain
		descriptions and the page becomes a scroll, that is when this changes.
	-->
</div>

<style>
	.edition-label {
		margin: 1.5rem 0 0;
		font-size: 0.85rem;
	}

	/* The book list follows directly now that the entry-point links are gone;
	   the bottom margin the removed paragraph carried lives here instead. */
	.copyright-notice {
		margin: 0.15rem 0 2rem;
	}

	/* The work's own name, on a surface that is otherwise a door. `h2` above
	   the list is our word `Books` and takes the interface face with the rest
	   of the page. */
	h1 {
		font-family: var(--font-serif);
	}

	/*
	 * NO `--art-height`, so the file is drawn at its own 2.15:1 and nothing is
	 * cropped at any width — `/schola`'s arrangement rather than the two other
	 * tailpieces'. Not generosity: the other two sit in `.landing-column`,
	 * which is 72rem of rem, and a height in rem can be derived against a width
	 * in rem. This column is `--content-width`, a MEASURE — some 62 characters
	 * of prose, moving with the reader's text-size setting — so there is no one
	 * width to derive against, and a band cropped to a fixed height would keep
	 * a different share of the picture at every setting. A ratio holds at all
	 * of them.
	 *
	 * The file is the panel entire and wants no cropping anyway; what a press
	 * opens is the vault around it, which is a second file rather than the rest
	 * of this one (`landing-art.ts`'s `whole`).
	 */
	.tailpiece {
		margin: 2.5rem 0 0;
	}
</style>
