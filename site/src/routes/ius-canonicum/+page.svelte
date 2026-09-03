<script lang="ts">
	/**
	 * The Code of Canon Law's index.
	 *
	 * `StructureIndex` again, `/doctrina-socialis`'s arrangement with one work
	 * column — and the disclosures earn their keep here more than anywhere
	 * else on the site. The Code is six levels deep and 294 rows in the
	 * English edition; unfolded it is a wall, and folded to its seven books it
	 * is the shape a reader already has in their head.
	 *
	 * EVERY ROW IS ONE LINK, to the reading unit it names — `canonLawNav.ts`
	 * carries the reasoning. The range at the far edge is inside that link
	 * rather than an anchor of its own: it says how far the row runs, which is
	 * a fact about the row and not a second place to go.
	 */
	import Scale from '@lucide/svelte/icons/scale';
	import { canonLawOutline, canonLawWorkId, getWork } from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import StructureIndex from '$lib/components/StructureIndex.svelte';
	import { DOCUMENT_OUTLINE_KINDS, workLink } from '$lib/components/indexToc';
	import { content } from '$lib/content.svelte';
	import { canonLawHeadingHref, canonLawHeadingParts, canonLawLabelText } from '$lib/canonLawNav';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode } from '$lib/types';

	const lang = $derived(content.langFor('canon-law'));
	const workId = $derived(canonLawWorkId(lang));
	const work = $derived(getWork(workId));

	const outline = $derived(canonLawOutline(lang));

	/** The extent, and no address of its own — the row is already a link and
	 *  the chip sits inside it. `can.` rather than `¶` because that is the
	 *  unit this work is cited by. */
	const links = $derived((node: StructureNode) => [
		workLink(node.paragraphs, { unit: 'can.', workTitle: t('canonLaw.landing.title') })
	]);

	/** Where the row goes: the reading unit this heading is printed in,
	 *  scrolled to the heading. */
	const rowHref = $derived((node: StructureNode) => {
		const at = node.paragraphs[0];
		return Number.isFinite(at) ? canonLawHeadingHref(lang, at as number) : undefined;
	});

	/**
	 * HIERARCHY FROM DEPTH, because there is none in the kind: every node this
	 * outline carries is a `sub` (`buildDocumentOutline`, corpus.ts). Six
	 * printed levels — book, part, section, title, chapter, article — onto the
	 * four the index sets, which is a compression and not a loss: the ranks
	 * are a stylesheet's idea of weight, and the row still prints the word the
	 * source used.
	 */
	const RANK_BY_DEPTH = ['part', 'chapter', 'article'] as const;
	const rank = (_node: StructureNode, depth: number) => RANK_BY_DEPTH[depth] ?? 'sub';

	/**
	 * A row's printed marker and the name beside it.
	 *
	 * Every division of the Code carries a `label` — that is what makes it a
	 * division here at all (`cic.py`'s `split_label`) — so unlike the
	 * Compendium of the Social Doctrine there is no second shape to fall back
	 * to. `canonLawHeadingParts` still runs, for the handful of titles that
	 * open with a list marker of their own.
	 *
	 * The label is ABBREVIATED, not renumbered: `canonLawLabelText` shortens
	 * the noun and keeps the source's own numeral, which is the one thing
	 * `marker()`'s short form cannot do here (its docblock).
	 */
	const heading = (node: StructureNode, rowLang: string) => {
		const parts = canonLawHeadingParts(node.title, rowLang);
		return {
			marker: node.label ? canonLawLabelText(node.label, rowLang) : parts.ordinal,
			title: parts.title
		};
	};

	const workColumns = $derived([{ label: t('nav.canonLaw'), icon: Scale }]);
</script>

<svelte:head>
	<title>{t('canonLaw.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="index-column">
	{#if work}
		<ReadingBar print={false} />
	{/if}

	<h1>{t('canonLaw.landing.title')}</h1>
	<p class="page-tagline">{t('canonLaw.landing.tagline')}</p>

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
	/* Wider than `--content-width`, which is a measure for PROSE — this page
	   is a table, and its width is what its columns need. */
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
