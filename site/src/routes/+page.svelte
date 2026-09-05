<script lang="ts">
	/**
	 * The home page: today, and the doors.
	 *
	 * ## What it was, and why that could not absorb anything more
	 *
	 * Until 2026-09-04 this page rendered the Bible's complete table of
	 * contents (`BookChapterPicker`, grid variant, nine named groups,
	 * `collapsible={false}`) and then the Catechism's complete two-level
	 * outline, and those two blocks were most of its height. Prayers got five
	 * chips underneath and the Magisterium a list of pontificates with counts;
	 * by the time the page reached the bottom there was no room left, which is
	 * why nothing ingested afterwards was ever added to it — neither the
	 * Compendium of the Social Doctrine nor the Code of Canon Law was named
	 * here at all.
	 *
	 * **That was a WEIGHT problem and not a nesting one**, which is why
	 * rearranging the nav into categories kept feeling like the fix and kept
	 * not being one. The full indices already exist, one per section, at
	 * `/scriptura`, `/catechismus`, `/documenta`, `/doctrina-socialis`,
	 * `/ius-canonicum` and `/preces`; reproducing two of them here was the
	 * whole imbalance. `/bibliotheca` now holds the map, so this page can stop
	 * being an index and be what a reader arriving with no address can act on.
	 *
	 * ## Today is the one thing here that is not a door
	 *
	 * `audiences.md` §2 is the reader the site could not answer at all — a
	 * priest arrives with a DATE, and until the calendar landed nothing on the
	 * site was addressable that way. It is also the only daily-return surface
	 * here: every other use is episodic (arrive with a citation, read, leave).
	 * So the day leads.
	 *
	 * TWO THINGS IT DELIBERATELY DOES NOT DO. It shows the GENERAL calendar,
	 * not the reader's country: the territory lives in `/calendarium`'s `?c=`
	 * and is not persisted anywhere, so this page has nothing to read and
	 * guessing from a browser locale would put a national solemnity in front of
	 * someone who never chose that country. And it does not print the day's
	 * readings — the lectionary is a work this corpus does not hold, and the
	 * cycle letters on `/calendarium` are stated as facts about the year rather
	 * than dressed up as an answer the site cannot give.
	 *
	 * ## Continue reading stays, and is no longer a hand-kept list
	 *
	 * It was one row per work type over a literal `CONTINUE_TYPES` written when
	 * four types existed, so a reader halfway through the Code got no row. The
	 * types are discovered from the reader's own positions now
	 * (`continueRows`), which is a list that cannot fall behind the corpus.
	 * Capped here and uncapped on `/bibliotheca`: this page is an entrance and
	 * that one is the record.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
	import { onMount } from 'svelte';
	import { getWork } from '$lib/corpus';
	import { liturgicalDay, toDayNumber, type LiturgicalDay } from '$lib/calendar';
	import LiturgicalDayCard from '$lib/components/LiturgicalDayCard.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	import { continueRows, listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';

	/**
	 * The four doors, in the bar's order minus the Calendar, which is the card
	 * above rather than a link.
	 *
	 * Every name and sentence is the key its own landing page is titled and
	 * described by — the rule `scripts/route-titles.mjs` follows for the
	 * `<head>` and `/bibliotheca` for its shelves. A home page that paraphrased
	 * the pages it points at would be a third set of sentences to translate
	 * into 37 languages and a third to keep true.
	 */
	const DOORS = [
		{ href: '/scriptura', titleKey: 'nav.bible', taglineKey: 'bible.landing.tagline' },
		{ href: '/preces', titleKey: 'nav.prayers', taglineKey: 'prayers.landing.tagline' },
		{ href: '/bibliotheca', titleKey: 'nav.library', taglineKey: 'library.landing.tagline' },
		// Last here because it is last on the bar, and the two orders must not
		// disagree — this block IS the bar with room to say what each door
		// holds. It pointed at `/catechismus` with the Catechism's own tagline
		// until 2026-09-04, when Learn got a page of its own (`/schola`).
		{ href: '/schola', titleKey: 'nav.learn', taglineKey: 'schola.landing.tagline' }
	] as const;

	/** Today in the READER'S zone, which is the zone they keep the feast in —
	 *  the same basis `/calendarium` computes on, and the one place in this
	 *  codebase where local time is correct. */
	function localToday(): number {
		const now = new Date();
		return toDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate());
	}

	// Both of these are read on mount rather than derived: one is the client's
	// clock and the other is its localStorage, and neither exists while the
	// shell is being served. A prerendered "today" would be the day this build
	// was made.
	let day: LiturgicalDay | undefined = $state();
	let positions: ReadingPosition[] = $state([]);

	onMount(() => {
		day = liturgicalDay(localToday());
		positions = listPositions();
	});

	/** Four at most. A reader with more of them has `/bibliotheca`, where the
	 *  list is the point rather than a way past the fold. */
	const continuing = $derived(continueRows(positions, (id) => getWork(id)?.type).slice(0, 4));
</script>

<div class="content-column">
	<!-- The wordmark IS the h1's text — see Wordmark.svelte. `home.title` stays
	     the plain-text form of the same name, used in every page's <title>. -->
	<h1 class="site-title"><Wordmark /></h1>

	{#if day}
		<section class="today" aria-labelledby="today-heading">
			<h2 id="today-heading" class="visually-hidden">{t('calendar.today')}</h2>
			<LiturgicalDayCard {day} />
			<a class="today-more" href="/calendarium">{t('calendar.title')} &rarr;</a>
		</section>
	{/if}

	{#if continuing.length > 0}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('home.continueReading')}</h2>
			<ul class="positions index-list">
				{#each continuing as position (position.workId)}
					<li><a href={position.href}>{position.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	<nav class="doors" aria-labelledby="doors-heading">
		<h2 id="doors-heading" class="visually-hidden">{t('nav.library')}</h2>
		<ul>
			{#each DOORS as door (door.href)}
				<li>
					<a class="door" href={door.href}>
						<span class="door-title">{t(door.titleKey)}</span>
						<!-- `{@html}` on the same terms as `/catechismus`'s masthead:
						     every string here is a literal in a checked-in dictionary,
						     named by a key in this file, and nothing is passed through
						     from the corpus or from a URL. -->
						<span class="door-tagline">{@html t(door.taglineKey)}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
</div>

<style>
	/*
	 * The h1 is a container for the wordmark, so it carries none of its own
	 * type: size and leading live in Wordmark.svelte, where the two lines are
	 * proportioned against each other. Only the block spacing belongs here —
	 * the mark's own line-height is under 1, so the default h1 margin would
	 * leave the tagline sitting too close under "Catholica".
	 */
	.site-title {
		margin-block: 0 0.8rem;
		font-size: inherit;
		line-height: inherit;
	}

	section {
		margin: 2.25rem 0;
	}

	section h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 0 0 1rem;
	}

	/* The day's card already carries the celebration's name as its own
	   heading, so a rule reading "Today" above it would be a second title over
	   one object. The heading exists for the document outline and nothing
	   else. */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.today {
		margin-top: 1.5rem;
	}

	.today-more {
		display: inline-block;
		margin-top: 0.6rem;
		font-size: 0.9rem;
		text-decoration: none;
	}

	/* The one link here that is a sentence rather than a target, so it promotes
	   the way a sentence's link does. The arrow stays put: it is part of the
	   label, and a link that moves under the pointer is a target that moves
	   under the pointer. */
	.today-more:hover,
	.today-more:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.positions li {
		padding: 0.35rem 0;
	}

	/* --- The doors ---------------------------------------------------------
	 *
	 * A `<nav>` because that is what it is: the same five choices the header
	 * offers, given room to say what each one holds. It is the header's row
	 * that has to be terse, not this.
	 */
	.doors ul {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 0.75rem;
		margin: 2.25rem 0 0;
		padding: 0;
	}

	.door {
		display: block;
		height: 100%;
		padding: 0.9rem 1rem;
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/* `.book-btn`'s hover, which is the same object: a name out of a grid,
	   leading into the text. */
	.door:hover,
	.door:focus-visible {
		border-color: var(--color-accent);
	}

	.door:hover .door-title,
	.door:focus-visible .door-title {
		color: var(--color-accent);
	}

	.door-title {
		display: block;
		font-family: var(--font-serif);
		font-size: 1.15rem;
	}

	.door-tagline {
		display: block;
		margin-top: 0.3rem;
		font-size: 0.82rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}
</style>
