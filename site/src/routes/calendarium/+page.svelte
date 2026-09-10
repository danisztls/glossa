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
	 * ## Not a reading page, and no longer laid out as one
	 *
	 * `.landing-column`, not `.content-column` inside a `.reading-layout`:
	 * `layout.css` carries the argument, which is that `--content-width` is a
	 * count of CHARACTERS and nothing on this page is running prose. It is a row
	 * of controls, a card of facts and a month of dated rows — and that last one
	 * paid for the measure most, since a celebration's name runs to a hundred
	 * characters and every one of them that wrapped did so in a column sized for
	 * a sentence. The `.reading-layout` around it was reserving an aside lane for
	 * an aside this page has never had.
	 *
	 * The prose that is still prose keeps a measure of its own — the tagline
	 * through `.landing-measure`, the primer through its own cap. `/`,
	 * `/bibliotheca`, `/documenta` and `/schola` are the same kind of page and
	 * take the same column.
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
	 * ## One thing this page will not do
	 *
	 * It does not paint itself in the day's liturgical colour — see
	 * `LiturgicalDayCard.svelte`.
	 *
	 * It DOES now tell a reader what is read at Mass, which this docblock
	 * denied until 2026-09-06: the citations are the card's, through
	 * `DayReadings`, and they are citations resolved through this site's own
	 * editions rather than the text of any conference's lectionary. What that
	 * still cannot say is in `site/docs/lectionary.md` §THE GAPS.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import CalendarMenu from '$lib/components/CalendarMenu.svelte';
	import CalendarMonth from '$lib/components/CalendarMonth.svelte';
	import CalendarPrimer from '$lib/components/CalendarPrimer.svelte';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import {
		formatIsoDate,
		liturgicalDay,
		parseIsoDate,
		toDayNumber,
		type CalendarOptions
	} from '$lib/calendar';
	import { NATIONAL_CALENDAR_LIST, TERRITORY_CALENDARS } from '$lib/calendar/national';
	import { calendarPath, CALENDAR_PAGES } from '$lib/calendar/national/languages';
	import {
		detectedTerritory,
		openingTerritory,
		rememberTerritory,
		storedTerritory
	} from '$lib/calendar-pref';
	import { holdLang, i18n, t } from '$lib/i18n.svelte';

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
	 * WHAT "ABSENT" MEANS IS ANSWERED BY THE READER'S OWN PREFERENCE, THEN BY
	 * WHERE THEY ARE, before it falls back to the general calendar — see
	 * `onMount` below and `calendar-pref.ts`. The URL stays the one thing this
	 * component derives from; those two only decide what the URL says when the
	 * reader arrives without one.
	 */
	function territoryIn(url: URL): string {
		const raw = url.searchParams.get('c');
		return raw && TERRITORY_CALENDARS[raw] ? raw : 'general';
	}

	/**
	 * The calendar this page's own ADDRESS names, where it names one.
	 *
	 * `/calendarium/brazil` is a published page and `?c=br` is a parameter on
	 * another one — `languages.ts` argues why a country's calendar is worth an
	 * address, and `routes/calendarium/[calendar]/` is the route that passes
	 * this in. Everything below treats it as `?c=` was treated: it settles what
	 * the page opens on, and the controls own it from there.
	 */
	let { opensOn }: { opensOn?: string } = $props();

	/**
	 * What the page opens on: the address's calendar, refined by a finer answer
	 * that names the same one.
	 *
	 * A PATH NAMES A CALENDAR AND A TERRITORY NAMES WHO KEEPS IT, which are not
	 * the same thing for eleven of the ninety-six places in the picker (see
	 * `?c=` below). So `/calendarium/ps` opens on Israel for the reader who
	 * chose Israel and on the Latin Patriarchate's own territory for everyone
	 * else: both show one calendar, and only the picker's trigger can tell them
	 * apart. Contradicting the path is not a refinement — a stored `us` on
	 * `/calendarium/brazil` is a reader who has been to this page before, not a
	 * reader asking for Brazil's calendar to show them Denver.
	 */
	function seedTerritory(): string {
		const asked = territoryIn(page.url);
		if (!opensOn) return asked;
		for (const finer of [asked, storedTerritory()]) {
			if (finer && TERRITORY_CALENDARS[finer] === opensOn) return finer;
		}
		return opensOn;
	}

	let territory = $state(seedTerritory());
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
		// THE CALENDAR IS THE PATH AND NO LONGER A PARAMETER. `?c=` is still
		// read on arrival and is still what `/calendarium/liturgia` takes, so
		// every link ever handed out still lands where it meant to; what it is
		// not any more is what this page hands back, because the address a
		// reader copies off Brazil's calendar should be the address a search
		// engine has for Brazil's calendar (`languages.ts`).
		url.searchParams.delete('c');
		// The general calendar is the default, so it is the bare path rather
		// than a value: `/calendarium/general` would be an address that says
		// nothing, and it would sit in every link copied off the default page.
		url.pathname =
			territory === 'general' ? '/calendarium' : calendarPath(TERRITORY_CALENDARS[territory]);
		return url;
	}

	/**
	 * ## The address bar follows, and no longer drives
	 *
	 * The two states of this page are worth keeping straight. It began with
	 * both values DERIVED from `page.url` and written by shallow routing —
	 * which never assigns `page.url` — so the address changed under every click
	 * and the page stayed on today's date for its whole life: two ideas of
	 * where it was, one of them shown. The repair was `goto`, which does update
	 * `page.url`; what `goto` also does is run a navigation, and a navigation
	 * here is a re-entry into the root layout's `load` (it reads `url`, so it
	 * re-runs on every one), a `root.$set` over the whole component tree, a
	 * focus pass and a scroll pass — the entire router lifecycle, for a page
	 * that fetches nothing and computes every date it shows from arithmetic.
	 *
	 * So the ownership was inverted rather than the mechanism patched: the
	 * controls hold the state, the URL is seeded from once and written to
	 * after, and `page.url` going stale is now a fact about a value nothing
	 * reads — `addressFor` sets both parameters unconditionally, so a stale
	 * base cannot carry a stale answer.
	 *
	 * ## AND THE WRITE IS `history`'s, NOT `$app/navigation`'s
	 *
	 * Which is the part that took three attempts, because `replaceState` from
	 * `$app/navigation` is not the cheap half of `goto`. Its last two lines
	 * (kit's `client.js`) are `page.state = state` and a `root.$set` handing
	 * the whole tree a freshly cloned `page` — so a shallow write still costs
	 * a prop update over every component in the app, `<svelte:head>` included.
	 *
	 * WHAT THAT COST LOOKED LIKE was not a re-render. It was the document
	 * re-resolving its `@font-face` rules: `document.fonts` went `loaded` ->
	 * `loading` -> `loaded` on every click, and for the two frames in between
	 * every glyph on the page fell back to a system face — the header's five
	 * nav links measurably ~13% wider together, the document a line taller,
	 * then both back. A reader reads that as the page flinching and settling,
	 * which is exactly how it was reported, twice, and it is why the earlier
	 * repairs kept missing: nothing was moving, everything was being redrawn in
	 * a different typeface. Paging the month never did it, because paging is
	 * local state and writes no history — which is what named the culprit both
	 * times.
	 *
	 * So the address is written by hand. `history.state` is carried over
	 * WHOLESALE rather than rebuilt, because the router keeps its own
	 * bookkeeping in there — the history and navigation indices it compares on
	 * `popstate`, and the shallow-routing state — and dropping any of it would
	 * turn the next Back press into a full navigation. The one key that is
	 * ours to update is `sveltekit:pageurl`: it holds the address the router
	 * will restore this entry to, so leaving it alone would send a reader who
	 * walked a week and pressed Back to the day they arrived on.
	 *
	 * In dev, kit patches `history.replaceState` to warn once that it conflicts
	 * with the router. It is aimed at exactly the mistake this avoids — a write
	 * that clobbers the bookkeeping above — and there is no un-warned door to
	 * the same thing.
	 */
	const PAGE_URL_KEY = 'sveltekit:pageurl';

	function mirror() {
		const url = addressFor();
		history.replaceState({ ...history.state, [PAGE_URL_KEY]: url.href }, '', url);
		// AND THE LANGUAGE IS HELD, because this write can put a country
		// calendar's address in the bar and that address names a language. It is
		// this page's answer and not the reader's — picking Brazil in the picker
		// is picking a calendar — so `initialLang` must not read it back as one
		// on the next load. `i18n.svelte.ts` carries the ordering.
		holdLang();
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
	 * The reader's calendar, applied ONCE, on arrival, and only where the
	 * address does not already name one.
	 *
	 * THREE ANSWERS IN ORDER — a `?c=` in the address, then what the reader
	 * chose here before, then where the edge says they are. The address is
	 * settled by the early return, because it is this page's own and the home
	 * page has no such parameter; `openingTerritory` argues the other two,
	 * along with why a stored `'general'` stops the chain where an absent key
	 * does not. What is left here is the mirroring.
	 *
	 * It writes the territory into `?c=` rather than holding it beside the URL,
	 * because this page's whole contract is that the address reproduces what is
	 * on the screen — a page showing Brazil's calendar under a bare
	 * `/calendarium` would hand out links that show the sender Brazil and the
	 * recipient Rome.
	 *
	 * IT MIRRORS LIKE EVERY OTHER WRITE, which it could not while the write
	 * was `$app/navigation`'s: shallow routing throws in dev before the router
	 * has finished starting, and a page's `onMount` runs inside that window —
	 * Svelte flushes the mount effects a microtask before the client router
	 * sets its own started flag. `goto` was the exception that bought its way
	 * past the guard. `history.replaceState` has no guard to buy past, and by
	 * the time anything mounts the router has already written its bookkeeping
	 * into `history.state` for `mirror` to carry forward (kit's `client.js`
	 * creates that entry inside `start`, well before it builds the root), so
	 * the page holds one mechanism now instead of two.
	 *
	 * `onMount` and not `$effect`: this must happen on arrival and never again,
	 * and an effect over `territory` would fight the reader every time they
	 * chose the general calendar back.
	 */
	onMount(() => {
		// A `?c=` is honoured and then written as the path that now names it, so
		// a link made before these addresses existed lands where it meant and
		// hands its reader the address to pass on. The same write is what puts
		// `/calendarium/ps` in the bar for a reader who arrived on `?c=il`.
		if (page.url.searchParams.has('c')) {
			mirror();
			return;
		}
		// An address that names a calendar has answered this question, and it
		// outranks both of the guesses below for the reason `?c=` did.
		if (opensOn) return;
		const opening = openingTerritory(storedTerritory(), detectedTerritory(), TERRITORY_CALENDARS);
		if (!opening) return;
		territory = opening;
		mirror();
	});

	let lang = $derived(i18n.lang);
	let today = $derived(localToday());

	/**
	 * The day's liturgy, at the day and the calendar this page is showing.
	 *
	 * Built from the two values this component owns rather than from
	 * `page.url`, which goes stale the moment `mirror` writes (see there) —
	 * `addressFor` sets both parameters unconditionally for the same reason,
	 * and this is the second reader of the same fact.
	 */
	let liturgyHref = $derived(
		`/calendarium/liturgia?d=${formatIsoDate(selected)}${
			territory === 'general' ? '' : `&c=${territory}`
		}`
	);

	/**
	 * The title and the sentence under the heading, both naming the calendar
	 * that is actually on screen.
	 *
	 * THE NAME IS THE CALENDAR'S OWN AND IS NOT TRANSLATED — `Calendário
	 * Litúrgico Brasileiro` reads the same to a reader whose interface is
	 * Albanian, because it is what that calendar is called (`languages.ts`).
	 * The sentence around it is theirs. `shell-head.ts` composes the same two
	 * strings for the edge, so the title assigned here at hydration is the
	 * title the crawler was already served; a different shape would be a
	 * visible rearrangement on every load.
	 *
	 * It follows the CALENDAR and not the picker's value, exactly as the
	 * address does: a reader who chose Israel is reading the Latin
	 * Patriarchate's calendar, and that is what these name.
	 */
	let namedLayer = $derived(territory === 'general' ? undefined : TERRITORY_CALENDARS[territory]);
	let calendarName = $derived(namedLayer ? CALENDAR_PAGES[namedLayer].name : undefined);
	let pageTitle = $derived(
		calendarName
			? `${calendarName} — ${t('home.title')}`
			: `${t('calendar.title')} — ${t('home.title')}`
	);

	/**
	 * The name is set in `<strong>`, which is why this is `{@html}`.
	 *
	 * `ccc.landing.tagline` is the precedent and the reason it is safe: a
	 * tagline may carry markup, both strings come from this repository rather
	 * than from a reader, and `plain()` in `route-titles.mjs` strips it back
	 * out for the `<meta>` description, whose content attribute is text.
	 */
	let tagline = $derived(
		calendarName
			? t('calendar.national.tagline').replace('{name}', `<strong>${calendarName}</strong>`)
			: t('calendar.tagline')
	);
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="landing-column">
	<h1>{t('calendar.title')}</h1>
	<p class="page-tagline landing-measure">{@html tagline}</p>

	{#snippet controls()}
		<!-- ONE CONTROL, WHICH IS WHY THERE IS NO ROW LEFT. The date field and
		     Today stood beside this until 2026-09-06 and both were answering a
		     question the listing below answers better: a reader picks a day by
		     reading what is on it, and the field made them type one blind. What
		     the corner keeps is the control that changes what the days MEAN. -->
		<CalendarMenu value={territory} {lang} onchoose={choose} />
	{/snippet}

	{#if day}
		<!-- The one way off this card is downward, into the day's liturgy. The
		     corner carries no glyph here because the only sideways move it could
		     offer is this page. -->
		<LiturgicalDayCard
			{day}
			heading="h2"
			{today}
			{controls}
			read={{ href: liturgyHref, label: t('liturgy.read'), title: t('liturgy.readTheDay') }}
		/>
	{:else}
		<!-- The control is inside the card, so a date with no day would take it
		     off the page and strand the reader on the date that did it. It is
		     rendered loose here for that one case. -->
		<div class="orphan-controls">{@render controls()}</div>
		<!-- Only reachable for a date outside any year this can build, which
		     the date input makes hard to ask for. Saying so is better than
		     an empty page. -->
		<p>{t('calendar.noSuchDay')}</p>
	{/if}

	<CalendarMonth {selected} {today} {options} {lang} onpick={go} />

	<CalendarPrimer />
</div>

<style>
	/*
	 * WHAT IS LEFT OF A CONTROL ROW IS ONE CONTROL.
	 *
	 * This page carried five bare platform widgets under a `.label-micro`
	 * caption each, then a tidy row of three wearing the chrome's own classes,
	 * then that row inside the day card. What finally removed it was asking
	 * what each control was FOR: the date field and Today both chose a day,
	 * and the listing below chooses days better — by showing what is on them
	 * — so both went (2026-09-06) and the calendar picker stayed, being the
	 * only one that changes what the days MEAN.
	 *
	 * THE COST IS A DISTANT DATE. The field could be typed into; the listing
	 * pages a month at a time, and `?d=` is still the address of any day for
	 * anyone who edits it. What it buys is that the two cards are now the same
	 * object — a date, a name, and a picker in the corner — which is worth
	 * more than a control most readers used to jump one month.
	 *
	 * The picker's size and skin are `LiturgicalDayCard`'s `.corner`, which is
	 * where it lives; the orphan case below is the one render outside it.
	 */
	.orphan-controls {
		margin-bottom: 1.1rem;
		font-family: var(--font-sans);
	}
</style>
