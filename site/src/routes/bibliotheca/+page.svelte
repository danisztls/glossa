<script lang="ts">
	/**
	 * The library — every work on the site, and the reader's own place in it.
	 *
	 * ## Why this page exists, and why it is a superset rather than a category
	 *
	 * The nav bar was one item per work, so it grew by one every time the
	 * corpus did: six items by 2026-09-03, and the two newest works
	 * (`/doctrina-socialis`, `/ius-canonicum`) were named nowhere else on the
	 * site — not on the home page, not in the jump box. That is a bar with no
	 * end state, and Denzinger, the Roman Catechism, the Fathers and a second
	 * code each cost it another slot.
	 *
	 * Three umbrella labels were tried first and all three failed the same way
	 * ("Church", "Magisterium", "Teaching"): Scripture is transmitted by the
	 * Church, the Catechism is issued by the Church, the prayers are the
	 * Church's — a label every sibling satisfies carries no information and
	 * cannot tell a reader where to click.
	 *
	 * **`Library` escapes that only by meaning the whole catalogue rather than
	 * the rest.** A library contains the Bible too. Read that way it makes no
	 * taxonomic claim at all, the bar reads as four doors people want most plus
	 * the whole thing, and the overlap between a shortcut and the full index is
	 * ordinary navigation. (Redundancy is a defect only when two items reach
	 * the SAME place, which is why the layout has no "Home" entry beside the
	 * brand link.) So `/scriptura` and `/preces` are listed below even though
	 * both are one click away in the bar — leaving them out is what would turn
	 * this page into a leftovers bin.
	 *
	 * ## A catalogue AND a borrowing record
	 *
	 * The two halves under the shelves are what make this more than an index.
	 * Neither is new machinery: `continueRows` collapses the same
	 * `listPositions()` the home page reads, and the bookmark counts come from
	 * the same `bookmarkGroup` that `/signata` sections by. `/signata` remains
	 * the full view — this is the way in to it, next to the catalogue it is a
	 * record of.
	 *
	 * ## Every string here is one a page already had
	 *
	 * No shelf, work or section below declares a name or a sentence of its own:
	 * each reuses the key its own landing page is titled and described by, which
	 * is the same rule `scripts/route-titles.mjs` follows for the `<head>`. A
	 * catalogue that paraphrased the pages it lists would be a second set of
	 * sentences to translate into 37 languages and a second set to keep true.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
	import { onMount } from 'svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import { bookmarkGroup } from '$lib/bookmarkContent';
	import { getWork, listWorksOfType } from '$lib/corpus';
	import { continueRows, listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { WorkType } from '$lib/types';

	interface Entry {
		href: string;
		titleKey: string;
		taglineKey: string;
		/** The work type that has to be in this build for the row to mean
		 *  anything. A partial sync or the vitest fixtures may carry some. */
		type: WorkType;
	}

	interface Shelf {
		key: string;
		titleKey: string;
		/** A shelf holding ONE work is its own row: the heading is the link and
		 *  the sentence sits under it, rather than a heading repeating the title
		 *  of the single row beneath it. */
		href?: string;
		taglineKey?: string;
		type?: WorkType;
		works?: Entry[];
	}

	/**
	 * The six shelves, in the order a reader meets the Church's texts.
	 *
	 * THE SOCIAL DOCTRINE SITS UNDER LEARN, and it moved three times before it
	 * settled there — beside the Magisterium, then under it, then here. An item
	 * that will not sit still means the taxonomy is short an axis, and it was:
	 * the Compendium of the Social Doctrine is a compilation of magisterial
	 * documents by ORIGIN, a systematic synthesis by FORM, and social teaching
	 * by SUBJECT. This shelf encodes form, like every other one here — Bible,
	 * Law and Prayers are all kinds of text — and on that axis the line is
	 * synthesis against occasion: works that gather scattered teaching into an
	 * ordered whole and are read THROUGH, against dated acts issued once and
	 * cited SINGLY. The address space says the same thing without being asked:
	 * `/doctrina-socialis/{n}` and `/doctrina-socialis/caput/{n}` mirror
	 * `/catechismus/{n}` and `/catechismus/caput/{n}`, while the Code is cited
	 * by canon and a document by section.
	 *
	 * The shelf keeps a name that is not literally true of everything on it,
	 * and there is precedent beside it: Scriptura holds Haydock and the book
	 * introductions, neither of which is Scripture. A shelf is named for its
	 * flagship and holds what belongs around it.
	 */
	const SHELVES: Shelf[] = [
		{
			key: 'bible',
			titleKey: 'nav.bible',
			href: '/scriptura',
			taglineKey: 'bible.landing.tagline',
			type: 'bible'
		},
		{
			key: 'learn',
			titleKey: 'nav.learn',
			works: [
				{
					href: '/catechismus',
					titleKey: 'ccc.landing.title',
					// The sentence names BOTH works, which is right for this row:
					// `/catechismus` is the index of the pair and not of the
					// Catechism alone. It is the one tagline here carrying markup
					// (`<strong>` around each work's name, inside the sentence
					// because 36 translations do not share English word order).
					taglineKey: 'ccc.landing.tagline',
					type: 'catechism'
				},
				{
					href: '/catechismus/compendium',
					titleKey: 'compendium.landing.title',
					taglineKey: 'compendium.landing.tagline',
					type: 'compendium'
				},
				{
					href: '/doctrina-socialis',
					titleKey: 'socialDoctrine.landing.title',
					taglineKey: 'socialDoctrine.landing.tagline',
					type: 'social-doctrine'
				}
			]
		},
		{
			key: 'magisterium',
			titleKey: 'nav.magisterium',
			href: '/documenta',
			taglineKey: 'document.library.tagline',
			type: 'document'
		},
		{
			key: 'ius',
			titleKey: 'nav.canonLaw',
			href: '/ius-canonicum',
			taglineKey: 'canonLaw.landing.tagline',
			type: 'canon-law'
		},
		{
			key: 'preces',
			titleKey: 'nav.prayers',
			href: '/preces',
			taglineKey: 'prayers.landing.tagline',
			type: 'prayer'
		},
		{
			// THE SHELF THE NAV BAR CANNOT CARRY. `+layout.svelte` leaves
			// `/doctores` unlisted because the Summa awaits its quality pass and
			// the shelf holds nothing else; in a bar that is invisibility, since
			// a bar has no room for a caveat. Here the caveat can be a sentence
			// beside the shelf, which is why the argument for hiding it does not
			// reach this page.
			key: 'doctores',
			titleKey: 'doctores.landing.title',
			href: '/doctores',
			taglineKey: 'doctores.landing.tagline',
			type: 'summa',
			works: [
				{
					href: '/doctores/summa',
					titleKey: 'summa.landing.title',
					taglineKey: 'summa.landing.tagline',
					type: 'summa'
				}
			]
		}
	];

	const has = (type: WorkType) => listWorksOfType(type).length > 0;

	const shelves = $derived(
		SHELVES.map((shelf) => ({
			...shelf,
			present: shelf.type ? has(shelf.type) : false,
			works: (shelf.works ?? []).filter((work) => has(work.type))
		})).filter((shelf) => shelf.present || shelf.works.length > 0)
	);

	// --- The reader's own place ------------------------------------------------
	//
	// Both halves read localStorage, so both are empty until mount and neither
	// renders a heading over nothing.
	let positions: ReadingPosition[] = $state([]);
	onMount(() => {
		positions = listPositions();
	});

	const continuing = $derived(continueRows(positions, (id) => getWork(id)?.type));

	/** How many marks each of `/signata`'s own sections holds, in its order —
	 *  the shape of the library rather than a bare total, which is what tells a
	 *  reader whether it is worth opening. */
	const markedGroups = $derived.by(() => {
		const counts = new Map<string, { order: number; count: number }>();
		for (const item of bookmarks.list) {
			const group = bookmarkGroup(item.target);
			const seen = counts.get(group.key);
			if (seen) seen.count += 1;
			else counts.set(group.key, { order: group.order, count: 1 });
		}
		return [...counts.values()].sort((a, b) => a.order - b.order);
	});
</script>

<svelte:head>
	<title>{t('nav.library')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('nav.library')}</h1>
	<p class="page-tagline">{t('library.landing.tagline')}</p>

	{#if continuing.length > 0}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('home.continueReading')}</h2>
			<ul class="positions index-list">
				{#each continuing as position (position.workId)}
					<li><a href={position.href}>{position.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if markedGroups.length > 0}
		<section aria-labelledby="marked-heading">
			<h2 id="marked-heading">{t('bookmark.library')}</h2>
			<!-- One link, not a second copy of `/signata`'s list: this page says
			     how much is there and where it is; that page is the reading of
			     it. -->
			<p class="marked">
				<a href="/signata">{t('nav.bookmarks')}</a>
				<span class="marked-counts">
					{#each markedGroups as group, i (i)}
						<span class="chip">{group.count}</span>
					{/each}
				</span>
			</p>
		</section>
	{/if}

	<section aria-labelledby="catalogue-heading">
		<h2 id="catalogue-heading" class="visually-hidden">{t('nav.library')}</h2>
		{#each shelves as shelf (shelf.key)}
			<section class="shelf" aria-labelledby={`shelf-${shelf.key}`}>
				<h3 id={`shelf-${shelf.key}`} class="shelf-heading">
					{#if shelf.present && shelf.href}
						<a href={shelf.href}>{t(shelf.titleKey)}</a>
					{:else}
						{t(shelf.titleKey)}
					{/if}
				</h3>
				{#if shelf.present && shelf.taglineKey}
					<p class="shelf-tagline">{@html t(shelf.taglineKey)}</p>
				{/if}
				{#if shelf.works.length > 0}
					<ul class="works index-list">
						{#each shelf.works as work (work.href)}
							<li class="index-row work">
								<a class="index-link work-link" href={work.href}>
									<span class="index-title work-title">{t(work.titleKey)}</span>
								</a>
								<!-- `{@html}` on the same terms as `/catechismus`'s masthead:
								     every string here is a literal in a checked-in dictionary,
								     named by a key in this file, and nothing is passed through
								     from the corpus or from a URL. -->
								<p class="work-tagline">{@html t(work.taglineKey)}</p>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/each}
	</section>
</div>

<style>
	section {
		margin: 2.25rem 0;
	}

	section h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 0 0 1rem;
	}

	.positions li {
		padding: 0.35rem 0;
	}

	.marked {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin: 0;
	}

	.marked-counts {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}

	.marked-counts .chip {
		font-variant-numeric: tabular-nums;
		padding-inline: 0.35rem;
	}

	/* The catalogue's own heading is for a screen reader only: the page's `h1`
	   already names it, and a visible "Library" over a list on a page titled
	   "Library" is a rule with a word on it. The shelves still need a level to
	   hang from, so the heading exists rather than the shelves jumping to h2. */
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.shelf {
		margin: 1.75rem 0;
	}

	.shelf-heading {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		margin: 0 0 0.25rem;
	}

	.shelf-heading a {
		text-decoration: none;
	}

	.shelf-heading a:hover,
	.shelf-heading a:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.shelf-tagline,
	.work-tagline {
		margin: 0.15rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/* A work is a title over its sentence, not a row with a value at the far
	   end — so the shared `.index-row` grid is overridden back to a block. The
	   classes stay for the hover and the link colour, which are the same
	   object here as in every other index on the site. */
	.works {
		margin: 0.6rem 0 0;
	}

	.work {
		display: block;
		padding: 0.5rem 0;
	}

	.work-link {
		display: inline;
	}

	.work-title {
		font-size: 1rem;
	}
</style>
