<script lang="ts">
	/**
	 * The Magisterium library — every document in the corpus (docs/corpus-
	 * schema.md §Documents), grouped for growth: 16 Vatican II texts today,
	 * with several hundred encyclicals already landing behind them
	 * (docs/research/vatican-documents.md §5). A flat 16-row list would have
	 * been fine; a flat ~450-row list would not, so this groups by
	 * `pontiff_or_council` from day one rather than adding grouping later as
	 * an afterthought once the list is already unreadable.
	 *
	 * Like `ccc/+page.svelte`/`compendium/+page.svelte`, this reads content
	 * reactively (`content.documentLangFor`) rather than through a `+page.ts`
	 * load — the registry (`listDocuments()`) is index-tier and already
	 * eager-inlined, so there's nothing to fetch here.
	 */
	import { listDocuments } from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import { copyrightLabel } from '$lib/copyright';
	import { documentKindLabel } from '$lib/document-labels';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentManifest } from '$lib/types';

	interface Row {
		slug: string;
		manifest: DocumentManifest;
	}

	// One row per document SLUG, in the reader's effective language for that
	// document — not one row per language edition. Two editions per document
	// showing up as two rows here would double this list today and make it
	// unreadable once the ~430 encyclicals land, the same "one entry per
	// work" principle the home page's Library section applies (see that
	// route's module docblock). The per-document language override
	// (`EditionMenu` on `/documents/{slug}`) is what lets a reader pick a
	// different edition once they're actually reading one; this list just
	// shows their current default.
	const rows = $derived.by(() => {
		const out: Row[] = [];
		for (const group of listDocuments()) {
			const lang = content.documentLangFor(group.slug);
			const manifest = group.manifests[lang] ?? Object.values(group.manifests)[0];
			if (manifest) out.push({ slug: group.slug, manifest });
		}
		return out;
	});

	interface PontiffGroup {
		pontiff: string;
		rows: Row[];
	}

	const groups = $derived.by(() => {
		const byPontiff = new Map<string, Row[]>();
		for (const row of rows) {
			const list = byPontiff.get(row.manifest.pontiff_or_council);
			if (list) list.push(row);
			else byPontiff.set(row.manifest.pontiff_or_council, [row]);
		}
		const out: PontiffGroup[] = [...byPontiff.entries()].map(([pontiff, groupRows]) => ({
			pontiff,
			rows: [...groupRows].sort((a, b) => a.manifest.promulgated.localeCompare(b.manifest.promulgated))
		}));
		// Groups sorted chronologically by their earliest document, so scanning
		// top-to-bottom moves roughly forward in time (Leo XIII, ..., Second
		// Vatican Council, ..., whoever promulgated most recently).
		out.sort((a, b) =>
			(a.rows[0]?.manifest.promulgated ?? '').localeCompare(b.rows[0]?.manifest.promulgated ?? '')
		);
		return out;
	});

	function formatDate(iso: string, lang: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return new Intl.DateTimeFormat(lang.startsWith('pt') ? 'pt-PT' : 'en-US', { dateStyle: 'long' }).format(d);
	}
</script>

<svelte:head>
	<title>{t('nav.magisterium')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('nav.magisterium')}</h1>
	<p class="tagline">{t('document.library.tagline')}</p>

	{#each groups as group (group.pontiff)}
		<div class="doc-group">
			<h2>{group.pontiff}</h2>
			<ul class="docs">
				{#each group.rows as row (row.slug)}
					<li>
						<a href={`/documents/${row.slug}`} class="doc-link">
							<span class="doc-title">{row.manifest.title}</span>
							<span class="doc-kind">{documentKindLabel(row.manifest.document_kind)}</span>
						</a>
						<p class="doc-meta">
							{t('document.promulgated')}
							{formatDate(row.manifest.promulgated, row.manifest.language)}
							· {copyrightLabel(row.manifest)}
						</p>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
		margin-top: 0;
	}

	.doc-group {
		margin-bottom: 1.75rem;
	}

	.doc-group h2 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 0 0 0.25rem;
	}

	.docs {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.docs li {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.doc-link {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		text-decoration: none;
	}

	.doc-title {
		font-family: var(--font-serif);
		font-size: 1.15rem;
		color: var(--color-text);
	}

	.doc-kind {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0.1rem 0.4rem;
		white-space: nowrap;
	}

	.doc-meta {
		margin: 0.3rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
</style>
