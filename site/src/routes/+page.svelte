<script lang="ts">
	import { onMount } from 'svelte';
	import { listBooks, listWorks, workIdToEdition } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { BibleManifest } from '$lib/types';

	const works = listWorks();

	let positions: ReadingPosition[] = $state([]);

	onMount(() => {
		positions = listPositions();
	});

	function workHref(workId: string): string {
		const work = works.find((w) => w.id === workId);
		if (!work) return '/';
		if (work.type === 'bible') {
			const books = listBooks(workId);
			const firstBook = books[0];
			const firstChapter = firstBook?.chapters[0]?.n ?? 1;
			return `/bible/${workIdToEdition(workId)}/${firstBook?.osis ?? ''}/${firstChapter}`;
		}
		return '/ccc';
	}
</script>

<div class="content-column">
	<h1>{t('home.title')}</h1>
	<p class="tagline">{t('home.tagline')}</p>

	{#if positions.length > 0}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('home.continueReading')}</h2>
			<ul class="positions">
				{#each positions as pos (pos.workId)}
					<li><a href={pos.href}>{pos.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	<section aria-labelledby="library-heading">
		<h2 id="library-heading">{t('home.works')}</h2>
		<ul class="works">
			{#each works as work (work.id)}
				<li>
					<a href={workHref(work.id)} class="work-link">
						<span class="work-title">{work.title}</span>
						<span class="work-meta">{work.short_title} · {work.language}</span>
					</a>
					{#if work.type === 'bible'}
						{@const manifest = work as BibleManifest}
						<p class="work-note">
							{manifest.books.length} book{manifest.books.length === 1 ? '' : 's'}
						</p>
					{/if}
					<p class="work-copyright">{copyrightLabel(work)}</p>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.05rem;
	}

	.positions,
	.works {
		list-style: none;
		padding: 0;
		margin: 0 0 2rem;
	}

	.positions li {
		padding: 0.35rem 0;
	}

	.works li {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.work-link {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		text-decoration: none;
	}

	.work-title {
		font-family: var(--font-serif);
		font-size: 1.2rem;
		color: var(--color-text);
	}

	.work-meta {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.work-note {
		margin: 0.35rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.work-copyright {
		margin: 0.2rem 0 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
</style>
