<!--
	The Rosary's mysteries, one set at a time.

	THE ROSARY IS PRAYED ONE SET OF FIVE DECADES, ON THE DAY THE SOURCE
	APPOINTS IT. This page used to print all four sets in full, with a table
	of contents beside them and a banner over them naming today's — so a
	reader who came to pray met four rubrics, a sidebar and three screens of
	text they were not going to say, and had to find the one set they wanted
	inside it. This shows that set and nothing else.

	IT CYCLES BY DAY AND NOT BY SET, because the day is what the reader has
	and the rotation is the source's. Two days name the joyful mysteries and
	two the sorrowful, so stepping through the sets would arrive at one of
	them twice with nothing to say which arrival was which; stepping through
	the week says Thursday, and the set follows from it. Every step lands on
	a different set — the rotation gives adjacent days different mysteries
	all seven times — so the control never looks like it did nothing.

	THE WEEKDAY IS NAMED BY `Intl` AND NOT BY A DICTIONARY. `PrayerGroupEntry`
	carries ISO weekday numbers exactly so the site never parses a rubric
	written in the content language; naming the number back is the reader's
	own locale's job, and a weekday vocabulary in forty dictionaries would be
	forty translations of what the platform already knows. `dateLocale` is the
	shim, for the reason its own docblock gives.

	THE DATE IT NAMES IS A REFERENCE WEEK, NEVER TODAY PLUS THE OFFSET. Both
	answer the same for one step; they part on the seventh, where an offset
	added to a real date is a week away and the weekday it is asked for is
	the one the reader started on. Only the weekday is printed, so only the
	weekday is computed — the wrap is the whole state.

	WHERE THE CORPUS HAS NO WEEKDAYS IT PRINTS ALL FOUR. Romanian, Slovenian
	and Swedish carry the four sets from the Compendium's appendix, which
	names the mysteries and not the days they are prayed on; the six editions
	with the Holy Rosary micro-site pages behind them carry both. A set nobody
	can date is still a set to read, so those editions get the plain list this
	control replaced rather than an empty column.
-->
<script lang="ts">
	import { weekdayName, weekdayOn } from '$lib/rosary';
	import { i18n, t } from '$lib/i18n.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import PrayerMystery from '$lib/components/PrayerMystery.svelte';
	import SectionSource from '$lib/components/SectionSource.svelte';
	import type { PrayerGroupEntry } from '$lib/types';

	interface Props {
		groups: PrayerGroupEntry[];
		/** The edition's language. The set names and their rubrics are the
		 *  source's own words, and are marked as its language rather than the
		 *  reader's — the weekday beside them is the only thing here in the
		 *  interface language. */
		lang: string;
	}

	let { groups, lang }: Props = $props();

	/**
	 * TODAY, AS AN ISO WEEKDAY (1 = Monday … 7 = Sunday).
	 *
	 * `getDay()` is 0-for-Sunday; the corpus stores ISO numbers because that
	 * is what the rubric means by "Monday and Saturday" and because a
	 * 0-indexed week has no name anyone prays by. Read from the BROWSER's
	 * local date deliberately: which mysteries are today's is a fact about
	 * where the reader is standing, not about where the site is served from.
	 *
	 * Read once rather than derived: nobody is holding this page open across
	 * midnight waiting for the set to change, and a reactive clock would make
	 * every re-render depend on the time.
	 */
	const todayIso = new Date().getDay() || 7;

	/** Days from today, and the only state here. */
	let offset = $state(0);

	/** The weekday on show. `rosary-days.ts` holds the wrap and the naming,
	 *  where they can be tested — there is no component test harness here. */
	const viewedIso = $derived(weekdayOn(todayIso, offset));

	/** Whether this edition dated its sets at all. */
	const rotates = $derived(groups.some((group) => group.days?.length));

	const shown = $derived(groups.find((group) => group.days?.includes(viewedIso)));
</script>

{#snippet setHeading(group: PrayerGroupEntry)}
	<h2 class="prayer-mystery-name" {lang}>{group.name}</h2>
	<!-- THE RUBRIC AND THE SOURCE SHARE A LINE, where they were two under the
	     name. Both are the same size, the same weight and the same grey; the
	     rubric is five words and the source two, and stacked they made a
	     four-line masthead over a list the reader came for. Neither belongs to
	     the other, which is what the separator is for. -->
	<p class="prayer-mystery-meta">
		{#if group.rubric}<span class="prayer-mystery-rubric" {lang}>{group.rubric}</span>{/if}
		{#if group.rubric && group.source}<span class="sep" aria-hidden="true">·</span>{/if}
		<SectionSource url={group.source} />
	</p>
{/snippet}

{#snippet setItems(group: PrayerGroupEntry)}
	<ol class="prayer-mystery-items">
		{#each group.items as item, i (i)}
			<li><PrayerMystery {item} {lang} /></li>
		{/each}
	</ol>
{/snippet}

{#if !rotates}
	<!-- An edition that names the sets and not their days: all four, in the
	     order it prints them. -->
	{#each groups as group (group.name)}
		<section class="prayer-mystery-group">
			{@render setHeading(group)}
			{@render setItems(group)}
		</section>
	{/each}
{:else}
	<section class="prayer-mystery-group">
		<!--
			THE ARROWS FLANK THE SET'S OWN HEADING, and did not until 2026-09-08.
			They were a bordered row of their own above it, with the weekday
			centred and set larger than the `<h2>` underneath — so the page
			opened with a widget that looked like the previous/next bar at its
			foot, and the thing the buttons actually change was a smaller line
			below it. A control belongs on the thing it moves: the heading is
			inside the row now, the weekday is the small label over it, and the
			rule that used to close the row is gone because a rule there cut a
			heading off from its own list.
		-->
		<div class="mysteries-head">
			<button
				type="button"
				class="mysteries-step"
				aria-label={t('prayers.rosary.previousDay')}
				onclick={() => (offset -= 1)}
			>
				<Icon name="arrow-left" class="mysteries-arrow" />
			</button>
			<!-- THE WHOLE HEADING IS THE LIVE REGION, not just the weekday:
			     pressing a button here replaces the set name, its rubric, its
			     source and the five mysteries under it without moving focus or
			     the scroll position, and the set name is the part worth hearing.
			     `polite` because it is never urgent — the reader asked for it. -->
			<div class="mysteries-title" aria-live="polite">
				<p class="mysteries-day">
					<span class="mysteries-weekday">{weekdayName(viewedIso, i18n.lang)}</span>
					<!--
						THE BADGE IS ALSO THE WAY BACK. It used to appear only on
						today and vanish the moment the reader stepped off it,
						which left seven presses as the only route home from a
						week away and moved the heading up a line on the way out.
						The slot is now always filled: a mark where the reader
						started, a button everywhere else, and the label reads
						the same either way.

						It names the DAY, never the weekday — "Today" is true in
						every interface language without a weekday vocabulary,
						and the weekday is already printed beside it.
					-->
					{#if viewedIso === todayIso}
						<span class="prayer-today-badge">{t('prayers.rosary.today')}</span>
					{:else}
						<button
							type="button"
							class="prayer-today-badge prayer-today-reset"
							title={t('prayers.rosary.todayHeading')}
							aria-label={t('prayers.rosary.todayHeading')}
							onclick={() => (offset = 0)}>{t('prayers.rosary.today')}</button
						>
					{/if}
				</p>
				{#if shown}{@render setHeading(shown)}{/if}
			</div>
			<button
				type="button"
				class="mysteries-step"
				aria-label={t('prayers.rosary.nextDay')}
				onclick={() => (offset += 1)}
			>
				<Icon name="arrow-right" class="mysteries-arrow" />
			</button>
		</div>

		{#if shown}{@render setItems(shown)}{/if}
	</section>
{/if}

<style>
	/* The two buttons are pinned to the column's edges and the heading takes
	   what is left, so the set name stays centred however long it runs and the
	   arrows never move as the week is stepped through. */
	.mysteries-head {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0 0 0.75rem;
	}

	.mysteries-title {
		flex: 1;
		min-width: 0;
		text-align: center;
	}

	.mysteries-day {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		margin: 0 0 0.15rem;
		font-family: var(--font-sans);
	}

	/*
	 * THE WEEKDAY IS THE LABEL AND THE SET NAME IS THE HEADING, which is why
	 * this is smaller and lighter than the `<h2>` beneath it. It was the other
	 * way round while the control was a row of its own: the day was the
	 * largest thing in the block and "The Glorious Mysteries" read as its
	 * caption, which inverts what the reader came for.
	 */
	.mysteries-weekday {
		font-size: max(var(--font-size-min), 0.85rem);
		font-weight: 500;
		color: var(--color-text-muted);
		/* The weekday is a proper name in most of these languages and is
		   already capitalised by `Intl`; the ones that lowercase it do so as
		   a rule of their own orthography, and overriding that here would
		   misspell it in every one of them. */
	}

	.mysteries-step {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.mysteries-step:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* The row is a flex row and so already mirrors under `dir="rtl"`, which
	   puts the back button where an RTL reader looks for it; an `<svg>` is a
	   box and not a mirrored character, so its arrow needs turning by hand.
	   `UnitNav` states the same rule at length and draws the same two marks. */
	.mysteries-step :global(.mysteries-arrow) {
		width: 1em;
		height: 1em;
	}

	.mysteries-step:dir(rtl) :global(.mysteries-arrow) {
		transform: scaleX(-1);
	}

	.prayer-mystery-group {
		margin: 0 0 1.5rem;
	}

	/* Deliberately NOT relative to `--reading-base`: this is a label over a
	   list ("The Joyful Mysteries"), sized as chrome and already smaller than
	   the body it heads; scaling it with the enlarged prayer type would make
	   it compete with the text. */
	.prayer-mystery-name {
		font-size: 1.05rem;
		margin: 0 0 0.5rem;
	}

	/* Inside the stepper the head's own margin closes the gap, and the arrows
	   are centred against this block — a trailing margin here would sit them
	   above the middle of what they point at. */
	.mysteries-title .prayer-mystery-name,
	.mysteries-title .prayer-mystery-meta {
		margin-bottom: 0;
	}

	/* One row of provenance under the set's name. `SectionSource` is a block
	   for its other caller, which stands alone in the directions' fold; here
	   it is the second half of a line, so this is the one place that overrides
	   it. */
	.prayer-mystery-meta {
		margin: 0.1rem 0 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.prayer-mystery-meta :global(.prayer-section-source) {
		display: inline;
		font-size: inherit;
		margin-block-start: 0;
	}

	.prayer-mystery-meta .sep {
		opacity: 0.6;
		margin-inline: 0.35em;
	}

	.prayer-mystery-rubric {
		font-style: italic;
	}

	.prayer-mystery-items {
		margin: 0;
		padding-inline-start: 1.5rem;
	}

	.prayer-mystery-items li {
		margin: 0 0 0.9rem;
	}

	/*
	 * `--color-apparatus` (ground lapis), not `--color-accent`: app.css
	 * reserves the blue for the reference apparatus — the marks that tell a
	 * reader WHERE they are rather than carrying text — and "this is today"
	 * is exactly that job. The reds are already spoken for by links and
	 * initials, and a red badge beside a red link would read as a second kind
	 * of link.
	 */
	.prayer-today-badge {
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.65em);
		font-weight: 600;
		font-style: normal;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-apparatus);
		border: 1px solid var(--color-apparatus);
		border-radius: var(--radius-sm);
		padding: 0.05em 0.4em;
		/* `white-space: nowrap` because in several interface languages this is
		   two words ("I dag", "A mai titkok" shortens to "Ma" but "Aujourd’hui"
		   does not) and a badge that wraps stops reading as a badge. */
		white-space: nowrap;
	}

	/*
	 * THE SAME SHAPE, MUTED, BECAUSE IT IS AN OFFER AND NOT A STATEMENT. The
	 * badge above says "you are here"; this says "you may go back", and two
	 * marks that look identical in a slot where only one of them is clickable
	 * is the worse of the two mistakes. Everything else about it is the
	 * badge's, so the heading beneath does not shift by a pixel as the reader
	 * steps off today and back onto it.
	 */
	.prayer-today-reset {
		color: var(--color-text-muted);
		border-color: var(--color-border);
		background: none;
		line-height: inherit;
		cursor: pointer;
	}

	.prayer-today-reset:hover {
		color: var(--color-apparatus);
		border-color: var(--color-apparatus);
	}
</style>
