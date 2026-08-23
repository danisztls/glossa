<!--
	A native-print entry point for the current reader view. The global print
	stylesheet decides which parts of the page belong on paper; this only asks
	for the dialogue.

	IT LIVES ON `ReadingBar`, NOT IN THE SITE HEADER, and so appears on reading
	pages only. It used to sit in the header beside the theme and language
	controls, which put it on every index page too — but the print stylesheet is
	written almost entirely about reading layouts (`.reading-*`, `.compare-*`),
	and the reader who wants a chapter on paper wants it next to the edition it
	is a chapter of, not three controls away in the chrome. An index page can
	still be printed; it just takes the browser's own command rather than a
	button that had nothing page-specific to say.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	const label = $derived(t('print.label'));
</script>

<button
	type="button"
	class="menu-trigger print-button"
	aria-label={label}
	title={label}
	onclick={() => window.print()}
>
	<Icon name="printer" />
</button>
