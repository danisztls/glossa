<script lang="ts">
	/**
	 * Compendium table of contents.
	 *
	 * Unlike `ccc/+page.svelte` (still hardcoded to a single language as of
	 * this writing — see that route's TODO), this reads the reader's current
	 * content language reactively via `content.langFor('compendium')`
	 * (docs/decisions.md #1/#2: content language follows UI language, with an
	 * explicit edition override): the tree, its titles, and every link
	 * recompute when the reader switches language, without a page reload —
	 * there's nothing route-param-driven to re-derive here, so no `+page.ts`
	 * is needed.
	 */
	import { flattenCompendiumStructure, getWork } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { displayTitle } from '$lib/titles';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';

	let lang = $derived(content.langFor('compendium'));
	let rows = $derived(flattenCompendiumStructure(lang));
	let work = $derived(getWork(`compendium.${lang}`));
</script>

<svelte:head>
	<title>{t('compendium.tableOfContents')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('compendium.landing.title')}</h1>
	<p class="tagline">{t('compendium.landing.tagline')}</p>
	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	<h2 class="toc-heading">{t('compendium.tableOfContents')}</h2>
	<ol class="toc">
		{#each rows as { node, depth } (node.title + node.paragraphs.join('-'))}
			{@const hasAnchor = Number.isFinite(node.paragraphs[0])}
			{@const dt = displayTitle(node, lang)}
			<li style={`--depth: ${depth}`} class={`kind-${node.kind}`}>
				{#if hasAnchor}
					<a href={`/compendium/${node.paragraphs[0]}`}>
						{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
						{dt.title}
					</a>
				{:else}
					<!-- Same null-bound convention as the CCC structure tree
					     (docs/corpus-schema.md, "amended 2026-08-14"): unnumbered
					     content the structure knows about but no question number
					     addresses -- nothing to link to. -->
					<span class="unlinked" title="No question number in this corpus">
						{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
						{dt.title}
					</span>
				{/if}
				<span class="range">Q{node.paragraphs[0] ?? '?'}–{node.paragraphs[1] ?? '?'}</span>
			</li>
		{/each}
	</ol>
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
		margin-top: 0;
	}

	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.toc-heading {
		font-size: 1.1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.toc {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.toc li {
		padding: 0.4rem 0 0.4rem calc(var(--depth) * 1.25rem);
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.toc a {
		text-decoration: none;
		font-family: var(--font-serif);
	}

	.toc .unlinked {
		font-family: var(--font-serif);
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	.kind-part a,
	.kind-part .unlinked,
	.kind-prologue a,
	.kind-prologue .unlinked {
		font-size: 1.15rem;
		font-weight: 700;
	}

	.kind-section a,
	.kind-section .unlinked {
		font-size: 1.05rem;
		font-weight: 600;
	}

	.kind-in-brief a,
	.kind-in-brief .unlinked {
		font-style: italic;
		color: var(--color-text-muted);
	}

	.ordinal {
		color: var(--color-text-muted);
		margin-right: 0.35em;
	}

	.range {
		flex-shrink: 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}
</style>
