<script lang="ts">
	import { flattenCccStructure } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';

	const LANG = 'en';
	const rows = flattenCccStructure(LANG);
</script>

<svelte:head>
	<title>{t('ccc.tableOfContents')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('ccc.tableOfContents')}</h1>

	<ol class="toc">
		{#each rows as { node, depth } (node.title + node.paragraphs.join('-'))}
			<li style={`--depth: ${depth}`} class={`kind-${node.kind}`}>
				<a href={`/ccc/${node.paragraphs[0]}`}>
					{#if node.n}<span class="ordinal">{node.n}.</span>{/if}
					{node.title}
				</a>
				<span class="range">§{node.paragraphs[0]}–{node.paragraphs[1]}</span>
			</li>
		{/each}
	</ol>
</div>

<style>
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

	.kind-part a,
	.kind-prologue a {
		font-size: 1.15rem;
		font-weight: 700;
	}

	.kind-section a {
		font-size: 1.05rem;
		font-weight: 600;
	}

	.kind-in-brief a {
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
