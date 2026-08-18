<script lang="ts">
	import { t } from '$lib/i18n.svelte';

	const SECTIONS = [
		{ href: '/scriptura', key: 'nav.bible' },
		{ href: '/catechismus', key: 'nav.ccc' },
		{ href: '/compendium', key: 'nav.compendium' },
		{ href: '/preces', key: 'nav.prayers' },
		{ href: '/documenta', key: 'nav.magisterium' }
	] as const;
</script>

<svelte:head>
	<title>{t('notFound.title')} — {t('home.title')}</title>
</svelte:head>

<article class="content-column not-found">
	<h1>{t('notFound.title')}</h1>
	<p class="lede">{t('notFound.lede')}</p>
	<p>{t('notFound.body')}</p>
	<p>{t('notFound.searchHint')}</p>

	<p class="elsewhere">{t('notFound.elsewhere')}</p>
	<ul class="sections">
		<li><a href="/">{t('notFound.home')}</a></li>
		{#each SECTIONS as section (section.href)}
			<li><a href={section.href}>{t(section.key)}</a></li>
		{/each}
	</ul>
</article>

<style>
	.not-found {
		font-family: var(--font-serif);
		line-height: 1.7;
	}

	.not-found h1 {
		margin-bottom: 0.5rem;
	}

	.lede {
		font-size: 1.15rem;
		color: var(--color-text-muted);
		margin-top: 0;
	}

	.elsewhere {
		margin-top: 2.5rem;
		margin-bottom: 0.6rem;
	}

	.sections {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		font-family: var(--font-sans);
		font-size: 0.9rem;
	}

	.sections a {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		text-decoration: none;
	}

	.sections a:hover,
	.sections a:focus-visible {
		border-color: var(--color-accent);
	}
</style>
