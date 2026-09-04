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
	 * steppers: the list steps a day by being clicked or arrowed, and steps a
	 * month with its own arrows, so a second pair of arrows above it would be
	 * two controls doing one thing at two grains.
	 *
	 * ## Two things this page will not do
	 *
	 * It does not paint itself in the day's liturgical colour — see
	 * `LiturgicalDayCard.svelte`. And it does not tell a reader what to read at
	 * Mass: the lectionary's citations are a work this corpus does not hold,
	 * and the cycle letters are stated as facts about the year rather than
	 * dressed up as an answer the site cannot give.
	 */
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import CalendarMenu from '$lib/components/CalendarMenu.svelte';
	import CalendarMonth from '$lib/components/CalendarMonth.svelte';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import {
		formatIsoDate,
		liturgicalDay,
		parseIsoDate,
		toDayNumber,
		type CalendarOptions
	} from '$lib/calendar';
	import { NATIONAL_CALENDAR_LIST, TERRITORY_CALENDARS } from '$lib/calendar/national';
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
	 * BOTH CONTROLS READ THE URL, and neither keeps a copy of its own.
	 *
	 * The date has lived in `?d=` since this page was written, for the reason
	 * above; the calendar joins it in `?c=` on the same argument the compare
	 * toggle makes (`compare-nav.svelte.ts`): the address in front of the
	 * reader should be the address that reproduces what they are looking at,
	 * and a control that changed the page without changing the URL hands out
	 * links that don't show what the sender sees. It also means a reload keeps
	 * the reader in their own country's calendar.
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
	 */
	let territory = $derived.by(() => {
		const raw = page.url.searchParams.get('c');
		return raw && TERRITORY_CALENDARS[raw] ? raw : 'general';
	});
	let options = $derived(
		territory === 'general' ? ({} as CalendarOptions) : OPTIONS[TERRITORY_CALENDARS[territory]]
	);
	let selected = $derived(parseIsoDate(page.url.searchParams.get('d') ?? '') ?? localToday());
	let day = $derived(liturgicalDay(selected, options));

	/**
	 * Commit a control's new value to the address bar.
	 *
	 * `goto`, NOT `$app/navigation`'s `replaceState`, and the difference is the
	 * whole reason these controls used to do nothing. Shallow routing updates
	 * `history` and `page.state` and deliberately never touches `page.url` —
	 * so the address bar changed under every click while `selected`, which is
	 * derived from `page.url`, stayed on today's date for the life of the
	 * page. No error, no warning: the page simply had two ideas of where it
	 * was and only showed one of them.
	 *
	 * The three flags are the same set `compare-nav.svelte.ts` commits its own
	 * parameter with, for the same reasons: `replaceState` because stepping a
	 * day is not a destination and a reader who stepped through a week should
	 * still be one Back press from the page they arrived from; `noScroll`
	 * because the list below can be arrowed through and jumping to the top on
	 * every keypress would take the day's card off the screen; `keepFocus`
	 * because these ARE the focused controls, and a keyboard reader who lost
	 * focus to `<body>` would have to tab back to the row they just left.
	 */
	function commit(params: { d?: string; c?: string }) {
		const url = new URL(page.url);
		if (params.d !== undefined) url.searchParams.set('d', params.d);
		// The general calendar is the default, so it is absence rather than a
		// value: `?c=general` would be a parameter that says nothing, and it
		// would sit in every link a reader copies off the default page.
		if (params.c !== undefined) {
			if (params.c === 'general') url.searchParams.delete('c');
			else url.searchParams.set('c', params.c);
		}
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	function go(iso: string) {
		commit({ d: iso });
	}

	let lang = $derived(i18n.lang);
</script>

<svelte:head>
	<title>{t('calendar.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<div class="content-column">
		<h1>{t('calendar.title')}</h1>
		<p class="page-tagline">{t('calendar.tagline')}</p>

		<div class="controls">
			<label class="control">
				<span class="label-micro">{t('calendar.date')}</span>
				<input
					class="date-field"
					type="date"
					value={formatIsoDate(selected)}
					oninput={(e) => go((e.currentTarget as HTMLInputElement).value)}
				/>
			</label>
			<div class="control">
				<span class="label-micro" aria-hidden="true">{t('calendar.calendar')}</span>
				<CalendarMenu value={territory} {lang} onchoose={(id) => commit({ c: id })} />
			</div>
		</div>

		<CalendarMonth {selected} today={localToday()} {options} {lang} onpick={go} />

		{#if day}
			<LiturgicalDayCard {day} heading="h2" />
		{:else}
			<!-- Only reachable for a date outside any year this can build, which
			     the date input makes hard to ask for. Saying so is better than
			     an empty page. -->
			<p>{t('calendar.noSuchDay')}</p>
		{/if}
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
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75rem 1rem;
		margin: 1rem 0 0;
		font-family: var(--font-sans);
	}
	.control {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
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
		height: 2.25rem;
		padding-inline: 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.85rem;
		line-height: 1;
	}
	.date-field:hover {
		border-color: var(--color-accent);
	}
</style>
