<script lang="ts">
	import { onMount } from 'svelte';
	import { getWork, listBooks, listWorks, workIdToEdition } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { WorkManifest, WorkType } from '$lib/types';

	const works = listWorks();

	// Library groups, in the same order as the header nav (Home is implicit
	// — this page IS home) — six works across three types now instead of a
	// flat two-work list, so the library reads as three shelves, not one.
	//
	// Deliberately NOT `[...new Set(works.map(w => w.type))]` or similar:
	// the real corpus now also carries `vatii.*` (Vatican II documents,
	// docs/corpus-schema.md §Documents, ~300 more encyclicals queued behind
	// them) with `type: "document"` manifests — `listWorks()` returns those
	// too. This fixed 3-type list is what keeps them off the home page
	// until they have routes to open (no `/document/...` route exists yet);
	// `workHref` below only handles the three types here, and `WorkType`
	// itself doesn't include `"document"` (that manifest's `type` field
	// only round-trips through the loose `as WorkManifest` cast in
	// corpus-index.ts, same as before this corpus grew documents). Revisit
	// this list, not the filtering approach, when documents get a route.
	const GROUP_TYPES: WorkType[] = ['bible', 'catechism', 'compendium'];

	function worksOfType(type: WorkType): WorkManifest[] {
		return works.filter((w) => w.type === type);
	}

	function groupHeading(type: WorkType): string {
		if (type === 'bible') return t('nav.bible');
		if (type === 'catechism') return t('nav.ccc');
		return t('nav.compendium');
	}

	// Routed by work type, not by an if/else-with-fallback: a fallback here
	// would silently misroute the next work type added (this bit Compendium
	// when it first landed — it fell through the old `bible ? … : '/ccc'`
	// check straight into the Catechism's landing page).
	function workHref(work: WorkManifest): string {
		switch (work.type) {
			case 'bible': {
				const books = listBooks(work.id);
				const firstBook = books[0];
				const firstChapter = firstBook?.chapters[0]?.n ?? 1;
				return `/bible/${workIdToEdition(work.id)}/${firstBook?.osis ?? ''}/${firstChapter}`;
			}
			case 'catechism':
				return '/ccc';
			case 'compendium':
				return '/compendium';
		}
	}

	let positions: ReadingPosition[] = $state([]);

	onMount(() => {
		positions = listPositions();
	});

	// One "continue reading" row per work TYPE (most recently touched
	// edition of it), not one per exact edition: with two editions per type
	// now on offer, a reader who has opened both the English and Portuguese
	// Bible would otherwise get two separate Bible rows here, which reads as
	// clutter rather than as two genuinely different shortcuts. `positions`
	// is already sorted most-recent-first, so `.find` picks the latest.
	const continueItems = $derived(
		GROUP_TYPES.map((type) =>
			positions.find((pos) => getWork(pos.workId)?.type === type)
		).filter((pos): pos is ReadingPosition => pos !== undefined)
	);
</script>

<div class="content-column">
	<h1>{t('home.title')}</h1>
	<p class="tagline">{t('home.tagline')}</p>

	{#if continueItems.length > 0}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('home.continueReading')}</h2>
			<ul class="positions">
				{#each continueItems as pos (pos.workId)}
					<li><a href={pos.href}>{pos.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	<section aria-labelledby="library-heading">
		<h2 id="library-heading">{t('home.works')}</h2>

		{#each GROUP_TYPES as type (type)}
			{@const groupWorks = worksOfType(type)}
			{#if groupWorks.length > 0}
				<div class="work-group" aria-labelledby={`group-${type}`}>
					<h3 id={`group-${type}`}>{groupHeading(type)}</h3>
					<ul class="works">
						{#each groupWorks as work (work.id)}
							<li>
								<a href={workHref(work)} class="work-link">
									<span class="work-title">{work.title}</span>
									<span class="work-meta">{work.short_title} · {work.language}</span>
								</a>
								{#if work.type === 'bible'}
									<p class="work-note">
										{work.books.length} book{work.books.length === 1 ? '' : 's'}
									</p>
								{/if}
								<p class="work-copyright">{copyrightLabel(work)}</p>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		{/each}
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

	.work-group {
		margin-bottom: 1.75rem;
	}

	.work-group h3 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		color: var(--color-text-muted);
		margin: 0 0 0.25rem;
	}

	.work-group .works {
		margin-bottom: 0;
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
