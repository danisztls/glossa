<script lang="ts">
	/**
	 * The Compendium of the Social Doctrine's index.
	 *
	 * NOT `StructureIndex`, which draws the Catechism's and its Compendium's
	 * shared outline: that component's spine is `INDEX_OUTLINE_KINDS`
	 * (prologue, part, section, chapter, article) and every node here is a
	 * `sub`, because this work's outline is derived from a DOCUMENT's flat
	 * `{level, title, before}` rows rather than stored as a tree. Bending it
	 * to accept a second shape would make one component answer to two, and
	 * this page needs one column where that one needs two.
	 *
	 * So the index is the fourteen divisions, each with the source's own
	 * headings under it, and the unnumbered matter follows it: the letter of
	 * transmittal, the presentation, the index of references, and whichever
	 * of the two abbreviation tables this edition prints. None of that has an
	 * address — it is what `appendix.json` holds — so this page is where it
	 * has a reader.
	 */
	import {
		flattenSocialDoctrineOutline,
		getSocialDoctrineAbbreviations,
		getSocialDoctrineAppendixAsync,
		getWork,
		socialDoctrineAppendixUnits,
		socialDoctrineDivisions,
		socialDoctrineWorkId
	} from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { displayDocumentTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode } from '$lib/types';

	const lang = $derived(content.langFor('social-doctrine'));
	const workId = $derived(socialDoctrineWorkId(lang));
	const work = $derived(getWork(workId));

	const rows = $derived(flattenSocialDoctrineOutline(lang));
	const divisions = $derived(socialDoctrineDivisions(lang));

	/**
	 * The headings the source prints INSIDE a division, one level in.
	 *
	 * One level and not all of them: the deepest editions run to five, which
	 * is 246 rows on a page whose job is to get a reader into the text. The
	 * whole outline is in the sidebar of every reading page.
	 */
	function sectionsOf(division: {
		from: number;
		to: number;
		node: StructureNode;
	}): StructureNode[] {
		const outerDepth = rows.find((row) => row.node === division.node)?.depth ?? 0;
		return rows
			.filter(({ node, depth }) => {
				const at = node.paragraphs[0];
				return (
					depth === outerDepth + 1 &&
					typeof at === 'number' &&
					at >= division.from &&
					at <= division.to
				);
			})
			.map(({ node }) => node);
	}

	const abbreviations = $derived(getSocialDoctrineAbbreviations(lang));

	/** The abbreviation table grouped under the source's own headings, which
	 *  is the only division either edition draws (see `CccAbbreviation`). */
	const abbreviationSections = $derived.by(() => {
		const bySection = new Map<string, { abbr: string; expansion: string }[]>();
		for (const row of abbreviations) {
			bySection.set(row.section, [...(bySection.get(row.section) ?? []), row]);
		}
		return [...bySection];
	});

	/**
	 * Whether the reader has opened the back matter.
	 *
	 * THE FETCH WAITS ON IT. The appendix is 9 KB in most editions and 207 KB
	 * in Hungarian, none of it addressed by anything, and this is the page a
	 * reader passes through on the way to the text. Starting it on mount
	 * would put the index of references in front of the index.
	 */
	let backMatterOpen = $state(false);
	const appendix = $derived(backMatterOpen ? getSocialDoctrineAppendixAsync(lang) : undefined);
</script>

<svelte:head>
	<title>{t('socialDoctrine.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
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

	{#if divisions.length > 0}
		<ol class="divisions">
			{#each divisions as division (division.from)}
				{@const title = displayDocumentTitle(division.node.title, lang).title}
				{@const sections = sectionsOf(division)}
				<li>
					<a
						class="division-link"
						href={hrefFor({ kind: 'socialDoctrineChapter', n: division.from })}
					>
						{#if division.node.label}<span class="label label-micro">{division.node.label}</span
							>{/if}
						<span class="name">{title}</span>
						<span class="range">¶{division.from}–{division.to}</span>
					</a>
					{#if sections.length > 0}
						<ol class="sections">
							{#each sections as node (node.anchor ?? node.title)}
								{@const at = node.paragraphs[0] as number}
								<li>
									<a href={hrefFor({ kind: 'socialDoctrine', n: at })}>
										{displayDocumentTitle(node.title, lang).title}
									</a>
									<span class="range">¶{at}</span>
								</li>
							{/each}
						</ol>
					{/if}
				</li>
			{/each}
		</ol>
	{/if}

	<!-- ONE DISCLOSURE PER TABLE, LABELLED IN THE SOURCE'S OWN WORDS. Each of
	     the six editions that print a sigla table prints a heading over it —
	     `BIBLICAL ABBREVIATIONS`, `ABRÉVIATIONS BIBLIQUES`, `Ószövetség` — and
	     the corpus stores that heading verbatim beside every row for exactly
	     this (`CccAbbreviation.section`). So the label needs no translation and
	     names what the edition itself calls it. -->
	{#each abbreviationSections as [section, entries] (section)}
		<details class="back-matter">
			<summary><h2 {lang}>{displayDocumentTitle(section, lang).title}</h2></summary>
			<dl class="sigla" {lang}>
				{#each entries as entry (entry.abbr + entry.expansion)}
					<dt>{entry.abbr}</dt>
					<dd>{entry.expansion}</dd>
				{/each}
			</dl>
		</details>
	{/each}

	<!-- The letter of transmittal, the presentation and the index of
	     references: everything the source prints with no number on it, in the
	     order it prints it, with its own headings. This is the one label the
	     corpus cannot supply — the editions' back matter is a different set of
	     things in each, so no heading in any of them names the whole. -->
	{#if socialDoctrineAppendixUnits(lang) > 0}
		<details class="back-matter" bind:open={backMatterOpen}>
			<summary><h2>{t('socialDoctrine.backMatter')}</h2></summary>
			{#await appendix then units}
				<div class="reading-text" {lang}>
					{#each units ?? [] as unit, i (i)}
						{#if unit.title}<h3>{displayDocumentTitle(unit.title, lang).title}</h3>{/if}
						<ProseBlocks {unit} {lang} work={workId} />
					{/each}
				</div>
			{/await}
		</details>
	{/if}
</div>

<style>
	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
	}

	.copyright-notice {
		margin: 0 0 1.5rem;
	}

	.divisions,
	.sections {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.divisions > li {
		margin-block-end: 1.5rem;
	}

	/* The label, the name and the extent on one baseline, with the extent
	   pushed to the far edge — the same row `/documenta`'s list uses, so the
	   two libraries read alike. */
	.division-link {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		text-decoration: none;
	}

	.division-link:hover .name,
	.division-link:focus-visible .name {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.division-link .name {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		color: var(--color-text);
	}

	.division-link .label {
		color: var(--color-text-muted);
	}

	.range {
		margin-inline-start: auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.sections {
		margin-block-start: 0.4rem;
		padding-inline-start: 1rem;
		border-inline-start: 1px solid var(--color-border);
	}

	.sections > li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.9rem;
		padding-block: 0.15rem;
	}

	.back-matter {
		margin-block-start: 2.5rem;
		border-block-start: 1px solid var(--color-border);
		padding-block-start: 1rem;
	}

	.back-matter summary {
		cursor: pointer;
	}

	.back-matter summary h2 {
		display: inline;
		font-family: var(--font-serif);
		font-size: 1.05rem;
	}

	.sigla {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.2rem 1rem;
		font-size: 0.9rem;
	}

	.sigla dt {
		font-weight: 600;
	}

	.sigla dd {
		margin: 0;
		color: var(--color-text-muted);
	}
</style>
