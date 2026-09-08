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
	 * ## One ranking, and the chips narrow what is in it
	 *
	 * Five tables ranked five different units, and a reader comparing them had
	 * to hold five scales at once. Merged, the rows are comparable and the
	 * chips do the separating — safely, because merging the stored tops is the
	 * exact top of the union (`mergedRanking`). Books start switched off, the
	 * one kind that does: a book's count is every place citing any chapter of
	 * it, so beside its own chapters it answers the table twice.
	 *
	 * ## A ranked row is the reader's own edition
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
	 * kinds here. `index-priming.test.ts` cannot catch it either, because
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
		RANK_HIDDEN_BY_DEFAULT,
		RANK_KINDS,
		censusProse,
		censusShelves,
		citedTotals,
		citerBreakdown,
		coverageRows,
		mergedRanking,
		rankLabelKey,
		rankedBooks,
		rankedCcc,
		rankedChapters,
		rankedDocuments,
		rankedSumma,
		type CensusRankRow
	} from '$lib/census';
	import { SvelteSet } from 'svelte/reactivity';
	import { AnchoredPanel } from '$lib/floating.svelte';
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

	/**
	 * THE THREE LINES THAT QUALIFY RATHER THAN SAY, each behind the `i` beside
	 * the heading it belongs to — `DayReadings`' arrangement, which is
	 * `ArtFigure`'s, and the site's one answer to a sentence of small print.
	 *
	 * WHAT GOES BEHIND THE GLYPH IS A METHOD AND NEVER A NUMBER. These three
	 * say how the page was counted; a reader who never presses them reads every
	 * figure correctly and only lacks the argument for it. `census.citersLede`
	 * stays on the page for exactly that reason — it carries the two totals
	 * that stop the column under it from being read as short of the ledger's,
	 * and a fact hidden behind a control is a fact most readers do not have.
	 *
	 * `$props.id()` has to be a bare declaration, so the three ids are suffixed
	 * off one: three panels can be open on this page and each needs a name a
	 * `popovertarget` can call.
	 */
	const uid = $props.id();
	const hints = {
		derived: new AnchoredPanel(`${uid}-derived`),
		reach: new AnchoredPanel(`${uid}-reach`),
		cited: new AnchoredPanel(`${uid}-cited`)
	};

	/** Every count on the page, in the reader's own number formatting. */
	const n = (value: number) => formatNumber(value, i18n.lang);

	const shelves = $derived(census ? censusShelves(census) : []);
	const coverage = $derived(census ? coverageRows(census) : []);
	const citers = $derived(census ? citerBreakdown(census) : []);

	/**
	 * The five kinds, each named out of the reader's own edition — what the
	 * chips switch and what the one table is merged from.
	 *
	 * DERIVED PER RENDER rather than memoised, and it must be: every label in
	 * it comes out of the reader's own edition, so a language change or an
	 * edition change has to re-run this. It is five short array maps over at
	 * most twenty rows each.
	 */
	const rankings = $derived.by(() => {
		if (!census) return [];
		const rows: Record<string, CensusRankRow[]> = {
			books: rankedBooks(census),
			chapters: rankedChapters(census),
			documents: rankedDocuments(census),
			ccc: rankedCcc(census),
			summa: rankedSumma(census)
		};
		return RANK_KINDS.map((key) => ({ key, rows: rows[key] })).filter(
			({ rows }) => rows.length > 0
		);
	});

	const totals = $derived(census ? citedTotals(census) : undefined);

	/**
	 * WHICH RANKING TABLES ARE SWITCHED OFF, rather than which are on — the
	 * store `CitedBy` keeps, for its reason: a ranking added later shows up
	 * without anyone having opted into it, and there is no default here that is
	 * not "on" for an omission to have to imply.
	 *
	 * IT FILTERS WHAT IS RANKED AND NOT WHO DID THE CITING, which is the one
	 * way this differs from that panel and it is not a shortcut. Narrowing by
	 * KIND is exact: a row in the merged top twenty is in its own kind's top
	 * twenty, so nothing the subset needs was left out of the file
	 * (`mergedRanking`). Narrowing by CITING FAMILY is not: those counts were
	 * summed at build time, and re-ranking a stored top twenty by one family
	 * would publish the top of that family's list only where the two happen to
	 * agree. That would need a cut per subset, which is a different file and
	 * not a control.
	 */
	let hidden = $state(new SvelteSet<string>(RANK_HIDDEN_BY_DEFAULT));

	/** One table over whichever kinds are switched on, cut on the count. */
	const ranked = $derived(mergedRanking(rankings.filter(({ key }) => !hidden.has(key))));

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

	/**
	 * WHICH CELL THE POINTER IS OVER, and it is state rather than CSS because
	 * two of the three things it drives cannot be reached with a selector: a
	 * column heading is not an ancestor, a sibling or a descendant of the cell
	 * under it, and the readout is a paragraph outside the table.
	 *
	 * Cleared on leaving the table rather than on leaving a cell, so moving
	 * between two cells never blanks the readout between them.
	 */
	let hover = $state<{ row: string; lang: string } | undefined>();

	/** The percentage, rounded to whole numbers except where that would round
	 *  a language that has something down to nothing. `formatNumber` carries
	 *  the reader's own separators, and the `%` is `Intl`'s. */
	const percent = (fraction: number) => {
		const whole = fraction * 100;
		const decimals = whole > 0 && whole < 1 ? 1 : 0;
		return formatNumber(whole, i18n.lang, decimals) + '%';
	};

	/** The readout over the matrix: a work, a language and how far the one
	 *  reaches in the other. */
	const reading = $derived.by(() => {
		const at = hover;
		if (!at) return undefined;
		const row = coverage.find((r) => r.key === at.row);
		const cell = row?.cells.find((c) => c.lang === at.lang);
		if (!row || !cell) return undefined;
		return `${t(row.labelKey)} · ${languageDisplayName(cell.lang)} · ${percent(cell.fraction)} — ${cellLabel(cell.value, row.of)}`;
	});
</script>

<svelte:head>
	<title>{t('census.title')} — {t('home.title')}</title>
</svelte:head>

<!--
	THE `i` AND WHAT IT OPENS, three times over, and a snippet because three
	copies of a trigger and a popover is three places for one of them to lose
	its `aria-label`. `role="note"` is ARIA's own word for content ancillary to
	the thing it hangs off, which this exactly is — not `tooltip`, which
	describes its anchor and is summoned rather than asked for. The trigger has
	no text of its own, so the label is mandatory and not a courtesy.
-->
{#snippet hint(panel: AnchoredPanel, label: string, text: string)}
	<button
		bind:this={panel.trigger}
		type="button"
		class="menu-trigger about"
		popovertarget={panel.id}
		aria-expanded={panel.open}
		aria-label={label}
	>
		<Icon name="info" />
	</button>
	<span
		bind:this={panel.panel}
		id={panel.id}
		popover="auto"
		role="note"
		ontoggle={panel.onToggle}
		class="panel-surface floating-panel caveat">{text}</span
	>
{/snippet}

<div class="landing-column">
	<div class="head">
		<h1>{t('census.title')}</h1>
		{@render hint(hints.derived, t('census.about.derived'), t('census.derived'))}
	</div>
	<p class="page-tagline landing-measure">{t('census.tagline')}</p>
	<p class="caveat-print" aria-hidden="true">{t('census.derived')}</p>

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
				<div class="head">
					<h2 id="reach-heading">{t('census.reach')}</h2>
					{@render hint(hints.reach, t('census.about.reach'), t('census.reachLede'))}
				</div>

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
				<!-- THE READOUT, AND ITS HEIGHT IS RESERVED. It names the cell
				     under the pointer, and it is one line whether or not there
				     is a cell: appearing and disappearing in the flow would
				     shove the whole matrix up and down under the reader's own
				     hand, which is `/calendarium`'s rule about a surface that
				     must not move under a pointer. `aria-live` is deliberately
				     absent — a pointer readout announced on every cell crossed
				     is forty interruptions a row, and the same fact is already
				     in each cell's own text. -->
				<p class="reading" aria-hidden={!reading}>{reading ?? ''}</p>

				<!-- A SCROLL CONTAINER MUST BE FOCUSABLE, and the lint rule that
				     objects to it is answering a different question. WCAG 2.1.1
				     is why: a region that scrolls and cannot be reached from a
				     keyboard hides everything past its right edge from anyone
				     not using a pointer, which here is thirty of the forty
				     languages. `role="region"` plus the section's own heading is
				     what gives it a name once it is in the tab order. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<div
					class="matrix-scroll"
					tabindex="0"
					role="region"
					aria-labelledby="reach-heading"
					onmouseleave={() => (hover = undefined)}
				>
					<table class="matrix">
						<thead>
							<tr>
								<th scope="col" class="corner">
									<span class="visually-hidden">{t('nav.works')}</span>
								</th>
								{#each census.coverage.languages as lang (lang)}
									<th scope="col" class:lit={hover?.lang === lang} title={languageDisplayName(lang)}
										>{lang}</th
									>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each coverage as row (row.key)}
								<tr>
									<th scope="row" class:lit={hover?.row === row.key}>
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
										<td
											class:none={cell.value === 0}
											class:lit={hover?.row === row.key && hover?.lang === cell.lang}
											onmouseenter={() => (hover = { row: row.key, lang: cell.lang })}
										>
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
				<!-- Paper gets it unconditionally, under what it qualifies, on
				     `DayReadings`' reasoning: a popover never prints — top
				     layer, and closed besides — and this is the one copy whose
				     reader cannot press anything. `aria-hidden` so a screen
				     reader does not meet it twice. -->
				<p class="caveat-print" aria-hidden="true">{t('census.reachLede')}</p>
			</section>
		{/if}

		<section aria-labelledby="cited-heading">
			<div class="head">
				<h2 id="cited-heading">{t('census.cited')}</h2>
				<!-- THE METHOD IS ON THE HEADING and not a line under it. Both of
				     its clauses change what the numbers mean, so it has to be
				     reachable from above the table rather than met after it —
				     which is what a glyph ON the heading is, where three lines of
				     small print between a heading and its own table are read once
				     and skipped thereafter. -->
				{@render hint(hints.cited, t('census.about.cited'), t('census.method'))}
			</div>

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
					{#each rankings as { key } (key)}
						<button
							type="button"
							class="filter"
							aria-pressed={!hidden.has(key)}
							onclick={() => toggle(key)}>{t(rankLabelKey(key))}</button
						>
					{/each}
				</div>
			{/if}

			<!-- ONE ORDERED LIST AND NOT FIVE, because the order IS the content:
			     a screen reader announcing "3 of 20" is reading the rank, which
			     is the one thing a bare list would drop. Each row carries the
			     mark of the work it belongs to, so a table holding four kinds
			     at once still says what each row is. -->
			<ol class="ranking">
				{#each ranked as row (row.kind + ' ' + row.key)}
					<li>
						<!-- The mark says what the row is, and the name behind it says
						     so in words — for a screen reader, and for anyone who
						     cannot tell a quill from a scroll at 0.95em. Set out as
						     visible text it was the kind repeated down twenty rows,
						     which is the noise this page was rebuilt to lose. -->
						{#if row.icon}
							<span class="shelf-icon" title={t(rankLabelKey(row.kind))}>
								<Icon name={row.icon} />
								<span class="visually-hidden">{t(rankLabelKey(row.kind))}</span>
							</span>
						{/if}
						<a href={row.href} title={row.fullTitle ?? undefined}>{row.label}</a>
						<span class="count" title={t('census.timesCited')}>{n(row.value)}</span>
					</li>
				{/each}
			</ol>
			<p class="caveat-print" aria-hidden="true">{t('census.method')}</p>
		</section>

		{#if citers.length}
			<section aria-labelledby="citers-heading">
				<h2 id="citers-heading">{t('census.citers')}</h2>
				<!-- THE OTHER DIRECTION, and it counts what the ranking counts:
				     an edition's own footnotes are not a row here, because they
				     are not a row up there either. The sentence says what the
				     rows sum to, which is what stops a column of counts under a
				     stated total from being read as short of it. -->
				{#if totals}
					<p class="lede landing-measure">
						{t('census.citersLede')
							.replace('{counted}', n(totals.counted))
							.replace('{references}', n(totals.references))}
					</p>
				{/if}
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

	.lede {
		margin: 0 0 1rem;
		color: var(--color-text-muted);
	}

	/*
	 * A HEADING AND THE `i` THAT QUALIFIES IT, on one row. The glyph belongs to
	 * the heading rather than to the section, which is what puts it above the
	 * table instead of in a line of small print between the two — and a
	 * heading's own bottom rule still runs the width of the column, because the
	 * flex row is what carries it.
	 */
	.head {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.head h2 {
		flex: 1 1 auto;
	}

	/* `.menu-trigger` is the site's button and this adds only its size and
	   colour — `DayReadings` sizes its own the same way, against the type it
	   stands beside. `align-self` keeps it off the heading's rule. */
	.about {
		flex: none;
		align-self: center;
		inline-size: 1.5rem;
		block-size: 1.5rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/* `SiglumGloss`'s card at this one's measure: where it goes is
	   `.floating-panel` in app.css, and what is left here is that a sentence
	   or two wants a narrower column than a paragraph of commentary. */
	.caveat {
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		overflow-wrap: break-word;
	}

	.caveat-print {
		display: none;
	}

	@media print {
		/* Each control becomes the line it opens. */
		.about {
			display: none;
		}

		.caveat-print {
			display: block;
			margin: 0.7rem 0 0;
			max-inline-size: 40rem;
			font-size: 0.75rem;
			line-height: 1.45;
			color: var(--color-text-muted);
		}
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
	 * THE ACCENT, which is `/schola`'s treatment of its own marks and the one
	 * this page had no colour of at all. One accent and not a colour per work:
	 * past a certain count a colour stops picking a row out and becomes the
	 * page's texture, and there are more marks here than on that page.
	 */
	.shelf-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		block-size: 1lh;
		margin-inline-end: 0.3rem;
		vertical-align: text-bottom;
		color: var(--color-accent);
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
	 * GROUND LAPIS — `--color-apparatus`, the hue this palette already spends
	 * on the citation apparatus, and the second thing on the page that is a
	 * measurement rather than a word. It was the muted grey first, which is
	 * what this page sets its secondary prose in, so three hundred cells of it
	 * read as a matrix switched off rather than one full.
	 *
	 * A TOKEN AND NOT A LITERAL, which is what makes it survive the five
	 * appearance axes: the token is #22409a on paper, a pale cornflower at
	 * night, and grey under `data-mono` — where the FILL still carries every
	 * datum, which is why this may be a colour at all
	 * (`site/docs/references.md`, `site/docs/census.md`).
	 */
	.bar {
		display: block;
		width: 100%;
		height: calc(var(--fill) * 100%);
		min-height: 2px;
		background: var(--color-apparatus);
		border-radius: 1px;
	}

	/* The cell under the pointer, and the two headings that name it. The cell
	   takes the accent — the page's other colour, so the one cell being read
	   is told from the three hundred being compared — and the headings take
	   weight and the text colour, which is a change a reader can see at 0.75rem
	   where a colour alone is not. */
	.matrix td.lit .bar {
		background: var(--color-accent);
	}

	/*
	 * THE LIT ROW AND COLUMN, AND NOTHING HERE MAY CHANGE A TEXT METRIC.
	 *
	 * It was `font-weight: 700` for one revision, which is the defect
	 * `/calendarium` already records: a heading that goes bold under the
	 * pointer is WIDER than it was, so the first column grew, all forty
	 * language columns moved with it, and the cell being pointed at slid out
	 * from under the pointer — a hover that moves what it is pointing at.
	 * `min-width` on the column heads makes it worse rather than safer, since
	 * a two-letter tag in bold is what overruns it.
	 *
	 * COLOUR AND NOTHING ELSE. A painted underline stood here for one revision
	 * and was a second mark for a state the colour already carries: three
	 * things change at once when a cell is pointed at — the cell, its row and
	 * its column — and each of them turning accent is one mark in three places,
	 * where a rule under two of them is a different mark on the same event.
	 * Both headings take the accent the lit cell takes, and that is the whole
	 * of it.
	 */
	.matrix th.lit {
		color: var(--color-accent);
	}

	/* `.work` sets its own colour, so the rule above cannot reach it. */
	.matrix th[scope='row'].lit .work {
		color: var(--color-accent);
	}

	/*
	 * THE READOUT, and its height is reserved whether or not it says anything
	 * — `min-height` on the line rather than a conditional block, so the matrix
	 * under it never moves while a reader runs along a row. It sits above the
	 * grid because the grid scrolls sideways and a line under it would be the
	 * first thing off the bottom of a phone.
	 */
	.reading {
		min-height: 1.5em;
		margin: 0 0 0.4rem;
		font-size: 0.9rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		/* ONE LINE ALWAYS, for the reason the height is reserved at all: the
		   longest reading here is a work, a language, a percentage and a
		   fraction, which wraps in a narrow window and pushes the matrix down
		   under the pointer that asked for it. Truncating loses the tail of a
		   line the reader can restore by moving one cell; wrapping moves the
		   grid they are reading. */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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

	/* ONE COLUMN AND NOT FIVE. The five tables were a grid of short lists, and
	   a grid is right where the lists are separate questions; merged into one
	   ranking the rows are comparable, so they belong under one another. Capped
	   at `.landing-measure`'s width — a ranked row is a name and a number, and
	   a rule 72rem long between two of them is a page pretending to be a
	   table. */
	.ranking {
		margin: 0;
		max-inline-size: 40rem;
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

	.notice {
		color: var(--color-text-muted);
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
