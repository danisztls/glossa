<script lang="ts">
	/**
	 * One note of an annotated edition's apparatus: the marker where the
	 * source sets it, and the gloss it points at.
	 *
	 * STILL NOT `CitationDisclosure.svelte`, though the two now share
	 * everything about how a note BEHAVES (`NoteCard` in
	 * `sidenotes.svelte.ts`). What this one carries is COMMENTARY —
	 * Challoner glossing a verse at the length of a sentence or a paragraph,
	 * with a lemma quoting the words it glosses — where that one carries a
	 * SOURCE. Each keeps its own marker, its own ARIA and its own content;
	 * what stopped being different is the apparatus around them.
	 *
	 * WHERE THERE IS A MARGIN, THE GLOSS IS SET IN IT, open, beside the line
	 * that raises it — the *Glossa Ordinaria* arrangement the project is named
	 * for (docs/decisions.md §Posture). `.margin-note` in app.css is the one
	 * arrangement both apparatuses use.
	 *
	 * WHERE THERE IS NOT, IT IS A CARD OVER THE PAGE, and that is the change a
	 * phone reader feels. It used to open as a block under the line it belongs
	 * to, which broke the verse at the marker and pushed everything after it
	 * down — so opening a note moved the sentence being read, and closing it
	 * moved it back. A note here is a paragraph rather than a phrase, so it
	 * scrolls inside the card instead of resizing it.
	 *
	 * A GLOSS MUST NEVER BE CONFUSABLE WITH ITS SOURCE, the naming rule from
	 * that same entry, is why the note is set smaller, in the sans face, and
	 * (in the margin) physically outside the text column rather than merely
	 * indented within it. Challoner's commentary is not Scripture and must not
	 * be able to be read as though it were.
	 */
	import type { VerseNote } from '$lib/types';
	import { NoteCard, sidenoteRoom } from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';
	import { linkifyInline, plainTextNodes } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import InlineNodes from './InlineNodes.svelte';

	interface Props {
		/** What the note is PRINTED as — "a", "b" — shown in the superscript and
		    again at the head of the note IN THE MARGIN, where a column of them
		    stacks and each has to name itself. The card needs no label: it is
		    anchored to the marker that opened it. NOT `VerseNote.marker`, which
		    is the source's own ordinal and stays in the corpus: the label is
		    lettered per chapter so it cannot be mistaken for a verse number.
		    See `noteLetter`. */
		label: string;
		/** The note itself. `undefined` means the corpus has a token with no
		    note behind it, which the pipeline validates against — so it is a bug
		    rather than a shrug, and the reference still renders so the reader is
		    not silently shown less than the source printed. (`label` then falls
		    back to the source's own marker: there is no note to be the nth of.) */
		note: VerseNote | undefined;
		/** Content language of the note, which is the edition's own — a gloss
		    is written in the language of the edition that carries it, never the
		    reader's. Set on the note so `app.css`'s two direction rules resolve
		    it from the text rather than from the interface. */
		lang: string;
		/** The annotated edition's work id, which the grammar needs here more
		    than anywhere else in the corpus: Challoner writes "2 Kings 24" for
		    2 Samuel 24, and `bible.douay-rheims.en` is in `WORK_CONFIGS` for
		    exactly that reason. Dropping it reads two of his notes into the
		    wrong book. */
		work?: string;
	}

	let { label, note, lang, work }: Props = $props();

	/**
	 * A GLOSS NAMES OTHER PLACES IN THE BOOK, and that is most of what a gloss
	 * is for: Challoner's notes cite Scripture 168 times and Matos Soares's
	 * 267, "See Nm. 18,19", "the annotations, 3 Kings 22". They rendered as
	 * inert text until 2026-08-26, which made the apparatus a dead end exactly
	 * where it was pointing somewhere.
	 *
	 * The VERSE is not linkified and must not be — `AnnotatedText` renders it
	 * as plain runs. Scripture is the text being read, not an apparatus over
	 * it, and a locator-shaped phrase inside a verse ("in the third year of
	 * Osee") is prose, not a citation. The note is the only part of the page
	 * that is commentary.
	 */
	const nodes = $derived(
		linkifyInline(plainTextNodes(note?.text ?? ''), (text) => linkifyProse(text, { lang, work }))
	);

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}

	const inMargin = $derived(sidenoteRoom.margin);

	// See `CitationDisclosure` on why this is a bare top-level declaration.
	const uid = $props.id();
	const card = new NoteCard(uid);
</script>

{#snippet gloss()}
	{#if note}
		{#if note.lemma}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span class="sidenote-text"
			><InlineNodes {nodes} {hrefFor} /></span
		>
	{:else}
		<span class="sidenote-text sidenote-missing">{t('bible.noteMissing')}</span>
	{/if}
{/snippet}

<sup
	class="note-marker"
	class:highlighted={card.lit}
	onpointerenter={card.onPointerEnter}
	onpointerleave={card.onPointerLeave}
>
	<button
		bind:this={card.trigger}
		type="button"
		class="note-trigger"
		popovertarget={card.popovertarget}
		aria-expanded={card.expanded}
		aria-label={`${t('bible.note')} ${label}`}
		onclick={card.onClick}
	>
		{label}
	</button>
</sup>

{#if inMargin}
	<small class="margin-note" class:highlighted={card.lit} {lang}
		><span class="margin-note-label" aria-hidden="true">{label}</span>{@render gloss()}</small
	>
{/if}

<!-- `role="note"` for the reason `CitationDisclosure` gives: ARIA's own word
     for content ancillary to the text it hangs off, and not `tooltip`, which
     must hold nothing interactive where this holds the verses the gloss
     names. `lang` because a gloss is written in its edition's language, not
     the reader's — the card is in the top layer, outside every `lang` the
     page has already declared, so it has to say so itself. -->
<span
	bind:this={card.panel}
	id={card.id}
	popover="auto"
	role="note"
	{lang}
	ontoggle={card.onToggle}
	onpointerenter={card.onPointerEnter}
	onpointerleave={card.onPointerLeave}
	class="floating-panel note-popover">{@render gloss()}</span
>

<style>
	/*
	 * The reference. Superscript, in the sans face so that even at this size
	 * it does not read as part of the serif text it interrupts, and lettered
	 * rather than numbered so it cannot be taken for a verse number — see
	 * `noteLetter`.
	 *
	 * SIZED AND COLOURED AS `.citation-marker` (app.css), which is the other
	 * small raised mark the reader meets in running text. The two open
	 * different things — a source, a gloss — but that is a difference the
	 * opened thing makes and not one the mark should: a reader who has
	 * learned what a raised accent letter means in the Catechism should not
	 * have to learn a second mark to read the Bible. The clamp is that rule's
	 * too, and it earns its keep here: a marker set purely in `em` shrinks
	 * with the text around it and these sit inside verses, which is the
	 * smallest type on the page.
	 *
	 * Its lit state is app.css's, shared with `.citation-marker` for the same
	 * reason the rest of this rule copies one: the two marks must not diverge.
	 */
	.note-marker {
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.7em);
		font-weight: 600;
		line-height: 0;
		color: var(--color-accent);
		/* The source sets the marker immediately after the words it glosses,
		   with no space (docs/corpus-schema.md) — so the only separation is
		   this, and a full space would misrepresent the printed page. */
		padding-inline-start: 0.08em;
		vertical-align: super;
	}

	.note-trigger {
		font: inherit;
		color: inherit;
		background: none;
		border: 0;
		padding: 0;
		cursor: pointer;
		/* A tap target this small needs the padding back somewhere it cannot
		   affect the line box — see `.note-trigger::after`. */
		position: relative;
	}

	.note-trigger::after {
		/* 44x44 CSS px is the accessibility floor for a touch target, and the
		   glyph is nowhere near it. Grown as an overlay rather than by padding
		   so the marker keeps its typographic position in the line. */
		content: '';
		position: absolute;
		inset: 50% 50% 50% 50%;
		min-width: 44px;
		min-height: 44px;
		transform: translate(-50%, -50%);
	}

	.note-trigger:hover,
	.note-trigger:focus-visible {
		text-decoration: underline;
	}

	/*
	 * The card, where there is no margin to set the gloss in. Where it sits is
	 * `.floating-panel` (app.css); what is here is what a GLOSS needs and a
	 * citation does not.
	 *
	 * IT SCROLLS RATHER THAN GROWING. A citation is a phrase and its card is
	 * whatever size the phrase is; a Challoner note runs to a paragraph, and
	 * on the phone this exists for, a card free to grow would cover the verse
	 * it belongs to. `computePanelPosition` pins a panel taller than the
	 * viewport rather than letting it run off, so the cap is what keeps the
	 * card beside its line instead of over the whole page.
	 *
	 * The three signals that keep a gloss from reading as Scripture — sans,
	 * smaller, muted — are the same ones `.margin-note` carries, because any
	 * one of them alone is the kind of difference a reader stops seeing after
	 * a page.
	 */
	.note-popover {
		visibility: hidden;
		max-inline-size: min(26rem, calc(100vw - 1rem));
		max-block-size: min(24rem, 60vh);
		overflow-y: auto;
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
		font-style: normal;
		line-height: 1.5;
		color: var(--color-text-muted);
		overflow-wrap: break-word;
	}

	.sidenote-lemma {
		font-weight: 600;
		color: var(--color-text);
		/* The lemma is the edition's own words quoted back — the printed
		   apparatus sets it apart from the gloss and so does this. The
		   separator is ours: the source's own colon was dropped at ingestion
		   as the apparatus's punctuation rather than either half's text. */
		padding-inline-end: 0.35em;
	}

	.sidenote-missing {
		font-style: italic;
	}
</style>
