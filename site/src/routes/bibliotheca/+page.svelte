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
	 * The last card is Bookmarks, over a link to `/signata`. It sits IN the
	 * shelf grid rather than above it because it is the same object at that
	 * size: a name, a mark, a sentence, and a way in — and nothing about it
	 * needs to look different, since the thing that tells it apart is that it
	 * is the reader's own shelf and the sentence says so.
	 *
	 * IT IS UNCONDITIONAL, AND WAS HIDDEN WHILE THE STORE WAS EMPTY UNTIL
	 * 2026-09-06. Hiding it read as tidiness and was the opposite: this page is
	 * the catalogue of what the site HAS, marking is one of the things it does,
	 * and a door that opens only once you have already found the feature
	 * elsewhere is shut against exactly the reader who needed it. Nothing is
	 * behind it that the empty case cannot hold — `/signata` answers a reader
	 * with no marks in its own words (`bookmark.empty`, `bookmark.emptyHint`),
	 * which is a sentence, where a missing card is a silence.
	 *
	 * IT CARRIED A ROW OF COUNTS UNTIL 2026-09-06, one chip per section of
	 * `/signata` in that page's order, on the argument that the shape of what
	 * you have marked says more than a total about whether it is worth
	 * opening. It says that to the person who wrote it. On the page it was
	 * `1 1` — bare numbers with nothing naming what they counted, in the slot
	 * where every other card has a sentence, so the one card a reader could
	 * not read was the one about their own reading.
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
	 * translate into 37 languages and a second set to keep true. (The Social
	 * Doctrine's card is titled from `nav.socialDoctrine` rather than from its
	 * landing page — still a string a page already had, and the card's own note
	 * says why a grid wants the short name.)
	 *
	 * **THE EXCEPTIONS ARE BOTH ONE CARD'S**: `ccc.landing.pairTitle` and
	 * `ccc.landing.pairTagline`, because this is the only surface on the site
	 * that names the Catechism and its Compendium as one thing — `/schola`
	 * lists the two works separately and the `<head>` titles `/catechismus`
	 * after the Catechism alone. The title came first; the sentence followed it
	 * because `ccc.landing.tagline` is a masthead's two sentences and set six
	 * lines in a card. Both are English-only for now and fall back key by key,
	 * which is the cost of the exception rather than a gap in it.
	 *
	 * `docs/research/organization.md` is the design this implements.
	 */
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
			// `ccc.landing.pairTitle` and `ccc.landing.pairTagline` are the two
			// keys on this page written FOR this page: no other surface wants a
			// name or a sentence for the pair (`/schola` lists the two works
			// separately, the `<head>` titles `/catechismus` after the Catechism).
			// `ccc.landing.tagline` is still what `/catechismus` says of itself,
			// at a masthead's width; this is the same two facts in one clause,
			// because in a card it was six lines against its neighbours' three.
			// English only for now; `t()` falls back key by key.
			key: 'catechism',
			titleKey: 'ccc.landing.pairTitle',
			icon: 'book-marked',
			href: '/catechismus',
			taglineKey: 'ccc.landing.pairTagline',
			type: 'catechism'
		},
		{
			// THE NAV BAR'S NAME AND NOT THE LANDING PAGE'S, the one card here
			// titled from a different key than its `<head>`: "Compendium of the
			// Social Doctrine of the Church" was the longest name in the grid and
			// buried the two words a reader scans for in the middle of it. It is
			// still what `/doctrina-socialis` calls itself; `nav.socialDoctrine`
			// is the same work's short name and is already written in all 37
			// languages, so the card shortens without a string to translate.
			key: 'social',
			titleKey: 'nav.socialDoctrine',
			icon: 'users',
			href: '/doctrina-socialis',
			taglineKey: 'socialDoctrine.landing.tagline',
			type: 'social-doctrine'
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
			key: 'ius',
			titleKey: 'nav.canonLaw',
			icon: 'scale',
			href: '/ius-canonicum',
			taglineKey: 'canonLaw.landing.tagline',
			type: 'canon-law'
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

	// The identification, plus the one interface word in it — composed here and
	// passed down, the arrangement `Plate.svelte` argues for: the page that
	// knows what a picture is is the page that writes the line.
	const creditOf = (art: Artwork) => art.credit + (art.detail ? ` (${t('art.detail')})` : '');
</script>

<svelte:head>
	<title>{t('nav.library')} — {t('home.title')}</title>
</svelte:head>

<div class="landing-column">
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
				treatment, same sentence in the same place — and the sentence is
				`/signata`'s own tagline, so this card obeys the rule the other
				seven do rather than being the one that had to be looked at to be
				understood. One link and not a second copy of that page's list:
				this says what is there, and that page is the reading of it.

				No branch on the store, and there was one until 2026-09-06:
				a catalogue that omitted a shelf until the reader had already
				used it would be hiding the way in from the one person
				looking for it. The docblock has the rest.
			-->
			<li>
				<a class="shelf" href="/signata">
					<h3 class="shelf-heading">
						<span class="shelf-icon"><Icon name="bookmark" /></span>
						<span class="shelf-title">{t('bookmark.library')}</span>
					</h3>
					<span class="shelf-tagline">{t('bookmark.library.tagline')}</span>
				</a>
			</li>
		</ul>
	</section>

	<!--
		THE ONE PICTURE ON THIS PAGE, AND IT IS AT THE BOTTOM. Antonello's
		Jerome: a man alone in a room full of books, which is what a library is.
		It headed `/schola` until 2026-09-05 and moved here because that page is
		about being taught and this one is about what is on the shelf —
		`landing-art.ts` holds the swap and the credit.

		IT WAS THE MASTHEAD UNTIL 2026-09-06 and is a tailpiece now, which is a
		claim about what the page is for rather than about the painting: a reader
		arriving here wants the catalogue, and a 400px banner above the title put
		a picture between them and every door on the site. Decoration below the
		last card costs nothing and is still the right picture for the page.
		Behind the title was the other option and `landing-art.ts` rules it out —
		text over a painting has to hold its contrast across five appearance axes
		and does not need to.

		AND IT WAS RECROPPED THE SAME DAY, out of the 2.5:1 band a masthead
		wanted and into the painting's own 1.69:1. A banner is a strip and had
		to cut the room down to the shelf Jerome sits at; a tailpiece owes the
		slot no ratio, so it keeps the floor, the doorway and the arcade — which
		are what make the room a library rather than a desk. `assets/README.md`
		has the box.

		No `eager`: nothing above the fold now, so it loads lazily and the
		shelves have the connection to themselves. The credit stays where
		`ArtFigure` puts it, one press behind the `info` glyph — decoration is
		about where the picture sits in the page's argument, not about dropping
		the only line on the site that says whose painting it is.
	-->
	<div class="tailpiece">
		<ArtFigure
			art={BANNERS.bibliotheca}
			credit={creditOf(BANNERS.bibliotheca)}
			label={t('art.about')}
		/>
	</div>
</div>

<style>
	/*
	 * THE PICTURE IS A TAILPIECE, and the space above it is what says so. A
	 * banner is read as the page's subject; below the catalogue there is
	 * nothing left for it to be the subject OF, which is the whole point of
	 * moving it — the reader meets the shelves first and the painting after,
	 * the way a printed book closes a chapter with an ornament.
	 */
	.tailpiece {
		margin: 2.5rem 0 0;
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
		grid-auto-rows: 1fr;
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
	 * THE MARK SITS ON THE HEADING'S FIRST LINE, centred against it — and it
	 * used to be baseline-aligned, which is the wrong rule for a glyph even
	 * though it is the right one for two runs of text. A box with no text in it
	 * has no baseline of its own, so the flex line took its BOTTOM EDGE as one:
	 * a 1em square stood on the baseline and rose a full em, where the capitals
	 * beside it reach about seven tenths of that, and every mark on the page
	 * floated above its own name. `CopyrightNotice` documents the same fact
	 * about a bare inline `<svg>` and drops it by hand.
	 *
	 * A grid instead, so the glyph is centred in a box exactly ONE LINE tall
	 * (`1lh`, which is why `.shelf-icon` no longer sets a `line-height` of its
	 * own — the unit reads the heading's) and the box is placed at the START of
	 * the text column. Centring a line box against a line box needs no font
	 * metrics and no magic number, and the Catechism card is what needs the
	 * `start`: its title runs to two lines and the mark belongs beside the
	 * first, not halfway down both.
	 *
	 * An `<h3>` inside the anchor rather than a `<span>`, because the catalogue
	 * is seven named things and a reader moving by heading should meet all
	 * seven; `<a>` takes flow content, so this costs nothing.
	 */
	.shelf-heading {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		column-gap: 0.5rem;
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
		display: grid;
		place-items: center;
		block-size: 1lh;
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
</style>
