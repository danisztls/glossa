<script lang="ts">
	/**
	 * A unit of an annotated edition — its text, with the apparatus the source
	 * attached to it rendered where the source attached it.
	 *
	 * ONE COMPONENT FOR VERSES AND HEADINGS, because the corpus gives them one
	 * shape: `Verse` and `ChapterHeading` both extend `Annotated`
	 * (`types.ts`), and the reason is not tidiness — Lamentations 1 opens with
	 * Jeremias's prologue, which the Douay-Rheims prints as a heading BEFORE
	 * verse 1 and which carries a note of its own (that the preface was not
	 * written by Jeremias). A renderer that treated headings as decorative
	 * would drop both a paragraph of text and the note fastened to it.
	 *
	 * THE UNANCHORED NOTE IS NOT AN EDGE CASE TO IGNORE. Every `⟦marker⟧`
	 * token has a `notes` entry, but the converse does not hold: a source may
	 * print a note whose anchor it never marks (docs/corpus-schema.md). Those
	 * notes have nowhere in the text to hang from, and they are still part of
	 * the apparatus the edition prints — so they follow the unit rather than
	 * being silently dropped, which is the only other option and a lossy one.
	 *
	 * THE DROP CAP IS HANDLED HERE rather than left to the caller, because
	 * once a unit's text is split into runs the caller no longer has a first
	 * character to promote — the opening run does. A first verse that also
	 * carries a note would otherwise have to choose between the two.
	 *
	 * AND THE LEMMA IS MARKED HERE, FOR THE SAME REASON ONE STEP ON. A note's
	 * headword quotes the words it glosses, and this component is the only one
	 * holding both — the note has the quotation and the verse has the words.
	 * `splitLemma` locates them by matching BACKWARDS from the marker, which is
	 * where the source set it; the run is cut in two and the tail wrapped, so
	 * opening the note lights the phrase it is about. Where the words cannot be
	 * located the note keeps its headword instead (`Sidenote`'s `lemmaMarked`),
	 * which is not a rare fallback — see `lemma.ts` for the three editions and
	 * why Martini's 18,658 can never be marked.
	 *
	 * The pairing runs on the PIECE INDEX and nothing else: the text run at `i`
	 * ends with the lemma of the marker at `i + 1`, so the same number that
	 * finds the words finds the note, and `openNotes` needs no key of its own.
	 */
	import type { VerseNote } from '$lib/types';
	import { splitMarkers } from '$lib/inline-markers';
	import { splitDropCap } from '$lib/dropcap';
	import { splitLemma, type LemmaSplit } from '$lib/lemma';
	import { noteLetter } from '$lib/sidenotes.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';

	interface Props {
		/** The unit's plain text — what is shown. */
		text: string;
		/** The same string with `⟦marker⟧` tokens, when the unit is annotated. */
		textMarked?: string;
		notes?: VerseNote[];
		/** The edition's language, for the notes. */
		lang: string;
		/** The edition's work id, for the notes — see `Sidenote`'s `work`. The
		    verse text itself is never linkified, so this reaches the apparatus
		    and nothing else. */
		work?: string;
		/** Promote the opening letter — the caller's decision, since only it
		    knows whether this unit opens the chapter. */
		dropCap?: boolean;
		/** How many notes of this CHAPTER come before this unit's, so the
		    printed labels run a, b, c… down the page rather than restarting at
		    every verse. See `noteLetter`. */
		noteOffset?: number;
	}

	let { text, textMarked, notes, lang, work, dropCap = false, noteOffset = 0 }: Props = $props();

	const pieces = $derived(splitMarkers(text, textMarked));

	/**
	 * Which of this unit's notes are open, by the piece index of their marker —
	 * so the run of text before that marker can light the words the note quotes.
	 *
	 * LOCAL, AND NOT A FIELD ON `sidenoteRoom`, which is what it was for an hour.
	 * That object is the MARGIN's — whether the viewport has room for a gutter
	 * copy, which of the copies stacked there the reader last clicked — and this
	 * has nothing to do with the margin: it is the same pairing question
	 * answered inside the text. Held page-wide it also needed a key the parent
	 * and the child had to agree on, to address a singleton standing in for
	 * something that belongs to one verse. A binding needs no key at all: the
	 * index that finds the lemma is the index that finds the note.
	 *
	 * Sparse on purpose — only marker positions are ever written — and each
	 * `Sidenote` clears its own entry on teardown, so a chapter change cannot
	 * leave a run lit by a note that is no longer on the page.
	 *
	 * THE HOLES ARE WHY `Sidenote`'s `open` CARRIES NO FALLBACK. Binding a slot
	 * that is still undefined to a prop declared `$bindable(false)` throws
	 * `props_invalid_value` — Svelte cannot tell whether the parent meant the
	 * fallback or the undefined — and every note is in that state until its
	 * first effect runs. Filling the array to length ahead of the bindings
	 * would be the other fix and a worse one: it would need an effect writing
	 * state derived from `pieces` on every unit, to remove a hole that reads
	 * correctly as "not open" anyway.
	 */
	let openNotes: (boolean | undefined)[] = $state([]);

	/** Resolved against this unit's OWN notes: a marker is unique within its
	 *  unit and not within its chapter (docs/corpus-schema.md), so John 3
	 *  carries four notes and every one of them is numbered 1. */
	const byMarker = $derived(new Map((notes ?? []).map((note) => [note.marker, note])));

	/** The notes no token in `textMarked` points at, in corpus order. */
	const unanchored = $derived.by(() => {
		const anchored = new Set(
			pieces
				.filter((piece) => 'marker' in piece)
				.map((piece) => (piece as { marker: string }).marker)
		);
		return (notes ?? []).filter((note) => !anchored.has(note.marker));
	});

	/**
	 * This unit's notes in the order they are printed — anchored ones where
	 * their token falls, then the unanchored — which is the order the labels
	 * are assigned in. Every note appears exactly once, so this is always the
	 * same length as `notes` and a caller can advance `noteOffset` by that
	 * length without re-deriving anything.
	 */
	const ordered = $derived.by(() => {
		const seen = new Set<string>();
		const out: VerseNote[] = [];
		for (const piece of pieces) {
			if (!('marker' in piece) || seen.has(piece.marker)) continue;
			const note = byMarker.get(piece.marker);
			if (note) {
				seen.add(piece.marker);
				out.push(note);
			}
		}
		for (const note of notes ?? []) {
			if (seen.has(note.marker)) continue;
			seen.add(note.marker);
			out.push(note);
		}
		return out;
	});

	/**
	 * Where each markable lemma falls, keyed by the index of the TEXT run that
	 * ends with it, and which markers therefore need no headword of their own.
	 *
	 * A run can hold at most one, by construction rather than by check: the
	 * only candidate for a marker is the piece directly before it, and a marker
	 * preceded by another marker has no text run to claim.
	 */
	const marked = $derived.by(() => {
		const splits = new Map<number, LemmaSplit>();
		pieces.forEach((piece, i) => {
			if (!('marker' in piece)) return;
			const before = pieces[i - 1];
			if (!before || !('text' in before)) return;
			const split = splitLemma(before.text, byMarker.get(piece.marker)?.lemma);
			if (split) splits.set(i - 1, split);
		});
		return splits;
	});

	/**
	 * A note's printed label. Falls back to the source's own marker for a
	 * token with no note behind it — there is no note to be the nth of, and
	 * inventing a letter would put a label in the sequence that names nothing.
	 */
	function labelOf(marker: string): string {
		const note = byMarker.get(marker);
		const at = note ? ordered.indexOf(note) : -1;
		return at < 0 ? marker : noteLetter(noteOffset + at);
	}

	/** The first text run, which is the only one a drop cap can apply to. */
	const firstTextIndex = $derived(pieces.findIndex((piece) => 'text' in piece));
</script>

<!-- THE MARK ON THE LEMMA IS A `<span>` AND NOT A `<mark>`. `<mark>` means
     "singled out for reference" and is announced as such, which would be a
     claim about every glossed phrase in the chapter at all times; this one is
     singled out only while its note is open, and the note itself is what a
     screen reader is given (the marker's `aria-expanded` and the card's
     `role="note"`). So the element is there always and says nothing, and the
     class is what lights. -->
{#each pieces as piece, i (i)}{#if 'marker' in piece}<Sidenote
			bind:open={openNotes[i]}
			lemmaMarked={marked.has(i - 1)}
			label={labelOf(piece.marker)}
			note={byMarker.get(piece.marker)}
			{lang}
			{work}
		/>{:else}{@const lemma = marked.get(i)}{@const body = lemma
			? lemma.head
			: piece.text}{@const cap =
			dropCap && i === firstTextIndex ? splitDropCap(body) : undefined}{#if cap?.first}<span
				class="drop-cap-letter"
				>{#if cap.lead}<span class="drop-cap-lead">{cap.lead}</span>{/if}{cap.first}</span
			>{cap.rest}{:else}{body}{/if}{#if lemma}<span
				class="note-lemma"
				class:highlighted={openNotes[i + 1]}>{lemma.lemma}</span
			>{/if}{/if}{/each}{#each unanchored as note, i (`${note.marker}-${i}`)}<Sidenote
		label={labelOf(note.marker)}
		{note}
		{lang}
		{work}
	/>{/each}

<style>
	/*
	 * THE WORDS THE OPEN NOTE IS ABOUT.
	 *
	 * THE SAME WASH AS `.citation-marker.highlighted`, at the same strength and
	 * for the same statement — "this is the one you asked about" — because a
	 * second vocabulary for one idea is a second thing to learn. It is what the
	 * margin note's highlight used to say across the page, said in the text
	 * instead, now that there is no margin copy to pair a marker with.
	 *
	 * AN OUTLINE AND NOT PADDING, which is that rule's own arithmetic and
	 * matters more here: this is a phrase inside a line of Scripture, so
	 * padding on it would re-break the line and shift every word after it the
	 * moment a note opened. An outline is drawn outside the border box, follows
	 * the radius, takes no space at all, and — unlike a spread `box-shadow` —
	 * does not paint under the background where two translucent layers would
	 * stack into a darker rectangle. A phrase that wraps gets one per line
	 * fragment, which is what a printed underline does too.
	 */
	.note-lemma.highlighted {
		background: color-mix(in srgb, var(--color-accent) 18%, transparent);
		outline: 0.15em solid color-mix(in srgb, var(--color-accent) 18%, transparent);
		border-radius: var(--radius-sm);
	}

	/*
	 * ON PAPER IT IS MARKED ALWAYS, because nothing there opens.
	 *
	 * A screen shows the words only while their note is open, which is exactly
	 * the pairing the headword used to do at the top of the note. Print has no
	 * open state, so without this a printed chapter would carry notes that have
	 * lost their headwords and verses that never say which words each one is
	 * about — the marker letter alone, which is what a lemma exists to improve
	 * on. Dotted rather than a wash: a printed apparatus underlines its lemma,
	 * and a colour-mixed background is not something to ask of a sheet of paper.
	 *
	 * Here rather than in `print.css` because the rule is this component's
	 * alone, and a scoped `@media print` block is the same cascade the rest of
	 * this file is in.
	 */
	@media print {
		.note-lemma {
			text-decoration: underline dotted;
			text-underline-offset: 0.15em;
		}
	}
</style>
