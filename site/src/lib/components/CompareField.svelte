<!--
	ONE FIELD OF A COMPARE HEADER — a title, a subtitle, a range, an edition
	label, a copyright notice — laid across the two columns of
	`.compare-unit-header` (app.css).

	The header is a grid of ROWS, one per field, rather than two columns of
	stacked content: each field is a thing the two editions may or may not
	agree about, and the grid exists so that the answer can differ field by
	field. A document's Latin incipit is the same string in both languages and
	collapses; the subtitle beneath it is translated and splits. Six routes
	wrote that pattern out by hand — the four cell divs, the two `lang`
	attributes, the tag spans — and the shape was stable enough across them
	that three carried the same comment explaining it.

	NOTHING HERE DECIDES WHETHER A FIELD COLLAPSES. `shared` is the caller's
	answer, because the comparison is about the caller's data and is different
	every time: string equality for a title, a pair of numbers for a range, a
	boolean flag for the CCC's "in brief" tag, and — for a copyright notice —
	the constant `false`, because two notices that read alike still link to
	different source pages and that link is the checkable part.

	A SHARED CELL CARRIES NEITHER `lang` NOR A TAG. It spans both columns, so
	there are no columns left to tell apart, and claiming the primary edition's
	language for a string both editions print would be a small lie — about a
	Latin incipit in particular, which is nobody's vernacular.

	The tag is what identifies a column BELOW 60rem, where the two cells stop
	being side by side and become one above the other; `.compare-cell-tag`
	hides itself above that width. It goes on the field that names the unit —
	the title — and not on every field, because a range and a notice sitting
	under a tagged title inherit its answer, and tagging all three turns a
	header into a list of language names.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The two editions agree here, so the field spans both columns and
		 *  `left` is rendered once. The caller decides; see above. */
		shared?: boolean;
		/** Content language of each cell, for `<div lang>`. Omitted where the
		 *  field is not language-bearing — a range of question numbers is the
		 *  same digits in any tongue. */
		leftLang?: string;
		rightLang?: string;
		/** The stacked-view column tag, normally `compareColumnLabel(work)`. */
		leftTag?: string;
		rightTag?: string;
		left: Snippet;
		right: Snippet;
	}

	let { shared = false, leftLang, rightLang, leftTag, rightTag, left, right }: Props = $props();
</script>

{#if shared}
	<div class="compare-unit-field compare-unit-field-shared">{@render left()}</div>
{:else}
	<div class="compare-unit-field compare-unit-field-left" lang={leftLang}>
		{#if leftTag}<span class="compare-cell-tag">{leftTag}</span>{/if}
		{@render left()}
	</div>
	<div class="compare-unit-field compare-unit-field-right" lang={rightLang}>
		{#if rightTag}<span class="compare-cell-tag">{rightTag}</span>{/if}
		{@render right()}
	</div>
{/if}
