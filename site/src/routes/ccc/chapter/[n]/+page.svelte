<script lang="ts">
	/**
	 * A whole CCC chapter in one page — the destination of the
	 * "read the full chapter" link on `/ccc/[n]`.
	 *
	 * Continuous prose rather than the single-paragraph route's card: no
	 * per-paragraph headings, no prev/next paragraph nav, just the text with
	 * its numbers set in the margin, which is how the Catechism is actually
	 * printed and how anyone reading more than one paragraph at a time wants
	 * it. Each paragraph keeps an `id` so `/ccc/chapter/27#p31` addresses a
	 * specific paragraph within the chapter, and so the link back from a
	 * single paragraph can land the reader where they already were.
	 */
	import { page } from '$app/state';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CccParagraphText from '$lib/components/CccParagraphText.svelte';
	import { setPosition } from '$lib/reading-position';
	import { content } from '$lib/content.svelte';
	import { displayTitle } from '$lib/titles';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const availableLangs = $derived(Object.keys(data.byLang));
	const lang = $derived(
		data.byLang[content.langFor('catechism')] ? content.langFor('catechism') : availableLangs[0]
	);
	const current = $derived(data.byLang[lang]);
	const heading = $derived(current ? displayTitle(current.chapter, lang) : undefined);

	// Scroll the reader to the paragraph they arrived from. SvelteKit restores
	// a `#hash` on navigation, but arriving here from `/ccc/31`'s footer link
	// there is no hash to restore — the link carries the paragraph as the
	// hash precisely so this works, and this effect covers the case where the
	// element only exists after the language-dependent render.
	$effect(() => {
		if (current) setPosition(current.work.id, headingText(), page.url.pathname);
	});

	function headingText(): string {
		if (!current) return '';
		const dt = displayTitle(current.chapter, lang);
		return dt.ordinal ? `${dt.ordinal} ${dt.title}` : dt.title;
	}
</script>

<svelte:head>
	<title>{headingText()} — {t('home.title')}</title>
</svelte:head>

{#if current && heading}
	{@const from = current.chapter.paragraphs[0]}
	{@const to = current.chapter.paragraphs[1]}
	<article class="content-column">
		<nav class="breadcrumb" aria-label="Breadcrumb">
			<a href="/ccc">{t('nav.ccc')}</a>
		</nav>

		<h1>
			{#if heading.ordinal}<span class="ordinal">{heading.ordinal}</span>{/if}
			{heading.title}
		</h1>
		<p class="range">¶{from}–{to}</p>

		<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>

		<div class="reading-text ccc-body chapter-body" lang={current.work.language}>
			{#each current.paragraphs as paragraph, i (paragraph.n)}
				<section class="para" id={`p${paragraph.n}`} class:in-brief={paragraph.in_brief}>
					<!-- The number is a link back to the paragraph's own page: this
					     view is for reading, that one for citing and cross-linking,
					     and a reader who wants the second from inside the first
					     should not have to go back through the TOC. -->
					<a class="para-n" href={`/ccc/${paragraph.n}`} aria-label={`CCC ${paragraph.n}`}>
						{paragraph.n}
					</a>
					<!-- The CSS `::first-letter` drop cap works here (unlike in the
					     Bible reader) precisely because `.para-n` is absolutely
					     positioned: the first inline content of `.para-text` really
					     is the first letter of the prose. Opening paragraph only,
					     and never on an "in brief" summary block. -->
					<div class="para-text" class:drop-cap={i === 0 && !paragraph.in_brief}>
						<CccParagraphText {paragraph} {lang} />
					</div>
				</section>
			{/each}
		</div>
	</article>
{/if}

<style>
	.breadcrumb {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-bottom: 0.75rem;
	}

	.breadcrumb a {
		text-decoration: none;
		color: var(--color-text-muted);
	}

	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.25rem;
	}

	h1 .ordinal {
		color: var(--color-text-muted);
		margin-right: 0.35em;
	}

	.range {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	.copyright-notice {
		margin: 0 0 2rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	/* Paragraph numbers hang in the left margin where there's room for them,
	   the way the printed Catechism sets them. Below that width there is no
	   margin to hang into, so they fall back to sitting above the text (see
	   the media query) rather than eating into the measure. */
	.para {
		position: relative;
		margin-bottom: 1.1rem;
	}

	.para-n {
		position: absolute;
		inset-inline-start: -3.25rem;
		top: 0.15em;
		width: 2.75rem;
		text-align: end;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.para-n:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	/* "In brief" summary blocks are set apart in the printed text too; without
	   this they read as just more prose in a wall of it. */
	.para.in-brief .para-text {
		border-inline-start: 2px solid var(--color-border);
		padding-inline-start: 0.9rem;
		font-size: 0.95em;
		color: var(--color-text-muted);
	}

	@media (max-width: 60rem) {
		.para-n {
			position: static;
			display: block;
			width: auto;
			text-align: start;
			margin-bottom: 0.15rem;
		}
	}
</style>
