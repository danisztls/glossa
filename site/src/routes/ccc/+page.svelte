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
	import { getCccStructure, getWork } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
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
			<li class={`kind-${node.kind}`}>
				<div class="row">
					{#if Number.isFinite(anchor)}
						<a class="row-title" href={`/ccc/${anchor}`}>
							{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
							{dt.title}
						</a>
					{:else}
						<!-- Null bounds mean "unaddressable" in the corpus schema
						     (docs/corpus-schema.md) — there is genuinely no paragraph
						     number to link to, so this stays text. -->
						<span class="row-title unlinked" title={t('ccc.noParagraphNumber')}>
							{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
							{dt.title}
						</span>
					{/if}
					<span class="range">{rangeLabel(node)}</span>
				</div>

				{#if details.length > 0}
					<details class="subs">
						<summary>{details.length}&nbsp;{t('ccc.subsections')}</summary>
						<ul>
							{#each details as sub (sub.title + sub.paragraphs.join('-'))}
								{@const sdt = displayTitle(sub, lang)}
								<li>
									<a href={`/ccc/${sub.paragraphs[0]}`}>
										{#if sdt.ordinal}<span class="ordinal">{sdt.ordinal}</span>{/if}
										{sdt.title}
									</a>
									<span class="range">{rangeLabel(sub)}</span>
								</li>
							{/each}
						</ul>
					</details>
				{/if}

				{#if kids.length > 0}
					{@render branch(kids, depth + 1)}
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<div class="content-column">
	<h1>{t('ccc.tableOfContents')}</h1>
	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	{@render branch(tree.filter(isOutline), 0)}
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
		justify-content: space-between;
		gap: 1rem;
		padding: 0.3rem 0;
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

	.ordinal {
		color: var(--color-text-muted);
		margin-right: 0.35em;
	}

	.range {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.subs {
		margin: 0 0 0.35rem 0.2rem;
		font-size: 0.9rem;
	}

	.subs summary {
		cursor: pointer;
		color: var(--color-text-muted);
		font-size: 0.78rem;
		list-style-position: outside;
	}

	.subs summary:hover {
		color: var(--color-accent);
	}

	.subs ul {
		list-style: none;
		margin: 0.35rem 0 0;
		padding-inline-start: 0.9rem;
		border-inline-start: 1px solid var(--color-border);
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
