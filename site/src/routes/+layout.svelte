<script lang="ts">
	import { onMount, tick } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import JumpBox from '$lib/components/JumpBox.svelte';
	import LanguageMenu from '$lib/components/LanguageMenu.svelte';
	import SettingsMenu from '$lib/components/SettingsMenu.svelte';
	import InstallButton from '$lib/components/InstallButton.svelte';
	import InstallHint from '$lib/components/InstallHint.svelte';
	import { install } from '$lib/install.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	// The other live-geometry mark beside `Wordmark`, and inline SVG for the
	// reason its docblock gives: an <img> cannot see the four theme axes.
	import JerusalemCross from '$lib/components/JerusalemCross.svelte';
	// Mounted once, globally: see the component's own docblock for why this is
	// a single delegated listener rather than something every link-generating
	// component (RefText, linkifyProse, route TOCs, ...) has to opt into.
	import LinkPreview from '$lib/components/LinkPreview.svelte';
	import { t } from '$lib/i18n.svelte';
	import { beforeNavigate } from '$app/navigation';
	import { carriesUpdate, serviceWorker } from '$lib/sw.svelte';
	import { usage } from '$lib/usage';
	import { version } from '$app/environment';
	import UpdateBanner from '$lib/components/UpdateBanner.svelte';
	// Mounted here rather than inside the panel that opens it: the popover
	// closes the instant its row is used, and a `<dialog>` unmounted
	// mid-`showModal()` never opens. See the component's own docblock.
	import AdvancedSheet from '$lib/components/AdvancedSheet.svelte';
	import ToTopButton from '$lib/components/ToTopButton.svelte';
	// The catalogue's own list, borrowed by the footer's index — see
	// `FOOTER_PAGES` below for why the works are not written out again here.
	import { visibleShelves } from '$lib/shelves';
	// Renders its own trigger AND its sheet AND the one window-level keydown
	// listener behind both, exactly as `JumpBox` does — which is why it sits in
	// the control row rather than with the overlays below: a modal dialog is in
	// the top layer, so where it is written decides nothing but where the
	// BUTTON lands. Every address it acts on is already in the rendered page's
	// markup (`rel="prev"`, `.reference-number`), so no route registers
	// anything.
	import Shortcuts from '$lib/components/Shortcuts.svelte';

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
	 * which the nav links stop hiding and become the header's own row, so
	 * there is no width at which a card would be the thing to draw.
	 */
	let navOpen = $state(false);
	let navDialog: HTMLDialogElement | undefined = $state();
	let navToggle: HTMLButtonElement | undefined = $state();

	/** The width at which the sections move into the header bar and the
	 *  hamburger disappears. Duplicated in the media query below, which cannot
	 *  read it; the two are one decision and are commented as one. */
	const BAR_QUERY = '(min-width: 720px)';

	/**
	 * FIVE DOORS, AND THE POINT IS THAT THE LIST STOPS GROWING.
	 *
	 * It was one item per WORK until 2026-09-04 — Bible, Catechism, Prayers,
	 * Calendar, Magisterium, Social Doctrine, Canon Law — which is a rule with
	 * no end state: seven items by the time the Code landed, and Denzinger, the
	 * Roman Catechism, the Fathers and a second code each cost another slot.
	 * Under this bar every future work lands inside Library or inside Learn and
	 * the bar is finished.
	 *
	 * WHO A NAV BAR IS FOR, which is the judgment the whole shape rests on.
	 * `docs/research/audiences.md` splits readers on whether they arrive with an
	 * ADDRESS or with a QUESTION. The address-holders — §7 the seminarian, §4
	 * the citation-follower — do not use this bar at all: one types `can. 748`
	 * into `JumpBox`, the other arrives mid-corpus on a URL someone else wrote
	 * and never sees the header. The question-holders (§1, §5) are "plausibly
	 * most of the traffic" and are the ones a bar of work names cannot serve,
	 * because using it means already knowing which book holds the answer. A bar
	 * of works is therefore built for the readers who need it least.
	 *
	 * NO "HOME" ENTRY: the brand link above is already a link to `/`, and two
	 * controls one tab-stop apart doing the identical thing is redundancy, not
	 * redundancy-as-safety. Removing it also lets `isActive` drop its special
	 * case (see below). Library is NOT that mistake repeated — it and the two
	 * shortcuts beside it reach different pages, and a shortcut past an index
	 * is ordinary navigation.
	 *
	 * `docs/research/organization.md` is the argument in full.
	 */
	const NAV_ITEMS = [
		{ href: '/scriptura', key: 'nav.bible' },
		// 28 prayers is not a pillar alongside works running to thousands of
		// pages each, but it is the shortest path from arrival to reading and
		// the most recognised word here after "Bible" — so it keeps a door.
		{ href: '/preces', key: 'nav.prayers' },
		// THE SUPERSET, NOT THE REMAINDER — the reason this bar can stop
		// growing. `/bibliotheca` lists every work including the two above, so
		// it makes no taxonomic claim and cannot become the bin for whatever did
		// not fit. Three umbrella labels were tried before it and all three
		// failed the same way; see that route's own docblock.
		{ href: '/bibliotheca', key: 'nav.library' },
		// The one page here whose subject is not a text: the liturgical
		// calendar is computed in the browser from the date of Easter and a
		// table of celebrations, with no content tier behind it. It is a door
		// rather than a work, which is why it survives a bar that keeps no
		// work-sized items — and it is the only by-date entry and the only
		// daily-return surface the site has.
		{ href: '/calendarium', key: 'nav.calendar' },
		// THE ONE IMPERATIVE AMONG FOUR NOUNS, and mixed grammar in a nav row is
		// normally a smell. It is taken deliberately: it is the only label here
		// that explains itself to a reader who does not yet know that
		// "Catechism" is where one goes to learn — §5, who was told to read the
		// Catechism and stops "at the vocabulary of the corpus itself". The site
		// already ships this mismatch the other way with "Magisterium" over
		// `/documenta`.
		//
		// IT POINTED AT `/catechismus` UNTIL 2026-09-04 AND NOW HAS A PAGE OF
		// ITS OWN. The label was doing work the page behind it did not do: a
		// table of divisions is exactly right for a reader who knows the outline
		// and useless to one who cannot name a part. `/schola` says what each
		// work IS and offers orders for reading them that the sources
		// themselves set out.
		//
		// LAST, NOT FIRST. It led the bar on the argument that a newcomer needs
		// the leftmost item; what that argument missed is that the four before
		// it are the works themselves, and a bar whose first item is about the
		// others reads as a preamble to them.
		{ href: '/schola', key: 'nav.learn' }
		// `/catechismus`, `/documenta`, `/doctrina-socialis`, `/ius-canonicum`
		// and `/doctores` are all one click away — inside Library, and the
		// Catechism inside Learn as well. Nothing became unreachable and no
		// route moved. The Catechism is the one work here with no door of its
		// own, which is what `isActive` no longer lighting anything on
		// `/catechismus` correctly reports.
	] as const;

	/**
	 * THE FOOTER NAMES EVERY PAGE, WHICH IS WHY THE BAR DOES NOT HAVE TO.
	 *
	 * The five doors above are a bar's answer to a reader moving THROUGH the
	 * site, and the argument for stopping at five is a width argument: a bar
	 * has one line and every future work would want a slot in it. A footer has
	 * neither constraint. It is read by someone who has reached the end of a
	 * page and is deciding where to go instead, and it can afford to be the
	 * index of what is here — so the two lists are not duplicates of each other
	 * at different lengths, they answer different questions, and the bar keeps
	 * its end state precisely BECAUSE the full list exists somewhere.
	 *
	 * TWO COLUMNS, AND THE SPLIT IS THE ONE `/bibliotheca` ALREADY DRAWS: the
	 * works are the texts this site reproduces, the pages are what it made
	 * around them. The works column is `visibleShelves()` — the same call the
	 * catalogue and the home page make, in the same order — because a second
	 * hand-written list of works is a list that parts company with the first
	 * one the next time something is ingested, and because the gate is the one
	 * that matters here too: a card for a work a partial sync did not carry is
	 * a door onto an empty index, and so is a link.
	 *
	 * The pages column is written out, and it is not `NAV_ITEMS` minus its
	 * works. Composing it that way would make the footer's contents a
	 * consequence of an edit to the bar, which is a coupling neither list
	 * wants: Bookmarks is here and not on the bar (it is a control in the
	 * header, beside the jump box), and Bible and Prayers are on the bar and
	 * in the works column, where they belong as texts.
	 *
	 * `/colophon` IS here since 2026-09-06 and used to be the imprint's own
	 * line; the entry below carries what that cost. No Home, for the reason the
	 * bar gives — the brand link is one, and this would be a third.
	 */
	const FOOTER_PAGES = [
		{ href: '/bibliotheca', key: 'nav.library' },
		{ href: '/calendarium', key: 'nav.calendar' },
		{ href: '/schola', key: 'nav.learn' },
		// The one entry that is nobody's text and not a door on the bar: what
		// the reader has marked. `/signata` is reached from the header by a
		// glyph, which is a control rather than a name — this is the only place
		// on the site that says the word.
		{ href: '/signata', key: 'nav.bookmarks' },
		// LAST, AND IT WAS THE IMPRINT'S OWN LINE UNTIL 2026-09-06 (by
		// direction). It is a page like the four above it and now looks like
		// one; what it costs is the adjacency `footer.notEndorsed` was written
		// against — that line is the one-sentence form of
		// `colophon.whatThisIsStanding` and was short because the full statement
		// was the line directly above it. It is still in this footer and still
		// one click away, a column over rather than a line up, which is the
		// weaker form of the same argument and the reason the disclaimer's
		// wording does not have to change. Last in the column because it is the
		// page about the site rather than a way into it.
		{ href: '/colophon', key: 'colophon.title' }
	] as const;

	// A section is "active" for its whole subtree (`/scriptura/...` counts as
	// Bible). No `'/'` special case is needed now that Home isn't a nav item —
	// every href here is a real section prefix. The footer's index marks its
	// current page with the same test, and the two `aria-current`s a reader on
	// `/scriptura` then gets are both true: two links to the page they are on.
	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	/**
	 * `await tick()` before `showModal()`: the sheet's copy of the links is
	 * rendered by `{#if navOpen}`, so the element `showModal()` is called on
	 * has to be given its content first. Rendering it only while open is also
	 * what keeps the nav anchors from existing twice in the document — the
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
	   leave the sheet covering a layout that is already showing the same
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
	 * A waiting update rides out on the next link the reader follows.
	 *
	 * This is moment 2 of the three in `$lib/sw.svelte.ts`'s docblock, and the
	 * one that does most of the work in practice: a reader moves between
	 * chapters constantly, and each of those moves is a free chance to change
	 * shell. They pay a document load where a soft transition would have been,
	 * at an address they have not arrived at yet — no scroll position exists
	 * there to lose, and nothing is on screen to shift under them.
	 *
	 * `carriesUpdate` decides which navigations qualify and argues each
	 * exclusion; it lives there rather than here because a predicate in a
	 * `.svelte` file is a predicate no test in this repo can reach.
	 *
	 * Here rather than in `serviceWorker.start()` because `beforeNavigate` is a
	 * lifecycle function: it has to be called while this component initialises,
	 * not from the `onMount` above.
	 */
	beforeNavigate((nav) => {
		if (!serviceWorker.updateReady) return;
		const to = nav.to?.url;
		if (!to) return;
		if (!carriesUpdate({ type: nav.type, from: nav.from?.url, to, willUnload: nav.willUnload }))
			return;
		nav.cancel();
		serviceWorker.applyOnNavigation(to.href);
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
     handler and the hrefs are the same decision in both, and the copy
     that is wrong is the one nobody is looking at. -->
{#snippet navLinks()}
	{#each NAV_ITEMS as item (item.href)}
		<!-- `data-label` is the same label again, for the width reservation in
		     the header's row (see `.primary-nav a::after`). It has to be an
		     attribute because a pseudo-element cannot read its host's text. -->
		<a
			href={item.href}
			data-label={t(item.key)}
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
				<SettingsMenu />
				<Shortcuts />
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

		THE SAME ARGUMENT ONE STEP FURTHER is why the standing statement is here
		and not only there. Can. 216 CIC reserves the name "Catholic" to
		undertakings holding the consent of competent ecclesiastical authority;
		this site holds none, and the name is on every page, so the disclaimer
		has to be too. `colophon.whatThisIsStanding` says it in full to a reader
		who went looking; `footer.notEndorsed` says it in a line to one who did
		not. It names the Holy See rather than "the Vatican" (which is the state)
		and rather than "ecclesiastical approbation" (which is a term of art a
		footer cannot carry).
	-->
	<footer class="site-footer">
		<!--
			ONE BAND ON THE HEADER'S OWN MARGINS, which is the whole of the
			arrangement: `.footer-inner` is `.header-bar`'s container (90rem,
			`margin-inline: auto`, 1rem of inline padding), so the mark below sits
			on the same line as the wordmark above it and the index ends where the
			header's controls end. The page is then bracketed by two bands with one
			set of margins rather than by a header laid out to the window and a
			footer centred on its own contents.

			IT WAS TWO STACKED CENTRED BLOCKS FOR ONE COMMIT AND THAT IS THE DEFECT
			IT FIXES. The index centred its two tracks as a pair, the imprint
			centred the mark and the lines as another, and the lines centred inside
			that — three axes, none of which agreed, because a centred pair of
			columns of unequal width does not put its text on the page's midline.
			Nothing was misaligned by a rule; there was no rule to be aligned to.
			An edge is what a column of links can be measured against, so the two
			blocks take opposite edges and the space between them is a gutter
			rather than the room left over.
		-->
		<div class="footer-inner">
			<!--
			The mark and the lines are ONE group in TWO grid columns, which is why
			they need a wrapper at all: the grid is what makes "cross, then text" a
			single thing to place. Two tracks rather than one row is what keeps the
			mark from ever reaching the text — it sits beside the lines and can
			never reflow them. Written in reading order and never positioned, so RTL
			needs nothing: in Arabic and Hebrew the columns reverse and the mark
			lands on the inline-start side, which is still the header's margin.

			FIRST IN THE DOCUMENT, WHERE IT USED TO BE LAST. The visual order is the
			document order and no `order` property is involved — the imprint is the
			site signing the page and the index is a list, so a screen reader
			reaching the footer landmark is told whose site this is before it is
			offered every address on it. It also puts the mark at the start margin
			under the brand, which is the arrangement's whole point.

			This replaced an absolutely-positioned mark in the inline-start lane,
			which is why `.site-footer` has no outsized inline padding any more:
			that padding existed ONLY to reserve the lane symmetrically so the
			centred lines stayed on the footer's true midline. With the mark in the
			flow there is no lane, and with the block on an edge there is no midline
			to hold it to.
		-->
			<div class="imprint">
				<JerusalemCross class="footer-cross" />
				<!--
				TWO LINES SINCE THE COLOPHON LINK JOINED THE INDEX, and what is left
				is only the site speaking about itself — a device and a standing
				statement, with nothing in the block to click. The uniformity rule
				that governed three lines still governs these two: neither is a
				heading for the other, and setting the disclaimer larger would make
				it an announcement rather than an imprint.

				THE MOTTO IS THE ONE THING HERE SET APART, in small capitals and at
				the full text colour (by direction). That is not a step in size or a
				second face — the two would make the stack a heading with a caption
				under it, which is what this block has always refused. Small capitals
				are how a printed imprint marks a DEVICE: the words are not a
				sentence about the site, they are the thing the site says, and with
				the colophon link gone there is no other line in the block for the
				eye to start on.

				`lang="la"` on the motto for the reason every reading region declares
				the language of its own text: this is Latin sitting in a page that may
				be in any of thirty-four languages, and a screen reader told nothing
				better will pronounce it as though it were the surrounding one.
				Untranslated on purpose: a motto is a fixed form of words, not a
				sentence to render in the reader's language.

				`footer.notEndorsed` is the one-line form of
				`colophon.whatThisIsStanding`, which the index at the other end of
				this band reaches. It was the line directly under that link until
				2026-09-06 and the shortness was argued from the adjacency; the full
				statement is still one click away and still inside this footer, so
				what changed is the distance and not the fact. Keep the two in the
				same band: move the colophon out of the footer altogether and this
				line would have to carry its own context.
			-->
				<div>
					<p class="motto" lang="la">Ad maiorem Dei gloriam</p>
					<p>{t('footer.notEndorsed')}</p>
				</div>
			</div>

			<!--
			THE INDEX OF THE WHOLE SITE, at the other edge of the same band. No rule
			between it and the imprint: a line there would make the pair read as two
			footers side by side, when what is wanted is one band that carries a
			signature at one end and addresses at the other.

			`aria-label` and not `aria-labelledby` pointing at one of the two
			column heads: neither head names the landmark, they name a half of
			it each. `nav.sections` is its own word for the same reason the
			header's list is called "Menu" — a landmark a screen reader reads
			out has to be named for what it is, and both names have to be
			different or the reader is told they have gone in a circle.

			The two `<h2>`s are real headings and not styled paragraphs. They
			land on every page's outline, which is the point: a reader moving by
			heading gets the site's index at the foot of whatever they were
			reading, and a "Works" that is only bold text is a label a screen
			reader never mentions.
		-->
			<nav class="footer-nav" aria-label={t('nav.sections')}>
				<div class="footer-group">
					<h2>{t('nav.works')}</h2>
					<!--
					`navKey ?? titleKey` is the catalogue's own rule for a name in
					a list of links; `shelves.ts` argues it beside the one entry
					that sets it. Keyed on `shelf.key` because the href is not
					unique in principle — two shelves could share a landing page
					before they share an identity.
				-->
					<ul>
						{#each visibleShelves() as shelf (shelf.key)}
							<li>
								<a href={shelf.href} aria-current={isActive(shelf.href) ? 'page' : undefined}>
									{t(shelf.navKey ?? shelf.titleKey)}
								</a>
							</li>
						{/each}
					</ul>
				</div>
				<div class="footer-group">
					<h2>{t('nav.pages')}</h2>
					<ul>
						{#each FOOTER_PAGES as item (item.href)}
							<li>
								<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
									{t(item.key)}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			</nav>
		</div>
	</footer>
</div>

<LinkPreview />
<InstallHint />
<UpdateBanner />
<AdvancedSheet />
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
	 * written around. The brand, the five doors and the reading controls
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
		/* Declared here rather than written into the two rules below because
		   the second of them exists only to reserve the width the first will
		   need; the two weights drifting apart is the one way this breaks. */
		--nav-weight-current: 600;
	}

	.primary-nav a[aria-current='page'],
	.nav-links a[aria-current='page'] {
		color: var(--color-text);
		font-weight: var(--nav-weight-current);
	}

	/*
	 * THE BOLD IS DRAWN OVER SPACE THAT WAS ALREADY THERE. A label at 600 is
	 * wider than the same label at 400, so marking the current section bold
	 * re-laid the row out on every navigation: the current link grew by a few
	 * pixels and every link after it slid along, which is motion the reader
	 * reads as the page shifting under them. Each anchor therefore carries its
	 * own label a second time, in the weight it will be WHEN current, as a
	 * zero-height box nothing can see — so the anchor is already as wide as its
	 * bold self, and `aria-current` changes the ink and nothing else.
	 *
	 * `visibility: hidden` and not `display: none`: hidden visibility is the
	 * one that still occupies width, and it is also what keeps the duplicate
	 * label out of the accessibility tree, which a pseudo-element cannot be
	 * told with an attribute.
	 *
	 * Only the header's row needs this. The sheet's copy is a column of
	 * full-width rows, where a wider label moves nothing.
	 */
	.primary-nav a::after {
		content: attr(data-label);
		display: block;
		height: 0;
		overflow: hidden;
		visibility: hidden;
		font-weight: var(--nav-weight-current);
		/* A reservation that wrapped where the visible label does not would
		   reserve the wrong width. */
		white-space: nowrap;
	}

	.primary-nav a:hover,
	.nav-links a:hover {
		color: var(--color-text);
	}

	/* The sheet's own list. Everything else it wears — the dialog shell, the
	   panel, the head, the title, the close button, the scroll body — is
	   `app.css`'s `.dialog-bare`/`.sheet`/`.sheet-*`, shared with `TocMenu`
	   and `JumpBox`. A column because these rows are a stack, which a
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
		border-radius: var(--radius-md);
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
		/* Inline padding lives on `.footer-inner`, which carries the header's,
		   so the two bands share one margin. Block padding is the footer's own
		   and is generous at the foot: this is the end of the document, and the
		   space under the last line is what says so. */
		padding-block: 2.25rem 2.75rem;
		text-align: start;
		font-size: 0.8rem;
	}

	/*
	 * `.header-bar`'s CONTAINER, RESTATED RATHER THAN SHARED — 90rem and
	 * `margin-inline: auto` with 1rem of inline padding, the three declarations
	 * that decide where a band's contents begin and end. A shared class is for
	 * a pattern with several unrelated callers; this is two bands bracketing one
	 * page, and the thing they share is a MARGIN, not a component. Change one
	 * and change the other: the cross sitting under the wordmark is the whole
	 * arrangement, and it is a resemblance maintained by hand.
	 *
	 * `space-between` and not a gap: the two blocks are anchored to opposite
	 * edges, so the space between them is what is left of the band rather than
	 * a number anyone chose. `align-items: start` puts the imprint's first line
	 * and the two column heads on one line across the whole footer.
	 *
	 * `flex-wrap` is the safety net and not the phone layout — a reader at 200%
	 * text size overflows a row long before the media query below fires, and a
	 * wrapped band is merely stacked where an unwrapped one is cut off.
	 */
	.footer-inner {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: start;
		gap: 2rem 3rem;
		max-width: 90rem;
		margin-inline: auto;
		padding-inline: 1rem;
	}

	/*
	 * TWO COLUMNS THAT STAY TWO COLUMNS. Each is the width of its own longest
	 * name (`auto` tracks, never `1fr`), so the two lists have one edge each and
	 * neither is stretched to meet the other — a column of links is read down
	 * its start edge, and a track wider than its widest name puts that edge
	 * nowhere in particular.
	 *
	 * It does not collapse to one column on a phone. Every name stacked is a
	 * footer taller than the reading it follows; two columns of short words fit
	 * a 320px screen, and the gutter is what gives if anything has to — hence
	 * the `clamp`, which is one declaration doing what a media query would.
	 */
	.footer-nav {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, auto));
		gap: 0 clamp(1.5rem, 8vw, 3.5rem);
	}

	/*
	 * OUR LABEL, SO THE INTERFACE FACE — `base.css` states the rule and the
	 * exception together: a heading takes the text face because it names a
	 * division of the WORK, and a heading that is entirely our own word for a
	 * group of links does not. "Works" and "Pages" are ours.
	 *
	 * Same size as everything else in the footer and separated by weight
	 * alone. A column head set larger would be an announcement, which is the
	 * argument the imprint's three lines are already built on — the whole
	 * footer is one chrome, and small print with two subheadings in it is
	 * still small print.
	 */
	.footer-group h2 {
		margin: 0 0 0.35rem;
		font-family: var(--font-sans);
		font-size: inherit;
		font-weight: 600;
		color: var(--color-text);
	}

	.footer-group ul {
		margin: 0;
		padding: 0;
		list-style: none;
		/* The imprint's leading, so the two blocks read as one column of small
		   print rather than as a list above a signature. */
		line-height: 1.9;
	}

	/*
	 * NO UNDERLINE AT REST, WHICH IS NOT AN EXEMPTION BUT THE RULE. `base.css`
	 * keeps the underline for a link inside a SENTENCE and records that every
	 * list-shaped surface on the site has opted out by hand — the header's
	 * nav, the index cards, the document rows. A column of names is that
	 * shape, and since 2026-09-06 every link in this footer is in it.
	 *
	 * `aria-current` marks the page the reader is on exactly as the bar does,
	 * and needs none of the width reservation that rule carries: these are
	 * stacked rows, so a label that grows when it turns bold pushes nothing
	 * along.
	 */
	.footer-nav a {
		/* The LINE alone, never the `text-decoration` shorthand: that shorthand
		   resets thickness and colour with it, and those two are `base.css`'s
		   (`from-font`, and 35% of the link's own ink) — dropping them here
		   would mean restating them in the hover rule below to get the site's
		   own underline back. */
		text-decoration-line: none;
		color: var(--color-text-muted);
	}

	.footer-nav a[aria-current='page'] {
		color: var(--color-text);
		font-weight: 600;
	}

	/*
	 * THE HOVER IS THE UNDERLINE ARRIVING, WHICH IS THE SITE'S OWN EVENT AND
	 * NOT A NEW ONE. `base.css` argues it at length for links in prose: the
	 * mark sits at 35% of the link's colour at rest and goes solid on hover,
	 * and "the interaction is the underline ARRIVING". A list-shaped surface
	 * drops the resting mark, so what is left to arrive is the whole line —
	 * the same event, one step further, rather than a footer-local invention.
	 * Only the LINE is declared here: its colour comes from `a:hover` in that
	 * file, its thickness and offset from `a`, so the mark drawn under a footer
	 * link is the same mark drawn under a link in a Catechism paragraph.
	 *
	 * The ink moves with it, to `--color-text`, which is exactly what the
	 * header's bar and sheet do (`.primary-nav a:hover`). Two channels because
	 * one of them is colour: a hover that were colour alone would say nothing
	 * under `data-mono`, where the palette is one hue by contract.
	 *
	 * NO BACKGROUND, though the header's sheet uses one. That row is full-width
	 * and its ground says which of a column of tap targets is under the finger;
	 * these are text-width links in a two-column index, where a ground would
	 * draw a box the size of the word and read as a chip.
	 *
	 * `:focus-visible` is deliberately absent: `base.css` already gives it the
	 * same treatment as `:hover`, and the focus RING is what a keyboard reader
	 * is actually following.
	 */
	.footer-nav a:hover {
		color: var(--color-text);
		text-decoration-line: underline;
	}

	/*
	 * TWO COLUMNS, AND THE POINT IS THAT THE MARK CANNOT REACH THE TEXT. Each
	 * sits in a track of its own, so the cross is beside the lines without
	 * being in with them: it cannot reflow them, wrap around them, or shift the
	 * one it happens to sit level with. A flex row did this until it did not —
	 * `flex-wrap` let the mark drop onto the text's line at narrow widths,
	 * which is exactly the interference two tracks rule out.
	 *
	 * `justify-content: start` rather than `center`: the block is placed by the
	 * band above and sits on the header's margin, so centring it inside itself
	 * would be a second alignment fighting the first. Each track stays the width
	 * of its own content either way.
	 */
	.imprint {
		display: grid;
		grid-template-columns: auto auto;
		align-items: center;
		justify-content: start;
		gap: 0.9rem;
	}

	/*
	 * `:global` because the class is passed into a component — the convention
	 * `Icon.svelte`'s consumers already follow — and the size is a `font-size`
	 * because the SVG is declared at 1em, so one number scales it.
	 *
	 * Full text colour and no opacity, where the three lines beside it are
	 * muted: the mark is the one thing in the footer that is not apparatus, and
	 * a heraldic figure faded to match small print reads as a watermark someone
	 * forgot to remove. 2.5rem because the potent bars and the four crosslets
	 * are real internal detail — below about 36px they start closing up, so
	 * this is the mark's floor rather than a preference.
	 */
	.site-footer :global(.footer-cross) {
		font-size: 2.5rem;
		color: var(--color-text);
	}

	/*
	 * BOTH LINES, ONE RULE, which is what keeps them one chrome: give either
	 * its own SIZE or its own FACE and the stack stops reading as an imprint
	 * and starts reading as a heading with a caption.
	 *
	 * Spacing comes from `line-height` rather than margins, because stacked
	 * lines of one size want even leading, and margins between them would be a
	 * second number saying the same thing.
	 *
	 * There is no link left in this block to make an exception for. It carried
	 * the colophon's until 2026-09-06 and the rule then was that the exception
	 * is made by DELETING — the block used to override `a` back to the muted
	 * colour with no underline, which left the footer's only link
	 * indistinguishable from the statements under it, an affordance disguised
	 * as a caption. Worth keeping because it is the standing direction for the
	 * next link anybody puts in an imprint: let `base.css` have it.
	 */
	.site-footer p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: 1.9;
	}

	/*
	 * THE DEVICE, AND EVERY CHANNEL IT SPENDS IS ONE THE RULE ABOVE ALLOWS.
	 * Small capitals and full-strength ink — not a step in size, not a second
	 * face, not a weight. Weight was the obvious alternative and is the wrong
	 * one: at 0.8rem a bold line reads as emphasis inside a sentence, and this
	 * is not a sentence but a formula, set the way an imprint has always set a
	 * device.
	 *
	 * SYNTHESISED WHERE THE FACE HAS NO `smcp`, WHICH IS FINE AND IS WHY IT IS
	 * `small-caps` AND NOT `all-small-caps`. Google's subsets partition a
	 * family by Unicode range and may drop the feature; every engine draws
	 * scaled capitals when a font cannot answer `small-caps`, so the line is
	 * never left as ordinary lower case. A subset audit is what `fonts.css`
	 * would need if this were ever a hard requirement, and it is not.
	 *
	 * The tracking is what makes capitals readable at this size — letterforms
	 * of one height need the extra room between them — and 0.06em is the least
	 * that does it. `lang="la"` is on the element for the reason the markup
	 * gives; it costs nothing here and is not what this rule selects on.
	 */
	.motto {
		font-variant-caps: small-caps;
		letter-spacing: 0.06em;
		color: var(--color-text);
	}

	/*
	 * BELOW THE BAND'S OWN WIDTH THE FOOTER IS CENTRED AGAIN, and that is not a
	 * retreat to the arrangement this replaced. Two edges are worth having when
	 * there is a band between them; stacked in one column there is only one
	 * edge, and a block sitting hard against the start margin of a narrow screen
	 * with the whole gutter on the other side is lopsided rather than aligned.
	 *
	 * 46rem is where the imprint and the two link columns stop fitting side by
	 * side — measured, not the header's 720px, because the two bands hold
	 * different things and a shared number here would be a coincidence dressed
	 * as a decision.
	 */
	@media (max-width: 46rem) {
		.site-footer {
			text-align: center;
		}

		.footer-inner {
			flex-direction: column;
			align-items: center;
			gap: 2rem;
		}

		/* The columns keep their own start edges — the pair is centred, the
		   names inside it are not, for the reason `.footer-nav` gives. */
		.footer-nav {
			justify-content: center;
			text-align: start;
		}

		.imprint {
			justify-content: center;
		}
	}
</style>
