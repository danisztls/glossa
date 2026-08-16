<!--
	Version/edition selector: which edition of the work currently in view the
	reader is reading — including an edition in another language (distinct
	from the UI language switch, `LanguageMenu`; see content.svelte.ts).

	Contextual by route: lists Bible editions under `/bible`, Catechism
	editions under `/ccc`, Compendium editions under `/compendium`, this ONE
	document's editions under `/documents/{slug}`, and renders nothing
	anywhere else (`context()` below returns undefined for e.g. the home
	page, where no work is in view).

	DOCUMENTS ARE A THIRD SHAPE OF CONTEXT, NOT A FOURTH `WorkTypeKey`: the
	Bible/CCC/Compendium branches all resolve editions through
	`content.workIdFor(type)`/`listEditions(type)`, keyed by a fixed
	`WorkTypeKey` with a small, corpus-wide edition list. A document doesn't
	have "the" edition list — `/documents/lumen-gentium` and
	`/documents/gaudium-et-spes` each have their OWN EN/PT pair — so
	`context()` returns a `{ kind: 'document', slug }` variant instead, and
	every branch below that touches editions/the content store forks on
	`ctx.kind` to reach `getDocumentGroup(slug)`/`content.documentWorkIdFor`/
	`content.setDocument` instead (see `content.svelte.ts`'s docblock for why
	those are separate methods, not `workIdFor('document')`).

	EVERY URL IS EDITION-FREE NOW (docs/decisions.md #2). This used to be the
	one place with a fork in it: CCC and Compendium URLs named no edition, so
	picking one was a pure store write, while the Bible's reading route
	carried `/bible/{edition}/{book}/{chapter}` and had to *navigate* on a
	pick or the URL and the reader's choice would disagree. The Bible now
	embeds every edition at an edition-free address and renders whichever the
	store says, so that fork is gone and all four contexts behave alike:
	choosing an edition writes the preference and the open page re-renders in
	place, with no navigation at all.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { content, type WorkTypeKey } from '$lib/content.svelte';
	import { getDocumentGroup, listEditions, baseLang } from '$lib/corpus';
	import { copyrightLabel } from '$lib/copyright';
	import Icon from './Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentManifest } from '$lib/types';

	type Context = { kind: 'type'; type: WorkTypeKey } | { kind: 'document'; slug: string };

	function context(pathname: string): Context | undefined {
		if (pathname === '/bible' || pathname.startsWith('/bible/')) {
			return { kind: 'type', type: 'bible' };
		}
		if (pathname === '/ccc' || pathname.startsWith('/ccc/')) {
			return { kind: 'type', type: 'catechism' };
		}
		if (pathname === '/compendium' || pathname.startsWith('/compendium/')) {
			return { kind: 'type', type: 'compendium' };
		}
		// `/documents` itself (the library) has no single document in view —
		// same "renders nothing" behavior as the home page, hence `startsWith`
		// with the trailing slash rather than a bare prefix check. Both
		// `/documents/[slug]` and its nested `/documents/[slug]/[n]` set
		// `page.params.slug`, so one check covers both.
		if (pathname.startsWith('/documents/') && page.params.slug) {
			return { kind: 'document', slug: page.params.slug };
		}
		return undefined;
	}

	const ctx = $derived(context(page.url.pathname));

	const typeEditions = $derived(ctx?.kind === 'type' ? listEditions(ctx.type) : []);
	const documentGroup = $derived(ctx?.kind === 'document' ? getDocumentGroup(ctx.slug) : undefined);
	// A document's editions, sorted like `listEditions` (docs/decisions.md #1:
	// language then id) rather than however `Object.values` happens to order
	// the manifest map — with only two languages this rarely matters, but
	// staying consistent with the Bible/CCC/Compendium menus costs nothing.
	const documentEditions = $derived(
		documentGroup
			? Object.values(documentGroup.manifests)
					.filter((m): m is DocumentManifest => m !== undefined)
					.sort((a, b) => baseLang(a.language).localeCompare(baseLang(b.language)) || a.id.localeCompare(b.id))
			: []
	);
	const editions = $derived(ctx?.kind === 'document' ? documentEditions : typeEditions);

	// The content store is the only source of truth for every context now —
	// no URL anywhere carries an edition, so there is nothing for it to
	// disagree with.
	const currentWorkId = $derived(
		ctx?.kind === 'type'
			? content.workIdFor(ctx.type)
			: ctx?.kind === 'document'
				? content.documentWorkIdFor(ctx.slug)
				: undefined
	);

	const currentEdition = $derived(editions.find((w) => w.id === currentWorkId));

	let open = $state(false);
	let menuEl: HTMLDivElement | undefined = $state();
	let triggerEl: HTMLButtonElement | undefined = $state();

	function close() {
		open = false;
	}

	function choose(workId: string) {
		if (!ctx) return;
		if (ctx.kind === 'document') content.setDocument(ctx.slug, workId);
		else content.set(ctx.type, workId);
		close();
		triggerEl?.focus();
	}

	function onWindowClick(e: MouseEvent) {
		if (!open) return;
		if (menuEl && e.target instanceof Node && !menuEl.contains(e.target)) close();
	}

	function onPanelKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
			triggerEl?.focus();
		}
	}
</script>

<svelte:window onclick={onWindowClick} />

{#if ctx && editions.length > 0}
	<div class="menu" bind:this={menuEl}>
		<button
			type="button"
			bind:this={triggerEl}
			class="menu-trigger wide"
			aria-haspopup="menu"
			aria-expanded={open}
			aria-label={`${t('edition.label')}: ${currentEdition?.short_title ?? t('edition.select')}`}
			title={t('edition.label')}
			onclick={() => (open = !open)}
		>
			<Icon name="book-open" />
			<span class="trigger-label">{currentEdition?.short_title ?? t('edition.select')}</span>
		</button>
		{#if open}
			<ul class="menu-panel" role="menu" aria-label={t('edition.label')} onkeydown={onPanelKeydown}>
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
								<span>{edition.title}</span>
								<span class="edition-lang">{baseLang(edition.language).toUpperCase()}</span>
							</span>
							<span class="menu-item-meta"
								>{edition.short_title} &middot; {copyrightLabel(edition)}</span
							>
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

	.edition-lang {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0 0.3rem;
	}
</style>
