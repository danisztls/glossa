<script lang="ts">
	/**
	 * The prayers appointed on one day, for `/calendarium/liturgia`.
	 *
	 * TWO OF THEM, AND BOTH ARE FACTS RATHER THAN SUGGESTIONS. The Regina Caeli
	 * replaces the Angelus for the length of Easter Time, and the Rosary's four
	 * sets of mysteries rotate by weekday — each is a rubric somebody wrote
	 * down, so the page can state it. Nothing else in the corpus is appointed to
	 * a DAY, and a section that went on to list prayers merely apt for the
	 * season would be this site recommending devotions, which is not its voice.
	 *
	 * THE WEEKDAY ROTATION IS READ, NOT COMPUTED. `PrayerGroupEntry.days` comes
	 * out of the rubric the source prints, in ISO numbering, because the rubric
	 * is written in the CONTENT language and this interface has thirty-seven —
	 * `$lib/liturgy`'s `rosaryGroupFor` says the rest.
	 *
	 * ## THE SECTION IS A LIST OF LINKS AND NOT AN EXTRACT
	 *
	 * `The Rosary (The Mysteries of Light)`, and that is the whole of it: the
	 * day's set names itself inside the link, and the five mysteries, their
	 * meditations and the passage each is contemplated with are one click away
	 * on the prayer's own page. Printing the five here was this page beginning
	 * to reproduce a prayer it links to, on a page whose subject is the day —
	 * and it made the Rosary a block where the antiphon beside it is a line,
	 * so a list of two appointed prayers read as one prayer with a heading.
	 *
	 * The parenthesis is the corpus's own punctuation, not a shape invented
	 * here: every language that carries a rubric writes it that way already
	 * (`(recited Thursday)`, `(Quintas Feiras)`, `(Donnerstag)`). The rubric
	 * itself is no longer printed — what it says is which day, and the reader
	 * is looking at that day.
	 *
	 * IT SHOWS NOTHING RATHER THAN A GAP. A corpus without the Rosary, without
	 * the antiphon, or written before `days` existed leaves this section short
	 * or absent altogether, which is the posture of every other surface that
	 * reads the corpus for something optional. Russian is the live case of the
	 * middle one: it has the prayer and no groups, so the link is the title
	 * alone.
	 */
	import { weekday, type LiturgicalDay } from '$lib/calendar';
	import { content } from '$lib/content.svelte';
	import { getPrayerAsync, getPrayerMeta, prayerIndexLang } from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { t } from '$lib/i18n.svelte';
	import { marianAntiphonSlug, rosaryGroupFor } from '$lib/liturgy';
	import type { Prayer } from '$lib/types';

	interface Props {
		day: LiturgicalDay;
	}
	let { day }: Props = $props();

	/** The collection's own language, resolved the way `/preces` resolves it —
	 *  a complete edition in the reader's language rather than whichever
	 *  partial one their tag names. */
	const lang = $derived(prayerIndexLang(content.tagFor('prayer')));

	/** ISO weekday: `computus.ts` counts Sunday as 0 and the corpus's `days`
	 *  counts it as 7, which is the one line of translation between them. */
	const isoWeekday = $derived(weekday(day.dayNumber) === 0 ? 7 : weekday(day.dayNumber));

	const antiphon = $derived(getPrayerMeta(lang, marianAntiphonSlug(day)));

	/**
	 * The Rosary, fetched rather than read off the index: the mystery groups
	 * live in the content tier (`Prayer.groups`), which is the file `/preces/
	 * rosary` opens. A failure leaves the section with the antiphon alone.
	 */
	let rosary = $state<Prayer | undefined>();
	$effect(() => {
		let current = true;
		void getPrayerAsync(lang, 'rosary').then(
			(prayer) => current && (rosary = prayer),
			() => {}
		);
		return () => (current = false);
	});
	const rosaryMeta = $derived(getPrayerMeta(lang, 'rosary'));
	const mysteries = $derived(rosaryGroupFor(rosary, isoWeekday));

	/** The link's whole text. The set arrives with the content tier, after the
	 *  index the title came from, so this label grows its parenthesis a moment
	 *  into the page — a link that is right immediately and more precise
	 *  shortly after, rather than a row that appears late. */
	const rosaryLabel = $derived(
		rosaryMeta && mysteries ? `${rosaryMeta.title} (${mysteries.name})` : rosaryMeta?.title
	);
</script>

{#if antiphon || rosaryMeta}
	<section class="day-prayers" aria-labelledby="day-prayers-heading">
		<h2 id="day-prayers-heading">{t('liturgy.prayers')}</h2>
		<ul>
			{#if antiphon}
				<li>
					<a href={hrefFor({ kind: 'prayer', slug: antiphon.slug })}>{antiphon.title}</a>
				</li>
			{/if}
			{#if rosaryMeta}
				<li>
					<a href={hrefFor({ kind: 'prayer', slug: rosaryMeta.slug })}>{rosaryLabel}</a>
				</li>
			{/if}
		</ul>
	</section>
{/if}

<style>
	.day-prayers {
		margin-top: 2.5rem;
	}
	h2 {
		margin: 0 0 0.6rem;
		font-size: 1.05rem;
	}
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	ul > li + li {
		margin-top: 0.35rem;
	}
	/*
	 * THE MARK IS DRAWN AND NOT A `list-style`, which is this site's habit
	 * wherever a list is set outside its own text — `/quaestiones` carries the
	 * argument at length. What it buys here is a row that says where it begins
	 * even when its link wraps: a prayer's title and the set in brackets after
	 * it run long, and a second line starting at the same edge as the row below
	 * would read as that row's beginning.
	 */
	ul > li {
		position: relative;
		padding-inline-start: 1.1rem;
	}
	ul > li::before {
		content: '⬝';
		position: absolute;
		inset-inline-start: 0;
		color: var(--color-text-muted);
	}
	ul > li > a {
		font-weight: 600;
	}
</style>
