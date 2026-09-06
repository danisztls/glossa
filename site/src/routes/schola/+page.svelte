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
	 * ## THE SOURCED ROUTES WERE HERE AND ARE GONE (2026-09-05)
	 *
	 * Three of them, built by `learning-routes.ts`: the Catechism's four
	 * pillars, the Gospels in the canon's order, and the Compendium's three
	 * parts, each citing the paragraph of this corpus that states that order.
	 * The rule they were built on was sound — the site sequences nothing on its
	 * own authority — and it produced a page where the most useful thing a
	 * newcomer could be told was the thing the page would not say.
	 *
	 * **What replaced the Gospels route is the Bible section below, and it
	 * recommends.** So it is marked, as the note at the top is: everything else
	 * here reports, and `docs/writing-descriptions.md` forbids recommending
	 * without saying whose the recommendation is. The other two routes have no
	 * successor and needed none — a reader who wants the Catechism's plan reads
	 * `/catechismus`, which IS that plan.
	 *
	 * The module and its tests went with them rather than sitting unimported;
	 * git holds them, and `site/docs/finding.md` holds the argument, including
	 * why the Council's sixteen documents were never a route.
	 *
	 * ## What this page costs in translation, and what it does not
	 *
	 * Every work's NAME is the key that work's own landing page is titled by,
	 * every feature's name is the key its own control is labelled by, and every
	 * book in the reading suggestion is named by the reader's own edition — so
	 * the page names nothing twice, and an ingestion cannot leave a name stale.
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
		getDocumentGroup,
		getDocumentManifest,
		listPrayerMeta,
		listWorksOfType,
		socialDoctrineParagraphExists,
		summaQuestionExists
	} from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { bookAbbrev, grammarSurface } from '$lib/refs-grammar';
	import { content } from '$lib/content.svelte';
	import { BANNERS, type Artwork } from '$lib/schola-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { WorkType } from '$lib/types';

	// The identification, plus the one interface word in it. Composed here and
	// passed down for the reason `Plate.svelte` gives about its own credit: the
	// page that knows what a picture is is the page that writes the line, and
	// `ArtFigure` then needs no dictionary of its own.
	const creditOf = (art: Artwork) =>
		art.credit + (art.detail ? ` (${t('schola.art.detail')})` : '');

	// --- The languages the worked citations resolve in -----------------------
	//
	// `catechismPairLang` for the same reason `/catechismus` uses it: six
	// languages carry one of the Catechism/Compendium pair and not the other,
	// and resolving each separately puts an English answer beside the reader's
	// own question.
	const pairLang = $derived(content.catechismPairLang());
	const prayerLang = $derived(content.langFor('prayer'));
	const bibleWorkId = $derived(content.workIdFor('bible'));
	const bibleLang = $derived(content.langFor('bible'));
	const socialLang = $derived(content.langFor('social-doctrine'));

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
			// is the one the reading suggestion above already leans on.
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

	/**
	 * ## THE ONE READING PATH THIS PAGE PROPOSES RATHER THAN REPORTS
	 *
	 * Everything else here reports: a row says what a work is, a citation shows
	 * what its number means. This section RECOMMENDS, which
	 * `docs/writing-descriptions.md` forbids of the descriptions.
	 *
	 * IT CARRIED `schola.start.attribution` AND NO LONGER DOES (2026-09-05, by
	 * direction). What went with that line is the two paragraphs that were
	 * purely ours — how to pace the reading, and what a year-long plan is — so
	 * what is left leans on its two citations rather than on our say-so: the
	 * priority is Dei Verbum's, the hermeneutic is Verbum Domini's, and the
	 * three Gospels are offered with their arguments rather than ranked. The
	 * note at the top of the page keeps the mark; this section is now the one
	 * place that advises without wearing one, which is worth knowing before
	 * adding a third.
	 *
	 * WHY IT IS OURS AND CANNOT BE ANYONE ELSE'S. The Church states a NARRATIVE
	 * FRAME and never a reading plan: `Dei Verbum` 25 asks that the faithful be
	 * taught the right use of Scripture "especially the New Testament and above
	 * all the Gospels", which is a priority and not a sequence; `Verbum Domini`
	 * 41 says the two Testaments are read in each other's light, which is a way
	 * of reading and not an order to read in; and CCC 54-64's stages of
	 * revelation are theology, not a syllabus — they name no books. Every
	 * year-long plan on sale takes that frame and supplies the book list
	 * itself. So does this, at a quarter of the length; the difference is that
	 * it says so.
	 *
	 * WHICH GOSPEL IS A REAL DISAGREEMENT and the page leaves it open, offering
	 * the three that are actually argued for with the argument attached rather
	 * than picking one and presenting the pick as settled. That is the same
	 * instinct as the jump box offering both readings of a divergent psalm.
	 *
	 * EVERY ROW IS THE READER'S OWN BIBLE. `passage` names a book as their
	 * edition names it and checks the chapter exists before it links; a book an
	 * edition does not carry drops out of the list rather than 404ing. The two
	 * documents are cited by their own Latin names, read from the edition the
	 * reader would land in.
	 */
	interface Passage {
		label: string;
		href: string;
	}

	const passage = (osis: string, chapter: number, extent?: string): Passage | undefined => {
		const book = bibleWorkId ? getBook(bibleWorkId, osis) : undefined;
		if (!book?.chapters.some((c) => c.n === chapter)) return undefined;
		return {
			// The extent is a pair of numerals and needs no dictionary; the name
			// is the edition's own, so a Portuguese reader is sent to "Gênesis
			// 1-11" and never to somebody else's spelling of it.
			label: extent ? `${book.name} ${extent}` : book.name,
			href: hrefFor({ kind: 'bible', osis, chapter })
		};
	};

	/** A document cited the way the books list above teaches — its own name,
	 *  then a section number inside it. `documentWorkIdFor` rather than the
	 *  bare default, so a reader who has chosen an edition of that document
	 *  keeps it. */
	const documentCite = (slug: string, n: number): Passage | undefined => {
		const workId = content.documentWorkIdFor(slug);
		const title = workId ? getDocumentManifest(workId)?.short_title : undefined;
		return title
			? { label: `${title} ${n}`, href: hrefFor({ kind: 'document', slug, n }) }
			: undefined;
	};

	const gospels = $derived(
		(['mark', 'luke', 'john'] as const)
			.map((osis) => ({ key: osis, at: passage(osis, 1) }))
			.filter((row) => row.at !== undefined)
	);
	const acts = $derived(passage('acts', 1));
	const oldTestament = $derived(
		[
			{ key: 'beginnings', at: passage('gen', 1, '1–11') },
			{ key: 'promise', at: passage('gen', 12, '12–50') },
			{ key: 'exodus', at: passage('exod', 1, '1–20') },
			{ key: 'psalms', at: passage('ps', 1) }
		].filter((row) => row.at !== undefined)
	);
	const deiVerbum = $derived(documentCite('dei-verbum', 25));
	const verbumDomini = $derived(documentCite('verbum-domini', 41));

	/** Nothing to suggest where the corpus carries no Gospel to suggest. */
	const showBiblePath = $derived(gospels.length > 0);
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

	<!--
		THE SUGGESTION, and it wears the mark. `.suggestion` is `.house-note`'s
		accent rule at section scale, which is the page's one visual for "this is
		us talking" — learned once at the note above, reused here rather than
		invented. The attribution at the foot is the same string that note
		carries, because it is the same claim.

		It sits directly under that note deliberately: the two together are the
		page's title, and a reader who wants to start today should not have to
		pass a grid of chrome to be told how.
	-->
	{#if showBiblePath}
		<!-- The banner that stood over the Gospels route, which this section
		     replaces. Rembrandt's preaching Christ is the one picture in the set
		     that is about people being TAUGHT, which is what this is. -->
		{#if BANNERS.gospels}
			<div class="suggestion-plate">
				<ArtFigure
					art={BANNERS.gospels}
					credit={creditOf(BANNERS.gospels)}
					label={t('art.about')}
				/>
			</div>
		{/if}
		<section class="suggestion landing-measure" aria-labelledby="bible-heading">
			<h2 id="bible-heading">{t('schola.bible.heading')}</h2>
			<p>{t('schola.bible.library')}</p>
			<p>
				{t('schola.bible.start')}{#if deiVerbum}<a
						class="source-mark"
						href={deiVerbum.href}
						title={deiVerbum.label}
						aria-label={deiVerbum.label}>†</a
					>{/if}
			</p>

			<p class="lead-in">{t('schola.bible.whichGospel')}</p>
			<!-- Three answers, each with its reason, and no fourth row saying which
			     is right. The disagreement is real, no document settles it, and a
			     page that picked one would be reporting its own preference as the
			     answer to a question the reader could have weighed themselves. -->
			<ul class="path">
				{#each gospels as gospel (gospel.key)}
					<li>
						<a class="passage" href={gospel.at?.href}>{gospel.at?.label}</a>
						<span class="reason">{t(`schola.bible.gospel.${gospel.key}`)}</span>
					</li>
				{/each}
			</ul>

			{#if acts}
				<p>
					{t('schola.bible.thenActs')}
					<a class="passage" href={acts.href}>{acts.label}</a>
				</p>
			{/if}

			<p>{t('schola.bible.thenOld')}</p>
			<ul class="path">
				{#each oldTestament as step (step.key)}
					<li>
						<a class="passage" href={step.at?.href}>{step.at?.label}</a>
						<span class="reason">{t(`schola.bible.ot.${step.key}`)}</span>
					</li>
				{/each}
			</ul>
			<p>
				{t('schola.bible.bothWays')}{#if verbumDomini}<a
						class="source-mark"
						href={verbumDomini.href}
						title={verbumDomini.label}
						aria-label={verbumDomini.label}>†</a
					>{/if}
			</p>
		</section>
	{/if}

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
						<!--
							THE SPECIMEN SITS ON THE TITLE LINE, not at the foot of the
							card, and that is what makes this section teachable at a
							glance: read down the trailing edge and you get `Jn 3:16`,
							`CCC 1`, `Comp. 1`, `Dei Verbum 2`, `CSDC 1`, `Can. 1`,
							`STh I, 1` — the page's whole lesson in one sweep, beside the
							work each belongs to.

							It also fixes the sentence underneath. "Cited as" used to be a
							label, then a chip, then an em dash, then a clause — four
							pieces of one line, wrapping badly. With the chip gone the
							label and the clause are simply a sentence: "Cited as by
							paragraph number, running unbroken from the first page to the
							last" reads as English, which the row never did before.

							It is a link wherever the address exists — a reader who
							follows it has just read a citation and arrived where it
							points, which is the lesson happening rather than being
							described. Where the corpus does not carry it the notation
							still shows and is inert.
						-->
						<div class="book-head">
							<h3><a href={work.href}>{t(work.titleKey)}</a></h3>
							{#if citations[work.key]}
								{#if citations[work.key]?.href}
									<a class="cite-example" href={citations[work.key]?.href}
										>{citations[work.key]?.text}</a
									>
								{:else}
									<span class="cite-example">{citations[work.key]?.text}</span>
								{/if}
							{/if}
						</div>
						<p class="book-what">{t(`schola.what.${work.key}`)}</p>
						{#if citations[work.key]}
							<p class="book-cite">
								<span class="cite-label">{t('schola.cite.label')}</span>
								{t(`schola.cite.${work.key}`)}
							</p>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
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

	/*
	 * THE PAGE'S OWN VOICE IS ONE RULE DOWN THE INLINE START, and both places
	 * that speak in it wear it. A card would make either look like a callout
	 * the works below produced, and what they need to look like is somebody
	 * talking. Learning the mark once is the whole reason the two share it:
	 * every other thing on this page reports, these two recommend, and the
	 * reader should be able to see which is which without reading the
	 * attribution line every time.
	 */
	.house-note,
	.suggestion {
		padding-inline-start: 1rem;
		border-inline-start: 3px solid var(--color-accent);
	}

	.house-note {
		margin: 1.75rem 0;
	}

	.suggestion {
		margin: 0 0 2.5rem;
	}

	/* Inside the accent rule the heading needs no second edge — the rule has
	   already said where this region begins. */
	.suggestion h2 {
		border-bottom: 0;
		margin-block: 0 0.6rem;
		padding-bottom: 0;
	}

	.suggestion p {
		margin: 0 0 0.75rem;
	}

	/* A line that introduces the list under it, so it sits closer to the list
	   than to the paragraph it follows. */
	.lead-in {
		margin-bottom: 0.35rem !important;
	}

	/*
	 * THE ROWS ARE NOT `.steps`, DELIBERATELY. That numbered gutter belongs to
	 * the routes that used to sit below, which were orders somebody else set
	 * out. They are gone and the rules are not coming back: a numbered gutter
	 * says "this is a sequence somebody authorised", and what this list is is a
	 * choice of three and then a few places to go. Plain: the book, then why.
	 */
	.path {
		list-style: none;
		margin: 0 0 1rem;
		padding: 0;
	}

	.path li {
		margin-bottom: 0.4rem;
	}

	.passage {
		font-family: var(--font-serif);
		color: var(--color-text);
		text-decoration: none;
	}

	.passage:hover,
	.passage:focus-visible {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.reason {
		display: block;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/*
	 * THE WARRANT IS A DAGGER, not the document's name set into the sentence.
	 * Two names and two numbers inside two paragraphs of plain writing broke
	 * them up exactly where they should have read straight through, and a
	 * reader who has not yet met the word "Gospel" is not helped by meeting
	 * "Verbum Domini 41" mid-clause. The mark says an authority is behind the
	 * sentence; the name is one press or one hover away for the reader who
	 * wants it.
	 *
	 * IT IS THE SAME GLYPH THE APPARATUS USES, deliberately — this site has one
	 * mark meaning "there is a source here" and adding a second vocabulary for
	 * a page with no apparatus on it would be inventing a distinction nobody
	 * asked for. `‡` was the alternative and is not reachable at any price:
	 * Google's subsets do not carry it (site/CLAUDE.md), which is also why the
	 * dagger has a one-codepoint font of its own that is already precached.
	 *
	 * SUPERSCRIPTED BY `vertical-align`, NOT BY THE GLYPH. A dagger is drawn
	 * baseline-to-cap like a letter, where an asterisk is drawn high in its own
	 * em box — on the baseline this reads as a character of the sentence.
	 * `.commentary-marker` makes the same two corrections for the same reason.
	 *
	 * The `aria-label` is mandatory rather than a courtesy: the link's only
	 * content is a glyph, so without it a screen reader announces "dagger".
	 */
	.source-mark {
		margin-inline-start: 0.15em;
		font-size: 0.75em;
		vertical-align: super;
		line-height: 0;
		text-decoration: none;
		color: var(--color-accent);
	}

	.source-mark:hover,
	.source-mark:focus-visible {
		text-decoration: underline;
	}

	/* The banner belongs to the section under it and takes the gap a heading
	   would otherwise carry, which is the arrangement the routes' own banners
	   had. */
	.suggestion-plate {
		margin: 0.5rem 0 1.25rem;
	}

	.house-note p {
		margin: 0;
	}

	.attribution {
		margin-top: 0.4rem !important;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	section h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 2.25rem 0 0.4rem;
	}

	/* The sentence under a section's rule, saying what the rows below are.
	   `.page-tagline`'s job one level down, and it takes the same colour. */
	.section-lede {
		margin: 0 0 1rem;
		font-size: 0.9rem;
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
	 * THE CARDS ARE NOT CARDS. Sixteen filled, bordered, rounded boxes down a
	 * two-column grid is sixteen objects competing with their own contents —
	 * and worse, it says the rows are things to CHOOSE BETWEEN, which is what a
	 * grid of doors means everywhere else on this site. These rows are not
	 * doors. They are entries in a reference list, read in sequence, and the
	 * home page's `.door` idiom was borrowed here for no better reason than
	 * that it was the nearest thing to hand.
	 *
	 * So the box is gone and the structure is carried by a rule and a gutter:
	 * a hairline above each row, the icon standing free in a fixed inline
	 * gutter, and enough air that the rows separate without being fenced. That
	 * is how a printed reference work sets a list of entries, and this page is
	 * one. It also makes the two-column grid read as a page rather than as a
	 * dashboard.
	 */
	.feature,
	.book {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
		padding: 0.85rem 0;
		border-block-start: 1px solid var(--color-border);
	}

	/*
	 * THE FIRST ROW OF EACH COLUMN KEEPS ITS RULE and every row's rule is its
	 * own, so a two-column grid does not need to know which cells are at the
	 * top. `border-block-start` on all of them is uniform by construction —
	 * with `border-block-end` the last row of the shorter column would leave a
	 * rule hanging under nothing.
	 */

	/*
	 * THE ICON STANDS FREE, at reading size rather than in a 2.25rem chip. The
	 * chip was drawing a box around a mark whose whole job is to be glanced at,
	 * and once the row's own box went the chip was the only thing left fencing
	 * anything. Sized once so glyphs of different natural weight sit on one
	 * line down the grid; `1em` of the font-size set here rather than a pixel
	 * size, which is `Icon.svelte`'s whole contract.
	 *
	 * `--color-accent` and nothing else coloured: the mark identifies the row
	 * and the heading names it, so a second saturated element would make the
	 * row look like a control. Nudged down by the cap height so it sits on the
	 * title's optical centre rather than on its baseline box.
	 */
	.feature-icon,
	.book-icon {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		inline-size: 1.5rem;
		font-size: 1.35rem;
		line-height: 1;
		margin-block-start: 0.12rem;
		color: var(--color-accent);
		opacity: 0.75;
	}

	/*
	 * HOVER ANSWERS ONLY WHERE THE ROW LEADS SOMEWHERE. Every book row is a
	 * link to that work; a feature row is one only where the feature IS a page
	 * — three of the nine — and the rest describe a control in the header that
	 * no address opens. `:has(a)` is the difference, rather than a second class
	 * the list would have to keep in step with its own `href` field. With no
	 * border left to light, the mark is what answers.
	 */
	.book:hover .book-icon,
	.feature:has(a):hover .feature-icon {
		opacity: 1;
	}

	.feature-text,
	.book-text {
		min-width: 0;
	}

	/*
	 * The title and its specimen on one line, the specimen pushed to the
	 * trailing edge so the notations form a column of their own down the grid.
	 * Baselines, not boxes: a serif title and a sans chip have different box
	 * heights and agreeing on the line they sit on is what makes the pair read
	 * as one row.
	 */
	.book-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		margin-block-end: 0.25rem;
	}

	.feature h3,
	.book h3 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		margin: 0 0 0.2rem;
	}

	.book-head h3 {
		margin: 0;
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
		flex: 0 0 auto;
		padding: 0.1rem 0.4rem;
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		color: var(--color-text);
		text-decoration: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-elevated);
	}

	a.cite-example:hover,
	a.cite-example:focus-visible {
		color: var(--color-accent);
		border-color: var(--color-accent);
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
