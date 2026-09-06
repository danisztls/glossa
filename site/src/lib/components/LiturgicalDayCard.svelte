<script lang="ts">
	/**
	 * One day of the liturgical calendar, rendered.
	 *
	 * Shared between `/calendarium` (today, and any date a reader walks to)
	 * and the year listing, so that the two cannot come to disagree about what
	 * a rank or a colour looks like — the same reason `dates.ts` exists.
	 *
	 * THE COLOUR IS SHOWN AS A NAMED SWATCH AND NEVER AS THE PAGE'S OWN
	 * COLOUR. Painting the card violet in Lent would be prettier and would
	 * also be a claim the site cannot make in a reader's own theme: the
	 * liturgical colours are vestment colours, four of which are also this
	 * interface's background in one theme or another. A small disc beside a
	 * translated word says the same thing without the page pretending to be
	 * the sanctuary.
	 *
	 * IT IS AS TALL AS THE DAY IT SHOWS, and that was decided twice. It was
	 * held to a fixed height on `/calendarium` for one day, so that the month
	 * listing under it would not move when the reader clicked a row — and the
	 * height that fits an ordinary weekday clips a day that has more to say,
	 * which is the one thing a card answering a question may not do. The list
	 * below moves instead. See the route's docblock for the trade in full.
	 */
	import {
		celebrationName,
		ensureCelebrationNames,
		parseIsoDate,
		type Celebration,
		type LiturgicalDay
	} from '$lib/calendar';
	import { formatPromulgated, relativeDay } from '$lib/dates';
	import { i18n, t } from '$lib/i18n.svelte';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import { primeLectionary, readingsFor } from '$lib/lectionary';
	import DayReadings from './DayReadings.svelte';
	import TermGloss from './TermGloss.svelte';

	interface Props {
		day: LiturgicalDay;
		/**
		 * The controls that decide WHICH DAY this is — the date field, Today
		 * and the calendar picker on `/calendarium`, the calendar picker alone
		 * on the home page.
		 *
		 * THEY BELONG IN THE CARD BECAUSE THE CARD IS THE ANSWER THEY CHANGE.
		 * They stood above it on `/calendarium` until 2026-09-06, in a row of
		 * their own, and the arrangement had two costs: a bordered box under a
		 * line of loose controls reads as a lid, and the home page — which
		 * shows one day and had nowhere to put a control — could not offer the
		 * picker at all, so it was stuck in the general calendar however the
		 * reader had answered the same question next door.
		 */
		controls?: Snippet;
		/** Render the heading as the page's `h1` rather than an `h2`. */
		heading?: 'h1' | 'h2';
		/**
		 * Print the civil date above the celebration's name.
		 *
		 * TRUE ON BOTH PAGES SINCE 2026-09-06, and it was false on
		 * `/calendarium` for as long as that page had a date field: the field
		 * printed the same date in the same words a centimetre above, and a
		 * card repeating it would have been the page answering a question it
		 * had just been asked. The field is gone — the month listing is how a
		 * day is chosen — so the card says which day it is on both pages, in
		 * the same place, which is the whole of what is left of the prop.
		 */
		showDate?: boolean;
		/**
		 * Today, as a day number in the READER'S zone, so the date can be
		 * named `today`, `yesterday` or `tomorrow` where it is one of them.
		 *
		 * PASSED IN RATHER THAN READ HERE, because the clock is not this
		 * component's to read: both pages already take it once on mount (a
		 * card rendered from a prerendered shell would otherwise date itself
		 * to the build), and a second reading could disagree with the first
		 * across midnight.
		 */
		today?: number;
		/**
		 * A way out of the card, drawn as a glyph in its top corner.
		 *
		 * The home page passes `/calendarium`, being the one surface that shows
		 * a day without being the calendar; `/calendarium` passes nothing, a
		 * link to the page you are on being no link at all. It is a prop rather
		 * than a fixed anchor for exactly that reason — the card is shared, and
		 * only its caller knows whether there is anywhere to go.
		 *
		 * `label` is the accessible name AND the tooltip: the glyph carries no
		 * text, so the string is the only thing that says where it leads.
		 */
		more?: { href: string; label: string };
	}
	let { day, heading = 'h2', controls, showDate = true, today, more }: Props = $props();

	let lang = $derived(i18n.lang);

	/**
	 * Ask for the reader's own table of celebration names.
	 *
	 * The General Calendar's names in twenty languages are a chunk per language
	 * and none of them is in the boot graph (`calendar/names.svelte.ts`), so
	 * something that renders a name has to ask. A miss renders English and
	 * re-renders when the chunk lands; a language with no table never resolves
	 * to one and English is the answer.
	 */
	$effect(() => void ensureCelebrationNames(lang));
	let name = $derived(celebrationName(day.celebration, lang));

	/** The lectionary table is fetched rather than imported, to keep 138 KB out
	 *  of the boot chunk this card is reached from (`$lib/lectionary` has the
	 *  argument), so the readings arrive after the first paint. A failure is
	 *  swallowed deliberately: the readings are an addition to a card that
	 *  answers perfectly well without them, and an error banner over a day's
	 *  name would be the page shouting about its own apparatus. */
	let tableReady = $state(false);
	$effect(() => {
		primeLectionary().then(
			() => (tableReady = true),
			() => {}
		);
	});

	/** Null for any date the lectionary table does not cover, and the card then
	 *  shows nothing rather than an empty heading — the same posture the rest
	 *  of this card takes toward a fact it does not have. */
	let readings = $derived(tableReady ? readingsFor(day) : null);

	/** The season's name — the part a reader may not know, and so the part the
	 *  gloss hangs on; the week is printed after it as plain text. A week of 0
	 *  is the stretch between Ash Wednesday and the First Sunday of Lent, which
	 *  is genuinely not in a numbered week and says so by omission.
	 *
	 *  The comma is doing work: the middle dots below separate the FACTS from
	 *  each other, and a season that also used one would read as two of them. */
	let seasonName = $derived(t(`calendar.season.${day.season}`));
	let weekSuffix = $derived(day.week > 0 ? `, ${t('calendar.week')} ${day.week}` : '');

	/**
	 * `today` / `yesterday` / `tomorrow`, or nothing at all.
	 *
	 * It is the RELATION and not a second date: a reader looking at the home
	 * page wants to know that the day in front of them is the day they are
	 * living in, and one who has walked three days into next week is told the
	 * date, which already says it. `dates.ts` argues why the word comes from
	 * `Intl` rather than from the dictionaries.
	 */
	let relative = $derived.by(() => {
		const n = parseIsoDate(day.date);
		if (n === undefined || today === undefined) return undefined;
		return relativeDay(n - today, lang);
	});

	function rankLabel(c: Celebration): string {
		return t(`calendar.rank.${c.rank}`);
	}
</script>

<article class="day">
	<header>
		<!--
			THE DATE LEADS THE CARD, on both pages, and it spent an afternoon
			in the corner beside the controls (2026-09-06). What was wrong
			there is what the corner IS: furniture — the things that change
			the day or leave it. The date is not furniture, it is the first
			thing the card says, and it belongs where a reader looks first
			rather than at the far end of a row of buttons.
		-->
		{#if showDate}
			<p class="date">
				{formatPromulgated(day.date, lang)}{#if relative}<span class="relative">{relative}</span
					>{/if}
			</p>
		{/if}
		{#if heading === 'h1'}
			<h1>{name}</h1>
		{:else}
			<h2>{name}</h2>
		{/if}
		<!--
		EVERY WORD ON THIS LINE IS A TERM OF ART and a reader meeting the page
		for the first time knows none of them: a colour that is a vestment
		colour, a rank out of the Universal Norms, a season that is not the
		English word. Each carries its own explanation (`TermGloss`), and the
		same sentences are set out whole in the primer at the foot of
		`/calendarium` — written once, in the dictionary, so the two cannot
		come to disagree.
	-->
		<p class="meta">
			<span class="colour">
				<span class="swatch" data-colour={day.colour} aria-hidden="true"></span>
				<TermGloss
					term={t(`calendar.colour.${day.colour}`)}
					gloss={t(`calendar.gloss.colour.${day.colour}`)}
				/>
			</span>
			<span class="rank">
				<TermGloss
					term={rankLabel(day.celebration)}
					gloss={t(`calendar.gloss.rank.${day.celebration.rank}`)}
				/>
			</span>
			<span class="season"
				><TermGloss
					term={seasonName}
					gloss={t(`calendar.gloss.season.${day.season}`)}
				/>{weekSuffix}</span
			>
		</p>
		{#if day.celebration.transferredFrom}
			<!-- Said out loud rather than shown silently on the wrong day: a
			     solemnity impeded by Holy Week is kept elsewhere, and a reader
			     looking for it on its own date deserves to know why it moved. -->
			<p class="transferred">
				{t('calendar.transferredFrom')}
				{formatPromulgated(day.celebration.transferredFrom, lang)}
			</p>
		{/if}
		<!--
			THE CORNER HOLDS BOTH: what changes the day, and the way out of
			the card. It rides the DATE'S LINE, at the far right of it, while
			staying LAST in the DOM, so a screen reader and a keyboard meet
			the day before the controls that change it. Until 2026-09-06 it
			was a column of the header and went above the name on a narrow
			screen, where two glyphs took a whole line of a phone directly
			over the shortest line the card has.
		-->
		{#if controls || more}
			<div class="corner">
				{#if controls}
					<div class="controls">{@render controls()}</div>
				{/if}
				<!--
					THE WAY OUT IS A GLYPH IN THE CORNER, and was a sentence under
					the card until 2026-09-06. `Liturgical Calendar →` sat below the
					box as the home page's only trailing link, which read as a
					caption on the card rather than as part of it and put the one
					control the card has outside its own border. In the corner it
					belongs to the card, and it sits on the date's line, so a
					celebration whose name runs to three lines does not carry it
					down the box.

					`title` AND `aria-label` carry the same string, which is the rule
					for every icon-only control on the site (`.menu-trigger`'s own):
					the glyph is `aria-hidden` by `Icon.svelte`'s enforcement, so
					without the label the link announces its href.
				-->
				{#if more}
					<a class="day-more" href={more.href} aria-label={more.label} title={more.label}>
						<Icon name="calendar" />
					</a>
				{/if}
			</div>
		{/if}
	</header>

	<dl class="facts">
		{#if day.holyDayOfObligation}
			<div>
				<dt>
					<TermGloss term={t('calendar.obligation')} gloss={t('calendar.gloss.obligation')} />
				</dt>
				<!-- The canon is in the corpus in seven languages, so the claim
				     links to its own authority rather than asserting itself. -->
				<dd><a href="/ius-canonicum/1246">{t('calendar.obligationCanon')}</a></dd>
			</div>
		{/if}
		<div>
			<dt>
				<TermGloss term={t('calendar.sundayCycle')} gloss={t('calendar.gloss.sundayCycle')} />
			</dt>
			<dd>{day.sundayCycle}</dd>
		</div>
		<div>
			<dt>
				<TermGloss term={t('calendar.weekdayCycle')} gloss={t('calendar.gloss.weekdayCycle')} />
			</dt>
			<dd>{day.weekdayCycle}</dd>
		</div>
		<div>
			<dt>
				<TermGloss term={t('calendar.psalterWeek')} gloss={t('calendar.gloss.psalterWeek')} />
			</dt>
			<dd>{['', 'I', 'II', 'III', 'IV'][day.psalterWeek]}</dd>
		</div>
	</dl>

	{#if readings}
		<!-- Above the optional memorials, because the readings are what a
		     reader arriving by date came for, and the memorials are context. -->
		<DayReadings masses={readings} />
	{/if}

	{#if day.optional.length > 0}
		<section class="optional">
			<h3>{t('calendar.alsoToday')}</h3>
			<ul>
				{#each day.optional as c (c.id)}
					<li>
						<span class="swatch" data-colour={c.colour} aria-hidden="true"></span>
						{celebrationName(c, lang)}
						<span class="rank-inline">{rankLabel(c)}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if day.observances.length > 0}
		<!--
			An observance is not a celebration and is kept apart from them —
			`Observance` in `$lib/calendar/types.ts`. Thanksgiving is a Thursday
			in Ordinary Time with a Mass appointed for it, and putting it in the
			list above would make it a rank the Church has not given it.
		-->
		<section class="optional">
			<h3>{t('calendar.alsoObserved')}</h3>
			<ul>
				{#each day.observances as o (o.id)}
					<li>
						<span class="swatch" data-colour={o.colour ?? 'white'} aria-hidden="true"></span>
						{celebrationName(o, lang)}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>

<style>
	.day {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 1rem 1.25rem;
	}
	/*
	 * THE HEADER IS ONE COLUMN AND A CORNER ON ITS FIRST LINE. The corner used
	 * to be a column of the header, level with the top of the whole block; it
	 * now shares the DATE'S row and nothing else's, which is the same place on
	 * a wide screen and one line saved on a narrow one — the date is the
	 * shortest line the card has, and the two glyphs beside it were taking a
	 * line of their own above the name.
	 *
	 * `minmax(0, 1fr)` so a long celebration name wraps inside its own column
	 * rather than pushing the corner off the card. Everything else in here is
	 * column 1 and finds its own row; only the corner is placed, which is what
	 * lets it stay LAST in the DOM — see the markup. Placing it by hand is
	 * also what dissolved `.head-text`: the text needed a wrapper of its own
	 * while it was one item of a two-column header, and the header IS that
	 * block now. One layout at every width, so there is no breakpoint here.
	 *
	 * The corner is empty on a card given neither `controls` nor `more` — the
	 * grid costs that card nothing, an absent second item taking no track.
	 */
	header {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		column-gap: 0.75rem;
	}
	header > * {
		grid-column: 1;
	}
	/*
	 * The two corner items are one row: `/calendarium` puts the picker here and
	 * the home page the picker and the way out. `end` because the row is as
	 * wide as the card and the corner is furniture — it belongs at the edge the
	 * date's line runs to, not floating a word away from it.
	 *
	 * `center` HERE AND on the grid above, which are not the same question.
	 * The grid's sits a 1.75rem trigger against a 0.85rem date rather than
	 * hanging it off the top of the line; this one centres a 1.75rem glyph
	 * against a 2rem trigger, which top-aligned sit a couple of pixels apart
	 * for no reason a reader could name.
	 */
	.corner {
		grid-column: 2;
		grid-row: 1;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.4rem;
	}
	/*
	 * EVERY CONTROL IN THIS CORNER IS BORDERLESS, which is `.day-more`'s look
	 * below applied to the company it keeps. Boxed, they were three or four
	 * bordered rectangles inside a bordered card, a centimetre from its
	 * corner: a box inside a box reads as a second card rather than as the
	 * furniture of the first. Muted at rest and answering with the accent over
	 * an elevated ground says "control" quite as clearly at this size, and it
	 * is what the reading bar already does with its own toggles.
	 *
	 * `.menu-trigger` is the CHROME's vocabulary (`styles/menus.css`) and is
	 * overridden rather than avoided: the class carries the shape, the
	 * keyboard behaviour and the panel's positioning, and only its skin is
	 * wrong in here. The declarations below are exactly that skin — border,
	 * ground, colour, and the square shrunk from the header's 2.25rem to the
	 * 1.75rem the glyph and the date share.
	 */
	.corner :global(.menu-trigger) {
		width: 1.75rem;
		height: 1.75rem;
		border-color: transparent;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.85rem;
	}
	.corner :global(.menu-trigger.wide) {
		width: auto;
		padding-inline: 0.4rem;
	}
	.corner :global(.menu-trigger:hover),
	.corner :global(.menu-trigger:focus-visible) {
		border-color: transparent;
		background: var(--color-bg-elevated);
		color: var(--color-accent);
	}
	/*
	 * `.menu-trigger`'s shape without its file: a rounded square the size of a
	 * line, muted at rest and answering with the accent. It is not that class
	 * because `menus.css` is the CHROME's vocabulary — a control in a bar or a
	 * panel — and this one lives inside a card in the page's own flow, where
	 * the trigger's fixed 2.25rem square would out-measure the date beside it.
	 */
	.day-more {
		display: grid;
		place-items: center;
		inline-size: 1.75rem;
		block-size: 1.75rem;
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
		text-decoration: none;
	}
	.day-more:hover,
	.day-more:focus-visible {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}
	.date {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	/* The dot the `.meta` line below uses, for the same reason: the word is a
	   second fact about the same day rather than part of the date, and drawing
	   the separator in CSS keeps it out of what a screen reader reads. */
	.relative::before {
		content: '·';
		margin-inline: 0.4rem;
		color: var(--color-border);
	}
	h1,
	h2 {
		margin: 0.2rem 0 0.4rem;
		line-height: 1.2;
	}
	/* With no date above it, the name is the first thing in the box and the
	   0.2rem that separated the two would be a short top padding. */
	h1:first-child,
	h2:first-child {
		margin-top: 0;
	}
	/*
	 * ONE LINE, NOT THREE COLUMNS. These three say what kind of day it is —
	 * its colour, its rank, where it falls in the year — and set as flex items
	 * a centimetre apart they read as an unlabelled table whose headings went
	 * missing. Separated by middle dots they read as what they are: a phrase.
	 * The dots are drawn by CSS rather than put in the markup so that nothing
	 * announces them, and so a wrapped line never begins with one.
	 */
	.meta {
		margin: 0.15rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.55rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	.meta > span + span::before {
		content: '·';
		margin-inline-end: 0.55rem;
		color: var(--color-border);
	}
	.colour {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}
	.transferred {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-style: italic;
	}
	/*
	 * The cycles are the card's FOOTNOTES — a lectionary year, a psalter week:
	 * true, occasionally wanted, and not what anyone opened the page to read.
	 * They were set at the same weight as the name of the feast and separated
	 * from it by nothing but a gap. A rule above them and the muted label
	 * treatment `.optional` already uses put them where they belong, and the
	 * card now reads in three parts: what day it is, the facts about it, and
	 * what else may be kept on it.
	 */
	.facts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1.25rem;
		margin: 0.8rem 0 0;
		border-top: 1px solid var(--color-border);
		padding-top: 0.7rem;
		font-size: 0.82rem;
	}
	.facts div {
		display: flex;
		gap: 0.35rem;
	}
	.facts dt {
		color: var(--color-text-muted);
	}
	.facts dd {
		margin: 0;
	}
	.optional {
		margin-top: 0.9rem;
		border-top: 1px solid var(--color-border);
		padding-top: 0.7rem;
	}
	.optional h3 {
		margin: 0 0 0.35rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}
	.optional ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.optional li {
		margin: 0.15rem 0;
		font-size: 0.92rem;
	}
	.rank-inline {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
	/* A glyph that opens a page says nothing on paper. `print.css` hides the
	   site's chrome by selector; this control is inside a card in the flow, so
	   it has to refuse for itself. */
	@media print {
		.day-more {
			display: none;
		}
	}
</style>
