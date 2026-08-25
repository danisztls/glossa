<!--
	The two editions' copyright notices, side by side above a comparison.

	NEVER COLLAPSED TO ONE, even though both notices usually print the same
	words: the two link to DIFFERENT source pages, and that link is the
	checkable part (`CopyrightNotice.svelte`). Every other field in a
	`.compare-unit-header` asks whether its two strings match and collapses
	when they do; this one is the field that must not, which is why it can be
	a component with no collapse logic in it at all.

	THREE ROUTES HAD WRITTEN THIS OUT in fourteen byte-identical lines each,
	differing only in which two manifests they named: the Summa, the Compendium
	question reader, and — since Latin became a real prayer edition — `/preces`.
	They are the routes whose compare header is a copyright notice AND NOTHING
	ELSE.

	The other four do not use it, and that is not an oversight. `/documenta`,
	the Bible chapter reader, `/catechismus/[n]` and the two chapter readers
	carry a title, subtitle, range, masthead or edition label in the same grid,
	where a notice is one field among several — and each of those other fields
	has its own collapse rule (a Latin incipit that matches in both languages
	collapses; a translated chapter title never does). Lifting just the two
	notices out of those blocks would leave the surrounding fields inline and
	split one grid across two files, which is worse than the repetition.

	The grid, its tracks and its divider are `.compare-unit-header` /
	`.compare-unit-field` in app.css; the field's own vertical rhythm moved
	there too, so this component contributes no styles of its own.
-->
<script lang="ts">
	import CopyrightNotice from './CopyrightNotice.svelte';
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
	<div class="compare-unit-field compare-unit-field-left" lang={left.language}>
		<p class="copyright-notice"><CopyrightNotice manifest={left} /></p>
	</div>
	<div class="compare-unit-field compare-unit-field-right" lang={right.language}>
		<p class="copyright-notice"><CopyrightNotice manifest={right} /></p>
	</div>
</div>
