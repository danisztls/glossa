<script lang="ts">
	/**
	 * A civil month of the liturgical calendar, as a list of its days.
	 *
	 * ## A month, and not the whole year
	 *
	 * This page listed the whole liturgical year, Advent to Advent, filtered
	 * down to the days that were not plain weekdays — about 230 rows. What was
	 * wrong with it was the SPAN, not the shape: a reader looking for a
	 * particular date had to scan a screen and a half of them, and the days
	 * with nothing appointed were missing altogether, so a date could be
	 * looked up and simply not be there. A month is 30 rows, every one of them
	 * present, with the month named above it and one press to the next.
	 *
	 * ## And a list, not a grid
	 *
	 * It was a seven-column grid for an afternoon, which is what a calendar
	 * usually looks like, and the reason it went back is that this page is not
	 * a diary. Nobody is placing appointments against weekdays here; they are
	 * reading what each day IS, and that is a line of text of unpredictable
	 * length — "Saints Cornelius, Pope, and Cyprian, Bishop, Martyrs" — which
	 * a column a seventh of the page wide cannot hold. The grid clipped nearly
	 * every name it drew to two lines and dropped them all below 34rem; a row
	 * gives the name the width of the page.
	 *
	 * The week survives as a rule above each Sunday, which is the one thing
	 * the grid said that a list does not say by itself.
	 *
	 * ## Paging MOVES THE SELECTED DAY
	 *
	 * There is no separate "month being viewed". The month shown is the month
	 * of `selected`, and the arrows move `selected` by a month — so the page
	 * keeps ONE piece of state, which lives in the URL (`?d=`), and the
	 * address in the bar always reproduces exactly what is on the screen.
	 *
	 * The alternative — a view month held in the component, independent of the
	 * selected day — is what a mail client's calendar does, and it is wrong
	 * here: this page's whole content below the list is one day, so a reader
	 * paging to March and seeing February's feast underneath has been shown
	 * two different months at once. Paging moves the day.
	 *
	 * THE DAY OF THE MONTH IS KEPT AND CLAMPED. Stepping from 31 March to
	 * February lands on the 28th (or the 29th), not on 3 March, and stepping
	 * on lands on 30 April rather than skipping the month. The clamp is not
	 * symmetric — going back to February from the 31st and forward again gives
	 * the 28th, not the 31st — which is the ordinary behaviour of every date
	 * picker and the only one that does not need the component to remember
	 * where the reader started.
	 */
	import {
		celebrationName,
		formatIsoDate,
		fromDayNumber,
		liturgicalDay,
		SUNDAY,
		toDayNumber,
		weekday,
		type CalendarOptions,
		type DayNumber,
		type LiturgicalDay
	} from '$lib/calendar';
	import { dateLocale } from '$lib/dates';
	import { t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		/** The chosen day. Its month is the month listed. */
		selected: DayNumber;
		/** Today in the reader's own zone, marked in the list. */
		today: DayNumber;
		options: CalendarOptions;
		/** The interface language, for the month and weekday names. */
		lang: string;
		/** Called with an ISO date whenever the reader picks or pages. */
		onpick: (iso: string) => void;
	}

	let { selected, today, options, lang, onpick }: Props = $props();

	let listEl: HTMLElement | undefined = $state();
	/** The date to put the keyboard back on once the list has re-rendered —
	 *  see `moveTo` below. */
	let refocus: string | undefined = $state();

	const ymd = $derived(fromDayNumber(selected));

	/** How many days a month has, without a table: the first of the next
	 *  month minus the first of this one. Handles February and December. */
	function monthLength(year: number, month: number): number {
		return (
			toDayNumber(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, 1) -
			toDayNumber(year, month, 1)
		);
	}

	/** The same day-of-month `delta` months away, clamped into the month. */
	function shiftMonths(delta: number): DayNumber {
		const months = ymd.year * 12 + (ymd.month - 1) + delta;
		const year = Math.floor(months / 12);
		const month = (((months % 12) + 12) % 12) + 1;
		return toDayNumber(year, month, Math.min(ymd.day, monthLength(year, month)));
	}

	/** The locale to name the month and the weekdays in — `dates.ts` holds the
	 *  reason it is not the raw interface tag. */
	const locale = $derived(dateLocale(lang));

	const monthName = $derived(
		new Intl.DateTimeFormat(locale, {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(Date.UTC(ymd.year, ymd.month - 1, 1)))
	);

	const weekdayFormat = $derived(
		new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
	);

	/** Every day of the month, in order — INCLUDING the ones with nothing
	 *  appointed. A month view that omitted them would be a list a reader
	 *  could look a date up in and not find it, which is what the year listing
	 *  did and the one thing about it that was a defect rather than a span. */
	const days = $derived.by(() => {
		const first = toDayNumber(ymd.year, ymd.month, 1);
		return Array.from({ length: monthLength(ymd.year, ymd.month) }, (_, i) => {
			const n = first + i;
			return {
				n,
				iso: formatIsoDate(n),
				day: i + 1,
				weekdayName: weekdayFormat.format(new Date(Date.UTC(ymd.year, ymd.month - 1, i + 1))),
				// The rule that stands in for the grid's columns. Never on the
				// first row, where it would be a second line under the header.
				weekStart: i > 0 && weekday(n) === SUNDAY,
				liturgical: liturgicalDay(n, options)
			};
		});
	});

	/** What a row prints: the day's own celebration, or — for a plain weekday
	 *  that still offers something — the first optional memorial, which is the
	 *  only thing that makes such a day worth a look. */
	function rowName(d: LiturgicalDay | undefined): { text: string; optional: boolean } | undefined {
		if (!d) return undefined;
		if (d.celebration.rank !== 'weekday')
			return { text: celebrationName(d.celebration, lang), optional: false };
		if (d.optional.length > 0)
			return { text: celebrationName(d.optional[0], lang), optional: true };
		return undefined;
	}

	/**
	 * Arrow keys walk the list, which is what makes it navigable without a
	 * mouse and without thirty tab stops.
	 *
	 * Every move goes through `onpick`, so it is a real navigation and the URL
	 * follows — there is no "focused but not selected" state to explain, and a
	 * reader who arrows to a day and stops has that day's card below them. Up
	 * and down are one DAY, which in a list is one row; a month is
	 * PageUp/PageDown, and Home/End are the ends of the month. Left and right
	 * are deliberately untouched: in a vertical list they mean nothing, and
	 * binding them would take them away from the browser.
	 *
	 * THE REFOCUS IS THE AWKWARD HALF and it cannot be avoided: `onpick`
	 * re-renders the list, and a move that crosses a month boundary replaces
	 * every row in it, so the element the reader was standing on is gone by
	 * the time the browser would restore focus to it. `refocus` names the date
	 * to stand on and the effect below puts the keyboard there once the new
	 * rows exist. `keepFocus` on the `goto` is what stops SvelteKit throwing
	 * focus to `<body>` in between.
	 */
	function moveTo(target: DayNumber) {
		refocus = formatIsoDate(target);
		onpick(refocus);
	}

	function onRowKeydown(event: KeyboardEvent) {
		const first = toDayNumber(ymd.year, ymd.month, 1);
		const target = {
			ArrowUp: selected - 1,
			ArrowDown: selected + 1,
			PageUp: shiftMonths(-1),
			PageDown: shiftMonths(1),
			Home: first,
			End: first + monthLength(ymd.year, ymd.month) - 1
		}[event.key];
		if (target === undefined) return;
		event.preventDefault();
		moveTo(target);
	}

	$effect(() => {
		if (!refocus) return;
		const row = listEl?.querySelector<HTMLElement>(`[data-date="${refocus}"]`);
		refocus = undefined;
		row?.focus();
	});

	function page(delta: number) {
		onpick(formatIsoDate(shiftMonths(delta)));
	}
</script>

<section class="month">
	<header>
		<button
			type="button"
			class="menu-trigger step-btn"
			aria-label={t('calendar.previousMonth')}
			title={t('calendar.previousMonth')}
			onclick={() => page(-1)}
		>
			<Icon name="arrow-left" />
		</button>
		<!-- `aria-live` so a reader who pages with the keyboard is told which
		     month they landed in; the list below is far too long to announce. -->
		<h2 aria-live="polite">{monthName}</h2>
		<button
			type="button"
			class="menu-trigger step-btn"
			aria-label={t('calendar.nextMonth')}
			title={t('calendar.nextMonth')}
			onclick={() => page(1)}
		>
			<Icon name="arrow-right" />
		</button>
		<button
			type="button"
			class="menu-trigger wide today-btn"
			onclick={() => onpick(formatIsoDate(today))}
		>
			{t('calendar.today')}
		</button>
	</header>

	<!--
		REAL LINKS, as the year listing had them: `?d=` IS the address of the
		day, so a row is a place and not a control. That is what makes a
		middle-click open it, a long-press offer to copy it, and a screen
		reader announce it as a link to somewhere. `preventDefault` is what
		keeps the click a shallow navigation rather than a page load.
	-->
	<ol bind:this={listEl}>
		{#each days as d (d.iso)}
			{@const name = rowName(d.liturgical)}
			<li class:week-start={d.weekStart}>
				<a
					href={`?d=${d.iso}`}
					data-date={d.iso}
					class:selected={d.n === selected}
					class:is-today={d.n === today}
					aria-current={d.n === selected ? 'date' : undefined}
					onclick={(e) => {
						e.preventDefault();
						onpick(d.iso);
					}}
					onkeydown={onRowKeydown}
				>
					<span class="date">
						<span class="num">{d.day}</span>
						<span class="weekday">{d.weekdayName}</span>
					</span>
					{#if d.liturgical}
						<span class="swatch" data-colour={d.liturgical.colour} aria-hidden="true"></span>
					{:else}
						<span aria-hidden="true"></span>
					{/if}
					<span class="name" class:optional={name?.optional}>
						{name?.text ?? ''}
						{#if d.n === today}<span class="visually-hidden">{t('calendar.today')}</span>{/if}
					</span>
					{#if d.liturgical}
						<span class="rank">{t(`calendar.rank.${d.liturgical.celebration.rank}`)}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ol>
</section>

<style>
	.month {
		margin: 1.25rem 0;
		font-family: var(--font-sans);
	}

	/*
	 * The month's name between its two arrows, with Today pushed to the end —
	 * the arrangement every calendar uses, and the reason it is not three
	 * buttons in a row is that the name is the thing being changed and belongs
	 * between the controls that change it.
	 */
	header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}
	header h2 {
		margin: 0;
		font-size: 1rem;
		font-family: var(--font-sans);
		/* Wide enough that the longest month name in any language does not
		   move the arrows as the reader pages through the year. */
		min-inline-size: 10rem;
		text-align: center;
	}
	.today-btn {
		margin-inline-start: auto;
		font-size: 0.85rem;
	}
	/* An arrow is a picture of a direction, not a character, so nothing flips
	   it under `dir="rtl"` — `UnitNav`'s docblock has the argument. The row
	   mirrors on its own; this turns the mark to point the same way. */
	header:dir(rtl) .step-btn :global(svg) {
		transform: scaleX(-1);
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
		border-top: 1px solid var(--color-border);
	}
	li {
		border-bottom: 1px solid var(--color-border);
	}
	/*
	 * THE WEEK IS THE ONE THING A LIST LOSES, and a heavier rule above each
	 * Sunday puts it back. The liturgical week begins on the Lord's Day
	 * (Universal Norms n. 4), and the Sunday is the day the rest of the week
	 * is numbered from — "Monday of the Second Week of Lent" is the Monday
	 * AFTER that Sunday — so a reader following a season needs to see where
	 * one starts. It is a border on the `li` rather than a separator element,
	 * so it costs no row and cannot be read out as content.
	 */
	li.week-start {
		border-top: 2px solid var(--color-border);
	}

	a {
		display: grid;
		grid-template-columns: 3.75rem 1rem 1fr auto;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.35rem 0.25rem;
		text-decoration: none;
		color: inherit;
	}
	a:hover {
		background: var(--color-bg-elevated);
	}
	a.selected {
		font-weight: 600;
	}

	.date {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	.num {
		/* Tabular, and given a fixed width, so the weekday beside it starts at
		   the same place on every row — single- and double-digit alike. */
		font-variant-numeric: tabular-nums;
		inline-size: 1.2em;
		text-align: end;
	}
	/*
	 * Today is marked on the NUMBER and the selection on the ROW, so a reader
	 * can see both at once — on the day itself they are the same row, and on
	 * any other day the two marks must not compete for the same edge.
	 */
	.is-today .num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		inline-size: 1.6em;
		block-size: 1.6em;
		border-radius: 50%;
		background: var(--color-accent);
		color: var(--color-bg);
		font-weight: 600;
	}
	.weekday {
		font-size: 0.78rem;
	}

	.name.optional {
		color: var(--color-text-muted);
	}
	.rank {
		font-size: 0.78rem;
		color: var(--color-text-muted);
		text-align: end;
	}

	/*
	 * The rank goes first at narrow widths, then the weekday. The NAME is what
	 * the row is for and it keeps the whole line; the rank is recoverable from
	 * the card below, and the weekday from the Sunday rules.
	 */
	@media (max-width: 34rem) {
		a {
			grid-template-columns: 2.25rem 1rem 1fr;
		}
		.rank,
		.weekday {
			display: none;
		}
	}
</style>
