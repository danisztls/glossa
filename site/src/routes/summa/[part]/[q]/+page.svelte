<script lang="ts">
	/**
	 * One question of the Summa, with its articles as fragments on the page
	 * (`#a3`) rather than pages of their own — the same choice documents made
	 * in 2026-08-17 and for the same reason: 3,113 addresses for one article
	 * of text each buys nothing a fragment does not.
	 *
	 * THIS ROUTE IS THE SAME SHAPE AS EVERY OTHER READER, and was not always.
	 * It was built standalone and drifted: no `ReadingBar` (so the edition
	 * picker existed but nothing rendered it, and the Latin was unreachable),
	 * no `.reading-text` wrapper (so the serif reading face and the reader's
	 * own text-size adjustment silently did nothing here), a bespoke `.pager`
	 * where the shared `.unit-nav` belongs, a duplicated `.breadcrumb` block,
	 * a copyright notice at the foot instead of under the title, and no
	 * compare mode. All of that is now the shared primitives; what remains
	 * genuinely particular to this work is below.
	 *
	 * The edition is picked here rather than in `load`, because the URL is
	 * edition-free and the reader's preference can change without a
	 * navigation. What makes this page different from every other reader is
	 * that the preference may not be satisfiable AT ALL: the Summa has no
	 * Portuguese edition and will not before 2055, and the Latin has no
	 * Supplement. `useEditionCompare` already resolves exactly that — the
	 * reader's language if this address has it, else whatever the address
	 * does have — so the fallback needs no separate implementation here; it
	 * only needs SAYING, which `fellBack` below does.
	 *
	 * COMPARE MODE ALIGNS BY ARTICLE. Every other pair the grid aligns is two
	 * translations of one numbered unit; so is this, one level down from the
	 * address in the URL. The two editions agree on article numbering
	 * throughout the parts they share (the cross-language oracle checked it),
	 * and where they do not, `alignByNumber` leaves the gap visible rather
	 * than sliding the columns past each other. It is offered only on a
	 * question that HAS articles: the two article-less questions (I q. 71,
	 * q. 72) hang their divisions off the question itself, and a division has
	 * no number the two editions could be aligned on.
	 */
	import { page } from '$app/state';
	import { content } from '$lib/content.svelte';
	import {
		compareColumnLabel,
		languageDisplayName,
		listSummaQuestions,
		summaHeadingsForPart,
		summaTitleFor
	} from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import { setPosition } from '$lib/reading-position';
	import { alignByNumber } from '$lib/compare';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { useEditionCompare } from '$lib/edition-compare.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import InlineProse from '$lib/components/InlineProse.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
	import SummaDivisions from '$lib/components/SummaDivisions.svelte';
	import SummaSidebarToc from '$lib/components/SummaSidebarToc.svelte';
	import { summaTitleParts } from '$lib/summa-titles';
	import { summaPartSlug } from '$lib/route-manifest';
	import type { SummaArticle } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const preferred = $derived(content.langFor('summa'));

	const editions = useEditionCompare(
		() => data.byLang,
		() => preferred
	);

	adoptCompareFromUrl();

	/**
	 * Said plainly, not inferred from the text being in another language. The
	 * two reasons a reader lands on an edition they did not ask for are
	 * different enough to name separately: no Portuguese edition exists at
	 * all, or this particular part has no Latin.
	 */
	const fellBack = $derived(editions.current !== undefined && editions.lang !== preferred);

	const partSlug = $derived(summaPartSlug(data.part));
	const question = $derived(editions.current?.question);
	const named = $derived(summaTitleFor(editions.lang, data.part, data.n));

	/**
	 * The sidebar's outline, taken from the SHOWN edition rather than the
	 * preferred one. On the Supplement that is the difference between a Latin
	 * reader seeing the English part they are actually reading and seeing an
	 * outline for a part their preferred edition does not have.
	 */
	const headings = $derived(
		summaHeadingsForPart(editions.lang, data.part).filter((row) => row.level > 1)
	);
	const partQuestions = $derived(
		listSummaQuestions(editions.lang).filter((q) => q.part === data.part)
	);
	const articleNumbers = $derived((question?.articles ?? []).map((a) => a.n));

	// A question with no articles has nothing `alignByNumber` can align — see
	// the module docblock.
	const canCompare = $derived(editions.others.length > 0 && articleNumbers.length > 0);
	const compareActive = $derived(canCompare && editions.compareActive);

	const compareRows = $derived(
		compareActive && editions.current && editions.secondary
			? alignByNumber(editions.current.question.articles, editions.secondary.question.articles)
			: []
	);

	// The prologue divides the articles rather than being one of them, so it
	// rides above the first row as an `interlude` — the same slot the document
	// reader's Part/Chapter headings use.
	const firstArticleN = $derived(articleNumbers[0]);

	/**
	 * An article's title, borrowed from the other column when this edition
	 * prints none — the Latin prints neither question nor article titles
	 * (`summaTitleFor`'s docblock). Free here, unlike in the index tier: both
	 * editions' articles are already embedded in `byLang`.
	 */
	function articleTitle(article: SummaArticle, lang: string) {
		if (article.title) return { title: article.title, lang, borrowed: false };
		for (const other of Object.values(data.byLang)) {
			const match = other?.question.articles.find((a) => a.n === article.n);
			if (match?.title) {
				return { title: match.title, lang: other!.work.language, borrowed: true };
			}
		}
		return undefined;
	}

	const borrowedLabel = (lang: string) =>
		t('summa.titleFromEdition').replace('{lang}', languageDisplayName(lang));

	// Resume-where-you-left-off, keyed by WORK so the reader has one Summa
	// position rather than one per edition — the address is edition-free and
	// the fallback may hand them a different edition on the next question.
	$effect(() => {
		if (!editions.current) return;
		setPosition(
			'summa',
			`${t('summa.part')} ${data.part} · ${t('summa.question')} ${data.n}`,
			page.url.pathname
		);
	});
</script>

<svelte:head>
	<title>{t('summa.question')} {data.n} — {t('summa.landing.title')}</title>
</svelte:head>

<!-- What identifies the second column in `ReadingBar` — see that component
     for why the route supplies it rather than the bar building its own. -->
{#snippet comparisonEdition()}
	<ComparisonEditionMenu
		editions={editions.others.map((e) => e.work)}
		current={editions.secondaryWorkId}
		onselect={chooseComparisonEdition}
	/>
{/snippet}

<!--
	The translator's note is a SUBTITLE, on its own line — 28 article titles
	carry one, and run into the heading they read as a single runaway sentence
	(see `summaTitleParts`). It sits outside the `<h2>`: it is the edition
	glossing a word it knew would read oddly in English, not part of what the
	article asks.
-->
{#snippet articleHeading(article: SummaArticle, lang: string)}
	{@const at = articleTitle(article, lang)}
	{@const parts = at ? summaTitleParts(at.title) : undefined}
	<h2 class="article-head">
		<span class="article-number">{t('summa.article')} {article.n}</span>
		{#if at && parts}
			<span
				class="article-title"
				class:borrowed={at.borrowed}
				lang={at.borrowed ? at.lang : undefined}
				title={at.borrowed ? borrowedLabel(at.lang) : undefined}>{parts.title}</span
			>
		{/if}
	</h2>
	{#if parts?.note}
		<p class="title-note">{parts.note}</p>
	{/if}
{/snippet}

{#snippet leftCell(article: SummaArticle)}
	{@render articleHeading(article, editions.lang)}
	<SummaDivisions divisions={article.divisions} lang={editions.lang} />
{/snippet}

{#snippet rightCell(article: SummaArticle)}
	{@render articleHeading(article, editions.secondaryLang ?? editions.lang)}
	<SummaDivisions divisions={article.divisions} lang={editions.secondaryLang ?? editions.lang} />
{/snippet}

{#snippet prologue(blocks: { html: string }[], lang: string)}
	{#if blocks.length > 0}
		<div class="prologue" {lang}>
			{#each blocks as block, i (i)}
				<InlineProse html={block.html} {lang} />
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet leftPrologue()}
	{@render prologue(editions.current?.question.prologue ?? [], editions.lang)}
{/snippet}

{#snippet rightPrologue()}
	{@render prologue(
		editions.secondary?.question.prologue ?? [],
		editions.secondaryLang ?? editions.lang
	)}
{/snippet}

{#if editions.current && question}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/summa">{t('summa.landing.title')}</a>
					<span class="sep">›</span>
					<span>{t('summa.part')} {data.part}</span>
				</nav>
			</div>

			<!--
				Bookmark, print, edition, compare, second edition — in that fixed
				order and in both modes, exactly as every other reader carries
				them. `EditionMenu` has known about `/summa` since the route was
				built; nothing rendered it here, so `content.langFor('summa')`
				could never move off the default and the Latin edition was
				unreachable.
			-->
			<ReadingBar
				bookmarkHref={`/summa/${partSlug}/${data.n}`}
				{canCompare}
				{compareActive}
				onToggleCompare={toggleCompare}
				comparison={comparisonEdition}
			/>

			{#if fellBack}
				<p class="fallback-note">
					{#if data.part === 'Suppl' && preferred === 'la'}
						{t('summa.noLatinSupplement')}
					{:else}
						{t('summa.noEditionInYourLanguage').replace(
							'{lang}',
							languageDisplayName(editions.lang)
						)}
					{/if}
				</p>
			{/if}

			<header class="question-header">
				<p class="question-number">
					{t('summa.part')}
					{data.part} · {t('summa.question')}
					{data.n}
				</p>
				<!-- The Latin prints no question titles, so under it every one of
				     these is the English edition's, marked as such rather than
				     passed off as this source's own — see `summaTitleFor`. -->
				{#if named}
					{@const parts = summaTitleParts(named.title)}
					<h1
						class:borrowed={named.borrowed}
						lang={named.borrowed ? named.lang : undefined}
						title={named.borrowed ? borrowedLabel(named.lang) : undefined}
					>
						{parts.title}
					</h1>
					{#if parts.note}
						<p class="title-note">{parts.note}</p>
					{/if}
				{:else}
					<h1 class="visually-hidden">
						{t('summa.part')}
						{data.part} — {t('summa.question')}
						{data.n}
					</h1>
				{/if}
			</header>

			{#if compareActive && editions.secondary}
				<!-- One row per field (`.compare-unit-header`, app.css): the two
				     notices link to different source pages and cannot collapse. -->
				<div class="compare-unit-header">
					<div
						class="compare-unit-field compare-unit-field-left"
						lang={editions.current.work.language}
					>
						<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>
					</div>
					<div
						class="compare-unit-field compare-unit-field-right"
						lang={editions.secondary.work.language}
					>
						<p class="copyright-notice"><CopyrightNotice manifest={editions.secondary.work} /></p>
					</div>
				</div>
			{:else}
				<p class="copyright-notice"><CopyrightNotice manifest={editions.current.work} /></p>
			{/if}

			{#if compareActive && editions.secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={editions.current.work.language}
					rightLang={editions.secondary.work.language}
					leftLabel={compareColumnLabel(editions.current.work)}
					rightLabel={compareColumnLabel(editions.secondary.work)}
					left={leftCell}
					right={rightCell}
					unit={(n) => ({
						href: `#a${n}`,
						canonicalHref: `/summa/${partSlug}/${data.n}#a${n}`,
						label: `${t('summa.article')} ${n}`,
						anchorId: `a${n}`
					})}
					interlude={{
						has: (n) => n === firstArticleN,
						left: leftPrologue,
						right: rightPrologue
					}}
				/>
			{:else}
				<div class="reading-text summa-body" lang={editions.current.work.language}>
					{@render prologue(question.prologue, editions.lang)}

					<!-- The article-less questions (I q. 71, q. 72) hang their
					     divisions off the question itself; both sources agree they
					     have no articles, so none is invented. -->
					{#if question.divisions}
						<SummaDivisions divisions={question.divisions} lang={editions.lang} />
					{/if}

					{#each question.articles as article (article.n)}
						{@const articleHref = `/summa/${partSlug}/${data.n}#a${article.n}`}
						<!-- An article is an ADDRESSABLE UNIT — `refHref` resolves a
						     citation straight to `#a{n}` — so it gets the same margin
						     anchor every other addressable unit on the site has: copy,
						     copy link, open, bookmark. Compare mode's own gutter
						     anchor (`CompareGrid`'s `unit`) is the counterpart of this
						     one, which is why neither mode is without it. -->
						<section
							class="article"
							id={`a${article.n}`}
							class:bookmarked={bookmarks.has(articleHref)}
						>
							<ReferenceNumber
								n={article.n}
								href={`#a${article.n}`}
								canonicalHref={articleHref}
								label={`${t('summa.article')} ${article.n}`}
								placement="margin"
							/>
							{@render articleHeading(article, editions.lang)}
							<SummaDivisions divisions={article.divisions} lang={editions.lang} />
						</section>
					{/each}
				</div>
			{/if}

			<nav class="unit-nav" aria-label="Question navigation">
				{#if editions.current.prev}
					<a href={`/summa/${partSlug}/${editions.current.prev.n}`} rel="prev">
						&larr; {t('summa.prevQuestion')} · {editions.current.prev.n}
					</a>
				{:else}
					<span></span>
				{/if}
				{#if editions.current.next}
					<a href={`/summa/${partSlug}/${editions.current.next.n}`} rel="next">
						{t('summa.nextQuestion')} · {editions.current.next.n} &rarr;
					</a>
				{/if}
			</nav>
		</article>

		<!-- Hidden below `.reading-layout`'s own 80rem breakpoint rather than
		     shown as a plain block after the text: this route had no in-reader
		     navigation before the sidebar existed, so there is no mobile
		     counterpart to preserve — the same call `/compendium/[n]` made.
		     Omitted entirely in compare mode, per `.reading-layout.compare`. -->
		<aside class="reading-aside">
			<SummaSidebarToc
				{headings}
				questions={partQuestions}
				currentN={data.n}
				articles={articleNumbers}
				{partSlug}
				part={data.part}
				lang={editions.lang}
				heading={t('summa.tableOfContents')}
				questionLabel={t('summa.questionShort')}
				articleLabel={t('summa.articleShort')}
				borrowedTitleLabel={t('summa.titleFromEdition')}
				languageName={languageDisplayName}
			/>
		</aside>
	</div>
{/if}

<style>
	.fallback-note {
		margin: 1rem 0;
		padding: 0.6rem 0.85rem;
		border-inline-start: 3px solid var(--color-border);
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.question-header {
		margin: 0 0 0.25rem;
	}

	.question-number {
		font-size: 0.85rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0 0 0.25rem;
	}

	.question-header h1 {
		font-size: 1.6rem;
		line-height: 1.25;
		margin: 0;
	}

	.copyright-notice {
		margin: 0 0 1.25rem;
	}

	/*
	 * A title this edition does not print, shown so a Latin reader is not left
	 * with a bare number (`summaTitleFor`). Italic and muted rather than
	 * badged: it is the same address named in another language, not a second
	 * thing to read. The `lang` attribute on the element is what actually
	 * tells a screen reader the language changed.
	 */
	.question-header h1.borrowed,
	.article-title.borrowed {
		font-style: italic;
		color: var(--color-text-muted);
	}

	.prologue {
		color: var(--color-text-muted);
	}

	.article {
		margin-top: 2.5rem;
	}

	/* The text is covered; the margin number hangs outside it on the page's
	   own ground and marks itself (`ReferenceNumber`'s `.bookmarked`) — the
	   same split `.section.bookmarked` and `.question.bookmarked` use. */
	.article.bookmarked {
		background: color-mix(in srgb, var(--color-bookmark) 12%, transparent);
		border-radius: 0.25rem;
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
	}

	/*
	 * The heading's subtitle: smaller, muted, and in the sans face, so it
	 * reads as apparatus about the title rather than as the start of the text
	 * beneath it.
	 */
	.title-note {
		margin: 0.15rem 0 0;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}

	.article-head {
		font-size: 1.15rem;
		line-height: 1.35;
		margin: 0 0 0.75rem;
	}

	.article-number {
		display: block;
		font-size: 0.8rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		font-family: var(--font-sans);
	}

	@media (max-width: 79.9375rem) {
		.reading-aside {
			display: none;
		}
	}
</style>
