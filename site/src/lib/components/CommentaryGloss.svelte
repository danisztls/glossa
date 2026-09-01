<!--
	One verse's commentary, set in the apparatus lane beside the verse.

	WHY THIS IS NOT `Sidenote`, AND WHY IT IS NOT A PROP ON IT. `Sidenote` is
	built around a marker: it renders a `<sup>` into the running text, and every
	behaviour it has — the card it opens, the highlight pairing note to number,
	the `aria-expanded` that would be a lie if the note were already visible —
	is about the relation between that mark and its gloss. A commentary has no
	mark, and cannot have one. Its lemma quotes the wording of the edition it
	was written on, which is not necessarily the edition on screen: Haydock
	glosses Challoner, and a reader on the Clementine Vulgate has none of those
	words in front of them to hang a token from. So the note is anchored to the
	VERSE and named by its author, which is how a catena is set in print and the
	one arrangement that survives being shown beside a text it does not quote.

	THE LABEL IS THE ATTRIBUTION, NOT A LETTER, and that is what keeps the two
	apparatuses apart in one lane. `Sidenote` letters its notes a, b, c down the
	chapter (`noteLetter`), and a second lettered run beside it would print two
	different "a"s a hand's width apart with nothing to say which belonged to
	which. Naming the commentator instead needs no second vocabulary, collides
	with nothing, and is the more informative label anyway — "Calmet" tells the
	reader whose opinion they are about to read, where "d" tells them nothing.
	An unattributed note is the compiler's own and carries no label.

	AND IT IS A BLOCK BELOW THE MARGIN BREAKPOINT RATHER THAN A DISCLOSURE.
	`Sidenote`'s fallback is a card, because there is a marker to open it from
	and because a gloss appearing in the flow would move the verse the reader
	just clicked in. Neither holds here: there is no marker, and the commentary
	is on for the whole page or off for it — the reader asked for it in the
	panel before the page rendered, so nothing moves under them while they read.
	What that costs is height on a phone, which is the honest price of having
	asked for a commentary on a phone.
-->
<script lang="ts">
	import { linkifyProse } from '$lib/refs-grammar';
	import type { RefSegment } from '$lib/refs-grammar';
	import { linkifyInline, parseInlineMarked, plainTextNodes } from '$lib/inline-html';
	import { refHref } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import { sidenoteRoom } from '$lib/sidenotes.svelte';
	import type { CommentaryNote } from '$lib/types';
	import InlineNodes from './InlineNodes.svelte';

	interface Props {
		/** This verse's notes, in the order the source prints them. */
		notes: CommentaryNote[];
		/** The COMMENTARY's language, not the edition's — a note is written in
		    the language of the work that carries it. Set on the element so
		    `direction.css` resolves script direction from the text. */
		lang: string;
		/** The COMMENTARY's work id, which the grammar needs for the same reason
		    `Sidenote` needs the edition's: Haydock quotes the Douay nomenclature
		    throughout, where "3 Kings" is 1 Kings, so his citations resolve
		    under his own work's config and not under the edition beside him. */
		work: string;
	}

	let { notes, lang, work }: Props = $props();

	const inMargin = $derived(sidenoteRoom.margin);

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}

	/**
	 * A note's own apparatus, where it has one.
	 *
	 * Haydock footnotes his own paragraphs with the Greek and Latin behind a
	 * rendering, so `text_marked` carries `⟦N⟧` tokens over a `notes` array —
	 * the ordinary `Annotated` shape, one level down. The marker renders as a
	 * plain superscript rather than a control: a disclosure inside a note that
	 * is already a disclosure is two things to open for one thing to read, and
	 * the sub-notes are short enough to set under the note they belong to.
	 * Position is what the numeral is for, so it is kept.
	 */
	function nodesOf(note: CommentaryNote) {
		const source = note.text_marked
			? parseInlineMarked(note.text_marked)
			: plainTextNodes(note.text);
		return linkifyInline(source, (text: string) => linkifyProse(text, { lang, work }));
	}
</script>

{#snippet body(note: CommentaryNote)}
	{#if note.lemma}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span class="sidenote-text"
		><InlineNodes nodes={nodesOf(note)} {hrefFor}>
			{#snippet marker(m: string)}<sup class="commentary-submarker">{m}</sup>{/snippet}
		</InlineNodes></span
	>{#if note.attribution}<span class="commentary-attribution">{note.attribution}</span
		>{/if}{#if note.notes?.length}<ol class="commentary-subnotes">
			{#each note.notes as sub (sub.marker)}<li value={Number(sub.marker)}>{sub.text}</li>{/each}
		</ol>{/if}
{/snippet}

{#each notes as note, i (i)}
	{#if inMargin}
		<small class="margin-note commentary-note" {lang}>{@render body(note)}</small>
	{:else}
		<aside class="commentary-block" {lang}>{@render body(note)}</aside>
	{/if}
{/each}

<style>
	/*
	 * THE ATTRIBUTION IS SET AS A CLOSING LINE, not as a heading over the note.
	 * It is where the source puts it, and it reads as the signature it is —
	 * the remark first, then whose it is, which is the order a reader wants
	 * them in and the order every printed catena uses.
	 */
	.commentary-attribution {
		display: block;
		margin-block-start: 0.25em;
		font-style: italic;
		text-align: end;
	}

	.commentary-attribution::before {
		content: '— ';
	}

	/* Smaller again than the note it hangs under, because it is apparatus over
	   apparatus and the reader needs to see at a glance which level they are
	   on. */
	.commentary-subnotes {
		margin-block: 0.4em 0;
		padding-inline-start: 1.5em;
		font-size: 0.9em;
	}

	.commentary-submarker {
		font-size: 0.7em;
		vertical-align: super;
		line-height: 0;
	}

	/*
	 * BELOW THE MARGIN BREAKPOINT, and the rule is inherited rather than
	 * restated: `.margin-note` in `reading-chrome.css` already says what
	 * apparatus looks like on this site — the sans face, the smaller size, the
	 * muted colour, three signals at once. What a block cannot inherit is the
	 * float and its displacement, so this sets only the things that differ:
	 * it sits in the flow, indented from the reading measure by a rule on the
	 * start edge, which is what keeps it from reading as another paragraph of
	 * the verse it follows.
	 */
	.commentary-block {
		margin-block: 0.5rem;
		padding-inline-start: 0.9rem;
		border-inline-start: 2px solid var(--color-border);
		font-family: var(--font-sans);
		font-size: 0.82rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
</style>
