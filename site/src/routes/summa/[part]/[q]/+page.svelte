<script lang="ts">
	/**
	 * One question of the Summa, with its articles as fragments on the page
	 * (`#a3`) rather than pages of their own — the same choice documents made
	 * in 2026-08-17 and for the same reason: 3,113 addresses for one article
	 * of text each buys nothing a fragment does not.
	 *
	 * The edition is picked here rather than in `load`, because the URL is
	 * edition-free and the reader's preference can change without a
	 * navigation. What makes this page different from every other reader is
	 * that the preference may not be satisfiable AT ALL: the Summa has no
	 * Portuguese edition and will not before 2055, and the Latin has no
	 * Supplement. So the pick walks `corpus.ts`'s stated fallback — the
	 * reader's language, then English, then Latin — over whichever editions
	 * `byLang` actually turned out to have for THIS address, and says plainly
	 * when it had to fall back rather than silently serving another language.
	 */
	import { page } from '$app/state';
	import { content } from '$lib/content.svelte';
	import { languageDisplayName } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import { setPosition } from '$lib/reading-position';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import InlineProse from '$lib/components/InlineProse.svelte';
	import SummaDivisions from '$lib/components/SummaDivisions.svelte';
	import { summaPartSlug } from '$lib/route-manifest';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const preferred = $derived(content.langFor('summa'));

	/**
	 * The order to try languages in for THIS address. Mirrors
	 * `corpus.ts`'s `CONTENT_LANG_FALLBACK` deliberately rather than importing
	 * it: that constant answers "which edition of the work", this answers
	 * "which of the editions that carry this question" — the Supplement makes
	 * those different questions, and collapsing them would mean a Latin
	 * reader hitting `/summa/suppl/77` gets no page instead of the English.
	 */
	const shown = $derived.by(() => {
		for (const lang of [preferred, 'en', 'la']) {
			const entry = data.byLang[lang];
			if (entry) return { lang, entry };
		}
		return undefined;
	});

	const fellBack = $derived(shown !== undefined && shown.lang !== preferred);
	const partSlug = $derived(summaPartSlug(data.part));

	// Resume-where-you-left-off, keyed by WORK so the reader has one Summa
	// position rather than one per edition — the address is edition-free and
	// the fallback may hand them a different edition on the next question.
	$effect(() => {
		if (!shown) return;
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

{#if shown}
	{@const question = shown.entry.question}
	<div class="reading-layout">
		<article class="content-column">
			<nav class="breadcrumb" aria-label="Breadcrumb">
				<a href="/summa">{t('summa.landing.title')}</a>
				<span class="sep">›</span>
				<span>{t('summa.part')} {data.part}</span>
			</nav>

			<!--
				Said plainly, not hidden. A reader whose language this work does
				not exist in should be told which language they are reading and
				why, rather than left to infer it from the text being in English.
			-->
			{#if fellBack}
				<p class="fallback-note">
					{#if data.part === 'Suppl' && preferred === 'la'}
						{t('summa.noLatinSupplement')}
					{:else}
						{t('summa.noEditionInYourLanguage').replace('{lang}', languageDisplayName(shown.lang))}
					{/if}
				</p>
			{/if}

			<header class="question-header">
				<p class="question-number">
					{t('summa.part')}
					{data.part} · {t('summa.question')}
					{data.n}
				</p>
				{#if question.title}
					<h1>{question.title}</h1>
				{:else}
					<!-- The Latin edition prints no question titles; the number IS
					     the heading there, so nothing is invented to fill the gap. -->
					<h1 class="visually-hidden">
						{t('summa.part')}
						{data.part} — {t('summa.question')}
						{data.n}
					</h1>
				{/if}
			</header>

			{#if question.prologue.length > 0}
				<section class="prologue" aria-label={t('summa.prologue')}>
					{#each question.prologue as block, i (i)}
						<InlineProse html={block.html} lang={shown.lang} />
					{/each}
				</section>
			{/if}

			<!-- The article-less questions (I q. 71, q. 72) hang their divisions
			     off the question itself; both sources agree they have no articles,
			     so none is invented. -->
			{#if question.divisions}
				<SummaDivisions divisions={question.divisions} lang={shown.lang} />
			{/if}

			{#each question.articles as article (article.n)}
				<section class="article" id={`a${article.n}`}>
					<h2>
						<span class="article-number">{t('summa.article')} {article.n}</span>
						{#if article.title}<span class="article-title">{article.title}</span>{/if}
					</h2>
					<SummaDivisions divisions={article.divisions} lang={shown.lang} />
				</section>
			{/each}

			<nav class="pager" aria-label="Questions">
				{#if shown.entry.prev}
					<a href={`/summa/${partSlug}/${shown.entry.prev.n}`}>
						← {t('summa.prevQuestion')}
					</a>
				{:else}
					<span></span>
				{/if}
				{#if shown.entry.next}
					<a href={`/summa/${partSlug}/${shown.entry.next.n}`}>
						{t('summa.nextQuestion')} →
					</a>
				{/if}
			</nav>

			<CopyrightNotice manifest={shown.entry.work} />
		</article>
	</div>
{/if}

<style>
	.breadcrumb {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.breadcrumb .sep {
		margin: 0 0.4em;
	}

	.fallback-note {
		margin: 1rem 0;
		padding: 0.6rem 0.85rem;
		border-left: 3px solid var(--color-border);
		background: var(--color-surface-muted, transparent);
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.question-header {
		margin: 1.5rem 0 1rem;
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

	.prologue {
		color: var(--color-text-muted);
	}

	.article {
		margin-top: 2.5rem;
		scroll-margin-top: 4rem;
	}

	.article h2 {
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
	}

	.pager {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		margin: 3rem 0 1rem;
		font-size: 0.9rem;
	}
</style>
