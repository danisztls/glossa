<script lang="ts">
	import { themeStore } from '$lib/theme.svelte';
	import { t } from '$lib/i18n.svelte';

	const label = $derived(t(`theme.${themeStore.current ?? 'light'}`));
</script>

<button
	type="button"
	class="toggle"
	onclick={() => themeStore.cycle()}
	title={t('theme.label')}
	aria-label={`${t('theme.label')}: ${label}`}
>
	{label}
</button>

<style>
	.toggle {
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-size: 0.9rem;
		cursor: pointer;
	}
</style>
