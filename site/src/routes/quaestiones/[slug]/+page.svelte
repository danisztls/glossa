<script lang="ts">
	import { hrefFor } from '$lib/address';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import { content } from '$lib/content.svelte';
	import { sidenoteRoom } from '$lib/sidenotes.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { CccParagraph, DocumentSection } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * THIS PAGE HAS NO GUTTER, so the citations go back to being a disclosure
	 * inside the text (`sidenotes.svelte.ts`, `#claims`) — the same claim
	 * `CompareGrid` makes and for the same underlying reason, arrived at from
	 * the opposite direction. There the slack is spent by a second column;
	 * here it was never reserved at all. The margin is not a gutter some
	 * layout owns: it is whatever `.reading-layout` leaves over, and this page
	 * is not that layout, so every `.margin-note` rendered into it landed in
	 * the paragraph it belonged beside — the citation's text set in the middle
	 * of the sentence that raised it.
	 *
	 * DECLARED HERE RATHER THAN PASSED DOWN, on `CompareGrid`'s reasoning: the
	 * alternative is a prop threaded through `ProseBlocks` and every component
	 * under it to tell each one a fact about the layout it is in.
	 *
	 * WHAT THE READER GETS is the apparatus as it already is below the margin
	 * breakpoint — the marker opens a card on click, and on hover where there
	 * is a pointer. Nothing about a citation is lost; it stops being open
	 * beside the line and goes back behind the number, which is what this page
	 * has room for.
	 */
	$effect(() => sidenoteRoom.claim());

	/**
	 * EACH WORK IS SHOWN IN THE READER'S OWN LANGUAGE, which is a preference
	 * and not a route parameter: `+page.ts` embeds every language the corpus
	 * has this topic's units in, and the choice is made here so that changing
	 * it takes effect without a navigation.
	 *
	 * The fallback is `useEditionCompare`'s, restated rather than imported
	 * because this page has no compare mode and that hook resolves a second
	 * edition against a global store: prefer the reader's language, and where
	 * this topic has no edition in it take the first the corpus does have,
	 * rather than indexing blind and rendering nothing.
	 *
	 * RESOLVED THREE TIMES AND NOT ONCE. The three works have three different
	 * language sets and three preferences behind them — a reader may read the
	 * Catechism in Portuguese and the Code in Latin, and `content.langFor`
	 * already keeps those apart everywhere else on the site. One language
	 * chosen for the page would have to be wrong for two of its blocks or
	 * hide them.
	 */
	/** An EMPTY map is the ordinary case for two of the three — most topics
	 *  name no Compendium section and no canon — so this answers `''` there
	 *  rather than `undefined`, and the lookup that follows misses cleanly. */
	function preferred<T>(byLang: Partial<Record<string, T>>, want: string): string {
		return byLang[want] ? want : (Object.keys(byLang)[0] ?? '');
	}

	const lang = $derived(preferred(data.byLang, content.langFor('catechism')));
	const edition = $derived(data.byLang[lang]);

	const socialDoctrineLang = $derived(
		preferred(data.socialDoctrineByLang, content.langFor('social-doctrine'))
	);
	const socialDoctrine = $derived(data.socialDoctrineByLang[socialDoctrineLang]);

	const canonLang = $derived(preferred(data.canonsByLang, content.langFor('canon-law')));
	const canons = $derived(data.canonsByLang[canonLang]);

	/**
	 * THIS PAGE RENDERS OTHER PEOPLE'S TEXT AND SAYS WHOSE.
	 *
	 * Every word of text below is the Catechism's, the Compendium of the
	 * Social Doctrine's or the Code's, through the same `ProseBlocks` their
	 * own pages use, so a topic cannot come to disagree with
	 * `/catechismus/{n}`, `/doctrina-socialis/{n}` or `/ius-canonicum/{n}`
	 * about what a unit says. What this page adds is the arrangement — which
	 * units, in which order — and the name is a promise about arrangement
	 * (`docs/decisions.md` §Posture). So the heading is a question, the body
	 * is quotation, and there is no sentence of ours between them explaining
	 * what the quotation means.
	 *
	 * EACH BLOCK IS HEADED BY THE WORK IT QUOTES, which is what earns the
	 * second and third of them. The Catechism, the Compendium and the Code
	 * teach at different levels — a summary, its development, and the law —
	 * and a reader who cannot see which one they are reading has been handed a
	 * composite nobody wrote.
	 *
	 * The reader is told the order is ours whenever it is, and `lead` is
	 * resolved per language: an edition short the paragraph the topic wanted
	 * first renders in printed order, and must not then claim otherwise.
	 */
	const reordered = $derived(edition?.lead !== undefined);

	const title = $derived(t(`quaestiones.${data.slug}.title`));
	const question = $derived(t(`quaestiones.${data.slug}.question`));

	const cluster = $derived(t(`quaestiones.cluster.${data.topic.cluster}`));
	const shelfHref = $derived(`/quaestiones#${data.topic.doorway}-${data.topic.cluster}`);

	/**
	 * A DOCUMENT IS NAMED IN THE EDITION THE READER WOULD OPEN, not in
	 * English. `content.documentWorkIdFor` is the same resolver the link
	 * itself goes through, so the title on this page and the title on the page
	 * it leads to are the same words — which is the whole reason to take the
	 * title from the corpus rather than restate it in the interface. Falls
	 * back to any edition the group has, since a group with no manifests would
	 * not have survived the sync.
	 */
	function documentTitle(group: (typeof data.documents)[number]): string {
		const workId = content.documentWorkIdFor(group.slug);
		const manifests = Object.values(group.manifests);
		const preferred = manifests.find((manifest) => manifest?.id === workId);
		return (preferred ?? manifests[0])?.title ?? group.slug;
	}
</script>

<svelte:head>
	<title>{title} — {t('home.title')}</title>
</svelte:head>

<!--
	ONE ROW SHAPE FOR THREE WORKS. A quoted unit is its number, linked to the
	page that IS that number's address, beside its text; the three blocks
	differ in nothing else, because they are the same act — this site showing
	somebody else's numbered paragraph and saying where it stands.
-->
{#snippet quoted(
	unit: CccParagraph | DocumentSection,
	href: string,
	lang: string,
	work: string | undefined
)}
	<div class="paragraph">
		<a class="n" {href}>{unit.n}</a>
		<div class="text">
			<ProseBlocks {unit} {lang} {work} />
		</div>
	</div>
{/snippet}

<article class="topic">
	<div class="breadcrumb-row">
		<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
			<a href="/quaestiones">{t('quaestiones.landing.title')}</a>
			<span class="sep">›</span>
			<!-- THE SHELF IS A CRUMB, and it is the only navigation this page
			     has back to its neighbours. `/quaestiones` draws sixteen shut
			     shelves; a reader arriving here from a search engine — which is
			     how most of them arrive — was told nothing about which one this
			     question is on, and clicking the first crumb landed them in a
			     closed list of sixteen with no idea where they had been.

			     The fragment is the shelf's own id (`{doorway}-{cluster}`, the
			     landing page's `shelf.id`), which that page opens on arrival:
			     it reads the hash and sets the disclosure open. So this is a
			     link to a shelf standing open at the question just left, not to
			     a page-top the reader has to search. -->
			<a href={shelfHref}>{cluster}</a>
			<span class="sep">›</span>
			<!-- The last crumb is this page, so it is an `<a>` with no `href` —
			     the shape `.breadcrumb a[href]` in reading-chrome.css exists to
			     tell apart, so that hover offers nothing to follow here. -->
			<a href={undefined} aria-current="page">{title}</a>
		</nav>
	</div>

	<header>
		<h1>{title}</h1>
		<p class="question">{question}</p>
	</header>

	{#if edition}
		<section class="passages">
			<h2 class="label">{t('quaestiones.passages.heading')}</h2>
			{#if reordered}
				<p class="note">{t('quaestiones.passages.reordered')}</p>
			{/if}
			{#each edition.paragraphs as paragraph (paragraph.n)}
				{@render quoted(paragraph, hrefFor({ kind: 'ccc', n: paragraph.n }), lang, undefined)}
			{/each}
		</section>
	{/if}

	{#if socialDoctrine}
		<section class="passages">
			<h2 class="label">{t('quaestiones.socialDoctrine.heading')}</h2>
			<p class="note">{t('quaestiones.socialDoctrine.blurb')}</p>
			{#each socialDoctrine.sections as section (section.n)}
				{@render quoted(
					section,
					hrefFor({ kind: 'socialDoctrine', n: section.n }),
					socialDoctrineLang,
					socialDoctrine.work.id
				)}
			{/each}
		</section>
	{/if}

	{#if canons}
		<section class="passages">
			<h2 class="label">{t('quaestiones.canons.heading')}</h2>
			<p class="note">{t('quaestiones.canons.blurb')}</p>
			{#each canons.sections as canon (canon.n)}
				{@render quoted(
					canon,
					hrefFor({ kind: 'canonLaw', n: canon.n }),
					canonLang,
					canons.work.id
				)}
			{/each}
		</section>
	{/if}

	{#if data.documents.length > 0}
		<section class="documents">
			<h2 class="label">{t('quaestiones.documents.heading')}</h2>
			<p class="note">{t('quaestiones.documents.blurb')}</p>
			<ul>
				{#each data.documents as group (group.slug)}
					<li>
						<a href={hrefFor({ kind: 'document', slug: group.slug })}>
							{documentTitle(group)}
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>

<style>
	.topic {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1rem;
	}

	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	.question {
		margin: 0 0 2rem;
		font-style: italic;
		color: var(--color-text-muted);
	}

	.label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		margin: 2rem 0 0.75rem;
		font-weight: 600;
	}

	.note {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin: 0 0 1rem;
	}

	.paragraph {
		display: flex;
		gap: 0.9rem;
		margin-bottom: 1.25rem;
	}

	.n {
		flex: 0 0 auto;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		padding-top: 0.25rem;
		text-decoration: none;
	}

	.n:hover {
		color: var(--color-link);
		text-decoration: underline;
	}

	.text {
		min-width: 0;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
	}

	li {
		margin-bottom: 0.35rem;
	}

	/*
	 * THE LIST AT THE FOOT OF THE PAGE DROPS THE UNDERLINE AT REST, on the
	 * exemption `base.css` names and `/schola`'s catalogue took: the mark earns
	 * its place under a link sitting inside a sentence, and every line of this
	 * list is a link, so an underline on each is a stack of rules under a
	 * short list of names. Hover and focus restore it — the arrival IS the
	 * interaction, per the same rule.
	 *
	 * SCOPED TO THIS LIST AND NOT THE PAGE. The citations inside the quoted
	 * text above are links in running prose, which is the case the underline
	 * exists for, and `ProseBlocks` owns their apparatus styling besides.
	 */
	.documents a {
		text-decoration: none;
	}

	.documents a:hover,
	.documents a:focus-visible {
		text-decoration: underline;
	}
</style>
