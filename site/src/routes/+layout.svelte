<script lang="ts">
	import { onMount, tick } from 'svelte';
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
	import { serviceWorker } from '$lib/sw.svelte';
	import { usage } from '$lib/usage';
	import { version } from '$app/environment';
	import UpdateBanner from '$lib/components/UpdateBanner.svelte';
	import ToTopButton from '$lib/components/ToTopButton.svelte';

	let { children } = $props();

	/**
	 * BELOW THE BREAKPOINT THE SECTIONS ARE A MODAL SHEET, not a row that
	 * unfolds inside the header. The header grew from 3 controls to 6 plus a
	 * 6th section, so something has to give on a phone; what gave first was
	 * the page. As a `flex-basis: 100%` panel wrapping onto a second line of
	 * `.header-bar`, the open nav was part of the header's own layout — so
	 * tapping the hamburger mid-chapter grew the header and pushed the text
	 * down the screen, and dismissing it pulled the text back up. A reader
	 * navigating away pays that twice; a reader who opened it to look and
	 * changed their mind pays it for nothing.
	 *
	 * A `<dialog>` in the top layer costs the page no space at all: the text
	 * stays exactly where it was and comes back untouched. `showModal()`
	 * carries the rest of the contract natively — `::backdrop`, an inert
	 * background, a focus trap and Escape — which is mandatory rather than
	 * convenient once a panel covers the screen: an overlay a reader can tab
	 * out of into text they cannot see is worse than no overlay. This is the
	 * third dialog on the site after `JumpBox` and `TocMenu`, and wears the
	 * shell and sheet chrome all three share (`.dialog-bare`, `.sheet`,
	 * `.sheet-*` in app.css) — it declares no dialog CSS of its own.
	 *
	 * Unlike `TocMenu` it has exactly ONE form. That component becomes an
	 * anchored card at 48rem because a screen with room to read around a
	 * gloss should still show the text; here the breakpoint is the width at
	 * which the six links stop hiding and become the header's own row, so
	 * there is no width at which a card would be the thing to draw.
	 */
	let navOpen = $state(false);
	let navDialog: HTMLDialogElement | undefined = $state();
	let navToggle: HTMLButtonElement | undefined = $state();

	/** The width at which the sections move into the header bar and the
	 *  hamburger disappears. Duplicated in the media query below, which cannot
	 *  read it; the two are one decision and are commented as one. */
	const BAR_QUERY = '(min-width: 720px)';

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
	 * `await tick()` before `showModal()`: the sheet's copy of the links is
	 * rendered by `{#if navOpen}`, so the element `showModal()` is called on
	 * has to be given its content first. Rendering it only while open is also
	 * what keeps the six anchors from existing twice in the document — the
	 * header's own row is the other copy, and above 720px it is the real one.
	 */
	async function openNav() {
		if (navDialog?.open) return;
		navOpen = true;
		await tick();
		navDialog?.showModal();
	}

	/* Escape and the backdrop both close a modal dialog natively, so `onclose`
	   is the one place that runs on every dismissal — including the two this
	   file never hears about directly. Focus goes back to the toggle from
	   here because otherwise it lands on `<body>`, returning a keyboard reader
	   to the top of the document rather than to the control they opened. */
	function onNavClose() {
		navOpen = false;
		navToggle?.focus();
	}

	/**
	 * A sheet whose rows are links has to close when one is followed: the app
	 * navigates in place, so nothing else would take it away.
	 *
	 * Modified clicks are left alone. ⌘/Ctrl/shift-click opens the section in
	 * a new tab and THIS page does not move, so closing would take away the
	 * menu a reader is opening two sections from. On the header's own copy of
	 * the links `navDialog` is closed and `close()` is a no-op, which is what
	 * lets one handler serve both renderings of the snippet.
	 */
	function onNavFollow(e: MouseEvent) {
		if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		navDialog?.close();
	}

	/* A rotation into landscape, or a window dragged wider, would otherwise
	   leave the sheet covering a layout that is already showing the same six
	   links in its header — with the only control that closes it (the
	   hamburger) now `display: none`. Guarded on the media query rather than
	   on the event, so an iOS URL-bar collapse does nothing. */
	function onViewportResize() {
		if (navDialog?.open && window.matchMedia(BAR_QUERY).matches) navDialog.close();
	}

	/**
	 * The service worker conversation: update detection, and the deferred
	 * background fill. Both live in `$lib/sw.svelte.ts`; see its docblock.
	 *
	 * This used to post `CACHE_CONTENT` here directly, which asked the worker
	 * for the WHOLE library in EVERY language — 2,236 files and ~26 MB gzipped
	 * — 1.5s after first render, on every visit, gated only by `saveData`,
	 * which almost nobody sets. It now asks for the automatic waves in the
	 * reader's own languages and editions — one Catechism, not one per
	 * language — and stops; the rest is offered, not taken.
	 */
	onMount(() => serviceWorker.start());

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
	 * Usage measurement — one bucketed summary per session, sent once on the
	 * way out. See `$lib/usage.ts` for what it sends and, more to the point,
	 * what it deliberately does not.
	 *
	 * Here for the same reason as the two above: the layout mounts once for the
	 * whole session, and a session is exactly what this counts. `version` is
	 * the shell build the reader is running, which is how the collector knows
	 * an update has actually landed rather than merely been offered again.
	 */
	onMount(() => usage.start(version));

	/**
	 * Sections visited, from the one place that already knows about every
	 * navigation. An in-app route change is a `pushState` the edge never sees,
	 * so this is the only way a section is counted at all.
	 */
	$effect(() => {
		usage.notePath(page.url.pathname);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{t('home.title')}</title>
</svelte:head>

<svelte:window onresize={onViewportResize} />

<!-- ONE list, rendered in two places: the header's row above 720px and the
     sheet below it. Written as a snippet rather than as two `{#each}` blocks
     because the pair would have drifted — `aria-current`, the dismissal
     handler and the six hrefs are the same decision in both, and the copy
     that is wrong is the one nobody is looking at. -->
{#snippet navLinks()}
	{#each NAV_ITEMS as item (item.href)}
		<a
			href={item.href}
			aria-current={isActive(item.href) ? 'page' : undefined}
			onclick={onNavFollow}
		>
			{t(item.key)}
		</a>
	{/each}
{/snippet}

<div class="app-shell">
	<header class="site-header">
		<div class="header-bar">
			<a class="brand" href="/"><Wordmark variant="brand" /></a>

			<!-- The header's own copy of the sections, and the only one above
			     720px. Below it this is `display: none` and the sheet at the
			     foot of the header is what a reader sees, so the two are never
			     both in the accessibility tree under the same name. -->
			<nav class="primary-nav" aria-label={t('nav.menu')}>
				{@render navLinks()}
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
					bind:this={navToggle}
					aria-haspopup="dialog"
					aria-expanded={navOpen}
					aria-controls="nav-sheet"
					aria-label={t('nav.menu')}
					onclick={openNav}
				>
					<Icon name="menu" />
				</button>
			</div>
		</div>

		<!--
			Always in the markup, empty until opened: `showModal()` needs an
			element to be called on, and a closed `<dialog>` is `display:
			none`, so nothing inside is reachable, focusable or announced
			meanwhile. Where it sits in the document is a readability choice
			and nothing else — an open modal renders in the top layer, out of
			the header's flow and above every stacking context on the page.

			No `role="dialog"`, no `aria-modal`: `showModal()` carries both.
			The `<nav>` inside takes no name of its own; the dialog is the
			landmark a reader is announced into, and labelling both would say
			"Menu" twice on the way in.
		-->
		<dialog
			bind:this={navDialog}
			id="nav-sheet"
			class="dialog-bare sheet"
			aria-label={t('nav.menu')}
			onclose={onNavClose}
		>
			{#if navOpen}
				<div class="sheet-panel">
					<!-- The way out, and on a phone the ONLY one: the sheet is
					     full-bleed, so there is no backdrop to tap and there is
					     no Escape key. Why the head may not scroll away with
					     it is `app.css`'s `.sheet-head`. -->
					<div class="sheet-head">
						<h2 class="sheet-title">{t('nav.menu')}</h2>
						<button
							type="button"
							class="sheet-close"
							aria-label={t('ui.close')}
							title={t('ui.close')}
							onclick={() => navDialog?.close()}
						>
							<Icon name="x" />
						</button>
					</div>
					<!-- The `<nav>` IS the sheet's scroll body; there is no
					     wrapper between them, so it carries both classes. -->
					<nav class="sheet-body nav-links">
						{@render navLinks()}
					</nav>
				</div>
			{/if}
		</dialog>
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
<UpdateBanner />
<!-- Outside `.app-shell` with the other viewport-fixed overlays: it belongs to
     the window, not to the column of text under it. -->
<ToTopButton />

<style>
	.app-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/*
	 * IN FLOW, NOT STICKY, and that is the decision the rest of this file is
	 * written around. The brand, the six sections and the reading controls
	 * are what a reader needs on arrival and rarely again: a text is read from
	 * `ReadingBar` — which IS sticky, and is the only chrome that stays — and
	 * from the page itself. Pinned, this bar charged every route a band across
	 * the top of the viewport for the whole session, and the shrink-on-scroll
	 * animation that used to live here was the interest paid on that: a
	 * compact state is something only a header that never leaves needs. This
	 * one leaves. (Wordmark.svelte keeps its monogram swap at phone width,
	 * which is about width and not about scroll.)
	 *
	 * Nothing here declares a `z-index` any more. It carried 40 to order its
	 * open dropdowns against the reading bar's 30, which was necessary only
	 * because `position: sticky` plus that number made this element a stacking
	 * context, trapping `.menu-panel`'s own 50 inside it. Unpositioned, it is
	 * no stacking context at all, so each panel's 50 now orders it directly —
	 * over the bar, and over `.reading-aside`/`.index-aside`, which carry no
	 * z-index of their own.
	 */
	.site-header {
		border-bottom: 1px solid var(--color-border);
		/* Not `--color-bg-elevated` directly: OLED takes this to true black
		   while leaving that surface lifted — see app.css. */
		background: var(--color-bg-chrome);
	}

	.header-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 0.75rem;
		/* A little more block padding than the old single-line brand needed: the
		   wordmark is two lines now, and letting it sit tight against the rule
		   makes the header read as cramped rather than as compact. One value at
		   every scroll position: the scroll-driven shrink that used to animate
		   this went with the sticky positioning above. */
		padding: 0.75rem 1rem;
		max-width: 90rem;
		margin-inline: auto;
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

	/*
	 * THE HEADER'S ROW OF SECTIONS, AND ONLY THAT. Below 720px it is hidden
	 * outright — not collapsed, not `height: 0` — and the sheet is what opens
	 * instead. It used to be one element in both roles, a
	 * `flex-basis: 100%` panel taking `order: 4` so that it wrapped onto a
	 * second line of `.header-bar` when open; being part of the bar's layout
	 * is precisely what made opening it move the page.
	 */
	.primary-nav {
		display: none;
	}

	.primary-nav a {
		padding: 0.3rem 0;
	}

	/* Shared by both renderings of the snippet, because they are one list and
	   a section that reads as current in the header must read as current in
	   the sheet. Only the box around each row differs, below. */
	.primary-nav a,
	.nav-links a {
		text-decoration: none;
		color: var(--color-text-muted);
	}

	.primary-nav a[aria-current='page'],
	.nav-links a[aria-current='page'] {
		color: var(--color-text);
		font-weight: 600;
	}

	.primary-nav a:hover,
	.nav-links a:hover {
		color: var(--color-text);
	}

	/* The sheet's own list. Everything else it wears — the dialog shell, the
	   panel, the head, the title, the close button, the scroll body — is
	   `app.css`'s `.dialog-bare`/`.sheet`/`.sheet-*`, shared with `TocMenu`
	   and `JumpBox`. A column because these six rows are a stack, which a
	   plain block body does not assume. */
	.nav-links {
		display: flex;
		flex-direction: column;
	}

	/* Sized for a thumb rather than for a pointer, which the header's own
	   copy of these links is: six rows have the room on a sheet that owns the
	   whole viewport, and this is the only rendering a touch reader gets. */
	.nav-links a {
		padding: 0.85rem 0.5rem;
		border-radius: 0.4rem;
		font-size: 1.05rem;
	}

	.nav-links a:hover {
		background: var(--color-bg-elevated);
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

		/* Wide layout is a single row: brand, nav, controls. The sections
		   appear here and slot between the other two, so the nav takes order 2
		   and the controls move to 3 — stated explicitly rather than left to
		   tie-break on DOM order, which is what happened when both were 2. */
		.primary-nav {
			order: 2;
			display: flex;
			gap: 1.25rem;
		}

		.controls {
			order: 3;
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
