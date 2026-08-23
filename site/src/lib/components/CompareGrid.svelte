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

	`showHeader`, when false, omits this component's own header row entirely.
	Every caller but `/prayers` needs this: their title, copyright notice and
	edition picker are ALL per-language already, so each folds them into one
	merged two-column block above the grid (`.compare-unit-header`, app.css)
	rather than repeating a plain label a second time right under a header
	that already named the edition — that block is also where `EditionMenu`
	and the comparison picker now live while comparing, not in this
	component. `/prayers` has no such block (its right column is a Latin
	FIELD, not a second edition — see that route's own docblock) and keeps
	the default: this component's own label row is the only per-column
	identification it has. -->
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
		note?: string;
		showHeader?: boolean;
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
		note,
		showHeader = true
	}: Props = $props();
</script>

{#if note}
	<p class="compare-note">{note}</p>
{/if}

<div class="compare-grid">
	<!-- Header row: identifies the two columns once, rather than tagging
	     every single cell — see the per-cell `.compare-cell-tag` fallback
	     below for the narrow-viewport case where the header has scrolled out
	     of view. Both headers vanish together below 40rem (app.css), which is
	     also where the pickers stop being reachable — same "the sidebar
	     yields on a narrow viewport" posture app.css's `.reading-layout.
	     compare` docblock already accepts elsewhere on this page, not a gap
	     specific to either picker. The empty gutter cell keeps this row's
	     tracks identical to every row beneath it, so the divider runs through
	     it unbroken. -->
	{#if showHeader}
		<div class="compare-row compare-row-header">
			<div class="compare-gutter" aria-hidden="true"></div>
			<div class="compare-header compare-header-left" lang={leftLang}>
				<span class="compare-header-label">{leftLabel}</span>
			</div>
			<div class="compare-header compare-header-right" lang={rightLang}>
				<span class="compare-header-label">{rightLabel}</span>
			</div>
		</div>
	{/if}

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
	{/each}
</div>
