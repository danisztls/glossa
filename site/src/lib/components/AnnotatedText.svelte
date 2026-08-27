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
	 */
	import type { VerseNote } from '$lib/types';
	import { splitMarkers } from '$lib/inline-markers';
	import { splitDropCap } from '$lib/dropcap';
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

{#each pieces as piece, i (i)}{#if 'marker' in piece}<Sidenote
			label={labelOf(piece.marker)}
			note={byMarker.get(piece.marker)}
			{lang}
			{work}
		/>{:else if dropCap && i === firstTextIndex}{@const cap = splitDropCap(
			piece.text
		)}{#if cap.first}<span class="drop-cap-letter"
				>{#if cap.lead}<span class="drop-cap-lead">{cap.lead}</span>{/if}{cap.first}</span
			>{cap.rest}{:else}{piece.text}{/if}{:else}{piece.text}{/if}{/each}{#each unanchored as note, i (`${note.marker}-${i}`)}<Sidenote
		label={labelOf(note.marker)}
		{note}
		{lang}
		{work}
	/>{/each}
