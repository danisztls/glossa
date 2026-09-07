<script lang="ts">
	/**
	 * The bookmark library.
	 *
	 * Nothing here is stored. Every row is re-derived from the one thing a
	 * bookmark keeps — its canonical URL — through the same resolvers the hover
	 * preview uses, so a library opened in Portuguese shows the Portuguese
	 * wording of the same addresses saved while reading Latin.
	 *
	 * GROUPED BY WORK, NOT NEWEST-FIRST. A reading list is not a history: a
	 * reader with eighty marks wants to find the verse where it lives, and the
	 * order they happened to save things in tells them nothing. Save order
	 * survives only as the tie-break inside a section. Every document gets its
	 * own section for the same reason the "Cited in" panel names a work once
	 * and lists its references under it.
	 *
	 * A row whose address no longer resolves — a withheld work, a slug this
	 * reader's language does not carry — still renders, with its citation and a
	 * note, and can still be removed. Silently dropping a reader's own mark
	 * because we cannot show its text would be the worse failure.
	 *
	 * ## AND WHERE THE READER LEFT OFF, WHICH IS NOT A MARK
	 *
	 * "Continue reading" was on the home page, then on `/bibliotheca`, and is
	 * here since 2026-09-06. The two are the same KIND of thing and answer the
	 * same question a reader arrives with — take me back to where I was — but
	 * they are opposite in how they got there: a mark is a decision, saved on
	 * purpose and removable, and a position is a trace the site kept without
	 * being asked. So they are two sections and not one list, and the trace
	 * goes FIRST: it is the shorter of the two and the one a reader returning
	 * mid-chapter came for, where the marks are what they built to come back to
	 * later.
	 *
	 * IT RENDERS OUTSIDE THE EMPTY BRANCH, deliberately. A reader with
	 * positions and no marks is an ordinary state — nothing here saves a
	 * position — and putting the section inside `{:else}` would answer them
	 * with "Nothing marked yet" over a page that knows exactly where they were.
	 *
	 * The page's own title and tagline still name the marks alone. That is a
	 * real cost of the move and the cheaper half of it: renaming a route and
	 * two translated strings in thirty-seven dictionaries to cover a section
	 * one heading already names is a larger claim than the page is making.
	 */
	import { onMount } from 'svelte';
	import { bookmarks, type ResolvedBookmark } from '$lib/bookmarks.svelte';
	import { bookmarkGroup } from '$lib/bookmarkContent';
	import { compareBookmarks, documentGroupTitle, resolveBookmark } from '$lib/bookmarkContent';
	import { getWork } from '$lib/corpus';
	import { continueRows, listPositions, type ReadingPosition } from '$lib/reading-position';
	import { truncate } from '$lib/linkPreviewContent';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Section {
		key: string;
		order: number;
		title: string;
		items: ResolvedBookmark[];
	}

	const sections = $derived.by((): Section[] => {
		const byKey = new Map<string, Section>();
		for (const item of bookmarks.list) {
			const group = bookmarkGroup(item.target);
			let section = byKey.get(group.key);
			if (!section) {
				section = { ...group, title: sectionTitle(group.key), items: [] };
				byKey.set(group.key, section);
			}
			section.items.push(item);
		}
		for (const section of byKey.values()) {
			section.items.sort(
				(a, b) => compareBookmarks(a.target, b.target) || a.addedAt.localeCompare(b.addedAt)
			);
		}
		return [...byKey.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
	});

	// `localStorage`, so it is empty until mount and the section renders no
	// heading over nothing. Uncapped: this page is the record, and the four-row
	// cap the home page carried was for a surface that had somewhere else to
	// send the reader.
	let positions: ReadingPosition[] = $state([]);
	onMount(() => {
		positions = listPositions();
	});

	const continuing = $derived(continueRows(positions, (id) => getWork(id)?.type));

	// The work-type headings deliberately reuse the nav labels rather than
	// declaring their own strings: they name the same works.
	function sectionTitle(key: string): string {
		if (key === 'scripture') return t('nav.bible');
		if (key === 'catechism') return t('nav.ccc');
		if (key === 'compendium') return t('nav.compendium');
		if (key === 'summa') return t('nav.summa');
		if (key === 'socialDoctrine') return t('nav.socialDoctrine');
		if (key === 'prayers') return t('nav.prayers');
		return documentGroupTitle(key.slice('document:'.length));
	}
</script>

<svelte:head>
	<title>{t('bookmark.library')} — {t('home.title')}</title>
</svelte:head>

<article class="content-column library">
	<h1>{t('bookmark.library')}</h1>
	<p class="page-tagline">{t('bookmark.library.tagline')}</p>

	{#if continuing.length > 0}
		<section class="group continuing" aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('reading.continue')}</h2>
			<ul class="positions index-list" data-link-preview="hover">
				{#each continuing as position (position.workId)}
					<li><a href={position.href}>{position.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if sections.length === 0}
		<p class="empty">{t('bookmark.empty')}</p>
		<p class="empty-hint">{t('bookmark.emptyHint')}</p>
	{:else}
		{#each sections as section (section.key)}
			<section class="group">
				<h2>{section.title}</h2>
				<ul class="rows index-list" data-link-preview="hover">
					{#each section.items as item (item.href)}
						<li class="row index-row">
							{#await resolveBookmark(item.target)}
								<a class="citation" href={item.href}>{item.href}</a>
							{:then resolved}
								<a class="citation" href={item.href}>
									{resolved ? resolved.title : item.href}
								</a>
								{#if resolved}
									<p class="excerpt">{truncate(resolved.text)}</p>
								{:else}
									<p class="excerpt unavailable">{t('bookmark.unavailable')}</p>
								{/if}
							{/await}
							<button
								type="button"
								class="remove"
								aria-label={`${t('bookmark.remove')}: ${item.href}`}
								title={t('bookmark.remove')}
								onclick={() => bookmarks.remove(item.href)}
							>
								<Icon name="trash-2" />
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/each}

		<p class="device-note">{t('bookmark.deviceOnly')}</p>
	{/if}
</article>

<style>
	.group {
		margin-block: 2rem;
	}

	.group h2 {
		font-size: 1.15rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
	}

	/* It is a `.group` for the heading and the rule, which are the same object
	   as a work's section below it, and then takes its top margin back: it
	   follows the tagline rather than another group, and `2rem` under a
	   sentence reads as a gap rather than as a division. */
	.continuing {
		margin-block-start: 1.5rem;
	}

	.positions li {
		padding: 0.35rem 0;
	}

	/* An `.index-row` (styles/components.css) that is a GRID rather than a
	   title-and-chip flex row: a bookmark carries its citation, two lines of
	   the passage under it and a remove button spanning both, which is a
	   shape none of the other index pages has. The row's padding and rule
	   come from the primitive; the tracks are this page's own. */
	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.25rem 0.75rem;
	}

	.citation {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-bookmark);
		text-decoration: none;
	}

	.citation:hover {
		text-decoration: underline;
	}

	/* Two lines of the text, so a row identifies itself without becoming a
	   second reading view. */
	.excerpt {
		grid-column: 1;
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.excerpt.unavailable {
		font-style: italic;
	}

	.remove {
		grid-row: 1 / span 2;
		grid-column: 2;
		align-self: start;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.remove:hover {
		color: var(--color-accent);
		border-color: var(--color-border);
	}

	.empty {
		margin-top: 2rem;
		font-size: 1.05rem;
	}

	.empty-hint,
	.device-note {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.device-note {
		margin-top: 2rem;
	}
</style>
