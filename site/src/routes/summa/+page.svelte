<script lang="ts">
	/**
	 * The Summa's table of contents: its parts, the treatise headings inside
	 * each, and every question.
	 *
	 * Index-tier only — no content fetch. `summaQuestionMetas` carries the
	 * titles and article numbers precisely so this page costs nothing, the
	 * same split `/compendium` and the CCC TOC already use.
	 *
	 * Built from the READER'S edition, falling back the usual way, and the
	 * consequence is visible rather than hidden: under Latin there are four
	 * parts instead of five and no TREATISE headings at all, because the
	 * Corpus Thomisticum prints neither a Supplement nor an outline below the
	 * part.
	 *
	 * QUESTION TITLES ARE BORROWED WHERE TREATISE HEADINGS ARE NOT, and the
	 * line between them is the line between naming an address and asserting a
	 * structure. `II-II q. 184` is "Of the State of Perfection in General" in
	 * whichever edition you read it, so showing that title to a Latin reader
	 * — marked as the English edition's, see `summaTitleFor` — helps them find
	 * the question and claims nothing about their text. Grouping the Leonine
	 * text's questions under the Dominican Fathers' treatise divisions would
	 * claim something else entirely: that this source divides its work that
	 * way. It does not, so it is left ungrouped.
	 */
	import { content } from '$lib/content.svelte';
	import {
		getWork,
		languageDisplayName,
		listSummaQuestions,
		summaHeadingsForPart,
		summaTitleFor,
		defaultSummaWorkId,
		baseLang
	} from '$lib/corpus';
	import { summaPartSlug } from '$lib/route-manifest';
	import { summaHeadingTitle, summaQuestionLabel } from '$lib/summa-titles';
	import { t } from '$lib/i18n.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import type { SummaManifest } from '$lib/types';

	const workId = $derived(defaultSummaWorkId(content.langFor('summa')));
	const work = $derived(workId ? (getWork(workId) as SummaManifest | undefined) : undefined);
	const lang = $derived(work ? baseLang(work.language) : 'en');
	const questions = $derived(listSummaQuestions(lang));

	/** The parts this edition has, each with its headings and questions. */
	const parts = $derived.by(() =>
		(work?.parts ?? []).map((part) => ({
			part,
			slug: summaPartSlug(part),
			headings: summaHeadingsForPart(lang, part).filter((row) => row.level > 1),
			questions: questions.filter((q) => q.part === part)
		}))
	);

	/**
	 * The sidebar mirrors the PARTS and nothing below them, the same rule
	 * `indexSidebarItems` states for the CCC and Compendium: this page is
	 * already a table of contents, and a second copy of it beside itself makes
	 * navigation harder rather than easier. Four rows under Latin, five under
	 * English — the edition's own shape, not a filter.
	 *
	 * Not `indexSidebarItems` itself: that walks a whole `StructureNode` tree,
	 * and what this page's sidebar wants is a flat list of its four or five
	 * part anchors. (The READER's sidebar does walk the shared tree now — see
	 * `summaOutline` in corpus.ts.)
	 */
	const borrowedLabel = (borrowedFrom: string) =>
		t('summa.titleFromEdition').replace('{lang}', languageDisplayName(borrowedFrom));

	const sidebarItems = $derived(
		parts.map(({ part, slug }) => ({
			href: `#part-${slug}`,
			label: `${t('summa.part')} ${part}`
		}))
	);
</script>

<svelte:head>
	<title>{t('summa.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="reading-layout">
	<article class="content-column">
		<header>
			<h1>{t('summa.landing.title')}</h1>
			<p class="tagline">{t('summa.landing.tagline')}</p>
		</header>

		{#each parts as { part, slug, headings, questions: partQuestions } (part)}
			<section class="part" id={`part-${slug}`}>
				<h2>{t('summa.part')} {part}</h2>

				{#if headings.length > 0}
					<ul class="treatises">
						{#each headings as heading (heading.title + heading.before)}
							<li>
								{#if heading.before !== null}
									<a href={`/summa/${slug}/${heading.before}`}>
										{summaHeadingTitle(heading.title)}
									</a>
								{:else}
									<span>{summaHeadingTitle(heading.title)}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}

				<ol class="questions">
					{#each partQuestions as question (question.n)}
						<li>
							<a href={`/summa/${slug}/${question.n}`}>
								<span class="q-number">{question.n}</span>
								{#if question.title}<span class="q-title">{summaQuestionLabel(question.title)}</span
									>{/if}
							</a>
						</li>
					{/each}
				</ol>
			</section>
		{/each}

		{#if work}
			<CopyrightNotice manifest={work} />
		{/if}
	</article>

	<aside class="index-aside">
		<IndexSidebarToc heading={t('summa.tableOfContents')} items={sidebarItems} />
	</aside>
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
	}

	.part {
		margin-top: 2.5rem;
	}

	.treatises {
		list-style: none;
		padding: 0;
		margin: 0 0 1rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.questions {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 0.15rem 1.5rem;
	}

	.questions a {
		display: flex;
		gap: 0.6rem;
		padding: 0.2rem 0;
		text-decoration: none;
	}

	.q-number {
		flex: 0 0 2.5rem;
		text-align: end;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.q-title {
		text-decoration: underline;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}
</style>
