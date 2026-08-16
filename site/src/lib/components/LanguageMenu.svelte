<!--
	UI language switch. Deliberately NOT a dropdown like ThemeMenu/
	FontSizeMenu/EditionMenu: docs/decisions.md now has UI language drive
	content language by default (`$lib/content.svelte.ts`), so this is one of
	the two primary, always-visible controls (the other being JumpBox) rather
	than something tucked behind a "reading settings" affordance — see
	i18n.svelte.ts's docblock for why this single switch matters so much more
	than it used to.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import type { UiLang } from '$lib/i18n.svelte';

	const OPTIONS: { code: UiLang; label: string }[] = [
		{ code: 'en', label: 'EN' },
		{ code: 'pt', label: 'PT' }
	];
</script>

<div class="lang-switch" role="group" aria-label={t('lang.label')}>
	<span class="lang-icon" aria-hidden="true"><Icon name="languages" /></span>
	{#each OPTIONS as opt (opt.code)}
		<button
			type="button"
			class:current={i18n.lang === opt.code}
			aria-pressed={i18n.lang === opt.code}
			onclick={() => i18n.set(opt.code)}
		>
			{opt.label}
		</button>
	{/each}
</div>

<style>
	.lang-switch {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		overflow: hidden;
		background: var(--color-bg-elevated);
	}

	.lang-icon {
		display: inline-flex;
		padding-inline-start: 0.5rem;
		color: var(--color-text-muted);
		font-size: 0.95rem;
	}

	.lang-switch button {
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		padding: 0.4rem 0.6rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.lang-switch button.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}
</style>
