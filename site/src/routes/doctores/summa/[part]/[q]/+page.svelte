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
		summaOutline,
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
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CompareCopyrightHeader from '$lib/components/CompareCopyrightHeader.svelte';
	import InlineProse from '$lib/components/InlineProse.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import UnitNav from '$lib/components/UnitNav.svelte';
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
	import SummaDivisions from '$lib/components/SummaDivisions.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import { summaQuestionLabel, summaTitleParts } from '$lib/summa-titles';
	import { hrefFor, summaPartSlug } from '$lib/address';
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

	/**
	 * The work id, passed down to every surface that linkifies this text.
	 * `summa.en` is one of the works `refs-grammar.ts`'s `WORK_CONFIGS`
	 * overrides — CCEL quotes Scripture in Douay-Rheims, where "1 Kings" is
	 * 1 Samuel — so the Summa is the one route where dropping it changes what
	 * a reference resolves to.
	 */
	const workId = $derived(editions.current?.work.id);

	const partSlug = $derived(summaPartSlug(data.part));
	const question = $derived(editions.current?.question);
	const named = $derived(summaTitleFor(editions.lang, data.part, data.n));

	/**
	 * This question's articles, each carrying the title it is HEADED with a
	 * few inches to the left. The index tier the sidebar is otherwise built
	 * from holds article NUMBERS and nothing else (`SummaQuestionMeta`), so
	 * passing those alone left the table of contents listing bare ordinals
	 * beside titled headings; the titles are already on the page, in the
	 * question it loaded, and are borrowed from the other edition by the same
	 * `articleTitle` the heading uses, so the two cannot name one article
	 * differently.
	 */
	const articleRows = $derived(
		(question?.articles ?? []).map((a) => {
			const at = articleTitle(a, editions.lang);
			return { n: a.n, title: at?.title, titleLang: at?.borrowed ? at.lang : undefined };
		})
	);
	const articleNumbers = $derived(articleRows.map((row) => row.n));

	/**
	 * The edition every title on this page came from, when it is not the one
	 * being read — the Corpus Thomisticum prints no question or article titles
	 * at all, so under Latin that is all of them and under English it is none.
	 *
	 * SAID IN WORDS, not in italic. Borrowed titles used to be set italic and
	 * muted here and in the sidebar, which asked the reader to know a
	 * convention and then, on the only pages where it fired, applied it to
	 * every title on the page — a mark with nothing to contrast against. It is
	 * an all-or-nothing property of the edition, so it is stated once, on the
	 * info glyph beside the table of contents' heading (`headingNote`), where
	 * a reader who wonders about the titles is already looking and one who
	 * does not is not made to read a caveat on every question.
	 */
	const titlesFrom = $derived(
		named?.borrowed ? named.lang : articleRows.find((row) => row.titleLang)?.titleLang
	);
	const titlesNote = $derived(
		titlesFrom
			? t('summa.titlesFromEdition').replace('{lang}', languageDisplayName(titlesFrom))
			: undefined
	);

	/**
	 * The sidebar's outline, taken from the SHOWN edition rather than the
	 * preferred one. On the Supplement that is the difference between a Latin
	 * reader seeing the English part they are actually reading and seeing an
	 * outline for a part their preferred edition does not have.
	 */
	const outline = $derived(summaOutline(editions.lang, data.part, data.n, articleRows));
	/**
	 * The treatise this question sits in, for the breadcrumb — read off the
	 * sidebar's own `outline` rather than derived a second time, so the crumb
	 * row and the table of contents cannot name different treatises.
	 *
	 * Undefined in two legitimate cases, and both render as a two-crumb trail
	 * rather than an invented one: the Latin edition prints no treatise
	 * headings at all (`summaOutline`'s docblock — borrowing English's would
	 * assert a structure the Corpus Thomisticum does not publish), and a
	 * question ahead of its part's first heading belongs to no treatise, which
	 * is why `summaOutline` keeps those at the top level.
	 */
	const treatise = $derived(
		outline.find((node) => {
			const [from, to] = node.paragraphs;
			return (
				node.kind === 'section' &&
				typeof from === 'number' &&
				typeof to === 'number' &&
				data.n >= from &&
				data.n <= to
			);
		})
	);

	/** The article rows' own anchors. They bound no question number of their
	 *  own, so this is what tells the shared sidebar they are addressable —
	 *  the same mechanism a document's tail headings already use. */
	const linkableAnchors = $derived(new Set(articleNumbers.map((a) => `a${a}`)));

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

	/** ` \u00b7 The Existence of God`, or nothing under an edition that prints
	 *  no question titles. */
	function titleSuffix(): string {
		const title = question?.title ? summaQuestionLabel(question.title) : '';
		return title ? ` \u00b7 ${title}` : '';
	}
</script>

<!--
	The question's own title, and `home.title` after it rather than the work's:
	this was the other route suffixing with something else, so a reader watching
	the tab saw the site renamed on every Summa page.

	Empty under `summa.la`, which prints no question titles at all
	(`SummaQuestion.title`) — the label alone is then the whole title, which is
	what the Latin edition itself offers.
-->
<svelte:head>
	<title>{t('summa.question')} {data.n}{titleSuffix()} — {t('home.title')}</title>
</svelte:head>

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
	<SummaDivisions divisions={article.divisions} lang={editions.lang} work={workId} />
{/snippet}

{#snippet rightCell(article: SummaArticle)}
	{@render articleHeading(article, editions.secondaryLang ?? editions.lang)}
	<SummaDivisions
		divisions={article.divisions}
		lang={editions.secondaryLang ?? editions.lang}
		work={editions.secondaryWorkId ?? workId}
	/>
{/snippet}

{#snippet prologue(blocks: { html: string }[], lang: string, work: string | undefined)}
	{#if blocks.length > 0}
		<div class="prologue" {lang}>
			{#each blocks as block, i (i)}
				<InlineProse html={block.html} {lang} {work} />
			{/each}
		</div>
	{/if}
{/snippet}

{#snippet leftPrologue()}
	{@render prologue(editions.current?.question.prologue ?? [], editions.lang, workId)}
{/snippet}

{#snippet rightPrologue()}
	{@render prologue(
		editions.secondary?.question.prologue ?? [],
		editions.secondaryLang ?? editions.lang,
		editions.secondaryWorkId ?? workId
	)}
{/snippet}

{#if editions.current && question}
	<!-- One list, two places: the desktop sidebar below and the reading bar's
	     narrow-screen panel (`TocMenu`). This is the route that most wants the
	     panel — a part's outline is every question in it, 90 for the Tertia
	     and 189 for the Secunda Secundae, so there has never been a sensible
	     way to put that list in the reading column on a phone. -->
	{#snippet tocList()}
		<!-- The same sidebar every other reader has, over the same
		     `StructureNode` tree — see `summaOutline` (corpus.ts) for why
		     the bespoke component this replaced was an accidental
		     divergence rather than a requirement. `outlineKinds` is
		     omitted, as for a document: the Summa's tree is two levels
		     deep and has no "chapter-sized" floor to cut it to. -->
		<StructureSidebarToc
			structure={outline.map((node) => ({ node, depth: 0 }))}
			currentN={data.n}
			lang={editions.lang}
			heading={t('summa.tableOfContents')}
			headingNote={titlesNote}
			routeHref={(n) => hrefFor({ kind: 'summa', part: partSlug, question: n, article: null })}
			{linkableAnchors}
			borrowedTitleLabel={(from) =>
				t('summa.titleFromEdition').replace('{lang}', languageDisplayName(from))}
		/>
	{/snippet}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb">
					<a href="/doctores/summa">{t('summa.landing.title')}</a>
					<span class="sep">›</span>
					<!-- The part is a section of the landing page, which is the whole
					     table of contents — the same shape `/preces`' group crumb
					     links to, and the anchor that page already puts on it. -->
					<a href={`/doctores/summa#part-${partSlug}`}>{t('summa.part')} {data.part}</a>
					{#if treatise}
						{@const from = treatise.paragraphs[0]}
						<span class="sep">›</span>
						<!-- Addressed by its opening question, exactly as the landing
						     page's treatise list addresses it. -->
						<a
							href={from === null
								? undefined
								: hrefFor({ kind: 'summa', part: partSlug, question: from, article: null })}
						>
							{treatise.title}
						</a>
					{/if}
				</nav>
			</div>

			<!--
				Bookmark, print, edition, compare, second edition — in that fixed
				order and in both modes, exactly as every other reader carries
				them. `EditionMenu` has known about this route since it was
				built; nothing rendered it here, so `content.langFor('summa')`
				could never move off the default and the Latin edition was
				unreachable.
			-->
			<ReadingBar
				toc={{ label: t('summa.tableOfContents'), content: tocList }}
				bookmarkHref={hrefFor({ kind: 'summa', part: partSlug, question: data.n, article: null })}
				{canCompare}
				{compareActive}
				onToggleCompare={toggleCompare}
				comparison={{
					editions: editions.others.map((e) => e.work),
					current: editions.secondaryWorkId,
					onselect: chooseComparisonEdition
				}}
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
				     these is the English edition's — said so on the table of
				     contents' own heading rather than passed off as this
				     source's own, see `summaTitleFor` and `titlesFrom`. -->
				{#if named}
					{@const parts = summaTitleParts(named.title)}
					<h1
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
				<CompareCopyrightHeader left={editions.current.work} right={editions.secondary.work} />
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
						canonicalHref: hrefFor({
							kind: 'summa',
							part: partSlug,
							question: data.n,
							article: n
						}),
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
					{@render prologue(question.prologue, editions.lang, workId)}

					<!-- The article-less questions (I q. 71, q. 72) hang their
					     divisions off the question itself; both sources agree they
					     have no articles, so none is invented. -->
					{#if question.divisions}
						<SummaDivisions
							divisions={question.divisions}
							lang={editions.lang}
							work={workId}
							dropCap
						/>
					{/if}

					{#each question.articles as article (article.n)}
						{@const articleHref = hrefFor({
							kind: 'summa',
							part: partSlug,
							question: data.n,
							article: article.n
						})}
						<!-- An article is an ADDRESSABLE UNIT — `refHref` resolves a
						     citation straight to `#a{n}` — so it gets the same margin
						     anchor every other addressable unit on the site has: copy,
						     copy link, open, bookmark. Compare mode's own gutter
						     anchor (`CompareGrid`'s `unit`) is the counterpart of this
						     one, which is why neither mode is without it. -->
						<section
							class="article"
							id={`a${article.n}`}
							class:unit-bookmarked={bookmarks.has(articleHref)}
						>
							<ReferenceNumber
								n={article.n}
								href={`#a${article.n}`}
								canonicalHref={articleHref}
								label={`${t('summa.article')} ${article.n}`}
								placement="margin"
							/>
							{@render articleHeading(article, editions.lang)}
							<!-- An initial per ARTICLE, not per page: the article is the unit a
							     reader arrives at (`#a3`), the unit a citation names, and the
							     one whose opening words are Aquinas's rather than the
							     question's prologue. The document reader draws one at every
							     division start for the same reason. Compare mode draws none, as
							     it does everywhere — a 4.98em initial in a half-width column
							     eats the measure the comparison needs. -->
							<SummaDivisions
								divisions={article.divisions}
								lang={editions.lang}
								work={workId}
								dropCap
							/>
						</section>
					{/each}
				</div>
			{/if}

			<UnitNav
				ariaLabel="Question navigation"
				prev={editions.current.prev && {
					href: hrefFor({
						kind: 'summa',
						part: partSlug,
						question: editions.current.prev.n,
						article: null
					}),
					label: t('unitNav.previous'),
					detail: String(editions.current.prev.n),
					full: `${t('summa.prevQuestion')} ${editions.current.prev.n}`
				}}
				next={editions.current.next && {
					href: hrefFor({
						kind: 'summa',
						part: partSlug,
						question: editions.current.next.n,
						article: null
					}),
					label: t('unitNav.next'),
					detail: String(editions.current.next.n),
					full: `${t('summa.nextQuestion')} ${editions.current.next.n}`
				}}
			/>
		</article>

		<!-- Hidden below `.reading-layout`'s own 80rem breakpoint, where the
		     reading bar's panel renders the snippet above instead, and omitted
		     entirely in compare mode, per `.reading-layout.compare`. -->
		<aside class="reading-aside">
			{@render tocList()}
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

	.prologue {
		color: var(--color-text-muted);
	}

	.article {
		margin-top: 2.5rem;
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
</style>
