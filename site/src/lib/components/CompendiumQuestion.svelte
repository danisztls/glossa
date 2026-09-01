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
	import { hrefFor as addressHrefFor } from '$lib/address';
	import { linkifyInline, plainTextNodes } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import InlineNodes from './InlineNodes.svelte';

	interface Props {
		question: CompendiumQuestion;
		lang: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it — works of the Douay tradition, which name the
		    books of Kings its way and number the Psalter the Vulgate's — and passing nothing reads the work as its language
		    reads. */
		work?: string;

		href?: string;
		/** False in compare mode when both editions cite the SAME CCC
		 *  paragraphs, because the grid then prints that line once beneath the
		 *  pair instead of once inside each column — the reference set belongs
		 *  to the question, not to either translation of it. See
		 *  `CompareGrid`'s `apparatus`. Left true when the two disagree, since
		 *  then each column really is saying something of its own. */
		showRefs?: boolean;
	}

	let { question, lang, work, href, showRefs = true }: Props = $props();

	/** The question's own page — its canonical address, and what `href` points
	 *  at in the chapter reader. Derived rather than taken as a prop so the
	 *  single-question view and the chapter view cannot disagree about it. */
	const canonicalHref = $derived(addressHrefFor({ kind: 'compendium', n: question.n }));

	/**
	 * THE QUESTION CARRIES REFERENCES TOO — eight of them do, in every edition
	 * that has those questions (65 across the ten): the Compendium asks about a
	 * verse by quoting it, and prints the locator in the question itself.
	 * "Why is it important to affirm 'In the beginning God created the heavens
	 * and the earth' (Genesis 1:1)?" is not chrome around the answer, it is the
	 * first place the reader meets the reference.
	 */
	const questionNodes = $derived(
		linkifyInline(plainTextNodes(question.question), (text) => linkifyProse(text, { lang, work }))
	);

	function refHrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang, work });
	}
</script>

{#snippet qa()}
	<p class="qa-question">
		<span class="qa-label" aria-hidden="true">Q</span>
		<span><InlineNodes nodes={questionNodes} hrefFor={refHrefFor} /></span>
	</p>

	<div class="qa-answer">
		<span class="qa-label" aria-hidden="true">A</span>
		<span class="visually-hidden">{t('compendium.answer')}</span>
		<div class="qa-answer-body">
			<CompendiumAnswer blocks={question.answer_blocks} {lang} {work} />
		</div>
	</div>

	{#if question.ccc_refs && showRefs}
		<p class="ccc-refs">
			<span class="refs-label">{t('compendium.condenses')}</span>
			<RefText text={question.ccc_refs} {lang} {work} />
		</p>
	{/if}
{/snippet}

{#if href}
	<section
		class="question"
		id={`q${question.n}`}
		class:unit-bookmarked={bookmarks.has(canonicalHref)}
	>
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
</style>
