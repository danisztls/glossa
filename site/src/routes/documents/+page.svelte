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

	// REVERSE chronological throughout, at both levels. A library that opens on
	// Leo XIII and needs ~450 rows of scrolling to reach anything a reader is
	// likely to have heard of is ordered for the archivist, not the reader;
	// recent documents are both the most-sought and the most-linked. Note the
	// comparator argument order below is deliberately b-then-a at both levels.
	const groups = $derived.by(() => {
		const byPontiff = new Map<string, Row[]>();
		for (const row of rows) {
			const list = byPontiff.get(row.manifest.pontiff_or_council);
			if (list) list.push(row);
			else byPontiff.set(row.manifest.pontiff_or_council, [row]);
		}
		const out: PontiffGroup[] = [...byPontiff.entries()].map(([pontiff, groupRows]) => ({
			pontiff,
			rows: [...groupRows].sort((a, b) => b.manifest.promulgated.localeCompare(a.manifest.promulgated))
		}));
		// Groups ranked by their most recent document. Because each group's rows
		// are already newest-first, that document is `rows[0]` -- the same index
		// the old ascending sort used for the *earliest*, so this line looks
		// unchanged but now compares a different document. Keep the two sorts in
		// step if either direction is ever revisited.
		out.sort((a, b) =>
			(b.rows[0]?.manifest.promulgated ?? '').localeCompare(a.rows[0]?.manifest.promulgated ?? '')
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

	<!--
		Each pontificate collapses, and every one starts OPEN. Default-open
		rather than default-closed because this is a library index: a reader
		arriving here is browsing, and a page of nothing but closed headings
		makes them work to see anything at all. The value is in being able to
		fold away the pontificates you are not reading — Leo XIII alone runs to
		dozens of encyclicals — not in hiding everything by default.

		`<details open>` rather than component state: it needs no JavaScript,
		it is keyboard- and screen-reader-correct for free, and browser
		find-in-page can open a closed section to reveal a match. A page whose
		whole purpose is finding a document should not break Ctrl+F.
	-->
	{#each groups as group (group.pontiff)}
		<details class="doc-group" open>
			<summary>
				<h2>{group.pontiff}</h2>
				<span class="group-count">{group.rows.length}</span>
			</summary>
			<ul class="docs">
				{#each group.rows as row (row.slug)}
					<li>
						<a href={`/documents/${row.slug}`} class="doc-link">
							<span class="doc-title">{row.manifest.title}</span>
							<span class="doc-kind">{documentKindLabel(row.manifest.document_kind)}</span>
						</a>
						<!--
							Date alone, no "Promulgated" label: in a list where every
							row carries one, the label is 345 repetitions of a word
							that the date's own format already implies.

							No copyright line either. Every document in this corpus
							is under the identical Libreria Editrice Vaticana notice,
							so repeating it per row is pure noise — it stays on the
							reading pages, where it is attached to the text it
							actually governs. The description takes its place, when
							one exists (see `DocumentManifest.description`); today
							none do, so this renders nothing rather than a
							placeholder.
						-->
						<p class="doc-meta">
							<time datetime={row.manifest.promulgated}>
								{formatDate(row.manifest.promulgated, row.manifest.language)}
							</time>
						</p>
						{#if row.manifest.description}
							<p class="doc-description">{row.manifest.description}</p>
						{/if}
					</li>
				{/each}
			</ul>
		</details>
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

	.doc-group summary {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		cursor: pointer;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin-bottom: 0.25rem;
		/* The default triangle sits awkwardly against a serif heading and can't
		   be styled consistently across browsers; `::before` below draws one
		   that matches the rest of the site's disclosure affordances. */
		list-style: none;
	}

	.doc-group summary::-webkit-details-marker {
		display: none;
	}

	.doc-group summary::before {
		content: '▸';
		color: var(--color-text-muted);
		font-size: 0.8em;
		transition: transform 120ms ease;
		display: inline-block;
	}

	.doc-group[open] summary::before {
		transform: rotate(90deg);
	}

	.doc-group summary:hover h2 {
		color: var(--color-text);
	}

	.doc-group h2 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		color: var(--color-text-muted);
		margin: 0;
		display: inline;
	}

	/* How many documents are folded away when the section is closed — the one
	   piece of information a collapsed heading can't otherwise give. */
	.group-count {
		margin-inline-start: auto;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0 0.35rem;
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

	/* The date is the row's only metadata now, so it gets to carry a little
	   weight of its own rather than reading as a trailing footnote: tabular
	   figures so dates align down the column, and letter-spacing to set it
	   apart from the serif title above it. */
	.doc-meta {
		margin: 0.3rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.doc-description {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		max-width: 60ch;
	}
</style>
