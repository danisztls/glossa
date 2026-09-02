<script lang="ts">
	/**
	 * The Compendium of the Social Doctrine's front matter: Cardinal Sodano's
	 * letter of transmittal and Cardinal Martino's presentation.
	 *
	 * A PAGE AND NOT A DISCLOSURE ON THE INDEX, which is where it lived until
	 * 2026-09-02. Two things forced the move. The index is a table of contents
	 * and this is text — several thousand words of it — so it was the one
	 * thing on that page a reader read rather than scanned. And the disclosure
	 * was carrying the index of references too, ~59 units of concordance in
	 * English and 64 units of the work's own contents list in Hungarian, none
	 * of which is prose; `appendix.json` holds only the letter and the
	 * presentation now (`pipeline/scrapers/csdc.py`), so what is left is a
	 * short, readable, linkable thing that deserves an address.
	 *
	 * It is reached from the last row of the table of contents, after Part
	 * Three, which is where the reader meets it once they have seen the shape
	 * of the book — not before, where the source prints it and where it would
	 * stand between them and the text.
	 */
	import {
		getSocialDoctrineAppendixAsync,
		getWork,
		socialDoctrineAppendixUnits,
		socialDoctrineWorkId
	} from '$lib/corpus';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import { content } from '$lib/content.svelte';
	import { displayDocumentTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';

	const lang = $derived(content.langFor('social-doctrine'));
	const workId = $derived(socialDoctrineWorkId(lang));
	const work = $derived(getWork(workId));

	/**
	 * FETCHED ON ARRIVAL, unlike the disclosure this replaces, which waited on
	 * a click because it sat on the page every reader passes through on the
	 * way to the text. A reader who is here asked for it: waiting would put a
	 * spinner in front of the only thing the page has.
	 */
	const appendix = $derived(getSocialDoctrineAppendixAsync(lang));
	const units = $derived(socialDoctrineAppendixUnits(lang));
</script>

<svelte:head>
	<title>{t('socialDoctrine.appendix')} — {t('socialDoctrine.landing.title')}</title>
</svelte:head>

<div class="content-column">
	<div class="breadcrumb-row">
		<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
			<a href="/doctrina-socialis">{t('nav.socialDoctrine')}</a>
			<span class="sep">›</span>
			<a href={undefined} aria-current="page">{t('socialDoctrine.appendix')}</a>
		</nav>
	</div>

	<!-- The edition picker and print, and nothing else: there is no unit here
	     to bookmark and no numbered text to align a second edition against. -->
	{#if work}
		<ReadingBar />
	{/if}

	<h1>{t('socialDoctrine.appendix')}</h1>

	{#if work}
		<p class="copyright-notice"><CopyrightNotice manifest={work} /></p>
	{/if}

	{#if units > 0}
		{#await appendix then read}
			<div class="reading-text" {lang}>
				{#each read ?? [] as unit, i (i)}
					<!-- The source's own heading where it prints one. Three editions
					     print none over the letter — French's was taken by the sigla
					     table that used to precede it — so the unit opens straight
					     into its text rather than under a heading invented here. -->
					{#if unit.title}<h2>{displayDocumentTitle(unit.title, lang).title}</h2>{/if}
					<ProseBlocks {unit} {lang} work={workId} />
				{/each}
			</div>
		{/await}
	{/if}
	<!-- `csdc.sw` prints no front matter at all, and reaches this branch with
	     nothing to say that would not be a string invented in fourteen
	     languages for one edition. The index does not offer the row in that
	     case, so the page is only reached by typing it; the breadcrumb above
	     is the way back. -->
</div>

<style>
	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
	}

	.copyright-notice {
		margin: 0 0 2rem;
	}

	/* The letter and the presentation are separate documents by separate
	   authors, so each opens a band of the page rather than reading as the
	   next section of one text. */
	.reading-text h2 {
		font-family: var(--font-serif);
		font-size: max(var(--font-size-min), 1.15em);
		margin: 2.5rem 0 1rem;
	}

	.reading-text h2:first-child {
		margin-top: 0;
	}
</style>
