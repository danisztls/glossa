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
	import { WEEK_FROM_SUNDAY, weekdayInitial, weekdayName } from '$lib/rosary';
	import { i18n, t } from '$lib/i18n.svelte';
	import PrayerMystery from '$lib/components/PrayerMystery.svelte';
	import MysteryRubrics from '$lib/components/MysteryRubrics.svelte';
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

	/** The weekday on show, and the only state here. It was an OFFSET from
	 *  today while the control was a pair of arrows; a strip of seven days is
	 *  chosen from rather than stepped through, so the day itself is the
	 *  state and there is no wrap left to get wrong. */
	let viewedIso = $state(todayIso);

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
{#snippet setName(group: PrayerGroupEntry, isToday: boolean)}
	<h2 class="prayer-mystery-name" {lang}>
		{group.name}
		<!-- THE CHIP IS INSIDE THE HEADING, so a screen reader hears "The
		     Glorious Mysteries, Today" as one name rather than meeting a stray
		     word after it. It says the DAY and never the weekday: "Today" is
		     true in every interface language without a weekday vocabulary, and
		     the strip above has just named the day in the reader's own. -->
		{#if isToday}<span class="prayer-today-badge">{t('prayers.rosary.today')}</span>{/if}
	</h2>
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
	<!-- The rotation, once, above the four sets it describes — the same note
	     the strip carries on the editions that have one, and the same reason
	     for it: the days each set is prayed on are a fact about all four
	     together, and four notes saying a quarter of it each is the shape this
	     replaced. -->
	<div class="mysteries-controls">
		<MysteryRubrics {groups} {lang} />
	</div>
	{#each groups as group (group.name)}
		<section class="prayer-mystery-group">
			{@render setName(group, false)}
			{@render setItems(group)}
		</section>
	{/each}
{:else}
	<section class="prayer-mystery-group">
		<!--
			THE WHOLE WEEK, ABOVE THE SET IT CHOOSES. The control has been a
			bordered row of arrows above the heading (which read as the
			previous/next bar at the foot of the page), arrows flanking a
			centred heading (which made this the one section not laid out like
			its neighbours), and arrows at the far end of the heading's own
			line. All three shared the defect: a pair of arrows is a way to
			WALK a sequence, and this is a set of seven a reader picks out of.
			Stepping four times to reach Friday is four renders of three sets
			nobody asked for, and neither arrow could ever say what it was
			about to show.

			Seven buttons say it all at once. The reader sees the shape of the
			week, presses the day they mean, and the set under it is one press
			away from any other — including the way back to today, which the
			arrows only had by counting.

			THE LETTERS ARE AMBIGUOUS AND THAT IS FINE. English repeats T and
			S, Portuguese repeats Q and S; the strip is read by POSITION, which
			is what a week is, and every button carries the day's full name as
			its accessible name and its tooltip. `weekdayInitial`'s docblock
			has the whole of it.
		-->
		<div class="mysteries-controls">
			<div class="mysteries-week" role="group" aria-label={t('prayers.rosary.chooseDay')}>
				{#each WEEK_FROM_SUNDAY as iso (iso)}
					{@const name = weekdayName(iso, i18n.lang)}
					<button
						type="button"
						class="mysteries-weekday"
						class:selected={iso === viewedIso}
						class:is-today={iso === todayIso}
						aria-pressed={iso === viewedIso}
						aria-label={iso === todayIso ? `${name} — ${t('prayers.rosary.today')}` : name}
						title={iso === todayIso ? `${name} — ${t('prayers.rosary.today')}` : name}
						onclick={() => (viewedIso = iso)}
					>
						{weekdayInitial(iso, i18n.lang)}
					</button>
				{/each}
			</div>
			<!-- Outside the `role="group"` on purpose: the group is the seven days
			     a reader chooses between, and this is a note about all of them. -->
			<MysteryRubrics {groups} current={shown} {lang} />
		</div>

		<!-- THE SET IS THE LIVE REGION. Pressing a day replaces the name and the
		     five mysteries under it without moving focus or the scroll position,
		     and the name is the part worth hearing. `polite` because it is never
		     urgent — the reader asked for it. -->
		<div aria-live="polite">
			{#if shown}{@render setName(shown, viewedIso === todayIso)}{/if}
			{#if shown}{@render setItems(shown)}{/if}
		</div>
	</section>
{/if}

<style>
	/*
	 * THE WEEK AS A ROW OF SEVEN, ON THE READING MARGIN. Not centred and not
	 * stretched across the column: a week is a short fixed thing, and a strip
	 * spread to the full measure reads as a table with six empty cells in it.
	 * It sits above the set's name for the reason the markup gives — the reader
	 * chooses a day and then reads what is appointed to it, in that order.
	 */
	/* The strip and the rubric's `i` on one line, the note immediately to the
	   right of the seven days rather than at the column's far edge: it is about
	   the day just chosen, and a mark pushed away from what it qualifies stops
	   reading as belonging to it. */
	.mysteries-controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin: 0 0 0.75rem;
	}

	.mysteries-week {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	/*
	 * A SQUARE PER DAY, 2rem, which is the arrows' own size and clears the
	 * 24px minimum on a coarse pointer without a media query. `tabular-nums`
	 * for the locales whose narrow weekday is a DIGIT — Chinese answers 日一二
	 * … and Japanese a numeral — so the seven cells stay the same width
	 * whatever the platform hands back.
	 */
	.mysteries-weekday {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		flex: none;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: none;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.8rem);
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.mysteries-weekday:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/*
	 * THE CHOSEN DAY IS FILLED AND TODAY IS DOTTED, and they have to be two
	 * different marks because they are true at the same time on the day the
	 * page opens. One treatment for both would make "you are looking at
	 * Wednesday" and "today is Wednesday" indistinguishable on the one day the
	 * reader most needs to tell them apart — and then, after a single press,
	 * the mark would move and no longer say where today is at all.
	 *
	 * `--color-apparatus` (ground lapis) rather than `--color-accent`: app.css
	 * reserves the blue for the marks that tell a reader WHERE they are rather
	 * than carrying text, which is exactly what both of these do. The reds are
	 * spoken for by links.
	 */
	.mysteries-weekday.selected {
		color: var(--color-bg);
		background: var(--color-apparatus);
		border-color: var(--color-apparatus);
		font-weight: 600;
	}

	.mysteries-weekday.is-today::after {
		content: '';
		position: absolute;
		bottom: 0.22rem;
		width: 0.22rem;
		height: 0.22rem;
		border-radius: 50%;
		background: var(--color-apparatus);
	}

	/* The dot has to survive the fill it sits on. */
	.mysteries-weekday.is-today.selected::after {
		background: var(--color-bg);
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

	/*
	 * `--color-apparatus` (ground lapis), not `--color-accent`: app.css reserves
	 * the blue for the marks that tell a reader WHERE they are rather than
	 * carrying text, and "these are today's" is exactly that job. The reds are
	 * already spoken for by links and initials, and a red chip beside a red link
	 * would read as a second kind of link.
	 *
	 * It is a BORDERED chip here and a bare dot on the day strip above, because
	 * the two say different things and are true at the same moment: the dot
	 * marks where today falls in the week, this says the set under it is the one
	 * appointed to it. One treatment for both would collapse them on the only
	 * day they can be told apart.
	 */
	.prayer-today-badge {
		display: inline-block;
		margin-inline-start: 0.5em;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.62em);
		font-weight: 600;
		font-style: normal;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-apparatus);
		border: 1px solid var(--color-apparatus);
		border-radius: var(--radius-sm);
		padding: 0.05em 0.4em;
		vertical-align: 0.12em;
		/* `nowrap` because in several interface languages this is two words
		   ("I dag", "Aujourd'hui") and a chip that wraps stops reading as one. */
		white-space: nowrap;
	}

	.prayer-mystery-items {
		margin: 0;
		padding-inline-start: 1.5rem;
	}

	.prayer-mystery-items li {
		margin: 0 0 0.9rem;
	}
</style>
