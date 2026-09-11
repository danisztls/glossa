<script lang="ts">
	/**
	 * `/schola` — a short guide to the site: what is on it, how each work is
	 * cited, and orders for reading.
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
	 * is on the shelf and what a citation of it looks like.
	 *
	 * **AND IT NO LONGER EXPLAINS THE CHROME** (2026-09-07). Its first section
	 * did, and those rows are the sheet the `?` button opens now — `$lib/help.ts`
	 * and `Help.svelte`, with `site/docs/finding.md` holding the argument. A
	 * guide to the controls printed on a page of its own has to describe
	 * controls the reader cannot see while they read it; in the sheet they are
	 * read beside the page they are on, and only the ones that page HAS are
	 * drawn. What this page kept is what it was always better at: the works,
	 * their citation forms, and the three destinations that are not texts.
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
	 * and every book in the reading suggestion is named by the reader's own
	 * edition — so the page names nothing twice, and an ingestion cannot leave
	 * a name stale.
	 *
	 * What is genuinely new writing is the sentences: what each work is and
	 * what its unit of citation is. That is the part §5 stops at, and it was
	 * what kept `/schola` out of `CHROME_PATHS` until all 58 keys of the day
	 * were written in all 37 languages (2026-09-06, `route-manifest.ts`).
	 * **A new sentence on this page is now a string in thirty-six dictionaries,
	 * not a note in a docblock** — the page is published, so the bill is paid
	 * up front rather than deferred.
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
	 * this page's content is a band, a grid and three numbered stages. `/`,
	 * `/bibliotheca` and `/documenta` are the same kind of page and take the
	 * same column.
	 *
	 * **NOTHING ON IT IS MEASURED** (2026-09-06). Every paragraph ran at
	 * `.landing-measure`'s 40rem inside the 72rem column, which put a wall down
	 * the middle of the page that the page itself never drew — text stopping at
	 * an edge, beside grids and cards running the full width. Leading carries a
	 * long line instead; the style block holds the rule.
	 *
	 * **AND THE PICTURE IS NOT A MASTHEAD.** It sits between the two sections
	 * that LIST and the two that ADVISE, which is the one place on the page
	 * where the voice changes and the only change nothing else marks.
	 */
	import { getBook, getDocumentManifest, listWorksOfType } from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { citationSpecimens } from '$lib/specimens';
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
	 *
	 * ## THE ROWS ARE ONE COLOUR, AND THEY WERE EIGHT FOR A DAY
	 *
	 * Each row wore its shelf's own colour, taken from `tokens.css`'s
	 * `--shelf-*` — the same value `CitedBy` marks that shelf with, so a work
	 * would have worn one colour wherever the site named it. It is the accent
	 * again (2026-09-06, by direction), and what it ran into is worth keeping:
	 * once the chrome guide and the three places had colours too, the page
	 * carried twenty-odd coloured glyphs across four grids, and **past a
	 * certain count a colour stops picking a row out and becomes the page's
	 * texture**. Every row shouting is every row quiet.
	 *
	 * The tokens are untouched and still earn their keep: `CitedBy` dots each
	 * shelf with the muted mix, and the reading suggestion's cards walk the
	 * ordered `--hue-*` ramp — a list of eight things a reader is choosing
	 * BETWEEN, which is the case colour was helping with all along, rather
	 * than a list they are reading down.
	 *
	 * The mark that IS still per row is the icon's shape, which was the answer
	 * before any of this and is a stronger one: a scroll, a scale, a feather.
	 *
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

	/**
	 * NOT TEXTS, BUT PLACES — and they are in the works section rather than in
	 * the chrome guide above because that is what they are. A reader looking
	 * for the Library is looking for somewhere to go, not for a button to
	 * press; the guide answers "what does this control do" and this section
	 * answers "what is on this site".
	 *
	 * They carry no specimen and no "Identified" line, having no notation to
	 * teach: a calendar is addressed by a date and a bookmark by whatever the
	 * reader marked. That absence is the reason they are a group of their own
	 * under the eight rather than eleven rows in one grid — a row missing the
	 * one line every other row has reads as a row with something wrong with it.
	 */
	const PLACES = [
		{
			key: 'library',
			icon: 'book-open' as IconName,
			titleKey: 'nav.library',
			href: '/bibliotheca'
		},
		{
			key: 'calendar',
			icon: 'calendar' as IconName,
			titleKey: 'nav.calendar',
			href: '/calendarium'
		},
		{
			key: 'bookmarks',
			icon: 'bookmark' as IconName,
			titleKey: 'bookmark.library',
			href: '/signata'
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
	 * than as eight examples of a form. `schola.books.lede` sends the reader to
	 * type one of these into the jump box, which is the one place a notation is
	 * worth having — and that box prints the same table in its own empty state
	 * now, which is what lifted the table out of this file.
	 *
	 * `$lib/specimens.ts` holds the rest of the argument: why the numbers are
	 * representative, why the sigla come out of the dictionary, why prayers get
	 * none. Its keys are this page's own `WORKS` keys, having been taken from
	 * them.
	 */
	const specimens = $derived.by((): Record<string, string | undefined> =>
		Object.fromEntries(citationSpecimens(bibleWorkId, bibleLang).map((row) => [row.key, row.text]))
	);

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
	 * and the Gospels are offered with their arguments rather than
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
	 * all four in the canon's order with the argument for each attached rather
	 * than picking one and presenting the pick as settled. That is the same
	 * instinct as the jump box offering both readings of a divergent psalm.
	 *
	 * IT OFFERED THREE UNTIL 2026-09-09, and leaving one out is a pick like any
	 * other — an unmarked one, next to a blurb that says there are four. A
	 * shortlist of beginner advice is not the absence of a case. The copy names
	 * no number now, so it cannot come apart from the list again.
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
		(['matt', 'mark', 'luke', 'john'] as const)
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
	the leading carries the line instead.

	Nothing here is `eager`. The one picture is below the fold at every
	viewport, and `loading="lazy"` with the intrinsic size declared means the
	browser reserves the box and fetches nothing until the reader arrives at
	it.
-->
<div class="landing-column">
	<h1>{t('schola.landing.title')}</h1>
	<p class="page-tagline">{t('schola.landing.tagline')}</p>

	<section aria-labelledby="books-heading">
		<h2 id="books-heading">{t('schola.books.heading')}</h2>
		<p class="section-lede">{t('schola.books.lede')}</p>
		<ul class="book-grid">
			{#each works as work (work.key)}
				<li class="book">
					<span class="book-icon"><Icon name={work.icon} /></span>
					<div class="book-text">
						<h4><a href={work.href}>{t(work.titleKey)}</a></h4>
						<p class="book-what">{t(`schola.what.${work.key}`)}</p>
						<!--
							THE SPECIMEN IS ON THE "CITED AS" ROW, and it sat on the title
							line until 2026-09-06. Both put it on the trailing edge — the
							column of notations down the grid is the point, and it is the
							page's whole lesson in one sweep — but on the title line it was
							a chip beside a work's NAME, which is the one thing on the row
							it is not an example of. Here it stands at the end of the
							sentence that says what its number counts, which is the pair a
							reader has to hold together: `CCC 1234` and "by paragraph
							number, running unbroken from the first page to the last".

							The label and the clause are still a sentence and the chip
							does not break it, because the chip is not IN it — it is
							pushed to the far edge of the same line. The label was a
							label, then a chip, then an em dash, then a clause once, which
							wrapped badly and read as nothing.

							The chip is not a link and the row's heading is: one door per
							row, and it opens on the work rather than on a paragraph of
							it. The row runs for every work, including the one with no
							specimen — prayers are cited by name, and that sentence is the
							whole answer for them.
						-->
						<p class="book-cite">
							<span>
								<span class="cite-label">{t('schola.cite.label')}</span>
								{t(`schola.cite.${work.key}`)}
							</span>
							{#if specimens[work.key]}
								<span class="cite-example">{specimens[work.key]}</span>
							{/if}
						</p>
					</div>
				</li>
			{/each}
		</ul>

		<!--
			THE THREE THAT ARE PAGES RATHER THAN TEXTS. They were rows in the
			chrome guide above until 2026-09-06 and did not belong there: a
			reader looking for the Library wants somewhere to go, not a button.
			Here they answer the section's own question — what is on this site —
			and the group heading is what says they answer the other half of it,
			"and how it is cited", with nothing.
		-->
		<h3 class="group">{t('schola.places.heading')}</h3>
		<ul class="book-grid places">
			{#each PLACES as place (place.key)}
				<li class="book">
					<span class="book-icon"><Icon name={place.icon} /></span>
					<div class="book-text">
						<h4><a href={place.href}>{t(place.titleKey)}</a></h4>
						<p class="book-what">{t(`schola.what.${place.key}`)}</p>
					</div>
				</li>
			{/each}
		</ul>
	</section>
	<!--
		THE PICTURE IS THE HINGE, AND IT WAS THE MASTHEAD UNTIL 2026-09-06.

		Above the title it was doing the job a masthead does — announcing a page
		before the page says anything — and this page's first job is to say what
		it is, in a sentence a newcomer can read. Rembrandt's preaching Christ
		got the reader's whole first screen and delayed that sentence by the
		height of a banner.

		Here it does something no masthead can: the page turns at this line. Two
		sections above it list what exists — the chrome, then the works and their
		notation — and two below it ADVISE. That is a change of voice with no
		other mark on it, and a band across the column is the mark, read before
		anyone works out why. A picture of somebody being taught is also the
		right picture for exactly this seam.

		`lazy` now rather than `eager`: it is below the fold at every viewport,
		and the intrinsic size is declared, so the browser reserves the box and
		fetches nothing until the reader gets here.
	-->
	<div class="hinge">
		<ArtFigure art={BANNERS.schola} credit={creditOf(BANNERS.schola)} label={t('art.about')} />
	</div>

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
		<p>
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
		<!-- Minium throughout, because every card in it opens the Bible: the
		     colour is the shelf, so a section that is entirely one shelf is
		     entirely one colour. It is the pigment the Scripture row above
		     wears, which is where a reader can have learnt it. -->
		<section class="suggestion" aria-labelledby="bible-heading">
			<h2 id="bible-heading">{t('schola.bible.heading')}</h2>
			<p class="section-lede">{t('schola.bible.library')}</p>

			<ol class="stages">
				<!--
					THE NUMERAL IS IN THE TITLE, not in a gutter beside it. It was a
					2.25rem column with the whole stage indented past it, which
					bought a tidy edge for the figures and cost the thing that
					matters more: every paragraph and every card in the section
					started an indent in from the page's own margin, so the section
					read as a quotation of itself. A figure at the head of its own
					heading numbers the stage just as well and leaves the content on
					the same line as everything above it.

					It is drawn rather than left to the list marker, because
					`list-style: none` is what lets it be a serif figure at the
					title's size. `aria-hidden`: the `<ol>` already tells a screen
					reader this is an ordered list of three, and a spoken "1" before
					every title would be the count twice.
				-->
				<li class="stage">
					<h3><span class="stage-n" aria-hidden="true">1</span>{t('schola.bible.step.gospel')}</h3>
					<p class="stage-why">
						{t('schola.bible.start')}{#if deiVerbum}<a
								class="source-mark"
								href={deiVerbum.href}
								aria-label={deiVerbum.label}>†</a
							>{/if}
					</p>
					<p class="stage-why">{t('schola.bible.whichGospel')}</p>
					<!-- Every Gospel the reader's edition carries, each with its
						     reason, and no row saying which is right. The disagreement
						     is real, no document settles it, and a page that picked one
						     would be reporting its own preference as the answer to a
						     question the reader could have weighed themselves. -->
					<ul class="picks" data-link-preview="hover">
						{#each gospels as gospel (gospel.key)}
							<li>
								<a class="pick" href={gospel.at?.href}>
									<span class="pick-name">{gospel.at?.label}</span>
									<span class="pick-why">{t(`schola.bible.gospel.${gospel.key}`)}</span>
								</a>
							</li>
						{/each}
					</ul>
				</li>

				{#if acts}
					<li class="stage">
						<h3>
							<span class="stage-n" aria-hidden="true">2</span>{t('schola.bible.step.acts')}
						</h3>
						<p class="stage-why">{t('schola.bible.thenActs')}</p>
						<!-- ONE CARD IS STILL A CARD WITH A REASON ON IT. This one had
						     only a name for a day, because the stage above it has four
						     books to tell apart and this stage has one — which is an
						     argument about DISAMBIGUATION and not about what a card is
						     for. A reader who does not know what Acts is learns nothing
						     from the word "Acts", and the six cards around it all say
						     what they are. -->
						<ul class="picks lone" data-link-preview="hover">
							<li>
								<a class="pick" href={acts.href}>
									<span class="pick-name">{acts.label}</span>
									<span class="pick-why">{t('schola.bible.acts.why')}</span>
								</a>
							</li>
						</ul>
					</li>
				{/if}

				<li class="stage">
					<h3>
						<span class="stage-n" aria-hidden="true">{acts ? 3 : 2}</span>{t(
							'schola.bible.step.old'
						)}
					</h3>
					<p class="stage-why">{t('schola.bible.thenOld')}</p>
					<ul class="picks" data-link-preview="hover">
						{#each oldTestament as step (step.key)}
							<li>
								<a class="pick" href={step.at?.href}>
									<span class="pick-name">{step.at?.label}</span>
									<span class="pick-why">{t(`schola.bible.ot.${step.key}`)}</span>
								</a>
							</li>
						{/each}
					</ul>
				</li>
			</ol>

			<p class="closing">
				{t('schola.bible.bothWays')}{#if verbumDomini}<a
						class="source-mark"
						href={verbumDomini.href}
						aria-label={verbumDomini.label}>†</a
					>{/if}
			</p>
		</section>
	{/if}
</div>

<style>
	/*
	 * THE PICTURE IS A BAND ACROSS THE COLUMN, NOT A PLATE INSIDE IT, and it is
	 * never text on a painting: contrast would have to hold across five
	 * appearance axes — light, sepia, dark, OLED and monochrome — and none of
	 * them is negotiable on a page whose readers are the ones least able to work
	 * around a bad one.
	 *
	 * The margins are generous and UNEQUAL — more above than below — because the
	 * band closes what is above it and introduces what is under it. `/bibliotheca`
	 * keeps the same picture as a masthead, and the two arrangements are the same
	 * component with a different rule around it.
	 */
	.hinge {
		margin: 3rem 0 2.25rem;
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
	 * NOTHING ON THIS PAGE IS MEASURED ANY MORE, and `.landing-measure` came off
	 * in two passes. It was on the `<section>` first, which capped the heading
	 * rule too, so this section ruled two-thirds of the way across a page whose
	 * every other rule ran full width. Moving it to the paragraphs fixed the
	 * rules and left the real complaint standing: a 40rem paragraph in a 72rem
	 * column breaks against an edge the page does not draw, and it does it
	 * mid-section, beside grids and cards that DO run the full width. A reader
	 * sees text stopping at a wall that is not there.
	 *
	 * So the prose runs the column, and what keeps a long line readable is
	 * leading rather than a cap: `1.62` on the running paragraphs, against the
	 * ~1.5 they inherit. The cards are what break the section up now, and they
	 * cap themselves at 14rem tracks.
	 */
	.suggestion {
		margin: 0 0 2.5rem;
	}

	/* The running prose of the two sections that advise — the lede, the reason
	   under a stage title, and the closing paragraph — none of which sits in a
	   card. */
	.section-lede,
	.stage-why,
	.closing,
	section[aria-labelledby='start-heading'] p {
		line-height: 1.62;
	}

	/*
	 * THREE STAGES, AND THE NUMERAL IS THE WHOLE NAVIGATION: a reader who takes
	 * in nothing but `1 Start with a Gospel / 2 Then what happened next / 3 Then
	 * the older half` has the suggestion entire, which is the most this section
	 * can hope for from someone who has never opened a Bible. Everything else in
	 * a stage is for the reader who did not stop there.
	 *
	 * IT SITS IN THE HEADING AND NOT IN A GUTTER BESIDE IT. The gutter was a
	 * 2.25rem column with the stage indented past it, which bought a straight
	 * edge down three figures and charged every paragraph and every card in the
	 * section an indent from the page's own margin — so the section stood in
	 * from everything above it, which is the shape of a quotation. Nothing else
	 * on the page indents, and this section is not quoting anyone.
	 *
	 * Accent, and never a filled circle: it marks a position in a list, not a
	 * step in a process the reader is being marched through.
	 */
	.stages {
		list-style: none;
		display: grid;
		gap: 2rem;
		margin: 0 0 1.5rem;
		padding: 0;
	}

	.stage h3 {
		display: flex;
		align-items: baseline;
		gap: 0.55rem;
		font-family: var(--font-serif);
		font-size: 1.15rem;
		margin: 0 0 0.35rem;
	}

	/* Optically aligned rather than boxed: a figure's own side bearing would
	   otherwise set the title a hair further in than the paragraph under it. */
	.stage-n {
		font-size: 1.6rem;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		color: var(--color-accent);
		margin-inline-start: -0.06em;
		/* The shelf's own colour, like the icons. 1.6rem is large text and owes
		   3:1, which every shelf colour clears on every ground; `.pick-name`
		   further down is 1.1rem, owes 4.5:1, and stays on the accent. */
	}

	.stage-why {
		margin: 0 0 0.7rem;
		font-size: 0.92rem;
		color: var(--color-text-muted);
	}

	/*
	 * HERE THE CARDS ARE CARDS, and the books section three sections up argues
	 * the opposite for its own rows. Both are right, and the difference is what
	 * the reader is being asked to do. A catalogue entry is read; these are
	 * CHOSEN BETWEEN — which of four Gospels, which of four places in the older
	 * half — and a grid of doors is what "pick one" looks like everywhere else
	 * on this site. The whole tile is the link, so the target is a card and not
	 * a two-word name.
	 *
	 * `auto-fill` rather than `auto-fit`, so the stage with one book in it gets
	 * one tile the size of the others instead of a single card stretched across
	 * the column. The empty tracks are the point.
	 *
	 * THE CARD WEARS AN ACCENT RULE ACROSS ITS HEAD, and that is the one place
	 * on this page a border says something rather than merely bounding a box.
	 * Seven cards in a hairline the colour of every other hairline read as seven
	 * empty boxes with words in them; a coloured edge along the top makes them a
	 * SET, and makes the set look chosen. It fills to the accent on hover, so
	 * the same edge is also the answer to being pointed at.
	 *
	 * `--radius-md` and no shadow, exactly as `ShelfCard` — this is that object,
	 * and a second card idiom is how a site stops having one.
	 */
	.picks {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: 0.7rem;
		margin: 0;
		padding: 0;
	}

	/*
	 * A CARD PER BOOK, AND A COLOUR PER CARD. The section is Scripture and
	 * takes minium throughout — its stage figures still do — but eight cards
	 * in one colour is eight identical objects the reader has to read to tell
	 * apart, which is the thing a card grid is supposed to save them. So the
	 * cards walk the ramp: it tells one Gospel from the next and claims
	 * nothing about any of them, which is right, because nothing about a
	 * Gospel is red.
	 *
	 * THE COLOUR IS IN THE EDGE AND NOWHERE ELSE (2026-09-06, by direction). It
	 * washed the ground at 7% as well, on the argument that a 2px rule alone is
	 * not enough to tell one card from the next; eight tinted grounds in one
	 * section turned out to be eight coloured boxes competing with the words in
	 * them, where the rule reads as a marker on a card that is still a card.
	 * The name stays on the accent either way — 1.1rem of serif owes 4.5:1 and
	 * these literals clear 3:1, so the edge is the only thing that can carry a
	 * colour here at all.
	 */
	.pick {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		block-size: 100%;
		padding: 0.8rem 1rem 0.9rem;
		border: 1px solid var(--color-border);
		border-block-start: 3px solid var(--shelf);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		text-decoration: none;
	}

	/*
	 * Each list restarts the walk, so a stage of three and a stage of four both
	 * begin at the same colour. That is deliberate — a stage is a group, and
	 * the eye reads the cards inside one against each other rather than across
	 * the section. The single card of stage two is the exception, taking a
	 * position no neighbour of it uses.
	 */
	.picks li:nth-child(1) .pick {
		--shelf: var(--hue-1);
	}
	.picks li:nth-child(2) .pick {
		--shelf: var(--hue-3);
	}
	.picks li:nth-child(3) .pick {
		--shelf: var(--hue-5);
	}
	.picks li:nth-child(4) .pick {
		--shelf: var(--hue-7);
	}
	.picks.lone .pick {
		--shelf: var(--hue-4);
	}

	/* The whole edge takes the card's colour, the head rule already having it —
	   so hover completes a frame rather than tinting anything. */
	.pick:hover,
	.pick:focus-visible {
		border-color: var(--shelf);
	}

	/*
	 * THE NAME IS ACCENT AT REST, because the card IS a link and nothing else
	 * about it said so. It sat in body colour with the accent held back for
	 * hover, which reads on a touch screen — where there is no hover — as seven
	 * paragraphs in boxes. Every other link on this site is coloured before it
	 * is pointed at.
	 */
	/*
	 * ACCENT AND NOT THE SHELF'S PIGMENT, though the card's edge is that
	 * pigment: 1.1rem is not large text, so this owes 4.5:1, and the pigment
	 * family is mixed halfway to the muted grey and does not clear it on a
	 * dark ground. The rule above the name is what carries the colour, and a
	 * border owes nothing.
	 *
	 * It is coloured AT REST rather than on hover, because the card is a link
	 * and nothing else about it said so — holding the colour back reads on a
	 * touch screen, where there is no hover, as a paragraph in a box.
	 */
	.pick-name {
		font-family: var(--font-serif);
		font-size: 1.1rem;
		line-height: 1.25;
		color: var(--color-accent);
	}

	.pick-why {
		font-size: 0.85rem;
		line-height: 1.45;
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
	 * asked for. `‡` IS reachable, and since 2026-09-06 it is spoken for: the
	 * apparatus draws it for the notes that name no words in the verse, so
	 * setting it here would say something about this sentence that is not true
	 * of it. Both marks live in the two-codepoint font `fonts.css` subsets and
	 * `sw-policy.ts` precaches.
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
		color: var(--color-accent);
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

	/*
	 * THE RULE UNDER A HEADING IS TINTED, and it is the cheapest accent on the
	 * page. Four sections divided by four hairlines in the same grey as every
	 * border in every card is a page with no landmarks in it — the eye has
	 * nothing to count. A rule the colour of the site's own red, mixed a third
	 * of the way from the border, reads as a division rather than as an edge,
	 * and it costs one declaration and no new token.
	 */
	section h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid color-mix(in srgb, var(--color-accent) 32%, var(--color-border));
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
	 * The chrome guide's own grid was the other half of this rule until
	 * 2026-09-07, when its rows moved into the sheet the `?` button opens
	 * (`Help.svelte`, `site/docs/finding.md`). The sheet sets them in one
	 * column, being 34rem wide at most; what is left here is the catalogue.
	 */
	.book-grid {
		list-style: none;
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
	}

	@media (min-width: 80rem) {
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
	 * catalogue card's idiom (`ShelfCard`, drawn on the home page and
	 * `/bibliotheca`) was borrowed here for no better reason than that it was
	 * the nearest thing to hand.
	 *
	 * So the box is gone and the structure is carried by a rule and a gutter:
	 * a hairline above each row, the icon standing free in a fixed inline
	 * gutter, and enough air that the rows separate without being fenced. That
	 * is how a printed reference work sets a list of entries, and this page is
	 * one. It also makes the two-column grid read as a page rather than as a
	 * dashboard.
	 */
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
	 * anything. Sized so glyphs of different natural weight sit on one line
	 * down the grid; `1em` of the font-size set here rather than a pixel size,
	 * which is `Icon.svelte`'s whole contract. Nudged down by the cap height so
	 * it sits on the title's optical centre rather than on its baseline box.
	 *
	 * ONE ACCENT FOR EVERY MARK ON THE PAGE (2026-09-06, by direction), and it
	 * replaced a colour per shelf plus an ordered ramp over the chrome guide
	 * and the three places. What that produced was twenty-odd coloured glyphs
	 * across four grids, and past a certain count a colour stops picking a row
	 * out and becomes the page's texture — every row shouting is every row
	 * quiet. The one list that keeps its variety is the reading suggestion's
	 * cards, where the colour separates eight objects a reader is choosing
	 * BETWEEN rather than labelling rows they are reading down.
	 *
	 * `--shelf-*` and `--hue-*` are untouched in `tokens.css`: `CitedBy` marks
	 * every shelf with the muted mix of the first, and the cards below walk the
	 * second. What is gone is this page asserting a colour per work.
	 *
	 * SIZE AND COLOUR ARE ONE RULE NOW, WHERE THEY HAD TO BE TWO, and the bug
	 * that made them two is worth keeping. `.book-icon { color: var(--shelf) }`
	 * sat ABOVE a `.feature-icon, .book-icon { … color: var(--color-accent) }`
	 * that set the accent for both — two selectors, the same specificity, the
	 * later one winning — so every shelf icon was the house red at rest and
	 * took its colour only from `.book:hover .book-icon` one class higher.
	 * **The feature was inverted: colour appeared on hover and vanished at
	 * rest.** Nothing failed: `svelte-check` saw two live selectors, both used,
	 * and three rounds of palette work were judged against a hover state
	 * because that was the only place the colours appeared. **A cascade bug
	 * looks exactly like a design problem, and it will absorb as much design
	 * work as you give it.** The guide's rows left for `Help.svelte` on
	 * 2026-09-07, so there is one kind of icon here and no shared rule to
	 * override; `pigments.test.ts` still fails a rule that sizes two kinds and
	 * colours them.
	 */
	.book-icon {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		inline-size: 1.5rem;
		font-size: 1.35rem;
		line-height: 1;
		margin-block-start: 0.12rem;
		color: var(--color-accent);
	}

	/* Hover deepens the accent rather than changing it: a mark that answers by
	   becoming a different colour is a mark that was not the row's colour to
	   begin with. Declared under a flat accent, which is what a browser without
	   `color-mix()` keeps. */
	.book:hover .book-icon {
		color: var(--color-accent);
		color: color-mix(in oklab, var(--color-accent) 75%, var(--color-text));
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
	.book-text {
		flex: 1;
		min-width: 0;
	}

	/*
	 * A GROUP INSIDE A SECTION: the bar a control lives on, or the fact that a
	 * row has no citation form. Serif like every other heading here, but
	 * without `section h2`'s rule — a second horizontal line one level down
	 * would divide the section it is inside, which is the opposite of what a
	 * subheading does.
	 */
	.group {
		font-family: var(--font-serif);
		font-size: 1rem;
		font-weight: 600;
		margin: 1.5rem 0 0.6rem;
		color: var(--color-text-muted);
	}

	.book h4 {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		margin: 0 0 0.2rem;
	}

	/*
	 * A LIST-SHAPED SURFACE OPTS OUT OF THE UNDERLINE AT REST, which is the
	 * exemption `base.css` names for the breadcrumb, the nav and the index
	 * cards: the mark earns its place under a link sitting inside a sentence,
	 * and every title down this grid is a link, so an underline on each is a
	 * column of rules through a reference list. Hover and focus restore it —
	 * the arrival IS the interaction, per the same rule.
	 *
	 * IT ARRIVES IN THE LINK'S OWN COLOUR and not in the apparatus grey, which
	 * `base.css` rejects in as many words: this link carries the rubric red,
	 * and a grey rule under a red word reads as a mistake. `a:hover` there
	 * already sets `text-decoration-color: currentColor`, so nothing here has
	 * to name a colour at all.
	 */
	.book h4 a {
		text-decoration: none;
	}

	.book h4 a:hover,
	.book h4 a:focus-visible {
		text-decoration: underline;
	}

	.book-what {
		margin: 0;
		font-size: 0.9rem;
	}

	/*
	 * The sentence and its specimen on one line, the specimen pushed to the
	 * trailing edge so the notations form a column of their own down the grid.
	 * Baselines, not boxes: a sentence at 0.8rem and a chip with its own
	 * padding have different box heights, and agreeing on the line they sit on
	 * is what makes the pair read as one row rather than as two things.
	 *
	 * `gap` is generous because the two are not a phrase — the sentence ends,
	 * and the specimen is an exhibit beside it.
	 */
	.book-cite {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
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
		text-decoration: none;
		border-radius: var(--radius-sm);
		/*
		 * MUTED, AND IT WORE THE ACCENT FOR A DAY. The chip is on the "Identified"
		 * row now, and that row is 0.8rem of `--color-text-muted` — so an accent
		 * chip was the loudest thing on the quietest line of the card, shouting
		 * a sentence it is only the exhibit for. Its own colour is the row's:
		 * the label, the clause and the specimen are one line and read as one.
		 *
		 * WHAT MAKES IT FINDABLE IS THE BOX, NOT THE COLOUR. It is drawn as
		 * something to type, in the idiom the shortcut sheet's keycaps already
		 * use — the interface face on the page's own ground inside a hairline —
		 * and a column of those down the trailing edge is a column whether or
		 * not it is coloured. A specimen is not a control, and a chip loud
		 * enough to be one reads as a button to press.
		 *
		 * NOT A MONOSPACE, which is the other way a reader might be told "this
		 * is notation": the site has exactly two faces and `docs/reading.md`
		 * splits them on authorship, so a third introduced for eight scraps
		 * would be a new axis to maintain everywhere. Tabular figures for the
		 * same reason the stage numerals have them.
		 */
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		background: var(--color-bg-elevated);
	}

	/* The pictures print themselves — `ArtFigure` carries its own print rules,
	   including turning its caption control back into the line it opens. */
	@media print {
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
