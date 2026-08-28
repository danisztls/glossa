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
	import { listDocuments, loadTranslatedDescriptions } from '$lib/corpus';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import { content } from '$lib/content.svelte';
	import { hrefFor, pontiffAnchor } from '$lib/address';
	import { documentKindLabel } from '$lib/document-labels';
	import { formatPromulgated } from '$lib/dates';
	import { i18n, t } from '$lib/i18n.svelte';
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
	//
	// EVERY document gets a row, including one whose text this build does not
	// have: `/documenta/{slug}` redirects that reader to the source page
	// instead of showing them nothing (docs/decisions.md §Posture), so the
	// row leads somewhere either way and the library needs no second state.
	/**
	 * Descriptions translated into the reader's interface language, `document
	 * slug -> text`. One request, for every document at once, made only when the
	 * language is one something has been translated into — a reader of the
	 * language a description was WRITTEN in never issues it, because that
	 * sentence is already on the manifest.
	 *
	 * `$state` + `$effect` rather than an `await` in the template: the list
	 * must paint immediately with the descriptions the manifests already
	 * carry, and swap in translated ones when they arrive. A reader who
	 * changes language mid-page re-runs the effect and gets the same
	 * treatment, which is why this is not a `load()`.
	 */
	let translated = $state<Record<string, string>>({});
	$effect(() => {
		const lang = i18n.lang;
		let stale = false;
		loadTranslatedDescriptions(lang).then((byWork) => {
			if (!stale) translated = byWork;
		});
		return () => {
			stale = true;
		};
	});

	/**
	 * The description to show for a row, in the reader's language where we
	 * have one and the work's own language otherwise.
	 *
	 * A reading in the reader's own language beats a translation into it. Both
	 * are in the language he wants; only one of them was written by someone
	 * looking at the text this row leads to. That case is real and not rare —
	 * 22 Portuguese editions have been read on their own terms — and it is the
	 * only ordering under which correcting a reading cannot be silently
	 * overruled by a translation of a different edition's reading.
	 *
	 * Never a placeholder and never a machine translation of a missing
	 * reading: `manifest.description` is absent for a work nobody has read
	 * yet, and `translated` only ever holds renderings of a reading that
	 * exists (`site/descriptions.json`, `origin`).
	 */
	function describe(row: Row): string | null {
		const own = row.manifest.description ?? null;
		if (own && row.manifest.language === i18n.lang) return own;
		return translated[row.slug] ?? own;
	}

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
			rows: [...groupRows].sort((a, b) =>
				b.manifest.promulgated.localeCompare(a.manifest.promulgated)
			)
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

	const sidebarItems = $derived(
		groups.map((group) => ({ href: `#${pontiffAnchor(group.pontiff)}`, label: group.pontiff }))
	);
</script>

<svelte:head>
	<title>{t('nav.magisterium')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<div class="content-column">
		<h1>{t('nav.magisterium')}</h1>
		<p class="page-tagline">{t('document.library.tagline')}</p>

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
			<details class="doc-group" id={pontiffAnchor(group.pontiff)} open>
				<summary>
					<h2>{group.pontiff}</h2>
					<span class="chip group-count">{group.rows.length}</span>
				</summary>
				<ul class="docs index-list">
					{#each group.rows as row (row.slug)}
						{@const description = describe(row)}
						<li class="index-row">
							<a href={hrefFor({ kind: 'document', slug: row.slug })} class="doc-link index-link">
								<span class="doc-title index-title">{row.manifest.title}</span>
								<span class="doc-kind chip">{documentKindLabel(row.manifest.document_kind)}</span>
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
							one exists (see `DocumentManifest.description`), and
							nothing rather than a placeholder when none does.

							`describe()` prefers a description in the reader's own
							language over the one on the manifest, which is written in
							the WORK's language: a reader of Italian looking at an
							English edition wants the Italian sentence about it, and the
							English one is the fallback rather than the default.
						-->
							<p class="doc-meta label-micro">
								<time datetime={row.manifest.promulgated}>
									{formatPromulgated(row.manifest.promulgated, row.manifest.language)}
								</time>
							</p>
							{#if description}
								<p class="doc-description">{description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			</details>
		{/each}
	</div>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('nav.magisterium')} items={sidebarItems} />
	</aside>
</div>

<style>
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
		font-size: max(var(--font-size-min), 0.8em);
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
	   piece of information a collapsed heading can't otherwise give. A `.chip`
	   (styles/components.css) that sits in a `<summary>` rather than at the end
	   of a row, so it needs the auto margin to reach the far side; the tabular
	   figures are because it holds a number and the shared chip mostly holds a
	   word. */
	.group-count {
		margin-inline-start: auto;
		font-variant-numeric: tabular-nums;
	}

	/* The list, its rows, the row-filling link, its title and its kind chip are
	   all `styles/components.css` — `.index-list`, `.index-row`, `.index-link`,
	   `.index-title`, `.chip` — including the hover that answers on both ends
	   of the row. This page is the shape those primitives were named after, so
	   the only thing left to say is how big a document's title is set: larger
	   than the other index pages', because here the title IS the row and the
	   date and description hang beneath it. */
	.doc-title {
		font-size: 1.15rem;
	}

	/* The date is the row's only metadata now, so it gets to carry a little
	   weight of its own rather than reading as a trailing footnote: tabular
	   figures so dates align down the column, and letter-spacing to set it
	   apart from the serif title above it. */
	.doc-meta {
		margin: 0.3rem 0 0;
		font-variant-numeric: tabular-nums;
	}

	.doc-description {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		max-width: 60ch;
	}
</style>
