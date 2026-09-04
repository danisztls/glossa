<!--
	Version/edition selector: which edition of the work currently in view the
	reader is reading — including an edition in another language (distinct
	from the UI language switch, `LanguageMenu`; see content.svelte.ts).

	Contextual by route: lists Bible editions under `/scriptura`, Catechism
	editions under `/catechismus`, Compendium editions under `/catechismus/compendium`, prayer
	collection editions under `/preces` (same one-canonical-work-per-language
	shape as the Compendium), Social Doctrine editions under
	`/doctrina-socialis`, this ONE document's editions under
	`/documenta/{slug}`, and renders nothing anywhere else (`context()` below
	returns undefined for e.g. the home page, where no work is in view).

	DOCUMENTS ARE A THIRD SHAPE OF CONTEXT, NOT A FOURTH `WorkTypeKey`: the
	Bible/CCC/Compendium branches all resolve editions through
	`content.workIdFor(type)`/`listEditions(type)`, keyed by a fixed
	`WorkTypeKey` with a small, corpus-wide edition list. A document doesn't
	have "the" edition list — `/documenta/lumen-gentium` and
	`/documenta/gaudium-et-spes` each have their OWN EN/PT pair — so
	`context()` returns a `{ kind: 'document', slug }` variant instead, and
	every branch below that touches editions/the content store forks on
	`ctx.kind` to reach `getDocumentGroup(slug)`/`content.documentWorkIdFor`/
	`content.setDocument` instead (see `content.svelte.ts`'s docblock for why
	those are separate methods, not `workIdFor('document')`).

	EVERY URL IS EDITION-FREE NOW (site/docs/addresses.md). This used to be the
	one place with a fork in it: CCC and Compendium URLs named no edition, so
	picking one was a pure store write, while the Bible's reading route
	carried `/scriptura/{edition}/{book}/{chapter}` and had to *navigate* on a
	pick or the URL and the reader's choice would disagree. The Bible now
	embeds every edition at an edition-free address and renders whichever the
	store says, so that fork is gone and all four contexts behave alike:
	choosing an edition writes the preference and the open page re-renders in
	place, with no navigation at all.

	`editionStyle` FORKS BOTH THE TRIGGER AND THE PANEL ROWS: only the Bible is
	expected to ever carry more than one edition in the same language, so
	everywhere else "choosing an edition" is functionally choosing a language.
	The trigger shows that language's own name (e.g. "English") rather than an
	edition's `short_title`, which for a document is its own Latin-incipit-style
	title and says nothing about what got picked. Each panel row collapses the
	same way, to just the language name and its code badge ("English EN") with
	no title/copyright line — a document's title and copyright are already on
	the page itself once read, so repeating them per row here was noise, not
	information, when there's only one edition per language to begin with.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { content, type WorkTypeKey } from '$lib/content.svelte';
	import {
		currentPrayerEditionId,
		getDocumentGroup,
		listEditions,
		listPrayerEditions,
		baseLang,
		languageDisplayName
	} from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import { matchesQuery } from '$lib/highlight';
	import {
		editionSearchText,
		FILTER_MIN_ROWS,
		orderByLangChain,
		readerLangChain
	} from '$lib/menu-filter';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { keepInViewport } from '$lib/floating';
	import { i18n, t } from '$lib/i18n.svelte';
	import { navigatorLangs } from '$lib/ui-langs';
	import type { DocumentManifest, WorkManifest } from '$lib/types';

	/**
	 * `pair` is `/catechismus` itself, which indexes the Catechism AND its
	 * Compendium — so its picker offers every language carrying EITHER, and
	 * choosing one sets both (see `choose`). The reading routes under it stay
	 * single-work contexts.
	 */
	type Context =
		| { kind: 'type'; type: WorkTypeKey }
		| { kind: 'document'; slug: string }
		| { kind: 'pair'; types: readonly [WorkTypeKey, WorkTypeKey] };

	const CATECHISM_PAIR = ['catechism', 'compendium'] as const;

	function context(pathname: string): Context | undefined {
		if (pathname === '/scriptura' || pathname.startsWith('/scriptura/')) {
			return { kind: 'type', type: 'bible' };
		}
		// BEFORE the Catechism's own prefix, which would otherwise swallow it:
		// `/catechismus/compendium/12` starts with `/catechismus/`, so from the
		// day the Compendium moved under the Catechism (2026-08-28) until this
		// was reordered, a reader on a Compendium question was offered the
		// CATECHISM's editions and picking one changed nothing on the page.
		if (pathname === '/catechismus/compendium' || pathname.startsWith('/catechismus/compendium/')) {
			return { kind: 'type', type: 'compendium' };
		}
		// The index presents both works; everything under it is one or the other.
		if (pathname === '/catechismus') {
			return { kind: 'pair', types: CATECHISM_PAIR };
		}
		if (pathname.startsWith('/catechismus/')) {
			return { kind: 'type', type: 'catechism' };
		}
		if (pathname === '/preces' || pathname.startsWith('/preces/')) {
			return { kind: 'type', type: 'prayer' };
		}
		// The Compendium of the Social Doctrine, whose ten editions were
		// unreachable from the pages that read them until 2026-09-02: the work
		// was already a `WorkTypeKey` and `listEditions` already answered for
		// it, so the store, the fallback chain and every consumer of
		// `content.langFor('social-doctrine')` were complete — this map was the
		// only thing that had not been told the route exists, and the bar
		// rendered the trigger for no work at all. THAT is the failure mode to
		// watch for when a work is added: nothing here throws, the picker is
		// simply absent, and the page reads correctly in whichever edition the
		// fallback happened to pick.
		if (pathname === '/doctrina-socialis' || pathname.startsWith('/doctrina-socialis/')) {
			return { kind: 'type', type: 'social-doctrine' };
		}
		// The Code of Canon Law, seven editions. Added here at the same time
		// as the route, which is the lesson the paragraph above records: this
		// map is the one place a new work can be forgotten without anything
		// failing.
		if (pathname === '/ius-canonicum' || pathname.startsWith('/ius-canonicum/')) {
			return { kind: 'type', type: 'canon-law' };
		}
		// The Summa's menu offers English and Latin and no Portuguese, which
		// is the work's permanent shape rather than a gap (docs/decisions.md
		// §Scope). `listEditions` is already language-agnostic, so the
		// menu needs nothing beyond being told this route has a work type.
		if (pathname === '/doctores/summa' || pathname.startsWith('/doctores/summa/')) {
			return { kind: 'type', type: 'summa' };
		}
		// `/documenta` itself (the library) has no single document in view —
		// same "renders nothing" behavior as the home page, hence `startsWith`
		// with the trailing slash rather than a bare prefix check.
		// `/documenta/[slug]` is the only route below it, and it sets
		// `page.params.slug`.
		if (pathname.startsWith('/documenta/') && page.params.slug) {
			return { kind: 'document', slug: page.params.slug };
		}
		return undefined;
	}

	const ctx = $derived(context(page.url.pathname));

	/** Read once: a browser's language list is a setting the reader leaves the
	 *  site to change. Raw rather than `navigatorUiLangs`, because what is
	 *  being ranked is editions and not chrome — see `readerLangChain`. */
	const browser = navigatorLangs();

	/**
	 * PRAYERS ARE THE ONE TYPE WHOSE EDITIONS DO NOT ALL HOLD EVERY ADDRESS,
	 * so they are the one type whose menu cannot be the corpus-wide list.
	 * `prayer.common.en-gb` is five prayers; offering it on the other
	 * twenty-three put a row in the menu that resolved straight back to
	 * `prayer.common.en` and changed nothing but the trigger's label. See
	 * `listPrayerEditions` for the rule and why it is address-scoped.
	 *
	 * `page.params.slug` is the prayer at `/preces/{slug}` and undefined at
	 * `/preces` itself, which is exactly the fork that helper takes.
	 */
	const typeEditions = $derived(
		ctx?.kind !== 'type'
			? []
			: ctx.type === 'prayer'
				? listPrayerEditions(page.params.slug)
				: listEditions(ctx.type)
	);

	/**
	 * ONE ROW PER LANGUAGE ACROSS BOTH WORKS, first work wins.
	 *
	 * The union rather than either list: `la` and `mg` have a Catechism and no
	 * Compendium, `hu`/`ro`/`sl`/`sv` the reverse, and the page carries
	 * whichever of the two a language has. Offering only the Catechism's eight
	 * would hide the four languages whose reader has a whole work here; the
	 * row's manifest is only ever read for its language and its display name,
	 * so which of the two provides it does not matter.
	 */
	const pairEditions = $derived.by(() => {
		if (ctx?.kind !== 'pair') return [];
		const byLang = new Map<string, WorkManifest>();
		for (const type of ctx.types) {
			for (const edition of listEditions(type)) {
				const lang = baseLang(edition.language);
				if (!byLang.has(lang)) byLang.set(lang, edition);
			}
		}
		return [...byLang.values()].sort((a, b) =>
			baseLang(a.language).localeCompare(baseLang(b.language))
		);
	});
	const documentGroup = $derived(ctx?.kind === 'document' ? getDocumentGroup(ctx.slug) : undefined);
	// A document's editions, sorted like `listEditions` (site/docs/addresses.md:
	// language then id) rather than however `Object.values` happens to order
	// the manifest map — with only two languages this rarely matters, but
	// staying consistent with the Bible/CCC/Compendium menus costs nothing.
	const documentEditions = $derived(
		documentGroup
			? Object.values(documentGroup.manifests)
					.filter((m): m is DocumentManifest => m !== undefined)
					.sort(
						(a, b) =>
							baseLang(a.language).localeCompare(baseLang(b.language)) || a.id.localeCompare(b.id)
					)
			: []
	);
	const contextEditions = $derived(
		ctx?.kind === 'document' ? documentEditions : ctx?.kind === 'pair' ? pairEditions : typeEditions
	);

	/**
	 * THE INTERFACE LANGUAGE, THEN THE BROWSER'S, THEN THE NEIGHBOURS.
	 *
	 * Every list above arrives sorted alphabetically by base language tag —
	 * `listEditions`' own rule, which `pairEditions` and `documentEditions`
	 * copy so the menus agree. That is a stable order and an arbitrary one: it
	 * put the Catechism's eight editions in the same sequence for every reader
	 * on earth, with Portuguese last of eight for the Portuguese one, and it is
	 * not even alphabetical by the NAME each row prints (`de` is "Deutsch",
	 * `mg` is "Malagasy").
	 *
	 * `readerLangChain` is what replaces it as the FIRST key, and the argument
	 * for each of its three tiers is written down there. Neither of the two it
	 * reads is new: `CONTENT_LANG_FALLBACK` is the table that already decides
	 * which edition this page RENDERS, and `navigator.languages` is the list
	 * `app.html` negotiated the chrome out of before this component existed.
	 * What is new is asking them in that order, so a reader whose interface
	 * language this work has no edition in is offered a language they actually
	 * told their browser about, rather than the one a table guessed for them.
	 *
	 * The alphabetical sorts stay exactly where they are and become the
	 * tie-break inside one language, which is what keeps the Bible's two
	 * English editions in `PREFERRED_EDITION`'s order.
	 */
	const editions = $derived(orderByLangChain(contextEditions, readerLangChain(i18n.lang, browser)));

	// The content store is the only source of truth for every context now —
	// no URL anywhere carries an edition, so there is nothing for it to
	// disagree with.
	// PRAYERS AGAIN: `workIdFor` answers what the reader PREFERS, and for every
	// other type that is also what the page renders. A reader who prefers
	// English (UK) on the Our Father is reading `prayer.common.en` — the only
	// English text there is — so a trigger reading "English (UK)" there was
	// naming a wording nothing on the page came from. `currentPrayerEditionId`
	// resolves the preference against this address the same way the route
	// resolves it against `byLang`.
	// The pair picker is choosing a LANGUAGE, and its rows are one work or the
	// other, so "current" is matched on the language rather than on a work id.
	const currentWorkId = $derived(
		ctx?.kind === 'pair'
			? editions.find((w) => baseLang(w.language) === content.catechismPairLang())?.id
			: ctx?.kind === 'type'
				? ctx.type === 'prayer'
					? currentPrayerEditionId(content.tagFor('prayer'), page.params.slug)
					: content.workIdFor(ctx.type)
				: ctx?.kind === 'document'
					? content.documentWorkIdFor(ctx.slug)
					: undefined
	);

	const currentEdition = $derived(editions.find((w) => w.id === currentWorkId));

	// Only the Bible is expected to ever carry more than one edition per
	// language — every other type has exactly one edition per language today,
	// which makes picking an "edition" there functionally picking a language.
	// The trigger reflects that: "English", not a document's own Latin-incipit
	// short title, which names the work rather than the reader's choice.
	const editionStyle = $derived(ctx?.kind === 'type' && ctx.type === 'bible');
	const triggerLabel = $derived(
		currentEdition
			? editionStyle
				? currentEdition.short_title
				: languageDisplayName(currentEdition.language)
			: t('edition.select')
	);

	const menu = new Menu();

	/**
	 * A SEARCH BOX ONCE THE LIST IS LONG ENOUGH TO SCROLL, and not before.
	 *
	 * This picker is contextual, so its length is too: three editions under
	 * `/scriptura`, two under `/doctores/summa`, and then eight, ten, twelve
	 * and twenty-four as the route moves to the Catechism, the Compendium, the
	 * `/catechismus` pair and the prayers. `FILTER_MIN_ROWS` is where a panel
	 * stops fitting on a phone; below it a box is one more thing to look past
	 * on the way to a list already entirely visible.
	 *
	 * The query resets when the panel closes rather than persisting: this menu
	 * re-renders against a different work on every navigation, so a query left
	 * behind would be a filter over a list the reader has not seen yet.
	 */
	let query = $state('');
	let filterEl: HTMLInputElement | undefined = $state();

	const showFilter = $derived(editions.length >= FILTER_MIN_ROWS);
	const visible = $derived(
		showFilter && query.trim()
			? editions.filter((edition) =>
					matchesQuery(editionSearchText(edition, languageDisplayName(edition.language)), query)
				)
			: editions
	);

	$effect(() => {
		if (menu.open) filterEl?.focus();
		else query = '';
	});

	function choose(workId: string) {
		if (!ctx) return;
		if (ctx.kind === 'document') content.setDocument(ctx.slug, workId);
		else if (ctx.kind === 'pair') choosePairLang(workId);
		else content.set(ctx.type, workId);
		menu.closeAndRefocus();
	}

	/**
	 * Picking a language on `/catechismus` sets EACH work that has one and
	 * CLEARS the other, rather than leaving a stale override behind. Clearing
	 * is what makes the absence readable: `catechismPairLang` looks for an
	 * explicit choice and finds only the one that could be made, so a reader
	 * choosing Hungarian gets the Hungarian Compendium and no Catechism column
	 * — where a leftover `ccc.en` override would have put an English one there.
	 */
	function choosePairLang(workId: string) {
		if (ctx?.kind !== 'pair') return;
		const lang = baseLang(
			editions.find((w) => w.id === workId)?.language ?? content.catechismPairLang()
		);
		for (const type of ctx.types) {
			const edition = listEditions(type).find((w) => baseLang(w.language) === lang);
			content.set(type, edition?.id ?? null);
		}
	}
</script>

<svelte:window onclick={menu.onWindowClick} />

{#if ctx && editions.length > 0}
	<div class="menu" bind:this={menu.containerEl}>
		<button
			type="button"
			bind:this={menu.triggerEl}
			class="menu-trigger wide"
			aria-haspopup="menu"
			aria-expanded={menu.open}
			aria-label={`${t('edition.label')}: ${triggerLabel}`}
			title={t('edition.label')}
			onclick={menu.toggle}
		>
			<!-- Text only, no glyph. The label already names the edition, and a
			     book icon in front of it said nothing the word "English" didn't —
			     while making the widest control in `ReadingBar` wider still, next
			     to three neighbours (bookmark, print, compare) whose icons ARE
			     their whole content. Those keep theirs; this is the one control in
			     the row that has something to spell out. -->
			<span class="trigger-label">{triggerLabel}</span>
		</button>
		{#if menu.open}
			<!-- A `<div>` wrapping a `<ul>`, not the bare `<ul>` this used to be:
			     an input is not a list item, so `role="menu"` moves down onto the
			     list. The wrapper is used at every length — a three-edition Bible
			     menu with no box in it is the same box with one child. -->
			<div class="panel-surface menu-panel menu-panel-filtered" use:keepInViewport>
				{#if showFilter}
					<input
						type="search"
						class="menu-filter"
						bind:this={filterEl}
						bind:value={query}
						onkeydown={menu.onPanelKeydown}
						placeholder={t('edition.filter')}
						aria-label={t('edition.filter')}
					/>
				{/if}
				{#if visible.length === 0}
					<p class="menu-empty">{t('menu.noMatches')}</p>
				{:else}
					<ul
						class="menu-list"
						role="menu"
						aria-label={t('edition.label')}
						onkeydown={menu.onPanelKeydown}
					>
						{#each visible as edition (edition.id)}
							{@const current = edition.id === currentWorkId}
							<li role="none">
								<button
									type="button"
									role="menuitemradio"
									aria-checked={current}
									class="menu-item"
									class:current
									onclick={() => choose(edition.id)}
								>
									<span class="menu-item-main">
										{#if current}<Icon name="check" />{/if}
										<span
											>{editionStyle ? edition.title : languageDisplayName(edition.language)}</span
										>
										<!-- The FULL tag, not `baseLang`: `prayer.common.en` and
								     `prayer.common.en-gb` are both "EN" under the bare subtag, so
								     the badge that exists to tell rows apart printed the same
								     two letters beside "English" and "English (UK)". -->
										<span class="edition-lang">{edition.language.toUpperCase()}</span>
									</span>
									{#if editionStyle}
										<span class="menu-item-meta"
											>{edition.short_title} &middot; {copyrightLabel(edition)}</span
										>
									{/if}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.trigger-label {
		font-size: 0.85rem;
		max-width: 10rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
