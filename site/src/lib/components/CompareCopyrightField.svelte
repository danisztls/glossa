<!--
	The two editions' copyright notices as ONE FIELD of a compare header —
	`CompareCopyrightHeader` for the three routes where it is the whole header,
	this for the four where it is the last row under a title, a range or a
	masthead.

	NEVER COLLAPSED TO ONE, even though both notices usually print the same
	words: the two link to DIFFERENT source pages, and that link is the
	checkable part (`CopyrightNotice.svelte`). It is the field that must not
	collapse, which is why it can be a component with no `shared` prop to pass.
-->
<script lang="ts">
	import CompareField from './CompareField.svelte';
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

<!-- Declared outside the component tag, not as `{#snippet left()}` children,
     because this component's own props are already called `left` and `right`
     and a snippet of that name would shadow the manifest it needs to read. -->
{#snippet leftNotice()}
	<p class="copyright-notice"><CopyrightNotice manifest={left} /></p>
{/snippet}
{#snippet rightNotice()}
	<p class="copyright-notice"><CopyrightNotice manifest={right} /></p>
{/snippet}

<CompareField
	leftLang={left.language}
	rightLang={right.language}
	left={leftNotice}
	right={rightNotice}
/>
