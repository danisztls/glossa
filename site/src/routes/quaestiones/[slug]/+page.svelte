<script lang="ts">
	import { hrefFor } from '$lib/address';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import { content } from '$lib/content.svelte';
	import { sidenoteRoom } from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * THIS PAGE HAS NO GUTTER, so the citations go back to being a disclosure
	 * inside the text (`sidenotes.svelte.ts`, `#claims`) — the same claim
	 * `CompareGrid` makes and for the same underlying reason, arrived at from
	 * the opposite direction. There the slack is spent by a second column;
	 * here it was never reserved at all. The margin is not a gutter some
	 * layout owns: it is whatever `.reading-layout` leaves over, and this page
	 * is not that layout, so every `.margin-note` rendered into it landed in
	 * the paragraph it belonged beside — the citation's text set in the middle
	 * of the sentence that raised it.
	 *
	 * DECLARED HERE RATHER THAN PASSED DOWN, on `CompareGrid`'s reasoning: the
	 * alternative is a prop threaded through `ProseBlocks` and every component
	 * under it to tell each one a fact about the layout it is in.
	 *
	 * WHAT THE READER GETS is the apparatus as it already is below the margin
	 * breakpoint — the marker opens a card on click, and on hover where there
	 * is a pointer. Nothing about a citation is lost; it stops being open
	 * beside the line and goes back behind the number, which is what this page
	 * has room for.
	 */
	$effect(() => sidenoteRoom.claim());

	/**
	 * THE CATECHISM IS SHOWN IN THE READER'S OWN LANGUAGE, which is a
	 * preference and not a route parameter: `+page.ts` embeds every language
	 * the corpus has this topic's paragraphs in, and the choice is made here
	 * so that changing it takes effect without a navigation.
	 *
	 * The fallback is `useEditionCompare`'s, restated rather than imported
	 * because this page has no compare mode and that hook resolves a second
	 * edition against a global store: prefer the reader's language, and where
	 * this topic has no edition in it take the first the corpus does have,
	 * rather than indexing blind and rendering nothing.
	 */
	const langs = $derived(Object.keys(data.byLang));
	const lang = $derived(
		data.byLang[content.langFor('catechism')] ? content.langFor('catechism') : langs[0]
	);
	const edition = $derived(data.byLang[lang]);

	/**
	 * THIS PAGE RENDERS THE CATECHISM AND SAYS SO.
	 *
	 * Every word of text below is the Catechism's, through the same
	 * `ProseBlocks` the paragraph pages use, so a topic cannot come to disagree
	 * with `/catechismus/{n}` about what a paragraph says. What this page adds
	 * is the arrangement — which paragraphs, in which order — and the name is a
	 * promise about arrangement (`docs/decisions.md` §Posture). So the heading
	 * is a question, the body is quotation, and there is no sentence of ours
	 * between them explaining what the quotation means.
	 *
	 * The reader is told the order is ours whenever it is, and `lead` is
	 * resolved per language: an edition short the paragraph the topic wanted
	 * first renders in printed order, and must not then claim otherwise.
	 */
	const reordered = $derived(edition?.lead !== undefined);

	const title = $derived(t(`quaestiones.${data.slug}.title`));
	const question = $derived(t(`quaestiones.${data.slug}.question`));

	/**
	 * A DOCUMENT IS NAMED IN THE EDITION THE READER WOULD OPEN, not in
	 * English. `content.documentWorkIdFor` is the same resolver the link
	 * itself goes through, so the title on this page and the title on the page
	 * it leads to are the same words — which is the whole reason to take the
	 * title from the corpus rather than restate it in the interface. Falls
	 * back to any edition the group has, since a group with no manifests would
	 * not have survived the sync.
	 */
	function documentTitle(group: (typeof data.documents)[number]): string {
		const workId = content.documentWorkIdFor(group.slug);
		const manifests = Object.values(group.manifests);
		const preferred = manifests.find((manifest) => manifest?.id === workId);
		return (preferred ?? manifests[0])?.title ?? group.slug;
	}
</script>

<svelte:head>
	<title>{title} — {t('home.title')}</title>
</svelte:head>

<article class="topic">
	<div class="breadcrumb-row">
		<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
			<a href="/quaestiones">{t('quaestiones.landing.title')}</a>
			<span class="sep">›</span>
			<!-- The last crumb is this page, so it is an `<a>` with no `href` —
			     the shape `.breadcrumb a[href]` in reading-chrome.css exists to
			     tell apart, so that hover offers nothing to follow here. -->
			<a href={undefined} aria-current="page">{title}</a>
		</nav>
	</div>

	<header>
		<h1>{title}</h1>
		<p class="question">{question}</p>
	</header>

	{#if edition}
		<section class="passages">
			<h2 class="label">{t('quaestiones.passages.heading')}</h2>
			{#if reordered}
				<p class="note">{t('quaestiones.passages.reordered')}</p>
			{/if}
			{#each edition.paragraphs as paragraph (paragraph.n)}
				<div class="paragraph">
					<a class="n" href={hrefFor({ kind: 'ccc', n: paragraph.n })}>{paragraph.n}</a>
					<div class="text">
						<ProseBlocks unit={paragraph} {lang} />
					</div>
				</div>
			{/each}
		</section>
	{/if}

	{#if data.documents.length > 0}
		<section class="documents">
			<h2 class="label">{t('quaestiones.documents.heading')}</h2>
			<p class="note">{t('quaestiones.documents.blurb')}</p>
			<ul>
				{#each data.documents as group (group.slug)}
					<li>
						<a href={hrefFor({ kind: 'document', slug: group.slug })}>
							{documentTitle(group)}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.topic.canons && data.topic.canons.length > 0}
		<section class="canons">
			<h2 class="label">{t('quaestiones.canons.heading')}</h2>
			<ul>
				{#each data.topic.canons as [from, to] (from)}
					<li>
						<a href={hrefFor({ kind: 'canonLaw', n: from })}>
							{from}{#if to !== from}–{to}{/if}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>

<style>
	.topic {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1rem;
	}

	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	.question {
		margin: 0 0 2rem;
		font-style: italic;
		color: var(--color-text-muted);
	}

	.label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		margin: 2rem 0 0.75rem;
		font-weight: 600;
	}

	.note {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0 0 1rem;
	}

	.paragraph {
		display: flex;
		gap: 0.9rem;
		margin-bottom: 1.25rem;
	}

	.n {
		flex: 0 0 auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		padding-top: 0.25rem;
		text-decoration: none;
	}

	.n:hover {
		color: var(--color-link);
		text-decoration: underline;
	}

	.text {
		min-width: 0;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	li {
		margin-bottom: 0.35rem;
	}

	/*
	 * THE TWO LISTS AT THE FOOT OF THE PAGE DROP THE UNDERLINE AT REST, on the
	 * exemption `base.css` names and `/schola`'s catalogue took: the mark earns
	 * its place under a link sitting inside a sentence, and every line of these
	 * two lists is a link, so an underline on each is a stack of rules under a
	 * short list of names. Hover and focus restore it — the arrival IS the
	 * interaction, per the same rule.
	 *
	 * SCOPED TO THESE LISTS AND NOT THE PAGE. The citations inside the
	 * Catechism text above are links in running prose, which is the case the
	 * underline exists for, and `ProseBlocks` owns their apparatus styling
	 * besides.
	 */
	.documents a,
	.canons a {
		text-decoration: none;
	}

	.documents a:hover,
	.documents a:focus-visible,
	.canons a:hover,
	.canons a:focus-visible {
		text-decoration: underline;
	}
</style>
