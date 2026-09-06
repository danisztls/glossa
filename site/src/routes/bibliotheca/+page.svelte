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
	 * ## A catalogue, and one card that is not a work
	 *
	 * The last card is Bookmarks — `bookmarkGroup`'s counts in `/signata`'s own
	 * section order, over a link to it. It sits IN the shelf grid rather than
	 * above it because it is the same object at that size: a name, a mark, and
	 * a way in. What tells it apart is that it is the only card whose subtitle
	 * is a row of numbers.
	 *
	 * **THE READING POSITIONS ARE NOT HERE, AND THE TRAIL IS THE ARGUMENT.**
	 * "Continue reading" was on the home page beside the doors, moved here on
	 * 2026-09-06 when it turned out to be a section EMPTY for every first-time
	 * reader, and moved on to `/signata` the same day. Marks and positions
	 * answer one question — take me back to where I was — and splitting them
	 * across two pages meant a returning reader had to know which of the two
	 * had kept their place. `/signata` holds both; this page links to it. The
	 * key was renamed twice on the way and is `reading.continue` now, named for
	 * the module rather than for a page, which is what stops the third rename.
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
	import { bookmarks } from '$lib/bookmarks.svelte';
	import { bookmarkGroup } from '$lib/bookmarkContent';
	import { listWorksOfType } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import { BANNERS, type Artwork } from '$lib/landing-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/components/Icon.svelte';
	import type { WorkType } from '$lib/types';

	/**
	 * ONE CARD, and there is no longer a second shape under it.
	 *
	 * A shelf could hold nested `works` until 2026-09-06 and exactly one did —
	 * Learn, over the Catechism pair and the Social Doctrine — so the whole
	 * apparatus (an `Entry` type, a `works` array, a row list inside a card,
	 * four rules of CSS pulling `.index-row` back into a block) existed for one
	 * group of two. Unfolded, they are two more cards in the same grid, which
	 * is what they always looked like to the reader.
	 */
	interface Shelf {
		key: string;
		titleKey: string;
		/** THE SAME GLYPH `/schola` GIVES THAT WORK, and taken from there rather
		 *  than chosen again: the two pages name the same eight things, and a
		 *  reader who has learned a mark on one of them has learned it. */
		icon: IconName;
		href: string;
		taglineKey: string;
		/** The work type that has to be in this build for the card to mean
		 *  anything. A partial sync or the vitest fixtures may carry some. */
		type: WorkType;
	}

	/**
	 * The seven cards, in the order a reader meets the Church's texts.
	 *
	 * THERE IS NO "LEARN" SHELF ANY MORE and the taxonomy argument it carried
	 * went with it. It held the Catechism pair and the Compendium of the Social
	 * Doctrine, and the Social Doctrine had moved three times before landing
	 * there — beside the Magisterium, then under it, then under Learn — on the
	 * reasoning that this page groups by FORM (synthesis read THROUGH, against
	 * dated acts cited SINGLY) and that both works are syntheses. All of that
	 * is still true and none of it needs a container: with one card per work
	 * the ORDER states the same sequence, and a group of two was a heading
	 * doing the work a position in a list already does. What the address space
	 * says is unchanged and is the durable form of the argument —
	 * `/doctrina-socialis/{n}` and `/doctrina-socialis/caput/{n}` mirror
	 * `/catechismus/{n}` and `/catechismus/caput/{n}`, while the Code is cited
	 * by canon and a document by section.
	 *
	 * A CARD IS STILL NAMED FOR ITS FLAGSHIP AND HOLDS WHAT IS AROUND IT.
	 * Scriptura holds Haydock and the book introductions, neither of which is
	 * Scripture; the Catechism's card holds its Compendium. That was the one
	 * thing the shelf shape was genuinely good for, and it survives as a name.
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
			// THE PAIR UNDER ONE NAME. `/catechismus` is the index of both works
			// and not of the Catechism alone, which is what `ccc.landing.tagline`
			// has always said in the sentence under it — so the Compendium of the
			// Catechism has no card of its own and needs none.
			//
			// `ccc.landing.pairTitle` is the one key on this page written FOR
			// this page: no other surface wants a name for the pair (`/schola`
			// lists the two works separately, the `<head>` titles `/catechismus`
			// after the Catechism). English only for now; `t()` falls back key by
			// key.
			key: 'catechism',
			titleKey: 'ccc.landing.pairTitle',
			icon: 'book-marked',
			href: '/catechismus',
			taglineKey: 'ccc.landing.tagline',
			type: 'catechism'
		},
		{
			key: 'social',
			titleKey: 'socialDoctrine.landing.title',
			icon: 'users',
			href: '/doctrina-socialis',
			taglineKey: 'socialDoctrine.landing.tagline',
			type: 'social-doctrine'
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
			// THE CARD THE NAV BAR CANNOT CARRY. `+layout.svelte` leaves
			// `/doctores` unlisted because the Summa awaits its quality pass and
			// the shelf holds nothing else; in a bar that is invisibility, since
			// a bar has no room for a caveat. Here the caveat is the card's own
			// sentence, which is why the argument for hiding it does not reach
			// this page — and why the Summa's own row went on 2026-09-06: two
			// links to one unread work is one more than a caveat can carry, and
			// the row was the one that jumped past it into the text.
			key: 'doctores',
			titleKey: 'doctores.landing.title',
			icon: 'feather',
			href: '/doctores',
			taglineKey: 'doctores.landing.tagline',
			type: 'summa'
		}
	];

	const has = (type: WorkType) => listWorksOfType(type).length > 0;

	const shelves = $derived(SHELVES.filter((shelf) => has(shelf.type)));

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

	<section aria-labelledby="catalogue-heading">
		<h2 id="catalogue-heading" class="visually-hidden">{t('nav.library')}</h2>
		<!--
			A GRID OF CARDS AND A LIST IN THE MARKUP. The shelves were stacked
			blocks down a 72rem column, which is a column of headings with an
			ocean to the right of each; they are the home page's `.door` grid
			now, which is the same object one level up — a name, a sentence, and
			a way in. `<ul>`/`<li>` rather than the `<section aria-labelledby>`
			each shelf used to be: what the reader is looking at is a list of
			cards, the `<h3>`s still make the outline, and a `<section>` inside
			every `<li>` would be a landmark per card announcing nothing the
			heading does not.

			EVERY CARD IS ONE ANCHOR NOW, which it could not be while the Learn
			shelf held rows of its own: an anchor inside an anchor is ambiguous
			before it is invalid, so the heading was the target and the rest of
			the card was inert. Unfolded, this is the home page's `.door`
			exactly — the whole card is the link, and the space between its name
			and its sentence is part of the target.
		-->
		<ul class="shelves">
			{#each shelves as shelf (shelf.key)}
				<li>
					<a class="shelf" href={shelf.href}>
						<h3 class="shelf-heading">
							<!-- Decorative, which `Icon.svelte` enforces rather than
							     offering: the name beside it is the label. -->
							<span class="shelf-icon"><Icon name={shelf.icon} /></span>
							<span class="shelf-title">{t(shelf.titleKey)}</span>
						</h3>
						<!-- `{@html}` on the same terms as `/catechismus`'s masthead:
						     every string here is a literal in a checked-in dictionary,
						     named by a key in this file, and nothing is passed through
						     from the corpus or from a URL. -->
						<span class="shelf-tagline">{@html t(shelf.taglineKey)}</span>
					</a>
				</li>
			{/each}

			<!--
				THE ONE CARD THAT IS NOT A WORK, and it is last because the
				catalogue is what the page is for. Same card, same glyph
				treatment; what it carries instead of a sentence is how much is
				there and in which of `/signata`'s sections — a bare total says
				nothing about whether it is worth opening. One link and not a
				second copy of that page's list: this says how much and where,
				and that page is the reading of it.

				Absent until mount and absent for a reader who has marked
				nothing, which the `auto-fit` grid needs no branch for — the
				last cell simply is not there.
			-->
			{#if markedGroups.length > 0}
				<li>
					<a class="shelf" href="/signata">
						<h3 class="shelf-heading">
							<span class="shelf-icon"><Icon name="bookmark" /></span>
							<span class="shelf-title">{t('bookmark.library')}</span>
						</h3>
						<span class="marked-counts">
							{#each markedGroups as group, i (i)}
								<span class="chip">{group.count}</span>
							{/each}
						</span>
					</a>
				</li>
			{/if}
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

	/* THE ONE `h2` LEFT ON THIS PAGE IS HIDDEN, so the rule that set the
	   visible ones — serif, 1.3rem, on a rule — went with the sections it set.
	   It had two subjects, "Continue reading" and "Bookmarks"; the first is on
	   `/signata` now and the second is a card. `/signata` keeps the same
	   declarations, where they still have headings to set. */

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
	 * same card — and since 2026-09-06 the same ANCHOR too, the whole card
	 * being the target rather than the heading inside it. That was impossible
	 * while one shelf held rows of its own; unfolding Learn is what made these
	 * two pages literally the same object rather than a resemblance.
	 *
	 * `minmax(16rem, 1fr)` against the doors' 15rem, which is the one number
	 * that is not shared: a work's tagline is a sentence where a door's is a
	 * phrase, and at 15 the longest of them took eight lines.
	 */
	.shelves {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 0.75rem;
		margin: 0;
		padding: 0;
	}

	/* `.door`'s own declarations, so the two pages read as one site. `height:
	   100%` rather than a stretched item's default, because the `<li>` is what
	   the grid stretches and the anchor inside it has to be told to follow —
	   without it a short card's target stops above the bottom of its own
	   outline. */
	.shelf {
		display: block;
		height: 100%;
		padding: 0.9rem 1rem;
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.shelf:hover,
	.shelf:focus-visible {
		border-color: var(--color-accent);
	}

	/*
	 * THE MARK SITS ON THE HEADING'S OWN LINE, aligned on the baseline rather
	 * than centred: the glyph and the name are set at different sizes, and it
	 * is their baselines that should agree — `.index-link`'s argument, one page
	 * over. An `<h3>` inside the anchor rather than a `<span>`, because the
	 * catalogue is seven named things and a reader moving by heading should
	 * meet all seven; `<a>` takes flow content, so this costs nothing.
	 */
	.shelf-heading {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-family: var(--font-serif);
		font-size: 1.15rem;
		font-weight: inherit;
		margin: 0;
	}

	/*
	 * `/schola`'s `.book-icon`, in its two load-bearing declarations: the
	 * accent at 75%, lighting to full where the card is under the pointer. A
	 * mark at full strength beside every heading is seven marks competing with
	 * seven names; at 75% it is a mark, and the difference is what hover has to
	 * say. No `:has()` guard is needed now that the whole card is the anchor —
	 * anywhere the mark lights, the pointer is on the target.
	 */
	.shelf-icon {
		flex: 0 0 auto;
		display: inline-grid;
		place-items: center;
		line-height: 1;
		color: var(--color-accent);
		opacity: 0.75;
	}

	.shelf:hover .shelf-icon,
	.shelf:focus-visible .shelf-icon {
		opacity: 1;
	}

	.shelf:hover .shelf-title,
	.shelf:focus-visible .shelf-title {
		color: var(--color-accent);
	}

	.shelf-tagline {
		display: block;
		margin-top: 0.3rem;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	/* Where the marks card carries its counts, in the place a work card puts
	   its sentence — so the two line up down the grid rather than one card's
	   numbers floating against its neighbour's prose. Tabular figures because
	   they are a column of numbers even when they are a row. */
	.marked-counts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.45rem;
	}

	.marked-counts .chip {
		font-variant-numeric: tabular-nums;
		padding-inline: 0.35rem;
	}
</style>
