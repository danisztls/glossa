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
	 * The chapter grid is an ABSOLUTELY-POSITIONED panel anchored to its book
	 * button, not an in-flow block — but ONLY in the `'grid'` variant (see
	 * `variant` below). In flow, on a wrapped flex grid, opening a book
	 * mid-grid pushed every later book onto new lines and the whole list
	 * jumped under the reader's cursor — the book they were aiming at moved
	 * before they clicked it. Out of flow, opening a panel changes nothing
	 * about the grid behind it.
	 *
	 * Two consequences of leaving the flow, both handled below and BOTH
	 * SCOPED TO THE GRID VARIANT ONLY: the panel can overhang the viewport's
	 * right edge for books near it (hence `align`, measured at open time
	 * rather than guessed from column position, since the grid wraps at a
	 * width nobody here knows statically), and it no longer dismisses by
	 * re-clicking alone, so it takes the same outside-click/Escape handling
	 * as the header menus.
	 *
	 * There are deliberately NO chevron indicators on the book buttons.
	 * `aria-expanded` carries the state for assistive tech, and sighted
	 * readers get it from the open panel itself plus the button's own active
	 * styling — a caret pointing at a panel already occupying the space below
	 * it is redundant, and at 73 buttons the glyphs were most of the grid's
	 * visual noise.
	 *
	 * TWO VARIANTS, because the reflow problem above only exists in ONE of
	 * the two places this component is used. `'grid'` (default) is
	 * everything described so far — a wrapped flex grid of book buttons with
	 * an absolutely-positioned popover — used by the `/scriptura` landing route
	 * and by the reading view's mobile/collapsed picker. `'sidebar'` is for
	 * the reading view's desktop right column (`.reading-aside`, app.css).
	 * It keeps the wrapped grid of books — 73 books as chips wrap into a few
	 * scannable rows, where a single column of 73 is a long scroll to find
	 * anything — and moves the chapter panel OUT of the open book's list item
	 * to sit in flow AFTER the whole grid.
	 *
	 * That placement is what makes the two changes compatible. An in-flow
	 * panel inside a wrapped grid would re-create exactly the defect the
	 * popover was invented for (opening a book mid-grid reflows every later
	 * book, and the one the reader was aiming at moves out from under the
	 * cursor). Hanging it off the end of the grid instead means nothing is
	 * inserted into the grid at all, so the grid cannot reflow — while the
	 * panel itself is an ordinary block that needs none of the popover's
	 * machinery. It does have to name its own book, since it is no longer
	 * adjacent to the button that opened it.
	 *
	 * The popover would not have worked here anyway: `.reading-aside` is
	 * `overflow-y: auto` (a scroll container, so it clips anything escaping
	 * its box) and 17rem wide, against the popover's 22rem
	 * `PANEL_WIDTH_REM`. The `align`/outside-click/Escape machinery above is
	 * therefore skipped entirely for `'sidebar'` — nothing needs measuring or
	 * force-dismissing when there is no popover to overhang the viewport or
	 * fail to self-dismiss.
	 *
	 * (The sidebar variant was briefly a single-column vertical list, which
	 * is what made an in-flow panel trivially safe. It was worse to use, and
	 * this is the version that keeps the grid's scannability without giving
	 * the reflow back.)
	 *
	 * `collapsible` is ignored when `variant === 'sidebar'`: the sidebar is
	 * the reading view's persistent nav column, so it always renders open
	 * and browsable rather than behind a `<summary>` — the reading route
	 * that uses it renders TWO instances (one `'grid'`/collapsible, hidden
	 * above the desktop breakpoint; one `'sidebar'`, hidden below it) rather
	 * than switching one instance's variant at runtime, so a reader with no
	 * JavaScript still gets the right one on first paint and nothing ever
	 * has to relocate itself across the page after the fact.
	 */
	import { untrack } from 'svelte';
	import { getBook, listCanonicalBooks, type CanonicalBook } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** Which edition's book NAMES to show. No longer affects link targets — those are edition-free. */
		currentWorkId: string;
		/** Omit on the landing route, where there is no "current" chapter to highlight. */
		currentOsis?: string;
		currentChapter?: number;
		collapsible?: boolean;
		/** `'grid'` (default): wrapped flex grid + anchored popover, as
		    documented above. `'sidebar'`: wrapped grid too, but with the
		    chapter panel in flow after the grid, for `.reading-aside`. */
		variant?: 'grid' | 'sidebar';
	}

	let {
		currentWorkId,
		currentOsis,
		currentChapter,
		collapsible = true,
		variant = 'grid'
	}: Props = $props();

	const workId = $derived(currentWorkId);
	const books = listCanonicalBooks();

	/** 46 OT + 27 NT = 73, in that fixed order — docs/corpus-schema.md "Canonical book order". */
	const OT_BOOK_COUNT = 46;
	const testaments = $derived([
		{ key: 'ot', books: books.filter((b) => b.order <= OT_BOOK_COUNT) },
		{ key: 'nt', books: books.filter((b) => b.order > OT_BOOK_COUNT) }
	]);

	// Default-open the reader's current book (if any) so arriving at a
	// chapter with the picker expanded shows that book's chapters already.
	// `untrack` makes explicit that only the INITIAL `currentOsis` seeds this
	// — the picker's open/closed state is then user-driven, not re-synced
	// every time the prop changes (e.g. navigating to a new chapter of the
	// same book shouldn't collapse an unrelated book the reader opened).
	let openOsis: string | undefined = $state(untrack(() => currentOsis));

	/**
	 * Which edge of the book button the open panel is anchored to. The panel
	 * is ~22rem wide and the book grid runs the full content column, so a book
	 * in the last column would push a start-anchored panel off-screen.
	 * Measured from the real button rect when the panel opens — the grid wraps
	 * at whatever the viewport allows, so "is this book near the right edge"
	 * has no static answer.
	 */
	let align: 'start' | 'end' = $state('start');

	/** Matches `.chapters`' `max-inline-size` below; keep the two in step. */
	const PANEL_WIDTH_REM = 22;

	function toggleBook(osis: string, e: MouseEvent) {
		if (openOsis === osis) {
			openOsis = undefined;
			return;
		}
		// Edge-overhang measurement only matters for the popover — the
		// sidebar's in-flow panel is always the same width as the column it
		// already lives in, so there's nothing to measure or flip.
		if (variant === 'grid') {
			const btn = e.currentTarget;
			if (btn instanceof HTMLElement) {
				const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
				const rect = btn.getBoundingClientRect();
				// Flip to end-anchored only when start-anchored would actually
				// overflow, so the common case keeps the panel's left edge lined up
				// with the button the reader just pressed.
				align = rect.left + PANEL_WIDTH_REM * rem > window.innerWidth ? 'end' : 'start';
			}
		}
		openOsis = osis;
	}

	function closePanel() {
		openOsis = undefined;
	}

	// Out-of-flow panels don't dismiss by themselves the way an in-flow
	// disclosure did, so this takes the same window-level outside-click and
	// Escape handling as the header menus (ThemeMenu et al.). Clicks inside
	// `.book-item` are ignored: that covers both the panel and its own book
	// button, whose click handler already toggles.
	//
	// GRID VARIANT ONLY, guarded inside the handlers rather than by
	// conditionally rendering `<svelte:window>` — Svelte doesn't allow that
	// tag inside a block, so it's always mounted and opts itself out instead.
	// The sidebar's panel is in flow, so re-clicking its own book (or
	// clicking a different one, which reassigns `openOsis`) is already
	// sufficient to close it; there's no popover sitting over other content
	// that needs a forced dismiss.
	function onWindowClick(e: MouseEvent) {
		if (variant !== 'grid' || !openOsis) return;
		const target = e.target;
		if (target instanceof Node && (target as Element).closest?.('.book-item')) return;
		closePanel();
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (variant === 'grid' && openOsis && e.key === 'Escape') closePanel();
	}

	function bookName(book: CanonicalBook): string {
		return book.namesByWorkId[workId] ?? Object.values(book.namesByWorkId)[0] ?? book.osis;
	}

	/** Chapter numbers this specific edition actually has for a book — may be a
	 * subset of the canonical union (both v1 editions are 73/73 complete, but
	 * this must not assume that stays true). */
	function chaptersInEdition(osis: string): Set<number> {
		return new Set(getBook(workId, osis)?.chapters.map((c) => c.n) ?? []);
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

{#snippet groups()}
	{#each testaments as group (group.key)}
		<section class="testament">
			<h3>{t(`bible.testament.${group.key}`)}</h3>
			<ul class="book-grid" class:sidebar={variant === 'sidebar'}>
				{#each group.books as book (book.osis)}
					{@const isOpen = openOsis === book.osis}
					<li class="book-item">
						<button
							type="button"
							class="book-btn"
							class:sidebar={variant === 'sidebar'}
							class:current={book.osis === currentOsis}
							class:open={isOpen}
							aria-expanded={isOpen}
							aria-controls={`chapters-${book.osis}`}
							onclick={(e) => toggleBook(book.osis, e)}
						>
							<span>{bookName(book)}</span>
						</button>
						{#if isOpen && variant === 'grid'}
							{@render chapterPanel(book)}
						{/if}
					</li>
				{/each}
			</ul>
			<!-- SIDEBAR VARIANT: the open book's chapters render BELOW the whole
			     grid, not inside the book's own list item.

			     This is what lets the sidebar keep the wrapped grid of books
			     rather than the vertical list it used to have. A grid of 73
			     books is far quicker to scan than a 73-row column, but an
			     in-flow panel inside a wrapped grid re-runs the original
			     problem the popover was invented for: opening a book mid-grid
			     pushes every later book onto a new line, and the book someone
			     was aiming at moves out from under their cursor.

			     Hanging the panel off the end of the grid resolves both at
			     once — the grid above it never reflows, because nothing was
			     inserted into it, and the panel is a plain block in normal
			     flow, so it needs none of the popover's measuring, clipping
			     or outside-click machinery inside a scrolling aside. -->
			{#if variant === 'sidebar'}
				{@const openBook = group.books.find((b) => b.osis === openOsis)}
				{#if openBook}
					{@render chapterPanel(openBook)}
				{/if}
			{/if}
		</section>
	{/each}
{/snippet}

{#snippet chapterPanel(book: CanonicalBook)}
	{@const present = chaptersInEdition(book.osis)}
	<div
		id={`chapters-${book.osis}`}
		class="chapters"
		class:sidebar={variant === 'sidebar'}
		class:align-end={variant === 'grid' && align === 'end'}
		role="group"
		aria-label={bookName(book)}
		data-link-preview="off"
	>
		<!-- The sidebar's panel is detached from the button that opened it, so
		     it names its own book; the grid variant's popover is anchored to
		     that button and would only be repeating it. -->
		{#if variant === 'sidebar'}
			<p class="chapters-book">{bookName(book)}</p>
		{/if}
		<div class="chapters-nums">
			{#each book.chapters as chapterN (chapterN)}
				{#if present.has(chapterN)}
					<a
						href={`/scriptura/${book.osis}/${chapterN}`}
						class:current={book.osis === currentOsis && chapterN === currentChapter}
					>
						{chapterN}
					</a>
				{:else}
					<span class="unavailable" title={t('bible.chapterUnavailable')}>
						{chapterN}
					</span>
				{/if}
			{/each}
		</div>
	</div>
{/snippet}

{#if variant === 'sidebar'}
	<!-- Always open — see the docblock's "collapsible is ignored" note. -->
	<div class="picker-body sidebar" data-link-preview="off">
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

	/* The sidebar copy lives inside `.reading-aside`, already at 0.9rem
	   (app.css) — no further size change needed here, only the layout
	   changes below. */

	.testament + .testament {
		margin-top: 1.5rem;
	}

	.testament h3 {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
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

	   Safe here only because the chapter panel now renders after the whole
	   grid rather than inside a book's list item (see the template) — so
	   opening a book cannot reflow the books around it. `auto-fill` with a
	   `minmax` floor rather than a fixed column count: the aside is 17rem at
	   most widths but wider layouts exist, and the right number of columns is
	   whatever fits. */
	.book-grid.sidebar {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr));
		gap: 0.25rem;
	}

	/* Positioning context for the absolutely-positioned `.chapters` panel
	   (grid variant only — the sidebar's panel is in flow and needs no
	   positioning context from its parent). */
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
		border-radius: 0.35rem;
		color: var(--color-text);
		padding: 0.35rem 0.55rem;
		font-size: 0.85rem;
		font-family: inherit;
		cursor: pointer;
		min-height: 2.1rem;
	}

	/* Full-width row instead of an inline chip, to match the rest of a
	   vertical list — a chip-sized button floating at the list's inline
	   start would leave the rest of the row dead space. */
	/* Fills its grid cell and centres, rather than the full-width row this
	   was when the sidebar list ran vertically. Long names (1 Thessalonians)
	   are clipped rather than allowed to widen the whole track — the button
	   carries a `title` for the full name. */
	.book-btn.sidebar {
		width: 100%;
		justify-content: center;
		padding: 0.3rem 0.35rem;
		font-size: 0.8rem;
		min-height: 1.9rem;
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
	   even against `.current`'s accent border on a neighbouring book. */
	.book-btn.open {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	/* Out of flow: opening a book must not move the 73-button grid behind it.
	   `min-inline-size` keeps single-chapter books (Obadiah, Jude) from
	   collapsing to a sliver; `max-inline-size` matches PANEL_WIDTH_REM in the
	   script, which is what the overflow measurement assumes. GRID VARIANT
	   ONLY — `.chapters.sidebar` below overrides every positioning property
	   back to in-flow. */
	.chapters {
		position: absolute;
		top: calc(100% + 0.35rem);
		inset-inline-start: 0;
		z-index: 20;
		padding: 0.5rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		box-shadow: 0 6px 20px rgb(0 0 0 / 18%);
		min-inline-size: 12rem;
		max-inline-size: min(22rem, calc(100vw - 2rem));
	}

	.chapters.align-end {
		inset-inline-start: auto;
		inset-inline-end: 0;
	}

	/* In-flow instead of a floating panel: no positioning, no shadow (nothing
	   to lift off the page), no width clamp (the column itself already fits
	   17rem — see the component docblock for why the popover's own
	   PANEL_WIDTH_REM doesn't). A small start indent ties it visually to the
	   book button it belongs to, the way a nested list would. */
	.chapters.sidebar {
		position: static;
		top: auto;
		inset-inline-start: auto;
		z-index: auto;
		margin: 0.5rem 0 0.75rem;
		box-shadow: none;
		min-inline-size: 0;
		max-inline-size: none;
	}

	/* The wrapping row of chapter numbers. This used to be `.chapters`
	   itself; it moved down a level when the panel gained a heading in the
	   sidebar variant, so the heading isn't laid out as if it were a
	   chapter chip. */
	.chapters-nums {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	/* Names the book whose chapters these are — needed only in the sidebar,
	   where the panel is detached from the button that opened it. */
	.chapters-book {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.chapters a,
	.chapters .unavailable {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		min-height: 2rem;
		padding: 0.1rem 0.3rem;
		border-radius: 0.25rem;
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
