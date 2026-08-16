<script lang="ts">
	import { page } from '$app/state';
	import { getAdjacentChapterAcrossBooks, getCccCitationsForChapter } from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { setPosition } from '$lib/reading-position';
	// Drop cap on the chapter's opening verse only, and only when no section
	// heading precedes it — a cap immediately under a heading collides with
	// it, and the heading is already doing the work of marking the opening.
	import { splitDropCap } from '$lib/dropcap';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * Which embedded edition to render. The URL no longer says (see
	 * `+page.ts`), so this is the reader's own preference, read reactively —
	 * switching edition or interface language re-renders this page in place,
	 * with no navigation and no refetch.
	 *
	 * Falls back to whichever edition IS present when the preferred one has no
	 * text for this chapter, rather than showing a blank page: the same
	 * "degrade, don't 404 a page with real content" posture `ccc/[n]` and
	 * `documents/[slug]` already take.
	 */
	const availableWorkIds = $derived(Object.keys(data.byWorkId));
	const workId = $derived(
		(() => {
			const preferred = content.workIdFor('bible');
			return preferred && data.byWorkId[preferred] ? preferred : availableWorkIds[0];
		})()
	);
	const current = $derived(data.byWorkId[workId]);

	const prev = $derived(getAdjacentChapterAcrossBooks(workId, data.osis, data.chapterN, 'prev'));
	const next = $derived(getAdjacentChapterAcrossBooks(workId, data.osis, data.chapterN, 'next'));

	function headingBefore(verseN: number) {
		return current?.chapter.headings?.find((h) => h.before_verse === verseN);
	}

	/**
	 * The reverse half of the flagship CCC-Bible cross-linking: which
	 * Catechism paragraphs cite the verses on this page.
	 *
	 * Rendered as ONE summary at the foot of the chapter rather than as a
	 * marker on each verse. The marker version was the obvious first idea and
	 * is wrong for this text: some chapters are cited very heavily (John 1
	 * and Matthew 5 among them), and sprinkling superscripts through the verse
	 * flow would turn the reading column into an apparatus — this site's
	 * stated purpose is reading, and the footnote markers already in the text
	 * are as much interruption as it should carry. At the foot, the reader who
	 * wants the concordance gets all of it, and the reader who wants the
	 * chapter never has it in their way.
	 *
	 * Derived from the corpus, not the page data, so it costs nothing in the
	 * prerendered payload: the xrefs index is already inlined for every page.
	 */
	const cccCitations = $derived(getCccCitationsForChapter(data.osis, data.chapterN));

	/**
	 * Verse-keyed rows, in verse order, with the whole-chapter bucket (0)
	 * first, and each row flagged with whether the verse it names actually
	 * exists in the edition being rendered.
	 *
	 * IT SOMETIMES DOESN'T, and the flag is load-bearing rather than
	 * defensive: prerendering caught `/bible/luke/2#v61` pointing at a
	 * chapter that ends at verse 52. Measured across the corpus, 19 of the
	 * ~3,800 references in `xrefs/ccc-bible.json` name a verse outside its
	 * chapter, from two unrelated causes —
	 *
	 *   - dropped-hyphen parse artifacts in the citation grammar ("Dt 6:4-5"
	 *     read as 6:45, "Mt 2:5-6" as 2:56, "Rom 6:3-4" as 6:34), and one
	 *     verse 0; and
	 *   - genuine Hebrew-versus-Vulgate divergence in books the versification
	 *     table does not yet cover — Exodus 40 (Vulgate ends at 36, Hebrew has
	 *     38), Zechariah 2 (13 vs 17), 2 Corinthians 13 (13 vs 14).
	 *
	 * Both are real defects worth fixing upstream, and neither is fixable
	 * here. What this page must not do is invent a link to a verse that isn't
	 * on it, so the citation is still shown — the Catechism really does cite
	 * something here, and hiding that would lose information — but the verse
	 * label is rendered as plain text rather than as an anchor. Same
	 * "degrade, don't fabricate" rule as `.related-unresolved` on the CCC page
	 * and `.unavailable` in the chapter picker.
	 */
	const chapterVerseNumbers = $derived(new Set(current?.chapter.verses.map((v) => v.n) ?? []));

	const cccCitationRows = $derived(
		[...cccCitations.entries()]
			.sort(([a], [b]) => a - b)
			.map(([verse, paragraphs]) => ({
				verse,
				paragraphs,
				present: verse === 0 || chapterVerseNumbers.has(verse)
			}))
	);

	const cccCitationTotal = $derived(
		new Set(cccCitationRows.flatMap((row) => row.paragraphs)).size
	);

	// Reactive rather than onMount: the edition can now change without a
	// navigation (the URL no longer names one), so "continue reading" has to
	// re-record when it does, or it would keep pointing at the edition the
	// reader happened to arrive in.
	$effect(() => {
		if (current) {
			setPosition(workId, `${current.book.name} ${current.chapter.n}`, page.url.pathname);
		}
	});
</script>

<svelte:head>
	<title>{current?.book.name} {data.chapterN} — {current?.work.short_title}</title>
</svelte:head>

{#if current}
	<article class="content-column">
		<p class="edition-label">{current.work.title}</p>
		<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>
		<h1>{current.book.name} {current.chapter.n}</h1>

		<BookChapterPicker currentWorkId={workId} currentOsis={data.osis} currentChapter={data.chapterN} />

		<div class="reading-text" lang={current.work.language}>
			{#each current.chapter.verses as verse, i (verse.n)}
			{@const heading = headingBefore(verse.n)}
			{#if heading}
				<h2 class="section-heading">{heading.text}</h2>
			{/if}
			<span id={`v${verse.n}`} class="verse">
				<sup class="verse-num">{verse.n}</sup
				>{#if i === 0 && !heading}{@const cap = splitDropCap(verse.text)}{#if cap.first}<span
							class="drop-cap-letter">{cap.first}</span
						>{cap.rest}{:else}{verse.text}{/if}{:else}{verse.text}{/if}
			</span>
		{/each}
	</div>

	{#if cccCitationRows.length > 0}
		<section class="ccc-citations" aria-labelledby="ccc-citations-heading">
			<h2 id="ccc-citations-heading">
				{t('bible.citedInCcc')}
				<span class="count">{cccCitationTotal}</span>
			</h2>
			<ul>
				{#each cccCitationRows as row (row.verse)}
					<li>
						<!-- Verse 0 is the corpus's whole-chapter citation sentinel
						     (`verses: []`) — the Catechism cited the chapter, not a
						     verse in it, and saying so is more honest than picking a
						     verse or expanding across all of them. -->
						<span class="verse-ref">
							{#if row.verse === 0}
								{t('bible.wholeChapter')}
							{:else if row.present}
								<a href={`#v${row.verse}`}>{t('bible.verseAbbrev')}&nbsp;{row.verse}</a>
							{:else}
								<span class="verse-absent" title={t('bible.verseNotInEdition')}>
									{t('bible.verseAbbrev')}&nbsp;{row.verse}
								</span>
							{/if}
						</span>
						<span class="paragraphs">
							{#each row.paragraphs as n, i (n)}
								{#if i > 0}<span class="sep" aria-hidden="true">·</span>{/if}
								<a href={`/ccc/${n}`}>¶{n}</a>
							{/each}
						</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<nav class="chapter-nav" aria-label="Chapter navigation">
		{#if prev}
			<a href={`/bible/${prev.osis}/${prev.chapter}`} rel="prev">
				&larr; {t('bible.prevChapter')}
			</a>
		{:else}
			<span></span>
		{/if}
		{#if next}
			<a href={`/bible/${next.osis}/${next.chapter}`} rel="next">
				{t('bible.nextChapter')} &rarr;
			</a>
		{/if}
	</nav>
	</article>
{/if}

<style>
	.edition-label {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.copyright-notice {
		margin: 0.15rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	h1 {
		font-family: var(--font-serif);
		margin-top: 0.25rem;
	}

	.section-heading {
		font-family: var(--font-serif);
		/* em, not rem: scales with .reading-text's own font-size (which
		   carries --reading-scale, owned by app.css) instead of fighting it. */
		font-size: 1.1em;
		font-weight: 600;
		margin: 1.5rem 0 0.5rem;
	}

	.verse {
		margin-right: 0.25em;
	}

	.verse-num {
		font-size: 0.65em;
		color: var(--color-text-muted);
		margin-right: 0.15em;
		user-select: none;
	}

	/* Set as apparatus, not as reading text: sans-serif, small, muted, and
	   below the chapter — deliberately not competing with the text it
	   annotates (see the cccCitations docblock for why this is a footer
	   summary rather than per-verse markers). */
	.ccc-citations {
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	.ccc-citations h2 {
		margin: 0 0 0.6rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.ccc-citations .count {
		font-variant-numeric: tabular-nums;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0 0.3rem;
		letter-spacing: 0;
	}

	.ccc-citations ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		/* Verse label in a fixed column so the paragraph lists line up, which
		   is what makes a long concordance scannable rather than a wall. */
		grid-template-columns: max-content 1fr;
		gap: 0.3rem 0.9rem;
	}

	.ccc-citations li {
		display: contents;
	}

	.ccc-citations .verse-ref {
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.ccc-citations .verse-absent {
		cursor: help;
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	.ccc-citations .paragraphs {
		font-variant-numeric: tabular-nums;
	}

	.ccc-citations .sep {
		margin-inline: 0.3em;
		color: var(--color-text-muted);
	}

	.ccc-citations a {
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	.chapter-nav {
		display: flex;
		justify-content: space-between;
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.95rem;
	}

	.chapter-nav a {
		text-decoration: none;
	}
</style>
