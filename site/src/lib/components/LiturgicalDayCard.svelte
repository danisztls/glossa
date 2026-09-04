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
	 */
	import { celebrationName, type Celebration, type LiturgicalDay } from '$lib/calendar';
	import { formatPromulgated } from '$lib/dates';
	import { i18n, t } from '$lib/i18n.svelte';

	interface Props {
		day: LiturgicalDay;
		/** Render the heading as the page's `h1` rather than an `h2`. */
		heading?: 'h1' | 'h2';
	}
	let { day, heading = 'h2' }: Props = $props();

	let lang = $derived(i18n.lang);
	let name = $derived(celebrationName(day.celebration, lang));

	/** The season and week, as one line: "Ordinary Time, week 10". A week of
	 *  0 is the stretch between Ash Wednesday and the First Sunday of Lent,
	 *  which is genuinely not in a numbered week and says so by omission.
	 *
	 *  The comma is doing work: the middle dots below separate the FACTS from
	 *  each other, and a season that also used one would read as two of them. */
	let season = $derived(
		day.week > 0
			? `${t(`calendar.season.${day.season}`)}, ${t('calendar.week')} ${day.week}`
			: t(`calendar.season.${day.season}`)
	);

	function rankLabel(c: Celebration): string {
		return t(`calendar.rank.${c.rank}`);
	}
</script>

<article class="day">
	<header>
		<p class="date">{formatPromulgated(day.date, lang)}</p>
		{#if heading === 'h1'}
			<h1>{name}</h1>
		{:else}
			<h2>{name}</h2>
		{/if}
		<p class="meta">
			<span class="colour">
				<span class="swatch" data-colour={day.colour} aria-hidden="true"></span>
				{t(`calendar.colour.${day.colour}`)}
			</span>
			<span class="rank">{rankLabel(day.celebration)}</span>
			<span class="season">{season}</span>
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
	</header>

	<dl class="facts">
		{#if day.holyDayOfObligation}
			<div>
				<dt>{t('calendar.obligation')}</dt>
				<!-- The canon is in the corpus in seven languages, so the claim
				     links to its own authority rather than asserting itself. -->
				<dd><a href="/ius-canonicum/1246">{t('calendar.obligationCanon')}</a></dd>
			</div>
		{/if}
		<div>
			<dt>{t('calendar.sundayCycle')}</dt>
			<dd>{day.sundayCycle}</dd>
		</div>
		<div>
			<dt>{t('calendar.weekdayCycle')}</dt>
			<dd>{day.weekdayCycle}</dd>
		</div>
		<div>
			<dt>{t('calendar.psalterWeek')}</dt>
			<dd>{['', 'I', 'II', 'III', 'IV'][day.psalterWeek]}</dd>
		</div>
	</dl>

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
	.date {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
	h1,
	h2 {
		margin: 0.2rem 0 0.4rem;
		line-height: 1.2;
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
</style>
