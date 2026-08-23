<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import JumpBox from '$lib/components/JumpBox.svelte';
	import LanguageMenu from '$lib/components/LanguageMenu.svelte';
	import AppearanceMenu from '$lib/components/AppearanceMenu.svelte';
	import InstallButton from '$lib/components/InstallButton.svelte';
	import InstallHint from '$lib/components/InstallHint.svelte';
	import { install } from '$lib/install.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	// Mounted once, globally: see the component's own docblock for why this is
	// a single delegated listener rather than something every link-generating
	// component (RefText, linkifyProse, route TOCs, ...) has to opt into.
	import LinkPreview from '$lib/components/LinkPreview.svelte';
	import { t } from '$lib/i18n.svelte';

	let { children } = $props();

	// Collapsible on narrow screens only (see .nav-toggle / .primary-nav
	// below) — the header grew from 3 controls to 6 plus a 4th nav link, so
	// something has to give on a phone-width viewport. Desktop CSS forces
	// the nav open regardless of this flag.
	let navOpen = $state(false);

	// No "Home" entry: the brand link above is already a link to `/`, and two
	// controls one tab-stop apart doing the identical thing is redundancy, not
	// redundancy-as-safety. Removing it also lets `isActive` drop its special
	// case (see below).
	const NAV_ITEMS = [
		{ href: '/scriptura', key: 'nav.bible' },
		{ href: '/catechismus', key: 'nav.ccc' },
		{ href: '/compendium', key: 'nav.compendium' },
		// 28 prayers is not a fifth pillar alongside four works running to
		// thousands of pages each — but a corpus nobody can find from the nav
		// is a corpus nobody reads, so it gets the same one-click-away
		// treatment as everything else rather than being reachable only from
		// the home page's own Prayers section.
		{ href: '/preces', key: 'nav.prayers' },
		// The canonical route is Latin while the displayed label is
		// "Magisterium" — URL identity and localised display language are
		// intentionally independent.
		{ href: '/documenta', key: 'nav.magisterium' },
		// `/summa` is already Latin, so there is no English directory to
		// re-export from here the way the four above have.
		{ href: '/summa', key: 'nav.summa' }
	] as const;

	// A section is "active" for its whole subtree (`/scriptura/...` counts as
	// Bible). No `'/'` special case is needed now that Home isn't a nav item —
	// every href here is a real section prefix.
	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	/**
	 * First paint fetches only the route's own content. Once that work is out
	 * of the way, ask the service worker to fill its immutable content cache in
	 * the background. This is intentionally a request, not an install-time
	 * precache: it leaves the initial visit small and lets the worker resume any
	 * interrupted library download on a later visit.
	 *
	 * Honour the browser's explicit data-saver signal. The ordinary Cache
	 * Storage quota remains the browser's authority; the worker already treats
	 * every asset independently and logs failed entries rather than breaking
	 * reading when storage is tight.
	 */
	onMount(() => {
		if (!('serviceWorker' in navigator)) return;

		const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
			.connection;
		if (connection?.saveData) return;

		let cancelled = false;
		const requestPreload = () => {
			if (!cancelled) navigator.serviceWorker.controller?.postMessage({ type: 'CACHE_CONTENT' });
		};

		// Give route loading and the first interaction a clear head start. A
		// reload deliberately asks again: cacheContent skips what it already has
		// and thereby resumes if the browser previously stopped the worker.
		const timer = window.setTimeout(() => {
			if (navigator.serviceWorker.controller) {
				requestPreload();
			} else {
				navigator.serviceWorker.addEventListener('controllerchange', requestPreload, {
					once: true
				});
			}
		}, 1_500);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
			navigator.serviceWorker.removeEventListener('controllerchange', requestPreload);
		};
	});

	/**
	 * Accumulate visible reading time, which is the gate on the iOS
	 * "Add to Home Screen" hint — see `$lib/install.svelte` for why that hint
	 * is gated and the install button isn't. Kept out of the block above
	 * because that one gives up early on a browser with no service worker,
	 * and separately because the two have nothing to do with each other.
	 *
	 * This belongs in the root layout precisely because the layout mounts once
	 * for the whole session: anywhere else the counter would be torn down and
	 * restarted on every navigation, which in a book read chapter by chapter
	 * is constantly. On any platform that can't show the hint, `track()`
	 * returns a no-op without starting a timer.
	 */
	onMount(() => install.track());

	/**
	 * Publish the site header's height as `--site-header-height` on <html>, so
	 * a SECOND sticky element can sit directly beneath it instead of sliding
	 * underneath (`ReadingBar`, on every reading page, is the first).
	 *
	 * Measured rather than declared, because this header has no fixed height
	 * to declare: the wordmark is two lines and drops to a monogram on scroll,
	 * `.header-bar`'s block padding is animated over the first 96px by a
	 * scroll-driven animation, and the whole bar wraps to two rows at phone
	 * width. A `ResizeObserver` is the only thing that sees all three, and it
	 * sees the shrink continuously rather than at a threshold — the same
	 * reason that animation is scroll-timeline-driven and not a JS flag.
	 *
	 * Written to the document element, not to a wrapper, so it is in scope for
	 * anything on the page regardless of which route rendered it.
	 */
	let headerEl: HTMLElement | undefined = $state();

	$effect(() => {
		const el = headerEl;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => {
			document.documentElement.style.setProperty(
				'--site-header-height',
				`${entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height}px`
			);
		});
		observer.observe(el);
		return () => {
			observer.disconnect();
			document.documentElement.style.removeProperty('--site-header-height');
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{t('home.title')}</title>
</svelte:head>

<div class="app-shell">
	<header class="site-header" bind:this={headerEl}>
		<div class="header-bar">
			<a class="brand" href="/"><Wordmark variant="brand" /></a>

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

			<!--
				One row of peers. These were grouped into a bordered "reading settings"
				pill (edition + size + theme) on the theory that it stopped the header
				reading as five staple-gunned buttons. In practice the pill had to strip
				its children's border and background to avoid a button-in-a-button look,
				so the group read as two classes of control — three chrome-less icons in
				a box beside two bordered ones — a louder difference than the one it was
				hiding. They are all compact, one-tap reading controls. They now look it.
			-->
			<div class="controls">
				<JumpBox />
				<!-- The way back to what the reader has marked. A link rather than a
				     menu: there is one destination, and it is a page. -->
				<a
					class="menu-trigger"
					href="/signata"
					aria-current={isActive('/signata') ? 'page' : undefined}
					aria-label={t('bookmark.library')}
					title={t('bookmark.library')}
				>
					<Icon name="bookmark" />
				</a>
				<LanguageMenu />
				<AppearanceMenu />
				<!-- Renders nothing unless the browser has actually offered an
				     install, so on most visits the row is unchanged. -->
				<InstallButton />
				<!-- Last, and inside `.controls` rather than beside it: as a sibling of
				     the group it picked up `.header-bar`'s 0.75rem gap while its
				     neighbours shared `.controls`' 0.4rem, so the one button that
				     looked deliberately set apart was set apart by accident. -->
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
			</div>
		</div>
	</header>

	<main>
		{@render children()}
	</main>

	<!--
		The colophon is deliberately in a footer rather than the navbar: it is
		not a reading section and shouldn't compete with the four that are.
		But it does have to be reachable from every page — docs/research/
		copyright.md §5's posture rests on the position being stated openly,
		and a page nobody can find states it to nobody.
	-->
	<footer class="site-footer">
		<a href="/colophon">{t('colophon.title')}</a>
	</footer>
</div>

<LinkPreview />
<InstallHint />

<style>
	.app-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.site-header {
		/* Above `.reading-aside`/`.index-aside`'s own `position: sticky` (z-index
		   50 is `.menu-panel`'s, which must still win over both). */
		position: sticky;
		top: 0;
		z-index: 40;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-bg-elevated);
		/* A scroll-linked animation changes this element's own height below
		   (`.header-bar`'s shrink) — without this the browser's scroll
		   anchoring "corrects" for that shrink by nudging `scrollY`, which
		   would then feed back into the very animation causing the nudge. */
		overflow-anchor: none;
	}

	.header-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 0.75rem;
		/* A little more block padding than the old single-line brand needed: the
		   wordmark is two lines now, and letting it sit tight against the rule
		   makes the header read as cramped rather than as compact. Also the
		   unanimated fallback: browsers without scroll-driven animation support
		   (see below) just keep this value at every scroll position. */
		padding: 0.75rem 1rem;
		max-width: 90rem;
		margin-inline: auto;
		/* Containing block for header dropdowns at phone width — see app.css's
		   `.site-header .menu` rule, which re-anchors the panels here so a
		   trigger sitting well left of the edge cannot throw its panel off
		   the side of the screen. */
		position: relative;
	}

	/*
	 * Streamlines the header once the reader has actually left the top of the
	 * page: the bar's padding shrinks, and Wordmark.svelte's own rule (see
	 * `.is-brand .lockup`/`.monogram` there) drops the wordmark to the "GC"
	 * monogram over the same range, at any width — the mobile header's
	 * proportions, triggered by scroll instead of viewport width.
	 *
	 * `animation-timeline: scroll()` reads scroll position as the animation's
	 * clock directly, so the state is just a function of the current scroll
	 * offset — no listener, no stored "am I compact" flag, and so nothing that
	 * can desync from the actual scroll position or flicker between two states
	 * at a boundary the way a JS-computed threshold could.
	 *
	 * Guarded by `@supports`: a browser that doesn't understand
	 * `animation-timeline: scroll()` would otherwise still run the `animation`
	 * shorthand against the default document timeline, and with no duration
	 * set that plays out instantly to the `to` keyframe — i.e. the header
	 * would render permanently compact, at the very top of the page, on any
	 * browser that hasn't shipped this yet. The guard keeps that case at
	 * today's plain, unanimated header instead.
	 *
	 * The `0 96px` range is duplicated in Wordmark.svelte's matching rule
	 * (search that file for "96px") — the bar and the mark have to finish
	 * shrinking at the same scroll offset or the two visibly disagree partway
	 * through.
	 */
	@supports (animation-timeline: scroll()) {
		@keyframes shrink-header-bar {
			from {
				padding-block: 0.75rem;
			}
			to {
				padding-block: 0.35rem;
			}
		}

		.header-bar {
			animation: shrink-header-bar linear both;
			animation-timeline: scroll(root block);
			animation-range: 0 96px;
		}
	}

	.brand {
		order: 1;
		/* Type lives in Wordmark.svelte — the two words are proportioned against
		   each other there, and the blackletter must not be given a weight (the
		   subset is a single 400 master; 700 would synthesize a bold and clot
		   it). This rule keeps only what belongs to the link itself. */
		display: inline-flex;
		text-decoration: none;
		color: var(--color-text);
	}

	/*
	 * Narrow layout is two rows: [brand ... controls] and, when open, the nav
	 * panel below. The hamburger is the last child of `.controls`, not a sibling
	 * of it, so every button in the row shares one gap — and it sits last
	 * because it is the control that opens the row beneath it.
	 *
	 * Exactly one auto margin does the pushing, on `.controls`. There were two
	 * before (here and on `.brand`), which split the free space into two
	 * adjacent gaps — same rendering, twice the things to reason about.
	 */
	.controls {
		order: 2;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-inline-start: auto;
	}

	/* `.menu-trigger` (app.css) is written for the buttons; the bookmark
	   library is the one control in this row that is a link, so it needs the
	   two things a button gets for free. */
	.controls a.menu-trigger {
		text-decoration: none;
		flex-shrink: 0;
	}

	.controls a.menu-trigger[aria-current='page'] {
		color: var(--color-accent);
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
			/* Not 0: the wordmark's own right edge is the blackletter's, which has
			   no side bearing to speak of, so at the bar's 0.75rem gap it reads as
			   touching the first nav link. */
			margin-inline-end: 1.75rem;
		}

		/* Wide layout is a single row: brand, nav, controls. The nav stops being
		   a wrapped panel and slots between the other two, so it takes order 2
		   and the controls move to 3 — stated explicitly rather than left to
		   tie-break on DOM order, which is what happened when both were 2. */
		.primary-nav {
			order: 2;
			flex-basis: auto;
			display: flex !important;
			flex-direction: row;
			gap: 1.25rem;
			border-top: none;
			padding-top: 0;
		}

		.controls {
			order: 3;
		}

		.primary-nav a {
			padding: 0.3rem 0;
		}
	}

	main {
		flex: 1;
		padding-block: 2rem 4rem;
	}

	.site-footer {
		border-top: 1px solid var(--color-border);
		padding: 1.25rem;
		text-align: center;
		font-size: 0.8rem;
	}

	.site-footer a {
		color: var(--color-text-muted);
		text-decoration: none;
	}

	.site-footer a:hover {
		color: var(--color-text);
		text-decoration: underline;
	}
</style>
