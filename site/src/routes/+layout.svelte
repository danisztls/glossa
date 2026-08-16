<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import JumpBox from '$lib/components/JumpBox.svelte';
	import LanguageMenu from '$lib/components/LanguageMenu.svelte';
	import ThemeMenu from '$lib/components/ThemeMenu.svelte';
	import FontSizeMenu from '$lib/components/FontSizeMenu.svelte';
	import EditionMenu from '$lib/components/EditionMenu.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	let { children } = $props();

	// Collapsible on narrow screens only (see .nav-toggle / .primary-nav
	// below) — the header grew from 3 controls to 5 plus a 4th nav link, so
	// something has to give on a phone-width viewport. Desktop CSS forces
	// the nav open regardless of this flag.
	let navOpen = $state(false);

	const NAV_ITEMS = [
		{ href: '/', key: 'nav.home' },
		{ href: '/bible', key: 'nav.bible' },
		{ href: '/ccc', key: 'nav.ccc' },
		{ href: '/compendium', key: 'nav.compendium' },
		// Route path stays `/documents` (docs/corpus-schema.md §Documents'
		// naming); the displayed label is "Magisterium" — see the
		// `nav.magisterium` dictionary entry for why they're allowed to differ.
		{ href: '/documents', key: 'nav.magisterium' }
	] as const;

	// A section is "active" for its whole subtree (`/bible/...` counts as
	// Bible), except Home, which would otherwise match everything.
	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{t('home.title')}</title>
</svelte:head>

<div class="app-shell">
	<header class="site-header">
		<div class="header-bar">
			<a class="brand" href="/">{t('home.title')}</a>

			<button
				type="button"
				class="menu-trigger nav-toggle"
				aria-expanded={navOpen}
				aria-controls="primary-nav"
				aria-label={t('nav.menu')}
				onclick={() => (navOpen = !navOpen)}
			>
				<Icon name="menu" />
			</button>

			<nav id="primary-nav" class="primary-nav" class:open={navOpen} aria-label={t('nav.menu')}>
				{#each NAV_ITEMS as item (item.href)}
					<a
						href={item.href}
						aria-current={isActive(item.href) ? 'page' : undefined}
						onclick={() => (navOpen = false)}
					>
						{t(item.key)}
					</a>
				{/each}
			</nav>

			<div class="controls">
				<JumpBox />
				<LanguageMenu />
				<!-- The three per-work "reading settings" controls (appearance,
				     not content) grouped visually into one pill so the header
				     doesn't read as five staple-gunned buttons. Grouped visually
				     rather than nested into one dropdown so each control stays
				     one click away and independently keyboard-reachable. -->
				<div class="reading-controls">
					<EditionMenu />
					<FontSizeMenu />
					<ThemeMenu />
				</div>
			</div>
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
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg-elevated);
	}

	.header-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 0.75rem;
		padding: 0.6rem 1rem;
		max-width: 90rem;
		margin-inline: auto;
	}

	.brand {
		order: 1;
		font-family: var(--font-serif);
		font-weight: 700;
		font-size: 1.2rem;
		text-decoration: none;
		color: var(--color-text);
		/* Pushes nav-toggle/controls to the row's end on mobile, where
		   .primary-nav isn't inline (see @media below); canceled on desktop,
		   where .primary-nav's own auto margin takes over that job instead. */
		margin-inline-end: auto;
	}

	.nav-toggle {
		order: 2;
	}

	.controls {
		order: 3;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-inline-start: auto;
	}

	.reading-controls {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		padding: 0.15rem;
		background: var(--color-bg);
	}

	/* The individual menu triggers already carry their own border/background
	   (app.css `.menu-trigger`); inside this group that would double up into
	   a button-in-a-button look, so strip it back to just the icon here. */
	.reading-controls :global(.menu-trigger) {
		border-color: transparent;
		background: transparent;
	}

	.reading-controls :global(.menu-trigger:hover) {
		border-color: var(--color-accent);
	}

	.primary-nav {
		order: 4;
		flex-basis: 100%;
		display: none;
		flex-direction: column;
		gap: 0.1rem;
		border-top: 1px solid var(--color-border);
		padding-top: 0.5rem;
	}

	.primary-nav.open {
		display: flex;
	}

	.primary-nav a {
		padding: 0.55rem 0.4rem;
		border-radius: 0.3rem;
		text-decoration: none;
		color: var(--color-text-muted);
	}

	.primary-nav a[aria-current='page'] {
		color: var(--color-text);
		font-weight: 600;
	}

	.primary-nav a:hover {
		color: var(--color-text);
	}

	@media (min-width: 720px) {
		.nav-toggle {
			display: none;
		}

		.brand {
			margin-inline-end: 0;
		}

		.primary-nav {
			order: 2;
			flex-basis: auto;
			display: flex !important;
			flex-direction: row;
			gap: 1.25rem;
			border-top: none;
			padding-top: 0;
			margin-inline-end: auto;
		}

		.primary-nav a {
			padding: 0.3rem 0;
		}
	}

	main {
		flex: 1;
		padding-block: 2rem 4rem;
	}
</style>
