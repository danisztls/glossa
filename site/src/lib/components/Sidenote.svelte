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
	 * AND WHERE THE GLOSS IS LONGER THAN THE MARGIN WILL HOLD, the margin sets
	 * its first four lines and "read more" opens the whole of it in a modal.
	 * The continental annotated editions (Straubinger, Martini, Allioli) print
	 * an apparatus as long as the Scripture it glosses, and a gutter column
	 * taller than the chapter has stopped being beside anything —
	 * `marginOverflows` carries the measurements.
	 *
	 * IT IS A MODAL AND NOT THE CARD BELOW, because of what these notes are:
	 * Straubinger's longest runs 4,830 characters and Martini's 10,243, and a
	 * card anchored beside a marker is a shape for a paragraph. A dialog
	 * centred over the page is the site's own answer for a panel that has
	 * stopped being anchored to anything (`.dialog-bare` and the `.sheet-*`
	 * chrome in `menus.css`, shared with the plate viewer and the tables of
	 * contents), and `showModal()` carries the top layer, the inert page,
	 * Escape and focus with it.
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
	import {
		MARGIN_CLAMP_CHARS,
		marginOverflows,
		NoteCard,
		NoteDialog,
		overflowsCard,
		sidenoteRoom
	} from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';
	import { type InlineNode, linkifyInline, plainTextNodes, splitNodes } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import Icon from './Icon.svelte';
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
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang, work });
	}

	const inMargin = $derived(sidenoteRoom.margin);

	/**
	 * WHETHER THE MARGIN SETS THIS GLOSS OPEN OR ONLY ITS FIRST FOUR LINES.
	 *
	 * The editions this arrangement was written for gloss a verse in a
	 * sentence; Straubinger and Martini gloss one in an essay, and a chapter
	 * of those runs the gutter column past the chapter itself — see
	 * `marginOverflows` for the measurements and for why a character count
	 * rather than a measured overflow. What the clamp costs is the note's
	 * tail, and the dialog below is where the reader gets it back.
	 *
	 * NOTHING ABOUT THE MARKER CHANGES. It still discloses nothing where there
	 * is a margin and still lights its own note on a click (`NoteCard`): a
	 * marker that opened a card for the long notes and lit the gutter for the
	 * short ones would be two controls printed as one mark, and the pointer
	 * would keep raising the card over the prose it was merely crossing. The
	 * way to a clamped note's tail is in the note itself.
	 */
	const clamped = $derived(inMargin && marginOverflows(note));

	/**
	 * The clamped gloss's two halves — what the gutter sets, and what it holds
	 * back until the reader asks.
	 *
	 * THE TAIL IS RENDERED AND HIDDEN, NOT DISCARDED. `-webkit-line-clamp` did
	 * this until 2026-09-01 and had one property worth keeping: the whole note
	 * stayed in the document, so `print.css` restored it with one declaration
	 * and a sheet of paper — which opens no cards — lost nothing. What it could
	 * not do is make its own ellipsis pressable, because a UA ellipsis is
	 * painted rather than built. So the cut is made in `splitNodes` and both
	 * halves are rendered, with `.note-tail` hidden on screen and shown on
	 * paper. See `MARGIN_CLAMP_CHARS` for where 170 comes from; the lemma is
	 * part of the budget because it is set in the same column ahead of the
	 * gloss.
	 */
	const split = $derived(
		clamped ? splitNodes(nodes, MARGIN_CLAMP_CHARS - (note?.lemma?.length ?? 0)) : undefined
	);

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
	const card = new NoteCard(uid, { modal: () => long });

	/** The whole gloss, for a note the margin could only set the head of, and
	    for one the marker itself declines to card. Shared with
	    `CommentaryGloss`, which opens the same dialog for the same reason. */
	const full = new NoteDialog();

	/** Whether a `<dialog>` has to exist at all for this note: because the
	 *  margin clamped it, or because the marker opens one instead of a card. */
	const dialogNeeded = $derived(clamped || card.asModal);
</script>

{#snippet gloss(ns: InlineNode[] = nodes)}
	{#if note}
		{#if note.lemma}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span class="sidenote-text"
			><InlineNodes nodes={ns} {hrefFor} /></span
		>
	{:else}
		<span class="sidenote-text sidenote-missing">{t('bible.noteMissing')}</span>
	{/if}
{/snippet}

<!-- WHAT THE MARKER OPENS IS DECIDED BY HOW LONG THE NOTE IS, not by what
     kind of apparatus it belongs to: a card for a paragraph, a dialog for an
     essay (`CARD_MAX_CHARS`). `popovertarget` goes away for the long ones so
     the browser's own invoker stands down and `full.open()` runs instead, and
     `aria-haspopup`/`aria-expanded` follow the thing that actually opens.
     Unchanged in the margin, where the marker discloses nothing at all. -->
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
		aria-haspopup={card.asModal ? 'dialog' : undefined}
		aria-expanded={card.asModal ? full.rendered : card.expanded}
		aria-label={`${t('bible.note')} ${label}`}
		onclick={card.asModal ? () => full.open() : card.onClick}
	>
		{label}
	</button>
</sup>

{#if inMargin}
	<!-- THE ELLIPSIS IS THE CONTROL, and it is set where a printed page would
	     set one: at the end of the words, on their own line, in the middle of
	     the sentence it is interrupting. It replaced a "read more" on a line
	     of its own, which cost every clamped note a whole line of the gutter
	     to carry two words — and a gutter of clamped notes is exactly what the
	     essayist editions produce. Its accessible name is still those two
	     words, because a lone ellipsis names nothing.

	     THE TAIL IS HERE AND HIDDEN. See `split`: the whole note stays in the
	     document so `print.css` can show it on paper, where nothing opens. -->
	<small class="margin-note" class:highlighted={card.lit} {lang}
		><span class="margin-note-label" aria-hidden="true">{label}</span
		>{#if split && note}{#if note.lemma}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span
				class="sidenote-text"
				><InlineNodes nodes={split.head} {hrefFor} /><button
					type="button"
					class="note-more"
					aria-haspopup="dialog"
					aria-expanded={full.rendered}
					aria-label={t('bible.readMore')}
					title={t('bible.readMore')}
					onclick={() => full.open()}>&hellip;</button
				><span class="note-tail"><InlineNodes nodes={split.tail} {hrefFor} /></span></span
			>{:else}{@render gloss()}{/if}</small
	>
{/if}

<!-- THE WHOLE GLOSS, CENTRED OVER THE PAGE, and it now has two ways in rather
     than one. In the margin it is the rest of a clamped note, reached from the
     ellipsis. Everywhere else it is what the MARKER opens when the gloss is
     past what a card holds (`card.asModal`) — the same panel, because the
     question it answers is the same one: this note is longer than the shape
     that was going to hold it.

     Empty until opened, like `TocMenu`'s: `showModal()` needs the element to
     exist, and a closed `<dialog>` is `display: none`, so nothing inside is
     reachable, focusable or announced meanwhile — while a chapter of
     Straubinger renders forty of these, each already holding its gloss twice.
     `tick()` in `NoteDialog.open` is what puts the content in before the
     dialog is shown, so it is never centred at the wrong size.

     No `role="dialog"`, no `aria-modal`: `showModal()` carries both. `lang`
     because a gloss is written in its edition's language and the top layer
     sits outside every `lang` the page has declared — the same reason the
     card beside it says so. -->
{#if dialogNeeded}
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
     page has already declared, so it has to say so itself. -->
{#if !card.asModal}
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
{/if}

<style>
	/*
	 * THE CLAMP AND THE WAY OUT OF IT, AND NOTHING ELSE.
	 *
	 * SCOPED BECAUSE ONLY THIS APPARATUS CLAMPS. A commentary sets nothing in
	 * the margin at any width, and a citation's source is 26 characters and has
	 * nothing to clamp, so `CommentaryGloss` and `CitationDisclosure` have no
	 * use for either rule below. What DOES have two owners is in
	 * `reading-chrome.css`: `.note-marker`, `.note-trigger`, `.note-popover`,
	 * and — since the commentary's dagger started opening one too —
	 * `.note-dialog` and its three parts, which lived here until 2026-09-01.
	 */

	/*
	 * THE HALF OF A CLAMPED GLOSS THE GUTTER DOES NOT SET, kept in the document
	 * and not painted.
	 *
	 * IT WAS `-webkit-line-clamp` UNTIL 2026-09-01, and what that could not do
	 * is be pressed. A UA ellipsis is painted at the truncation point rather
	 * than built there, so it is not an element, cannot carry a handler and
	 * cannot be given a name — which left the way to the rest of the note as a
	 * separate line under it, spending a line of the gutter on two words for
	 * every clamped note in the column. `splitNodes` makes the same cut in the
	 * node tree instead, and the ellipsis between the halves is a real button.
	 *
	 * `display: none` RATHER THAN A VISUAL HIDE, because the ellipsis beside it
	 * is the announced way to the whole note (`aria-label`) and a screen reader
	 * reading the tail in place would make that control point at text it had
	 * already read. `print.css` turns it back on, which is the property the CSS
	 * clamp had that was worth keeping: paper opens nothing, so a note
	 * truncated there would lose its tail outright.
	 */
	.note-tail {
		display: none;
	}

	/*
	 * THE WAY TO THE REST, SET IN THE SENTENCE IT INTERRUPTS. An ellipsis is
	 * what a printed page puts at a cut, so it needs no label to be understood
	 * as one — and being inline it costs the gutter no line of its own, which
	 * is what the two words it replaced were costing every clamped note in a
	 * column of them.
	 *
	 * Underlined at rest, unlike the rest of the site's list-shaped links,
	 * because it is one character: hover and focus can say WHICH control the
	 * reader is on, but nothing else about three dots says there is a control
	 * here at all.
	 */
	.note-more {
		padding: 0 0.15em;
		border: 0;
		background: none;
		font: inherit;
		color: var(--color-accent);
		text-decoration: underline;
		text-underline-offset: 0.15em;
		cursor: pointer;
	}

	.note-more:hover,
	.note-more:focus-visible {
		text-decoration-thickness: 2px;
	}

	.sidenote-missing {
		font-style: italic;
	}
</style>
