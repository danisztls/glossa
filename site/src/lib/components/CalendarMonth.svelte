<script lang="ts">
	/**
	 * A civil month of the liturgical calendar, as a list of its days.
	 *
	 * ## A month, and not the whole year
	 *
	 * This page listed the whole liturgical year, Advent to Advent, filtered
	 * down to the days that were not plain weekdays — about 230 rows. What was
	 * wrong with it was the SPAN, not the filter: a reader looking for a
	 * particular date had to scan a screen and a half of them. A month is a
	 * dozen to thirty rows, with the month named above it and one press to the
	 * next.
	 *
	 * The filter came back (`daysOf`) with the one repair the year listing
	 * needed: the chosen day is always a row. A date could be looked up in
	 * that list and simply not be there, which is a defect of the year
	 * listing's rule and not of filtering.
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
	 * ## PAGING DOES NOT MOVE THE SELECTED DAY
	 *
	 * There are two pieces of state here and there were one: the chosen day,
	 * which lives in the URL (`?d=`), and the month being LOOKED AT, which
	 * lives in `view` and belongs to nobody but this component.
	 *
	 * The arrows moved the chosen day by a month until 2026-09-05, on the
	 * argument that one piece of state is better than two and that the address
	 * bar should reproduce the whole screen. What that costs is the thing a
	 * reader actually does with a calendar: LOOKING. Pressing forward twice to
	 * see when Advent starts silently threw away the day they were reading
	 * about, replaced the card above with a day they never chose, and — since
	 * the day of the month is clamped into the new month — could not be undone
	 * by pressing back twice. Turning a page is not choosing.
	 *
	 * `view` FOLLOWS THE CHOSEN DAY, one way only. Pick a day (a row, the date
	 * field, Today, a pasted `?d=`) and the listing goes to that day's month;
	 * page the listing and the chosen day stays where it is. So the two can
	 * only disagree while the reader is browsing, which is the state the
	 * disagreement exists to allow, and any choice at all resolves it.
	 *
	 * THE DAY OF THE MONTH IS KEPT AND CLAMPED — by PageUp/PageDown, which is
	 * the one control that still moves the day by a month. Stepping from 31
	 * March to February lands on the 28th (or the 29th), not on 3 March, and
	 * stepping on lands on 30 April rather than skipping the month. The clamp
	 * is not symmetric — going back to February from the 31st and forward
	 * again gives the 28th — which is the ordinary behaviour of every date
	 * picker and the only one that does not need the component to remember
	 * where the reader started.
	 */
	import { untrack } from 'svelte';
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
		/** The chosen day. The listing goes to its month whenever it moves. */
		selected: DayNumber;
		/** Today in the reader's own zone, marked in the list. */
		today: DayNumber;
		options: CalendarOptions;
		/** The interface language, for the month and weekday names. */
		lang: string;
		/** Called with an ISO date whenever the reader picks a day. Paging does
		 *  not call it — that is the whole of §Paging above. */
		onpick: (iso: string) => void;
	}

	let { selected, today, options, lang, onpick }: Props = $props();

	let listEl: HTMLElement | undefined = $state();
	/** The date to put the keyboard back on once the list has re-rendered —
	 *  see `pick` below. */
	let refocus: string | undefined = $state();

	/**
	 * The month on screen. Seeded from the day the component opens on, moved
	 * by the arrows, and pulled back to the chosen day whenever that changes.
	 *
	 * `untrack` around the write is what keeps the effect from being its own
	 * dependency: it reads `view` to decide whether anything has to change,
	 * and an effect that reads what it writes re-runs itself. The guard also
	 * means paging inside one month costs no re-render.
	 */
	const opened = untrack(() => fromDayNumber(selected));
	let view = $state({ year: opened.year, month: opened.month });
	$effect(() => {
		const s = fromDayNumber(selected);
		untrack(() => {
			if (s.year !== view.year || s.month !== view.month) view = { year: s.year, month: s.month };
		});
	});

	/** How many days a month has, without a table: the first of the next
	 *  month minus the first of this one. Handles February and December. */
	function monthLength(year: number, month: number): number {
		return (
			toDayNumber(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, 1) -
			toDayNumber(year, month, 1)
		);
	}

	/** The month `delta` months from `(year, month)`. */
	function monthOffset(
		year: number,
		month: number,
		delta: number
	): { year: number; month: number } {
		const months = year * 12 + (month - 1) + delta;
		return { year: Math.floor(months / 12), month: (((months % 12) + 12) % 12) + 1 };
	}

	/** The same day-of-month `delta` months from `from`, clamped into the
	 *  month it lands in. PageUp/PageDown is the only caller. */
	function shiftMonths(from: DayNumber, delta: number): DayNumber {
		const here = fromDayNumber(from);
		const { year, month } = monthOffset(here.year, here.month, delta);
		return toDayNumber(year, month, Math.min(here.day, monthLength(year, month)));
	}

	/** Turn a page of the listing. The chosen day is untouched — §Paging. */
	function turn(delta: 1 | -1) {
		view = monthOffset(view.year, view.month, delta);
	}

	/** The locale to name the month and the weekdays in — `dates.ts` holds the
	 *  reason it is not the raw interface tag. */
	const locale = $derived(dateLocale(lang));

	const monthName = $derived(
		new Intl.DateTimeFormat(locale, {
			month: 'long',
			year: 'numeric',
			timeZone: 'UTC'
		}).format(new Date(Date.UTC(view.year, view.month - 1, 1)))
	);

	const weekdayFormat = $derived(
		new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' })
	);

	/** What a row prints: the day's own celebration, or — for a plain weekday
	 *  that still offers something — the first optional memorial or observance,
	 *  which is the only thing that makes such a day worth a look. A day this
	 *  returns nothing for is a day with nothing to say, and is not listed. */
	function rowName(d: LiturgicalDay | undefined): { text: string; optional: boolean } | undefined {
		if (!d) return undefined;
		if (d.celebration.rank !== 'weekday')
			return { text: celebrationName(d.celebration, lang), optional: false };
		const spare = d.optional[0] ?? d.observances[0];
		if (spare) return { text: celebrationName(spare, lang), optional: true };
		return undefined;
	}

	/**
	 * A month's rows: THE DAYS THAT HAVE SOMETHING TO SAY, plus the chosen day
	 * and today.
	 *
	 * The whole month was listed until this filter, and the argument for that
	 * was a real one — the year listing before it dropped the plain weekdays,
	 * and a reader could look a date up in it and simply not find it. What
	 * makes the filter safe is the second half of the rule rather than the
	 * first: `selected` is always a row of ITS OWN month, so the date a reader
	 * asks for is always in the list they are sent to, marked, whether or not
	 * anything is appointed on it. Nothing can be looked up and be missing.
	 * What is dropped is only the dozen-odd rows a month that said "Féria"
	 * beside an empty name — a third of the list, carrying nothing, between the
	 * reader and the days that do.
	 *
	 * Today is kept for the same reason `Hoje` exists: it is the one row a
	 * reader navigates back to, and the accented circle is the landmark they
	 * find it by.
	 *
	 * Taking `(year, month)` rather than reading `view` is what lets the arrow
	 * keys walk off one end of a month into the next — `step` below builds the
	 * neighbour's list with it.
	 */
	function daysOf(year: number, month: number) {
		const first = toDayNumber(year, month, 1);
		return Array.from({ length: monthLength(year, month) }, (_, i) => {
			const n = first + i;
			return {
				n,
				iso: formatIsoDate(n),
				day: i + 1,
				weekdayName: weekdayFormat.format(new Date(Date.UTC(year, month - 1, i + 1))),
				liturgical: liturgicalDay(n, options)
			};
		})
			.filter((d) => rowName(d.liturgical) !== undefined || d.n === selected || d.n === today)
			.map((d, i) => ({
				// The rule that stands in for the grid's columns, decided AFTER
				// the filter: it marks the first row of each week, and on the
				// first row of the list it would be a second line under the
				// header rather than a division within it.
				...d,
				weekStart: i > 0 && weekday(d.n) === SUNDAY
			}));
	}

	const days = $derived(daysOf(view.year, view.month));

	/**
	 * Every way of choosing a day goes through here.
	 *
	 * The one thing it does besides the navigation is the REFOCUS, which is
	 * for the keyboard and cannot be avoided: `onpick` re-renders the list,
	 * and a move that crosses a month boundary replaces every row in it, so
	 * the element the reader was standing on is gone by the time the browser
	 * would restore focus to it. `refocus` names the date to stand on and the
	 * effect puts the keyboard there once the new rows exist. `keepFocus` on
	 * the `goto` is what stops SvelteKit throwing focus to `<body>` in
	 * between.
	 */
	function pick(target: DayNumber, focusRow = false) {
		const iso = formatIsoDate(target);
		if (focusRow) refocus = iso;
		onpick(iso);
	}

	/**
	 * One row up or down from `from`, ACROSS the month boundary.
	 *
	 * A row and a day stopped being the same thing when the empty days left
	 * the list, and the arrows follow the rows: what the reader sees is a
	 * list, and a list is walked from one line to the next. Stepping by a
	 * calendar day instead would make a hidden feria appear under the caret
	 * for one keystroke and vanish again, which is a list that rearranges
	 * itself as you read it.
	 *
	 * Off either end, the neighbouring month's own list supplies the next row
	 * — its last if we walked backwards off the top, its first if forwards off
	 * the bottom — so the arrows never dead-end at the edge of a month.
	 */
	function step(from: DayNumber, delta: 1 | -1): DayNumber {
		const here = days.findIndex((d) => d.n === from);
		const next = days[here + delta];
		if (next) return next.n;
		const { year, month } = monthOffset(view.year, view.month, delta);
		const over = daysOf(year, month);
		return (delta > 0 ? over[0] : over[over.length - 1]).n;
	}

	/**
	 * Arrow keys walk the list, which is what makes it navigable without a
	 * mouse and without thirty tab stops.
	 *
	 * Every move is a real navigation and the URL follows — there is no
	 * "focused but not selected" state to explain, and a reader who arrows to
	 * a day and stops has that day's card above them. Up and down are one ROW,
	 * a month is PageUp/PageDown, and Home/End are the ends of the month's
	 * list. Left and right are deliberately untouched: in a vertical list they
	 * mean nothing, and binding them would take them away from the browser.
	 *
	 * IT MOVES FROM THE ROW, not from `selected`, which the arrows on screen
	 * no longer keep in the listed month (§Paging). A reader who paged to
	 * March and tabbed into the list is standing on a March row; stepping from
	 * a chosen day in February would jump them somewhere they are not looking.
	 */
	function onRowKeydown(event: KeyboardEvent, from: DayNumber) {
		const target = {
			ArrowUp: () => step(from, -1),
			ArrowDown: () => step(from, 1),
			PageUp: () => shiftMonths(from, -1),
			PageDown: () => shiftMonths(from, 1),
			Home: () => days[0].n,
			End: () => days[days.length - 1].n
		}[event.key];
		if (target === undefined) return;
		event.preventDefault();
		pick(target(), true);
	}

	$effect(() => {
		if (!refocus) return;
		const row = listEl?.querySelector<HTMLElement>(`[data-date="${refocus}"]`);
		refocus = undefined;
		row?.focus();
	});
</script>

<section class="month">
	<header>
		<button
			type="button"
			class="menu-trigger step-btn"
			aria-label={t('calendar.previousMonth')}
			title={t('calendar.previousMonth')}
			onclick={() => turn(-1)}
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
			onclick={() => turn(1)}
		>
			<Icon name="arrow-right" />
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
						pick(d.n);
					}}
					onkeydown={(e) => onRowKeydown(e, d.n)}
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
	 * The month's name between its two arrows — the arrangement every calendar
	 * uses, and the reason it is not three buttons in a row is that the name is
	 * the thing being changed and belongs between the controls that change it.
	 *
	 * Today used to sit at the end of this row and moved up to the page's
	 * control row (2026-09-05): beside two arrows that turn a page it read as a
	 * third month control, and it is not one — it names a DAY, like the date
	 * field it now stands next to.
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
	/* An arrow is a picture of a direction, not a character, so nothing flips
	   it under `dir="rtl"` — `UnitNav`'s docblock has the argument. The row
	   mirrors on its own; this turns the mark to point the same way. */
	header:dir(rtl) .step-btn :global(svg) {
		transform: scaleX(-1);
	}

	/*
	 * THE LIST IS AS LONG AS THE MONTH IS, and it is the LAST thing on the
	 * page for that reason: a month of twelve rows and a month of twenty-nine
	 * leave the page different heights, and nothing is below it to be moved.
	 */
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
		/* Carried by EVERY row, transparent until one is chosen, so that
		   marking the selection cannot change where the text begins. */
		border-inline-start: 2px solid transparent;
		text-decoration: none;
		color: inherit;
	}
	a:hover {
		background: var(--color-bg-elevated);
	}
	/*
	 * THE SELECTED ROW IS MARKED WITHOUT TOUCHING ITS TEXT METRICS, which the
	 * `font-weight: 600` this replaces did not manage: a celebration's name
	 * runs to a hundred characters — "Saints Pedro Poveda Castroverde and
	 * Inocencio of the Immaculate Canoura Arnau, Priests, and Companions,
	 * Martyrs" — so on any row sitting near the wrap, bolding it pushed the
	 * name onto a second line and shoved every row below it down. Clicking
	 * down the list made the list jump under the cursor.
	 *
	 * A bar and a tint say the same thing and occupy the same space. The
	 * weight survives on the day NUMBER, which is given a fixed inline size
	 * and cannot reflow whatever it wears.
	 */
	a.selected {
		background: var(--color-bg-elevated);
		border-inline-start-color: var(--color-accent);
	}
	a.selected .num {
		font-weight: 700;
	}
	/* Not on today, whose number is already white-on-accent — and the name
	   keeps its own colour, because a muted one is saying the celebration is
	   optional and selecting the row does not make it obligatory. */
	a.selected:not(.is-today) .num {
		color: var(--color-text);
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
