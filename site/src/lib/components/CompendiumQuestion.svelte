<!--
	One Compendium Q&A, shared by the single-question and full-chapter readers.
	`href`, when present, adds the chapter reader's margin number linking back
	to this question's own page.
-->
<script lang="ts">
	import { t } from '$lib/i18n.svelte';
	import type { CompendiumQuestion } from '$lib/types';
	import CompendiumAnswer from './CompendiumAnswer.svelte';
	import RefText from './RefText.svelte';
	import ReferenceNumber from './ReferenceNumber.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';

	interface Props {
		question: CompendiumQuestion;
		lang: string;
		href?: string;
		/** False in compare mode when both editions cite the SAME CCC
		 *  paragraphs, because the grid then prints that line once beneath the
		 *  pair instead of once inside each column — the reference set belongs
		 *  to the question, not to either translation of it. See
		 *  `CompareGrid`'s `apparatus`. Left true when the two disagree, since
		 *  then each column really is saying something of its own. */
		showRefs?: boolean;
	}

	let { question, lang, href, showRefs = true }: Props = $props();

	/** The question's own page — its canonical address, and what `href` points
	 *  at in the chapter reader. Derived rather than taken as a prop so the
	 *  single-question view and the chapter view cannot disagree about it. */
	const canonicalHref = $derived(`/compendium/${question.n}`);
</script>

{#snippet qa()}
	<p class="qa-question">
		<span class="qa-label" aria-hidden="true">Q</span>
		<span>{question.question}</span>
	</p>

	<div class="qa-answer">
		<span class="qa-label" aria-hidden="true">A</span>
		<span class="visually-hidden">{t('compendium.answer')}</span>
		<div class="qa-answer-body">
			<CompendiumAnswer blocks={question.answer_blocks} />
		</div>
	</div>

	{#if question.ccc_refs && showRefs}
		<p class="ccc-refs">
			<span class="refs-label">{t('compendium.condenses')}</span>
			<RefText text={question.ccc_refs} {lang} />
		</p>
	{/if}
{/snippet}

{#if href}
	<section class="question" id={`q${question.n}`} class:bookmarked={bookmarks.has(canonicalHref)}>
		<ReferenceNumber
			n={question.n}
			{href}
			{canonicalHref}
			label={`${t('compendium.question')} ${question.n}`}
			placement="margin"
		/>
		{@render qa()}
	</section>
{:else}
	{@render qa()}
{/if}

<style>
	.qa-question {
		display: flex;
		align-items: baseline;
		gap: 0.75em;
		margin: 0 0 1.25em;
		font-weight: 600;
		font-style: italic;
	}

	.qa-answer {
		display: flex;
		align-items: flex-start;
		gap: 0.75em;
		margin: 0 0 1.5em;
	}

	.qa-label {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		height: 1.6em;
		border: 1px solid var(--color-border);
		border-radius: 50%;
		background: var(--color-bg-elevated);
		color: var(--color-accent);
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.8em);
		font-style: normal;
		font-weight: 700;
	}

	.qa-answer-body {
		flex: 1;
		min-width: 0;
	}

	.ccc-refs {
		border-top: 1px solid var(--color-border);
		padding-top: 0.75rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.refs-label {
		margin-inline-end: 0.4em;
	}

	.question {
		position: relative;
		margin-bottom: 2rem;
	}

	/* The reader's own mark; the number carries the same colour. */
	.question.bookmarked {
		background: color-mix(in srgb, var(--color-bookmark) 12%, transparent);
		border-radius: 0.25rem;
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
	}
</style>
