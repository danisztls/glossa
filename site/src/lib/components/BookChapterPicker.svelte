<script lang="ts">
	import { listBibleWorks, listBooks, workIdToEdition } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		currentEdition: string;
		currentOsis: string;
		currentChapter: number;
	}

	let { currentEdition, currentOsis, currentChapter }: Props = $props();

	const works = listBibleWorks();
</script>

<details class="picker">
	<summary>{t('bible.pickBook')}</summary>
	<div class="picker-body">
		{#each works as work (work.id)}
			{@const edition = workIdToEdition(work.id)}
			<section>
				<h3>{work.short_title}</h3>
				<ul class="book-list">
					{#each listBooks(work.id) as book (book.osis)}
						<li>
							<span
								class="book-name"
								class:current={edition === currentEdition && book.osis === currentOsis}
							>
								{book.name}
							</span>
							<span class="chapters">
								{#each book.chapters as chapter (chapter.n)}
									<a
										href={`/bible/${edition}/${book.osis}/${chapter.n}`}
										class:current={edition === currentEdition &&
											book.osis === currentOsis &&
											chapter.n === currentChapter}
									>
										{chapter.n}
									</a>
								{/each}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</details>

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
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-top: 0.75rem;
	}

	.book-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.book-list li {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.15rem 0;
	}

	.book-name {
		min-width: 5rem;
		color: var(--color-text-muted);
	}

	.book-name.current {
		color: var(--color-text);
		font-weight: 600;
	}

	.chapters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.chapters a {
		display: inline-block;
		min-width: 1.6rem;
		text-align: center;
		padding: 0.1rem 0.3rem;
		border-radius: 0.25rem;
		text-decoration: none;
	}

	.chapters a.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
	}
</style>
