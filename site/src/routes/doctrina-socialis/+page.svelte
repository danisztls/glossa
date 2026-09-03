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
	 * EVERY ROW IS ONE LINK, to the division it names read in continuous prose
	 * — `socialDoctrineNav.ts` carries the reasoning; in short, a reader
	 * following a table of contents is going somewhere to READ, and a page
	 * holding one paragraph out of a chapter of sixty is the citation view,
	 * not that. The range at the far edge is inside that link rather than
	 * being one of its own: it says how much of the book the row covers, which
	 * is a fact about the row and not a second place to go.
	 */
	import BookText from '@lucide/svelte/icons/book-text';
	import { getWork, socialDoctrineOutline, socialDoctrineWorkId } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import StructureIndex from '$lib/components/StructureIndex.svelte';
	import { DOCUMENT_OUTLINE_KINDS, workLink } from '$lib/components/indexToc';
	import { content } from '$lib/content.svelte';
	import { socialDoctrineHeadingHref } from '$lib/socialDoctrineNav';
	import { documentHeadingParts } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode } from '$lib/types';

	const lang = $derived(content.langFor('social-doctrine'));
	const workId = $derived(socialDoctrineWorkId(lang));
	const work = $derived(getWork(workId));

	const outline = $derived(socialDoctrineOutline(lang));

	/**
	 * THE EXTENT, AND NO ADDRESS OF ITS OWN — `workLink` with no `href`. The
	 * row is already a link and the chip is inside it, so a second anchor here
	 * would be a second tab stop leading to the same page.
	 *
	 * The row's OWN span, never a division's: a `PART` row outruns the chapter
	 * that opens where it does, and saying so is the point (CLAUDE.md — the
	 * widest division opening at a chapter anchor is not the chapter).
	 */
	const links = $derived((node: StructureNode) => [
		workLink(node.paragraphs, { unit: '¶', workTitle: t('socialDoctrine.landing.title') })
	]);

	/** Where the row goes: the chapter this heading is printed in, scrolled to
	 *  the heading. */
	const rowHref = $derived((node: StructureNode) => {
		const at = node.paragraphs[0];
		return Number.isFinite(at) ? socialDoctrineHeadingHref(lang, at as number) : undefined;
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

	{#if outline.length > 0}
		<StructureIndex
			tree={outline}
			{lang}
			{links}
			{workColumns}
			{rank}
			{heading}
			{rowHref}
			kinds={DOCUMENT_OUTLINE_KINDS}
		/>
	{/if}
</div>

<style>
	/* Wider than `--content-width`, which is a measure for PROSE. This page is
	   a table like `/catechismus`'s: its width is what its columns need, and
	   the description above it keeps its own measure. */
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
</style>
