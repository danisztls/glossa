<script lang="ts">
	/**
	 * The library counted: what it holds in a sentence per shelf, how far each
	 * work reaches across the interface languages, and what the rest of the
	 * corpus cites most.
	 *
	 * ## Every number is a fraction, or it is one of four
	 *
	 * The page opened with a 37-row ledger and read as noise — correctly, and
	 * not because 37 is many. Every row answered "how many" and none answered
	 * "out of what": `Canons 1,752` is unanchored, and a reader cannot tell
	 * whether it is good. `the Code in 7 of 40 languages` is the same shape of
	 * fact and is immediately a judgement. So the inventory went, the four
	 * scale figures that survive are one sentence, and what replaced the table
	 * is `coverage` — one number per work per language, which is the question
	 * about this library a reader actually arrives with.
	 *
	 * ## One matrix, not eight graphs
	 *
	 * The rows were nearly drawn per shelf, beside each shelf's sentence. What
	 * that loses is the only thing worth drawing them for: the comparison DOWN
	 * a column. In one grid, sharing one language order and one scale, the
	 * eight rows fall into a staircase and the page argues without a word —
	 * six languages carry most of the library and seven carry nothing at all.
	 * Split into eight figures they are eight unrelated bar charts.
	 *
	 * The order is derived at build (`scripts/census.mjs`) and not chosen
	 * here: any hand-made order is an editorial claim about which languages
	 * matter, which is precisely what a page of measurements must not make.
	 *
	 * ## Why the sentences are sentences
	 *
	 * A shelf's numbers are interpolated into one line of prose rather than
	 * set as rows, and the apparatus is the argument. As six figures under a
	 * total, four of them summed to a fifth of it and read as broken — they
	 * were not, a cross-reference being an edge and those being its endpoints,
	 * but nothing on the list said so. A column of figures can only invite
	 * arithmetic; a sentence can state a relation.
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
	 * rankings here. `index-priming.test.ts` cannot catch it either, because
	 * it scans what a PAGE imports from `$lib/corpus` and every reader this
	 * page uses is one module further in.
	 *
	 * ## Not in `CHROME_PATHS`
	 *
	 * The page's own strings are English (`census.*` in `en.ts`), so it takes
	 * no `/{lang}/` prefix and declares no `hreflang` cluster —
	 * `/calendarium/liturgia`'s arrangement, argued in `route-manifest.ts` and
	 * sized in `PLAN.md`. It is in `STATIC_PATHS` and `STATIC_HEADS`, which is
	 * what makes it answer 200 to a cold load and a shared link.
	 *
	 * `site/docs/census.md` is the rationale for all of it.
	 */
	import { t, i18n } from '$lib/i18n.svelte';
	import { loadCensus } from '$lib/corpus';
	import {
		censusProse,
		censusShelves,
		citerBreakdown,
		coverageRows,
		rankedBooks,
		rankedCcc,
		rankedChapters,
		rankedDocuments,
		rankedSumma,
		type CensusRankRow
	} from '$lib/census';
	import { SvelteSet } from 'svelte/reactivity';
	import Icon from '$lib/components/Icon.svelte';
	import { formatNumber } from '$lib/ui-langs';
	import { languageDisplayName } from '$lib/lang-names';
	import type { Census } from '$lib/types';

	/**
	 * THREE STATES AND NOT TWO, because `undefined` means three different
	 * things and only one is worth a sentence. In flight, the page says
	 * nothing; absent, it says this build was not counted; THREW, it says what
	 * `LoadFailed` says — the page exists and the request dropped — and offers
	 * the retry, because telling a reader one retry from the numbers that
	 * there are none is `NotFound`'s wrong answer one component over.
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

	/** Every count on the page, in the reader's own number formatting. */
	const n = (value: number) => formatNumber(value, i18n.lang);

	const shelves = $derived(census ? censusShelves(census) : []);
	const coverage = $derived(census ? coverageRows(census) : []);
	const citers = $derived(census ? citerBreakdown(census) : []);

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

	/**
	 * WHICH RANKING TABLES ARE SWITCHED OFF, rather than which are on — the
	 * store `CitedBy` keeps, for its reason: a ranking added later shows up
	 * without anyone having opted into it, and there is no default here that is
	 * not "on" for an omission to have to imply.
	 *
	 * IT FILTERS WHICH TABLES ARE DRAWN AND NOT WHO DID THE CITING, which is
	 * the one way this differs from that panel and it is not a shortcut. A
	 * ranking is cut at build time on the total count, taking whole tie-bands
	 * while the next still fits (`topOf`); re-ranking a stored top twenty by
	 * one citing family would publish the top of THAT family's list only where
	 * the two happen to agree, and silently publish a wrong one everywhere
	 * else. The cut would have to be recomputed per subset, which is a
	 * different file and not a control. What this narrows is what a reader can
	 * already see — five tables, of which they may want two.
	 */
	let hidden = $state(new SvelteSet<string>());

	const shownRankings = $derived(rankings.filter(([key]) => !hidden.has(key)));

	function toggle(key: string) {
		if (hidden.has(key)) hidden.delete(key);
		else hidden.add(key);
	}

	/** A cell's accessible value — `1,334 of 1,334`, or the plain statement
	 *  that there is none, which reads better than `0 of 1,334`. */
	const cellLabel = (value: number, of: number) =>
		value === 0
			? t('census.reachNone')
			: t('census.reachCell').replace('{value}', n(value)).replace('{of}', n(of));
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
			<!-- A description list, because that is what this is: a term and a
			     statement about it, nine times. Not a table — the sentences
			     share no dimension — and not headings, which would put nine
			     entries in the document outline for one paragraph each. -->
			<dl class="shelves">
				{#each shelves as shelf (shelf.key)}
					<div class="shelf">
						<dt>
							<!-- The glyph is the one the catalogue's card for this shelf
							     draws and `/schola` lists it under, taken from
							     `CENSUS_ICONS` rather than chosen again. Decorative:
							     the name is beside it in words. -->
							{#if shelf.icon}<span class="shelf-icon"><Icon name={shelf.icon} /></span>{/if}
							{t(shelf.labelKey)}
						</dt>
						<dd>{censusProse(t(shelf.proseKey), shelf.facts, n)}</dd>
					</div>
				{/each}
			</dl>
		</section>

		{#if coverage.length}
			<section aria-labelledby="reach-heading">
				<h2 id="reach-heading">{t('census.reach')}</h2>
				<p class="lede landing-measure">{t('census.reachLede')}</p>

				<!--
					A REAL TABLE, and the one thing on this page that earns the
					element: the rows share a dimension, every column is the
					same question asked of a different language, and the header
					cells are what let a screen reader say which language a cell
					belongs to without the reader counting positions.

					IT SCROLLS AS ONE. Forty columns do not fit a phone, and
					every wrapping alternative breaks what the matrix is for —
					a wrapped row no longer lines up with the row above it. So
					the whole grid scrolls together inside its own box and the
					alignment survives at every width. The box is focusable
					because a scroll container a keyboard cannot reach is a
					region a keyboard reader cannot see the right-hand end of.
				-->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<!-- A SCROLL CONTAINER MUST BE FOCUSABLE, and the lint rule that
				     objects to it is answering a different question. WCAG 2.1.1
				     is why: a region that scrolls and cannot be reached from a
				     keyboard hides everything past its right edge from anyone
				     not using a pointer, which here is thirty of the forty
				     languages. `role="region"` plus the section's own heading is
				     what gives it a name once it is in the tab order. -->
				<div class="matrix-scroll" tabindex="0" role="region" aria-labelledby="reach-heading">
					<table class="matrix">
						<thead>
							<tr>
								<th scope="col" class="corner">
									<span class="visually-hidden">{t('nav.works')}</span>
								</th>
								{#each census.coverage.languages as lang (lang)}
									<th scope="col" title={languageDisplayName(lang)}>{lang}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each coverage as row (row.key)}
								<tr>
									<th scope="row">
										<span class="work">
											{#if row.icon}<span class="shelf-icon"><Icon name={row.icon} /></span>{/if}
											{t(row.labelKey)}
										</span>
										<span class="row-count">
											{t('census.reachRow')
												.replace('{languages}', n(row.languages))
												.replace('{total}', n(row.cells.length))
												.replace('{of}', n(row.of))}
										</span>
									</th>
									{#each row.cells as cell (cell.lang)}
										<td class:none={cell.value === 0}>
											<!-- The bar is presentational; the value is text a
											     screen reader reads, because a height is not a
											     number to anyone who cannot see it. -->
											<span class="bar" style="--fill: {cell.fraction}" aria-hidden="true"></span>
											<span class="visually-hidden">{cellLabel(cell.value, row.of)}</span>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}

		<section aria-labelledby="cited-heading">
			<h2 id="cited-heading">{t('census.cited')}</h2>
			<!-- THE METHOD BEFORE THE TABLES. Both of its clauses change what
			     the numbers mean, and a reader who meets them afterwards has
			     already read the tables wrongly. -->
			<p class="lede landing-measure">{t('census.method')}</p>

			{#if rankings.length > 1}
				<!--
					Toggles and not a single choice, which is `CitedBy`'s
					arrangement and its argument: the reader is narrowing a list
					already in front of them, and narrowing it to two tables is
					as ordinary as narrowing it to one. `aria-pressed` carries the
					state, so each chip keeps one label in both.

					A chip is named by the heading of the table it shows — the
					table is already named on the page, and a second name for it
					would be a string to translate and a thing to keep true.
				-->
				<div class="filters" role="group" aria-label={t('census.rankFilter')}>
					{#each rankings as [key] (key)}
						<button
							type="button"
							class="filter"
							aria-pressed={!hidden.has(key)}
							onclick={() => toggle(key)}>{t(`census.rank.${key}`)}</button
						>
					{/each}
				</div>
			{/if}

			<div class="rankings">
				{#each shownRankings as [key, rows] (key)}
					<section class="ranking" aria-labelledby="rank-{key}">
						<h3 id="rank-{key}">{t(`census.rank.${key}`)}</h3>
						<!-- An ordered list, because the order IS the content: a
						     screen reader announcing "3 of 20" is reading the rank,
						     which is the one thing a bare list would drop. -->
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
				     out; this is where a reader can see how much that is, and
				     it is the largest row in it. -->
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

	.lede {
		margin: 0 0 1rem;
		color: var(--color-text-muted);
	}

	/* --- The shelves, one sentence each ------------------------------------ */

	.shelves {
		margin: 0;
		/* Two columns where there is room: nine one-line entries down a 72rem
		   page is a narrow column of text with an ocean beside it. `auto-fit`
		   rather than a breakpoint, because how many fit is a function of the
		   width and not of a device. */
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(22rem, 1fr));
		gap: 0.35rem 2.5rem;
	}

	.shelf {
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--color-border);
		break-inside: avoid;
	}

	.shelves dt {
		font-family: var(--font-serif);
		font-weight: 600;
	}

	/*
	 * The shelf's own glyph, in both places it appears — the sentence's term
	 * and the matrix's row heading. Centred in a `1lh` box at the start of the
	 * line rather than set on the baseline, which is `ShelfCard`'s arrangement
	 * and for its reason: a box with no text in it offers its bottom edge as a
	 * baseline, so a 1em mark stands a full em over capitals reaching seven
	 * tenths of one.
	 *
	 * Muted and not accent. There are eighteen of them on the page against the
	 * catalogue's eight, and at this size a mark repeated down two columns is
	 * the page's texture rather than an accent on any one row — which is
	 * `/schola`'s finding about its own eight, one step further along.
	 */
	.shelf-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		block-size: 1lh;
		margin-inline-end: 0.3rem;
		vertical-align: text-bottom;
		color: var(--color-text-muted);
	}

	.shelf-icon :global(svg) {
		inline-size: 0.95em;
		block-size: 0.95em;
	}

	.shelves dd {
		margin: 0;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* --- The matrix -------------------------------------------------------- */

	/*
	 * `overflow-x` on a wrapper and never on the table itself: a scroll
	 * container has to be focusable to be reachable from a keyboard, and
	 * `tabindex` on a `<table>` would put the whole grid in the tab order as
	 * one stop with no way to scroll it.
	 */
	.matrix-scroll {
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.matrix {
		border-collapse: collapse;
		font-size: 0.72rem;
		font-family: var(--font-sans);
	}

	.matrix th[scope='col'] {
		font-weight: 400;
		color: var(--color-text-muted);
		text-align: center;
		padding: 0 0 0.3rem;
		min-width: 1.45rem;
	}

	.matrix th[scope='row'] {
		text-align: left;
		font-weight: 400;
		padding: 0 0.9rem 0 0;
		white-space: nowrap;
		vertical-align: middle;
	}

	.matrix .corner {
		min-width: 0;
	}

	.work {
		display: block;
		font-family: var(--font-serif);
		font-size: 0.92rem;
		color: var(--color-text);
	}

	/* The row's own headline, so the matrix answers "how many languages"
	   without the reader counting cells. */
	.row-count {
		display: block;
		font-size: 0.68rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.matrix td {
		padding: 1px;
		height: 1.5rem;
		vertical-align: bottom;
	}

	/*
	 * A BAR RISING IN THE CELL, not a tint. Fill is a geometric channel, so
	 * the matrix survives `data-mono` — where `--pigment-strength: 0%`
	 * collapses the whole palette to one grey — with nothing lost. A tinted
	 * cell would carry its entire value in colour, which is the line
	 * `site/docs/references.md` draws for the family marks, and this is the
	 * case it was drawn for: here the fill IS the datum.
	 */
	/*
	 * INK, not the muted grey the bars were drawn in first. That token is what
	 * this page sets its secondary prose in, so 320 cells of it read as
	 * something switched off — a matrix greyed out rather than a matrix full —
	 * and the staircase the whole arrangement is for was the faintest thing on
	 * the page. Mixed a fifth of the way to the ground so a full column is a
	 * dark bar and not a black one, which at this density is a wall.
	 *
	 * Two tokens and no literal, so all five appearance axes follow: on paper
	 * it darkens toward the text colour, at night it lightens toward it, and
	 * `data-mono` changes nothing because there was no hue to lose. The FILL is
	 * still the datum (`site/docs/census.md`) — the colour only has to let a
	 * reader see it.
	 */
	.bar {
		display: block;
		width: 100%;
		height: calc(var(--fill) * 100%);
		min-height: 2px;
		background: color-mix(in srgb, var(--color-text) 80%, var(--color-bg));
		border-radius: 1px;
	}

	/* A language with nothing gets a hairline rather than an empty box: the
	   cell must still read as a cell, or a run of them looks like the table
	   stopped. */
	.matrix td.none .bar {
		height: 1px;
		min-height: 1px;
		background: var(--color-border);
	}

	/* --- The rankings ------------------------------------------------------ */

	/*
	 * `CitedBy`'s chips, and deliberately the same drawing: a reader meets
	 * these two controls doing the same job on two pages, and the one on the
	 * apparatus panel is the one they meet oftener. On is the plain state and
	 * off is what is marked, for that panel's reason — every table starts
	 * shown, so an accent fill would paint the whole row solid and make the
	 * loudest thing in the section its control.
	 *
	 * The pigment half is not copied. There a chip stands for a shelf and
	 * carries that shelf's mark, so the colour is the legend; here a chip
	 * stands for a table named beside it in words.
	 */
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0 0 1rem;
	}

	.filter {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.1rem 0.5rem;
		background: none;
		font: inherit;
		font-size: 0.8rem;
		color: var(--color-text);
		cursor: pointer;
	}

	.filter:hover {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/* Still legible switched off, so a reader can see what they have put away
	   and press it again. */
	.filter[aria-pressed='false'] {
		color: var(--color-text-muted);
		border-style: dashed;
		text-decoration: line-through;
		text-decoration-thickness: 1px;
	}

	.rankings {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1.5rem 2.5rem;
	}

	.ranking {
		margin: 0;
		break-inside: avoid;
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

	/* --- The citer breakdown and the page's own furniture ------------------- */

	.citers {
		/* One list and not a grid: eight rows, and a reader compares them
		   against each other rather than reading them as separate subjects. */
		max-width: 28rem;
		margin: 0;
	}

	.citers .row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.citers .row:last-child {
		border-bottom: none;
	}

	.citers dt {
		color: var(--color-text-muted);
	}

	.citers dd {
		margin: 0;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.derived,
	.notice {
		color: var(--color-text-muted);
	}

	.derived {
		margin-top: 2.5rem;
		font-size: 0.9rem;
	}

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
