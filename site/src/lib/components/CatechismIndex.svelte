<script lang="ts">
	/**
	 * The index of the Catechism — and of its Compendium, which has no index
	 * of its own.
	 *
	 * ONE PAGE FOR BOTH WORKS, because they are one outline published at two
	 * lengths. `toc-pairing.ts` establishes that structurally (every part,
	 * section and chapter pairs, across all 80 edition pairs) and
	 * `condensation.ts` corroborates it from the questions' own `ccc_refs`, so
	 * every row offers both works and offers them ALIKE — see
	 * `StructureIndex` on why the title is not a link.
	 *
	 * The home page shows the same table to a shallower depth, from this same
	 * component and the same resolver (`catechismRows.ts`), so the two cannot
	 * drift the way the hand-written pair of them had.
	 */
	import BookText from '@lucide/svelte/icons/book-text';
	import MessageCircleQuestionMark from '@lucide/svelte/icons/message-circle-question-mark';
	import { getCccStructure, getCompendiumStructure, getWork } from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import type { StructureNode } from '$lib/types';
	import CopyrightNotice from './CopyrightNotice.svelte';
	import ReadingBar from './ReadingBar.svelte';
	import StructureIndex from './StructureIndex.svelte';
	import { catechismRowLinks } from './catechismRows';

	/**
	 * ONE LANGUAGE FOR THE PAGE, and it is the reader's own rather than either
	 * work's fallback — see `content.catechismPairLang`. Six languages carry
	 * one of the two works and not the other, and resolving each work
	 * separately (which this did until 2026-08-28) put an English Catechism
	 * column beside a Hungarian Compendium: an edition the reader did not ask
	 * for, next to one they did.
	 *
	 * So the page carries only the works that exist in THAT language, the
	 * tree comes from whichever of them it has — the Catechism when both, since
	 * its outline is the finer one — and an absent work gets no column at all.
	 */
	const lang = $derived(content.catechismPairLang());
	const cccWork = $derived(getWork(`ccc.${lang}`));
	const compendiumWork = $derived(getWork(`compendium.${lang}`));

	const columns = $derived([
		...(cccWork ? (['ccc'] as const) : []),
		...(compendiumWork ? (['compendium'] as const) : [])
	]);

	const treeWork = $derived(cccWork ? 'ccc' : 'compendium');
	const tree = $derived(cccWork ? getCccStructure(lang) : getCompendiumStructure(lang));
	/** The manifest the copyright notice names: the work the outline is from. */
	const work = $derived(cccWork ?? compendiumWork);

	// Only meaningful when both works are here; with one, the row addresses
	// itself and there is nothing to pair against.
	const pairs = $derived(
		cccWork && compendiumWork
			? pairDivisionsCached(tree, getCompendiumStructure(lang))
			: new Map<StructureNode, StructureNode>()
	);

	const links = $derived((node: StructureNode) =>
		catechismRowLinks(node, {
			tree: treeWork,
			lang,
			columns,
			pairs,
			labels: {
				cccTitle: t('ccc.landing.title'),
				compendiumTitle: t('compendium.landing.title')
			}
		})
	);

	const workColumns = $derived(
		columns.map((column) =>
			column === 'ccc'
				? { label: t('nav.ccc'), icon: BookText }
				: { label: t('nav.compendium'), icon: MessageCircleQuestionMark }
		)
	);
</script>

<svelte:head>
	<title>{t('ccc.landing.title')} — {t('home.title')}</title>
</svelte:head>

<!-- NO SIDEBAR, and this is the one index page that should not have one.
     Every other one lists a work; this one IS the list, and mirroring its four
     parts into a 17rem column beside itself bought a reader four anchors at
     the cost of the width the two work columns need. The width goes to the
     index instead — `.index-column` below is wider than `--content-width`,
     which is a prose measure and not a table's. -->
<div class="index-column">
	<!-- The edition picker alone, sticky over a table of contents that is
	     itself written in that edition — see `ReadingBar`. Guarded on `work`
	     for the same reason the notice below it is: with no manifest there is
	     no edition to offer and the bar would be an empty rule. -->
	{#if work}
		<ReadingBar print={false} />
	{/if}
	<h1>{t('ccc.landing.title')}</h1>
	<!-- The two works' names are emphasised INSIDE each translated sentence,
	     because thirteen of the fourteen do not share English word order and a
	     sentence assembled around a `<strong>` would fix one onto all of them.
	     `{@html}` is safe here on the same terms as the document masthead's
	     (`documenta/[slug]`): the string is a literal in a checked-in
	     dictionary, not passed through from anywhere. -->
	<p class="tagline">{@html t('ccc.landing.tagline')}</p>

	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	<StructureIndex {tree} {lang} {links} {workColumns} noCounterpartLabel={t('ccc.noCounterpart')} />
</div>

<style>
	/* Wider than `--content-width`, which is a measure for PROSE — a count of
	   characters per line. This page is a table: its width is set by what its
	   columns need, and the description above it keeps its own measure. */
	.index-column {
		max-width: 52rem;
		margin-inline: auto;
		padding-inline: 1.25rem;
	}

	/* The page's whole description, and the only prose on it: what the two
	   works are and that the table below indexes both. Its own measure — the
	   column is sized for a table, which is far wider than a line of text
	   should be. */
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
		max-width: 40rem;
		margin-top: 0;
	}

	/* 0.8rem, not the app.css base's 0.75rem — this index page's own outlier. */
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
	}
</style>
