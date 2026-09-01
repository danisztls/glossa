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
	import { marginOverflows, NoteCard, NoteDialog, sidenoteRoom } from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';
	import { linkifyInline, plainTextNodes } from '$lib/inline-html';
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

	// See `CitationDisclosure` on why this is a bare top-level declaration.
	const uid = $props.id();
	const card = new NoteCard(uid);

	/** The whole gloss, for a note the margin could only set the head of —
	    shared with `CommentaryGloss`, which clamps for the same reason. */
	const full = new NoteDialog();
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
		><span class="margin-note-label" aria-hidden="true">{label}</span>{#if clamped}<span
				class="note-clamped">{@render gloss()}</span
			><button
				type="button"
				class="note-more"
				aria-haspopup="dialog"
				aria-expanded={full.rendered}
				onclick={() => full.open()}>{t('bible.readMore')}</button
			>{:else}{@render gloss()}{/if}</small
	>

	<!-- THE REST OF A CLAMPED GLOSS, and only ever for one: below the margin
	     breakpoint the marker's own card is the whole apparatus, and a note the
	     margin sets in full has nothing left to open.

	     Empty until opened, like `TocMenu`'s: `showModal()` needs the element
	     to exist, and a closed `<dialog>` is `display: none`, so nothing inside
	     is reachable, focusable or announced meanwhile — while a chapter of
	     Straubinger renders forty of these, each already holding its gloss
	     twice. `tick()` in `openFull` is what puts the content in before the
	     dialog is shown, so it is never centred at the wrong size.

	     No `role="dialog"`, no `aria-modal`: `showModal()` carries both. `lang`
	     because a gloss is written in its edition's language and the top layer
	     sits outside every `lang` the page has declared — the same reason the
	     card beside it says so. -->
	{#if clamped}
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
				     the text on a long note, which is affordable here and is
				     not in the sheet: this dialog only ever opens above the
				     margin breakpoint, where a backdrop and an Escape key are
				     both certain. -->
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
	class="panel-surface floating-panel note-popover">{@render gloss()}</span
>

<style>
	/*
	 * THE CLAMP, THE WAY TO THE REST OF A CLAMPED NOTE, AND THE PANEL IT OPENS.
	 *
	 * SCOPED, AND IT WAS GLOBAL FOR A DAY. `CommentaryGloss` clamped in the
	 * margin too while it had a margin form; it has none now — a commentary
	 * opens a card at every width — so this apparatus is the only one that
	 * clamps anything and the rules come home. What genuinely has two owners
	 * stayed in `reading-chrome.css`: `.note-marker`, `.note-trigger` and
	 * `.note-popover`, each of which the commentary's mark and card use
	 * unchanged.
	 *
	 * A citation's source is 26 characters and has nothing to clamp, so this
	 * was never `CitationDisclosure`'s either.
	 */

	/*
	 * `line-clamp` rather than a height and a fade, because it ends the note on
	 * an ellipsis at the end of a real line: the reader is told the note
	 * continues by the same mark a printed text would use, and the button below
	 * says where it continues. A masked fade says only that something is cut off,
	 * and says it in a way that a page in sepia or dark reads as a gradient
	 * rather than as an edge.
	 *
	 * THE LINE COUNT IS THE MARGIN'S, because the margin is the only place either
	 * apparatus clamps: a card scrolls, so there is nothing in one for a clamp to
	 * protect. `--sidenote-clamp` has to agree with the character count that
	 * decided to render this class at all — a count under the clamp offers a rest
	 * that is not there, and a clamp under the count cuts a note off with nothing
	 * under it to open.
	 */
	.note-clamped {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: var(--sidenote-clamp);
		line-clamp: var(--sidenote-clamp);
		overflow: hidden;
	}

	/*
	 * The rest of the note, and the reason the clamp costs the reader nothing.
	 * Two words rather than an ellipsis or a chevron: the note above it already
	 * ends in an ellipsis, and a second one would name the truncation twice
	 * without ever naming the remedy.
	 */
	.note-more {
		display: block;
		/*
		 * TIGHT TO ITS OWN NOTE AND CLEAR OF THE NEXT ONE, which is the whole of
		 * these two numbers. Notes stack down the gutter with nothing but `clear`
		 * between them, so a control set evenly between the note it belongs to and
		 * the note below it reads as belonging to the wrong one — and it is the
		 * only line in the column that could be mistaken for either. The end
		 * margin is what the next note is pushed down by: `.margin-note` floats,
		 * so it establishes its own formatting context and this cannot collapse
		 * through it.
		 */
		margin-block-start: 0.1rem;
		margin-block-end: 0.6rem;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		text-align: start;
		color: var(--color-accent);
		cursor: pointer;
	}

	.note-more:hover,
	.note-more:focus-visible {
		text-decoration: underline;
	}

	/*
	 * THE NOTE IN FULL, CENTRED OVER THE PAGE. Straubinger's longest note is
	 * 4,830 characters, Martini's 10,243 and Haydock's 14,201 — a card anchored
	 * beside a marker is a shape for a paragraph, and one holding an essay would
	 * cover the text it glosses while pointing at it. So it is the shape the site
	 * already uses for a panel that has stopped being anchored to anything:
	 * `.dialog-bare` for the shell and the `.sheet-*` parts for the chrome
	 * (`menus.css`), as the plate viewer and the tables of contents do.
	 *
	 * `[open]` is not decoration: a closed `<dialog>` is `display: none` from the
	 * UA stylesheet, and a bare `display: flex` here would override it and leave
	 * the panel on the page permanently — `.sheet`'s own note, and the same trap.
	 * The flex column has to start on the dialog because `.sheet-panel` is a flex
	 * item that bounds `.sheet-body`'s scroll box.
	 *
	 * SIZED, NOT PLACED. A modal `<dialog>` is centred by the UA's own
	 * `margin: auto`; what this decides is only how much of the viewport a note
	 * may take, and it is a reading measure rather than the widest box that fits.
	 */
	.note-dialog[open] {
		display: flex;
		flex-direction: column;
		inline-size: min(42rem, calc(100vw - 4rem));
		max-block-size: min(36rem, 82vh);
	}

	/* `.sheet-panel` brings the opaque ground; the surface and its corners are
	   `.panel-surface`'s, clipped here so the head does not square them. */
	.note-dialog-panel {
		overflow: hidden;
	}

	/*
	 * THE WAY OUT, SET INTO THE TEXT RATHER THAN OVER IT. `.sheet-close` is sized
	 * for a thumb in a panel that fills a phone; here it is one control in a
	 * corner the prose flows around, so it comes down to the two lines it
	 * actually sits beside. Floated rather than absolute, which is what keeps it
	 * out of the text instead of on top of it: an absolute button in the padding
	 * would be crossed by the first line the moment a note opened with a long
	 * word, and reserving a column for it would spend on every line what only two
	 * lines are next to.
	 */
	.note-dialog-close {
		float: inline-end;
		inline-size: 2rem;
		block-size: 2rem;
		margin-inline-start: 0.6rem;
		margin-block-end: 0.2rem;
	}

	/*
	 * STILL SANS, STILL MUTED, and set at the size the rest of the site reads
	 * apparatus at rather than at the margin's 0.78rem — the column's type is
	 * small because the column is narrow, and neither is true here. What must not
	 * change is that it is apparatus: a note filling the page in the serif face
	 * at the reading size would be a text of its own, which is the one thing this
	 * may never look like (docs/decisions.md §Posture).
	 */
	.note-dialog-body {
		padding: 0.9rem 1.1rem 1.2rem;
		font-family: var(--font-sans);
		font-size: 0.92rem;
		line-height: 1.65;
		color: var(--color-text-muted);
	}

	.sidenote-missing {
		font-style: italic;
	}
</style>
