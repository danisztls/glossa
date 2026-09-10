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
	 * So the whole bed is one object now. Both pages render this component, the
	 * visibility gate is called once, and a work's card reaches both pages by
	 * construction rather than by two edits and a comment asking for the
	 * second. What the two pages still differ by they differ by in a PROP, at
	 * the call site, where a reader of either page can see the declaration —
	 * see below.
	 *
	 * WHAT STAYS WITH THE PAGE is the element the grid sits in and what it is
	 * called: `/bibliotheca` wraps it in a `<section>` because the cards are
	 * that page's subject, the home page in a `<nav>` because they are its way
	 * in, and both give it a hidden `h2` to hang the cards' `<h3>`s from.
	 *
	 * ## The last three cards are not works, and only one is on every page
	 *
	 * Questions over `/quaestiones`, Bookmarks over `/signata`, then the census
	 * over `/bibliotheca/census`. Each sits IN the grid rather than above it
	 * because it is the same object at that size — a name, a mark, a sentence
	 * and a way in — and all three come after the works, because the works are
	 * what a catalogue is for. None has a row in `$lib/shelves.ts`, for the
	 * reason none needs one: a `Shelf` is a work type plus the strings its own
	 * landing page is titled by, and these have no work type to gate on and no
	 * work behind them. That is also why `ShelfCard` takes four strings and not
	 * a `Shelf`.
	 *
	 * QUESTIONS IS ON BOTH PAGES AND THE OTHER TWO ARE PROPS, which is the line
	 * this component draws: a topic list is a second INDEX over the works
	 * themselves, and the reader holding a sentence and no reference is exactly
	 * the reader the home page's catalogue is for.
	 *
	 * BOTH ARE OFF BY DEFAULT AND `/bibliotheca` ASKS FOR THEM. That page is
	 * the catalogue, and what the catalogue holds and how far it reaches are
	 * both facts about it. The home page is a way IN for a reader holding no
	 * address, and neither card is one: the census is a count rather than a
	 * door, and the reader's own shelf is EMPTY for everyone arriving for the
	 * first time — which is the test the home page's docblock states for every
	 * section it keeps, and the same test that moved Continue reading off it.
	 * The Bookmarks card was unconditional from 2026-09-06 to 2026-09-10, on
	 * the argument that a reader who arrives at the root and HAS marks is
	 * exactly the reader it is for; that reader is one press of the nav bar
	 * away, and the stranger the home page is arranged around was not.
	 *
	 * WHERE A CARD IS DRAWN IT IS DRAWN UNCONDITIONALLY ON THE READER, and
	 * Bookmarks is not gated on the store holding anything: a door that opens
	 * only once you have found the feature elsewhere is shut against exactly
	 * the reader who needed it. Nothing is behind it that the empty case cannot
	 * hold — `/signata` answers a reader with no marks in its own words
	 * (`bookmark.empty`, `bookmark.emptyHint`), which is a sentence, where a
	 * missing card is a silence. Questions' `hasTopics()` is the other kind of
	 * gate and the comment beside it says so: a card over a build with no topic
	 * list is a door onto an empty index, which is `visibleShelves()`'s test.
	 *
	 * IT CARRIED A ROW OF COUNTS UNTIL 2026-09-06, one chip per section of
	 * `/signata`, on the argument that the shape of what you have marked says
	 * more than a total. It says that to the person who wrote it: on the page
	 * it was `1 1` — bare numbers with nothing naming what they counted, in the
	 * slot where every other card has a sentence.
	 */
	import { visibleShelves } from '$lib/shelves';
	import { hasTopics } from '$lib/corpus';
	import ShelfCard from './ShelfCard.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/**
		 * The reader's own shelf and the count of this one. They are PROPS
		 * because they are the whole of what the two pages differ by, and the
		 * difference belongs in a declaration rather than in a card one page
		 * appends by hand, which is the arrangement this file exists to end.
		 * Off by default so that a third caller gets the catalogue and the way
		 * in to it and has to ask for the rest; the docblock above argues which
		 * page asks and why.
		 */
		bookmarks?: boolean;
		census?: boolean;
	}

	let { bookmarks = false, census = false }: Props = $props();

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
		QUESTIONS, AFTER THE WORKS AND BEFORE WHAT THE READER BROUGHT. It is a
		way into the same shelf rather than an eighth thing on it: every topic
		resolves to passages of the Catechism, the Compendium of the Social
		Doctrine and the Code, so this card opens onto three cards above it by
		a different index — the one a reader holding a sentence and no
		reference can actually use.

		It has no row in `$lib/shelves.ts` for Bookmarks' reason: a `Shelf` is
		a work type plus that work's own strings, and there is no work behind
		this one. It is GATED where Bookmarks is not, because there is a build
		behind it: `hasTopics()` is `visibleShelves()`'s test for a door, and a
		card over a build with no topic list is a door onto
		`quaestiones.landing.none`.

		`quaestiones.landing.cardTagline` and not the landing page's own: that
		one is a masthead's two sentences and was five lines in a 16rem card,
		which every row in this grid then pays for. Both strings are English
		outside `en` and `pt` — the whole section is, which is why the route is
		still out of `CHROME_PATHS` — and here that is one surface in one
		language rather than the mismatch `ccc.landing.pairTitle` warns about:
		the name, the sentence and the page they open are all English together.
	-->
	{#if hasTopics()}
		<ShelfCard
			href="/quaestiones"
			icon="circle-help"
			title={t('quaestiones.landing.title')}
			tagline={t('quaestiones.landing.cardTagline')}
		/>
	{/if}

	<!--
		The sentence is `/signata`'s own tagline, so this card obeys the rule
		the works' cards do — no entry in the catalogue writes a sentence of its
		own — rather than being the one that has to be looked at to be
		understood. One link and not a second copy of that page's list: this
		says what is there, and that page is the reading of it.
	-->
	{#if bookmarks}
		<ShelfCard
			href="/signata"
			icon="bookmark"
			title={t('bookmark.library')}
			tagline={t('bookmark.library.tagline')}
		/>
	{/if}

	<!--
		THE CENSUS, LAST OF ALL, and it is a card now where it was a line under
		the grid. The argument for the line was that a count is a fact about the
		shelf the cards sit on rather than a work to read — true, and as true of
		Bookmarks, which is a card in this bed on the page that asks for it.
		What the line actually bought was a way in that a reader scanning a bed
		of cards does not see.

		Its title and sentence are `/bibliotheca/census`'s own, so it obeys the
		rule every card here obeys: no entry in the catalogue writes a sentence
		of its own. That retired `census.link`, which was a third name for the
		same page.
	-->
	{#if census}
		<ShelfCard
			href="/bibliotheca/census"
			icon="chart-column"
			title={t('census.title')}
			tagline={t('census.tagline')}
		/>
	{/if}
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
