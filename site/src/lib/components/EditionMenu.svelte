<!--
	Version/edition selector: which edition of the work currently in view the
	reader is reading — including an edition in another language (distinct
	from the UI language switch, `LanguageMenu`; see content.svelte.ts).

	Contextual by route: lists Bible editions under `/scriptura`, Catechism
	editions under `/catechismus`, Compendium editions under `/catechismus/compendium`, prayer
	collection editions under `/preces` (same one-canonical-work-per-language
	shape as the Compendium), this ONE document's editions under
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

	EVERY URL IS EDITION-FREE NOW (docs/decisions.md #2). This used to be the
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
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { keepInViewport } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentManifest } from '$lib/types';

	type Context = { kind: 'type'; type: WorkTypeKey } | { kind: 'document'; slug: string };

	function context(pathname: string): Context | undefined {
		if (pathname === '/scriptura' || pathname.startsWith('/scriptura/')) {
			return { kind: 'type', type: 'bible' };
		}
		if (pathname === '/catechismus' || pathname.startsWith('/catechismus/')) {
			return { kind: 'type', type: 'catechism' };
		}
		if (pathname === '/catechismus/compendium' || pathname.startsWith('/catechismus/compendium/')) {
			return { kind: 'type', type: 'compendium' };
		}
		if (pathname === '/preces' || pathname.startsWith('/preces/')) {
			return { kind: 'type', type: 'prayer' };
		}
		// The Summa's menu offers English and Latin and no Portuguese, which
		// is the work's permanent shape rather than a gap (docs/decisions.md
		// §Scope). `listEditions` is already language-agnostic, so the
		// menu needs nothing beyond being told this route has a work type.
		if (pathname === '/summa' || pathname.startsWith('/summa/')) {
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
	const documentGroup = $derived(ctx?.kind === 'document' ? getDocumentGroup(ctx.slug) : undefined);
	// A document's editions, sorted like `listEditions` (docs/decisions.md #1:
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
	const editions = $derived(ctx?.kind === 'document' ? documentEditions : typeEditions);

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
	const currentWorkId = $derived(
		ctx?.kind === 'type'
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

	function choose(workId: string) {
		if (!ctx) return;
		if (ctx.kind === 'document') content.setDocument(ctx.slug, workId);
		else content.set(ctx.type, workId);
		menu.closeAndRefocus();
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
			<ul
				class="menu-panel"
				use:keepInViewport
				role="menu"
				aria-label={t('edition.label')}
				onkeydown={menu.onPanelKeydown}
			>
				{#each editions as edition (edition.id)}
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
								<span>{editionStyle ? edition.title : languageDisplayName(edition.language)}</span>
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

<style>
	.trigger-label {
		font-size: 0.85rem;
		max-width: 10rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
