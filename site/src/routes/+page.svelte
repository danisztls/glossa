<script lang="ts">
	import { onMount } from 'svelte';
	import { content } from '$lib/content.svelte';
	import { getWork, listBooks, listDocuments } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { documentKindPluralLabel } from '$lib/document-labels';
	import { listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentManifest, WorkManifest, WorkType } from '$lib/types';

	// Every group below shows the reader's EFFECTIVE edition only — one entry
	// per work, never one per language (2026-08-15 decision: with ~460 works
	// across languages once the encyclical sweep finishes, listing every
	// language for every work would roughly double this page and make it
	// unusable). "Effective" is resolved the same way every reading route
	// resolves it — through the content store (`content.workIdFor`/
	// `content.documentLangFor`), never by filtering on `i18n.lang` directly —
	// so a reader who has explicitly overridden an edition (e.g. reading the
	// Portuguese Bible under an English interface) sees the edition they
	// actually chose here too, not whatever the interface language implies.
	const bibleWork = $derived.by(() => {
		const id = content.workIdFor('bible');
		return id ? getWork(id) : undefined;
	});
	const cccWork = $derived.by(() => {
		const id = content.workIdFor('catechism');
		return id ? getWork(id) : undefined;
	});
	const compendiumWork = $derived.by(() => {
		const id = content.workIdFor('compendium');
		return id ? getWork(id) : undefined;
	});

	function bibleHref(work: WorkManifest): string {
		const books = listBooks(work.id);
		const firstBook = books[0];
		const firstChapter = firstBook?.chapters[0]?.n ?? 1;
		// Edition-free (docs/decisions.md #2). `work` still picks WHICH edition's
		// book list to read the first book from, since editions need not agree on
		// it — it just no longer appears in the URL.
		return `/bible/${firstBook?.osis ?? ''}/${firstChapter}`;
	}

	// Magisterium: one row per document FAMILY (docs/corpus-schema.md
	// §Documents), not one row per document — 16 Vatican II texts today, with
	// several hundred encyclicals already landing behind them
	// (docs/research/vatican-documents.md §5's phased plan). A flat list at
	// that size would swamp this page the same way one row per language
	// would (see the note above) — instead each family collapses to one row
	// with a count, linking into `/documents` where the full library actually
	// lists them. The set of families shown is read off the corpus itself via
	// `listDocuments()`, not a hardcoded list, so a new family appears here
	// the moment its scrape lands, with no code change required.
	interface MagisteriumRow {
		family: string;
		label: string;
		count: number;
	}

	/**
	 * A family-level display label. `vatii`'s 16 works all share one
	 * `pontiff_or_council` ("Second Vatican Council") — when a family's
	 * promulgator is uniform like that, using it verbatim gives a more
	 * specific, more useful label than any generic kind name could. Once a
	 * family's promulgators genuinely vary (every pontificate's encyclicals,
	 * all under `family: "encyclical"`), there's no single name to borrow, so
	 * this falls back to a pluralized `document_kind` label instead
	 * ("Encyclicals") — see `$lib/document-labels.ts`.
	 */
	function familyLabel(docs: DocumentManifest[]): string {
		const pontiffs = new Set(docs.map((d) => d.pontiff_or_council));
		if (pontiffs.size === 1) return docs[0].pontiff_or_council;
		return documentKindPluralLabel(docs[0].document_kind);
	}

	const magisteriumRows = $derived.by(() => {
		const byFamily = new Map<string, DocumentManifest[]>();
		for (const group of listDocuments()) {
			// Effective-language filter, same principle as Bible/Catechism above:
			// a document this reader has no edition of in their current
			// (per-slug) effective language isn't counted here.
			const manifest = group.manifests[content.documentLangFor(group.slug)];
			if (!manifest) continue;
			const list = byFamily.get(group.family);
			if (list) list.push(manifest);
			else byFamily.set(group.family, [manifest]);
		}
		return [...byFamily.entries()]
			.map(([family, docs]) => ({ family, label: familyLabel(docs), count: docs.length }))
			.sort((a, b) => b.count - a.count);
	});

	let positions: ReadingPosition[] = $state([]);

	onMount(() => {
		positions = listPositions();
	});

	// One "continue reading" row per work TYPE (most recently touched
	// edition/document of it), not one per exact edition or exact document: a
	// reader who has opened both the English and Portuguese Bible would
	// otherwise get two separate Bible rows here, which reads as clutter
	// rather than as two genuinely different shortcuts — the ~450 individual
	// documents collapse the same way, to whichever one was read most
	// recently. `positions` is already sorted most-recent-first, so `.find`
	// picks the latest.
	const CONTINUE_TYPES: WorkType[] = ['bible', 'catechism', 'compendium', 'document'];
	const continueItems = $derived(
		CONTINUE_TYPES.map((type) => positions.find((pos) => getWork(pos.workId)?.type === type)).filter(
			(pos): pos is ReadingPosition => pos !== undefined
		)
	);
</script>

<div class="content-column">
	<h1>{t('home.title')}</h1>
	<p class="tagline">{t('home.tagline')}</p>

	{#if continueItems.length > 0}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('home.continueReading')}</h2>
			<ul class="positions">
				{#each continueItems as pos (pos.workId)}
					<li><a href={pos.href}>{pos.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	<section aria-labelledby="library-heading">
		<h2 id="library-heading">{t('home.works')}</h2>

		<!-- Bible: a single row, the reader's effective edition — see module
		     docblock. Nested one level under its own group heading like
		     Catechism/Magisterium below, even though it only ever has one row
		     today, so a second Bible edition landing later (docs/decisions.md
		     already anticipates more) doesn't need a structural change here. -->
		{#if bibleWork}
			<div class="work-group" aria-labelledby="group-bible">
				<h3 id="group-bible">{t('nav.bible')}</h3>
				<ul class="works">
					<li>
						<a href={bibleHref(bibleWork)} class="work-link">
							<span class="work-title">{bibleWork.title}</span>
							<span class="work-meta">{bibleWork.short_title} · {bibleWork.language}</span>
						</a>
						{#if bibleWork.type === 'bible'}
							<p class="work-note">
								{bibleWork.books.length} book{bibleWork.books.length === 1 ? '' : 's'}
							</p>
						{/if}
						<p class="work-copyright">{copyrightLabel(bibleWork)}</p>
					</li>
				</ul>
			</div>
		{/if}

		<!-- Catechism: two distinct WORKS (CCC and its Compendium) nested under
		     one group heading — they're separate work types in the schema, but
		     belong together conceptually, the way a book and its study guide
		     would share a library shelf. -->
		{#if cccWork || compendiumWork}
			<div class="work-group" aria-labelledby="group-catechism">
				<h3 id="group-catechism">{t('nav.ccc')}</h3>
				<ul class="works">
					{#if cccWork}
						<li>
							<a href="/ccc" class="work-link">
								<span class="work-title">{cccWork.title}</span>
								<span class="work-meta">{cccWork.short_title} · {cccWork.language}</span>
							</a>
							<p class="work-copyright">{copyrightLabel(cccWork)}</p>
						</li>
					{/if}
					{#if compendiumWork}
						<li>
							<a href="/compendium" class="work-link">
								<span class="work-title">{compendiumWork.title}</span>
								<span class="work-meta">{compendiumWork.short_title} · {compendiumWork.language}</span>
							</a>
							<p class="work-copyright">{copyrightLabel(compendiumWork)}</p>
						</li>
					{/if}
				</ul>
			</div>
		{/if}

		<!-- Magisterium: one row per document FAMILY, not per document — see
		     module docblock. Every row links into `/documents`, where the
		     library actually breaks each family down. -->
		{#if magisteriumRows.length > 0}
			<div class="work-group" aria-labelledby="group-magisterium">
				<h3 id="group-magisterium">{t('nav.magisterium')}</h3>
				<ul class="works">
					{#each magisteriumRows as row (row.family)}
						<li>
							<a href="/documents" class="work-link">
								<span class="work-title">{row.label}</span>
								<span class="work-meta">{row.count}</span>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
	}

	.positions,
	.works {
		list-style: none;
		padding: 0;
		margin: 0 0 2rem;
	}

	.positions li {
		padding: 0.35rem 0;
	}

	.work-group {
		margin-bottom: 1.75rem;
	}

	.work-group h3 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		color: var(--color-text-muted);
		margin: 0 0 0.25rem;
	}

	.work-group .works {
		margin-bottom: 0;
	}

	.works li {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.work-link {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		text-decoration: none;
	}

	.work-title {
		font-family: var(--font-serif);
		font-size: 1.2rem;
		color: var(--color-text);
	}

	.work-meta {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.work-note {
		margin: 0.35rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.work-copyright {
		margin: 0.2rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
