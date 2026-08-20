<script lang="ts">
	/**
	 * Table of contents for the reading sidebar (`.reading-aside`, app.css),
	 * shared by every route that has one: `/catechismus/[n]`,
	 * `/catechismus/caput/[n]`, `/compendium/[n]`,
	 * `/compendium/caput/[n]`, `/documenta/[slug]`.
	 * All four walk the same node shape — `CccNode`/`StructureNode` are
	 * literally the same type (`$lib/types.ts`) — parametrized by which
	 * flattened structure, which routing scheme, and (CCC/Compendium only)
	 * which kind-floor the caller passes in.
	 *
	 * THIS FILE MERGES TWO COMPONENTS TWO AGENTS BUILT IN PARALLEL
	 * (`StructureSidebarToc`, for CCC/Compendium, and `DocumentToc`, for
	 * documents) THAT TURNED OUT TO SOLVE THE SAME PROBLEM. Neither was a
	 * strict subset of the other; merging meant picking a winner on each
	 * point where they'd actually diverged, not just deleting one file:
	 *
	 *  - ANCHOR MODE. `/documents/[slug]` is the whole document on one
	 *    page, so its TOC has to link to `#s{n}` fragments instead of a
	 *    separate route. Genuine requirement, kept as `linkMode="anchor"`
	 *    below — `hrefFor` (structureToc.ts) is the one place that decides
	 *    between that and `${basePath}/{n}`.
	 *
	 *  - WHICH NODE KINDS RENDER. The CCC/Compendium version rendered only
	 *    prologue/part/section/chapter — a "chapter-sized" floor measured
	 *    against the real corpus at 32-33 nodes, small enough to show fully
	 *    expanded in a 17rem column forever. The document version rendered
	 *    every kind, unfiltered, because a document's depth and size vary
	 *    too much for any one floor to be universal. Both are real
	 *    requirements, not an oversight either side — kept as the optional
	 *    `outlineKinds` prop (`outlineChildren`, structureToc.ts): pass
	 *    `OUTLINE_KINDS` for the CCC/Compendium floor, omit it for a
	 *    document's full tree.
	 *
	 *  - HOW THE TREE IS WALKED. Follows directly from the point above: the
	 *    CCC/Compendium version walked `node.children` recursively (nested
	 *    `<ol>` per level) because pruned-out kinds would otherwise leave
	 *    gaps in a flat depth count; the document version, never pruning
	 *    anything, could get away with trusting the flat `depth` its caller
	 *    already computed and skip the recursion. Once both share one
	 *    `outlineKinds`-aware walk, that shortcut is no longer available OR
	 *    needed — recursing via `.children` is correct for both, and
	 *    documents pick up genuinely nested `<ol>`s along the way, which is
	 *    the semantically correct shape for a tree and reads as one to
	 *    assistive tech, unlike a flat list whose nesting was only ever a
	 *    CSS indent.
	 *
	 *  - WHICH ROW IS "CURRENT". The CCC/Compendium version distinguished
	 *    the exact matching row (`isCurrent`: solid highlight,
	 *    `aria-current="page"`) from its ancestors (`onPath`: accent text
	 *    only); the document version marked every ancestor identically, no
	 *    row more so than another. The distinction wins here (`rowState`,
	 *    structureToc.ts) — a document's tree runs deeper than the
	 *    CCC/Compendium's fixed floor (part → chapter → article → sub), so
	 *    knowing *which* ancestor is the actual leaf matters more on a
	 *    document's sidebar, not less.
	 *
	 *  - THE ORDINAL MARKER. The CCC/Compendium version showed
	 *    `kindOrdinalLabel`'s abbreviated, kind-disambiguated form
	 *    ("Ch. 3", "Part 1") instead of a bare number, precisely so a tree
	 *    several levels deep doesn't show "1." at every level with nothing
	 *    to tell them apart (see that function's own docblock). The document
	 *    version showed `displayTitle`'s bare ordinal ("3.") for every kind.
	 *    Picking the label alone would have silently dropped numbering for
	 *    `sub` nodes — a document's fifth heading level
	 *    (`read/+page.svelte`'s `headingTag`) — since `kindOrdinalLabel` has
	 *    no "Sub" entry. `marker()` (structureToc.ts) keeps both: the label
	 *    where one exists, the bare ordinal where it doesn't.
	 *
	 *  - VISIBLE HEADING vs. ARIA-ONLY LABEL. The document version rendered
	 *    a visible "Table of Contents" heading above the list; the
	 *    CCC/Compendium version had no visible label at all, only an
	 *    `aria-label` on the `<nav>` (duplicated onto the wrapping `<aside>`
	 *    by every CCC/Compendium route, for reasons lost to history — two
	 *    nested landmarks both announcing the same string). The visible
	 *    heading is a plain usability win for sighted readers too, not just
	 *    assistive tech, so it's kept for all three corpora; the `<nav>` now
	 *    takes its accessible name from that one heading via
	 *    `aria-labelledby` instead of a second, separate `aria-label`, and
	 *    the callers' `<aside>` wrappers no longer set `role`/`aria-label`
	 *    of their own (see the route files' `<aside class="reading-aside">`
	 *    — this component is now the sidebar's one landmark).
	 *
	 *  - SCROLL-INTO-VIEW. The CCC/Compendium version scrolled the reader's
	 *    current row into view within the aside's own scroll container on
	 *    arrival; the document version didn't. Kept, unconditionally: gated
	 *    on `currentN !== undefined`, which is already false throughout
	 *    `linkMode="anchor"` (nothing is "current" when the whole document
	 *    is already on screen), so nothing needed to change to extend it —
	 *    and a document's unfiltered, unfloor'd tree can run considerably
	 *    longer than the CCC/Compendium's capped 32-33 rows, so keeping the
	 *    active row in view matters at least as much here.
	 *
	 *  - ROW FONT. The document version set its rows in the serif reading
	 *    face; the CCC/Compendium version left them at the inherited sans
	 *    (`body`'s default, app.css). Sans wins: `.reading-aside` is UI
	 *    chrome, not `.reading-text` — the breadcrumb and every other control
	 *    in the reading layout is sans by the same inheritance, and this
	 *    sidebar reads as one more control among them, not as a second body
	 *    of prose next to the one `--reading-scale` actually governs.
	 *
	 *  - UNLINKED-ROW TOOLTIP. The document version put
	 *    `title="No section number in this corpus"` on an unaddressable
	 *    row's `<span>`; the CCC/Compendium version didn't. Kept for all
	 *    three — cheap, and there's no reason to withhold it from two of the
	 *    three corpora that can hit the same null-bound case
	 *    (docs/corpus-schema.md).
	 */
	import { browser } from '$app/environment';
	import type { StructureNode } from '$lib/types';
	import { displayTitle } from '$lib/titles';
	import { hrefFor, marker, outlineChildren, rowState, type LinkMode } from './structureToc';

	interface Props {
		/** `flattenCccStructure`/`flattenCompendiumStructure`/
		    `flattenDocumentStructure`'s raw return. Only the depth-0 entries
		    are read directly, to seed the walk below as roots — everything
		    under them is walked via `node.children`, which `flattenTree`
		    (corpus.ts) populates on the SAME node objects it flattened, not
		    copies, so the two views of the tree never disagree. */
		structure: { node: StructureNode; depth: number }[];
		/** Paragraph (CCC) / question (Compendium) / section (document)
		    number the reader is currently on. Nothing is marked current when
		    this is undefined — same "degrade, don't fabricate" posture as
		    the rest of the site, rather than guessing a position. Always
		    undefined on `linkMode="anchor"`, where the whole document is
		    "current" and no one row is more so than another. */
		currentN: number | undefined;
		lang: string;
		/** Rendered as both the sidebar's visible heading and its `<nav>`'s
		    accessible name (`aria-labelledby`) — one string doing both jobs.
		    The existing `ccc.tableOfContents`/`compendium.tableOfContents`/
		    `document.tableOfContents` i18n keys already cover it. */
		heading: string;
		/** `/ccc`, `/compendium`, or `/documents/{slug}` — combined with a
		    node's own first paragraph/question/section number to build its
		    href. Unused, may be omitted, when `linkMode` is `"anchor"`. */
		basePath?: string;
		/** `"route"` (default): each row links to its own page,
		    `${basePath}/{n}`. `"anchor"`: each row links to `#s{n}` on the
		    current page instead — see the docblock's ANCHOR MODE note. */
		linkMode?: LinkMode;
		/** Restricts which child kinds are descended into (and rendered) at
		    every level, along with everything beneath a pruned-out child.
		    Pass `OUTLINE_KINDS` (structureToc.ts) for the CCC/Compendium
		    floor; omit it to render every kind present in the tree, which is
		    what a document wants (see the docblock's WHICH NODE KINDS
		    RENDER note). */
		outlineKinds?: Set<StructureNode['kind']>;
	}

	let {
		structure,
		currentN,
		lang,
		heading,
		basePath,
		linkMode = 'route',
		outlineKinds
	}: Props = $props();

	const roots = $derived(structure.filter((row) => row.depth === 0).map((row) => row.node));

	const CURRENT_ID = 'reading-toc-current';
	const HEADING_ID = 'reading-toc-heading';

	// Scrolls the reader's current row into view within the aside's OWN
	// scroll container (`.reading-aside` is `overflow-y: auto` — app.css)
	// whenever they land on a new page. Browser-only: during prerendering
	// there is no scroll container to act on, and every route this
	// component serves still renders a complete, navigable tree without it.
	$effect(() => {
		if (!browser || currentN === undefined) return;
		document.getElementById(CURRENT_ID)?.scrollIntoView({ block: 'nearest' });
	});
</script>

{#snippet level(nodes: StructureNode[])}
	<ol class="sidebar-toc-list toc-level">
		{#each nodes as node (node.title + node.paragraphs.join('-'))}
			{@const dt = displayTitle(node, lang)}
			{@const label = marker(node, lang)}
			{@const anchor = node.paragraphs[0]}
			{@const kids = outlineChildren(node, outlineKinds)}
			{@const state = rowState(node, currentN, outlineKinds)}
			<li class={`kind-${node.kind}`} class:on-path={state.onPath}>
				{#if Number.isFinite(anchor)}
					<a
						id={state.isCurrent ? CURRENT_ID : undefined}
						href={hrefFor(anchor as number, linkMode, basePath)}
						class:current={state.isCurrent}
						aria-current={state.isCurrent ? 'page' : undefined}
					>
						{#if label}<span class="kind-label">{label}</span>{/if}
						{dt.title}
					</a>
				{:else}
					<!-- Null bounds: real structure the corpus knows about but no
					     paragraph/question/section number addresses — text, not a
					     link, same convention as `/ccc/+page.svelte`,
					     `/compendium/+page.svelte` and `/documents/[slug]/+page.svelte`'s
					     own tables of contents. -->
					<span class="row-title unlinked" title="No section number in this corpus">
						{#if label}<span class="kind-label">{label}</span>{/if}
						{dt.title}
					</span>
				{/if}
				<!-- ONLY THE READER'S OWN BRANCH IS EXPANDED. A row's children
				     render when that row contains the current position — which
				     covers both the ancestors leading down to it and the current
				     row itself, so the reader always sees the level they are on
				     plus what is inside it, and nothing from branches they are
				     not in.

				     This replaces rendering the whole tree at every level. That
				     was defensible for the CCC and Compendium, whose trees were
				     measured at 32-33 rows, and wrong for documents, which carry
				     no such floor: an unfiltered four-level encyclical tree ran
				     to hundreds of rows in a 17rem column, burying the handful
				     that say where the reader actually is.

				     Collapsed branches are not hidden content — every one of
				     them is still reachable, because its own top-level ancestor
				     is still a link, and following it expands that branch in
				     turn. Nothing needs client-side disclosure state, which is
				     also why this keeps working with JavaScript off. -->
				{#if kids.length > 0 && state.onPath}
					{@render level(kids)}
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<nav aria-labelledby={HEADING_ID} data-link-preview="off">
	<h2 id={HEADING_ID} class="sidebar-toc-heading">{heading}</h2>
	{@render level(roots)}
</nav>

<style>
	nav {
		font-size: 0.85rem;
	}

	/* Compounds naturally with each level of real DOM nesting (`.toc-level`
	   inside `.toc-level` inside `.toc-level` …), so a document's deeper
	   tree indents progressively without this component tracking a depth
	   number anywhere. */
	.toc-level .toc-level {
		margin-inline-start: 0.6rem;
		padding-inline-start: 0.65rem;
		border-inline-start: 1px solid var(--color-border);
	}

	a,
	.unlinked {
		display: block;
		text-decoration: none;
		color: var(--color-text);
		padding: 0.2rem 0.35rem;
		border-radius: 0.3rem;
		line-height: 1.35;
	}

	.unlinked {
		color: var(--color-text-muted);
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	.kind-part > a,
	.kind-part > .unlinked,
	.kind-prologue > a,
	.kind-prologue > .unlinked,
	.kind-chapter > a,
	.kind-chapter > .unlinked {
		font-weight: 700;
	}

	.kind-section > a,
	.kind-section > .unlinked {
		font-weight: 600;
	}

	.kind-sub > a,
	.kind-sub > .unlinked {
		color: var(--color-text-muted);
	}

	/* Set in the sans face at a smaller size, matching `/ccc/+page.svelte`'s
	   own `.kind-label` treatment, so it reads as a label attached to the
	   title rather than as the title's first word — used uniformly for
	   `kindOrdinalLabel`'s abbreviated form AND `marker()`'s bare-ordinal
	   fallback (see the docblock's THE ORDINAL MARKER note), so a "3." on a
	   document's unlabeled `sub` row gets the same small, muted treatment a
	   "Ch. 3" gets everywhere else rather than looking like stray text. */
	.kind-label {
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.72em);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		margin-right: 0.4em;
		white-space: nowrap;
	}

	/* Ancestors of the reader's current row (not the row itself — `.current`
	   below wins on those) pick up the accent as a lightweight "you are
	   somewhere under here" cue, cheaper than a second visual language. */
	.on-path > a,
	.on-path > .unlinked {
		color: var(--color-accent);
	}

	/* Declared after `.on-path > a` so its background/color wins the cascade
	   on a row that's both on the path and the current one (every ancestor
	   qualifies for both simultaneously — see `rowState` in structureToc.ts). */
	a.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		font-weight: 600;
	}
</style>
