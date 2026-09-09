<script lang="ts">
	import { hrefFor } from '$lib/address';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
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
	 * The reader is told the order is ours whenever it is. A page silently
	 * reordering the Catechism would be a gloss confusable with its source,
	 * which is the one thing this project's name forbids.
	 */
	const reordered = $derived(data.lead !== undefined);

	const title = $derived(t(`quaestiones.${data.slug}.title`));
	const question = $derived(t(`quaestiones.${data.slug}.question`));
</script>

<svelte:head>
	<title>{title} — {t('home.title')}</title>
</svelte:head>

<article class="topic">
	<nav class="up"><a href="/quaestiones">{t('quaestiones.landing.title')}</a></nav>

	<header>
		<h1>{title}</h1>
		<p class="question">{question}</p>
	</header>

	<section class="passages">
		<h2 class="label">{t('quaestiones.passages.heading')}</h2>
		{#if reordered}
			<p class="note">{t('quaestiones.passages.reordered')}</p>
		{/if}
		{#each data.paragraphs as paragraph (paragraph.n)}
			<div class="paragraph">
				<a class="n" href={hrefFor({ kind: 'ccc', n: paragraph.n })}>{paragraph.n}</a>
				<div class="text">
					<ProseBlocks unit={paragraph} lang="en" />
				</div>
			</div>
		{/each}
	</section>

	{#if data.documents.length > 0}
		<section class="documents">
			<h2 class="label">{t('quaestiones.documents.heading')}</h2>
			<p class="note">{t('quaestiones.documents.blurb')}</p>
			<ul>
				{#each data.documents as group (group.slug)}
					{@const manifest = group.manifests.en ?? Object.values(group.manifests)[0]}
					<li>
						<a href={hrefFor({ kind: 'document', slug: group.slug })}>
							{manifest?.title ?? group.slug}
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

	.up {
		font-size: 0.85rem;
		margin-bottom: 1.5rem;
	}

	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	.question {
		margin: 0 0 2rem;
		font-style: italic;
		opacity: 0.75;
	}

	.label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		opacity: 0.6;
		margin: 2rem 0 0.75rem;
		font-weight: 600;
	}

	.note {
		font-size: 0.85rem;
		opacity: 0.7;
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
		opacity: 0.6;
		padding-top: 0.25rem;
		text-decoration: none;
	}

	.n:hover {
		opacity: 1;
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
