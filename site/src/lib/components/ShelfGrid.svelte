<script lang="ts">
	/**
	 * The catalogue itself: every card the site has, in one bed.
	 *
	 * ## Why the GRID is a component and not two `<ul>`s and a shared class
	 *
	 * `$lib/shelves.ts` took the list on 2026-09-06 and `ShelfCard.svelte` took
	 * the card, which left the two pages that draw the catalogue —
	 * `/bibliotheca`, whose subject it is, and the home page, which offers it to
	 * a reader holding no address — with an `<ul class="shelf-grid">`, an
	 * `{#each}` and a `visibleShelves()` call each. That is not a copy of a
	 * style, which a shared class fixes; it is a copy of the ASSEMBLY, and the
	 * two promptly disagreed about what the catalogue contains: `/bibliotheca`
	 * appended a Bookmarks card by hand and the home page did not, so the
	 * "same catalogue on both pages" the three files all claimed was false in
	 * the one card a reader cannot get to any other way.
	 *
	 * So the whole bed is one object now. Both pages render `<ShelfGrid />`,
	 * the visibility gate is called once, and a card added here is on both
	 * pages by construction rather than by two edits and a comment asking for
	 * the second.
	 *
	 * WHAT STAYS WITH THE PAGE is the element the grid sits in and what it is
	 * called: `/bibliotheca` wraps it in a `<section>` because the cards are
	 * that page's subject, the home page in a `<nav>` because they are its way
	 * in, and both give it a hidden `h2` to hang the cards' `<h3>`s from.
	 *
	 * ## The last card is not a work
	 *
	 * Bookmarks, over `/signata`. It sits IN the grid rather than above it
	 * because it is the same object at that size — a name, a mark, a sentence
	 * and a way in — and it is LAST because the works are what a catalogue is
	 * for. It has no row in `$lib/shelves.ts` for the reason it needs none: a
	 * `Shelf` is a work type plus the strings its own landing page is titled
	 * by, and this card has no work type to gate on and no work behind it. That
	 * is also why `ShelfCard` takes four strings and not a `Shelf`.
	 *
	 * IT IS UNCONDITIONAL. It was hidden while the bookmark store was empty
	 * until 2026-09-06, and hiding it read as tidiness and was the opposite:
	 * marking is one of the things the site does, and a door that opens only
	 * once you have found the feature elsewhere is shut against exactly the
	 * reader who needed it. Nothing is behind it that the empty case cannot
	 * hold — `/signata` answers a reader with no marks in its own words
	 * (`bookmark.empty`, `bookmark.emptyHint`), which is a sentence, where a
	 * missing card is a silence. The same argument put it on the home page.
	 *
	 * IT CARRIED A ROW OF COUNTS UNTIL 2026-09-06, one chip per section of
	 * `/signata`, on the argument that the shape of what you have marked says
	 * more than a total. It says that to the person who wrote it: on the page
	 * it was `1 1` — bare numbers with nothing naming what they counted, in the
	 * slot where every other card has a sentence.
	 */
	import { visibleShelves } from '$lib/shelves';
	import ShelfCard from './ShelfCard.svelte';
	import { t } from '$lib/i18n.svelte';

	const shelves = $derived(visibleShelves());
</script>

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
		The sentence is `/signata`'s own tagline, so this card obeys the rule
		the works' cards do — no entry in the catalogue writes a sentence of its
		own — rather than being the one that has to be looked at to be
		understood. One link and not a second copy of that page's list: this
		says what is there, and that page is the reading of it.
	-->
	<ShelfCard
		href="/signata"
		icon="bookmark"
		title={t('bookmark.library')}
		tagline={t('bookmark.library.tagline')}
	/>
</ul>

<style>
	/*
	 * THE BED, and it moved here from `.shelf-grid` in `components.css` when
	 * the grid stopped being something two pages assembled: a class in the
	 * shared sheet is what a pattern needs when several unrelated callers lay
	 * out their own lists, and there is exactly one caller of this now.
	 *
	 * `minmax(16rem, 1fr)` resolves to four columns at the full
	 * `--landing-width`, which is what a catalogue wants: the reader is meeting
	 * the whole holding at once, and eight cards down two columns is a
	 * screenful of scrolling to see a list that fits on a screen.
	 * `grid-auto-rows: 1fr` equalises the ROWS as well as the cards within one,
	 * which across four short columns buys a straight bottom edge.
	 *
	 * `min(16rem, 100%)` AND NOT A BARE `16rem`, which is the whole reason this
	 * idiom is written with a `min()` wherever it appears. A grid track's
	 * minimum is a floor and not a preference: at 390px of viewport a bare 24rem
	 * laid the home page's cards out 384px wide inside a 350px column and ran
	 * them off the side of the phone, with the section rules above them stopping
	 * at the column edge to prove it. The `100%` lets the single track collapse
	 * to whatever the column actually is, and changes nothing at any width where
	 * 16rem fits.
	 */
	.shelf-grid {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
		grid-auto-rows: 1fr;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
	}
</style>
