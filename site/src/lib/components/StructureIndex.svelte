<script lang="ts">
	/**
	 * Readable, expandable outline for the Catechism and Compendium indexes.
	 * The two works share the same structure schema, so their landing pages
	 * should share the same navigation treatment as well.
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
		type SiblingLink
	} from './indexToc';
	import { marker } from './structureToc';

	interface Props {
		tree: StructureNode[];
		lang: string;
		/** A row's address, from the caller's `hrefFor` — never a base path to
		 *  concatenate. See `structureToc.ts`'s `rowHref` for why. */
		href: (n: number) => string;
		unit: string;
		noAddressLabel: string;
		/**
		 * This row's counterpart in the companion work, when the two outlines
		 * pair here. The Catechism and the Compendium are one outline
		 * published at two lengths (`toc-pairing.ts`), so a row can offer both
		 * — but only the caller knows which work it is showing, so the
		 * resolver is injected rather than reached for from here.
		 *
		 * Optional, and absent for every other caller: a work with no
		 * companion passes nothing and the column does not appear.
		 */
		sibling?: (node: StructureNode) => SiblingLink | undefined;
	}

	let { tree, lang, href, unit, noAddressLabel, sibling }: Props = $props();
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
			{@const details = indexDetailChildren(node)}
			{@const kids = indexOutlineChildren(node)}
			{@const label = marker(node, lang)}
			{@const isOpen = expanded.has(nodeKey(node))}
			{@const other = sibling?.(node)}
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

					{#if Number.isFinite(anchor)}
						<a class="row-title" href={href(anchor as number)}>
							{#if label}<span class="kind-label">{label}</span>{/if}
							{dt.title}
						</a>
					{:else}
						<span class="row-title unlinked" title={noAddressLabel}>
							{#if label}<span class="kind-label">{label}</span>{/if}
							{dt.title}
						</span>
					{/if}
					<span class="range">{rangeLabel(node, unit)}</span>
					<!-- After the range, not before it: the row's own address is what a
					     reader scanning this index is looking for, and the companion work
					     is the second question they ask. -->
					{#if other}
						<a class="sibling" href={other.href} title={other.title} aria-label={other.title}>
							{other.label}
						</a>
					{/if}
				</div>

				{#if details.length > 0 && isOpen}
					<ul class="subs">
						{#each details as sub (nodeKey(sub))}
							{@const sdt = displayTitle(sub, lang)}
							{@const subAnchor = sub.paragraphs[0]}
							<!-- A subheading is context inside its parent reading unit. Keep
							     its range visible, but send the reader to the enclosing
							     chapter/section rather than back to one individual item. -->
							{@const destination = Number.isFinite(anchor) ? anchor : subAnchor}
							<li>
								{#if Number.isFinite(destination)}
									<a href={href(destination as number)}>
										{#if sdt.ordinal}<span class="kind-label">{sdt.ordinal}</span>{/if}
										{sdt.title}
									</a>
								{:else}
									<span class="unlinked" title={noAddressLabel}>
										{#if sdt.ordinal}<span class="kind-label">{sdt.ordinal}</span>{/if}
										{sdt.title}
									</span>
								{/if}
								<span class="range">{rangeLabel(sub, unit)}</span>
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
	/* Quiet by default and only accented on hover: it sits at the end of every
	   row, so styling it as a full link would put a second column of blue down
	   the page and compete with the titles, which are what the index is for. */
	.sibling {
		flex-shrink: 0;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		color: var(--color-text-muted);
		text-decoration: none;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		border-inline-start: 1px solid var(--color-border);
		padding-inline-start: 0.5rem;
	}
	.sibling:hover,
	.sibling:focus-visible {
		color: var(--color-accent);
		text-decoration: underline;
	}
	.range {
		margin-inline-start: auto;
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}
	.row-title {
		text-decoration: none;
		font-family: var(--font-serif);
	}
	.unlinked {
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
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
	.subs a {
		text-decoration: none;
	}
</style>
