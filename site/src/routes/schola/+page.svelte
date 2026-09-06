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
	 * what its numbered unit is called, and a specimen of the notation.
	 *
	 * **THE SPECIMEN IS A SHAPE AND NOT A REFERENCE** (2026-09-05, by
	 * direction). Each was a live link, existence-checked against the corpus,
	 * so `CCC 1` could be followed to paragraph 1 — which taught the wrong
	 * lesson twice over: it sent a reader who was reading a CATALOGUE into the
	 * middle of a work they had not chosen, and it made the number look
	 * significant when the only thing this column teaches is the form. The
	 * numbers are representative now, the chips are inert, and the lede sends
	 * the reader to type one into the jump box, which is where a notation is
	 * actually worth something.
	 *
	 * The Bible's is still DERIVED rather than written down, because its form
	 * is the one that changes by language: the abbreviation comes from this
	 * language's own citation table (`bookAbbrev`), falling back to the
	 * reader's edition's name for the book, and the chapter/verse separator
	 * from the same grammar the parser uses — so a Portuguese reader is shown
	 * `Jo 3,16` and not somebody else's colon.
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
	 * (`landing-art.ts`) — the word "detail" and the name of the control that
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
	import { getBook, getDocumentManifest, listWorksOfType } from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { bookAbbrev, grammarSurface } from '$lib/refs-grammar';
	import { content } from '$lib/content.svelte';
	import { BANNERS, type Artwork } from '$lib/landing-art';
	import ArtFigure from '$lib/components/ArtFigure.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { IconName } from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { WorkType } from '$lib/types';

	// The identification, plus the one interface word in it. Composed here and
	// passed down for the reason `Plate.svelte` gives about its own credit: the
	// page that knows what a picture is is the page that writes the line, and
	// `ArtFigure` then needs no dictionary of its own.
	const creditOf = (art: Artwork) => art.credit + (art.detail ? ` (${t('art.detail')})` : '');

	// --- The reader's own Bible ----------------------------------------------
	//
	// The only edition this page resolves, and it resolves two things out of
	// it: the abbreviation and separator the citation specimen is drawn with,
	// and the names and chapter counts of the books the reading suggestion
	// offers. Nothing else on the page addresses a text any more.
	const bibleWorkId = $derived(content.workIdFor('bible'));
	const bibleLang = $derived(content.langFor('bible'));

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
	 * THE SPECIMEN BESIDE EACH WORK, AND IT IS A SHAPE RATHER THAN A REFERENCE.
	 *
	 * These were links until 2026-09-05, each existence-checked against the
	 * corpus so that following `CCC 1` landed on paragraph 1. Two things were
	 * wrong with that. A reader working down a catalogue was being offered a
	 * door into the middle of a work they had not chosen; and `1` is a
	 * meaningful citation, so the column read as eight recommendations rather
	 * than as eight examples of a form.
	 *
	 * SO THE NUMBERS ARE REPRESENTATIVE AND THE CHIPS ARE INERT. Four figures
	 * for a work with thousands of paragraphs, three for a code of canons, two
	 * for the sections of a document — the shape of the number is part of what
	 * the specimen teaches, and `jumpbox.placeholder` shows `ccc 1234` for the
	 * same reason. `schola.books.lede` sends the reader to type one of these
	 * into that box, which is the one place a notation is worth having.
	 *
	 * The sigla are the works' own and are the forms `suggest.ts`'s `SECTIONS`
	 * table reads back; the three that have a dictionary key (`ccc.abbrev`,
	 * `compendium.abbrev`, `canonLaw.canon`) take it, so a reader is shown the
	 * siglum their own edition prints.
	 *
	 * PRAYERS GET NONE, because they have no notation: they are cited by name,
	 * which is exactly what the sentence under that row says. An invented
	 * shape there would teach a citation form that does not exist.
	 */
	const bibleSpecimen = $derived.by((): string | undefined => {
		// THE READER'S OWN EDITION HAS TO CARRY THE BOOK before its name is
		// printed, and asking supplies the fallback name in the same step.
		//
		// `osis` is LOWER-CASE here and everywhere in this corpus (`john`, not
		// the OSIS standard's `John`): `bookAbbrev` and `getBook` both answer
		// `undefined` for a spelling they do not hold, so the wrong case fails
		// by drawing no specimen at all rather than by erring.
		const book = bibleWorkId ? getBook(bibleWorkId, 'john') : undefined;
		if (!book) return undefined;
		// The abbreviation this language's citation grammar prints, then the
		// edition's own name for the book. `bookAbbrev` answers for eleven
		// languages and for the books their tables were built from; where it
		// does not (Hungarian, today), a full name is a correct citation and a
		// shorter one is not available.
		const name = bookAbbrev('john', bibleLang) ?? book.name;
		return `${name} 3${grammarSurface(bibleLang).chapterVerseSep}16`;
	});

	const specimens = $derived.by((): Record<string, string | undefined> => ({
		scripture: bibleSpecimen,
		catechism: `${t('ccc.abbrev')} 1234`,
		compendium: `${t('compendium.abbrev')} 123`,
		// A document is cited by its own Latin incipit and a section number
		// inside it, which is how the Catechism cites one throughout. The
		// incipit has to be a real one for the form to be legible, and it is
		// the document the reading suggestion below already leans on.
		magisterium: 'Dei Verbum 12',
		social: 'CSDC 123',
		law: `${t('canonLaw.canon')} 123`,
		doctors: 'STh I, 12'
	}));

	/**
	 * ## THE ONE READING PATH THIS PAGE PROPOSES RATHER THAN REPORTS
	 *
	 * Everything else here reports: a row says what a work is, a citation shows
	 * what its number means. This section and "If you are new to this" above it
	 * RECOMMEND, which `docs/writing-descriptions.md` forbids of the
	 * descriptions.
	 *
	 * NEITHER IS MARKED ANY LONGER (2026-09-05, by direction). Both wore an
	 * accent rule that read as a blockquote, and this one also carried a line
	 * of small print naming its author; the line went with the two paragraphs
	 * that were purely ours — how to pace the reading, and what a year-long
	 * plan is. What is left leans on its two citations rather than on our
	 * say-so: the priority is Dei Verbum's, the hermeneutic is Verbum Domini's,
	 * and the three Gospels are offered with their arguments rather than
	 * ranked. **Both sections are headed by the reader's own question**, which
	 * is what now tells advice from inventory — worth knowing before a third
	 * is added.
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
		<ArtFigure
			art={BANNERS.schola}
			credit={creditOf(BANNERS.schola)}
			label={t('art.about')}
			eager
		/>
	</div>

	<h1>{t('schola.landing.title')}</h1>
	<p class="page-tagline landing-measure">{t('schola.landing.tagline')}</p>

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
							`CCC 1234`, `Comp. 123`, `Dei Verbum 12`, `CSDC 123`,
							`Can. 123`, `STh I, 12` — the page's whole lesson in one
							sweep, beside the work each belongs to.

							It also fixes the sentence underneath. "Cited as" used to be a
							label, then a chip, then an em dash, then a clause — four
							pieces of one line, wrapping badly. With the chip gone the
							label and the clause are simply a sentence: "Cited as by
							paragraph number, running unbroken from the first page to the
							last" reads as English, which the row never did before.

							The chip is not a link and the row's heading is: one door per
							row, and it opens on the work rather than on a paragraph of
							it. The "Cited as" line runs for every work, including the
							one with no specimen — prayers are cited by name, and that
							sentence is the whole answer for them.
						-->
						<div class="book-head">
							<h3><a href={work.href}>{t(work.titleKey)}</a></h3>
							{#if specimens[work.key]}
								<span class="cite-example">{specimens[work.key]}</span>
							{/if}
						</div>
						<p class="book-what">{t(`schola.what.${work.key}`)}</p>
						<p class="book-cite">
							<span class="cite-label">{t('schola.cite.label')}</span>
							{t(`schola.cite.${work.key}`)}
						</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>
	<!--
		THE ONE PARAGRAPH ON THIS SITE THAT RECOMMENDS RATHER THAN DESCRIBES, and
		it is a section now rather than a stray paragraph under the tagline. It
		had a heading all along — `schola.start.attribution`, read only by screen
		readers — and a line of small print under it saying whose advice it was.
		Both are gone: the heading is the reader's own question, and a page whose
		every other section is a list of what exists does not need a caption to
		say that a paragraph beginning "begin with" is advice.

		It sits after the two reference sections, not before them: a reader who
		arrives knowing nothing is better served by seeing what is here first,
		and a reader who wants to be told where to start finds this and the
		Bible section together at the foot.
	-->
	<section aria-labelledby="start-heading">
		<h2 id="start-heading">{t('schola.start.heading')}</h2>
		<p class="landing-measure">
			{t('schola.start.body')}
			<a href="/catechismus/compendium">{t('compendium.landing.title')}</a>{t(
				'schola.start.bodyAfter'
			)}
		</p>
	</section>

	<!--
		THE SUGGESTION, SET AS THREE NUMBERED STAGES.

		It was a heading, two long paragraphs, a lead-in, a plain list, another
		paragraph, another lead-in, another plain list and a closing paragraph —
		nine blocks of undifferentiated prose at the foot of a landing page, and
		the longest reading on the site outside the corpus itself. A reader who
		has never opened a Bible is precisely the reader least likely to finish
		it.

		What it actually says is short: read a Gospel, then Acts, then four
		places in the older half. So it is drawn as what it is. Each stage is a
		numeral, a title of three or four words, the reason under it, and the
		books themselves as things you can press. A reader who reads only the
		three titles has the whole suggestion; everything else is there for the
		reader who wants the argument.

		THE NUMERALS ARE HONEST HERE AND WERE NOT BEFORE. `.steps` had a
		numbered gutter when this page carried the sourced routes, and it went
		with them: a numbered gutter says "somebody authorised this sequence",
		which was true of the routes and is not true of this. What makes it
		honest now is the heading — the reader's own question — and `†` on the
		two sentences that lean on a document. The order is ours, we say so, and
		numbering it is clearer than pretending it has none.
	-->
	{#if showBiblePath}
		<section class="suggestion" aria-labelledby="bible-heading">
			<h2 id="bible-heading">{t('schola.bible.heading')}</h2>
			<p class="section-lede landing-measure">{t('schola.bible.library')}</p>

			<ol class="stages">
				<!--
					The numeral is drawn rather than left to the list marker, because
					`list-style: none` is what lets the gutter be a serif figure at
					the title's size. It is `aria-hidden`: the `<ol>` already tells a
					screen reader this is an ordered list of three, and a spoken "1"
					before every title would be the count twice.
				-->
				<li class="stage">
					<p class="stage-n" aria-hidden="true">1</p>
					<div class="stage-body">
						<h3>{t('schola.bible.step.gospel')}</h3>
						<p class="stage-why landing-measure">
							{t('schola.bible.start')}{#if deiVerbum}<a
									class="source-mark"
									href={deiVerbum.href}
									title={deiVerbum.label}
									aria-label={deiVerbum.label}>†</a
								>{/if}
						</p>
						<p class="stage-why landing-measure">{t('schola.bible.whichGospel')}</p>
						<!-- Three answers, each with its reason, and no fourth row
						     saying which is right. The disagreement is real, no
						     document settles it, and a page that picked one would be
						     reporting its own preference as the answer to a question
						     the reader could have weighed themselves. -->
						<ul class="picks">
							{#each gospels as gospel (gospel.key)}
								<li>
									<a class="pick" href={gospel.at?.href}>
										<span class="pick-name">{gospel.at?.label}</span>
										<span class="pick-why">{t(`schola.bible.gospel.${gospel.key}`)}</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				</li>

				{#if acts}
					<li class="stage">
						<p class="stage-n" aria-hidden="true">2</p>
						<div class="stage-body">
							<h3>{t('schola.bible.step.acts')}</h3>
							<p class="stage-why landing-measure">{t('schola.bible.thenActs')}</p>
							<ul class="picks">
								<li>
									<a class="pick" href={acts.href}>
										<span class="pick-name">{acts.label}</span>
									</a>
								</li>
							</ul>
						</div>
					</li>
				{/if}

				<li class="stage">
					<p class="stage-n" aria-hidden="true">{acts ? 3 : 2}</p>
					<div class="stage-body">
						<h3>{t('schola.bible.step.old')}</h3>
						<p class="stage-why landing-measure">{t('schola.bible.thenOld')}</p>
						<ul class="picks">
							{#each oldTestament as step (step.key)}
								<li>
									<a class="pick" href={step.at?.href}>
										<span class="pick-name">{step.at?.label}</span>
										<span class="pick-why">{t(`schola.bible.ot.${step.key}`)}</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				</li>
			</ol>

			<p class="landing-measure">
				{t('schola.bible.bothWays')}{#if verbumDomini}<a
						class="source-mark"
						href={verbumDomini.href}
						title={verbumDomini.label}
						aria-label={verbumDomini.label}>†</a
					>{/if}
			</p>
		</section>
	{/if}
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

	/*
	 * THE PAGE'S OWN VOICE IS NOT DRAWN, AND USED TO BE. The two sections that
	 * advise carried an accent rule down their inline start, on the argument
	 * that a reader should see which passages recommend without reading an
	 * attribution line every time. What that produced was a blockquote — the one
	 * shape on the web that means "somebody else said this", set around the two
	 * passages nobody else said — and the indent made the longest prose on the
	 * page the hardest to read. The attribution line went with it.
	 *
	 * WHAT MARKS THEM NOW IS THEIR HEADINGS, which are the reader's own
	 * questions — "If you are new to this", "If you have never read the Bible" —
	 * where every other section on the page is titled by what it lists. A
	 * paragraph under a question is answering it; nothing has to be drawn around
	 * it to say so.
	 *
	 * IT TAKES THE WHOLE COLUMN, and carried `.landing-measure` on the section
	 * itself until 2026-09-05. That capped the section at 40rem, so its heading
	 * rule stopped two-thirds of the way across the page while every other
	 * section's ran the full width — the page looked as though its last section
	 * belonged to a narrower document. The measure belongs on the PARAGRAPHS,
	 * which is where every other section on this page carries it, and the
	 * stages fill the column the same way the two grids above do.
	 */
	.suggestion {
		margin: 0 0 2.5rem;
	}

	/*
	 * THREE STAGES IN A SERIF GUTTER. The numeral is the whole navigation: a
	 * reader who takes in nothing but `1 Start with a Gospel / 2 Then what
	 * happened next / 3 Then the older half` has the suggestion entire, which
	 * is the most this section can hope for from someone who has never opened a
	 * Bible. Everything else in the stage is for the reader who did not stop.
	 *
	 * Accent, at half opacity, and never a filled circle: the numeral is a
	 * position in a list, not a step in a process the reader is being marched
	 * through. Tabular figures so the gutter is one straight edge.
	 */
	.stages {
		list-style: none;
		display: grid;
		gap: 1.75rem;
		margin: 0 0 1.5rem;
		padding: 0;
	}

	.stage {
		display: grid;
		grid-template-columns: 2.25rem 1fr;
		gap: 0 1rem;
		align-items: start;
	}

	.stage-n {
		margin: 0;
		font-family: var(--font-serif);
		font-size: 1.75rem;
		line-height: 1;
		text-align: end;
		font-variant-numeric: tabular-nums;
		color: var(--color-accent);
		opacity: 0.5;
	}

	.stage h3 {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		margin: 0 0 0.35rem;
	}

	.stage-why {
		margin: 0 0 0.6rem;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	/*
	 * HERE THE CARDS ARE CARDS, and the books section three sections up argues
	 * the opposite for its own rows. Both are right, and the difference is what
	 * the reader is being asked to do. A catalogue entry is read; these are
	 * CHOSEN BETWEEN — which of three Gospels, which of four places in the older
	 * half — and a grid of doors is what "pick one" looks like everywhere else
	 * on this site. The whole tile is the link, so the target is a card and not
	 * a two-word name.
	 *
	 * `auto-fill` rather than `auto-fit`, so the stage with one book in it gets
	 * one tile the size of the others instead of a single card stretched across
	 * the column. The empty tracks are the point.
	 */
	.picks {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: 0.6rem;
		margin: 0;
		padding: 0;
	}

	.pick {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		block-size: 100%;
		padding: 0.7rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		text-decoration: none;
	}

	.pick:hover,
	.pick:focus-visible {
		border-color: var(--color-accent);
	}

	.pick-name {
		font-family: var(--font-serif);
		font-size: 1.05rem;
	}

	.pick:hover .pick-name,
	.pick:focus-visible .pick-name {
		color: var(--color-accent);
	}

	.pick-why {
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

	/*
	 * `flex: 1` IS WHAT PUTS THE SPECIMEN ON THE TRAILING EDGE. `.book-head`
	 * spaces its two children apart, but a flex item is only as wide as its
	 * content unless it is told to grow — so the chip was pushed to the end of
	 * the TEXT rather than to the end of the row, and every card aligned its
	 * notation somewhere different depending on how long its description ran.
	 * The column of notations down the grid is the whole point of putting it up
	 * there, and one declaration is the difference between having it and not.
	 *
	 * `min-width: 0` stays for the ordinary reason: a flex item's floor is its
	 * content's intrinsic width, which a long unbroken title would otherwise
	 * push the row past.
	 */
	.feature-text,
	.book-text {
		flex: 1;
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

	/* The pictures print themselves — `ArtFigure` carries its own print rules,
	   including turning its caption control back into the line it opens. */
	@media print {
		.feature,
		.book,
		.stage {
			background: none;
			break-inside: avoid;
		}

		.pick {
			background: none;
		}

		.cite-example {
			background: none;
		}
	}
</style>
