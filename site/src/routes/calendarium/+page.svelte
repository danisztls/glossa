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
	 * ## Two things this page will not do
	 *
	 * It does not paint itself in the day's liturgical colour — see
	 * `LiturgicalDayCard.svelte`. And it does not tell a reader what to read at
	 * Mass: the lectionary's citations are a work this corpus does not hold,
	 * and the cycle letters are stated as facts about the year rather than
	 * dressed up as an answer the site cannot give.
	 */
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import {
		celebrationName,
		formatIsoDate,
		getYear,
		liturgicalDay,
		liturgicalYearOf,
		parseIsoDate,
		toDayNumber,
		type CalendarOptions
	} from '$lib/calendar';
	import { NATIONAL_CALENDAR_LIST } from '$lib/calendar/national';
	import { i18n, t } from '$lib/i18n.svelte';

	/** Today in the READER'S zone, which is the zone they keep the feast in —
	 *  the one place in this codebase where local time is the correct basis.
	 *  See `today()` in `$lib/calendar`. */
	function localToday(): number {
		const now = new Date();
		return toDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate());
	}

	/** Which calendar to compute. The universal Latin calendar is the default
	 *  for the reason `docs/decisions.md` gives: a conference's transfers are a
	 *  fact about a country, not about the calendar. The national calendars
	 *  follow in `NATIONAL_CALENDAR_LIST`'s own order, which is Catholic
	 *  population — the criterion they were chosen by. */
	const CALENDARS = [
		{ id: 'general', options: {} as CalendarOptions },
		...NATIONAL_CALENDAR_LIST.map((c) => ({
			id: c.id,
			options: { nationalCalendar: c } as CalendarOptions
		}))
	];
	let calendarId = $state('general');
	let options = $derived(CALENDARS.find((c) => c.id === calendarId)!.options);

	/**
	 * A country's name, in the reader's own language, from the platform.
	 *
	 * `Intl.DisplayNames` is what the language menu already uses for language
	 * names (`menu-filter.ts`), and it earns its place here for the same
	 * reason: fifteen country names in thirty-four interface languages is 510
	 * strings nobody would maintain, and every browser already knows them. A
	 * tag it cannot name falls back to the code, which is at least the ISO
	 * name of the country.
	 */
	function calendarLabel(id: string, lang: string): string {
		if (id === 'general') return t('calendar.which.general');
		const code = id.toUpperCase();
		try {
			return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code;
		} catch {
			return code;
		}
	}

	let selected = $derived(parseIsoDate(page.url.searchParams.get('d') ?? '') ?? localToday());
	let day = $derived(liturgicalDay(selected, options));
	let year = $derived(liturgicalYearOf(selected));

	/** The whole liturgical year, for the listing below — Advent to Advent, in
	 *  order, which is the order it is lived in and not the civil one. */
	let wholeYear = $derived([...getYear(year, options).values()]);
	/** Only the days worth listing: everything that is not a plain weekday.
	 *  A year is ~365 rows and about 130 of them say nothing but the season. */
	let notable = $derived(
		wholeYear.filter((d) => d.celebration.rank !== 'weekday' || d.optional.length > 0)
	);

	function go(iso: string) {
		const url = new URL(page.url);
		url.searchParams.set('d', iso);
		replaceState(url, page.state);
	}

	function step(days: number) {
		go(formatIsoDate(selected + days));
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
			<label>
				<span>{t('calendar.date')}</span>
				<input
					type="date"
					value={formatIsoDate(selected)}
					oninput={(e) => go((e.currentTarget as HTMLInputElement).value)}
				/>
			</label>
			<label>
				<span>{t('calendar.calendar')}</span>
				<select bind:value={calendarId}>
					{#each CALENDARS as c (c.id)}
						<option value={c.id}>{calendarLabel(c.id, lang)}</option>
					{/each}
				</select>
			</label>
			<div class="steps">
				<button type="button" onclick={() => step(-1)}>{t('calendar.previousDay')}</button>
				<button type="button" onclick={() => go(formatIsoDate(localToday()))}>
					{t('calendar.today')}
				</button>
				<button type="button" onclick={() => step(1)}>{t('calendar.nextDay')}</button>
			</div>
		</div>

		{#if day}
			<LiturgicalDayCard {day} heading="h2" />
		{:else}
			<!-- Only reachable for a date outside any year this can build, which
			     the date input makes hard to ask for. Saying so is better than
			     an empty page. -->
			<p>{t('calendar.noSuchDay')}</p>
		{/if}

		<h2 class="year-heading">{t('calendar.yearHeading')} {year}</h2>
		<p class="year-note">{t('calendar.yearNote')}</p>
		<ol class="year">
			{#each notable as d (d.date)}
				<li class:current={d.dayNumber === selected}>
					<a
						href={`?d=${d.date}`}
						onclick={(e) => {
							e.preventDefault();
							go(d.date);
						}}
					>
						<span class="cell-date">{d.date}</span>
						<span class="swatch" data-colour={d.colour} aria-hidden="true"></span>
						<span class="cell-name">{celebrationName(d.celebration, lang)}</span>
						<span class="cell-rank">{t(`calendar.rank.${d.celebration.rank}`)}</span>
					</a>
				</li>
			{/each}
		</ol>
	</div>
</div>

<style>
	.controls {
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 0.75rem 1.25rem;
		margin: 1rem 0 1.25rem;
	}
	.controls label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	.steps {
		display: flex;
		gap: 0.4rem;
	}
	.year-heading {
		margin-top: 2rem;
	}
	.year-note {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	.year {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--color-border);
	}
	.year li {
		border-bottom: 1px solid var(--color-border);
	}
	.year a {
		display: grid;
		grid-template-columns: 6.5rem 1rem 1fr auto;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.35rem 0.25rem;
		text-decoration: none;
		color: inherit;
	}
	.year li.current a {
		font-weight: 600;
	}
	.cell-date {
		font-variant-numeric: tabular-nums;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	.cell-rank {
		font-size: 0.78rem;
		color: var(--color-text-muted);
		text-align: right;
	}
	.swatch {
		display: inline-block;
		width: 0.65em;
		height: 0.65em;
		border-radius: 50%;
		border: 1px solid var(--color-border);
	}
	.swatch[data-colour='white'] {
		background: #fdfdfb;
	}
	.swatch[data-colour='red'] {
		background: #a4262c;
	}
	.swatch[data-colour='green'] {
		background: #2f6b3f;
	}
	.swatch[data-colour='violet'] {
		background: #5f3f7a;
	}
	.swatch[data-colour='rose'] {
		background: #d99bb0;
	}
	.swatch[data-colour='black'] {
		background: #23211e;
	}
	@media (max-width: 34rem) {
		.year a {
			grid-template-columns: 5.5rem 1rem 1fr;
		}
		.cell-rank {
			display: none;
		}
	}
</style>
