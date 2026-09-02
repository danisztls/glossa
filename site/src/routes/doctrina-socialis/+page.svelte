<script lang="ts">
	/**
	 * The Compendium of the Social Doctrine's index.
	 *
	 * `StructureIndex`, the same outline grid `/catechismus` draws, with ONE
	 * work column instead of two. It was a hand-written two-level list until
	 * 2026-09-02, on the argument that the shared component's spine was
	 * `INDEX_OUTLINE_KINDS` (prologue, part, section, chapter, article) while
	 * every node here is a `sub` — this work's outline being derived from a
	 * DOCUMENT's flat `{level, title, before}` rows rather than stored as a
	 * tree. That was a real obstacle and a small one: the spine is a `kinds`
	 * prop now, and what a row is SET as is a `rank` prop, because a
	 * kind-keyed stylesheet cannot tell a part from a subsection when every
	 * row carries the same kind. In exchange this page gets the disclosures,
	 * which is what the old list could not afford — it showed one level and
	 * said so, "the deepest editions run to five, which is 246 rows on a page
	 * whose job is to get a reader into the text". Folded away behind a
	 * chevron, all five levels cost nothing.
	 *
	 * The unnumbered matter follows the outline: the letter of transmittal,
	 * the presentation, the index of references, and whichever of the two
	 * abbreviation tables this edition prints. None of that has an address —
	 * it is what `appendix.json` holds — so this page is where it has a
	 * reader.
	 */
	import BookText from '@lucide/svelte/icons/book-text';
	import {
		getWork,
		socialDoctrineAppendixUnits,
		socialDoctrineOutlineWithDivisions,
		socialDoctrineWorkId
	} from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import StructureIndex from '$lib/components/StructureIndex.svelte';
	import { DOCUMENT_OUTLINE_KINDS, workLink } from '$lib/components/indexToc';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { displayDocumentTitle, documentHeadingParts } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode } from '$lib/types';

	const lang = $derived(content.langFor('social-doctrine'));
	const workId = $derived(socialDoctrineWorkId(lang));
	const work = $derived(getWork(workId));

	/** The tree and its division rows together, so a row can be recognised as
	 *  a division by identity — see that function's docblock for why two
	 *  separate calls could not be. */
	const outline = $derived(socialDoctrineOutlineWithDivisions(lang));
	const divisionSpans = $derived(
		new Map(outline.divisions.map((division) => [division.node, division]))
	);

	/**
	 * WHERE A ROW POINTS, which is not uniform — the same distinction
	 * `catechismRows.ts` draws for the Catechism. A DIVISION opens a page of
	 * its own (`/doctrina-socialis/caput/{n}`, the whole chapter in continuous
	 * prose) and its chip carries the division's span, which is the span the
	 * page actually renders. Every other heading is a heading INSIDE such a
	 * page rather than a page, so it is addressed as the paragraph it opens at
	 * — the same address the old list gave its second level, and the reading
	 * page's own canonical one.
	 *
	 * A `PART` row is deliberately in the second group even though it opens
	 * where its first chapter does: the chapter page at that address covers
	 * the chapter, not the part, and the chip beside it says so by carrying
	 * the part's much wider range (CLAUDE.md — the widest division opening at
	 * a chapter anchor is not the chapter).
	 */
	const links = $derived((node: StructureNode) => {
		const division = divisionSpans.get(node);
		const workTitle = t('socialDoctrine.landing.title');
		return [
			division
				? workLink([division.from, division.to], {
						href: (n) => hrefFor({ kind: 'socialDoctrineChapter', n }),
						unit: '¶',
						workTitle
					})
				: workLink(node.paragraphs, {
						href: (n) => hrefFor({ kind: 'socialDoctrine', n }),
						unit: '¶',
						workTitle
					})
		];
	});

	/**
	 * HIERARCHY FROM DEPTH, because there is none in the kind: every node this
	 * outline carries is a `sub` (`buildDocumentOutline`, corpus.ts). The
	 * mapping is the source's own four printed levels — the parts and the two
	 * unnumbered essays that open the book, the twelve chapters, the
	 * roman-numeral sections inside them, and the lettered subsections under
	 * those — onto the four the index already sets. Anything deeper is a
	 * subsection of a subsection and takes the smallest of them.
	 */
	const RANK_BY_DEPTH = ['part', 'chapter', 'article'] as const;
	const rank = (_node: StructureNode, depth: number) => RANK_BY_DEPTH[depth] ?? 'sub';

	/**
	 * A row's printed marker and the name beside it.
	 *
	 * Two shapes, and the source prints one or the other, never both: the
	 * twelve chapters carry a `label` of their own (`CHAPTER ONE`), and every
	 * heading inside them carries a list marker at the head of its title
	 * instead (`I.`, `a)`). A part carries neither — `PART ONE` is the whole
	 * heading the source prints, with no name beside it (CLAUDE.md), so it
	 * stays the row's text rather than being demoted to a marker with nothing
	 * left to mark.
	 */
	const heading = (node: StructureNode, at: string) => {
		const parts = documentHeadingParts(node.title, at);
		return { marker: node.label ?? parts.ordinal, title: parts.title };
	};

	const workColumns = $derived([{ label: t('nav.socialDoctrine'), icon: BookText }]);

	/** Whether this edition prints the letter and the presentation at all —
	 *  `csdc.sw` prints neither, and a row leading to an empty page is worse
	 *  than no row. */
	const hasAppendix = $derived(socialDoctrineAppendixUnits(lang) > 0);
</script>

<svelte:head>
	<title>{t('socialDoctrine.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="index-column">
	<!-- The edition picker alone, over a table of contents written in that
	     edition — the same bar `/catechismus` carries, guarded the same way:
	     with no manifest there is no edition to offer. -->
	{#if work}
		<ReadingBar print={false} />
	{/if}

	<h1>{t('socialDoctrine.landing.title')}</h1>
	<p class="page-tagline">{t('socialDoctrine.landing.tagline')}</p>

	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	{#if outline.roots.length > 0}
		<StructureIndex
			tree={outline.roots}
			{lang}
			{links}
			{workColumns}
			{rank}
			{heading}
			kinds={DOCUMENT_OUTLINE_KINDS}
		/>
	{/if}

	<!-- THE LAST ROW OF THE TABLE OF CONTENTS, after Part Three. The source
	     prints the letter and the presentation BEFORE its first paragraph, and
	     they are shown after it here on purpose: a reader arriving at a work
	     wants its shape first, and two prefatory documents standing between
	     them and Part One is what the printed book can afford and a landing
	     page cannot. Set as its own row rather than as a node in the tree,
	     because it is not one — it bounds no paragraph and would have no range
	     to put in the column. -->
	{#if hasAppendix}
		<a class="appendix-row" href={hrefFor({ kind: 'socialDoctrineAppendix' })}>
			<span class="name">{t('socialDoctrine.appendix')}</span>
			<span class="arrow" aria-hidden="true">→</span>
		</a>
	{/if}
</div>

<style>
	/* Wider than `--content-width`, which is a measure for PROSE. This page is
	   a table like `/catechismus`'s: its width is what its columns need, and
	   the description above it keeps its own measure. The back matter below is
	   the exception in the other direction — it is prose, and says so. */
	.index-column {
		max-width: 52rem;
		margin-inline: auto;
		padding-inline: 1.25rem;
	}

	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
	}

	.page-tagline {
		max-width: 40rem;
	}

	.copyright-notice {
		margin: 0 0 1.5rem;
	}

	/* Its own measure, because the column around it is no longer one. The
	   letter of transmittal and the presentation are continuous prose, and the
	   52rem this page needs for a table of ranges is half again the line a
	   reader can follow — `--content-width` is that line, computed from
	   characters per line rather than picked. The rule and the heading still
	   run the column's full width, so the section reads as a division of the
	   page and only its text is narrowed. */
	/* The same band a part opens (`StructureIndex`'s `.rank-part`), because it
	   reads as the row after the last one: a rule across the full width, the
	   name in the text face, and the arrow where the ranges are. It carries no
	   range because it has none — nothing in it is numbered. */
	.appendix-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		border-top: 1px solid var(--color-border);
		padding-block: 1.1rem 0.3rem;
		text-decoration: none;
	}

	.appendix-row .name {
		font-family: var(--font-serif);
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.appendix-row:hover .name,
	.appendix-row:focus-visible .name {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.appendix-row .arrow {
		margin-inline-start: auto;
		color: var(--color-text-muted);
	}
</style>
