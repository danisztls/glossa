<script lang="ts">
	/**
	 * `/schola` — a short guide to the site: what is on it, how each work is
	 * cited, how to find a passage, and orders for reading.
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
	 * is on the shelf, what a citation of it looks like, and what the chrome
	 * around the text does.
	 *
	 * `Learn` pointed at `/catechismus` from the day the bar was rebuilt until
	 * this page existed, which was a label doing work the page behind it did
	 * not do — `/catechismus` is a table of divisions, and a reader who cannot
	 * name a division cannot use one.
	 *
	 * ## THE REFERENCE SYSTEM IS THE PART NOBODY ELSE TEACHES
	 *
	 * The corpus is addressed by number — `CCC 1`, `Comp. 1`, `Can. 1`,
	 * `STh I, 1` — and the jump box reads every one of those notations
	 * (`suggest.ts`). A reader who has never seen a citation of the Catechism
	 * does not know that the number is a PARAGRAPH and runs unbroken from the
	 * first page to the last, and no page on this site said so. That is the
	 * whole of §5's "vocabulary of the corpus itself", and it is what the books
	 * section below exists to state: one sentence on what a work is, one on
	 * what its numbered unit is called, and a worked example that is a link.
	 *
	 * **EVERY EXAMPLE IS CHECKED AGAINST THE CORPUS BEFORE IT IS OFFERED AS A
	 * LINK.** `citations` asks the same existence predicate the jump box asks
	 * (`cccParagraphExists`, `canonLawCanonExists`, `summaQuestionExists`, …),
	 * and where the answer is no the notation is still shown and simply is not
	 * a link. A guide whose worked example 404s teaches the reader that they
	 * have misunderstood the notation.
	 *
	 * The Bible's example is DERIVED rather than written down: the book's
	 * abbreviation comes from this language's own citation table
	 * (`bookAbbrev`), falling back to the reader's edition's name for the book,
	 * and the chapter/verse separator from the same grammar the parser uses —
	 * so a Portuguese reader is shown `Jo 3,16` and not somebody else's colon.
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
	 * problem answered by hand in the one place this page creates it. **A
	 * second such paragraph would need the same mark**, which is why nothing in
	 * the guide below tells a reader which book to prefer.
	 *
	 * ## What this page costs in translation, and what it does not
	 *
	 * Every route step is titled by the corpus: a part's own heading, a book's
	 * own name in the reader's edition, a document's own title. So the steps
	 * are in the reader's content language already, and an ingestion cannot
	 * leave them stale. Every work's NAME below is the key that work's own
	 * landing page is titled by, and every feature's name is the key its own
	 * control is labelled by — so the page names nothing twice.
	 *
	 * What is genuinely new writing is the sentences: what each work is, what
	 * its unit of citation is, and what each feature does. That is the part §5
	 * stops at, and it is the reason `/schola` is still out of `CHROME_PATHS`
	 * (`route-manifest.ts`).
	 *
	 * **The pictures cost two keys between them**: an artwork's caption is
	 * `Artist, Title, year. Institution.` and carries no sentence to translate
	 * (`schola-art.ts`) — the word "detail" and the name of the control that
	 * shows a credit.
	 *
	 * ## THIS IS A LANDING PAGE AND IS LAID OUT AS ONE
	 *
	 * `.landing-column`, not `.content-column`: `layout.css` carries the
	 * argument, which is that `--content-width` is a count of CHARACTERS and
	 * this page's content is banners, two grids and a numbered list. The prose
	 * that is still prose keeps a measure of its own through
	 * `.landing-measure`. `/`, `/bibliotheca` and `/documenta` are the same
	 * kind of page and take the same column.
	 */
	import {
		canonLawCanonExists,
		cccParagraphExists,
		compendiumQuestionExists,
		getBook,
		getCccStructure,
		getCompendiumStructure,
		getDocumentGroup,
		getPrayerMeta,
		getWork,
		hasBookIntro,
		listPrayerMeta,
		listWorksOfType,
		socialDoctrineOutline,
		socialDoctrineParagraphExists,
		socialDoctrineWorkId,
		summaQuestionExists
	} from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { bookAbbrev, grammarSurface } from '$lib/refs-grammar';
	import { content } from '$lib/content.svelte';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import { socialDoctrineHeadingHref } from '$lib/socialDoctrineNav';
	import { gospelsRoute, pillarsRoute, socialRoute } from '$lib/learning-routes';
	import { BANNERS, type Artwork } from '$lib/schola-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { StructureNode, WorkType } from '$lib/types';

	// The identification, plus the one interface word in it. Composed here and
	// passed down for the reason `Plate.svelte` gives about its own credit: the
	// page that knows what a picture is is the page that writes the line, and
	// `ArtFigure` then needs no dictionary of its own.
	const creditOf = (art: Artwork) =>
		art.credit + (art.detail ? ` (${t('schola.art.detail')})` : '');

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
	 * THE CHROME, NAMED BY ITS OWN CONTROLS. Every `nameKey` here is the key
	 * the button, menu or page it describes is already labelled by, so a reader
	 * who reads this row and then goes looking for it finds the same word — and
	 * so a translated interface never disagrees with its own guide. Only the
	 * sentence is written here.
	 *
	 * `href` where the feature IS a page and nothing where it is a control on
	 * one: a link to "the settings menu" would have to open a menu that lives
	 * in the header of whatever page the reader is on, and there is no address
	 * for that.
	 */
	interface Feature {
		key: string;
		icon: IconName;
		nameKey: string;
		/** Set only where the feature IS a page. */
		href?: string;
	}

	const FEATURES: readonly Feature[] = [
		{ key: 'search', icon: 'search', nameKey: 'jumpbox.short' },
		{ key: 'library', icon: 'book-open', nameKey: 'nav.library', href: '/bibliotheca' },
		{ key: 'languages', icon: 'languages', nameKey: 'lang.label' },
		{ key: 'compare', icon: 'columns-2', nameKey: 'compare.enter' },
		{ key: 'apparatus', icon: 'notebook-pen', nameKey: 'apparatus.label' },
		{ key: 'marks', icon: 'bookmark', nameKey: 'bookmark.library', href: '/signata' },
		{ key: 'settings', icon: 'sliders-horizontal', nameKey: 'settings.label' },
		{ key: 'calendar', icon: 'calendar', nameKey: 'nav.calendar', href: '/calendarium' },
		{ key: 'offline', icon: 'download', nameKey: 'install.label' }
	];

	/**
	 * THE BOOKS, BY WHAT KIND OF THING THEY HOLD — which is the axis
	 * `/bibliotheca` deliberately does not sort on. That page is the catalogue
	 * and groups by subject; this one answers "what am I looking at, what
	 * authority does it carry, and what does a citation of it look like",
	 * which is where §5 stops.
	 *
	 * FLAT, one row per work, where this was six shelves with the Compendium
	 * of the Catechism, the Compendium of the Social Doctrine and the Summa
	 * nested under the shelf they belong to. Nesting is right for a catalogue
	 * and wrong here: a nested work got its parent's definition and no
	 * citation form of its own, and those three are precisely the works a
	 * newcomer has heard named and cannot place.
	 *
	 * Each is titled by the key its own landing page is titled by, so no name
	 * on this page is written twice.
	 */
	const WORKS = [
		{
			key: 'scripture',
			icon: 'scroll' as IconName,
			titleKey: 'bible.landing.title',
			href: '/scriptura',
			type: 'bible'
		},
		{
			key: 'catechism',
			icon: 'book-marked' as IconName,
			titleKey: 'ccc.landing.title',
			href: '/catechismus',
			type: 'catechism'
		},
		{
			key: 'compendium',
			icon: 'messages-square' as IconName,
			titleKey: 'compendium.landing.title',
			href: '/catechismus/compendium',
			type: 'compendium'
		},
		{
			key: 'magisterium',
			icon: 'landmark' as IconName,
			titleKey: 'nav.magisterium',
			href: '/documenta',
			type: 'document'
		},
		{
			key: 'social',
			icon: 'users' as IconName,
			titleKey: 'socialDoctrine.landing.title',
			href: '/doctrina-socialis',
			type: 'social-doctrine'
		},
		{
			key: 'law',
			icon: 'scale' as IconName,
			titleKey: 'canonLaw.landing.title',
			href: '/ius-canonicum',
			type: 'canon-law'
		},
		{
			key: 'doctors',
			icon: 'feather' as IconName,
			titleKey: 'doctores.landing.title',
			href: '/doctores',
			type: 'summa'
		},
		{
			key: 'prayers',
			icon: 'flame' as IconName,
			titleKey: 'prayers.landing.title',
			href: '/preces',
			type: 'prayer'
		}
	] as const;

	const has = (type: string) => listWorksOfType(type as WorkType).length > 0;
	const works = $derived(WORKS.filter((work) => has(work.type)));

	/**
	 * The worked example beside each work: the notation, and the address it
	 * reaches when that address exists.
	 *
	 * THE NUMBER IS THE LOWEST ONE, and deliberately: `CCC 1` and `Can. 1` are
	 * the units every edition of those works has, so the example survives a
	 * reader whose content language carries an abridged edition, and a reader
	 * who follows it lands at the beginning of the work rather than in the
	 * middle of an argument. The sigla — `CSDC`, `STh` — are the works' own and
	 * are the forms `suggest.ts`'s `SECTIONS` table reads back; the two that
	 * have a dictionary key (`ccc.abbrev`, `compendium.abbrev`, and `Can.` in
	 * `canonLaw.canon`) take it, so a reader is shown the siglum their own
	 * edition prints.
	 */
	interface Citation {
		text: string;
		href?: string;
	}

	const bibleExample = $derived.by((): Citation | undefined => {
		// THE READER'S OWN EDITION HAS TO CARRY THE BOOK before the address is
		// offered, which is the same check every other row makes — and it is
		// what supplies the fallback name in one step.
		//
		// `osis` is LOWER-CASE here and everywhere in this corpus (`john`, not
		// the OSIS standard's `John`): `bookAbbrev` and `getBook` both answer
		// `undefined` for a spelling they do not hold, so the wrong case fails
		// by drawing no example at all rather than by erring.
		const book = bibleWorkId ? getBook(bibleWorkId, 'john') : undefined;
		if (!book) return undefined;
		// The abbreviation this language's citation grammar prints, then the
		// edition's own name for the book. `bookAbbrev` answers for eleven
		// languages and for the books their tables were built from; where it
		// does not (Hungarian, today), a full name is a correct citation and a
		// shorter one is not available.
		const name = bookAbbrev('john', bibleLang) ?? book.name;
		const sep = grammarSurface(bibleLang).chapterVerseSep;
		return {
			text: `${name} 3${sep}16`,
			href: hrefFor({ kind: 'bible', osis: 'john', chapter: 3, from: 16, to: 16 })
		};
	});

	const citations = $derived.by((): Record<string, Citation | undefined> => {
		const summaPart = 'i';
		const firstPrayer = listPrayerMeta(prayerLang)[0];
		return {
			scripture: bibleExample,
			catechism: {
				text: `${t('ccc.abbrev')} 1`,
				href: cccParagraphExists(pairLang, 1) ? hrefFor({ kind: 'ccc', n: 1 }) : undefined
			},
			compendium: {
				text: `${t('compendium.abbrev')} 1`,
				href: compendiumQuestionExists(pairLang, 1)
					? hrefFor({ kind: 'compendium', n: 1 })
					: undefined
			},
			// A document is cited by its own Latin incipit and a section number
			// within it, which is how the Catechism cites one throughout — so the
			// example is a real document and not a shape. Dei Verbum because it
			// is the one this page already links from the Gospels route.
			magisterium: {
				text: 'Dei Verbum 2',
				href: getDocumentGroup('dei-verbum')
					? hrefFor({ kind: 'document', slug: 'dei-verbum', n: 2 })
					: undefined
			},
			social: {
				text: 'CSDC 1',
				href: socialDoctrineParagraphExists(socialLang, 1)
					? hrefFor({ kind: 'socialDoctrine', n: 1 })
					: undefined
			},
			law: {
				text: `${t('canonLaw.canon')} 1`,
				href: canonLawCanonExists(content.langFor('canon-law'), 1)
					? hrefFor({ kind: 'canonLaw', n: 1 })
					: undefined
			},
			doctors: {
				text: 'STh I, 1',
				href: summaQuestionExists('I', 1)
					? hrefFor({ kind: 'summa', part: summaPart, question: 1, article: null })
					: undefined
			},
			// The one work with no number to cite, so the example is a prayer
			// that actually exists in the reader's own edition rather than a
			// name written down here — the editions carry different sets.
			prayers: firstPrayer
				? { text: firstPrayer.title, href: hrefFor({ kind: 'prayer', slug: firstPrayer.slug }) }
				: undefined
		};
	});
</script>

<svelte:head>
	<title>{t('schola.landing.title')} — {t('home.title')}</title>
</svelte:head>

<!--
	A LANDING COLUMN, NOT A READING ONE. `layout.css` says why the two are
	different: `--content-width` holds 62.4 characters of prose, and this page's
	content is banners, two grids and a numbered list. The prose on it takes
	`.landing-measure` instead, which is the measure without the column.

	`eager` is passed for the hero alone. Every other picture is below the fold
	on every viewport, and `loading="lazy"` with the intrinsic size declared
	means the browser reserves the box and fetches nothing until the reader
	arrives at it.
-->
<div class="landing-column">
	<div class="masthead">
		<ArtFigure art={BANNERS.hero} credit={creditOf(BANNERS.hero)} label={t('art.about')} eager />
	</div>

	<h1>{t('schola.landing.title')}</h1>
	<p class="page-tagline landing-measure">{t('schola.landing.tagline')}</p>

	<!-- The one paragraph on this site that recommends rather than describes,
	     and it says so underneath. Not an `<aside>` styled to look like a
	     pull-quote: it is addressed to the reader as directly as anything here,
	     and only its AUTHORSHIP is set apart. -->
	<section class="house-note landing-measure" aria-labelledby="house-note-heading">
		<h2 id="house-note-heading" class="visually-hidden">{t('schola.start.attribution')}</h2>
		<p>{t('schola.start.body')}</p>
		<p class="attribution">{t('schola.start.attribution')}</p>
	</section>

	<section aria-labelledby="guide-heading">
		<h2 id="guide-heading">{t('schola.guide.heading')}</h2>
		<p class="section-lede landing-measure">{t('schola.guide.lede')}</p>
		<ul class="feature-grid">
			{#each FEATURES as feature (feature.key)}
				<li class="feature">
					<!-- Decorative, so `aria-hidden` — which `Icon.svelte` enforces
					     rather than offers. The name beside it is the name. -->
					<span class="feature-icon"><Icon name={feature.icon} /></span>
					<div class="feature-text">
						<h3>
							{#if feature.href}
								<a href={feature.href}>{t(feature.nameKey)}</a>
							{:else}
								{t(feature.nameKey)}
							{/if}
						</h3>
						<p>{t(`schola.feature.${feature.key}`)}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="books-heading">
		<h2 id="books-heading">{t('schola.books.heading')}</h2>
		<p class="section-lede landing-measure">{t('schola.books.lede')}</p>
		<ul class="book-grid">
			{#each works as work (work.key)}
				<li class="book">
					<span class="book-icon"><Icon name={work.icon} /></span>
					<div class="book-text">
						<h3><a href={work.href}>{t(work.titleKey)}</a></h3>
						<p class="book-what">{t(`schola.what.${work.key}`)}</p>
						{#if citations[work.key]}
							<!-- The example is the row's own demonstration, so it is a
							     link wherever the address exists — a reader who follows
							     it has just read a citation and arrived where it points,
							     which is the whole lesson. Where the corpus does not
							     carry it the notation still shows and is inert. -->
							<p class="book-cite">
								<span class="cite-label">{t('schola.cite.label')}</span>
								{#if citations[work.key]?.href}
									<a class="cite-example" href={citations[work.key]?.href}
										>{citations[work.key]?.text}</a
									>
								{:else}
									<span class="cite-example">{citations[work.key]?.text}</span>
								{/if}
								<span class="cite-note">{t(`schola.cite.${work.key}`)}</span>
							</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	</section>

	{#each routes as route (route.key)}
		<section class="route" aria-labelledby="route-{route.key}">
			{#if BANNERS[route.key]}
				<div class="route-plate">
					<ArtFigure
						art={BANNERS[route.key]}
						credit={creditOf(BANNERS[route.key])}
						label={t('art.about')}
					/>
				</div>
			{/if}
			<h2 id="route-{route.key}">{t(`schola.route.${route.key}.title`)}</h2>
			<!-- The citation is the route's warrant, so it is a link and not a
			     caption: a reader who doubts that this order is the Church's and
			     not ours can go and read the paragraph that sets it out. -->
			<p class="route-source landing-measure">
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
							<p class="step-description landing-measure">{step.description}</p>
						{/if}
					</li>
				{/each}
			</ol>
		</section>
	{/each}
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

	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
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

	/* The note is set off by a rule on its inline start rather than by a box:
	   a card would make it look like a callout the works below produced, and
	   what it needs to look like is somebody talking. */
	.house-note {
		margin: 1.75rem 0 2.5rem;
		padding-inline-start: 1rem;
		border-inline-start: 3px solid var(--color-accent);
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

	/* The sentence under a section's rule, saying what the rows below are.
	   `.page-tagline`'s job one level down, and it takes the same colour. */
	.section-lede {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.route-source {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
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
	}

	/*
	 * TWO COLUMNS AT THE SITE'S OWN READING BREAKPOINT and one below it.
	 * `80rem` is where `layout.css` hands the reading grid its aside; reusing
	 * it rather than inventing a number keeps the site to one idea of "wide".
	 *
	 * The two grids are one rule: a guide whose halves disagreed about their
	 * column count would read as two pages stapled together.
	 */
	.feature-grid,
	.book-grid {
		list-style: none;
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
	}

	@media (min-width: 80rem) {
		.feature-grid,
		.book-grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	/*
	 * The card is the home page's door: elevated ground, hairline border, one
	 * radius, no shadow — `--shadow-panel` is for things that float. Only the
	 * border moves on hover, never the whole surface.
	 */
	.feature,
	.book {
		display: flex;
		gap: 0.9rem;
		align-items: flex-start;
		padding: 0.9rem 1rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	/*
	 * THE BORDER ANSWERS ONLY WHERE THE CARD LEADS SOMEWHERE. Every book row
	 * is a link to that work; a feature row is one only where the feature IS a
	 * page — three of the nine — and the rest describe a control in the header
	 * that no address opens. `:has(a)` is the difference, rather than a second
	 * class the list would have to keep in step with its own `href` field.
	 */
	.book:hover,
	.feature:has(a):hover {
		border-color: var(--color-accent);
	}

	/*
	 * A DISC, SIZED ONCE, so glyphs of different natural weight sit on one line
	 * down the grid. The icon is `1em` of the font-size set here rather than a
	 * pixel size, which is `Icon.svelte`'s whole contract.
	 *
	 * `--color-accent` and nothing else coloured: the mark identifies the row
	 * and the heading names it, so a second saturated element would make the
	 * card look like a control.
	 */
	.feature-icon,
	.book-icon {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		inline-size: 2.25rem;
		block-size: 2.25rem;
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		font-size: 1.15rem;
		color: var(--color-accent);
	}

	.book:hover .book-icon,
	.feature:has(a):hover .feature-icon {
		border-color: var(--color-accent);
	}

	.feature-text,
	.book-text {
		min-width: 0;
	}

	.feature h3,
	.book h3 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		margin: 0 0 0.2rem;
	}

	.feature p,
	.book-what {
		margin: 0;
		font-size: 0.9rem;
	}

	/*
	 * THE EXAMPLE IS DRAWN AS SOMETHING TO TYPE, in the idiom the shortcut
	 * sheet's keycaps already use: the interface face on the page's own ground
	 * inside a hairline. NOT a monospace — this site has exactly two faces and
	 * `docs/reading.md` splits them on authorship, so a third introduced for
	 * eight scraps of notation would be a new axis to maintain everywhere. The
	 * box is what says "put this in the box at the top"; tabular figures for
	 * the same reason the step gutter has them.
	 */
	.book-cite {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.cite-label {
		font-variant-caps: small-caps;
		letter-spacing: 0.04em;
	}

	.cite-example {
		display: inline-block;
		margin-inline: 0.25rem;
		padding: 0.05rem 0.35rem;
		font-family: var(--font-sans);
		font-size: 0.95em;
		font-variant-numeric: tabular-nums;
		color: var(--color-text);
		text-decoration: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
	}

	a.cite-example:hover,
	a.cite-example:focus-visible {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.cite-note::before {
		content: '— ';
	}

	/* The pictures print themselves — `ArtFigure` carries its own print rules,
	   including turning its caption control back into the line it opens. */
	@media print {
		.feature,
		.book {
			background: none;
			break-inside: avoid;
		}

		.cite-example {
			background: none;
		}
	}
</style>
