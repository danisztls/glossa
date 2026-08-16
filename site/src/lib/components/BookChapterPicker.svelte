<script lang="ts">
	/**
	 * Book/chapter navigator for the Bible reader.
	 *
	 * Renders ONE canonical book/chapter structure (docs/decisions.md #4:
	 * "structure is independent of the content version") from
	 * `listCanonicalBooks()` — the union of books/chapters across every Bible
	 * edition — rather than looping over each Bible work and duplicating the
	 * whole grid per edition. Only the book *names* and the link *targets* are
	 * edition-specific, drawn from `namesByWorkId`/`currentEdition`.
	 *
	 * Interaction: book-first, then chapters. 73 books x up to 150 chapters
	 * is too much to lay flat, so books are grouped into Old/New Testament
	 * (docs/corpus-schema.md's 46+27 canonical order — `OT_BOOK_COUNT` below)
	 * and only ONE book's chapter grid is in the DOM at a time, toggled by
	 * plain `<button aria-expanded>` elements — native keyboard support
	 * (Enter/Space, Tab order) with no custom key handling needed, and no
	 * page ever renders more than one book's worth of chapter links.
	 *
	 * Used two ways: `collapsible` (default) wraps the whole thing in a
	 * `<details>` for the reading view, where the picker is a secondary
	 * affordance; the `/bible` landing route sets `collapsible={false}` to
	 * render it inline as the page's actual content.
	 */
	import { untrack } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { editionToWorkId, getBook, listCanonicalBooks, type CanonicalBook } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		currentEdition: string;
		/** Omit on the landing route, where there is no "current" chapter to highlight. */
		currentOsis?: string;
		currentChapter?: number;
		collapsible?: boolean;
	}

	let { currentEdition, currentOsis, currentChapter, collapsible = true }: Props = $props();

	const workId = $derived(editionToWorkId(currentEdition));
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

	function toggleBook(osis: string) {
		openOsis = openOsis === osis ? undefined : osis;
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

{#snippet groups()}
	{#each testaments as group (group.key)}
		<section class="testament">
			<h3>{t(`bible.testament.${group.key}`)}</h3>
			<ul class="book-grid">
				{#each group.books as book (book.osis)}
					{@const isOpen = openOsis === book.osis}
					<li class="book-item">
						<button
							type="button"
							class="book-btn"
							class:current={book.osis === currentOsis}
							aria-expanded={isOpen}
							aria-controls={`chapters-${book.osis}`}
							onclick={() => toggleBook(book.osis)}
						>
							{#if isOpen}
								<ChevronDown size={14} aria-hidden="true" />
							{:else}
								<ChevronRight size={14} aria-hidden="true" />
							{/if}
							<span>{bookName(book)}</span>
						</button>
						{#if isOpen}
							{@const present = chaptersInEdition(book.osis)}
							<div
								id={`chapters-${book.osis}`}
								class="chapters"
								role="group"
								aria-label={bookName(book)}
							>
								{#each book.chapters as chapterN (chapterN)}
									{#if present.has(chapterN)}
										<a
											href={`/bible/${currentEdition}/${book.osis}/${chapterN}`}
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

{#if collapsible}
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

	.book-item {
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

	.book-btn.current {
		border-color: var(--color-accent);
		color: var(--color-accent);
		font-weight: 600;
	}

	.chapters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0.5rem 0 0.75rem;
		padding: 0.5rem;
		background: var(--color-bg-elevated);
		border-radius: 0.35rem;
		max-width: 22rem;
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
