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
	import { weekdayName, weekdayOn } from '$lib/rosary-days';
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

{#snippet mysterySet(group: PrayerGroupEntry)}
	<section class="prayer-mystery-group">
		<h2 class="prayer-mystery-name" {lang}>
			{group.name}
			{#if group.rubric}<span class="prayer-mystery-rubric">{group.rubric}</span>{/if}
			<SectionSource url={group.source} />
		</h2>
		<ol class="prayer-mystery-items">
			{#each group.items as item, i (i)}
				<li><PrayerMystery {item} {lang} /></li>
			{/each}
		</ol>
	</section>
{/snippet}

{#if !rotates}
	<!-- An edition that names the sets and not their days: all four, in the
	     order it prints them. -->
	{#each groups as group (group.name)}
		{@render mysterySet(group)}
	{/each}
{:else}
	<div class="mysteries">
		<!-- THE ROW IS THE HEADING OF WHAT IS UNDER IT, so it is `aria-live`:
		     pressing a button here replaces the whole set below without moving
		     focus or the scroll position, which is a change a reader who
		     cannot see it would otherwise have to go looking for. `polite`
		     because it is never urgent — the reader asked for it. -->
		<div class="mysteries-nav">
			<button
				type="button"
				class="mysteries-step"
				aria-label={t('prayers.rosary.previousDay')}
				onclick={() => (offset -= 1)}
			>
				<Icon name="arrow-left" class="mysteries-arrow" />
			</button>
			<p class="mysteries-day" aria-live="polite">
				<span class="mysteries-weekday">{weekdayName(viewedIso, i18n.lang)}</span>
				<!-- The badge names the DAY, never the weekday: "Today" is true in
				     every interface language without a weekday vocabulary, and the
				     weekday is already printed beside it. -->
				{#if viewedIso === todayIso}<span class="prayer-today-badge"
						>{t('prayers.rosary.today')}</span
					>{/if}
			</p>
			<button
				type="button"
				class="mysteries-step"
				aria-label={t('prayers.rosary.nextDay')}
				onclick={() => (offset += 1)}
			>
				<Icon name="arrow-right" class="mysteries-arrow" />
			</button>
		</div>

		{#if shown}
			{@render mysterySet(shown)}
		{/if}
	</div>
{/if}

<style>
	/*
	 * THE CONTROL IS CHROME AND THE SET UNDER IT IS TEXT, which is the whole
	 * of why this row is sans, small and muted while the heading below it is
	 * not. A day-stepper set at the prayer's own size would be a second
	 * heading arguing with the real one.
	 */
	.mysteries-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin: 0 0 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-sans);
	}

	.mysteries-day {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		margin: 0;
		font-size: 0.95rem;
	}

	.mysteries-weekday {
		font-weight: 600;
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

	.prayer-mystery-rubric {
		display: block;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 400;
		font-style: italic;
		color: var(--color-text-muted);
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
</style>
