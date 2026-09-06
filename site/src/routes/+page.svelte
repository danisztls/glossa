<script lang="ts">
	/**
	 * The home page: today, the doors, and the notation.
	 *
	 * ## What it was, and why that could not absorb anything more
	 *
	 * Until 2026-09-04 this page rendered the Bible's complete table of
	 * contents (`BookChapterPicker`, grid variant, nine named groups,
	 * `collapsible={false}`) and then the Catechism's complete two-level
	 * outline, and those two blocks were most of its height. Prayers got five
	 * chips underneath and the Magisterium a list of pontificates with counts;
	 * by the time the page reached the bottom there was no room left, which is
	 * why nothing ingested afterwards was ever added to it — neither the
	 * Compendium of the Social Doctrine nor the Code of Canon Law was named
	 * here at all.
	 *
	 * **That was a WEIGHT problem and not a nesting one**, which is why
	 * rearranging the nav into categories kept feeling like the fix and kept
	 * not being one. The full indices already exist, one per section, at
	 * `/scriptura`, `/catechismus`, `/documenta`, `/doctrina-socialis`,
	 * `/ius-canonicum` and `/preces`; reproducing two of them here was the
	 * whole imbalance. `/bibliotheca` now holds the map, so this page can stop
	 * being an index and be what a reader arriving with no address can act on.
	 *
	 * ## IT IS THE THREE WAYS IN, IN THE ORDER THEY ARE NEEDED (2026-09-06)
	 *
	 * `docs/research/organization.md` §The three ways in names them: a reader
	 * arrives **by date**, **by question**, or **by address**. The page held
	 * the first two and never said the third existed — so the notation this
	 * whole corpus is addressed by was a thing you found out about by pressing
	 * `/` on a hunch. The three sections below are those three ways, and the
	 * order is deliberate: the day is the only surface anyone returns to
	 * daily, the doors are for the reader who holds no address at all, and the
	 * specimens are last because the reader who already knows `CCC 1234` types
	 * it into the box without reading this page.
	 *
	 * WHAT IT BORROWS FROM `/schola` AND `/bibliotheca`, which are the same
	 * kind of page and were the model for this pass:
	 *
	 *   - **A tagline under the title.** Both open with a name and one
	 *     sentence saying what is behind it, and this page opened with a name
	 *     alone — a reader who has never heard of the site got a blackletter
	 *     wordmark and a liturgical day, and nothing that said what it was.
	 *   - **Ruled section headings.** Every heading on this page was
	 *     `visually-hidden`, which is right when a section holds one titled
	 *     object and wrong when it holds a grid of four. Two of the three are
	 *     visible now and the day's is not.
	 *   - **A mark beside the name**, from the vocabulary `/schola`'s own rows
	 *     are drawn with — `scroll`, `flame`, `book-open` are that page's
	 *     assignments for these three works, reused rather than re-chosen —
	 *     set in `/bibliotheca`'s `1lh` box rather than on a baseline.
	 *   - **The inert specimen chip**, `.cite-example` there and `.specimen`
	 *     here, for the same reason that page gives: it teaches a SHAPE.
	 *
	 * WHAT IT DELIBERATELY DOES NOT BORROW IS THE PAINTING. `/schola` and
	 * `/bibliotheca` each open on one, and `landing-art.ts` holds the two
	 * that survived plus the crop lines for four that did not. The wordmark
	 * is already this page's display object at `clamp(3.5rem, 13vw, 5.5rem)`,
	 * and a band of oil paint under a 5.5rem blackletter lockup is two
	 * mastheads arguing. The home page is the one address where the name IS
	 * the subject.
	 *
	 * ## Today leads, and is the one thing here that is not a door
	 *
	 * `audiences.md` §2 is the reader the site could not answer at all — a
	 * priest arrives with a DATE, and until the calendar landed nothing on the
	 * site was addressable that way. It is also the only daily-return surface
	 * here: every other use is episodic (arrive with a citation, read, leave).
	 * So the day leads, and it leads UNRULED — it sits between the tagline and
	 * the first heading, in the slot the other two landing pages give their
	 * banner. Its `h2` stays `visually-hidden` for the reason it always was:
	 * the card carries the celebration's name as its own heading, and a rule
	 * reading "Today" above it is a second title over one object.
	 *
	 * TWO THINGS IT DELIBERATELY DOES NOT DO. It shows the GENERAL calendar,
	 * not the reader's country: the territory lives in `/calendarium`'s `?c=`
	 * and is not persisted anywhere, so this page has nothing to read and
	 * guessing from a browser locale would put a national solemnity in front of
	 * someone who never chose that country. And it does not print the day's
	 * readings — the lectionary is a work this corpus does not hold, and the
	 * cycle letters on `/calendarium` are stated as facts about the year rather
	 * than dressed up as an answer the site cannot give.
	 *
	 * ## Continue reading is on `/signata`, and is not coming back here
	 *
	 * It was on this page and on `/bibliotheca` both, capped at four here and
	 * uncapped there, on the reasoning that an entrance may show a little of
	 * what the record holds. What that actually produced was a section between
	 * the day and the doors that is EMPTY for every reader who has not been
	 * here before — so the one page a stranger arrives at was arranged around
	 * a state only a returning reader has, and the returning reader got a
	 * truncated copy of a list one click away.
	 *
	 * IT WENT TO `/bibliotheca` AND THEN STRAIGHT ON TO `/signata`, both on
	 * 2026-09-06, and that page's docblock has the second half of the reason:
	 * marks and positions answer one question, and splitting them over two
	 * pages made a returning reader guess which had kept their place. The
	 * consequence for THIS page is the durable one — everything on it is true
	 * on a first visit, which is the test a home page's sections have to pass
	 * and the notation section below passes too.
	 *
	 * ## What this page costs in translation, and why it is in `CHROME_PATHS`
	 *
	 * Three keys: `home.tagline`, `home.doors.heading`, `home.find.heading`.
	 * Everything else is a name or a sentence written for another page in all
	 * thirty-seven languages — the doors are `nav.*` over each destination's
	 * own tagline, and the line under the specimens is `jumpbox.hint`. `en.ts` carries the argument for
	 * keeping `/` on the published list anyway, which is that the root has no
	 * usable remedy: `route-manifest.ts` withholds a page rather than claim it
	 * in a language it is not written in, and withholding the home page costs
	 * a sitemap row and an `hreflang` cluster that every other page's ranking
	 * leans on.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
	import { onMount } from 'svelte';
	import { getBook, listWorksOfType } from '$lib/corpus';
	import { bookAbbrev, grammarSurface } from '$lib/refs-grammar';
	import { content } from '$lib/content.svelte';
	import { liturgicalDay, toDayNumber, type LiturgicalDay } from '$lib/calendar';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/components/Icon.svelte';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { WorkType } from '$lib/types';

	/**
	 * The four doors, in the bar's order minus the Calendar, which is the card
	 * above rather than a link.
	 *
	 * Every name and sentence is the key its own landing page is titled and
	 * described by — the rule `scripts/route-titles.mjs` follows for the
	 * `<head>` and `/bibliotheca` for its shelves. A home page that paraphrased
	 * the pages it points at would be a third set of sentences to translate
	 * into 37 languages and a third to keep true.
	 *
	 * THE ICONS ARE `/schola`'s OWN and were not chosen again here. That page
	 * draws `scroll` for Scripture, `flame` for the prayers and `book-open`
	 * for the row that links to `/bibliotheca`; taking a second opinion on any
	 * of the three would mean the same work wearing two marks on two pages.
	 * Only the fourth is not `/schola`'s own, because that page illustrates
	 * every row but itself. It is `graduation-cap`, drawn for `/bibliotheca`'s
	 * Learn shelf on the day that shelf was unfolded into one card per work —
	 * so the glyph was already chosen for this exact idea and was left with
	 * nothing to mark. Reusing it is the rule the other three follow.
	 *
	 * NO `type` GATE, WHICH THE OTHER TWO LISTS ON THIS PAGE BOTH HAVE. A
	 * door is a page and not a work: `/bibliotheca` and `/schola` hold no
	 * corpus text at all and are correct in an empty build, and `/scriptura`
	 * and `/preces` are the two routes a partial sync is likeliest to be
	 * synced FOR. Hiding a door because a work type is missing would take the
	 * reader's way to the page that says the work is missing.
	 */
	const DOORS = [
		{
			href: '/scriptura',
			icon: 'scroll' as IconName,
			titleKey: 'nav.bible',
			taglineKey: 'bible.landing.tagline'
		},
		{
			href: '/preces',
			icon: 'flame' as IconName,
			titleKey: 'nav.prayers',
			taglineKey: 'prayers.landing.tagline'
		},
		{
			href: '/bibliotheca',
			icon: 'book-open' as IconName,
			titleKey: 'nav.library',
			taglineKey: 'library.landing.tagline'
		},
		// Last here because it is last on the bar, and the two orders must not
		// disagree — this block IS the bar with room to say what each door
		// holds. It pointed at `/catechismus` with the Catechism's own tagline
		// until 2026-09-04, when Learn got a page of its own (`/schola`).
		{
			href: '/schola',
			icon: 'graduation-cap' as IconName,
			titleKey: 'nav.learn',
			taglineKey: 'schola.landing.tagline'
		}
	] as const;

	const has = (type: WorkType) => listWorksOfType(type).length > 0;

	// --- The third way in ------------------------------------------------------
	//
	// The reader's own Bible, resolved for one purpose: the abbreviation and
	// the chapter/verse separator the first specimen is drawn with. This page
	// addresses no text — the chips are inert and the doors open on landing
	// pages — so nothing else here reads the content store.
	const bibleWorkId = $derived(content.workIdFor('bible'));
	const bibleLang = $derived(content.langFor('bible'));

	/**
	 * THE BIBLE'S SPECIMEN IS DERIVED AND THE OTHERS ARE WRITTEN, which is
	 * `/schola`'s split and holds for its reason: the Bible's citation form is
	 * the one that changes by language. The abbreviation comes from this
	 * language's own citation table, falling back to the reader's edition's
	 * name for the book, and the separator from the same grammar the parser
	 * uses — so a Portuguese reader is shown `Jo 3,16` and not somebody else's
	 * colon.
	 *
	 * `osis` is LOWER-CASE here and everywhere in this corpus (`john`, not the
	 * OSIS standard's `John`): `bookAbbrev` and `getBook` both answer
	 * `undefined` for a spelling they do not hold, so the wrong case fails by
	 * drawing no specimen at all rather than by erring.
	 */
	const bibleSpecimen = $derived.by((): string | undefined => {
		const book = bibleWorkId ? getBook(bibleWorkId, 'john') : undefined;
		if (!book) return undefined;
		const name = bookAbbrev('john', bibleLang) ?? book.name;
		return `${name} 3${grammarSurface(bibleLang).chapterVerseSep}16`;
	});

	/**
	 * THREE SHAPES, NOT A CATALOGUE. `/schola` prints one specimen per work
	 * because that page IS the list of works; this one is showing that the box
	 * at the top of every page reads a notation at all, and three is what it
	 * takes to show that the notations differ: a book with a chapter and a
	 * verse, a siglum with a paragraph running unbroken through a whole book,
	 * and a code cited by canon. A fourth of a shape already on the row would
	 * be a longer row teaching nothing more.
	 *
	 * THE NUMBERS ARE REPRESENTATIVE AND THE CHIPS ARE INERT, by the direction
	 * `/schola` records for its own (2026-09-05): a live `CCC 1234` sends a
	 * reader who is being taught a FORM into the middle of a work they did not
	 * choose, and makes the number look as though it had been chosen for them.
	 * The shape of the number is part of the lesson — four figures for a work
	 * with thousands of paragraphs, three for a code of canons — which is why
	 * `jumpbox.placeholder` shows `ccc 1234` too.
	 *
	 * Each is gated on the work being in this build, the same test the reading
	 * rows use: the vitest fixtures and a partial sync both carry some works
	 * and not others, and a specimen for a work the box cannot resolve is an
	 * example that does not work.
	 */
	const specimens = $derived(
		[
			{ key: 'bible', text: bibleSpecimen },
			{ key: 'catechism', text: has('catechism') ? `${t('ccc.abbrev')} 1234` : undefined },
			{ key: 'law', text: has('canon-law') ? `${t('canonLaw.canon')} 123` : undefined }
		].filter((row): row is { key: string; text: string } => row.text !== undefined)
	);

	/** Today in the READER'S zone, which is the zone they keep the feast in —
	 *  the same basis `/calendarium` computes on, and the one place in this
	 *  codebase where local time is correct. */
	function localToday(): number {
		const now = new Date();
		return toDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate());
	}

	// Read on mount rather than derived: it is the client's clock, which does
	// not exist while the shell is being served. A prerendered "today" would be
	// the day this build was made.
	let day: LiturgicalDay | undefined = $state();

	onMount(() => {
		day = liturgicalDay(localToday());
	});
</script>

<div class="landing-column">
	<!-- The wordmark IS the h1's text — see Wordmark.svelte. `home.title` stays
	     the plain-text form of the same name, used in every page's <title>. -->
	<h1 class="site-title"><Wordmark /></h1>
	<p class="page-tagline landing-measure">{t('home.tagline')}</p>

	{#if day}
		<section class="today" aria-labelledby="today-heading">
			<h2 id="today-heading" class="visually-hidden">{t('calendar.today')}</h2>
			<LiturgicalDayCard {day} />
			<a class="today-more" href="/calendarium">{t('calendar.title')} &rarr;</a>
		</section>
	{/if}

	<nav class="doors" aria-labelledby="doors-heading">
		<h2 id="doors-heading">{t('home.doors.heading')}</h2>
		<ul>
			{#each DOORS as door (door.href)}
				<li>
					<a class="door" href={door.href}>
						<!--
							THE MARK AND THE NAME ARE ONE LINE, which is `.shelf-heading`'s
							arrangement on `/bibliotheca` and not a second idea: the icon
							belongs beside the first line of the title rather than centred
							against the title AND its sentence together. A SPAN and not an
							`<h3>`, which is the one place the two cards differ — that page
							is a catalogue of seven named works and a reader moving by
							heading should meet all seven, where this is a `<nav>` of four
							doors whose link text is already the name.

							Decorative, so `aria-hidden` — which `Icon.svelte` enforces
							rather than offers. The name beside it is the name.
						-->
						<span class="door-heading">
							<span class="door-icon"><Icon name={door.icon} /></span>
							<span class="door-title">{t(door.titleKey)}</span>
						</span>
						<!-- `{@html}` on the same terms as `/catechismus`'s masthead:
						     every string here is a literal in a checked-in dictionary,
						     named by a key in this file, and nothing is passed through
						     from the corpus or from a URL. -->
						<span class="door-tagline">{@html t(door.taglineKey)}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	{#if specimens.length > 0}
		<section class="find" aria-labelledby="find-heading">
			<h2 id="find-heading">{t('home.find.heading')}</h2>
			<!--
				NOT LINKS, AND NOT A LIVE FIELD EITHER. The jump box is a control
				in the header of every page rather than an address, so this
				section describes it the way `/schola`'s guide describes the
				settings menu and the language switcher — there is nothing for a
				link to open. Reaching into `JumpBox` to open it from here would
				give one page a private door into a component the whole site
				shares, to save a reader one keystroke that the line underneath
				already names.
			-->
			<ul class="specimens">
				{#each specimens as specimen (specimen.key)}
					<li class="specimen">{specimen.text}</li>
				{/each}
			</ul>
			<!-- `jumpbox.hint` rather than a fourth new string, and it is the
			     right sentence rather than the cheap one: it names both
			     shortcuts, and it is already the line the shortcut sheet shows
			     for this control. -->
			<p class="find-hint">{t('jumpbox.hint')}</p>
		</section>
	{/if}
</div>

<style>
	/*
	 * The h1 is a container for the wordmark, so it carries none of its own
	 * type: size and leading live in Wordmark.svelte, where the two lines are
	 * proportioned against each other. Only the block spacing belongs here —
	 * the mark's own line-height is under 1, so the default h1 margin would
	 * leave the tagline sitting too close under "Catholica".
	 */
	.site-title {
		margin-block: 0 0.8rem;
		font-size: inherit;
		line-height: inherit;
	}

	section,
	.doors {
		margin: 2.25rem 0;
	}

	/*
	 * The ruled heading `/schola` and `/bibliotheca` both set their sections
	 * with, down to the declaration.
	 *
	 * IT WAS DELETED ON 2026-09-06 AND IS BACK THE SAME DAY, which is worth
	 * the two lines because the deletion was right. Once "Continue reading"
	 * left this page, every heading on it was `visually-hidden` and this rule
	 * styled nothing — a rule with no subject, correctly removed. What brings
	 * it back is that the page now HAS two sections a reader can see the names
	 * of, the doors and the notation, and neither is a single titled object.
	 * The day's heading stays hidden for the reason it always did, so the rule
	 * is again one short of the headings on the page.
	 */
	section h2,
	.doors h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 0 0 1rem;
	}

	/* The day's card already carries the celebration's name as its own
	   heading, so a rule reading "Today" above it would be a second title over
	   one object. The heading exists for the document outline and nothing
	   else. */
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

	/*
	 * THE DAY SITS IN THE SLOT THE OTHER TWO LANDING PAGES GIVE THEIR BANNER —
	 * under the title and its sentence, above the first rule. So it takes the
	 * tighter margin a masthead takes there (`1.5rem`) rather than the
	 * `2.25rem` that separates two ruled sections from each other.
	 */
	.today {
		margin-top: 1.5rem;
	}

	.today-more {
		display: inline-block;
		margin-top: 0.6rem;
		font-size: 0.9rem;
		text-decoration: none;
	}

	/* The one link here that is a sentence rather than a target, so it promotes
	   the way a sentence's link does. The arrow stays put: it is part of the
	   label, and a link that moves under the pointer is a target that moves
	   under the pointer. */
	.today-more:hover,
	.today-more:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	/* --- The doors ---------------------------------------------------------
	 *
	 * A `<nav>` because that is what it is: the same five choices the header
	 * offers, given room to say what each one holds. It is the header's row
	 * that has to be terse, not this.
	 *
	 * THEY STAY CARDS, WHERE `/schola`'s ROWS ARE NOT, and that page's own
	 * comment is the argument for both: a grid of doors means the reader is
	 * being asked to CHOOSE BETWEEN them, which is false of a reference list
	 * read in sequence and is exactly true here. Four boxes is also the count
	 * that makes it work — sixteen of them is what made the guide's rows read
	 * as a dashboard.
	 *
	 * TWO COLUMNS AT MOST, AND THE MINIMUM IS WHAT ENFORCES IT. The track was
	 * `minmax(15rem, 1fr)`, which resolves to FOUR columns at the full
	 * `--landing-width` — and the four doors do not carry four comparable
	 * sentences. Each tagline is the one its own landing page is described by
	 * (§DOORS), and those were written for the top of a page rather than for a
	 * card: `bible.landing.tagline` is one line and `schola.landing.tagline`
	 * is five, so a row of four equal-height cards was sized by the longest
	 * and left the first two three-quarters empty.
	 *
	 * `24rem` is derived and not chosen by eye. `--landing-width` is 72rem and
	 * the column pads 1.25rem either side, so 69.5rem is the widest this grid
	 * is ever laid out in; three tracks would need 3 x 24rem + 2 x 0.75rem =
	 * 73.5rem and cannot fit, and two need 48.75rem and fit from about 50rem
	 * of viewport upward. So the grid is 2 x 2 wherever there is room and one
	 * column on a phone, with no breakpoint to keep in step — and re-deriving
	 * it is the required move if `--landing-width` changes.
	 *
	 * `min(24rem, 100%)` AND NOT A BARE `24rem`, which is the whole reason
	 * this idiom is written with a `min()` wherever it appears. A grid track's
	 * minimum is a floor and not a preference: at 390px of viewport the cards
	 * were laid out 384px wide inside a 350px column and ran off the side of
	 * the phone, with the section rules above them stopping at the column edge
	 * to prove it. The `100%` lets the single track collapse to whatever the
	 * column actually is, and changes nothing at any width where 24rem fits.
	 */
	.doors ul {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(24rem, 100%), 1fr));
		/* NO `grid-auto-rows: 1fr`, WHICH `/bibliotheca` DOES SET — the second
		   place the two grids part company, and for the same underlying reason
		   as the first. That rule equalises rows, not cards: the two doors in
		   a row already stretch to each other, and `1fr` additionally makes
		   row one as tall as row two. Across that page's four short columns
		   that buys a straight bottom edge; here it makes Bible and Prayers as
		   tall as Learn's five-line sentence, and at one column — every phone
		   — it makes all four that tall, which is most of a screen of empty
		   card. */
		gap: 0.75rem;
		margin: 0;
		padding: 0;
	}

	/* `height: 100%` rather than a stretched item's default, because the `<li>`
	   is what the grid stretches and the anchor inside it has to be told to
	   follow — without it a short card's target stops above the bottom of its
	   own outline. `/bibliotheca`'s `.shelf` states the same thing; these are
	   one object on two pages. */
	.door {
		display: block;
		height: 100%;
		padding: 0.9rem 1rem;
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/* `.book-btn`'s hover, which is the same object: a name out of a grid,
	   leading into the text. */
	.door:hover,
	.door:focus-visible {
		border-color: var(--color-accent);
	}

	.door:hover .door-title,
	.door:focus-visible .door-title {
		color: var(--color-accent);
	}

	/*
	 * THE MARK IS CENTRED IN A ONE-LINE BOX AND NOT BASELINE-ALIGNED, which is
	 * `.shelf-heading`'s correction on `/bibliotheca` and is worth taking here
	 * rather than rediscovering: a box with no text in it has no baseline of
	 * its own, so a flex line takes its BOTTOM EDGE as one and a 1em glyph
	 * stands a full em over capitals that reach about seven tenths. `1lh`
	 * reads the heading's own line height, so centring a line box against a
	 * line box needs no font metrics and no nudge — the `margin-block-start`
	 * that used to sit here was that nudge.
	 *
	 * `align-items: start` so the mark stays beside the FIRST line of a title
	 * that wraps, rather than halfway down two.
	 */
	.door-heading {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		column-gap: 0.5rem;
	}

	/*
	 * `--color-accent` at three-quarters, and nothing else on the card
	 * coloured: the mark identifies the door and the title names it, so a
	 * second saturated element would make the card look like a control. It
	 * reaches full opacity on hover with the border, so the card answers in
	 * two places at once. No `line-height` of its own — `1lh` above is reading
	 * the title's, which is the whole reason that unit is used.
	 */
	.door-icon {
		display: grid;
		place-items: center;
		block-size: 1lh;
		color: var(--color-accent);
		opacity: 0.75;
	}

	.door:hover .door-icon,
	.door:focus-visible .door-icon {
		opacity: 1;
	}

	.door-title {
		font-family: var(--font-serif);
		font-size: 1.15rem;
	}

	.door-tagline {
		display: block;
		margin-top: 0.3rem;
		font-size: 0.82rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	/* --- The notation ------------------------------------------------------
	 *
	 * A row of specimens rather than a grid: three scraps of four or five
	 * characters each, which a grid would space out across the column as
	 * though the gaps meant something.
	 */
	.specimens {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
	}

	/*
	 * DRAWN AS SOMETHING TO TYPE, in the idiom the shortcut sheet's keycaps
	 * and `/schola`'s `.cite-example` already use: the interface face on the
	 * page's own ground inside a hairline. NOT a monospace — this site has
	 * exactly two faces and `docs/reading.md` splits them on authorship, so a
	 * third introduced for three scraps of notation would be a new axis to
	 * maintain everywhere. The box is what says "put this in the box at the
	 * top"; tabular figures so the numerals sit evenly.
	 */
	.specimen {
		padding: 0.15rem 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-elevated);
	}

	.find-hint {
		margin: 0.75rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	@media print {
		.door,
		.specimen {
			background: none;
			break-inside: avoid;
		}
	}
</style>
