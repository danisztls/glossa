<script lang="ts">
	import { flattenCccStructure, getWork } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { t } from '$lib/i18n.svelte';

	const LANG = 'en';
	const rows = flattenCccStructure(LANG);
	const work = getWork(`ccc.${LANG}`);
</script>

<svelte:head>
	<title>{t('ccc.tableOfContents')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('ccc.tableOfContents')}</h1>
	{#if work}
		<p class="copyright-notice">{copyrightLabel(work)}</p>
	{/if}

	<ol class="toc">
		{#each rows as { node, depth } (node.title + node.paragraphs.join('-'))}
			{@const hasAnchor = Number.isFinite(node.paragraphs[0])}
			<li style={`--depth: ${depth}`} class={`kind-${node.kind}`}>
				{#if hasAnchor}
					<a href={`/ccc/${node.paragraphs[0]}`}>
						{#if node.n}<span class="ordinal">{node.n}.</span>{/if}
						{node.title}
					</a>
				{:else}
					<!-- Corpus defect (see site/README.md): this node's `paragraphs[0]`
					     is null in the source data, not the schema-required number --
					     unnumbered content with nothing to link to. -->
					<span class="unlinked" title="No paragraph number in this corpus">
						{#if node.n}<span class="ordinal">{node.n}.</span>{/if}
						{node.title}
					</span>
				{/if}
				<span class="range">§{node.paragraphs[0] ?? '?'}–{node.paragraphs[1] ?? '?'}</span>
			</li>
		{/each}
	</ol>
</div>

<style>
	.copyright-notice {
		margin: 0 0 1rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
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
