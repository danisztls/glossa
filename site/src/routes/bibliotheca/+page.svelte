<script lang="ts">
	/**
	 * The library — every work on the site, and the reader's own place in it.
	 *
	 * ## Why this page exists, and why it is a superset rather than a category
	 *
	 * The nav bar was one item per work, so it grew by one every time the
	 * corpus did: six items by 2026-09-03, and the two newest works
	 * (`/doctrina-socialis`, `/ius-canonicum`) were named nowhere else on the
	 * site — not on the home page, not in the jump box. That is a bar with no
	 * end state, and Denzinger, the Roman Catechism, the Fathers and a second
	 * code each cost it another slot.
	 *
	 * Three umbrella labels were tried first and all three failed the same way
	 * ("Church", "Magisterium", "Teaching"): Scripture is transmitted by the
	 * Church, the Catechism is issued by the Church, the prayers are the
	 * Church's — a label every sibling satisfies carries no information and
	 * cannot tell a reader where to click.
	 *
	 * **`Library` escapes that only by meaning the whole catalogue rather than
	 * the rest.** A library contains the Bible too. Read that way it makes no
	 * taxonomic claim at all, the bar reads as four doors people want most plus
	 * the whole thing, and the overlap between a shortcut and the full index is
	 * ordinary navigation. (Redundancy is a defect only when two items reach
	 * the SAME place, which is why the layout has no "Home" entry beside the
	 * brand link.) So `/scriptura` and `/preces` are listed below even though
	 * both are one click away in the bar — leaving them out is what would turn
	 * this page into a leftovers bin.
	 *
	 * ## A catalogue, and three cards that are not works
	 *
	 * Questions, over `/quaestiones`; Bookmarks, over `/signata`; and the
	 * census, over `/bibliotheca/census`. None is this page's invention:
	 * `ShelfGrid.svelte` draws the whole bed, the home page renders the same
	 * one, and that component's docblock carries the argument for each card and
	 * for its position.
	 *
	 * **The census card is the one thing the two pages differ by, and it is a
	 * PROP** (`<ShelfGrid census />`) rather than a card appended here — which
	 * is the arrangement that component exists to have ended. How far the
	 * catalogue reaches is a fact about the catalogue, and this page is the
	 * catalogue; the home page offers a way in to the works, and a count is not
	 * one. It was a line under the grid until then, on the argument that a card
	 * would put it in the bed as though it were a work to read. What the line
	 * bought was a way in that a reader scanning a bed of cards does not see.
	 *
	 * It is still not in the footer's index, though `/signata` and `/colophon`
	 * both are: those are wanted from every page, this one is about the
	 * catalogue and is one click from it.
	 *
	 * **THE READING POSITIONS ARE NOT HERE, AND THE TRAIL IS THE ARGUMENT.**
	 * "Continue reading" was on the home page beside the doors, moved here on
	 * 2026-09-06 when it turned out to be a section EMPTY for every first-time
	 * reader, and moved on to `/signata` the same day. Marks and positions
	 * answer one question — take me back to where I was — and splitting them
	 * across two pages meant a returning reader had to know which of the two
	 * had kept their place. `/signata` holds both; this page links to it. The
	 * key was renamed twice on the way and is `reading.continue` now, named for
	 * the module rather than for a page, which is what stops the third rename.
	 *
	 * ## The catalogue is not this page's any more
	 *
	 * The seven entries moved to `$lib/shelves.ts` and the card to
	 * `ShelfCard.svelte` on 2026-09-06, when the home page's four doors were
	 * replaced by this same list — the rule that no card declares a sentence of
	 * its own, and the two exceptions the Catechism's pair costs, are argued
	 * there, beside the entries they govern.
	 *
	 * THE ASSEMBLY WENT THE SAME DAY, to `ShelfGrid.svelte`, and that is what
	 * ended the last thing the two pages disagreed about. They held a `<ul>`, an
	 * `{#each}` and a visibility gate each, and this one appended a Bookmarks
	 * card the home page's copy did not have — on the argument, recorded here,
	 * that this page is the catalogue of what the site HAS, marking included,
	 * where the home page is a way in to the WORKS. The distinction is real and
	 * it was not worth a card: a reader who arrives at the root and has marks
	 * wants them from there, and a catalogue that is the same on both pages
	 * EXCEPT for one card is a resemblance maintained by hand. What is still
	 * this page's own is the painting at the foot.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
	import { t } from '$lib/i18n.svelte';
	import { BANNERS, type Artwork } from '$lib/landing-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import ShelfGrid from '$lib/components/ShelfGrid.svelte';

	// The identification, plus the one interface word in it — composed here and
	// passed down, the arrangement `Plate.svelte` argues for: the page that
	// knows what a picture is is the page that writes the line.
	const creditOf = (art: Artwork) => art.credit + (art.detail ? ` (${t('art.detail')})` : '');
</script>

<svelte:head>
	<title>{t('nav.library')} — {t('home.title')}</title>
</svelte:head>

<div class="landing-column">
	<h1>{t('nav.library')}</h1>
	<p class="page-tagline landing-measure">{t('library.landing.tagline')}</p>

	<section aria-labelledby="catalogue-heading">
		<h2 id="catalogue-heading" class="visually-hidden">{t('nav.library')}</h2>
		<!--
			A GRID OF CARDS AND A LIST IN THE MARKUP. The shelves were stacked
			blocks down a 72rem column, which is a column of headings with an
			ocean to the right of each. `<ul>`/`<li>` rather than the `<section
			aria-labelledby>` each shelf used to be: what the reader is looking
			at is a list of cards, the `<h3>`s inside them still make the
			outline, and a `<section>` per card would be a landmark announcing
			nothing the heading does not.

			All of that is `ShelfGrid.svelte` now, list and cards and bed and
			the Bookmarks card at the end of them, and the home page renders
			the same component. What is this page's own is the `<section>`
			around it — the catalogue is this page's subject, where it is the
			home page's way in — and the painting at the foot.
		-->
		<ShelfGrid census />
	</section>

	<!--
		THE ONE PICTURE ON THIS PAGE, AND IT IS AT THE BOTTOM. Antonello's
		Jerome: a man alone in a room full of books, which is what a library is.
		It headed `/schola` until 2026-09-05 and moved here because that page is
		about being taught and this one is about what is on the shelf —
		`landing-art.ts` holds the swap and the credit.

		IT WAS THE MASTHEAD UNTIL 2026-09-06 and is a tailpiece now, which is a
		claim about what the page is for rather than about the painting: a reader
		arriving here wants the catalogue, and a 400px banner above the title put
		a picture between them and every door on the site. Decoration below the
		last card costs nothing and is still the right picture for the page.
		Behind the title was the other option and `landing-art.ts` rules it out —
		text over a painting has to hold its contrast across five appearance axes
		and does not need to.

		AND IT WAS RECROPPED THE SAME DAY, out of the 2.5:1 band a masthead
		wanted and into the study itself, which is a room and not a strip. What
		is drawn here is still a band — 300px, `--art-height` below — but it is
		a WINDOW on that file rather than the whole of it, and pressing the
		picture opens the rest over the page. So the two questions came apart:
		how much painting is worth shipping, and how much page a picture may
		take under a catalogue. `assets/README.md` has the box, `ArtFigure` the
		reasoning.

		No `eager`: nothing above the fold now, so it loads lazily and the
		shelves have the connection to themselves. The credit stays where
		`ArtFigure` puts it, one press behind the `info` glyph — decoration is
		about where the picture sits in the page's argument, not about dropping
		the only line on the site that says whose painting it is.
	-->
	<div class="tailpiece">
		<ArtFigure
			art={BANNERS.bibliotheca}
			credit={creditOf(BANNERS.bibliotheca)}
			label={t('art.about')}
			expandable
		/>
	</div>
</div>

<style>
	/*
	 * THE PICTURE IS A TAILPIECE, and the space above it is what says so. A
	 * banner is read as the page's subject; below the catalogue there is
	 * nothing left for it to be the subject OF, which is the whole point of
	 * moving it — the reader meets the shelves first and the painting after,
	 * the way a printed book closes a chapter with an ornament.
	 */
	.tailpiece {
		margin: 2.5rem 0 0;
		/*
		 * A BAND, AND THE NUMBER IS THIS PAGE'S TO SET. `ArtFigure` reads
		 * `--art-height` and crops to it with `object-fit: cover`; unset it
		 * draws the file whole, which is what `/schola`'s banner still does.
		 * At the file's own ratio this painting is 739px tall at the column's
		 * full width — half the page, under a catalogue the reader came for.
		 * 300 is an ornament; the rest of the picture is one press away, which
		 * is what makes cropping it here cost the reader nothing.
		 *
		 * Shorter on a phone because the box is narrower and `cover` takes its
		 * crop off the SIDES there: 300px against a 320px column would keep a
		 * vertical slice through the middle of the room and call it a band.
		 */
		--art-height: 300px;
	}

	@media (max-width: 40rem) {
		.tailpiece {
			--art-height: 180px;
		}
	}

	section {
		margin: 2.25rem 0;
	}

	/* THE ONE `h2` LEFT ON THIS PAGE IS HIDDEN, so the rule that set the
	   visible ones — serif, 1.3rem, on a rule — went with the sections it set.
	   It had two subjects, "Continue reading" and "Bookmarks"; the first is on
	   `/signata` now and the second is a card. `/signata` keeps the same
	   declarations, where they still have headings to set. */

	/* The catalogue's own heading is for a screen reader only: the page's `h1`
	   already names it, and a visible "Library" over a list on a page titled
	   "Library" is a rule with a word on it. The shelves still need a level to
	   hang from, so the heading exists rather than the shelves jumping to h2. */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	/* NOTHING HERE DRAWS A CARD OR THE BED IT LIES IN. `ShelfCard.svelte` is
	   the card, `.shelf-grid` in `components.css` is the grid — both shared
	   with the home page, which offers this same catalogue. What is left is
	   this page's own furniture. */
</style>
