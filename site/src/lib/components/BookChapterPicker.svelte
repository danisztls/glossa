<script lang="ts">
	/**
	 * Book/chapter navigator for the Bible reader.
	 *
	 * Renders ONE canonical book/chapter structure (docs/decisions.md #4:
	 * "structure is independent of the content version") from
	 * `listCanonicalBooks()` — the union of books/chapters across every Bible
	 * edition — rather than looping over each Bible work and duplicating the
	 * whole grid per edition. Only the book *names* and the link *targets* are
	 * edition-specific — and only the NAMES now, since the hrefs became
	 * edition-free (`/scriptura/{book}/{chapter}`, see that route's `+page.ts`).
	 *
	 * Interaction: book-first, then chapters. 73 books x up to 150 chapters
	 * is too much to lay flat, so books are grouped into Old/New Testament
	 * (docs/corpus-schema.md's 46+27 canonical order — `OT_BOOK_COUNT` below)
	 * and only ONE book's chapter grid is in the DOM at a time, toggled by
	 * plain `<button aria-expanded>` elements — native keyboard support
	 * (Enter/Space, Tab order) with no custom key handling needed, and no
	 * page ever renders more than one book's worth of chapter links.
	 *
	 * The chapter grid is an OUT-OF-FLOW panel anchored to its book button,
	 * not an in-flow block, in EVERY variant (see `variant` below). In flow,
	 * on a wrapped grid of book chips, opening a book mid-grid pushed every
	 * later book onto a new row (or further down a column) and the whole
	 * list jumped under the reader's cursor — the book they were aiming at
	 * moved before they clicked it. Out of flow, opening a panel changes
	 * nothing about the grid behind it, in the sidebar exactly as much as
	 * anywhere else.
	 *
	 * Leaving the flow has two consequences, both handled below: nothing in
	 * CSS knows where on the screen the button it is anchored to sits, so
	 * the panel's size and offset are measured from the real DOM instead
	 * (`Placement` below); and it no longer dismisses by re-clicking alone,
	 * so it takes the same outside-click/Escape handling as the header
	 * menus.
	 *
	 * The panel opens OUT OF its chip: same top, same inline start, so it
	 * covers the chip and its title lands where the chip's label was. That
	 * is why the title is a button — the chip is still what closes the
	 * panel, and a covered chip cannot be clicked.
	 *
	 * There are deliberately NO chevron indicators on the book buttons.
	 * `aria-expanded` carries the state for assistive tech, and sighted
	 * readers get it from the open panel itself plus the button's own active
	 * styling — a caret pointing at a panel already occupying the space below
	 * it is redundant, and at 73 buttons the glyphs were most of the grid's
	 * visual noise.
	 *
	 * THREE VARIANTS, differing in two things: what the chapter panel has to
	 * escape INTO, and whether the books need a disclosure of their own.
	 *
	 * `'grid'` (default) is the `/scriptura` landing route — ordinary
	 * document flow, so the chapter panel is `position: absolute`, anchored
	 * to its own `.book-item` and scrolling with the page exactly as the
	 * button does.
	 *
	 * `'sidebar'` is the reading view's desktop right column
	 * (`.reading-aside`, app.css) and `'panel'` is the reading bar's
	 * contents sheet (`TocMenu`, rendered into `.sheet-body`). Both of those
	 * are their own `overflow-y: auto` scroll containers, which would clip an
	 * `absolute` panel the moment it needed to be wider or taller than the
	 * box it lives in — the 17rem column, or the 22rem card the sheet becomes
	 * above 48rem. `position: fixed` escapes both: nothing between the button
	 * and the viewport sets `transform`, `filter`, `contain` or `will-change`
	 * (any of which would re-capture a fixed descendant into its own
	 * containing block instead), so the panel floats over the page rather
	 * than being cut off, and opening it cannot resize its host either. A
	 * `<dialog>` in the top layer is no exception: `.sheet` and
	 * `.sheet-panel` set position and flex and nothing that establishes a
	 * containing block, and the panel still PAINTS inside the dialog's own
	 * stacking context, which is above everything.
	 *
	 * All three share the same `Placement` measurement and dismiss
	 * machinery; only the positioning mode and the coordinate space differ —
	 * `offsetPx`, relative to `.book-item`'s own box, for `'grid'`'s
	 * `absolute`; `leftPx`/`topPx`/`bottomPx`, measured against the viewport,
	 * for the two `fixed` ones. See `measurePlacement`.
	 *
	 * What separates `'panel'` from `'sidebar'` is only the BOOK list, not
	 * the chapter panel: the sheet is as wide as the phone, so it keeps
	 * `'grid'`'s wrapped chips with the books' full names, where the sidebar
	 * has to compress 73 of them into a 17rem column of truncated cells.
	 *
	 * `collapsible` is ignored by both of those: each is already inside
	 * something a reader opened — a persistent nav column, or a sheet summoned
	 * from the reading bar — so a `<summary>` there would be a disclosure
	 * inside a disclosure. The reading route renders a `'sidebar'` and a
	 * `'panel'` instance at once, one hidden by the breakpoint that reveals
	 * the other (app.css, `.reading-aside`/`.toc-menu`), rather than
	 * switching one instance's variant at runtime: a reader gets the right
	 * one on first paint and nothing ever has to relocate itself across the
	 * page after the fact.
	 */
	import { afterNavigate } from '$app/navigation';
	import { getBook, hasIntroForWork, listCanonicalBooks, type CanonicalBook } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import { hrefFor } from '$lib/address';

	interface Props {
		/** Which edition's book NAMES to show. No longer affects link targets — those are edition-free. */
		currentWorkId: string;
		/** Omit on the landing route, where there is no "current" chapter to highlight. */
		currentOsis?: string;
		currentChapter?: number;
		collapsible?: boolean;
		/** `'grid'` (default): wrapped flex grid of chips + an `absolute`
		    popover anchored to `.book-item`. `'sidebar'`: a compact grid of
		    truncated cells + a `fixed` popover anchored to the viewport, for
		    `.reading-aside`. `'panel'`: `'grid'`'s chips with `'sidebar'`'s
		    `fixed` popover, for the reading bar's contents sheet. */
		variant?: 'grid' | 'sidebar' | 'panel';
	}

	let {
		currentWorkId,
		currentOsis,
		currentChapter,
		collapsible = true,
		variant = 'grid'
	}: Props = $props();

	const workId = $derived(currentWorkId);
	/** Whether the chapter panel is `fixed` rather than `absolute` — true for
	 *  the two variants that live inside a scroll container of their own. The
	 *  book list's own layout is a separate question; see the docblock. */
	const floating = $derived(variant !== 'grid');
	const books = listCanonicalBooks();

	/** 46 OT + 27 NT = 73, in that fixed order — docs/corpus-schema.md "Canonical book order". */
	const OT_BOOK_COUNT = 46;

	/**
	 * How many columns the chapter grid ASKS for. What it gets is this or
	 * whatever the viewport can spare, whichever is smaller — see
	 * `.chapters`' `inline-size` below, which is where the two meet.
	 *
	 * Ten, because chapter numbers are read in tens: rows that start at 1,
	 * 11, 21, 31 put chapter 27 where the eye already expects it, and a
	 * reader hunting a chapter is doing arithmetic on the number, not
	 * scanning left to right. Wider rows scan worse, not better, which is
	 * why this is capped at all rather than filling every pixel available
	 * on a desktop — a 36-chapter book laid out 30-across would be one
	 * long strip to search.
	 */
	const MAX_CHAPTER_COLS = 10;
	const testaments = $derived([
		{ key: 'ot', books: books.filter((b) => b.order <= OT_BOOK_COUNT) },
		{ key: 'nt', books: books.filter((b) => b.order > OT_BOOK_COUNT) }
	]);

	// NOTHING IS OPEN UNTIL THE READER OPENS IT. This used to seed itself with
	// `currentOsis`, so arriving at a chapter rendered the ToC with that
	// book's chapter panel already floating over the page — a popover nobody
	// asked for, covering the text they came to read, on every single Bible
	// navigation. The highlight on `.book-btn.current` already says which book
	// they are in; the panel is a thing to open, not a thing to dismiss.
	let openOsis: string | undefined = $state();

	/**
	 * The three lengths the chapter grid is laid out with, in rem, mirrored
	 * from the custom properties `.chapters` declares. Both sides need them:
	 * CSS to place the columns, this file to work out how wide a given number
	 * of columns would be — which is what decides the panel's width, and
	 * which CSS cannot do on its own because it cannot count a book's
	 * chapters. Change one, change the other.
	 */
	const CHIP_REM = 2;
	const GAP_REM = 0.35;
	const PAD_REM = 0.5;

	/** Clearance kept between the panel and the viewport edge, on every side. */
	const MARGIN_REM = 1;

	/**
	 * Floor on the panel's width.
	 *
	 * The panel opens FROM its chip — same top, same inline start (see
	 * `measurePlacement`) — so it takes the chip's own width as a floor too,
	 * measured rather than assumed: a panel narrower than the box it covers
	 * would leave the chip sticking out either side of it, which is exactly
	 * what a 1-chapter book does to a 15rem chip like Martini's "Seconda
	 * lettera di Giovanni".
	 *
	 * This constant is the other floor, the one the TITLE needs. Eight rem is
	 * about nineteen characters of the title's size, and the names run past
	 * that (27 for the Giovanni above, 32 for his "Seconda lettera ai
	 * Tessalonicesi"), which is why the title wraps rather than truncates;
	 * the floor is what keeps that wrap to two lines rather than one word
	 * each. Mirrored by `.chapters`' `min-inline-size`, which is what applies
	 * if a measurement ever fails.
	 */
	const MIN_INLINE_REM = 8;

	/**
	 * Floor on the panel's height. A book near the bottom of a short viewport
	 * may leave less room than this; it gets this much anyway and runs past
	 * the fold, which the page scrolls to. A letterbox two rows tall would be
	 * worse than a panel you have to scroll the page for.
	 */
	const MIN_BLOCK_REM = 9;

	/**
	 * Where the open panel goes: its size and its offset from the book
	 * button, in pixels, decided from the DOM.
	 *
	 * Every number here comes from things that DO NOT depend on the panel —
	 * the button's position, the viewport, and the book's chapter count.
	 * That is the whole point of the rewrite. The previous version measured
	 * the RENDERED panel and then nudged it, which is only correct for as
	 * long as the width it measured stays true: the width was `100vw`-based
	 * and so recomputed itself on every resize, while the offset, measured
	 * once at open time, did not. A panel opened in a 574px window and left
	 * open while the window narrowed to 432px kept its old offset against its
	 * new width and hung off the right edge — two columns of chapters
	 * unreachable, and the document scrolling sideways. Deciding the width
	 * here means the offset can never be out of step with it, and `onresize`
	 * below redoes both together.
	 *
	 * `offsetPx` is `'grid'`'s coordinate — relative to `.book-item`'s own
	 * inline start, since that element is the `absolute` panel's containing
	 * block. `leftPx`/`topPx`/`bottomPx` are `'sidebar'`'s — measured against
	 * the viewport directly, since a `fixed` panel's containing block is the
	 * viewport regardless of where in the DOM it sits. Both variants share
	 * `inlinePx`/`blockPx`/`flip`, which don't depend on the positioning mode.
	 */
	interface Placement {
		/** Panel width, border-box — `box-sizing` is global (app.css). */
		inlinePx: number;
		/** Grid: how far to slide the panel back from the button's inline start to keep it on screen. Never positive. */
		offsetPx: number;
		/** Sidebar: the panel's left edge, in viewport pixels. */
		leftPx: number;
		/** Height cap. The panel scrolls internally past it. */
		blockPx: number;
		/** Open upward rather than downward, when that is where the room is. */
		flip: boolean;
		/** Sidebar, not flipped: the panel's top edge, in viewport pixels. */
		topPx: number;
		/** Sidebar, flipped: the panel's distance from the viewport's bottom edge, in pixels. */
		bottomPx: number;
	}

	let placement: Placement | null = $state(null);

	// `variant` is part of the id: the reading route mounts a `'panel'` and a
	// `'sidebar'` instance of this component AT THE SAME TIME, one hidden by
	// a CSS breakpoint rather than unmounted (`.reading-aside`/`.toc-menu`,
	// app.css), so a plain `book-btn-${osis}` would exist twice in the DOM —
	// and `getElementById` returns whichever comes first in source order,
	// hidden or not. On desktop that was the narrow-screen instance's
	// (CSS-`display:none`) button, whose `getBoundingClientRect()` is all
	// zeros — every sidebar panel opened anchored to the viewport's top-left
	// corner instead of its own button.
	function measurePlacement(osis: string): Placement | null {
		const item = document.getElementById(`book-btn-${variant}-${osis}`)?.closest('.book-item');
		if (!(item instanceof HTMLElement)) return null;
		const root = document.documentElement;
		const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
		// `clientWidth`/`clientHeight`, not `window.innerWidth`/`innerHeight`:
		// the window's numbers include the scrollbars. Sizing against those
		// (or against `100vw`, which has the same flaw) makes the panel a
		// scrollbar wider than the space it is trying to fit into — enough on
		// its own to put the page into horizontal scrolling.
		const viewW = root.clientWidth;
		const viewH = root.clientHeight;
		const margin = MARGIN_REM * rem;
		const rect = item.getBoundingClientRect();
		const cols = Math.min(MAX_CHAPTER_COLS, chapterCount(osis));

		// What `cols` columns would take, against what there is to give. The
		// trailing gap (`cols` gaps for `cols` columns, one more than sits
		// between them) is slack against sub-pixel rounding — see
		// `.chapters`' width comment.
		const wanted = (cols * (CHIP_REM + GAP_REM) + 2 * PAD_REM) * rem + 2;
		const floor = Math.max(MIN_INLINE_REM * rem, rect.width);
		// The viewport ceiling yields to the chip's width rather than the
		// other way round, so `inlinePx >= rect.width` holds unconditionally
		// — which is what the two clamps below rely on to be satisfiable at
		// once. A chip wider than the viewport less its margins is the only
		// case this changes, and there the margin is the wrong thing to keep.
		const inlinePx = Math.min(Math.max(wanted, floor), Math.max(viewW - 2 * margin, rect.width));

		// Anchored to the button's inline start, slid back only as far as
		// staying inside the margin requires — which is nothing at all for
		// most books, and the whole panel width for one opened from the far
		// right of a phone.
		const offsetPx = Math.max(
			rect.width - inlinePx,
			Math.min(0, viewW - margin - inlinePx - rect.left)
		);
		// Same idea, but as an absolute viewport coordinate rather than an
		// offset from the button: clamped on both edges, since a `fixed`
		// panel has no containing block of its own to inherit a safe left
		// bound from the way `'grid'`'s does.
		//
		// THE CHIP OUTRANKS THE MARGIN, in both of these. `MARGIN_REM` is
		// clearance from the viewport's edge, and a chip can sit closer to
		// that edge than the clearance asks for — the contents sheet insets
		// its book grid by 14px on a phone, inside this 18px. Clamping to the
		// margin alone then pushed the panel 4px to the RIGHT of the chip it
		// had opened from, and left a 4px stripe of accent fill showing down
		// the chip's edge. A panel that covers its chip is the whole design
		// (see `top: 0` in `.chapters`), so it may never begin after the chip
		// begins, nor end before the chip ends; the margin is what applies in
		// the slack between those.
		const leftPx = Math.min(
			rect.left,
			Math.max(rect.right - inlinePx, margin, Math.min(rect.left, viewW - margin - inlinePx))
		);

		// The room is measured from the chip's OWN edges, not from below and
		// above it, because the panel starts where the chip does: it opens
		// downward from the chip's top, or upward from the chip's bottom.
		const below = viewH - rect.top - margin;
		const above = rect.bottom - margin;
		const flip = below < above && below < MIN_BLOCK_REM * rem;
		return {
			inlinePx: Math.round(inlinePx),
			offsetPx: Math.round(offsetPx),
			leftPx: Math.round(leftPx),
			blockPx: Math.round(Math.max(flip ? above : below, MIN_BLOCK_REM * rem)),
			flip,
			topPx: Math.round(rect.top),
			bottomPx: Math.round(viewH - rect.bottom)
		};
	}

	// A DOM lookup by id rather than the triggering event: `openOsis` is what
	// this tracks, so anything that sets it — a click today, whatever sets it
	// tomorrow — measures through one code path rather than two that can fall
	// out of sync. Nothing here reads the panel, so it does not matter that
	// this runs before the panel has settled — or, for that matter, whether
	// the panel exists yet.
	$effect(() => {
		if (!openOsis) {
			placement = null;
			return;
		}
		placement = measurePlacement(openOsis);
	});

	function toggleBook(osis: string) {
		openOsis = openOsis === osis ? undefined : osis;
	}

	function closePanel() {
		openOsis = undefined;
	}

	// A chapter link is the one thing inside the panel that ENDS the reader's
	// business with it, and `onWindowClick` deliberately ignores clicks inside
	// `.book-item` — so without this the panel a reader picked Genesis 3 from
	// stays open on top of Genesis 3. Hung off the navigation rather than off
	// the anchor's own click, because those are not the same event: ⌘-click
	// and middle-click open a new tab and navigate nothing here, and closing
	// the picker in the tab the reader is still standing in would be the
	// opposite of what they asked for. `afterNavigate` also covers the ways
	// out that aren't a click at all — Enter on a focused chapter, back and
	// forward — and fires once on mount, where there is nothing open to close.
	afterNavigate(closePanel);

	// Out-of-flow panels don't dismiss by themselves the way an in-flow
	// disclosure did, so this takes the same window-level outside-click and
	// Escape handling as the header menus (AppearanceMenu et al.), in both
	// variants. Clicks inside `.book-item` are ignored: that covers both the
	// panel and its own book button, whose click handler already toggles —
	// true regardless of whether the panel renders `absolute` or `fixed`,
	// since both stay nested in the DOM under their `.book-item`.
	function onWindowClick(e: MouseEvent) {
		if (!openOsis) return;
		const target = e.target;
		if (target instanceof Node && (target as Element).closest?.('.book-item')) return;
		closePanel();
	}

	// `preventDefault` because this component is now rendered inside a modal
	// `<dialog>` too (`TocMenu`'s contents sheet), where Escape is ALSO the way
	// out of the sheet: without it one keystroke dismisses both, and a reader
	// closing a chapter panel loses the book list behind it. A prevented
	// keydown is what suppresses the browser's close request; where a browser
	// declines to honour that, the outcome is the one this replaces.
	function onWindowKeydown(e: KeyboardEvent) {
		if (!openOsis || e.key !== 'Escape') return;
		e.preventDefault();
		closePanel();
	}

	// A resize (or a phone rotating, or a browser zoom step) changes every
	// input to `measurePlacement`. Redo it rather than leave a panel placed
	// for a viewport that no longer exists — the failure this replaces was
	// exactly that, a panel still anchored for a window 140px wider than the
	// one it was now hanging out of.
	function onWindowResize() {
		if (!openOsis) return;
		placement = measurePlacement(openOsis);
	}

	// The same correction for the other way an anchor moves under a panel that
	// was placed against the viewport. `'grid'` is excluded rather than merely
	// left harmless: its panel is `absolute` inside `.book-item`, so it is
	// already carried along by whatever scrolled, and re-measuring would be
	// work done on every scroll event of every page this component sits on.
	function onWindowScroll() {
		if (!openOsis || !floating) return;
		placement = measurePlacement(openOsis);
	}

	/**
	 * The panel's inline styles.
	 *
	 * `--chapter-cols` is the column count this book is worth asking for; the
	 * CSS turns it into a width, and is the only thing that applies before
	 * `placement` exists — during SSR, on the first frame, and for a reader
	 * with no JavaScript. Everything else here is `placement`, which
	 * supersedes that CSS with numbers measured against the real viewport.
	 *
	 * The variants diverge only in WHICH coordinates they emit: `'grid'`'s
	 * `absolute` panel takes `inset-inline-start` relative to `.book-item`;
	 * a `fixed` panel takes an absolute `inset-inline-start` plus a `top` or
	 * `bottom`, since it has no containing block of its own to measure
	 * against.
	 */
	function panelStyle(book: CanonicalBook): string {
		const decls = [`--chapter-cols: ${Math.min(MAX_CHAPTER_COLS, book.chapters.length)}`];
		if (placement) {
			decls.push(`inline-size: ${placement.inlinePx}px`, `max-block-size: ${placement.blockPx}px`);
			if (variant === 'grid') {
				decls.push(`inset-inline-start: ${placement.offsetPx}px`);
			} else {
				decls.push(`inset-inline-start: ${placement.leftPx}px`);
				decls.push(
					placement.flip ? `bottom: ${placement.bottomPx}px` : `top: ${placement.topPx}px`
				);
			}
		}
		return decls.join('; ');
	}

	function chapterCount(osis: string): number {
		return books.find((b) => b.osis === osis)?.chapters.length ?? MAX_CHAPTER_COLS;
	}

	function bookName(book: CanonicalBook): string {
		return book.namesByWorkId[workId] ?? Object.values(book.namesByWorkId)[0] ?? book.osis;
	}

	/** Chapter numbers this specific edition actually has for a book — may be a
	 * subset of the canonical union (both v1 editions are 73/73 complete, but
	 * this must not assume that stays true). */
	function chaptersInEdition(osis: string): Set<number> {
		const ns = new Set(getBook(workId, osis)?.chapters.map((c) => c.n) ?? []);
		// Chapter 0 is the book's introduction, and belongs to the reader's
		// LANGUAGE rather than to their edition (`corpus.ts`, "Book
		// introductions"). A language without one leaves the 0 in the grid
		// greyed, which is the same thing the grid already says about a chapter
		// this edition happens not to carry.
		if (hasIntroForWork(workId, osis)) ns.add(0);
		return ns;
	}
</script>

<!-- Scroll in the CAPTURE phase, because a `scroll` event does not bubble:
     the two `fixed` variants are anchored to a button inside a scroll box of
     their own (`.reading-aside`, `.sheet-body`), and a panel measured against
     the viewport does not follow that box when it scrolls. Capturing is what
     lets one window listener hear a descendant's scroll — and `onWindowScroll`
     is a no-op for `'grid'`, whose `absolute` panel scrolls with its own
     anchor and has nothing to correct. -->
<svelte:window
	onclick={onWindowClick}
	onkeydown={onWindowKeydown}
	onresize={onWindowResize}
	onscrollcapture={onWindowScroll}
/>

{#snippet groups()}
	{#each testaments as group (group.key)}
		<section class="testament">
			<h3 class="label-micro">{t(`bible.testament.${group.key}`)}</h3>
			<ul class="book-grid" class:sidebar={variant === 'sidebar'}>
				{#each group.books as book (book.osis)}
					{@const isOpen = openOsis === book.osis}
					<li class="book-item" class:open={isOpen}>
						<button
							type="button"
							id={`book-btn-${variant}-${book.osis}`}
							class="book-btn"
							class:sidebar={variant === 'sidebar'}
							class:current={book.osis === currentOsis}
							class:open={isOpen}
							title={variant === 'sidebar' ? bookName(book) : undefined}
							aria-current={book.osis === currentOsis ? 'true' : undefined}
							aria-expanded={isOpen}
							aria-controls={`chapters-${variant}-${book.osis}`}
							onclick={() => toggleBook(book.osis)}
						>
							<span>{bookName(book)}</span>
						</button>
						{#if isOpen}
							{@render chapterPanel(book)}
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
{/snippet}

{#snippet chapterPanel(book: CanonicalBook)}
	{@const present = chaptersInEdition(book.osis)}
	{@const titleId = `chapters-title-${variant}-${book.osis}`}
	<div
		id={`chapters-${variant}-${book.osis}`}
		class="chapters panel-surface"
		class:floating
		class:flip={placement?.flip}
		style={panelStyle(book)}
		role="group"
		aria-labelledby={titleId}
		data-link-preview="off"
	>
		<!-- The book's name, where the chip's own label was a moment ago —
		     the panel covers the chip it opened from, so this heading is the
		     only thing naming it, and putting it in the chip's place is what
		     makes the panel read as that chip expanding.

		     A BUTTON and not a bare heading, because the chip underneath is
		     the thing that closes the panel and a covered chip cannot be
		     clicked. Keyboard readers never lost it — focus stays on the
		     chip, so Enter still toggles — but a pointer had nothing to
		     press, and outside-click/Escape are the way out of a popover, not
		     the way out of a disclosure you have just opened. -->
		<h4 class="chapters-title">
			<button type="button" id={titleId} onclick={() => toggleBook(book.osis)}>
				{bookName(book)}
			</button>
		</h4>
		<div class="chapters-nums">
			{#each book.chapters as chapterN (chapterN)}
				{#if present.has(chapterN)}
					<a
						href={hrefFor({ kind: 'bible', osis: book.osis, chapter: chapterN })}
						class:current={book.osis === currentOsis && chapterN === currentChapter}
						title={chapterN === 0 ? t('bible.introduction') : undefined}
					>
						{chapterN}
					</a>
				{:else}
					<span
						class="unavailable"
						title={chapterN === 0 ? t('bible.introUnavailable') : t('bible.chapterUnavailable')}
					>
						{chapterN}
					</span>
				{/if}
			{/each}
		</div>
	</div>
{/snippet}

{#if variant !== 'grid'}
	<!-- Always open — see the docblock's "collapsible is ignored" note. -->
	<div
		class="picker-body"
		class:sidebar={variant === 'sidebar'}
		class:panel={variant === 'panel'}
		data-link-preview="off"
	>
		{@render groups()}
	</div>
{:else if collapsible}
	<details class="picker">
		<summary>{t('bible.pickBook')}</summary>
		<div class="picker-body" data-link-preview="off">
			{@render groups()}
		</div>
	</details>
{:else}
	<div class="picker-body standalone" data-link-preview="off">
		{@render groups()}
	</div>
{/if}

<style>
	.picker {
		margin: 1rem 0;
		font-size: 0.9rem;
	}

	.picker summary {
		cursor: pointer;
		color: var(--color-accent);
	}

	.picker-body {
		margin-top: 0.75rem;
	}

	.picker-body.standalone {
		font-size: 0.95rem;
	}

	/* No top margin in the sheet: `.sheet-head` and `.sheet-body`'s own padding
	   (app.css) already set this list off from the panel's title. The margin
	   the other forms carry is what separates them from the text or the
	   `<summary>` above them, and neither is there. */
	.picker-body.panel {
		margin-top: 0;
	}

	/* The sidebar copy lives inside `.reading-aside`, already at 0.9rem
	   (app.css) — no further size change needed here, only the layout
	   changes below. */

	.testament + .testament {
		margin-top: 1.5rem;
	}

	/* A label the picker prints over a group of books, not a title from the
	   text — hence `.label-micro` (styles/components.css), which is what
	   "ours, not the corpus's" is set as everywhere. Only the margin is this
	   picker's own. */
	.testament h3 {
		margin: 0 0 0.5rem;
	}

	/* The other two numbers in `.book-btn.sidebar`'s arithmetic: about 20px of
	   the list's height is the space around these two headings, and only this
	   variant is short of it. `/scriptura`'s grid and the contents sheet have
	   the room and keep the looser setting. */
	.picker-body.sidebar .testament + .testament {
		margin-top: 1rem;
	}

	.picker-body.sidebar .testament h3 {
		margin-bottom: 0.35rem;
	}

	.book-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: flex-start;
	}

	/* A WRAPPED GRID, not the single column this used to be. 73 books in one
	   column is a long scroll to find anything; the same 73 as chips wrap
	   into a handful of rows the eye can scan at once, which is the whole
	   reason the non-sidebar picker has always been a grid.

	   Safe with an in-DOM chapter panel per book because that panel is OUT OF
	   FLOW (`position: fixed`, below) regardless of where in the grid it
	   lives — opening a book cannot push its siblings around when nothing is
	   inserted into the grid's own layout. `auto-fill` with a `minmax` floor
	   rather than a fixed column count: the aside is 17rem at most widths but
	   wider layouts exist, and the right number of columns is whatever
	   fits. */
	/*
	 * FOUR COLUMNS, AND THE COUNT IS PINNED RATHER THAN FITTED.
	 *
	 * It was `auto-fill` with a 4.5rem floor, which resolved to three in this
	 * 17rem column — 25 rows for the 73 books. Four is 19 rows, and it is what
	 * the names can stand: a cell is about 74px, of which 61 is text, or eight
	 * to nine characters of the 0.8rem sans. "Gênesis", "Números", "Salmos"
	 * and most of the New Testament set whole; "Deuteronômio" and "Cântico dos
	 * Cânticos" truncate, which the chip's `title` answers while a reader is
	 * scanning and `.chapters-title` answers for the book they open.
	 *
	 * PINNED rather than fitted because four is a decision about how tall the
	 * list may be, and `auto-fill` decides that from a floor it is not being
	 * told about — it answered three here, for 25 rows. `minmax(0, 1fr)` and
	 * no floor: with the count fixed, a floor's only remaining job would be
	 * to force an overflow.
	 */
	.book-grid.sidebar {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		/* Tighter than the wrapped grid's 0.4rem, and tighter again since
		   2026-08-29 — see `.book-btn.sidebar`, which is where the whole
		   arithmetic of making 73 books fit a screen is written down. */
		gap: 0.2rem;
	}

	/* THE OPEN BOOK SHOWED ITS WHOLE NAME BY GROWING OUT OF ITS CELL until
	   2026-08-29 — `max-content` with a `100%` floor, capped at
	   `--aside-width`, and a `:nth-child(4n)` rule to send the last column's
	   growth the other way. It answered the right question (four columns
	   truncate, and the book a reader has just opened is the one they may
	   need to read) in the wrong place: a chip that changes width on click is
	   a second thing moving, and the panel that opens over it has room to
	   print the name where the chip could only widen towards it.
	   `.chapters-title` is where that name goes now, and this rule and its
	   `nth-child` companion are gone rather than kept alongside it — with the
	   panel covering the chip, a grown chip would not even be visible. */

	/* Positioning context for the `absolute` `.chapters` panel in the `'grid'`
	   variant. Irrelevant to `'sidebar'`'s `fixed` panel, which is positioned
	   against the viewport regardless of this — harmless to share the class
	   between both rather than needing a second one that only differs by
	   this line. */
	.book-item {
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.book-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text);
		padding: 0.35rem 0.55rem;
		font-size: 0.85rem;
		font-family: inherit;
		cursor: pointer;
		min-height: 2.1rem;
	}

	/* THE ONLY FEEDBACK 73 BUTTONS HAD WAS THE CURSOR. A book chip is a
	   target a reader picks out of a dense grid, and until now nothing
	   answered the pointer at all — on a grid this size that reads as a
	   printed table rather than as something to click.

	   The border does the answering, not a fill: these chips already spend
	   their background on state (`.open` fills, `.current` outlines), so a
	   hover fill would be a fourth thing competing with the two that carry
	   meaning. `.prayers-chip` on the home page states the same hover in the
	   same two properties, and this is deliberately a copy of it rather than
	   a second idea.

	   `:not(.open)` rather than source order: the open book is already
	   filled with the accent, and hovering it must not paint an accent
	   border around an accent fill. `.current` is left to hover normally —
	   its accent border is what hover would set anyway, so what changes
	   under the pointer is just the label's weight of colour. */
	.book-btn:not(.open):hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	/*
	 * Fills its grid cell and centres, rather than the full-width row this
	 * was when the sidebar list ran vertically. Long names (1 Thessalonians)
	 * are clipped rather than allowed to widen the whole track — the button
	 * carries a `title` for the full name.
	 *
	 * COMPACT BECAUSE THE COLUMN IS 950px AND THE LIST WAS 1,060 (2026-08-29).
	 * 46 Old Testament books in three columns is 16 rows and the New Testament
	 * 9 more; at the 1.9rem chip and 0.25rem gap this carried, that plus two
	 * headings came to about 1,060px against the roughly 950 a 1080p viewport
	 * leaves `.reading-aside` (`100vh` less the chrome and 3rem, layout.css).
	 * So the aside opened already scrolled on the commonest desktop there is,
	 * and a scrollbar down a table of contents reads as more of it hidden than
	 * there is. Five numbers came down together — this chip's block padding
	 * and height, the grid's gap, and the two around a testament's heading —
	 * taking the row pitch from about 39px to 33 and the list to about 905,
	 * which fits with room rather than only just.
	 *
	 * (Every px here is at a 1rem of 18: `base.css` lifts the root to 112.5%
	 * of the browser's own default. A reader who has raised that default gets
	 * proportionally more of everything, this column included, and may scroll
	 * again — which is the right outcome, since it is their setting.)
	 *
	 * WHAT DID NOT COME DOWN IS THE TEXT: 0.8rem is unchanged, and the height
	 * is now the line box's rather than a floor's. `display: block` centres
	 * nothing vertically, so a `min-height` above the content's own height
	 * seats the label high in its chip — already true at 1.9rem, which put
	 * 34.2px of box around a 30px line, and tightening the padding alone
	 * would only have made it plainer. Sizing the box from `line-height`
	 * instead puts the label in the middle of it by construction, and
	 * `min-height` stays a floor rather than the height: 1.6rem is 28.8px,
	 * comfortably over the 24px minimum target size WCAG 2.5.8 asks for, and
	 * this variant is desktop-only anyway (`.reading-aside` is hidden below
	 * 80rem).
	 *
	 * IT ALSO WIDENS THE CHIPS, which is the second thing a scrollbar was
	 * costing: an aside that no longer scrolls has no scrollbar in it, and
	 * that is about 15px of the 306 this column has — a character and a half
	 * of every truncated name, given back for nothing.
	 */
	.book-btn.sidebar {
		width: 100%;
		justify-content: center;
		padding: 0.15rem 0.25rem;
		font-size: 0.8rem;
		line-height: 1.55;
		min-height: 1.6rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		display: block;
		text-align: center;
	}

	.book-btn.current {
		border-color: var(--color-accent);
		color: var(--color-accent);
		font-weight: 600;
	}

	/* Carries the open state that the chevrons used to. Filled rather than
	   merely outlined so it reads as "this is the one the panel belongs to"
	   even against `.current`'s accent border on a neighbouring book.

	   A reader sees this only for the frame between the click and the
	   measurement, since the panel then covers the chip exactly — see
	   `.chapters`' `top: 0`. It stays because the state is real whether or
	   not something is painted over it, and because that frame is the one
	   where a chip that had not visibly changed would read as a dead click. */
	.book-btn.open {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	/* Out of flow: opening a book must not move the 73-button grid behind it.
	   A 1-chapter book like 2/3 John renders narrow, not force-padded to some
	   arbitrary floor, and no book ever exceeds the viewport width — which is
	   what guarantees the start/end anchor math in the script always has at
	   least one edge that fits. (It does take two floors, neither of them
	   arbitrary: the panel prints the book's name, and it covers the chip it
	   opened from. See `MIN_INLINE_REM`.)

	   WIDTH COMES FROM THE SPACE AVAILABLE, not from a constant. The fixed
	   `22rem` cap this replaces was the reason a 36-chapter book like Numbers
	   rendered seven narrow columns and six rows on a screen with room for
	   ten and four: the cap had no idea how much room there was, so it
	   imposed the same ceiling on a phone and a desktop.

	   The `min()` below is the STARTING POINT, not the final answer: it is
	   what applies during SSR, on the first frame, and for a reader with no
	   JavaScript — `--chapter-cols` columns or the viewport, whichever is
	   smaller. `measurePlacement` then overrides `inline-size`,
	   `max-block-size` and the panel's offset together, with numbers that
	   also account for WHERE the button is, which CSS cannot see. (Note that
	   `100vw` here counts the scrollbar and the measured version does not;
	   the 1rem margin absorbs the difference.)

	   A DEFINITE `inline-size` is also load-bearing for two separate reasons,
	   both of which end in the same one-chapter-per-row collapse:

	   1. An out-of-flow box with `width: auto` shrink-fits against its
	      CONTAINING BLOCK — for `'grid'`'s `absolute` panel that's
	      `.book-item`, the `<li>`, no wider than the button itself; for
	      `'sidebar'`'s `fixed` panel it's the viewport, which is wide but
	      still not the number this formula wants to reach. (This is what
	      `inline-size: max-content` used to work around; a definite width
	      sidesteps it either way, since the containing block never enters
	      the calculation.)
	   2. `auto-fit` in `.chapters-nums` below resolves to a SINGLE track when
	      the available inline size is indefinite — which `max-content` is.

	   So the two rules are a pair: the panel resolves a real width against
	   the viewport, and the grid inside it fills that width. Shared by both
	   variants — only the POSITIONING properties below differ. */
	.chapters {
		/* Mirrors of the chip's minimum box, the grid gap and this panel's own
		   padding, so the width arithmetic cannot drift from the thing it is
		   sizing. Each is used by exactly one other rule below. */
		--chapter-chip: 2rem;
		--chapter-gap: 0.35rem;
		--chapter-pad: 0.5rem;
		position: absolute;
		/* ON the button, not under it: the panel's top-left corner is the
		   chip's, so it opens out of the chip rather than beside it, and its
		   title lands where the chip's label was. `measurePlacement` says the
		   same thing in viewport coordinates for the two `fixed` variants. */
		top: 0;
		inset-inline-start: 0;
		z-index: 20;
		padding: var(--chapter-pad);
		/* A `.panel-surface` (styles/components.css) on the ELEVATED ground
		   rather than the page's, which is the one thing this panel does not
		   share with the others: it hangs off a book chip that is itself
		   elevated, and matching it reads as that button opening rather than
		   as a card arriving over the page. Its corner was 0.35rem against
		   every other panel's 0.5 until 2026-08-28, which was not a decision
		   anyone made and is now the shared one. */
		background: var(--color-bg-elevated);
		/* One gap MORE than the columns strictly need (n chips have n-1 gaps
		   between them), as slack: it guarantees `auto-fit` resolves to
		   exactly `--chapter-cols` tracks rather than losing the last one to
		   sub-pixel rounding, and is too little — one gap — to let an extra
		   track in. */
		inline-size: min(
			calc(
				var(--chapter-cols, 10) * (var(--chapter-chip) + var(--chapter-gap)) + 2 *
					var(--chapter-pad)
			),
			calc(100vw - 2rem)
		);
		/* `MIN_INLINE_REM`'s title floor, stated again for the one case the
		   measurement cannot cover: a panel that got no `placement` at all.
		   (The chip-width floor beside it has no CSS twin — nothing here can
		   see the chip.) `min-inline-size` beats `inline-size` either way, so
		   the two can only agree. */
		min-inline-size: min(8rem, calc(100vw - 2rem));
		/* Psalms is 150 chapters — 15 rows even at the full column count, far
		   taller than a phone. Scroll inside the panel rather than run it off
		   the bottom of the screen. */
		max-block-size: 60vh;
		overflow-y: auto;
	}

	/* Opens upward instead of downward, for a book low enough on the screen
	   that there is more room above it than below. Which way round is
	   `measurePlacement`'s call — this is only the two anchors, and only
	   applies to `'grid'`: the floating variants set `top`/`bottom` directly
	   as an inline style instead (`panelStyle`), since a `fixed` panel's flip
	   has no shared `100%` reference to offset from. */
	.chapters.flip {
		top: auto;
		bottom: 0;
	}

	/* `position: fixed` instead of `'grid'`'s `absolute`, and a viewport-
	   absolute `top`/`bottom`/`inset-inline-start` (set inline by
	   `panelStyle`, from `measurePlacement`'s `leftPx`/`topPx`/`bottomPx`)
	   instead of an offset from `.book-item`.

	   `.reading-aside` and `.sheet-body` (both app.css) are each their own
	   `overflow-y: auto` scroll container, which clips anything `absolute`
	   the moment it escapes that box — exactly what a chapter panel wider
	   than the 17rem column, or than the 22rem card the contents sheet
	   becomes above 48rem, needs to do for most books. `fixed` doesn't have
	   that problem: its containing block is the viewport, not the nearest
	   scrolling ancestor, so the panel floats over the page instead of being
	   cut off at its host's edge. (Confirmed nothing between here and the
	   viewport sets `transform`, `filter`, `contain` or `will-change` — any
	   of those would re-capture a `fixed` descendant into a containing block
	   of their own instead of the viewport, and quietly reintroduce the
	   clipping this is meant to avoid. That includes the sheet: `.sheet` and
	   `.sheet-panel` set position and flex and nothing else. A `<dialog>`
	   opened with `showModal()` is in the TOP LAYER, which is a stacking
	   context but not a containing block for fixed descendants — so the panel
	   is positioned against the viewport and painted above the page.)

	   `top`/`bottom`/`inset-inline-start` are left `auto` here rather than
	   given a CSS fallback the way `'grid'`'s are: a `fixed` box with no
	   inset properties renders at its normal in-flow ("static") position, so
	   for the brief span before `measurePlacement` has run the panel sits
	   where it always used to — anchored under its own button — rather than
	   at some nonsensical position computed from a `calc(100%, …)` that
	   would resolve against the viewport instead of `.book-item` once
	   `position` is `fixed`. */
	.chapters.floating {
		position: fixed;
		top: auto;
		bottom: auto;
		inset-inline-start: auto;
		z-index: 50;
	}

	/*
	 * THE PANEL'S TITLE IS THE CHIP'S LABEL, CONTINUED.
	 *
	 * The panel covers the chip it opened from, so nothing else names the
	 * book any more — and in the sidebar nothing else COULD, since four
	 * columns of a 17rem aside truncate most names (`.book-btn.sidebar`).
	 * Setting it in the accent is what the chip does when open, kept rather
	 * than dropped: the panel takes over the chip's job of saying "this is
	 * the book you are in", and it should look like it.
	 *
	 * IT WRAPS RATHER THAN TRUNCATES: a truncated title would be the defect
	 * it exists to answer, one level down. Names run to 32 characters
	 * (Martini's "Seconda lettera ai Tessalonicesi") against a panel whose
	 * width is otherwise decided by the chapter grid below, so two lines are
	 * a normal outcome and `MIN_INLINE_REM` is what keeps them to two.
	 *
	 * The rule under it is the panel's own, not a heading's underline: it
	 * separates a name from the numbers it labels, which are the only other
	 * thing in the box.
	 */
	.chapters-title {
		margin: 0 0 0.4rem;
		padding-block-end: 0.3rem;
		border-block-end: 1px solid var(--color-border);
	}

	/* An unstyled button, because what closes the panel is the whole title
	   line and not a target hidden inside it — the chip it replaced was
	   clickable across its whole face too. `text-align: start` because a
	   button centres its label by default and this one is a heading. */
	.chapters-title button {
		display: block;
		inline-size: 100%;
		padding: 0;
		border: 0;
		background: none;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		line-height: 1.3;
		text-align: start;
		color: var(--color-accent);
		cursor: pointer;
	}

	/* The chapter numbers. This used to be `.chapters` itself; it moved down
	   a level when the panel first had a heading, so the heading wasn't laid
	   out as if it were a chapter chip — which is again the reason it is a
	   level down, now that `.chapters-title` above is back.

	   A GRID rather than the wrapped flex row it was, because a wrapped row
	   only lines its chips up by accident — as soon as one chip is wider than
	   the rest (a three-digit Psalm), every row below it stops aligning, and
	   a reader scanning down a column of tens loses the column. `auto-fit`
	   also puts the column count where it belongs: however many fit the width
	   `.chapters` resolved, so a narrow phone quietly gets fewer without a
	   media query or a second pass of measuring in JS. `1fr` then shares the
	   slack out evenly instead of leaving it all at the end of each row. */
	.chapters-nums {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(var(--chapter-chip, 2rem), 1fr));
		gap: var(--chapter-gap, 0.35rem);
	}

	.chapters a,
	.chapters .unavailable {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: var(--chapter-chip, 2rem);
		min-height: 2rem;
		padding: 0.1rem 0.3rem;
		border-radius: var(--radius-sm);
		text-decoration: none;
		font-variant-numeric: tabular-nums;
	}

	.chapters a.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	.chapters .unavailable {
		color: var(--color-text-muted);
		opacity: 0.4;
		cursor: default;
	}
</style>
