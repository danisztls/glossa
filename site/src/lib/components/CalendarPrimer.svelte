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
	 * are missing.
	 *
	 * THE SHAPE IS `IndexSection`'S AND THE TYPE IS NOT. That component is a
	 * 1.1rem heading over a list of destinations, and these are lists of
	 * definitions in this section's quiet scale under a 0.95rem
	 * `h2` — so a fold here takes the rule drawn only while open and the room
	 * an open one adds below, and keeps the size the paragraph above argues
	 * for. `<details class="fold">` and no component: what would be shared is
	 * the element's own behaviour, which costs no script.
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

	/** The three counters, which have no union to be total over — they are
	 *  fields of `LiturgicalDay`, and the dictionary keys are their names. */
	const CYCLES = ['sundayCycle', 'weekdayCycle', 'psalterWeek'] as const;

	interface Group {
		/** Also the second half of `calendar.primer.*`, this fold's own name. */
		id: string;
		terms: readonly string[];
		/** Where the dictionary keeps this term. A term's NAME and its GLOSS sit
		 *  at one stem under two prefixes — `calendar.rank.feast` and
		 *  `calendar.gloss.rank.feast` — which is the one fact these four folds
		 *  share and the reason they can be a table rather than four copies of
		 *  the same `<details>`. The counters are the odd row: they are stored at
		 *  the top of the namespace because they are fields of a day, not members
		 *  of a union. */
		stem: (term: string) => string;
		/** The colours alone, whose term is also a thing to look at. */
		swatch?: boolean;
		/** A sentence before the list, where the terms need one to be read at
		 *  all: three counters mean nothing without knowing what cycles. */
		lead?: string;
	}

	const GROUPS: Group[] = [
		{ id: 'seasons', terms: Object.keys(SEASONS), stem: (term) => `season.${term}` },
		{ id: 'ranks', terms: Object.keys(RANKS), stem: (term) => `rank.${term}` },
		{ id: 'colours', terms: Object.keys(COLOURS), stem: (term) => `colour.${term}`, swatch: true },
		{
			id: 'cycles',
			terms: CYCLES,
			stem: (term) => term,
			lead: 'calendar.primer.cyclesLead'
		}
	];
</script>

<section class="primer">
	<h2>{t('calendar.primer.title')}</h2>
	<p class="lead">{t('calendar.primer.lead')}</p>

	{#each GROUPS as group (group.id)}
		<details class="fold">
			<summary><h3>{t(`calendar.primer.${group.id}`)}</h3></summary>
			{#if group.lead}<p class="group-lead">{t(group.lead)}</p>{/if}
			<dl>
				{#each group.terms as term (term)}
					<div>
						<!-- The swatch is the same one the card draws, so the word in this
						     list and the disc beside the day are recognisably one thing. -->
						<dt>
							{#if group.swatch}<span class="swatch" data-colour={term} aria-hidden="true"
								></span>{/if}
							{t(`calendar.${group.stem(term)}`)}
						</dt>
						<dd>{t(`calendar.gloss.${group.stem(term)}`)}</dd>
					</div>
				{/each}
			</dl>
		</details>
	{/each}
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

	/*
	 * EVERY NAME SITS THE SAME DISTANCE FROM THE ONE ABOVE IT, open or shut,
	 * so the extra room an open fold needs is BELOW it: opening one must not
	 * move the words the reader just pressed (`IndexSection`). No padding on
	 * the summary — `.fold` owns that row's height where a finger needs 44px.
	 */
	details {
		margin-block: 0.5rem;
	}

	/* WHAT AN OPEN FOLD ADDS IS UNDERNEATH, and it is for its definitions:
	   without it the last line of one vocabulary and the name of the next are
	   a row apart, and the name reads as the end of the list above it. */
	details[open] {
		margin-block-end: 1.25rem;
	}

	/* THE RULE IS DRAWN ONLY WHILE THE FOLD IS OPEN, so that it underlines
	   something. Four shut names each under a hairline were four headings over
	   empty ruled boxes — the state `IndexSection`'s docblock argues out, and
	   the Advanced panel's shelves the same from the other side. Shut, these
	   draw none and the fold mark is all the structure the list has. */
	details[open] > summary {
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
	}

	/* The section around these is muted and a term is not, so the ROW states
	   its colour and the name inherits — which is what lets `.fold`'s one
	   hover and focus rule (styles/components.css) reach the words. */
	summary {
		color: var(--color-text);
	}

	/* The vocabulary's own name, and now in the document's outline: `h3` under
	   the section's own `h2`, the level `/schola` gives a fold standing under a
	   heading of its own. Every size is restated because nothing resets a
	   heading globally (base.css declares no family for `h1`–`h6` and no
	   scale). The SCALE is the primer's own — the docblock above says why
	   these must not compete with the day they explain — and it is the one
	   thing here that is not the house default. */
	summary h3 {
		font-family: inherit;
		font-size: inherit;
		font-weight: 600;
		color: inherit;
		margin: 0;
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
