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
	import { noteKey } from '$lib/sidenotes.svelte';
	import Sidenote from '$lib/components/Sidenote.svelte';
	import { SvelteSet } from 'svelte/reactivity';

	interface Props {
		/** The unit's plain text — what is shown. */
		text: string;
		/** The same string with `⟦marker⟧` tokens, when the unit is annotated. */
		textMarked?: string;
		notes?: VerseNote[];
		/** Distinguishes this unit's note state from its neighbours' — a verse
		    number, or a heading's position. See `noteKey`: markers repeat down a
		    chapter, so a chapter-wide key would open four notes at once. */
		unit: string | number;
		/** The edition's language, for the notes. */
		lang: string;
		/** Promote the opening letter — the caller's decision, since only it
		    knows whether this unit opens the chapter. */
		dropCap?: boolean;
	}

	let { text, textMarked, notes, unit, lang, dropCap = false }: Props = $props();

	const pieces = $derived(splitMarkers(text, textMarked));

	/** Resolved against this unit's OWN notes — see `noteKey`. */
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

	const open = new SvelteSet<string>();

	function toggle(key: string) {
		if (open.has(key)) open.delete(key);
		else open.add(key);
	}

	/** The first text run, which is the only one a drop cap can apply to. */
	const firstTextIndex = $derived(pieces.findIndex((piece) => 'text' in piece));
</script>

{#each pieces as piece, i (i)}{#if 'marker' in piece}<Sidenote
			marker={piece.marker}
			note={byMarker.get(piece.marker)}
			{lang}
			open={open.has(noteKey(unit, piece.marker, piece.seq))}
			onToggle={() => toggle(noteKey(unit, piece.marker, piece.seq))}
		/>{:else if dropCap && i === firstTextIndex}{@const cap = splitDropCap(
			piece.text
		)}{#if cap.first}<span class="drop-cap-letter"
				>{#if cap.lead}<span class="drop-cap-lead">{cap.lead}</span>{/if}{cap.first}</span
			>{cap.rest}{:else}{piece.text}{/if}{:else}{piece.text}{/if}{/each}{#each unanchored as note, i (`${note.marker}-${i}`)}<Sidenote
		marker={note.marker}
		{note}
		{lang}
		open={open.has(noteKey(unit, note.marker, -1 - i))}
		onToggle={() => toggle(noteKey(unit, note.marker, -1 - i))}
	/>{/each}
