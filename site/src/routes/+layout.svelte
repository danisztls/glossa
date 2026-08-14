<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import JumpBox from '$lib/components/JumpBox.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { i18n, t } from '$lib/i18n.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{t('home.title')}</title>
</svelte:head>

<div class="app-shell">
	<header class="site-header">
		<a class="brand" href="/">{t('home.title')}</a>
		<nav>
			<a href="/">{t('nav.home')}</a>
			<a href="/ccc">{t('nav.ccc')}</a>
		</nav>
		<div class="controls">
			<JumpBox />
			<div class="lang-switch" role="group" aria-label={t('lang.label')}>
				<button type="button" class:current={i18n.lang === 'en'} onclick={() => i18n.set('en')}
					>EN</button
				>
				<button type="button" class:current={i18n.lang === 'pt'} onclick={() => i18n.set('pt')}
					>PT</button
				>
			</div>
			<ThemeToggle />
		</div>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.site-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg-elevated);
	}

	.brand {
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: 1.2rem;
		text-decoration: none;
		color: var(--color-text);
	}

	nav {
		display: flex;
		gap: 1rem;
	}

	nav a {
		text-decoration: none;
		color: var(--color-text-muted);
	}

	nav a:hover {
		color: var(--color-text);
	}

	.controls {
		margin-inline-start: auto;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.lang-switch {
		display: flex;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		overflow: hidden;
	}

	.lang-switch button {
		border: none;
		background: var(--color-bg-elevated);
		color: var(--color-text-muted);
		padding: 0.4rem 0.6rem;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.lang-switch button.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	main {
		flex: 1;
		padding-block: 2rem 4rem;
	}
</style>
