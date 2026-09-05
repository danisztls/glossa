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
	 * that states it. The site sequences nothing on its own authority.
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
	 * stale. The nineteen `schola.*` keys are the page's own name, the route
	 * names, the sentence citing each source, and the seven sentences saying
	 * what kind of thing each shelf holds — the last of which is the section
	 * §5 actually stops at, and the only part of this page that is new writing
	 * rather than new arrangement.
	 *
	 * The shelf headings and every work's description below reuse keys that
	 * already exist in all thirty-seven dictionaries, the same rule
	 * `/bibliotheca` and the home page's doors follow.
	 */
	import {
		getBook,
		getCccStructure,
		getCompendiumStructure,
		getDocumentManifest,
		getPrayerMeta,
		getWork,
		hasBookIntro,
		listDocuments,
		listWorksOfType,
		socialDoctrineOutline
	} from '$lib/corpus';
	import { hrefFor } from '$lib/address';
	import { content } from '$lib/content.svelte';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import { socialDoctrineHeadingHref } from '$lib/socialDoctrineNav';
	import {
		councilRoute,
		gospelsRoute,
		pillarsRoute,
		socialRoute,
		type LearningRoute
	} from '$lib/learning-routes';
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

	// --- The Council --------------------------------------------------------
	const documents = $derived(listDocuments());

	// --- The social doctrine ------------------------------------------------
	const socialLang = $derived(content.langFor('social-doctrine'));

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
			councilRoute({
				documents,
				manifestOf: (group) => {
					const workId = content.documentWorkIdFor(group.slug);
					return workId ? getDocumentManifest(workId) : undefined;
				},
				// The Council's first constitution, which is where its own account
				// of what it was doing begins.
				source: hrefFor({ kind: 'document', slug: 'sacrosanctum-concilium' })
			}),
			socialRoute({
				outline: socialDoctrineOutline(socialLang),
				hrefAt: (n) => socialDoctrineHeadingHref(socialLang, n),
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

<div class="content-column">
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
			<h2 id="route-{route.key}">{t(`schola.route.${route.key}.title`)}</h2>
			<!-- The citation is the route's warrant, so it is a link and not a
			     caption: a reader who doubts that this order is the Church's and
			     not ours can go and read the paragraph that sets it out. -->
			<p class="route-source">
				<a href={route.source}>{t(`schola.route.${route.key}.source`)}</a>
			</p>
			<ol>
				{#each route.steps as step (step.href)}
					<li>
						<a class="step" href={step.href}>{step.label}</a>
						{#each step.offers as offer (offer.href)}
							<a class="offer" href={offer.href} title={offer.title}>
								{offer.label ?? t(offer.labelKey ?? '')}
							</a>
						{/each}
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	<section class="shelves" aria-labelledby="shelves-heading">
		<h2 id="shelves-heading">{t('schola.kinds.heading')}</h2>
		{#each shelves as shelf (shelf.key)}
			<div class="shelf">
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
		{/each}
	</section>
</div>

<style>
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

	section h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 2.25rem 0 0.4rem;
	}

	.route-source {
		margin: 0 0 0.75rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		max-width: 40rem;
	}

	.route ol {
		margin: 0;
		padding-inline-start: 1.5rem;
	}

	.route li {
		padding: 0.3rem 0;
	}

	.step {
		font-family: var(--font-serif);
	}

	/* The chips state a second offer on the same step and must never outweigh
	   the step itself — `¶1–1065` beside "Part One" is a range, not a rival
	   destination. */
	.offer {
		display: inline-block;
		margin-inline-start: 0.5rem;
		padding: 0.05rem 0.4rem;
		font-size: 0.75rem;
		font-variant-numeric: tabular-nums;
		text-decoration: none;
		color: var(--color-text-muted);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm, 0.25rem);
	}

	.offer:hover,
	.offer:focus-visible {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.shelf {
		margin: 1.25rem 0;
		max-width: 40rem;
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
</style>
