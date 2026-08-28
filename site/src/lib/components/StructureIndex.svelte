<script lang="ts">
	/**
	 * Readable outline for the Catechism and its Compendium.
	 *
	 * IT IS ONE GRID, and every row is a `subgrid` of it. The page crosses two
	 * variables — a division of the outline, and what each of the two works has
	 * at it — so the two work columns have to align down the whole page, which
	 * nested `<ol>`s could not do (each level is its own formatting context, so
	 * a right-aligned chip aligns against that level's box and no per-row
	 * flexbox can straighten it). A single grid with `grid-template-columns:
	 * subgrid` on the list and on each row puts all hundred rows in one set of
	 * tracks while leaving each row a real box of its own.
	 *
	 * IT WAS A `<table>` UNTIL 2026-08-28, and what it cost is why it is not:
	 * a cell's inline end is the column boundary for EVERY line of it, and
	 * nothing lets text reflow into the neighbouring cell's area on a later
	 * line. So a part title — the largest text here, next to the widest chip
	 * here (`¶1691–2557`, the part spans being the longest ranges in the book)
	 * — wrapped early and left two columns of dead space beside its second
	 * line. A grid row can hand the title its own track row spanning every
	 * column, so the numbering sits beside the chips and the title beneath them
	 * runs the full width (`.stacked` below).
	 *
	 * What the table did carry and this has to carry itself is the naming:
	 * `<th scope="col">` delivered the work's name with every cell, so the
	 * chips needed no label of their own. There is no such mechanism here, so
	 * each chip states its work in `aria-label` — see the header comment below.
	 *
	 * NO MAIN LINK, unchanged: the title is text and both works are links,
	 * because the two are one outline published at two lengths
	 * (`toc-pairing.ts`) and linking the title to one of them would answer a
	 * question the reader has not asked. The same component draws the home
	 * page's shallower version — `maxDepth` stops the recursion.
	 */
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import type { Component } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { displayTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode } from '$lib/types';
	import type { IndexRow } from './indexToc';
	import { indexRows, rowKey, type RowLink } from './indexToc';
	import { marker } from './structureToc';

	interface Props {
		tree: StructureNode[];
		lang: string;
		/**
		 * What each work offers for this row, in a FIXED ORDER matching
		 * `workColumns`. A slot may be `undefined` — that work has no
		 * counterpart here — and its cell is drawn empty-but-marked rather
		 * than skipped.
		 */
		links: (node: StructureNode) => (RowLink | undefined)[];
		/**
		 * One per link slot, in the same order: the column headers.
		 *
		 * THE HEADER IS AN ICON AND THE NAME IS ITS LABEL. Two columns of
		 * numbers need telling apart, not two words repeated over them — a
		 * closed book and a question mark say "the text" and "the questions
		 * about it" in the width of a glyph, which is the width this column has.
		 * The name is not lost: it is the header's `title` and its
		 * visually-hidden text, and every chip under it repeats it in `title`
		 * and `aria-label` — which a table got for free from `scope="col"` and
		 * a grid has no way to get at all.
		 */
		workColumns: { label: string; icon: Component }[];
		/** Shown in a cell the work has no counterpart for. */
		noCounterpartLabel: string;
		/** Outline levels to render: 1 is the top level alone, 2 adds its
		 *  children. Everything, by default. */
		maxDepth?: number;
		/** Whether a row's unnumbered sub-headings are offered behind a
		 *  disclosure. Off for an overview. */
		subsections?: boolean;
		/** Levels open before the reader touches anything. 2 opens the parts
		 *  and their sections, so the Catechism arrives as its Prologue, four
		 *  parts, eight sections and twenty chapters — the shape of the book —
		 *  with the sixty-seven articles folded away. */
		openDepth?: number;
	}

	let {
		tree,
		lang,
		links,
		workColumns,
		noCounterpartLabel,
		maxDepth = Number.POSITIVE_INFINITY,
		subsections = true,
		openDepth = 2
	}: Props = $props();

	/**
	 * The levels whose title gets a line of its own, running the full width of
	 * the grid: at 1.2rem and 1.05rem the title is the thing being read and
	 * "PART 2" is a standing above it, not a word in it. Below these the row is
	 * small enough that the numbering reads as part of the line, and a second
	 * line would only add height.
	 *
	 * A row stacks only when it HAS a marker to put on the first line —
	 * otherwise the line would hold a disclosure arrow and nothing else.
	 */
	const STACKED_KINDS = new Set<StructureNode['kind']>(['prologue', 'part', 'section']);

	/**
	 * WHAT IS STORED IS THE DEVIATION FROM THE DEFAULT, not the open set. A row
	 * at depth `d` is open when `d < openDepth`, unless the reader has toggled
	 * it — so nothing has to be seeded, nothing has to be re-seeded when the
	 * language changes the tree underneath it, and `openDepth` can move without
	 * a migration. `ancestors[i]` is the ancestor at depth `i`, which is what
	 * lets a row's visibility be decided from keys alone.
	 */
	let toggled = $state(new SvelteSet<string>());

	const rows = $derived(indexRows(tree, { maxDepth, subsections }));

	function openAt(key: string, depth: number): boolean {
		const byDefault = depth < openDepth;
		return toggled.has(key) ? !byDefault : byDefault;
	}

	const visible = (row: IndexRow) => row.ancestors.every((key, i) => openAt(key, i));

	function toggle(node: StructureNode) {
		const key = rowKey(node);
		if (toggled.has(key)) toggled.delete(key);
		else toggled.add(key);
	}
</script>

<!-- One control, two placements: a stacked row puts it beside the numbering,
     a plain row at the head of the title. Written once so the two branches
     below differ only in where the title goes. -->
{#snippet disclosure(row: IndexRow, title: string, isOpen: boolean)}
	{#if row.expandable}
		<button
			type="button"
			class="toggle"
			class:open={isOpen}
			aria-expanded={isOpen}
			aria-label={`${isOpen ? t('index.hideSubsections') : t('index.showSubsections')}: ${title}`}
			onclick={() => toggle(row.node)}
		>
			<ChevronRight size={14} aria-hidden="true" />
		</button>
	{:else}
		<span class="toggle-spacer" aria-hidden="true"></span>
	{/if}
{/snippet}

<div
	class="index"
	style={`--index-cols: minmax(0, 1fr) repeat(${workColumns.length}, auto)`}
	data-link-preview="off"
>
	<div class="index-head">
		<!-- Named for a screen reader and blank on screen: this is the title
		     column, and printing "Division" over a column of titles labels the
		     obvious while competing with the two headings that carry
		     information. It is out of flow (`.visually-hidden` is absolute), so
		     it occupies no track and the icons are placed explicitly. -->
		<span class="visually-hidden">{t('index.division')}</span>
		{#each workColumns as column, slot (column.label)}
			{@const Icon = column.icon}
			<span class="col-head" style={`grid-column:${slot + 2}`} title={column.label}>
				<Icon size={17} aria-hidden="true" />
				<span class="visually-hidden">{column.label}</span>
			</span>
		{/each}
	</div>

	<!-- `role="list"` because `list-style: none` drops the list role in Safari,
	     and this is the markup carrying the outline now that the table is gone. -->
	<ul class="index-rows" role="list">
		{#each rows as row (rowKey(row.node))}
			{@const dt = displayTitle(row.node, lang)}
			{@const anchor = row.node.paragraphs[0]}
			{@const label = marker(row.node, lang)}
			{@const isOpen = openAt(rowKey(row.node), row.depth)}
			{@const stacked = STACKED_KINDS.has(row.node.kind) && !!label}
			{#if visible(row)}
				<li
					class={`row kind-${row.node.kind}`}
					class:stacked
					style={`--depth:${row.depth}`}
					id={row.depth === 0 && Number.isFinite(anchor) ? `toc-${anchor}` : undefined}
				>
					<span class="row-mark">
						{@render disclosure(row, dt.title, isOpen)}
						<!-- Text, not a link. Which of the two works a reader wants is
						     the choice the columns are there to offer, and a title that
						     quietly picked one would make the other look like a
						     footnote. -->
						{#if stacked}
							<span class="kind-label">{label}</span>
						{:else}
							<span class="row-title">
								{#if label}<span class="kind-label">{label}</span>{/if}{dt.title}
							</span>
						{/if}
					</span>
					{#if stacked}
						<span class="row-title">{dt.title}</span>
					{/if}

					{#each links(row.node) as link, slot (slot)}
						<span class="work-cell" style={`grid-column:${slot + 2}`}>
							{#if link}
								<!-- `aria-label` as well as `title`: without `scope="col"` to
								     deliver the work's name with the cell, a bare range would
								     be announced as a number belonging to nothing. -->
								<a class="row-link" href={link.href} title={link.title} aria-label={link.title}>
									{link.range}
								</a>
							{:else}
								<span class="no-counterpart" title={noCounterpartLabel}>
									<span aria-hidden="true">—</span>
									<span class="visually-hidden">{noCounterpartLabel}</span>
								</span>
							{/if}
						</span>
					{/each}
				</li>
			{/if}
		{/each}
	</ul>
</div>

<style>
	/* The tracks, defined once on the container and adopted by everything
	   under it. `minmax(0, 1fr)` rather than `1fr`: a grid item's automatic
	   minimum size is its longest word, and a 1fr title track would let one
	   long word widen the column the chips are sized against. The work tracks
	   are `auto`, which for `nowrap` chips is exactly their widest number —
	   the narrowest they can honestly be. */
	.index {
		display: grid;
		grid-template-columns: var(--index-cols);
	}

	/* THE ROWS ARE SUBGRIDS, which is the whole reason this is not a stack of
	   flex rows: each `<li>` is a real box (it can carry a border, a padding
	   and a background) while its contents sit in the ONE set of column tracks
	   the container established. Only inline-axis padding on a subgrid box
	   would shift its tracks out of alignment, so there is none anywhere in
	   this chain — spacing between columns is on the cells themselves. */
	.index-head,
	.index-rows,
	.row {
		display: grid;
		grid-template-columns: subgrid;
		grid-column: 1 / -1;
	}

	.index-rows {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* THE HEADER STAYS. A hundred rows scroll past it, and a column whose name
	   has scrolled away is the anonymous column this index exists to stop
	   being. It clears the reading bar the same way the sidebars do —
	   `--sticky-chrome-height`, never a hand-guessed offset (app.css). */
	.index-head {
		position: sticky;
		top: var(--sticky-chrome-height);
		z-index: 1;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
		padding-block: 0.35rem;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.75rem);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		font-weight: 600;
	}
	.col-head {
		grid-row: 1;
		justify-self: end;
		padding-inline-start: 0.6rem;
	}
	.col-head :global(svg) {
		display: inline-block;
		vertical-align: middle;
	}

	.row {
		align-items: baseline;
		padding-block: 0.3rem;
	}

	/* Depth as an indent on the row's first cell — the one thing the nested
	   lists were still buying, now costing one custom property instead of a
	   formatting context per level. */
	.row-mark {
		grid-column: 1;
		grid-row: 1;
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		min-width: 0;
		padding-inline-start: calc(var(--depth, 0) * 1.35rem);
	}

	/* THE FULL WIDTH, and the point of the grid: its own track row, spanning
	   every column, so the chips constrain the line they share with the
	   numbering and no line below it. Indented past the disclosure arrow
	   (1.15rem) and its gap (0.4rem) to sit under the numbering rather than
	   under the arrow. */
	.stacked > .row-title {
		grid-column: 1 / -1;
		grid-row: 2;
		padding-inline-start: calc(var(--depth, 0) * 1.35rem + 1.55rem);
	}

	.work-cell {
		grid-row: 1;
		justify-self: end;
		padding-inline-start: 0.6rem;
		white-space: nowrap;
	}

	.toggle,
	.toggle-spacer {
		flex: 0 0 1.15rem;
		width: 1.15rem;
		height: 1.15rem;
	}
	.toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		border-radius: 0.2rem;
		transition: transform 120ms ease;
	}
	.toggle:hover,
	.toggle.open {
		color: var(--color-accent);
	}
	.toggle.open {
		transform: rotate(90deg);
	}
	.toggle:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 1px;
	}

	/* `min-width: 0` so a long title shrinks inside its track instead of
	   forcing it wider: a flex item's default `min-width: auto` is its longest
	   word, and the chips are sized against whatever this column leaves. */
	.row-title {
		font-family: var(--font-serif);
		min-width: 0;
		overflow-wrap: break-word;
	}
	/* Sized in `rem`, not `em`: the numbering is chrome and stays one size
	   down the page, where `0.72em` inside a 1.2rem part title made "PART 1"
	   larger than "CH. 1". */
	.kind-label {
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.75rem);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		margin-inline-end: 0.5em;
		white-space: nowrap;
	}
	/* Alone on its line, with the title below it: nothing follows it to be
	   separated from. */
	.stacked .kind-label {
		margin-inline-end: 0;
	}

	.kind-part .row-title,
	.kind-prologue .row-title {
		font-size: 1.2rem;
		font-weight: 700;
	}
	.kind-section .row-title {
		font-size: 1.05rem;
		font-weight: 600;
	}
	.kind-chapter .row-title {
		font-weight: 600;
	}
	.kind-article .row-title {
		font-size: 0.95rem;
	}

	/* A part opens a band of the page. The rule runs the full width rather
	   than under the title alone, which is what tells a reader scanning the
	   two right-hand columns where one part ended — free now that the row is
	   one box instead of three cells. */
	.kind-part,
	.kind-prologue {
		border-top: 1px solid var(--color-border);
		padding-top: 1.1rem;
	}
	.row:first-child {
		border-top: none;
	}

	/* NO BUTTON. A hundred of these down a page is a hundred boxes, and the
	   box was carrying nothing: the column header says which work, the column
	   says where to look, and the number is the whole content. What is left is
	   a link that reads as a link — the site's own link colour and the
	   underline every other link here has — set in tabular numerals so the
	   column reads as a column. */
	.row-link {
		display: inline-block;
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.75rem);
		font-variant-numeric: tabular-nums;
		padding: 0.15rem 0;
		white-space: nowrap;
	}
	a.row-link:hover,
	a.row-link:focus-visible {
		color: var(--color-accent);
	}

	/* A cell this work has no counterpart for. No edition renders one today —
	   all eight Catechisms pair or condense every one of their ~100 outline
	   rows — so it is drawn as a rule rather than sized against a real page:
	   an em dash, with the sentence that explains it in the hover and the
	   accessible name. */
	.no-counterpart {
		color: var(--color-text-muted);
	}

	/* A sub-heading is a row like any other, one level further in — smaller,
	   unbolded, and with its numeral in the running face because the source
	   prints it as part of the heading ("I. The Desire for God") rather than as
	   a division number. */
	.kind-sub .row-title {
		font-size: 0.9rem;
	}
	.kind-sub .kind-label {
		font-family: inherit;
		font-size: inherit;
		text-transform: none;
		letter-spacing: normal;
		color: inherit;
		margin-inline-end: 0.35em;
	}

	/* Narrow screens: the indent step halves so the title keeps enough room to
	   wrap sensibly instead of breaking a word a line. The columns themselves
	   need no rule — `auto` tracks have already given them their minimum. */
	@media (max-width: 34rem) {
		.row-mark {
			padding-inline-start: calc(var(--depth, 0) * 0.7rem);
			gap: 0.2rem;
		}
		.stacked > .row-title {
			padding-inline-start: calc(var(--depth, 0) * 0.7rem + 1.35rem);
		}
		.work-cell,
		.col-head {
			padding-inline-start: 0.35rem;
		}
	}
</style>
