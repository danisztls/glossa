<script lang="ts">
	/**
	 * One document, whole, on one page.
	 *
	 * THIS ROUTE ABSORBED TWO OTHERS on 2026-08-17 (docs/decisions.md): the
	 * former `documents/[slug]/read` (continuous full text) and
	 * `documents/[slug]/[n]` (one prerendered page per numbered section). The
	 * per-section route alone was 9,315 of the deployment's 15,256 files — 61%
	 * of it — at ~21 KB each to carry a few hundred bytes of text apiece; the
	 * remainder was this same chrome, repeated. Section addresses survive as
	 * fragments (`/documents/{slug}#s{n}`) against the `id="s{n}"` anchors the
	 * continuous view already carried for exactly that purpose.
	 *
	 * What that costs, recorded so nobody rediscovers it as a bug: a section no
	 * longer has its own `<title>` or its own Open Graph tags, so a link to one
	 * unfurls as the whole document. That was weighed and accepted — the value
	 * here is the reading tool, and every one of these texts is a reproduction
	 * of a vatican.va page that outranks us for its own words anyway.
	 *
	 * Unlike a CCC chapter, a document's structure tree has real headings worth
	 * keeping in the flow (Parts, Chapters, Articles) rather than one flat run
	 * of numbered sections — `headingsByStart` threads
	 * `flattenDocumentStructure`'s rows back in immediately before the section
	 * each one starts at, so a long encyclical still reads with its own
	 * divisions intact instead of as an undifferentiated wall of prose.
	 */
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import UnpublishedNotice from '$lib/components/UnpublishedNotice.svelte';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import { alignByNumber } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { useScrollSpy } from '$lib/scroll-spy.svelte';
	import { setPosition } from '$lib/reading-position';
	import { displayTitle } from '$lib/titles';
	import { documentKindLabel } from '$lib/document-labels';
	import { formatPromulgated } from '$lib/dates';
	import { content } from '$lib/content.svelte';
	import {
		flattenDocumentStructure,
		getDocumentGroup,
		getDocumentSectionsAsync,
		unpublishedInfo
	} from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection, StructureNode } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * LANGUAGE SWITCHING ON A PAGE THAT ONLY EMBEDS ONE LANGUAGE.
	 *
	 * `+page.ts` embeds exactly one language's sections rather than every
	 * language's, because this route's payload is a whole document — see that
	 * module's docblock for why, and for why `embeddedLang` is fixed at build
	 * time. The consequence lands here: the CCC/Compendium single-unit routes
	 * can switch language by pure re-render, and this one cannot, because the
	 * other language's text simply isn't in the page.
	 *
	 * So a mismatch is resolved by fetching, through the same memoized
	 * `getDocumentSectionsAsync` the loader itself used.
	 *
	 * WHILE THE FETCH IS IN FLIGHT THE EMBEDDED TEXT STAYS ON SCREEN. Blanking
	 * the page or showing a spinner would trade a complete, readable document
	 * for an empty one in service of a preference the reader can already see
	 * is being applied — the text swaps when it arrives. Same "degrade, don't
	 * 404 a page with real content" posture the rest of the site takes.
	 *
	 * `preferred` may name a language this document has no edition of at all
	 * (a v1 EN/PT asymmetry), in which case there is nothing to fetch and the
	 * embedded language stays — deliberately, rather than rendering an empty
	 * document for a language that doesn't exist.
	 */
	const preferred = $derived(content.documentLangFor(data.slug));
	const targetLang = $derived(
		data.manifestsByLang[preferred] ? preferred : (data.embeddedLang ?? preferred)
	);

	/** Sections fetched for a language other than the embedded one. Keyed by
	 *  slug as well as language so a client-side navigation to a DIFFERENT
	 *  document can never render the previous document's text under the new
	 *  document's headings while its own fetch is still in flight. */
	let fetched = $state<{ slug: string; lang: string; sections: DocumentSection[] } | undefined>(
		undefined
	);

	$effect(() => {
		const slug = data.slug;
		const want = targetLang;
		// The embedded copy already IS the wanted language — the common case
		// (no stored override), and the reason `+page.ts` picks `embeddedLang`
		// the way it does.
		if (want === data.embeddedLang) return;
		const manifest = data.manifestsByLang[want];
		if (!manifest) return;
		// `untrack`: this effect must depend on slug/target/manifest, NOT on
		// its own result, or assigning `fetched` below would re-trigger it.
		const have = untrack(() => fetched);
		if (have?.slug === slug && have.lang === want) return;

		let cancelled = false;
		getDocumentSectionsAsync(manifest.id).then((sections) => {
			// Discard a response the reader has already navigated away from, or
			// switched language again during — otherwise a slow first fetch can
			// land after a fast second one and overwrite it.
			if (!cancelled) fetched = { slug, lang: want, sections };
		});
		return () => {
			cancelled = true;
		};
	});

	/** Whether `fetched` is for what's currently being asked for; a stale
	 *  entry (wrong slug, or a language switched away from again) counts as
	 *  absent rather than as content. */
	const fetchedIsCurrent = $derived(
		fetched !== undefined && fetched.slug === data.slug && fetched.lang === targetLang
	);

	const lang = $derived(fetchedIsCurrent ? targetLang : (data.embeddedLang ?? preferred));
	const work = $derived(data.embeddedLang ? data.manifestsByLang[lang] : undefined);
	const current = $derived(
		work
			? {
					work,
					sections: fetchedIsCurrent ? fetched!.sections : (data.embeddedSections ?? [])
				}
			: undefined
	);

	/**
	 * Metadata to head the page with, which is NOT always the metadata of text
	 * that can be shown. A document whose every edition is withheld
	 * (`site/unpublished.json`) or simply not built has no `current` at all,
	 * and this page is now the only page it has — so the title, kind,
	 * promulgator and date come from the registry group directly in that case,
	 * and the body below becomes the takedown notice rather than prose. See
	 * `+page.ts`'s docblock: what a takedown withholds is the work, not the
	 * fact of it.
	 */
	const group = $derived(getDocumentGroup(data.slug));
	const fallbackManifest = $derived(
		group?.manifests[preferred] ?? Object.values(group?.manifests ?? {})[0]
	);
	const metaManifest = $derived(current?.work ?? fallbackManifest);
	const takedown = $derived(metaManifest ? unpublishedInfo(metaManifest.id) : undefined);

	// Structure trees are INDEX tier (eager-inlined, synchronous — corpus.ts's
	// "Documents" section), so unlike `current.sections` this needs no
	// `+page.ts` load step: it's read reactively here.
	const structureRows = $derived(current ? flattenDocumentStructure(current.work.id) : []);

	// Index structure rows by the section number they open at, so the template
	// can ask "which headings belong right before section N" in O(1) while it
	// walks `current.sections` in corpus order below. A single section number
	// can open more than one heading at once (a Part and its first Chapter
	// commonly share a start), and `flattenDocumentStructure` already yields
	// them in pre-order (ancestor before descendant), so appending to each
	// bucket in iteration order keeps them correctly nested without a sort.
	const headingsByStart = $derived.by(() => {
		const map = new Map<number, { node: StructureNode; depth: number }[]>();
		for (const row of structureRows) {
			const start = row.node.paragraphs[0];
			// Unnumbered front/back matter (docs/corpus-schema.md's null-bound
			// convention) has no section to anchor itself before — nothing wrong
			// with the node, just nowhere in the numbered flow it belongs.
			if (!Number.isFinite(start)) continue;
			const bucket = map.get(start as number);
			if (bucket) bucket.push(row);
			else map.set(start as number, [row]);
		}
		return map;
	});

	/**
	 * COMPARE MODE'S SECOND COLUMN — UNLIKE EVERY OTHER ROUTE THIS FEATURE
	 * TOUCHES, IT COSTS A REAL FETCH HERE, because this route embeds only ONE
	 * language (see `+page.ts`). Reuses the same `getDocumentSectionsAsync`
	 * call and the same "embedded text stays on screen while the fetch is in
	 * flight" posture as the language-switch effect above, but as a SEPARATE
	 * effect/state pair: compare mode wants both languages SIMULTANEOUSLY, not
	 * one replacing the other. Fetching a language the switch effect already
	 * fetched costs nothing — `corpus.ts`'s `readContent` memoizes by path.
	 */
	const otherEditions = $derived(
		Object.keys(data.manifestsByLang)
			.filter((l) => l !== lang)
			.map((l) => ({ lang: l, work: data.manifestsByLang[l] }))
	);
	const fallbackWorkId = $derived(otherEditions[0]?.work.id);

	adoptCompareFromUrl();

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			otherEditions.map((e) => e.work.id),
			fallbackWorkId
		)
	);
	/** Defined exactly when the reader's resolved preference names a language
	 *  this document actually has — which is also exactly when compare mode
	 *  should be on, so this doubles as `compareActive` below. */
	const secondaryLang = $derived(otherEditions.find((e) => e.work.id === secondaryWorkId)?.lang);
	const compareActive = $derived(secondaryLang !== undefined);

	let compareFetched = $state<
		{ slug: string; lang: string; sections: DocumentSection[] } | undefined
	>(undefined);

	$effect(() => {
		const slug = data.slug;
		const want = secondaryLang;
		if (!want) return;
		const manifest = data.manifestsByLang[want];
		if (!manifest) return;
		// `untrack`: depend on slug/want/manifest, not on this effect's own
		// result — same discipline the language-switch effect above uses.
		const have = untrack(() => compareFetched);
		if (have?.slug === slug && have.lang === want) return;

		let cancelled = false;
		getDocumentSectionsAsync(manifest.id).then((sections) => {
			if (!cancelled) compareFetched = { slug, lang: want, sections };
		});
		return () => {
			cancelled = true;
		};
	});

	/** `compareFetched` for the CURRENT slug/language, or `undefined` while
	 *  loading — stale-entry discipline mirrors `fetchedIsCurrent`. */
	const compareSecondarySections = $derived(
		compareFetched && compareFetched.slug === data.slug && compareFetched.lang === secondaryLang
			? compareFetched.sections
			: undefined
	);

	const compareRows = $derived(
		current && compareSecondarySections
			? alignByNumber(current.sections, compareSecondarySections)
			: []
	);

	// Part/Section headings read as the document's own top-level divisions;
	// Chapter/Article/Sub nest progressively smaller. `h1` is the document
	// title above, so this starts at `h2` rather than mirroring `kind` depth
	// 1-for-1 (a document's tree can run four levels deep, and HTML only has
	// five heading levels below `h1` to spend on it).
	function headingTag(kind: StructureNode['kind']): string {
		switch (kind) {
			case 'part':
			case 'section':
				return 'h2';
			case 'chapter':
				return 'h3';
			case 'article':
				return 'h4';
			case 'sub':
				return 'h5';
			default:
				// `prologue`/`in-brief` — the latter never appears in a document
				// tree (a CCC-only summarization device), the former rarely.
				return 'h3';
		}
	}

	/**
	 * Which section the reader has scrolled to. The whole document is one page,
	 * so there is no `n` in the URL to tell the sidebar where they are —
	 * without this the table of contents can only show top-level divisions and
	 * never marks or expands the one being read (see `structureToc.ts`'s
	 * `rowState`, whose `onPath` flag keys entirely off a current position).
	 *
	 * Fed the same `id="s{n}"` anchors the sections carry for `#s{n}` deep
	 * links, in corpus order — so the spy needs no separate registry and cannot
	 * disagree with what is actually on the page. Browser-only by construction
	 * (`useScrollSpy` runs inside `$effect`), so this changes nothing about the
	 * prerendered page.
	 */
	const spy = useScrollSpy(() =>
		(current?.sections ?? []).map((section) => [`s${section.n}`, section.n] as const)
	);

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles the document's language mid-read too.
	$effect(() => {
		if (current) setPosition(current.work.id, current.work.short_title, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{metaManifest?.short_title ?? metaManifest?.title ?? data.slug} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(section: DocumentSection)}
	<CccParagraphText paragraph={section} {lang} />
{/snippet}

{#snippet rightCell(section: DocumentSection)}
	<CccParagraphText paragraph={section} lang={secondaryLang ?? lang} />
{/snippet}

{#if metaManifest}
	{@const secondaryManifest = secondaryLang ? data.manifestsByLang[secondaryLang] : undefined}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/documenta">{t('nav.magisterium')}</a>
			</nav>

			<div class="title-row">
				<h1>{metaManifest.title}</h1>
				{#if current && otherEditions.length > 0}
					<div class="compare-toolbar">
						<CompareToggle active={compareActive} onclick={toggleCompare} />
					</div>
				{/if}
			</div>

			<p class="subtitle">
				<span class="doc-kind">{documentKindLabel(metaManifest.document_kind)}</span>
				<span class="sep">·</span>
				{metaManifest.pontiff_or_council}
				<span class="sep">·</span>
				<!-- Bare date, no "Promulgated" label — matching the /documents list.
				     In a subtitle already reading "Encyclical · Francis · <date>",
				     the only date a document has needs no naming. -->
				<time class="promulgated" datetime={metaManifest.promulgated}>
					{formatPromulgated(metaManifest.promulgated, lang)}
				</time>
			</p>

			{#if takedown}
				<UnpublishedNotice manifest={metaManifest} info={takedown} />
			{:else}
				<p class="copyright-notice"><CopyrightNotice manifest={metaManifest} /></p>
			{/if}

			{#if current}
				<!-- NARROW-SCREEN TABLE OF CONTENTS. Below 80rem `.reading-layout`
				     stops being a grid (app.css) and `.reading-aside` falls to the
				     bottom of the document — which on a 287-section encyclical is
				     past everything, i.e. nowhere. Before these routes merged, a
				     phone reader got the TOC first because the landing page WAS a
				     table of contents and the text lived one tap further on. This
				     restores that: the aside is hidden below 80rem and this takes
				     over, as plain markup rather than a second
				     `StructureSidebarToc` — that component owns fixed element ids
				     (`reading-toc-heading`) and rendering it twice would duplicate
				     them in one document. -->
				{#if structureRows.length > 0}
					<nav
						class="toc-inline"
						aria-label={t('document.tableOfContents')}
						data-link-preview="off"
					>
						<h2 class="toc-inline-heading">{t('document.tableOfContents')}</h2>
						<ol>
							{#each structureRows as { node, depth } (node.title + node.paragraphs.join('-'))}
								{@const anchor = node.paragraphs[0]}
								{@const dt = displayTitle(node, lang)}
								<li style={`--depth: ${depth}`} class={`kind-${node.kind}`}>
									{#if Number.isFinite(anchor)}
										<a href={`#s${anchor}`}>
											{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
											{dt.title}
										</a>
									{:else}
										<!-- Same null-bound convention as the CCC/Compendium
										     structure trees: unnumbered front/back matter the
										     structure knows about but no section number
										     addresses — nothing to link to. -->
										<span class="unlinked" title="No section number in this corpus">
											{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
											{dt.title}
										</span>
									{/if}
								</li>
							{/each}
						</ol>
					</nav>
				{/if}

				{#if compareActive && secondaryManifest && compareSecondarySections}
					<!-- Whole-document compare is section-by-section only — the
					     structure headings (`headingsByStart`) threaded through the
					     single-column view below are left out here rather than forced
					     into a two-column grid row of their own: a Part/Chapter title
					     is not a numbered unit `alignByNumber` can align, and the two
					     languages' structure trees can genuinely diverge in where they
					     fall (docs/decisions.md), so a heading row would need its own
					     alignment story this view doesn't need to solve today. The
					     section numbers in the margin still orient the reader. -->
					<CompareGrid
						rows={compareRows}
						leftLang={current.work.language}
						rightLang={secondaryManifest.language}
						leftLabel={current.work.short_title}
						rightLabel={secondaryManifest.short_title}
						left={leftCell}
						right={rightCell}
					>
						{#snippet rightHeaderExtra()}
							<ComparisonEditionMenu
								editions={otherEditions.map((e) => e.work)}
								current={secondaryWorkId}
								onselect={chooseComparisonEdition}
							/>
						{/snippet}
					</CompareGrid>
				{:else}
					{#if compareActive}
						<p class="compare-note">{t('compare.loading')}</p>
					{/if}
					<div class="reading-text document-body" lang={current.work.language}>
						{#each current.sections as section, i (section.n)}
							{#each headingsByStart.get(section.n) ?? [] as { node, depth } (node.title + node.paragraphs.join('-'))}
								{@const dt = displayTitle(node, lang)}
								<svelte:element
									this={headingTag(node.kind)}
									class="structure-heading"
									style={`--depth: ${depth}`}
								>
									{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
									{dt.title}
								</svelte:element>
							{/each}
							<section class="section" id={`s${section.n}`}>
								<!-- The number links to its own anchor: this is what a reader
								     copies to cite the section, and it is now the section's
								     only address — the per-section route it used to point at
								     is gone (see this file's header). -->
								<a
									class="section-n"
									href={`#s${section.n}`}
									aria-label={`§${section.n}`}
									data-link-preview="off"
								>
									{section.n}
								</a>
								<div class="section-text" class:drop-cap={i === 0}>
									<CccParagraphText paragraph={section} {lang} />
								</div>
							</section>
						{/each}
					</div>
				{/if}
			{/if}
		</article>

		{#if current}
			<!-- Omitted entirely in compare mode — see app.css's
			     `.reading-layout.compare` docblock — and below 80rem, where
			     `.toc-inline` above does this job instead. -->
			<aside class="reading-aside">
				<StructureSidebarToc
					structure={structureRows}
					currentN={spy.current}
					{lang}
					heading={t('document.tableOfContents')}
					linkMode="anchor"
				/>
			</aside>
		{/if}
	</div>
{/if}

<style>
	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
	}

	.title-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.title-row h1 {
		margin: 0 0 0.5rem;
	}

	.title-row .compare-toolbar {
		margin: 0;
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
		font-size: max(var(--font-size-min), 0.85em);
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
		margin: 0 0 2rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/* See the markup comment: this replaces the sidebar below the grid
	   breakpoint, where the aside would otherwise land past the whole text. */
	.toc-inline {
		margin: 0 0 2.5rem;
	}

	.toc-inline-heading {
		font-size: 1.1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.toc-inline ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.toc-inline li {
		padding: 0.4rem 0 0.4rem calc(var(--depth) * 1.25rem);
		border-bottom: 1px solid var(--color-border);
	}

	.toc-inline a {
		text-decoration: none;
		font-family: var(--font-serif);
	}

	.toc-inline .unlinked {
		font-family: var(--font-serif);
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	.toc-inline .kind-chapter a,
	.toc-inline .kind-chapter .unlinked {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.toc-inline .ordinal {
		color: var(--color-text-muted);
		margin-right: 0.35em;
	}

	@media (min-width: 80rem) {
		.toc-inline {
			display: none;
		}
	}

	@media (max-width: 79.99rem) {
		.reading-aside {
			display: none;
		}
	}

	/* Document body headings, threaded into the reading flow between sections
	   (see `headingsByStart`) — sized by level, never by literal `--depth`
	   indent: unlike the TOC's list rows, prose headings read better centred in
	   the measure than staircased across it. */
	.structure-heading {
		font-family: var(--font-serif);
		font-weight: 700;
		margin: 2.25rem 0 1rem;
		color: var(--color-text);
	}

	.structure-heading .ordinal {
		color: var(--color-text-muted);
		margin-right: 0.4em;
	}

	:global(h2.structure-heading) {
		font-size: 1.4rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	:global(h3.structure-heading) {
		font-size: 1.15rem;
	}

	:global(h4.structure-heading),
	:global(h5.structure-heading) {
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	/* Section numbers hang in the left margin where there's room for them,
	   exactly the CCC chapter reader's paragraph-reference treatment. */
	.section {
		position: relative;
		margin-bottom: 1.1rem;
	}

	.section-n {
		position: absolute;
		inset-inline-start: -3.25rem;
		top: 0.15em;
		width: 2.75rem;
		text-align: end;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.section-n:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	@media (max-width: 60rem) {
		.section-n {
			position: static;
			display: block;
			width: auto;
			text-align: start;
			margin-bottom: 0.15rem;
		}
	}
</style>
