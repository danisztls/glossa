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
	// Mounted once for the same reason, and it reads the same markup: what a
	// highlight resolves to is the nearest `data-unit-href` above it, so no
	// reading route imports this or knows it exists.
	import SelectionMenu from '$lib/components/SelectionMenu.svelte';
	// The third of the same kind: it reads `data-unit-href` and `data-edition`
	// off the rendered page and washes the words a bookmark quoted, where the
	// reader is in the edition they were quoted from.
	import QuoteMarks from '$lib/components/QuoteMarks.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { bcp47 } from '$lib/ui-langs';
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
	// The gate on the one row in the works column that is not a work — see
	// `footerWorks`, and `ShelfGrid.svelte` for the card that shares it.
	import { hasTopics } from '$lib/corpus';
	// Renders its own trigger AND its sheet AND the one window-level keydown
	// listener behind both, exactly as `JumpBox` does — which is why it sits in
	// the control row rather than with the overlays below: a modal dialog is in
	// the top layer, so where it is written decides nothing but where the
	// BUTTON lands. Every address it acts on is already in the rendered page's
	// markup (`rel="prev"`, `.reference-number`, `data-help`), so no route
	// registers anything.
	import Help from '$lib/components/Help.svelte';
	import { installAnchorGlide } from '$lib/anchor-scroll';

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
	 * The footer's index of pages, beside `visibleShelves()`'s works. The bar
	 * above stops at five doors because a bar is one line; the footer has no
	 * such limit, so it can name everything and the bar never has to grow.
	 *
	 * Written out rather than derived from `NAV_ITEMS`: Bookmarks is here and
	 * not on the bar, and the Bible and the Prayers are on the bar but belong
	 * in the works column. No Home — the brand link is already one. `/quaestiones`
	 * is not here either, for the same reason the Bible is not: see
	 * `footerWorks`.
	 *
	 * `/colophon` IS IN THE FOOTER AND THAT IS THE PART THAT MATTERS.
	 * `footer.notEndorsed` in the imprint is the one-sentence form of
	 * `colophon.whatThisIsStanding` and is short because that statement is
	 * reachable from the same footer; move this link out of the footer and the
	 * disclaimer has to grow. Where in the column it lands is `footerPages`'s
	 * business and no longer an argument here.
	 *
	 * THE ORDER THIS IS WRITTEN IN IS NOT THE ORDER IT IS DRAWN IN — see
	 * `footerPages` below. This list is read by whoever edits it, so it stays
	 * grouped by the reasoning above; the column is alphabetical.
	 */
	const FOOTER_PAGES = [
		{ href: '/bibliotheca', key: 'nav.library' },
		{ href: '/calendarium', key: 'nav.calendar' },
		{ href: '/schola', key: 'nav.learn' },
		// The header reaches `/signata` by a glyph, so this is the only place
		// on the site that says the word.
		{ href: '/signata', key: 'nav.bookmarks' },
		{ href: '/colophon', key: 'colophon.title' }
	] as const;

	/**
	 * BOTH COLUMNS ARE ALPHABETICAL, AND IN THE READER'S OWN ALPHABET — which
	 * is why they are sorted at render rather than typed in order. A column
	 * ordered by the English labels is alphabetical for one reader in
	 * thirty-seven and arbitrary for the rest: `Perguntas` does not fall where
	 * `Questions` does, and a Ukrainian column sorted by the Latin spellings of
	 * its own words is in no order at all.
	 *
	 * `Intl.Collator` and not `localeCompare`, for the reason `bcp47` exists:
	 * it is constructed once per language rather than once per comparison, and
	 * the tag it is handed has to be one `Intl` can resolve — `zht` is not, and
	 * silently falls back to the browser's locale rather than throwing.
	 *
	 * THE WORKS COLUMN IS SORTED HERE AND NOWHERE ELSE, and that is not this
	 * page disagreeing with the catalogue. `$lib/shelves.ts` still owns WHAT is
	 * in the column and the gate that keeps a work this build did not sync out
	 * of it; what the footer changes is the ORDER, because an index at the foot
	 * of every page is LOOKED UP and a catalogue is READ. `/bibliotheca` and
	 * the home page draw the sequence — the order a reader meets the Church's
	 * texts — where a reader down here already knows the name they came for and
	 * is running an eye down a column for it. Two columns side by side is also
	 * an argument in itself: one alphabetical and one not reads as a mistake in
	 * whichever of them the reader tests first.
	 */
	const collator = $derived(new Intl.Collator(bcp47(i18n.lang)));

	const footerPages = $derived(
		FOOTER_PAGES.map((item) => ({ href: item.href, label: t(item.key) })).sort((a, b) =>
			collator.compare(a.label, b.label)
		)
	);

	/**
	 * The catalogue's works, plus the one way in that is not a work.
	 *
	 * QUESTIONS IS IN THIS COLUMN AND NOT IN PAGES, which is the same call
	 * `ShelfGrid.svelte` makes by putting its card in the bed with the works
	 * rather than above it. The other column is the site's own furniture —
	 * where the catalogue is, what the day is, how to read a citation, what
	 * you have marked, who is publishing this. `/quaestiones` is none of
	 * those: every topic on it resolves to passages of the Catechism, the
	 * Compendium of the Social Doctrine and the Code, so it is a way into the
	 * three works listed beside it, by the index a reader holding a sentence
	 * and no reference can use. It has no `Shelf` row for the reason the card
	 * has none — a `Shelf` is a work type plus that work's own strings — and
	 * it is gated for the reason the card is gated: over a build with no topic
	 * list it is a link to `quaestiones.landing.none`.
	 */
	const footerWorks = $derived(
		[
			...visibleShelves().map((shelf) => ({
				href: shelf.href,
				label: t(shelf.navKey ?? shelf.titleKey)
			})),
			...(hasTopics() ? [{ href: '/quaestiones', label: t('quaestiones.landing.title') }] : [])
		].sort((a, b) => collator.compare(a.label, b.label))
	);

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
	 * Fragment jumps within the page the reader is on — a table of contents
	 * row, a verse number — glided rather than cut. One document-level listener
	 * for the whole session, here for the reason the three above are: the
	 * layout mounts once, and no reading route should have to remember that a
	 * global exists. `$lib/anchor-scroll.ts` argues why it replays the browser's
	 * jump instead of taking the click.
	 */
	onMount(() => installAnchorGlide());

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
				<Help />
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
		The imprint and the index at opposite ends of one band. `.footer-inner`
		repeats `.header-bar`'s container, so both bands sit on the same margins
		and the cross lands under the wordmark; change one and change the other.

		The colophon is deliberately in a footer rather than the navbar: it is
		not a reading section and shouldn't compete with the ones that are. But
		it does have to be reachable from every page — docs/research/copyright.md
		§5's posture rests on the position being stated openly, and a page nobody
		can find states it to nobody. Same argument one step further for the
		standing statement below: Can. 216 reserves the name "Catholic" to
		undertakings holding ecclesiastical consent, this site holds none, and
		the name is on every page, so the disclaimer has to be too.
	-->
	<footer class="site-footer">
		<div class="footer-inner">
			<!-- Two grid tracks, so the mark can never reflow the lines. Written
			     in reading order and never positioned, so RTL needs nothing.

			     THE WHOLE BLOCK IS THE LINK TO `/colophon`, because every word in
			     it is a short form of something that page says at length: the
			     motto is what the site is for, `footer.notEndorsed` is one
			     sentence of `colophon.whatThisIsStanding`, and the cross is the
			     mark the colophon explains. A reader who stops on the disclaimer
			     wants the rest of it, and it was two columns away in the index.

			     No `aria-label`: the link's name is the lines it is drawn from,
			     which is long but true. `title` names the destination for a
			     reader who hovers the mark and expects a word. -->
			<a
				class="imprint"
				href="/colophon"
				title={t('colophon.title')}
				aria-current={isActive('/colophon') ? 'page' : undefined}
			>
				<JerusalemCross class="footer-cross" />
				<!-- `lang="la"` because this is Latin in a page that may be in any
				     of thirty-odd languages. Untranslated on purpose: a motto is a
				     fixed form of words.

				     `footer.notEndorsed` is `colophon.whatThisIsStanding` in one
				     line. It names the Holy See rather than "the Vatican" (the
				     state, not the authority) and rather than "ecclesiastical
				     approbation" (a term of art a footer cannot carry). -->
				<div>
					<p class="motto" lang="la">Ad maiorem Dei gloriam</p>
					<p>{t('footer.notEndorsed')}</p>
				</div>
			</a>

			<!-- `nav.sections` rather than `nav.menu`: the header's list already
			     holds that name, and two landmarks announced alike tell a reader
			     they have gone in a circle. The `<h2>`s are real headings so the
			     groups exist for a reader moving by heading. -->
			<nav class="footer-nav" aria-label={t('nav.sections')}>
				<div class="footer-group footer-pages">
					<h2>{t('nav.pages')}</h2>
					<ul>
						{#each footerPages as item (item.href)}
							<li>
								<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
				<div class="footer-group footer-works">
					<h2>{t('nav.works')}</h2>
					<!-- The catalogue's own list (`$lib/shelves.ts`) in this
					     column's own order — see `footerWorks` for both halves of
					     that. The list is what the footer cannot disagree with
					     `/bibliotheca` about, and it inherits that page's gate: no
					     link to a work this build did not sync. -->
					<ul>
						{#each footerWorks as item (item.href)}
							<li>
								<a href={item.href} aria-current={isActive(item.href) ? 'page' : undefined}>
									{item.label}
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
<SelectionMenu />
<QuoteMarks />
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
		padding-block: 2.25rem 2.75rem;
		text-align: start;
		font-size: 0.8rem;
		/* The imprint's lines, the index's rows, and the mark's size are all
		   measured from these two. */
		--imprint-leading: 1.9;
		--motto-step: 1.1;
	}

	/* `.header-bar`'s container, restated. The two bands share a margin, not a
	   component — change one and change the other. */
	.footer-inner {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-evenly;
		align-items: center;
		gap: 2rem 3rem;
		max-width: 90rem;
		margin-inline: auto;
		padding-inline: 1rem;
	}

	.footer-nav {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, auto));
		gap: 0 clamp(1.5rem, 8vw, 3.5rem);
	}

	/* The rule spans the group's tracks because the `<h2>` is a block and the
	   group is as wide as its own list — so it must never be given a width. */
	.footer-group h2 {
		margin: 0 0 0.45rem;
		padding-bottom: 0.3rem;
		border-bottom: 1px solid var(--color-border);
		font-family: var(--font-sans);
		font-size: inherit;
		font-weight: 600;
		color: var(--color-text);
	}

	.footer-group ul {
		margin: 0;
		padding: 0;
		list-style: none;
		line-height: var(--imprint-leading);
	}

	/*
	 * The tracks are a use of the space and not a second group, which is why
	 * this is `column-count` on the one list rather than several lists under
	 * several headings: the DOM keeps one list in reading order and the browser
	 * picks the break. No gutter inside a group — the head rule marks the
	 * grouping, and the gap that has to survive is the one BETWEEN groups.
	 */
	.footer-works ul,
	.footer-pages ul {
		column-count: 2;
	}

	/* A wrapped name would otherwise put its second line atop the next track,
	   where it reads as an entry of its own. */
	.footer-group li {
		break-inside: avoid;
	}

	/* No resting underline, as every list-shaped link surface here. The hover is
	   that underline arriving, which is `base.css`'s own event: only the LINE is
	   declared, so the colour comes from `a:hover` and the thickness and offset
	   from `a`. The ink moves too, because colour alone says nothing under
	   `data-mono`. */
	.footer-nav a {
		text-decoration-line: none;
		color: var(--color-text-muted);
	}

	.footer-nav a:hover {
		color: var(--color-text);
		text-decoration-line: underline;
	}

	.footer-nav a[aria-current='page'] {
		color: var(--color-text);
		font-weight: 600;
	}

	/* Two tracks, so the mark cannot reflow the lines; `start` because the band
	   already places the block.

	   It is an `<a>` and carries none of a link's skin: the motto and the
	   standing statement keep the sizes and inks they had, so the block reads
	   as the imprint it is and not as a paragraph-shaped button. */
	.imprint {
		display: grid;
		grid-template-columns: auto auto;
		align-items: center;
		justify-content: start;
		gap: 0.9rem;
		color: inherit;
		text-decoration-line: none;
	}

	/*
	 * THE MARK ANSWERS, and the motto's underline arrives with it. The accent
	 * on the cross is the event a reader watches for — it is the one figure in
	 * the band — but `data-mono` has no accent to give (`base.css` on why the
	 * site's links keep a rule under them at rest), so a colour-only hover
	 * would leave that mode with nothing at all. The underline is what says
	 * `link` there; the cross is what makes it worth pointing at.
	 */
	.imprint:hover :global(.footer-cross),
	.imprint:focus-visible :global(.footer-cross) {
		color: var(--color-accent);
	}

	.imprint:hover .motto,
	.imprint:focus-visible .motto {
		text-decoration-line: underline;
		text-decoration-color: currentColor;
		text-underline-offset: 0.15em;
	}

	/*
	 * `:global` because the class is passed into a component, and a `font-size`
	 * because the SVG is declared at 1em.
	 *
	 * Sized FROM the lines beside it — the leading times the two lines' own
	 * sizes, plus a little, so it stands slightly proud of the block and stays
	 * that way if any of those numbers moves. `1em` in `font-size` resolves
	 * against the parent. Full ink where the lines are muted: a heraldic figure
	 * faded to match small print reads as a watermark. It should not go below
	 * about 36px, where the potent bars and crosslets start closing up.
	 */
	.site-footer :global(.footer-cross) {
		font-size: calc(var(--imprint-leading) * (1em + var(--motto-step) * 1em) + 0.4rem);
		color: var(--color-text);
	}

	/* One face across both lines, and the leading does the spacing, so margins
	   would be a second number saying the same thing. */
	.site-footer p {
		margin: 0;
		color: var(--color-text-muted);
		line-height: var(--imprint-leading);
	}

	/* 800 is the top of the interface face's declared `200 800` axis, so this is
	   an interpolation rather than a synthesised bold. It was 900 against Source
	   Sans 3's wider axis; a weight past the top of a variable axis is clamped,
	   not drawn, so the number has to follow the face. Small caps are synthesised
	   where the subset dropped `smcp`, which is why it is not `all-small-caps`;
	   the tracking is what makes capitals readable at this size. */
	.motto {
		font-size: calc(var(--motto-step) * 1em);
		font-variant-caps: small-caps;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: var(--color-text);
	}

	/* Stacked, the band has one edge rather than two, so it centres instead.
	   54rem is where the imprint and the index stop fitting side by side. */
	@media (max-width: 54rem) {
		.site-footer {
			text-align: center;
		}

		.footer-inner {
			flex-direction: column;
			align-items: center;
			gap: 2rem;
		}

		.footer-nav {
			justify-content: center;
			text-align: start;
		}

		/*
		 * AND THE IMPRINT GOES LAST. Side by side it leads the band, which is
		 * right — a mark and a standing disclaimer at the start of the footer.
		 * Stacked it put four lines of furniture between the end of the page
		 * and the only links the footer has, so a reader scrolling to the
		 * bottom for the index met the small print first.
		 *
		 * `order` rather than a move in the markup, because the wide layout
		 * wants the DOM order it has. It does cost something now that the
		 * block is a link: on a phone it is the footer's FIRST tab stop and
		 * its LAST line. One stop out of place, and the page it goes to is
		 * also the last entry of the index below it — a keyboard reader who
		 * tabs straight past it meets `/colophon` again where it looks like
		 * it belongs.
		 */
		.imprint {
			order: 1;
			justify-content: center;
		}
	}

	/* Four tracks side by side do not fit a phone, so the GROUPS stack — and
	   the tracks inside them go too. Two columns of two or three short names
	   on a 360px screen are a table of ragged stubs whose gutter is wider than
	   half its entries; the same names set as a running line fill the width
	   they are given and cost fewer rows than the grid did. Each group is then
	   one sentence that opens with its own name — "Pages: Library ⸱ …" — which
	   is what a phone footer is for: the whole index visible without a column
	   to scan. */
	@media (max-width: 40rem) {
		/* A gap answers to what it separates, and it has to answer to what it
		   sits BESIDE. The stacked groups took 1.5rem when each was a heading
		   over a block; as two sentences that was two unrelated bands with the
		   footer's ground between them, and 0.5rem was the correction — which
		   overshot, because a group is itself several lines now and 0.5rem on
		   top of a 1.5 leading barely beats the space between two lines of the
		   same sentence. 1rem is the distance that reads as a break between
		   two things rather than a wrap within one. */
		.footer-nav {
			grid-template-columns: minmax(0, auto);
			gap: 1rem 0;
		}

		/*
		 * A GROUP IS ONE WRAPPING ROW AND THE `<ul>` DISSOLVES INTO IT. The
		 * heading, every name and every separator are flex items of the same
		 * row, so `display: contents` on the list is what puts them there —
		 * its box goes, its children stay where they are in the tree, and the
		 * list is still a list to a screen reader. Nothing else here can make
		 * the heading share the line: as a flex ITEM the `<ul>`'s hypothetical
		 * width is its max-content, so a wrapping row always breaks between
		 * the two and the heading is back above the list it names.
		 *
		 * INLINE FLOW WAS THE FIRST ATTEMPT AND IT IS THE INSTRUCTIVE ONE. It
		 * gets the wrapping and the centring for free, but a line breaks only
		 * where its text offers an opportunity — and the only real whitespace
		 * in this row is the space after the colon and the spaces INSIDE
		 * multi-word names. Between the items there is none: Svelte trims the
		 * whitespace at the edges of an element's children, so nothing
		 * separates one `<li>` from the next, and the separator is drawn
		 * rather than typed. So the run of names moved as one indivisible
		 * block — `PAGES:` alone on its own line with all five links beneath
		 * it — while the one place the line COULD break was the middle of a
		 * name: `Social / Doctrine`, `Canon / Law`, each reading as two
		 * entries.
		 *
		 * `.breadcrumb` had already answered this and its docblock says so in
		 * as many words: a crumb wraps as a unit, which is what a flex row
		 * buys and inline flow could not. The three rules that follow are that
		 * one's, including the `flex: 0 0 auto` — a flex item shrinks before
		 * the row wraps, so without it a long name is squeezed narrow and
		 * wraps inside itself, which is the same stack of fragments by another
		 * route. `max-width` caps an item at the line, the one case where a
		 * name may still break inside itself.
		 *
		 * `justify-content` AND NOT `text-align`, which does not reach into a
		 * flex container: the stacked band centres everything else it holds,
		 * and each group here is a sentence rather than the column whose
		 * ragged edge the wider layout starts flush.
		 *
		 * 1.5 AND NOT `--imprint-leading`. The 1.9 the imprint keeps is for
		 * lines that are each their own entry, where the air is what separates
		 * them; these lines are one sentence broken by the width of a phone,
		 * and at 1.9 they drift apart into a list of three things. The leading
		 * is also the whole of the row gap — `gap`'s first value is 0 for that
		 * reason.
		 */
		.footer-group {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			justify-content: center;
			gap: 0 0.5rem;
			line-height: 1.5;
		}

		/* `column-count` is undone as well as the box: multicol does not apply
		   to a box that is not generated, and a rule that only works because
		   another one overrules it is a rule nobody can move.

		   THE LEADING HAS TO BE HANDED BACK, which is the trap in
		   `display: contents`: the box goes, the ELEMENT does not, so it still
		   sits between the group and the names for everything that inherits.
		   The wide layout's 1.9 would otherwise reach the items straight past
		   the 1.5 set on the row they are now in. */
		.footer-works ul,
		.footer-pages ul {
			column-count: initial;
			display: contents;
			line-height: inherit;
		}

		.footer-group li {
			flex: 0 0 auto;
			max-width: 100%;
		}

		/* The rule under the heading goes with the stacking — a border-bottom
		   on a word run into the line it names is an underline, the one mark
		   this footer spends on hover. Uppercase takes over what it did: run
		   in, a heading set like the names beside it is just the sentence's
		   first word, and capitals make it a label again. It is the mark
		   `.label-micro` uses site-wide for a word saying what kind of thing
		   follows, with its tracking, which capitals want at this size.
		   `text-transform` and not a dictionary written in capitals: the
		   string stays as its translator wrote it, so it is read and searched
		   as a word. */
		.footer-group h2 {
			margin: 0;
			padding: 0;
			border-bottom: 0;
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		/* Drawn, like every separator here, and for the same reason: it is
		   punctuation between the label and the list, not a word in either. */
		.footer-group h2::after {
			content: ':';
		}

		/*
		 * ⸱ is U+2E31 WORD SEPARATOR MIDDLE DOT, which is the character for
		 * exactly this and not `·` (U+00B7), the mathematician's dot the card's
		 * `.meta` uses between phrases. Drawn in CSS, as every separator on
		 * this site is, so no screen reader reads it out.
		 *
		 * AFTER the item and never before the next one: the line wraps two or
		 * three times at this width, and a separator that leads its item starts
		 * a wrapped line with a dot, which reads as a bullet. Trailing, it
		 * closes the line it ends and every line begins with a word. `:last-of-type`
		 * so the sentence has no dangling one.
		 *
		 * IT RIDES WITH ITS OWN ITEM rather than sitting between two, which is
		 * what makes the rule above about where a line breaks true: the flex
		 * row breaks between items, and the dot is part of the one it closes,
		 * so it can never begin a line.
		 */
		.footer-group li:not(:last-of-type)::after {
			content: '⸱';
			/* The leading side only: the row's own `column-gap` opens the
			   other, and a margin here as well would count the space twice. */
			margin-inline-start: 0.5rem;
			/* The links' own ink, not `--color-border`: a rule drawn across a
			   ground may sit at the edge of visibility, but a mark ON the line
			   has to read as punctuation between two words, and at 0.8rem the
			   border grey was a speck. */
			color: var(--color-text-muted);
		}
	}
</style>
