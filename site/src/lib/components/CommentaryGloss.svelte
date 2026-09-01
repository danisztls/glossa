<!--
	One verse's commentary, behind a mark at the end of that verse.

	WHY THIS IS NOT `Sidenote`, AND WHY IT IS NOT A PROP ON IT. `Sidenote` is
	built around the source's OWN marker: a token inside the edition's text says
	where each note belongs, and the component is one note. Neither holds here.
	A commentary has no token and can never be given one — its lemma quotes the
	wording of the edition it was written on, which is not necessarily the
	edition on screen. And the unit is the VERSE rather than the note: Haydock's
	median annotated verse carries two remarks and his longest twenty-nine, all
	of them about the same line, so they are one card and one mark.

	THE MARK IS ANCHORED TO THE VERSE, and that is measured rather than chosen.
	Of 45,824 notes only 27,201 carry a lemma at all and 25,078 of those quote
	the Douay verbatim, so a lemma-matched token would anchor 55% of the
	apparatus and only on one edition; a marker run with holes in it is worse
	than no run, because the reader learns to look for a mark and then meets
	notes that have none. A verse is something every edition has. See
	`COMMENTARY_MARKER` for why a dagger and what it cost to get one.

	IT SETS NOTHING IN THE MARGIN, AT ANY WIDTH, and that is the whole shape of
	this component. It had a gutter form for a day, on the premise the site is
	named for — the gloss beside the line it belongs to. That premise assumes an
	apparatus SMALLER than the text it hangs on, and this one is not: Haydock
	annotates 20,814 verses, a chapter of him runs to 4,690 characters at the
	median and 52,496 at its worst, and the column was neither beside the text
	nor bounded by it. `.margin-note` was written for Challoner at the length of
	a sentence. So the mark opens a card, everywhere, which is what
	`NoteCard`'s `margin: false` says: no margin copy, so a click always opens,
	`aria-expanded` is always a claim we can keep, and there is never a note in
	the gutter to light.

	THE LABEL AT THE HEAD OF EACH NOTE IS THE ATTRIBUTION, NOT A LETTER.
	`Sidenote` letters its notes a, b, c down the chapter (`noteLetter`), and a
	second lettered run would print two different "a"s with nothing to say which
	belonged to which. Naming the commentator instead collides with nothing and
	is the more informative label anyway — "Calmet" tells the reader whose
	opinion they are about to read, where "d" tells them nothing. An
	unattributed note is the compiler's own and carries no label.

	NOTHING IS CLAMPED IN HERE, BUT THE LONG VERSES GET A DIALOG. There is no
	float to keep in check, so no clamp; what there IS is a card that stops
	being one. Haydock annotates a verse at 245 characters in the median and
	14,433 at his worst, and past `CARD_MAX_CHARS` a panel anchored beside the
	mark covers the verse it points at and scrolls — a card pretending to be a
	page. Those open `.note-dialog` instead, which is the same panel `Sidenote`
	opens from a clamped note's ellipsis, for the same reason and by the same
	measure. It moves 9.3% of the annotated verses.
-->
<script lang="ts">
	import { linkifyProse } from '$lib/refs-grammar';
	import type { RefSegment } from '$lib/refs-grammar';
	import { linkifyInline, parseInlineMarked, plainTextNodes } from '$lib/inline-html';
	import { refHref } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import { COMMENTARY_MARKER, NoteCard, NoteDialog, overflowsCard } from '$lib/sidenotes.svelte';
	import type { CommentaryNote } from '$lib/types';
	import Icon from './Icon.svelte';
	import InlineNodes from './InlineNodes.svelte';

	interface Props {
		/** This verse's notes, in the order the source prints them. */
		notes: CommentaryNote[];
		/** The COMMENTARY's language, not the edition's — a note is written in
		    the language of the work that carries it, and since a commentary is
		    now offered beside any edition the two often differ. Set on the
		    element so `direction.css` resolves script direction from the text. */
		lang: string;
		/** The COMMENTARY's work id, which the grammar needs for the same reason
		    `Sidenote` needs the edition's: Haydock quotes the Douay nomenclature
		    throughout, where "3 Kings" is 1 Kings, so his citations resolve
		    under his own work's config and not under the edition beside him. */
		work: string;
		/** What the commentary is CALLED, for the mark's own label. The mark is
		    the same dagger whichever commentary raised it, so the name is the
		    only thing telling a reader what is behind it. `ApparatusMenu` labels
		    its switch with the same string, which is what ties the mark to the
		    control that turned it on. */
		title: string;
		/** The ADDRESS these notes hang off — the book and chapter of the verse
		    the mark sits at the end of. It is what lets `linkifyProse` read
		    Haydock's `v. 12` as a verse of this chapter; see
		    `RefsOpts.sameChapter`, and note that nothing in the prose could
		    have said which chapter it meant. */
		osis: string;
		chapter: number;
	}

	let { notes, lang, work, title, osis, chapter }: Props = $props();

	const label = $derived(`${t('apparatus.commentary')}: ${title}`);

	/** Whether this verse's whole apparatus is past what a card holds — see
	 *  `CARD_MAX_CHARS`. Counted over every note beside the verse, because they
	 *  are one card: the mark names the verse, not a note. */
	const long = $derived(
		overflowsCard(
			notes.reduce(
				(n, note) =>
					n + (note.lemma?.length ?? 0) + note.text.length + (note.attribution?.length ?? 0),
				0
			)
		)
	);

	// See `CitationDisclosure` on why this is a bare top-level declaration.
	const uid = $props.id();
	const card = new NoteCard(uid, { margin: false, modal: () => long });

	/** The apparatus of a heavily-annotated verse, centred over the page rather
	    than anchored beside its mark. `Sidenote`'s dialog, verbatim. */
	const full = new NoteDialog();

	function hrefFor(seg: RefSegment): string | undefined {
		return refHref(seg, { bibleWorkId: content.workIdFor('bible'), lang, work });
	}

	/**
	 * A note's own apparatus, where it has one.
	 *
	 * Haydock footnotes his own paragraphs with the Greek and Latin behind a
	 * rendering, so `text_marked` carries `⟦N⟧` tokens over a `notes` array —
	 * the ordinary `Annotated` shape, one level down. The marker renders as a
	 * plain superscript rather than a control: a disclosure inside a note that
	 * is already inside a card is two things to open for one thing to read, and
	 * the sub-notes are short enough to set under the note they belong to.
	 * Position is what the numeral is for, so it is kept.
	 */
	function nodesOf(note: CommentaryNote) {
		const source = note.text_marked
			? parseInlineMarked(note.text_marked)
			: plainTextNodes(note.text);
		return linkifyInline(source, (text: string) =>
			linkifyProse(text, { lang, work, sameChapter: { osis, chapter } })
		);
	}
</script>

<!-- THE MARK, at the end of the verse rather than inside it, because it names
     the verse and not a place in it. `.note-marker` is the shared rule every
     raised mark on this page uses; `.commentary-marker` adds only the face
     that draws the dagger.

     NO POINTER HANDLERS, WHICH IS THE ONE PLACE THIS DIVERGES FROM `Sidenote`
     AND `CitationDisclosure`. `NoteCard` opens on the pointer resting, and
     that is right for what those two hold — a source of 26 characters, a gloss
     of a sentence, a card the size of the thing it explains. This card holds a
     whole verse's commentary, so a mouse merely CROSSING the mark on its way
     down the page would raise a panel over the text being read. The card is
     opened deliberately or not at all. For a SHORT verse that is the browser's
     own invoker doing the work through `popovertarget`, and `card.onClick`
     stands down; for a long one `popovertarget` is absent and the click opens
     the dialog below instead. -->
<sup class="note-marker commentary-marker">
	<button
		bind:this={card.trigger}
		type="button"
		class="note-trigger"
		popovertarget={card.popovertarget}
		aria-haspopup={card.asModal ? 'dialog' : undefined}
		aria-expanded={card.asModal ? full.rendered : card.expanded}
		aria-label={label}
		onclick={card.asModal ? () => full.open() : card.onClick}
	>
		{COMMENTARY_MARKER}
	</button>
</sup>

<!-- THE VERSE'S WHOLE APPARATUS, written once and rendered into whichever of
     the two panels below is holding it. A snippet rather than a component:
     the two differ only in what surrounds them, and a second copy of this
     `{#each}` is exactly the kind of divergence nobody notices, since only
     one of the two is on the screen at a time. -->
{#snippet catena()}
	{#each notes as note, i (i)}
		<div class="commentary-item">
			{#if note.lemma}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span class="sidenote-text"
				><InlineNodes nodes={nodesOf(note)} {hrefFor}>
					{#snippet marker(m: string)}<sup class="commentary-submarker">{m}</sup>{/snippet}
				</InlineNodes></span
			>{#if note.attribution}<span class="commentary-attribution">{note.attribution}</span
				>{/if}{#if note.notes?.length}<ol class="commentary-subnotes">
					{#each note.notes as sub (sub.marker)}<li value={Number(sub.marker)}>
							{sub.text}
						</li>{/each}
				</ol>{/if}
		</div>
	{/each}
{/snippet}

{#if card.asModal}
	<!-- A VERSE WHOSE APPARATUS OUTGREW THE CARD. `Sidenote`'s dialog, class for
	     class (`.note-dialog` in `reading-chrome.css`, where it moved when this
	     became its second caller): empty until opened, no `role="dialog"` or
	     `aria-modal` because `showModal()` carries both, and `lang` because the
	     top layer sits outside every `lang` the page has declared. -->
	<dialog
		bind:this={full.el}
		class="dialog-bare note-dialog"
		{lang}
		aria-label={label}
		onclose={full.onClose}
		onclick={full.onClick}
	>
		{#if full.rendered}
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
					{@render catena()}
				</div>
			</div>
		{/if}
	</dialog>
{:else}
	<!-- THE CARD. It carries no pointer handlers either: nothing here opens on
	     hover, so there is no hover claim that entering the panel has to keep
	     alive. Dismissal is the popover's own — a click outside, Escape, or the
	     mark again.

	     `role="note"` for `CitationDisclosure`'s reason: ARIA's own word for
	     content ancillary to the text it hangs off, and not `tooltip`, which
	     must hold nothing interactive where this holds the verses the notes
	     name. `lang` because a commentary is written in its own work's language
	     and the card sits in the top layer, outside every `lang` the page has
	     declared. -->
	<span
		bind:this={card.panel}
		id={card.id}
		popover="auto"
		role="note"
		{lang}
		ontoggle={card.onToggle}
		class="panel-surface floating-panel note-popover"
	>
		{@render catena()}
	</span>
{/if}

<style>
	/*
	 * THE FACE, AND NOTHING ELSE. Everything about how this mark is set — the
	 * superscript, the sans face, the size floor, the accent colour — is
	 * `.note-marker` in `reading-chrome.css`, shared so the page's three raised
	 * marks cannot drift apart. What is left here is that U+2020 is not in the
	 * `latin` subset, so the dagger needs the 1.1 KB face `fonts.css` declares
	 * for it or it falls through to whatever the reader's system draws.
	 *
	 * The extra hair of space is the one measurable difference: `.note-marker`
	 * sets 0.08em because the source puts a footnote marker immediately after
	 * the words it glosses, and this mark follows a full stop instead.
	 */
	.commentary-marker {
		font-family: 'Source Sans 3 Marks', var(--font-sans);
		padding-inline-start: 0.15em;
	}

	/*
	 * ONE VERSE'S NOTES, SET APART FROM EACH OTHER INSIDE ONE CARD. A rule
	 * rather than white space alone, because these are DIFFERENT AUTHORITIES:
	 * a catena sets Calmet under Witham, and two remarks running together with
	 * nothing between them read as one long note by whoever signed the second.
	 */
	.commentary-item + .commentary-item {
		margin-block-start: 0.5em;
		padding-block-start: 0.5em;
		border-block-start: 1px solid var(--color-border);
	}

	/*
	 * THE ATTRIBUTION RUNS ON FROM THE REMARK, and that is a space decision
	 * before it is a typographic one. Set as a closing block it cost every note
	 * a line of its own to carry one word, and a catena is many short notes —
	 * Haydock's median is 113 characters — so that line was being paid over and
	 * over down a card the reader is scrolling.
	 *
	 * It still reads as the signature it is: the remark first, then whose it
	 * is, which is the order every printed catena uses. What says so now is the
	 * dash and the italic rather than the line break.
	 *
	 * THE SPACE BEFORE THE DASH IS IN THE `content`, and the one after it is a
	 * NO-BREAK space. The markup deliberately carries no whitespace around this
	 * span, so the ::before is the only place a break opportunity can come
	 * from: the leading space lets "— Witham" move to the next line whole, and
	 * the nbsp stops the line ending on a dangling dash.
	 */
	.commentary-attribution {
		font-style: italic;
	}

	.commentary-attribution::before {
		content: ' —\a0';
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
</style>
