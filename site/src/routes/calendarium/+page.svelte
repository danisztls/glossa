<script lang="ts">
	/**
	 * The liturgical calendar.
	 *
	 * Computed in the browser and fetched from nothing. The whole calendar is
	 * `$lib/calendar` — arithmetic over the date of Easter and a table of the
	 * Church's fixed celebrations — so this page has no content tier, no
	 * manifest and no download wave. It is the only page on the site whose
	 * subject is not a text.
	 *
	 * ## The date lives in the query string, not the path
	 *
	 * `?d=2026-04-05` rather than `/calendarium/2026-04-05`, and the reason is
	 * the site's URL grammar rather than convenience. `address.ts` and
	 * `route-manifest.ts` divide addresses in two: a READING address names a
	 * citation, is the same in every language and takes no interface-language
	 * prefix, while a CHROME path names a page whose every word is the
	 * interface and does take one. A date is neither. It names no citation —
	 * there is no text at `2026-04-05` — so it cannot be a reading address;
	 * and a chrome path that multiplied by every date in history would put an
	 * unbounded set of URLs into the sitemap for pages that are pure
	 * computation. A query parameter is the honest shape for "the same page,
	 * showing a different day", and leaves `/calendarium` as the one address
	 * worth indexing.
	 *
	 * ## The month listing IS the navigation
	 *
	 * `CalendarMonth.svelte` holds the arrangement and the argument for it.
	 * What it means here is that this page has one control row and no day
	 * steppers: the list steps a day by being clicked or arrowed, and turns a
	 * page of the month with its own arrows, so a second pair of arrows above
	 * it would be two controls doing one thing at two grains.
	 *
	 * ## The day comes first, and the month under it
	 *
	 * The day's card is the ANSWER — what the reader asked for by naming a date
	 * — and the list is the way to ask again, so the answer does not sit below
	 * thirty rows of navigation where a reader arriving at `/calendarium` would
	 * have to scroll to find out what today is.
	 *
	 * What it costs is that the card is ABOVE the rows being clicked, and its
	 * height is a function of the day: an ordinary weekday and a day carrying
	 * four optional memorials differ by several lines, so changing the day
	 * drags the list up or down under the reader's cursor. THAT COST IS PAID
	 * RATHER THAN AVOIDED. The card was held to a fixed height and scrolled
	 * inside itself for exactly one day, and the height it was held at clipped
	 * every day that had more to say — an answer with its last line cut off, to
	 * keep a list below it still. A reflow is the smaller injury: the reader
	 * caused it, it settles in one frame, and nothing is hidden by it.
	 *
	 * The other half of the repair is that the list no longer moves for reasons
	 * the reader did not ask for — paging a month leaves the chosen day alone
	 * (`CalendarMonth.svelte`), so the card above changes only when the reader
	 * changes the day.
	 *
	 * ## Two things this page will not do
	 *
	 * It does not paint itself in the day's liturgical colour — see
	 * `LiturgicalDayCard.svelte`. And it does not tell a reader what to read at
	 * Mass: the lectionary's citations are a work this corpus does not hold,
	 * and the cycle letters are stated as facts about the year rather than
	 * dressed up as an answer the site cannot give.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto, replaceState } from '$app/navigation';
	import CalendarMenu from '$lib/components/CalendarMenu.svelte';
	import CalendarMonth from '$lib/components/CalendarMonth.svelte';
	import CalendarPrimer from '$lib/components/CalendarPrimer.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import {
		formatIsoDate,
		liturgicalDay,
		parseIsoDate,
		toDayNumber,
		type CalendarOptions
	} from '$lib/calendar';
	import { NATIONAL_CALENDAR_LIST, TERRITORY_CALENDARS } from '$lib/calendar/national';
	import { rememberTerritory, storedTerritory } from '$lib/calendar-pref';
	import { formatPromulgated } from '$lib/dates';
	import { i18n, t } from '$lib/i18n.svelte';

	/** Today in the READER'S zone, which is the zone they keep the feast in —
	 *  the one place in this codebase where local time is the correct basis.
	 *  See `today()` in `$lib/calendar`. */
	function localToday(): number {
		const now = new Date();
		return toDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate());
	}

	/** The options each published layer computes under, by layer id. The
	 *  universal Latin calendar is the default for the reason
	 *  `site/docs/calendar.md` gives: a conference's transfers are a fact about a
	 *  country, not about the calendar. */
	const OPTIONS: Record<string, CalendarOptions> = Object.fromEntries(
		NATIONAL_CALENDAR_LIST.map((c) => [c.id, { nationalCalendar: c } as CalendarOptions])
	);

	/**
	 * THE CONTROLS OWN THE STATE AND THE ADDRESS BAR FOLLOWS THEM. It was the
	 * other way round for a day — both controls derived from `page.url` and
	 * neither kept a copy — and §The address bar follows has why that was
	 * wrong and what the reader saw.
	 *
	 * The date has lived in `?d=` since this page was written, for the reason
	 * above; the calendar joins it in `?c=` on the same argument the compare
	 * toggle makes (`compare-nav.svelte.ts`): the address in front of the
	 * reader should be the address that reproduces what they are looking at,
	 * and a control that changed the page without changing the URL hands out
	 * links that don't show what the sender sees. It also means a reload keeps
	 * the reader in their own country's calendar.
	 *
	 * The URL is still where both values COME FROM — these are seeded from it
	 * and from nowhere else, so a pasted link, a reload and a return from
	 * another page all land where they say they do.
	 *
	 * `?c=` NAMES A TERRITORY AND NOT A LAYER, which are not the same thing
	 * for eleven of the ninety-six places in the picker: Israel, Jordan and
	 * Cyprus all keep the Latin Patriarchate of Jerusalem's calendar, which is
	 * the layer `ps`. Storing the layer would be storing the answer instead of
	 * the question — the picker would then have to guess which of four cells
	 * the reader had pressed to print a name in its trigger, and it printed
	 * the alphabetically first one, so choosing Israel said "Cyprus". A layer
	 * id is still accepted, because every layer's own territory is one of the
	 * territories it covers, so nothing that was a valid `?c=` stopped being
	 * one.
	 *
	 * An unknown or absent `c` is the general calendar rather than an error —
	 * a query parameter is typed by hand and pasted around, and the general
	 * calendar is what this page shows when nobody has said otherwise. A HELD
	 * calendar's id lands here too, and correctly: `TERRITORY_CALENDARS` is
	 * built from the published list, so an id withdrawn by `held.ts` resolves
	 * to nothing in exactly the same way a typo does.
	 *
	 * WHAT "ABSENT" MEANS IS ANSWERED BY THE READER'S OWN PREFERENCE before it
	 * falls back to the general calendar — see `onMount` below and
	 * `calendar-pref.ts`. The URL stays the one thing this component derives
	 * from; the preference only decides what the URL says when the reader
	 * arrives without one.
	 */
	function territoryIn(url: URL): string {
		const raw = url.searchParams.get('c');
		return raw && TERRITORY_CALENDARS[raw] ? raw : 'general';
	}

	let territory = $state(territoryIn(page.url));
	let selected = $state(parseIsoDate(page.url.searchParams.get('d') ?? '') ?? localToday());

	let options = $derived(
		territory === 'general' ? ({} as CalendarOptions) : OPTIONS[TERRITORY_CALENDARS[territory]]
	);
	let day = $derived(liturgicalDay(selected, options));

	/** The address this page's state describes. Built from `page.url` so that
	 *  any parameter this page does not own survives, and setting BOTH of the
	 *  two it does own — which is what makes it safe that `page.url` goes stale
	 *  the moment `mirror` writes (see there). */
	function addressFor(): URL {
		const url = new URL(page.url);
		url.searchParams.set('d', formatIsoDate(selected));
		// The general calendar is the default, so it is absence rather than a
		// value: `?c=general` would be a parameter that says nothing, and it
		// would sit in every link a reader copies off the default page.
		if (territory === 'general') url.searchParams.delete('c');
		else url.searchParams.set('c', territory);
		return url;
	}

	/**
	 * ## The address bar follows, and no longer drives
	 *
	 * `replaceState` from `$app/navigation` — shallow routing, which writes
	 * `history` and `page.state` and deliberately never touches `page.url`.
	 *
	 * THAT PROPERTY WAS THE BUG AND IS NOW THE DESIGN, and the two states of
	 * this page are worth keeping straight. It began shallow while both values
	 * were DERIVED from `page.url`, so the address changed under every click
	 * and the page stayed on today's date for its whole life — two ideas of
	 * where it was, one of them shown. The repair was `goto`, which does update
	 * `page.url`; what `goto` also does is run a navigation, and a navigation
	 * here is a re-entry into the root layout's `load` (it reads `url`, so it
	 * re-runs on every one), a `root.$set` over the whole component tree, a
	 * focus pass and a scroll pass — the entire router lifecycle, for a page
	 * that fetches nothing and computes every date it shows from arithmetic.
	 * The reader saw it as a flinch on every single click, in both axes,
	 * settling back where it started: the same day stepped to twice looked the
	 * same afterwards and still moved in between. Paging the month never did
	 * it, because paging is local state and touches no router — which is what
	 * named the culprit.
	 *
	 * So the ownership is inverted rather than the mechanism patched. The
	 * controls hold the state, the URL is seeded from once and written to
	 * after, and `page.url` being frozen is now simply a fact about a value
	 * nothing reads: `addressFor` sets both parameters unconditionally, so a
	 * stale base cannot carry a stale answer.
	 *
	 * There is no `noScroll`/`keepFocus` to pass because there is nothing to
	 * suppress — shallow routing scrolls nothing and blurs nothing. It also
	 * replaces rather than pushes, which is what the `goto` asked for by flag:
	 * stepping a day is not a destination, and a reader who walked through a
	 * week is still one Back press from the page they arrived from.
	 */
	function mirror() {
		replaceState(addressFor(), page.state);
	}

	function go(iso: string) {
		const n = parseIsoDate(iso);
		// A half-typed date in the field parses to nothing, and re-choosing the
		// day already on screen is not a change. Neither is worth a history
		// write, and the second would be a re-render for no difference.
		if (n === undefined || n === selected) return;
		selected = n;
		mirror();
	}

	/** A calendar chosen in the picker is a calendar the reader KEEPS, so it is
	 *  remembered as well as shown. A `?c=` they merely arrived on is not —
	 *  `calendar-pref.ts` holds that argument. */
	function choose(id: string) {
		rememberTerritory(id);
		if (id === territory) return;
		territory = id;
		mirror();
	}

	/**
	 * The remembered calendar, applied ONCE, on arrival, and only where the
	 * address does not already name one.
	 *
	 * It writes the territory into `?c=` rather than holding it beside the URL,
	 * because this page's whole contract is that the address reproduces what is
	 * on the screen — a page showing Brazil's calendar under a bare
	 * `/calendarium` would hand out links that show the sender Brazil and the
	 * recipient Rome.
	 *
	 * `goto` HERE AND `replaceState` EVERYWHERE ELSE, which is the one place
	 * the two mechanisms meet. Shallow routing throws in dev when the router
	 * has not finished starting, and a page's `onMount` runs inside that
	 * window — Svelte flushes the mount effects a microtask before the client
	 * router sets its own started flag. `goto` has no such guard, this runs at
	 * most once per visit, and it runs while the page is still arriving, which
	 * is the one moment a navigation costs the reader nothing to look at.
	 *
	 * `onMount` and not `$effect`: this must happen on arrival and never again,
	 * and an effect over `territory` would fight the reader every time they
	 * chose the general calendar back.
	 */
	onMount(() => {
		if (page.url.searchParams.has('c')) return;
		const saved = storedTerritory();
		if (!saved || saved === 'general' || !TERRITORY_CALENDARS[saved]) return;
		territory = saved;
		goto(addressFor(), { replaceState: true, noScroll: true, keepFocus: true });
	});

	/**
	 * The date field, which is a native `<input type="date">` wearing the
	 * site's clothes — see the style rules. It is held here for one reason: the
	 * input is transparent, so the platform's own picker indicator is invisible
	 * with it, and a click anywhere on the field has to open the picker.
	 *
	 * `showPicker` THROWS rather than answering falsely where it is unsupported
	 * or refused without a user gesture, which is why the call is wrapped and
	 * the failure is silent. Nothing is lost by it: the same click focuses the
	 * field, the field takes typing, and the month below lists every day.
	 */
	let dateEl: HTMLInputElement | undefined = $state();
	function openPicker() {
		typing = false;
		try {
			dateEl?.showPicker();
		} catch {
			/* unsupported, or refused — the field still takes typing */
		}
	}

	/**
	 * THE FIELD LETS GO ONCE THE DATE IS CHOSEN, and it has to, because of what
	 * focus does to it: `:focus-visible` swaps the site's face for the raw
	 * input underneath (see the style rules), and a browser sets
	 * `:focus-visible` on a text-entry control when it is CLICKED, not only
	 * when it is tabbed to. So picking a date from the platform's popup left
	 * the field focused and therefore showing the operating system's own
	 * `09/17/2026` — the exact thing the face exists to prevent — until the
	 * reader clicked somewhere else. Blurring puts the face back.
	 *
	 * EXCEPT WHEN THE READER IS TYPING, which is the one interaction blurring
	 * would wreck: a date typed segment by segment fires `input` the moment the
	 * last segment lands, and taking focus away there would eject someone
	 * mid-correction. `typing` is which of the two is driving — a key sets it,
	 * a click clears it — and nothing else consults it.
	 */
	let typing = false;
	function pickDate(value: string) {
		go(value);
		if (!typing) dateEl?.blur();
	}

	let lang = $derived(i18n.lang);
	let selectedIso = $derived(formatIsoDate(selected));
	/* Its own derived value so that `widestDate` recomputes when the YEAR moves
	   and not on every step to another day: twelve `Intl.DateTimeFormat`s per
	   click, to arrive at the string it already had. */
	let year = $derived(selectedIso.slice(0, 4));
	let today = $derived(localToday());

	/**
	 * The widest date this field can ever print in the reader's language.
	 *
	 * IT IS RENDERED, HIDDEN, INSIDE THE FIELD, and that is what stops the row
	 * moving. The face gives the field its width, so the box was as wide as
	 * whatever date it happened to print — `1 de maio` and `28 de setembro` are
	 * not the same width — and every step to another day slid the two controls
	 * beside it left or right. A `min-inline-size` in `rem` would be a number
	 * measured once in one language and wrong in the next one added; the widest
	 * date is knowable, so it is computed and laid on top of the real one.
	 *
	 * Twelve probes on the 28th, which every month has and which is two digits
	 * — with `tabular-nums` on the face that makes the probe an upper bound for
	 * any day of any month. The longest STRING stands in for the widest one:
	 * within a single language and script the difference is a whole character
	 * or more, not a hair's width of kerning.
	 */
	const widestDate = $derived.by(() => {
		let widest = '';
		for (let month = 1; month <= 12; month++) {
			const probe = formatPromulgated(`${year}-${String(month).padStart(2, '0')}-28`, lang);
			if (probe.length > widest.length) widest = probe;
		}
		return widest;
	});
</script>

<svelte:head>
	<title>{t('calendar.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<div class="content-column">
		<h1>{t('calendar.title')}</h1>
		<p class="page-tagline">{t('calendar.tagline')}</p>

		<div class="controls">
			<!--
				THE FIELD PRINTS THE DATE THE WAY THE PAGE WRITES DATES, which a
				native date input cannot be made to do: its format comes from the
				operating system's locale rather than from the interface language,
				so a reader on an American machine read `09/17/2026` at the top of
				a page that says "17 de setembro de 2026" everywhere else. The
				input is still the control — it keeps the value, the keyboard, the
				validation and the platform's own calendar popup — and the span
				over it is what is read. The card below no longer prints the date,
				because THIS is where the date is now.
			-->
			<div class="date-field">
				<input
					type="date"
					bind:this={dateEl}
					aria-label={t('calendar.date')}
					value={selectedIso}
					oninput={(e) => pickDate((e.currentTarget as HTMLInputElement).value)}
					onkeydown={() => (typing = true)}
					onclick={openPicker}
				/>
				<span class="date-face" aria-hidden="true">
					<Icon name="calendar" />
					<span class="date-text">
						<span>{formatPromulgated(selectedIso, lang)}</span>
						<span class="date-widest">{widestDate}</span>
					</span>
				</span>
			</div>
			<!-- Beside the date and not down beside the month's arrows, because it
			     is the same control as the date field: both answer WHICH DAY, and
			     the one that answers "the one I am living in" belongs with them.
			     Down there it read as a third month control. -->
			<button type="button" class="menu-trigger wide" onclick={() => go(formatIsoDate(today))}>
				{t('calendar.today')}
			</button>
			<CalendarMenu value={territory} {lang} onchoose={choose} />
		</div>

		{#if day}
			<LiturgicalDayCard {day} heading="h2" showDate={false} />
		{:else}
			<!-- Only reachable for a date outside any year this can build, which
			     the date input makes hard to ask for. Saying so is better than
			     an empty page. -->
			<p>{t('calendar.noSuchDay')}</p>
		{/if}

		<CalendarMonth {selected} {today} {options} {lang} onpick={go} />

		<CalendarPrimer />
	</div>
</div>

<style>
	/*
	 * THE CONTROLS ARE CHROME, so they are set in the chrome's own vocabulary
	 * rather than in a row of browser defaults.
	 *
	 * They used to be a bare `<input type="date">`, a bare `<select>` and
	 * three bare `<button>`s — five elements wearing whatever the platform
	 * draws, sitting under a page set in the reading face, a few centimetres
	 * from a header of bordered 2.25rem squares. Nothing about them was wrong
	 * except that they belonged to a different site.
	 *
	 * What they wear now is what the header wears: `.label-micro` for the
	 * captions (styles/components.css — the site speaking, as opposed to a
	 * word from a text) and `.menu-trigger` for the calendar popover
	 * (styles/menus.css). Those are real reuse and not a copied ruleset: a
	 * change to the chrome's border or corner radius reaches this row without
	 * anyone remembering it is here.
	 */
	/*
	 * ONE ROW, EVERY CONTROL, NO CAPTIONS. Each control stood in its own column
	 * under a `.label-micro` heading — DATE over a date field, CALENDAR over a
	 * button already carrying a globe and the calendar's name — which is two
	 * groups of chrome, twice the height, to say what both controls say
	 * themselves. The caption they had is the `aria-label` now, so nothing was
	 * taken from a screen reader, only from the screen.
	 *
	 * Today JOINED THEM from the month listing's header (2026-09-05), where it
	 * sat beside the two month arrows and was read as a third month control.
	 * It is not: it names a DAY, which is what the two controls beside it here
	 * do.
	 */
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4rem;
		/* The margin below is the one gap on this page that has to be said
		   out loud: the card beneath is a bordered box and the controls are
		   loose elements, so without it they read as its lid. */
		margin: 0.9rem 0 1.1rem;
		font-family: var(--font-sans);
	}
	/*
	 * EVERY CONTROL ON THIS PAGE, ONE HEIGHT AND ONE PADDING, smaller than the
	 * chrome's default — this row is a page's own furniture rather than the
	 * site header's, and `CalendarMonth`'s two month arrows answer to the same
	 * rule from their own file.
	 *
	 * THE PADDING HAS TO BE SAID HERE BECAUSE `.menu-trigger` IS A SQUARE.
	 * That class is an icon button — `width: 2.25rem; padding: 0` — and `.wide`
	 * is what a trigger carrying a LABEL wears (`styles/menus.css`). Today was
	 * wearing the square: as a flex item it could not shrink below its own
	 * word, so it came out exactly as wide as `Today` with no side padding at
	 * all, beside a calendar button with 0.6rem and a date field with 0.5rem.
	 * Three controls, three paddings, in a row four centimetres wide. One
	 * value, named once, and the date face below takes it too.
	 */
	.controls {
		--control-padding: 0.6rem;
	}
	.controls :global(.menu-trigger) {
		height: 2rem;
		font-size: 0.8rem;
	}
	.controls :global(.menu-trigger.wide) {
		padding-inline: var(--control-padding);
	}
	/*
	 * DELIBERATELY NOT WEARING `.menu-trigger`, though it restates that class's
	 * geometry: this is a field the reader types into, not a control that opens
	 * something, and borrowing the class would make every future edit to the
	 * chrome's triggers an edit to a date picker as well. What is shared is the
	 * geometry and the tokens, which is the part that has to agree.
	 *
	 * `font: inherit` is not used here — see styles/base.css on why a control
	 * that inherits the shorthand and then sets `font-size` comes out 1.5 line
	 * heights of the BODY tall. The family and size are named separately.
	 */
	.date-field {
		position: relative;
		display: inline-flex;
		height: 2rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.8rem;
		line-height: 1;
	}
	.date-field:hover {
		border-color: var(--color-accent);
	}
	/*
	 * THE INPUT IS THE CONTROL AND THE SPAN IS THE FACE. The input covers the
	 * field exactly and is transparent; the span sits under it in the flow and
	 * is what gives the field its width, so the box is as wide as the date it
	 * prints in whatever language, and never wider.
	 *
	 * `opacity`, and NOT `visibility`, `display` or a clip: those three take a
	 * control out of the focus order on one engine or another, and the whole
	 * arrangement rests on this remaining a real, focusable date input with the
	 * platform's own keyboard behaviour intact.
	 */
	.date-field input {
		position: absolute;
		inset: 0;
		inline-size: 100%;
		block-size: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.8rem;
		opacity: 0;
		cursor: pointer;
	}
	/*
	 * A KEYBOARD READER GETS THE REAL FIELD BACK. Typing into segments that
	 * cannot be seen is the one thing this arrangement could genuinely break,
	 * so keyboard focus — and only keyboard focus, which is what
	 * `:focus-visible` means — swaps the face for the input underneath it. The
	 * face keeps its box (`visibility`, not `display`), so nothing on the row
	 * moves as it goes.
	 */
	.date-field:has(input:focus-visible) {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}
	.date-field input:focus-visible {
		padding-inline: var(--control-padding);
		opacity: 1;
		cursor: auto;
	}
	.date-field:has(input:focus-visible) .date-face {
		visibility: hidden;
	}
	.date-face {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding-inline: var(--control-padding);
		/* Digits of one width, so that the widest-date probe below is an upper
		   bound for a one-digit day as well as a two-digit one. */
		font-variant-numeric: tabular-nums;
		/* The input is the click target; the face must never intercept one. */
		pointer-events: none;
		white-space: nowrap;
	}
	/*
	 * THE DATE AND THE WIDEST DATE IN ONE CELL, which is what holds the row
	 * still. Both are laid in the same grid area, so the field is as wide as
	 * the longer of them — always the probe — and stays that width whichever
	 * day is on screen. Stepping a day used to slide the two controls beside
	 * it, because the face gives the field its width and a date's width is a
	 * fact about its month's name.
	 *
	 * `visibility`, not `display: none`: a hidden probe still has to be laid
	 * out, or it sizes nothing.
	 */
	.date-text {
		display: grid;
	}
	.date-text > * {
		grid-area: 1 / 1;
	}
	.date-widest {
		visibility: hidden;
	}
</style>
