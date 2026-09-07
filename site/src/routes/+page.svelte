<script lang="ts">
	/**
	 * The home page: today, the catalogue, and the notation.
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
	 * daily, the catalogue is for the reader who holds no address at all, and
	 * the specimens are last because the reader who already knows `CCC 1234` types
	 * it into the box without reading this page.
	 *
	 * WHAT IT BORROWS FROM `/schola` AND `/bibliotheca`, which are the same
	 * kind of page and were the model for this pass:
	 *
	 *   - **A tagline under the title.** Both open with a name and one
	 *     sentence saying what is behind it, and this page opened with a name
	 *     alone — a reader who has never heard of the site got a blackletter
	 *     wordmark and a liturgical day, and nothing that said what it was.
	 *   - **The catalogue**, which is now literally `/bibliotheca`'s:
	 *     `ShelfGrid.svelte` renders the list, the cards and the bed, because
	 *     the two pages offer the same catalogue and a second copy of it would
	 *     be a second copy to keep true.
	 *   - **A mark beside the name**, from the vocabulary `/schola`'s own rows
	 *     are drawn with — `scroll`, `flame`, `book-open` are that page's
	 *     assignments for these three works, reused rather than re-chosen —
	 *     set in `/bibliotheca`'s `1lh` box rather than on a baseline.
	 *   - **The inert specimen chip**, `.cite-example` there and `.specimen`
	 *     here, for the same reason that page gives: it teaches a SHAPE.
	 *
	 * NO SECTION ON THIS PAGE IS TITLED, WHICH IS THE OTHER HALF OF THAT MOVE
	 * (2026-09-06). The headings were `visually-hidden`, then two of the three
	 * were made visible on the argument that a rule is right over a grid and
	 * wrong over one titled object — and then the grid became the catalogue,
	 * whose seven cards say what they are far better than the words "Where to
	 * go" over them do. Three sections, three rules, three labels naming what
	 * is already legible underneath: the page read as a form. Every `h2` is
	 * hidden again and every one of them still exists, because the outline is
	 * what a reader moving by heading has and a rule is only what a reader
	 * looking at the page sees. `/bibliotheca` hides its one for the same
	 * reason stated the other way round.
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
	 * IT SHOWS THE READER'S OWN CALENDAR, AND ONLY BECAUSE IT CARRIES THE
	 * PICKER. It showed the general calendar to everyone until 2026-09-06, and
	 * the reason given was that the territory lived in `/calendarium`'s `?c=`
	 * and nowhere else, so this page had nothing to read; what was actually
	 * doing the work was the second half of that sentence — a national
	 * solemnity under a bare "Today", with no control beside it, is an
	 * unattributed claim about the reader and nothing to correct it by. So the
	 * two arrived together: `calendar-pref.ts` (a stored choice, or the edge's
	 * guess) says which calendar, and the picker in the card's corner is how a
	 * reader says otherwise in the place the claim is being made. It shares
	 * that corner with the way out to `/calendarium` (`more`), which is the
	 * other thing a reader wants from a day they did not come here to read.
	 *
	 * It DOES print the day's readings, which this docblock denied until
	 * 2026-09-06. They come with the card and not from here — `DayReadings`
	 * inside `LiturgicalDayCard`, fetched rather than imported so the table
	 * stays out of this page's boot chunk.
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
	 * The last two are heard and not read — every section here is untitled, and
	 * a hidden `h2` is what a reader moving by heading gets instead of a rule.
	 * Everything else is a name or a sentence written for another page — the
	 * catalogue is `$lib/shelves.ts`'s keys, each of them the one its own
	 * landing page is titled and described by, plus `/signata`'s two for the
	 * Bookmarks card, and the line under the specimens is `jumpbox.hint`.
	 * `en.ts` carries the argument for keeping `/` on the published list
	 * anyway, which is that the root has no usable remedy: `route-manifest.ts` withholds a page rather than claim it
	 * in a language it is not written in, and withholding the home page costs
	 * a sitemap row and an `hreflang` cluster that every other page's ranking
	 * leans on.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
	import { onMount } from 'svelte';
	import { listWorksOfType } from '$lib/corpus';
	import { scriptureSpecimen } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import { liturgicalDay, toDayNumber, type CalendarOptions } from '$lib/calendar';
	import {
		ensureNationalCalendars,
		residentOptions,
		residentTerritories
	} from '$lib/calendar/layers.svelte';
	import {
		detectedTerritory,
		openingTerritory,
		rememberTerritory,
		storedTerritory
	} from '$lib/calendar-pref';
	import CalendarMenu from '$lib/components/CalendarMenu.svelte';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import ShelfGrid from '$lib/components/ShelfGrid.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import type { WorkType } from '$lib/types';

	/*
	 * THE WAY IN IS THE CATALOGUE ITSELF, AND WAS FOUR DOORS UNTIL 2026-09-06.
	 *
	 * The doors were Bible, Prayers, Library and Learn: two works a reader
	 * wants most, plus two PAGES — and the Library door's whole content was
	 * "the catalogue is one click that way". A home page whose answer to "what
	 * is here" is a link to the answer is a page charging a click for a list
	 * that fits on a screen, and the two works it did name got there by being
	 * the popular ones rather than by any argument this file could state.
	 *
	 * So the catalogue `/bibliotheca` draws is drawn here: `ShelfGrid`, which
	 * is the list, the cards, the bed and the Bookmarks card at the end of them
	 * as one object. This page held its own `<ul>` and `{#each}` for a few
	 * hours after the doors went, which is how it came to be missing that last
	 * card while the comments on three files said the two pages drew the same
	 * catalogue.
	 *
	 * Learn and the Library are named in the nav bar, which is where a page
	 * rather than a work belongs. THE BOOKMARKS CARD IS NOT SUCH A PAGE, and
	 * that is the change of mind: `/signata` is the reader's own shelf, which
	 * was read as a reason for `/bibliotheca` to keep it — but a reader who
	 * arrives at the root holding no address and HAS marks is exactly the
	 * reader that card is for.
	 *
	 * THE VISIBILITY GATE COMES WITH THE COMPONENT and is `visibleShelves()`'s,
	 * which is the change of mind the doors' own note recorded the other way
	 * round: a door was a page and correct in an empty build, where a card is a
	 * work and a card for a work a partial sync did not carry is a door onto an
	 * empty index. The specimens below are gated on the same test — which is
	 * all this page has left to do with `listWorksOfType`.
	 */

	/** Is this work type in the build at all — the specimens' gate, below. */
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
	 * the one that changes by language, so a Portuguese reader is shown
	 * `Jo 3,16` and not somebody else's colon.
	 *
	 * `scriptureSpecimen` is where it is drawn, and it is shared with `/schola`
	 * rather than written twice — these six lines were duplicated verbatim,
	 * comments included, until 2026-09-06.
	 */
	const bibleSpecimen = $derived(scriptureSpecimen(bibleWorkId, bibleLang));

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
	let todayNumber: number | undefined = $state();

	/**
	 * THE CALENDAR THE READER KEEPS, AND WHAT IT COSTS TO SHOW IT HERE.
	 *
	 * This page showed the general calendar to everyone until 2026-09-06, for
	 * want of anywhere to put a control (see the docblock above) and for want
	 * of anything to read: the territory lived in `/calendarium`'s `?c=` and
	 * nowhere else. Both are gone — the picker sits in the card, and
	 * `calendar-pref.ts` holds the choice and the edge's guess — so the day at
	 * the top of the site is now the day the reader actually keeps.
	 *
	 * WHAT IS NOT ALLOWED IS A STATIC IMPORT OF THE LAYERS. Eighty-five files
	 * build a 184 KB chunk and this is the page every reader boots, so the
	 * table is fetched (`layers.svelte.ts`) and only for a reader who turns
	 * out to keep a national calendar. The card renders the general calendar
	 * until it lands and re-renders when it does — the same degradation a
	 * celebration's name has while its language's table is in flight, and
	 * visible only on the days the two calendars disagree.
	 */
	let territory = $state('general');
	let options = $derived<CalendarOptions>(
		territory === 'general' ? {} : (residentOptions(territory) ?? {})
	);
	let day = $derived(todayNumber === undefined ? undefined : liturgicalDay(todayNumber, options));

	/** A calendar chosen here is a calendar the reader KEEPS — the same rule
	 *  `/calendarium`'s picker follows, and the same storage, so choosing
	 *  Brazil here opens Brazil there. The table is already resident by the
	 *  time a cell can be pressed: the panel it was pressed in needed it. */
	function choose(id: string) {
		rememberTerritory(id);
		territory = id;
	}

	/**
	 * The two addresses the card's corner leads to, carrying the calendar the
	 * reader keeps.
	 *
	 * NOT THE DATE, deliberately: this card is always today, and both
	 * destinations open on today when nothing says otherwise — a `?d=` here
	 * would freeze a link copied off the home page to the day it was copied.
	 * `?c=` is different, being a fact about the reader rather than about the
	 * moment, and it is absent for the general calendar on `/calendarium`'s own
	 * reasoning: `?c=general` is a parameter that says nothing.
	 */
	const territoryQuery = $derived(territory === 'general' ? '' : `?c=${territory}`);
	const calendarHref = $derived(`/calendarium${territoryQuery}`);
	const liturgyHref = $derived(`/calendarium/liturgia${territoryQuery}`);

	onMount(() => {
		todayNumber = localToday();
		const stored = storedTerritory();
		const detected = detectedTerritory();
		// Nothing to fetch where the answer is already on screen: a reader with
		// no preference and no guessable country, and one who chose the general
		// calendar, both keep the calendar this page already renders.
		// `openingTerritory` decides it again, once there is a table to decide
		// against.
		if ((stored ?? detected ?? 'general') === 'general') return;
		void ensureNationalCalendars().then(() => {
			territory = openingTerritory(stored, detected, residentTerritories() ?? {}) ?? 'general';
		});
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
			{#snippet calendarPicker()}
				<!-- The one control on this page, and the same one `/calendarium`
				     carries: a reader who keeps Brazil's calendar meets it here
				     first, and correcting a wrong guess is one press in the place
				     the guess is showing. Bare, with no wrapper of its own — the
				     card's corner sizes and skins what it is given. -->
				<CalendarMenu value={territory} lang={i18n.lang} onchoose={choose} />
			{/snippet}
			<!-- The two ways out are glyphs in the card's own corner, not lines
			     under it — `LiturgicalDayCard`'s `more` prop says why. The
			     liturgy leads, being the deeper page: the calendar answers WHICH
			     day this is, which the card in front of the reader has already
			     done, and the liturgy answers what is read on it. Both share the
			     corner with the picker above. -->
			<LiturgicalDayCard
				{day}
				today={todayNumber}
				controls={calendarPicker}
				more={[
					{ href: liturgyHref, label: t('liturgy.title'), icon: 'scroll' },
					{ href: calendarHref, label: t('calendar.title'), icon: 'calendar' }
				]}
			/>
		</section>
	{/if}

	<!--
		A `<nav>` and not a `<section>`, which is the one place this differs from
		`/bibliotheca`'s use of the same component: there the cards are the page's
		SUBJECT, catalogued, and here they are the way in. The heading is hidden
		either way — see the docblock; the names under it are what a reader is
		looking at, and a rule reading "Where to go" over them names what the
		cards already say.
	-->
	<nav aria-labelledby="doors-heading">
		<h2 id="doors-heading" class="visually-hidden">{t('home.doors.heading')}</h2>
		<ShelfGrid />
	</nav>

	{#if specimens.length > 0}
		<section class="find" aria-labelledby="find-heading">
			<h2 id="find-heading" class="visually-hidden">{t('home.find.heading')}</h2>
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
			<!--
				THE SENTENCE LEADS AND THE SPECIMENS FOLLOW IT, which is the
				order the section had backwards until the heading came off.
				Under a rule reading "Or type a reference" the chips could go
				first and the line beneath them was a footnote; with no rule
				they were three unexplained boxes over the small print that
				said what they were, so a reader met the exhibit before the
				claim. Now the section opens by naming the control and the
				specimens are what it opens onto — which is also why the
				weights are the other way round from before: the line is the
				page's own text and the chips are quiet.

				`jumpbox.hint` rather than a fourth new string, and it is the
				right sentence rather than the cheap one: it names both
				shortcuts, and it is already the line the shortcut sheet shows
				for this control.
			-->
			<p class="find-lead">{t('jumpbox.hint')}</p>
			<ul class="specimens">
				{#each specimens as specimen (specimen.key)}
					<li class="specimen">{specimen.text}</li>
				{/each}
			</ul>
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
	nav {
		margin: 2.25rem 0;
	}

	/* THE RULED HEADING IS GONE AGAIN, and this is the second time. It was
	   deleted when "Continue reading" left the page and every heading here was
	   hidden, restored the same day when the doors and the notation were given
	   visible ones, and deleted for good when the sections stopped being titled
	   — see the docblock. `/bibliotheca` and `/signata` keep the declarations,
	   where a heading is still read. */

	/* Every `h2` on this page is for the outline and none is drawn. The day's
	   card is already titled by its celebration, the catalogue by its seven
	   cards, and the notation by the specimens themselves. */
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
	 * under the title and its sentence, above the catalogue. So it takes the
	 * tighter margin a masthead takes there (`1.5rem`) rather than the
	 * `2.25rem` that separates the sections from each other.
	 */
	.today {
		margin-top: 1.5rem;
	}

	/* THE CATALOGUE DRAWS ITSELF, so this page styles none of it —
	   `ShelfGrid.svelte` is the list, the cards and the bed, and `/bibliotheca`
	   renders the same one. What is left below belongs to the notation alone. */

	/* --- The notation ------------------------------------------------------
	 *
	 * A row of specimens rather than a grid: three scraps of four or five
	 * characters each, which a grid would space out across the column as
	 * though the gaps meant something.
	 */
	.find-lead {
		margin: 0 0 0.55rem;
		font-size: 0.9rem;
	}

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
	 *
	 * THE GROUND IS THE PAGE'S, WHICH IS WHAT THE PARAGRAPH ABOVE ALWAYS
	 * CLAIMED AND THE DECLARATION DID NOT DO. It was `--color-bg-elevated`,
	 * copied from `/schola` with the rest of the chip, where it collides with
	 * nothing because that page's rows are deliberately not cards. Here it
	 * sits a centimetre under seven cards drawn in exactly that ground, that
	 * border and that radius, so three inert specimens were three small cards
	 * — and a card on this page is a link. The hairline is what makes a
	 * specimen findable; the fill is what made it look pressable.
	 */
	.specimen {
		padding: 0.15rem 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	/* The chips carry no fill to strip now, so print keeps only the rule that
	   is about paper: a specimen may not be broken across two pages. */
	@media print {
		.specimen {
			break-inside: avoid;
		}
	}
</style>
