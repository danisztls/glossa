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

	interface Props {
		question: CompendiumQuestion;
		lang: string;
		href?: string;
	}

	let { question, lang, href }: Props = $props();
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

	{#if question.ccc_refs}
		<p class="ccc-refs">
			<span class="refs-label">{t('compendium.condenses')}</span>
			<RefText text={question.ccc_refs} {lang} />
		</p>
	{/if}
{/snippet}

{#if href}
	<section class="question" id={`q${question.n}`}>
		<a class="question-n" {href} aria-label={`${t('compendium.question')} ${question.n}`}>
			{question.n}
		</a>
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
		font-size: 0.8em;
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
		margin-right: 0.4em;
	}

	.question {
		position: relative;
		margin-bottom: 2rem;
	}

	.question-n {
		position: absolute;
		inset-inline-start: -3.25rem;
		top: 0.15em;
		width: 2.75rem;
		text-align: end;
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-apparatus);
		text-decoration: none;
	}

	.question-n:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	@media (max-width: 60rem) {
		.question-n {
			position: static;
			display: block;
			width: auto;
			margin-bottom: 0.15rem;
			text-align: start;
		}
	}
</style>
