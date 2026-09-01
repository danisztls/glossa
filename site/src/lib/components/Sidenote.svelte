<script lang="ts">
	/**
	 * One note of an annotated edition's apparatus: the marker where the
	 * source sets it, and the gloss it points at.
	 *
	 * STILL NOT `CitationDisclosure.svelte`, though the two share the object
	 * that owns a note's behaviour (`NoteCard` in `sidenotes.svelte.ts`). What
	 * this one carries is COMMENTARY — Challoner glossing a verse at the length
	 * of a sentence or a paragraph, with a lemma quoting the words it glosses —
	 * where that one carries a SOURCE. Each keeps its own marker, its own ARIA
	 * and its own content.
	 *
	 * IT SETS NOTHING IN THE MARGIN AT ANY WIDTH, AND IT DID UNTIL 2026-09-01.
	 * The gloss was set open in the gutter beside the line that raised it — the
	 * *Glossa Ordinaria* arrangement the project is named for — and what
	 * retired it is that the corpus stopped being Challoner. Straubinger,
	 * Martini and Allioli gloss a verse in an essay; a chapter of those ran the
	 * gutter column past the chapter itself, so the note was neither beside the
	 * line that raised it nor bounded by it, and the clamp that kept it in
	 * bounds was cutting most of the apparatus down to an incipit. Haydock's
	 * catena had already been given `margin: false` for exactly that reason
	 * (`CommentaryGloss`), which left one apparatus arranged one way and the
	 * next arranged another. This is the two of them agreeing.
	 *
	 * SO THE MARKER IS THE ONLY WAY IN, and what it opens is decided by LENGTH
	 * rather than by viewport: a card for a paragraph, a dialog past
	 * `CARD_MAX_CHARS`. That is one behaviour at every width, which is what
	 * makes the marker a control that says the same thing about itself
	 * everywhere — `aria-expanded` is always a claim we can keep, a click
	 * always opens something, and there is never a note in the gutter to light.
	 *
	 * IT IS A DIALOG AND NOT THE CARD for the long ones because of what these
	 * notes are: Straubinger's longest runs 4,830 characters and Martini's
	 * 10,243, and a card anchored beside a marker is a shape for a paragraph. A
	 * dialog centred over the page is the site's own answer for a panel that
	 * has stopped being anchored to anything (`.dialog-bare` and the `.sheet-*`
	 * chrome in `menus.css`, shared with the plate viewer and the tables of
	 * contents), and `showModal()` carries the top layer, the inert page,
	 * Escape and focus with it.
	 *
	 * THE CARD OPENS OVER THE PAGE rather than inside the sentence. A gloss
	 * used to open as a block under the line it belongs to, which broke the
	 * verse at the marker and pushed everything after it down — so opening a
	 * note moved the sentence being read, and closing it moved it back. A note
	 * here is a paragraph rather than a phrase, so it scrolls inside the card
	 * instead of resizing it.
	 *
	 * A GLOSS MUST NEVER BE CONFUSABLE WITH ITS SOURCE (docs/decisions.md
	 * §Posture) is why the note is set smaller, in the sans face, on a surface
	 * of its own with its own `lang`. Challoner's commentary is not Scripture
	 * and must not be able to be read as though it were.
	 */
	import type { VerseNote } from '$lib/types';
	import { NoteCard, NoteDialog, overflowsCard } from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';
	import { linkifyInline, plainTextNodes } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import Icon from './Icon.svelte';
	import InlineNodes from './InlineNodes.svelte';

	interface Props {
		/** What the note is PRINTED as — "a", "b" — shown in the superscript,
		    and named again by the marker's and the dialog's accessible names.
		    The card needs no label of its own: it is anchored to the marker that
		    opened it. NOT `VerseNote.marker`, which is the source's own ordinal
		    and stays in the corpus: the label is lettered per chapter so it
		    cannot be mistaken for a verse number. See `noteLetter`. */
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
		/** Whether the VERSE is marking the words this note quotes, in which case
		    the panel must not print them again — see the header. The parent sets
		    it exactly when `splitLemma` located them, so it is false for every
		    unanchored note, which has no place in the text to be marked at, and
		    for the editions that refuse (`lemma.ts`). */
		lemmaMarked?: boolean;
		/** Whether this note is open, reported UPWARD so the verse can light the
		    words it is about while it is.
		 *
		 *  A BINDING AND NOT A SHARED STORE, which was the first shape and the
		 *  wrong one. The pairing is between one unit and its own notes — the
		 *  parent already knows which run of text holds which note's lemma — so a
		 *  page-wide field would have been a singleton standing in for something
		 *  local, and would have needed a key the two components agreed on to
		 *  address it by. `sidenoteRoom` in particular is the MARGIN's object,
		 *  and this has nothing to do with the margin: it is the same question
		 *  answered in the text.
		 *
		 *  At most one is true at a time, which comes free rather than by
		 *  policing: a card is a `popover="auto"`, so opening one dismisses the
		 *  last, and a dialog is modal.
		 *
		 *  NO FALLBACK, AND THAT IS NOT A STYLE CHOICE. `$bindable(false)` throws
		 *  `props_invalid_value` the moment a parent binds a slot that is still
		 *  undefined, which is every note on the page before its first effect
		 *  has run: `AnnotatedText` binds `openNotes[i]` out of a deliberately
		 *  SPARSE array, since only marker positions are ever written. Svelte
		 *  refuses a fallback plus an undefined binding because it cannot tell
		 *  which of the two the parent meant. So the third state is real and is
		 *  named — `undefined` is "this note has not reported yet", which reads
		 *  as not open, which is what it is. */
		open?: boolean;
	}

	let { label, note, lang, work, lemmaMarked = false, open = $bindable() }: Props = $props();

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
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang, work });
	}

	/**
	 * Whether this gloss is past what a card holds — see `CARD_MAX_CHARS`.
	 * Straubinger's longest note is 4,830 characters and Martini's 10,243, and
	 * a card anchored beside a marker is a shape for a paragraph.
	 */
	const long = $derived(
		!!note && overflowsCard((note.lemma?.length ?? 0) + (note.text?.length ?? 0))
	);

	// See `CitationDisclosure` on why this is a bare top-level declaration.
	const uid = $props.id();
	const card = new NoteCard(uid, { margin: false, modal: () => long });

	/** The whole gloss, for a note the marker declines to card. Shared with
	    `CommentaryGloss`, which opens the same dialog for the same reason. */
	const full = new NoteDialog();

	/**
	 * AN OPEN NOTE SAYS SO UPWARD, so the verse can light the words it is about.
	 *
	 * The card and the dialog are one state to the parent: what it is asking is
	 * whether this note is being read, not which shape happens to be holding it.
	 *
	 * WRITTEN WITHOUT READING, which is what keeps it out of `claim()`'s trap —
	 * an effect that reads the state it sets re-enters until Svelte gives up
	 * with `effect_update_depth_exceeded`. Assigning a `$bindable` reads
	 * nothing.
	 */
	$effect(() => {
		open = card.open || full.rendered;
	});

	/* And a note leaving the page takes its highlight with it, which the effect
	   above cannot do: it reports `false` on CLOSING, and a note destroyed while
	   open never closes. `NoteCard`'s constructor carries the same pair for the
	   card's own teardown, and for the same reason. */
	$effect(() => () => {
		open = false;
	});
</script>

<!-- THE HEADWORD IS PRINTED ONLY WHERE THE VERSE IS NOT MARKING IT. A lemma
     quotes the words the note glosses, and the note opens FROM those words —
     so repeating them at the head of the card answers a question the reader
     cannot have, and spends the first line of every note saying what the mark
     they just pressed already said. Where `splitLemma` cannot locate them it
     is printed exactly as before, which is most of Martini and none of
     Challoner (`lemma.ts`). -->
{#snippet gloss()}
	{#if note}
		{#if note.lemma && !lemmaMarked}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span
			class="sidenote-text"><InlineNodes {nodes} {hrefFor} /></span
		>
	{:else}
		<span class="sidenote-text sidenote-missing">{t('bible.noteMissing')}</span>
	{/if}
{/snippet}

<!-- WHAT THE MARKER OPENS IS DECIDED BY HOW LONG THE NOTE IS, not by what
     kind of apparatus it belongs to and not by how wide the window is: a card
     for a paragraph, a dialog for an essay (`CARD_MAX_CHARS`).
     `popovertarget` goes away for the long ones so the browser's own invoker
     stands down and `full.open()` runs instead, and
     `aria-haspopup`/`aria-expanded` follow the thing that actually opens. -->
<sup class="note-marker" onpointerenter={card.onPointerEnter} onpointerleave={card.onPointerLeave}>
	<button
		bind:this={card.trigger}
		type="button"
		class="note-trigger"
		popovertarget={card.popovertarget}
		aria-haspopup={card.asModal ? 'dialog' : undefined}
		aria-expanded={card.asModal ? full.rendered : card.expanded}
		aria-label={`${t('bible.note')} ${label}`}
		onclick={card.asModal ? () => full.open() : card.onClick}
	>
		{label}
	</button>
</sup>

<!-- THE WHOLE GLOSS, CENTRED OVER THE PAGE, for a note past what a card
     holds (`card.asModal`) — the same panel `CommentaryGloss` opens, because
     the question it answers is the same one: this note is longer than the
     shape that was going to hold it.

     Empty until opened, like `TocMenu`'s: `showModal()` needs the element to
     exist, and a closed `<dialog>` is `display: none`, so nothing inside is
     reachable, focusable or announced meanwhile — while a chapter of
     Straubinger renders forty of these, each already holding its gloss once
     in the card below.
     `tick()` in `NoteDialog.open` is what puts the content in before the
     dialog is shown, so it is never centred at the wrong size.

     No `role="dialog"`, no `aria-modal`: `showModal()` carries both. `lang`
     because a gloss is written in its edition's language and the top layer
     sits outside every `lang` the page has declared — the same reason the
     card beside it says so. -->
{#if card.asModal}
	<dialog
		bind:this={full.el}
		class="dialog-bare note-dialog"
		{lang}
		aria-label={`${t('bible.note')} ${label}`}
		onclose={full.onClose}
		onclick={full.onClick}
	>
		{#if full.rendered}
			<!-- NO HEAD BAR. The panel holds one gloss and nothing else, so a
			     head here would carry a title naming what the reader just
			     pressed and a rule under it dividing that from nothing — a
			     band of empty page above every note. The dialog's
			     `aria-label` is where the note's name belongs, for the
			     reader who cannot see which marker was pressed.

			     The way out is set INTO the gloss instead, first in the
			     source order so `showModal()` lands focus on it, and
			     floated so the text closes around it. It scrolls away with
			     the text on a long note, which is affordable: a modal
			     `<dialog>` carries its own backdrop and Escape key at every
			     width, unlike the sheet this borrows its chrome from. -->
			<div class="sheet-panel panel-surface note-dialog-panel">
				<div class="sheet-body note-dialog-body">
					<button
						type="button"
						class="sheet-close note-dialog-close"
						aria-label={t('ui.close')}
						title={t('ui.close')}
						onclick={full.close}
					>
						<Icon name="x" />
					</button>
					{@render gloss()}
				</div>
			</div>
		{/if}
	</dialog>
{/if}

<!-- `role="note"` for the reason `CitationDisclosure` gives: ARIA's own word
     for content ancillary to the text it hangs off, and not `tooltip`, which
     must hold nothing interactive where this holds the verses the gloss
     names. `lang` because a gloss is written in its edition's language, not
     the reader's — the card is in the top layer, outside every `lang` the
     page has already declared, so it has to say so itself.

     RENDERED EVEN FOR A NOTE THAT OPENS THE DIALOG INSTEAD, which is the one
     place this diverges from `CommentaryGloss`, and the reason is PAPER. A
     closed popover is `display: none` and a closed `<dialog>` holds nothing at
     all (`NoteDialog.rendered`), so with the gloss out of the margin this is
     the only copy of an edition's apparatus left in the document — and
     `print.css` sets it back into the flow under the line that raised it,
     which is where `.margin-note` used to print it. Gating it on
     `!card.asModal` would print the short notes and drop the long ones, which
     is the worse half of both answers. Nothing opens it for those notes:
     `popovertarget` is absent and the pointer stands down. -->
<span
	bind:this={card.panel}
	id={card.id}
	popover="auto"
	role="note"
	{lang}
	ontoggle={card.onToggle}
	onpointerenter={card.onPointerEnter}
	onpointerleave={card.onPointerLeave}
	class="panel-surface floating-panel note-popover">{@render gloss()}</span
>

<style>
	/*
	 * ONE RULE, AND IT IS THE ONE NOTHING ELSE HAS A USE FOR.
	 *
	 * Everything about how this note is SET has two owners or more and lives in
	 * `reading-chrome.css`: `.note-marker`, `.note-trigger`, `.note-popover`,
	 * `.note-dialog` and its three parts. A class name borrowed across a Svelte
	 * component boundary is silently unstyled rather than an error, which is
	 * why the shared rules are global and this file holds only what is
	 * genuinely this component's.
	 *
	 * It held the margin clamp and its ellipsis button until 2026-09-01, when
	 * the gloss stopped being set in the margin at all — see the header.
	 */
	.sidenote-missing {
		font-style: italic;
	}
</style>
