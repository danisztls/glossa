<script lang="ts">
	/**
	 * A civil month of the liturgical calendar, as a grid.
	 *
	 * ## Why a month and not the year
	 *
	 * This replaced a flat list of the whole liturgical year, Advent to
	 * Advent, filtered down to the days that were not plain weekdays — about
	 * 230 rows. It answered "what is coming" and answered nothing else: a
	 * reader who wanted a particular date had to scan for it, a reader who
	 * wanted to know what day of the week Easter falls on could not tell at
	 * all, and the shape of a season — a run of green with a red day in it —
	 * was invisible in a column of text.
	 *
	 * A month grid is what a calendar looks like, which is the whole argument.
	 * It costs the year view, and that is a real loss for the one question the
	 * list was good at; what buys it back is that stepping a month is one
	 * press, so the year is twelve presses away rather than absent.
	 *
	 * ## The grid navigates by MOVING THE SELECTED DAY
	 *
	 * There is no separate "month being viewed". The month shown is the month
	 * of `selected`, and the arrows move `selected` by a month — so the page
	 * keeps ONE piece of state, which lives in the URL (`?d=`), and the
	 * address in the bar always reproduces exactly what is on the screen.
	 *
	 * The alternative — a view month held in the component, independent of the
	 * selected day — is what a mail client's calendar does, and it is wrong
	 * here: this page's whole content below the grid is one day, so a reader
	 * paging to March and seeing February's feast underneath has been shown
	 * two different months at once. Paging moves the day.
	 *
	 * THE DAY OF THE MONTH IS KEPT AND CLAMPED. Stepping from 31 March to
	 * February lands on the 28th (or the 29th), not on 3 March, and stepping
	 * on lands on 31 April's neighbour rather than skipping the month. The
	 * clamp is not symmetric — going back to February from the 31st and
	 * forward again gives the 28th, not the 31st — which is the ordinary
	 * behaviour of every date picker and the only one that does not need the
	 * component to remember where the reader started.
	 *
	 * ## The week begins on Sunday
	 *
	 * Not from the reader's locale, and deliberately: this is a LITURGICAL
	 * calendar, whose week begins on the Lord's Day (Universal Norms n. 4).
	 * The Sunday is the day the rest of the week is numbered from — "Monday of
	 * the Second Week of Lent" is Monday AFTER that Sunday — so a grid that
	 * put Monday first would break the one row a reader of this page is
	 * looking at into two.
	 *
	 * `Intl.Locale`'s `weekInfo` could answer the civil question and is
	 * unavailable in Firefox anyway; it is not the question.
	 */
	import {
		celebrationName,
		formatIsoDate,
		fromDayNumber,
		liturgicalDay,
		onOrBefore,
		SATURDAY,
		SUNDAY,
		toDayNumber,
		type CalendarOptions,
		type DayNumber,
		type LiturgicalDay
	} from '$lib/calendar';
	import { dateLocale } from '$lib/dates';
	import { t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		/** The chosen day. Its month is the month drawn. */
		selected: DayNumber;
		/** Today in the reader's own zone, marked in the grid. */
		today: DayNumber;
		options: CalendarOptions;
		/** The interface language, for the month and weekday names. */
		lang: string;
		/** Called with an ISO date whenever the reader picks or pages. */
		onpick: (iso: string) => void;
	}

	let { selected, today, options, lang, onpick }: Props = $props();

	let gridEl: HTMLElement | undefined = $state();
	/** The date to put the keyboard back on once the grid has re-rendered —
	 *  see `moveBy` below. */
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

	/**
	 * The weeks drawn: from the Sunday on or before the 1st to the Saturday on
	 * or after the last day.
	 *
	 * FOUR TO SIX ROWS, whichever the month needs, rather than a fixed six.
	 * A fixed grid keeps the page from reflowing as the reader pages, which is
	 * a real virtue; what it costs is a whole empty week below February in a
	 * common year, and this grid sits above the day it describes rather than
	 * beside other months, so nothing lines up with it to be disturbed.
	 */
	const weeks = $derived.by(() => {
		const first = toDayNumber(ymd.year, ymd.month, 1);
		const start = onOrBefore(first, SUNDAY);
		const last = first + monthLength(ymd.year, ymd.month) - 1;
		const end = onOrBefore(last + 6, SATURDAY);
		const rows: {
			n: DayNumber;
			iso: string;
			day: number;
			outside: boolean;
			liturgical: LiturgicalDay | undefined;
		}[][] = [];
		for (let n = start; n <= end; n += 7) {
			rows.push(
				Array.from({ length: 7 }, (_, i) => {
					const d = n + i;
					const parts = fromDayNumber(d);
					return {
						n: d,
						iso: formatIsoDate(d),
						day: parts.day,
						outside: parts.month !== ymd.month,
						liturgical: liturgicalDay(d, options)
					};
				})
			);
		}
		return rows;
	});

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

	/** The seven column headings, in the reader's own language. Taken off a
	 *  known week (7 January 2024 was a Sunday) rather than off the month
	 *  being drawn, so they do not change as the reader pages. */
	const weekdayNames = $derived(
		Array.from({ length: 7 }, (_, i) => {
			const d = new Date(Date.UTC(2024, 0, 7 + i));
			return {
				short: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(d),
				long: new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(d)
			};
		})
	);

	/** What a cell prints under its number: the day's own celebration, or —
	 *  for a plain weekday that still offers something — the first optional
	 *  memorial, which is the only thing that makes such a day worth a look. */
	function cellName(d: LiturgicalDay | undefined): { text: string; optional: boolean } | undefined {
		if (!d) return undefined;
		if (d.celebration.rank !== 'weekday')
			return { text: celebrationName(d.celebration, lang), optional: false };
		if (d.optional.length > 0)
			return { text: celebrationName(d.optional[0], lang), optional: true };
		return undefined;
	}

	/**
	 * Arrow keys walk the grid, which is what makes it a calendar rather than
	 * a page of forty buttons.
	 *
	 * Every move goes through `onpick`, so it is a real navigation and the URL
	 * follows — there is no "focused but not selected" state to explain, and a
	 * reader who arrows to a day and stops has that day's card below them.
	 *
	 * THE REFOCUS IS THE AWKWARD HALF and it cannot be avoided: `onpick`
	 * re-renders the grid, and a move that crosses a month boundary replaces
	 * every cell in it, so the element the reader was standing on is gone by
	 * the time the browser would restore focus to it. `refocus` names the date
	 * to stand on and the effect below puts the keyboard there once the new
	 * cells exist. `keepFocus` on the `goto` is what stops SvelteKit throwing
	 * focus to `<body>` in between.
	 *
	 * The handler is on the CELL and not on the table, though the event would
	 * bubble either way: a `<table>` is not interactive, and a keyboard
	 * listener on one is a promise to keyboard users that the element takes
	 * focus. The cells are the buttons; they are what takes it.
	 */
	function moveBy(days: number) {
		const target = selected + days;
		refocus = formatIsoDate(target);
		onpick(refocus);
	}

	function onGridKeydown(event: KeyboardEvent) {
		const step = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -7,
			ArrowDown: 7
		}[event.key];
		if (step !== undefined) {
			event.preventDefault();
			// An arrow is a picture of a direction and the grid mirrors under
			// `dir="rtl"`, so left and right have to mirror with it — unlike
			// the step buttons, whose GLYPH is flipped instead.
			const rtl = getComputedStyle(gridEl!).direction === 'rtl';
			moveBy(Math.abs(step) === 1 && rtl ? -step : step);
			return;
		}
		if (event.key === 'Home' || event.key === 'End') {
			event.preventDefault();
			const sunday = onOrBefore(selected, SUNDAY);
			moveBy((event.key === 'Home' ? sunday : sunday + 6) - selected);
			return;
		}
		if (event.key === 'PageUp' || event.key === 'PageDown') {
			event.preventDefault();
			const target = shiftMonths(event.key === 'PageUp' ? -1 : 1);
			refocus = formatIsoDate(target);
			onpick(refocus);
		}
	}

	$effect(() => {
		if (!refocus) return;
		const cell = gridEl?.querySelector<HTMLElement>(`[data-date="${refocus}"]`);
		refocus = undefined;
		cell?.focus();
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
		     month they landed in; the grid below is far too large to announce. -->
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
		A REAL TABLE, not a grid of divs with ARIA on it. The weekday is a
		column header of every cell under it, which is a relationship `<th
		scope="col">` states for nothing and `role="grid"` would need
		`aria-describedby` on forty-two buttons to imitate.
	-->
	<table bind:this={gridEl}>
		<caption class="visually-hidden">{monthName}</caption>
		<thead>
			<tr>
				{#each weekdayNames as w, i (i)}
					<th scope="col" abbr={w.long}><abbr title={w.long}>{w.short}</abbr></th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each weeks as week (week[0].iso)}
				<tr>
					{#each week as cell (cell.iso)}
						{@const name = cellName(cell.liturgical)}
						<td>
							<button
								type="button"
								data-date={cell.iso}
								class="cell"
								class:outside={cell.outside}
								class:selected={cell.n === selected}
								class:is-today={cell.n === today}
								aria-current={cell.n === selected ? 'date' : undefined}
								title={name?.text}
								onclick={() => onpick(cell.iso)}
								onkeydown={onGridKeydown}
							>
								<span class="head">
									<span class="num">{cell.day}</span>
									{#if cell.liturgical}
										<span class="swatch" data-colour={cell.liturgical.colour} aria-hidden="true"
										></span>
									{/if}
								</span>
								{#if cell.n === today}
									<span class="visually-hidden">{t('calendar.today')}</span>
								{/if}
								{#if name}
									<span class="name" class:optional={name.optional}>{name.text}</span>
								{/if}
							</button>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
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

	table {
		inline-size: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}

	th {
		padding: 0 0 0.3rem;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}
	/* The browser's own dotted underline on an `<abbr title>` reads as a
	   spelling error under a three-letter word. The title is still there. */
	th abbr {
		text-decoration: none;
	}

	td {
		padding: 0;
		border: 1px solid var(--color-border);
	}

	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		inline-size: 100%;
		/* Tall enough for a number and two lines of a name at the size below;
		   a fixed height keeps every week the same depth whether or not the
		   days in it have names, which is what makes the grid read as a grid. */
		block-size: 4.25rem;
		padding: 0.25rem 0.3rem;
		border: 2px solid transparent;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: pointer;
	}
	.cell:hover {
		background: var(--color-bg-elevated);
	}
	.cell:focus-visible {
		/* Inside the border rather than around it: an outline on a collapsed
		   table border is drawn under the neighbouring cell on one side. */
		outline: none;
		border-color: var(--color-accent);
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.num {
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		line-height: 1.4;
	}
	/* Sized against the number beside it — the primitive is `em`-based for
	   exactly this (styles/components.css). */
	.head .swatch {
		font-size: 0.8rem;
	}

	/*
	 * A DAY OF THE NEXT MONTH IS SHOWN AND IS NOT DIMMED TO NOTHING. It is
	 * still a real day with a real feast on it, and the last row of a month is
	 * where a reader looks for the first days of the next one; drawing them at
	 * 30% would make the answer visible and unreadable at the same time.
	 * What marks them is the number, which is the part that says which month
	 * the cell belongs to.
	 */
	.outside .num {
		color: var(--color-text-muted);
	}
	.outside .name {
		opacity: 0.6;
	}

	.name {
		font-size: 0.7rem;
		line-height: 1.25;
		overflow: hidden;
		/* Two lines and then an ellipsis. `line-clamp` needs the legacy box
		   display to take effect; the `title` on the button carries the whole
		   name for anything the clamp cuts. */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
	}
	.name.optional {
		color: var(--color-text-muted);
	}

	/* Today is marked on the NUMBER and the selection on the CELL, so a reader
	   can see both at once — on the day they are the same cell, and any other
	   day the two marks must not compete for the same edge. */
	.is-today .num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		inline-size: 1.5em;
		block-size: 1.5em;
		border-radius: 50%;
		background: var(--color-accent);
		color: var(--color-bg);
		font-weight: 600;
	}
	.selected {
		border-color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/*
	 * BELOW THIS WIDTH THE NAMES GO AND THE DOTS STAY. Seven columns of a
	 * phone's width is about 3rem a cell, which is four or five characters —
	 * enough to show that there is a name and never enough to read it. The
	 * swatch still carries the season, the card below carries the day, and the
	 * grid becomes what it can be at that size: a date picker.
	 */
	@media (max-width: 34rem) {
		.cell {
			block-size: 2.75rem;
			align-items: center;
			justify-content: center;
			text-align: center;
		}
		.head {
			flex-direction: column;
			gap: 0.1rem;
		}
		.name {
			display: none;
		}
	}
</style>
