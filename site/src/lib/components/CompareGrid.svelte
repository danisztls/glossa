<!--
	Side-by-side comparison, aligned unit by unit — the shared rendering shell
	for compare mode across the Bible, CCC, Compendium and document routes.
	`$lib/compare.ts`'s `alignByNumber` is the alignment logic; this component
	is the layout plus the one affordance a row owns (its anchor, below),
	generic over whatever unit type each caller passes (`Verse`,
	`CccParagraph`, `CompendiumQuestion`, `DocumentSection` all satisfy the
	same `{ n: number }` shape `alignByNumber` requires).

	STAYING ALIGNED WHILE SCROLLING IS THE ACTUAL HARD PART (task brief): the
	same paragraph is a different number of lines in English and Portuguese,
	so two independently-flowing columns drift apart the moment one side's
	unit is longer than the other's. The fix is ONE GRID PER UNIT — a
	`.compare-row` whose three tracks are `1fr <gutter> 1fr` — sized by its
	TALLEST cell, so row N's top edge is identical in both columns no matter
	how many lines either side's text wraps to. This is what makes "unit 12 in
	English" and "unit 12 in Portuguese" genuinely sit next to each other
	rather than merely start out that way. The tradeoff: a long unit still
	pushes every later row down equally in BOTH columns, so a column with much
	shorter units overall ends up with more visual whitespace per row than it
	would reading alone — accepted because the alternative (independent flow)
	is the one thing the task brief rules out outright.

	IT USED TO BE ONE GRID FOR THE WHOLE VIEW, with two children per unit and
	default row-filling auto-placement. Every track is a fixed width or an
	equal `1fr`, so per-row grids compute identical columns without needing
	`subgrid`, and a row that is a real element is what the three things added
	since then all need: an `id` to arrive at, a background to mark saved and
	cited units with, and — on a phone, where the row stacks to one column — a
	DOM order that puts the anchor ABOVE its pair rather than between the two
	texts. That last one is why the gutter cell comes FIRST in the markup and
	is placed into column 2 explicitly; visual order and source order genuinely
	differ here, and only source order survives the stack.

	NOT EVERY BAND IS A UNIT. `interlude` renders content that DIVIDES the
	units rather than being one of them — the document reader's Part, Chapter
	and Article headings, which compare mode used to drop outright on the
	grounds that a heading is not a number `alignByNumber` can align. True, but
	a heading does know the section it precedes, and that number is a perfectly
	good key: the caller aligns its two structure trees on it and hands back a
	band per column, which is why this component needs to know nothing about
	what a heading is.

	THE ANCHOR IS THE ROW'S, NOT EITHER CELL'S — see `CompareUnit` in
	`$lib/compare.ts` for why, and note that `unit` is optional: `/preces` has
	no numbered sub-unit to hang one off (that route's docblock), so its gutter
	is empty and reserves the track for the divider alone.

	A MISSING UNIT (`row.left`/`row.right` undefined — either a genuine
	source asymmetry, an in-flight fetch on `documents/[slug]`, or one
	of the corpus's own known gaps) renders as an explicit placeholder cell,
	never as a collapsed/skipped row: skipping it would silently reintroduce
	the position-based misalignment `alignByNumber`'s docblock explains this
	whole component exists to avoid, and leaving it visibly blank keeps the
	row's vertical position — and therefore the OTHER column's alignment —
	unaffected.

	`note`, when passed, is the Bible-only "these two editions split this
	chapter's verses differently" advisory (`$lib/compare.ts`'s
	`numberSetsDiffer`, docblock) — deliberately plain, muted text rather
	than a warning colour, matching the project's established posture that a
	known, disclosed limitation is not styled as an error (see
	`UnpublishedNotice.svelte`'s own reasoning for the same choice).

	THE HEADER ROW IS ALWAYS RENDERED, AND STICKS. It used to be suppressed by
	five of six callers (`showHeader={false}`, now gone) because each had
	folded a per-language block above the grid that already named the edition,
	which made a plain label underneath pure repetition. Turning it into the
	sticky control bar reverses that: the pickers, the bookmark button and the
	compare toggle all MOVED here out of blocks that scrolled away, so the row
	is now the only place they live and the header block above it got shorter
	for it. `/preces` passes no `controls` and keeps plain labels — its right
	column is a Latin FIELD, not a second edition with a picker of its own (see
	that route's docblock). -->
<!--
	`apparatus` is the collapse rule from `.compare-unit-header` (app.css)
	applied one level down, to the units themselves: something both editions
	state identically belongs to the row, not to either column. -->
<script lang="ts" generics="TLeft extends { n: number }, TRight extends { n: number }">
	import type { Snippet } from 'svelte';
	import type { AlignedRow, CompareUnit } from '$lib/compare';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import ReferenceNumber from './ReferenceNumber.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		rows: AlignedRow<TLeft, TRight>[];
		leftLang: string;
		rightLang: string;
		leftLabel: string;
		rightLabel: string;
		left: Snippet<[TLeft]>;
		right: Snippet<[TRight]>;
		/** The row's own anchor — addresses and label only; this component owns
		 *  what is done with them. Omitted where a route's rows have no unit
		 *  number worth showing (`/preces`). */
		unit?: (n: number) => CompareUnit;
		/** A band rendered ABOVE the row for `n`, two columns wide, for content
		 *  that divides the units rather than being one of them — today the
		 *  document reader's Part/Chapter/Article headings, which used to be
		 *  dropped from compare mode entirely (see `documents/[slug]`). Grouped
		 *  into one prop because `has` and the two snippets are meaningless
		 *  apart: a snippet cannot be asked whether it would render anything,
		 *  so the caller has to say which numbers open a band. */
		interlude?: {
			has: (n: number) => boolean;
			left: Snippet<[number]>;
			right: Snippet<[number]>;
		};
		/** A band rendered BELOW the row for `n`, ONE cell spanning both
		 *  columns, for apparatus the two editions state identically — the
		 *  Compendium's "Condenses CCC ¶¶..." is the case it was built for: a
		 *  question's cross-references belong to the question, not to either
		 *  translation of it, and printing them twice said otherwise. `has` is
		 *  what decides, so a route that finds the two sides DISAGREEING simply
		 *  answers false and lets each column keep its own. */
		apparatus?: {
			has: (n: number) => boolean;
			render: Snippet<[number]>;
		};
		/** The sticky bar's two controls, plus the page-level toolbar. Given
		 *  these, the bar carries the edition pickers themselves rather than
		 *  plain labels — the picker already prints the edition's name, so a
		 *  label beside it would say the same word twice. `/preces` passes
		 *  nothing and keeps the labels: its right column is a Latin FIELD with
		 *  no picker to hang there. */
		controls?: {
			left: Snippet;
			right: Snippet;
			toolbar?: Snippet;
		};
		note?: string;
	}

	let {
		rows,
		leftLang,
		rightLang,
		leftLabel,
		rightLabel,
		left,
		right,
		unit,
		interlude,
		apparatus,
		controls,
		note
	}: Props = $props();
</script>

{#if note}
	<p class="compare-note">{note}</p>
{/if}

<div class="compare-grid">
	<!--
		THE STICKY BAR. It identifies the two columns once instead of tagging
		every cell, and it does so at every scroll depth — which is the point,
		because thirty sections into an encyclical nothing else on screen says
		which side is which. It sticks BELOW the site header rather than at the
		viewport top, using `--site-header-height` (published by `+layout.svelte`
		from a ResizeObserver, because that header's height is animated and
		wraps).

		IT CARRIES THE CONTROLS, NOT JUST THE NAMES. Every picker used to live
		in the per-language header block above the grid and scroll away with it;
		so did the bookmark and compare-toggle buttons, up in `.breadcrumb-row`.
		All four want to be reachable at depth for the same reason the labels
		do, and the compare toggle most of all — a reader who has decided they
		only want one language should not have to scroll back to the top to say
		so. Gathering them here also shortens the header block, which was the
		other complaint about this view.

		The page-level toolbar rides at the FAR RIGHT of the right column rather
		than in a track of its own: it belongs to the page, not to either
		edition, and the top-right corner is where it already was. The empty
		gutter cell keeps this row's tracks identical to every row beneath it.
	-->
	<div class="compare-row compare-row-header">
		<div class="compare-gutter" aria-hidden="true"></div>
		<div class="compare-header compare-header-left" lang={controls ? undefined : leftLang}>
			{#if controls}
				{@render controls.left()}
			{:else}
				<span class="compare-header-label">{leftLabel}</span>
			{/if}
		</div>
		<div class="compare-header compare-header-right" lang={controls ? undefined : rightLang}>
			{#if controls}
				{@render controls.right()}
			{:else}
				<span class="compare-header-label">{rightLabel}</span>
			{/if}
			{#if controls?.toolbar}
				<div class="compare-header-toolbar">{@render controls.toolbar()}</div>
			{/if}
		</div>
	</div>

	{#each rows as row (row.n)}
		{@const u = unit?.(row.n)}
		<!-- A band takes the same three tracks as a unit row, so the divider
		     runs through it unbroken and each language's headings stay over
		     their own column. It carries no number: a Part title is not an
		     addressable unit, and `alignByNumber` never saw one — what aligns
		     it is the section number it precedes, which is `row.n` here. -->
		{#if interlude?.has(row.n)}
			<div class="compare-row compare-row-interlude">
				<div class="compare-gutter" aria-hidden="true"></div>
				<div class="compare-cell compare-cell-left reading-text" lang={leftLang}>
					{@render interlude.left(row.n)}
				</div>
				<div class="compare-cell compare-cell-right reading-text" lang={rightLang}>
					{@render interlude.right(row.n)}
				</div>
			</div>
		{/if}
		<div
			class="compare-row"
			id={u?.anchorId}
			class:bookmarked={u !== undefined && bookmarks.has(u.canonicalHref)}
			class:highlighted={u?.emphasized}
		>
			<!-- `reading-text` here as well as on the two cells: the number is set
			     in `em` against its container, so without it the gutter is the one
			     part of the reading column that would ignore `--reading-scale`. -->
			<div class="compare-gutter reading-text">
				{#if u}
					<ReferenceNumber
						n={row.n}
						href={u.href}
						canonicalHref={u.canonicalHref}
						label={u.label}
						placement="gutter"
						emphasized={u.emphasized}
					/>
				{/if}
			</div>
			<!-- `reading-text` on every cell (not just the wrapping grid): that's
			     the one selector `--reading-scale` is wired to (app.css), and
			     compare-mode text is still reading text the font-size preference
			     should govern, same as the single-column view it stands in for. -->
			<div class="compare-cell compare-cell-left reading-text" lang={leftLang}>
				<span class="compare-cell-tag">{leftLabel}</span>
				{#if row.left}
					{@render left(row.left)}
				{:else}
					<p class="compare-missing">{t('compare.missing')}</p>
				{/if}
			</div>
			<div class="compare-cell compare-cell-right reading-text" lang={rightLang}>
				<span class="compare-cell-tag">{rightLabel}</span>
				{#if row.right}
					{@render right(row.right)}
				{:else}
					<p class="compare-missing">{t('compare.missing')}</p>
				{/if}
			</div>
		</div>
		<!-- Apparatus both editions state identically, printed once under the
		     pair instead of twice inside it. One cell across all three tracks,
		     so the divider stops here — which is the correct thing for it to
		     say: this line is not divided between the two columns, it is about
		     the unit above them both. -->
		{#if apparatus?.has(row.n)}
			<div class="compare-row compare-row-apparatus">
				<div class="compare-cell compare-cell-shared reading-text">
					{@render apparatus.render(row.n)}
				</div>
			</div>
		{/if}
	{/each}
</div>
