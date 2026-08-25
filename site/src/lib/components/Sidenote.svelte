<script lang="ts">
	/**
	 * One note of an annotated edition's apparatus: the marker where the
	 * source sets it, and the gloss it points at.
	 *
	 * NOT `CitationDisclosure.svelte`, and the difference is the point.
	 * That component discloses a CITATION — the source of a phrase, a few
	 * words long, wanted only on demand — and it does so by pushing the rest
	 * of the page down, which `PLAN.md` #3 names as the mechanism the
	 * designed reading experience replaces rather than extends. This one
	 * carries COMMENTARY: Challoner glossing a verse at the length of a
	 * sentence or a paragraph, which the edition prints for the reader to
	 * have in view while reading the text it belongs to, not to go and fetch.
	 * Where there is room it therefore sits in the margin, open, beside its
	 * own line — the *Glossa Ordinaria* arrangement the project is named for
	 * (docs/decisions.md, 2026-08-16).
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
		open: boolean;
		onToggle: () => void;
	}

	let { label, note, lang, open, onToggle }: Props = $props();

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
	<small class="sidenote" class:sidenote-margin={inMargin} {lang}>
		<span class="sidenote-marker" aria-hidden="true">{label}</span>
		{#if note}
			{#if note.lemma}<b class="sidenote-lemma">{note.lemma}</b>{/if}<span class="sidenote-text"
				>{note.text}</span
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
	 * The note itself.
	 *
	 * Sans, smaller, and in the muted colour: three signals at once that this
	 * is apparatus and not text, because any one of them alone is the kind of
	 * difference a reader stops seeing after a page.
	 */
	.sidenote {
		font-family: var(--font-sans);
		font-size: 0.78rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	.sidenote-marker {
		font-weight: 600;
		/* The same colour as the marker in the text, because the pairing of
		   the two identical letters is the ONLY thing tying a note to the
		   place it belongs — in the margin layout they are separated by the
		   whole width of the gutter, with other notes stacked below. Colour
		   them differently and the reader has to match on shape alone. */
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
	.sidenote:not(.sidenote-margin) {
		display: block;
		margin-block: 0.5rem;
		padding-inline-start: 0.75rem;
		border-inline-start: 2px solid var(--color-border);
	}

	/*
	 * IN THE MARGIN: floated into the inline-start slack outside the reading
	 * column. Floats are what make this work without measuring anything —
	 * several notes against nearby verses stack down the margin instead of
	 * overlapping, which absolute positioning would need JavaScript to
	 * achieve. The negative start margin is the whole displacement: the float
	 * is pulled its own width plus the gap clear of the text column.
	 */
	.sidenote-margin {
		float: inline-start;
		clear: inline-start;
		inline-size: var(--sidenote-width);
		margin-inline-start: calc(-1 * (var(--sidenote-width) + var(--sidenote-gap)));
		/* Aligns the note's first line with the line of text carrying its
		   marker, rather than with the top of the line box. */
		margin-block-start: 0.25rem;
		text-align: start;
	}

	.sidenote-margin .sidenote-marker {
		/* In the margin the number hangs outside the note's own measure, so
		   the gloss sets flush and the column of markers reads down the page. */
		float: inline-start;
		margin-inline-start: -1.1em;
	}
</style>
