<!--
	Chromium's install entry point, in the header controls row beside Print.

	Renders nothing at all unless the browser has fired `beforeinstallprompt`
	(see `$lib/install.svelte`), which means it is absent on Firefox, absent on
	iOS, absent inside the already-installed app, and absent on a Chromium that
	has decided the site is not installable. That self-hiding is what earns it a
	place in a row the header comments are otherwise very reluctant to lengthen:
	the seventh control only exists for readers who can actually use it.

	No engagement gating here, unlike the iOS hint — this button sits quietly in
	chrome the reader is already looking at and does nothing until pressed,
	rather than appearing over the page uninvited.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { install } from '$lib/install.svelte';
	import { t } from '$lib/i18n.svelte';

	const label = $derived(t('install.label'));
</script>

{#if install.canInstall}
	<button
		type="button"
		class="menu-trigger install-button"
		aria-label={label}
		title={label}
		onclick={() => install.prompt()}
	>
		<Icon name="download" />
	</button>
{/if}
