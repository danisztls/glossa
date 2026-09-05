<script lang="ts">
	/**
	 * `/schola` — what these books are, and orders for reading them.
	 *
	 * ## The reader this is for, and why nothing else on the site was them
	 *
	 * `docs/research/audiences.md` §5 is someone nine months into becoming
	 * Catholic who "has been told to 'read the Catechism' and has never held a
	 * reference work of this kind", and who stops "at the vocabulary of the
	 * corpus itself" — not knowing that the Compendium is a different and
	 * shorter book, or that the Summa is not magisterial. With §1 they are
	 * "plausibly most of the traffic". Every other page here answers an
	 * address. This one answers neither an address nor a question: it says what
	 * is on the shelf and in what order the Church has set it out.
	 *
	 * `Learn` pointed at `/catechismus` from the day the bar was rebuilt until
	 * this page existed, which was a label doing work the page behind it did
	 * not do — `/catechismus` is a table of divisions, and a reader who cannot
	 * name a division cannot use one.
	 *
	 * ## THE ROUTES ARE REPORTED, NOT RECOMMENDED
	 *
	 * `learning-routes.ts` holds the rule and the citations: every order here
	 * is one a document in this corpus states, and each carries the address
	 * that states it. The site sequences nothing on its own authority — which
	 * is also why the Council's sixteen documents are NOT a route here; that
	 * file's own note says what went and why.
	 *
	 * THE ONE EXCEPTION IS THE NOTE AT THE TOP, and it is marked. It
	 * recommends, which `docs/writing-descriptions.md` forbids of the
	 * descriptions — so it says whose it is on the page rather than leaving a
	 * reader to assume the Church said it. That is `PLAN.md` gap 16's general
	 * problem answered by hand in the one place this page creates it.
	 *
	 * ## What this page costs in translation, and what it does not
	 *
	 * Every step is titled by the corpus: a part's own heading, a book's own
	 * name in the reader's edition, a document's own title. So the steps are in
	 * the reader's content language already, and an ingestion cannot leave them
	 * stale. The `schola.*` keys are the page's own name, the route names, the
	 * sentence citing each source, and the sentences saying what kind of thing
	 * each shelf holds — the last of which is the section §5 actually stops at,
	 * and the only part of this page that is new writing rather than new
	 * arrangement.
	 *
	 * The shelf headings and every work's description below reuse keys that
	 * already exist in every dictionary, the same rule `/bibliotheca` and the
	 * home page's doors follow. **So do the pictures**: an artwork's caption is
	 * `Artist, Title, year. Institution.` and carries no sentence to translate
	 * (`schola-art.ts`), which is why ten of them cost one new key.
	 */
	import {
		getBook,
		getCccStructure,
		getCompendiumStructure,
		getPrayerMeta,
		getWork,
		hasBookIntro,
		listWorksOfType,
		socialDoctrineOutline,
		socialDoctrineWorkId
	} from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { content } from '$lib/content.svelte';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import { socialDoctrineHeadingHref } from '$lib/socialDoctrineNav';
	import { gospelsRoute, pillarsRoute, socialRoute } from '$lib/learning-routes';
	import { BANNERS, VIGNETTES, type Artwork } from '$lib/schola-art';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode, WorkType } from '$lib/types';

	// --- The four pillars ---------------------------------------------------
	//
	// `catechismPairLang` for the same reason `/catechismus` uses it: six
	// languages carry one of the two works and not the other, and resolving
	// each separately puts an English column beside the reader's own.
	const pairLang = $derived(content.catechismPairLang());
	const cccWork = $derived(getWork(`ccc.${pairLang}`));
	const compendiumWork = $derived(getWork(`compendium.${pairLang}`));
	const columns = $derived([
		...(cccWork ? (['ccc'] as const) : []),
		...(compendiumWork ? (['compendium'] as const) : [])
	]);
	const treeWork = $derived(cccWork ? 'ccc' : 'compendium');
	const pillarTree = $derived(
		cccWork ? getCccStructure(pairLang) : getCompendiumStructure(pairLang)
	);
	const pillarPairs = $derived(
		cccWork && compendiumWork
			? pairDivisionsCached(pillarTree, getCompendiumStructure(pairLang))
			: new Map<StructureNode, StructureNode>()
	);

	// A prayer is offered under the pillar it IS, and only where the reader's
	// own prayer edition carries it — `prayer.common.en-gb` holds five.
	const prayerLang = $derived(content.langFor('prayer'));
	const prayerOffer = $derived((slug: string) => {
		const meta = getPrayerMeta(prayerLang, slug);
		return meta ? { href: hrefFor({ kind: 'prayer', slug }), label: meta.title } : undefined;
	});

	// --- The Gospels --------------------------------------------------------
	const bibleWorkId = $derived(content.workIdFor('bible'));
	const bibleLang = $derived(content.langFor('bible'));

	// --- The social doctrine ------------------------------------------------
	const socialLang = $derived(content.langFor('social-doctrine'));
	// The work's own name, so `socialRoute` can tell the masthead row from a
	// part. Read from the edition the reader is on, never written down: the row
	// it has to match is that edition's own heading.
	const socialTitle = $derived(getWork(socialDoctrineWorkId(socialLang))?.title);

	const routes = $derived(
		[
			pillarsRoute({
				tree: pillarTree,
				treeWork,
				lang: pairLang,
				columns,
				pairs: pillarPairs,
				labels: {
					cccTitle: t('ccc.landing.title'),
					compendiumTitle: t('compendium.landing.title')
				},
				prayer: prayerOffer
			}),
			gospelsRoute({
				nameOf: (osis) => (bibleWorkId ? getBook(bibleWorkId, osis)?.name : undefined),
				hasIntro: (osis) => hasBookIntro(bibleLang, osis),
				// Dei Verbum on the reading of Scripture. Addressed as the whole
				// document rather than a section: the Constitution's last chapter
				// is the passage, and a fragment into a chapter is a worse
				// citation than the document a reader can then read.
				source: hrefFor({ kind: 'document', slug: 'dei-verbum' })
			}),
			socialRoute({
				outline: socialDoctrineOutline(socialLang),
				hrefAt: (n) => socialDoctrineHeadingHref(socialLang, n),
				mastheadTitle: socialTitle,
				// The Compendium's own statement of its plan.
				source: hrefFor({ kind: 'socialDoctrine', n: 8 })
			})
			// A route whose work this corpus does not carry is not shown at all,
			// rather than shown empty: the page is a description of what is here.
		].filter((route) => route.steps.length > 0)
	);

	/**
	 * THE SHELVES, BY WHAT KIND OF THING THEY HOLD — which is the axis
	 * `/bibliotheca` deliberately does not sort on. That page is the catalogue
	 * and groups by subject; this one answers "what am I looking at, and what
	 * authority does it carry", which is where §5 stops.
	 *
	 * A shelf's heading is its own link, and any second work on it is a row —
	 * `/bibliotheca`'s idiom, and the reason every string here already exists
	 * in every dictionary.
	 */
	const SHELVES = [
		{
			key: 'scripture',
			headingKey: 'nav.bible',
			href: '/scriptura',
			type: 'bible',
			works: []
		},
		{
			key: 'catechism',
			headingKey: 'nav.ccc',
			href: '/catechismus',
			type: 'catechism',
			works: [
				{
					href: '/catechismus/compendium',
					titleKey: 'compendium.landing.title',
					taglineKey: 'compendium.landing.tagline',
					type: 'compendium'
				}
			]
		},
		{
			key: 'magisterium',
			headingKey: 'nav.magisterium',
			href: '/documenta',
			type: 'document',
			works: [
				{
					href: '/doctrina-socialis',
					titleKey: 'socialDoctrine.landing.title',
					taglineKey: 'socialDoctrine.landing.tagline',
					type: 'social-doctrine'
				}
			]
		},
		{
			key: 'law',
			headingKey: 'nav.canonLaw',
			href: '/ius-canonicum',
			type: 'canon-law',
			works: []
		},
		{
			key: 'theologian',
			headingKey: 'doctores.landing.title',
			href: '/doctores',
			type: 'summa',
			works: [
				{
					href: '/doctores/summa',
					titleKey: 'summa.landing.title',
					taglineKey: 'summa.landing.tagline',
					type: 'summa'
				}
			]
		},
		{
			key: 'prayers',
			headingKey: 'nav.prayers',
			href: '/preces',
			type: 'prayer',
			works: []
		}
	] as const;

	const has = (type: string) => listWorksOfType(type as WorkType).length > 0;
	const shelves = $derived(SHELVES.filter((shelf) => has(shelf.type)));
</script>

<svelte:head>
	<title>{t('schola.landing.title')} — {t('home.title')}</title>
</svelte:head>

<!--
	One figure shape for all ten works. `alt=""` with the identification in the
	caption is `Plate.svelte`'s arrangement and its argument: the picture is not
	information the page would be incomplete without, and a screen reader that
	reads the same line twice is worse served than one that reads it once.

	`eager` is passed for the hero alone. Everything else is below the fold on
	every viewport, and `loading="lazy"` with the intrinsic size declared means
	the browser reserves the box and fetches nothing until the reader arrives.
-->
{#snippet plate(art: Artwork, eager: boolean)}
	<img
		class="plate"
		class:paper={art.paper}
		src={art.src}
		width={art.width}
		height={art.height}
		alt=""
		loading={eager ? 'eager' : 'lazy'}
		decoding="async"
	/>
{/snippet}

{#snippet credit(art: Artwork)}
	{art.credit}{art.detail ? ` (${t('schola.art.detail')})` : ''}
{/snippet}

<div class="content-column">
	<figure class="masthead">
		{@render plate(BANNERS.hero, true)}
		<figcaption>{@render credit(BANNERS.hero)}</figcaption>
	</figure>

	<h1>{t('schola.landing.title')}</h1>
	<p class="page-tagline">{t('schola.landing.tagline')}</p>

	<!-- The one paragraph on this site that recommends rather than describes,
	     and it says so underneath. Not an `<aside>` styled to look like a
	     pull-quote: it is addressed to the reader as directly as anything here,
	     and only its AUTHORSHIP is set apart. -->
	<section class="house-note" aria-labelledby="house-note-heading">
		<h2 id="house-note-heading" class="visually-hidden">{t('schola.start.attribution')}</h2>
		<p>{t('schola.start.body')}</p>
		<p class="attribution">{t('schola.start.attribution')}</p>
	</section>

	{#each routes as route (route.key)}
		<section class="route" aria-labelledby="route-{route.key}">
			{#if BANNERS[route.key]}
				<figure class="route-plate">
					{@render plate(BANNERS[route.key], false)}
					<figcaption>{@render credit(BANNERS[route.key])}</figcaption>
				</figure>
			{/if}
			<h2 id="route-{route.key}">{t(`schola.route.${route.key}.title`)}</h2>
			<!-- The citation is the route's warrant, so it is a link and not a
			     caption: a reader who doubts that this order is the Church's and
			     not ours can go and read the paragraph that sets it out. -->
			<p class="route-source">
				<a href={route.source}>{t(`schola.route.${route.key}.source`)}</a>
			</p>
			<ol class="steps">
				{#each route.steps as step (step.href)}
					<li>
						<a class="step" href={step.href}>{step.label}</a>
						{#if step.offers.length}
							<span class="offers">
								{#each step.offers as offer (offer.href)}
									<a class="chip" href={offer.href} title={offer.title}>
										{offer.label ?? t(offer.labelKey ?? '')}
									</a>
								{/each}
							</span>
						{/if}
						<!-- Set by nothing today; `RouteStep.description` says why the
						     field is there. -->
						{#if step.description}
							<p class="step-description">{step.description}</p>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	<section class="shelves" aria-labelledby="shelves-heading">
		<h2 id="shelves-heading">{t('schola.kinds.heading')}</h2>
		<div class="shelf-grid">
			{#each shelves as shelf (shelf.key)}
				<div class="shelf">
					{#if VIGNETTES[shelf.key]}
						{@render plate(VIGNETTES[shelf.key], false)}
					{/if}
					<div class="shelf-text">
						<h3><a href={shelf.href}>{t(shelf.headingKey)}</a></h3>
						<p class="shelf-kind">{t(`schola.kind.${shelf.key}`)}</p>
						{#if shelf.works.some((work) => has(work.type))}
							<ul>
								{#each shelf.works.filter((work) => has(work.type)) as work (work.href)}
									<li>
										<a href={work.href}>{t(work.titleKey)}</a>
										<!-- `{@html}` on the same terms as the home page's doors:
										     every string is a literal in a checked-in dictionary,
										     named by a key in this file, and nothing is passed
										     through from the corpus or from a URL. Three of these
										     taglines emphasise a work's name inside the sentence. -->
										<span class="work-tagline">{@html t(work.taglineKey)}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{/each}
		</div>
		<!-- The six vignettes share one credit line rather than each carrying a
		     caption: a five-line card with a two-line attribution under a 5rem
		     picture is a card about its own picture. -->
		<p class="art-credits">
			{#each shelves as shelf, i (shelf.key)}{#if VIGNETTES[shelf.key]}{i > 0
						? ' · '
						: ''}{@render credit(VIGNETTES[shelf.key])}{/if}{/each}
		</p>
	</section>
</div>

<style>
	/*
	 * THE MASTHEAD IS ABOVE THE TITLE, NOT BEHIND IT. Text over a painting has
	 * to hold its contrast across five appearance axes — light, sepia, dark,
	 * OLED and monochrome — and none of them is negotiable on a page whose
	 * readers are the ones least able to work around a bad one. A band above
	 * the title costs nothing and survives all five.
	 */
	.masthead {
		margin: 0 0 1.5rem;
	}

	.masthead .plate,
	.route-plate .plate {
		border-radius: var(--radius-md);
	}

	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
	}

	.page-tagline {
		max-width: 40rem;
	}

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
	 * A PAINTING MUST NOT TAKE `--plate-blend`. That token multiplies a grey
	 * scan's white paper away into the page and is tuned for exactly that; an
	 * oil painting put through it goes to mud. Only the works `schola-art.ts`
	 * marks `paper` — ink on a white sheet — get it. All of them take the
	 * dark-mode dim, which is a brightness step and not an inversion, because
	 * a picture is not a diagram.
	 */
	.plate {
		display: block;
		inline-size: 100%;
		block-size: auto;
		filter: var(--plate-filter);
	}

	.plate.paper {
		mix-blend-mode: var(--plate-blend);
	}

	/*
	 * Monochrome is a reader's explicit request for one grey ramp
	 * (`tokens.css`: "decoration is a cost paid on every page by a reader who
	 * wanted a palette"). Four colour paintings would be the loudest thing on
	 * the page in the one mode that asked for none.
	 */
	:global(html[data-mono]) .plate {
		filter: var(--plate-filter) grayscale(1);
	}

	figcaption {
		margin-block-start: 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
		text-align: center;
		text-wrap: pretty;
	}

	/* The note is set off by a rule on its inline start rather than by a box:
	   a card would make it look like a callout the works below produced, and
	   what it needs to look like is somebody talking. */
	.house-note {
		margin: 1.75rem 0 2.5rem;
		padding-inline-start: 1rem;
		border-inline-start: 3px solid var(--color-accent);
		max-width: 40rem;
	}

	.house-note p {
		margin: 0;
	}

	.attribution {
		margin-top: 0.4rem !important;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.route-plate {
		margin: 2.5rem 0 0;
	}

	section h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 2.25rem 0 0.4rem;
	}

	/* A route's own heading sits under its picture and needs no second gap. */
	.route-plate + h2 {
		margin-top: 1rem;
	}

	.route-source {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		max-width: 40rem;
	}

	/*
	 * THE NUMERAL IS IN A GUTTER, NOT IN THE TEXT. An `<ol>`'s own marker sits
	 * against the first line, so a title that wraps loses its left edge; a
	 * counter in a fixed serif column gives every step the same one whatever
	 * its title does, which is what makes routes of very different title
	 * lengths read as one list.
	 */
	.steps {
		list-style: none;
		counter-reset: step;
		margin: 0;
		padding: 0;
	}

	.steps li {
		counter-increment: step;
		position: relative;
		padding: 0.55rem 0 0.55rem 2.4rem;
		border-bottom: 1px solid var(--color-border);
	}

	.steps li:last-child {
		border-bottom: 0;
	}

	.steps li::before {
		content: counter(step);
		position: absolute;
		inset-inline-start: 0;
		inline-size: 1.8rem;
		text-align: end;
		font-family: var(--font-serif);
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
	}

	/*
	 * Muted until hovered, `.index-row`'s rule. A column of destinations set in
	 * link colour and underlined is the wall this page had; the ruled row is
	 * already obviously a row, and colour is what says which one the pointer
	 * is on.
	 */
	.step {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		color: var(--color-text);
		text-decoration: none;
	}

	.step:hover,
	.step:focus-visible {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.offers {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-inline-start: 0.5rem;
		vertical-align: 0.05em;
	}

	/* The chips state a second offer on the same step and must never outweigh
	   the step itself — `¶1–1065` beside "Part One" is a range, not a rival
	   destination. Outlined and never filled, `components.css`'s rule: a
	   filled badge repeated down a list reads as a row of marks. */
	.chip {
		display: inline-block;
		padding: 0.05rem 0.4rem;
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		text-decoration: none;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.chip:hover,
	.chip:focus-visible {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.step-description {
		margin: 0.3rem 0 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		max-width: 40rem;
	}

	/*
	 * TWO COLUMNS AT THE SITE'S OWN READING BREAKPOINT and one below it.
	 * `80rem` is where `layout.css` hands the reading grid its aside; reusing
	 * it rather than inventing a number keeps the site to one idea of "wide".
	 */
	.shelf-grid {
		display: grid;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	@media (min-width: 80rem) {
		.shelf-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	/*
	 * The card is the home page's door: elevated ground, hairline border, one
	 * radius, no shadow — `--shadow-panel` is for things that float. Only the
	 * border moves on hover, never the whole surface.
	 */
	.shelf {
		display: flex;
		gap: 0.9rem;
		align-items: flex-start;
		padding: 0.9rem 1rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.shelf:hover {
		border-color: var(--color-accent);
	}

	.shelf .plate {
		flex: 0 0 auto;
		inline-size: 5rem;
		block-size: 5rem;
		border-radius: var(--radius-sm);
	}

	.shelf-text {
		min-width: 0;
	}

	.shelf h3 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		margin: 0 0 0.2rem;
	}

	.shelf-kind {
		margin: 0;
		font-size: 0.9rem;
	}

	.shelf ul {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
	}

	.shelf li {
		margin-bottom: 0.4rem;
	}

	.work-tagline {
		display: block;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.art-credits {
		margin: 1.25rem 0 0;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		text-wrap: pretty;
	}

	/*
	 * A plate PRINTS, on `Plate.svelte`'s reasoning: paper is white, so the
	 * blend has nothing to blend with and the dark dim would only waste ink.
	 */
	@media print {
		.plate {
			mix-blend-mode: normal;
			filter: none;
			break-inside: avoid;
		}

		.shelf {
			background: none;
			break-inside: avoid;
		}
	}
</style>
