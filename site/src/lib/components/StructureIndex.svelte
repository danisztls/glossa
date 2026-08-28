<script lang="ts">
	/**
	 * Readable outline for the Catechism and its Compendium.
	 *
	 * IT IS A TABLE, and that is the whole design. The page crosses two
	 * variables — a division of the outline, and what each of the two works
	 * has at it — which is what a data table is for. Drawn as one:
	 *
	 *   - THE WORKS ARE NAMED ONCE, in the column headers, instead of on every
	 *     row or nowhere. The chips carried `CCC` and `Comp.` until
	 *     2026-08-28, which is a hundred repetitions of a fact that belongs at
	 *     the top; dropping them without a header left two anonymous columns.
	 *     A header row says it once and keeps saying it, and `<th scope="col">`
	 *     means a screen reader repeats it per cell without anything on the
	 *     link to say so.
	 *   - THE COLUMNS ACTUALLY ALIGN. Nested `<ol>`s could not: each level is
	 *     its own formatting context, so a right-aligned chip aligns against
	 *     that level's box, not the page's. The two columns were visibly
	 *     ragged and no per-row flexbox could straighten them, because the
	 *     rows were never in one layout to begin with. Depth is an indent on
	 *     the title cell now (`--depth`), and `indexRows` does the recursion
	 *     where it can be tested.
	 *   - THE TITLE GETS A COLUMN OF ITS OWN, one width down the whole page,
	 *     so it is no longer squeezed a different amount per row by whatever
	 *     the chips beside it happened to be. That is what the two-line row
	 *     was working around; a column does it without spending a line, and
	 *     the row is one line again.
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
		 * `workHeadings`. A slot may be `undefined` — that work has no
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
		 * visually-hidden text, so a screen reader still delivers it with every
		 * cell through `scope="col"`, and every link under it still names its
		 * work on hover.
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

<div data-link-preview="off">
	<table class="index-table">
		<thead>
			<tr>
				<!-- Named for a screen reader and blank on screen: this is the row
				     header column, and printing "Division" over a column of titles
				     labels the obvious while competing with the two headings that
				     carry information. -->
				<th scope="col" class="col-title">
					<span class="visually-hidden">{t('index.division')}</span>
				</th>
				{#each workColumns as column (column.label)}
					{@const Icon = column.icon}
					<th scope="col" class="col-work" title={column.label}>
						<Icon size={17} aria-hidden="true" />
						<span class="visually-hidden">{column.label}</span>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each rows as row (rowKey(row.node))}
				{@const dt = displayTitle(row.node, lang)}
				{@const anchor = row.node.paragraphs[0]}
				{@const label = marker(row.node, lang)}
				{@const isOpen = openAt(rowKey(row.node), row.depth)}
				{#if visible(row)}
					<tr
						class={`kind-${row.node.kind}`}
						id={row.depth === 0 && Number.isFinite(anchor) ? `toc-${anchor}` : undefined}
					>
						<th scope="row" class="col-title" style={`--depth:${row.depth}`}>
							<div class="title-cell">
								{#if row.expandable}
									<button
										type="button"
										class="toggle"
										class:open={isOpen}
										aria-expanded={isOpen}
										aria-label={`${isOpen ? t('index.hideSubsections') : t('index.showSubsections')}: ${dt.title}`}
										onclick={() => toggle(row.node)}
									>
										<ChevronRight size={14} aria-hidden="true" />
									</button>
								{:else}
									<span class="toggle-spacer" aria-hidden="true"></span>
								{/if}
								<!-- Text, not a link. Which of the two works a reader wants is
							     the choice the columns are there to offer, and a title that
							     quietly picked one would make the other look like a
							     footnote. -->
								<span class="row-title">
									{#if label}<span class="kind-label">{label}</span>{/if}{dt.title}
								</span>
							</div>
						</th>

						{#each links(row.node) as link, slot (slot)}
							<td class="col-work">
								{#if link}
									<!-- No `aria-label`: the column header is the work's name and
								     `scope="col"` already delivers it with the cell, so
								     restating it here would announce the work twice. `title`
								     is the pointer affordance only. -->
									<a class="row-link" href={link.href} title={link.title}>{link.range}</a>
								{:else}
									<span class="no-counterpart" title={noCounterpartLabel}>
										<span aria-hidden="true">—</span>
										<span class="visually-hidden">{noCounterpartLabel}</span>
									</span>
								{/if}
							</td>
						{/each}
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>

<style>
	/* AUTO LAYOUT, deliberately. `fixed` was reserving a share of the row for
	   the work columns whether or not their numbers needed it — on a phone
	   that read as a gutter of dead space in every row while the title beside
	   it wrapped. Auto sizes each work column to its own widest number (they
	   are `nowrap`, so that is exactly their max-content) and hands the whole
	   remainder to the title. The columns still align: they are columns. */
	.index-table {
		width: 100%;
		border-collapse: collapse;
	}

	/* The title column takes whatever the work columns do not. `table-layout:
	   fixed` above is what makes that a promise rather than a negotiation with
	   the longest title on the page. */
	.col-title {
		text-align: start;
		font-weight: inherit;
	}
	/* As narrow as the widest range either work can print. `¶1077–1134` is ten
	   tabular characters; everything else is shorter, and the column has no
	   other job. */
	/* No width: auto layout gives each of these exactly its widest number and
	   nothing more, which is the narrowest they can honestly be. Tighter inline
	   padding than a title cell, because a number needs none of the breathing
	   room a title does. */
	.col-work {
		text-align: end;
		white-space: nowrap;
		padding-inline: 0.2rem;
	}

	/* THE HEADER STAYS. A hundred rows scroll past it, and a column whose name
	   has scrolled away is the anonymous column this table exists to stop
	   being. It clears the reading bar the same way the sidebars do —
	   `--sticky-chrome-height`, never a hand-guessed offset (app.css). */
	thead th :global(svg) {
		display: inline-block;
		vertical-align: middle;
	}

	thead th {
		position: sticky;
		top: var(--sticky-chrome-height);
		z-index: 1;
		background: var(--color-bg);
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.75rem);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		font-weight: 600;
		padding: 0.35rem 0.3rem;
		/* NOT `border-bottom`. Under `border-collapse: collapse` a cell's border
		   is painted by the TABLE, so a sticky header keeps its background and
		   leaves its rule behind — the rows then scroll up through a headline
		   with no floor under it. An inset shadow belongs to the cell and
		   travels with it. */
		box-shadow: inset 0 -1px 0 var(--color-border);
	}

	tbody th,
	tbody td {
		padding-block: 0.3rem;
		padding-inline: 0.3rem;
		vertical-align: baseline;
	}
	/* After the block above, so the narrower inline padding actually wins. */
	.col-work {
		padding-inline: 0.2rem;
	}

	/* Depth as an indent on the title cell — the one thing the nested lists
	   were still buying, now costing one custom property instead of a
	   formatting context per level. */
	.title-cell {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		padding-inline-start: calc(var(--depth, 0) * 1.35rem);
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

	/* `min-width: 0` so the title shrinks to its fixed column instead of
	   forcing it wider: a flex item's default `min-width: auto` is its longest
	   word, and `table-layout: fixed` will not renegotiate the column for it. */
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

	/* THE TOP TWO LEVELS PUT THEIR NUMBERING ON ITS OWN LINE. At 1.2rem and
	   1.05rem the title is the thing being read and "PART 1" is a standing
	   above it, not a word in it; below that the row is small enough that the
	   label reads as part of the line and a break would only add height. */
	.kind-part .kind-label,
	.kind-section .kind-label {
		display: block;
		margin-inline-end: 0;
		margin-block-end: 0.15rem;
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

	/* A part opens a band of the page. The rule runs the full width of the
	   table rather than under the title alone, which is what tells a reader
	   scanning the two right-hand columns where one part ended. */
	.kind-part th,
	.kind-part td,
	.kind-prologue th,
	.kind-prologue td {
		border-top: 1px solid var(--color-border);
		padding-top: 1.1rem;
	}
	tbody tr:first-child th,
	tbody tr:first-child td {
		border-top: none;
	}

	/* NO BUTTON. A hundred of these down a page is a hundred boxes, and the
	   box was carrying nothing: the column header says which work, the fixed
	   column says where to look, and the number is the whole content. What is
	   left is a link that reads as a link — the site's own link colour and the
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

	/* Narrow screens: the indent step halves so the title column keeps enough
	   room to wrap sensibly instead of breaking a word a line. The columns
	   themselves need no rule — auto layout has already given them their
	   minimum. The table stays a table; collapsing it to stacked blocks would
	   lose the alignment it is here for. */
	@media (max-width: 34rem) {
		.title-cell {
			padding-inline-start: calc(var(--depth, 0) * 0.7rem);
			gap: 0.2rem;
		}
		tbody th,
		tbody td {
			padding-inline: 0.15rem;
		}
	}
</style>
