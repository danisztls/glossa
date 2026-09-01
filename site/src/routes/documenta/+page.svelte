<script lang="ts">
	/**
	 * The Magisterium library — every document in the corpus (docs/corpus-
	 * schema.md §Documents).
	 *
	 * ## It was a table of contents until 2026-08-31, and 272 documents is
	 * past where that helps
	 *
	 * The page grouped by `pontiff_or_council` into twelve collapsible
	 * sections with a sidebar of anchors into them, which was the right shape
	 * for the sixteen Vatican II texts it was written for and survived the
	 * encyclicals landing behind them. What it could not do is the question a
	 * reader actually arrives with, which is never "what did Leo XIII write"
	 * alone: it is some conjunction of who wrote it, what kind of document it
	 * is, and what it is about. An anchor list answers the first and has no
	 * way to express the other two.
	 *
	 * So the aside is now a facet panel and the list is flat and
	 * reverse-chronological. Three consequences worth knowing:
	 *
	 *  - THE PONTIFICATE HEADINGS ARE GONE, and with them the twelve `#`
	 *    anchors `pontiffAnchor` minted. Nothing linked to them from outside
	 *    this page — they were fragments into an index, not addresses — but
	 *    `address.ts` still exports the helper for the document reader's own
	 *    masthead, so it is not dead.
	 *  - WITHIN A FACET THE VALUES ARE OR-ED, ACROSS FACETS AND-ED. Choosing
	 *    two authors widens; choosing an author and a kind narrows. That is
	 *    what a faceted list means everywhere else, and doing it the other way
	 *    would make a second click on the same facet always empty the page.
	 *  - THE FILTERS ARE NOT IN THE URL, deliberately. Nothing in this app
	 *    reads or writes the client-side URL — the address grammar is
	 *    pathname-only, and `worker.ts` decides a page's STATUS from the
	 *    pathname alone — so a shareable `?auctor=` would be the first query
	 *    string in the system and would want modelling in the sitemap, the
	 *    route manifest and the usage beacon before it earned its keep. A
	 *    filter here is a way of looking at one page, not a place.
	 *
	 * ## The search box, and why the subject vocabulary could then be cut
	 *
	 * The panel leads with a box that reads a document's whole metadata —
	 * title, author, kind, description, tags — AND-ed with the facets. It is
	 * what made it safe to cut the subject vocabulary from an open 232 terms
	 * to a curated 53 (`site/document-tags.json`): the terms that went were
	 * every region name and every occasion word, and every one of them is in
	 * the description this box reads. A facet row is for BROWSING an axis; the
	 * search is for everything else, and the two answer different questions.
	 *
	 * MATCHING AND MARKING ARE ONE FUNCTION, not two. `matchesQuery` and
	 * `highlight` in `$lib/highlight` share a fold and a set of tiers, so a row
	 * is on this list exactly when there is something on it to mark. That is
	 * what stops the list from showing a result with no visible reason for
	 * being there, which is the failure mode a separately-written matcher
	 * produces and which nothing but a reader ever notices.
	 *
	 * THE HAYSTACK IS JOINED WITH NEWLINES rather than spaces, so no token can
	 * run across the seam between two fields and match `xiiiencyclical`.
	 *
	 * ## What is read reactively and what is fetched
	 *
	 * Like `catechismus/+page.svelte`, the registry (`listDocuments()`) is
	 * index-tier and already inlined, so there is nothing to fetch for the
	 * list itself and no `+page.ts`. The two things that ARE fetched — the
	 * translated descriptions and the subject tags — arrive after first paint
	 * and are both absent-by-default: the page renders its author and kind
	 * facets immediately and grows the subject facet when the tags land.
	 */
	import { listDocuments, loadDocumentTags, loadTranslatedDescriptions } from '$lib/corpus';
	import { highlight, matchesQuery } from '$lib/highlight';
	import DocumentFilters, { type Facet } from '$lib/components/DocumentFilters.svelte';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { documentKindLabel } from '$lib/document-labels';
	import { formatPromulgated } from '$lib/dates';
	import { i18n, t } from '$lib/i18n.svelte';
	import type { DocumentManifest } from '$lib/types';

	interface Row {
		slug: string;
		manifest: DocumentManifest;
		/** As written, for display. */
		tags: string[];
		/** Lower-cased, for matching — the key the facets are built on. */
		tagKeys: string[];
	}

	/** Everything about a document the search box reads, newline-joined. Built
	 *  per row per query-dependent input rather than cached: 272 rows against a
	 *  handful of short fields is nothing, and a cache here would have to be
	 *  invalidated by the description fetch and the language switch both. */
	function haystack(row: Row): string {
		return [
			row.manifest.title,
			row.manifest.pontiff_or_council,
			documentKindLabel(row.manifest.document_kind),
			describe(row) ?? '',
			...row.tags
		].join('\n');
	}

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
	 * Subject tags, `document slug -> [tag, …]` (`site/document-tags.json`).
	 *
	 * Language-independent, so unlike the descriptions above this is fetched
	 * once and never re-fetched: a tag describes the document, and every
	 * edition of it is the same document. `{}` until it arrives and `{}`
	 * forever under fixtures, which the facet panel reads as "no subject
	 * facet" rather than as an empty one.
	 */
	let tagsBySlug = $state<Record<string, string[]>>({});
	$effect(() => {
		let stale = false;
		loadDocumentTags().then((bySlug) => {
			if (!stale) tagsBySlug = bySlug;
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

	// One row per document SLUG, in the reader's effective language for that
	// document — not one row per language edition. Two editions per document
	// showing up as two rows here would double this list and make it
	// unreadable, the same "one entry per work" principle the home page's
	// Library section applies. The per-document language override
	// (`EditionMenu` on `/documenta/{slug}`) is what lets a reader pick a
	// different edition once they're actually reading one; this list just
	// shows their current default.
	//
	// EVERY document gets a row, including one whose text this build does not
	// have: `/documenta/{slug}` redirects that reader to the source page
	// instead of showing them nothing (docs/decisions.md §Posture), so the
	// row leads somewhere either way and the library needs no second state.
	//
	// REVERSE CHRONOLOGICAL. A library that opens on Leo XIII and needs
	// hundreds of rows of scrolling to reach anything a reader is likely to
	// have heard of is ordered for the archivist, not the reader; recent
	// documents are both the most-sought and the most-linked. The title is the
	// tiebreak so that a day carrying several documents is at least stable.
	const rows = $derived.by(() => {
		const out: Row[] = [];
		for (const group of listDocuments()) {
			const lang = content.documentLangFor(group.slug);
			const manifest = group.manifests[lang] ?? Object.values(group.manifests)[0];
			if (!manifest) continue;
			const tags = tagsBySlug[group.slug] ?? [];
			out.push({
				slug: group.slug,
				manifest,
				tags,
				tagKeys: tags.map((tag) => tag.toLowerCase())
			});
		}
		out.sort(
			(a, b) =>
				b.manifest.promulgated.localeCompare(a.manifest.promulgated) ||
				a.manifest.title.localeCompare(b.manifest.title)
		);
		return out;
	});

	let query = $state('');
	let selectedAuthors = $state<string[]>([]);
	let selectedKinds = $state<string[]>([]);
	let selectedTags = $state<string[]>([]);

	const selected = $derived({
		authors: selectedAuthors,
		kinds: selectedKinds,
		tags: selectedTags
	});

	function toggle(facet: 'authors' | 'kinds' | 'tags', value: string) {
		const lists = { authors: selectedAuthors, kinds: selectedKinds, tags: selectedTags };
		const next = lists[facet].includes(value)
			? lists[facet].filter((v) => v !== value)
			: [...lists[facet], value];
		if (facet === 'authors') selectedAuthors = next;
		else if (facet === 'kinds') selectedKinds = next;
		else selectedTags = next;
	}

	function clearAll() {
		query = '';
		selectedAuthors = [];
		selectedKinds = [];
		selectedTags = [];
	}

	/* The three predicates, kept apart so each facet's counts can be taken
	   against the pool its own semantics need — see `tagFacets` below and
	   `DocumentFilters`'s docblock. An empty selection matches everything, which
	   is what makes the unfiltered page fall out of the same code rather than
	   needing a branch.

	   AUTHOR AND KIND ADD, SUBJECT SUBTRACTS, and the asymmetry is the arity of
	   the field rather than an inconsistency to tidy away. A document has
	   exactly one author and exactly one kind, so AND-ing two of either is an
	   empty list by construction and the only thing a second choice can mean is
	   "and these as well". A document carries three subjects on average, so a
	   second subject has the other reading available — the documents about BOTH
	   — and that is the one a reader narrowing 272 titles is asking for. Note
	   `every` needs no empty-selection branch, unlike the two above it. */
	const byAuthor = (row: Row) =>
		selectedAuthors.length === 0 || selectedAuthors.includes(row.manifest.pontiff_or_council);
	const byKind = (row: Row) =>
		selectedKinds.length === 0 || selectedKinds.includes(row.manifest.document_kind);
	const byTag = (row: Row) => selectedTags.every((tag) => row.tagKeys.includes(tag));
	/* The fourth axis. `matchesQuery` returns true on an empty query, so this
	   needs no branch of its own — and it is AND-ed with the facets like any
	   other, because a reader who has typed a word and chosen an author means
	   both. */
	const bySearch = (row: Row) => matchesQuery(haystack(row), query);

	const visible = $derived(
		rows.filter((row) => byAuthor(row) && byKind(row) && byTag(row) && bySearch(row))
	);

	/**
	 * Build one facet's options.
	 *
	 * ORDER COMES FROM THE WHOLE CORPUS AND COUNTS FROM THE FILTERED SET, on
	 * purpose: a list that re-sorted itself on every click would move the
	 * option under the reader's cursor as they used it. `rank` decides the
	 * order once, `pool` supplies the numbers.
	 */
	function buildFacet(
		pool: Row[],
		keysOf: (row: Row) => string[],
		labelOf: (key: string) => string,
		rank: (a: [string, number], b: [string, number]) => number
	): Facet[] {
		const overall = new Map<string, number>();
		for (const row of rows) {
			for (const key of keysOf(row)) overall.set(key, (overall.get(key) ?? 0) + 1);
		}
		const here = new Map<string, number>();
		for (const row of pool) {
			for (const key of keysOf(row)) here.set(key, (here.get(key) ?? 0) + 1);
		}
		return [...overall.entries()]
			.sort(rank)
			.map(([key]) => ({ value: key, label: labelOf(key), count: here.get(key) ?? 0 }));
	}

	/** Newest document first, matching the list beside it. Computed from the
	 *  whole corpus so the order is fixed. */
	const authorRecency = $derived.by(() => {
		const latest = new Map<string, string>();
		for (const row of rows) {
			const key = row.manifest.pontiff_or_council;
			const seen = latest.get(key);
			if (!seen || row.manifest.promulgated > seen) latest.set(key, row.manifest.promulgated);
		}
		return latest;
	});

	const authorFacets = $derived(
		buildFacet(
			rows.filter((row) => byKind(row) && byTag(row) && bySearch(row)),
			(row) => [row.manifest.pontiff_or_council],
			(key) => key,
			([a], [b]) => (authorRecency.get(b) ?? '').localeCompare(authorRecency.get(a) ?? '')
		)
	);

	const kindFacets = $derived(
		buildFacet(
			rows.filter((row) => byAuthor(row) && byTag(row) && bySearch(row)),
			(row) => [row.manifest.document_kind],
			(key) => documentKindLabel(key),
			([, a], [, b]) => b - a
		)
	);

	/** The written form of each tag key, for display. `sync-corpus.mjs`
	 *  refuses two tags differing only in case, so every key has exactly one
	 *  written form and picking the first one seen is picking the only one. */
	const tagLabels = $derived.by(() => {
		const labels = new Map<string, string>();
		for (const row of rows) {
			row.tags.forEach((tag, i) => {
				const key = row.tagKeys[i];
				if (!labels.has(key)) labels.set(key, tag);
			});
		}
		return labels;
	});

	/* The one facet counted against the FULLY filtered set, itself included,
	   because it is the one that AND-s: a term's count here is exactly the
	   number of documents left if you add it, which is what a subtractive facet
	   has to promise, and a term sharing no document with the current selection
	   reads 0. The other two exclude themselves for the mirror-image reason —
	   adding a second author only ever widens, so counting one against the
	   authors already chosen would print 0 beside every one of them.

	   ALPHABETICAL, where the other two rank by recency and by count, because
	   the panel draws this one as a cloud and the size already says the weight.
	   What ordering has to buy instead is the thing size cannot: a term the
	   reader already has in mind, found by scanning. It is also the most stable
	   order there is, which matters here more than anywhere — the chips resize
	   on every click, so their widths move; ranking them by a number that also
	   moves would send them past one another as well. The keys are lower-cased,
	   so a plain compare is already the case-insensitive one. */
	const tagFacets = $derived(
		buildFacet(
			visible,
			(row) => row.tagKeys,
			(key) => tagLabels.get(key) ?? key,
			([ka], [kb]) => ka.localeCompare(kb)
		)
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
			The panel a reader gets where the aside is not — below the grid
			breakpoint, where `.index-aside` is `display: none` (styles/layout.css).
			`/documenta/{slug}` hands its table of contents over the same way and
			at the same width; see `.filters-inline` below.

			`<details>` rather than component state, for the reasons that file
			also gives: the browser owns this widget's keyboard handling and ARIA
			already, and find-in-page can open a closed one. Closed by default
			here — unlike the old pontificate sections, which were open because
			they held the index itself. This holds controls OVER the index, and a
			phone reader should meet the documents first.
		-->
		<details class="filters-inline">
			<summary>
				<h2>{t('document.filter.heading')}</h2>
				<span class="chip">{visible.length}</span>
			</summary>
			<DocumentFilters
				authors={authorFacets}
				kinds={kindFacets}
				tags={tagFacets}
				{selected}
				{query}
				onQuery={(value) => (query = value)}
				onToggle={toggle}
				onClear={clearAll}
			/>
		</details>

		<!--
			Every string the search reads is drawn through this, so a result can
			always show why it is one. `highlight` returns a single unmarked
			segment when nothing matched and `[]` for empty text, which is why
			there is no branch here for "no query".

			WRITTEN WITHOUT A LINE BREAK INSIDE THE `{#each}`, deliberately:
			Svelte preserves whitespace between template nodes, so formatting
			this across lines inserts a space before and after every mark and
			the marked words drift apart from the words either side of them.
		-->
		{#snippet marked(text: string)}{#each highlight(text, query) as segment}{#if segment.hit}<mark
						>{segment.text}</mark
					>{:else}{segment.text}{/if}{/each}{/snippet}

		<!-- Digits, not a sentence: a count needs no translation and no plural
		     rule. The name it is owed is a visually-hidden span rather than an
		     `aria-label`, which is only reliably exposed on interactive elements
		     and on elements with a role — a bare `<p>` is neither, so the label
		     is silently dropped by several screen readers. -->
		<p class="result-count">
			<span class="visually-hidden">{t('document.filter.results')}: </span>{visible.length} / {rows.length}
		</p>

		{#if visible.length === 0}
			<p class="no-results">{t('document.filter.noResults')}</p>
		{:else}
			<ul class="docs index-list">
				{#each visible as row (row.slug)}
					{@const description = describe(row)}
					<li class="index-row">
						<a href={hrefFor({ kind: 'document', slug: row.slug })} class="doc-link index-link">
							<span class="doc-title index-title">{@render marked(row.manifest.title)}</span>
							<span class="doc-kind chip"
								>{@render marked(documentKindLabel(row.manifest.document_kind))}</span
							>
						</a>
						<!--
							Date and author, no "Promulgated" label: in a list where every
							row carries one, the label is hundreds of repetitions of a word
							that the date's own format already implies. The AUTHOR is new
							here and earns its place by the list going flat — with the
							pontificate headings gone it is the one fact a row would
							otherwise have lost.

							No copyright line. Every document in this corpus is under the
							identical Libreria Editrice Vaticana notice, so repeating it per
							row is pure noise — it stays on the reading pages, where it is
							attached to the text it actually governs.

							`describe()` prefers a description in the reader's own language
							over the one on the manifest, which is written in the WORK's
							language: a reader of Italian looking at an English edition wants
							the Italian sentence about it, and the English one is the
							fallback rather than the default.
						-->
						<p class="doc-meta label-micro">
							<time datetime={row.manifest.promulgated}>
								{formatPromulgated(row.manifest.promulgated, row.manifest.language)}
							</time>
							<span class="doc-author">{@render marked(row.manifest.pontiff_or_council)}</span>
						</p>
						{#if description}
							<p class="doc-description">{@render marked(description)}</p>
						{/if}
						{#if row.tags.length > 0}
							<!-- Each tag is a control, not decoration: seeing what a
							     document is filed under and being unable to ask for the
							     rest of that shelf is the worse half of a tag. -->
							<ul class="doc-tags">
								{#each row.tags as tag, i (tag)}
									<li>
										<button
											type="button"
											class="doc-tag"
											class:on={selectedTags.includes(row.tagKeys[i])}
											aria-pressed={selectedTags.includes(row.tagKeys[i])}
											onclick={() => toggle('tags', row.tagKeys[i])}>{@render marked(tag)}</button
										>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	<aside class="index-aside">
		<DocumentFilters
			authors={authorFacets}
			kinds={kindFacets}
			tags={tagFacets}
			{selected}
			{query}
			onQuery={(value) => (query = value)}
			onToggle={toggle}
			onClear={clearAll}
		/>
	</aside>
</div>

<style>
	/* The mirror of `.index-aside` in styles/layout.css: exactly where that
	   rule takes the aside away, this appears. One width, not the pair
	   `/documenta/{slug}` needs, because an index page never enters compare
	   mode and so never has the aside pulled out from under it a second time. */
	.filters-inline {
		margin: 0 0 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.5rem 0.75rem;
	}

	@media (min-width: 80rem) {
		.filters-inline {
			display: none;
		}
	}

	.filters-inline summary {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		cursor: pointer;
		list-style: none;
	}

	.filters-inline summary::-webkit-details-marker {
		display: none;
	}

	/* The same disclosure glyph the rest of the site draws by hand — the
	   default triangle can't be styled consistently across browsers. */
	.filters-inline summary::before {
		content: '▸';
		color: var(--color-text-muted);
		font-size: max(var(--font-size-min), 0.8em);
		transition: transform 120ms ease;
		display: inline-block;
	}

	.filters-inline[open] summary::before {
		transform: rotate(90deg);
	}

	.filters-inline summary h2 {
		font-family: var(--font-sans);
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0;
	}

	.filters-inline summary .chip {
		margin-inline-start: auto;
		font-variant-numeric: tabular-nums;
	}

	.filters-inline :global(.doc-filters) {
		margin-top: 0.75rem;
	}

	/* The site's second `<mark>` — `JumpBox` has the other, and the argument
	   there applies here too: a wash behind the letters rather than a change of
	   colour, because recolouring the matched words in 272 rows of serif titles
	   would read as damage rather than as emphasis. `color: inherit` because
	   the browser default repaints mark text near-black, which the dark and
	   sepia themes both lose. */
	mark {
		background: color-mix(in srgb, var(--color-accent) 22%, transparent);
		color: inherit;
		border-radius: 2px;
	}

	/* Forced-colors drops the wash entirely, so the mark has to be carried by
	   something the mode does paint. */
	@media (forced-colors: active) {
		mark {
			background: Mark;
			color: MarkText;
		}
	}

	.result-count {
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		margin: 0 0 0.75rem;
	}

	.no-results {
		color: var(--color-text-muted);
		margin: 1.5rem 0;
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

	/* Tabular figures so dates align down the column; the author follows behind
	   a separator drawn in CSS rather than typed into the markup, so it
	   vanishes with the element it belongs to. */
	.doc-meta {
		margin: 0.3rem 0 0;
		font-variant-numeric: tabular-nums;
	}

	.doc-author::before {
		content: '·';
		margin-inline: 0.45em;
		color: var(--color-border);
	}

	.doc-description {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		max-width: 60ch;
	}

	.doc-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		list-style: none;
		margin: 0.45rem 0 0;
		padding: 0;
	}

	.doc-tag {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		line-height: 1.4;
		padding: 0.1rem 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.doc-tag:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.doc-tag.on {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-contrast);
	}
</style>
