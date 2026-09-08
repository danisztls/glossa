<script lang="ts">
	/**
	 * The library counted: a ledger of what this build holds, and five
	 * rankings over the cross-reference index.
	 *
	 * ## Why the numbers are not on `/bibliotheca`
	 *
	 * The catalogue answers "what is here" in the sense a reader arrives with
	 * — which shelves are there and which one do I want — and it answers it in
	 * seven cards. A ledger answers the same words in the other sense, and a
	 * reader who came for the Bible does not want thirty-three counts between
	 * them and the door. So this is a page under the catalogue rather than a
	 * section of it, and the catalogue carries one line down to it.
	 *
	 * ## Nothing on it is typed
	 *
	 * Every number is `scripts/census.mjs`'s, derived at build from the same
	 * objects the sync writes the sitemap, `apparatus.json` and `llms.txt`
	 * from — so this page and the file a crawler reads cannot disagree about
	 * how many documents there are. That is the whole reason the census is a
	 * module and not this page's own arithmetic, and `site/docs/census.md`
	 * carries the argument.
	 *
	 * It is also why there is no fallback content. A build with no census
	 * (the vitest fixtures, a partial sync) says so in one sentence rather
	 * than drawing a table of zeroes, because a zero here is a claim about
	 * the Church's texts and not about this build.
	 *
	 * ## The rankings are the reader's own edition
	 *
	 * A ranked row is an id in the file and a name on the page, out of
	 * whichever Bible, document or Catechism this reader would open — which is
	 * `citation-style.ts`'s rule, and it applies because the row is a LINK:
	 * labelling it in another edition's spelling would name a page the reader
	 * is not being taken to. `$lib/census.ts` does that mapping and is where
	 * it is tested.
	 *
	 * THAT MAPPING READS THE BIBLE AND DOCUMENT REGISTRIES, and this page gets
	 * them from `indexesForPath`'s `ALL` fallback — `bibliotheca` is in no
	 * entry of `BY_SEGMENT`. Do not add one on the strength of what
	 * `/bibliotheca` renders: the catalogue reads `manifests` alone, so a
	 * narrow entry looks right and would silently empty three of the five
	 * rankings here. `index-priming.test.ts` cannot catch it either, because it
	 * scans what a PAGE imports from `$lib/corpus` and every reader this page
	 * uses is one module further in.
	 *
	 * ## Not in `CHROME_PATHS`
	 *
	 * The page's own strings are English (`census.*` in `en.ts`), so it takes
	 * no `/{lang}/` prefix and declares no `hreflang` cluster —
	 * `/calendarium/liturgia`'s arrangement, argued in `route-manifest.ts`. It
	 * is in `STATIC_PATHS` and `STATIC_HEADS`, which is what makes it answer
	 * 200 to a cold load and a shared link.
	 */
	import { t, i18n } from '$lib/i18n.svelte';
	import { loadCensus } from '$lib/corpus';
	import {
		citerBreakdown,
		ledgerGroups,
		rankedBooks,
		rankedCcc,
		rankedChapters,
		rankedDocuments,
		rankedSumma,
		type CensusRankRow
	} from '$lib/census';
	import { formatNumber } from '$lib/ui-langs';
	import type { Census } from '$lib/types';

	/**
	 * `$state` + `$effect` rather than an `await` in the template, and rather
	 * than a `load()`: the file is one request for the whole page and the
	 * chrome around it should paint without waiting on it — `/documenta`'s
	 * tags are fetched exactly this way and for the same reason.
	 *
	 * THREE STATES AND NOT TWO, because `undefined` means three different
	 * things and only one of them is worth a sentence. In flight, the page
	 * says nothing; absent, it says this build was not counted; THREW, it says
	 * what `LoadFailed` says — the page exists and the request dropped — and
	 * offers the retry, because telling a reader one retry from the numbers
	 * that there are none is `NotFound`'s wrong answer one component over.
	 * `invalidateAll()` is not the remedy here (nothing was loaded by a
	 * `load()`), so the retry re-runs the fetch itself.
	 */
	let census = $state<Census | undefined>(undefined);
	let phase = $state<'loading' | 'ready' | 'failed'>('loading');
	let attempt = $state(0);
	$effect(() => {
		attempt;
		let stale = false;
		phase = 'loading';
		loadCensus().then(
			(value) => {
				if (stale) return;
				census = value;
				phase = 'ready';
			},
			() => {
				if (!stale) phase = 'failed';
			}
		);
		return () => {
			stale = true;
		};
	});

	/**
	 * The five rankings in the order the library is read, each with the
	 * heading that says what unit it ranks.
	 *
	 * DERIVED PER RENDER rather than memoised, and it must be: every label in
	 * it comes out of the reader's own edition, so a language change or an
	 * edition change has to re-run this. It is five short array maps over at
	 * most twenty rows each.
	 */
	const rankings = $derived(
		census
			? (
					[
						['books', rankedBooks(census)],
						['chapters', rankedChapters(census)],
						['documents', rankedDocuments(census)],
						['ccc', rankedCcc(census)],
						['summa', rankedSumma(census)]
					] as [string, CensusRankRow[]][]
				).filter(([, rows]) => rows.length > 0)
			: []
	);

	const groups = $derived(census ? ledgerGroups(census) : []);
	const citers = $derived(census ? citerBreakdown(census) : []);

	/** Every count on the page, in the reader's own number formatting. */
	const n = (value: number) => formatNumber(value, i18n.lang);
</script>

<svelte:head>
	<title>{t('census.title')} — {t('home.title')}</title>
</svelte:head>

<div class="landing-column">
	<h1>{t('census.title')}</h1>
	<p class="page-tagline landing-measure">{t('census.tagline')}</p>

	{#if phase === 'failed'}
		<!-- `loadFailed.*` rather than strings of this page's own: it is the
		     same failure `+error.svelte` renders for a dropped request, it is
		     already written in every dictionary, and a second wording for one
		     event is a second thing to keep true. -->
		<p class="notice landing-measure">{t('loadFailed.hint')}</p>
		<p>
			<button type="button" class="retry" onclick={() => attempt++}>{t('loadFailed.retry')}</button>
		</p>
	{:else if !census}
		<!-- Nothing at all until the fetch has answered. A heading over an
		     empty section, or a notice that turns out to be wrong a moment
		     later, are both worse than a blank column for one request. -->
		{#if phase === 'ready'}
			<p class="notice landing-measure">{t('census.unavailable')}</p>
		{/if}
	{:else}
		<section aria-labelledby="holdings-heading">
			<h2 id="holdings-heading">{t('census.holdings')}</h2>
			<!--
				A DESCRIPTION LIST PER GROUP, not one table with a group column.
				Each group is a term-and-value list about a different subject,
				and `<dl>` is the element that says so — a `<table>` would claim
				the rows share a dimension they do not (five editions of the
				Catechism and 2,865 paragraphs are not two values of one
				variable). It also degrades to a readable column on a phone
				with no horizontal scroll, which a two-column table does not.
			-->
			<div class="ledger">
				{#each groups as group (group.key)}
					<section class="group" aria-labelledby="group-{group.key}">
						<h3 id="group-{group.key}">{t(group.labelKey)}</h3>
						<dl>
							{#each group.rows as row (row.key)}
								<div class="row">
									<dt>{t(row.labelKey)}</dt>
									<dd>{n(row.value)}</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/each}
			</div>
		</section>

		<section aria-labelledby="cited-heading">
			<h2 id="cited-heading">{t('census.cited')}</h2>
			<!-- THE METHOD BEFORE THE TABLES. Both of its clauses change what
			     the numbers mean, and a reader who meets them afterwards has
			     already read the tables wrongly. -->
			<p class="method landing-measure">{t('census.method')}</p>

			<div class="rankings">
				{#each rankings as [key, rows] (key)}
					<section class="ranking" aria-labelledby="rank-{key}">
						<h3 id="rank-{key}">{t(`census.rank.${key}`)}</h3>
						<!-- An ordered list, because the order IS the content: a
						     screen reader announcing "3 of 20" is reading the rank,
						     which is the one thing a bare list would drop. The
						     number after each row is the count, named once by the
						     column's own `title` on the value. -->
						<ol>
							{#each rows as row (row.key)}
								<li>
									<a href={row.href} title={row.fullTitle ?? undefined}>{row.label}</a>
									<span class="count" title={t('census.timesCited')}>{n(row.value)}</span>
								</li>
							{/each}
						</ol>
					</section>
				{/each}
			</div>
		</section>

		{#if citers.length}
			<section aria-labelledby="citers-heading">
				<h2 id="citers-heading">{t('census.citers')}</h2>
				<!-- THE OTHER DIRECTION, AND WHY THE COMMENTARY ROW IS HERE AT
				     ALL. The rankings above leave an edition's own footnotes
				     out; this table is where the reader can see how much that
				     is, and it is the largest row in it. Left unsaid, the
				     apparatus totals in the ledger would not add up to
				     anything a reader could check. -->
				<dl class="citers">
					{#each citers as citer (citer.key)}
						<div class="row">
							<dt>{t(citer.labelKey)}</dt>
							<dd>{n(citer.value)}</dd>
						</div>
					{/each}
				</dl>
			</section>
		{/if}

		<p class="derived landing-measure">{t('census.derived')}</p>
	{/if}
</div>

<style>
	section {
		margin: 2.25rem 0;
	}

	h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		font-weight: 600;
		margin: 0 0 0.75rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px solid var(--color-border);
	}

	h3 {
		font-family: var(--font-serif);
		font-size: 1.02rem;
		font-weight: 600;
		margin: 0 0 0.5rem;
		color: var(--color-text-muted);
	}

	/*
	 * TWO COLUMNS WHERE THERE IS ROOM AND ONE WHERE THERE IS NOT, by
	 * `auto-fit` rather than a breakpoint: the groups are between two and six
	 * rows each, so a fixed two-column grid leaves a ragged hole under the
	 * short ones and a fixed one-column list wastes half a desktop column.
	 * `minmax(17rem, 1fr)` is the width at which the longest label
	 * ("Of those, an edition's own notes") stops wrapping.
	 */
	.ledger,
	.rankings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1.5rem 2.5rem;
	}

	.group,
	.ranking {
		margin: 0;
		/* `break-inside` for the print stylesheet: a group split across a page
		   break is a heading on one page and its numbers on the next. */
		break-inside: avoid;
	}

	dl {
		margin: 0;
	}

	/*
	 * THE LEADER IS A BORDER AND NOT A ROW OF DOTS. A dotted leader is what a
	 * printed index uses and it reads well at a printed index's density; here
	 * the rows are short and the values narrow, and a hairline under each is
	 * enough to carry the eye across without drawing a texture over the whole
	 * column. `align-items: baseline` so the label and the number sit on one
	 * line however the label wraps.
	 */
	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.row:last-child {
		border-bottom: none;
	}

	dt {
		color: var(--color-text-muted);
	}

	dd {
		margin: 0;
		/* Tabular figures so a column of numbers lines up on its digits, which
		   is the whole reason a ledger is set in a column. */
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	ol {
		margin: 0;
		padding: 0;
		list-style: none;
		/* The rank is announced by the list and drawn by the counter, so the
		   marker is off and this draws its own — a native marker sits outside
		   the box and would put the numbers in the gutter between columns. */
		counter-reset: rank;
	}

	ol li {
		counter-increment: rank;
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	ol li:last-child {
		border-bottom: none;
	}

	ol li::before {
		content: counter(rank);
		flex: none;
		min-width: 1.4em;
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.85em;
		color: var(--color-text-muted);
	}

	ol li a {
		flex: 1 1 auto;
		/* A long document title truncates rather than wrapping to three lines
		   and breaking the rhythm of a ranked column; the full name is on the
		   row's `title` where the manifest has one. */
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		flex: none;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
	}

	.method,
	.derived,
	.notice {
		color: var(--color-text-muted);
	}

	.method {
		margin: 0 0 1.25rem;
	}

	.derived {
		margin-top: 2.5rem;
		font-size: 0.9rem;
	}

	.citers {
		/* One list and not a grid: eight rows, and a reader compares them
		   against each other rather than reading them as separate subjects. */
		max-width: 28rem;
	}

	/* `LoadFailed`'s chip and `NotDownloaded`'s before it — the third place
	   that offers the way on after a dropped request, and the same gesture
	   should not be a third shape. Copied rather than shared because those two
	   are whole-page components and this is a paragraph on a page that
	   otherwise loaded. */
	.retry {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-family: var(--font-sans);
		font-size: 0.9rem;
		line-height: 1.5;
		cursor: pointer;
	}

	.retry:hover,
	.retry:focus-visible {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
