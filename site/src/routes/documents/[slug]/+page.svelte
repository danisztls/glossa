<script lang="ts">
	/**
	 * One document's landing page: title/kind/promulgator/date, copyright
	 * notice, and its table of contents — the document-route analogue of
	 * `ccc/+page.svelte`/`compendium/+page.svelte`. Reactive, not `+page.ts`-
	 * loaded, for the same reason those two are: `structure.json` and the
	 * manifest are both INDEX tier, already eager-inlined for every language
	 * (`corpus.ts`'s "Documents" section), so there's nothing to fetch —
	 * `content.documentLangFor(slug)` alone decides which language's copy to
	 * show, and recomputes with no reload when the reader switches it via
	 * `EditionMenu`.
	 */
	import {
		flattenDocumentStructure,
		getAdjacentDocumentSectionNumber,
		getDocumentGroup,
		unpublishedInfo
	} from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import UnpublishedNotice from '$lib/components/UnpublishedNotice.svelte';
	import { displayTitle } from '$lib/titles';
	import { documentKindLabel } from '$lib/document-labels';
	import { formatPromulgated } from '$lib/dates';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const group = $derived(getDocumentGroup(data.slug));
	const lang = $derived(content.documentLangFor(data.slug));
	// Falls back to whichever language IS present if the preferred one isn't
	// (a v1 EN/PT asymmetry) rather than rendering a blank page — same
	// "degrade, don't 404 a page with real content" posture as `ccc/[n]` and
	// `compendium/[n]`.
	const manifest = $derived(group?.manifests[lang] ?? Object.values(group?.manifests ?? {})[0]);
	const rows = $derived(manifest ? flattenDocumentStructure(manifest.id) : []);

	// Some in-progress corpus entries (the encyclical sweep this route was
	// built ahead of, docs/research/vatican-documents.md §5) ship a
	// `structure.json` that's a single title-only node with no numbered
	// anchor anywhere (a scraper gap, not a genuinely unnumbered document —
	// see corpus-schema.md's "a document with no internal headings gets a
	// trivial single-node tree SPANNING ITS FULL SECTION RANGE", which this
	// isn't). Rather than strand a document that HAS real section text
	// behind a table of contents with nothing to click, fall back to a
	// direct "start reading" link to its first section whenever the TOC
	// itself offers no anchor at all — `getAdjacentDocumentSectionNumber`
	// (already exported for prev/next nav) doubles as "first section number"
	// when asked for whatever comes after 0, so this needs no new accessor.
	// Takedown state for the edition actually on screen. Checked per WORK, not
	// per slug: a request may concern the English edition and not the
	// Portuguese one, so a reader whose language edition is still published
	// should still see it (see site/unpublished.json).
	const takedown = $derived(manifest ? unpublishedInfo(manifest.id) : undefined);

	const hasTocAnchor = $derived(rows.some(({ node }) => Number.isFinite(node.paragraphs[0])));
	const firstSectionN = $derived(
		!hasTocAnchor && manifest ? getAdjacentDocumentSectionNumber(manifest.id, 0, 'next') : undefined
	);

	// Whether this edition has ANY readable section at all — `hasTocAnchor`
	// covers the normal case (a real structure tree with numbered anchors);
	// `firstSectionN` covers the trivial-single-node fallback above (no TOC
	// anchor, but a first section still exists). A manifest with neither
	// (nothing built yet, distinct from `takedown`'s "built then withheld")
	// has nowhere for a full-document link to point, so the link is gated on
	// this rather than on `!takedown` alone — `strict: true` prerendering
	// would otherwise fail the build the moment such a document appeared.
	const hasAnySection = $derived(hasTocAnchor || firstSectionN !== undefined);
</script>

<svelte:head>
	<title>{manifest?.title ?? data.slug} — {t('home.title')}</title>
</svelte:head>

{#if manifest}
	<div class="content-column">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/documents">{t('nav.magisterium')}</a>
		</nav>

		<h1>{manifest.title}</h1>
		<p class="subtitle">
			<span class="doc-kind">{documentKindLabel(manifest.document_kind)}</span>
			<span class="sep">·</span>
			{manifest.pontiff_or_council}
			<span class="sep">·</span>
			<!-- Bare date, no "Promulgated" label — matching the /documents list.
			     In a subtitle already reading "Encyclical · Francis · <date>",
			     the only date a document has needs no naming. -->
			<time class="promulgated" datetime={manifest.promulgated}>
				{formatPromulgated(manifest.promulgated, lang)}
			</time>
		</p>
		{#if takedown}
			<!-- Replaces the table of contents and the reading entry point
			     entirely. The structure tree is not withheld from the UI here —
			     it was never built (sync-corpus.mjs), so `rows` is empty and
			     there is nothing to hide. -->
			<UnpublishedNotice {manifest} info={takedown} />
		{:else}
			<p class="copyright-notice"><CopyrightNotice {manifest} /></p>
		{/if}

		{#if !takedown && firstSectionN !== undefined}
			<p class="start-reading">
				<a href={`/documents/${data.slug}/${firstSectionN}`}>{t('document.startReading')} &rarr;</a>
			</p>
		{/if}

		{#if !takedown && hasAnySection}
			<!-- The continuous-reading entry point (`documents/[slug]/read/
			     +page.svelte`), alongside rather than instead of "start reading":
			     that link is for a reader who wants section 1, this one is for a
			     reader who wants the whole thing on one page from wherever it
			     starts. Gated on `hasAnySection`, not just `!takedown` — a
			     document with a real structure tree but nothing built for
			     `sections.json` yet would otherwise link to a route this corpus
			     can't actually serve, failing the `strict: true` prerender build. -->
			<p class="read-full-document">
				<a href={`/documents/${data.slug}/read`}>{t('document.readFullDocument')} &rarr;</a>
			</p>
		{/if}

		{#if !takedown}
			<h2 class="toc-heading">{t('document.tableOfContents')}</h2>
			<ol class="toc">
				{#each rows as { node, depth } (node.title + node.paragraphs.join('-'))}
					{@const hasAnchor = Number.isFinite(node.paragraphs[0])}
					{@const dt = displayTitle(node, lang)}
					<li style={`--depth: ${depth}`} class={`kind-${node.kind}`}>
						{#if hasAnchor}
							<a href={`/documents/${data.slug}/${node.paragraphs[0]}`}>
								{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
								{dt.title}
							</a>
						{:else}
							<!-- Same null-bound convention as the CCC/Compendium structure
						     trees (docs/corpus-schema.md, "amended 2026-08-14"):
						     unnumbered front/back matter the structure knows about but
						     no section number addresses -- nothing to link to. -->
							<span class="unlinked" title="No section number in this corpus">
								{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
								{dt.title}
							</span>
						{/if}
						{#if hasAnchor}
							<span class="range"
								>§{node.paragraphs[0]}{node.paragraphs[1] !== node.paragraphs[0]
									? `–${node.paragraphs[1]}`
									: ''}</span
							>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}
	</div>
{/if}

<style>
	.breadcrumb {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.breadcrumb a {
		text-decoration: none;
		color: var(--color-text-muted);
	}

	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.4rem;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		margin: 0 0 0.5rem;
	}

	.subtitle .sep {
		margin: 0 0.4em;
	}

	.promulgated {
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 0.85em;
	}

	.doc-kind {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 0.25rem;
		padding: 0.1rem 0.4rem;
	}

	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.start-reading {
		margin: 0 0 1.5rem;
	}

	.start-reading a {
		font-family: var(--font-serif);
		font-size: 1.05rem;
	}

	/* The more prominent of the two entry points: bordered like `ccc/[n]`'s
	   `.read-chapter` callout, since a reader choosing between "start
	   reading" (plain text link, section 1 only) and "read the full
	   document" (everything, one page) should see the second as the bigger
	   commitment it visually is, not a smaller sibling of the first. */
	.read-full-document {
		margin: 0 0 1.5rem;
		padding: 0.85rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-bg-elevated);
	}

	.read-full-document a {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		text-decoration: none;
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

	.kind-chapter a,
	.kind-chapter .unlinked {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.kind-sub a,
	.kind-sub .unlinked {
		font-size: 1rem;
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
