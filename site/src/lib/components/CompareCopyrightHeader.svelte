<!--
	The two editions' copyright notices, side by side above a comparison.

	NEVER COLLAPSED TO ONE, even though both notices usually print the same
	words: the two link to DIFFERENT source pages, and that link is the
	checkable part (`CopyrightNotice.svelte`). Every other field in a
	`.compare-unit-header` asks whether its two strings match and collapses
	when they do; this one is the field that must not, which is why it can be
	a component with no collapse logic in it at all.

	THIS IS THE WHOLE HEADER, for the three routes whose compare header is a
	copyright notice AND NOTHING ELSE: the Summa, the Compendium question
	reader, and — since Latin became a real prayer edition — `/preces`. The
	four routes that carry a title, subtitle, range, masthead or edition label
	in the same grid build their own header and drop `CompareCopyrightField`
	into it as the last row — which is this component's whole body, and where
	the never-collapse rule is stated.

	The grid, its tracks and its divider are `.compare-unit-header` /
	`.compare-unit-field` in app.css; the field's own vertical rhythm moved
	there too, so this component contributes no styles of its own.
-->
<script lang="ts">
	import CompareCopyrightField from './CompareCopyrightField.svelte';
	import type { WorkManifest } from '$lib/types';

	interface Props {
		/** The edition in the left column. */
		left: WorkManifest;
		/** The edition in the right column. */
		right: WorkManifest;
	}

	let { left, right }: Props = $props();
</script>

<div class="compare-unit-header">
	<CompareCopyrightField {left} {right} />
</div>
