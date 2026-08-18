<!--
	A native-print entry point for the current reader view. Keeping this in the
	site chrome makes it available everywhere without teaching each route about
	printing; the global print stylesheet decides which parts of that page belong
	on paper.
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
