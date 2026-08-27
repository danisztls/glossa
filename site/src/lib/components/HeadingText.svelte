<script lang="ts">
	/**
	 * A structure heading's text as a READING surface renders it: the title,
	 * plus whatever footnote apparatus the source printed on the heading
	 * itself, disclosed the same way body prose discloses one.
	 *
	 * WHY A HEADING HAS AN APPARATUS AT ALL. The CCC's English mirror prints a
	 * `<sup>` reference inside two of its headings, in each case sourcing the
	 * phrase the heading quotes — `III. Christ Jesus — "Mediator and Fullness
	 * of All Revelation"` cites Dei Verbum 2, and `II. "I Know Whom I Have
	 * Believed"` cites 2 Tim 1:12. The corpus keeps that in `title_marked` and
	 * `citations` beside the plain `title`, exactly as a paragraph keeps
	 * `text_marked` beside `text` (docs/corpus-schema.md, "A heading can carry
	 * citations"). Before this the token rendered literally, as `⟦25⟧`.
	 *
	 * NOT FOR A TOC OR INDEX ROW. Those render the heading inside a link, and
	 * a button inside an anchor is invalid markup — they print `title` and
	 * drop the apparatus, which is also the right call editorially: a footnote
	 * in a navigation row is noise. `InlineText` is the component for that
	 * side, and its docblock says the same thing from the other direction.
	 *
	 * The overwhelmingly common case is a heading with no apparatus, which
	 * renders as its plain title and nothing else.
	 */
	import type { StructureNode } from '$lib/types';
	import CitationDisclosure from './CitationDisclosure.svelte';
	import { splitMarkers } from '$lib/inline-markers';

	interface Props {
		/** The heading's own title text — the caller's, not `node.title`, so it
		    can pass `displayTitle`'s stripped form (the source's redundant
		    "CHAPTER TWO" prefix removed) rather than the raw one. Ignored when
		    the node carries `title_marked`, whose tokens have to stay attached
		    to the words they follow. */
		title: string;
		node: StructureNode;
		/** Bare content language, for the citation grammar in `$lib/refs.ts`. */
		lang: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it — English works that number the books of Kings
		    the Douay way — and passing nothing reads the work as its language
		    reads. */
		work?: string;
	}

	let { title, node, lang, work }: Props = $props();

	const pieces = $derived(splitMarkers(title, node.title_marked));

	function citationFor(marker: string) {
		return node.citations?.find((c) => c.marker === marker);
	}
</script>

{#each pieces as piece, i (i)}{#if 'text' in piece}{piece.text}{:else}<CitationDisclosure
			marker={piece.marker}
			citation={citationFor(piece.marker)}
			{lang}
			{work}
		/>{/if}{/each}
