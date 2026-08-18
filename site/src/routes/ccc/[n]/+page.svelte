<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { cccParagraphExists, flattenCccStructure } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { OUTLINE_KINDS } from '$lib/components/structureToc';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import { alignByNumber, withCompareParam } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { CccParagraph } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// `data.byLang` embeds every language the corpus has this paragraph in
	// (see +page.ts — the page is prerendered, so this can't be resolved
	// against a client preference at request time). `content.langFor` picks
	// which embedded language is active, reactively; fall back to whatever
	// language *is* embedded if the preferred one somehow isn't (only
	// possible against a partial fixture — the real corpus has both `ccc.en`
	// and `ccc.pt` complete for every paragraph).
	const availableLangs = $derived(Object.keys(data.byLang));
	const lang = $derived(
		data.byLang[content.langFor('catechism')] ? content.langFor('catechism') : availableLangs[0]
	);
	const current = $derived(data.byLang[lang]);

	/**
	 * Compare mode for a single paragraph: the CCC's own EN/PT language
	 * symmetry guarantee (docs/decisions.md — paragraph NUMBER sets match
	 * across languages) means a second language is almost always present, and
	 * `data.byLang` already embeds every language `+page.ts` found (its own
	 * docblock) — so, like the Bible chapter route, comparing here is free:
	 * no fetch, the second column's paragraph is already on the page.
	 */

	/** The other embedded language(s), paired with their `WorkManifest` — the
	 *  manifests are what `ComparisonEditionMenu` picks between and what
	 *  `compare.resolveTarget` checks a stored preference against (a work id,
	 *  never a bare language — see that store's docblock for why). */
	const otherEditions = $derived(
		availableLangs
			.filter((l) => l !== lang)
			.flatMap((l) => {
				const entry = data.byLang[l];
				return entry ? [{ lang: l, work: entry.work }] : [];
			})
	);
	/** Route's own choice with no reader override: the first other embedded
	 *  language, same pick this route always made before the preference
	 *  store existed. */
	const fallbackWorkId = $derived(otherEditions[0]?.work.id);

	// BROWSER-ONLY — see `bible/[book]/[chapter]/+page.svelte`'s `citedRange`
	// docblock: reading `page.url.searchParams` during prerendering throws.
	// A side effect, not a derived read, because this ADOPTS `?compare=…` into
	// the stored preference (`compare-pref.svelte.ts`) rather than answering
	// "is compare requested" for this render alone — see that module's
	// `syncFromUrl` docblock.
	$effect(() => {
		if (browser) compare.syncFromUrl(page.url);
	});

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			otherEditions.map((e) => e.work.id),
			fallbackWorkId
		)
	);
	const secondaryLang = $derived(otherEditions.find((e) => e.work.id === secondaryWorkId)?.lang);
	const secondary = $derived(secondaryLang ? data.byLang[secondaryLang] : undefined);
	const compareActive = $derived(current !== undefined && secondary !== undefined);

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

	// A single-paragraph comparison is still an `alignByNumber` call, not a
	// bespoke two-column special case: both sides carry the SAME paragraph
	// number `data.n` by construction (each is looked up by it in +page.ts),
	// so the result is always exactly one row when both languages exist —
	// but going through the shared function keeps this route consistent with
	// the chapter/multi-row callers rather than hand-rolling a degenerate
	// case that happens to look the same today.
	const compareRows = $derived(
		current && secondary ? alignByNumber([current.paragraph], [secondary.paragraph]) : []
	);

	// `related` cross-references may point outside whatever slice of the
	// corpus is actually present (always true for this fixture; possible
	// even for the real corpus if it's ever built/served partially) — only
	// link the ones we can actually resolve, and say so for the rest rather
	// than producing a dead link.
	function relatedExists(n: number): boolean {
		return cccParagraphExists(lang, n);
	}

	// The sidebar's own tree, recomputed whenever the reader switches content
	// language mid-read — same index-backed, no-fetch call `/ccc/+page.svelte`
	// makes for the full table of contents (`getCccStructure`'s flattened
	// sibling), just for whichever language is active here.
	const structure = $derived(flattenCccStructure(lang));

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles content language mid-read too, so "continue reading"
	// always points at the edition they were last actually looking at.
	$effect(() => {
		if (current) setPosition(current.work.id, `CCC ${data.n}`, page.url.pathname);
	});
</script>

<svelte:head>
	<title>CCC {data.n} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(paragraph: CccParagraph)}
	<CccParagraphText {paragraph} {lang} />
{/snippet}

{#snippet rightCell(paragraph: CccParagraph)}
	<CccParagraphText {paragraph} lang={secondaryLang ?? lang} />
{/snippet}

{#if current}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/catechismus">{t('nav.ccc')}</a>
				{#each current.breadcrumb as node (node.title)}
					{@const dt = displayTitle(node, lang)}
					<span class="sep">›</span>
					<a href={`/catechismus/${node.paragraphs[0]}`}>
						{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
						{dt.title}
					</a>
				{/each}
			</nav>

			<div class="title-row">
				<h1>
					{#if current.paragraph.in_brief}
						<span class="in-brief-tag">{t('ccc.inBrief')}</span>
					{/if}
					CCC {data.n}
				</h1>
				{#if otherEditions.length > 0}
					<div class="compare-toolbar">
						<CompareToggle active={compareActive} onclick={toggleCompare} />
					</div>
				{/if}
			</div>

			<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>

			{#if compareActive && secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={current.work.language}
					rightLang={secondary.work.language}
					leftLabel={current.work.short_title}
					rightLabel={secondary.work.short_title}
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
				<div class="reading-text ccc-body" lang={current.work.language}>
					<CccParagraphText paragraph={current.paragraph} {lang} />
				</div>
			{/if}

			{#if current.paragraph.related.length > 0}
				<p class="related">
					{t('ccc.related')}:
					{#each current.paragraph.related as n, i (n)}
						{#if i > 0}·{/if}
						{#if relatedExists(n)}
							<a href={`/catechismus/${n}`}>¶{n}</a>
						{:else}
							<span class="related-unresolved" title="Not in this fixture">¶{n}</span>
						{/if}
					{/each}
				</p>
			{/if}

			{#if current.chapter}
				{@const dt = displayTitle(current.chapter.node, lang)}
				<!--
				Reading a single paragraph is the citation case; this is the
				escape hatch to the reading case. The hash carries this
				paragraph's own number so the reader lands on the text they
				were already looking at rather than at the chapter's top,
				having lost their place as the price of getting context.
			-->
				<p class="read-chapter">
					<a href={`/catechismus/caput/${current.chapter.start}#p${data.n}`}>
						{t('ccc.readFullChapter')}
						<span class="chapter-name">
							{#if dt.ordinal}{dt.ordinal}{/if}
							{dt.title}
						</span>
						<span class="chapter-range">¶{current.chapter.start}–{current.chapter.end}</span>
					</a>
				</p>
			{/if}

			<nav class="paragraph-nav" aria-label="Paragraph navigation">
				{#if current.prev}
					<a href={`/catechismus/${current.prev.n}`} rel="prev"
						>&larr; {t('ccc.prevParagraph')} · ¶{current.prev.n}</a
					>
				{:else}
					<span></span>
				{/if}
				{#if current.next}
					<a href={`/catechismus/${current.next.n}`} rel="next"
						>{t('ccc.nextParagraph')} · ¶{current.next.n} &rarr;</a
					>
				{/if}
			</nav>
		</article>

		<!-- Hidden below 80rem, alongside `.reading-layout`'s own breakpoint
	     (app.css) — there is no pre-existing mobile presentation to preserve
	     here (this route had no chapter/TOC navigation in the reading view
	     before this sidebar existed), so the desktop-only addition is simply
	     absent on narrow viewports rather than duplicated like the Bible
	     picker. Omitted entirely in compare mode — see app.css's
	     `.reading-layout.compare` docblock. -->
		<aside class="reading-aside">
			<StructureSidebarToc
				{structure}
				currentN={data.n}
				{lang}
				heading={t('ccc.tableOfContents')}
				basePath="/catechismus"
				outlineKinds={OUTLINE_KINDS}
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

	.breadcrumb .ordinal {
		margin-right: 0.3em;
	}

	h1 {
		font-family: var(--font-serif);
		margin-top: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.title-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	.title-row h1 {
		margin: 0;
	}

	.title-row .compare-toolbar {
		margin: 0;
	}

	.copyright-notice {
		margin: 0 0 1rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.in-brief-tag {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 0.25rem;
		padding: 0.1rem 0.4rem;
	}

	.related {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.related a {
		color: var(--color-text-muted);
	}

	.related-unresolved {
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	.read-chapter {
		margin: 2rem 0 0;
		padding: 0.85rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-bg-elevated);
	}

	.read-chapter a {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		text-decoration: none;
	}

	.read-chapter .chapter-name {
		font-family: var(--font-serif);
		color: var(--color-text);
	}

	.read-chapter .chapter-range {
		margin-inline-start: auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.paragraph-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.95rem;
	}

	.paragraph-nav a {
		text-decoration: none;
	}

	/* No mobile counterpart exists to preserve (see the markup comment above
	   the aside) — below `.reading-layout`'s own breakpoint (app.css) this
	   simply isn't shown, rather than falling back to a plain block after
	   the text. */
	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
