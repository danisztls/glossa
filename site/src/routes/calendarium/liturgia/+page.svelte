<script lang="ts">
	/**
	 * The day's liturgy: one date, gathered.
	 *
	 * `/calendarium` answers WHICH day it is and offers the month to walk; this
	 * answers what is read and prayed on it. The split is the reason both exist
	 * — the calendar's own page is a card and a month listing, and a page of
	 * Scripture underneath thirty dated rows would be a second subject on a page
	 * that already has one.
	 *
	 * ## The date is `?d=`, the same parameter and for the same reason
	 *
	 * `/calendarium`'s docblock argues it at length: a date names no citation,
	 * so it cannot be a reading address, and a path multiplied by every date in
	 * history would put an unbounded set of URLs into the sitemap for pages that
	 * are pure computation. `?c=` rides along unchanged, so a reader who keeps
	 * Brazil's calendar keeps it walking between the two pages.
	 *
	 * THE ADDRESS IS SEEDED FROM AND NEVER WRITTEN BACK. `/calendarium` owns its
	 * state because it has controls that change the day; this page has none —
	 * the way to another day is the calendar — so `page.url` is read once per
	 * navigation and there is nothing to mirror. That is also why this page can
	 * derive from `page.url` directly where the other could not: the failure
	 * recorded over there is a control writing state the URL did not learn
	 * about, and there is no control here to do it.
	 *
	 * ## What this page prints that the card does not
	 *
	 * The passages. `MassLiturgy` sets out each pericope's own text from
	 * whichever Bible edition this reader has open, whole or not at all
	 * (`$lib/liturgy`), which is the one thing `DayReadings`' list of citations
	 * on a card cannot do. The card's readings are therefore suppressed here —
	 * they would be the same citations twice, once compressed and once as the
	 * headings of the passages under them.
	 *
	 * ## Which makes it a READING page, and it is laid out as one
	 *
	 * `.content-column` and a `ReadingBar`, not `.landing-column` — the shape
	 * every page whose body is corpus prose already takes, and the reason
	 * `layout.css` divides the two: `--content-width` is a count of CHARACTERS,
	 * which is wrong for a month of dated rows and exactly right for a gospel.
	 * The passages themselves are `.reading-text`, so the reader's own size
	 * setting reaches them and the face is the one every other text on this site
	 * is set in. `/preces/{slug}` is the precedent for the bare column: a
	 * reading page with no aside is a column, not a one-sided grid.
	 *
	 * **The bar carries print and the edition picker and nothing else.** Print,
	 * because a day's readings are a thing people carry to Mass on paper, and
	 * the print stylesheet is written about `.content-column`. The picker,
	 * because on this page the Bible edition is not a preference sitting behind
	 * the text — it IS the text, and `EditionMenu`'s route map had to be told so
	 * (its own docblock records that a work missing from that map fails by
	 * rendering nothing at all). No bookmark: what this address names is a date,
	 * and the bookmark list is of passages.
	 *
	 * **And no focus mode** (`zen={false}`). The mode takes away the furniture
	 * standing around a text — the sidebar, the second column, the bar's own
	 * controls — and this page has none of it: no aside, no comparison, no unit
	 * nav and no breadcrumb. What is left for it to hide is the header and the
	 * footer, and the header is how a reader reaches another day, this being the
	 * one reading page whose subject is fixed by the address rather than walked
	 * to from within. That is the phone argument (`ZenToggle`) at every width:
	 * the mode would buy a band of pixels and spend the way to everything else.
	 * `styles/zen.css` gates on the toggle, so declining it here means a reader
	 * who left the mode on elsewhere meets this page whole rather than stripped.
	 *
	 * ## And what it still is not
	 *
	 * A Missal. The schedule is the Ordo Lectionum Missae's and the words are
	 * this corpus's editions, not the translation proclaimed in any parish;
	 * there is no collect, no preface and no proper of any Mass here, because
	 * the corpus holds none of them. `site/docs/lectionary.md` §THE GAPS is the
	 * list of what this feature cannot say.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import DayPrayers from '$lib/components/DayPrayers.svelte';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import MassLiturgy from '$lib/components/MassLiturgy.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import {
		formatIsoDate,
		liturgicalDay,
		parseIsoDate,
		toDayNumber,
		type CalendarOptions
	} from '$lib/calendar';
	import { NATIONAL_CALENDAR_LIST, TERRITORY_CALENDARS } from '$lib/calendar/national';
	import { primeLectionary, readingsFor } from '$lib/lectionary';
	import { t } from '$lib/i18n.svelte';

	/** Today in the READER'S zone, which is the zone they keep the feast in —
	 *  `/calendarium` and the home page compute on the same basis, and
	 *  `$lib/calendar`'s `today()` says why local time is right here and
	 *  nowhere else. */
	function localToday(): number {
		const now = new Date();
		return toDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate());
	}

	const OPTIONS: Record<string, CalendarOptions> = Object.fromEntries(
		NATIONAL_CALENDAR_LIST.map((c) => [c.id, { nationalCalendar: c } as CalendarOptions])
	);

	/** A territory the picker on `/calendarium` may have put in the address.
	 *  Unknown or absent is the general calendar, which is what this page shows
	 *  when nobody has said otherwise — the parameter is typed by hand and
	 *  pasted around, so it cannot be an error. */
	const territory = $derived.by(() => {
		const raw = page.url.searchParams.get('c');
		return raw && TERRITORY_CALENDARS[raw] ? raw : 'general';
	});
	const options = $derived(
		territory === 'general' ? ({} as CalendarOptions) : OPTIONS[TERRITORY_CALENDARS[territory]]
	);

	/**
	 * Today until the clock is read, and then whatever `?d=` says.
	 *
	 * `todayNumber` is `$state` set on mount rather than derived, for the reason
	 * the home page states: the shell is prerendered, and a day derived at build
	 * time would date this page to the day it was compiled.
	 */
	let todayNumber: number | undefined = $state();
	const selected = $derived(parseIsoDate(page.url.searchParams.get('d') ?? '') ?? todayNumber);
	const day = $derived(selected === undefined ? undefined : liturgicalDay(selected, options));

	/** The way back, carrying the day and the calendar so the month listing
	 *  opens on the day the reader was just reading. */
	const backHref = $derived.by(() => {
		const url = new URL('/calendarium', page.url.origin);
		if (selected !== undefined) url.searchParams.set('d', formatIsoDate(selected));
		if (territory !== 'general') url.searchParams.set('c', territory);
		return `${url.pathname}${url.search}`;
	});

	/** The lectionary table is fetched, not imported — `$lib/lectionary` has
	 *  the 138 KB argument — so the readings arrive after the first paint, and
	 *  a failure leaves the page with the day and the prayers. */
	let tableReady = $state(false);
	onMount(() => {
		todayNumber = localToday();
		void primeLectionary().then(
			() => (tableReady = true),
			() => {}
		);
	});

	const masses = $derived(tableReady && day ? readingsFor(day) : null);
</script>

<svelte:head>
	<title>{t('liturgy.title')} — {t('home.title')}</title>
</svelte:head>

<article class="content-column">
	<ReadingBar zen={false} />
	{#if day}
		<!-- The card carries the day's identity — its name as the `h1`, its
		     colour, rank, season and cycles — and nothing on this page repeats
		     it. Its readings are off: they are the citations of the passages
		     set out below, and printing both would be the page answering the
		     same question twice at two lengths. The way back to the calendar is
		     the corner glyph, and there is no `read` link because this is what
		     one leads to. -->
		<LiturgicalDayCard
			{day}
			heading="h1"
			today={todayNumber}
			showReadings={false}
			more={{ href: backHref, label: t('calendar.title') }}
		/>

		{#if masses}
			<MassLiturgy {masses} />
		{/if}

		<DayPrayers {day} />
	{:else if todayNumber !== undefined}
		<!-- A date outside any year this can build. Saying so beats an empty
		     page; the way out is the calendar. -->
		<h1>{t('liturgy.title')}</h1>
		<p>{t('calendar.noSuchDay')}</p>
		<p><a href={backHref}>{t('calendar.title')}</a></p>
	{/if}
</article>
