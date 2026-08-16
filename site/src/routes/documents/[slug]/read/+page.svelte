<script lang="ts">
	/**
	 * A whole document in one page — the destination of the "read the full
	 * document" link on `/documents/[slug]` and on `/documents/[slug]/[n]` —
	 * the document-route analogue of `ccc/chapter/[n]/+page.svelte`. Same
	 * reasoning as that view: continuous prose, section numbers set in the
	 * margin the way `.para-n` does there, no per-section chrome. Each
	 * section keeps an `id="s{n}"` so `/documents/{slug}/read#s{n}` addresses
	 * a specific section within the document, and so the link back from a
	 * single section's own page can land the reader where they already were.
	 *
	 * Unlike a CCC chapter, a document's structure tree has real headings
	 * worth keeping in the flow (Parts, Chapters, Articles) rather than being
	 * one flat run of numbered sections — `headingsByStart` below threads
	 * `flattenDocumentStructure`'s rows back in immediately before the
	 * section each one starts at, so a long encyclical still reads with its
	 * own divisions intact instead of as an undifferentiated wall of prose.
	 */
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import { alignByNumber, withCompareParam } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import { useScrollSpy } from '$lib/scroll-spy.svelte';
	import { setPosition } from '$lib/reading-position';
	import { displayTitle } from '$lib/titles';
	import { content } from '$lib/content.svelte';
	import { flattenDocumentStructure, getDocumentSectionsAsync } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection, StructureNode } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * LANGUAGE SWITCHING ON A PAGE THAT ONLY EMBEDS ONE LANGUAGE.
	 *
	 * `+page.ts` embeds exactly one language's sections rather than every
	 * language's, because this route's payload is a whole document and the
	 * corpus's worst case runs ~558 KB raw per language — see that module's
	 * docblock for the full reasoning and for why `embeddedLang` is fixed at
	 * build time. The consequence lands here: the single-section routes can
	 * switch language by pure re-render, and this one cannot, because the
	 * other language's text simply isn't in the page.
	 *
	 * So a mismatch is resolved by fetching, through the same memoized
	 * `getDocumentSectionsAsync` the loader itself used. That read is free if
	 * the reader has already opened any single section of this document in
	 * that language (both paths cache the identical file), and costs one
	 * request otherwise.
	 *
	 * WHILE THE FETCH IS IN FLIGHT THE EMBEDDED TEXT STAYS ON SCREEN. Blanking
	 * the page or showing a spinner would trade a complete, readable document
	 * for an empty one in service of a preference the reader can already see
	 * is being applied — the text swaps when it arrives. This is the same
	 * "degrade, don't 404 a page with real content" posture the rest of the
	 * site takes for a missing edition.
	 *
	 * `preferred` may name a language this document has no edition of at all
	 * (a v1 EN/PT asymmetry), in which case there is nothing to fetch and
	 * nothing to switch to, and the embedded language stays — deliberately,
	 * rather than rendering an empty document for a language that doesn't
	 * exist.
	 */
	const preferred = $derived(content.documentLangFor(data.slug));
	const targetLang = $derived(data.manifestsByLang[preferred] ? preferred : data.embeddedLang);

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

	const lang = $derived(fetchedIsCurrent ? targetLang : data.embeddedLang);
	const work = $derived(data.manifestsByLang[lang]);
	const current = $derived(
		work
			? { work, sections: fetchedIsCurrent ? fetched!.sections : data.embeddedSections }
			: undefined
	);

	// Structure trees are INDEX tier (eager-inlined, synchronous — corpus.ts's
	// "Documents" section), so unlike `current.sections` this needs no
	// `+page.ts` load step: it's read reactively here, the same posture
	// `documents/[slug]/+page.svelte`'s own TOC already takes.
	const structureRows = $derived(current ? flattenDocumentStructure(current.work.id) : []);

	// Index structure rows by the section number they open at, so the
	// template can ask "which headings belong right before section N" in
	// O(1) while it walks `current.sections` in corpus order below. A single
	// section number can open more than one heading at once (a Part and its
	// first Chapter commonly share a start), and `flattenDocumentStructure`
	// already yields them in pre-order (ancestor before descendant), so
	// appending to each bucket in iteration order is enough to keep them in
	// the right nesting order without a separate sort.
	const headingsByStart = $derived.by(() => {
		const map = new Map<number, { node: StructureNode; depth: number }[]>();
		for (const row of structureRows) {
			const start = row.node.paragraphs[0];
			// Unnumbered front/back matter (docs/corpus-schema.md's null-bound
			// convention) has no section to anchor itself before — nothing
			// wrong with the node, just nowhere in the numbered flow it belongs.
			if (!Number.isFinite(start)) continue;
			const bucket = map.get(start as number);
			if (bucket) bucket.push(row);
			else map.set(start as number, [row]);
		}
		return map;
	});

	/**
	 * COMPARE MODE'S SECOND COLUMN — UNLIKE EVERY OTHER ROUTE THIS FEATURE
	 * TOUCHES, IT COSTS A REAL FETCH HERE. This route embeds only ONE
	 * language (see the module docblock above: the corpus's worst case runs
	 * 558 KB raw per language), so the second column is never already on the
	 * page the way it is on `/ccc/[n]`, `/compendium/[n]` or
	 * `/documents/[slug]/[n]`. This reuses the exact `getDocumentSectionsAsync`
	 * call and the same "the embedded text stays on screen while the fetch is
	 * in flight" posture the language-switch effect above already
	 * established — but as a SEPARATE effect/state pair, because compare mode
	 * wants the primary and secondary language SIMULTANEOUSLY, not one
	 * replacing the other the way a language switch does. (Fetching the
	 * SAME language the switch effect already fetched costs nothing extra:
	 * `corpus.ts`'s `readContent` memoizes by file path, so asking for an
	 * already-fetched language's sections a second time resolves instantly
	 * from that cache rather than issuing a second request.)
	 */
	/** Every OTHER language this document has a manifest for at all (not just
	 *  the one embedded on this page — see the module docblock above: this
	 *  route only ever embeds one language's sections, so "available to
	 *  compare against" has to be read from `data.manifestsByLang`, not from
	 *  what's already on the page). Paired with the manifest itself, same
	 *  shape as every other route's `otherEditions` — see `/ccc/[n]`'s
	 *  identical block for the full reasoning. */
	const otherEditions = $derived(
		Object.keys(data.manifestsByLang)
			.filter((l) => l !== lang)
			.map((l) => ({ lang: l, work: data.manifestsByLang[l] }))
	);
	const fallbackWorkId = $derived(otherEditions[0]?.work.id);

	// BROWSER-ONLY side effect — see `bible/[book]/[chapter]/+page.svelte`'s
	// `citedRange` docblock and `compare-pref.svelte.ts`'s `syncFromUrl`.
	$effect(() => {
		if (browser) compare.syncFromUrl(page.url);
	});

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			otherEditions.map((e) => e.work.id),
			fallbackWorkId
		)
	);
	/** Defined exactly when the reader's resolved preference names a language
	 *  this document actually has — which is also exactly when compare mode
	 *  should be on, so this doubles as `compareActive` below rather than
	 *  needing a second, redundant flag. */
	const secondaryLang = $derived(otherEditions.find((e) => e.work.id === secondaryWorkId)?.lang);
	const compareActive = $derived(secondaryLang !== undefined);

	function toggleCompare() {
		compare.toggle();
		goto(withCompareParam(page.url, compare.paramValue), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function chooseComparisonEdition(id: string) {
		compare.set(id);
		goto(withCompareParam(page.url, compare.paramValue), {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

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
		// result — same discipline the language-switch effect above uses, and
		// for the same reason (assigning `compareFetched` below must not
		// re-trigger this effect).
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
	 *  loading (or not yet requested) — stale-entry discipline mirrors
	 *  `fetchedIsCurrent` above. */
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
	// title above, so this starts at `h2` rather than mirroring `kind`
	// depth 1-for-1 (a document's tree can run four levels deep, and HTML
	// only has five heading levels below `h1` to spend on it).
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
	 * Which section the reader has scrolled to. The whole document is one
	 * page here, so unlike every single-section route there is no `n` in the
	 * URL to tell the sidebar where they are — without this the table of
	 * contents can only show the document's top-level divisions and never
	 * marks or expands the one being read (see `structureToc.ts`'s
	 * `isExpanded`, which keys entirely off a current position).
	 *
	 * Fed the same `id="s{n}"` anchors the sections already carry for
	 * `#s{n}` deep links, in corpus order — so the spy needs no separate
	 * registry and cannot disagree with what is actually on the page.
	 * Browser-only by construction (`useScrollSpy` runs inside `$effect`),
	 * so this changes nothing about the prerendered page.
	 */
	const spy = useScrollSpy(() =>
		(current?.sections ?? []).map((section) => [`s${section.n}`, section.n] as const)
	);

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles the document's language mid-read too, same as
	// `ccc/chapter/[n]` and `documents/[slug]/[n]`.
	$effect(() => {
		if (current) setPosition(current.work.id, current.work.short_title, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{current?.work.short_title ?? data.slug} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(section: DocumentSection)}
	<CccParagraphText paragraph={section} {lang} />
{/snippet}

{#snippet rightCell(section: DocumentSection)}
	<CccParagraphText paragraph={section} lang={secondaryLang ?? lang} />
{/snippet}

{#if current}
	{@const secondaryManifest = secondaryLang ? data.manifestsByLang[secondaryLang] : undefined}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/documents">{t('nav.magisterium')}</a>
				<span class="sep">›</span>
				<a href={`/documents/${data.slug}`}>{current.work.short_title}</a>
			</nav>

			<div class="title-row">
				<h1>{current.work.title}</h1>
				{#if otherEditions.length > 0}
					<div class="compare-toolbar">
						<CompareToggle active={compareActive} onclick={toggleCompare} />
					</div>
				{/if}
			</div>

			<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>

			{#if compareActive && secondaryManifest && compareSecondarySections}
				<!-- Whole-document compare is section-by-section only — the
				     structure headings (`headingsByStart`) threaded through the
				     single-column view below are left out here rather than forced
				     into a two-column grid row of their own: a Part/Chapter title
				     is not a numbered unit `alignByNumber` can align, and the two
				     languages' structure trees can genuinely diverge in where they
				     fall (docs/decisions.md), so a heading row would need its own
				     alignment story this view doesn't need to solve today. The
				     section numbers in the margin (`/documents/{slug}/{n}`, via
				     each cell's own text) still orient the reader without them. -->
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
							<!-- The number is a link back to the section's own page: this
							     view is for reading, that one for citing and cross-linking,
							     same split as `ccc/chapter/[n]`'s `.para-n`. -->
							<a
								class="section-n"
								href={`/documents/${data.slug}/${section.n}`}
								aria-label={`§${section.n}`}
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
		</article>

		<!-- Omitted entirely in compare mode — see app.css's
		     `.reading-layout.compare` docblock. -->
		<aside class="reading-aside">
			<StructureSidebarToc
				structure={structureRows}
				currentN={spy.current}
				{lang}
				heading={t('document.tableOfContents')}
				linkMode="anchor"
			/>
		</aside>
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

	.breadcrumb .sep {
		margin: 0 0.35em;
	}

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

	.copyright-notice {
		margin: 0 0 2rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/* Document body headings, threaded into the reading flow between
	   sections (see `headingsByStart` above) — sized by level, never by
	   literal `--depth` indent: unlike the TOC's list rows, prose headings
	   read better centred in the measure than staircased across it. */
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
	   exactly `ccc/chapter/[n]`'s `.para`/`.para-n` treatment — a document
	   reads the same way the Catechism does once it's a continuous page
	   rather than one-section-at-a-time. */
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
