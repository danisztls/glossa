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

<div class="landing-column">
	{#if day}
		<!-- The card carries the day's identity — its name as the `h1`, its
		     colour, rank, season and cycles — and nothing on this page repeats
		     it. Its readings are off: they are the citations of the passages
		     set out below, and printing both would be the page answering the
		     same question twice at two lengths. -->
		<LiturgicalDayCard
			{day}
			heading="h1"
			today={todayNumber}
			showReadings={false}
			more={[{ href: backHref, label: t('calendar.title'), icon: 'calendar' }]}
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
</div>
