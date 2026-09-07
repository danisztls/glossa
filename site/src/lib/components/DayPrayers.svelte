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
	 * `$lib/liturgy`'s `rosaryGroupFor` says the rest. What is printed beside
	 * the set is that same rubric, verbatim, and not a sentence assembled here.
	 *
	 * IT SHOWS NOTHING RATHER THAN A GAP. A corpus without the Rosary, without
	 * the antiphon, or written before `days` existed leaves this section short
	 * or absent altogether, which is the posture of every other surface that
	 * reads the corpus for something optional.
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
					<a href={hrefFor({ kind: 'prayer', slug: rosaryMeta.slug })}>{rosaryMeta.title}</a>
					{#if mysteries}
						<p class="set">
							{mysteries.name}{#if mysteries.rubric}<span class="rubric">{mysteries.rubric}</span
								>{/if}
						</p>
						<!-- The five, in the order they are contemplated. Their meditations
						     and the passage each is contemplated with are on the prayer's
						     own page; what is useful here is which five. -->
						<ol class="mysteries">
							{#each mysteries.items as item (item.title)}
								<li>{item.title}</li>
							{/each}
						</ol>
					{/if}
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
		margin-top: 1rem;
	}
	ul > li > a {
		font-weight: 600;
	}
	.set {
		margin: 0.2rem 0 0;
		font-size: 0.9rem;
	}
	.rubric {
		margin-inline-start: 0.4em;
		color: var(--color-text-muted);
		font-style: italic;
	}
	.mysteries {
		margin: 0.3rem 0 0;
		padding-inline-start: 1.4rem;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--color-text-muted);
	}
</style>
