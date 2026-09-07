<script lang="ts">
	/**
	 * The bookmark library.
	 *
	 * Nothing here is stored. Every row is re-derived from the one thing a
	 * bookmark keeps — its canonical URL — so a library opened in Portuguese
	 * shows the Portuguese wording of the same addresses saved while reading
	 * Latin.
	 *
	 * ## EVERY ROW IS A CITATION, AND NO ROW COSTS A FETCH (2026-09-07)
	 *
	 * It printed each address in whatever form the surface that produced the
	 * row happened to use — a chapter heading from one reading route, a
	 * scholastic citation from another, a bare question label from a third,
	 * and under each mark two clamped lines of the passage. This is the one
	 * page where every work meets in a single column, which is exactly where a
	 * notation has to be uniform: `citation-label.ts` writes them all in the
	 * form `/schola` TEACHES, out of the reader's own edition's abbreviation
	 * table.
	 *
	 * THE EXCERPT WAS WHAT MADE IT EXPENSIVE. A row awaited a content file to
	 * print forty words it then clamped to two lines, so opening a library of
	 * eighty marks downloaded eighty passages. A citation comes off the index
	 * tier, synchronously, and the text arrives for the ONE row the reader
	 * asks about — because the rows peek now.
	 *
	 * THEY PEEK ON A TAP AS WELL AS A CURSOR, which is the marker coming off.
	 * `data-link-preview="hover"` was right while the excerpt stood: the row
	 * already said what it was, so a peek in the way of the tap was an
	 * obstacle. With the excerpt gone it is the reverse — on a phone there
	 * would be a citation and nothing behind it — so the rows are citations
	 * like any other and `citation-links.ts` treats them as such.
	 *
	 * A row whose address no longer resolves still renders, with its citation
	 * and a note, and can still be removed. Silently dropping a reader's own
	 * mark because we cannot show its text would be the worse failure;
	 * `addressResolves` is what asks, and it asks the index tier rather than
	 * fetching to find out.
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
	 * two translated strings in every dictionary to cover a section one heading
	 * already names is a larger claim than the page is making.
	 */
	import { onMount } from 'svelte';
	import { parseHref } from '$lib/address';
	import { bookmarks, migrateBibleHref, type ResolvedBookmark } from '$lib/bookmarks.svelte';
	import { bookmarkGroup } from '$lib/bookmarkContent';
	import { compareBookmarks, documentGroupTitle } from '$lib/bookmarkContent';
	import { addressResolves, citationFor } from '$lib/citation-label';
	import { getWork } from '$lib/corpus';
	import { AnchoredPanel } from '$lib/floating.svelte';
	import { continueRows, listPositions, type ReadingPosition } from '$lib/reading-position';
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

	interface ContinueRow {
		workId: string;
		href: string;
		label: string;
	}

	/**
	 * A position, cited the way a mark is.
	 *
	 * TWO THINGS THE BOOKMARK STORE DOES AND THIS ONE NEVER DID. `continueRows`
	 * drops a row by its WORK, not by whether its href parses, so an address
	 * the grammar refuses reaches render; and positions were never migrated
	 * across the 2026-09-02 Bible slug change, so a stored `/scriptura/josh/1`
	 * parses to nothing at all. `migrateBibleHref` is the same doormat
	 * `bookmarks.svelte.ts` reads its store through, and the position's own
	 * stored `label` — a string the reading route wrote — is what stands when
	 * even that will not parse.
	 */
	const continuing = $derived.by((): ContinueRow[] =>
		continueRows(positions, (id) => getWork(id)?.type).map((position) => {
			const href = migrateBibleHref(position.href);
			const target = parseHref(href);
			return {
				workId: position.workId,
				href,
				label: target ? citationFor(target) : position.label
			};
		})
	);

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

	// The storage note, behind the `i` this site already uses for a line that
	// qualifies a page rather than saying it (`DayReadings`, `ArtFigure`).
	// `$props.id()` has to be a bare declaration — it cannot be passed straight
	// to the constructor, which is what `DayReadings` says at its own.
	const uid = $props.id();
	const card = new AnchoredPanel(uid);
</script>

<svelte:head>
	<title>{t('bookmark.library')} — {t('home.title')}</title>
</svelte:head>

<article class="content-column library">
	<div class="page-head">
		<h1>{t('bookmark.library')}</h1>
		<!-- The trigger has no text of its own, so the `aria-label` is
		     mandatory and not a courtesy. -->
		<button
			bind:this={card.trigger}
			type="button"
			class="menu-trigger about"
			popovertarget={card.id}
			aria-expanded={card.open}
			aria-label={t('bookmark.about')}
		>
			<Icon name="info" class="hint" />
		</button>
		<!-- `role="note"` — ARIA's own word for content ancillary to the thing
		     it hangs off, which this exactly is. -->
		<span
			bind:this={card.panel}
			id={card.id}
			popover="auto"
			role="note"
			ontoggle={card.onToggle}
			class="panel-surface floating-panel caveat">{t('bookmark.deviceOnly')}</span
		>
	</div>
	<p class="page-tagline">{t('bookmark.library.tagline')}</p>

	{#if continuing.length > 0}
		<section class="group continuing" aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('reading.continue')}</h2>
			<ul class="positions index-list">
				{#each continuing as position (position.workId)}
					<li><a class="citation" href={position.href}>{position.label}</a></li>
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
				<ul class="rows index-list">
					{#each section.items as item (item.href)}
						<li class="row index-row">
							<a class="citation" href={item.href}>{citationFor(item.target)}</a>
							{#if !addressResolves(item.target)}
								<span class="unavailable">{t('bookmark.unavailable')}</span>
							{/if}
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
	{/if}

	<!-- Printed for a reader who cannot press the control, on `ArtFigure`'s
	     reasoning: a popover never prints — top layer, and closed besides.
	     `aria-hidden` so it is not read twice. -->
	<p class="caveat-print" aria-hidden="true">{t('bookmark.deviceOnly')}</p>
</article>

<style>
	/* The `i` sits on the heading's own baseline row, which is why the heading
	   is wrapped rather than given a `::after`: the button is a control and has
	   to be in the reading order between the title and the tagline it
	   qualifies. */
	.page-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		/* THE HEADING'S OWN MARGINS, MOVED ONTO THE ROW THAT NOW HOLDS IT.
		   `.page-tagline` sets `margin-top: 0` and takes its gap from the
		   heading above it, so an `h1` zeroed in place would close that gap.
		   `em` here resolves against this row's font size and not the
		   heading's, which is why the value is spelled out: the browser's
		   `0.67em` at the `h1`'s own `2em`. */
		margin-block: 1.34rem;
	}

	.page-head h1 {
		margin: 0;
	}

	/* `.menu-trigger` is the site's button and this adds only its size: a note
	   beside a heading is not a chrome control and should not weigh like one. */
	.about {
		flex: none;
		inline-size: 1.6rem;
		block-size: 1.6rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.caveat {
		max-inline-size: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		overflow-wrap: break-word;
	}

	.caveat-print {
		display: none;
	}

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

	/* An `.index-row` (styles/components.css) laid out as the site's other
	   index rows are: the citation at the start, the control pushed to the end,
	   baselines agreeing. It was a two-row grid while a clamped excerpt sat
	   under the citation; with the excerpt gone the second row had nothing in
	   it. */
	.row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	/* NOT `--color-bookmark`, WHICH IS THE COLOUR OF BEING MARKED. Everywhere
	   else it appears — the bookmark button once it is set, a marked unit's
	   number, a marked verse's tint — it tells one thing apart from its
	   neighbours. Here every row is marked, so it told nothing apart and
	   simply made the page yellow. The accent is what the site colours a link
	   with, and a row here IS the link. No underline at rest, since one under
	   every row of a ruled list is a second set of rules; hover promotes the
	   one the pointer is on, as the prayer and document indexes do. */
	.citation {
		font-family: var(--font-sans);
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--color-accent);
		text-decoration: none;
	}

	.citation:hover,
	.citation:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	/* A dead mark says so beside its citation rather than under it — one line
	   of quiet type, where two lines of the passage used to be. */
	.unavailable {
		font-size: 0.85rem;
		font-style: italic;
		color: var(--color-text-muted);
	}

	.remove {
		margin-inline-start: auto;
		align-self: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: none;
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

	.empty-hint {
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	@media print {
		/* The control becomes the line it opens. */
		.about {
			display: none;
		}
		.caveat-print {
			display: block;
			margin: 2rem 0 0;
			font-size: 0.75rem;
			line-height: 1.45;
			color: var(--color-text-muted);
		}
	}
</style>
