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
	 * ## A catalogue, and one card that is not a work
	 *
	 * The last card is Bookmarks, over a link to `/signata`. It sits IN the
	 * shelf grid rather than above it because it is the same object at that
	 * size: a name, a mark, a sentence, and a way in — and nothing about it
	 * needs to look different, since the thing that tells it apart is that it
	 * is the reader's own shelf and the sentence says so.
	 *
	 * IT IS UNCONDITIONAL, AND WAS HIDDEN WHILE THE STORE WAS EMPTY UNTIL
	 * 2026-09-06. Hiding it read as tidiness and was the opposite: this page is
	 * the catalogue of what the site HAS, marking is one of the things it does,
	 * and a door that opens only once you have already found the feature
	 * elsewhere is shut against exactly the reader who needed it. Nothing is
	 * behind it that the empty case cannot hold — `/signata` answers a reader
	 * with no marks in its own words (`bookmark.empty`, `bookmark.emptyHint`),
	 * which is a sentence, where a missing card is a silence.
	 *
	 * IT CARRIED A ROW OF COUNTS UNTIL 2026-09-06, one chip per section of
	 * `/signata` in that page's order, on the argument that the shape of what
	 * you have marked says more than a total about whether it is worth
	 * opening. It says that to the person who wrote it. On the page it was
	 * `1 1` — bare numbers with nothing naming what they counted, in the slot
	 * where every other card has a sentence, so the one card a reader could
	 * not read was the one about their own reading.
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
	 * The seven entries moved to `$lib/shelves.ts`, the card to
	 * `ShelfCard.svelte` and the grid to `.shelf-grid` in `components.css` on
	 * 2026-09-06, when the home page's four doors were replaced by this same
	 * list — the rule that no card declares a sentence of its own, and the two
	 * exceptions the Catechism's pair costs, are argued there, beside the
	 * entries they govern. What is still this page's is the Bookmarks card and
	 * the painting at the foot.
	 *
	 * WHAT THE HOME PAGE'S COPY LEAVES BEHIND IS THE READER'S OWN SHELF, and
	 * the reason is the section above rather than the store: this page is the
	 * catalogue of what the site HAS, marking included, where the home page's
	 * copy is a way in to the WORKS. `/signata` is one press from every page in
	 * the bar's Library door regardless.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
	import { t } from '$lib/i18n.svelte';
	import { BANNERS, type Artwork } from '$lib/landing-art';
	import { visibleShelves } from '$lib/shelves';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import ShelfCard from '$lib/components/ShelfCard.svelte';

	/**
	 * THE LIST AND THE CARD BOTH LIVE ELSEWHERE, since 2026-09-06: the home
	 * page offers this same catalogue where it used to offer four doors, so a
	 * copy of the seven entries here would be a copy to keep true every time a
	 * work is ingested. `$lib/shelves.ts` holds them and the argument for their
	 * order; `ShelfCard.svelte` holds the card the two pages drew twice.
	 */
	const shelves = $derived(visibleShelves());

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

			The card is `ShelfCard.svelte`, the entries are `$lib/shelves.ts` and
			the grid is `.shelf-grid` — all three shared with the home page,
			which offers this same catalogue to a reader who arrives holding no
			address. What is this page's own is the Bookmarks card below and the
			painting at the foot.
		-->
		<ul class="shelf-grid">
			{#each shelves as shelf (shelf.key)}
				<ShelfCard
					href={shelf.href}
					icon={shelf.icon}
					title={t(shelf.titleKey)}
					tagline={t(shelf.taglineKey)}
				/>
			{/each}

			<!--
				THE ONE CARD THAT IS NOT A WORK, and it is last because the
				catalogue is what the page is for. Same card, same glyph
				treatment, same sentence in the same place — and the sentence is
				`/signata`'s own tagline, so this card obeys the rule the other
				seven do rather than being the one that had to be looked at to be
				understood. One link and not a second copy of that page's list:
				this says what is there, and that page is the reading of it.

				No branch on the store, and there was one until 2026-09-06:
				a catalogue that omitted a shelf until the reader had already
				used it would be hiding the way in from the one person
				looking for it. The docblock has the rest.

				IT IS ALSO WHY `ShelfCard` TAKES STRINGS AND NOT A `Shelf`: this
				card has no work type, no landing page of its own in the
				catalogue's sense, and no row in `$lib/shelves.ts` to be given.
			-->
			<ShelfCard
				href="/signata"
				icon="bookmark"
				title={t('bookmark.library')}
				tagline={t('bookmark.library.tagline')}
			/>
		</ul>
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
