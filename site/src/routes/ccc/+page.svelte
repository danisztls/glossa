<script lang="ts">
	/**
	 * The Catechism's table of contents.
	 *
	 * WHY THIS IS A TREE AND NOT A FLAT LIST. It used to render
	 * `flattenCccStructure` directly: every node, at every depth, as one
	 * bordered row. That is 396 rows in English and 480 in Portuguese, of
	 * which 255 sit at depth 4 — a table of contents whose majority is
	 * sub-headings is an index dump, and the reader has to scroll past all of
	 * it to find the four Parts the book is actually organized into. Three
	 * things changed:
	 *
	 *   1. Only the OUTLINE kinds (prologue/part/section/chapter/article) are
	 *      rendered as rows. That is what the printed Catechism's own table of
	 *      contents lists, and it takes English from 396 rows to 99.
	 *   2. `sub` nodes are not discarded — they'd be real navigation lost —
	 *      but tucked into a per-parent disclosure, so the reader opts into
	 *      them for one article at a time instead of receiving all 238 at once.
	 *   3. `in-brief` nodes are dropped outright. All 59 of them are titled
	 *      "IN BRIEF" (81 in Portuguese, titled "Resumindo:") — they are
	 *      summary blocks inside a chapter, not destinations, and 59 identical
	 *      rows is the single largest source of noise in the old list. They
	 *      remain reachable by reading the chapter, and keep their own styling
	 *      in the chapter view.
	 *
	 * Nesting is expressed with real nested `<ol>`s rather than a `--depth`
	 * padding variable on a flat list, so the hierarchy is in the document
	 * structure where a screen reader can use it, not only in the left margin.
	 */
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { SvelteSet } from 'svelte/reactivity';
	import { getCccStructure, getWork } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import { content } from '$lib/content.svelte';
	import { displayTitle, kindOrdinalLabel } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { CccNode } from '$lib/types';

	const lang = $derived(content.langFor('catechism'));
	const tree = $derived(getCccStructure(lang));
	const work = $derived(getWork(`ccc.${lang}`));

	/** Kinds that earn a row of their own — see the docblock. */
	const OUTLINE_KINDS = new Set<CccNode['kind']>([
		'prologue',
		'part',
		'section',
		'chapter',
		'article'
	]);

	function isOutline(node: CccNode): boolean {
		return OUTLINE_KINDS.has(node.kind);
	}

	const sidebarItems = $derived(
		tree
			.filter((node) => isOutline(node) && Number.isFinite(node.paragraphs[0]))
			.map((node) => ({
				href: `#toc-${node.paragraphs[0]}`,
				label: `${kindOrdinalLabel(node, lang) ?? ''} ${displayTitle(node, lang).title}`.trim()
			}))
	);

	/** Children that get their own row. */
	function outlineChildren(node: CccNode): CccNode[] {
		return (node.children ?? []).filter(isOutline);
	}

	/**
	 * Children that go behind the disclosure: `sub` nodes with somewhere to
	 * link. `in-brief` is excluded here as well as from the rows — dropping it
	 * from one and not the other would just move the 59 identical entries
	 * rather than remove them.
	 */
	function detailChildren(node: CccNode): CccNode[] {
		return (node.children ?? []).filter(
			(child) => child.kind === 'sub' && Number.isFinite(child.paragraphs[0])
		);
	}

	function rangeLabel(node: CccNode): string {
		const [from, to] = node.paragraphs;
		if (!Number.isFinite(from)) return '';
		return from === to ? `¶${from}` : `¶${from}–${to ?? '?'}`;
	}

	/**
	 * Which rows have their subsections showing.
	 *
	 * Replaces the `<details>`/"N subsections" summary line each row used to
	 * carry. That line was itself a row — so a tree built to cut 396 rows down
	 * to 99 was quietly adding one back for every article that had subsections,
	 * and each said nothing but a count. The disclosure now lives in a button
	 * in the row's own left gutter, where it costs no vertical space at all and
	 * reads as part of the row rather than as an extra entry beneath it.
	 *
	 * Keyed by the same identity the `{#each}` uses, so two nodes that happen
	 * to share a title (the CCC has several "In Brief"-adjacent repeats) can't
	 * toggle each other.
	 */
	let expanded = $state(new SvelteSet<string>());

	function nodeKey(node: CccNode): string {
		return `${node.title}|${node.paragraphs.join('-')}`;
	}

	function toggle(node: CccNode) {
		const key = nodeKey(node);
		if (expanded.has(key)) expanded.delete(key);
		else expanded.add(key);
	}
</script>

<svelte:head>
	<title>{t('ccc.tableOfContents')} — {t('home.title')}</title>
</svelte:head>

<!--
	Recursive: an outline node renders its own row, its `sub` children behind
	a disclosure, then its outline children as a nested list. Svelte snippets
	may call themselves, so the whole tree is one definition rather than a
	depth-limited chain of components.
-->
{#snippet branch(nodes: CccNode[], depth: number)}
	<ol class="toc-level" style={`--depth: ${depth}`}>
		{#each nodes as node (node.title + node.paragraphs.join('-'))}
			{@const dt = displayTitle(node, lang)}
			{@const anchor = node.paragraphs[0]}
			{@const details = detailChildren(node)}
			{@const kids = outlineChildren(node)}
			{@const label = kindOrdinalLabel(node, lang)}
			{@const isOpen = expanded.has(nodeKey(node))}
			<li
				class={`kind-${node.kind}`}
				id={depth === 0 && Number.isFinite(anchor) ? `toc-${anchor}` : undefined}
			>
				<div class="row">
					<!--
						The gutter always occupies its width, whether or not this row
						has a toggle, so every title in the tree starts at the same
						x-position. Rows that jog left and right depending on whether
						they happen to have subsections are harder to scan than the
						empty space costs.
					-->
					{#if details.length > 0}
						<button
							type="button"
							class="toggle"
							class:open={isOpen}
							aria-expanded={isOpen}
							aria-label={`${isOpen ? t('ccc.hideSubsections') : t('ccc.showSubsections')}: ${dt.title}`}
							onclick={() => toggle(node)}
						>
							<ChevronRight size={14} aria-hidden="true" />
						</button>
					{:else}
						<span class="toggle-spacer" aria-hidden="true"></span>
					{/if}

					{#if Number.isFinite(anchor)}
						<a class="row-title" href={`/catechismus/${anchor}`}>
							<!-- "Ch. 3" rather than a bare "3." — see kindOrdinalLabel's
							     docblock for why four levels of identical ordinals was
							     the problem worth spending a few characters on. -->
							{#if label}<span class="kind-label">{label}</span>{/if}
							{dt.title}
						</a>
					{:else}
						<!-- Null bounds mean "unaddressable" in the corpus schema
						     (docs/corpus-schema.md) — there is genuinely no paragraph
						     number to link to, so this stays text. -->
						<span class="row-title unlinked" title={t('ccc.noParagraphNumber')}>
							{#if label}<span class="kind-label">{label}</span>{/if}
							{dt.title}
						</span>
					{/if}
					<span class="range">{rangeLabel(node)}</span>
				</div>

				{#if details.length > 0 && isOpen}
					<ul class="subs">
						{#each details as sub (sub.title + sub.paragraphs.join('-'))}
							{@const sdt = displayTitle(sub, lang)}
							<li>
								<a href={`/catechismus/${sub.paragraphs[0]}`}>
									<!-- `sub` nodes carry roman-numeral list markers in their
									     own titles ("I. The Desire for God"), which is why they
									     get no kind label: they already number themselves. -->
									{#if sdt.ordinal}<span class="kind-label">{sdt.ordinal}</span>{/if}
									{sdt.title}
								</a>
								<span class="range">{rangeLabel(sub)}</span>
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

<div class="reading-layout">
	<div class="content-column">
		<h1>{t('ccc.tableOfContents')}</h1>
		{#if work}
			<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
		{/if}

		{@render branch(tree.filter(isOutline), 0)}
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('ccc.tableOfContents')} items={sidebarItems} />
	</aside>
</div>

<style>
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.toc-level {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* Nested levels indent by a fixed step and pick up a hairline rule, so the
	   hierarchy is legible without every row carrying a full-width border the
	   way the flat list did. */
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

	/* Both are 1.15rem wide so titles line up whether or not a row can be
	   expanded — see the markup comment on the gutter. */
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
		/* Rotation rather than two icons: the transition makes the open/closed
		   relationship visible instead of leaving the reader to notice that one
		   glyph swapped for another. */
		transition: transform 120ms ease;
	}

	.toggle:hover {
		color: var(--color-accent);
	}

	.toggle.open {
		transform: rotate(90deg);
		color: var(--color-accent);
	}

	.toggle:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 1px;
	}

	/* Pushes the paragraph range to the row's end now that `.row` no longer
	   uses space-between (the toggle gutter took the first slot). */
	.range {
		margin-inline-start: auto;
	}

	.row-title {
		text-decoration: none;
		font-family: var(--font-serif);
	}

	.unlinked {
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	/* Only the top two levels get a separating rule; below that the indent
	   guide carries the structure and rules would reintroduce the stripes. */
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

	/* Set in the sans face at a smaller size so it reads as a label attached
	   to the title rather than as the title's first word. */
	.kind-label {
		font-family: var(--font-sans);
		font-size: 0.72em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		margin-right: 0.45em;
		white-space: nowrap;
	}

	.range {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* Indented to sit under the parent title, past the toggle gutter, so the
	   subsections visibly belong to the row whose button revealed them. */
	.subs {
		list-style: none;
		margin: 0.1rem 0 0.5rem;
		padding-inline-start: 0.9rem;
		margin-inline-start: 1.5rem;
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
