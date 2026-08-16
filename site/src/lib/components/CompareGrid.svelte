<!--
	Side-by-side comparison, aligned unit by unit — the shared rendering shell
	for compare mode across the Bible, CCC, Compendium and document routes.
	`$lib/compare.ts`'s `alignByNumber` is the alignment logic; this component
	is purely the layout, generic over whatever unit type each caller passes
	(`Verse`, `CccParagraph`, `CompendiumQuestion`, `DocumentSection` all
	satisfy the same `{ n: number }` shape `alignByNumber` requires).

	STAYING ALIGNED WHILE SCROLLING IS THE ACTUAL HARD PART (task brief): the
	same paragraph is a different number of lines in English and Portuguese,
	so two independently-flowing columns drift apart the moment one side's
	unit is longer than the other's. The fix is a CSS GRID with ONE ROW PER
	UNIT: `.compare-grid` is `grid-template-columns: 1fr 1fr`, and each row's
	two cells are simply the next two children in DOM order (grid's default
	row-filling auto-placement, no explicit `grid-row` bookkeeping needed).
	Grid sizes every row to its TALLER cell, so row N's top edge is identical
	in both columns no matter how many lines either side's text wraps to —
	this is what makes "unit 12 in English" and "unit 12 in Portuguese"
	genuinely sit next to each other rather than merely start out that way.
	The tradeoff: a long unit still pushes every later row down equally in
	BOTH columns, so a column with much shorter units overall ends up with
	more visual whitespace per row than it would reading alone — accepted
	because the alternative (independent flow) is the one thing the task
	brief rules out outright.

	A MISSING UNIT (`row.left`/`row.right` undefined — either a genuine
	source asymmetry, an in-flight fetch on `documents/[slug]/read`, or one
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

	`rightHeaderExtra`, when passed, renders inside the RIGHT column's header
	cell — this is where every reading route except `/prayers` hangs its
	comparison edition picker (task brief, defect 2: "a selector in the right
	column's header"). An optional snippet rather than a dedicated `picker`
	prop with its own `editions`/`onselect` shape: this component has no
	business knowing what a "comparison edition" is (the prayers route's
	right column is a Latin FIELD, not an edition at all — see that route's
	own docblock), only that its caller sometimes has more to put in the
	header than a label. Omitting the prop is how prayers stays picker-free
	without this component branching on which route it's in.

	NOT OFFERED FOR THE LEFT COLUMN: the primary reading edition is chosen by
	the page's own `EditionMenu` in the page chrome, not by anything compare
	mode owns — only the second column's edition is this feature's to pick. -->
<script lang="ts" generics="TLeft extends { n: number }, TRight extends { n: number }">
	import type { Snippet } from 'svelte';
	import type { AlignedRow } from '$lib/compare';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		rows: AlignedRow<TLeft, TRight>[];
		leftLang: string;
		rightLang: string;
		leftLabel: string;
		rightLabel: string;
		left: Snippet<[TLeft]>;
		right: Snippet<[TRight]>;
		note?: string;
		rightHeaderExtra?: Snippet;
	}

	let {
		rows,
		leftLang,
		rightLang,
		leftLabel,
		rightLabel,
		left,
		right,
		note,
		rightHeaderExtra
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
	     also where `rightHeaderExtra`'s picker stops being reachable — same
	     "the sidebar yields on a narrow viewport" posture app.css's
	     `.reading-layout.compare` docblock already accepts elsewhere on this
	     page, not a gap specific to the picker. -->
	<div class="compare-header" lang={leftLang}>{leftLabel}</div>
	<div class="compare-header compare-header-right" lang={rightLang}>
		<span class="compare-header-label">{rightLabel}</span>
		{#if rightHeaderExtra}{@render rightHeaderExtra()}{/if}
	</div>

	{#each rows as row (row.n)}
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
	{/each}
</div>
