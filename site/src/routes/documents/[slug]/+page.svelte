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
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import { alignByNumber } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { useScrollSpy } from '$lib/scroll-spy.svelte';
	import { setPosition } from '$lib/reading-position';
	import { displayDocumentTitle, inlineTitleNodes } from '$lib/titles';
	import InlineText from '$lib/components/InlineText.svelte';
	import { documentKindLabel } from '$lib/document-labels';
	import { formatPromulgated } from '$lib/dates';
	import { content } from '$lib/content.svelte';
	import {
		flattenDocumentStructure,
		documentOutline,
		getDocumentGroup,
		getDocumentSectionsAsync,
		unpublishedInfo
	} from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentSection, DocumentNode } from '$lib/types';
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

	// The shared sidebar walks `children` and reads `paragraphs`, so it gets
	// the derived nested outline rather than the flat corpus rows the inline
	// table of contents renders. See `documentOutline` in corpus.ts.
	const sidebarRows = $derived(
		current ? documentOutline(current.work.id).map((node) => ({ node, depth: 0 })) : []
	);

	// Index structure rows by the section number they open at, so the template
	// can ask "which headings belong right before section N" in O(1) while it
	// walks `current.sections` in corpus order below. A single section number
	// can open more than one heading at once (a Part and its first Chapter
	// commonly share a start), and `flattenDocumentStructure` already yields
	// them in pre-order (ancestor before descendant), so appending to each
	// bucket in iteration order keeps them correctly nested without a sort.
	type StructureRow = { node: DocumentNode; depth: number; anchor: string };

	function indexByStart(rows: StructureRow[]): Map<number, StructureRow[]> {
		const map = new Map<number, StructureRow[]>();
		for (const row of rows) {
			const start = row.node.before;
			// Unnumbered front/back matter (docs/corpus-schema.md's null-bound
			// convention) has no section to anchor itself before — nothing wrong
			// with the node, just nowhere in the numbered flow it belongs.
			if (!Number.isFinite(start)) continue;
			const bucket = map.get(start as number);
			if (bucket) bucket.push(row);
			else map.set(start as number, [row]);
		}
		return map;
	}

	const headingsByStart = $derived(indexByStart(structureRows));

	/*
	 * Which sections open a division big enough to earn an illuminated
	 * initial. A document is one page, so unlike the CCC's chapter view — one
	 * chapter per page, one cap at the top — capping only `sections[0]` gives
	 * a nine-chapter constitution a single initial on page one and nothing at
	 * any chapter after it.
	 *
	 * The tier is `headingTag`'s: the kinds it sets as h2 or h3 (part,
	 * section, chapter, and the prologue that falls through to h3) open a
	 * division; article and sub do not. Deriving it from the same function
	 * keeps the two from drifting — a cap marks exactly what the document
	 * prints as a major heading. Measured against the corpus, that is one cap
	 * for 301 of 339 documents (they have no chapter-level structure at all),
	 * up to 18 for Gaudium et Spes, which really does have two parts, nine
	 * chapters and seven sections.
	 */
	const DIVISION_TAGS = new Set(['h2', 'h3']);
	const divisionStarts = $derived.by(() => {
		const out = new Set<number>();
		for (const [start, rows] of headingsByStart) {
			if (rows.some((row) => DIVISION_TAGS.has(headingTag(row.node.level)))) out.add(start);
		}
		return out;
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

	/**
	 * THE SECOND COLUMN'S OWN DIVISIONS. Compare mode used to render sections
	 * only, dropping every Part/Chapter/Article heading on the grounds that a
	 * heading is not a number `alignByNumber` can align. That was true of the
	 * heading and false of the document: a nine-chapter constitution became one
	 * undifferentiated run of prose, which is the state the single-column
	 * reader's `headingsByStart` exists to prevent.
	 *
	 * A heading does carry a number — `before`, the section it opens at — and
	 * that is a perfectly good key. So each language's structure tree is
	 * indexed on it independently and a band is emitted wherever EITHER has
	 * one, which is the same union-and-leave-a-gap rule `alignByNumber` applies
	 * to the sections themselves. That matters because the two trees genuinely
	 * do diverge in where they fall (docs/decisions.md): a band with one side
	 * empty says so honestly, where forcing the pair to agree would have to
	 * invent a heading or hide one.
	 *
	 * Structure is INDEX tier, so the second language's tree is read
	 * synchronously here — unlike its SECTIONS, which cost the fetch above.
	 */
	const secondaryStructureRows = $derived(
		secondaryWorkId && compareActive ? flattenDocumentStructure(secondaryWorkId) : []
	);
	const secondaryHeadingsByStart = $derived(indexByStart(secondaryStructureRows));

	/** Where the masthead band rides — see `compareHeadingsLeft`. `undefined`
	 *  for a document with no sections, which is also a document with no grid
	 *  to put a band in. */
	const firstSectionN = $derived(current?.sections[0]?.n);
	const hasMasthead = $derived(
		Boolean(
			current?.work.header ||
			(secondaryLang ? data.manifestsByLang[secondaryLang]?.header : undefined)
		)
	);

	// Part/Section headings read as the document's own top-level divisions;
	// Chapter/Article/Sub nest progressively smaller. `h1` is the document
	// title above, so this starts at `h2` rather than mirroring `kind` depth
	// 1-for-1 (a document's tree can run four levels deep, and HTML only has
	// five heading levels below `h1` to spend on it).
	function headingTag(level: number): string {
		// The document's own <h1> is its title, so a level-1 heading is an h2
		// and so on, clamped at h6. `level` is contiguous per document
		// (docs/corpus-schema.md, amended 2026-08-21), so this no longer has
		// to map a taxonomy onto a depth — the depth is what was recorded.
		return `h${Math.min(level + 1, 6)}`;
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
	 * initial render.
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

<!--
	The document's own divisions, threaded into the reading flow immediately
	before the section each one starts at. One snippet for all three callers —
	the single-column reader and compare mode's two columns — so a heading is
	typeset the same wherever it appears.

	`withIds` is false for the SECOND column only, and the reason is that
	`documentHeadingAnchor` numbers headings by their index into one flat
	structure array (corpus.ts): the Portuguese tree's fourth heading is `h3`
	just as the English tree's is, so emitting both would put a duplicate id on
	the page. The primary edition keeps them, which is what the inline table of
	contents and the sidebar — both built from the primary work's rows — link
	into.
-->
{#snippet structureHeadings(rows: StructureRow[], hlang: string, withIds: boolean)}
	{#each rows as { node, depth, anchor } (anchor)}
		{@const dt = displayDocumentTitle(node.title, hlang)}
		<svelte:element
			this={headingTag(node.level)}
			id={withIds ? anchor : undefined}
			class="structure-heading"
			style={`--depth: ${depth}`}
		>
			<!-- Identifier, name and subtitle are three printed lines of ONE
			     heading (docs/corpus-schema.md). The corpus keeps them apart
			     precisely so they can be typeset apart here; folding them into one
			     string is what a reader's table of contents used to show as three
			     separate rows. -->
			{#if node.ident}<span class="heading-ident">{node.ident}</span>{/if}
			{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
			<!-- `title_html` keeps the emphasis the source set inside the heading —
			     an encyclical name, a scripture reference, a Latin phrase. Absent
			     on the great majority, where this renders the plain title
			     unchanged. -->
			<span class="heading-name"
				><InlineText nodes={inlineTitleNodes(node.title, node.title_html, hlang)} /></span
			>
			{#if node.subtitle}<span class="heading-subtitle"
					>{displayDocumentTitle(node.subtitle, hlang).title}</span
				>{/if}
		</svelte:element>
	{/each}
{/snippet}

<!--
	THE MASTHEAD RIDES IN THE GRID, NOT IN THE HEADER BLOCK.

	It used to be the last field of `.compare-unit-header`, stacked under the
	title, subtitle, copyright and picker, and between them they put roughly
	440px of chrome between the top of the page and the document's first word.
	But the masthead is not chrome: it is TEXT FROM THE SOURCE, scraped
	verbatim (`narrow_html` in pipeline/scrapers/vatican_docs.py) and
	translated — "ENCYCLICAL LETTER" against "CARTA ENCÍCLICA" is precisely the
	kind of divergence compare mode exists to show. Everything above it is our
	metadata ABOUT the document.

	So it moves across the boundary those two categories should be separated
	by: it now opens the first band of the aligned grid, under the same
	divider, in the same two columns, as the text it introduces. The header
	block shrinks to title, one metadata line and the copyright notices, and
	the page reaches its first word far sooner.

	It rides the first section's band rather than getting a row of its own,
	because that band already means "everything that precedes this section" —
	which the document's own title page does, ahead of any Part or Chapter
	heading that also opens there.
-->
{#snippet compareHeadingsLeft(n: number)}
	{#if current?.work.header && n === firstSectionN}
		<div class="document-masthead">{@html current.work.header}</div>
	{/if}
	{@render structureHeadings(headingsByStart.get(n) ?? [], lang, true)}
{/snippet}

{#snippet compareHeadingsRight(n: number)}
	{@const secondaryHeader = secondaryLang ? data.manifestsByLang[secondaryLang]?.header : undefined}
	{#if secondaryHeader && n === firstSectionN}
		<div class="document-masthead">{@html secondaryHeader}</div>
	{/if}
	{@render structureHeadings(secondaryHeadingsByStart.get(n) ?? [], secondaryLang ?? lang, false)}
{/snippet}

<!-- What identifies the second column in `ReadingBar` — see that component
     for why this is the route's to supply and not its own. -->
{#snippet comparisonEdition()}
	<ComparisonEditionMenu
		editions={otherEditions.map((e) => e.work)}
		current={secondaryWorkId}
		onselect={chooseComparisonEdition}
	/>
{/snippet}

{#if metaManifest}
	{@const secondaryManifest = secondaryLang ? data.manifestsByLang[secondaryLang] : undefined}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/documenta">{t('nav.magisterium')}</a>
				</nav>
			</div>

			<!-- Edition, comparison, bookmark and print, in that order and in both
			     modes — see `ReadingBar`. Everything it carries used to be spread
			     across this breadcrumb row, the title row below and the site
			     header. -->
			<ReadingBar
				bookmarkHref={`/documenta/${data.slug}`}
				canCompare={current !== undefined && otherEditions.length > 0}
				{compareActive}
				onToggleCompare={toggleCompare}
				comparison={comparisonEdition}
			/>

			{#if current && compareActive && secondaryManifest}
				<!-- Compare mode's header is per-language: the subtitle and the
				     copyright notice both differ by edition, so a single
				     primary-language-only block was always showing the second column
				     a header that wasn't its own. Tracks match `.compare-row` so it
				     lines up with the aligned rows beneath it.

				     WHAT IS NO LONGER HERE: the two edition pickers, which moved to
				     the sticky bar, and the source masthead, which moved into the
				     grid (see `compareHeadingsLeft` above for why it belongs on the
				     content side of that boundary). Between them they were most of
				     this block's height.

				     ONE ROW PER FIELD, not one column per language — see
				     `.compare-unit-header` in app.css. The TITLE is why: an
				     encyclical is addressed by its Latin incipit, which is the same
				     string in every language, so this used to set `Magnifica
				     Humanitas` as an `<h1>` twice, side by side, above a subtitle
				     that genuinely did differ. Nothing here decides that centrally;
				     the field simply asks whether the two strings match. -->
				<div class="compare-unit-header">
					{#if current.work.title === secondaryManifest.title}
						<!-- No `lang`: an identical pair has no one language to claim,
						     and asserting the primary edition's would be a small lie
						     about a Latin incipit in particular. -->
						<div class="compare-unit-field compare-unit-field-shared">
							<h1>{current.work.title}</h1>
						</div>
					{:else}
						<div class="compare-unit-field compare-unit-field-left" lang={current.work.language}>
							<h1>{current.work.title}</h1>
						</div>
						<div
							class="compare-unit-field compare-unit-field-right"
							lang={secondaryManifest.language}
						>
							<h1>{secondaryManifest.title}</h1>
						</div>
					{/if}

					<!-- The subtitle is compared as a whole and always splits in
					     practice: the kind badge is an interface-language label and so
					     matches, but the pontiff's name and the promulgation date are
					     both translated. Splitting the line further to collapse the
					     badge alone would turn one line into two and cost more height
					     than the duplicate badge does. -->
					<div class="compare-unit-field compare-unit-field-left" lang={current.work.language}>
						<p class="subtitle">
							<span class="doc-kind">{documentKindLabel(current.work.document_kind)}</span>
							<span class="sep">·</span>
							{current.work.pontiff_or_council}
							<span class="sep">·</span>
							<time class="promulgated" datetime={current.work.promulgated}>
								{formatPromulgated(current.work.promulgated, current.work.language)}
							</time>
						</p>
					</div>
					<div
						class="compare-unit-field compare-unit-field-right"
						lang={secondaryManifest.language}
					>
						<p class="subtitle">
							<span class="doc-kind">{documentKindLabel(secondaryManifest.document_kind)}</span>
							<span class="sep">·</span>
							{secondaryManifest.pontiff_or_council}
							<span class="sep">·</span>
							<time class="promulgated" datetime={secondaryManifest.promulgated}>
								{formatPromulgated(secondaryManifest.promulgated, secondaryManifest.language)}
							</time>
						</p>
					</div>

					<!-- Never collapsed, even though both editions print the same
					     words: the two notices link to DIFFERENT vatican.va pages, and
					     that link is the checkable part (`CopyrightNotice.svelte`). -->
					<div class="compare-unit-field compare-unit-field-left" lang={current.work.language}>
						<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>
					</div>
					<div
						class="compare-unit-field compare-unit-field-right"
						lang={secondaryManifest.language}
					>
						<p class="copyright-notice"><CopyrightNotice manifest={secondaryManifest} /></p>
					</div>
				</div>
			{:else}
				<h1>{metaManifest.title}</h1>

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

				<!-- The source page's own masthead, verbatim per language.
				     `{@html}` is safe here specifically: this string is produced by
				     the scraper's closed tag allowlist (i/b/br/sup/blockquote), not
				     passed through from the source -- see `narrow_html` in
				     pipeline/scrapers/vatican_docs.py. -->
				{#if current?.work.header}
					<div class="document-masthead" lang={current.work.language}>
						{@html current.work.header}
					</div>
				{/if}
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
							{#each structureRows as { node, depth, anchor } (anchor)}
								{@const dt = displayDocumentTitle(node.title, lang)}
								{@const titleNodes = inlineTitleNodes(node.title, node.title_html, lang)}
								<li style={`--depth: ${depth}`} class={`level-${node.level}`}>
									<!-- `before` decides whether this heading is RENDERED at all
									     (`headingsByStart` drops the unanchored ones), but the link
									     goes to the heading's own id, not to `#s{before}` — the
									     section behind it. Same rule as the sidebar; the two tables
									     of contents on this page must not address differently. -->
									{#if Number.isFinite(node.before)}
										<a href={`#${anchor}`}>
											{#if node.ident}<span class="ordinal">{node.ident}</span>{/if}
											{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
											<InlineText nodes={titleNodes} />
										</a>
									{:else}
										<!-- Same null-bound convention as the CCC/Compendium
										     structure trees: unnumbered front/back matter the
										     structure knows about but no section number
										     addresses — nothing to link to. -->
										<span class="unlinked" title="No section number in this corpus">
											{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
											<InlineText nodes={titleNodes} />
										</span>
									{/if}
								</li>
							{/each}
						</ol>
					</nav>
				{/if}

				{#if compareActive && secondaryManifest && compareSecondarySections}
					<!-- `interlude` carries the structure headings across into compare
					     mode. They used to be dropped here, on the grounds that a
					     Part/Chapter title is not a numbered unit `alignByNumber` can
					     align — true of the heading, false of the document: a
					     nine-chapter constitution read as one undifferentiated run of
					     prose, exactly what `headingsByStart` exists to prevent in the
					     single-column view below. A heading does carry `before`, the
					     section it opens at, and that aligns fine; the two languages'
					     trees genuinely diverging (docs/decisions.md) is handled the
					     same way a diverging section is, by emitting the band wherever
					     EITHER side has one and leaving the other column empty. -->
					<!-- `anchorId` restores the `s{n}` addresses the single-column
					     branch below carries: a `#s42` deep link, and the scroll spy
					     driving the sidebar at >= 100rem, both had nothing to find
					     while comparing. Same `§{n}` label and same canonical address
					     as the margin number down there, from one place. -->
					<CompareGrid
						rows={compareRows}
						leftLang={current.work.language}
						rightLang={secondaryManifest.language}
						leftLabel={current.work.short_title}
						rightLabel={secondaryManifest.short_title}
						left={leftCell}
						right={rightCell}
						unit={(n) => ({
							href: `#s${n}`,
							canonicalHref: `/documenta/${data.slug}#s${n}`,
							label: `§${n}`,
							anchorId: `s${n}`
						})}
						interlude={{
							has: (n) =>
								(hasMasthead && n === firstSectionN) ||
								headingsByStart.has(n) ||
								secondaryHeadingsByStart.has(n),
							left: compareHeadingsLeft,
							right: compareHeadingsRight
						}}
					/>
				{:else}
					{#if compareActive}
						<p class="compare-note">{t('compare.loading')}</p>
					{/if}
					<div class="reading-text document-body" lang={current.work.language}>
						{#each current.sections as section, i (section.n)}
							{@render structureHeadings(headingsByStart.get(section.n) ?? [], lang, true)}
							{@const sectionHref = `/documenta/${data.slug}#s${section.n}`}
							<section
								class="section"
								id={`s${section.n}`}
								class:bookmarked={bookmarks.has(sectionHref)}
							>
								<!-- The number links to its own anchor: this is what a reader
								     copies to cite the section, and it is now the section's
								     only address — the per-section route it used to point at
								     is gone (see this file's header). It used to be a
								     hand-rolled `<a class="section-n">` carrying a near-verbatim
								     copy of ReferenceNumber's margin CSS; sharing the component
								     is what stops the two drifting, which is the reason that
								     component's docblock gives for owning this treatment. -->
								<ReferenceNumber
									n={section.n}
									href={`#s${section.n}`}
									canonicalHref={sectionHref}
									label={`§${section.n}`}
									placement="margin"
								/>
								<div class="section-text">
									<CccParagraphText
										paragraph={section}
										{lang}
										dropCap={i === 0 || divisionStarts.has(section.n)}
									/>
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
					structure={sidebarRows}
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

	.subtitle {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		margin: 0 0 0.5rem;
	}

	/* The source's own masthead. Set quieter than the reading text and
	   centred the way the printed page sets it, so it reads as the
	   document's title page rather than as its first paragraph. */
	.document-masthead {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.5;
		text-align: center;
		text-wrap: balance;
		margin: 1.25rem 0 1.5rem;
	}

	/* The grid, its tracks and its divider are `.compare-unit-header`/
	   `.compare-unit-field` (app.css) — shared with every other route that
	   merges a compare header the same way. This only tunes the vertical
	   spacing of what THIS route puts in each field. */
	.compare-unit-field h1 {
		margin: 0 0 0.5rem;
	}

	.compare-unit-field .subtitle {
		margin: 0 0 0.5rem;
	}

	.compare-unit-field .copyright-notice {
		margin: 0 0 0.75rem;
	}

	.compare-unit-field :global(.menu) {
		margin-bottom: 0.5rem;
	}

	.compare-unit-field .document-masthead {
		margin-top: 1rem;
		margin-bottom: 0;
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

	/*
	 * The inline table of contents stands in for the sidebar wherever the
	 * sidebar isn't, and compare mode moves that boundary. Normally the aside
	 * arrives at 80rem and this yields to it; while comparing, the aside is
	 * suppressed until 100rem (app.css, `.reading-layout.compare >
	 * .reading-aside`), and hiding this at 80rem regardless left a 20rem band
	 * where a 287-section encyclical had NO navigation at all — no sidebar, no
	 * inline list. So the handover width follows whichever one is actually
	 * coming back.
	 */
	@media (min-width: 80rem) {
		.reading-layout:not(.compare) .toc-inline {
			display: none;
		}
	}

	@media (min-width: 100rem) {
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

	/* The identifier sits ABOVE the name, smaller and quieter, the way the
	   source prints it — it names the division's place in a sequence, not its
	   subject, and reading it inline with the title makes one long shout. The
	   subtitle sits below on its own line for the mirror reason. */
	.structure-heading .heading-ident {
		display: block;
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: 0.35rem;
	}

	.structure-heading .heading-subtitle {
		display: block;
		font-size: 0.85em;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-top: 0.3rem;
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

	/* The reader's own mark; the number carries the same colour
	   (ReferenceNumber's `.bookmarked`). */
	.section.bookmarked {
		background: color-mix(in srgb, var(--color-bookmark) 12%, transparent);
		border-radius: 0.25rem;
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
	}
</style>
