<script lang="ts">
	/**
	 * One note of an annotated edition's apparatus: the marker where the
	 * source sets it, and the gloss it points at.
	 *
	 * STILL NOT `CitationDisclosure.svelte`, though the two now share a
	 * margin. What this one carries is COMMENTARY — Challoner glossing a verse
	 * at the length of a sentence or a paragraph, with a lemma quoting the
	 * words it glosses — where that one carries a SOURCE, and each keeps its
	 * own reading of what a marker is and of what to do where no margin
	 * exists. What they stopped disagreeing about is the margin itself: an
	 * apparatus the reader can see beside the line that raises it is the
	 * *Glossa Ordinaria* arrangement the project is named for
	 * (docs/decisions.md §Posture), and it is no less right for a footnote's
	 * source than for a gloss. `.margin-note` in app.css is the one
	 * arrangement both use.
	 *
	 * A GLOSS MUST NEVER BE CONFUSABLE WITH ITS SOURCE, the naming rule from
	 * that same entry, is why the note is set smaller, in the sans face, and
	 * (in the margin) physically outside the text column rather than merely
	 * indented within it. Challoner's commentary is not Scripture and must not
	 * be able to be read as though it were.
	 *
	 * WHERE THERE IS NOT ROOM the same note becomes a disclosure after all —
	 * on a phone there is no margin to put anything in. `sidenoteRoom.margin`
	 * decides, and decides in JavaScript rather than in CSS alone because the
	 * marker is a different KIND of thing in the two layouts: a control that
	 * opens something, or a plain reference to something already visible. See
	 * that module for why that distinction cannot live in a media query.
	 */
	import type { VerseNote } from '$lib/types';
	import { sidenoteRoom } from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';
	import { linkifyInline, plainTextNodes } from '$lib/inline-html';
	import { linkifyProse, refHref, type RefSegment } from '$lib/refs';
	import { content } from '$lib/content.svelte';
	import InlineNodes from './InlineNodes.svelte';

	interface Props {
		/** What the note is PRINTED as — "a", "b" — shown in the superscript and
		    again at the head of the note, so a note read in isolation still names
		    itself. NOT `VerseNote.marker`, which is the source's own ordinal and
		    stays in the corpus: the label is lettered per chapter so it cannot be
		    mistaken for a verse number. See `noteLetter`. */
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
		open: boolean;
		onToggle: () => void;
	}

	let { label, note, lang, work, open, onToggle }: Props = $props();

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

	// In the margin the note is on screen no matter what `open` says, so the
	// marker is not a disclosure control and does not claim to be one.
	const inMargin = $derived(sidenoteRoom.margin);
	const shown = $derived(inMargin || open);
</script>

{#if inMargin}
	<sup class="note-marker note-marker-static" aria-hidden="true">{label}</sup>
{:else}
	<sup class="note-marker">
		<button
			type="button"
			class="note-trigger"
			aria-expanded={open}
			aria-label={`${t('bible.note')} ${label}`}
			onclick={onToggle}
		>
			{label}
		</button>
	</sup>
{/if}

{#if shown}
	<small class:margin-note={inMargin} class:sidenote={!inMargin} {lang}>
		<span class:margin-note-label={inMargin} class:sidenote-marker={!inMargin} aria-hidden="true"
			>{label}</span
		>
		{#if note}
			{#if note.lemma}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span class="sidenote-text"
				><InlineNodes {nodes} {hrefFor} /></span
			>
		{:else}
			<span class="sidenote-text sidenote-missing">{t('bible.noteMissing')}</span>
		{/if}
	</small>
{/if}

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

	.note-marker-static {
		/* Hidden from assistive technology: in the margin layout the note it
		   points at is already in the reading order right behind it, and the
		   number is then decoration rather than information. */
		user-select: none;
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
	 * The note where there is NO margin to set it in. In the margin it is
	 * `.margin-note` (app.css), which carries the same three signals — sans,
	 * smaller, muted — because any one of them alone is the kind of difference
	 * a reader stops seeing after a page.
	 */
	.sidenote {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.sidenote-marker {
		font-weight: 600;
		/* The same colour as the marker in the text: the pairing of the two
		   identical letters is what ties a note to the place it belongs. */
		color: var(--color-accent);
		padding-inline-end: 0.35em;
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
	 * BELOW THE MARGIN BREAKPOINT: a block that opens under the line it
	 * belongs to. `display: block` inside the flowing verse text breaks the
	 * line at exactly the marker, which is where the reader just tapped.
	 */
	.sidenote {
		display: block;
		margin-block: 0.5rem;
		padding-inline-start: 0.75rem;
		border-inline-start: 2px solid var(--color-border);
	}
</style>
