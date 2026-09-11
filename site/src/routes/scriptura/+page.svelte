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
	 *
	 * IT IS A LANDING PAGE AND IS LAID OUT AS ONE, since 2026-09-11:
	 * `.landing-column`, the shape `/bibliotheca` and `/schola` take, and no
	 * `.reading-layout` at all. What is on it is a grid of 73 chips under nine
	 * headings, which is doors and not prose, and `--content-width` is a count
	 * of CHARACTERS — so the index was being set in a column sized for a
	 * sentence, at less than half the width the same grid gets on the home
	 * page. Only the tagline and the copyright notice are prose, and they take
	 * `.landing-measure`, which is the measure without the column.
	 *
	 * **THE COST IS THE ONE THE REMOVED COMMENT NAMED, AND IT IS PAID.** The
	 * grid put this column where a chapter's reading column is, so stepping
	 * from here into a chapter moved nothing sideways; a 72rem column centred
	 * on the page does not line up with a 56rem one offset by an aside lane,
	 * and the step is now visible. A landing page and a reading page are
	 * different shapes, which is the thing that argument was trading away.
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
	// knows what a picture is is the page that writes the line.
	const creditOf = (art: Artwork) => art.credit + (art.detail ? ` (${t('art.detail')})` : '');
</script>

<svelte:head>
	<title>{t('bible.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="landing-column">
	<!-- Edition and roll, and nothing else: there is no chapter here to
	     bookmark or print — see `ReadingBar`. Guarded on `work` like the
	     notice below, so a corpus that failed to sync leaves no empty rule.
	     The bar is not a reading-grid fixture — `/preces` without a table of
	     contents already carries one outside `.reading-layout` — so moving
	     this page to a landing column costs it nothing. -->
	{#if work}
		<ReadingBar print={false} textSize={false} randomVerse />
	{/if}
	<h1>{t('bible.landing.title')}</h1>
	<p class="page-tagline landing-measure">{t('bible.landing.tagline')}</p>

	{#if work}
		<p class="edition-label label-micro">{work.title}</p>
		<p class="copyright-notice landing-measure"><CopyrightNotice manifest={work} /></p>
	{/if}

	{#if workId}
		<section aria-labelledby="books-heading">
			<h2 id="books-heading">{t('bible.landing.books')}</h2>
			<!--
				THE PICTURE HANGS ON THE SEAM BETWEEN THE TESTAMENTS, which is
				the one boundary in this list that is a fact about the canon
				rather than about the control — so it is the picker that offers
				the slot, as a snippet, and the three other call sites pass
				nothing. A reading sidebar does not get a painting because a
				landing page wanted one.

				Michelangelo's two hands are Genesis 2:7, the first thing that
				happens in the first of the books above, and they do not touch:
				what crosses the gap is a word, which is what a text is. On a
				seam that reading does double duty, the gap being the one
				between the Testaments as well. `landing-art.ts` holds the
				credit and the case.

				Inside the `workId` guard with the list it divides, so a corpus
				that failed to sync leaves no picture dividing nothing.
			-->
			<BookChapterPicker currentWorkId={workId} collapsible={false}>
				{#snippet seam()}
					<div class="seam-art">
						<ArtFigure
							art={BANNERS.scriptura}
							credit={creditOf(BANNERS.scriptura)}
							label={t('art.about')}
							expandable
						/>
					</div>
				{/snippet}
			</BookChapterPicker>
		</section>
	{/if}
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
	 * A PICTURE IN THE MIDDLE OF A LIST IS A DIVIDER, AND A DIVIDER IS SHORT.
	 * The other two bands close their page, so they may take the room a
	 * tailpiece takes; this one stands between 46 books and 27 and everything
	 * below it is still the index. At the column's full 69.5rem the file's own
	 * 2.15:1 would draw it 32rem tall — a wall the reader has to scroll past
	 * to reach Matthew.
	 *
	 * 11rem is the number, and what it keeps is the argument for it: `cover`
	 * crops top and bottom at this width, and a third of the panel's height
	 * taken from the middle is exactly the two hands, Adam's head and shoulder,
	 * and God's arm out of the mantle. The half that goes is sky and Adam's
	 * legs. A frieze of the reaching is a better seam than the whole scene
	 * shrunk, and it is the one crop of this picture that everybody already
	 * knows.
	 *
	 * NO BREAKPOINT, which the other two both need and this one does not.
	 * Below 23.6rem of column — 11rem times the file's ratio — the box is
	 * narrower than the scaled file is wide, so `cover` switches to cropping
	 * the ENDS and the band becomes nearly the whole panel: a phone gets more
	 * picture rather than less, with no rule to say so. `/quaestiones` needs
	 * its shorter mobile band because its file is 4.21:1 and that crossover
	 * never arrives.
	 */
	.seam-art {
		--art-height: 11rem;
	}
</style>
