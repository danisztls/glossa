<script lang="ts">
	/**
	 * The 404 page.
	 *
	 * A prerendered ROUTE, not a `+error.svelte`. The site has no server
	 * runtime (adapter-static with `fallback: undefined` — see
	 * vite.config.ts's "strict prerendering" rationale), so a request for a
	 * URL that matches no built file is answered by the host, which knows
	 * nothing about SvelteKit's error boundary. `/404` is a static route with
	 * no parameters, so prerendering picks it up from the default `['*']`
	 * entry list and adapter-static writes it to `build/404.html`; the host is
	 * pointed at that file (`not_found_handling: "404-page"` in
	 * site/wrangler.jsonc) and serves it with a 404 status. An
	 * `+error.svelte` would only ever be reached by the client-side router
	 * after a bad in-app navigation, leaving a reader who types or follows a
	 * bad URL directly on the host's own bare error page.
	 *
	 * When served for some other path, this page hydrates with
	 * `page.url.pathname` set to whatever was actually requested rather than
	 * `/404`. That is fine and deliberate: SvelteKit boots from the data
	 * embedded in the HTML instead of re-resolving the path, the same
	 * mechanism adapter-static's SPA `fallback` option uses and the one
	 * src/service-worker.ts already relies on to boot offline navigations off
	 * the cached home page.
	 *
	 * No `noindex` on this page. Cloudflare serves it under the real 404
	 * status, which is what crawlers act on; a robots meta tag would add
	 * nothing, and if this file were ever served with a 200 the tag would
	 * paper over that bug rather than surface it.
	 */
	import { t } from '$lib/i18n.svelte';

	// The reading sections, in the header nav's order. Duplicated from
	// +layout.svelte's NAV_ITEMS rather than exported from it: this list is
	// answering "where else could you have meant to go", and the day the two
	// diverge — a section too minor for the header but worth offering a lost
	// reader, or vice versa — should not require untangling a shared constant.
	const SECTIONS = [
		{ href: '/bible', key: 'nav.bible' },
		{ href: '/ccc', key: 'nav.ccc' },
		{ href: '/compendium', key: 'nav.compendium' },
		{ href: '/documents', key: 'nav.magisterium' },
		{ href: '/prayers', key: 'nav.prayers' }
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
