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
	 * edition-free (`/bible/{book}/{chapter}`, see that route's `+page.ts`).
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
	 * an absolutely-positioned popover — used by the `/bible` landing route
	 * and by the reading view's mobile/collapsed picker. `'sidebar'` is for
	 * the reading view's desktop right column (`.reading-aside`, app.css):
	 * books render as a single-column vertical list instead, and the chapter
	 * grid for an open book expands IN FLOW directly beneath it. That would
	 * have been wrong for the grid variant (that's the whole reason the
	 * popover exists), but it's exactly right here for two reasons the grid
	 * variant doesn't have: a single column never wraps, so opening a book
	 * only ever pushes the (already vertical) list straight down instead of
	 * reflowing it sideways under the cursor; and `.reading-aside` is itself
	 * `overflow-y: auto` (a scroll container, so it clips anything that
	 * escapes its box) and only 17rem wide (so the popover's own 22rem
	 * `PANEL_WIDTH_REM` wouldn't fit even if it weren't clipped). The
	 * `align`/outside-click/Escape machinery above is therefore skipped
	 * entirely for `'sidebar'` — nothing needs measuring or force-dismissing
	 * when there's no popover to overhang the viewport or fail to
	 * self-dismiss.
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
		/** `'grid'` (default): wrapped flex grid + popover, as documented above.
		    `'sidebar'`: vertical list + in-flow chapter panel, for `.reading-aside`. */
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
						{#if isOpen}
							{@const present = chaptersInEdition(book.osis)}
							<div
								id={`chapters-${book.osis}`}
								class="chapters"
								class:sidebar={variant === 'sidebar'}
								class:align-end={variant === 'grid' && align === 'end'}
								role="group"
								aria-label={bookName(book)}
							>
								{#each book.chapters as chapterN (chapterN)}
									{#if present.has(chapterN)}
										<a
											href={`/bible/${book.osis}/${chapterN}`}
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
						{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
{/snippet}

{#if variant === 'sidebar'}
	<!-- Always open — see the docblock's "collapsible is ignored" note. -->
	<div class="picker-body sidebar">
		{@render groups()}
	</div>
{:else if collapsible}
	<details class="picker">
		<summary>{t('bible.pickBook')}</summary>
		<div class="picker-body">
			{@render groups()}
		</div>
	</details>
{:else}
	<div class="picker-body standalone">
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

	/* Single column, no wrapping — this is what makes it safe for `.chapters`
	   to expand in flow below (see that rule's own comment): with nothing to
	   its side, opening a book can only ever push what's below it straight
	   down, never sideways under the reader's cursor. */
	.book-grid.sidebar {
		flex-direction: column;
		flex-wrap: nowrap;
		gap: 0.15rem;
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
	.book-btn.sidebar {
		width: 100%;
		justify-content: flex-start;
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
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
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
		margin: 0.3rem 0 0.5rem 0.6rem;
		box-shadow: none;
		min-inline-size: 0;
		max-inline-size: none;
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
