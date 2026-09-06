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
	 * The two halves ABOVE the shelves are what make this more than an index.
	 * Neither is new machinery: `continueRows` collapses `listPositions()`, and
	 * the bookmark counts come from the same `bookmarkGroup` that `/signata`
	 * sections by. `/signata` remains the full view — this is the way in to it,
	 * next to the catalogue it is a record of.
	 *
	 * **AND SINCE 2026-09-06 THIS IS THE ONLY PAGE THAT HAS THEM.** The home
	 * page carried "continue reading" too, capped at four, on the reasoning
	 * that an entrance may show a little of what the record holds. What it
	 * actually produced was a section that is EMPTY for every reader who has
	 * not been here before — the one page a stranger arrives at, arranged
	 * around a state only a returning reader has — and the returning reader got
	 * a truncated copy of a list one click away. The record belongs beside the
	 * catalogue it is a record of. `library.continueReading` was
	 * `home.continueReading` until the same day, the second key on this page to
	 * be renamed rather than re-translated (`nav.library` was `home.works`).
	 *
	 * ## Almost every string here is one a page already had
	 *
	 * No shelf or section below declares a sentence of its own: each reuses the
	 * key its own landing page is titled and described by, which is the same
	 * rule `scripts/route-titles.mjs` follows for the `<head>`. A catalogue that
	 * paraphrased the pages it lists would be a second set of sentences to
	 * translate into 37 languages and a second set to keep true.
	 *
	 * **THERE IS EXACTLY ONE EXCEPTION AND IT IS A NAME, NOT A SENTENCE**:
	 * `ccc.landing.pairTitle`, because the Learn shelf names the Catechism and
	 * its Compendium as one card and no other surface on the site wants that
	 * name — `/schola` lists the two works separately and the `<head>` titles
	 * `/catechismus` after the Catechism alone. It is English-only for now and
	 * falls back key by key, which is the cost of the exception rather than a
	 * gap in it.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
	import { onMount } from 'svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import { bookmarkGroup } from '$lib/bookmarkContent';
	import { getWork, listWorksOfType } from '$lib/corpus';
	import { continueRows, listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import { BANNERS, type Artwork } from '$lib/landing-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/components/Icon.svelte';
	import type { WorkType } from '$lib/types';

	interface Entry {
		href: string;
		titleKey: string;
		taglineKey: string;
		icon: IconName;
		/** The work type that has to be in this build for the row to mean
		 *  anything. A partial sync or the vitest fixtures may carry some. */
		type: WorkType;
	}

	interface Shelf {
		key: string;
		titleKey: string;
		/** THE SAME GLYPH `/schola` GIVES THAT WORK, and taken from there rather
		 *  than chosen again: the two pages name the same eight things, and a
		 *  reader who has learned a mark on one of them has learned it. `learn`
		 *  is the only key here with no counterpart there — that page IS Learn
		 *  and does not list itself. */
		icon: IconName;
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
			icon: 'scroll',
			href: '/scriptura',
			taglineKey: 'bible.landing.tagline',
			type: 'bible'
		},
		{
			// TWO WORKS, NOT THREE, since 2026-09-06. The Compendium of the
			// Catechism was a row of its own beside the Catechism, and the two
			// rows led to one index: `/catechismus` holds both, which is what
			// `ccc.landing.tagline` has always said in the sentence under them.
			// So the pair is one card named for the pair, and the second row is
			// where the reader arrives rather than a second door to it.
			key: 'learn',
			titleKey: 'nav.learn',
			icon: 'graduation-cap',
			works: [
				{
					href: '/catechismus',
					// The one key on this page written FOR this page — the shelf
					// needed a name for the pair and no other surface wants one
					// (`/schola` lists the two works separately, and the `<head>`
					// titles `/catechismus` after the Catechism). English only
					// for now; `t()` falls back key by key.
					titleKey: 'ccc.landing.pairTitle',
					// The sentence names BOTH works, which is right for this row:
					// `/catechismus` is the index of the pair and not of the
					// Catechism alone. It is the one tagline here carrying markup
					// (`<strong>` around each work's name, inside the sentence
					// because 36 translations do not share English word order).
					taglineKey: 'ccc.landing.tagline',
					icon: 'book-marked',
					type: 'catechism'
				},
				{
					href: '/doctrina-socialis',
					titleKey: 'socialDoctrine.landing.title',
					taglineKey: 'socialDoctrine.landing.tagline',
					icon: 'users',
					type: 'social-doctrine'
				}
			]
		},
		{
			key: 'magisterium',
			titleKey: 'nav.magisterium',
			icon: 'landmark',
			href: '/documenta',
			taglineKey: 'document.library.tagline',
			type: 'document'
		},
		{
			key: 'ius',
			titleKey: 'nav.canonLaw',
			icon: 'scale',
			href: '/ius-canonicum',
			taglineKey: 'canonLaw.landing.tagline',
			type: 'canon-law'
		},
		{
			key: 'preces',
			titleKey: 'nav.prayers',
			icon: 'flame',
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
			//
			// AND THE SUMMA'S OWN ROW WENT ON 2026-09-06, leaving the shelf and
			// its sentence. Two links to one unread work is one more than the
			// caveat can carry, and the row was the second: `/doctores` is the
			// page that says what the shelf holds and what state it is in, so a
			// row beside it that jumps past that sentence into the text is the
			// half of the pair a reader should not meet first.
			key: 'doctores',
			titleKey: 'doctores.landing.title',
			icon: 'feather',
			href: '/doctores',
			taglineKey: 'doctores.landing.tagline',
			type: 'summa'
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

	// The identification, plus the one interface word in it — composed here and
	// passed down, the arrangement `Plate.svelte` argues for: the page that
	// knows what a picture is is the page that writes the line.
	const creditOf = (art: Artwork) => art.credit + (art.detail ? ` (${t('art.detail')})` : '');
</script>

<svelte:head>
	<title>{t('nav.library')} — {t('home.title')}</title>
</svelte:head>

<div class="landing-column">
	<!--
		THE ONE PICTURE ON THIS PAGE, and it is Antonello's Jerome: a man alone
		in a room full of books, which is what a library is. It headed `/schola`
		until 2026-09-05 and moved here because that page is about being taught
		and this one is about what is on the shelf — `landing-art.ts` holds the
		swap and the credit. Above the title rather than behind it, for the
		reason that file gives: text over a painting has to hold its contrast
		across five appearance axes and does not need to.

		`eager`, because it is the first thing on the page at every viewport.
	-->
	<div class="masthead">
		<ArtFigure
			art={BANNERS.bibliotheca}
			credit={creditOf(BANNERS.bibliotheca)}
			label={t('art.about')}
			eager
		/>
	</div>

	<h1>{t('nav.library')}</h1>
	<p class="page-tagline landing-measure">{t('library.landing.tagline')}</p>

	<!--
		THE BORROWING RECORD, SIDE BY SIDE. Two short sections that each say one
		thing — where you were, and how much you have marked — so stacking them
		gave a rule and a heading to a list of four links and to a single line
		of chips. Both are empty until mount and either may be absent, which is
		what the `auto-fit` grid handles without a branch: one section alone
		fills the row.
	-->
	{#if continuing.length > 0 || markedGroups.length > 0}
		<div class="reader">
			{#if continuing.length > 0}
				<section aria-labelledby="continue-heading">
					<h2 id="continue-heading">{t('library.continueReading')}</h2>
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
					<!-- One link, not a second copy of `/signata`'s list: this page
					     says how much is there and where it is; that page is the
					     reading of it. -->
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
		</div>
	{/if}

	<section aria-labelledby="catalogue-heading">
		<h2 id="catalogue-heading" class="visually-hidden">{t('nav.library')}</h2>
		<!--
			A GRID OF CARDS AND A LIST IN THE MARKUP. The shelves were six stacked
			blocks down a 72rem column, which is a column of headings with an
			ocean to the right of each; they are the home page's `.door` grid
			now, which is the same object one level up — a name, a sentence, and
			a way in. `<ul>`/`<li>` rather than the `<section aria-labelledby>`
			each shelf used to be: what the reader is looking at is a list of
			six things, the `<h3>`s still make the outline, and a `<section>`
			inside every `<li>` would be a landmark per card announcing nothing
			the heading does not.
		-->
		<ul class="shelves">
			{#each shelves as shelf (shelf.key)}
				<li class="shelf">
					<h3 class="shelf-heading">
						<!-- Decorative, which `Icon.svelte` enforces rather than
						     offering: the name beside it is the label. -->
						<span class="shelf-icon"><Icon name={shelf.icon} /></span>
						{#if shelf.present && shelf.href}
							<a href={shelf.href}>{t(shelf.titleKey)}</a>
						{:else}
							<span>{t(shelf.titleKey)}</span>
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
										<span class="work-icon"><Icon name={work.icon} /></span>
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
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	/* The banner takes the whole column and the title follows it. */
	.masthead {
		margin: 0 0 1.5rem;
	}

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

	/*
	 * THE TWO HALVES OF THE BORROWING RECORD, ACROSS RATHER THAN DOWN.
	 * `auto-fit` and not `auto-fill`, which is the whole reason either section
	 * may be absent without a branch in the markup: an empty track collapses,
	 * so one section alone gets the row instead of half of it and a gap.
	 *
	 * The gap is asymmetric on purpose — a wide gutter between two columns of
	 * different things, a narrow one where they stack.
	 */
	.reader {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 0.5rem 2.5rem;
		align-items: start;
		margin: 2.25rem 0;
	}

	/* The row owns the spacing now, so its children give theirs up — otherwise
	   two side-by-side sections carry the block margin the stack needed. */
	.reader section {
		margin: 0;
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

	/*
	 * THE SHELVES, AS THE HOME PAGE'S DOOR GRID. Same track floor, same gap,
	 * same card — `minmax(17rem, 1fr)` rather than the doors' 15rem because a
	 * shelf may hold rows as well as a sentence, and 15 put the Learn card's
	 * two titles on three lines each.
	 *
	 * IT IS NOT ONE CARD-WIDE ANCHOR, and the doors are. A door leads one
	 * place; two of these shelves hold their own links, so a card that was
	 * itself a link would be an anchor with anchors inside it — invalid, and
	 * ambiguous before it is invalid. So the heading is the target, as it was
	 * when the shelves were stacked, and the card is the ground it stands on.
	 */
	.shelves {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 0.75rem;
		margin: 0;
		padding: 0;
	}

	/* `.door`'s four declarations, which is what makes the two pages read as
	   one site. A column rather than a block so a shelf with no rows still
	   fills the track its neighbours set. */
	.shelf {
		display: flex;
		flex-direction: column;
		padding: 0.9rem 1rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/*
	 * THE MARK SITS ON THE HEADING'S OWN LINE, aligned on the baseline rather
	 * than centred: the glyph and the name are set at different sizes, and it
	 * is their baselines that should agree — `.index-link`'s argument, one
	 * page over.
	 */
	.shelf-heading {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-family: var(--font-serif);
		font-size: 1.1rem;
		margin: 0 0 0.25rem;
	}

	/*
	 * `/schola`'s `.book-icon`, in its two load-bearing declarations: the
	 * accent at 75%, lighting to full where the row leads somewhere. A mark at
	 * full strength beside every heading is six marks competing with six
	 * names; at 75% it is a mark, and the difference is what hover has to say.
	 */
	.shelf-icon,
	.work-icon {
		flex: 0 0 auto;
		display: inline-grid;
		place-items: center;
		line-height: 1;
		color: var(--color-accent);
		opacity: 0.75;
	}

	/* `:has(a:hover)` and not `.shelf-heading:hover`, because the heading is a
	   flex row spanning the card: hovering the empty space to the right of a
	   short name would light a mark for a link the pointer is nowhere near.
	   The work rows need no such guard — there the anchor IS the row. */
	.shelf-heading:has(a:hover) .shelf-icon,
	.shelf-heading:has(a:focus-visible) .shelf-icon,
	.work-link:hover .work-icon,
	.work-link:focus-visible .work-icon {
		opacity: 1;
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
	   object here as in every other index on the site.
	 *
	 * `margin-block-start: auto` pushes the rows to the foot of the card, so
	 * the Learn shelf's two works line up with the bottom of whatever stands
	 * beside them in the row rather than floating in the middle of a stretched
	 * track. */
	.works {
		margin: auto 0 0;
		padding-block-start: 0.6rem;
	}

	.work {
		display: block;
		padding: 0.45rem 0 0;
		border-bottom: 0;
	}

	.work-link {
		display: flex;
		align-items: baseline;
		gap: 0.45rem;
	}

	.work-title {
		font-size: 1rem;
	}
</style>
