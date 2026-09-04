<script lang="ts">
	/**
	 * What the calendar's words mean, at the foot of the page that uses them.
	 *
	 * THE DAY'S CARD ANSWERS ONE WORD AT A TIME AND THIS ANSWERS THE PAGE. A
	 * gloss behind a term is the right shape for "what does *Memorial* mean"
	 * and the wrong one for "what is any of this for": a reader who does not
	 * know the vocabulary does not know which word to press first, and pressing
	 * seven of them in turn never adds up to the sentence in `primer.lead` —
	 * that the Church keeps a year of its own, and that a day's name, rank and
	 * colour are what decide the prayers and readings appointed for it.
	 *
	 * THE SENTENCES ARE THE SAME OBJECTS THE GLOSSES USE. Every definition here
	 * is `calendar.gloss.*`, which `TermGloss` reads from the same dictionary,
	 * so the tooltip and the primer cannot come to say different things about
	 * the same word — the reason the card and the year listing shared
	 * `LiturgicalDayCard` in the first place.
	 *
	 * FOLDED, EXCEPT THE LEAD. Twenty-three definitions set out flat would be
	 * longer than the month above them and would make the page look like a
	 * glossary with a calendar attached; a reader who wants one word has the
	 * gloss, and a reader who wants the vocabulary opens the part of it they
	 * are missing. `<details>` and not a component, because that is what the
	 * element is for and it costs no script.
	 *
	 * ONLY THE CALENDAR PAGE RENDERS IT. The home page shows the day's card
	 * too, and does not want a lesson under it — that page is a door, and its
	 * card is a link to here.
	 */
	import { t } from '$lib/i18n.svelte';
	import type { Colour, Rank, Season } from '$lib/calendar';

	/*
	 * The three vocabularies, in the order they are best read: the year in the
	 * order it is kept, the ranks from the greatest day down, the colours from
	 * the ones a reader meets weekly to the ones they may never see.
	 *
	 * `satisfies Record<…, true>` IS THE WHOLE POINT OF THE SHAPE. The record
	 * is total over each union, so a season, rank or colour added to
	 * `calendar/types.ts` without a line here is a type error rather than a
	 * word this page silently declines to explain. An array could not say that.
	 */
	const SEASONS = {
		advent: true,
		christmas: true,
		ordinary: true,
		lent: true,
		triduum: true,
		easter: true
	} satisfies Record<Season, true>;
	const RANKS = {
		solemnity: true,
		feast: true,
		memorial: true,
		'optional-memorial': true,
		commemoration: true,
		sunday: true,
		weekday: true
	} satisfies Record<Rank, true>;
	const COLOURS = {
		green: true,
		white: true,
		red: true,
		violet: true,
		rose: true,
		black: true,
		blue: true
	} satisfies Record<Colour, true>;

	const seasons = Object.keys(SEASONS) as Season[];
	const ranks = Object.keys(RANKS) as Rank[];
	const colours = Object.keys(COLOURS) as Colour[];

	/** The three counters, which have no union to be total over — they are
	 *  fields of `LiturgicalDay`, and the dictionary keys are their names. */
	const CYCLES = ['sundayCycle', 'weekdayCycle', 'psalterWeek'] as const;
</script>

<section class="primer">
	<h2>{t('calendar.primer.title')}</h2>
	<p class="lead">{t('calendar.primer.lead')}</p>

	<details>
		<summary>{t('calendar.primer.seasons')}</summary>
		<dl>
			{#each seasons as season (season)}
				<div>
					<dt>{t(`calendar.season.${season}`)}</dt>
					<dd>{t(`calendar.gloss.season.${season}`)}</dd>
				</div>
			{/each}
		</dl>
	</details>

	<details>
		<summary>{t('calendar.primer.ranks')}</summary>
		<dl>
			{#each ranks as rank (rank)}
				<div>
					<dt>{t(`calendar.rank.${rank}`)}</dt>
					<dd>{t(`calendar.gloss.rank.${rank}`)}</dd>
				</div>
			{/each}
		</dl>
	</details>

	<details>
		<summary>{t('calendar.primer.colours')}</summary>
		<dl>
			{#each colours as colour (colour)}
				<div>
					<!-- The same swatch the card draws, so the word in this list and
					     the disc beside the day are recognisably one thing. -->
					<dt>
						<span class="swatch" data-colour={colour} aria-hidden="true"></span>
						{t(`calendar.colour.${colour}`)}
					</dt>
					<dd>{t(`calendar.gloss.colour.${colour}`)}</dd>
				</div>
			{/each}
		</dl>
	</details>

	<details>
		<summary>{t('calendar.primer.cycles')}</summary>
		<p class="group-lead">{t('calendar.primer.cyclesLead')}</p>
		<dl>
			{#each CYCLES as cycle (cycle)}
				<div>
					<dt>{t(`calendar.${cycle}`)}</dt>
					<dd>{t(`calendar.gloss.${cycle}`)}</dd>
				</div>
			{/each}
		</dl>
	</details>
</section>

<style>
	/*
	 * Set as the page's own quiet voice: sans, smaller, muted, behind a rule.
	 * It is the last thing on the page and the only prose on it, so it must
	 * not compete with the day it explains — the three signals `.siglum-card`
	 * uses to keep apparatus from reading as text, at a section's scale.
	 */
	.primer {
		margin: 2.25rem 0 0;
		border-top: 1px solid var(--color-border);
		padding-top: 1rem;
		font-family: var(--font-sans);
		font-size: 0.88rem;
		color: var(--color-text-muted);
	}
	.primer h2 {
		margin: 0 0 0.4rem;
		font-family: var(--font-sans);
		font-size: 0.95rem;
		color: var(--color-text);
	}
	.lead {
		margin: 0 0 0.9rem;
		max-inline-size: 44rem;
		line-height: 1.6;
	}
	.group-lead {
		margin: 0.5rem 0 0;
		line-height: 1.6;
	}

	details {
		border-top: 1px solid var(--color-border);
		padding: 0.45rem 0;
	}
	summary {
		cursor: pointer;
		color: var(--color-text);
		font-weight: 600;
	}
	summary:hover {
		color: var(--color-accent);
	}

	/*
	 * A definition list as two columns where there is room for them and as
	 * stacked pairs where there is not — the term needs to be findable down the
	 * left, and at a phone's width a 9rem column would break every term across
	 * three lines to keep a sentence in the remainder.
	 */
	dl {
		margin: 0.6rem 0 0.2rem;
		display: grid;
		gap: 0.5rem 1rem;
	}
	dl div {
		display: grid;
		grid-template-columns: 9rem 1fr;
		gap: 0.2rem 1rem;
	}
	dt {
		color: var(--color-text);
	}
	dd {
		margin: 0;
		line-height: 1.6;
	}
	@media (max-width: 34rem) {
		dl div {
			grid-template-columns: 1fr;
		}
	}
</style>
