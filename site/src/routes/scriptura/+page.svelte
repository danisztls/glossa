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
		<!-- NO HEADING AND NO SECTION AROUND THE LIST. "Books" named what the
		     page already is: the title says Bible, the tagline says what is
		     under it, and then a heading announced the one thing on the page.
		     With the heading gone the `<section aria-labelledby>` had nothing
		     to be named by, and a landmark that announces itself as untitled
		     is worse than no landmark — the picker's own OLD TESTAMENT and NEW
		     TESTAMENT headings are what put this list in the outline, and they
		     did that already. -->
		<BookChapterPicker currentWorkId={workId} collapsible={false} />

		<!--
			Michelangelo's two hands are Genesis 2:7 — the first thing that
			happens in the first of the books above — and they do not touch:
			what crosses the gap is a word, which is what a text is.
			`landing-art.ts` holds the credit and the case.

			IT CLOSES THE PAGE RATHER THAN DIVIDING THE LIST, which is where it
			hung for part of 2026-09-11. A picture between the Testaments reads
			on the seam and costs the list its continuity — 73 books are one
			canon, and a band across the middle of them is a page break the
			corpus does not have. `/bibliotheca` and `/quaestiones` close on
			theirs for the same reason, and this page now has the same shape as
			both.

			Inside the `workId` guard with the list it follows, so a corpus that
			failed to sync leaves no picture under nothing.
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
	 * A TAILPIECE MAY TAKE THE ROOM A TAILPIECE TAKES, which is what moving
	 * the picture off the seam and down here bought. A divider had to stay
	 * short — everything under it was still the index — and this has nothing
	 * under it, so the band goes to 18rem where it was 13. At the column's
	 * full 69.5rem the file's own 2.15:1 would still draw it 32rem, half a
	 * page under a list somebody came to read, which is `/bibliotheca`'s
	 * argument for 300px and holds here at a different number.
	 *
	 * WHICH BAND IS A SEPARATE CHOICE FROM HOW TALL, and centring gets it
	 * wrong at every height this slot allows. `cover` takes the middle, and
	 * the middle of this panel is the two hands, Adam's head, and God's ARM
	 * with his head above the frame — one figure with a face and one without,
	 * which reads as a crop that missed whatever it was aiming at. Measured
	 * rather than guessed: at 18rem centred, God is still decapitated.
	 *
	 * So the window is raised to `23%` of the overflow rather than the
	 * middle's 50%, which brings his head and beard down into the frame and
	 * takes sky instead. What the extra 5rem of height then buys is the rest
	 * of him — at 13rem the two heads and the hands only just fitted between
	 * them, and here the mantle and the putti come back with room to spare.
	 * The height is how much picture; the position is which picture.
	 *
	 * NO BREAKPOINT, which the other two both need and this one does not, and
	 * the raised window costs nothing on a phone either. Below 38.7rem of
	 * column — 18rem times the file's ratio — the box is narrower than the
	 * scaled file is wide, so `cover` switches to cropping the ENDS: the
	 * vertical overflow goes to zero, `--art-position`'s Y stops applying, and
	 * the band becomes the whole height of the panel. A phone gets more
	 * picture rather than less, with no rule to say so. `/quaestiones` needs
	 * its shorter mobile band because its file is 4.21:1 and that crossover
	 * never arrives.
	 */
	.tailpiece {
		margin-block-start: 2.5rem;
		--art-height: 18rem;
		--art-position: center 23%;
	}
</style>
