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

	/** The weekday on show. `rosary.ts` holds the wrap and the naming,
	 *  where they can be tested — there is no component test harness here. */
	const viewedIso = $derived(weekdayOn(todayIso, offset));

	/** Whether this edition dated its sets at all. */
	const rotates = $derived(groups.some((group) => group.days?.length));

	const shown = $derived(groups.find((group) => group.days?.includes(viewedIso)));
</script>

<!-- THE SET'S NAME AND THE DAYS IT IS PRAYED ON, and nothing else. The source
     line that used to follow the rubric here is gone: every set of every
     edition now cites one address (the micro-site's own index, not the four
     pages the scraper fetched), so printing it under each set was the same
     link four times on the four-set editions and a second copy of the opening
     prayer's on the rest. It is stated once, on the first section that draws
     from it. -->
{#snippet setHeading(group: PrayerGroupEntry)}
	<h2 class="prayer-mystery-name" {lang}>{group.name}</h2>
	{#if group.rubric}<p class="prayer-mystery-rubric" {lang}>{group.rubric}</p>{/if}
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
			THE CONTROL SITS ON THE SET'S OWN HEADING LINE, and has been through
			two wrong places to get there. It was a bordered row of its own
			above the heading, which read as the previous/next bar at the foot
			of the page and put the day above the thing the buttons change; then
			it flanked a centred heading, which fixed that and made this the one
			section of the page not laid out like the two around it. Name on the
			reading margin, control at the far end of the same line: the section
			opens the way the opening prayer and the conclusion open, and the
			buttons are still on what they move.
		-->
		<div class="mysteries-head">
			<!-- THE SET IS THE LIVE REGION. Pressing a button here replaces the
			     name, the rubric and the five mysteries under them without
			     moving focus or the scroll position, and the name is the part
			     worth hearing. `polite` because it is never urgent — the reader
			     asked for it. -->
			<div class="mysteries-title" aria-live="polite">
				{#if shown}{@render setHeading(shown)}{/if}
			</div>
			<div class="mysteries-control">
				<button
					type="button"
					class="mysteries-step"
					aria-label={t('prayers.rosary.previousDay')}
					onclick={() => (offset -= 1)}
				>
					<Icon name="arrow-left" class="mysteries-arrow" />
				</button>
				<!--
					ONE WORD FOR THE DAY, NEVER TWO. It printed the weekday and,
					on today, a badge beside it — "Tuesday TODAY" — which is the
					same fact twice in two treatments, and the badge was also a
					button back to today, so a control with one job carried two.
					A reader stepping through a week wants to know which day they
					are looking at; on the day they started, "Today" is the more
					useful of the two names and the only one they do not have to
					work out. Every other day is named.

					"Today" is true in every interface language and needs no
					weekday vocabulary; the rest come from `Intl`.
				-->
				<p class="mysteries-day" aria-live="polite">
					{#if viewedIso === todayIso}
						<span class="mysteries-today">{t('prayers.rosary.today')}</span>
					{:else}
						{weekdayName(viewedIso, i18n.lang)}
					{/if}
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
		</div>

		{#if shown}{@render setItems(shown)}{/if}
	</section>
{/if}

<style>
	/*
	 * SET NAME AT THE START, DAY CONTROL AT THE END, AND BOTH ON THE READING
	 * MARGIN. It was a centred masthead with the arrows on the column's two
	 * edges, which made this the one section of the page laid out differently
	 * from the two around it — the opening prayer and the conclusion each open
	 * with a label on the left and run their text under it, and a centred
	 * three-line block between them read as a device rather than as a heading.
	 * Everything here is left-aligned now, and the section reads like its
	 * neighbours.
	 *
	 * It wraps rather than squeezing: on a narrow column the control drops
	 * under the name, where two flex items shrinking would break the set name
	 * mid-word to keep a 2rem button on the same line.
	 */
	.mysteries-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.4rem 1rem;
		margin: 0 0 0.75rem;
	}

	.mysteries-title {
		min-width: 0;
	}

	.mysteries-control {
		display: flex;
		align-items: center;
		flex: none;
		gap: 0.5rem;
		font-family: var(--font-sans);
	}

	/*
	 * The day is the control's own label and the set name is the heading, so
	 * this is smaller and lighter than the `<h2>` beside it. It was the other
	 * way round while the control was a row of its own: the day was the
	 * largest thing in the block and "The Glorious Mysteries" read as its
	 * caption, which inverts what the reader came for.
	 *
	 * `min-inline-size` because the two names it prints are different lengths
	 * — "Today" against "Wednesday", and far wider apart in some languages —
	 * and without a floor the two buttons would move as the reader steps onto
	 * today and off it. The weekday is a proper name in most of these
	 * languages and is already capitalised by `Intl`; the ones that lowercase
	 * it do so as a rule of their own orthography, and overriding that here
	 * would misspell it in every one of them.
	 */
	.mysteries-day {
		margin: 0;
		min-inline-size: 6em;
		text-align: center;
		font-size: max(var(--font-size-min), 0.85rem);
		font-weight: 500;
		color: var(--color-text-muted);
	}

	/* `--color-apparatus` (ground lapis), not `--color-accent`: app.css
	   reserves the blue for the marks that tell a reader WHERE they are rather
	   than carrying text, and "this is today" is exactly that job. It is a
	   colour and a weight and no longer a bordered badge — the badge was
	   printed BESIDE the weekday and had to be told apart from it; this
	   REPLACES the weekday, so nothing sits next to it to be distinguished
	   from. */
	.mysteries-today {
		font-weight: 600;
		color: var(--color-apparatus);
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

	/* Inside the stepper the head's own margin closes the gap, and the control
	   is centred against this block — a trailing margin here would sit it
	   below the middle of what it moves. */
	.mysteries-title .prayer-mystery-name,
	.mysteries-title .prayer-mystery-rubric {
		margin-bottom: 0;
	}

	.prayer-mystery-rubric {
		margin: 0.1rem 0 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.75rem;
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
</style>
