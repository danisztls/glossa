<script lang="ts">
	import { hrefFor } from '$lib/address';
	import { citationFor } from '$lib/citation-label';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import { content } from '$lib/content.svelte';
	import { sidenoteRoom } from '$lib/sidenotes.svelte';
	import { i18n, t } from '$lib/i18n.svelte';
	import { editorialSourceAddresses, editorialSourceLine, sourceLinks } from '$lib/topic-sources';
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
	 * THERE IS EXACTLY ONE EXCEPTION AND IT IS DECLARED PER TOPIC. A topic
	 * carrying `editorial` prints a paragraph of this site's own, above
	 * everything else, under a heading naming this site where every other
	 * block is headed by the work it quotes. The heading IS the disclosure —
	 * it stands in the same slot and answers the same question, "whose words
	 * are these", so a reader learns it once and it holds on every block.
	 * `site/quaestiones.json` states the test a topic must pass to earn one
	 * and why `associationes-massonicae` is the topic that does: a reader who
	 * has been told all their life that Freemasonry means automatic
	 * excommunication can read every quoted text on that page and find
	 * nothing that contradicts them, because a canon does not print the
	 * penalties it declines to impose.
	 *
	 * IT GOES FIRST, which is the part worth arguing. Putting our voice above
	 * somebody else's is the risk; leaving a reader to misread three works
	 * before meeting the correction is the certainty, and the whole reason
	 * this topic has the field is that the misreading is what they arrived
	 * with. `lead`'s argument, one level up — printed order is itself an
	 * ordering, and the alternative to choosing is not neutrality.
	 *
	 * THE SUMMARY IS NOT AN EXCEPTION TO THAT, and it is the place somebody
	 * will look for one. A topic that runs long opens on the Catechism's own
	 * IN BRIEF paragraphs, which is still quotation and still addressed —
	 * every one of them is a number linking to `/catechismus/{n}` — because
	 * the Church prints a short form of each of its articles and the corpus
	 * carries the flag. A summary composed HERE would be the one thing this
	 * page has never done: our voice, in the Catechism's place, at the top,
	 * read by the reader in a hurry INSTEAD of the quotation and carried away
	 * as the Church's.
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
	 * The note's footing: the dictionary's own sentence with this topic's
	 * sources spliced into it as links.
	 *
	 * `$derived` ALL THE WAY DOWN, because every input moves under the reader.
	 * `citationFor` reads the interface dictionary for the siglum and the
	 * reader's own content language for a document's title, and the list's
	 * punctuation is the interface language's — so a note whose links were
	 * resolved once at load would keep one reader's language after another
	 * chose differently, which is the defect `+page.ts` records for the
	 * passages themselves.
	 */
	const sourceLine = $derived(
		data.topic.editorialSources
			? editorialSourceLine(
					t(`quaestiones.${data.slug}.editorial.sources`),
					sourceLinks(editorialSourceAddresses(data.topic.editorialSources), citationFor),
					i18n.lang
				)
			: []
	);

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

	<!-- AN `<aside>` AND NOT A `<section>`: everything else in this article is
	     the material the page exists to show, and this is a remark beside it.
	     Its heading is the disclosure (see the docblock), so it is drawn with
	     the same `.label` as the block headings and in the same place — the
	     reader is not being asked to learn a second convention, only to read
	     the one they are already reading. -->
	{#if data.topic.editorial}
		<aside class="editorial">
			<h2 class="label">{t('quaestiones.editorial.heading')}</h2>
			{#each t(`quaestiones.${data.slug}.editorial`).split('\n\n') as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
			<!-- THE ONE PARAGRAPH HERE THAT NOBODY ELSE'S AUTHORITY STANDS
			     BEHIND IS THE ONE THAT OWES ITS SOURCES, which is the reverse
			     of how the rest of the page works: a quoted unit carries its
			     number and needs no apparatus, and this carries no number
			     because it addresses none. Set as apparatus rather than as
			     argument — muted, above a rule — so that it reads as the
			     footing under the note and not as another sentence of it.

			     THE CITATIONS IN IT ARE LINKS AND THE PARAGRAPHS ABOVE ARE
			     NOT, deliberately: a footing is scanned for the one unit a
			     reader wants to check, and a paragraph of argument dotted with
			     links is read as a list of links. They carry no
			     `data-link-preview`, which is how a citation says it is one
			     (`citation-links.ts`) — so each peeks on hover and on tap
			     without this surface having to remember the feature exists. -->
			<p class="sources">
				{#each sourceLine as part, p (p)}{#if 'link' in part}<a href={part.link.href}
							>{part.link.label}</a
						>{:else}{part.text}{/if}{/each}
			</p>
		</aside>
	{/if}

	<!-- THE SHORT ANSWER COMES FIRST AND IS STILL SOMEBODY ELSE'S, drawn from
	     the Catechism's own IN BRIEF runs. Rendered through the same snippet as
	     everything below it, so each summary paragraph carries its number and
	     its address; what this page chose is which of them and in what order,
	     and the note says so. Most topics name none and this block is absent. -->
	{#if edition && edition.brief.length > 0}
		<section class="passages brief">
			<h2 class="label">{t('quaestiones.brief.heading')}</h2>
			<p class="note">{t('quaestiones.brief.blurb')}</p>
			{#each edition.brief as paragraph (paragraph.n)}
				{@render quoted(paragraph, hrefFor({ kind: 'ccc', n: paragraph.n }), lang, undefined)}
			{/each}
		</section>
	{/if}

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
			<!-- `role="list"` because `list-style: none` drops the list role in
			     Safari, and a list of documents that VoiceOver does not count is
			     the one thing this block was for. -->
			<ul role="list">
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

	/*
	 * THE HEADINGS ARE LABELS AND EVERYTHING UNDER THEM IS READ. The title,
	 * the block headings and the footings are our words for the parts of this
	 * page and take the interface face; the question, the note we wrote and
	 * every quoted unit are what the reader came for and take the reading
	 * face. `/schola` and the colophon are set the same way.
	 *
	 * The quoted paragraphs had been in the interface face since this page
	 * shipped — nothing here named a family, so the Catechism was rendered in
	 * the chrome's face on the one surface that quotes it outside a reading
	 * page.
	 */
	h1 {
		font-size: 1.6rem;
		margin: 0 0 0.35rem;
	}

	.question,
	.editorial p,
	.text {
		font-family: var(--font-serif);
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

	/*
	 * THE ONE BLOCK THAT IS NOT A QUOTATION LOOKS LIKE THE ONE BLOCK THAT IS
	 * NOT A QUOTATION. Everything else on this page is set as running text on
	 * the page's own ground, because it is what the reader came to read; this
	 * is lifted onto the elevated ground and closed with a border, so that at
	 * a glance — before the heading is read, and after it has been forgotten
	 * — it is visibly a different KIND of thing from the columns of numbered
	 * paragraphs under it. The accent rule down the inline start is the only
	 * saturated colour on the page and is spent here deliberately: this is
	 * the one place the site is answerable for what it says.
	 *
	 * It carries no `.paragraph` grid, which is the quiet half of the same
	 * signal: every quoted unit on this page hangs a number in the margin,
	 * and this block has nothing to hang there because it addresses no
	 * numbered unit and has no address of its own.
	 */
	.editorial {
		margin: 2rem 0 0;
		padding: 0.25rem 1.25rem 1rem;
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-inline-start: 3px solid var(--color-accent);
		border-radius: 2px;
	}

	.editorial p {
		margin: 0 0 0.75rem;
	}

	.editorial p:last-child {
		margin-bottom: 0;
	}

	.editorial .sources {
		font-family: var(--font-sans);
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	/*
	 * `RefText`'s `.ref-link` treatment, restated rather than borrowed: that
	 * class is scoped to its own component, and a class name reached across a
	 * Svelte boundary is silently unstyled (`site/CLAUDE.md`).
	 *
	 * QUIET FOR THIS LINE'S OWN REASON AS WELL. The footing is muted type, and
	 * eight citations in `--color-link` would be the brightest thing in the
	 * note — an apparatus outshouting the paragraph it supports. The underline
	 * is what says `link` at rest, which is also what keeps it a link under
	 * `data-mono`, where there is no colour to spend.
	 */
	.editorial .sources a {
		color: inherit;
		text-decoration: underline;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	.editorial .sources a:hover,
	.editorial .sources a:focus-visible {
		color: var(--color-link);
		text-decoration-color: currentColor;
	}

	/*
	 * THE SUMMARY IS MARKED AND NOT DECORATED. A block that reads exactly like
	 * the body it summarises is not a summary to anybody scrolling, and the
	 * heading that says which it is is the thing a reader in a hurry skips.
	 * One rule down the inline start is the whole treatment: it costs no
	 * colour and no second surface, and it is the site's existing mark for
	 * apparatus set into the flow — `print.css` gives a margin note and a note
	 * card the same 2px when paper takes them out of their own boxes. Logical
	 * rather than `left`, so it moves to the other side in RTL.
	 *
	 * The heading is INSIDE the rule, which is what keeps the block one thing:
	 * a rule starting under the label would read as a quotation the label
	 * introduces, and this is not an introduction to the passages — it is the
	 * short form of them.
	 */
	.brief {
		border-inline-start: 2px solid var(--color-border);
		padding-inline-start: 1.1rem;
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

	/*
	 * THE MARK IS DRAWN AND NOT INHERITED, which is what the rest of the site
	 * does with a bullet — `/colophon`'s list is the same three rules. A native
	 * disc is the browser's: sized to nothing else on the page, at full ink
	 * beside titles that are the only thing here worth reading, and it moves
	 * the text off the measure by whatever the user agent thinks an indent is.
	 * A small square in the muted colour marks the line without competing with
	 * it. Positioned rather than handed to `::marker`, which takes only a few
	 * properties and lands differently across engines; `inset-inline-start`
	 * puts it on the correct side in RTL, where a `padding-left` would not.
	 */
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		position: relative;
		margin-bottom: 0.35rem;
		padding-inline-start: 1.1rem;
	}

	li::before {
		content: '⬝';
		position: absolute;
		inset-inline-start: 0;
		color: var(--color-text-muted);
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
