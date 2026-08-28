<script lang="ts">
	/**
	 * Readable, expandable outline for the Catechism and its Compendium.
	 *
	 * NO MAIN LINK. Every row offers both works and offers them alike: the
	 * title is text, and the two chips beside it — `CCC ¶198–421`,
	 * `Comp. Q36–95` — are the links. The two are one outline published at two
	 * lengths (`toc-pairing.ts`), so linking the title to one of them and
	 * badging the other answered a question the reader has not asked yet. It
	 * is the treatment the home page arrived at independently, now shared.
	 *
	 * The same component draws both, at different depths: `maxDepth` stops the
	 * recursion, so the home page shows parts and their sections while
	 * `/catechismus` shows everything down to the 67 articles.
	 */
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { SvelteSet } from 'svelte/reactivity';
	import { displayTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode } from '$lib/types';
	import {
		indexDetailChildren,
		indexOutlineChildren,
		isIndexOutline,
		rangeLabel,
		type RowLink
	} from './indexToc';
	import { marker } from './structureToc';

	interface Props {
		tree: StructureNode[];
		lang: string;
		/**
		 * What each work offers for this row, in a FIXED ORDER so the columns
		 * line up down the page. A slot may be `undefined` — that work has no
		 * counterpart here — and it is drawn as a placeholder rather than
		 * closed up, so the column a reader is scanning stays where it was.
		 */
		links: (node: StructureNode) => (RowLink | undefined)[];
		/** Shown in an empty slot. */
		noCounterpartLabel: string;
		/** Outline levels to render: 1 is the top level alone, 2 adds its
		 *  children. Everything, by default. */
		maxDepth?: number;
		/** Whether a row's unnumbered sub-headings are offered behind a
		 *  disclosure. Off for an overview. */
		subsections?: boolean;
		/** The numbering the rendered tree is in, for those sub-headings'
		 *  ranges. They belong to this tree, not to the companion work. */
		unit?: string;
	}

	let {
		tree,
		lang,
		links,
		noCounterpartLabel,
		maxDepth = Number.POSITIVE_INFINITY,
		subsections = true,
		unit = ''
	}: Props = $props();
	let expanded = $state(new SvelteSet<string>());

	function nodeKey(node: StructureNode): string {
		return `${node.title}|${node.paragraphs.join('-')}`;
	}

	function toggle(node: StructureNode) {
		const key = nodeKey(node);
		if (expanded.has(key)) expanded.delete(key);
		else expanded.add(key);
	}
</script>

{#snippet branch(nodes: StructureNode[], depth: number)}
	<ol class="toc-level">
		{#each nodes as node (nodeKey(node))}
			{@const dt = displayTitle(node, lang)}
			{@const anchor = node.paragraphs[0]}
			{@const details = subsections ? indexDetailChildren(node) : []}
			{@const kids = depth + 1 < maxDepth ? indexOutlineChildren(node) : []}
			{@const label = marker(node, lang)}
			{@const isOpen = expanded.has(nodeKey(node))}
			<li
				class={`kind-${node.kind}`}
				id={depth === 0 && Number.isFinite(anchor) ? `toc-${anchor}` : undefined}
			>
				<div class="row">
					{#if details.length > 0}
						<button
							type="button"
							class="toggle"
							class:open={isOpen}
							aria-expanded={isOpen}
							aria-label={`${isOpen ? t('index.hideSubsections') : t('index.showSubsections')}: ${dt.title}`}
							onclick={() => toggle(node)}
						>
							<ChevronRight size={14} aria-hidden="true" />
						</button>
					{:else}
						<span class="toggle-spacer" aria-hidden="true"></span>
					{/if}

					<!-- Text, not a link. Which of the two works a reader wants is the
					     choice the chips are there to offer, and a title that quietly
					     picked one for them would make the other look like a footnote. -->
					<span class="row-title">
						{#if label}<span class="kind-label">{label}</span>{/if}
						{dt.title}
					</span>

					<div class="row-links">
						{#each links(node) as link, slot (slot)}
							{#if link}
								<a class="row-link" href={link.href} title={link.title} aria-label={link.title}>
									<span class="link-work">{link.work}</span>
									<span class="link-range">{link.range}</span>
								</a>
							{:else}
								<span class="row-link empty">{noCounterpartLabel}</span>
							{/if}
						{/each}
					</div>
				</div>

				{#if details.length > 0 && isOpen}
					<ul class="subs">
						{#each details as sub (nodeKey(sub))}
							{@const sdt = displayTitle(sub, lang)}
							<!-- Context inside the row above, and deliberately not a link:
							     a sub-heading has no address of its own, so the link it used
							     to carry went exactly where the row's own did. The row now
							     offers both works there. -->
							<li>
								<span class="sub-title">
									{#if sdt.ordinal}<span class="kind-label">{sdt.ordinal}</span>{/if}
									{sdt.title}
								</span>
								<span class="link-range">{rangeLabel(sub, unit)}</span>
							</li>
						{/each}
					</ul>
				{/if}

				{#if kids.length > 0}
					{@render branch(kids, depth + 1)}
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<div data-link-preview="off">
	{@render branch(tree.filter(isIndexOutline), 0)}
</div>

<style>
	.toc-level {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.toc-level .toc-level {
		margin-inline-start: 0.85rem;
		padding-inline-start: 0.9rem;
		border-inline-start: 1px solid var(--color-border);
	}
	.row {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		padding: 0.3rem 0;
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
	/* The two works, as chips — the visual language the home page's own
	   version of this table arrived at, and the reason it reads as a choice
	   rather than as a link with an annotation after it. Both slots get the
	   identical treatment, which is the whole point. */
	.row-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-inline-start: auto;
		flex-shrink: 0;
	}
	.row-link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3rem;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		text-decoration: none;
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		padding: 0.1rem 0.45rem;
		white-space: nowrap;
	}
	a.row-link:hover,
	a.row-link:focus-visible {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	/* A row this work has no counterpart for. Dashed and muted, and still
	   occupying its slot, so the column above and below it does not shift. */
	.row-link.empty {
		border-style: dashed;
		color: var(--color-text-muted);
	}
	.link-range {
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
	}
	a.row-link:hover .link-range,
	a.row-link:focus-visible .link-range {
		color: inherit;
	}
	.row-title {
		font-family: var(--font-serif);
	}
	.sub-title {
		font-family: var(--font-serif);
	}
	:global(.toc-level) > .kind-part > .row,
	:global(.toc-level) > .kind-prologue > .row {
		border-bottom: 1px solid var(--color-border);
		margin-top: 1.25rem;
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
	.kind-label {
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.72em);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		margin-inline-end: 0.45em;
		white-space: nowrap;
	}
	.subs {
		list-style: none;
		margin: 0.1rem 0 0.5rem 1.5rem;
		padding-inline-start: 0.9rem;
		border-inline-start: 1px solid var(--color-border);
		font-size: 0.9rem;
	}
	.subs li {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.2rem 0;
	}

	/* Mobile: the chips wrap onto their own line under a long title rather
	   than squeezing, and stack full-width so the tap target stays a
	   comfortable size instead of shrinking to fit two per row. */
	@media (max-width: 30rem) {
		.row {
			flex-wrap: wrap;
		}
		.row-links {
			flex-basis: 100%;
			margin-inline-start: 1.55rem;
		}
		.row-link {
			flex: 1 1 auto;
			justify-content: space-between;
		}
	}
</style>
