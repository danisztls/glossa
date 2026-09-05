<script lang="ts">
	/**
	 * The index of the Catechism and of its Compendium, and the door the nav
	 * bar's "Learn" opens.
	 *
	 * ONE PAGE FOR BOTH WORKS, because they are one outline published at two
	 * lengths. `toc-pairing.ts` establishes that structurally (every part,
	 * section and chapter pairs, across all 80 edition pairs) and
	 * `condensation.ts` corroborates it from the questions' own `ccc_refs`, so
	 * every row offers both works and offers them ALIKE — see
	 * `StructureIndex` on why the title is not a link.
	 *
	 * THIS IS A TABLE OF DIVISIONS, WHICH IS NOT THE ONLY WAY IN, and that is
	 * why the Compendium has an index of its own since 2026-09-04
	 * (`routes/catechismus/compendium/+page.svelte`). Being a table of parts
	 * and sections is exactly right for a reader who knows the outline and
	 * wrong for the reader the Compendium was written for, who arrives holding
	 * a question. Both pages exist; this one is the pair, that one is the
	 * questions.
	 *
	 * The home page carried the same table to a shallower depth until the same
	 * day, when it became the liturgical day and five doors: two full indices
	 * were most of its height, which is why nothing ingested after them was
	 * ever added to it (`routes/+page.svelte`).
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
	<p class="page-tagline">{@html t('ccc.landing.tagline')}</p>

	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	<StructureIndex {tree} {lang} {links} {workColumns} noCounterpartLabel={t('ccc.noCounterpart')} />

	<!--
		THE REST OF THE SHELF. The bar's "Learn" pointed here for one day, so
		this section existed to make the shelf reachable through it; it points
		at `/schola` now, and this section stays because a reader already
		looking at the Catechism's index should not have to go back out to the
		portal to find the shorter book beside it. Its heading is the link, so
		the word "Learn" names the page that is actually called that.

		TWO ROWS AND NOT TWO MORE INDICES, deliberately. The table above is
		already the longest thing on the site's chrome; the Compendium's own
		index and the Social Doctrine's are each a page in their own right, and
		reproducing either here would repeat the mistake the home page was just
		relieved of — an index of an index, at the cost of the page's bottom.

		WHY THE SOCIAL DOCTRINE IS ON THIS SHELF AT ALL: it is a systematic
		synthesis read THROUGH, not a dated act cited singly, which is the axis
		the shelf sorts on. `/bibliotheca`'s docblock carries the argument, and
		the address space agrees without being asked —
		`/doctrina-socialis/{n}` and `/doctrina-socialis/caput/{n}` mirror this
		work's two exactly.

		The Compendium of the Social Doctrine must never be labelled bare
		"Compendium" beside this page's other one: both rows print their full
		titles, which is the whole price of putting them one click apart.
	-->
	<nav class="shelf" aria-labelledby="shelf-heading">
		<h2 id="shelf-heading" class="shelf-heading">
			<a href="/schola">{t('nav.learn')}</a>
		</h2>
		<ul>
			<li>
				<a href="/catechismus/compendium">{t('compendium.landing.title')}</a>
				<p>{t('compendium.landing.tagline')}</p>
			</li>
			<li>
				<a href="/doctrina-socialis">{t('socialDoctrine.landing.title')}</a>
				<p>{t('socialDoctrine.landing.tagline')}</p>
			</li>
		</ul>
	</nav>
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
	.page-tagline {
		max-width: 40rem;
	}

	/* 0.8rem, not the app.css base's 0.75rem — this index page's own outlier. */
	.copyright-notice {
		margin: 0 0 1.5rem;
		font-size: 0.8rem;
	}

	/* The rest of the shelf, under the table. It takes the tagline's measure
	   rather than the table's: these two rows are prose, and the width the
	   columns need is not a width a sentence should be set to. */
	.shelf {
		max-width: 40rem;
		margin: 2.5rem 0 0;
		padding-top: 1.25rem;
		border-top: 1px solid var(--color-border);
	}

	.shelf-heading {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		margin: 0 0 0.75rem;
	}

	.shelf ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.shelf li {
		margin-bottom: 0.9rem;
	}

	.shelf p {
		margin: 0.15rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}
</style>
