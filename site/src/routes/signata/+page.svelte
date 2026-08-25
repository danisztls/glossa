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
	 * and lists its references under it (docs/decisions.md, 2026-08-21).
	 *
	 * A row whose address no longer resolves — a withheld work, a slug this
	 * reader's language does not carry — still renders, with its citation and a
	 * note, and can still be removed. Silently dropping a reader's own mark
	 * because we cannot show its text would be the worse failure.
	 */
	import { bookmarks, type ResolvedBookmark } from '$lib/bookmarks.svelte';
	import { bookmarkGroup } from '$lib/bookmarkContent';
	import { compareBookmarks, documentGroupTitle, resolveBookmark } from '$lib/bookmarkContent';
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

	// The work-type headings deliberately reuse the nav labels rather than
	// declaring their own strings: they name the same works.
	function sectionTitle(key: string): string {
		if (key === 'scripture') return t('nav.bible');
		if (key === 'catechism') return t('nav.ccc');
		if (key === 'compendium') return t('nav.compendium');
		if (key === 'summa') return t('nav.summa');
		if (key === 'prayers') return t('nav.prayers');
		return documentGroupTitle(key.slice('document:'.length));
	}
</script>

<svelte:head>
	<title>{t('bookmark.library')} — {t('home.title')}</title>
</svelte:head>

<article class="content-column library">
	<h1>{t('bookmark.library')}</h1>
	<p class="lede">{t('bookmark.library.tagline')}</p>

	{#if sections.length === 0}
		<p class="empty">{t('bookmark.empty')}</p>
		<p class="empty-hint">{t('bookmark.emptyHint')}</p>
	{:else}
		{#each sections as section (section.key)}
			<section class="group">
				<h2>{section.title}</h2>
				<ul class="rows">
					{#each section.items as item (item.href)}
						<li class="row">
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
	.lede {
		color: var(--color-text-muted);
	}

	.group {
		margin-block: 2rem;
	}

	.group h2 {
		font-size: 1.15rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.25rem 0.75rem;
		padding-block: 0.7rem;
		border-bottom: 1px solid var(--color-border);
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
		border-radius: 0.4rem;
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
