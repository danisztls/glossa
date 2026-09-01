<!--
	The divisions of a scholastic article, in the order the work prints them.

	These are an ADDRESS SPACE, not a rendering choice: this corpus's own
	footnotes cite `co.` (the body) and `ad 3` (the third reply) as locators,
	which is why the parser keeps them apart instead of flattening the article
	into prose, and why each one carries an id here. Nothing links to those
	ids yet — `refHref` resolves a citation as far as its article — but the
	anchors cost nothing and are what a division-level link would need.

	`preamble` and `postscript` are the kinds that are not Aquinas's, and both
	are deliberately unlabelled beyond a quiet "Note": they hold the
	translator's bracketed remark that opens 2 articles of 3,113 and the one
	editorial essay the edition appends after a last reply, and giving either
	a division's heading would present an editorial aside as part of the
	argument.

	WHAT THIS COMPONENT IS, after the divisions' prose moved out, is the
	structure: the label, the anchor, and the rule down the body. The blocks
	themselves go through `ProseBlocks`, which was already rendering the
	CCC's and the documents' blocks by exactly the same path this file
	described in prose — walk the markup, linkify the references found in
	running text, never `{@html}`. A division's blocks satisfy its `paragraph`
	prop structurally (`{ html: string }` is the `html`-only subset of
	`CccBlock`), and `citations: []` says what is true of a division: the
	Summa's apparatus is its own divisions, not numbered notes.
-->
<script lang="ts">
	import { t } from '$lib/i18n.svelte';
	import type { SummaDivision } from '$lib/types';
	import ProseBlocks from './ProseBlocks.svelte';

	interface Props {
		divisions: SummaDivision[];
		lang: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it — works of the Douay tradition, which name the
		    books of Kings its way and number the Psalter the Vulgate's — and passing nothing reads the work as its language
		    reads. */
		work?: string;
		/** Prefix for the generated ids, so two articles on one page cannot collide. */
		idPrefix?: string;
		/** Set an illuminated initial on the opening of the argument — the caller
		    decides, because it is the one that knows these divisions open an
		    article rather than sitting inside a compare column. */
		dropCap?: boolean;
	}

	let { divisions, lang, work, idPrefix = '', dropCap = false }: Props = $props();

	/**
	 * Which division the initial opens on: the first one that is AQUINAS'S.
	 *
	 * Not simply the first, because `preamble` is the translator's bracketed
	 * remark before the argument starts (2 articles of 3,113 carry one), and an
	 * initial there would illuminate the edition's aside and leave the objection
	 * beneath it opening on nothing. `ProseBlocks` makes the same call one level
	 * down for a `quote` block, and for the same reason.
	 */
	const capIndex = $derived(
		dropCap ? divisions.findIndex((division) => division.kind !== 'preamble') : -1
	);

	function label(division: SummaDivision): string {
		switch (division.kind) {
			case 'objection':
				return `${t('summa.objection')} ${division.n ?? ''}`.trim();
			case 'reply':
				// An unnumbered reply is real: `ad arg.` answers the objections
				// together rather than one by one, and inventing an ordinal for
				// it would make it look like `ad 1` to a reader and to a future
				// citation parser alike.
				return `${t('summa.reply')} ${division.n ?? ''}`.trim();
			case 'sed-contra':
				return t('summa.sedContra');
			case 'corpus':
				return t('summa.corpus');
			case 'preamble':
			case 'postscript':
				// One label for both, because the reader is being told the same
				// thing either way: this is the edition's note, not the
				// argument. Where it sits on the page already says which end of
				// the article it came from, so a second word for it would only
				// name a distinction that costs nine more translations and
				// tells nobody anything.
				return t('summa.preamble');
		}
	}

	/** The locator this division answers to in a citation (`arg. 1`, `co.`). */
	function anchor(division: SummaDivision): string | undefined {
		const suffix =
			division.kind === 'objection'
				? `arg${division.n ?? ''}`
				: division.kind === 'reply'
					? `ad${division.n ?? ''}`
					: division.kind === 'sed-contra'
						? 'sc'
						: division.kind === 'corpus'
							? 'co'
							: undefined;
		return suffix ? `${idPrefix}${suffix}` : undefined;
	}
</script>

{#each divisions as division, i (i)}
	<section class="division" class:body={division.kind === 'corpus'} id={anchor(division)}>
		<h3 class="division-label label-micro">{label(division)}</h3>
		<ProseBlocks
			unit={{ blocks: division.blocks, citations: [] }}
			{lang}
			{work}
			dropCap={i === capIndex}
		/>
	</section>
{/each}

<style>
	/* `--prose-block-gap` is read by `ProseBlocks`'s paragraphs, which are
	   this component's children and so out of reach of a scoped `.division p`.
	   A division's blocks are consecutive paragraphs of ONE argument, and want
	   to sit closer together than the 1.25rem that separates one division from
	   the next — otherwise the two breaks read as the same break. */
	.division {
		margin: 1.25rem 0;
		--prose-block-gap: 0.6rem;
	}

	/*
	 * The body of the article is the answer; the objections and replies argue
	 * around it. A left rule marks it without shouting — the reader's eye
	 * should be able to find "I answer that" in a long article at a glance,
	 * which is how the work is actually read.
	 */
	.division.body {
		border-inline-start: 2px solid var(--color-border);
		padding-inline-start: 1rem;
	}

	/* The division's NAME is chrome, not text — it is ours, not the source's
	   ("Objection 2", "I answer that"), so it takes `.label-micro`
	   (styles/components.css). The face matters more here than at most label
	   sites: this component renders INSIDE `.reading-text`, whose serif and
	   reader-adjustable size would otherwise govern it and make our word look
	   like the source's. */
	.division-label {
		margin: 0 0 0.35rem;
		font-weight: 600;
	}
</style>
