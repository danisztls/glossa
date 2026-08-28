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
	 * its first six lines and "read more" opens the whole of it in a modal.
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
	import { tick } from 'svelte';
	import type { VerseNote } from '$lib/types';
	import { marginOverflows, NoteCard, sidenoteRoom } from '$lib/sidenotes.svelte';
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
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang });
	}

	const inMargin = $derived(sidenoteRoom.margin);

	/**
	 * WHETHER THE MARGIN SETS THIS GLOSS OPEN OR ONLY ITS FIRST SIX LINES.
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

	/** The whole gloss, for a note the margin could only set the head of. */
	let full: HTMLDialogElement | undefined = $state();
	/** Whether the dialog's contents are rendered — see the markup on why they
	 *  are not rendered until they are wanted, and why `tick()` is between the
	 *  two halves of opening it. */
	let fullOpen = $state(false);

	async function openFull() {
		fullOpen = true;
		await tick();
		if (full && !full.open) full.showModal();
	}

	/* A click that lands on the dialog ITSELF is a click on the backdrop:
	   `.dialog-bare` is transparent and has no padding, so every visible pixel
	   belongs to the panel inside it. `TocMenu`'s test, and its reason. */
	function onDialogClick(e: MouseEvent) {
		if (e.target === full) full.close();
	}
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
				class="margin-note-body clamped">{@render gloss()}</span
			><button
				type="button"
				class="margin-note-more"
				aria-haspopup="dialog"
				aria-expanded={fullOpen}
				onclick={openFull}>{t('bible.readMore')}</button
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
			bind:this={full}
			class="dialog-bare note-dialog"
			{lang}
			aria-label={`${t('bible.note')} ${label}`}
			onclose={() => (fullOpen = false)}
			onclick={onDialogClick}
		>
			{#if fullOpen}
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
							onclick={() => full?.close()}
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

	/*
	 * THE CLAMP, where a gloss runs past what the margin can hold beside its
	 * own line — `marginOverflows` for why, and `--sidenote-clamp` for the
	 * line count, which is `MARGIN_CLAMP_CHARS` expressed in the other unit.
	 *
	 * `line-clamp` rather than a height and a fade, because it ends the note
	 * on an ellipsis at the end of a real line: the reader is told the gloss
	 * continues by the same mark a printed text would use, and the button
	 * below says where it continues. A masked fade says only that something is
	 * cut off, and says it in a way that a page in sepia or dark reads as a
	 * gradient rather than as an edge.
	 *
	 * Scoped rather than global, unlike `.margin-note` itself: a citation's
	 * source is 26 characters and has nothing to clamp, so this is one
	 * apparatus's and not both's.
	 */
	.margin-note-body.clamped {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: var(--sidenote-clamp);
		line-clamp: var(--sidenote-clamp);
		overflow: hidden;
	}

	/*
	 * The rest of the gloss, and the reason the clamp costs the reader
	 * nothing. Two words rather than an ellipsis or a chevron: the note above
	 * it already ends in an ellipsis, and a second one would name the
	 * truncation twice without ever naming the remedy.
	 */
	.margin-note-more {
		display: block;
		margin-block-start: 0.35rem;
		padding: 0;
		border: 0;
		background: none;
		font: inherit;
		text-align: start;
		color: var(--color-accent);
		cursor: pointer;
	}

	.margin-note-more:hover,
	.margin-note-more:focus-visible {
		text-decoration: underline;
	}

	/*
	 * THE GLOSS IN FULL, CENTRED OVER THE PAGE. Straubinger's longest note is
	 * 4,830 characters and Martini's 10,243 — a card anchored beside a marker
	 * is a shape for a paragraph, and one holding an essay would cover the
	 * text it glosses while pointing at it. So it is the shape the site
	 * already uses for a panel that has stopped being anchored to anything:
	 * `.dialog-bare` for the shell and the `.sheet-*` parts for the chrome
	 * (`menus.css`), as the plate viewer and the tables of contents do.
	 *
	 * `[open]` is not decoration: a closed `<dialog>` is `display: none` from
	 * the UA stylesheet, and a bare `display: flex` here would override it and
	 * leave the panel on the page permanently — `.sheet`'s own note, and the
	 * same trap. The flex column has to start on the dialog because
	 * `.sheet-panel` is a flex item that bounds `.sheet-body`'s scroll box.
	 *
	 * SIZED, NOT PLACED. A modal `<dialog>` is centred by the UA's own
	 * `margin: auto`; what this decides is only how much of the viewport a
	 * gloss may take, and it is a reading measure rather than the widest box
	 * that fits.
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
	 * THE WAY OUT, SET INTO THE TEXT RATHER THAN OVER IT. `.sheet-close` is
	 * sized for a thumb in a panel that fills a phone; here it is one control
	 * in a corner the prose flows around, so it comes down to the two lines it
	 * actually sits beside. Floated rather than absolute, which is what keeps
	 * it out of the text instead of on top of it: an absolute button in the
	 * padding would be crossed by the first line the moment a gloss opened
	 * with a long word, and reserving a column for it would spend on every
	 * line what only two lines are next to.
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
	 * small because the column is narrow, and neither is true here. What must
	 * not change is that it is a gloss: a note filling the page in the serif
	 * face at the reading size would be a text of its own, which is the one
	 * thing this apparatus may never look like (docs/decisions.md §Posture).
	 */
	.note-dialog-body {
		padding: 0.9rem 1.1rem 1.2rem;
		font-family: var(--font-sans);
		font-size: 0.92rem;
		line-height: 1.65;
		color: var(--color-text-muted);
	}
</style>
