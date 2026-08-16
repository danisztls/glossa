<script lang="ts">
	import { flattenCccStructure, getWork } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';

	// The TOC is one static tree per language baked into the client bundle
	// (see corpus.ts's module docblock — `import.meta.glob(..., { eager:
	// true })` inlines every language at build time), so there is no per-page
	// `load` to embed data through here: reading `content.langFor` directly
	// keeps the page in sync with the reader's content-language preference
	// without a route param or reload. EN and PT structure trees genuinely
	// diverge in places (docs/decisions.md language symmetry principle) —
	// `rows` is always that language's own real tree, not a forced-symmetric
	// merge of the two.
	const lang = $derived(content.langFor('catechism'));
	const rows = $derived(flattenCccStructure(lang));
	const work = $derived(getWork(`ccc.${lang}`));
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
			{@const dt = displayTitle(node, lang)}
			<li style={`--depth: ${depth}`} class={`kind-${node.kind}`}>
				{#if hasAnchor}
					<a href={`/ccc/${node.paragraphs[0]}`}>
						{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
						{dt.title}
					</a>
				{:else}
					<!-- Corpus defect (see site/README.md): this node's `paragraphs[0]`
					     is null in the source data, not the schema-required number --
					     unnumbered content with nothing to link to. -->
					<span class="unlinked" title="No paragraph number in this corpus">
						{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
						{dt.title}
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
